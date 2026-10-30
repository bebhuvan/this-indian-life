#!/usr/bin/env python3
"""Fail closed on unreviewed numeric occurrences and recompute all reviewed metrics.
The review inventory records each field/offset/context; a matching value elsewhere
is never sufficient to approve an edited claim. Run the independent cell audit first.
"""
import csv,gzip,hashlib,json,math,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];A=ROOT/'data/audits/lrs-controls';Q='q.econ.lrs_controls'
NUMBER=re.compile(r'(?<!\d)\d+(?:,\d{3})*(?:\.\d+)*(?:-\d+)?')
def fields():
    out={'prose':(ROOT/f'data/prose/{Q}.md').read_text()}
    def walk(x,path):
        if isinstance(x,str):out[path]=x
        elif isinstance(x,list):
            for i,v in enumerate(x):walk(v,f'{path}[{i}]')
        elif isinstance(x,dict):
            for k,v in x.items():walk(v,f'{path}.{k}')
    walk(json.loads((ROOT/'scripts/stories/lrs-controls/chart_explainers.json').read_text()),'explainers')
    n=json.loads((ROOT/'scripts/stories/lrs-controls/notes.json').read_text())
    for k in ['title','standfirst','short','macha','caveats']:walk(n[k],f'notes.{k}')
    query="import {v1Questions} from './scripts/registry/v1-indicators.mjs';const q=v1Questions.find(q=>q.id==='q.econ.lrs_controls');console.log(JSON.stringify({question:q.question,keyNumbers:q.keyNumbers,visualPlan:q.visualPlan.map(v=>({title:v.title,subtitle:v.subtitle,why:v.why,read:v.read,watch:v.watch}))}));"
    walk(json.loads(subprocess.check_output(['node','--input-type=module','-e',query],cwd=ROOT)),'registry')
    return out
subprocess.run([sys.executable,str(ROOT/'scripts/stories/lrs-controls/verify_live_sources.py')],check=True)
subprocess.run([sys.executable,str(ROOT/'scripts/stories/lrs-controls/audit_independent.py')],check=True)
manifest=json.loads((ROOT/'data/raw/rbi-dbie-lrs-2026/manifest.json').read_text())
for entry in manifest['files']:
    raw=ROOT/'data/raw/rbi-dbie-lrs-2026'/entry['path']
    assert hashlib.sha256(raw.read_bytes()).hexdigest()==entry['sha256'], 'Raw manifest hash mismatch: '+entry['path']
F=fields();inventory=json.loads((A/'numeric-occurrence-review.json').read_text());expected=inventory['occurrences'];actual=[]
for name,value in F.items():
    for m in NUMBER.finditer(value):actual.append({'field':name,'offset':m.start(),'number':m.group(),'fieldSha256':hashlib.sha256(value.encode()).hexdigest()})
issues=[]
if actual!=[{k:e[k] for k in ['field','offset','number','fieldSha256']} for e in expected]:issues.append('Numeric occurrence/field context changed; occurrence review must be repeated.')
cell=json.loads((A/'independent-cell-audit.json').read_text());checks=cell['checks'];metrics=inventory['metrics']
cache={}
def evaluate(key):
    if key in cache:return cache[key]
    metric=metrics[key];kind=metric['kind']
    if kind=='artifact':
        matched=[c for c in checks if c['artifact']==metric['artifact'] and c['coordinate']==metric['coordinate']]
        assert len(matched)==1 and matched[0]['match'], 'Missing/mismatched source cell '+key
        v=matched[0]['expected']
    elif kind=='raw':
        source=metric['source'];path=ROOT/'data/raw/rbi-dbie-lrs-2026'/source['file']
        zipped=path.suffix=='.csv_gz';f=gzip.open(path,'rt') if zipped else path.open()
        with f:
            rows={i:r for i,r in enumerate(csv.DictReader(f,delimiter=';' if zipped else ','),2) if i in source['csvRows']}
        assert len(rows)==len(source['csvRows']), 'Missing source rows '+key
        column='Amount (in USD Million)' if zipped else 'value'
        v=sum(float(r[column]) for r in rows.values())/source['divisor']
        if source.get('absolute'):v=abs(v)
    elif kind=='derived':
        a,b=evaluate(metric['a']),evaluate(metric['b']);op=metric['operation'];v=(a/b if op=='ratio' else a-b if op=='difference' else a/b-1)*metric['factor']
    elif kind=='constant':v=metric['value']
    else:raise AssertionError('Uncovered metric type '+key)
    assert math.isclose(v,metric['value'],abs_tol=1e-6,rel_tol=0), 'Raw metric changed '+key
    cache[key]=v;return v
