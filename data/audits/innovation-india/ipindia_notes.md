# IP India patent tables: extraction notes

Story: "How innovative is India?" Source: Office of the Controller General of Patents, Designs
and Trade Marks (CGPDTM, "IP India"), Annual Reports 2014-15 to 2024-25, English editions,
listed at https://ipindia.gov.in/annual-report and retrieved 20 October 2026. Files, URLs and
SHA-256 hashes: `data/raw/ipindia-patents/manifest.json`. Extraction code:
`scripts/stories/innovation-india/extract_ipindia.py`. Output: `ipindia_extract.json` (every
value with file, PDF page, table, row label, column and the raw source text) and
`ipindia_selfcheck.json`.

Page numbers below are PDF page indices (1-based), not the folio printed on the page.

## What each table measures

| Table (key in extract) | What it counts | Reports used | Years covered |
|---|---|---|---|
| `category` "Distribution of applications category-wise" | Applications filed in the year, by the fee category the applicant claims: Natural Person (NP), Startup (SU), Small Entity (SE), Educational Institution (EI, from 2021-22), Other than Natural Persons (ONP), each split Indian / foreign | 2017-18 to 2024-25 (each report prints up to five years) | 2016-17 to 2024-25 |
| `state` Appendix B | Applications by Indian applicants, by "state of origin", separately for ordinary, convention and PCT national-phase routes; current and previous year | 2014-15 to 2024-25 | 2013-14 to 2024-25 |
| `appC` Appendix C | Applications by residents (Indian applicants) and non-residents (ordinary, convention, national phase), ten years | 2016-17, 2018-19, 2020-21 to 2024-25 | 2007-08 to 2024-25 |
| `appD` Appendix D | Applications filed, examination requests, abandonments u/s 9(1) and 21(1), patents granted (Indian / foreign patentee), patents in force (Indian / foreign), ten years | 2016-17, 2017-18, 2018-19, 2020-21 to 2024-25 | 2006-07 to 2024-25 |
| `top` | Top Indian applicants: IT field (top 5), scientific R&D organisations (top 10), academic institutes and universities (top 10); 2016-17 also an overall top 5 | 2014-15 to 2024-25 | same |

Headline series (latest vintage of each year; full detail and every vintage in the JSON):

| FY | Indian (resident) filings | All filings | Resident share | EI (Indian) | ONP (Indian) | Grants to Indian patentees | Grants to foreign patentees |
|---|---|---|---|---|---|---|---|
| 2015-16 | 13,066 | 46,904 | 27.9% | n/a | n/a | 918 | 5,408 |
| 2016-17 | 13,219 | 45,444 | 29.1% | n/a | 6,729 | 1,315 | 8,532 |
| 2017-18 | 15,550 | 47,854 | 32.5% | 0* | 7,737 | 1,937 | 11,108 |
| 2018-19 | 17,005 | 50,659 | 33.6% | 0* | 8,347 | 2,511 | 12,772 |
| 2019-20 | 20,843 | 56,468 (App C) / 56,267 (App D) | 36.9% | 0* | 9,825 | 4,003 | 20,933 |
| 2020-21 | 24,326 | 58,503 | 41.6% | 0* | 11,150 | 5,629 | 22,756 |
| 2021-22 | 29,508 | 66,440 | 44.4% | 7,405 (part year) | 7,185 | 6,397 | 23,676 |
| 2022-23 | 43,301 | 82,811 | 52.3% | 19,155 | 6,202 | 9,239 | 24,895 |
| 2023-24 | 51,574 | 92,168 | 56.0% | 23,306 | 7,870 | 25,082 | 77,975 |
| 2024-25 | 68,201 | 110,375 | 61.8% | 37,681 | 8,095 | 10,682 | 22,822 |

\* Printed as 0 in tables published from 2021-22 onwards; the category did not exist (see below).
Shares are computed here (residents / grand total, Appendix C), not printed in the tables.

## Definitions

- **Indian applicant = resident.** Appendix C calls them "Residents"; the narrative says
  "applications filed by Indian applicants". The two totals are identical every year, and equal
  the Appendix B state totals summed over all three routes (cross-check in `cross_checks`).
  A foreign company's Indian subsidiary filing in its own name is an Indian applicant.
- **State of origin.** The reports never define it. Appendix B is titled "Applications for patent
  filed ... according to state of origin" and the narrative calls it "State-wise filing of patent
  applications by Indian applicants". It is the applicant's state as recorded by the Office, not
  the inventor's; how joint applicants in different states are assigned is not stated. Treat it
  as applicant location. The narrative's state figures (e.g. Tamil Nadu 15,440 in 2024-25) are
  the sum of all three routes; Appendix B splits them (15,347 ordinary + 72 convention + 21
  national phase).
