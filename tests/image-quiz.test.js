import test from 'node:test';
import assert from 'node:assert/strict';
import {questionsFromText,generateAlternatives,changeQuestionType} from '../image-quiz.js';
import {validateQuiz,isCorrect,score,normalizeAnswer} from '../quiz.js';
const content='A fotossíntese transforma energia luminosa em energia química. As plantas absorvem nutrientes pelas raízes. A clorofila participa desse processo nas folhas.';
test('cada tema gera várias perguntas distintas, cada uma com um único tipo',()=>{
 const questions=questionsFromText(content);
 assert.ok(questions.length>=9);
 assert.ok(validateQuiz({title:'Biologia',questions}));
 assert.equal(new Set(questions.map(q=>normalizeAnswer(q.prompt))).size,questions.length);
 for(const source of new Set(questions.map(q=>q.source))){
  const themed=questions.filter(q=>q.source===source);
  assert.ok(themed.length>=3);
  assert.ok(themed.some(q=>q.type==='multiple'));
  assert.equal(themed.filter(q=>q.type==='fill').length,1);
  assert.ok(themed.some(q=>q.type==='descriptive'));
  // Objective questions explore different information, rather than repeat a gap.
  assert.equal(new Set(themed.filter(q=>q.type!=='descriptive').map(q=>normalizeAnswer(q.type==='multiple'?q.options[q.answer]:q.answerText))).size,themed.filter(q=>q.type!=='descriptive').length);
 }
 for(const q of questions){
  assert.ok(content.includes(q.source));assert.ok(q.hint);
  if(q.type==='multiple'){
   assert.equal('answerText' in q,false);
   assert.equal(q.options.length,4);
   assert.ok(q.options.every(option=>option.trim()));
   assert.equal(new Set(q.options.map(normalizeAnswer)).size,4);
   assert.ok(q.source.includes(q.options[q.answer]));
  }else{
   assert.equal('options' in q,false);assert.equal('answer' in q,false);
   if(q.type==='fill')assert.equal(q.prompt.replace('Complete a frase de acordo com o material: ','').replace('_____',q.answerText),q.source);
   else assert.equal(q.answerText,q.source);
  }
 }
 const theme='A fotossíntese transforma energia luminosa em energia química.';
 const concept=questions.find(q=>q.source===theme&&q.type==='multiple');
 assert.equal(concept.options[concept.answer],'fotossíntese');
 assert.ok(concept.prompt.includes('transforma energia luminosa em energia química'));
 assert.ok(!concept.prompt.includes('fotossíntese'));
});
test('usa todos os trechos, incluindo linhas, textos curtos e passagens longas',()=>{
 const lines=Array.from({length:15},(_,i)=>`O conceito ${i} representa a propriedade ${i}.`).join('\n');
 const many=questionsFromText(lines);
 assert.ok(many.length>=45);
 assert.equal(new Set(many.map(q=>q.source)).size,15);
 const order={multiple:0,fill:1,descriptive:2};
 assert.deepEqual(many.map(q=>order[q.type]),many.map(q=>order[q.type]).sort((a,b)=>a-b));
 const short=questionsFromText('Raízes absorvem água.');
 assert.equal(short.length,3);
 assert.deepEqual(short.map(q=>q.type),['multiple','fill','descriptive']);
 assert.deepEqual(questionsFromText(''),[]);
 assert.deepEqual(questionsFromText(' *** '),[]);
 const long=Array.from({length:80},(_,i)=>`conceito${i} absorve nutrientes${i}`).join(' ');
 const questions=questionsFromText('Raízes absorvem água. '+long);
 assert.ok(questions.length>=6);
 assert.equal(questions.filter(q=>q.type==='fill'&&q.source===long.trim()).length,1);
 assert.equal(questions.find(q=>q.type==='fill'&&q.source===long.trim()).prompt.replace('Complete a frase de acordo com o material: ','').replace('_____',questions.find(q=>q.type==='fill'&&q.source===long.trim()).answerText),long.trim());
});
test('lacunas ignoram acentos e caixa; descritivas não recebem nota automática',()=>{
 const questions=questionsFromText('Raízes absorvem água.'),fill=questions.find(q=>q.type==='fill'),description=questions.find(q=>q.type==='descriptive');
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
 const fill=questionsFromText(source).filter(q=>q.type==='fill');
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
  assert.equal(mc.options[mc.answer],original.focusText);
  assert.ok(mc.source.includes(mc.options[mc.answer]));
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
test('material com apenas um título não inventa fatos e verbos/pronomes não viram detalhes',()=>{
 const heading=questionsFromText('Biologia');
 assert.equal(heading.length,1);
 assert.equal(heading[0].options[heading[0].answer],'Biologia');
 const questions=questionsFromText('A clorofila participa desse processo nas folhas.');
 for(const q of questions.filter(q=>q.type!=='descriptive'))assert.ok(!['participa','desse','nas'].includes(normalizeAnswer(q.type==='multiple'?q.options[q.answer]:q.answerText)));
});
test('conceitos que satisfazem a mesma descrição não aparecem como alternativas erradas',()=>{
 const questions=questionsFromText('Raízes absorvem água. Folhas absorvem água.');
 const concept=questions.find(q=>q.generationKind==='concept');
 assert.equal(concept.options.length,4);
 assert.equal(concept.options[concept.answer],'Raízes');
 assert.ok(!concept.options.some(option=>normalizeAnswer(option)==='folhas'));
});
