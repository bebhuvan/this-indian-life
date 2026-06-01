# Starter Data Sources

Priority is based on usefulness, accessibility, provenance, and how quickly each source can produce durable chart pages.

## Tier 1: Start Here

| Source | Use | Access | Notes |
| --- | --- | --- | --- |
| World Bank Indicators API | GDP, population, life expectancy, electricity access, poverty, urbanization | https://datahelpdesk.worldbank.org/knowledgebase/articles/889392 | Good first ingestion target: stable API, long time series, clean country codes. |
| India Data Hub feeds | RBI, MoSPI, Ministry of Finance, district feeds, mutual funds, corporate data, multilateral feeds | https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor | High-priority India macro adapter. OpenAPI is available at `https://feeds.indiadatahub.com/openapi.json`; auth uses `api_key`. |
| NDAP / NITI Aayog | Cross-ministry catalogue, datasets, indicators, district/state data | https://ndap.niti.gov.in | Worth exploring, but no formal public API docs found. Treat the discovered JSON endpoints as experimental until stable. |
| Our World in Data Grapher | Health, energy, climate, CO2, population, social indicators | https://docs.owid.io/projects/etl/api/chart-api/ | Excellent chart-level CSV/JSON downloads; also has a catalog API with Parquet tables. |
| RBI Database on Indian Economy | Banking, inflation, monetary, external sector, financial markets | https://data.rbi.org.in/DBIE/ | Core India macro source. Build a source-specific adapter and snapshot raw outputs. |
| MoSPI / eSankhyiki | National accounts, CPI/IIP, surveys, official statistical products | https://www.mospi.gov.in/ and https://www.esankhyiki.mospi.gov.in/ | Treat as official but heterogeneous; expect table-specific parsing. |
| data.gov.in APIs | Ministry and state datasets | https://data.gov.in/apis | Useful breadth, but quality varies by publisher; use after a source whitelist. |
| Ember API | Electricity generation, demand, power-sector emissions, carbon intensity, capacity | https://api.ember-energy.org/v1/docs | Strong first energy source. Query India with `entity_code=IND`; auth uses `api_key`; data is CC BY 4.0. |

## Tier 2: Add After the First Catalog

| Source | Use | Access | Notes |
| --- | --- | --- | --- |
| OpenAQ v3 | PM2.5, PM10, NO2, O3 and other pollutant observations | https://docs.openaq.org/about/about | Prefer pollutant concentrations over opaque AQI for analysis. Requires attention to station coverage and licenses. |
| WAQI / AQICN | AQI and station-level current/forecast air quality | https://aqicn.org/api/ | Useful for reader-facing AQI, but store provider and station metadata carefully. |
| NASA POWER | Temperature, rainfall, solar and meteorological data | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | Good for heat and climate pages; supports JSON/CSV and daily/monthly requests. |
| Copernicus Climate Data Store | ERA5, climate reanalysis, atmospheric data, heat/humidity inputs | https://cds.climate.copernicus.eu/how-to-api | Python `cdsapi` workflow. Requires manual dataset terms acceptance before API downloads. |
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
| World Bank Documents & Reports | Reports, PDFs, abstracts, source context | Useful for citations and context, not a primary numeric source. |
| World Bank Data360 | World Bank thematic data products | Beta surface; keep separate from classic Indicators API. |

## First Ingestion Recommendation

Start with World Bank for the live scaffold, then add RBI and MoSPI adapters. World Bank is not the best India source for everything, but it is the fastest way to validate the full pipeline:

```text
fetch -> raw snapshot -> normalized series -> chart catalog -> static page
```

Once the system is proven, replace or supplement World Bank values with RBI/MoSPI where they are the canonical Indian source.
