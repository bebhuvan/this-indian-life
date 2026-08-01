# Handoff: q.climate.el_nino_2026

Paste the block below into a new session. Everything it references is on disk.

---

I'm continuing work on a data-journalism article in this repo (Indica / "This Indian Life").
Read `CLAUDE.md` first, then `docs/el-nino-2026-canonical-brief.md`, which is the full build
brief and method trail for this article.

## STATUS: BUILT, VERIFIED, DELIBERATELY NOT PUBLISHED

**Do not publish this as-is.** It is finished and correct, and it is being held on purpose.

The article's spine is "this El Nino has not escalated yet, and here is the base rate from
where we stand". That rests on the published AMJ 2026 ONI of **0.98, which CPC labels
weak**, and on RONI at 0.47, neutral. Both were current as of 1 August 2026.

But the ocean is escalating fast, and the next data release will very likely contradict the
framing:

| | Nino 3.4 anomaly |
|---|---|
| June 2026 weekly mean | +1.57 |
| **July 2026 weekly mean (all four weeks)** | **+2.00** |
| Published AMJ ONI | 0.98 (weak) |
| **MJJ, essentially locked by observed data** | **~1.45** |
| **JJA, if August holds near July** | **~1.8** |

The article's escalation threshold is ONI >= 1.5 in any of MJJ/JJA/JAS/ASO. **MJJ lands a
whisker under it; JJA crosses it comfortably unless the Pacific cools sharply.** CPC updates
the ONI in the first half of each month, so MJJ was due within days of this being written
and JJA in early September.

### The plan when JJA publishes

This makes the article stronger, not obsolete. The escalation-fork chart already told the
reader this was a roughly one-in-three branch and named exactly what to watch, so the piece
converts cleanly from "the fork is pending" to "the fork resolved". Steps:

1. `node scripts/ingest-noaa-enso.mjs` to pull the new seasonal values.
2. `node scripts/derive-enso-escalation-fork.mjs`. It reads `CURRENT_YEAR`'s AMJ reading
   and rebuilds the cohort automatically, and its metadata records the live reading, so it
   does not need editing. **Check the band**: `BAND_LO`/`BAND_HI` are drawn around the AMJ
   value and should stay as they are, because the point of the chart is where the season
   *opened*, not where it ended up.
3. Rewrite two sections in `scripts/repair-el-nino-2026-prose.mjs`: "So which kind of El
   Nino year is this one?" and "What are the odds of that, then?". They currently answer
   "nobody knows yet". They should answer "it escalated, and here is the branch it entered".
   The five escalators and their -12.1% mean are already in the artifact.
4. Update `doc.dataThrough`, the standfirst, `short`, and `macha`, all of which lean on
   "not strong yet".
5. Re-run the repair + finish scripts, rebuild, re-read.

**Do not** delete the escalation-fork chart when this happens. A reader arriving after the
event still needs to know the branch was not preordained, and that eight of thirteen
comparable seasons went the other way. That is the article's whole contribution.

## What exists

Article `q.climate.el_nino_2026`, slug `el-nino-2026-what-it-means-for-india`. Built,
fact-checked and rendering: ~4,800 words, 22 sections, 21 charts, validator clean,
`npm run build` exit 0. Two older El Nino articles (`q.climate.el_nino_india`,
`q.climate.monsoon_2026`) are deliberately left untouched.

**Nothing is committed.** Run `git status` to see the full change set.

## THE THING THAT WAS WRONG, and must not come back

The first build pivoted on this sentence:

> "But forecasters expect 2026 to cross that 1.5°C mark while the monsoon is still running,
> which places it in the harshest of the three groups."

**No forecast was ever in the evidence packet.** 156 locked numbers, zero references to any
forecast product. Meanwhile the article's own data says the AMJ 2026 ONI is **0.98**, which
CPC labels *weak*, and RONI is **0.47**, *neutral*. The piece was selecting its most alarming
reference class (n=7, mean -12.1%) on a claim it could not support, inside an article whose
closing section boasts about carrying no unevidenced 2026 figures. The same premise had also
leaked into the registry primer, two chart explainers and a `visualPlan` watch-note.

