#!/usr/bin/env python3
"""Build the female-LFPR-by-state choropleth artifact for q.work.who_works_in_india.

Reuses the canonical India state geometry (paths + viewBox) from the ERA5 base map and
attaches PLFS-2025 female-LFPR values matched by a punctuation-insensitive state-name key.
"""
import json, os, re, glob

BASE = "/home/bhuvanesh.r/Documents/Bhuvan projects/Indica/data/series/era5.IN.state_warming.json"
SERIES_DIR = "/home/bhuvanesh.r/Documents/Bhuvan projects/Indica/data/series"
OUT = os.path.join(SERIES_DIR, "plfs.IN.work.who.flfpr_state_choropleth.json")

def norm(name):
    # Normalise "&" to "and" so "Daman & Diu" matches the base map's "Daman and Diu",
    # then strip all non-alphanumerics. Consistent on both sides → exact match.
    return re.sub(r"[^a-z0-9]", "", name.lower().replace("&", "and"))

# load PLFS female-LFPR values, keyed by normalised state name
vals = {}
for fn in glob.glob(os.path.join(SERIES_DIR, "plfs.IN.work.who.flfpr_state_*.json")):
    if "choropleth" in fn:
        continue
    d = json.load(open(fn))
    # title looks like "Female LFPR — <State>"
    name = d["title"].split("—")[-1].strip()
    vals[norm(name)] = d["observations"][0]["value"]

base = json.load(open(BASE))
regions, matched = [], 0
for r in base["regions"]:
    v = vals.get(norm(r["name"]))
    if v is not None:
        matched += 1
    regions.append({"name": r["name"], "value": v, "path": r["path"]})

present = [r["value"] for r in regions if r["value"] is not None]
art = {
    "schemaVersion": 1, "artifactType": "choropleth",
    "indicatorId": "work.who.flfpr_state_choropleth",
    "title": "Female labour-force participation by state",
    "sourceId": "plfs", "sourceIndicatorId": "PLFS_2025_unit_level",
    "sourceUrl": "https://microdata.gov.in/NADA/index.php/catalog/PLFS",
    "unit": "%", "frequency": "annual",
    "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
    "fetchedAt": "2026-06-05T00:00:00.000Z",
    "viewBox": base["viewBox"],
    "min": 15, "max": 70,
    "regions": regions,
    "metadata": {"dataset": "PLFS unit-level (Calendar 2025, visit 1)",
                 "definition": "female LFPR 15+, usual status (ps+ss), weighted; geometry from ERA5 base map"},
}
with open(OUT, "w") as f:
    json.dump(art, f, indent=2, ensure_ascii=False)
print(f"wrote {OUT}")
print(f"matched {matched}/{len(regions)} states; data range {min(present):.1f}–{max(present):.1f}")
print("unmatched base-map states:", [r["name"] for r in regions if r["value"] is None])
