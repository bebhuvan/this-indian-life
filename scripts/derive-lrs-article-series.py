#!/usr/bin/env python3
"""Build the cross-source and policy context used by the LRS article."""

from __future__ import annotations

import datetime as dt
import json
from collections import defaultdict
from pathlib import Path


OUT = Path("data/series")
FETCHED_AT = dt.datetime.now(dt.timezone.utc).isoformat()
RBI_SOURCE = "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=24281"
TOURISM_SOURCE = "https://data.tourism.gov.in/mrd/Uploads/tourism_data/India%20Tourism%20Data%20Compendium%202025_1.pdf"
POLICY_SOURCE = "https://www.rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=10192"
TCS_SOURCE = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1936105"
PURPOSES = [
    ("deposit", "Deposits"),
    ("property", "Property purchases"),
    ("investment", "Equity or debt investment"),
    ("gift", "Gifts"),
    ("donations", "Donations"),
    ("travel", "Travel"),
    ("relatives", "Maintenance of relatives"),
    ("medical", "Medical treatment"),
    ("studies", "Studies Abroad"),
    ("others", "Others"),
]


def read(path: str) -> dict:
    return json.loads(Path(path).read_text())


def series_artifact(indicator_id: str, title: str, observations: list[dict], source_url: str, metadata: dict) -> dict:
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "derived-rbi-lrs-context",
        "sourceIndicatorId": "RBI LRS Table 36 + Ministry of Tourism Table 3.1.1",
        "sourceUrl": source_url,
        "unit": "index (2016=100)",
        "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "metadata": metadata,
    }


def fiscal_label(date: str) -> str:
    end_year = int(date[:4])
    return f"FY{end_year - 1}-{str(end_year)[-2:]}"


