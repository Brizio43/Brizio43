import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const files = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/quiz.js':'quiz.js','/image-quiz.js':'image-quiz.js','/tokens.css':'tokens.css','/design-system.html':'design-system.html','/design-system.css':'design-system.css'};
for(const file of ['tesseract.min.js','worker.min.js','tesseract-core-lstm.wasm.js','tesseract-core-lstm.wasm','por.traineddata.gz']) files['/vendor/ocr/'+file]='vendor/ocr/'+file;
createServer(async(req,res)=>{
 const file=files[new URL(req.url,'http://localhost').pathname];
 if(!file){res.writeHead(404);return res.end('Não encontrado');}
 try { const body=await readFile(root+file);res.setHeader('Content-Type',file.endsWith('.wasm')?'application/wasm':file.endsWith('.gz')?'application/octet-stream':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(body); }
 catch {res.writeHead(500);res.end('Erro ao carregar arquivo');}
}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Quiz Estudo iniciado na porta '+(process.env.PORT||3000)));
