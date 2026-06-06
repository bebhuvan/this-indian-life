#!/usr/bin/env python3
"""
Derive the *extra* El Nino analysis artifacts for q.climate.el_nino_india.

Reads the already-built climate join + crop panel (plain JSON in data/series/)
and the local RBI DBIE data lake (Parquet, food WPI + agri GVA), and emits a
set of new derived artifacts that match the existing artifact JSON schema.

It does NOT touch the existing summary artifacts. Run:
    python3 scripts/derive-el-nino-extras.py
"""
import json, math, os, datetime, collections, statistics

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERIES = os.path.join(ROOT, "data", "series")
CATALOG = os.path.join(ROOT, "data", "catalog")
RBI = "/home/bhuvanesh.r/Documents/Data/Data bank/data/parsed/rbi_dbie_cas_observations"

FETCHED_AT = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
GEO = {"type": "country", "id": "IN", "name": "India"}

# ---------------------------------------------------------------- helpers

def load(name):
    with open(os.path.join(SERIES, name), "r") as f:
        return json.load(f)

def table_artifact(indicator_id, title, unit, rows, source_url, metadata=None,
                   source_id="derived-imd-noaa", source_indicator="enso-iod-imd-monsoon",
                   dimensions=None):
    return {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": source_indicator,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": GEO,
        "dimensions": dimensions or [],
        "fetchedAt": FETCHED_AT,
        "rows": rows,
        "metadata": {**{"generatedFor": "q.climate.el_nino_india"}, **(metadata or {})},
    }

def series_artifact(indicator_id, title, unit, observations, source_url, metadata=None,
                    source_id="derived-imd-noaa", source_indicator="enso-iod-imd-monsoon",
                    frequency="annual"):
    return {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": source_indicator,
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": frequency,
        "geography": GEO,
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "dimensions": ["date", "value"],
        "metadata": {**{"generatedFor": "q.climate.el_nino_india"}, **(metadata or {})},
    }

def write_artifact(filename, artifact):
    path = os.path.join(SERIES, filename)
    with open(path, "w") as f:
        f.write(json.dumps(artifact, indent=2) + "\n")
    n = len(artifact.get("rows") or artifact.get("observations") or [])
    print(f"  wrote {filename}  ({n} rows)")
    return path

def pearson(xs, ys):
    pairs = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None
             and math.isfinite(x) and math.isfinite(y)]
    if len(pairs) < 3:
        return None
    xs2, ys2 = zip(*pairs)
    mx, my = statistics.fmean(xs2), statistics.fmean(ys2)
    sxy = sum((x - mx) * (y - my) for x, y in pairs)
    sxx = sum((x - mx) ** 2 for x in xs2)
    syy = sum((y - my) ** 2 for y in ys2)
    if sxx == 0 or syy == 0:
        return None
    return sxy / math.sqrt(sxx * syy)

def linreg(xs, ys):
    pairs = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None]
    xs2, ys2 = zip(*pairs)
    mx, my = statistics.fmean(xs2), statistics.fmean(ys2)
    sxx = sum((x - mx) ** 2 for x in xs2)
    sxy = sum((x - mx) * (y - my) for x, y in pairs)
    slope = sxy / sxx
    intercept = my - slope * mx
    return slope, intercept

def r1(v):
    return None if v is None else round(v, 1)

def r2(v):
    return None if v is None else round(v, 2)

# ---------------------------------------------------------------- climate join

join = load("derived.IN.climate.enso_iod_imd_monsoon_join.json")
JOIN_URL = "data/series/derived.IN.climate.enso_iod_imd_monsoon_join.json"
all_rows = [r for r in join["rows"] if r["region_id"] == "all_india"]
all_rows.sort(key=lambda r: r["year"])

# Build a clean per-year record
years = []
for r in all_rows:
    official = r.get("official_enso_active_during_monsoon") or ""
    years.append({
        "year": r["year"],
        "rain": r.get("departure_jun_sep_pct"),
        "oni_mean": r.get("oni_monsoon_mean_c"),
        "oni_peak": r.get("oni_monsoon_strongest_c"),
        "phase_strict": r.get("oni_monsoon_phase_by_mean"),
        "official": official,
        "is_elnino_official": official == "El Nino",
        "dmi": r.get("dmi_jun_sep_mean_c"),
        "dmi_phase": r.get("dmi_jun_sep_phase"),
    })

