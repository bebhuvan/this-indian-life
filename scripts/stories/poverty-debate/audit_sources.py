#!/usr/bin/env python3
"""Independent reconciliation of every published numeric artifact cell to frozen primary files.

Does not import the builder or read its source-audit summary. A missing mapping fails.
Records exact source selections and transformations per cell; checks source hashes first.
"""
import hashlib, json, math, re, subprocess, sys
from pathlib import Path
import pandas as pd
ROOT=Path(__file__).resolve().parents[3]
R=ROOT/'data/raw/wb-3pr-2026'; S=ROOT/'data/series'; A=ROOT/'data/audits/poverty-debate'
checks=[]; failures=[]
def cell(path,where,got,want,source):
    ok=math.isclose(float(got),float(want),rel_tol=0,abs_tol=1e-8)
    q={'artifact':path,'cell':where,'actual':got,'expected':want,'source':source,'pass':ok}
    checks.append(q)
    if not ok:failures.append(q)
def artifact(stem):
    fn='poverty-debate.pov26.'+stem+'.IN.json'
    return fn,json.loads((S/fn).read_text())
def testobs(stem,source,datefield,valuefield,mult=1,digits=2):
    fn,a=artifact(stem)
    assert source[datefield].is_unique, (stem,'duplicate source years')
    expected={str(int(r[datefield])):round(float(r[valuefield])*mult,digits) for _,r in source.iterrows()}
    assert set(o['date'] for o in a['observations'])==set(expected),(stem,'date coverage mismatch')
    for i,o in enumerate(a['observations']):cell(fn,f'observations[{i}].value',o['value'],expected[o['date']],f'{stem}: {valuefield}; year={o["date"]}; *{mult}; round {digits}')
def loadpip(line,ppp=2021):
    file=f'pip_IND_pl{line.replace(".","_")}_20260922_{ppp}_01_02_PROD.json'
    rows=json.loads((R/file).read_text());rows=[r for r in rows if r['reporting_level']=='national']
    assert len({r['reporting_year'] for r in rows})==len(rows)
    return file,{int(r['reporting_year']):r for r in rows}
manifest=json.loads((R/'manifest.json').read_text())
for r in manifest['files']:
    b=(R/r['path']).read_bytes()
    assert len(b)==r['bytes'] and hashlib.sha256(b).hexdigest()==r['sha256'],f'raw hash mismatch {r["path"]}'
f=pd.read_stata(R/'Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta')
f=f[f.code.eq('IND') & f.year.between(1990,2030)]
for line,stem in [(3,'300'),(4.2,'420'),(8.3,'830')]:
    testobs('linedup_'+stem,f[f.povertyline.round(2).eq(line)],'year','fgt0')
pip=pd.read_stata(R/'pip_20260922_2021_01_02_PROD.dta');pip=pip[pip.country_code.eq('IND') & pip.reporting_level.eq('national')]
testobs('societal_poverty_rate',pip[pip.year.ge(1993)],'year','spr',100)
for col,stem in [('mean','idx_survey_mean_1977'),('hfce','idx_na_hfce_1977'),('gdp','idx_gdp_pcap_1977')]:
    d=pip.copy();d['index']=d[col]/float(d[d.year.eq(1977)].iloc[0][col])*100
    testobs(stem,d,'year','index',digits=1)
bins=pd.read_csv(R/'IND_GlobalDist1000bins_1990_2026.csv')
assert not bins.duplicated(['year','quantile']).any()
assert bins.groupby('year').size().eq(1000).all()
assert bins.code.eq('IND').all() and bins['pop'].gt(0).all()
assert all(math.isclose(float(v.min()),float(v.max()),rel_tol=1e-9,abs_tol=0) for _,v in bins.groupby('year')['pop']), 'equal-population bins required within source float serialization tolerance'
fn,a=artifact('bunching_percentile_ladder')
for i,r in enumerate(a['rows']):
    for yr in [1990,2011,2024,2026]:
        v=bins[bins.year.eq(yr)&bins['quantile'].eq(r['quantile'])]
        assert len(v)==1
        cell(fn,f'rows[{i}].y{yr}',r[f'y{yr}'],round(float(v.iloc[0].welf),2),f'IND_GlobalDist1000bins CSV year={yr},quantile={r["quantile"]},welf')
    cell(fn,f'rows[{i}].quantile',r['quantile'],int(r['quantile']),'quantile selection key, exactly matched raw CSV')
