#!/usr/bin/env python3
"""Derive chart-ready series for the gold flagship from the base artifacts.

Reads data/series/*.json (resolved by indicatorId, like dataManifest.ts) and
writes derived artifacts:
  - gold.derived.gold_growth_index / nifty500_growth_index : growth of Rs1 (base 100)
  - gold.derived.gold_real_index        : Rs gold price deflated by CPI (real)
  - gold.derived.duty_wedge             : domestic premium over LBMA x spot FX (%)
  - gold.derived.return_decomposition   : TABLE, Rs-gold = USD x FX x duty (by window)
  - gold.reserves.tonnes                : RBI gold reserves in tonnes (value / world price)
  - gold.derived.household_stock        : reconstructed private gold stock (t)
  - gold.derived.imports_vs_demand      : Comtrade imports vs WGC consumer demand (t)
"""
import json, glob, math, datetime as dt
from pathlib import Path

OUT = Path("data/series"); FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
OZ_PER_TONNE = 32150.7    # troy ounces in a metric tonne
OZ_TO_10G = 3.11035

# ---- load every series by indicatorId -> {year: value} (annual) ----
def year_of(date): return int(str(date)[:4])
BYID = {}
for f in glob.glob("data/series/*.json"):
    try: d = json.load(open(f))
    except Exception: continue
    iid = d.get("indicatorId")
    if not iid or d.get("artifactType") != "series": continue
    BYID[iid] = d

def annual(iid, agg="last"):
    d = BYID.get(iid)
    if not d: return {}
    buckets = {}
    for o in d.get("observations", []):
        if o.get("value") is None: continue
        buckets.setdefault(year_of(o["date"]), []).append(float(o["value"]))
    if agg == "mean":
        return {y: sum(v) / len(v) for y, v in buckets.items()}
    return {y: v[-1] for y, v in buckets.items()}  # last obs in year

def write(name, indicator, title, unit, observations, metadata, frequency="annual"):
    obs = [o for o in observations if o.get("value") is not None]
    if not obs: print(f"  SKIP {indicator}"); return
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
           "title": title, "sourceId": "gold-derived", "sourceIndicatorId": indicator,
           "sourceUrl": "", "unit": unit, "frequency": frequency,
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata}
    (OUT / f"gold-derived.IN.{indicator}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs")

inr10g = annual("gold.price.inr_10g")          # Rs/10g (domestic, incl duty)
usdoz  = annual("gold.price.usd_oz")           # USD/oz (LBMA)
fx     = annual("macro.usd_inr")               # Rs/USD (FRED, independent)
nifty  = annual("market.nifty500_tri")         # Nifty 500 TRI
cpi    = annual("prices.cpi.combined.general.index", agg="mean")
jewel  = annual("gold.wgc.india_jewellery")
barcoin= annual("gold.wgc.india_bar_coin")
recyc  = annual("gold.wgc.india_recycling")
resusd = annual("gold.reserves.value_usd")     # US$ billion
imp_t  = annual("gold.comtrade.imports_tonnes_annual")

# ---- 1. Growth of Rs1: gold vs Nifty 500 TRI (base 100 at first common year) ----
common = sorted(set(inr10g) & set(nifty))
if common:
    b = common[0]
    write("gold-derived.IN", "gold.derived.gold_growth_index",
          "Growth of ₹1 in gold (Rs price, base 100)", "index (base 100)",
          [{"date": f"{y}-12-31", "value": round(inr10g[y] / inr10g[b] * 100, 1)} for y in common],
          {"method": f"WGC Goldhub Rs/10g gold price, rebased to 100 at {b}.",
           "note": "Domestic Rs gold price (includes import duty). Compare with Nifty 500 TRI."})
    write("gold-derived.IN", "gold.derived.nifty500_growth_index",
          "Growth of ₹1 in Nifty 500 (TRI, base 100)", "index (base 100)",
          [{"date": f"{y}-12-31", "value": round(nifty[y] / nifty[b] * 100, 1)} for y in common],
          {"method": f"Nifty 500 Total Return Index, rebased to 100 at {b}.",
           "note": "Dividends reinvested. Gold has matched equity total returns over 10-15y horizons."})

# ---- 2. Real gold price (CPI-deflated), base 100 ----
rc = sorted(set(inr10g) & set(cpi))
if rc:
    b = rc[0]
    real = {y: inr10g[y] / cpi[y] for y in rc}
    write("gold-derived.IN", "gold.derived.gold_real_index",
          "Gold price in real terms (CPI-deflated, base 100)", "index (base 100)",
          [{"date": f"{y}-12-31", "value": round(real[y] / real[b] * 100, 1)} for y in rc],
          {"method": f"Rs/10g gold price divided by CPI (combined general index), rebased to 100 at {b}.",
           "note": "Shows whether gold beat inflation or merely tracked it."})

# ---- 3. Duty + premium wedge: domestic Rs price over LBMA x spot FX ----
wy = sorted(set(inr10g) & set(usdoz) & set(fx))
wedge = {y: (inr10g[y] * OZ_TO_10G) / (usdoz[y] * fx[y]) for y in wy}
write("gold-derived.IN", "gold.derived.duty_wedge",
      "India's gold price premium over the world price", "% over LBMA x spot FX",
      [{"date": f"{y}-12-31", "value": round((wedge[y] - 1) * 100, 1)} for y in wy],
      {"method": "Domestic Rs gold price (per oz) / (LBMA USD price x FRED USD-INR) - 1. The residual after the pure conversion.",
       "note": "Tracks import duty + premium: ~2-3% pre-2013, ~10% after the 2013 duty hike, ~6% after the Jul-2024 cut (15%->6%)."})

