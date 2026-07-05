#!/usr/bin/env python3
"""Derived composite series for the rupee article's analytical charts.

  A. Nominal-vs-real overlay (Ch6 hero): rupee's external USD value, NEER and
     REER, all rebased to Jan-1994=100 (BIS broad basket, single source, no
     splice). Shows the nominal value collapsing while REER stays ~flat.
  B. PPP test (Ch6): actual INR/USD vs the rate implied by the India-US CPI
     differential (base 1994). Shows the rupee overshooting pure PPP.
  C. FD counterfactual (Ch6 kill-shot): Re.1 in a 1-3yr bank deposit since 1970
     vs the cost of living vs the same deposit after inflation.
  D. Oil in two currencies (Ch7): Brent in USD vs Brent in rupees, rebased,
     showing how depreciation amplifies the import bill.

All derived series point sourceUrl at an underlying source so the chart SOURCE
line still links. Real outcomes presented as the BIS-CPI estimate; prose must
state the 1.3-1.7x range (CPI choice). Monthly base = 1994-01 (post-LERMS,
clean), avoiding the flagged 1973 turbulence.
"""
import datetime as dt
import json
from collections import defaultdict
from pathlib import Path

SER = Path("data/series")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()


def load(name):
    return json.load(open(SER / name))


def obsmap(name):
    return {o["date"]: o["value"] for o in load(name)["observations"] if o["value"] is not None}


def annavg(name):
    a = defaultdict(list)
    for o in load(name)["observations"]:
        if o["value"] is not None:
            a[o["date"][:4]].append(o["value"])
    return {y: sum(v) / len(v) for y, v in a.items()}


def write(name, indicator, title, unit, observations, freq, source_url, metadata):
    obs = [o for o in observations if o.get("value") is not None]
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
           "title": title, "sourceId": "rupee-derived", "sourceIndicatorId": indicator,
           "sourceUrl": source_url, "unit": unit, "frequency": freq,
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata}
    (SER / f"rupee-derived.{indicator}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']} -> {obs[-1]['date']})")


# ---------- A. Nominal vs real overlay (monthly, base 1994-01=100) ----------
BIS = "https://data.bis.org/topics/EER"
FREDX = "https://fred.stlouisfed.org/series/EXINUS"
nom = obsmap("fred.IN.fx.inr_usd.monthly.json")
neer = obsmap("bis.IN.fx.neer_broad.monthly.json")
reer = obsmap("bis.IN.fx.reer_broad.monthly.json")
BASE = "1994-01"
months = sorted(set(nom) & set(neer) & set(reer))
months = [m for m in months if m >= BASE]
# external nominal value of the rupee = inverse of INR/USD, rebased (falls as rupee weakens)
write("derived.IN.fx.idx_rupee_vs_usd", "derived.IN.fx.idx_rupee_vs_usd",
      "Rupee's value against the US dollar (Jan 1994 = 100)", "index Jan 1994=100",
      [{"date": m, "value": round(100 * nom[BASE] / nom[m], 2)} for m in months], "monthly",
      FREDX, {"derived": "100 x (INR/USD at 1994-01) / (INR/USD at t); falls as rupee depreciates"})
write("derived.IN.fx.idx_neer_broad", "derived.IN.fx.idx_neer_broad",
      "Rupee's trade-weighted nominal value, NEER (Jan 1994 = 100)", "index Jan 1994=100",
      [{"date": m, "value": round(100 * neer[m] / neer[BASE], 2)} for m in months], "monthly",
      BIS, {"derived": "BIS broad NEER rebased to 1994-01=100"})
write("derived.IN.fx.idx_reer_broad", "derived.IN.fx.idx_reer_broad",
      "Rupee's trade-weighted REAL value, REER (Jan 1994 = 100)", "index Jan 1994=100",
      [{"date": m, "value": round(100 * reer[m] / reer[BASE], 2)} for m in months], "monthly",
      BIS, {"derived": "BIS broad REER rebased to 1994-01=100; the real-strength lens"})

