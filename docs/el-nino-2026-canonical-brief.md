# El Nino 2026 — canonical article brief

Working title: **"El Nino is shouting. Here is what it can and cannot tell India."**
Proposed id: `q.climate.el_nino_2026` · slug: `el-nino-2026-what-it-means-for-india`

Status: **build started 2026-07-30.** Done: the five CPC ENSO index series (see 3.0a), the DMI
refresh, and the ENSO/IOD/IMD derive chain re-run with the strong-event table re-verified.
No registry entry and no prose yet.

Every live figure below is marked **V** (verified against a primary source) or **U**
(unverified, from secondary reporting — pin to a primary source before it appears in prose,
or cut it). Section 8 is the honesty ledger; read it before generating.

---

## 1. What already exists, and why a third article is justified

| Article | Built | Charts | What it is |
|---|---|---|---|
| `q.climate.el_nino_india` — "What does El Nino do to India?" | earlier | 22 | The canonical mechanism piece. Long record, base rates, second ocean, region/timing, crop + price channels. Strong. |
| `q.climate.monsoon_2026` — "Is India's 2026 monsoon in trouble?" | mid-June 2026 | 8 | A pre-season forecast piece. Borrows base-rate charts from the canonical one. |

The new article is not a rewrite of either. It exists because **three things have changed
since mid-June, and two of them make the existing pieces wrong or under-conditioned:**

1. **The event got big.** ONI went from -0.54 (NDJ 2025, La Nina) to **+0.98 (AMJ 2026)** — V,
   CPC `oni.ascii.txt`. CPC's 9 July discussion carries an **El Nino Advisory**, expects
   further strengthening, a peak around OND 2026, and ~**97% persistence into early spring
   2027** (V, CPC ENSO Diagnostic Discussion). Both existing articles were written when this
   was "El Nino developing".
2. **The Indian Ocean forecast has shifted — but be precise about this.** I earlier called the
   existing article's "dipole forecast neutral" a factual error. **That overstated it, and the
   refreshed data does not support the stronger claim.** What is actually true:
   - **HadISST monthly DMI (V, refreshed today, runs to 2026-05):** the IOD is currently
     **neutral**. It touched +0.529 in February 2026, then fell back — +0.285 (Mar),
     +0.279 (Apr), **+0.146 (May)**.
   - **BOM's operational weekly index (U):** reached **+0.44 C in the week of 26 July 2026**,
     its first week at the +0.4 threshold, with models projecting a positive IOD developing
     through the southern-hemisphere spring.
   - These are **consistent, not contradictory** — different products over different periods,
     and the IOD normally develops in boreal summer and peaks in autumn. A neutral May
     followed by a threshold-touching late July is an ordinary development trajectory.

   So the honest framing is: **a positive IOD is emerging as a forecast, not established as a
   condition.** The existing article was accurate when written in mid-June; its forecast has
   since been superseded. Do not write it up as an error, and do not tell readers the second
   ocean has already turned in India's favour.
3. **The season is half over and measurable.** Neither existing piece contains a single
   in-season observation. We now have rainfall to date, reservoir storage and sowing area.

### The under-conditioning problem (the real intellectual reason to write this)

`q.climate.el_nino_india` reassures the reader with the all-El-Nino base rate: mean
**-3.2%**, and **11 of 26** El Nino monsoons finished above normal. That is correct
arithmetic over the wrong reference class for 2026.

Conditioning the repo's own data (`derived.IN.climate.enso_iod_imd_monsoon_join.json`,
all-India rows) on monsoons where ONI reached **>= 1.5 during JJAS** gives seven events:

| Year | JJAS departure | Peak JJAS ONI | JJAS DMI | IOD phase |
|---|---|---|---|---|
| 1965 | **-18.6%** | 1.85 | -0.35 | Neutral |
| 1972 | **-22.3%** | 1.58 | +0.58 | Positive |
| 1982 | **-11.4%** | 1.58 | +0.30 | Neutral |
| 1987 | **-14.3%** | 1.70 | +0.25 | Neutral |
| 1997 | **+0.2%** | 2.14 | +0.48 | Positive |
| 2015 | **-12.7%** | 2.21 | +0.35 | Neutral |
| 2023 | **-5.3%** | 1.60 | +0.73 | Positive |

**6 of 7 below normal. 5 of 7 below -10%. Mean -12.1%.** (Computed from repo data — V.)

So the honest headline is not "El Nino doubles the odds of a weak monsoon" (true of the
whole class) but: *if 2026 clears 1.5 during the season — which CPC's forecast implies —
it joins a group of seven in which only one monsoon escaped.*

**Caveat to carry:** this is peak ONI *during the monsoon*, not the event's calendar peak,
and n=7 is small. State both plainly. Do not dress a 7-case base rate as a forecast.

### The second insight: the measuring stick moved (RONI) — the strongest new finding

NOAA publishes a second index, the **Relative ONI (RONI)**, which subtracts the tropical-mean
SST trend. The physical argument: atmospheric convection responds to the Pacific's warmth
*relative to the rest of the tropics*, not to absolute local temperature. As the whole tropical
ocean warms, the raw ONI drifts upward for the same relative gradient.

Computed from `RONI.ascii.txt` and `oni.ascii.txt` (both V, today) — **mean ONI minus RONI, by decade:**

| 1950s | 1960s | 1970s | 1980s | 1990s | 2000s | 2010s | 2020s |
|---|---|---|---|---|---|---|---|
| -0.12 | -0.06 | -0.18 | -0.02 | -0.13 | +0.01 | **+0.23** | **+0.44** |

Roughly zero before 2000, then a monotone drift to **+0.44 C in the 2020s**. And for 2026:

| Season | ONI | RONI | gap |
|---|---|---|---|
| DJF 2026 | -0.37 | -0.88 | +0.51 |
| MAM 2026 | +0.51 | -0.04 | +0.55 |
| **AMJ 2026** | **+0.98** | **+0.47** | **+0.51** |

**CORRECTION (2026-07-30, after reading Hausfather's "The Strongest El Nino Ever",
theclimatebrink.com, 12-13 July 2026). I had this badly wrong and the error must not reach
prose.**

I originally wrote that RONI shows 2026 as "marginal" and therefore "disciplines the biggest-
El-Nino framing". **That compared a mid-development seasonal observed value (+0.47, AMJ) against
other events' lifetime peaks** — precisely the apples-to-oranges comparison this article exists
to criticise. The event is still developing; of course its current seasonal value is low.

What is actually true:

- **RONI does not deflate this event.** Hausfather's multi-model forecast puts the **RONI peak
  at 3.1 C** (10-90% of members 2.4-4.3), with 13 of 14 models projecting very strong and a
  **~77% chance of a record in RONI terms**. In raw Nino 3.4 terms the median peak forecast is
  **3.6 C against a 2015-16 record of 2.75 C**, with ~91% of 667 members exceeding that record.
- **What RONI actually changes is the benchmark.** On RONI the record event is **1982-83**, not
  2015-16. **Our own data reproduces this independently** (seasonal, unscaled): 1982-83 **+2.52**,
  1997-98 +2.38, 2015-16 +2.37, 1972-73 +2.27, 2023-24 +1.49. A genuine, checkable re-ranking.
- **Do not compare our RONI numbers to his.** His are **peak monthly** with the
  **L'Heureux et al. (2024) variance-restoration scaling** applied (his 1982-83 = 2.69). Ours are
  **seasonal three-month means, unscaled** (1982-83 = 2.52). Same ranking, different magnitudes.
  Label which is which every single time.

So the corrected RONI argument — still the article's best contribution, just pointed correctly:
RONI is the honest index for **cross-era comparison**, and it **re-ranks the historical record**
(1982-83, not 2015-16, is the benchmark). It does **not** license "this event is smaller than it
looks." Present both indices, label period/product/scaling, and let the re-ranking do the work.

**Also from Hausfather, and it changes the current-state picture (all V, his charts, NOAA data):**

- Daily Nino 3.4 was already **+2.0 C era-adjusted in mid-July 2026**. At the same date **1997
  was +1.6** and **2015 was +1.3**. *No year in the 45-year satellite record has run this hot
  this early.* This is consistent with our own weekly pull (+2.2 on 22 July).
