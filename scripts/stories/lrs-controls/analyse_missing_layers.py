#!/usr/bin/env python3
"""Read-only opportunity calculations from frozen LRS and external-account files.

No generated article or chart artifact is modified. Money calculations use original
USD values; aggregation is before rounding. Outputs retain one-based CSV rows.
"""
import csv
import gzip
import json
from collections import defaultdict
from decimal import Decimal as D
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
RAW=ROOT/'data/raw/rbi-dbie-lrs-2026'
OUT=ROOT/'data/audits/lrs-controls/missing-layer-calculations.json'

cas=[]
with (RAW/'rbi_dbie_cas_external_sector_202610.csv').open() as f:
    cas=[(i,r) for i,r in enumerate(csv.DictReader(f),2)]


def get(code,year,kind='TRANC_NET'):
    key=f'io_bop_rn={code}|tranc_typ_rn={kind}|unit_measure=USD'
    rows=[(i,r) for i,r in cas if r['dsd_code']=='IND_OVR_BOP_A_RN' and r['series_key']==key and r['observation_date']==f'{year}-03-31']
    assert len(rows)==1,(code,year,kind,len(rows))
    i,r=rows[0]
    return D(r['value']), {'file':'rbi_dbie_cas_external_sector_202610.csv','csvRow':i,'dsdCode':r['dsd_code'],'date':r['observation_date'],'seriesKey':key,'label':r['series_label'],'rawUSD':r['value']}


def reserve(label,date):
    rows=[(i,r) for i,r in cas if r['dsd_code']=='FR_EXG_RESV_M_RN' and r['unit_code']=='USD' and r['series_label']==label and r['observation_date']==date]
    assert len(rows)==1,(label,date)
    i,r=rows[0]
    return D(r['value']),{'file':'rbi_dbie_cas_external_sector_202610.csv','csvRow':i,'date':date,'seriesKey':r['series_key'],'label':label,'rawUSD':r['value']}


def money(v,**kwargs):return {'USD':str(v),'USDbn':float(v/D(10)**9),**kwargs}

# 1. Stocks versus transaction flows, one matching fiscal year.
components=[]
for label in ['Foreign Currency Assets / Foreign Exchange Reserves','Gold / Foreign Exchange Reserves','Special Drawing Right (SDR) / Foreign Exchange Reserves','Reserve Tranch Position / Foreign Exchange Reserves']:
    a,sa=reserve(label,'2025-03-31');b,sb=reserve(label,'2026-03-31')
    components.append({'label':label,'start':money(a),'end':money(b),'change':money(b-a),'sources':[sa,sb]})
a,sa=reserve('Foreign Exchange Reserves','2025-03-31');b,sb=reserve('Foreign Exchange Reserves','2026-03-31');bop,sbop=get('OVR_BAL',2026)
reserve_bridge={'period':'FY2025-26','stockDates':['2025-03-31','2026-03-31'],'stockStart':money(a),'stockEnd':money(b),'stockChange':money(b-a),'overallBoP':money(bop),'impliedStockFlowResidual':money(b-a-bop),'components':components,'componentResidualUSD':str(sum(D(c['change']['USD']) for c in components)-(b-a)),'sources':[sa,sb,sbop], 'limit':'Stock-flow residual includes valuation and other coverage/timing adjustments. It is not a direct estimate of gold price gains or of RBI intervention. Gold component change mixes price, quantity and other valuation effects.'}

# 2. Fully additive current-account anatomy, and separately travel/income subparts.
current_components=[]
for code in ['CURR_MERCH','CURR_INVIS_SER','CURR_INVIS_TRA','CURR_INVIS_TRA_INC']:
    v,s=get(code,2026);current_components.append({'code':code,'value':money(v),'source':s})
cad,scad=get('CURR_ACC',2026)
current_subparts=[]
for code in ['CURR_IS_TRV','CURR_INVIS_TRA_INC_INV','CURR_INVIS_TRA_INC_COMPNS']:
    v,s=get(code,2026);current_subparts.append({'code':code,'value':money(v),'source':s})
