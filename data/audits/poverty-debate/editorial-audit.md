# Poverty debate: editorial and evidence audit, 30 October 2026

The numerical audit covers twenty-three current artifacts, 621 numeric data cells and thirty-one frozen source-file hashes. The source reader is independent of the builder and does not consume its summary. The current claim ledger inventories 824 numeric occurrences across 402 text surfaces, including all explainer fields, notes, chart titles/subtitles/hints and key numbers. Each occurrence retains a selected source, rather than an unrelated list of matching values. Text hashes lock the reviewed meaning, population, unit and time basis. These checks do not turn modelled survey estimates into exact measurements.

## Material corrections

- The 2021 PPP Societal Poverty Line uses `max(3, 1.30 + 0.5 × median)`. The article's 1.40 and the audit prompt's 1.50 were both wrong. The frozen PIP methodology and national survey rows agree. The 2011 societal line is 3.23, not 3.33.
- Survey Prosperity Gaps are 9.70 in 1993, 7.67 in 2011 and 5.36 in 2022, not 8.40, 6.99 and 5.20. The measure averages individual ratios and is not a uniform multiplier for an average Indian or every resident of a state.
- The frozen API gives 79.98% below the 2021 PPP upper-middle-income line in the 2023 survey, against 79.81% under the old line. Earlier prose said 79.71% and 79.13%. The PIP DTA used here has only the 3-dollar headcount; it does not provide a conflicting 8.30-dollar observation.
- Kerala's atlas headcounts are 5.2% at 4.20 dollars and 60.6% at 8.30 dollars. Tamil Nadu is 64.0% at 8.30 dollars. Earlier prose had 2.7%, 59.3% and 62.6%. The builder already produced the correct source values; the prior verifier failed to cover these prose occurrences.
- Rupee illustrations now use the unrounded national PPP and CPI fields, with human rounding in prose. The 8.30-dollar equivalent is about Rs 187 daily, not Rs 188. A national PPP factor is not replaced by invented rural and urban factors.
- Removed the calibrated, unfrozen fractile welfare reconstruction and its unsupported precision. Published rural MPCE rises from Rs 4,122 to Rs 4,247; urban MPCE rises from Rs 6,996 to Rs 7,078. The denominator for the percentage boost is spending without imputation. Free health services and education-fee waivers are excluded by MoSPI's published method.
- Corrected the EUS-to-PLFS model labels. The 17.5% Tendulkar estimate is a sector model applied within states, not the statewide LASSO model, which gives 18.3%. The survey-method chart changes poverty lines as well as model assumptions and is not a confidence interval or a pure questionnaire effect.
- Removed claims that crossing 3 dollars establishes adequate calories; that the macro-survey gap proves gated-household nonresponse; that the employment comparison establishes a women-or-schooling mechanism; or that the jobs simulation proves an exclusive policy solution. Removed the hospital-bill numerical hypothetical and the stale IHDS-last-survey assertion.
- Health-financing observations are dated 2022. NFHS-5 nutrition is dated 2019-21 and uses children under five. These are not concurrent measurements of the whole population. The unrelated NITI projection was removed from the mixed-source chart.

## Audit of the auditors

The old `poverty-source-audit.json` was an ingest summary. Its presence did not show that published cells were independently reconciled. The prior `verify_claims.py` checked selected long phrases against artifacts or that same summary, omitted several explainer fields and registry surfaces, and did not discover new numeric claims. It could report success while the wrong state, PPP, Prosperity Gap and denominator claims remained in the story.

The replacement `audit_sources.py` reads the frozen CSV, DTA, XLSX, JSON and PDF files. It checks source hashes, unique source selections, time coverage, transformations and every numeric data cell, including duplicated map values. Tinbergen estimates are checked against named table rows and national columns in the frozen PDF. NFHS figures are checked against the parliamentary annex's India row. Schema checks remain separate from numerical reconciliation.

`verify_claims.py` calls that independent auditor, inventories the complete textual surfaces, checks durable-to-built consistency and requires the occurrence-specific source selector recorded in `reviewed-surfaces.json`. The reviewed context check catches an edited interpretation even if the same number exists elsewhere. The ledger separates value provenance from the reviewed interpretation. `test_audit_mutations.py` tests a wrong artifact value, an altered raw hash, an edited textual context, a swapped scenario endpoint, a false peer estimate-type flag and a changed child share in an unplotted state through virtual reads, then restores positive audit reports without changing source files.

## Omitted-data search and chart decisions

