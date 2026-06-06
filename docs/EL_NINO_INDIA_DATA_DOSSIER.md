# El Nino And India Data Dossier

Last updated: 2026-06-06

## Article Goal

Write a long, data-rich explainer on El Nino and India in the same style as the existing climate, inflation, agriculture, and heat-mortality articles: a clear reader question, a short answer, a guided data story, locked numbers, chart explainers, caveats, and a visible evidence trail.

Working question:

> What does El Nino do to India's monsoon, and what does history actually show?

The article should not claim that El Nino always causes drought. The accurate line is: El Nino raises the risk of a weaker Indian summer monsoon, but the result depends on timing, strength, the Indian Ocean Dipole, regional circulation, soil moisture, reservoirs, and policy response.

## What We Have Now

| Evidence need | Current access | Status | Use in article |
| --- | --- | --- | --- |
| ENSO seasonal history | NOAA CPC ONI feed | Ready | Timeline of El Nino, La Nina, neutral seasons from 1950 to 2026 |
| All-India monsoon rainfall departure | IMD Pune SW Monsoon Rainfall Data | Ready | Backbone chart: El Nino years versus June-September rainfall departure |
| Homogeneous-region monsoon rainfall | IMD Pune SW Monsoon Rainfall Data | Ready | Regional caveat: Northwest, Northeast, Central India, and South Peninsula can diverge |
| Meteorological-subdivision rainfall | IMD Pune Sub Division Rainfall Data | Ready | Future state/region research and localized monsoon case studies |
| Indian Ocean Dipole index | NOAA PSL Dipole Mode Index | Ready | Essential caveat; positive IOD can offset or modify El Nino drying risk |
| India broad annual precipitation | Existing OWID/Copernicus artifact | Ready | Background context, not the canonical monsoon chart |
| City rainfall histories | Existing Open-Meteo ERA5 city artifacts | Ready | Local examples and regional texture |
| Crop area, production, and yield | DES Agricultural Statistics at a Glance 2024-25 | Ready | Link rainfall shocks to foodgrains, rice, wheat, pulses, coarse cereals, and oilseeds |
| Public crop dashboards and 2025-26 estimates | UPAg public Dash reports | Ready | Extend crop APY/dashboard evidence through 2025-26 and add recent state-wise APY detail |
| Agriculture exposure | Existing World Bank / ILO artifacts | Ready | Why monsoon risk matters for livelihoods |
| Food-price channels | Existing MoSPI CPI artifacts | Ready | How rainfall shocks can move vegetables, pulses, cereals, oils |
| Monsoon-food inflation panel | Derived IMD/NOAA + MoSPI CPI panel | Ready | Compare rainfall and ENSO years with post-monsoon food-price windows |
| Recent disastrous weather reports | Local IMD DWE PDFs for 2021-2024 | Ready for manual/event use | Case-study evidence, not the monsoon baseline |

Newly gathered in this pass:

- `scripts/ingest-noaa-enso.mjs`
- `data/series/noaa-enso.global.oni_seasonal.json`
- `data/catalog/noaa-enso-manifest.json`
- `scripts/ingest-imd-monsoon-rainfall.mjs`
- `data/series/imd.IN.climate.imd.monsoon_rainfall_regions.json`
- `data/catalog/imd-monsoon-rainfall-manifest.json`
- `scripts/ingest-imd-subdivision-rainfall.mjs`
- `data/series/imd.IN.climate.imd.subdivision_rainfall.json`
- `data/catalog/imd-subdivision-rainfall-manifest.json`
- `scripts/ingest-des-agri-apy-glance.mjs`
- `data/series/des-agri.IN.agriculture.all_india_crop_apy.json`
- `data/catalog/des-agri-apy-manifest.json`
- `scripts/ingest-upag-dash-apy.py`
- `data/series/upag.IN.agriculture.all_india_crop_apy_dash.json`
- `data/series/upag.IN.agriculture.statewise_crop_apy_recent_dash.json`
- `data/series/upag.IN.agriculture.five_year_apy_dash.json`
- `data/series/upag.IN.agriculture.normal_apy_dash.json`
- `data/series/upag.IN.agriculture.state_profile_crop_apy_dash.json`
- `data/series/upag.IN.agriculture.domestic_international_production_dash.json`
- `data/series/upag.IN.agriculture.progressive_crop_area_sown_dash.json`
- `data/catalog/upag-dash-apy-manifest.json`
- `scripts/derive-enso-imd-monsoon.mjs`
- `data/series/derived.IN.climate.enso_imd_monsoon_join.json`
- `data/catalog/enso-imd-monsoon-manifest.json`
- `scripts/ingest-noaa-iod-dmi.mjs`
- `data/series/noaa-iod.global.dmi_monthly.json`
- `data/catalog/noaa-iod-manifest.json`
- `scripts/derive-enso-iod-imd-monsoon.mjs`
- `data/series/derived.IN.climate.enso_iod_imd_monsoon_join.json`
- `data/catalog/enso-iod-imd-monsoon-manifest.json`
- `scripts/derive-rainfall-crop-panel.mjs`
- `data/series/derived.IN.agriculture.rainfall_crop_apy_panel.json`
- `data/catalog/rainfall-crop-panel-manifest.json`
- `scripts/derive-monsoon-food-inflation-panel.mjs`
- `data/series/derived.IN.prices.monsoon_food_inflation_panel.json`
- `data/catalog/monsoon-food-inflation-panel-manifest.json`
- `data/catalog/el-nino-india-source-map.json`

The NOAA ONI artifact currently has 916 seasonal rows from `1950-DJF` through `2026-MAM`.
The NOAA DMI/IOD artifact has 1,864 monthly rows from `1870-01` through `2025-04`.
The IMD monsoon rainfall artifact has 625 rows: five regions by 125 years, from 1901 through 2025.
The IMD subdivision rainfall artifact has 4,473 rows across 36 meteorological subdivisions, with 1971-2020 normal values stored in metadata. Some subdivisions have early-year gaps in the public table.
The UPAg all-India APY Dash artifact has 15,030 rows across 37 crops from 1966-67 through 2025-26; the 2025-26 values are labeled Third Advance Estimates in the source dashboard. The UPAg state-wise APY artifact has 33,816 rows across 37 crops and 39 states/UTs from 2021-22 through 2025-26.
The derived ENSO-IOD-IMD join has 380 rows from 1950 through 2025, covering five regions for each year. It adds June-September, July-September, August-October, and September-November DMI averages and simple IOD phase labels.
The derived rainfall-crop APY panel has 5,460 rows from 1950-51 through 2025-26. It joins all-India IMD/NOAA monsoon-ENSO fields to DES and UPAg APY rows by crop-year start, preserving `source_dataset`, `season`, and `estimate_stage`, and adding year-over-year and previous-five-year deviation fields for area, production, and yield.
The derived monsoon-food inflation panel has 784 rows from 2012 through 2025. It joins MoSPI monthly CPI inflation series to all-India IMD/NOAA monsoon years, with June-September, October-December, January-March, and July-June food-year windows. The hosted MoSPI MCP server at `https://mcp.mospi.gov.in/` was smoke-tested against the same Consumer Food Price filters, and its 2025 Oct-Dec values match the local MoSPI artifact.

Source note: IndiaDataHub exposes an IMD-sourced rainfall feed through May 2026, but the primary public source for the historical monthly subdivision data is IMD Pune's Sub Division Rainfall Data page (`https://imdpune.gov.in/cmpg/subdivrainfall/subdivisonrainfall.html`). It is subdivision data, not clean administrative state data. For current-year 2026 extension, IMD's monthly climate summaries and press releases are the public primary source, but they are PDF/report material rather than the same static historical HTML table.

Crop-output source note: use the DES Agricultural Statistics at a Glance PDF for long final-history tables back to 1950-51, and use UPAg public Dash artifacts for broader crop coverage, recent state-wise detail, and 2025-26 advance-estimate context. Do not silently mix DES final estimates and UPAg advance estimates without labeling the estimate stage.

## What We Still Need

