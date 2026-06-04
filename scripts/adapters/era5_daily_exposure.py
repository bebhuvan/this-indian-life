#!/usr/bin/env python3
"""Observed India heat-EXPOSURE series from ERA5 daily statistics (fills the post-2014 gap).

The CCKP exposure series (hot days >=40C, warm nights >=26C) is CMIP6-model-based and
ends in 2014. This adapter builds an INDEPENDENT, observed/reanalysis counterpart from
ERA5 daily statistics for 2015..present, so the article can show that exposure kept
rising after 2014 instead of jumping straight to projections.

Method: for each grid cell, count days/year with daily-max 2m temperature >= 40C
(hot days) and days/year with daily-min 2m temperature >= 26C (warm nights), then take
the cosine-latitude-weighted spatial mean over India's polygon. This mirrors how CCKP
expresses a national-average number of exposure days, but the LEVELS are not directly
comparable to CCKP (different grid/method), so it is presented as its own observed series.

Range via ERA5X_START / ERA5X_END (default 2015..2025). Fetches year by year so a partial
run still writes the years that succeeded.
"""
import os, json, datetime, tempfile
import cdsapi
import numpy as np
import xarray as xr

START = int(os.environ.get("ERA5X_START", "2015"))
END = int(os.environ.get("ERA5X_END", "2025"))
BBOX = [37, 68, 6, 98]  # N, W, S, E (India)
HOTDAY_C = float(os.environ.get("ERA5X_HOTDAY_C", "40"))
WARMNIGHT_C = float(os.environ.get("ERA5X_WARMNIGHT_C", "26"))
FETCHED_AT = datetime.datetime.utcnow().isoformat() + "Z"
SERIES_DIR = "data/series"
DATASET = "derived-era5-single-levels-daily-statistics"
MONTHS = [f"{m:02d}" for m in range(1, 13)]
DAYS = [f"{d:02d}" for d in range(1, 32)]
os.makedirs(SERIES_DIR, exist_ok=True)

_MASK = None
_INDIA_REGION_ID = 98  # India in natural_earth_v5_0_0.countries_110


def india_mask(da):
    global _MASK
    if _MASK is not None:
        return _MASK
    import regionmask
    countries = regionmask.defined_regions.natural_earth_v5_0_0.countries_110
    region = countries.mask(da["longitude"], da["latitude"])
    _MASK = (region == _INDIA_REGION_ID)
    return _MASK


def fetch_daily(stat, year):
    """Download one year of a daily statistic of 2m_temperature; return DataArray (time,lat,lon) in degC."""
    target = os.path.join(tempfile.gettempdir(), f"era5x_{stat}_{year}.nc")
    if os.path.exists(target):
        os.remove(target)
    c = cdsapi.Client()
    c.retrieve(DATASET, {
        "product_type": "reanalysis",
        "variable": ["2m_temperature"],
        "year": str(year),
        "month": MONTHS,
        "day": DAYS,
        "daily_statistic": stat,           # "daily_maximum" | "daily_minimum"
        "time_zone": "utc+00:00",
        "frequency": "1_hourly",
        "area": BBOX,
    }, target)
    ds = xr.open_dataset(target, engine="netcdf4")
    name = "t2m" if "t2m" in ds else [v for v in ds.data_vars][0]
    da = ds[name]
    if "valid_time" in da.dims:
        da = da.rename({"valid_time": "time"})
    return da - 273.15  # K -> degC


def count_threshold(da, ge_value):
    """Cosine-lat-weighted India-mean of per-cell day-counts where value >= ge_value."""
    mask = india_mask(da)
    over = (da >= ge_value).where(mask).sum(dim="time")  # per-cell count of days
    w = np.cos(np.deg2rad(da["latitude"])) * mask.fillna(0)
    return float(over.weighted(w.fillna(0)).mean(dim=["latitude", "longitude"]).values)


def write_artifact(indicator_id, title, obs, threshold, stat_desc):
    artifact = {
        "schemaVersion": 1, "artifactType": "series", "indicatorId": indicator_id,
        "title": title, "sourceId": "era5",
        "sourceIndicatorId": f"ERA5 daily statistics, {stat_desc} >= {threshold}C, India-masked",
        "sourceUrl": "https://cds.climate.copernicus.eu/datasets/derived-era5-single-levels-daily-statistics",
        "unit": "days per year", "frequency": "annual",
        "geography": {"type": "country", "id": "IND", "name": "India"},
        "dimensions": ["date", "value"], "fetchedAt": FETCHED_AT,
        "observations": obs,
        "metadata": {"bbox_NWSE": BBOX, "threshold_C": threshold,
                     "method": "per-cell day count, cosine-latitude-weighted India-polygon mean",
                     "note": "Observed/reanalysis. Levels not directly comparable to CMIP6-based CCKP; shown as its own observed series."}
    }
    path = os.path.join(SERIES_DIR, f"era5.IN.{indicator_id}.json")
    # Merge with any existing observations (so a resumed/partial run appends rather than
    # overwrites), keyed by date with the new value winning, then sort by year.
    if os.path.exists(path):
        try:
            existing = json.load(open(path)).get("observations", [])
            merged = {o["date"]: o["value"] for o in existing}
            for o in obs:
                merged[o["date"]] = o["value"]
            artifact["observations"] = [{"date": d, "value": merged[d]} for d in sorted(merged, key=lambda x: int(x))]
        except Exception:
            pass
    with open(path, "w") as f:
        json.dump(artifact, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return path


def main():
    hot, warm = [], []
    for y in range(START, END + 1):
        try:
            tmax = fetch_daily("daily_maximum", y)
            india_mask(tmax)
            hd = count_threshold(tmax, HOTDAY_C)
            hot.append({"date": str(y), "value": round(hd, 1)})
            print(f"  {y}: hot days >= {HOTDAY_C}C = {hd:.1f}", flush=True)
        except Exception as e:
            print(f"  {y}: hot-day fetch failed: {e}", flush=True)
        try:
            tmin = fetch_daily("daily_minimum", y)
            wn = count_threshold(tmin, WARMNIGHT_C)
            warm.append({"date": str(y), "value": round(wn, 1)})
            print(f"  {y}: warm nights >= {WARMNIGHT_C}C = {wn:.1f}", flush=True)
        except Exception as e:
            print(f"  {y}: warm-night fetch failed: {e}", flush=True)

    written = []
    if hot:
        written.append(write_artifact("climate.era5.hotdays40_observed",
            "Observed hot days (max temperature at or above 40C), ERA5", hot, HOTDAY_C, "daily maximum"))
    if warm:
        written.append(write_artifact("climate.era5.warmnights26_observed",
            "Observed warm nights (min temperature at or above 26C), ERA5", warm, WARMNIGHT_C, "daily minimum"))
    for p in written:
        print("wrote " + p, flush=True)
    print(f"Done. {len(hot)} hot-day years, {len(warm)} warm-night years.", flush=True)


if __name__ == "__main__":
    main()
