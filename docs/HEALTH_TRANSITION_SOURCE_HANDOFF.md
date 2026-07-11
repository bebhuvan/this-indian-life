# Health transition article source handoff

Article: `q.health.transition`  
Slug: `is-india-getting-healthier`  
Question: `Is India getting healthier?`  
Last local rebuild context: June 2026

This file is a source map for the current article build. It is meant for Claude or another editor to pick up the work without re-discovering where every number came from.

## Short answer

The article uses enough data to tell a serious story, but only if the story stays honest:

- World Bank HNP gives the long time series and cross-country contrast.
- NFHS gives the India-native, recent survey picture for services, nutrition and adult risks.
- World Bank wealth-quintile data gives inequality, but it is older and survey-vintage specific.
- The data supports a "long survival improvement, unfinished nutrition, rising adult risk, thin system capacity" story.
- The data does not support a clean current-year verdict on whether India is healthy in 2026.

## Main source catalogue

### 1. World Bank Health Nutrition and Population Statistics

Official page: https://databank.worldbank.org/source/health-nutrition-and-population-statistics  
API source id used locally: `16`  
Local ingest script: `scripts/ingest-health-transition.mjs`  
Local manifest: `data/catalog/health-transition-manifest.json`  
Local artifacts: `data/series/worldbank.health-transition.*.json`  
Raw snapshots: `data/snapshots/worldbank/`

Used for:

- Life expectancy
- Under-5 mortality
- Neonatal mortality, ingested as context
- Maternal mortality
- Skilled birth attendance, ingested as context
- Measles immunisation
- DPT immunisation, ingested as context
- Child stunting
- Child wasting
- Child anaemia, ingested as context only
- Women anaemia
- Current health expenditure as percent of GDP
- Out-of-pocket share of current health expenditure
- Current health expenditure per capita, ingested as context
- Hospital beds per 1,000 people
- Physicians per 1,000 people

Countries and aggregates fetched:

- `IND` India
- `WLD` World
- `LMC` Lower middle income
- `BGD` Bangladesh
- `PAK` Pakistan
- `CHN` China
- `VNM` Vietnam
- `IDN` Indonesia
- `LKA` Sri Lanka

Important caveat:

World Bank values are a mix of observed, estimated, modelled and harmonised series depending on the indicator. The database update date is not the same as the data year. Always use the latest non-null observation year shown in each artifact.

### 2. World Bank Health Nutrition and Population Statistics by Wealth Quintile

Official page: https://databank.worldbank.org/source/health-nutrition-and-population-statistics-by-wealth-quintile  
API source id used locally: `39`  
Local ingest script: `scripts/ingest-health-transition.mjs`  
Local derived artifact: `data/series/worldbank.health-transition.ind.wealth_gaps.json`

Used for India wealth-quintile gaps:

- `SH.STA.STNT.Q1.ZS` - stunting, poorest quintile
- `SH.STA.STNT.Q5.ZS` - stunting, richest quintile
- `SH.STA.WAST.Q1.ZS` - wasting, poorest quintile
- `SH.STA.WAST.Q5.ZS` - wasting, richest quintile
- `SH.STA.BRTC.Q1.ZS` - skilled birth attendance, poorest quintile
- `SH.STA.BRTC.Q5.ZS` - skilled birth attendance, richest quintile
- `SH.ACS.MONY.Q1.ZS` - money as barrier to care, poorest quintile women
- `SH.ACS.MONY.Q5.ZS` - money as barrier to care, richest quintile women
- `SH.ACS.DIST.Q1.ZS` - distance as barrier to care, poorest quintile women
- `SH.ACS.DIST.Q5.ZS` - distance as barrier to care, richest quintile women

Derived method:

`health.transition.wealth_gaps` is calculated as the latest available worse-off quintile minus the better-off quintile, except skilled birth attendance, where the rich-minus-poor service gap is shown. Values are percentage-point gaps.

Important caveat:

This is survey-year quintile data, not a live inequality estimate. In the current article it should be framed as "latest available survey year", not as a 2026 measure.

### 3. NFHS-5 and NFHS-6 local data

Official NFHS-6 fact-sheet page: https://rchiips.org/nfhs/factsheet_NFHS-6.shtml  
Local parsed source: `data/nfhs6/nfhs6_clean.json`  
Local ingest script: `scripts/ingest-health-transition.mjs`  
Local derived script: `scripts/derive-health-transition-nfhs.mjs`  
Local artifacts: `data/series/nfhs.health-transition.*.json`  
Local derived manifest: `data/catalog/health-transition-nfhs-derived-manifest.json`

Survey rounds represented in charts:

- NFHS-5: 2019-21, charted at `2021-03-31`
- NFHS-6: 2023-24, charted at `2024-03-31`

National NFHS indicators used:

- `7` - households with any member covered by health insurance or financing
- `28` - antenatal check-up in first trimester
- `30` - at least four antenatal care visits
- `33` - iron folic acid for 180 days or more
- `35` - institutional births
- `37` - births assisted by skilled health personnel
- `38` - caesarean section births
- `44` - full immunisation
- `51` - measles second dose
- `53` - rotavirus vaccine
- `61` - breastfeeding within one hour of birth
- `68` - children 6-23 months receiving adequate diet
- `69` - child stunting
- `70` - child wasting
- `71` - severe child wasting
- `72` - child underweight
- `74` - women with below-normal BMI
- `76` - women overweight or obese
- `77` - men overweight or obese
- `80` - women with high or very high blood sugar or on medication
- `83` - men with high or very high blood sugar or on medication
- `86` - women with elevated blood pressure or on medication
- `89` - men with elevated blood pressure or on medication

Derived NFHS tables:

- `health.transition.nfhs.state_spread`
  - File: `data/series/nfhs.health-transition.state_spread.json`
  - Method: for selected NFHS-6 indicators, highest state/UT total minus lowest state/UT total.
  - Indicators: `7`, `38`, `68`, `69`, `70`, `72`, `76`, `83`.

- `health.transition.nfhs.rural_urban_gaps`
  - File: `data/series/nfhs.health-transition.rural_urban_gaps.json`
  - Method: absolute rural-urban gap in NFHS-6 India values.
  - Row metadata keeps rural value, urban value and which side is higher.

Important caveats:

- NFHS values are survey snapshots, not annual time series.
- NFHS-6 did not measure anaemia, so do not use NFHS-6 for a current anaemia claim.
- The local NFHS-6 artifact excludes Manipur.
- State/UT spreads can be noisy, especially for smaller states and UTs.
- A positive change can be good or bad depending on the indicator. For example, rising rotavirus coverage is good; rising high blood sugar is not.

## Current chart-to-source map

### 1. Indians live much longer than they used to

Chart type: `multiLine`  
Source: World Bank HNP, source id `16`  
Indicators:

- `SP.DYN.LE00.IN` - life expectancy at birth
- Countries: India, World, Bangladesh, China, Sri Lanka

Local examples:

- `data/series/worldbank.health-transition.ind.SP_DYN_LE00_IN.json`
- `data/series/worldbank.health-transition.wld.SP_DYN_LE00_IN.json`

Caveat:

Life expectancy is a period estimate. It is not a prediction for a child born today.

### 2. The biggest win is children surviving

Chart type: `multiLine`  
Source: World Bank HNP, source id `16`  
Indicator:

- `SH.DYN.MORT` - under-5 mortality rate
- Countries/aggregates: India, World, Lower middle income, Bangladesh, Pakistan, Vietnam, Indonesia

Caveat:

Child mortality rates are modelled estimates built from registration and survey inputs.

### 3. Maternal mortality fell, but the frontier is much lower

Chart type: `multiLine`  
Source: World Bank HNP, source id `16`  
Indicator:

- `SH.STA.MMRT` - maternal mortality ratio
- Countries/aggregates: India, World, Lower middle income, Bangladesh, Pakistan, China, Vietnam, Indonesia, Sri Lanka

Caveat:

Maternal mortality is modelled. Read levels and direction, not single-year wiggles.

### 4. Care around birth is deepening

Chart type: `multiLine`  
Source: NFHS-5 and NFHS-6 local data  
Indicators:

- `health.transition.nfhs.institutional_births`
- `health.transition.nfhs.skilled_birth_attendant`
- `health.transition.nfhs.anc_4plus`
- `health.transition.nfhs.ifa_180_days`
- `health.transition.nfhs.c_section`

Caveat:

Only two survey rounds are shown. C-section growth is not automatically bad, but it needs careful reading.

### 5. NFHS moved in many directions at once

Chart type: `rankedChange`  
Source: NFHS-5 and NFHS-6 local data  
Indicators:

- Rotavirus vaccine
- Health insurance
- Measles second dose
- IFA for 180 days or more
- Early breastfeeding
- Adequate diet
- Child stunting
- Child wasting
- C-section births
- Women overweight
- Men high blood sugar
- Women high blood pressure

Caveat:

This chart mixes desirable and undesirable increases. The sign is just change, not moral direction.

### 6. Vaccination went from near-zero to near-universal

Chart type: `multiLine`  
Source: World Bank HNP, source id `16`  
Indicator:

- `SH.IMM.MEAS` - measles immunisation
- Countries/aggregates: India, World, Lower middle income, Bangladesh, Pakistan, China, Vietnam, Indonesia, Sri Lanka

Caveat:

Administrative immunisation series can differ from household-survey estimates.

### 7. Nutrition improved slowly, and India still looks weak

Chart type: `multiLine`  
Source: World Bank HNP, source id `16`  
Indicators:

- `SH.STA.STNT.ZS` - stunting, children under 5
- `SH.STA.WAST.ZS` - wasting, children under 5
- Countries: India plus Asian comparators

Caveat:

Nutrition points are survey-year observations, not smooth annual measurements. Country survey years differ.

### 8. NFHS says stunting fell, but wasting barely moved

Chart type: `multiLine`  
Source: NFHS-5 and NFHS-6 local data  
Indicators:

- Child stunting
- Child wasting
- Severe child wasting
- Child underweight
- Adequate diet, age 6-23 months