def main() -> None:
    travel = read("data/series/rbi-lrs.IN.extfin.lrs.travel.monthly.json")
    departures = read("data/series/ministry-tourism.IN.tourism.outbound_departures.annual.json")

    travel_cy = defaultdict(float)
    for observation in travel["observations"]:
        year = int(observation["date"][:4])
        travel_cy[year] += float(observation["value"])
    departures_by_year = {int(observation["date"]): float(observation["value"]) for observation in departures["observations"]}

    years = list(range(2016, 2025))
    if not all(year in travel_cy and year in departures_by_year for year in years):
        raise ValueError("The 2016-2024 comparison window is not complete in both sources")
    travel_base = travel_cy[2016]
    departure_base = departures_by_year[2016]
    travel_index = [{"date": str(year), "value": round(travel_cy[year] / travel_base * 100, 6)} for year in years]
    departure_index = [{"date": str(year), "value": round(departures_by_year[year] / departure_base * 100, 6)} for year in years]

    common = {
        "inputs": ["extfin.lrs.travel.monthly", "tourism.outbound_departures.annual"],
        "method": "Sum monthly RBI Travel remittances by calendar year; index both that total and Indian-national departures to 2016=100 over the common 2016-2024 window.",
        "unit": "index (2016=100)",
        "rounding": "six decimal places in the artifact; human rounding in prose",
        "assumptions": "The two lines are contextual, not a per-trip identity. Departures count movements, not unique leisure travellers; RBI Travel includes multiple purposes and payment types.",
        "underlyingSourceUrls": [RBI_SOURCE, TOURISM_SOURCE],
    }
    artifacts = [
        (
            "derived-rbi-lrs.IN.extfin.lrs.travel_index_2016.json",
            series_artifact("extfin.lrs.travel_index_2016", "LRS Travel remittances, calendar-year index", travel_index, RBI_SOURCE, {**common, "measure": "RBI LRS Travel remittances"}),
        ),
        (
            "derived-rbi-lrs.IN.tourism.outbound_departures_index_2016.json",
            series_artifact("tourism.outbound_departures_index_2016", "Indian-national departures, calendar-year index", departure_index, TOURISM_SOURCE, {**common, "measure": "Indian-national departures"}),
        ),
    ]
    for filename, artifact in artifacts:
        (OUT / filename).write_text(json.dumps(artifact, indent=2) + "\n")
        print(f"wrote {filename}")

    # Compare the latest value of every top-level purpose with that purpose's
    # own maximum. This uses the entire complete fiscal-year history and avoids
    # assuming that FY2023-24 was the relevant peak for every category.
    peak_rows = []
    for key, label in PURPOSES:
        artifact = read(f"data/series/rbi-lrs.IN.extfin.lrs.{key}.fy.json")
        observations = artifact["observations"]
        if len(observations) != 17 or observations[-1]["date"] != "2026-03-31":
            raise ValueError(f"Unexpected complete fiscal-year coverage for {key}")
        peak = max(observations, key=lambda item: float(item["value"]))
        latest = observations[-1]
        latest_value = float(latest["value"])
        peak_value = float(peak["value"])
        peak_fy = fiscal_label(peak["date"])
        peak_rows.append({
            "label": f"{label} · peak {peak_fy}",
            "value": round(latest_value / peak_value * 100, 3),
            "purpose": label,
            "latestUSDBillion": round(latest_value, 9),
            "peakUSDBillion": round(peak_value, 9),
            "peakFiscalYear": peak_fy,
            "gapUSDBillion": round(latest_value - peak_value, 9),
        })
    peak_rows.sort(key=lambda row: row["value"])
    peak_table = {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": "extfin.lrs.purpose.latest_vs_own_peak",
        "title": "Latest LRS purpose value as a share of its own fiscal-year peak",
        "sourceId": "derived-rbi-lrs",
        "sourceIndicatorId": "RBI Bulletin Table 36, monthly purpose values aggregated to fiscal years",
        "sourceUrl": RBI_SOURCE,
        "unit": "% of each purpose's own peak",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "rows": peak_rows,
        "metadata": {
            "kind": "derived comparison",
            "inputs": [f"extfin.lrs.{key}.fy" for key, _ in PURPOSES],
            "method": "For each of the ten top-level purposes, find its maximum complete fiscal-year sum from FY2009-10 to FY2025-26 and divide the FY2025-26 value by that maximum.",
            "interpretation": "A value of 100 means the purpose is at its own series peak. Values below 100 show how far the latest fiscal year sits below that purpose-specific high-water mark.",
            "coverageRule": "Travel children are excluded because they are nested under Travel and have only two populated months.",
        },
    }
    peak_path = OUT / "derived-rbi-lrs.IN.extfin.lrs.purpose.latest_vs_own_peak.json"
    peak_path.write_text(json.dumps(peak_table, indent=2) + "\n")
    print(f"wrote {peak_path}")

    policy = {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": "extfin.lrs.limit_history",
        "title": "LRS limit revisions since the scheme began",
        "sourceId": "rbi-lrs-policy",
        "sourceIndicatorId": "RBI Master Direction on LRS, paragraph 2",
        "sourceUrl": POLICY_SOURCE,
        "unit": "US$ thousand per resident individual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "rows": [
            {"label": "Feb 2004", "value": 25},
            {"label": "Dec 2006", "value": 50},
            {"label": "May 2007", "value": 100},
            {"label": "Sep 2007", "value": 200},
            {"label": "Aug 2013", "value": 75},
            {"label": "Jun 2014", "value": 125},
            {"label": "May 2015", "value": 250},
        ],
        "metadata": {
            "kind": "regulatory limit",
            "method": "Transcribed from the revision table in RBI's Master Direction on LRS.",
            "assumptions": "The limit is per resident individual. It is a ceiling, not observed remittance behaviour. From May 26, 2015 several current-account facilities were also subsumed under LRS, creating a coverage break in the reported totals.",
        },
    }
    policy_path = OUT / "rbi-lrs-policy.IN.extfin.lrs.limit_history.json"
    policy_path.write_text(json.dumps(policy, indent=2) + "\n")
    print(f"wrote {policy_path}")

    tcs_event = {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": "extfin.lrs.tcs_oct_2023",
        "title": "October 2023 TCS change for LRS remittances",
        "sourceId": "finance-ministry-lrs-tcs",
        "sourceIndicatorId": "Ministry of Finance press release, June 28, 2023",
        "sourceUrl": TCS_SOURCE,
        "unit": "mixed",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "rows": [
            {
                "date": "2023-10-01",
                "purpose": "LRS purposes other than education or medical treatment",
                "thresholdInr": 700000,
                "rateBeforePercent": 5,
                "rateFromDatePercent": 20,
            },
            {
                "date": "2023-10-01",
                "purpose": "Education or medical treatment, other than education financed by specified loan",
                "thresholdInr": 700000,
                "rateBeforePercent": 5,
                "rateFromDatePercent": 5,
            },
        ],
        "metadata": {
            "kind": "policy event",
            "method": "Transcribed from the Finance Ministry's June 28, 2023 implementation table.",
            "interpretation": "TCS is tax collected at source and normally available as tax credit. It can create an upfront cash-flow cost, but it is not automatically the remitter's final tax liability.",
            "honestyRule": "The event date can be aligned with monthly LRS data, but the alignment does not identify a causal effect.",
        },
    }
    tcs_path = OUT / "finance-ministry.IN.extfin.lrs.tcs_oct_2023.json"
    tcs_path.write_text(json.dumps(tcs_event, indent=2) + "\n")
    print(f"wrote {tcs_path}")


if __name__ == "__main__":
    main()
