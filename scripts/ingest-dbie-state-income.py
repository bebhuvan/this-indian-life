#!/usr/bin/env python3
"""Ingest RBI DBIE per-capita Net State Domestic Product (current prices).

Source: RBI Database on Indian Economy (DBIE), "Per Capita Net State Domestic
Product - State-wise (At Current Prices)", which republishes the CSO/DES state
income estimates. Downloaded manually to ~/Downloads.

Why this on top of the MOSPI State-wise SDP ingest:
  * COMPLETE: includes Assam & Haryana, which MOSPI's 2011-12 vintage omits.
  * LONGER: runs 1980-2024 (MOSPI 2011-12 file starts 2011-12).
  * VERIFIED: 2012-2024 values match the MOSPI/NSO file to the rupee.

BASE-YEAR BREAK (important, flagged in metadata): DBIE concatenates official
base-era figures rather than chain-linking. Values from 2012-13 onward are the
2011-12 base series (identical to MOSPI); 1980-81..2011-12 are earlier-base
back-series and step UP ~15-18% at the 2011/2012 boundary (e.g. Kerala 2011-12
= Rs 82,753 old-base vs Rs 97,912 in 2011-12 base). So: use >=2012 for clean
single-base level comparisons; treat the pre-2012 tail as indicative context
with the break noted. Nominal rupees; not adjusted for interstate cost of living.

This series owns the canonical indicatorId econ.state.percap_income.<slug>; the
MOSPI ingest's current-price files for the same id are removed in favour of it.
MOSPI still provides the real (constant-price) and 2004-05-base companions.
"""
import json
import os
import re
import shutil

import openpyxl

ROOT = os.getcwd()
OUT = os.path.join(ROOT, "data", "series")
SNAP = os.path.join(ROOT, "data", "snapshots", "dbie-state-income")
SRC = os.path.expanduser(
    "~/Downloads/Per Capita Net State Domestic Product - State-wise (At Current Prices).xlsx")
FETCHED = "2026-07-10T00:00:00.000Z"
SRC_URL = "https://data.rbi.org.in/DBIE/"
BASE_BREAK_YEAR = 2012


def slugify(name):
    n = name.split("$")[0].split("*")[0]
    n = re.sub(r"-?\s*UT\b", "", n)
    n = n.strip().lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "_", n).strip("_")


def main():
    os.makedirs(SNAP, exist_ok=True)
    shutil.copy2(SRC, os.path.join(SNAP, os.path.basename(SRC)))
    rows = list(openpyxl.load_workbook(SRC, read_only=True, data_only=True).active.iter_rows(values_only=True))

    # header row 7 (0-indexed) holds state names across columns; year label in col 1
    hdr = rows[7]
    NON_STATE = {"State / Union Territory", "All India", "None", ""}
    cols = {c: str(hdr[c]).strip() for c in range(len(hdr))
            if hdr[c] and str(hdr[c]).strip() not in NON_STATE}

    written = 0
    for ci, state in cols.items():
        obs = []
        for r in rows[9:]:
            y = r[1]
            if not (y and "-" in str(y)):
                continue
            v = r[ci]
            if isinstance(v, (int, float)):
                obs.append({"date": str(y).strip().split("-")[0], "value": round(float(v), 1)})
        obs.sort(key=lambda o: o["date"])
        if len(obs) < 2:
            continue
        s = slugify(state)
        art = {
            "schemaVersion": 1,
            "artifactType": "series",
            "indicatorId": f"econ.state.percap_income.{s}",
            "title": f"Per-capita income, {state}",
            "sourceId": "dbie",
            "sourceIndicatorId": f"RBI DBIE: Per Capita Net State Domestic Product (current prices), {state}",
            "sourceUrl": SRC_URL,
            "unit": "rupees per person (current prices)",
            "frequency": "annual",
            "geography": {"type": "subnational", "id": f"IND-{s}", "name": state},
            "dimensions": [],
            "fetchedAt": FETCHED,
            "observations": obs,
            "metadata": {
                "dataset": "RBI Database on Indian Economy: Per Capita NSDP, state-wise, current prices",
                "verifiedAgainst": "MOSPI/NSO State-wise SDP (2012-2024 identical to the rupee)",
                "firstYear": obs[0]["date"],
                "lastYear": obs[-1]["date"],
                "baseBreak": (
                    f"Values from {BASE_BREAK_YEAR} are 2011-12 base (match MOSPI/NSO). "
                    f"Years before {BASE_BREAK_YEAR} are DBIE earlier-base back-series and step "
                    "up ~15-18% at the 2011/2012 boundary. Use >=2012 for single-base level "
                    "comparisons; earlier years are indicative context only."),
                "note": "Nominal rupees, comparable across states within a year but not adjusted "
                        "for interstate cost-of-living differences.",
            },
        }
        with open(os.path.join(OUT, f"dbie.IN.econ.percap_income.{s}.json"), "w") as f:
            json.dump(art, f, indent=2)
            f.write("\n")
        written += 1
    print(f"  wrote {written} state per-capita income series ({obs[0]['date']}..{obs[-1]['date']})")

    # Remove the now-superseded MOSPI current-price files sharing this indicatorId
    removed = 0
    for fn in os.listdir(OUT):
        if re.fullmatch(r"mospi-sdp\.IN\.econ\.percap_income\.[a-z_]+\.json", fn):
            os.remove(os.path.join(OUT, fn))
            removed += 1
    print(f"  removed {removed} superseded MOSPI current-price files "
          "(kept *_real and *_2004base companions)")


if __name__ == "__main__":
    main()
