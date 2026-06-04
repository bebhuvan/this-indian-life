# Indica Current Status

Last updated: 2026-06-01

## Project State

Indica is an Astro site for turning high-reputation public datasets about India into sourced, visual-first article pages. The current implementation is focused on V1 national-level questions, with the most actively iterated page being:

- `/en/articles/how-big-is-indias-economy/`

The design direction is now clear:

- Charts and visual evidence are the main draw.
- Prose supports the visuals instead of dominating the page.
- Every chart should be locally generated from fetched artifacts, not from live browser API calls.
- Sources should be visible, attributed, and linked when source URLs exist.
- Article pages need both standard explanation and a more Indian-friendly explainer voice.
- Each theme can and should use multiple sources. One source answers the headline; other sources explain structure, caveats, comparison, and lived reality.

## Current Local State

There are uncommitted changes in:

- `src/components/ArticleVisuals.astro`
- `src/data/viz.ts`
- `src/styles/indica.css`
- `src/pages/[locale]/articles/[slug].astro`
- `scripts/generate-explanations.mjs`
- generated explanation artifacts under `data/explanations/en/`

The latest local build passes:

```bash
npm run explain:v1:validate
npm run build
```

Validation result: 30 explanation artifacts validated, 0 failures, 1 warning (`q.people.total` article is shorter than target).

Build result: 76 static pages generated successfully.

Current explanation inventory:

- 30 V1 question pages exist.
- 28 pages are marked `ready`.
- 2 pages remain `needs_data`: `q.econ.compare` and `q.world.share`, because the available artifacts do not yet contain the needed China/US/world totals.
- `docs/ARTICLE_DATA_SELECTION_AUDIT.md` now tracks the data-selection review for the newest batch.
- `scripts/generate-explanations.mjs` now asks future DeepSeek runs for a `dataSelectionAudit`: selected data quality, what to add, what to remove, and chart type/window/frequency choices.
- The fast batch path is now:

```bash
npm run explain:v1:dry-run -- --questions=q.id.one,q.id.two
npm run explain:v1:fast -- --questions=q.id.one,q.id.two
npm run explain:v1:validate
npm run build
```

## Current GDP Article Changes

The most recent deep pass was on:

- `/en/articles/how-big-is-indias-economy/`

Current chart sequence:

1. Nominal GDP, annual.
2. Real GDP, annual.
3. Per-capita nominal GDP.
4. Latest GVA by sector.
5. What GDP is made of.
6. Nominal GDP, quarterly.
7. Real GDP, quarterly.
8. Imports and exports, last 10 years.

Recent changes:

- Replaced World Bank-only GDP page with IndiaDataHub Indian national accounts data.
- Added 14 IndiaDataHub economic indicators to `q.econ.size`.
- Added nominal and real GDP, annual and quarterly.
- Added GVA sector mix.
- Added GDP expenditure-side mix.
- Replaced a latest-only trade chart with 10-year grouped annual bars for imports and exports.
- Added non-colliding inside-bar labels for the grouped trade bars.
- Moved chart explainers below their charts.
- Reworked economic concept blocks from boxed glossary cards into paragraph-led prose.
- Expanded GDP concepts: GDP, nominal GDP, real GDP, per-capita GDP, GVA, GDP vs GVA, consumption/investment, imports/exports/net exports.
- Added `explain:v1:fast` for quick single-pass article generation.

## Current Visual Concerns

These are not blockers, but should be reviewed in the next pass:

- Several newly regenerated articles are text-ready but not yet visually curated.
- The evidence selector currently includes too many context indicators for some pages. Use `docs/ARTICLE_DATA_SELECTION_AUDIT.md` to prune.
- Chart explainers are now better on the GDP page but generic on many other pages.
- Some ready articles are shorter than the ideal long-form target because their available evidence is narrow.
- `q.econ.compare` and `q.world.share` should stay `needs_data` until world/China/US comparable data is added and deterministic share calculations exist.

## Data Source Status

V1 source strategy has been documented separately in:

- `docs/DATA_SOURCES.md`
- `docs/V1_SOURCE_STRATEGY.md`
- `docs/SOURCE_PROBE_RESULTS.md`
- `docs/API_INTEGRATION_PLAN.md`
- `docs/DATA_FETCHING_SYSTEM.md`

Current implemented/used source families include:

- World Bank
- UN Population
- WHO GHO
- Ember
- Our World in Data
- WAQI
- IndiaDataHub

Source use principle:

- IndiaDataHub / MoSPI / RBI / Ministry of Finance: Indian economy, GDP, GVA, inflation, public finance, and high-frequency Indian macro data.
- World Bank: broad comparable indicators and cross-country context.
- UN Population: population structure, age, fertility, dependency, and projections.
- WHO / IHME if added: health outcomes, mortality, disease burden.
- Ember / CEA if added: electricity, generation mix, renewables, emissions.
- OWID: climate, CO2, and long-run global comparison data.
- WAQI / CPCB if added: air-quality snapshots and city-level air.
- NSS / PLFS / time-use if added: work, women’s work, household and social realities.

World Bank does not require keys. IndiaDataHub requires local credentials.

API keys and tokens belong in local environment files, not in committed files. The UN Population bearer token was wired through environment configuration earlier. Do not commit `.env`.

## Next Best Steps

1. Continue from the audit:

- `docs/ARTICLE_DATA_SELECTION_AUDIT.md`

2. Prune and improve the newly generated ready pages:

- `q.econ.growth`
- `q.econ.per_person`
- `q.econ.feels`
- `q.energy.renewables`
- `q.health.u5mr`
- `q.health.deaths`
- `q.work.force`
- `q.work.women`
- `q.state.tax`
- `q.people.pyramid`
- `q.air.today`

For each page, ask:

- Are the selected data points good?
- What should be added?
- What should be removed?
- What is the best chart type?
- What duration/window should be shown?
- What frequency is appropriate?

3. Add missing data for the two blocked pages:

- `q.econ.compare`: needs comparable India/China/US/world GDP, GDP per capita, population, and possibly PPP.
- `q.world.share`: needs world totals for population, GDP, and CO2, then deterministic India-share calculations.

4. Use source-specific adapters instead of forcing one source to answer everything.

5. Run the normal verification loop:

```bash
npm run explain:v1:validate
npm run build
rg -n "api_key|6pcp" dist data/series data/explanations || true
```
