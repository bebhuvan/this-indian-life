# PPAC: what is downloadable, and what stories it can carry

Source: Petroleum Planning & Analysis Cell (PPAC), Ministry of Petroleum & Natural Gas.
All access notes below were probed live on **2026-08-27** with a browser user agent; every
URL pattern marked "public" returned a real workbook (XLSX ZIP or legacy CFB signature),
not an HTML login wrapper.

This is a source map plus a ranked pitch list. It does not commit us to any article; it
exists so the next person does not have to re-discover the download mechanics.

---

## 1. Access mechanics (the important part)

PPAC's site looks more locked than it is. Three separate delivery paths:

**(a) Public AJAX JSON (no auth, no captcha).** Data pages post to
`https://ppac.gov.in/AjaxController/<method>` with
`financialYear=<YYYY-YYYY>&reportBy=<n>&pageId=<n>` and return a JSON table.
`scripts/adapters/ppac.mjs` already does this for two of them. Verified working methods
and their page ids:

| Page | Method | pageId | reportBy |
| --- | --- | --- | --- |
| Import/export of crude & products | `getImportExports` | 14 | 1 qty / 2 ₹ / 3 $ |
| International crude prices (Indian basket) | `getInternationalPricesCrudeOil` | 30 | 4 |
| Consumption of petroleum products | `getConsumptionPetroleumProductsData` | 43 | 1 |
| Crude oil processing (refinery-wise) | `getCrudeProcessingData` | 41 | 1 |
| Indigenous crude oil production | `getProduction` | 3 | 1 |
| Production of petroleum products | `getPetroleumProductData` | 42 | 1 |
| Natural gas consumption | `getGasConsumption` | 138 | 1 |
| Natural gas production | `getGasProduction` | 170 | 1 |

Each method has a `...ChartData` sibling. `financialYear` currently accepts
`2023-2024` … `2026-2027`. Every JSON row carries `file_name` and `modified_date`, which
gives us both a vintage stamp and the workbook URL for the same table.

**(b) `download.php` (public despite the login modal).** The "Download Historical Report"
buttons open a sign-in modal, but the underlying files are served without a session:

- `https://ppac.gov.in/download.php?file=reports/<file>` — the current-year workbooks named
  in the AJAX `file_name` field.
- `https://ppac.gov.in/download.php?file=pages/<file>` — the historical workbooks behind the
  login modal. This is how we get **monthly consumption by product back to 1997-98**
  (`pages/1777985064_PT_Consumption_English.xls`, 431 KB, 29 sheets).
- `https://ppac.gov.in/download.php?file=rep_studies/<file>` — reports and studies (PDF/XLS),
  including the archive back to 2011.

**(c) `uploads/page-images/<file>`** — plain static files linked from the data pages, and the
fallback location for most `data-url` attributes that the page routes through
`checkLoggedInorNot()`. Verified public for the natural-gas sectoral history, historic
refining capacity, LNG import history, state-wise sales, PMUY, active LPG customers, CGD
network, retail outlets, VAT rates and exchequer contribution files.

Note the mirror-quirk: a given filename lives at exactly one of `uploads/page-images/`,
`download.php?file=pages/` or `download.php?file=reports/`. The wrong one returns a
38,563-byte HTML page with a 200 status, so **check the file signature, never the status
code** (`scripts/adapters/ppac.mjs` already has this guard in `fetchPpacWorkbook`).

One live trap: `download.php` sometimes 302s to an internal IP (`10.246.166.57`) whose TLS
cert does not match, and curl aborts. Retry; it is intermittent, not a permanent block.

---

## 2. The datasets worth having

Ranked by how much story they can carry, not by how PPAC organises its menu.

