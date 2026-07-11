#!/usr/bin/env python3
"""Promote NFHS health indicators from data/nfhs6/nfhs6_clean.json into
chartable series/table artifacts for q.health.overview.

The clean file (LlamaParse pass over the official NFHS-6 factsheets) stores
areas[state][indicator_no] = {urban, rural, total, nfhs5}. NFHS-5 (2019-21)
comparison values ride along, giving a two-point national trend.

Observation dates: NFHS-5 -> 2021-03-31 (fieldwork 2019-21),
NFHS-6 -> 2024-03-31 (fieldwork 2023-24).

Note: NFHS-6 dropped anaemia testing entirely - anaemia cannot come from this
source (use WHO/NFHS-5 with a vintage caveat instead).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLEAN = ROOT / "data/nfhs6/nfhs6_clean.json"
OUT_DIR = ROOT / "data/series"
FETCHED_AT = datetime.now(timezone.utc).isoformat()
SOURCE_URL = "https://www.nfhsiips.in/nfhsuser/index.php"
NFHS5_DATE, NFHS6_DATE = "2021-03-31", "2024-03-31"

# indicator_no -> (slug, title, unit)
NATIONAL = {
    "7": ("insurance_households", "Households with any member covered by health insurance/financing", "% of households"),
    "69": ("child_stunting", "Children under 5 who are stunted", "% of children under 5"),
    "70": ("child_wasting", "Children under 5 who are wasted", "% of children under 5"),
    "72": ("child_underweight", "Children under 5 who are underweight", "% of children under 5"),
    "73": ("child_overweight", "Children under 5 who are overweight", "% of children under 5"),
    "74": ("women_thin", "Women with below-normal BMI (under 18.5)", "% of women 15-49"),
    "75": ("men_thin", "Men with below-normal BMI (under 18.5)", "% of men 15-49"),
    "76": ("women_overweight", "Women who are overweight or obese (BMI 25+)", "% of women 15-49"),
    "77": ("men_overweight", "Men who are overweight or obese (BMI 25+)", "% of men 15-49"),
    "80": ("women_high_sugar", "Women with high blood sugar or on diabetes medication", "% of women 15+"),
    "83": ("men_high_sugar", "Men with high blood sugar or on diabetes medication", "% of men 15+"),
    "86": ("women_high_bp", "Women with elevated blood pressure or on BP medication", "% of women 15+"),
    "89": ("men_high_bp", "Men with elevated blood pressure or on BP medication", "% of men 15+"),
}

# state tables: indicator_no -> column name
STATE_TABLES = {
    "state_double_burden": {
        "title": "Stunted children vs overweight women, by state (NFHS-6)",
        "cols": {"69": "child_stunting_pct", "76": "women_overweight_pct", "74": "women_thin_pct"},
    },
    "state_high_sugar": {
        "title": "High blood sugar by state (NFHS-6)",
        "cols": {"80": "women_pct", "83": "men_pct"},
    },
    "state_insurance": {
        "title": "Household health-insurance coverage by state (NFHS-6 vs NFHS-5)",
        "cols": {"7": "covered_pct"},
        "nfhs5_cols": {"7": "covered_pct_nfhs5"},
    },
}


def main() -> None:
    data = json.loads(CLEAN.read_text(encoding="utf-8"))
    areas = data["areas"]
    india = areas["India"]
    written = 0

    base = {
        "schemaVersion": 1, "sourceId": "nfhs",
        "sourceUrl": SOURCE_URL,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "fetchedAt": FETCHED_AT,
    }

    for no, (slug, title, unit) in NATIONAL.items():
        vals = india.get(no) or {}
        observations = []
        if vals.get("nfhs5") is not None:
            observations.append({"date": NFHS5_DATE, "value": vals["nfhs5"]})
        if vals.get("total") is not None:
            observations.append({"date": NFHS6_DATE, "value": vals["total"]})
        if not observations:
            print(f"skip {slug}: no national values")
            continue
        artifact = {
            **base, "artifactType": "series",
            "indicatorId": f"health.nfhs.{slug}",
            "title": title,
            "sourceIndicatorId": f"NFHS factsheet indicator {no}",
            "unit": unit, "frequency": "irregular", "dimensions": [],
            "observations": observations,
            "metadata": {
                "source": "National Family Health Survey factsheets (NFHS-5 2019-21, NFHS-6 2023-24), IIPS/MoHFW",
                "rural_urban_nfhs6": {"rural": vals.get("rural"), "urban": vals.get("urban")},
            },
        }
        path = OUT_DIR / f"nfhs6.IN.health.{slug}.json"
        path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"{path.name}  health.nfhs.{slug}  ({len(observations)} obs)")
        written += 1

    for slug, spec in STATE_TABLES.items():
        rows = []
        for state, vals in areas.items():
            if state == "India":
                continue
            row = {"state": state}
            for no, col in spec["cols"].items():
                row[col] = (vals.get(no) or {}).get("total")
            for no, col in spec.get("nfhs5_cols", {}).items():
                row[col] = (vals.get(no) or {}).get("nfhs5")
            if any(v is not None for k, v in row.items() if k != "state"):
                rows.append(row)
        artifact = {
            **base, "artifactType": "table",
            "indicatorId": f"health.nfhs.{slug}",
            "title": spec["title"],
            "sourceIndicatorId": f"NFHS-6 factsheet indicators {','.join(spec['cols'])}",
            "unit": "%", "dimensions": ["state"], "rows": rows,
            "metadata": {"source": "NFHS-6 state factsheets (2023-24), IIPS/MoHFW"},
        }
        path = OUT_DIR / f"nfhs6.IN.health.{slug}.json"
        path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"{path.name}  health.nfhs.{slug}  ({len(rows)} states)")
        written += 1

    print(f"\nwrote {written} artifacts")


if __name__ == "__main__":
    main()
