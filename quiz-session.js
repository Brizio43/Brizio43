import {questionType,normalizeAnswer} from './quiz.js';
export const exerciseTypes=['multiple','fill','descriptive'];
export function questionKey(q){return questionType(q)+':'+normalizeAnswer(q.prompt);}
export function uniqueQuestions(questions){const seen=new Set();return questions.filter(q=>{const key=questionKey(q);if(seen.has(key))return false;seen.add(key);return true;});}
export function groupedQuestions(questions){const unique=uniqueQuestions(questions);return exerciseTypes.flatMap(type=>unique.filter(q=>questionType(q)===type));}
export function nextPending(states,current,includeSkipped=false){for(let offset=1;offset<states.length;offset++){const index=(current+offset)%states.length;if(states[index]==='pending')return index;}if(includeSkipped){for(let offset=1;offset<states.length;offset++){const index=(current+offset)%states.length;if(states[index]==='skipped')return index;}}return -1;}
export function sessionFingerprint(questions){return JSON.stringify(questions.map(q=>[questionKey(q),q.answer,q.answerText,q.options]));}
export function restoreSession(questions,saved){
 const count=questions.length;
 if(saved?.fingerprint===sessionFingerprint(questions)&&Array.isArray(saved.states)&&saved.states.length===count&&saved.states.every(s=>['pending','skipped','blank','answered'].includes(s))&&Array.isArray(saved.answers)&&saved.answers.length===count&&Array.isArray(saved.drafts)&&saved.drafts.length===count&&Number.isInteger(saved.current)&&saved.current>=0&&saved.current<count)return saved;
 return {fingerprint:sessionFingerprint(questions),states:Array(count).fill('pending'),answers:Array(count).fill(null),drafts:Array(count).fill(null),current:0};
}
