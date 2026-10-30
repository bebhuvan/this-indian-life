#!/usr/bin/env python3
"""Build all series, tables, catalog manifest, and cell-level source audit for q.econ.lrs_controls."""

import csv
import gzip
import hashlib
import json
from pathlib import Path
import pandas as pd
from decimal import Decimal

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "data/raw/rbi-dbie-lrs-2026"
SERIES_DIR = ROOT / "data/series"
CATALOG_PATH = ROOT / "data/catalog/lrs-controls-manifest.json"
AUDIT_DIR = ROOT / "data/audits/lrs-controls"

FETCHED_AT = "2026-10-25T22:06:07.000Z"
RBI_LRS_URL = "https://data.rbi.org.in/DBIE/#/dbie/reports/External%20Sector/External%20Sector/Outward%20Remittances%20under%20the%20Liberalised%20Remittance%20Scheme%20for%20Resident%20Individuals"
RBI_BOP_URL = "https://data.rbi.org.in/DBIE/#/dbie/reports/External%20Sector/External%20Sector/India's%20Overall%20Balance%20of%20Payments"
RBI_FX_URL = "https://data.rbi.org.in/DBIE/#/dbie/reports/External%20Sector/External%20Sector/Foreign%20Exchange%20Reserves"


def stable_json(obj):
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def write_artifact(filename, payload, catalog_entries):
    SERIES_DIR.mkdir(parents=True, exist_ok=True)
    path = SERIES_DIR / filename
    text = stable_json(payload)
    path.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()
    records = len(payload.get("observations") or payload.get("rows") or payload.get("regions") or [])
    catalog_entries.append({
        "status": "ready",
        "indicatorId": payload["indicatorId"],
        "sourceIndicatorId": str(payload["sourceIndicatorId"]),
        "artifact": f"data/series/{filename}",
        "artifactType": payload["artifactType"],
        "records": records,
        "sha256": sha,
        "fetchedAt": FETCHED_AT,
    })
    return path


def make_series(indicator_id, title, unit, observations, source_indicator_id, source_url=RBI_LRS_URL, frequency="monthly", metadata=None):
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "rbi_dbie_lrs_2026",
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": frequency,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "metadata": metadata or {},
    }


def make_table(indicator_id, title, unit, rows, source_indicator_id, source_url=RBI_LRS_URL, dimensions=None, metadata=None):
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "rbi_dbie_lrs_2026",
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": dimensions or [],
        "fetchedAt": FETCHED_AT,
        "rows": rows,
        "metadata": metadata or {},
    }


def load_monthly_lrs():
    """Load verbatim SAP Webi Report 19 export (Apr 2008 - Aug 2026) using ACTUALS rows divided by 1e6 -> USD Million."""
    gz_path = RAW_DIR / "rbi_dbie_report_19_lrs_monthly_200804_202608.csv_gz"
    records = {}
    with gzip.open(gz_path, "rt", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter=";")
        for r in reader:
            if r["Unit Description"].strip() != "ACTUALS":
                continue
            dt_raw = r["Month (RBIB)"].strip()  # YYYY/MM/DD 00:00:00
            ym = dt_raw[:7].replace("/", "-")  # YYYY-MM
            order = int(r["Remittance Display Order"].strip())
            item = r["Item Desc"].strip()
            val_str = r["Amount (in USD Million)"].strip()
            val = float(val_str) / 1e6 if val_str else 0.0
            old = records.setdefault(ym, {}).get(order)
            if old is not None:
                assert old["value"] == val, f"Conflicting duplicate {ym}, order {order}"
            records[ym][order] = {"item": item, "value": val, "raw": val_str}
    return records


def load_annual_lrs():
    """Load verbatim SAP Webi Report 752 export (FY2008-09 - FY2024-25) using ACTUALS rows divided by 1e6 -> USD Million."""
    gz_path = RAW_DIR / "rbi_dbie_report_752_lrs_annual_200809_202425.csv_gz"
    records = {}
    with gzip.open(gz_path, "rt", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter=";")
        for r in reader:
            if r["Unit Description"].strip() != "ACTUALS":
                continue
            fy = r["Time Fis Year"].strip()  # e.g. 2024-25
            order = int(r["Remittance Display Order"].strip())
            val_str = r["Amount (in USD Million)"].strip()
            val = float(val_str) / 1e6 if val_str else 0.0
            records.setdefault(fy, {})[order] = val
    return records


def fy_for_ym(ym):
    y, m = int(ym[:4]), int(ym[5:7])
    if m >= 4:
        return f"{y}-{str(y + 1)[-2:]}"
    return f"{y - 1}-{str(y)[-2:]}"


def fy_end_year(fy):
    start_y = int(fy[:4])
    return str(start_y + 1)


