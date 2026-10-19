# Design refinement log

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
| 17 | Domain pages and /articles/ were bare lists | `[domain]/index.astro`, `articles/index.astro` | Lead story, deks, small figures, status shown quietly | done |
| 18 | Change cards, line panels, scenario maps were legacy HTML/JSX | `change`, `linePanels`, `scenarioMaps` | Redrawn as SVG small multiples | done |

New forms added this round are listed in `docs/ALMANAC_DESIGN_SYSTEM.md`.