def is_strict_elnino(y):
    return y["phase_strict"] == "El Nino"

def is_strong_elnino(y):
    return y["oni_peak"] is not None and y["oni_peak"] >= 1.5

print("Climate join loaded:", len(years), "monsoon years",
      f"({years[0]['year']}-{years[-1]['year']})")

# ================================================================ ARTIFACT 1
# Definition sensitivity: how the El Nino headline depends on the threshold.
def summarise(subset):
    rains = [y["rain"] for y in subset if y["rain"] is not None]
    if not rains:
        return None
    below = sum(1 for v in rains if v < 0)
    below5 = sum(1 for v in rains if v <= -5)
    return {
        "n": len(rains),
        "avg": statistics.fmean(rains),
        "below_share": 100 * below / len(rains),
        "below5_share": 100 * below5 / len(rains),
    }

defs = [
    ("Pacific in El Nino all monsoon (JJAS ONI ≥ 0.5)", [y for y in years if is_strict_elnino(y)]),
    ("El Nino active any time in the season", [y for y in years if y["is_elnino_official"]]),
    ("Strong El Nino only (peak ONI ≥ 1.5)", [y for y in years if is_strong_elnino(y)]),
    ("La Nina years (for contrast)", [y for y in years if y["phase_strict"] == "La Nina"]),
]
rows = []
for label, subset in defs:
    s = summarise(subset)
    if not s:
        continue
    rows.append({
        "label": label,
        "value": round(s["avg"], 1),
        "years": s["n"],
        "below_normal_share": round(s["below_share"], 0),
        "below_minus5_share": round(s["below5_share"], 0),
    })
write_artifact(
    "derived.IN.climate.el_nino.definition_sensitivity.json",
    table_artifact(
        "climate.el_nino.definition_sensitivity",
        "How the El Nino verdict depends on the definition",
        "% mean rainfall departure",
        rows, JOIN_URL,
        metadata={"note": "Average all-India June-September rainfall departure under "
                          "three ways of labelling an El Nino monsoon, plus La Nina for contrast."},
        dimensions=[],
    ),
)

# ================================================================ ARTIFACT 2
# ONI vs rainfall scatter, 1950-2025, with regression in metadata.
sx = [y["oni_mean"] for y in years]
sy = [y["rain"] for y in years]
r = pearson(sx, sy)
slope, intercept = linreg(sx, sy)
scatter_rows = []
for y in years:
    if y["oni_mean"] is None or y["rain"] is None:
        continue
    phase = y["phase_strict"]
    scatter_rows.append({
        "label": str(y["year"]),
        "x": round(y["oni_mean"], 2),
        "y": round(y["rain"], 1),
        "group": phase,
        "highlight": phase == "El Nino",
    })
write_artifact(
    "derived.IN.climate.el_nino.oni_rain_scatter.json",
    table_artifact(
        "climate.el_nino.oni_rain_scatter",
        "The Pacific explains part of the monsoon, not all of it",
        "% rainfall departure vs ONI (deg C)",
        scatter_rows, JOIN_URL,
        metadata={
            "xLabel": "Monsoon-season Pacific warmth (ONI, deg C)",
            "yLabel": "All-India monsoon rainfall departure (%)",
            "pearson_r": r2(r),
            "r_squared": r2(r * r) if r is not None else None,
            "slope_pct_per_degC": round(slope, 1),
            "intercept_pct": round(intercept, 1),
            "regressionNote": f"Each +1C of Pacific warmth lines up with about {abs(round(slope,1))}% "
                              f"less monsoon rain on average, but the scatter is wide (r={r2(r)}).",
        },
        dimensions=[],
    ),
)
print(f"  ONI-rain correlation r={r:.3f}, slope={slope:.2f}%/degC")

# ================================================================ ARTIFACT 3
# ENSO x IOD: does a positive Indian Ocean Dipole soften an El Nino?
# Uses the article's official El Nino set (n=26) so each cell has enough years;
# the strict subset (n=17) leaves only 3 positive-IOD years and is too noisy.
def iod_pos(y):
    return y["dmi"] is not None and y["dmi"] >= 0.4

