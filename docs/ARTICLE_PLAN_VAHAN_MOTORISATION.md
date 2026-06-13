# Article Plan: India's Vehicle Boom

Working question: **Did rising incomes motorise India, or did India build a different kind of vehicle market?**

Working title: **Seven times more vehicles, still a two-wheeler country**

Answer thesis: Since FY 2003-04, VAHAN registrations rose almost 7x, faster than real GDP per person but not in a simple one-year income-to-vehicle chain. India motorised at mass scale, but the market did not become car-first. It stayed two-wheeler-led, recovered from a deep Covid break, and only recently began a visible fuel transition toward EV and CNG categories. Income is the backdrop; affordability, credit, fuel prices, state growth, and vehicle category mix shape the path.

## Data Roles

- **VAHAN dashboard**: primary registration spine, monthly 2003-01 to 2026-06; state, vehicle-class, and fuel cuts. Use "registrations recorded in VAHAN", not sales.
- **MoSPI NAS**: GDP, real GDP, per-capita GDP, sector context. Use fiscal-year alignment.
- **MoSPI CPI**: transport and communication CPI; petrol and diesel CPI item indexes. Use as cost context, not a direct cause.
- **SIAM**: wholesale domestic sales, only where public pages are scrapeable. Treat as a separate sales lens, not a substitute for VAHAN.
- **RBI / IndiaDataHub credit**: vehicle loans from 2019 onward. Use as a recent financing mechanism if promoted into article-ready series.
- **Ember API**: electricity-demand, generation mix, power-sector emissions, grid carbon intensity. Use for the "what EV charging plugs into" lens. The current Ember API exposes electricity datasets, not EV registration/sales endpoints.
- **Population denominator**: add World Bank or UN population if building registrations per 1,000 people.

## Must-Derive Series Before Build

1. `auto.vahan.registrations.total_fy`
   Fiscal-year registrations from VAHAN monthly totals, FY 2003-04 onward.

2. `auto.vahan.registrations.vehicle_bucket_fy`
   Fiscal-year buckets: two-wheelers, cars/cabs, three-wheelers/e-rickshaws, goods, tractors, buses, other.

3. `auto.vahan.registrations.fuel_bucket_fy`
   Fiscal-year buckets: petrol-all, diesel-all, EV/battery, CNG-all, LPG-all, other.

4. `auto.vahan.registrations.state_fy`
   State totals, state share, and change since FY 2003-04.

5. `auto.vahan.registrations.per_1000_people`
   Registrations per 1,000 people using annual population. Use fiscal-year end year as the population year.

6. `auto.vahan.gdp_correlation_panel`
   Fiscal-year panel with VAHAN totals, VAHAN YoY growth, nominal GDP, real GDP, nominal per-capita GDP, real per-capita GDP, and same-year plus lagged correlations.

7. Optional: `auto.credit.vehicle_loans_monthly`
   Vehicle-loan outstanding from RBI/IDH, 2019 onward, if we want a recent-credit mechanism chart.

## Evidence Already Checked

Fiscal-year anchors:

- VAHAN registrations: 4.42m in FY 2003-04; 30.84m in FY 2025-26.
- VAHAN multiple, FY 2003-04 to FY 2025-26: 6.98x.
- Nominal GDP multiple: 12.79x.
- Real GDP multiple: 3.98x.
- Nominal per-capita GDP multiple: 9.84x.
- Real per-capita GDP multiple: 3.06x.

Correlation checks:

- Level correlation, VAHAN vs real GDP: 0.92.
- Level correlation, VAHAN vs real per-capita GDP: 0.93.
- Growth correlation, VAHAN YoY vs real GDP YoY: 0.77.
- Growth correlation excluding FY 2020-21 and FY 2021-22: 0.54.
- Lagged growth correlation, VAHAN YoY vs previous-year real GDP YoY: 0.26.

Vehicle mix:

- Two-wheelers: 68.2% in FY 2003-04; 71.8% in FY 2025-26.
- Cars/cabs: 18.0% in FY 2003-04; 15.8% in FY 2025-26.
- Three-wheelers/e-rickshaws: 2.4% in FY 2003-04; 4.1% in FY 2025-26.
- Tractors: 3.3% in FY 2003-04; 3.7% in FY 2025-26.

Fuel mix:

- Petrol-all: 82.45% in FY 2003-04; 79.12% in FY 2025-26.
- Diesel-all: 16.40% in FY 2003-04; 10.24% in FY 2025-26.
- EV/battery: 0.01% in FY 2003-04; 8.25% in FY 2025-26.
- CNG-all: 0.08% in FY 2003-04; 1.60% in FY 2025-26.

Ember context:

- India electricity demand: 2,082.82 TWh in 2025.
- India grid carbon intensity: 670.55 gCO2/kWh in 2025.
- Renewables share of generation: 24.07% in 2025.
- Wind and solar share of generation: 14.41% in 2025.

## Chart Spine

### 1. The Boom

Chart: Monthly VAHAN registrations, 2003-2026.

Job: Establish the whole story from the first available month. Show the long rise, seasonality, the FY 2020-21 Covid collapse, and recovery.

Watch: 2026 calendar year is partial; do not imply full-year 2026.

### 2. The Fiscal-Year Backbone

Chart: Fiscal-year VAHAN registrations, FY 2003-04 to FY 2025-26.

Job: Give the clean annual backbone aligned to MoSPI GDP.

