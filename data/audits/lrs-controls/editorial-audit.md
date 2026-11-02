# LRS audit, 30 October 2026

## Decision

The source-confirmation hold is cleared. A separate direct RBI retrieval reproduced every frozen monthly and annual export row, and fresh CAS queries confirmed the original external-sector responses. The disclosed annual-headline conflict remains bounded by the source-authority rule below. The Rs 50 lakh proposal remains press reporting; no official implementing notification was established.

## Corrections implemented

- Report 19 contains 222 distinct date strings but **221 calendar months**. Six category records dated 30 May 2009 repeat the 31 May records exactly. The loader now accepts identical duplicates and rejects conflicts.
- Three early donation cells are blank. Those monthly family/gifts composites are omitted instead of presenting missing donations as measured zero.
- Education travel and combined education begin in March 2026. The old series falsely joined tuition-only values before March to the broader measure afterwards. May 2026 combined education also had a USD0.01 million error from rounding the components before addition; raw values are now added first.
- The travel chart's data are now six monthly rows with five numeric columns, preserving all 30 source values for the grouped-table renderer.
- USD155.31bn inward transfers and USD143.52bn net transfers include official transfers. They were falsely described as private transfers/household remittances. Labels and prose now identify total transfers. Private transfer credit and net in the raw FY26 BoP are USD155.1205bn and USD144.7943bn respectively.
- FY26 banking capital is **positive USD6.4273bn**, not an outflow. Removed the false causal explanation of the overall deficit. Net FPI and FDI are now differentiated.
- Report 752 FY2008-09 total is USD124.6m; corresponding monthly sum is USD808.1m. The claim that all annual cells matched to the cent was false. Independent comparison covers 183 annual cells; 182 agree within USD0.005m and this one conflicts. Article consistently uses monthly observations and discloses this conflict.
- Ceiling first reached USD250,000 effective 26 May 2015; circular followed 1 June. It was not a restoration to an earlier USD250,000 ceiling.
- TCS line starts October 2020; earlier zero points falsely represented the absence of TCS as a zero threshold. Rs50 lakh proposal line is explicitly a contextual benchmark, not historical policy.
- Removed unproved claims of household portfolio substitution, tax causation, permanent family-flow changes, PAN splitting, precise cap savings, holiday/card composition, education reclassification causing the entire fall, student-count inference, and gold valuation explaining the whole reserve increase.
- Expanded first-use institutional abbreviations; cut repeated conclusions and machine-level dataset names from explanatory prose.

## Independent source-cell check

`scripts/stories/lrs-controls/audit_independent.py` does not import the builder. It reads original CSVs and records one-based CSV row coordinates, the operation and comparison for **1,591 numeric artifact cells** across all 26 artifacts. Zero mismatches after corrections. It also records all 183 annual-source comparisons and six duplicate records. Raw source hashes are embedded in `independent-cell-audit.json`.

The builder's previous `lrs-source-audit.json` checked only one annual total and supplied precomputed summary statistics. The old verifier tested selected literal phrases against those generated summaries and artifacts. Its success was not an independent audit and did not cover all prose, notes or chart fields.

## Missing lenses evaluated

- **NRI deposit composition:** frozen `NRI_DEPOSITS_IN_OUT_RN` covers monthly net flows through July 2026. Summing April2025-March2026 gives FCNR(B) USD0.946487bn, NRE USD7.940852bn, NRO USD5.525931bn, total USD14.413270bn. This reconciles closely with annual BoP non-resident deposits USD14.41262bn, a roughly USD0.00065bn vintage difference. This is a useful distinct financing lens, but is not an offsetting remittance from the same households. Recommend a net capital-account contribution chart before another gross-flow scale comparison.
- **FDI/FPI/other capital decomposition:** the frozen FY26 BoP already contains net FDI +USD6.947431bn, FPI -USD16.36326bn, banking capital +USD6.427318bn, loans +USD27.41912bn, other capital -USD22.45195bn and rupee debt service -USD0.070283bn. A contribution waterfall would explain the thin capital balance better than assuming all channels collapsed. The component statements now improve the prose; a chart should be included only after exact component-to-total reconciliation and rendered review.
- **SIP comparison:** inspected `warehouse_publications` in the actual Data bank SQLite catalog rather than trusting the obsolete `data/rbi_dbie` path. The latest `amfi_industry_flows` parquet exposes fund subscriptions, redemptions, net flows and AUM, **not a SIP-only field**. No dataset named SIP is catalogued. Do not relabel gross subscriptions or net equity flows as household SIP contributions. Any SIP comparison needs another frozen original source and matched dates/conversion rates.
- **Invisibles detail:** the frozen annual BoP has aggregate travel credit/debit, not business/personal/education BoP splits. The source-native Webi warehouse inventory includes quarterly BoP reports 141/143, whose vintage/definitions would require a fresh ingest. Do not present the LRS split as a decomposition of all BoP travel.
- **Monthly volatility:** full monthly level chart and fiscal calendar already expose timing. An extra volatility/rolling line would mostly repeat them. The seasonal average includes unequal sample counts and 2023 deadline spikes; those limitations now appear in prose and explainer.

