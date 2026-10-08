import {validateQuiz} from './quiz.js';
import {groupedQuestions} from './quiz-session.js';
export function portableQuiz(quiz){
 return {title:quiz.title,subject:quiz.subject||'',questions:groupedQuestions(quiz.questions).map(q=>{
  const {type,prompt,options,answer,answerText,hint,explanation}=q;
  return {type:type||'multiple',prompt,options,answer,answerText,hint,explanation};
 })};
}
async function transform(bytes,stream,max=2_000_000){
 const reader=new Blob([bytes]).stream().pipeThrough(stream).getReader();let length=0;const chunks=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>max)throw Error('Este quiz é grande demais para um link. Use a exportação em arquivo.');chunks.push(value);}}finally{await reader.cancel();}
 const result=new Uint8Array(length);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
export async function encodeQuiz(quiz){
 const data=portableQuiz(quiz);if(!validateQuiz(data))throw Error('Revise as questões antes de compartilhar.');
 const raw=new TextEncoder().encode(JSON.stringify(data));if(raw.length>2_000_000)throw Error('Este quiz é grande demais para compartilhar por link.');
 const bytes=await transform(raw,new CompressionStream('gzip'));
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 const code=btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 if(code.length>100000)throw Error('Este quiz é grande demais para um link. Use a exportação em arquivo.');
 return code;
}
export async function decodeQuiz(code){
 if(typeof code!=='string'||!code.length||code.length>100000||!/^[\w-]+$/.test(code))throw Error('Link de quiz inválido.');
 try{
  const bytes=Uint8Array.from(atob(code.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const data=JSON.parse(new TextDecoder().decode(await transform(bytes,new DecompressionStream('gzip'))));
  if(!validateQuiz(data))throw Error();return portableQuiz(data);
 }catch{throw Error('Não foi possível abrir este quiz. Peça um novo link ou importe o arquivo JSON.');}
}
