#!/usr/bin/env python3
"""Two 'rupee in context' tables:
  1. decade_fall: how much the rupee LOST against the dollar each decade
     (from the long INR/USD par+market series), as % of value.
  2. peer_fall: how much a broad basket of emerging- and developed-market
     currencies lost against the dollar over 2000->2025. The point: EVERY
     currency fell vs the dollar; the rupee is mid-pack among EMs, far from the
     worst, so 'the rupee is weak' is really 'the dollar is strong'.
Currencies via FRED bilateral USD spot rates (annual averages).
"""
import datetime as dt
import json
import os
import urllib.request
from pathlib import Path

SER = Path("data/series")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
KEY = None
for line in (Path(".env").read_text().splitlines()):
    if line.startswith("FRED_API_KEY="):
        KEY = line.split("=", 1)[1].strip()


def fred_annual(series_id):
    url = (f"https://api.stlouisfed.org/fred/series/observations?series_id={series_id}"
           f"&api_key={KEY}&file_type=json&frequency=a&aggregation_method=avg"
           f"&observation_start=1999-01-01")
    with urllib.request.urlopen(url, timeout=60) as r:
        data = json.load(r)
    out = {}
    for o in data.get("observations", []):
        if o["value"] not in (".", None):
            out[o["date"][:4]] = float(o["value"])
    return out


def write_table(indicator, title, rows, unit, source_url, metadata):
    art = {"schemaVersion": 1, "artifactType": "table", "indicatorId": indicator,
           "title": title, "sourceId": "rupee-derived", "sourceIndicatorId": indicator,
           "sourceUrl": source_url, "unit": unit,
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": list(rows[0].keys()), "fetchedAt": FETCHED, "rows": rows, "metadata": metadata}
    (SER / f"rupee-derived.{indicator}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(rows)} rows")


# ---------- 1. Decade fall of the rupee vs the dollar ----------
longn = {o["date"]: o["value"] for o in json.load(open(SER / "rupee-chronology.IN.fx.inr_usd_long.annual.json"))["observations"]}
decades = [(1950, 1960), (1960, 1970), (1970, 1980), (1980, 1990), (1990, 2000), (2000, 2010), (2010, 2020), (2020, 2025)]
rows = []
for a, b in decades:
    ra, rb = longn.get(str(a)), longn.get(str(b))
    if ra and rb:
        loss = round((1 - ra / rb) * 100, 1)  # % of value the rupee lost vs USD
        rows.append({"label": f"{a}s", "value": loss})
write_table("derived.IN.fx.decade_fall", "How much the rupee lost against the dollar, by decade", rows,
            "% of value lost vs USD", "https://fred.stlouisfed.org/series/EXINUS",
            {"derived": "(1 - rate_start/rate_end)*100 on the long INR/USD series; 2020s is 2020-2025 (partial)", "note": "1960s = the 1966 devaluation; pre-1970 are par-value pegs"})

# ---------- 2. Peer currencies' fall vs the dollar, 2000->2025 ----------
# (fred_id, label, group, orientation)  orientation: 'perUSD' (foreign per USD) or 'USDper' (USD per foreign)
PEERS = [
    ("DEXINUS", "India (rupee)", "Emerging", "perUSD"),
    ("DEXBZUS", "Brazil (real)", "Emerging", "perUSD"),
    ("DEXSFUS", "South Africa (rand)", "Emerging", "perUSD"),
    ("DEXMXUS", "Mexico (peso)", "Emerging", "perUSD"),
    ("DEXKOUS", "South Korea (won)", "Emerging", "perUSD"),
    ("DEXCHUS", "China (yuan)", "Emerging", "perUSD"),
    ("DEXTHUS", "Thailand (baht)", "Emerging", "perUSD"),
    ("DEXMAUS", "Malaysia (ringgit)", "Emerging", "perUSD"),
    ("DEXJPUS", "Japan (yen)", "Developed", "perUSD"),
    ("DEXCAUS", "Canada (dollar)", "Developed", "perUSD"),
    ("DEXSZUS", "Switzerland (franc)", "Developed", "perUSD"),
    ("DEXUSEU", "Euro area (euro)", "Developed", "USDper"),
    ("DEXUSUK", "UK (pound)", "Developed", "USDper"),
    ("DEXUSAL", "Australia (dollar)", "Developed", "USDper"),
]
A, B = "2000", "2025"
prows = []
for fid, label, group, ori in PEERS:
    s = fred_annual(fid)
    ra, rb = s.get(A), s.get(B)
    if not ra or not rb:
        print(f"  skip {fid} (missing {A} or {B})")
        continue
    if ori == "perUSD":          # currency value = 1/rate ; loss = 1 - start/end
        loss = (1 - ra / rb) * 100
    else:                         # USD per foreign = value ; loss = 1 - end/start
        loss = (1 - rb / ra) * 100
    prows.append({"label": label, "value": round(loss, 1), "group": group})
prows.sort(key=lambda r: r["value"], reverse=True)
write_table("derived.IN.fx.peer_fall_vs_usd", "How far each currency fell against the dollar, 2000-2025", prows,
            "% of value lost vs USD", "https://fred.stlouisfed.org/categories/94",
            {"derived": "annual-avg FRED bilateral USD rates; loss = 1 - (value_2025/value_2000); positive = weakened vs USD"})

print("done")
