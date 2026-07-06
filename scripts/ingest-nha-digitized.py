#!/usr/bin/env python3
"""Wire the digitized National Health Accounts data into data/series/.

Source: digitized-nha/national_health_accounts_digitized.md (vision-transcribed
from the official NHA reports, 2013-14 to 2022-23) plus the state-level table
JSON in digitized-nha/series/. Parses Table 1 of the markdown (all 19 national
indicators) into one series file per indicator, and copies the state table as a
table artifact.

NHA fiscal years: column "13-14" = FY2013-14 -> observation date 2014-03-31.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MD_PATH = ROOT / "digitized-nha" / "national_health_accounts_digitized.md"
STATE_JSON = ROOT / "digitized-nha" / "series" / "nha.IN.state_health_indicators_2022_23.json"
OUT_DIR = ROOT / "data" / "series"

SOURCE_ID = "nha-nhsrc"
SOURCE_URL = "https://nhsrcindia.org/national-health-accounts-records"
FETCHED_AT = datetime.now(timezone.utc).isoformat()

# row label (as in the markdown, sans bold) -> (indicator slug, title, unit)
INDICATORS = {
    "Total Health Expenditure (THE) as % of GDP": (
        "the_gdp_pct", "Total health expenditure as a share of GDP", "% of GDP"),
    "THE Per Capita (Rs. at current prices)": (
        "the_per_capita", "Total health expenditure per person, current rupees", "Rs. per person"),
    "THE Per Capita (Rs. at constant 2011-12 prices)": (
        "the_per_capita_constant", "Total health expenditure per person, constant 2011-12 rupees", "Rs. per person (2011-12 prices)"),
    "Current Health Expenditure (CHE) as % of THE": (
        "che_the_pct", "Current health expenditure as a share of total health expenditure", "% of THE"),
    "Capital Health Expenditure as % of THE": (
        "capital_the_pct", "Capital health expenditure as a share of total health expenditure", "% of THE"),
    "Government Health Expenditure (GHE) as % of THE": (
        "ghe_the_pct", "Government share of health spending", "% of THE"),
    "GHE as % of GDP": (
        "ghe_gdp_pct", "Government health expenditure as a share of GDP", "% of GDP"),
    "GHE as % of General Government Expenditure (GGE)": (
        "ghe_gge_pct", "Health share of total government expenditure", "% of GGE"),
    "Per Capita Government Health Expenditure (Rs.)": (
        "ghe_per_capita", "Government health expenditure per person, current rupees", "Rs. per person"),
    "Union Government Health Expenditure as % of GHE": (
        "ghe_union_pct", "Union government share of government health expenditure", "% of GHE"),
    "State Government Health Expenditure as % of GHE": (
        "ghe_state_pct", "State government share of government health expenditure", "% of GHE"),
    "Out-of-Pocket Expenditure (OOPE) as % of THE": (
        "oope_the_pct", "Out-of-pocket share of health spending", "% of THE"),
    "OOPE as % of GDP": (
        "oope_gdp_pct", "Out-of-pocket health expenditure as a share of GDP", "% of GDP"),
    "Per Capita OOPE (Rs. at current prices)": (
        "oope_per_capita", "Out-of-pocket health expenditure per person, current rupees", "Rs. per person"),
    "Social Security Expenditure on Health as % of THE": (
        "social_security_the_pct", "Social security expenditure on health", "% of THE"),
    "Private Health Insurance Expenditures as % of THE": (
        "pvt_insurance_the_pct", "Private health insurance expenditure", "% of THE"),
    "External/Donor Funding for Health as % of THE": (
        "external_the_pct", "External and donor funding for health", "% of THE"),
    "AYUSH Expenditures as % of THE": (
        "ayush_the_pct", "AYUSH expenditure as a share of total health expenditure", "% of THE"),
    "Pharmaceutical Expenditures as % of CHE": (
        "pharma_che_pct", "Pharmaceutical expenditure as a share of current health expenditure", "% of CHE"),
}


def parse_national_table(md_text: str) -> dict[str, list[tuple[int, float]]]:
    """Return {row label: [(fy_start_year, value), ...]} from Table 1."""
    header_years: list[int] | None = None
    out: dict[str, list[tuple[int, float]]] = {}
    for line in md_text.splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if header_years is None:
            if cells[0] == "Sl. No." or cells[0].startswith("Sl"):
                header_years = []
                for cell in cells[2:]:
                    m = re.fullmatch(r"(\d{2})-(\d{2})", cell)
                    if m:
                        header_years.append(2000 + int(m.group(1)))
            continue
        if len(cells) < 3 or set(cells[0]) <= {":", "-", " "}:
            continue
        label = re.sub(r"\*+", "", cells[1]).strip()
        if label not in INDICATORS:
            continue
        values = []
        for year, raw in zip(header_years, cells[2:]):
            raw = raw.replace("%", "").replace(",", "").strip()
            if raw in ("", "-", "NA"):
                continue
            values.append((year, float(raw)))
        out[label] = values
    return out


def main() -> None:
    md_text = MD_PATH.read_text(encoding="utf-8")
    table = parse_national_table(md_text)
    missing = [label for label in INDICATORS if label not in table]
    if missing:
        raise SystemExit(f"markdown table is missing expected rows: {missing}")

    written = []
    for label, (slug, title, unit) in INDICATORS.items():
        observations = [
            {"date": f"{fy_start + 1}-03-31", "value": value}
            for fy_start, value in table[label]
        ]
        artifact = {
            "schemaVersion": 1,
            "artifactType": "series",
            "indicatorId": f"health.nha.{slug}",
            "title": title,
            "sourceId": SOURCE_ID,
            "sourceIndicatorId": label,
            "sourceUrl": SOURCE_URL,
            "unit": unit,
            "frequency": "annual",
            "geography": {"type": "country", "id": "IN", "name": "India"},
            "dimensions": [],
            "fetchedAt": FETCHED_AT,
            "observations": observations,
            "metadata": {
                "source": "National Health Accounts Estimates for India, NHSRC / MoHFW",
                "note": "Digitized from the official NHA report PDFs (2013-14 to 2022-23 rounds). "
                        "Observation dates are fiscal-year ends (FY2013-14 -> 2014-03-31).",
            },
        }
        path = OUT_DIR / f"nha.IN.health.{slug}.json"
        path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        written.append((path.name, f"health.nha.{slug}", len(observations)))

    state = json.loads(STATE_JSON.read_text(encoding="utf-8"))
    state["fetchedAt"] = FETCHED_AT
    state.setdefault("metadata", {})["source"] = (
        "National Health Accounts Estimates 2022-23, Annexure Table A.6, NHSRC / MoHFW"
    )
    state_path = OUT_DIR / "nha.IN.health.state_indicators_2022_23.json"
    state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    written.append((state_path.name, state["indicatorId"], len(state["rows"])))

    for name, indicator_id, n in written:
        print(f"{name}  {indicator_id}  ({n} obs)")
    print(f"\nwrote {len(written)} files to {OUT_DIR}")


if __name__ == "__main__":
    main()
