# The chart kit

A clean-room chart kit for This Indian Life. It replaces the drawing layer of the old
renderer (`ArticleVisuals.astro`, `figures.ts`, `almanac*.ts`) and keeps none of its code.
The canvas explorations it came from are directions A (Hairline) and B (Pigment):
B's presence, pigments and display numerals, drawn with A's restraint and fine line.

Code: `src/kit/`. Gallery: `/dev/kit/`. This document is the contract; when the code
and this page disagree, fix one of them in the same change.

## What a chart must be

1. **Quiet.** One colour carries the point; everything else is stone or ink. No
   gradients, shadows, rounded bars, 3-D, or decoration that encodes nothing.
2. **Exact.** Text is measured from the font's own metrics, never estimated. Every
   gutter, label and tick is placed from those measurements.
3. **Collision-free.** No label overlaps a label, a mark it does not describe, or the
   frame. A label that cannot be placed is moved, given a leader, or dropped in an
   order the form defines; it is never drawn on top of something.
4. **Drawn for its width.** A chart is laid out at the width it is shown, from 320 to
   1040 px. Nothing is scaled. Text never drops below 11 px.
5. **Honest scales.** Lengths and areas start at zero. Shares stop at 100. A line may
   start elsewhere and says so with its first tick. Two units never share an axis.
6. **Labelled in place.** Series are named at their marks, not in a legend, whenever
   there is room. A legend is a fallback, drawn as a sentence of coloured words.
7. **Consistent numbers.** One chart, one format: the same decimals for every value,
   true minus signs (−), thin units (%, pts, $ m). Decimals are chosen from the spread
   of the data, not from the source file.
8. **Shareable.** Every chart exports to SVG and PNG with its title, one-line dek,
   source and the site's name. On the page the page draws the title; the chart does not.

## The signature

These are opinions, not defaults. They are what makes a chart recognisably ours at a
glance, before anyone reads the source line. Do not soften them per chart.

1. **The double rule.** Every figure opens under two ink rules, a hairline above a
   2 px line, 3 px apart: the ruling of an Indian account book, kept and stripped of
   its paper. It is the only ornament the site allows. Exports carry it; on the page
   the page draws it.
2. **Stone, never grey.** Context is a warm stone that sits under the story. Cool
   greys read as "default chart"; we never use them.
3. **Sindoor is a loss.** Red marks a fall, a deficit or a shortfall, nothing else. A
   reader who learns that once can read every chart on the site.
4. **The number gets a voice.** The one figure a chart is about is set large in
   Literata beside its mark, with a short note under it in the margin voice. One
   per chart, never more.
5. **A margin voice.** Annotations are Literata italic in `ink2`, written as a
   person would pencil them in: "TCS at 20% from here", "Projected". Labels and axes
   stay in the grotesque. Two voices: one measures, one comments.
6. **Estimates are dotted.** Projections, imputations and nowcasts are drawn as a
   line of round dots, never a dash. Measurements are solid.
7. **Labels above the line.** Value ticks sit on top of their gridlines at the left
   edge; there is no vertical axis line and no tick column eating the width.
8. **Numbers in Indian.** Rupees are written in lakh and crore with Indian grouping
   (₹1,02,900; ₹2.38 crore), years of account as 2025–26, never "FY26" in a label.
   Dollars stay in millions and billions.
9. **Nothing generic.** No rounded bars, no drop shadows, no gradient fills, no
   donut charts, no legend boxes, no tooltips that repeat the label, no chart that
   could have come out of a spreadsheet's default. If a chart looks like a template,
   it is wrong even if it is accurate.

## Ink

| Token | Value | Use |
|---|---|---|
| `ink` | `#1A1A1A` | text, the protagonist when it is not a pigment |
| `ink2` | `#57534D` | secondary text |
| `ink3` | `#6E6962` | axis text (5.5:1 on white) |
| `rule` | `#ECE9E3` | gridlines |
| `axis` | `#A9A49C` | baselines, ticks |
| `stone` | `#CFCAC0` | context fills |
| `stoneLine` | `#B5AFA4` | context lines |
| `neel` | `#26408B` | the default protagonist; gains; urban |
| `sindoor` | `#C0402A` | falls, losses, deficits, warnings |
| `haldi` | `#D9A21B` | a second highlight, marks only (fails as text) |
| `hara` | `#2E7D5B` | rural; a third series |
| `plum` | `#6B3E75` | a fourth series |

