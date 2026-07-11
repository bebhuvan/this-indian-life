#!/usr/bin/env python3
"""Weighted tabulations of the NSS 80th round Household Social Consumption:
Health survey (Schedule 25.0, January - December 2025) unit-level CSVs.

Source archive: data/snapshots/microdata-nada/api-files/
  DDI-IND-NSO-HSCHealth80R-Jan2025-Dec2025/CSV_data_household_social_consumption_heaith_Jan_Dec25.zip
Layout: Datalayout_250_80R.xlsx; codes: CODEs_for_Blocks_of_Schpt25pt0.xlsx
Weight: mult / 100 (single sub-sample; verified - implied population 1.21 billion,
the usual NSS frame-based undercount vs projections, so shares and averages are
reliable while absolute totals are not).

Reference periods: hospitalisation = last 365 days (b6i10 in {1,2});
outpatient ailment spells = last 15 days. Hospitalisation averages exclude
childbirth cases (b6i5 in {87,88,89}) per the NSS KI-report convention;
childbirth is tabulated separately.

Outputs unofficial derived artifacts to data/series/nss80.IN.health.*.json.
These are Indica's own tabulations of the public microdata, not official
MoSPI estimates; the official 80R report may differ slightly.
"""

from __future__ import annotations

import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SNAP = ROOT / "data/snapshots/microdata-nada/api-files/DDI-IND-NSO-HSCHealth80R-Jan2025-Dec2025"
ZIP_PATH = SNAP / "CSV_data_household_social_consumption_heaith_Jan_Dec25.zip"
CACHE = ROOT / ".cache/nss80"
OUT_DIR = ROOT / "data/series"

SOURCE_ID = "nss80-health"
SOURCE_URL = "https://microdata.gov.in/NADA/index.php/catalog/DDI-IND-NSO-HSCHealth80R-Jan2025-Dec2025"
OBS_DATE = "2025-12-31"
FETCHED_AT = datetime.now(timezone.utc).isoformat()

INSTITUTION = {1: "Government hospital", 2: "Charitable/NGO hospital", 3: "Private hospital"}
LEVEL_OF_CARE = {
    1: "Government hospital", 2: "Charitable/NGO hospital", 3: "Private hospital",
    4: "Private doctor/clinic", 5: "Informal provider",
}
FINANCE = {
    1: "Household income/savings", 2: "Borrowings", 3: "Sale of physical assets",
    4: "Friends and relatives", 9: "Other sources",
}
INSURANCE = {
    1: "AB-PMJAY", 2: "State health insurance scheme", 3: "ESIS/ESIC",
    4: "CGHS/central govt schemes", 5: "State govt employee reimbursement",
    6: "PSU employer", 7: "Other employer insurance", 10: "Private commercial insurance",
    19: "Not covered",
}
UNTREATED_REASON = {
    1: "No facility in the neighbourhood", 2: "Facility too expensive",
    3: "Cannot afford to wait", 4: "Ailment not considered serious",
    5: "Familial/religious belief", 9: "Others",
}
SECTOR = {1: "Rural", 2: "Urban"}


def load(name: str, **kwargs) -> pd.DataFrame:
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(ZIP_PATH) as zf:
            member = next(m for m in zf.namelist() if m.endswith(name))
            path.write_bytes(zf.read(member))
    df = pd.read_csv(path, **kwargs)
    df["w"] = df["mult"] / 100
    return df


def wavg(df: pd.DataFrame, col: str) -> float:
    d = df.dropna(subset=[col])
    return float((d[col] * d["w"]).sum() / d["w"].sum())


def share(df: pd.DataFrame, mask: pd.Series) -> float:
    return float((mask * df["w"]).sum() / df["w"].sum() * 100)


def table_artifact(indicator_id, title, unit, rows, dimensions, note):
    return {
        "schemaVersion": 1, "artifactType": "table", "indicatorId": indicator_id,
        "title": title, "sourceId": SOURCE_ID,
        "sourceIndicatorId": "NSS 80th round Sch 25.0 unit data",
        "sourceUrl": SOURCE_URL, "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": dimensions, "fetchedAt": FETCHED_AT, "rows": rows,
        "metadata": {
            "source": "NSS 80th round, Household Social Consumption: Health (Jan-Dec 2025), unit-level data, MoSPI",
            "method": "Indica tabulation of public microdata; weights = mult/100. " + note,
        },
    }


