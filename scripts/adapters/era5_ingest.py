#!/usr/bin/env python3
"""Copernicus ERA5 monthly-means ingest for India (national, latitude-weighted).

Pulls multiple ERA5 variables in one request, area-averages over the India bbox with
cosine-latitude weighting (the same approach OWID uses), aggregates monthly -> annual,
and writes canonical series-artifact JSON compatible with the JS pipeline
(see scripts/core/artifacts.mjs createSeriesArtifact).

Range is controlled by ERA5_START / ERA5_END env vars (default 1950..2024) so a short
range can be used to smoke-test before the full historical pull.

Variables pulled:
  2m_temperature         -> climate.era5.temp_mean      (annual mean, degC)
  2m_dewpoint_temperature-> climate.era5.dewpoint_mean  (annual mean, degC)  [humidity/heat-stress input]
  total_precipitation    -> climate.era5.precip_total   (annual total, mm)
Derived:
  climate.era5.rel_humidity_mean (annual mean %, from temp + dew point, Magnus formula)
"""
import os, json, math, hashlib, datetime, tempfile
import cdsapi
import numpy as np
import xarray as xr

START = int(os.environ.get("ERA5_START", "1950"))
END = int(os.environ.get("ERA5_END", "2024"))
BBOX = [37, 68, 6, 98]  # N, W, S, E  (India)
FETCHED_AT = datetime.datetime.utcnow().isoformat() + "Z"
SERIES_DIR = "data/series"
SNAP_DIR = "data/snapshots/era5"
os.makedirs(SERIES_DIR, exist_ok=True)
os.makedirs(SNAP_DIR, exist_ok=True)


_INDIA_MASK = None  # boolean DataArray (lat,lon): True for cells inside India's polygon
_INDIA_REGION_ID = 98  # India in natural_earth_v5_0_0.countries_110


def build_india_mask(da):
    """Build a boolean India-territory mask on the data grid using the India polygon.

    A bbox over India also covers Tibet, Pakistan, and ocean; masking to the actual
    national polygon (Natural Earth) is what makes the average a real India figure
    (~25C) rather than a South-Asia-bbox figure.
    """
    global _INDIA_MASK
    import regionmask
    countries = regionmask.defined_regions.natural_earth_v5_0_0.countries_110
    region = countries.mask(da["longitude"], da["latitude"])  # region id per cell, NaN outside land
    _INDIA_MASK = (region == _INDIA_REGION_ID)
    return _INDIA_MASK


def latw_mean(da):
    """Cosine-latitude-weighted spatial mean over India cells only."""
    w = np.cos(np.deg2rad(da["latitude"]))
    if _INDIA_MASK is not None:
        w = w * _INDIA_MASK
    return da.weighted(w.fillna(0)).mean(dim=["latitude", "longitude"])


def monthly_series(da):
    """Return {('YYYY','MM'): value} latitude-weighted monthly means."""
    m = latw_mean(da)
    out = {}
    times = m["valid_time"] if "valid_time" in m.dims else m[m.dims[0]]
    for i, t in enumerate(times.values):
        ts = np.datetime_as_string(t, unit="M")  # 'YYYY-MM'
        y, mo = ts.split("-")
        out[(y, mo)] = float(m.values[i])
    return out


