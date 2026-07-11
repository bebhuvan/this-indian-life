# India Warming Flagship Data Dossier

Working question: **Is India warming, and what does that mean?**

Purpose: build a canonical, multi-disciplinary Indica article that settles the
measurement question first, then explains why warming lands unevenly across bodies,
work, food, water, cities, energy, and responsibility. This dossier locks the input
data plan before chart and prose work.

## Editorial Thesis

India is warming. The honest story is not that every place feels hotter every day.
It is that the average climate has shifted, the shift is uneven by season and place,
and a small rise in mean temperature changes the odds of damaging heat, hot nights,
humid stress, crop losses, work losses, water stress, cooling demand, and health
burden.

Answer type: **direct answer with caveats**.

## Data Principles

- Use at least two independent temperature backbones for the core claim.
- Keep observed, reanalysis, modelled, projected, administrative, and survey data
  labelled separately.
- Do not use CCKP historical heat-risk series as post-2014 observed exposure.
- Do not imply city heat is only global climate change; city form, land cover, and
  waste heat are separate mechanisms.
- Treat health, crop, labour, and mortality estimates as ranges or context unless
  the source directly measures the outcome.
- Every chart must answer a distinct reader objection, mechanism, exposure route, or
  consequence.

## Voice And Debate Posture

This article can be sharper than the default Indica tone because the public debate is
not just confused, it is often confidently wrong. Use controlled snark, not abuse.
The target is the claim, not the person making it.

Good mode:

- "No, one cool week in Delhi does not repeal a century of temperature records."
- "If the argument needs you to ignore nights, humidity, workers, crops, and cities,
  it is not a serious argument."
- "The national average is not a thermometer outside your house."

Rules:

- Every sharp line must be followed quickly by data, source context, or a chart.
- Do not call readers stupid, idiotic, anti-science, or politically motivated.
- Do not overclaim attribution. Distinguish warming, urban heat, humidity, El Nino,
  land use, and measurement differences.
- Use "myth / what the data says / what it does not prove" boxes if the page needs a
  recurring debate structure.
- Keep the close calm and methodological. The article should feel hard to dismiss,
  not merely satisfying to people who already agree.

## Existing Inputs

### 1. Core Warming Signal

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| Long-run independent land-temperature check | `climate.berkeley.temp_anomaly`, `climate.berkeley.temp_abs` | Berkeley Earth | 1817-2020 | usable, but needs update or caveat |
| National reanalysis mean temperature | `climate.era5.temp_mean` | Copernicus ERA5 | 1940-2024 | usable |
| Official IMD temperature anchors | `climate.imd.temperature_official_anchors` | IMD climate statements | 1901-2025 headline facts | usable as official cross-check |
| Reader-facing anomaly and monthly temperature | `climate.temp_anomaly_annual`, `climate.surface_temp_monthly` | OWID / Copernicus | annual/monthly | usable |
| Source-comparison anomalies | `climate.derived.temp_anomaly_owid_1991_2020`, `climate.derived.temp_anomaly_era5_1991_2020`, `climate.derived.temp_anomaly_berkeley_1991_2020` | OWID, ERA5, Berkeley derived | 1940-2025 / 1940-2024 / 1817-2020 | usable |
| Seasonal anomaly lines | `climate.derived.seasonal_temp_anomaly_*`, `climate.derived.seasonal_temp_anomaly_decades` | OWID monthly derived | 1940 onward | usable |
| State warming map | `climate.era5.state_warming` | Copernicus ERA5 | 1951-1980 vs 2015-2024 | usable |
| Temperature projections | `climate.cckp.temp_historical`, `climate.cckp.temp_ssp126`, `climate.cckp.temp_ssp245`, `climate.cckp.temp_ssp585` | World Bank CCKP / CMIP6 | 1950-2100 | usable as model/projection |

Missing before publication:

- Full official IMD annual and seasonal all-India temperature anomaly table. We now
  have official IMD headline anchors from the 2025 climate statement and 2024 annual
  report, but not the underlying 1901-2025 annual table.
- ERA5-native seasonal derivation if we want the seasonal chart to use the exact same
  India mask as `climate.era5.temp_mean`. The current seasonal artifacts use OWID's
  Copernicus monthly country series.

