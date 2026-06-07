# Indica — agent playbook for writing articles

This is the entry point for any agent (Claude Code or otherwise) writing or editing
a data-journalism article on Indica. Keep it lean; it is an **index + the conventions
and gotchas**, not a replacement for the detailed docs it points to. `CLAUDE.md` is a
symlink to this file — edit this one.

> Deep docs (read the relevant one before starting): `docs/ARCHITECTURE.md`,
> `docs/EXPLANATION_PIPELINE.md`, `docs/DATA_SOURCES.md`,
> `docs/CHART_SELECTION_PHILOSOPHY.md`, `docs/EDITORIAL_NORTH_STAR.md`,
> `docs/academy/VOICE.md` (anti-AI-writing bible), `docs/gold-flagship-handoff.md`
> (worked example of a full build).

---

## The article model (how a page is assembled)

An article = a **question** (`q.<domain>.<slug>`) defined in
`scripts/registry/v1-indicators.mjs`, with:
- `indicators` / `core` / `context` — the series it uses
- `visualPlan` — the **ordered, curated** list of charts (each bound to indicator(s) + a chart type + `why`/`read`/`watch`)
- an **editorial brief** in `articleTemplateFor()` inside `scripts/generate-explanations.mjs`
- a generated **explanation** at `data/explanations/en/<id>.json` (prose body, short, macha, **chartExplainers**, caveats, sourceNotes, evidence)

Series live in `data/series/*.json` (schema = `scripts/core/artifacts.mjs`
`createSeriesArtifact` / `createTableArtifact`). `src/data/dataManifest.ts` indexes
them **by `indicatorId`** — so a series resolves to a chart automatically; the file
name is cosmetic. **A question with no explanation file is silently dropped from the build.**

---

## The pipeline (6 steps)

1. **Scope.** One real question. Blend **≥2 independent sources**. Decide the act structure (a curated set of high-signal visuals; see `CHART_SELECTION_PHILOSOPHY.md`). Don't pad with low-signal charts.
2. **Ingest data** → `data/series/`. Reuse adapters (`scripts/adapters/*`) and write `scripts/ingest-*.mjs` (or `.py`, mixing is fine — see era5/gold). Snapshot raw payloads. **Every series needs a precise `sourceUrl`** (see Source linking).
3. **Registry `visualPlan`.** Add the question + chart list to `v1-indicators.mjs`. Each chart: `indicator` (or `series:[]`), `chart` type, `size` (hero/feature/small), `why`/`read`/`watch` (short hints, **not** the reader-facing description). Verify every indicator resolves before generating.
4. **Editorial brief.** Add a `if (evidence.questionId === "<id>")` block in `articleTemplateFor()` with `purpose`, `requiredSections`, `requiredConcepts` (the locked facts + honesty rules), `styleExample`.
5. **Generate prose** (deepseek-v4-pro). `node scripts/generate-explanations.mjs --questions=<id>`. Then **generate chart explainers** (see below) and **validate** (`npm run explain:v1:validate`).
6. **Build + verify.** `npm run build`; open `npm run dev` and read the page. Data-file changes need a **dev-server restart** to show.

---

## Conventions (do these every time)

### Explainer blocks (`chartExplainers`) — ALWAYS
Every chart must have a rich explainer: `visualId` (= the chart **title**; matched via
`slugifyTitle`), `takeaway`, `detail` (2-3 sentences), `whyShowThis`, `howToRead`,
`mistakeToAvoid`, `mobileNote`. These fill the description boxes under each chart. The
`why`/`read`/`watch` in the `visualPlan` are short hints only — if `chartExplainers` is
empty, the boxes fall back to those one-liners and **read thin**. The standard multi-pass
generator produces explainers; **batched generation does not** (see Gotchas), so generate
them with a dedicated pass (`scripts/generate-gold-explainers.mjs` is the template).

### Methodology, assumptions, caveats — end every article
Close with a **"How to read these / methodology & caveats"** section, and populate:
- `caveats[]` — what the numbers can't show; estimates vs measurements; survey vintage; etc.
- `sourceNotes[]` — name every source plainly.
- In prose: **state how any derived series was computed** (e.g. the household-stock reconstruction = anchor + cumulative net demand), **name assumptions** (anchors, base years, deflators), and **present estimates as ranges, never false precision** ("25,000-30,000 tonnes", not "30,372"). Reconcile independent estimates and let the gap carry meaning. Never claim a single cause; present all sides.

### Source linking (hyperlinks wherever possible)
The per-chart **SOURCE line auto-links** to `series.sourceUrl`. So:
- Give every series a **precise, clean** `sourceUrl` (no trailing text — `"https://x/" (note)` breaks the href).
- **Derived series must point to their underlying source** (they default to none → no link).
- `sourceNotes` / `Further reading` render as **plain text** (not links) in `ArticleEvidence.astro` — changing that touches all articles, so get sign-off first.
- The evidence block already links every figure to its **GitHub data file**, pinned to the publish commit.

### Wiki links (internal cross-links) — curated, sparingly
- Use a **controlled `term → slug` map**; link only to **live, substantial** articles or academy entries. **Never auto-NLP-link** every term (wrong links, dead links, visual noise).
- **~3-6 per article.** Distinct from the **glossary** (`glossaryBlocks` = inline jargon *definitions*; wiki link = "go deeper elsewhere").
- Link the obvious cross-references (e.g. "current-account deficit" → trade article, "total return / Nifty 500" → an academy returns entry, "inflation" → inflation article).

