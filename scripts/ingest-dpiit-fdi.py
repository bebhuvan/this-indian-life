#!/usr/bin/env python3
"""Ingest DPIIT's latest quarterly FDI factsheet.

Source:
  Department for Promotion of Industry and Internal Trade (DPIIT),
  "Quarterly FDI Factsheet for 4th quarter of FY 2025-26".

The factsheet is the canonical source for DPIIT equity-flow series and
country/sector/state breakdowns. It is published as a PDF, but its tables are
text-backed and extract cleanly with pdfplumber.

Emits article-ready artifacts:
  - annual DPIIT FDI equity inflow, FY2000-01..FY2025-26
  - annual total FDI inflow as per RBI's expanded/international coverage
  - FY2025-26 monthly DPIIT equity inflow
  - cumulative country-wise, sector-wise, and state-wise equity tables
"""

import datetime as dt
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

import pdfplumber


SOURCE_ID = "dpiit-fdi"
SOURCE_URL = "https://www.dpiit.gov.in/static/uploads/2026/06/41192ca92c1de34eb064800fbffa0379.pdf"
SOURCE_PAGE = "https://www.dpiit.gov.in/publications/fdi-statistics"
SNAPSHOT_DIR = Path("data/snapshots") / SOURCE_ID
OUT_DIR = Path("data/series")
FETCHED_AT = dt.datetime.now(dt.timezone.utc).isoformat()


MONTHS = {
    "january": "01",
    "february": "02",
    "march": "03",
    "april": "04",
    "may": "05",
    "june": "06",
    "july": "07",
    "august": "08",
    "september": "09",
    "october": "10",
    "november": "11",
    "december": "12",
}


def stable_json(value):
    return json.dumps(value, indent=2, sort_keys=False)


def source_slug(value):
    return re.sub(r"[^A-Za-z0-9_.@-]+", "_", str(value))


def parse_num(value):
    if value is None:
        return None
    text = str(value).replace("\n", " ").replace(",", "").strip()
    text = re.sub(r"(?<=\d)\s+(?=\d)", "", text)
    text = text.replace(" ", "")
    if text in {"", "-", "None"}:
        return None
    return float(text)


def clean_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def fy_start_date(fy):
    match = re.search(r"(\d{4})", fy)
    if not match:
        raise ValueError(f"Could not parse financial year: {fy}")
    return f"{match.group(1)}-04-01"


def month_date(month_label):
    year_match = re.search(r"(20\d{2})", month_label)
    if not year_match:
        raise ValueError(f"Could not parse year from month label: {month_label}")
    month = re.sub(r"[,0-9]", "", month_label).strip().lower()
    if month not in MONTHS:
        raise ValueError(f"Could not parse month label: {month_label}")
    return f"{year_match.group(1)}-{MONTHS[month]}-01"


def write_raw_snapshot(body):
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(body).hexdigest()
    path = SNAPSHOT_DIR / f"dpiit-fdi-factsheet-mar-2026.{digest[:12]}.pdf"
    path.write_bytes(body)
    return path, digest


def download_pdf():
    with urllib.request.urlopen(SOURCE_URL, timeout=120) as response:
        body = response.read()
    if not body.startswith(b"%PDF"):
        raise RuntimeError("DPIIT factsheet download did not return a PDF")
    return write_raw_snapshot(body)


def series_artifact(indicator_id, title, unit, frequency, observations, metadata):
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": SOURCE_ID,
        "sourceIndicatorId": indicator_id,
        "sourceUrl": SOURCE_URL,
        "unit": unit,
        "frequency": frequency,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "metadata": metadata,
    }


def table_artifact(indicator_id, title, unit, rows, dimensions, metadata):
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": SOURCE_ID,
        "sourceIndicatorId": indicator_id,
        "sourceUrl": SOURCE_URL,
        "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": dimensions,
        "fetchedAt": FETCHED_AT,
        "rows": rows,
        "metadata": metadata,
    }


def write_artifact(name, artifact):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{source_slug(name)}.json"
    path.write_text(stable_json(artifact) + "\n")
    return path


