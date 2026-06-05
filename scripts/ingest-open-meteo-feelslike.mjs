// Lean top-up: fetch ONLY the apparent-temperature variables (feels-like) for cities
// that already have the temperature/precip series, and write only the two derived
// feels-like series. Much lighter per request than the full 7-variable pull, so it
// stays well under Open-Meteo's weighted daily quota. Does NOT touch existing series.
import { fetchOpenMeteoHistoricalDaily } from "./adapters/open-meteo.mjs";
import { createSeriesArtifact, writeSeriesArtifact } from "./core/artifacts.mjs";
import { openMeteoCities, openMeteoDerivedIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const startDate = process.env.OPEN_METEO_START_DATE || "1940-01-01";
const endDate = process.env.OPEN_METEO_END_DATE || isoDateDaysAgo(Number(process.env.OPEN_METEO_DELAY_DAYS || 7));
const model = process.env.OPEN_METEO_MODEL || "era5";
const STAGGER_MS = Number(process.env.OPEN_METEO_STAGGER_MS || 6000);
const cityFilter = new Set(String(process.env.OPEN_METEO_CITY_IDS || "").split(",").map((v) => v.trim()).filter(Boolean));
const APP_VARS = ["apparent_temperature_max", "apparent_temperature_mean"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function isoDateDaysAgo(days) { const d = new Date(); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0, 10); }
function numOrNull(v) { return typeof v === "number" && Number.isFinite(v) ? v : null; }
function groupByYear(times, arr) {
  const byYear = new Map();
  times.forEach((date, i) => {
    const y = String(date || "").slice(0, 4);
    if (!/^\d{4}$/.test(y)) return;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(numOrNull(arr?.[i]));
  });
  return [...byYear.entries()].sort(([a], [b]) => a.localeCompare(b));
}
function avg(vals) { const c = vals.filter((v) => typeof v === "number" && Number.isFinite(v)); return c.length ? c.reduce((s, v) => s + v, 0) / c.length : null; }
const geo = (c) => ({ type: "city", id: c.id, name: c.name, latitude: c.latitude, longitude: c.longitude });
const meta = Object.fromEntries(openMeteoDerivedIndicators.map((d) => [d.metric, d]));

async function processCity(city) {
  const raw = await fetchOpenMeteoHistoricalDaily({ latitude: city.latitude, longitude: city.longitude, startDate, endDate, daily: APP_VARS, models: model });
  const times = raw?.daily?.time || [];
  const meanObs = groupByYear(times, raw.daily.apparent_temperature_mean)
    .filter(([, v]) => v.length >= 365).map(([y, v]) => ({ date: y, value: avg(v) })).filter((o) => o.value !== null);
  const dangerObs = groupByYear(times, raw.daily.apparent_temperature_max)
    .filter(([, v]) => v.length >= 365).map(([y, v]) => ({ date: y, value: v.filter((x) => typeof x === "number" && x >= 40).length }));
  const specs = [
    { metric: "mean_apparent_temperature", observations: meanObs },
    { metric: "humid_heat_days", observations: dangerObs }
  ];
  for (const s of specs) {
    const m = meta[s.metric];
    const artifact = createSeriesArtifact({
      indicatorId: `climate.openmeteo.${city.id}.${s.metric}`, title: `${city.name} ${m.titleSuffix}`,
      sourceId: "open-meteo", sourceIndicatorId: `${city.id}.${model}.${s.metric}`,
      sourceUrl: "https://open-meteo.com/en/docs/historical-weather-api", unit: m.unit, frequency: "annual",
      geography: geo(city), fetchedAt, observations: s.observations, dimensions: ["date", "value"],
      metadata: { model, startDate, endDate, calculation: m.calculation, threshold: m.threshold || null, leanFetch: true }
    });
    await writeSeriesArtifact({ sourceId: "open-meteo", name: `open-meteo.IN.${city.id}.${s.metric}`, artifact });
  }
  console.log(`feels-like ${city.id}: mean ${meanObs.length}yr, danger ${dangerObs.length}yr`);
}

const targets = openMeteoCities.filter((c) => !cityFilter.size || cityFilter.has(c.id));
let ok = 0, fail = 0;
for (const city of targets) {
  try { await processCity(city); ok++; } catch (e) { fail++; console.warn(`FAILED ${city.id}: ${e.message}`); }
  await wait(STAGGER_MS);
}
console.log(`feels-like top-up done: ${ok} ok, ${fail} failed.`);
