#!/usr/bin/env python3
"""
Derive El Nino regional CROP-YIELD artifacts for q.climate.el_nino_india:
  1) a state-level choropleth of kharif rice yield anomaly in El Nino years
  2) an irrigated-vs-rainfed yield split by IMD region (grouped bars)

Sources:
  - ICRISAT District Level Database (apportioned), 1966-2017, vendored at
    data/vendor/icrisat-dld/ (district area/production/yield).
  - El Nino classification from the existing ENSO-IOD-IMD monsoon join.
  - State map geometry borrowed from the shipped ERA5 state choropleth.

Method: for each state (or region) and year, build a production-weighted yield
(sum production / sum area across districts). Detrend by expressing each El Nino
year as a % deviation from that state's prior-5-year mean (removes the Green
Revolution trend). Average those deviations across the strict El Nino monsoons
in range (Pacific in El Nino through the whole season, 1966-2017).
"""
import csv, collections, statistics, json, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERIES = os.path.join(ROOT, "data", "series")
ICRISAT = os.path.join(ROOT, "data", "vendor", "icrisat-dld", "dld_yield_complete_1966_2017.csv")
ERA5 = os.path.join(SERIES, "era5.IN.state_warming.json")
JOIN = os.path.join(SERIES, "derived.IN.climate.enso_iod_imd_monsoon_join.json")
FETCHED_AT = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

STATE_XWALK = {"Orissa": "Odisha"}  # ICRISAT -> modern map names
REGION = {
    "Punjab": "Northwest", "Haryana": "Northwest", "Himachal Pradesh": "Northwest",
    "Rajasthan": "Northwest", "Uttarakhand": "Northwest",
    "Madhya Pradesh": "Central", "Chhattisgarh": "Central", "Gujarat": "Central",
    "Maharashtra": "Central", "Uttar Pradesh": "Central",
    "Andhra Pradesh": "South Peninsula", "Telangana": "South Peninsula",
    "Karnataka": "South Peninsula", "Tamil Nadu": "South Peninsula", "Kerala": "South Peninsula",
    "West Bengal": "East & NE", "Bihar": "East & NE", "Jharkhand": "East & NE",
    "Odisha": "East & NE", "Assam": "East & NE",
}
RICE = [("RICE.AREA..1000.ha.", "RICE.PRODUCTION..1000.tons.")]
COARSE = [(f"{c}.AREA..1000.ha.", f"{c}.PRODUCTION..1000.tons.")
          for c in ["KHARIF.SORGHUM", "PEARL.MILLET", "MAIZE", "FINGER.MILLET"]]

rows = list(csv.DictReader(open(ICRISAT)))
join = json.load(open(JOIN))
ai = [r for r in join["rows"] if r["region_id"] == "all_india"]
ELNINO = sorted(r["year"] for r in ai
                if r["oni_monsoon_phase_by_mean"] == "El Nino" and 1966 <= r["year"] <= 2017)
print("strict El Nino years 1966-2017:", ELNINO)


def weighted_yield(group_key, crops):
    """group_key(row)->bucket ; returns {bucket: {year: yield_kg_ha}}"""
    agg = collections.defaultdict(lambda: [0.0, 0.0])  # (bucket,year)->[area,prod]
    for r in rows:
        bucket = group_key(r)
        if bucket is None:
            continue
        y = int(r["Year"])
        for ac, pc in crops:
            a, p = float(r[ac]), float(r[pc])
            if a > 0 and p >= 0:
                agg[(bucket, y)][0] += a
                agg[(bucket, y)][1] += p
    out = collections.defaultdict(dict)
    for (bucket, y), (a, p) in agg.items():
        if a > 0:
            out[bucket][y] = p / a * 1000.0
    return out


def elnino_anomaly(series_by_bucket, min_years=5):
    out = {}
    for bucket, series in series_by_bucket.items():
        devs = []
        for y in ELNINO:
            prev = [series[k] for k in range(y - 5, y) if k in series]
            if y in series and len(prev) >= 3:
                base = statistics.fmean(prev)
                devs.append((series[y] - base) / base * 100)
        if len(devs) >= min_years:
            out[bucket] = (round(statistics.fmean(devs), 1), len(devs))
    return out


state_key = lambda r: STATE_XWALK.get(r["State.Name"], r["State.Name"])
region_key = lambda r: REGION.get(STATE_XWALK.get(r["State.Name"], r["State.Name"]))

rice_state = elnino_anomaly(weighted_yield(state_key, RICE))
rice_region = elnino_anomaly(weighted_yield(region_key, RICE))
coarse_region = elnino_anomaly(weighted_yield(region_key, COARSE))

SOURCE_NOTE = ("ICRISAT District Level Database (apportioned), 1966-2017, joined to the "
               "NOAA/IMD El Nino classification. Yield is production-weighted across districts; "
               "each El Nino monsoon is a % deviation from the state's prior-5-year mean, then "
               "averaged across the " + str(len(ELNINO)) + " strict El Nino monsoons in range.")

