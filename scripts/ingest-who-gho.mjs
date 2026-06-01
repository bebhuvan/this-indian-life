import { fetchWhoIndicatorForIndia } from "./adapters/who-gho.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { whoIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of whoIndicators) {
  try {
    const raw = await fetchWhoIndicatorForIndia(item.indicatorCode);
    const rows = Array.isArray(raw?.value) ? raw.value : [];
    const snapshot = await writeSnapshot("who-gho", `${item.indicatorCode}.IND`, raw);
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "who-gho",
      sourceIndicatorId: item.indicatorCode,
      sourceUrl: "https://www.who.int/data/gho/info/gho-odata-api",
      unit: item.unit,
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: { spatialDim: "IND" }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "who-gho",
      name: `who-gho.IN.${item.indicatorCode}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: item.indicatorCode,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`who-gho ${item.indicatorCode} ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: item.indicatorCode,
      fetchedAt,
      error: error.message
    });
    console.warn(`who-gho ${item.indicatorCode} failed: ${error.message}`);
  }
}

await writeSourceManifest("who-gho", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} WHO GHO artifacts; ${failures.length} failure(s).`);
