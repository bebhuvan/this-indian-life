# Peer series for "How innovative is India?": definitions, gaps, breaks

Retrieved 20 October 2026. Raw files: `data/raw/innovation-peers/` (hashes in `manifest.json`).
Code: `scripts/stories/innovation-india/fetch_peer_sources.py` (download),
`clean_peer_series.py` (tidy output), `selfcheck_peer_series.py` (sample re-check).
Output: `peer_series.json` (4,956 rows; fields iso3, indicator, year, value, unit, source,
url, api_url, raw_file; DST rows add period, edition, table, page, gdp_series, flag).

Peer set: IND, CHN, VNM, IDN, BRA, TUR, MYS, THA, PHL, MEX, ZAF, KOR, USA, plus WLD where the
source has a world aggregate (WDI, WIPO PCT). Years are calendar years, except DST rows,
where `year` is the start of the Indian fiscal year (2021 = 2021-22) and `period` is the label as printed.

## Sources and exact URLs

| Family | Reader-facing page | Data endpoint used | Vintage |
|---|---|---|---|
| WDI R&D % GDP | https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS | api.worldbank.org/v2/country/IND;CHN;...;WLD/indicator/GB.XPD.RSDV.GD.ZS?format=json&date=2000:2026&per_page=20000 | WDI lastupdated 2026-10-08 (all nine) |
| WDI researchers per million | https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6 | same pattern | |
| WDI ICT service exports % / US$ | https://data.worldbank.org/indicator/BX.GSR.CCIS.ZS , .../BX.GSR.CCIS.CD | same pattern | IMF BoP |
| WDI patents resident / non-resident | https://data.worldbank.org/indicator/IP.PAT.RESD , .../IP.PAT.NRES | same pattern | WIPO |
| WDI journal articles | https://data.worldbank.org/indicator/IP.JRN.ARTC.SC | same pattern | NSF, Scopus |
| WDI population, GDP PPP | https://data.worldbank.org/indicator/SP.POP.TOTL , .../NY.GDP.MKTP.PP.CD | same pattern | |
| WIPO PCT by origin | https://www3.wipo.int/ipstats/pmh-search/pct (indicator 1, yearly, RO = Total) | api.ipstatsdc.deda.prd.web1.wipo.int/api/v1/public/pmh-search/downloadCsv?selectedTab=pct&indicator=1001&reportType=4001&... | "Last updated: October 2026" |
| WIPO resident filings, per million, foreign-oriented families | https://www3.wipo.int/ipstats/ips-search/patent | .../ips-search/downloadCsv?selectedTab=patent&indicator=10|101|22&... | "Last updated: May 2026" |
| UNESCO UIS | https://databrowser.uis.unesco.org/ | api.uis.unesco.org/api/public/data/indicators?indicator=EXPGDP.TOT&indicator=RESDEN.INHAB.TFTE&geoUnit=... | Feb 2026 data release (version 20260507-91260335) |
| DST S&T Indicators Tables 2025-26 | https://nstmis-dst.org/Pdfs/ST%20INDICATORS%20TABLES%202025-26.pdf | same | PDF created 29 Jul 2026 |
| DST R&D Statistics at a Glance 2025-26 | https://nstmis-dst.org/Pdfs/RD%20STATISTICS%20AT%20A%20GLANCE%202025-26.pdf | same | |
| DST S&T Indicators Tables 2022-23 | https://nstmis-dst.org/Pdfs/S%26T%20INDICATORS%20TABLES%202022-23.pdf | same | previous edition |
| DST R&D Statistics at a Glance 2022-23 | https://nstmis-dst.org/Pdfs/R%26D%20Statistics%20at%20a%20Glance%2C%202022-23.pdf | same | |
| PIB Parliament answer | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2291139 | same | 29 Jul 2026 |

The WIPO IPSDC API returns HTTP 400 unless the request carries an `Accept-Language` header.
The reader-facing WIPO URLs in the manifest carry the full query string, but the Angular site
may not restore every selection from the URL; treat `https://www3.wipo.int/ipstats/` as the
link and name the indicator in the label.