### 2. Heat Exposure And Lived Heat

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| National humidity context | `climate.era5.dewpoint_mean`, `climate.era5.rel_humidity_mean` | Copernicus ERA5 | 1940-2024 | usable |
| Recent national hot days | `climate.era5.hotdays40_observed` | Copernicus ERA5 daily statistics | 2015-2025 | useful, short window |
| Recent national warm nights | `climate.era5.warmnights26_observed` | Copernicus ERA5 daily statistics | 2015-2025 | useful, short window |
| City mean temperature | `climate.openmeteo.<city>.mean_temperature` | Open-Meteo ERA5 | 1940-2025 | usable |
| City apparent temperature | `climate.openmeteo.<city>.mean_apparent_temperature` | Open-Meteo ERA5 | 1940-2025 | usable |
| City very hot days | `climate.openmeteo.<city>.very_hot_days` | Open-Meteo ERA5 | 1940-2025 | usable |
| City hot nights | `climate.openmeteo.<city>.hot_nights` | Open-Meteo ERA5 | 1940-2025 | usable |
| City humid-heat days | `climate.openmeteo.<city>.humid_heat_days` | Open-Meteo ERA5 | 1940-2025 | usable |
| Future dangerous heat-index days | `climate.cckp.heatindex39_*` | World Bank CCKP / CMIP6 | 1950-2100 | usable as model/projection |
| Future hot days and warm nights | `climate.cckp.hotdays40_*`, `climate.cckp.warmnights26_*` | World Bank CCKP / CMIP6 | 1950-2100 | usable as model/projection |

Missing before publication:

- Longer observed/reanalysis daily exposure from ERA5, ideally 1980-2025:
  hot days, hot nights, humid-heat days, and a heat-index or wet-bulb-like proxy.
  Existing adapter `scripts/adapters/era5_daily_exposure.py` can be extended back
  from the present 2015 start.
  - 2026-06-09 smoke test for 1980 hit a Copernicus CDS server-side 500 and timed
    out while retrying. No output files changed. Keep this as a data-access task,
    not an evidence result.
- Population-weighted heat exposure. National area averages understate the heat
  experienced by people in the plains and cities.

### 3. Rain, Monsoon, Water

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| All-India monsoon departure | `climate.el_nino.imd_monsoon_departure_1901_2025` | IMD | 1901-2025 | usable |
| Regional monsoon sensitivity | `climate.el_nino.region_*`, `climate.el_nino.regional_sensitivity` | IMD + NOAA derived | 1950-2025 | usable |
| Subdivision rainfall | IMD subdivision artifacts and snapshots | IMD | monthly histories | usable if charted carefully |
| Annual precipitation | `climate.precipitation_annual`, `climate.era5.precip_total` | OWID/Copernicus, ERA5 | 1940 onward | usable |
| Groundwater extraction | `water.cgwb.stage_*`, `water.cgwb.category_*` | CGWB / INGRES | 2020-2025 and state snapshots | usable |
| Water availability | `water.cwc.per_capita_availability`, `water.cwc.resource_breakdown` | CWC | selected years/projections | usable |

Missing or optional:

- Heavy rainfall / extreme precipitation trend. Annual rainfall totals cannot show
  cloudbursts, dry spells, or intense-rain days.
- Reservoir/storage stress only if a clean official source is available quickly.

### 4. Health And Mortality

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| Heat death count comparison | `heat.heat_death_count_comparison`, `heat.admin_and_model_anchors` | IMD/NCRB/NCDC/Frontiers curated | mixed | usable with strong caveats |
| Reported disaster deaths | `heat.reported_extreme_temperature_deaths.owid_emdat`, `climate.disaster_deaths` | OWID/EM-DAT | 1990 onward | usable |
| IMD DWE 2024 deaths | `heat.imd_dwe_2024_*` | IMD DWE PDF | 2024 | usable as reported disaster-event counts |
| Death certification funnel | `heat.counting.death_certification_funnel` | CRS/MCCD | latest | usable |
| Baseline health context | SRS, MCCD, WHO, GBD artifacts | Indian official + WHO/GBD | varies | usable as context |
| Heat exposure/labour/health indicators | `heat.lancet_countdown_2025.extracted_indicators` | Lancet Countdown 2025 India sheet | mostly 2024 | usable as extracted indicators |