| Need | Best source | Priority | Why it matters |
| --- | --- | --- | --- |
| Daily gridded rainfall | IMD 0.25 degree gridded rainfall | Medium | Enables maps, state/district rollups, extreme rainfall metrics |
| Reservoir storage | India-WRIS / CWC | Medium | Rainfall deficit only matters after storage, irrigation, and groundwater context |
| Crop output and yield | DES + UPAg public Dash reports | Ready | Converts rainfall into rice, pulses, sugarcane, cotton, oilseed stakes |
| Food inflation windows | MoSPI / eSankhyiki CPI | Ready | Links monsoon years to headline, food, cereals, pulses, vegetables, oils, and item-level prices |
| News and policy timeline | IMD press releases, GDELT, newspaper archives | Medium | Shows what was known and reported in each major event year |

## Proposed Article Spine

1. Open in June 2026: IMD below-normal monsoon forecast, rising El Nino risk, and IOD as a live caveat.
2. What El Nino is, in plain English.
3. What the ONI record shows: the warm/cold Pacific cycle since 1950.
4. How India's monsoon normally works, and why June-September rainfall matters.
5. The main chart: El Nino years versus all-India monsoon rainfall departure.
6. The caveat chart: 1997-type years where Indian Ocean Dipole or other circulation changed the outcome.
7. Regional reality: Northwest, Central India, South Peninsula, East/Northeast can diverge sharply.
8. Case studies: 1972, 1982, 1987, 1997, 2002, 2009, 2015, 2023, with 2026 as a live monitoring tile.
9. What happens after rain fails: reservoirs, crops, food prices, rural work, inflation.
10. What present monitoring should watch in 2026: ONI/RONI, IOD, IMD monsoon updates, actual rainfall distribution, reservoirs, sowing, and food prices.
11. What the data cannot prove cleanly: attribution, intra-season distribution, district outcomes, and news/reporting bias.

## Chart Plan

| Chart | Data | Current status |
| --- | --- | --- |
| Live 2026 monsoon-risk dashboard | IMD forecast, NOAA/CPC ENSO outlook, IOD outlook, IMD monsoon progress | Needs latest update before publish |
| ENSO phase timeline, 1950-2026 | NOAA ONI | Ready |
| El Nino strength distribution | NOAA ONI | Ready |
| El Nino years vs all-India monsoon rainfall departure | Derived ENSO-IOD-IMD join | Ready |
| ENSO plus IOD scatter | Derived ENSO-IOD-IMD join | Ready |
| Rainfall departure by homogeneous region in El Nino years | Derived ENSO-IOD-IMD join | Ready |
| Case-study grid: ENSO strength, rainfall departure, crop/price stress | NOAA + IMD + MoSPI/RBI | Partly ready |
| Rainfall-crop impact panel | Derived IMD/NOAA + DES + UPAg panel | Ready |
| Agriculture exposure: share of workers in farming | Existing World Bank/ILO | Ready |
| Food price volatility after weak monsoon years | Derived MoSPI CPI + rainfall anomaly panel | Ready |
| Reservoir storage context | India-WRIS/CWC | Needs adapter or manual export |

## Editorial Standards For This Piece

Use the longform pattern already present in `data/explanations/en/q.climate.impact.json` and `q.work.agriculture.json`:

- Start with a short answer that is accurate but not over-certain.
- Use locked numbers only after the source artifact is in `data/series`.
- Put caveats near the chart where the reader needs them, not only at the end.
- Prefer "risk increases" to deterministic wording.
- Distinguish annual rainfall, southwest monsoon rainfall, regional rainfall, and daily distribution.
- Avoid treating ONI threshold tags as official event declarations unless the persistence rule is applied.
- Keep news as narrative context unless independently verified by official data.

## Immediate Next Steps

1. Build the official policy/news timeline for major monsoon and food-price stress years using PIB, DGFT, Consumer Affairs, Agriculture, RBI, and IMD sources.
2. Decide whether to ingest selected IMD NetCDF gridded rainfall files for maps; the 2024 POST route was tested and returns a valid 25 MB NetCDF file.
3. Ingest or digitize CWC reservoir storage bulletins for the live 2026 buffer chart.
4. Add 2024-base MoSPI CPI food components for 2026 food-price updates.
5. Register a new question in `scripts/registry/v1-indicators.mjs` and draft `data/explanations/en/q.climate.el_nino_india.json`.
