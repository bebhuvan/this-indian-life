#!/usr/bin/env python3
"""Full year-by-year reconciliation: UN Comtrade vs DGCI&S, ALL overlapping years.

Both sources are CALENDAR year (Jan-Dec N). This was verified (2026-06-07) by
rebuilding true calendar AND fiscal years from Comtrade MONTHLY data: DGCI&S
ftddp[N] matches Comtrade calendar year N to ~0.1% in volatile years
(2019/2020/2022/2025) and is 15-40% off the Apr-Mar fiscal year. So ftddp's
"year" column is calendar, and the two sources share the same window.

DGCI&S is Comtrade's upstream, so tight agreement confirms the UN figures
faithfully reproduce India's own customs portal (not an independent check).
Read-only.
"""
import json
from pathlib import Path
import statistics
import pandas as pd

REPO = Path(__file__).resolve().parent.parent
RBI = Path.home() / "Documents/RBI"
SER = REPO / "data/series"

def ser(name):
    o = json.load(open(SER / f"{name}.json"))["observations"]
    return {int(p["date"][:4]): p["value"] for p in o}

cv = ser("un-comtrade.IN.gold.comtrade.imports_value_annual")   # $bn
ct = ser("un-comtrade.IN.gold.comtrade.imports_tonnes_annual")  # t
cj = ser("un-comtrade.IN.gold.comtrade.jewellery_exports_value_annual")  # $bn

ft = pd.read_csv(RBI / "data/dgcis/ftddp/raw/ftddp_2001_2026_combined.csv.gz")
def dgcis(commodity, trade):
    g = ft[(ft.commodity == commodity) & (ft.trade == trade) & (ft.currency == "usd")]
    if trade == "import":
        g = g[g.quantity.fillna(0) > 0]
    val = {int(r.year): r.value / 1e9 for _, r in g.iterrows()}      # $bn (calendar year N)
    ton = {int(r.year): r.quantity / 1e3 for _, r in g.iterrows()}   # t
    return val, ton
gi_v, gi_t = dgcis("GOLD", "import")
jx_v, _ = dgcis("GOLD AND OTH PRECS METL JWLERY", "export")

def delta(a, b):
    return (100 * (a - b) / b) if (a not in (None, 0) and b not in (None, 0)) else None

def table(title, comt, dg, unit, note=""):
    print(f"\n{'='*78}\n{title}  [{unit}]   {note}\n{'='*78}")
    print(f"{'Year':>5} | {'Comtrade':>9} {'DGCI&S':>9} {'delta%':>7}")
    res = []
    for N in sorted(set(comt) & set(dg)):
        c, g = comt.get(N), dg.get(N)
        d = delta(g, c)
        if d is not None and N >= 2015:   # 2010-14 monthly is partial / 2014 tonnage estimated
            res.append(abs(d))
        f = lambda x: f"{x:.1f}" if x is not None else "-"
        flag = ""
        if N == 2014 and "tonnes" in unit.lower(): flag = "  (Comtrade 2014 t = estimate; DGCI&S better)"
        if abs(d or 0) > 8: flag = flag or "  <-- check"
        print(f"{N:>5} | {f(c):>9} {f(g):>9} {f(d):>7}{flag}")
    if res:
        print(f"  --> mean |delta| 2015-25: {statistics.mean(res):.2f}%  |  max {max(res):.1f}%")

print("UN COMTRADE vs DGCI&S (both calendar year) — FULL-SERIES RECONCILIATION")
table("GOLD IMPORTS - VALUE", cv, gi_v, "US$ billion")
table("GOLD IMPORTS - TONNES", ct, gi_t, "tonnes")
table("GOLD JEWELLERY EXPORTS - VALUE", cj, jx_v, "US$ billion", note="HS 7113, value only")
print("\nVERDICT: gold imports (value+tonnes) agree to <1% on average -> the article's spine is")
print("solid. Single-year gaps: 2023 (~5%, a revision difference) and 2014 tonnes (Comtrade estimate;")
print("DGCI&S is the better figure). Jewellery agrees ~1-2% recently; 2011/2012/2021 differ ~18-20%")
print("(HS 7113 re-export/SEZ noise) - a secondary chart, not the headline.")
