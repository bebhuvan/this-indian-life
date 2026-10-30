#!/usr/bin/env python3
"""Exploratory, source-backed editorial cuts. Does not change article artifacts."""
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / 'data/raw/wb-3pr-2026'
OUT = ROOT / 'data/audits/poverty-debate/additional-layer-analysis.json'


def main():
    inventory = json.loads((ROOT/'data/audits/poverty-debate/package-inventory.json').read_text())
    spid_path = RAW/'AM26_SPID_data.xlsx'
    if not spid_path.exists():
        spid_path = Path(inventory['package'])/'Chapter 1/Chapter 1/1-data/raw/spid/AM26 - SPID data.xlsx'
    spid = pd.read_excel(spid_path, sheet_name='Data')
    spid['excelRow'] = spid.index + 2
    ind = spid[spid.code.eq('IND')]
    recent = ind[ind.year.eq(2023)]
    children = recent[recent.data_group.eq('0-5')].set_index('sample')
    older = recent[recent.data_group.eq('17+')].set_index('sample')
    assert children.index.is_unique and older.index.is_unique and set(children.index)==set(older.index)
    age_rows = []
    for state in children.index:
        a, b = children.loc[state], older.loc[state]
        age_rows.append({'state':state,'childExcelRow':int(a.excelRow),'olderExcelRow':int(b.excelRow),
                         'year':2023,'refYear':float(a.ref_year),'survey':str(a.survname),
                         **{f'{field}_{group}':float(row[field])*100 for field in ['poor300','poor420','poor830']
                            for group,row in [('child0_5',a),('older17plus',b)]}})
    age_counts={field:sum(r[f'{field}_child0_5']>r[f'{field}_older17plus'] for r in age_rows)
                for field in ['poor300','poor420','poor830']}
    pip = pd.read_stata(RAW/'pip_20260922_2021_01_02_PROD.dta')
    pip['stataObservation'] = pip.index + 1
    national = pip[pip.country_code.eq('IND') & pip.reporting_level.eq('national')]
    a=national[national.year.eq(2022)];b=national[national.year.eq(2023)]
    assert len(a)==len(b)==1
    a,b=a.iloc[0],b.iloc[0]
    assert a.welfare_type==b.welfare_type=='consumption' and a.ppp==b.ppp and a.comparable_spell==b.comparable_spell=='2022 - 2023'
    deciles=[]
    for i in range(1,11):
        before=float(a['mean']*a[f'decile{i}']/.1);after=float(b['mean']*b[f'decile{i}']/.1)
        deciles.append({'decile':i,'mean2022':before,'mean2023':after,'realChangePct':100*(after/before-1)})
    api=json.loads((RAW/'pip_IND_pl3_00_20260922_2021_01_02_PROD.json').read_text())
    assert {r['comparable_spell'] for r in api if r['reporting_year'] in [2022,2023]}=={'2022 - 2023'}
    bins=pd.read_csv(RAW/'IND_GlobalDist1000bins_1990_2026.csv')
    y=bins[bins.year.eq(2024)].copy()
    assert len(y)==1000 and y['quantile'].is_unique
    def h(values,z,weights):return float(np.average(np.asarray(values)<z,weights=np.asarray(weights))*100)
    shocks=[]
    for loss in [0,.05,.1,.2]:
        shocks.append({'uniformRealConsumptionLossPct':loss*100,
                       'headcountsPct':{str(z):h(y.welf*(1-loss),z,y['pop']) for z in [3,4.2,8.3]},
                       'additionalPoorMillions':{str(z):float(y.loc[(y.welf*(1-loss)<z)&(y.welf>=z),'pop'].sum()) for z in [3,4.2,8.3]}})
    # An arithmetic two-order decomposition of measured distributions, not a causal attribution.
    x=bins[bins.year.eq(2011)].sort_values('quantile');z=y.sort_values('quantile')
    growth=float(np.average(z.welf,weights=z['pop'])/np.average(x.welf,weights=x['pop']))
    decomposed=[]
    for line in [3,4.2,8.3]:
        h00=h(x.welf,line,x['pop']);h11=h(z.welf,line,z['pop'])
        h10=h(x.welf*growth,line,x['pop']);h01=h(z.welf/growth,line,z['pop'])
        decomposed.append({'line':line,'startHeadcount':h00,'endHeadcount':h11,'uniformGrowthOnlyHeadcount':h10,
                           'meanGrowthComponentPP':.5*((h10-h00)+(h11-h01)),
                           'distributionShapeComponentPP':.5*((h01-h00)+(h11-h10))})
    # PG = 28*E(1/y); compare to the equal-consumption benchmark 28/E(y).
    pg=float(b['pg']);mean=float(b['mean']);naive=28/mean
    gsap=pd.read_excel(RAW/'AM26_GSAP_data.xlsx',sheet_name='Data 2023')
    all_rows=recent[recent.data_group.eq('ALL')]
    merge=all_rows.merge(gsap[gsap.code.eq('IND')],on='sample',suffixes=('_spid','_gsap'))
    ratio=merge.prosgap2021_gsap/merge.prosgap2021_spid
    result={
      'purpose':'Analysis-only ranked candidates; script does not change article/chart artifacts. Published additions and exclusions are recorded in editorial-audit.md; the published child cut uses0-5vsALL, not the older17+ comparison below.',
      'sources':{
        'SPID':{'path':str(spid_path),'sha256':hashlib.sha256(spid_path.read_bytes()).hexdigest(),'sheet':'Data',
                'indiaRows':len(ind),'india2023Rows':len(recent),'notFrozenInStory':spid_path.parent != RAW,
                'subgroupsAvailable':sorted(ind.byvar.unique().tolist()),'populationWeightsAvailable':False},
        'PIP':{'path':'data/raw/wb-3pr-2026/pip_20260922_2021_01_02_PROD.dta','observations':[int(a.stataObservation),int(b.stataObservation)],
               'selector':'country_code=IND, reporting_level=national, year=2022 or 2023; fields mean,decile1..decile10,pg',
               'comparisonSpell':'2022 - 2023','welfareType':str(a.welfare_type),'ppp':float(a.ppp),'surveyComparability':int(a.survey_comparability),'surveyYears':[str(a.survey_time),str(b.survey_time)]},
        'bins':{'path':'data/raw/wb-3pr-2026/IND_GlobalDist1000bins_1990_2026.csv','selector':'year=2024 for sensitivity; year=2011 and2024 for two-order decomposition; code=IND; fields welf,pop,quantile'}},
      'ageGap':{'rows':age_rows,'childrenHigherCountOf36':age_counts,
                'interpretation':'Poverty among persons aged0-5 vs the exact source label17+, using household per-capita welfare. Not individual nutrition or intrahousehold allocation.',
                'limitations':['SPID direct survey rows must not be silently spliced with GSAP calendar lineup rows.','Age17+ exact boundary requires source-method confirmation before relabelling as18+.','Other age labels6-11/12-17 are Excel dates; avoid automatic parsing.','No state or group weights, so no invented national child headcount.']},
      'growthIncidence':{'rows':deciles,'nationalMeanGrowthPct':float((b['mean']/a['mean']-1)*100),
                         'formula':'decile mean = national mean * decile consumption share /0.1; relative growth = new/old -1',
                         'limitations':['Repeated cross-sections, not the same people.','Measured top-decile decline is not proof that rich Indians became poorer.','The survey can miss the affluent; price/welfare harmonization remains part of the estimate.']},
      'shockSensitivity':{'rows':shocks,'resolutionPP':.1,'populationMillions':float(y['pop'].sum()),
                          'formula':'For each uniform loss s, evaluate weighted share welf*(1-s)<line. Additional poor = population with line<=welf<line/(1-s).',
                          'limitations':['Hypothetical sensitivity, not a forecast or household transition probability.','A10%consumption loss is not the same arithmetic as10%price inflation.','Bin means approximate positions, so counts are rounded and resolve to roughly0.1pp.']},
      'growthShapeDecomposition':{'meanGrowthFactor':growth,'rows':decomposed,'recommendation':'Lower priority than comparable2022-23 decile growth; keep as exploratory because2011-to-new-HCES comparison crosses a survey break.',
                                  'limitations':['Arithmetic decomposition of measured distributions, not causal growth/redistribution shares.','Two orderings averaged because the poverty function is nonlinear.']},
      'prosperityGapExplanation':{'year':2023,'mean':mean,'actualPG':pg,'equalConsumptionBenchmarkPG':naive,
                                  'ratioActualToBenchmark':pg/naive,'recommendation':'Use as an annotation/example inside the existing Prosperity Gap explainer, not another state ranking.',
                                  'formula':'actual PG / (28/mean) = mean * E(1/welfare) >=1; this measures distribution sensitivity within the survey.'},
      'SPIDvsGSAP':{'matchedStates':len(merge),'gsap2023ToSpidPGFactorMin':float(ratio.min()),'gsap2023ToSpidPGFactorMax':float(ratio.max()),
                    'fact':'Every matched2023state differs by essentially one common PG scale factor.',
                    'inference':'Likely reference-year/calendar lineup alignment; mechanism must be checked before treating the two tables as interchangeable.'},
      'notAvailable':['SPID India rows have state,gender,age categories but no rural/urban or national subgroup row.','Latest GSAP/SPID tables and mapDBFs have no population weights; weighted state burden requires another compatible source.']}
    OUT.write_text(json.dumps(result,indent=2)+'\n')
    print('Wrote',OUT.relative_to(ROOT),'with',len(age_rows),'state-age comparisons,',len(deciles),'decile growth rows and',len(shocks),'shock scenarios')

if __name__=='__main__':main()
