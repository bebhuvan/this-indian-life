#!/usr/bin/env python3
"""Scrape public SIAM domestic-sales data.

SIAM exposes older domestic-sales trend data as a styled <ul> grid, not an HTML
table. Recent monthly/FY numbers are published inside press-release prose. This
script captures both surfaces without filling gaps that the public pages do not
actually expose.
"""
from __future__ import annotations

import csv
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


BASE = "https://www.siam.in"
TREND_URL = f"{BASE}/statistics.aspx?mpgid=8&pgidtrail=14"
LATEST_FY_URL = f"{BASE}/news-%26-updates/press-releases/auto-industry-performance-of-q4-jan--march-2026-fy-2025-26/605"
SOURCE_ID = "siam"
OUT_DIR = Path("SIAM")
TABLES_DIR = OUT_DIR / "tables"
SNAP_DIR = Path("data/snapshots/siam")
SERIES_DIR = Path("data/series")

CATEGORY_SLUGS = {
    "Passenger Vehicles": "passenger_vehicles",
    "Commercial Vehicles": "commercial_vehicles",
    "Three Wheelers": "three_wheelers",
    "Two Wheelers": "two_wheelers",
    "Grand Total": "total",
}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def stable_json(value) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=False) + "\n"


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(stable_json(value), encoding="utf-8")


def snapshot(name: str, body: bytes, extension: str = "html") -> dict[str, str]:
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(body).hexdigest()
    path = SNAP_DIR / f"{name}.{digest[:12]}.{extension}"
    path.write_bytes(body)
    return {"path": str(path), "hash": digest}


def fetch(url: str) -> tuple[str, dict[str, str]]:
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=45)
    response.raise_for_status()
    name = re.sub(r"[^A-Za-z0-9]+", "_", url.replace(BASE, "")).strip("_") or "home"
    return response.text, snapshot(name, response.content)


def parse_int(text: str) -> int:
    cleaned = re.sub(r"[^\d-]", "", text)
    if not cleaned:
        raise ValueError(f"not a number: {text!r}")
    return int(cleaned)


def parse_trend_page(html: str, fetched_at: str, snap: dict[str, str]) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    root = soup.find(id="ContentPlaceHolder1_lbldetails")
    if root is None:
        raise RuntimeError("SIAM trend page did not contain ContentPlaceHolder1_lbldetails")
    grid = root.select_one("ul.automobile_grid")
    if grid is None:
        raise RuntimeError("SIAM trend page did not contain automobile_grid")

    rows = []
    years: list[str] = []
    for index, item in enumerate(grid.find_all("li", recursive=False)):
        cells = [cell.get_text(" ", strip=True) for cell in item.select("ul.horrizontal_li > li")]
        if not cells:
            continue
        if index == 0:
            years = cells[1:]
            continue
        category = cells[0]
        for year, value in zip(years, cells[1:]):
            rows.append({
                "financialYear": year,
                "category": category,
                "value": parse_int(value),
            })
    return {
        "sourceId": SOURCE_ID,
        "sourceUrl": TREND_URL,
        "fetchedAt": fetched_at,
        "snapshot": snap,
        "title": "Automobile Domestic Sales Trends",
        "note": "Parsed from SIAM's public styled list grid. The current page exposes 2008-09 through 2013-14 only.",
        "rows": rows,
    }


def normalise_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    return re.sub(r"\s+", " ", text)


def parse_latest_fy_release(html: str, fetched_at: str, snap: dict[str, str]) -> dict:
    text = normalise_text(html)
    fy_match = re.search(r"Financial Year Performance:\s*FY-?([0-9]{4}-[0-9]{2})", text, re.I)
    financial_year = fy_match.group(1) if fy_match else "2025-26"
    release_date = None
    date_match = re.search(r"(\d{2}/\d{2}/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})", text)
    if date_match:
        release_date = date_match.group(1)

    section_match = re.search(
        r"Financial Year Performance:.*?Domestic Sales:\s*(.*?)\s*(?:3BMW|Commenting on sales data)",
        text,
        re.I,
    )
    section = section_match.group(1) if section_match else text
    rows = []
    patterns = [
        ("Passenger Vehicles", r"Passenger Vehicles?\d*\s+sales were\s+([0-9,]+)\s+units"),
        ("Commercial Vehicles", r"Commercial Vehicles?\d*\s+sales were\s+([0-9,]+)\s+units"),
        ("Three Wheelers", r"Three-?wheeler sales were\s+([0-9,]+)\s+units"),
        ("Two Wheelers", r"Two-?wheeler sales were\s+([0-9,]+)\s+units"),
    ]
    for category, pattern in patterns:
        match = re.search(pattern, section, re.I)
        if match:
            rows.append({
                "financialYear": financial_year,
                "category": category,
                "value": parse_int(match.group(1)),
            })
    if rows:
        rows.append({
            "financialYear": financial_year,
            "category": "Grand Total",
            "value": sum(row["value"] for row in rows),
        })
    return {
        "sourceId": SOURCE_ID,
        "sourceUrl": LATEST_FY_URL,
        "fetchedAt": fetched_at,
        "snapshot": snap,
        "releaseDate": release_date,
        "title": "Auto Industry Performance of Q4 (Jan-March 2026) & FY 2025-26",
        "note": "Parsed from SIAM press-release prose. Category footnotes in the release say BMW, Mercedes, JLR & Volvo Auto passenger-vehicle data are not available, and Daimler commercial-vehicle data is not available.",
        "rows": rows,
    }


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["financialYear", "category", "value"], lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def fy_end_date(financial_year: str) -> str:
    start = int(financial_year.split("-", 1)[0])
    return f"{start + 1:04d}-03-31"