Sequential magnitude runs pale haldi to deep sindoor in five steps. Diverging runs
neel through stone to sindoor. Rural is always hara and urban always neel, and neither
hara nor sindoor is ever a general series colour. A projection is the same ink drawn
as round dots, on a faint ground. Dots mean estimate and nothing else: reference lines
and event markers are solid hairlines.

A story keeps one ink per series across all its charts (`src/kit/samples/inks.ts`),
so "$8.30" is neel wherever it appears.

## Type

Two voices. The grotesque measures: labels, axes and values in Schibsted Grotesk 400
and 600, proportional lining figures throughout (this font's tabular setting widens
punctuation to a full digit and makes numbers look typewritten; right-aligned columns
with one decimal format align well enough). Literata comments: the margin notes in italic `ink2`, and the one display
number. `figure` is a large grotesque numeral for tiles and table totals.

**One display number per chart.** The renderer refuses a chart with two.

| Role | Narrow (< 520) | Medium (< 800) | Wide |
|---|---|---|---|
| axis | 12 | 13 | 13 |
| label | 13 | 14 | 14.5 |
| value | 13 | 14 | 14.5 |
| note | 12.5 | 13.5 | 13.5 |
| figure | 17 | 19 | 20 |
| display | 20 | 24 | 28 |

Marks scale with the type: a dot is 4.75, 5.5 and 6.25 px across the three classes, and a
row is 30, 34 and 38 px. At 11.5 px axis text and 4.75 px dots a wide plot read as faint
specks (November 2026).

## Data labels

A number sits beside the mark it describes, in that mark's ink (its text-safe shade:
haldi is set darker, `textInk` in `theme.ts`, applied by the renderer to every text). It
is never a column away from its mark.

- **Lines**: the last value right after the line's end, then the series name in `ink2`.
- **Dumbbells**: each value outside its own end, the lower left and the higher right; the
  protagonist's value bold neel, the other `ink2`. The two ends are keyed once above the
  plot in their own words (no lowercasing: "PPP" stays "PPP"). Each row runs on a rail; the
  scale hangs under a baseline. A dumbbell's scale never runs below zero for values that
  cannot be negative.
- **Bars**: the value at the bar's end.
- A name that wraps keeps every word; no line limit silently drops the tail.

## Architecture

```
spec (data + intent) ──▶ transform ──▶ form(spec, width) ──▶ Scene ──▶ renderer
                                         │                              ├─ SVG (page, export)
                         core: scales, text, format, labels, theme      └─ PNG (resvg, later)
```

- **spec**: plain JSON. `form` names the chart; the rest is data and intent
  (`highlight`, `unit`, `sort`, `annotations`). Specs carry no pixel values.
- **transform** (`transform.ts`): index to a base, shares, differences, % change,
  rolling means, ranks, top-N with "other", fiscal-year sums. Each returns its data
  and a phrase describing what it did, so the dek can say "indexed, 1977 = 100".
- **form** (`forms/*.ts`): a pure function from spec and width to a Scene. Forms own
  their responsive behaviour; they ask the core for measurements, never the DOM.
- **Scene** (`types.ts`): rects, lines, paths, circles and text with roles. No CSS.
- **renderer** (`render-svg.ts`): Scene to an SVG string, with or without the
  export chrome. The same string serves the page, the download and the PNG.
- **runtime** (`client.ts` + `Chart.astro`): the server renders each chart at the
  column width; in the browser a ResizeObserver redraws it at the exact width.

### Responsive rules

Width classes: `s` < 520, `m` < 800, `l` otherwise. Each form decides what changes:
fewer ticks, names moved inside the plot or above their bars, a spectrum becoming a
ranked strip. On a phone no number the title depends on is ever dropped: line values
keep a narrow right gutter, and a name with no clear space falls back to a key set
as a sentence under the axis. Bars are about 0.55 of their row (14/16/18 px). Heights follow the data, not the width:
row forms grow with rows; time series use `clamp(w × ratio, min, max)` with a taller
ratio on phones so slopes keep their angle.