- **Categories are fee categories.** The category table follows the fee status the applicant
  claims under the Patents Rules (Form 28 for SU, SE, EI). Faculty who file in their own names
  are Natural Persons; a university that files with a company partner may pay the "others" fee.
  So EI counts filings that claimed educational-institution status, not every academic invention.
- **Grants.** Only Indian versus foreign patentee is tabulated (Appendix D). No report from
  2014-15 to 2024-25 tabulates grants by applicant category (NP/SU/SE/EI/ONP); the only
  category-level grant figures are expedited-examination outcomes for startups and a few others.
  Grant counts for universities therefore cannot be built from these reports.

## The "Educational Institutions" break (0 before 2021-22)

What changed: a new applicant category created by a fee rule, not a reclassification of past data.

1. Patents (Amendment) Rules, 2021, G.S.R. 646(E), Gazette of India Extraordinary, 21 September
   2021 (`data/raw/ipindia-patents/context/patents_amendment_rules_2021.pdf`, p.4), inserted rule 2(ca):
   > "(ca) "educational institution" means a university established or incorporated by or under
   > Central Act, a Provincial Act, or a State Act, and includes any other educational
   > institution as recognised by an authority designated by the Central Government or the State
   > Government or the Union territories in this regard;"

   It also moved educational institutions into the reduced-fee column of the First Schedule,
   alongside natural persons, startups and small entities ("Natural person(s) or Startup(s) or
   Small entit(y)/(ies) or educational institution(s)"), with Form 28 as proof of status. The
   rules came into force on publication, 21 September 2021.
2. Annual Report 2021-22, p.4 (Foreword/overview):
   > "The Patents (Amendment Rules) 2021 notified on September 21, 2021 extended the benefits
   > related to an eighty percent reduced fee for patent filing and prosecution to educational
   > institutions as well."

   And p.13: "the Patents Rules, 2003 have been amended on September 21, 2021 to reduce official
   fees payable by them for patent filing and prosecution by 80%."
3. Annual Report 2020-21, p.4: after the Patents (2nd Amendment) Rules, 2020 (4 November 2020)
   "the applicants are now broadly categorised as natural persons, startups, small entities, and
   others. Under this categorisation, they are availing benefits of an 80% reduction in their
   official fee". The 2020-21 category table has no EI column (four categories).

Consequences for the series:
- Before 21 September 2021 a university paid the "others" fee and its filings sit in **ONP**
  (or in NP when staff filed as individuals). The zeros printed for EI in 2017-18 to 2020-21
  (in the 2021-22 and later reports) mean "category did not exist", not "no filings".
- 2021-22 EI (7,405) covers roughly 21 September 2021 to 31 March 2022 only.
- The handover is visible: Indian ONP fell from 11,150 (2020-21) to 7,185 (2021-22) and 6,202
  (2022-23) while EI rose from 0 to 7,405 and 19,155. A break-free comparison is EI + ONP
  (11,150; 14,590; 25,357; 31,176; 45,776 for 2020-21 to 2024-25), with the caveat that some
  academic filings were and are made by individuals (NP).
- The fee cut itself is a plausible driver of the jump, alongside ranking and accreditation
  incentives (below). The reports do not attribute causes beyond "expected to work as a catalyst".
- The 2024-25 report says (p.133, WIPO Development Agenda statement) that NIPAM outreach "led to a
  121% increase in patent filings by educational institutions"; this is an Office claim with no
  base period stated and should not be used as a measured figure.

## Inconsistencies inside the reports (values kept as printed, flagged in `checks`)

- **2020-21 category row, Indian total.** Categories sum to 24,336. The 2020-21 report prints
  total_indian 24,336; every later report prints 24,326 with the same category values, so the
  row no longer adds up (and 2021-22 also prints total_foreign 34,177 against categories summing
  to 34,167). Appendix C, Appendix B and the narrative all give 24,326 residents. Use 24,326 for
  the resident total; the category split overstates it by 10 somewhere.
- **2019-20 two vintages.** Grand total 56,267 (2019-20 and 2020-21 category tables, every
  Appendix D, and the 2023-24 category table) versus 56,468 (every Appendix C from 2020-21 on, and
  the 2021-22 and 2022-23 category tables). The +201 is entirely foreign ONP (33,968 vs 34,169).
  Resident figures are unaffected (20,843 in all).
- **2019-20 Appendix B ordinary column.** State rows sum to 20,643; printed TOTAL is 20,642. The
  same off-by-one appears in the 2019-20 report (OCR, all rows confirmed) and the 2020-21 report
  (text layer). Resident total 20,843 = 20,642 + 49 + 152, so the TOTAL row is the consistent one.
- **2016-17 Appendix D, abandonments u/s 21(1)**: 15,120 in the 2016-17 report, 10,408 in every
  later report.
- **Union Territory merger.** 2021-22 report lists Dadra and Nagar Haveli (1), Dadra and Nagar
  Haveli and Daman Diu (1) and Daman & Diu (5) separately for 2021-22; the 2022-23 report shows a
  single merged row (7) for 2021-22. Treat as one unit from 2020 onward. Early reports use
  Orissa, Pondicherry, Uttaranchal; these are mapped to Odisha, Puducherry, Uttarakhand (the
  original label is kept in `row_label`). Telangana appears from 2014-15 (NA for 2013-14);
  Ladakh from 2021-22; a "Not Applicable" row appears in 2020-21 and 2021-22.
- **Grants 2023-24 vs 2024-25.** Appendix D: 103,057 granted in 2023-24 (25,082 Indian), then
  33,504 in 2024-25 (10,682 Indian); the narrative (p.26) confirms the 67.49% fall. Grants are
  driven by examination disposal, so a grant series reflects office throughput, not invention.
- **2024-25 category table header (p.21) is mis-set**: the printed labels read "Educational /
  Natural Persons" over columns 7-8 and "Other than / Institutes(EI)" over columns 9-10. The 2022-23
  table (p.25) labels the same values correctly ("Educational Institutes (EI)" then "Other than
  Natural Persons"), and the narrative text lists EI before ONP; the extractor uses that order.
- **"Top Indian applicants" lists contain foreign entities**: the 2024-25 IT list includes
  "SAMSUNG ELECTRONICS CO., LTD." (652) and "GOOGLE LLC" (467), and the R&D list includes
  "MICROSOFT TECHNOLOGY LICENSING, LLC." (237). Possibly joint filings with Indian co-applicants;
  the report does not explain. Lists also mix categories (the 2023-24 R&D and academic lists both
  carry Chandigarh University Technology Business Incubator, 1,126; IIT counts are "Collectively").
  The 2018-19 lists print ranks only, no counts.
- 2024-25 narrative (p.25) gives 40,606 examination requests disposed, the same number as foreign
  ONP filings in the category table (p.21). Possibly coincidence; not used.

## Notable revisions between reports

The `revisions` array lists every (table, row, column, year) where two reports disagree. Apart
from the items above, all overlapping values agree across vintages: state rows for every
year printed twice (current and previous year), Appendix C 2007-08 to 2023-24 and Appendix D
2006-07 to 2023-24 are identical across reports.

## Text extraction and checks

- 2014-15 to 2018-19 and 2020-21 to 2024-25 have a text layer (2014-15 and 2015-16 layers were
  themselves produced by OCR at the source, with artefacts like "201S-16", "Kamataka"; the
  extractor normalises year labels and fuzzy-matches state names, recording the match).
- **2019-20** is an image scan and **2023-24** draws all glyphs as vector outlines, so neither has
  usable text. Their pages are rendered at 400 dpi, table rules removed, and read with tesseract
  5.5.2 (`--psm 6`) at eight binarisation thresholds; state cells take a majority vote across
  readings. Appendix C and D of 2019-20 are rotated pages and were not extracted (later reports
  carry the same years).
- Every table is validated by the identities it implies: category rows sum to the Indian,
  foreign and grand totals; state columns sum to the printed TOTAL; Appendix C components sum to
  the grand total; Appendix D years are consecutive. Header text is checked before parsing; a
  category table whose EI column presence differs from the configured layout is rejected.
  Result: 0 tables rejected; the only failures are the source inconsistencies listed above.
  One wrapped cell (2022-23 report, p.25, NP Indian 2022-23 printed as "1459" / "9") is joined
  to 14,599 because it is the unique join that satisfies all row identities; it is recorded as
  `repair` and confirmed on the rendered page.
- Self-check (`ipindia_selfcheck.json`): 10 random values re-read with a second method (the
  other pdftotext mode, or OCR at an unused threshold), checking the value sits in the same row
  and column position: 10/10 confirmed. Separately, these were compared by eye on rendered
  pages: 2024-25 p.21 category table (all 65 cells), 2022-23 p.25 category table (all cells,
  including the wrapped 14,599), 2023-24 p.36 state table (all 26 rows, OCR), 2019-20 p.23
  category table and top-5 IT and top-10 R&D lists (OCR). All matched.

Run: `python3 -I scripts/stories/innovation-india/extract_ipindia.py --selfcheck 10`
(about 3 minutes; OCR renders cache in `/tmp/ipindia-ocr-cache`, override with `--cache`).

## Ranking and accreditation rules that reward patents (context only, not causation)

All files are in `data/raw/ipindia-patents/context/` and listed in the manifest.

- **NIRF (Ministry of Education), India Rankings 2025, Overall** (https://www.nirfindia.org/nirfpdfcdn/2025/framework/Overall.pdf, pp.18, 21):
  Research and Professional Practice (RP), ranking weight 0.30; "RP = PU (35) + QP (35) + IPR (15)
  + FPPP (15)"; "C. IPR and Patents: Patents Published & Granted (IPR): 15 marks. IPR = IPG + IPP.
  IPG = 10× f (PG). PG is the number of patents granted over the previous three years. IPP = 5 ×
  f (PP). PP: No. of patents published over the previous three years. Primary Data: Third Party
  Sources". So patents carry 15 x 0.30 = 4.5 of 100 overall marks (granted 3.0, published 1.5).
  The parameter sheet https://www.nirfindia.org/Docs/2C.pdf repeats the same formula.
- Same IPR formula and weights in the **2018 Overall framework** (https://www.nirfindia.org/nirfpdfcdn/2018/framework/Overall.pdf, pp.16, 19), so the rule predates the EI fee cut.
  The **NIRF 2017 report** (https://www.nirfindia.org/nirfpdfcdn/2017/IR2017_Report.pdf, p.11) labels the parameter "IPR and Patents: Filed, Published, Granted and Licensed (IPR)" in its parameter diagram, and says patent data came from Thomson Innovation.
- **Engineering 2025** (https://www.nirfindia.org/nirfpdfcdn/2025/framework/Engineering.pdf, pp.9, 12): "RP = PU(35) + QP(40) + IPR(15) + FPPP(10)", same IPG 10 / IPP 5.
- **Research institutions 2025** (https://www.nirfindia.org/nirfpdfcdn/2025/framework/Research.pdf, pp.8, 11): "QLR = JCRQ1 (30) + TOP 25 (30) + IPR (20) + HI (20)", IPG 10 and IPP 10, weight 0.30.
- **Innovation ranking 2025** (https://www.nirfindia.org/nirfpdfcdn/2025/framework/Innovation.pdf, pp.14, 17): Research and Innovation Output, weight 0.30, "RIO = PU (25) + CI (25) + IPR (40) + PCTT (10)"; "IPP = 15 × f (PP) ... IPG = 25 × f (PG)".
- Mechanism worth stating carefully: NIRF counts patents **published**, and publication follows
  filing (18 months, or earlier on request), so a filed application can score before or without
  a grant. This is a reading of the rules, not evidence about behaviour.
- **NAAC Manual for Universities** (Revised Accreditation Framework; https://www.naac.gov.in/images/docs/Manuals/Revised-University-Manual_1.pdf, p.67): metric
  "3.4.3 Number of Patents published/awarded during the last five years", 10 marks (QnM:
  "Total number of Patents published/awarded year wise during the last five years"), within
  Criterion III, Research, Innovations and Extension (250 points, p.60), of a 1,000-point total (p.25).
- **UGC Regulations 2018 on minimum qualifications** (https://www.ugc.gov.in/pdfnews/4033931_UGC-Regulation_min_Qualification_Jul2018.pdf, Appendix II Table 2, p.106): research score
  item "5 (a) Patents: International 10, National 07" for teachers' appointment and promotion
  (a research score of 120 is among the criteria for Professor, e.g. p.60), with evidence including "acknowledgements for
  patent filing and approval letters". Whether a filed (not granted) patent earns the points is
  not stated in the table.
- AICTE notices were not searched in this pass.

## What could not be obtained

- Category split before 2016-17: no such table exists. The startup category dates from the
  Patents (Amendment) Rules, 2016 (16 May 2016, rule 2(fb); `context/patents_amendment_rules_2016.pdf`),
  and reports before 2017-18 tabulate only Indian vs foreign.
- Grants by applicant category, and any university grant count: not tabulated.
- Inventor location: not published; state data are by applicant.
- 2014-15, 2015-16, 2017-18 (Appendix C) and 2019-20 (Appendix C, D) were not parsed (rotated
  or OCR-only pages); all their years are covered by later reports' ten-year tables.
