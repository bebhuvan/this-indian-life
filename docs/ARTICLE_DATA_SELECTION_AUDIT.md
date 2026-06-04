# Article Data Selection Audit

Last updated: 2026-06-01

This is the standing review gate for every new article. Before treating a page as launch-ready, ask:

- Are the selected data points actually answering the question?
- What data points should be added?
- What data points should be removed because they distract or repeat the same story?
- What is the best mobile-friendly visualization?
- What duration/window should be shown: full history, last 10 years, latest point, projection window, or something else?
- What frequency is right: annual, quarterly, monthly, daily/latest snapshot?

## Batch Audit: 2026-06-01

### q.econ.growth: How fast is India's economy growing?

Current status: `ready`, but needs chart pruning.

Selected data points: GDP growth is correct. Inflation, GDP per capita, nominal GDP, and sector shares are useful context. State tax, expense, and debt are too far from the main question for the first article pass.

Add: IndiaDataHub real GDP annual and quarterly, because growth should pair the rate with the level of real output. Add a 10-year average growth summary if computed deterministically.

Remove/de-emphasize: tax revenue, expense, central government debt, and trade unless the article becomes "what drives growth?".

Best visual plan:

- Real GDP growth rate: annual line, full history, annual.
- Real GDP level: annual line, full history, annual.
- Recent growth volatility: bar chart, last 10 years, annual.
- Latest real GDP quarterly: line, last 12-20 quarters, quarterly.

### q.econ.per_person: How rich is the average Indian?

Current status: `ready`, but data source should be upgraded.

Selected data points: World Bank current-dollar GDP per capita answers cross-country-style income, but for an average Indian reader, rupee per-capita GDP from IndiaDataHub is more direct.

Add: IndiaDataHub per-capita nominal GDP, preferably real per-capita GDP if available. Add inflation/real comparison if per-capita real series is available.

Remove/de-emphasize: trade, tax, debt, sector GVA. They distract from the per-person question.

Best visual plan:

- Per-capita nominal GDP: annual line, full history, annual.
- Per-capita GDP recent view: bar chart, last 10 years, annual.
- Total GDP vs per-capita GDP: two KPI cards or indexed lines, full history, annual.
- Caveat block: average is not median income, no chart unless median income data is added.

### q.econ.feels: Why does GDP growth not feel like salary growth?

Current status: `ready`, conceptually promising.

Selected data points: GDP growth, GDP per capita, and inflation are the right core set. The page still lacks wages, household income, employment quality, and distribution data, so it must avoid claiming it explains salaries directly.

Add: wage growth, real wages, household consumption per capita, unemployment/labour-force participation, and income distribution if reliable sources are added.

Remove/de-emphasize: trade, tax, debt, broad sector shares unless used as caveats.

Best visual plan:

- GDP growth vs inflation: two-line or small multiples, last 20 years, annual.
- GDP per capita: annual line, full history, annual.
- Nominal vs real concept explainer: no chart or indexed lines if real per-capita data exists.
- Missing-data panel: "salary data not included", latest point only.

### q.econ.compare: How does India compare with China, the US, and the world?

Current status: `needs_data`.

Selected data points: India-only GDP, per-capita GDP, and population do not answer the question.

Add: World Bank/OWID comparable series for India, China, US, and world: GDP current USD, GDP per capita, population, and optionally PPP GDP.

Remove/de-emphasize: India-only tax, debt, trade, sector shares.

Best visual plan:

- GDP comparison: grouped latest bars, latest year, annual.
- GDP per capita comparison: grouped latest bars, latest year, annual.
- Population comparison: grouped latest bars, latest year, annual.
- India share over time: line chart, full history or last 30 years, annual.

### q.energy.renewables: How fast are renewables growing?

Current status: `ready`, but needs more precise renewable splits.

Selected data points: Ember generation is the correct base. Demand, emissions, and carbon intensity are useful context.

Add: solar and wind individually over time, renewable share of generation, absolute renewable generation, and fossil generation for comparison.

Remove/de-emphasize: electricity access and clean cooking from this article; they belong to access/energy poverty pages.

Best visual plan:

- Generation mix: stacked area or stacked bars, 2000-latest, annual.
- Solar/wind growth: small multiples or grouped lines, 2000-latest, annual.
- Renewable share: line, 2000-latest, annual.
- Latest mix: share strip, latest year, annual.

### q.health.u5mr: How many Indian children die before age five?

Current status: `ready`.

Selected data points: Under-five mortality from WHO/World Bank/UN is good. Infant and neonatal mortality are useful breakdowns.

Add: absolute number of under-five deaths if available, because rates are hard for lay readers. Add live births denominator if available.

Remove/de-emphasize: life expectancy and health expenditure unless used as secondary context.

Best visual plan:

- Under-five mortality: annual line, full history, annual.
- Under-five vs infant vs neonatal: latest grouped bars, latest year, annual.
- Decline over time: decade bars or first/latest comparison, full history, annual.

### q.health.deaths: What kills Indians?

Current status: `ready`, but the question needs richer cause-of-death data.

Selected data points: NCD mortality, maternal mortality, and neonatal mortality are not enough to answer "what kills Indians?" comprehensively. They are selected because that is what we currently have.

Add: cause-of-death shares: cardiovascular disease, cancer, respiratory disease, injuries, infections, tuberculosis, diabetes, maternal/neonatal causes, and age-group breakdowns.

Remove/de-emphasize: life expectancy lines. They are adjacent health context, not causes of death.

Best visual plan:

- Cause composition: horizontal bars, latest year, annual.
- NCD mortality trend: line, full history, annual.
- Maternal/neonatal mortality: small multiples, full history, annual.
- Age-standardized caveat: paragraph explainer, no chart unless comparing over time.

### q.work.force: How many Indians are in the workforce?

Current status: `ready`, but needs labour-market depth.

Selected data points: labour force total is correct. Female participation and agriculture employment are useful supporting context.

Add: labour-force participation total, male participation, employment-to-population ratio, unemployment, formal/informal work, and working-age population.

Remove/de-emphasize: water, sanitation, internet, literacy unless building a broad society page.

Best visual plan:

- Labour force total: annual line, full history, annual.
- Male vs female participation: two-line chart, full history, annual.
- Sector employment split: latest bars, latest year, annual.
- Working-age population vs labour force: two-line or indexed line if available, full history, annual.

### q.work.women: Why is women's work participation so low?

Current status: `ready`, but must avoid unsupported causality.

Selected data points: female labour-force participation is correct. Education and urbanization are only weak context; they do not explain causality.

Add: male participation, total participation, employment status, unpaid work/time use, education by gender, rural/urban split, age split, marriage/motherhood if sourced.

Remove/de-emphasize: water/sanitation/internet unless explicitly tied to labour-force evidence.

Best visual plan:

- Female participation: annual line, full history, annual.
- Male vs female participation: two-line gap chart, full history, annual.
- Recent movement: last 10-year bar or line, annual.
- Missing-cause panel: "This chart shows participation, not why."

### q.state.tax: How much tax does India collect?

Current status: `ready`, but stale and narrow.

Selected data points: tax revenue as percent of GDP is correct. Expense and debt are relevant fiscal context. But data ending in 2022 should be visible.

Add: gross tax revenue, direct vs indirect taxes, GST, income tax, corporation tax, tax buoyancy, Centre vs states if sources are added.

Remove/de-emphasize: inflation, trade, sector GVA.

Best visual plan:

- Tax-to-GDP: annual line, full history, annual.
- Tax vs expense vs debt: small multiples, full history, annual.
- Latest fiscal mix: bars, latest year, annual.
- Staleness notice: latest available year, no chart.

### q.people.pyramid: What does India's population pyramid look like?

Current status: `ready`.

Selected data points: age-sex 5-year table is exactly right. Broad age shares, dependency ratios, fertility, and median age are good context.

Add: animate or compare 2000 vs 2025 vs 2030 if static layout can handle it. Add working-age share as a companion.

Remove/de-emphasize: under-five mortality and life expectancy from this page unless used in prose only.

Best visual plan:

- Population pyramid: full-width, latest year, 5-year age bands.
- Broad age shares: share strip, selected years 2000/2025/2030, annual/projection points.
- Dependency ratios: line or small multiples, 2000-2030, annual.
- Median age: line, 2000-2030, annual.

