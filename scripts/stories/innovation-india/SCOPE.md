# How innovative is India? Scope (draft, 20 October 2026)

Status (20 October 2026): built, not committed. 18 charts, 98 claims recomputed by verify_claims.py with 0 failures,
adversarial review applied, focused and site-wide validators clean, build passes. Awaiting editor read.

Decisions: headline question "How innovative is India?" (no "really": the article should not
read as a debunk). State the government's "top 25" GII target and the Economic Survey's
unsupported "66th in 2019" plainly, as sourced facts, in Part one. About 19 charts: no hard cap,
but every chart must answer a question the others do not.

## Reader question and provisional answer

Question: How innovative is India?

Provisional answer, to be tested: for its income, India does far better than expected on the
Global Innovation Index (38th of 139; a WIPO "overperformer" for 16 straight editions, 2011-2026),
and its outputs rank (25th) well ahead of its inputs (49th). But the score leans on scale and
markets (1st on ICT services exports, 3rd on market size, 4th on late-stage VC deals) and is thin
per person (researchers 83rd, knowledge-intensive jobs 98th). Part of the rise from 81st (2015)
to 38th reflects framework and sample changes, which WIPO says make ranks "not directly
comparable" across years, and part of the recent patent surge comes from university filings.

What the data cannot answer: grassroots and process innovation (the GII barely sees them),
whether patents are valuable, any state-level GII (none exists), and a like-for-like rank
history (WIPO never back-calculated one).

## Sources (independent of one another where marked)

- WIPO GII databases 2022-2026 (xlsx, CC BY 4.0): `data/raw/wipo-gii/database/`
- WIPO GII reports 2008-2021 (India rank, CI, sub-indices, framework notes):
  `data/raw/wipo-gii/history/` with `README-findings.json` (page-level evidence, sha256)
- GII 2026 report PDF (CI table, overperformers, clusters Appendix IV, Appendix I caveats):
  `data/raw/wipo-gii/report/`
- Independent: IP India annual reports (patent filings by state and applicant type)
- Independent: DST/NSTMIS R&D Statistics 2025-26 (GERD % GDP to 2023-24; series break 2021-22)
- Independent: World Bank WDI / UNESCO UIS (researchers, ICT services exports) for peers
- Context only: DPIIT startup recognitions (registration, not innovation); NITI India Innovation
  Index 2021 (no later edition; editions not comparable)

## Known traps

- Pre-2011 editions use a 1-7 scale and a different model; exclude from the rank chart.
- "66th in 2019" (Economic Survey 2025-26 via PIB) does not match the official 2019 rank (52nd).
- Cluster ranks changed method in 2023 (data years) and 2025 (VC deals added); 2026 only.
- IP India "Educational Institutions" category shows 0 before 2021-22: classification break.
- IP India state = applicant's state, not inventor's; per-capita needs population projections.
- DST GERD jumps ~53% in rupees 2020-21 to 2021-22: a survey-round break (new census survey with BRSR/CMIE
  coverage, private HEIs added, HE no longer extrapolated; back years not revised), plus a GDP-base switch at
  2022-23. Evidence and pages: `data/audits/innovation-india/peer_series_notes.md`.
- India's R&D inputs in GII 2026 are 2020 data (flagged OUTDATED), though DST has 2023-24.

## Literature to cite (verified by the literature pass, see SCOPE notes in session)

WIPO GII 2026 Appendix I and II (JRC audit); Doshi, Kelley & Simmons (2019) "The Power of
Ranking" (IO); Ravallion (2012) "Mashup Indices of Development"; Cirera & Maloney (2017)
"The Innovation Paradox"; Griliches (1990) on patent statistics; Bloom et al. (2013) "Does
Management Matter? Evidence from India"; Saxenian (2001) on Bangalore; Goldberg et al. (2010)
on imported inputs and new products in India.

## Chart plan (draft order)

Part one, the number everyone quotes
1. India's GII rank 2011-2026 with 90% interval, field size, method breaks (lead)
2. Input vs output rank 2011-2026 (paired with 1)
3. India and its table neighbours in 2026, with intervals (intervalPlot)

Part two, inside the 38th
4. India's rank on all 79 indicators (beeswarm, extremes labelled)
5. What the score is made of: pillar gaps vs the median economy (waterfall)
6. Seven pillars, 2022 vs 2026 (dumbbell)
7. Same measure, two denominators: totals vs per person (dumbbell)
8. Score vs income, 139 economies (scatterFit)
9. How old is the data behind India's score (tileGrid by data year)

Part three, checking the score against the raw numbers
10. R&D % GDP and researchers per million, India vs peers (link the R&D article)
11. Indian patent filings by applicant type (classification break marked)
12. Do Indian patents go abroad: PCT per resident filing, peers
13. ICT services exports

Part four, where in India
14. Four clusters: patents, papers, VC deals, per-person intensity
15. Top-100 clusters, size vs intensity (scatter, India highlighted)
16. Patent filings per million by state, universities vs others (2024-25)

Part five, beside its peers
17. Peer rank change 2022-2026 (rankSlope)
18. India, China, Vietnam pillar profiles (parade)
