const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const records=new Map([['subjects:s1',{id:'s1',name:'Saved subject'}],['annotations:a1',{id:'a1',points:[{x:.3,y:.4}]}]]),transactions=[],messages=[];
 const storage={db:{transaction(name){const tx={name,actions:[]};tx.objectStore=()=>({put:obj=>tx.actions.push({put:structuredClone(obj)}),delete:id=>tx.actions.push({del:id})});transactions.push(tx);return tx}}};
 function commit(tx){for(const act of tx.actions){if(act.put)records.set(tx.name+':'+act.put.id,act.put);else records.delete(tx.name+':'+act.del)}tx.oncomplete()}
 const ctx={window:null,document:{getElementById:()=>null},console:{error(){}},setTimeout,clearTimeout,now:()=>new Date().toISOString(),setSave(){},addEventListener(){}};ctx.window=ctx;ctx.StudyPWA={notice:(msg)=>messages.push(msg)};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/js/storage.js','utf8'),ctx);const safety=ctx.StudyDataSafety;safety.install(storage);
 let settled=false;const pending=storage.put('notes',{id:'n1',body:'My note'}).then(()=>settled=true);await Promise.resolve();assert(!settled,'request submission is not mistaken for transaction commit');commit(transactions.shift());await pending;
 safety.debounce('n1',()=>storage.put('notes',{id:'n1',body:'Last typed words'}),5000);const flush=safety.flush();await Promise.resolve();await Promise.resolve();commit(transactions.shift());await flush;assert.equal(records.get('notes:n1').body,'Last typed words');
 const failed=storage.put('notes',{id:'n2',body:'Needs retry'});const tx=transactions.shift();tx.error=Object.assign(Error('Disk full'),{name:'QuotaExceededError'});tx.onabort();await assert.rejects(failed);assert(messages.some(x=>x.includes('Device storage is full')));await assert.rejects(safety.flush());
 const unrelated=storage.put('meta',{id:'readerPosition',value:4});commit(transactions.shift());await unrelated;await assert.rejects(safety.flush(),'other successful writes cannot erase a failed save');
 const retry=storage.put('notes',{id:'n2',body:'Needs retry'});commit(transactions.shift());await retry;await safety.flush();assert.equal(records.get('subjects:s1').name,'Saved subject');assert.equal(records.get('annotations:a1').points[0].x,.3);
 console.log('PASS: writes wait for commit, pending note debounce flushes, quota/abort errors remain visible, failed saves block updates until retried, unrelated learner records remain intact.');
})().catch(error=>{console.error(error);process.exitCode=1});