current_account={'period':'FY2025-26','components':current_components,'currentAccount':money(cad),'residualUSD':str(sum(D(c['value']['USD']) for c in current_components)-cad),'subpartsNotAdditiveToComponents':current_subparts,'source':scad,'limit':'Travel is inside services and investment income inside income. Never add these subparts again. Gross LRS is not an additional independent BoP component.'}

# 3. What changed in financing? Same six additive components at both endpoints.
capital=[]
for code in ['CA_FI_FDI','CA_FI_FPI','CA_BNK_CAP','CA_LN','CA_OTH_CAP','CA_RUP_DBT_SRV']:
    a,sa=get(code,2024);b,sb=get(code,2026)
    capital.append({'code':code,'fy2024':money(a),'fy2026':money(b),'change':money(b-a),'sources':[sa,sb]})
a,sa=get('CAP_ACC',2024);b,sb=get('CAP_ACC',2026)
capital_change={'periods':['FY2023-24','FY2025-26'],'start':money(a),'end':money(b),'change':money(b-a),'components':capital,'componentChangeResidualUSD':str(sum(D(r['change']['USD']) for r in capital)-(b-a)),'sources':[sa,sb]}
banking=[]
for code in ['CA_BC_CM_AST','CA_BC_CM_LIB_NRD','CA_BC_CM_LIB_OTH','CA_BC_OTH']:
    a,sa=get(code,2024);b,sb=get(code,2026)
    banking.append({'code':code,'fy2024':money(a),'fy2026':money(b),'change':money(b-a),'sources':[sa,sb]})
fdi=[]
for year in [2024,2025,2026]:
    row={'year':year,'pieces':[]}
    for code,kind in [('CA_FI_FDI_IND','TRANC_CRD'),('CA_FI_FDI_IND','TRANC_DEB'),('CA_FI_FDI_IND','TRANC_NET'),('CA_FI_FDI_ABD','TRANC_CRD'),('CA_FI_FDI_ABD','TRANC_DEB'),('CA_FI_FDI_ABD','TRANC_NET'),('CA_FI_FDI','TRANC_NET')]:
        v,s=get(code,year,kind);row['pieces'].append({'code':code,'transactionType':kind,'value':money(v),'source':s})
    fdi.append(row)

# Monthly data: one value per calendar month/purpose, reject conflicting duplicates.
monthly={};refs={}
with gzip.open(RAW/'rbi_dbie_report_19_lrs_monthly_200804_202608.csv_gz','rt') as f:
    for i,r in enumerate(csv.DictReader(f,delimiter=';'),2):
        if r['Unit Description']!='ACTUALS':continue
        k=(r['Month (RBIB)'][:7].replace('/','-'),int(r['Remittance Display Order']))
        v=None if not r['Amount (in USD Million)'] else D(r['Amount (in USD Million)'])
        assert k not in monthly or monthly[k]==v,k
        monthly[k]=v;refs[k]=i
purposes={2:'Deposits',3:'Property',4:'Equity/debt',5:'Gifts',6:'Donations',7:'Travel',13:'Maintenance of relatives',14:'Medical treatment',15:'Studies abroad',16:'Others'}

def total(months,orders):
    keys=[(m,o) for m in months for o in orders]
    assert all(k in monthly and monthly[k] is not None for k in keys),keys
    return sum(monthly[k] for k in keys),[refs[k] for k in keys]

ma=[f'2025-{m:02d}' for m in range(4,9)];mb=[f'2026-{m:02d}' for m in range(4,9)]
changes=[]
for code,name in purposes.items():
    a,ra=total(ma,[code]);b,rb=total(mb,[code]);changes.append({'order':code,'purpose':name,'earlier':money(a),'later':money(b),'change':money(b-a),'earlierRows':ra,'laterRows':rb})
