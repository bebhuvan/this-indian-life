# Design refinement log

## Summary (October 2026, second session)

The first session's crash left one commit (a793486) and uncommitted article-page work. This session verified
the 18 earlier findings on screen, committed the unfinished work, and ran four more passes, each followed by a
fresh screenshot sweep at 1440 and 390 px from a static build (15 articles covering every chart kind, plus home,
a domain page, `/articles/`, `/library/`, `/about/`, `/methodology/`, `/nfhs6/`).

Commits on `worktree-agent-a8ec08bf0cda3da10`:
1. `cfd80e6` One reading column, a contents rail, and typeset chart numbers
2. `a106770` Make every chart say what the data says: normals, units, fixed inks, colours in prose
3. `af5e72c` Domain pages and the archive as edited front pages; phone fixes for scatters, bars and heat strips
4. `5d0fe1a` New forms `slope` and `stackedArea`; docs; rail and source-line fixes

**Facelift (after the owner asked for "presence and visual beauty"):** `1665642` makes India the protagonist in
line comparisons of three or more places (heavier, on top; others finer and quieter, each keeping its ink), sets a
single line's latest value as a headline figure, replaces the gradient wash with a flat tint, and fines the bars down
(and lets short labels sit beside bars on phones, halving their height). `dd3bbc0` rebuilds the figure frame (the
point behind a fine domain rule, reading aids in three quiet columns, source and downloads on one footer line), gives
the lead figure more presence, and turns line panels of four or more lines into one panel per line on a scale fitted
to the data. The hot-nights explainer in `q.climate.heat_mortality` was rewritten to describe the new form.
Tried and dropped: tabular figures in chart text (Schibsted Grotesk's tabular forms open gaps such as "₹357 .1").

**New forms:** `slope` (two points in time for a handful of units, values printed at both ends) and
`stackedArea` (composition over time, layers named at the right edge). Both are in the engine (`almanac.ts`),
the registry adapters (`almanac-visuals.ts`), the library page on real data (World Bank employment in
agriculture 1991 and 2025 for India and eight peers; Ember generation by source since 2000) and the design doc.

**Explainer text edited, and why:** 99 sentences in 20 files under `data/explanations/en/` named colours from the
pre-Almanac palette ("the orange line", "blue for rural", "deep blue stripes for a deficit"). Each was checked
against the rendered chart and now names the colour drawn, or the series by name. A script confirmed that no
number, date or other field changed (the only added digits are "the 2026 line", a series name). Chart titles and
subtitles in the registry lost 18 em dashes and 27 spaced hyphens used as dashes; bindings are by slug and hold.

**Integrity fixes worth knowing about:** stripes were centred on the midpoint of the range rather than the normal
(a −2% monsoon was painted "normal", and the 1901 tooltip read −16% against a published −13.8%); a
percentage-point change printed as "%"; a change card printed "+0.81" for +81 lakh people; rural and urban lines
were sometimes black or swapped.

**Left alone, and why:**
- Article prose and headlines (em dashes in `/about/`, "What India's AQI Can See, And What It Can't" in title
  case, "El Nino" without the tilde): these are the author's words, not chart furniture.
- Chart choices that are editorial: spaghetti charts of eight countries, three near-identical GDP/GNI/GNDI lines.
  A different form would change what the figure argues; that is the author's call.
- Possible content errors the colour audit surfaced, not fixed because they are not design: the gold article's
  "The import figures check out" explainer says "follow the two lines" over a one-line chart; the El Niño droughts
  explainer mentions ONI and DMI values the bar chart does not show; the wealth-share chart's subtitle says
  1961 to 2023 but its data starts in the nineteenth century.

**Next, if there is another pass:** move the GVA-by-sector and generation-mix articles onto `stackedArea` (with
their `howToRead` rewritten); a marimekko for state × sector composition; per-panel scales on `scenarioMaps` on
phones (three maps at 110 px each are small); a crosshair for stacked areas; fold the remaining legacy chart-note
fallbacks into the explainers.


The audit behind the October 2026 refinement of the Almanac, and what was done about
each problem. Ranked by how much it hurts a reader, worst first. Screenshots were taken
with puppeteer at 1440 and 390 px across 16 articles that between them use every chart
kind, plus the home, a domain page, /articles/, /library/, /about/, /methodology/ and /nfhs6/.

Status: **done**, **partly**, **open**.

| # | Problem | Where | Fix | Status |
|---|---|---|---|---|
| 1 | Stripes with missing years drew each stripe one slot to the left, so a series with gaps (Berkeley Earth from 1817) ran off the right edge and the last four decades were clipped out of the figure | `stripes` in `almanac.ts` | Position stripes by year span, not by count; gaps stay visible as gaps | done |
| 2 | Bars, the commonest figure on the site (61 pages), were HTML: no SVG or PNG download, no hover, value labels pinned to the far right edge on diverging bars, no unit anywhere, and the phone layout broke rows into three lines | `bar` kind in `ArticleVisuals.astro` | Redrawn as SVG by `hbars` in `src/data/figures.ts`: thin bars, value at each bar's end, unit printed once over the values, zero line in ink, shared scale across groups, a phone version with the label above each bar | done |
| 3 | The diverging ranked-change chart printed "CITY" and "← cooler · warmer →" over a chart of state tax shares | `rankedChange` | Header text now comes from the plan only; defaults are neutral ("Lower / Higher") | done |
| 4 | Small multiples printed "97.1%% → 94.5%%", washed out cool cities to near-white (Leh was invisible), stretched each line with `preserveAspectRatio="none"`, had no axis values and no download | `sparkGrid`, `startingGrid` | Redrawn as one SVG grid (`smallMultiples`): every panel has its first and last value, a hairline baseline, one ink, a shared or per-panel scale stated in the figure, hover on every point | done |
| 5 | Internal ids leaked into reader-facing text: "mendeley:y58jknpgs8:summer2024", "grid-india · peak_gw", "UN Population · 71" | subtitles and source lines | `cleanSubtitle` and `sourceLabel` drop machine ids (colons, underscores, bare numbers) | done |
| 6 | Single-series line charts reserved a right gutter for the series name, which they never print, so the plot used about 75% of the figure width | `lineGeometry` | Gutter sized to what is actually printed | done |
| 7 | "On a small screen" notes were build instructions ("Keep the line clean with sparse year labels"), shown to readers | chart notes | No longer rendered; the phone figure is now drawn for the phone instead | done |
| 8 | Only line charts answered hover; bars, dots, map regions and cells did not | all figures | One tooltip layer for every mark with a `data-tip`, `<title>` promoted to the same tooltip, keyboard focus on charts with few marks | done |
| 9 | Article column had three left edges (header 760px, story 660px, "The point" 1040px) | article page | One reading column; the headline may run wider to the right only | done |
| 10 | The guided story repeated its title as the first section heading | article page | The duplicate section heading is dropped when it equals the story title | done |
| 11 | "The point" printed raw values to three decimals ("78.163") beside a stock line that said nothing | `pullQuoteForPage` | Rounded like the rest of the page with its unit; the generic fallback sentence hides the block | done |
| 12 | Population pyramid: 9px numbers, grey tracks, HTML only | `pyramid` | SVG pyramid with the age axis in the middle, values at bar ends | done |
| 13 | Load curve: ticks at 62.5 and 188, a legend instead of labels, no hover | `loadCurve` | Drawn through the line engine on an hour axis with nice ticks and direct labels | done |
| 14 | Stack and share strips: blocky, labels clipped inside narrow segments, the same numbers repeated as bars underneath | `stack`, `share`, `stripPair` | One SVG share strip per row, labels outside narrow segments with ticks, no duplicate bars | done |
| 15 | Scatter (heat vulnerability) and scatterXY: faint dots, line swatches for dots in the legend, axis titles rotated | `scatter`, `scatterXY` | Rebuilt on the `scatterFit` anatomy (no fit line unless asked) | done |
| 16 | Anomaly line charts did not mark zero; no chart printed its unit | `renderLineSvg` | Zero drawn in ink when the axis crosses it; unit printed once over the y axis | done |
| 17 | Domain pages and /articles/ were bare lists | `[domain]/index.astro`, `articles/index.astro` | Lead story, deks, small figures, status shown quietly. (Marked done by the first session but not on disk after its crash; built in the second session, `af5e72c`.) | done |
| 18 | Change cards, line panels, scenario maps were legacy HTML/JSX | `change`, `linePanels`, `scenarioMaps` | Redrawn as SVG small multiples | done |
| 19 | Stripes centred on the midpoint of the range, not the normal: a −2% monsoon painted grey "normal", every colour shifted, and the rain tooltip printed the re-centred value (1901: −16% against a published −13.8%) | `warmingStripes` in `viz.ts`, stripes in `ArticleVisuals.astro` | Centre 0 for departure and anomaly series, the mean otherwise; tooltip prints the published value | done |
| 20 | 99 explainer sentences named colours the charts no longer draw | `data/explanations/en/` (20 files) | Each checked against the render; colour corrected or replaced by the series name | done |
| 21 | Rural and urban lines drawn black, or swapped, against the fixed meanings | line charts | `lineInks()`: rural hara, urban neel, a second line of the same meaning dashed | done |
| 22 | A change in a share printed as "10.2%" under a "percentage points" caption | `chartFormat.ts` | Points print bare | done |
| 23 | Change card printed "+0.81" for +81 lakh people, and was stretched from 420 to 900 px with doubled text | `changeSvg` | Counts in crore/lakh written the Indian way, endpoints labelled; no figure drawn past its width | done |
| 24 | Hyphens for minus signs; "2.2" beside "1.83"; "->", "<=", "deg C" in labels; "₹0 lakh"; "2026-03" for FY 2025-26; "₹0 lakh in 1961" for ₹404 | all figures | `typeset()`, `harmoniseDecimals()` (per group), `pointDateLabel()`, first value in its own scale | done |
| 25 | Raw ids in subtitles and sources ("ncp · by state", "SP.POP.TOTL", "international-prices-crude-oil.indian-basket.$-per-bbl", "RBI e-STATES · RBI e-STATES") | `ArticleVisuals.astro` | Sixty more source names; upstream codes kept to the source line; duplicates dropped | done |
| 26 | Scatter labels collided on phones and on the desk ("Telang Karnataka"), and the size key sat on points | `scatterFit` | Collision-aware placement; key under the plot on phones; reference label haloed | done |
| 27 | Heat strip clipped "Maharashtra" and the last year on phones | `heatStrip` | Columns sized to what they print | done |
| 28 | Phone bars: the zero line ran through the labels set above each bar | `barsSvg` | Zero line drawn beside the bars only | done |
| 29 | Departure bars in one ink either side of zero | `barsSvg` | Temperature neel/sindoor, rain haldi/hara, as the stripes | done |
| 30 | Map strip: Delhi's income past the scale ran into its printed value; pivot label read "45.0% about 45%" | `renderChoroplethStrip` | Clamped with an arrow; a pivot label with a number prints alone | done |
| 31 | The contents rail sat at the screen edge at 1440 and highlighted the wrong section after a jump | article page | Shown from 1500 px in the margin beside the figures; highlight read from scroll position | done |
| 32 | Citation and edit history were boxed grey panels with tiny letter-spaced buttons | `ArticleCite.astro`, edit log | Ruled, unboxed, citation set in Newsreader | done |
| 33 | Em dashes and spaced hyphens in 45 chart titles, subtitles and reading-list labels | registry | Commas, colons and the house middle dot | done |
| 34 | Projected years drawn exactly like measured ones (UN population to 2100, MoHFW ageing to 2036, CMIP6 scenarios, the income catch-up) | line charts, registry | `projectedAfter`: dashed after the last measured year, faint ground, "projected" hairline; set on 15 charts from each source's note | done |

New forms added this round are listed in `docs/ALMANAC_DESIGN_SYSTEM.md`.
