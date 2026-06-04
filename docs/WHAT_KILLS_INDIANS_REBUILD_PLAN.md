# "What Kills Indians?" — Data Refresh & Rebuild Plan

**Question:** `q.health.deaths` · **URL:** `/en/articles/what-kills-indians/`
**Status:** chart-list draft, awaiting lock
**Date:** 2026-06-03

---

## The core problem

The current article (generated 2026-06-03, `deepseek-v4-flash`) is built on **25 charts, 21 of them from WHO-GHO**, with 3 from World Bank WDI and 4 from UN WPP. WHO / UN / World Bank are all **modeled international estimates from one ecosystem** — this violates the "blend ≥2 *independent* sources" rule and means the page tells the reader "what global models estimate," not "what India's own death registers record."

Two consequences:
1. **Stale within the sources used** — the flagship cause-of-death numbers are WHO **GHE 2019**; even the newer **GHE 2021** terminates at the COVID peak.
2. **Wrong primary source** — for an India mortality article, India's own SRS / MCCD / NCRB are fresher *and* more authoritative, and aren't used at all.

**Reframe:** lead with India's own registration data (MCCD / SRS / NCRB actuals); use **GBD 2023** + UN as the modeled cross-check. That is both more current and more defensible.

---

## ⚠️ The "COVID drop, no recovery" defect (root cause)

The article's cause-of-death backbone shows the 2020–21 COVID distortion (communicable share spikes, NCD share dips) and then **just stops** — no recovery. This is **not a generation bug; it's a source ceiling**:

| Source | Cause-of-death coverage ends | Recovery years? |
|---|---|---|
| WHO GHE (2019 *and* 2021 releases) | **2021** | ❌ no |
| World Bank WDI (`SH.DTH.*.ZS`) — *derived from WHO GHE* | **2021** (already in lake) | ❌ no |
| **IHME GBD 2023** (released Oct 2025) | **2023** | ✅ **yes** |
| India MCCD (annual, certified) | **2023** | ✅ yes |
| India SRS (crude rates, life tables) | **2022** | ✅ yes |
| India NCRB ADSI (suicide/accident) | **2023** | ✅ yes |

Every modeled-international cause source the article uses (WHO, and World Bank which is just WHO-GHE re-served) **caps at the COVID peak year 2021.** That is *why* there's a drop with no recovery — there is literally no 2022/2023 modeled cause-of-death in those databases. The fix is to move the backbone to a source that has the recovery years.

**Proof — OWID/GBD 2023 India broad shares (the recovery the article is missing):**

| Broad cause | GBD 2023 (deaths, 2023) | Implied share |
|---|---|---|
| Non-communicable | **6.97 million** | **~71%** |
| Communicable / maternal / neonatal | 1.92 million | ~19% |
| Injuries | 954,000 | ~10% |
| **Total** | **~9.84 million** | — |

The article currently says "NCDs cause **49.1%** of deaths (2021)" — the COVID-depressed figure. The post-recovery GBD 2023 number is **~71%**, which *strengthens* the article's own NCD-dominance thesis. Source: ourworldindata.org/profile/health/india (GBD 2023). This is the single clearest demonstration that the page is using a COVID-trough snapshot.

---

## Source upgrade map