g=pd.read_excel(R/'AM26_GSAP_data.xlsx',sheet_name='Data 2023');g=g[g.code.eq('IND')].copy()
ren={'Orissa':'Odisha','Andaman and Nicobar':'Andaman and Nicobar Islands','Daman and Diu & Dadra and Nagar Haveli':'Dadra and Nagar Haveli and Daman and Diu'}
g['name']=g['sample'].map(lambda s:ren.get(str(s).strip(),str(s).strip())); assert g.name.is_unique
G={r['name']:r for _,r in g.iterrows()}
for stem,digits,mapping in [('state_prosperity_gap_2023',2,{'poor300':('poor300_ln',100),'poor420':('poor420_ln',100),'poor830':('poor830_ln',100),'prosperityGap':('prosgap2021',1)}),('state_three_lines_2023',1,{'p300':('poor300_ln',100),'p420':('poor420_ln',100),'p830':('poor830_ln',100),'pg':('prosgap2021',1)})]:
    fn,a=artifact(stem)
    for i,r in enumerate(a['rows']):
        for k,(c,m) in mapping.items():cell(fn,f'rows[{i}].{k}',r[k],round(float(G[r['state']][c])*m,2 if k=='pg' else digits),f'AM26_GSAP_data.xlsx Data 2023 sample={r["state"]} column={c}, *{m}')
    if 'regions' in a:
        for i,r in enumerate(a['regions']):cell(fn,f'regions[{i}].value',r['value'],round(float(G[r['name']]['prosgap2021']),2),f'AM26_GSAP_data.xlsx Data 2023 sample={r["name"]},prosgap2021')
        for k,fun in [('min',min),('max',max)]:cell(fn,k,a[k],fun(r['value'] for r in a['regions']),'min/max of reconciled region values')
fn,a=artifact('ppp_revision_paradox')
for i,r in enumerate(a['rows']):
    yr=int(r['benchmark'][:4]);ls=re.findall(r'\$(\d+\.\d+)',r['benchmark']);old,new=ls
    fo,po=loadpip(old,2017);fnw,pn=loadpip(new,2021);o=round(po[yr]['headcount']*100,2);n=round(pn[yr]['headcount']*100,2)
    for k,v in [('ppp2017',o),('ppp2021',n),('diff_pp',round(n-o,2))]:cell(fn,f'rows[{i}].{k}',r[k],v,f'{fo} + {fnw} national reporting_year={yr}; headcount*100 or difference')
fn,a=artifact('mean_shortfall_among_poor')
for i,r in enumerate(a['rows']):
    ln=re.search(r'\$(\d+\.\d+)',r['label'])[1];ff,pp=loadpip(ln);q=pp[2023]
    cell(fn,f'rows[{i}].value',r['value'],round(q['poverty_gap']/q['headcount']*100,2),f'{ff} national2023 poverty_gap/headcount*100, rounded API inputs')
def stata(file):
    d=pd.read_stata(R/file);return d[d.code.eq('IND')]
emp=stata('DataFig4_5a.dta');ed=stata('DataFig4D_1b.dta')
fn,a=artifact('jobs_shift_2003_2024')
for i,r in enumerate(a['rows']):
    level=0 if 'Non-poor' in r['metric'] else 1
    for y in [2003,2024]:
        if 'lacking' in r['metric']:v=(1-float(ed[ed.level.eq(level)].iloc[0][f'educat4_34{y}']))*100;src='DataFig4D_1b.dta educat4_34'
        else:v=float(emp[emp.level.eq(level)].iloc[0][f'lstatus_emp{y}']);src='DataFig4_5a.dta lstatus_emp'
        cell(fn,f'rows[{i}].y{y}',r[f'y{y}'],round(v,2),f'{src} IND,level={level},year={y}')
h=stata('DataFigB4_1_1.dta');fn,a=artifact('worker_structural_trap_2024')
assert len(a['rows'])==2 and a['unit']=='hours/week'
for i,r in enumerate(a['rows']):
    typ='Non-Paid Employee' if 'self/unpaid' in r['dimension'] else 'Paid Employee';v=h[h.empstat.eq(typ)].iloc[0]
    assert v.byvar=='poor300'
    for k,c in [('poor','whours1'),('nonpoor','whours0')]:cell(fn,f'rows[{i}].{k}',r[k],round(float(v[c]),2),f'DataFigB4_1_1.dta IND,empstat={typ},byvar=poor300,{c}')
cf=stata('DataFig4C_123.dta').iloc[0];fn,a=artifact('jobs_counterfactual_2024')
for i,r in enumerate(a['rows']):
    line='830' if '8.30' in r['measure'] else '300';head='Headcount' in r['measure'];col=('poor' if head else 'gap1_')+line;new=('poor_new' if head else 'gap1_new_')+line
    for k,v in [('baseline2024',cf[col]),('afterJobsClosing',cf[new]),('reduction_pp',cf[col]-cf[new])]:cell(fn,f'rows[{i}].{k}',r[k],round(float(v),2),f'DataFig4C_123.dta IND {col}/{new}')
