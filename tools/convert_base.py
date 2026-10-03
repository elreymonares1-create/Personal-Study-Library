"""One-time, intentionally small extraction from the authoritative portable HTML."""
from pathlib import Path
import re, hashlib, shutil, json
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent/'Personal_Study_Library_Simple_Reader.html'
def convert():
    source=BASE.read_text()
    scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',source)
    assert len(scripts)==1,'Unexpected base layout: review instead of guessing.'
    script=scripts[0]
    start=script.index('async function ensurePdfJs()');end=script.index('\n',start)
    script=script[:start]+'async function ensurePdfJs(){return StudyLocalPDF.load()}'+script[end:]
    script=script.replace('lib.getDocument({data:bytes})','lib.getDocument({data:bytes,...StudyLocalPDF.documentOptions()})')
    start=script.index('function pdfSaveReaderState()');end=script.index('\n',start)
    script=script[:start]+"function pdfSaveReaderState(){if(!PdfReader.materialId)return;const id=PdfReader.materialId,value={page:PdfReader.pageNumber,fitMode:PdfReader.fitMode,zoom:PdfReader.zoom,lastStudied:now()};StudyDataSafety.debounce('pdf-position:'+id,()=>setMeta('pdfReader:'+id,value),300)}"+script[end:]
    start=script.index('let readerPosTimer;function debounceReaderPos');end=script.index('\n',start)
    script=script[:start]+"function debounceReaderPos(mid,p){StudyDataSafety.debounce('reader-position:'+mid,()=>setMeta('reader:'+mid,p),500)}"+script[end:]
    # Keep the same note UI while making debounce callbacks flushable before an update.
    start=script.index('async function editNote(id)');end=script.index('\n',start)
    previous=script[start:end]
    a=previous.index('let tm;const save=');b=previous.index(';document.getElementById(\'editNoteTitle\').oninput=save',a)
    previous=previous[:a]+"const save=()=>{n.title=document.getElementById('editNoteTitle').value;n.body=document.getElementById('editNoteBody').value;document.getElementById('noteAutosave').textContent='Saving…';StudyDataSafety.debounce('note:'+id,async()=>{await Storage.put('notes',n);const x=document.getElementById('noteAutosave');if(x)x.textContent='Saved locally'},350)}"+previous[b:]
    script=script[:start]+previous+script[end:]
    script=script.replace("r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});", "r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>{const main=document.getElementById('main');if(main)main.innerHTML='<div class=card><h2>Storage is waiting</h2><p>Close older copies of Study Library, then reopen this page. Saved data has not been cleared.</p></div>'};});",1)
    script=script.replace("Prefs.data", "Prefs.data")
    # Malformed preferences must not prevent the whole app from opening. Preserve the original text.
    script=script.replace("data:JSON.parse(localStorage.getItem('psl_prefs_v1')||'{}'),", "data:(()=>{try{return JSON.parse(localStorage.getItem('psl_prefs_v1')||'{}')}catch(error){StudyDataSafety.report(error);return {}}})(),")
    script=script.replace('(async function boot(){try{',"StudyDataSafety.install(Storage);\nwindow.studyBaseReady=(async function boot(){try{")
    script=script.replace("Try opening this file in Chrome or Samsung Internet. IndexedDB availability can vary for local file URLs.","Allow site storage in a regular Chrome or Samsung Internet window. Your database has not been cleared. Export from your original working app if recovery is needed.")
    (ROOT/'js/app.js').write_text(script)
    styles=re.findall(r'<style[^>]*>([\s\S]*?)</style>',source)
    (ROOT/'css/app.css').write_text('\n'.join(styles))
    html=re.sub(r'<style[^>]*>[\s\S]*?</style>','',source)
    html=re.sub(r'<script[^>]*>[\s\S]*?</script>','',html)
    html=html.replace('</head>', '<meta name="theme-color" content="#3457d5">\n<link rel="manifest" href="./manifest.webmanifest">\n<link rel="icon" href="./assets/icons/icon-192.png">\n<link rel="apple-touch-icon" href="./assets/icons/icon-192.png">\n<link rel="stylesheet" href="./css/app.css">\n<link rel="stylesheet" href="./css/pwa.css">\n</head>')
    html=html.replace('</body>', '\n<script src="./js/version.js"></script>\n<script src="./js/storage.js"></script>\n<script src="./js/pdf-reader.js"></script>\n<script src="./js/app.js"></script>\n<script src="./js/integration.js"></script>\n<script src="./js/updater.js"></script>\n</body>')
    (ROOT/'index.html').write_text(html)
    (ROOT/'docs/base-fingerprint.json').write_text(json.dumps({'authoritative_base':BASE.name,'sha256':hashlib.sha256(BASE.read_bytes()).hexdigest(),'bytes':BASE.stat().st_size,'css_blocks':len(styles),'script_blocks':len(scripts),'database':'PersonalStudyLibrary','database_version':3},indent=2))
    print('Extracted existing CSS and main script without changing academic data.')
if __name__=='__main__':convert()