| Theme | Current source / vintage | Upgrade to | New vintage | In data lake? |
|---|---|---|---|---|
| Cause-specific deaths (CVD, cancer, resp, diabetes) | WHO GHE **2019** | **GBD 2023 via OWID grapher** (IHME; India + state-level) | **2023** | 🟡 OWID adapter EXISTS (currently CO2/climate only) — just add grapher slugs to `owid-manifest.json`. **Lightest high-value fix.** |
| Cause-of-death *shares* | World Bank WDI 2021 (modeled, **caps at 2021**) | **GBD 2023** (OWID) for modeled recovery + **MCCD 2023** (RGI certified) for India's own | 2023 | OWID light; MCCD = PDF ingestion |
| Cross-check / India's own cause data | — (none) | **MCCD 2023** (RGI, certified) | 2023 | ❌ PDF — needs ingestion |
| Crude death rate | UN WPP "**projected 6.95 in 2030**" | **SRS 2022 actual = 6.8** | 2022 | ❌ PDF — needs ingestion |
| Suicide | WHO modeled rate 16.98/100k (2021) | **NCRB ADSI 2023 = 171,418 actual** | 2023 | ❌ PDF/CKAN — needs ingestion |
| TB deaths | WHO ~300k (2024) | **WHO Global TB Report 2025** / India TB Report 2024 | 2024 | partial (WHO TB indicator) |
| Maternal mortality | WHO/UN MMEIG = 80 (2023) | **no change — already latest** | 2023 | ✅ |
| Deaths by age / total deaths | UN WPP 2024 | keep (UN is fine for demographic projection) | — | ✅ |

---

## Chart-by-chart disposition (vs current 25)

**KEEP as-is (already current / appropriate source):**
- v6 deaths-by-age, v7 total-deaths (UN WPP — right tool for projections)
- v14 maternal mortality (80, 2023 — latest MMEIG)
- v21 under-5, v22 infant mortality (WHO/UN current)

**REFRESH (same chart, newer data point):**
- v2–v5 cause-specific deaths → GHE 2021 values (frame the COVID inflection honestly)
- v8 crude death rate → headline **SRS 2022 actual (6.8)**, keep UN line as context
- v10 TB deaths → WHO Global TB Report 2025 vintage
- v9 suicide → see REPLACE

**REPLACE (better source):**
- v9 WHO modeled suicide *rate* → **NCRB ADSI 2023 absolute count (171,418)** with the India-specific cuts that make it land: daily-wage earners 28%, farmers 10,786, record student suicides
- v23–v25 World Bank cause-shares (modeled) → **MCCD 2023 certified shares** (circulatory 36.4%, respiratory 11.5%, …)

**ADD (new, fills the second-source gap + recovery):**
- **GBD 2023 leading-causes ranking (India), 1990–2023** — new backbone; shows the COVID spike *and the recovery*. Via OWID.
- **GBD 2023 NCD-vs-communicable-vs-injury broad shares through 2023** — the honest version of the current v23–v25 (which die at 2021)
- Optional: GBD 2023 *state-level* lens (NCD burden by state) — uniquely granular, nothing else offers it

**CUT / demote (too many low-signal context charts — 13 of 25 are `context`):**
- Candidates to drop or fold: v17 road-traffic rate, v18 diabetes prevalence, v19 hypertension prevalence, v20 hepatitis — keep at most the 2–3 that the prose actually references. Per the curated-visuals principle, fewer high-signal charts beat 25 thin ones.

---

## Ingestion tasks (prereqs, in priority order)

Re-prioritised — the biggest fix is now the *cheapest* because the OWID adapter already exists:

1. **GBD 2023 via OWID** — add grapher slugs (`annual-number-of-deaths-by-cause`, `leading-cause-of-death`, `leading-broad-cause-of-death`, `age-standardized-deaths-from-all-causes`) to `owid-manifest.json`. **This single step fixes staleness, the COVID-recovery gap, and the second-source gap at once.** No new adapter. *Do this first.*
2. **NCRB ADSI 2023** (suicides) — CKAN dataset on data.gov.in (not just PDF) → `ncrb-adsi-manifest.json`. Gives the India-specific actuals (171,418; daily-wage 28%; farmers 10,786).
3. **SRS 2022** (CDR 6.8, IMR, life tables) — PDF table extract → `srs-manifest.json`. India's own crude death rate, replaces the UN 2030 projection.
4. **MCCD 2023** (certified cause shares) — RGI PDF extract (reuse LlamaParse/liteparse pipeline from `NHFS/`). India's own certified cause-of-death.
5. WHO GHE / World Bank cause-of-death — **drop as backbone**; both cap at 2021. Keep at most as a historical footnote. GBD 2023 supersedes them.

