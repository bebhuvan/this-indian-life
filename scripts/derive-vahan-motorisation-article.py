#!/usr/bin/env python3
"""Build article-ready artifacts for the VAHAN motorisation story.

The raw VAHAN pulls are calendar-year tables with month columns. This script
normalises them into fiscal-year series and small ranked tables that the
curated article visual plan can render without custom chart code.
"""

from __future__ import annotations

import csv
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean


ROOT = Path(__file__).resolve().parents[1]
SERIES_DIR = ROOT / "data" / "series"
TABLE_DIR = ROOT / "Vaahan" / "tables"
MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
MONTH_NUM = {name: i + 1 for i, name in enumerate(MONTHS)}

VAHAN_URL = "https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml"
MOSPI_NAS_URL = "https://esankhyiki.mospi.gov.in/macroindicators?product=nas"
MOSPI_CPI_URL = "https://cpi.mospi.gov.in/Default1.aspx"
SIAM_URL = "https://www.siam.in/statistics.aspx?mpgid=8&pgidtrail=14"
SIAM_2026_URL = "https://www.siam.in/news-%26-updates/press-releases/auto-industry-performance-of-q4-jan--march-2026-fy-2025-26/605"
EMBER_URL = "https://api.ember-energy.org/v1/docs"
IDH_URL = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor"
WB_POP_URL = "https://api.worldbank.org/v2/country/IN/indicator/SP.POP.TOTL?format=json&per_page=20000"


def fetched_at() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


FETCHED_AT = fetched_at()


def read_json(path: str | Path) -> dict:
    return json.loads(Path(path).read_text())


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def clean_int(value: str | int | float | None) -> int:
    if value is None or value == "":
        return 0
    return int(float(str(value).replace(",", "")))


def slug(value: str) -> str:
    out = []
    for ch in value:
        if ch.isalnum() or ch in "._@-":
            out.append(ch)
        else:
            out.append("_")
    return "".join(out)


def series_artifact(indicator_id: str, title: str, source_id: str, source_indicator_id: str,
                    source_url: str, unit: str, observations: list[dict], frequency: str = "annual",
                    metadata: dict | None = None) -> dict:
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": frequency,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "metadata": metadata or {},
    }


def table_artifact(indicator_id: str, title: str, source_id: str, source_indicator_id: str,
                   source_url: str, unit: str, rows: list[dict], metadata: dict | None = None) -> dict:
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "rows": rows,
        "metadata": metadata or {},
    }


def write_artifact(name: str, artifact: dict) -> str:
    path = SERIES_DIR / f"{slug(name)}.json"
    write_json(path, artifact)
    return str(path.relative_to(ROOT))


def fy_end_for_month(year: int, month: int) -> int:
    return year if month <= 3 else year + 1


def fy_date(fy_end: int) -> str:
    return f"{fy_end}-03-31"


def as_fy_observations(values: dict[int, float]) -> list[dict]:
    return [{"date": fy_date(year), "value": round(value, 6) if isinstance(value, float) and not value.is_integer() else int(value)}
            for year, value in sorted(values.items()) if 2004 <= year <= 2026 and value is not None]


def read_vahan_cut(cut: str, label_field: str) -> dict[str, dict[str, int]]:
    out: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for path in sorted(TABLE_DIR.glob(f"vahan_{cut}_monthly_calendar_*.csv")):
        with path.open(newline="") as handle:
            for row in csv.DictReader(handle):
                year = int(row["year"])
                label = row[label_field].strip()
                for month_name in MONTHS:
                    value = clean_int(row.get(month_name))
                    month = MONTH_NUM[month_name]
                    date = f"{year}-{month:02d}"
                    out[label][date] += value
    return out


def monthly_to_fy(series: dict[str, int]) -> dict[int, int]:
    out: dict[int, int] = defaultdict(int)
    for date, value in series.items():
        year, month = map(int, date.split("-"))
        fy = fy_end_for_month(year, month)
        if 2004 <= fy <= 2026:
            out[fy] += value
    return dict(out)


def growth(values: dict[int, float]) -> dict[int, float]:
    out = {}
    for year in sorted(values):
        prev = values.get(year - 1)
        value = values[year]
        if prev and value is not None:
            out[year] = (value / prev - 1) * 100
    return out


def index_to_base(values: dict[int, float], base_year: int = 2004) -> dict[int, float]:
    base = values.get(base_year)
    return {year: value / base * 100 for year, value in values.items() if base and value is not None}