# ---- 4. Return decomposition table: Rs-gold = USD-gold x FX x duty-wedge ----
def cagr(d, a, b):
    if a in d and b in d and d[a] > 0: return (d[b] / d[a]) ** (1 / (b - a)) - 1
    return None
end = max(set(inr10g) & set(usdoz) & set(fx))
rows = []
for a in (2005, 2010, 2015):
    ri, ru, rf, rw = cagr(inr10g, a, end), cagr(usdoz, a, end), cagr(fx, a, end), cagr(wedge, a, end)
    if None in (ri, ru, rf, rw) or ri <= -1: continue
    L = math.log(1 + ri)
    rows.append({
        "window": f"{a}-{end}", "rs_gold_cagr_pct": round(ri * 100, 1),
        "usd_gold_cagr_pct": round(ru * 100, 1), "fx_cagr_pct": round(rf * 100, 1),
        "duty_wedge_cagr_pct": round(rw * 100, 1),
        "usd_share_pct": round(math.log(1 + ru) / L * 100), "fx_share_pct": round(math.log(1 + rf) / L * 100),
        "wedge_share_pct": round(math.log(1 + rw) / L * 100)})
if rows:
    art = {"schemaVersion": 1, "artifactType": "table", "indicatorId": "gold.derived.return_decomposition",
           "title": "What drives gold's rupee return", "sourceId": "gold-derived",
           "sourceIndicatorId": "gold.derived.return_decomposition", "sourceUrl": "",
           "unit": "% per year / share", "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": list(rows[0].keys()), "fetchedAt": FETCHED, "rows": rows,
           "metadata": {"method": "Rs-gold return decomposed into global price (LBMA USD), currency (FRED USD-INR) and duty+premium wedge, multiplicatively (log shares).",
                        "note": "Global price is the majority driver (64-81%); currency is the minority (21-33%); duty is a one-time 2013 level step."}}
    (OUT / "gold-derived.IN.gold.derived.return_decomposition.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote gold.derived.return_decomposition: {len(rows)} windows")

# ---- 5. RBI reserves in tonnes (value / world price) ----
ry = sorted(set(resusd) & set(usdoz))
write("gold-derived.IN", "gold.reserves.tonnes",
      "RBI official gold reserves, tonnes (derived)", "tonnes",
      [{"date": f"{y}-12-31", "value": round(resusd[y] * 1e9 / (usdoz[y] * OZ_PER_TONNE))} for y in ry if usdoz[y] > 0],
      {"method": "RBI gold reserve value (US$) / world gold price (US$/oz) / 32,150.7 oz per tonne.",
       "note": "Approximate tonnage; RBI reports value, WGC reports ~880t directly. Levels agree within a few %."})

# ---- 6. Household/private gold stock reconstruction (anchored cumulation) ----
ANCHOR_YEAR, ANCHOR_STOCK = 2010, 20000.0  # WGC/industry estimate of India private stock ~2010 (incl. temples)
demand_years = sorted(set(jewel) & set(barcoin))
stock, cum = [], ANCHOR_STOCK
for y in demand_years:
    net_add = jewel[y] + barcoin[y] - recyc.get(y, 0.0)  # consumer demand net of recycling sold back
    if y > ANCHOR_YEAR: cum += net_add
    stock.append({"date": f"{y}-12-31", "value": round(cum)})
write("gold-derived.IN", "gold.derived.household_stock",
      "India's private gold stock (reconstructed)", "tonnes",
      stock,
      {"method": f"Bottom-up: anchor {ANCHOR_STOCK:.0f}t at {ANCHOR_YEAR} (WGC/industry estimate) + cumulative WGC consumer demand (jewellery+bar&coin) net of recycling.",
       "note": "A LOWER-BOUND reconstruction; the anchor is an assumption and official imports miss smuggling. Reconcile against WGC top-down ~25,000-27,000t; the gap is the uncounted-gold story."})

# ---- 7. Imports vs domestic demand (the re-export / absorption gap), tonnes ----
demand_t = {y: jewel[y] + barcoin[y] for y in set(jewel) & set(barcoin)}
iy = sorted(set(imp_t) & set(demand_t))
if iy:
    write("gold-derived.IN", "gold.derived.consumer_demand_tonnes",
          "India consumer gold demand (jewellery + bar & coin)", "tonnes",
          [{"date": f"{y}-12-31", "value": round(demand_t[y], 1)} for y in sorted(demand_t)],
          {"method": "WGC India jewellery + bar & coin demand, summed.",
           "note": "Compare with Comtrade gold imports: the gap is re-exported jewellery + recycling."})

# ---- headline numbers for prose/handoff ----
print("\nHEADLINES:")
if common: print(f"  Growth of Rs1 since {common[0]}: gold x{inr10g[common[-1]]/inr10g[common[0]]:.1f}, Nifty500 TRI x{nifty[common[-1]]/nifty[common[0]]:.1f}")
if stock: print(f"  Reconstructed private stock {stock[-1]['date'][:4]}: {stock[-1]['value']:,}t (vs WGC ~25-27,000t)")
if ry: print(f"  RBI reserves {ry[-1]}: {round(resusd[ry[-1]]*1e9/(usdoz[ry[-1]]*OZ_PER_TONNE)):,}t")
for r in rows: print(f"  decomp {r['window']}: Rs-gold {r['rs_gold_cagr_pct']}% = USD {r['usd_share_pct']}% / FX {r['fx_share_pct']}% / duty {r['wedge_share_pct']}%")
print("derive-gold done.")
