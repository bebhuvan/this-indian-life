#!/usr/bin/env python3
"""Verify frozen source receipts against a separate live RBI retrieval, offline.

Keep row multiplicity; disregard ordering and response transaction IDs only.
Extra live observations are reported, never silently substituted into the story.
"""
import collections
import argparse
import csv
import datetime as dt
import gzip
import hashlib
import html
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BUNDLE = ROOT / "data/raw/rbi-dbie-lrs-confirmation-20261030"
OUT = ROOT / "data/audits/lrs-controls/live-source-confirmation.json"


def payload(path):
    data = path.read_bytes()
    return gzip.decompress(data) if data.startswith(b"\x1f\x8b") else data


def csv_rows(path):
    return list(csv.DictReader(io.StringIO(payload(path).decode("utf-8-sig")), delimiter=";"))


def canonical(rows):
    return collections.Counter(json.dumps(r, sort_keys=True, separators=(",", ":")) for r in rows)


def cas_rows(path):
    data = json.loads(html.unescape(payload(path).decode("utf-8-sig")).replace("\xa0", " "))
    assert data["header"]["status"].lower() == "success", str(path)
    rows = [r for block in data["body"]["result"] for r in block["data"]["result"]]
    assert rows, str(path)
    return rows


def source_key(row):
    codes = {k[:-5]: str(v).strip() for k, v in row.items() if k.endswith("_code")}
    series = "|".join(f"{k}={v}" for k, v in sorted(codes.items()))
    time = row["Time"]
    date = (dt.datetime.fromtimestamp(time / 1000, dt.timezone(dt.timedelta(hours=5, minutes=30))).date()
            if isinstance(time, (float, int)) else dt.datetime.strptime(time, "%d-%b-%Y").date())
    return series, date.isoformat()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, default=BUNDLE)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    bundle = args.bundle.resolve()
    manifest = json.loads((bundle / "manifest.json").read_text())
    for entry in manifest["files"]:
        data = (bundle / entry["path"]).read_bytes()
        assert len(data) == entry["bytes"] and hashlib.sha256(data).hexdigest() == entry["sha256"], entry["path"]
    comparisons = []
    cas_sources = {}
    for entry in manifest["comparisons"]:
        old = ROOT / entry["frozenPath"] if entry["kind"] == "webi" else bundle / entry["frozenPath"]
        live = bundle / entry["livePath"]
        reader = csv_rows if entry["kind"] == "webi" else cas_rows
        a, b = reader(old), reader(live)
        if entry["kind"] == "webi":
            rid = entry["id"].split()[-1]
            receipt = json.loads((bundle / f"report-{rid}-receipt.json").read_text())
            provider = receipt["providers"][0]
            assert provider["isPartial"] == "false" and int(provider["rowCount"]) == len(b)
        ca, cb = canonical(a), canonical(b)
        missing, added = ca - cb, cb - ca
        assert not missing, f"Changed/missing source observations: {entry['id']}"
        if entry["kind"] == "webi":
            assert not added, f"Unexpected Webi revision: {entry['id']}"
        else:
            old_keys = {source_key(row) for row in a}
            live_keys = [source_key(row) for row in b]
            assert len(live_keys) == len(set(live_keys)), f"Duplicate/conflicting live CAS key: {entry['id']}"
            for extra in added:
                assert source_key(json.loads(extra)) not in old_keys, f"Revision to existing CAS key: {entry['id']}"
            index = {}
            for row in a:
                key = source_key(row)
                if key in index:
                    assert canonical([row]) == canonical([index[key]]), f"Conflicting CAS duplicate: {key}"
                index[key] = row
            cas_sources[entry["originalArtifactId"]] = index
        comparisons.append({"id": entry["id"], "kind": entry["kind"], "frozenRows": len(a), "liveRows": len(b),
                            "missingOrChangedRows": sum(missing.values()), "additionalLiveRows": sum(added.values()),
                            "sameRowMultiset": ca == cb})

    # Audit the warehouse-derived CSV against its original RBI response, not just itself.
    checked = 0
    non_labels = {"ELEMENT", "OG_VALUE", "VALUE", "Time", "TimeNew", "time_month", "Year", "NewYear", "Unit"}
    with (ROOT / "data/raw/rbi-dbie-lrs-2026/rbi_dbie_cas_external_sector_202610.csv").open() as f:
        for line, row in enumerate(csv.DictReader(f), 2):
            raw = cas_sources[row["source_artifact_id"]][(row["series_key"], row["observation_date"])]
            assert float(row["value"]) == float(raw.get("OG_VALUE", raw["VALUE"])), f"CAS CSV value at row {line}"
            labels = [str(raw[k]).strip() for k in sorted(raw) if k not in non_labels
                      and not k.endswith(("_code", "_path")) and "hierarchy" not in k and raw[k] is not None]
            assert row["series_label"] == " / ".join(v for v in labels if v), f"CAS CSV label at row {line}"
            assert row["unit_label"] == str(raw["Unit"]).strip(), f"CAS CSV unit at row {line}"
            assert row["dsd_code"] in raw["ELEMENT"], f"CAS CSV dataset at row {line}"
            checked += 1

    annual = csv_rows(ROOT / "data/raw/rbi-dbie-lrs-2026/rbi_dbie_report_752_lrs_annual_200809_202425.csv_gz")
    years = collections.defaultdict(dict)
    for line, row in enumerate(annual, 2):
        if row["Unit Description"] == "ACTUALS":
            years[row["Time Fis Year"].strip()][int(row["Remittance Display Order"])] = (line, float(row["Amount (in USD Million)"] or 0) / 1e6)
    footings = []
    for year, rows in sorted(years.items()):
        components = [rows[k] for k in [2, 3, 4, 5, 6, 7, 13, 14, 15, 16] if k in rows]
        total = rows[1][1]
        part_sum = sum(v for _, v in components)
        footings.append({"financialYear": year, "headlineCsvRow": rows[1][0], "headlineUSDm": total,
                         "componentCsvRows": [i for i, _ in components], "componentSumUSDm": round(part_sum, 8),
                         "differenceUSDm": round(total - part_sum, 8)})
    result = {"status": "pass", "source": "RBI public guest-session exports and CAS responses; retrieval dates retained in the raw manifest",
              "rawManifest": str(bundle / "manifest.json"), "manifestFilesChecked": len(manifest["files"]),
              "comparisons": comparisons, "warehouseCsvObservationsChecked": checked, "annualCrossFootings": footings,
              "authorityRule": "Use monthly headline observations consistently. Preserve annual source cells; do not replace their values or force purpose components to equal them.",
              "limits": "A fresh source confirmation does not establish the cause of RBI's historical annual-headline discrepancy. Additional live rows do not change the frozen article vintage."}
    report = args.report or (OUT if bundle == BUNDLE.resolve() else bundle / "live-source-confirmation.json")
    report.write_text(json.dumps(result, indent=2) + "\n")
    print(f"Live source confirmation: {len(comparisons)} response comparisons; {checked} CAS CSV observations; no changed/missing frozen rows.")


if __name__ == "__main__":
    main()
