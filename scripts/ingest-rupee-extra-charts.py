#!/usr/bin/env python3
"""Extra series to deepen the rupee article:
  1. Rupee vs the other major currencies (EUR/JPY/GBP), from the RBI reference-rate
     month high/low file -> a 'value of the rupee' index per currency, which shows
     the rupee fell hardest vs the DOLLAR and far less (or rose) vs others: much of
     the 'weakness' is dollar STRENGTH. (monthly mids, 1998-08 -> 2024-01)
  2. The cumulative inflation gap: India vs US CPI rebased to 1991=100 -> the engine
     that FORCES the nominal rate down.
  3. The real deposit rate (1-3yr term deposit minus CPI inflation), annual -> the
     two-phase repression-then-positive story made explicit.
"""
import datetime as dt
import json
from collections import defaultdict
from pathlib import Path

import pandas as pd
import warnings
warnings.filterwarnings("ignore")

SER = Path("data/series")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
FX = Path.home() / "Downloads" / "Forex Rates - Month-High _ Month-Low.xlsx"
RBI_URL = "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"
BIS_CPI = "https://data.bis.org/topics/LONG_CPI"


def write(indicator, title, unit, obs, freq, source_url, metadata, sid="rupee-derived"):
    obs = [o for o in obs if o.get("value") is not None]
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
           "title": title, "sourceId": sid, "sourceIndicatorId": indicator,
           "sourceUrl": source_url, "unit": unit, "frequency": freq,
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata}
    fname = f"{sid}.{indicator}.json" if sid == "rupee-derived" else f"{sid}.{indicator}.json"
    (SER / fname).write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']}->{obs[-1]['date']})")


def obsmap(name):
    return {o["date"]: o["value"] for o in json.load(open(SER / name))["observations"] if o["value"] is not None}


def annavg(name):
    a = defaultdict(list)
    for o in json.load(open(SER / name))["observations"]:
        if o["value"] is not None:
            a[o["date"][:4]].append(o["value"])
    return {y: sum(v) / len(v) for y, v in a.items()}


# ---- 1. Rupee vs major currencies (value-of-rupee index, base = first common month) ----
df = pd.read_excel(FX, sheet_name="Based on Reference Rate", header=None)
CUR = {"usd": (8, 9), "eur": (2, 3), "gbp": (6, 7), "jpy": (4, 5)}  # JPY is per 100 yen in RBI ref
mids = {c: {} for c in CUR}
for _, r in df.iloc[7:].iterrows():
    d = pd.to_datetime(r[1], errors="coerce")
    if pd.isna(d):
        continue
    m = d.strftime("%Y-%m")
    for c, (hi, lo) in CUR.items():
        try:
            mids[c][m] = (float(r[hi]) + float(r[lo])) / 2
        except (ValueError, TypeError):
            pass
common = sorted(set.intersection(*[set(mids[c]) for c in CUR]))
base = common[0]
LABEL = {"usd": "US dollar", "eur": "euro", "gbp": "pound", "jpy": "yen"}
for c in CUR:
    b = mids[c][base]
    # value of the rupee vs this currency = 100 * base_rate / rate (falls as rupee weakens)
    obs = [{"date": m, "value": round(100 * b / mids[c][m], 1)} for m in common]
    write(f"derived.IN.fx.rupee_value_vs_{c}", f"Rupee's value against the {LABEL[c]} (base = 100)",
          f"index ({base}=100)", obs, "monthly", RBI_URL,
          {"derived": f"100 x base/(INR per {c.upper()}); from RBI reference-rate month mids; down = rupee weaker"})

# ---- 2. Cumulative inflation gap: India vs US CPI rebased to 1991=100 (annual) ----
cin = annavg("bis.IN.prices.cpi.monthly.json")
cus = annavg("bis.US.prices.cpi.monthly.json")
yrs = [y for y in sorted(set(cin) & set(cus)) if y >= "1991"]
b = "1991"
write("derived.IN.prices.cpi_cum_in", "India cost of living since 1991 (1991 = 100)", "index 1991=100",
      [{"date": y, "value": round(100 * cin[y] / cin[b], 1)} for y in yrs], "annual", BIS_CPI,
      {"derived": "BIS India CPI annual avg rebased to 1991=100"})
write("derived.IN.prices.cpi_cum_us", "US cost of living since 1991 (1991 = 100)", "index 1991=100",
      [{"date": y, "value": round(100 * cus[y] / cus[b], 1)} for y in yrs], "annual", BIS_CPI,
      {"derived": "BIS US CPI annual avg rebased to 1991=100; gap vs India = the rupee's required fall"})

# ---- 3. Real deposit rate (annual): term deposit minus CPI inflation ----
td = obsmap("rbi-interest-rates.IN.rates.term_deposit_1_3yr.annual.json")
infl = {}
ys = sorted(cin)
for i, y in enumerate(ys):
    nxt = str(int(y) + 1)
    if nxt in cin:
        infl[y] = (cin[nxt] / cin[y] - 1) * 100
real = [{"date": y, "value": round(td[y] - infl[y], 2)} for y in sorted(td) if y in infl]
write("derived.IN.rates.real_deposit_rate", "Real return on a bank deposit (rate minus inflation)",
      "percent per annum", real, "annual", RBI_URL,
      {"derived": "1-3yr term deposit rate minus same-year CPI inflation; negative in the repression era, positive after liberalisation"})

print("done")
