#!/usr/bin/env python3
"""Ingest RBI official gold-reserves series from the MoSPI eSankhyiki open API.

Swapped (Jun 2026) from the local RBI DBIE scraper to the official MoSPI
eSankhyiki API (api.mospi.gov.in, RBI dataset) per founder request - a public,
reproducible, authoritative source. Endpoint: /api/rbi/getRbiRecords
  sub_indicator_code=48  Foreign Exchange Reserve Annual (fiscal years)
  sub_indicator_code=47  Foreign Exchange Reserve Monthly (for the latest point)
Each carries reserve types Gold / Foreign Currency Assets / SDRs / RTP / Total,
in Rs Crore and US$ Million.

Emits: gold.reserves.value_usd, gold.reserves.value_inr, gold.reserves.forex_share.
(The API serves an incomplete TLS chain, so verification is disabled.)
"""
import json, ssl, urllib.request, datetime as dt
from pathlib import Path

OUT = Path("data/series"); OUT.mkdir(parents=True, exist_ok=True)
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
URL = "https://esankhyiki.mospi.gov.in/  (RBI Statistics, via api.mospi.gov.in/api/rbi/getRbiRecords)"
CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE
MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

def fetch_all(code):
    out, page = [], 1
    while True:
        u = f"https://api.mospi.gov.in/api/rbi/getRbiRecords?sub_indicator_code={code}&limit=500&page={page}"
        d = json.load(urllib.request.urlopen(u, timeout=90, context=CTX))
        out += d.get("data", [])
        if page >= d.get("meta_data", {}).get("totalPages", 1):
            break
        page += 1
    return out

def num(v):
    try: return float(str(v).replace(",", ""))
    except Exception: return None

def fy_end(fy):  # '2024-25' -> '2025-03-31'
    try: return f"{int(str(fy).split('-')[0]) + 1}-03-31"
    except Exception: return None

# ---- Annual (code 48) ----
ann = fetch_all(48)
def annual_map(rtype, cur):
    out = {}
    for r in ann:
        if r.get("foreign_exchange_reserve_type") == rtype and cur in (r.get("foreign_exchange_reserve_currency") or ""):
            d = fy_end(r.get("year")); v = num(r.get("value"))
            if d and v is not None: out[d] = v
    return out
gold_usd = annual_map("Gold", "US")          # US$ million
gold_inr = annual_map("Gold", "Crore")       # Rs crore
tot_inr  = annual_map("Total", "Crore")

# ---- Monthly (code 47) latest point, to extend currency past the annual ----
mon = fetch_all(47)
def month_date(r):
    try: return dt.date(int(r["year"]), MONTHS.index(r["month"]) + 1, 1).isoformat()
    except Exception: return None
def monthly_latest(rtype, cur):
    pts = {}
    for r in mon:
        if r.get("foreign_exchange_reserve_type") == rtype and cur in (r.get("foreign_exchange_reserve_currency") or ""):
            d = month_date(r); v = num(r.get("value"))
            if d and v is not None: pts[d] = v
    return pts
m_gold_usd = monthly_latest("Gold", "US")
m_gold_inr = monthly_latest("Gold", "Crore")
m_tot_inr  = monthly_latest("Total", "Crore")
latest_m = max(m_gold_usd) if m_gold_usd else None

def write(name, indicator, title, unit, obs, metadata):
    obs = sorted([o for o in obs if o["value"] is not None], key=lambda o: o["date"])
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator, "title": title,
           "sourceId": "mospi-esankhyiki", "sourceIndicatorId": indicator, "sourceUrl": URL,
           "unit": unit, "frequency": "annual", "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata}
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {name}: {len(obs)} obs (..{obs[-1]['date']} = {obs[-1]['value']})")

# value_usd in US$ billion (annual + latest monthly point)
usd_obs = [{"date": d, "value": round(v / 1000, 2)} for d, v in gold_usd.items()]
if latest_m and latest_m > max(gold_usd):
    usd_obs.append({"date": latest_m, "value": round(m_gold_usd[latest_m] / 1000, 2)})
write("mospi-esankhyiki.IN.gold.reserves_value_usd", "gold.reserves.value_usd",
      "RBI official gold reserves, US$ billion", "current US$ billion", usd_obs,
      {"method": "MoSPI eSankhyiki RBI dataset, Foreign Exchange Reserve (Gold, US$), fiscal year-end + latest monthly. Official MoSPI/RBI source.",
       "note": "Value of the RBI's gold, not tonnes; rises with the gold price."})

# value_inr in Rs lakh crore
write("mospi-esankhyiki.IN.gold.reserves_value_inr", "gold.reserves.value_inr",
      "RBI official gold reserves, INR lakh crore", "INR lakh crore",
      [{"date": d, "value": round(v / 100000, 2)} for d, v in gold_inr.items()],  # crore -> lakh crore
      {"method": "MoSPI eSankhyiki RBI dataset, Foreign Exchange Reserve (Gold, Rs Crore), fiscal year-end.", "note": "1 lakh crore = 100,000 crore."})

# forex_share = gold / total (INR), annual + latest monthly
share_obs = [{"date": d, "value": round(gold_inr[d] / tot_inr[d] * 100, 2)} for d in sorted(set(gold_inr) & set(tot_inr)) if tot_inr.get(d)]
mc = sorted(set(m_gold_inr) & set(m_tot_inr))
if mc:
    lk = mc[-1]
    if m_tot_inr.get(lk):
        share_obs.append({"date": lk, "value": round(m_gold_inr[lk] / m_tot_inr[lk] * 100, 2)})
write("mospi-esankhyiki.IN.gold.reserves_forex_share", "gold.reserves.forex_share",
      "Gold as a share of India's forex reserves", "% of total reserves", share_obs,
      {"method": "MoSPI eSankhyiki RBI dataset: gold / total reserves (Rs), fiscal year-end + latest monthly.",
       "note": "Rises with both RBI gold purchases and the gold price."})

# remove the old scraper-sourced files (swap)
for old in ["rbi-dbie.IN.gold.reserves_value_usd", "rbi-dbie.IN.gold.reserves_value_inr", "rbi-dbie.IN.gold.reserves_forex_share"]:
    p = OUT / f"{old}.json"
    if p.exists(): p.unlink(); print(f"  removed old scraper file {old}.json")

print(f"\nLATEST: gold US$ {usd_obs[-1]['value']}bn ({usd_obs[-1]['date']}); share {share_obs[-1]['value']}% ({share_obs[-1]['date']})")
print("eSankhyiki reserves ingest done.")
