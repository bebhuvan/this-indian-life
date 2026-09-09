#!/usr/bin/env python3
"""Reconcile the four WIR-annex series and the five World Bank series for the FDI article.

The annex spreadsheets are the primary source shipped with World Investment Report 2026.
The World Bank series has no local snapshot, so it is re-fetched live from the API and
compared point by point. No model is involved in either check.

Run: python3 scripts/reconcile-fdi-annex-and-worldbank.py
"""
import json, sys, urllib.request
from pathlib import Path
import openpyxl

ROOT = Path(".")
ANNEX = ROOT / "data/raw/unctad-wir/wir2026/annex"
fails, checked = [], 0

def art(indicator):
    for f in (ROOT / "data/series").glob("*.json"):
        try: a = json.loads(f.read_text())
        except Exception: continue
        if a.get("indicatorId") == indicator: return a
    raise SystemExit(f"artifact not found: {indicator}")

def sheet(tab):
    wb = openpyxl.load_workbook(ANNEX / f"{tab}.xlsx", data_only=True)
    return wb[wb.sheetnames[0]]

def india_row(ws, want_label="India"):
    """Return (years, values) for the India row of an annex table."""
    header = None
    for r in ws.iter_rows(values_only=True):
        if r and r[0] and str(r[0]).strip() in ("Region/economy", "Economy", "Host economy"):
            header = [str(c).strip() if c is not None else "" for c in r]; break
    for r in ws.iter_rows(values_only=True):
        if r and r[0] and str(r[0]).strip() == want_label:
            out = {}
            for h, v in zip(header[1:], r[1:]):
                try: out[int(float(h))] = float(v)
                except Exception: pass
            return out
    return {}

def cmp(label, got, want, ctx, tol=0.02):
    global checked
    checked += 1
    if want is None or got is None or abs(got - want) > max(tol, abs(want) * 0.005):
        fails.append(f"{label} {ctx}: artifact={got} annex={want}")

# ---- annex tab 05: cross-border M&A sales, India ---------------------------
mna = india_row(sheet("wir26_tab05"))
a = art("extfin.fdi.dev.mna_sales.IN.usd")
for o in a["observations"]:
    y = int(o["date"][:4])
    if y in mna: cmp("mna_sales", o["value"], mna[y], y)
print(f"annex tab05 (M&A sales, India): matched against {len([o for o in a['observations'] if int(o['date'][:4]) in mna])} annex years")

# ---- annex tab 14: announced greenfield projects ---------------------------
gf_in = india_row(sheet("wir26_tab14"))
a = art("extfin.fdi.dev.greenfield_announced.IN.usd")
n_in = 0
for o in a["observations"]:
    y = int(o["date"][:4])
    if y in gf_in: cmp("greenfield_announced", o["value"], gf_in[y], y); n_in += 1
print(f"annex tab14 (greenfield into India): matched {n_in} years")

# ---- annex tab 13: announced greenfield projects BY SOURCE (outward) -------
gf_out = india_row(sheet("wir26_tab13"))
a = art("extfin.fdi.dev.greenfield_outward.IN.usd")
n_out = 0
for o in a["observations"]:
    y = int(o["date"][:4])
    if y in gf_out: cmp("greenfield_outward", o["value"], gf_out[y], y); n_out += 1
print(f"annex tab13 (greenfield out of India): matched {n_out} years")

# ---- annex tab 01/03/04: a second, independent check on flow and stock ------
for tab, ind, label in [("wir26_tab01", "extfin.fdi.dev.inward_flow.IND.usd", "inflows"),
                        ("wir26_tab03", "extfin.fdi.dev.inward_stock.IN.usd", "inward stock"),
                        ("wir26_tab04", "extfin.fdi.dev.outward_stock.IN.usd", "outward stock")]:
    ref = india_row(sheet(tab))
    a = art(ind)
    n = 0
    for o in a["observations"]:
        y = int(o["date"][:4])
        if y in ref: cmp(f"annex {label}", o["value"], ref[y], y); n += 1
    print(f"annex {tab} ({label}, India): matched {n} years against the bulk CSV result")

# ---- annex tab 19/20: top 100 MNEs by home economy -------------------------
def counts(tab):
    ws = sheet(tab); c = {}
    for r in ws.iter_rows(min_row=7, values_only=True):
        corp, home = r[4], r[5]
        if corp and home and isinstance(home, str) and len(home) < 40:
            c[home.strip()] = c.get(home.strip(), 0) + 1
    return c
dev, world = counts("wir26_tab20"), counts("wir26_tab19")
a = art("extfin.fdi.dev.top100_mne_home_economy.count")
for r in a["rows"]:
    cmp("top100 developing", r["value"], dev.get(r["economy"]), r["economy"], tol=0)
    cmp("top100 world", r["world_top100"], world.get(r["economy"], 0), r["economy"], tol=0)
print(f"annex tab19/tab20 (top-100 MNEs): {len(a['rows'])} home economies checked on both lists")

# ---- World Bank: re-fetch BX.KLT.DINV.WD.GD.ZS live ------------------------
WB = {"IND": "extfin.fdi.dev.gdp_share_wb.IND.pct", "LCN": "extfin.fdi.dev.gdp_share_wb.LCN.pct",
      "EAS": "extfin.fdi.dev.gdp_share_wb.EAS.pct", "SSF": "extfin.fdi.dev.gdp_share_wb.SSF.pct",
      "WLD": "extfin.fdi.dev.gdp_share_wb.WLD.pct"}
wb_checked = 0
for geo, ind in WB.items():
    url = (f"https://api.worldbank.org/v2/country/{geo}/indicator/BX.KLT.DINV.WD.GD.ZS"
           "?format=json&per_page=20000&date=1970:2025")
    with urllib.request.urlopen(url, timeout=90) as r:
        payload = json.loads(r.read().decode())
    live = {int(d["date"]): d["value"] for d in (payload[1] or []) if d.get("value") is not None}
    a = art(ind)
    for o in a["observations"]:
        y = int(o["date"][:4])
        if y in live:
            cmp(f"worldbank {geo}", o["value"], live[y], y, tol=0.0005); wb_checked += 1
        else:
            fails.append(f"worldbank {geo} {y}: artifact has a value the live API does not")
    print(f"World Bank {geo}: {len(a['observations'])} artifact points, {len(live)} live points")

print(f"\nTOTAL: {checked} checks ({wb_checked} of them re-fetched live from the World Bank), {len(fails)} failures")
for f in fails[:40]: print("  FAIL " + f)
sys.exit(1 if fails else 0)
