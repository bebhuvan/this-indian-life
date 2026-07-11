#!/usr/bin/env python3
"""Year-to-date ERA5 climate comparison for India and broad regions.

This deliberately writes *separate* YTD artifacts so partial-year 2026 data never
contaminates the completed-year annual climate series.

Default comparison window is January through the last completed calendar month of
the current year. On 2026-06-11, that means Jan-May 2026 compared with Jan-May of
1940-2025.
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


START = int(os.environ.get("ERA5_YTD_START", "1940"))
NOW = datetime.datetime.now(datetime.UTC)
TARGET_YEAR = int(os.environ.get("ERA5_YTD_YEAR", str(NOW.year)))
MONTH_END = int(os.environ.get("ERA5_YTD_MONTH_END", str(max(1, NOW.month - 1))))
MONTHS = list(range(1, MONTH_END + 1))
BBOX = [37, 68, 6, 98]  # N, W, S, E
FETCHED_AT = datetime.datetime.now(datetime.UTC).isoformat()
SERIES_DIR = "data/series"
SNAP_DIR = "data/snapshots/era5"
SOURCE_URL = "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means"
GEOJSON_URL = "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson"
MONTH_LABEL = "Jan-" + datetime.date(2000, MONTH_END, 1).strftime("%b")

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


def days_in_month(year, month):
    return [31, 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28,
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]


def source_slug(value):
    out = []
    for ch in str(value).lower():
        out.append(ch if ch.isalnum() else "_")
    return "_".join("".join(out).split("_")).strip("_")


def load_states():
    g = gpd.read_file(GEOJSON_URL)
    states = g.dissolve(by="st_nm", as_index=False)[["st_nm", "geometry"]]
    states["geometry"] = states.geometry.simplify(0.03, preserve_topology=True)
    return states.reset_index(drop=True)


def fetch_partial(cds_var, short_name):
    os.makedirs(SNAP_DIR, exist_ok=True)
    target = os.path.join(SNAP_DIR, f"era5_ytd_{short_name}_{TARGET_YEAR}_01_{MONTH_END:02d}.nc")
    if os.path.exists(target) and os.environ.get("ERA5_YTD_FORCE") != "1":
        print(f"using cached {target}")
        return target
    tmp = os.path.join(tempfile.gettempdir(), f"era5_ytd_{short_name}_{TARGET_YEAR}_01_{MONTH_END:02d}.nc")
    if os.path.exists(tmp):
        os.remove(tmp)
    print(f"downloading ERA5 {cds_var} for {TARGET_YEAR}-01..{MONTH_END:02d}")
    cdsapi.Client().retrieve(
        "reanalysis-era5-single-levels-monthly-means",
        {
            "product_type": ["monthly_averaged_reanalysis"],
            "variable": [cds_var],
            "year": [str(TARGET_YEAR)],
            "month": [f"{month:02d}" for month in MONTHS],
            "time": ["00:00"],
            "area": BBOX,
            "data_format": "netcdf",
            "download_format": "unarchived",
        },
        tmp,
    )
    os.replace(tmp, target)
    return target


def open_combined(short_name, current_path):
    history_path = os.path.join(SNAP_DIR, f"era5_regional_{short_name}_{START}_{TARGET_YEAR - 1}.nc")
    if not os.path.exists(history_path):
        raise FileNotFoundError(f"Missing historical cache: {history_path}. Run era5_regional_warming.py first.")
    hist = xr.open_dataset(history_path, engine="netcdf4")[short_name]
    cur = xr.open_dataset(current_path, engine="netcdf4")[short_name]
    dim = "valid_time" if "valid_time" in hist.dims else hist.dims[0]
    return xr.concat([hist, cur], dim=dim)


def kelvin_to_c(value, year, month):
    return value - 273.15


def precip_m_per_day_to_monthly_mm(value, year, month):
    return value * 1000.0 * days_in_month(year, month)


def rh_from_temp_dewpoint(temp_c, dewpoint_c):
    def es(tc):
        return 6.112 * math.exp(17.67 * tc / (tc + 243.5))
    return min(100.0, 100.0 * es(dewpoint_c) / es(temp_c))


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
        if year < START or year > TARGET_YEAR or month not in MONTHS:
            continue
        raw = float(value)
        monthly[(year, month)] = transform(raw, year, month) if transform else raw
    return monthly


def ytd_from_monthly(monthly, mode="mean"):
    by_year = collections.defaultdict(list)
    for (year, month), value in monthly.items():
        by_year[year].append((value, days_in_month(year, month)))
    out = {}
    for year, values in by_year.items():
        if len(values) != len(MONTHS):
            continue
        if mode == "sum":
            out[year] = sum(value for value, _ in values)
        else:
            total_days = sum(days for _, days in values)
            out[year] = sum(value * days for value, days in values) / total_days
    return out


def anomaly(values_by_year):
    baseline = [value for year, value in values_by_year.items() if 1991 <= year <= 2020]
    base = sum(baseline) / len(baseline)
    return {year: value - base for year, value in values_by_year.items()}


def pct_anomaly(values_by_year):
    baseline = [value for year, value in values_by_year.items() if 1991 <= year <= 2020]
    base = sum(baseline) / len(baseline)
    return {year: (value - base) / base * 100.0 for year, value in values_by_year.items()}


def observations(values_by_year, digits=3):
    return [{"date": str(year), "value": round(value, digits)} for year, value in sorted(values_by_year.items())]


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
        "frequency": "annual-ytd",
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


def rank(values_by_year, year):
    ordered = sorted(values_by_year.items(), key=lambda item: item[1], reverse=True)
    for idx, (candidate, value) in enumerate(ordered, start=1):
        if candidate == year:
            return idx, value, len(ordered)
    return None, None, len(ordered)


def main():
    if TARGET_YEAR <= START:
        raise SystemExit("ERA5_YTD_YEAR must be after ERA5_YTD_START")
    if not 1 <= MONTH_END <= 12:
        raise SystemExit("ERA5_YTD_MONTH_END must be 1..12")

    states = load_states()
    t2m = open_combined("t2m", fetch_partial("2m_temperature", "t2m"))
    d2m = open_combined("d2m", fetch_partial("2m_dewpoint_temperature", "d2m"))
    tp = open_combined("tp", fetch_partial("total_precipitation", "tp"))

    written = []
    region_summaries = []
    for key, spec in REGIONS.items():
        subset = states if spec["states"] is None else states[states["st_nm"].isin(spec["states"])].copy()
        dissolved = subset.dissolve().reset_index(drop=True)
        dissolved["region_name"] = spec["name"]
        regions = regionmask.from_geopandas(dissolved, names="region_name", name=key, overlap=False)
        mask = regions.mask(t2m["longitude"], t2m["latitude"])

        temp_monthly = monthly_region_mean(t2m, mask, 0, kelvin_to_c)
        dew_monthly = monthly_region_mean(d2m, mask, 0, kelvin_to_c)
        precip_monthly = monthly_region_mean(tp, mask, 0, precip_m_per_day_to_monthly_mm)
        rh_monthly = {
            ym: rh_from_temp_dewpoint(temp, dew_monthly[ym])
            for ym, temp in temp_monthly.items()
            if ym in dew_monthly
        }

        temp = ytd_from_monthly(temp_monthly)
        temp_anom = anomaly(temp)
        dew = ytd_from_monthly(dew_monthly)
        rh = ytd_from_monthly(rh_monthly)
        precip = ytd_from_monthly(precip_monthly, "sum")
        precip_anom = pct_anomaly(precip)

        geography = {"type": "region", "id": f"IND-{key}", "name": spec["name"]}
        meta = {
            "window": MONTH_LABEL,
            "targetYear": TARGET_YEAR,
            "months": MONTHS,
            "baseline": "1991-2020 same-month window",
            "method": "ERA5 monthly means clipped to the same year-to-date month window for every year; partial-year artifact, not an annual value.",
        }

        prefix = f"era5.IN.climate.era5.ytd.{key}"
        id_prefix = f"climate.era5.ytd.{key}"
        written.append(write_artifact(f"{prefix}.temp_mean_{source_slug(MONTH_LABEL)}", f"{id_prefix}.temp_mean_{source_slug(MONTH_LABEL)}", f"{spec['name']} {MONTH_LABEL} mean temperature (ERA5)", "°C", observations(temp), geography, "2m_temperature YTD mean", meta))
        written.append(write_artifact(f"{prefix}.temp_anomaly_{source_slug(MONTH_LABEL)}_1991_2020", f"{id_prefix}.temp_anomaly_{source_slug(MONTH_LABEL)}_1991_2020", f"{spec['name']} {MONTH_LABEL} temperature anomaly (ERA5)", "°C vs 1991-2020", observations(temp_anom), geography, "2m_temperature YTD anomaly", meta))
        written.append(write_artifact(f"{prefix}.dewpoint_mean_{source_slug(MONTH_LABEL)}", f"{id_prefix}.dewpoint_mean_{source_slug(MONTH_LABEL)}", f"{spec['name']} {MONTH_LABEL} average dew point (ERA5)", "°C", observations(dew), geography, "2m_dewpoint_temperature YTD mean", meta))
        written.append(write_artifact(f"{prefix}.rel_humidity_mean_{source_slug(MONTH_LABEL)}", f"{id_prefix}.rel_humidity_mean_{source_slug(MONTH_LABEL)}", f"{spec['name']} {MONTH_LABEL} relative humidity (ERA5, derived)", "%", observations(rh, 2), geography, "derived:t2m+d2m YTD relative humidity", {**meta, "formula": "Magnus relative humidity from monthly mean 2m temperature and dew point"}))
        written.append(write_artifact(f"{prefix}.precip_total_{source_slug(MONTH_LABEL)}", f"{id_prefix}.precip_total_{source_slug(MONTH_LABEL)}", f"{spec['name']} {MONTH_LABEL} precipitation total (ERA5)", "mm", observations(precip, 1), geography, "total_precipitation YTD total", meta))
        written.append(write_artifact(f"{prefix}.precip_anomaly_pct_{source_slug(MONTH_LABEL)}_1991_2020", f"{id_prefix}.precip_anomaly_pct_{source_slug(MONTH_LABEL)}_1991_2020", f"{spec['name']} {MONTH_LABEL} precipitation anomaly (ERA5)", "% vs 1991-2020", observations(precip_anom, 2), geography, "total_precipitation YTD percent anomaly", meta))

        temp_rank, temp_value, n = rank(temp, TARGET_YEAR)
        last_value = temp.get(TARGET_YEAR - 1)
        region_summaries.append((spec["name"], temp_rank, n, temp_value, last_value, temp_value - last_value if last_value is not None else None))

    print(f"wrote {len(written)} YTD artifacts for {MONTH_LABEL} through {TARGET_YEAR}")
    print(f"{TARGET_YEAR} {MONTH_LABEL} temperature rank by region:")
    for name, ranking, total, value, last_value, diff in region_summaries:
        diff_text = "n/a" if diff is None else f"{diff:+.2f} C vs {TARGET_YEAR - 1}"
        print(f"  {name}: rank {ranking}/{total}, {value:.2f} C, {diff_text}")


if __name__ == "__main__":
    main()
