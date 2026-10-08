import {normalizeAnswer} from './quiz.js';
import {groupedQuestions} from './quiz-session.js';
// Deterministic exercises grounded in every nonempty passage of the source.
export function questionsFromText(text) {
  const passages = String(text).split(/\n+/).flatMap(line => line.trim().split(/(?<=[.!?;])\s+/))
    .map(s=>s.replace(/\s+/g,' ').trim()).filter(s=>/[\p{L}\p{N}]/u.test(s));
  // Split long passages at word boundaries, retaining every word.
  const sentences=passages.flatMap(p=>{const parts=[];let part='';for(const word of p.split(' ')){if(part&&part.length+word.length>420){parts.push(part);part='';}part+=(part?' ':'')+word;}if(part)parts.push(part);return parts;});
  const seen=new Set();const distinct=sentences.filter(sentence=>{const key=normalizeAnswer(sentence);if(seen.has(key))return false;seen.add(key);return true;});
  const stop = new Set('como para pela pelo pelas pelos entre sobre quando onde uma umas uns esse essa isso este esta são suas seus mais muito também porque assim dos das que com não'.split(' '));
  const words = s => [...s.matchAll(/\p{L}[\p{L}-]{2,}/gu)].filter(m => !stop.has(m[0].toLocaleLowerCase('pt-BR')));
  const pool = [...new Map(distinct.flatMap(words).map(m => [m[0].toLocaleLowerCase('pt-BR'), m[0]])).values()];
  return groupedQuestions(distinct.flatMap((sentence, i) => {
    const candidates = words(sentence).sort((a,b) => b[0].length - a[0].length);
    const match=candidates[0] || [...sentence.matchAll(/\S+/g)][0];
    const answer=match[0], masked=sentence.slice(0,match.index)+'_____'+sentence.slice(match.index+answer.length);
    const distractors=pool.filter(w=>w.toLocaleLowerCase('pt-BR')!==answer.toLocaleLowerCase('pt-BR'));
    distractors.push('O texto não informa esse termo','Não há termo correspondente','A informação foi omitida');
    const options=distractors.slice(0,3);const position=i%4;options.splice(position,0,answer);
    const hint=`Procure a palavra que começa com “${answer[0]}” e tem ${answer.length} caracteres. Considere o sentido da frase.`;
    const common={explanation:sentence,source:sentence,generated:true};
    return [
      {...common,type:'multiple',prompt:'Qual alternativa completa o trecho do material? '+masked,options,answer:position,hint},
      {...common,type:'fill',prompt:'Complete a frase de acordo com o material: '+masked,answerText:answer,hint},
      {...common,type:'descriptive',prompt:'Explique com suas palavras a informação deste trecho: “'+sentence+'”',answerText:sentence,hint:'Identifique a ideia principal e explique como os conceitos do trecho se relacionam. Evite apenas copiar a frase.'}
    ];
  }));
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
