#!/usr/bin/env python3
"""Independent raw-to-artifact reconciliation. Does not import the builder or its audit.
CSV coordinates are one-based including the header; values are raw USD, divided
only here. Absence of pre-March travel subcategories is missing, never zero.
"""
import csv,gzip,hashlib,json,math
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]; RAW=ROOT/'data/raw/rbi-dbie-lrs-2026'; OUT=ROOT/'data/audits/lrs-controls'
checks=[]; errors=[]; duplicates=[]
def check(path,coordinate,actual,expected,source):
    ok=math.isclose(actual,expected,abs_tol=1e-7,rel_tol=0)
    checks.append(dict(artifact=path,coordinate=coordinate,actual=actual,expected=expected,source=source,match=ok))
    if not ok: errors.append(checks[-1])
def read(name,compressed=False,delimiter=','):
    f=gzip.open(RAW/name,'rt') if compressed else open(RAW/name)
    with f:return [(i,r) for i,r in enumerate(csv.DictReader(f,delimiter=delimiter),2)]
m={}; refs={}
for line,r in read('rbi_dbie_report_19_lrs_monthly_200804_202608.csv_gz',True,';'):
    if r['Unit Description']!='ACTUALS':continue
    key=(r['Month (RBIB)'][:7].replace('/','-'),int(r['Remittance Display Order'])); v=float(r['Amount (in USD Million)'] or 0)/1e6
    if key in m:
        assert m[key]==v,f'Conflicting monthly duplicate: {key}'
        duplicates.append(dict(key=key,csvRows=[refs[key],line],identical=True))
    m[key]=v;refs[key]=line
months=sorted(set(k[0] for k in m)); assert len(months)==221
assert months==[str(p) for p in __import__('pandas').period_range('2008-04','2026-08',freq='M')]
def total(ms,orders):return sum(m.get((ym,o),0) for ym in ms for o in orders)
def fy(ym):return int(ym[:4])+(int(ym[5:])>=4)
def src(ms,orders):return dict(file='rbi_dbie_report_19_lrs_monthly_200804_202608.csv_gz',csvRows=[refs[(ym,o)] for ym in ms for o in orders if (ym,o) in refs],orders=orders,operation='sum raw USD / 1e6')
cas=read('rbi_dbie_cas_external_sector_202610.csv')
def cval(dsd,label,date,unit='USD'):
    a=[(i,r) for i,r in cas if r['dsd_code']==dsd and r['series_label']==label and r['observation_date']==date and r['unit_code']==unit];assert len(a)==1,(dsd,label,date,len(a));return float(a[0][1]['value']),dict(file='rbi_dbie_cas_external_sector_202610.csv',csvRows=[a[0][0]],label=label,unit=unit)