Missing or optional:

- Specific heat-illness surveillance time series, if public NCDC/NHRIDS data can be
  made chart-ready beyond one-off public reporting.
- Peer-reviewed Indian evidence cards for kidney stress, cardiovascular stress,
  pregnancy, sleep, and outdoor worker risk. These may be prose context cards rather
  than charts.

### 5. Work, Poverty, Cooling

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| Labour hours lost by sector | `heat-work.IN.lancet_labour_loss_sector_shares.json` | Lancet Countdown derived | latest | usable |
| Worker exposure/security | `heat-work.IN.worker_security_exposure.json` | MoSPI PLFS + ILOSTAT derived | latest | usable |
| Employment status and informality | `work.who.status_*`, `work.who.informal_*`, `work.who.casual_*` | PLFS | latest | usable |
| Cooling appliance ownership | `heat.cooling.ac_*`, `heat.cooling.cooler_*` | MoSPI NSS78 | 2020-21 | usable |
| Fan/electricity/cooling proxy | `heat.cooling.nfhs5_fan_all`, `heat.cooling.nfhs5_ac_cooler_*`, `heat.cooling.nfhs6_electricity_*` | NFHS-5/NFHS-6 | 2019-21/2023-24 | usable |
| Heat risk + cooling + poverty | `heat.vulnerability.state_risk_cooling_poverty` | CEEW + NSS + NITI + HCES + MCCD | latest | usable |
| CEEW heat risk | `heat.ceew.*` | CEEW | 2025 | usable |

Missing or optional:

- Cooling affordability/reliability: appliance ownership is not the same as being
  able to run cooling through a hot night.
- State-level power outage or feeder reliability data, only if a clean source is
  available.

### 6. Food, Agriculture, Livestock

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| Crop APY backbone | `agriculture.des.all_india_crop_apy` | DES Agricultural Statistics at a Glance | 1950-51 to 2024-25 | usable |
| UPAg crop detail | `agriculture.upag.*` | UPAg Dash | 1966-67 to 2025-26 depending table | usable |
| Rainfall-crop panel | `agriculture.derived.rainfall_crop_apy_panel` | IMD + DES/UPAg | 1950 onward | usable |
| Crop yield sensitivity | `agriculture.el_nino.crop_yield_sensitivity`, `agriculture.el_nino.irrigation_yield_split`, `agriculture.el_nino.rainfall_crop_correlations` | ICRISAT/DES derived | varies | usable |
| Food inflation after monsoon shocks | `prices.derived.monsoon_food_inflation_panel`, `prices.el_nino.*` | MoSPI/RBI + IMD/NOAA derived | 1980s onward for WPI, 2012 onward CPI | usable |

Missing before publication:

- Heat-specific crop evidence, especially wheat heat stress, rice night-temperature
  sensitivity, and livestock/milk/fodder exposure. Rainfall is not enough for this
  article.
- If no chart-ready national heat-crop series is available, use sourced context
  cards and keep crop charts to rainfall/irrigation/food-price mechanisms.

### 7. Energy, Cities, Coasts, Air

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| Electricity demand | `energy.ember.demand` | Ember | 2000-2025 | usable |
| Cooling degree days | `climate.cckp.cdd_*` | World Bank CCKP / CMIP6 | 1950-2100 | usable as model/projection |
| Electricity access | `energy.electricity_access`, `heat.cooling.nfhs6_electricity_*` | World Bank, NFHS | long + latest | usable |
| Sea level | `climate.psmsl.mumbai`, `climate.psmsl.chennai` | PSMSL | 1878-2024 Mumbai, 1916-2022 Chennai | usable |
| Air pollution context | `climate.pm25_exposure`, WAQI city artifacts | World Bank, WAQI | long + live snapshot | usable |
| Urban greenness/tree cover | rows inside `heat.lancet_countdown_2025.extracted_indicators` | Lancet Countdown | 2001-2024 summary rows | usable as small context if not overextended |

Missing or optional:

- Urban built-up / land-cover expansion and urban heat island proxy. This would make
  the cities section much stronger, but should not delay the core warming article
  unless we can source it cleanly.
- City electricity/cooling demand is not needed for the first flagship version.

### 8. Responsibility And Emissions

| Job | Existing series | Source | Coverage | Status |
| --- | --- | --- | --- | --- |
| Annual CO2 | `owid.co2_total`, EIA CO2 by fuel | OWID, EIA | long | usable |
| Per-capita CO2 comparison | `compare.climate.co2_per_capita` | OWID | long | usable |
| Cumulative CO2 comparison | `compare.climate.co2_cumulative` | OWID | long | usable |
| GHG by gas and sector | `climate.ghg_by_gas`, `climate.ghg_by_sector` | OWID/Climate Watch style artifacts | long | usable |
| Power transition context | Ember generation, EIA capacity | Ember/EIA | 2000 onward / long | usable |

This section should be short. It should prevent bad framing, not turn the article
into an emissions article.

## Proposed Chart Spine

This is intentionally more comprehensive than a normal article. Keep it only if each
chart earns its place.

### Act 1: Measurement, Not Vibes

1. India temperature anomaly, long line. Primary answer.
2. Same claim, independent-source comparison: IMD vs ERA5/Berkeley/OWID.
3. Warming stripes. Reader-facing pattern recognition.
4. Decade averages. Noise removal.
5. Seasonal warming: winter / pre-monsoon / monsoon / post-monsoon.
6. State warming map. National average hides geography.

### Act 2: Why The Average Misleads

7. City mean-temperature small multiples.
8. City very hot days.
9. City hot nights.
10. City humid-heat or apparent-temperature days.
11. National humidity/dew point context.
12. Observed national hot-days/warm-nights from ERA5 daily statistics.

### Act 3: Heat As A Body Problem

13. Dangerous heat-index days: historical + scenarios.
14. CEEW high-risk districts/population.
15. Heat-risk state map.
16. Cooling ladder: electricity, fan, cooler, AC.
17. State heat risk vs cooling vs poverty scatter.
18. Death counting funnel or reported-vs-modelled heat death comparison.

### Act 4: Heat As A Work And Money Problem

19. Lancet/heat-work labour hours lost or sector shares.
20. PLFS worker exposure/security: agriculture, casual, self-employed, informal.
21. Cooling degree days to 2100.
22. Electricity demand, 2000-2025.

### Act 5: Food, Farms, Water

23. IMD monsoon departure, 1901-2025.
24. Rainfall-crop correlation or crop sensitivity panel.
25. Irrigation shield: irrigated vs rainfed crops.
26. Food inflation after bad monsoon/heat years.
27. Groundwater extraction by state or north-west trend.
28. Optional heat-specific crop/livestock chart if sourced.

### Act 6: Cities, Coasts, Air

29. Urban greenness/tree-cover context from Lancet, if kept as context.
30. Mumbai/Chennai sea level.
31. PM2.5 exposure only if tying fossil-fuel combustion to local health context.

### Act 7: Cause And Fairness

32. India annual CO2.
33. Per-capita CO2 comparison.
34. Cumulative CO2 comparison.
35. Emissions by sector/gas.
36. Power transition chart if the article needs an adaptation/mitigation close.

Likely final target: **28-34 charts**, depending on what the missing IMD, ERA5 daily,
and heat-crop inputs produce.

## Visualization Build Plan

The current chart kit can already handle many of the planned visuals:

- `line`, `multiLine`, `linePanels`: temperature, electricity, monsoon, food prices.
- `stripes`, `decadeBars`, `seasonalByYear`: warming signal and seasonality.
- `sparkGrid`, `rankedChange`: many-city heat comparisons.
- `choropleth`, `scenarioMaps`: state maps and scenario map small multiples.
- `heatVulnerabilityScatter`: CEEW risk + cooling + poverty.
- `columnLines`, `compositionStack`, `latestBars`, `tableBars`: emissions, disaster
  deaths, crop panels, cooling ladder, labour exposure.

Likely bespoke or upgraded chart work:

1. **Source-comparison temperature panel**
   - Need: IMD vs ERA5 vs Berkeley/OWID, aligned to a common anomaly baseline.
   - Existing chart types can draw the lines, but the data transform must be careful:
     common baseline, source labels, and a visible "sources do not have identical
     methods" caveat.
   - Risk: low to medium.

2. **Seasonal warming matrix**
   - Need: season x decade or season x source view.
   - Existing `seasonalByYear` is month-by-month for selected years, not ideal for
     "which season warmed fastest".
   - Build option: new `heatMatrix` or `seasonDecadeGrid` visual type.
   - Risk: medium.

3. **Observed heat-exposure map or binned state map**
   - Need: state/district heat-day or warm-night change, ideally from ERA5 or IMD.
   - Existing `choropleth` works if the artifact carries SVG paths and values.
   - Missing part is geospatial aggregation and artifact creation.
   - Risk: medium to high.

4. **Population-weighted exposure**
   - Need: compare area-average heat to population-weighted heat.
   - Existing line/multiLine is enough if the derived series exists.
   - Risk: data-method risk, not rendering risk.

5. **Bivariate map: heat risk + cooling poverty**
   - Current `heatVulnerabilityScatter` handles the relationship better than a map.
   - If we want a bivariate map, it needs a new color system and legend. Do not build
     it unless the scatter fails editorially.
   - Risk: high for readability, especially on mobile.

6. **Scenario map small multiples**
   - Existing `scenarioMaps` can render state-level CCKP scenario maps.
   - Need to verify colour scale, labels, mobile fallback, and source caveat.
   - Risk: medium.

7. **Crop heat-impact chart**
   - If the input is a paper-derived estimate, a normal line is likely wrong.
   - Better options: evidence table, forest-plot-like estimate chart, or small
     "mechanism ladder" showing crop, exposure window, direction, source.
   - New visual likely needed if this becomes a chart.
   - Risk: medium to high.

8. **Methodology/source audit table**
   - Need: compact comparison of IMD, ERA5, Berkeley, OWID, CCKP, Open-Meteo.
   - Could be a prose table, but a designed `sourceMatrix` component would be more
     useful for a canonical page.
   - Risk: low.

9. **Map mobile strategy**
   - Real SVG maps can become unreadable on phones.
   - Every new map needs either a ranked-list mobile fallback or a simplified map with
     very few labels. Do not ship any map without checking mobile screenshots.

Prototype order:

1. source-comparison temperature panel;
2. seasonal warming matrix;
3. state heat-exposure choropleth, if the aggregation is available;
4. source/methodology matrix;
5. crop/livestock impact visual only after the evidence is locked.

Rule: do not let custom chart ambition block the core article. If a bespoke map takes
too long or becomes hard to read, fall back to ranked bars or a scatter. The reader
needs the relationship more than the map shape.

## New Data Work Queue

### Must Have

1. **IMD temperature cross-check**
   - Goal: annual and seasonal all-India temperature anomalies from 1901 onward.
   - Sources to try: IMD annual climate statements, IMD annual reports, public PDFs,
     or gridded temperature products if obtainable.
   - Output: annual anomaly, seasonal anomaly table, source-note context.

2. **ERA5 daily exposure extension**
   - Goal: observed/reanalysis hot days, hot nights, humid-heat/heat-index days for
     1980-2025, India-masked and optionally population-weighted.
   - Starting point: `scripts/adapters/era5_daily_exposure.py`.
   - Warning: CDS terms must be accepted; downloads may be slow.

3. **Seasonal ERA5 derivations**
   - Goal: annual means by IMD seasons.
   - Starting point: `scripts/adapters/era5_ingest.py` monthly means.

4. **Heat-specific agriculture context**
   - Goal: one defensible crop/livestock heat mechanism, preferably wheat/rice or
     milk/fodder.
   - If no clean time series: create sourced context cards, not weak charts.

### Nice To Have

5. Urban land-cover or greenness chart.
6. Heat Action Plan/adaptation inventory.
7. Heavy-rainfall/extreme-precipitation days.
8. Cooling affordability or grid-reliability context.

## Prose Generation Strategy

DeepSeek single-call generation will almost certainly fail for a 28-34 chart
article. Use a batched strategy from the start.

Recommended scripts:

- `scripts/generate-india-warming-batched.mjs`
- `scripts/generate-india-warming-explainers.mjs`