It is replaced by the honest, checkable version of the same question, built from the record:

**`scripts/derive-enso-escalation-fork.mjs`** -> `climate.el_nino.escalation_fork` and
`climate.el_nino.escalation_odds`. Thirteen monsoons since 1950 opened with an AMJ ONI in
0.6-1.4, the band around 2026's 0.98. **Five escalated past +1.5 during the monsoon and
averaged -12.1%; the eight that did not averaged +6.8%.** Welch t = -4.41, df = 7.2,
p = 0.003. Escalation rate is 33-43% across every band tested, so it is not an artefact of
where the line was drawn. 1965 and 2023 escalated from *below* the band, so a low reading is
not safety either. The dry branch is partly definitional and the artifact metadata says so.

Two new sections carry it ("So which kind of El Niño year is this one?" and "What are the
odds of that, then?"), and the article's spine is now *the fork, not the forecast*.

`scripts/repair-el-nino-2026-prose.mjs` **fails the build if `forecasters expect` reappears
in the body, or if any explainer card contains forecast-premise language.**

## MUST RUN after any regeneration

```bash
node scripts/generate-explanations.mjs --questions=q.climate.el_nino_2026
node scripts/repair-el-nino-2026-prose.mjs      # <- 20 prose repairs + structural guards
node scripts/finish-el-nino-2026-explanation.mjs # <- source notes, caveats, methodology
```

Both repair scripts are idempotent and exit non-zero on failure. `repair-` documents every
edit and why it was needed; read its header before changing prose by hand.

## Traps that cost real time

**Astro caches JSON data imports.** Editing `data/explanations/en/*.json` or
`data/series/*.json` does NOT appear until the dev server restarts. Check `dist/`, not the
dev server, before concluding anything is broken. Dev also needs a **trailing slash** on
article URLs and lands on whatever port is free (4321-4324).

**`sectionVisualMap` entries must use the key `heading`.** `src/pages/articles/[slug].astro`
builds its map with `Object.fromEntries(entries.map(e => [e.heading, e.visualId]))`. Any
other key name (`sectionHeading`, say) yields a map of `undefined`, and the page **silently**
falls back to a token-overlap heuristic that mis-binds most of the article. Nothing errors.
The charts just quietly sit under the wrong prose. `repair-` now asserts this.

**The page `<h1>` is the registry's `question`, not `article.title`.** Changing the article
title alone leaves the old headline on the page.

## Fixed this pass, beyond the forecast claim

- **A physics claim that was backwards.** The draft said El Nino's Pacific warmth "pumps
  moisture into the Bay of Bengal, feeding the retreating monsoon **and tropical cyclones**."
  The rainfall half is fine. The cyclone half is the opposite of the literature: Girishkumar
  and Ravichandran (2012, JGR Oceans, doi:10.1029/2011JC007417) find Bay of Bengal Oct-Dec
  accumulated cyclone energy **negatively** correlated with Nino3.4, with extreme TCs
  significantly more common under La Nina. El Nino *suppresses* post-monsoon BoB cyclone
  activity. Now stated correctly, with figures from Roose et al. 2022 (npj Clim Atmos Sci
  5:31, Table 2, OND 1979-2020): 1.33 BoB cyclones/yr in El Nino against a 1.83
  climatology (down 27%) and 2.18 in La Nina (up 19%), with the drop concentrated in
  low-latitude genesis (down 58%) and essentially none of it north of 10N. Used as a
  second reason a wetter northeast monsoon is not automatically good news.

  **Three published papers are now cited in `sourceNotes`** and are the article's only
  figures not derived from its own artifacts: Kumar et al. 2006 (central-Pacific
  hypothesis), Girishkumar and Ravichandran 2012 (cyclone energy), Roose et al. 2022
  (cyclone counts by ENSO phase). Kumar et al. and Roose et al. were read in **full text**
  (`tropmet.res.in/awnew/kkumar-award-paper.pdf` and the open-access npj PDF);
  Girishkumar and Ravichandran is paywalled and rests on its abstract plus two
  independent corroborations. Kumar et al. confirms the article's framing almost word for
  word, including "the presence of El Ninos has not guaranteed drought" and the finding
  that the modelled rainfall distributions "are not sharply peaked but involve a
  considerable range of possible outcomes".
- **A markdown bug that shipped.** The "If farming is now just a fraction of the economy"
  heading had no blank line before it, so CommonMark did not parse it and it rendered as
  literal `## If farming...` text glued to the previous paragraph. `repair-` asserts
  `headings - 1 === blank-line-separated headings`.
- **The IOD direction was backwards** in the body, an explainer and a registry watch-note.
  The DMI peaked at +0.53 in Feb 2026 and has fallen every month since (+0.15 in May). It is
  receding, not building.
- **A 0.01°C RONI gap** (1997-98 at 2.38 vs 2014-16 at 2.37) was reported as a rank change.
- **The IOD split was dated "since 1901".** The ENSO/IOD/monsoon join starts in **1950**,
  because the ONI does.
- **"The long-period average is about 88 centimetres."** The series' implied LPA is 868.5mm.
- **"The underlying physics has not shifted"** was asserted with no evidence, inside a
  paragraph about a rolling correlation being a weak instrument.
- **Four consecutive sections** re-explained the same irrigated-vs-rainfed mechanism.
- Two unsourced 2026 in-season claims in `visualPlan` watch/why notes ("2026's June was much
  worse than this composite", "the 2026 sowing figures are sorting the same way in real time").

## Site-wide fixes made here (they affect every article)

- **`whyShowThis` and `mobileNote` rendered nowhere.** Both were computed in `noteFor()` in
  `ArticleVisuals.astro` and emitted by no chart-note block, so two of six authored explainer
  fields were dead site-wide. Now rendered as a full-width "Why this chart" row and a
  mobile-only "On a small screen" row. Their boilerplate fallbacks were **author
  instructions** ("fewer ticks, short labels"), never fit to show a reader, so both now fall
  back to nothing instead.
- **scatterXY axis bounds.** `niceMax` rounds to the next whole number between 1 and 10, so a
  max of 2.21 became 3.0 and the zero floor put all seven strong-event points in the left
  third of the canvas: a chart whose entire argument is "these dots have no slope" read as a
  vertical line. Bounds are now chosen together, off a 1/2/2.5/5 step ladder, and the zero
  floor is dropped when the data's span is smaller than its distance from zero. Checked
  against the other five scatterXY charts on the site; none regressed.
- **scatterXY labelled only highlighted points.** On a 7-point scatter whose prose names
  1965, 1972 and 1997 individually, a reader could not find 1965: it was one of five
  identical grey dots. Small scatters (<=12 points, <=8 on mobile) now label every point,
  with unhighlighted labels set back via `.point-label-muted`.

## Editorial positions that must not be softened

- **The escalation split is the spine.** Lead with the rate (5 of 13), not the branch means,
  because the dry branch is partly circular. Always give the sample size in the same breath.
- **The strong-event base rate** (6 of 7 below normal, mean -12.1%) is n=7 and uses peak ONI
  *during* the monsoon, not the event's calendar peak. Say so every time.
- **The northeast-monsoon "sign flip" is NOT statistically significant** in our record: a 5.8
  point gap against standard deviations of 24.4 and 32.5, Welch p about 0.46. The direction
  matches published work; our data cannot confirm it. The derive recomputes this every run
  and the artifact carries `verdict: NOT SIGNIFICANT`. The article now explicitly contrasts
  it with the escalation split, where the same test *does* separate the groups.
- **The flavour test returned nothing**, and for a specific reason: all seven strong events
  lean eastern-Pacific, so there is no central-Pacific case to contrast against. Report it as
  an honest negative; do not use it to reassure anyone about 2026.
- **RONI does not mean the event is small.** It re-ranks the record (1982-83, not 2015-16, is
  the benchmark).
- **No 2026 in-season figures** (rainfall to date, reservoir storage, sown area) and **no
  forecast**. Do not add estimates of either.

## Pipeline constraints (properties of the shared pipeline, not this article)

- **`buildEvidencePacket` caps locked numbers at ~12 per chart** and iterates every numeric
  column of every row, so wide tables starve. It **strips row labels** unless the row carries
  `category`/`variant`/`series`, and `rowDate` treats any `period`/`year`/`date` key as a
  date, keeping only newest and oldest. **Chart rows must be narrow, carry `category`, and
  avoid date-like keys.**
- **Series artifacts** contribute only earliest+latest as locked numbers. min/max was added in
  `scripts/core/evidence.mjs` after the writer called 1901's -13.8% "the driest year on
  record" (the true minimum is 1972, -22.3%).
- **`deepseek-v4-pro` is a reasoning model**, so reasoning tokens count against `max_tokens`.
  When exhausted it returns **HTTP 200 with empty content**.
- **`tableBars` renders only `label`, `value`, `group`.** Any other column is dropped, so the
  meaning must live in the label.
- Prose-only sections are **not** emitted by the batched path; splice them in and rebuild
  `sectionVisualMap`.

## Known-good state

```
npm run build                # 103 pages, exit 0
npm run explain:v1:validate  # el_nino_2026 clean; 4 failures / 84 warnings are OTHER articles
```

Every number in the body traces to a value present in a series artifact (audited by
extracting all numerics from the prose and diffing against every artifact value).

## Open work, roughly in priority order

1. **Two built-and-validated artifacts are still not charted** because no `viz.ts` builder
   handles them: `climate.enso.nino34_year_trajectories` (45-year spaghetti, 2,325 rows) and
   `climate.enso.oni_vs_roni` (917 rows, two value columns from one table). Front-end work.
2. **Live-context data**, de-risked as feasible but not ingested: CWC reservoir storage (try
   the India-WRIS ArcGIS FeatureServer at `arc.indiawris.gov.in` first), IMD in-season
   rainfall (`rainfallinformation_msd.php`, likely needs selenium, and separate observed from
   forecast), and the OWID ENSO-temperature lag series. **In-season rainfall is now the single
   highest-value addition**: it is early August, the monsoon is half over, and the article
   still cannot say what June and July actually did.
3. **A real forecast artifact.** If IRI/CPC plume data is ingested with a proper `sourceUrl`,
   the escalation section can be extended from "here is the base rate" to "here is the base
   rate, and here is what the models currently say" without reintroducing an unsourced claim.
4. **IITM Pune homogeneous rainfall 1871-present** would extend the base rate to the 1877 and
   1899 famine droughts. Biggest remaining canonical upgrade.
5. **Site-wide**: 349 of 373 source notes across 71 articles have no URL (surfaced as
   validator warnings, deliberately not failures); the domain branches in
   `src/data/questions.ts` short-circuit the smarter chart-takeaway fallback for every
   climate/air/energy article; the philosophy doc's "small multiples by default" rule is
   unimplemented everywhere.

## Useful commands

```bash
npm run build
npm run explain:v1:validate
node scripts/derive-enso-escalation-fork.mjs         # the escalation fork (new)
node scripts/derive-enso-index-family.mjs            # 7 ENSO artifacts
node scripts/derive-northeast-monsoon-enso.mjs       # incl. the significance test
node scripts/derive-el-nino-peak-timing.mjs
node scripts/derive-enso-year-trajectories.mjs
node scripts/ingest-noaa-enso.mjs                    # 5 CPC files, with completeness guards
node scripts/generate-explanations.mjs --questions=q.climate.el_nino_2026 --dry-run
```
