#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import JavascriptException, TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options


SOURCE_ID = "upag-dash"
REPORT_REGISTRY_URL = "https://api-prd.upag.gov.in/v1/upagapi/authorize/getdynamicjson?tabnames=REPORTS"
DASH_BASE_URL = "https://dash.upag.gov.in"

REPORTS = [
    {
        "slug": "allindiaapy",
        "grid_key": "aiapygridOptions",
        "indicator_id": "agriculture.upag.all_india_crop_apy",
        "artifact_name": "upag.IN.agriculture.all_india_crop_apy_dash",
        "title": "UPAg all-India crop-wise area, production and yield",
        "unit": "area: Lakh Ha; production: Lakh Tonnes; yield: Kg/Ha",
        "geography": {"type": "country", "id": "IN", "name": "India"},
    },
    {
        "slug": "statewiseapy",
        "grid_key": "swapygridOptions",
        "indicator_id": "agriculture.upag.statewise_crop_apy_recent",
        "artifact_name": "upag.IN.agriculture.statewise_crop_apy_recent_dash",
        "title": "UPAg state-wise crop area, production and yield",
        "unit": "area: Lakh Ha; production: Lakh Tonnes; yield: Kg/Ha",
        "geography": {"type": "admin1", "id": "IN", "name": "India states and union territories"},
    },
    {
        "slug": "fiveyearapy",
        "grid_key": "fyostabsgridOptions",
        "indicator_id": "agriculture.upag.five_year_apy",
        "artifact_name": "upag.IN.agriculture.five_year_apy_dash",
        "title": "UPAg five-year crop area, production and yield",
        "unit": "source table units",
        "geography": {"type": "country", "id": "IN", "name": "India"},
    },
    {
        "slug": "normalestimates",
        "grid_key": "nefrtabsgridOptions",
        "indicator_id": "agriculture.upag.normal_apy",
        "artifact_name": "upag.IN.agriculture.normal_apy_dash",
        "title": "UPAg normal crop area, production and yield",
        "unit": "source table units",
        "geography": {"type": "country", "id": "IN", "name": "India"},
    },
    {
        "slug": "stateprofile",
        "grid_key": "spgridOptions",
        "indicator_id": "agriculture.upag.state_profile_crop_apy",
        "artifact_name": "upag.IN.agriculture.state_profile_crop_apy_dash",
        "title": "UPAg state profile crop area, production and yield",
        "unit": "source table units",
        "geography": {"type": "admin1", "id": "IN", "name": "India states and union territories"},
    },
    {
        "slug": "domesticinternationalproduction",
        "grid_key": "daipgridOptions",
        "indicator_id": "agriculture.upag.domestic_international_production",
        "artifact_name": "upag.IN.agriculture.domestic_international_production_dash",
        "title": "UPAg domestic and international crop production",
        "unit": "source table units",
        "geography": {"type": "multi-country", "id": "GLOBAL", "name": "Global and India"},
    },
    {
        "slug": "progressivecropareasown",
        "grid_key": "pcasgridOptions",
        "indicator_id": "agriculture.upag.progressive_crop_area_sown",
        "artifact_name": "upag.IN.agriculture.progressive_crop_area_sown_dash",
        "title": "UPAg progressive crop area sown",
        "unit": "source table units",
        "geography": {"type": "country", "id": "IN", "name": "India"},
    },
]


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False)


def hash_value(value):
    return hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()


def source_slug(value):
    return re.sub(r"[^A-Za-z0-9_.@-]+", "_", str(value))


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(stable_json(payload) + "\n", encoding="utf-8")


def write_snapshot(source_id, name, payload):
    digest = hash_value(payload)
    path = Path("data") / "snapshots" / source_id / f"{source_slug(name)}.{digest[:12]}.json"
    write_json(path, payload)
    return {"path": str(path), "hash": digest}


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Indica research data ingester"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize_key(key):
    key = str(key).strip().replace("&", "and")
    key = re.sub(r"[^0-9A-Za-z]+", "_", key)
    key = re.sub(r"_+", "_", key).strip("_").lower()
    return key or "value"


