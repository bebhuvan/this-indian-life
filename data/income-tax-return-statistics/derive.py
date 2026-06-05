#!/usr/bin/env python3
"""Derive cross-year series from master.json for the 'who pays tax' article."""
import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
M = json.load(open(os.path.join(HERE, 'master.json')))
YEARS = sorted(M.keys())

def num(s):
    if s is None: return None
    s = s.strip()
    neg = s.startswith('-')
    s = re.sub(r'[^\d.]', '', s)
    if s in ('', '.'): return None
    v = float(s) if '.' in s else int(s)
    return -v if neg else v

def find_table(year, *needles):
    """Return rows of the first table whose heading contains all needles (case-insens)."""
    for k, tbls in M[year].items():
        kl = k.lower()
        if all(n.lower() in kl for n in needles):
            # pick the table block with the most numeric rows
            return max(tbls, key=len)
    return None

def lower_bound(label):
    label = label.replace(' ', '')
    if label.startswith('=0'): return 0
    if label.startswith('<0'): return -1
    m = re.search(r'>([\d,]+)', label)
    if m: return num(m.group(1))
    return None

def parse_range_table(rows):
    """rows -> list of dicts {label, lo, n, sum}. Assumes col0=label,col1=count,col2=sum."""
    out = []
    for r in rows:
        if len(r) < 2: continue
        lab = r[0]
        if not re.search(r'[<>=]|Total', lab): continue
        lo = lower_bound(lab) if 'total' not in lab.lower() else 'TOTAL'
        out.append({'label': lab, 'lo': lo, 'n': num(r[1]) if len(r)>1 else None,
                    'sum': num(r[2]) if len(r)>2 else None})
    return out

def agg_above(parsed, thresh, field):
    """Sum field for bands with lower-bound >= thresh (exclude TOTAL/None)."""
    return sum(p[field] or 0 for p in parsed if isinstance(p['lo'], (int,float)) and p['lo']>=thresh and p[field])

print("="*120)
print("A. ALL TAXPAYERS — TAX PAYABLE: zero-tax, concentration of tax")
print(f"{'Year':10}{'returns':>13}{'zero-tax':>13}{'%zero':>7}{'totTax(crKL)':>14}{'tax>1cr%':>9}{'#ret>1cr_tax':>13}{'tax>50cr%':>10}")
taxser={}
for y in YEARS:
    p = parse_range_table(find_table(y,'All Taxpayers','Tax Payable'))
    tot = next((x for x in p if x['lo']=='TOTAL'), None)
    zero = next((x for x in p if isinstance(x['lo'],(int,float)) and x['lo']==0), None)
    totret = tot['n'] if tot else None
    tottax = tot['sum'] if tot else None
    # tax payable >1 crore (band lower bound in TAX units: 1,00,00,000)
    tax_gt1cr = agg_above(p, 1_00_00_000, 'sum'); n_gt1cr = agg_above(p, 1_00_00_000, 'n')
    tax_gt50cr = agg_above(p, 50_00_00_000, 'sum')
    pz = 100*zero['n']/totret if (zero and totret) else None
    s1 = 100*tax_gt1cr/tottax if tottax else None
    s50 = 100*tax_gt50cr/tottax if tottax else None
    taxser[y]={'returns':totret,'zero':zero['n'] if zero else None,'pzero':pz,'tottax':tottax,'tax_gt1cr_pct':s1,'n_gt1cr':n_gt1cr,'tax_gt50cr_pct':s50}
    print(f"{y:10}{totret or 0:>13,}{(zero['n'] if zero else 0):>13,}{pz or 0:>7.1f}{(tottax or 0):>14,.0f}{s1 or 0:>9.1f}{n_gt1cr or 0:>13,}{s50 or 0:>10.1f}")

print("\n"+"="*120)
print("B. ALL TAXPAYERS — RETURNED INCOME: income pyramid & top concentration")
print(f"{'Year':10}{'totIncome(cr)':>15}{'avg(lakh)':>10}{'inc>1cr%':>9}{'#ret>1cr':>11}{'inc>50cr%':>10}{'#ret>500cr':>12}")
incser={}
for y in YEARS:
    p = parse_range_table(find_table(y,'All Taxpayers','Returned Income'))
    tot = next((x for x in p if x['lo']=='TOTAL'), None)
    totret = tot['n'] if tot else None; totinc = tot['sum'] if tot else None
    inc_gt1cr=agg_above(p,1_00_00_000,'sum'); n_gt1cr=agg_above(p,1_00_00_000,'n')
    inc_gt50cr=agg_above(p,50_00_00_000,'sum'); n_gt500cr=agg_above(p,500_00_00_000,'n')
    avg = (totinc*1e7/ (totret) /1e5) if (totinc and totret) else None  # cr->rupees->lakh
    s1=100*inc_gt1cr/totinc if totinc else None; s50=100*inc_gt50cr/totinc if totinc else None
    incser[y]={'totinc':totinc,'avg_lakh':avg,'inc_gt1cr_pct':s1,'n_gt1cr':n_gt1cr,'inc_gt50cr_pct':s50,'n_gt500cr':n_gt500cr}
    print(f"{y:10}{(totinc or 0):>15,.0f}{(avg or 0):>10.2f}{(s1 or 0):>9.1f}{(n_gt1cr or 0):>11,}{(s50 or 0):>10.1f}{(n_gt500cr or 0):>12,}")

print("\n"+"="*120)
print("C. RETURNS BY TAXPAYER TYPE (status-wise subtable 0)")
typeser={}
for y in YEARS:
    sw = M[y].get('Status wise distribution of returns and key values')
    if not sw: continue
    counts = sw[0]
    d={}
    for r in counts:
        if len(r)>=2 and r[0]: d[r[0].strip()]=num(r[1])
    typeser[y]=d
hdr=['Individual','HUF','Firm','AOP/BOI','Companies','Total']
print(f"{'Year':10}"+''.join(f'{h:>14}' for h in hdr))
for y in YEARS:
    d=typeser.get(y,{})
    print(f"{y:10}"+''.join(f"{(d.get(h) or 0):>14,}" for h in hdr))

print("\n"+"="*120)
print("D. INCOME COMPOSITION — totals by source (Rs crore), All taxpayers (status-wise subtable 1, Total col)")
comp={}
rows_want=['Salary Income','Business Income','Long Term Capital Gains','Short Term Capital Gains','Other Sources Income','Gross Total Income','Return Income']
print(f"{'Year':10}"+''.join(f'{r.split()[0][:8]:>12}' for r in rows_want))
for y in YEARS:
    sw=M[y].get('Status wise distribution of returns and key values')
    if not sw or len(sw)<2: continue
    vals=sw[1]
    d={}
    for r in vals:
        if r and r[0]: d[r[0].strip()]=num(r[-1])  # last col = Total
    comp[y]=d
    print(f"{y:10}"+''.join(f"{(d.get(r) or 0):>12,.0f}" for r in rows_want))

json.dump({'tax':taxser,'income':incser,'types':typeser,'composition':comp},
          open(os.path.join(HERE,'series.json'),'w'),indent=1)
print("\n[written series.json]")