# Original PDF table cells are checked against their full row context, not just a value substring.
hces=subprocess.check_output(['pdftotext','-layout',str(R/'HCES_Press_Note_2023-24.pdf'),'-'],text=True)
assert '4,122' in hces and '6,996' in hces and '4,247' in hces and '7,078' in hces
fn,a=artifact('free_grain_imputation_deciles');vals={'Rural':(4122,4247),'Urban':(6996,7078)}
for i,r in enumerate(a['rows']):
    lo,hi=vals[r['sector']]
    for k,v in [('without',lo),('with',hi),('boostPct',round((hi-lo)/lo*100,2))]:cell(fn,f'rows[{i}].{k}',r[k],v,f'HCES press note pp1,2,8; {r["sector"]} MPCE without/with; (with-without)/without')
tin=subprocess.check_output(['pdftotext','-layout',str(R/'tinbergen-25069.pdf'),'-'],text=True)
def last_table_cell(pattern, marker):
    match=re.search(pattern,tin,re.M)
    assert match, f"TI25069 missing exact table row: {marker}"
    return float(match.group(1))
naive=last_table_cell(r"^\s*National\s+29\.6\s+(7\.2)\s*$",'Table1 national2022/23')
ces_low=last_table_cell(r"^Economic Reasoning Demographics and Assets \+ SFE\s+12\.9 \(0\.68\)\s+7\.4 \(0\.79\)\s+(11\.3) \(0\.53\)",'Table3')
ces_high=last_table_cell(r"^Demographics\s+14\.6 \(0\.73\)\s+11\.1 \(0\.65\)\s+(13\.6) \(0\.55\)",'Table3 LASSO')
ces_ranga=last_table_cell(r"^\s*LASSO Demographics \+ SFE\s+18\.2 \(0\.74\)\s+15\.8 \(0\.89\)\s+(17\.5) \(0\.58\)",'Table4')
plfs_low=last_table_cell(r"^Economic Reasoning\s+Total\s+18\.0 \(0\.59\).*?16\.9 \(0\.60\)\s+(17\.5) \(2\.03\)",'Table5 sector models applied within states')
plfs_high=last_table_cell(r"^Economic Reasoning \+ SFE\s+Total\s+19\.5 \(0\.64\).*?19\.4 \(0\.64\)\s+(19\.9) \(2\.34\)",'Table5 sector-wide')
plfs_ranga=last_table_cell(r"^Economic Reasoning \+ SFE\s+Total\s+25\.8 \(0\.72\).*?25\.4 \(0\.71\)\s+(25\.9) \(2\.39\)",'Table6 sector-wide')
_,p17=loadpip('2.15',2017);_,p3=loadpip('3.00');_,p42=loadpip('4.20')
method=[round(p17[2022]['headcount']*100,2),round(p3[2022]['headcount']*100,2),naive,ces_low,ces_high,ces_ranga,plfs_low,plfs_high,round(float(pip[pip.year.eq(2022)].iloc[0].spr)*100,2),round(p42[2022]['headcount']*100,2),plfs_ranga]
fn,a=artifact('survey_method_controversy_2022')
for i,r in enumerate(a['rows']):
    v=method[i]
    if i in [0,1,8,9]:src='PIP national2022 headcount (or PIP spr*100) at labelled line'
    else:
        src='TI25069: directHCES Table1=7.2; CES Table3=11.3/13.6,Table4=17.5; EUS/PLFS Table5=17.5/19.9,Table6=25.9'
    cell(fn,f'rows[{i}].value',r['value'],v,src)
