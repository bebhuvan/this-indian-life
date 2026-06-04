# India Government Data Infrastructure

This is Indica's working plan for turning scattered Indian government data sources into reusable article infrastructure.

The goal is not to scrape one page. The goal is to build repeatable source adapters that can discover datasets, preserve source snapshots, validate what was found, and then feed article generation with locked evidence.

## Current Discovery Command

Run:

```bash
npm run discover:india-gov
npm run validate:source-discovery
```

The discovery command writes:

```text
data/catalog/india-gov-source-discovery.json
```

For PDFs, use [PDF_EXTRACTION_PLAYBOOK.md](./PDF_EXTRACTION_PLAYBOOK.md). The rule is to try native text/table extraction first, then OCR/Paddle/LlamaParse only when deterministic extraction fails.

Use `--deep` for a broader NADA/TRAI pass:

```bash
node scripts/discover-india-gov-sources.mjs --deep
```

## What The Discovery Currently Covers

| Source | Adapter status | What we can get now | Article families |
| --- | --- | --- | --- |
| MoSPI Microdata Library / NADA | Working discovery adapter | Catalog records, titles, IDs, modified dates, public-use access flags, metadata JSON endpoint, data-dictionary file lists, related-material download links | Jobs, consumption, industry, education, health, telecom, time use, informal enterprise |
| TRAI telecom reports | Working discovery adapter | Monthly telecom-subscription report titles, release dates, PDF URLs, file sizes where exposed | Connectivity, internet infrastructure, rural/urban subscriptions, telecom market structure |
| NDAP | Probe only | Experimental search/catalog endpoint shape | District/state cross-ministry indicators after endpoint stabilization |
| data.gov.in | Key-gated template only | API URL template; blocked without valid API key in this environment | Broad ministry datasets after `DATAGOVIN_API_KEY` |
| RBI DBIE | Partial production adapter plus discovery | Weekly forex reserves JSON, official macro workbook snapshots, curated derived macro series, report inventory | Banking, inflation, credit, deposits, monetary policy, money markets, payments, external sector, public finance, national accounts, housing |
| NFHS / DHS / IIPS | Registry item plus local NFHS artifacts | Factsheet/microdata path, already partially represented in repo | Health, fertility, nutrition, sanitation, women's lives, digital access |
| Census India | Registry item | File/page-backed path | Population, literacy, migration, households, settlement structure |
| MoSPI / eSankhyiki | Registry item | Official table/download source; endpoint discovery pending | National accounts, prices, IIP, official macro statistics |

## NADA Is The First Big Win

NADA exposes the highest-value hidden archive because it is one catalog covering many official unit-level datasets.

The sample discovery run found records such as:

- ASUSE 2025 and earlier ASUSE rounds;
- PLFS monthly, quarterly, calendar-year, and annual files;
- Annual Survey of Industries;
- Comprehensive Modular Survey on Education, 2025;
- Comprehensive Modular Survey on Telecom, 2025;
- Household Consumption Expenditure Survey, 2023-24 and 2022-23;
- Time Use Survey, 2024 and 2019;
- CAMS 2022-23 and MIS 2020.

The adapter lives at:

```text
scripts/adapters/nada.mjs
```

It supports:

- catalog page fetch and parse;
- study metadata JSON fetch;
- data dictionary fetch and parse;
- related-material links fetch and parse.

Next NADA ingestion adapters should be survey-specific, not generic:

- `ingest-plfs.mjs`: labour-force participation, unemployment, worker type, employment sector, gender/state/age splits.
- `ingest-hces.mjs`: consumption, MPCE, item groups, rural/urban/state distributions.
- `ingest-asi.mjs`: factories, workers, output, wages, sector/state manufacturing structure.
- `ingest-cmst.mjs`: 2025 telecom survey, better successor to CAMS for connection stories.
- `ingest-cmse.mjs`: education participation, digital learning, schooling/training.
- `ingest-tus.mjs`: unpaid work, paid work, gendered time use.
- `ingest-asuse.mjs`: informal and unincorporated enterprise economy.

## TRAI Is PDF-Backed But Discoverable

TRAI does not expose clean table JSON for the telecom subscription reports. The current adapter discovers monthly report PDFs from the report listing.

The adapter lives at:

```text
scripts/adapters/trai.mjs
```

Current output includes recent monthly report PDFs such as April 2026, March 2026, February 2026, and older months. A future `ingest-trai-subscriptions.mjs` should:

1. download the PDFs to `data/snapshots/trai`;
2. extract the main telecom tables with a PDF/table extractor;
3. validate month continuity and table headings;
4. write normalized series for:
   - wireless subscribers;
   - wireline subscribers;
   - broadband subscribers;
   - internet subscribers by access type;
   - rural/urban subscribers;
   - active/VLR subscribers where available;
   - circle/state-level telecom figures where consistently available.

## Validation Rules

Discovery validation lives at:

```text
scripts/validate-source-discovery.mjs
```

It checks:

- source registry has IDs, owners, base URLs, access modes, and article potential;
- NADA returned records;
- NADA focus records expose data-dictionary files where possible;
- TRAI returned valid PDF URLs;
- data.gov.in key status is explicit;
- embedded discovery warnings are surfaced.

Validation warnings are acceptable during discovery. Errors should block publishing or automated ingestion.

## Adapter Design Rules

Every source adapter should follow the existing project contract:

1. Adapter fetches source data only. It does not write files.
2. Ingest script chooses datasets, writes snapshots, normalizes artifacts, and writes manifests.
3. Raw source responses must be preserved before transformation.
4. Survey microdata estimates must use source weights.
5. PDF-derived numbers must record the PDF URL, report month, page/table label, and extraction method.
6. Cross-source article generation should only use normalized artifacts with source provenance.

## Immediate Build Order

1. **NADA deep discovery**: run `node scripts/discover-india-gov-sources.mjs --deep` and store the full catalog.
2. **Survey file acquisition policy**: decide which public-use microdata files can be downloaded automatically and which require manual/login workflow.
3. **PLFS adapter**: highest article value for jobs, women, unemployment, youth, agriculture/non-farm work.
4. **HCES adapter**: poverty-adjacent consumption, food/non-food spending, rural/urban/state welfare.
5. **CMST/CAMS adapter**: digital access, mobile/internet use, digital payments, who is disconnected.
6. **TRAI PDF extraction**: infrastructure series for the connectivity article family.
7. **RBI DBIE table expansion**: the core forex/macro path is live; add one report/table adapter at a time only after stable downloadable or JSON evidence and table-specific validation are confirmed.
8. **data.gov.in authenticated discovery** once `DATAGOVIN_API_KEY` is available.

## Article Generation Implication

Indica should maintain a source inventory before asking for article ideas. Good article generation becomes possible when the system knows:

- what datasets exist;
- what dimensions each has;
- what years/geographies are covered;
- whether data is API, file, PDF, or microdata;
- whether estimates are directly publishable or need survey weighting/table extraction.

This discovery layer is therefore part of the editorial pipeline, not only engineering plumbing.