def pearson(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) < 3 or len(xs) != len(ys):
        return None
    mx, my = mean(xs), mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den_x = math.sqrt(sum((x - mx) ** 2 for x in xs))
    den_y = math.sqrt(sum((y - my) ** 2 for y in ys))
    if den_x == 0 or den_y == 0:
        return None
    return num / (den_x * den_y)


def read_series_by_fy(path: str) -> dict[int, float]:
    artifact = read_json(ROOT / path)
    out = {}
    for obs in artifact.get("observations", []):
        value = obs.get("value")
        if value is None:
            continue
        year = int(str(obs["date"])[:4])
        out[year] = float(value)
    return out


def dedupe_monthly_observations(path: str) -> dict[str, float]:
    artifact = read_json(ROOT / path)
    values: dict[str, float] = {}
    for obs in artifact.get("observations", []):
        value = obs.get("value")
        if value is None:
            continue
        values[str(obs["date"])] = float(value)
    return dict(sorted(values.items()))


def monthly_yoy(values: dict[str, float]) -> dict[str, float]:
    out = {}
    for date, value in values.items():
        year, month = map(int, date.split("-"))
        prev = values.get(f"{year - 1}-{month:02d}")
        if prev and value is not None:
            out[date] = (value / prev - 1) * 100
    return out


VEHICLE_BUCKETS = {
    "two_wheelers": {
        "label": "Two-wheelers",
        "classes": {
            "M-CYCLE/SCOOTER", "M-CYCLE/SCOOTER-WITH SIDE CAR", "MOTOR CYCLE/SCOOTER-SIDECAR(T)",
            "MOTOR CYCLE/SCOOTER-USED FOR HIRE", "MOTOR CYCLE/SCOOTER-WITH TRAILER",
            "MOTORISED CYCLE (CC > 25CC)", "MOPED",
        },
    },
    "cars_cabs": {
        "label": "Cars and cabs",
        "classes": {"MOTOR CAR", "MOTOR CAB", "MAXI CAB", "LUXURY CAB", "QUADRICYCLE (PRIVATE)", "QUADRICYCLE (COMMERCIAL)"},
    },
    "three_wheelers": {
        "label": "Three-wheelers",
        "classes": {"THREE WHEELER (PASSENGER)", "THREE WHEELER (GOODS)", "THREE WHEELER (PERSONAL)", "E-RICKSHAW(P)", "E-RICKSHAW WITH CART (G)"},
    },
    "tractors": {
        "label": "Tractors and tillers",
        "classes": {"AGRICULTURAL TRACTOR", "TRACTOR (COMMERCIAL)", "PULLER TRACTOR", "POWER TILLER", "POWER TILLER (COMMERCIAL)", "HARVESTER"},
    },
    "goods": {
        "label": "Goods vehicles",
        "classes": {"GOODS CARRIER", "ARTICULATED VEHICLE", "DUMPER", "TRAILER (COMMERCIAL)", "SEMI-TRAILER (COMMERCIAL)", "AUXILIARY TRAILER", "MODULAR HYDRAULIC TRAILER"},
    },
    "buses": {
        "label": "Buses",
        "classes": {"BUS", "SCHOOL BUS", "EDUCATIONAL INSTITUTION BUS", "OMNI BUS", "OMNI BUS (PRIVATE USE)"},
    },
}

FUEL_BUCKETS = {
    "petrol_all": {"label": "Petrol and petrol hybrids", "fuels": {"PETROL", "PETROL(E20)", "PETROL(E20)/CNG", "PETROL(E20)/HYBRID", "PETROL(E20)/HYBRID/CNG", "PETROL(E20)/LPG", "PETROL/CNG", "PETROL/HYBRID", "PETROL/HYBRID/CNG", "PETROL/LPG", "PETROL/METHANOL"}},
    "diesel_all": {"label": "Diesel and diesel hybrids", "fuels": {"DIESEL", "DIESEL/HYBRID", "DUAL DIESEL/BIO CNG", "DUAL DIESEL/CNG", "DUAL DIESEL/LNG"}},
    "ev_battery": {"label": "Battery EVs", "fuels": {"ELECTRIC(BOV)", "PURE EV"}},
    "cng_all": {"label": "CNG and bio-CNG", "fuels": {"CNG ONLY", "BIO-CNG/BIO-GAS", "HCNG"}},
    "lpg_all": {"label": "LPG", "fuels": {"LPG ONLY"}},
}


