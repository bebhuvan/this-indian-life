#!/usr/bin/env python3
"""Create story-ready summaries from the CPCB repository coverage audit."""

from __future__ import annotations

import csv
import json
import statistics
from collections import defaultdict
from pathlib import Path


BASE = Path("data/raw/cpcb_repository")
COVERAGE = BASE / "coverage/cpcb_repository_raw_1Day_station_year_coverage.csv"
SUMMARY = BASE / "coverage/cpcb_repository_raw_1Day_station_summary.csv"
OUT = BASE / "analysis"


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields: list[str] = []
    for row in rows:
        for key in row:
            if key not in fields:
                fields.append(key)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def to_int(value: str | int | None) -> int:
    if value in ("", None):
        return 0
    return int(value)


def median(values: list[int]) -> float:
    return round(statistics.median(values), 1) if values else 0


def year_summary(year_rows: list[dict]) -> list[dict]:
    grouped: dict[int, list[dict]] = defaultdict(list)
    for row in year_rows:
        grouped[to_int(row["year"])].append(row)

    rows = []
    for year in sorted(grouped):
        records = grouped[year]
        listed = len(records)
        rows.append(
            {
                "year": year,
                "listed_station_files": listed,
                "station_files_with_rows": sum(to_int(row["rows"]) > 0 for row in records),
                "station_years_with_pm25": sum(to_int(row["pm2_5_ug_m_days"]) > 0 for row in records),
                "station_years_with_pm10": sum(to_int(row["pm10_ug_m_days"]) > 0 for row in records),
                "pm25_observed_days": sum(to_int(row["pm2_5_ug_m_days"]) for row in records),
                "pm10_observed_days": sum(to_int(row["pm10_ug_m_days"]) for row in records),
                "median_pm25_days_per_listed_file": median([to_int(row["pm2_5_ug_m_days"]) for row in records]),
                "listed_files_with_zero_pm25": sum(to_int(row["pm2_5_ug_m_days"]) == 0 for row in records),
            }
        )
    return rows


def city_summary(station_rows: list[dict]) -> list[dict]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in station_rows:
        grouped[row["city"] or "Unknown"].append(row)

    rows = []
    for city, records in grouped.items():
        pm25_days = [to_int(row["pm25_total_days"]) for row in records]
        first_years = [to_int(row["pm25_first_usable_year"]) for row in records if row["pm25_first_usable_year"]]
        rows.append(
            {
                "city": city,
                "stations": len(records),
                "stations_with_any_pm25": sum(days > 0 for days in pm25_days),
                "stations_with_1000_pm25_days": sum(days >= 1000 for days in pm25_days),
                "stations_with_pre2020_pm25": sum(
                    1
                    for row in records
                    if row["pm25_first_usable_year"] and to_int(row["pm25_first_usable_year"]) < 2020
                ),
                "stations_with_no_pm25": sum(
                    1
                    for row in records
                    if to_int(row["pm25_total_days"]) == 0
                ),
                "median_pm25_total_days": median(pm25_days),
                "total_pm25_days": sum(pm25_days),
                "earliest_pm25_year": min(first_years) if first_years else "",
                "latest_pm25_year": max(
                    [to_int(row["pm25_last_usable_year"]) for row in records if row["pm25_last_usable_year"]],
                    default="",
                ),
            }
        )
    rows.sort(key=lambda row: (-row["total_pm25_days"], row["city"]))
    return rows


def examples(year_rows: list[dict], station_rows: list[dict]) -> dict[str, list[dict]]:
    listed_but_empty = [
        row
        for row in year_rows
        if to_int(row["rows"]) > 0 and to_int(row["pm2_5_ug_m_days"]) == 0 and to_int(row["pm10_ug_m_days"]) == 0
    ]
    listed_but_empty.sort(key=lambda row: (to_int(row["year"]), row["city"], row["station_name"]))

    strong_long_history = [
        row
        for row in station_rows
        if row["pm25_first_usable_year"] and to_int(row["pm25_first_usable_year"]) <= 2015
    ]
    strong_long_history.sort(key=lambda row: (-to_int(row["pm25_total_days"]), row["station_name"]))

    recent_only = [
        row
        for row in station_rows
        if row["pm25_first_usable_year"] and to_int(row["pm25_first_usable_year"]) >= 2023
    ]
    recent_only.sort(key=lambda row: (-to_int(row["pm25_total_days"]), row["station_name"]))

    no_pm25 = [row for row in station_rows if to_int(row["pm25_total_days"]) == 0]
    no_pm25.sort(key=lambda row: (row["city"], row["station_name"]))

    return {
        "listed_files_with_rows_but_no_pm": listed_but_empty[:50],
        "long_pm25_history_stations": strong_long_history[:50],
        "recent_only_pm25_stations": recent_only[:50],
        "stations_with_no_pm25": no_pm25[:100],
    }


