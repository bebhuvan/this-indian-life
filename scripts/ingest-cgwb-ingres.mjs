// CGWB INGRES — Dynamic Ground Water Resource Assessment ingest.
// Source: India Ground Water Resource Estimation System (ingres.iith.ac.in), the official
// CGWB assessment database. Undocumented but PUBLIC (no-auth) JSON API.
//
// Endpoint: POST /api/gec/getGISComparisonDataOpen  (NOT getBusinessDataForUserOpen, which is sparse).
//   - COUNTRY call returns every state keyed by its (per-year) UUID, each with a clean
//     annual.stageOfExtraction.total -> national stage trend + per-state stage map + NW divergence.
//   - STATE call returns the state's districts + a clean total rollup at
//     [year].total.annual.reportSummary.total.<UNIT_TYPE> -> category counts.
// State UUIDs are re-issued every assessment cycle, so we always re-enumerate from the COUNTRY call.
// See memory: indica-water-stress-flagship for the full recipe + caveats.

import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const API = "https://ingres.iith.ac.in/api/gec/getGISComparisonDataOpen";
const NATIONAL_UUID = "ffce954d-24e1-494b-ba7e-0931d8ad6085";
const SOURCE_ID = "cgwb-ingres";
const fetchedAt = new Date().toISOString();

// INGRES assessment-cycle labels (oldest -> newest). The ending year is the commonly cited
// "assessment year" (e.g. 2024-2025 = the 2025 assessment).
// NOTE: only cycles from 2019-2020 are kept. Pre-2019 INGRES national totals are on a
// non-comparable basis (it returns 68.1% for 2017 vs PIB's verified 63.33%, and 51% for 2013,
// likely partial state coverage). The kept cycles reconcile with PIB (2022=60.08, 2023=59.26,
// 2024=60.47/60.48, 2025=60.63). For the longer arc back to 2017, cite the PIB headline figures.
const YEAR_LABELS = [
  "2019-2020", "2021-2022", "2022-2023", "2023-2024", "2024-2025"
];
const LATEST = "2024-2025";
const assessmentYear = (label) => label.split("-")[1];

// States to trace over time for the "national-average improves while the NW worsens" beat.
const TREND_STATES = ["PUNJAB", "HARYANA", "RAJASTHAN", "DELHI", "TAMILNADU"];

// Category-count unit types, coarsest meaningful first. A state assesses in its native unit;
// pick the block-equivalent so national counts reconcile to the official ~6,762 (never VILLAGE/WATERSHED).
const UNIT_PREFERENCE = ["BLOCK", "TALUK", "MANDAL", "TEHSIL", "FIRKA", "DISTRICT", "ISLAND"];
const CATEGORIES = ["safe", "semi_critical", "critical", "over_exploited", "salinity"];

function cleanName(raw) {
  const fixes = { TAMILNADU: "Tamil Nadu", ANDHRAPRADESH: "Andhra Pradesh", "ANDAMAN AND NICOBAR": "Andaman & Nicobar" };
  if (fixes[raw]) return fixes[raw];
  return raw.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase()).replace(/\bAnd\b/g, "and");
}

async function fetchLoc({ locuuid, locname, loctype, year }) {
  const body = {
    view: "admin", computationType: "normal", component: "recharge", category: "all",
    locuuid, period: "annual,monsoon,non_monsoon", verificationStatus: 0, approvalLevel: 0,
    year, year_1: year, year_2: year, locname, loctype, parentuuid: NATIONAL_UUID
  };
  const res = await fetch(API, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${loctype} ${locname} ${year} -> HTTP ${res.status}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. COUNTRY call per cycle: national stage trend + per-state stage (latest) + NW trend ---
const nationalStage = [];        // { date, value }
const stateStageLatest = [];     // { state, stateRaw, value }
const stateTrend = [];           // { state, year, value }
let latestCountryPayload = null;

for (const label of YEAR_LABELS) {
  let data;
  try {
    data = await fetchLoc({ locuuid: NATIONAL_UUID, locname: "INDIA", loctype: "COUNTRY", year: label });
  } catch (err) {
    console.warn(`country ${label} failed: ${err.message}`);
    continue;
  }
  const block = data?.[label];
  const natStage = block?.total?.annual?.stageOfExtraction?.total;
  if (natStage == null || !Number.isFinite(Number(natStage))) {
    console.warn(`country ${label}: no national stage, skipping`);
    continue;
  }
  const date = assessmentYear(label);
  nationalStage.push({ date, value: Number(natStage) });

  for (const [uuid, entry] of Object.entries(block)) {
    if (uuid === "total") continue;
    const a = entry?.annual;
    const stage = a?.stageOfExtraction?.total;
    const nameRaw = a?.locationName;
    if (!nameRaw || stage == null || !Number.isFinite(Number(stage))) continue;
    if (TREND_STATES.includes(nameRaw)) {
      stateTrend.push({ state: cleanName(nameRaw), year: date, value: Number(stage) });
    }
    if (label === LATEST) {
      stateStageLatest.push({ state: cleanName(nameRaw), stateRaw: nameRaw, uuid, value: Number(stage) });
    }
  }
  if (label === LATEST) latestCountryPayload = data;
  console.log(`country ${label}: national SoE ${Number(natStage).toFixed(2)}%`);
  await sleep(180);
}

// Add the national line into the trend table so the divergence reads in one chart.
for (const row of nationalStage) stateTrend.push({ state: "India (national)", year: row.date, value: row.value });

// --- 2. STATE calls (latest year only): clean category counts per state ---
const categoryByState = []; // { state, safe, semi_critical, critical, over_exploited, salinity, total, unit }
const nationalCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));

