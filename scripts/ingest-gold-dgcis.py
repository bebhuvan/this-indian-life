#!/usr/bin/env python3
"""Ingest DGCI&S CALENDAR-year gold series as an AUTHORITATIVE corroboration layer.

The article's continuous time-series spine is UN Comtrade (calendar year). This
adds the official Indian-government source — DGCI&S Principal Commodity data,
scraped locally to ~/Documents/RBI (ftddp, 2001 .. 2025 complete; the in-progress
2026 is recorded in metadata only, not as a chart point).

IMPORTANT (verified 2026-06-07): this ftddp scrape is CALENDAR year (Jan-Dec N),
NOT fiscal. Proven by rebuilding true calendar vs fiscal years from Comtrade
monthly data: ftddp[N] matches Comtrade calendar year N to ~0.1% in volatile
years (2019/2020/2022/2025), and is 15-40% off the Apr-Mar fiscal year. So both
sources cover the same window; they agree to <1% on gold imports across 2010-2025.

DGCI&S is Comtrade's UPSTREAM, so this is not a fully independent check — it
confirms the UN figures faithfully reproduce India's own customs portal (vs
WGC/Metals Focus, which IS independent). Dated by calendar year-end (31 Dec).

Writes:
  gold.dgcis.imports_value_usd      (US$ billion, FY)
  gold.dgcis.imports_tonnes         (tonnes, FY)
  gold.dgcis.imports_value_inr      (INR crore, FY)
  gold.dgcis.jewellery_exports_value_usd (US$ billion, FY, value only)
"""
import json, datetime as dt
from pathlib import Path
import pandas as pd

REPO = Path(__file__).resolve().parent.parent
RBI = Path.home() / "Documents/RBI"
OUT = REPO / "data/series"
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
SRC = "https://ftddp.dgciskol.gov.in/"
LAST_COMPLETE_CY = 2025   # calendar 2025 complete; 2026 is partial

ft = pd.read_csv(RBI / "data/dgcis/ftddp/raw/ftddp_2001_2026_combined.csv.gz")

def rows(commodity, trade, currency):
    g = ft[(ft.commodity == commodity) & (ft.trade == trade) & (ft.currency == currency)]
    if trade == "import":
        g = g[g.quantity.fillna(0) > 0]  # rows carrying the KGS quantity
    return {int(r.year): (float(r.value), float(r.quantity)) for _, r in g.sort_values("year").iterrows()}

imp_usd = rows("GOLD", "import", "usd")
imp_inr = rows("GOLD", "import", "inr")
jwl_usd = rows("GOLD AND OTH PRECS METL JWLERY", "export", "usd")

def cy_date(y): return f"{y}-12-31"

def write(name, indicator, title, unit, obs, partial_note):
    art = {
        "schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
        "title": title, "sourceId": "dgcis", "sourceIndicatorId": indicator,
        "sourceUrl": SRC, "unit": unit, "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [], "fetchedAt": FETCHED,
        "observations": obs,
        "metadata": {
            "method": "DGCI&S Principal Commodity (ftddp portal), India, calendar year (Jan-Dec), dated at year-end.",
            "note": ("Official Indian customs source (ftddp.dgciskol.gov.in); UN Comtrade's upstream. "
                     "Calendar-year basis, verified against Comtrade monthly: agrees with the Comtrade "
                     "calendar-year spine to under 1% on gold imports. " + partial_note),
        },
    }
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {name}.json: {len(obs)} obs, last {obs[-1]}")

# imports — value USD bn + tonnes
obs_v, obs_t, obs_inr = [], [], []
for y in sorted(imp_usd):
    if y > LAST_COMPLETE_CY: continue
    obs_v.append({"date": cy_date(y), "value": round(imp_usd[y][0] / 1e9, 3)})
    obs_t.append({"date": cy_date(y), "value": round(imp_usd[y][1] / 1e3, 1)})
for y in sorted(imp_inr):
    if y > LAST_COMPLETE_CY: continue
    obs_inr.append({"date": cy_date(y), "value": round(imp_inr[y][0] / 1e7)})  # INR -> crore

obs_j = [{"date": cy_date(y), "value": round(jwl_usd[y][0] / 1e9, 3)}
         for y in sorted(jwl_usd) if y <= LAST_COMPLETE_CY]

partial26 = imp_usd.get(2026)
pnote = ""
if partial26:
    pnote = (f"Calendar 2026 in progress at scrape time: ${partial26[0]/1e9:.1f}bn / "
             f"{partial26[1]/1e3:.0f}t (PARTIAL, excluded from the series).")

write("dgcis.IN.gold.imports_value_usd", "gold.dgcis.imports_value_usd",
      "India gold imports, US$ billion (DGCI&S, calendar year)", "current US$ billion", obs_v, pnote)
write("dgcis.IN.gold.imports_tonnes", "gold.dgcis.imports_tonnes",
      "India gold imports, tonnes (DGCI&S, calendar year)", "tonnes", obs_t, pnote)
write("dgcis.IN.gold.imports_value_inr", "gold.dgcis.imports_value_inr",
      "India gold import bill, INR crore (DGCI&S, calendar year)", "INR crore", obs_inr, pnote)
write("dgcis.IN.gold.jewellery_exports_value_usd", "gold.dgcis.jewellery_exports_value_usd",
      "India gold jewellery exports, US$ billion (DGCI&S, calendar year)", "current US$ billion", obs_j,
      "Value only; DGCI&S quantity for jewellery is unreliable.")

print("DGCI&S gold layer ingested.")
