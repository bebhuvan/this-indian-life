#!/usr/bin/env python3
"""India's foreign trade in BOTH currencies (annual, 1970-71 -> 2025-26).

Two on-theme uses for the rupee article:
  * Ch7: the oil import bill the rupee has to pay for, and the trade balance.
  * The "is the rupee just a number?" teaching chart: the SAME exports indexed
    in rupees vs dollars diverge massively - a rupee triumph, a dollar plateau -
    purely because the rupee depreciated. Concrete proof that the unit matters.

Source: RBI/DGCI&S foreign-trade tables (US$ millions and ₹ crore). date =
fiscal START year (1970-71 -> "1970").
"""
import datetime as dt
import hashlib
import json
import os
import re
import shutil
from collections import defaultdict
from pathlib import Path

import pandas as pd

DL = Path.home() / "Downloads"
F_USD = Path(os.environ["RBI_TRADE_USD_XLSX"]) if os.environ.get("RBI_TRADE_USD_XLSX") else None
F_INR = Path(os.environ["RBI_TRADE_INR_XLSX"]) if os.environ.get("RBI_TRADE_INR_XLSX") else None
if not F_USD or not F_USD.exists():
    matches = list(DL.glob("India’s Foreign Trade - US Dollar*.xlsx"))
    if not matches:
        raise FileNotFoundError("No India’s Foreign Trade - US Dollar workbook in ~/Downloads")
    F_USD = max(matches, key=lambda p: p.stat().st_mtime)
if not F_INR or not F_INR.exists():
    matches = list(DL.glob("India’s Foreign Trade - Rupees*.xlsx"))
    if not matches:
        raise FileNotFoundError("No India’s Foreign Trade - Rupees workbook in ~/Downloads")
    F_INR = max(matches, key=lambda p: p.stat().st_mtime)
OUT = Path("data/series")
SNAP = Path("data/snapshots/rbi-trade")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
URL = "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"
YEAR_RE = re.compile(r"(\d{4})-\d{2}")

# column map (0-indexed): 1=Year | exports oil2 nonoil3 total4 | imports oil5 nonoil6 total7 | bal oil8 nonoil9 total10
COLS = {"exports_total": 4, "imports_total": 7, "imports_oil": 5, "imports_non_oil": 6, "trade_balance_total": 10}


def parse(path, sheet):
    df = pd.read_excel(path, sheet_name=sheet, header=None)
    rows = {}
    for _, r in df.iterrows():
        m = YEAR_RE.match(str(r[1]).strip())
        if not m:
            continue
        y = m.group(1)
        row = {}
        for k, c in COLS.items():
            row[k] = None if c >= len(r) or pd.isna(r[c]) else round(float(r[c]), 1)
        if row.get("trade_balance_total") is None and row.get("exports_total") is not None and row.get("imports_total") is not None:
            row["trade_balance_total"] = round(row["exports_total"] - row["imports_total"], 1)
        rows[y] = row
    return rows


def parse_inr(path):
    xls = pd.ExcelFile(path)
    df = pd.read_excel(path, sheet_name=xls.sheet_names[0], header=None)
    # New RBI workbook: monthly totals, cols Year/Month/Exports/Imports/Trade Balance.
    if any(str(v).strip() == "Month" for v in df.iloc[5].tolist() if not pd.isna(v)):
        monthly = defaultdict(list)
        for _, r in df.iterrows():
            m = YEAR_RE.match(str(r[1]).strip())
            if not m:
                continue
            y = m.group(1)
            vals = {
                "exports_total": None if pd.isna(r[3]) else float(r[3]),
                "imports_total": None if pd.isna(r[4]) else float(r[4]),
                "trade_balance_total": None if pd.isna(r[5]) else float(r[5]),
            }
            monthly[y].append(vals)
        annual = {}
        for y, rows in monthly.items():
            # Keep only complete fiscal years. The current partial 2026-27 April
            # row is useful for monitoring, but not for an annual chart.
            if len(rows) != 12:
                continue
            annual[y] = {k: round(sum(row[k] for row in rows if row[k] is not None), 1) for k in rows[0]}
        return annual, "monthly totals summed to complete fiscal years"
    return parse(path, xls.sheet_names[0]), "annual workbook values"


def snap(path):
    raw = path.read_bytes()
    h = hashlib.sha256(raw).hexdigest()[:12]
    SNAP.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, SNAP / f"{path.stem}.{h}.xlsx")
    return h


