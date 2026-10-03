// build: 89a977fa33ab352afbf2
'use strict';
importScripts('./js/version.js','./precache-manifest.js');
const SCOPE=self.registration.scope;
const PREFIX='study-library-app:'+encodeURIComponent(new URL(SCOPE).pathname)+':';
const CACHE=PREFIX+STUDY_APP_BUILD.revision;
const URLS=new Map(STUDY_APP_ASSETS.map(asset=>[new URL(asset.path,SCOPE).href,asset]));
const INDEX=new URL('index.html',SCOPE).href,OFFLINE=new URL('offline.html',SCOPE).href;
const READY=new URL('_pwa/cache-ready',SCOPE).href;
function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE),alreadyReady=!!await cache.match(READY);
 if(alreadyReady)return;
 try{
  const work=[...URLS];
  await Promise.all(Array.from({length:6},async()=>{
   while(work.length){const [url,asset]=work.shift();const response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));if(!response.ok||response.type==='opaque')throw Error('Missing app asset: '+asset.path);const hash=hex(await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer()));if(hash!==asset.sha256)throw Error('Deployment file mismatch: '+asset.path);await cache.put(url,response)}
  }));
  await cache.put(READY,new Response(JSON.stringify(STUDY_APP_BUILD),{headers:{'Content-Type':'application/json'}}));
  for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({namespace:'study-pwa',type:'UPDATE_READY'});
 }catch(error){await caches.delete(CACHE);throw error}
 // No skipWaiting here: the learner chooses when an update activates.
})()));
function clientBuild(client){return new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null)},2000);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data)};client.postMessage({namespace:'study-pwa',type:'GET_CLIENT_BUILD'},[channel.port2])})}
async function cleanCaches(){
 const clients=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(client=>client.url.startsWith(SCOPE));
 const versions=await Promise.all(clients.map(clientBuild));
 // Retain previous application files while any open tab still uses older code.
 if(versions.some(info=>!info||info.revision!==STUDY_APP_BUILD.revision))return;
 const names=await caches.keys();for(const name of names)if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
 // No IndexedDB access, localStorage reset, or user-content caching in this worker.
}
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();await cleanCaches()})()));
self.addEventListener('message',event=>{
 if(event.data?.namespace!=='study-pwa')return;
 if(event.data.type==='GET_VERSION')event.ports[0]?.postMessage(STUDY_APP_BUILD);
 if(event.data.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
 if(event.data.type==='CLEAN_APP_CACHES')event.waitUntil(cleanCaches());
});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(!url.href.startsWith(SCOPE)||url.origin!==new URL(SCOPE).origin)return;
 if(request.mode==='navigate'){
  if(url.pathname===new URL(SCOPE).pathname||url.pathname===new URL(INDEX).pathname){event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(INDEX))||fetch(request).catch(()=>cache.match(OFFLINE))));return}
  event.respondWith(fetch(request).catch(async()=>(await caches.open(CACHE)).match(OFFLINE)));return;
 }
 // An explicit allow-list prevents caching private uploads, exports, APIs or arbitrary URLs.
 url.search='';url.hash='';if(!URLS.has(url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(url.href);if(hit)return hit;return new Response('Required app asset is missing. Connect and check for updates.',{status:503,headers:{'Content-Type':'text/plain'}})}));
});
