# Starter Data Sources

Priority is based on usefulness, accessibility, provenance, and how quickly each source can produce durable chart pages.

## Tier 1: Start Here

| Source | Use | Access | Notes |
| --- | --- | --- | --- |
| World Bank Indicators API | GDP, population, life expectancy, electricity access, poverty, urbanization, long annual CPI inflation | https://datahelpdesk.worldbank.org/knowledgebase/articles/889392 | Good first ingestion target: stable API, long time series, clean country codes. For inflation, `scripts/ingest-inflation-long-backbone.mjs` uses `FP.CPI.TOTL.ZG` as the 1960+ annual headline backbone and splices later full-year MoSPI CPI values only when World Bank has not yet published the year. |
| India Data Hub feeds | RBI, MoSPI, Ministry of Finance, district feeds, mutual funds, corporate data, multilateral feeds | https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor | High-priority India macro adapter. OpenAPI is available at `https://feeds.indiadatahub.com/openapi.json`; auth uses `api_key`. |
| NDAP / NITI Aayog | Cross-ministry catalogue, datasets, indicators, district/state data | https://ndap.niti.gov.in | Worth exploring, but no formal public API docs found. Treat the discovered JSON endpoints as experimental until stable. |
| Our World in Data Grapher | Health, energy, climate, CO2, population, social indicators | https://docs.owid.io/projects/etl/api/chart-api/ | Excellent chart-level CSV/JSON downloads; also has a catalog API with Parquet tables. |
| RBI Database on Indian Economy | Banking, inflation, monetary, external sector, financial markets | https://data.rbi.org.in/DBIE/ | Core India macro source. Build a source-specific adapter and snapshot raw outputs. |
| MoSPI / eSankhyiki | National accounts, CPI/IIP, surveys, official statistical products | https://www.mospi.gov.in/ and https://www.esankhyiki.mospi.gov.in/ | Official CPI source. Existing adapter calls the open MoSPI API behind eSankhyiki for CPI group and item inflation; MoSPI also hosts an MCP server at `https://mcp.mospi.gov.in/` and publishes the server code at `https://github.com/nso-india/esankhyiki-mcp`. `scripts/derive-monsoon-food-inflation-panel.mjs` summarizes food inflation around monsoon years. |
| data.gov.in APIs | Ministry and state datasets | https://data.gov.in/apis | Useful breadth, but quality varies by publisher; use after a source whitelist. |
| Ember API | Electricity generation, demand, power-sector emissions, carbon intensity, capacity | https://api.ember-energy.org/v1/docs | Strong first energy source. Query India with `entity_code=IND`; auth uses `api_key`; data is CC BY 4.0. |
| EIA International Energy Data | Energy production/consumption, fuel imports, electricity capacity, energy-related CO2 by fuel | https://www.eia.gov/opendata/browser/international | Good broad energy-system supplement to Ember. API requires `api_key`; bulk file is public. Query India with `countryRegionId=IND`. |
| PPAC | Petroleum imports/exports, crude, products, gas, monthly petroleum reports | https://ppac.gov.in/import-export and https://ppac.gov.in/import-export/history | Official India petroleum source. Current import/export workbook is parseable; historical import/export workbook names are discoverable but direct automation is login/html wrapped until raw XLSX access is validated. |
| WHO Global Health Observatory | Health indicators, mortality, life expectancy, disease/risk factors | https://www.who.int/data/gho/info/gho-odata-api | Clean OData API; India country filters work. |
| UN Population Data Portal | Population, fertility, mortality, age/sex structure, projections | https://population.un.org/dataportalapi/index.html | Metadata public; data endpoints require bearer token. India protected data fetch works. |
| OECD SDMX | International comparison context | https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html | Use targeted flows; broad discovery is rate-limited. Requires `Accept-Language: en` in this environment. |

## Tier 2: Add After the First Catalog

