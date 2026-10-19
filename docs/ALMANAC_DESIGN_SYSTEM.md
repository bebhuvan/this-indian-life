# The Almanac: design system and chart forms

The house style since October 2026. Warm paper and black ink; Newsreader to read in,
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

- Paper `#faf8f3` (`--bg`), ink `#121212`, mid `#4a4640`, dim `#6e6961` (text and axis numbers), grid `#e9e4da`, rule `#d5cec2`.
  The neutrals are warm, to sit on the paper. White halos, rings and knock-outs in a figure follow `--bg`, in exports too.
- Data inks: neel `#33489a`, sindoor `#c24a2e`, hara `#008a6e`, haldi `#b98014`, jamun `#7b4790`.
- Each domain borrows one ink as `--c` (people sindoor, economy hara, energy haldi, climate `#1f6f8b`, health jamun, society neel).
  Chart series follow `--c`, then ink black (`--s2`), then the three inks the domain does not use (`--s3..--s5`), then grey.
- Continuous scales are interpolated in OKLab between named stops (`SCALES` in `almanac.ts`). Diverging scales have a grey middle, never a hue.

Registry entries that hard-code `color` on a series still win over the palette. When you touch such an entry, prefer the named inks.

- Text-safe inks: neel `#2e418c`, sindoor `#a63d24`, hara `#00735c`, haldi `#8a5f0a`, jamun `#6a3c7d` (tokens `--neel-ink`
  and so on, and `--s2-ink..--s6-ink` per domain). Any word set in a series colour goes through `textInk()`; marks never do.
