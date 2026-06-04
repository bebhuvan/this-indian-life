# Heat Mortality Evidence Packet

Last updated: 2026-06-03

This is the reproducible evidence packet for the India heat mortality article. It is deliberately split into observed reported counts, modelled estimates, exposure/vulnerability context, and source inventory so the article does not blur different kinds of evidence.

For detailed data checks and source-definition cautions, see `docs/HEAT_MORTALITY_DATA_AUDIT.md`.

## How To Refresh

Run:

```bash
npm run ingest:heat-mortality
npm run extract:heat-mortality-pdfs
npm run extract:imd-dwe-heatwave
```

The ingest script writes raw snapshots under `data/snapshots/heat-mortality/` and normalized artifacts under `data/series/`. The PDF extraction script parses the local Lancet and IMD PDF snapshots, saves extracted text snapshots, and writes structured PDF-derived artifacts.

To attempt a gentle historical IMD DWE download before parsing, run the historical extractor directly:

```bash
node scripts/extract-imd-dwe-historical-heatwave.mjs --years=2013-2024 --download --timeout-ms=15000
```

The historical extractor is cache-first. If no requested year parses, it writes only a run summary and does not overwrite existing historical artifacts with empty tables.

IMD DWE PDFs should be placed in:

```text
data/snapshots/imd-dwe/
```

Use stable names like `DWE_2023.pdf`, `DWE_2022.pdf`, etc. The historical extractor also continues to search the older heat-mortality snapshot folder for already cached PDFs.

## Generated Artifacts

| Artifact | Role | Claim boundary |
| --- | --- | --- |
| `data/series/heat-mortality.IN.reported_extreme_temperature_deaths_owid_emdat.json` | Reported extreme-temperature disaster deaths from OWID/EM-DAT | Useful comparator; not full heat-attributable mortality |
| `data/series/heat-mortality.IN.undp_hch_heat_context.json` | UNDP Human Climate Horizons heat, mortality, labour, energy projections | Future-risk context; not observed present-day deaths |
| `data/series/heat-mortality.IN.worldbank_context_latest.json` | Latest World Bank population, elderly share, employment, PM2.5, electricity context | Vulnerability/exposure denominators; not heat-death estimates |
| `data/series/heat-mortality.IN.admin_and_model_anchors.json` | Curated administrative and modelled anchors from Frontiers, NCRB, IMD, NCDC, Lancet | Mixed evidence; check `verificationStatus` before treating as fully reproducible |
| `data/series/heat-mortality.IN.heat_death_count_comparison.json` | Public-facing comparison table for Frontiers, OWID/EM-DAT, NCRB, IMD, and NCDC | Rows are deliberately not directly comparable; each row states its claim boundary |
| `data/series/heat-mortality.IN.sensitivity_scale_check.json` | Simple denominator-based sensitivity check for daily excess deaths | Illustrative scale check only; not an epidemiological attribution model |
| `data/series/heat-mortality.source_inventory.json` | Source map for article and future modelling | Editorial source inventory, not numeric evidence |
| `data/series/heat-mortality.IN.lancet_countdown_2025_extracted_indicators.json` | Parsed indicators from the Lancet Countdown India 2025 data sheet | Climate-health context; mostly not mortality counts |
| `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_state.json` | Parsed IMD DWE 2024 heatwave deaths by state/UT | Reported disaster deaths; not all-cause excess mortality |
| `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_month.json` | Parsed IMD DWE 2024 heatwave deaths by month | Reported disaster deaths; not all-cause excess mortality |
| `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_summary.json` | Parsed IMD DWE 2024 heatwave summary values | Reported disaster-event counts |
| `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_totals.json` | Historical IMD DWE heatwave death totals for locally available PDFs | Currently parses 2024; expands as older PDFs are cached |
| `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_state.json` | Historical IMD DWE heatwave deaths by state/UT | Currently parses 2024; expands as older PDFs are cached |
| `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_month.json` | Historical IMD DWE heatwave deaths by month | Currently parses 2024; expands as older PDFs are cached |

The script also writes individual World Bank context series:

- `heat-mortality.IN.worldbank_context_population_total.json`
- `heat-mortality.IN.worldbank_context_population_65plus_share.json`
- `heat-mortality.IN.worldbank_context_crude_death_rate.json`
- `heat-mortality.IN.worldbank_context_urban_population_share.json`
- `heat-mortality.IN.worldbank_context_electricity_access.json`
- `heat-mortality.IN.worldbank_context_agriculture_employment_share.json`
- `heat-mortality.IN.worldbank_context_vulnerable_employment_share.json`
- `heat-mortality.IN.worldbank_context_pm25_exposure.json`
- `heat-mortality.IN.worldbank_context_air_pollution_mortality_rate.json`

## Numeric Anchors Fetched Reproducibly

From OWID/EM-DAT:

- India reported extreme-temperature disaster deaths, 2000-2024: 10,398 across years with non-missing values.
- Non-missing years in 2000-2024: 23.
- Maximum in 2000-2024: 2,248 in 2015.

From the heat death count comparison table:

- Frontiers single-day scenario: about 3,400 modelled excess deaths.
- Frontiers five-day heatwave scenario: nearly 30,000 modelled excess deaths.
- OWID/EM-DAT 2024: 733 reported extreme-temperature disaster deaths.
- OWID/EM-DAT 2000-2024 non-missing years: 10,398 reported extreme-temperature disaster deaths.
- NCRB ADSI 2023: about 804 reported heat/sunstroke deaths, currently from public reporting.
- IMD DWE 2024: 460 reported heatwave disaster-event deaths, locally parsed and reconciled.
- NCDC/NHRIDS 2024 public reporting: about 161 confirmed heatstroke deaths, with a separate parliamentary/public figure of 374 heatstroke deaths up to 2024-07-27.

Use this table as the article's count-comparison spine. Do not plot it as a simple ranking without labels; the rows answer different questions.

From the sensitivity scale check:

- Inputs: population 1,450,935,791; rounded World Bank crude death rate 6.6 deaths per 1,000 population per year.
- Implied baseline deaths per day: about 26,000.
- Very low scenario: 20% exposed population, 3% mortality lift among exposed baseline deaths, about 157 illustrative excess deaths in one day.
- Low scenario: 35% exposed, 5% lift, about 459 illustrative excess deaths in one day.
- Middle scenario: 50% exposed, 10% lift, about 1,312 illustrative excess deaths in one day.
- Frontiers-scale denominator check: 70% exposed, 18.5% lift, about 3,400 illustrative excess deaths in one day.
- High scenario: 75% exposed, 15% lift, about 2,952 illustrative excess deaths in one day.

This sensitivity table is for scale intuition only. It does not use district heat exposure, age structure, humidity, night-time heat, lagged mortality, or cause-specific risk coefficients. It must not be described as validating the Frontiers estimate.

From UNDP Human Climate Horizons:

- Available India metrics in the artifact: `days-over-95F`, `mortality`, `highrisk labor`, `lowrisk labor`, `electricity`, `other energy`, `share of land`, `share of population`.
- India median days over 95F:
  - 1986-2005 baseline, RCP8.5 row: 79.83 days/year.
  - 2080-2099, RCP8.5: 181.17 days/year.
- India projected mortality:
  - 2020-2039, RCP8.5: 2.86 additional deaths per 100,000.
  - 2040-2059, RCP8.5: 5.18 additional deaths per 100,000.
  - 2080-2099, RCP8.5: 22.47 additional deaths per 100,000.

From World Bank Indicators:

- Population: 1,450,935,791 in 2024.
- Age 65+ share: 7.15% in 2024.
- Crude death rate: 6.587 deaths per 1,000 population in 2024, rounded to 6.6 in the sensitivity scale check.
- Urban population share: 35.38% in 2024.
- Electricity access: 99.5% in 2023.
- Agriculture employment share: 41.63% in 2025.
- Vulnerable employment share: 71.58% in 2025.
- Mean PM2.5 exposure: 48.39 ug/m3 in 2020.
- Air-pollution-attributed mortality rate: 139.3 deaths per 100,000 in 2019.

From parsed Lancet Countdown India 2025 data sheet:

- Heatwave days per person in 2024: 19.8.
- Heatwave days per person not expected without climate change: 6.6.
- Extra hours of moderate-or-higher heat-stress exposure versus 1990-1999: 366 hours per person.
- Potential labour hours lost due to heat exposure in 2024: 247 billion.
- Potential labour hours lost per person: 419 hours.
- Increase in lost labour hours versus 1990-1999: 124%.
- Agriculture share of heat-related labour-hour losses: 66%.
- Construction share of heat-related labour-hour losses: 20%.
- Potential income lost from heat-related labour capacity reduction: US$194 billion.

