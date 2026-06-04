# NFHS-6 Hub — Chart-List Plan (lock before build)

**Canonical question:** *What does NFHS-6 reveal about how India lives, gets sick, gives birth, and changes?*
**Slug:** `q.health.nfhs6` · **Tabs = view-state:** `?theme=<tab>` under one canonical URL.
**Survey:** National Family Health Survey 6 (IIPS/MoHFW), fieldwork 2023–24, fact sheets May 2026. 679,238 households; 716,397 women; 100,977 men. Manipur not surveyed.

This is a **hub**, not a single-question page — NFHS-6 is a national portrait. Each tab answers **one** sharp sub-question with a **curated** set of high-signal visuals (per `indica-curated-visuals`: themes, not buckets — a chart that doesn't advance the tab's question does not ship).

---

## The repeating spine (every tab uses these four lenses)

NFHS-6 gives the same four views on every indicator. Making them the spine is what makes the hub feel designed rather than assembled:

1. **The trend** — NFHS-5 (2019–21) → NFHS-6 (2023–24): the 3-year change.
2. **The split** — urban vs rural (always present in the data).
3. **The map** — a state choropleth (NFHS's exclusive asset; from LlamaParse'd state sheets).
4. **The world** — one WHO-GHO / OWID / World Bank line placing India globally (the ≥2-source rule, baked into every tab).

Not every visual hits all four; each tab picks the lenses that carry its story.

## Data provenance & rules

