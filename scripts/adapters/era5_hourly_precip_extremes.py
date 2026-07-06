#!/usr/bin/env python3
"""ERA5 hourly-derived precipitation extremes for India and broad regions.

Fetches hourly ERA5 total precipitation for an India bbox, sums hourly values
into local daily totals, then writes annual region-level rainfall exposure
series. Downloads are cached month-by-month and yearly checkpoints make long
backfills restartable.
"""

import collections
import datetime
import fcntl
import json
import os
import tempfile

import cdsapi
import geopandas as gpd
import numpy as np
import pandas as pd
import regionmask
import xarray as xr


START = int(os.environ.get("ERA5_PRECIP_START", "1980"))
DEFAULT_END = datetime.datetime.now(datetime.UTC).year - 1
END = int(os.environ.get("ERA5_PRECIP_END", str(DEFAULT_END)))
MONTH_START = int(os.environ.get("ERA5_PRECIP_MONTH_START", "1"))
MONTH_END = int(os.environ.get("ERA5_PRECIP_MONTH_END", "12"))
RUN_MONTHS = list(range(MONTH_START, MONTH_END + 1))
BBOX = [37, 68, 6, 98]  # N, W, S, E
FETCHED_AT = datetime.datetime.now(datetime.UTC).isoformat()
SERIES_DIR = "data/series"
SNAP_DIR = "data/snapshots/era5"
CHECKPOINT_DIR = os.path.join(SNAP_DIR, "hourly_precip_years")
MERGE_LOCK = os.path.join(SNAP_DIR, "era5_hourly_precip_extremes.merge.lock")
SOURCE_URL = "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels"
GEOJSON_URL = "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson"
DATASET = "reanalysis-era5-single-levels"
DAYS = [f"{d:02d}" for d in range(1, 32)]
TIMES = [f"{h:02d}:00" for h in range(24)]
MONSOON_MONTHS = {6, 7, 8, 9}

