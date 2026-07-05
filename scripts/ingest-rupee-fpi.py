#!/usr/bin/env python3
"""RBI Table 35 Foreign Investment Inflows -> monthly net FPI / FDI series.

Chapter 5 (words vs deeds): Patra, Kumar, John & Acharya (2025) find that
PORTFOLIO-flow volatility from global spillovers is the main driver of rupee
volatility, and RBI intervention leans against it. The hero pairing is net FPI
vs RBI net intervention (their Chart 2) - and net FPI here spans 1995-2026,
exactly matching the intervention series.

Old Format (US$ actuals, 1995-04 -> 2011-02) splices cleanly onto New Format
(US$ millions, 2011-03 -> 2026-03); old actuals are /1e6 to millions. month
"2011:02(FEB)" -> "2011-02".
"""
import datetime as dt
import hashlib
import json
import os
import re
import shutil
from pathlib import Path

import pandas as pd

DL = Path.home() / "Downloads"
SRC = Path(os.environ["RBI_TABLE_35_XLSX"]) if os.environ.get("RBI_TABLE_35_XLSX") else None
if not SRC or not SRC.exists():
    matches = list(DL.glob("RBIB Table No. 35 _ Foreign Investment Inflows*.xlsx"))
    if not matches:
        raise FileNotFoundError("No RBI Table 35 Foreign Investment Inflows workbook in ~/Downloads")
    SRC = max(matches, key=lambda p: p.stat().st_mtime)
OUT = Path("data/series")
SNAP = Path("data/snapshots/rbi-fpi")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
URL = "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"
MON = re.compile(r"(\d{4}):(\d{2})")


def month(v):
    m = MON.match(str(v))
    return f"{m.group(1)}-{m.group(2)}" if m else None


def col(df, first, date_col, val_col, scale=1.0):
    out = {}
    for _, r in df.iloc[first:].iterrows():
        mo = month(r[date_col])
        if mo is None or pd.isna(r[val_col]):
            continue
        try:
            out[mo] = round(float(r[val_col]) * scale, 3)
        except (ValueError, TypeError):
            pass
    return out


def write(name, indicator, title, series_map, metadata):
    obs = sorted(({"date": k, "value": v} for k, v in series_map.items()), key=lambda o: o["date"])
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
           "title": title, "sourceId": "rbi-fpi", "sourceIndicatorId": indicator,
           "sourceUrl": URL, "unit": "US$ billion", "frequency": "monthly",
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata}
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']} -> {obs[-1]['date']})")


def main():
    raw = SRC.read_bytes()
    h = hashlib.sha256(raw).hexdigest()[:12]
    SNAP.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SRC, SNAP / f"rbi-table-35.{h}.xlsx")

    old = pd.read_excel(SRC, sheet_name="FII Monthly (Old Format)", header=None)
    new = pd.read_excel(SRC, sheet_name="FII Monthly (New Format)", header=None)

    # Net portfolio (FPI): old col11 (actuals/1e6) + new col20 ($mn)
    fpi = {**col(old, 6, 1, 11, 1 / 1e9), **col(new, 6, 1, 20, 1 / 1000)}
    write("rbi-fpi.IN.extfin.net_fpi_usd.monthly", "IN.extfin.net_fpi_usd.monthly",
          "Net portfolio (FPI) flows into India (US$ billion)", fpi,
          {"splice": "Old Format actuals/1e6 (1995-04..2011-02) + New Format (2011-03..)", "measure": "net portfolio investment", "rawHash": h})

    # Net FDI: new col2 only
    fdi = col(new, 6, 1, 2, 1 / 1000)
    write("rbi-fpi.IN.extfin.net_fdi_usd.monthly", "IN.extfin.net_fdi_usd.monthly",
          "Net foreign direct investment into India (US$ billion)", fdi,
          {"measure": "net FDI (New Format only)", "rawHash": h})

    # Total investment inflow: old col15 (/1e6) + new col25
    tot = {**col(old, 6, 1, 15, 1 / 1e9), **col(new, 6, 1, 25, 1 / 1000)}
    write("rbi-fpi.IN.extfin.total_investment_inflow_usd.monthly", "IN.extfin.total_investment_inflow_usd.monthly",
          "Total foreign investment inflow into India (US$ billion)", tot,
          {"splice": "Old/1e6 + New", "measure": "total (FDI + portfolio)", "rawHash": h})


if __name__ == "__main__":
    main()