## Definitions and method notes

- **R&D % GDP (GERD)**: WDI republishes UIS exactly (India 2015-2020 identical to 5 decimals).
  Frascati Manual definition: intramural R&D performed in the country, all funding sources.
- **Researchers per million**: FTE researchers, UIS. India's WDI/UIS points are 2000, 2005,
  2010, 2015, 2018, 2020 only; the World aggregate has the same six years.
- **ICT service exports**: computer, telecom and information services (IMF BoP, BPM6).
  Share is of total service exports.
- **Patent applications (WDI IP.PAT.RESD/NRES)**: filings at the national office, by residents /
  non-residents, direct plus PCT national phase. The WIPO IPSDC diagonal (office = origin) we pulled
  equals WDI IP.PAT.RESD for every peer and year checked (IND, CHN, VNM, USA: zero mismatches).
- **PCT applications by origin (WIPO PCT indicator 1)**: international applications by filing date,
  all receiving offices, origin = **country of residence of the first-named applicant**. Applicant-based,
  not inventor-based.
- **By inventor: not available.** The IPSDC offers no PCT-by-inventor-country series (its PCT list
  has only women-inventor shares). Inventor-country PCT counts exist in the OECD patent database
  (not fetched). Any "by inventor" claim must cite OECD, not WIPO.
- **Resident applications per million (WIPO patent indicator 10)** and **foreign-oriented patent
  families by origin (indicator 7)**: the latter is WIPO's count of families with filings at an
  office other than the applicant's home office; latest year 2022 for all peers.
- **Journal articles**: NSF/NCSES fractional counts from Scopus, S&E fields, through 2023.
- **IPSDC quirk avoided**: for patent indicator 1 by office (report 11) or by origin (report 13)
  the API returns each cell as an unordered set of 3-5 numbers (resident, non-resident or abroad,
  total) with no labels. We did not use those cells. Resident counts come from the unambiguous
  office x origin report, and non-resident counts from WDI.

## Coverage: latest year per country (n/span shown where years are missing inside the span)

| Indicator | IND | CHN | VNM | IDN | BRA | TUR | MYS | THA | PHL | MEX | ZAF | KOR | USA | WLD |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R&D %GDP (WDI) | 2020 | 2023 | 2023 (8/22) | 2020 (9/21) | 2023 | 2023 | 2022 (15/23) | 2023 (22/24) | 2020 (11/19) | 2024 | 2022 (21/22) | 2023 | 2023 | 2023 |
| R&D %GDP (UIS) | 2020 | 2023 | 2023 (8/22) | 2020 (9/21) | 2023 | 2023 | 2022 | 2023 | 2020 (11/19) | 2024 | 2022 | 2023 | 2023 | n/a |
| Researchers/mn (WDI) | 2020 (6/21) | 2023 | 2023 (7/22) | 2020 (8/21) | **2014** | 2023 | 2022 (15/23) | 2023 (17/23) | 2020 (11/19) | 2024 | 2022 (21/22) | 2023 | 2022 | 2020 (6/21) |
| ICT svc % of svc exports | 2025 | 2025 | **none** | 2025 | 2025 | 2025 (from 2003) | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 |
| ICT svc US$ | 2025 | 2025 | **none** | 2025 | 2025 | 2025 (from 2003) | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2024 |
| Patents resident / non-resident (WDI) | 2024 | 2024 | 2024 | 2024 (no 2012) | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 |
| Journal articles | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 | 2023 |
| Population, GDP PPP | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 |
| PCT by origin (WIPO) | 2025 | 2025 | 2025 (no 2005) | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 | 2025 |
| WIPO resident filings, per million | 2024 | 2024 | 2024 | 2024 (no 2012) | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | 2024 | n/a |
| Foreign-oriented families | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | 2022 | n/a |

