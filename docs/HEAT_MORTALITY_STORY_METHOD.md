# India Heat Mortality Story Method

Last updated: 2026-06-03

> **2026-06-03 full rebuild.** The article was rebuilt from a thin, self-narrating 9-chart explainer into an 18-chart, 5-act narrative (scene-led hook → ACT I signal: anomaly line, warming stripes, decade staircase, state-warming MAP, humidity → ACT II exposure: heat-index scenario fan to 2100, very-hot-days & hot-nights by city, cooling-degree-days → ACT III who-gets-hit: vulnerability context + **cooling ownership** + **cooler-by-state MAP** → ACT IV counting: death-count log bars, deaths-by-state, by-month, EM-DAT → ACT V verdict: sensitivity scale-check, denominator). The visual plan lives in `scripts/registry/v1-indicators.mjs` (`q.climate.heat_mortality`); a custom `articleTemplateFor` case in `scripts/generate-explanations.mjs` carries the scene-led, anti-meta-narration voice. Regenerate with `INDICA_EXPLANATION_MODEL=deepseek-v4-pro ... --single-pass` (18 charts overflow multi-pass).
>
> **New cooling/socio-economic data (the "can Indians bear the heat?" thread):** MoSPI NSS 78 (2020-21) Table 22 — AC & cooler ownership, all/urban/rural + state. Auditable in `data/manual/cooling-nss78.json`; ingest `scripts/ingest-cooling.mjs`. All-India 4.9% AC / 14.1% cooler; urban 12.6% vs rural 1.2% AC.
>
> **Correction to this doc:** the IMD historical heatwave-death series for 2013-2023 was NEVER successfully downloaded — only `DWE_2024.pdf` parsed (460). The `imd_dwe_historical_*` artifacts carry only 2024 real rows. There is no multi-year IMD official death trend; OWID/EM-DAT (2000-2024) is the only longitudinal reported series. The "Chart Sequence" and "IMD PDF Parsing" sections below predate the rebuild and describe the older structure.

This note explains how we built the article:

Article URL in the local site: `/en/articles/are-indias-heat-deaths-being-counted/`

Article config and prose:

- `scripts/registry/v1-indicators.mjs`
- `data/explanations/en/q.climate.heat_mortality.json`

Core ingest and parsing scripts:

- `scripts/ingest-heat-mortality-evidence.mjs`
- `scripts/ingest-cckp.mjs`
- `scripts/ingest-open-meteo.mjs`
- `scripts/adapters/era5_ingest.py`
- `scripts/extract-heat-mortality-pdfs.mjs`
- `scripts/extract-imd-dwe-historical-heatwave.mjs`

Supporting research notes:

- `docs/HEAT_MORTALITY_RESEARCH_DOSSIER.md`
- `docs/HEAT_MORTALITY_DATA_AUDIT.md`
- `docs/HEAT_MORTALITY_EVIDENCE_PACKET.md`
- `docs/PDF_EXTRACTION_PLAYBOOK.md`

## The Editorial Question

The story is not: "3,400 Indians die from heat every day."

The story is: India has several heat-death numbers because each source is measuring a different thing. The dramatic Frontiers estimate is a modelled excess-death scenario, not a registered death count. But the official heatstroke and disaster counts are also too narrow to represent the full health burden of heat.

The public-facing claim we can defend is:

> The exact modelled number is uncertain, but official heat-death counts almost certainly do not capture the full burden. The gap between exposure and counting is the story.

## Why We Started With Heat Exposure

The first draft was too death-count focused. That made the article feel like a fight over one number. The better structure is:

1. Establish that India's heat background has shifted.
2. Show that exposure is not just occasional disaster events.
3. Show that heat risk is shaped by nights, humidity, work, age, electricity and poverty.
4. Only then compare death counts.
5. End with what can and cannot be inferred.

This is why the current visual sequence begins with temperature anomalies, national exposure indicators, future exposure, city hot nights and vulnerability context before showing the death-count comparison.

## Evidence Ladder

We separated the evidence into four layers.

### 1. Physical Heat Signal

These sources answer: has the heat environment changed?

