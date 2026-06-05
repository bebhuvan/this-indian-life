#!/usr/bin/env python3
"""Independent All-Taxpayers spine straight from source PDFs via pdftotext.
Covers all years incl. AY 2021-22. Parses 'All Taxpayers - Range of Tax Payable'
and '- Range of Returned Income' tables; computes zero-tax %, totals, top concentration."""
import re, glob, os, subprocess, json
HERE = os.path.dirname(os.path.abspath(__file__))

def num(s):
    if s is None: return None
    neg = s.strip().startswith('-'); s = re.sub(r'[^\d.]','',s)
    if s in ('','.'): return None
    v = float(s) if '.' in s else int(s)
    return -v if neg else v

def lower_bound(label):
    l = label.replace(' ','')
    if l.startswith('=0'): return 0
    if l.startswith('<0'): return -1
    m = re.search(r'>([\d,]+)', l)
    return num(m.group(1)) if m else None

def table_block(txt, heading_re):
    """Return the data lines of the All-Taxpayers table for heading_re (skip TOC)."""
    txt = '\n'.join(l for l in txt.splitlines() if not re.search(r'\.{4,}', l))
    m = list(re.finditer(heading_re, txt, re.I))
    if not m: return []
    # the real heading is the last occurrence (first ones are TOC remnants already stripped; take first remaining)
    start = m[0].end()
    block = txt[start:start+3500]
    rows = []
    for line in block.splitlines():
        lab = line.strip()
        if re.match(r'^(<\s*0|=\s*0|>|Total)', lab):
            parts = re.split(r'\s{2,}', lab)
            rows.append(parts)
        if re.match(r'^Total', lab): break
    return rows

def parse(rows):
    out=[]
    for r in rows:
        if not r: continue
        lab=r[0]
        nums=[num(x) for x in r[1:] if num(x) is not None]
        lo = 'TOTAL' if lab.lower().startswith('total') else lower_bound(lab)
        out.append({'lo':lo,'n':nums[0] if nums else None,'sum':nums[1] if len(nums)>1 else None})
    return out

def above(p, t, f):
    return sum(x[f] or 0 for x in p if isinstance(x['lo'],(int,float)) and x['lo']>=t and x[f])

spine={}
for pdf in sorted(glob.glob(os.path.join(HERE,'AY_*.pdf'))):
    y=os.path.basename(pdf).replace('.pdf','')
    if y.endswith('_alt'): continue
    txt=subprocess.run(['pdftotext','-layout',pdf,'-'],capture_output=True,text=True).stdout
    tp=parse(table_block(txt, r'All Taxpayers\s*-\s*Range of Tax Payable'))
    ri=parse(table_block(txt, r'All Taxpayers\s*-\s*Range of Returned Income'))
    tpt=next((x for x in tp if x['lo']=='TOTAL'),{})
    rit=next((x for x in ri if x['lo']=='TOTAL'),{})
    zero=next((x for x in tp if x['lo']==0),{})
    totret=tpt.get('n'); tottax=tpt.get('sum'); totinc=rit.get('sum')
    spine[y]={
      'returns':totret,
      'zero_tax':zero.get('n'),
      'pct_zero': round(100*zero.get('n')/totret,1) if zero.get('n') and totret else None,
      'total_tax_cr':tottax,
      'tax_share_gt1cr_pct': round(100*above(tp,1_00_00_000,'sum')/tottax,1) if tottax else None,
      'n_tax_gt1cr': above(tp,1_00_00_000,'n'),
      'total_income_cr':totinc,
      'avg_income_lakh': round(totinc*1e7/totret/1e5,2) if totinc and totret else None,
      'inc_share_gt1cr_pct': round(100*above(ri,1_00_00_000,'sum')/totinc,1) if totinc else None,
      'n_inc_gt1cr': above(ri,1_00_00_000,'n'),
      'n_inc_gt500cr': above(ri,500_00_00_000,'n'),
    }
json.dump(spine, open(os.path.join(HERE,'spine.json'),'w'), indent=1)
cols=['returns','zero_tax','pct_zero','total_tax_cr','tax_share_gt1cr_pct','n_tax_gt1cr','total_income_cr','avg_income_lakh','inc_share_gt1cr_pct','n_inc_gt1cr','n_inc_gt500cr']
print(f"{'Year':11}"+''.join(f"{c[:11]:>13}" for c in cols))
for y in sorted(spine):
    print(f"{y:11}"+''.join(f"{(spine[y][c] if spine[y][c] is not None else 0):>13,}" for c in cols))
EOF_GUARD = None
