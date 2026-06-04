# India Heat Mortality Research Dossier

Last updated: 2026-06-03

## Editorial Thesis

The strongest article is not a defence of one dramatic number. It is an explanation of why India has three different heat-death realities:

1. Official heatstroke/disaster deaths, which are counted but narrow.
2. Facility surveillance deaths, which are closer to health-system reality but still incomplete.
3. Excess deaths, which are estimated and uncertain but probably closer to the true health burden of heat.

The honest claim is:

> The new 3,400-deaths-in-a-day estimate is not a direct body count and should not be repeated as if it is. But official heat-death counts are also not the full burden. India almost certainly undercounts heat mortality because heat often kills through cardiovascular, respiratory, renal, and other pathways that do not get labelled as heatstroke. The exact number is uncertain; the undercount is the story.

## Anchor Study

**Frontiers in Environmental Health, 2026: "Estimating heatwave-induced excess mortality in India's districts"**

Source: https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full

What it estimates:

- A single day of extreme heat: about 3,400 excess deaths nationally.
- A five-day heatwave: nearly 30,000 excess deaths.
- Uttar Pradesh: about 8,100 excess deaths during a five-day heatwave.
- Some districts such as Ahmedabad, Jaipur, and Surat: more than 250 excess deaths in a single event.

What it uses:

- District-level mortality rates from the Civil Registration System.
- 2024 population projections.
- Heatwave mortality coefficients from a 10-city Indian epidemiological study.
- Koppen-Geiger climate classification to transfer city risk coefficients to districts.

What it does not prove:

- It does not identify individual deaths.
- It does not show that 3,400 people die from heat every ordinary summer day.
- It does not directly observe all-cause mortality spikes in every district.
- It does not fully solve rural risk, occupational exposure, humidity, night-time heat, or local cooling access.

## Evidence Layer 1: Official And Administrative Death Counts

These sources answer: "How many deaths were officially labelled as heat/sunstroke, heatwave, or extreme-temperature deaths?"

They do not answer: "How many extra deaths did heat actually cause?"

| Source | What to use | Why it matters | Main caveat |
| --- | --- | --- | --- |
| NCRB, Accidental Deaths and Suicides in India | Heat/sunstroke deaths under accidental deaths due to forces of nature | Official annual administrative count | Cause label is narrow; not an excess-mortality system |
| NCDC/NHRIDS/IHIP | Suspected heatstroke cases, suspected/confirmed heatstroke deaths, CVD deaths, total facility deaths | Closest health-system surveillance layer | Facility-based; not fully public as a daily dataset; dependent on reporting and diagnosis |
| IMD/Disastrous Weather Events | Reported human deaths by event type/state | Meteorological disaster reporting and cross-check | Disaster reports are not health mortality studies |
| NDMA/state disaster data | Recognised disaster deaths, compensation-linked counts | Policy and relief relevance | Incentives and certification vary by state |
| OWID/EM-DAT | Reported extreme-temperature disaster deaths | International comparator | EM-DAT is event/disaster reporting, not true heat-attributable mortality |

Observed anchors already pulled:

- OWID/EM-DAT "Extreme temperature" deaths for India, 2000-2024: 10,398 reported deaths across years with non-missing values.
- OWID/EM-DAT recent reported values: 1,930 in 2002; 1,351 in 2003; 2,248 in 2015; 300 in 2016; 733 in 2024; no value yet for 2025 in the chart as checked on 2026-06-03.
- NCRB 2023, as reported by Indian Express: heat/sun stroke claimed about 804 deaths in 2023.
- IMD Disastrous Weather Events 2024, parsed from the local PDF snapshot: 460 reported heatwave deaths in 2024, including 240 in Uttar Pradesh. The parsed state total and parsed month total both reconcile to 460.
- NCDC/NHRIDS reported 2024 figures vary by cutoff. Public reporting cites roughly 48,000 suspected heatstroke cases and about 161-169 confirmed heatstroke deaths for March-July 2024; parliamentary reporting cited 374 heatstroke deaths and 67,637 suspected cases up to July 27, 2024. Treat these as cutoff-dependent administrative figures until the original dataset is obtained.

Public article comparison spine:

| Source | Period | Number | Evidence type | Claim boundary |
| --- | --- | ---: | --- | --- |
| Frontiers | Single extreme-heat day scenario | about 3,400 | Modelled excess mortality | Not a registered death count |
| Frontiers | Five-day heatwave scenario | nearly 30,000 | Modelled excess mortality | Not an observed national death count |
| OWID/EM-DAT | 2024 | 733 | Reported disaster deaths | Not all heat-attributable mortality |
| OWID/EM-DAT | 2000-2024 non-missing years | 10,398 | Reported disaster deaths | Not all heat-attributable mortality |
| NCRB ADSI | 2023 | about 804 | Administrative heat/sunstroke label | Not excess mortality |
| IMD DWE | 2024 | 460 | Meteorological disaster-event deaths | Not medical death registration |
| NCDC/NHRIDS | 2024 public reporting | about 161 confirmed deaths | Surveillance-confirmed heatstroke deaths | Not all heat-attributable deaths |
| NCDC/NHRIDS parliamentary reporting | 2024-03-01 to 2024-07-27 | 374 | Cutoff-specific heatstroke deaths | Not full-year excess mortality |

This table is the article's clearest caveat device. It should be presented as "different questions, different numbers," not as a leaderboard of truthfulness.

Sources:

- OWID disaster deaths: https://ourworldindata.org/grapher/natural-disasters-deaths
- OWID database limitations: https://ourworldindata.org/disaster-database-limitations
- NCRB 2023 reporting: https://indianexpress.com/article/india/natural-forces-lightning-heat-stroke-killed-2023-ncrb-report-10282010/
- IMD heatwave guidance and reports: https://mausam.imd.gov.in/responsive/heatwave_guidance.php
- IMD Disastrous Weather Events 2024: https://www.imdpune.gov.in/library/public/DWE_2024.pdf
- NCDC FAQ: https://ncdc.mohfw.gov.in/wp-content/uploads/2024/07/FAQ-on-Heat-Related-Illness-Death-Surveillance_2024.pdf
- National Action Plan on Heat-Related Illnesses: https://ncdc.mohfw.gov.in/wp-content/uploads/2024/05/1.Nation-Action-plan-on-Heat-Related-llnesses.pdf

## Evidence Layer 2: Mortality Infrastructure

These sources answer: "What is the denominator and how good is India's death-registration system?"

| Source | What to use | Why it matters | Main caveat |
| --- | --- | --- | --- |
| Civil Registration System | Registered deaths, death registration completeness, state variation | Baseline mortality infrastructure | Annual, not daily; completeness and data quality vary |
| Sample Registration System | Crude death rates, age-specific death rates, state/rural/urban estimates | Baseline mortality where CRS is uneven | Sample survey, not event-level |
| MCCD | Medically certified cause of death | Explains why heat deaths disappear into broad causes | Low coverage; skewed toward hospitals and better-registering states |
| SRS causes of death | Broad cause-of-death structure | Helps explain heat pathways through CVD/respiratory/renal causes | Verbal autopsy categories are broad |
| WHO GHO/GHE | Comparable cause-of-death context | Puts India's CVD, respiratory, renal, and NCD burden in context | Modelled international estimates |
| IHME/GBD | High-temperature-attributable deaths/DALYs, cause-specific burden | A separate modelled estimate of temperature burden | Complex model; not official Indian administrative data |

Critical caveat for the article:

Cause-specific heat deaths are weak not because nobody dies from heat, but because most deaths are not medically certified with a cause. A Scientific Reports paper and public reporting cite India's MCCD coverage at only 22.5% of registered deaths in 2020.

Sources:

- CRS 2022 catalog: https://censusindia.gov.in/nada/index.php/catalog/45564
- SRS 2022 summary: https://ruralindiaonline.org/te/library/resource/sample-registration-system-statistical-report-2022/
- SRS Causes of Death 2020-2022: https://ruralindiaonline.org/ml/library/resource/causes-of-death-statistics-2020-to-2022/
- Scientific Reports on MCCD/cause-of-death gaps: https://www.nature.com/articles/s41598-025-27634-1
- WHO Global Health Estimates: https://www.who.int/data/global-health-estimates/
- WHO Global Health Observatory: https://www.who.int/data/gho
- GBD high-temperature risk summary: https://www.healthdata.org/sites/default/files/disease_and_injury/gbd_2021/topic_pdf/risk/337.pdf

