#!/usr/bin/env python3
"""Build all series, tables, choropleth, catalog manifest, and cell-level source audit for q.econ.poverty_debate."""

import hashlib
import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "data/raw/wb-3pr-2026"
SERIES_DIR = ROOT / "data/series"
CATALOG_PATH = ROOT / "data/catalog/poverty-debate-manifest.json"
AUDIT_DIR = ROOT / "data/audits/poverty-debate"

FETCHED_AT = "2026-10-29T00:00:00.000Z"
WB_3PR_URL = "https://www.worldbank.org/en/publication/poverty-prosperity-and-planet"
PIP_URL = "https://pip.worldbank.org/country-profiles/IND"
HCES_URL = "https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf"
TINBERGEN_URL = "https://papers.tinbergen.nl/25069.pdf"


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


def make_series(indicator_id, title, unit, observations, source_indicator_id, source_url=WB_3PR_URL, frequency="annual", metadata=None):
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "wb_3pr_2026",
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


def make_table(indicator_id, title, unit, rows, source_indicator_id, source_url=WB_3PR_URL, dimensions=None, metadata=None):
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "mospi-hces" if str(source_indicator_id).startswith("MOSPI_") else "tinbergen" if str(source_indicator_id).startswith("TINBERGEN_") else "wb_3pr_2026",
        "sourceIndicatorId": source_indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": dimensions or [],
        "fetchedAt": FETCHED_AT,
        "rows": rows,
        "metadata": metadata or {},
    }


