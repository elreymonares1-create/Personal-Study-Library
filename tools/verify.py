from pathlib import Path
import hashlib,json,re,subprocess,struct
from urllib.parse import urljoin
ROOT=Path(__file__).resolve().parents[1]
def verify():
    manifest=json.loads((ROOT/'manifest.webmanifest').read_text())
    for key in ['name','short_name','id','start_url','scope','display','theme_color','background_color','icons']:assert key in manifest,key
    assert manifest['display']=='standalone'
    for scope in ['https://example.test/','https://example.test/REPOSITORY/']:
        for key in ['id','start_url','scope']:assert urljoin(scope,manifest[key]).startswith(scope)
        for icon in manifest['icons']:assert urljoin(scope,icon['src']).startswith(scope)
    for icon in manifest['icons']:
        p=ROOT/icon['src'];raw=p.read_bytes();width,height=struct.unpack('>II',raw[16:24]);assert icon['sizes']==f'{width}x{height}'
    for path in (ROOT/'js').glob('*.js'):subprocess.run(['node','--check',str(path)],check=True,capture_output=True)
    subprocess.run(['node','--check',str(ROOT/'service-worker.js')],check=True,capture_output=True)
    index=(ROOT/'index.html').read_text()
    assert 'manifest.webmanifest' in index and 'theme-color' in index
    assert '<style' not in index and '<script>' not in index
    for link in re.findall(r'(?:src|href)="(\.\/[^"?#]+)',index):assert (ROOT/link).is_file(),link
    assets=json.loads((ROOT/'precache-manifest.js').read_text().split('self.STUDY_APP_ASSETS = ',1)[1].rstrip(';\n'))
    for asset in assets:
        p=ROOT/asset['path'];assert p.is_file(),p
        assert hashlib.sha256(p.read_bytes()).hexdigest()==asset['sha256'],p
        assert p.relative_to(ROOT).parts[0] in ['index.html','manifest.webmanifest','offline.html','js','css','assets']
    for name,expected in {'pdf.min.js':'c31b6ab62a57edd79441ca939bb7e18fc1b09c63','pdf.worker.min.js':'12242260905b0f82831f735be91e231d17a1a57d'}.items():
        data=(ROOT/'assets/pdfjs'/name).read_bytes();assert hashlib.sha1(('blob '+str(len(data))+'\0').encode()+data).hexdigest()==expected,name
    code=(ROOT/'js/app.js').read_text();assert "indexedDB.open('PersonalStudyLibrary',3)" in code
    worker=(ROOT/'service-worker.js').read_text();assert 'indexedDB.' not in worker and 'localStorage.' not in worker
    assert 'deleteDatabase(' not in worker and '.clear(' not in worker
    assert 'StudyLocalPDF.load()' in code and 'StudyLocalPDF.documentOptions()' in code
    assert '3.11.174' in (ROOT/'assets/pdfjs/pdf.min.js').read_text()
    print(f'PASS: manifest, {len(assets)} asset checksums, root/repository paths, icons, script syntax, unchanged DB version and local PDF wiring.')
if __name__=='__main__':verify()