## Evidence Layer 3: Heat Exposure

These sources answer: "How hot was it, where, and for whom?"

| Source | What to use | Why it matters | Main caveat |
| --- | --- | --- | --- |
| IMD gridded temperature | Daily Tmax/Tmin; heatwave days; warm nights | India-specific meteorological backbone | Access/parsing work; definitions can differ |
| ERA5/ERA5-Land | Temperature, dew point, humidity, wind, radiation | Enables heat index, WBGT, UTCI, humid heat | Reanalysis, not station observation |
| NASA POWER | Daily/hourly temperature and humidity API | Fast reproducible extraction | Coarser and model-derived |
| NOAA CPC Global Unified Temperature | Independent daily gridded temperature | Robust cross-check | Global product, less India-specific |
| Berkeley Earth | Long-run temperature context | Historical warming narrative | Not a heatwave mortality exposure dataset |
| World Bank CCKP | Country heat-risk framing | Public summary and indicators | Better for context than modelling |
| World Bank Global Extreme Heat Hazard | WBGT at 10 km, 5/20/100-year return periods | Human-health and labour heat-stress framing | Historical/probabilistic hazard, not daily mortality exposure |
| CEEW district heat-risk study | 734-district composite heat risk index using 35 indicators | District-level hazard, exposure, vulnerability, warm-night, humidity, and planning context | Composite risk index, not mortality evidence |
| UNDP Human Climate Horizons | Days over 95F, future mortality, labour and energy impacts | Future-risk comparator | Projection/model, not observed present-day death count |
| Lancet Countdown | Heatwave exposure, heat stress hours, labour hours, heat mortality indicators | Peer-reviewed annual climate-health indicators | Some indicators are global model outputs |
| World Weather Attribution / Climate Central | Climate-attribution context | Shows climate change role in heat events | Event attribution, not mortality attribution unless paired with health data |

Useful observed/projection anchors:

- IMD: 2024 had 554 heatwave days over the Indian region, up from 230 in 2023, as reported from a Rajya Sabha answer.
- UNDP HCH India median days over 95F:
  - 1986-2005 baseline: 79.8 days/year.
  - 2080-2099, RCP8.5: 181.2 days/year, with a wide uncertainty range.
- UNDP HCH India projected temperature-related mortality:
  - 2020-2039, RCP8.5: 2.86 additional deaths per 100,000.
  - 2040-2059, RCP8.5: 5.18 additional deaths per 100,000.
  - 2080-2099, RCP8.5: 22.47 additional deaths per 100,000.
- Lancet Countdown 2025 India data sheet:
  - In 2024, people in India were exposed to 19.8 heatwave days each on average.
  - 6.6 of those days would not have been expected without climate change.
  - Compared with 1990-1999, people were exposed on average to 366 more hours during which ambient heat posed at least moderate heat-stress risk for moderate outdoor physical activity.
  - Heat exposure in 2024 resulted in 247 billion potential labour hours lost, or 419 hours per person.
  - Lost labour hours were 124% higher than in 1990-1999.
  - Agriculture accounted for 66% and construction for 20% of labour-hour losses.
- CEEW 2025 district heat-risk study:
  - Maps heat risk across 734 districts using 35 indicators spanning hazard, exposure, and vulnerability.
  - Uses 12 km IMDAA climate data, satellite imagery, NFHS 2019-21, and Census 2011.
  - Estimates that 57% of Indian districts, home to 76% of the population, are at high to very high risk from extreme heat.
  - Finds very warm nights have risen faster than very hot days over the last decade; about 70% of districts experienced five or more additional very warm nights per summer, compared with about 28% seeing a similar rise in very hot days.

Sources:

- IMD heatwave guidance: https://mausam.imd.gov.in/responsive/heatwave_guidance.php
- IMD annual report: https://metnet.imd.gov.in/docs/imdnews/ANNUAL_REPORT2024English.pdf
- ERA5/ERA5-Land: https://climate.copernicus.eu/climate-reanalysis
- NASA POWER hourly API: https://power.larc.nasa.gov/docs/services/api/temporal/hourly/
- NOAA CPC temperature: https://psl.noaa.gov/data/gridded/data.cpc.globaltemp.html
- Berkeley Earth data: https://berkeleyearth.org/data/
- World Bank India heat risk: https://climateknowledgeportal.worldbank.org/country/india/heat-risk
- World Bank Global Extreme Heat Hazard: https://datacatalog.worldbank.org/search/dataset/0040194/global-extreme-heat-hazard
- CEEW district heat-risk study: https://www.ceew.in/publications/mapping-climate-risks-and-impacts-of-extreme-heatwave-disaster-in-indian-districts
- UNDP HCH: https://hdr.undp.org/data-center/human-climate-horizons-data-and-insights-platform
- HCH country summary CSV: https://horizons.hdr.undp.org/data/CountrySummary.csv
- Lancet Countdown data explorer: https://lancetcountdown.org/explore-our-data/
- Lancet Countdown India 2025 data sheet: https://lancetcountdown.org/wp-content/uploads/2025/10/India_Lancet-Countdown_2025_Data-Sheet-2.pdf
- World Weather Attribution 2024 review: https://www.worldweatherattribution.org/when-risks-become-reality-extreme-weather-in-2024/
- Climate Central CSI: https://csi.climatecentral.org/

## Evidence Layer 4: Population And Vulnerability

These sources answer: "Who was exposed, and who was least able to protect themselves?"

| Source | What to use | Why it matters | Main caveat |
| --- | --- | --- | --- |
| Census 2011 | District population, age/sex, rural/urban, workers | Official subnational backbone | Old; no 2021 Census |
| ORGI projections | State/national population by age | Updates denominator beyond 2011 | Not district-granular enough for all uses |
| UN WPP / World Bank | Population, elderly share, urban share | Comparable national denominator | Modelled/international harmonised |
| WorldPop | Gridded population and age/sex estimates | Exposure overlay at raster level | Modelled population surfaces |
| NFHS | Electricity, fan/AC/cooler, household conditions, health vulnerability | Cooling and health vulnerability | Survey timing; microdata requires careful weighting |
| DHS/IPUMS DHS | NFHS microdata variables and metadata | Replicable household analysis | Registration and survey design requirements |
| PLFS | Outdoor/informal/agriculture/construction workers | Occupational heat exposure | Survey microdata/weights needed |
| Census worker tables | District worker categories | Official labour-exposure proxy | 2011 vintage |
| NSS78 | Drinking water, sanitation, migration, living conditions | Household vulnerability | Survey timing and weighting |
| HCES | Consumption/poverty proxy | Economic capacity to adapt | Survey microdata/weights needed |
| Time Use Survey | Time outdoors, unpaid work, gendered exposure | Shows who bears heat exposure at home/work | Harder to map to heat events |
| Economic Census | Establishments and workers | Business/workplace exposure | Business census, not population census |
| World Bank Data360 | Exposure plus vulnerability framing | Global risk narrative | Not a substitute for India microdata |
| INFORM / ND-GAIN / WorldRiskIndex | Risk/coping-capacity comparators | International context | Country-level indices hide district inequality |

World Bank India vulnerability anchors checked on 2026-06-03:

- Population: 1.451 billion in 2024.
- Population age 65+: 7.15% in 2024.
- Urban population: 35.38% in 2024.
- Electricity access: 99.5% in 2023.
- Agriculture employment: 41.63% in 2025.
- Vulnerable employment: 71.58% in 2025.
- Mean PM2.5 exposure: 48.39 ug/m3 in 2020.
- Mortality rate attributed to household and ambient air pollution: 139.3 per 100,000 in 2019.

These are useful denominators, but they are not heat-specific mortality estimates.

Sources:

- Census population finder: https://censusindia.gov.in/census.website/en/data/population-finder
- WorldPop India age-sex structures: https://hub.worldpop.org/geodata/summary?id=104815
- DHS/NFHS API: https://api.dhsprogram.com/
- NFHS variable example, electric fan: https://microdata.worldbank.org/catalog/3110/variable/C_ELECFAN
- MoSPI/eSankhyiki MCP: https://github.com/nso-india/esankhyiki-mcp
- World Bank Data360 climate atlas: https://data360.worldbank.org/en/atlas/climate/
- INFORM index: https://www.undp.org/geneva/inform-index-risk-management
- ND-GAIN: https://gain.nd.edu/our-work/country-index/

