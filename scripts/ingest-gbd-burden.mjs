import { fetchJson } from "./lib/source-http.mjs";
import {
  createSeriesArtifact,
  createTableArtifact,
  mergeSourceManifest,
  sourceSlug,
  writeSeriesArtifact,
  writeSnapshot
} from "./core/artifacts.mjs";

// IHME Global Burden of Disease 2023 (DALYs + risk factors), accessed via OWID's
// per-indicator data API. The bulk grapher CSVs for GBD are now non-redistributable
// (the .csv endpoint returns 403 "non-redistributable data"), so — exactly like
// ingest-gbd-deaths.mjs — we fetch each variable on its own from
//   https://api.ourworldindata.org/v1/indicators/{variableId}.data.json + .metadata.json
// The data.json is column-parallel arrays { values[], years[], entities[] } where
// `entities` holds OWID entity ids; the metadata.json maps those ids -> {name, code}.
//
// Grapher slugs probed/used (2026-06):
//   burden-of-disease-by-cause          -> DALYs by level-2 cause (counts)
//   disease-burden-by-risk-factor       -> DALYs attributed to risk factors
//   number-of-deaths-by-risk-factor     -> Deaths attributed to risk factors
//   diabetes-prevalence                 -> diabetes prevalence (% ages 20-79)
// Broad-group (communicable / NCD / injuries) DALY graphers do NOT exist as their own
// slug, so we aggregate the 25 level-2 causes into GBD's three level-1 groups ourselves.

const apiBase = process.env.OWID_INDICATORS_BASE_URL || "https://api.ourworldindata.org/v1/indicators";
const fetchedAt = new Date().toISOString();
const SOURCE_ATTRIBUTION = "IHME, Global Burden of Disease (2024) via Our World in Data";
const GBD_RELEASE = "GBD 2023"; // OWID variable origins cite "Global Burden of Disease Study 2023"

const GRAPHER = {
  cause: "burden-of-disease-by-cause",
  riskDalys: "disease-burden-by-risk-factor",
  riskDeaths: "number-of-deaths-by-risk-factor",
  diabetes: "diabetes-prevalence"
};
const grapherUrl = (slug) => `https://ourworldindata.org/grapher/${slug}`;

// Cross-country comparison set: India + South/East-Asian peers + Nigeria + US + World.
const COMPARATORS = [
  { code: "IND", name: "India" },
  { code: "BGD", name: "Bangladesh" },
  { code: "CHN", name: "China" },
  { code: "IDN", name: "Indonesia" },
  { code: "VNM", name: "Vietnam" },
  { code: "LKA", name: "Sri Lanka" },
  { code: "NGA", name: "Nigeria" },
  { code: "USA", name: "United States" },
  { code: "WLD", name: "World" }
];
// OWID uses OWID_WRL as the entity code for "World".
const owidCodeFor = (code) => (code === "WLD" ? "OWID_WRL" : code);