- ENSO **phase-locks**: every strong event since 1950 peaked between October and January (lone
  exception: the two-year 1986-88 event, peaking August 1987). So substantial further
  intensification is expected **after** the monsoon ends.
- **His caveat, which we should carry:** no ensemble has ever forecast *and verified against* a
  3.6 C El Nino, because one has never happened. **Model agreement is not model skill.**

### Third: amplitude does not rank the damage — and flavour does not rescue the story

The two **largest** events in the table sit at **opposite ends of the outcome range** —
2015 (peak 2.21) gave -12.7%; 1997 (peak 2.14) gave **+0.2%**. Within the strong subset,
bigger is not worse.

The literature's explanation is **flavour**: central-Pacific ("Modoki") events focus
drought-producing subsidence over India more effectively than eastern-Pacific events
(Kumar et al., *Science*, 2006 — doi:10.1126/science.1131152).

**I tested this on the seven strong events with a crude flavour proxy (JJAS Nino1+2 anomaly
minus Nino4) and it did not replicate:**

| Year | Departure | N1+2 | N4 | N1+2 − N4 | Flavour | Fits Kumar? |
|---|---|---|---|---|---|---|
| 1972 | -22.3% | 1.85 | 0.07 | +1.78 | EP | **no** |
| 1982 | -11.4% | 0.68 | 0.25 | +0.43 | EP | **no** |
| 1987 | -14.3% | 0.98 | 0.56 | +0.42 | EP | **no** |
| 1997 | +0.2% | 3.64 | 0.48 | +3.16 | EP | yes |
| 2002 | -20.9% | 0.02 | 0.63 | -0.61 | CP | yes |
| 2009 | -18.3% | 0.69 | 0.37 | +0.32 | EP | **no** |
| 2015 | -12.7% | 2.17 | 0.96 | +1.20 | EP | **no** |
| 2023 | -5.3% | 2.80 | 0.83 | +1.96 | EP | partly |
| **2026 (Jun only)** | — | **2.82** | **1.22** | **+1.60** | **EP** | — |

Only 2002 is CP-flavoured; 1972, 1987, 2009 and 2015 were all EP-ish and all bad. So on this
proxy, **flavour does not predict Indian monsoon outcome in the strong-event set.**

Handle this honestly rather than dropping it. Kumar et al. use a composite/regression
decomposition, not this crude difference, so this is *not* a refutation of the paper — but it
does mean **we must not tell readers "2026 is eastern-Pacific flavoured, so India is probably
fine."** Explain flavour as a mechanism, show the negative result, and say the proxy is too
blunt to carry a 2026 forecast. A published negative result is rare in data journalism and
fits this masthead's instincts exactly.

**And the IOD rescue is not reliable either.** Positive-IOD strong events include 1997 (+0.2%)
*and* 1972 (**-22.3%**, the worst monsoon in the record). Keep the existing article's framing;
do not let the new +IOD signal become false comfort.

### Fourth: El Nino outlives the monsoon

CPC has it peaking **after** JJAS ends and persisting into early 2027. So the monsoon is
act one of three — and for the south peninsula the sign of the effect **flips**:
El Nino tends to *enhance* the October-December northeast monsoon that gives southern Tamil
Nadu about half its annual rain. Neither existing article covers the post-monsoon at all.
This is what makes the piece canonical rather than a news update: it hands the reader a
calendar that stays useful in December and in March 2027.

---

## 2. The narrative angle

> An ocean 10,000 km away is having its loudest year in a decade, and India is going to
> hear about it constantly. The useful question is not "is a drought coming" but "what does
> this signal actually license us to say, and when does it stop being about the monsoon?"

Three claims, in order:

1. **The odds really have moved** — and by more than the standard reassurance implies,
   because 2026 belongs to the strong-event class, not the average El Nino.
2. **The size of the Pacific anomaly still tells you almost nothing about the size of the
   damage.** Flavour, the Indian Ocean, timing within the season, irrigation, and stocks all
   get a vote. 1997 and 2015 are the proof.
3. **The monsoon is where the story starts, not where it ends.** The event peaks after the
   kharif season closes, which moves the real risk to reservoirs, rabi, the northeast
   monsoon and food prices in early 2027.

Register: the existing canonical article's — patient, base-rate-first, allergic to
false precision. Lead with the live numbers, then immediately discipline them.

---

## 3. Data sources

### 3.0 Which SST/temperature source is authoritative — the division of labour

Settled: **NOAA for ENSO, and it is not really a choice.** Copernicus and Berkeley both belong
in the article, but doing different jobs. Do not substitute one for another.

| Source | Use it for | Do **not** use it for |
|---|---|---|
| **NOAA CPC / ERSSTv5** | Everything ENSO: is it El Nino, how strong, how strong *relatively*, what flavour, what next. | — |
| **IMD** | India's official rainfall record and departures, the LRF, the ENSO/IOD bulletin. The headline India numbers. | Never substitute reanalysis rainfall for IMD rainfall in headline figures. |
| **Copernicus / ERA5** | The atmospheric mechanism **over India** — sub-regional precip, dewpoint, humidity, temperature anomalies by season (already ingested). Optionally C3S seasonal forecasts as a non-NOAA forecast voice. | Not a second opinion on Nino 3.4 — ERA5's SST is boundary-forced by HadISST2/OSTIA, so it is not independent of the same underlying SST analyses. |
| **Berkeley Earth** | India temperature context (already wired). **CC BY-NC — fine, site is non-commercial; attribute explicitly. See 3.2g.** | Wrong tool for ENSO (no independent SST — the ocean component derives from HadSST/ERSST). Cannot carry Act 7's *global* lag claim either — that needs ERA5/NOAAGlobalTemp. |

**Why NOAA is definitional, not preferential:** the ONI *is* a NOAA construct — the three-month
running mean of ERSSTv5 SST anomalies in the Nino 3.4 box (5N-5S, 170W-120W) against centred
30-year base periods — and the El Nino/La Nina declarations that IMD, the press and markets
react to are CPC's. Compute the index off a different product and you are no longer measuring
the thing everyone is arguing about.

**The four NOAA CPC files to pull** (all plain ASCII, no auth, all verified reachable today):

1. `data/indices/oni.ascii.txt` — ONI, 1950-present. **Already wired** in `ingest-noaa-enso.mjs`.
2. `data/indices/RONI.ascii.txt` — **Relative ONI, 1950-present. New, and the highest-value
   addition in the whole build** (see section 1). 918 lines, `SEAS YR ANOM`.
3. `data/indices/ersst5.nino.mth.91-20.ascii` — monthly Nino 1+2 / 3 / 4 / 3.4 SST and anomalies
   on a fixed 1991-2020 base. Needed for flavour. 919 lines.
4. ENSO Diagnostic Discussion + `products/analysis_monitoring/enso/roni/strengths` — alert status,
   strength probabilities, peak timing.

Plus **NOAA PSL** for the historical DMI and **BOM** for the operational weekly IOD index and
outlook (BOM is the better live IOD voice; NOAA PSL the better historical series).

Note the base-period trap: `oni.ascii.txt` uses **centred 30-year** base periods (so the
climatology shifts through the record) while `ersst5.nino.mth.91-20.ascii` uses a **fixed
1991-2020** base. Mixing them silently is a real error — the RONI decade table above is precisely
the quantified consequence of base-period drift. Record which base each series uses in metadata.

### 3.0a BUILT: the five CPC index series (2026-07-30) — and a near-miss worth reading

`scripts/ingest-noaa-enso.mjs` now pulls all five files. All five verified contiguous with no
duplicates, and row counts check out arithmetically:

| Source file | Series | Rows | Coverage |
|---|---|---|---|
| `oni.ascii.txt` | `climate.enso.oni` | 917 | 1950-DJF → 2026-AMJ |
| `RONI.ascii.txt` | `climate.enso.roni` | 917 | 1950-DJF → 2026-AMJ |
| `ersst5.nino.mth.91-20.ascii` | `climate.enso.nino_regions_monthly_ersst5` | 918 | 1950-01 → 2026-06 |
| `sstoi.indices` | `climate.enso.nino_regions_monthly_oisst` | 534 | 1982-01 → 2026-06 |
| `wksst9120.for` | `climate.enso.nino_regions_weekly` | 2343 | 1981-09-02 → 2026-07-22 |

