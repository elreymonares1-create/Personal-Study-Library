/* Best-effort platform recognition; actual capabilities and viewport drive layout. */
(()=>{
 function detect(nav,screenInfo,width,height){
  const ua=nav.userAgent||'',platform=nav.userAgentData?.platform||nav.platform||'';
  const ipad=/iPad/i.test(ua)||(/Mac/i.test(platform)&&(nav.maxTouchPoints||0)>1);
  const ios=ipad||/iPhone|iPod/i.test(ua),android=/Android/i.test(ua)||/Android/i.test(platform);
  const os=ios?'iOS / iPadOS':android?'Android':/Win/i.test(platform)?'Windows':/Mac/i.test(platform)?'macOS':/Linux/i.test(platform)?'Linux':'Unknown platform';
  const tablet=ipad||(android&&(!/Mobile/i.test(ua)||Math.min(screenInfo.width||width,screenInfo.height||height)>=600));
  const touch=(nav.maxTouchPoints||0)>0;
  const device=tablet?'tablet':ios||android&&(/Mobile/i.test(ua)||nav.userAgentData?.mobile)?'phone':touch&&Math.min(screenInfo.width||width,screenInfo.height||height)>=600?'tablet':'desktop';
  const layout=width<600?'phone':width<1000||device==='tablet'?'tablet':'desktop';
  return{os,device,layout,orientation:width>height?'landscape':'portrait',touch};
 }
 function refresh(){const info=detect(navigator,screen,innerWidth,innerHeight),root=document.documentElement;root.dataset.platform=info.os.startsWith('iOS')?'ios':info.os.toLowerCase();root.dataset.device=info.device;root.dataset.layout=info.layout;root.dataset.orientation=info.orientation;window.StudyDevice.info=info;const status=document.getElementById('studyDeviceStatus');if(status)status.textContent=info.os+' · '+info.device+' · '+info.orientation+' · '+info.layout+' layout';for(const frame of document.querySelectorAll('iframe')){try{const child=frame.contentDocument?.documentElement;if(child){child.dataset.platform=root.dataset.platform;child.dataset.device=info.device;child.style.setProperty('--study-touch-target','44px')}}catch(_){}}}
 window.StudyDevice={detect,info:null,refresh};refresh();let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(refresh,120)});addEventListener('orientationchange',refresh);document.addEventListener('load',e=>{if(e.target.tagName==='IFRAME')refresh()},true);
 const settings=renderSettings;renderSettings=async function(main){await settings(main);const about=document.getElementById('pwaAbout');if(about)about.insertAdjacentHTML('beforeend','<p class="muted small" id="studyDeviceStatus"></p>'+ (StudyDevice.info.os.startsWith('iOS')?'<p class="muted small">To install on iPhone or iPad: open this address in Safari → Share → Add to Home Screen.</p>':''));refresh()};
 // Delegate primary file taps without firing secondary three-dot actions.
 document.addEventListener('click',e=>{const menu=e.target.closest('[data-material-menu]');if(menu){openMaterialMenu(menu.dataset.materialMenu).catch(error=>toast(error.message));return}const file=e.target.closest('[data-open-material]'),module=e.target.closest('[data-open-module]');if(file)openMaterial(file.dataset.openMaterial).catch(error=>toast(error.message));else if(module)launchModule(module.dataset.openModule).catch(error=>toast(error.message))});
})();
