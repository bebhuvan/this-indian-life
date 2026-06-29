#!/usr/bin/env python3
"""Spot-check CPCB raw repository downloads across public frequencies.

This is intentionally a narrow reproducibility check, not a completeness audit.
It verifies that the public raw repository download endpoint can return parsed
CSV files below daily frequency for one station-year.
"""

from __future__ import annotations

import csv
import json
import ssl
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_CSV = ROOT / "data/raw/cpcb_repository/coverage/cpcb_repository_subdaily_download_spotcheck.csv"
OUT_META = ROOT / "data/raw/cpcb_repository/coverage/cpcb_repository_subdaily_download_spotcheck_metadata.json"
CPCB_DOWNLOAD_URL = "https://airquality.cpcb.gov.in/caaqms-common/dataRepository/download-excel-file"
STATION = {
    "station_id": "site_307",
    "station_name": "Sanjay Palace, Agra - UPPCB",
    "year": "2025",
}
FILES = {
    "15M": "/Raw_data/15Min/2025/site_307_Sanjay_Palace_Agra_UPPCB_15Min.csv",
    "1H": "/Raw_data/1Hr/2025/site_307_Sanjay_Palace_Agra_UPPCB_1Hr.csv",
    "8H": "/Raw_data/8Hrs/2025/site_307_Sanjay_Palace_Agra_UPPCB_8Hrs.csv",
    "1D": "/Raw_data/1Day/2025/site_307_Sanjay_Palace_Agra_UPPCB_1Day.csv",
}
MISSING = {"", "na", "nan", "none", "null", "-", "--"}


def is_present(value: str | None) -> bool:
    return (value or "").strip().lower() not in MISSING


def download_text(filepath: str) -> str:
    url = CPCB_DOWNLOAD_URL + "?" + urllib.parse.urlencode({"file_name": filepath})
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers={"User-Agent": "indica-cpcb-subdaily-spotcheck/1.0"})
    with urllib.request.urlopen(req, timeout=120, context=ctx) as response:
        return response.read().decode("utf-8-sig")


def summarize_csv(frequency: str, filepath: str, text: str) -> dict:
    rows = 0
    pm25 = 0
    pm10 = 0
    first_timestamp = ""
    last_timestamp = ""
    reader = csv.DictReader(text.splitlines())
    for record in reader:
        rows += 1
        timestamp = (record.get("Timestamp") or "").strip()
        if timestamp and not first_timestamp:
            first_timestamp = timestamp
        if timestamp:
            last_timestamp = timestamp
        if is_present(record.get("PM2.5 (µg/m³)")):
            pm25 += 1
        if is_present(record.get("PM10 (µg/m³)")):
            pm10 += 1
    return {
        **STATION,
        "frequency": frequency,
        "source_filepath": filepath,
        "bytes": len(text.encode("utf-8")),
        "rows": rows,
        "first_timestamp": first_timestamp,
        "last_timestamp": last_timestamp,
        "pm25_non_missing_rows": pm25,
        "pm10_non_missing_rows": pm10,
    }


def main() -> int:
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    rows = [summarize_csv(freq, path, download_text(path)) for freq, path in FILES.items()]
    with OUT_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    OUT_META.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "source": CPCB_DOWNLOAD_URL,
                "station": STATION,
                "note": "Spot-check only. This does not validate completeness across all sub-daily files.",
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(OUT_CSV.relative_to(ROOT))
    print(OUT_META.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