function pickUnit(summaryTotal) {
  if (!summaryTotal) return null;
  for (const u of UNIT_PREFERENCE) if (summaryTotal[u]) return u;
  // fall back to whatever non-village/watershed unit exists
  const k = Object.keys(summaryTotal).find((x) => !["VILLAGE", "WATERSHED", "HILLY"].includes(x));
  return k || null;
}

for (const st of stateStageLatest) {
  let data;
  try {
    data = await fetchLoc({ locuuid: st.uuid, locname: st.stateRaw, loctype: "STATE", year: LATEST });
  } catch (err) {
    console.warn(`state ${st.stateRaw} failed: ${err.message}`);
    continue;
  }
  const summary = data?.[LATEST]?.total?.annual?.reportSummary?.total;
  const unit = pickUnit(summary);
  if (!unit) { console.warn(`state ${st.stateRaw}: no category summary`); continue; }
  const counts = summary[unit];
  const row = { state: st.state, unit };
  let total = 0;
  for (const c of CATEGORIES) {
    const n = Number(counts[c] || 0);
    row[c] = n; total += n; nationalCategory[c] += n;
  }
  row.total = total;
  categoryByState.push(row);
  await sleep(180);
}

const nationalUnitsTotal = CATEGORIES.reduce((s, c) => s + nationalCategory[c], 0);
console.log(`national category rollup: ${nationalUnitsTotal} units`, nationalCategory);
// Regression canary: 2025 official total is 6,762 units, SoE 60.63%.
if (LATEST === "2024-2025" && Math.abs(nationalUnitsTotal - 6762) > 60) {
  console.warn(`WARNING: national unit total ${nationalUnitsTotal} is far from official 6,762 — check unit-type selection`);
}

// --- 3. Write artifacts ---
const geo = { type: "country", id: "IN", name: "India" };
const manifest = [];
const note = "CGWB INGRES (getGISComparisonDataOpen). State UUIDs re-enumerated per cycle. Stage from COUNTRY call; category counts summed from per-state block-equivalent units.";

async function emitSeries({ indicatorId, title, unit, observations, metadata }) {
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId: SOURCE_ID, sourceIndicatorId: indicatorId,
    sourceUrl: API, unit, frequency: "annual", geography: geo, fetchedAt, observations,
    metadata: { collection: "CGWB Dynamic Ground Water Resource Assessment", note, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: indicatorId, artifact });
  manifest.push({ status: "ready", indicatorId, sourceIndicatorId: indicatorId, artifact: path, fetchedAt, observations: observations.length });
  console.log(`series ${indicatorId}: ${observations.length} obs`);
}

