# Source links report (October 2026)

Every article's "Sources" and "Further reading" lists are now linked objects, checked by
page content, and pinned in the registry so a prose regeneration cannot undo them.

## How it works

- `scripts/registry/source-notes.mjs` holds `pinnedReferences`: per question id, the
  verified `sourceNotes` and `furtherReading`, each `{ label, url, check }` (plus `manual`
  for the few hosts that refuse every automated client). Three questions keep inline lists
  in `v1-indicators.mjs` (`furtherReading` for income classification, jobs challenge and
  internet control); inline wins.
- `src/data/questions.ts` merges the pinned lists over the explanation at build time;
  `generate-explanations.mjs` writes them into any fresh explanation;
  `scripts/apply-pinned-references.py` syncs the existing JSON files (only those two fields).
- `scripts/validate-explanations.mjs` now **fails** on a rendered entry without a URL or
  with an em dash, and warns when an explanation's list drifts from the pinned one.
- `scripts/check-source-links.mjs` re-verifies every link by content (curl with a browser UA
  and `-k`, pdftotext, unzip for XLSX, headless Chrome fallback). `--file=` checks a draft.

## Counts

- Articles covered: 76 (all explanations). 67 had unlinked or em-dashed entries; the other 9
  already had links and were re-verified and pinned unchanged, except two corrections below.
- Explanation files updated: 71 (the other 5 already matched the verified list exactly).
- Entries pinned: 548 source notes and 36 further-reading items, every one with a URL and a
  check term (one internal `/articles/` link carries none).
- Final `check-source-links.mjs` run: see "Link check result" below.

## Link check result (19 October 2026)

`node scripts/check-source-links.mjs` with headless Chrome: 597 links checked, 579 PASS,
14 MANUAL (explained below), 4 FAIL. Two of the failures (IMF DataMapper GDP per capita and
the Dementia India Report PDF) were intermittent 403s and passed on an immediate re-run of
their articles. The other two are the same host, internetshutdowns.in, which returned 502 on
every attempt that day. The validator reports 0 failures; `npm run build` passes.

## Notes corrected or dropped as invented

The generator's notes often named sources the article does not use, or described method
rather than naming a source. Each list was rebuilt from the series the article actually
charts (`data/series/*.json`) and the facts its prose cites. Highlights:

- **q.econ.gold**: dropped "Swiss federal customs export records corroborate imports within
  about 7%" (no series or claim rests on it). Added the sources the article really uses:
  DGCI&S, WGC prices, Nifty 500 TRI, MoSPI CPI, RBI BoP, RBI Bulletin Table 15, NPCI digital
  gold, FRED DEXINUS.
- **q.climate.impact**: dropped Data Commons, PLFS and ILO (no series in the article). Rebuilt
  as one entry per charted source (34).
- **q.climate.monsoon_2026**: "NOAA and WMO" corrected; there is no WMO input. Split into NOAA
  CPC (ONI) and NOAA PSL (DMI).
- **q.econ.growth / q.econ.per_person**: dropped claims of sector shares, trade, inflation,
  tax, expense and debt data that neither article charts; IndiaDataHub note corrected from
  nominal GDP/GVA to real GDP.
- **q.econ.size**: IMF vintage corrected from October 2024 to April 2026 (fetched June 2026).
- **q.health.u5mr**: dropped an SRS note; the article uses no SRS data.
- **q.state.tax**: dropped an invented "GDP in current US$" note.
- **q.econ.asia_divergence**: dropped "IMF WEO April 2025"; nothing in the article uses IMF data.
- **q.econ.industrial_policy**: dropped "TRAINS/WITS"; the report cites WDI and WTO.
- **q.econ.inflation**: WPI credited to the Office of the Economic Adviser (DPIIT), not MoSPI.
- **q.health.deaths**: SRS report year corrected to 2024; UN WPP vintage corrected to 2024.
- **q.health.transition**: NFHS round years corrected (NFHS-5 2019-21, NFHS-6 2023-24).
- **q.econ.trade**: population for trade per person credited to World Bank SP.POP.TOTL.
- **q.econ.trade_partners**: China, Russia and regional series credited to UN Comtrade (they
  are derived from Comtrade, though their series files say stats.wto.org).
- **q.econ.rupee**: the RBI Bulletin study's authors corrected in the further reading; two
  further-reading items that were the same Leap Blog post merged.
- **q.climate.el_nino_india**: dropped Walker (1924) from further reading; no online copy or
  DOI could be found and sources disagree on its volume.
- **q.air.data_poverty**: the Census link (`catalog/42811`) was a 1991 Punjab migration table;
  replaced with the RGI 2011 rural-urban distribution release (`catalog/1430`).
