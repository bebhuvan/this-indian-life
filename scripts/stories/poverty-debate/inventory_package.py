#!/usr/bin/env python3
"""Inventory original replication-package data files and inspect all country-labelled India rows."""
import json,sys,hashlib
from pathlib import Path
import pandas as pd
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(Path(__file__).parent))
from freeze_raw import SCRATCH_WB
p=Path(sys.argv[1]) if len(sys.argv)>1 else SCRATCH_WB
out=[]
for f in sorted(p.rglob('*')):
    if f.suffix.lower() not in ['.csv','.dta','.xlsx','.xls']:continue
    if any(c in str(f) for c in ['/ado/','pip-0.10.16']):continue
    r={'path':str(f.relative_to(p)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
    try:
        if f.suffix.lower()=='.dta':
            reader=pd.read_stata(f,iterator=True)
            r['columns']=list(reader.variable_labels());r['rows']=reader._nobs
            # The huge global-bins file is already covered by the frozen India extract.
            if r['rows']<1000000:
                d=pd.read_stata(f)
                country=next((c for c in d if c.lower() in ['code','country','country_code','countrycode']),None)
                if country:
                    sub=d[d[country].astype(str).isin(['IND','India'])]
                    r['indiaRows']=json.loads(sub.to_json(orient='records'))
                else:r['indiaJoinPossible']=False
        elif f.suffix.lower() in ['.xlsx','.xls']:
            x=pd.ExcelFile(f);r['sheets']=[]
            for s in x.sheet_names:
                d=x.parse(s);r['sheets'].append({'sheet':s,'rows':len(d),'columns':[str(c) for c in d]})
        else:
            d=pd.read_csv(f);r['columns']=list(d);r['rows']=len(d)
    except Exception as e:r['error']=str(e)
    out.append(r)
report={'package':str(p),'dataFileCount':len(out),'chapterFolders':[f.name for f in p.iterdir() if f.is_dir() and f.name.startswith('Chapter')],'errorCount':sum('error' in r for r in out),'files':out}
(ROOT/'data/audits/poverty-debate/package-inventory.json').write_text(json.dumps(report,indent=2)+'\n')
print(f"Inventoried {len(out)} data files; {report['errorCount']} errors; {report['chapterFolders']}")
