#!/usr/bin/env python3
"""Build Indica chart artifacts from the CPCB repository coverage audit."""

from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ANALYSIS = ROOT / "data/raw/cpcb_repository/analysis"
COVERAGE = ROOT / "data/raw/cpcb_repository/coverage"
METADATA = ROOT / "data/raw/cpcb_repository/metadata"
SERIES = ROOT / "data/series"
CPCB_REPOSITORY_URL = "https://airquality.cpcb.gov.in/ccr/#/repository/data"
OAQ_URL = "https://oaq.notf.in"
CENSUS_2011_URBAN_URL = "https://censusindia.gov.in/nada/index.php/catalog/42811"
FETCHED_AT = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
CENSUS_2011_STATUTORY_TOWNS = 4041


def read_csv(name: str) -> list[dict[str, str]]:
    with (ANALYSIS / name).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def read_coverage_csv(name: str) -> list[dict[str, str]]:
    with (COVERAGE / name).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def num(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def intnum(value: str | None) -> int:
    parsed = num(value)
    return int(parsed) if parsed is not None else 0


def source_slug(value: str) -> str:
    return "".join(ch if ch.isalnum() or ch in "_.@-" else "_" for ch in value)


def write_artifact(name: str, artifact: dict) -> None:
    SERIES.mkdir(parents=True, exist_ok=True)
    path = SERIES / f"{source_slug(name)}.json"
    path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(path.relative_to(ROOT))


def series_artifact(indicator_id: str, title: str, unit: str, observations: list[dict], metadata: dict | None = None) -> dict:
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "cpcb",
        "sourceIndicatorId": indicator_id,
        "sourceUrl": CPCB_REPOSITORY_URL,
        "unit": unit,
        "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "dimensions": [],
        "metadata": metadata or {},
    }


def table_artifact(indicator_id: str, title: str, unit: str, rows: list[dict], source_id: str = "cpcb", source_url: str = CPCB_REPOSITORY_URL, metadata: dict | None = None) -> dict:
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "fetchedAt": FETCHED_AT,
        "rows": rows,
        "dimensions": [],
        "metadata": metadata or {},
    }


def observation(year: str, value: int | float) -> dict:
    return {"date": str(year), "value": value}


