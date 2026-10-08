// Draft questions use only words from the reviewed source; no AI service required.
export function questionsFromText(text, limit = 5) {
  const sentences = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/)
    .filter(s => s.length >= 25 && s.length <= 450);
  const stop = new Set('como para pela pelo pelas pelos entre sobre quando onde uma umas uns esse essa isso este esta são suas seus mais muito também porque assim dos das que com não'.split(' '));
  const words = s => [...s.matchAll(/\p{L}[\p{L}-]{4,}/gu)].filter(m => !stop.has(m[0].toLocaleLowerCase('pt-BR')));
  const pool = [...new Map(sentences.flatMap(words).map(m => [m[0].toLocaleLowerCase('pt-BR'), m[0]])).values()];
  if (pool.length < 4) return [];
  return sentences.slice(0, Math.min(limit, 10)).flatMap((sentence, i) => {
    const candidates = words(sentence).sort((a,b) => b[0].length - a[0].length);
    if (!candidates.length) return [];
    const match = candidates[0], answer = match[0];
    const alternatives = pool.filter(w => w.toLocaleLowerCase('pt-BR') !== answer.toLocaleLowerCase('pt-BR')).slice(0,3);
    const options = [...alternatives]; options.splice(i % 4, 0, answer);
    return [{prompt: 'Segundo o conteúdo, complete a frase: ' + sentence.slice(0, match.index) + '_____' + sentence.slice(match.index + answer.length), options, answer:i % 4, explanation:sentence}];
  });
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