| Source | Use | Access | Notes |
| --- | --- | --- | --- |
| OpenAQ v3 | PM2.5, PM10, NO2, O3 and other pollutant observations | https://docs.openaq.org/about/about | Prefer pollutant concentrations over opaque AQI for analysis. Requires attention to station coverage and licenses. |
| WAQI / AQICN | AQI and station-level current/forecast air quality | https://aqicn.org/api/ | Useful for reader-facing AQI, but store provider and station metadata carefully. |
| Open-Meteo Historical Weather API | City-level historical weather, temperature, rainfall, hot days/nights | https://open-meteo.com/en/docs/historical-weather-api | Good no-key historical archive for article-ready city climate pages. Use a single model such as ERA5 for long-run comparisons, cache snapshots, and attribute Open-Meteo. |
| NOAA Climate Prediction Center ENSO indices | ONI, Nino 3.4, SOI and ENSO monitoring | https://www.cpc.ncep.noaa.gov/data/indices/ and https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php | Good official ENSO backbone. `scripts/ingest-noaa-enso.mjs` currently ingests ONI to `data/series/noaa-enso.global.oni_seasonal.json`. |
| India Meteorological Department monsoon pages | All-India rainfall time series, homogeneous-region rainfall, subdivision rainfall, monsoon reports | https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html and https://imdpune.gov.in/cmpg/subdivrainfall/subdivisonrainfall.html | Canonical for India monsoon article work. `scripts/ingest-imd-monsoon-rainfall.mjs` ingests all-India and homogeneous-region June-September rainfall through 2025; `scripts/ingest-imd-subdivision-rainfall.mjs` ingests 36 subdivision monthly rainfall histories. |
| Directorate of Economics and Statistics, Ministry of Agriculture | Crop area, production, yield, irrigation coverage | https://desagri.gov.in/document-report/agricultural-statistics-at-a-glance-2024/ | Primary crop-impact source. `scripts/ingest-des-agri-apy-glance.mjs` downloads the official Agricultural Statistics at a Glance 2024-25 PDF and parses all-India APY tables for foodgrains, rice, wheat, nutri/coarse cereals, total pulses, and nine oilseeds from 1950-51 through 2024-25. |
| UPAg public Dash reports | Crop APY dashboards, state-wise recent APY, 2025-26 advance estimates, progressive area sown | https://upag.gov.in/primary-estimate-report and https://dash.upag.gov.in/allindiaapy | Public report pages expose browser-loaded AG Grid data; CSV buttons export the same grid client-side. `scripts/ingest-upag-dash-apy.py` snapshots the report registry and extracts public Dash grids, including all-India APY from 1966-67 through 2025-26 and state-wise APY from 2021-22 through 2025-26. |
| NASA POWER | Temperature, rainfall, solar and meteorological data | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | Good for heat and climate pages; supports JSON/CSV and daily/monthly requests. |
| Copernicus Climate Data Store | ERA5, climate reanalysis, atmospheric data, heat/humidity inputs | https://cds.climate.copernicus.eu/how-to-api | Python `cdsapi` workflow. Requires manual dataset terms acceptance before API downloads. |
| DHS / NFHS | Health, fertility, nutrition, household indicators | https://api.dhsprogram.com/ | API for indicators; microdata needs registration and careful survey weighting. |
| UN World Population Prospects | Population projections, age structure, fertility, mortality | https://population.un.org/wpp/ | Good for population pages and comparisons. |
| UN Comtrade | Energy-import partner origin: crude, coal, LNG, petroleum products | https://comtradeplus.un.org/ | API requires subscription key. Use HS-code registry and snapshot partner-level annual imports. |

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

Start with the API-ready group documented in [V1_SOURCE_STRATEGY.md](./V1_SOURCE_STRATEGY.md): World Bank, India Data Hub, Ember, OWID, WAQI, and Data Portal for Cities. World Bank is not the best India source for everything, but it is the fastest way to validate the full pipeline:

```text
fetch -> raw snapshot -> normalized series -> chart catalog -> static page
```

Once the system is proven, replace or supplement World Bank values with RBI/MoSPI/India Data Hub where they are the canonical Indian source. Use Census, NFHS, PLFS, HCES, and similar sources as page-backed or file-backed adapters rather than trying to pretend they are clean APIs.

For government-source discovery, adapter planning, and validation, use [INDIA_GOV_DATA_INFRASTRUCTURE.md](./INDIA_GOV_DATA_INFRASTRUCTURE.md). For the "How connected is India?" article and related telecom/internet access charts, use [CONNECTED_INDIA_SOURCE_MAP.md](./CONNECTED_INDIA_SOURCE_MAP.md). It maps the DFI chart assets back to CAMS, MIS, TRAI/NDAP, WDI/ITU, NFHS, and older NSS rounds.

## Evaluated and parked

| Source | Status | Decision |
| --- | --- | --- |
| Google Data Commons (REST v2, `api.datacommons.org`) | Key works (`DATACOMMONS_API_KEY` in `.env`). Probed live 2026-06: India `Count_Person` latest **2024**, GDP latest **2024**, energy/capita **2023**; electricity-generation and internet statvars returned no India data (statvar-naming mismatch). | **Parked.** It is an aggregator that mirrors its upstream source's vintage (WDI/Census), so it does not reach 2025 and never beats IndiaDataHub (to 2026) / Ember (2025) / OWID for current India series. Its real value is the country→state→district hierarchy and breadth of variables in one API — revisit only for **sub-national / breadth** pages, where older vintages are acceptable. For fresh Indian sub-national data prefer NDAP / RBI DBIE directly. Do not re-evaluate for recency. |
