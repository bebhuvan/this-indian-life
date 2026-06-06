import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const ENSO_IMD_ARTIFACT = "data/series/derived.IN.climate.enso_imd_monsoon_join.json";
const DMI_ARTIFACT = "data/series/noaa-iod.global.dmi_monthly.json";
const fetchedAt = new Date().toISOString();

const WINDOWS = {
  dmi_jun_sep_mean_c: [6, 7, 8, 9],
  dmi_jul_sep_mean_c: [7, 8, 9],
  dmi_aug_oct_mean_c: [8, 9, 10],
  dmi_sep_nov_mean_c: [9, 10, 11]
};

function mean(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2));
}

function iodPhase(value) {
  if (value === null || value === undefined) return null;
  if (value >= 0.4) return "Positive IOD";
  if (value <= -0.4) return "Negative IOD";
  return "Neutral";
}

const [ensoImd, dmi] = await Promise.all([
  readFile(ENSO_IMD_ARTIFACT, "utf8").then(JSON.parse),
  readFile(DMI_ARTIFACT, "utf8").then(JSON.parse)
]);

const dmiByYear = new Map();
for (const row of dmi.rows || []) {
  if (!dmiByYear.has(row.year)) dmiByYear.set(row.year, new Map());
  dmiByYear.get(row.year).set(row.month, row.dmi_anomaly_c);
}

const rows = ensoImd.rows.map((row) => {
  const months = dmiByYear.get(row.year) || new Map();
  const metrics = {};
  for (const [field, windowMonths] of Object.entries(WINDOWS)) {
    const value = mean(windowMonths.map((month) => months.get(month)));
    metrics[field] = value;
    metrics[`${field.replace("_mean_c", "")}_phase`] = iodPhase(value);
  }
  return { ...row, ...metrics };
});

const snapshot = await writeSnapshot("enso-iod-imd-monsoon", "derived.noaa_oni.noaa_dmi.imd_monsoon", {
  inputs: [ENSO_IMD_ARTIFACT, DMI_ARTIFACT],
  rows
});

const artifact = createTableArtifact({
  indicatorId: "climate.enso_iod.imd_monsoon_join",
  title: "ENSO, Indian Ocean Dipole, and IMD June-September rainfall by region",
  sourceId: "derived",
  sourceIndicatorId: "noaa-enso.oni + noaa-iod.dmi + imd.monsoon_rainfall_regions",
  sourceUrl: "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt; https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data; https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html",
  unit: "degrees C anomaly, mm, percent departure",
  geography: { type: "region-set", id: "imd_homogeneous_regions", name: "India and IMD homogeneous rainfall regions" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    inputs: [ENSO_IMD_ARTIFACT, DMI_ARTIFACT],
    dmiWindows: WINDOWS,
    note: "This join adds Indian Ocean Dipole screening variables to the ENSO-rainfall panel. DMI phase labels use simple +/-0.4 C thresholds and are for article context."
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "derived",
  name: "derived.IN.climate.enso_iod_imd_monsoon_join",
  artifact
});

await writeSourceManifest("enso-iod-imd-monsoon", [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  snapshot: snapshot.path,
  rawHash: snapshot.hash,
  rows: rows.length,
  earliestYear: Math.min(...rows.map((row) => row.year)),
  latestYear: Math.max(...rows.map((row) => row.year)),
  fetchedAt
}]);

console.log(`derived ENSO-IOD-IMD monsoon join ${rows.length} rows (${Math.min(...rows.map((row) => row.year))}-${Math.max(...rows.map((row) => row.year))})`);
