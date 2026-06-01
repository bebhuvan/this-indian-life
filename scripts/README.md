# Scripts

This folder is split by responsibility.

`adapters/` contains source-specific HTTP clients. They know URLs, auth headers, and source API parameters.

`core/` contains reusable infrastructure: artifact writing, CSV parsing, and explanation evidence construction.

`registry/` contains the V1 national question spine and the source indicators needed to answer it.

`ingest-*.mjs` scripts fetch one source and write:

- raw snapshots in `data/snapshots/<source>/`,
- normalized artifacts in `data/series/`,
- a source manifest in `data/catalog/`.

`generate-explanations.mjs` reads local artifacts and writes DeepSeek-generated explanation JSON. It does not fetch statistical data.
