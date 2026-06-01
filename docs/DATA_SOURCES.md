# Starter Data Sources

Priority is based on usefulness, accessibility, provenance, and how quickly each source can produce durable chart pages.

## Tier 1: Start Here

| Source | Use | Access | Notes |
| --- | --- | --- | --- |
| World Bank Indicators API | GDP, population, life expectancy, electricity access, poverty, urbanization | https://datahelpdesk.worldbank.org/knowledgebase/articles/889392 | Good first ingestion target: stable API, long time series, clean country codes. |
| Our World in Data Grapher | Health, energy, climate, CO2, population, social indicators | https://docs.owid.io/projects/etl/api/chart-api/ | Excellent chart-level CSV/JSON downloads; also has a catalog API with Parquet tables. |
| RBI Database on Indian Economy | Banking, inflation, monetary, external sector, financial markets | https://data.rbi.org.in/DBIE/ | Core India macro source. Build a source-specific adapter and snapshot raw outputs. |
| MoSPI / eSankhyiki | National accounts, CPI/IIP, surveys, official statistical products | https://www.mospi.gov.in/ and https://www.esankhyiki.mospi.gov.in/ | Treat as official but heterogeneous; expect table-specific parsing. |
| data.gov.in APIs | Ministry and state datasets | https://data.gov.in/apis | Useful breadth, but quality varies by publisher; use after a source whitelist. |

## Tier 2: Add After the First Catalog

| Source | Use | Access | Notes |
| --- | --- | --- | --- |
| OpenAQ v3 | PM2.5, PM10, NO2, O3 and other pollutant observations | https://docs.openaq.org/about/about | Prefer pollutant concentrations over opaque AQI for analysis. Requires attention to station coverage and licenses. |
| WAQI / AQICN | AQI and station-level current/forecast air quality | https://aqicn.org/api/ | Useful for reader-facing AQI, but store provider and station metadata carefully. |
| NASA POWER | Temperature, rainfall, solar and meteorological data | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | Good for heat and climate pages; supports JSON/CSV and daily/monthly requests. |
| DHS / NFHS | Health, fertility, nutrition, household indicators | https://api.dhsprogram.com/ | API for indicators; microdata needs registration and careful survey weighting. |
| UN World Population Prospects | Population projections, age structure, fertility, mortality | https://population.un.org/wpp/ | Good for population pages and comparisons. |

## Tier 3: High Value but More Work

| Source | Use | Reason to defer |
| --- | --- | --- |
| Census 2011 and future Census releases | District/state demographics, households, migration | Old but essential; files and geography normalization take work. |
| PLFS and NSS survey microdata | Jobs, consumption, household welfare | Needs survey expertise, weights, and disclosure discipline. |
| Ministry of Finance / Controller General of Accounts | Union finances, receipts, expenditure | Multiple PDF/table formats and revisions. |
| State budget documents | State fiscal capacity and priorities | Very useful, but parsing is a project by itself. |
| IMD gridded data | Rainfall, heat, extremes | Strong source, but access and formats need separate handling. |

## First Ingestion Recommendation

Start with World Bank for the live scaffold, then add RBI and MoSPI adapters. World Bank is not the best India source for everything, but it is the fastest way to validate the full pipeline:

```text
fetch -> raw snapshot -> normalized series -> chart catalog -> static page
```

Once the system is proven, replace or supplement World Bank values with RBI/MoSPI where they are the canonical Indian source.

