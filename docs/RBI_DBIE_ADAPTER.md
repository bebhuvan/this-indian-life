# RBI DBIE Adapter

RBI DBIE is treated as an official source family, not one scraper. The adapter layer talks to the public DBIE gateway and HDFS download endpoints; ingest scripts decide which tables are evidence-ready, preserve raw snapshots, normalize artifacts, and write manifests.

## Evidence-Ready Jobs

| Command | Output | Evidence status |
| --- | --- | --- |
| `npm run ingest:rbi-dbie-forex-reserves` | `data/series/rbi-dbie.IN.forex_reserves.weekly.json` | Production evidence |
| `npm run ingest:rbi-dbie-macro-timeseries` | Long macro table artifacts for the official `MacroeconomicIndicators` and `OtherMacroeconomicTimeseriesData` workbooks | Production evidence after parser gates |
| `npm run derive:rbi-dbie-macro-series` | 50 named article-ready series in `data/catalog/rbi-dbie-derived-series.json` | Production evidence when parent artifacts validate |
| `npm run discover:rbi-dbie-reports` | `data/catalog/rbi-dbie-report-inventory.json` | Discovery only |

`data/catalog/rbi-dbie-manifest.json` is the source manifest. It includes the forex artifact, long macro parent artifacts, and derived RBI series.

## Quality Gates

Forex reserves:

- require non-empty rows for INR and USD reserve slices;
- validate date, reserve code, unit, and finite non-negative values;
- reject duplicate currency/code/date keys;
- reconcile total reserves against foreign currency assets, gold, SDR, and IMF components within 0.01%.

Macro workbook ingest:

- downloads official DBIE HDFS XLSX files and snapshots raw workbook bytes;
- rejects non-XLSX responses and unexpectedly small downloads;
- checks expected sheet names and minimum numeric row counts;
- writes finite numeric observations only;
- rejects duplicate dataset/frequency/period/indicator keys;
- reconciles latest foreign currency assets against the forex reserves artifact when available.

Derived macro series:

- selects columns by exact parent artifact, source label, frequency, and unit;
- records the parent artifact hash in every child series;
- rejects duplicate period keys and non-finite values;
- enforces a minimum observation count per selected series.

## Current Coverage

The derived RBI catalog currently covers policy rates, liquidity ratios, money-market rates, government securities, bank credit and deposits, money supply, price and production indexes, trade, FDI/FPI, foreign exchange reserves, digital payments, public finance, national accounts, and housing prices.

Use `data/catalog/rbi-dbie-derived-series.json` as the article-generation discovery surface. Do not infer article-ready RBI coverage from the report inventory alone.

## Discovery-Only Surface

The DBIE report inventory can enumerate report IDs and resolve some encrypted report links. Those links often point into a SAP BusinessObjects viewer. Treat them as discovery metadata until a report-specific adapter can fetch a stable downloadable or JSON payload, preserve the source snapshot, and validate the table headings, units, periods, and row semantics.

## Expansion Rule

Add RBI data one table at a time:

1. Identify the source endpoint or official downloadable file.
2. Snapshot the raw response before parsing.
3. Encode exact table labels, units, frequency, and period parsing.
4. Add source-specific reconciliation or known-value checks.
5. Add the job to `data/catalog/ingestion-jobs.json`.
6. Run `npm run validate:pipeline` and `npm run build`.
