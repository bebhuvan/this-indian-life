# Academy entry — generation spec

What one academy entry is, what goes into generating it, and what comes out. This is
the contract the generator (`scripts/academy/generate-entry.mjs`) and DeepSeek work to.

## Inputs

Each entry is generated from a **brief** (`docs/academy/briefs/<slug>.json`) plus an
**evidence source** (an existing `data/explanations/en/*.evidence.json` packet, reused
for its locked numbers). The brief supplies:

- `slug`, `title` (the reader-question), `module`
- `teachingGoal` — what the reader should understand after reading
- `mustTeach[]` — the concepts/terms this entry is responsible for
- `featureNumbers[]` — labels of locked numbers to put front and centre
- `interdisciplinaryAngles[]` — which disciplines this entry should reach into
- `contextCards[]` — **vetted, sourced cross-disciplinary facts** the model may use.
  Each: `{ fact, discipline, source }`. This is the only channel for history /
  sociology / politics facts. The model may use these and may NOT add others.
- `connects[]` — adjacent entry slugs to cross-link
- `evidenceSource` — which evidence packet to draw locked numbers from

## Number & fact discipline (inherited, absolute)

Same rule as the main site: every number, rate, share, rupee figure, and date-as-fact
must come from a locked number or a context card. No memory recall. `displayValue` is
used verbatim. Context cards extend this to qualitative facts: history, names, studies
are allowed **only** if they sit in a card. Uncontested textbook *framing* (the
mechanism behind a pattern, a concept a reader needs) is allowed with no new specifics.

## Output schema (`academy-1`)

```jsonc
{
  "schemaVersion": "academy-1",
  "slug": "what-is-gdp",
  "title": "What is GDP, in one breath?",
  "track": "gdp",
  "standfirst": "...",          // one-line dek under the title
  "bottomLine": "...",          // the one-sentence answer, always visible
  "body": "markdown",           // the explainer; question-led H2s if long enough,
                                //   interdisciplinary, grounded, VOICE.md-clean
  "keyTerms": [                 // 1-3 terms this entry defines, for glossary popovers
    { "term": "GDP", "plainMeaning": "..." }
  ],
  "onTheGround": {              // the macha "what this means, bro" register
    "heading": "...", "body": "..."
  },
  "whatPeopleGetWrong": "...",  // the common misreading, named and corrected
  "caveat": "...",              // the honest limit
  "connects": ["value-added", "what-gdp-ignores"],
  "sources": ["MoSPI National Accounts Statistics", "..."],
  "lockedNumbersUsed": ["GDP, nominal, latest", "..."],
  "contextCardsUsed": ["..."],
  "status": "ready" | "needs_data",
  "selfCritique": {             // filled by the critique pass
    "wrong": "...", "missing": "...", "toAdd": "...",
    "relevance": "...", "aiSmell": "...", "betterHow": "..."
  }
}
```

## The depth bar for flagships (codified 2026-06-06)

A flagship is **built around a tension**, not a tidy definition. Thin entries come from
thin briefs, so every flagship brief must carry:

- **`tension`** — the human stakes / surprise / live argument the whole entry circles.
  This is what separates a Quanta piece from a textbook. (e.g. for `gva-vs-gdp`: the
  accounting choice is *political* — the 2015 switch raised measured growth and fed the
  GDP-overstatement fight; a tax change can flatter GDP without more production.)
- **A 6–8 beat `sectionArc`** — history / mechanism / India / a real episode / the
  debate / the consequence for ordinary people. Five mechanical beats reads thin.
- **Enough vetted `contextCards`** to support that depth (debate, real episodes, history).
- **`depth: "flagship"`** → target **1,500–2,000 words**. The generator flags any flagship
  under ~1,300 words as THIN; deepen the brief and regenerate rather than padding.

## The rich format (codified 2026-06-06) — what makes an entry, not a text dump

Every flagship is **question-led and visually broken up**. The generator emits, and the
route renders, all of the following automatically:

- **Question-led H2 sections.** The body is `## ` headings, each a real reader question
  (driven by the brief's `sectionArc`), each answering itself. The route groups the body
  by H2 into `.academy-section` blocks with `.academy-q` heads.
- **Pull quotes.** `pullQuotes: [{ quote, afterHeading }]`. The route places each beside
  the H2 named in `afterHeading` (heading match is quote/whitespace-normalised). Quotes
  carry no invented numbers.
- **Calculation tables.** When an entry walks a calculation or breakdown of locked figures
  (GVA→GDP, expenditure split, GDP/NDP/GNI), the body contains a **markdown table**
  (header, `| --- |` separator, rows, total last). Rendered as `.academy-table`. Every
  cell figure must be a locked `displayValue`.
- **Composition visual.** `visuals: [{ type: "stacked-bar", title, subtitle, afterHeading,
  segments: [{label, value}], source }]`. A 100% stacked bar (chosen over pie: elegant,
  mobile-friendly, non-cliché). **Each segment `value` must equal a locked share.** The
  dominant segment (≥30%) is labelled in-bar; all are labelled in the legend.
- **Verified inline links.** The model lists `linkEntities` (names only, never URLs). URLs
  live in `data/academy/links.json` — a hand-curated, **HTTP-verified** entity→URL map —
  and the route auto-links the first mention of each, once per entry. The model never emits
  a URL (same no-hallucination rule as numbers). Entities the model names that are not yet
  in the map are reported by the generator so a human can add a verified URL.

### Validation the generator runs (deterministic, not model self-report)

1. **Style gate** — loops until prose has zero AI-tells and zero em-dashes (actually clean).
2. **Derived-number guard** — flags invented multipliers ("N times / fold / doubled").
3. **Identity + vintage guard** — national-accounts identities must tie; injects a
   same-vintage figure when "latest" values span different years.
4. **Rich-figure check** — every table cell and visual segment must trace to a locked number.
5. **Link-entity check** — names not in the verified map are surfaced (won't render until added).

## Workflow (one command each)

```
npm run academy:gen -- --slug=<slug>     # draft → critique → revise → gates; writes docs/academy/drafts/
# review docs/academy/drafts/<slug>.md
npm run academy:publish <slug>           # strips meta → data/academy/en/<slug>.json (the build reads this)
npm run build                            # renders /academy/<slug>/
```

## Length

Atomic entries are short by design: roughly 250–600 words of `body`. A foundational
entry (what-is-gdp, value-added) may run longer; a thin one (what-gross-means) stays
tight. If the evidence can't support a real answer, `status: needs_data`.

## The pipeline

`draft → lintProse → self-critique (critique-loop.md questions) → revise`, all in one
script run. Outputs land in `docs/academy/drafts/`: `<slug>.draft.json`,
`<slug>.final.json`, and a human-readable `<slug>.md`. Re-run with a sharpened brief
to iterate.
