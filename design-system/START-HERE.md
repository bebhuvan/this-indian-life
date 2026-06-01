# Handoff prompt — paste into the new chat

You are joining **Indica**, a "living almanac" web product that answers any question about India with sourced charts + layered, plain-language explanations (India first, the world later). Data comes from open archives: Our World in Data, MoSPI, RBI, WRI, NASA, EU Copernicus/CAMS, UN WPP, World Bank.

**Your job: architect the build and start implementing it.** The product vision, design system, and all key decisions are already settled — do not relitigate them. Read these first, in order:

1. `design-system/SPEC.md` — the source of truth: product, the layered-explanation feature, the visual system, the full architecture (Cloudflare + Astro + R2/D1/KV), charts-as-data, the `chart-kit.js` API, multilingual, URL scheme, and §8 open questions.
2. `design-system/index.html` — the living styleguide (open it in a browser): foundations, components, and live charts.
3. `design-system/` — working page templates: `home`, `chart` (the core page), `ask`, `domain`, `about`, all built on `indica.css` + `chart-kit.js`.
4. `mocks/` — earlier exploration (context only; the chosen direction is `concept-05-almanac`, and `chart-page-full.html` is the EN/HI multilingual proof).

**Non-negotiables (see SPEC for the why):**
- Pure-white, multi-colour-domain-ink aesthetic; Cormorant Garamond + DM Sans; no beige/dark-strips/clichés.
- Layered explanations = Bottom Line + 3 registers (The Reading / In Plain English / On the Ground = warm-grounded). **Numbers are never LLM-generated** — prose wraps locked numbers, pre-generated at ingest.
- Decouple data plane (scheduled ingest → canonical schema → immutable artifacts) from serving plane (static-first, SSR'd SVG, island hydration). **No third-party API calls at request time.** Must be ridiculously fast on Cloudflare.
- Own SVG chart kit (d3 math submodules only, not the monolith); `chart-kit.js` is the seed.
- Multilingual from day one (content-as-data per locale; numbers formatted, not translated).

**What does NOT exist yet:** real ingestion pipeline, the canonical indicator schema, the chart/question catalog, `chart-kit` as a real package, self-hosted fonts, the "Ask" matcher.

**Start by:** proposing the concrete architecture — repo/monorepo layout, the canonical indicator + chart-catalog schema, the ingestion→artifact→serving data flow on Cloudflare, and the chart-config model that lets one engine render thousands of charts. Then resolve SPEC §8's open questions with me before writing code. Charts are intentionally rough — that's a later iteration, not your concern now.
