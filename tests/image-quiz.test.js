import test from 'node:test';
import assert from 'node:assert/strict';
import {questionsFromText} from '../image-quiz.js';
import {validateQuiz,isCorrect,score} from '../quiz.js';
const content='A fotossíntese transforma energia luminosa em energia química. As plantas absorvem nutrientes pelas raízes. A clorofila participa desse processo nas folhas.';
test('cada trecho gera os três tipos válidos com dicas e referências',()=>{
 const questions=questionsFromText(content);
 assert.equal(questions.length,9);
 assert.ok(validateQuiz({title:'Biologia',questions}));
 for(let i=0;i<3;i++){const [mc,fill,description]=['multiple','fill','descriptive'].map(type=>questions.filter(q=>q.type===type)[i]);assert.deepEqual([mc.type,fill.type,description.type],['multiple','fill','descriptive']);assert.equal(mc.options[mc.answer],fill.answerText);assert.equal(fill.prompt.replace('Complete a frase de acordo com o material: ','').replace('_____',fill.answerText),fill.source);assert.equal(description.answerText,fill.source);assert.ok(content.includes(fill.source));assert.equal(new Set(mc.options).size,4);assert.ok(mc.hint&&fill.hint&&description.hint);}
 assert.deepEqual(questions.map(q=>q.type),['multiple','multiple','multiple','fill','fill','fill','descriptive','descriptive','descriptive']);
});
test('usa todos os trechos, incluindo linhas, textos curtos e passagens longas',()=>{
 const lines=Array.from({length:15},(_,i)=>`Conceito ${i}: as plantas absorvem nutrientes.`).join('\n');
 assert.equal(questionsFromText(lines).length,45);
 assert.equal(questionsFromText('Raízes absorvem água.').length,3);
 assert.deepEqual(questionsFromText(''),[]);
 assert.deepEqual(questionsFromText(' *** '),[]);
 const long=Array.from({length:80},(_,i)=>`conceito${i} absorve nutrientes${i}`).join(' ');
 const questions=questionsFromText(long);
 assert.equal(questions.filter(q=>q.type==='descriptive').map(q=>q.source).join(' '),long.trim());
});
test('lacunas ignoram acentos e caixa; descritivas não recebem nota automática',()=>{
 const questions=questionsFromText(content),fill=questions.find(q=>q.type==='fill'),description=questions.find(q=>q.type==='descriptive');
 assert.equal(isCorrect(fill,' FOTOSSINTESE '),true);
 assert.equal(isCorrect(fill,'plantas'),false);
 assert.equal(isCorrect(description,description.answerText),null);
 assert.equal(score([fill,description],['fotossintese',description.answerText]),1);
 assert.equal(validateQuiz({title:'Teste',questions:[{...fill,answerText:''}]}),false);
 assert.equal(validateQuiz({title:'Teste',questions:[{...description,type:'invalid'}]}),false);
});
