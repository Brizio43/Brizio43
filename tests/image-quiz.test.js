import test from 'node:test';
import assert from 'node:assert/strict';
import {questionsFromText} from '../image-quiz.js';
import {validateQuiz} from '../quiz.js';
const content='A fotossíntese transforma energia luminosa em energia química. As plantas absorvem nutrientes pelas raízes. A clorofila participa desse processo nas folhas.';
test('gera questões válidas cujas respostas recompõem o conteúdo original',()=>{
 const questions=questionsFromText(content,3);
 assert.equal(questions.length,3);
 assert.ok(validateQuiz({title:'Biologia',questions}));
 for(const q of questions){assert.equal(new Set(q.options.map(o=>o.toLowerCase())).size,4);assert.equal(q.prompt.replace('Segundo o conteúdo, complete a frase: ','').replace('_____',q.options[q.answer]),q.explanation);assert.ok(content.includes(q.explanation));}
});
test('respeita o limite e rejeita conteúdo sem vocabulário suficiente',()=>{
 assert.equal(questionsFromText(content,1).length,1);
 assert.deepEqual(questionsFromText(''),[]);
 assert.deepEqual(questionsFromText('Texto curto.'),[]);
 assert.deepEqual(questionsFromText('aaaaaaaa aaaaaaaa aaaaaaaa aaaaaaaa.'),[]);
});