series_orders={'monthly_total':[1],'monthly_travel_studies':[7,15],'monthly_capital_triad':[2,3,4],'monthly_family_gifts':[5,6,13],'studies_abroad_line19':[15],'travel_education_line164':[11],'education_combined':[15,11],'annual_equity_debt':[4],'annual_deposits':[2],'annual_property':[3]}
bop_labels={'bop_cad_net':'Current Account / Overall Balance / Net','bop_cap_net':'Capital Account / Overall Balance / Net','bop_overall_net':'Overall Balance / Net','bop_travel_net':'Travel / Services / Invisibles / Current Account / Net'}
scale_labels={'Foreign exchange reserves stockpile (Aug 2026)':'Foreign Exchange Reserves','Software services net BoP surplus (FY26)':'Software Services / Miscellaneous / Services / Invisibles / Net','Total inward transfers, private and official (FY26)':'Transfers / Invisibles / Current Account / Overall Balance / Credit','Net transfers, private and official (FY26)':'Transfers / Invisibles / Current Account / Overall Balance / Net','Business services net BoP surplus (FY26)':'Business Services / Miscellaneous / Services / Invisibles / Net','Gross outward FDI debit (FY26)':'Abroad / Foreign Direct Investment / Foreign Investment / Capital Account / Debit','BoP gross travel debit, all channels (FY26)':'Travel / Services / Invisibles / Current Account / Debit','BoP gross travel credit, all visitors (FY26)':'Travel / Services / Invisibles / Current Account / Credit','Current account deficit, net BoP (FY26)':'Current Account / Overall Balance / Net','Overall balance of payments deficit, net (FY26)':'Overall Balance / Net'}
for p in sorted((ROOT/'data/series').glob('lrs-controls.*.json')):
    a=json.loads(p.read_text()); name=a['indicatorId'].split('.')[1]
    for ix,r in enumerate(a.get('observations',a.get('rows',[]))):
        def emit(k,v,s):check(str(p.relative_to(ROOT)),f'{ix}.{k}',r[k],v,s)
        if name in series_orders:
            orders=series_orders[name];ms=[r['date']] if not name.startswith('annual') else [ym for ym in months if fy(ym)==int(r['date'])]
            # Student split does not exist before March 2026. Missing combined series must be omitted.
            emit('value',round(total(ms,orders),2),src(ms,orders))
        elif name in bop_labels:
            v,s=cval('IND_OVR_BOP_A_RN',bop_labels[name],r['date']+'-03-31');emit('value',round(v/1e9,2),s)
        elif name in ['ceiling_rupee_lakhs','proposed_sublimit_lakhs','tcs_exempt_threshold_lakhs']:
            dt=r['date']; date=next(x['observation_date'] for _,x in cas if x['dsd_code']=='FR_EXG_RESV_M_RN' and x['observation_date'].startswith(dt))
            if name=='ceiling_rupee_lakhs':
                u,s=cval('FR_EXG_RESV_M_RN','Foreign Exchange Reserves',date);i,si=cval('FR_EXG_RESV_M_RN','Foreign Exchange Reserves',date,'INR');v=round(i/u*2.5,2);s=dict(numerator=si,denominator=s,operation='INR/USD * 250000 / 100000')
            else:v=50 if name=='proposed_sublimit_lakhs' else (7 if dt<'2025-04' else 10);s=dict(policy='contextual reference, not historical sub-limit; TCS absent before October2020')
            emit('value',v,s)
        elif name=='travel_subcategories_6m':
            for k,o in {'other':12,'education':11,'business':8,'medical':10,'pilgrimage':9}.items():emit(k,round(total([r['month']],[o]),2),src([r['month']],[o]))
        elif name in ['fy27_5m_yoy_shift','tcs_regime_audit']:
            label=r['purpose'];orders=next(o for key,o in [('Equity',[4]),('Maintenance',[13]),('Studies',[15]),('Gifts',[5,6]),('Foreign',[2]),('Immovable',[3]),('Others',[14,16]),('Total',[1]),('Travel',[7])] if label.startswith(key))
            windows={'fy26_5m':[x for x in months if '2025-04'<=x<='2025-08'],'fy27_5m':[x for x in months if '2026-04'<=x<='2026-08']} if name=='fy27_5m_yoy_shift' else {'fy23_5pct':[x for x in months if '2022-04'<=x<='2023-03'],'frontrun_2023':[x for x in months if '2023-04'<=x<='2023-09'],'tcs20_7l':[x for x in months if '2023-10'<=x<='2025-03'],'tcs20_10l':[x for x in months if '2025-04'<=x<='2026-08']}
            for k,ms in windows.items():emit(k,round(total(ms,orders)/(len(ms) if name=='tcs_regime_audit' else 1),1 if name=='tcs_regime_audit' else 2),src(ms,orders))
            if 'yoy_pct' in r:emit('yoy_pct',round((r['fy27_5m']/r['fy26_5m']-1)*100,1),dict(operation='(FY27/FY26-1)*100',inputs=windows))
        elif name=='seasonal_calendar_profile':
            mn=['April','May','June','July','August','September','October','November','December','January','February','March'].index(r['month'].split()[0]);mn=(mn+3)%12+1;ms=[x for x in months if x>='2022-04' and int(x[5:])==mn]
            for k,o in {'total':[1],'travel':[7],'studies':[15],'capital':[2,3,4],'family':[5,13]}.items():emit(k,round(total(ms,o)/len(ms),1),src(ms,o))
        elif name=='capital_contributions':
            v,source=cval('IND_OVR_BOP_A_RN',a['metadata']['sourceLabels'][r['label']],'2026-03-31');emit('value',round(v/1e9,6),source)
        elif name=='remittance_context':
            if r['label']=='Resident LRS outflows':
                ms=[x for x in months if fy(x)==2026];v=total(ms,[1])/1000;s=src(ms,[1])
            else:
                label={'Gross outward FDI debit':'Abroad / Foreign Direct Investment / Foreign Investment / Capital Account / Debit',
                       'Gross inward private transfers':'Private / Transfers / Invisibles / Current Account / Credit'}[r['label']]
                v,s=cval('IND_OVR_BOP_A_RN',label,'2026-03-31');v/=1e9
            emit('value',round(v,2),s)
        elif name=='matched_purpose_change':
            orders={'Capital transfers':[2,3,4],'Travel and studies':[7,15],'Maintenance of relatives':[13],
                    'Gifts and donations':[5,6],'Medical treatment':[14],'Others':[16]}[r['label']]
            before=[f'2025-{m:02d}' for m in range(4,9)];after=[f'2026-{m:02d}' for m in range(4,9)]
            emit('value',round(total(after,orders)-total(before,orders),6),dict(before=src(before,orders),after=src(after,orders),operation='after minus before, USD million'))
        elif name=='seasonal_allocation_share':
            import calendar
            month=list(calendar.month_abbr).index(r['month'])
            for key,orders in {'travel':[7],'studies':[15],'capital':[2,3,4],'family':[5,6,13]}.items():
                ratios=[];sources=[]
                for end in range(2023,2027):
                    ms=[x for x in months if fy(x)==end];ym=f'{end-1 if month>=4 else end}-{month:02d}'
                    ratios.append(total([ym],orders)/total(ms,orders)*100)
                    sources.append(dict(numerator=src([ym],orders),denominator=src(ms,orders)))
                emit(key,round(sum(ratios)/4,2),dict(operation='unweighted mean of four within-FY monthly/annual ratios * 100',years=sources))
        elif name=='external_sector_scale':
            if r['label'].startswith('Total resident'):v=round(total([x for x in months if fy(x)==2026],[1])/1000,2);s=src([x for x in months if fy(x)==2026],[1])
            elif r['label'].startswith('LRS capital'):v=round(total([x for x in months if fy(x)==2026],[2,3,4])/1000,2);s=src([x for x in months if fy(x)==2026],[2,3,4])
            else:
                label=scale_labels[r['label']];v,s=cval('FR_EXG_RESV_M_RN' if label=='Foreign Exchange Reserves' else 'IND_OVR_BOP_A_RN',label,'2026-08-31' if label=='Foreign Exchange Reserves' else '2026-03-31');v=round(abs(v)/1e9,2)
            emit('value',v,s)
        else:raise AssertionError('Uncovered artifact '+name)
# Independent comparison to annual export, all common non-subcategory cells, not a single FY25 total.
annual=[]
for line,r in read('rbi_dbie_report_752_lrs_annual_200809_202425.csv_gz',True,';'):
    if r['Unit Description']!='ACTUALS':continue
    year=int(r['Time Fis Year'][:4])+1; order=int(r['Remittance Display Order']);ms=[x for x in months if fy(x)==year];expected=total(ms,[order]);actual=float(r['Amount (in USD Million)'] or 0)/1e6
    annual.append(dict(csvRow=line,fy=year,order=order,monthly=round(expected,8),annual=actual,differenceUSDm=round(expected-actual,8)))
result=dict(story='q.econ.lrs_controls',independentOfBuilder=True,rawHashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in RAW.iterdir() if p.is_file()},calendarMonths=len(months),identicalDuplicates=duplicates,artifactNumericCellsChecked=len(checks),mismatches=errors,annualCrossCheck=annual,checks=checks)
OUT.mkdir(exist_ok=True);(OUT/'independent-cell-audit.json').write_text(json.dumps(result,indent=2)+'\n');print(f'{len(checks)} artifact numeric cells; {len(errors)} mismatches; {len(annual)} annual comparison cells; {len(duplicates)} identical duplicates');assert not errors
