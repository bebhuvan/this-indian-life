#!/usr/bin/env python3
"""State-level warming choropleth for India from ERA5.

Pipeline:
  1. Load an India district GeoJSON and dissolve to states.
  2. Download ERA5 monthly 2m temperature (baseline 1951-1980 + recent 2015-2024).
  3. Area-average ERA5 over each state polygon (regionmask + cosine-latitude weights).
  4. Warming per state = recent-decade mean minus baseline mean.
  5. Project each state polygon to SVG coordinates (equirectangular) so the JS side can
     draw a choropleth with no map library.

Writes data/series/era5.IN.state_warming.json (artifactType "choropleth").
"""
import os, json, math, datetime, tempfile, collections
import cdsapi, numpy as np, xarray as xr, geopandas as gpd, regionmask, pandas as pd

GEOJSON_URL = "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson"
BBOX = [37, 68, 6, 98]  # N, W, S, E
BASE = list(range(1951, 1981))
RECENT = list(range(2015, 2025))
VB_W, VB_H = 740, 820
FETCHED_AT = datetime.datetime.now(datetime.UTC).isoformat()

print("loading + dissolving states...")
g = gpd.read_file(GEOJSON_URL)
namecol = "st_nm"
states = g.dissolve(by=namecol, as_index=False)[[namecol, "geometry"]]
states["geometry"] = states.geometry.simplify(0.03, preserve_topology=True)
states = states.reset_index(drop=True)
print(f"  {len(states)} states")

os.makedirs("data/snapshots/era5", exist_ok=True)
target = "data/snapshots/era5/era5_states_temp.nc"  # cached so re-runs skip the download
if not os.path.exists(target):
    print("downloading ERA5 2m temperature (baseline + recent)...")
    cdsapi.Client().retrieve(
        "reanalysis-era5-single-levels-monthly-means",
        {
            "product_type": ["monthly_averaged_reanalysis"],
            "variable": ["2m_temperature"],
            "year": [str(y) for y in BASE + RECENT],
            "month": [f"{m:02d}" for m in range(1, 13)],
            "time": ["00:00"],
            "area": BBOX,
            "data_format": "netcdf",
            "download_format": "unarchived",
        },
        target,
    )
else:
    print("using cached ERA5 file")
ds = xr.open_dataset(target, engine="netcdf4")
t2m = ds["t2m"]
times = pd.to_datetime(t2m["valid_time"].values)
years_arr = np.array([t.year for t in times])
wlat = np.cos(np.deg2rad(t2m["latitude"]))

print("masking ERA5 to each state...")
regions = regionmask.from_geopandas(states, names=namecol, name="india_states", overlap=False)
mask = regions.mask(t2m["longitude"], t2m["latitude"])

warming_by_idx = {}
for ri in range(len(states)):
    cell = (mask == ri)
    if not bool(cell.any()):
        continue
    weight = (wlat * cell).fillna(0)
    series = t2m.weighted(weight).mean(dim=["latitude", "longitude"]).values - 273.15
    by_year = collections.defaultdict(list)
    for v, y in zip(series, years_arr):
        by_year[int(y)].append(float(v))
    annual = {y: sum(vs) / len(vs) for y, vs in by_year.items() if len(vs) == 12}
    base = [annual[y] for y in BASE if y in annual]
    rec = [annual[y] for y in RECENT if y in annual]
    if not base or not rec:
        continue
    warming_by_idx[ri] = (sum(rec) / len(rec)) - (sum(base) / len(base))

# Projection: equirectangular fit of the all-state bounding box into the viewBox.
lonmin, latmin, lonmax, latmax = states.total_bounds
def project(lon, lat):
    x = (lon - lonmin) / (lonmax - lonmin) * VB_W
    y = (latmax - lat) / (latmax - latmin) * VB_H
    return x, y
def geom_to_path(geom):
    polys = list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]
    parts = []
    for poly in polys:
        coords = list(poly.exterior.coords)
        if len(coords) < 3:
            continue
        d = ""
        for i, (lon, lat) in enumerate(coords):
            x, y = project(lon, lat)
            d += ("M" if i == 0 else "L") + f"{x:.1f} {y:.1f} "
        parts.append(d + "Z")
    return " ".join(parts)

regions_out = []
for ri, row in states.iterrows():
    if ri not in warming_by_idx:
        continue
    regions_out.append({"name": row[namecol], "value": round(warming_by_idx[ri], 2), "path": geom_to_path(row.geometry)})

vals = [r["value"] for r in regions_out]
artifact = {
    "schemaVersion": 1,
    "artifactType": "choropleth",
    "indicatorId": "climate.era5.state_warming",
    "title": "Which states have warmed the most",
    "sourceId": "era5",
    "sourceIndicatorId": "2m_temperature state warming",
    "sourceUrl": "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means",
    "unit": "°C",
    "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
    "fetchedAt": FETCHED_AT,
    "viewBox": f"0 0 {VB_W} {VB_H}",
    "min": round(min(vals), 2),
    "max": round(max(vals), 2),
    "regions": sorted(regions_out, key=lambda r: -r["value"]),
    "metadata": {"baseline": "1951-1980 mean", "recent": "2015-2024 mean", "method": "ERA5 area-average per state polygon (regionmask, cosine-latitude weighted)"},
}
os.makedirs("data/series", exist_ok=True)
with open("data/series/era5.IN.state_warming.json", "w") as f:
    json.dump(artifact, f, ensure_ascii=False)
    f.write("\n")
print(f"wrote choropleth: {len(regions_out)} states | warming {artifact['min']} to {artifact['max']} C")
print("hottest-warming:", [(r["name"], r["value"]) for r in artifact["regions"][:5]])