| # | Dataset | Granularity | Coverage | Where |
| --- | --- | --- | --- | --- |
| 1 | **India's Oil & Gas Ready Reckoner** | ~100 tables | mostly FY2018-19 → FY2025-26, some to 1997 | `uploads/page-images/1786340011_Indias_Oil_Gas_Ready_Reckoner.xlsx` (14 MB, 107 sheets) |
| 2 | **Consumption of petroleum products** | monthly × ~12 products | **1997-98 → 2025-26** | `download.php?file=pages/1777985064_PT_Consumption_English.xls` |
| 3 | **State-wise POL sales** | annual × state × (all products, MS, HSD) | 2008-09 → 2025-26 | `uploads/page-images/1787137273_Statewise_Sales-POL_Consumption_Final.xlsx` |
| 4 | **Import/export of crude & products** | monthly, qty + ₹ + $ | 1998-99 → current | already ingested (`ppac.IN.energy.ppac.import_export_*`) |
| 5 | **Petroleum prices & under-recoveries** | fortnightly, per product | 2011 → 2022 | `uploads/page-images/1761715894_petroleum-prices-and-under-recoveries.xlsx` |
| 6 | **Natural gas sectoral consumption** | monthly × sector × state | 2015-16 → current | `uploads/page-images/1781859871_2_NG-H_Sectoral_Consumption.xlsx` (+ current-year file) |
| 7 | **LNG imports** | monthly, long-term vs spot | 2011-12 → current | already ingested; history at `uploads/page-images/1748953037_NG-H-LNG-Import.xlsx` |
| 8 | **Installed refining capacity** | refinery × company × state | since 01.04.1997 | `uploads/page-images/1787032950_Refining_Capacity_Historic.xlsx` |
| 9 | **State-wise LPG distributors** | annual × state | 2001 → 2026 | `uploads/page-images/1787123697_State-Wise_LPG_distubutors.xlsx` |
| 10 | **Active domestic LPG customers / PMUY connections** | state, latest month | current snapshot (history in Reckoner 7.2, 7.3) | `uploads/page-images/1787123639_active-domestic-cus-lpg.xlsx`, `..._1787123429_pmuy-connections.xlsx` |
| 11 | **Retail outlets, state-wise** | state × company | current + Reckoner 6.6 back to 2022, PSU/private split to 2002 | `uploads/page-images/1787131130_Statewise_Retail_Outlets.xls` |
| 12 | **CGD network / CNG stations / PNG connections** | geographical area (355 rows) | as on 01.04.2026 | `uploads/page-images/1787815872_8_CGD-Network-Web.xlsx`, Reckoner 3.6–3.8 |
| 13 | **State VAT/sales-tax rates on fuels** | state × product | current, dated | `uploads/page-images/1786515386_PP_3_SalesTax_12.08.2026.xls` |
| 14 | **Contribution to central & state exchequer** | ₹ crore × head | 2018-19 → 2025-26 (P) | `uploads/page-images/1784281292_PP_4_ContributionToExchequer.xls`, Reckoner 8.18–8.20 |

Ready Reckoner sheets that are individually story-grade and not published anywhere else in
tidy form: **6.4D** (average monthly MS/HSD sales *per retail outlet*, by state, two years),
**6.6 PSU RO** (PSU vs private pump counts since 2002), **6.9** (CNG/EV-charging/auto-LPG at
retail outlets, by state), **6.10** (ethanol blending % by state), **7.1** (LPG marketing
balance: production, imports, PSU sales by segment), **7.6** (per-connection cylinder
consumption split PMUY vs non-PMUY, by state), **4.6** (consumption vs refinery production,
1997-98 →), **4.7** (refinery gross refining margins by company), **8.2–8.5** (price build-up
of petrol, diesel, PDS kerosene, domestic LPG), **8.19/8.20** (state-wise VAT and SGST
collected from petroleum).

---

## 3. What the site already uses

`q.energy.system` ("What powers India?") uses PPAC only for monthly crude imports, the
Indian basket price, LNG import volumes and the fuel import bill. **Consumption, LPG,
state-level demand, refining, retail infrastructure, gas sectors and the tax/subsidy stack
are all untouched.** Every pitch below is new ground.

---

## 4. Story pitches

Each pitch names the second independent source, because a single-source article does not
clear `docs/STORY_PLAYBOOK.md`.

### 4.1 The cylinder that nobody refills
**Question:** India gave 105 million poor households a gas connection. How much do they
actually cook with it?

PPAC publishes per-connection consumption (Reckoner 7.6) split **PMUY vs non-PMUY, by
state**: PMUY households take roughly 4–7 refills a year against 5–10 for everyone else, and
the gap is widest in the poorest states. Pair with state-wise PMUY connections (7.3),
active domestic customers (7.2) and the LPG price build-up (8.3) — an ₹942 cylinder against
a ₹300 subsidy is the mechanism. Second source: **NFHS-5/6 cooking-fuel share** (already in
`data/series/nfhs.*`) for what households report burning, which is the honest cross-check on
"connection ≠ use".