## Evidence Layer 5: Modifiers

These sources answer: "What makes a hot day more deadly in one place than another?"

| Modifier | Source candidates | Use | Caveat |
| --- | --- | --- | --- |
| Humidity / WBGT | ERA5-Land, World Bank heat hazard | Human heat stress beyond dry-bulb temperature | WBGT assumptions vary |
| Night-time heat | IMD Tmin, ERA5-Land | Lack of overnight recovery | Needs daily/subdaily analysis |
| Air pollution | CREA/Stanford PM2.5, CPCB, OpenAQ, WHO/WB | Interaction with cardiovascular/respiratory mortality | Interaction estimates are hard |
| Power reliability | India Energy Atlas, CEA daily power supply | Cooling access can fail during outages | Outage/local feeder data may be missing |
| Cooling access | NFHS, HCES, NSS | Fan/AC/cooler access | Ownership is not use; use depends on power and affordability |
| Urban heat islands | MODIS LST, Yale/NASA SUHI, ScienceOpen UHI exposure | Urban heat inequality | Land surface temperature is not air temperature |
| Housing | Census, NFHS, NSS78 | Tin roofs, crowding, ventilation | Needs microdata care |
| Water access | NSS78, NFHS, Jal Jeevan Mission | Dehydration and coping | Not a direct mortality coefficient |
| Health capacity | HMIS, NHP, district hospital data | Ability to treat heat illness | Public data may be incomplete |
| Occupational safety | PLFS, Census, labour rules | Outdoor work exposure and lost income | Informal work poorly protected |

Sources:

- South Asia PM2.5 map / CREA: https://southasia-pm2-5.energyandcleanair.org/
- OpenAQ: https://docs.openaq.org/about/about
- India Energy Atlas daily power supply: https://www.energymap.in/psp-daily
- MODIS LST: https://catalog.data.gov/dataset/modis-terra-land-surface-temperature-emissivity-daily-l3-global-0-05deg-cmg-v061
- Yale/NASA SUHI: https://data.nasa.gov/dataset/yale-center-for-earth-observation-yceo-surface-urban-heat-islands-version-4-2003-2018
- ScienceOpen UHI exposure dataset: https://www.scienceopen.com/document?vid=25d1c151-9790-4b1f-aba3-67d59d6bcd72
- Jal Jeevan Mission dashboard: https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx
- HMIS: https://hmis.mohfw.gov.in/

## Evidence Layer 6: Epidemiology And Comparable Models

These sources answer: "How do researchers translate heat exposure into deaths?"

| Source | Use | Caveat |
| --- | --- | --- |
| de Bont et al., multi-city India study | Main India-specific heatwave mortality coefficient source used by Frontiers | 10 cities, not all districts |
| Lancet Countdown heat mortality | Global annual indicator for heat-related mortality | Mostly older adults and modelled assumptions |
| GBD high temperature | High-temperature-attributable deaths and DALYs | Complex comparative risk framework |
| Gasparrini/Zhao global temperature mortality studies | Methodological context for non-optimal temperature | Global model transfer concerns |
| Human Climate Horizons / Climate Impact Lab | Future temperature mortality projections | Projection, not observed present-day burden |
| Recent 67-city India future heatwave study | City-scale future mortality comparison | Preprint/arXiv unless peer-reviewed later |

Sources:

- de Bont et al. PubMed: https://pubmed.ncbi.nlm.nih.gov/38340402/
- Lancet Countdown data explorer: https://lancetcountdown.org/explore-our-data/
- GBD high-temperature risk summary: https://www.healthdata.org/sites/default/files/disease_and_injury/gbd_2021/topic_pdf/risk/337.pdf
- Zhao et al. 2021, non-optimal temperatures: https://pubmed.ncbi.nlm.nih.gov/34245712/
- Human Climate Horizons: https://horizons.hdr.undp.org/
- 67-city preprint: https://arxiv.org/abs/2603.24244

## Policy And Preparedness Layer

These sources answer: "If the burden is real, are institutions prepared?"

