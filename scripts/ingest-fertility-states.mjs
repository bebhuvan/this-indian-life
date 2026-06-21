// Ingest state-wise fertility data for q.people.population.
//
// Sources:
//  - dataforindia.com /fertility/ chart payloads (snapshotted in
//    data/snapshots/dataforindia/), which themselves draw on:
//      * SRS Annual Statistical Reports, Registrar General of India (state TFR 1971-2023)
//      * SRS 2023 + UN World Population Prospects 2024 (states vs developed countries)
//      * World Bank World Development Indicators (fertility vs female LFP)
//      * NFHS rounds 1-5, IIPS (age at marriage / first / last birth)
//  - National Commission on Population, Technical Group on Population Projections,
//    Nov 2019 (state-wise TFR projections 2011-2035), digitized from NHP 2023.
//
// Emits artifacts into data/series/. Indicators resolve by indicatorId.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSeriesArtifact, createTableArtifact } from "./core/artifacts.mjs";

const ROOT = process.cwd();
const SNAP = resolve(ROOT, "data/snapshots/dataforindia");
const OUT = resolve(ROOT, "data/series");
const FETCHED = "2026-06-20T00:00:00.000Z";

const DFI_URL = "https://www.dataforindia.com/fertility/";
const SRS_URL = "https://censusindia.gov.in/census.website/en/data/srsstat";
const round1 = (v) => (v === null || v === undefined ? null : Math.round(v * 10) / 10);
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const readSnap = (name) => JSON.parse(readFileSync(resolve(SNAP, name), "utf8"));
const write = (file, obj) => {
  writeFileSync(resolve(OUT, file), JSON.stringify(obj, null, 2) + "\n");
  console.log("  wrote", file);
};

// Turn DFI's parallel-object columns into row arrays.
function dfiRows(data, cols) {
  const d = data.data;
  const n = Object.keys(d[cols[0]]).length;
  const out = [];
  for (let i = 0; i < n; i++) out.push(cols.map((c) => d[c][i]));
  return out;
}

// ---------------------------------------------------------------------------
// 1. State TFR over time (SRS 1971-2023) -> one clipped series per state for the
//    rankedChange chart. Clipped to 2013-2023 so every state is compared on the
//    same recent decade (the reorganised states only have data from 2014).
// ---------------------------------------------------------------------------
console.log("State TFR over time (SRS 1971-2023):");
{
  const data = readSnap("tfr-by-state-over-time.data.json");
  const rows = dfiRows(data, ["dfi_1_location", "dfi_3_year", "dfi_565_tfr"]);
  const byState = new Map();
  for (const [loc, yr, tfr] of rows) {
    if (tfr === null) continue;
    if (!byState.has(loc)) byState.set(loc, []);
    byState.get(loc).push({ date: String(yr), value: round1(tfr) });
  }
  const CLIP_FROM = 2013;
  for (const [state, obs] of byState) {
    if (state === "India") continue; // national arc already covered elsewhere
    const clipped = obs
      .filter((o) => Number(o.date) >= CLIP_FROM)
      .sort((a, b) => Number(a.date) - Number(b.date));
    if (clipped.length < 2) continue;
    write(`srs.IN.people.srs.tfr_state.${slug(state)}.json`, createSeriesArtifact({
      indicatorId: `people.srs.tfr_state.${slug(state)}`,
      title: `Total fertility rate, ${state}`,
      sourceId: "srs",
      sourceIndicatorId: `SRS Annual Statistical Reports: TFR, ${state}`,
      sourceUrl: SRS_URL,
      unit: "births per woman",
      geography: { type: "subnational", id: `IND-${slug(state)}`, name: state },
      fetchedAt: FETCHED,
      observations: clipped,
      metadata: {
        dataset: "SRS via dataforindia",
        via: DFI_URL,
        note: "Annual SRS estimate. Series clipped to 2013-2023 for cross-state comparison; full SRS history runs from the 1970s."
      }
    }));
  }
}