Why it's good: a connection count is a policy output; refills are the outcome. The two
diverge, and PPAC hands us the divergence at state level. Caveats: PCC is a ratio of sales
to connections, not a household survey; multi-cylinder households and commercial diversion
distort it; PMUY refill data starts only when the scheme does.

### 4.2 Petrol pumps are quietly becoming charging stations
**Question:** What is happening to the Indian petrol pump?

Reckoner 6.6 PSU RO gives pump counts since 2002 (18,848 → ~90,000+, private share
appearing after 2004). Reckoner 6.4D gives **average monthly MS/HSD throughput per outlet by
state** for two years — outlet growth is outrunning fuel demand growth, so the average pump
is selling less. Reckoner 6.9 gives, by state, how many outlets now have EV charging, CNG or
auto-LPG. Second source: **VAHAN registrations by state and fuel** (already local, 2003-2026,
`Vaahan/tables/`) plus SIAM sales mix — vehicles up, throughput per pump down.

Why it's good: it is a business-model story told entirely in physical units, and the "EV
charging points per state" column is a genuinely under-reported number. Caveats: 6.4D is
only two years, so the long throughput trend needs reconstruction from 6.4B/6.4C (state MS
and HSD sales, 2018-19 →) divided by 6.6 outlet counts; state boundaries for sales are
where fuel is *sold*, not where it is burned (highway states over-count).

### 4.3 What India actually burns, month by month, since 1997
**Question:** Which fuels grew, which died, and what does the demand curve remember?

The 1997-98 → 2025-26 monthly consumption workbook is the single best PPAC asset: ~29 years
× 12 months × 12 products. Kerosene collapses (PDS SKO is nearly gone), petrol compounds at
~7% for a decade, ATF recovers past its pre-COVID line, bitumen tracks the road programme,
pet coke tracks industrial policy. The COVID hole is visible to the week-of-month. Second
source: **MOSPI IIP / GDP quarterly** (already ingested) to separate "the economy stopped"
from "the fuel switched".

Why it's good: it is the demand-side companion to the import-side article we already have,
and monthly data over 29 years supports a small-multiples grid that is honest about
seasonality (harvest diesel, festival petrol, monsoon bitumen). Caveats: fiscal-year
framing, the historical sheets restate provisional months, and consumption here means
*industry sales*, not final combustion.

### 4.4 Where the diesel goes: India's demand map
**Question:** Which India runs on diesel, and which one has moved to petrol?

State-wise sales 2008-09 → 2025-26 for all products, MS and HSD separately. The
petrol:diesel ratio by state is a development indicator in disguise — it tracks the shift
from freight and pumpsets to personal two-wheelers and cars. Second source: **VAHAN state
registrations** and **PLFS/state per-capita income** (both local) to test whether the shift
follows incomes or vehicle mix.

Why it's good: 18 years, 30+ states, two clean products — enough for a proper small-multiple
map plus a ratio ranking. Caveats: sales-location bias again (Haryana and Rajasthan pumps
serve Delhi traffic), and state totals include bulk industrial sales that never see a pump.

### 4.5 What a litre of petrol is actually paying for
**Question:** When you pay ₹102 for a litre in Delhi, who gets what?

Reckoner 8.4/8.5 break petrol and diesel into dealer price, excise, dealer commission and
VAT at a dated snapshot; 8.17 gives every state's VAT/sales-tax rate; 8.19/8.20 give what
each state actually collected; 8.18 gives the full central + state take (₹ lakh crore
scale). The under-recoveries workbook (2011–2022, fortnightly) is the prequel: the era when
the government paid *out* on kerosene, LPG and diesel, ending in the 2014-15 deregulation.
Second source: **Union Budget receipts / RBI state finances** (RBI-DBIE series are local) to
set petroleum taxes against total tax revenue.

Why it's good: it is the one energy story that touches every reader's wallet, and PPAC gives
both halves — the per-litre stack and the aggregate exchequer. Caveats: price build-ups are
single-date snapshots (PPAC's daily RSP history is **PDF only**, `PP_9_a_DailyPrice...` — do
not promise a daily price series without a PDF-extraction pass, see
`docs/PDF_EXTRACTION_PLAYBOOK.md`); under-recovery is an accounting construct, not a cash
subsidy; excise is specific (₹/litre) while VAT is ad valorem, so their shares move in
opposite directions when crude moves.

### 4.6 The refinery surplus: how India became an exporter of fuel
**Question:** India imports nearly all its crude and still sells fuel to the world. How did
that happen, and who owns it?

