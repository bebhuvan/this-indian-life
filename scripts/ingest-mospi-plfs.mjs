// Ingest MOSPI PLFS (Periodic Labour Force Survey) for the "How India Works"
// flagship. Bulk-fetches each indicator (survey/agriculture year), snapshots the
// raw payload, then pivots into clean artifacts:
//   - national time-series (LFPR/WPR/UR by gender, sector, age)  [series]
//   - worker-status composition + employment-by-broad-sector     [series]
//   - average earnings by employment type & gender               [series]
//   - UR by education level & social category (per-category)     [series]
//   - LFPR / UR / female-LFPR by state, latest year              [table]
// See memory: indica-how-india-works-flagship, indica-mospi-esankhyiki-api.
import { loadEnv } from "./env.mjs";
import { fetchPlfs } from "./adapters/mospi.mjs";
import {
  createSeriesArtifact,
  createTableArtifact,
  writeSeriesArtifact,
  writeSnapshot,
  writeSourceManifest
} from "./core/artifacts.mjs";

loadEnv();
const fetchedAt = new Date().toISOString();
const SOURCE = "mospi";
const srcUrl = (ind) =>
  `https://api.mospi.gov.in/api/plfs/getData?indicator_code=${ind}&frequency_code=1&Format=JSON`;

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const latestYear = (rows) =>
  [...new Set(rows.map((r) => r.year))].sort((a, b) => a.localeCompare(b)).at(-1);

// Fetch the indicators we need (survey/agriculture year = long history 2017-18…2023-24).
const INDICATORS = [1, 2, 3, 4, 6, 7, 8];
const raw = {};
for (const ind of INDICATORS) {
  const payload = await fetchPlfs({ indicatorCode: ind, frequencyCode: 1, yearTypeCode: 1 });
  raw[ind] = payload.data || [];
  await writeSnapshot(SOURCE, `plfs.indicator_${ind}.survey_year`, payload);
  console.log(`PLFS indicator ${ind}: ${raw[ind].length} rows`);
}