(917 = 76 years x 12 seasons + 5 seasons of 2026. 2343 weekly rows at exact 7-day steps.)

**The near-miss.** The first version split the weekly file on whitespace. But
`wksst9120.for` is fixed-width Fortran, so a **negative anomaly is glued to the SST**:
`20.6-0.1`, not `20.6 -0.1`. Whitespace-splitting therefore dropped **every week with a
negative anomaly** — leaving 614 of 2343 rows, a **warm-biased subset that still looked like a
plausible series**. Had it shipped, the article's hero chart would have systematically
overstated how warm the Pacific runs, in an article whose entire argument is about not
overstating that.

What caught it was arithmetic, not inspection: 614 rows cannot be 45 years of weekly data.
So the fix is now permanent and automatic:

- `numbers()` tokenises on number *shape* (`/-?\d+(?:\.\d+)?/g`), handling glued and
  space-separated files alike.
- `completenessIssues()` runs every ingest and warns loudly on duplicate keys, non-contiguous
  months/seasons, non-7-day weekly steps, **and a negative-anomaly share below 20%** — which is
  the specific tripwire for this bug returning. Results are written to
  `data/catalog/noaa-enso-manifest.json` as `checks`, and status becomes
  `ready-with-warnings` rather than `ready`.

**Two false alarms, for the record, so nobody re-chases them:**

1. I flagged 275 weeks that break the west-warm SST gradient (Nino4 > Nino3.4 > Nino3 >
   Nino1+2). Diffed against the raw file: **the parse is exact.** 87% of them fall in
   February-April and the dominant failure is Nino3.4 vs Nino3 — that is the boreal-spring
   seasonal cycle in the eastern Pacific, not ENSO and not a bug. The gradient is a tendency,
   not a law; do not code it as an assertion.
2. Only 26% of those weeks fall in El Nino years, so they are **not** an eastern-Pacific
   El Nino signature either. Do not reach for that as a flavour metric.

### 3.0b BUILT: the year-spaghetti data layer (2026-07-30)

`scripts/derive-enso-year-trajectories.mjs` →
`climate.enso.nino34_year_trajectories` (2325 weeks, **45 years, 1982-01-06 → 2026-07-22**,
status `ready`). This is the data behind Hausfather's best figure.

**The baseline trap, and why this needed a derive rather than charting the raw file.**
`wksst9120.for` anomalies use a **fixed 1991-2020** climatology. Overlaying calendar years on a
fixed base bakes the Pacific's warming trend into the comparison — older years read too cool,
recent ones too warm — so it would "show" 2026 beating 1997 partly *because the ocean has warmed
since 1997*. That is not the chart's claim, and it is the exact error this article criticises.

**Method.** NOAA's ONI convention uses *centred 30-year* climatologies. We recover the
adjustment without needing pre-1981 weekly data, because the difference between the two
published series **is** the base-period shift:

```
offset(year) = mean over that year's seasons of [ ONI(season) − 3-month mean of ERSSTv5
               monthly Nino 3.4 anomaly on the fixed 1991-2020 base ]
era_adjusted_weekly = fixed_weekly_anomaly + offset(year)
```

**Validation — the offset steps in discrete 5-year blocks**, matching NOAA's base-period
schedule exactly: 1982-90 **+0.177**, 1991-95 +0.02, 1996-2000 +0.06, 2001-05 +0.025,
2006-10 ~0.00, 2011-20 **+0.088**. That block structure is the signature of a correctly derived
adjustment, and it is what the script now asserts. (My first check only tested
`earlyMean > recentMean`, which passed by a hair and would have passed on noise too. Replaced.)

**Two findings worth carrying into the prose:**

1. **The adjustment is real but small — about 0.19 C across the whole record.** Because NOAA's
   30-year windows overlap heavily and the equatorial cold tongue has warmed less than the global
   ocean. So the baseline choice does **not** carry this chart.
2. **The claim is robust to the baseline.** At mid-July the **ranking is identical** both ways and
   2026 leads by a wide margin either way:

   | Year | Fixed 1991-2020 | Era-adjusted |
   |---|---|---|
   | **2026** | **+2.20** | **+2.33** |
   | 1997 | +1.40 | +1.46 |
   | 2015 | +1.20 | +1.28 |
   | 2023 | +1.10 | +1.19 |
   | 1982 | +0.60 | +0.76 |

**Cross-check against published figures, and a discipline note.** Hausfather, using NOAA's
*daily* era-adjusted OISST, reports mid-July 2026 **+2.0**, 1997 **+1.6**, 2015 **+1.3**. Ours
agree within 0.1-0.2 C — but note our adjustment makes 2026's lead *slightly larger* than his.
So: **where precision matters, cite his daily figures rather than ours, and never report our
values to more than one decimal.** The artifact keeps both columns
(`nino34_anomaly_fixed_1991_2020_c` and `nino34_anomaly_era_adjusted_c`) so the two can be
charted against each other during review.

**Still needed for the chart itself:** a new **`viz.ts` builder**. The renderer uses bespoke
per-type builders and `LineVisual` is `{series:[{label,values,emphasis}]}`, so a 45-series
spaghetti grouped from one table has no existing equivalent — `countryMetricLines` (viz.ts:1772)
is the closest analogue to copy. **Front-end work, not data work.** The `emphasis` column is
already populated (`subject` for 2026; `benchmark` for 1997, 2015, 1982) so the builder can style
straight off the data.

### 3.1 Refresh (already wired, just stale)

| What | Script | Why |
|---|---|---|
| **NOAA ONI** | `scripts/ingest-noaa-enso.mjs` (fetches `oni.ascii.txt` live) | Local file stops at MAM 2026 and is fetched 2026-06-06. CPC now has **AMJ +0.98**, and revised MAM to +0.51 (local says +0.48). Straight re-run. |
| **NOAA DMI (IOD)** | `scripts/ingest-noaa-enso.mjs` / `noaa-iod.global.dmi_monthly.json` | Must capture the developing +IOD. This is the factual correction to `q.climate.monsoon_2026`. |
| **IMD historical rainfall** | `scripts/ingest-imd-monsoon-rainfall.mjs` | Confirm 2025 is present and extend if IMD has posted revisions. |
| **All `el_nino.*` derived series** | `scripts/derive-enso-iod-imd-monsoon.mjs` | Re-derive after the ONI/DMI refresh so every base rate moves together. |

### 3.2 New ingests (the real build work)

| # | Series | Source | Notes |
|---|---|---|---|
| 1 | `climate.enso_2026.cpc_outlook` | CPC ENSO Diagnostic Discussion + `cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/strengths` + IRI plume | Alert status, strength probabilities by season, peak timing. **Two different "very strong" probabilities appeared in secondary sources today (81% and 63%) — resolve against the primary PDF and publish only what the PDF says.** |
| 2 | `climate.monsoon_2026.season_to_date` | IMD (`mausam.imd.gov.in` monsoon information; weekly/daily rainfall statements) | Cumulative all-India departure by week, plus the four IMD regions. The spine of Act 1. Snapshot-dated; it is a moving number. |
| 3 | `water.reservoirs_2026.storage_weekly` + `..._by_state` | **CWC Reservoir Level & Storage Bulletin**, `cwc.gov.in/en/reservoir-level-storage-bulletin` | **Highest-value new source. Absent from the whole repo** (no `scripts/ingest-cwc-*` exists). Weekly, 166 reservoirs, gives live capacity %, vs last year, vs 10-year normal, by state and basin. |
| 4 | `agriculture.upag.progressive_crop_area_sown` | **UPAg Dash `progressivecropareasown` — already wired** | **Solved, no new script needed.** See 3.2a. |
| 5 | `climate.el_nino.strong_event_outcomes` | Derived from `derived.IN.climate.enso_iod_imd_monsoon_join.json` | The 7-row table in section 1. Cheap — pure derivation from data already here. Load-bearing chart. |
| 6 | `climate.el_nino.northeast_monsoon_by_phase` | Derived from `imd.IN.climate.imd.subdivision_rainfall.json` | **Confirmed feasible today:** that file has all 12 months for 1901-2024 across 36 subdivisions, so Oct-Dec totals for Tamil Nadu / Kerala / coastal AP / Rayalaseema are fully derivable and can be split by ENSO phase. Delivers the sign-flip chart with no new fetching. |
| 7 | `climate.el_nino.flavour_index` | CPC Nino1+2, Nino3, Nino4 monthly (`ersst5.nino.mth.91-20.ascii`) | EP vs CP diagnosis for 2026 vs 1997 vs 2015. The mechanism chart for Act 3. |
| 8 | `prices.food_inflation_2026.current` | MOSPI CPI/CFPI press releases | The price channel's starting level. June 2026: CPI **4.38%**, CFPI **5.32%** (base 2024=100, PIB PRID 2284125) — U, confirm against the MOSPI PDF. |