# ---------- B. PPP test (monthly, ₹/$ levels, base 1994-01) ----------
cin = obsmap("bis.IN.prices.cpi.monthly.json")
cus = obsmap("bis.US.prices.cpi.monthly.json")
pm = [m for m in sorted(set(nom) & set(cin) & set(cus)) if m >= BASE]
write("derived.IN.fx.inr_usd_ppp_implied", "derived.IN.fx.inr_usd_ppp_implied",
      "INR/USD implied by India-US inflation differential", "INR per USD",
      [{"date": m, "value": round(nom[BASE] * (cin[m] / cin[BASE]) / (cus[m] / cus[BASE]), 2)} for m in pm], "monthly",
      "https://data.bis.org/topics/LONG_CPI",
      {"derived": "relative PPP from 1994-01 base using BIS India & US CPI; pair vs actual INR/USD (IN.fx.inr_usd.monthly)"})

# ---------- C. FD counterfactual (annual, base 1970=1.0) ----------
td = obsmap("rbi-interest-rates.IN.rates.term_deposit_1_3yr.annual.json")
cin_a = annavg("bis.IN.prices.cpi.monthly.json")
fd, cpi_idx = 1.0, 1.0
fd_nom, cost, fd_real = [], [], []
for y in [str(x) for x in range(1970, 2025)]:
    r, nxt = td.get(y), str(int(y) + 1)
    fd_nom.append({"date": y, "value": round(fd, 3)})
    cost.append({"date": y, "value": round(cpi_idx, 3)})
    fd_real.append({"date": y, "value": round(fd / cpi_idx, 3)})
    if r is not None:
        fd *= (1 + r / 100)
    if y in cin_a and nxt in cin_a:
        cpi_idx *= cin_a[nxt] / cin_a[y]
RBIH = "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"
write("derived.IN.savings.fd_nominal", "derived.IN.savings.fd_nominal",
      "Re.1 in a bank deposit since 1970 (nominal)", "rupees (1970 = 1)", fd_nom, "annual",
      RBIH, {"derived": "Re.1 compounded at the 1-3yr term-deposit rate"})
write("derived.IN.savings.cost_of_living", "derived.IN.savings.cost_of_living",
      "Cost of living since 1970 (CPI)", "index (1970 = 1)", cost, "annual",
      "https://data.bis.org/topics/LONG_CPI", {"derived": "BIS India CPI rebased to 1970=1"})
write("derived.IN.savings.fd_real", "derived.IN.savings.fd_real",
      "Re.1 in a bank deposit, after inflation", "rupees of 1970 purchasing power", fd_real, "annual",
      RBIH, {"derived": "fd_nominal / CPI; real value of a banked rupee. Magnitude is CPI-dependent: ~1.3x (FRED CPI) to ~1.7x (BIS CPI) by 2024 - present as a range."})

# ---------- D. Oil in two currencies (monthly, base 2000-01=100) ----------
brent = obsmap("fred.GLOBAL.energy.brent_usd.monthly.json")
OBASE = "2000-01"
om = [m for m in sorted(set(brent) & set(nom)) if m >= OBASE]
write("derived.IN.energy.brent_usd_idx", "derived.IN.energy.brent_usd_idx",
      "Brent crude in US dollars (Jan 2000 = 100)", "index Jan 2000=100",
      [{"date": m, "value": round(100 * brent[m] / brent[OBASE], 1)} for m in om], "monthly",
      "https://fred.stlouisfed.org/series/POILBREUSDM", {"derived": "Brent USD rebased to 2000-01=100"})
write("derived.IN.energy.brent_inr_idx", "derived.IN.energy.brent_inr_idx",
      "Brent crude in rupees (Jan 2000 = 100)", "index Jan 2000=100",
      [{"date": m, "value": round(100 * (brent[m] * nom[m]) / (brent[OBASE] * nom[OBASE]), 1)} for m in om], "monthly",
      "https://fred.stlouisfed.org/series/POILBREUSDM", {"derived": "Brent x INR/USD rebased to 2000-01=100; the rupee oil price Indians actually pay"})

print("done")
