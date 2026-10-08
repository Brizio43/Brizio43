import {DatabaseSync} from 'node:sqlite';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {validateQuiz,questionType,isCorrect} from './quiz.js';
import {portableQuiz} from './share.js';

const hash=value=>createHash('sha256').update(value).digest('hex');
class APIError extends Error{constructor(status,message){super(message);this.status=status;}}
export function createCompetitionStore(filename){
 if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);
 db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS competitions(id TEXT PRIMARY KEY,quiz TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,competition TEXT NOT NULL REFERENCES competitions(id),name TEXT NOT NULL,name_key TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,started INTEGER NOT NULL,finished INTEGER,answers TEXT NOT NULL,UNIQUE(competition,name_key));`);
 const competition=id=>{const row=db.prepare('SELECT * FROM competitions WHERE id=?').get(id);if(!row)throw new APIError(404,'Competição não encontrada. Confira o link.');return {...row,quiz:JSON.parse(row.quiz)};};
 const attempt=(id,token)=>{if(!token)throw new APIError(401,'Entre na competição para participar.');const row=db.prepare('SELECT * FROM attempts WHERE competition=? AND token_hash=?').get(id,hash(token));if(!row)throw new APIError(401,'Participação não encontrada neste navegador.');return {...row,answers:JSON.parse(row.answers)};};
 const correction=(q,answer)=>({submittedAnswer:answer,isCorrect:isCorrect(q,answer),reference:questionType(q)==='multiple'?q.options[q.answer]:q.answerText,explanation:q.explanation,question:q});
 const summary=(comp,row)=>{
  const questions=comp.quiz.questions,graded=questions.filter(q=>questionType(q)!=='descriptive').length;
  const correct=questions.filter((q,i)=>row.answers[i]!==null&&isCorrect(q,row.answers[i])===true).length;
  const answered=row.answers.filter(a=>a!==null).length;
  return {attemptId:row.id,name:row.name,correct,total:graded,answered,blank:questions.length-answered,descriptive:questions.filter((q,i)=>questionType(q)==='descriptive'&&row.answers[i]!==null).length,points:correct*10,percentage:graded?Math.round(correct/graded*100):null,durationMs:row.finished===null?null:row.finished-row.started};
 };
 const leaderboard=id=>{const comp=competition(id);return db.prepare('SELECT * FROM attempts WHERE competition=? AND finished IS NOT NULL').all(id).map(row=>summary(comp,{...row,answers:JSON.parse(row.answers)})).sort((a,b)=>b.points-a.points||a.durationMs-b.durationMs||a.attemptId.localeCompare(b.attemptId)).map((row,i)=>({...row,rank:i+1}));};
 return {
  close:()=>db.close(),
  create(quiz){
   if(!validateQuiz(quiz)||quiz.title.length>120||quiz.questions.length>2000)throw new APIError(400,'Quiz inválido. Revise as perguntas antes de criar a competição.');
   const clean=portableQuiz(quiz);
   if(clean.questions.some(q=>q.prompt.length>50000||(q.answerText?.length||0)>50000||(q.hint?.length||0)>30000||q.options?.some(o=>o.length>30000)))throw new APIError(400,'Uma questão excede o tamanho permitido.');
   if(!clean.questions.some(q=>questionType(q)!=='descriptive'))throw new APIError(400,'Inclua ao menos uma questão objetiva para pontuar a competição.');
   const id=randomUUID();db.prepare('INSERT INTO competitions VALUES(?,?,?)').run(id,JSON.stringify(clean),Date.now());return this.get(id);
  },
  get(id){const comp=competition(id);return {id,title:comp.quiz.title,subject:comp.quiz.subject,questions:comp.quiz.questions.map(q=>({type:questionType(q),prompt:q.prompt,...(q.options?{options:q.options}:{}),hint:q.hint||'',explanation:''})),participants:db.prepare('SELECT count(*) AS count FROM attempts WHERE competition=?').get(id).count};},
  join(id,name){const comp=competition(id);if(typeof name!=='string'||!name.trim()||name.trim().length>40)throw new APIError(400,'Escolha um apelido entre 1 e 40 caracteres.');
   if(db.prepare('SELECT count(*) AS count FROM attempts WHERE competition=?').get(id).count>=1000)throw new APIError(409,'Esta competição atingiu o limite de participantes.');
   const token=randomBytes(32).toString('hex'),attemptId=randomUUID(),startedAt=Date.now();
   try{db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?,?,NULL,?)').run(attemptId,id,name.trim(),name.trim().toLocaleLowerCase('pt-BR'),hash(token),startedAt,JSON.stringify(Array(comp.quiz.questions.length).fill(null)));}
   catch(e){if(String(e.message).includes('UNIQUE'))throw new APIError(409,'Esse apelido já está participando. Use outro ou retome no navegador em que entrou.');throw e;}
   return {token,attemptId,startedAt};
  },
  restore(id,token){const comp=competition(id),row=attempt(id,token);return {attemptId:row.id,name:row.name,startedAt:row.started,finished:row.finished!==null,answers:row.answers,corrections:row.answers.map((answer,i)=>answer===null?null:correction(comp.quiz.questions[i],answer)),summary:summary(comp,row)};},
  answer(id,token,index,value){const comp=competition(id),row=attempt(id,token);
   if(row.finished!==null)throw new APIError(409,'Esta participação já foi finalizada.');
   if(!Number.isInteger(index)||index<0||index>=comp.quiz.questions.length)throw new APIError(400,'Questão inválida.');
   const q=comp.quiz.questions[index];
   if(row.answers[index]!==null)return correction(q,row.answers[index]);
   if(questionType(q)==='multiple'?(!Number.isInteger(value)||value<0||value>3):(typeof value!=='string'||!value.trim()||value.length>5000))throw new APIError(400,'Informe uma resposta válida.');
   row.answers[index]=typeof value==='string'?value.trim():value;
   db.prepare('UPDATE attempts SET answers=? WHERE id=?').run(JSON.stringify(row.answers),row.id);
   return {...correction(q,row.answers[index]),points:isCorrect(q,row.answers[index])===true?10:0};
  },
  finish(id,token){const comp=competition(id),row=attempt(id,token);if(row.finished===null){row.finished=Date.now();db.prepare('UPDATE attempts SET finished=? WHERE id=?').run(row.finished,row.id);}
   return {summary:summary(comp,row),reviews:comp.quiz.questions,answers:row.answers,leaderboard:leaderboard(id)};
  },
  leaderboard
 };
}

async function readJSON(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2_000_000)throw new APIError(413,'O quiz excede o limite de 2 MB.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw new APIError(400,'Dados inválidos.');}}
export function competitionHandler(store){return async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const path=new URL(req.url,'http://localhost').pathname;
 if(!path.startsWith('/api/'))return false;
 try{
  if(path==='/api/health'&&req.method==='GET'){send(200,{available:true});return true;}
  if(path==='/api/competitions'&&req.method==='POST'){send(201,store.create((await readJSON(req)).quiz));return true;}
  const match=path.match(/^\/api\/competitions\/([a-f0-9-]{36})(?:\/(join|attempt|answer|finish|leaderboard))?$/);
  if(!match)throw new APIError(404,'Rota não encontrada.');
  const [,id,action]=match,token=req.headers.authorization?.replace(/^Bearer /,'');let result;
  if(!action&&req.method==='GET')result=store.get(id);
  else if(action==='leaderboard'&&req.method==='GET')result={entries:store.leaderboard(id)};
  else if(action==='join'&&req.method==='POST')result=store.join(id,(await readJSON(req)).name);
  else if(action==='attempt'&&req.method==='GET')result=store.restore(id,token);
  else if(action==='answer'&&req.method==='POST'){const body=await readJSON(req);result=store.answer(id,token,body.index,body.answer);}
  else if(action==='finish'&&req.method==='POST')result=store.finish(id,token);
  else throw new APIError(405,'Operação não disponível.');
  send(200,result);
 }catch(e){send(e.status||500,{error:e.status?e.message:'Não foi possível concluir a operação. Tente novamente.'});}
 return true;
};}
