# Data integrity guardrails

The ordered workflow is in [STORY_PLAYBOOK.md](STORY_PLAYBOOK.md). This file restores the guardrail entry point linked from `AGENTS.md`; keep story-specific findings in `data/audits/<story>/`.

- Preserve original source files and verify their manifest hashes before calculating. A local extract is evidence of that extract's contents, not independent confirmation of the upstream release.
- Reconcile every published artifact value to explicit source rows, workbook cells or report pages. An audit must not merely import the builder's calculations or compare generated files with each other.
- Inventory every numerical occurrence across prose, registry, notes and explainers. Matching a number somewhere in a source does not verify its unit, denominator, period or meaning. Record unresolved occurrences and hold release when material claims remain unchecked.
- Preserve missing observations. Reject conflicting duplicate keys; deduplicate identical records only under an explicit rule. Do not invent zeros or extend a newly available component backwards.
- Keep survey years, fiscal years, calendar-year lineups, projections and PPP vintages distinct. Show only comparable units on one graphical scale.
- A descriptive difference does not establish a cause. A simulated policy counterfactual does not establish the effect of an implementable programme. Aggregate flows do not reveal individual motives or behaviour.
- Verify the content and vintage of source links. A portal shell or a successful HTTP response cannot prove that the exact report or dataset is available.
- Run focused data and explanation validators, independent source audits, a build, rendered section bindings and mobile/desktop chart review. Passing validators is necessary; it does not replace source verification.

The October 2026 LRS-controls and poverty-debate audits illustrate these failure classes. Their release records distinguish resolved defects from evidence still needed before publication.
