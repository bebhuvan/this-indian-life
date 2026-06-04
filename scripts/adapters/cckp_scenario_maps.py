#!/usr/bin/env python3
"""Build a small-multiples scenario-map artifact: dangerous heat-index days by state
under low/mid/high emissions at end-century, from World Bank CCKP subnational data.

CCKP subnational geocodes (IND.xxxx) -> state names via the CCKP geonames lookup,
then joined onto the ERA5 state-warming SVG paths so it renders as India maps.
One artifact, three panels (one per SSP scenario), shared colour scale.
"""
import json, re, urllib.request, datetime
import openpyxl

GEONAMES = "/home/bhuvanesh.r/Downloads/geonames.xlsx"
STATE_PATHS = "data/series/era5.IN.state_warming.json"
OUT = "data/series/cckp.IN.heatindex39_scenario_maps.json"
VARIABLE, PERIOD = "hi39", "2080-2099"
SCENARIOS = [("ssp126", "Low emissions (SSP1-2.6)"), ("ssp245", "Middle road (SSP2-4.5)"), ("ssp585", "High emissions (SSP5-8.5)")]

def norm(s): return re.sub(r"[^a-z]", "", (s or "").lower())
ALIAS = {"dadraandnagarhaveli": "dadraandnagarhavelianddamananddiu",
         "damananddiu": "dadraandnagarhavelianddamananddiu", "nctofdelhi": "delhi"}

# geocode -> state name (India only)
wb = openpyxl.load_workbook(GEONAMES, data_only=True, read_only=True)
geo = {code: name for code, cc, name in wb["Subnationals"].iter_rows(values_only=True) if cc == "IND" and code}

# SVG regions
state_art = json.load(open(STATE_PATHS))
svg_by_norm = {norm(r["name"]): r for r in state_art["regions"]}

def svg_region_for(geoname):
    key = ALIAS.get(norm(geoname), norm(geoname))
    return svg_by_norm.get(key)

def fetch(scenario):
    url = (f"https://cckpapi.worldbank.org/cckp/v1/cmip6-x0.25_climatology_{VARIABLE}"
           f"_climatology_annual_{PERIOD}_median_{scenario}_ensemble_all_mean/all_countries_subnationals?_format=json")
    req=urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 Indica","Accept":"application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)["data"]
    out = {}
    for code, name in geo.items():
        cell = data.get(code)
        if not cell:
            continue
        vals = [v for v in cell.values() if isinstance(v, (int, float))]
        reg = svg_region_for(name)
        if vals and reg:
            out[reg["name"]] = round(vals[0], 1)
    return out, url

panels, all_vals, src_url = [], [], None
for key, label in SCENARIOS:
    vals, url = fetch(key)
    src_url = src_url or url
    all_vals += list(vals.values())
    regions = [{"name": r["name"], "value": vals.get(r["name"]), "path": r["path"]} for r in state_art["regions"]]
    panels.append({"key": key, "label": label, "regions": regions})
    print(f"{key}: {len(vals)} states, range {min(vals.values())}-{max(vals.values())}")

artifact = {
    "schemaVersion": 1, "artifactType": "scenarioMaps", "indicatorId": "climate.cckp.heatindex39_scenario_maps",
    "title": "Dangerous heat-index days by state, by 2100", "sourceId": "cckp",
    "sourceIndicatorId": "CMIP6 heat-index>=39C days, 2080-2099 climatology, by SSP scenario, subnational",
    "sourceUrl": "https://climateknowledgeportal.worldbank.org/download-data",
    "unit": "days per year", "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
    "viewBox": state_art["viewBox"], "min": 0, "max": round(max(all_vals)),
    "fetchedAt": datetime.datetime.now(datetime.UTC).isoformat(),
    "scenarios": panels,
    "metadata": {"variable": VARIABLE, "period": PERIOD, "note": "World Bank CCKP CMIP6 ensemble median, subnational (admin-1). Days per year with a heat index >= 39C. Ladakh has no CCKP code and renders grey."}
}
json.dump(artifact, open(OUT, "w"), indent=2)
open(OUT, "a").write("\n")
print(f"wrote {OUT} | shared max {artifact['max']} | panels {len(panels)}")