// GBD level-2 causes (DALY counts) from burden-of-disease-by-cause, each tagged with
// its level-1 broad group. group: cmnn | ncd | injury. `feature` => write its own
// India history series (the curated "top causes" set).
const CAUSES = [
  { slug: "cardiovascular", label: "Cardiovascular diseases", variableId: 1156614, group: "ncd", feature: true },
  { slug: "neoplasms", label: "Cancers", variableId: 1156874, group: "ncd", feature: true },
  { slug: "chronic_respiratory", label: "Chronic respiratory diseases", variableId: 1156641, group: "ncd", feature: true },
  { slug: "diabetes_kidney", label: "Diabetes & kidney diseases", variableId: 1156673, group: "ncd", feature: true },
  { slug: "mental", label: "Mental disorders", variableId: 1156843, group: "ncd", feature: true },
  { slug: "musculoskeletal", label: "Musculoskeletal disorders", variableId: 1156855, group: "ncd", feature: true },
  { slug: "neurological", label: "Neurological disorders", variableId: 1156879, group: "ncd", feature: true },
  { slug: "digestive", label: "Digestive diseases", variableId: 1156688, group: "ncd", feature: true },
  { slug: "substance_use", label: "Substance use disorders", variableId: 1157047, group: "ncd" },
  { slug: "skin", label: "Skin & subcutaneous diseases", variableId: 1157036, group: "ncd" },
  { slug: "other_ncd", label: "Other non-communicable diseases", variableId: 1156950, group: "ncd" },
  { slug: "neonatal", label: "Neonatal disorders", variableId: 1156867, group: "cmnn", feature: true },
  { slug: "respiratory_infections_tb", label: "Respiratory infections & TB", variableId: 1157012, group: "cmnn", feature: true },
  { slug: "enteric", label: "Enteric infections", variableId: 1156713, group: "cmnn", feature: true },
  { slug: "nutritional", label: "Nutritional deficiencies", variableId: 1156900, group: "cmnn", feature: true },
  { slug: "ntd_malaria", label: "Neglected tropical diseases & malaria", variableId: 1156864, group: "cmnn" },
  { slug: "hiv_sti", label: "HIV/AIDS & STIs", variableId: 1156754, group: "cmnn" },
  { slug: "maternal", label: "Maternal disorders", variableId: 1156829, group: "cmnn" },
  { slug: "other_infectious", label: "Other infectious diseases", variableId: 1156935, group: "cmnn" },
  { slug: "transport_injuries", label: "Transport injuries", variableId: 1157071, group: "injury", feature: true },
  { slug: "self_harm", label: "Self-harm (suicide)", variableId: 1157023, group: "injury", feature: true },
  { slug: "unintentional_injuries", label: "Unintentional injuries", variableId: 1157083, group: "injury" },
  { slug: "interpersonal_violence", label: "Interpersonal violence", variableId: 1156779, group: "injury" },
  { slug: "conflict_terrorism", label: "Conflict & terrorism", variableId: 1156654, group: "injury" },
  { slug: "forces_of_nature", label: "Exposure to forces of nature", variableId: 1156717, group: "injury" }
];

const GROUP_META = {
  cmnn: { label: "Communicable, maternal, neonatal & nutritional", short: "Communicable / maternal / neonatal / nutritional" },
  ncd: { label: "Non-communicable diseases", short: "Non-communicable diseases" },
  injury: { label: "Injuries", short: "Injuries" }
};

// Curated headline risk factors present in both the deaths and DALYs graphers
// (a few have only one). deathVar / dalyVar are OWID variable ids.
const RISKS = [
  { slug: "air_pollution", label: "Air pollution (total)", deathVar: 1171305, dalyVar: 1188392 },
  { slug: "ambient_particulate", label: "Ambient particulate matter pollution", deathVar: 1171332, dalyVar: 1188393 },
  { slug: "household_air_pollution", label: "Household air pollution from solid fuels", deathVar: 1171721, dalyVar: 1188403 },
  { slug: "high_blood_pressure", label: "High systolic blood pressure", deathVar: 1171684, dalyVar: 1188404 },
  { slug: "high_blood_sugar", label: "High fasting plasma glucose", deathVar: 1171675, dalyVar: 1188402 },
  { slug: "smoking", label: "Smoking (tobacco)", deathVar: 1172074, dalyVar: 1188411 },
  { slug: "secondhand_smoke", label: "Secondhand smoke", deathVar: 1172044, dalyVar: 1188410 },
  { slug: "high_bmi", label: "High body-mass index", deathVar: 1171661, dalyVar: 1188401 },
  { slug: "high_ldl", label: "High LDL cholesterol", deathVar: 1171630, dalyVar: 1188400 },
  { slug: "alcohol", label: "High alcohol use", deathVar: 1171646, dalyVar: null },
  { slug: "diet_high_sodium", label: "Diet high in sodium", deathVar: 1171456, dalyVar: 1188396 },
  { slug: "diet_low_fruits", label: "Diet low in fruits", deathVar: 1171501, dalyVar: 1188397 },
  { slug: "diet_low_vegetables", label: "Diet low in vegetables", deathVar: 1171554, dalyVar: 1188398 },
  { slug: "unsafe_water", label: "Unsafe water source", deathVar: 1172137, dalyVar: 1188413 },
  { slug: "unsafe_sanitation", label: "Unsafe sanitation", deathVar: 1172116, dalyVar: 1188412 },
  { slug: "child_wasting", label: "Child wasting", deathVar: 1171419, dalyVar: 1188395 },
  { slug: "low_physical_activity", label: "Low physical activity", deathVar: 1171777, dalyVar: 1188409 }
];

// ---- fetch + extraction helpers --------------------------------------------

const variableCache = new Map();

