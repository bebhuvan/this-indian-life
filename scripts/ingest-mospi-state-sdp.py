#!/usr/bin/env python3
"""Ingest MOSPI State-wise SDP into per-state per-capita income series.

Source: MOSPI / NSO "State-wise SDP" statements, compiled from the Directorate
of Economics & Statistics of the respective State/UT Governments. These are the
primary state-income estimates that the RBI Handbook of Statistics on Indian
States merely republishes (verified: Kerala 2011-12 per-capita = Rs 97,912 in
both). MOSPI's eSankhyiki API only carries *national* accounts, so these Excel
statements are the only route to state per-capita income.

Two base-year vintages (downloaded manually to ~/Downloads):
  * base 2004-05  -> per-capita income (current & constant), 2004-05 .. 2014-15
  * base 2011-12  -> per-capita income (current & constant), 2011-12 .. 2025-26

We keep the vintages as SEPARATE artifacts (never silently splice across base
years). "Per capita income" here is per-capita Net State Domestic Product
(NSDP). Levels in a single year are comparable across states (nominal rupees);
they do NOT adjust for cost-of-living differences between states -- a caveat for
the article. Recent years in the 2011-12 vintage are Advance / provisional
estimates; 2011-12 vintage is missing Assam, Haryana, Nagaland (per MOSPI note).

Outputs (data/series/):
  mospi-sdp.IN.econ.percap_income.<slug>.json            current, base 2011-12
  mospi-sdp.IN.econ.percap_income_real.<slug>.json       constant 2011-12 prices
  mospi-sdp.IN.econ.percap_income_2004base.<slug>.json   current, base 2004-05
Raw xls snapshotted to data/snapshots/mospi-sdp/.
"""
import json
import os
import re
import shutil

import xlrd

ROOT = os.getcwd()
OUT = os.path.join(ROOT, "data", "series")
SNAP = os.path.join(ROOT, "data", "snapshots", "mospi-sdp")
DOWNLOADS = os.path.expanduser("~/Downloads")
FETCHED = "2026-07-10T00:00:00.000Z"
SRC_URL = "https://www.mospi.gov.in/publication/gross-state-domestic-product"
SRC_ORG = ("MOSPI/NSO State-wise SDP (Directorate of Economics & Statistics of "
           "respective State/UT Governments)")

FILES = {
    "2011-12": "1777031442512-State_wise_SDP Final 15-04-2026.xls",
    "2004-05": "State_ wise _SDP-31.07.2015.xls",
}
YEAR_RE = re.compile(r"^\d{4}-\d{2}$")


def slugify(name):
    # Drop MOSPI footnote markers ($ * and "-UT" suffixes) before slugging so
    # states line up with the SRS TFR slugs (e.g. jammu_and_kashmir).
    n = name.split("$")[0].split("*")[0]
    n = re.sub(r"-?\s*UT\b", "", n)
    n = n.strip().lower().replace("&", "and")
    n = re.sub(r"[^a-z0-9]+", "_", n).strip("_")
    return n


def is_number(v):
    if isinstance(v, (int, float)):
        return True
    if isinstance(v, str):
        try:
            float(v.strip())
            return True
        except ValueError:
            return False
    return False


def parse_sheet(sheet):
    """Return (year_cols, {display_name: {year: value}}) for a PC sheet.

    The level block is the FIRST monotonic run of YYYY-YY columns; the sheet
    then repeats the years for a "% growth" block, which we stop before.
    """
    # locate header row + name column
    hdr = namecol = None
    for r in range(min(12, sheet.nrows)):
        for c in range(min(6, sheet.ncols)):
            if str(sheet.cell_value(r, c)).strip().replace(" ", "") == "State\\UT":
                hdr, namecol = r, c
                break
        if hdr is not None:
            break
    if hdr is None:
        raise RuntimeError("no 'State\\UT' header found")

    # level year-columns: first run before a year repeats / decreases
    year_cols = []
    prev = None
    for c in range(namecol + 1, sheet.ncols):
        val = str(sheet.cell_value(hdr, c)).strip()
        if not YEAR_RE.match(val):
            if year_cols:
                break
            continue
        if prev is not None and val <= prev:  # growth block restarts the years
            break
        year_cols.append((c, val))
        prev = val

    sno_col = namecol - 1
    out = {}
    for r in range(hdr + 1, sheet.nrows):
        if not is_number(sheet.cell_value(r, sno_col)):
            continue  # skip footnote / source rows (no serial number)
        name = str(sheet.cell_value(r, namecol)).strip()
        if not name:
            continue
        row = {}
        for c, yr in year_cols:
            v = sheet.cell_value(r, c)
            if is_number(v):
                row[yr] = round(float(v), 1)
        if row:
            out[name] = row
    return [y for _, y in year_cols], out


def fiscal_start(yr):  # "2011-12" -> "2011" (calendar start, matches TFR dates)
    return yr.split("-")[0]


def write_series(fname, indicator, title, unit, name, obs, base_year, extra_note=""):
    note = (f"Per-capita Net State Domestic Product, base year {base_year}. "
            "Nominal rupees are comparable across states within a year but are "
            "not adjusted for interstate cost-of-living differences. "
            + extra_note).strip()
    art = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator,
        "title": title,
        "sourceId": "mospi-sdp",
        "sourceIndicatorId": f"{SRC_ORG}: {title}",
        "sourceUrl": SRC_URL,
        "unit": unit,
        "frequency": "annual",
        "geography": {"type": "subnational", "id": f"IND-{slugify(name)}", "name": name.split('$')[0].split('*')[0].strip()},
        "dimensions": [],
        "fetchedAt": FETCHED,
        "observations": [{"date": fiscal_start(y), "value": obs[y]} for y in sorted(obs)],
        "metadata": {
            "dataset": "MOSPI/NSO State-wise SDP",
            "baseYear": base_year,
            "sourceFile": FILES[base_year],
            "note": note,
        },
    }
    with open(os.path.join(OUT, fname), "w") as f:
        json.dump(art, f, indent=2)
        f.write("\n")


def main():
    os.makedirs(SNAP, exist_ok=True)
    counts = {}
    for base, fname in FILES.items():
        src = os.path.join(DOWNLOADS, fname)
        shutil.copy2(src, os.path.join(SNAP, fname))
        wb = xlrd.open_workbook(src)

        # per-capita income: current prices (both bases), constant (2011-12 base)
        jobs = [("PC curr.", "current", "rupees per person (current prices)",
                 "percap_income" if base == "2011-12" else "percap_income_2004base")]
        if base == "2011-12":
            jobs.append(("PC con.", "constant", "rupees per person (2011-12 constant prices)",
                         "percap_income_real"))

        for sheet_name, kind, unit, key in jobs:
            years, data = parse_sheet(wb.sheet_by_name(sheet_name))
            n = 0
            for name, obs in data.items():
                if len(obs) < 2:
                    continue
                s = slugify(name)
                pretty = name.split("$")[0].split("*")[0].strip()
                extra = ""
                if base == "2011-12" and kind == "current":
                    extra = "Recent years are Advance/provisional estimates."
                write_series(
                    f"mospi-sdp.IN.econ.{key}.{s}.json",
                    f"econ.state.{key}.{s}",
                    f"Per-capita income{' (real, 2011-12 prices)' if kind=='constant' else ''}, {pretty}",
                    unit, name, obs, base, extra,
                )
                n += 1
            counts[key] = n
            print(f"  {fname} [{sheet_name}] -> {n} states ({years[0]}..{years[-1]}) as {key}")
    print("Done.", counts)


if __name__ == "__main__":
    main()
