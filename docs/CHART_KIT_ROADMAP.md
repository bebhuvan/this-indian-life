# The chart kit: from good to FT, NYT and Reuters

November 2026. Where the kit stands against the graphics desks we measure ourselves by, and
the order in which to close the gap. `docs/CHART_KIT.md` is the contract; this is the plan.

## What those desks do that we do not yet

Their charts are not prettier because of a palette. Five habits separate them:

1. **One engine, one grammar.** Every FT chart is drawn by one system, so a reader learns
   it once. We have three: the kit, the old Almanac engine (`almanac.ts`, `figures.ts`)
   and the inline line and bar drawing in `ArticleVisuals.astro`, plus the map code in
   `chartSvg.ts`. Each has its own type sizes, label rules and bugs.
2. **The chart is annotated, not labelled.** NYT charts carry two or three sentences on
   the plot itself: the event, the threshold, the outlier, written where it happens. Ours
   mostly name series and stop.
3. **Every chart is checked by a machine and a person.** Reuters Graphics runs layout
   checks on every size before an editor looks. We had a stress test that caught
   exceptions; it now checks overlaps, overflow, size and contrast too.
4. **Range without improvisation.** Small multiples, scatters, maps, distributions and
   tables are first-class forms with the same type and label rules as a line chart.
5. **The numbers in the words match the numbers in the chart.** Titles, decks and
   annotations are checked against the data before publication.

## Where we stand (November 2026)

| | Now | Gap |
|---|---|---|
| Engines | 3 (kit on 2 of 78 articles, 1,009 charts in all) | the kit should draw everything |
| Forms in the kit | 13 | no map, small multiples, scatter, stacked area or bars, distribution, interval, table |
| Annotation | line: events, references, periods, point notes; bars: one reference | none on bars, dumbbells, scatters |
| Checks | scene checker (overlap, overflow, size, contrast) at 91 widths; fingerprints of every sample | no spec validation, no edge-case fixtures, not run in CI |
| Interaction | none in the kit (the old engine has tooltips) | hover values on lines and dots |
| Words against data | by hand | no automatic check |

Line, multi-line and bar charts are 839 of the site's 1,009 charts (83%). The kit already
has those forms. Moving articles onto it is the largest single improvement available.

## The order

**1. Put every article on the kit (weeks 1 to 3).** Widen `toKitSpec` until it translates
every `line`, `multiLine` and bar-family plan (range bands, categorical axes, log scales),
then move articles over in batches by domain: stress test, fingerprints, `audit-charts.mjs`
and a read of each page per batch. Report per article what is still on the old engine.

**2. Annotation everywhere (weeks 2 to 4).** Lift the line chart's placement into a shared
`annotate.ts` (candidate positions, leaders, the under-axis key as the fallback) and give
bars, columns, dumbbells and the new forms `references`, `notes` and `highlight`. Then
write the notes: two or three per lead chart, in the margin voice, each one a fact.

**3. The missing forms (weeks 3 to 8), in order of use on the site:** map (choropleth
with its ranked strip, and the tile map), small multiples (any form, faceted, shared or
free scales), scatter (fit, labelled outliers, sized points), stacked area and stacked
bars, distribution (beeswarm, strip), interval (estimates with ranges), and a table with
inline bars and sparklines. Each arrives with gallery samples, so the checker and the
fingerprints cover it from day one. The old engine is deleted when nothing calls it.

**4. Robustness (alongside).** Validate specs with readable errors at build time (a
missing date, a string where a number belongs, a unit the formatter does not know). Add
edge-case fixtures to the stress run: one point, one row, sixty rows, all zeros, all
negative, a span of six orders of magnitude, a forty-character label, Devanagari. Run the
stress test and the fingerprints in the deploy workflow, as the evidence check already is.

**5. Words against data (alongside).** A check that every number in a chart's title, dek
and notes appears in its data within rounding, run with the explanation validator. A
wrong number in a title is the error readers remember.

**6. Interaction, last and light.** A hover crosshair on lines that reads every series
at a date, and values on dots and bars, from the same Scene, with keyboard focus. Nothing
a reader needs is hidden behind it.

## What stays

The signature in `CHART_KIT.md`: the double rule, stone not grey, sindoor only for loss,
one display number, the margin voice, dots for estimates, labels above the line, Indian
numbers. Those are what make a chart ours. The work above is about reach and rigour, not
a new look.
