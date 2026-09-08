#!/usr/bin/env python3
"""Build the evidence layer for the World Bank income-classification article.

The release workbooks are the source of truth for 2025 levels and classifications.
The World Development Indicators API supplies the historical GNI-per-capita,
population, child-mortality, and manufacturing series used in derived comparisons.
Every remote payload is saved as a content-addressed snapshot before artifacts are
written.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

import openpyxl
import requests


ROOT = Path(__file__).resolve().parents[1]
SERIES_DIR = ROOT / "data" / "series"
SNAPSHOT_DIR = ROOT / "data" / "snapshots" / "worldbank-income-classifications"
CATALOG_PATH = ROOT / "data" / "catalog" / "worldbank-income-classifications-manifest.json"
FETCHED_AT = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Indica data journalism project / income-classification ingest"})

URLS = {
    "history": "https://ddh-openapi.worldbank.org/resources/DR0095334/download",
    "current_groups": "https://ddh-openapi.worldbank.org/resources/DR0095333/download",
    "gni": "https://datacatalogfiles.worldbank.org/ddh-published/0038127/DR0046430/GNI.xlsx",
    "gnipc": "https://datacatalogfiles.worldbank.org/ddh-published/0038128/DR0046433/GNIPC.xlsx",
    "gdp": "https://datacatalogfiles.worldbank.org/ddh-published/0038130/DR0046439/GDP.xlsx",
    "gdp_ppp": "https://datacatalogfiles.worldbank.org/ddh-published/0038129/DR0046436/GDP_PPP.xlsx",
    "population": "https://datacatalogfiles.worldbank.org/ddh-published/0038126/DR0046427/POP.xlsx",
    "blog": "https://blogs.worldbank.org/en/opendata/who-moves-up-and-why--a-closer-look-at-the-new-world-bank-group-",
    "country_groups": "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups",
    "atlas_method": "https://datahelpdesk.worldbank.org/knowledgebase/articles/77933-what-is-the-world-bank-atlas-method",
}

COUNTRY_NAMES = {
    "IND": "India",
    "BGD": "Bangladesh",
    "PAK": "Pakistan",
    "LKA": "Sri Lanka",
    "VNM": "Vietnam",
    "PHL": "Philippines",
    "IDN": "Indonesia",
    "CHN": "China",
    "THA": "Thailand",
    "MYS": "Malaysia",
    "KOR": "South Korea",
    "USA": "United States",
    "FSM": "Micronesia, Fed. Sts.",
    "JOR": "Jordan",
    "TGO": "Togo",
}

CLASS_LABELS = {
    "L": "Low income",
    "LM": "Lower middle income",
    "UM": "Upper middle income",
    "H": "High income",
}


def get_bytes(url: str) -> bytes:
    response = SESSION.get(url, timeout=90)
    response.raise_for_status()
    if not response.content:
        raise RuntimeError(f"Empty response from {url}")
    return response.content


def snapshot_bytes(name: str, body: bytes, extension: str) -> dict[str, str]:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(body).hexdigest()
    path = SNAPSHOT_DIR / f"{name}.{digest[:12]}.{extension}"
    if not path.exists():
        path.write_bytes(body)
    return {"path": str(path.relative_to(ROOT)), "sha256": digest}


def snapshot_json(name: str, payload: Any) -> dict[str, str]:
    body = (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode()
    return snapshot_bytes(name, body, "json")


def workbook(name: str, expected_sheet: str) -> tuple[openpyxl.Workbook, dict[str, str]]:
    body = get_bytes(URLS[name])
    snap = snapshot_bytes(name, body, "xlsx")
    wb = openpyxl.load_workbook(BytesIO(body), read_only=True, data_only=True)
    if expected_sheet not in wb.sheetnames:
        raise RuntimeError(f"{name}: expected sheet {expected_sheet!r}, got {wb.sheetnames}")
    return wb, snap


def wdi(indicator: str, countries: str = "all", start: int = 1987, end: int = 2025) -> tuple[list[dict[str, Any]], dict[str, str], str]:
    url = (
        f"https://api.worldbank.org/v2/country/{countries}/indicator/{indicator}"
        f"?format=json&per_page=20000&date={start}:{end}"
    )
    payload = SESSION.get(url, timeout=90).json()
    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        raise RuntimeError(f"Unexpected WDI response for {indicator}")
    snap = snapshot_json(f"wdi.{indicator}.{countries.replace(';', '_')}.{start}-{end}", payload)
    return payload[1], snap, url


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def series_artifact(
    *,
    indicator_id: str,
    title: str,
    source_indicator_id: str,
    source_url: str,
    unit: str,
    observations: list[dict[str, Any]],
    geography: dict[str, str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "worldbank-income-classifications",
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": "annual",
        "geography": geography or {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "metadata": metadata or {},
    }


def table_artifact(
    *,
    indicator_id: str,
    title: str,
    source_indicator_id: str,
    source_url: str,
    unit: str,
    rows: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
    source_id: str = "worldbank-income-classifications",
    geography: dict[str, str] | None = None,
) -> dict[str, Any]:
    dimensions = sorted({key for row in rows for key in row})
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": geography or {"type": "global", "id": "WORLD", "name": "World"},
        "dimensions": dimensions,
        "fetchedAt": FETCHED_AT,
        "rows": rows,
        "metadata": metadata or {},
    }


def emit(name: str, artifact: dict[str, Any], manifest: list[dict[str, Any]]) -> None:
    path = SERIES_DIR / f"worldbank-income-classifications.{name}.json"
    write_json(path, artifact)
    count = len(artifact.get("observations", artifact.get("rows", [])))
    manifest.append(
        {
            "status": "ready",
            "indicatorId": artifact["indicatorId"],
            "sourceIndicatorId": artifact["sourceIndicatorId"],
            "artifact": str(path.relative_to(ROOT)),
            "records": count,
            "fetchedAt": FETCHED_AT,
        }
    )


def number(value: Any) -> float | None:
    if value is None or value == "..":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.search(r"[\d,]+(?:\.\d+)?", str(value))
    return float(match.group(0).replace(",", "")) if match else None


def first_number(value: Any) -> float | None:
    return number(value)


def finite(value: Any) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value)


def keyed_wdi(rows: list[dict[str, Any]]) -> dict[str, dict[int, float]]:
    result: dict[str, dict[int, float]] = {}
    for row in rows:
        value = row.get("value")
        code = row.get("countryiso3code")
        year = row.get("date")
        if not code or value is None or not str(year).isdigit():
            continue
        result.setdefault(code, {})[int(year)] = float(value)
    return result


def latest_at_or_before(values: dict[int, float], year: int) -> tuple[int, float]:
    eligible = [(y, v) for y, v in values.items() if y <= year and finite(v)]
    if not eligible:
        raise RuntimeError(f"No observation at or before {year}")
    return max(eligible)


def parse_rank_sheet(ws: openpyxl.worksheet.worksheet.Worksheet, start_row: int = 6) -> dict[str, dict[str, Any]]:
    parsed: dict[str, dict[str, Any]] = {}
    for row in ws.iter_rows(min_row=start_row, values_only=True):
        code, rank, _, economy, value = row[:5]
        if isinstance(code, str) and len(code) == 3 and finite(rank) and finite(value):
            parsed[code] = {"rank": int(rank), "economy": economy, "value": float(value)}
    return parsed


def parse_gnipc(ws: openpyxl.worksheet.worksheet.Worksheet) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    atlas: dict[str, dict[str, Any]] = {}
    ppp: dict[str, dict[str, Any]] = {}
    for row in ws.iter_rows(min_row=8, values_only=True):
        atlas_code, atlas_rank, _, atlas_name, atlas_value = row[:5]
        ppp_rank, ppp_name, ppp_value, ppp_code = row[6], row[8], row[9], row[11]
        if (
            isinstance(atlas_code, str)
            and len(atlas_code) == 3
            and finite(atlas_rank)
            and finite(atlas_value)
        ):
            atlas[atlas_code] = {
                "rank": int(atlas_rank),
                "economy": atlas_name,
                "value": float(atlas_value),
            }
        if (
            isinstance(ppp_code, str)
            and len(ppp_code) == 3
            and finite(ppp_rank)
            and finite(ppp_value)
        ):
            ppp[ppp_code] = {
                "rank": int(ppp_rank),
                "economy": ppp_name,
                "value": float(ppp_value),
            }
    return atlas, ppp


def main() -> None:
    SERIES_DIR.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, Any]] = []
    snapshots: dict[str, dict[str, str]] = {}

    history_wb, snapshots["history"] = workbook("history", "Country Analytical History")
    current_wb, snapshots["current_groups"] = workbook("current_groups", "List of economies")
    gni_wb, snapshots["gni"] = workbook("gni", "GNI")
    gnipc_wb, snapshots["gnipc"] = workbook("gnipc", "GNIPC")
    gdp_wb, snapshots["gdp"] = workbook("gdp", "GDP")
    gdp_ppp_wb, snapshots["gdp_ppp"] = workbook("gdp_ppp", "GDP_PPP")
    population_wb, snapshots["population"] = workbook("population", "POP")
    for page_key in ("blog", "country_groups", "atlas_method"):
        snapshots[page_key] = snapshot_bytes(page_key, get_bytes(URLS[page_key]), "html")

    # Assert release labels before using the workbooks.
    assert "2025" in str(gni_wb["GNI"]["B1"].value)
    assert "2025" in str(gnipc_wb["GNIPC"]["B1"].value)
    assert "2025" in str(gdp_wb["GDP"]["B1"].value)
    assert "2025" in str(gdp_ppp_wb["GDP_PPP"]["B1"].value)
    assert "2025" in str(population_wb["POP"]["B1"].value)

    gni = parse_rank_sheet(gni_wb["GNI"])
    atlas, ppp = parse_gnipc(gnipc_wb["GNIPC"],)
    gdp = parse_rank_sheet(gdp_wb["GDP"])
    gdp_ppp = parse_rank_sheet(gdp_ppp_wb["GDP_PPP"], start_row=7)
    population_2025 = parse_rank_sheet(population_wb["POP"])

    # The workbooks rank only economies with a published estimate, and the
    # available universe differs by measure. Keep those denominators explicit.
    ranked_universes = {
        "gdpMarket": len(gdp),
        "gdpPpp": len(gdp_ppp),
        "gniAtlasPerPerson": len(atlas),
        "gniPppPerPerson": len(ppp),
    }

    current: dict[str, dict[str, Any]] = {}
    for economy, code, region, income_group, lending in current_wb["List of economies"].iter_rows(
        min_row=2, values_only=True
    ):
        if isinstance(code, str) and len(code) == 3:
            current[code] = {
                "economy": economy,
                "region": region,
                "incomeGroup": income_group,
                "lendingCategory": lending,
            }

    history_ws = history_wb["Country Analytical History"]
    history_year_row = list(next(history_ws.iter_rows(min_row=6, max_row=6, values_only=True)))
    history_year_cols = {
        index: int(value)
        for index, value in enumerate(history_year_row)
        if isinstance(value, int) and 1987 <= value <= 2025
    }
    classifications: dict[str, dict[int, str]] = {}
    names: dict[str, str] = {}
    for row in history_ws.iter_rows(min_row=7, values_only=True):
        code, economy = row[0], row[1]
        if not isinstance(code, str) or len(code) != 3:
            continue
        names[code] = str(economy)
        classifications[code] = {
            year: str(row[index])
            for index, year in history_year_cols.items()
            if row[index] in CLASS_LABELS
        }

    thresholds_ws = history_wb["Thresholds"]
    threshold_year_row = list(next(thresholds_ws.iter_rows(min_row=7, max_row=7, values_only=True)))
    threshold_rows = {
        "ida_historical": list(next(thresholds_ws.iter_rows(min_row=12, max_row=12, values_only=True))),
        "ibrd_graduation": list(next(thresholds_ws.iter_rows(min_row=15, max_row=15, values_only=True))),
        "ida_allocation": list(next(thresholds_ws.iter_rows(min_row=17, max_row=17, values_only=True))),
        "low": list(next(thresholds_ws.iter_rows(min_row=21, max_row=21, values_only=True))),
        "lower_middle": list(next(thresholds_ws.iter_rows(min_row=22, max_row=22, values_only=True))),
        "upper_middle": list(next(thresholds_ws.iter_rows(min_row=23, max_row=23, values_only=True))),
        "high": list(next(thresholds_ws.iter_rows(min_row=24, max_row=24, values_only=True))),
    }
    thresholds: dict[int, dict[str, float]] = {}
    for index, raw_year in enumerate(threshold_year_row):
        if not isinstance(raw_year, int) or raw_year < 1987 or raw_year > 2025:
            continue
        low_max = first_number(threshold_rows["low"][index])
        lm_min = first_number(threshold_rows["lower_middle"][index])
        um_min = first_number(threshold_rows["upper_middle"][index])
        high_min = first_number(threshold_rows["high"][index])
        if not all(finite(value) for value in (low_max, lm_min, um_min, high_min)):
            continue
        thresholds[raw_year] = {
            "lowMax": float(low_max),
            "lowerMiddleMin": float(lm_min),
            "upperMiddleMin": float(um_min),
            "highMin": float(high_min),
            "idaHistoricalMax": float(first_number(threshold_rows["ida_historical"][index]) or 0),
            "idaAllocationMax": float(first_number(threshold_rows["ida_allocation"][index]) or 0),
            "ibrdGraduationStart": float(first_number(threshold_rows["ibrd_graduation"][index]) or 0),
        }

    gni_pc_rows, snapshots["wdi_gni_pc"], gni_pc_url = wdi("NY.GNP.PCAP.CD")
    pop_rows, snapshots["wdi_population"], pop_url = wdi("SP.POP.TOTL")
    gni_lcu_rows, snapshots["wdi_gni_lcu"], gni_lcu_url = wdi("NY.GNP.MKTP.CN", "IND", 2015, 2025)
    gni_pc_by_country = keyed_wdi(gni_pc_rows)
    pop_by_country = keyed_wdi(pop_rows)
    gni_lcu = keyed_wdi(gni_lcu_rows)["IND"]

    # Release-level invariants. These fail loudly if a workbook layout or estimate changes.
    assert atlas["IND"]["value"] == 2760
    assert ppp["IND"]["value"] == 11600
    assert atlas["IND"]["rank"] == 156
    assert ppp["IND"]["rank"] == 132
    assert ranked_universes == {
        "gdpMarket": 204,
        "gdpPpp": 197,
        "gniAtlasPerPerson": 200,
        "gniPppPerPerson": 196,
    }
    assert round(gni["IND"]["value"]) == 4_036_219
    assert round(gdp["IND"]["value"]) == 3_956_067
    assert round(gdp_ppp["IND"]["value"]) == 17_197_369
    assert round(population_2025["IND"]["value"]) == 1_463_866
    assert thresholds[2025]["upperMiddleMin"] == 4636
    assert thresholds[2025]["highMin"] == 14375
    assert current["IND"]["incomeGroup"] == "Lower middle income"
    assert current["IND"]["lendingCategory"] == "IBRD"
    assert abs(gni_pc_by_country["IND"][2025] - atlas["IND"]["value"]) < 1

    derived_meta = {
        "release": "World Bank 2025 estimates published July 2026",
        "estimate": True,
        "revisionWarning": "The 2025 values are estimates and may be revised.",
        "rounding": "Displayed values should be rounded; derived ratios retain one decimal place.",
    }

    release_series = [
        (
            "india-atlas-gni-total",
            "econ.income_classification.india_atlas_gni_total",
            "India gross national income, Atlas method",
            "GNI 2025",
            URLS["gni"],
            "current US$",
            gni["IND"]["value"] * 1_000_000,
            gni["IND"]["rank"],
        ),
        (
            "india-gdp-market-total",
            "econ.income_classification.india_gdp_market_total",
            "India gross domestic product at market exchange rates",
            "GDP 2025",
            URLS["gdp"],
            "current US$",
            gdp["IND"]["value"] * 1_000_000,
            gdp["IND"]["rank"],
        ),
        (
            "india-gdp-ppp-total",
            "econ.income_classification.india_gdp_ppp_total",
            "India gross domestic product at purchasing power parity",
            "GDP_PPP 2025",
            URLS["gdp_ppp"],
            "current international $",
            gdp_ppp["IND"]["value"] * 1_000_000,
            gdp_ppp["IND"]["rank"],
        ),
        (
            "india-population",
            "econ.income_classification.india_population",
            "India population",
            "POP 2025",
            URLS["population"],
            "people",
            population_2025["IND"]["value"] * 1_000,
            population_2025["IND"]["rank"],
        ),
    ]
    for name, indicator_id, title, source_indicator_id, source_url, unit, value, rank in release_series:
        emit(
            name,
            series_artifact(
                indicator_id=indicator_id,
                title=title,
                source_indicator_id=source_indicator_id,
                source_url=source_url,
                unit=unit,
                observations=[{"date": "2025", "value": value}],
                metadata={**derived_meta, "releaseRank": rank},
            ),
            manifest,
        )

    # One economy, four ranks. The workbook universes contain economies with a
    # published estimate, so these are release-workbook ranks rather than a claim
    # about every sovereign state in the world.
    rank_rows = [
        {"label": "PPP GDP, total", "value": gdp_ppp["IND"]["rank"], "universe": ranked_universes["gdpPpp"], "group": "Whole economy", "date": "2025"},
        {"label": "GDP at market rates, total", "value": gdp["IND"]["rank"], "universe": ranked_universes["gdpMarket"], "group": "Whole economy", "date": "2025"},
        {"label": "PPP GNI per person", "value": ppp["IND"]["rank"], "universe": ranked_universes["gniPppPerPerson"], "group": "Per person", "date": "2025"},
        {"label": "Atlas GNI per person", "value": atlas["IND"]["rank"], "universe": ranked_universes["gniAtlasPerPerson"], "group": "Per person", "date": "2025"},
    ]
    assert [row["value"] for row in rank_rows] == [3, 6, 132, 156]
    emit(
        "india-total-and-per-person-ranks",
        table_artifact(
            indicator_id="econ.income_classification.india_total_and_per_person_ranks",
            title="India's total-economy and per-person ranks in the World Bank 2025 workbooks",
            source_indicator_id="GDP, GDP_PPP and GNIPC 2025 workbook rankings",
            source_url=URLS["blog"],
            unit="rank, 1 is highest",
            rows=rank_rows,
            metadata={
                **derived_meta,
                "method": "Ranks transcribed from the 2025 World Bank GDP, GDP PPP and GNI-per-capita release workbooks.",
                "warning": "Each rank covers economies with a published estimate in that workbook. Total-economy and per-person ranks answer different questions.",
                "rankedUniverses": ranked_universes,
                "inputs": [URLS["gdp"], URLS["gdp_ppp"], URLS["gnipc"]],
            },
        ),
        manifest,
    )

    gnipc_rows = []
    for code in ["IND", "BGD", "PAK", "LKA", "VNM", "PHL", "IDN", "CHN", "THA", "MYS", "KOR", "USA"]:
        gnipc_rows.append(
            {
                "label": COUNTRY_NAMES[code],
                "code": code,
                "atlas": atlas[code]["value"],
                "ppp": ppp[code]["value"],
                "atlasRank": atlas[code]["rank"],
                "date": "2025",
            }
        )
    emit(
        "atlas-and-ppp-gni-per-capita",
        table_artifact(
            indicator_id="econ.income_classification.atlas_and_ppp_gni_per_capita",
            title="Atlas and PPP gross national income per capita for selected economies",
            source_indicator_id="GNIPC 2025 Atlas and PPP",
            source_url=URLS["gnipc"],
            unit="US$ or international $ per person",
            rows=gnipc_rows,
            metadata=derived_meta,
        ),
        manifest,
    )

    progress_codes = ["IND", "CHN", "IDN", "VNM", "BGD", "LKA"]
    for code in progress_codes:
        observations = []
        for year in range(1987, 2026):
            value = gni_pc_by_country.get(code, {}).get(year)
            threshold = thresholds.get(year, {}).get("upperMiddleMin")
            if finite(value) and finite(threshold):
                observations.append({"date": str(year), "value": round(100 * value / threshold, 1)})
        indicator_id = f"econ.income_classification.progress_to_upper_middle.{code.lower()}"
        emit(
            f"progress-to-upper-middle.{code.lower()}",
            series_artifact(
                indicator_id=indicator_id,
                title=f"{COUNTRY_NAMES[code]} GNI per capita as a share of the upper-middle-income threshold",
                source_indicator_id="NY.GNP.PCAP.CD + historical analytical thresholds",
                source_url=URLS["history"],
                unit="% of upper-middle-income threshold",
                observations=observations,
                geography={"type": "country", "id": code, "name": COUNTRY_NAMES[code]},
                metadata={
                    **derived_meta,
                    "method": "Atlas-method GNI per capita divided by that year's upper-middle-income entry threshold.",
                    "inputs": [gni_pc_url, URLS["history"]],
                },
            ),
            manifest,
        )

    emit(
        "progress-to-upper-middle.threshold",
        series_artifact(
            indicator_id="econ.income_classification.progress_to_upper_middle.threshold",
            title="Upper-middle-income entry line",
            source_indicator_id="Historical analytical upper-middle-income threshold",
            source_url=URLS["history"],
            unit="% of upper-middle-income threshold",
            observations=[{"date": str(year), "value": 100} for year in range(1987, 2026)],
            geography={"type": "global", "id": "WORLD", "name": "World Bank analytical threshold"},
            metadata={
                **derived_meta,
                "method": "Constant 100 index line used to display the crossing boundary beside country ratios.",
                "input": URLS["history"],
            },
        ),
        manifest,
    )

    # How the population distribution across income groups changed.
    global_rows = []
    for year in (1987, 2025):
        totals = {key: 0.0 for key in CLASS_LABELS}
        assessed_total = 0.0
        for code, year_map in classifications.items():
            category = year_map.get(year)
            pop_value = pop_by_country.get(code, {}).get(year)
            if category in totals and finite(pop_value):
                totals[category] += pop_value
                assessed_total += pop_value
        for category in ("L", "LM", "UM", "H"):
            global_rows.append(
                {
                    "label": CLASS_LABELS[category],
                    "value": round(100 * totals[category] / assessed_total, 1),
                    "group": str(year),
                    "date": str(year),
                }
            )
    emit(
        "global-population-by-class",
        table_artifact(
            indicator_id="econ.income_classification.global_population_by_class",
            title="Share of assessed population by World Bank income group",
            source_indicator_id="Historical analytical classification + SP.POP.TOTL",
            source_url=URLS["history"],
            unit="% of assessed population",
            rows=global_rows,
            metadata={
                **derived_meta,
                "method": "Country populations summed within each year's analytical income class, divided by the population of classified economies with population data.",
                "inputs": [URLS["history"], pop_url],
            },
        ),
        manifest,
    )

    # The lower-middle-income population is unusually concentrated. India alone
    # accounts for about half, which is invisible in a country-count view.
    lm_populations = []
    for code, year_map in classifications.items():
        pop_value = pop_by_country.get(code, {}).get(2025)
        if year_map.get(2025) == "LM" and finite(pop_value):
            lm_populations.append((code, names.get(code, code), float(pop_value)))
    lm_populations.sort(key=lambda item: item[2], reverse=True)
    lm_population_total = sum(value for _, _, value in lm_populations)
    top_lm = lm_populations[:5]
    lower_middle_rows = [
        {
            "label": name,
            "value": round(100 * value / lm_population_total, 1),
            "populationMillions": round(value / 1_000_000, 1),
            "date": "2025",
        }
        for _, name, value in top_lm
    ]
    lower_middle_rows.append(
        {
            "label": "Other lower-middle-income economies",
            "value": round(100 * (lm_population_total - sum(value for _, _, value in top_lm)) / lm_population_total, 1),
            "populationMillions": round((lm_population_total - sum(value for _, _, value in top_lm)) / 1_000_000, 1),
            "date": "2025",
        }
    )
    assert 45 <= lower_middle_rows[0]["value"] <= 55
    assert abs(sum(row["value"] for row in lower_middle_rows) - 100) <= 0.2
    emit(
        "lower-middle-population-concentration",
        table_artifact(
            indicator_id="econ.income_classification.lower_middle_population_concentration",
            title="Share of the population living in lower-middle-income economies",
            source_indicator_id="Historical analytical classification + SP.POP.TOTL",
            source_url=URLS["history"],
            unit="% of lower-middle-income population",
            rows=lower_middle_rows,
            metadata={
                **derived_meta,
                "share": True,
                "method": "Population of each economy classified lower middle income in 2025 divided by the population of all classified lower-middle-income economies with population data.",
                "inputs": [URLS["history"], pop_url],
            },
        ),
        manifest,
    )

    # Countries that first occupied India's current relative position and later crossed.
    cohort_rows = []
    for code in ["CHN", "LKA", "IDN", "VNM", "PHL", "THA"]:
        ratios = {
            year: 100 * value / thresholds[year]["upperMiddleMin"]
            for year, value in gni_pc_by_country.get(code, {}).items()
            if year in thresholds and classifications.get(code, {}).get(year) == "LM"
        }
        start_year = min((year for year, ratio in ratios.items() if 55 <= ratio <= 65), default=None)
        crossing_year = min(
            (
                year
                for year, category in classifications.get(code, {}).items()
                if start_year is not None and year > start_year and category in ("UM", "H")
            ),
            default=None,
        )
        if start_year and crossing_year:
            cohort_rows.append(
                {
                    "label": COUNTRY_NAMES[code],
                    "value": crossing_year - start_year,
                    "startYear": start_year,
                    "crossingYear": crossing_year,
                    "date": str(crossing_year),
                }
            )
    cohort_rows.sort(key=lambda row: row["value"])
    emit(
        "years-from-india-position-to-crossing",
        table_artifact(
            indicator_id="econ.income_classification.years_from_india_position_to_crossing",
            title="Years selected peers took to move from India's current relative position to upper middle income",
            source_indicator_id="NY.GNP.PCAP.CD + historical analytical classifications and thresholds",
            source_url=URLS["history"],
            unit="years",
            rows=cohort_rows,
            metadata={
                **derived_meta,
                "method": "For selected Asian peers that crossed, find the first lower-middle-income year at 55-65% of the upper-middle threshold, then count years to the first upper-middle or high-income classification.",
                "selection": "Selected Asian comparators with a completed transition. Countries that never crossed are excluded, so this is not a probability estimate.",
                "inputs": [gni_pc_url, URLS["history"]],
            },
        ),
        manifest,
    )

    # Use the full observed cohort and Kaplan-Meier estimates so countries without
    # a completed crossing contribute their available follow-up instead of being
    # silently discarded. Starts in 1987 are excluded because the history begins
    # there and their true first arrival in the band is left-censored.
    cohort_followup = []
    for code, year_map in classifications.items():
        starts = []
        for year, category in year_map.items():
            value = gni_pc_by_country.get(code, {}).get(year)
            threshold = thresholds.get(year, {}).get("upperMiddleMin")
            if year > 1987 and category == "LM" and finite(value) and finite(threshold):
                ratio = 100 * float(value) / float(threshold)
                if 55 <= ratio <= 65:
                    starts.append(year)
        if not starts:
            continue
        start_year = min(starts)
        crossing_year = min(
            (
                year
                for year, category in year_map.items()
                if year > start_year and category in ("UM", "H")
            ),
            default=None,
        )
        duration = (crossing_year or 2025) - start_year
        cohort_followup.append(
            {
                "code": code,
                "startYear": start_year,
                "duration": duration,
                "event": crossing_year is not None,
                "crossingYear": crossing_year,
            }
        )
    assert 60 <= len(cohort_followup) <= 75
    assert 35 <= sum(1 for row in cohort_followup if row["event"]) <= 50

    def km_crossed_by(horizon: int) -> float:
        survival = 1.0
        event_times = sorted(
            {
                row["duration"]
                for row in cohort_followup
                if row["event"] and row["duration"] <= horizon
            }
        )
        for event_time in event_times:
            at_risk = sum(1 for row in cohort_followup if row["duration"] >= event_time)
            events = sum(
                1
                for row in cohort_followup
                if row["event"] and row["duration"] == event_time
            )
            survival *= 1 - events / at_risk
        return 100 * (1 - survival)

    all_cohort_rows = [
        {
            "label": f"Within {horizon} years",
            "value": round(km_crossed_by(horizon), 1),
            "date": "2025",
        }
        for horizon in (5, 10, 15, 20)
    ]
    assert [row["value"] for row in all_cohort_rows] == [13.3, 29.2, 48.0, 64.3]
    emit(
        "all-economies-crossing-experience",
        table_artifact(
            indicator_id="econ.income_classification.all_economies_crossing_experience",
            title="How often economies at India's relative position crossed the upper-middle line",
            source_indicator_id="NY.GNP.PCAP.CD + historical analytical classifications and thresholds",
            source_url=URLS["history"],
            unit="% crossing at least once",
            rows=all_cohort_rows,
            metadata={
                **derived_meta,
                "method": "Kaplan-Meier cumulative first-crossing estimate. Entry is the first observed post-1987 lower-middle-income year at 55-65% of the upper-middle threshold; economies not crossing by 2025 are right-censored.",
                "cohortSize": len(cohort_followup),
                "events": sum(1 for row in cohort_followup if row["event"]),
                "censored": sum(1 for row in cohort_followup if not row["event"]),
                "warning": "This is historical experience across heterogeneous economies, not India's probability or forecast.",
                "inputs": [gni_pc_url, URLS["history"]],
            },
        ),
        manifest,
    )

    # A first crossing is not always permanent. Separate economies that never
    # returned below upper middle, those that fell and recovered, and those still
    # below the line in 2025.
    observed_crossers = []
    for code, year_map in classifications.items():
        ordered_years = sorted(year_map)
        first_crossing = next(
            (
                year
                for year in ordered_years
                if year_map[year] in ("UM", "H")
                and any(year_map[prior] in ("L", "LM") for prior in ordered_years if prior < year)
            ),
            None,
        )
        if first_crossing is None:
            continue
        later_below = any(
            year_map[year] in ("L", "LM")
            for year in ordered_years
            if year > first_crossing
        )
        observed_crossers.append(
            {
                "code": code,
                "laterBelow": later_below,
                "belowIn2025": year_map.get(2025) in ("L", "LM"),
            }
        )
    never_below = sum(1 for row in observed_crossers if not row["laterBelow"])
    fell_recovered = sum(
        1 for row in observed_crossers if row["laterBelow"] and not row["belowIn2025"]
    )
    still_below = sum(1 for row in observed_crossers if row["belowIn2025"])
    assert (len(observed_crossers), never_below, fell_recovered, still_below) == (76, 54, 16, 6)
    reversal_rows = [
        {"label": "Never fell back", "value": round(100 * never_below / len(observed_crossers), 1), "date": "2025"},
        {"label": "Fell back, then recovered", "value": round(100 * fell_recovered / len(observed_crossers), 1), "date": "2025"},
        {"label": "Below the line in 2025", "value": round(100 * still_below / len(observed_crossers), 1), "date": "2025"},
    ]
    emit(
        "upper-middle-crossing-reversals",
        table_artifact(
            indicator_id="econ.income_classification.upper_middle_crossing_reversals",
            title="What happened after economies first crossed into upper middle income",
            source_indicator_id="Historical analytical classifications, 1987-2025",
            source_url=URLS["history"],
            unit="% of observed first crossers",
            rows=reversal_rows,
            metadata={
                **derived_meta,
                "share": True,
                "method": "Among economies observed moving from low or lower middle income into upper middle or high income during 1987-2025, classify whether they ever returned below upper middle and whether they remained below in 2025.",
                "observedCrossers": len(observed_crossers),
                "warning": "The workbook starts in 1987, so this covers observed transitions within the available history rather than every transition a country has ever made.",
            },
        ),
        manifest,
    )

    # The same two countries swap places depending on the conversion rule.
    ruler_rows = [
        {
            "label": "Bangladesh leads India under Atlas",
            "value": round(100 * (atlas["BGD"]["value"] / atlas["IND"]["value"] - 1), 1),
            "group": "Atlas method",
            "date": "2025",
        },
        {
            "label": "India leads Bangladesh under PPP",
            "value": round(100 * (ppp["IND"]["value"] / ppp["BGD"]["value"] - 1), 1),
            "group": "PPP",
            "date": "2025",
        },
    ]
    emit(
        "india-bangladesh-ruler-swap",
        table_artifact(
            indicator_id="econ.income_classification.india_bangladesh_ruler_swap",
            title="India and Bangladesh swap places under Atlas and PPP",
            source_indicator_id="GNIPC 2025 Atlas and PPP",
            source_url=URLS["gnipc"],
            unit="% lead",
            rows=ruler_rows,
            metadata={
                **derived_meta,
                "method": "Percentage lead of the higher country under each conversion method.",
                "atlasValues": {"India": atlas["IND"]["value"], "Bangladesh": atlas["BGD"]["value"]},
                "pppValues": {"India": ppp["IND"]["value"], "Bangladesh": ppp["BGD"]["value"]},
            },
        ),
        manifest,
    )

    multiple_rows = []
    for code in ["IND", "BGD", "PAK", "LKA", "VNM", "PHL", "IDN", "CHN", "THA", "MYS", "KOR", "USA"]:
        multiple_rows.append(
            {
                "label": COUNTRY_NAMES[code],
                "value": round(ppp[code]["value"] / atlas[code]["value"], 1),
                "group": current.get(code, {}).get("incomeGroup") or "Not classified",
                "date": "2025",
            }
        )
    multiple_rows.sort(key=lambda row: row["value"], reverse=True)
    emit(
        "ppp-atlas-multiple",
        table_artifact(
            indicator_id="econ.income_classification.ppp_atlas_multiple",
            title="How much higher PPP GNI per capita is than Atlas GNI per capita",
            source_indicator_id="GNIPC 2025 Atlas and PPP",
            source_url=URLS["gnipc"],
            unit="PPP-to-Atlas multiple",
            rows=multiple_rows,
            metadata={
                **derived_meta,
                "method": "PPP GNI per capita divided by Atlas-method GNI per capita.",
                "interpretation": "A larger multiple means local purchasing power is high relative to the market-exchange-rate income used for classification.",
            },
        ),
        manifest,
    )

    # The six upward movers highlighted by the World Bank, including non-growth revisions.
    mover_mechanisms = {
        "VNM": "Growth and exports",
        "PHL": "Broad-based growth",
        "LKA": "Economic recovery",
        "FSM": "Post-Covid recovery",
        "JOR": "GDP rebasing",
        "TGO": "Population revision",
    }
    mover_rows = []
    for code, mechanism in mover_mechanisms.items():
        values = gni_pc_by_country[code]
        mover_rows.append(
            {
                "label": COUNTRY_NAMES[code],
                "value": round(100 * (values[2025] / values[2024] - 1), 1),
                "group": mechanism,
                "from": values[2024],
                "to": values[2025],
                "date": "2025",
            }
        )
    mover_rows.sort(key=lambda row: row["value"], reverse=True)
    emit(
        "movers-gni-pc-change",
        table_artifact(
            indicator_id="econ.income_classification.movers_gni_pc_change",
            title="Change in Atlas GNI per capita for the economies that moved up in 2025",
            source_indicator_id="NY.GNP.PCAP.CD + World Bank mover analysis",
            source_url=URLS["blog"],
            unit="% change from 2024",
            rows=mover_rows,
            metadata={
                **derived_meta,
                "method": "Percentage change in Atlas-method GNI per capita from 2024 to 2025.",
                "mechanisms": mover_mechanisms,
                "warning": "Classification changes can reflect growth, exchange rates, rebasing, population revisions, or recovery. The bars are not a causal decomposition.",
            },
        ),
        manifest,
    )

    # Analytical labels and lending rules are separate ladders.
    ladder_rows = [
        {"label": "IDA allocation ceiling", "value": thresholds[2025]["idaAllocationMax"], "group": "Operational", "date": "2025"},
        {"label": "India", "value": atlas["IND"]["value"], "group": "India", "date": "2025"},
        {"label": "Upper-middle income starts", "value": thresholds[2025]["upperMiddleMin"], "group": "Analytical", "date": "2025"},
        {"label": "IBRD graduation discussion starts", "value": thresholds[2025]["ibrdGraduationStart"], "group": "Operational", "date": "2025"},
        {"label": "High income starts", "value": thresholds[2025]["highMin"], "group": "Analytical", "date": "2025"},
    ]
    emit(
        "classification-and-lending-ladder",
        table_artifact(
            indicator_id="econ.income_classification.classification_and_lending_ladder",
            title="Income classification and World Bank lending thresholds are different ladders",
            source_indicator_id="2025 analytical and operational thresholds",
            source_url=URLS["history"],
            unit="Atlas GNI per capita, US$",
            rows=ladder_rows,
            metadata={
                **derived_meta,
                "method": "Values transcribed from the World Bank historical thresholds workbook and the 2025 GNIPC release.",
                "warning": "Crossing an analytical income threshold does not automatically determine lending eligibility or graduation.",
            },
        ),
        manifest,
    )

    # Arithmetic continuations of India's relative catch-up, explicitly not forecasts.
    india_ratio = {
        year: gni_pc_by_country["IND"][year] / thresholds[year]["upperMiddleMin"]
        for year in range(1987, 2026)
        if year in gni_pc_by_country["IND"] and year in thresholds
    }
    scenario_rows = []
    for start_year in (2007, 2015, 2021, 2019):
        years = 2025 - start_year
        relative_growth = (india_ratio[2025] / india_ratio[start_year]) ** (1 / years) - 1
        years_to_cross = math.log(1 / india_ratio[2025]) / math.log(1 + relative_growth)
        scenario_rows.append(
            {
                "label": f"{start_year}-2025 pace",
                "value": round(years_to_cross),
                "projectedYear": 2025 + round(years_to_cross),
                "relativeCatchupRate": round(100 * relative_growth, 2),
                "date": "2025",
            }
        )
    scenario_rows.sort(key=lambda row: row["value"])
    emit(
        "india-crossing-arithmetic",
        table_artifact(
            indicator_id="econ.income_classification.india_crossing_arithmetic",
            title="When India would cross if past relative catch-up rates continued",
            source_indicator_id="NY.GNP.PCAP.CD + historical upper-middle-income threshold",
            source_url=URLS["history"],
            unit="years after 2025",
            rows=scenario_rows,
            metadata={
                **derived_meta,
                "method": "Compound annual growth in India's ratio to the upper-middle threshold over each start-year window, continued until the ratio reaches 100%.",
                "warning": "These are arithmetic continuations, not forecasts. Growth, inflation, exchange rates, revisions, and the threshold itself will change.",
                "inputs": [gni_pc_url, URLS["history"]],
            },
        ),
        manifest,
    )

    # An exact sequential accounting bridge for India's relative progress since
    # 2015. Only the first and last bars are observed positions; the middle bars
    # apply the four multiplicative factors in a stated order for exposition.
    bridge_start, bridge_end = 2015, 2025
    atlas_factor = {
        year: gni_lcu[year] / pop_by_country["IND"][year] / gni_pc_by_country["IND"][year]
        for year in (bridge_start, bridge_end)
    }
    bridge_level = 100 * gni_pc_by_country["IND"][bridge_start] / thresholds[bridge_start]["upperMiddleMin"]
    bridge_rows = [
        {"label": "Starting position, 2015", "value": round(bridge_level, 1), "date": "2015"}
    ]
    bridge_steps = [
        ("After local-currency GNI growth", gni_lcu[bridge_end] / gni_lcu[bridge_start]),
        ("After population growth", pop_by_country["IND"][bridge_start] / pop_by_country["IND"][bridge_end]),
        ("After Atlas conversion changed", atlas_factor[bridge_start] / atlas_factor[bridge_end]),
        ("Observed position after threshold moved", thresholds[bridge_start]["upperMiddleMin"] / thresholds[bridge_end]["upperMiddleMin"]),
    ]
    for label, multiplier in bridge_steps:
        bridge_level *= multiplier
        bridge_rows.append(
            {"label": label, "value": round(bridge_level, 1), "date": "2025"}
        )
    final_ratio = 100 * gni_pc_by_country["IND"][bridge_end] / thresholds[bridge_end]["upperMiddleMin"]
    assert abs(bridge_rows[-1]["value"] - round(final_ratio, 1)) < 0.01
    assert [row["value"] for row in bridge_rows] == [39.1, 98.1, 89.0, 68.4, 59.5]
    emit(
        "india-progress-accounting-bridge",
        table_artifact(
            indicator_id="econ.income_classification.india_progress_accounting_bridge",
            title="An accounting bridge from India's 2015 position to its 2025 position",
            source_indicator_id="NY.GNP.MKTP.CN + NY.GNP.PCAP.CD + SP.POP.TOTL + historical thresholds",
            source_url=URLS["history"],
            unit="% of upper-middle-income threshold",
            rows=bridge_rows,
            metadata={
                **derived_meta,
                "method": "Start with India's 2015 Atlas GNI-per-capita ratio, then sequentially apply growth in local-currency GNI, inverse population growth, the inverse change in the implicit Atlas conversion factor, and the inverse change in the upper-middle threshold. The factors multiply exactly to the 2025 ratio.",
                "assumptions": "The middle bars are an ordered accounting bridge, not causal counterfactuals. Reordering the factors changes intermediate levels but not the final result.",
                "implicitAtlasFactorLcuPerUsd": {
                    "2015": round(atlas_factor[bridge_start], 2),
                    "2025": round(atlas_factor[bridge_end], 2),
                },
                "inputs": [gni_lcu_url, gni_pc_url, pop_url, URLS["history"]],
            },
        ),
        manifest,
    )

    social_codes = "IND;CHN;IDN;VNM;PHL;LKA;THA;MYS"
    u5_rows_raw, snapshots["wdi_under5"], u5_url = wdi("SH.DYN.MORT", social_codes, 1987, 2025)
    mfg_rows_raw, snapshots["wdi_manufacturing"], mfg_url = wdi("NV.IND.MANF.ZS", social_codes, 1987, 2025)
    u5 = keyed_wdi(u5_rows_raw)
    mfg = keyed_wdi(mfg_rows_raw)
    comparison_codes = ["IND", "CHN", "IDN", "VNM", "PHL", "LKA", "THA", "MYS"]

    def first_upper_middle(code: str) -> int:
        if code == "IND":
            return 2025
        return min(year for year, category in classifications[code].items() if category in ("UM", "H"))

    def comparison_rows(values: dict[str, dict[int, float]]) -> list[dict[str, Any]]:
        output = []
        for code in comparison_codes:
            reference_year = first_upper_middle(code)
            data_year, value = latest_at_or_before(values[code], reference_year)
            output.append(
                {
                    "label": COUNTRY_NAMES[code],
                    "value": round(value, 1),
                    "group": "India now" if code == "IND" else "At first upper-middle classification",
                    "referenceYear": reference_year,
                    "dataYear": data_year,
                    "date": str(reference_year),
                }
            )
        return output

    emit(
        "under5-at-upper-middle-crossing",
        table_artifact(
            indicator_id="econ.income_classification.under5_at_upper_middle_crossing",
            title="Under-five mortality when selected Asian economies first became upper middle income",
            source_indicator_id="SH.DYN.MORT + historical analytical classifications",
            source_url=u5_url,
            unit="deaths per 1,000 live births",
            rows=comparison_rows(u5),
            metadata={
                **derived_meta,
                "method": "Latest under-five mortality observation at or before the first upper-middle-income classification year. India is shown at the latest available value while still lower middle income.",
                "warning": "World Bank WDI SH.DYN.MORT values are UN IGME model estimates, not India's official SRS series. India is shown at its latest available observation while peers are shown in their own first-crossing years, so this is not a same-year comparison and does not imply that classification caused the outcome.",
                "classificationSource": URLS["history"],
            },
        ),
        manifest,
    )
    emit(
        "manufacturing-at-upper-middle-crossing",
        table_artifact(
            indicator_id="econ.income_classification.manufacturing_at_upper_middle_crossing",
            title="Manufacturing share when selected Asian economies first became upper middle income",
            source_indicator_id="NV.IND.MANF.ZS + historical analytical classifications",
            source_url=mfg_url,
            unit="% of GDP",
            rows=comparison_rows(mfg),
            metadata={
                **derived_meta,
                "method": "Latest manufacturing-value-added share at or before the first upper-middle-income classification year. India is shown at the latest available value while still lower middle income.",
                "warning": "This is a structural comparison, not evidence that manufacturing alone caused income mobility.",
                "classificationSource": URLS["history"],
            },
        ),
        manifest,
    )

    emit(
        "india-gni-current-lcu",
        series_artifact(
            indicator_id="econ.income_classification.india_gni_current_lcu",
            title="India gross national income at current prices, World Bank",
            source_indicator_id="NY.GNP.MKTP.CN",
            source_url=gni_lcu_url,
            unit="rupees",
            observations=[{"date": str(year), "value": value} for year, value in sorted(gni_lcu.items())],
            metadata={
                "purpose": "Independent-source reconciliation against MoSPI's fiscal-year national-accounts GNI series.",
                "warning": "World Bank calendar-year and MoSPI fiscal-year estimates are close but not identical concepts or periods.",
            },
        ),
        manifest,
    )

    # Pair the two already-ingested MoSPI HCES fractile tables so the household
    # reality check represents both rural and urban India in one chart.
    rural_hces_path = SERIES_DIR / "mospi-hces.IN.hces_fractile_mpce_rural.json"
    urban_hces_path = SERIES_DIR / "mospi-hces.IN.hces_fractile_mpce_urban.json"
    rural_hces = json.loads(rural_hces_path.read_text())
    urban_hces = json.loads(urban_hces_path.read_text())
    assert rural_hces["sourceUrl"] == urban_hces["sourceUrl"]
    assert len(rural_hces["rows"]) == len(urban_hces["rows"]) == 12
    assert [row["label"] for row in rural_hces["rows"]] == [
        row["label"] for row in urban_hces["rows"]
    ]
    household_rows = []
    for rural_row, urban_row in zip(rural_hces["rows"], urban_hces["rows"]):
        household_rows.extend(
            [
                {"label": f"{rural_row['label']} · rural", "value": rural_row["value"], "date": "2023-24"},
                {"label": f"{urban_row['label']} · urban", "value": urban_row["value"], "date": "2023-24"},
            ]
        )
    assert household_rows[0]["value"] == 1677
    assert household_rows[1]["value"] == 2376
    assert household_rows[-2]["value"] == 10137
    assert household_rows[-1]["value"] == 20310
    emit(
        "household-consumption-rural-urban",
        table_artifact(
            indicator_id="econ.income_classification.household_consumption_rural_urban",
            title="Rural and urban monthly consumption across India's fractile ladder",
            source_indicator_id="HCES Figure 1 rural and urban",
            source_url=rural_hces["sourceUrl"],
            unit="₹ per person per month",
            rows=household_rows,
            source_id="mospi-hces",
            geography={"type": "country", "id": "IN", "name": "India"},
            metadata={
                "release": "MoSPI HCES 2023-24, press note revised 27 December 2024",
                "method": "Pair the published rural and urban average MPCE values for each population fractile. No conversion to income or GNI is attempted.",
                "warning": "MPCE is surveyed consumption, not income, GNI or wealth. Rural and urban price levels also differ.",
                "inputs": [
                    str(rural_hces_path.relative_to(ROOT)),
                    str(urban_hces_path.relative_to(ROOT)),
                ],
            },
        ),
        manifest,
    )

    catalog = {
        "sourceId": "worldbank-income-classifications",
        "fetchedAt": FETCHED_AT,
        "release": "2025 estimates published July 2026",
        "revisionWarning": "The 2025 GNI, GNI per capita, GDP, GDP PPP, and population values are estimates and may be revised.",
        "sourceUrls": URLS,
        "snapshots": snapshots,
        "artifacts": manifest,
        "releaseChecks": {
            "indiaAtlasGniPerCapita": atlas["IND"]["value"],
            "indiaPppGniPerCapita": ppp["IND"]["value"],
            "indiaAtlasGniMillionUsd": gni["IND"]["value"],
            "indiaGdpMillionUsd": gdp["IND"]["value"],
            "indiaGdpPppMillionInternationalUsd": gdp_ppp["IND"]["value"],
            "indiaPopulationThousand": population_2025["IND"]["value"],
            "upperMiddleEntry": thresholds[2025]["upperMiddleMin"],
            "highIncomeEntry": thresholds[2025]["highMin"],
        },
    }
    write_json(CATALOG_PATH, catalog)
    print(f"Wrote {len(manifest)} artifacts and {len(snapshots)} content-addressed snapshots.")


if __name__ == "__main__":
    main()
