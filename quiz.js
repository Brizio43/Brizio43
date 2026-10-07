export function validateQuiz(quiz){
 if(!quiz || typeof quiz.title!=='string'||!quiz.title.trim()||!Array.isArray(quiz.questions)||!quiz.questions.length) return false;
 return quiz.questions.every(q=>typeof q.prompt==='string'&&q.prompt.trim()&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(o=>typeof o==='string'&&o.trim())&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&typeof q.explanation==='string');
}
export function score(questions,answers){return questions.reduce((sum,q,i)=>sum+(answers[i]===q.answer?1:0),0);}
export const sample={id:'sample',title:'Conhecimentos gerais',subject:'Aquecimento',questions:[
 {prompt:'Qual planeta é conhecido como planeta vermelho?',options:['Vênus','Marte','Júpiter','Mercúrio'],answer:1,explanation:'O óxido de ferro presente na superfície dá a Marte sua aparência avermelhada.'},
 {prompt:'Quanto é 15% de 200?',options:['15','20','30','45'],answer:2,explanation:'Multiplique 200 por 0,15. O resultado é 30.'},
 {prompt:'Qual é a função principal das raízes de uma planta?',options:['Realizar a polinização','Produzir frutos','Absorver água e nutrientes','Atrair insetos'],answer:2,explanation:'As raízes absorvem água e sais minerais do solo e ajudam a fixar a planta.'}
]};
