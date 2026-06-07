#!/usr/bin/env python3
"""Ingest gold-flagship base series from the local Data bank warehouse parquet.

Sources (already fetched & parsed in /home/bhuvanesh.r/Documents/Data/Data bank):
  - goldhub_gold_price        : WGC/LBMA gold price, daily, USD & INR per oz, 1978->2026
  - nifty_index_total_returns : NSE indices TRI, incl. "Nifty 500", 1995->2026
  - fred_series (DEXINUS)     : USD/INR daily, 1973->2026 (independent of Goldhub)

Emits Indica series artifacts to data/series/*.json (schema matches
scripts/core/artifacts.mjs::createSeriesArtifact). Personal-research use only;
WGC/LBMA price data is the property of its owners (no redistribution).
"""
import json, glob, datetime as dt
from pathlib import Path
import pandas as pd

DB = Path("/home/bhuvanesh.r/Documents/Data/Data bank/data/warehouse/source_native")
OUT = Path("data/series")
OUT.mkdir(parents=True, exist_ok=True)
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
OZ_TO_10G = 3.11035  # 1 troy oz = 31.1035 g, so price per 10g = price/oz / 3.11035

def latest(dataset):
    files = sorted(glob.glob(str(DB / dataset / "*.parquet")))
    if not files:
        raise FileNotFoundError(f"no parquet for {dataset}")
    return pd.read_parquet(files[-1])

def write_series(name, indicator, title, unit, observations, *, frequency="annual",
                 source_id="databank", source_indicator=None, source_url="", metadata=None):
    obs = [o for o in observations if o["value"] is not None]
    if not obs:
        print(f"  SKIP {indicator}: no observations"); return
    art = {
        "schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
        "title": title, "sourceId": source_id,
        "sourceIndicatorId": str(source_indicator or indicator),
        "sourceUrl": source_url, "unit": unit, "frequency": frequency,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [], "fetchedAt": FETCHED, "observations": obs,
        "metadata": metadata or {},
    }
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {p.name}: {len(obs)} obs ({obs[0]['date']}..{obs[-1]['date']})")

def annual_obs(series, label_dates_as_year_end=True):
    """series: pd.Series indexed by year(int) -> value."""
    out = []
    for y, v in series.items():
        if pd.isna(v): continue
        out.append({"date": f"{int(y)}-12-31", "value": round(float(v), 4)})
    return sorted(out, key=lambda o: o["date"])

# ---- 1. Goldhub gold price (USD/oz, INR/oz -> INR/10g) ----
g = latest("goldhub_gold_price")
g["price_date"] = pd.to_datetime(g["price_date"])
def gh(cur):
    s = (g[g.currency == cur].drop_duplicates("price_date", keep="last")
         .set_index("price_date")["price"].sort_index())
    return s[s > 0]
usd = gh("usd"); inr = gh("inr")
usd_a = usd.resample("YE").mean(); usd_a.index = usd_a.index.year
inr_a = inr.resample("YE").mean(); inr_a.index = inr_a.index.year

WGC_URL = "https://www.gold.org/goldhub/data/gold-prices"
write_series("goldhub.IN.gold.price_usd_oz", "gold.price.usd_oz",
             "Gold price (LBMA), US$ per troy ounce", "current US$ / oz",
             annual_obs(usd_a), source_id="goldhub", source_url=WGC_URL,
             metadata={"method": "LBMA gold price, annual average of daily WGC Goldhub data.",
                       "note": "WGC/LBMA data; personal-research use only."})
write_series("goldhub.IN.gold.price_inr_10g", "gold.price.inr_10g",
             "Gold price, rupees per 10 grams", "current INR / 10g",
             annual_obs(inr_a / OZ_TO_10G), source_id="goldhub", source_url=WGC_URL,
             metadata={"method": "WGC Goldhub INR gold price (per oz) converted to per-10g (/3.11035), annual average. NOTE: WGC INR price embeds India import duty + premium, so it tracks the landed/domestic price, not LBMA x spot FX.",
                       "note": "WGC/LBMA data; personal-research use only."})

# ---- 2. Nifty 500 Total Return Index ----
n = latest("nifty_index_total_returns")
n["date"] = pd.to_datetime(n["date"])
n5 = (n[(n.index_name.str.lower().str.replace(" ", "") == "nifty500")
        & (n.return_variant == "total_return")]
      .drop_duplicates("date", keep="last").set_index("date")["level"].sort_index())
n5_a = n5.resample("YE").last(); n5_a.index = n5_a.index.year
write_series("niftyindices.IN.market.nifty500_tri", "market.nifty500_tri",
             "Nifty 500 Total Return Index", "index level",
             annual_obs(n5_a), source_id="niftyindices",
             source_url="https://www.niftyindices.com/",
             metadata={"method": "NSE Nifty 500 Total Return Index (dividends reinvested), year-end close. Via Data bank niftyindices warehouse.",
                       "note": "Total-return basis chosen so the gold-vs-equity comparison is fair (gold has no yield)."})

# ---- 3. USD/INR (FRED DEXINUS) ----
fr = latest("fred_series")
dex = fr[fr.series_id == "DEXINUS"].copy()
dex["date"] = pd.to_datetime(dex["date"]); dex["value"] = pd.to_numeric(dex["value"], errors="coerce")
dex = dex.dropna(subset=["value"])
fx_a = dex.set_index("date")["value"].resample("YE").mean(); fx_a.index = fx_a.index.year
write_series("fred.IN.macro.usd_inr", "macro.usd_inr",
             "Exchange rate, Indian rupees per US dollar", "INR / US$",
             annual_obs(fx_a), source_id="fred",
             source_url="https://fred.stlouisfed.org/series/DEXINUS",
             metadata={"method": "FRED DEXINUS (India/US FX rate), annual average of daily. Independent of the gold price source.",
                       "note": "Primary Indian source for the same series is RBI DBIE 'Daily Exchange Rate of the Indian Rupee'."})

print("databank gold ingest done.")
