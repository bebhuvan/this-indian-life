#!/usr/bin/env python3
"""The NSS health-round trend ladder, 1995-96 to 2025.

Values are hand-extracted from the official NSS reports (PDFs snapshotted under
data/snapshots/microdata-nada/api-files/), except the 2025 round, which is
Indica's own tabulation of the NSS 80th round unit-level CSVs (see
scripts/derive-nss80-health.py). Per-round provenance:

  1995-96  NSS 52nd rnd, Report 441, Table 4.20/4.21 (avg TOTAL expenditure per
           hospitalised treatment - the 52nd did not publish "medical only")
  2004     NSS 60th rnd, Report 507, Statement 34 (avg medical expenditure)
  2014     NSS 71st rnd, KI(71/25.0): costs Statement 3.9 (all-India only);
           public/private case shares Statement 3.7b (which itself tabulates
           1995-96, 2004 and 2014)
  2017-18  NSS 75th rnd, KI(75/25.0): costs Statement 3.15 (excl childbirth),
           case shares Statement 3.10, coverage Statement 3.14
  2025     NSS 80th rnd unit data (Jan-Dec 2025), Indica tabulation,
           excl childbirth, weights = mult/100

Comparability caveats (carried into metadata, must surface in prose):
  - 1995-96 figures are total (medical + other) expenditure per ailment; later
    rounds are medical expenditure per case. 75th/80th explicitly exclude
    childbirth; 60th/71st statements do not state an exclusion.
  - All values are CURRENT rupees - deflate or say so when charting.
  - Insurance coverage definitions widened over rounds (PMJAY from 2018).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data" / "series"
FETCHED_AT = datetime.now(timezone.utc).isoformat()
NADA = "https://microdata.gov.in/NADA/index.php/catalog"

ROUNDS = {  # survey-period end dates used as observation dates
    "1995-96": "1996-06-30",
    "2004": "2004-06-30",
    "2014": "2014-06-30",
    "2017-18": "2018-06-30",
    "2025": "2025-12-31",
}

# metric -> {round -> {sector -> value}}; sector in rural/urban/all
DATA = {
    "hosp_private_share": {
        "title": "Share of hospitalisation cases treated in private hospitals",
        "unit": "% of cases",
        "values": {
            "1995-96": {"rural": 56.2, "urban": 56.9},
            "2004": {"rural": 58.3, "urban": 61.8},
            "2014": {"rural": 58.1, "urban": 68.0},
            "2017-18": {"rural": 51.9, "urban": 61.4, "all": 55.3},
            "2025": {"rural": 57.9, "urban": 64.6, "all": 60.3},
        },
        "note": "1995-2014 from KI(71) Statement 3.7b (public/private only); "
                "2017-18 KI(75) Statement 3.10; 2025 Indica tabulation of 80th-round unit data "
                "(excl childbirth; charitable/NGO hospitals counted separately).",
    },
    "hosp_cost_public": {
        "title": "Average expenditure per hospitalisation case, government hospitals",
        "unit": "Rs. per case, current prices",
        "values": {
            "1995-96": {"rural": 2080, "urban": 2195},
            "2004": {"rural": 3238, "urban": 3877},
            "2014": {"all": 6120},
            "2017-18": {"rural": 4290, "urban": 4837, "all": 4452},
            "2025": {"rural": 7191, "urban": 6384, "all": 6937},
        },
        "note": "1995-96 is total expenditure per ailment (Report 441); later rounds medical "
                "expenditure per case. 75th/80th exclude childbirth.",
    },
    "hosp_cost_private": {
        "title": "Average expenditure per hospitalisation case, private hospitals",
        "unit": "Rs. per case, current prices",
        "values": {
            "1995-96": {"rural": 4300, "urban": 5344},
            "2004": {"rural": 7408, "urban": 11553},
            "2014": {"all": 25850},
            "2017-18": {"rural": 27347, "urban": 38822, "all": 31845},
            "2025": {"rural": 49509, "urban": 66983, "all": 56215},
        },
        "note": "Same definitions as hosp_cost_public.",
    },
    "hosp_cost_all": {
        "title": "Average expenditure per hospitalisation case, all hospitals",
        "unit": "Rs. per case, current prices",
        "values": {
            "1995-96": {"rural": 3202, "urban": 3921},
            "2004": {"rural": 5695, "urban": 8851},
            "2014": {"all": 18268},
            "2017-18": {"rural": 16676, "urban": 26475, "all": 20135},
            "2025": {"rural": 32718, "urban": 46784, "all": 37758},
        },
        "note": "Same definitions as hosp_cost_public; includes charitable/NGO hospitals.",
    },
    "insurance_covered": {
        "title": "Share of people covered by any health financing scheme",
        "unit": "% of persons",
        "values": {
            "2017-18": {"rural": 14.1, "urban": 19.1},
            "2025": {"rural": 47.4, "urban": 44.3, "all": 46.4},
        },
        "note": "2017-18 from KI(75) Statement 3.14 (100 minus 'not covered'); 2025 Indica "
                "tabulation (any scheme incl. PMJAY, state schemes, employer, private). Earlier "
                "rounds had no comparable question; coverage was negligible.",
    },
}


def main() -> None:
    written = 0
    for metric, spec in DATA.items():
        sectors = sorted({s for vals in spec["values"].values() for s in vals})
        for sector in sectors:
            observations = [
                {"date": ROUNDS[rnd], "value": vals[sector]}
                for rnd, vals in spec["values"].items()
                if sector in vals
            ]
            suffix = "" if sector == "all" else f"_{sector}"
            indicator_id = f"health.nssladder.{metric}{suffix}"
            sector_label = {"all": "all-India", "rural": "rural", "urban": "urban"}[sector]
            artifact = {
                "schemaVersion": 1, "artifactType": "series",
                "indicatorId": indicator_id,
                "title": f"{spec['title']} ({sector_label})",
                "sourceId": "nss-health-rounds",
                "sourceIndicatorId": metric,
                "sourceUrl": NADA,
                "unit": spec["unit"],
                "frequency": "irregular",
                "geography": {"type": "country", "id": "IN", "name": "India"},
                "dimensions": [], "fetchedAt": FETCHED_AT,
                "observations": observations,
                "metadata": {
                    "source": "NSS social-consumption health rounds (52nd, 60th, 71st, 75th, 80th), NSSO/MoSPI",
                    "note": spec["note"],
                    "rounds": {r: ROUNDS[r] for r in spec["values"]},
                },
            }
            path = OUT_DIR / f"nssladder.IN.health.{metric}{suffix}.json"
            path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"{path.name}  {indicator_id}  ({len(observations)} obs)")
            written += 1
    print(f"\nwrote {written} ladder series")


if __name__ == "__main__":
    main()