def main():
    monthly = load_monthly_lrs()
    annual_752 = load_annual_lrs()
    cas_df = pd.read_csv(RAW_DIR / "rbi_dbie_cas_external_sector_202610.csv")

    all_months = sorted(monthly.keys())
    catalog_entries = []
    audit = {
        "story": "q.econ.lrs_controls",
        "rawManifest": "data/raw/rbi-dbie-lrs-2026/manifest.json",
        "monthRange": [all_months[0], all_months[-1]],
        "monthCount": len(all_months),
        "checks": {},
        "summaryStats": {},
    }

    # Order mapping in Report 19:
    # 1: 1 Outward Remittances under the LRS for Resident Individuals
    # 2: 1.1 Deposit
    # 3: 1.2 Purchase of immovable property
    # 4: 1.3 Investment in equity/debt
    # 5: 1.4 Gift
    # 6: 1.5 Donations
    # 7: 1.6 Travel
    # 8: 1.6.1 Business travel
    # 9: 1.6.2 Travel for pilgrimage
    # 10: 1.6.3 Travel for medical treatment
    # 11: 1.6.4 Travel for education
    # 12: 1.6.5 Other travel
    # 13: 1.7 Maintenance of close relatives
    # 14: 1.8 Medical Treatment
    # 15: 1.9 Studies Abroad
    # 16: 1.10 Others

    # --- CHART 1: Hero multiLine (Monthly Total LRS, Current-account Travel & Studies, Capital & Financial Assets) ---
    obs_total_m = []
    obs_travel_studies_m = []
    obs_capital_m = []
    obs_family_gifts_m = []

    for ym in all_months:
        m = monthly[ym]
        tot = round(m.get(1, {}).get("value", 0.0), 2)
        trav_stud = round(m.get(7, {}).get("value", 0.0) + m.get(15, {}).get("value", 0.0), 2)
        cap = round(m.get(2, {}).get("value", 0.0) + m.get(3, {}).get("value", 0.0) + m.get(4, {}).get("value", 0.0), 2)
        fam = round(m.get(5, {}).get("value", 0.0) + m.get(6, {}).get("value", 0.0) + m.get(13, {}).get("value", 0.0), 2)
        obs_total_m.append({"date": ym, "value": tot})
        obs_travel_studies_m.append({"date": ym, "value": trav_stud})
        obs_capital_m.append({"date": ym, "value": cap})
        if all(m.get(o, {}).get("raw", "") for o in [5, 6, 13]):
            obs_family_gifts_m.append({"date": ym, "value": fam})

    write_artifact(
        "lrs-controls.lrs26.monthly_total.IN.json",
        make_series("lrs26.monthly_total.IN", "Total monthly outward remittances under LRS", "USD million", obs_total_m, "RBI_DBIE_R19_1_TOTAL"),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.monthly_travel_studies.IN.json",
        make_series("lrs26.monthly_travel_studies.IN", "Monthly LRS outflows for travel and studies abroad (1.6 + 1.9)", "USD million", obs_travel_studies_m, "RBI_DBIE_R19_1.6_PLUS_1.9"),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.monthly_capital_triad.IN.json",
        make_series("lrs26.monthly_capital_triad.IN", "Monthly LRS outflows for deposits, property, and equity/debt (1.1 + 1.2 + 1.3)", "USD million", obs_capital_m, "RBI_DBIE_R19_1.1_TO_1.3"),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.monthly_family_gifts.IN.json",
        make_series("lrs26.monthly_family_gifts.IN", "Monthly LRS outflows for family maintenance, gifts, and donations (1.4 + 1.5 + 1.7)", "USD million", obs_family_gifts_m, "RBI_DBIE_R19_1.4_1.5_1.7"),
        catalog_entries,
    )

    # Compute annual sums from monthly data (FY2008-09 to FY2025-26 full 12-month years)
    fy_groups = {}
    for ym in all_months:
        fy = fy_for_ym(ym)
        fy_groups.setdefault(fy, []).append(ym)

    full_fys = [fy for fy, months in sorted(fy_groups.items()) if len(months) == 12]
    fy_totals = {}
    for fy in full_fys:
        fy_totals[fy] = {}
        for order in range(1, 17):
            fy_totals[fy][order] = round(sum(monthly[ym].get(order, {}).get("value", 0.0) for ym in fy_groups[fy]), 2)

    # Cross-check FY2024-25 against Report 752
    r752_fy25 = round(annual_752.get("2024-25", {}).get(1, 0.0), 2)
    audit["checks"]["fy25_monthly_vs_report752"] = {
        "monthlySumUSDm": fy_totals["2024-25"][1],
        "report752USDm": r752_fy25,
        "diffUSDm": round(fy_totals["2024-25"][1] - r752_fy25, 4),
    }

    # --- CHART 2: Macro Scale Check (tableBars: lrs26.external_sector_scale.IN) ---
    bop_fy26 = cas_df[(cas_df["dsd_code"] == "IND_OVR_BOP_A_RN") & (cas_df["unit_code"] == "USD") & (cas_df["observation_date"] == "2026-03-31")]
    bop_map = {r["series_label"]: float(r["value"]) / 1e9 for _, r in bop_fy26.iterrows()}

    fx_aug26 = cas_df[(cas_df["dsd_code"] == "FR_EXG_RESV_M_RN") & (cas_df["unit_code"] == "USD") & (cas_df["observation_date"] == "2026-08-31")]
    fx_reserves_aug26_b = float(fx_aug26[fx_aug26["series_label"] == "Foreign Exchange Reserves"]["value"].iloc[0]) / 1e9

    lrs_fy26_b = round(fy_totals["2025-26"][1] / 1000.0, 2)
    lrs_capital_fy26_b = round((fy_totals["2025-26"][2] + fy_totals["2025-26"][3] + fy_totals["2025-26"][4]) / 1000.0, 2)

    scale_rows = [
        {"label": "Foreign exchange reserves stockpile (Aug 2026)", "value": round(fx_reserves_aug26_b, 2), "category": "Reserve buffer"},
        {"label": "Software services net BoP surplus (FY26)", "value": round(bop_map["Software Services / Miscellaneous / Services / Invisibles / Net"], 2), "category": "Inflow / surplus"},
        {"label": "Total inward transfers, private and official (FY26)", "value": round(bop_map["Transfers / Invisibles / Current Account / Overall Balance / Credit"], 2), "category": "Inflow / surplus"},
        {"label": "Net transfers, private and official (FY26)", "value": round(bop_map["Transfers / Invisibles / Current Account / Overall Balance / Net"], 2), "category": "Inflow / surplus"},
        {"label": "Business services net BoP surplus (FY26)", "value": round(bop_map["Business Services / Miscellaneous / Services / Invisibles / Net"], 2), "category": "Inflow / surplus"},
        {"label": "Gross outward FDI debit (FY26)", "value": round(bop_map["Abroad / Foreign Direct Investment / Foreign Investment / Capital Account / Debit"], 2), "category": "Outflow"},
        {"label": "BoP gross travel debit, all channels (FY26)", "value": round(bop_map["Travel / Services / Invisibles / Current Account / Debit"], 2), "category": "Outflow"},
        {"label": "BoP gross travel credit, all visitors (FY26)", "value": round(bop_map["Travel / Services / Invisibles / Current Account / Credit"], 2), "category": "Inflow / surplus"},
        {"label": "Total resident LRS outflows, all purposes (FY26)", "value": lrs_fy26_b, "category": "LRS outflow"},
        {"label": "Current account deficit, net BoP (FY26)", "value": round(abs(bop_map["Current Account / Overall Balance / Net"]), 2), "category": "Macro deficit"},
        {"label": "Overall balance of payments deficit, net (FY26)", "value": round(abs(bop_map["Overall Balance / Net"]), 2), "category": "Macro deficit"},
        {"label": "LRS capital-account investments & deposits (FY26)", "value": lrs_capital_fy26_b, "category": "LRS outflow"},
    ]
    write_artifact(
        "lrs-controls.lrs26.external_sector_scale.IN.json",
        make_table(
            "lrs26.external_sector_scale.IN",
            "LRS outflows beside India's external sector inflows and reserve stockpile (USD billion)",
            "USD billion",
            scale_rows,
            "RBI_DBIE_BOP_FY26_AND_FX_AUG26",
            source_url=RBI_BOP_URL,
        ),
        catalog_entries,
    )

    # --- CHART 2b: CAD, Capital Account Collapse, Overall BoP Deficit & Travel Balance Flip (FY2009-FY2026, multiLine) ---
    bop_annual_usd = cas_df[(cas_df["dsd_code"] == "IND_OVR_BOP_A_RN") & (cas_df["unit_code"] == "USD") & (cas_df["frequency"] == "YEARLY")].copy()
    bop_annual_usd = bop_annual_usd[bop_annual_usd["period_label"] >= "2009"].sort_values("period_label")

    def extract_bop_series(sk):
        sub = bop_annual_usd[bop_annual_usd["series_key"] == sk].sort_values("period_label")
        return [{"date": str(r["period_label"]), "value": round(float(r["value"]) / 1e9, 2)} for _, r in sub.iterrows()]

    obs_bop_cad = extract_bop_series("io_bop_rn=CURR_ACC|tranc_typ_rn=TRANC_NET|unit_measure=USD")
    obs_bop_cap = extract_bop_series("io_bop_rn=CAP_ACC|tranc_typ_rn=TRANC_NET|unit_measure=USD")
    obs_bop_ovr = extract_bop_series("io_bop_rn=OVR_BAL|tranc_typ_rn=TRANC_NET|unit_measure=USD")
    obs_bop_trv = extract_bop_series("io_bop_rn=CURR_IS_TRV|tranc_typ_rn=TRANC_NET|unit_measure=USD")

    write_artifact(
        "lrs-controls.lrs26.bop_cad_net.IN.json",
        make_series(
            "lrs26.bop_cad_net.IN",
            "Current Account Balance, Net (FY2009-FY2026)",
            "USD billion",
            obs_bop_cad,
            "RBI_DBIE_BOP_CURR_ACC_NET",
            frequency="annual",
            source_url=RBI_BOP_URL,
        ),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.bop_cap_net.IN.json",
        make_series(
            "lrs26.bop_cap_net.IN",
            "Capital Account Balance, Net (FY2009-FY2026)",
            "USD billion",
            obs_bop_cap,
            "RBI_DBIE_BOP_CAP_ACC_NET",
            frequency="annual",
            source_url=RBI_BOP_URL,
        ),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.bop_overall_net.IN.json",
        make_series(
            "lrs26.bop_overall_net.IN",
            "Overall Balance of Payments, Net (FY2009-FY2026)",
            "USD billion",
            obs_bop_ovr,
            "RBI_DBIE_BOP_OVR_BAL_NET",
            frequency="annual",
            source_url=RBI_BOP_URL,
        ),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.bop_travel_net.IN.json",
        make_series(
            "lrs26.bop_travel_net.IN",
            "Travel Services Balance in Current Account, Net (FY2009-FY2026)",
            "USD billion",
            obs_bop_trv,
            "RBI_DBIE_BOP_TRAVEL_NET",
            frequency="annual",
            source_url=RBI_BOP_URL,
        ),
        catalog_entries,
    )

    # --- CHART 3: 6-Month Travel X-Ray (Mar-Aug 2026, stackedArea: lrs26.travel_subcategories_6m.IN) ---
    split_months = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]
    subcat_defs = [
        (12, "Other travel"),
        (11, "Travel for education"),
        (8, "Business travel"),
        (10, "Medical travel"),
        (9, "Travel for pilgrimage"),
    ]
    travel_6m_rows = []
    travel_6m_totals = {label: 0.0 for _, label in subcat_defs}
    for ym in split_months:
        for order, label in subcat_defs:
            v = round(monthly[ym].get(order, {}).get("value", 0.0), 2)
            travel_6m_totals[label] += monthly[ym].get(order, {}).get("value", 0.0)
            travel_6m_rows.append({
                "date": ym,
                "series": label,
                "value": v,
            })

    write_artifact(
        "lrs-controls.lrs26.travel_subcategories_6m.IN.json",
        make_table(
            "lrs26.travel_subcategories_6m.IN",
            "Monthly LRS travel outflows by RBI sub-category, March to August 2026 (USD million)",
            "USD million",
            [{"month": ym, **{key: round(monthly[ym][order]["value"], 2) for key, order in {"other":12,"education":11,"business":8,"medical":10,"pilgrimage":9}.items()}} for ym in split_months],
            "RBI_DBIE_R19_1.6.1_TO_1.6.5",
        ),
        catalog_entries,
    )

    # --- CHART 4: Overseas Education Reclassification (multiLine: Jan 2024 - Aug 2026) ---
    edu_months = [ym for ym in all_months if ym >= "2024-01"]
    obs_studies_19 = []
    obs_edu_travel_164 = []
    obs_edu_combined = []
    for ym in edu_months:
        s19 = round(monthly[ym].get(15, {}).get("value", 0.0), 2)
        t164 = round(monthly[ym].get(11, {}).get("value", 0.0), 2)
        obs_studies_19.append({"date": ym, "value": s19})
        if (11 in monthly[ym]):
            obs_edu_travel_164.append({"date": ym, "value": t164})
            obs_edu_combined.append({"date": ym, "value": round(monthly[ym][15]["value"] + monthly[ym][11]["value"], 2)})

    write_artifact(
        "lrs-controls.lrs26.studies_abroad_line19.IN.json",
        make_series("lrs26.studies_abroad_line19.IN", "Reported Studies Abroad line (1.9), Jan 2024 to Aug 2026", "USD million", obs_studies_19, "RBI_DBIE_R19_1.9"),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.travel_education_line164.IN.json",
        make_series("lrs26.travel_education_line164.IN", "Travel for education sub-category (1.6.4), Jan 2024 to Aug 2026", "USD million", obs_edu_travel_164, "RBI_DBIE_R19_1.6.4"),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.education_combined.IN.json",
        make_series("lrs26.education_combined.IN", "Combined overseas education remittances (1.9 Studies Abroad + 1.6.4 Education Travel)", "USD million", obs_edu_combined, "RBI_DBIE_R19_1.9_PLUS_1.6.4"),
        catalog_entries,
    )

    # --- CHART 5: Apr-Aug FY26 vs Apr-Aug FY27 5-month comparison (dumbbell: lrs26.fy27_5m_yoy_shift.IN) ---
    fy26_5m = ["2025-04", "2025-05", "2025-06", "2025-07", "2025-08"]
    fy27_5m = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]

    def sum_months(months, orders):
        return round(sum(monthly[ym].get(o, {}).get("value", 0.0) for ym in months for o in orders), 2)

    dumbbell_cats = [
        ("Equity & debt investment (1.3)", [4]),
        ("Maintenance of close relatives (1.7)", [13]),
        ("Studies abroad direct tuition (1.9)", [15]),
        ("Gifts & donations (1.4 + 1.5)", [5, 6]),
        ("Foreign bank deposits (1.1)", [2]),
        ("Immovable property abroad (1.2)", [3]),
        ("Others & medical (1.8 + 1.10)", [14, 16]),
    ]
    dumbbell_rows = []
    for label, orders in dumbbell_cats:
        v26 = sum_months(fy26_5m, orders)
        v27 = sum_months(fy27_5m, orders)
        pct = round((v27 - v26) / v26 * 100.0, 1) if v26 else 0.0
        dumbbell_rows.append({
            "purpose": label,
            "fy26_5m": v26,
            "fy27_5m": v27,
            "yoy_pct": pct,
        })

    write_artifact(
        "lrs-controls.lrs26.fy27_5m_yoy_shift.IN.json",
        make_table(
            "lrs26.fy27_5m_yoy_shift.IN",
            "First five months of the fiscal year (April-August): FY26 vs FY27 non-travel LRS outflows by purpose (USD million)",
            "USD million",
            dumbbell_rows,
            "RBI_DBIE_R19_APR_AUG_FY26_VS_FY27",
        ),
        catalog_entries,
    )

    # --- CHART 6: Capital-Account Triad Trajectory (FY2009 to FY2026, multiLine) ---
    obs_cap_eq = []
    obs_cap_dep = []
    obs_cap_prop = []
    for fy in full_fys:
        yr = fy_end_year(fy)
        obs_cap_eq.append({"date": yr, "value": fy_totals[fy][4]})
        obs_cap_dep.append({"date": yr, "value": fy_totals[fy][2]})
        obs_cap_prop.append({"date": yr, "value": fy_totals[fy][3]})

    write_artifact(
        "lrs-controls.lrs26.annual_equity_debt.IN.json",
        make_series("lrs26.annual_equity_debt.IN", "Annual LRS investment in foreign equity and debt (1.3)", "USD million", obs_cap_eq, "RBI_DBIE_R19_FY_1.3", frequency="annual"),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.annual_deposits.IN.json",
        make_series("lrs26.annual_deposits.IN", "Annual LRS remittances into foreign bank deposits (1.1)", "USD million", obs_cap_dep, "RBI_DBIE_R19_FY_1.1", frequency="annual"),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.annual_property.IN.json",
        make_series("lrs26.annual_property.IN", "Annual LRS remittances for purchase of immovable property (1.2)", "USD million", obs_cap_prop, "RBI_DBIE_R19_FY_1.2", frequency="annual"),
        catalog_entries,
    )

    # --- CHART 7: Monthly Seasonality & Policy Spike Fingerprint across Purpose Archetypes (multiLine across 12 calendar months, FY22-FY26 average vs FY24 TCS shock) ---
    # Let's build a clean table/series showing the average monthly seasonal profile by calendar month (Jan-Dec) or a groupedTable of peak months across purposes!
    # Wait: let's check what chart type shows the monthly seasonal fingerprint + TCS spikes best:
    # A groupedTable (`lrs26.tcs_regime_audit.IN`) for the 4 policy regimes, and for seasonality, a multiLine (`lrs26.fiscal_year_pacing.IN`) comparing cumulative or monthly pacing across FY23 (pre-20% TCS), FY24 (TCS twin spikes), FY25 (first full year of 20% TCS), FY26 (₹10L threshold relief), and FY27 (Apr-Aug 2026)!
    #Wait: let's check if a multiLine of monthly dates fails if dates aren't YYYY-MM. In `validate-data-artifacts.mjs`, `series` observations must have valid `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` dates!
    # So for Chart 7, let's build `lrs26.monthly_purpose_fingerprint.IN` as a `groupedTable` of the 12 calendar months (Apr to Mar) showing average monthly outflows (FY23-FY26) for Travel, Studies Abroad, Equity/Debt & Deposits, and Family/Gifts, OR let's use `heatStrip` with annual series!
    # Wait: let's check how `groupedTable` works! In `groupedTable`, `rows` can be ANY objects with `labelField` and `columns: [{key, label}, ...]`, and `validateTableArtifact` accepts any row objects!
    # Let's build BOTH:
    # Chart 7 (`groupedTable`: `lrs26.seasonal_calendar_profile.IN`): All 12 months of the Indian financial year (April through March), showing the multi-year average monthly outflow (FY23-FY26, plus Apr-Aug FY27) for:
    # - Travel (`1.6`)
    # - Direct Tuition / Studies Abroad (`1.9`)
    # - Capital & Financial Assets (`1.1 + 1.2 + 1.3`)
    # - Family Maintenance & Gifts (`1.4 + 1.7`)
    cal_months = [
        (4, "April (New quota opens)"),
        (5, "May (Summer travel)"),
        (6, "June (Pre-monsoon / 2023 TCS spike)"),
        (7, "July (Pre-semester)"),
        (8, "August (Autumn tuition peak)"),
        (9, "September (Autumn intake / 2023 TCS spike)"),
        (10, "October (Post-deadline dip)"),
        (11, "November (Year-end lull)"),
        (12, "December (Winter holidays / spring fee)"),
        (1, "January (Spring semester)"),
        (2, "February (Pre-closing)"),
        (3, "March (Year-end capital quota rush)"),
    ]
    seasonal_rows = []
    for m_num, m_label in cal_months:
        # Use 2022-04 through 2026-08
        matching_yms = [ym for ym in all_months if ym >= "2022-04" and int(ym[5:7]) == m_num]
        n = len(matching_yms)
        avg_total = round(sum(monthly[ym][1]["value"] for ym in matching_yms) / n, 1)
        avg_travel = round(sum(monthly[ym][7]["value"] for ym in matching_yms) / n, 1)
        avg_studies = round(sum(monthly[ym][15]["value"] for ym in matching_yms) / n, 1)
        avg_capital = round(sum(monthly[ym][2]["value"] + monthly[ym][3]["value"] + monthly[ym][4]["value"] for ym in matching_yms) / n, 1)
        avg_family = round(sum(monthly[ym][5]["value"] + monthly[ym][13]["value"] for ym in matching_yms) / n, 1)
        seasonal_rows.append({
            "month": m_label,
            "total": avg_total,
            "travel": avg_travel,
            "studies": avg_studies,
            "capital": avg_capital,
            "family": avg_family,
        })

    write_artifact(
        "lrs-controls.lrs26.seasonal_calendar_profile.IN.json",
        make_table(
            "lrs26.seasonal_calendar_profile.IN",
            "Average monthly LRS outflows by financial-year calendar month and purpose, Apr 2022 to Aug 2026 (USD million)",
            "USD million",
            seasonal_rows,
            "RBI_DBIE_R19_SEASONAL_PROFILE_2022_2026",
        ),
        catalog_entries,
    )

    # --- CHART 8: The TCS Tax Experiment across 4 Policy Regimes (groupedTable: lrs26.tcs_regime_audit.IN) ---
    # Compare monthly average outflows (USD million/month) across 4 regimes:
    # 1. Pre-20% TCS baseline (FY23: Apr 2022 - Mar 2023, 5% TCS)
    # 2. Pre-hike front-running window (Apr - Sep 2023, 6 months before 20% TCS took effect on Oct 1, 2023)
    # 3. First 18 months of 20% TCS above ₹7L (Oct 2023 - Mar 2025)
    # 4. Post-Budget ₹10L threshold & zero-TCS-on-loan-education era (Apr 2025 - Aug 2026, 17 months)
    w_fy23 = [ym for ym in all_months if "2022-04" <= ym <= "2023-03"]
    w_frontrun = [ym for ym in all_months if "2023-04" <= ym <= "2023-09"]
    w_tcs20_7l = [ym for ym in all_months if "2023-10" <= ym <= "2025-03"]
    w_tcs20_10l = [ym for ym in all_months if "2025-04" <= ym <= "2026-08"]

    def avg_m(months, orders):
        return round(sum(monthly[ym].get(o, {}).get("value", 0.0) for ym in months for o in orders) / len(months), 1)

    tcs_cats = [
        ("Total LRS (all purposes)", [1]),
        ("Travel (1.6)", [7]),
        ("Maintenance of close relatives (1.7)", [13]),
        ("Gifts & donations (1.4 + 1.5)", [5, 6]),
        ("Studies abroad direct line (1.9)", [15]),
        ("Equity & debt investment (1.3)", [4]),
        ("Foreign bank deposits (1.1)", [2]),
        ("Immovable property (1.2)", [3]),
    ]
    tcs_rows = []
    for label, orders in tcs_cats:
        tcs_rows.append({
            "purpose": label,
            "fy23_5pct": avg_m(w_fy23, orders),
            "frontrun_2023": avg_m(w_frontrun, orders),
            "tcs20_7l": avg_m(w_tcs20_7l, orders),
            "tcs20_10l": avg_m(w_tcs20_10l, orders),
        })

    write_artifact(
        "lrs-controls.lrs26.tcs_regime_audit.IN.json",
        make_table(
            "lrs26.tcs_regime_audit.IN",
            "Monthly average LRS outflows across four TCS tax regimes, Apr 2022 to Aug 2026 (USD million/month)",
            "USD million / month",
            tcs_rows,
            "RBI_DBIE_R19_TCS_REGIME_AUDIT",
        ),
        catalog_entries,
    )

    # --- CHART 9: Rupee Depreciation vs the $250,000 LRS Ceiling (multiLine: lrs26.ceiling_rupee_erosion.IN) ---
    # Compute monthly USD/INR valuation rate from FR_EXG_RESV_M_RN (INR / USD) from 2015-06 to 2026-08
    fx_tot = cas_df[(cas_df["dsd_code"] == "FR_EXG_RESV_M_RN") & (cas_df["series_label"] == "Foreign Exchange Reserves") & (cas_df["observation_date"] >= "2015-06-01")]
    fx_piv = fx_tot.pivot_table(index="observation_date", columns="unit_code", values="value").dropna()
    obs_ceiling_lakhs = []
    obs_sublimit_lakhs = []
    obs_tcs_free_lakhs = []

    for dt_str, row in fx_piv.sort_index().iterrows():
        ym = str(dt_str)[:7]
        usdinr = float(row["INR"]) / float(row["USD"])
        # $250,000 in INR lakhs = 250,000 * usdinr / 100,000 = 2.5 * usdinr
        ceiling_lakh = round(2.5 * usdinr, 2)
        obs_ceiling_lakhs.append({"date": ym, "value": ceiling_lakh})
        obs_sublimit_lakhs.append({"date": ym, "value": 50.0})
        tcs_free = 0.0 if ym < "2020-10" else (7.0 if ym < "2025-04" else 10.0)
        if ym >= "2020-10":
            obs_tcs_free_lakhs.append({"date": ym, "value": tcs_free})

    write_artifact(
        "lrs-controls.lrs26.ceiling_rupee_lakhs.IN.json",
        make_series(
            "lrs26.ceiling_rupee_lakhs.IN",
            "Rupee value of the $250,000 annual LRS ceiling (INR lakh)",
            "INR lakh",
            obs_ceiling_lakhs,
            "RBI_DBIE_FX_IMPLIED_USDINR_250K",
            source_url=RBI_FX_URL,
        ),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.proposed_sublimit_lakhs.IN.json",
        make_series(
            "lrs26.proposed_sublimit_lakhs.IN",
            "Proposed ₹50 lakh discretionary category sub-limit (INR lakh)",
            "INR lakh",
            obs_sublimit_lakhs,
            "REPORTED_PROPOSED_SUBLIMIT_50L",
            source_url="https://www.outlookmoney.com/banking/rbi-proposes-rs-50-lakh-sub-limit-for-certain-overseas-remittances-under-lrs",
            metadata={"referenceOnly": True, "note": "October 2026 press report, not an enacted or historical limit; horizontal benchmark throughout the chart."},
        ),
        catalog_entries,
    )
    write_artifact(
        "lrs-controls.lrs26.tcs_exempt_threshold_lakhs.IN.json",
        make_series(
            "lrs26.tcs_exempt_threshold_lakhs.IN",
            "Annual TCS-free remittance threshold under Section 206C(1G) (INR lakh)",
            "INR lakh",
            obs_tcs_free_lakhs,
            "FINANCE_ACT_206C1G_THRESHOLD",
            source_url="https://wm.incometaxindia.gov.in/w/tax-collection-at-source-tcs-",
        ),
        catalog_entries,
    )

    # Distinct financing-contribution lens: signed components, reconciled to net capital.
    capital_labels = {
        "Foreign direct investment": "Foreign Direct Investment / Foreign Investment / Capital Account / Overall Balance / Net",
        "Foreign portfolio investment": "Foreign Portfolio Investment / Foreign Investment / Capital Account / Overall Balance / Net",
        "Banking capital": "Banking Capital / Capital Account / Overall Balance / Net",
        "Loans": "Loans / Capital Account / Overall Balance / Net",
        "Other capital": "Other Capital / Capital Account / Overall Balance / Net",
        "Rupee debt service": "Rupee Debt Service / Capital Account / Overall Balance / Net",
    }
    capital_rows = [{"label": label, "value": round(bop_map[source], 6)} for label, source in capital_labels.items()]
    assert abs(sum(bop_map[source] for source in capital_labels.values()) - bop_map["Capital Account / Overall Balance / Net"]) < 0.00001
    write_artifact("lrs-controls.lrs26.capital_contributions.IN.json",
        make_table("lrs26.capital_contributions.IN", "Net capital-account contributions, FY2025-26", "USD billion", capital_rows,
        "RBI_DBIE_BOP_NET_CAPITAL_COMPONENTS_FY26", source_url=RBI_BOP_URL,
        metadata={"operation": "Signed net component balances; sum reconciles to net capital account within source precision.", "sourceLabels": capital_labels}), catalog_entries)

    # The reader-facing story keeps one compact comparison of same-period gross flows.
    private = cas_df[(cas_df["dsd_code"] == "IND_OVR_BOP_A_RN") &
        (cas_df["observation_date"] == "2026-03-31") &
        (cas_df["series_key"] == "io_bop_rn=CURR_INVIS_TRA_PRV|tranc_typ_rn=TRANC_CRD|unit_measure=USD")]
    assert len(private) == 1
    context_rows = [
        {"label": "Resident LRS outflows", "value": round(fy_totals["2025-26"][1] / 1000, 2)},
        {"label": "Gross outward FDI debit", "value": round(bop_map["Abroad / Foreign Direct Investment / Foreign Investment / Capital Account / Debit"], 2)},
        {"label": "Gross inward private transfers", "value": round(float(private.iloc[0]["value"]) / 1e9, 2)},
    ]
    write_artifact("lrs-controls.lrs26.remittance_context.IN.json",
        make_table("lrs26.remittance_context.IN", "Selected gross cross-border flows, FY2025-26", "USD billion",
                   context_rows, "RBI_DBIE_LRS_PRIVATE_TRANSFERS_OUTWARD_FDI_FY26", source_url=RBI_BOP_URL,
                   metadata={"limit": "Different populations and overlapping coverage. Comparison of scale only; these flows must not be summed or treated as offsets."}), catalog_entries)

    def raw_sum(months, orders):
        values = [monthly[ym][order]["raw"] for ym in months for order in orders]
        assert all(v != "" for v in values), "Missing value in new purpose calculation"
        return sum(Decimal(v) for v in values) / Decimal(1000000)

    bridge_groups = [
        ("Capital transfers", [2, 3, 4]),
        ("Travel and studies", [7, 15]),
        ("Maintenance of relatives", [13]),
        ("Gifts and donations", [5, 6]),
        ("Medical treatment", [14]),
        ("Others", [16]),
    ]
    bridge_rows = [{"label": name, "value": round(float(raw_sum(fy27_5m, orders) - raw_sum(fy26_5m, orders)), 6)}
                   for name, orders in bridge_groups]
    headline_change = raw_sum(fy27_5m, [1]) - raw_sum(fy26_5m, [1])
    assert abs(sum(Decimal(str(r["value"])) for r in bridge_rows) - headline_change) < Decimal("0.00001")
    write_artifact("lrs-controls.lrs26.matched_purpose_change.IN.json",
        make_table("lrs26.matched_purpose_change.IN", "Contributions to change in total LRS, April-August 2025 to April-August 2026",
                   "USD million", bridge_rows, "RBI_DBIE_R19_MATCHED_PURPOSE_CHANGE_APR_AUG",
                   metadata={"headlineChangeUSDm": float(headline_change), "groups": dict(bridge_groups),
                             "limit": "Travel and studies combined across the March 2026 reporting break. Descriptive accounting, not investor motives or a tax effect."}), catalog_entries)

    # Normalize each complete fiscal year before averaging so growing totals and
    # the partial latest year do not determine the seasonal pattern.
    allocation_groups = {"travel": [7], "studies": [15], "capital": [2, 3, 4], "family": [5, 6, 13]}
    allocation_rows = []
    for month in [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]:
        row = {"month": __import__("calendar").month_abbr[month]}
        for key, orders in allocation_groups.items():
            shares = []
            for end in range(2023, 2027):
                months = [f"{end - 1 if m >= 4 else end}-{m:02d}" for m in [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]]
                ym = f"{end - 1 if month >= 4 else end}-{month:02d}"
                shares.append(raw_sum([ym], orders) / raw_sum(months, orders) * 100)
            row[key] = round(float(sum(shares) / len(shares)), 2)
        allocation_rows.append(row)
    for key in allocation_groups:
        assert abs(sum(r[key] for r in allocation_rows) - 100) < .05
    write_artifact("lrs-controls.lrs26.seasonal_allocation_share.IN.json",
        make_table("lrs26.seasonal_allocation_share.IN", "Average within-financial-year monthly allocation by LRS channel, FY2022-23 to FY2025-26",
                   "% of that channel's annual remittances", allocation_rows, "RBI_DBIE_R19_WITHIN_FY_ALLOCATION_SHARE",
                   metadata={"formula": "For each month and channel, monthly remittances / same channel's full-year remittances * 100, then unweighted mean of four complete fiscal years.",
                             "years": ["2022-23", "2023-24", "2024-25", "2025-26"], "groups": allocation_groups,
                             "limit": "Each channel has its own annual denominator. Direct studies is the reporting line, not a complete education total."}), catalog_entries)

    # Write catalog manifest
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(stable_json(catalog_entries), encoding="utf-8")

    # Populate detailed summary stats in audit
    audit["summaryStats"] = {
        "aug2026": {
            "total": round(monthly["2026-08"][1]["value"], 2),
            "travel": round(monthly["2026-08"][7]["value"], 2),
            "businessTravel": round(monthly["2026-08"][8]["value"], 2),
            "pilgrimage": round(monthly["2026-08"][9]["value"], 2),
            "medicalTravel": round(monthly["2026-08"][10]["value"], 2),
            "educationTravel": round(monthly["2026-08"][11]["value"], 2),
            "otherTravel": round(monthly["2026-08"][12]["value"], 2),
            "studiesAbroad": round(monthly["2026-08"][15]["value"], 2),
            "combinedEducation": round(monthly["2026-08"][11]["value"] + monthly["2026-08"][15]["value"], 2),
            "equityDebt": round(monthly["2026-08"][4]["value"], 2),
            "deposits": round(monthly["2026-08"][2]["value"], 2),
            "property": round(monthly["2026-08"][3]["value"], 2),
            "relatives": round(monthly["2026-08"][13]["value"], 2),
            "gifts": round(monthly["2026-08"][5]["value"], 2),
        },
        "travel6mTotals_MarAug2026": {
            "allTravel": round(sum(monthly[ym][7]["value"] for ym in split_months), 2),
            **{key: round(value, 2) for key, value in travel_6m_totals.items()},
        },
        "fyTotals": {
            fy: {
                "total": fy_totals[fy][1],
                "travel": fy_totals[fy][7],
                "studies": fy_totals[fy][15],
                "relatives": fy_totals[fy][13],
                "gifts": fy_totals[fy][5],
                "equityDebt": fy_totals[fy][4],
                "deposits": fy_totals[fy][2],
                "property": fy_totals[fy][3],
                "capitalTriad": round(fy_totals[fy][2] + fy_totals[fy][3] + fy_totals[fy][4], 2),
            }
            for fy in ["2014-15", "2015-16", "2019-20", "2021-22", "2022-23", "2023-24", "2024-25", "2025-26"]
        },
        "fy27_5m_vs_fy26_5m": {
            "total_fy26_5m": sum_months(fy26_5m, [1]),
            "total_fy27_5m": sum_months(fy27_5m, [1]),
            "travel_fy26_5m": sum_months(fy26_5m, [7]),
            "travel_fy27_5m": sum_months(fy27_5m, [7]),
            "rows": dumbbell_rows,
        },
        "tcsRegimeRows": tcs_rows,
        "externalSectorScale": scale_rows,
        "ceilingLakhs": {
            "2015-06": obs_ceiling_lakhs[0]["value"],
            "2026-08": obs_ceiling_lakhs[-1]["value"],
        },
    }

    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    (AUDIT_DIR / "lrs-source-audit.json").write_text(stable_json(audit), encoding="utf-8")
    print("Built", len(catalog_entries), "artifacts for q.econ.lrs_controls.")
    print(json.dumps(audit["summaryStats"], indent=2))


if __name__ == "__main__":
    main()
