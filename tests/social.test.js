import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {encodeQuiz,decodeQuiz,portableQuiz} from '../share.js';
import {rewardFor,addReward} from '../rewards.js';
import {sample} from '../quiz.js';
import {createCompetitionStore,competitionHandler} from '../competition-server.js';

test('compartilhamento preserva enunciados inteiros, respostas e dicas sem duplicar',async()=>{
 const quiz=structuredClone(sample);quiz.questions.push({...quiz.questions[0]});quiz.questions[1].hint='Faça uma proporção.';
 assert.deepEqual(await decodeQuiz(await encodeQuiz(quiz)),portableQuiz(quiz));
 await assert.rejects(()=>decodeQuiz('link-invalido'),/Não foi possível/);
});
test('um acerto dá selo, brinde e 10 XP sem multiplicar o prêmio ao revisitar',()=>{
 const reward=rewardFor('run',sample.questions[0],0);let collection=addReward([],reward);
 collection=addReward(collection,reward);assert.equal(collection.length,1);assert.equal(reward.points,10);assert.ok(reward.badge&&reward.gift);
 assert.equal(addReward(collection,rewardFor('new-run',sample.questions[0],0)).length,2);
});
test('ranking centralizado calcula pontos no servidor, protege respostas e persiste após reinício',()=>{
 const directory=mkdtempSync(join(tmpdir(),'quiz-ranking-')),filename=join(directory,'ranking.sqlite');let store=createCompetitionStore(filename);
 try{
  const comp=store.create(sample);assert.equal(comp.questions[0].answer,undefined);assert.equal(comp.questions[0].explanation,'');
  const ana=store.join(comp.id,'Ana'),bruno=store.join(comp.id,'Bruno');
  assert.throws(()=>store.restore(comp.id,'outro-token'),e=>e.status===401);
  assert.throws(()=>store.join(comp.id,'ana'),e=>e.status===409);
  assert.equal(store.answer(comp.id,ana.token,0,1).isCorrect,true);
  assert.equal(store.answer(comp.id,ana.token,0,0).submittedAnswer,1);
  store.answer(comp.id,ana.token,1,2);store.finish(comp.id,ana.token);
  const wrong=store.answer(comp.id,bruno.token,0,0);assert.equal(wrong.isCorrect,false);assert.equal(wrong.reference,'Marte');
  store.answer(comp.id,bruno.token,1,2);const result=store.finish(comp.id,bruno.token);
  assert.equal(result.summary.blank,1);assert.equal(result.summary.points,10);assert.equal(result.leaderboard[0].name,'Ana');assert.equal(result.leaderboard[0].points,20);
  assert.equal(store.finish(comp.id,bruno.token).leaderboard.length,2);
  assert.throws(()=>store.answer(comp.id,bruno.token,2,2),e=>e.status===409);
  store.close();store=createCompetitionStore(filename);assert.equal(store.leaderboard(comp.id).length,2);assert.equal(store.restore(comp.id,ana.token).finished,true);
 }finally{store.close();rmSync(directory,{recursive:true,force:true});}
});
test('API responde pelos endpoints de convite, participação e ranking',async()=>{
 const store=createCompetitionStore(':memory:'),handler=competitionHandler(store),server=createServer(async(req,res)=>{if(!await handler(req,res)){res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 try{
  const created=await fetch(base+'/api/competitions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quiz:sample})});assert.equal(created.status,201);const comp=await created.json();
  const unauthorized=await fetch(base+'/api/competitions/'+comp.id+'/attempt');assert.equal(unauthorized.status,401);
  const joined=await fetch(base+'/api/competitions/'+comp.id+'/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Participante'})});assert.equal(joined.status,200);const {token}=await joined.json();
  const headers={'Content-Type':'application/json',Authorization:'Bearer '+token};
  const answer=await fetch(base+'/api/competitions/'+comp.id+'/answer',{method:'POST',headers,body:JSON.stringify({index:0,answer:1,points:9999})});assert.equal((await answer.json()).points,10);
  const finished=await fetch(base+'/api/competitions/'+comp.id+'/finish',{method:'POST',headers,body:'{}'});assert.equal((await finished.json()).summary.points,10);
  const ranked=await fetch(base+'/api/competitions/'+comp.id+'/leaderboard');assert.equal((await ranked.json()).entries[0].points,10);
 }finally{await new Promise(resolve=>server.close(resolve));store.close();}
});