mpm=pd.read_excel(R/'MPM_AM26.xlsx',sheet_name='data');mpm=mpm[mpm['Country code'].eq('IND')].iloc[0]
fn,a=artifact('monetary_vs_capability_deprivation')
mpcols={'headcount (MPM':'Multidimensional poverty headcount ratio (%)','sanitation':'Sanitation (%)','drinking water':'Drinking water (%)','electricity':'Electricity (%)','No adult':'Educational attainment (%)','WB MPM / PIP':'Monetary (%)'}
for i,r in enumerate(a['rows']):
    lab=r['label'];v=None;src=None
    for key,col in mpcols.items():
        if key in lab:v=round(float(mpm[col])*100,2);src=f'MPM_AM26.xlsx data Country code=IND column={col}'
    if 'NFHS' in lab:
        text=subprocess.check_output(['pdftotext','-layout',str(R/'NFHS5_Parliament_20220727.pdf'),'-'],text=True)
        assert re.search(r'India\s+35\.5\s+19\.3\s+32\.1',text)
        v=35.5 if 'stunted' in lab else 32.1;src='Rajya Sabha AU1272 27July2022 AnnexureI India row: NFHS5 2019-21 stunting35.5 underweight32.1, under5'
    elif 'health spending' in lab:
        code='SH_UHC_FH40_IMPOV' if 'Impoverishing' in lab else 'SH_UHC_FH40'
        q=next(q for q in json.loads((R/(code+'.json')).read_text())[1] if q['value'] is not None)
        assert q['date']=='2022';v=q['value'];src=f'{code}.json India,date2022,value'
    elif 'Societal' in lab:v=round(float(pip[pip.year.eq(2023)].iloc[0].spr)*100,2);src='PIP DTA national2023 spr*100'
    elif 'PIP, HCES 2023' in lab:
        ff,pp=loadpip('3.00' if '3.00' in lab else '4.20');v=round(pp[2023]['headcount']*100,2);src=f'{ff} national2023 headcount*100'
    assert v is not None,lab
    cell(fn,f'rows[{i}].value',r['value'],v,src)
x=pd.ExcelFile(R/'chapter1.xlsx');z=pd.read_excel(R/'chapter2.xlsx',sheet_name='fig10_2026');z=z[z['country/economy code'].eq('IND')].iloc[0]
fn,a=artifact('global_poverty_footprint')
for i,r in enumerate(a['rows']):
    if i<3:
        d=x.parse(['fig6 3.00','fig6 4.20','fig6 8.30'][i]);v=d[d['Country Name'].eq('India')].iloc[0]
        pairs=[('india_millions',round(float(v.iloc[2]),2)),('india_global_share_pct',round(float(v['Share (%)']),2))]
        src=f'chapter1.xlsx fig6 {[3,4.2,8.3][i]} India poor population /Share (%)'
    else:
        pop=f[f.year.eq(2026)&f.povertyline.round(2).eq(3)].iloc[0]['pop'];pairs=[('india_millions',round(float(pop),2)),('india_global_share_pct',round(float(z['Country contribution to Global Prosperity Gap'])*100,2))];src='chapter2.xlsx fig10_2026 IND contribution; Country_FGT2026 IND pop'
    pairs.append(('india_pop_share_pct',round(float(z['Country population share of global population'])*100,2)))
    for k,v in pairs:cell(fn,f'rows[{i}].{k}',r[k],v,src+'; chapter2 fig10_2026 population share')
# New layers: derive independently from original rows; do not import builder summaries.
fn,a=artifact('decile_real_growth_2022_2023')
assert a['unit']=='% change'
surveys={year:pip[pip.year.eq(year)].iloc[0] for year in (2022,2023)}
assert all(surveys[y].comparable_spell=='2022 - 2023' and surveys[y].welfare_type=='consumption' for y in surveys)
assert surveys[2022].ppp==surveys[2023].ppp
assert [r['decile'] for r in a['rows']]==list(range(1,11))
for i,r in enumerate(a['rows']):
    d=i+1
    assert r['label']==('Poorest 10%' if d==1 else 'Richest surveyed 10%' if d==10 else f'Decile {d}')
    before=float(surveys[2022]['mean'])*float(surveys[2022][f'decile{d}'])*10
    after=float(surveys[2023]['mean'])*float(surveys[2023][f'decile{d}'])*10
    src=f'pip_20260922 DTA IND national year2022/2023 mean*decile{d}/0.1; comparable_spell2022 - 2023'
    for k,v in [('decile',d),('mean2022',round(before,4)),('mean2023',round(after,4)),('value',round((after/before-1)*100,2))]:
        cell(fn,f'rows[{i}].{k}',r[k],v,src+f'; {k}')
fn,a=artifact('poverty_buffer_2024');y=bins[bins.year.eq(2024)]
assert a['unit']=='% of population'
assert len(a['rows'])==3
for i,(r,line) in enumerate(zip(a['rows'],[3.,4.2,8.3])):
    assert r['line']==f'${line:.2f}/day'
    for key,factor in [('baseline',1.),('loss10',.9)]:
        total=sum(float(pop) for pop in y['pop'])
        below=sum(float(pop) for welfare,pop in zip(y.welf,y['pop']) if float(welfare)*factor<line)
        cell(fn,f'rows[{i}].{key}',r[key],round(below/total*100,1),f'IND_GlobalDist1000bins CSV2024 weighted share welf*{factor}<{line}; {key}; 0.1pp resolution')