## Numeric occurrence review

`numeric-occurrence-review.json` inventories all 287 numeric occurrences in prose, all explainer fields, notes, caveats, registry chart titles/subtitles/hints, question title and key numbers. Each occurrence pins its full field context by SHA-256 and offset; edits invalidate review. Measurement entries name raw-source metrics or independently audited artifact coordinates, including CSV rows and operations, and the verifier recomputes those metrics. Period/report identifiers and policy dates were read against source coverage and `policy-evidence.json`. Each measurement occurrence names one intended metric. Numerical equality elsewhere is not treated as proof of the sentence's meaning. The complete fields were read as part of the editorial review. There are zero uncovered occurrences at the frozen text.

The primary 2020 introduction is confirmed in the frozen Lok Sabha Ministry of Finance answer of 4 August 2025, page 1. The frozen Finance Acts 2025 and 2026 establish the threshold/loan exemption and section 394 education/medical rate change. The final TCS comparison window spans these changes and is no longer described as one uniform tax regime.

## Local gates run

- independent-cell audit: 1,591 numeric cells, zero mismatches; 183 annual comparisons, one disclosed raw-source conflict.
- focused artifact validator: 26 artifacts, zero errors, zero warnings.
- focused explanation validator: one explanation, zero errors, zero warnings.
- explanation assembly: 6 sections, 9 charts, all planned titles bound exactly once.

Build, browser review, shared source-link checks and rendered bindings are owned by the coordinating audit. No publication or commit was performed here.

- Numeric verifier: 287 context-locked occurrences, zero coverage failures; exact changed fields require review.

## Adversarial verifier probes

All three controlled mutation probes fail as required: changing a raw-derived metric value, changing the first published LRS measurement, and changing a raw-manifest hash. Each file was restored in `finally`; the clean verifier was rerun afterwards and passed. Results: `verifier-mutation-probes.json`.

## Source-confirmation follow-up

The earlier browser probe stopped at the DBIE portal. The Data bank repository already supplied a public guest-session Web Intelligence client, which opens a valid guest session, refreshes the report and exports its data-provider flow. That route recovered Report 19 and Report 752 directly from RBI. The live monthly export contains all 14,514 frozen rows and the annual export all 2,928 frozen rows. Both are equal as full row multisets, including multiplicity; only ordering differs. Provider metadata declares complete exports and matching row counts.

Seven original CAS response payloads were recovered from the warehouse's content-addressed raw store and replayed directly against RBI. Every original response row is present unchanged. Two live responses add four rows each; these additions remain outside the frozen article vintage. An independent decoder also reconciles all 18,273 observations in the warehouse-derived story CSV to the original RBI payload, using source artifact, dimension codes, date and value. This closes the missing upstream-provenance link rather than merely checking the derived CSV again.

The new raw bundle, `data/raw/rbi-dbie-lrs-confirmation-20261030/manifest.json`, preserves original and fresh payloads losslessly, provider receipts, replayable requests, hashes and source-client code hashes. No session authorization is stored. `refresh_live_sources.py` repeats the guest-session acquisition into a new directory; `verify_live_sources.py` independently verifies the saved evidence offline and is now a required step of `verify_claims.py`. Four adversarial probes reject a changed live value, an extra duplicate Webi row, a conflicting additional CAS key and a bad manifest hash.

