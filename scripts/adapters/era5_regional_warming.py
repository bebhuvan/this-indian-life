#!/usr/bin/env python3
"""Long-range regional climate artifacts for India from Copernicus ERA5.

This is the focused physical-climate layer for an India climate article:
  - annual mean temperature by Indian state / UT, 1940 onward
  - annual temperature anomaly by state / UT, rebased to 1991-2020
  - annual and seasonal temperature anomaly by broad Indian climate/editorial regions
  - annual and seasonal precipitation, dew point, and relative humidity by region
  - a state choropleth of recent-decade warming against the 1940s

Range is controlled by ERA5_REGION_START / ERA5_REGION_END. The default end year
is the last complete calendar year. The NetCDF is cached under data/snapshots/era5.
"""

import collections
import datetime
import json
import math
import os
import tempfile

import cdsapi
import geopandas as gpd
import numpy as np
import pandas as pd
import regionmask
import xarray as xr


START = int(os.environ.get("ERA5_REGION_START", "1940"))
DEFAULT_END = datetime.datetime.now(datetime.UTC).year - 1
END = int(os.environ.get("ERA5_REGION_END", str(DEFAULT_END)))
BBOX = [37, 68, 6, 98]  # N, W, S, E
BASELINE = range(1991, 2021)
EARLY = range(1940, 1950)
RECENT = range(2015, 2025)
SEASONS = [
    {"id": "winter", "name": "Winter", "months": [1, 2]},
    {"id": "pre_monsoon", "name": "Pre-monsoon", "months": [3, 4, 5]},
    {"id": "southwest_monsoon", "name": "Southwest monsoon", "months": [6, 7, 8, 9]},
    {"id": "post_monsoon", "name": "Post-monsoon", "months": [10, 11, 12]},
]
VB_W, VB_H = 740, 820
FETCHED_AT = datetime.datetime.now(datetime.UTC).isoformat()
SERIES_DIR = "data/series"
SNAP_DIR = "data/snapshots/era5"
SOURCE_URL = "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means"
GEOJSON_URL = "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson"

REGIONS = {
    "himalayan_belt": {
        "name": "Himalayan belt",
        "states": ["Ladakh", "Jammu and Kashmir", "Himachal Pradesh", "Uttarakhand", "Sikkim", "Arunachal Pradesh"],
    },
    "indo_gangetic_plain": {
        "name": "Indo-Gangetic plain",
        "states": ["Punjab", "Haryana", "Chandigarh", "Delhi", "Uttar Pradesh", "Bihar", "West Bengal"],
    },
    "west_arid": {
        "name": "West and arid India",
        "states": ["Rajasthan", "Gujarat", "Dadra and Nagar Haveli and Daman and Diu"],
    },
    "central_deccan": {
        "name": "Central and Deccan India",
        "states": ["Madhya Pradesh", "Chhattisgarh", "Jharkhand", "Maharashtra", "Telangana"],
    },
    "south_peninsula": {
        "name": "South peninsula",
        "states": ["Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Goa"],
    },
    "northeast_hills": {
        "name": "Northeast hills",
        "states": ["Assam", "Meghalaya", "Nagaland", "Manipur", "Mizoram", "Tripura"],
    },
}


def days_in_month(year, month):
    return [31, 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28,
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]


def source_slug(value):
    out = []
    for ch in str(value).lower():
        out.append(ch if ch.isalnum() else "_")
    return "_".join("".join(out).split("_")).strip("_")


def load_states():
    print("loading India state polygons...")
    g = gpd.read_file(GEOJSON_URL)
    states = g.dissolve(by="st_nm", as_index=False)[["st_nm", "geometry"]]
    states["geometry"] = states.geometry.simplify(0.03, preserve_topology=True)
    return states.reset_index(drop=True)


