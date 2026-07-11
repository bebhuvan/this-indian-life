#!/usr/bin/env python3
"""Derive chart artifacts for q.states.demographic_finances.

Inputs:
  data/snapshots/estates/estates.parsed.json        (fiscal, from ingest-estates.py)
  data/snapshots/estates/demographics.mohfw2020.json (demographic, transcribed from RBI PDF)
  data/series/energy.IN.state.carbon_intensity_2024.json (reused India-state SVG paths)

Outputs: data/series/states.*.json

All fiscal cross-state comparisons use INTERNAL SHARES (computed within e-STATES),
which are unit-free and comparable across states, and match how the RBI report
presents its own grouped tables. The latest full-actual fiscal year is 2023-24
(Account); 2024-25 is Revised and 2025-26 is Budget Estimate, so maps/bars use
2023-24 and time series end where actuals do.
"""

import json
import os
import re

OUTDIR = "data/series"
PARSED = "data/snapshots/estates/estates.parsed.json"
DEMOG = "data/snapshots/estates/demographics.mohfw2020.json"
PATHS_SRC = "data/series/energy.IN.state.carbon_intensity_2024.json"

SOURCE_URL = ("https://www.rbi.org.in/Scripts/AnnualPublications.aspx"
              "?head=State+Finances+%3A+A+Study+of+Budgets")
DEMOG_SRC_URL = SOURCE_URL
FETCHED = "2026-06-15T00:00:00Z"
VIEWBOX = "0 0 740 820"
LATEST_ACTUAL = "2023-2024"  # latest Account year in e-STATES
END_YEAR = 2023  # cap plotted time series here: 2024-25 is RE, 2025-26 is BE (estimates)

# Harmonise to the canonical (SVG-path) state names.
CANON = {"NCT Delhi": "Delhi", "Jammu & Kashmir": "Jammu and Kashmir"}


def canon(name):
    return CANON.get(name, name)


def slug(name):
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def fy_start(fy):
    """'1990-1991' -> '1990'."""
    return str(fy).split("-")[0]


# ---- artifact builders -----------------------------------------------------

def series_artifact(indicator_id, title, unit, observations, *,
                    source_indicator="RBI e-STATES", source_url=SOURCE_URL,
                    geography=None, frequency="annual", metadata=None):
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "rbi-estates",
        "sourceIndicatorId": source_indicator,
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": frequency,
        "geography": geography or {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED,
        "observations": observations,
        "metadata": metadata or {},
    }


def table_artifact(indicator_id, title, unit, rows, *,
                   source_indicator="RBI e-STATES", source_url=SOURCE_URL,
                   metadata=None):
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "rbi-estates",
        "sourceIndicatorId": source_indicator,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": ["label", "value"],
        "fetchedAt": FETCHED,
        "rows": rows,
        "metadata": metadata or {},
    }


def choropleth_artifact(indicator_id, title, unit, value_by_state, paths, *,
                        source_indicator="MoHFW 2020 / RBI staff estimates",
                        source_url=DEMOG_SRC_URL, vmin=None, vmax=None,
                        metadata=None):
    regions = []
    vals = [v for v in value_by_state.values() if v is not None]
    for name, path in sorted(paths.items()):
        regions.append({"name": name, "value": value_by_state.get(name), "path": path})
    return {
        "schemaVersion": 1,
        "artifactType": "choropleth",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "rbi-estates",
        "sourceIndicatorId": source_indicator,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
        "fetchedAt": FETCHED,
        "viewBox": VIEWBOX,
        "min": vmin if vmin is not None else (min(vals) if vals else 0),
        "max": vmax if vmax is not None else (max(vals) if vals else 1),
        "regions": regions,
        "metadata": metadata or {},
    }


def scenario_artifact(indicator_id, title, unit, scenarios_data, paths, *,
                      source_indicator="MoHFW 2020 / RBI staff estimates",
                      source_url=DEMOG_SRC_URL, vmin=0, vmax=25):
    """scenarios_data: list of (key, label, {state: value})."""
    scenarios = []
    for key, label, vmap in scenarios_data:
        regions = [{"name": n, "value": vmap.get(n), "path": p}
                   for n, p in sorted(paths.items())]
        scenarios.append({"key": key, "label": label, "regions": regions})
    return {
        "schemaVersion": 1,
        "artifactType": "choropleth",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "rbi-estates",
        "sourceIndicatorId": source_indicator,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
        "fetchedAt": FETCHED,
        "viewBox": VIEWBOX,
        "min": vmin,
        "max": vmax,
        "scenarios": scenarios,
        "metadata": {},
    }


def write(artifact):
    path = os.path.join(OUTDIR, f"{artifact['indicatorId']}.json")
    with open(path, "w") as f:
        json.dump(artifact, f, indent=2)
        f.write("\n")
    return path


# ---- load inputs -----------------------------------------------------------

