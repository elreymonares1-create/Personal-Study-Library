const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
function boot(kind='quiz'){
 const elements=new Map(),meta=new Map(),calls=[],handlers={};
 const state={view:'topic',subjectId:'s1',topicId:'t1',topicTool:'reader',materialId:'pdf1',quizSession:{setId:'qset',questions:[{id:'q1',options:['B','A'],correct:1}],index:0,answers:{q1:1},checked:{q1:true}},cardSession:{setId:'cset',cards:[{id:'c1',front:'F',back:'B'}],index:0,flipped:true}};
 const form={querySelector(){return null}};elements.set('sheetHost',form);if(kind==='quiz')elements.set('quizStudy',{});if(kind==='cards')elements.set('flashStudy',{});
 const frameDoc={querySelector(){return null},addEventListener(type,fn){handlers['frame:'+type]=fn}};
 if(kind==='module')elements.set('moduleLaunchFrame',{contentDocument:frameDoc,contentWindow:{document:frameDoc,StudyApp:{data:{view:'exam'}},async studyFlush(){calls.push('module-flush')}}});
 const ctx={console,Promise,structuredClone,Date,Event,State:state,PdfReader:{materialId:'pdf1',drawing:false,erasing:false},drawing:false,activeCombinedModuleId:kind==='module'?'hospital-pharmacy-midterms':null,studyBaseReady:new Promise(()=>{}),STUDY_APP_BUILD:{version:'test',revision:'12345678'},document:{getElementById:id=>elements.get(id)||null,addEventListener(type,fn){handlers[type]=fn}},Storage:{async get(store,id){return {id,name:id}}},async getMeta(key,def){return meta.get(key)||def},async setMeta(key,value){calls.push('snapshot');meta.set(key,structuredClone(value))},now:()=>new Date().toISOString(),async render(){calls.push('render')},async launchModule(id){calls.push('launch:'+id)},openSheet(name,html){calls.push('sheet:'+name);if(html.includes('quizStudy'))elements.set('quizStudy',{});if(html.includes('flashStudy'))elements.set('flashStudy',{})},renderQuizStudy(){calls.push('render-quiz')},renderFlashStudy(){calls.push('render-cards')},pdfSaveReaderState(){calls.push('pdf-position')},async renderSettings(){},StudyDataSafety:{async flush(){calls.push('flush')},report(error){throw error}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/js/integration.js','utf8'),ctx);return {ctx,elements,meta,calls,handlers,frameDoc};
}
(async()=>{
 for(const kind of ['quiz','cards','module']){
  const t=boot(kind);await t.ctx.StudyPWAIntegration.saveBeforeUpdate();assert(t.calls.indexOf('flush')<t.calls.indexOf('snapshot'));assert(t.meta.has('pwaResume:v1'));
  if(kind==='module')assert(t.calls.indexOf('module-flush')<t.calls.indexOf('snapshot'));
  const saved=t.meta.get('pwaResume:v1');t.ctx.State.quizSession=null;t.ctx.State.cardSession=null;await t.ctx.StudyPWAIntegration.restore();assert(t.meta.get('pwaResume:v1').consumed);
  if(kind==='quiz'){assert.equal(t.ctx.State.quizSession.answers.q1,1);assert.deepEqual(Array.from(t.ctx.State.quizSession.questions[0].options),['B','A']);assert(t.calls.includes('render-quiz'))}
  if(kind==='cards'){assert(t.ctx.State.cardSession.flipped);assert(t.calls.includes('render-cards'))}
  if(kind==='module')assert(t.calls.includes('launch:hospital-pharmacy-midterms'));
  assert(!saved.consumed);
 }
 const drawing=boot();drawing.ctx.PdfReader.drawing=true;await assert.rejects(drawing.ctx.StudyPWAIntegration.saveBeforeUpdate(),/drawing stroke/);assert(!drawing.meta.size);
 const draft=boot();draft.elements.get('sheetHost').querySelector=()=>true;draft.elements.get('sheetHost').querySelector=selector=>selector.includes('input')?{}:null;await assert.rejects(draft.ctx.StudyPWAIntegration.saveBeforeUpdate(),/Save or close/);assert(!draft.meta.size);
 const failed=boot('module');failed.elements.get('moduleLaunchFrame').contentWindow.studyFlush=async()=>{throw Error('Module save failed')};await assert.rejects(failed.ctx.StudyPWAIntegration.saveBeforeUpdate(),/Module save failed/);assert(!failed.meta.size);
 const pointer=boot('module');pointer.handlers.load({target:{tagName:'IFRAME',contentDocument:pointer.frameDoc}});pointer.handlers['frame:pointerdown']({target:{tagName:'CANVAS'},pointerId:7});await assert.rejects(pointer.ctx.StudyPWAIntegration.saveBeforeUpdate(),/drawing stroke/);pointer.handlers['frame:pointerup']({pointerId:7});await pointer.ctx.StudyPWAIntegration.saveBeforeUpdate();
 console.log('PASS: main quiz/card question order, selected answers and position restore; module state flush and resume; PDF position flush; unsaved forms, active main/module strokes and failed module saves block reload.');
})().catch(error=>{console.error(error);process.exitCode=1});
