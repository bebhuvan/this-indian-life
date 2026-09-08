#!/usr/bin/env python3
"""Build chart-ready artifacts for the RBI state-finances fiscal-room story."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SERIES_DIR = ROOT / "data" / "series"
CATALOG_PATH = ROOT / "data" / "catalog" / "rbi-state-finances-manifest.json"

STATE_FINANCES_URL = "https://www.rbi.org.in/scripts/AnnualPublications.aspx?head=State+Finances+%3A+A+Study+of+Budgets"
STATE_FINANCES_WORKBOOK_URL = "https://rbidocs.rbi.org.in/rdocs/Publications/DOCS/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A.XLSX"
HANDBOOK_URL = "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text())


def source_slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.@-]+", "_", value)


def write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def fiscal_label(row: dict) -> str:
    return str(row["fiscalYearEnd"])


def fiscal_year_text(row: dict) -> str:
    start = int(row["fiscalYearStart"])
    end = int(row["fiscalYearEnd"])
    return f"{start}-{str(end)[-2:]}"


def round_value(value: float | int | None, digits: int = 1) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


def artifact_base(
    *,
    artifact_type: str,
    indicator_id: str,
    title: str,
    source_id: str,
    source_indicator_id: str,
    source_url: str,
    unit: str,
    geography: dict | None = None,
    metadata: dict | None = None,
) -> dict:
    return {
        "schemaVersion": 1,
        "artifactType": artifact_type,
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": "annual" if artifact_type == "series" else None,
        "geography": geography or {"type": "country", "id": "IN", "name": "India"},
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {},
    }


def make_series(
    *,
    indicator_id: str,
    title: str,
    source_id: str,
    source_indicator_id: str,
    source_url: str,
    unit: str,
    observations: list[dict],
    metadata: dict | None = None,
) -> dict:
    artifact = artifact_base(
        artifact_type="series",
        indicator_id=indicator_id,
        title=title,
        source_id=source_id,
        source_indicator_id=source_indicator_id,
        source_url=source_url,
        unit=unit,
        metadata=metadata,
    )
    artifact["observations"] = observations
    return {k: v for k, v in artifact.items() if v is not None}


def make_table(
    *,
    indicator_id: str,
    title: str,
    source_id: str,
    source_indicator_id: str,
    source_url: str,
    unit: str,
    rows: list[dict],
    geography: dict | None = None,
    metadata: dict | None = None,
) -> dict:
    artifact = artifact_base(
        artifact_type="table",
        indicator_id=indicator_id,
        title=title,
        source_id=source_id,
        source_indicator_id=source_indicator_id,
        source_url=source_url,
        unit=unit,
        geography=geography,
        metadata=metadata,
    )
    artifact.pop("frequency", None)
    artifact["rows"] = rows
    return artifact


def upsert_manifest(entries: list[dict]) -> None:
    current: list[dict] = []
    if CATALOG_PATH.exists():
        parsed = load_json(CATALOG_PATH)
        if isinstance(parsed, list):
            current = parsed

    incoming = {(entry.get("indicatorId"), entry.get("sourceIndicatorId")) for entry in entries}
    merged = [
        entry
        for entry in current
        if (entry.get("indicatorId"), entry.get("sourceIndicatorId")) not in incoming
    ]
    merged.extend(entries)
    write_json(CATALOG_PATH, merged)


def main() -> None:
    selected = load_json(SERIES_DIR / "rbi-state-finances.IN.selected_budget_heads.json")
    fiscal = load_json(SERIES_DIR / "rbi-state-finances.IN.fiscal_room_metrics.json")
    denom = load_json(SERIES_DIR / "rbi-state-finances.IN.denominator_metrics.json")

    selected_rows = selected["rows"]
    fiscal_rows = fiscal["rows"]
    denom_rows = denom["rows"]

    artifacts: list[tuple[str, dict]] = []

    common_meta = {
        "publication": "RBI State Finances: A Study of Budgets, 2025-26",
        "sourcePageUrl": STATE_FINANCES_URL,
        "sourceWorkbookUrl": STATE_FINANCES_WORKBOOK_URL,
        "method": "Derived from RBI e-STATES Appendix rows. Account is treated as actual, Revised as revised estimate, and Budget as budget estimate.",
        "caveats": [
            "All States/UT aggregate has a scope break: UTs are excluded from 1990-91 to 2016-17, except NCT Delhi is included from 2000-01 to 2004-05; from 2017-18 it covers all states and UTs.",
            "2023-24 Account is the latest full actual year in the workbook. 2024-25 is Revised Estimate and 2025-26 is Budget Estimate.",
            "Rupee values are nominal.",
        ],
    }

    selected_labels = {
        "total_revenue": "Total revenue",
        "total_expenditure": "Revenue expenditure",
        "capital_outlay": "Capital outlay",
        "developmental_expenditure": "Developmental revenue expenditure",
        "non_developmental_expenditure": "Non-developmental revenue expenditure",
        "grants_in_aid_contributions": "Grants-in-aid and contributions",
        "education": "Education revenue expenditure",
        "medical_public_health": "Medical and public health revenue expenditure",
        "family_welfare": "Family welfare revenue expenditure",
        "interest_payments": "Interest payments",
        "pensions": "Pensions",
        "grants_from_centre": "Grants from Centre",
    }
    selected_indicator_suffix = {
        "total_revenue": "total_revenue_lakh_crore",
        "total_expenditure": "revenue_expenditure_lakh_crore",
        "capital_outlay": "capital_outlay_lakh_crore",
        "developmental_expenditure": "developmental_expenditure_lakh_crore",
        "non_developmental_expenditure": "non_developmental_expenditure_lakh_crore",
        "grants_in_aid_contributions": "grants_in_aid_contributions_lakh_crore",
        "education": "education_lakh_crore",
        "medical_public_health": "medical_public_health_lakh_crore",
        "family_welfare": "family_welfare_lakh_crore",
        "interest_payments": "interest_payments_lakh_crore",
        "pensions": "pensions_lakh_crore",
        "grants_from_centre": "grants_from_centre_lakh_crore",
    }

    for metric_id, label in selected_labels.items():
        rows = [
            row
            for row in selected_rows
            if row["state"] == "All States/UT"
            and row["metricId"] == metric_id
            and row.get("account") is not None
        ]
        observations = [
            {"date": fiscal_label(row), "value": round_value(row["account"] / 100000, 3)}
            for row in sorted(rows, key=lambda item: item["fiscalYearEnd"])
        ]
        indicator_id = f"fiscal.state_budgets.{selected_indicator_suffix[metric_id]}"
        artifacts.append(
            (
                indicator_id,
                make_series(
                    indicator_id=indicator_id,
                    title=f"{label}, all states and UTs",
                    source_id="rbi-state-finances",
                    source_indicator_id=f"{metric_id} Account, All States/UT",
                    source_url=STATE_FINANCES_WORKBOOK_URL,
                    unit="Rs lakh crore",
                    observations=observations,
                    metadata={
                        **common_meta,
                        "transform": "Rupees crore divided by 100000 to express values in lakh crore. Date is the fiscal year ending year.",
                    },
                ),
            )
        )

    share_labels = {
        "own_revenue_share": "Own revenue share",
        "central_transfer_share": "Central transfer share",
        "interest_pensions_revenue_share": "Interest plus pensions share of revenue",
        "capital_outlay_aggregate_spending_share": "Capital outlay share of revenue expenditure plus capital outlay",
        "revenue_expenditure_aggregate_spending_share": "Revenue expenditure share of revenue expenditure plus capital outlay",
        "education_expenditure_share": "Education share of revenue expenditure",
        "health_family_welfare_expenditure_share": "Health plus family welfare share of revenue expenditure",
        "revenue_balance_revenue_share": "Revenue balance as share of total revenue",
    }
    for metric_id, label in share_labels.items():
        rows = [
            row
            for row in fiscal_rows
            if row["state"] == "All States/UT"
            and row["metricId"] == metric_id
            and row["estimateType"] == "actual"
            and row.get("value") is not None
        ]
        observations = [
            {"date": fiscal_label(row), "value": round_value(row["value"], 2)}
            for row in sorted(rows, key=lambda item: item["fiscalYearEnd"])
        ]
        indicator_id = f"fiscal.state_budgets.{metric_id}"
        artifacts.append(
            (
                indicator_id,
                make_series(
                    indicator_id=indicator_id,
                    title=f"{label}, all states and UTs",
                    source_id="rbi-state-finances",
                    source_indicator_id=f"{metric_id}, actual, All States/UT",
                    source_url=STATE_FINANCES_WORKBOOK_URL,
                    unit="%",
                    observations=observations,
                    metadata={
                        **common_meta,
                        "transform": "Calculated from published Account values. Date is the fiscal year ending year.",
                    },
                ),
            )
        )

    def selected_actual_by_year(metric_id: str) -> dict[int, dict]:
        return {
            int(row["fiscalYearEnd"]): row
            for row in selected_rows
            if row["state"] == "All States/UT"
            and row["metricId"] == metric_id
            and row.get("account") is not None
        }

    revenue_exp_by_year = selected_actual_by_year("total_expenditure")
    for metric_id, label in {
        "developmental_expenditure": "Developmental revenue expenditure",
        "non_developmental_expenditure": "Non-developmental revenue expenditure",
        "grants_in_aid_contributions": "Grants-in-aid and contributions",
    }.items():
        rows = selected_actual_by_year(metric_id)
        observations = []
        for year in sorted(set(rows) & set(revenue_exp_by_year)):
            numerator = rows[year].get("account")
            denominator = revenue_exp_by_year[year].get("account")
            if denominator:
                observations.append({"date": str(year), "value": round_value((numerator / denominator) * 100, 2)})
        indicator_id = f"fiscal.state_budgets.{metric_id}_revenue_expenditure_share"
        artifacts.append(
            (
                indicator_id,
                make_series(
                    indicator_id=indicator_id,
                    title=f"{label} as share of revenue expenditure",
                    source_id="rbi-state-finances",
                    source_indicator_id=f"{metric_id} Account divided by total_expenditure Account, All States/UT",
                    source_url=STATE_FINANCES_WORKBOOK_URL,
                    unit="% of revenue expenditure",
                    observations=observations,
                    metadata={
                        **common_meta,
                        "transform": "Selected revenue-expenditure component divided by total revenue expenditure for All States/UT Account values.",
                        "caveats": [
                            *common_meta["caveats"],
                            "Revenue expenditure is grouped here as developmental, non-developmental, and grants-in-aid/contributions. These are accounting categories, not direct measures of service quality.",
                        ],
                    },
                ),
            )
        )

    budget_metric_labels = {
        "total_revenue_actual_to_budget": "Revenue actual as share of Budget Estimate",
        "total_expenditure_actual_to_budget": "Revenue expenditure actual as share of Budget Estimate",
        "capital_outlay_actual_to_budget": "Capital outlay actual as share of Budget Estimate",
        "interest_payments_actual_to_budget": "Interest payments actual as share of Budget Estimate",
        "pensions_actual_to_budget": "Pensions actual as share of Budget Estimate",
        "grants_from_centre_actual_to_budget": "Grants from Centre actual as share of Budget Estimate",
    }
    for metric_id, label in budget_metric_labels.items():
        rows = [
            row
            for row in fiscal_rows
            if row["state"] == "All States/UT"
            and row["metricId"] == metric_id
            and row["estimateType"] == "actual_as_percent_of_budget"
            and row.get("value") is not None
            and int(row["fiscalYearStart"]) >= 2014
        ]
        observations = [
            {"date": fiscal_label(row), "value": round_value(row["value"], 2)}
            for row in sorted(rows, key=lambda item: item["fiscalYearEnd"])
        ]
        indicator_id = f"fiscal.state_budgets.budget_realisation.{metric_id}"
        artifacts.append(
            (
                indicator_id,
                make_series(
                    indicator_id=indicator_id,
                    title=label,
                    source_id="rbi-state-finances",
                    source_indicator_id=f"{metric_id}, All States/UT",
                    source_url=STATE_FINANCES_WORKBOOK_URL,
                    unit="% of Budget Estimate",
                    observations=observations,
                    metadata={
                        **common_meta,
                        "transform": "Account divided by Budget Estimate for the same fiscal year. Values begin in 2014-15 for the article window.",
                    },
                ),
            )
        )

    def selected_budget_realisation_series(indicator_suffix: str, title: str, metric_ids: list[str]) -> None:
        rows_by_year: dict[int, list[dict]] = {}
        for row in selected_rows:
            if (
                row["state"] == "All States/UT"
                and row["metricId"] in metric_ids
                and row.get("account") is not None
                and row.get("budget") is not None
                and int(row["fiscalYearStart"]) >= 2014
            ):
                rows_by_year.setdefault(int(row["fiscalYearEnd"]), []).append(row)
        observations = []
        for year in sorted(rows_by_year):
            rows = rows_by_year[year]
            if {row["metricId"] for row in rows} != set(metric_ids):
                continue
            account = sum(float(row["account"]) for row in rows)
            budget = sum(float(row["budget"]) for row in rows)
            if budget:
                observations.append({"date": str(year), "value": round_value((account / budget) * 100, 2)})
        indicator_id = f"fiscal.state_budgets.budget_realisation.{indicator_suffix}"
        artifacts.append(
            (
                indicator_id,
                make_series(
                    indicator_id=indicator_id,
                    title=title,
                    source_id="rbi-state-finances",
                    source_indicator_id=f"{'+'.join(metric_ids)} Account divided by Budget Estimate, All States/UT",
                    source_url=STATE_FINANCES_WORKBOOK_URL,
                    unit="% of Budget Estimate",
                    observations=observations,
                    metadata={
                        **common_meta,
                        "transform": "Account divided by Budget Estimate for the same fiscal year. Values begin in 2014-15 for the article window.",
                    },
                ),
            )
        )

    selected_budget_realisation_series(
        "education_actual_to_budget",
        "Education actual as share of Budget Estimate",
        ["education"],
    )
    selected_budget_realisation_series(
        "health_family_welfare_actual_to_budget",
        "Health and family welfare actual as share of Budget Estimate",
        ["medical_public_health", "family_welfare"],
    )

    capital_outlay_components = [
        ("Roads and bridges", "capital_outlay_roads_bridges"),
        ("Irrigation and flood control", "capital_outlay_irrigation_flood"),
        ("Water and sanitation", "capital_outlay_water_sanitation"),
        ("Rural development", "capital_outlay_rural_development"),
        ("Energy", "capital_outlay_energy"),
        ("Education", "capital_outlay_education"),
        ("Medical and public health", "capital_outlay_medical_public_health"),
    ]
    latest_capital_rows = selected_actual_by_year("capital_outlay")
    latest_capital_total = latest_capital_rows.get(2024, {}).get("account")
    capital_component_rows = []
    selected_component_total = 0.0
    if latest_capital_total:
        for label, metric_id in capital_outlay_components:
            rows = selected_actual_by_year(metric_id)
            value = rows.get(2024, {}).get("account")
            if value is None:
                continue
            selected_component_total += float(value)
            capital_component_rows.append(
                {
                    "label": label,
                    "value": round_value((float(value) / latest_capital_total) * 100, 1),
                    "valueRupeesCrore": round_value(value, 2),
                    "fiscalYear": "2023-24",
                }
            )
        residual = latest_capital_total - selected_component_total
        if residual > 0:
            capital_component_rows.append(
                {
                    "label": "Other capital outlay",
                    "value": round_value((residual / latest_capital_total) * 100, 1),
                    "valueRupeesCrore": round_value(residual, 2),
                    "fiscalYear": "2023-24",
                }
            )
    artifacts.append(
        (
            "fiscal.state_budgets.capital_outlay_composition_2024",
            make_table(
                indicator_id="fiscal.state_budgets.capital_outlay_composition_2024",
                title="What capital outlay is spent on",
                source_id="rbi-state-finances",
                source_indicator_id="selected capital outlay components as share of total capital outlay, 2023-24 Account",
                source_url=STATE_FINANCES_WORKBOOK_URL,
                unit="% of capital outlay",
                rows=capital_component_rows,
                metadata={
                    **common_meta,
                    "method": "Selected non-overlapping Appendix-4 capital outlay component Account values divided by total capital outlay for All States/UT in 2023-24. Other capital outlay is the residual.",
                    "caveats": [
                        *common_meta["caveats"],
                        "Capital outlay is an accounting flow. It is not a measure of completed infrastructure, asset quality, or project timeliness.",
                        "The named components are selected for readability; Other capital outlay groups the remaining Appendix-4 capital heads.",
                    ],
                },
            ),
        )
    )

    def latest_state_metric(metric_id: str, rows: list[dict]) -> list[dict]:
        return [
            row
            for row in rows
            if row.get("metricId") == metric_id
            and row.get("fiscalYear") == "2023-2024"
            and row.get("estimateType") in {None, "actual"}
            and row.get("state") != "All States/UT"
            and row.get("value") is not None
        ]

    def ranking_rows(metric_id: str, source_rows: list[dict], *, mode: str = "highest", count: int = 12) -> list[dict]:
        rows = latest_state_metric(metric_id, source_rows)
        reverse = mode == "highest"
        picked = sorted(rows, key=lambda row: row["value"], reverse=reverse)[:count]
        return [
            {
                "label": row["state"],
                "value": round_value(row["value"], 1 if row.get("unit") == "percent" else 0),
                "stateCode": row.get("stateCode"),
                "fiscalYear": fiscal_year_text(row),
            }
            for row in picked
        ]

    def extremes_rows(metric_id: str, source_rows: list[dict], *, count: int = 8, digits: int = 1) -> list[dict]:
        rows = latest_state_metric(metric_id, source_rows)
        low = sorted(rows, key=lambda row: row["value"])[:count]
        high = sorted(rows, key=lambda row: row["value"], reverse=True)[:count]
        out = []
        for row in low:
            out.append(
                {
                    "label": row["state"],
                    "value": round_value(row["value"], digits),
                    "group": "Lowest",
                    "stateCode": row.get("stateCode"),
                    "fiscalYear": fiscal_year_text(row),
                }
            )
        for row in high:
            out.append(
                {
                    "label": row["state"],
                    "value": round_value(row["value"], digits),
                    "group": "Highest",
                    "stateCode": row.get("stateCode"),
                    "fiscalYear": fiscal_year_text(row),
                }
            )
        return out

    state_tables = [
        (
            "fiscal.state_budgets.state.central_transfer_share_2024",
            "States most dependent on central transfers",
            "central_transfer_share",
            fiscal_rows,
            "RBI State Finances · central tax share plus grants as share of total revenue · 2023-24 Account",
            "%",
            ranking_rows("central_transfer_share", fiscal_rows, mode="highest", count=12),
            STATE_FINANCES_WORKBOOK_URL,
            common_meta,
        ),
        (
            "fiscal.state_budgets.state.interest_pensions_revenue_share_2024",
            "Where interest and pensions take the most revenue",
            "interest_pensions_revenue_share",
            fiscal_rows,
            "RBI State Finances · interest payments plus pensions as share of total revenue · 2023-24 Account",
            "%",
            ranking_rows("interest_pensions_revenue_share", fiscal_rows, mode="highest", count=12),
            STATE_FINANCES_WORKBOOK_URL,
            common_meta,
        ),
        (
            "fiscal.state_budgets.state.capital_outlay_aggregate_share_2024",
            "Capital outlay as a share of direct state spending",
            "capital_outlay_aggregate_spending_share",
            fiscal_rows,
            "RBI State Finances · capital outlay divided by revenue expenditure plus capital outlay · 2023-24 Account",
            "%",
            extremes_rows("capital_outlay_aggregate_spending_share", fiscal_rows, count=8, digits=1),
            STATE_FINANCES_WORKBOOK_URL,
            common_meta,
        ),
        (
            "fiscal.state_budgets.state.revenue_expenditure_per_person_2024",
            "Revenue expenditure per resident",
            "revenue_expenditure_per_person",
            denom_rows,
            "RBI State Finances with RBI Handbook denominators · revenue expenditure per derived resident · 2023-24 Account",
            "Rs per person",
            extremes_rows("revenue_expenditure_per_person", denom_rows, count=8, digits=0),
            HANDBOOK_URL,
            {
                **common_meta,
                "secondarySourceUrl": STATE_FINANCES_WORKBOOK_URL,
                "handbookUrl": HANDBOOK_URL,
                "method": "State Finances rupee values divided by population derived from RBI Handbook NSDP and per-capita NSDP.",
                "caveats": [
                    "Population is derived from RBI Handbook current-price NSDP divided by per-capita NSDP, not from a fresh Census.",
                    "All States/UT aggregate is excluded from denominator charts because Handbook and State Finances UT coverage do not match exactly.",
                    "Small hill and northeastern states can rank high per resident because fixed administrative costs and grants are spread across fewer people.",
                ],
            },
        ),
        (
            "fiscal.state_budgets.state.education_per_person_2024",
            "Education expenditure per resident",
            "education_per_person",
            denom_rows,
            "RBI State Finances with RBI Handbook denominators · education revenue expenditure per derived resident · 2023-24 Account",
            "Rs per person",
            extremes_rows("education_per_person", denom_rows, count=8, digits=0),
            HANDBOOK_URL,
            {
                **common_meta,
                "secondarySourceUrl": STATE_FINANCES_WORKBOOK_URL,
                "handbookUrl": HANDBOOK_URL,
                "method": "Education revenue expenditure divided by population derived from RBI Handbook NSDP and per-capita NSDP.",
                "caveats": [
                    "This is budgeted state revenue expenditure, not total education spending or learning quality.",
                    "Population is derived from RBI Handbook current-price NSDP divided by per-capita NSDP, not from a fresh Census.",
                    "A better child-level comparison would divide by school-age population, which is not used in this artifact.",
                ],
            },
        ),
        (
            "fiscal.state_budgets.state.health_per_person_2024",
            "Health and family welfare expenditure per resident",
            "health_family_welfare_per_person",
            denom_rows,
            "RBI State Finances with RBI Handbook denominators · medical, public health and family welfare per derived resident · 2023-24 Account",
            "Rs per person",
            extremes_rows("health_family_welfare_per_person", denom_rows, count=8, digits=0),
            HANDBOOK_URL,
            {
                **common_meta,
                "secondarySourceUrl": STATE_FINANCES_WORKBOOK_URL,
                "handbookUrl": HANDBOOK_URL,
                "method": "Medical and public health plus family welfare revenue expenditure divided by population derived from RBI Handbook NSDP and per-capita NSDP.",
                "caveats": [
                    "This is budgeted state revenue expenditure, not total health spending. Private and out-of-pocket spending are outside the chart.",
                    "Population is derived from RBI Handbook current-price NSDP divided by per-capita NSDP, not from a fresh Census.",
                ],
            },
        ),
        (
            "fiscal.state_budgets.state.revenue_expenditure_gsdp_2024",
            "Revenue expenditure against state economy",
            "revenue_expenditure_gsdp",
            denom_rows,
            "RBI State Finances with RBI Handbook denominators · revenue expenditure as share of current-price GSDP · 2023-24 Account",
            "% of GSDP",
            extremes_rows("revenue_expenditure_gsdp", denom_rows, count=8, digits=1),
            HANDBOOK_URL,
            {
                **common_meta,
                "secondarySourceUrl": STATE_FINANCES_WORKBOOK_URL,
                "handbookUrl": HANDBOOK_URL,
                "method": "State Finances revenue expenditure divided by RBI Handbook current-price GSDP.",
                "caveats": [
                    "Per-GSDP state comparisons start in 2011-12 in the denominator artifact.",
                    "A high ratio can mean a small economy and large transfers, not necessarily richer services.",
                ],
            },
        ),
        (
            "fiscal.state_budgets.state.revenue_balance_gsdp_2024",
            "Revenue balance against state economy",
            "revenue_balance_gsdp",
            denom_rows,
            "RBI State Finances with RBI Handbook denominators · revenue balance as share of current-price GSDP · 2023-24 Account",
            "% of GSDP",
            extremes_rows("revenue_balance_gsdp", denom_rows, count=8, digits=1),
            HANDBOOK_URL,
            {
                **common_meta,
                "secondarySourceUrl": STATE_FINANCES_WORKBOOK_URL,
                "handbookUrl": HANDBOOK_URL,
                "method": "State Finances revenue balance divided by RBI Handbook current-price GSDP. Positive values are revenue surplus; negative values are revenue deficit.",
                "caveats": [
                    "Per-GSDP state comparisons start in 2011-12 in the denominator artifact.",
                    "Revenue balance does not include capital account flows, borrowings, or asset sales.",
                ],
            },
        ),
        (
            "fiscal.state_budgets.state.capital_outlay_gsdp_2024",
            "Capital outlay against state economy",
            "capital_outlay_gsdp",
            denom_rows,
            "RBI State Finances with RBI Handbook denominators · capital outlay as share of current-price GSDP · 2023-24 Account",
            "% of GSDP",
            extremes_rows("capital_outlay_gsdp", denom_rows, count=8, digits=1),
            HANDBOOK_URL,
            {
                **common_meta,
                "secondarySourceUrl": STATE_FINANCES_WORKBOOK_URL,
                "handbookUrl": HANDBOOK_URL,
                "method": "State Finances capital outlay divided by RBI Handbook current-price GSDP.",
                "caveats": [
                    "Per-GSDP state comparisons start in 2011-12 in the denominator artifact.",
                    "Capital outlay is not the same as completed infrastructure or asset quality.",
                ],
            },
        ),
    ]

    for indicator_id, title, source_indicator_id, _source_rows, subtitle, unit, rows, source_url, metadata in state_tables:
        artifacts.append(
            (
                indicator_id,
                make_table(
                    indicator_id=indicator_id,
                    title=title,
                    source_id="rbi-state-finances+rbi-handbook-states" if source_url == HANDBOOK_URL else "rbi-state-finances",
                    source_indicator_id=subtitle,
                    source_url=source_url,
                    unit=unit,
                    geography={"type": "state-set", "id": "IN-STATES", "name": "Indian states and UTs with legislatures"},
                    rows=rows,
                    metadata={
                        **metadata,
                        "sourceMetricId": source_indicator_id,
                        "latestActualFiscalYear": "2023-24",
                    },
                ),
            )
        )

    fiscal_latest = {
        (row["state"], row["metricId"]): row
        for row in fiscal_rows
        if row.get("fiscalYear") == "2023-2024"
        and row.get("estimateType") == "actual"
        and row.get("state") != "All States/UT"
        and row.get("value") is not None
    }
    highlights = {"Punjab", "Kerala", "Himachal Pradesh", "Bihar", "Uttar Pradesh", "Arunachal Pradesh", "Gujarat", "Odisha"}
    scatter_rows = []
    states = sorted({state for state, metric in fiscal_latest if metric == "interest_pensions_revenue_share"})
    for state in states:
        x_row = fiscal_latest.get((state, "interest_pensions_revenue_share"))
        y_row = fiscal_latest.get((state, "capital_outlay_aggregate_spending_share"))
        if not x_row or not y_row:
            continue
        scatter_rows.append(
            {
                "label": state,
                "x": round_value(x_row["value"], 1),
                "y": round_value(y_row["value"], 1),
                "highlight": state in highlights,
                "stateCode": x_row.get("stateCode"),
            }
        )
    artifacts.append(
        (
            "fiscal.state_budgets.state.fiscal_room_scatter_2024",
            make_table(
                indicator_id="fiscal.state_budgets.state.fiscal_room_scatter_2024",
                title="Locked-in bills versus capital outlay",
                source_id="rbi-state-finances",
                source_indicator_id="interest plus pensions vs capital outlay share, 2023-24 Account",
                source_url=STATE_FINANCES_WORKBOOK_URL,
                unit="%",
                geography={"type": "state-set", "id": "IN-STATES", "name": "Indian states and UTs with legislatures"},
                rows=scatter_rows,
                metadata={
                    **common_meta,
                    "xLabel": "Interest + pensions as % of revenue",
                    "yLabel": "Capital outlay as % of revenue expenditure + capital outlay",
                    "method": "Each point is one state or UT with legislature in 2023-24 Account. X is interest plus pensions divided by total revenue. Y is capital outlay divided by revenue expenditure plus capital outlay.",
                },
            ),
        )
    )

    tax_component_labels = {
        "sgst_own_tax_share": "SGST",
        "sales_tax_own_tax_share": "Sales tax/VAT",
        "state_excise_own_tax_share": "State excise",
        "stamps_registration_own_tax_share": "Stamps and registration",
    }
    tax_rows = []
    for row in fiscal_rows:
        if (
            row.get("state") == "All States/UT"
            and row.get("estimateType") == "actual"
            and row.get("metricId") in tax_component_labels
            and row.get("fiscalYear") in {"2016-2017", "2017-2018", "2023-2024"}
            and row.get("value") is not None
        ):
            tax_rows.append(
                {
                    "label": tax_component_labels[row["metricId"]],
                    "value": round_value(row["value"], 1),
                    "group": fiscal_year_text(row),
                    "metricId": row["metricId"],
                }
            )
    tax_rows.sort(key=lambda item: (item["group"], ["SGST", "Sales tax/VAT", "State excise", "Stamps and registration"].index(item["label"])))
    artifacts.append(
        (
            "fiscal.state_budgets.tax_basket_2017_2018_2024",
            make_table(
                indicator_id="fiscal.state_budgets.tax_basket_2017_2018_2024",
                title="GST rewired the states' own-tax basket",
                source_id="rbi-state-finances",
                source_indicator_id="selected own-tax components as share of own tax revenue",
                source_url=STATE_FINANCES_WORKBOOK_URL,
                unit="% of own tax revenue",
                rows=tax_rows,
                metadata={
                    **common_meta,
                    "method": "Each component is divided by own tax revenue for All States/UT Account values. 2016-17 is pre-SGST, 2017-18 is the first GST year, and 2023-24 is the latest actual.",
                },
            ),
        )
    )

    manifest_entries = []
    for name, artifact in artifacts:
        path = SERIES_DIR / f"rbi-state-finances.chart.{source_slug(name)}.json"
        write_json(path, artifact)
        manifest_entries.append(
            {
                "indicatorId": artifact["indicatorId"],
                "sourceId": artifact["sourceId"],
                "sourceIndicatorId": artifact["sourceIndicatorId"],
                "sourceUrl": artifact.get("sourceUrl"),
                "artifactPath": str(path.relative_to(ROOT)),
                "title": artifact["title"],
                "unit": artifact["unit"],
            }
        )

    upsert_manifest(manifest_entries)
    print(f"Wrote {len(artifacts)} chart artifacts")
    for _, artifact in artifacts:
        print(f"- {artifact['indicatorId']}")


if __name__ == "__main__":
    main()
