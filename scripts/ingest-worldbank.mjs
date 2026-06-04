import { loadEnv } from "./env.mjs";
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { worldBankIndicators } from "./registry/v1-indicators.mjs";

loadEnv();
const fetchedAt = new Date().toISOString();

function artifactName(indicator) {
  return `worldbank.IN.${indicator.sourceIndicatorId.replaceAll(".", "_")}.json`;
}

async function fetchIndicator(indicator) {
  const url = `https://api.worldbank.org/v2/country/IN/indicator/${indicator.sourceIndicatorId}?format=json&per_page=20000`;
  const raw = await fetchJson(url);
  const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
  const observations = rows
    .map((row) => ({
      date: String(row.date),
      value: row.value === null || row.value === undefined ? null : Number(row.value)
    }))
    .filter((row) => row.date && row.date >= "1960")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!observations.some((row) => Number.isFinite(row.value))) {
    throw new Error(`No finite observations returned for ${indicator.sourceIndicatorId}`);
  }

  return {
    raw,
    artifact: createSeriesArtifact({
      indicatorId: indicator.id,
      title: indicator.title,
      sourceId: "worldbank",
      sourceIndicatorId: indicator.sourceIndicatorId,
      sourceUrl: url,
      unit: indicator.unit,
      frequency: indicator.frequency,
      geography: {
        type: "country",
        id: "IN",
        name: "India"
      },
      fetchedAt,
      observations
    })
  };
}

const manifest = [];
const failures = [];

for (const indicator of worldBankIndicators) {
  try {
    const result = await fetchIndicator(indicator);
    const file = artifactName(indicator);
    const artifact = await writeSeriesArtifact({ sourceId: "worldbank", name: file.replace(/\.json$/, ""), artifact: result.artifact });
    const snapshot = await writeSnapshot("worldbank", indicator.sourceIndicatorId, result.raw);
    manifest.push({
      status: "ready",
      indicatorId: indicator.id,
      sourceIndicatorId: indicator.sourceIndicatorId,
      artifact,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      fetchedAt,
      observations: result.artifact.observations.length
    });
    console.log(`worldbank ${sourceSlug(indicator.id)} ${result.artifact.observations.length} observations`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: indicator.id,
      sourceIndicatorId: indicator.sourceIndicatorId,
      fetchedAt,
      error: error.message
    });
    console.warn(`worldbank ${sourceSlug(indicator.id)} failed: ${error.message}`);
  }
}

await writeSourceManifest("worldbank", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} World Bank series artifacts; ${failures.length} failure(s).`);