| Source | What to use | Caveat |
| --- | --- | --- |
| NDMA heatwave guidelines | National preparedness framework | Guidelines do not prove implementation |
| NCDC National Action Plan on HRI | Clinical and surveillance protocol | Reporting quality still varies |
| State/district Heat Action Plans | Local warnings, cooling centres, work-hour changes | Plan quality varies widely |
| CPR heat action plan assessment | Independent review of 37 HAPs | 2023 review may need updating |
| CEEW/TERI/Prayas analyses | Policy critique and implementation gaps | Secondary sources |
| Parliamentary answers | Official counts and commitments | Often cutoff-specific |

Sources:

- NCDC National Action Plan: https://ncdc.mohfw.gov.in/wp-content/uploads/2024/05/1.Nation-Action-plan-on-Heat-Related-llnesses.pdf
- CPR HAP assessment: https://cprindia.org/briefsreports/how-is-india-adapting-to-heatwaves-an-assessment-of-heat-action-plans-with-insights-for-transformative-climate-action/
- NDMA heatwave resources: https://ndma.gov.in/Natural-Hazards/Heat-Wave
- TERI heat resilience article: https://www.teriin.org/index.php/article/silent-disaster-why-india-must-build-stronger-heatwave-resilience
- Prayas heat article: https://energy.prayaspune.org/our-work/article-and-blog/how-dangerous-is-extreme-heat

## Modelling Strategy

Do not publish a single homemade number unless the assumptions are visible. Use a tiered estimate instead.

### Model A: Reported Count Baseline

Purpose: show what official systems label as heat.

Inputs:

- NCRB heat/sunstroke.
- NCDC confirmed/suspected heatstroke deaths.
- IMD/DWE heatwave deaths.
- OWID/EM-DAT extreme-temperature deaths.

Output:

- A table of reported counts by source and year.
- A note that disagreement across official/administrative sources is itself evidence of measurement weakness.

Claim allowed:

- "Reported counts range from the low hundreds to around a thousand in recent severe years, depending on the source and definition."

Claim not allowed:

- "Only this many people died from heat."

### Model B: Excess Mortality Sensitivity

Purpose: approximate the burden if heat raises all-cause mortality.

Current public-article scale check:

| Scenario | Exposed share | Mortality lift among exposed baseline deaths | One-day illustrative excess deaths | Claim boundary |
| --- | ---: | ---: | ---: | --- |
| Very low | 20% | 3.0% | about 157 | Scale intuition only |
| Low | 35% | 5.0% | about 459 | Scale intuition only |
| Middle | 50% | 10.0% | about 1,312 | Scale intuition only |
| Frontiers-scale denominator check | 70% | 18.5% | about 3,400 | Reproduces scale, does not validate causality |
| High | 75% | 15.0% | about 2,952 | Scale intuition only |

This uses population 1,450,935,791 and a rounded World Bank crude death rate of 6.6 deaths per 1,000 population per year, implying roughly 26,000 baseline deaths per day. It is deliberately not a district model and should not be treated as an independent estimate.

Inputs:

- Baseline daily deaths by state/district from CRS/SRS.
- Population by district/state.
- Heatwave exposure days from IMD/ERA5.
- Relative risk coefficients from de Bont et al. and related India studies.

Output:

- Low / medium / high excess-death bands.
- Separate one-day and five-day scenarios.

Claim allowed:

- "Under plausible heatwave mortality coefficients, the excess-death burden can be orders of magnitude higher than certified heatstroke deaths."

Claim not allowed:

- "This exact person or exact cause was heat."

### Model C: Vulnerability-Weighted Exposure

Purpose: avoid treating all Indians as equally exposed.

Inputs:

- Heat exposure: IMD/ERA5/WBGT.
- Population: Census/WorldPop.
- Age: Census/WorldPop.
- Outdoor work: PLFS/Census.
- Cooling access: NFHS/HCES.
- Poverty/consumption: HCES/NFHS wealth.
- Power reliability: India Energy Atlas/CEA.
- PM2.5: CREA/OpenAQ/CPCB.

Output:

- District/state heat-risk index.
- Not a death estimate unless linked to mortality coefficients.

Claim allowed:

- "These districts are more exposed and less protected."

Claim not allowed:

- "This index proves deaths occurred."

