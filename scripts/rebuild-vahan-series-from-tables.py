#!/usr/bin/env python3
"""Rebuild article-ready VAHAN series from committed normalized tables."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path


MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
SOURCE_URL = "https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml"


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def load_tables(cut: str) -> list[dict]:
    tables = []
    for path in sorted(Path("Vaahan/tables").glob(f"vahan_{cut}_calendar_*.json")):
        tables.append(json.loads(path.read_text(encoding="utf-8")))
    return tables


def monthly_totals(table: dict) -> list[dict]:
    year = int(table["year"])
    observations = []
    for month in [column for column in table.get("columns", [])[2:-1] if column in MONTHS]:
        month_index = MONTHS.index(month) + 1
        value = sum(row.get(month, 0) for row in table.get("rows", []) if isinstance(row.get(month), int))
        observations.append({"date": f"{year:04d}-{month_index:02d}", "value": value})
    return observations


def main() -> int:
    fetched_at = now_iso()
    state_tables = load_tables("state_monthly")
    observations = []
    for table in state_tables:
        observations.extend(monthly_totals(table))
    observations.sort(key=lambda row: row["date"])

    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": "auto.vahan.registrations.total_monthly",
        "title": "Vehicle registrations recorded in VAHAN",
        "sourceId": "vahan",
        "sourceIndicatorId": "vahan_state_monthly_sum",
        "sourceUrl": SOURCE_URL,
        "unit": "registrations",
        "frequency": "monthly",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": fetched_at,
        "observations": observations,
        "metadata": {
            "method": "Summed monthly VAHAN dashboard rows where y-axis=State and x-axis=Month Wise, rebuilt from normalized local VAHAN tables.",
            "caveat": "Registration records, not wholesale sales. Coverage follows VAHAN dashboard offices and historical backfills. 2026 is partial in the current local tables.",
        },
    }
    out = Path("data/series/vahan.IN.auto.registrations.total_monthly.json")
    write_json(out, artifact)
    print(json.dumps({
        "artifact": str(out),
        "observations": len(observations),
        "first": observations[0] if observations else None,
        "latest": observations[-1] if observations else None,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