REGIONS = {
    "all_india": {"name": "All India", "states": None},
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

METRICS = {
    "annual_total_mm": {"title": "annual precipitation", "unit": "mm"},
    "monsoon_total_mm": {"title": "June-September precipitation", "unit": "mm"},
    "monsoon_share_pct": {"title": "share of annual precipitation falling in June-September", "unit": "%"},
    "wet_days_1mm": {"title": "wet days with precipitation at or above 1 mm", "unit": "days per year", "threshold": 1.0},
    "heavy_days_50mm": {"title": "heavy-rain days with precipitation at or above 50 mm", "unit": "days per year", "threshold": 50.0},
    "extreme_days_100mm": {"title": "extreme-rain days with precipitation at or above 100 mm", "unit": "days per year", "threshold": 100.0},
    "max_1day_mm": {"title": "wettest single day", "unit": "mm"},
    "max_5day_mm": {"title": "wettest 5-day spell", "unit": "mm"},
}


def load_states():
    print("loading India state polygons...")
    g = gpd.read_file(GEOJSON_URL)
    states = g.dissolve(by="st_nm", as_index=False)[["st_nm", "geometry"]]
    states["geometry"] = states.geometry.simplify(0.03, preserve_topology=True)
    return states.reset_index(drop=True)


def fetch_hourly_month(year, month):
    os.makedirs(SNAP_DIR, exist_ok=True)
    target = os.path.join(SNAP_DIR, f"era5_hourly_precip_{year}_{month:02d}.nc")
    if os.path.exists(target) and os.environ.get("ERA5_PRECIP_FORCE") != "1":
        print(f"using cached {target}")
        return target

    tmp = os.path.join(tempfile.gettempdir(), f"era5_hourly_precip_{year}_{month:02d}.nc")
    if os.path.exists(tmp):
        os.remove(tmp)
    print(f"downloading ERA5 hourly total_precipitation for {year}-{month:02d}...", flush=True)
    cdsapi.Client().retrieve(
        DATASET,
        {
            "product_type": ["reanalysis"],
            "variable": ["total_precipitation"],
            "year": [str(year)],
            "month": [f"{month:02d}"],
            "day": DAYS,
            "time": TIMES,
            "area": BBOX,
            "data_format": "netcdf",
            "download_format": "unarchived",
        },
        tmp,
    )
    os.replace(tmp, target)
    return target


def time_dim(da):
    for name in ["valid_time", "time"]:
        if name in da.dims:
            return name
    return da.dims[0]


def daily_precip_mm(ds):
    tp = ds["tp"] * 1000.0
    dim = time_dim(tp)
    if dim != "time":
        tp = tp.rename({dim: "time"})
    return tp.resample(time="1D").sum()


def region_masks(states, lon, lat):
    masks = {}
    for key, spec in REGIONS.items():
        subset = states if spec["states"] is None else states[states["st_nm"].isin(spec["states"])].copy()
        if subset.empty:
            continue
        dissolved = subset.dissolve().reset_index(drop=True)
        dissolved["region_name"] = spec["name"]
        regions = regionmask.from_geopandas(dissolved, names="region_name", name=key, overlap=False)
        masks[key] = regions.mask(lon, lat) == 0
    return masks


def weights_for(daily, mask):
    return (np.cos(np.deg2rad(daily["latitude"])) * mask.fillna(0)).fillna(0)


def weighted_mean(da, mask):
    return float(da.where(mask).weighted(weights_for(da, mask)).mean(dim=["latitude", "longitude"]).values)


def weighted_region_count(daily, mask, threshold):
    over = (daily >= threshold).where(mask).sum(dim="time")
    return weighted_mean(over, mask)


def load_year_daily(paths):
    daily_parts = []
    for path in paths:
        ds = xr.open_dataset(path, engine="netcdf4")
        daily_parts.append(daily_precip_mm(ds).load())
        ds.close()
    return xr.concat(daily_parts, dim="time").sortby("time")


def accumulate_year(paths, states, masks, year_values):
    daily = load_year_daily(paths)
    if masks is None:
        masks = region_masks(states, daily["longitude"], daily["latitude"])
    dates = pd.to_datetime(daily["time"].values)
    monsoon_daily = daily.sel(time=[t.month in MONSOON_MONTHS for t in dates])
    rolling_5day = daily.rolling(time=5, min_periods=5).sum()

    for region_key, mask in masks.items():
        region = year_values[region_key]
        region["annual_total_mm"] += weighted_mean(daily.sum(dim="time"), mask)
        region["monsoon_total_mm"] += weighted_mean(monsoon_daily.sum(dim="time"), mask) if monsoon_daily.sizes["time"] else 0.0
        region["wet_days_1mm"] += weighted_region_count(daily, mask, METRICS["wet_days_1mm"]["threshold"])
        region["heavy_days_50mm"] += weighted_region_count(daily, mask, METRICS["heavy_days_50mm"]["threshold"])
        region["extreme_days_100mm"] += weighted_region_count(daily, mask, METRICS["extreme_days_100mm"]["threshold"])
        region["max_1day_mm"] = max(region["max_1day_mm"], weighted_mean(daily.max(dim="time"), mask))
        if rolling_5day.sizes["time"]:
            region["max_5day_mm"] = max(region["max_5day_mm"], weighted_mean(rolling_5day.max(dim="time"), mask))
    daily.close()
    return masks


def observations(values_by_year):
    return [{"date": str(year), "value": round(value, 1)} for year, value in sorted(values_by_year.items())]


def write_artifact(region_key, metric_key, obs):
    spec = REGIONS[region_key]
    metric = METRICS[metric_key]
    path_name = f"era5.IN.climate.era5.hourly_precip.region.{region_key}.{metric_key}"
    indicator_id = f"climate.era5.hourly_precip.region.{region_key}.{metric_key}"
    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": f"{spec['name']} {metric['title']} (ERA5 hourly-derived)",
        "sourceId": "era5",
        "sourceIndicatorId": f"ERA5 hourly total_precipitation, {metric_key}",
        "sourceUrl": SOURCE_URL,
        "unit": metric["unit"],
        "frequency": "annual",
        "geography": {"type": "region", "id": f"IND-{region_key}", "name": spec["name"]},
        "dimensions": ["date", "value"],
        "fetchedAt": FETCHED_AT,
        "observations": obs,
        "metadata": {
            "bbox_NWSE": BBOX,
            "states": spec["states"],
            "method": "Hourly ERA5 total precipitation summed to daily totals, then cosine-latitude-weighted across dissolved Indian state/UT polygons.",
            "threshold_mm": metric.get("threshold"),
            "note": "Precipitation is a gridded reanalysis estimate, not a rain-gauge station series. Use IMD rainfall alongside it where station-observed rainfall is needed.",
        },
    }
    os.makedirs(SERIES_DIR, exist_ok=True)
    path = os.path.join(SERIES_DIR, f"{path_name}.json")
    with open(path, "w") as f:
        json.dump(artifact, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return path


def write_all_artifacts(values):
    written = []
    for region_key, region_metrics in values.items():
        for metric_key, yearly in region_metrics.items():
            if yearly:
                written.append(write_artifact(region_key, metric_key, observations(yearly)))
    return written


def checkpoint_path(year):
    return os.path.join(CHECKPOINT_DIR, f"{year}.json")


def write_year_checkpoint(year, year_values):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    path = checkpoint_path(year)
    tmp = f"{path}.tmp.{os.getpid()}"
    payload = {"year": year, "fetchedAt": FETCHED_AT, "regions": year_values}
    with open(tmp, "w") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)
    return path


