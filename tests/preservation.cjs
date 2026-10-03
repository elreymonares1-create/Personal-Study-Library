const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(root+'/js/app.js','utf8'),fingerprints=JSON.parse(fs.readFileSync(root+'/docs/preservation-fingerprints.json','utf8'));
for(const [name,hash]of Object.entries(fingerprints)){
 if(name==='SHARED_STUDY_ENGINE'){
  const baseline=fs.readFileSync(root+'/recovery/shared-study-0.1.0.declaration.txt','utf8');
  assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),hash,'recoverable original engine');
  assert.equal(JSON.parse(code.match(/const SHARED_STUDY_ENGINE=([^\n]+);/)[1]),fs.readFileSync(root+'/js/shared-study.js','utf8'));
  assert.equal(JSON.parse(code.match(/const UNIVERSAL_STUDY_CORE=([^\n]+);/)[1]),fs.readFileSync(root+'/js/study-core.js','utf8'));continue;
 }
 const part=name==='BUNDLED_MODULES'?code.slice(code.indexOf('const BUNDLED_MODULES='),code.indexOf('const STORES=')):code.match(new RegExp('const '+name+'=([^\\n]+);'))[0];assert.equal(crypto.createHash('sha256').update(part).digest('hex'),hash,name+' authoritative data or engine changed');
}
(async()=>{
 const stores=vm.runInNewContext(code.match(/const STORES=([^\n]+);/)[1]);
 const records=new Map(stores.map(store=>[store,new Map()]));
 const fixture={subjects:{id:'savedSubject',name:'My subject'},notes:{id:'n1',title:'My note',body:'Saved content'},progress:{id:'q:q1',attempts:[{selected:2,correct:false}]},flashcards:{id:'f1',front:'Question',back:'Answer',reps:4,due:'2026-10-03'},annotations:{id:'a1',materialId:'m1',points:[{x:.2,y:.8}],color:'#ff0'},materials:{id:'m1',name:'saved.pdf',blob:new Blob(['%PDF fixture bytes'])},meta:{id:'sharedStudy:hospital-pharmacy-midterms',value:{moduleId:'hospital-pharmacy-midterms',mode:'strict',records:{'mcq:1':{mastered:true,attempts:9}}}}};
 for(const [store,row]of Object.entries(fixture))records.get(store).set(row.id,structuredClone(row));
 for(let i=0;i<2500;i++)records.get('notes').set('bulk'+i,{id:'bulk'+i,body:'Large library entry '+i});
 let opens=0,upgrades=0;
 const db={objectStoreNames:{contains:s=>records.has(s)},createObjectStore(){upgrades++;throw Error('Existing schema must not be recreated')},transaction(name){const tx={};tx.objectStore=()=>({get(id){const request={};queueMicrotask(()=>{request.result=structuredClone(records.get(name).get(id));request.onsuccess()});return request},getAll(){const request={};queueMicrotask(()=>{request.result=structuredClone([...records.get(name).values()]);request.onsuccess()});return request}});return tx}};
 const context={indexedDB:{open(name,version){assert.equal(name,'PersonalStudyLibrary');assert.equal(version,3);opens++;const request={};queueMicrotask(()=>{request.result=db;request.onsuccess()});return request}},STORES:stores,document:{getElementById(){return null}}};vm.createContext(context);
 const layer=code.slice(code.indexOf('const Storage={'),code.indexOf('/* ----------------------------- Lightweight preferences'));
 vm.runInContext(layer+';globalThis.savedStorage=Storage',context);
 await context.savedStorage.init();await context.savedStorage.init();assert.equal(opens,2);assert.equal(upgrades,0);
 for(const [store,row]of Object.entries(fixture)){const saved=await context.savedStorage.get(store,row.id);if(saved.blob)assert.equal(await saved.blob.text(),await row.blob.text());else assert.deepEqual(saved,row)}
 assert.equal((await context.savedStorage.all('notes')).length,2501);
 console.log('PASS: original academic payloads, adapters, styles and stores unchanged; recoverable engine baseline and synchronized new sources; DB version unchanged; notes, quiz/mastery, cards, annotations and PDF Blob survive; 2,501 notes accessible.');
})().catch(error=>{console.error(error);process.exitCode=1});