# ---------------- 0) cross-crop national yield sensitivity ----------------
# Which crops actually lose yield in El Nino years? National production-weighted yield.
CROPS = [
    ("Groundnut", "GROUNDNUT"), ("Sorghum (jowar)", "SORGHUM"), ("Pearl millet (bajra)", "PEARL.MILLET"),
    ("Pigeonpea (arhar)", "PIGEONPEA"), ("Nine oilseeds", "OILSEEDS"), ("Maize", "MAIZE"),
    ("Finger millet (ragi)", "FINGER.MILLET"), ("Rice", "RICE"), ("Cotton", "COTTON"),
    ("Sugarcane", "SUGARCANE"), ("Chickpea (gram)", "CHICKPEA"), ("Wheat", "WHEAT"),
]
all_key = lambda r: "IN"
crop_rows = []
for label, pfx in CROPS:
    a = elnino_anomaly(weighted_yield(all_key, [(f"{pfx}.AREA..1000.ha.", f"{pfx}.PRODUCTION..1000.tons.")]))
    if "IN" in a:
        crop_rows.append({"label": label, "value": a["IN"][0], "years": a["IN"][1]})
crop_rows.sort(key=lambda r: r["value"])
with open(os.path.join(SERIES, "derived.IN.agriculture.el_nino.crop_yield_sensitivity.json"), "w") as f:
    f.write(json.dumps({
        "schemaVersion": 1, "artifactType": "table",
        "indicatorId": "agriculture.el_nino.crop_yield_sensitivity",
        "title": "Which crops El Nino actually hits",
        "sourceId": "icrisat-dld", "sourceIndicatorId": "dld-apportioned-yield",
        "sourceUrl": "https://data.icrisat.org/dld/src/crops.html",
        "unit": "% above or below the crop's recent 5-year normal",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "fetchedAt": FETCHED_AT, "dimensions": [], "rows": crop_rows,
        "metadata": {"generatedFor": "q.climate.el_nino_india", "method": SOURCE_NOTE,
                     "note": "Rainfed kharif crops (groundnut, jowar, bajra, pulses, oilseeds) lose "
                             "the most yield in El Nino years; irrigated and rabi crops (wheat, rice, "
                             "sugarcane) are insulated or even gain."}
    }, indent=2) + "\n")
print("wrote crop_yield_sensitivity:", [(r["label"], r["value"]) for r in crop_rows])

# ---------------- 1) choropleth: rice yield anomaly by state ----------------
era5 = json.load(open(ERA5))
paths = {r["name"]: r["path"] for r in era5["regions"]}
regions = []
covered = 0
for name, path in paths.items():
    if name in rice_state:
        regions.append({"name": name, "value": rice_state[name][0], "path": path})
        covered += 1
    else:
        regions.append({"name": name, "value": None, "path": path})
vals = [r["value"] for r in regions if r["value"] is not None]
bound = max(abs(min(vals)), abs(max(vals)))
choropleth = {
    "schemaVersion": 1,
    "artifactType": "choropleth",
    "indicatorId": "agriculture.el_nino.rice_yield_anomaly_state",
    "title": "El Nino's mark on the rice harvest, state by state",
    "sourceId": "icrisat-dld",
    "sourceIndicatorId": "dld-apportioned-rice-yield",
    "sourceUrl": "https://data.icrisat.org/dld/src/crops.html",
    "unit": "% rice yield vs prior 5-year mean",
    "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
    "fetchedAt": FETCHED_AT,
    "viewBox": era5["viewBox"],
    "min": round(-bound, 1),
    "max": round(bound, 1),
    "regions": regions,
    "metadata": {
        "generatedFor": "q.climate.el_nino_india",
        "elNinoYears": ELNINO,
        "statesCovered": covered,
        "method": SOURCE_NOTE,
        "caveat": ("Yield, not production, so it nets out sown-area swings. Irrigated states "
                   "(Punjab, Haryana) can show rising rice yields in El Nino years even as rainfed "
                   "eastern states fall. ICRISAT covers 20 major-agriculture states; others are blank."),
    },
}
with open(os.path.join(SERIES, "derived.IN.agriculture.el_nino.rice_yield_anomaly_state.json"), "w") as f:
    f.write(json.dumps(choropleth, indent=2) + "\n")
print(f"wrote rice choropleth ({covered} states), range +/-{bound:.1f}%")

# ---------------- 2) irrigated-vs-rainfed split by region (grouped bars) ----------------
ORDER = ["Northwest", "Central", "South Peninsula", "East & NE"]
split_rows = []
for grp, anom in (("Rice (more irrigated)", rice_region), ("Coarse cereals (rainfed)", coarse_region)):
    for reg in ORDER:
        if reg in anom:
            split_rows.append({"label": reg, "group": grp, "value": anom[reg][0], "years": anom[reg][1]})
split = {
    "schemaVersion": 1,
    "artifactType": "table",
    "indicatorId": "agriculture.el_nino.irrigation_yield_split",
    "title": "Why El Nino's harvest hit depends on irrigation, not just rainfall",
    "sourceId": "icrisat-dld",
    "sourceIndicatorId": "dld-apportioned-yield",
    "sourceUrl": "https://data.icrisat.org/dld/src/crops.html",
    "unit": "% mean yield deviation in El Nino years",
    "geography": {"type": "country", "id": "IN", "name": "India"},
    "fetchedAt": FETCHED_AT,
    "dimensions": [],
    "rows": split_rows,
    "metadata": {
        "generatedFor": "q.climate.el_nino_india",
        "method": SOURCE_NOTE,
        "note": ("In the rain-starved northwest, irrigated rice yields hold or rise in El Nino years "
                 "while rainfed coarse cereals collapse - the rainfall map is not the yield map."),
    },
}
with open(os.path.join(SERIES, "derived.IN.agriculture.el_nino.irrigation_yield_split.json"), "w") as f:
    f.write(json.dumps(split, indent=2) + "\n")
print("wrote irrigation split:", {(r["group"], r["label"]): r["value"] for r in split_rows})
