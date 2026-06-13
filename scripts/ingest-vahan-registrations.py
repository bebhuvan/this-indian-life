#!/usr/bin/env python3
"""Scrape VAHAN registration dashboard tables with validation.

VAHAN is a stateful JSF/PrimeFaces dashboard. The scraper deliberately uses the
same form/Ajax contract as the page, snapshots raw responses locally, paginates
PrimeFaces datatables, then writes normalized tables and validation reports.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup


URL = "https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml"
SOURCE_ID = "vahan"
MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
DEFAULT_TIMEOUT = 45
DEFAULT_PAGE_ROWS = 25

CUTS = {
    "state_monthly": {
        "yaxis": "State",
        "xaxis": "Month Wise",
        "min_rows": 30,
        "expected_columns": ["S No", "State", *MONTHS, "TOTAL"],
        "series": "state",
    },
    "vehicle_class_monthly": {
        "yaxis": "Vehicle Class",
        "xaxis": "Month Wise",
        "min_rows": 20,
        "expected_columns": ["S No", "Vehicle Class", *MONTHS, "TOTAL"],
        "series": "vehicle_class",
    },
    "fuel_monthly": {
        "yaxis": "Fuel",
        "xaxis": "Month Wise",
        "min_rows": 5,
        "expected_columns": ["S No", "Fuel", *MONTHS, "TOTAL"],
        "series": "fuel",
    },
}


class VahanError(RuntimeError):
    pass


@dataclass
class Finding:
    severity: str
    cut: str
    year: str
    message: str
    detail: Any = None


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def slugify(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.@-]+", "_", str(value)).strip("_")


def hash_bytes(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip()


def parse_indian_int(value: str) -> int | None:
    text = clean_text(value).replace(",", "")
    if text in {"", "-", "NA", "N/A"}:
        return None
    if not re.fullmatch(r"-?\d+", text):
        raise ValueError(f"not an integer: {value!r}")
    return int(text)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def write_snapshot(raw_dir: Path, name: str, body: bytes, extension: str) -> dict[str, str]:
    raw_dir.mkdir(parents=True, exist_ok=True)
    digest = hash_bytes(body)
    path = raw_dir / f"{slugify(name)}.{digest[:12]}.{extension}"
    path.write_bytes(body)
    return {"path": str(path), "hash": digest}


def extract_partial_update(text: str, update_id: str) -> str:
    pattern = rf'<update id="{re.escape(update_id)}"><!\[CDATA\[(.*?)\]\]></update>'
    match = re.search(pattern, text, re.S)
    return match.group(1) if match else text


def extract_view_state(text: str) -> str | None:
    match = re.search(r'<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[(.*?)\]\]></update>', text, re.S)
    if match:
        return match.group(1)
    soup = BeautifulSoup(text, "html.parser")
    node = soup.find("input", {"name": "javax.faces.ViewState"})
    return node.get("value") if node else None


def selected_form_payload(soup: BeautifulSoup) -> dict[str, str]:
    state = soup.find("input", {"name": "javax.faces.ViewState"})
    if not state or not state.get("value"):
        raise VahanError("missing javax.faces.ViewState in initial page")

    payload: dict[str, str] = {
        "masterLayout_formlogin": "masterLayout_formlogin",
        "javax.faces.ViewState": state["value"],
    }
    for node in soup.select("input[name]"):
        name = node.get("name")
        input_type = (node.get("type") or "").lower()
        if not name or name in payload:
            continue
        if input_type in {"hidden", "text"}:
            payload[name] = node.get("value", "")
    for node in soup.select("select[name]"):
        name = node.get("name")
        option = node.find("option", selected=True) or node.find("option")
        if name and option:
            payload[name] = option.get("value", "")
    return payload


def discover_options(soup: BeautifulSoup) -> dict[str, list[dict[str, str]]]:
    out: dict[str, list[dict[str, str]]] = {}
    for node in soup.select("select[name]"):
        name = node.get("name")
        if not name:
            continue
        out[name] = [
            {
                "value": option.get("value", ""),
                "label": clean_text(option.get_text(" ", strip=True)),
                "selected": bool(option.has_attr("selected")),
            }
            for option in node.select("option")
        ]
    return out


class VahanClient:
    def __init__(self, raw_dir: Path, delay: float, timeout: int = DEFAULT_TIMEOUT):
        self.session = requests.Session()
        self.raw_dir = raw_dir
        self.delay = delay
        self.timeout = timeout
        self.payload: dict[str, str] = {}
        self.options: dict[str, list[dict[str, str]]] = {}
        self.last_request_at = 0.0

    def throttle(self) -> None:
        elapsed = time.monotonic() - self.last_request_at
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self.last_request_at = time.monotonic()

    def start(self) -> dict[str, Any]:
        self.throttle()
        response = self.session.get(URL, timeout=self.timeout)
        response.raise_for_status()
        snapshot = write_snapshot(self.raw_dir, "initial_page", response.content, "html")
        soup = BeautifulSoup(response.text, "html.parser")
        self.payload = selected_form_payload(soup)
        self.options = discover_options(soup)
        return {
            "url": response.url,
            "statusCode": response.status_code,
            "snapshot": snapshot,
            "options": self.options,
        }

    def ajax(self, payload: dict[str, str]) -> requests.Response:
        self.throttle()
        response = self.session.post(
            URL,
            data=payload,
            headers={
                "Faces-Request": "partial/ajax",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": URL,
                "Origin": "https://vahan.parivahan.gov.in",
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        view_state = extract_view_state(response.text)
        if view_state:
            self.payload["javax.faces.ViewState"] = view_state
        return response

    def refresh_table(self, cut: str, year: str, year_type: str) -> tuple[str, dict[str, str]]:
        config = CUTS[cut]
        payload = dict(self.payload)
        payload.update(
            {
                "selectedYear_input": year,
                "selectedYearType_input": year_type,
                "xaxisVar_input": config["xaxis"],
                "yaxisVar_input": config["yaxis"],
                "javax.faces.partial.ajax": "true",
                "javax.faces.source": "irclay",
                "javax.faces.partial.execute": "masterLayout_formlogin",
                "javax.faces.partial.render": "tablePnl",
                "irclay": "irclay",
            }
        )
        response = self.ajax(payload)
        snapshot = write_snapshot(self.raw_dir, f"{cut}_{year_type}_{year}_page_1", response.content, "xml")
        return extract_partial_update(response.text, "tablePnl"), snapshot

    def page_table(self, cut: str, year: str, year_type: str, first: int) -> tuple[str, dict[str, str]]:
        payload = dict(self.payload)
        payload.update(
            {
                "selectedYear_input": year,
                "selectedYearType_input": year_type,
                "javax.faces.partial.ajax": "true",
                "javax.faces.source": "groupingTable",
                "javax.faces.partial.execute": "groupingTable",
                "javax.faces.partial.render": "groupingTable",
                "groupingTable": "groupingTable",
                "groupingTable_pagination": "true",
                "groupingTable_first": str(first),
                "groupingTable_rows": str(DEFAULT_PAGE_ROWS),
                "groupingTable_skipChildren": "true",
                "groupingTable_encodeFeature": "true",
                "groupingTable_scrollState": "0,0",
            }
        )
        response = self.ajax(payload)
        snapshot = write_snapshot(
            self.raw_dir,
            f"{cut}_{year_type}_{year}_page_{first // DEFAULT_PAGE_ROWS + 1}",
            response.content,
            "xml",
        )
        return extract_partial_update(response.text, "groupingTable"), snapshot


def table_title(soup: BeautifulSoup) -> str:
    header = soup.select_one("#groupingTable .ui-datatable-header")
    return clean_text(header.get_text(" ", strip=True)) if header else ""


def parse_columns(soup: BeautifulSoup, cut: str) -> list[str]:
    config = CUTS[cut]
    expected = config["expected_columns"]
    header_rows = []
    for tr in soup.select("#groupingTable_head tr"):
        header_rows.append([clean_text(th.get_text(" ", strip=True)) for th in tr.select("th")])
    if not header_rows:
        return expected
    flattened = [clean_text(value) for value in header_rows[-1]]
    return [expected[0], expected[1], *flattened, "TOTAL"]


def parse_rows(
    fragment: str,
    cut: str,
    year: str,
    year_type: str,
    fallback_columns: list[str] | None = None,
) -> dict[str, Any]:
    soup = BeautifulSoup(fragment, "html.parser")
    columns = parse_columns(soup, cut)
    if not soup.select("#groupingTable_head tr") and fallback_columns:
        columns = fallback_columns
    rows = []
    body_rows = soup.select("#groupingTable_data tr")
    if not body_rows:
        body_rows = soup.select("tr")
    for tr in body_rows:
        cells = [clean_text(td.get_text(" ", strip=True)) for td in tr.select("td")]
        if not cells:
            continue
        if len(cells) != len(columns):
            rows.append({"_raw": cells})
            continue
        label_key = CUTS[cut]["series"]
        row = {
            "yearType": "calendar" if year_type == "C" else "financial",
            "year": int(year) if year.isdigit() else year,
            "serial": parse_indian_int(cells[0]),
            label_key: cells[1],
        }
        for column, value in zip(columns[2:], cells[2:]):
            row[column] = parse_indian_int(value)
        rows.append(row)
    return {"title": table_title(soup), "columns": columns, "rows": rows}


def fetch_cut_year(client: VahanClient, cut: str, year: str, year_type: str, max_pages: int) -> dict[str, Any]:
    first_fragment, first_snapshot = client.refresh_table(cut, year, year_type)
    parsed = parse_rows(first_fragment, cut, year, year_type)
    snapshots = [first_snapshot]
    rows = list(parsed["rows"])
    first = DEFAULT_PAGE_ROWS
    while rows and len(rows) % DEFAULT_PAGE_ROWS == 0 and first < DEFAULT_PAGE_ROWS * max_pages:
        fragment, snapshot = client.page_table(cut, year, year_type, first)
        page = parse_rows(fragment, cut, year, year_type, fallback_columns=parsed["columns"])
        snapshots.append(snapshot)
        page_rows = page["rows"]
        if not page_rows:
            break
        rows.extend(page_rows)
        if len(page_rows) < DEFAULT_PAGE_ROWS:
            break
        first += DEFAULT_PAGE_ROWS
    return {
        "sourceUrl": URL,
        "cut": cut,
        "yearType": "calendar" if year_type == "C" else "financial",
        "year": int(year) if year.isdigit() else year,
        "title": parsed["title"],
        "columns": parsed["columns"],
        "rows": rows,
        "snapshots": snapshots,
        "fetchedAt": now_iso(),
    }


def validate_table(table: dict[str, Any]) -> list[Finding]:
    cut = table["cut"]
    year = str(table["year"])
    config = CUTS[cut]
    findings: list[Finding] = []
    rows = table["rows"]
    columns = table["columns"]
    label_column = config["expected_columns"][1]
    month_columns = columns[2:-1] if len(columns) >= 4 else []
    current_year = dt.datetime.now().year
    is_current_calendar_year = table["yearType"] == "calendar" and isinstance(table["year"], int) and table["year"] == current_year
    full_expected = config["expected_columns"]
    partial_expected = ["S No", label_column, *MONTHS[: len(month_columns)], "TOTAL"]
    if columns != full_expected:
        if not (is_current_calendar_year and columns == partial_expected and 1 <= len(month_columns) <= 12):
            findings.append(
                Finding(
                    "error",
                    cut,
                    year,
                    "unexpected columns",
                    {"actual": columns, "expected": full_expected, "currentYearPartialAllowed": is_current_calendar_year},
                )
            )
    if len(rows) < config["min_rows"]:
        findings.append(Finding("error", cut, year, "too few rows", {"actual": len(rows), "minimum": config["min_rows"]}))
    seen_serials = []
    label_key = config["series"]
    seen_labels = set()
    for index, row in enumerate(rows):
        if "_raw" in row:
            findings.append(Finding("error", cut, year, "unparsed row", {"index": index, "row": row["_raw"]}))
            continue
        serial = row.get("serial")
        if not isinstance(serial, int):
            findings.append(Finding("error", cut, year, "missing serial", {"index": index, "row": row}))
        else:
            seen_serials.append(serial)
        label = row.get(label_key)
        if not label:
            findings.append(Finding("error", cut, year, "missing row label", {"index": index, "row": row}))
        elif label in seen_labels:
            findings.append(Finding("error", cut, year, "duplicate row label", label))
        else:
            seen_labels.add(label)
        values = [row.get(month) for month in month_columns]
        total = row.get("TOTAL")
        for column in [*month_columns, "TOTAL"]:
            value = row.get(column)
            if value is None:
                findings.append(Finding("error", cut, year, "missing numeric value", {"row": label, "column": column}))
            elif not isinstance(value, int):
                findings.append(Finding("error", cut, year, "non-integer value", {"row": label, "column": column, "value": value}))
            elif value < 0:
                findings.append(Finding("error", cut, year, "negative value", {"row": label, "column": column, "value": value}))
        if all(isinstance(value, int) for value in values) and isinstance(total, int):
            month_sum = sum(values)
            if month_sum != total:
                findings.append(Finding("error", cut, year, "row total does not equal month sum", {"row": label, "monthSum": month_sum, "total": total}))
    expected_serials = list(range(1, len(seen_serials) + 1))
    if seen_serials != expected_serials:
        findings.append(Finding("error", cut, year, "serial numbers are not contiguous", {"actual": seen_serials[:10], "rows": len(seen_serials)}))
    return findings


def write_table_outputs(table: dict[str, Any], tables_dir: Path) -> dict[str, str]:
    stem = f"vahan_{table['cut']}_{table['yearType']}_{table['year']}"
    json_path = tables_dir / f"{stem}.json"
    csv_path = tables_dir / f"{stem}.csv"
    write_json(json_path, table)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["yearType", "year", "serial", CUTS[table["cut"]]["series"], *MONTHS, "TOTAL"]
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for row in table["rows"]:
            if "_raw" not in row:
                writer.writerow({field: row.get(field) for field in fieldnames})
    return {"json": str(json_path), "csv": str(csv_path)}


def aggregate_monthly(tables: list[dict[str, Any]], cut: str, label_field: str | None = None) -> list[dict[str, Any]]:
    observations = []
    for table in sorted(tables, key=lambda item: int(item["year"])):
        if table["cut"] != cut or table["yearType"] != "calendar":
            continue
        month_columns = [column for column in table["columns"][2:-1] if column in MONTHS]
        for month in month_columns:
            month_index = MONTHS.index(month) + 1
            value = 0
            for row in table["rows"]:
                if "_raw" in row:
                    continue
                if label_field and not row.get(label_field):
                    continue
                cell = row.get(month)
                if isinstance(cell, int):
                    value += cell
            observations.append({"date": f"{int(table['year']):04d}-{month_index:02d}", "value": value})
    return observations


def write_series_artifacts(tables: list[dict[str, Any]], fetched_at: str) -> list[dict[str, Any]]:
    state_tables = [table for table in tables if table["cut"] == "state_monthly"]
    if not state_tables:
        return []
    observations = aggregate_monthly(state_tables, "state_monthly")
    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": "auto.vahan.registrations.total_monthly",
        "title": "Vehicle registrations recorded in VAHAN",
        "sourceId": SOURCE_ID,
        "sourceIndicatorId": "vahan_state_monthly_sum",
        "sourceUrl": URL,
        "unit": "registrations",
        "frequency": "monthly",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": fetched_at,
        "observations": observations,
        "metadata": {
            "method": "Summed monthly VAHAN dashboard rows where y-axis=State and x-axis=Month Wise.",
            "caveat": "Registration records, not wholesale sales. Coverage follows VAHAN dashboard offices and historical backfills.",
        },
    }
    out = Path("data/series/vahan.IN.auto.registrations.total_monthly.json")
    write_json(out, artifact)
    return [{"indicatorId": artifact["indicatorId"], "artifact": str(out), "observations": len(observations)}]


def parse_years(value: str) -> list[str]:
    years: list[str] = []
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start, end = [int(piece) for piece in part.split("-", 1)]
            years.extend(str(year) for year in range(start, end + 1))
        else:
            years.append(part)
    return years


def finding_to_dict(finding: Finding) -> dict[str, Any]:
    return {
        "severity": finding.severity,
        "cut": finding.cut,
        "year": finding.year,
        "message": finding.message,
        **({} if finding.detail is None else {"detail": finding.detail}),
    }


def build_dataset_index(out_dir: Path, latest_report: str | None = None) -> dict[str, Any]:
    tables_dir = out_dir / "tables"
    validation_dir = out_dir / "validation"
    tables = []
    loaded_tables = []
    for path in sorted(tables_dir.glob("vahan_*.json")):
        try:
            table = json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:
            tables.append({"path": str(path), "status": "unreadable", "error": str(error)})
            continue
        tables.append(
            {
                "path": str(path),
                "cut": table.get("cut"),
                "yearType": table.get("yearType"),
                "year": table.get("year"),
                "rows": len(table.get("rows") or []),
                "columns": table.get("columns"),
                "sourceUrl": table.get("sourceUrl"),
                "fetchedAt": table.get("fetchedAt"),
            }
        )
        loaded_tables.append(table)
    reports = []
    for path in sorted(validation_dir.glob("vahan_validation_*.json")):
        try:
            report = json.loads(path.read_text(encoding="utf-8"))
            reports.append({"path": str(path), "summary": report.get("summary"), "request": report.get("request")})
        except Exception as error:
            reports.append({"path": str(path), "status": "unreadable", "error": str(error)})
    summary = {
        "tables": len(tables),
        "byCut": dict(sorted({cut: sum(1 for table in tables if table.get("cut") == cut) for cut in {table.get("cut") for table in tables}}.items())),
        "years": sorted({table.get("year") for table in tables if table.get("year") is not None}),
        "validationReports": len(reports),
    }
    cross_findings = validate_cross_cut_totals(loaded_tables)
    summary["crossCutErrors"] = sum(1 for finding in cross_findings if finding["severity"] == "error")
    summary["crossCutWarnings"] = sum(1 for finding in cross_findings if finding["severity"] == "warning")
    return {
        "sourceId": SOURCE_ID,
        "sourceUrl": URL,
        "updatedAt": now_iso(),
        "latestReport": latest_report,
        "summary": summary,
        "crossCutFindings": cross_findings,
        "tables": tables,
        "validationReports": reports,
    }


def validate_cross_cut_totals(tables: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_year_cut = {(table.get("year"), table.get("cut")): table for table in tables}
    findings: list[dict[str, Any]] = []
    years = sorted({table.get("year") for table in tables if isinstance(table.get("year"), int)})
    for year in years:
        state = by_year_cut.get((year, "state_monthly"))
        if not state:
            continue
        state_totals = monthly_totals(state)
        for cut in ["vehicle_class_monthly", "fuel_monthly"]:
            table = by_year_cut.get((year, cut))
            if not table:
                continue
            totals = monthly_totals(table)
            for month in sorted(set(state_totals) & set(totals)):
                difference = totals[month] - state_totals[month]
                if difference != 0:
                    severity = "warning" if abs(difference) <= 1 else "error"
                    findings.append(
                        {
                            "severity": severity,
                            "year": year,
                            "month": month,
                            "message": "cross-cut monthly total mismatch",
                            "detail": {
                                "state_monthly": state_totals[month],
                                cut: totals[month],
                                "difference": difference,
                            },
                        }
                    )
    return findings


def monthly_totals(table: dict[str, Any]) -> dict[str, int]:
    totals: dict[str, int] = {}
    year = int(table["year"])
    for month in [column for column in table.get("columns", [])[2:-1] if column in MONTHS]:
        month_index = MONTHS.index(month) + 1
        key = f"{year:04d}-{month_index:02d}"
        totals[key] = sum(row.get(month, 0) for row in table.get("rows", []) if isinstance(row.get(month), int))
    return totals


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape and validate VAHAN registration dashboard data.")
    parser.add_argument("--years", default="2025", help="Comma/range list, e.g. 2003-2026 or 2024,2025.")
    parser.add_argument("--cuts", default="state_monthly", help=f"Comma list from: {', '.join(CUTS)}")
    parser.add_argument("--year-type", choices=["C", "F"], default="C", help="C=calendar year, F=financial year.")
    parser.add_argument("--out-dir", default="Vaahan", help="Clean output directory. Intended to be commit-friendly.")
    parser.add_argument("--raw-dir", default="data/snapshots/vahan", help="Raw snapshot directory. Ignored by repo.")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between HTTP requests.")
    parser.add_argument("--max-pages", type=int, default=20, help="Safety cap for datatable pagination.")
    parser.add_argument("--write-series", action="store_true", help="Emit Indica series artifacts after validation passes.")
    parser.add_argument("--continue-on-validation-error", action="store_true", help="Write outputs even if validation finds errors.")
    parser.add_argument("--index-only", action="store_true", help="Only rebuild Vaahan/index.json and data/catalog/vahan-manifest.json.")
    args = parser.parse_args()

    years = parse_years(args.years)
    cuts = [cut.strip() for cut in args.cuts.split(",") if cut.strip()]
    unknown = [cut for cut in cuts if cut not in CUTS]
    if unknown:
        raise SystemExit(f"Unknown cut(s): {', '.join(unknown)}")

    out_dir = Path(args.out_dir)
    tables_dir = out_dir / "tables"
    validation_dir = out_dir / "validation"
    raw_dir = Path(args.raw_dir)
    fetched_at = now_iso()
    run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    if args.index_only:
        index = build_dataset_index(out_dir)
        write_json(out_dir / "index.json", index)
        write_json(Path("data/catalog/vahan-manifest.json"), index)
        print(json.dumps(index["summary"], indent=2))
        return 0

    initial_pages = []
    tables: list[dict[str, Any]] = []
    outputs: list[dict[str, Any]] = []
    findings: list[Finding] = []

    for cut in cuts:
        for year in years:
            print(f"fetching cut={cut} yearType={args.year_type} year={year}", flush=True)
            client = VahanClient(raw_dir=raw_dir, delay=args.delay)
            initial_pages.append({"cut": cut, "year": year, **client.start()})
            table = fetch_cut_year(client, cut, year, args.year_type, args.max_pages)
            table_findings = validate_table(table)
            findings.extend(table_findings)
            has_errors = any(finding.severity == "error" for finding in table_findings)
            if has_errors and not args.continue_on_validation_error:
                print(f"  validation failed; not writing clean table for {cut} {year}", file=sys.stderr)
            else:
                paths = write_table_outputs(table, tables_dir)
                outputs.append({"cut": cut, "year": year, "rows": len(table["rows"]), "paths": paths})
                tables.append(table)
                print(f"  wrote {len(table['rows'])} rows", flush=True)

    series_outputs = []
    if args.write_series:
        if findings and any(finding.severity == "error" for finding in findings):
            print("series output skipped because validation errors were found", file=sys.stderr)
        else:
            series_outputs = write_series_artifacts(tables, fetched_at)

    report = {
        "sourceId": SOURCE_ID,
        "sourceUrl": URL,
        "fetchedAt": fetched_at,
        "runId": run_id,
        "request": {"years": years, "cuts": cuts, "yearType": args.year_type, "delay": args.delay},
        "initialPages": initial_pages,
        "outputs": outputs,
        "seriesOutputs": series_outputs,
        "findings": [finding_to_dict(finding) for finding in findings],
        "summary": {
            "tablesWritten": len(outputs),
            "seriesWritten": len(series_outputs),
            "errors": sum(1 for finding in findings if finding.severity == "error"),
            "warnings": sum(1 for finding in findings if finding.severity == "warning"),
        },
    }
    report_path = validation_dir / f"vahan_validation_{run_id}.json"
    write_json(report_path, report)
    index = build_dataset_index(out_dir, latest_report=str(report_path))
    write_json(out_dir / "index.json", index)
    write_json(Path("data/catalog/vahan-manifest.json"), index)
    print(f"validation report: {report_path}")
    print(json.dumps(report["summary"], indent=2))
    return 1 if report["summary"]["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
