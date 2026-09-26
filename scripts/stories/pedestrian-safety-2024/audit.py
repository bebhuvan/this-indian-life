#!/usr/bin/env python3
"""Reopen published artifacts and compare all plotted values to original-source rows."""
import csv
import hashlib
import json
import re
from pathlib import Path
import pymupdf

ROOT=Path(__file__).resolve().parents[3]
RAW=ROOT/'data/raw/pedestrian-safety-2024'
OUT=ROOT/'data/audits/pedestrian-safety-2024'
RESULTS=[]
PDF_VISUAL_TOP={'Tamil Nadu':4712,'Bihar':4149,'Maharashtra':3344,'West Bengal':3241,
 'Karnataka':2321,'Uttar Pradesh':2131,'Rajasthan':2042,'Madhya Pradesh':1928,
 'Gujarat':1747,'Andhra Pradesh':1739}
PDF_VISUAL_AGE=[1319,569,3571,762,6051,1230,6338,1298,6669,1767,4462,1698,645,147]


def artifact(name):return json.loads((ROOT/f'data/series/{name}.json').read_text())

def check(indicator,cell,observed,expected,ref,kind='plotted'):
 RESULTS.append({'indicatorId':indicator,'cell':cell,'artifactValue':observed,'sourceValue':expected,
                 'sourceRef':ref,'checkKind':kind,'match':observed==expected})

def pdf_row(page,label,width):
 pattern=re.compile(r'^\s*'+re.escape(label)+r'\s{2,}(.+)$',re.I)
 values=[]
 for line in page.splitlines():
  if (m:=pattern.match(line)):
   n=[float(x.replace(',','')) for x in re.findall(r'(?<![\w-])-?\d[\d,]*(?:\.\d+)?(?!\w)',m.group(1))]
   if len(n)==width:values.append(n)
 if len(values)!=1:raise ValueError(f'PDF row {label}: {len(values)} matches')
 return values[0]

def scan_rows(path):
 out={}
 for line in path.read_text().splitlines():
  if not line.startswith('|'):continue
  fields=[x.strip().replace('**','').replace('<br>',' ') for x in line.strip().strip('|').split('|')]
  if not fields or not re.fullmatch(r'\d+',fields[0]) or fields[1]=='2':continue
  out[fields[1].lower()]=[int(x.replace(',','')) for x in fields[2:]]
 return out

