import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQuiz,score,sample} from '../quiz.js';
test('quizzes criados e exportados preservam dados válidos',()=>{assert.equal(validateQuiz(JSON.parse(JSON.stringify(sample))),true);});
test('importação rejeita perguntas incompletas e respostas fora das alternativas',()=>{for(const change of [q=>q.questions[0].answer=4,q=>q.questions[0].options[1]=' ',q=>q.questions=[],q=>q.title=' ',q=>q.questions[0].prompt=null]){const q=structuredClone(sample);change(q);assert.equal(validateQuiz(q),false);}});
test('pontuação considera acertos, erros e questões não respondidas',()=>{assert.equal(score(sample.questions,[1,2,2]),3);assert.equal(score(sample.questions,[0,2,1]),1);assert.equal(score(sample.questions,[]),0);});
