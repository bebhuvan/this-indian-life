#!/usr/bin/env python3
"""Read-only common-year comparison; no article artifacts are changed."""
import hashlib
import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "data/raw/wb-3pr-2026/Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta"
countries = ["IND", "BGD", "IDN", "VNM", "PAK"]
data = pd.read_stata(SOURCE)
data["stataObservation"] = data.index + 1
rows = []
for country in countries:
    for line in [3.0, 4.2, 8.3]:
        selected = data[data.code.eq(country) & data.year.eq(2024) & data.povertyline.eq(line)]
        assert len(selected) == 1
        r = selected.iloc[0]
        rows.append({"country": r.country, "code": country, "year": 2024, "povertyLine2021PPP": line,
                     "headcountPercent": float(r.fgt0), "estimationType": r.estimate_type,
                     "incomeGroupInRelease": r.incgroup, "stataObservation": int(r.stataObservation)})
out = {"source": str(SOURCE.relative_to(ROOT)), "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
       "release": "20260922_2021_01_02_PROD", "rows": rows,
       "interpretation": "India has lower $3 poverty than Bangladesh and Indonesia but higher $8.30 poverty in this common-year file.",
       "limits": ["A curated comparison, not a complete Asian ranking.",
                  "Income groups differ and should be labelled rather than treating every country as an income peer.",
                  "Survey and projected estimation bases differ; the table retains the source estimation flag.",
                  "This comparison does not identify policy effects or causes of the ranking."]}
(ROOT / "data/audits/poverty-debate/peer-threshold-comparison.json").write_text(json.dumps(out, indent=2) + "\n")
print("Compared five countries at three thresholds using 15 unique source observations.")
