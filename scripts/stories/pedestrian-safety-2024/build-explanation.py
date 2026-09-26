#!/usr/bin/env python3
"""Build the pedestrian article from its durable edited Markdown and audited artifacts."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
QID='q.health.pedestrian_safety_2024'
BODY=ROOT/f'data/prose/{QID}.md'
OUT=ROOT/f'data/explanations/en/{QID}.json'
MORTH='https://data.opencity.in/dataset/33d29ab0-f9e8-4fc7-b404-c93c1ed8e1b8/resource/30af828c-3513-4c74-a919-8daa708f077d/download/road-accidents-in-india-2024.pdf'
WHO='https://www.who.int/publications/i/item/9789240072497/'
COURT='https://api.sci.gov.in/supremecourt/2024/42514/42514_2024_3_1501_71888_Judgement_19-Jun-2026.pdf'
CHARTS=[
 ('road-safety-2024.road_users.2024','One in five recorded road deaths was a pedestrian',
  'Pedestrians account for 36,526 of 177,175 recorded deaths in 2024.',
  'Only two-wheeler users have a larger count. Road-user groups identify the people killed; they do not identify the person responsible for a collision.',
  'The reader needs to see the pedestrian toll within the full road-death record.',
  'Each bar is a victim road-user group, all for India in 2024.',
  'A death share is not the chance of dying on a journey.',
  'Long road-user names wrap; the count stays beside each bar.'),
 ('pedestrian-safety-2024.deaths.2023_2024','Pedestrian deaths rose again in 2024',
  'The police count rose from 35,221 to 36,526 in one year.',
  'That is 1,305 additional recorded deaths, or 3.7 per cent. The two years use the same victim-category definition in this report.',
  'The direct comparison tests whether the toll was falling at the latest point.',
  'Read the two calendar-year bars together; they are counts of people, not crashes.',
  'Two annual counts cannot establish a long-run trend or per-trip risk.',
  'Both years have a printed value alongside the bar.'),
 ('pedestrian-safety-2024.ages.2024','Deaths of pedestrians span every age group',
  'The 45–60 band records 8,436 pedestrian deaths, and 6,160 victims were 60 or older.',
  'The report also records 1,888 victims under 18 and 792 whose age was unknown. The published bands sum to all pedestrian victims.',
  'Age gives the toll a human distribution before any attempt at comparison.',
  'Read each published age band as a count of pedestrians killed; unknown age remains separate.',
  'A count by age does not measure the risk of a walk for that age.',
  'Keep the Age unknown row visible when comparing the other bars.'),
 ('pedestrian-safety-2024.share_of_age_deaths.2024','Walking victims make up a larger share of road deaths at older ages',
  'Pedestrians were 41.7 per cent of road victims aged 60 and over, compared with 12.7 per cent at 18–25.',
  'Each bar divides pedestrian deaths by all road deaths in the same published age band. Each age band has its own total of road deaths; the report does not count how much people walk.',
  'This same-age comparison asks a different question from the raw age counts.',
  'Values are percentages of road deaths within each age band, not percentages of all pedestrians.',
  'The chart does not give the chance of dying while walking.',
  'Read the unit in the heading: per cent of road deaths in that age band.'),
 ('pedestrian-safety-2024.share_of_sex_deaths.2024','Walking was a larger share of female road deaths',
  'Pedestrians made up 29.6% of female road victims, against 19.1% of male road victims.',
  'The chart divides 7,471 female pedestrian deaths by 25,225 female road deaths, and 29,055 male pedestrian deaths by 151,950 male road deaths. It compares victim mix, not danger per walking trip.',
  'The within-sex comparison adds meaning to the raw male and female pedestrian counts.',
  'Each bar shows pedestrian deaths as a share of all road deaths of that same recorded sex.',
  'Do not read the higher female share as a higher risk per walk; walking exposure is missing.',
  'The percentage unit remains visible beside both direct values.'),
 ('road-safety-2024.pedestrian_impact.2024','Two-wheelers and cars figure prominently in pedestrian deaths',
  'Two-wheelers appear in 10,378 pedestrian deaths and cars, taxis, vans and light motor vehicles in 9,302.',
  'The mixed Others group contains 7,857 deaths, so a large part of the police classification remains vague. Impacting vehicle is a police field, not a legal finding of fault.',
  'The other vehicle involved is a different question from the victim’s road-user type.',
  'Eight impacting-vehicle categories partition the 36,526 pedestrian victims.',
  'The bars cannot rank vehicles by danger per kilometre driven or assign blame.',
  'The long car and Others labels wrap; their counts remain visible.'),
 ('pedestrian-safety-2024.states_top_ten.2024','Ten states account for three-quarters of pedestrian deaths',
  'The ten displayed state totals add to 27,354 pedestrian deaths, or 74.9 per cent nationally.',
  'Tamil Nadu records 4,712 and Bihar 4,149. The chart selects the ten largest counts from Annexure 29(a); other states and union territories are omitted.',
  'The state lens shows where a large local evidence task would sit.',
  'These are selected raw totals, not rates; they do not partition the entire national toll.',
  'Without walking journeys or distance, a state ranking is not a safety ranking.',
  'Long state names wrap and every bar keeps its value.'),
 ('pedestrian-safety-2024.share_of_state_deaths.2024','Pedestrians make up different shares of road deaths across high-count states',
  'Bihar records 44.4% and Uttar Pradesh 8.8% among the ten states with the most pedestrian deaths.',
  'Each percentage divides a state’s pedestrian deaths by all its road deaths. The selection is by pedestrian count, not percentage. West Bengal’s source totals were recast from electronic aggregates.',
  'The within-state comparison tests whether high overall tolls have the same victim mix.',
  'Each bar is the pedestrian share of road deaths in one of the ten selected states.',
  'This is not walking risk, and West Bengal has a specific reporting caveat.',
  'State names can wrap; percentage values remain beside the bars.'),
 ('pedestrian-safety-2024.national_highways.2024','Most pedestrian deaths were recorded off national highways',
  'National highways account for 11,386 pedestrian deaths, leaving 25,140 on all other roads combined.',
  'The remainder is the national pedestrian total minus the national-highway pedestrian row. It mixes state highways and other road classes because this source does not split the pedestrian remainder here.',
  'The road-class split prevents a highway-only reading of the pedestrian toll.',
  'The two bars partition the 2024 pedestrian deaths into national highways and every other road.',
  'No road category is paired with a count of walking journeys or distance.',
  'The second label means all non-national-highway roads combined.'),
]
HEADINGS=[
 "How many pedestrians are killed on India's roads?",'Is the pedestrian toll falling?',
 'How old were the pedestrians who died?','Are older road victims more often pedestrians?',
 'How does the pedestrian toll differ for women and men?','What vehicles were recorded in pedestrian deaths?',
 'Where are the largest pedestrian death totals?',
 'Among the highest-count states, how much of the road toll involves pedestrians?','Is this only a national-highway problem?',
 'What does the right to walk require?','How should you read these figures?'
]


def load(key):
 return json.loads((ROOT/f'data/series/{key}.json').read_text())


def main():
 body=BODY.read_text().strip();headings=re.findall(r'^## (.+)$',body,re.M)
 if headings!=HEADINGS or body.count('\n## ')!=len(headings)-1:raise ValueError('Article section order or heading structure changed')
 docs=[load(key) for key,*_ in CHARTS]
 pedestrian=36526
 if docs[1]['rows'][-1]['value']!=pedestrian or sum(x['value'] for x in docs[2]['rows'])!=pedestrian or sum(x['pedestrianDeaths'] for x in docs[4]['rows'])!=pedestrian or sum(x['value'] for x in docs[5]['rows'])!=pedestrian or sum(x['value'] for x in docs[8]['rows'])!=pedestrian:raise ValueError('Locked pedestrian partitions changed')
 if sum(x['value'] for x in docs[6]['rows'])!=27354:raise ValueError('Top ten sum changed')
 cards=[]
 for key,title,takeaway,detail,why,how,mistake,mobile in CHARTS:
  cards.append({'visualId':title,'title':title,'takeaway':takeaway,'detail':detail,
                'whyShowThis':why,'howToRead':how,'mistakeToAvoid':mistake,'mobileNote':mobile})
 summaries=[]
 for doc in docs:
  date='2023' if doc['indicatorId']=='road.pedestrian.deaths.2023_2024' else '2024'
  summaries.append({'indicatorId':doc['indicatorId'],'title':doc['title'],'sourceId':doc['sourceId'],
                    'earliest':date,'latest':'2024','unit':doc['unit']})
 locks=[
 {'label':'Police-recorded pedestrian deaths, 2024','value':36526,'displayValue':'36,526','date':'2024','unit':'people','sourceId':'morth-road-accidents-2024','indicatorId':'road.pedestrian.deaths.2023_2024'},
 {'label':'Pedestrian deaths, 2023','value':35221,'displayValue':'35,221','date':'2023','unit':'people','sourceId':'morth-road-accidents-2024','indicatorId':'road.pedestrian.deaths.2023_2024'},
 {'label':'Pedestrian share of road deaths aged 60 and over, 2024','value':41.7,'displayValue':'41.7%','date':'2024','unit':'percent','sourceId':'morth-road-accidents-2024','indicatorId':'road.pedestrian.share_of_age_deaths.2024'},
 {'label':'Pedestrian deaths on national highways, 2024','value':11386,'displayValue':'11,386','date':'2024','unit':'people','sourceId':'morth-road-accidents-2024','indicatorId':'road.pedestrian.national_highways.2024'}]
 evidence={'schemaVersion':1,'questionId':QID,'question':'How safe is it to walk on India’s roads?',
 'priority':'core','theme':'health','requiredIndicatorIds':[d['indicatorId'] for d in docs],
 'availableIndicatorIds':[d['indicatorId'] for d in docs],'themeIndicatorIds':[],
 'visualPlan':[],'plannedCharts':[],'selectedDataPoints':[],'lockedNumbers':locks,
 'sourceSummaries':summaries,'selectionRules':[],'caveats':[],'forbiddenClaims':[]}
 out={'schemaVersion':1,'questionId':QID,'status':'ready','dataThrough':'MoRTH 2024; Supreme Court judgment 2026; WHO pedestrian-safety guidance 2023',
 'short':{'headline':'About 100 pedestrians a day were recorded as killed in 2024',
          'dek':'The Ministry of Road Transport and Highways’ Road Accidents in India 2024 counts 36,526 pedestrians killed in 2024. The figures come from police returns. The Supreme Court recognised the right to walk on demarcated footpaths in 2026.',
          'body':'The Ministry of Road Transport and Highways’ Road Accidents in India 2024 draws on state and union-territory police returns. Pedestrians were one in five of the 177,175 people recorded as killed on India’s roads in 2024. The pedestrian toll, 36,526, rose 3.7 per cent from 2023. In June 2026, the Supreme Court said the right to walk includes demarcated footpaths and places duties on local authorities. The 2024 tables cannot measure the danger of a walking journey because they do not count how much people walk.'},
 'macha':{'heading':'Okay, macha, how risky is a walk?',
          'body':'The Ministry of Road Transport and Highways’ Road Accidents in India 2024, built from police returns, records 36,526 pedestrians killed. That is about 100 people a day. Its tables show their ages, the states with the largest death counts and the vehicles recorded in their collisions. They cannot tell you the chance of dying on a walk because they never count how much walking people did.',
          'soWhat':'Use the 36,526 deaths recorded in Road Accidents in India 2024 to identify where closer investigation is needed. Measuring the risk of a walk also needs data on walking journeys or distance and better linked crash records.'},
 'article':{'title':'How safe is it to walk on India’s roads?',
            'standfirst':'In Road Accidents in India 2024, the Ministry of Road Transport and Highways records about 100 pedestrian deaths a day from police returns. The Supreme Court recognised walking on demarcated footpaths as a fundamental right in 2026. The 2024 figures show the toll, but cannot measure the risk of a walk or the availability of footpaths.',
            'bodyMarkdown':body},
 'editorialPlan':{'audience':'Indian readers who walk and want a careful answer about pedestrian safety',
                  'heroDescription':'Source-checked pedestrian deaths in the 2024 police returns.',
                  'selectedDataPoints':[],'pullQuotes':[],
                  'glossaryBlocks':[
                   {'term':'Pedestrian','plainMeaning':'A person recorded as walking when involved in the road crash. It describes the victim’s road use, not who caused the collision.','whyItMattersHere':'The same death can also appear in a table by impacting vehicle.','keyTerm':True},
                   {'term':'Walking exposure','plainMeaning':'How many walking journeys people made, or how far they walked.','whyItMattersHere':'Without this, a death count cannot become a risk per trip.','keyTerm':True},
                   {'term':'Impacting vehicle','plainMeaning':'The vehicle police recorded as the collision counterpart to a victim.','whyItMattersHere':'This administrative label is not a court finding of fault.'}]},
 'chartExplainers':cards,'sectionVisualMap':[{'heading':h,'visualId':c[1]} for h,c in zip(HEADINGS,CHARTS)],
 'sourceNotes':[
  {'label':'Ministry of Road Transport and Highways, Road Accidents in India 2024: Tables 2.11, 4.2–4.5 and 5.6; Annexures 29(a) and 33.','url':MORTH},
  {'label':'Supreme Court of India, Maniyar Iliyaz v. P. Ayyappan (19 June 2026), especially conclusions at pp. 12–13.','url':COURT},
  {'label':'WHO, Pedestrian safety manual, second edition (2023): evidence on safer pedestrian facilities and speed management.','url':WHO}],
 'caveats':[
  'The Ministry of Road Transport and Highways compiles its death counts from police returns; a later death may be missed if it is not linked back to the crash record.',
  'Road Accidents in India 2024 and the World Health Organization manual do not supply a national 2024 count of walking journeys or kilometres walked.',
  'The age and sex composition percentages divide pedestrian deaths by all road deaths within the same recorded group; they are not walking-risk rates.',
  'The report’s rural–urban, junction, weather and time-of-day tables cannot be read as pedestrian-specific deaths.',
  'Raw state totals and road-category counts are not adjusted for walking or vehicle exposure.',
  'Impacting-vehicle categories describe police coding, not legal responsibility.',
  'The 2024 police data predate the June 2026 Supreme Court ruling and cannot measure compliance with it or the availability of footpaths.',
  'The report changed its victim road-user classification format in 2019; this article shows only its direct 2023–24 comparison.'],
 'lockedNumbersUsed':['36,526 pedestrian deaths in 2024','35,221 pedestrian deaths in 2023','41.7% of recorded road deaths aged 60 and over were pedestrians','11,386 pedestrian deaths on national highways'],
 'qualityFlags':[],'generatedAt':datetime.now(timezone.utc).isoformat(),
 'model':'editorially authored from locked source packet','generationPasses':[{'pass':'authored','source':BODY.relative_to(ROOT).as_posix()}],
 'evidence':evidence}
 OUT.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
 print(f'Wrote {len(cards)} chart explainers, {len(headings)} sections and {len(body.split())} body words')

if __name__=='__main__':main()
