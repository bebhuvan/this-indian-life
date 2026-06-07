#!/usr/bin/env python3
"""Ingest WGC India gold demand & supply from the GDT data tables workbook.

Source: data/manual/wgc-gold-demand.xlsx (World Gold Council, Gold Demand
Trends Data Tables Q1'2026). Personal-research use only; WGC data is the
property of its owners (no redistribution).

Emits Indica series artifacts (annual tonnes / grams):
  - gold.wgc.india_jewellery        : India jewellery demand (t)
  - gold.wgc.india_bar_coin         : India bar & coin demand (t)
  - gold.wgc.india_per_capita       : India consumer demand per capita (g)
  - gold.wgc.india_gross_imports    : India gross bullion imports (t)  [India Supply]
  - gold.wgc.india_recycling        : India recycled gold (t)          [India Supply]
"""
import json, re, datetime as dt
from pathlib import Path
import openpyxl

XLSX = "data/manual/wgc-gold-demand.xlsx"
OUT = Path("data/series"); OUT.mkdir(parents=True, exist_ok=True)
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
URL = "https://www.gold.org/goldhub/data/gold-demand-by-country"
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)

def rows_of(sheet):
    return [list(r) for r in wb[sheet].iter_rows(values_only=True)]

def year_header(rows):
    for ri, r in enumerate(rows):
        idx = [i for i, c in enumerate(r) if isinstance(c, (int, float)) and 2009 < c < 2027]
        if len(idx) >= 8:
            return ri, idx, [int(r[i]) for i in idx]
    return None, None, None

def label_row(rows, yi, yrs, want):
    want = want.strip().lower()
    for r in rows:
        c0 = next((str(c).strip() for c in r if c not in (None, "")), "")
        if c0.lower() == want:
            return [(y, r[i]) for y, i in zip(yrs, yi) if i < len(r)]
    return None

def to_obs(pairs):
    out = []
    for y, v in (pairs or []):
        if isinstance(v, (int, float)):
            out.append({"date": f"{int(y)}-12-31", "value": round(float(v), 3)})
    return sorted(out, key=lambda o: o["date"])

def write(name, indicator, title, unit, observations, metadata):
    if not observations:
        print(f"  SKIP {indicator}: no obs"); return
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
           "title": title, "sourceId": "wgc", "sourceIndicatorId": indicator,
           "sourceUrl": URL, "unit": unit, "frequency": "annual",
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED, "observations": observations,
           "metadata": metadata}
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {name}.json: {len(observations)} obs ({observations[0]['date']}..{observations[-1]['date']})")

NOTE = "WGC Gold Demand Trends data; personal-research use only."

# India demand sheets (India row)
for sheet, name, ind, title, unit in [
    ("Jewellery", "wgc.IN.gold.india_jewellery", "gold.wgc.india_jewellery",
     "India jewellery demand", "tonnes"),
    ("Bar and Coin", "wgc.IN.gold.india_bar_coin", "gold.wgc.india_bar_coin",
     "India bar & coin demand", "tonnes"),
    ("Consumer per Capita", "wgc.IN.gold.india_per_capita", "gold.wgc.india_per_capita",
     "India gold demand per capita", "grams per person"),
]:
    rows = rows_of(sheet); ri, yi, yrs = year_header(rows)
    obs = to_obs(label_row(rows, yi, yrs, "India"))
    write(name, ind, title, unit, obs,
          {"method": f"WGC GDT Data Tables, '{sheet}' sheet, India row, annual.", "note": NOTE})

# India Supply sheet: pull Gross Bullion Imports + Recycled (Scrap) line items
rows = rows_of("India Supply"); ri, yi, yrs = year_header(rows)
def find_supply(*patterns):
    for r in rows:
        c0 = next((str(c).strip() for c in r if c not in (None, "")), "")
        if c0 and any(re.search(p, c0, re.I) for p in patterns):
            return to_obs([(y, r[i]) for y, i in zip(yrs, yi) if i < len(r)])
    return []
write("wgc.IN.gold.india_gross_imports", "gold.wgc.india_gross_imports",
      "India gross bullion imports (WGC estimate)", "tonnes",
      find_supply(r"gross bullion import", r"gross import"),
      {"method": "WGC GDT Data Tables, 'India Supply' sheet, Gross Bullion Imports, annual.",
       "note": NOTE + " Independent of UN Comtrade; used to corroborate import flows."})
write("wgc.IN.gold.india_recycling", "gold.wgc.india_recycling",
      "India recycled gold (WGC estimate)", "tonnes",
      find_supply(r"recycl", r"scrap"),
      {"method": "WGC GDT Data Tables, 'India Supply' sheet, recycled/scrap gold, annual.", "note": NOTE})

print("WGC India gold ingest done.")
