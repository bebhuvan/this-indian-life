#!/usr/bin/env python3
"""Ingest the Gemini-CLI digitized NHA report tables (csv_long format).

Input: the long-format cell CSVs at
  "../Indica doc parse/out/nha_records_gemini_cli/csv_long/*.cells.csv"
(schema: source_pdf, table_index, table_title, page, row_index, row_label,
column_name, value, notes).

This script is rerun-safe: point it at the directory after re-running failed
PDFs and it absorbs whatever is present. It:
  1. repairs rows whose unquoted commas split row_label into extra fields
     (merge middle fields back; rows with FEWER than 9 fields = schema drift,
     dropped and counted),
  2. skips empty files and ERROR stubs,
  3. extracts four table families per NHA round and writes one combined
     cross-round table artifact per family:
       - CHE by healthcare function        -> health.nha.che_by_function
       - CHE by healthcare provider        -> health.nha.che_by_provider
       - primary/secondary/tertiary share  -> health.nha.che_by_care_level
       - state key indicators per round    -> health.nha.state_panel
  4. prints a coverage matrix (round x family) so missing re-runs are visible.

Values cross-checked against the verified NHA key-indicator panel (exact
matches on all overlapping OOPE values, June 2026).
"""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# v1: ad-hoc gemini-cli single-shot outputs (half corrupt/empty, kept for the
#     rounds it got right); v2: extract_report_tables.py pipeline outputs
#     (discover/extract/stitch, validated per table) — preferred.
INPUT_DIRS = [
    ROOT.parent / "Indica doc parse" / "out" / "nha_records_gemini_cli" / "csv_long",
    ROOT.parent / "Indica doc parse" / "out" / "nha_v2",
]
OUT_DIR = ROOT / "data" / "series"
FETCHED_AT = datetime.now(timezone.utc).isoformat()
SOURCE_URL = "https://nhsrcindia.org/national-health-accounts-records"

HEADER = ["source_pdf", "table_index", "table_title", "page", "row_index",
          "row_label", "column_name", "value", "notes"]

FAMILIES = {
    "function": re.compile(r"by Healthcare Functions", re.I),
    "provider": re.compile(r"by Healthcare Providers", re.I),
    "care_level": re.compile(r"Primary.{0,5}(,| and |Secondary)", re.I),
    "states": re.compile(r"(Select States|Table A\.?6|Key Health Financing Indicators for .*States)", re.I),
}

# fiscal year detection, in priority order: "(2020-21)" in title, then filename
FY_PAT = re.compile(r"\(?((?:19|20)\d{2})\s*[-–]\s*(\d{2})\)?")


def repair_rows(path: Path) -> tuple[list[dict], int]:
    rows, dropped = [], 0
    with path.open(encoding="utf-8", errors="replace") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)
        if header is None or [h.strip() for h in header] != HEADER:
            return [], -1  # wrong schema entirely
        for fields in reader:
            if not fields or not any(f.strip() for f in fields):
                continue
            if len(fields) < 9:
                dropped += 1
                continue
            if len(fields) > 9:
                # unquoted commas split row_label (index 5): merge the extras
                extra = len(fields) - 9
                fields = fields[:5] + [", ".join(fields[5:5 + extra + 1])] + fields[5 + extra + 1:]
            rows.append(dict(zip(HEADER, fields)))
    return rows, dropped


def detect_fy(title: str, filename: str) -> str | None:
    for text in (title, filename.replace("_20", " ").replace("%20", " ")):
        m = FY_PAT.search(text or "")
        if m:
            start = int(m.group(1))
            return f"{start}-{m.group(2)}"
    return None


def fy_date(fy: str) -> str:
    return f"{int(fy[:4]) + 1}-03-31"


def clean_value(v: str):
    v = (v or "").strip().replace(",", "").replace("%", "")
    if v in ("", "-", "NA", "N/A", "nan"):
        return None
    try:
        return float(v)
    except ValueError:
        return v  # keep codes like HC.1.1.1 as strings


