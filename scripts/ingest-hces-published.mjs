// Authoritative HCES 2023-24 consumption-inequality data, transcribed from the
// MoSPI press note (27 Dec 2024) — the published tables, NOT reverse-engineered
// from the unit-level microdata. (The microdata join was validated separately:
// all 261,953 households — 154,357 rural + 107,596 urban — match, confirming the
// release is intact; but reproducing MoSPI's exact MPCE needs the per-section
// reference-period schedule, so the published figures are the source of truth.)
//
// Source: HCES_Press_Note_2023-24_27122024_rev.pdf (snapshot in
// data/snapshots/mospi-hces/). Tables 1-2 (MPCE), Figure 1 (fractile MPCE),
// Figures 2-3 (state MPCE), and the Gini coefficients.
//
// Writes into the shared "inequality" manifest used by q.econ.inequality.

import { readFile } from "node:fs/promises";
import {
  createSeriesArtifact, createTableArtifact,
  writeSeriesArtifact, mergeSourceManifest
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE = "inequality";
const SRC_URL = "https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf";
const geoIN = { type: "country", id: "IN", name: "India" };
const geoStates = { type: "subnational", id: "IND-states", name: "India states" };
const entries = [];

async function series(id, title, unit, observations, extra = {}) {
  const artifact = createSeriesArtifact({
    indicatorId: id, title, sourceId: "mospi-hces", sourceIndicatorId: extra.sid || id,
    sourceUrl: SRC_URL, unit, frequency: "annual", geography: geoIN, fetchedAt, observations,
    metadata: { provenance: "MoSPI HCES 2023-24 press note (27 Dec 2024)", ...extra.meta }
  });
  const file = await writeSeriesArtifact({ sourceId: SOURCE, name: `mospi-hces.IN.${id.split(".").pop()}`, artifact });
  entries.push({ status: "ready", indicatorId: id, sourceIndicatorId: extra.sid || id, source: "mospi-hces", artifact: file, observations: observations.length, fetchedAt });
  console.log(`hces series ${id} (${observations.length})`);
}

async function table(id, title, unit, rows, geo = geoIN, extra = {}) {
  const artifact = createTableArtifact({
    indicatorId: id, title, sourceId: "mospi-hces", sourceIndicatorId: extra.sid || id,
    sourceUrl: SRC_URL, unit, geography: geo, fetchedAt, rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata: { provenance: "MoSPI HCES 2023-24 press note (27 Dec 2024)", ...extra.meta }
  });
  const file = await writeSeriesArtifact({ sourceId: SOURCE, name: `mospi-hces.IN.${id.split(".").pop()}`, artifact });
  entries.push({ status: "ready", indicatorId: id, sourceIndicatorId: extra.sid || id, source: "mospi-hces", artifact: file, rows: rows.length, fetchedAt });
  console.log(`hces table  ${id} (${rows.length} rows)`);
}

// Survey years labelled by start year to align with the World Bank series
// (2011 = 2011-12 / NSS 68th round, 2022 = 2022-23, 2023 = 2023-24).
// --- Table 1: average MPCE, current prices, WITHOUT imputation of free items ---
await series("econ.inequality.hces_mpce_rural", "Rural average MPCE (HCES, without imputation)", "₹ per person per month",
  [{ date: "2011", value: 1430 }, { date: "2022", value: 3773 }, { date: "2023", value: 4122 }], { sid: "HCES Table 1 rural" });
await series("econ.inequality.hces_mpce_urban", "Urban average MPCE (HCES, without imputation)", "₹ per person per month",
  [{ date: "2011", value: 2630 }, { date: "2022", value: 6459 }, { date: "2023", value: 6996 }], { sid: "HCES Table 1 urban" });
// --- Table 2: average MPCE WITH imputation of free welfare items ---
await series("econ.inequality.hces_mpce_rural_imputed", "Rural average MPCE (HCES, with welfare imputation)", "₹ per person per month",
  [{ date: "2011", value: 1430 }, { date: "2022", value: 3860 }, { date: "2023", value: 4247 }], { sid: "HCES Table 2 rural" });
await series("econ.inequality.hces_mpce_urban_imputed", "Urban average MPCE (HCES, with welfare imputation)", "₹ per person per month",
  [{ date: "2011", value: 2630 }, { date: "2022", value: 6521 }, { date: "2023", value: 7078 }], { sid: "HCES Table 2 urban" });

// --- Gini coefficient (0-100 scale), consumption ---
// 2022-23 & 2023-24 from this press note; 2011-12 from the NSS 68th-round report.
await series("econ.inequality.hces_gini_rural", "Consumption Gini — rural (HCES/NSS)", "Gini index (0–100)",
  [{ date: "2011", value: 28.3 }, { date: "2022", value: 26.6 }, { date: "2023", value: 23.7 }],
  { sid: "HCES Gini rural", meta: { note: "2011-12 from NSS 68th-round report; 2022-23 & 2023-24 from HCES press note." } });
await series("econ.inequality.hces_gini_urban", "Consumption Gini — urban (HCES/NSS)", "Gini index (0–100)",
  [{ date: "2011", value: 36.3 }, { date: "2022", value: 31.4 }, { date: "2023", value: 28.4 }],
  { sid: "HCES Gini urban", meta: { note: "2011-12 from NSS 68th-round report; 2022-23 & 2023-24 from HCES press note." } });

// --- Figure 1: average MPCE by fractile class, 2023-24 (the inequality staircase) ---
const FRACTILES = [
  { label: "Poorest 0-5%", w: 5 }, { label: "5-10%", w: 5 }, { label: "10-20%", w: 10 },
  { label: "20-30%", w: 10 }, { label: "30-40%", w: 10 }, { label: "40-50%", w: 10 },
  { label: "50-60%", w: 10 }, { label: "60-70%", w: 10 }, { label: "70-80%", w: 10 },
  { label: "80-90%", w: 10 }, { label: "90-95%", w: 5 }, { label: "Richest 95-100%", w: 5 }
];
const ruralFr2324 = [1677, 2126, 2473, 2833, 3162, 3498, 3866, 4304, 4885, 5763, 6929, 10137];
const urbanFr2324 = [2376, 3093, 3687, 4353, 4979, 5622, 6334, 7199, 8353, 10139, 12817, 20310];

await table("econ.inequality.hces_fractile_mpce_rural", "Rural average MPCE by fractile class, 2023-24", "₹ per person per month",
  FRACTILES.map((f, i) => ({ label: f.label, value: ruralFr2324[i], date: "2023-24" })), geoIN, { sid: "HCES Figure 1 rural" });
await table("econ.inequality.hces_fractile_mpce_urban", "Urban average MPCE by fractile class, 2023-24", "₹ per person per month",
  FRACTILES.map((f, i) => ({ label: f.label, value: urbanFr2324[i], date: "2023-24" })), geoIN, { sid: "HCES Figure 1 urban" });

// --- Consumption shares by group, COMPUTED from the official fractile means ---
// share_i = mpce_i * popweight_i / Σ(mpce * popweight). Self-consistent with the
// published Gini; lets us show "who consumes what" rigorously, not just the Gini.
function shares(mpce) {
  const tot = FRACTILES.reduce((s, f, i) => s + mpce[i] * f.w, 0);
  const part = (from, to) => FRACTILES.reduce((s, f, i) => s + (i >= from && i < to ? mpce[i] * f.w : 0), 0) / tot * 100;
  return {
    bottom50: part(0, 6),   // 0-50%  (classes 0..5)
    middle40: part(6, 10),  // 50-90% (classes 6..9)
    top10: part(10, 12),    // 90-100%
    top5: part(11, 12)      // 95-100%
  };
}
for (const [seg, mpce] of [["rural", ruralFr2324], ["urban", urbanFr2324]]) {
  const s = shares(mpce);
  const rows = [
    { label: "Poorest 50%", value: +s.bottom50.toFixed(1) },
    { label: "Middle 40%", value: +s.middle40.toFixed(1) },
    { label: "Richest 10%", value: +s.top10.toFixed(1) },
    { label: "Richest 5%", value: +s.top5.toFixed(1) }
  ];
  await table(`econ.inequality.hces_cons_share_${seg}`, `Consumption share by group — ${seg} (HCES 2023-24, computed)`, "% of total consumption",
    rows, geoIN, { sid: `HCES Figure 1 ${seg} derived shares`, meta: { method: "Weighted from published fractile average MPCE; consistent with published Gini." } });
}

// --- Figures 2-3: average MPCE by major state, 2023-24 (regional inequality) ---
const stateRural = [
  ["Kerala", 6611], ["Punjab", 5817], ["Tamil Nadu", 5701], ["Telangana", 5435], ["Haryana", 5377],
  ["Andhra Pradesh", 5327], ["Karnataka", 4903], ["Rajasthan", 4510], ["Maharashtra", 4145], ["Gujarat", 4116],
  ["Assam", 3793], ["Bihar", 3670], ["West Bengal", 3620], ["Uttar Pradesh", 3481], ["Madhya Pradesh", 3441],
  ["Odisha", 3357], ["Jharkhand", 2946], ["Chhattisgarh", 2739]
];
const stateUrban = [
  ["Telangana", 8978], ["Haryana", 8428], ["Tamil Nadu", 8165], ["Karnataka", 8076], ["Kerala", 7783],
  ["Maharashtra", 7363], ["Punjab", 7359], ["Andhra Pradesh", 7182], ["Gujarat", 7175], ["Assam", 6794],
  ["Rajasthan", 6574], ["Odisha", 5825], ["West Bengal", 5775], ["Madhya Pradesh", 5538], ["Uttar Pradesh", 5395],
  ["Jharkhand", 5393], ["Bihar", 5080], ["Chhattisgarh", 4927]
];
await table("econ.inequality.hces_state_mpce_rural", "Rural average MPCE by major state, 2023-24", "₹ per person per month",
  stateRural.map(([label, value]) => ({ label, value, date: "2023-24" })), geoStates, { sid: "HCES Figure 2", meta: { allIndia: 4122 } });
await table("econ.inequality.hces_state_mpce_urban", "Urban average MPCE by major state, 2023-24", "₹ per person per month",
  stateUrban.map(([label, value]) => ({ label, value, date: "2023-24" })), geoStates, { sid: "HCES Figure 3", meta: { allIndia: 6996 } });

// --- Granular cuts computed from the HCES unit-level microdata ---
// (scripts/derive-hces-granular.py: MPCE by caste & religion, calibrated to the
// published national means, validated against the 18 state means at 3.6% MAPE.
// These are NOT in the published factsheet — the differentiator.)
try {
  const g = JSON.parse(await readFile("data/snapshots/mospi-hces/hces_granular_derived.json", "utf8"));
  const microUrl = "https://microdata.gov.in/NADA/index.php/catalog/237";
  const meta = { provenance: "Computed from HCES 2023-24 unit-level microdata (NADA), calibrated to published national MPCE; validated vs 18 state means (3.6% MAPE).", validation: g.validation };

  // Caste gradient: Others -> OBC -> SC -> ST.
  const casteOrder = ["Others", "OBC", "Scheduled Caste", "Scheduled Tribe"];
  const casteRows = casteOrder.filter((k) => g.caste[k]).map((k) => ({
    label: k, value: g.caste[k].mpce, gini: g.caste[k].gini, popSharePct: g.caste[k].popSharePct, gapVsOthersPct: g.caste[k].gapVsRefPct
  }));
  const casteArt = createTableArtifact({
    indicatorId: "econ.inequality.hces_mpce_by_caste", title: "Consumption (MPCE) by caste group, 2023-24",
    sourceId: "mospi-hces", sourceIndicatorId: "HCES microdata: MPCE by social group", sourceUrl: microUrl,
    unit: "₹ per person per month", geography: geoIN, fetchedAt, rows: casteRows, dimensions: Object.keys(casteRows[0]), metadata: meta
  });
  const casteFile = await writeSeriesArtifact({ sourceId: SOURCE, name: "mospi-hces.IN.mpce_by_caste", artifact: casteArt });
  entries.push({ status: "ready", indicatorId: "econ.inequality.hces_mpce_by_caste", sourceIndicatorId: "HCES microdata caste", source: "mospi-hces", artifact: casteFile, rows: casteRows.length, fetchedAt });

  // Religion: keep groups with a non-trivial population share (drop noise like Zoroastrian 0.0%).
  const religRows = Object.entries(g.religion)
    .filter(([, v]) => v.popSharePct >= 0.4)
    .sort((a, b) => b[1].mpce - a[1].mpce)
    .map(([k, v]) => ({ label: k, value: v.mpce, gini: v.gini, popSharePct: v.popSharePct, gapVsHinduPct: v.gapVsRefPct }));
  const religArt = createTableArtifact({
    indicatorId: "econ.inequality.hces_mpce_by_religion", title: "Consumption (MPCE) by religion, 2023-24",
    sourceId: "mospi-hces", sourceIndicatorId: "HCES microdata: MPCE by religion", sourceUrl: microUrl,
    unit: "₹ per person per month", geography: geoIN, fetchedAt, rows: religRows, dimensions: Object.keys(religRows[0]), metadata: meta
  });
  const religFile = await writeSeriesArtifact({ sourceId: SOURCE, name: "mospi-hces.IN.mpce_by_religion", artifact: religArt });
  entries.push({ status: "ready", indicatorId: "econ.inequality.hces_mpce_by_religion", sourceIndicatorId: "HCES microdata religion", source: "mospi-hces", artifact: religFile, rows: religRows.length, fetchedAt });
  console.log(`hces granular: caste (${casteRows.length}) + religion (${religRows.length}) from microdata`);
} catch (e) {
  console.warn(`granular cuts skipped (run scripts/derive-hces-granular.py --write first): ${e.message}`);
}

await mergeSourceManifest(SOURCE, entries);
console.log(`\nMerged ${entries.length} authoritative HCES series/tables into the inequality manifest.`);
