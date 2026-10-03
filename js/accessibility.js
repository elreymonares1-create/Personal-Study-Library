/* Incremental accessibility for the existing tablet bottom sheets. */
(()=>{
 let previous=null,active=null;
 const host=document.getElementById('sheetHost');if(!host)return;
 const focusable=sheet=>[...sheet.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
 new MutationObserver(()=>{const sheet=host.querySelector('.sheet');if(sheet===active)return;if(sheet){previous=document.activeElement;active=sheet;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('tabindex','-1');const title=sheet.querySelector('h2');if(title){title.id='activeSheetTitle';sheet.setAttribute('aria-labelledby',title.id)}const close=sheet.querySelector('.sheet-head button');close?.setAttribute('aria-label','Close dialog');(focusable(sheet)[0]||sheet).focus()}else{active=null;if(previous?.isConnected)previous.focus();previous=null}}).observe(host,{childList:true});
 document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'){e.preventDefault();closeSheet();return}if(e.key!=='Tab')return;const list=focusable(active);if(!list.length){e.preventDefault();active.focus();return}const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
 const toastHost=document.getElementById('toastHost');toastHost?.setAttribute('role','status');toastHost?.setAttribute('aria-live','polite');
})();
