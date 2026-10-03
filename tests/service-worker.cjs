const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..'),assets=JSON.parse(fs.readFileSync(root+'/precache-manifest.js','utf8').split('self.STUDY_APP_ASSETS = ')[1].trim().replace(/;$/,''));
class Cache{constructor(){this.rows=new Map()}async match(key){return this.rows.get(typeof key==='string'?key:key.url)?.clone()}async put(key,res){this.rows.set(typeof key==='string'?key:key.url,res.clone())}}
const cacheMaps=new Map(),cacheStorage={async open(name){if(!cacheMaps.has(name))cacheMaps.set(name,new Cache());return cacheMaps.get(name)},async keys(){return [...cacheMaps.keys()]},async delete(name){return cacheMaps.delete(name)}};
const original=fs.readFileSync(root+'/js/version.js','utf8'),ownBuild=JSON.parse(original.match(/revision:("[^"]+")/)[1]);
class Channel{constructor(){this.port1={close(){}};this.port2={postMessage:value=>queueMicrotask(()=>this.port1.onmessage?.({data:value}))}}}
let clients=[],failPath=null,network=false;
function worker(scope,revision=ownBuild){
 const handlers={},version=original.replace('revision:'+JSON.stringify(ownBuild),'revision:'+JSON.stringify(revision)),localAssets=structuredClone(assets);
 localAssets.find(x=>x.path==='js/version.js').sha256=crypto.createHash('sha256').update(version).digest('hex');
 const self={registration:{scope},skipWaitingCalls:0,claimCalls:0,addEventListener(type,fn){handlers[type]=fn},async skipWaiting(){this.skipWaitingCalls++},clients:{async matchAll(){return clients},async claim(){self.claimCalls++}}};
 const ctx={self,URL,Request,Response,MessageChannel:Channel,setTimeout,clearTimeout,console,crypto:crypto.webcrypto,caches:cacheStorage,fetch:async request=>{if(!network)throw Error('offline');const name=new URL(request.url).pathname.slice(new URL(scope).pathname.length);if(name===failPath)return new Response('failed',{status:503});assert(!name.includes('private'));return new Response(name==='js/version.js'?version:fs.readFileSync(path.join(root,name)))} };vm.createContext(ctx);
 ctx.importScripts=(...paths)=>{for(const name of paths){if(name.endsWith('version.js'))vm.runInContext(version,ctx);else vm.runInContext('self.STUDY_APP_ASSETS='+JSON.stringify(localAssets),ctx);ctx.STUDY_APP_BUILD=self.STUDY_APP_BUILD;ctx.STUDY_APP_ASSETS=self.STUDY_APP_ASSETS;}};
 vm.runInContext(fs.readFileSync(root+'/service-worker.js','utf8'),ctx);
 async function event(type,props={}){let waiting,response;handlers[type]({...props,waitUntil:p=>waiting=p,respondWith:p=>response=p});if(waiting)await waiting;return response?await response:undefined}
 return {self,event,scope,cacheName:'study-library-app:'+encodeURIComponent(new URL(scope).pathname)+':'+revision};
}
function client(scope,revision){return{url:scope,postMessage(message,ports){if(message.type==='GET_CLIENT_BUILD')ports[0].postMessage({revision})}}}
(async()=>{
 await cacheStorage.open('irreplaceable-user-cache');await cacheStorage.open('another-app-cache');
 for(const scope of ['https://example.test/','https://example.test/REPOSITORY/']){
  network=true;failPath=null;const first=worker(scope);await first.event('install');assert.equal(first.self.skipWaitingCalls,0);clients=[client(scope,ownBuild)];await first.event('activate');assert.equal(first.self.claimCalls,1);
  network=false;const html=await first.event('fetch',{request:{method:'GET',url:scope,mode:'navigate'}});assert((await html.text()).includes('Study Library'));
  const script=await first.event('fetch',{request:{method:'GET',url:scope+'js/app.js?cache=1',mode:'same-origin'}});assert((await script.text()).includes('const Storage='));
  const pdf=await first.event('fetch',{request:{method:'GET',url:scope+'assets/pdfjs/pdf.worker.min.js',mode:'same-origin'}});assert((await pdf.text()).length>1000000);
  const unknown=await first.event('fetch',{request:{method:'GET',url:scope+'private-upload.pdf',mode:'same-origin'}});assert.equal(unknown,undefined);
  const fallback=await first.event('fetch',{request:{method:'GET',url:scope+'unknown-page',mode:'navigate'}});assert((await fallback.text()).includes('You’re offline'));
  network=true;failPath='css/app.css';const bad=worker(scope,'failed-build');await assert.rejects(bad.event('install'));assert(cacheMaps.has(first.cacheName));assert(!cacheMaps.has(bad.cacheName));
  failPath=null;const second=worker(scope,'second-build');await second.event('install');assert.equal(second.self.skipWaitingCalls,0);clients=[client(scope,ownBuild),client(scope,'second-build')];await second.event('activate');assert(cacheMaps.has(first.cacheName),'older open tab retains old application cache');
  await second.event('message',{data:{namespace:'study-pwa',type:'SKIP_WAITING'}});assert.equal(second.self.skipWaitingCalls,1);
  clients=[client(scope,'second-build')];await second.event('message',{data:{namespace:'study-pwa',type:'CLEAN_APP_CACHES'}});assert(!cacheMaps.has(first.cacheName));assert(cacheMaps.has(second.cacheName));
 }
 assert(cacheMaps.has('irreplaceable-user-cache'));assert(cacheMaps.has('another-app-cache'));
 console.log('PASS: online precache, offline shell/code/PDF assets, subpath routing, exact asset allow-list, failed install rollback, waiting lifecycle and scoped/multi-tab cache cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1});