## Recommended Article Structure

### 1. The number that shocked people

Open with the 3,400 figure. Immediately define it as an excess-mortality estimate, not a body count.

### 2. Why official counts look lower

Show NCRB/NCDC/IMD/OWID side by side. Explain that each counts a different thing.

### 3. How heat kills without being recorded as heat

Explain heart, respiratory, kidney, dehydration, pregnancy, sleep, and chronic disease pathways. Use WHO/NCDC language.

### 4. What the new paper actually did

Translate the method plainly: baseline deaths x population x estimated heatwave mortality risk.

### 5. What makes the estimate plausible

India has massive population exposure, high outdoor work, high vulnerable employment, extreme temperatures, rising hot nights, air pollution, and uneven cooling/power protection.

### 6. What makes the estimate uncertain

Urban coefficients transferred to rural districts; limited daily district mortality; heat definitions; humidity; local behaviour; AC and power access; administrative death registration; MCCD gaps.

### 7. Why the official system cannot settle the debate

CRS is annual. MCCD is incomplete. NCDC is facility-based. NCRB is cause-label based. EM-DAT is disaster-event based. None is a national daily all-cause mortality heat-attribution system.

### 8. What better data would look like

Daily all-cause deaths by district, age, sex, and place of death; linked with IMD heat metrics; facility syndromic surveillance; transparent heat-death audit protocols; public metadata on missingness and reporting delays.

### 9. The conclusion

The exact 3,400 number should be treated as a scenario estimate. But dismissing it because official heatstroke deaths are lower is also wrong. The evidence points to a real hidden burden and a measurement system not designed to see it.

## Candidate Charts

1. **Four counters, four meanings**
   - NCRB heat/sunstroke, NCDC heatstroke deaths, IMD heatwave deaths, OWID/EM-DAT extreme-temperature deaths.
   - Beat: reported counts disagree because definitions differ.

2. **Reported deaths vs modelled excess deaths**
   - OWID/official recent values alongside Frontiers one-day and five-day scenarios.
   - Beat: explain scale gap without calling one "true" and one "false."

3. **How heat disappears into other causes**
   - Flow diagram: heat exposure -> physiological stress -> CVD/respiratory/renal deaths -> not certified as heat.
   - Beat: mechanism.

4. **India's exposure is not evenly distributed**
   - Map or state bars: heatwave days/WBGT, elderly share, outdoor workers.
   - Beat: distribution.

5. **Cooling is not just ownership**
   - NFHS electricity/fan/AC plus power reliability/outage context.
   - Beat: adaptation caveat.

6. **Future risk is moving in the wrong direction**
   - UNDP HCH days over 95F and mortality projections; Lancet labour-hours.
   - Beat: why this matters beyond one headline.

## Claim Audit

Say:

- "The Frontiers number is a modelled excess-death estimate."
- "Official heatstroke deaths are a narrow administrative count."
- "Heat can increase deaths from other causes without being recorded as heat."
- "India lacks public daily district-level mortality data needed to validate the estimate directly."
- "The real burden is uncertain, but likely larger than official heatstroke counts."

Do not say:

- "3,400 Indians die of heat every day."
- "The paper proves 30,000 people died in a specific heatwave."
- "Official data are fake."
- "Excess mortality is the same as certified heatstroke."
- "AC access alone protects people."
- "Dry-bulb temperature alone captures heat risk."

## Next Data Work

1. Build a source table with annual reported heat deaths from NCRB, IMD/DWE, NCDC, and OWID/EM-DAT.
2. Pull CRS/SRS state-level crude death rates and construct baseline daily deaths by state.
3. Pull IMD/ERA5 daily Tmax, Tmin, humidity, and derived heat metrics for selected severe heatwave windows.
4. Use PLFS/NFHS/eSankhyiki to produce vulnerability denominators: outdoor work, vulnerable employment, electricity/fan/AC/cooler, housing, water.
5. Produce a transparent sensitivity model:
   - Low: conservative relative risk and limited affected population.
   - Medium: Frontiers-like district exposure.
   - High: multi-day heatwave with hot-night and vulnerability adjustment.
6. Publish with a "what would prove this better" box: daily district deaths, transparent NCDC feeds, MCCD expansion, and death audits.
