#!/usr/bin/env python3
"""Normalize two RBI forex xlsx into series for Chapter 5 (words vs deeds).

  Table 4  Sale/Purchase of USD by RBI  -> intervention (spot net/buy/sell) +
           the outstanding net forward book. Monthly, Jun 1995 -> Mar 2026.
  Forex Rates Month-High/Low (Reference Rate) -> INR/USD intra-month high & low,
           Aug 1998 -> Jan 2024, a volatility-band proxy.

Sign convention (intervention, US$ millions): net = purchase - sale; positive =
RBI net BOUGHT dollars (sold rupees, leaning against appreciation). Forward book
positive = net forward purchase outstanding.
"""
import datetime as dt
import hashlib
import json
import shutil
from pathlib import Path

import pandas as pd

DL = Path.home() / "Downloads"
F_INT = Path(__import__("os").environ.get("RBI_TABLE_04_XLSX", "")) if __import__("os").environ.get("RBI_TABLE_04_XLSX") else None
F_FX = Path(__import__("os").environ.get("RBI_FX_HIGH_LOW_XLSX", "")) if __import__("os").environ.get("RBI_FX_HIGH_LOW_XLSX") else None
OUT = Path("data/series")
SNAP = Path("data/snapshots/rbi-fx")
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
URL_INT = "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"
URL_FX = "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"


def newest(patterns):
    matches = []
    for pattern in patterns:
        matches.extend(DL.glob(pattern))
    matches = [p for p in matches if p.exists()]
    if not matches:
        raise FileNotFoundError(f"No workbook matching {patterns} in {DL}")
    return max(matches, key=lambda p: p.stat().st_mtime)


F_INT = F_INT if F_INT and F_INT.exists() else newest(["RBIB Table No. 04 _ Sale_Purchase of U.S. Dollar by the RBI*.xlsx"])
F_FX = F_FX if F_FX and F_FX.exists() else newest([
    "Exchange Rate of the Indian Rupee vis-à-vis the SDR, US Dollar, Pound Sterling, Euro and Japanese Yen*.xlsx",
    "Forex Rates - Month-High _ Month-Low*.xlsx",
])


def to_month(cell):
    d = pd.to_datetime(cell, errors="coerce")
    return None if pd.isna(d) else d.strftime("%Y-%m")


def num(cell):
    try:
        v = float(str(cell).replace(",", "").strip())
        return round(v, 4)
    except (ValueError, TypeError):
        return None


def rows(df, first, date_col, val_col, scale=1.0):
    out = []
    for _, r in df.iloc[first:].iterrows():
        m = to_month(r[date_col])
        v = num(r[val_col])
        if m and v is not None:
            out.append({"date": m, "value": round(v * scale, 3)})
    out.sort(key=lambda o: o["date"])
    return out


def month_from_label(value, year=None):
    if isinstance(value, dt.datetime):
        return value.strftime("%Y-%m")
    parsed = pd.to_datetime(value, errors="coerce")
    if not pd.isna(parsed):
        return parsed.strftime("%Y-%m")
    if year is not None:
        parsed = pd.to_datetime(f"{value} {int(year)}", errors="coerce")
        if not pd.isna(parsed):
            return parsed.strftime("%Y-%m")
    return None


def high_low_usd_rows(df):
    """Return strongest/weakest INR per USD from either old or new RBI high-low workbook.

    RBI's newer sheet labels the smaller INR/USD quote as "High" and the larger
    quote as "Low", so the invariant we publish is min/max of the two cells.
    """
    out = []
    for _, r in df.iterrows():
        m = month_from_label(r[1])
        if not m:
            continue
        candidates = []
        for c in [4, 5]:
            v = num(r[c]) if c < len(r) else None
            if v is not None and 20 <= v <= 150:
                candidates.append(v)
        if len(candidates) >= 2:
            out.append({"date": m, "strongest": min(candidates), "weakest": max(candidates)})
    # New sheet is complete from 2008-ish onward; de-duplicate by month preferring
    # the latest occurrence from the official workbook.
    by_month = {}
    for item in out:
        by_month[item["date"]] = item
    return [by_month[k] for k in sorted(by_month)]


def write(name, indicator, title, unit, observations, metadata, url):
    obs = [o for o in observations if o.get("value") is not None]
    if not obs:
        print(f"  SKIP {indicator}")
        return
    art = {
        "schemaVersion": 1, "artifactType": "series", "indicatorId": indicator,
        "title": title, "sourceId": "rbi-fx", "sourceIndicatorId": indicator,
        "sourceUrl": url, "unit": unit, "frequency": "monthly",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": metadata,
    }
    (OUT / f"{name}.json").write_text(json.dumps(art, indent=2) + "\n")
    print(f"  wrote {indicator}: {len(obs)} obs ({obs[0]['date']} -> {obs[-1]['date']})")


