import { fetchDataCommonsSeries } from "./adapters/datacommons.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { dataCommonsIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of dataCommonsIndicators) {
  try {
    const result = await fetchDataCommonsSeries(item.variable);
    if (!result || !result.observations.length) {
      failures.push({ status: "empty", indicatorId: item.id, sourceIndicatorId: item.variable, fetchedAt, error: "no India observations" });
      console.warn(`datacommons ${item.variable} returned no India data`);
      continue;
    }
    const snapshot = await writeSnapshot("datacommons", `${item.variable}.IND`, result);
    const artifact = createSeriesArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "datacommons",
      sourceIndicatorId: item.variable,
      sourceUrl: result.facet.provenanceUrl || "https://datacommons.org",
      unit: item.unit || result.facet.unit || "",
      fetchedAt,
      observations: result.observations,
      metadata: { facet: result.facet }
    });
    const path = await writeSeriesArtifact({ sourceId: "datacommons", name: `datacommons.IN.${item.variable}`, artifact });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: item.variable,
      artifact: path,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      observations: result.observations.length,
      source: result.facet.importName,
      latest: result.observations.at(-1),
      fetchedAt
    });
    console.log(`datacommons ${item.variable} ${result.observations.length} obs [${result.facet.importName}] latest ${result.observations.at(-1)?.date}`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: item.id, sourceIndicatorId: item.variable, fetchedAt, error: error.message });
    console.warn(`datacommons ${item.variable} failed: ${error.message}`);
  }
}

await writeSourceManifest("datacommons", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} Data Commons artifact(s); ${failures.length} skipped/failed.`);