Flags:
- India's international R&D series stop at 2020 in WDI, UIS and therefore GII 2026. DST has 2023-24 (below).
- Brazil researchers end in 2014; Vietnam, Indonesia, Philippines and Malaysia R&D are sparse
  (biennial or irregular). A "latest year" peer bar chart mixes years from 2014 to 2024; label each bar's year.
- Vietnam has no ICT service exports in WDI at all. Needs another source (e.g. IMF BOP direct) or omission.
- India PCT filings fell from 4,535 (2024) to 3,066 (2025). The by-receipt-date series agrees
  (4,516 to 3,074), and monthly 2025 counts run 186-317, so it is in the data, not a partial year.
  Worth explaining before charting; we have not established why.
- India resident filings: 38,551 (2022), 49,860 (2023), 63,217 (2024); 43.6 per million in 2024.

## UNESCO UIS: why GII 2026 uses 2020 for India

- UIS's February 2026 release (the current one at retrieval) has India GERD % GDP to 2020 (0.64558)
  and FTE researchers per million to 2020 (259.26325). UIS year 2020 = Indian FY 2020-21: the value
  matches DST's 0.64 for 2020-21.
- The GII 2026 database (`data/raw/wipo-gii/database/gii2026-database.xlsx`, sheet Data) carries
  exactly these values for India: IN.2.3.1 researchers 259.26325, DATAYR 2020; IN.2.3.2 GERD 0.64558,
  DATAYR 2020; both with OUTDATED = 1. GII took them from UIS.
- The previous DST edition (2022-23) ended at 2020-21, and the new one (Tables and Glance 2025-26)
  was published in late July 2026 (PDF created 29 Jul 2026; PIB answer the same day). That is after
  UIS's February 2026 release and after GII 2026 data collection, so neither could carry 2021-22
  onward. This is an inference from dates; no document states it.

## DST/NSTMIS findings

All values parsed from the PDFs page by page (`pdftotext -layout`); page = PDF page number.

**Headline series (S&T Indicators Tables 2025-26, Table 3, p.20)**

| FY | GERD Rs crore | GDP Rs crore (series) | GERD % GDP |
|---|---|---|---|
| 2019-20 | 132,567.01 | 20,103,593 (2011-12) | 0.66 |
| 2020-21 | 127,380.96 | 19,854,096 (2011-12) | 0.64 |
| 2021-22 | 194,810.83 | 23,597,398 (2011-12) | 0.83 |
| 2022-23 | 213,378.12 | 26,117,627 (2022-23) | 0.82 |
| 2023-24 | 244,767.81 | 28,983,909 (2022-23) | 0.84 |
| 2024-25* | 276,196.13 | 31,807,309 | 0.87 |
| 2025-26* | 313,007.02 | 34,635,638 | 0.90 |

\* DST estimate: "2024-25 and 2025-26 data is estimated by applying sector-wise CAGR based on period
from 2021-22 to 2023-24" (Table 1 note 5, p.18). These are projections, not survey results.
The PIB answer (PRID 2291139) reproduces the 2019-20 to 2023-24 GERD and ratios exactly.

Sector shares and FTE: public 54.48% / private 45.52% in 2021-22, 48.15 / 51.85 in 2023-24 (Table 5, p.22).
FTE personnel engaged in R&D activities (researchers) as on 01.04.2024: 507,351, of whom higher
education 238,728 (Table 21, p.46); 354 per million (Table 24, p.49). Glance 2025-26 p.25: "increased to
354 in 2023-24 from 262 in 2020-21".

**The 2020-21 to 2021-22 jump (+52.9% in rupees, 0.64% to 0.83% of GDP)**

DST does not call it a break, and no table notes it. But the two years come from different survey
rounds with different coverage and different estimation for higher education, so it should be treated
as a series break. Evidence:

1. *Different survey.* 2021-22 to 2023-24 come from the National S&T Survey 2024-25, "conducted between
   December 2024 to December 2025 as census of R&D-performing institutions ... covered more than 8,000
   R&D-performing institutions", and "supplemented with data from authenticated secondary sources ...
   DSIR, CMIE, Annual Reports, BRSR reports, Public Enterprises Survey reports, the Agricultural Research
   Data Book, Demand for Grants, NIRF, AISHE, NAAC, institutional websites" (Tables 2025-26 Overview, p.16;
   Glance p.15). 4,912 institutions responded (Glance p.31). The 2020-21 value is carried over unchanged
   from the 2022-23 edition, whose private sector covered "2312 in-house Private Sector R&D units which
   include 446 SIRO units" (Tables 2022-23, Table 1 note 5, p.5).
2. *Higher education was extrapolated before, surveyed now.* 2022-23 edition: "Higher Education data for
   period 2018-19 to 2020-21 has been estimated by applying five year growth rate based on period from
   2010-11 to 2015-16" (Table 1 note 6, p.5); HE researchers "based on estimation by applying three years
   growth rate for period 2015 to 2018" (Table 21 note 2, p.31). 2025-26 edition: HE "includes R&D
   expenditure by Public and Private Sector Higher Education Institutes" (Table 1 note 4, p.18), with
   private HEIs a separate line (Rs 5,702.52 crore in 2021-22, Table 2, p.19). HE GERD went 11,235.00 to
   24,085.80 crore (+114%); HE FTE researchers 137,526 (as on 1.4.2021, estimated) to 238,728 (1.4.2024).
3. *Private industry nearly doubled in one year.* Private sector (industry + SIROs) 46,388.13 to 82,974.99
   crore (+79%); private industry alone 41,007.36 (2022-23 ed., Table 2) to 77,265.55 (2025-26 ed., Table 2).
   Glance p.23 reports the MNC share of business R&D rising "from 49.9% in 2020-21 to 71.3% in 2023-24"
   (390 MNC R&D units, Table 17). Wider firm coverage (BRSR, CMIE) is the likely driver; DST does not
   quantify how much is coverage versus real growth.
4. *Of the Rs 67,430 crore increase*, private sector accounts for about 36,590 (54%), central sector about
   18,070 (27%), higher education about 12,850 (19%); state sector fell slightly (Table 1, p.18).
5. *GDP base switch is a second, smaller break.* The ratio uses 2011-12-series GDP up to 2021-22 and the new
   2022-23-series GDP ("MoSPI New GDP Series, June 2026") from 2022-23 (Table 3 notes, p.20). So 0.83
   (2021-22) and 0.82 (2022-23) sit on different GDP bases.
6. Not a GDP effect: GDP rose 18.9% between 2020-21 and 2021-22 on the same series, while GERD rose 52.9%.

**Revisions versus the 2022-23 edition (overlapping years to 2020-21)**: GERD in rupees is identical for
every overlapping year and sector (Table 1, Table 3). Only GDP was revised (2019-20: 20,074,856 to
20,103,593; 2020-21: 19,800,914 to 19,854,096; 2014-15 by 1 crore), which leaves the printed ratios
unchanged at two decimals (0.66, 0.64). So the new survey revised nothing backwards: the back series
keeps the old coverage, and the jump sits entirely at 2021-22. A like-for-like 2020-21 on the new
coverage does not exist.

Sector definitions also moved between editions: in the 2022-23 Table 21, state government R&D-activity
FTE was 18,211 and SIROs were in industry; in 2025-26 state is 10,415 and SIROs are an institutional
row (41,482). Compare sector researcher counts across editions with care.

## Self-check

`selfcheck_peer_series.py` (seed 20261020) re-verified 10 random rows (at least one per source family)
against the raw files by an independent route: 10/10 pass; a wider 40-row run (seed 7) also passed 40/40.
All 36 manifest hashes match. Result: `peer_series_selfcheck.json`.

## Not obtained

- PCT applications by inventor country (not in WIPO IPSDC; OECD has it).
- Vietnam ICT service exports (absent from WDI).
- A clean IPSDC split of total filings by origin into resident vs abroad (API cells unlabelled; see above).
- Any DST statement that explicitly labels 2021-22 as a break or gives a bridged 2020-21.