def fetch_monthly_var(cds_var, short_name):
    os.makedirs(SNAP_DIR, exist_ok=True)
    target = os.path.join(SNAP_DIR, f"era5_regional_{short_name}_{START}_{END}.nc")
    if os.path.exists(target) and os.environ.get("ERA5_REGION_FORCE") != "1":
        print(f"using cached {target}")
        return target

    print(f"downloading ERA5 monthly {cds_var} for {START}-{END}...")
    years = [str(y) for y in range(START, END + 1)]
    months = [f"{m:02d}" for m in range(1, 13)]
    tmp = os.path.join(tempfile.gettempdir(), f"era5_regional_{short_name}_{START}_{END}.nc")
    if os.path.exists(tmp):
        os.remove(tmp)
    cdsapi.Client().retrieve(
        "reanalysis-era5-single-levels-monthly-means",
        {
            "product_type": ["monthly_averaged_reanalysis"],
            "variable": [cds_var],
            "year": years,
            "month": months,
            "time": ["00:00"],
            "area": BBOX,
            "data_format": "netcdf",
            "download_format": "unarchived",
        },
        tmp,
    )
    os.replace(tmp, target)
    return target


def fetch_t2m():
    return fetch_monthly_var("2m_temperature", "t2m")


def monthly_region_mean(da, mask, region_index, transform=None):
    cell = mask == region_index
    if not bool(cell.any()):
        return {}
    wlat = np.cos(np.deg2rad(da["latitude"]))
    weight = (wlat * cell).fillna(0)
    series = da.weighted(weight).mean(dim=["latitude", "longitude"]).values
    times = pd.to_datetime(da["valid_time"].values if "valid_time" in da.coords else da[da.dims[0]].values)
    monthly = {}
    for value, t in zip(series, times):
        year = int(t.year)
        month = int(t.month)
        raw = float(value)
        monthly[(year, month)] = transform(raw, year, month) if transform else raw
    return monthly


def annual_from_monthly(monthly, mode="mean"):
    by_year = collections.defaultdict(list)
    for (year, month), value in monthly.items():
        by_year[year].append((value, days_in_month(year, month)))
    annual = {}
    for year, values in by_year.items():
        if len(values) != 12:
            continue
        if mode == "sum":
            annual[year] = sum(value for value, _ in values)
        else:
            total_days = sum(days for _, days in values)
            annual[year] = sum(value * days for value, days in values) / total_days
    return annual


def annual_region_mean(t2m, mask, region_index):
    return annual_from_monthly(monthly_region_mean(t2m, mask, region_index, kelvin_to_c))


def seasonal_from_monthly(monthly, season, mode="mean"):
    seasonal = {}
    for year in sorted({year for year, _ in monthly}):
        values = []
        for month in season["months"]:
            if (year, month) in monthly:
                values.append((monthly[(year, month)], days_in_month(year, month)))
        if len(values) != len(season["months"]):
            continue
        if mode == "sum":
            seasonal[year] = sum(value for value, _ in values)
        else:
            total_days = sum(days for _, days in values)
            seasonal[year] = sum(value * days for value, days in values) / total_days
    return seasonal


def kelvin_to_c(value, year, month):
    return value - 273.15


def precip_m_per_day_to_monthly_mm(value, year, month):
    return value * 1000.0 * days_in_month(year, month)


def rh_from_temp_dewpoint(temp_c, dewpoint_c):
    def es(tc):
        return 6.112 * math.exp(17.67 * tc / (tc + 243.5))
    return min(100.0, 100.0 * es(dewpoint_c) / es(temp_c))


def rh_monthly(temp_monthly, dewpoint_monthly):
    out = {}
    for key, temp_c in temp_monthly.items():
        if key in dewpoint_monthly:
            out[key] = rh_from_temp_dewpoint(temp_c, dewpoint_monthly[key])
    return out


def observations(values_by_year):
    return [{"date": str(year), "value": round(value, 3)} for year, value in sorted(values_by_year.items())]


def anomaly_observations(values_by_year):
    baseline_values = [values_by_year[y] for y in BASELINE if y in values_by_year]
    if len(baseline_values) < 20:
        return []
    base = sum(baseline_values) / len(baseline_values)
    return [{"date": str(year), "value": round(value - base, 3)} for year, value in sorted(values_by_year.items())]


def pct_anomaly_observations(values_by_year):
    baseline_values = [values_by_year[y] for y in BASELINE if y in values_by_year]
    if len(baseline_values) < 20:
        return []
    base = sum(baseline_values) / len(baseline_values)
    if not base:
        return []
    return [{"date": str(year), "value": round((value - base) / base * 100.0, 2)} for year, value in sorted(values_by_year.items())]


