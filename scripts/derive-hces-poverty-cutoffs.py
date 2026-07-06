#!/usr/bin/env python3
"""Simulate HCES 2023-24 poverty headcounts at arbitrary MPCE cutoffs.

This is not an official poverty estimate. It computes the share of people living
in households whose monthly per-capita consumption expenditure is below a chosen
rupee cutoff. MPCE is reconstructed from HCES unit records using the same
reference-period scaling and rural/urban calibration used in
derive-hces-granular.py.

Usage:
  python3 scripts/derive-hces-poverty-cutoffs.py --write
  python3 scripts/derive-hces-poverty-cutoffs.py --cutoffs=1500,2000,2500,3000 --write
"""
import argparse, csv, io, json, zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ZIP = "data/snapshots/microdata-nada/downloads/HCES_Data_2023-24_Csv.zip"
SOURCE_URL = "https://microdata.gov.in/NADA/index.php/catalog/237"
OUT_ALL = "data/series/derived.IN.poverty.hces_cutoff_simulation.json"
OUT_SECTOR = "data/series/derived.IN.poverty.hces_cutoff_simulation_sector.json"
OUT_STATE_3000 = "data/series/derived.IN.poverty.hces_cutoff_state_3000.json"
OUT_STATE_4000 = "data/series/derived.IN.poverty.hces_cutoff_state_4000.json"
OUT_SOCIAL_3000 = "data/series/derived.IN.poverty.hces_cutoff_social_3000.json"
OUT_SOCIAL_4000 = "data/series/derived.IN.poverty.hces_cutoff_social_4000.json"
csv.field_size_limit(1 << 24)

STATE = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "28": "Andhra Pradesh",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "35": "Andaman & Nicobar", "36": "Telangana", "37": "Ladakh"
}
SOCIAL_GROUP = {"1": "Scheduled Tribe", "2": "Scheduled Caste", "3": "OBC", "9": "Others"}

def member(zf, needle):
    for name in zf.namelist():
        if needle in name and name.lower().endswith(".csv"):
            return name
    raise SystemExit(f"CSV member not found: {needle}")

def hhid(cols):
    return tuple(cols[2:16])

def fnum(value):
    value = (value or "").strip()
    try:
        return float(value) if value else 0.0
    except ValueError:
        return 0.0

def factor(section):
    if section[:2] in ("6.", "7."):
        return 30.0 / 7.0
    if section in ("10.1", "10.2", "11.4") or section[:3] in ("13.", "14."):
        return 30.0 / 365.0
    return 1.0

def load_records():
    hhsize = {}
    with zipfile.ZipFile(ZIP) as zf:
        with zf.open(member(zf, "LEVEL - 15")) as fh:
            reader = csv.reader(io.TextIOWrapper(fh, "utf-8", errors="replace"))
            header = next(reader)
            i_size = header.index("HOUSEHOLD_SIZE")
            for cols in reader:
                if len(cols) <= i_size:
                    continue
                key = hhid(cols)
                size = fnum(cols[i_size])
                if size > 0 and key not in hhsize:
                    hhsize[key] = size

    social = {}
    with zipfile.ZipFile(ZIP) as zf:
        with zf.open(member(zf, "LEVEL - 03")) as fh:
            reader = csv.reader(io.TextIOWrapper(fh, "utf-8", errors="replace"))
            header = next(reader)
            i_social = header.index("Social_Group_of_HH_Head")
            for cols in reader:
                if len(cols) <= i_social:
                    continue
                key = hhid(cols)
                if key not in social:
                    social[key] = cols[i_social].strip()

    total = defaultdict(float)
    meta = {}
    with zipfile.ZipFile(ZIP) as zf:
        with zf.open(member(zf, "LEVEL - 14")) as fh:
            reader = csv.reader(io.TextIOWrapper(fh, "utf-8", errors="replace"))
            header = next(reader)
            i_sec = header.index("SECTION")
            i_val = header.index("VALUE_RS")
            i_mult = header.index("MULTIPLIER")
            for cols in reader:
                if len(cols) <= i_mult:
                    continue
                key = hhid(cols)
                total[key] += fnum(cols[i_val]) * factor(cols[i_sec])
                if key not in meta:
                    meta[key] = (cols[3], cols[4], fnum(cols[i_mult]))

    records = []
    for key, consumption in total.items():
        size = hhsize.get(key)
        if not size:
            continue
        sector, state, weight = meta[key]
        if weight <= 0 or consumption <= 0:
            continue
        records.append({
            "sector": sector,
            "state": STATE.get(state, state),
            "socialGroup": SOCIAL_GROUP.get(social.get(key, ""), "Unknown"),
            "mpce": consumption / size,
            "personWeight": weight * size
        })

    def weighted_mean(sector):
        rows = [r for r in records if r["sector"] == sector]
        den = sum(r["personWeight"] for r in rows)
        return sum(r["mpce"] * r["personWeight"] for r in rows) / den

    rural_mean = weighted_mean("1")
    urban_mean = weighted_mean("2")
    calibration = {"1": 4122.0 / rural_mean, "2": 6996.0 / urban_mean}
    for record in records:
        record["mpce"] *= calibration.get(record["sector"], 1.0)
    return records, calibration

