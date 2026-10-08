import {questionKey} from './quiz-session.js';
export const prizes=[
 {badge:'Olhar atento',badgeIcon:'🎯',gift:'Cristal azul',giftIcon:'💎'},
 {badge:'Mente curiosa',badgeIcon:'💡',gift:'Estrela laranja',giftIcon:'⭐'},
 {badge:'Passo certeiro',badgeIcon:'🚀',gift:'Foguete do saber',giftIcon:'🚀'},
 {badge:'Conhecimento em ação',badgeIcon:'🏅',gift:'Troféu virtual',giftIcon:'🏆'}
];
export function rewardFor(runId,q,index){return {id:runId+':'+questionKey(q),...prizes[index%prizes.length],points:10,earnedAt:Date.now()};}
export function addReward(collection,reward){return collection.some(item=>item.id===reward.id)?collection:[...collection,reward];}
