#!/usr/bin/env python3
"""ERA5 hourly-derived heat extremes for India and broad regions.

This replaces the older `era5_daily_exposure.py` path that used CDS'
post-processed daily statistics. As of 2026-06-11, CDS warns that some
post-processed daily max/min products should not be used. Here we fetch hourly
ERA5 2m temperature and dew point, compute daily extremes locally, then aggregate
annual exposure days over India and broad regions.

Default range is 1980 through the last complete calendar year. Downloads are
cached month-by-month under data/snapshots/era5 so a long backfill can resume.
"""

import datetime
import fcntl
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


START = int(os.environ.get("ERA5_HOURLY_START", "1980"))
DEFAULT_END = datetime.datetime.now(datetime.UTC).year - 1
END = int(os.environ.get("ERA5_HOURLY_END", str(DEFAULT_END)))
MONTH_START = int(os.environ.get("ERA5_HOURLY_MONTH_START", "1"))
MONTH_END = int(os.environ.get("ERA5_HOURLY_MONTH_END", "12"))
RUN_MONTHS = list(range(MONTH_START, MONTH_END + 1))
CHUNK = os.environ.get("ERA5_HOURLY_CHUNK", "month")
BBOX = [37, 68, 6, 98]  # N, W, S, E
HOTDAY_C = float(os.environ.get("ERA5_HOURLY_HOTDAY_C", "40"))
WARMNIGHT_C = float(os.environ.get("ERA5_HOURLY_WARMNIGHT_C", "26"))
HOTNIGHT_C = float(os.environ.get("ERA5_HOURLY_HOTNIGHT_C", "28"))
HEATINDEX_C = float(os.environ.get("ERA5_HOURLY_HEATINDEX_C", "40"))
WETBULB_C = float(os.environ.get("ERA5_HOURLY_WETBULB_C", "30"))
FETCHED_AT = datetime.datetime.now(datetime.UTC).isoformat()
SERIES_DIR = "data/series"
SNAP_DIR = "data/snapshots/era5"
CHECKPOINT_DIR = os.path.join(SNAP_DIR, "hourly_heat_years")
MERGE_LOCK = os.path.join(SNAP_DIR, "era5_hourly_heat_extremes.merge.lock")
SOURCE_URL = "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels"
GEOJSON_URL = "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson"
DATASET = "reanalysis-era5-single-levels"
MONTHS = [f"{m:02d}" for m in range(1, 13)]
DAYS = [f"{d:02d}" for d in range(1, 32)]
TIMES = [f"{h:02d}:00" for h in range(24)]

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
    "hot_days_40": {
        "title": "hot days with hourly maximum temperature at or above 40C",
        "unit": "days per year",
        "threshold": HOTDAY_C,
    },
    "warm_nights_26": {
        "title": "warm nights with hourly minimum temperature at or above 26C",
        "unit": "nights per year",
        "threshold": WARMNIGHT_C,
    },
    "hot_nights_28": {
        "title": "hot nights with hourly minimum temperature at or above 28C",
        "unit": "nights per year",
        "threshold": HOTNIGHT_C,
    },
    "humid_heat_days_40": {
        "title": "humid-heat days with hourly heat index at or above 40C",
        "unit": "days per year",
        "threshold": HEATINDEX_C,
    },
    "wetbulb_days_30": {
        "title": "humid-heat days with hourly wet-bulb temperature at or above 30C",
        "unit": "days per year",
        "threshold": WETBULB_C,
    },
}


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


