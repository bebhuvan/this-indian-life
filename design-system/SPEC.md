# Indica — Design System & Build Spec

> A "living almanac" that answers any question about India with sourced, beautiful charts and layered, plain-language explanations. Starts with India; later, the world.
> This document is the handoff: it captures every product, design, and architecture decision made so far so a new session can go straight to architecting the build. Pair it with the files in this folder.

---

## 1. Product in one paragraph

Indica reads India through open data (Our World in Data, MoSPI, RBI, World Resources Institute, NASA, EU Copernicus/CAMS, UN WPP, World Bank…). Every metric becomes a **chart page**: a gorgeous chart + a multi-register, LLM-written explanation grounded in locked numbers. Users **ask questions** ("how fast is India's economy growing?") and land on the relevant chart page. Multilingual from day one.

---

## 2. The signature idea — layered explanations

Every chart carries **one always-visible Bottom Line** + **three explanation registers** the reader can switch between. The chosen register is **sticky** (persists across the site, like a reading-level preference).

| Register | Voice | Purpose |
|---|---|---|
| **The Reading** | analyst | Precise, correct, uses real vocabulary (nominal vs real, CAGR, TFR). |
| **In Plain English** | neutral | Same facts, zero jargon. |
| **On the Ground** | **warm & grounded** | "Like an Indian would say it" — lived reality, rupee/rent/fuel analogies, local framing. **A smart, warm friend who knows the data — never snarky, never a comedian.** This is the product's moat. |

**Hard rules:**
- **Numbers are NEVER LLM-generated.** Figures come from the pipeline; the model only writes prose *around* locked numbers. Show this promise in the UI (trust badge).
- Explanations are **pre-generated at ingest time** and cached as static text — zero LLM calls at request time.
- Re-generate only when underlying numbers move materially.
- Future registers are trivial to add (just another text field): "For a 12-year-old", state/regional reframe, etc.

A voice style guide + 3–4 gold-standard examples per domain should be written before scaling the "On the Ground" layer. Native-language editors should review it (see i18n).

---

## 3. Visual language — "The Almanac"

Derived from a reference the founder loved (pure-white, one-accent editorial data design) and extended to a **multi-colour** system. The discipline that keeps it refined:

- **Pure white** ground (`#fff`), ink-black text, **neutral-grey hairlines**. No beige, no dark strips, no cards-with-shadows, no gradients (except whisper-faint chart area fills), no rounded corners beyond 2px.
- **Extreme type-scale contrast**: huge thin Cormorant numerals vs. tiny letterspaced DM Sans labels.
- **Colour appears only on the big numeral + its illustration — one colour per element, never mixed inside a single stat.** Everything else stays monochrome. This is what stops six colours from becoming a clown dashboard.
- Bespoke, conceptual SVG (dot matrices, crossing lines, age bands) — not generic chart-library output.