def write_artifact(path_name, indicator_id, title, unit, obs, geography, source_indicator, metadata):
    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "era5",
        "sourceIndicatorId": source_indicator,
        "sourceUrl": SOURCE_URL,
        "unit": unit,
        "frequency": "annual",
        "geography": geography,
        "dimensions": ["date", "value"],
        "fetchedAt": FETCHED_AT,
        "observations": obs,
        "metadata": metadata,
    }
    os.makedirs(SERIES_DIR, exist_ok=True)
    path = os.path.join(SERIES_DIR, f"{path_name}.json")
    with open(path, "w") as f:
        json.dump(artifact, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return path


def project_factory(states):
    lonmin, latmin, lonmax, latmax = states.total_bounds

    def project(lon, lat):
        x = (lon - lonmin) / (lonmax - lonmin) * VB_W
        y = (latmax - lat) / (latmax - latmin) * VB_H
        return x, y

    return project


def geom_to_path(geom, project):
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


def write_choropleth(states, state_annual):
    project = project_factory(states)
    regions = []
    for _, row in states.iterrows():
        name = row["st_nm"]
        annual = state_annual.get(name, {})
        early = [annual[y] for y in EARLY if y in annual]
        recent = [annual[y] for y in RECENT if y in annual]
        if not early or not recent:
            continue
        regions.append({
            "name": name,
            "value": round(sum(recent) / len(recent) - sum(early) / len(early), 2),
            "path": geom_to_path(row.geometry, project),
        })
    vals = [r["value"] for r in regions]
    artifact = {
        "schemaVersion": 1,
        "artifactType": "choropleth",
        "indicatorId": "climate.era5.state_warming_1940s_to_recent",
        "title": "State warming since the 1940s",
        "sourceId": "era5",
        "sourceIndicatorId": "2m_temperature state warming, 2015-2024 minus 1940-1949",
        "sourceUrl": SOURCE_URL,
        "unit": "°C",
        "geography": {"type": "subnational", "id": "IND-states", "name": "India states and union territories"},
        "fetchedAt": FETCHED_AT,
        "viewBox": f"0 0 {VB_W} {VB_H}",
        "min": round(min(vals), 2),
        "max": round(max(vals), 2),
        "regions": sorted(regions, key=lambda r: -r["value"]),
        "metadata": {
            "early": "1940-1949 mean",
            "recent": "2015-2024 mean",
            "method": "ERA5 monthly 2m temperature, day-weighted annual mean, regionmask state polygons, cosine-latitude weighted",
        },
    }
    path = os.path.join(SERIES_DIR, "era5.IN.climate.era5.state_warming_1940s_to_recent.json")
    with open(path, "w") as f:
        json.dump(artifact, f, ensure_ascii=False)
        f.write("\n")
    return path


def main():
    if END < START:
        raise SystemExit("ERA5_REGION_END must be >= ERA5_REGION_START")

    states = load_states()
    t2m_path = fetch_t2m()
    d2m_path = fetch_monthly_var("2m_dewpoint_temperature", "d2m")
    tp_path = fetch_monthly_var("total_precipitation", "tp")
    t2m = xr.open_dataset(t2m_path, engine="netcdf4")["t2m"]
    d2m = xr.open_dataset(d2m_path, engine="netcdf4")["d2m"]
    tp = xr.open_dataset(tp_path, engine="netcdf4")["tp"]

    print("masking ERA5 grid to states...")
    state_regions = regionmask.from_geopandas(states, names="st_nm", name="india_states", overlap=False)
    state_mask = state_regions.mask(t2m["longitude"], t2m["latitude"])

    state_annual = {}
    written = []
    for idx, row in states.iterrows():
        name = row["st_nm"]
        annual = annual_region_mean(t2m, state_mask, idx)
        if not annual:
            continue
        state_annual[name] = annual
        slug = source_slug(name)
        geography = {"type": "subnational", "id": f"IND-{slug}", "name": name}
        meta = {
            "bbox_NWSE": BBOX,
            "baseline": "1991-2020 mean for anomaly series",
            "method": "ERA5 monthly 2m temperature, day-weighted annual mean, state polygon mask, cosine-latitude weighted",
        }
        written.append(write_artifact(
            f"era5.IN.climate.era5.state.{slug}.temp_mean",
            f"climate.era5.state.{slug}.temp_mean",
            f"{name} average temperature (ERA5)",
            "°C",
            observations(annual),
            geography,
            "2m_temperature state annual mean",
            meta,
        ))
        written.append(write_artifact(
            f"era5.IN.climate.era5.state.{slug}.temp_anomaly_1991_2020",
            f"climate.era5.state.{slug}.temp_anomaly_1991_2020",
            f"{name} temperature anomaly, 1991-2020 baseline (ERA5)",
            "°C vs 1991-2020",
            anomaly_observations(annual),
            geography,
            "2m_temperature state annual anomaly",
            meta,
        ))

    print("building broad-region composites...")
    region_rows = []
    region_specs = {
        "all_india": {"name": "All India", "states": list(states["st_nm"])},
        **REGIONS,
    }
    for key, spec in region_specs.items():
        subset = states[states["st_nm"].isin(spec["states"])].copy()
        if subset.empty:
            continue
        dissolved = subset.dissolve().reset_index(drop=True)
        dissolved["region_name"] = spec["name"]
        regions = regionmask.from_geopandas(dissolved, names="region_name", name=key, overlap=False)
        mask = regions.mask(t2m["longitude"], t2m["latitude"])
        monthly = monthly_region_mean(t2m, mask, 0, kelvin_to_c)
        dew_monthly = monthly_region_mean(d2m, mask, 0, kelvin_to_c)
        precip_monthly = monthly_region_mean(tp, mask, 0, precip_m_per_day_to_monthly_mm)
        rh = rh_monthly(monthly, dew_monthly)
        annual = annual_from_monthly(monthly)
        dew_annual = annual_from_monthly(dew_monthly)
        precip_annual = annual_from_monthly(precip_monthly, "sum")
        rh_annual = annual_from_monthly(rh)
        if not annual:
            continue
        geography = {"type": "region", "id": f"IND-{key}", "name": spec["name"]}
        meta = {
            "bbox_NWSE": BBOX,
            "states": spec["states"],
            "baseline": "1991-2020 mean for anomaly series",
            "method": "ERA5 monthly 2m temperature, day-weighted annual mean, dissolved state/UT polygons, cosine-latitude weighted",
        }
        written.append(write_artifact(
            f"era5.IN.climate.era5.region.{key}.temp_anomaly_1991_2020",
            f"climate.era5.region.{key}.temp_anomaly_1991_2020",
            f"{spec['name']} temperature anomaly, 1991-2020 baseline (ERA5)",
            "°C vs 1991-2020",
            anomaly_observations(annual),
            geography,
            "2m_temperature broad-region annual anomaly",
            meta,
        ))
        written.append(write_artifact(
            f"era5.IN.climate.era5.region.{key}.dewpoint_mean",
            f"climate.era5.region.{key}.dewpoint_mean",
            f"{spec['name']} average dew point (ERA5)",
            "°C",
            observations(dew_annual),
            geography,
            "2m_dewpoint_temperature broad-region annual mean",
            {**meta, "method": "ERA5 monthly 2m dew point, day-weighted annual mean, dissolved state/UT polygons, cosine-latitude weighted"},
        ))
        written.append(write_artifact(
            f"era5.IN.climate.era5.region.{key}.rel_humidity_mean",
            f"climate.era5.region.{key}.rel_humidity_mean",
            f"{spec['name']} average relative humidity (ERA5, derived)",
            "%",
            observations(rh_annual),
            geography,
            "derived:t2m+d2m broad-region annual mean",
            {**meta, "formula": "Magnus relative humidity from monthly mean 2m temperature and dew point"},
        ))
        written.append(write_artifact(
            f"era5.IN.climate.era5.region.{key}.precip_total",
            f"climate.era5.region.{key}.precip_total",
            f"{spec['name']} total annual precipitation (ERA5)",
            "mm",
            observations(precip_annual),
            geography,
            "total_precipitation broad-region annual total",
            {**meta, "method": "ERA5 monthly mean daily precipitation converted to monthly totals in mm, then summed by year"},
        ))
        written.append(write_artifact(
            f"era5.IN.climate.era5.region.{key}.precip_anomaly_pct_1991_2020",
            f"climate.era5.region.{key}.precip_anomaly_pct_1991_2020",
            f"{spec['name']} precipitation anomaly, 1991-2020 baseline (ERA5)",
            "% vs 1991-2020",
            pct_anomaly_observations(precip_annual),
            geography,
            "total_precipitation broad-region annual percent anomaly",
            {**meta, "method": "Annual precipitation total compared with the 1991-2020 regional annual mean"},
        ))
        for season in SEASONS:
            seasonal = seasonal_from_monthly(monthly, season)
            dew_seasonal = seasonal_from_monthly(dew_monthly, season)
            precip_seasonal = seasonal_from_monthly(precip_monthly, season, "sum")
            rh_seasonal = seasonal_from_monthly(rh, season)
            written.append(write_artifact(
                f"era5.IN.climate.era5.region.{key}.temp_anomaly_{season['id']}_1991_2020",
                f"climate.era5.region.{key}.temp_anomaly_{season['id']}_1991_2020",
                f"{spec['name']} {season['name'].lower()} temperature anomaly, 1991-2020 baseline (ERA5)",
                "°C vs 1991-2020",
                anomaly_observations(seasonal),
                geography,
                f"2m_temperature broad-region {season['name']} anomaly",
                {
                    **meta,
                    "months": season["months"],
                    "method": f"ERA5 monthly 2m temperature, day-weighted {season['name']} mean, dissolved state/UT polygons, cosine-latitude weighted",
                },
            ))
            written.append(write_artifact(
                f"era5.IN.climate.era5.region.{key}.dewpoint_mean_{season['id']}",
                f"climate.era5.region.{key}.dewpoint_mean_{season['id']}",
                f"{spec['name']} {season['name'].lower()} average dew point (ERA5)",
                "°C",
                observations(dew_seasonal),
                geography,
                f"2m_dewpoint_temperature broad-region {season['name']} mean",
                {
                    **meta,
                    "months": season["months"],
                    "method": f"ERA5 monthly 2m dew point, day-weighted {season['name']} mean, dissolved state/UT polygons, cosine-latitude weighted",
                },
            ))
            written.append(write_artifact(
                f"era5.IN.climate.era5.region.{key}.rel_humidity_mean_{season['id']}",
                f"climate.era5.region.{key}.rel_humidity_mean_{season['id']}",
                f"{spec['name']} {season['name'].lower()} average relative humidity (ERA5, derived)",
                "%",
                observations(rh_seasonal),
                geography,
                f"derived:t2m+d2m broad-region {season['name']} mean",
                {
                    **meta,
                    "months": season["months"],
                    "formula": "Magnus relative humidity from monthly mean 2m temperature and dew point",
                },
            ))
            written.append(write_artifact(
                f"era5.IN.climate.era5.region.{key}.precip_total_{season['id']}",
                f"climate.era5.region.{key}.precip_total_{season['id']}",
                f"{spec['name']} {season['name'].lower()} total precipitation (ERA5)",
                "mm",
                observations(precip_seasonal),
                geography,
                f"total_precipitation broad-region {season['name']} total",
                {
                    **meta,
                    "months": season["months"],
                    "method": f"ERA5 monthly mean daily precipitation converted to monthly totals in mm, then summed across {season['name']} months",
                },
            ))
            written.append(write_artifact(
                f"era5.IN.climate.era5.region.{key}.precip_anomaly_pct_{season['id']}_1991_2020",
                f"climate.era5.region.{key}.precip_anomaly_pct_{season['id']}_1991_2020",
                f"{spec['name']} {season['name'].lower()} precipitation anomaly, 1991-2020 baseline (ERA5)",
                "% vs 1991-2020",
                pct_anomaly_observations(precip_seasonal),
                geography,
                f"total_precipitation broad-region {season['name']} percent anomaly",
                {
                    **meta,
                    "months": season["months"],
                    "method": f"{season['name']} precipitation total compared with the 1991-2020 regional {season['name']} mean",
                },
            ))
        early = [annual[y] for y in EARLY if y in annual]
        recent = [annual[y] for y in RECENT if y in annual]
        region_rows.append((spec["name"], sum(recent) / len(recent) - sum(early) / len(early)))

    choro_path = write_choropleth(states, state_annual)
    print(f"wrote {len(written)} series artifacts")
    print(f"wrote {choro_path}")
    if region_rows:
        print("regional warming, 2015-2024 minus 1940-1949:")
        for name, value in sorted(region_rows, key=lambda x: -x[1]):
            print(f"  {name}: {value:.2f} C")


if __name__ == "__main__":
    main()
