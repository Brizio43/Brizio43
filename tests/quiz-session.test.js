import test from 'node:test';
import assert from 'node:assert/strict';
import {uniqueQuestions,groupedQuestions,nextPending,restoreSession} from '../quiz-session.js';
import {questionsFromText} from '../image-quiz.js';
import {score} from '../quiz.js';
const source='As plantas absorvem nutrientes pelas raízes. A energia luminosa permite a fotossíntese. A clorofila participa do processo.';
test('conteúdo repetido e regeneração não duplicam exercícios; tipos ficam em blocos',()=>{
 const once=questionsFromText(source),repeated=questionsFromText(source+' '+source.toUpperCase());
 assert.equal(repeated.length,once.length);
 assert.equal(uniqueQuestions([...once,...once]).length,once.length);
 const order={multiple:0,fill:1,descriptive:2};
 const grouped=groupedQuestions([...once].reverse());
 assert.deepEqual(grouped.map(q=>order[q.type]),grouped.map(q=>order[q.type]).sort((a,b)=>a-b));
 assert.ok(grouped.length>3);
});
test('avanço não repete respondidas; pular todas abre revisão e brancos são preservados',()=>{
 assert.equal(nextPending(['answered','skipped','pending','blank'],0),2);
 assert.equal(nextPending(['skipped','skipped','answered','blank'],1),-1);
 assert.equal(nextPending(['skipped','skipped','answered','blank'],1,true),0);
 assert.equal(nextPending(['answered','blank'],0,true),-1);
});
test('retomada preserva respostas, rascunhos e puladas; edição do quiz reinicia sessão',()=>{
 const questions=questionsFromText(source);const session=restoreSession(questions,null);
 session.states[0]='answered';session.answers[0]=questions[0].answer;
 session.states[1]='skipped';session.drafts[1]=2;session.current=2;
 session.states[2]='blank';
 assert.deepEqual(restoreSession(questions,JSON.parse(JSON.stringify(session))),session);
 assert.equal(score(questions,session.answers),1);
 const changed=structuredClone(questions);changed[0].prompt+=' Editada';
 assert.ok(restoreSession(changed,session).states.every(s=>s==='pending'));
});
