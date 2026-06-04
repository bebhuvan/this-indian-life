# Connected India Source Map

This note maps the source data behind Data For India's "Access to phones and the internet" article and the Indica article question `q.society.connected`.

The main lesson is that "connected India" is not one dataset. It is four layers:

1. **Networks and subscriptions**: TRAI / NDAP / World Bank / ITU.
2. **Actual human use**: NSSO CAMS 2022-23 and NSSO MIS 2020.
3. **Older household baseline**: NFHS, NSS 66th HCES, NSS 71st Education.
4. **Population denominators**: Registrar General of India projections, WDI/UN for international comparisons.

## Fast Reproduction Path

Data For India publishes the chart payloads as public JSON assets. These are useful for quickly reproducing their exact charts, but Indica should treat them as secondary convenience data and cite/rebuild from primary sources where possible.

For each chart:

- `https://assets.dataforindia.com/charts/{chart_id}/config.json`
- `https://assets.dataforindia.com/charts/{chart_id}/data.json`

| DFI chart id | Chart | DFI source note | Primary source to use in Indica |
| --- | --- | --- | --- |
| `d4561d41cc0a4147ab2462e8cf0fbb96` | Mobile and landline subscribers in India over time | Telecom Regulatory Authority of India, National Data Analytics Platform | TRAI Telecom Subscription Reports, or NDAP if available as machine-readable table |
| `474ddebca2f241fbadd93c2523d76ec3` | Mobile phone subscriptions for every 100 people | World Development Indicators, World Bank | World Bank WDI indicator `IT.CEL.SETS.P2`; upstream ITU |
| `8c5c8fde63c2460fb9d22b47ac860243` | Use of mobile phones by gender, 2023 | National Sample Survey, National Statistics Office | CAMS NSS Round 79 member file |
| `3d2a5d86663e417ea4b2a0989d3c2a12` | Share of Indians using mobile phones, 2023 | National Sample Survey, National Statistics Office | CAMS NSS Round 79 member file |
| `34046fd885fb49bca18dac63c99f967d` | Wired and mobile internet subscribers in India | Telecom Regulatory Authority of India, National Data Analytics Platform | TRAI Telecom Subscription Reports, or NDAP if available as machine-readable table |
| `be34b7ebf8ee4b28a11f2ede716c053c` | Share of people who use the internet | World Development Indicators; CAMS | WDI `IT.NET.USER.ZS`; CAMS for India's 2023 survey point |
| `6ace045a66f248138e795c5ee0f309bf` | Share of Indians using the internet, 2023 | National Sample Survey, National Statistics Office | CAMS NSS Round 79 member file |
| `456c2e237ca3423588d4fb0626affdf5` | Internet and phone use in India by gender, 2023 | National Sample Survey, National Statistics Office | CAMS NSS Round 79 member file |
| `862f421ccea745788f89db21d9d25cb1` | Phone usage by age group, 2020 vs 2023 | Multiple Indicator Survey; CAMS | NSS Round 78 MIS member file + NSS Round 79 CAMS member file |

## CAMS 2022-23

Primary catalog:

- MoSPI microdata catalog: `https://microdata.gov.in/NADA/index.php/catalog/220`
- Metadata JSON: `https://microdata.gov.in/NADA/index.php/metadata/export/220/json`
- Data dictionary: `https://microdata.gov.in/NADA/index.php/catalog/220/data-dictionary`
- DFI-linked report PDF: `https://www.mospi.gov.in/sites/default/files/publication_reports/CAMS%20Report_October_N.pdf`

Catalog facts:

- Survey: Comprehensive Annual Modular Survey, NSS 79th round, 2022-23.
- Reference ID: `DDI-IND-MOSPI-NSSO-CAMS22-23`.
- Producer: NSSO / MoSPI.
- Data files:
  - `NSS79CAMS_Household`: 302,086 cases, 85 variables.
  - `NSS79CAMS_Member`: 1,299,988 cases, 57 variables.
  - `NSS79CAMS_Course`: 1,646,813 cases, 38 variables.

Key household variables:

| Variable | Meaning |
| --- | --- |
| `SEC` | Sector |
| `ST` | State code |
| `DIST` | District |
| `BL42I1I` | Number of telephones, including landline |
| `BL42I1II` | Number of mobile phones, including smartphones |
| `BL42I2` | Whether household has broadband internet facility within premises |
| `BL6I1`-`BL6I6` | Consumption components for MPCE-style grouping |
| `MULT` | Survey multiplier / weight |

Key member variables:

| Variable | Meaning |
| --- | --- |
| `SEC` | Sector |
| `ST` | State code |
| `DIST` | District |
| `BL31C4` | Gender of the member |
| `BL31C5` | Age of the member |
| `BL32C3` | Whether able to use mobile telephone |
| `BL32C4` | Whether uses any mobile telephone, including smartphone, with active SIM card during last three months |
| `BL32C5` | Type of mobile technology mainly used |
| `BL32C6` | Whether able to use desktop/laptop/tablet/palmtop/notebook |
| `BL32C7` | Whether able to use internet via mobile/desktop/laptop/tablet/etc. |
| `BL32C8` | Whether used internet at least once during last three months |
| `BL32C81` | Whether used internet at least once during last 12 months |
| `BL32C9` | Whether able to send or receive emails |
| `BL32C10` | Whether able to perform banking transactions / digital payment |
| `MULT` | Survey multiplier / weight |

The CAMS adapter should produce weighted estimates, not raw counts. A first cut should generate:

- phone use by gender, age group, rural/urban, education, consumption quintile;
- exclusive/shared/no phone use by gender;
- internet use by gender, age group, rural/urban, education, consumption quintile;
- phone but no internet by gender;
- neither phone nor internet by gender, age, education, consumption quintile;
- household mobile ownership and broadband access.

## MIS 2020

Primary catalog:

- MoSPI microdata catalog: `https://microdata.gov.in/NADA/index.php/catalog/218`
- Related resources: `https://microdata.gov.in/NADA/index.php/catalog/218/related-materials`
- Official report PDF: `https://mospi.gov.in/sites/default/files/publication_reports/MultipleIndicatorSurveyinIndiaf.pdf`

Use this for the 2020 comparison in DFI's "phone usage by age group" chart. The report also has official detailed tables:

- Table 15: persons using mobile telephone with active SIM during the last three months.
- Table 16: persons using mobile telephones exclusively with active SIM during the last three months.

The microdata catalog exposes downloadable technical documents, estimation procedure, tabulation plan, and layout files. Raw microdata access may require the portal's normal "Get Microdata" workflow.

## TRAI / NDAP

Primary pages:

- TRAI telecom subscription reports: `https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports`
- NDAP can be used when the same TRAI series is exposed in table/API form.

Use this layer for:

- mobile SIM subscriptions;
- landline/fixed telephone subscriptions;
- wired broadband subscriptions;
- mobile broadband subscriptions;
- active wireless subscribers / VLR where needed;
- rural and urban telecom subscriptions.

TRAI is primary, but the reports are often PDFs. If NDAP exposes the same table cleanly, use NDAP for ingestion and TRAI as the source-of-truth citation. If not, write a TRAI PDF/table parser or use a licensed/public parser dataset only as a temporary bridge.

## World Bank / ITU

Primary World Bank indicators already fit Indica's existing World Bank adapter:

| Indicator | Meaning | Use |
| --- | --- | --- |
| `IT.CEL.SETS.P2` | Mobile cellular subscriptions per 100 people | International comparison and long-term trend |
| `IT.NET.USER.ZS` | Individuals using the Internet, % of population | International comparison and long-term trend |
| `IT.NET.USER.FE.ZS` | Female internet users, % of female population | Gender comparison |
| `IT.NET.USER.MA.ZS` | Male internet users, % of male population | Gender comparison |
| `IT.NET.BBND.P2` | Fixed broadband subscriptions per 100 people | Fixed broadband context |
| `IT.MLT.MAIN.P2` | Fixed telephone subscriptions per 100 people | Landline context |

Upstream for many ICT WDI indicators is ITU. DFI's article also links ITU's regional/global ICT aggregate workbook:

- `https://www.itu.int/en/ITU-D/Statistics/Documents/facts/ITU_regional_global_Key_ICT_indicator_aggregates_Nov_2023.xlsx`

## NFHS And Older Household Baselines

Use NFHS when the story needs older household/device baselines:

- NFHS-2, 1998-99: landline household ownership baseline.
- NFHS-3, 2005-06: landline peak-ish comparison.
- NFHS-5, 2019-21: women/men internet use and women owning a mobile phone.
- NFHS-6 local artifacts already exist in this repo for newer internet/mobile indicators where available.

Use older NSS rounds for household internet access:

- NSS 66th Round Household Consumer Expenditure Survey, 2009-10: household internet access at home.
- NSS 71st Round Social Consumption: Education Survey, 2014: household access to internet facility by member aged 14+.

## Indica Implementation Priority

1. Add a `cams` source adapter that can read local microdata extracts and produce weighted national/state/sector estimates.
2. Add a `mis78` source adapter for the 2020 comparison chart.
3. Add a `trai` or `ndap-trai` adapter for telecom subscription infrastructure series.
4. Keep World Bank/OWID as global context, not the main human-use source.
5. In `q.society.connected`, promote survey-based human use charts above subscription charts once CAMS estimates are available.

## Source Reliability Rule

For publication:

- Use DFI chart JSON only for rapid prototyping and cross-checking.
- Use CAMS/MIS/TRAI/WDI/NFHS as source citations.
- If Indica republishes a DFI-derived number before rebuilding it from microdata, mark it as `secondary_reproduction` and cite DFI plus the upstream source note.