cells = [
    ("In an El Nino monsoon", "with a positive Indian Ocean Dipole",
     [y for y in years if y["is_elnino_official"] and iod_pos(y)]),
    ("In an El Nino monsoon", "with a neutral or negative dipole",
     [y for y in years if y["is_elnino_official"] and not iod_pos(y)]),
    ("For comparison", "All La Nina monsoons",
     [y for y in years if y["official"] == "La Nina"]),
]
rows = []
for grp, label, subset in cells:
    rains = [y["rain"] for y in subset if y["rain"] is not None]
    if len(rains) < 3:
        continue
    rows.append({
        "label": label,
        "group": grp,
        "value": round(statistics.fmean(rains), 1),
        "years": len(rains),
    })
write_artifact(
    "derived.IN.climate.el_nino.enso_iod_matrix.json",
    table_artifact(
        "climate.el_nino.enso_iod_matrix",
        "Does the Indian Ocean rescue an El Nino monsoon?",
        "% mean rainfall departure",
        rows, JOIN_URL,
        metadata={"note": "El Nino monsoons that coincided with a positive Indian Ocean Dipole "
                          "averaged near-normal rainfall; those without averaged a clear deficit. "
                          "The dipole softens the blow on average - but 1972 was a severe drought "
                          "despite a positive dipole, so it is a tilt, not a shield."},
        dimensions=[],
    ),
)

# ================================================================ ARTIFACT 4
# 21-year centred rolling correlation of ONI and rainfall.
WIN = 21
half = WIN // 2
roll = []
ys_sorted = years
for i in range(half, len(ys_sorted) - half):
    window = ys_sorted[i - half:i + half + 1]
    rr = pearson([w["oni_mean"] for w in window], [w["rain"] for w in window])
    if rr is not None:
        roll.append({"date": str(ys_sorted[i]["year"]), "value": round(rr, 3)})
write_artifact(
    "derived.IN.climate.el_nino.enso_monsoon_rolling_corr.json",
    series_artifact(
        "climate.el_nino.enso_monsoon_rolling_corr",
        "Has the Pacific's grip on the monsoon loosened?",
        "21-year rolling correlation (ONI vs rainfall)",
        roll, JOIN_URL,
        metadata={"window_years": WIN,
                  "note": "Centred 21-year rolling Pearson correlation between monsoon-season ONI "
                          "and all-India rainfall. More negative = a tighter El Nino-drought link."},
    ),
)

# ================================================================ ARTIFACT 5
# Regional sensitivity: mean SW-monsoon departure in strict El Nino years, by region.
REGION_LABELS = {
    "north_west_india": "Northwest India",
    "central_india": "Central India",
    "south_peninsula": "South Peninsula",
    "east_north_east_india": "East & Northeast India",
    "all_india": "All India",
}
strict_elnino_years = {y["year"] for y in years if is_strict_elnino(y)}
region_rows = []
by_region = collections.defaultdict(dict)
for r in join["rows"]:
    by_region[r["region_id"]][r["year"]] = r.get("departure_jun_sep_pct")
order = ["north_west_india", "central_india", "east_north_east_india", "south_peninsula", "all_india"]
for rid in order:
    if rid not in by_region:
        continue
    vals = [v for yr, v in by_region[rid].items() if yr in strict_elnino_years and v is not None]
    if not vals:
        continue
    region_rows.append({
        "label": REGION_LABELS.get(rid, rid),
        "value": round(statistics.fmean(vals), 1),
        "years": len(vals),
    })
write_artifact(
    "derived.IN.climate.el_nino.regional_sensitivity.json",
    table_artifact(
        "climate.el_nino.regional_sensitivity",
        "El Nino does not hit every region the same way",
        "% mean rainfall departure in El Nino monsoons",
        region_rows, JOIN_URL,
        metadata={"note": "Average June-September departure in the 17 monsoons when the Pacific was "
                          "in El Nino all season, by IMD homogeneous region."},
        dimensions=[],
    ),
)

# ================================================================ ARTIFACT 6
# Sub-seasonal composite: month-by-month departure, El Nino vs all years.
imd = load("imd.IN.climate.imd.monsoon_rainfall_regions.json")
imd_ai = [r for r in imd["rows"] if r["region_id"] == "all_india"]
MONTHS = [("June", "departure_jun_pct"), ("July", "departure_jul_pct"),
          ("August", "departure_aug_pct"), ("September", "departure_sep_pct")]