### Forms

Standard: `line`, `bars`, `columns`, `dumbbell`, `slope`, `arrows`, `waterfall`.
Story forms: `spectrum` (every member on one scale, named without collisions),
`tug` (gains against losses, net beneath), `tiles` (ranked fields of colour),
`hundred` (a population as 100 people, split at thresholds), `season`
(months by series as a field of tone), `curve` (one value across ordered groups,
e.g. growth by decile).

## Using the kit in an article

An article opts in by adding its question id to `KIT_ARTICLES` in `src/kit/adapt.ts`.
Nothing else changes: the registry `visualPlan`, the explainers, the section bindings
and the CSV downloads stay as they are.

- `src/pages/articles/[slug].astro` marks the article's visuals; `ArticleVisuals.astro`
  asks `toKitSpec()` to translate each one and, when it can, draws it with
  `components/kit/KitPlot.astro` inside the usual `FigureCard`.
- `toKitSpec()` translates `line`, `bar`, two-series `groupedBar` (as a dumbbell) and the
  almanac `dumbbell`. Anything else returns `null` and keeps the old renderer: maps,
  groups of three or more series, and the older bespoke forms. Add a translation (or a
  form) before moving an article whose charts depend on those.
- The kit owns colour. The adapter does not carry the old renderer's inks; set a
  series' ink in the spec only for a story-wide meaning (`src/kit/samples/inks.ts`).
- Units are mapped from the artifact's free text by `kitUnit()` (`USD million` → `$m`,
  `%`, percentage points → `pts`, rupee lakh and crore). An unmapped unit prints bare
  numbers; state it in the dek.

### Downloads

The card's SVG and PNG buttons (`public/article-actions.js`) call `window.tilKit.exportSvg`
for a kit chart: the chart drawn at its shown width (at least 640), under the double
rule, with its title, dek, source and the site's mark, and the page's fonts embedded so
the PNG renders in the right faces.

### Speed

- Each chart is drawn on the server, so it shows before any JavaScript runs.
- The browser redraws a chart only once it comes within 600 px of the screen, and only
  if its shown width differs from the width it was drawn at. Specs are parsed lazily.
- The client is one small module (`client.ts` and the kit, no dependencies) shared by
  every chart on the page.

## Annotation

A line chart takes four kinds, each placed only where it collides with nothing, in the
margin voice (Literata italic, `ink2`):

- `annotations: [{ date, label }]`: an event, a hairline with a tick and its note above.
- `references: [{ value, label }]`: a value that means something (a poverty line, half the
  population), a solid stone hairline across the plot, named at its right end where free.
  The scale extends to include it.
- `bands: [{ from, to, label }]`: a period (a gap between surveys, a lockdown), a faint
  ground behind the data, named inside its top; a name that does not fit is keyed under
  the axis, never dropped.
- `notes: [{ date, series?, label }]`: a single point, ringed, its note (two lines at
  most) beside it with a hairline leader. A note with no clear space is left out.

## Checking a change

- `node scripts/kit/render-samples.mjs <outDir> [--only=<id>]`: every gallery sample at
  360, 680 and 1040 px, to PNG, with the export chrome.
- `node scripts/kit/render-article.mjs <article-url> <outDir> <tag>`: every kit chart on a
  served article, at 360 and 1040, as one sheet each.
- `node scripts/kit/stress.mjs [article-url ...] [--verbose]`: every sample, and every kit
  chart on the given served articles, at each width from 320 to 1040 in 8 px steps. Each
  Scene goes through `src/kit/check.ts`: it fails on an exception, text over text, text
  running past the frame (measured, not just anchored), text under 11 px, or text under
  4.5:1 against the ground. The renderer throws on a second display number, so this also
  enforces the one-display rule.
- `node scripts/kit/snapshots.mjs [--update]`: fingerprints of every sample at 360, 680
  and 1040 against `src/kit/fixtures/snapshots.json`. A change lists the samples whose
  drawing moved; look at them, then `--update` in the same commit.
- Look at the result in a browser too: the PNG checks use a static TTF and miss
  OpenType behaviour. They missed that Schibsted's tabular figures widen punctuation.
- After changing the font files, run `node scripts/kit/build-metrics.mjs`.