fn,a=artifact('peer_thresholds_2024')
world=pd.read_stata(R/'Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta')
assert [(r['code'],r['country']) for r in a['rows']]==[('IND','India'),('BGD','Bangladesh'),('IDN','Indonesia'),('VNM','Viet Nam'),('PAK','Pakistan')]
assert a['unit']=='% of population'
for i,r in enumerate(a['rows']):
    for key,line in [('p300',3.),('p420',4.2),('p830',8.3)]:
        v=world[world.code.eq(r['code']) & world.year.eq(2024) & world.povertyline.round(2).eq(line)]
        assert len(v)==1
        assert r['estimateBasis'][key]==str(v.iloc[0].estimate_type)
        cell(fn,f'rows[{i}].{key}',r[key],round(float(v.iloc[0].fgt0),2),f'Country_FGT {r["code"]} year2024 povertyline={line} fgt0; estimate_type={v.iloc[0].estimate_type}')
fn,a=artifact('child_poverty_2023')
sp=pd.read_excel(R/'AM26_SPID_data.xlsx',sheet_name='Data');sp['excelRow']=sp.index+2
sp=sp[sp.code.eq('IND') & sp.year.eq(2023)]
sp['state']=sp['sample'].replace({'Orissa':'Odisha','Andaman and Nicobar':'Andaman and Nicobar Islands'})
children=sp[sp.data_group.eq('0-5')].set_index('state');everyone=sp[sp.data_group.eq('ALL')].set_index('state')
assert children.index.is_unique and everyone.index.is_unique and len(children)==len(everyone)==36
assert children.ref_year.eq(2023.58).all() and everyone.ref_year.eq(2023.58).all()
assert children.survname.eq('HCES').all() and everyone.survname.eq('HCES').all()
assert a['unit']=='% of each age group'
assert (children.poor830>everyone.poor830).all()
subgroup_pattern = {
    "source": "AM26_SPID_data.xlsx, Data; IND, year2023, ref_year2023.58, poor830; nested data_group0-5 versusALL",
    "matchedStates": 36,
    "higherChildShareStates": int((children.poor830>everyone.poor830).sum()),
    "pairs": [{"state": state, "childCell": f'T{int(children.loc[state,"excelRow"])}', "allAgeCell": f'T{int(everyone.loc[state,"excelRow"])}',
               "childSharePct": float(children.loc[state,"poor830"])*100, "allAgeSharePct": float(everyone.loc[state,"poor830"])*100,
               "childHigher": bool(children.loc[state,"poor830"]>everyone.loc[state,"poor830"])} for state in children.index]
}
assert len(a['rows'])==14
for i,r in enumerate(a['rows']):
    for key,group,table in [('allAges','ALL',everyone),('ages0to5','0-5',children)]:
        source=table.loc[r['state']];excelrow=int(source.excelRow)
        assert a['metadata']['sourceRows'][r['state']][key]==excelrow
        cell(fn,f'rows[{i}].{key}',r[key],round(float(source.poor830)*100,2),f'AM26_SPID_data.xlsx Data!T{excelrow},poor830; IND state={r["state"]} year2023 ref_year2023.58 data_group={group}; *100')
# Completeness: every numeric data cell must be mapped. Regions duplicate rows intentionally checked.
covered={q['artifact'] for q in checks};catalog=json.loads((ROOT/'data/catalog/poverty-debate-manifest.json').read_text())
assert covered=={Path(q['artifact']).name for q in catalog},('unmapped artifacts',covered ^ {Path(q['artifact']).name for q in catalog})
for q in catalog:
    fn=Path(q['artifact']).name;a=json.loads((ROOT/q['artifact']).read_text());mapped={x['cell'] for x in checks if x['artifact']==fn}
    for section in ['rows','observations','regions']:
        for i,r in enumerate(a.get(section,[])):
            for k,v in r.items():
                if isinstance(v,(int,float)) and not isinstance(v,bool):assert f'{section}[{i}].{k}' in mapped,(fn,section,i,k,'unmapped numeric cell')
result={'story':'q.econ.poverty_debate','rawFilesHashChecked':len(manifest['files']),'artifactsChecked':len(covered),'numericCellsChecked':len(checks),'mismatches':len(failures),'checks':checks,'allCellsMapped':True,'subgroupPattern':subgroup_pattern}
(A/'independent-cell-audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(f"Independent raw reconciliation: {len(covered)} artifacts, {len(checks)} numeric cells, {len(failures)} mismatches; {len(manifest['files'])} source hashes.")
sys.exit(bool(failures))