### 3.2a Kharif sowing is already solved — UPAg Dash (verified working 2026-07-30)

No new scraper needed. `scripts/ingest-upag-dash-apy.py` already includes the
`progressivecropareasown` report (grid key `pcasgridOptions`, artifact
`upag.IN.agriculture.progressive_crop_area_sown_dash`). The tracked copy was stale
(fetched 2026-06-06, 102 rows, 2024-25 vs 2025-26).

**I re-ran it today and it works** — 168 rows, **2026-27 vs 2025-26**, i.e. the live season:

```
python3 scripts/ingest-upag-dash-apy.py --reports=progressivecropareasown --wait-seconds=60
```

Mechanism: public AG Grid dashboard at `dash.upag.gov.in/{slug}`, read via headless Chrome
(selenium 4.41 + `/usr/bin/google-chrome`, both present on this machine). **No login.** The
"government-only login" note in `DATA_SOURCES.md` refers to UPAg's *authenticated* APIs, not
these Dash reports. Metrics available per crop: `Area Sown` (current and prior year),
`Difference In Area Coverage Over`, `% of Increase/Decrease Over`, `Target Area`,
`Normal (DA&FW)`.

**Live figures, all-India, lakh hectares (V — official UPAg):**

| Crop | 2026-27 | 2025-26 | % change | Full-season normal |
|---|---|---|---|---|
| **Grand Total** | **787.38** | **826.19** | **-4.70%** | 1104.45 |
| Rice | 234.43 | 240.62 | **-2.57%** | 412.00 |
| Total Oilseeds | 163.54 | 167.00 | -2.07% | 200.08 |
| Groundnut | 40.20 | 40.77 | -1.42% | 46.79 |
| Total Pulses | 84.57 | 91.46 | -7.54% | 123.64 |
| Maize | 77.79 | 86.15 | -9.70% | 80.77 |
| Jowar | 11.07 | 12.45 | -11.12% | 14.44 |
| Bajra | 49.54 | 58.08 | **-14.71%** | 70.94 |
| Ragi | 1.56 | 2.16 | **-27.94%** | 12.01 |

**This is the single best chart in the article.** The damage sorts almost perfectly by
irrigation cover: irrigated rice -2.6%, rainfed millets -11% to -28%. That is the existing
canonical article's ICRISAT thesis (1966-2017) reproducing itself in a live season, from an
independent government source. Put it directly beside `crop_yield_sensitivity`.

Three traps:

- **Do not read 787 against the 1104 normal as a 29% shortfall.** Sowing is not finished;
  that column is the *full-season* normal. Only the y/y comparison is meaningful mid-season.
- **These numbers move fast.** Secondary reporting had pulses at **-15.08%** on 17 July;
  UPAg now shows **-7.54%**. Sowing recovered as the rains revived. Every sowing figure must
  carry its date, and the "-15%" number is stale rather than wrong.
- **`Total Coarse Cereals` has no current-year value** in today's pull (component crops do).
  Aggregate from components or omit the total; do not silently print a blank.

**Refresh dependency — check before overwriting the tracked artifact.**
`scripts/derive-edible-oil-imports.mjs:161` reads this exact file and builds a Total Oilseeds
sowing-progress series from it. Refreshing the artifact changes that article's input, so
re-run that derive and eyeball the edible-oil page in the same pass. I deliberately left the
tracked file untouched; today's pull is parked at
`<scratchpad>/upag-progressive-sown-20260730.json`.

Also note `scripts/ingest-upag-dash-apy.py` writes to **relative** `data/series/...`, so it
must be run from the repo root, not from `scripts/`.

### 3.2c The index ladder — verified, and now the likely hero chart

Chasing the "+2.1 C" figure that appears in IRI's Quick Look turned up a **machine-readable
weekly CPC file**: `data/indices/wksst9120.for` (weekly Nino 1+2 / 3 / 3.4 / 4, SST and anomaly,
1991-2020 base, back to Sept 1981, updated weekly). Also `data/indices/sstoi.indices` — the
same regions monthly, OISST-based. Both V today. Note `wksst8110.for` is the **legacy
1981-2010 file and is frozen at Jan 2021** — do not use it.