def snap(path):
    raw = path.read_bytes()
    h = hashlib.sha256(raw).hexdigest()[:12]
    SNAP.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, SNAP / f"{path.stem}.{h}.xlsx")
    return h


def main():
    # --- Intervention (Table 4) ---
    hi = snap(F_INT)
    di = pd.read_excel(F_INT, sheet_name="Sale�Purchase of USD by RBI", header=None)
    meta_i = {"rbiTable": "Handbook Table 4", "signConvention": "net=+ when RBI net bought USD (sold rupees)", "rawHash": hi}
    write("rbi-fx.IN.fx.rbi_net_intervention_usd.monthly", "IN.fx.rbi_net_intervention_usd.monthly",
          "RBI net USD intervention, spot (US$ billion)", "US$ billion", rows(di, 5, 1, 3, 1 / 1000),
          dict(meta_i, measure="net spot (purchase - sale)"), URL_INT)
    write("rbi-fx.IN.fx.rbi_purchase_usd.monthly", "IN.fx.rbi_purchase_usd.monthly",
          "RBI gross USD purchase, spot (US$ billion)", "US$ billion", rows(di, 5, 1, 4, 1 / 1000),
          dict(meta_i, measure="gross purchase"), URL_INT)
    write("rbi-fx.IN.fx.rbi_sale_usd.monthly", "IN.fx.rbi_sale_usd.monthly",
          "RBI gross USD sale, spot (US$ billion)", "US$ billion", rows(di, 5, 1, 5, 1 / 1000),
          dict(meta_i, measure="gross sale (magnitude)"), URL_INT)
    write("rbi-fx.IN.fx.rbi_forward_book_usd.monthly", "IN.fx.rbi_forward_book_usd.monthly",
          "RBI outstanding net forward book (US$ billion)", "US$ billion", rows(di, 5, 1, 9, 1 / 1000),
          dict(meta_i, measure="outstanding net forward sales(-)/purchase(+), end-month"), URL_INT)
    # Cross-check the main-sheet forward total against the residual-maturity sheet
    # when the newer workbook includes it.
    try:
        dm = pd.read_excel(F_INT, sheet_name="4(a) Maturity Breakdown of Outs", header=None)
        maturity = []
        for _, r in dm.iloc[5:].iterrows():
            m = month_from_label(r[1], r[2])
            v = num(r[17]) if len(r) > 17 else None
            if m and v is not None:
                maturity.append({"date": m, "value": round(v / 1000, 3)})
        main_forward = {o["date"]: o["value"] for o in rows(di, 5, 1, 9, 1 / 1000)}
        mismatches = [o for o in maturity if o["date"] in main_forward and abs(o["value"] - main_forward[o["date"]]) > 0.001]
        if mismatches:
            raise RuntimeError(f"Forward maturity cross-check failed: {mismatches[:3]}")
    except ValueError:
        pass

    # --- Forex month high/low (Reference Rate, USD) ---
    hf = snap(F_FX)
    xls = pd.ExcelFile(F_FX)
    if "New" in xls.sheet_names:
        dfx = pd.read_excel(F_FX, sheet_name="New", header=None)
        hl = high_low_usd_rows(dfx)
        high_obs = [{"date": o["date"], "value": o["weakest"]} for o in hl]
        low_obs = [{"date": o["date"], "value": o["strongest"]} for o in hl]
    else:
        dfx = pd.read_excel(F_FX, sheet_name="Based on Reference Rate", header=None)
        high_obs = rows(dfx, 7, 1, 8)
        low_obs = rows(dfx, 7, 1, 9)
    meta_f = {"basis": "RBI Reference Rate", "note": "intra-month high/low INR per USD", "rawHash": hf}
    write("rbi-fx.IN.fx.inr_usd_month_high.monthly", "IN.fx.inr_usd_month_high.monthly",
          "INR per USD, month high (RBI reference rate)", "INR per USD", high_obs,
          dict(meta_f, measure="month high"), URL_FX)
    write("rbi-fx.IN.fx.inr_usd_month_low.monthly", "IN.fx.inr_usd_month_low.monthly",
          "INR per USD, month low (RBI reference rate)", "INR per USD", low_obs,
          dict(meta_f, measure="month low"), URL_FX)


if __name__ == "__main__":
    main()