a,ra=total(ma,[1]);b,rb=total(mb,[1]);ca,_=total(ma,[2,3,4]);cb,_=total(mb,[2,3,4])
lrs_change={'periods':['April-August 2025','April-August 2026'],'earlier':money(a),'later':money(b),'change':money(b-a),'growthPercent':float((b/a-1)*100),'components':changes,'sumPurposeChangeResidualUSD':str(sum(D(r['change']['USD']) for r in changes)-(b-a)),'capitalTriad':{'earlier':money(ca),'later':money(cb),'change':money(cb-ca),'earlierSharePercent':float(ca/a*100),'laterSharePercent':float(cb/b*100)},'noncapitalChange':money((b-a)-(cb-ca)),'totalRows':[ra,rb]}
change_by_order={r['order']:D(r['change']['USD']) for r in changes}
lrs_change['reportingRobustGroups']=[{'label':label,'orders':orders,'change':money(sum(change_by_order[o] for o in orders))} for label,orders in [
    ('Equity/debt',[4]),('Deposits',[2]),('Property',[3]),('Travel and studies',[7,15]),
    ('Family maintenance, gifts and donations',[13,5,6]),('Medical treatment and other',[14,16])]]
lrs_change['reportingLimit']='A split first became observable in March 2026. Group top-level travel and studies across the matched windows; do not interpret the separate studies decline as lower education demand.'

# 4. Replace growth-biased month averages with within-year monthly shares.
seasons=[]
for year in range(2023,2027):
    months=[f'{year-1 if m>=4 else year}-{m:02d}' for m in [4,5,6,7,8,9,10,11,12,1,2,3]]
    annual,refsannual=total(months,[2,3,4]);march,refsmarch=total([f'{year}-03'],[2,3,4])
    studies,refsstudy=total(months,[15]);aug,refsaug=total([f'{year-1}-08'],[15])
    seasons.append({'financialYearEnd':year,'capitalMarchSharePercent':float(march/annual*100),'directStudiesAugustSharePercent':float(aug/studies*100),'capitalAnnual':money(annual),'capitalMarch':money(march),'studiesAnnual':money(studies),'studiesAugust':money(aug),'sourceRows':{'capitalAnnual':refsannual,'capitalMarch':refsmarch,'studiesAnnual':refsstudy,'studiesAugust':refsaug}})

# 5. LRS Travel is not all outbound BoP Travel; fiscal-period match only.
travel=[]
for year in [2020,2023,2024,2025,2026]:
    months=[f'{year-1 if m>=4 else year}-{m:02d}' for m in [4,5,6,7,8,9,10,11,12,1,2,3]]
    lrs,rlrs=total(months,[7]);bop,sbop=get('CURR_IS_TRV',year,'TRANC_DEB')
    travel.append({'financialYearEnd':year,'lrsTravel':money(lrs),'bopTravelDebit':money(bop),'ratioPercent':float(lrs/bop*100),'difference':money(bop-lrs),'sourceRows':rlrs,'bopSource':sbop})

output={'status':'computed from unchanged frozen inputs','reserveStockFlow':reserve_bridge,'currentAccountAnatomy':current_account,'capitalBalanceChange':capital_change,'bankingBalanceChange':banking,'fdiGrossNet':fdi,'matchedLrsPurposeChange':lrs_change,'withinYearSeasonality':seasons,'lrsVsBoPTravel':travel}
assert D(reserve_bridge['componentResidualUSD']) == 0
assert D(current_account['residualUSD']) == 0
assert abs(D(capital_change['componentChangeResidualUSD'])) < 1, 'BoP source precision residual exceeds one USD'
assert D(lrs_change['sumPurposeChangeResidualUSD']) == 0
assert sum(D(r['change']['USD']) for r in lrs_change['reportingRobustGroups']) == D(lrs_change['change']['USD'])
OUT.write_text(json.dumps(output,indent=2)+'\n')
print(f'Wrote {OUT.relative_to(ROOT)}: source-coordinate calculations only; no published article artifacts changed.')
