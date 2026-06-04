# Heat Mortality Data Audit

Last updated: 2026-06-03

This note records close checks on the heat mortality evidence packet. It is meant to prevent overclaiming from mechanically extracted numbers.

## IMD DWE 2024 Audit

Source: `data/snapshots/heat-mortality/imd-disastrous-weather-events-2024.pdf.9ca124cf135e.pdf`

Parsed artifacts:

- `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_summary.json`
- `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_state.json`
- `data/series/heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_month.json`
- `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_totals.json`
- `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_state.json`
- `data/series/heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_month.json`

Checks performed:

1. Table 2 reports `Heat Wave` casualties = 460.
2. Table 7 reports monthly `Heat Wave` deaths:
   - March 1
   - April 39
   - May 185
   - June 235
   - All other months 0
   - Sum = 460
3. Table 22 reports state/UT `Human Deaths` due to Heat Wave:
   - Uttar Pradesh 240
   - Bihar 63
   - Telangana 46
   - Jharkhand 35
   - Maharashtra 28
   - Odisha 16
   - Rajasthan 16
   - Chhattisgarh 7
   - Madhya Pradesh 5
   - Kerala 2
   - Delhi 1
   - West Bengal 1
   - Sum = 460
4. Table 1 annual state-wise table also has `Heat Wave` grand total = 460.
5. The dedicated 2024 extractor and historical extractor agree on values. Their only differences are source-table label strings.

Confidence:

- High confidence that the extracted IMD 2024 heatwave count is faithful to the PDF.
- Low confidence that the count measures true heat-attributable mortality. It measures reported disaster deaths under IMD's DWE compilation method.

## IMD DWE Source Definition Caveat

The IMD DWE 2024 disclaimer says the publication is sourced from media reports and government Disaster Management Authority reports, and that weather-event dynamics and data-collection limitations should be considered.

The preface says IMD DWE reports have been published since 1967 and that the data are derived from national and state Disaster Management Institutes, press information, and reports from IMD Regional Meteorological Centers and Meteorological Centers.

Implication:

- IMD DWE is valuable as an official meteorological disaster-event record.
- It is not a Civil Registration System dataset.
- It is not a medically certified cause-of-death dataset.
- It is not an all-cause excess-mortality dataset.
- For the article, use language like "IMD reported heatwave deaths" or "IMD disaster-event deaths", not "the number of Indians killed by heat."

## IMD Historical Availability

IMD's library page says the annual Disastrous Weather Events publication is available for 1967-2024. Recent reports say:

- The publication began in 1967.
- It moved to event-wise tabular presentation from 1977.
- Since 2013, it has systematically covered major disastrous weather-event categories including heat wave.

Current local artifact status:

- 2024 is locally cached and parsed.
- 2013-2023 are not yet locally cached in `data/snapshots/heat-mortality/`.
- Local Node/curl attempts to download 2023 timed out on 2026-06-03.
- Browser-backed inspection of the public 2023 PDF succeeded.

Manual browser-backed 2023 cross-check:

- Source: `https://www.imdpune.gov.in/library/public/DWE_2023.pdf`
- Table 1 annual state-wise table reports `Heat Wave` grand total = 181.
- Table 2 reports `Heat Wave 181`.
- Table 7 monthly table reports `Heat Wave` grand total = 181.
- Seasonal narrative says 37 heatwave deaths in pre-monsoon and 144 in monsoon, summing to 181.

Important: the 2023 value is a primary-PDF cross-check, but it is not yet in the local structured artifact because the PDF is not locally snapshotted.

## Parser Risk

Known risks for historical extraction:

- Older PDFs may alter table order, event names, or column layout.
- Browser text, `pdftotext`, and OCR may order multi-column pages differently.
- Table of contents entries can resemble table headings; the historical parser now uses the last matching table section to avoid parsing TOC lines for Table 22.
- Some reports use `Lightning with Thunderstorm`; 2024 uses `Lightning associated with Thunderstorm`.
- Some years include `Dust Storm`; 2024's front matter says 11 categories and does not include dust storm in the annual table.

Validation required before publishing historical series:

- Each parsed annual heatwave total should match at least two of: annual Table 1, event Table 2, monthly Table 7, statewise heatwave loss table.
- State totals should sum to annual total when statewise table is extracted.
- Month totals should sum to annual total when monthly table is extracted.
- Any year failing reconciliation should be marked `needs_review` rather than published as a clean annual point.