### Voice & honesty
Read `docs/academy/VOICE.md`. The "macha" layer ("okay bro, what does this mean") is
warm + grounded. **No em-dashes.** Round like a human. Use only numbers that trace to a
source. Be scrupulous about estimate vs measurement.

---

## Data-source catalog (the goldmines)

See `docs/DATA_SOURCES.md` for the full map. Highest-leverage sources discovered:
- **UN Comtrade** (`scripts/adapters/un-comtrade.mjs`, key in `.env`) — HS-code trade, monthly + annual, value **and** tonnes. Always filter with `canonicalComtradeRows` (drops customs/MoT/partner2 duplicate rows). Mirror-check via the partner country as *reporter*.
- **MOSPI eSankhyiki** open API (`api.mospi.gov.in`, no auth, scoped TLS-relax — see `scripts/adapters/mospi.mjs`). The `RBI` dataset (`/api/rbi/getRbiRecords?sub_indicator_code=`) has forex reserves, balance of payments, exchange rates. **Lags ~1 year.**
- **The Data bank warehouse** at `~/Documents/Data/Data bank/` (SQLite + parquet) — already-parsed goldhub prices (USD+INR), niftyindices TRI, AMFI AUM, FRED series. Read `warehouse_publications`.
- **RBI DBIE scraper** at `~/Documents/RBI/` — processed parquet of forex reserves, gold/silver prices, BoP.
- **WGC Goldhub JSON API** (`fsapi.gold.org`, no auth) — the `/download/file` XLSX is Akamai-blocked; use the JSON API or the GDT_Tables xlsx via browser.
- **IndiaDataHub** (`feeds.indiadatahub.com`, key in `.env`), **FRED**, **AMFI**, **NPCI** (JS SPA — hard to scrape), **WB**, **WTO**, **Harvard ECI**, **IMF**.

---

## Gotchas (learned the hard way)

- **deepseek-v4-pro has a hard output ceiling (~16-24k tokens).** Large articles (~25 charts) make the single multi-pass draft call **truncate** → `"DeepSeek completion returned invalid JSON (length)"`. Raising `INDICA_EXPLANATION_MAX_TOKENS` past ~24k does **not** help. **Fix: batched generation** — generate the body N charts at a time + a meta call, reuse `buildEvidencePacket`, assemble a render-compatible explanation (empty `chartExplainers`/`sectionVisualMap`/`editorialPlan` are fine — the renderer guards them). Template: `scripts/generate-gold-batched.mjs` + `scripts/generate-gold-explainers.mjs`. **Prose-only sections (no chart, e.g. a cultural "why") must be generated + spliced separately** — the batcher is chart-driven.
- **Chart explainers don't come free in batched mode** — generate them or descriptions go thin (see above).
- **Set `sectionVisualMap` when batched/splicing**, or charts bind to the wrong sections. With it empty, the renderer guesses heading→chart by word-overlap; a single **prose-only section (no chart, e.g. a cultural "why")** shifts the alignment and mis-binds everything after it. Build the map explicitly: walk the sections in order, skip prose-only ones, assign the next chart title as `visualId`.
- **Comtrade jewellery (HS 7113) net weight is glitched** — chart by value only. Some HS 7108 annual weights are missing (e.g. 2014) — estimate from value ÷ world price, flagged.
- **RBI gold tonnage is NOT derivable from reserve value ÷ price** (RBI values gold ~11% below spot). Use WGC/IMF published tonnage.
- **AMFI catwise "Total" row is flows, not AUM** — use `amfi_aum_schemewise`, summed over GOLD ETF schemes, for AUM.
- **Per-article theming**: add a class to `.wrap` in `src/pages/articles/[slug].astro` + override `--c`/`--c-ink`/`--c-tint` in `indica.css` (chart palette is `["var(--c)", ...]` in `ArticleVisuals.astro` — only the primary line/tint follow it). See the gold theme (`.theme-gold`).
- A format-on-save linter may reformat `v1-indicators.mjs` between reads — re-read just before each edit.
- **Never run `\s`-matching regexes on `bodyMarkdown`.** `\s` matches newlines, so a cleanup like `re.sub(r"\.\s{2,}", ". ", body)` collapses the `\n\n` that separates headings/paragraphs — the markdown structure dies and every heading after the first merges into the prior paragraph as literal `## …`. Use `[^\S\n]` (whitespace except newline) or operate line-by-line. After any body edit, sanity-check: `body.count("\n## ")` should equal the number of non-first headings.

---

## Commands

```bash
node scripts/ingest-<source>.mjs        # or python3 scripts/ingest-<source>.py
python3 scripts/derive-<x>.py           # derived/computed series
node scripts/generate-explanations.mjs --questions=q.<id>   # prose (multi-pass)
#   big article? use a batched generator (see Gotchas) instead
npm run explain:v1:validate             # lint prose (AI-phrase / false-precision checks)
npm run build                           # static build (a missing explanation => question dropped)
npm run dev                             # local preview (restart after data-file changes)
```
