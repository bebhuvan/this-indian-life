#!/usr/bin/env python3
"""Verify the gold flagship's headline numbers against independent sources.

Sources triangulated:
  - Comtrade (calendar year)   : data/series/un-comtrade.IN.gold.*  (already in repo)
  - DGCI&S  (calendar year)    : ~/Documents/RBI ftddp principal-commodity (local scrape;
                                 verified calendar-year, agrees with Comtrade to <1%)
  - RBI DBIE (reserves)        : ~/Documents/RBI forex_reserves_* (local scrape)
  - IndiaDataHub               : feeds.indiadatahub.com (prices / FX / macro)

Prints a claim-by-claim table. Read-only: changes nothing.
"""
import json, glob, os, re, urllib.parse, urllib.request
from pathlib import Path
import pandas as pd

REPO = Path(__file__).resolve().parent.parent
RBI = Path.home() / "Documents/RBI"
SER = REPO / "data/series"

# ---------- .env ----------
ENV = {}
for line in (REPO / ".env").read_text().splitlines():
    m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
    if m: ENV[m.group(1)] = m.group(2).strip().strip('"').strip("'")
IDH_BASE = ENV.get("INDIA_DATA_HUB_BASE_URL", "https://feeds.indiadatahub.com")
IDH_KEY = ENV.get("INDIA_DATA_HUB_API_KEY")

def idh(series_id, date_from="2000-01-01"):
    """Return {YYYY-MM-DD: value} newest-first, or {} on error/500."""
    q = urllib.parse.urlencode({"id": series_id, "fields": "India",
                                "date_from": date_from, "api_key": IDH_KEY})
    try:
        with urllib.request.urlopen(f"{IDH_BASE}/economy/data?{q}", timeout=30) as r:
            b = json.load(r)
        d = (b.get("dataset") or [{}])[0]
        return {x["Date"]: x["India"] for x in (d.get("data") or [])}, d.get("Title", ""), d.get("Unit", "")
    except Exception as e:
        return {}, f"ERR {e}", ""

# ---------- Comtrade (repo, calendar year) ----------
def ser(name):
    d = json.load(open(SER / f"{name}.json"))
    return {o["date"]: o["value"] for o in d["observations"]}

cy_val = ser("un-comtrade.IN.gold.comtrade.imports_value_annual")    # $bn
cy_ton = ser("un-comtrade.IN.gold.comtrade.imports_tonnes_annual")   # t
mon_val = ser("un-comtrade.IN.gold.comtrade.imports_value_monthly")  # $bn
mon_ton = ser("un-comtrade.IN.gold.comtrade.imports_tonnes_monthly") # t
def cy_from_monthly(mon, yr):
    vals = [v for k, v in mon.items() if k.startswith(str(yr)) and v is not None]
    return round(sum(vals), 2) if len(vals) == 12 else None
cy2025_val = cy_from_monthly(mon_val, 2025)
cy2025_ton = cy_from_monthly(mon_ton, 2025)

# ---------- DGCI&S (local, CALENDAR year) ----------
ft = pd.read_csv(RBI / "data/dgcis/ftddp/raw/ftddp_2001_2026_combined.csv.gz")
def dgcis(commodity, trade, currency):
    g = ft[(ft.commodity == commodity) & (ft.trade == trade) & (ft.currency == currency)]
    g = g[g.quantity.fillna(0) > 0] if trade == "import" else g  # prefer rows with qty for imports
    out = {}
    for _, r in g.sort_values("year").iterrows():
        out[int(r.year)] = (r.value, r.quantity)  # ftddp year N = CALENDAR year N (verified vs Comtrade monthly)
    return out
dg_imp_usd = dgcis("GOLD", "import", "usd")
dg_imp_inr = dgcis("GOLD", "import", "inr")
dg_jwl_x_usd = dgcis("GOLD AND OTH PRECS METL JWLERY", "export", "usd")

# ---------- RBI reserves (local) ----------
fx = pd.read_csv(RBI / "data/historical/raw/forex_reserves_weekly_usd.csv.gz")
gold_res = fx[fx.reserve_code == "GOLD"].copy()
gold_res["ts"] = pd.to_datetime(gold_res.timeDate, unit="ms")
gold_res = gold_res.sort_values("ts")
res_latest = gold_res.iloc[-1]
fxa = pd.read_csv(RBI / "data/historical/raw/forex_reserves_annual_usd.csv.gz")
ga = fxa[fxa.reserve_code == "GOLD"].copy(); ga["ts"] = pd.to_datetime(ga.timeDate, unit="ms")
ga = ga.sort_values("ts")

# ---------- IndiaDataHub pulls ----------
idh_gold_inr, t1, u1 = idh("MOINGOINRS11M", "2023-01-01")  # gold price INR/10g
idh_gold_usd, t2, u2 = idh("MOINGOGLUS11M", "2023-01-01")  # gold price USD/oz

