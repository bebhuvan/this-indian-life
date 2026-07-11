# Academy — Track 2: Inflation & Prices

How India measures the cost of living, decoded fully: every index, the whole basket and its
sub-components, and the methodology changes that decide which number the country lives by.

**Evidence source:** `q.econ.inflation.academy` (the main inflation packet augmented with the
core / ex-food series, so entries can cite core inflation). Reuses the same rich pipeline,
depth bar, and guards as Track 1. Per the founder's standing directive ([[indica-depth-nuance]]),
these go deep: decode all sub-components and every methodology change.

## Flagships (briefs-first batch)

1. **Why does everything keep getting more expensive?** — `what-is-inflation` — keystone: what
   inflation is, the rupee's erosion (₹100 from 2012 buys ₹51; from 1960, ₹1), why a little is
   deliberate, who controls the pace (RBI, the 4% target, the repo rate), India vs the world.
2. **Two inflations, and why they disagree** — `cpi-vs-wpi` — CPI vs WPI; the basket (stacked
   bar); WPI components; **methodology**: base years (CPI 2012 + new 2024 series; WPI 2011-12),
   how the basket is built, the 2014 WPI→CPI policy switch (Urjit Patel Committee).
3. **Inside the basket: what India actually measures** — `inside-the-basket` — **the full
   sub-component decode**: headline → groups → sub-groups → items (food: cereals, vegetables,
   pulses, oils, milk; misc: health, education, transport, etc.); weights vs contributions; why
   a small-weight item can still swing the headline.
4. **Why food is the whole story of Indian inflation** — `food-inflation` — food ~46% of the
   basket (Engel's law); volatility, monsoon, the items that swing it; who it hurts; why the RBI
   can't fix it with interest rates; food as politics.
5. **What inflation does the RBI actually fight?** — `core-vs-headline` — core vs headline (core
   data now available); why strip food & fuel; the 4% target and the band; the repo rate; the
   tension between the number targeted and the number that hurts.
6. **Why your inflation isn't the official number** — `whose-inflation` — the average of a fixed
   basket that isn't yours; rural (0.8%) vs urban (2%); the poor's food-heavy basket; how to
   read inflation as if it's about you.

Later cards (atomic): base-year/rebasing, the deflator vs CPI vs WPI (links to GDP track),
seasonally-adjusted vs YoY, the Consumer Food Price Index. Money/RBI track (repo, MPC, monetary
transmission) is a separate future track that this one teases.

## Added: the measures menu (codified 2026-06-07)

7. **How many ways does India measure inflation?** — `measures-of-inflation` — the definitive
   menu, decoded: headline CPI (the RBI's legal target), CFPI (food-only), core (ex food & fuel),
   super-core (also ex gold & housing), WPI (wholesale, goods-only), trimmed-mean & weighted-median
   (limited-influence measures), and the GDP deflator (broadest, links to the GDP track). Plus a
   practical "which one to watch" guide. Carries a CPI-vs-WPI-vs-core time-series chart.

**Charts now supported** (src/data/academy-charts.ts): build-time inline-SVG line/area charts fed by
data/series/*.json. Visual type `line`/`area` with `series:[{label,seriesId,color}]`. Live on
cpi-vs-wpi (CPI vs WPI), core-vs-headline (headline vs core), what-is-inflation (rupee erosion since
1960, area). Stacked-bar `Other divisions` segment added to whose-inflation to sum to 100 (new 2024
basket only has 8 of 12 division weights; PIB full table behind 403).
