# Chart design direction

October 2026. A critique of the charts as they stand, and the design they should move to. Written after
studying every chart kind at 412 and 1440 px across twelve articles and `/library/` (about 400 card
screenshots), before any renderer was changed. The previous sessions' rules were read as inputs, not as
settled law.

## The verdict in one paragraph

The charts are correct and careful. They are not yet authored. Almost every figure is the same figure: a
thin-bar list or a line with a wash, five inks handed out in list order, every value in bold, the title's
claim left for the reader to find. The layout work (gutters, ticks, collisions) is genuinely good and
should stay. What is missing is the layer the best desks add on top of correctness: each chart is designed
around the one sentence in its title, so the eye lands on that sentence before it reads a single label.

## What is wrong now, with names

**1. The chart does not show its own title.** This is the biggest failure, and it repeats on every page.

- *did-foreign-money-build-india, "Pakistan's FDI ratio exceeded India's in 23 of 36 years".* Four lines
  of equal weight in four inks. The 23 years are never shown. Sri Lanka and Bangladesh shout as loudly as
  Pakistan. The reader has to count crossings by eye.
- *did-foreign-money-build-india, "$547 per Indian, against $2,243 per Chinese".* Singapore ($292,344)
  sets the scale, so India and China are slivers 2 px and 7 px long, coloured like every other row. The two
  numbers in the title are the two least visible things in the figure.
- *did-foreign-money-build-india, "From 43rd in the world in 1990 to 11th in 2025".* The rank axis is not
  inverted: the line falls as India climbs. A success story is drawn as a decline. This is a misreading
  the chart actively causes, not a matter of taste.
- *are-indias-big-cities-getting-hotter, "India's average temperature has climbed about 1°C since the
  1940s".* A jagged annual line with no baseline and no trend. The 1°C is not drawn anywhere; the noise is
  the loudest thing on the page.
- *did-foreign-money-build-india, "FDI equalled 3.1% of Indian fixed investment in 2025".* Fine as far as
  it goes, but the 2008 peak (10.3%) and the 2020 peak (8.3%) that give 3.1% its meaning are unmarked.

**2. Colour describes the list, not the story.** Series take the domain ink, then black, then three inks,
in the order the registry lists them. So "Viet Nam's FDI ratio has stayed well above India's" draws five
countries in five inks; "Maternal deaths fell fast, but are still far above the best countries"
(is-india-getting-healthier) draws nine. Five inks of equal saturation say "five categories of equal
interest". The titles say "India against one rival". Colour should say what the title says.

**3. Every chart is the same chart.** Of 1,019 figures, 346 are horizontal bar lists and 233 single lines,
all with identical anatomy; the seventeen Almanac forms appear six times in articles. is-india-getting-healthier
runs 41 figures that alternate between a thin-bar list and a line. The library is a showroom, not a
toolkit. Monotony is a design failure even when each chart is fine.

**4. Bars read as underlined lists.** Bars 8 to 13 units thick on 26-unit rows, every value at weight 600,
every bar the domain ink, India picked out only by a black bar. At a glance it is a table with rules under
it (dementia-in-india has nine of these on one page). The best desks draw bars as solid, close-set
blocks, one highlight, values quiet except the one that matters.

**5. Axes waste the plot.** The y scale always rounds up to the next nice tick, so "FDI equalled 3.1%"
reserves 10% to 15% for data that peaks at 10.3: a third of the plot is empty paper. India's share of
developing-economy FDI does the same. A flat 7% wash under every single line turns each into an area
chart; it decorates, it does not inform.

**6. Phones are the weakest surface.**
- Y labels slide right into the plot when a line crosses them: on four FDI charts a lone "0" floats 40 px
  into the plot and reads as a data label; on the rank chart "60" and "40" sit inside the data. 146 phone
  charts silently drop a middle label.