// ---------------------------------------------------------------------------
// 2. NCP projected TFR 2011-2035 -> choropleth of projected 2031-35, reusing the
//    existing state-map paths, plus a table of all projection windows.
// ---------------------------------------------------------------------------
console.log("NCP projected TFR 2011-2035:");
{
  const NCP_URL = "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf";
  // NHP 2023 table 1.2.11(b); National Commission on Population, Technical Group, Nov 2019.
  // columns: 2011-15, 2016-20, 2021-25, 2026-30, 2031-35
  const NCP = {
    India:                [2.4, 2.1, 1.9, 1.8, 1.7],
    "Andhra Pradesh":     [1.7, 1.6, 1.5, 1.5, 1.5],
    Assam:                [2.3, 2.2, 2.0, 1.9, 1.8],
    Bihar:                [3.8, 3.2, 2.9, 2.6, 2.4],
    Chhattisgarh:         [2.6, 2.3, 2.1, 1.9, 1.8],
    Gujarat:              [2.3, 2.2, 2.0, 1.9, 1.8],
    Haryana:              [2.3, 2.1, 1.9, 1.8, 1.7],
    "Himachal Pradesh":   [1.7, 1.6, 1.5, 1.5, 1.5],
    Jharkhand:            [2.8, 2.5, 2.2, 2.0, 1.9],
    Karnataka:            [1.9, 1.7, 1.6, 1.6, 1.6],
    Kerala:               [1.8, 1.8, 1.8, 1.8, 1.8],
    "Madhya Pradesh":     [3.0, 2.6, 2.3, 2.1, 2.0],
    Maharashtra:          [1.8, 1.7, 1.6, 1.5, 1.5],
    Odisha:               [2.1, 1.9, 1.8, 1.8, 1.7],
    Punjab:               [1.7, 1.6, 1.5, 1.5, 1.5],
    Rajasthan:            [3.0, 2.5, 2.2, 2.0, 1.9],
    "Tamil Nadu":         [1.7, 1.6, 1.5, 1.5, 1.5],
    Telangana:            [1.7, 1.6, 1.5, 1.5, 1.5],
    "Uttar Pradesh":      [3.3, 2.8, 2.3, 2.0, 1.9],
    Uttarakhand:          [2.0, 1.8, 1.7, 1.6, 1.6],
    "West Bengal":        [1.7, 1.6, 1.5, 1.5, 1.5],
    Delhi:                [1.8, 1.6, 1.5, 1.5, 1.5],
    "Jammu and Kashmir":  [1.9, 1.6, 1.5, 1.5, 1.5]
  };
  const WINDOWS = ["2011-15", "2016-20", "2021-25", "2026-30", "2031-35"];

  // 2a. choropleth of projected 2031-35, reusing existing map paths
  const base = JSON.parse(readFileSync(resolve(OUT, "nfhs.IN.people_nfhs_tfr_by_state.json"), "utf8"));
  const proj2035 = Object.fromEntries(Object.entries(NCP).map(([k, v]) => [k, v[4]]));
  const regions = base.regions.map((r) => ({
    name: r.name,
    value: proj2035[r.name] ?? null,
    path: r.path
  }));
  const vals = regions.map((r) => r.value).filter((v) => v !== null);
  write("ncp.IN.people_ncp_tfr_projection_2035.json", {
    schemaVersion: 1,
    artifactType: "choropleth",
    indicatorId: "people.ncp.tfr_projection_2035",
    title: "Projected fertility by state, 2031-35",
    sourceId: "ncp",
    sourceIndicatorId: "NCP Technical Group on Population Projections (2019): projected TFR 2031-35",
    sourceUrl: NCP_URL,
    unit: "births per woman",
    geography: { type: "subnational", id: "IND-states", name: "India states" },
    fetchedAt: FETCHED,
    viewBox: base.viewBox,
    min: Math.min(...vals),
    max: Math.max(...vals),
    regions,
    metadata: {
      dataset: "National Commission on Population, Technical Group on Population Projections, Nov 2019",
      via: DFI_URL,
      note: "Projected total fertility rate for the 2031-35 window. Northeast states (excluding Assam) projected jointly and not shown on the map."
    }
  });

  // 2b. table of all windows (for reference / future use)
  write("ncp.IN.people_ncp_tfr_projection_windows.json", createTableArtifact({
    indicatorId: "people.ncp.tfr_projection_windows",
    title: "Projected total fertility rate by state, 2011-2035",
    sourceId: "ncp",
    sourceIndicatorId: "NCP Technical Group on Population Projections (2019): projected TFR by 5-year window",
    sourceUrl: NCP_URL,
    unit: "births per woman",
    geography: { type: "subnational", id: "IND-states", name: "India states" },
    fetchedAt: FETCHED,
    rows: Object.entries(NCP).map(([state, vals]) => ({
      label: state,
      ...Object.fromEntries(WINDOWS.map((w, i) => [w, vals[i]]))
    })),
    dimensions: WINDOWS,
    metadata: { dataset: "National Commission on Population, Technical Group, Nov 2019", via: DFI_URL }
  }));
}

