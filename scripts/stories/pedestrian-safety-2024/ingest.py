#!/usr/bin/env python3
"""Build pedestrian charts from frozen MoRTH pages and visually checked scan rows."""
import csv
import hashlib
import json
import re
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / 'data/raw/pedestrian-safety-2024'
SERIES = ROOT / 'data/series'
CATALOG = ROOT / 'data/catalog/pedestrian-safety-2024-manifest.json'
AUDIT = ROOT / 'data/audits/pedestrian-safety-2024'
SOURCE = 'https://data.opencity.in/dataset/33d29ab0-f9e8-4fc7-b404-c93c1ed8e1b8/resource/30af828c-3513-4c74-a919-8daa708f077d/download/road-accidents-in-india-2024.pdf'
HASH = 'b45b0e4d8e14a8d4653790f9080a01b9b95b79008359ba93dc12497064be69b2'
STAMP = '2026-09-26T17:10:00Z'
NUM = re.compile(r'(?<![\w-])-?\d[\d,]*(?:\.\d+)?(?!\w)')
# These cells were checked against the original scanned Annexure 29(a), PDF p210.
LOCKED_TOP_STATES = {'Tamil Nadu': 4712, 'Bihar': 4149, 'Maharashtra': 3344,
    'West Bengal': 3241, 'Karnataka': 2321, 'Uttar Pradesh': 2131,
    'Rajasthan': 2042, 'Madhya Pradesh': 1928, 'Gujarat': 1747, 'Andhra Pradesh': 1739}
# Original scanned Annexure 33 total row, PDF p222: male/female pairs by age.
LOCKED_AGE_SEX = [(1319,569),(3571,762),(6051,1230),(6338,1298),
                  (6669,1767),(4462,1698),(645,147)]
NAMES = ['Under 18','18–25','25–35','35–45','45–60','60 and over','Age unknown']


def nums(value):
    return [float(x.replace(',', '')) for x in NUM.findall(value)]


def source_row(lines, label, count, page, table):
    pattern = re.compile(r'^\s*'+re.escape(label)+r'\s{2,}(.+)$', re.I)
    matches = [nums(m.group(1)) for line in lines if (m := pattern.match(line))]
    matches = [x for x in matches if len(x)==count]
    if len(matches)!=1: raise ValueError(f'Table {table} PDF p{page}, {label}: {len(matches)} rows')
    return matches[0]


def md_table_rows(path):
    rows=[]
    for line in path.read_text().splitlines():
        if not line.startswith('|'): continue
        cells=[x.strip().replace('**','').replace('<br>',' ') for x in line.strip().strip('|').split('|')]
        if not re.fullmatch(r'\d+',cells[0]): continue
        if not cells[1] or cells[1]=='2':continue
        rows.append(cells)
    return rows


def doc(slug,title,table,page,rows,unit='persons',note=''):
    path=SERIES/f'pedestrian-safety-2024.{slug}.json'
    data={'schemaVersion':1,'artifactType':'table','indicatorId':f'road.pedestrian.{slug}',
          'title':title,'sourceId':'morth-road-accidents-2024','sourceIndicatorId':table,
          'sourceUrl':SOURCE,'unit':unit,'geography':{'type':'country','id':'IN','name':'India'},
          'dimensions':[],'fetchedAt':STAMP,
          'metadata':{'sourcePage':page,'vintage':'MoRTH Road Accidents in India 2024',
                      'method':note},'rows':rows}
    path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    return path.relative_to(ROOT).as_posix(),data


