#!/usr/bin/env python3
"""Ingest RBI's REER/NEER indices (Handbook Table 37) into series artifacts.

This is the second, independent REER source (vs BIS) AND the long pre-1994
unlock: the 36-currency, base-1985 series runs monthly from 1975, covering the
real rupee through the devaluation regimes BIS can't reach (BIS India is
broad-basket only, 1994->).

Three baskets ingested, trade-weighted NEER+REER each:
  * 36-currency (base 1985)      1975-01 -> 2021-12   [long history]
  * 40-currency (base 2015-16)   2004-04 -> 2026-04   [modern official]
  * 6-currency  (base 2015-16)   2004-04 -> 2026-04   [narrow basket]
Bases differ, so the 36c and 40c series are NOT spliceable without rebasing;
keep them separate and rebase in a derive step if a single long line is needed.
"""
import datetime as dt
import hashlib
import json
import os
import shutil
from pathlib import Path

import pandas as pd

DL = Path.home() / "Downloads"
SRC = Path(os.environ["RBI_REER_XLSX"]) if os.environ.get("RBI_REER_XLSX") else None
if not SRC or not SRC.exists():
    matches = list(DL.glob("RBIB Table No. 37 _ Indices of Real Effective Exchange Rate (REER) and Nominal Effective Exchange Rate (NEER) of the Indian Rupee*.xlsx"))
    if not matches:
        raise FileNotFoundError("No RBI Table 37 REER/NEER workbook in ~/Downloads")
    SRC = max(matches, key=lambda p: p.stat().st_mtime)
OUT = Path("data/series")
SNAP = Path("data/snapshots/rbi-reer")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
SOURCE_URL = "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=22996"

# (sheet, date_col, neer_col, reer_col, base, start_hint)
BLOCKS = [
    ("36-Currency(2004-05)", 1, 2, 3, "1985=100", "36c"),
    ("40-Currency(2015-16)", 1, 2, 3, "2015-16=100", "40c"),
    ("6-Currency (2015-16)", 5, 6, 7, "2015-16=100", "6c"),  # right block = 2015-16 base
]


def extract(df, date_col, val_col):
    # The 36-currency sheet stacks two base-year vintages in the same columns, so a
    # date can appear twice. Keep the FIRST occurrence (the base-1985 trajectory)
    # to avoid a duplicated, scribbled line.
    out = []
    seen = set()
    dates = pd.to_datetime(df[date_col], errors="coerce")
    for d, v in zip(dates, df[val_col]):
        if pd.isna(d) or pd.isna(v):
            continue
        key = d.strftime("%Y-%m")
        if key in seen:
            continue
        try:
            out.append({"date": key, "value": round(float(v), 4)})
            seen.add(key)
        except (ValueError, TypeError):
            continue
    out.sort(key=lambda o: o["date"])
    return out


def write_series(name, indicator, title, observations, metadata):
    obs = [o for o in observations if o.get("value") is not None]
    if not obs:
        print(f"  SKIP {indicator} (no obs)")
        return
    art = {
        "schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
        "title": title, "sourceId": "rbi-reer", "sourceIndicatorId": indicator,
        "sourceUrl": SOURCE_URL, "unit": metadata["base"], "frequency": "monthly",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata,
    }
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']} -> {obs[-1]['date']})")


def main():
    SNAP.mkdir(parents=True, exist_ok=True)
    # snapshot the raw workbook (provenance), hashed like the mjs writers
    raw = SRC.read_bytes()
    h = hashlib.sha256(raw).hexdigest()[:12]
    shutil.copyfile(SRC, SNAP / f"rbi-table-37.{h}.xlsx")

    for sheet, dc, nc, rc, base, tag in BLOCKS:
        df = pd.read_excel(SRC, sheet_name=sheet, header=None)
        neer = extract(df, dc, nc)
        reer = extract(df, dc, rc)
        meta_common = {"basket": tag, "base": base, "weighting": "trade-weighted",
                       "rbiTable": "Handbook Table 37", "rawHash": h}
        write_series(f"rbi-reer.IN.fx.neer_{tag}.monthly", f"IN.fx.neer_{tag}.monthly",
                     f"India NEER, {tag.replace('c','-currency')} basket, {base} (RBI)",
                     neer, dict(meta_common, measure="NEER"))
        write_series(f"rbi-reer.IN.fx.reer_{tag}.monthly", f"IN.fx.reer_{tag}.monthly",
                     f"India REER, {tag.replace('c','-currency')} basket, {base} (RBI)",
                     reer, dict(meta_common, measure="REER"))


if __name__ == "__main__":
    main()