def headcount(records, cutoff, sector=None):
    rows = [r for r in records if sector is None or r["sector"] == sector]
    den = sum(r["personWeight"] for r in rows)
    num = sum(r["personWeight"] for r in rows if r["mpce"] < cutoff)
    return 100.0 * num / den if den else 0.0

def headcount_by(records, cutoff, group_key):
    grouped = defaultdict(list)
    for record in records:
        group = record.get(group_key)
        if group and group != "Unknown":
            grouped[group].append(record)
    rows = []
    for group, group_records in grouped.items():
        den = sum(r["personWeight"] for r in group_records)
        num = sum(r["personWeight"] for r in group_records if r["mpce"] < cutoff)
        rows.append({
            "label": group,
            "cutoffRsPerPersonMonth": int(cutoff),
            "value": round(100.0 * num / den, 1) if den else 0.0
        })
    return sorted(rows, key=lambda row: row["value"], reverse=True)

def artifact_table(indicator_id, title, rows, dimensions):
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "mospi-hces",
        "sourceIndicatorId": "HCES 2023-24 unit-level microdata: MPCE cutoff simulation",
        "sourceUrl": SOURCE_URL,
        "unit": "% of people below cutoff",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "rows": rows,
        "dimensions": dimensions,
        "metadata": {
            "provenance": "Computed from HCES 2023-24 unit-level microdata, calibrated to published national rural and urban average MPCE.",
            "method": "For each cutoff, compute the population-weighted share of people living in households with reconstructed MPCE below the monthly rupee cutoff. This is a sensitivity simulation, not an official poverty estimate.",
            "caveat": "Cutoffs are nominal 2023-24 rupees per person per month. Results depend on MPCE reconstruction, reference-period scaling and calibration."
        }
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cutoffs", default="1500,2000,2500,3000,3500,4000,4500,5000,6000,7000,8000")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    cutoffs = [float(x) for x in args.cutoffs.split(",") if x.strip()]
    records, calibration = load_records()
    print(f"records={len(records):,} calibration rural={calibration['1']:.3f} urban={calibration['2']:.3f}")

    all_rows = []
    sector_rows = []
    for cutoff in cutoffs:
        label = f"Rs {int(cutoff):,}/month"
        all_rate = round(headcount(records, cutoff), 1)
        rural_rate = round(headcount(records, cutoff, "1"), 1)
        urban_rate = round(headcount(records, cutoff, "2"), 1)
        all_rows.append({"label": label, "cutoffRsPerPersonMonth": int(cutoff), "value": all_rate})
        sector_rows.extend([
            {"label": f"Rural {label}", "sector": "Rural", "cutoffRsPerPersonMonth": int(cutoff), "value": rural_rate},
            {"label": f"Urban {label}", "sector": "Urban", "cutoffRsPerPersonMonth": int(cutoff), "value": urban_rate},
            {"label": f"All India {label}", "sector": "All India", "cutoffRsPerPersonMonth": int(cutoff), "value": all_rate},
        ])
        print(f"{label:<18} all={all_rate:>5.1f}% rural={rural_rate:>5.1f}% urban={urban_rate:>5.1f}%")

    if args.write:
        Path("data/series").mkdir(parents=True, exist_ok=True)
        Path(OUT_ALL).write_text(json.dumps(artifact_table(
            "econ.poverty.hces_cutoff_simulation",
            "HCES poverty-rate simulation by monthly MPCE cutoff, 2023-24",
            all_rows,
            ["label", "cutoffRsPerPersonMonth", "value"]
        ), indent=2) + "\n")
        Path(OUT_SECTOR).write_text(json.dumps(artifact_table(
            "econ.poverty.hces_cutoff_simulation_sector",
            "HCES poverty-rate simulation by monthly MPCE cutoff and sector, 2023-24",
            sector_rows,
            ["label", "sector", "cutoffRsPerPersonMonth", "value"]
        ), indent=2) + "\n")
        for cutoff, path, indicator_id, title in [
            (3000, OUT_STATE_3000, "econ.poverty.hces_cutoff_state_3000", "HCES simulated poverty below Rs 3,000/month by state, 2023-24"),
            (4000, OUT_STATE_4000, "econ.poverty.hces_cutoff_state_4000", "HCES simulated poverty below Rs 4,000/month by state, 2023-24"),
        ]:
            Path(path).write_text(json.dumps(artifact_table(
                indicator_id,
                title,
                headcount_by(records, cutoff, "state"),
                ["label", "cutoffRsPerPersonMonth", "value"]
            ), indent=2) + "\n")
            print(f"wrote {path}")
        for cutoff, path, indicator_id, title in [
            (3000, OUT_SOCIAL_3000, "econ.poverty.hces_cutoff_social_3000", "HCES simulated poverty below Rs 3,000/month by social group, 2023-24"),
            (4000, OUT_SOCIAL_4000, "econ.poverty.hces_cutoff_social_4000", "HCES simulated poverty below Rs 4,000/month by social group, 2023-24"),
        ]:
            Path(path).write_text(json.dumps(artifact_table(
                indicator_id,
                title,
                headcount_by(records, cutoff, "socialGroup"),
                ["label", "cutoffRsPerPersonMonth", "value"]
            ), indent=2) + "\n")
            print(f"wrote {path}")
        print(f"wrote {OUT_ALL}")
        print(f"wrote {OUT_SECTOR}")

if __name__ == "__main__":
    main()