def write_artifact(indicator_id, title, unit, observations, source_var, metadata):
    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": "era5",
        "sourceIndicatorId": source_var,
        "sourceUrl": "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means",
        "unit": unit,
        "frequency": "annual",
        "geography": {"type": "country", "id": "IND", "name": "India"},
        "dimensions": ["date", "value"],
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "metadata": metadata,
    }
    path = os.path.join(SERIES_DIR, f"era5.IN.{indicator_id}.json")
    with open(path, "w") as f:
        json.dump(artifact, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return path, len(observations), source_var


def fetch_one(cds_var, short_name, years, months):
    """Download a single ERA5 variable (clean NetCDF) and return its monthly series."""
    target = os.path.join(tempfile.gettempdir(), f"era5_{short_name}_{START}_{END}.nc")
    if os.path.exists(target):
        os.remove(target)
    c = cdsapi.Client()
    c.retrieve(
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
        target,
    )
    ds = xr.open_dataset(target, engine="netcdf4")
    da = ds[short_name]
    if _INDIA_MASK is None:
        build_india_mask(da)
    return monthly_series(da)


def main():
    years = [str(y) for y in range(START, END + 1)]
    months = [f"{m:02d}" for m in range(1, 13)]

    # Per-variable downloads: single-variable requests return a clean .nc (multi-variable
    # requests come back zipped/inconsistent on the new CDS). The first fetch builds the
    # India-polygon mask from its grid; subsequent means are India-only.
    t2m = fetch_one("2m_temperature", "t2m", years, months)
    d2m = fetch_one("2m_dewpoint_temperature", "d2m", years, months)
    # total_precipitation monthly mean is mean daily accumulation in metres; annual mm = sum_m (val_m_per_day * days_in_month * 1000)
    tp = fetch_one("total_precipitation", "tp", years, months)

    def days_in_month(y, mo):
        return [31, 29 if (int(y) % 4 == 0 and (int(y) % 100 != 0 or int(y) % 400 == 0)) else 28,
                31, 30, 31, 30, 31, 31, 30, 31, 30, 31][int(mo) - 1]

    temp_obs, dew_obs, precip_obs, rh_obs = [], [], [], []
    for y in years:
        tvals = [t2m[(y, mo)] - 273.15 for mo in months if (y, mo) in t2m]
        dvals = [d2m[(y, mo)] - 273.15 for mo in months if (y, mo) in d2m]
        pvals = [tp[(y, mo)] * 1000.0 * days_in_month(y, mo) for mo in months if (y, mo) in tp]
        if len(tvals) == 12:
            tmean = sum(tvals) / 12
            dmean = sum(dvals) / 12
            temp_obs.append({"date": y, "value": round(tmean, 3)})
            dew_obs.append({"date": y, "value": round(dmean, 3)})
            # Relative humidity via Magnus (using annual-mean T and Td)
            def es(tc):
                return 6.112 * math.exp(17.67 * tc / (tc + 243.5))
            rh = 100.0 * es(dmean) / es(tmean)
            rh_obs.append({"date": y, "value": round(min(rh, 100.0), 2)})
        if len(pvals) == 12:
            precip_obs.append({"date": y, "value": round(sum(pvals), 1)})

    meta = {"bbox_NWSE": BBOX, "method": "cosine-latitude-weighted spatial mean, ERA5 monthly means",
            "collection": "reanalysis-era5-single-levels-monthly-means"}
    results = []
    results.append(write_artifact("climate.era5.temp_mean", "India average temperature (ERA5)", "°C", temp_obs, "2m_temperature", meta))
    results.append(write_artifact("climate.era5.dewpoint_mean", "India average dew point (ERA5)", "°C", dew_obs, "2m_dewpoint_temperature", meta))
    results.append(write_artifact("climate.era5.precip_total", "India total annual precipitation (ERA5)", "mm", precip_obs, "total_precipitation", meta))
    results.append(write_artifact("climate.era5.rel_humidity_mean", "India average relative humidity (ERA5, derived)", "%", rh_obs, "derived:t2m+d2m", {**meta, "formula": "Magnus relative humidity from annual-mean T and Td"}))

    manifest = [{"status": "ready", "indicatorId": iid_path[0].split("era5.IN.")[1].replace(".json", ""),
                 "sourceIndicatorId": iid_path[2],
                 "artifact": iid_path[0], "observations": iid_path[1], "fetchedAt": FETCHED_AT}
                for iid_path in results]
    with open("data/catalog/era5-manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    for p, n in results:
        print(f"era5 {os.path.basename(p)} {n} annual obs ({START}-{END})")
    print(f"Wrote {len(results)} ERA5 artifacts.")


if __name__ == "__main__":
    main()
