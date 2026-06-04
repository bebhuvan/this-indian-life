# API Integration Plan

This note records the source APIs currently in scope and how Indica should integrate them. All source calls belong in the offline data plane. The public site must read published artifacts, not these APIs.

## India Data Hub

- Base URL: `https://feeds.indiadatahub.com`
- OpenAPI: `https://feeds.indiadatahub.com/openapi.json`
- Auth: `api_key` query parameter.
- Useful endpoints:
  - `/economy/category_list`
  - `/economy/filter_category`
  - `/economy/filter_by_lastupdated`
  - `/economy/data`
  - `/globaldata/indicator_list`
  - `/globaldata/data`
  - `/multilateral/WB`, `/multilateral/IMF`, `/multilateral/BIS`, `/multilateral/UN`

Use India Data Hub as the first serious India macro adapter because it can cover RBI, MoSPI, Ministry of Finance, multilateral series, markets, and district feeds behind one access pattern. Store the source indicator id exactly as India Data Hub names it.

## Ember

- Base URL: `https://api.ember-energy.org/v1`
- OpenAPI: `https://api.ember-energy.org/v1/openapi.json`
- Auth: `api_key` query parameter.
- License: CC BY 4.0.
- Useful endpoints:
  - `/electricity-generation/yearly`
  - `/electricity-generation/monthly`
  - `/electricity-demand/yearly`
  - `/electricity-demand/monthly`
  - `/power-sector-emissions/yearly`
  - `/power-sector-emissions/monthly`
  - `/carbon-intensity/yearly`
  - `/carbon-intensity/monthly`
  - `/installed-capacity/monthly`
  - `/options/{dataset}/{temporal_resolution}/{filter_name}`

Use Ember for electricity generation mix, demand, power-sector emissions, carbon intensity, and installed capacity. Query India with `entity_code=IND`.

## EIA International Energy Data

- Base URL: `https://api.eia.gov/v2`
- Open data portal: `https://www.eia.gov/opendata/`
- Browser: `https://www.eia.gov/opendata/browser/international`
- Auth: `api_key` query parameter.
- Useful endpoint:
  - `/international/data/`
- Required request details:
  - `frequency=annual`
  - `data[0]=value`
  - `facets[countryRegionId][]=IND`
  - selected `productId`, `activityId`, and `unit` facets.

Use EIA for the broad energy balance: total energy production/consumption, fuel-level energy use, coal and gas imports, petroleum production, electricity capacity, and energy-related CO2 by fuel. Ember remains the better electricity-generation source; EIA is the broader energy-system supplement.

## PPAC

- Base URL: `https://ppac.gov.in`
- Key page: `https://ppac.gov.in/import-export`
- Historical page: `https://ppac.gov.in/import-export/history`
- Auth: none.
- Current machine-readable artifact:
  - `https://ppac.gov.in/uploads/pages/1669199925_Import-Export-C.xlsx`

Use PPAC for official India petroleum import/export and petroleum-product workbook data. Current adapter parses the import/export workbook into monthly table rows. The historical import/export page exposes quantity, rupee-value, and dollar-value workbook names, but automated direct fetch currently returns HTML/login-wrapper content rather than XLSX bytes; keep those as discovery-only until raw download access validates. Many other PPAC surfaces are PDFs; add them one at a time after parser verification.

## UN Comtrade

- Base URL: `https://comtradeapi.un.org`
- Public preview endpoint: `/public/v1/preview/{typeCode}/{freqCode}/{clCode}`
- Keyed full endpoint: `/data/v1/get/{typeCode}/{freqCode}/{clCode}`
- Auth: public preview works without a key; full data API requires subscription key header `Ocp-Apim-Subscription-Key`.
- Energy commodity candidates:
  - HS `270900`: crude oil
  - HS `2710`: petroleum oils/products
  - HS `2701`: coal
  - HS `2704`: coke/semi-coke
  - HS `271111`: liquefied natural gas
  - HS `271121`: natural gas

Use UN Comtrade for partner-origin import stories: where India's crude, coal, gas, and petroleum products come from. The adapter defaults to public preview mode; set `UN_COMTRADE_API_KEY` and `UN_COMTRADE_ENDPOINT=data/v1/get` when a full subscription is available.

## Our World in Data

- Base URL: `https://ourworldindata.org`
- Docs: `https://docs.owid.io/projects/etl/api/`
- Auth: none for Grapher downloads.
- Useful endpoints:
  - `/grapher/{slug}.csv`
  - `/grapher/{slug}.metadata.json`
  - `/grapher/{slug}.zip`
  - `/grapher/{slug}.config.json`
  - `/grapher/{slug}.values.json`

Use OWID for high-quality global comparison and health, climate, demography, energy, and social indicators. Prefer `.metadata.json` plus `.csv` so source attribution and caveats travel with the series.

## WAQI / AQICN

- Base URL: `https://api.waqi.info`
- Auth: token, normally passed as `token`.
- Use for AQI-facing pages and station snapshots.

Do not treat AQI as the only pollution truth. For analysis, prefer pollutant concentrations from OpenAQ/CPCB where possible, then use WAQI for reader-friendly AQI framing.

## Copernicus Climate Data Store

- API URL: `https://cds.climate.copernicus.eu/api`
- Auth: personal access token, usually configured through `$HOME/.cdsapirc`.
- Client: Python `cdsapi>=0.7.7`.

