import { fetchEmberDataset } from "./adapters/ember.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { emberDatasets } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of emberDatasets) {
  try {
    const raw = await fetchEmberDataset({
      dataset: item.dataset,
      resolution: "yearly",
      entityCode: "IND",
      startDate: item.startDate
    });
    const rows = Array.isArray(raw?.data) ? raw.data : [];
    const snapshot = await writeSnapshot("ember", `${item.dataset}.yearly.IND`, raw);
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "ember",
      sourceIndicatorId: `${item.dataset}/yearly`,
      sourceUrl: "https://api.ember-energy.org/v1/docs",
      unit: item.unit,
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: { resolution: "yearly", entityCode: "IND" }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "ember",
      name: `ember.IN.${item.dataset}.yearly`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: `${item.dataset}/yearly`,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`ember ${item.dataset} ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: `${item.dataset}/yearly`,
      fetchedAt,
      error: error.message
    });
    console.warn(`ember ${item.dataset} failed: ${error.message}`);
  }
}

await writeSourceManifest("ember", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} Ember artifacts; ${failures.length} failure(s).`);