const manifest = [];
async function emitSeries({ id, title, unit, observations, frequency = "annual", metadata = {} }) {
  if (!observations.length || !observations.some((o) => Number.isFinite(o.value))) {
    console.warn(`  skip ${id}: no finite observations`);
    return;
  }
  const artifact = createSeriesArtifact({
    indicatorId: `work.plfs.${id}`,
    title,
    sourceId: SOURCE,
    sourceIndicatorId: id,
    sourceUrl: metadata.sourceUrl || srcUrl(metadata.ind || 3),
    unit,
    frequency,
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: { dataset: "PLFS", yearType: "survey (Jul–Jun)", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.plfs.${id}`, artifact });
  manifest.push({
    status: "ready",
    indicatorId: `work.plfs.${id}`,
    sourceIndicatorId: id,
    artifact: path,
    fetchedAt,
    observations: observations.length
  });
  console.log(`  series work.plfs.${id} (${observations.length} obs)`);
}

async function emitTable({ id, title, unit, rows, ind }) {
  if (!rows.length) {
    console.warn(`  skip table ${id}: no rows`);
    return;
  }
  const artifact = createTableArtifact({
    indicatorId: `work.plfs.${id}`,
    title,
    sourceId: SOURCE,
    sourceIndicatorId: id,
    sourceUrl: srcUrl(ind),
    unit,
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    rows,
    dimensions: Object.keys(rows[0]),
    metadata: { dataset: "PLFS", yearType: "survey (Jul–Jun)" }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.plfs.${id}`, artifact });
  manifest.push({
    status: "ready",
    indicatorId: `work.plfs.${id}`,
    sourceIndicatorId: id,
    artifact: path,
    fetchedAt,
    rows: rows.length
  });
  console.log(`  table work.plfs.${id} (${rows.length} rows)`);
}

// ---- Generic pivot for rate indicators (1=LFPR, 2=WPR, 3=UR) ----
// Base "headline" filter: All-India, usual status (PS+SS), no education/caste/religion split.
function rateSeries(ind, { gender, sector, age }) {
  return raw[ind]
    .filter(
      (r) =>
        r.state === "All India" &&
        r.gender === gender &&
        r.sector === sector &&
        r.AgeGroup === age &&
        r.weekly_status === "PS+SS" &&
        r.religion === "all" &&
        r.socialGroup === "all" &&
        r.General_Education === "all"
    )
    .map((r) => ({ date: r.year, value: num(r.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const RU = "rural + urban";
const A15 = "15 years and above";
const A1529 = "15-29 years";
const rateMeta = (ind) => ({ ind, sourceUrl: srcUrl(ind) });

// LFPR (ind 1) / WPR (ind 2) / UR (ind 3) headline cuts
for (const [ind, key, name] of [
  [1, "lfpr", "Labour Force Participation Rate"],
  [2, "wpr", "Worker Population Ratio"],
  [3, "ur", "Unemployment Rate"]
]) {
  await emitSeries({ id: `${key}_person`, title: `${name} — persons (15+)`, unit: "%", observations: rateSeries(ind, { gender: "person", sector: RU, age: A15 }), metadata: rateMeta(ind) });
  await emitSeries({ id: `${key}_male`, title: `${name} — male (15+)`, unit: "%", observations: rateSeries(ind, { gender: "male", sector: RU, age: A15 }), metadata: rateMeta(ind) });
  await emitSeries({ id: `${key}_female`, title: `${name} — female (15+)`, unit: "%", observations: rateSeries(ind, { gender: "female", sector: RU, age: A15 }), metadata: rateMeta(ind) });
}

// Female LFPR rural vs urban (the participation puzzle)
await emitSeries({ id: "lfpr_female_rural", title: "Female LFPR — rural (15+)", unit: "%", observations: rateSeries(1, { gender: "female", sector: "rural", age: A15 }), metadata: rateMeta(1) });
await emitSeries({ id: "lfpr_female_urban", title: "Female LFPR — urban (15+)", unit: "%", observations: rateSeries(1, { gender: "female", sector: "urban", age: A15 }), metadata: rateMeta(1) });

// Youth unemployment (15-29)
await emitSeries({ id: "ur_youth_person", title: "Youth unemployment rate — persons (15–29)", unit: "%", observations: rateSeries(3, { gender: "person", sector: RU, age: A1529 }), metadata: rateMeta(3) });
await emitSeries({ id: "ur_youth_male", title: "Youth unemployment rate — male (15–29)", unit: "%", observations: rateSeries(3, { gender: "male", sector: RU, age: A1529 }), metadata: rateMeta(3) });
await emitSeries({ id: "ur_youth_female", title: "Youth unemployment rate — female (15–29)", unit: "%", observations: rateSeries(3, { gender: "female", sector: RU, age: A1529 }), metadata: rateMeta(3) });
// UR rural vs urban
await emitSeries({ id: "ur_rural_person", title: "Unemployment rate — rural persons (15+)", unit: "%", observations: rateSeries(3, { gender: "person", sector: "rural", age: A15 }), metadata: rateMeta(3) });
await emitSeries({ id: "ur_urban_person", title: "Unemployment rate — urban persons (15+)", unit: "%", observations: rateSeries(3, { gender: "person", sector: "urban", age: A15 }), metadata: rateMeta(3) });

// ---- UR by education level (the graduate-unemployment paradox) ----
const EDU = [
  ["1.not literate", "ur_edu_not_literate", "Not literate"],
  ["2.literate & upto primary", "ur_edu_primary", "Literate–primary"],
  ["3.middle", "ur_edu_middle", "Middle"],
  ["4.secondary", "ur_edu_secondary", "Secondary"],
  ["5.higher secondary", "ur_edu_higher_secondary", "Higher secondary"],
  ["6.diploma/ certificate course", "ur_edu_diploma", "Diploma/certificate"],
  ["7.graduate", "ur_edu_graduate", "Graduate"],
  ["8.post graduate & above", "ur_edu_postgraduate", "Postgraduate & above"]
];
for (const [eduVal, id, label] of EDU) {
  const obs = raw[3]
    .filter(
      (r) =>
        r.state === "All India" &&
        r.gender === "person" &&
        r.sector === RU &&
        r.AgeGroup === A15 &&
        r.weekly_status === "PS+SS" &&
        r.religion === "all" &&
        r.socialGroup === "all" &&
        r.General_Education === eduVal
    )
    .map((r) => ({ date: r.year, value: num(r.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  await emitSeries({ id, title: `Unemployment rate — ${label} (15+)`, unit: "%", observations: obs, metadata: { ...rateMeta(3), educationLevel: label } });
}

// ---- UR by social category (caste gap) ----
const SOCIAL = [
  ["scheduled tribe", "ur_social_st", "Scheduled Tribe"],
  ["scheduled caste", "ur_social_sc", "Scheduled Caste"],
  ["other backward class", "ur_social_obc", "Other Backward Class"],
  ["others", "ur_social_others", "Others"]
];
for (const [socVal, id, label] of SOCIAL) {
  const obs = raw[3]
    .filter(
      (r) =>
        r.state === "All India" &&
        r.gender === "person" &&
        r.sector === RU &&
        r.AgeGroup === A15 &&
        r.weekly_status === "PS+SS" &&
        r.religion === "all" &&
        r.socialGroup === socVal &&
        r.General_Education === "all"
    )
    .map((r) => ({ date: r.year, value: num(r.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  await emitSeries({ id, title: `Unemployment rate — ${label} (15+)`, unit: "%", observations: obs, metadata: { ...rateMeta(3), socialCategory: label } });
}

// ---- Worker-status composition (ind 4) ----
function statusSeries(statusVal) {
  return raw[4]
    .filter(
      (r) =>
        r.state === "All India" &&
        r.gender === "person" &&
        r.sector === RU &&
        r.weekly_status === "PS+SS" &&
        r.broad_industry_work === "all" &&
        r.enterprise_size === "all" &&
        r.enterprise_type === "all" &&
        r.industry_section === "All" &&
        r.nco_division === "all" &&
        r.nic_group === "all" &&
        r.broad_status_employment === statusVal
    )
    .map((r) => ({ date: r.year, value: num(r.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
await emitSeries({ id: "status_self_employed", title: "Workers who are self-employed", unit: "% of workers", observations: statusSeries("3.all self employed"), metadata: rateMeta(4) });
await emitSeries({ id: "status_regular_wage", title: "Workers in regular wage/salaried jobs", unit: "% of workers", observations: statusSeries("4.regular wage/salary"), metadata: rateMeta(4) });
await emitSeries({ id: "status_casual", title: "Workers in casual labour", unit: "% of workers", observations: statusSeries("5.casual labour"), metadata: rateMeta(4) });

// ---- Employment by broad sector (ind 4, broad_industry_work) ----
function sectorEmpSeries(industryVal) {
  // Employment-by-broad-sector is reported on a current-weekly-status (CWS) basis only.
  return raw[4]
    .filter(
      (r) =>
        r.state === "All India" &&
        r.gender === "person" &&
        r.sector === RU &&
        r.weekly_status === "CWS" &&
        r.broad_status_employment === "all" &&
        r.broad_industry_work === industryVal &&
        r.enterprise_size === "all" &&
        r.enterprise_type === "all" &&
        r.industry_section === "All" &&
        r.nco_division === "all" &&
        r.nic_group === "all"
    )
    .map((r) => ({ date: r.year, value: num(r.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
await emitSeries({ id: "empshare_agriculture", title: "Workers in agriculture (primary sector)", unit: "% of workers", observations: sectorEmpSeries("primary sector (Div. 01-03 of NIC 2008)"), metadata: rateMeta(4) });
await emitSeries({ id: "empshare_industry", title: "Workers in industry (secondary sector)", unit: "% of workers", observations: sectorEmpSeries("secondary sector (Div. 05-43 of NIC 2008)"), metadata: rateMeta(4) });
await emitSeries({ id: "empshare_services", title: "Workers in services (tertiary sector)", unit: "% of workers", observations: sectorEmpSeries("tertiary sector (Div. 45-99 of NIC 2008)"), metadata: rateMeta(4) });

// ---- Average earnings (ind 6 regular ₹/month, 7 casual ₹/day, 8 self-employed ₹/month) ----
// Annual = mean of the four survey-year quarters.
function wageSeries(ind, gender) {
  const byYear = new Map();
  for (const r of raw[ind]) {
    if (r.state !== "All India" || r.gender !== gender || r.sector !== RU) continue;
    const v = num(r.value);
    if (v === null) continue;
    if (!byYear.has(r.year)) byYear.set(r.year, []);
    byYear.get(r.year).push(v);
  }
  return [...byYear.entries()]
    .map(([year, vals]) => ({ date: year, value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
await emitSeries({ id: "wage_regular_person", title: "Average monthly earnings — regular wage/salaried", unit: "₹/month", observations: wageSeries(6, "person"), metadata: rateMeta(6) });
await emitSeries({ id: "wage_regular_male", title: "Average monthly earnings — regular wage, male", unit: "₹/month", observations: wageSeries(6, "male"), metadata: rateMeta(6) });
await emitSeries({ id: "wage_regular_female", title: "Average monthly earnings — regular wage, female", unit: "₹/month", observations: wageSeries(6, "female"), metadata: rateMeta(6) });
await emitSeries({ id: "wage_casual_person", title: "Average daily wage — casual labour", unit: "₹/day", observations: wageSeries(7, "person"), metadata: rateMeta(7) });
await emitSeries({ id: "wage_self_employed_person", title: "Average monthly earnings — self-employed", unit: "₹/month", observations: wageSeries(8, "person"), metadata: rateMeta(8) });

// ---- State panels (latest survey year) for maps ----
function stateTable(ind, { gender, sector, age }) {
  const yr = latestYear(raw[ind]);
  return raw[ind]
    .filter(
      (r) =>
        r.year === yr &&
        r.state !== "All India" &&
        r.gender === gender &&
        r.sector === sector &&
        r.AgeGroup === age &&
        r.weekly_status === "PS+SS" &&
        r.religion === "all" &&
        r.socialGroup === "all" &&
        r.General_Education === "all"
    )
    .map((r) => ({ state: r.state, NumericValue: num(r.value), year: yr }))
    .filter((r) => Number.isFinite(r.NumericValue))
    .sort((a, b) => b.NumericValue - a.NumericValue);
}
await emitTable({ id: "lfpr_by_state", title: "Labour force participation rate by state (15+, persons)", unit: "%", rows: stateTable(1, { gender: "person", sector: RU, age: A15 }), ind: 1 });
await emitTable({ id: "ur_by_state", title: "Unemployment rate by state (15+, persons)", unit: "%", rows: stateTable(3, { gender: "person", sector: RU, age: A15 }), ind: 3 });
await emitTable({ id: "lfpr_female_by_state", title: "Female labour force participation rate by state (15+)", unit: "%", rows: stateTable(1, { gender: "female", sector: RU, age: A15 }), ind: 1 });

await writeSourceManifest("mospi-plfs", manifest);
console.log(`\nWrote ${manifest.length} PLFS artifacts.`);