---

## Open decisions before lock

1. **Lead source identity** — GBD 2023 (modeled, full time-series with recovery) as the spine, MCCD/SRS/NCRB as the "India's own" credibility layer? Recommended.
2. **Minimum viable fix** — ship just **GBD 2023 via OWID** first (one manifest edit, fixes staleness + the COVID-recovery defect + the single-ecosystem problem), then add NCRB/SRS/MCCD in a v1.6? Recommended.
3. **Scope of cut** — how aggressively to trim the 13 low-signal context charts. Recommend ≤ 15 charts total.
4. **COVID framing** — show the full 1990–2023 GBD line so the spike-and-recovery is visible, rather than single-year snapshots. Recommend yes.

---

## Data-source access reality (verified 2026-06-03, from this build server)

**The "unique API per dataset on data.gov.in" model does NOT hold for the India-primary sources.** RGI/NCRB publish these as files/PDFs, not `api.data.gov.in/resource/<id>` APIs.

| Source | Canonical link | Access mode | Reachable here? |
|---|---|---|---|
| **GBD 2023** | api.ourworldindata.org/v1/indicators/{id}.data.json | ✅ JSON API (per-variable) | ✅ **DONE — wired** |
| **NCRB ADSI 2023** | data.gov.in/catalog/accidental-deaths-suicides-india-adsi-2023 (node `349a9cc3-f7e0-497b-a35d-c4984f9c4791`) | ⚠️ "Catalog **API not available**" — Excel/PDF **file download only** | API 400s; key won't help |
| **SRS 2022 / 2023** | censusindia.gov.in/nada/index.php/catalog/45570 (2022), /46172 (2023) | PDF via NADA catalog (no API) | 🔴 host returns `000` (unreachable) |
| **MCCD 2021/22/23** | dc.crsorgi.gov.in/assets/download/Annual-Reports/mccd/2023.pdf | PDF (no API) | ✅ `200`, 12.9 MB — downloadable |

**data.gov.in API key** (for any genuinely API-enabled RGI series you find): register free at data.gov.in → My Account → *Generate API Key* → put in `.env` as `DATA_GOV_IN_API_KEY`. Endpoint pattern: `https://api.data.gov.in/resource/<RESOURCE_ID>?api-key=KEY&format=json&limit=100`. Note: only works for resources whose catalog shows an enabled API button — NCRB ADSI is **not** one.

**What this means for wiring:**
- **MCCD** → I can extract now (PDF reachable + LlamaParse key present).
- **SRS** → blocked from this server; you'd need to supply the PDF (or a reachable mirror), or I find India CDR via another reachable source.
- **NCRB** → you'd download the Excel/CSV from the catalog page (file-download), or supply a reachable NCRB.gov.in PDF.

## Sources (verified 2026-06-03)
- **GBD 2023 cause-specific mortality 1990–2023** (released Oct 2025) — ghdx.healthdata.org/record/ihme-data/gbd-2023-cause-specific-mortality-1990-2023
- **OWID graphers (GBD 2023, through 2023)** — ourworldindata.org/grapher/annual-number-of-deaths-by-cause · /leading-cause-of-death · /leading-broad-cause-of-death
- World Bank `SH.DTH.NCOM.ZS` (NCD share) — WHO-GHE-derived, **caps at 2021** — data.worldbank.org/indicator/SH.DTH.NCOM.ZS?locations=IN
- SRS Statistical Report 2022 (CDR 6.8) — censusindia.gov.in SRS_STAT_2022
- NCRB ADSI 2023 (171,418 suicides) — data.gov.in/catalog/accidental-deaths-suicides-india-adsi-2023
- MCCD 2021/2023 (RGI) — dc.crsorgi.gov.in/.../mccd
- WHO Global TB Report 2025 (India, 21/lakh, 2024)
