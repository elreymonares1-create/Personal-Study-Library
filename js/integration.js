/* Small bridge to the authoritative application. No schema upgrade or content replacement. */
(() => {
 'use strict';
 const RESUME_KEY='pwaResume:v1', activeStrokes=new Set(), boundFrames=new WeakSet();
 function bindFrame(frame){try{const doc=frame.contentDocument;if(!doc||boundFrames.has(doc))return;boundFrames.add(doc);doc.addEventListener('pointerdown',event=>{if(event.target.tagName==='CANVAS')activeStrokes.add(event.pointerId)},true);for(const name of ['pointerup','pointercancel','lostpointercapture'])doc.addEventListener(name,event=>activeStrokes.delete(event.pointerId),true)}catch(_){}}
 document.addEventListener('load',event=>{if(event.target.tagName==='IFRAME')bindFrame(event.target)},true);
 function activeModule(){return (document.getElementById('moduleLaunchFrame')||document.getElementById('topicStudyFrame'))?.contentWindow}
 function editorOpen(){
  const sheet=document.getElementById('sheetHost');
  return !!sheet?.querySelector('input:not([type=checkbox]):not([type=range]):not([type=color]),textarea')&&!sheet.querySelector('#editNoteTitle,#quizStudy,#flashStudy');
 }
 function checkSafety(){
  const frame=activeModule();
  if(activeStrokes.size)throw Error('Finish the current drawing stroke before updating.');
  if((typeof PdfReader!=='undefined'&&(PdfReader.drawing||PdfReader.erasing))||(typeof drawing!=='undefined'&&drawing))throw Error('Finish the current drawing stroke before updating.');
  if(frame?.document?.querySelector('[data-action="close-sheet"]') && frame.document.querySelector('#studySheetHost textarea,#studySheetHost input'))throw Error('Save or close the module editor before updating.');
  if(editorOpen())throw Error('Save or close the current form before updating.');
 }
 function activity(){
  const frame=activeModule();
  if(frame?.StudyApp?.data?.view==='exam'||State.quizSession&&document.getElementById('quizStudy'))return 'Your current quiz or exam will be saved before restarting.';
  if(frame?.StudyApp || State.cardSession&&document.getElementById('flashStudy'))return 'Your current study session will be saved before restarting.';
  return 'Choose when to save your work and restart. Your data stays on this device.';
 }
 async function saveBeforeUpdate(){
  checkSafety();
  const frame=activeModule();
  // Refuse to reload an open module if its persistence engine is not ready yet.
  if(frame){if(typeof frame.studyFlush!=='function')throw Error('The module is still loading. Wait for it to open before updating.');await frame.studyFlush()}
  if(document.getElementById('editNoteTitle'))document.getElementById('editNoteTitle').dispatchEvent(new Event('input',{bubbles:true}));
  if(typeof PdfReader!=='undefined'&&PdfReader.materialId)pdfSaveReaderState();
  await StudyDataSafety.flush();
  const resume={savedAt:now(),consumed:false,view:State.view,subjectId:State.subjectId,topicId:State.topicId,topicTool:State.topicTool,materialId:State.materialId,topicStudy:document.getElementById('topicStudyFrame')?frame.StudyApp?.data.view:null,moduleId:typeof activeCombinedModuleId!=='undefined'?activeCombinedModuleId:null,quiz:document.getElementById('quizStudy')?structuredClone(State.quizSession):null,cards:document.getElementById('flashStudy')?structuredClone(State.cardSession):null};
  await setMeta(RESUME_KEY,resume);await StudyDataSafety.flush();
 }
 async function restore(){
  const resume=await getMeta(RESUME_KEY,null);if(!resume||resume.consumed)return;
  if(resume.subjectId&&!(await Storage.get('subjects',resume.subjectId)))return;
  if(resume.topicId&&!(await Storage.get('topics',resume.topicId)))return;
  State.subjectId=resume.subjectId;State.topicId=resume.topicId;State.topicTool=resume.topicTool;State.materialId=resume.materialId;State.view=resume.view||'home';await render();
  if(resume.topicStudy)await openTopicStudy(resume.topicId,resume.topicStudy);
  else if(resume.moduleId)await launchModule(resume.moduleId,true);
  else if(resume.quiz){State.quizSession=resume.quiz;const set=await Storage.get('quizSets',resume.quiz.setId);openSheet(set?.name||'Quiz', '<div id="quizStudy"></div>');renderQuizStudy()}
  else if(resume.cards){State.cardSession=resume.cards;const set=await Storage.get('flashcardSets',resume.cards.setId);openSheet(set?.name||'Flashcards','<div id="flashStudy"></div>');renderFlashStudy()}
  await setMeta(RESUME_KEY,{...resume,consumed:true});
 }
 const previousSettings=renderSettings;
 renderSettings=async function(main){
  await previousSettings(main);
  main.querySelector('.h1')?.insertAdjacentHTML('afterend',`<div class="card" id="pwaAbout"><div class="h3">App information</div><p class="muted">Personal Study Library · Version ${esc(STUDY_APP_BUILD.version)} <span class="small">(${esc(STUDY_APP_BUILD.revision.slice(0,8))})</span></p><p class="muted small" id="pwaUpdateStatus">Checking update status…</p><div class="chips"><button class="btn" id="pwaCheckUpdates">Check for Updates</button><button class="btn primary" id="pwaSettingsUpdate" hidden>Update Now</button><button class="btn" id="pwaInstall" hidden>Install Study Library</button></div><p class="muted small" id="pwaOfflineStatus">Preparing offline app…</p></div><div class="card"><div class="h3">Protect local study data</div><p class="muted" id="pwaPersistenceStatus">Checking browser storage…</p><p class="muted small" id="pwaStorageEstimate"></p><button class="btn" id="pwaProtectStorage">Protect Local Study Data</button><p class="muted small">Your PDFs, notes and progress stay in this browser. Export a backup before changing browser or website address.</p></div>`);
  document.getElementById('pwaCheckUpdates').onclick=()=>window.StudyPWA?.check(true);
  document.getElementById('pwaSettingsUpdate').onclick=()=>window.StudyPWA?.apply();
  document.getElementById('pwaInstall').onclick=()=>window.StudyPWA?.install();
  document.getElementById('pwaProtectStorage').onclick=()=>window.StudyPWA?.protectStorage();
  window.StudyPWA?.refreshSettings();
 };
 window.StudyPWAIntegration={saveBeforeUpdate,restore,activity};
})();
// Restore only the explicitly saved pre-update workspace after the original boot completes.
Promise.resolve(window.studyBaseReady).then(()=>StudyPWAIntegration.restore()).catch(error=>StudyDataSafety.report(error));
