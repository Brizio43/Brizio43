import test from 'node:test';
import assert from 'node:assert/strict';
import {questionsFromText,generateAlternatives,changeQuestionType} from '../image-quiz.js';
import {validateQuiz,isCorrect,score,normalizeAnswer} from '../quiz.js';
const content='A fotossíntese transforma energia luminosa em energia química. As plantas absorvem nutrientes pelas raízes. A clorofila participa desse processo nas folhas.';
test('cada trecho gera uma única questão e as alternativas vêm preenchidas',()=>{
 const questions=questionsFromText(content);
 assert.equal(questions.length,3);
 assert.ok(validateQuiz({title:'Biologia',questions}));
 assert.deepEqual(questions.map(q=>q.type),['multiple','fill','descriptive']);
 assert.equal(new Set(questions.map(q=>normalizeAnswer(q.source))).size,questions.length);
 const [mc,fill,description]=questions;
 assert.equal(mc.options.length,4);
 assert.ok(mc.options.every(option=>option.trim()));
 assert.equal(new Set(mc.options.map(normalizeAnswer)).size,4);
 assert.equal(mc.prompt.split('? ')[1].replace('_____',mc.options[mc.answer]),mc.source);
 assert.equal(fill.prompt.replace('Complete a frase de acordo com o material: ','').replace('_____',fill.answerText),fill.source);
 assert.equal(description.answerText,description.source);
 for(const q of questions){assert.ok(content.includes(q.source));assert.ok(q.hint);if(q.type==='multiple')assert.equal('answerText' in q,false);else{assert.equal('options' in q,false);assert.equal('answer' in q,false);}}
});
test('usa todos os trechos, incluindo linhas, textos curtos e passagens longas',()=>{
 const lines=Array.from({length:15},(_,i)=>`Conceito ${i}: as plantas absorvem nutrientes.`).join('\n');
 const many=questionsFromText(lines);
 assert.equal(many.length,15);
 assert.equal(new Set(many.map(q=>q.source)).size,15);
 assert.deepEqual(many.map(q=>q.type),[...Array(5).fill('multiple'),...Array(5).fill('fill'),...Array(5).fill('descriptive')]);
 assert.equal(questionsFromText('Raízes absorvem água.').length,1);
 assert.deepEqual(questionsFromText(''),[]);
 assert.deepEqual(questionsFromText(' *** '),[]);
 const long=Array.from({length:80},(_,i)=>`conceito${i} absorve nutrientes${i}`).join(' ');
 const questions=questionsFromText('Raízes absorvem água. '+long);
 assert.equal(questions.length,2);
 assert.equal(questions.find(q=>q.type==='fill').source,long.trim());
});
test('lacunas ignoram acentos e caixa; descritivas não recebem nota automática',()=>{
 const questions=questionsFromText(content),fill=questions.find(q=>q.type==='fill'),description=questions.find(q=>q.type==='descriptive');
 const answer=' '+normalizeAnswer(fill.answerText).toUpperCase()+' ';
 assert.equal(isCorrect(fill,answer),true);
 assert.equal(isCorrect(fill,'plantas'),false);
 assert.equal(isCorrect(description,description.answerText),null);
 assert.equal(score([fill,description],[answer,description.answerText]),1);
 assert.equal(validateQuiz({title:'Teste',questions:[{...fill,answerText:''}]}),false);
 assert.equal(validateQuiz({title:'Teste',questions:[{...description,type:'invalid'}]}),false);
});

test('uma frase longa, com quebras de OCR e ponto e vírgula gera uma única lacuna',()=>{
 const source='A fotossíntese transforma energia luminosa\nem energia química; esse processo permite que as plantas\nproduzam nutrientes e sustentem o ecossistema.';
 const fill=questionsFromText('Raízes absorvem água. '+source).filter(q=>q.type==='fill');
 assert.equal(fill.length,1);
 assert.equal(fill[0].prompt.replace('Complete a frase de acordo com o material: ','').replace('_____',fill[0].answerText),source.replace(/\s+/g,' '));
});
test('alternativas não repetem a resposta, mesmo com variações de acento e caixa',()=>{
 for(const [correct,text] of [['Raízes','Raízes RAIZES raízes água.'],['42','42.'],['O texto não informa esse termo','']]){
  const q=generateAlternatives(correct,text,3);
  assert.equal(q.options.length,4);
  assert.ok(q.options.every(option=>option.trim()));
  assert.equal(new Set(q.options.map(normalizeAnswer)).size,4);
  assert.equal(q.options[q.answer],correct);
 }
 assert.throws(()=>generateAlternatives(' '),/resposta correta/);
});
test('trocar tipo substitui o formato e gera todas as opções sem criar outra questão',()=>{
 const questions=questionsFromText(content);
 for(const original of questions){
  const mc=changeQuestionType(original,'multiple',content,2);
  assert.ok(validateQuiz({title:'Convertido',questions:[mc]}));
  assert.equal(mc.source,original.source);
  assert.equal(mc.options.length,4);
  assert.equal(new Set(mc.options.map(normalizeAnswer)).size,4);
  assert.equal('answerText' in mc,false);
  assert.equal(mc.prompt.split('? ')[1].replace('_____',mc.options[mc.answer]),original.source);
  for(const type of ['fill','descriptive']){
   const converted=changeQuestionType(mc,type,content);
   assert.ok(validateQuiz({title:'Convertido',questions:[converted]}));
   assert.equal('options' in converted,false);
   assert.equal('answer' in converted,false);
   assert.equal(converted.source,original.source);
  }
 }
 const manual={type:'fill',prompt:'Complete: a raiz absorve _____.',answerText:'água',explanation:'A água é absorvida pelas raízes.',hint:'Relembre o material.'};
 const mc=changeQuestionType(manual,'multiple',content);
 assert.equal(mc.options[mc.answer],'água');
 assert.equal(mc.prompt,manual.prompt);
 assert.equal(mc.hint,manual.hint);
 assert.ok(validateQuiz({title:'Manual',questions:[mc]}));
});
