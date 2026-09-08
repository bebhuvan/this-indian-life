#!/usr/bin/env python3
"""
Prepare RBI State Finances 2025-26 e-STATES workbook for the state fiscal-room story.

The source workbook is the RBI "State Finances: A Study of Budgets of 2025-26"
e-STATES appendix workbook. It contains revenue receipts, revenue expenditure,
capital receipts, and capital disbursements from 1990-91 through 2025-26 BE.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd


SOURCE_PAGE_URL = "https://www.rbi.org.in/scripts/AnnualPublications.aspx?head=State+Finances+%3A+A+Study+of+Budgets"
SOURCE_WORKBOOK_URL = "https://rbidocs.rbi.org.in/rdocs/Publications/DOCs/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A.XLSX"
SOURCE_MAIN_PDF_URL = "https://rbidocs.rbi.org.in/rdocs/Publications/PDFs/0SF23012026877D47254C4F4B0793B2C38F05FB7EC5.PDF"
SOURCE_METHODOLOGY_PDF_URL = "https://rbidocs.rbi.org.in/rdocs/Publications/PDFs/06EXPLANATORY24012608539CE016444F378E0A5AAB69B04CB8.PDF"
SOURCE_NOTES_PDF_URL = "https://rbidocs.rbi.org.in/rdocs/Publications/PDFs/NOTES230120261772EAC66AA94026B3E4C074E6188FE9.PDF"

DEFAULT_WORKBOOK = Path("/home/bhuvanesh.r/Downloads/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A (1).XLSX")
SNAPSHOT_DIR = Path("data/snapshots/rbi-state-finances")
QUALITY_DIR = Path("data/quality")
SERIES_DIR = Path("data/series")
CATALOG_DIR = Path("data/catalog")

APPENDIX_LABELS = {
    "Appendix-1": "Revenue receipts",
    "Appendix-2": "Revenue expenditure",
    "Appendix-3": "Capital receipts",
    "Appendix-4": "Capital disbursements",
}

HEADS = {
    "total_revenue": {
        "appendix": "Appendix-1",
        "head": "Total: TOTAL REVENUE (I+II)",
        "label": "Total revenue",
        "unit": "rupees crore",
    },
    "tax_revenue": {
        "appendix": "Appendix-1",
        "head": "I: TAX REVENUE (A+B)",
        "label": "Tax revenue",
        "unit": "rupees crore",
    },
    "own_tax_revenue": {
        "appendix": "Appendix-1",
        "head": "I.A: State's Own Tax Revenue (1 to 3)",
        "label": "State own tax revenue",
        "unit": "rupees crore",
    },
    "share_in_central_taxes": {
        "appendix": "Appendix-1",
        "head": "I.B: Share in Central Taxes (i to ix)",
        "label": "Share in central taxes",
        "unit": "rupees crore",
    },
    "non_tax_revenue": {
        "appendix": "Appendix-1",
        "head": "II: NON-TAX REVENUE (C+D)",
        "label": "Non-tax revenue",
        "unit": "rupees crore",
    },
    "own_non_tax_revenue": {
        "appendix": "Appendix-1",
        "head": "II.C: State's Own Non-Tax Revenue (1 to 6)",
        "label": "State own non-tax revenue",
        "unit": "rupees crore",
    },
    "grants_from_centre": {
        "appendix": "Appendix-1",
        "head": "II.D: Grants from the Centre (1 to 7)",
        "label": "Grants from the Centre",
        "unit": "rupees crore",
    },
    "sgst": {
        "appendix": "Appendix-1",
        "head": "I.A.3.vii: State Goods and Services Tax",
        "label": "State GST",
        "unit": "rupees crore",
    },
    "sales_tax": {
        "appendix": "Appendix-1",
        "head": "I.A.3.i: Sales Tax (a to e)",
        "label": "Sales tax",
        "unit": "rupees crore",
    },
    "sales_tax_vat": {
        "appendix": "Appendix-1",
        "head": "I.A.3.i.b: State Sales Tax/VAT",
        "label": "State sales tax/VAT",
        "unit": "rupees crore",
    },
    "state_excise": {
        "appendix": "Appendix-1",
        "head": "I.A.3.ii: State Excise",
        "label": "State excise",
        "unit": "rupees crore",
    },
    "stamps_registration": {
        "appendix": "Appendix-1",
        "head": "I.A.2.ii: Stamps and Registration Fees",
        "label": "Stamps and registration fees",
        "unit": "rupees crore",
    },
    "taxes_on_vehicles": {
        "appendix": "Appendix-1",
        "head": "I.A.3.iii: Taxes on Vehicles",
        "label": "Taxes on vehicles",
        "unit": "rupees crore",
    },
    "total_expenditure": {
        "appendix": "Appendix-2",
        "head": "Total: TOTAL EXPENDITURE (I+II+III)",
        "label": "Total revenue expenditure",
        "unit": "rupees crore",
    },
    "developmental_expenditure": {
        "appendix": "Appendix-2",
        "head": "I: DEVELOPMENTAL EXPENDITURE (A + B)",
        "label": "Developmental revenue expenditure",
        "unit": "rupees crore",
    },
    "social_services": {
        "appendix": "Appendix-2",
        "head": "I.A: Social Services (1 to 12)",
        "label": "Social services revenue expenditure",
        "unit": "rupees crore",
    },
    "education": {
        "appendix": "Appendix-2",
        "head": "I.A.1: Education, Sports, Art and Culture",
        "label": "Education, sports, art and culture revenue expenditure",
        "unit": "rupees crore",
    },
    "medical_public_health": {
        "appendix": "Appendix-2",
        "head": "I.A.2: Medical and Public Health",
        "label": "Medical and public health revenue expenditure",
        "unit": "rupees crore",
    },
    "family_welfare": {
        "appendix": "Appendix-2",
        "head": "I.A.3: Family Welfare",
        "label": "Family welfare revenue expenditure",
        "unit": "rupees crore",
    },
    "economic_services": {
        "appendix": "Appendix-2",
        "head": "I.B: Economic Services (1 to 9)",
        "label": "Economic services revenue expenditure",
        "unit": "rupees crore",
    },
    "non_developmental_expenditure": {
        "appendix": "Appendix-2",
        "head": "II: NON-DEVELOPMENTAL EXPENDITURE (General Services) (A to F)",
        "label": "Non-developmental revenue expenditure",
        "unit": "rupees crore",
    },
    "interest_payments": {
        "appendix": "Appendix-2",
        "head": "II.C.2: Interest Payments (i to iv)",
        "label": "Interest payments",
        "unit": "rupees crore",
    },
    "pensions": {
        "appendix": "Appendix-2",
        "head": "II.E: Pensions",
        "label": "Pensions",
        "unit": "rupees crore",
    },
    "police": {
        "appendix": "Appendix-2",
        "head": "II.D.iii: Police",
        "label": "Police revenue expenditure",
        "unit": "rupees crore",
    },
    "grants_in_aid_contributions": {
        "appendix": "Appendix-2",
        "head": "III: Grants-in-Aid and Contributions",
        "label": "Grants-in-aid and contributions revenue expenditure",
        "unit": "rupees crore",
    },
    "capital_outlay": {
        "appendix": "Appendix-4",
        "head": "I: Total Capital Outlay (1 + 2)",
        "label": "Capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_development": {
        "appendix": "Appendix-4",
        "head": "I.1: Development (a + b)",
        "label": "Development capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_social_services": {
        "appendix": "Appendix-4",
        "head": "I.1.a: Social Services (1 to 9)",
        "label": "Social services capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_economic_services": {
        "appendix": "Appendix-4",
        "head": "I.1.b: Economic Services (1 to 10)",
        "label": "Economic services capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_education": {
        "appendix": "Appendix-4",
        "head": "I.1.a.1: Education, Sports, Art and Culture",
        "label": "Education capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_medical_public_health": {
        "appendix": "Appendix-4",
        "head": "I.1.a.2: Medical and Public Health",
        "label": "Medical and public health capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_water_sanitation": {
        "appendix": "Appendix-4",
        "head": "I.1.a.4: Water Supply and Sanitation",
        "label": "Water supply and sanitation capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_roads_bridges": {
        "appendix": "Appendix-4",
        "head": "I.1.b.7.i: Roads and Bridges",
        "label": "Roads and bridges capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_irrigation_flood": {
        "appendix": "Appendix-4",
        "head": "I.1.b.4: Irrigation and Flood Control",
        "label": "Irrigation and flood control capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_energy": {
        "appendix": "Appendix-4",
        "head": "I.1.b.5: Energy",
        "label": "Energy capital outlay",
        "unit": "rupees crore",
    },
    "capital_outlay_rural_development": {
        "appendix": "Appendix-4",
        "head": "I.1.b.2: Rural Development",
        "label": "Rural development capital outlay",
        "unit": "rupees crore",
    },
    "revenue_balance": {
        "appendix": "Appendix-4",
        "head": "A: Surplus (+)/Deficit (-) on Revenue Account",
        "label": "Revenue account surplus/deficit",
        "unit": "rupees crore",
    },
    "capital_balance": {
        "appendix": "Appendix-4",
        "head": "B: Surplus (+)/Deficit(-) on Capital Account",
        "label": "Capital account surplus/deficit",
        "unit": "rupees crore",
    },
    "overall_balance": {
        "appendix": "Appendix-4",
        "head": "C: Overall Surplus (+)/Deficit (-) (A+B)",
        "label": "Overall surplus/deficit",
        "unit": "rupees crore",
    },
}

STRUCTURAL_ZERO_START_YEAR = {
    "Chhattisgarh": 2000,
    "Jharkhand": 2001,
    "Telangana": 2014,
    "Uttarakhand": 2000,
}

STATE_CODES = {
    "All States/UT": "ALL",
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Bihar": "BR",
    "Chhattisgarh": "CG",
    "Goa": "GA",
    "Gujarat": "GJ",
    "Haryana": "HR",
    "Himachal Pradesh": "HP",
    "Jammu and Kashmir": "JK",
    "Jharkhand": "JH",
    "Karnataka": "KA",
    "Kerala": "KL",
    "Madhya Pradesh": "MP",
    "Maharashtra": "MH",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "NCT Delhi": "DL",
    "Nagaland": "NL",
    "Odisha": "OD",
    "Puducherry": "PY",
    "Punjab": "PB",
    "Rajasthan": "RJ",
    "Sikkim": "SK",
    "Tamil Nadu": "TN",
    "Telangana": "TS",
    "Tripura": "TR",
    "Uttar Pradesh": "UP",
    "Uttarakhand": "UK",
    "West Bengal": "WB",
}


def clean_number(value: Any) -> float | None:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    value = float(value)
    if not math.isfinite(value):
        return None
    return value


def fiscal_year_start(value: str) -> int:
    return int(str(value).split("-")[0])


def fiscal_year_end(value: str) -> int:
    return int(str(value).split("-")[1])


def json_ready(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): json_ready(v) for k, v in value.items()}
    if isinstance(value, list):
        return [json_ready(v) for v in value]
    if isinstance(value, tuple):
        return [json_ready(v) for v in value]
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if hasattr(value, "item"):
        return value.item()
    return value


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(json_ready(payload), indent=2, sort_keys=False) + "\n", encoding="utf-8")


def source_slug(value: str) -> str:
    return "".join(ch if ch.isalnum() or ch in "_.@-" else "_" for ch in value)


def artifact_base(
    *,
    indicator_id: str,
    title: str,
    source_indicator_id: str,
    unit: str,
    rows: list[dict[str, Any]],
    dimensions: list[str],
    fetched_at: str,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "rbi-state-finances",
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": SOURCE_WORKBOOK_URL,
        "unit": unit,
        "geography": {"type": "state", "id": "IN-STATES", "name": "Indian states and UTs with legislature"},
        "dimensions": dimensions,
        "fetchedAt": fetched_at,
        "rows": rows,
        "metadata": metadata,
    }


def write_artifact(name: str, artifact: dict[str, Any]) -> Path:
    SERIES_DIR.mkdir(parents=True, exist_ok=True)
    path = SERIES_DIR / f"{source_slug(name)}.json"
    write_json(path, artifact)
    return path


def read_workbook(path: Path) -> tuple[pd.DataFrame, list[str]]:
    data = pd.read_excel(path, sheet_name="Data", engine="openpyxl")
    notes = pd.read_excel(path, sheet_name="Note", engine="openpyxl", header=None)[0].dropna().astype(str).tolist()
    expected_columns = ["Appendix", "State/UT", "Budget Head", "Fiscal Year", "Account", "Revised", "Budget"]
    if list(data.columns) != expected_columns:
        raise ValueError(f"Unexpected workbook columns: {list(data.columns)}")
    if data.duplicated().any():
        raise ValueError("Workbook has exact duplicate rows")
    return data, notes


def snapshot_workbook(source_path: Path) -> tuple[Path, str]:
    body = source_path.read_bytes()
    digest = hashlib.sha256(body).hexdigest()
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = SNAPSHOT_DIR / f"state-finances-2025-26-estates.{digest[:12]}.xlsx"
    if not snapshot_path.exists():
        shutil.copyfile(source_path, snapshot_path)
    return snapshot_path, digest


def selected_rows(data: pd.DataFrame) -> pd.DataFrame:
    selected = []
    for metric_id, spec in HEADS.items():
        block = data[
            (data["Appendix"] == spec["appendix"])
            & (data["Budget Head"] == spec["head"])
        ].copy()
        if block.empty:
            raise ValueError(f"Missing head for {metric_id}: {spec['head']}")
        block["metric_id"] = metric_id
        block["metric_label"] = spec["label"]
        block["unit"] = spec["unit"]
        selected.append(block)
    out = pd.concat(selected, ignore_index=True)
    out["fiscal_year_start"] = out["Fiscal Year"].map(fiscal_year_start)
    out["fiscal_year_end"] = out["Fiscal Year"].map(fiscal_year_end)
    out["state_code"] = out["State/UT"].map(STATE_CODES)
    missing_codes = sorted(out.loc[out["state_code"].isna(), "State/UT"].unique())
    if missing_codes:
        raise ValueError(f"Missing state codes: {missing_codes}")
    out["is_all_states_aggregate"] = out["State/UT"] == "All States/UT"
    out["is_structural_zero"] = out.apply(
        lambda row: row["State/UT"] in STRUCTURAL_ZERO_START_YEAR
        and row["fiscal_year_start"] < STRUCTURAL_ZERO_START_YEAR[row["State/UT"]],
        axis=1,
    )
    return out


def row_for_selected(row: pd.Series) -> dict[str, Any]:
    return {
        "appendix": row["Appendix"],
        "appendixLabel": APPENDIX_LABELS[row["Appendix"]],
        "state": row["State/UT"],
        "stateCode": row["state_code"],
        "isAllStatesAggregate": bool(row["is_all_states_aggregate"]),
        "budgetHead": row["Budget Head"],
        "metricId": row["metric_id"],
        "metricLabel": row["metric_label"],
        "fiscalYear": row["Fiscal Year"],
        "fiscalYearStart": int(row["fiscal_year_start"]),
        "fiscalYearEnd": int(row["fiscal_year_end"]),
        "account": clean_number(row["Account"]),
        "revised": clean_number(row["Revised"]),
        "budget": clean_number(row["Budget"]),
        "unit": row["unit"],
        "isStructuralZero": bool(row["is_structural_zero"]),
    }


def value_map(selected: pd.DataFrame, value_column: str) -> dict[tuple[str, str, str], float | None]:
    mapping = {}
    for _, row in selected.iterrows():
        mapping[(row["State/UT"], row["Fiscal Year"], row["metric_id"])] = clean_number(row[value_column])
    return mapping


def safe_div(num: float | None, den: float | None) -> float | None:
    if num is None or den is None or den == 0:
        return None
    return num / den * 100


def safe_sum(*values: float | None) -> float | None:
    if any(value is None for value in values):
        return None
    return sum(value for value in values if value is not None)


def build_metric_rows(selected: pd.DataFrame) -> list[dict[str, Any]]:
    rows = []
    state_years = (
        selected[["State/UT", "state_code", "Fiscal Year", "fiscal_year_start", "fiscal_year_end", "is_all_states_aggregate"]]
        .drop_duplicates()
        .sort_values(["State/UT", "Fiscal Year"])
    )
    columns = [
        ("account", "Account", "actual"),
        ("revised", "Revised", "revised_estimate"),
        ("budget", "Budget", "budget_estimate"),
    ]

    for value_column, original_column, estimate_type in columns:
        values = value_map(selected, original_column)
        for _, state_year in state_years.iterrows():
            state = state_year["State/UT"]
            fiscal_year = state_year["Fiscal Year"]
            fy_start = int(state_year["fiscal_year_start"])
            base = {
                "state": state,
                "stateCode": state_year["state_code"],
                "isAllStatesAggregate": bool(state_year["is_all_states_aggregate"]),
                "fiscalYear": fiscal_year,
                "fiscalYearStart": fy_start,
                "fiscalYearEnd": int(state_year["fiscal_year_end"]),
                "estimateType": estimate_type,
                "unit": "percent",
                "isStructuralZero": state in STRUCTURAL_ZERO_START_YEAR and fy_start < STRUCTURAL_ZERO_START_YEAR[state],
            }

            def get(metric: str) -> float | None:
                return values.get((state, fiscal_year, metric))

            derived = {
                "own_revenue_share": safe_div(safe_sum(get("own_tax_revenue"), get("own_non_tax_revenue")), get("total_revenue")),
                "central_transfer_share": safe_div(safe_sum(get("share_in_central_taxes"), get("grants_from_centre")), get("total_revenue")),
                "interest_pensions_revenue_share": safe_div(safe_sum(get("interest_payments"), get("pensions")), get("total_revenue")),
                "capital_outlay_expenditure_share": safe_div(get("capital_outlay"), get("total_expenditure")),
                "capital_outlay_revenue_expenditure_share": safe_div(get("capital_outlay"), get("total_expenditure")),
                "capital_outlay_aggregate_spending_share": safe_div(
                    get("capital_outlay"),
                    safe_sum(get("total_expenditure"), get("capital_outlay")),
                ),
                "revenue_expenditure_aggregate_spending_share": safe_div(
                    get("total_expenditure"),
                    safe_sum(get("total_expenditure"), get("capital_outlay")),
                ),
                "education_expenditure_share": safe_div(get("education"), get("total_expenditure")),
                "health_family_welfare_expenditure_share": safe_div(
                    safe_sum(get("medical_public_health"), get("family_welfare")),
                    get("total_expenditure"),
                ),
                "revenue_balance_revenue_share": safe_div(get("revenue_balance"), get("total_revenue")),
                "sgst_own_tax_share": safe_div(get("sgst"), get("own_tax_revenue")),
                "sales_tax_own_tax_share": safe_div(get("sales_tax"), get("own_tax_revenue")),
                "stamps_registration_own_tax_share": safe_div(get("stamps_registration"), get("own_tax_revenue")),
                "state_excise_own_tax_share": safe_div(get("state_excise"), get("own_tax_revenue")),
            }
            for metric_id, value in derived.items():
                rows.append({**base, "metricId": metric_id, "value": value})

    actual = value_map(selected, "Account")
    budget = value_map(selected, "Budget")
    realization_metrics = {
        "total_revenue_actual_to_budget": "total_revenue",
        "total_expenditure_actual_to_budget": "total_expenditure",
        "capital_outlay_actual_to_budget": "capital_outlay",
        "interest_payments_actual_to_budget": "interest_payments",
        "pensions_actual_to_budget": "pensions",
        "grants_from_centre_actual_to_budget": "grants_from_centre",
    }
    for _, state_year in state_years.iterrows():
        state = state_year["State/UT"]
        fiscal_year = state_year["Fiscal Year"]
        fy_start = int(state_year["fiscal_year_start"])
        for metric_id, source_metric in realization_metrics.items():
            rows.append(
                {
                    "state": state,
                    "stateCode": state_year["state_code"],
                    "isAllStatesAggregate": bool(state_year["is_all_states_aggregate"]),
                    "fiscalYear": fiscal_year,
                    "fiscalYearStart": fy_start,
                    "fiscalYearEnd": int(state_year["fiscal_year_end"]),
                    "estimateType": "actual_as_percent_of_budget",
                    "metricId": metric_id,
                    "value": safe_div(actual.get((state, fiscal_year, source_metric)), budget.get((state, fiscal_year, source_metric))),
                    "unit": "percent",
                    "isStructuralZero": state in STRUCTURAL_ZERO_START_YEAR and fy_start < STRUCTURAL_ZERO_START_YEAR[state],
                }
            )
    return rows


def completeness(data: pd.DataFrame, selected: pd.DataFrame) -> dict[str, Any]:
    by_year = data.groupby("Fiscal Year")[["Account", "Revised", "Budget"]].count().reset_index()
    selected_by_metric = (
        selected.groupby("metric_id")[["Account", "Revised", "Budget"]]
        .count()
        .rename(columns={"Account": "accountNonNull", "Revised": "revisedNonNull", "Budget": "budgetNonNull"})
        .reset_index()
    )
    return {
        "sourceShape": {"rows": int(len(data)), "columns": int(len(data.columns))},
        "appendixRows": data["Appendix"].value_counts().sort_index().to_dict(),
        "states": sorted(data["State/UT"].unique().tolist()),
        "stateCount": int(data["State/UT"].nunique()),
        "budgetHeadCount": int(data["Budget Head"].nunique()),
        "fiscalYears": sorted(data["Fiscal Year"].unique().tolist()),
        "fiscalYearCount": int(data["Fiscal Year"].nunique()),
        "nonNullValueCountsByFiscalYear": by_year.to_dict(orient="records"),
        "selectedHeadCompleteness": selected_by_metric.to_dict(orient="records"),
    }


def reconcile(selected: pd.DataFrame) -> dict[str, Any]:
    rows = []
    checks = [
        ("revenue_total_equals_tax_plus_non_tax", "total_revenue", ["tax_revenue", "non_tax_revenue"], 0.1),
        ("tax_revenue_equals_own_plus_central", "tax_revenue", ["own_tax_revenue", "share_in_central_taxes"], 0.1),
        ("non_tax_revenue_equals_own_plus_grants", "non_tax_revenue", ["own_non_tax_revenue", "grants_from_centre"], 0.1),
        (
            "revenue_expenditure_total_equals_developmental_plus_nondevelopmental_plus_grants",
            "total_expenditure",
            ["developmental_expenditure", "non_developmental_expenditure", "grants_in_aid_contributions"],
            0.1,
        ),
        ("overall_balance_equals_revenue_plus_capital_balance", "overall_balance", ["revenue_balance", "capital_balance"], 0.1),
    ]
    for value_column in ["Account", "Revised", "Budget"]:
        pivot = selected.pivot_table(
            index=["State/UT", "Fiscal Year"],
            columns="metric_id",
            values=value_column,
            aggfunc="first",
        )
        for check_id, total_metric, component_metrics, tolerance in checks:
            max_abs = 0.0
            fail_count = 0
            checked = 0
            failure_examples = []
            for _, row in pivot.iterrows():
                total = clean_number(row.get(total_metric))
                comps = [clean_number(row.get(metric)) for metric in component_metrics]
                if total is None or any(value is None for value in comps):
                    continue
                checked += 1
                diff = abs(total - sum(comps))
                max_abs = max(max_abs, diff)
                if diff > tolerance:
                    fail_count += 1
                    if len(failure_examples) < 10:
                        failure_examples.append(
                            {
                                "state": row.name[0],
                                "fiscalYear": row.name[1],
                                "total": total,
                                "componentSum": sum(comps),
                                "difference": total - sum(comps),
                            }
                        )
            rows.append(
                {
                    "checkId": check_id,
                    "valueColumn": value_column,
                    "checked": checked,
                    "failCount": fail_count,
                    "maxAbsDifferenceRupeesCrore": max_abs,
                    "toleranceRupeesCrore": tolerance,
                    "failureExamples": failure_examples,
                }
            )

    aggregate_checks = []
    total_revenue = selected[selected["metric_id"] == "total_revenue"]
    for fiscal_year, block in total_revenue.groupby("Fiscal Year"):
        account = block[block["Account"].notna()]
        if account.empty:
            continue
        aggregate = account.loc[account["State/UT"] == "All States/UT", "Account"].sum()
        named_sum = account.loc[account["State/UT"] != "All States/UT", "Account"].sum()
        delhi_puducherry = account.loc[account["State/UT"].isin(["NCT Delhi", "Puducherry"]), "Account"].sum()
        aggregate_checks.append(
            {
                "fiscalYear": fiscal_year,
                "allStatesAggregate": aggregate,
                "sumNamedRows": named_sum,
                "sumNamedMinusAggregate": named_sum - aggregate,
                "nctDelhiPlusPuducherry": delhi_puducherry,
            }
        )

    return {
        "componentChecks": rows,
        "allStatesAggregateScopeChecks": aggregate_checks,
    }


def build_manifest(entries: list[dict[str, Any]]) -> None:
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    path = CATALOG_DIR / "rbi-state-finances-manifest.json"
    write_json(path, entries)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", type=Path, default=DEFAULT_WORKBOOK)
    args = parser.parse_args()

    if not args.workbook.exists():
        raise FileNotFoundError(args.workbook)

    fetched_at = datetime.now(timezone.utc).isoformat()
    snapshot_path, raw_hash = snapshot_workbook(args.workbook)
    data, notes = read_workbook(args.workbook)
    selected = selected_rows(data)
    selected_records = [row_for_selected(row) for _, row in selected.sort_values(["metric_id", "State/UT", "Fiscal Year"]).iterrows()]
    metric_records = build_metric_rows(selected)

    common_metadata = {
        "publication": "State Finances: A Study of Budgets of 2025-26",
        "publicationDate": "2026-01-23",
        "sourcePageUrl": SOURCE_PAGE_URL,
        "sourceWorkbookUrl": SOURCE_WORKBOOK_URL,
        "sourceMainPdfUrl": SOURCE_MAIN_PDF_URL,
        "sourceMethodologyPdfUrl": SOURCE_METHODOLOGY_PDF_URL,
        "sourceNotesPdfUrl": SOURCE_NOTES_PDF_URL,
        "rawSnapshot": str(snapshot_path),
        "rawSha256": raw_hash,
        "workbookNotes": notes,
        "unitInterpretation": "Rupees crore, as published by RBI. Percent metrics are computed from published rupee-crore values.",
        "estimateTypes": {
            "account": "Audited/actual account values where published.",
            "revised": "Revised estimates.",
            "budget": "Budget estimates.",
            "actual_as_percent_of_budget": "Account divided by budget estimate for the same fiscal year and head.",
        },
        "scopeCaveats": [
            "The All States/UT aggregate excludes UTs from 1990-91 to 2016-17, except that 2000-01 to 2004-05 also include NCT Delhi as noted by RBI. From 2017-18 onward, it pertains to all states and UTs.",
            "Chhattisgarh, Jharkhand, Uttarakhand and Telangana appear in the full grid before their formation, but pre-formation rows are structural zeros, not observed fiscal values.",
            "2024-25 values are revised estimates and 2025-26 values are budget estimates. Treat 2023-24 as the latest full account year in this workbook.",
            "Rupee values are nominal. For real growth, fiscal capacity, or cross-state comparison, join GSDP, population, or price-deflator data before making claims.",
            "Delhi and Puducherry are UTs with legislatures and have different expenditure responsibilities from full states. Rank them separately or caveat them in state comparisons.",
            "Karnataka's top-level revenue receipt components do not reconcile to total revenue for 2021-22 Account, 2022-23 Revised, and 2023-24 Budget in this workbook. The artifact preserves the published source values and reports the differences in the audit file.",
        ],
        "methodology": [
            "Selected RBI budget heads are mapped to stable metric IDs without altering the published rupee values.",
            "Fiscal years are preserved as source labels and also split into start/end years.",
            "Derived shares use same-year denominators from the same workbook. Own revenue share equals own tax revenue plus own non-tax revenue divided by total revenue.",
            "Central transfer share equals share in central taxes plus grants from the Centre divided by total revenue.",
            "Committed revenue share equals interest payments plus pensions divided by total revenue.",
            "Capital outlay revenue-expenditure share equals capital outlay divided by Appendix-2 revenue expenditure. This is useful for historical scale, but it is not a share of total government disbursement.",
            "Capital outlay aggregate-spending share equals capital outlay divided by revenue expenditure plus capital outlay. Use this when the prose says 'share of spending' or 'out of every rupee spent'.",
            "A GSDP-denominated version should be added before final publication.",
            "Budget credibility metrics compare Account with Budget for the same fiscal year and head. They are not forecast errors against the prior year's budget speech date.",
        ],
    }

    selected_artifact = artifact_base(
        indicator_id="fiscal.rbi_state_finances.selected_budget_heads",
        title="RBI State Finances selected budget heads",
        source_indicator_id="State Finances 2025-26 e-STATES selected heads",
        unit="rupees crore",
        rows=selected_records,
        dimensions=["state", "fiscalYear", "metricId"],
        fetched_at=fetched_at,
        metadata={**common_metadata, "selectedHeads": HEADS},
    )
    selected_path = write_artifact("rbi-state-finances.IN.selected_budget_heads", selected_artifact)

    metrics_artifact = artifact_base(
        indicator_id="fiscal.rbi_state_finances.fiscal_room_metrics",
        title="Derived fiscal-room metrics from RBI State Finances",
        source_indicator_id="State Finances 2025-26 e-STATES derived fiscal-room metrics",
        unit="percent",
        rows=metric_records,
        dimensions=["state", "fiscalYear", "estimateType", "metricId"],
        fetched_at=fetched_at,
        metadata=common_metadata,
    )
    metrics_path = write_artifact("rbi-state-finances.IN.fiscal_room_metrics", metrics_artifact)

    audit = {
        "source": common_metadata,
        "completeness": completeness(data, selected),
        "reconciliation": reconcile(selected),
        "outputs": {
            "selectedBudgetHeadsArtifact": str(selected_path),
            "fiscalRoomMetricsArtifact": str(metrics_path),
            "rawSnapshot": str(snapshot_path),
        },
    }
    QUALITY_DIR.mkdir(parents=True, exist_ok=True)
    audit_path = QUALITY_DIR / "rbi-state-finances-2025-26-audit.json"
    write_json(audit_path, audit)

    build_manifest(
        [
            {
                "status": "ready",
                "indicatorId": selected_artifact["indicatorId"],
                "artifact": str(selected_path),
                "snapshot": str(snapshot_path),
                "rawHash": raw_hash,
                "rows": len(selected_records),
                "fetchedAt": fetched_at,
                "sourceUrl": SOURCE_WORKBOOK_URL,
            },
            {
                "status": "ready",
                "indicatorId": metrics_artifact["indicatorId"],
                "artifact": str(metrics_path),
                "snapshot": str(snapshot_path),
                "rawHash": raw_hash,
                "rows": len(metric_records),
                "fetchedAt": fetched_at,
                "sourceUrl": SOURCE_WORKBOOK_URL,
            },
        ]
    )

    print(f"Snapshot: {snapshot_path}")
    print(f"Selected rows: {len(selected_records)} -> {selected_path}")
    print(f"Derived metric rows: {len(metric_records)} -> {metrics_path}")
    print(f"Audit: {audit_path}")


if __name__ == "__main__":
    main()
