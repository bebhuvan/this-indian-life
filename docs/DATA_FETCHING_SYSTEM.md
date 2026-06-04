# Data Fetching System

Indica's data layer is designed to be open-sourced later as a small, auditable ingestion toolkit. The public website should never depend on live statistical APIs at request time. Ingest scripts fetch source data offline, preserve raw snapshots, and write normalized artifacts that the site can build into static pages.

## Principles

1. Preserve the source response before transforming it.
2. Keep each source isolated: one adapter, one ingest command, one manifest.
3. Never mix units silently. Unit conversion belongs in a named transform, not inside a fetcher.
4. Treat the source's own geography and dimensions as data, not decoration.
5. Let failures be local. A missing World Bank indicator should not block Ember or WHO data.
6. Do not commit secrets. `.env` stays local; `.env.example` documents accepted names.
7. Let language models explain locked data, not fetch or invent data.

## Layout

```text
scripts/
  adapters/       Source-specific HTTP clients.
  core/           Shared artifact, CSV, and evidence helpers.
  registry/       V1 question and indicator mappings.
  ingest-*.mjs    One source-level ingest command per source.
data/
  snapshots/      Raw source responses with content hashes.
  series/         Normalized series and table artifacts.
  catalog/        Per-source manifests, source inventory, and ingestion job registry.
  explanations/   DeepSeek-generated prose artifacts.
docs/
  SCHEMAS.md      Contracts for artifacts, manifests, and explanations.
```

## Adapter Contract

Adapters should only know how to talk to a source API. They should not write files and should not reshape data into Indica schemas. Keep credentials and base URLs in the adapter, using environment variables where needed.

```js
export async function fetchSourceThing(params) {
  return fetchJson(buildUrl(baseUrl, "/path", params));
}
```

Ingest scripts own source selection, normalized artifact creation, snapshot writing, and manifests.

## Artifact Contract

Use `artifactType: "series"` when the source is a simple dated value sequence:

```json
{
  "schemaVersion": 1,
  "artifactType": "series",
  "indicatorId": "econ.gdp.current_usd",
  "observations": [{ "date": "2024", "value": 3900000000000 }]
}
```

Use `artifactType: "table"` when the source includes important dimensions that should remain intact:

```json
{
  "schemaVersion": 1,
  "artifactType": "table",
  "indicatorId": "people.population.un.age_sex_5y",
  "rows": [{ "timeLabel": "2025", "sex": "Female", "ageLabel": "20-24", "value": 61000 }]
}
```

## Commands

```bash
npm run env:check
npm run ingest:worldbank
npm run ingest:ember
npm run ingest:who-gho
npm run ingest:rbi-dbie-forex-reserves
npm run ingest:rbi-dbie-macro-timeseries
npm run derive:rbi-dbie-macro-series
npm run ingest:owid
npm run ingest:waqi
npm run ingest:un-population
npm run ingest:v1
npm run jobs:list
npm run ingest:production-no-secret
npm run discover:no-secret
npm run validate:pipeline
npm run explain:v1:dry-run
npm run explain:v1 -- --limit=2
```

`ingest:v1` runs the core national V1 sources in sequence. It is intentionally conservative: no parallel source fetching until rate-limit behavior is better understood.

`data/catalog/ingestion-jobs.json` is the operational cadence registry. It records job id, source id, cadence, command, expected writes, required environment variables, and whether a job's output can be used as article evidence. `scripts/run-ingestion-jobs.mjs` reads that registry and stops on the first failed job or missing expected output.

The `production_no_secret` group is the default scheduled set. It excludes API-key feeds such as EIA, WAQI, IndiaDataHub, and Data Commons until those jobs have explicit secret handling and source-specific quality gates. Discovery jobs can refresh catalogs, but discovery output is not article evidence until a separate production ingest writes validated artifacts.

GitHub Actions runs `.github/workflows/data-pipeline.yml` weekly and on manual dispatch. The workflow runs the selected job group, validates data, builds the site, and uploads generated data/build artifacts. It does not auto-commit generated data; review the diff before committing source changes or refreshed artifacts.

## RBI DBIE

RBI DBIE is handled through a dedicated adapter because its public site is an Angular SPA backed by gateway endpoints. Current production ingests:

- `ingest:rbi-dbie-forex-reserves`: weekly foreign exchange reserves from `/dbie_foreignExchangeReserves`, including INR/USD totals and components. It rejects empty slices and reconciles total reserves against component sums.
- `ingest:rbi-dbie-macro-timeseries`: official DBIE HDFS workbook downloads for `MacroeconomicIndicators` and `OtherMacroeconomicTimeseriesData`. It snapshots the raw XLSX bytes, parses into long table artifacts, rejects duplicate dataset/frequency/period/indicator keys, emits finite numeric observations only, and reconciles latest foreign currency assets against the forex reserves artifact when present.
- `derive:rbi-dbie-macro-series`: curated named series derived from the long macro artifacts for article generation. It covers policy rates, call-money rates, market yields, bank credit, deposits, money supply, CPI/WPI/IIP, trade, FDI/FPI, digital payments, public finance, national accounts, and house prices. Each child series records its parent artifact hash and exact source label/frequency/unit selector.

DBIE report discovery (`discover:rbi-dbie-reports`) is not article evidence by itself. It inventories report IDs and can resolve encrypted report links, but BusinessObjects viewer links are promoted only after a source-specific adapter can fetch a stable downloadable or JSON payload and validate table semantics.

See `docs/RBI_DBIE_ADAPTER.md` for the evidence-ready jobs, validation gates, and expansion rule.

## Adding A Source

1. Add `scripts/adapters/<source>.mjs`.
2. Add registry entries in `scripts/registry/v1-indicators.mjs`.
3. Add `scripts/ingest-<source>.mjs`.
4. Write raw snapshots with `writeSnapshot`.
5. Write normalized artifacts with `createSeriesArtifact` or `createTableArtifact`.
6. Write `data/catalog/<source>-manifest.json`.
7. Add the command to `package.json`.
8. Document caveats in `docs/DATA_SOURCES.md` or a source-specific note.

## Data Quality Rules

Fetchers must not:

- round values,
- rename units without recording the original source unit,
- collapse sex, age, fuel, or geography dimensions unless the transform is explicit,
- overwrite a raw snapshot without a content hash,
- call an LLM during data ingestion.

Transforms can come later, including R-based analytical views. They should read artifacts and write new derived artifacts with parent artifact paths and transform metadata.
