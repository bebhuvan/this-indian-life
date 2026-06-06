import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const ONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt";
const fetchedAt = new Date().toISOString();

function phaseFor(anomaly) {
  if (anomaly >= 0.5) return "El Nino";
  if (anomaly <= -0.5) return "La Nina";
  return "Neutral";
}

function strengthFor(anomaly) {
  const abs = Math.abs(anomaly);
  if (abs < 0.5) return "neutral";
  if (abs < 1) return "weak";
  if (abs < 1.5) return "moderate";
  if (abs < 2) return "strong";
  return "very strong";
}

function parseOni(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("SEAS"))
    .map((line) => {
      const [season, year, total, anomaly] = line.split(/\s+/);
      const parsedYear = Number(year);
      const parsedTotal = Number(total);
      const parsedAnomaly = Number(anomaly);
      if (!season || !Number.isFinite(parsedYear) || !Number.isFinite(parsedTotal) || !Number.isFinite(parsedAnomaly)) {
        return null;
      }
      return {
        date: `${parsedYear}-${season}`,
        year: parsedYear,
        season,
        sst_c: parsedTotal,
        oni_anomaly_c: parsedAnomaly,
        phase: phaseFor(parsedAnomaly),
        strength: strengthFor(parsedAnomaly)
      };
    })
    .filter(Boolean);
}

const manifest = [];

try {
  const response = await fetch(ONI_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const rows = parseOni(text);
  if (!rows.length) throw new Error("No ONI rows parsed");

  const snapshot = await writeSnapshot("noaa-enso", "oni.ascii", { sourceUrl: ONI_URL, text });
  const artifact = createTableArtifact({
    indicatorId: "climate.enso.oni",
    title: "Oceanic Nino Index by season",
    sourceId: "noaa-enso",
    sourceIndicatorId: "oni.ascii",
    sourceUrl: ONI_URL,
    unit: "degrees C anomaly",
    geography: { type: "region", id: "nino34", name: "Nino 3.4 region" },
    fetchedAt,
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata: {
      note: "NOAA CPC ONI is a three-month running mean SST anomaly in the Nino 3.4 region. Phase labels here are mechanical threshold tags; official event classification requires persistence and coupled ocean-atmosphere conditions.",
      thresholds: {
        elNino: "oni_anomaly_c >= 0.5",
        laNina: "oni_anomaly_c <= -0.5"
      }
    }
  });
  const artifactPath = await writeSeriesArtifact({
    sourceId: "noaa-enso",
    name: "noaa-enso.global.oni_seasonal",
    artifact
  });

  manifest.push({
    status: "ready",
    indicatorId: "climate.enso.oni",
    sourceIndicatorId: "oni.ascii",
    artifact: artifactPath,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    rows: rows.length,
    earliest: rows[0]?.date,
    latest: rows.at(-1)?.date,
    fetchedAt
  });
  console.log(`noaa-enso ONI ${rows.length} rows (${rows[0]?.date} to ${rows.at(-1)?.date})`);
} catch (error) {
  manifest.push({
    status: "failed",
    indicatorId: "climate.enso.oni",
    sourceIndicatorId: "oni.ascii",
    fetchedAt,
    error: error.message
  });
  console.warn(`noaa-enso ONI failed: ${error.message}`);
}

await writeSourceManifest("noaa-enso", manifest);
