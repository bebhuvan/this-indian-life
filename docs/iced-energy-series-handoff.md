# ICED energy-transition series — build handoff

A planned cluster of four articles built on **ICED** (NITI Aayog's India Climate &
Energy Dashboard, `iced.niti.gov.in`) as the discovery/quick-XLS layer, citing the
**upstream** government source (CEA, Grid-India/POSOCO, CPCB, MoEFCC) per article.

ICED gotchas (confirmed during recon):
- Downloads are **per-chart XLS + JPEG** only. No bulk API, no documented endpoint.
  A multi-state or plant-level article = many small downloads, or go to the upstream feed.
- ICED is a **re-publisher**. For source-linking, cite/link the *original* source; use ICED
  as the discovery layer, not the `sourceUrl`.
- Granularity confirmed live: an **hourly demand curve** exists (national, XLS); state-level
  reports, plant-level power data, and a sectoral GHG split are all present.

## Why a series, not one article

Each is a distinct `q.<domain>.<slug>` (Indica's "one real question" unit). They share a
theme and theming class but stand alone. They are positioned to be **additive** to the
existing energy/climate coverage, which is already substantial:

| Already in the registry | Covers |
|---|---|
| `q.energy.mix` | generation by source, capacity vs generation, carbon intensity |
| `q.energy.coal` | coal share/tonnes, production vs imports, CO₂ — **national aggregate** |
| `q.energy.renewables` | renewable share, coal→clean race, demand pressure |
| `q.energy.state_transitions` | **state-level** carbon intensity, mix, clean-share-of-growth, monthly RE seasonality |
| `q.climate.co2` | total emissions split **by fuel** (coal/oil/gas), cumulative, per-capita |

The four new articles deliberately occupy the **white space** these leave.

---

## Article 1 — The duck curve (SERIES OPENER)

- **Question id:** `q.energy.demand_shape`
- **The question:** *When does India actually turn the power on — and why can't solar
  cover the moment that matters most?*
- **Why additive:** the repo has **zero sub-daily demand data**. Every existing energy
  article is annual/monthly. This is the only one about the *shape of a day*.
- **The argument:** India's demand peak has migrated from daytime (industry, agri pumps)
  toward the **evening** (cooling, lighting) — exactly when solar output collapses. That
  evening gap is the entire case for storage. The "duck curve," arriving in India.
- **Spine sources:** ICED hourly demand curve (upstream: **Grid-India / POSOCO** all-India
  hourly demand) + Ember hour-of-day or CEA solar generation profile, for the overlay.
- **New viz it justifies:** the **hourly load curve** (24h cyclical line, demand vs solar
  overlay) — see "New viz" below. This is the centerpiece; the chart *is* the story.
- **visualPlan sketch:**
  1. `loadCurve` (NEW) — typical-day demand vs solar generation, the carved-out midday +
     evening peak. Hero.
  2. `loadCurve` (NEW) — summer vs monsoon vs winter day shapes overlaid (seasonality).
  3. `line` — annual peak demand (GW) over ~15 yrs: the peak is growing *and* shifting.
  4. `line` — evening-peak hour over time (when the daily max occurs), if derivable.
  5. small composition: where evening load comes from (cooling share), if ICED end-use allows.
- **Honesty notes:** "typical day" = an average/representative profile, not a single date —
  state which. Solar overlay is generation potential, not dispatched-to-that-load.

## Article 2 — The coal fleet, plant by plant

- **Question id:** `q.energy.coal_fleet` (distinct from existing `q.energy.coal`)
- **The question:** *India is barely building new coal — it's running its existing fleet
  harder while utilization quietly falls. What does the fleet actually look like?*
- **Why additive:** `q.energy.coal` is national tonnes/share. This is **plant-level**:
  every thermal unit as a dot — PLF/CUF, age, capacity, emissions, outages.
- **Spine sources:** ICED power-plant data (upstream **CEA**) + GBD health (already ingested)
  for the coal-emissions → cardiovascular/respiratory mortality tie-in.
- **New viz:** reuses `scatter`/`scatterXY` (exists). May add **stacked area** for
  fleet-capacity-by-vintage over time.
- **visualPlan sketch:** plant scatter (age × PLF, size = capacity); PLF distribution then
  vs now; capacity by vintage; emissions-weighted map; health overlay.

## Article 3 — DISCOM rot: why power is "free" until it isn't

- **Question id:** `q.power.discom_losses`
- **The question:** *Why do some states lose a third of their electricity to theft and
  non-payment while others are near global-best?*
- **Why additive:** no distribution-**finance** article exists anywhere in the repo.
- **Spine sources:** ICED AT&C losses / billing efficiency / collection efficiency / tariffs
  by state/DISCOM (upstream **CEA / PFC Integrated Rating**) + MoSPI state GDP/per-capita.
- **New viz:** reuses `choropleth` + `rankedChange` (both exist). No new component needed.
- **visualPlan sketch:** AT&C-loss choropleth; ranked slope of loss change by state; billing
  vs collection scatter; loss vs per-capita-income scatter; tariff spread.

## Article 4 — Where India's emissions actually come from

- **Question id:** `q.climate.emissions_sources`
- **The question:** *Everyone blames power plants. But how much of India's greenhouse gas
  is agriculture, livestock, waste and land use?*
- **Why additive:** `q.climate.co2` is CO₂ **by fuel**. This is all-GHG **by sector**
  (energy / industrial processes / agriculture / waste / LULUCF) — a different cut.
- **Spine sources:** ICED GHG decomposition (upstream **MoEFCC BUR / India GHG inventory**)
  + a cross-check (e.g. Climate Watch / EDGAR) for the ≥2-source rule.
- **New viz:** **sankey or treemap** of the sector→sub-sector split (highest-effort of the
  three new types; build only when this article is in scope).
- **visualPlan sketch:** sector treemap/sankey; sector trends over time; agri sub-split
  (enteric fermentation vs rice vs soils); per-sector intensity.

---

## New viz components (paced — one per article, build when its article is scoped)

The rendering pipeline is **custom SVG** in `src/components/ArticleVisuals.astro` (no
D3/Plot/ECharts). Adding a chart type = three edits, mirroring any existing kind:

1. **`src/data/viz.ts`** — add a `…Visual` type to the `VisualSpec` union (line 224) and a
   builder fn (mirror `lineVisual`).
2. **`src/components/ArticleVisuals.astro`** — add a render branch (mirror the `line`
   handler at ~929); reuse scale/axis helpers from `src/data/chartSvg.ts`.
3. **`scripts/registry/v1-indicators.mjs`** — reference the new `chart` type in a visualPlan.

| New type | For | Effort | Notes |
|---|---|---|---|
| `loadCurve` | Article 1 | medium | 24-pt cyclical x-axis (00:00→24:00), 2 overlaid series (demand, solar), shaded evening-gap. The trickiest; de-risk first. |
| `stackedArea` | Article 2 | low-med | composition-over-time; repo has stacked *bar* + multi-line but no stacked area. |
| `sankey`/`treemap` | Article 4 | high | flow/hierarchy; no flow primitive exists yet. |

## Theming

Add one class per the `.theme-gold` / `.theme-climate-canonical` pattern:
- a `.theme-energy` (or `.theme-grid`) block in `src/styles/indica.css` overriding
  `--c` / `--c-ink` / `--c-tint`,
- applied to `.wrap` in `src/pages/articles/[slug].astro`.

## Data sourcing — the one real blocker

The hourly demand data **is not in the repo** and ICED's only export is a per-chart XLS
behind the dashboard UI. The Claude-in-Chrome extension is currently **disconnected**, so
the dashboard can't be driven from here. To build Article 1 against real numbers, one of:
- **(a)** user downloads the ICED hourly-demand XLS (Download XLS button) and drops the file
  in for an ingest adapter; or
- **(b)** ingest the upstream **Grid-India / POSOCO** all-India hourly demand directly
  (no ICED dependency, cleaner provenance) — needs a new `scripts/ingest-*.mjs`; or
- **(c)** reconnect the browser extension and let the dashboard download be automated.

No energy numbers get committed until they trace to one of these. (CLAUDE.md: only numbers
that trace to a source.)

## Build order

1. Settle data sourcing for Article 1 (a/b/c above).
2. Build the `loadCurve` chart type (viz.ts + ArticleVisuals.astro + chartSvg helpers).
3. Ingest hourly demand + solar profile → `data/series/`.
4. Registry `visualPlan` for `q.energy.demand_shape` → editorial brief → prose → explainers →
   validate → build.
5. Repeat per article 2→4, adding each new viz type only when its article is scoped.