def load_year_checkpoint(year):
    path = checkpoint_path(year)
    if not os.path.exists(path):
        return None
    with open(path) as f:
        payload = json.load(f)
    return payload.get("regions")


def collect_checkpoint_values():
    values = {region: {metric: {} for metric in METRICS} for region in REGIONS}
    if not os.path.isdir(CHECKPOINT_DIR):
        return values
    for name in sorted(os.listdir(CHECKPOINT_DIR)):
        if not name.endswith(".json"):
            continue
        year = int(name[:-5])
        with open(os.path.join(CHECKPOINT_DIR, name)) as f:
            payload = json.load(f)
        regions = payload.get("regions", {})
        for region_key in REGIONS:
            for metric_key in METRICS:
                value = regions.get(region_key, {}).get(metric_key)
                if value is not None:
                    values[region_key][metric_key][year] = float(value)
    return values


def merge_checkpoint_artifacts():
    os.makedirs(SNAP_DIR, exist_ok=True)
    with open(MERGE_LOCK, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        written = write_all_artifacts(collect_checkpoint_values())
        fcntl.flock(lock, fcntl.LOCK_UN)
    return written


def empty_year_values():
    return {
        region: {
            "annual_total_mm": 0.0,
            "monsoon_total_mm": 0.0,
            "monsoon_share_pct": 0.0,
            "wet_days_1mm": 0.0,
            "heavy_days_50mm": 0.0,
            "extreme_days_100mm": 0.0,
            "max_1day_mm": 0.0,
            "max_5day_mm": 0.0,
        }
        for region in REGIONS
    }


def finalize_year_values(year_values):
    for region_values in year_values.values():
        total = region_values["annual_total_mm"]
        monsoon = region_values["monsoon_total_mm"]
        region_values["monsoon_share_pct"] = 100.0 * monsoon / total if total > 0 else None


def main():
    if END < START:
        raise SystemExit("ERA5_PRECIP_END must be >= ERA5_PRECIP_START")

    states = load_states()
    masks = None

    for year in range(START, END + 1):
        if load_year_checkpoint(year) is not None and os.environ.get("ERA5_PRECIP_FORCE") != "1":
            print(f"{year}: using yearly checkpoint")
            continue
        year_values = empty_year_values()
        paths = []
        complete_months = 0
        for month in RUN_MONTHS:
            path = fetch_hourly_month(year, month)
            paths.append(path)
            complete_months += 1
        if complete_months != len(RUN_MONTHS):
            print(f"{year}: skipped, only {complete_months} complete requested months")
            continue
        masks = accumulate_year(paths, states, masks, year_values)
        finalize_year_values(year_values)
        print(
            f"{year} months {MONTH_START}-{MONTH_END}: all-India rain {year_values['all_india']['annual_total_mm']:.1f} mm; "
            f"heavy days>=50mm {year_values['all_india']['heavy_days_50mm']:.1f}; "
            f"wettest 5-day spell {year_values['all_india']['max_5day_mm']:.1f} mm",
            flush=True,
        )
        if RUN_MONTHS == list(range(1, 13)):
            write_year_checkpoint(year, year_values)
            written = merge_checkpoint_artifacts()
            print(f"{year}: checkpoint merged {len(written)} annual artifacts", flush=True)

    if RUN_MONTHS != list(range(1, 13)):
        print("partial month range requested; not writing annual artifacts", flush=True)
        return

    written = merge_checkpoint_artifacts()
    print(f"wrote {len(written)} hourly-derived ERA5 precipitation-extreme artifacts")
    for path in written[:8]:
        print(path)


if __name__ == "__main__":
    main()