The historical annual cell was not introduced by Indica's parser: the fresh annual export repeats it. Its FY2008-09 headline of USD124.6 million equals March alone, whereas its six reported purpose components and twelve monthly headline observations independently sum to USD808.1 million. The evidence supports excluding that annual headline as an authority; it does not prove the precise upstream aggregation bug. No raw value is rewritten. All annual headline-versus-purpose cross-footings are retained in `live-source-confirmation.json`, including smaller differences in other years, rather than forcing components to match headlines.

The source and numeric gates now pass with the same frozen raw sources; the focused article now has 1,591 artifact cells and 287 numeric occurrences. The article's calculation basis and data values are unchanged. Only the methodology's source confirmation and review date were updated.


## Remitter-focused revision

The final article keeps one compact macro scale check and nine charts. The long current-account/capital-financing explanation, net-capital contribution chart, gross/net/reserve-stock comparison and repeated BoP trends are removed from the reader's sequence. The detailed observations above document research, not instructions to add more macro charts. The page's central question is what LRS is used for and what tighter rules mean for a remitter.

Three new artifacts add distinct cuts rather than repeating levels:

- The compact FY2025-26 comparison uses USD28.98bn gross LRS outflows, USD37.33bn gross outward FDI debit and USD155.12bn gross inward **private** transfers. The private-series key is `CURR_INVIS_TRA_PRV`, credit, USD. All are gross annual flows; different coverage and possible overlap rule out treating these bars as an additive financing identity. The reserve stock is excluded.
- A signed six-group contribution table reconciles the April-August 2025 to April-August 2026 headline increase of about USD538m: capital transfers add about USD1.03bn while the remaining purposes fall about USD491m. Travel and studies are grouped across the March 2026 reporting break; no subcategory is counted twice. Values are summed from raw USD observations before rounding to USD million.
- The annual calendar divides each month by its own channel's full financial-year total, then averages the four complete fiscal years FY2022-23 to FY2025-26 equally. March averages 17.01% of capital transfers, August 13.90% of the direct studies line. This is an average annual allocation, not a pooled dollar-weighted distribution. Each channel's twelve displayed shares sums to approximately 100%; 100/12 gives the 8.3% evenly spread benchmark. The partial latest year is excluded. The studies line remains an incomplete education measure after the reporting break.

A simple TCS example states its assumptions: an eligible resident with valid PAN makes a first Rs20 lakh other-purpose LRS remittance in the year, with no earlier remittances using the Rs10 lakh threshold. The standard 20% collection on Rs10 lakh excess is Rs2 lakh, collected upfront and available as tax credit. It is an arithmetic illustration pinned to the enacted general rule, not an observation about remitters or overseas-tour packages.

All rewritten prose, explainers, notes and registry hints/titles were re-read in their full contexts. Every new measurement occurrence has an explicit intended raw/derived metric; unrelated numerically equal values do not authorize a claim. The final inventory contains 287 numeric occurrences. The independent auditor covers all 26 artifacts, including the retained unpublished macro artifacts, with 1,591 numeric cells and zero mismatches. Focused artifact and explanation validators pass with zero errors and zero warnings. The mandatory live-source gate still verifies nine source-response comparisons and all 18,273 CAS CSV observations.


## Chart-kit and checker fixes, 2 November 2026

The phone-width scale flags and the "artboards did not settle" failures recorded after the 31 October redesign came from the checkers, not the page: the site scrolls smoothly (`scroll-behavior: smooth`), so scripted jumps were still animating when the checks measured, and under four parallel pages Chromium throttled the unfocused tabs. `check-chart-type-scale.mjs` and `audit-charts.mjs` now scroll instantly, bring chart-kit cards and any unsettled card into view, launch without background throttling, and `audit-charts.mjs` takes `--jobs`. A real-browser probe confirmed every kit card redraws at its shown width at 360, 768 and 1024 px.

Three real rendering defects were then visible and are fixed in the kit: on phones, long bar labels wrapped instead of running past the frame, and long dumbbell names wrap within the space left of the value columns instead of running under them; on desktop, the dumbbell name column is measured in the weight it is drawn in, so names start at the left edge. A zero tick label may now sit under its gridline when a line lies on the floor. After the fixes this article passes the layout audit at 412 and 1440 px with no findings, the type-scale check at 360, 768, 1024 and 1440 px with none outside the limits, and the rendered-binding audit with no failures.