def main():
    if hashlib.sha256((RAW/'road-accidents-in-india-2024.pdf').read_bytes()).hexdigest()!=HASH:raise ValueError('MoRTH PDF hash changed')
    SERIES.mkdir(exist_ok=True);AUDIT.mkdir(exist_ok=True)
    pdf=pymupdf.open(RAW/'road-accidents-in-india-2024.pdf')
    text={p:pdf[p-1].get_text(sort=True).splitlines() for p in [68,92,93,96,98,100]}
    ped=source_row(text[98],'Pedestrians',3,98,'4.4')
    if [int(x) for x in ped[:2]] != [35221,36526]:raise ValueError('Pedestrian annual values changed')
    total=int(ped[1]);files=[]
    files.append(doc('deaths.2023_2024','Police-recorded pedestrian deaths, 2023 and 2024','Table 4.4',98,
        [{'label':year,'value':int(ped[i]),'sourceRow':'Pedestrians','sourceColumn':i} for i,year in enumerate(['2023','2024'])],
        note='Two calendar years only; source changed its victim classification format in 2019.'))
    annex33=md_table_rows(RAW/'reading-aid-annex33.md')
    total_line=[line for line in (RAW/'reading-aid-annex33.md').read_text().splitlines() if line.startswith('|  | **Total**')]
    if len(total_line)!=1:raise ValueError('Missing Annexure 33 total line')
    extracted=[int(x.replace(',','').replace('*','').strip()) for x in total_line[0].split('|')[3:-1] if x.strip()]
    if extracted != [v for pair in LOCKED_AGE_SEX for v in pair]:raise ValueError('Scan transcription differs from visually checked age/sex total')
    ages=[{'label':name,'value':sum(pair),'sourceRow':'Total','sourceColumns':[2*i,2*i+1]} for i,(name,pair) in enumerate(zip(NAMES,LOCKED_AGE_SEX))]
    files.append(doc('ages.2024','Pedestrian victims by age, 2024','Annexure 33',222,ages,
        note='Male and female source cells summed within each published age band. Annexure is a scan; total row visually checked against original PDF.'))
    men=sum(x[0] for x in LOCKED_AGE_SEX); women=sum(x[1] for x in LOCKED_AGE_SEX)
    if (men,women)!=(29055,7471) or men+women!=total:raise ValueError('Pedestrian sex totals do not reconcile with report narrative')
    files.append(doc('sex.2024','Pedestrian victims by sex, 2024','Annexure 33; section 4.12',222,
        [{'label':'Male','value':men,'sourceRow':'Total','sourceColumns':'male'},
         {'label':'Female','value':women,'sourceRow':'Total','sourceColumns':'female'}],
        note='Summed scanned Annexure 33 total row; reconciles to PDF p96 narrative. Sex of victims, not exposure-adjusted risk.'))
    all_sex=source_row(text[93],'Total',6,93,'4.3')
    all_men,all_women=map(int,all_sex[2:4])
    if (all_men,all_women)!=(151950,25225) or all_men+all_women!=177175:raise ValueError('All-road sex totals changed')
    sex_share=[{'label':label,'value':round(100*pedestrian/all_road,1),
                'pedestrianDeaths':pedestrian,'allRoadDeaths':all_road,
                'sourceRow':'Total','sourceColumns':label.lower()}
               for label,pedestrian,all_road in [('Male',men,all_men),('Female',women,all_women)]]
    files.append(doc('share_of_sex_deaths.2024','Pedestrian share of road deaths within each sex, 2024',
        'Table 4.3 + Annexure 33',93,sex_share,unit='percent',
        note='Pedestrian deaths of each recorded sex divided by all road deaths of the same sex, times 100. This is victim mix, not per-walk risk.'))
    age_labels=['Less than 18','18-25','25-35','35-45','45-60','Above 60','Age not known']
    all_age=[int(source_row(text[92],name,3,92,'4.2')[1]) for name in age_labels]
    share_rows=[{'label':name,'value':round(100*age['value']/all_deaths,1),
                 'pedestrianDeaths':age['value'],'allRoadDeaths':all_deaths,
                 'sourceRow':age_labels[i]} for i,(name,age,all_deaths) in enumerate(zip(NAMES,ages,all_age))]
    files.append(doc('share_of_age_deaths.2024','Pedestrian share of road deaths within each age band, 2024','Table 4.2 + Annexure 33',92,
        share_rows,unit='percent',note='Within each age band, pedestrian deaths divided by all road deaths, times 100. This is a share of deaths, not risk of walking.'))
    annex29=md_table_rows(RAW/'reading-aid-annex29a.md')
    state_counts={line[1]:int(line[-1].replace(',','')) for line in annex29}
    if len(state_counts)!=36 or sum(state_counts.values())!=total:raise ValueError('Annexure 29(a) state partition failed')
    for name,value in LOCKED_TOP_STATES.items():
        if state_counts[name]!=value:raise ValueError(f'Original scan and transcription disagree: {name}')
    # A second scanned annexure independently reconciles every state total by age and sex.
    age_state={line[1].lower().replace('  ',' '):sum(int(x.replace(',','')) for x in line[2:]) for line in annex33}
    aliases={'a & n islands':'a & n islands','andhra pradesh':'andhra pradesh','d & n haveli and daman & diu':'d & n haveli and daman & diu'}
    for name,value in state_counts.items():
        key=name.lower().replace('  ',' ')
        if age_state.get(key)!=value:raise ValueError(f'Independent state annexures disagree: {name}: {value} vs {age_state.get(key)}')
    states=[{'label':name,'value':value,'sourceRow':name} for name,value in LOCKED_TOP_STATES.items()]
    files.append(doc('states_top_ten.2024','Ten states with the most recorded pedestrian deaths, 2024','Annexure 29(a)',210,states,
        note='Selected top ten of 36 states and union territories; original scanned cells visually checked and full state totals reconciled to Annexure 33. Raw counts are not walking risk.'))
    nh=int(source_row(text[68],'Pedestrians',6,68,'2.11')[3])
    if nh!=11386:raise ValueError('National-highway pedestrian deaths changed')
    roads=[{'label':'National highways','value':nh,'sourceRow':'Pedestrians'},
           {'label':'Other roads combined','value':total-nh,'sourceRow':'Derived: Table 4.4 minus Table 2.11'}]
    files.append(doc('national_highways.2024','Pedestrian deaths on national highways and other roads, 2024','Table 2.11 + Table 4.4',68,roads,
        note='Other roads combined = all pedestrian deaths minus national-highway pedestrian deaths; includes state highways and all other roads. No travel exposure by road class.'))
    # Existing, independently source-audited series are reused to avoid duplicate artifact identities.
    for slug in ['road_users.2024','pedestrian_impact.2024']:
        path=ROOT/f'data/series/road-safety-2024.{slug}.json'
        files.append((path.relative_to(ROOT).as_posix(),json.loads(path.read_text())))
    catalog=[{'indicatorId':d['indicatorId'],'sourceIndicatorId':d['sourceIndicatorId'],
              'artifact':path,'status':'ready','source':d['sourceUrl'],'fetchedAt':d['fetchedAt']} for path,d in files]
    CATALOG.write_text(json.dumps(catalog,indent=2)+'\n')
    print(json.dumps({'artifacts':len(files),'pedestrianDeaths':total,'ageSum':sum(x['value'] for x in ages),
                      'sexSum':men+women,'stateSum':sum(state_counts.values()),'nationalHighway':nh,
                      'stateCrossChecks':len(state_counts)},indent=2))

if __name__=='__main__':main()
