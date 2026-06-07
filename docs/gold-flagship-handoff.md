# q.econ.gold — "India and Gold" flagship: build handoff

Built Jun 2026 (overnight autonomous build). This is the status, what's wired, how to
rebuild, and what's left for a polish pass. Article slug: **/articles/india-and-gold/**.

## What's done

**Data layer — complete, all in `data/series/` (27 series, auto-resolve by indicatorId):**

| Ingest script | Source | Key outputs |
|---|---|---|
| `scripts/ingest-gold-comtrade.mjs` | UN Comtrade HS 7108/7113 (live API, your key) | imports value/tonnes annual (2010-24) + **monthly to Mar 2026**; jewellery exports/imports value; `imports_by_partner` + `jewellery_exports_by_partner` tables (2024) |
| `scripts/ingest-gold-wgc.py` | `data/manual/wgc-gold-demand.xlsx` (WGC GDT tables) | India jewellery, bar&coin, per-capita (2010-25); gross bullion imports + recycling (2012-25) |
| `scripts/ingest-gold-databank.py` | Data bank warehouse parquet | gold price USD/oz (1978-) + INR/10g; **Nifty 500 TRI**; USD/INR (FRED DEXINUS) |
| `scripts/ingest-gold-rbi.py` | local RBI DBIE scraper (`~/Documents/RBI/`) | gold reserves value (USD + INR) + **forex share**, fiscal 1951-2026 |
| `scripts/derive-gold.py` | the above | growth-of-₹1 (gold vs Nifty500), real gold index, duty wedge, return-decomposition table, reserves-in-tonnes, **household-stock reconstruction**, consumer demand |

**Registry:** `q.econ.gold` added to `scripts/registry/v1-indicators.mjs` with a 16-chart
`visualPlan` across 5 acts (hoard → river → refinery → why → state-vs-saver). All chart
indicators verified to resolve. **Editorial brief** for the prose added to
`scripts/generate-explanations.mjs`.

**Prose:** generated via `npm run explain:v1 -- --questions=q.econ.gold` (deepseek-v4-pro)
→ `data/explanations/en/q.econ.gold.json`.

## To rebuild from scratch
```bash
node scripts/ingest-gold-comtrade.mjs      # network; uses UN_COMTRADE key in .env
python3 scripts/ingest-gold-wgc.py         # needs data/manual/wgc-gold-demand.xlsx
python3 scripts/ingest-gold-databank.py    # reads ~/Documents/Data/Data bank parquet
python3 scripts/ingest-gold-rbi.py         # reads ~/Documents/RBI parquet
python3 scripts/derive-gold.py
node scripts/generate-explanations.mjs --questions=q.econ.gold
npm run explain:v1:validate
npm run build
```

## Headline numbers (locked from real data)
- Private stock ~25,000-31,000t (reconstruction, wide band) vs RBI ~880t / $115bn / 16.7% of forex.
- Gold imports: CY2024 $57.6bn / 806t → FY2025-26 ~$72bn / ~720t = **paid more for less** (price surge).
- Sources 2024: Switzerland $19bn + UAE $16bn ≈ 60%; jewellery re-exports ~$12bn (UAE/US/HK).
- India jewellery 662t (2010) → 441t (2025) falling; bar&coin rising = **ornament → investment**.
- Gold ≈ Nifty 500 TRI over 2010-2025 (~12%/yr each); gold ahead since 2005 but that's the 2025-26 surge.
- Return decomposition: global price 64-81%, currency 21-33%, duty a one-time 2013 level step.
- Duty wedge: ~2-3% pre-2013 → ~10% (2013 hike) → ~6% (after Jul-2024 cut 15%→6%).

## Known data caveats (already worded into the brief; keep in any edit)
1. **Household stock** is a reconstruction (anchor 20,000t at 2010 + cumulative net demand) → ~30kt. Present as a **range**, not a point; the level is uncertain, the direction is robust.
2. **Reserves-in-tonnes** (`gold.reserves.tonnes`, derived = value/price) reads ~752t for 2026 vs the **~880t** WGC reports directly (gold-valuation/timing gap). Lead with RBI **value** + **share**; cite 880t for tonnage.
3. **Gold vs equity** is endpoint-sensitive — gold's lead exists only with the 2025-26 surge; equities led for years. The growth-index chart shows the full path; don't headline a single ratio.
4. **Goldhub INR price** embeds India's duty+premium (it's the domestic price), which is why implied FX ran ~₹107 vs FRED's true ~₹93. The clean decomposition uses Goldhub **USD** × FRED FX; the residual is the duty wedge.
5. **Smuggling** can only be bounded, never measured; official imports are a lower bound.

## Phase 2 / not yet built (deliberately dropped to keep every chart on solid data)
- **Swiss-mirror corroboration** (Swiss-Impex CH→India gold tonnes) — independent cross-check of the source-country claim. Source reachable; not yet wired.
- **Gold vs crude / share of total imports** — needs HS 2709 alongside 7108 (chapter table exists for 2024).
- **Gold imports vs current-account deficit** — RBI BoP series not yet wired.
- **Gold loans** surge — `nonFoodSectoral:personal:Gold Loans` exists in the lake (IndiaDataHub) but uses a composite indicator format; wire carefully.
- **Sovereign Gold Bonds / Gold Monetisation** uptake vs the physical hoard — RBI; not pulled.
- **Who owns gold** (rural/urban × wealth) — AIDIS microdata (`microdata.gov.in`), a heavier pull.
- **Return-decomposition as a chart** — `gold.derived.return_decomposition` is a table artifact; needs a `tableBars`-style renderer mapping or a custom chart (currently the decomposition lives in the prose + the duty-wedge line).
- **Mobile chart variants** for the new charts (see memory `indica-mobile-chart-variants`).
- Consider an explicit **central-bank comparison bar** (India household vs top-10 central banks) — needs a small hand-built series.

See memory: `indica-gold-flagship.md`.
