// One-off parallel variant of ingest-open-meteo.mjs: fetches all cities concurrently
// (pool of CONCURRENCY) with no inter-city delay, then writes the manifest once.
// Reuses the same artifact-building logic so output is identical to the sequential script.
import { fetchOpenMeteoHistoricalDaily, defaultDailyVariables } from "./adapters/open-meteo.mjs";
import { createSeriesArtifact, createTableArtifact, readJson, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { openMeteoCities, openMeteoDerivedIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const startDate = process.env.OPEN_METEO_START_DATE || "1940-01-01";
const endDate = process.env.OPEN_METEO_END_DATE || isoDateDaysAgo(Number(process.env.OPEN_METEO_DELAY_DAYS || 7));
const model = process.env.OPEN_METEO_MODEL || "era5";
const CONCURRENCY = Number(process.env.OPEN_METEO_CONCURRENCY || 6);
const STAGGER_MS = Number(process.env.OPEN_METEO_STAGGER_MS || 0);
const INITIAL_WAIT_MS = Number(process.env.OPEN_METEO_INITIAL_WAIT_MS || 0);
const cityFilter = new Set(String(process.env.OPEN_METEO_CITY_IDS || "").split(",").map((v) => v.trim()).filter(Boolean));
// Optionally restrict to a lighter variable set to cut Open-Meteo's weighted quota cost.
const dailyVars = String(process.env.OPEN_METEO_DAILY_VARS || "").split(",").map((v) => v.trim()).filter(Boolean);
const VARS = dailyVars.length ? dailyVars : defaultDailyVariables;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function dailyRows(raw) {
  const daily = raw?.daily || {};
  const times = daily.time || [];
  return times.map((date, index) => {
    const row = { date };
    for (const variable of VARS) row[variable] = numberOrNull(daily[variable]?.[index]);
    return row;
  });
}
function groupByYear(rows) {
  const byYear = new Map();
  for (const row of rows) {
    const year = String(row.date || "").slice(0, 4);
    if (!/^\d{4}$/.test(year)) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(row);
  }
  return [...byYear.entries()].sort(([a], [b]) => a.localeCompare(b));
}
function average(values) {
  const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : null;
}
function sum(values) {
  const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  return clean.length ? clean.reduce((s, v) => s + v, 0) : null;
}
function annualObservations(rows, metric) {
  return groupByYear(rows).filter(([, yr]) => yr.length >= 365).map(([year, yr]) => {
    let value = null;
    if (metric === "mean_temperature") value = average(yr.map((r) => r.temperature_2m_mean));
    else if (metric === "very_hot_days") value = yr.filter((r) => typeof r.temperature_2m_max === "number" && r.temperature_2m_max >= 35).length;
    else if (metric === "hot_nights") value = yr.filter((r) => typeof r.temperature_2m_min === "number" && r.temperature_2m_min >= 28).length;
    else if (metric === "precipitation_sum") value = sum(yr.map((r) => r.precipitation_sum));
    else if (metric === "rainy_days") value = yr.filter((r) => typeof r.precipitation_sum === "number" && r.precipitation_sum >= 1).length;
    else if (metric === "mean_apparent_temperature") value = average(yr.map((r) => r.apparent_temperature_mean));
    else if (metric === "humid_heat_days") value = yr.filter((r) => typeof r.apparent_temperature_max === "number" && r.apparent_temperature_max >= 40).length;
    return { date: year, value };
  }).filter((r) => r.value !== null);
}
function geographyFor(city) {
  return { type: "city", id: city.id, name: city.name, latitude: city.latitude, longitude: city.longitude };
}

async function processCity(city) {
  const local = [];
  const raw = await fetchOpenMeteoHistoricalDaily({ latitude: city.latitude, longitude: city.longitude, startDate, endDate, daily: VARS, models: model });
  const rows = dailyRows(raw);
  const snapshot = await writeSnapshot("open-meteo", `${city.id}.${model}.daily.${startDate}.${endDate}`, raw);
  const dailyArtifact = createTableArtifact({
    indicatorId: `climate.openmeteo.${city.id}.daily`, title: `${city.name} historical daily weather`,
    sourceId: "open-meteo", sourceIndicatorId: `${city.id}.${model}.daily`,
    sourceUrl: "https://open-meteo.com/en/docs/historical-weather-api", unit: "daily weather",
    geography: geographyFor(city), fetchedAt, rows, dimensions: Object.keys(rows[0] || {}),
    metadata: { model, startDate, endDate, requestedDailyVariables: defaultDailyVariables, units: raw?.daily_units || {}, timezone: raw?.timezone, utcOffsetSeconds: raw?.utc_offset_seconds, sourceLatitude: raw?.latitude, sourceLongitude: raw?.longitude, elevation: raw?.elevation }
  });
  const dailyPath = await writeSeriesArtifact({ sourceId: "open-meteo", name: `open-meteo.IN.${city.id}.daily`, artifact: dailyArtifact });
  local.push({ status: "ready", indicatorId: dailyArtifact.indicatorId, sourceIndicatorId: dailyArtifact.sourceIndicatorId, artifact: dailyPath, snapshot: snapshot.path, rawHash: snapshot.hash, rows: rows.length, fetchedAt });
  for (const item of openMeteoDerivedIndicators) {
    const observations = annualObservations(rows, item.metric);
    const artifact = createSeriesArtifact({
      indicatorId: `climate.openmeteo.${city.id}.${item.metric}`, title: `${city.name} ${item.titleSuffix}`,
      sourceId: "open-meteo", sourceIndicatorId: `${city.id}.${model}.${item.metric}`,
      sourceUrl: "https://open-meteo.com/en/docs/historical-weather-api", unit: item.unit, frequency: "annual",
      geography: geographyFor(city), fetchedAt, observations, dimensions: ["date", "value"],
      metadata: { model, startDate, endDate, derivedFrom: dailyArtifact.indicatorId, calculation: item.calculation, threshold: item.threshold || null }
    });
    const artifactPath = await writeSeriesArtifact({ sourceId: "open-meteo", name: `open-meteo.IN.${city.id}.${item.metric}`, artifact });
    local.push({ status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: artifact.sourceIndicatorId, artifact: artifactPath, snapshot: snapshot.path, rawHash: snapshot.hash, rows: observations.length, fetchedAt });
  }
  console.log(`done ${city.id} (${rows.length} daily rows)`);
  return local;
}

const manifest = [];
const failures = [];
const targets = cityFilter.size ? openMeteoCities.filter((c) => cityFilter.has(c.id)) : [...openMeteoCities];
const queue = [...targets];
if (INITIAL_WAIT_MS > 0) { console.log(`waiting ${INITIAL_WAIT_MS}ms before start...`); await wait(INITIAL_WAIT_MS); }
async function worker(slot) {
  if (STAGGER_MS > 0) await wait(slot * STAGGER_MS);
  while (queue.length) {
    const city = queue.shift();
    try { manifest.push(...await processCity(city)); }
    catch (error) { failures.push({ status: "failed", indicatorId: `climate.openmeteo.${city.id}.daily`, sourceIndicatorId: `${city.id}.${model}.daily`, fetchedAt, error: error.message }); console.warn(`FAILED ${city.id}: ${error.message}`); }
    if (STAGGER_MS > 0 && queue.length) await wait(STAGGER_MS);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
// Merge with existing manifest so cities not fetched this run are preserved.
let out = [...manifest, ...failures];
if (cityFilter.size) {
  try {
    const existing = await readJson("data/catalog/open-meteo-manifest.json");
    const keep = existing.filter((e) => !cityFilter.has(String(e.sourceIndicatorId || "").split(".")[0]));
    out = [...keep, ...out];
  } catch {}
}
await writeSourceManifest("open-meteo", out);
console.log(`Wrote ${manifest.length} artifacts; ${failures.length} failure(s).`);
