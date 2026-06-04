# Berkeley Earth Adapter

Berkeley Earth land-surface temperature, ingested as a **file-based** source. Berkeley
Earth has **no API** — regional/national summaries are plain whitespace-delimited text
files in a public S3 bucket.

## Access

- Base: `https://berkeley-earth-temperature.s3.us-west-1.amazonaws.com`
- Per-region trend file: `/Regional/{METRIC}/{region}-{METRIC}-Trend.txt`
  - `METRIC` ∈ `TAVG` (mean), `TMAX` (daily high), `TMIN` (daily low)
  - e.g. India mean: `.../Regional/TAVG/india-TAVG-Trend.txt`
- No key, no auth. CC BY 4.0.

## File format

A long `%`-prefixed header, then whitespace-delimited rows:

```
Year  Month  MonthlyAnomaly  Unc  AnnualAnomaly  Unc  5yr Unc  10yr Unc  20yr Unc
```

- Temperatures are **°C anomalies relative to the Jan 1951–Dec 1980 average**.
- Missing values are the literal `NaN`.
- The header states the absolute baseline, e.g.
  `Estimated Jan 1951-Dec 1980 absolute temperature (C): 24.19 +/- 0.12`,
  which lets us reconstruct **absolute °C = annual anomaly + 24.19**.

## What the adapter produces

`fetchBerkeleyRegion(region, metric)` → `{ url, baselineAbsolute, baselinePeriod, anomaly[], absolute[], latestYear }`.

The annual value is the **mean of the 12 monthly anomalies**; partial calendar years are
dropped so every point is a clean full-year average. `npm run ingest:berkeley` writes two
series artifacts per region from `berkeleyIndicators`:

- `climate.berkeley.temp_anomaly` — anomaly vs 1951–1980
- `climate.berkeley.temp_abs` — absolute °C (anomaly + baseline)

## Caveats (important)

- **Coverage:** India record runs from ~**1816 to 2020**. The file is **only updated to
  2020**, so this is the *deep-history* complement to OWID (→2025), ERA5 (→2024), and CCKP
  (observed + projections) — **not** a recency source.
- **Early-year uncertainty:** pre-1900 India had few stations; early anomalies carry wide
  uncertainty bands (the `Unc` columns). Do not present 19th-century India values as precise.
- **Sub-national (state) data is NOT here** — Berkeley Earth provides state/province series
  only by manual request form, so the state choropleth must use CCKP (API) or raw ERA5.
- Cross-check: Berkeley's 1951–1980 absolute baseline (24.19 °C) is consistent with ERA5
  (~24.5) and CCKP (~24.9) for India land temperature.