def write(name, indicator, title, unit, rows_by_year, key, metadata, scale=1.0):
    obs = sorted(({"date": y, "value": round(v[key] * scale, 3)} for y, v in rows_by_year.items() if v.get(key) is not None), key=lambda o: o["date"])
    if not obs:
        print(f"  skip {indicator}: no observations for {key}")
        return
    art = {"schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
           "title": title, "sourceId": "rbi-trade", "sourceIndicatorId": indicator,
           "sourceUrl": URL, "unit": unit, "frequency": "annual",
           "geography": {"type": "country", "id": "IN", "name": "India"},
           "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata}
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']} -> {obs[-1]['date']})")


def main():
    hu, hi = snap(F_USD), snap(F_INR)
    usd = parse(F_USD, "INDIA’S FOREIGN TRADE - US DOLL")
    inr, inr_method = parse_inr(F_INR)

    specs = [
        ("exports_total", "Merchandise exports", {"usd": "US$ billion", "inr": "₹ crore"}),
        ("imports_total", "Merchandise imports", {"usd": "US$ billion", "inr": "₹ crore"}),
        ("imports_oil", "Oil imports (the petroleum bill)", {"usd": "US$ billion", "inr": "₹ crore"}),
        ("trade_balance_total", "Merchandise trade balance", {"usd": "US$ billion", "inr": "₹ crore"}),
    ]
    for key, label, units in specs:
        write(f"rbi-trade.IN.trade.{key}_usd.annual", f"IN.trade.{key}_usd.annual",
              f"{label} (US$)", units["usd"], usd, key, {"currency": "USD", "rawHash": hu, "source": "RBI/DGCI&S"}, scale=1 / 1000)
        write(f"rbi-trade.IN.trade.{key}_inr.annual", f"IN.trade.{key}_inr.annual",
              f"{label} (₹)", units["inr"], inr, key, {"currency": "INR", "rawHash": hi, "source": "RBI/DGCI&S", "method": inr_method})

    # --- Derived dual-currency export index (1970-71 = 100): the teaching chart ---
    for cur, src, tag in [("US$", usd, "usd"), ("₹", inr, "inr")]:
        yrs = sorted(y for y in src if src[y].get("exports_total"))
        base = yrs[0]
        b = src[base]["exports_total"]
        obs = [{"date": y, "value": round(100 * src[y]["exports_total"] / b, 1)} for y in yrs]
        metadata = {"derived": f"merchandise exports in {cur} rebased to {base}=100; gap vs the other currency = rupee depreciation"}
        title_base = base
        if tag == "inr" and base != "1970":
            old_path = OUT / "rupee-derived.derived.IN.trade.exports_idx_inr.json"
            if old_path.exists():
                old = json.loads(old_path.read_text())
                old_obs = {o["date"]: o["value"] for o in old.get("observations", []) if o.get("value") is not None}
                if base in old_obs:
                    scale = old_obs[base] / obs[0]["value"]
                    obs = [{"date": y, "value": round(v * scale, 1)} for y, v in [(o["date"], o["value"]) for o in obs]]
                    prefix = [o for o in old.get("observations", []) if o.get("value") is not None and o["date"] < base]
                    obs = prefix + obs
                    title_base = obs[0]["date"]
                    metadata = {"derived": f"RBI monthly INR merchandise exports summed to annual fiscal years from {base}, chain-linked to the previous 1970-base RBI annual index at {base}; gap vs USD = rupee depreciation", "chainLinkYear": base, "chainScale": round(scale, 6), "rawHash": hi}
        art = {"schemaVersion": 1, "artifactType": "series",
               "indicatorId": f"derived.IN.trade.exports_idx_{tag}",
               "title": f"India's exports in {cur} ({title_base}-{int(title_base)%100+1} = 100)",
               "sourceId": "rupee-derived", "sourceIndicatorId": f"derived.IN.trade.exports_idx_{tag}",
               "sourceUrl": URL, "unit": f"index {base}=100", "frequency": "annual",
               "geography": {"type": "country", "id": "IN", "name": "India"},
               "dimensions": [], "fetchedAt": FETCHED, "observations": obs,
               "metadata": metadata}
        (OUT / f"rupee-derived.derived.IN.trade.exports_idx_{tag}.json").write_text(json.dumps(art, indent=2) + "\n")
        print(f"  wrote derived exports_idx_{tag}: {len(obs)} obs ({obs[0]['date']}->{obs[-1]['date']}) end={obs[-1]['value']}")


if __name__ == "__main__":
    main()
