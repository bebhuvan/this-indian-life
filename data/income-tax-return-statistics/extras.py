#!/usr/bin/env python3
"""Capture CBDT Time-Series 'extras' (direct/indirect mix, DT-GDP ratio, cost of collection)
from the Time-Series PDF text, plus effective-rate & concentration from spine.json."""
import re, os, json, subprocess, glob
HERE = os.path.dirname(os.path.abspath(__file__))
TS = os.path.expanduser("~/Downloads/ITD_TimeSeries_FY2000-01_to_2024-25.pdf")
txt = subprocess.run(['pdftotext','-layout',TS,'-'],capture_output=True,text=True).stdout
lines = txt.splitlines()

def pctnum(s):
    s=s.replace('%','').replace(',','');
    try: return float(s)
    except: return None
def crnum(s):
    s=re.sub(r'[^\d]','',s); return int(s) if s else None

extras={'_meta':{'source':'CBDT Time-Series Data FY2000-01 to 2024-25','unit_note':'collections in Rs crore; ratios in %'}}

# §1.3 direct vs indirect: rows "FY  direct  indirect  total  pct%"
mix={}
for l in lines:
    m=re.match(r'\s*(20\d\d-\d\d)\s+([\d,]+)@?\s+([\d,]+)@?\s+([\d,]+)@?\s+([\d.]+)%', l)
    if m: mix[f"FY{m.group(1)}"]={'direct_cr':crnum(m.group(2)),'indirect_cr':crnum(m.group(3)),'total_cr':crnum(m.group(4)),'direct_pct_of_total':pctnum(m.group(5))}
extras['direct_vs_indirect']=mix

# §1.4 DT-GDP: "FY  netDT  GDP  ratio%  gdpgrowth%  taxgrowth%  buoyancy"
gdp={}
for l in lines:
    m=re.match(r'\s*(20\d\d-\d\d)\s+([\d,]+)#?\s+([\d,]+)@?\s+([\d.]+)%\s+(-?[\d.]+)%\s+(-?[\d.]+)%\s+(-?[\d.]+|--)', l)
    if m: gdp[f"FY{m.group(1)}"]={'net_direct_tax_cr':crnum(m.group(2)),'gdp_cr':crnum(m.group(3)),'dt_gdp_ratio_pct':pctnum(m.group(4)),'buoyancy':None if m.group(7)=='--' else float(m.group(7))}
extras['dt_gdp_ratio']=gdp

# §1.6 cost of collection: "FY  totalcoll  expenditure  cost%"
cost={}
for l in lines:
    m=re.match(r'\s*(20\d\d-\d\d)[@#]?\s+([\d,]+)\s+([\d,]+)\s+([\d.]+)%', l)
    # avoid catching §1.3 rows (those have 4 numbers + pct); cost rows have 2 numbers + pct
    if m and f"FY{m.group(1)}" not in cost:
        # heuristic: expenditure is small (<20000)
        exp=crnum(m.group(3))
        if exp and exp<50000:
            cost[f"FY{m.group(1)}"]={'total_collection_cr':crnum(m.group(2)),'expenditure_cr':exp,'cost_pct':pctnum(m.group(4))}
extras['cost_of_collection']=cost

# effective rate + concentration from spine
spine=json.load(open(os.path.join(HERE,'spine.json')))
eff={}
for ay,d in spine.items():
    tax=d.get('total_tax_cr'); inc=d.get('total_income_cr')
    eff[ay]={'effective_rate_on_declared_income_pct': round(100*tax/inc,2) if tax and inc else None,
             'pct_zero_tax':d.get('pct_zero'),
             'tax_share_top_gt1cr_tax_pct':d.get('tax_share_gt1cr_pct'),
             'income_share_top_gt1cr_inc_pct':d.get('inc_share_gt1cr_pct')}
extras['effective_rate_and_concentration']=eff

json.dump(extras, open(os.path.join(HERE,'extras.json'),'w'), indent=1)
print("direct/indirect FYs:",len(mix),"| dt_gdp FYs:",len(gdp),"| cost FYs:",len(cost))
print("\nEffective rate on declared income + top-end concentration:")
print(f"{'AY':11}{'eff_rate%':>10}{'%zero':>8}{'tax_top%':>10}{'inc_top%':>10}")
for ay in sorted(eff):
    e=eff[ay]; print(f"{ay:11}{(e['effective_rate_on_declared_income_pct'] or 0):>10}{(e['pct_zero_tax'] or 0):>8}{(e['tax_share_top_gt1cr_tax_pct'] or 0):>10}{(e['income_share_top_gt1cr_inc_pct'] or 0):>10}")
print("\nDT-GDP & cost (selected):")
for fy in ['FY2000-01','FY2013-14','FY2019-20','FY2024-25']:
    g=gdp.get(fy,{}); c=cost.get(fy,{}); mx=mix.get(fy,{})
    print(f"  {fy}: DT/GDP {g.get('dt_gdp_ratio_pct')}% | cost {c.get('cost_pct')}% | direct-share {mx.get('direct_pct_of_total')}%")