def write_memo(
    path: Path,
    station_rows: list[dict],
    year_rows: list[dict],
    year_rows_out: list[dict],
    city_rows: list[dict],
    examples_out: dict[str, list[dict]],
) -> None:
    stations = len(station_rows)
    listed_files = len(year_rows)
    pm25_total = sum(to_int(row["pm25_total_days"]) for row in station_rows)
    no_pm25 = sum(to_int(row["pm25_total_days"]) == 0 for row in station_rows)
    pre2020 = sum(
        1
        for row in station_rows
        if row["pm25_first_usable_year"] and to_int(row["pm25_first_usable_year"]) < 2020
    )
    thousand = sum(to_int(row["pm25_total_days"]) >= 1000 for row in station_rows)
    top_cities = city_rows[:10]

    lines = [
        "# CPCB Repository Coverage Audit",
        "",
        "## What We Have",
        "",
        f"- Stations checked: {stations}",
        f"- CPCB daily raw CSVs downloaded/audited: {listed_files}",
        f"- Total non-missing PM2.5 station-days: {pm25_total:,}",
        f"- Stations with no usable PM2.5 in daily files: {no_pm25}",
        f"- Stations with at least 1,000 usable PM2.5 days: {thousand}",
        f"- Stations with usable PM2.5 before 2020: {pre2020}",
        "",
        "## Core Read",
        "",
        (
            "CPCB's repository is deeper than OAQ's current CPCB mirror, but the depth is uneven. "
            "The archive lists files back to 2009 for some stations, yet many early files are empty "
            "or have rows with no usable PM2.5/PM10. The monitoring network becomes much more useful "
            "after 2020, and especially by 2023-2025."
        ),
        "",
        "## Year-Level Signal",
        "",
        "| Year | Listed files | With PM2.5 | PM2.5 days | Zero-PM2.5 listed files |",
        "|---:|---:|---:|---:|---:|",
    ]
    for row in year_rows_out:
        lines.append(
            f"| {row['year']} | {row['listed_station_files']} | {row['station_years_with_pm25']} | "
            f"{row['pm25_observed_days']:,} | {row['listed_files_with_zero_pm25']} |"
        )

    lines.extend(
        [
            "",
            "## Highest-Coverage Cities",
            "",
            "| City | Stations | Stations with PM2.5 | PM2.5 station-days | Earliest PM2.5 year |",
            "|---|---:|---:|---:|---:|",
        ]
    )
    for row in top_cities:
        lines.append(
            f"| {row['city']} | {row['stations']} | {row['stations_with_any_pm25']} | "
            f"{row['total_pm25_days']:,} | {row['earliest_pm25_year']} |"
        )

    lines.extend(
        [
            "",
            "## Useful Examples",
            "",
            "Long PM2.5 history stations:",
        ]
    )
    for row in examples_out["long_pm25_history_stations"][:10]:
        lines.append(
            f"- {row['station_name']} ({row['city']}): {row['pm25_first_usable_year']}-"
            f"{row['pm25_last_usable_year']}, {int(row['pm25_total_days']):,} PM2.5 days"
        )

    lines.append("")
    lines.append("Listed files with rows but no PM2.5/PM10, useful for the data-poverty point:")
    for row in examples_out["listed_files_with_rows_but_no_pm"][:10]:
        lines.append(
            f"- {row['station_name']} ({row['city']}), {row['year']}: "
            f"{row['rows']} rows, 0 PM2.5 days, 0 PM10 days"
        )

    lines.extend(
        [
            "",
            "## Candidate Charts",
            "",
            "1. Listed files vs station-years with usable PM2.5 by year.",
            "2. Histogram of each station's first usable PM2.5 year.",
            "3. City coverage table/map: stations and total PM2.5 station-days.",
            "4. Case study strip: Anand Vihar or ITO, listed years vs usable PM2.5 days.",
            "5. OAQ vs CPCB direct: OAQ gives clean 2026 aggregates, CPCB direct gives a messy archive.",
            "",
            "## Caveat",
            "",
            (
                "This audit only checks CPCB repository daily raw CSV availability and non-missing pollutant cells. "
                "It does not yet validate instrument QA/QC flags, hourly completeness inside a daily value, or whether "
                "daily values are CPCB-computed aggregates versus post-processed repository exports."
            ),
            "",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    year_rows = read_csv(COVERAGE)
    station_rows = read_csv(SUMMARY)

    year_rows_out = year_summary(year_rows)
    city_rows = city_summary(station_rows)
    examples_out = examples(year_rows, station_rows)

    write_csv(OUT / "coverage_by_year.csv", year_rows_out)
    write_csv(OUT / "coverage_by_city.csv", city_rows)
    for name, rows in examples_out.items():
        write_csv(OUT / f"{name}.csv", rows)

    (OUT / "analysis_metadata.json").write_text(
        json.dumps(
            {
                "source_station_year_coverage": str(COVERAGE),
                "source_station_summary": str(SUMMARY),
                "outputs": [
                    "coverage_by_year.csv",
                    "coverage_by_city.csv",
                    *[f"{name}.csv" for name in examples_out],
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    write_memo(OUT / "story_memo.md", station_rows, year_rows, year_rows_out, city_rows, examples_out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