def main() -> None:
    manifest = []
    vehicle_class_monthly = read_vahan_cut("vehicle_class", "vehicle_class")
    state_monthly = read_vahan_cut("state", "state")
    fuel_monthly = read_vahan_cut("fuel", "fuel")

    all_monthly = defaultdict(int)
    for series in state_monthly.values():
        for date, value in series.items():
            all_monthly[date] += value
    total_fy = monthly_to_fy(all_monthly)

    # Drop fiscal years that are not complete in the source window.
    total_fy = {year: value for year, value in total_fy.items() if 2004 <= year <= 2026}

    def record(name: str, artifact: dict) -> None:
        path = write_artifact(name, artifact)
        manifest.append({
            "status": "ready",
            "indicatorId": artifact["indicatorId"],
            "artifact": path,
            "observations": len(artifact.get("observations", artifact.get("rows", []))),
            "fetchedAt": FETCHED_AT,
        })

    record("vahan-derived.IN.auto.vahan.registrations.total_fy", series_artifact(
        "auto.vahan.registrations.total_fy",
        "Vehicle registrations recorded in VAHAN, fiscal year",
        "vahan-derived",
        "VAHAN dashboard monthly registration tables, summed to fiscal years",
        VAHAN_URL,
        "registrations",
        as_fy_observations(total_fy),
        metadata={"method": "Summed VAHAN monthly state registration totals from April to March for each fiscal year. FY 2025-26 is complete because the source includes April 2025 through March 2026; FY 2026-27 is excluded because 2026 is partial."},
    ))

    record("vahan-derived.IN.auto.vahan.registrations.growth_fy", series_artifact(
        "auto.vahan.registrations.growth_fy",
        "Vehicle registration growth, fiscal year",
        "vahan-derived",
        "VAHAN fiscal totals, year-on-year change",
        VAHAN_URL,
        "% year-on-year",
        as_fy_observations(growth(total_fy)),
        metadata={"method": "Year-on-year percentage growth from VAHAN fiscal-year registration totals."},
    ))

    record("vahan-derived.IN.auto.vahan.registrations.index_fy_2004_100", series_artifact(
        "auto.vahan.registrations.index_fy_2004_100",
        "Vehicle registration index, FY 2003-04 = 100",
        "vahan-derived",
        "VAHAN fiscal totals, indexed",
        VAHAN_URL,
        "index, FY 2003-04 = 100",
        as_fy_observations(index_to_base(total_fy, 2004)),
        metadata={"method": "VAHAN fiscal-year registrations indexed to FY 2003-04 = 100."},
    ))

    vehicle_bucket_fy: dict[str, dict[int, int]] = {}
    assigned_vehicle_classes = set()
    for key, spec in VEHICLE_BUCKETS.items():
        bucket_monthly = defaultdict(int)
        for klass in spec["classes"]:
            assigned_vehicle_classes.add(klass)
            for date, value in vehicle_class_monthly.get(klass, {}).items():
                bucket_monthly[date] += value
        bucket_fy = monthly_to_fy(bucket_monthly)
        vehicle_bucket_fy[key] = bucket_fy
        record(f"vahan-derived.IN.auto.vahan.vehicle.{key}.share_fy", series_artifact(
            f"auto.vahan.vehicle.{key}.share_fy",
            f"{spec['label']} share of VAHAN registrations",
            "vahan-derived",
            f"VAHAN vehicle-class tables, {spec['label']}",
            VAHAN_URL,
            "% of registrations",
            as_fy_observations({year: bucket_fy.get(year, 0) / total_fy[year] * 100 for year in total_fy if total_fy[year]}),
            metadata={"method": f"Vehicle classes grouped as {spec['label']} and divided by total VAHAN registrations in the same fiscal year.", "share": True},
        ))
    other_vehicle_fy = {year: total_fy[year] - sum(bucket.get(year, 0) for bucket in vehicle_bucket_fy.values()) for year in total_fy}
    record("vahan-derived.IN.auto.vahan.vehicle.other.share_fy", series_artifact(
        "auto.vahan.vehicle.other.share_fy",
        "Other vehicles share of VAHAN registrations",
        "vahan-derived",
        "VAHAN vehicle-class tables, residual classes",
        VAHAN_URL,
        "% of registrations",
        as_fy_observations({year: other_vehicle_fy[year] / total_fy[year] * 100 for year in total_fy if total_fy[year]}),
        metadata={"method": "Residual share after two-wheelers, cars/cabs, three-wheelers, tractors/tillers, goods vehicles and buses are grouped.", "share": True},
    ))

    fuel_bucket_fy: dict[str, dict[int, int]] = {}
    for key, spec in FUEL_BUCKETS.items():
        bucket_monthly = defaultdict(int)
        for fuel in spec["fuels"]:
            for date, value in fuel_monthly.get(fuel, {}).items():
                bucket_monthly[date] += value
        bucket_fy = monthly_to_fy(bucket_monthly)
        fuel_bucket_fy[key] = bucket_fy
        record(f"vahan-derived.IN.auto.vahan.fuel.{key}.share_fy", series_artifact(
            f"auto.vahan.fuel.{key}.share_fy",
            f"{spec['label']} share of VAHAN registrations",
            "vahan-derived",
            f"VAHAN fuel tables, {spec['label']}",
            VAHAN_URL,
            "% of registrations",
            as_fy_observations({year: bucket_fy.get(year, 0) / total_fy[year] * 100 for year in total_fy if total_fy[year]}),
            metadata={"method": f"Fuel entries grouped as {spec['label']} and divided by total VAHAN registrations in the same fiscal year.", "share": True},
        ))
    ev_fy = fuel_bucket_fy["ev_battery"]
    record("vahan-derived.IN.auto.vahan.ev_battery.registrations_fy", series_artifact(
        "auto.vahan.ev_battery.registrations_fy",
        "Battery EV registrations recorded in VAHAN",
        "vahan-derived",
        "VAHAN fuel tables, ELECTRIC(BOV) plus PURE EV",
        VAHAN_URL,
        "registrations",
        as_fy_observations(ev_fy),
        metadata={"method": "Battery EV registrations are ELECTRIC(BOV) plus PURE EV in the VAHAN fuel tables, summed to fiscal years."},
    ))

    # State changes, using complete calendar years so the state ranking is not split by fiscal boundaries.
    state_year = {state: defaultdict(int) for state in state_monthly}
    for state, monthly in state_monthly.items():
        for date, value in monthly.items():
            year = int(date[:4])
            if 2003 <= year <= 2025:
                state_year[state][year] += value
    all_2003 = sum(values.get(2003, 0) for values in state_year.values())
    all_2025 = sum(values.get(2025, 0) for values in state_year.values())
    gain_rows = []
    latest_rows = []
    for state, values in state_year.items():
        start = values.get(2003, 0)
        end = values.get(2025, 0)
        if end <= 0:
            continue
        gain_rows.append({
            "label": state.title().replace(" And ", " and "),
            "value": end - start,
            "start": start,
            "end": end,
            "shareStart": start / all_2003 * 100 if all_2003 else None,
            "shareEnd": end / all_2025 * 100 if all_2025 else None,
        })
        latest_rows.append({"label": state.title().replace(" And ", " and "), "value": end})
    gain_rows = sorted(gain_rows, key=lambda row: row["value"], reverse=True)[:12]
    latest_rows = sorted(latest_rows, key=lambda row: row["value"], reverse=True)[:12]
    record("vahan-derived.IN.auto.vahan.state.registration_gain_2003_2025", table_artifact(
        "auto.vahan.state.registration_gain_2003_2025",
        "Where annual registrations rose most",
        "vahan-derived",
        "VAHAN state tables, calendar 2003 to calendar 2025",
        VAHAN_URL,
        "additional registrations",
        gain_rows,
        metadata={"method": "Calendar-year state totals from VAHAN. Value is 2025 registrations minus 2003 registrations; shares use each year's all-state total."},
    ))
    record("vahan-derived.IN.auto.vahan.state.registrations_latest_2025", table_artifact(
        "auto.vahan.state.registrations_latest_2025",
        "Largest state markets for new registrations",
        "vahan-derived",
        "VAHAN state tables, calendar 2025",
        VAHAN_URL,
        "registrations",
        latest_rows,
        metadata={"method": "Top states and union territories by VAHAN registrations in calendar 2025."},
    ))

    # Economy comparators.
    gdp_nominal = read_series_by_fy("data/series/mospi.IN.econ.nas.gdp_nominal.json")
    gdp_real = read_series_by_fy("data/series/mospi.IN.econ.nas.gdp_real.json")
    pc_nominal = read_series_by_fy("data/series/mospi.IN.econ.nas.per_capita_gdp_nominal.json")
    pc_real = read_series_by_fy("data/series/mospi.IN.econ.nas.per_capita_gdp_real.json")
    econ_series = [
        ("auto.vahan.economy.nominal_gdp_index_fy_2004_100", "Nominal GDP index, FY 2003-04 = 100", gdp_nominal, "rupee GDP, indexed", "GDP at current prices"),
        ("auto.vahan.economy.real_gdp_index_fy_2004_100", "Real GDP index, FY 2003-04 = 100", gdp_real, "real GDP, indexed", "GDP at 2011-12 prices"),
        ("auto.vahan.economy.nominal_pc_gdp_index_fy_2004_100", "Nominal per-capita GDP index, FY 2003-04 = 100", pc_nominal, "rupees per person, indexed", "per-capita GDP at current prices"),
        ("auto.vahan.economy.real_pc_gdp_index_fy_2004_100", "Real per-capita GDP index, FY 2003-04 = 100", pc_real, "real rupees per person, indexed", "per-capita GDP at 2011-12 prices"),
    ]
    for indicator, title, values, unit, source_indicator in econ_series:
        record(f"vahan-derived.IN.{indicator}", series_artifact(
            indicator,
            title,
            "mospi-derived",
            source_indicator,
            MOSPI_NAS_URL,
            "index, FY 2003-04 = 100",
            as_fy_observations(index_to_base(values, 2004)),
            metadata={"method": f"{source_indicator} from MoSPI NAS, indexed to FY 2003-04 = 100 for comparison with VAHAN registrations."},
        ))
    for indicator, title, values, source_indicator in [
        ("auto.vahan.economy.nominal_gdp_growth_fy", "Nominal GDP growth", gdp_nominal, "GDP at current prices"),
        ("auto.vahan.economy.real_gdp_growth_fy", "Real GDP growth", gdp_real, "GDP at 2011-12 prices"),
        ("auto.vahan.economy.nominal_pc_gdp_growth_fy", "Nominal per-capita GDP growth", pc_nominal, "per-capita GDP at current prices"),
        ("auto.vahan.economy.real_pc_gdp_growth_fy", "Real per-capita GDP growth", pc_real, "per-capita GDP at 2011-12 prices"),
    ]:
        record(f"vahan-derived.IN.{indicator}", series_artifact(
            indicator,
            title,
            "mospi-derived",
            source_indicator,
            MOSPI_NAS_URL,
            "% year-on-year",
            as_fy_observations(growth(values)),
            metadata={"method": f"Year-on-year growth computed from {source_indicator} in MoSPI NAS."},
        ))

    correlation_rows = []
    comparisons = [
        ("Nominal GDP, level", gdp_nominal, total_fy, False),
        ("Real GDP, level", gdp_real, total_fy, False),
        ("Nominal per-capita GDP, level", pc_nominal, total_fy, False),
        ("Real per-capita GDP, level", pc_real, total_fy, False),
        ("Nominal GDP growth", growth(gdp_nominal), growth(total_fy), True),
        ("Real GDP growth", growth(gdp_real), growth(total_fy), True),
        ("Nominal per-capita GDP growth", growth(pc_nominal), growth(total_fy), True),
        ("Real per-capita GDP growth", growth(pc_real), growth(total_fy), True),
    ]
    for label, econ_values, vahan_values, exclude_covid in comparisons:
        years = sorted(set(econ_values) & set(vahan_values) & set(range(2004, 2027)))
        if exclude_covid:
            years = [year for year in years if year not in (2021, 2022)]
        xs = [vahan_values[year] for year in years]
        ys = [econ_values[year] for year in years]
        corr = pearson(xs, ys)
        if corr is not None:
            correlation_rows.append({"label": label, "value": round(corr, 3), "years": f"{years[0]}-{years[-1]}", "group": "growth, Covid excluded" if exclude_covid else "levels"})
    record("vahan-derived.IN.auto.vahan.economy.correlation_summary", table_artifact(
        "auto.vahan.economy.correlation_summary",
        "How tightly registrations move with income",
        "vahan-derived",
        "VAHAN fiscal registrations and MoSPI NAS income series",
        VAHAN_URL,
        "Pearson correlation",
        correlation_rows,
        metadata={"method": "Pearson correlations between VAHAN fiscal registrations and MoSPI income measures. Growth correlations exclude FY 2020-21 and FY 2021-22 to avoid the mechanical Covid shock dominating the reading."},
    ))

    # Registrations per 1,000 people, with calendar-year registration totals.
    pop = read_series_by_fy("data/series/worldbank.IN.SP_POP_TOTL.json")
    calendar_total = defaultdict(int)
    for date, value in all_monthly.items():
        year = int(date[:4])
        if 2003 <= year <= 2024:
            calendar_total[year] += value
    per_1000 = {year: calendar_total[year] / pop[year] * 1000 for year in calendar_total if year in pop and pop[year]}
    record("vahan-derived.IN.auto.vahan.registrations.per_1000_people", series_artifact(
        "auto.vahan.registrations.per_1000_people",
        "New vehicle registrations per 1,000 people",
        "vahan-derived",
        "VAHAN calendar registrations divided by World Bank population",
        WB_POP_URL,
        "registrations per 1,000 people",
        [{"date": str(year), "value": round(value, 3)} for year, value in sorted(per_1000.items())],
        metadata={"method": "Calendar-year VAHAN registration totals divided by World Bank total population, multiplied by 1,000. Latest full population year is 2024."},
    ))

    # Seasonality: keep recent complete calendar years in one table for the seasonal chart.
    seasonal_rows = []
    seasonal_years = [2019, 2020, 2023, 2024, 2025]
    for month_name in MONTHS:
        month = MONTH_NUM[month_name]
        row = {"Year": month, "label": month_name.title()}
        for year in seasonal_years:
            row[str(year)] = all_monthly.get(f"{year}-{month:02d}")
        seasonal_rows.append(row)
    record("vahan-derived.IN.auto.vahan.registrations.seasonality_recent", table_artifact(
        "auto.vahan.registrations.seasonality_recent",
        "Recent monthly seasonality in registrations",
        "vahan-derived",
        "VAHAN monthly state totals",
        VAHAN_URL,
        "registrations",
        seasonal_rows,
        metadata={"method": "Monthly all-state VAHAN totals for selected complete calendar years. 2020 is retained as the Covid disruption year; 2021-22 are omitted from this visual to keep the comparison legible."},
    ))

    # SIAM endpoint mix, latest full FY only.
    siam_rows = []
    for label, path in [
        ("Two-wheelers", "data/series/siam.IN.auto.domestic_sales.two_wheelers_annual.json"),
        ("Passenger vehicles", "data/series/siam.IN.auto.domestic_sales.passenger_vehicles_annual.json"),
        ("Commercial vehicles", "data/series/siam.IN.auto.domestic_sales.commercial_vehicles_annual.json"),
        ("Three-wheelers", "data/series/siam.IN.auto.domestic_sales.three_wheelers_annual.json"),
    ]:
        artifact = read_json(ROOT / path)
        latest = [obs for obs in artifact["observations"] if obs["date"] == "2026-03-31"][0]
        siam_rows.append({"label": label, "value": latest["value"]})
    record("vahan-derived.IN.auto.siam.domestic_sales.mix_fy_2026", table_artifact(
        "auto.siam.domestic_sales.mix_fy_2026",
        "SIAM domestic sales by category, FY 2025-26",
        "siam-derived",
        "SIAM domestic sales press release, FY 2025-26",
        SIAM_2026_URL,
        "vehicles sold wholesale",
        siam_rows,
        metadata={"method": "Category totals from SIAM's FY 2025-26 press release. SIAM reports wholesale domestic sales, not retail registrations, so compare broad scale and mix rather than exact counts with VAHAN."},
    ))

    # Vehicle-loan stock from IDH/RBI selected long table.
    credit = read_json(ROOT / "data/series/indiadatahub.IN.banking.idh.credit_monthly.long.json")
    loan_monthly = {}
    for row in credit.get("rows", []):
        if row.get("label") == "Vehicle Loans" and row.get("variant") == "adjustedForMergers":
            value = row.get("NumericValue")
            if value is not None:
                loan_monthly[str(row["period"])] = float(value)
    record("vahan-derived.IN.auto.credit.vehicle_loans_monthly", series_artifact(
        "auto.credit.vehicle_loans_monthly",
        "Outstanding vehicle loans",
        "indiadatahub-derived",
        "RBI sectoral credit, Vehicle Loans, adjusted for mergers",
        IDH_URL,
        "INR crore",
        [{"date": date, "value": value} for date, value in sorted(loan_monthly.items())],
        frequency="monthly",
        metadata={"method": "Vehicle Loans rows from IndiaDataHub's RBI banking/credit feed, adjusted for mergers. This is outstanding loan stock, not new disbursements."},
    ))
    if loan_monthly:
        base_date = sorted(loan_monthly)[0]
        base_loan = loan_monthly[base_date]
        vahan_monthly_since = {date: value for date, value in all_monthly.items() if date >= base_date and date <= max(loan_monthly)}
        base_vahan = vahan_monthly_since.get(base_date)
        record("vahan-derived.IN.auto.credit.vehicle_loans_index_2019_100", series_artifact(
            "auto.credit.vehicle_loans_index_2019_100",
            "Outstanding vehicle loans index",
            "indiadatahub-derived",
            "RBI sectoral credit, Vehicle Loans, adjusted for mergers",
            IDH_URL,
            "index, Jan 2019 = 100",
            [{"date": date, "value": round(value / base_loan * 100, 3)} for date, value in sorted(loan_monthly.items())],
            frequency="monthly",
            metadata={"method": "Outstanding Vehicle Loans indexed to the first available month, January 2019 = 100."},
        ))
        if base_vahan:
            record("vahan-derived.IN.auto.vahan.registrations.index_2019_100_monthly", series_artifact(
                "auto.vahan.registrations.index_2019_100_monthly",
                "Vehicle registrations index",
                "vahan-derived",
                "VAHAN monthly registrations",
                VAHAN_URL,
                "index, Jan 2019 = 100",
                [{"date": date, "value": round(value / base_vahan * 100, 3)} for date, value in sorted(vahan_monthly_since.items())],
                frequency="monthly",
                metadata={"method": "VAHAN monthly registrations indexed to January 2019 = 100 for comparison with outstanding vehicle-loan stock."},
            ))
        loan_yoy = monthly_yoy(loan_monthly)
        registration_credit_yoy = monthly_yoy({date: float(value) for date, value in vahan_monthly_since.items()})
        overlapping_months = sorted(set(loan_yoy) & set(registration_credit_yoy))
        record("vahan-derived.IN.auto.credit.vehicle_loans_yoy_monthly", series_artifact(
            "auto.credit.vehicle_loans_yoy_monthly",
            "Outstanding vehicle-loan stock growth",
            "indiadatahub-derived",
            "RBI sectoral credit, Vehicle Loans, adjusted for mergers, year-on-year change",
            IDH_URL,
            "% year-on-year",
            [{"date": date, "value": round(loan_yoy[date], 3)} for date in overlapping_months],
            frequency="monthly",
            metadata={"method": "Year-on-year percentage change in outstanding Vehicle Loans from IndiaDataHub's RBI banking/credit feed, restricted to months that overlap VAHAN monthly registration growth. This is loan-stock growth, not fresh loan disbursement growth."},
        ))
        record("vahan-derived.IN.auto.vahan.registrations.yoy_credit_window_monthly", series_artifact(
            "auto.vahan.registrations.yoy_credit_window_monthly",
            "Vehicle registration growth, credit-window months",
            "vahan-derived",
            "VAHAN monthly registrations, year-on-year change",
            VAHAN_URL,
            "% year-on-year",
            [{"date": date, "value": round(registration_credit_yoy[date], 3)} for date in overlapping_months],
            frequency="monthly",
            metadata={"method": "Year-on-year percentage change in VAHAN monthly registrations, restricted to months that overlap outstanding vehicle-loan stock growth."},
        ))

    # Deduped transport and fuel CPI lines from MoSPI CPI artifacts.
    transport_inputs = [
        ("combined_transport", "Transport and communication CPI index, combined", "prices.cpi.combined.transport_communication.index", "data/series/mospi.IN.prices.cpi.combined.transport_communication.index.json", "index, 2012 = 100"),
        ("rural_transport", "Transport and communication CPI index, rural", "prices.cpi.rural.transport_communication.index", "data/series/mospi.IN.prices.cpi.rural.transport_communication.index.json", "index, 2012 = 100"),
        ("urban_transport", "Transport and communication CPI index, urban", "prices.cpi.urban.transport_communication.index", "data/series/mospi.IN.prices.cpi.urban.transport_communication.index.json", "index, 2012 = 100"),
        ("combined_transport_inflation", "Transport and communication CPI inflation, combined", "prices.cpi.combined.transport_communication.inflation", "data/series/mospi.IN.prices.cpi.combined.transport_communication.inflation.json", "% year-on-year"),
        ("rural_transport_inflation", "Transport and communication CPI inflation, rural", "prices.cpi.rural.transport_communication.inflation", "data/series/mospi.IN.prices.cpi.rural.transport_communication.inflation.json", "% year-on-year"),
        ("urban_transport_inflation", "Transport and communication CPI inflation, urban", "prices.cpi.urban.transport_communication.inflation", "data/series/mospi.IN.prices.cpi.urban.transport_communication.inflation.json", "% year-on-year"),
    ]
    cpi_monthly_for_corr = {}
    for key, title, source_indicator, path, unit in transport_inputs:
        monthly = dedupe_monthly_observations(path)
        cpi_monthly_for_corr[key] = monthly
        record(f"vahan-derived.IN.auto.transport_cpi.{key}", series_artifact(
            f"auto.transport_cpi.{key}",
            title,
            "mospi-derived",
            source_indicator,
            MOSPI_CPI_URL,
            unit,
            [{"date": date, "value": value} for date, value in monthly.items()],
            frequency="monthly",
            metadata={"method": f"Deduplicated MoSPI CPI observations for {title.lower()}."},
        ))

    fuel_for_corr = {}
    for key, label, path in [
        ("petrol", "Petrol CPI index", "data/series/mospi.IN.prices.cpi.item.petrol.index.json"),
        ("diesel", "Diesel CPI index", "data/series/mospi.IN.prices.cpi.item.diesel.index.json"),
    ]:
        monthly = dedupe_monthly_observations(path)
        fuel_for_corr[key] = monthly
        record(f"vahan-derived.IN.auto.fuel_price.{key}_cpi_index", series_artifact(
            f"auto.fuel_price.{key}_cpi_index",
            label,
            "mospi-derived",
            f"MoSPI CPI item index, {label}",
            MOSPI_CPI_URL,
            "index, 2012 = 100",
            [{"date": date, "value": value} for date, value in monthly.items()],
            frequency="monthly",
            metadata={"method": f"Deduplicated MoSPI CPI item-index observations for {label.lower()}."},
        ))

    registration_yoy = monthly_yoy({date: float(value) for date, value in all_monthly.items() if date <= "2025-12"})
    corr_rows = []
    corr_specs = [
        ("Transport CPI inflation, combined", cpi_monthly_for_corr["combined_transport_inflation"]),
        ("Transport CPI inflation, rural", cpi_monthly_for_corr["rural_transport_inflation"]),
        ("Transport CPI inflation, urban", cpi_monthly_for_corr["urban_transport_inflation"]),
        ("Petrol CPI inflation", monthly_yoy(fuel_for_corr["petrol"])),
        ("Diesel CPI inflation", monthly_yoy(fuel_for_corr["diesel"])),
    ]
    covid_months = {f"{year}-{month:02d}" for year in (2020, 2021) for month in range(1, 13)}
    for label, cpi_values in corr_specs:
        for mode, months in [
            ("all overlapping months", sorted(set(registration_yoy) & set(cpi_values))),
            ("excluding 2020-21", [m for m in sorted(set(registration_yoy) & set(cpi_values)) if m not in covid_months]),
        ]:
            xs = [registration_yoy[m] for m in months]
            ys = [cpi_values[m] for m in months]
            corr = pearson(xs, ys)
            if corr is not None:
                corr_rows.append({"label": f"{label}, {mode}", "value": round(corr, 3), "months": f"{months[0]} to {months[-1]}", "group": mode})
    record("vahan-derived.IN.auto.vahan.transport_cpi.correlation_summary", table_artifact(
        "auto.vahan.transport_cpi.correlation_summary",
        "Do transport prices move with registrations?",
        "vahan-derived",
        "VAHAN monthly registration growth and MoSPI transport/fuel CPI inflation",
        VAHAN_URL,
        "Pearson correlation",
        corr_rows,
        metadata={"method": "Pearson correlations between monthly year-on-year VAHAN registration growth and MoSPI transport/fuel CPI inflation. A negative value means higher transport/fuel inflation coincided with weaker registration growth in the overlapping months; this is an association test, not a causal model."},
    ))

    # Ember power context for EVs.
    carbon = read_json(ROOT / "data/series/ember.IN.carbon-intensity.yearly.json")
    carbon_obs = [{"date": str(row["date"]), "value": row["emissions_intensity_gco2_per_kwh"]} for row in carbon.get("rows", []) if row.get("emissions_intensity_gco2_per_kwh") is not None]
    record("vahan-derived.IN.auto.ember.grid.carbon_intensity", series_artifact(
        "auto.ember.grid.carbon_intensity",
        "India electricity carbon intensity",
        "ember-derived",
        "Ember yearly electricity data, carbon intensity",
        EMBER_URL,
        "gCO2/kWh",
        carbon_obs,
        metadata={"method": "India yearly electricity carbon-intensity rows from Ember. This is grid context for EV charging, not a vehicle dataset."},
    ))
    generation = read_json(ROOT / "data/series/ember.IN.electricity-generation.yearly.json")
    for source_label, key in [("Renewables", "renewables_share"), ("Wind and solar", "wind_solar_share")]:
        obs = [{"date": str(row["date"]), "value": row["share_of_generation_pct"]}
               for row in generation.get("rows", [])
               if row.get("series") == source_label and row.get("share_of_generation_pct") is not None]
        record(f"vahan-derived.IN.auto.ember.grid.{key}", series_artifact(
            f"auto.ember.grid.{key}",
            f"{source_label} share of electricity generation",
            "ember-derived",
            f"Ember yearly electricity generation, {source_label}",
            EMBER_URL,
            "% of generation",
            obs,
            metadata={"method": f"{source_label} share of India's yearly electricity generation from Ember. This provides grid context for EV charging, not vehicle adoption."},
        ))

    write_json(ROOT / "data" / "catalog" / "vahan-motorisation-derived-manifest.json", manifest)
    print(f"Wrote {len(manifest)} VAHAN motorisation article artifacts.")


if __name__ == "__main__":
    main()
