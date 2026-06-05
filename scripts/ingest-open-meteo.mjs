import { fetchOpenMeteoHistoricalDaily, defaultDailyVariables } from "./adapters/open-meteo.mjs";
import { createSeriesArtifact, createTableArtifact, readJson, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { openMeteoCities, openMeteoDerivedIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const startDate = process.env.OPEN_METEO_START_DATE || "1940-01-01";
const endDate = process.env.OPEN_METEO_END_DATE || isoDateDaysAgo(Number(process.env.OPEN_METEO_DELAY_DAYS || 7));
const model = process.env.OPEN_METEO_MODEL || "era5";
const cityDelayMs = Number(process.env.OPEN_METEO_CITY_DELAY_MS || 15000);
const cityFilter = new Set(String(process.env.OPEN_METEO_CITY_IDS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean));
const cities = cityFilter.size
  ? openMeteoCities.filter((city) => cityFilter.has(city.id))
  : openMeteoCities;
const manifest = [];
const failures = [];

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
    for (const variable of defaultDailyVariables) {
      row[variable] = numberOrNull(daily[variable]?.[index]);
    }
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
  const clean = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function sum(values) {
  const clean = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((total, value) => total + value, 0);
}

function annualObservations(rows, metric) {
  return groupByYear(rows).filter(([, yearRows]) => yearRows.length >= 365).map(([year, yearRows]) => {
    let value = null;
    if (metric === "mean_temperature") {
      value = average(yearRows.map((row) => row.temperature_2m_mean));
    } else if (metric === "very_hot_days") {
      value = yearRows.filter((row) => typeof row.temperature_2m_max === "number" && row.temperature_2m_max >= 35).length;
    } else if (metric === "hot_nights") {
      value = yearRows.filter((row) => typeof row.temperature_2m_min === "number" && row.temperature_2m_min >= 28).length;
    } else if (metric === "precipitation_sum") {
      value = sum(yearRows.map((row) => row.precipitation_sum));
    } else if (metric === "rainy_days") {
      value = yearRows.filter((row) => typeof row.precipitation_sum === "number" && row.precipitation_sum >= 1).length;
    } else if (metric === "mean_apparent_temperature") {
      value = average(yearRows.map((row) => row.apparent_temperature_mean));
    } else if (metric === "humid_heat_days") {
      value = yearRows.filter((row) => typeof row.apparent_temperature_max === "number" && row.apparent_temperature_max >= 40).length;
    }
    return { date: year, value };
  }).filter((row) => row.value !== null);
}

function geographyFor(city) {
  return {
    type: "city",
    id: city.id,
    name: city.name,
    latitude: city.latitude,
    longitude: city.longitude
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (const [index, city] of cities.entries()) {
  try {
    const raw = await fetchOpenMeteoHistoricalDaily({
      latitude: city.latitude,
      longitude: city.longitude,
      startDate,
      endDate,
      models: model
    });
    const rows = dailyRows(raw);
    const snapshot = await writeSnapshot("open-meteo", `${city.id}.${model}.daily.${startDate}.${endDate}`, raw);
    const dailyArtifact = createTableArtifact({
      indicatorId: `climate.openmeteo.${city.id}.daily`,
      title: `${city.name} historical daily weather`,
      sourceId: "open-meteo",
      sourceIndicatorId: `${city.id}.${model}.daily`,
      sourceUrl: "https://open-meteo.com/en/docs/historical-weather-api",
      unit: "daily weather",
      geography: geographyFor(city),
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        model,
        startDate,
        endDate,
        requestedDailyVariables: defaultDailyVariables,
        units: raw?.daily_units || {},
        timezone: raw?.timezone,
        utcOffsetSeconds: raw?.utc_offset_seconds,
        sourceLatitude: raw?.latitude,
        sourceLongitude: raw?.longitude,
        elevation: raw?.elevation
      }
    });
    const dailyPath = await writeSeriesArtifact({
      sourceId: "open-meteo",
      name: `open-meteo.IN.${city.id}.daily`,
      artifact: dailyArtifact
    });

    manifest.push({
      status: "ready",
      indicatorId: dailyArtifact.indicatorId,
      sourceIndicatorId: dailyArtifact.sourceIndicatorId,
      artifact: dailyPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });

    for (const item of openMeteoDerivedIndicators) {
      const observations = annualObservations(rows, item.metric);
      const artifact = createSeriesArtifact({
        indicatorId: `climate.openmeteo.${city.id}.${item.metric}`,
        title: `${city.name} ${item.titleSuffix}`,
        sourceId: "open-meteo",
        sourceIndicatorId: `${city.id}.${model}.${item.metric}`,
        sourceUrl: "https://open-meteo.com/en/docs/historical-weather-api",
        unit: item.unit,
        frequency: "annual",
        geography: geographyFor(city),
        fetchedAt,
        observations,
        dimensions: ["date", "value"],
        metadata: {
          model,
          startDate,
          endDate,
          derivedFrom: dailyArtifact.indicatorId,
          calculation: item.calculation,
          threshold: item.threshold || null
        }
      });
      const artifactPath = await writeSeriesArtifact({
        sourceId: "open-meteo",
        name: `open-meteo.IN.${city.id}.${item.metric}`,
        artifact
      });
      manifest.push({
        status: "ready",
        indicatorId: artifact.indicatorId,
        sourceIndicatorId: artifact.sourceIndicatorId,
        artifact: artifactPath,
        snapshot: snapshot.path,
        rawHash: snapshot.hash,
        rows: observations.length,
        fetchedAt
      });
    }

    console.log(`open-meteo ${city.id} ${rows.length} daily rows, ${openMeteoDerivedIndicators.length} annual series`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: `climate.openmeteo.${city.id}.daily`,
      sourceIndicatorId: `${city.id}.${model}.daily`,
      fetchedAt,
      error: error.message
    });
    console.warn(`open-meteo ${city.id} failed: ${error.message}`);
  }

  if (cityDelayMs > 0 && index < cities.length - 1) {
    await wait(cityDelayMs);
  }
}

let outputManifest = [...manifest, ...failures];
if (cityFilter.size) {
  try {
    const existing = await readJson("data/catalog/open-meteo-manifest.json");
    const keep = existing.filter((entry) => {
      const cityId = String(entry.sourceIndicatorId || "").split(".")[0];
      return !cityFilter.has(cityId);
    });
    outputManifest = [...keep, ...outputManifest];
  } catch {
    // No previous manifest to merge.
  }
}

await writeSourceManifest("open-meteo", outputManifest);
console.log(`Wrote ${manifest.length} Open-Meteo artifacts; ${failures.length} failure(s).`);