def main():
 manifest=json.loads((RAW/'manifest.json').read_text())
 for item in manifest['files']:
  file=RAW/item['path']
  if hashlib.sha256(file.read_bytes()).hexdigest()!=item['sha256']:raise ValueError(f'Raw hash differs: {item["path"]}')
 who=(RAW/'who-pedestrian-safety-manual-page.html').read_text()
 if not all(x in who for x in ['sidewalks','Speed management','separating pedestrians']):raise ValueError('WHO guidance snapshot content changed')
 ruling=pymupdf.open(RAW/'supreme-court-right-to-walk-2026.pdf')
 if len(ruling)!=13:raise ValueError('Supreme Court judgment page count changed')
 ruling_open=ruling[0].get_text()
 ruling_holding=' '.join((ruling[11].get_text()+ruling[12].get_text()).split())
 if not all(x in ruling_open for x in ['MANIYAR ILIYAZ', 'P. AYYAPPAN']):raise ValueError('Supreme Court judgment identity differs')
 if not all(x in ruling_holding for x in ['right to walk is a fundamental right', 'right to demarcated footpaths', 'panchayats', 'restitution and compensation', 'June 19, 2026']):raise ValueError('Supreme Court judgment holding differs')
 pdf=pymupdf.open(RAW/'road-accidents-in-india-2024.pdf')
 text={n:pdf[n-1].get_text(sort=True) for n in [68,92,96,98,100]}
 ped=pdf_row(text[98],'Pedestrians',3)
 total=int(ped[1]);trend=artifact('pedestrian-safety-2024.deaths.2023_2024')
 for i,item in enumerate(trend['rows']):check(trend['indicatorId'],item['label'],item['value'],int(ped[i]),'MoRTH Table 4.4, PDF p98, Pedestrians, '+item['label'])
 age_total_line=[x for x in (RAW/'reading-aid-annex33.md').read_text().splitlines() if x.startswith('|  | **Total**')]
 if len(age_total_line)!=1:raise ValueError('Annexure 33 total row missing')
 scan_age=[int(x.replace(',','').replace('*','').strip()) for x in age_total_line[0].split('|')[3:-1] if x.strip()]
 if scan_age!=PDF_VISUAL_AGE:raise ValueError('Annexure 33 model transcription disagrees with visually checked original PDF p222 total row')
 ages=artifact('pedestrian-safety-2024.ages.2024')
 expected_age=[sum(PDF_VISUAL_AGE[2*i:2*i+2]) for i in range(7)]
 for item,expected in zip(ages['rows'],expected_age):check(ages['indicatorId'],item['label'],item['value'],expected,'MoRTH Annexure 33, original scan PDF p222, total row male + female')
 sex=artifact('pedestrian-safety-2024.sex.2024')
 expected_sex=[sum(PDF_VISUAL_AGE[::2]),sum(PDF_VISUAL_AGE[1::2])]
 for item,expected in zip(sex['rows'],expected_sex):check(sex['indicatorId'],item['label'],item['value'],expected,'MoRTH Annexure 33, original scan PDF p222, total row')
 narrative=text[96]
 if not ('29,055' in narrative and '7,471' in narrative):raise ValueError('MoRTH PDF p96 narrative sex totals absent')
 shares=artifact('pedestrian-safety-2024.share_of_age_deaths.2024')
 for item,age,all_label in zip(shares['rows'],expected_age,['Less than 18','18-25','25-35','35-45','45-60','Above 60','Age not known']):
  all_deaths=int(pdf_row(text[92],all_label,3)[1])
  expected=round(100*age/all_deaths,1)
  check(shares['indicatorId'],item['label'],item['value'],expected,'MoRTH Annexure 33 PDF p222 numerator; Table 4.2 PDF p92 denominator')
  check(shares['indicatorId'],item['label']+' numerator',item['pedestrianDeaths'],age,'MoRTH Annexure 33 PDF p222',kind='calculation')
  check(shares['indicatorId'],item['label']+' denominator',item['allRoadDeaths'],all_deaths,'MoRTH Table 4.2 PDF p92',kind='calculation')
 impacted=artifact('road-safety-2024.pedestrian_impact.2024')
 impacting=pdf_row(text[100],'Pedestrians',9)
 for i,item in enumerate(impacted['rows']):check(impacted['indicatorId'],item['label'],item['value'],int(impacting[i]),f'MoRTH Table 4.5, PDF p100, Pedestrians, column {i+1}')
 states=artifact('pedestrian-safety-2024.states_top_ten.2024')
 scan29=scan_rows(RAW/'reading-aid-annex29a.md')
 scan33=scan_rows(RAW/'reading-aid-annex33.md')
 if len(scan29)!=36 or len(scan33)!=36:raise ValueError('Scanned annexure state row count changed')
 for name,fields in scan29.items():
  other=scan33[name]
  check('road.pedestrian.state_reconciliation',name,fields[-1],sum(other),
        'MoRTH original scan Annexure 29(a) PDF p210 vs independent Annexure 33 PDF p222',kind='cross-check')
 for item in states['rows']:
  expected=scan29[item['label'].lower()][-1]
  if PDF_VISUAL_TOP[item['label']]!=expected:raise ValueError('Visually checked state source cell differs from scan transcription')
  check(states['indicatorId'],item['label'],item['value'],expected,'MoRTH Annexure 29(a), original scan PDF p210, state total')
 roads=artifact('pedestrian-safety-2024.national_highways.2024')
 nh=int(pdf_row(text[68],'Pedestrians',6)[3])
 for item,expected,ref in zip(roads['rows'],[nh,total-nh],['MoRTH Table 2.11, PDF p68, Pedestrians, 2024 deaths','MoRTH Table 4.4 PDF p98 minus Table 2.11 PDF p68']):check(roads['indicatorId'],item['label'],item['value'],expected,ref)
 users=artifact('road-safety-2024.road_users.2024')
 previous=list(csv.DictReader((ROOT/'data/audits/road-safety-2024/source-cell-audit.csv').open()))
 prior={x['cell']:x for x in previous if x['indicatorId']==users['indicatorId'] and x['cell']!='2024 category sum'}
 if len(prior)!=len(users['rows']):raise ValueError('Reused road-user artifact lacks prior PDF cell audit')
 for item in users['rows']:
  p=prior[item['label']]
  if p['match']!='True' or int(p['sourceValue'])!=int(p['artifactValue']):raise ValueError('Prior road-user source audit mismatch')
  check(users['indicatorId'],item['label'],item['value'],int(p['sourceValue']),p['sourceRef']+'; prior audited artifact')
 partitions=[('pedestrian ages',sum(x['value'] for x in ages['rows']),total),
             ('pedestrian sex',sum(x['value'] for x in sex['rows']),total),
             ('impacting vehicle',sum(x['value'] for x in impacted['rows']),total),
             ('state annexure',sum(x[-1] for x in scan29.values()),total),
             ('national-highway split',sum(x['value'] for x in roads['rows']),total)]
 for name,actual,expected in partitions:check('road.pedestrian.partitions',name,actual,expected,'MoRTH Table 4.4 PDF p98, 2024 pedestrian total',kind='cross-check')
 OUT.mkdir(exist_ok=True)
 with (OUT/'source-cell-audit.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=RESULTS[0].keys(),lineterminator='\n');w.writeheader();w.writerows(RESULTS)
 report={'sourceHashesChecked':len(manifest['files']),'plottedCellsChecked':sum(x['checkKind']=='plotted' for x in RESULTS),
         'calculationInputsChecked':sum(x['checkKind']=='calculation' for x in RESULTS),
         'crossChecks':sum(x['checkKind']=='cross-check' for x in RESULTS),
         'mismatches':sum(not x['match'] for x in RESULTS),
         'legalSourceReview':{'officialPdfPages':len(ruling),'caseIdentityChecked':True,'holdingCheckedOnPdfPages':[12,13],
                              'scope':'2026 legal holding, not evidence for 2024 death counts or footpath prevalence'},
         'scannedSourceReview':{
          'annexure29aPdfPage':210,'annexure33PdfPage':222,'visuallyLockedTopStateCells':len(PDF_VISUAL_TOP),
          'visuallyLockedAgeSexCells':len(PDF_VISUAL_AGE),
          'fullStateTotalReconciliations':len(scan29),
          'note':'SpaceBunny Markdown is a reading aid. Displayed scanned cells were visually checked against the original PDF page images; two distinct annexures reconcile state totals.'}}
 (OUT/'source-cell-audit.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
 if report['mismatches']:raise SystemExit(1)

if __name__=='__main__':main()
