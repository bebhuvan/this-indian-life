#!/usr/bin/env python3
"""Ingest RBI 'Structure of Interest Rates' -> deposit-rate series.

This is the backbone of the purchasing-power counterfactual ("a rupee left in a
bank kept its purchasing power; only the mattress lost"). Two sheets splice into
one continuous annual series with no gap:
  * Old Format  1970-71 -> 1999-00  (annual averages)
  * New Format  2000-01 -> 2025-26  (as at end-March, Five Major Banks)
Headline = representative 1-3yr TERM DEPOSIT rate (range midpoint). Also the
SAVINGS deposit rate floor (New format only, 2000-01 ->).

Rates are coarse (ranges across banks; old=avg vs new=end-March) -> present as
ranges, never false precision. date = fiscal START calendar year (string).
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
SRC = Path(os.environ["RBI_INTEREST_RATES_XLSX"]) if os.environ.get("RBI_INTEREST_RATES_XLSX") else None
if not SRC or not SRC.exists():
    matches = list(DL.glob("Structure of Interest Rates*.xlsx"))
    if not matches:
        raise FileNotFoundError("No Structure of Interest Rates workbook in ~/Downloads")
    SRC = max(matches, key=lambda p: p.stat().st_mtime)
OUT = Path("data/series")
SNAP = Path("data/snapshots/rbi-interest-rates")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
SOURCE_URL = "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+Economy"

YEAR_RE = re.compile(r"(\d{4})-\d{2}")


def fiscal_start(cell):
    m = YEAR_RE.match(str(cell).strip())
    return m.group(1) if m else None


def midpoint(cell):
    """'6.00-6.50' -> 6.25 ; '6.00' -> 6.0 ; '-' / blank -> None."""
    s = str(cell).strip()
    if not s or s in {"-", "nan", "@"}:
        return None
    nums = re.findall(r"\d+\.?\d*", s)
    if not nums:
        return None
    vals = [float(n) for n in nums]
    return round(sum(vals) / len(vals), 3)


def collect(df, first_row, year_col, val_col):
    out = []
    for _, r in df.iloc[first_row:].iterrows():
        y = fiscal_start(r[year_col])
        if not y:
            continue
        v = midpoint(r[val_col])
        if v is not None:
            out.append({"date": y, "value": v, "fiscalYear": f"{y}-{str(int(y)+1)[2:]}"})
    out.sort(key=lambda o: o["date"])
    return out


def write_series(name, indicator, title, observations, metadata):
    obs = [o for o in observations if o.get("value") is not None]
    if not obs:
        print(f"  SKIP {indicator}")
        return
    art = {
        "schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
        "title": title, "sourceId": "rbi-interest-rates", "sourceIndicatorId": indicator,
        "sourceUrl": SOURCE_URL, "unit": "percent per annum", "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata,
    }
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']} -> {obs[-1]['date']})")


def main():
    SNAP.mkdir(parents=True, exist_ok=True)
    raw = SRC.read_bytes()
    h = hashlib.sha256(raw).hexdigest()[:12]
    shutil.copyfile(SRC, SNAP / f"structure-of-interest-rates.{h}.xlsx")

    old = pd.read_excel(SRC, sheet_name="Old Format", header=None)
    new = pd.read_excel(SRC, sheet_name="New Format", header=None)

    # Term deposit 1-3yr: Old col3 (1970-71->1999-00) + New col4 (2000-01->2025-26).
    td = collect(old, 8, 1, 3) + collect(new, 10, 1, 4)
    td.sort(key=lambda o: o["date"])
    write_series(
        "rbi-interest-rates.IN.rates.term_deposit_1_3yr.annual",
        "IN.rates.term_deposit_1_3yr.annual",
        "India 1-3 year term deposit rate (RBI, range midpoint)",
        td,
        {"measure": "1-3yr term deposit rate", "method": "midpoint of reported bank range",
         "splice": "Old Format avg 1970-71..1999-00 + New Format end-March 2000-01..2025-26",
         "caveat": "coarse cross-bank ranges; old=annual avg, new=end-March", "rawHash": h},
    )

    # Savings deposit rate floor: New col3 only.
    sav = collect(new, 10, 1, 3)
    write_series(
        "rbi-interest-rates.IN.rates.savings_deposit.annual",
        "IN.rates.savings_deposit.annual",
        "India savings deposit rate (RBI, range midpoint)",
        sav,
        {"measure": "savings deposit rate", "method": "midpoint of reported bank range",
         "note": "New Format only (2000-01->); deregulated Oct 2011", "rawHash": h},
    )


if __name__ == "__main__":
    main()
