import { readFile } from "node:fs/promises";
import { fetchJson } from "./lib/source-http.mjs";
import {
  createSeriesArtifact,
  writeSeriesArtifact,
  writeSnapshot,
  writeSourceManifest
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const WB_INDICATOR = "FP.CPI.TOTL.ZG";
const WB_URL = `https://api.worldbank.org/v2/country/IN/indicator/${WB_INDICATOR}?format=json&per_page=20000`;
const MOSPI_CPI = "data/series/mospi.IN.prices.cpi.combined.general.inflation.json";

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function finiteWorldBankObservations(raw) {
  const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
  return rows
    .map((row) => ({
      date: String(row.date),
      value: row.value === null || row.value === undefined ? null : Number(row.value)
    }))
    .filter((row) => /^\d{4}$/.test(row.date) && Number.isFinite(row.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function annualMeansFromMonthly(observations) {
  const byYear = new Map();
  for (const obs of observations || []) {
    if (!obs?.date || !Number.isFinite(obs.value)) continue;
    const year = Number(String(obs.date).slice(0, 4));
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(obs.value);
  }

  return [...byYear.entries()]
    .filter(([, values]) => values.length === 12)
    .sort((a, b) => a[0] - b[0])
    .map(([year, values]) => ({
      date: String(year),
      value: round(values.reduce((sum, value) => sum + value, 0) / values.length)
    }));
}

async function writeSeries({ sourceId, name, indicatorId, title, sourceIndicatorId, sourceUrl, unit, observations, metadata }) {
  const artifact = createSeriesArtifact({
    indicatorId,
    title,
    sourceId,
    sourceIndicatorId,
    sourceUrl,
    unit,
    frequency: "annual",
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    observations,
    metadata
  });
  const path = await writeSeriesArtifact({ sourceId, name, artifact });
  return { artifact, path };
}

const [wbRaw, mospi] = await Promise.all([
  fetchJson(WB_URL),
  readJson(MOSPI_CPI)
]);

const wbSnapshot = await writeSnapshot("worldbank", `worldbank.${WB_INDICATOR}.IN`, {
  url: WB_URL,
  raw: wbRaw
});
const wbObservations = finiteWorldBankObservations(wbRaw);
const wbLastYear = Math.max(...wbObservations.map((row) => Number(row.date)));
const mospiAnnual = annualMeansFromMonthly(mospi.observations);
const spliced = mospiAnnual.filter((row) => Number(row.date) > wbLastYear);
const longObservations = [
  ...wbObservations.map((row) => ({ date: row.date, value: round(row.value) })),
  ...spliced
].sort((a, b) => a.date.localeCompare(b.date));

const manifest = [];

const wbSeries = await writeSeries({
  sourceId: "worldbank",
  name: "worldbank.IN.prices.cpi.inflation_annual",
  indicatorId: "prices.cpi.inflation_annual_worldbank",
  title: "India consumer price inflation, annual",
  sourceIndicatorId: WB_INDICATOR,
  sourceUrl: WB_URL,
  unit: "% per year",
  observations: wbObservations.map((row) => ({ date: row.date, value: round(row.value) })),
  metadata: {
    sourceCategory: "Inflation",
    note: "World Bank annual consumer-price inflation. Latest null years in the API response are not written to the series artifact."
  }
});
manifest.push({
  status: "ready",
  indicatorId: wbSeries.artifact.indicatorId,
  sourceIndicatorId: WB_INDICATOR,
  artifact: wbSeries.path,
  snapshot: wbSnapshot.path,
  rawHash: wbSnapshot.hash,
  observations: wbSeries.artifact.observations.length,
  earliest: wbSeries.artifact.observations[0]?.date,
  latest: wbSeries.artifact.observations.at(-1)?.date,
  fetchedAt
});

const longSeries = await writeSeries({
  sourceId: "worldbank",
  name: "worldbank.IN.prices.cpi.headline_annual_long",
  indicatorId: "prices.cpi.headline_annual_long",
  title: "India's consumer price inflation, 1960 to today",
  sourceIndicatorId: `${WB_INDICATOR} + MOSPI monthly CPI splice`,
  sourceUrl: WB_URL,
  unit: "% per year",
  observations: longObservations,
  metadata: {
    derived: `World Bank annual CPI inflation ${wbObservations[0]?.date}-${wbLastYear}; ${spliced.map((row) => row.date).join(", ") || "no"} later full-year point(s) from the annual mean of MoSPI monthly YoY CPI inflation (Combined).`,
    splicedYears: spliced.map((row) => row.date),
    sources: ["worldbank", "mospi"],
    mospiInput: MOSPI_CPI,
    caveat: "Use this as a long annual consumer-inflation backbone. Use MoSPI monthly CPI artifacts for modern official monthly and food-component analysis."
  }
});
manifest.push({
  status: "ready",
  indicatorId: longSeries.artifact.indicatorId,
  sourceIndicatorId: longSeries.artifact.sourceIndicatorId,
  artifact: longSeries.path,
  snapshot: wbSnapshot.path,
  rawHash: wbSnapshot.hash,
  observations: longSeries.artifact.observations.length,
  earliest: longSeries.artifact.observations[0]?.date,
  latest: longSeries.artifact.observations.at(-1)?.date,
  splicedYears: spliced.map((row) => row.date),
  fetchedAt
});

let level = 100;
const baseYear = Number(longObservations[0]?.date);
const levelObservations = [];
const multipleObservations = [];
const purchasingPowerObservations = [];

for (let index = 0; index < longObservations.length; index += 1) {
  const row = longObservations[index];
  if (index > 0) level *= 1 + row.value / 100;
  levelObservations.push({ date: row.date, value: round(level, 1) });
  multipleObservations.push({ date: row.date, value: round(level / 100, 1) });
  purchasingPowerObservations.push({ date: row.date, value: round(100 / (level / 100), 1) });
}

for (const definition of [
  {
    name: "worldbank.IN.prices.cpi.price_level_since_1960",
    indicatorId: "prices.cpi.price_level_since_1960",
    title: `India price level since ${baseYear}`,
    unit: `index (${baseYear}=100)`,
    observations: levelObservations,
    derived: `Cumulative price level from annual inflation, ${baseYear}=100`
  },
  {
    name: "worldbank.IN.prices.cpi.price_multiple_since_1960",
    indicatorId: "prices.cpi.price_multiple_since_1960",
    title: `How many times prices have risen since ${baseYear}`,
    unit: `x (${baseYear}=1)`,
    observations: multipleObservations,
    derived: "Cumulative price level divided by base level"
  },
  {
    name: "worldbank.IN.prices.cpi.purchasing_power_1960",
    indicatorId: "prices.cpi.purchasing_power_1960",
    title: `What Rs 100 from ${baseYear} buys today`,
    unit: `Rs (${baseYear} rupees)`,
    observations: purchasingPowerObservations,
    derived: "100 divided by cumulative price multiple"
  }
]) {
  const result = await writeSeries({
    sourceId: "worldbank",
    name: definition.name,
    indicatorId: definition.indicatorId,
    title: definition.title,
    sourceIndicatorId: longSeries.artifact.sourceIndicatorId,
    sourceUrl: WB_URL,
    unit: definition.unit,
    observations: definition.observations,
    metadata: {
      derived: definition.derived,
      backbone: longSeries.path,
      sources: ["worldbank", "mospi"]
    }
  });
  manifest.push({
    status: "ready",
    indicatorId: result.artifact.indicatorId,
    sourceIndicatorId: result.artifact.sourceIndicatorId,
    artifact: result.path,
    observations: result.artifact.observations.length,
    earliest: result.artifact.observations[0]?.date,
    latest: result.artifact.observations.at(-1)?.date,
    fetchedAt
  });
}

const byDecade = new Map();
for (const row of longObservations) {
  const decade = Math.floor(Number(row.date) / 10) * 10;
  if (!byDecade.has(decade)) byDecade.set(decade, []);
  byDecade.get(decade).push(row.value);
}
const decadeObservations = [...byDecade.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([decade, values]) => ({
    date: `${decade}s`,
    value: round(values.reduce((sum, value) => sum + value, 0) / values.length, 1)
  }));

const decadeSeries = await writeSeries({
  sourceId: "worldbank",
  name: "worldbank.IN.prices.cpi.decade_avg_inflation",
  indicatorId: "prices.cpi.decade_avg_inflation",
  title: "Average inflation by decade",
  sourceIndicatorId: longSeries.artifact.sourceIndicatorId,
  sourceUrl: WB_URL,
  unit: "% per year",
  observations: decadeObservations,
  metadata: {
    derived: "Mean annual CPI inflation by calendar decade",
    backbone: longSeries.path,
    sources: ["worldbank", "mospi"]
  }
});
manifest.push({
  status: "ready",
  indicatorId: decadeSeries.artifact.indicatorId,
  sourceIndicatorId: decadeSeries.artifact.sourceIndicatorId,
  artifact: decadeSeries.path,
  observations: decadeSeries.artifact.observations.length,
  earliest: decadeSeries.artifact.observations[0]?.date,
  latest: decadeSeries.artifact.observations.at(-1)?.date,
  fetchedAt
});

await writeSourceManifest("india-inflation-long", manifest);

console.log(JSON.stringify({
  ok: true,
  worldBankYears: `${wbObservations[0]?.date}-${wbObservations.at(-1)?.date}`,
  longYears: `${longObservations[0]?.date}-${longObservations.at(-1)?.date}`,
  splicedYears: spliced.map((row) => row.date),
  latestInflation: longObservations.at(-1),
  latestPriceMultiple: multipleObservations.at(-1)
}, null, 2));
