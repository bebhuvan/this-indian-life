# Poverty report deep dive: audited scope

Question: what does the World Bank's 2026 report show about India, and which conclusions depend on the poverty line, survey design or modelling assumptions?

This story is separate from the older `q.econ.poverty` article. Its reproducibility bundle uses the frozen September 2026 PIP releases and 2026 report tables, supplemented by independent MoSPI HCES publication, the Tinbergen survey-comparability paper and NFHS-5 results reproduced in a parliamentary answer. World Bank PIP and the report are related evidence, not two independent sources.

The narrative has four acts and fourteen distinct visual questions:

1. National poverty at three fixed lines, with survey-year societal poverty shown separately within the same chart.
2. The compressed consumption ladder, using representative bins rather than exact individual percentiles.
3. Average shortfall among poor people, which measures depth rather than headcount.
4. State Prosperity Gaps, averaging individual welfare ratios.
5. State headcounts at three thresholds.
6. PPP-vintage revisions with release and survey year held fixed.
7. Selected survey-comparability models and poverty lines, without treating their range as a confidence interval.
8. Published rural and urban average spending with and without free-welfare imputation.
9. Indexed survey versus National Accounts consumption growth, without a single-cause attribution.
10. Employment and workers' education by household poverty group over time.
11. Weekly hours among employed people, using the separate extreme-poverty threshold.
12. The report's combined jobs accounting counterfactual, explicitly distinguished from a forecast or policy effect.
13. Monetary versus multidimensional deprivation, nutrition and medical hardship, with populations and vintages stated.
14. India's share of global poverty, with the separately dated Prosperity Gap and population shares labelled.

The fractile-level welfare-imputation chart was removed. It depended on a legacy calibrated derived artifact and microdata absent from the frozen story bundle. The replacement uses published MoSPI sector averages, whose source PDF is now frozen. It does not claim a transfer effect for the poorest households.

The original package contains four chapters, not five. Its regional climate workbooks cannot produce an India state-level poverty/hazard overlay. Rural/urban chapter-one outputs are global aggregates, not India estimates. Several jobs-decomposition outputs lack country identifiers or give only global results, so they cannot identify India's education-versus-sector contribution to the combined simulation. These exclusions are documented in the editorial audit and package inventory.

The independent source auditor reconciles every numeric row, observation and region value in the nineteen story artifacts. The claim checker inventories numeric occurrences across prose, all explainer fields, notes and registry text, requiring an occurrence-specific source selector and an unchanged reviewed context. Re-review changed claims explicitly; never regenerate review records simply to make a failed check pass.

November 2026 merge: the older poverty work was folded into this story without changing the older `q.econ.poverty` article. It adds the October 2026 India brief (its separate projection, rural-urban split, comparability note and MPM headline), India's poverty-line history, the published positions in the measurement debate, wage evidence and the "fourth most equal" claim, and marks PIP comparability breaks on the two charts that cross them. Sources for these additions are frozen in `data/raw/poverty-debate-followup-2026-11/` by `freeze_followup.py`; see the editorial audit's merged-layers section.
