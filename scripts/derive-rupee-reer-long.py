#!/usr/bin/env python3
"""Extend the long 36-currency REER/NEER ("The real rupee across fifty years")
from its 2021 end to 2026 by chain-linking RBI's successor 40-currency basket.

Why: RBI discontinued the 1985-base 36-currency series in Dec 2021, so the
fifty-year chart died in 2021 while every neighbour runs to 2026. The 40c
(2015-16 base) is the official successor and overlaps the 36c from 2004 with a
stable level ratio (~1.13 REER). We splice at 2020-12 (the last clean 36c month;
the published 2021-12 point is contaminated by a 40c value), scaling the 40c to
match the 36c exactly at the junction so the line stays continuous. Result: one
1985=100 chain, 1975-01 -> 2026-04. Overwrites the existing reer_36c/neer_36c
series so the chart picks it up automatically.
"""
import datetime as dt
import json
import os
from pathlib import Path

import pandas as pd

DL = Path.home() / "Downloads"
FILE = Path(os.environ["RBI_REER_XLSX"]) if os.environ.get("RBI_REER_XLSX") else None
if not FILE or not FILE.exists():
    matches = list(DL.glob("RBIB Table No. 37 _ Indices of Real Effective Exchange Rate (REER) and Nominal Effective Exchange Rate (NEER) of the Indian Rupee*.xlsx"))
    if not matches:
        raise FileNotFoundError("No RBI Table 37 REER/NEER workbook in ~/Downloads")
    FILE = max(matches, key=lambda p: p.stat().st_mtime)
SER = Path("data/series")
JUNCTION = "2020-12"
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()

# 40-currency trade-weighted NEER (col2) / REER (col3), first occurrence per month
df = pd.read_excel(FILE, sheet_name="40-Currency(2015-16)", header=None)
n40, r40 = {}, {}
for _, row in df.iterrows():
    d = row[1]
    if not isinstance(d, dt.datetime):
        continue
    k = d.strftime("%Y-%m")
    if k not in n40 and pd.notna(row[2]):
        n40[k] = float(row[2])
    if k not in r40 and pd.notna(row[3]):
        r40[k] = float(row[3])


def extend(indicator, forty):
    path = SER / f"rbi-reer.{indicator}.monthly.json"
    art = json.loads(path.read_text())
    hist = [o for o in art["observations"] if o["date"] <= JUNCTION]
    if hist[-1]["date"] != JUNCTION:
        raise SystemExit(f"{indicator}: junction {JUNCTION} is not the last clean point (got {hist[-1]['date']})")
    scale = hist[-1]["value"] / forty[JUNCTION]
    tail = [{"date": m, "value": round(forty[m] * scale, 4)}
            for m in sorted(forty) if m > JUNCTION]
    art["observations"] = hist + tail
    art["fetchedAt"] = FETCHED
    art["metadata"] = {
        **art.get("metadata", {}),
        "splice": (f"1985-base 36-currency RBI series through {JUNCTION}; chain-linked to "
                   f"RBI's 40-currency (2015-16 base) successor x{scale:.4f} thereafter "
                   f"(RBI discontinued the 36c basket in Dec 2021)"),
        "junction": JUNCTION, "chainScale": round(scale, 4),
    }
    path.write_text(json.dumps(art, indent=2) + "\n")
    o = art["observations"]
    print(f"  {indicator}: {len(o)} obs ({o[0]['date']} -> {o[-1]['date']}), scale={scale:.4f}, end={o[-1]['value']}")


extend("IN.fx.reer_36c", r40)
extend("IN.fx.neer_36c", n40)
print("done")
