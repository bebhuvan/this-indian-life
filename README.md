# This Indian Life

**India, one number at a time.** Sourced charts and plain-language explainers about how India lives — its people, economy, health, energy, climate, and society.

🔗 **[thisindianlife.today](https://thisindianlife.today)**

One person dragging India's most important numbers out of stubborn PDFs and tired government portals, and putting them in plain language. Every page is **static, sourced, and tied back to where the numbers began**.

---

## What it is

Each question — *"How big is India's economy?"*, *"Are India's big cities getting hotter?"* — is its own page with its own evidence, charts, caveats, and a plain-English explainer. Numbers are never invented in prose: every explanation is generated from a **locked evidence packet** so the writing can only cite figures that came from a real source.

Articles carry an honest status: **Ready to read**, or **Still building**.

## How it works

```
sources (APIs / PDFs)  →  ingest scripts  →  data/series + data/catalog
                                                      │
                          locked evidence packet  ←───┘
                                                      │
                          explanation artifact (data/explanations)
                                                      │
                          Astro static build  →  dist/  →  Cloudflare Workers
```

- **Indicators are decoupled from questions.** Questions reference stable indicator IDs; indicators map to source adapters. Writing, charts, and data fetching stay independent. (See the [Methodology page](https://thisindianlife.today/methodology/).)
- **Charts are hand-curated per question** via a declarative visual plan — a small set of high-signal visuals, not a dashboard.
- **Fully static.** No client framework, no runtime server (a thin Worker only handles Markdown-for-agents negotiation on article routes). CSS is inlined, fonts are self-hosted.

## Tech

- [Astro](https://astro.build) (static output) · self-hosted Cormorant Garamond + DM Sans
- Cloudflare Workers static assets (`wrangler`)
- Node ingestion scripts (+ some Python) for the data pipeline
- Progressive web app: offline support, installable, native-app polish

## Develop

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # build the static site into dist/
npm run preview  # preview the production build
npm run deploy   # build + wrangler deploy
```

Raw ingestion inputs (large third-party dumps) are kept local and git-ignored; the build reads only `data/explanations`, `data/series`, and `data/catalog`.

## Data sources

World Bank · UN Population · WHO GHO · Our World in Data · Ember · EIA · MoSPI / NAS · RBI · PPAC · IMD · Open-Meteo · WAQI · UN Comtrade · and more. Each indicator's exact source and code is listed on the [Methodology page](https://thisindianlife.today/methodology/).

## License

Content and code are released under [**CC BY 4.0**](https://thisindianlife.today/license/) — use it, remix it, just credit *This Indian Life* and link back.