async function emitTable({ indicatorId, title, unit, rows, dimensions, metadata }) {
  const artifact = createTableArtifact({
    indicatorId, title, sourceId: SOURCE_ID, sourceIndicatorId: indicatorId,
    sourceUrl: API, unit, geography: geo, fetchedAt, rows, dimensions,
    metadata: { collection: "CGWB Dynamic Ground Water Resource Assessment", note, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: indicatorId, artifact });
  manifest.push({ status: "ready", indicatorId, sourceIndicatorId: indicatorId, artifact: path, fetchedAt, rows: rows.length });
  console.log(`table ${indicatorId}: ${rows.length} rows`);
}

await emitSeries({
  indicatorId: "water.cgwb.stage_national",
  title: "National stage of groundwater extraction",
  unit: "% (extraction / extractable resource)",
  observations: nationalStage
});

await emitTable({
  indicatorId: "water.cgwb.stage_by_state",
  title: `Stage of groundwater extraction by state (${assessmentYear(LATEST)})`,
  unit: "% (extraction / extractable resource)",
  rows: stateStageLatest.map(({ state, value }) => ({ state, value })).sort((a, b) => b.value - a.value),
  dimensions: ["state"],
  metadata: { assessmentYear: assessmentYear(LATEST), note: `${note} >100% = extraction exceeds annual recharge.` }
});

// Centerpiece map: stage of extraction choropleth (latest year). Map per-state values onto the
// shared India base geometry (era5.IN.state_warming) by name — the established choropleth pattern.
const baseMap = JSON.parse(await readFile("data/series/era5.IN.state_warming.json", "utf8"));
const stageByName = new Map(stateStageLatest.map((s) => [s.state, s.value]));
const choroRegions = baseMap.regions.map((region) => ({
  name: region.name,
  value: stageByName.has(region.name) ? Number(stageByName.get(region.name).toFixed(2)) : null,
  path: region.path
}));
const choroValues = choroRegions.map((r) => r.value).filter((v) => v != null);
const choropleth = {
  schemaVersion: 1,
  artifactType: "choropleth",
  indicatorId: "water.cgwb.stage_by_state_map",
  title: `Stage of groundwater extraction by state (${assessmentYear(LATEST)})`,
  sourceId: SOURCE_ID,
  sourceIndicatorId: "water.cgwb.stage_by_state_map",
  sourceUrl: API,
  unit: "% (extraction / extractable resource)",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt,
  viewBox: baseMap.viewBox,
  min: Math.min(...choroValues),
  max: Math.max(...choroValues),
  regions: choroRegions,
  metadata: {
    collection: "CGWB Dynamic Ground Water Resource Assessment",
    assessmentYear: assessmentYear(LATEST),
    note: ">100% = extraction exceeds annual recharge (over-exploited). Tiny UTs absent from the base map (Lakshadweep, Puducherry, Daman & Diu) are not shown.",
    nationalStage: nationalStage.find((o) => o.date === assessmentYear(LATEST))?.value ?? null
  }
};
const choroPath = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "water.cgwb.stage_by_state_map", artifact: choropleth });
manifest.push({ status: "ready", indicatorId: choropleth.indicatorId, sourceIndicatorId: choropleth.indicatorId, artifact: choroPath, fetchedAt, regions: choroRegions.length, matched: choroValues.length });
console.log(`choropleth water.cgwb.stage_by_state_map: ${choroValues.length}/${choroRegions.length} states (min ${choropleth.min.toFixed(1)}, max ${choropleth.max.toFixed(1)})`);

await emitTable({
  indicatorId: "water.cgwb.stage_state_trend",
  title: "Stage of groundwater extraction over assessment cycles — national vs the north-west belt",
  unit: "% (extraction / extractable resource)",
  rows: stateTrend,
  dimensions: ["state", "year"],
  metadata: { states: [...TREND_STATES.map(cleanName), "India (national)"] }
});

// Per-state stage series for the divergence multiLine (#8) — the renderer wants one series per
// line, so split the state×year trend into clean series (national + the north-west belt).
const trendSlug = (name) => "water.cgwb.stage_trend_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
for (const name of [...new Set(stateTrend.map((r) => r.state))]) {
  const obs = stateTrend.filter((r) => r.state === name)
    .map((r) => ({ date: r.year, value: r.value }))
    .sort((a, b) => a.date.localeCompare(b.date));
  await emitSeries({
    indicatorId: trendSlug(name),
    title: `Stage of groundwater extraction — ${name}`,
    unit: "% (extraction / extractable resource)",
    observations: obs
  });
}

await emitTable({
  indicatorId: "water.cgwb.category_national",
  title: `Assessment units by category, India (${assessmentYear(LATEST)})`,
  unit: "number of assessment units",
  rows: CATEGORIES.map((c) => ({
    category: c, count: nationalCategory[c],
    share: nationalUnitsTotal ? Number(((nationalCategory[c] / nationalUnitsTotal) * 100).toFixed(2)) : null
  })),
  dimensions: ["category"],
  metadata: { assessmentYear: assessmentYear(LATEST), totalUnits: nationalUnitsTotal }
});

await emitTable({
  indicatorId: "water.cgwb.category_by_state",
  title: `Assessment units by category and state (${assessmentYear(LATEST)})`,
  unit: "number of assessment units",
  rows: categoryByState.sort((a, b) => b.over_exploited - a.over_exploited),
  dimensions: ["state", "category"],
  metadata: { assessmentYear: assessmentYear(LATEST) }
});

await writeSnapshot(SOURCE_ID, `gis_india_${LATEST}`, latestCountryPayload || {});
await writeSourceManifest(SOURCE_ID, manifest);
console.log(`\nWrote ${manifest.length} CGWB INGRES artifacts.`);
