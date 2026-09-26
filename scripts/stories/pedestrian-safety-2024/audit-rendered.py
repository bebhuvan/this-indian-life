#!/usr/bin/env python3
"""Check the built pedestrian page's chart binding, units, claims and source links."""
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[3]
PAGE=ROOT/'dist/articles/how-safe-is-it-to-walk-in-india/index.html'
OUT=ROOT/'data/audits/pedestrian-safety-2024/rendered-audit.json'
EXPLANATION=ROOT/'data/explanations/en/q.health.pedestrian_safety_2024.json'


def main():
 e=json.loads(EXPLANATION.read_text());page=BeautifulSoup(PAGE.read_text(),'html.parser')
 sections=[x[3:] for x in e['article']['bodyMarkdown'].splitlines() if x.startswith('## ')]
 charts=[x['title'] for x in e['chartExplainers']]
 headings=[x.get_text(' ',strip=True) for x in page.find_all(['h2','h3'])]
 relevant=[h for h in headings if h in sections or h in charts]
 expected=[v for pair in zip(sections[:len(charts)],charts) for v in pair]+sections[len(charts):]
 text=page.get_text(' ',strip=True)
 links=[x.get('href','') for x in page.select('.evidence-grid a')]
 openings=[e['short']['dek'],e['short']['body'],e['macha']['body'],e['article']['standfirst']]
 first_body_paragraph=e['article']['bodyMarkdown'].split('\n\n',2)[1]
 source_name='Ministry of Road Transport and Highways'
 report_title='Road Accidents in India 2024'
 checks={
  'ten_sections_eight_charts_in_order':relevant==expected,
  'eight_chart_notes':len(page.select('.chart-note'))==8,
  'morth_original_pdf_linked':any('road-accidents-in-india-2024.pdf' in x for x in links),
  'supreme_court_original_pdf_linked':any('api.sci.gov.in/supremecourt/2024/42514/' in x and x.endswith('.pdf') for x in links),
  'who_manual_linked':any('who.int/publications/b/65858' in x for x in links),
  'fundamental_right_and_duty_visible':'fundamental right' in text and 'panchayats' in text and 'demarcated footpaths' in text,
  'judgment_postdates_data_visible':'2024 figures describe deaths recorded' in text and 'before the 2026 ruling' in text,
  'each_opening_names_ministry_and_report':all(source_name in opening and report_title in opening for opening in openings),
  'no_literal_markdown_in_openings':all('*' not in opening for opening in openings),
  'article_first_paragraph_names_ministry_and_report':source_name in first_body_paragraph and report_title in first_body_paragraph,
  'first_body_acronym_expanded':bool(re.search(r'Ministry of Road Transport and Highways \(MoRTH\)', first_body_paragraph)),
  'pedestrian_toll_visible':'36,526' in text,
  'age_composition_visible':'41.7' in text,
  'sex_composition_visible':'29.6' in text and '19.1' in text and '25,225' in text and '151,950' in text,
  'age_sex_intersection_visible':'56.7' in text and '37.9' in text and 'every published age band' in text,
  'fatal_crash_scope_visible':'account of fatal crashes' in text and 'cannot tell us where or when pedestrian deaths occurred' in text,
  'walking_risk_limit_visible':'chance of dying on a walk' in text,
  'state_top_count_visible':'Tamil Nadu reports 4,712' in text,
  'other_roads_derivation_visible':'25,140' in text,
 }
 result={'page':PAGE.relative_to(ROOT).as_posix(),'checks':checks,
         'sectionCount':len(sections),'chartCount':len(charts),
         'failures':[k for k,v in checks.items() if not v]}
 OUT.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result,indent=2))
 if result['failures']:raise SystemExit(1)

if __name__=='__main__':main()
