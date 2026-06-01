# Adapter Roadmap

This is the practical build order for source ingestion.

## Phase 1: Prove The Spine

1. **World Bank**
   - Status: implemented for seed series.
   - Next: add more indicators through a registry instead of hardcoded list.
   - Output: `data/series/worldbank.*.json`.

2. **India Data Hub**
   - Status: auth and category probe work.
   - Next: create an indicator discovery script for `/economy/category_list`, `/economy/filter_category`, and `/economy/data`.
   - First target charts: CPI, IIP, fiscal deficit, bank credit, deposits, policy rate, forex reserves.

3. **Ember**
   - Status: auth and India electricity-generation probe work.
   - Next: normalize yearly electricity generation by fuel and demand.
   - First target charts: India's power mix, coal share, renewables share, electricity demand.

4. **OWID**
   - Status: metadata probe works.
   - Next: add CSV parser and country filter for India plus comparison countries.
   - First target charts: CO2, life expectancy, child mortality, fertility, energy use, poverty context.

5. **WAQI**
   - Status: Delhi feed probe works.
   - Next: build station registry for top Indian cities and snapshot current AQI.
   - First target charts: current AQI cards, city unsafe-air days later.

6. **Data Portal for Cities**
   - Status: sample emissions endpoint works.
   - Next: discover Indian city IDs.
   - First target charts: Indian city emissions sector split if coverage is good.

7. **WHO GHO**
   - Status: OData probe works for India life expectancy.
   - Next: normalize India health indicators with dimensions for sex, age, and confidence bounds.
   - First target charts: life expectancy, HALE, mortality, UHC, risk factors.

8. **UN Population**
   - Status: bearer token is stored locally; protected India data endpoint works; indicator 46 has been ingested with pagination.
   - Next: build an indicator registry for fertility, mortality, population by age/sex, and projection variants.
   - First target charts: population pyramid, old-age share, working-age share, fertility, population projections.

9. **OECD**
   - Status: targeted India dataflow fetch works when `Accept-Language: en` is supplied; broad discovery is rate-limited.
   - Next: add a curated list of OECD dataflows instead of scanning the entire catalogue.
   - First target charts: OECD composite leading indicators and selected international comparison indicators.

## Phase 2: Official India Depth

1. **Census**
   - Build a file-based adapter from downloaded Census tables.
   - Establish canonical geography IDs.
   - Do not block on live website fetching.

2. **NFHS**
   - Start with factsheet tables.
   - Later use DHS/NFHS microdata where permitted.
   - Prioritize fertility, anaemia, stunting, wasting, sanitation, cooking fuel, assets.

3. **PLFS**
   - Start with published tables.
   - Add microdata only after survey-weighting code is reviewed.

4. **HCES**
   - Start with report tables.
   - Add consumption distributions and rural/urban splits.

5. **CEA + Jal Jeevan Mission**
   - Extract API endpoints from docs.
   - Normalize official utility/service delivery indicators.

## Phase 3: Harder But Important

- NCRB with careful caveats.
- Agmarknet mandi prices.
- UDISE+ once correct access path is found.
- CGWB/India-WRIS groundwater.
- Agriculture Census after canonical official files are located.
- NDAP after endpoint stability is proven.

## Current Commands

```bash
npm run env:check
npm run probe:sources
npm run ingest:worldbank
npm run ingest:un-population
npm run fetch:oecd-india-flow -- OECD.SDD.STES:DSD_STES@DF_CLI:4.1
npm run build
```