rows = []
for grp, predicate in (("In El Nino monsoons", lambda yr: yr in strict_elnino_years),
                        ("In a typical year", lambda yr: True)):
    for mlabel, field in MONTHS:
        vals = [r[field] for r in imd_ai if r.get(field) is not None and predicate(r["year"])]
        if not vals:
            continue
        rows.append({"label": mlabel, "group": grp, "value": round(statistics.fmean(vals), 1)})
write_artifact(
    "derived.IN.climate.el_nino.subseasonal_composite.json",
    table_artifact(
        "climate.el_nino.subseasonal_composite",
        "When in the season El Nino bites",
        "% mean rainfall departure",
        rows, "data/series/imd.IN.climate.imd.monsoon_rainfall_regions.json",
        metadata={"note": "Average monthly rainfall departure across El Nino monsoons (JJAS ONI >= 0.5) "
                          "versus the long-run average, all-India, 1901-2025.",
                  "source_id": "imd"},
        source_id="imd", source_indicator="imd-monsoon-rainfall",
        dimensions=[],
    ),
)

print("\nClimate artifacts done. Now RBI economic outcomes...\n")

# ================================================================ RBI lake
import pyarrow.dataset as pds
import pyarrow.compute as pc

dset = pds.dataset(RBI, format="parquet")

MONTH_NUM = {"JAN":1,"FEB":2,"MAR":3,"APR":4,"MAY":5,"JUN":6,"JUL":7,"AUG":8,
             "SEP":9,"OCT":10,"NOV":11,"DEC":12}

def parse_period(p):
    # formats like "OCT-2015"
    try:
        mon, yr = p.split("-")
        return int(yr), MONTH_NUM[mon.upper()[:3]]
    except Exception:
        return None, None

# ---- Food WPI: monthly index per commodity, by base period, -> YoY inflation
WPI_COMMODITIES = ["Food Articles", "Cereals", "Pulses", "Vegetables", "Onion", "Potato"]
t = dset.to_table(filter=(pc.field("dsd_code") == "WHOLE_PRICE_INDEX_RN"),
                  columns=["observation_period", "value", "dimension_json"])
periods = t.column("observation_period").to_pylist()
vals = t.column("value").to_pylist()
djs = t.column("dimension_json").to_pylist()

# index[(commodity, base)][(year,month)] = value
wpi_index = collections.defaultdict(dict)
for p, v, dj in zip(periods, vals, djs):
    if v is None:
        continue
    try:
        d = json.loads(dj)
    except Exception:
        continue
    cls = d.get("WPI_Commodity Classification")
    if cls not in WPI_COMMODITIES:
        continue
    base = d.get("base_per_code")
    yr, mn = parse_period(p)
    if yr is None:
        continue
    wpi_index[(cls, base)][(yr, mn)] = v

def wpi_yoy(commodity, year, month):
    """YoY % change for a commodity at (year, month), computed within a single base period."""
    out = []
    for (cls, base), idx in wpi_index.items():
        if cls != commodity:
            continue
        cur = idx.get((year, month))
        prev = idx.get((year - 1, month))
        if cur is not None and prev is not None and prev != 0:
            out.append((cur - prev) / prev * 100)
    if not out:
        return None
    # prefer the value from the base with both points; if multiple bases overlap, average
    return statistics.fmean(out)

def postmonsoon_yoy(commodity, year):
    """Average Oct-Dec YoY inflation for the given monsoon year."""
    vals = [wpi_yoy(commodity, year, m) for m in (10, 11, 12)]
    vals = [v for v in vals if v is not None]
    return statistics.fmean(vals) if vals else None

# El Nino monsoon years since 1982 (strict definition = Pacific in El Nino all season),
# within WPI coverage. Strict keeps the set to recognisable El Nino monsoons.
elnino_price_years = sorted(y for y in strict_elnino_years if 1982 <= y <= 2024)
rain_by_year = {y["year"]: y["rain"] for y in years}

# ARTIFACT 7: headline Food Articles post-monsoon WPI inflation, per El Nino year
rows = []
for yr in elnino_price_years:
    v = postmonsoon_yoy("Food Articles", yr)
    if v is None:
        continue
    rows.append({
        "label": str(yr),
        "value": round(v, 1),
        "monsoon_departure_pct": r1(rain_by_year.get(yr)),
    })