def main() -> None:
    files = []
    for d in INPUT_DIRS:
        files.extend(sorted(d.glob("*.cells.csv")))
        files.extend(sorted(d.glob("*/*.cells.csv")))
    if not files:
        raise SystemExit(f"no input files under {[d.as_posix() for d in INPUT_DIRS]}")

    collected: dict[str, list[dict]] = {k: [] for k in FAMILIES}
    coverage: dict[str, set[str]] = {}
    notes: list[str] = []

    for path in files:
        if path.stat().st_size == 0:
            notes.append(f"EMPTY: {path.name}")
            continue
        rows, dropped = repair_rows(path)
        if dropped == -1:
            notes.append(f"BAD SCHEMA (skipped): {path.name}")
            continue
        if not rows or any(r["table_title"] == "ERROR" for r in rows):
            notes.append(f"ERROR/NO ROWS (skipped): {path.name}")
            continue
        # 2014-15-style schema drift shows up as a high drop count; the
        # surviving rows from such a file can't be trusted either - skip it.
        total = len(rows) + dropped
        if dropped and dropped / total > 0.05:
            notes.append(f"HIGH DROP {dropped}/{total} (file EXCLUDED, redo this PDF): {path.name}")
            continue
        if dropped:
            notes.append(f"repaired/dropped {dropped} short rows: {path.name}")

        for r in rows:
            title = r["table_title"] or ""
            for family, pat in FAMILIES.items():
                if not pat.search(title):
                    continue
                fy = detect_fy(title, path.name)
                if not fy:
                    continue
                coverage.setdefault(fy, set()).add(family)
                collected[family].append({
                    "fy": fy,
                    "row_label": (r["row_label"] or "").strip(),
                    "column_name": (r["column_name"] or "").strip(),
                    "value": clean_value(r["value"]),
                    "source_pdf": r["source_pdf"],
                    "page": r["page"],
                })

    specs = {
        "function": ("health.nha.che_by_function",
                     "Current health expenditure by healthcare function, by NHA round",
                     "Rows carry NHA codes, Rs. crore and % per function; column_name distinguishes them."),
        "provider": ("health.nha.che_by_provider",
                     "Current health expenditure by healthcare provider, by NHA round",
                     "Hospitals, pharmacies, ambulatory providers etc.; column_name = NHA Codes / Rs. Crores / %."),
        "care_level": ("health.nha.che_by_care_level",
                       "Current health expenditure split across primary, secondary and tertiary care, by NHA round",
                       "column_name = Govt. / Pvt. / Combined, values in %."),
        "states": ("health.nha.state_panel",
                   "State-level key health financing indicators, by NHA round",
                   "row_label = state, column_name = 'indicator - unit' composite as printed in Table A.6."),
    }

    written = 0
    for family, rows in collected.items():
        if not rows:
            print(f"family {family}: nothing extracted yet")
            continue
        indicator_id, title, note = specs[family]
        artifact = {
            "schemaVersion": 1, "artifactType": "table",
            "indicatorId": indicator_id, "title": title,
            "sourceId": "nha-nhsrc-gemini",
            "sourceIndicatorId": family,
            "sourceUrl": SOURCE_URL, "unit": "mixed",
            "geography": {"type": "country", "id": "IN", "name": "India"},
            "dimensions": ["fy", "row_label", "column_name"],
            "fetchedAt": FETCHED_AT, "rows": rows,
            "metadata": {
                "source": "National Health Accounts reports (NHSRC/MoHFW), tables digitized via Gemini CLI",
                "method": "Long-format cell extraction; comma-split labels repaired; values "
                          "spot-checked against the verified NHA key-indicator panel.",
                "note": note,
                "roundsCovered": sorted({r["fy"] for r in rows}),
            },
        }
        path = OUT_DIR / f"nha-gemini.IN.health.{family}.json"
        path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"{path.name}  {indicator_id}  ({len(rows)} rows, rounds: {', '.join(sorted({r['fy'] for r in rows}))})")
        written += 1

    print("\n--- coverage matrix (round x family) ---")
    all_fams = list(FAMILIES)
    for fy in sorted(coverage):
        marks = "  ".join(f"{f}:{'Y' if f in coverage[fy] else '-'}" for f in all_fams)
        print(f"  {fy}: {marks}")
    print("\n--- file notes ---")
    for n in notes:
        print(" ", n)
    print(f"\nwrote {written} artifacts to {OUT_DIR}")


if __name__ == "__main__":
    main()
