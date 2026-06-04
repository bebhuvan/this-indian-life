# How India Borrows: Data Plan

This article should not rely on one headline credit number. It needs a layered evidence spine:

1. total bank credit and non-food credit;
2. credit relative to deposits;
3. long-run banking-system credit to the commercial sector;
4. household-facing credit, especially personal loans and housing;
5. sector, industry, occupation, account type, loan-size, interest-rate, geography, and gender splits as DBIE adapters become evidence-ready.

## Evidence-Ready Now

These RBI DBIE series are already normalized and validation-backed:

| Indicator | Frequency | Coverage | Use |
| --- | --- | --- | --- |
| `banking.rbi.bank_credit_fortnightly` | Fortnightly | 2017-10-13 to 2026-05-15 | Headline bank credit level |
| `banking.rbi.non_food_credit_fortnightly` | Fortnightly | 2017-10-13 to 2026-05-15 | Credit to the economy excluding food procurement |
| `banking.rbi.aggregate_deposits_fortnightly` | Fortnightly | 2017-10-13 to 2026-05-15 | Funding base for bank credit |
| `banking.rbi.credit_deposit_ratio_fortnightly` | Fortnightly | 2017-10-13 to 2025-08-22 | Lending intensity versus deposits |
| `banking.rbi.credit_to_commercial_sector_monthly` | Monthly | 1961-03 to 2026-05 | Long-run credit backbone |
| `banking.rbi.govt_plus_commercial_credit_monthly` | Monthly | 1999-04 to 2026-05 | Broad banking-system credit context |
| `banking.rbi.personal_loans_monthly` | Monthly | 2007-04 to 2026-03 | Household/personal borrowing |
| `banking.rbi.housing_credit_monthly` | Monthly | 2007-04 to 2026-03 | Mortgage/housing borrowing |

## Coverage Matrix

The DBIE credit coverage matrix is:

```text
data/catalog/rbi-dbie-credit-coverage-matrix.json
```

It currently maps 189 DBIE credit-relevant reports into article themes. Nineteen high-priority reports have been probed and currently resolve to SAP BusinessObjects viewer links. Treat those links as discovery-only until a stable raw table/download path is available.

The current access probe is:

```text
data/catalog/rbi-dbie-credit-access-probe.json
```

Current probe findings:

- `/login_getSapToken` followed by `/dbie_getReportLink` can produce tokenized OpenDocument URLs for the 19 high-priority credit reports.
- The tokenized OpenDocument flow reaches a BO/OpenDocument shell and exposes an `AnalyticalReporting/WebiView.do` URL, but direct GET/POST fetches of that WebI URL return a 418 unauthorized page outside the browser callback context.
- DBIE Data Query exposes 11 credit/borrowing/deposit-related DSD elements. The most relevant structured credit candidate found so far is `LNA_SCB_SR_OCC_BSR1_A_RN`, "Loans and Advances of SCBs State and Occupation wise BSR1 Annual".
- The BSR credit DSD codelist exposes four dimensions: measure type, occupation group, state, and unit. A minimal generated policy is accepted and DDL is created, but the current Impala payload returns zero rows. It is not evidence-ready yet.

## First Adapter Targets

| Priority | Report ID | Report | Why it matters |
| --- | ---: | --- | --- |
| 1 | 40 | Deployment of Gross Bank Credit by Major Sectors | Agriculture / industry / services / personal split |
| 1 | 44 / 540 | Industry-Wise Deployment of Bank Credit | Which industries borrow |
| 3 | 944 | Outstanding credit by occupation | Who borrows by economic activity |
| 4 | 945 / 1086 | Outstanding credit by type of account | What form borrowing takes |
| 4 | 947 / 1085 | Outstanding credit by size of credit limit | Concentration by loan size |
| 4 | 948 / 1129 | Outstanding credit by interest rate range | Borrowing cost distribution |
| 6 | 963 / 1153 / 1456 | State/district credit by occupation | Geography of borrowing |
| 7 | 1553 / 1555 | District and gender-wise credit to individuals | Gender lens for individual borrowing |

## Access Work Still Needed

1. Reproduce the browser callback from the tokenized OpenDocument shell into WebI without getting the 418 unauthorized page.
2. Once WebI loads, identify the export/download endpoint and preserve raw XLS/CSV/PDF bytes before parsing.
3. For Data Query, reproduce the exact UI-equivalent dimension filter payload for `LNA_SCB_SR_OCC_BSR1_A_RN` so the accepted policy returns non-empty rows.
4. Promote only after raw source bytes or raw JSON are snapshotted and table dimensions reconcile.

## Publishing Rule

Do not use a DBIE report table as article evidence until the adapter can:

- preserve the raw source payload;
- validate table title, period, units, and dimensions;
- reject duplicate keys and non-finite values;
- reconcile totals where a table reports subtotals;
- write a manifest entry with raw hash and artifact path;
- pass `npm run validate:data`.

Until then, BO viewer report links are discovery metadata only.
