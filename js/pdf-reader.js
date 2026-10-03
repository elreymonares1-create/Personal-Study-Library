/* Local PDF.js 3.11.174. The original scrolling, rendering and annotation engine is retained. */
(() => {
 let pending;
 const base=new URL('../assets/pdfjs/',document.currentScript.src);
 window.StudyLocalPDF={
  load(){
   if(window.pdfjsLib?.version === '3.11.174'){window.pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('pdf.worker.min.js',base).href;return Promise.resolve(window.pdfjsLib)}
   if(pending)return pending;
   pending=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=new URL('pdf.min.js',base).href;
    script.onload=()=>{if(!window.pdfjsLib)return reject(new Error('Local PDF library did not initialize.'));window.pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('pdf.worker.min.js',base).href;resolve(window.pdfjsLib)};
    script.onerror=()=>{script.remove();reject(new Error('The local PDF engine is unavailable. Finish downloading the app online, then retry. Your PDF remains saved on this device.'))};
    document.head.appendChild(script);
   }).catch(error=>{pending=null;throw error});
   return pending;
  },
  documentOptions(){return {cMapUrl:new URL('cmaps/',base).href,cMapPacked:true,standardFontDataUrl:new URL('standard_fonts/',base).href,isEvalSupported:false}}
 };
})();