write_artifact(
    "derived.IN.prices.el_nino.food_wpi_postmonsoon.json",
    table_artifact(
        "prices.el_nino.food_wpi_postmonsoon",
        "Food prices after an El Nino monsoon, 1982-2024",
        "% post-monsoon (Oct-Dec) WPI food inflation, year-on-year",
        rows, "https://data.rbi.org.in/DBIE/",
        metadata={"note": "Average October-December year-on-year wholesale inflation in food articles, "
                          "for every El Nino monsoon since the WPI series begins in 1982. "
                          "YoY computed within each base period before splicing.",
                  "source_id": "rbi-dbie"},
        source_id="rbi-dbie", source_indicator="WHOLE_PRICE_INDEX_RN",
        dimensions=[],
    ),
)

# ARTIFACT 8: commodity breakdown for marquee El Nino years
MARQUEE = [2002, 2009, 2015, 2023]
BREAKDOWN = ["Cereals", "Pulses", "Vegetables", "Onion"]
rows = []
for yr in MARQUEE:
    for c in BREAKDOWN:
        v = postmonsoon_yoy(c, yr)
        if v is None:
            continue
        rows.append({"label": c, "group": str(yr), "value": round(v, 1)})
write_artifact(
    "derived.IN.prices.el_nino.food_wpi_components.json",
    table_artifact(
        "prices.el_nino.food_wpi_components",
        "After an El Nino monsoon, food prices do not move as one",
        "% post-monsoon (Oct-Dec) WPI inflation, year-on-year",
        rows, "https://data.rbi.org.in/DBIE/",
        metadata={"note": "October-December year-on-year wholesale inflation by food group, for four "
                          "El Nino monsoons. Onion and pulses swing far harder than cereals.",
                  "source_id": "rbi-dbie"},
        source_id="rbi-dbie", source_indicator="WHOLE_PRICE_INDEX_RN",
        dimensions=[],
    ),
)

# ARTIFACT 8b: WPI food-articles ANNUAL inflation (calendar-year mean of monthly YoY),
# for the long inflation time series with El Nino shading.
wpi_food_annual = []
for yr in range(1983, 2026):
    vals = [wpi_yoy("Food Articles", yr, m) for m in range(1, 13)]
    vals = [v for v in vals if v is not None]
    if len(vals) >= 6:
        wpi_food_annual.append({"date": str(yr), "value": round(statistics.fmean(vals), 1)})
write_artifact(
    "derived.IN.prices.el_nino.food_wpi_annual.json",
    series_artifact(
        "prices.el_nino.food_wpi_annual",
        "Wholesale food inflation, annual average",
        "% year-on-year",
        wpi_food_annual, "https://data.rbi.org.in/DBIE/",
        metadata={"note": "Calendar-year average of monthly year-on-year wholesale (WPI) food-articles "
                          "inflation, RBI DBIE, 1983-2025.", "source_id": "rbi-dbie"},
        source_id="rbi-dbie", source_indicator="WHOLE_PRICE_INDEX_RN",
    ),
)

# ARTIFACT 8c: CPI consumer-food-price ANNUAL inflation (retail), from MoSPI monthly.
try:
    cpi_m = load("mospi.IN.prices.cpi.combined.consumer_food_price.inflation.json")
    by_year = collections.defaultdict(list)
    for o in cpi_m.get("observations", []):
        d = str(o.get("date", "")); v = o.get("value")
        if len(d) >= 4 and v is not None:
            by_year[d[:4]].append(v)
    cpi_food_annual = [{"date": y, "value": round(statistics.fmean(vs), 1)}
                       for y, vs in sorted(by_year.items()) if len(vs) >= 6]
    if cpi_food_annual:
        write_artifact(
            "derived.IN.prices.el_nino.food_cpi_annual.json",
            series_artifact(
                "prices.el_nino.food_cpi_annual",
                "Retail food inflation (CPI), annual average",
                "% year-on-year",
                cpi_food_annual, "https://www.mospi.gov.in/",
                metadata={"note": "Calendar-year average of monthly Consumer Food Price Index "
                                  "inflation, MoSPI, 2013-2025.", "source_id": "mospi"},
                source_id="mospi", source_indicator="CPI_CONSUMER_FOOD_PRICE",
            ),
        )
