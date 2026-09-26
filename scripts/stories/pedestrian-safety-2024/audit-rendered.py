#!/usr/bin/env python3
"""Check the built pedestrian page's chart binding, units, claims and source links."""
import json
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
 checks={
  'ten_sections_eight_charts_in_order':relevant==expected,
  'eight_chart_notes':len(page.select('.chart-note'))==8,
  'morth_original_pdf_linked':any('road-accidents-in-india-2024.pdf' in x for x in links),
  'supreme_court_original_pdf_linked':any('api.sci.gov.in/supremecourt/2024/42514/' in x and x.endswith('.pdf') for x in links),
  'who_manual_linked':any('who.int/publications/b/65858' in x for x in links),
  'fundamental_right_and_duty_visible':'fundamental right' in text and 'panchayats' in text and 'demarcated footpaths' in text,
  'judgment_postdates_data_visible':'2024 figures describe deaths recorded before the 2026 ruling' in text,
  'pedestrian_toll_visible':'36,526' in text,
  'age_composition_visible':'41.7' in text,
  'walking_risk_limit_visible':'chance of dying on your next walk' in text,
  'state_top_count_visible':'Tamil Nadu 4,712' in text,
  'other_roads_derivation_visible':'25,140' in text,
 }
 result={'page':PAGE.relative_to(ROOT).as_posix(),'checks':checks,
         'sectionCount':len(sections),'chartCount':len(charts),
         'failures':[k for k,v in checks.items() if not v]}
 OUT.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result,indent=2))
 if result['failures']:raise SystemExit(1)

if __name__=='__main__':main()