Caveat:

Do not add a current anaemia claim here from NFHS-6. NFHS-6 did not measure anaemia.

### 9. The poorest child still starts far behind

Chart type: `tableBars`  
Source: World Bank HNP by Wealth Quintile, source id `39`  
Local artifact:

- `data/series/worldbank.health-transition.ind.wealth_gaps.json`

Inputs:

- Stunting poorest/richest
- Wasting poorest/richest
- Money barrier poorest/richest
- Distance barrier poorest/richest
- Skilled birth poorest/richest

Caveat:

These are latest available survey-year gaps, mostly not current-year measures.

### 10. One India average hides many health transitions

Chart type: `tableBars`  
Source: NFHS-6 local data  
Local artifact:

- `data/series/nfhs.health-transition.state_spread.json`

Method:

Highest state/UT total minus lowest state/UT total for selected indicators.

Caveat:

This is a spread, not a ranking. Small states and UTs can be noisy. Manipur is excluded in the local artifact.

### 11. Rural and urban India have different health problems

Chart type: `tableBars`  
Source: NFHS-6 local data  
Local artifact:

- `data/series/nfhs.health-transition.rural_urban_gaps.json`

Method:

Absolute rural-urban gap in India-level NFHS-6 values.

Caveat:

A higher value can be good or bad depending on the indicator.

### 12. Adults are getting heavier and more diabetic

Chart type: `multiLine`  
Source: NFHS-5 and NFHS-6 local data  
Indicators:

- Women overweight
- Men overweight
- Women high blood sugar
- Men high blood sugar
- Women high blood pressure
- Men high blood pressure

Caveat:

Two survey points only. NFHS blood sugar and blood pressure are field measurements, but the chart cannot prove cause.

### 13. India spends little, and families still pay a lot

Chart type: `multiLine`  
Source: World Bank HNP, source id `16`  
Indicators:

- `SH.XPD.CHEX.GD.ZS` - current health expenditure as percent of GDP
- `SH.XPD.OOPC.CH.ZS` - out-of-pocket expenditure as percent of current health expenditure
- Countries/aggregates: India and World in the current chart

Caveat:

This mixes two denominators in one chart. GDP share is not the same as spending share.

### 14. Doctors and beds rose, then remained thin

Chart type: `multiLine`  
Source: World Bank HNP, source id `16`  
Indicators:

- `SH.MED.PHYS.ZS` - physicians per 1,000 people
- `SH.MED.BEDS.ZS` - hospital beds per 1,000 people
- Series: India doctors, world doctors, India beds, world beds, China beds, Sri Lanka beds

Caveat:

Doctor and bed values have different latest years and reporting gaps. Compare broad capacity, not precise current-year ranks.

## Ingested but not central to current charts

These series are available in local data and may help deepen the article if used carefully:

- `SH.DYN.NMRT` - neonatal mortality
- `SH.STA.BRTC.ZS` - skilled birth attendance from World Bank
- `SH.IMM.IDPT` - DPT immunisation
- `SH.ANM.CHLD.ZS` - child anaemia
- `SH.ANM.ALLW.ZS` - women anaemia
- `SH.XPD.CHEX.PC.CD` - health expenditure per capita

Use these only if they add a distinct idea. Do not pad the article with duplicate charts.

## Known traps

- Do not say "latest data is 2026" just because the source was fetched or updated in 2026.
- Do not treat World Bank modelled mortality as direct measurement.
- Do not compare NFHS two-point charts as if they are annual trends.
- Do not claim NFHS-6 anaemia movement. It was not measured.
- Do not rank countries on nutrition without checking survey years.
- Do not rank capacity too precisely because doctors and beds have different reporting years.
- Do not flatten India's state story into a single average.
- Do not present rising adult risk as a minor footnote. It is central to the transition story.
- Do not make every chart say "India improved but still lags". The story needs distinct beats.

## Files Claude should inspect first

- `scripts/registry/v1-indicators.mjs`
- `scripts/ingest-health-transition.mjs`
- `scripts/derive-health-transition-nfhs.mjs`
- `data/explanations/en/q.health.transition.json`
- `data/catalog/health-transition-manifest.json`
- `data/catalog/health-transition-nfhs-derived-manifest.json`
- `data/nfhs6/nfhs6_clean.json`
- `docs/CHART_SELECTION_PHILOSOPHY.md`
- `docs/EDITORIAL_NORTH_STAR.md`
- `docs/academy/VOICE.md`

## Rebuild commands

```bash
node scripts/ingest-health-transition.mjs
node scripts/derive-health-transition-nfhs.mjs
INDICA_DEEPSEEK_TIMEOUT_MS=240000 node scripts/generate-health-transition-batched.mjs
INDICA_DEEPSEEK_TIMEOUT_MS=240000 node scripts/generate-health-transition-explainers.mjs
npm run build
npm run dev -- --host 127.0.0.1 --port 4325
```

Restart the dev server after changing generated data files. The article will silently drop from the build if `data/explanations/en/q.health.transition.json` is missing or invalid.