- Axis numbers are `#6e6961`.
- No ink repeats within a chart: past the palette, series are grey.
- India, as one of several countries, always wears `--c`.
- **Story inks** (`lineRoles` in `ArticleVisuals.astro`; `barsSvg` in `figures.ts`). A chart is about something. In a line
  chart of three or more lines, the protagonist (the plan's `emphasis`, else India, else the line the title names) wears
  `--c` at 2.8 units, cased in the paper; the first rival the title or takeaway names is ink black at 2, a second the next
  data ink; every other line is context, warm grey `#b9b2a6` at 1.25, its name and value in `#7a746a`. Phones write
  values for the protagonist and rivals only, and name the context lines once in the key under a single grey swatch.
  Rural/urban keep their fixed inks; men/women lines are never context. Bars: the national row and rows the title names
  (demonyms count: "per Chinese" names China) take `--c` then ink, the rest warm grey `#cfc8bb`, when they are at most a
  third of the rows. Three or four lines with no subject keep the palette. A chart whose explainer names its colours keeps
  the palette until the prose is rewritten (`namesColours`).
- **The annotation voice** is Newsreader italic (`note()` in `almanac.ts`), for what a chart says about itself: a gap's
  count, a trend's name. Values and names stay in the grotesque.

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
| `slope` | two points in time for a handful of units | who moved and how far, both values printed at the ends | more than about a dozen units, or the path between the points matters | `series[]` (one yearly indicator per unit), `aYear`, `bYear`, `aLabel`, `bLabel`, `emphasis`, `domain` |
| `stackedArea` | parts of a total, year by year | how the mix changes while the total grows | readers must compare the middle layers precisely (use lines) | `indicator` (long table) with `seriesField`, `valueField`, `dateField`, `layers: [{key, label, color}]` in stacking order; or `series[]`; `share: true` for 100% |

Every form is shown on real data at `/library/` (`src/pages/library.astro`, data in
`src/data/almanac-library.ts`), with its data shape and when to avoid it.

The older kinds still render through `ArticleVisuals.astro`, redesigned rather than re-coloured:
- **Lines** (`renderLineSvg`): no floating headline number; the latest value is written beside its
  point and a long single series also names its first value; multi-series charts name each line
  at its end in its own ink (a key appears only on phones or past seven lines); the y-axis is
  tightened to the data (`tightScale`); emphasised series are heavier than context series; a
  reference line is named beside itself; no wash under a single line. The scale stops at the last gridline the data
  reach when they pass it by under a fifth of a step. A unit naming a rank runs with 1 at the top. A single line's
  highest or lowest point is marked with its value and date when it stands more than a fifth of the plot from the end
  (`peakMark`). A single annual climate series (temperature, departure or rain) of 40 or more noisy years draws its years
  as a fine trace under a centred 11-year average, named in the annotation voice (`trendOf`). When the title names the
  protagonist and one rival, the gap between them is shaded where the rival leads, with the count of years written in
  the plot (`gapBand`). Five or more peer lines (no protagonist, none named, annual) become small multiples on one
  scale, each panel's line over the others as ghosts (`linePeersFigure`). Every line chart has a hover crosshair (`initHover` in `public/article-actions.js`)
  fed by a `data-hover` attribute built at compile time.
  Among peers with an emphasised line, the others are 1.25 px at 60% (a story's context is grey instead), and the emphasised line is cased in the ground
  colour. A single series' first value is set lighter than its latest. A second line with the same fixed meaning is
  dashed with butt caps at a length scaled to its weight. On a phone, five or more lines with a protagonist write
  only the protagonist's value; the key and tooltip carry the rest. Otherwise, when phone end values would have to
  ladder away from their lines to clear each other, they move into the key beside each name (ordered as the lines
  end) and the plot runs to the right edge.
- **Projections** (`projectedAfter` on a `line` or `multiLine` plan entry, or on one `series` item):
  the year of the last measured point. After it the line is drawn dashed in the same ink and
  weight, the plot behind it takes a faint ground, and a dotted hairline marked "projected ->"
  stands at the split. A jagged model run (CMIP6 scenarios) stays solid inside that ground, since
  dashes break noise into specks. Set it from the source's own note (UN WPP 2024: estimates to
  2023; MoHFW 2020: Census 2011 then projected), never by eye.
  A projected stretch is never thinner than 1.6 px; a line projected throughout keeps its full ink.
- **Bars**: solid close-set bars (12 to 18 units, no rules between rows) with the value at each bar's end at weight
  500, the story's rows at 700; a bar three times the next is cut with a slanted break, its value written; no grey tracks; groups with negatives
  diverge from a zero line.
- **Maps** (`renderChoroplethSvg`, `renderChoroplethStrip`, `renderChoroplethDots` in `chartSvg.ts`): on phones the ranked
  strip becomes one row of dots on the colour scale with the three highest and two lowest named. Hairline borders, no
  shadow, values printed inside regions big enough to hold them, and a ranked strip of every region
  beside the map whose header is the legend, with any pivot (such as replacement) marked.
- **Stripes**: drawn by the Almanac `stripes` form; rain runs dry haldi to wet hara, temperature
  cool neel to hot sindoor, both centred on the series' normal: 0 for a departure or anomaly series, the series
  mean otherwise. (They were once centred on the midpoint of the range, which painted a −2% monsoon "normal".)
  The tooltip prints the published value.
- **Departure bars**: a bar chart whose unit or title is a departure from normal colours each bar by sign in the
  stripe inks (below normal neel or haldi, above sindoor or hara); other signed values keep the domain ink.
- **Fixed inks in line charts**: a series named rural is hara and urban neel whatever the palette or the registry
  says; a second series with the same meaning is dashed. Other lines then start at ink black.

Every new figure still needs a `chartExplainers` entry whose `howToRead` describes the new form. If you
swap a chart's form, keep its `title` so `sectionVisualMap` and the explainer still bind, and rewrite the explainer.

## Typesetting every figure shares

`typeset()` in `almanac.ts` runs over every chart's SVG before it reaches the page, so these hold everywhere:
a true minus sign (U+2212) for negative numbers, in text and tooltips; `->` and `<=` set as → and ≤; "deg C" as °C;
a zero with no scale word ("₹0", not "₹0 lakh"). `harmoniseDecimals()` in `chartFormat.ts` gives the labels of one
chart (or one bar group, since groups often come from different sources) the same number of decimals, never padding
a one-decimal source to look like a two-decimal one, and leaving mixed magnitudes (7.52 beside 117) alone.

Other rules the renderers keep:
- A figure is never drawn wider than the width it was laid out for (`max-width` on every figure SVG), so a narrow
  form cannot be stretched into giant text.
- A change in a share is in percentage points and prints bare ("10.2" under a "percentage points" caption), not "10.2%".
- Counts stored in crore or lakh (people, cases) print the Indian way: 0.88 crore is "88 lakh".
- Annual series dated 31 March label their latest point as a financial year ("2025-26").
- Line end labels carry a white halo where they cross other lines; scatter labels are placed by collision (each
  tries four sides; on a phone one that cannot fit is left to the tooltip).
- Map strips: a value past the colour scale sits at the scale's end with an arrow, and still prints its value.
- One axis, one scale: every y tick is written in the scale of the top tick (`axisFmt`), and phone end values,
  which borrow the axis caption's scale word, are written in that same scale.
- Dollars are grouped in thousands ("$292,344"); rupees and Indian counts keep lakh grouping. A minus goes before
  the currency sign ("−$17").
- No label sits on a line: line labels are tested against every segment and end dot before they are placed. A
  label with nowhere clear is left to the tooltip rather than laid across the line.
- A line that stops short of the others is named just before its own end, not after it among the lines that carry on.
- A figure fills its column: a single change card reads across the full width, line-chart gutters are sized to the
  labels they print (long series names wrap onto two lines), and bar labels that fit their column stay on one line.
- Horizontal and vertical rules snap to the pixel grid (crispEdges). White halos, dot rings and cut gaps follow
  the page ground (`--bg`).
- One left edge: the title, subtitle, key, the figure's leftmost text and the note all start on one x. Desktop y
  labels start on it (the gutter is the widest label plus the gap); bar labels and keys are flush left.
- Gutters are sized to the labels as printed: after `harmoniseDecimals`, after `typeset` (a minus is wider than the
  hyphen it replaces), at the size drawn, bold where the line is emphasised. A right gutter is the gap to the label,
  the label and a unit; nothing more.
- X ticks are evenly spaced in time: round years at the finest step that fits, months on the calendar step,
  financial years stepped back from the latest. A crowded axis is thinned to every second (third...) tick from the
  last, never by dropping the one tick that collided.
- A line the card names (title or takeaway; the subtitle only lists what is plotted), or the other side of India against
  one place, is never drawn as context: full ink, at least 2 units. Only context lines are under 1.75 units.
- Phone y labels sit in a gutter as narrow as the bare labels, right-aligned beside their gridlines, as on desktop;
  the unit sits in its own row above the plot. (They once sat above the gridlines and slid into the plot, or were left
  out, where a line ran past.)
- No label sits across a line or a dot anywhere in the plot: early line ends, reference names, band and mark labels
  and scatter names are each tried in several places, and a name with nowhere clear goes to the key or the tooltip.
- Phone text is at least 11 px as rendered on a 412 px phone (the line-chart box is drawn at 384 and shown at about
  368, so its smallest text is set at 11.5).

## The layout audit

`scripts/audit-charts.mjs` checks every figure on the built site at 412 and 1440 px (run it after `npm run build`;
see its header for the command). Besides overlaps, spills, small text, ladders and gutters it counts six rules: one
left edge, the plot uses the width, even ticks, no demoted comparison sides, text on marks, notes align. It exits 1
on any count above zero. Allowed exceptions are listed in the script and reported apart: centred pyramids, a map
strip beside its map, the climate theme's padded cards and the library's samples. `--rule=<name>` lists one rule's
figures. A new layout problem found by eye becomes a rule here, not a one-chart fix.

## Statistics the figures compute

`scatterFit` prints its own least-squares r and draws the 95% interval for the fitted mean. Read the number
before you write the title: on the fertility page, income tracks fertility slightly more tightly than girls'
schooling on a linear fit (r −0.69 against −0.64), which is why those two charts stay as `scatterXY` until the
claim in the prose is settled.
