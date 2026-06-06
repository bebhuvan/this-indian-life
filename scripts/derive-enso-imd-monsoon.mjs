import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const ONI_ARTIFACT = "data/series/noaa-enso.global.oni_seasonal.json";
const IMD_ARTIFACT = "data/series/imd.IN.climate.imd.monsoon_rainfall_regions.json";
const fetchedAt = new Date().toISOString();

const seasonOrder = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"];
const monsoonSeasons = new Set(["MJJ", "JJA", "JAS", "ASO"]);

function phaseFor(anomaly) {
  if (anomaly >= 0.5) return "El Nino";
  if (anomaly <= -0.5) return "La Nina";
  return "Neutral";
}

function mean(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2));
}

function maxAbs(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), valid[0]);
}

function markOfficialRuns(rows) {
  const sorted = [...rows].sort((a, b) => a.year - b.year || seasonOrder.indexOf(a.season) - seasonOrder.indexOf(b.season));
  let run = [];
  const flush = () => {
    if (run.length >= 5) {
      for (const item of run) item.official_event_phase = item.phase;
    }
    run = [];
  };

  for (const row of sorted) {
    if (row.phase === "Neutral") {
      flush();
      row.official_event_phase = "Neutral";
      continue;
    }
    if (run.length && run[0].phase !== row.phase) flush();
    run.push(row);
    row.official_event_phase = "Neutral";
  }
  flush();
  return sorted;
}

const [oniArtifact, imdArtifact] = await Promise.all([
  readFile(ONI_ARTIFACT, "utf8").then(JSON.parse),
  readFile(IMD_ARTIFACT, "utf8").then(JSON.parse)
]);

const oniRows = markOfficialRuns(oniArtifact.rows.map((row) => ({ ...row })));
const oniByYear = new Map();
for (const row of oniRows) {
  if (!monsoonSeasons.has(row.season)) continue;
  if (!oniByYear.has(row.year)) oniByYear.set(row.year, []);
  oniByYear.get(row.year).push(row);
}

const rows = imdArtifact.rows
  .filter((rain) => rain.year >= 1950)
  .map((rain) => {
    const seasons = oniByYear.get(rain.year) || [];
    const anomalies = seasons.map((row) => row.oni_anomaly_c);
    const meanAnomaly = mean(anomalies);
    const strongestAnomaly = maxAbs(anomalies);
    const officialPhases = [...new Set(seasons.map((row) => row.official_event_phase).filter((phase) => phase && phase !== "Neutral"))];
    return {
      year: rain.year,
      region_id: rain.region_id,
      region: rain.region,
      actual_jun_sep_mm: rain.actual_jun_sep_mm,
      departure_jun_sep_pct: rain.departure_jun_sep_pct,
      oni_monsoon_mean_c: meanAnomaly,
      oni_monsoon_strongest_c: strongestAnomaly === null ? null : Number(strongestAnomaly.toFixed(2)),
      oni_monsoon_phase_by_mean: meanAnomaly === null ? null : phaseFor(meanAnomaly),
      official_enso_active_during_monsoon: officialPhases.length ? officialPhases.join("; ") : "Neutral",
      oni_seasons_used: seasons.map((row) => row.season).join(",")
    };
  });

const snapshot = await writeSnapshot("enso-imd-monsoon", "derived.noaa_oni.imd_monsoon", {
  inputs: [ONI_ARTIFACT, IMD_ARTIFACT],
  rows
});

const artifact = createTableArtifact({
  indicatorId: "climate.enso.imd_monsoon_join",
  title: "ENSO and IMD June-September rainfall by region",
  sourceId: "derived",
  sourceIndicatorId: "noaa-enso.oni + imd.monsoon_rainfall_regions",
  sourceUrl: "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt; https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html",
  unit: "degrees C anomaly, mm, percent departure",
  geography: { type: "region-set", id: "imd_homogeneous_regions", name: "India and IMD homogeneous rainfall regions" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    inputs: [ONI_ARTIFACT, IMD_ARTIFACT],
    monsoonSeasons: [...monsoonSeasons],
    officialEventRule: "Five or more consecutive overlapping ONI seasons at >= +0.5 C for El Nino or <= -0.5 C for La Nina, marked mechanically from NOAA ONI rows.",
    note: "This join is chart-ready context, not causal attribution. Indian monsoon outcomes also depend on IOD, intraseasonal distribution, circulation, land conditions, and policy response."
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "derived",
  name: "derived.IN.climate.enso_imd_monsoon_join",
  artifact
});

await writeSourceManifest("enso-imd-monsoon", [{
  status: "ready",
  indicatorId: "climate.enso.imd_monsoon_join",
  sourceIndicatorId: "noaa-enso.oni + imd.monsoon_rainfall_regions",
  artifact: artifactPath,
  snapshot: snapshot.path,
  rawHash: snapshot.hash,
  rows: rows.length,
  earliestYear: Math.min(...rows.map((row) => row.year)),
  latestYear: Math.max(...rows.map((row) => row.year)),
  fetchedAt
}]);

console.log(`derived ENSO-IMD monsoon join ${rows.length} rows (${Math.min(...rows.map((row) => row.year))}-${Math.max(...rows.map((row) => row.year))})`);