def main():
    fiscal = json.load(open(PARSED))["states"]
    demog = json.load(open(DEMOG))
    paths = {r["name"]: r["path"] for r in json.load(open(PATHS_SRC))["regions"]}

    years = demog["_meta"]["years"]  # [2011,2016,2021,2026,2031,2036]
    share60 = demog["share_60plus_pct"]
    oadr = demog["old_age_dependency_ratio"]
    groups = {g: [canon(s) for s in demog["groups_2026"][g]]
              for g in ("youthful", "intermediate", "ageing")}
    major = [canon(s) for s in share60 if s != "India"]

    # raw e-STATES name -> canonical, for the states we care about
    raw_by_canon = {}
    for raw in fiscal:
        c = canon(raw)
        if c in major:
            raw_by_canon[c] = raw

    written = []

    # =====================================================================
    # DEMOGRAPHIC ARTIFACTS
    # =====================================================================
    GROUP_LABEL = {"youthful": "Youthful states", "intermediate": "Intermediate states",
                   "ageing": "Ageing states"}

    def s60(state, year):
        arr = share60.get(state)
        return arr[years.index(year)] if arr else None

    def oadr_v(state, year):
        arr = oadr.get(state)
        return arr[years.index(year)] if arr else None

    # 1. Hero scenarioMaps: 60+ share in 2011, 2026, 2036
    scen = []
    for yr in (2011, 2026, 2036):
        vmap = {canon(s): s60(s, yr) for s in share60 if s != "India"}
        scen.append((str(yr), str(yr), vmap))
    written.append(write(scenario_artifact(
        "states.demog.share60_scenario",
        "India is ageing, but not all at once",
        "% of population aged 60+", scen, paths, vmin=6, vmax=23)))

    # 2. Choropleth: old-age dependency ratio, 2026
    oadr_2026 = {canon(s): oadr_v(s, 2026) for s in oadr if s != "India"}
    written.append(write(choropleth_artifact(
        "states.demog.oadr_2026",
        "How many elderly each 100 workers support, by state",
        "elderly (60+) per 100 working-age (15-59)", oadr_2026, paths,
        vmin=14, vmax=31, metadata={"divergeAt": 17.6})))

    # 3. tableBars: rise in 60+ share, 2011 -> 2036 (who ages most)
    rows = []
    for s in share60:
        if s == "India":
            continue
        rows.append({"label": s, "value": round(s60(s, 2036) - s60(s, 2011), 1)})
    rows.sort(key=lambda r: r["value"], reverse=True)
    written.append(write(table_artifact(
        "states.demog.share60_rise_2011_2036",
        "Where the grey wave rises fastest",
        "percentage-point rise in 60+ share, 2011 to 2036", rows)))

    # 4. Per-state 60+ trajectories for a multiLine (Kerala vs Bihar vs India)
    for s in ("Kerala", "Bihar", "India"):
        obs = [{"date": str(y), "value": (share60[s][i])} for i, y in enumerate(years)]
        written.append(write(series_artifact(
            f"states.demog.share60.{slug(canon(s))}",
            f"60+ population share: {s}", "% of population aged 60+", obs,
            source_indicator="MoHFW 2020 (Technical Group on Population Projections)",
            source_url=DEMOG_SRC_URL)))

    # 13. India old-age dependency arc to 2036 (single line)
    obs = [{"date": str(y), "value": oadr["India"][i]} for i, y in enumerate(years)]
    written.append(write(series_artifact(
        "states.demog.oadr.india",
        "India's old-age dependency ratio, 2011 to 2036",
        "elderly per 100 working-age", obs,
        source_indicator="MoHFW 2020 / RBI staff estimates", source_url=DEMOG_SRC_URL)))

    # =====================================================================
    # FISCAL ARTIFACTS (internal shares)
    # =====================================================================
    def head_year_map(raw_state, head):
        d = fiscal[raw_state].get(head, {})
        return {fy_start(fy): cell["value"] for fy, cell in d.items()}

    def ratio_series(raw_state, num_heads, den_heads, start_year=1990):
        """100 * sum(num)/sum(den) by year, for one state."""
        nums = [head_year_map(raw_state, h) for h in num_heads]
        dens = [head_year_map(raw_state, h) for h in den_heads]
        out = {}
        all_years = set()
        for m in nums + dens:
            all_years |= set(m.keys())
        for y in sorted(all_years):
            if int(y) < start_year or int(y) > END_YEAR:
                continue
            den = sum(m.get(y, 0) for m in dens)
            num = sum(m.get(y, 0) for m in nums)
            if den and all(y in m for m in dens):
                out[y] = round(100 * num / den, 2)
        return out

    def group_ratio_series(group_states, num_heads, den_heads, start_year=2000):
        """Aggregate share = 100 * sum_states(num) / sum_states(den) per year."""
        out = {}
        all_years = set()
        per_state = []
        for c in group_states:
            raw = raw_by_canon.get(c)
            if not raw:
                continue
            nums = [head_year_map(raw, h) for h in num_heads]
            dens = [head_year_map(raw, h) for h in den_heads]
            per_state.append((nums, dens))
            for m in nums + dens:
                all_years |= set(m.keys())
        for y in sorted(all_years):
            if int(y) < start_year or int(y) > END_YEAR:
                continue
            num = den = 0.0
            for nums, dens in per_state:
                if all(y in m for m in dens) and all(y in m for m in nums):
                    den += sum(m[y] for m in dens)
                    num += sum(m[y] for m in nums)
            if den:
                out[y] = round(100 * num / den, 2)
        return out

    # metric definitions: (id_suffix, title, unit, num_heads, den_heads)
    METRICS = {
        "own_tax_share": ("own-tax revenue as % of total revenue", "% of total revenue",
                          ["own_tax"], ["total_revenue"]),
        "central_transfer_share": ("central transfers as % of total revenue", "% of total revenue",
                                   ["central_tax_share", "central_grants"], ["total_revenue"]),
        "committed_share": ("committed spend (interest + pensions) as % of revenue spending",
                            "% of revenue expenditure",
                            ["interest", "pensions"], ["total_rev_exp"]),
        "education_share": ("education as % of revenue spending", "% of revenue expenditure",
                            ["education"], ["total_rev_exp"]),
        "health_share": ("health as % of revenue spending", "% of revenue expenditure",
                         ["health"], ["total_rev_exp"]),
        "pension_share": ("pensions as % of revenue spending", "% of revenue expenditure",
                          ["pensions"], ["total_rev_exp"]),
    }

    # Group multiLine series (3 per metric) for the metrics that get a grouped chart
    GROUPED = ["own_tax_share", "central_transfer_share", "committed_share",
               "education_share", "health_share"]
    for metric in GROUPED:
        desc, unit, num_h, den_h = METRICS[metric]
        for g in ("youthful", "intermediate", "ageing"):
            ser = group_ratio_series(groups[g], num_h, den_h)
            obs = [{"date": y, "value": v} for y, v in sorted(ser.items())]
            written.append(write(series_artifact(
                f"states.fiscal.{metric}.{g}",
                f"{GROUP_LABEL[g]}: {desc}", unit, obs,
                source_indicator=f"RBI e-STATES ({GROUP_LABEL[g]} aggregate)")))

    # Per-state own-tax-share series (for sparkGrid + rankedChange) over major states
    for c in major:
        raw = raw_by_canon.get(c)
        if not raw:
            continue
        ser = ratio_series(raw, ["own_tax"], ["total_revenue"], start_year=1990)
        obs = [{"date": y, "value": v} for y, v in sorted(ser.items())]
        if len(obs) >= 2:
            written.append(write(series_artifact(
                f"states.fiscal.own_tax_share.st.{slug(c)}",
                f"Own-tax revenue as % of total revenue: {c}", "% of total revenue", obs)))

    # Latest-actual choropleths + tableBars (2023-24)
    ly = fy_start(LATEST_ACTUAL)

    def latest_ratio(raw, num_heads, den_heads):
        nums = sum(head_year_map(raw, h).get(ly, 0) for h in num_heads)
        dens = sum(head_year_map(raw, h).get(ly, 0) for h in den_heads)
        return round(100 * nums / dens, 1) if dens else None

    own_tax_2024 = {}
    committed_2024 = {}
    pension_rows = []
    for c in major:
        raw = raw_by_canon.get(c)
        if not raw:
            continue
        own_tax_2024[c] = latest_ratio(raw, ["own_tax"], ["total_revenue"])
        committed_2024[c] = latest_ratio(raw, ["interest", "pensions"], ["total_rev_exp"])
        pv = latest_ratio(raw, ["pensions"], ["total_rev_exp"])
        if pv is not None:
            pension_rows.append({"label": c, "value": pv})

    written.append(write(choropleth_artifact(
        "states.fiscal.own_tax_share_2024",
        "How much each state raises from its own taxes",
        "% of total revenue (2023-24)", own_tax_2024, paths,
        source_indicator="RBI e-STATES (Appendix-1)", source_url=SOURCE_URL)))

    written.append(write(choropleth_artifact(
        "states.fiscal.committed_share_2024",
        "How much revenue is pre-spent on interest and pensions",
        "% of revenue expenditure (2023-24)", committed_2024, paths,
        source_indicator="RBI e-STATES (Appendix-2)", source_url=SOURCE_URL)))

    pension_rows.sort(key=lambda r: r["value"], reverse=True)
    written.append(write(table_artifact(
        "states.fiscal.pension_share_2024",
        "Where pensions eat the biggest share of the budget",
        "% of revenue expenditure (2023-24)", pension_rows,
        source_indicator="RBI e-STATES (Appendix-2)", source_url=SOURCE_URL)))

    print(f"wrote {len(written)} artifacts to {OUTDIR}/")
    # sanity prints
    print("  major states with fiscal data:", len(raw_by_canon), "/", len(major))
    missing = [c for c in major if c not in raw_by_canon]
    if missing:
        print("  (no fiscal match):", missing)
    print(f"  Kerala own-tax {ly}: {own_tax_2024.get('Kerala')}  Bihar: {own_tax_2024.get('Bihar')}")
    print(f"  Kerala committed {ly}: {committed_2024.get('Kerala')}  Bihar: {committed_2024.get('Bihar')}")


if __name__ == "__main__":
    main()
