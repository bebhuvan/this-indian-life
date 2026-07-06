#!/usr/bin/env python3
"""
Download CPCB repository raw daily files and audit usable pollutant coverage.

The station name/id index comes from OAQ's CPCB latest snapshot. The raw data
files come directly from CPCB's public data repository endpoints.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path


CPCB_FILE_LIST_URL = "https://airquality.cpcb.gov.in/caaqms-common/dataRepository/file-path"
CPCB_DOWNLOAD_URL = "https://airquality.cpcb.gov.in/caaqms-common/dataRepository/download-excel-file"
OAQ_BROKER_URL = "https://us-central1-oaqdms.cloudfunctions.net/brokerData"
OAQ_PROVIDER = "cpcb"
MISSING = {"", "na", "nan", "none", "null", "-", "--"}
POLLUTANT_COLUMNS = [
    "PM2.5 (µg/m³)",
    "PM10 (µg/m³)",
    "NO (µg/m³)",
    "NO2 (µg/m³)",
    "NOx (ppb)",
    "NH3 (µg/m³)",
    "SO2 (µg/m³)",
    "CO (mg/m³)",
    "Ozone (µg/m³)",
]


def request_json(url: str, *, method: str = "GET", payload: dict | None = None, retries: int = 4) -> dict:
    data = None
    headers = {"User-Agent": "indica-cpcb-audit/1.0"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    ctx = ssl._create_unverified_context()
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as exc:  # noqa: BLE001 - retry network and transient server errors.
            last_error = exc
            time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"request failed after {retries} tries: {url}") from last_error


def download_file(url: str, path: Path, retries: int = 4) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    ctx = ssl._create_unverified_context()
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "indica-cpcb-audit/1.0"})
            with urllib.request.urlopen(req, timeout=120, context=ctx) as resp, tmp.open("wb") as out:
                out.write(resp.read())
            tmp.replace(path)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if tmp.exists():
                tmp.unlink()
            time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"download failed after {retries} tries: {url}") from last_error


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return re.sub(r"_+", "_", value).strip("_")[:96] or "station"


def signed_oaq_url(path: str, token: str) -> str:
    broker = OAQ_BROKER_URL + "?" + urllib.parse.urlencode({"action": "api_session", "token": token})
    session = request_json(broker)
    return session["baseUrl"] + path + "?" + session["signature"]


def load_oaq_stations(out_dir: Path, token: str) -> list[dict]:
    meta_dir = out_dir / "metadata"
    meta_dir.mkdir(parents=True, exist_ok=True)

    latest_url = signed_oaq_url(f"provider={OAQ_PROVIDER}/live/global/all_stations_latest.json", token)
    latest = request_json(latest_url)
    (meta_dir / "oaq_cpcb_latest.json").write_text(json.dumps(latest, ensure_ascii=False, indent=2), encoding="utf-8")

    hierarchy_url = signed_oaq_url(f"provider={OAQ_PROVIDER}/meta/hierarchy.json", token)
    hierarchy = request_json(hierarchy_url)
    (meta_dir / "oaq_cpcb_hierarchy.json").write_text(
        json.dumps(hierarchy, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    seen: set[str] = set()
    stations: list[dict] = []
    for station in latest.get("stations", []):
        station_id = str(station.get("id") or "").strip()
        name = str(station.get("name") or "").strip()
        if not station_id or not name or station_id in seen:
            continue
        seen.add(station_id)
        stations.append(
            {
                "station_id": f"site_{station_id}" if not station_id.startswith("site_") else station_id,
                "oaq_id": station_id,
                "station_name": name,
                "city": station.get("city") or "",
                "lat": station.get("lat"),
                "lon": station.get("lon"),
                "type": station.get("type") or "",
                "last_seen": station.get("last_seen") or "",
            }
        )
    stations.sort(key=lambda row: (row["city"], row["station_name"], row["station_id"]))
    write_csv(meta_dir / "stations.csv", stations)
    return stations


def repository_file_list(station: dict, api_frequency: str) -> list[dict]:
    payload = {
        "station_id": station["station_id"],
        "station_name": station["station_name"],
        "state": "",
        "city": "",
        "frequency": api_frequency,
        "dataType": "raw",
    }
    response = request_json(CPCB_FILE_LIST_URL, method="POST", payload=payload)
    rows = response.get("data") or []
    if not isinstance(rows, list):
        return []
    return rows


def download_url(filepath: str) -> str:
    return CPCB_DOWNLOAD_URL + "?" + urllib.parse.urlencode({"file_name": filepath})


def local_raw_path(out_dir: Path, station: dict, year: str, filepath: str, folder_frequency: str) -> Path:
    suffix = Path(filepath).suffix or ".csv"
    station_dir = f"{station['station_id']}__{slugify(station['station_name'])}"
    return out_dir / "raw" / f"raw_{folder_frequency}" / station_dir / f"{year}{suffix}"


def is_present(value: str | None) -> bool:
    return (value or "").strip().lower() not in MISSING


def audit_csv(path: Path, station: dict, year: str, source_filepath: str) -> dict:
    row = {
        "station_id": station["station_id"],
        "oaq_id": station["oaq_id"],
        "station_name": station["station_name"],
        "city": station["city"],
        "year": year,
        "source_filepath": source_filepath,
        "local_path": str(path),
        "file_bytes": path.stat().st_size if path.exists() else 0,
        "rows": 0,
        "first_timestamp": "",
        "last_timestamp": "",
    }
    for col in POLLUTANT_COLUMNS:
        row[f"{safe_col(col)}_days"] = 0

    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for record in reader:
                ts = (record.get("Timestamp") or "").strip()
                if ts:
                    if not row["first_timestamp"]:
                        row["first_timestamp"] = ts
                    row["last_timestamp"] = ts
                row["rows"] += 1
                for col in POLLUTANT_COLUMNS:
                    if is_present(record.get(col)):
                        row[f"{safe_col(col)}_days"] += 1
    except UnicodeDecodeError:
        row["parse_error"] = "unicode_decode_error"
    except csv.Error as exc:
        row["parse_error"] = str(exc)
    return row


def safe_col(col: str) -> str:
    key = col.lower().replace("µ", "u")
    key = re.sub(r"[^a-z0-9]+", "_", key)
    return key.strip("_")


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fields: list[str] = []
    for row in rows:
        for key in row:
            if key not in fields:
                fields.append(key)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def station_summary(coverage_rows: list[dict], stations: list[dict]) -> list[dict]:
    pm25_key = f"{safe_col('PM2.5 (µg/m³)')}_days"
    pm10_key = f"{safe_col('PM10 (µg/m³)')}_days"
    by_station: dict[str, list[dict]] = {}
    for row in coverage_rows:
        by_station.setdefault(row["station_id"], []).append(row)

    summaries = []
    station_by_id = {station["station_id"]: station for station in stations}
    for station_id, station in station_by_id.items():
        rows = by_station.get(station_id, [])
        usable_pm25_years = [int(row["year"]) for row in rows if int(row.get(pm25_key, 0)) > 0]
        usable_pm10_years = [int(row["year"]) for row in rows if int(row.get(pm10_key, 0)) > 0]
        summaries.append(
            {
                "station_id": station_id,
                "oaq_id": station["oaq_id"],
                "station_name": station["station_name"],
                "city": station["city"],
                "repository_years_listed": len(rows),
                "first_listed_year": min([int(row["year"]) for row in rows], default=""),
                "last_listed_year": max([int(row["year"]) for row in rows], default=""),
                "pm25_usable_years": len(usable_pm25_years),
                "pm25_first_usable_year": min(usable_pm25_years, default=""),
                "pm25_last_usable_year": max(usable_pm25_years, default=""),
                "pm25_total_days": sum(int(row.get(pm25_key, 0)) for row in rows),
                "pm10_usable_years": len(usable_pm10_years),
                "pm10_first_usable_year": min(usable_pm10_years, default=""),
                "pm10_last_usable_year": max(usable_pm10_years, default=""),
                "pm10_total_days": sum(int(row.get(pm10_key, 0)) for row in rows),
            }
        )
    summaries.sort(key=lambda row: (-row["pm25_total_days"], row["city"], row["station_name"]))
    return summaries


def process_station(
    station: dict,
    out_dir: Path,
    api_frequency: str,
    folder_frequency: str,
    download: bool,
) -> tuple[list[dict], list[dict], dict]:
    file_rows: list[dict] = []
    coverage_rows: list[dict] = []
    error: dict = {}
    try:
        files = repository_file_list(station, api_frequency)
    except Exception as exc:  # noqa: BLE001
        return [], [], {"station_id": station["station_id"], "station_name": station["station_name"], "error": str(exc)}

    for item in files:
        filepath = item.get("filepath") or ""
        year = str(item.get("year") or item.get("month") or "").strip()
        if not filepath or not year:
            continue
        local_path = local_raw_path(out_dir, station, year, filepath, folder_frequency)
        file_row = {
            **station,
            "frequency": api_frequency,
            "year": year,
            "source_filepath": filepath,
            "local_path": str(local_path),
        }
        file_rows.append(file_row)
        if download and (not local_path.exists() or local_path.stat().st_size == 0):
            download_file(download_url(filepath), local_path)
        if local_path.exists() and local_path.suffix.lower() == ".csv":
            coverage_rows.append(audit_csv(local_path, station, year, filepath))
    return file_rows, coverage_rows, error


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="data/raw/cpcb_repository")
    parser.add_argument("--frequency", default="1Day", choices=["1Day", "1Hr", "1D", "1H"])
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--max-stations", type=int, default=0)
    parser.add_argument("--skip-download", action="store_true")
    args = parser.parse_args()

    token = os.environ.get("OAQ_API_KEY")
    if not token:
        print("Set OAQ_API_KEY before running this script.", file=sys.stderr)
        return 2

    api_frequency = {"1Day": "1D", "1Hr": "1H"}.get(args.frequency, args.frequency)
    folder_frequency = {"1D": "1Day", "1H": "1Hr"}.get(api_frequency, api_frequency)
    out_dir = Path(args.out)
    coverage_dir = out_dir / "coverage"
    manifest_dir = out_dir / "manifests"
    out_dir.mkdir(parents=True, exist_ok=True)

    stations = load_oaq_stations(out_dir, token)
    if args.max_stations:
        stations = stations[: args.max_stations]

    all_files: list[dict] = []
    all_coverage: list[dict] = []
    errors: list[dict] = []
    started = time.time()
    print(f"Stations: {len(stations)}")

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [
            pool.submit(process_station, station, out_dir, api_frequency, folder_frequency, not args.skip_download)
            for station in stations
        ]
        for idx, future in enumerate(as_completed(futures), start=1):
            file_rows, coverage_rows, error = future.result()
            all_files.extend(file_rows)
            all_coverage.extend(coverage_rows)
            if error:
                errors.append(error)
            if idx % 25 == 0 or idx == len(futures):
                print(
                    f"{idx}/{len(futures)} stations, "
                    f"{len(all_files)} listed files, {len(all_coverage)} audited CSVs"
                )

    all_files.sort(key=lambda row: (row["city"], row["station_name"], row["year"]))
    all_coverage.sort(key=lambda row: (row["city"], row["station_name"], row["year"]))
    summaries = station_summary(all_coverage, stations)

    write_csv(manifest_dir / f"cpcb_repository_raw_{folder_frequency}_file_paths.csv", all_files)
    write_csv(coverage_dir / f"cpcb_repository_raw_{folder_frequency}_station_year_coverage.csv", all_coverage)
    write_csv(coverage_dir / f"cpcb_repository_raw_{folder_frequency}_station_summary.csv", summaries)
    (coverage_dir / "run_metadata.json").write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "api_frequency": api_frequency,
                "folder_frequency": folder_frequency,
                "stations": len(stations),
                "listed_files": len(all_files),
                "audited_csvs": len(all_coverage),
                "errors": errors,
                "elapsed_seconds": round(time.time() - started, 1),
                "source": {
                    "station_metadata": "OAQ provider=cpcb latest + hierarchy",
                    "repository_file_list": CPCB_FILE_LIST_URL,
                    "repository_download": CPCB_DOWNLOAD_URL,
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
