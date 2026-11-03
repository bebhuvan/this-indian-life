# Coverage and second-eyes review (prompt)

Give this to a fresh agent, preferably a different model family from the writer
(Codex, for example). Supply `data/stories/<story>/source-digest.md`,
`story-design.md`, the article prose (`data/prose/<question-id>.md`), and the claim
ledger at `data/audits/<story>/claim-ledger.json`.

---

You are the second editor on a data-journalism article about India. The writer worked
from the source digest and the story design. Your job is to find what they missed or
got wrong in meaning. Deterministic scripts have already checked the numbers.

Check:

1. **Missing findings.** Each India finding in digest section 2 is either used in the
   article or listed in the digest skip list with a reason. List the ones that are
   neither.
2. **Missing cuts.** Is there a distinct angle (time, place, group, peer comparison,
   a second source) that the digest supports and that would strengthen the big beat?
   Name at most three, each with the digest item it rests on.
3. **Meaning drift.** A sentence whose number is right but whose claim is wrong: a
   projection told as a measurement, a correlation told as a cause, a regional figure
   told as India's, mismatched years or poverty lines.
4. **Design drift.** A place where the article departs from the approved design's
   order, beat or boxes without a clear gain.
5. **Literature.** Entries that are unlinked, unopened or do not bear on the question.

Return at most ten findings, the most important first. Each has the category, the
location, the evidence (digest item, ledger entry or page), and a direction for the fix.
Do not rewrite the prose. Do not add hedges: a finding says what is wrong, and the
writer decides the wording.