CDS is not a simple JSON feed. Treat it as a batch download source for climate artifacts: ERA5 temperature, humidity, rainfall, and derived heat-stress inputs. Users must manually accept dataset terms before API retrieval.

## World Bank Documents & Reports

- Base URL: `https://search.worldbank.org/api/v3/wds`
- Auth: none for public records.
- Use for source documents, reports, PDFs, abstracts, document metadata, and citations.
- Important parameters: `format=json`, `qterm`, `fl`, `rows`, `os`, `strdate`, `enddate`, `sort`, `order`.

This is a provenance and context source, not the primary numeric indicator API.

## World Bank Data360

- Docs: `https://data360.worldbank.org/en/api`
- Base URL placeholder: `https://data360api.worldbank.org`
- Auth: none for public API access unless a future endpoint says otherwise.

Data360 is useful for broader World Bank data products and should sit beside the classic World Bank Indicators API. Keep it as a separate source id because payloads and semantics differ.

## NDAP / NITI Aayog

- Public app: `https://ndap.niti.gov.in`
- Catalogue route: `https://ndap.niti.gov.in/catalogue` is an SPA route, but direct server requests currently return 404.
- Discovered API base from bundled frontend: `https://loadqa.ndapapi.com`
- Discovered endpoints include:
  - `/v1/search`
  - `/v1/search/catalogue`
  - `/v1/search/filters`
  - `/v1/search/suggestion/default`
  - `/v1/search/suggestion/typeahead`
  - `/v1/dataset/details`
  - `/v1/dataset/top`
  - `/v1/dataset/export`
  - `/v1/dataset/download`
  - `/v1/dataset/metadatavalues`
  - `/v1/dataset/getdimensionvalues`
  - `/v1/dataset/basicdetails`
  - `/v1/openapi/getdetails`

Build this as an experimental adapter first. The API is not formally documented, and several endpoints return `Invalid Request` or require POST payloads shaped by the frontend. The safe workflow is:

1. Use the adapter only in offline discovery scripts.
2. Snapshot every raw response.
3. Avoid high-volume crawling until request shapes, limits, and terms are clear.
4. Promote individual endpoints to stable ingestion only after they are reproducible and attributable.

## Data Portal for Cities

- API docs: `https://dataportalforcities.org/api`
- Base URL: `https://dataportalforcities.org`
- Auth: none.
- Main endpoint: `/api/emissions?cityid={cityid}&year={year}&sector={sector}&scope={scope}`
- Scope values: `direct`, `indirect`, `total`.

This is a clean JSON API for city greenhouse-gas inventories. It is not India-specific, but it is useful for city-level climate comparisons if Indian city IDs are available. The public docs say city IDs can be looked up through the city picker or requested by country/region list from the portal team.

## OECD SDMX

- API explainer: `https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html`
- Dataflow catalogue: `https://sdmx.oecd.org/public/rest/dataflow/all`
- Data endpoint pattern: `https://sdmx.oecd.org/public/rest/data/{agency},{dataset},{version}/{key}?{params}`
- Formats: `genericdata` XML, `jsondata`, `csvfile`, `csvfilewithlabels`.

The dataflow catalogue probe works and returns SDMX XML. OECD is useful for international comparison context: education, health, labour, tax, trade, productivity, regional development, and well-being. Do not treat it as an India-first canonical source; use it to compare India with OECD/non-OECD countries where OECD coverage is available.

Implementation note: OECD requires `Accept-Language: en` on data requests from this environment; without it, sample CSV queries returned `500 languageTag1`. Targeted India dataflow fetches now work, but broad catalogue discovery hits OECD rate limits and should run slowly in batches.

## WHO Global Health Observatory

- API docs: `https://www.who.int/data/gho/info/gho-odata-api`
- Base URL: `https://ghoapi.azureedge.net/api`
- Protocol: OData.
- Auth: none.
- Useful endpoints:
  - `/Dimension`
  - `/DIMENSION/COUNTRY/DimensionValues`
  - `/Indicator`
  - `/Indicator?$filter=contains(IndicatorName,'Life expectancy')`
  - `/{IndicatorCode}?$filter=SpatialDim eq 'IND'`

WHO GHO is a strong V1 health source. The probe for `WHOSIS_000001` returned India life expectancy records with `NumericValue`, confidence bounds, sex dimension, and year fields.

## UN Population Data Portal

- API docs: `https://population.un.org/dataportalapi/index.html`
- Base URL: `https://population.un.org/dataportalapi`
- OpenAPI specs:
  - `/swagger/DataPortalOpenAPISpecificationv1.0/swagger.json`
  - `/swagger/DataPortalOpenAPISpecificationv2.0/swagger.json`
- Auth: metadata endpoints are public; the two data endpoints require `Authorization: Bearer <token>`.
- Local env:
  - `UN_POPULATION_BASE_URL`
  - `UN_POPULATION_BEARER_TOKEN`

Useful endpoints:

- `/api/v1/locations`
- `/api/v1/locations/356` for India
- `/api/v1/Indicators`
- `/api/v1/data/indicators/{indicators}/locations/{locations}/start/{startYear}/end/{endYear}?pagingInHeader=false&format=json`

This is a high-priority V1 demography source for UN WPP-style population, fertility, mortality, age, sex, and projection indicators. The adapter adds the `Bearer` prefix automatically if the env value is only the raw JWT.

## Secret Handling

Real keys live only in `.env`, which is gitignored. Commit `.env.example` when adding new variable names. Scripts must never log full request URLs containing `api_key` or `token`.