- **q.econ.oil_shock_2026**: the Global Economic Prospects further-reading link redirected to
  a login page; replaced with the real repository record. Also fixed in
  `scripts/write-oil-shock-2026-explanation.py`.
- **q.people.fertility_divergence**: Business Standard label quoted the URL slug, not the
  headline; now quotes the live headline. Also fixed in the finish script.
- Many lists also lost entries that were caveats or method notes rather than sources
  ("all figures are for 2024", AQI definitions, internal file descriptions). Those belong in
  `caveats`, which were left alone.

## Prose errors found and fixed

- **q.econ.rupee**: the body credited the January 2025 RBI Bulletin study to "Michael Patra,
  Joice John, Harendra Kumar and Indranil Bhattacharyya". The authors are Patra, Sunil Kumar,
  Joice John and Amarendra Acharya. Fixed.
- **q.work.how_india_works**: a caveat and two chart notes said real wages were deflated by
  CPI-IW. `scripts/derive-real-wages.mjs` uses CPI-Combined (survey-year mean) for PLFS
  earnings and CPI-Rural for rural wages; CPI-IW is not used. Fixed.

## Links that could not be machine-checked, and what was done

- **unctad.org** (q.econ.fdi_development, 10 links): Cloudflare blocks every automated client.
  Annex tables were checked against the committed copies in `data/raw/unctad-wir/wir2026/annex/`,
  whose manifest records these exact URLs; the report page and Handbook PDF were confirmed via
  search and the UN Digital Library. Marked `manual`.
- **SSRN** (q.policy.internet_control further reading, Rydzak 2019): refuses automated
  clients; title, author and abstract confirmed via search. Marked `manual`.
- **MoSPI eSankhyiki product pages** (CPI, NAS) render late; they pass intermittently and carry
  `manual` notes from hand-rendered checks. Where possible the portal home is linked instead,
  labelled as such.
- **National Health Profile 2023 PDF** (9.6 MB) can time out; passed once, marked `manual`.
- **internetshutdowns.in** returned 502 on every attempt on 19 October 2026. Kept, since it is
  SFLC.in's real tracker domain; re-run the checker.
- **NPCI** blocks all automated access. q.econ.gold links the Dataful article its series came
  from; q.society.connected links the IndiaDataHub feed it used, naming NPCI as producer.
- **ILOSTAT** sits behind a bot check; ILO series link the ILO's own CSV files, labelled "data file".
- **Portal homes, not deep links**: WTO Stats, UN Comtrade, RBI DBIE, IndiaDataHub have no
  stable per-series reader page; labels name the indicator codes or tables.
- **Secondary sources where no primary copy was found**: NCDC heatstroke deaths (PTI wire on
  The Week, TERI), digital-arrest losses (Inc42 report of a Rajya Sabha reply). Labels say so.
- **Rate-limited World Bank multi-country links**: data.worldbank.org returns 429 for four or
  more countries, so comparison links open on fewer countries than the chart shows.

## Articles whose content disagrees with the data or needs a refresh

- **q.econ.poverty**: the World Bank Poverty & Equity Brief now serves the October 2026
  edition; the article's figures match October 2025. The note pins an Internet Archive copy of
  the October 2025 edition. The article needs a data refresh.
- **q.econ.rnd**: DST published R&D Statistics at a Glance 2025-26 in July 2026; the article
  still uses 2020-21 data. The 82% "DST average 2018-24" utilisation bar could not be traced to
  a live source, and the chart compares budget with revised estimates, not actuals.
- **q.econ.inequality**: the extreme-poverty series is the $2.15 (2017 PPP) vintage; the live
  SI.POV.DDAY page now shows the $3.00 line. The label says so.
- **q.energy.state_transitions**: prose says Ember's state data is "compiled from CEA and
  MNRE"; the Ember page does not say that.
- **q.air.today**: WAQI publishes on a US EPA-style AQI scale, not CPCB's National AQI; the
  article does not say which.
- **q.env.water_stress**: CGWB's full report gives arsenic at about 3.5%, the PIB answer the
  series uses gives 3.1%. The 2019 tap baseline is 17% in PIB and 16.7% on the JJM dashboard.
- **Series files with wrong `sourceUrl`** (not changed here; the chart SOURCE line still uses
  them): `air.cpcb.repository.city_visibility_vs_census.json` (Census 42811), the
  trade-partner series derived from Comtrade that point to stats.wto.org, the BIS LONG_CPI
  topic URL in the rupee series (404), the DST and Open Budgets India PDFs in the R&D series
  (404), and the nil-tax ceiling series (site home page).
- **q.climate.methane** and **q.env.water_stress** have no registry question, so they are not
  built. Their JSON is linked anyway via the pinned lists.