Verified latest weeks (Nino3.4 anomaly): **08JUL +2.0, 15JUL +2.1, 22JUL +2.2** — and
Nino1+2 at **+3.8**, an extraordinary far-eastern-Pacific signal (1997's JJAS Nino1+2 was +3.64).

So there are **five official numbers for "how big is this El Nino"**, all current, all NOAA:

| Measure | Value | Product / period | Base |
|---|---|---|---|
| Weekly Nino 3.4 | **+2.2** | OISST, week centred 22 Jul 2026 | 1991-2020 |
| Monthly Nino 3.4 anomaly | +1.55 | OISST, June 2026 | 1991-2020 |
| Monthly Nino 3.4 anomaly | +1.44 | ERSSTv5, June 2026 | 1991-2020 |
| Seasonal ONI | +0.98 | ERSSTv5, AMJ 2026 | centred 30-yr |
| **RONI** | **+0.47** | ERSSTv5 trend-adjusted, AMJ 2026 | centred 30-yr |

**+0.47 to +2.2 for the same ocean.** This is the article's thesis in one table, and every
figure is official and checkable. Strong candidate for the hero.

**Be scrupulous about why they differ** — do not imply the whole spread is index choice:

- **RONI vs ONI (+0.98 → +0.47)** is the substantive one: the tropical-warming trend adjustment.
- **ERSST vs OISST (1.44 vs 1.55)** is a product difference — small, honest noise.
- **Weekly vs seasonal (+2.2 vs +0.98)** is mostly *smoothing and timing*: the weekly value is
  late July and unsmoothed, the ONI is a three-month mean centred two months earlier, during
  which the Pacific genuinely warmed a lot. Attribute this gap to time, not to method.

Label every number with its product, period and base period. Presented carelessly this table
would itself become the kind of misleading comparison the article is criticising.

### 3.2b hausfath/climate-dashboard — read it, do not copy it (no licence)

Zeke Hausfather's dashboard (Python + Plotly Dash, daily GitHub Actions/Render refresh).
Relevant, with one strong hit:

- **It uses both ONI and rONI.** Independent confirmation that the RONI framing in section 1
  is the serious way to read this event, from a well-known climate scientist — worth citing
  when we make that argument.
- **Multi-model ENSO forecast "mega plume"** — CFSv2, NMME, C3S and CanSIPS combined, ~13
  models and ~650 ensemble members. A better Act 1 forecast object than CPC's categorical
  probabilities alone, because it shows the *spread* rather than a single number. Good
  reference implementation for how to assemble it.
- **Observational temperature records** (HadCRUT5, GISTEMP v4, NOAAGlobalTemp, Berkeley,
  ERA5) — feeds the Act 7 lagged-warming story.
- **No India or monsoon data at all**, so it complements this article rather than overlapping.

**Licence check — it is NOT MIT.** The GitHub API returns `Not Found` for
`/repos/hausfath/climate-dashboard/license`, the repo metadata carries no `license` field, and
the root tree contains no `LICENSE`/`COPYING` file (root: `.github .gitignore ENSO
PROJECTION_METHODOLOGY.md Procfile README.md app.py assets config.py data forecast_skill
mockups render.yaml requirements.txt run.py scheduler.py setup.sh src tests`). **No licence
means all rights reserved by default — do not copy code from it into this repo.**

In practice this costs us nothing:

- **Methods and facts are not copyrightable.** Reading `PROJECTION_METHODOLOGY.md` and
  reimplementing the plume ourselves is fine, and citing him for the RONI argument is fine.
- **He could not have relicensed the data anyway** — it is all third-party (NOAA, ECMWF,
  HadCRUT, GISTEMP, Berkeley). The terms that bind us are the **upstream providers'**, which is
  exactly why 3.0 says pull from primaries.

Upstream terms for everything this article touches:

| Provider | Terms | Obligation |
|---|---|---|
| **NOAA** (ONI, RONI, weekly/monthly Nino, CPC discussions) | US Government work — public domain | Citation requested, not required |
| **Copernicus / ERA5** | Free reuse incl. commercial | **Attribution required**; must not imply endorsement |
| **Berkeley Earth** | CC BY-NC 4.0 — non-commercial only | **OK: Indica is non-commercial.** Name the licence in `sourceNotes` + metadata |
| **GISTEMP** (NASA) | Public domain | Citation requested |
| **HadCRUT5** (Met Office) | Open Government Licence | Attribution |
| **IRI Quick Look** | **CC BY 4.0** | Attribution |
| **IMD / UPAg / CWC / MOSPI** | Indian government publications | Attribute; no bulk-redistribution claims |

So: **no licence obstacle to the article.** The only rule is do not lift his code.

### 3.2d IRI ENSO Quick Look — quotable, but not ingestible

`iri.columbia.edu/our-expertise/climate/forecasts/enso/current/`. Content is **CC BY 4.0**, so
we can quote and cite it freely. Current issue (20 July 2026): all **26 models** forecast
El Nino strengthening through 2026 and persisting into early 2027; peak in **OND 2026**, with
**23 of 26 forecasting very strong (Nino 3.4 >= +2.0)**; **El Nino probability 100% from JAS
2026 through JFM 2027**; weekly Nino 3.4 quoted at +2.1 (which our own `wksst9120.for` pull
independently confirms — see 3.2c).

**Catch: "We are no longer providing forecast data."** There is no downloadable file, so this
cannot be automated. Treat it like the existing `ingest-imd-monsoon-2026-forecast.mjs` pattern —
hand-transcribed, dated, triangulated, with the figures in metadata rather than as a frozen
chart. It also resolves the conflicting very-strong probabilities noted in 3.2: prefer the
**model count (23 of 26)** over any single percentage, since that is what the source actually
states and it cannot be misread.

It also carries an **IOD forecast**, giving us a second voice alongside BOM on the +IOD call.

### 3.2e Further sources worth leveraging, ranked

Two of the best are **already in this repo, unused by either El Nino article.**

| Rank | Source | Why it matters here | State |
|---|---|---|---|
| 1 | **IITM Pune homogeneous regional rainfall, 1871-present** (`tropmet.res.in`) | Extends the monsoon record ~30 years beyond IMD's 1901 table, picking up the **1877 and 1899 famine droughts — both El Nino years**. For a piece claiming canonical status, being able to run the base rate back to 1871 is the single biggest upgrade available. Also the dataset Indian monsoon literature actually uses. | New |
| 2 | **DFPD central pool foodgrain stocks + stocking norms** | **Already ingested** (`dfpd.IN.central_pool_monthly_opening_stock.json`; `scripts/adapters/dfpd-foodgrain.mjs` already parses the "Foodgrains Stocking Norms" table). This is the honest answer to why a drought no longer becomes a famine or even a cereal price spike — stocks vs norms is the buffer. The price act is incomplete without it. | **In repo, unused** |
| 3 | **CGWB groundwater (INGRES)** | **Already ingested** (`scripts/ingest-cgwb-ingres.mjs`). The invisible reservoir. It explains the *hidden cost* of the irrigation shield: El Nino yield protection is bought by pumping groundwater, so the damage shows up in falling water tables and power subsidies rather than in the harvest. A genuinely under-covered second-order insight. | **In repo, unused** |
| 4 | **BOM Southern Oscillation Index** (1876-present, daily/monthly) | The *atmospheric* half of ENSO. A real El Nino needs a coupled atmospheric response; if the SOI has not gone properly negative, the ocean is running ahead of the atmosphere. Pairs with RONI as a second independent "is this as big as it looks" check, and it is long, free and trivial to parse. | New |
| 5 | **MGNREGA work demand** (`nrega.nic.in`, monthly, district) | Turns "two in five jobs" from an abstraction into a measurement. Rural distress shows up as a spike in guaranteed-work demand, and it is the fastest-moving human indicator India publishes. Strongest candidate for the human-consequence chart. | New |
| 6 | **MJO — BOM RMM index** | Explains *within-season* monsoon breaks, which is precisely what the subseasonal act is about. A weak monsoon is usually a sequence of long breaks, not uniformly less rain; the MJO is what sets their timing. Rarely covered in Indian press. | New |
| 7 | **FAO Food Price Index + World Bank Pink Sheet rice** | India as *transmitter*, not just victim: after the weak 2023 monsoon India restricted rice exports and moved world prices. Gives the piece an international dimension nothing else here has. | New |
| 8 | **India-WRIS** (`indiawris.gov.in`) | May expose reservoir storage through a real API rather than the CWC bulletin PDF. Worth 30 minutes before writing `ingest-cwc-reservoirs.mjs` — could remove the only new scraper on the list. | Check first |
| 9 | **NOAA equatorial heat content / warm water volume (TAO-TRITON)** | The leading indicator of whether the event keeps growing after the monsoon — feeds the Act 7 forward look rather than the monsoon acts. | New |
| 10 | **Grid-India / CEA hydro generation + peak demand** | Second-order channel: low reservoirs cut hydro output, pushing thermal generation and power costs, while El Nino springs drive record peak demand. Ties this article to the repo's existing energy work. | New |
| 11 | **AGMARKNET daily mandi prices** | Leading edge of food inflation weeks before CPI prints. Adapter exists (`scripts/adapters/data-gov-in.mjs`) but needs a free `DATAGOVIN_API_KEY` in `.env`. | Adapter ready, key needed |

Deliberately **not** recommended: ERA5 SST as an ENSO cross-check (not independent — see 3.0);
Berkeley Earth for anything ENSO; and any dependence on third-party dashboards as live feeds.

### 3.2f ECMWF open data — right organisation, wrong dataset

`ecmwf.int/en/forecasts/datasets/open-data`. Licence is **CC BY 4.0** plus ECMWF Terms of Use —
redistribution and commercial use permitted with attribution, which makes it one of the more
permissive large meteorological sources. IFS and AIFS, 0.25 degree GRIB2, four runs a day
(00/06/12/18 UTC), out to 360 hours. Python client `ecmwf-opendata` is **Apache-2.0**, so that
client *is* safe to use.

**But: "Seasonal products — not yet available."** Open data is medium-range only — 15 days.
This article is a seasonal-to-annual story, and a 15-day forecast dates the moment it is
published, which is the opposite of canonical. **Skip it.**

What we would actually want from this family is **Copernicus CDS seasonal forecasts**
(SEAS5 / C3S multi-system, dataset `seasonal-monthly-single-levels`) — months-ahead
precipitation and SST, giving a genuine third forecast voice independent of NOAA and IMD for
Act 1 and the Act 7 post-monsoon outlook.

**The pipeline for that already exists in this repo and the credentials are live** (verified
2026-07-30): `scripts/adapters/era5_ingest.py` plus six other ERA5 adapters, documented in
`scripts/adapters/copernicus-cds.md`; ERA5 series carry
`sourceUrl: cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means`,
last fetched 2026-06-11.

**Credential state — verified working:**

- `~/.cdsapirc` exists and is well-formed: `url: https://cds.climate.copernicus.eu/api` and a
  36-character UUID personal access token (the correct format for the current CDS).
- `.env` also carries the token under a **non-standard lowercase key, `copernicus`** (line 9),
  alongside `CDSAPI_URL`. Worth renaming to `CDSAPI_KEY` to match `copernicus-cds.md`, which
  documents `CDSAPI_KEY` — anything grepping for the documented name will miss it today.
- `cdsapi` is installed and imports.
- Auth confirmed live: `GET /api/retrieve/v1/processes` returns HTTP 200, and
  `seasonal-monthly-single-levels` and `seasonal-original-single-levels` both resolve.

**SEAS5 is now live and verified end to end (2026-07-30).** The licence gate has been
accepted. A real minimal request (ECMWF system 51, total precipitation, July 2026, leadtime
month 1, India box 30/70/10/90, GRIB) was **accepted with HTTP 201 and completed `successful`
in about 40 seconds**, then cleaned up. Nothing blocks a SEAS5 ingest.

For the record, before acceptance the same request returned
`HTTP 403 "required licences not accepted"` — so if a *different* CDS dataset is ever added,
expect the same one-off click per dataset, exactly as `copernicus-cds.md` warns.

Caveat if we do add it: seasonal models have decent skill on ENSO and tropical SST but much
weaker skill on Indian monsoon *rainfall*. Use SEAS5 for what the models say about the Pacific
and the post-monsoon, not as a rainfall prediction. **Treat this as optional** — CPC, IRI and
IMD already cover the forecast side adequately.

### 3.2g Berkeley Earth is CC BY-NC — a licensing flag that reaches beyond this article

Per `berkeleyearth.org/data/`: *"Berkeley Earth's data is licensed under Creative Commons
BY-NC 4.0 International for non-commercial use only. Commercial licensing available upon
request; free access for academics and journalists."*

**This corrects what I said earlier in this brief** — I had it as plain CC BY 4.0. It is
**BY-NC**. That is a real distinction: BY-NC is not a blanket permission, and the
journalist/academic access is a grant Berkeley Earth extends, not a CC term.

**It affects existing published articles, not just this one.** The repo already ships
Berkeley Earth data in at least two articles — `climate.berkeley.temp_anomaly`,
`climate.berkeley.temp_abs` and `climate.derived.temp_anomaly_berkeley_1991_2020` appear at
`v1-indicators.mjs` lines ~4277-4488 and ~5322-5452 — pulled from
`berkeley-earth-temperature.s3.us-west-1.amazonaws.com/Regional/TAVG/india-TAVG-Trend.txt`
(fetched 2026-06-11).

**RESOLVED (2026-07-30): Indica is non-commercial, so BY-NC is satisfied.** Berkeley Earth
stays usable, here and in the existing articles. Two residual obligations:

- **Attribution must be explicit** — name Berkeley Earth *and* the CC BY-NC 4.0 licence in
  `sourceNotes`, not just in the auto-linked chart SOURCE line.
- **Record the licence in artifact metadata at ingest time.** If the site ever monetises
  (ads, sponsorship, paid tiers), every BY-NC source needs revisiting, and that audit is only
  cheap if the licence is written down. No other source in this article carries a
  non-commercial restriction.

**Even so, prefer ERA5 for Act 7** — not for licensing reasons now, but because the repo's
Berkeley series is **India regional TAVG**, and Act 7's lagged-warming point is about *global*
temperature peaking a few months after the El Nino peak. Berkeley India cannot carry that
claim. Sensible split:

- **India's hot spring of 2027** (the more relevant Indian angle) — Berkeley India TAVG
  (already wired) plus the IMD temperature anchors and ERA5 regional series already in the repo.
- **The global lag context** — needs a global series, so use one of:

| Alternative | Terms | Note |
|---|---|---|
| **ERA5 / Copernicus** | CC BY 4.0, commercial OK | Already wired, credentials verified live today. First choice. |
| **NOAAGlobalTemp** | US Government, public domain | Simplest possible terms |
| **GISTEMP v4** (NASA) | Public domain | Long, well known |

Two further reasons Berkeley is the wrong pick here anyway: it publishes **no independent
SST** (the ocean component derives from HadSST/ERSST), and per the same page the **1x1 degree
products stopped updating in Q2 2025**, with the 0.25 degree high-resolution product now
primary. The repo's series use the *regional* TAVG file rather than the deprecated grid, so
they are not stale — but it is another reason not to build anything new on it.

### 3.2h OWID ENSO-vs-temperature — solves Act 7, and corrects my Act 7 claim

`ourworldindata.org/grapher/global-temperature-anomalies-by-el-nino-la-nina`. The CSV
(`?csvType=full&useColumnShortNames=true`) is far richer than the chart title suggests:

- Columns `entity, code, day, temperature_anomaly, oni_anomaly` — **195,320 rows, 213 entities**.
- **Monthly**, 1950-02 to **2026-06**. **Both `World` and `India` present**, 917 months each.
- `oni_anomaly` rides on the `World` rows and **matches our own CPC series exactly**
  (2026-06 = +0.98 = AMJ ONI; 2026-05 = +0.51) — a free cross-check on our ingest.
- OWID licence is CC BY, and the repo already has the pipeline: `scripts/adapters/owid.mjs`,
  `ingest-owid.mjs`, `ingest-owid-climate-shared.mjs`, `OWID_BASE_URL` in `.env`. Cheap to add,
  and it avoids the Berkeley BY-NC question entirely.

**I tested the Act 7 lag claim on it.** Correlating detrended monthly temperature at *t+lag*
against ONI at *t*, using **two independent detrendings** (121-month centred moving average,
and 12-month differencing — the latter has no window/end bias, which matters on a warming
record):

| | lag 0 | lag 1 | **lag 2** | lag 3 | lag 4 | lag 6 | peak |
|---|---|---|---|---|---|---|---|
| **World** (centred MA) | +0.48 | +0.51 | **+0.52** | +0.51 | +0.49 | +0.43 | **2 mo** |
| **World** (12-mo diff) | +0.53 | +0.58 | **+0.60** | +0.59 | +0.56 | +0.46 | **2 mo** |
| **India** (centred MA) | +0.19 | +0.21 | **+0.23** | +0.22 | +0.21 | +0.18 | 2 mo |
| **India** (12-mo diff) | +0.23 | +0.26 | +0.28 | **+0.28** | +0.27 | +0.22 | 3 mo |

n ≈ 890-905 months. Both methods agree, so the result is robust.

**What this licenses (V):** global temperature lags ONI by about **2 to 3 months**, with a
solid relationship (**r ≈ 0.52-0.60**). With CPC and IRI putting the ONI peak around **OND
2026**, that dates the peak global temperature response to roughly **December 2026 - February
2027**. That is a concrete, defensible forward statement, and unlike the flavour hypothesis the
underlying physics is well established rather than merely correlational.

**What it does NOT license — a correction to my own plan.** I had proposed building part of
Act 7 on "El Nino means a hot Indian spring in 2027." **India's own temperature response is
weak**: r ≈ 0.23-0.28, so ENSO explains only about **6-8% of the variance** in Indian monthly
temperature anomalies. Same timing as the global signal, far less of it. So:

- State the **global** lagged-warming point, which the data supports.
- Do **not** promise a hot Indian spring on this evidence. If the heat angle is wanted, it
  needs the repo's IMD heatwave and temperature-anchor series carrying it, with the ENSO link
  described as weak.
- The genuinely strong India-specific forward story in Act 7 is **water and rabi** — reservoir
  carryover and groundwater — not temperature.

### 3.2i De-risking spike on the two live sources (2026-07-30) — both obtainable

Run before building anything else, because if the live data were unobtainable the article's
"current status" premise would have had to change. **Verdict: both are obtainable, so the frame
is safe.** Neither is a ten-minute job.

**Reservoirs — three routes, ranked.**

1. **India-WRIS ArcGIS REST server** — `arc.indiawris.gov.in/server/rest/services` returns 200
   with folders `[Admin, Common, DataDownload, eSwis, FeatureService, Hosted, HydrologicalData,
   NWIC, SubInfoSysLCC, Utilities, Vassar]`, and `HydrologicalData/Hydrological_Data` exists as
   both a **FeatureServer and MapServer**. ArcGIS REST is well documented and queryable
   (`/query?where=...&outFields=*&f=json`). **Most promising unexplored lead — start here.**
2. **India-WRIS JSON API** — `POST https://indiawris.gov.in/Dataset/Reservoir` is real and
   unauthenticated. It validates parameters incrementally (`stateName`, then `districtName`
   required, as Spring `@RequestParam` — so form-encoded, not a JSON body) and returns a
   structured envelope `{"statusCode":...,"message":...,"data":[]}`. With all required params
   present it returns `"Data NOT Fetch"`, meaning the **parameter vocabulary** (agency names,
   date format) is wrong. Do not hand-guess it: **capture the dashboard's actual XHR with the
   selenium setup already proven for UPAg** (`scripts/adapters/upag_dash.py`).
3. **CWC weekly bulletin PDF** — `cwc.gov.in/en/reservoir-level-storage-bulletin` returns 200.
   Reliable fallback, but PDF parsing.

**IMD in-season rainfall — available, fiddly.**

- `mausam.imd.gov.in/responsive/monsooninformation.php` (200) indexes exactly what Act 1 needs:
  *Cumulative Rainfall Activity*, *Rainfall Over Homogeneous Regions*, *Week by Week Rainfall
  Activity*, *All India Rainfall Time Series*, plus its own ENSO and IOD index pages.
- `mausam.imd.gov.in/responsive/rainfallinformation_msd.php` (200, 68 KB) **contains live 2026
  data** — 41 "Departure" labels, "Cumulative", and real percentages (-99%, -88%, -78%, -25%,
  -15%).
- **Two cautions.** The markup did not yield to a quick regex table parse, so it is likely
  JS-rendered — expect selenium. And the page carries a **future date label ("05 August 2026")**,
  which suggests it mixes *forecast* distribution with *observed* cumulative. **Separate observed
  from forecast before charting anything from it**, or Act 1 will silently present a forecast as
  an observation — the exact error this article criticises.
- Dead end: `internal.imd.gov.in/pages/monsoon_main.php` is a METNET login portal, not data.

### 3.2j Can we build charts like Hausfather's? Three yes, four no — and a strategy note

Assessed against his eight figures and the repo's chart vocabulary (50+ types in
`v1-indicators.mjs`: `multiLine` 282 uses, `tableBars` 184, plus `stripes`, `scatterXY`,
`linePanels`, `sparkGrid`, `scenarioSpread`, `stripPair`, `rankedChange`).

