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

## Secret Handling

Real keys live only in `.env`, which is gitignored. Commit `.env.example` when adding new variable names. Scripts must never log full request URLs containing `api_key` or `token`.