def normalize_value(value):
    if isinstance(value, dict):
        return {normalize_key(k): normalize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [normalize_value(v) for v in value]
    return value


def normalize_rows(rows):
    normalized = []
    for row in rows:
        normalized.append({normalize_key(k): normalize_value(v) for k, v in row.items()})
    return normalized


def year_start_from_crop_year(value):
    match = re.match(r"^(\d{4})", str(value or ""))
    return int(match.group(1)) if match else None


def summarize_rows(rows):
    year_values = sorted(
        {
            year
            for row in rows
            for year in [year_start_from_crop_year(row.get("crop_year") or row.get("Crop Year") or row.get("year") or row.get("Year"))]
            if year is not None
        }
    )
    crops = sorted({str(row.get("crop") or row.get("Crop") or row.get("cropname")) for row in rows if row.get("crop") or row.get("Crop") or row.get("cropname")})
    states = sorted({str(row.get("state") or row.get("State") or row.get("statename")) for row in rows if row.get("state") or row.get("State") or row.get("statename")})
    return {
        "rows": len(rows),
        "earliestYearStart": year_values[0] if year_values else None,
        "latestYearStart": year_values[-1] if year_values else None,
        "yearCount": len(year_values),
        "cropCount": len(crops),
        "stateCount": len(states),
    }


def chrome_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1600,1200")
    return webdriver.Chrome(options=options)


def extract_grid_rows(driver, slug, grid_key, wait_seconds):
    url = f"{DASH_BASE_URL}/{slug}"
    driver.get(url)
    deadline = time.time() + wait_seconds
    last_state = None
    script = """
      const key = arguments[0];
      const grid = window[key];
      const result = {ready: Boolean(grid && grid.api), rows: [], displayed: null, error: null};
      if (!result.ready) return result;
      try {
        result.displayed = grid.api.getDisplayedRowCount ? grid.api.getDisplayedRowCount() : null;
        grid.api.forEachNode(node => { if (node && node.data) result.rows.push(node.data); });
      } catch (error) {
        result.error = String(error);
      }
      return result;
    """

    while time.time() < deadline:
        try:
            state = driver.execute_script(script, grid_key)
            last_state = state
            if state.get("ready") and len(state.get("rows") or []) > 0:
                return url, state
        except JavascriptException as error:
            last_state = {"ready": False, "rows": [], "error": str(error)}
        time.sleep(1)

    return url, last_state or {"ready": False, "rows": [], "error": "timed out before grid initialized"}


def create_artifact(config, source_url, fetched_at, rows, raw_rows, row_hash):
    dimensions = list(rows[0].keys()) if rows else []
    summary = summarize_rows(rows)
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": config["indicator_id"],
        "title": config["title"],
        "sourceId": SOURCE_ID,
        "sourceIndicatorId": f"dash.{config['slug']}.{config['grid_key']}",
        "sourceUrl": source_url,
        "unit": config["unit"],
        "geography": config["geography"],
        "dimensions": dimensions,
        "fetchedAt": fetched_at,
        "rows": rows,
        "metadata": {
            "publisher": "Unified Portal for Agricultural Statistics (UPAg), Department of Agriculture and Farmers Welfare, Government of India",
            "reportRegistryUrl": REPORT_REGISTRY_URL,
            "dashReportSlug": config["slug"],
            "gridKey": config["grid_key"],
            "rawRowsHash": row_hash,
            "rawDimensions": list(raw_rows[0].keys()) if raw_rows else [],
            "note": "Rows extracted from the public UPAg Dash/AG Grid report. The website's CSV button exports the same browser-loaded grid data client-side.",
            **summary,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Ingest public UPAg Dash APY report grids.")
    parser.add_argument("--reports", default=",".join(report["slug"] for report in REPORTS), help="Comma-separated report slugs to ingest.")
    parser.add_argument("--wait-seconds", type=int, default=30)
    args = parser.parse_args()

    selected = {slug.strip() for slug in args.reports.split(",") if slug.strip()}
    reports = [report for report in REPORTS if report["slug"] in selected]
    unknown = selected - {report["slug"] for report in REPORTS}
    if unknown:
        raise SystemExit(f"Unknown report slug(s): {', '.join(sorted(unknown))}")

    fetched_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    manifest = []

    try:
        registry = fetch_json(REPORT_REGISTRY_URL)
        registry_snapshot = write_snapshot(SOURCE_ID, "upag-reports-registry", registry)
    except Exception as error:
        registry_snapshot = {"path": None, "hash": None, "error": str(error)}

    driver = None
    try:
        driver = chrome_driver()
        driver.set_page_load_timeout(60)

        for config in reports:
            try:
                source_url, state = extract_grid_rows(driver, config["slug"], config["grid_key"], args.wait_seconds)
                raw_rows = state.get("rows") or []
                if not raw_rows:
                    raise RuntimeError(state.get("error") or "grid loaded no rows")

                normalized_rows = normalize_rows(raw_rows)
                raw_hash = hash_value(raw_rows)
                raw_snapshot = write_snapshot(SOURCE_ID, f"{config['slug']}-{config['grid_key']}-raw-rows", raw_rows)
                artifact = create_artifact(config, source_url, fetched_at, normalized_rows, raw_rows, raw_hash)

                artifact_path = Path("data") / "series" / f"{source_slug(config['artifact_name'])}.json"
                write_json(artifact_path, artifact)
                summary = summarize_rows(normalized_rows)

                manifest.append(
                    {
                        "status": "ready",
                        "indicatorId": config["indicator_id"],
                        "sourceIndicatorId": f"dash.{config['slug']}.{config['grid_key']}",
                        "artifact": str(artifact_path),
                        "sourceUrl": source_url,
                        "registrySnapshot": registry_snapshot.get("path"),
                        "rawRowsSnapshot": raw_snapshot["path"],
                        "rawHash": raw_hash,
                        "gridKey": config["grid_key"],
                        "fetchedAt": fetched_at,
                        **summary,
                    }
                )
                print(
                    f"upag {config['slug']} {summary['rows']} rows "
                    f"({summary['earliestYearStart']}-{summary['latestYearStart']})"
                )
            except Exception as error:
                manifest.append(
                    {
                        "status": "failed",
                        "indicatorId": config["indicator_id"],
                        "sourceIndicatorId": f"dash.{config['slug']}.{config['grid_key']}",
                        "sourceUrl": f"{DASH_BASE_URL}/{config['slug']}",
                        "gridKey": config["grid_key"],
                        "fetchedAt": fetched_at,
                        "error": str(error),
                    }
                )
                print(f"upag {config['slug']} failed: {error}", file=sys.stderr)
    finally:
        if driver:
            driver.quit()

    write_json(Path("data") / "catalog" / "upag-dash-apy-manifest.json", manifest)

    failures = [entry for entry in manifest if entry["status"] != "ready"]
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    try:
        main()
    except (TimeoutException, WebDriverException) as error:
        print(f"upag dash APY ingest failed: {error}", file=sys.stderr)
        raise SystemExit(1)
