/* Waiting-worker updates: no forced refresh during study, on install or after Later. */
(() => {
 'use strict';
 const base=new URL('./',document.baseURI),dismissKey='study-pwa:later:'+base.pathname;
 let registration=null,candidate=null,readyBuild=null,installEvent=null,applying=false,reloaded=false,lastCheck=0,offlineReady=false,errorText='';
 const host=document.createElement('div');host.className='pwa-messages';host.innerHTML=`<section class="pwa-banner" id="pwaUpdateBanner" hidden aria-live="polite"><strong>New Study Library update available</strong><p id="pwaBannerDetail"></p><div class="chips"><button class="btn" id="pwaLater">Later</button><button class="btn primary" id="pwaUpdateNow">Update Now</button></div></section><section class="pwa-banner pwa-error" id="pwaStorageError" hidden role="alert"><strong>Study Library needs attention</strong><p></p><button class="btn" id="pwaStorageDismiss">Dismiss</button></section>`;document.body.appendChild(host);
 const $=id=>document.getElementById(id);
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function notice(text,isError=false){if(isError){$('pwaStorageError').hidden=false;$('pwaStorageError').querySelector('p').textContent=text}else if(typeof toast==='function')toast(text)}
 function request(worker,type,timeout=4000){return new Promise((resolve,reject)=>{if(!worker)return reject(Error('No active app worker.'));const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(Error('Update service did not respond.'))},timeout);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data)};worker.postMessage({namespace:'study-pwa',type},[channel.port2])})}
 async function offer(worker){candidate=worker;try{readyBuild=await request(worker,'GET_VERSION')}catch(_){readyBuild=null}refreshSettings();const dismissed=(()=>{try{return sessionStorage.getItem(dismissKey)}catch(_){return null}})();if(dismissed!==(readyBuild?.revision||'waiting')){const detail=readyBuild?.version?'Version '+readyBuild.version+' is ready. ':'';$('pwaBannerDetail').textContent=detail+(window.StudyPWAIntegration?.activity()||'Choose when to save and restart.');$('pwaUpdateBanner').hidden=false}}
 async function check(manual=false){
  if(!registration){if(manual)notice(errorText||'Updates require this app to be served over HTTPS or localhost.');return}
  if(!navigator.onLine){if(manual)notice('Internet connection required to check for updates.');return}
  if(!manual&&Date.now()-lastCheck<60000)return;lastCheck=Date.now();
  try{
   await registration.update();
   if(registration.installing){if(manual)notice('Downloading and checking the update. You can keep studying.');return}
   if(registration.waiting){await offer(registration.waiting);if(manual){$('pwaUpdateBanner').hidden=false;notice('Update ready. Choose Update Now when you are ready.')}return}
   const active=await request(registration.active,'GET_VERSION');offlineReady=true;
   if(active.revision!==STUDY_APP_BUILD.revision){await offer(registration.active);if(manual)$('pwaUpdateBanner').hidden=false}
   else{readyBuild=null;candidate=null;errorText='';refreshSettings();if(manual)notice("You're up to date.")}
  }catch(error){errorText='Could not check for updates. The current app is still available.';refreshSettings();if(manual)notice(errorText)}
 }
 function reloadOnce(){if(reloaded)return;reloaded=true;location.reload()}
 async function apply(){
  if(applying)return;
  const worker=registration?.waiting||candidate;
  if(!worker){notice('No update is waiting. Check for Updates first.');return}
  applying=true;document.body.classList.add('pwa-saving');$('pwaUpdateNow').disabled=true;
  try{
   $('pwaBannerDetail').textContent='Saving your local study state before restarting…';
   if(!window.StudyPWAIntegration)throw Error('The app is still loading. Wait before updating.');
   await window.StudyPWAIntegration.saveBeforeUpdate();
   try{sessionStorage.removeItem(dismissKey)}catch(_){}
   if(registration.waiting){
    // Only an explicit Update Now click reaches this skipWaiting message.
    registration.waiting.postMessage({namespace:'study-pwa',type:'SKIP_WAITING'});
    setTimeout(()=>{if(!reloaded){applying=false;document.body.classList.remove('pwa-saving');$('pwaUpdateNow').disabled=false;notice('Activation is taking longer than expected. Your saved state is safe; try Update Now again.')}},15000);
   }else reloadOnce();
  }catch(error){applying=false;document.body.classList.remove('pwa-saving');$('pwaUpdateNow').disabled=false;notice(error.message,true);$('pwaBannerDetail').textContent='Update ready. Finish saving your work, then try again.'}
 }
 function later(){try{sessionStorage.setItem(dismissKey,readyBuild?.revision||'waiting')}catch(_){}$('pwaUpdateBanner').hidden=true;refreshSettings()}
 async function storageStatus(){
  const persistent=await navigator.storage?.persisted?.().catch(()=>false),estimate=await navigator.storage?.estimate?.().catch(()=>null);
  if($('pwaPersistenceStatus'))$('pwaPersistenceStatus').textContent='Persistent storage: '+(persistent?'Enabled':'Browser-managed');
  if($('pwaStorageEstimate'))$('pwaStorageEstimate').textContent=estimate?`${Math.round((estimate.usage||0)/1048576)} MB used of approximately ${Math.round((estimate.quota||0)/1048576)} MB browser quota`:'Storage estimates are unavailable in this browser.';
  if($('pwaProtectStorage'))$('pwaProtectStorage').disabled=!!persistent||!navigator.storage?.persist;
 }
 function refreshSettings(){
  if($('pwaUpdateStatus'))$('pwaUpdateStatus').textContent=readyBuild?`Version ${readyBuild.version||'new'} is ready.`:errorText||(!registration?'Update service is starting…':"You're up to date.");
  if($('pwaSettingsUpdate'))$('pwaSettingsUpdate').hidden=!candidate;
  if($('pwaInstall'))$('pwaInstall').hidden=!installEvent||installed();
  if($('pwaOfflineStatus'))$('pwaOfflineStatus').textContent=offlineReady?'Offline app is ready. Your saved library uses device storage.':'Offline app is not ready yet. Connect once and keep this page open until setup finishes.';
  storageStatus().catch(()=>{});
 }
 async function protectStorage(){if(!navigator.storage?.persist)return notice('This browser manages storage automatically. Export backups regularly.');try{const granted=await navigator.storage.persist();await storageStatus();notice(granted?'Persistent storage enabled. Keep exporting backups.':'The browser is managing storage. Your data remains saved; keep a separate backup.')}catch(error){notice('Could not enable persistent storage: '+error.message)}}
 async function install(){if(!installEvent||installed())return;const event=installEvent;installEvent=null;await event.prompt();await event.userChoice;refreshSettings()}
 window.StudyPWA={check,apply,install,protectStorage,refreshSettings,notice};
 $('pwaLater').onclick=later;$('pwaUpdateNow').onclick=apply;$('pwaStorageDismiss').onclick=()=>{$('pwaStorageError').hidden=true};
 addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;refreshSettings()});addEventListener('appinstalled',()=>{installEvent=null;refreshSettings()});
 if(!('serviceWorker' in navigator)||!isSecureContext){errorText='PWA installation and updates require HTTPS or localhost. Personal study data has not been changed.';refreshSettings();return}
 navigator.serviceWorker.addEventListener('message',event=>{
  if(event.data?.namespace!=='study-pwa')return;
  if(event.data.type==='GET_CLIENT_BUILD'){event.ports[0]?.postMessage(STUDY_APP_BUILD);return}
  if(event.data.type==='UPDATE_READY'&&registration?.waiting)offer(registration.waiting);
 });
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying){reloadOnce();return}if(registration){offlineReady=true;request(registration.active,'GET_VERSION').then(info=>{if(info.revision!==STUDY_APP_BUILD.revision)offer(registration.active);else refreshSettings()}).catch(()=>{})}});
 navigator.serviceWorker.register(new URL('service-worker.js',base).href,{scope:base.href,updateViaCache:'none'}).then(async reg=>{
  registration=reg;
  reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{
   if(worker.state==='installed'&&reg.active)offer(worker);
   if(worker.state==='redundant'){errorText='The update could not finish downloading. Your current app and study data remain available.';refreshSettings()}
  })});
  if(reg.waiting)await offer(reg.waiting);
  const ready=await navigator.serviceWorker.ready;offlineReady=!!ready.active;refreshSettings();ready.active?.postMessage({namespace:'study-pwa',type:'CLEAN_APP_CACHES'});
  if(!reg.waiting)check(false);
 }).catch(error=>{errorText='Offline setup failed: '+error.message+'. Keep using the app online and retry later.';refreshSettings();notice(errorText,true)});
 addEventListener('online',()=>check(false));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check(false)});setInterval(()=>{if(document.visibilityState==='visible')check(false)},10*60*1000);
})();