Read: 4.4m to 30.8m, almost 7x.

### 3. Income Backdrop

Chart: Indexed lines, FY 2003-04 = 100: VAHAN registrations, real GDP, real per-capita GDP.

Job: Show motorisation grew faster than real income per person.

Watch: This is not causality; it is scale comparison.

### 4. The Correlation Trap

Chart: Two-panel: level correlation vs growth correlation.

Job: Teach the reader why "GDP explains vehicles" is too easy. Levels correlate because both rise; growth rates are more honest.

Read: Level correlations above 0.9, but lagged real-growth correlation around 0.26.

### 5. The Covid Break

Chart: YoY growth bars for VAHAN and real GDP.

Job: Show registrations are much more volatile than GDP.

Read: FY 2020-21 registration growth fell about 29%, worse than the real GDP decline.

### 6. Still a Two-Wheeler Country

Chart: Vehicle-class composition, FY 2003-04 vs FY 2025-26.

Job: Land the main surprise. Bigger market, not a car-first market.

Read: Two-wheelers stayed around seven in ten registrations.

### 7. Vehicle-Class Evolution

Chart: Stacked area or small multiples for vehicle buckets.

Job: Separate absolute growth from share. Cars/cabs grew in units but did not dominate the mix.

Watch: E-rickshaws live in three-wheeler/e-rickshaw bucket; define clearly.

### 8. The Fuel Transition

Chart: Fuel-bucket shares over time.

Job: Show the newer structural change: EV/battery and CNG appear against a still petrol-heavy base.

Read: EV/battery from effectively zero to about 8% by FY 2025-26.

### 9. EV Is Real, But Not the Whole Market

Chart: EV/battery registrations and EV/battery share.

Job: Give EV its own lens without letting it swallow the article.

Watch: VAHAN fuel labels change over time; aggregate all electric/battery labels consistently.

### 10. What EVs Plug Into

Chart: Ember grid carbon intensity and wind/solar share, 2000-2025.

Job: EVs move emissions from tailpipes to the power system. The charging story depends on the grid.

Read: Carbon intensity fell to 670.55 gCO2/kWh in 2025; wind and solar reached 14.41% of generation.

### 11. The State Map

Chart: Top states in FY 2003-04 vs FY 2025-26, or slopegraph of state shares.

Job: Show geography changed. UP remains huge; Maharashtra, Tamil Nadu, Gujarat and Karnataka become central to the modern market.

Watch: Telangana treatment and dashboard coverage must be handled in caveats.

### 12. State Winners

Chart: Ranked bars: absolute registration gain and share-point change by state.

Job: Identify whether growth is a few rich states or broad diffusion.

### 13. The Sales Cross-Check

Chart: SIAM FY 2025-26 sales by category vs VAHAN FY 2025-26 registration buckets.

Job: Teach sales vs registrations. Do not force exact reconciliation.

Read: SIAM FY 2025-26 domestic sales total parsed at 28.27m; VAHAN FY 2025-26 registrations at 30.84m.

Watch: SIAM public annual trend has a gap between FY 2013-14 and FY 2025-26 in currently scraped pages.

### 14. The Credit Mechanism

Chart: Vehicle loans outstanding vs registrations, 2019 onward.

Job: Add a mechanism that GDP cannot capture: financing conditions and balance-sheet willingness.

Watch: Vehicle-loan stock is not loan originations; stock can rise even when current sales slow.

### 15. The Cost Mechanism

Chart: Petrol CPI and diesel CPI indexes, with registrations growth.

Job: Show affordability pressure. Fuel costs influence ownership economics, especially for two-wheelers and commercial use.

Watch: CPI item indexes are prices paid by consumers, not fuel consumption.

### 16. Per-Capita Reality Check

Chart: Registrations per 1,000 people.

Job: Stop the reader from reading raw registrations as only population scale.

### 17. Seasonality

Chart: Monthly heatmap, 2003-2025.

Job: Show festival spikes, March/year-end behavior, and pandemic months.

Watch: Explain that seasonality is registrations timing, not necessarily purchase timing.

### 18. Methodology & Caveats

Text block plus source notes.

Must include:

- VAHAN records registrations, not wholesale sales.
- VAHAN dashboard coverage, office coverage, and historical backfills affect comparability.
- IndiaDataHub VAHAN corroboration has a Telangana definition break; VAHAN dashboard is primary.
- SIAM is wholesale domestic sales and has OEM footnotes in press releases.
- MoSPI NAS is fiscal-year national accounts; VAHAN monthly data must be aggregated April-March for correlation.
- Correlation is not causation.
- Ember API is electricity-system data, not EV-sales data.
- EV/battery fuel labels are aggregated because category names change over time.

## Article Arc

1. India did not just buy more vehicles; it crossed from a small vehicle market into mass motorisation.
2. Income growth is the background, but level correlations overstate the relationship.
3. The real India story is category: mobility stayed two-wheeler-first.
4. The modern transition is fuel, not yet vehicle class.
5. EVs are now visible, but the electricity system decides how clean they become.
6. States, credit, fuel prices and registration timing explain why the line is bumpier than GDP.
7. The honest conclusion: India motorised, but not like a rich-country car market.

## One-Sentence Answer

India has motorised at massive scale since 2003, but the data says it became a much larger two-wheeler-first market, not a car-first one; EVs are now real, but they are the newest layer on top of a petrol-heavy registration base.