From parsed IMD Disastrous Weather Events 2024 PDF:

- Total reported heatwave deaths: 460.
- Total reported disastrous-weather deaths: 3,686.
- Reported heatwave deaths by month: March 1, April 39, May 185, June 235; other months 0.
- Reported heatwave deaths by state/UT: Uttar Pradesh 240, Bihar 63, Telangana 46, Jharkhand 35, Maharashtra 28, Odisha 16, Rajasthan 16, Chhattisgarh 7, Madhya Pradesh 5, Kerala 2, Delhi 1, West Bengal 1.
- Extracted state total: 460.
- Extracted monthly total: 460.

From CEEW district heat-risk study:

- The study maps heat risk across 734 Indian districts using 35 indicators across hazard, exposure, and vulnerability.
- It uses 12 km IMDAA climate data, satellite imagery, NFHS 2019-21, and Census 2011.
- It estimates that 57% of Indian districts, home to 76% of India's population, are at high to very high heat risk.
- It is useful for district risk and vulnerability framing, not for mortality counting.

From the historical IMD DWE extractor:

- IMD's library says annual Disastrous Weather Events publications are available from 1967 through 2024.
- The current reproducible local historical artifact has parsed 2024 only. `DWE_2024.pdf` is stored in `data/snapshots/imd-dwe/`.
- Older IMD DWE PDFs are not yet cached locally. Local `curl`/`wget` attempts to fetch 2023 from IMD failed on 2026-06-03 because the server reset, stalled, or timed out before a successful TLS transfer.
- Once older PDFs are placed under `data/snapshots/imd-dwe/` or `data/snapshots/heat-mortality/` with filenames containing `DWE_YYYY`, `dwe-YYYY`, or `events-YYYY`, the same parser will include them in the historical artifacts.
- Browser-backed inspection of the public 2023 PDF did succeed and found Heat Wave = 181 in Table 1, Table 2, and Table 7; this is recorded as an audit cross-check, not yet as a local artifact point.

## Curated Anchors That Need Care

`heat-mortality.IN.admin_and_model_anchors.json` includes mixed-source values:

- Frontiers: about 3,400 excess deaths for a single extreme-heat day; nearly 30,000 for a five-day heatwave.
- NCRB 2023: about 804 heat/sunstroke deaths, currently from public reporting on the official NCRB report.
- IMD DWE 2024: 460 heatwave deaths, from official PDF snapshot/search-extracted value.
- NCDC/NHRIDS 2024: roughly 48,000 suspected heatstroke cases and 161 confirmed deaths from public policy reporting; 374 heatstroke deaths and 67,637 suspected cases up to July 27, 2024 from parliamentary/wire reporting.
- Lancet Countdown India 2025: 19.8 heatwave days per person in 2024 and 247 billion potential labour hours lost.

Use the `verificationStatus` field in that artifact. It distinguishes primary article/data-sheet values from secondary reports that still need primary table extraction.

## Snapshot Status

The ingest successfully snapshotted:

- OWID natural disasters CSV.
- UNDP HCH country summary CSV.
- World Bank API responses.
- Lancet Countdown India 2025 data sheet PDF.
- IMD Disastrous Weather Events 2024 PDF.
- Lancet Countdown extracted text.
- IMD Disastrous Weather Events extracted text.

The NCDC PDF URLs are retained in the source inventory, but local Node/curl access failed or hung in this environment on 2026-06-03. The article can still cite those URLs, but the evidence packet does not yet preserve local raw snapshots for them.

The IMD DWE reports themselves say the information is sourced from media reports and government Disaster Management Authority reports, with data-collection limitations. Treat IMD DWE deaths as official meteorological disaster-event reported deaths, not as medical death registration or excess mortality.

## Article Rules

Use these distinctions in prose:

- `reported deaths`: deaths administratively labelled as heat/sunstroke, heatwave, or extreme temperature.
- `confirmed heatstroke deaths`: narrower clinical/surveillance category.
- `excess deaths`: modelled deaths above expected baseline during heat exposure.
- `exposure indicators`: heatwave days, days over 95F, WBGT, hot nights.
- `vulnerability indicators`: age, outdoor work, poverty/consumption, cooling access, power reliability, PM2.5, housing, water.

Do not collapse these into one number.