Implementation pattern:

- Copy the architecture of `scripts/generate-gold-batched.mjs`.
- Batch by act, not by arbitrary chart count.
- Each call receives only the charts in that act, their `why/read/watch`, locked
  numbers, caveat notes, and the global thesis.
- Generate body sections first.
- Generate the intro/short/macha/caveats/sourceNotes in a separate meta call.
- Generate `chartExplainers` in a dedicated pass.
- Build `sectionVisualMap` explicitly. Do not let the renderer guess.
- Allow prose-only sections: methodology, source comparison, and "what this does not
  prove" should be mapped with no chart or skipped in the map.

Minimum output fields:

- `article.bodyMarkdown`
- `short`
- `macha`
- `chartExplainers`
- `sectionVisualMap`
- `caveats`
- `sourceNotes`
- `evidence`

Validation:

- `bodyMarkdown` heading sanity: `body.count("\n## ")` must match expected section
  count minus first heading edge cases.
- `npm run explain:v1:validate`
- `npm run build`
- Dev-server read-through after restart if data files changed.

## Validation Baseline

Scoped audit script: `scripts/audit-india-warming-data.mjs`

Latest run:

- Generated: 2026-06-09T04:32:53.174Z
- Candidate artifacts checked: 382
- Required indicators checked: 54
- Errors: 0
- Warnings: 24
- JSON report: `data/audits/india-warming-data-audit.json`
- Markdown report: `data/audits/india-warming-data-audit.md`

Official IMD anchors now locked:

- 2025: +0.28 C vs 1991-2020, eighth warmest since 1901.
- 2024: +0.65 C vs 1991-2020, warmest year on record for India.
- 1901-2025 annual mean trend: +0.68 C per 100 years.
- 1901-2025 maximum/minimum trends: +0.89 C and +0.47 C per 100 years.
- 10 of India's 15 warmest years occurred during 2011-2025.

Current cross-source temperature checks:

- ERA5 annual mean vs OWID monthly annual mean: 85 overlapping years, 1940-2024,
  median absolute difference 0.283 C.
- ERA5 rebased to 1991-2020 vs OWID annual anomaly: 85 overlapping years,
  median absolute difference 0.005 C, max 0.021 C. This is the strongest current
  anti-data-hacking check for the core "India is warming" claim.
- Derived ERA5 vs derived OWID, both on 1991-2020: 85 overlapping years,
  median absolute difference 0.005 C, max 0.020 C.
- Derived Berkeley vs derived OWID, both on 1991-2020: 81 overlapping years,
  median absolute difference 0.078 C, with a large 1953 outlier.
- ERA5 rebased to 1951-1980 vs Berkeley anomaly: 81 overlapping years,
  median absolute difference 0.086 C, with a large 1953 outlier.
- Berkeley absolute vs ERA5 absolute: median absolute difference 0.742 C.
- CCKP historical ensemble vs ERA5 absolute: median absolute difference 0.646 C.

Warnings to resolve or disclose:

- Some derived artifacts use local data-file `sourceUrl`s. If charted, replace them
  with clean underlying HTTP source URLs or disclose the derivation in methodology.
- Several optional Open-Meteo city precipitation artifacts are empty. Do not use them
  unless regenerated; city heat artifacts remain usable.
- Absolute temperatures differ across source families because gridding, land/ocean
  treatment, masks, and baselines differ. The article should lean on anomaly
  agreement for the core warming claim and explain that absolute temperatures are
  method-dependent.
- Berkeley's older India record has a visible 1953 divergence from OWID/ERA5 after
  rebasing. Treat Berkeley as a long-run independent check and do not over-read
  individual early-year differences.
- The current seasonal series include completed seasons only. Winter 2026 is present
  because January-February 2026 is complete; annual 2026 is not used.

## Recommended Next Step

Do not edit the registry yet. First build the missing input layer:

1. add/extract IMD temperature anomaly data;
2. extend ERA5 daily exposure;
3. decide whether heat-crop/livestock evidence can become charts or should remain
   context cards.

Once those are done, lock the chart spine and only then edit `q.climate.impact` or
create a new `q.climate.india_warming`.
