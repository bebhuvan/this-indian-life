# Indica Learning Log

Last updated: 2026-06-01

This log captures product, design, data, and architecture lessons learned while building the first real Indica article pages.

## Product Direction

Indica should be a visual evidence system, not a prose-first publication.

The core user experience should be:

- I see the big number.
- I see the trend.
- I see the structure behind the trend.
- I see what changed.
- I see caveats and sources clearly.
- I can read a short explanation if I need help.
- I can go deeper into a rigorous article if I want.

The article should not feel like a long essay with a few charts attached. It should feel like a data page with strong editorial guidance.

## Prose Model

Each page should support at least three explanation layers:

- Short answer: sober, precise, quick.
- Indian-friendly explainer: more conversational, slightly funny or snarky, but still accurate.
- Long article: rigorous and source-aware, simplified for general readers without sounding generic or AI-written.

The prose should help people interpret charts. It should not replace the charts.

## Chart Density

More charts are good when they answer different questions.

More charts are bad when they repeat the same data point.

For the population page, useful distinct visual questions include:

- What is the latest total?
- How has the total changed over time?
- How much uncertainty is there in projections?
- Is the growth rate slowing?
- How old is the population becoming?
- What is the age structure?
- What does the full age-sex pyramid look like?
- Which 5-year age bands are largest?
- How do male and female totals differ?
- How much was added decade by decade?
- How much was added from first observation to latest?

The "How much changed?" block must show added population and related context, not simply repeat the latest population.

## Chart Legibility

A chart that looks elegant but cannot be read is failing.

Specific lessons:

- Axis labels cannot be too tiny.
- End labels on multi-line charts must not collide.
- Long vertical charts can break page rhythm.
- A pyramid needs data labels or nearby scale cues, otherwise users understand the shape but not the magnitude.
- Dense charts need more horizontal room.
- Small chart cards should not carry too much detail.
- Full-width cards are better for pyramids, multi-line charts, long age-band charts, and change-over-time summaries.

## Chart Harmony

The page needs hierarchy, not just many cards.

What worked:

- One large lead chart.
- Two-column supporting charts.
- Full-width structural charts.
- A distinct decade-change panel.
- Pull-quote between the visual stack and prose.

What still needs refinement:

- Repeated chart captions can become noise.
- Too many identical boxes create monotony.
- Section headings may help group evidence into `Scale`, `Structure`, `Age`, and `Change`.
- Some charts need to be visually richer, while others should stay quiet.

## Pull-Quotes

Pull-quotes should not be narrow clamped text blocks.

The desired behavior:

- Use the quote as a visual rhythm break.
- Let the key number sit beside the sentence.
- Let the sentence flow horizontally across the available width.
- Avoid poster-like centered blocks unless the quote is genuinely the page's main moment.

## Short Answer And Maccha Block

The two prose cards work conceptually:

- Left: standard answer.
- Right: "What does it mean, maccha?"

Important design detail:

- The dark maccha card should feel deliberate, not like a random ad block.
- Grey grid backgrounds should only show as dividers, not as thick accidental bands.
- Do not let layout padding expose grid background.

## Source Attribution

Clear source attribution is essential.

Best practice for Indica:

- Show source on every chart.
- Use source name plus indicator ID.
- Link to the original source when a reliable source URL exists.
- Include source metadata in downloaded CSV files.
- Keep chart data local and reproducible.
- Make it obvious when data is a projection, estimate, survey, model output, or administrative count.

This is both ethical and practical. It builds trust and makes the project easier to open source later.

## Downloads And Sharing

Charts should be downloadable and shareable where possible.

Current direction:

- CSV download for all chart types.
- SVG download for SVG-rendered line charts.
- Share button copies or invokes native sharing with a chart anchor.

Future improvement:

- Add PNG export for charts.
- Add clean social cards for individual charts.
- Add stable chart IDs based on question and indicator, not only index.

## Data Architecture

The data pipeline should protect against contamination.

Principles:

- Keep raw fetched artifacts separate from transformed artifacts.
- Store source metadata with every artifact.
- Avoid silent unit conversions.
- Track whether values are observed, estimated, projected, or modeled.
- Keep transformations deterministic.
- Prefer source-specific adapters over ad hoc one-off scripts.
- Keep adapter outputs normalized into common schemas.
- Make derived values traceable back to source rows.

## Adapter Lessons

The site will need both API adapters and non-API adapters.

Likely adapter categories:

- JSON/REST APIs.
- OData APIs.
- CSV downloads.
- SDMX-like data APIs.
- Static file mirrors.
- HTML catalogue scrapers only when the source is reputable and stable enough.

For sources like NDAP that may not expose a clean public API, build an adapter only after confirming that the underlying data endpoints are stable and allowed to use.

## Dataset Scope

The V1 dataset set is sufficient to start building real pages.

Good V1 source families:

- World Bank for standard development indicators.
- UN Population for demographic projections and age-sex structures.
- WHO GHO for health indicators.
- Ember for energy and electricity.
- Our World in Data for climate and cross-country context.
- WAQI for air-quality snapshots.
- IndiaDataHub for Indian economic and financial datasets.
- RBI, MoSPI, Ministry of Finance as core Indian official sources.

Additional high-value sources can be added later, but V1 should first prove:

- fetching,
- normalization,
- traceability,
- charting,
- explanation generation,
- static performance.

## Performance And Hosting

Because the site may get sudden traffic, the default architecture should be static-first.

Current direction:

- Build pages statically with Astro.
- Fetch data offline or through scheduled jobs.
- Store artifacts locally or in object storage.
- Avoid live API calls from user page loads.
- Generate chart-ready data during build.
- Keep client JavaScript minimal.

This is compatible with free-tier hosting and sudden traffic spikes.

## Design System Lessons

Use the built design system, but do not treat the old mocks as binding.

Important current rules:

- Use the design system's typography and restraint.
- Keep the editorial feeling.
- Make charts much more legible than the mock versions.
- Avoid decorative visual filler.
- Add visual richness through data, not ornament.
- Do not let cards nest inside cards.
- Keep source/caveat UI quiet but visible.

## Open Questions

- Should chart captions appear on every chart or only important charts?
- Should article pages have chart-section headings?
- Should the first screen include a tiny visual preview before the full chart stack?
- Should "The point" quote come before or after all charts?
- Should population pages prioritize age structure before projection scenarios?
- Should every chart have a one-click permalink?
- Should chart exports include a small attribution footer inside SVG/PNG?

## Current Design Preference From Iteration

The preferred direction is:

- More visual data elements.
- More chart variety.
- Stronger labels and readable numbers.
- Less repeated endpoint-only views.
- Clearer source attribution.
- A few high-quality text explainer boxes between chart clusters.
- Pull-quotes for genuinely important takeaways.
- Keep the prose, but make the data the star.