**Reproducible now, from data already on disk:**

| His figure | Our route | Chart type |
|---|---|---|
| **"No El Nino has run this hot by July"** — every year's Nino 3.4 trajectory as grey spaghetti, 2026/2015/1997 highlighted | `noaa-enso.global.nino_regions_weekly_oisst` (2343 weeks, 1981-2026). He uses daily via CoastWatch ERDDAP; **weekly is a close approximation** and needs no new source. | `multiLine`, one series per year |
| **"No El Nino on record looks like this"** — monthly trajectories of the strongest events across development year and decay | `nino_regions_monthly_ersst5` (918 months, 1950-2026). Plot 1972-73, 1982-83, 1997-98, 2015-16, 2023-24 vs 2026, Jan → following Jun. | `multiLine` |
| **"150 years of El Ninos"** — peak intensity per event with weak/moderate/strong bands | Derive peak Nino 3.4 (and RONI) per event from our seasonal + monthly series. **1950-2026 only**; his 1877-1949 tail needs HadISST, which we do not have. | `tableBars` (lollipop-ish) |

**Strongest pick of the three: the year-spaghetti chart.** It is the single most striking figure
in his piece, it needs no new data, and it makes the "this is genuinely unprecedented" point
visually in one frame. Build it.

**Not reproducible without new capability:**

