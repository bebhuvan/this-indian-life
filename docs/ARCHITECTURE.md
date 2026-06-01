# Indica Architecture

Indica is split into a data plane and a serving plane.

## Serving Plane

The public site is an Astro app deployed to Cloudflare Pages. The first version is fully static:

1. The catalog is read at build time.
2. Chart pages are generated from config records.
3. Primary charts are rendered as inline SVG/HTML with light client-side enhancement.
4. Data files are content artifacts, not live API responses.

This keeps the site fast on free-tier infrastructure. A viral traffic spike should mostly hit Cloudflare's static cache.

Future Cloudflare services:

- Pages: site hosting.
- R2: immutable chart artifacts and raw snapshots.
- D1: catalog/search metadata once the catalog outgrows static files.
- KV: hot homepage and "latest value" lookups.
- Workers Cron: scheduled ingestion.
- Vectorize: question-to-chart matching after keyword matching is not enough.

## Data Plane

The ingest pipeline has five stages:

1. `fetch`: read an upstream source into a raw snapshot.
2. `normalize`: convert source-specific fields into the canonical observation schema.
3. `validate`: check units, frequency, dimensions, dates, missing values, and revisions.
4. `publish`: write content-hashed series artifacts and catalog metadata.
5. `explain`: generate evidence-locked commentary for each locale/register.

The first repository implementation uses local scripts and checked-in artifacts. The same stages can later move to Cloudflare Workers or scheduled CI.

## Folder Shape

```text
docs/                  Product, architecture, schema, source docs
scripts/               Ingestion and validation scripts
data/
  snapshots/           Raw upstream responses, content-addressed later
  series/              Normalized chart-ready JSON artifacts
  catalog/             Generated catalog artifacts, if needed
src/
  data/                Curated catalog and source registry
  components/          Astro components
  layouts/             Page shell
  pages/               Static and dynamic routes
  styles/              Design system CSS
public/                Client chart kit and static assets
design-system/         Original design-system reference, preserved
```

## Request Path

```text
user -> Cloudflare edge cache -> static Astro HTML
                              -> immutable JSON only for lazy charts
```

There is no runtime dependency on RBI, MoSPI, World Bank, WAQI, OpenAQ, or any LLM provider.

## Data Quality Rules

- Raw snapshots are immutable.
- Normalized observations preserve source identity and source date.
- Every transformation declares input series, method, unit, and rounding.
- Display rounding never mutates stored values.
- Lakh/crore/billion formatting happens at render time.
- Revisions create new artifact versions rather than silently overwriting history.
- Derived series are separate from source series.

## R Transformations

Phase 1 uses source values as-is with display transformations only.

Phase 2 adds an R-backed transform layer for heavier work:

- inflation adjustment;
- seasonal adjustment;
- rolling averages;
- CAGR and index rebasing;
- state/country ranking;
- survey weighting;
- air-quality aggregation;
- climate percentile and heat-stress transforms.

R outputs must land back in the same canonical artifact format, with a transform manifest so the website does not care whether data came from JavaScript, R, DuckDB, or a manual import.

## Ask Architecture

Start with deterministic matching:

- question aliases stored on chart records;
- domain filters;
- keyword synonyms;
- top result plus related results.

Add embeddings only after there is enough catalog content to justify it. For the launch catalog, rules will be easier to inspect and safer to debug.