`package-inventory.json` inventories seventy data files in the original four-chapter replication package, including workbook sheets, Stata columns and country-labelled India rows. There are zero inventory-read errors after fixing lazy Stata metadata initialization. The large global distribution file is represented by the frozen India extract used for this story; it is not described as new household microdata. The named `all_indicators_main_p21_v15.dta` is absent from this package, so no result is attributed to it.

The added poverty-depth chart uses the same survey, threshold and release for its numerator and denominator: population-average poverty gap divided by headcount. The average shortfalls among those below the respective lines are about 13.2%, 15.9% and 34.1%. It adds intensity to the existing headcount and distribution views. The API inputs are rounded, so the resulting ratios are labelled approximate.

Chapter-three exposure workbooks provide regional and income-group aggregates. They cannot be joined to Indian states as if they were local heat/flood observations. Chapter-one rural/urban figures are also global aggregates. Chapter-four 4.8/4.9 outputs provide global decomposition results, while several gender/sector percentile files omit country identifiers. They do not support an India-specific decomposition of the 22.17-point simulation. These are explicit exclusions, not charts silently left on the table.

The original worker chart mixed hours with percentages and two poverty thresholds. It now plots only weekly hours at the 3-dollar threshold. Job structure remains in the prose, sourced to the separate 8.30-dollar tables. The state headcount chart no longer plots Prosperity Gap ratios beside percentages; the welfare chart no longer plots rupees beside percentage boosts; the counterfactual no longer plots percentage-point reductions as level columns; global shares no longer share an axis with millions of people. MoSPI and Tinbergen artifacts now use their correct source names in the chart footer.

## Gates and limits

The focused artifact validator passes twenty-three artifacts with zero errors and warnings. The focused explanation validator passes with zero failures and zero warnings. Parent-session release records hold the final static-build, rendered heading/chart-binding, source-link and desktop/mobile visual-review results. This record does not substitute a code-level check for that visual inspection.

The source-level claim is reconciliation to the frozen primary published tables and official API payloads. Restricted underlying World Bank household microdata are not available in this package; its processed tables cannot be independently re-estimated all the way from household records. Removed or bounded claims are not counted as verified causal findings. Do not publish a claim of mathematical certainty or unrestricted microdata replication.


## Added layers, 30 October 2026

The published plan now has fifteen visuals. Three replacements make room for distinct questions: the multi-vintage percentile ladder becomes a static consumption-buffer sensitivity; the repeated state three-threshold grid becomes an age comparison within states; and the global-share visual becomes a common-year Asian comparison. Global headcounts and shares remain in prose. A fourth layer adds decile growth beside the measured Gini, before the separate long-run survey/National Accounts comparison. The previous artifacts remain in the reproducibility catalog and are still independently audited, even when no longer charted.

The decile calculation uses PIP national India observations for 2022 and 2023, explicitly in the same `2022 - 2023` comparability spell, consumption welfare and the same PPP basis. Decile means are national mean times decile share divided by 0.1. Growth compares decile averages across repeated cross-sections; the people and survey coverage can differ.

The buffer scenario reduces every 2024 welfare bin by exactly ten percent, preserves its population weight and recomputes headcounts. Baseline and scenario use the same bins and resolve to approximately 0.1 percentage point. This is neither a forecast nor a transition rate. At $4.20 the bin baseline is 14.9%, while the more precise national lineup is 14.88%; the two bases are explicitly distinguished.

The Asian comparison selects India, Bangladesh, Indonesia, Viet Nam and Pakistan at the same three 2021 PPP thresholds in calendar 2024. The source's estimate-type flags are retained and independently checked: Indonesia is actual; the others are projection. The selection is neither exhaustive nor a single income group. Its rates cannot imply surveys conducted simultaneously.

The original SPID workbook is frozen unchanged. The exact official download is byte-identical to the package workbook: 18,419,638 bytes, SHA256 `4a63361863218b1a58be1b116ba0425c52e5fcd2d5acc4d524da57b38f206a51`. The direct HCES rows are labelled year 2023 and reference year 2023.58. Each age comparison uses the same state, source year and welfare line. The plotted fourteen states compare `0-5` with `ALL`, and all ages includes the children. An independent all-thirty-six-state check, including unplotted states, supports the nationwide pattern; its source Excel cells and values are recorded in `independent-cell-audit.json`. No state weights, national child headcounts, adult boundaries or within-household allocations are invented.