def write_series(rows: list[dict], fetched_at: str) -> list[dict]:
    manifest = []
    by_category: dict[str, list[dict]] = {}
    for row in rows:
        by_category.setdefault(row["category"], []).append(row)
    for category, category_rows in by_category.items():
        slug = CATEGORY_SLUGS.get(category)
        if slug is None:
            continue
        observations = [
            {"date": fy_end_date(row["financialYear"]), "value": row["value"]}
            for row in sorted(category_rows, key=lambda item: item["financialYear"])
        ]
        artifact = {
            "schemaVersion": 1,
            "artifactType": "series",
            "indicatorId": f"auto.siam.domestic_sales.{slug}_annual",
            "title": f"SIAM domestic sales - {category}",
            "sourceId": SOURCE_ID,
            "sourceIndicatorId": f"SIAM_domestic_sales_{slug}",
            "sourceUrl": TREND_URL,
            "unit": "vehicles",
            "frequency": "annual",
            "geography": {"type": "country", "id": "IN", "name": "India"},
            "dimensions": [{"name": "category", "value": category}],
            "fetchedAt": fetched_at,
            "observations": observations,
            "metadata": {
                "method": "Parsed from SIAM public domestic-sales trend page and latest FY press-release figures.",
                "caveat": "Wholesale domestic sales, not registrations. Public trend page currently exposes 2008-09 through 2013-14; latest FY 2025-26 is parsed from a press release, so the annual series has a gap.",
                "sourceUrls": [TREND_URL, LATEST_FY_URL],
            },
        }
        path = SERIES_DIR / f"siam.IN.auto.domestic_sales.{slug}_annual.json"
        write_json(path, artifact)
        manifest.append({"indicatorId": artifact["indicatorId"], "artifact": str(path), "observations": len(observations)})
    return manifest


def main() -> int:
    fetched_at = now_iso()
    trend_html, trend_snap = fetch(TREND_URL)
    latest_html, latest_snap = fetch(LATEST_FY_URL)
    trend = parse_trend_page(trend_html, fetched_at, trend_snap)
    latest = parse_latest_fy_release(latest_html, fetched_at, latest_snap)

    combined_rows = trend["rows"] + latest["rows"]
    write_json(TABLES_DIR / "siam_domestic_sales_trend.json", trend)
    write_csv(TABLES_DIR / "siam_domestic_sales_trend.csv", trend["rows"])
    write_json(TABLES_DIR / "siam_domestic_sales_fy_2025_26_press_release.json", latest)
    write_csv(TABLES_DIR / "siam_domestic_sales_combined_public_rows.csv", combined_rows)
    series = write_series(combined_rows, fetched_at)
    manifest = {
        "sourceId": SOURCE_ID,
        "sourceUrl": BASE,
        "updatedAt": fetched_at,
        "tables": [
            {"path": str(TABLES_DIR / "siam_domestic_sales_trend.json"), "rows": len(trend["rows"])},
            {"path": str(TABLES_DIR / "siam_domestic_sales_fy_2025_26_press_release.json"), "rows": len(latest["rows"])},
        ],
        "series": series,
        "caveat": "SIAM is wholesale domestic sales. VAHAN is registrations. Use them as different lenses, not interchangeable totals.",
    }
    write_json(OUT_DIR / "index.json", manifest)
    write_json(Path("data/catalog/siam-manifest.json"), manifest)
    print(stable_json({"trendRows": len(trend["rows"]), "latestFyRows": len(latest["rows"]), "series": series}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
