#!/usr/bin/env python3
"""Audit every numeric occurrence and preserve the reviewed claim-to-source context.

Independent cell reconciliation runs first. Value matching is kept separate from
editorial interpretation: reviewed surface hashes prevent an unrelated occurrence
of the same number from silently acquiring a clean audit. New/changed surfaces
require an explicit documented re-review in reviewed-surfaces.json.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
import pandas as pd

ROOT=Path(__file__).resolve().parents[3]
A=ROOT/'data/audits/poverty-debate';R=ROOT/'data/raw/wb-3pr-2026';Q='q.econ.poverty_debate'
subprocess.run([sys.executable,str(ROOT/'scripts/stories/poverty-debate/audit_sources.py')],check=True)
rawaudit=json.loads((A/'independent-cell-audit.json').read_text())
E=json.loads((ROOT/f'data/explanations/en/{Q}.json').read_text())
X=json.loads((ROOT/'scripts/stories/poverty-debate/chart_explainers.json').read_text())
N=json.loads((ROOT/'scripts/stories/poverty-debate/notes.json').read_text())
registry=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {v1Questions} from './scripts/registry/v1-indicators.mjs'; console.log(JSON.stringify(v1Questions.find(q=>q.id==='q.econ.poverty_debate')))"],cwd=ROOT,text=True))
SURF={}
def collect(path,obj):
    if isinstance(obj,str):SURF[path]=obj
    elif isinstance(obj,list):
        for i,v in enumerate(obj):collect(f'{path}[{i}]',v)
    elif isinstance(obj,dict):
        for k,v in obj.items():collect(f'{path}.{k}',v)
body=(ROOT/f'data/prose/{Q}.md').read_text()
# Paragraph-level context, so narrative interpretation is reviewed with the numbers.
for i,t in enumerate(body.strip().split('\n\n')):SURF[f'prose.paragraph[{i}]']=t
collect('explainers',X);collect('notes',N)
for k in ['question','keyNumbers','visualPlan','parts']:collect('registry.'+k,registry[k])
# Confirm published fields cannot drift away from reviewed durable sources.
assert E['article']['bodyMarkdown']==body.strip()
assert E['short']==N['short'] and E['macha']==N['macha'] and E['caveats']==N['caveats']
assert E['article']['standfirst']==N['standfirst']
for e in E['chartExplainers']:
    for k,v in X[e['title']].items():assert e[k]==v,(e['title'],k,'explanation drift')

VALUES=[]
def val(v,source):
    if isinstance(v,(int,float)):
        VALUES.append((float(v),source))
for c in rawaudit['checks']:val(c['expected'],c['source'])
f=pd.read_stata(R/'Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta');f=f[f.code.eq('IND')]
for _,r in f.iterrows():
    for k in ['fgt0','poorpop','pop']:
        val(r[k],f'Country_FGT IND year={int(r.year)},povertyline={r.povertyline},{k}')
        if k=='poorpop':val(r[k]/1000,f'Country_FGT IND year={int(r.year)},povertyline={r.povertyline},poorpop million /1000 to billion')
p=pd.read_stata(R/'pip_20260922_2021_01_02_PROD.dta');p=p[p.country_code.eq('IND') & p.reporting_level.eq('national')]
for _,r in p.iterrows():
    for k in ['median','spl','pg','ppp','cpi']:val(r[k],f'PIP DTA IND national year={int(r.year)},{k}')
    for k in ['gini','decile10','spr']:val(r[k]*100,f'PIP DTA IND national year={int(r.year)},{k}*100')
for c in rawaudit['checks']:
    if 'idx_' in c['artifact']:val(c['expected']/100,c['source']+'; index /100 gives fold change')
for file,field in [('DataFig4D_2b.dta','empstat_23452024'),('DataFig4D_3b.dta','industrycat4_12024')]:
    d=pd.read_stata(R/file);d=d[d.code.eq('IND')]
    for _,r in d.iterrows():val(r[field],f'{file} IND level={r.level},{field}')
h=pd.read_stata(R/'DataFigB4_1_1.dta');h=h[h.code.eq('IND')]
for _,rr in h.iterrows():
    for cc in ['whours0','whours1']:val(rr[cc],f'DataFigB4_1_1.dta IND empstat={rr.empstat},{cc} unrounded source hours')
for axis_value in [0,25,50,75,100,40,60,80]:val(axis_value,'Chart axis tick/domain boundary, editorial display setting; not an observation')
# New comparable-round and SPID definitions; empirical selectors remain explicit.
s22=p[p.year.eq(2022)].iloc[0];s23=p[p.year.eq(2023)].iloc[0]
assert s22.comparable_spell==s23.comparable_spell=='2022 - 2023'
val((s23['mean']/s22['mean']-1)*100,'PIP DTA IND national mean2023/mean2022 minus1 *100; comparable_spell2022 - 2023')
# The independent auditor has already read and traced all 36 raw pairs. Reuse
# that verified result rather than parsing the large workbook twice per gate.
subgroups=rawaudit['subgroupPattern']
assert subgroups['matchedStates']==subgroups['higherChildShareStates']==36
assert all(q['childHigher'] and q['childSharePct']>q['allAgeSharePct'] for q in subgroups['pairs'])
val(36,'AM26_SPID_data.xlsx Data IND year2023 matched0-5vsALL pairs; poor830_child>poor830_ALL in all36')
val(2023.58,'AM26_SPID_data.xlsx Data IND year2023 ref_year2023.58 for matched0-5 andALL rows')
for value,source in [(0,'SPID source age-group0-5 lower bound'),(5,'SPID source age-group0-5 upper bound'),(.1,'decile share0.1 in decile-mean formula / bin approximate resolution0.1percentage point'),(.9,'hypothetical10percent real consumption loss factor0.9'),(10,'hypothetical uniform real consumption loss10percent assumption; not observed')]:val(value,source)
# Exact derivations that occur in text but are not plotted artifact cells.
b=pd.read_csv(R/'IND_GlobalDist1000bins_1990_2026.csv');b=b[b.year.eq(2024)]
val(((b.welf>=3)&(b.welf<8.3)).mean()*100,'IND_GlobalDist1000bins CSV2024 mean(3<=welf<8.3)*100')
val(4247-4122,'HCES press note rural MPCE with minus without:125rupees')
val(7078-6996,'HCES press note urban MPCE with minus without:82rupees')
val(86.71-56.47,'DataFig4D_1b IND level1 share lacking secondary 2003minus2024:30.24points')
cf=pd.read_stata(R/'DataFig4C_123.dta');cf=cf[cf.code.eq('IND')].iloc[0]
pop=float(f[f.year.eq(2024)&f.povertyline.round(2).eq(8.3)].iloc[0]['pop'])
val((cf.poor830-cf.poor_new830)/100*pop,'DataFig4C IND headcount difference/100 * Country_FGT IND2024 populationmillions, simulatedcount')
q={int(r['quantile']):r['welf'] for _,r in b.iterrows()}
val(q[800]-q[100],'IND_GlobalDist1000bins CSV2024 welf q800-q100')
rr=p[p.year.eq(2023)].iloc[0];rupee=float(rr.ppp*rr.cpi)
val(rupee,'PIP DTA2023 ppp*cpi: rupees per2021PPP dollar in survey-year prices')
for line in [3,4.2,8.3]:
    val(rupee*line,f'PIP DTA2023 ppp*cpi*{line}: daily rupees')
    val(rupee*line*365/12,f'PIP DTA2023 ppp*cpi*{line}*365/12: monthly rupees')
val(18.3,'TI25069 Table5 statewide LASSO national2022/23=18.3, SE2.06; this model is described in prose')
g=pd.read_excel(R/'AM26_GSAP_data.xlsx',sheet_name='Data 2023'); val(len(g[g.code.eq('IND')]),'AM26_GSAP_data.xlsx Data2023 count of distinct IND sample states/UTs')
val(4.2-3,'PIP2021PPP threshold difference 4.20minus3.00 dollars perday')
val(70,'IND_GlobalDist selected quantile800minus100 /10 gives70percentilepoints')
val(4.1,'WBpackage README Chapter4 Box4.1 exhibit identifier, not a statistical value')
# Definition/reference numbers are deliberately separated from empirical observations.
DEFINITIONS={1.30:'PIP methodology SPL intercept2021PPP',0.5:'PIP methodology SPL half-median coefficient',3:'PIP2021PPP extreme poverty line/SPLfloor',4.2:'PIP2021PPP LMICline',8.3:'PIP2021PPP UMICline',2.15:'PIP2017PPP extreme line',3.65:'PIP2017PPP LMICline',6.85:'PIP2017PPP UMICline',28:'PIP methodology prosperity standard2021PPP',100:'percent conversion or own-series indexbase',1000:'GlobalDist equal-population bins per country-year',365:'calendar days per year for monthly illustration',12:'months per year for monthly illustration',4:'WBpackage README: report has4chapters',5:'NFHS-5 survey label/children under5 population',14:'registry selected14states',15:'working-age loweragebound15',64:'working-age upperagebound64',10:'decile/selectedpercentile reference',20:'selectedpercentile reference',30:'selectedpercentile reference',40:'selectedpercentile reference',50:'median/selectedpercentile reference',60:'selectedpercentile reference',70:'q800-q100 spans70percentilepoints',80:'selectedpercentile reference',90:'selectedpercentile reference',95:'selectedpercentile reference',1:'unit/referencevalue',2:'PPP-line number or chapter reference'}
for v,src in DEFINITIONS.items():val(v,src)
# Every used data vintage/reference year is explicit, never inferred as a measurement.
for year in [1977,1983,1987,1990,1993,2003,2004,2009,2011,2017,2019,2021,2022,2023,2024,2025,2026,2030]:val(year,'source vintage, survey/calendar year or report/publication reference; context reviewed below')
for v in [21,23,24,26,30,44,25,47,20260922]:val(v,'abbreviated date, rounded headline value, range bound or locked release identifier; context reviewed below')
# Rounding: retain units/transform in source. Rupee monthly illustrations round to10.
def matches(token):
    t=float(token.replace(',',''));digits=len(token.split('.')[1]) if '.' in token else 0
    hits=[]
    for v,src in VALUES:
        if round(v,digits)==t:hits.append(src)
        elif v<0 and round(-v,digits)==t:hits.append(src+'; magnitude of signed difference (minus sign retained in text context)')
        elif digits==0 and 'monthly rupees' in src and round(v/10)*10==t:hits.append(src+'; rounded to nearest10')
        elif digits==0 and 'monthly rupees' in src and round(v/100)*100==t:hits.append(src+'; rounded to nearest100')
    return list(dict.fromkeys(hits))
pattern=re.compile(r'(?<![A-Za-z0-9])\d[\d,]*(?:\.\d+)?')
review=json.loads((A/'reviewed-surfaces.json').read_text()) if (A/'reviewed-surfaces.json').exists() else {}
claims=[];fail=[]
for path,text in SURF.items():
    digest=hashlib.sha256(text.encode()).hexdigest();context=review.get(path)
    reviewed=bool(context and context['sha256']==digest)
    if not reviewed:fail.append({'path':path,'reason':'text context changed or missing review','text':text})
    for m in pattern.finditer(text):
        tok=m[0];source=matches(tok)
        # Date-range suffixes and report identifiers are labels, not observations.
        prefix=text[max(0,m.start()-25):m.start()]
        if (re.search(r'20\d{2}[-/]$',prefix) or re.search(r'(FR_WLD_|2025-|2026_|NFHS-)$',prefix)):
            source.append('dataset, survey or paper reference identifier; see full reviewed context')
        if (path.endswith(('.indicator','.key')) or re.search(r'DataFig[0-9A-Za-z_]*$',prefix)):
            source.append('artifact field, indicator or source filename identifier; not a statistical claim')
        lock=next((x for x in context.get('numbers',[]) if x['offset']==m.start() and x['written']==tok),None) if context else None
        selected=lock['source'] if lock else None
        if selected not in source:
            fail.append({'path':path,'reason':'numeric occurrence lacks the reviewed source selector','written':tok,'context':text[max(0,m.start()-45):m.end()+55]})
        source=[selected] if selected in source else []
        claim={'surface':path,'offset':m.start(),'written':tok,'context':text[max(0,m.start()-65):m.end()+90], 'valueSources':source,'contextReviewed':reviewed,'reviewSources':context.get('sources',[]) if context else []}
        claims.append(claim)
        if not source:fail.append({'path':path,'reason':'unmapped numeric token','written':tok,'context':claim['context']})
ledger={'story':Q,'slug':registry['slug'],'evidenceBundle':{'rawDirectory':'data/raw/wb-3pr-2026','sourceManifest':'data/raw/wb-3pr-2026/manifest.json','artifactCatalog':'data/catalog/poverty-debate-manifest.json','sourceCellAudit':'data/audits/poverty-debate/independent-cell-audit.json','ingestScripts':['scripts/stories/poverty-debate/freeze_raw.py','scripts/stories/poverty-debate/build_poverty_debate.py','scripts/stories/poverty-debate/build_explanation.py','scripts/stories/poverty-debate/audit_sources.py','scripts/stories/poverty-debate/verify_claims.py'],'proseSource':f'data/prose/{Q}.md','explanation':f'data/explanations/en/{Q}.json','evidencePacket':f'data/explanations/en/{Q}.evidence.json'},'method':'Every numeric occurrence inventoried across durable prose, all explainer fields, notes, registry titles/subtitles/hints/keyNumbers. Source-value matches are separate from reviewed textual context; changed text fails. All numeric artifact cells independently reconciled first.','numericOccurrenceCount':len(claims),'reviewedSurfaceCount':len(SURF),'sourceCellCount':rawaudit['numericCellsChecked'],'claimCount':len(claims),'failures':len(fail),'allVerified':not fail,'claims':claims,'unresolved':fail}
# Pin the complete reproducibility and visual-review bundle for release checks.
ledger['evidenceBundle']['repositoryFiles']=sorted(set(
    [str(p.relative_to(ROOT)) for folder in ['scripts/stories/poverty-debate','data/audits/poverty-debate']
     for p in (ROOT/folder).iterdir() if p.is_file() and p.name!='claim-ledger.json']
    + [f'data/prose/{Q}.md',f'data/explanations/en/{Q}.json',f'data/explanations/en/{Q}.evidence.json']
    + ['scripts/registry/v1-indicators.mjs', 'scripts/registry/source-notes.mjs', 'scripts/stories/audit-flagship-visuals.mjs', 'scripts/stories/check-almanac-unit-formats.mjs', 'scripts/audit-charts.mjs', 'src/data/almanac-visuals.ts', 'src/data/almanac.ts', 'src/data/figures.ts', 'docs/ALMANAC_DESIGN_SYSTEM.md', 'docs/DATA_INTEGRITY_GUARDRAILS.md', 'docs/FLAGSHIP_AUDIT_2026-10-30.md', 'data/audits/flagship-2026-10-30-release.json', 'data/audits/lrs-controls/final-focused-layout-audit.json']))
(A/'claim-ledger.json').write_text(json.dumps(ledger,indent=2,ensure_ascii=False)+'\n')
print(f"Numeric claim inventory: {len(claims)} occurrences, {len(SURF)} text surfaces, {len(fail)} failures.")
for x in fail[:50]:print('FAIL',x)
sys.exit(bool(fail))