def fetch_hourly_month(year, month):
    os.makedirs(SNAP_DIR, exist_ok=True)
    target = os.path.join(SNAP_DIR, f"era5_hourly_heat_{year}_{month:02d}.nc")
    if os.path.exists(target) and os.environ.get("ERA5_HOURLY_FORCE") != "1":
        print(f"using cached {target}")
        return target

    tmp = os.path.join(tempfile.gettempdir(), f"era5_hourly_heat_{year}_{month:02d}.nc")
    if os.path.exists(tmp):
        os.remove(tmp)
    print(f"downloading ERA5 hourly t2m+d2m for {year}-{month:02d}...", flush=True)
    cdsapi.Client().retrieve(
        DATASET,
        {
            "product_type": ["reanalysis"],
            "variable": ["2m_temperature", "2m_dewpoint_temperature"],
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


def fetch_hourly_year(year):
    os.makedirs(SNAP_DIR, exist_ok=True)
    target = os.path.join(SNAP_DIR, f"era5_hourly_heat_{year}_annual.nc")
    if os.path.exists(target) and os.environ.get("ERA5_HOURLY_FORCE") != "1":
        print(f"using cached {target}")
        return target

    tmp = os.path.join(tempfile.gettempdir(), f"era5_hourly_heat_{year}_annual.nc")
    if os.path.exists(tmp):
        os.remove(tmp)
    print(f"downloading ERA5 hourly t2m+d2m for {year} annual chunk...", flush=True)
    cdsapi.Client().retrieve(
        DATASET,
        {
            "product_type": ["reanalysis"],
            "variable": ["2m_temperature", "2m_dewpoint_temperature"],
            "year": [str(year)],
            "month": MONTHS,
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


def kelvin_to_c(da):
    return da - 273.15


def saturation_vapor_pressure(temp_c):
    return 6.112 * np.exp(17.67 * temp_c / (temp_c + 243.5))


def relative_humidity(temp_c, dewpoint_c):
    rh = 100.0 * saturation_vapor_pressure(dewpoint_c) / saturation_vapor_pressure(temp_c)
    return rh.clip(min=0, max=100)


def heat_index_c(temp_c, rh):
    """NOAA Rothfusz heat index in C, using air temperature when formula is out of range."""
    t_f = temp_c * 9 / 5 + 32
    hi_f = (
        -42.379
        + 2.04901523 * t_f
        + 10.14333127 * rh
        - 0.22475541 * t_f * rh
        - 0.00683783 * t_f * t_f
        - 0.05481717 * rh * rh
        + 0.00122874 * t_f * t_f * rh
        + 0.00085282 * t_f * rh * rh
        - 0.00000199 * t_f * t_f * rh * rh
    )
    hi_c = (hi_f - 32) * 5 / 9
    return xr.where((temp_c >= 27) & (rh >= 40), hi_c, temp_c)


def wet_bulb_c(temp_c, rh):
    """Stull 2011 approximate wet-bulb temperature in C."""
    return (
        temp_c * np.arctan(0.151977 * np.sqrt(rh + 8.313659))
        + np.arctan(temp_c + rh)
        - np.arctan(rh - 1.676331)
        + 0.00391838 * np.power(rh, 1.5) * np.arctan(0.023101 * rh)
        - 4.686035
    )


def daily_extremes(ds):
    t = kelvin_to_c(ds["t2m"])
    d = kelvin_to_c(ds["d2m"])
    dim = time_dim(t)
    if dim != "time":
        t = t.rename({dim: "time"})
        d = d.rename({dim: "time"})
    rh = relative_humidity(t, d)
    hi = heat_index_c(t, rh)
    wb = wet_bulb_c(t, rh)
    return {
        "hot_days_40": t.resample(time="1D").max(),
        "warm_nights_26": t.resample(time="1D").min(),
        "hot_nights_28": t.resample(time="1D").min(),
        "humid_heat_days_40": hi.resample(time="1D").max(),
        "wetbulb_days_30": wb.resample(time="1D").max(),
    }


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


def weighted_region_count(daily, mask, threshold):
    over = (daily >= threshold).where(mask).sum(dim="time")
    w = np.cos(np.deg2rad(daily["latitude"])) * mask.fillna(0)
    return float(over.weighted(w.fillna(0)).mean(dim=["latitude", "longitude"]).values)


def observations(values_by_year):
    return [{"date": str(year), "value": round(value, 1)} for year, value in sorted(values_by_year.items())]


def write_artifact(region_key, metric_key, obs):
    spec = REGIONS[region_key]
    metric = METRICS[metric_key]
    path_name = f"era5.IN.climate.era5.hourly.region.{region_key}.{metric_key}"
    indicator_id = f"climate.era5.hourly.region.{region_key}.{metric_key}"
    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": f"{spec['name']} {metric['title']} (ERA5 hourly-derived)",
        "sourceId": "era5",
        "sourceIndicatorId": f"ERA5 hourly t2m+d2m, {metric_key}",
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
            "threshold_C": metric["threshold"],
            "method": "Hourly ERA5 2m temperature and dew point, daily extremes computed locally, per-cell threshold day count, cosine-latitude-weighted dissolved state/UT polygons.",
            "heatIndexFormula": "NOAA Rothfusz regression, falling back to air temperature outside usual heat-index range.",
            "wetBulbFormula": "Stull 2011 approximation from hourly 2m temperature and relative humidity derived from dew point.",
            "note": "This avoids CDS post-processed daily max/min products because CDS flagged that product family as affected by a known issue on 2026-06-11.",
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
    payload = {
        "year": year,
        "fetchedAt": FETCHED_AT,
        "regions": year_values,
    }
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


def accumulate_dataset(path, states, masks, year_values):
    ds = xr.open_dataset(path, engine="netcdf4")
    if masks is None:
        masks = region_masks(states, ds["longitude"], ds["latitude"])
    daily = daily_extremes(ds)
    for region_key, mask in masks.items():
        for metric_key, daily_values in daily.items():
            count = weighted_region_count(daily_values, mask, METRICS[metric_key]["threshold"])
            year_values[region_key][metric_key] += count
    ds.close()
    return masks


def seed_checkpoints_from_artifacts():
    seeded = 0
    by_year = {}
    for region_key in REGIONS:
        for metric_key in METRICS:
            path = os.path.join(
                SERIES_DIR,
                f"era5.IN.climate.era5.hourly.region.{region_key}.{metric_key}.json",
            )
            if not os.path.exists(path):
                continue
            with open(path) as f:
                artifact = json.load(f)
            for row in artifact.get("observations", []):
                year = int(row["date"])
                by_year.setdefault(year, {region: {metric: None for metric in METRICS} for region in REGIONS})
                by_year[year][region_key][metric_key] = float(row["value"])

    for year, regions in sorted(by_year.items()):
        if all(regions[region][metric] is not None for region in REGIONS for metric in METRICS):
            write_year_checkpoint(year, regions)
            seeded += 1
    written = merge_checkpoint_artifacts()
    print(f"seeded {seeded} yearly checkpoints from existing artifacts; merged {len(written)} artifacts")


def main():
    if END < START:
        raise SystemExit("ERA5_HOURLY_END must be >= ERA5_HOURLY_START")

    if os.environ.get("ERA5_HOURLY_SEED_CHECKPOINTS") == "1":
        seed_checkpoints_from_artifacts()
        return

    states = load_states()
    masks = None

    for year in range(START, END + 1):
        if load_year_checkpoint(year) is not None and os.environ.get("ERA5_HOURLY_FORCE") != "1":
            print(f"{year}: using yearly checkpoint")
            continue
        year_values = {region: {metric: 0.0 for metric in METRICS} for region in REGIONS}

        if CHUNK == "year":
            if RUN_MONTHS != list(range(1, 13)):
                raise SystemExit("ERA5_HOURLY_CHUNK=year only supports full-year runs")
            path = fetch_hourly_year(year)
            masks = accumulate_dataset(path, states, masks, year_values)
            complete_months = 12
        else:
            complete_months = 0
            for month in RUN_MONTHS:
                path = fetch_hourly_month(year, month)
                masks = accumulate_dataset(path, states, masks, year_values)
                complete_months += 1
        if complete_months != len(RUN_MONTHS):
            print(f"{year}: skipped, only {complete_months} complete requested months")
            continue
        print(
            f"{year} months {MONTH_START}-{MONTH_END}: all-India hot>={HOTDAY_C:.0f}C {year_values['all_india']['hot_days_40']:.1f}; "
            f"warm nights>={WARMNIGHT_C:.0f}C {year_values['all_india']['warm_nights_26']:.1f}; "
            f"humid heat>={HEATINDEX_C:.0f}C {year_values['all_india']['humid_heat_days_40']:.1f}",
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
    print(f"wrote {len(written)} hourly-derived ERA5 heat-extreme artifacts")
    for path in written[:8]:
        print(path)


if __name__ == "__main__":
    main()
