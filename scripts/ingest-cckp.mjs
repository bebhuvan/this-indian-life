import { fetchCckpSeries } from "./adapters/cckp.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { cckpIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of cckpIndicators) {
  try {
    const { url, observations } = await fetchCckpSeries(item);
    if (!observations.length) throw new Error("no observations");
    const snapshot = await writeSnapshot("cckp", `${item.id}`, { url, observations });
    const artifact = createSeriesArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "cckp",
      sourceIndicatorId: `${item.variable}.${item.scenario}.${item.period}`,
      sourceUrl: url,
      unit: item.unit,
      fetchedAt,
      observations,
      metadata: { variable: item.variable, scenario: item.scenario, period: item.period, collection: "cmip6-x0.25 ensemble median" }
    });
    const path = await writeSeriesArtifact({ sourceId: "cckp", name: `cckp.IN.${item.id}`, artifact });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: artifact.sourceIndicatorId,
      artifact: path,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      observations: observations.length,
      latest: observations.at(-1),
      fetchedAt
    });
    console.log(`cckp ${item.id} ${observations.length} obs (${observations[0].date}-${observations.at(-1).date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: item.id, fetchedAt, error: error.message });
    console.warn(`cckp ${item.id} failed: ${error.message}`);
  }
}

await writeSourceManifest("cckp", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} CCKP artifact(s); ${failures.length} failure(s).`);
