# Flagship audit, 30 October 2026

The audit upgraded `q.econ.lrs_controls` and `q.econ.poverty_debate`. The older LRS and poverty explanation files remain byte-for-byte unchanged. No commit or deployment was made.

## Evidence coverage

The independent readers reconcile 2,212 numeric cells across 49 artifacts: 1,591 cells in 26 LRS artifacts and 621 cells in 23 poverty artifacts. The claim gates inventory 1,111 numeric occurrences: 287 for LRS and 824 for poverty. Occurrences retain reviewed context and specific source selectors. Wrong values, source-hash changes and edited claims are rejected by mutation probes.

The original raw manifests contain six LRS files and thirty-one poverty files, including frozen policy and methodology sources. The source-confirmation follow-up adds twenty-five lossless response, receipt and query files in a separate manifest. All manifest hashes match. This is reconciliation to the supplied primary tables, processed replication files and official API payloads. It is not independent re-estimation from restricted household microdata.

Detailed findings and source coordinates live in:

- [LRS editorial audit](../data/audits/lrs-controls/editorial-audit.md), [cell audit](../data/audits/lrs-controls/independent-cell-audit.json), and [claim ledger](../data/audits/lrs-controls/claim-ledger.json).
- [Poverty editorial audit](../data/audits/poverty-debate/editorial-audit.md), [cell audit](../data/audits/poverty-debate/independent-cell-audit.json), and [claim ledger](../data/audits/poverty-debate/claim-ledger.json).
- [Combined release record](../data/audits/flagship-2026-10-30-release.json) for final gate and browser results.

## Material changes

LRS now distinguishes total transfers from household remittances, positive banking inflows from portfolio outflows, flow-to-stock comparisons from reserve depletion, and reported proposals from enacted rules. Its source covers 221 calendar months after identical duplicate records are handled explicitly. New education components begin only when observable. Policy history includes the first USD250,000 ceiling and the later TCS changes through April 2026. The focused revision removes the extended BoP, capital-account and reserve comparisons from the article. One same-year gross-flow comparison supplies scale. A complete matched-period purpose bridge explains the recent increase; a normalized seasonal chart gives each complete fiscal year equal weight. The article now has nine charts and centres the remitter, permitted uses and tax rules.

Poverty corrections include the Societal Poverty Line's 1.30-dollar intercept, historical Prosperity Gaps, survey-year PPP headcounts, state values and rupee illustrations. Unverifiable welfare-fractile estimates were replaced with published MoSPI sector averages. A new chart measures poverty depth among people below each line. Survey observations, calendar-year lineups, projections and the different jobs thresholds are kept distinct. The omitted-data review inventories seventy package data files and explains why regional climate and global jobs-decomposition outputs cannot be presented as Indian state or country findings.

The poverty follow-up adds decile consumption growth and replaces three existing views with a hypothetical consumption-loss comparison, child-versus-all-age state estimates and an Asian peer comparison at three poverty lines. Its fifteen charts answer distinct questions. The unchanged Fall 2026 SPID workbook is frozen and hash-matched to the official download; age groups are compared within that source, without splicing calendar-lineup state estimates.

Charts no longer mix rupees, hours, multiples, percentages and percentage-point changes on one scale. The empty monthly travel area was replaced with monthly grouped rows. Shared renderer fixes cover unit formatting, valid two-row comparisons, wrapped labels and keys, crowded grouped layouts, fixed rural/urban inks, measured gutters and complete row retention in long mobile dumbbells. Rendered card counts and section bindings are checked against every planned chart. Layout measurements wait for lazy artboards to load.

## Final verification

All six focused claim, artifact and explanation gates pass. Both explanation validators report zero warnings. The final `npm run build` passes with 112 pages and 6,218 chart artboards. All 24 new charts render and bind to their intended sections.

The current rendered-page review checks all 24 charts at 412 and 1440 pixels and verifies their exact section bindings. A fresh shared-renderer regression checks 84 figures per width: the 24 new charts, 42 charts in the older articles and 18 library examples. It reports zero overlaps, clipping, undersized text, label ladders, oversized gutters or layout-rule violations. Both articles also pass scale checks at 360, 768, 1024 and 1440 pixels. Forty-six production-adapter regression drawings cover units, small-percentage precision, percentage-point zero, valid two-row comparisons and complete retention of fourteen-row mobile comparisons. All fourteen selected child-poverty state rows now remain visible on mobile, including Kerala. Temporary screenshots support visual inspection; durable reports pin renderer and built-page hashes.

## Publication limits

One historical source conflict is disclosed: annual Report 752 gives USD124.6 million for FY2008-09 while the monthly export sums to USD808.1 million. The article consistently uses the monthly series. Independently rounded capital-component labels can differ slightly from the rounded net total; reconciliation uses unrounded source values.

The source-link gates pass ten LRS and fourteen poverty links. The initial browser check verified only report routing. A subsequent direct RBI guest-session refresh reproduced every frozen monthly and annual row, and fresh CAS queries confirmed the original external-sector observations. **The LRS source-confirmation hold is cleared.** The dated receipts and mandatory verification are in `data/audits/lrs-controls/live-source-confirmation.json`. The reported Rs 50 lakh proposal is explicitly press reporting; no implementing RBI notification was established. The poverty audit remains bounded to available published tables and payloads.

## Production release

Publication was authorized on 30 October 2026. The release contains both new articles, their complete evidence bundles and the reviewed shared chart fixes. All six indexed story bundles pass the deployment evidence check. A clean checkout build precedes the main-branch push; GitHub Actions deploys that revision to Cloudflare. Git history, the Actions run and article evidence links identify the publish commit. Unrelated local work is excluded.