| Source | Local artifact | Use | Caveat |
| --- | --- | --- | --- |
| OWID / Copernicus ERA5 annual temperature anomaly | `data/series/owid.IN.annual-temperature-anomalies.json` | Hero warming chart through 2025 | National average, not local heatwave exposure |
| Copernicus ERA5 monthly means | `data/series/era5.IN.climate.era5.temp_mean.json` | National temperature cross-check through 2024 | Monthly annual mean, not daily heat exposure |
| Copernicus ERA5 dew point | `data/series/era5.IN.climate.era5.dewpoint_mean.json` | Humid-heat input through 2024 | Dew point alone is not WBGT or heat index |
| Open-Meteo ERA5 city points | `data/series/open-meteo.IN.*.hot_nights.json` | City hot-night examples through 2025 | Point reanalysis, not neighbourhood exposure |

Key values in local data:

- OWID/Copernicus India annual temperature anomaly runs from 1940 to 2025.
- ERA5 national mean temperature runs from 1940 to 2024. Last value: 24.459 degC in 2024.
- ERA5 national dew point runs from 1940 to 2024. Last value: 17.265 degC in 2024.
- Open-Meteo city hot-night series run from 1940 to 2025 for Delhi, Mumbai, Chennai and Bengaluru.

Important choice:

We did not replace the World Bank CCKP heat-exposure chart with existing Copernicus monthly means, because monthly mean temperature is not the same as days above a heat-index threshold. The rigorous path is to use existing ERA5 monthly data as background, and build a future ERA5 daily/hourly ingest if we want true observed heat-index days through the present.

### 2. Heat Exposure Indicators

These sources answer: how often are people exposed to heat stress?

| Source | Local artifact | Use | Caveat |
| --- | --- | --- | --- |
| World Bank CCKP CMIP6 historical | `data/series/cckp.IN.climate.cckp.heatindex39_historical.json` | Dangerous heat-index days, 1950-2014 | Historical CMIP6 period ends in 2014 |
| World Bank CCKP CMIP6 historical | `data/series/cckp.IN.climate.cckp.hotdays40_historical.json` | Days above 40C, 1950-2014 | Ends in 2014 |
| World Bank CCKP CMIP6 historical | `data/series/cckp.IN.climate.cckp.warmnights26_historical.json` | Warm nights above 26C, 1950-2014 | Ends in 2014 |
| World Bank CCKP SSP2-4.5 | `data/series/cckp.IN.climate.cckp.heatindex39_ssp245.json` | Future dangerous heat-index days, 2015-2100 | Projection, not observation |
| Lancet Countdown 2025 India data sheet | `data/series/heat-mortality.IN.lancet_countdown_2025_extracted_indicators.json` | Heatwave days, heat-stress hours, labour hours lost | Extracted from PDF; exposure and labour metrics, not deaths |
| UNDP Human Climate Horizons | `data/series/heat-mortality.IN.undp_hch_heat_context.json` | Days over 95F, mortality/labour/energy projections | Projection/context model, not observed deaths |

Key values in local data:

- CCKP dangerous heat-index days: 5.22 in 1950, 13.87 in 2014.
- CCKP days above 40C: 18.85 in 1950, 22.16 in 2014.
- CCKP warm nights above 26C: 49.91 in 1950, 64.8 in 2014.
- CCKP SSP2-4.5 dangerous heat-index days: 14.33 in 2015, 57.36 in 2100.
- Lancet Countdown India 2025 sheet: 19.8 heatwave days per person in 2024, and 247 billion potential labour hours lost due to heat exposure.

Main caveat:

The current national heat-exposure chart is honest only if labelled as 1950-2014. It should not be described as a 2025 observed exposure chart.

### 3. Vulnerability And Denominators

These sources answer: who is exposed and how large is the mortality denominator?

