#!/usr/bin/env python3
"""Phase-2 derived artifacts for the gold flagship + a data backfill.

1. Backfills the 2014 annual gold-import tonnage (missing from Comtrade's annual
   net-weight) by summing the 2014 monthly series.
2. gold.derived.imports_value_vs_tonnes : TABLE for a decoupleIndex chart
   (import bill vs tonnage, both indexed to 100) - the 'paid more for less' visual.
3. gold.derived.gold_growth_long / nifty500_growth_long : growth of Re1 since 1996,
   using a long reconstructed rupee gold price (LBMA USD x USD/INR) vs Nifty 500 TRI.
   Over this 30-year window equities lead gold decisively (the start-date contrast
   to the 2005-base chart where gold leads).
"""
import json, glob, datetime as dt
from pathlib import Path
OUT = Path("data/series"); FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
OZ_TO_10G = 3.11035

def byid(iid):
    for f in glob.glob("data/series/*.json"):
        try: d = json.load(open(f))
        except Exception: continue
        if d.get("indicatorId") == iid: return f, d
    return None, None

def obs_map(iid, monthly=False):
    _, d = byid(iid)
    if not d: return {}
    out = {}
    for o in d.get("observations", []):
        if o.get("value") is None: continue
        out[o["date"]] = float(o["value"])
    return out

def annual_year(iid, agg="last"):
    m = obs_map(iid); buckets = {}
    for date, v in m.items(): buckets.setdefault(int(date[:4]), []).append(v)
    return {y: (sum(v)/len(v) if agg == "mean" else v[-1]) for y, v in buckets.items()}

# ---- 1. Backfill 2014 annual tonnage from monthly ----
fpath, dt_ann = byid("gold.comtrade.imports_tonnes_annual")
mon = obs_map("gold.comtrade.imports_tonnes_monthly")
m2014 = [v for date, v in mon.items() if date.startswith("2014")]
have2014 = any(o["date"].startswith("2014") and o.get("value") for o in dt_ann["observations"])
if not have2014 and len(m2014) >= 10:
    total = round(sum(m2014), 1)
    dt_ann["observations"].append({"date": "2014-12-31", "value": total})
    dt_ann["observations"].sort(key=lambda o: o["date"])
    md = dt_ann.setdefault("metadata", {})
    md["note"] = (md.get("note", "") + " 2014 annual tonnage backfilled from the sum of 2014 monthly observations (Comtrade did not report 2014 annual net weight).").strip()
    json.dump(dt_ann, open(fpath, "w"), indent=2)
    print(f"  backfilled 2014 tonnage = {total}t ({len(m2014)} months)")
else:
    print(f"  2014 tonnage: already present or insufficient monthly ({len(m2014)} mo)")

def write_series(indicator, title, unit, observations, metadata, frequency="annual"):
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
           "title": title, "sourceId": "gold-derived", "sourceIndicatorId": indicator,
           "sourceUrl": "", "unit": unit, "frequency": frequency,
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED,
           "observations": [o for o in observations if o.get("value") is not None],
           "metadata": metadata}
    (OUT / f"gold-derived.IN.{indicator}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(art['observations'])} obs")

# ---- 2. Value-vs-tonnes table (decoupleIndex) ----
val = annual_year("gold.comtrade.imports_value_annual")
ton = annual_year("gold.comtrade.imports_tonnes_annual")
yrs = sorted(set(val) & set(ton))
rows = [{"date": f"{y}-12-31", "Import bill (US$)": round(val[y], 2), "Tonnes imported": round(ton[y], 1)} for y in yrs]
tbl = {"schemaVersion": 1, "artifactType": "table", "indicatorId": "gold.derived.imports_value_vs_tonnes",
       "title": "India's gold bill vs the tonnage it buys", "sourceId": "gold-derived",
       "sourceIndicatorId": "gold.derived.imports_value_vs_tonnes", "sourceUrl": "",
       "unit": "indexed to 100", "geography": {"type": "country", "id": "IN", "name": "India"},
       "dimensions": ["date", "Import bill (US$)", "Tonnes imported"], "fetchedAt": FETCHED, "rows": rows,
       "metadata": {"method": "UN Comtrade HS 7108: annual import value (US$bn) and tonnage, both indexed to 100 at the first year for a decoupling view.",
                    "note": "The bill climbs while tonnage stays flat: the rising cost is the global price, not more metal."}}
(OUT / "gold-derived.IN.gold.derived.imports_value_vs_tonnes.json").write_text(json.dumps(tbl, indent=2) + "\n")
print(f"  wrote gold.derived.imports_value_vs_tonnes: {len(rows)} rows")

# ---- 3. Long gold-vs-Nifty500 growth of Re1 since 1996 ----
usd = annual_year("gold.price.usd_oz"); fx = annual_year("macro.usd_inr"); nifty = annual_year("market.nifty500_tri")
recon = {y: usd[y] * fx[y] / OZ_TO_10G for y in set(usd) & set(fx)}   # reconstructed rupee gold (LBMA x FX)
START = 1996
common = sorted(set(recon) & set(nifty))
common = [y for y in common if y >= START]
if common:
    b = common[0]
    write_series("gold.derived.gold_growth_long", "Growth of ₹1 in gold since 1996 (base 100)", "index (base 100)",
                 [{"date": f"{y}-12-31", "value": round(recon[y] / recon[b] * 100, 1)} for y in common],
                 {"method": f"Rupee gold price reconstructed as LBMA US$ gold price x USD/INR (FRED), per 10g, rebased to 100 at {b}. This is the international gold price in rupees and excludes India's import duty/premium, so the method is uniform across 30 years.",
                  "note": "Long-run companion to the 2005-base chart. Over ~30 years equities lead gold."})
    write_series("gold.derived.nifty500_growth_long", "Growth of ₹1 in Nifty 500 since 1996 (base 100)", "index (base 100)",
                 [{"date": f"{y}-12-31", "value": round(nifty[y] / nifty[b] * 100, 1)} for y in common],
                 {"method": f"Nifty 500 Total Return Index, rebased to 100 at {b}.",
                  "note": "Dividends reinvested. Equities compounded faster than gold over the full window since the mid-1990s."})
    gm = recon[common[-1]] / recon[b]; em = nifty[common[-1]] / nifty[b]
    print(f"\n  LONG ({b}-{common[-1]}): ₹1 -> gold ₹{gm:.1f}, Nifty500 TRI ₹{em:.1f}  ({'NIFTY leads' if em>gm else 'GOLD leads'})")
print("derive-gold-charts done.")
