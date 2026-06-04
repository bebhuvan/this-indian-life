# PDF Extraction Playbook

This is the extraction policy for government PDFs in Indica.

The short version: **do not OCR first**. Most recent ministry PDFs are digitally generated documents with embedded text. For those, native text/table extraction is faster, cheaper, and usually more faithful than OCR or an LLM parser.

## Extraction Ladder

Use the lowest-risk method that works.

1. **Machine-readable file**
   - Prefer CSV, XLSX, JSON, SDMX, OData, or API responses.
   - Preserve raw source response and normalize from there.

2. **Native PDF text**
   - Use `pdftotext -layout` and/or `pdfplumber`.
   - Best for Microsoft Word / tagged PDFs, RBI reports, TRAI releases, many MoSPI PDFs.
   - Numbers come from embedded PDF text, not OCR.

3. **Native PDF table extraction**
   - Use `pdfplumber` table extraction where the table grid is stable.
   - Validate with row/column counts, expected labels, and arithmetic checks.

4. **OCR / layout OCR**
   - Use Paddle/Akshara, Tesseract, or another OCR engine only when native PDF text is missing or unusable.
   - Good for scanned reports, image-only state factsheets, old documents, and complex visual layouts.

5. **LLM / LlamaParse / VLM**
   - Use as a fallback or cross-check, not as numeric truth by default.
   - Useful when table structure is hard to recover deterministically.
   - All extracted numbers must still be validated against source text, tables, arithmetic checks, or independent extraction.

## Current TRAI Test

Test PDF:

```text
data/snapshots/trai-pdf/PR_No.63of2026_0.pdf
https://www.trai.gov.in/sites/default/files/2026-05/PR_No.63of2026_0.pdf
```

Result:

- The PDF is a Microsoft Word-generated text PDF.
- `pdftotext -layout` extracts the headline table cleanly.
- `pdfplumber` detects tables but with noisy columns on some pages.
- Paddle/Akshara `structure-v3` successfully converts page 1 into an HTML table, but it also introduces OCR typos such as `Milion`.

Conclusion:

- For this source, native text extraction should be primary.
- Paddle/Akshara is useful as a layout/table fallback.
- OCR output should not override native text numbers unless native text is absent or visibly broken.

## Working TRAI Extractor

Command:

```bash
npm run extract:trai-pdf -- \
  --pdf data/snapshots/trai-pdf/PR_No.63of2026_0.pdf \
  --source-url https://www.trai.gov.in/sites/default/files/2026-05/PR_No.63of2026_0.pdf \
  --title "Telecom Subscription Data as on April 2026"
```

Outputs:

```text
data/series/trai.IN.telecom_subscription_summary.2026-04.json
data/catalog/trai-pdf-extraction-manifest.json
data/snapshots/trai-pdf-text/*.json
```

The extractor currently captures:

- broadband subscribers;
- urban/rural/total telephone subscribers;
- net additions;
- monthly growth rates;
- urban/rural subscriber shares;
- tele-density with and without M2M;
- mobile number portability requests;
- active wireless mobile subscribers on peak VLR date.

Validation currently checks:

- required metrics are present;
- million-count rows approximately satisfy `wireless + wireline = total`;
- extraction fails if required rows are missing.

## Paddle/Akshara Path

Do not copy the whole Akshara/Paddle repository into Indica. It contains its own `.git`, `.venv`, outputs, tests, and book-digitization-specific code.

Use it as an external local engine. Indica now has a wrapper for this path:

```bash
npm run extract:trai-pdf -- \
  --pdf data/snapshots/trai-pdf/PR_No.19of2026_0.pdf \
  --source-url https://www.trai.gov.in/sites/default/files/2026-02/PR_No.19of2026_0.pdf \
  --title "Telecom Subscription Data as on 31st December 2025" \
  --ocr-fallback
```

The wrapper:

1. renders selected PDF pages with `pdftoppm`;
2. runs Akshara/Paddle `structure-v3` on the page image;
3. disables dewarp, orientation correction, and chart recognition for already-flat government report pages;
4. reads the raw layout JSON under Akshara's `_raw` output, not just Markdown;
5. parses the returned HTML table;
6. repairs known row-splitting cases, such as urban/rural tele-density in TRAI December 2025;
7. stores OCR snapshots under `data/snapshots/trai-paddle-structure`;
8. validates extracted numbers against deterministic required-row and arithmetic checks.

Recommended Akshara profile for report tables:

```text
model: structure-v3
page render: pdftoppm, page 1, 180 DPI PNG
dewarp: off
orientation correction: off
chart recognition: off
input: rendered image, not PDF
truth source: raw layout JSON + validation, not Markdown prose
```

Batch command:

```bash
npm run ingest:trai-subscriptions -- --limit 12 --ocr-fallback
```

Production registry:

- source inventory: `data/catalog/source-inventory.seed.json`, sourceId `trai`;
- production job: `data/catalog/ingestion-jobs.json`, jobId `ingest-trai-subscriptions`;
- validation job: `data/catalog/ingestion-jobs.json`, jobId `validate-trai-subscriptions`;
- source display metadata: `src/data/site.ts`, source key `trai`;
- connected-India evidence: `q.society.connected` uses the derived TRAI series through the V1 registry visual plan.

The production job intentionally ingests the latest 12 monthly reports by default. That gives the article a current high-frequency view while keeping OCR/API fallback cost bounded. Larger historical backfills should be run as separate sampling jobs until each older TRAI template has its own validation profile.

Historical backfill command:

```bash
AKSHARA_TIMEOUT_MS=240000 npm run ingest:trai-subscriptions:historical
```

The historical command:

- uses cached TRAI source discovery by default, because `www.trai.gov.in` can time out during live discovery;
- skips non-monthly corrigenda;
- uses the historical partial validation profile for older reports;
- runs OCR fallback only from January 2025 onward by default;
- writes `data/catalog/trai-subscriptions-historical-manifest.json`;
- merges parsed observations into the same nine TRAI monthly series used by articles.

To refresh TRAI discovery before the historical run, call the ingest directly with `--refresh-discovery`:

```bash
AKSHARA_TIMEOUT_MS=240000 node scripts/ingest-trai-subscriptions.mjs \
  --refresh-discovery \
  --max-pages 50 \
  --limit 0 \
  --manifest-name trai-subscriptions-historical \
  --historical-partial \
  --skip-non-monthly \
  --ocr-fallback \
  --ocr-min-month 2025-01 \
  --ocr-dpi 120
```

Current historical backfill result:

- Cached TRAI discovery exposes 215 PDF entries.
- The current parser wrote 206 validated table artifacts from 215 ready monthly report entries after de-duplicating repeated months in the output series.
- The nine monthly TRAI series now contain 204 monthly observation slots from December 2008 to April 2026.
- Production latest-12 ingest preserves those historical observations by merging new monthly observations into existing series.
- Reports from January 2011 onward usually include the richer urban/rural headline table.
- Several December 2008-December 2010 reports only publish national summary values in the first-page release. For those, the parser extracts total/wireless/wireline subscribers, total broadband subscribers, total teledensity, and active VLR when present; urban/rural subscriber values and MNP requests remain null when the source does not publish them.
- The historical manifest currently has zero failed reports. The hardest cases are November 2024, January 2021, September 2019, and the scanned September/October/December 2020 PDFs; these use narrow PDF-text repair or verified scanned-headline fallback profiles and should be rechecked if TRAI republishes those PDFs.

Current test result:

- April 2026, March 2026, February 2026, and January 2026 parse through native PDF text.
- December 2025 is image-only for `pdftotext` and parses through Paddle `structure-v3`.
- November 2025 through May 2025 parse through native PDF text after allowing older punctuation and single-row teledensity variants.
- The latest-twelve batch writes twelve validated table artifacts and nine monthly TRAI series.

Operational caveats:

- Paddle calls are bounded by `AKSHARA_TIMEOUT_MS`, defaulting to 120 seconds.
- Existing Paddle raw layout JSON is reused, so repeated validation runs do not keep calling the OCR API.
- Large backfills should still start with a limited sample because TRAI PDF templates can change without warning.

## LlamaParse / LitParse Path

LlamaParse can be useful for image-heavy factsheets or difficult tables. It should be treated like Paddle:

- a fallback parser;
- a structure recovery tool;
- never the only authority for published numbers.

Use it when:

- native text is empty or badly ordered;
- OCR table structure is better than `pdfplumber`;
- the source has scanned pages with charts/tables.

Do not use it when:

- `pdftotext` already gives clean source text;
- the needed table can be parsed deterministically;
- the output cannot be validated.

## Caveats For Published Data

Every PDF-derived artifact should record:

- PDF URL;
- local snapshot path;
- PDF hash;
- extraction method;
- page number and table/section label where possible;
- validation checks;
- caveat about PDF layout changes.

Every article using PDF-derived data should say:

- the source is an official report PDF;
- numbers were extracted from the PDF and validated by explicit checks;
- subscriber or administrative counts are not always unique people.