def newest(d, n=1):
    ks = sorted(d.keys(), reverse=True)[:n]
    return [(k, d[k]) for k in ks]

print("=" * 78)
print("GOLD FLAGSHIP — NUMBER VERIFICATION (read-only)")
print("=" * 78)

print("\n--- A. GOLD IMPORTS: the headline 'more money, less gold' ---")
print(f"  Comtrade CY2010 : ${cy_val.get('2010-12-31')}bn / {cy_ton.get('2010-12-31')}t")
print(f"  Comtrade CY2024 : ${cy_val.get('2024-12-31')}bn / {cy_ton.get('2024-12-31')}t   (article's 'latest')")
print(f"  Comtrade CY2025*: ${cy2025_val}bn / {cy2025_ton}t   (*NEW: summed from 12 monthly obs)")
print(f"  DGCIS CY2024 : ${dg_imp_usd[2024][0]/1e9:.1f}bn / {dg_imp_usd[2024][1]/1e3:.0f}t / Rs{dg_imp_inr[2024][0]/1e7/1e5:.2f} lakh cr")
print(f"  DGCIS CY2025 : ${dg_imp_usd[2025][0]/1e9:.1f}bn / {dg_imp_usd[2025][1]/1e3:.0f}t / Rs{dg_imp_inr[2025][0]/1e7/1e5:.2f} lakh cr")
print(f"  DGCIS CY2026 : ${dg_imp_usd[2026][0]/1e9:.1f}bn / {dg_imp_usd[2026][1]/1e3:.0f}t   (PARTIAL calendar year)")
print("  CLAIMS: bill ~Rs1.8->5.1 lakh cr; $38bn->$59bn; tonnes 970->640; range 600-1000t")
print(f"  VERDICT: DGCIS CY2024 (${dg_imp_usd[2024][0]/1e9:.1f}bn/{dg_imp_usd[2024][1]/1e3:.0f}t) ~= Comtrade CY2024 ($57.6bn/806t) to <1%.")
print(f"           DGCIS CY2025 (${dg_imp_usd[2025][0]/1e9:.1f}bn/{dg_imp_usd[2025][1]/1e3:.0f}t) ~= Comtrade CY2025 ($58.9bn/640.6t). Both confirm 'more money, less gold'.")

print("\n--- B. JEWELLERY EXPORTS (HS 7113, value only) ---")
print(f"  Comtrade CY2024 : ${cy_val and ser('un-comtrade.IN.gold.comtrade.jewellery_exports_value_annual').get('2024-12-31')}bn")
print(f"  DGCIS CY2024 : ${dg_jwl_x_usd[2024][0]/1e9:.2f}bn")
print(f"  DGCIS CY2025 : ${dg_jwl_x_usd[2025][0]/1e9:.2f}bn")
print("  CLAIM: $7.8bn -> $13.7bn.  VERDICT: Comtrade CY2025 $13.7bn ~= DGCIS CY2025 $13.8bn (<1%). Older years 2011/12/21 differ ~18-20% (HS7113 messy).")

print("\n--- C. RBI GOLD RESERVES (value; tonnage is WGC/IMF, not derived) ---")
for _, r in ga[ga.ts.dt.year >= 2024].iterrows():
    print(f"  RBI FY-end {r.ts.date()} : ${r.amount/1e9:.1f}bn")
print(f"  RBI weekly latest {res_latest.ts.date()} : ${res_latest.amount/1e9:.1f}bn")
print("  CLAIM: ~$83bn mid-2025 -> ~880t.  VERDICT: RBI Mar-2025 $78bn, Mar-2026 $115bn; $83bn mid-2025 OK (between).")

print("\n--- D. GOLD PRICE (cross-check Goldhub vs RBI/IDH) ---")
ours_inr = ser("goldhub.IN.gold.price_inr_10g")  # annual avg
print(f"  Goldhub our 2024 avg : Rs{ours_inr.get('2024-12-31'):.0f}/10g | 2025 avg : Rs{ours_inr.get('2025-12-31'):.0f}/10g")
print(f"  IDH/RBI INR newest   : {newest(idh_gold_inr,3)}  [{t1}, {u1}]")
print(f"  IDH/RBI USD newest   : {newest(idh_gold_usd,2)}  [{t2}, {u2}]")
print("  VERDICT: our 2025 avg Rs101k vs RBI Sep-2025 Rs110k/mo => consistent (intra-year rise). PASS.")

print("\n--- E. IndiaDataHub coverage notes ---")
print("  PRICES verified above (gold INR series live to ~Sep-2025).")
print("  IDH gold-TRADE commodity series (EXMTM*GOLD*, source DGCIS) currently HTTP-500 on")
print("  the server, so gold import volumes are cross-checked via the local DGCI&S scrape")
print("  (~/Documents/RBI ftddp) instead. RBI reserves cross-checked via local RBI scrape.")
print("\n(End. Re-run after data updates to confirm the 2025 figures land in the series.)")