Reckoner 4.6 runs consumption vs refinery production from 1997-98: a 20 MMT deficit in
1997-98 flips positive in 2001-02 and reaches a large surplus by the 2010s. Historic
installed capacity (since 1997, refinery-level) shows where the capacity was built — Jamnagar
above all. Reckoner 4.7 gives gross refining margins by company; 4.9/4.10 give fuel-and-loss
and specific energy consumption per refinery. Second source: **UN Comtrade / TradeStat HS
2710 exports** (adapters exist) for who buys the surplus.

Why it's good: the capacity table is refinery-by-refinery and decade-long, which makes an
honest "who built what, when" chart, and the export side is already ingestible. Caveats:
GRM definitions vary by company and are not audited; capacity is nameplate, not achievable;
the export surplus is a refining-margin business, not energy independence — say so plainly.

### 4.7 The gas that India keeps promising itself
**Question:** India has been "moving to a gas-based economy" for two decades. Where has the
gas actually gone?

Monthly sectoral gas consumption 2015-16 → present, by sector *and* by state: fertiliser,
power, CGD, refinery, petrochemicals. The story is that power's share has drained while CGD
(CNG + piped cooking gas) has climbed. Pair with CGD network coverage (355 geographical
areas, CNG stations and PNG connections as on 01.04.2026), CNG sales by state since 2019-20,
domestic gas price and the HPHT ceiling since 2014 (Reckoner 3.11), and LNG terminal
utilisation (3.9). Second source: **Ember generation** (local) for what gas-fired power
actually did, and **TradeStat LNG import values** for the price signal.

Why it's good: a 10-percentage-point sectoral shift with a clean price explanation
(gas-fired power is price-elastic and loses to coal above a threshold; CGD is contracted).
Caveats: MMSCM vs MMT vs MMSCMD unit traps — use the Reckoner's own conversion tables (9.5);
"state" for gas means where it was delivered into a pipeline network, and the 3.12D sheet
splits domestic vs RLNG, which must not be double-counted.

### 4.8 The 2026 oil shock, as it happened
**Question:** What does an oil shock look like in the data while it is still running?

PPAC's own chapter-8 narrative dates a US–Israel–Iran disruption to 28 February 2026, and
the Indian basket monthly series shows the jump: January $63/bbl → March $113 → April $114 →
June $83. The Reckoner gives the transmission chain in one place — basket price, price
build-up, exchequer contribution, and monthly import value in both ₹ and $. Second source:
**RBI exchange rate and CPI fuel** series (local) for the rupee amplifier and what reached
consumers.

Why it's good: it is a live, dated event with a documented mechanism, and we can show
transmission rather than assert it. Caveats: this is the highest-risk pitch — everything
after March 2026 is provisional, PPAC restates, and the retail-price leg depends on PDF
extraction. Treat as ranges, and re-pull before publishing.

---

## 5. If we build these

- Extend `scripts/adapters/ppac.mjs` with a generic `fetchPpacAjaxTable(method, {financialYear,
  reportBy, pageId})` — the six new endpoints in §1(a) share one response shape with
  `parsePpacCurrentImportExport`.
- Add a workbook fetcher that takes the three URL patterns in priority order and validates the
  file signature before accepting, so a silent HTML fallback can never become a series.
- Legacy `.xls` (CFB) files need `xlrd`, not `openpyxl` — the 1997-onwards consumption history
  and several price files are legacy format.
- `sourceUrl` for every derived series must point at the **reader-facing PPAC page**
  (`https://ppac.gov.in/consumption/products-wise`), not at `download.php`, per `CLAUDE.md`.
- Snapshot the raw workbook alongside the parsed JSON, as `ingest-ppac.mjs` already does:
  PPAC overwrites files in place under a new timestamp prefix, so today's URL will 404 later.

## 6. Traps worth repeating

- A 200 from PPAC is not a file. Check the ZIP/CFB signature.
- Filenames carry a unix-timestamp prefix that changes on every republish. Never hard-code a
  URL without a discovery step that re-reads the page.
- Almost everything is fiscal-year framed (April–March) and the last month or two is marked
  provisional. The Reckoner mixes calendar-year world tables with fiscal-year India tables on
  adjacent sheets.
- Ready Reckoner sheet names have trailing spaces (`'8.18 '`, `'Table 2.1 '`) and several
  sheets contain `#REF!` residue from broken links. Strip and validate.
- Consumption is *industry sales*. It is not household consumption, not combustion, and not
  final demand.