### Type
- **Display:** Cormorant Garamond (300–600; use thin weights at large sizes; italic for voice/pull quotes).
- **Body / UI:** DM Sans (300–500).
- **Hindi / Devanagari:** Tiro Devanagari Hindi (swap in for `[lang="hi"]`).
- Production: **self-host + subset** these (font loading is the #1 perf risk). `font-display:swap`, preload.

### Colour — domain inks (bright but soft, one family)
| Domain | Token | Hex |
|---|---|---|
| People | `--people` | `#DB5C97` rose |
| Economy | `--economy` | `#3A5BD0` indigo |
| Energy | `--energy` | `#EFA227` marigold |
| Climate | `--climate` | `#EE6A4C` coral |
| Health | `--health` | `#15A382` jade |
| Society | `--society` | `#7C5AD6` violet |
| (neutral/"other") | `--slate` | `#b7b7bf` |

Neutrals: `--ink #0b0b0b · --mid #5c5c5c · --dim #a6a6a6 · --ghost #e7e7e7 · --line #ededed · --paper #fafafa`. `--c` = the active page/element domain ink.

All tokens, components and motion are implemented in **`indica.css`**. Chart rendering defaults in **`chart-kit.js`**.

---

## 4. Pages (templates in this folder)

| File | Page | Notes |
|---|---|---|
| `index.html` | **Styleguide** | Foundations (palette, type scale, motion) + component gallery + page directory. Start here. |
| `home.html` | **Home / Almanac** | Hero numeral, domain nav, stat ledger, share-of-world, question index. |
| `chart.html` | **Chart detail** | THE core page: hero chart + segmented views + Bottom Line + 3 registers + secondary viz + related + ask + methodology. |
| `ask.html` | **Ask / results** | Question-first: search hero, suggested questions, generated answer card linking to chart pages. |
| `domain.html` | **Domain catalog** | Browse one domain (e.g. Economy) — filterable grid of chart cards. The "thousands of charts" browse surface. |
| `about.html` | **About / Methodology / Sources** | Trust, data provenance, the explanation/LLM policy. |

Future templates (not built yet): editorial **story / scrollytelling**, **compare** (two metrics/states), **state/regional** pages.

---

## 5. Architecture (recommended)

**Core principle: decouple the data plane from the serving plane.** Never hit third-party APIs at request time.

```
DATA PLANE (scheduled, offline)
  upstream APIs → fetch (Worker per source) → normalize to ONE canonical
  "indicator" schema {date, dimension, value} + metadata → pre-aggregate →
  write immutable, content-hashed artifacts.  Also: pre-generate the 3
  explanation registers per locale here (against locked numbers).

SERVING PLANE (static-first)
  Astro on Cloudflare Pages. Charts server-rendered to inline SVG at build/edge
  time (paint instantly, no layout shift). Hydrate ONLY interactive charts
  (islands). Below-the-fold chart data lazy-loads from CDN on viewport.
```

### Cloudflare stack
| Need | Service |
|---|---|
| Site | **Astro** on **Cloudflare Pages** |
| Ingestion | **Workers + Cron Triggers** (per-source cadence) |
| Chart data artifacts (JSON; Arrow/Parquet for big series) | **R2** + CDN, `Cache-Control: immutable, max-age=1yr`, content-hashed filenames |
| Catalog (charts, indicators, questions, explanation text) | **D1** (SQLite) |
| Hot lookups (homepage numbers, latest values) | **KV** |
| "Ask" → match question to chart (later) | **Vectorize + Workers AI** (embeddings) |

### Charts-as-data (how you survive thousands)
A chart is a **config record**, not bespoke code. One rendering engine + N config rows + N tiny data files.
```json
{ "id":"econ.gdp.nominal", "domain":"economy", "type":"area",
  "series":"r2://series/econ.gdp.nominal.<hash>.json",
  "encoding":{"x":"year","y":"usd_t"}, "title":{…}, "color":"--economy" }
```
Astro dynamic route `/{locale}/{domain}/{slug}` generates pages from the catalog. Pre-render popular; edge-render + cache the long tail.

### Charting library decision — build our own (don't take a dep on a monolith)
- ❌ Chart.js / Highcharts / ECharts (heavy, generic look). ❌ `d3-selection` (DOM layer, fights the framework).
- ✅ Render SVG ourselves; borrow **only D3 math submodules** — `d3-scale`, `d3-shape`, `d3-array`, `d3-time`, `d3-format` (~10–15KB, tree-shaken, mostly SSR-only → ~0 client cost for static charts).
- Gradually extract our own scale/curve math → open-source **"Indica Charts"** (declarative spec → SSR SVG, accessible). `chart-kit.js` here is the seed.
- Escape hatch: charts with >5–10k points → **`uPlot`** (canvas, tiny, fast).

**`chart-kit.js` API (current seed — pure SVG strings, SSR-friendly):**
```js
// Bold hero chart: area + glow + on-chart annotations + end marker. Mounts into <svg>, returns ctx.
const ctx = Indica.heroLine(svgEl, {
  x:[labels], data:[nums], color,            // min/max auto if omitted
  ticks, ylab:v=>'…', everyX,                // axis control
  annotations:[{i, t:'label', s:'sub'}],     // on-chart event markers
  endLabel:'$3.94T', endSub:'2024'           // focal "now" marker
});
Indica.attachHover(svgEl, {wrap, tip, ctx, fmt:v=>'…', unit, x});   // crosshair + tooltip
Indica.stack('#el', [['Services',53],…], {color, ops});             // composition bar + big-number legend
Indica.rank ('#el', [['USA',29.2],…], {color, highlight:'India', max, unit}); // ranked board, one protagonist
Indica.countTo(el, to, dec);                                        // number count-up
// also: Indica.line / .bars / .spark (lightweight), .smooth, .niceMax, .mount
```
All styling lives in `indica.css` (`.anno-*`, `.yaxt/.xaxt`, `.end-v`, `.ik-fade`, `.stack`, `.rank`) and respects `prefers-reduced-motion`. A chart page = per-metric config + these calls (see `chart.html`). Live demos in the styleguide `index.html`.

### Performance checklist ("ridiculously fast")
Static HTML + SSR'd inline SVG · islands/partial hydration · immutable content-hashed CDN data, lazy-loaded below fold · self-hosted subset fonts · **no third-party API at request time** · edge cache + stale-while-revalidate.

---

## 6. Multilingual (from day one)

Architecture makes it nearly free: everything is pre-generated → language is "more static text fields per chart per locale," CDN-cached. **Never translate on a pageview.**

Three sub-problems, solved differently:
1. **UI chrome** → message catalogs (one JSON per locale), translated once + human-reviewed.
2. **Numbers & dates** → `Intl.NumberFormat('en-IN'/'hi-IN'…)` — **format, never translate** (lakh/crore, ₹, `12,34,567`). Quantities may differ by locale: `1.43 bn` (en) ↔ `143 करोड़` (hi).
3. **Explanation layers** → at ingest: **translate "The Reading"** (technical, transfers fine); **regenerate "On the Ground" natively** per language with local analogies. Always around locked numbers.

Implementation pattern (see `chart.html` / the bilingual proof in `../mocks/chart-page-full.html`): **all page text is a content-as-data object** `T[locale]`; page renders from it. Launch English + Hindi + 2 big languages with a review loop; schema supports all from day one.

---

## 7. URLs

```
https://indica.in/{locale}/{domain}/{slug}
  e.g. /en/economy/how-big-is-indias-economy
       /hi/people/bharat-ki-aabaadi
```
- Stable internal **id** (`econ.gdp.nominal`) ↔ human **slug** in catalog; 301-redirect on slug change.
- **Locale prefix on every URL**; `/` redirects to detected/default. `hreflang` + canonical from catalog; auto sitemap.
- **Path = canonical/cacheable identity. Query params = ephemeral view-state only** (`?metric=percap&from=2010`), never canonical content.

---

## 8. Open questions for the architecting session
1. Catalog authoring: hand-write chart configs, or generate from a source registry + templates?
2. "Ask" matching: rules/keywords first, or embeddings (Vectorize) from day one?
3. Explanation generation pipeline: which model, batching, cost ceiling, regen trigger threshold, review/QA workflow.
4. Languages for launch (recommend en, hi, + 2) and the native-review loop.
5. CMS for editorial story pages? (Astro content collections likely enough.)
6. Versioning/provenance: how to snapshot the exact source + value behind every published number.

---

## 9. Status
Design language and the core page experiences are defined and prototyped (this folder + `../mocks`). **Chart visuals are intentionally rough — flagged for iteration.** Not yet built: real ingestion, canonical schema, catalog, the chart-kit as a real package, self-hosted fonts, the Ask matcher.
