# Data Quality System

Indica's data-quality standard is conservative: a dataset is not article-ready because it was fetched successfully. It is article-ready only after the source, artifact, transformation, and article evidence all pass explicit checks.

## Quality Gates

1. **Discovery gate**
   - Source has owner, base URL, access mode, cadence, reliability class, and article potential.
   - Dataset/resource has title, publisher, release date or vintage, file type, geography, dimensions, and access notes.
   - Hidden dashboards and PDFs are allowed, but they must be labelled by extraction method.

2. **Fetch gate**
   - Raw source payload is snapshotted before transformation.
   - Snapshot path and raw hash are written to a source manifest.
   - Secrets never appear in logs, manifests, source URLs, or artifacts.

3. **Normalization gate**
   - Output must be either a `series` artifact or a `table` artifact.
   - Required metadata: source id, source indicator id, source URL, fetched timestamp, unit, geography, frequency where relevant.
   - Series observations must be sorted, non-duplicated, parseable by date/frequency, and finite where non-null.
   - Table rows must preserve dimensions and uncertainty fields rather than flattening too early.

4. **Validation gate**
   - Run:

```bash
npm run validate:data
npm run validate:source-discovery
npm run explain:v1:validate
```

   - `validate:data` checks normalized artifacts, manifests, snapshot hashes, row counts, secret-like source URLs, and configured cross-source sanity checks.
   - `validate:data:strict` also fails on warnings. Use it before publishing a source-heavy article.

5. **Article gate**
   - Every factual number must come from the locked evidence packet.
   - The article must state source, method, caveat, and latest available year.
   - Cross-source disagreements must be visible in the source note, not hidden by prose.

## Cross-Source Checks

Configured checks live in:

```text
data/quality/cross-source-checks.json
```

These are sanity checks, not source-precedence rules. Example: World Bank life expectancy and WHO life expectancy should be broadly aligned, but WHO may be preferred for a health article while World Bank may be preferred for a global comparison page.

Add a cross-source check when:

- two reputable sources publish the same or near-same measure;
- a source is newly added and needs a guard against wrong units or dimensions;
- a PDF/table extractor could silently shift columns;
- a derived series depends on a denominator from another source.

## Source Precedence

Use the closest canonical source unless the article needs comparability.

| Topic | Prefer | Use for context |
| --- | --- | --- |
| RBI monetary/finance data | RBI DBIE | IMF, World Bank, IndiaDataHub |
| National accounts | MoSPI / IndiaDataHub / RBI where applicable | World Bank, IMF |
| Labour and jobs | PLFS/MoSPI | ILOSTAT, World Bank |
| Household consumption | HCES/MoSPI | World Bank poverty/context sources |
| Health outcomes | WHO, NFHS, SRS where applicable | World Bank, UNICEF |
| Child welfare/WASH | NFHS, UNICEF, WHO | World Bank |
| Education | UDISE+, AISHE, Census | UNESCO/World Bank |
| Energy/power | CEA, Grid India, MNRE, PPAC, Coal Ministry | Ember, EIA, OWID |
| Agriculture/food | MoSPI, Agriculture Census, APY, Agmarknet, IMD | FAOSTAT |
| Crime/suicides | NCRB | no source can remove reporting-bias caveats |

## Adapter Acceptance Criteria

An adapter is production-ready only when it can:

- discover or list the datasets/indicators it supports;
- fetch a small known sample reproducibly;
- write immutable raw snapshots through the ingest script;
- normalize to canonical artifacts;
- write a manifest with artifact path, snapshot path, raw hash, fetched timestamp, and row/observation count;
- fail loudly on schema or table-heading changes;
- pass `npm run validate:data`;
- document source cadence, caveats, and source-precedence role.

## RBI DBIE Strategy

RBI DBIE is high-quality but difficult because the website is table/report oriented rather than a clean public JSON API. Treat it as an official source family with staged adapters:

1. Discovery: enumerate time-series publications, table IDs, downloadable CSV/XLS/PDF endpoints, and release calendar pages.
2. Manifest-only inventory: store table names, URLs, publication date, frequency, sector, and article potential before normalizing values.
3. One-table proof: pick a narrow table such as policy rates, CPI/WPI references where exposed, bank credit/deposits, or forex reserves.
4. Parser hardening: validate table headings, units, date columns, and known latest values before writing a normalized artifact.
5. Cross-source sanity: compare selected macro series against IndiaDataHub/World Bank/IMF where definitions overlap.

Do not build RBI as a scraper blob. Build it as a table registry plus many small table adapters.
