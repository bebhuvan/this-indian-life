#!/usr/bin/env python3
"""RBI balance-of-payments workbooks for the rupee article.

Outputs:
  * macro.current_account_usd              annual current-account balance, US$ bn
  * IN.bop.current_account_pct_gdp.annual  CAD/current-account balance as % GDP

The first intentionally writes the existing indicatorId used by the rupee
registry, replacing the older eSankhyiki artifact with the RBI workbook that
runs through 2025-26.
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
OUT = Path("data/series")
SNAP = Path("data/snapshots/rbi-bop")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
SOURCE_URL = "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"
YEAR_RE = re.compile(r"(\d{4})-\d{2}")


def newest(env, patterns):
    if os.environ.get(env):
        p = Path(os.environ[env])
        if p.exists():
            return p
    matches = []
    for pattern in patterns:
        matches.extend(DL.glob(pattern))
    matches = [p for p in matches if p.exists()]
    if not matches:
        raise FileNotFoundError(f"No workbook matching {patterns} in {DL}")
    return max(matches, key=lambda p: p.stat().st_mtime)


F_COMPONENTS = newest("RBI_BOP_COMPONENTS_XLSX", ["Key Components of India’s Balance of Payments - US Dollar*.xlsx"])
F_INDICATORS = newest("RBI_BOP_INDICATORS_XLSX", ["Balance of Payments-Indicators*.xlsx"])


def snap(path):
    raw = path.read_bytes()
    h = hashlib.sha256(raw).hexdigest()[:12]
    SNAP.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, SNAP / f"{path.stem}.{h}.xlsx")
    return h


def fiscal_end_date(label):
    m = YEAR_RE.match(str(label).strip())
    if not m:
        return None
    return f"{int(m.group(1)) + 1}-03-31"


def write(name, indicator, title, unit, observations, metadata):
    obs = sorted((o for o in observations if o.get("value") is not None), key=lambda o: o["date"])
    art = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator,
        "title": title,
        "sourceId": "rbi-bop",
        "sourceIndicatorId": indicator,
        "sourceUrl": SOURCE_URL,
        "unit": unit,
        "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED,
        "observations": obs,
        "metadata": metadata,
    }
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']} -> {obs[-1]['date']})")


def main():
    hc = snap(F_COMPONENTS)
    hi = snap(F_INDICATORS)

    comp = pd.read_excel(F_COMPONENTS, sheet_name="Report 1", header=None)
    ca = []
    for _, r in comp.iterrows():
        date = fiscal_end_date(r[1])
        if not date or pd.isna(r[6]):
            continue
        ca.append({"date": date, "value": round(float(r[6]) / 1000, 3)})
    write(
        "mospi-esankhyiki.IN.macro.current_account_usd",
        "macro.current_account_usd",
        "India's current account balance, US$ billion",
        "US$ billion",
        ca,
        {"source": "RBI Key Components of India's Balance of Payments - US Dollar", "method": "current account column divided by 1,000 from US$ millions to US$ billion", "rawHash": hc},
    )

    ind = pd.read_excel(F_INDICATORS, sheet_name="BALANCE OF PAYMENTS - INDICATOR", header=None)
    pct = []
    for _, r in ind.iterrows():
        date = fiscal_end_date(r[1])
        if not date or pd.isna(r[9]):
            continue
        pct.append({"date": date, "value": round(float(r[9]), 3)})
    write(
        "rbi-bop.IN.bop.current_account_pct_gdp.annual",
        "IN.bop.current_account_pct_gdp.annual",
        "India current-account balance as share of GDP",
        "percent of GDP",
        pct,
        {"source": "RBI Balance of Payments-Indicators", "method": "CAD/GDP column as published by RBI; sign preserved", "rawHash": hi},
    )


if __name__ == "__main__":
    main()
