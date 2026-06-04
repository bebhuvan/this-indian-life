# Chart Selection Philosophy

How Indica decides which charts a question deserves. This is the standing framework; every page's `visualPlan` is built by applying it.

## The principle

A question is answered by viewing its measure through a set of **lenses** — distinct angles a curious reader would ask about. Include every lens that genuinely adds signal for this question; drop the rest. The goal is **comprehensive coverage of the angles, with zero duplicated facts.**

This is the opposite of two failure modes:
- **Mechanical explosion** — turning one indicator into a line + "decade change" + "how much changed" + "indexed" bars. Those are all the *same lens* (rate of change) shown four times. Pick one.
- **Over-pruning** — showing 4 charts when the data supports 12 distinct angles. If a reader would ask it and the data answers it, it earns a chart.

## The lenses

For any quantitative question, walk this list and include each lens that applies:

| # | Lens | The reader question | Typical chart |
|---|------|---------------------|---------------|
| 1 | **Level** | How big is it, and where is it heading? | line, full history + projection (the hero) |
| 2 | **Rate** | How fast is it changing? | line or bars — pick ONE rate view |
| 3 | **Composition now** | What is it made of today? | pyramid / stacked / share bars |
| 4 | **Composition over time** | How is the mix shifting? | stacked area / small multiples |
| 5 | **Distribution** | How is it spread across a dimension (age, sex, region, income)? | pyramid / histogram / ranked bars |
| 6 | **Driver / mechanism** | What input explains the trend? | line |
| 7 | **Sub-group split** | Same measure, broken by sex / cohort / type? | multi-line / grouped bars |
| 8 | **Comparison** | How does India compare with the world or peers? | grouped bars / indexed lines |
| 9 | **Projection & uncertainty** | What scenarios lie ahead? | line + band / variant bars |
| 10 | **Normalized** | The per-capita / per-1,000 reality check? | line |
| 11 | **Snapshot** | The single most current number? | stat / latest bar |

## Rules

1. **Each lens at most once.** Two charts showing the same fact = delete one.
2. **Comprehensive, not minimal.** Err toward including a distinct angle. A rich topic (population, GDP) earns 8–12 charts; a narrow one (literacy) earns 3–5. No fixed cap — the lenses decide.
3. **Small multiples by default.** Most charts are small cards in a dense grid. Reserve large "feature" size for the 1–2 charts that carry the page: the Level hero and the key Composition view (e.g. the pyramid).
4. **Window and frequency are deliberate.** Full history for trends, last-10-years for recent movement, latest for snapshots, projection window where data exists.
5. **Data scope and visual plan are separate.** `core`/`context` decide what numbers the prose may cite; `visualPlan` decides what charts show. Keep them in sync so the page never charts something the prose can't discuss.
6. **Blend sources; one dataset per article makes no sense.** Every article should draw on at least two sources, each used where it is strongest: a global source (World Bank / OWID) for the long backbone and cross-country comparison, and the source closest to the subject (IndiaDataHub / RBI / TRAI / NPCI feeds) for India-specific recency and granularity the global sources lack. This gives triangulation and avoids any single source's blind spots.

## The build workflow

Articles are built in four steps, and we do not start building until the chart list is locked:
1. **Pick the question** — a real question a curious reader would ask that the site does not already answer.
2. **Brainstorm the chart list** — walk the lenses, list every high-signal chart, flag which data we have vs. need to fetch and from which source.
3. **Review & lock** — cut/add/reorder; set sizes (hero/feature/small) and the narrative arc.
4. **Build** — ingest any missing series → registry `visualPlan` → generate → verify.

## Worked example — "How many people live in India?"

| Lens | Chart | Indicator |
|------|-------|-----------|
| Level | Population 1960→today (hero) | people.population.total |
| Rate | Annual growth rate | people.population.growth |
| Driver | Births per woman | people.fertility |
| Distribution | Age–sex pyramid | people.population.un.age_sex_5y |
| Composition now | Broad age structure 0–14 / 15–64 / 65+ | people.population.un.broad_age_share |
| Level (ageing) | Median age | people.population.un.median_age |
| Sub-group | Life expectancy by sex | people.population.un.life_expectancy |
| Normalized | Under-five mortality | people.population.un.u5mr |
| Rate (burden) | Child dependency ratio | people.population.un.child_dependency |
| Rate (burden) | Old-age dependency ratio | people.population.un.old_age_dependency |
| Projection | Population scenarios to 2030 | people.population.un.total (variants) |

Eleven charts, eleven distinct angles, one duplicated fact removed (total vs old-age dependency both shown, child and old-age dependency kept because they answer different burdens; total dependency dropped as the sum of the two).
