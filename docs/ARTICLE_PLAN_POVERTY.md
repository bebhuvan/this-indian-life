# Poverty Article To-Do / Handoff

Question: `q.econ.poverty`  
Slug: `has-india-ended-poverty`  
Current status: built and marked `ready` in `data/explanations/en/q.econ.poverty.json`.

## Done

- [x] Added a poverty-specific question and visual plan in `scripts/registry/v1-indicators.mjs`.
- [x] Added World Bank 2021-PPP poverty lines from the October 2025 Poverty & Equity Brief:
  - `$3/day`: 27.1% in 2011-12 to 5.3% in 2022-23.
  - `$4.20/day`: 57.7% in 2011-12 to 23.9% in 2022-23.
  - 2022-23 counts: 75.24 million below `$3/day`, 342.32 million below `$4.20/day`.
- [x] Added rural/urban World Bank `$4.20/day` split.
- [x] Added World Bank group-risk cuts at the broader line:
  - Children 0-14: 31.2% below the line.
  - Adults with no education: 30.2%.
  - Adults with tertiary/post-secondary education: 8.7%.
- [x] Added official Tendulkar poverty history and Tendulkar vs Rangarajan 2011-12 comparisons.
- [x] Added a Tinbergen Institute dissent/robustness chart from Himanshu, Lanjouw and Schirmer (2025):
  - Artifact series: `econ.poverty.tinbergen_plfs_tendulkar_sfe`, `econ.poverty.tinbergen_plfs_tendulkar_state`, `econ.poverty.tinbergen_plfs_tendulkar_lasso`.
  - Artifact table: `econ.poverty.tinbergen_estimates_2022`.
  - Interpretation: research estimates, not official rates; useful because they directly address survey non-comparability after 2011-12.
- [x] Reused MoSPI HCES 2023-24 MPCE, welfare-imputed MPCE, fractile ladder, state MPCE and caste MPCE artifacts.
- [x] Added HCES rural consumption-share context:
  - Poorest 50%: 33.6% of rural consumption.
  - Middle 40%: 45.7%.
  - Richest 10%: 20.7%.
  - Richest 5%: 12.3%.
- [x] Added HCES unit-level cutoff simulation:
  - Script: `scripts/derive-hces-poverty-cutoffs.py`.
  - Artifacts: `econ.poverty.hces_cutoff_simulation`, `econ.poverty.hces_cutoff_simulation_sector`, `econ.poverty.hces_cutoff_state_3000`, `econ.poverty.hces_cutoff_state_4000`, `econ.poverty.hces_cutoff_social_3000` and `econ.poverty.hces_cutoff_social_4000`.
  - Default cutoffs: Rs 1,500 to Rs 8,000 per person per month.
- [x] Added NFHS nutrition artifact:
  - Script: `scripts/ingest-nfhs-poverty-health.mjs`.
  - Artifact: `econ.poverty.nfhs_nutrition_latest`.
- [x] Added NFHS basic household capability artifact:
  - Script: `scripts/ingest-nfhs-poverty-basic.mjs`.
  - Artifact: `econ.poverty.nfhs_basic_floor_latest`.
  - Latest NFHS-6 values: electricity at home 98.3%, improved drinking water 96.5%, household bank account 98.2%, household health insurance 60.2%, women ever attended school 73.7%.
- [x] Added NITI national MPI history and rebuilt the state MPI table.
- [x] Added World Bank multidimensional poverty components.
- [x] Added World Bank UHC financial-protection indicators:
  - Script: `scripts/ingest-poverty-health-financial.mjs`.
  - Artifact: `econ.poverty.health_financial_hardship`.
  - Latest values: financial hardship from out-of-pocket health spending 30.94% in 2022; impoverishing out-of-pocket health spending 22.27% in 2022; large non-impoverishing out-of-pocket health spending 8.67% in 2022.
- [x] Added ILOSTAT working-poverty context.
- [x] Added article-specific generator template in `scripts/generate-explanations.mjs`.
- [x] Added chart explainers for every planned chart.
- [x] Set `sectionVisualMap` explicitly.
- [x] Clarified confusing chart units and labels:
  - Poverty-line charts now say whether bars/lines are `% of people below the line`, `million people below the line`, or rupees per person per month.
  - MPI dates now use survey/estimate labels such as `2005-06`, `2019-21`, and `2022-23`.