for key in metrics:
    try:evaluate(key)
    except (AssertionError,KeyError,ValueError) as exc:issues.append(str(exc))
for e in expected:
    if e['status']!='reviewed':issues.append('Unresolved occurrence '+e['field']+':'+str(e['offset']))
    for key in e['metricIds']:
        if key not in metrics:issues.append('Unknown metric '+key)
    if e['classification']=='measurement':
        literal=e['number'].replace(',','');digits=len(literal.split('.')[1]) if '.' in literal else 0
        if not any(key in cache and round(cache[key],digits)==float(literal) for key in e['metricIds']):issues.append('Written measurement differs from pinned source: '+e['field']+':'+literal)
ledger={'article':Q,'vintage':'Frozen RBI DBIE exports throughAugust2026, hashes in independent-cell-audit.json','note':'Context-locked occurrence review plus independent raw-to-artifact cell audit. Numeric review does not establish source authenticity.','evidenceBundle':{'sourceManifests':['data/raw/rbi-dbie-lrs-2026/manifest.json','data/raw/rbi-dbie-lrs-confirmation-20261030/manifest.json'],'artifactCatalog':'data/catalog/lrs-controls-manifest.json','repositoryFiles':[str(p.relative_to(ROOT)) for p in (ROOT/'scripts/stories/lrs-controls').glob('*') if p.is_file()]+['data/audits/lrs-controls/independent-cell-audit.json','data/audits/lrs-controls/numeric-occurrence-review.json','data/audits/lrs-controls/editorial-audit.md','data/audits/lrs-controls/verifier-mutation-probes.json','data/audits/lrs-controls/live-source-confirmation.json','data/audits/lrs-controls/fy2009-discrepancy-investigation.json','data/audits/lrs-controls/live-source-mutation-probes.json',f'data/prose/{Q}.md',f'data/explanations/en/{Q}.json',f'data/explanations/en/{Q}.evidence.json']},'numericOccurrences':len(actual),'issues':issues,'claims':expected,'publicationDecision':('ready: live RBI source confirmation and numeric gates pass; annual headline conflict disclosed' if not issues else 'hold: claim coverage failures')}
# Pin the complete reproducibility and visual-review bundle for release checks.
ledger['evidenceBundle']['repositoryFiles']=sorted(set(
    [str(p.relative_to(ROOT)) for folder in ['scripts/stories/lrs-controls','data/audits/lrs-controls']
     for p in (ROOT/folder).iterdir() if p.is_file() and p.name!='claim-ledger.json']
    + [f'data/prose/{Q}.md',f'data/explanations/en/{Q}.json',f'data/explanations/en/{Q}.evidence.json']
    + ['scripts/registry/v1-indicators.mjs', 'scripts/registry/source-notes.mjs', 'scripts/stories/audit-flagship-visuals.mjs', 'scripts/stories/check-almanac-unit-formats.mjs', 'scripts/audit-charts.mjs', 'src/data/almanac-visuals.ts', 'src/data/almanac.ts', 'src/data/figures.ts', 'docs/ALMANAC_DESIGN_SYSTEM.md', 'docs/DATA_INTEGRITY_GUARDRAILS.md', 'docs/FLAGSHIP_AUDIT_2026-10-30.md', 'data/audits/flagship-2026-10-30-release.json', 'data/audits/lrs-controls/final-focused-layout-audit.json']))
(A/'claim-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
print(f'{len(actual)} numeric occurrences; {cell["artifactNumericCellsChecked"]} raw-to-artifact cells; {len(issues)} coverage failures.')
for issue in issues:print('FAIL:',issue,file=sys.stderr)
sys.exit(bool(issues))
