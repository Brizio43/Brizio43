import {normalizeAnswer,questionType} from './quiz.js';
import {groupedQuestions,exerciseTypes} from './quiz-session.js';
const normalizeText=text=>String(text??'').replace(/\s+/g,' ').trim();
const stop=new Set('como para pela pelo pelas pelos entre sobre quando onde uma umas uns esse essa isso este esta são suas seus mais muito também porque assim dos das que com não desse dessa desses dessas deste desta destes destas nesse nessa nesses nessas aquele aquela aqueles aquelas aos nas nos num numa seu sua dela dele elas eles tem têm pode podem'.split(' '));
const words=text=>[...text.matchAll(/\p{L}[\p{L}-]{2,}/gu)].filter(m=>!stop.has(m[0].toLocaleLowerCase('pt-BR')));
const verbs='é são era eram significa significam representa representam consiste consistem corresponde correspondem transforma transformam absorve absorvem participa participam produz produzem permite permitem realiza realizam possui possuem contém apresenta apresentam utiliza utilizam fornece fornecem ocorre ocorrem forma formam faz fazem ajuda ajudam serve servem resulta resultam depende dependem pode podem tem têm'.split(' ');
const verbKeys=new Set(verbs.map(normalizeAnswer));
const relationPattern=new RegExp('^(.+?)\\s+('+verbs.join('|')+')\\s+(.+)$','iu');
function relationOf(sentence){
  const match=sentence.replace(/[.!?…]+$/,'').match(relationPattern);
  if(!match)return null;
  const subject=match[1].replace(/^(?:o|a|os|as|um|uma)\s+/iu,'').trim();
  return {subject,index:sentence.indexOf(subject),predicate:match[2]+' '+match[3],complement:match[3]};
}
function keyTerms(sentence){
  const seen=new Set();
  return words(sentence).filter(match=>{
    const key=normalizeAnswer(match[0]);
    if(verbKeys.has(key)||seen.has(key))return false;
    seen.add(key);return true;
  }).sort((a,b)=>b[0].length-a[0].length).map(match=>({text:match[0],index:match.index}));
}
function sourceSentences(text){
  // OCR wraps a sentence onto several lines. Semicolons and length are not boundaries.
  const seen=new Set();
  return normalizeText(text).split(/(?<=[.!?…])\s+/).filter(sentence=>{
    const key=normalizeAnswer(sentence);
    if(!key||seen.has(key))return false;
    seen.add(key);return true;
  });
}
export function generateAlternatives(correct,text='',position=0,preferred=[],excluded=[]){
  const answerText=String(correct??'').trim();
  if(!answerText)throw Error('Informe a resposta correta antes de gerar as alternativas.');
  const candidates=[...preferred,...(/\s/.test(answerText)?sourceSentences(text):words(normalizeText(text)).map(m=>m[0]))];
  const seen=new Set([normalizeAnswer(answerText),...excluded.map(normalizeAnswer)]),options=[];
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
function questionFromSentence(sentence,type,text,position,focus=null,kind='detail'){
  const relation=relationOf(sentence),terms=keyTerms(sentence);
  const first=[...sentence.matchAll(/\S+/g)][0];
  const target=focus||terms[0]||{text:first[0],index:first.index};
  const theme=relation?.subject||terms[0]?.text||target.text;
  const common={type,explanation:sentence,source:sentence,generated:true,theme,focusText:target.text,focusIndex:target.index,generationKind:kind};
  if(type==='descriptive'){
    const prompt=relation?`Como “${theme}” se relaciona com “${relation.complement}”? Explique com suas palavras, de acordo com o material.`:`Explique o que o material informa sobre “${theme}” e relacione esse conceito com os demais elementos do trecho.`;
    return {...common,prompt,answerText:sentence,hint:'Identifique os conceitos envolvidos, explique a relação entre eles e use as informações do material para justificar sua resposta.'};
  }
  const answer=target.text,masked=sentence.slice(0,target.index)+'_____'+sentence.slice(target.index+answer.length);
  const hint=`Procure a palavra que começa com “${answer[0]}” e tem ${answer.length} caracteres. Considere o sentido da frase.`;
  if(type==='fill')return {...common,prompt:'Complete a frase de acordo com o material: '+masked,answerText:answer,hint};
  if(kind==='concept'&&relation){
    const relations=sourceSentences(text).map(relationOf).filter(Boolean);
    const subjects=relations.map(r=>r.subject);
    const equivalent=relations.filter(r=>normalizeAnswer(r.predicate)===normalizeAnswer(relation.predicate)).map(r=>r.subject);
    return {...common,prompt:`Qual conceito ou elemento corresponde à descrição do material: “${relation.predicate}”?`,...generateAlternatives(answer,text,position,subjects,equivalent),hint:'Identifique no material quem ou o que apresenta a característica ou realiza a ação descrita.'};
  }
  return {...common,prompt:`Qual termo completa a informação sobre “${theme}”? ${masked}`,...generateAlternatives(answer,text,position),hint};
}
// Explore different concepts and details, with one format for each question.
export function questionsFromText(text){
  const sentences=sourceSentences(text),content=sentences.join(' ');
  const questions=[];
  for(const sentence of sentences){
    const relation=relationOf(sentence),terms=keyTerms(sentence);
    const first=[...sentence.matchAll(/\S+/g)][0];
    const concept=relation?{text:relation.subject,index:relation.index}:terms[0]||{text:first[0],index:first.index};
    const conceptWords=new Set(normalizeAnswer(concept.text).split(' '));
    const details=terms.filter(term=>!conceptWords.has(normalizeAnswer(term.text)));
    questions.push(questionFromSentence(sentence,'multiple',content,questions.length,concept,relation?'concept':'detail'));
    // A heading alone is not enough evidence to invent further exercises.
    if(!details.length)continue;
    questions.push(questionFromSentence(sentence,'fill',content,questions.length,details[0]));
    questions.push(questionFromSentence(sentence,'descriptive',content,questions.length,concept,'relation'));
    for(const detail of details.slice(1,3))questions.push(questionFromSentence(sentence,'multiple',content,questions.length,detail));
  }
  return groupedQuestions(questions);
}
export function changeQuestionType(question,type,text='',position=0){
  if(!exerciseTypes.includes(type))throw Error('Tipo de exercício inválido.');
  const {options,answer,answerText,...common}=question;
  if(question.generated&&normalizeAnswer(question.source)){
    const sentence=normalizeText(question.source);
    const focus=Number.isInteger(question.focusIndex)&&sentence.slice(question.focusIndex,question.focusIndex+question.focusText?.length)===question.focusText?{text:question.focusText,index:question.focusIndex}:null;
    const kind=question.generationKind==='relation'?'detail':question.generationKind||'detail';
    return {...common,...questionFromSentence(sentence,type,text||sentence,position,focus,kind)};
  }
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