def main():
    catalog_entries = []
    audit = {
        "story": "q.econ.poverty_debate",
        "rawManifest": "data/raw/wb-3pr-2026/manifest.json",
        "summary": {},
    }

    # --- CHART 1: Hero multiLine (Lined-up trajectories 1990-2030 across $3.00, $4.20, $8.30 + Societal Poverty Rate) ---
    fgt = pd.read_stata(RAW_DIR / "Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta")
    fgt_ind = fgt[(fgt["code"] == "IND") & (fgt["year"] >= 1990) & (fgt["year"] <= 2030)].sort_values("year")
    fgt_300 = fgt_ind[fgt_ind["povertyline"].round(2) == 3.00].sort_values("year")
    fgt_420 = fgt_ind[fgt_ind["povertyline"].round(2) == 4.20].sort_values("year")
    fgt_830 = fgt_ind[fgt_ind["povertyline"].round(2) == 8.30].sort_values("year")

    pip2 = pd.read_stata(RAW_DIR / "pip_20260922_2021_01_02_PROD.dta")
    pip2_ind = pip2[(pip2["country_code"] == "IND") & (pip2["reporting_level"] == "national")].sort_values("year")

    obs_ln_300 = [{"date": str(int(r["year"])), "value": round(float(r["fgt0"]), 2)} for _, r in fgt_300.iterrows()]
    obs_ln_420 = [{"date": str(int(r["year"])), "value": round(float(r["fgt0"]), 2)} for _, r in fgt_420.iterrows()]
    obs_ln_830 = [{"date": str(int(r["year"])), "value": round(float(r["fgt0"]), 2)} for _, r in fgt_830.iterrows()]
    obs_spr = [{"date": str(int(r["year"])), "value": round(float(r["spr"]) * 100.0, 2)} for _, r in pip2_ind[pip2_ind["year"] >= 1993].iterrows()]

    write_artifact(
        "poverty-debate.pov26.linedup_300.IN.json",
        make_series("pov26.linedup_300.IN", "Lined-up poverty headcount at $3.00/day (2021 PPP), 1990 to 2030", "% of population", obs_ln_300, "WB_3PR_CH1_FGT_HEADCOUNT300"),
        catalog_entries,
    )
    write_artifact(
        "poverty-debate.pov26.linedup_420.IN.json",
        make_series("pov26.linedup_420.IN", "Lined-up poverty headcount at $4.20/day (2021 PPP), 1990 to 2030", "% of population", obs_ln_420, "WB_3PR_CH1_FGT_HEADCOUNT420"),
        catalog_entries,
    )
    write_artifact(
        "poverty-debate.pov26.linedup_830.IN.json",
        make_series("pov26.linedup_830.IN", "Lined-up poverty headcount at $8.30/day (2021 PPP), 1990 to 2030", "% of population", obs_ln_830, "WB_3PR_CH1_FGT_HEADCOUNT830"),
        catalog_entries,
    )
    write_artifact(
        "poverty-debate.pov26.societal_poverty_rate.IN.json",
        make_series("pov26.societal_poverty_rate.IN", "Societal poverty rate at India's dynamic societal poverty line ($3.00 to $4.27/day)", "% of population", obs_spr, "WB_3PR_CH2_PIP_SPR", source_url=PIP_URL),
        catalog_entries,
    )

    # --- CHART 2: The Bunching Cliff / Pen's Parade (1990, 2011, 2024 from GlobalDist1000bins, groupedTable across 10 decile midpoints/boundaries) ---
    bins_df = pd.read_csv(RAW_DIR / "IND_GlobalDist1000bins_1990_2026.csv")
    # Build a clean groupedTable across 10 key percentiles (P10, P20, P30, P40, P50, P60, P70, P80, P90, P95) for 1990, 2011, 2024, and 2026
    pct_points = [
        (100, "10th percentile (poorest tenth)"),
        (200, "20th percentile"),
        (300, "30th percentile"),
        (400, "40th percentile"),
        (500, "50th percentile (median Indian)"),
        (600, "60th percentile"),
        (700, "70th percentile"),
        (800, "80th percentile"),
        (900, "90th percentile (top tenth threshold)"),
        (950, "95th percentile (top 5% threshold)"),
    ]
    parade_rows = []
    for q_idx, q_label in pct_points:
        row = {"percentile": q_label.replace("percentile", "percentile bin").replace(" (median Indian)", "").replace(" (top tenth threshold)", "").replace(" (top 5% threshold)", ""), "quantile": q_idx}
        for yr in [1990, 2011, 2024, 2026]:
            v = float(bins_df[(bins_df["year"] == yr) & (bins_df["quantile"] == q_idx)]["welf"].iloc[0])
            row[f"y{yr}"] = round(v, 2)
        parade_rows.append(row)

    write_artifact(
        "poverty-debate.pov26.bunching_percentile_ladder.IN.json",
        make_table(
            "pov26.bunching_percentile_ladder.IN",
            "Daily per-capita consumption across Indian population percentiles in 1990, 2011, 2024, and 2026 (representative bin welfare, 2021 PPP USD/day)",
            "2021 PPP USD / day",
            parade_rows,
            "WB_3PR_CH1_GLOBALDIST1000BINS_IND",
        ),
        catalog_entries,
    )

    # New cuts use their own clearly identified bases. No survey-to-lineup splicing.
    survey = {year: pip2_ind[pip2_ind["year"].eq(year)].iloc[0] for year in (2022, 2023)}
    assert all(survey[y]["comparable_spell"] == "2022 - 2023" for y in survey)
    assert all(survey[y]["welfare_type"] == "consumption" for y in survey)
    assert survey[2022]["ppp"] == survey[2023]["ppp"]
    growth_rows = []
    for d in range(1, 11):
        before = float(survey[2022]["mean"] * survey[2022][f"decile{d}"] / .1)
        after = float(survey[2023]["mean"] * survey[2023][f"decile{d}"] / .1)
        growth_rows.append({"label": "Poorest 10%" if d == 1 else "Richest surveyed 10%" if d == 10 else f"Decile {d}",
                            "decile": d, "mean2022": round(before, 4), "mean2023": round(after, 4),
                            "value": round((after / before - 1) * 100, 2)})
    write_artifact("poverty-debate.pov26.decile_real_growth_2022_2023.IN.json",
        make_table("pov26.decile_real_growth_2022_2023.IN", "Real consumption growth by survey decile, HCES 2022-23 to 2023-24", "% change", growth_rows,
            "PIP_20260922_IND_COMPARABLE_2022_2023_DECILES", source_url=PIP_URL,
            metadata={"formula": "decile mean = national mean * decile share / 0.1; growth = (mean2023 / mean2022 - 1) * 100",
                      "comparisonSpell": "2022 - 2023", "basis": "Repeated survey cross-sections, not the same people; daily 2021 PPP consumption means."}), catalog_entries)
    y = bins_df[bins_df["year"].eq(2024)]
    buffer_rows = []
    for line in (3., 4.2, 8.3):
        base = float(y.loc[y["welf"] < line, "pop"].sum() / y["pop"].sum() * 100)
        loss = float(y.loc[y["welf"] * .9 < line, "pop"].sum() / y["pop"].sum() * 100)
        buffer_rows.append({"line": f"${line:.2f}/day", "baseline": round(base, 1), "loss10": round(loss, 1)})
    write_artifact("poverty-debate.pov26.poverty_buffer_2024.IN.json",
        make_table("pov26.poverty_buffer_2024.IN", "Poverty headcounts under a hypothetical uniform 10% real consumption loss, 2024 bins", "% of population", buffer_rows,
            "WB_3PR_CH1_GLOBALDIST1000BINS_IND_SENSITIVITY",
            metadata={"scenario": "Hypothetical uniform 10% real consumption loss, not a forecast or transition probability.",
                      "formula": "sum(pop where welf*(1-loss)<line) / sum(pop) * 100; loss is 0 or 0.10",
                      "resolution": "Approximately 0.1 percentage point; baseline and scenario both use the same 1,000 population bins.",
                      "differenceFromHeadline": "Bin headcounts approximate the full-precision Country_FGT lineup estimates."}), catalog_entries)
    peer_rows = []
    for code, name in [("IND", "India"), ("BGD", "Bangladesh"), ("IDN", "Indonesia"), ("VNM", "Viet Nam"), ("PAK", "Pakistan")]:
        row = {"country": name, "code": code}
        basis = {}
        for line, field in [(3., "p300"), (4.2, "p420"), (8.3, "p830")]:
            sel = fgt[fgt["code"].eq(code) & fgt["year"].eq(2024) & fgt["povertyline"].round(2).eq(line)]
            assert len(sel) == 1
            row[field] = round(float(sel.iloc[0]["fgt0"]), 2)
            basis[field] = str(sel.iloc[0]["estimate_type"])
        row["estimateBasis"] = basis
        peer_rows.append(row)
    write_artifact("poverty-debate.pov26.peer_thresholds_2024.IN.json",
        make_table("pov26.peer_thresholds_2024.IN", "Poverty headcounts at common 2021 PPP lines, selected Asian countries, 2024", "% of population", peer_rows,
            "WB_3PR_CH1_FGT_ASIAN_COMPARATORS_2024",
            metadata={"selection": "Five selected Asian comparators, not an exhaustive ranking or a single income group; Indonesia is upper-middle-income.",
                      "basis": "Common calendar year and PPP vintage, but estimate_type is actual for Indonesia and projection for the other four. Projection includes lineup estimates, not a new household survey."}), catalog_entries)

    # Compute exact bunching shares from GlobalDist1000bins
    bunch_stats = {}
    for yr in [1990, 2004, 2011, 2022, 2023, 2024, 2026]:
        sub = bins_df[bins_df["year"] == yr]
        u3 = round(float((sub["welf"] < 3.00).mean() * 100.0), 1)
        u42 = round(float((sub["welf"] < 4.20).mean() * 100.0), 1)
        u83 = round(float((sub["welf"] < 8.30).mean() * 100.0), 1)
        b_3_83 = round(float(((sub["welf"] >= 3.00) & (sub["welf"] < 8.30)).mean() * 100.0), 1)
        bunch_stats[str(yr)] = {"under300": u3, "under420": u42, "under830": u83, "between300and830": b_3_83}

    depth_rows = []
    for line in ["3.00", "4.20", "8.30"]:
        rows = json.loads((RAW_DIR / f"pip_IND_pl{line.replace('.', '_')}_20260922_2021_01_02_PROD.json").read_text())
        row = next(r for r in rows if r["reporting_year"] == 2023 and r["reporting_level"] == "national")
        assert row["headcount"] > 0
        depth_rows.append({"label": f"Below ${line}/day", "value": round(row["poverty_gap"] / row["headcount"] * 100, 2)})
    write_artifact("poverty-debate.pov26.mean_shortfall_among_poor.IN.json",
                   make_table("pov26.mean_shortfall_among_poor.IN", "Mean consumption shortfall among those below each line, HCES 2023-24", "% of poverty line, among the poor", depth_rows,
                              "PIP_20260922_2021_POVERTY_GAP_DIV_HEADCOUNT_2023", source_url=PIP_URL,
                              metadata={"formula": "100 * population-average poverty_gap / headcount; both inputs from same national survey row and threshold", "precision": "API inputs are rounded to four decimals; results are approximate."}), catalog_entries)

    # --- CHART 3: State-Level Prosperity Gap Choropleth (GSAP 2023, all 36 states/UTs) ---
    gsap_df = pd.read_excel(RAW_DIR / "AM26_GSAP_data.xlsx", sheet_name="Data 2023")
    gsap_ind = gsap_df[gsap_df["code"] == "IND"].copy()

    name_map = {
        "Orissa": "Odisha",
        "Andaman and Nicobar": "Andaman and Nicobar Islands",
        "Daman and Diu & Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
    }
    gsap_ind["map_name"] = gsap_ind["sample"].map(lambda x: name_map.get(str(x).strip(), str(x).strip()))
    gsap_by_name = {r["map_name"]: r for _, r in gsap_ind.iterrows()}

    base_map = json.loads((SERIES_DIR / "ipindia.innov.ipindia.state_filings_per_million.json").read_text(encoding="utf-8"))
    regions = []
    vals = []
    state_table_meta = []
    for reg in base_map["regions"]:
        nm = reg["name"]
        r = gsap_by_name[nm]
        pg_val = round(float(r["prosgap2021"]), 2)
        vals.append(pg_val)
        regions.append({
            "name": nm,
            "value": pg_val,
            "path": reg["path"],
        })

    for _, r in gsap_ind.sort_values("prosgap2021", ascending=False).iterrows():
        state_table_meta.append({
            "state": r["map_name"],
            "poor300": round(float(r["poor300_ln"]) * 100.0, 2),
            "poor420": round(float(r["poor420_ln"]) * 100.0, 2),
            "poor830": round(float(r["poor830_ln"]) * 100.0, 2),
            "prosperityGap": round(float(r["prosgap2021"]), 2),
        })

    choropleth_payload = {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": "pov26.state_prosperity_gap_2023.IN",
        "title": "World Bank Prosperity Gap by Indian state and union territory, HCES 2023-24 (multiple of consumption needed to reach $28/day)",
        "sourceId": "wb_3pr_2026",
        "sourceIndicatorId": "WB_3PR_CH1_GSAP_2023_PROSGAP2021",
        "sourceUrl": WB_3PR_URL,
        "unit": "multiple to $28/day",
        "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
        "fetchedAt": FETCHED_AT,
        "dimensions": [],
        "rows": state_table_meta,
        "viewBox": base_map["viewBox"],
        "min": min(vals),
        "max": max(vals),
        "regions": regions,
        "metadata": {"all36States": state_table_meta},
    }
    write_artifact("poverty-debate.pov26.state_prosperity_gap_2023.IN.json", choropleth_payload, catalog_entries)

    # --- CHART 4: State-Level Three-Line Shift (groupedTable: 12 major states across $3.00, $4.20, $8.30 in 2023) ---
    selected_states = [
        "Jharkhand",
        "Chhattisgarh",
        "Odisha",
        "Assam",
        "Bihar",
        "Uttar Pradesh",
        "Madhya Pradesh",
        "Maharashtra",
        "West Bengal",
        "Gujarat",
        "Karnataka",
        "Tamil Nadu",
        "Kerala",
        "Punjab",
    ]
    state_3line_rows = []
    for st in selected_states:
        r = gsap_by_name[st]
        state_3line_rows.append({
            "state": st,
            "p300": round(float(r["poor300_ln"]) * 100.0, 1),
            "p420": round(float(r["poor420_ln"]) * 100.0, 1),
            "p830": round(float(r["poor830_ln"]) * 100.0, 1),
            "pg": round(float(r["prosgap2021"]), 2),
        })

    write_artifact(
        "poverty-debate.pov26.state_three_lines_2023.IN.json",
        make_table(
            "pov26.state_three_lines_2023.IN",
            "State poverty headcount rates across the $3.00, $4.20, and $8.30/day lines, HCES 2023-24 (% of population)",
            "% of population",
            state_3line_rows,
            "WB_3PR_CH1_GSAP_2023_THREE_LINES",
        ),
        catalog_entries,
    )

    spid = pd.read_excel(RAW_DIR / "AM26_SPID_data.xlsx", sheet_name="Data")
    spid["excelRow"] = spid.index + 2
    spid = spid[spid["code"].eq("IND") & spid["year"].eq(2023)]
    spid["state"] = spid["sample"].map(lambda v: {"Orissa": "Odisha", "Andaman and Nicobar": "Andaman and Nicobar Islands"}.get(v, v))
    child = spid[spid["data_group"].eq("0-5")].set_index("state")
    allages = spid[spid["data_group"].eq("ALL")].set_index("state")
    assert child.index.is_unique and allages.index.is_unique and set(child.index) == set(allages.index)
    assert len(child) == 36 and child["ref_year"].eq(2023.58).all() and allages["ref_year"].eq(2023.58).all()
    child_rows = []
    for state in selected_states:
        c, a = child.loc[state], allages.loc[state]
        child_rows.append({"state": state, "allAges": round(float(a["poor830"])*100,2), "ages0to5": round(float(c["poor830"])*100,2)})
    write_artifact("poverty-debate.pov26.child_poverty_2023.IN.json",
        make_table("pov26.child_poverty_2023.IN", "Household consumption poverty below $8.30: ages 0-5 versus all ages, selected states, HCES 2023-24", "% of each age group", child_rows,
            "WB_3PR_CH1_SPID_2023_AGES0_5_VS_ALL", source_url="https://datacatalogfiles.worldbank.org/ddh-published/0064796/DR0092191/AM26%20-%20SPID%20data.xlsx",
            metadata={"basis": "SPID Data, IND year2023, ref_year2023.58, survnameHCES; direct survey estimates; not GSAP calendar lineup.",
                      "groups": "Nested comparisons: all ages includes children aged0-5. Household per-capita consumption, not children's own spending or within-household allocation.",
                      "coverage": "14 selected states shown; ages0-5 share is higher than ALL in all36 states/UTs. No national child headcount is inferred without weights.",
                      "sourceRows": {state: {"ages0to5": int(child.loc[state,"excelRow"]), "allAges": int(allages.loc[state,"excelRow"])} for state in selected_states}}), catalog_entries)

    # --- CHART 5: The 2017 PPP vs 2021 PPP Revision Paradox (dumbbell: 2011, 2022, 2023 across Extreme, LMIC, and UMIC lines) ---
    def load_pip_json(ver, pl):
        p = RAW_DIR / f"pip_IND_pl{pl.replace('.', '_')}_{ver}.json"
        rows = json.loads(p.read_text(encoding="utf-8"))
        return {int(r["reporting_year"]): round(float(r["headcount"]) * 100.0, 2) for r in rows if r["reporting_level"] == "national"}

    p21_300 = load_pip_json("20260922_2021_01_02_PROD", "3.00")
    p21_420 = load_pip_json("20260922_2021_01_02_PROD", "4.20")
    p21_830 = load_pip_json("20260922_2021_01_02_PROD", "8.30")
    p17_215 = load_pip_json("20260922_2017_01_02_PROD", "2.15")
    p17_365 = load_pip_json("20260922_2017_01_02_PROD", "3.65")
    p17_685 = load_pip_json("20260922_2017_01_02_PROD", "6.85")

    ppp_paradox_rows = [
        {"benchmark": "2011-12 Extreme line ($2.15 to $3.00)", "ppp2017": p17_215[2011], "ppp2021": p21_300[2011], "diff_pp": round(p21_300[2011] - p17_215[2011], 2)},
        {"benchmark": "2022-23 Extreme line ($2.15 to $3.00)", "ppp2017": p17_215[2022], "ppp2021": p21_300[2022], "diff_pp": round(p21_300[2022] - p17_215[2022], 2)},
        {"benchmark": "2023-24 Extreme line ($2.15 to $3.00)", "ppp2017": p17_215[2023], "ppp2021": p21_300[2023], "diff_pp": round(p21_300[2023] - p17_215[2023], 2)},
        {"benchmark": "2011-12 LMIC line ($3.65 to $4.20)", "ppp2017": p17_365[2011], "ppp2021": p21_420[2011], "diff_pp": round(p21_420[2011] - p17_365[2011], 2)},
        {"benchmark": "2022-23 LMIC line ($3.65 to $4.20)", "ppp2017": p17_365[2022], "ppp2021": p21_420[2022], "diff_pp": round(p21_420[2022] - p17_365[2022], 2)},
        {"benchmark": "2023-24 LMIC line ($3.65 to $4.20)", "ppp2017": p17_365[2023], "ppp2021": p21_420[2023], "diff_pp": round(p21_420[2023] - p17_365[2023], 2)},
        {"benchmark": "2023-24 UMIC line ($6.85 to $8.30)", "ppp2017": p17_685[2023], "ppp2021": p21_830[2023], "diff_pp": round(p21_830[2023] - p17_685[2023], 2)},
    ]
    write_artifact(
        "poverty-debate.pov26.ppp_revision_paradox.IN.json",
        make_table(
            "pov26.ppp_revision_paradox.IN",
            "Indian poverty headcount rates under 2017 PPP vs 2021 PPP vintages, September 2026 PIP release (% of population)",
            "% of population",
            ppp_paradox_rows,
            "WB_PIP_20260922_2017PPP_VS_2021PPP",
            source_url=PIP_URL,
        ),
        catalog_entries,
    )

    # --- CHART 6: Survey Questionnaire & Imputation Controversy Map for 2022-23 (tableBars) ---
    method_rows = [
        {"label": "PIP 2017 PPP extreme line ($2.15/day, direct HCES)", "value": p17_215[2022]},
        {"label": "PIP 2021 PPP extreme line ($3.00/day, direct HCES)", "value": p21_300[2022]},
        {"label": "Direct HCES 2022-23 on Rangarajan rupee line (no adjustment)", "value": 7.2},
        {"label": "CES-imputed Tendulkar line (lowest model, Himanshu et al.)", "value": 11.3},
        {"label": "CES-imputed Tendulkar line (highest model, Himanshu et al.)", "value": 13.6},
        {"label": "CES-imputed Rangarajan MMRP line (Himanshu et al.)", "value": 17.5},
        {"label": "EUS-to-PLFS Tendulkar line (sector model applied within states)", "value": 17.5},
        {"label": "EUS-to-PLFS Tendulkar line (sector-wide model, Himanshu et al.)", "value": 19.9},
        {"label": "PIP 2021 PPP Societal Poverty Line ($4.07/day, HCES 2022-23)", "value": round(float(pip2_ind[pip2_ind["year"] == 2022].iloc[0]["spr"]) * 100, 2)},
        {"label": "PIP 2021 PPP LMIC line ($4.20/day, direct HCES)", "value": p21_420[2022]},
        {"label": "EUS-to-PLFS Rangarajan MMRP line (sector-wide model)", "value": 25.9},
    ]
    write_artifact(
        "poverty-debate.pov26.survey_method_controversy_2022.IN.json",
        make_table(
            "pov26.survey_method_controversy_2022.IN",
            "Estimated Indian poverty headcount in 2022-23 across survey methods and poverty lines (% of population)",
            "% of population",
            method_rows,
            "TINBERGEN_2025_069_AND_PIP_20260922",
            source_url=TINBERGEN_URL,
        ),
        catalog_entries,
    )

    # --- CHART 7: Free Grain & Welfare Imputation Boost Across Deciles in HCES 2023-24 (groupedTable) ---
    # Only published sector averages are independently reproducible from the frozen press note.
    # The previous fractile reconstruction depended on unfrozen microdata and calibration.
    imp_rows = [
        {"sector": "Rural", "without": 4122, "with": 4247, "boostPct": round(125 / 4122 * 100, 2)},
        {"sector": "Urban", "without": 6996, "with": 7078, "boostPct": round(82 / 6996 * 100, 2)},
    ]
    write_artifact(
        "poverty-debate.pov26.free_grain_imputation_deciles.IN.json",
        make_table("pov26.free_grain_imputation_deciles.IN",
                   "Published average MPCE without and with free-welfare imputation, HCES 2023-24",
                   "Rs per person per month", imp_rows, "MOSPI_HCES_2023_24_PRESS_NOTE_SECTIONS_A_B",
                   source_url=HCES_URL,
                   metadata={"scope": "Published sector means, not consumption fractiles. Boost denominator is without-imputation MPCE."}),
        catalog_entries,
    )

    # --- CHART 8: National Accounts vs Survey Consumption Growth Index (1977=100, multiLine) ---
    base_1977 = pip2_ind[pip2_ind["year"] == 1977].iloc[0]
    m0, h0, g0 = float(base_1977["mean"]), float(base_1977["hfce"]), float(base_1977["gdp"])

    obs_idx_survey = []
    obs_idx_hfce = []
    obs_idx_gdp = []
    na_survey_table = []
    for _, r in pip2_ind.iterrows():
        yr = str(int(r["year"]))
        sm = round(float(r["mean"]) / m0 * 100.0, 1)
        hm = round(float(r["hfce"]) / h0 * 100.0, 1)
        gm = round(float(r["gdp"]) / g0 * 100.0, 1)
        obs_idx_survey.append({"date": yr, "value": sm})
        obs_idx_hfce.append({"date": yr, "value": hm})
        obs_idx_gdp.append({"date": yr, "value": gm})
        na_survey_table.append({
            "year": int(r["year"]),
            "surveyMeanPPP2021": round(float(r["mean"]), 2),
            "surveyMedianPPP2021": round(float(r["median"]), 2),
            "hfceConst2015USD": round(float(r["hfce"]), 1),
            "gdpConst2015USD": round(float(r["gdp"]), 1),
            "surveyIndex1977": sm,
            "hfceIndex1977": hm,
            "gdpIndex1977": gm,
            "gini": round(float(r["gini"]) * 100.0, 2),
            "top10SharePct": round(float(r["decile10"]) * 100.0, 2),
            "bottom10SharePct": round(float(r["decile1"]) * 100.0, 2),
        })

    write_artifact(
        "poverty-debate.pov26.idx_survey_mean_1977.IN.json",
        make_series("pov26.idx_survey_mean_1977.IN", "Real survey mean per-capita consumption index (1977 = 100)", "index (1977 = 100)", obs_idx_survey, "WB_PIP_SURVEY_MEAN_IDX1977", source_url=PIP_URL, frequency="irregular"),
        catalog_entries,
    )
    write_artifact(
        "poverty-debate.pov26.idx_na_hfce_1977.IN.json",
        make_series("pov26.idx_na_hfce_1977.IN", "Real National Accounts HFCE per-capita index (1977 = 100)", "index (1977 = 100)", obs_idx_hfce, "WB_PIP_NA_HFCE_IDX1977", source_url=PIP_URL, frequency="irregular"),
        catalog_entries,
    )
    write_artifact(
        "poverty-debate.pov26.idx_gdp_pcap_1977.IN.json",
        make_series("pov26.idx_gdp_pcap_1977.IN", "Real GDP per-capita index (1977 = 100)", "index (1977 = 100)", obs_idx_gdp, "WB_PIP_GDP_PCAP_IDX1977", source_url=PIP_URL, frequency="irregular"),
        catalog_entries,
    )

    # --- CHART 9 & CHART 10: Chapter 4 Jobs, Employment Rates, Weekly Hours, Education, Self-Employment, and Agriculture ---
    f4_5a = pd.read_stata(RAW_DIR / "DataFig4_5a.dta")
    f4_5a_ind = f4_5a[f4_5a["code"] == "IND"]
    f4d_1b = pd.read_stata(RAW_DIR / "DataFig4D_1b.dta")
    f4d_1b_ind = f4d_1b[f4d_1b["code"] == "IND"]
    f4d_1c = pd.read_stata(RAW_DIR / "DataFig4D_1c.dta")
    f4d_1c_ind = f4d_1c[f4d_1c["code"] == "IND"].iloc[0]
    f4d_2b = pd.read_stata(RAW_DIR / "DataFig4D_2b.dta")
    f4d_2b_ind = f4d_2b[f4d_2b["code"] == "IND"]
    f4d_2c = pd.read_stata(RAW_DIR / "DataFig4D_2c.dta")
    f4d_2c_ind = f4d_2c[f4d_2c["code"] == "IND"].iloc[0]
    f4d_3b = pd.read_stata(RAW_DIR / "DataFig4D_3b.dta")
    f4d_3b_ind = f4d_3b[f4d_3b["code"] == "IND"]
    f4d_3c = pd.read_stata(RAW_DIR / "DataFig4D_3c.dta")
    f4d_3c_ind = f4d_3c[f4d_3c["code"] == "IND"].iloc[0]
    fb4_1 = pd.read_stata(RAW_DIR / "DataFigB4_1_1.dta")
    fb4_1_ind = fb4_1[fb4_1["code"] == "IND"]

    emp_poor_03 = round(float(f4_5a_ind[f4_5a_ind["level"] == 1]["lstatus_emp2003"].iloc[0]), 2)
    emp_poor_24 = round(float(f4_5a_ind[f4_5a_ind["level"] == 1]["lstatus_emp2024"].iloc[0]), 2)
    emp_nonpoor_03 = round(float(f4_5a_ind[f4_5a_ind["level"] == 0]["lstatus_emp2003"].iloc[0]), 2)
    emp_nonpoor_24 = round(float(f4_5a_ind[f4_5a_ind["level"] == 0]["lstatus_emp2024"].iloc[0]), 2)

    lowed_poor_03 = round((1.0 - float(f4d_1b_ind[f4d_1b_ind["level"] == 1]["educat4_342003"].iloc[0])) * 100.0, 2)
    lowed_poor_24 = round((1.0 - float(f4d_1b_ind[f4d_1b_ind["level"] == 1]["educat4_342024"].iloc[0])) * 100.0, 2)
    lowed_nonpoor_03 = round((1.0 - float(f4d_1b_ind[f4d_1b_ind["level"] == 0]["educat4_342003"].iloc[0])) * 100.0, 2)
    lowed_nonpoor_24 = round((1.0 - float(f4d_1b_ind[f4d_1b_ind["level"] == 0]["educat4_342024"].iloc[0])) * 100.0, 2)

    # Chart 9: Dumbbell of 2003 vs 2024 changes in employment rate and education gap by poverty status (<$8.30 poor vs >=$8.30 non-poor)
    jobs_shift_rows = [
        {"metric": "Working-age adults (15-64) employed: Poor (<$8.30/day)", "y2003": emp_poor_03, "y2024": emp_poor_24},
        {"metric": "Working-age adults (15-64) employed: Non-poor (>=$8.30/day)", "y2003": emp_nonpoor_03, "y2024": emp_nonpoor_24},
        {"metric": "Workers lacking secondary education: Poor (<$8.30/day)", "y2003": lowed_poor_03, "y2024": lowed_poor_24},
        {"metric": "Workers lacking secondary education: Non-poor (>=$8.30/day)", "y2003": lowed_nonpoor_03, "y2024": lowed_nonpoor_24},
    ]
    write_artifact(
        "poverty-debate.pov26.jobs_shift_2003_2024.IN.json",
        make_table(
            "pov26.jobs_shift_2003_2024.IN",
            "Employment rate and share of workers without secondary education in India by poverty status, 2003 vs 2024 (%)",
            "% of group",
            jobs_shift_rows,
            "WB_3PR_CH4_FIG4_5A_AND_4D_1B",
        ),
        catalog_entries,
    )

    # Chart 10: Structural profile of poor vs non-poor workers in 2024 (groupedTable)
    self_poor = round(float(f4d_2b_ind[f4d_2b_ind["level"] == 1]["empstat_23452024"].iloc[0]), 2)
    self_nonpoor = round(float(f4d_2b_ind[f4d_2b_ind["level"] == 0]["empstat_23452024"].iloc[0]), 2)
    ag_poor = round(float(f4d_3b_ind[f4d_3b_ind["level"] == 1]["industrycat4_12024"].iloc[0]), 2)
    ag_nonpoor = round(float(f4d_3b_ind[f4d_3b_ind["level"] == 0]["industrycat4_12024"].iloc[0]), 2)
    hrs_paid_poor = round(float(fb4_1_ind[fb4_1_ind["empstat"] == "Paid Employee"]["whours1"].iloc[0]), 2)
    hrs_paid_nonpoor = round(float(fb4_1_ind[fb4_1_ind["empstat"] == "Paid Employee"]["whours0"].iloc[0]), 2)
    hrs_self_poor = round(float(fb4_1_ind[fb4_1_ind["empstat"] == "Non-Paid Employee"]["whours1"].iloc[0]), 2)
    hrs_self_nonpoor = round(float(fb4_1_ind[fb4_1_ind["empstat"] == "Non-Paid Employee"]["whours0"].iloc[0]), 2)

    worker_profile_rows = [
        {"dimension": "Employed in self-employment (% of workers)", "poor": self_poor, "nonpoor": self_nonpoor},
        {"dimension": "Employed in agriculture (% of workers)", "poor": ag_poor, "nonpoor": ag_nonpoor},
        {"dimension": "Working-age adults (15-64) in employment (%)", "poor": emp_poor_24, "nonpoor": emp_nonpoor_24},
        {"dimension": "Workers without secondary education (%)", "poor": lowed_poor_24, "nonpoor": lowed_nonpoor_24},
        {"dimension": "Weekly hours worked in paid jobs (hours/week)", "poor": hrs_paid_poor, "nonpoor": hrs_paid_nonpoor},
        {"dimension": "Weekly hours worked in self/unpaid work (hours/week)", "poor": hrs_self_poor, "nonpoor": hrs_self_nonpoor},
    ]
    write_artifact(
        "poverty-debate.pov26.worker_structural_trap_2024.IN.json",
        make_table(
            "pov26.worker_structural_trap_2024.IN",
            "Weekly hours of employed Indians by $3/day household poverty status, 2024",
            "hours/week",
            worker_profile_rows[-2:],
            "WB_3PR_CH4_FIG4D_2B_3B_B4_1",
        ),
        catalog_entries,
    )

    # --- CHART 11: Chapter 4 Counterfactual Poverty Simulation for India (groupedTable: DataFig4C_123.dta) ---
    f4c = pd.read_stata(RAW_DIR / "DataFig4C_123.dta")
    f4c_ind = f4c[f4c["code"] == "IND"].iloc[0]
    cf_rows = [
        {
            "measure": "Headcount below $8.30/day (UMIC line, %)",
            "baseline2024": round(float(f4c_ind["poor830"]), 2),
            "afterJobsClosing": round(float(f4c_ind["poor_new830"]), 2),
            "reduction_pp": round(float(f4c_ind["poor830"]) - float(f4c_ind["poor_new830"]), 2),
        },
        {
            "measure": "Poverty gap at $8.30/day (% of line)",
            "baseline2024": round(float(f4c_ind["gap1_830"]), 2),
            "afterJobsClosing": round(float(f4c_ind["gap1_new_830"]), 2),
            "reduction_pp": round(float(f4c_ind["gap1_830"]) - float(f4c_ind["gap1_new_830"]), 2),
        },
        {
            "measure": "Headcount below $3.00/day (Extreme line, %)",
            "baseline2024": round(float(f4c_ind["poor300"]), 2),
            "afterJobsClosing": round(float(f4c_ind["poor_new300"]), 2),
            "reduction_pp": round(float(f4c_ind["poor300"]) - float(f4c_ind["poor_new300"]), 2),
        },
        {
            "measure": "Poverty gap at $3.00/day (% of line)",
            "baseline2024": round(float(f4c_ind["gap1_300"]), 2),
            "afterJobsClosing": round(float(f4c_ind["gap1_new_300"]), 2),
            "reduction_pp": round(float(f4c_ind["gap1_300"]) - float(f4c_ind["gap1_new_300"]), 2),
        },
    ]
    write_artifact(
        "poverty-debate.pov26.jobs_counterfactual_2024.IN.json",
        make_table(
            "pov26.jobs_counterfactual_2024.IN",
            "World Bank 2026 counterfactual simulation: Indian poverty before and after closing the employment and worker earnings gaps (%)",
            "% of population / line",
            cf_rows,
            "WB_3PR_CH4_DATAFIG4C_123_IND",
        ),
        catalog_entries,
    )

    # --- CHART 12: Cash Poverty vs Multidimensional Capability & Health-Shock Deprivation (tableBars) ---
    mpm_df = pd.read_excel(RAW_DIR / "MPM_AM26.xlsx", sheet_name="data")
    mpm_ind = mpm_df[mpm_df["Country code"] == "IND"].iloc[0]

    def latest_health(code):
        rows = json.loads((RAW_DIR / f"{code}.json").read_text())[1]
        return float(next(r["value"] for r in rows if r["value"] is not None))

    cap_rows = [
        {"label": "Children under 5 stunted (low height-for-age, NFHS-5)", "value": 35.5},
        {"label": "Children under 5 underweight (NFHS-5)", "value": 32.1},
        {"label": "Facing financial hardship from out-of-pocket health spending (WB UHC)", "value": latest_health("SH_UHC_FH40")},
        {"label": "Deprived of limited-standard sanitation (WB MPM, HCES 2022)", "value": round(float(mpm_ind["Sanitation (%)"]) * 100.0, 2)},
        {"label": "Impoverishing out-of-pocket health spending (WB UHC)", "value": latest_health("SH_UHC_FH40_IMPOV")},
        {"label": "World Bank Multidimensional Poverty Measure headcount (MPM, HCES 2022)", "value": round(float(mpm_ind["Multidimensional poverty headcount ratio (%)"]) * 100.0, 2)},
        {"label": "Societal poverty rate at $4.27/day societal line (PIP, HCES 2023)", "value": round(float(pip2_ind[pip2_ind["year"] == 2023].iloc[0]["spr"]) * 100, 2)},
        {"label": "Lower-middle-income monetary poverty at $4.20/day (PIP, HCES 2023)", "value": p21_420[2023]},
        {"label": "No adult in household completed primary schooling (WB MPM, HCES 2022)", "value": round(float(mpm_ind["Educational attainment (%)"]) * 100.0, 2)},
        {"label": "Deprived of limited-standard drinking water (WB MPM, HCES 2022)", "value": round(float(mpm_ind["Drinking water (%)"]) * 100.0, 2)},
        {"label": "Monetary extreme poverty at $3.00/day (WB MPM / PIP, HCES 2022)", "value": round(float(mpm_ind["Monetary (%)"]) * 100.0, 2)},
        {"label": "Monetary extreme poverty at $3.00/day (PIP, HCES 2023)", "value": p21_300[2023]},
        {"label": "Deprived of electricity (WB MPM, HCES 2022)", "value": round(float(mpm_ind["Electricity (%)"]) * 100.0, 2)},
    ]
    write_artifact(
        "poverty-debate.pov26.monetary_vs_capability_deprivation.IN.json",
        make_table(
            "pov26.monetary_vs_capability_deprivation.IN",
            "Monetary poverty headcounts beside multidimensional, nutritional, and out-of-pocket health deprivations in India (% of population)",
            "% of population",
            cap_rows,
            "WB_3PR_MPM_AM26_AND_UHC_NFHS",
        ),
        catalog_entries,
    )

    # --- CHART 13: India's Share of the Global Poor & Global Prosperity Gap across Thresholds (groupedTable from Ch1 Fig 6 & Ch2 Fig 10) ---
    xl1 = pd.ExcelFile(RAW_DIR / "chapter1.xlsx")
    f6_300 = xl1.parse("fig6 3.00")
    f6_420 = xl1.parse("fig6 4.20")
    f6_830 = xl1.parse("fig6 8.30")
    ind_f6_300 = f6_300[f6_300["Country Name"] == "India"].iloc[0]
    ind_f6_420 = f6_420[f6_420["Country Name"] == "India"].iloc[0]
    ind_f6_830 = f6_830[f6_830["Country Name"] == "India"].iloc[0]

    xl2 = pd.ExcelFile(RAW_DIR / "chapter2.xlsx")
    f10_26 = xl2.parse("fig10_2026")
    ind_f10_26 = f10_26[f10_26["country/economy code"] == "IND"].iloc[0]

    global_share_rows = [
        {
            "metric": "Global extreme poor below $3.00/day (2024)",
            "india_millions": round(float(ind_f6_300.iloc[2]), 2),
            "india_global_share_pct": round(float(ind_f6_300["Share (%)"]), 2),
            "india_pop_share_pct": round(float(ind_f10_26["Country population share of global population"]) * 100.0, 2),
        },
        {
            "metric": "Global poor below $4.20/day LMIC line (2024)",
            "india_millions": round(float(ind_f6_420.iloc[2]), 2),
            "india_global_share_pct": round(float(ind_f6_420["Share (%)"]), 2),
            "india_pop_share_pct": round(float(ind_f10_26["Country population share of global population"]) * 100.0, 2),
        },
        {
            "metric": "Global poor below $8.30/day UMIC line (2024)",
            "india_millions": round(float(ind_f6_830.iloc[2]), 2),
            "india_global_share_pct": round(float(ind_f6_830["Share (%)"]), 2),
            "india_pop_share_pct": round(float(ind_f10_26["Country population share of global population"]) * 100.0, 2),
        },
        {
            "metric": "Global Prosperity Gap shortfall from $28/day (2026)",
            "india_millions": round(float(fgt_300[fgt_300["year"] == 2026].iloc[0]["pop"]), 2),
            "india_global_share_pct": round(float(ind_f10_26["Country contribution to Global Prosperity Gap"]) * 100.0, 2),
            "india_pop_share_pct": round(float(ind_f10_26["Country population share of global population"]) * 100.0, 2),
        },
    ]
    write_artifact(
        "poverty-debate.pov26.global_poverty_footprint.IN.json",
        make_table(
            "pov26.global_poverty_footprint.IN",
            "India's share of the world's poor across poverty lines and contribution to the Global Prosperity Gap vs share of world population (%)",
            "% of global total",
            global_share_rows,
            "WB_3PR_CH1_FIG6_AND_CH2_FIG10",
        ),
        catalog_entries,
    )

    # Write catalog manifest
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(stable_json(catalog_entries), encoding="utf-8")

    # Populate detailed summary in audit
    fgt_by_yr = {}
    for yr in [1990, 2004, 2011, 2022, 2023, 2024, 2025, 2026, 2030]:
        r3 = fgt_300[fgt_300["year"] == yr].iloc[0]
        r4 = fgt_420[fgt_420["year"] == yr].iloc[0]
        r8 = fgt_830[fgt_830["year"] == yr].iloc[0]
        fgt_by_yr[yr] = {
            "hc300": round(float(r3["fgt0"]), 2),
            "hc420": round(float(r4["fgt0"]), 2),
            "hc830": round(float(r8["fgt0"]), 2),
            "pop300m": round(float(r3["poorpop"]), 2),
            "pop420m": round(float(r4["poorpop"]), 2),
            "pop830m": round(float(r8["poorpop"]), 2),
            "popm": round(float(r3["pop"]), 2),
        }

    audit["summary"] = {
        "linedUpFGT": fgt_by_yr,
        "surveyPIP": na_survey_table,
        "bunchingShares": bunch_stats,
        "paradeLadder": parade_rows,
        "pppParadox": ppp_paradox_rows,
        "stateTopBottom": {
            "highestPG": state_table_meta[:5],
            "lowestPG": state_table_meta[-5:],
        },
        "jobsShift2003_2024": jobs_shift_rows,
        "workerProfile2024": worker_profile_rows,
        "jobsCounterfactual2024": cf_rows,
        "workerWelfareReturns": {
            "noSecondaryUSD": round(float(f4d_1c_ind["mu_work2021_edusec0"]), 2),
            "withSecondaryUSD": round(float(f4d_1c_ind["mu_work2021_edusec1"]), 2),
            "wageWorkUSD": round(float(f4d_2c_ind["mu_work2021_wage"]), 2),
            "selfEmployedUSD": round(float(f4d_2c_ind["mu_work2021_self"]), 2),
            "nonAgUSD": round(float(f4d_3c_ind["mu_work2021_nonag"]), 2),
            "agUSD": round(float(f4d_3c_ind["mu_work2021_ag"]), 2),
        },
        "globalFootprint": global_share_rows,
        "capabilityRows": cap_rows,
    }

    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    (AUDIT_DIR / "poverty-source-audit.json").write_text(stable_json(audit), encoding="utf-8")
    print("Built", len(catalog_entries), "artifacts for q.econ.poverty_debate.")
    print(json.dumps(audit["summary"], indent=2))


if __name__ == "__main__":
    main()