| His figure | Blocker |
|---|---|
| Member-peak histogram (667 members) | Needs full NMME + C3S ensemble downloads. Our CDS access gives **SEAS5 = one model**, not 14. |
| Per-model median + 10-90% ranges | Same. |
| Small-multiples of each model's March→July forecast evolution | Same, plus five initialisation vintages. |
| **Per-model SST anomaly maps** | Needs gridded SST fields **and a global map chart type**. The repo has `choropleth` (India states) and `scenarioMaps`, but nothing for global gridded fields. New chart type + new data — a large lift. |

**Strategy note — do not try to out-Hausfather Hausfather on the Pacific.** He published this on
12-13 July with 14-model ensemble access we do not have, and he does it definitively. Two
consequences:

1. **Build the three reproducible charts as scene-setting only** — they establish "this event is
   extraordinary" in Act 1, then hand off. **Cite him** for the ensemble detail (3.6 C median,
   91% exceeding the record, per-model spread) rather than trying to rebuild it. His piece is
   CC-able as a citation; the underlying NOAA/C3S data is public.
2. **Our differentiator is India, which he does not mention once.** The whole transmission chain
   — monsoon base rates conditioned on strong events, regional and subseasonal distribution, the
   irrigation shield visible live in UPAg sowing, reservoirs, foodgrain stocks, groundwater, the
   northeast-monsoon sign flip, rabi and prices into 2027 — is ours alone. **That is where the
   effort should go.** A reader who has read Hausfather still learns everything that matters to
   India from us.

### 3.3 Reuse unchanged from `q.climate.el_nino_india`

`regional_sensitivity`, `subseasonal_composite`, `irrigation_yield_split`,
`crop_yield_sensitivity`, `rice_yield_anomaly_state` (choropleth),
`rainfall_crop_correlations`, `enso_monsoon_rolling_corr`, `enso_iod_matrix`,
`food_wpi_postmonsoon`, `food_wpi_components`, `agri_gva_share` + `work.employment_agriculture`.

These are good and already validated. The new article re-frames them around a live event
rather than re-deriving them.

---

## 4. Structure

Eight acts, ~26-28 charts. Over the batching threshold (14), so it routes through
`createBatchedExplanation` automatically — see the CLAUDE.md gotcha about prose-only
sections and `sectionVisualMap`.

