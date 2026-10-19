# The Almanac: design system and chart forms

The house style since October 2026. White paper and black ink; Newsreader to read in,
Schibsted Grotesk to count in; five data inks named after Indian dyes; hairline rules;
figures that leave the page whole.

## Where it lives

| Piece | File |
|---|---|
| Tokens (colours, type, domain inks, series order) | `src/styles/indica.css` (top) |
| Component layer (nav, article, figures, notes, footer) | `src/styles/almanac.css` |
| Chart engine: pure functions, data in, SVG string out | `src/data/almanac.ts` |
| Registry adapters for the new forms | `src/data/almanac-visuals.ts` |
| Home page data (every number computed from series) | `src/data/almanac-home.ts`, `src/components/HomePage.astro` |
| Downloaded figure (SVG/PNG export) | `public/article-actions.js` |
| Social cards | `src/pages/og/articles/[slug].png.ts` |
| Fonts (self-hosted, variable, latin + latin-ext for ₹) | `scripts/fetch-fonts.mjs` → `public/fonts/`, `src/styles/fonts.css` |

## Rules every page keeps

1. **The title states the finding.** "Kerala got there 31 years before India", not "TFR by state". The measure and unit go in the subtitle.
2. **Ranges, never false precision.** When an estimate depends on a choice, show the choice (the sensitivity form).
3. **Every figure leaves the page whole.** SVG, PNG and CSV for every chart; the export carries title, measure, source and the site's name.
4. **Label the data, not a legend.** Names sit at line ends and beside dots. A key only when there are more than four things.
5. **Each colour carries one meaning.** Rural is always hara, urban always neel. Above a threshold is sindoor, below it neel.
6. **The form follows the data's shape.** See the table below.

## Colour

- Ink `#121212`, mid `#4f4f4f`, dim `#737373` (text) / `#8a8a8a` (axis labels), grid `#ededed`, rule `#dadada`.
- Data inks: neel `#33489a`, sindoor `#c24a2e`, hara `#008a6e`, haldi `#b98014`, jamun `#7b4790`.
- Each domain borrows one ink as `--c` (people sindoor, economy hara, energy haldi, climate `#1f6f8b`, health jamun, society neel).
  Chart series follow `--c`, then ink black (`--s2`), then the three inks the domain does not use (`--s3..--s5`), then grey.
- Continuous scales are interpolated in OKLab between named stops (`SCALES` in `almanac.ts`). Diverging scales have a grey middle, never a hue.

Registry entries that hard-code `color` on a series still win over the palette. When you touch such an entry, prefer the named inks.

## The forms

Use them in a `visualPlan` entry with `chart: "<form>"`. Each adapter returns `null` if its data is missing, so a plan fails soft.

| Form | Data shape | Use it for | Avoid when | Plan fields |
|---|---|---|---|---|
| `heatStrip` | many units × many years, one measure | when each unit crossed a threshold, and in what order | exact values matter more than the pattern | `series[]`, `scale`, `threshold`, `thresholdLabel`, `emphasis`, `legendTicks` |
| `tileGrid` | one series per state | regional patterns, every state equal space | area or population should dominate | `series[]` with `pos: [col,row]`, `reference`, `threshold`, `yRange` |
| `scatterFit` | two measures for the same units | association, outliers named, honest r | readers will take it as cause | `indicator` (table rows `label,x,y,highlight`), `sizePrefix`, `sizeFallback`, `sizeKey`, `refY`, `threshold` |
| `parade` | values for fractiles of a population | inequality, each group as wide as its share | the groups are not ordered | `series[]` (fractile tables), `widths` |
| `sensitivity` | an estimate that depends on a chosen threshold | showing the range a choice creates | the threshold is fixed by law and not in dispute | `indicator`, `groupField`, `xField`, `yField`, `band`, `highlight` |
| `dumbbell` | two survey rounds, many units | who moved, by how much, who fell back | more than two time points | `indicator`, `labelField`, `aField`, `bField`, `aLabel`, `bLabel`, `exclude` |
| `rankSlope` | the same units ranked two ways | where two rankings disagree | gaps between ranks are what matter | `series[2]` (tables with `label,value`) |
| `beeswarm` | one value per year or place, up to a few hundred | a whole distribution, every case visible | the order in time is the point | `indicator`, `groupIndicator`, `groupField`, `groups`, `marks` |
| `dayRibbon` | parts of a fixed whole (a day, a rupee) | how two groups divide the same whole | the parts do not add up to a real total | `parts[]`, `total` |
| `unitChart` | a single share | making a percentage countable | the share is under 2% or must be compared with many others | `indicator`, `match`, `labelField`, `bField` |
| `intervalPlot` | estimates that are ranges, not points | honest uncertainty, side by side | the range is so narrow a dot would do | `indicator` (table), `labelField`, `loField`, `hiField`, `midField`, `refY` |
| `ridgeline` | a distribution for each of several groups | how the shape of a spread changes across eras or places | a group has fewer than about 20 values | `indicator` (yearly series), `eras: [[from,to],...]`, `scale`, `threshold` |
| `calendarHeat` | one value per day over months or years | seasons, weekdays and shocks in daily data | the series is weekly or sparser | `indicator` (daily series), `transform: "pctChange"`, `years`, `scale` |
| `connectedScatter` | two measures moving together through time, for a few units | paths: who got where, and in what order | more than about six units | `paths: [{label, x, y, color}]`, `xLog`, `xTitle`, `yTitle`, `refY` |
| `waterfall` | parts that add up to a total, some negative | which parts pushed a total up and which pulled it down | the parts are not additive | `series[]` (one indicator per part), `totalIndicator`, `totalLabel` |

Every form is shown on real data at `/library/` (`src/pages/library.astro`, data in
`src/data/almanac-library.ts`), with its data shape and when to avoid it.

The older kinds still render through `ArticleVisuals.astro`, redesigned rather than re-coloured:
- **Lines** (`renderLineSvg`): no floating headline number; the latest value is written beside its
  point and a long single series also names its first value; multi-series charts name each line
  at its end in its own ink (a key appears only on phones or past seven lines); the y-axis is
  tightened to the data (`tightScale`); emphasised series are heavier than context series; a
  reference line is named beside itself; a soft wash sits under single series only when the axis
  starts at zero. Every line chart has a hover crosshair (`initHover` in `public/article-actions.js`)
  fed by a `data-hover` attribute built at compile time.
- **Bars**: thin bars with the value at each bar's end, no grey tracks; groups with negatives
  diverge from a zero line.
- **Maps** (`renderChoroplethSvg`, `renderChoroplethStrip` in `chartSvg.ts`): hairline borders, no
  shadow, values printed inside regions big enough to hold them, and a ranked strip of every region
  beside the map whose header is the legend, with any pivot (such as replacement) marked.
- **Stripes**: drawn by the Almanac `stripes` form; rain runs dry haldi to wet hara, temperature
  cool neel to hot sindoor, both centred on the series' normal.

Every new figure still needs a `chartExplainers` entry whose `howToRead` describes the new form. If you
swap a chart's form, keep its `title` so `sectionVisualMap` and the explainer still bind, and rewrite the explainer.

## Statistics the figures compute

`scatterFit` prints its own least-squares r and draws the 95% interval for the fitted mean. Read the number
before you write the title: on the fertility page, income tracks fertility slightly more tightly than girls'
schooling on a linear fit (r −0.69 against −0.64), which is why those two charts stay as `scatterXY` until the
claim in the prose is settled.