| Source | Local artifact | Use | Caveat |
| --- | --- | --- | --- |
| World Bank population | `data/series/heat-mortality.IN.worldbank_context_population_total.json` | National denominator | National only |
| World Bank crude death rate | `data/series/heat-mortality.IN.worldbank_context_crude_death_rate.json` | Baseline deaths per day | Not event-level mortality |
| SRS crude death rate | `data/series/srs.IN.health.srs.crude_death_rate.json` | Indian mortality-rate cross-check | Annual sample estimate |
| World Bank agriculture employment | `data/series/heat-mortality.IN.worldbank_context_agriculture_employment_share.json` | Outdoor-work exposure proxy | Sector share, not time outdoors |
| World Bank vulnerable employment | `data/series/heat-mortality.IN.worldbank_context_vulnerable_employment_share.json` | Ability-to-avoid-heat proxy | Not direct heat exposure |
| World Bank electricity access | `data/series/heat-mortality.IN.worldbank_context_electricity_access.json` | Cooling precondition | Access is not reliability, affordability, fans, coolers or AC |
| World Bank age 65+ share | `data/series/heat-mortality.IN.worldbank_context_population_65plus_share.json` | Older-adult vulnerability | National average |
| World Bank PM2.5 and air-pollution mortality | `data/series/heat-mortality.IN.worldbank_context_pm25_exposure.json`, `data/series/heat-mortality.IN.worldbank_context_air_pollution_mortality_rate.json` | Cardiovascular/respiratory stress context | Pollution is a modifier, not heat attribution |

Latest World Bank context values in the local artifact:

- Population: 1,450,935,791 in 2024.
- Crude death rate: 6.6 deaths per 1,000 people in 2023.
- Population age 65+: 7.15 percent in 2024.
- Urban population: 35.38 percent in 2024.
- Electricity access: 99.5 percent in 2023.
- Agriculture employment: 41.63 percent in 2025.
- Vulnerable employment: 71.58 percent in 2025.
- Mean PM2.5 exposure: 48.39 ug/m3 in 2020.
- Air-pollution mortality rate: 139.3 deaths per 100,000 in 2019.

Sources we considered but did not fully integrate yet:

- Census 2011 district age, sex, rural/urban and worker tables.
- WorldPop gridded population and age-sex estimates.
- NFHS/DHS household cooling and vulnerability variables.
- PLFS occupational exposure and informal work.
- NSS78 living conditions, drinking water, sanitation and migration.
- HCES consumption as an income/poverty proxy.
- Time Use Survey for gendered and unpaid-work exposure.
- eSankhyiki MCP as a route to MoSPI surveys and tables.

These would make a stronger district or household vulnerability model, but they need survey weights, geography matching and careful denominator choices.

### 4. Mortality Counts And Modelled Mortality

These sources answer different death-count questions.

| Source | Local artifact | What it measures | What it does not measure |
| --- | --- | --- | --- |
| Frontiers in Environmental Health 2026 | `data/series/heat-mortality.IN.heat_death_count_comparison.json` | Modelled excess deaths for extreme heat scenarios | Registered deaths or medically certified heatstroke deaths |
| IMD Disastrous Weather Events 2024 | `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_summary.json` | Reported meteorological disaster-event deaths | All heat-attributable mortality |
| OWID / EM-DAT | `data/series/heat-mortality.IN.reported_extreme_temperature_deaths_owid_emdat.json` | Reported extreme-temperature disaster deaths | Complete heat mortality |
| NCRB ADSI | Curated in `heat_death_count_comparison` | Administrative heat/sunstroke deaths | Excess deaths during heatwaves |
| NCDC/NHRIDS public reporting | Curated in `heat_death_count_comparison` | Suspected/confirmed heatstroke surveillance counts | All heat-attributable deaths, especially outside facilities |
| CRS/SRS/MCCD | Research note and SRS artifact | Mortality infrastructure and baseline rates | Daily heat-attribution at national scale |

Key local count comparison:

| Source family | Period | Value | Use in article |
| --- | --- | ---: | --- |
| Frontiers model | Single extreme-heat day scenario | 3,400 | Core disputed modelled excess-death estimate |
| Frontiers model | Five-day heatwave scenario | about 30,000 | Shows scale if exposure persists |
| OWID/EM-DAT | 2024 | 733 | International reported-disaster comparator |
| OWID/EM-DAT | 2000-2024, non-missing India years | 10,398 | Shows long-run reported-disaster scale |
| NCRB ADSI | 2023 | 804 | Official administrative heat/sunstroke comparator, still secondary in our ingest |
| IMD DWE | 2024 | 460 | Official PDF parsed locally and internally reconciled |
| NCDC/NHRIDS | 2024, March-July public reporting | 161 | Confirmed heatstroke surveillance comparator, secondary |
| NCDC/NHRIDS parliamentary reporting | 2024-03-01 to 2024-07-27 | 374 | Cutoff-specific public reporting, secondary |

## IMD PDF Parsing

The strongest official parsed anchor is IMD DWE 2024.

Source:

- `https://www.imdpune.gov.in/library/public/DWE_2024.pdf`
- Local snapshot: `data/snapshots/heat-mortality/imd-disastrous-weather-events-2024.pdf.9ca124cf135e.pdf`

Parsed artifacts:

- `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_summary.json`
- `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_month.json`
- `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_state.json`
- `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_totals.json`
- `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_month.json`
- `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_state.json`

Reconciliation checks:

- Table 2 heatwave casualties = 460.
- Table 7 monthly heatwave deaths sum to 460:
  - March: 1
  - April: 39
  - May: 185
  - June: 235
  - Other months: 0
- Table 22 state/UT heatwave deaths sum to 460:
  - Uttar Pradesh: 240
  - Bihar: 63
  - Telangana: 46
  - Jharkhand: 35
  - Maharashtra: 28
  - Odisha: 16
  - Rajasthan: 16
  - Chhattisgarh: 7
  - Madhya Pradesh: 5
  - Kerala: 2
  - Delhi: 1
  - West Bengal: 1

Interpretation:

This is a high-confidence extraction of the IMD 2024 PDF. It is not high-confidence evidence of true heat-attributable mortality. It is a reported disaster-event count.

## The Sensitivity Scale Check

We added a simple arithmetic model to show why four-digit daily excess-death estimates can be plausible at national scale without claiming they are proven.

Local artifact:

- `data/series/heat-mortality.IN.sensitivity_scale_check.json`

Formula:

```text
excess deaths per day =
  population
  * crude death rate per 1,000
  / 1,000
  / 365
  * exposed population share
  * mortality lift among exposed baseline deaths
```

Inputs in the artifact:

- Population: 1,450,935,791.
- Crude death rate: 6.6 per 1,000.
- Baseline deaths per day: 26,236.

Scenarios:

| Scenario | Exposed share | Mortality lift | Excess deaths/day |
| --- | ---: | ---: | ---: |
| very_low | 20 percent | 3 percent | 157 |
| low | 35 percent | 5 percent | 459 |
| medium | 50 percent | 8 percent | 1,049 |
| frontiers_scale | 70 percent | 13 percent | 2,387 |
| high | 75 percent | 15 percent | 2,952 |

How to explain it:

- This does not validate Frontiers.
- This does not estimate actual deaths in any district.
- It shows that India has such a large baseline mortality denominator that small temporary mortality lifts can produce large absolute numbers if exposure is broad.
- A serious model would need district-level population, age, baseline mortality, exposure metrics, humidity, night heat, occupation, cooling, pollution and possibly lagged effects.

## Chart Sequence In The Current Article

The article uses these visual beats:

1. `India is running hotter than its old climate`
   - Indicator: `climate.temp_anomaly_annual`
   - Source: OWID / Copernicus ERA5
   - Purpose: physical warming signal.

2. `National heat exposure was already rising by 2014`
   - Indicators: `climate.cckp.heatindex39_historical`, `climate.cckp.hotdays40_historical`, `climate.cckp.warmnights26_historical`
   - Source: World Bank CCKP
   - Purpose: exposure bridge from weather to health.
   - Caveat: 1950-2014 only.

3. `The future exposure problem is much larger`
   - Indicators: `climate.cckp.heatindex39_historical`, `climate.cckp.heatindex39_ssp245`
   - Source: World Bank CCKP
   - Purpose: future exposure scale.
   - Caveat: projection, not death count.

