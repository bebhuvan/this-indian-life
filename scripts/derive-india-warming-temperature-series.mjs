import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const baselineStart = 1991;
const baselineEnd = 2020;

function num(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function yearFrom(value) {
  const match = String(value || "").match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function monthFrom(value) {
  const match = String(value || "").match(/^\d{4}-(\d{2})/);
  return match ? Number(match[1]) : null;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function observationPoints(artifact) {
  return (artifact.observations || [])
    .map((row) => ({ year: yearFrom(row.date), value: num(row.value) }))
    .filter((row) => row.year && row.value !== null)
    .sort((a, b) => a.year - b.year);
}

function owidAnnualPoints(artifact) {
  return (artifact.rows || [])
    .map((row) => ({ year: yearFrom(row.Year), value: num(row["Temperature anomaly"]) }))
    .filter((row) => row.year && row.value !== null)
    .sort((a, b) => a.year - b.year);
}

function baseline(points) {
  const values = points
    .filter((point) => point.year >= baselineStart && point.year <= baselineEnd)
    .map((point) => point.value);
  if (!values.length) throw new Error(`No ${baselineStart}-${baselineEnd} baseline values`);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rebase(points) {
  const b = baseline(points);
  return points.map((point) => ({ date: String(point.year), value: Number((point.value - b).toFixed(3)) }));
}

function monthlyRows(artifact) {
  return (artifact.rows || [])
    .map((row) => ({
      year: yearFrom(row.Day),
      month: monthFrom(row.Day),
      value: num(row["Monthly average"])
    }))
    .filter((row) => row.year && row.month && row.value !== null)
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

const seasons = [
  { id: "winter", label: "Winter", months: [1, 2] },
  { id: "pre_monsoon", label: "Pre-monsoon", months: [3, 4, 5] },
  { id: "southwest_monsoon", label: "Southwest monsoon", months: [6, 7, 8, 9] },
  { id: "post_monsoon", label: "Post-monsoon", months: [10, 11, 12] }
];

function seasonalMeans(rows, season) {
  const byYear = new Map();
  for (const row of rows) {
    if (!season.months.includes(row.month)) continue;
    if (!byYear.has(row.year)) byYear.set(row.year, []);
    byYear.get(row.year).push(row.value);
  }
  return [...byYear.entries()]
    .filter(([, values]) => values.length === season.months.length)
    .map(([year, values]) => ({ year, value: values.reduce((sum, value) => sum + value, 0) / values.length }))
    .sort((a, b) => a.year - b.year);
}

function decadeFor(year) {
  return `${Math.floor(year / 10) * 10}s`;
}

function decadeRowsBySeason(seasonalAnomalies) {
  const rows = [];
  for (const [seasonId, payload] of Object.entries(seasonalAnomalies)) {
    const byDecade = new Map();
    for (const point of payload.points) {
      const year = yearFrom(point.date);
      if (!year) continue;
      const decade = decadeFor(year);
      if (!byDecade.has(decade)) byDecade.set(decade, []);
      byDecade.get(decade).push(point.value);
    }
    for (const [decade, values] of byDecade) {
      if (values.length < 5) continue;
      rows.push({
        season: payload.label,
        seasonId,
        decade,
        years: values.length,
        value: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3)),
        unit: "°C above/below seasonal normal"
      });
    }
  }
  return rows.sort((a, b) => a.seasonId.localeCompare(b.seasonId) || a.decade.localeCompare(b.decade));
}

const owidAnnual = await readJson("data/series/owid.IN.annual-temperature-anomalies.json");
const owidMonthly = await readJson("data/series/owid.IN.average-monthly-surface-temperature.json");
const era5Annual = await readJson("data/series/era5.IN.climate.era5.region.all_india.temp_anomaly_1991_2020.json");
const berkeleyAbs = await readJson("data/series/berkeley.IN.climate.berkeley.temp_abs.json");

const outputs = [];

const derivedSeries = [
  {
    indicatorId: "climate.derived.temp_anomaly_owid_1991_2020",
    title: "India temperature anomaly, OWID/Copernicus",
    sourceId: "owid",
    sourceIndicatorId: "annual-temperature-anomalies",
    sourceUrl: owidAnnual.sourceUrl,
    observations: owidAnnualPoints(owidAnnual).map((point) => ({ date: String(point.year), value: Number(point.value.toFixed(3)) })),
    metadata: {
      method: "Copied OWID's India annual anomaly series, which is already expressed relative to 1991-2020."
    }
  },
  {
    indicatorId: "climate.derived.temp_anomaly_era5_1991_2020",
    title: "India temperature anomaly, ERA5 rebased",
    sourceId: "era5-derived",
    sourceIndicatorId: "2m_temperature-all-india-anomaly-1991-2020",
    sourceUrl: era5Annual.sourceUrl,
    observations: observationPoints(era5Annual).map((point) => ({ date: String(point.year), value: Number(point.value.toFixed(3)) })),
    metadata: {
      method: "Copied the existing India-masked ERA5 all-India annual temperature-anomaly series, which is already expressed relative to 1991-2020."
    }
  },
  {
    indicatorId: "climate.derived.temp_anomaly_berkeley_1991_2020",
    title: "India temperature anomaly, Berkeley Earth rebased",
    sourceId: "berkeley-derived",
    sourceIndicatorId: "india-TAVG-absolute-rebased-1991-2020",
    sourceUrl: berkeleyAbs.sourceUrl,
    observations: rebase(observationPoints(berkeleyAbs)),
    metadata: {
      method: "Subtracted the 1991-2020 mean of Berkeley Earth's India absolute annual temperature series from each annual value."
    }
  }
];

for (const item of derivedSeries) {
  const artifact = createSeriesArtifact({
    indicatorId: item.indicatorId,
    title: item.title,
    sourceId: item.sourceId,
    sourceIndicatorId: item.sourceIndicatorId,
    sourceUrl: item.sourceUrl,
    unit: "°C above/below normal",
    frequency: "annual",
    fetchedAt,
    observations: item.observations,
    metadata: {
      baseline: `${baselineStart}-${baselineEnd}`,
      caveat: "Use for source comparison. Do not mix absolute-temperature levels across datasets.",
      ...item.metadata
    }
  });
  const artifactPath = await writeSeriesArtifact({
    sourceId: item.sourceId,
    name: `${item.sourceId}.IN.${item.indicatorId}`,
    artifact
  });
  outputs.push({ indicatorId: item.indicatorId, artifactPath, rows: item.observations.length });
}

const monthly = monthlyRows(owidMonthly);
const seasonalAnomalies = {};
for (const season of seasons) {
  const means = seasonalMeans(monthly, season);
  const points = rebase(means);
  seasonalAnomalies[season.id] = { label: season.label, points };
  const artifact = createSeriesArtifact({
    indicatorId: `climate.derived.seasonal_temp_anomaly_${season.id}`,
    title: `India ${season.label.toLowerCase()} temperature anomaly`,
    sourceId: "owid-derived",
    sourceIndicatorId: `average-monthly-surface-temperature-${season.id}-rebased-1991-2020`,
    sourceUrl: owidMonthly.sourceUrl,
    unit: "°C above/below seasonal normal",
    frequency: "annual",
    fetchedAt,
    observations: points,
    metadata: {
      baseline: `${baselineStart}-${baselineEnd}`,
      months: season.months,
      method: `Averaged OWID monthly India surface temperatures for ${season.label} months, then subtracted the ${baselineStart}-${baselineEnd} mean for that season. Years with incomplete season months are excluded.`
    }
  });
  const artifactPath = await writeSeriesArtifact({
    sourceId: "owid-derived",
    name: `owid-derived.IN.climate.derived.seasonal_temp_anomaly_${season.id}`,
    artifact
  });
  outputs.push({ indicatorId: artifact.indicatorId, artifactPath, rows: points.length });
}

const decadeRows = decadeRowsBySeason(seasonalAnomalies);
const decadeArtifact = createTableArtifact({
  indicatorId: "climate.derived.seasonal_temp_anomaly_decades",
  title: "India seasonal temperature anomalies by decade",
  sourceId: "owid-derived",
  sourceIndicatorId: "average-monthly-surface-temperature-season-decade-anomalies",
  sourceUrl: owidMonthly.sourceUrl,
  unit: "°C above/below seasonal normal",
  fetchedAt,
  rows: decadeRows,
  dimensions: [
    { id: "season", label: "Season" },
    { id: "decade", label: "Decade" }
  ],
  metadata: {
    baseline: `${baselineStart}-${baselineEnd}`,
    method: "Computed season-level anomalies from OWID monthly India surface temperatures, then averaged each season within each decade. Partial decades with fewer than five annual observations are excluded."
  }
});
const decadePath = await writeSeriesArtifact({
  sourceId: "owid-derived",
  name: "owid-derived.IN.climate.derived.seasonal_temp_anomaly_decades",
  artifact: decadeArtifact
});
outputs.push({ indicatorId: decadeArtifact.indicatorId, artifactPath: decadePath, rows: decadeRows.length });

await writeSourceManifest("india-warming-derived-temperature", outputs.map((output) => ({
  ...output,
  fetchedAt,
  sourceUrls: [owidAnnual.sourceUrl, owidMonthly.sourceUrl, era5Annual.sourceUrl, berkeleyAbs.sourceUrl]
})));

console.log(JSON.stringify({ outputs }, null, 2));