def series_artifact(indicator_id, title, unit, value, note):
    art = table_artifact(indicator_id, title, unit, None, [], note)
    art["artifactType"] = "series"
    art["frequency"] = "annual"
    del art["rows"]
    art["observations"] = [{"date": OBS_DATE, "value": round(value, 2)}]
    return art


def write(artifact):
    name = artifact["indicatorId"].replace("health.nss80.", "")
    path = OUT_DIR / f"nss80.IN.health.{name}.json"
    path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{path.name}  {artifact['indicatorId']}")


def main() -> None:
    artifacts = []

    # ---- persons file: hospitalisation rate, insurance coverage ----
    l2 = load("hhscsL2.csv", usecols=["mult", "sec", "b3c4", "b3c9", "b3c17"])
    artifacts.append(series_artifact(
        "health.nss80.hosp_rate", "Share of people hospitalised in the last 365 days",
        "% of persons", share(l2, l2["b3c9"] == 1),
        "Includes childbirth hospitalisations."))
    covered = l2["b3c17"].notna() & (l2["b3c17"] != 19)
    artifacts.append(series_artifact(
        "health.nss80.insurance_covered", "Share of people covered by any health financing scheme",
        "% of persons", share(l2, covered),
        "Any scheme incl. PMJAY, state schemes, employer and private insurance."))
    rows = [
        {"scheme": name, "share_pct": round(share(l2, l2["b3c17"] == code), 2)}
        for code, name in INSURANCE.items()
    ]
    for sec, sec_name in SECTOR.items():
        sub = l2[l2["sec"] == sec]
        rows.append({"scheme": f"Any coverage ({sec_name})",
                     "share_pct": round(share(sub, sub["b3c17"].notna() & (sub["b3c17"] != 19)), 2)})
    artifacts.append(table_artifact(
        "health.nss80.insurance_composition", "Health financing coverage by scheme",
        "% of persons", rows, ["scheme"],
        "Block 3 col 17; persons can report one (major) scheme."))

    # ---- hospitalisation file ----
    l4 = load("hhscsL4.csv")
    cases = l4[l4["b6i10"].isin([1, 2])].copy()  # admitted within last 365 days
    cb_mask = cases["b6i5"].isin([87, 88, 89])
    exc, cb = cases[~cb_mask].copy(), cases[cb_mask].copy()
    exc["net_oop"] = exc["b7i15"].fillna(0) - exc["b7i16"].fillna(0)

    rows = []
    total_w = exc["w"].sum()
    for code, name in INSTITUTION.items():
        sub = exc[exc["b6i7"] == code]
        rows.append({
            "institution": name,
            "case_share_pct": round(float(sub["w"].sum() / total_w * 100), 1),
            "avg_medical_exp_rs": round(wavg(sub, "b7i12")),
            "avg_total_exp_rs": round(wavg(sub, "b7i15")),
        })
    rows.append({
        "institution": "All institutions", "case_share_pct": 100.0,
        "avg_medical_exp_rs": round(wavg(exc, "b7i12")),
        "avg_total_exp_rs": round(wavg(exc, "b7i15")),
    })
    artifacts.append(table_artifact(
        "health.nss80.hosp_by_institution",
        "Hospitalisation cases and costs by type of hospital",
        "mixed (% and Rs.)", rows, ["institution"],
        "Cases admitted in last 365 days, excluding childbirth. Medical exp = b7i12; total exp adds transport/other (b7i15)."))

    artifacts.append(series_artifact(
        "health.nss80.hosp_avg_medical_exp", "Average medical expenditure per hospitalisation case",
        "Rs. per case", wavg(exc, "b7i12"), "Excluding childbirth; before reimbursement."))
    artifacts.append(series_artifact(
        "health.nss80.hosp_avg_net_oop", "Average out-of-pocket spend per hospitalisation case, net of reimbursement",
        "Rs. per case", float((exc["net_oop"] * exc["w"]).sum() / exc["w"].sum()),
        "Total expenditure (b7i15) minus insurance/employer reimbursement (b7i16); excluding childbirth."))
    artifacts.append(series_artifact(
        "health.nss80.hosp_private_share", "Share of hospitalisation cases treated in private hospitals",
        "% of cases", float(exc.loc[exc["b6i7"] == 3, "w"].sum() / total_w * 100),
        "Excluding childbirth; charitable/NGO counted separately."))

    rows = [
        {"source": name, "share_pct": round(float(exc.loc[exc["b7i17"] == code, "w"].sum() / total_w * 100), 1)}
        for code, name in FINANCE.items()
    ]
    artifacts.append(table_artifact(
        "health.nss80.hosp_finance_sources", "Major source of finance for hospitalisation expenses",
        "% of cases", rows, ["source"],
        "Excluding childbirth cases."))

    rows = []
    cb_total = cb["w"].sum()
    for code, name in INSTITUTION.items():
        sub = cb[cb["b6i7"] == code]
        csec = float(sub.loc[sub["b6i5"] == 88, "w"].sum() / sub["w"].sum() * 100) if sub["w"].sum() else None
        rows.append({
            "institution": name,
            "delivery_share_pct": round(float(sub["w"].sum() / cb_total * 100), 1),
            "avg_medical_exp_rs": round(wavg(sub, "b7i12")),
            "csection_share_pct": round(csec, 1) if csec is not None else None,
        })
    artifacts.append(table_artifact(
        "health.nss80.childbirth_by_institution", "Childbirth hospitalisations: costs and C-section share by hospital type",
        "mixed (% and Rs.)", rows, ["institution"],
        "Childbirth cases (codes 87-89) admitted in last 365 days; C-section = code 88 share of institutional deliveries."))

    # ---- outpatient file ----
    l5 = load("hhscsL5.csv")
    spells_w = l5["w"].sum()
    untreated = l5[l5["b8i14"].notna()]
    artifacts.append(series_artifact(
        "health.nss80.untreated_share", "Share of ailment spells without medical advice sought",
        "% of spells", float(untreated["w"].sum() / spells_w * 100),
        "Spells in the last 15 days where the 'reason for not seeking medical advice' field is populated."))
    rows = [
        {"reason": name, "share_pct": round(float(untreated.loc[untreated["b8i14"] == code, "w"].sum() / untreated["w"].sum() * 100), 1)}
        for code, name in UNTREATED_REASON.items()
    ]
    artifacts.append(table_artifact(
        "health.nss80.untreated_reasons", "Why people skip treatment",
        "% of untreated spells", rows, ["reason"], "Reference period: last 15 days."))

    treated = l5[l5["b8i12"].notna()]
    rows = []
    for code, name in LEVEL_OF_CARE.items():
        sub = treated[treated["b8i12"] == code]
        if not len(sub):
            continue
        rows.append({
            "provider": name,
            "spell_share_pct": round(float(sub["w"].sum() / treated["w"].sum() * 100), 1),
            "avg_medical_exp_rs": round(wavg(sub, "b9i16")),
        })
    artifacts.append(table_artifact(
        "health.nss80.outpatient_by_provider", "Outpatient care: where people go and what it costs",
        "mixed (% and Rs.)", rows, ["provider"],
        "Treated ailment spells in last 15 days; avg medical expenditure per spell (b9i16)."))
    artifacts.append(series_artifact(
        "health.nss80.outpatient_private_share", "Share of treated outpatient spells at private providers",
        "% of spells", float(treated.loc[treated["b8i12"].isin([3, 4]), "w"].sum() / treated["w"].sum() * 100),
        "Private hospital + private doctor/clinic; informal providers counted separately."))

    # ---- govt-bypass reasons (hospitalisation, non-govt cases) ----
    bypass = exc[exc["b6i8"].notna()]
    bypass_reasons = {
        1: "Required services not available", 2: "Quality not satisfactory/no doctor",
        3: "Facility too far", 4: "Long waiting", 5: "Financial constraint",
        6: "Preference for trusted doctor/hospital", 9: "Others",
    }
    rows = [
        {"reason": name, "share_pct": round(float(bypass.loc[bypass["b6i8"] == code, "w"].sum() / bypass["w"].sum() * 100), 1)}
        for code, name in bypass_reasons.items()
    ]
    artifacts.append(table_artifact(
        "health.nss80.govt_bypass_reasons", "Why patients skip government hospitals",
        "% of non-government hospitalisation cases", rows, ["reason"],
        "Asked of cases not treated in govt/public hospitals; excluding childbirth."))

    for artifact in artifacts:
        write(artifact)
    print(f"\nwrote {len(artifacts)} artifacts to {OUT_DIR}")


if __name__ == "__main__":
    main()
