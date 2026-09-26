---
name: indica-evidence-pipeline
description: Run Indica's source-to-publication evidence workflow for data articles, including raw-file provenance, cell-level reconciliation, claim grounding, charts and publication gates. Use for article ingestion, audits or release preparation; not for prose-only edits.
---

# Indica evidence pipeline

Read `AGENTS.md` and `docs/STORY_PLAYBOOK.md`. Follow the story's current status;
resume from the first incomplete stage. Keep the skill small: the playbook is the
single detailed workflow, and article-specific rules belong in that article's
source manifest or audit script.

The non-negotiable output is a trace from each published claim to source rows,
cells or report pages. Preserve original files and hashes. Recompute generated
artifacts from them; compare every observation, not a sample. Distinguish a
correct calculation from a justified interpretation. For example, a ratio of
FDI flow to capital formation does not identify which assets FDI financed.
Before transforming data, choose and record the operation, denominator, time
basis and treatment of missing or negative values. The playbook holds the
specific calculation and chart checks; do not duplicate them here.

Use cheap agents for independent defect discovery when useful. Give each a bounded
question and source access. Verify their findings against raw files and run an
adversarial pass on their conclusions. A model's agreement is never a publication
gate.

End with a short release record: source vintage and hashes, checked cell count,
claim ledger status, focused validators, build and rendered-page review, unresolved
items and the publication decision. Hold publication if any material claim or
source cell remains unverified.