- **Numbers are locked, never generated.** Every figure traces to `NHFS/nfhs6_clean.json` (India = text-layer, 101/101 validated; States/UTs = LlamaParse full-PDF pass). Prose only wraps locked numbers.
- **Indicator refs** below use the fact-sheet numbers (#1–#101). India Total shown as `T`, NFHS-5 as `N5`, urban `U`, rural `R`.
- **Second source per tab** is named in each "world" lens — WHO GHO (`who-gho-manifest`), OWID, World Bank, UN WPP are wired.

---

## TAB 0 — Overview · "The big shift"

**Sub-question:** If NFHS-6 says one thing about India, what is it?
**Hero:** In a single 3-year window, India shed diseases of poverty and took on diseases of prosperity — *at the same time.*

| # | Visual | Lens | Indicators | Why it earns its place |
|---|--------|------|-----------|------------------------|
| 0.1 | **The crossover** — slope/dumbbell, NFHS-5→6, two clusters falling vs rising | trend | Falling: stunting #69 (35.5→29.3), child marriage #16 (23.3→20.1). Rising: diabetes #83 men (15.6→20.9), obesity #76 women (24.0→30.7), C-section #38 (21.5→27.2) | The entire thesis in one image |
| 0.2 | **KPI strip** — 6 headline cards w/ arrows | trend | insurance #7 (41→60), women internet #14 (33.3→64.3), TFR #18 (2.0), stunting #69, diabetes #83, C-section #38 | Fast scannable "state of India" |
| 0.3 | **Tab launcher** — the 7 themes as cards, each with its hero stat | — | — | Navigation + promise of depth |

Macha heading: *"India glowed up and got a sugar problem — both. Let me explain, bro."*

---

## TAB 1 — The Double Burden · nutrition

**Sub-question:** Is India getting healthier or sicker? (nutrition lens)
**Hero:** 19.7% of women are underweight *and* 30.7% are overweight — undernutrition and obesity in the same country, often the same state.

| # | Visual | Lens | Indicators | Why |
|---|--------|------|-----------|-----|
| 1.1 | **Children improving** — grouped bars NFHS-5→6 | trend | stunting #69 (35.5→29.3), underweight #72 (32.1→31.8), wasting #70 (19.3→19.0), severe wasting #71 (7.7→5.2) | The good-news half: child undernutrition retreating |
| 1.2 | **Adults heavier** — grouped bars NFHS-5→6, women+men | trend | women overweight #76 (24.0→30.7), men #77 (22.9→27.3); contrast women underweight #74 (18.7→19.7) | The bad-news half rising fast |
| 1.3 | **The double burden in one frame** — diverging/paired bars, under- vs over-weight by sex | split | #74 vs #76 (women 19.7 / 30.7), #75 vs #77 (men 19.7 / 27.3) | The coexistence — the tab's whole point |
| 1.4 | **Map — adult obesity by state** | map | #76 (women ≥25 BMI) | Where prosperity-disease has arrived (south/urban gradient) |
| 1.5 | **Map — child stunting by state** | map | #69 | The inverse geography — poverty-disease's last strongholds |
| 1.6 | **India vs the world — obesity** | world | OWID/WHO adult obesity prevalence, India trajectory vs world/peers | India still low globally but climbing — context, not alarm |

Macha heading: *"Half the country needs more food, half needs less. Same country."*

---

## TAB 2 — Silent Epidemics · diabetes, BP, tobacco, alcohol

**Sub-question:** What is rising in India's blood that no one feels until it's late?
**Hero:** 1 in 5 men now has high blood sugar (#83: 20.9%, up from 15.6% in three years).

| # | Visual | Lens | Indicators | Why |
|---|--------|------|-----------|-----|
| 2.1 | **Diabetes climbing** — grouped bars NFHS-5→6, women+men | trend | high/very-high blood sugar women #80 (13.5→17.8), men #83 (15.6→20.9) | The headline NCD surge |
| 2.2 | **Urban vs rural sugar** — paired bars | split | #80,#83 U vs R (men U23.9 / R19.7) | Urban higher, rural catching up |
| 2.3 | **Hypertension** — grouped bars NFHS-5→6 | trend | women #86 (21.3→19.4), men #89 (24.0→22.1) | Honest nuance: BP flat/down while sugar rises — not all NCDs move together |
| 2.4 | **Map — diabetes by state** | map | #83 (men high blood sugar) | The south/east gradient |
| 2.5 | **Risk behaviours** — paired bars by sex, NFHS-5→6 | trend+split | tobacco men #99 (38.0→36.3) / women #98 (8.9→8.4), alcohol men #101 (18.9) | The behavioural drivers; tobacco slowly falling |
| 2.6 | **India vs the world — diabetes** | world | WHO GHO / IDF diabetes prevalence, India vs peers | Places the rise in global frame |

Macha heading: *"The disease you can't feel until the doctor finds it."*

---

## TAB 3 — Being Born in India · pregnancy & delivery

**Sub-question:** How has being born in India changed?
**Hero:** Almost every birth now happens in a hospital (#35: 90.6%) — but more than 1 in 4 is now surgical (#38: 27.2%), and in private hospitals it's the majority (#39: 54.1%).

| # | Visual | Lens | Indicators | Why |
|---|--------|------|-----------|-----|
| 3.1 | **Birth moved indoors** — line/bar NFHS-5→6 | trend | institutional births #35 (88.6→90.6), skilled attendant #37 (89.4→91.3) | The achieved baseline |
| 3.2 | **The C-section surge** — grouped bars: public vs private | split | C-section #38 (21.5→27.2); public #40 (16.9) vs private #39 (54.1) | The signature finding: medicalisation, privatised |
| 3.3 | **Map — C-section rate by state** | map | #38 | The south (Telangana/TN/Kerala) extremes vs north |
| 3.4 | **Antenatal care deepening** — bars NFHS-5→6 | trend | 1st-trimester #28 (70→76.2), 4+ visits #30 (58.5→65.2), IFA 180d #33 (26.0→37.8) | Care getting earlier & fuller |
| 3.5 | **India vs the world — C-section** | world | WHO/OECD C-section rate, WHO 10–15% reference band | Is India over-medicalising birth? |

Macha heading: *"Born in a hospital, very possibly by surgery."*

---

## TAB 4 — Growing Up Healthy · child survival

**Sub-question:** Is the public-health machine reaching India's children?
**Hero:** Rotavirus vaccination went from 36% to 85% in three years (#53) — one of the fastest rollouts anywhere.

| # | Visual | Lens | Indicators | Why |
|---|--------|------|-----------|-----|
| 4.1 | **Full immunisation rising** — bars NFHS-5→6 | trend | fully vaccinated #44 (76.6→82.6), measles 2nd dose #51 (58.6→71.8), rotavirus #53 (36.4→85.4) | The success story, rotavirus the star |
| 4.2 | **Public system carries it** — split bar | split | vaccinated in public facility #55 (95.6) vs private #56 (3.1) | Contrast with the privatised birth story (Tab 3) — deliberate |
| 4.3 | **Map — full immunisation by state** | map | #44 | Where the cold chain still struggles |
| 4.4 | **Feeding is the weak link** — bars NFHS-5→6 | trend | early breastfeeding #61 (41.8→50.1), adequate diet 6–23m #68 (11.0→15.3, still low) | Honest: vaccines soar, infant diet lags badly |
| 4.5 | **India vs the world — DPT3/measles** | world | WHO GHO immunisation coverage, India vs world | Global benchmark |

Macha heading: *"The jabs are winning. The dinner plate isn't."*

---

## TAB 5 — Family & Fertility · reproduction

**Sub-question:** How is India choosing to have children now?
**Hero:** India is at the replacement line (#18 TFR 2.0; urban 1.6) — yet family planning still rests almost entirely on women (female sterilisation #23: 36.5% vs male #24: 0.5%).

| # | Visual | Lens | Indicators | Why |
|---|--------|------|-----------|-----|
| 5.1 | **At replacement** — TFR gauge + urban/rural | trend+split | TFR #18 (2.0; U1.6 / R2.1) | The demographic headline |
| 5.2 | **Map — TFR by state** | map | #18 | South/west below replacement vs Bihar 2.7, UP 2.2 — the two Indias |
| 5.3 | **The contraception burden gap** — diverging bar | — | female sterilisation #23 (36.5) vs male #24 (0.5); modern method #21 (52.7) | The starkest gender asymmetry in the survey |
| 5.4 | **Teen motherhood falling** — bars NFHS-5→6 | trend | teen pregnancy #19 (6.8→6.7), child marriage #16 (23.3→20.1) | Linked downstream story |
| 5.5 | **India vs the world — TFR** | world | UN WPP / World Bank TFR, India vs world & peers | India joins the below-replacement club |

Macha heading: *"Two kids, on average — and she's the one who got sterilised."*

---

## TAB 6 — Who Gets Care · health system & money

**Sub-question:** Who pays for India's health, and where do people go?
**Hero:** Health-insurance coverage jumped from 41% to 60% of households in three years (#7) — the Ayushman effect — even as care quietly shifts toward private hospitals.

| # | Visual | Lens | Indicators | Why |
|---|--------|------|-----------|-----|
| 6.1 | **The insurance jump** — bar NFHS-5→6 + urban/rural | trend+split | insurance #7 (41.0→60.2; U56.4 / R62.0 — rural higher!) | Headline + the surprising rural-higher twist (state schemes) |
| 6.2 | **Map — insurance coverage by state** | map | #7 | Scheme geography (Rajasthan/AP vs laggards) |
| 6.3 | **Public vs private, two ways** — paired bars | split | institutional birth public #36 (58.6, down from 61.9) vs private; vaccination public #55 (95.6) | The split system: births privatising, child vaccines public |
| 6.4 | **India vs the world — out-of-pocket / coverage** | world | World Bank UHC service coverage / OOP health spend | Where India sits on universal coverage |

Macha heading: *"More Indians are insured than ever — and quietly going private."*

---

## TAB 7 — Women's Lives · autonomy & safety

**Sub-question:** How much has the ground shifted under women's lives?
**Hero:** Women who have ever used the internet nearly doubled in three years — 33% to 64% (#14).

| # | Visual | Lens | Indicators | Why |
|---|--------|------|-----------|-----|
| 7.1 | **The digital leap** — bars NFHS-5→6, women+men | trend | women internet #14 (33.3→64.3), men #15 (51.2→80.5), own mobile #93 (53.9→63.6) | The fastest-moving social indicator in the survey |
| 7.2 | **Money & schooling** — bars NFHS-5→6 | trend | own bank account #92 (78.6→89.0), 10+ yrs schooling #12 (41.0→46.4), paid work #91 (25.4→30.8) | Autonomy backbone |
| 7.3 | **Marrying later** — bars NFHS-5→6 + urban/rural | trend+split | child marriage #16 (23.3→20.1; U11.4 / R23.3) | The rural/urban chasm |
| 7.4 | **Map — child marriage by state** | map | #16 | The belt where it persists |
| 7.5 | **Violence receding (slowly)** — bars NFHS-5→6 | trend | spousal violence #95 (29.2→22.3), during pregnancy #96 (3.1→2.7) | Honest: improving but still ~1 in 5 |
| 7.6 | **Menstrual hygiene + decisions** — bars | trend | hygienic protection 15–24 #94 (77.6→79.2), 3-decision participation #90 (88.7→89.0) | Rounds out autonomy & dignity |
| 7.7 | **India vs the world — internet gender gap** | world | World Bank / ITU individuals using internet, India vs world | Global frame for the leap |

Macha heading: *"In three years, half the women who weren't online came online."*

---

## Build sequence (after this plan is locked)

1. **Finish data** — merge LlamaParse full-PDF pass into `nfhs6_clean.json`; validate state values (range + spot-check hero numbers); derive a tidy per-indicator series file the chart kit can read.
2. **Register** `q.health.nfhs6` as a hub question; wire the 8 themes as view-state.
3. **Template** — tabbed-hub article template in `design-system/`.
4. **Map component** — India state choropleth for `chart-kit.js` (reused across ~6 tabs).
5. **Build tabs** in order: Overview → Double Burden (flagship proof) → replicate to the rest.
6. **Explanations** — Bottom Line + The Reading / In Plain English / On the Ground per tab, prose wrapping locked numbers (macha voice per `indica-macha-voice`).

## LOCKED (2026-06-01)
- **Tab order:** keep the proposed arc (shock → body → birth → child → family → system → women).
- **Density: MAXIMAL** — full data deep-dive; add companion charts per tab. Discipline guard still applies: every added chart must show a *distinct* fact (no duplicate views of the same number). Lean rich, not repetitive.
- **Maps: everywhere geography helps** — one hero map per tab minimum, plus a second/third map wherever the story is geographically dual (e.g. Double Burden: obesity AND stunting; Silent Epidemics: diabetes AND tobacco; Women's Lives: internet AND child marriage).
- Colour ramps: bright-but-soft, no clichéd red-green (per `indica-design-preferences`).
