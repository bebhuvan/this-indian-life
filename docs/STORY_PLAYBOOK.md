# Indica story production: source to publication

This is the ordered workflow for a new data article. `AGENTS.md` defines the article
model; the source and chart docs linked there supply the detailed conventions. Keep
article-specific evidence and audit results in the story's own folder.

1. **Question and scope.** Write one reader question, a provisional answer, the
   population and time span, and what the available data cannot answer. Check the
   back catalogue for overlap. List at least two genuinely independent sources
   when the story needs corroboration. A second table from the same report is a
   validation source, not an independent one.
2. **Acquire and freeze.** Put original downloads in `data/raw/<story>/`, unchanged.
   Record source URL, retrieval date, publication vintage, file size and SHA-256 in
   a story manifest. Keep extracted PDF text beside its PDF and label it as a
   reading aid. For every workbook used, record sheet and cell coordinates.
3. **Inventory and clean.** Inspect every sheet, field, unit, geography, date and
   footnote before selecting rows. Write cleaning code under `scripts/stories/<story>/`
   for a new story; legacy scripts may stay at their existing paths. Reject
   unexpected headers, duplicates, missing values or changed vintages explicitly.
   Never edit raw files to make them fit the ingest.
4. **Calculate and reconcile.** Make transformations reproducible. Keep raw units,
   denominator, rounding rule and inclusion rule visible. Compare source rows with
   the generated artifacts cell by cell. Reconcile against another source where
   one exists, explaining definition and vintage differences instead of forcing
   agreement. Save a machine-readable audit result in `data/audits/<story>/`.
   Choose each operation for the question: sum compatible flows over time; never
   sum stocks across years; use a weighted ratio when comparing pooled totals,
   and label an unweighted mean of annual ratios as such. Check calendar versus
   fiscal years, nominal versus real values, currency conversion, revisions,
   population denominators, negative values and missing observations before
   calculating. Never infer a financing share, causal effect or ownership share
   from a ratio that only compares two different aggregates.
5. **Lock the evidence.** Make a claim ledger: every number and factual assertion
   names its exact source row, workbook cell or report page; every interpretation
   names the observation that supports it and what it cannot prove. Unsupported
   claims are removed, qualified or held for reporting. A model output never
   counts as a source.
6. **Plan the visuals.** Each chart gets a distinct question, measure, unit, period,
   source and caveat. Verify indicator binding and the plotted values against the
   artifact. Start axes at zero for bar lengths; label any nonzero line baseline.
   Do not join incompatible vintages or put different units on one scale. Show
   uncertainty or missingness rather than interpolating it without a stated
   method. Cut charts that repeat the same point.
7. **Draft the prose.** Give a model only the locked packet and relevant house
   examples. It may propose wording, structure and missing questions; it may not
   supply new facts. Use `indica-write-clearly` for the reader edit. Check title,
   standfirst, short answer, body, chart cards, methodology and source notes.
8. **Challenge it independently.** Use separate passes for source-to-artifact
   numbers, claim-to-source meaning, omitted source findings and prose. Cheap
   models can search for defects, but a human or deterministic check must verify
   every reported defect and every clean bill of health. Bound each pass to named
   files, one question and a short finding list; stop passes that roam without
   returning a report. Give a second adversarial pass to anything a cheap model
   judged sound.
9. **Run publication gates.** Run focused schema and prose validation, source-to-
   artifact audit, build, rendered section/chart binding, link-content checks and
   desktop/mobile visual review. Record exact commands, output counts and gaps.
   Global repository failures should be reported separately from this story's
   failures; they must not be represented as a clean global build.
10. **Commit and publish.** Proceed only when the story has zero unresolved
    factual claims or cell mismatches and the current rendered artifact has been
    reviewed. Put the raw manifest, artifact catalog and other release paths in
    the claim ledger's `evidenceBundle`. Stage those paths explicitly and run
    `python3 scripts/check-story-evidence-commit.py data/audits/<story>/claim-ledger.json`
    before committing. The article footer must link each original dataset or
    annex workbook used, with its measure and vintage. Record the publish commit.
    If a source cannot be recovered or a claim cannot be checked, remove that
    claim or hold publication. Never promise mathematical certainty from a
    finite audit.

For the FDI article, source files are in `data/raw/unctad-wir/`, its source audit is
`scripts/stories/fdi-development/audit-sources.py`, its explanation source is
`data/prose/q.econ.fdi_development.md`, and its generated page is
`data/explanations/en/q.econ.fdi_development.json`.