**Primer.** What El Nino is; where it stands today; the frame ("a risk signal with a
calendar, not a verdict"). Myths to break: *bigger El Nino means bigger drought*;
*El Nino is a monsoon story*.

**Act 1 — Where we actually are.** (live, dated)
- ONI 1950-2026 with 2026 traced in, showing the -0.54 to +0.98 flip in six months. `line`
- CPC's outlook: strength probabilities and peak timing. `tableBars`
- IMD's LRF and its April to May downgrade (92% to 90%; 60% deficient). *reuse*
- 2026 season to date: the -30% June, the July recovery, by region. `multiLine` **new**

**Act 2 — Five numbers for the same ocean.** (the index act — the article's pivot)
- **The index ladder: +0.47 to +2.2, all official, all current.** `tableBars` **new** —
  see 3.2c. Likely the hero of the whole piece, with every row labelled by product, period
  and base period.
- **ONI and RONI, 1950-2026, on one chart.** `multiLine` **new** — the whole argument in one
  picture: the two lines nearly coincide until about 2000, then separate.
- **The gap by decade: -0.12 in the 1950s to +0.44 in the 2020s.** `tableBars` **new**
- **2026 on both indices, against 1997 and 2015 on both.** `tableBars` **new** — kills the
  "as big as 1997" framing cleanly (1997 RONI peak +2.25 vs 2026's current +0.47).

**Act 3 — The right reference class.** (the conditioning move)
- 125 years of monsoons as stripes — the raw material. *reuse hero*
- All El Nino years vs strong El Nino years vs La Nina: mean and below-normal share. *reuse `definition_sensitivity`*
- **The seven strong events, one bar each, 1997 flagged.** `tableBars` **new**
- 1997 vs 2015 head to head: near-identical raw Pacific, opposite monsoons. `tableBars` **new**

**Act 4 — What does not explain the difference.** (the honest-negative act)
- **Flavour: Nino1+2 vs Nino4 for the seven strong events, outcomes annotated.** `tableBars`
  **new** — presented as *the hypothesis that did not replicate*, not as a 2026 signal.
- The second ocean: ONI and DMI together, with 2026's turn visible. *reuse, refreshed*
- Does a positive dipole rescue an El Nino monsoon? — with **1972 as the standing counterexample**. *reuse `enso_iod_matrix`*
- Has the Pacific's grip loosened? *reuse `enso_monsoon_rolling_corr`*

**Act 5 — Where it lands: region and timing.**
- Regional sensitivity (northwest worst). *reuse*
- Which month the rain goes missing. *reuse `subseasonal_composite`*
- Rice yield by state — the choropleth. *reuse*
- Irrigated rice vs rainfed coarse cereals. *reuse `irrigation_yield_split`*

**Act 6 — The transmission chain, 2026 edition.** (live meets historical)
- **Reservoir storage: 34.5% of live capacity, and which benchmark to read.** `tableBars` **new**
- **Kharif sowing y/y by crop — rice flat, pulses -15%.** `tableBars` **new**
- Which crops El Nino hits, historically. *reuse `crop_yield_sensitivity`* — placed
  immediately after the sowing chart so the 1966-2017 base rate and the live 2026 number
  sit side by side. **This adjacency is the best thing in the article:** the historical
  irrigation thesis and the current season agreeing, in two charts.
- Post-monsoon food inflation across eight El Nino events. *reuse `food_wpi_postmonsoon`*
- Where food inflation starts from in 2026. `tableBars` **new**

**Act 7 — After the monsoon (the part nobody covers).**
- **Northeast monsoon by ENSO phase: the sign flips for the south.** `tableBars` **new**
- Why rabi depends on what is left in the dams — links back to Act 6's reservoir chart.
  **This, not temperature, is the strong India-specific forward story** (see 3.2h). *prose + reuse*
- **The lag, measured: global temperature follows ONI by 2-3 months (r ≈ 0.52-0.60).**
  `tableBars` or `multiLine` **new**, from OWID — see 3.2h. With the ONI peak forecast for OND
  2026, that dates the peak global response to about Dec 2026 - Feb 2027. Do **not** extend this
  to a hot Indian spring: India's own ENSO temperature signal is weak (r ≈ 0.23-0.28).
- Agriculture's share of output vs share of jobs — the human reach. *reuse*

**Act 8 — How to read these / methodology and caveats.** Per CLAUDE.md: n=7 is small;
peak-ONI-during-monsoon is a choice; forecasts are probabilities; reservoir and sowing
figures are dated snapshots; secondary-sourced figures flagged; yield vs output; ICRISAT
covers 20 states.

---

## 5. Live numbers gathered today (2026-07-30)

Carry these into the ingests; **re-pull every one at publish time** — most are moving.

**Pacific** — ONI NDJ 2025 **-0.54** → DJF **-0.37** → JFM **-0.14** → FMA **+0.13** →
MAM **+0.51** → AMJ **+0.98** (V, CPC). El Nino Advisory, issued 9 July 2026; strengthening
through year-end; ~97% chance of persisting into early spring 2027 (V). Peak expected OND 2026.
Very-strong probability: **conflicting secondary values, resolve against the primary PDF** (U).

**Indian Ocean** — weekly IOD index **+0.44 C**, week of 26 July 2026, first week at the
+0.4 threshold; +IOD projected to develop (U, BOM). Contradicts `q.climate.monsoon_2026`.

**Monsoon to date** — all-India cumulative departure about **-30% on 30 June**, recovering to
**-14% by 9 July** (205 mm against an LPA of 233.1 mm) (U, Business Standard 10 Jul 2026).
Regional split badly uneven: northwest in surplus, south peninsula in deficit. Get the
weekly series from IMD directly.

**Water** — CWC, **16 July 2026**: **63.249 BCM in 166 reservoirs = 34.46%** of the 183.565 BCM
live capacity; **60.84% of last year**; **98.17% of normal**. West Bengal 18.66% of normal
storage; Telangana 12.53% (U, CWC bulletin via secondary reporting). On 2 July it was
47.725 BCM / 26% (U).
*The 98% vs 61% gap is a chart in itself — last year was a full La Nina year, so "vs last
year" reads alarming and "vs normal" reads calm. Same water. Same move as the article's
definition-sensitivity chart, applied to storage.*

**Sowing** — **now V, official UPAg** (pulled 2026-07-30, full table in 3.2a): all-India
**787.38 lakh ha vs 826.19 = -4.70%**. Rice **-2.57%**, oilseeds -2.07%, pulses -7.54%,
maize -9.70%, jowar -11.12%, bajra **-14.71%**, ragi **-27.94%**. Earlier secondary figures
(658.19 lakh ha / -6.04%, pulses -15.08% on 17 July) are **superseded snapshots** — sowing
recovered with the rains. Date every sowing figure.

**Prices** — June 2026 CPI **4.38%**, CFPI **5.32%**; rural food 5.45%, urban 5.09% (U, MOSPI).

**Historical, from repo data** (V) — strong-event table in section 1; all-El-Nino mean
-3.2% over 26 years with 11 above normal; strong-only mean -12.1% over 7 years with
86% below normal.

---

## 6. Build order

1. **Extend `ingest-noaa-enso.mjs` to pull all five CPC files** — add `RONI.ascii.txt`,
   `ersst5.nino.mth.91-20.ascii`, `wksst9120.for` (weekly) and `sstoi.indices` (monthly OISST)
   alongside the existing ONI fetch, recording product, period and base period in each
   artifact's metadata. Avoid `wksst8110.for` — frozen at Jan 2021. Then re-run `derive-enso-iod-imd-monsoon.mjs`. Confirm the
   strong-event table still reads as in section 1 and that 2026 rows appear.
2. Derive the index act's four series: `climate.enso.index_ladder_2026` (the 3.2c table),
   `climate.enso.oni_vs_roni` (1950-2026), `climate.enso.oni_roni_gap_by_decade`,
   `climate.enso.index_comparison_2026_1997_2015`.
   These are pure derivations off step 1 and carry the article's central argument — build
   them before anything else, because if they do not hold up the thesis changes.
3. Write `scripts/ingest-cwc-reservoirs.mjs` (the one genuinely new scraper). For sowing,
   just re-run the existing UPAg ingest **from the repo root** — but first check the
   `derive-edible-oil-imports.mjs` dependency flagged in 3.2a.
4. Write `scripts/ingest-imd-monsoon-2026-season.mjs` (season-to-date) and a CPC-outlook
   ingest (do **not** edit the existing 2026-forecast script — that one belongs to
   `q.climate.monsoon_2026`, which we are leaving untouched; copy what you need).
5. Derive `strong_event_outcomes`, `northeast_monsoon_by_phase`, `flavour_negative_result`,
   and `enso_temperature_lag` (OWID, see 3.2h).
6. Registry entry + `visualPlan`; verify every indicator resolves before generating.
7. Editorial brief in `articleTemplateFor()` — lock the ONI/RONI pairing rule, the
   strong-event base rate, the 1997/2015 pair, the 1972 counterexample, the flavour negative
   result, and the "V vs U" honesty rules from section 8.
8. Generate, `npm run explain:v1:validate`, `npm run build`, read the page.

## 7. Decided: leave the existing articles alone

**Both `q.climate.el_nino_india` and `q.climate.monsoon_2026` stay exactly as they are.**
No retirement, no redirect, no edits to their prose or registry entries. We build fresh and
ship a third, independent article. Safer and cleaner: no risk of breaking two validated,
published pieces, and no slug/redirect work.

Consequences to accept deliberately:

- `q.climate.monsoon_2026` will keep saying the dipole is "forecast neutral", which the
  +IOD development has overtaken. We are choosing not to touch it. The new article should
  therefore **not** cross-link to it as a source of current conditions.
- Some chart overlap with `q.climate.el_nino_india` is fine and intended — the new piece
  re-frames those base rates around a live event and adds the RONI conditioning, the
  in-season observations, the water/sowing chain and the post-monsoon act.
- Wiki-link the canonical article for mechanism depth (per CLAUDE.md, ~3-6 curated links),
  so readers who want the full history have somewhere to go.

## 8. Honesty ledger — carry into `requiredConcepts`

Lock these so generation cannot drift:

- The strong-event base rate (6 of 7, mean -12.1%) is **n=7** and uses peak ONI *during the
  monsoon*. Say so both times it appears.
- 2026 has **not** yet cleared 1.5 on either index; on RONI it has not cleared 0.5. The
  strong-event class is where CPC's forecast points, not where 2026 currently sits.
- The flavour proxy **failed to replicate** Kumar et al. on these seven events. Report the
  negative result; do not use flavour to reassure.
- A positive IOD is a tilt, not a shield — 1972 is the standing counterexample.
- Reservoir, sowing, rainfall-to-date and CPI figures are **dated snapshots**, several
  currently from secondary reporting (marked U). Pin every one to a primary source before
  publishing, or cut it.
- Two conflicting "very strong El Nino" probabilities were in circulation on 2026-07-30
  (81% and 63%). Publish only what the primary CPC PDF says.
- Never present the raw ONI comparison with 1997/2015 without the RONI comparison beside it.