### q.air.today: How bad is India's air today?

Current status: `ready`, but the page is too Delhi-centric for an India question.

Selected data points: Delhi AQI is useful but not enough for "India's air". Other city WAQI snapshots are necessary.

Add: Mumbai, Kolkata, Chennai, Bengaluru as first-class visuals; PM2.5 annual exposure if a reliable national series is added; pollutant components by city.

Remove/de-emphasize: CO2 emissions. Air quality and climate emissions are different questions.

Best visual plan:

- City AQI comparison: latest horizontal bars, latest snapshot, daily/latest.
- Pollutant components: compact bars per city, latest snapshot, daily/latest.
- National PM2.5 exposure: line, full history, annual, only if added.
- Health caveat: AQI is a snapshot, not a yearly average.

### q.world.share: What share of the world is India?

Current status: `needs_data`.

Selected data points: India population/GDP/CO2 alone cannot produce world share.

Add: world totals for population, GDP, CO2; then compute India share deterministically. Add China/US if the page becomes a comparison article.

Remove/de-emphasize: society indicators like literacy, water, sanitation, internet.

Best visual plan:

- India share of world population: line, full history, annual.
- India share of world GDP: line, full history, annual.
- India share of world CO2: line, full history, annual.
- Latest share summary: three KPI cards, latest year, annual.

## Flagship: q.climate.impact — How is climate change changing India?

Locked: 2026-06-01. This is the "mother of all" comprehensive climate page. It is deliberately the widest article in the almanac: it blends physical climate, air, emissions, and the human exposure that makes those numbers matter for India specifically. Built in two passes so it is never blocked.

Sourcing (blends 6+ sources, each where strongest):

- Physical climate (national): Our World in Data grapher datasets, which are themselves the Copernicus Climate Change Service ERA5 reanalysis, processed to India's national boundary with latitude-weighted averaging. This satisfies "OWID + Copernicus" as one clean pipeline, no `cdsapi` needed for the national layer.
- Air: WAQI city snapshots (reused, honestly labelled as a snapshot, not a trend).
- Cause and responsibility: OWID/Global Carbon Project CO2 (total, per capita, cumulative), Ember power-sector carbon intensity, world-context India share of world CO2. All already ingested.
- Human exposure (the multi-disciplinary glue): World Bank agriculture employment share + total population. Reused.

Confirmed ingestable today (verified India rows in the live CSVs):

- `annual-temperature-anomalies` — annual anomaly vs 1991-2020, deg C, 1940-2025 (86 India rows).
- `average-monthly-surface-temperature` — monthly absolute deg C, 1940 to Jan 2026.
- `average-precipitation-per-year` — annual mm, 1940-2025 (86 India rows; 2025 = 1404 mm).
- `monthly-temperature-anomalies` — monthly anomaly vs 1991-2020, deg C.

NOT a quick win (verified): OWID `number-of-natural-disaster-events` is global-only (0 India rows). Extreme events (flood/cyclone/drought counts) need a real EM-DAT adapter, deferred to Pass B. State-level temperature needs raw ERA5 gridded via `cdsapi` + per-state polygon averaging + a new India choropleth chart type, also Pass B.

Pass A (national, ships now) best visual plan:

- Act I, the signal: India temperature anomaly, hero line, full history, annual.
- Act II, what is shifting: annual precipitation (monsoon variability), feature line, full history, annual; today's air across 5 cities, latest grouped bars, snapshot.
- Act IV, cause and responsibility: India CO2 emissions, feature line, full history; per-capita vs cumulative CO2, two small lines (the fairness framing); grid carbon intensity falling, small line; India share of world CO2, small line.
- Act V, why India is exposed: agriculture employment share, small line; total population still rising into a hotter century, small line.

Pass B (regional, after Pass A): state-level warming choropleth + most/least-warmed states (ERA5 gridded ingest + choropleth chart type); EM-DAT extreme-events bars. Act III slots in as the centrepiece once built.

Prose: generated on `deepseek-v4-pro` (not flash) with a dedicated climate template, so each section answers a reader question with the mechanism, not chart description.

