---
name: indica-story
description: Build or rebuild a This Indian Life article so a lay Indian reader understands it, from reading the whole source through story design, drafting and independent review. Use when starting a new article, rewriting a weak one, or reviewing prose, sequence or coverage. Pairs with indica-evidence-pipeline, which keeps the numbers true.
---

# Indica story

Read `docs/STORYTELLING.md` (the craft) and `docs/ARTICLE_RUBRIC.md` (the bar) first.
`docs/STORY_PLAYBOOK.md` and the `indica-evidence-pipeline` skill keep the numbers
true; this skill makes the article understood. Run both.

Each stage writes one file into `data/stories/<story>/`, and each later stage reads
those files rather than the raw sources. Read the PDF once, and do not repeat that read.

## Stages

1. **Digest the source** → `source-digest.md` (template: `templates/source-digest.md`).
   Convert each report PDF with `liteparse parse <pdf> --format markdown -o
   <stem>.liteparse.md` beside the PDF. A long report can be split by chapter among
   parallel readers on a cheaper model, each writing a part; merge them. Running text
   converts well, but chart values often do not: take figure numbers from a page
   screenshot (`liteparse screenshot`) or the replication data, never from the
   garbled conversion. Add the neighbouring-indicator sweep, and the live debate and
   history around the question (STORYTELLING section 7a), each item sourced and frozen.
2. **Design the story** → `story-design.md` (template: `templates/story-design.md`).
   Strongest model. The big beat, the question ladder, the parts, one chart per beat,
   the boxes, the literature, the term budget and the skip list.
   **Stop here and show the design to the editor.** This is the cheapest point to change
   direction, and the most important one.
3. **Data and charts.** Follow `docs/STORY_PLAYBOOK.md` for anything the design adds:
   ingest, freeze, audit, then the registry `visualPlan` in the design's order.
4. **Draft** → `data/prose/<question-id>.md`. The agent writes the body from the
   design, the locked numbers and `docs/academy/VOICE.md`. The deepseek generator
   is for chart explainers only, not the body. Write box text into `glossaryBlocks`
   and the literature list into `furtherReading` until dedicated components exist.
5. **Review, in parallel, with a fresh context for each reviewer:**
   - `reviewers/cold-reader.md`: reads only the rendered page and scores the rubric.
   - `reviewers/coverage.md`: compares the article with the digest and the ledger.
     A different model family (Codex, for example) works well here because it
     catches different misses.
   Each reviewer returns at most ten findings. **Reviewers flag problems, and only the
   writer edits.** A reviewer must not rewrite or hedge the prose.
6. **Revise once, then gate.** The writer applies the findings. Re-run the evidence gates
   (claim ledger, validators, build, rendered binding check). A second review round
   is for a score still under the bar, not a routine step.

## Cost discipline

- The PDF is read once (stage 1). Later stages read the digest.
- Use cheap models for parallel reading and for the coverage diff. Use the strong
  model for design and drafting, which is where quality is decided.
- Cap each reviewer at ten findings and the process at two review rounds.
- Deterministic scripts check the numbers. Agents check meaning and readability.

## Done means

The design was approved and the rubric score is at least 18/24 with no dimension
below 2. The cold reader passed all four questions. The coverage skip list is
explicit. The evidence gates are green.