except FileNotFoundError:
    print("  (CPI food monthly file not found, skipping food_cpi_annual)")

# ---- Agri GVA growth by ENSO phase (constant prices, 1951+)
t = dset.to_table(filter=(pc.field("dsd_code") == "ANN_GDP_FACT_CST_RN"),
                  columns=["value", "dimension_json"])
gva_vals = t.column("value").to_pylist()
gva_djs = t.column("dimension_json").to_pylist()
# agri[(base)][year] = constant-price agri GVA
agri = collections.defaultdict(dict)
total = collections.defaultdict(dict)
for v, dj in zip(gva_vals, gva_djs):
    if v is None:
        continue
    d = json.loads(dj)
    if d.get("Price Type") != "Constant Price":
        continue
    comp = d.get("Components of GDP", "")
    base = d.get("base_per_code")
    try:
        yr = int(d.get("Year"))
    except Exception:
        continue
    if comp == "Agriculture, Forestry and Fishing":
        agri[base][yr] = v
    if comp in ("GVA at basic price", "GDP at Market prices"):
        total[base].setdefault(yr, {})[comp] = v

def agri_yoy(year):
    out = []
    for base, idx in agri.items():
        cur, prev = idx.get(year), idx.get(year - 1)
        if cur is not None and prev is not None and prev != 0:
            out.append((cur - prev) / prev * 100)
    return statistics.fmean(out) if out else None

# Map a fiscal-year-start (monsoon year) to agri GVA growth of that crop year.
phase_growth = {"El Nino": [], "La Nina": [], "Neutral": []}
worst = []
for y in years:
    g = agri_yoy(y["year"])
    if g is None:
        continue
    ph = y["phase_strict"]
    if ph in phase_growth:
        phase_growth[ph].append(g)
    if is_strict_elnino(y):
        worst.append((y["year"], g))
rows = []
for ph in ("El Nino", "Neutral", "La Nina"):
    g = phase_growth[ph]
    if g:
        rows.append({
            "label": {"El Nino": "El Nino monsoons", "Neutral": "Neutral years",
                      "La Nina": "La Nina monsoons"}[ph],
            "value": round(statistics.fmean(g), 1),
            "years": len(g),
        })
if rows:
    write_artifact(
        "derived.IN.econ.el_nino.agri_gva_growth_by_phase.json",
        table_artifact(
            "econ.el_nino.agri_gva_growth_by_phase",
            "Farm output still feels the Pacific",
            "% mean annual real agricultural GVA growth",
            rows, "https://data.rbi.org.in/DBIE/",
            metadata={"note": "Mean year-on-year growth of real agriculture, forestry & fishing GVA "
                              "by ENSO phase of the monsoon, 1951-2025.",
                      "source_id": "rbi-dbie"},
            source_id="rbi-dbie", source_indicator="ANN_GDP_FACT_CST_RN",
            dimensions=[],
        ),
    )

# Agri share of GDP/GVA over time (if total available) -> the "why 2015 != 1965" framing
share_obs = []
if total:
    base_pick = max(total.keys(), key=lambda b: len(total[b]))
    for yr in sorted(agri.get(base_pick, {})):
        a = agri[base_pick].get(yr)
        comps = total[base_pick].get(yr, {})
        tt = comps.get("GVA at basic price") or comps.get("GDP at Market prices")
        if a and tt:
            share_obs.append({"date": str(yr), "value": round(100 * a / tt, 1)})
if share_obs:
    write_artifact(
        "derived.IN.econ.el_nino.agri_gva_share.json",
        series_artifact(
            "econ.el_nino.agri_gva_share",
            "Why an identical drought hurts the economy less than it used to",
            "% agriculture share of GVA (constant prices)",
            share_obs, "https://data.rbi.org.in/DBIE/",
            metadata={"note": "Agriculture, forestry & fishing as a share of real GVA. As the share "
                              "falls, a given monsoon shock moves headline GDP less - though it still "
                              "moves rural incomes and food prices.",
                      "source_id": "rbi-dbie"},
            source_id="rbi-dbie", source_indicator="ANN_GDP_FACT_CST_RN",
        ),
    )
else:
    print("  (agri share skipped: no matching total-GVA component found)")

print("\nAll extra artifacts written.")