def main() -> None:
    by_year = read_csv("coverage_by_year.csv")
    by_city = read_csv("coverage_by_city.csv")
    station_year_coverage = read_coverage_csv("cpcb_repository_raw_1Day_station_year_coverage.csv")
    station_summary = read_csv("../coverage/cpcb_repository_raw_1Day_station_summary.csv")
    frequency_counts = read_coverage_csv("cpcb_repository_raw_frequency_file_counts.csv")
    no_pm_rows = read_csv("listed_files_with_rows_but_no_pm.csv")
    stations = list(csv.DictReader((METADATA / "stations.csv").open(newline="", encoding="utf-8")))
    hierarchy = json.loads((METADATA / "oaq_cpcb_hierarchy.json").read_text(encoding="utf-8"))
    oaq_latest = json.loads((METADATA / "oaq_cpcb_latest.json").read_text(encoding="utf-8"))
    oaq_stations = oaq_latest.get("stations", [])
    main_pollutants = ["pm25", "pm10", "no2", "so2", "co", "o3", "nh3", "nox"]
    cpcb_city_count = len((hierarchy.get("India") or {}).keys())

    annual_specs = [
        ("air.cpcb.repository.listed_station_files", "Daily repository files listed by CPCB", "station-years", "listed_station_files"),
        ("air.cpcb.repository.station_years_with_rows", "Daily repository files with any rows", "station-years", "station_files_with_rows"),
        ("air.cpcb.repository.station_years_with_pm25", "Repository station-years with usable PM2.5", "station-years", "station_years_with_pm25"),
        ("air.cpcb.repository.zero_pm25_listed_files", "Listed files with no usable PM2.5", "station-years", "listed_files_with_zero_pm25"),
        ("air.cpcb.repository.pm25_observed_days", "Non-missing PM2.5 station-days", "station-days", "pm25_observed_days"),
        ("air.cpcb.repository.pm10_observed_days", "Non-missing PM10 station-days", "station-days", "pm10_observed_days"),
    ]
    for indicator_id, title, unit, column in annual_specs:
        write_artifact(
            indicator_id,
            series_artifact(indicator_id, title, unit, [observation(row["year"], intnum(row[column])) for row in by_year]),
        )

    threshold_specs = [
        ("pm25", "pm2_5_ug_m_days", "PM2.5"),
        ("pm10", "pm10_ug_m_days", "PM10"),
    ]
    for pollutant_slug, column, pollutant_label in threshold_specs:
        for threshold, threshold_label in [
            (1, "any"),
            (30, "30+ days"),
            (180, "180+ days"),
            (300, "300+ days"),
        ]:
            indicator_id = f"air.cpcb.repository.station_years_with_{pollutant_slug}_{threshold}_days"
            write_artifact(
                indicator_id,
                series_artifact(
                    indicator_id,
                    f"Repository station-years with {threshold_label} usable {pollutant_label}",
                    "station-years",
                    [
                        observation(
                            row["year"],
                            sum(
                                1
                                for station_year in station_year_coverage
                                if station_year["year"] == row["year"] and intnum(station_year[column]) >= threshold
                            ),
                        )
                        for row in by_year
                    ],
                    metadata={
                        "thresholdDays": threshold,
                        "pollutant": pollutant_label,
                        "method": f"Counted CPCB daily repository station-years with at least {threshold} non-missing {pollutant_label} daily pollutant cells.",
                    },
                ),
            )

    frequency_labels = {
        "15M": "15-minute raw files",
        "1H": "Hourly raw files",
        "8H": "8-hour raw files",
        "1D": "Daily raw files",
    }
    frequency_order = ["15M", "1H", "8H", "1D"]
    frequency_rows = []
    for frequency in frequency_order:
        rows = [row for row in frequency_counts if row["frequency"] == frequency]
        rows_with_files = [row for row in rows if intnum(row["listed_files"]) > 0]
        first_years = [intnum(row["first_year"]) for row in rows_with_files if intnum(row["first_year"]) > 0]
        last_years = [intnum(row["last_year"]) for row in rows_with_files if intnum(row["last_year"]) > 0]
        frequency_rows.append(
            {
                "label": frequency_labels[frequency],
                "value": sum(intnum(row["listed_files"]) for row in rows),
                "frequency": frequency,
                "stationsWithFiles": len(rows_with_files),
                "firstYear": min(first_years) if first_years else None,
                "lastYear": max(last_years) if last_years else None,
            }
        )
    write_artifact(
        "air.cpcb.repository.raw_frequency_file_counts",
        table_artifact(
            "air.cpcb.repository.raw_frequency_file_counts",
            "CPCB raw repository file listings by public frequency",
            "listed files",
            frequency_rows,
            metadata={
                "stationsChecked": len({row["station_id"] for row in frequency_counts}),
                "frequenciesChecked": frequency_order,
                "method": "Posted each CPCB station_id/station_name pair to the public dataRepository/file-path endpoint for raw data at 15M, 1H, 8H and 1D frequencies, then counted listed file paths. This counts file listings only; it does not validate pollutant cells inside those files.",
            },
        ),
    )

    write_artifact(
        "air.cpcb.repository.station_metadata_visibility",
        table_artifact(
            "air.cpcb.repository.station_metadata_visibility",
            "Public station-list metadata fields in the CPCB/OAQ snapshot",
            "station records",
            [
                {"label": "Station records in metadata snapshot", "value": len(stations)},
                {"label": "Records with latitude and longitude", "value": sum(1 for row in stations if row.get("lat") and row.get("lon"))},
                {"label": "Records with station type", "value": sum(1 for row in stations if row.get("type"))},
                {"label": "Records with latest seen timestamp", "value": sum(1 for row in stations if row.get("last_seen"))},
                {"label": "Records with agency/operator suffix in station name", "value": sum(1 for row in stations if " - " in row.get("station_name", ""))},
                {"label": "Records with commissioning or activation date", "value": 0},
            ],
            source_id="oaq",
            source_url=OAQ_URL,
            metadata={
                "method": "Inspected the station metadata snapshot used for the CPCB repository audit. Coordinates, station type, latest timestamp and agency/operator suffixes are present; commissioning or activation dates were not present in this snapshot.",
            },
        ),
    )

    top_cities = sorted(by_city, key=lambda r: intnum(r["total_pm25_days"]), reverse=True)[:14]
    write_artifact(
        "air.cpcb.repository.city_visibility_vs_census",
        table_artifact(
            "air.cpcb.repository.city_visibility_vs_census",
            "CPCB station-list city names versus Census statutory towns",
            "towns/city names",
            [
                {"label": "Statutory towns in Census 2011", "value": CENSUS_2011_STATUTORY_TOWNS},
                {"label": "City names in CPCB/OAQ station list", "value": cpcb_city_count},
                {
                    "label": "Statutory towns not visible in this station list",
                    "value": max(CENSUS_2011_STATUTORY_TOWNS - cpcb_city_count, 0),
                },
            ],
            source_id="cpcb-census",
            source_url=CENSUS_2011_URBAN_URL,
            metadata={
                "cpcbCityNames": cpcb_city_count,
                "censusStatutoryTowns": CENSUS_2011_STATUTORY_TOWNS,
                "coveredSharePercent": round(cpcb_city_count / CENSUS_2011_STATUTORY_TOWNS * 100, 1),
                "notVisibleSharePercent": round((CENSUS_2011_STATUTORY_TOWNS - cpcb_city_count) / CENSUS_2011_STATUTORY_TOWNS * 100, 1),
                "method": "Compared distinct city names in the OAQ CPCB station hierarchy used for the CPCB audit with the Census 2011 count of statutory towns. This is a visibility denominator, not a station-siting target.",
            },
        ),
    )

    write_artifact(
        "air.cpcb.repository.city_pm25_days",
        table_artifact(
            "air.cpcb.repository.city_pm25_days",
            "Cities with the deepest CPCB PM2.5 archive",
            "PM2.5 station-days",
            [
                {
                    "label": row["city"],
                    "value": intnum(row["total_pm25_days"]),
                    "stations": intnum(row["stations"]),
                    "stationsWithPm25": intnum(row["stations_with_any_pm25"]),
                    "earliestPm25Year": intnum(row["earliest_pm25_year"]),
                }
                for row in top_cities
            ],
        ),
    )

    first_year_counts = Counter(
        intnum(row["pm25_first_usable_year"])
        for row in station_summary
        if intnum(row.get("pm25_first_usable_year")) > 0
    )
    write_artifact(
        "air.cpcb.repository.first_pm25_year",
        table_artifact(
            "air.cpcb.repository.first_pm25_year",
            "When stations first have usable PM2.5 in the repository",
            "stations",
            [{"label": str(year), "value": count} for year, count in sorted(first_year_counts.items())],
        ),
    )

    scatter_rows = []
    for row in station_summary:
        listed_years = intnum(row["repository_years_listed"])
        usable_years = intnum(row["pm25_usable_years"])
        if listed_years <= 0 and usable_years <= 0:
            continue
        scatter_rows.append(
            {
                "label": row["station_name"],
                "city": row["city"],
                "x": listed_years,
                "y": usable_years,
                "highlight": row["city"] in {"Delhi", "New Delhi"},
            }
        )
    write_artifact(
        "air.cpcb.repository.file_vs_pm25_years",
        table_artifact(
            "air.cpcb.repository.file_vs_pm25_years",
            "Repository years listed versus usable PM2.5 years",
            "years",
            scatter_rows,
            metadata={"xLabel": "repository years listed", "yLabel": "years with usable PM2.5"},
        ),
    )

    gap_rows = []
    for row in station_summary:
        listed_years = intnum(row["repository_years_listed"])
        usable_years = intnum(row["pm25_usable_years"])
        gap = listed_years - usable_years
        if gap <= 0:
            continue
        gap_rows.append(
            {
                "label": row["station_name"],
                "value": gap,
                "city": row["city"],
                "listedYears": listed_years,
                "usablePm25Years": usable_years,
            }
        )
    write_artifact(
        "air.cpcb.repository.listed_years_missing_pm25",
        table_artifact(
            "air.cpcb.repository.listed_years_missing_pm25",
            "Stations with the largest gap between listed years and usable PM2.5 years",
            "listed years without PM2.5",
            sorted(gap_rows, key=lambda r: (r["value"], r["listedYears"]), reverse=True)[:14],
            metadata={
                "method": "For each station, subtract years with any usable PM2.5 from years with a listed CPCB daily raw file.",
            },
        ),
    )

    no_pm_by_rows: dict[int, list[dict[str, str]]] = {}
    for row in no_pm_rows:
        no_pm_by_rows.setdefault(intnum(row["rows"]), []).append(row)
    no_pm_examples: list[dict[str, str]] = []
    for row_count in sorted(no_pm_by_rows.keys(), reverse=True):
        no_pm_examples.extend(sorted(no_pm_by_rows[row_count], key=lambda r: (r["year"], r["station_name"]))[:2])
    write_artifact(
        "air.cpcb.repository.rows_without_pm_examples",
        table_artifact(
            "air.cpcb.repository.rows_without_pm_examples",
            "Daily rows can exist while PM values are blank",
            "daily rows",
            [
                {
                    "label": f"{row['station_name'].split(' - ')[0]}, {row['year']}",
                    "value": intnum(row["rows"]),
                    "city": row["city"],
                    "pm25Days": intnum(row["pm2_5_ug_m_days"]),
                    "pm10Days": intnum(row["pm10_ug_m_days"]),
                }
                for row in no_pm_examples
            ],
            metadata={
                "method": "Representative examples selected across row-count bands from daily files with rows and zero usable PM2.5 or PM10 days.",
            },
        ),
    )

    write_artifact(
        "air.oaq.cpcb.latest_station_snapshot",
        table_artifact(
            "air.oaq.cpcb.latest_station_snapshot",
            "The latest OAQ mirror is a snapshot, not history",
            "station records",
            [
                {"label": "CPCB station records in latest OAQ snapshot", "value": len(oaq_stations)},
                {
                    "label": "Records with any main pollutant at that moment",
                    "value": sum(1 for row in oaq_stations if any(row.get(key) is not None for key in main_pollutants)),
                },
                {
                    "label": "Records with all 8 main pollutants",
                    "value": sum(1 for row in oaq_stations if all(row.get(key) is not None for key in main_pollutants)),
                },
                {"label": "Records with PM2.5 at that moment", "value": sum(1 for row in oaq_stations if row.get("pm25") is not None)},
                {"label": "Records with PM10 at that moment", "value": sum(1 for row in oaq_stations if row.get("pm10") is not None)},
                {
                    "label": "Records with no main pollutant at that moment",
                    "value": sum(1 for row in oaq_stations if not any(row.get(key) is not None for key in main_pollutants)),
                },
            ],
            source_id="oaq",
            source_url=OAQ_URL,
            metadata={
                "generatedAt": "2026-06-23T17:40:12+05:30",
                "note": "Latest OAQ CPCB mirror snapshot inspected through the OAQ API.",
            },
        ),
    )


if __name__ == "__main__":
    main()
