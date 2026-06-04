# Energy Source Discovery

This note tracks the India energy sources needed for the bigger "What powers India?" story. Status words are literal:

- **ingested**: artifacts are written under `data/series`.
- **adapter-ready**: code exists, but credentials or source access block a clean run.
- **discovery-only**: public pages/files are mapped, but parsing is not production-ready.

## Current Status

| Source | Status | Script | What it exposes | Current output |
| --- | --- | --- | --- | --- |
| EIA International | ingested | `npm run ingest:eia` | broad energy balance, production/consumption, capacity, CO2 by fuel | 26 India historical annual series |
| Ember | ingested | `npm run ingest:ember` | electricity generation, demand, power emissions, grid carbon intensity | India electricity table artifacts |
| PPAC | ingested plus gated history discovery | `npm run ingest:ppac`; `npm run discover:ppac-import-export` | official petroleum import/export workbook and historical import/export page | current monthly import/export table artifact; historical file names catalogued as discovery |
| Official source discovery | ingested as discovery snapshots | `npm run discover:energy-sources` | PPAC, CEA, Grid India, MoSPI, MNRE, Ministry of Coal, UN Comtrade public link surfaces | `data/catalog/official-energy-discovery-manifest.json` plus per-source snapshots |
| UN Comtrade | ingested via public preview | `npm run ingest:un-comtrade-energy` | partner-level imports by HS commodity | 2024 India imports for crude oil, petroleum products, coal, coke, LNG, and gas commodity registry |
| Ministry of Coal | discovery-only | `npm run discover:energy-sources` | coal directory PDFs/Excel files, import/export pages, production/supply pages | parser not promoted yet |
| MNRE | discovery-only | `npm run discover:energy-sources` | renewable statistics PDFs, annual reports, other reports | parser not promoted yet |
| CEA / Grid India | discovery-only | `npm run discover:energy-sources` | CEA data/API pages, Grid India PSP report pages | CEA access is network-fragile; Grid India PSP is date/report driven |
| MoSPI Energy Statistics | discovery-only | `npm run discover:energy-sources` | Energy Statistics publication pages/reports | parser not promoted yet |

## What Each Source Is For

### EIA

Use for the all-energy layer:

- total energy consumption and production;
- coal, petroleum, gas, nuclear, renewables consumption;
- matching fuel production where available;
- coal imports and gas imports;
- electricity capacity by broad source;
- energy-related CO2 emissions by fuel.

EIA is not India-official, but it is consistent and machine-readable. It should complement Indian official sources, not replace them where a clean Indian table exists.

### PPAC

Use for the petroleum dependence layer. The current parseable workbook is:

```text
https://ppac.gov.in/uploads/pages/1669199925_Import-Export-C.xlsx
```

The adapter parses the import/export sheet into rows:

```text
section, item, month, monthIndex, value
```

Known caveat: this workbook is a current-period workbook, not a full historical archive.

The historical import/export page is:

```text
https://ppac.gov.in/import-export/history
```

It exposes three workbook names in the page HTML: quantity, value in rupees, and value in dollars. Direct automated fetch currently returns HTML/login-wrapper content rather than XLSX bytes, so `discover:ppac-import-export` records these files as non-evidence targets until a stable raw-download path is available.

If the files are downloaded manually after PPAC login, run:

```bash
PPAC_HISTORY_QUANTITY_XLSX=/path/to/1751964547_PT_IMPORT_TMT_H.xlsx \
PPAC_HISTORY_VALUE_RUPEES_XLSX=/path/to/1751964598_PT_IMPORT_VAL_RS.CRS._H.xlsx \
PPAC_HISTORY_VALUE_USD_XLSX=/path/to/1751964622_PT_IMPORT_VAL_US$_H.xlsx \
npm run ingest:ppac-history-local
```

The manual ingest snapshots the raw XLSX files, parses annual summary and fiscal-year monthly sheets, and blocks if monthly rows do not reconcile against reported totals.

### Grid India / CEA

Use for the operational power-system layer:

- peak demand;
- shortage/surplus;
- daily power supply position;
- regional and state-level power balances.

Grid India's PSP endpoint is report/date driven. CEA pages are official but had local network resets during discovery. Promote only after a stable HTML/API/file path is verified and snapshot-safe.

### MoSPI Energy Statistics

Use as the canonical annual Indian energy-reference layer:

- reserves;
- production;
- trade;
- installed capacity;
- consumption;
- energy balance tables.

Expected adapter shape: PDF/Excel discovery first, then table-specific parsers. Do not blend MoSPI tables into EIA units without explicit transformations.

### MNRE

Use for official renewable capacity/reporting. Current public surface exposes renewable statistics and report PDFs. Next parser should target the newest statistics PDF or any linked Excel/CSV table if discovered.

### Ministry of Coal

Use for official coal production, offtake, imports/exports, and Coal Directory tables. Current public surface exposes Coal Directory chapter Excel/PDF files and import/export pages. Next parser should start with Coal Directory 2024-25 chapter files if their Excel links remain stable.

### UN Comtrade

Use for partner-origin trade stories:

- where India's crude oil comes from;
- where India's coal comes from;
- LNG/gas import partner mix;
- petroleum-products import/export partner mix.

Current registry covers HS `270900`, `2710`, `2701`, `2704`, `271111`, and `271121`. The adapter defaults to `public/v1/preview`, which works without a subscription key. A subscription key can still be used with `UN_COMTRADE_ENDPOINT=data/v1/get` for the full API.

## Verification Commands

```sh
npm run discover:energy-sources
npm run ingest:eia
npm run ingest:ppac
npm run build
```

Optional after key setup:

```sh
UN_COMTRADE_PERIOD=2024 npm run ingest:un-comtrade-energy
```