def extract_tables(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        return [page.extract_tables() for page in pdf.pages]


def parse_rbi_total_annual(table):
    observations = []
    rows = []
    for row in table:
        if not row or not str(row[0] or "").strip().isdigit():
            continue
        fy = clean_text(row[1])
        total = parse_num(row[6])
        if total is None:
            continue
        observations.append({"date": fy_start_date(fy), "value": total, "financialYear": fy})
        rows.append({
            "financialYear": fy,
            "equity_government_auto_acquisition_usd_mn": parse_num(row[2]),
            "equity_unincorporated_bodies_usd_mn": parse_num(row[3]),
            "reinvested_earnings_usd_mn": parse_num(row[4]),
            "other_capital_usd_mn": parse_num(row[5]),
            "total_fdi_inflow_usd_mn": total,
            "growth_over_previous_year": clean_text(row[7]),
            "fpi_net_usd_mn": parse_num(row[8]),
        })
    return observations, rows


def parse_dpiit_equity_annual(table):
    observations = []
    rows = []
    for row in table:
        if not row or not str(row[0] or "").strip().isdigit():
            continue
        fy = clean_text(row[1]).replace("–", "-")
        usd = parse_num(row[3])
        if usd is None:
            continue
        observations.append({"date": fy_start_date(fy), "value": usd, "financialYear": fy})
        rows.append({
            "financialYear": fy,
            "equity_inflow_inr_crore": parse_num(row[2]),
            "equity_inflow_usd_mn": usd,
            "growth_over_previous_year": clean_text(row[4]),
        })
    return observations, rows


def parse_monthly_equity(table):
    observations = []
    rows = []
    for row in table:
        if not row or not str(row[0] or "").strip().isdigit():
            continue
        label = clean_text(row[1])
        if not re.search(r"[A-Za-z]", label):
            continue
        usd = parse_num(row[3])
        if usd is None:
            continue
        date = month_date(label)
        observations.append({"date": date, "value": usd, "month": label})
        rows.append({
            "date": date,
            "month": label,
            "equity_inflow_inr_crore": parse_num(row[2]),
            "equity_inflow_usd_mn": usd,
        })
    return observations, rows


def parse_cumulative_rows(tables, dimension_name, ranked_only=True):
    rows = []
    for table in tables:
        for row in table:
            if not row or len(row) < 5:
                continue
            rank = clean_text(row[0])
            if ranked_only and not rank.isdigit():
                continue
            if not ranked_only and not (rank.isdigit() or clean_text(row[1]).lower().startswith("state not")):
                continue
            name = clean_text(row[1])
            inr = parse_num(row[2])
            usd = parse_num(row[3])
            share = parse_num(row[4])
            if not name or inr is None or usd is None:
                continue
            rows.append({
                "rank": int(rank) if rank.isdigit() else None,
                "name": name,
                dimension_name: name,
                "equity_inflow_inr_crore": inr,
                "equity_inflow_usd_mn": usd,
                "share_of_total_usd_pct": share,
            })
    return rows


def assert_counts(name, rows, minimum):
    if len(rows) < minimum:
        raise RuntimeError(f"{name} parsed {len(rows)} rows, expected at least {minimum}")


def main():
    pdf_path, pdf_hash = download_pdf()
    tables = extract_tables(pdf_path)

    monthly_obs, monthly_rows = parse_monthly_equity(tables[0][2])
    rbi_total_obs, rbi_total_rows = parse_rbi_total_annual(tables[3][0])
    equity_obs, equity_rows = parse_dpiit_equity_annual(tables[4][0])
    country_rows = parse_cumulative_rows([tables[5][0], tables[6][0], tables[7][0]], "country")
    sector_rows = parse_cumulative_rows([tables[8][0]], "sector")
    state_rows = parse_cumulative_rows([tables[9][0]], "state", ranked_only=False)

    assert_counts("monthly equity", monthly_rows, 12)
    assert_counts("RBI annual total FDI", rbi_total_rows, 26)
    assert_counts("DPIIT annual equity", equity_rows, 26)
    assert_counts("country cumulative", country_rows, 181)
    assert_counts("sector cumulative", sector_rows, 63)
    assert_counts("state cumulative", state_rows, 34)

    quality = [
        "raw PDF snapshot saved",
        "pdfplumber table extraction",
        "minimum row-count validation",
        "numeric parsing rejects empty cells",
    ]

    outputs = []
    outputs.append(write_artifact("dpiit-fdi.IN.fdi_equity_inflow_usd_annual", series_artifact(
        "external.dpiit.fdi_equity_inflow_usd_annual",
        "DPIIT FDI equity inflow",
        "US$ million",
        "annual",
        equity_obs,
        {
            "sourcePage": SOURCE_PAGE,
            "rawSnapshot": str(pdf_path),
            "rawHash": pdf_hash,
            "method": "DPIIT factsheet, section II.B, equity capital components only.",
            "qualityGates": quality,
        },
    )))
    outputs.append(write_artifact("dpiit-fdi.IN.fdi_total_inflow_usd_annual", series_artifact(
        "external.dpiit.fdi_total_inflow_usd_annual",
        "Total FDI inflow into India",
        "US$ million",
        "annual",
        rbi_total_obs,
        {
            "sourcePage": SOURCE_PAGE,
            "rawSnapshot": str(pdf_path),
            "rawHash": pdf_hash,
            "method": "DPIIT factsheet, section II.A, RBI expanded coverage: equity, reinvested earnings, other capital, and equity capital of unincorporated bodies.",
            "qualityGates": quality,
        },
    )))
    outputs.append(write_artifact("dpiit-fdi.IN.fdi_equity_inflow_usd_monthly_fy2025_26", series_artifact(
        "external.dpiit.fdi_equity_inflow_usd_monthly_fy2025_26",
        "DPIIT FDI equity inflow, FY2025-26 monthly",
        "US$ million",
        "monthly",
        monthly_obs,
        {
            "sourcePage": SOURCE_PAGE,
            "rawSnapshot": str(pdf_path),
            "rawHash": pdf_hash,
            "method": "DPIIT factsheet, section I.C, month-wise FDI equity inflow for FY2025-26.",
            "qualityGates": quality,
        },
    )))
    outputs.append(write_artifact("dpiit-fdi.IN.fdi_equity_country_cumulative", table_artifact(
        "external.dpiit.fdi_equity_country_cumulative",
        "Country-wise FDI equity inflow, cumulative",
        "US$ million and INR crore",
        country_rows,
        ["country"],
        {
            "sourcePage": SOURCE_PAGE,
            "rawSnapshot": str(pdf_path),
            "rawHash": pdf_hash,
            "coverage": "April 2000 to March 2026",
            "method": "DPIIT factsheet Annexure A.",
            "qualityGates": quality,
        },
    )))
    outputs.append(write_artifact("dpiit-fdi.IN.fdi_equity_sector_cumulative", table_artifact(
        "external.dpiit.fdi_equity_sector_cumulative",
        "Sector-wise FDI equity inflow, cumulative",
        "US$ million and INR crore",
        sector_rows,
        ["sector"],
        {
            "sourcePage": SOURCE_PAGE,
            "rawSnapshot": str(pdf_path),
            "rawHash": pdf_hash,
            "coverage": "April 2000 to March 2026",
            "method": "DPIIT factsheet Annexure B.",
            "qualityGates": quality,
        },
    )))
    outputs.append(write_artifact("dpiit-fdi.IN.fdi_equity_state_cumulative", table_artifact(
        "external.dpiit.fdi_equity_state_cumulative",
        "State-wise FDI equity inflow, cumulative",
        "US$ million and INR crore",
        state_rows,
        ["state"],
        {
            "sourcePage": SOURCE_PAGE,
            "rawSnapshot": str(pdf_path),
            "rawHash": pdf_hash,
            "coverage": "October 2019 to March 2026",
            "method": "DPIIT factsheet Annexure C. DPIIT states that state-wise data is maintained from October 2019.",
            "qualityGates": quality,
        },
    )))

    print(json.dumps({
        "ok": True,
        "sourceUrl": SOURCE_URL,
        "rawSnapshot": str(pdf_path),
        "outputs": [str(path) for path in outputs],
        "counts": {
            "monthlyRows": len(monthly_rows),
            "rbiAnnualRows": len(rbi_total_rows),
            "dpiitAnnualRows": len(equity_rows),
            "countries": len(country_rows),
            "sectors": len(sector_rows),
            "states": len(state_rows),
        },
        "latestAnnualEquityUsdMn": equity_obs[-1]["value"],
    }, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
