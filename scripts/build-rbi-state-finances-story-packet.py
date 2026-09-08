#!/usr/bin/env python3
"""Build an evidence-locked story packet from prepared RBI State Finances artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from statistics import mean
from typing import Any


METRICS_PATH = Path("data/series/rbi-state-finances.IN.fiscal_room_metrics.json")
SELECTED_PATH = Path("data/series/rbi-state-finances.IN.selected_budget_heads.json")
DENOMINATOR_PATH = Path("data/series/rbi-state-finances.IN.denominator_metrics.json")
DENOMINATOR_AUDIT_PATH = Path("data/quality/rbi-state-finances-denominator-audit.json")
AUDIT_PATH = Path("data/quality/rbi-state-finances-2025-26-audit.json")
OUT_PATH = Path("data/quality/rbi-state-finances-story-packet.json")

LATEST_ACTUAL_FY = "2023-2024"
BUDGET_REALISATION_START = 2014
UTS_WITH_LEGISLATURE = {"NCT Delhi", "Puducherry", "Jammu and Kashmir"}

METRIC_LABELS = {
    "own_revenue_share": "Own revenue as share of total revenue",
    "central_transfer_share": "Central tax share plus grants as share of total revenue",
    "interest_pensions_revenue_share": "Interest plus pensions as share of total revenue",
    "capital_outlay_revenue_expenditure_share": "Capital outlay as share of revenue expenditure",
    "capital_outlay_aggregate_spending_share": "Capital outlay as share of revenue expenditure plus capital outlay",
    "revenue_expenditure_aggregate_spending_share": "Revenue expenditure as share of revenue expenditure plus capital outlay",
    "education_expenditure_share": "Education revenue expenditure as share of revenue expenditure",
    "health_family_welfare_expenditure_share": "Medical/public health plus family welfare as share of revenue expenditure",
    "revenue_balance_revenue_share": "Revenue account balance as share of revenue",
    "sgst_own_tax_share": "SGST as share of own tax revenue",
    "sales_tax_own_tax_share": "Sales tax as share of own tax revenue",
    "state_excise_own_tax_share": "State excise as share of own tax revenue",
    "stamps_registration_own_tax_share": "Stamps and registration as share of own tax revenue",
    "total_revenue_actual_to_budget": "Revenue actual as share of budget estimate",
    "total_expenditure_actual_to_budget": "Revenue expenditure actual as share of budget estimate",
    "capital_outlay_actual_to_budget": "Capital outlay actual as share of budget estimate",
    "interest_payments_actual_to_budget": "Interest payments actual as share of budget estimate",
    "pensions_actual_to_budget": "Pensions actual as share of budget estimate",
    "grants_from_centre_actual_to_budget": "Grants from Centre actual as share of budget estimate",
    "revenue_expenditure_gsdp": "Revenue expenditure as % of GSDP",
    "capital_outlay_gsdp": "Capital outlay as % of GSDP",
    "interest_pensions_gsdp": "Interest plus pensions as % of GSDP",
    "revenue_expenditure_per_person": "Revenue expenditure per person",
    "capital_outlay_per_person": "Capital outlay per person",
    "education_per_person": "Education revenue expenditure per person",
    "health_family_welfare_per_person": "Medical/public health plus family welfare per person",
}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def round_value(value: float | None, digits: int = 1) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


def metric_rows(rows: list[dict[str, Any]], metric_id: str, estimate_type: str = "actual") -> list[dict[str, Any]]:
    return [
        row for row in rows
        if row["metricId"] == metric_id and row["estimateType"] == estimate_type and row["value"] is not None
    ]


def latest_metric(rows: list[dict[str, Any]], metric_id: str, state: str = "All States/UT", estimate_type: str = "actual") -> dict[str, Any]:
    matches = [
        row for row in rows
        if row["metricId"] == metric_id
        and row["state"] == state
        and row["fiscalYear"] == LATEST_ACTUAL_FY
        and row["estimateType"] == estimate_type
    ]
    if len(matches) != 1:
        raise ValueError(f"Expected one latest row for {metric_id}/{state}/{estimate_type}, got {len(matches)}")
    row = matches[0]
    return {
        "metricId": metric_id,
        "label": METRIC_LABELS.get(metric_id, metric_id),
        "state": state,
        "fiscalYear": row["fiscalYear"],
        "estimateType": estimate_type,
        "value": round_value(row["value"], 2),
        "unit": row["unit"],
    }


def long_run_summary(rows: list[dict[str, Any]], metric_id: str) -> dict[str, Any]:
    series = [
        row for row in metric_rows(rows, metric_id, "actual")
        if row["state"] == "All States/UT" and row["fiscalYearStart"] <= 2023
    ]
    if not series:
        raise ValueError(f"No long-run rows for {metric_id}")
    low = min(series, key=lambda row: row["value"])
    high = max(series, key=lambda row: row["value"])
    latest = [row for row in series if row["fiscalYear"] == LATEST_ACTUAL_FY][0]
    return {
        "metricId": metric_id,
        "label": METRIC_LABELS.get(metric_id, metric_id),
        "min": {"fiscalYear": low["fiscalYear"], "value": round_value(low["value"], 1)},
        "max": {"fiscalYear": high["fiscalYear"], "value": round_value(high["value"], 1)},
        "latest": {"fiscalYear": latest["fiscalYear"], "value": round_value(latest["value"], 1)},
    }


def state_rankings(rows: list[dict[str, Any]], metric_id: str, *, n: int = 8) -> dict[str, Any]:
    state_rows = [
        row for row in metric_rows(rows, metric_id, "actual")
        if row["fiscalYear"] == LATEST_ACTUAL_FY
        and not row["isAllStatesAggregate"]
        and not row["isStructuralZero"]
    ]
    for row in state_rows:
        row["stateType"] = "ut_with_legislature" if row["state"] in UTS_WITH_LEGISLATURE else "state"
    ranked = sorted(state_rows, key=lambda row: row["value"])

    def keep(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "state": row["state"],
            "stateCode": row["stateCode"],
            "stateType": row["stateType"],
            "fiscalYear": row["fiscalYear"],
            "value": round_value(row["value"], 1),
            "unit": row["unit"],
        }

    return {
        "metricId": metric_id,
        "label": METRIC_LABELS.get(metric_id, metric_id),
        "fiscalYear": LATEST_ACTUAL_FY,
        "lowest": [keep(row) for row in ranked[:n]],
        "highest": [keep(row) for row in ranked[-n:][::-1]],
        "rankingNote": "Includes states and UTs with legislature except the All States/UT aggregate. Delhi, Puducherry and Jammu and Kashmir are flagged because their expenditure responsibilities differ from full states.",
    }


def denominator_rankings(rows: list[dict[str, Any]], metric_id: str, *, n: int = 8) -> dict[str, Any]:
    state_rows = [
        row for row in rows
        if row["metricId"] == metric_id
        and row["fiscalYear"] == LATEST_ACTUAL_FY
        and row["value"] is not None
    ]
    ranked = sorted(state_rows, key=lambda row: row["value"])

    def keep(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "state": row["state"],
            "stateCode": row["stateCode"],
            "stateType": row["stateType"],
            "fiscalYear": row["fiscalYear"],
            "value": round_value(row["value"], 1),
            "unit": row["unit"],
            "gsdpRupeesCrore": round_value(row.get("gsdpRupeesCrore"), 1),
            "populationDerivedPersons": round(row["populationDerivedPersons"]) if row.get("populationDerivedPersons") is not None else None,
            "handbookStateName": row["handbookStateName"],
        }

    return {
        "metricId": metric_id,
        "label": METRIC_LABELS.get(metric_id, metric_id),
        "fiscalYear": LATEST_ACTUAL_FY,
        "lowest": [keep(row) for row in ranked[:n]],
        "highest": [keep(row) for row in ranked[-n:][::-1]],
        "rankingNote": "Uses only states/UTs with matching RBI State Finances Account data and RBI Handbook GSDP/population denominators. Population is Handbook-derived, not a new census count.",
    }


def budget_realisation_average(rows: list[dict[str, Any]], metric_id: str) -> dict[str, Any]:
    series = [
        row for row in metric_rows(rows, metric_id, "actual_as_percent_of_budget")
        if row["state"] == "All States/UT"
        and BUDGET_REALISATION_START <= row["fiscalYearStart"] <= 2023
    ]
    if not series:
        raise ValueError(f"No budget realisation rows for {metric_id}")
    low = min(series, key=lambda row: row["value"])
    high = max(series, key=lambda row: row["value"])
    latest = [row for row in series if row["fiscalYear"] == LATEST_ACTUAL_FY][0]
    return {
        "metricId": metric_id,
        "label": METRIC_LABELS.get(metric_id, metric_id),
        "window": f"{BUDGET_REALISATION_START}-15 to 2023-24",
        "average": round_value(mean(row["value"] for row in series), 1),
        "min": {"fiscalYear": low["fiscalYear"], "value": round_value(low["value"], 1)},
        "max": {"fiscalYear": high["fiscalYear"], "value": round_value(high["value"], 1)},
        "latest": {"fiscalYear": latest["fiscalYear"], "value": round_value(latest["value"], 1)},
    }


def rupee_value(rows: list[dict[str, Any]], metric_id: str, state: str = "All States/UT", fy: str = LATEST_ACTUAL_FY, column: str = "account") -> dict[str, Any]:
    matches = [row for row in rows if row["metricId"] == metric_id and row["state"] == state and row["fiscalYear"] == fy]
    if len(matches) != 1:
        raise ValueError(f"Expected one selected row for {metric_id}/{state}/{fy}, got {len(matches)}")
    row = matches[0]
    return {
        "metricId": metric_id,
        "label": row["metricLabel"],
        "state": state,
        "fiscalYear": fy,
        "estimateType": column,
        "valueRupeesCrore": round_value(row[column], 2),
        "valueLakhCrore": round_value(row[column] / 100000 if row[column] is not None else None, 2),
        "unit": row["unit"],
    }


def tax_basket(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    metrics = [
        "sgst_own_tax_share",
        "sales_tax_own_tax_share",
        "state_excise_own_tax_share",
        "stamps_registration_own_tax_share",
    ]
    years = ["2016-2017", "2017-2018", LATEST_ACTUAL_FY]
    out = []
    for fy in years:
        for metric_id in metrics:
            matches = [
                row for row in metric_rows(rows, metric_id, "actual")
                if row["state"] == "All States/UT" and row["fiscalYear"] == fy
            ]
            if matches:
                out.append({
                    "metricId": metric_id,
                    "label": METRIC_LABELS[metric_id],
                    "fiscalYear": fy,
                    "value": round_value(matches[0]["value"], 1),
                    "unit": "percent of own tax revenue",
                })
    return out


def main() -> None:
    metrics_artifact = load_json(METRICS_PATH)
    selected_artifact = load_json(SELECTED_PATH)
    denominator_artifact = load_json(DENOMINATOR_PATH)
    denominator_audit = load_json(DENOMINATOR_AUDIT_PATH)
    audit = load_json(AUDIT_PATH)
    metrics = metrics_artifact["rows"]
    selected = selected_artifact["rows"]
    denominators = denominator_artifact["rows"]

    packet = {
        "question": "How much room do Indian states really have in their budgets?",
        "latestActualFiscalYear": LATEST_ACTUAL_FY,
        "sourceUrls": {
            "rbiPublicationPage": audit["source"]["sourcePageUrl"],
            "rbiWorkbook": audit["source"]["sourceWorkbookUrl"],
            "rbiMethodologyPdf": audit["source"]["sourceMethodologyPdfUrl"],
            "rbiNotesPdf": audit["source"]["sourceNotesPdfUrl"],
        },
        "allowedHeadlineClaims": [
            "Use 2023-24 Account as the latest full actual year.",
            "Say capital outlay was about 15.7% of revenue expenditure plus capital outlay in 2023-24. If using capital outlay divided by revenue expenditure, label it explicitly as 18.6% of revenue expenditure.",
            "Say interest plus pensions took about 25.4% of all-state revenue in 2023-24.",
            "Say central tax share plus grants made up about 42.2% of all-state revenue in 2023-24.",
            "Say capital outlay actuals averaged 81.0% of Budget Estimates from 2014-15 to 2023-24, while interest payments averaged 98.9%.",
            "For cross-state capacity claims, use the denominator metrics: per-GSDP values start in 2011-12 and per-person values use RBI Handbook-derived population.",
        ],
        "doNotClaim": [
            "Do not call Appendix-2 total expenditure total state spending. It is revenue expenditure in this workbook structure.",
            "Do not compare raw rupee totals across states as fiscal capacity.",
            "Do not use All States/UT across 2016-17 to 2017-18 without the UT-scope break caveat.",
            "Do not use Karnataka top-level revenue composition for 2021-22 Account, 2022-23 Revised, or 2023-24 Budget without mentioning the source reconciliation problem.",
            "Do not treat 2025-26 Budget Estimates as observed spending.",
            "Do not treat Handbook-derived population as a census count.",
        ],
        "headlineRupeeValues": [
            rupee_value(selected, "total_revenue"),
            rupee_value(selected, "total_expenditure"),
            rupee_value(selected, "capital_outlay"),
            rupee_value(selected, "interest_payments"),
            rupee_value(selected, "pensions"),
        ],
        "headlinePercentMetrics": [
            latest_metric(metrics, "own_revenue_share"),
            latest_metric(metrics, "central_transfer_share"),
            latest_metric(metrics, "interest_pensions_revenue_share"),
            latest_metric(metrics, "capital_outlay_revenue_expenditure_share"),
            latest_metric(metrics, "capital_outlay_aggregate_spending_share"),
            latest_metric(metrics, "revenue_expenditure_aggregate_spending_share"),
            latest_metric(metrics, "education_expenditure_share"),
            latest_metric(metrics, "health_family_welfare_expenditure_share"),
        ],
        "longRunSummaries": [
            long_run_summary(metrics, "central_transfer_share"),
            long_run_summary(metrics, "interest_pensions_revenue_share"),
            long_run_summary(metrics, "capital_outlay_revenue_expenditure_share"),
            long_run_summary(metrics, "capital_outlay_aggregate_spending_share"),
        ],
        "budgetRealisation": [
            budget_realisation_average(metrics, "total_revenue_actual_to_budget"),
            budget_realisation_average(metrics, "total_expenditure_actual_to_budget"),
            budget_realisation_average(metrics, "capital_outlay_actual_to_budget"),
            budget_realisation_average(metrics, "interest_payments_actual_to_budget"),
            budget_realisation_average(metrics, "pensions_actual_to_budget"),
            budget_realisation_average(metrics, "grants_from_centre_actual_to_budget"),
        ],
        "stateRankings": [
            state_rankings(metrics, "central_transfer_share"),
            state_rankings(metrics, "interest_pensions_revenue_share"),
            state_rankings(metrics, "capital_outlay_aggregate_spending_share"),
            state_rankings(metrics, "revenue_balance_revenue_share"),
            state_rankings(metrics, "education_expenditure_share"),
            state_rankings(metrics, "health_family_welfare_expenditure_share"),
        ],
        "denominatorRankings": [
            denominator_rankings(denominators, "revenue_expenditure_gsdp"),
            denominator_rankings(denominators, "capital_outlay_gsdp"),
            denominator_rankings(denominators, "interest_pensions_gsdp"),
            denominator_rankings(denominators, "revenue_expenditure_per_person"),
            denominator_rankings(denominators, "capital_outlay_per_person"),
            denominator_rankings(denominators, "education_per_person"),
            denominator_rankings(denominators, "health_family_welfare_per_person"),
        ],
        "denominatorCoverage": denominator_audit["coverage"],
        "denominatorCaveats": denominator_artifact["metadata"]["caveats"],
        "taxBasket": tax_basket(metrics),
        "methodCaveats": audit["source"]["scopeCaveats"],
        "sourceExceptions": [
            row for row in audit["reconciliation"]["componentChecks"]
            if row["failCount"]
        ],
    }

    write_json(OUT_PATH, packet)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
