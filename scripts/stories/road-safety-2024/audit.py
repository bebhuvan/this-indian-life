#!/usr/bin/env python3
"""Independently compare every saved story observation with frozen PDF source rows."""

import csv
import hashlib
import json
import re
import runpy
from pathlib import Path

import pymupdf


ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/road-safety-2024"
OUT = ROOT / "data/audits/road-safety-2024"
ns = runpy.run_path(str(Path(__file__).with_name("ingest.py")))
row = ns["row"]
HASHES = ns["HASHES"]
results = []


def check(indicator, label, observed, expected, ref):
    results.append({"indicatorId": indicator, "cell": label, "artifactValue": observed,
                    "sourceValue": expected, "sourceRef": ref, "match": observed == expected})


def artifact(slug):
    path = ROOT / f"data/series/road-safety-2024.{slug}.json"
    return json.loads(path.read_text())


def main():
    for filename, expected in HASHES.items():
        actual = hashlib.sha256((RAW / filename).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"Raw file changed: {filename}")
    pdf = pymupdf.open(RAW / "road-accidents-in-india-2024.pdf")
    source = {n: pdf[n - 1].get_text(sort=True).splitlines() for n in [30, 35, 54, 92, 98, 161, 162]}
    annual = artifact("fatalities.2020_2024")
    for item in annual["observations"]:
        year = item["date"]
        expected = int(row(source[35], year, 6, 35, "1.1")[2])
        check(annual["indicatorId"], year, item["value"], expected,
              f"MoRTH Table 1.1, PDF p35, {year}, fatalities")
    for slug, page, table, width, index in [
        ("road_users.2024", 98, "4.4", 3, 1),
        ("ages.2024", 92, "4.2", 3, 1),
        ("road_categories.2024", 54, "2.1", 9, 4),
    ]:
        doc = artifact(slug)
        for item in doc["rows"]:
            label = item["sourceRow"]
            expected = int(row(source[page], label, width, page, table)[index])
            check(doc["indicatorId"], item["label"], item["value"], expected,
                  f"MoRTH Table {table}, PDF p{page}, {label}, 2024 deaths")
    who = artifact("who_reported_estimated.2021")
    text = pymupdf.open(RAW / "who-road-safety-india-2023-profile.pdf")[0].get_text(sort=True)
    reported = re.search(r"Reported fatalities \(year\)\s+([\d ]+) \(2021\)", text)
    estimate = re.search(r"WHO estimated road traffic fatalities \(95% CI\) \(year\)\s+([\d ]+) \(95% CI ([\d ]+) - ([\d ]+)\) \(2021\)", text)
    if not reported or not estimate:
        raise ValueError("WHO burden block missing or changed")
    who_expected = [int(re.sub(r"\s", "", reported.group(1))), int(re.sub(r"\s", "", estimate.group(1)))]
    for item, expected in zip(who["rows"], who_expected):
        check(who["indicatorId"], item["label"], item["value"], expected,
              "WHO India country profile, PDF p1, Burden, 2021")
    death = annual["observations"][-1]["value"]
    for slug in ["road_users.2024", "ages.2024", "road_categories.2024"]:
        doc = artifact(slug)
        check(doc["indicatorId"], "2024 category sum", sum(r["value"] for r in doc["rows"]), death,
              "MoRTH Table 1.1, PDF p35, 2024 fatalities")
    method_text = "\n".join(source[161] + source[162])
    method_checks = {
        "West Bengal recast": "recast" in "\n".join(source[30]),
        "police under-reporting discussed": "under-reporting" in "\n".join(source[161]) and "fatalities" in "\n".join(source[161]),
        "hospital linkage gap discussed": "hospital" in method_text.lower(),
        "2024 not based on e-DAR data": "has not been prepared on the basis of e-" in "\n".join(source[162]) and "same consolidated police reporting" in "\n".join(source[162]),
    }
    if not all(method_checks.values()):
        raise ValueError(f"Methodology source check failed: {method_checks}")
    OUT.mkdir(exist_ok=True)
    with (OUT / "source-cell-audit.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=results[0].keys(), lineterminator="\n"); w.writeheader(); w.writerows(results)
    report = {"sourceFilesHashed": len(HASHES), "plottedCellsChecked": len(results) - 3,
              "totalCrossChecks": 3, "mismatches": sum(not r["match"] for r in results),
              "methodologySourceChecks": method_checks,
              "whoEstimate95Interval2021": [int(re.sub(r"\s", "", estimate.group(2))), int(re.sub(r"\s", "", estimate.group(3)))],
              "scope": "Every plotted observation in five story artifacts plus three partition totals; no claim of validating the full MoRTH report."}
    (OUT / "source-cell-audit.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if report["mismatches"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