The source's `17+` group is deliberately unused because its boundary overlaps the separately printed `12-17` label in the methods paper. The SPID survey rows also differ from GSAP's calendar lineups. The article keeps the Prosperity Gap map on its GSAP basis and clearly labels the separate survey basis of the child comparison, without asserting an unverified cause of the difference.

The expanded independent audit reconciles twenty-three artifacts, 621 numerical data cells and thirty-one frozen-file hashes. It also checks the peer estimate flags and the unplotted SPID child pattern. Selected-source occurrence locks have been renewed for the changed surfaces. Final focused-gate and mutation results are recorded in the machine-readable audit files; parent-session release records supply the rebuilt visual and heading-binding checks.

## Merged layers, 2 November 2026

The older poverty work was merged into this article; the older `q.econ.poverty` article and its data files are unchanged. The additions are prose, two caveats and survey-break marks on two existing charts. No new artifact is charted, so the independent cell audit is unchanged at twenty-three artifacts and 621 cells.

New sources are frozen in `data/raw/poverty-debate-followup-2026-11/` with their own manifest (seventeen files, each with URL, reader page, retrieval date and SHA256). `verify_claims.py` re-hashes them and admits a value only when its supporting phrase is found in the frozen file, read as plain text, as a PDF layout (for the brief's tables) or as full HTML (for pages that keep body text in script blocks). The chapter 1 PDF is the package's `212342_Chapter 01_P7_20261013_1314.pdf`, byte-identical in size to the zip member.

What was added, and its basis:

- The World Bank's October 2026 India brief: its indicative microsimulation projection of $4.20 poverty (14.2% in 2026, 12.1% by 2028), the 2023-24 rural and urban rates, the 57% concentration in the Uttar Pradesh to West Bengal belt, employment and earnings, its MPM headline of 15.5%, and its comparability note. The brief's MPM headline differs from the package's MPM file (17.74%) with the same rounded components; both are reported, neither is preferred.
- The report's nowcast method (GEP June 2026 growth, distribution-neutral, 0.7 pass-through for consumption aggregates) and its removal of the Consumer Pyramids-based estimates for 2015-21, both from chapter 1.
- PIP's `comparable_spell` groups for India, read from the frozen PIP DTA: 1977 | 1983 | 1987 | 1993-2009 | 2011 | 2022-2023. The societal-poverty series in the hero chart and the survey-mean index carry `breaks`; the chart kit draws each comparable run solid, the step across a break as a stone hairline and every survey as a dot, distinct from the dotted line that marks projections.
- India's official poverty-line history (Planning Commission 2013 press note; Rangarajan and Dev, MSE Monograph 30; the 2011 Supreme Court affidavit as reported by Down To Earth; the 2016 NITI task force as quoted by Governance Now) and the leaked 2017-18 survey as reported by The Wire. The leak is cited as reporting, not as a data series.
- The published positions in the measurement debate (Bhalla, Bhasin and Virmani, IMF WP/22/69; NITI Aayog's chief executive as reported by Business Standard; SBI Research; Sinha Roy and van der Weide, PRWP 9994; Drèze and Somanchi), the Labour Bureau wage evidence as computed by Das and Drèze, the Press Information Bureau's "fourth most equal" claim and the Alt News critique, and NITI Aayog's 24.82 crore estimate with its estimated and projected endpoints. These are reported as claims; their lines and transfer treatments differ, and they are not ranked.
- The world ranking by people in 2024 from `Country_FGT` rows for Nigeria, DR Congo, Pakistan and Ethiopia; it matches figures 1.6 and 1B.2 of the report.

Gates: `verify_claims.py` inventories 977 numeric occurrences across 421 reviewed surfaces with zero failures; the sixteen new paragraphs, three new caveats and two changed subtitles each carry a review record with an explicit source selector for every number. The fifty-six unchanged paragraphs keep their original review records, moved to their new positions by text hash. `test_audit_mutations.py` still rejects all six mutations. The explanation validator reports zero failures and warnings, and all twenty-seven source links pass, one through a rendered browser check.


## Chart-kit and checker fixes, 2 November 2026

The phone-width scale flags and the "artboards did not settle" failures recorded after the 31 October redesign came from the checkers, not the page: the site scrolls smoothly (`scroll-behavior: smooth`), so scripted jumps were still animating when the checks measured, and under four parallel pages Chromium throttled the unfocused tabs. `check-chart-type-scale.mjs` and `audit-charts.mjs` now scroll instantly, bring chart-kit cards and any unsettled card into view, launch without background throttling, and `audit-charts.mjs` takes `--jobs`. A real-browser probe confirmed every kit card redraws at its shown width at 360, 768 and 1024 px.

Three real rendering defects were then visible and are fixed in the kit: on phones, long bar labels wrapped instead of running past the frame, and long dumbbell names wrap within the space left of the value columns instead of running under them; on desktop, the dumbbell name column is measured in the weight it is drawn in, so names start at the left edge. A zero tick label may now sit under its gridline when a line lies on the floor. After the fixes this article passes the layout audit at 412 and 1440 px with no findings, the type-scale check at 360, 768, 1024 and 1440 px with none outside the limits, and the rendered-binding audit with no failures.

## Rewrite for the reader, 3 November 2026

The article was rewritten from scratch under the new `indica-story` pipeline
(`docs/STORYTELLING.md`, `docs/ARTICLE_RUBRIC.md`). The editor judged the previous version
correct but unreadable: audit passes had moved method detail into nearly every paragraph.

- **Source read in full.** The 236-page report PDF is now frozen in `data/raw/wb-3pr-2026/`
  with a LiteParse Markdown reading aid; `data/stories/poverty-debate/source-digest.md`
  records every India finding, its page, and a skip list.
- **Design approved before prose.** `data/stories/poverty-debate/story-design.md`: question
  ladder, five parts, five boxes, the live debate and history, and the editor's added
  questions (free grain, Tendulkar line in today's prices, recall periods, income and wealth
  inequality).
- **New evidence.** `data/raw/poverty-debate-rewrite-2026-11/` (PIB free-grain releases,
  World Bank India methodology notes, PIP handbook pages, World Inequality Lab paper, NSS
  reports 591 and 592) and `data/raw/poverty-debate-wages-2026-11/` (RBI DBIE reports 664
  and 155). Twelve new artifacts, including a real wage index from 2014-15 that uses only
  single-base deflators (MOSPI CPI 2012=100), so no linking factors; an earlier CPI-IW
  linked version showed a false 10% factory-wage jump in 2023-24 and was discarded.
- **Prose** is hand-written in `data/prose/q.econ.poverty_debate.md` (about 4,500 words,
  18 sections, 16 charts, 3 quoted source passages). Box text sits in `notes.json` as
  `keyTerm` glossary entries until a dedicated box component exists.
- **Reviews.** A cold reader with no context scored the draft 20/24 (no dimension below 2).
  Codex reviewed coverage against the digest and design. Both reported meaning errors that
  were fixed by the writer: $8.30 had been described as India's peer line (it is the
  upper-middle-income line; India's is $4.20); "higher pay per worker" overstated a
  welfare-per-worker decomposition; the decile gain was certified as wholly real against
  the World Bank's own measurement caveat; the Tendulkar comparison overreached into a
  poverty-rate claim; the macha box claimed most people were "a bad month away" from
  poverty. The report's 2026 estimate against the brief's projection was restored, and three
  readable India findings were added to the digest's skip list.
- **Claim review.** Changed surfaces were re-reviewed with context rules in
  `scripts/stories/poverty-debate/claim_source_rules.json`, which bind each number to its
  intended source row rather than the first value match. Two prose numbers were corrected
  where rounding did not match the source (Kerala 58.5%, monetary poverty 5%).
- **Gates, 3 November.** Independent reconciliation: 36 artifacts, 875 numeric cells, 0
  mismatches, 33 source hashes. Claim inventory: 798 occurrences across 475 surfaces, 0
  failures. Mutation tests: six of six rejected. Explanation validator: 0 failures, 0
  warnings. Source links: 42 checked, 0 failures (rendered with Chromium). Static build:
  113 pages; rendered section-to-chart binding checked in the page.
- **Final pass over the report, 3 November.** Figure pages the Markdown conversion garbled
  were read as page images. Two findings were added: India's and China's shares of the
  global Prosperity Gap, 1990 against 2026 (chapter 2 figure 2.10; `chapter2.xlsx`
  fig10_1990 and fig10_2026), and the income-equivalent Gini adjustment (annex 2B, map 2B.1,
  report pp. 99-100) under which India is still not classed as highly unequal, with figure
  2.1's population shares (`chapter2.xlsx` fig1). Map 2B.1's classification of India is read
  from the map image; the report's text and data file do not give India's adjusted Gini.
  Claim inventory after the pass: 830 occurrences, 477 surfaces, 0 failures.