// ---------------------------------------------------------------------------
// 3. Indian states vs developed countries (2023) -> tableBars
// ---------------------------------------------------------------------------
console.log("States vs developed countries (2023):");
{
  const data = readSnap("tfr-states-vs-developed-2023.data.json");
  const rows = dfiRows(data, ["dfi_1_location", "dfi_2_category", "dfi_3_tofera20"]);
  write("dfi.IN.people_tfr_states_vs_developed.json", createTableArtifact({
    indicatorId: "people.dfi.tfr_states_vs_developed",
    title: "Indian states and developed countries, 2023",
    sourceId: "srs",
    sourceIndicatorId: "SRS 2023 (states) and UN World Population Prospects 2024 (countries): TFR",
    sourceUrl: SRS_URL,
    unit: "births per woman",
    fetchedAt: FETCHED,
    rows: rows
      .map(([loc, cat, tfr]) => ({ label: loc, value: round1(tfr), group: cat === "State" ? "Indian state" : "Country" }))
      .sort((a, b) => b.value - a.value),
    dimensions: ["Indian state", "Country"],
    metadata: { dataset: "SRS 2023 + UN WPP 2024 via dataforindia", via: DFI_URL }
  }));
}

// ---------------------------------------------------------------------------
// 4. Age at first marriage / first birth / last birth (NFHS 1-5) -> 3 series
// ---------------------------------------------------------------------------
console.log("Age at marriage / first / last birth (NFHS 1-5):");
{
  const data = readSnap("age-marriage-first-last-birth.data.json");
  const rows = dfiRows(data, ["dfi_1_year", "dfi_2_maafb", "dfi_3_maalb", "dfi_4_maafm"]);
  const mk = (idx, id, title) => write(`nfhs.IN.people_nfhs_${id}.json`, createSeriesArtifact({
    indicatorId: `people.nfhs.${id}`,
    title,
    sourceId: "nfhs",
    sourceIndicatorId: `NFHS rounds 1-5 (IIPS): ${title}`,
    sourceUrl: "https://www.nfhsiips.in/nfhsuser/index.php",
    unit: "years",
    fetchedAt: FETCHED,
    observations: rows.map(([yr, ...vals]) => ({ date: String(yr), value: round1(vals[idx]) })),
    metadata: { dataset: "NFHS 1-5 via dataforindia", via: DFI_URL }
  }));
  mk(0, "age_first_birth", "Median age at first birth");
  mk(1, "age_last_birth", "Median age at last birth");
  mk(2, "age_first_marriage", "Median age at first marriage");
}

// ---------------------------------------------------------------------------
// 5. Fertility vs female labour-force participation (World Bank WDI) -> scatter table
// ---------------------------------------------------------------------------
console.log("Fertility vs female LFP (World Bank WDI):");
{
  const data = readSnap("fertility-vs-female-lfp.data.json");
  const rows = dfiRows(data, ["country_code", "sp_dyn_tfrt_in", "sl_tlf_acti_fe_zs"]);
  // ISO3 -> readable name for the points we want to surface; others labelled by code.
  const NAME = {
    IND: "India", VNM: "Vietnam", BGD: "Bangladesh", CHN: "China", KOR: "South Korea",
    JPN: "Japan", USA: "United States", FRA: "France", DEU: "Germany", BRA: "Brazil",
    IDN: "Indonesia", PAK: "Pakistan", NGA: "Nigeria", IRN: "Iran", THA: "Thailand",
    LKA: "Sri Lanka", NPL: "Nepal", PHL: "Philippines", MEX: "Mexico", EGY: "Egypt",
    ETH: "Ethiopia", TUR: "Turkey", GBR: "United Kingdom", ITA: "Italy", ESP: "Spain"
  };
  const HIGHLIGHT = new Set(["IND", "VNM", "BGD", "CHN", "KOR", "USA", "NGA", "ETH", "JPN", "IDN"]);
  const out = rows
    .map(([code, tfr, lfp]) => {
      if (tfr === null || lfp === null) return null;
      return {
        label: NAME[code] || code,
        x: Math.round(lfp * 10) / 10,        // female LFP %
        y: Math.round(tfr * 100) / 100,      // TFR (keep 2dp; not false precision, it's WB modelled)
        highlight: HIGHLIGHT.has(code) ? 1 : 0
      };
    })
    .filter(Boolean);
  write("worldbank.IN.people_fertility_vs_female_lfp.json", createTableArtifact({
    indicatorId: "people.wb.fertility_vs_female_lfp",
    title: "Fertility and female labour-force participation",
    sourceId: "worldbank",
    sourceIndicatorId: "World Bank WDI: SP.DYN.TFRT.IN (TFR) and SL.TLF.ACTI.FE.ZS (female LFP, 15-64, modelled ILO)",
    sourceUrl: "https://data.worldbank.org/indicator/SP.DYN.TFRT.IN",
    unit: "births per woman",
    geography: { type: "world", id: "WLD", name: "World" },
    fetchedAt: FETCHED,
    rows: out,
    dimensions: ["x", "y", "highlight"],
    metadata: {
      dataset: "World Bank WDI via dataforindia",
      via: DFI_URL,
      xLabel: "Female labour-force participation (% of women 15-64)",
      yLabel: "Total fertility rate (births per woman)"
    }
  }));
}

console.log("Done.");
