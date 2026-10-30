#!/usr/bin/env python3
"""Exercise audit failures through in-process virtual reads; never mutate the raw files."""
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
tests={
'artifact_value':'''import json,runpy
from pathlib import Path
old=Path.read_text
def rd(p,*a,**k):
 s=old(p,*a,**k)
 if p.name=='poverty-debate.pov26.linedup_300.IN.json':
  d=json.loads(s);d['observations'][0]['value']+=1;s=json.dumps(d)
 return s
Path.read_text=rd
runpy.run_path('scripts/stories/poverty-debate/audit_sources.py',run_name='__main__')''',
'raw_hash':'''import runpy
from pathlib import Path
old=Path.read_bytes
def rd(p,*a,**k):
 b=old(p,*a,**k)
 return b+b'x' if p.name=='Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta' else b
Path.read_bytes=rd
runpy.run_path('scripts/stories/poverty-debate/audit_sources.py',run_name='__main__')''',
'edited_context':'''import json,runpy
from pathlib import Path
old=Path.read_text
def rd(p,*a,**k):
 s=old(p,*a,**k)
 if p.name=='q.econ.poverty_debate.json' or (p.name=='notes.json' and 'poverty-debate' in str(p)):
  d=json.loads(s);d['macha']=d['macha']+' An unaudited editorial assertion.';s=json.dumps(d)
 return s
Path.read_text=rd
runpy.run_path('scripts/stories/poverty-debate/verify_claims.py',run_name='__main__')'''}
tests.update({
'scenario_endpoint':'''import json,runpy
from pathlib import Path
old=Path.read_text
def rd(p,*a,**k):
 s=old(p,*a,**k)
 if p.name=='poverty-debate.pov26.poverty_buffer_2024.IN.json':
  d=json.loads(s);d['rows'][1]['loss10']=d['rows'][1]['baseline'];s=json.dumps(d)
 return s
Path.read_text=rd
runpy.run_path('scripts/stories/poverty-debate/audit_sources.py',run_name='__main__')''',
'peer_estimate_basis':'''import json,runpy
from pathlib import Path
old=Path.read_text
def rd(p,*a,**k):
 s=old(p,*a,**k)
 if p.name=='poverty-debate.pov26.peer_thresholds_2024.IN.json':
  d=json.loads(s);d['rows'][0]['estimateBasis']['p300']='actual';s=json.dumps(d)
 return s
Path.read_text=rd
runpy.run_path('scripts/stories/poverty-debate/audit_sources.py',run_name='__main__')''',
'unplotted_child_pattern':'''import runpy,pandas as pd
from pathlib import Path
old=pd.read_excel
def rd(p,*a,**k):
 d=old(p,*a,**k)
 if Path(p).name=='AM26_SPID_data.xlsx':
  mask=d.code.eq('IND') & d.year.eq(2023) & d['sample'].eq('Himachal Pradesh') & d.data_group.eq('0-5')
  assert mask.sum()==1
  d.loc[mask,'poor830']=0.0
 return d
pd.read_excel=rd
runpy.run_path('scripts/stories/poverty-debate/audit_sources.py',run_name='__main__')'''})
expected_reason={
 'artifact_value':'1 mismatches',
 'raw_hash':'raw hash mismatch',
 'edited_context':'text context changed or missing review',
 'scenario_endpoint':'1 mismatches',
 'peer_estimate_basis':"assert r['estimateBasis'][key]",
 'unplotted_child_pattern':'assert (children.poor830>everyone.poor830).all()',
}
results=[]
for name,code in tests.items():
 r=subprocess.run([sys.executable,'-c',code],cwd=ROOT,text=True,capture_output=True)
 full_output=r.stdout+'\n'+r.stderr
 msg=full_output[-1800:]
 rejected_expected=r.returncode!=0 and expected_reason[name] in full_output
 results.append({'test':name,'expected':'audit rejects virtual mutation','exitCode':r.returncode,'pass':rejected_expected,'expectedReason':expected_reason[name],'outputTail':msg})
 print(name,'rejected as expected' if rejected_expected else 'WRONG FAILURE OR UNEXPECTED PASS',flush=True)
# Restore current positive audit reports after negative-path checks.
r=subprocess.run([sys.executable,'scripts/stories/poverty-debate/verify_claims.py'],cwd=ROOT,text=True,capture_output=True)
results.append({'test':'unmodified_current_sources','expected':'pass','exitCode':r.returncode,'pass':r.returncode==0,'outputTail':r.stdout[-1000:]+r.stderr[-1000:]})
(ROOT/'data/audits/poverty-debate/audit-mutation-tests.json').write_text(json.dumps(results,indent=2)+'\n')
assert all(x['pass'] for x in results),results
print('All six negative-path checks rejected mutations; current sources pass.')
