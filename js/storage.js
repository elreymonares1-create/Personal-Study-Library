/* Adds commit-aware writes and explicit flushes. Database schema and keys stay unchanged. */
(() => {
 'use strict';
 const tasks = new Set(), delayed = new Map();
 const failures = new Map();
 function message(error) {
  if(error?.name === 'QuotaExceededError') return 'Device storage is full. Your saved library has not been cleared. Export a backup and free device space before saving again.';
  if(error?.name === 'SecurityError' || error?.name === 'InvalidStateError') return 'Local storage is unavailable. Use a regular browser window, allow site storage, and keep your original backup.';
  return 'Could not save local study data. Keep this page open and retry or export a backup. '+(error?.message || '');
 }
 function report(error,key='unhandled') {
  if(![...failures.values()].includes(error))failures.set(key,error);
  window.StudyPWA?.notice(message(error),true);
  const host=document.getElementById('pwaStorageError');
  if(host){host.hidden=false;host.querySelector('p').textContent=message(error)}
  console.error('Study storage:',error);
 }
 function track(promise,key) {
  tasks.add(promise);
  promise.then(()=>{tasks.delete(promise);if(key)failures.delete(key)},error=>{tasks.delete(promise);report(error,key||'unhandled')});
  return promise;
 }
 function run(key) {
  const entry=delayed.get(key);if(!entry)return Promise.resolve();
  clearTimeout(entry.timer);delayed.delete(key);
  return track(Promise.resolve().then(entry.save),'debounce:'+key);
 }
 function debounce(key,save,delay=350) {
  clearTimeout(delayed.get(key)?.timer);
  delayed.set(key,{save,timer:setTimeout(()=>run(key).catch(()=>{}),delay)});
 }
 async function flush() {
  await Promise.all([...delayed.keys()].map(run));
  while(tasks.size)await Promise.all([...tasks]);
  if(failures.size)throw failures.values().next().value;
 }
 function install(storage) {
  for(const operation of ['put','del'])storage[operation]=function(name,value){
   const object=operation==='put'?value:null;if(object)object.updatedAt=now();
   setSave('Saving…',false);
   const promise=new Promise((resolve,reject)=>{
    let tx;try{tx=this.db.transaction(name,'readwrite');if(object)tx.objectStore(name).put(object);else tx.objectStore(name).delete(value)}catch(error){reject(error);return}
    tx.oncomplete=()=>{setSave('Saved locally',true);resolve(object || undefined)};
    tx.onerror=()=>reject(tx.error || new Error('Storage transaction failed'));
    tx.onabort=()=>reject(tx.error || new Error('Storage transaction was interrupted'));
   });
   return track(promise,operation+':'+name+':'+(object?.id||value));
  };
 }
 window.StudyDataSafety={install,track,debounce,flush,report,hasPending:()=>tasks.size>0||delayed.size>0};
 window.addEventListener('error',event=>{if(['QuotaExceededError','SecurityError'].includes(event.error?.name))report(event.error)});
 window.addEventListener('unhandledrejection',event=>{
  if(['QuotaExceededError','SecurityError','AbortError','UnknownError'].includes(event.reason?.name))report(event.reason);
 });
})();