- [x] Built successfully with `npm run build`.

## Current Thesis

India has sharply reduced extreme poverty. It has not eradicated poverty under broader lines or vulnerability measures. The strongest true sentence is: the floor rose, but the floor is still low.

## Cutoff Simulation

Yes, we can simulate poverty rates at arbitrary rupee cutoffs using HCES 2023-24 unit microdata.

Command:

```bash
python3 scripts/derive-hces-poverty-cutoffs.py --cutoffs=2000,2500,3000,3500,4000 --write
```

Interpretation:

- The script computes the population-weighted share of people living in households with MPCE below each nominal monthly rupee cutoff.
- It reconstructs MPCE from HCES unit records, applies reference-period scaling, and calibrates rural/urban levels to the published HCES 2023-24 means.
- These are sensitivity simulations, not official poverty estimates.
- They are not PPP-dollar poverty lines. They are 2023-24 rupees per person per month.

Default output examples:

| Cutoff | All India | Rural | Urban |
| --- | ---: | ---: | ---: |
| Rs 2,500/month | 11.6% | 15.6% | 2.1% |
| Rs 3,000/month | 22.7% | 30.0% | 5.5% |
| Rs 4,000/month | 46.2% | 58.3% | 17.6% |
| Rs 5,000/month | 63.9% | 76.8% | 33.7% |

## Remaining Data Gaps

- [ ] Add official HCES 2022-23 equivalent cutoff simulation if the 2022-23 unit-level microdata is present or can be downloaded. Current simulation is 2023-24 only.
- [x] Add health-shock vulnerability from World Bank UHC financial-protection data.
- [ ] Add NSS health expenditure microdata if we want distributional detail by state, rural/urban, caste, and hospitalization status. The current World Bank UHC indicators are national population shares only.
- [ ] Add catastrophic health expenditure by standard 10%/25% household-budget thresholds if a clean India time series is available. The World Bank WDI search surfaced current financial-hardship indicators, but the older threshold-coded indicators were not populated for India in the API check.
- [ ] Add NFSA/PDS coverage if we want to explain why food-transfer beneficiaries are not the same thing as poverty counts.
- [ ] Evaluate the official MoSPI eSankhyiki MCP (`https://github.com/nso-india/esankhyiki-mcp`) for future ingestion. It exposes HCES, PLFS, NFHS, NSS79 health/education, NSS78 living conditions, CPIAL/RL and other datasets through a cleaner MCP workflow.
- [ ] Consider UNDP/OPHI Global MPI for cross-country context. Keep separate from NITI MPI because definitions and survey vintages differ.
- [ ] Consider FAO/UNICEF food insecurity or child food poverty indicators if we want a global nutrition/food-security comparator beyond NFHS.
- [ ] Consider PLFS/NSS informality, casual wages, and household employment status cuts if we want the work-vulnerability section to go beyond ILOSTAT working poverty.
- [ ] Consider MoSPI CPIAL/RL or state CPI deflators for state-adjusted rupee cutoff simulations. Current cutoff maps use one nominal national cutoff.
- [ ] Consider NSS78/NSS79/NSS80 eSankhyiki tables for water/sanitation, borrowing, literacy, health and digital access. These can deepen the capability story without overloading the main chart sequence.
- [ ] Consider SECC/Census deprivation geography only as historical context. It is useful for district maps, but too old to support a current poverty claim.

## Editorial Finish Checks

- [x] Ends with methodology and caveats.
- [x] Distinguishes consumption poverty, official poverty line, MPI, nutrition and work vulnerability.
- [x] Avoids claiming a single cause.
- [x] States HCES comparability caveat.
- [x] States welfare-imputation caveat.
- [x] States that cutoff simulation is not an official estimate.
- [ ] Final human texture pass after reading the page in browser.
- [ ] Optional: add 3-5 curated internal wiki links after confirming live target pages.
