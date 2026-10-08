import {normalizeAnswer,questionType} from './quiz.js';
import {groupedQuestions,exerciseTypes} from './quiz-session.js';
const normalizeText=text=>String(text??'').replace(/\s+/g,' ').trim();
const stop=new Set('como para pela pelo pelas pelos entre sobre quando onde uma umas uns esse essa isso este esta são suas seus mais muito também porque assim dos das que com não'.split(' '));
const words=text=>[...text.matchAll(/\p{L}[\p{L}-]{2,}/gu)].filter(m=>!stop.has(m[0].toLocaleLowerCase('pt-BR')));
function sourceSentences(text){
  // OCR wraps a sentence onto several lines. Semicolons and length are not boundaries.
  const seen=new Set();
  return normalizeText(text).split(/(?<=[.!?…])\s+/).filter(sentence=>{
    const key=normalizeAnswer(sentence);
    if(!key||seen.has(key))return false;
    seen.add(key);return true;
  });
}
export function generateAlternatives(correct,text='',position=0){
  const answerText=String(correct??'').trim();
  if(!answerText)throw Error('Informe a resposta correta antes de gerar as alternativas.');
  const candidates=/\s/.test(answerText)?sourceSentences(text):words(normalizeText(text)).map(m=>m[0]);
  const seen=new Set([normalizeAnswer(answerText)]),options=[];
  const fallback=['O texto não informa esse termo','Não há termo correspondente','A informação foi omitida','Nenhuma informação do material corresponde'];
  for(const candidate of [...candidates,...fallback]){
    const key=normalizeAnswer(candidate);
    if(!key||seen.has(key))continue;
    seen.add(key);options.push(candidate);
    if(options.length===3)break;
  }
  const answer=((position%4)+4)%4;
  options.splice(answer,0,answerText);
  return {options,answer};
}
function questionFromSentence(sentence,type,text,position){
  const common={type,explanation:sentence,source:sentence,generated:true};
  if(type==='descriptive')return {...common,prompt:'Explique com suas palavras a informação deste trecho: “'+sentence+'”',answerText:sentence,hint:'Identifique a ideia principal e explique como os conceitos do trecho se relacionam. Evite apenas copiar a frase.'};
  const match=words(sentence).sort((a,b)=>b[0].length-a[0].length)[0]||[...sentence.matchAll(/\S+/g)][0];
  const answer=match[0],masked=sentence.slice(0,match.index)+'_____'+sentence.slice(match.index+answer.length);
  const hint=`Procure a palavra que começa com “${answer[0]}” e tem ${answer.length} caracteres. Considere o sentido da frase.`;
  if(type==='fill')return {...common,prompt:'Complete a frase de acordo com o material: '+masked,answerText:answer,hint};
  return {...common,prompt:'Qual alternativa completa o trecho do material? '+masked,...generateAlternatives(answer,text,position),hint};
}
// Each distinct source sentence receives exactly one exercise type.
export function questionsFromText(text){
  const sentences=sourceSentences(text),content=sentences.join(' ');
  return groupedQuestions(sentences.map((sentence,i)=>questionFromSentence(sentence,exerciseTypes[i%exerciseTypes.length],content,i)));
}
export function changeQuestionType(question,type,text='',position=0){
  if(!exerciseTypes.includes(type))throw Error('Tipo de exercício inválido.');
  const {options,answer,answerText,...common}=question;
  if(question.generated&&normalizeAnswer(question.source))return {...common,...questionFromSentence(normalizeText(question.source),type,text||question.source,position)};
  const correct=questionType(question)==='multiple'?options[answer]:answerText;
  return {...common,type,...(type==='multiple'?(correct?.trim()?generateAlternatives(correct,text,position):{options:['','','',''],answer:0}):{answerText:correct||''})};
}

let library;
function loadOCR() {
  if (globalThis.Tesseract) return Promise.resolve(globalThis.Tesseract);
  if (!library) library = new Promise((resolve,reject) => {
    const script=document.createElement('script');
    script.src='./vendor/ocr/tesseract.min.js';
    script.onload=()=>resolve(globalThis.Tesseract);
    script.onerror=()=>{script.remove();library=null;reject(Error('Não foi possível carregar o reconhecimento. Verifique sua conexão ou transcreva o conteúdo abaixo.'));};
    document.head.append(script);
  });
  return library;
}
export async function recognizeImage(file, onProgress, signal) {
  const OCR = await loadOCR();
  if (signal.aborted) throw new DOMException('Cancelado', 'AbortError');
  let worker;
  const abort=()=>{worker?.terminate().catch(()=>{});};
  signal.addEventListener('abort',abort,{once:true});
  try {
    worker=await OCR.createWorker('por',1,{
      workerPath:new URL('./vendor/ocr/worker.min.js',import.meta.url).href,
      corePath:new URL('./vendor/ocr/tesseract-core-lstm.wasm.js',import.meta.url).href,
      langPath:new URL('./vendor/ocr/',import.meta.url).href,
      logger:m=>{if(!signal.aborted)onProgress(m.status==='recognizing text'?Math.round(m.progress*100):null);}
    });
    if(signal.aborted)throw new DOMException('Cancelado','AbortError');
    const {data}=await worker.recognize(file);
    return data.text.trim();
  } finally {signal.removeEventListener('abort',abort);if(worker)await worker.terminate().catch(()=>{});}
}
