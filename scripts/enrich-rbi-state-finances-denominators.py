#!/usr/bin/env python3
"""Add RBI Handbook GSDP and population denominators to cleaned State Finances data."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SELECTED_PATH = Path("data/series/rbi-state-finances.IN.selected_budget_heads.json")
METRICS_PATH = Path("data/series/rbi-state-finances.IN.fiscal_room_metrics.json")
HANDBOOK_PATH = Path("data/snapshots/estates/rbi_handbook_states.json")
OUT_PATH = Path("data/series/rbi-state-finances.IN.denominator_metrics.json")
QUALITY_PATH = Path("data/quality/rbi-state-finances-denominator-audit.json")
MANIFEST_PATH = Path("data/catalog/rbi-state-finances-manifest.json")

STATE_FINANCES_URL = "https://rbidocs.rbi.org.in/rdocs/Publications/DOCs/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A.XLSX"
HANDBOOK_URL = "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States"

NAME_MAP = {
    "NCT Delhi": "Delhi",
}

UTS_WITH_LEGISLATURE = {"NCT Delhi", "Puducherry", "Jammu and Kashmir"}

RUPEE_CRORE_METRICS = {
    "total_revenue",
    "own_tax_revenue",
    "own_non_tax_revenue",
    "share_in_central_taxes",
    "grants_from_centre",
    "total_expenditure",
    "education",
    "medical_public_health",
    "family_welfare",
    "interest_payments",
    "pensions",
    "capital_outlay",
    "revenue_balance",
}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def write_manifest_entry(entry: dict[str, Any]) -> None:
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    else:
        manifest = []
    manifest = [item for item in manifest if item.get("indicatorId") != entry["indicatorId"]]
    manifest.append(entry)
    write_json(MANIFEST_PATH, manifest)


def clean(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def safe_sum(*values: float | None) -> float | None:
    if any(value is None for value in values):
        return None
    return sum(value for value in values if value is not None)


def safe_div(num: float | None, den: float | None, scale: float = 1.0) -> float | None:
    if num is None or den is None or den == 0:
        return None
    return num / den * scale


def by_state_year_metric(rows: list[dict[str, Any]]) -> dict[tuple[str, str, str], dict[str, Any]]:
    out = {}
    for row in rows:
        out[(row["state"], row["fiscalYear"], row["metricId"])] = row
    return out


def selected_value(index: dict[tuple[str, str, str], dict[str, Any]], state: str, fy: str, metric: str, column: str = "account") -> float | None:
    row = index.get((state, fy, metric))
    if not row:
        return None
    return clean(row.get(column))


def handbook_state_name(state: str) -> str:
    return NAME_MAP.get(state, state)


def handbook_value(hb: dict[str, Any], state: str, year_key: str, field: str) -> float | None:
    block = hb.get(handbook_state_name(state))
    if not isinstance(block, dict):
        return None
    return clean(block.get(field, {}).get(year_key))


def derived_metric_rows(selected_rows: list[dict[str, Any]], hb_states: dict[str, Any], fetched_at: str) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    index = by_state_year_metric(selected_rows)
    state_years = sorted({
        (row["state"], row["stateCode"], row["fiscalYear"], row["fiscalYearStart"], row["fiscalYearEnd"], row["isAllStatesAggregate"], row["isStructuralZero"])
        for row in selected_rows
        if not row["isAllStatesAggregate"] and not row["isStructuralZero"]
    })

    rows = []
    missing = []
    coverage = {"stateYearsConsidered": 0, "stateYearsWithGSDP": 0, "stateYearsWithPopulation": 0}

    for state, state_code, fy, fy_start, fy_end, is_all, structural_zero in state_years:
        year_key = str(fy_start)
        gsdp = handbook_value(hb_states, state, year_key, "gsdp_crore")
        nsdp = handbook_value(hb_states, state, year_key, "nsdp_crore")
        pc_nsdp = handbook_value(hb_states, state, year_key, "per_capita_nsdp_inr")
        population = handbook_value(hb_states, state, year_key, "population")
        coverage["stateYearsConsidered"] += 1
        if gsdp is not None:
            coverage["stateYearsWithGSDP"] += 1
        if population is not None:
            coverage["stateYearsWithPopulation"] += 1
        if gsdp is None or population is None:
            missing.append({
                "state": state,
                "fiscalYear": fy,
                "handbookState": handbook_state_name(state),
                "missingGSDP": gsdp is None,
                "missingPopulation": population is None,
            })

        def get(metric: str) -> float | None:
            return selected_value(index, state, fy, metric)

        own_revenue = safe_sum(get("own_tax_revenue"), get("own_non_tax_revenue"))
        central_transfers = safe_sum(get("share_in_central_taxes"), get("grants_from_centre"))
        committed = safe_sum(get("interest_payments"), get("pensions"))
        health_family = safe_sum(get("medical_public_health"), get("family_welfare"))

        metric_defs = {
            "total_revenue_gsdp": ("Total revenue as % of GSDP", safe_div(get("total_revenue"), gsdp, 100)),
            "own_revenue_gsdp": ("Own revenue as % of GSDP", safe_div(own_revenue, gsdp, 100)),
            "central_transfers_gsdp": ("Central transfers as % of GSDP", safe_div(central_transfers, gsdp, 100)),
            "revenue_expenditure_gsdp": ("Revenue expenditure as % of GSDP", safe_div(get("total_expenditure"), gsdp, 100)),
            "capital_outlay_gsdp": ("Capital outlay as % of GSDP", safe_div(get("capital_outlay"), gsdp, 100)),
            "interest_pensions_gsdp": ("Interest plus pensions as % of GSDP", safe_div(committed, gsdp, 100)),
            "revenue_balance_gsdp": ("Revenue balance as % of GSDP", safe_div(get("revenue_balance"), gsdp, 100)),
            "revenue_expenditure_per_person": ("Revenue expenditure per person", safe_div(get("total_expenditure"), population, 10_000_000)),
            "capital_outlay_per_person": ("Capital outlay per person", safe_div(get("capital_outlay"), population, 10_000_000)),
            "education_per_person": ("Education revenue expenditure per person", safe_div(get("education"), population, 10_000_000)),
            "health_family_welfare_per_person": ("Medical/public health plus family welfare per person", safe_div(health_family, population, 10_000_000)),
            "interest_pensions_per_person": ("Interest plus pensions per person", safe_div(committed, population, 10_000_000)),
        }

        for metric_id, (label, value) in metric_defs.items():
            if value is None:
                continue
            rows.append({
                "state": state,
                "stateCode": state_code,
                "stateType": "ut_with_legislature" if state in UTS_WITH_LEGISLATURE else "state",
                "fiscalYear": fy,
                "fiscalYearStart": fy_start,
                "fiscalYearEnd": fy_end,
                "metricId": metric_id,
                "metricLabel": label,
                "value": None if value is None else round(value, 4),
                "unit": "percent" if metric_id.endswith("_gsdp") else "rupees per person",
                "estimateType": "actual",
                "sourceFinanceColumn": "Account",
                "gsdpRupeesCrore": gsdp,
                "nsdpRupeesCrore": nsdp,
                "populationDerivedPersons": population,
                "perCapitaNsdpRupees": pc_nsdp,
                "handbookYearKey": year_key,
                "handbookStateName": handbook_state_name(state),
                "fetchedAt": fetched_at,
            })

    audit = {
        "coverage": coverage,
        "missingDenominators": missing,
        "notes": [
            "GSDP, NSDP and per-capita NSDP come from the RBI Handbook of Statistics on Indian States 2024-25 snapshot.",
            "Population is derived in the Handbook snapshot as NSDP divided by per-capita NSDP, not a fresh census count.",
            "Only rows with matching State Finances Account data and Handbook denominator data are used.",
            "All States/UT aggregate rows are deliberately excluded from this denominator artifact because the detailed State Finances rows and Handbook UT coverage do not have identical scope.",
            "NCT Delhi is matched to Delhi in the Handbook snapshot.",
        ],
    }
    return rows, audit


def main() -> None:
    fetched_at = datetime.now(timezone.utc).isoformat()
    selected = load_json(SELECTED_PATH)
    hb = load_json(HANDBOOK_PATH)
    rows, audit = derived_metric_rows(selected["rows"], hb["states"], fetched_at)

    artifact = {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": "fiscal.rbi_state_finances.denominator_metrics",
        "title": "RBI State Finances with GSDP and population denominators",
        "sourceId": "rbi-state-finances+rbi-handbook-states",
        "sourceIndicatorId": "State Finances 2025-26 Account values joined to RBI Handbook 2024-25 GSDP/population denominators",
        "sourceUrl": STATE_FINANCES_URL,
        "unit": "mixed",
        "geography": {"type": "state", "id": "IN-STATES", "name": "Indian states and UTs with legislature"},
        "dimensions": ["state", "fiscalYear", "metricId"],
        "fetchedAt": fetched_at,
        "rows": rows,
        "metadata": {
            "stateFinancesArtifact": str(SELECTED_PATH),
            "handbookSnapshot": str(HANDBOOK_PATH),
            "stateFinancesUrl": STATE_FINANCES_URL,
            "handbookUrl": HANDBOOK_URL,
            "handbookMeta": hb.get("_meta", {}),
            "methodology": [
                "For each state fiscal year, Account values from selected RBI State Finances budget heads are divided by current-price GSDP in rupees crore from the RBI Handbook.",
                "Per-person values convert rupees crore to rupees and divide by the Handbook-derived population value.",
                "The fiscal year 2023-2024 is aligned to Handbook year key 2023, meaning 2023-24.",
            ],
            "caveats": audit["notes"],
        },
    }

    write_json(OUT_PATH, artifact)
    write_json(QUALITY_PATH, {
        "artifact": str(OUT_PATH),
        "rowCount": len(rows),
        **audit,
    })
    write_manifest_entry({
        "status": "ready",
        "indicatorId": artifact["indicatorId"],
        "artifact": str(OUT_PATH),
        "inputs": [str(SELECTED_PATH), str(HANDBOOK_PATH)],
        "rows": len(rows),
        "fetchedAt": fetched_at,
        "sourceUrl": STATE_FINANCES_URL,
        "secondarySourceUrl": HANDBOOK_URL,
    })
    print(f"Wrote {OUT_PATH} ({len(rows)} rows)")
    print(f"Wrote {QUALITY_PATH}")


if __name__ == "__main__":
    main()
