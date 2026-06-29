#!/usr/bin/env python3
"""Audit CPCB public repository file listings by raw-data frequency.

This does not download CSVs. It reuses the station list already snapshotted for
the CPCB repository audit and asks CPCB's public repository file-list endpoint
which raw files are listed for each station/frequency pair.
"""

from __future__ import annotations

import csv
import json
import ssl
import time
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "data/raw/cpcb_repository"
STATIONS = BASE / "metadata/stations.csv"
OUT = BASE / "coverage/cpcb_repository_raw_frequency_file_counts.csv"
META = BASE / "coverage/cpcb_repository_raw_frequency_file_counts_metadata.json"
CPCB_FILE_LIST_URL = "https://airquality.cpcb.gov.in/caaqms-common/dataRepository/file-path"
FREQUENCIES = ["15M", "1H", "8H", "1D"]


def request_json(payload: dict, retries: int = 4) -> dict:
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json", "User-Agent": "indica-cpcb-frequency-audit/1.0"}
    ctx = ssl._create_unverified_context()
    last: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(CPCB_FILE_LIST_URL, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=45, context=ctx) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(0.7 * (attempt + 1))
    raise RuntimeError(f"request failed: {payload}") from last


def list_station_frequency(station: dict, frequency: str) -> tuple[dict, list[dict]]:
    payload = {
        "station_id": station["station_id"],
        "station_name": station["station_name"],
        "state": "",
        "city": "",
        "frequency": frequency,
        "dataType": "raw",
    }
    response = request_json(payload)
    rows = response.get("data") or []
    if not isinstance(rows, list):
        rows = []
    years = sorted({str(row.get("year") or "") for row in rows if row.get("year")})
    return {
        "station_id": station["station_id"],
        "station_name": station["station_name"],
        "city": station.get("city", ""),
        "frequency": frequency,
        "listed_files": len(rows),
        "first_year": years[0] if years else "",
        "last_year": years[-1] if years else "",
        "status": response.get("status", ""),
    }, rows


def main() -> int:
    stations = list(csv.DictReader(STATIONS.open(newline="", encoding="utf-8")))
    started = time.time()
    rows: list[dict] = []
    errors: list[dict] = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {
            pool.submit(list_station_frequency, station, frequency): (station, frequency)
            for station in stations
            for frequency in FREQUENCIES
        }
        for idx, future in enumerate(as_completed(futures), start=1):
            station, frequency = futures[future]
            try:
                row, _ = future.result()
                rows.append(row)
            except Exception as exc:  # noqa: BLE001
                errors.append({
                    "station_id": station["station_id"],
                    "station_name": station["station_name"],
                    "frequency": frequency,
                    "error": str(exc),
                })
            if idx % 200 == 0 or idx == len(futures):
                print(f"{idx}/{len(futures)} station-frequency probes")

    rows.sort(key=lambda row: (row["frequency"], row["city"], row["station_name"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            "station_id", "station_name", "city", "frequency", "listed_files", "first_year", "last_year", "status"
        ])
        writer.writeheader()
        writer.writerows(rows)

    summary: dict[str, dict[str, int]] = defaultdict(lambda: {"stations_with_files": 0, "listed_files": 0})
    for row in rows:
        if int(row["listed_files"]) > 0:
            summary[row["frequency"]]["stations_with_files"] += 1
            summary[row["frequency"]]["listed_files"] += int(row["listed_files"])

    META.write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": CPCB_FILE_LIST_URL,
        "request_body_template": {
            "station_id": "<station_id>",
            "station_name": "<station_name>",
            "state": "",
            "city": "",
            "frequency": "<15M|1H|8H|1D>",
            "dataType": "raw",
        },
        "stations": len(stations),
        "frequencies": FREQUENCIES,
        "summary": summary,
        "errors": errors,
        "elapsed_seconds": round(time.time() - started, 1),
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(OUT.relative_to(ROOT))
    print(META.relative_to(ROOT))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
