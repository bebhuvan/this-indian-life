#!/usr/bin/env python3
"""Emit state population (2011-2024) for the delimitation / seat-share payload.

Source: RBI Handbook of Statistics on Indian States (e-STATES) population, already
snapshotted at data/snapshots/estates/rbi_handbook_states.json. 2011 is Census;
2012-2024 are official post-census estimates (no census has been held since 2011).

Why RBI actuals rather than NCP projections: the delimitation argument is
strongest as *realised* divergence -- southern states (which cut fertility early)
are growing far slower than the north -- which needs no contested forecast. The
NCP projection to 2036 exists (IDH SSDGPTTAPP11A) but IDH's copy is null for
major states (Tamil Nadu, UP), so it is unreliable; add it later from the NCP
report if a forward panel is wanted.

Outputs:
  states.population.<slug>.json      per-state population series 2011-2024
  states.population.growth_share.json table: 2011/2024 population, growth%, share%
"""
import json
import os
import re

ROOT = os.getcwd()
OUT = os.path.join(ROOT, "data", "series")
HB = os.path.join(ROOT, "data", "snapshots", "estates", "rbi_handbook_states.json")
FETCHED = "2026-07-10T00:00:00.000Z"
URL = ("https://www.rbi.org.in/Scripts/AnnualPublications.aspx"
       "?head=Handbook+of+Statistics+on+Indian+States")

MAJORS = ["Kerala", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "Telangana",
          "Maharashtra", "Punjab", "West Bengal", "Gujarat", "Odisha", "Rajasthan",
          "Madhya Pradesh", "Uttar Pradesh", "Bihar", "Jharkhand", "Chhattisgarh",
          "Haryana", "Assam", "Himachal Pradesh", "Uttarakhand", "Delhi",
          "Jammu & Kashmir"]
SOUTH = {"Kerala", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "Telangana"}


def slugify(name):
    n = name.strip().lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "_", n).strip("_")


def main():
    hb = json.load(open(HB))["states"]
    written = 0
    for state in MAJORS:
        pop = hb.get(state, {}).get("population", {})
        obs = [{"date": y, "value": int(pop[y])} for y in sorted(pop) if pop[y]]
        if len(obs) < 2:
            continue
        s = slugify(state)
        art = {
            "schemaVersion": 1, "artifactType": "series",
            "indicatorId": f"people.state_population.{s}",
            "title": f"Population, {state}",
            "sourceId": "rbi-estates",
            "sourceIndicatorId": f"RBI Handbook of Statistics on Indian States: population, {state}",
            "sourceUrl": URL, "unit": "persons", "frequency": "annual",
            "geography": {"type": "subnational", "id": f"IND-{s}", "name": state},
            "dimensions": [], "fetchedAt": FETCHED, "observations": obs,
            "metadata": {"dataset": "RBI Handbook (e-STATES) population",
                         "note": "2011 is Census; 2012-2024 are official post-census estimates."},
        }
        json.dump(art, open(os.path.join(OUT, f"states.population.{s}.json"), "w"), indent=2)
        written += 1

    # growth + national-share table
    tot = lambda y: sum(hb[s]["population"][y] for s in MAJORS
                        if hb.get(s, {}).get("population", {}).get(y))
    t2011, t2024 = tot("2011"), tot("2024")
    rows = []
    for state in MAJORS:
        p = hb.get(state, {}).get("population", {})
        if "2011" not in p or "2024" not in p:
            continue
        rows.append({
            "state": state,
            "region": "South" if state in SOUTH else "Rest",
            "pop2011_m": round(p["2011"] / 1e6, 1),
            "pop2024_m": round(p["2024"] / 1e6, 1),
            "growth_pct": round(100 * (p["2024"] / p["2011"] - 1), 1),
            "share2011_pct": round(100 * p["2011"] / t2011, 2),
            "share2024_pct": round(100 * p["2024"] / t2024, 2),
        })
    rows.sort(key=lambda r: r["growth_pct"])
    tbl = {
        "schemaVersion": 1, "artifactType": "table",
        "indicatorId": "people.state_population.growth_share",
        "title": "State population growth and national share, 2011-2024",
        "sourceId": "rbi-estates",
        "sourceIndicatorId": "RBI Handbook of Statistics on Indian States: population by state",
        "sourceUrl": URL, "unit": "persons / %",
        "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
        "dimensions": ["pop2011_m", "pop2024_m", "growth_pct", "share2011_pct", "share2024_pct", "region"],
        "fetchedAt": FETCHED, "rows": rows,
        "metadata": {
            "dataset": "RBI Handbook (e-STATES) population, 22 major states",
            "southShare2011": round(100 * sum(hb[s]["population"]["2011"] for s in SOUTH) / t2011, 2),
            "southShare2024": round(100 * sum(hb[s]["population"]["2024"] for s in SOUTH) / t2024, 2),
            "note": "Share is within the 22 major states listed (not all-India). Delimitation "
                    "seats are frozen on 1971 population until at least 2026; this shows the "
                    "realised drift since 2011. 2012-2024 are official estimates.",
        },
    }
    json.dump(tbl, open(os.path.join(OUT, "states.population.growth_share.json"), "w"), indent=2)
    print(f"wrote {written} population series + growth_share table")
    print(f"  South share of 22 majors: {tbl['metadata']['southShare2011']}% (2011) -> "
          f"{tbl['metadata']['southShare2024']}% (2024)")


if __name__ == "__main__":
    main()
