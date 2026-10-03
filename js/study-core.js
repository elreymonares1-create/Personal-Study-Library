/* Shared retrieval rules. No storage side effects; retained records stay caller-owned. */
(function(root){
'use strict';
const DAY=86400000, HOUR=3600000;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const defaults={schemaVersion:2,attempts:0,correct:0,incorrect:0,streak:0,bestStreak:0,verified:0,mastered:false,reviewAgain:false,priority:0,events:[],difficulty:5,stability:1,misconception:false,assistedCorrect:0};
function normalize(record={}){if(!record||typeof record!=='object'||Array.isArray(record))return {...defaults,events:[],recoveryRaw:record};const r={...defaults,...record,events:Array.isArray(record.events)?[...record.events]:[]};if(record.events&&!Array.isArray(record.events))r.recoveryEvents=record.events;for(const key of ['attempts','correct','incorrect','streak','bestStreak','verified','priority','difficulty','stability','assistedCorrect']){if(!Number.isFinite(Number(r[key]))||Number(r[key])<0){r.recoveryFields={...r.recoveryFields,[key]:r[key]};r[key]=defaults[key]}else r[key]=Number(r[key])}return r}
function apply(record,outcome,context={}){
 const r=normalize(record),at=context.now??Date.now(),mode=context.mode||'normal',reviewType=context.reviewType||'long-term';
 const correct=!!outcome.correct,assisted=!!outcome.assisted,confidence=outcome.confidence||null;
 const independent=correct&&!assisted&&outcome.source!=='self'&&confidence!=='Guess'&&confidence!=='Unsure';
 const separated=!r.lastVerifiedAt||at-new Date(r.lastVerifiedAt).getTime()>=(mode==='mastery'?DAY:mode==='strict'?10*60000:0);
 const appearance=context.appearance||null,distinct=!appearance||appearance!==r.lastVerifiedAppearance;
 const age=r.lastAt?Math.max(0,(at-new Date(r.lastAt).getTime())/DAY):0;
 r.retrievability=Math.exp(-age/Math.max(.1,r.stability));
 r.attempts++;r.lastAt=new Date(at).toISOString();r.lastResult=correct?'correct':'incorrect';r.lastConfidence=confidence;r.lastMode=mode;
 if(correct){r.correct++;if(assisted)r.assistedCorrect++;if(independent&&separated&&distinct){r.streak++;r.verified++;r.lastVerifiedAt=r.lastAt;r.lastVerifiedAppearance=appearance;r.bestStreak=Math.max(r.bestStreak,r.streak)}r.priority=Math.max(0,r.priority-.5);if(independent){r.difficulty=clamp(r.difficulty-.2,1,10);if(separated)r.stability=clamp(r.stability*(1.4+(10-r.difficulty)/10),1,365)}
  const required={normal:1,strict:2,mastery:3}[mode]||1;
  if(independent&&r.verified>=required){r.mastered=true;r.reviewAgain=false;r.broken=false;r.misconception=false;r.manual=false}
 }else{r.incorrect++;r.broken=r.verified>0||r.mastered;r.streak=0;r.verified=0;r.mastered=false;r.reviewAgain=true;r.priority+=confidence==='Confident'?4:2;r.misconception=r.misconception||confidence==='Confident';r.difficulty=clamp(r.difficulty+.8,1,10);r.stability=Math.max(.1,r.stability*.35);r.lastVerifiedAt=null;r.lastVerifiedAppearance=null}
 const interval=reviewType==='cram'?(correct?(confidence==='Guess'?5:confidence==='Unsure'?15:60)*60000:2*60000):(correct?(independent?r.stability*DAY:30*60000):10*60000);
 r.dueAt=new Date(at+interval).toISOString();r.scheduler='conservative-exponential-v1';r.reviewType=reviewType;
 r.events.push({id:context.eventId||String(at)+':'+r.attempts,at:r.lastAt,correct,assisted,confidence,independent,verifiedCredit:independent&&separated&&distinct,source:outcome.source||'automatic',answer:outcome.answer??null,mode,reviewType,sessionId:context.sessionId||null,appearance,intervalMs:interval});
 return r;
}
function priority(record,at=Date.now()){const r={...defaults,...record},due=r.dueAt&&new Date(r.dueAt).getTime()<=at;return(r.mastered?-10000:0)+(r.misconception?1000:0)+Math.min(r.incorrect,10)*80+(r.reviewAgain?120:0)+(r.broken?90:0)+(due?60:0)+(!r.attempts?40:0)+(r.lastConfidence==='Guess'?65:r.lastConfidence==='Unsure'?35:0)+r.priority*8}
function shuffle(values,rng=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function blueprint(items,count,rng=Math.random){const groups=new Map();for(const item of shuffle(items,rng)){const key=(item.topicId||'unmapped')+'|'+(item.cognitiveLevel||item.difficulty||'unlabeled');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item)}const queues=shuffle([...groups.values()],rng),out=[];while(out.length<Math.min(count,items.length)){for(const q of queues){if(q.length&&out.length<count)out.push(q.pop())}}return shuffle(out,rng)}
function coverage(concepts,items,records){const map=new Map(concepts.map(c=>[c.id,{...c,items:[]} ]));for(const item of items){const id=item.conceptId||'item:'+item.key;if(!map.has(id))map.set(id,{id,title:item.conceptTitle||item.prompt||item.front,topicId:item.topicId,items:[]});map.get(id).items.push(item)}return [...map.values()].map(c=>{const rs=c.items.map(i=>records[i.key]||{}),tested=rs.some(r=>r.attempts>0),mastered=rs.length>0&&rs.every(r=>r.mastered),weak=rs.some(r=>!r.mastered&&(r.reviewAgain||r.misconception||r.broken)),attempts=rs.reduce((s,r)=>s+(r.attempts||0),0),correct=rs.reduce((s,r)=>s+(r.correct||0),0);return{...c,tested,mastered,weak,attempts,correct,incorrect:attempts-correct,availability:{mcq:c.items.filter(i=>i.kind==='mcq').length,recall:c.items.filter(i=>i.kind==='card').length},state:mastered?'MASTERED':weak?'WEAK':tested?'LEARNING':'UNTESTED'}})}
function validateQuestion(q){return q&&typeof(q.prompt??q.text)==='string'&&Array.isArray(q.options)&&q.options.length>=2&&q.options.every(v=>typeof v==='string')&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length}
root.UniversalStudyCore=Object.freeze({version:2,normalize,apply,priority,shuffle,blueprint,coverage,validateQuestion,DAY,HOUR});
})(typeof window!=='undefined'?window:globalThis);
