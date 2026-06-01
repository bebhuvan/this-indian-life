import { fetchAllUnPopulationIndiaData } from "./adapters/un-population.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { unPopulationIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();

const manifest = [];
const failures = [];

for (const item of unPopulationIndicators) {
  try {
    const raw = await fetchAllUnPopulationIndiaData({
      indicator: item.indicator,
      start: item.start,
      end: item.end
    });
    const snapshot = await writeSnapshot("un-population", `indicator-${item.indicator}.IND.${item.start}-${item.end}`, raw);
    const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : Array.isArray(raw?.value) ? raw.value : [];
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "un-population",
      sourceIndicatorId: item.indicator,
      sourceUrl: "https://population.un.org/dataportalapi/index.html",
      unit: item.unit,
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: { start: item.start, end: item.end, location: 356 }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "un-population",
      name: `un-population.IN.indicator-${item.indicator}.${item.start}-${item.end}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: item.indicator,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`un-population indicator-${item.indicator} ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: item.indicator,
      fetchedAt,
      error: error.message
    });
    console.warn(`un-population indicator-${item.indicator} failed: ${error.message}`);
  }
}

await writeSourceManifest("un-population", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} UN Population artifact(s); ${failures.length} failure(s).`);