- Multi-line phone charts hand the reader a swatch key to decode a tangle ("India's FDI-to-GDP ratio
  stayed below Latin America's": five swatches, three rows of key, five crossing lines).
- "Southeast Asia took 6.3 times India's inflow in 2025" prints "2,44,165" (lakh grouping) beside an axis
  in "$300,000": two number systems in one chart, and the unit (US$ million) means it should read "$244
  billion".
- "Where dementia is most common": the ranked strip under the map is 28 rows, about two phone screens.

**7. Small multiples push the statistics onto the reader.** are-indias-big-cities-getting-hotter has four
grids of 38 panels, each on its own scale, captioned "read the slope, not the height". Own-scale panels
make a 0.2°C wiggle and a 2°C climb look the same. The page reads as seismograph wallpaper.

**8. Subtitles are metadata dumps.** "Inward FDI flows as a share of gross fixed capital formation · India,
Pakistan, Sri Lanka and Bangladesh · 1990-2025 · UNCTAD" repeats the series names (already on the lines)
and the source (already in the footer). The subtitle should say only what is measured, and in what unit.

**9. The ground is clinical.** Pure white under #121212 ink is the contrast of a spreadsheet. Every
publication on the list prints on a tinted or warm ground, or on white with warm neutrals; none uses
cold #ededed greys on #ffffff.

## What the best desks do that we do not

- **They design the chart around its sentence.** The FT's "highlight one, grey the rest" is not a
  palette; it is a decision that the chart is about one line. The Economist titles a chart with the
  claim and then makes that claim the darkest mark on the page.
- **They annotate from the data.** NYT and Reuters graphics mark the peak, the crossing, the stretch the
  headline names, with a short note set right on the chart. Not a legend: a sentence fragment where the
  thing happens.
- **They shade gaps and stretches.** When the story is "A above B in 23 years", the area between A and B
  is filled where A leads. When the story is a warming trend, the trend is drawn, and the noise recedes.
- **They are honest about scale breaks.** An outlier is cut and its value written on the cut, so the
  comparison the chart exists for gets the width.
- **They draw for the phone.** FT and Reuters phone charts are separate compositions: fewer ticks, the
  axis in a narrow gutter, direct labels, nothing to decode.
- **They choose a form when the data's shape asks for it** (The Pudding), not when a template exists.
  A rank is drawn as a rank; a distribution of states as a strip of dots; 38 cities as one heat strip.
- **Typography carries hierarchy.** Values in a regular or medium weight, the one value that matters in
  bold. Annotation in a different voice from data labels.

## The direction

### Principles

1. **The title is the brief.** A renderer reads the title (and subtitle and takeaway) for the series,
   places, years and comparisons it names, and draws those as the subject. Everything else is context.
2. **One story ink.** The protagonist (the series the plan emphasises, or India, or the one series the title
   names) wears the domain ink. A rival the title names wears ink black. Every other series is a warm
   context grey, finer, labelled in grey. Categorical palettes are kept only where categories are true
   peers with no protagonist (an energy mix, a share of a whole), and fixed meanings (rural hara, urban neel,
   departures) are untouched.
3. **Annotate from the data, cheaply and honestly.** Automatic marks, each a short note in the annotation
   voice: the peak of a single series when it is well above the latest value; the gap between protagonist
   and rival, shaded where the rival leads, with the count of years written on it; a long-run trend (a
   centred ten-year average) over noisy annual climate series, labelled as such. Editorial notes per chart
   are reserved for charts where an event is the point.
4. **Honest scales.** Ranks run with 1 at the top. A bar that would crush the rest is broken and its value
   written on the break. Line scales stop at the last gridline the data reach, letting the line rise a little
   above it rather than leaving a third of the plot empty. Bars always start at zero.
5. **Warm paper, warm greys (tried, then reverted: the owner keeps white and neutral greys).** The page ground moves from #ffffff to a warm paper (#faf8f3); greys move
   from cold #ededed/#737373 to warm (#e7e2d8 grid, #6f6a62 axis text, #b7b0a4 context lines). Ink stays
   #121212. The data inks keep their names and meanings.
6. **Two voices.** Data labels in Schibsted Grotesk: axis numbers at 400, values at 500, the protagonist's
   value at 700. Annotation in Newsreader italic, ink grey, beside a fine leader: the authored voice of the
   chart, distinct from its numbers.
7. **Phones get their own composition.** A narrow y gutter sized to the bare labels, so no label is ever
   moved or dropped; direct labels instead of swatch keys where the lines allow; grey context lines need no
   key at all, since only the protagonist and rival are named. Map strips on phones become one row of dots.
8. **Rhythm.** Three fixed heights per width (hero, feature, small), so a page alternates with intent.

### Each family

| Family | Now | Direction |
|---|---|---|
| Single line | Wash under the line, first and last values, top tick far above the data | No wash. Scale stops at the gridline the data reach. Peak marked when it tells the story. Noisy annual climate series get a ten-year trend line; the years become a fine grey trace. Ranks inverted. |
| Multi line | Five inks in list order, equal weights, swatch key on phones | Protagonist in domain ink at 2.6, a named rival in ink at 2, context in warm grey at 1.25 named in grey. Protagonist against rival: the gap between them shaded where the rival leads, the count of those years written in the shading. Five or more peers with no protagonist: small multiples, each panel one line in ink over the others as ghosts on one shared scale. |
| Bars | 8 to 13-unit bars, every bar the domain ink, all values bold | Solid close-set bars (about 60% of the row). One ink for the bars; the rows the title names (India, China) in domain ink and ink, the rest a quiet tint. Values at 500, named rows at 700. An outlier more than three times the next bar is broken with a cut and its value written past the cut. |
| Change cards | A big +number in the domain ink and a dumbbell | Kept: this form works. Values at 500. |
| Share strips | Five inks | Kept categorical (true peers), with the ink order following the warm palette; labels unchanged. |
| Maps | Desktop map and ranked strip; phone strip of 28 rows | Desktop unchanged in form. Phone: the strip becomes one row of dots on the measure's axis, the top three and bottom two named, India's value marked. The full ranking stays in tooltips and the CSV. |
| Scatter | Good anatomy | Warm ground and greys; protagonist and named units in ink; others grey. |
| Stripes | Good | Warm ground; stripe edges unchanged. |
| Pyramid | Men in domain ink, women grey | Kept; warm greys. |
| Small multiples (38 cities) | Own scales, "read the slope" | Shared scale of change since the first decade, or a heat strip of cities by year (rollout, not this pass). |
| Almanac forms | Underused | Used by rule when the data's shape matches (rollout). |

### Where I disagree with the starting thoughts

- **"Five or more lines become small multiples."** Only when there is no protagonist. With one, the
  highlight-and-grey treatment keeps everything on one scale and answers the question the title asks
  ("is India above or below the others?"), which small multiples make harder. Small multiples are for
  peers: six cities, none the subject.
- **Phone y labels.** The previous fix (slide the label along its gridline, else drop it) leaves numbers
  floating inside the plot and gaps in the scale. Better to give the axis a gutter on phones as narrow
  as its bare labels: every label stays, none moves, nothing overlaps. This changes audit rule 2 ("no phone
  y gutter") deliberately: the gutter is now required to equal the widest phone y label plus its gap.
- **Tabular figures.** Kept off. Values sit at bar ends and line ends, left-aligned, so column alignment
  gains nothing, and the face's tabular forms open visible gaps.
- **Pure white.** Proposed a warm paper; the owner saw it and preferred white, so white and neutral greys stay.
- **Wash under single lines.** Removed, not toned down.

### What stays

The layout engine (measured text, gutters sized to what is printed, collision tests, even ticks, the
financial-year axis, the number formatting rules) is the foundation and is not changed. Fixed meanings
(rural hara, urban neel, departure inks, stripes centred on the normal, projections dashed) are kept.

## Implementation notes

- `src/components/ArticleVisuals.astro`: `lineInks` (story inks), `renderLineSvg` (gap band, peak mark,
  trend, no wash, phone gutter, inverted rank), `lineGeometry` (scale overshoot, phone gutter).
- `src/data/figures.ts`: `barsSvg` (solid bars, highlight from title, broken outlier, value weights),
  `smallMultiples` ghosts for peer line sets.
- `src/data/chartSvg.ts`: phone dot strip under maps.
- `src/styles/indica.css`, `almanac.css`: warm ground and neutrals as tokens.
- The reference set and before/after sheets are listed in `docs/DESIGN_REFINEMENT_LOG.md` from row 87.

## The reference pass (October 2026)

Implemented in the renderers, never per chart; 19 reference charts were screenshotted before and after at 412 and
1440 px, covering every family:

| Family | Reference chart | Article |
|---|---|---|
| Single line, peak | FDI equalled 3.1% of Indian fixed investment in 2025 | did-foreign-money-build-india |
| Single line, rank | From 43rd in the world in 1990 to 11th in 2025 | did-foreign-money-build-india |
| Single line, trend | India's average temperature has climbed about 1°C since the 1940s | are-indias-big-cities-getting-hotter |
| Lines, protagonist and rival | Pakistan's FDI ratio exceeded India's in 23 of 36 years | did-foreign-money-build-india |
| Lines, rival above throughout | Viet Nam's FDI ratio has stayed well above India's | did-foreign-money-build-india |
| Lines, peers to small multiples | The cities where the night stopped cooling | are-indias-big-cities-getting-hotter |
| Lines, fixed inks | At the $4.20 line, rural poverty is still higher | has-india-ended-poverty |
| Bars, outlier and named rows | $547 per Indian, against $2,243 per Chinese | did-foreign-money-build-india |
| Bars, grouped | Who carries more: women, and rural India | dementia-in-india |
| Bars, diverging | Almost every city is warmer, except two neighbours | are-indias-big-cities-getting-hotter |
| Ranked change | Hot nights are rising in almost every city | are-indias-big-cities-getting-hotter |
| Change card | 88 lakh now, 1.69 crore by 2036 | dementia-in-india |
| Share strip | Where India's electricity came from last year | how-does-india-generate-electricity |
| Map and strip | Where dementia is most common | dementia-in-india |
| Stripes | India's warming, one stripe per year since 1817 | are-indias-big-cities-getting-hotter |
| Pyramid | Population pyramid, 2025 | how-many-people-live-in-india |
| Parade | The spending ladder, rung by rung | how-unequal-is-india |
| Heat strip | One country, two fertility histories | why-indian-states-have-different-birth-rates |
| Scatter | Richer states, fewer children | why-indian-states-have-different-birth-rates |

The rules apply site-wide wherever their conditions hold (about 230 figures changed their inks or form). The share strip,
parade, heat strip, stripes and scatter changed only with the paper and neutrals: they already followed the direction.

## Rollout, next

1. Rewrite the 36 explainers that name line colours (19 in how-does-india-work), so those charts can take story inks.
2. Replace the four 38-panel own-scale grids on are-indias-big-cities-getting-hotter with one heat strip of cities by
   year, coloured by change from each city's first decade, sorted by warming.
3. Use the Almanac forms by rule: two survey rounds of many units become dumbbells; two years of a handful of units
   become slopes; composition over time becomes stacked areas (GVA by sector, generation mix).
4. Extend the trend rule beyond climate where a title claims a trend over noisy annual data, and the peak rule to
   lines whose title names a year.
5. Editorial notes per chart (an event on the line: 1991, 2008, 2020) as a registry field, for the charts where the
   event is the point.
6. Share strips: direct labels with leader ticks above the strip instead of a swatch key.