4. `Hot nights show why heat is a health problem`
   - Indicators: Delhi, Mumbai, Chennai, Bengaluru hot nights
   - Source: Open-Meteo ERA5 city points
   - Purpose: explain physiology and recovery.
   - Caveat: point series, not neighbourhood maps.

5. `Who can avoid heat is a social question`
   - Indicators: agriculture employment, vulnerable employment, urban population, electricity access, age 65+
   - Source: World Bank
   - Purpose: show vulnerability and adaptation capacity.
   - Caveat: national context, not individual exposure.

6. `Now the death numbers: they are not measuring the same thing`
   - Indicator: `heat.death_count_comparison`
   - Sources: Frontiers, IMD, OWID/EM-DAT, NCRB, NCDC/NHRIDS
   - Purpose: define the counting problem.

7. `The official 2024 IMD count has a clear seasonal shape`
   - Indicator: `heat.imd_dwe_2024.heatwave_deaths_by_month`
   - Source: IMD DWE 2024 PDF
   - Purpose: concrete official count.

8. `How a national heat day can become a four-digit estimate`
   - Indicator: `heat.sensitivity_scale_check`
   - Source: our arithmetic scale check using World Bank denominator
   - Purpose: make scale legible without overclaiming.

9. `The international disaster database is spiky and incomplete`
   - Indicator: `heat.reported_extreme_temperature_deaths.owid_emdat`
   - Source: OWID / EM-DAT
   - Purpose: show that disaster reporting is narrow and uneven.

10. `The denominator behind any excess-death model`
    - Indicator: `heat.context.crude_death_rate`
    - Source: World Bank / SRS context
    - Purpose: explain why baseline mortality matters.

## Main Source URLs

Anchor study:

- Frontiers article: `https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full`

Mortality and health reporting:

- IMD DWE 2024 PDF: `https://www.imdpune.gov.in/library/public/DWE_2024.pdf`
- IMD heatwave guidance: `https://mausam.imd.gov.in/responsive/heatwave_guidance.php`
- OWID disaster deaths: `https://ourworldindata.org/grapher/natural-disasters-deaths`
- OWID database limitations: `https://ourworldindata.org/disaster-database-limitations`
- CRS 2022 catalog: `https://censusindia.gov.in/nada/index.php/catalog/45564`
- SRS catalog used locally: `https://censusindia.gov.in/nada/index.php/catalog/46172`
- NCDC heat illness surveillance FAQ: `https://ncdc.mohfw.gov.in/wp-content/uploads/2024/07/FAQ-on-Heat-Related-Illness-Death-Surveillance_2024.pdf`
- MCCD/cause-of-death gaps paper: `https://www.nature.com/articles/s41598-025-27634-1`

Exposure and climate:

- World Bank India heat risk: `https://climateknowledgeportal.worldbank.org/country/india/heat-risk`
- World Bank CCKP API base: `https://cckpapi.worldbank.org/cckp/v1`
- World Bank Global Extreme Heat Hazard: `https://datacatalog.worldbank.org/search/dataset/0040194/global-extreme-heat-hazard`
- Copernicus ERA5/ERA5-Land: `https://climate.copernicus.eu/climate-reanalysis`
- ERA5 monthly means dataset used locally: `https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means`
- Open-Meteo historical weather API: `https://open-meteo.com/en/docs/historical-weather-api`
- NASA POWER hourly API: `https://power.larc.nasa.gov/docs/services/api/temporal/hourly/`
- NOAA CPC global temperature: `https://psl.noaa.gov/data/gridded/data.cpc.globaltemp.html`
- CEEW district heat-risk study: `https://www.ceew.in/publications/mapping-climate-risks-and-impacts-of-extreme-heatwave-disaster-in-indian-districts`
- ScienceOpen UHI exposure dataset: `https://www.scienceopen.com/document?vid=25d1c151-9790-4b1f-aba3-67d59d6bcd72`

Vulnerability and population:

- World Bank Indicators API: `https://api.worldbank.org/v2/`
- World Bank Data360 climate atlas: `https://data360.worldbank.org/en/atlas/climate/`
- UNDP Human Climate Horizons: `https://hdr.undp.org/data-center/human-climate-horizons-data-and-insights-platform`
- HCH country summary CSV: `https://horizons.hdr.undp.org/data/CountrySummary.csv`
- UNDP HDR data downloads: `https://hdr.undp.org/data-center/documentation-and-downloads`
- WorldPop India age-sex structures: `https://hub.worldpop.org/geodata/summary?id=104815`
- NFHS electric fan variable example: `https://microdata.worldbank.org/catalog/3110/variable/C_ELECFAN`
- eSankhyiki MCP: `https://github.com/nso-india/esankhyiki-mcp`

Policy:

- CPR Heat Action Plan assessment: `https://cprindia.org/briefsreports/how-is-india-adapting-to-heatwaves-an-assessment-of-heat-action-plans-with-insights-for-transformative-climate-action/`
- India Energy Atlas power supply position: `https://www.energymap.in/psp-daily`

## How To Recreate The Story

1. Rebuild the broad v1 data if needed:

```bash
npm run ingest:v1
```

2. Ingest the heat mortality evidence packet:

```bash
node scripts/ingest-heat-mortality-evidence.mjs
```

3. Ingest World Bank CCKP heat indicators:

```bash
node scripts/ingest-cckp.mjs
```

4. Ingest city Open-Meteo ERA5 daily and derived threshold series:

```bash
node scripts/ingest-open-meteo.mjs
```

5. If Copernicus CDS credentials are configured, regenerate ERA5 monthly national means:

```bash
python scripts/adapters/era5_ingest.py
```

6. Parse or refresh heat PDFs:

```bash
node scripts/extract-heat-mortality-pdfs.mjs
node scripts/extract-imd-dwe-historical-heatwave.mjs
```

7. Check the article registry entry:

```bash
rg -n "q\\.climate\\.heat_mortality|heatDeathCountBars|imdHeatMonthBars|owidExtremeTemperatureDeathsLine" scripts src data
```

8. Build the site:

```bash
npm run build
```

9. View locally:

```bash
npm run dev
```

Then open:

```text
http://localhost:4321/en/articles/are-indias-heat-deaths-being-counted/
```

## What We Can Say

- India is clearly warming relative to its old climate baseline.
- Heat exposure is not only an occasional event problem; exposure days, hot nights and future heat-stress projections show a broader risk.
- Official heatwave, heatstroke and disaster death counts are narrow administrative or surveillance categories.
- The Frontiers estimate is modelled excess mortality, not a direct daily death count.
- Because India has about 26,000 baseline deaths per day, even a small temporary mortality lift over a large exposed population can become a large absolute number.
- The undercount is plausible and important, but the exact undercount cannot be proven from current public data alone.

## What We Cannot Say

- We cannot say 3,400 people are observed to die of heat every day.
- We cannot say the Frontiers number has been independently validated by national excess-mortality data.
- We cannot treat IMD, NCRB, NCDC, OWID/EM-DAT and Frontiers as measuring the same statistic.
- We cannot use CCKP historical heat indicators as post-2014 observed exposure.
- We cannot infer district-level mortality from national averages.
- We cannot treat electricity access as actual cooling access or power reliability.
- We cannot treat city-point ERA5 as neighbourhood-level exposure.

## Best Next Upgrade

The most valuable next data upgrade is a true observed/reanalysis exposure series through the present:

1. Fetch ERA5 or ERA5-Land daily/hourly data for India, or a district/city point sample.
2. Include 2m temperature and 2m dew point at minimum.
3. Add wind and radiation if computing WBGT or UTCI.
4. Derive daily Tmax, Tmin, heat index or wet-bulb-like metrics.
5. Aggregate into:
   - hot days,
   - hot nights,
   - dangerous heat-index days,
   - population-weighted exposure,
   - district or city exposure.
6. Compare the derived exposure series against CCKP, Open-Meteo and IMD where possible.

That would let us replace the 1950-2014 CCKP exposure chart with an observed/reanalysis heat-exposure chart extending to 2024 or 2025.