async function fetchVariable(variableId) {
  if (variableCache.has(variableId)) return variableCache.get(variableId);
  const [data, metadata] = await Promise.all([
    fetchJson(`${apiBase}/${variableId}.data.json`),
    fetchJson(`${apiBase}/${variableId}.metadata.json`)
  ]);
  const entityById = new Map(
    (metadata?.dimensions?.entities?.values || []).map((e) => [e.id, { code: e.code, name: e.name }])
  );
  const result = { data, metadata, entityById };
  variableCache.set(variableId, result);
  return result;
}

// Observations for one country (by ISO3-ish OWID code), sorted, year >= 1990.
function extractCountry({ data, entityById }, code) {
  const owidCode = owidCodeFor(code);
  return (data.entities || [])
    .map((entityId, index) => ({ entityId, year: data.years?.[index], value: data.values?.[index] }))
    .filter((row) => {
      const ent = entityById.get(row.entityId);
      return ent && (ent.code === owidCode || (code === "WLD" && ent.name === "World")) && row.year != null && row.year >= 1990;
    })
    .map((row) => ({ date: String(row.year), value: row.value == null ? null : Number(row.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function indiaSeriesArtifact({ indicatorId, title, slug, unit, sourceUrl, observations, metadata }) {
  if (!observations.some((row) => Number.isFinite(row.value))) {
    throw new Error(`No finite India observations for ${indicatorId}`);
  }
  return createSeriesArtifact({
    indicatorId,
    title,
    sourceId: "gbd",
    sourceIndicatorId: slug,
    sourceUrl,
    unit,
    frequency: "annual",
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    observations,
    // redistributable:false — IHME GBD licence forbids re-hosting data for download,
    // so the evidence block drops the GitHub data-file link (chart + source link stay).
    metadata: { gbdRelease: GBD_RELEASE, source: SOURCE_ATTRIBUTION, redistributable: false, ...metadata }
  });
}

const manifest = [];
const failures = [];

async function writeIndiaSeries(spec) {
  try {
    const artifact = indiaSeriesArtifact(spec);
    const path = await writeSeriesArtifact({ sourceId: "gbd", name: `gbd.IN.${sourceSlug(spec.indicatorId)}`, artifact });
    const latest = artifact.observations.at(-1);
    manifest.push({
      status: "ready",
      indicatorId: spec.indicatorId,
      sourceIndicatorId: spec.slug,
      artifact: path,
      observations: artifact.observations.length,
      latestYear: latest?.date,
      latestValue: latest?.value,
      fetchedAt
    });
    console.log(`gbd ${spec.indicatorId} ${artifact.observations.length} obs · ${latest?.date}=${Math.round(latest?.value ?? 0).toLocaleString()}`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: spec.indicatorId, sourceIndicatorId: spec.slug, fetchedAt, error: error.message });
    console.warn(`gbd ${spec.indicatorId} failed: ${error.message}`);
  }
}

async function writeTable(spec) {
  try {
    if (!spec.rows.length) throw new Error("no rows");
    const artifact = createTableArtifact({
      indicatorId: spec.indicatorId,
      title: spec.title,
      sourceId: "gbd",
      sourceIndicatorId: spec.slug,
      sourceUrl: spec.sourceUrl,
      unit: spec.unit,
      geography: { type: "country-group", id: COMPARATORS.map((c) => c.code).join("-"), name: "India and comparators" },
      fetchedAt,
      rows: spec.rows,
      dimensions: ["date", "countryCode", "countryName", "value"],
      metadata: { gbdRelease: GBD_RELEASE, source: spec.source || SOURCE_ATTRIBUTION, redistributable: false, ...spec.metadata }
    });
    const path = await writeSeriesArtifact({ sourceId: "gbd", name: `gbd.compare.${sourceSlug(spec.indicatorId)}`, artifact });
    manifest.push({
      status: "ready",
      indicatorId: spec.indicatorId,
      sourceIndicatorId: spec.slug,
      artifact: path,
      rows: artifact.rows.length,
      fetchedAt
    });
    console.log(`gbd ${spec.indicatorId} ${artifact.rows.length} rows (table)`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: spec.indicatorId, sourceIndicatorId: spec.slug, fetchedAt, error: error.message });
    console.warn(`gbd ${spec.indicatorId} failed: ${error.message}`);
  }
}

// ---- (a) + (b) + (d): DALYs by cause -----------------------------------------
// Fetch all 25 level-2 cause variables (each for all comparator countries), then
// derive broad-group shares/counts (India), per-cause India history (features),
// and the cross-country NCD DALY-share table.

// perCountryCause[code][slug] = Map(year -> value)
const perCountryCause = {};
for (const c of COMPARATORS) perCountryCause[c.code] = {};
const causeSnapshotRows = {};

for (const cause of CAUSES) {
  const variable = await fetchVariable(cause.variableId);
  causeSnapshotRows[cause.slug] = {};
  for (const country of COMPARATORS) {
    const obs = extractCountry(variable, country.code);
    perCountryCause[country.code][cause.slug] = new Map(obs.map((o) => [o.date, o.value]));
    causeSnapshotRows[cause.slug][country.code] = obs;
  }
}

const causeSnapshot = await writeSnapshot("gbd", "burden-of-disease-by-cause.dalys", {
  grapher: GRAPHER.cause,
  variableIds: CAUSES.map((c) => ({ slug: c.slug, variableId: c.variableId, group: c.group })),
  comparators: COMPARATORS,
  rows: causeSnapshotRows
});
console.log(`snapshot ${causeSnapshot.path}`);

function yearsForCountry(code) {
  const years = new Set();
  for (const cause of CAUSES) {
    for (const y of perCountryCause[code][cause.slug].keys()) years.add(y);
  }
  return [...years].sort();
}

function groupTotals(code) {
  // returns { year: { cmnn, ncd, injury, total } }
  const out = {};
  for (const year of yearsForCountry(code)) {
    const acc = { cmnn: 0, ncd: 0, injury: 0, total: 0, ok: true };
    for (const cause of CAUSES) {
      const v = perCountryCause[code][cause.slug].get(year);
      if (!Number.isFinite(v)) { acc.ok = false; break; }
      acc[cause.group] += v;
      acc.total += v;
    }
    if (acc.ok && acc.total > 0) out[year] = acc;
  }
  return out;
}

// (a) India broad-group shares + counts + total
const indiaGroups = groupTotals("IND");
const indiaYears = Object.keys(indiaGroups).sort();
for (const group of ["cmnn", "ncd", "injury"]) {
  await writeIndiaSeries({
    indicatorId: `health.gbd.dalys_share_${group}`,
    title: `${GROUP_META[group].label} — share of India's DALYs`,
    slug: GRAPHER.cause,
    unit: "% of total DALYs",
    sourceUrl: grapherUrl(GRAPHER.cause),
    observations: indiaYears.map((y) => ({ date: y, value: (indiaGroups[y][group] / indiaGroups[y].total) * 100 })),
    metadata: {
      derived: "Sum of GBD level-2 cause DALYs in this group / sum across all causes * 100",
      group: GROUP_META[group].short,
      causesInGroup: CAUSES.filter((c) => c.group === group).map((c) => c.label)
    }
  });
  await writeIndiaSeries({
    indicatorId: `health.gbd.dalys_count_${group}`,
    title: `${GROUP_META[group].label} — DALYs in India`,
    slug: GRAPHER.cause,
    unit: "DALYs",
    sourceUrl: grapherUrl(GRAPHER.cause),
    observations: indiaYears.map((y) => ({ date: y, value: indiaGroups[y][group] })),
    metadata: { derived: "Sum of GBD level-2 cause DALYs in this group", group: GROUP_META[group].short }
  });
}
await writeIndiaSeries({
  indicatorId: "health.gbd.dalys_total",
  title: "Total DALYs in India (all causes)",
  slug: GRAPHER.cause,
  unit: "DALYs",
  sourceUrl: grapherUrl(GRAPHER.cause),
  observations: indiaYears.map((y) => ({ date: y, value: indiaGroups[y].total })),
  metadata: { derived: "Sum of all 25 GBD level-2 cause DALYs" }
});

// (b) Curated top specific-cause India history (DALY counts)
for (const cause of CAUSES.filter((c) => c.feature)) {
  const map = perCountryCause.IND[cause.slug];
  const observations = [...map.entries()].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
  await writeIndiaSeries({
    indicatorId: `health.gbd.dalys_cause_${cause.slug}`,
    title: `DALYs from ${cause.label} in India`,
    slug: GRAPHER.cause,
    unit: "DALYs",
    sourceUrl: grapherUrl(GRAPHER.cause),
    observations,
    metadata: { cause: cause.label, broadGroup: GROUP_META[cause.group].short, owidVariableId: cause.variableId }
  });
}

// (d) Cross-country NCD share of DALYs (table)
const ncdShareRows = [];
for (const country of COMPARATORS) {
  const groups = groupTotals(country.code);
  for (const year of Object.keys(groups).sort()) {
    ncdShareRows.push({
      date: year,
      countryCode: country.code === "WLD" ? "WLD" : country.code,
      countryName: country.name,
      value: (groups[year].ncd / groups[year].total) * 100
    });
  }
}
await writeTable({
  indicatorId: "health.gbd.dalys_ncd_share_compare",
  title: "NCD share of disease burden (DALYs): India vs comparators",
  slug: GRAPHER.cause,
  unit: "% of total DALYs",
  sourceUrl: grapherUrl(GRAPHER.cause),
  rows: ncdShareRows,
  metadata: { derived: "Non-communicable cause DALYs / total DALYs * 100, per country" }
});

// ---- (c) Risk factors: deaths + DALYs (India) --------------------------------
for (const risk of RISKS) {
  if (risk.deathVar) {
    try {
      const variable = await fetchVariable(risk.deathVar);
      const observations = extractCountry(variable, "IND");
      await writeSnapshot("gbd", `risk-deaths.${risk.slug}`, { grapher: GRAPHER.riskDeaths, variableId: risk.deathVar, india: observations });
      await writeIndiaSeries({
        indicatorId: `health.gbd.risk_deaths_${risk.slug}`,
        title: `Deaths attributed to ${risk.label} in India`,
        slug: GRAPHER.riskDeaths,
        unit: "deaths",
        sourceUrl: grapherUrl(GRAPHER.riskDeaths),
        observations,
        metadata: { riskFactor: risk.label, owidVariableId: risk.deathVar }
      });
    } catch (error) {
      failures.push({ status: "failed", indicatorId: `health.gbd.risk_deaths_${risk.slug}`, sourceIndicatorId: GRAPHER.riskDeaths, fetchedAt, error: error.message });
      console.warn(`gbd health.gbd.risk_deaths_${risk.slug} failed: ${error.message}`);
    }
  }
  if (risk.dalyVar) {
    try {
      const variable = await fetchVariable(risk.dalyVar);
      const observations = extractCountry(variable, "IND");
      await writeSnapshot("gbd", `risk-dalys.${risk.slug}`, { grapher: GRAPHER.riskDalys, variableId: risk.dalyVar, india: observations });
      await writeIndiaSeries({
        indicatorId: `health.gbd.risk_dalys_${risk.slug}`,
        title: `DALYs attributed to ${risk.label} in India`,
        slug: GRAPHER.riskDalys,
        unit: "DALYs",
        sourceUrl: grapherUrl(GRAPHER.riskDalys),
        observations,
        metadata: { riskFactor: risk.label, owidVariableId: risk.dalyVar }
      });
    } catch (error) {
      failures.push({ status: "failed", indicatorId: `health.gbd.risk_dalys_${risk.slug}`, sourceIndicatorId: GRAPHER.riskDalys, fetchedAt, error: error.message });
      console.warn(`gbd health.gbd.risk_dalys_${risk.slug} failed: ${error.message}`);
    }
  }
}

// ---- diabetes prevalence (cross-country table) -------------------------------
try {
  const variable = await fetchVariable(1205138);
  const rows = [];
  const snapRows = {};
  for (const country of COMPARATORS) {
    const obs = extractCountry(variable, country.code);
    snapRows[country.code] = obs;
    for (const o of obs) rows.push({ date: o.date, countryCode: country.code, countryName: country.name, value: o.value });
  }
  await writeSnapshot("gbd", "diabetes-prevalence.compare", { grapher: GRAPHER.diabetes, variableId: 1205138, rows: snapRows });
  await writeTable({
    indicatorId: "health.gbd.diabetes_prevalence_compare",
    title: "Diabetes prevalence (ages 20-79): India vs comparators",
    slug: GRAPHER.diabetes,
    unit: "% of population ages 20-79",
    sourceUrl: grapherUrl(GRAPHER.diabetes),
    rows,
    metadata: { note: "OWID 'diabetes-prevalence' grapher (IDF via World Bank/OWID)", owidVariableId: 1205138 }
  });
} catch (error) {
  failures.push({ status: "failed", indicatorId: "health.gbd.diabetes_prevalence_compare", sourceIndicatorId: GRAPHER.diabetes, fetchedAt, error: error.message });
  console.warn(`gbd health.gbd.diabetes_prevalence_compare failed: ${error.message}`);
}

await mergeSourceManifest("gbd", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} GBD-burden artifacts; ${failures.length} failure(s).`);
