const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),versionSource=fs.readFileSync(root+'/js/version.js','utf8');
class Channel{constructor(){this.port1={close(){}};this.port2={postMessage:value=>queueMicrotask(()=>this.port1.onmessage?.({data:value}))}}}
function boot({waiting=false,subpath='/REPOSITORY/',registrationFailure=false}={}){
 const elements=new Map(),events={},swEvents={},docEvents={},later=new Map(),calls=[],timers=new Map();let nextTimer=0;
 function el(id){if(!elements.has(id))elements.set(id,{id,hidden:false,disabled:false,textContent:'',innerHTML:'',style:{},querySelector(){return el(id+'p')},classList:{add(){},remove(){}}});return elements.get(id)}
 function on(registry,type,fn){(registry[type]??=[]).push(fn)}
 const ctx={console,URL,MessageChannel:Channel,Date,Promise,isSecureContext:true,matchMedia:()=>({matches:false}),document:{baseURI:'https://example.test'+subpath,visibilityState:'visible',body:{appendChild(){},classList:{add(){calls.push('freeze')},remove(){calls.push('unfreeze')}}},getElementById:el,createElement:()=>el('host'),addEventListener:(type,fn)=>on(docEvents,type,fn)},sessionStorage:{getItem:k=>later.get(k)||null,setItem:(k,v)=>later.set(k,v),removeItem:k=>later.delete(k)},addEventListener:(type,fn)=>on(events,type,fn),setTimeout:(fn,ms)=>{timers.set(++nextTimer,{fn,ms});return nextTimer},clearTimeout:id=>timers.delete(id),setInterval(){},location:{reload(){calls.push('reload')}},toast:text=>calls.push('toast:'+text)};
 ctx.self=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(versionSource,ctx);const current=ctx.STUDY_APP_BUILD,updated={version:'0.2.0',revision:'new-build'};
 function worker(build){return{state:'installed',postMessage(message,ports){if(message.type==='GET_VERSION')ports[0].postMessage(build);if(message.type==='SKIP_WAITING'){calls.push('skip');reg.waiting=null;reg.active=this;for(const fn of swEvents.controllerchange||[])fn()}},addEventListener(){}}}
 const reg={scope:'https://example.test'+subpath,active:worker(current),waiting:waiting?worker(updated):null,installing:null,async update(){calls.push('check')},addEventListener(){}};
 ctx.navigator={onLine:true,serviceWorker:{async register(url,options){calls.push({registration:url,scope:options.scope,updateViaCache:options.updateViaCache});if(registrationFailure)throw Error('Registration rejected');return reg},ready:Promise.resolve(reg),addEventListener:(type,fn)=>on(swEvents,type,fn)},storage:{async estimate(){return {usage:1024,quota:10240}},async persisted(){return false},async persist(){calls.push('persist');return true}}};
 ctx.StudyPWAIntegration={activity:()=> 'Your active exam is saved before restarting.',async saveBeforeUpdate(){calls.push('flush')}};
 vm.runInContext(fs.readFileSync(root+'/js/updater.js','utf8'),ctx);
 return {ctx,reg,calls,elements,events,swEvents,updated,el};
}
async function settle(){for(let i=0;i<30;i++)await Promise.resolve()}
(async()=>{
 for(const subpath of ['/','/REPOSITORY/']){
  const test=boot({waiting:true,subpath}),{ctx,calls,el,reg}=test;await settle();const registered=calls.find(x=>typeof x==='object');assert.equal(registered.scope,'https://example.test'+subpath);assert.equal(registered.registration,registered.scope+'service-worker.js');assert.equal(registered.updateViaCache,'none');assert(!calls.includes('persist'));assert(!calls.includes('reload'));assert(!calls.includes('skip'));assert(!el('pwaUpdateBanner').hidden);
  el('pwaLater').onclick();assert(el('pwaUpdateBanner').hidden);assert(!calls.includes('reload'));assert(reg.waiting);
  await ctx.StudyPWA.check(true);assert(!el('pwaUpdateBanner').hidden);
  ctx.StudyPWAIntegration.saveBeforeUpdate=async()=>{calls.push('save-failed');throw Error('Quota exceeded; save incomplete')};await ctx.StudyPWA.apply();assert(!calls.includes('skip'));assert(!calls.includes('reload'));assert(!el('pwaStorageError').hidden);
  ctx.StudyPWAIntegration.saveBeforeUpdate=async()=>calls.push('flush');await ctx.StudyPWA.apply();assert.equal(calls.filter(x=>x==='reload').length,1);assert(calls.indexOf('flush')<calls.indexOf('skip'));await ctx.StudyPWA.apply();assert.equal(calls.filter(x=>x==='reload').length,1);
 }
 const stable=boot();await settle();await stable.ctx.StudyPWA.check(true);assert(stable.calls.some(x=>x.includes?.("You're up to date")));assert(!stable.calls.includes('reload'));stable.ctx.navigator.onLine=false;await stable.ctx.StudyPWA.check(true);assert(stable.calls.some(x=>x.includes?.('Internet connection required')));
 const other=boot();await settle();other.reg.active={postMessage(msg,ports){if(msg.type==='GET_VERSION')ports[0].postMessage(other.updated)}};for(const fn of other.swEvents.controllerchange)fn();await settle();assert(!other.calls.includes('reload'));assert(!other.el('pwaUpdateBanner').hidden);await other.ctx.StudyPWA.apply();assert(other.calls.includes('flush'));assert.equal(other.calls.filter(x=>x==='reload').length,1);
 const failed=boot({registrationFailure:true});await settle();assert(!failed.calls.includes('reload'));assert(!failed.el('pwaStorageError').hidden);
 console.log('PASS: stable subpath registration, no automatic reload/skip/persistence request, waiting version, Later, explicit update, save failure blocks activation, save-before-skip ordering, one reload, offline/current checks and other-tab activation safety.');
})().catch(error=>{console.error(error);process.exitCode=1});
