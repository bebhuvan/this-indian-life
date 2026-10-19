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
| 35 | Phone figures stopped 22 px short of the column on larger phones; bar captions, axis titles, change-card notes and share labels ran off the edge; month ticks printed "undefined"; financial years ("2017-18") were read as months; ticks, end labels and band labels collided | all figures | Phone figures fill the column; captions and notes wrap; FY axes; every tick set thinned so no two touch; end values inside the plot on phones when clear of the lines. Audit of 1,024 figures at 412 and 1440 px: overlaps 17 and 7 to 0, spills 33 and 10 to 0 or under 8 px | done |
| 36 | A single change card was a 420 px figure alone in a 1040 px column, most of the figure empty | `changeSvg` | One change on a wide column reads across: label, change and dates on the left, the start and end values on a line that runs the rest of the width (`changeWideSvg`). Two to four changes share the width | done |
| 37 | Desktop multi-line charts reserved a right gutter of at least 118 units and sized it to "World Inequality Database method 22.3%" on one line, so the plot used about 70% of the figure | `lineGeometry`, `renderLineSvg` | Long names wrap onto two lines (`endNameLines`), label spacing accounts for the extra line, the gutter is sized only to what is printed | done |
| 38 | Phone line charts are drawn on a 384 box shown at about 368 px, so every 11-unit label (dates under values, marks, reference names) rendered at 10.5 px | `renderLineSvg` | Phone sizes 11.5; small text under 11 px on a 412 phone fell from 290 figures to under 40 (the rest are Almanac keys drawn 1:1 at 10.5) | done |
| 39 | Number formats: dollars in lakh grouping ("$2,92,344"); "$-17"; one axis mixing "5,00,000" with "1 million" and "₹50k cr" with "₹1 lakh cr"; phone end values in a different scale from the axis caption ("973.4" under "billion", in millions); small values printed "0.0 million" | `chartFormat.ts`, `typeset()` | Dollars grouped in thousands; the currency sign follows the minus; every y tick written in the scale of the top tick (`axisFmt`); phone end values in the axis's scale; a nonzero value keeps two significant figures | done |
| 40 | Labels across lines: a single line's first value ("43 in 1990") set over a steep stretch; phone end values inside the plot crossing a line, sitting on a dot, or stacked out of order (13,303 printed above 13,631) | `renderLineSvg`, `placeEndLabelsInside` | Every label box is tested against every segment, including ones that pass straight through it, and against every end dot; inside values keep the order the lines end in or the chart keeps its gutter; a first value with nowhere clear is left to the tooltip | done |
| 41 | A line that stops short (observed to 2014, projections to 2100) was named after its end, among the model lines | `renderLineSvg` | Named just before its own end, above or below it, clear of every line and every other such label | done |
| 42 | Dates and ticks: monthly series labelled to the day ("186.8 in 30 Apr 2013"); annual series stamped 31 December plotted most of a year right of their tick (a 1990 series opened on "1991"); a "2025.5" tick; 8-month steps (Jan 24, Sep 24, May 25); end ticks crowding ("2020 2025") | `pointDateLabel`, `lineGeometry` | Monthly cadence read from the typical gap; one-day-a-year series placed by year; whole-year steps; month steps of 1, 2, 3, 6 or 12 aligned to the calendar; wider minimum tick spacing | done |
| 43 | Bars: the zero line struck through group headers ("WHERE THEY L\|IVE"); short labels wrapped on desktop ("6 yrs / before", "Scheduled / Caste"), leaving half the label column empty; customs names in capitals ("U ARAB EMTS", "UNITED STATES OF AMERICA"); "Non-communicable (women)" clipped at the left edge | `barsSvg`, `readableLabel`, `labelTextW` | Zero line broken at each header; a label that fits its column stays on one line; shouted names set in sentence case (acronyms kept, customs abbreviations mapped); the label width estimate raised to match Schibsted Grotesk | done |
| 44 | Share strips: outside labels stacked into a ladder whose ticks ran through the labels below ("Hydro" through "Gas 2%") | `placeOutside` | Labels that fit on one row hang from their segment; otherwise a swatch key in segment order, long names wrapped | done |
| 45 | Database series keys in subtitles: "IFTLDATPSB11Q", "EIA · 47-33-IND-MBTUPP.annual" | `cleanSubtitle` | Dropped from the subtitle; the source line still carries upstream codes worth printing | done |
| 46 | Almanac forms: tile-map names ran together on phones ("Madhya PrChhattisgarh"); rank-slope label columns fixed at 150, leaving the crossing lines 50 units on a phone; dumbbell and waterfall gutters reserved for values never printed; "← Drier" on top of the "−20%" tick; calendar month letters at 9.5; scatter dots at 100% over the top tick and past the right edge; scatter y ticks at 2.75 and 2.25 printed "2.8" and "2.3" | `tileGrid`, `rankSlope`, `dumbbell`, `waterfall`, `beeswarm`, `calendarHeat`, `scatterFit`, scatter adapter | State codes on tiles too small for names (all tiles, one register); columns sized to their labels; gutters sized to what they print; a tick label that meets an end caption is dropped; 10.5; the plot inset by most of the largest dot; ticks printed to the precision they have, thinned on phones | done |
| 47 | "Becoming China's customer" printed "$1,26,96,34,89,318.9 billion": the series is in dollars, the plan said billions | registry `unit` | Unit corrected to "current US$", so the formatter writes "$127 billion". No value changed | done |
| 48 | Phone charts of five to seven countries ended in a ladder of unnamed values on leaders, which the key below could not untangle, and the ladder's gutter narrowed the plot | `lineGeometry` | With a protagonist (the emphasised line, or India), a phone writes only its value; the other lines keep their end dots, the key and the tooltip | done |
| 49 | Labels written in a series colour used the raw data ink: haldi labels at 3:1 and grey labels at 2:1 on white | line end labels, parade, sensitivity, connected scatter, load curve | `textInk()`: marks keep the ink, words take its darker text shade; `--sN-ink` tokens per domain | done |
| 50 | An eighth series wrapped back to the domain ink (India and United States both hara in the inflation world comparison) | `lineInks`, figure palettes | Series past the palette stay grey; no ink repeats in one chart | done |
| 51 | India changed hue between charts of one article (hara, then neel when listed third) | `lineInks` | India among countries trades inks with the first line, so it always wears the domain ink; registry colours still win; no explainer named the affected colours | done |
| 52 | Context lines nearly as loud as the emphasised one; a single line's first value as bold as its latest | `renderLineSvg` | Context 1.25 px at 0.6; the emphasised line cased in the ground colour; the first value set at 500 in mid grey | done |
| 53 | A second same-meaning line (Bihar urban) dashed "4 3" with round caps read as solid; projected context lines (Kerala, Bihar) shrank to dotted hairlines | `renderLineSvg` | Butt caps and a dash scaled to the weight; projected stretches at least 1.6 px, full ink when wholly projected | done |
| 54 | Axis numbers at #8a8a8a (3.5:1); bar group heads cramped black capitals | `INK.ink3`, line-chart CSS, export CSS, `barsSvg` | Axis text at the house dim #737373 (4.7:1); group heads tracked 0.07em in ink2 | done |
| 55 | Hairline rules could smear across two pixels when a figure is scaled; white halos and rings hard-coded | `line()`, `almanac.css` | Horizontal and vertical rules snap to the pixel grid; halos and rings follow `--bg` | done |
| 56 | Thirteen UN WPP 2024 lines (median age, dependency ratios, growth rate, mean age at childbearing, the national TFR path) ran to 2030 or 2100 drawn solid, as if measured | registry, `dependencyLine` | `projectedAfter: 2023`, from the series' own note ("values through 2023 are estimates; 2024 onward are projections") and the first year of the scenario variants (2024); `dependencyLine` now honours it | done |
| 57 | Bar categories that are raw dates ("2016-12-31") | `readableLabel` | 31 December prints as the year, 31 March as the financial year it ends, any other day as its month | done |
| 58 | A single line's first value written in its own scale but without its scale word on phones ("₹710 in 2008" under a "lakh cr" caption, for ₹710 crore) | `renderLineSvg` | A first value in its own scale always carries its scale word | done |
| 59 | Colour keys under stripes and map-strip legends at 10.5 px; the load curve's "Evening peak, solar gone" struck through by the peak hairline | `scaleKey`, `stripes`, `renderChoroplethStrip`, `loadCurveSvg` | 11 to 11.5; the band name drawn over the hairline with a halo | done |
| 60 | Phone line charts whose end values crowd (four oil benchmarks within $11, six climate regions within 1.5 °C) stacked them into a ladder on leaders at the card edge, far from their lines, and the ladder's gutter narrowed the plot. Row 48 covered only five-plus lines with India in them | `lineGeometry`, line-chart key | When any phone end value must move more than 9 units off its line to clear the others, every value moves into the key beside its series' name, the key is listed top to bottom as the lines end, and the plot runs to the right edge; end dots stay. Values keep their own precision | done |
| 61 | Right-edge audit of all 592 line charts (a browser probe measuring each end label's distance from its line's end dot, and the empty width between the widest end label and the figure's edge): desktop gutters were sized at a flat 0.6 em per character with a 118-unit floor, so 371 desktop charts carried 25 to 80 px of dead space; 35 desktop and 33 phone charts stacked labels into ladders; a line that stopped early was labelled inside the plot while the gutter was still sized for it | `textWidth` (`almanac.ts`), `lineGeometry`, line-chart keys | Gutters sized with Schibsted Grotesk's measured advance for every glyph and weight; the floor cut to 24; one "stops a year or more short" rule shared by the geometry and the render; on desktop too, labels that would drift more than 24 units off their line ends move into the key with their values. After: phone 0 ladders, 0 dead gutters; desktop 371 dead gutters to 5 (all within 2 px of the threshold), 35 ladders to 8 (each 19 to 24 px, on a leader). Overlap and spill audits stay at 0 at both widths | done |
| 62 | Values stored in lakh crore ("Rs lakh crore", "INR lakh crore") went through the crore branch: state revenue expenditure of ₹40.24 lakh crore printed "₹40.2 cr", a lakh times too small (state budgets, RBI gold reserves in rupees) | `chartFormat.ts` | A lakh-crore unit prints as lakh crore in every formatter (axis, bar values, end labels) | done |
| 63 | An event-time series (years -4 to 4 around a policy start) sorted as text, -1, -2, -3, -4, 0, so the line itself was drawn out of order and the axis read -1, -4, 1, 4 | `sortPoints`, grouped lines in `viz.ts` | Dates that are plain numbers sort as numbers (`compareDates`) | done |
| 64 | Desktop ticks on a three-year annual series stepped by half a year ("Jan 23, Jul 23, Jan 24") | `lineGeometry` | Yearly data never steps by less than a year | done |
| 65 | Change cards printed "+0 points a year on average" for slow rates; dataset slugs and variable names in subtitles ("annual-temperature-anomalies", "2m_temperature broad-region", "monsoon_share_pct") | `changeText`, `cleanSubtitle` | A slow pace keeps two significant figures; hyphenated dataset slugs dropped from subtitles, ERA5 variable names written as words | done |
| 66 | Charts not bound to a section sat in a two-up grid: maps and other wide forms shrank to thumbnails at half width, and an odd card out left half a row blank on desktop | `ArticleVisuals.astro` (`fullRow`), `indica.css` | Wide forms and the last card of an odd run take the full row and are drawn at full width; pairs stay two-up | done |
| 67 | The layout audits lived only in a scratch folder | `scripts/audit-charts.mjs` | One repeatable audit of every figure at 412 and 1440 px: overlaps, spills, text under 11 px, line-label ladders and dead right gutters; fails on any overlap, spill or phone problem. At this commit: 412 px all zero; 1440 px 0 overlaps, 0 spills, 24 figures with small text (map-strip pivots and Almanac keys), 8 ladders (19 to 24 px, on leaders), 5 gutters (within 2 px) | done |

New forms added this round are listed in `docs/ALMANAC_DESIGN_SYSTEM.md`.
