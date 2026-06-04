import { fetchBerkeleyRegion } from "./adapters/berkeley-earth.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { berkeleyIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of berkeleyIndicators) {
  try {
    const result = await fetchBerkeleyRegion(item.region, item.metric);
    const snapshot = await writeSnapshot("berkeley", `${item.region}.${item.metric}`, {
      url: result.url,
      baselineAbsolute: result.baselineAbsolute,
      baselinePeriod: result.baselinePeriod,
      anomaly: result.anomaly,
      absolute: result.absolute
    });

    const variants = [
      { spec: item.anomaly, observations: result.anomaly, kind: "anomaly" },
      { spec: item.absolute, observations: result.absolute, kind: "absolute" }
    ];
    for (const variant of variants) {
      if (!variant.spec || !variant.observations.length) continue;
      const artifact = createSeriesArtifact({
        indicatorId: variant.spec.id,
        title: variant.spec.title,
        sourceId: "berkeley",
        sourceIndicatorId: `${item.region}-${item.metric}-${variant.kind}`,
        sourceUrl: result.url,
        unit: variant.spec.unit,
        fetchedAt,
        observations: variant.observations,
        metadata: {
          region: item.region,
          metric: item.metric,
          baselinePeriod: result.baselinePeriod,
          baselineAbsolute: result.baselineAbsolute,
          note: "Berkeley Earth land-surface temperature; annual mean of full calendar years only."
        }
      });
      const path = await writeSeriesArtifact({ sourceId: "berkeley", name: `berkeley.IN.${variant.spec.id}`, artifact });
      manifest.push({
        status: "ready",
        indicatorId: variant.spec.id,
        sourceIndicatorId: artifact.sourceIndicatorId,
        artifact: path,
        snapshot: snapshot.path,
        rawHash: snapshot.hash,
        observations: variant.observations.length,
        firstYear: variant.observations[0]?.date,
        latestYear: variant.observations.at(-1)?.date,
        fetchedAt
      });
      console.log(`berkeley ${variant.spec.id} ${variant.observations.length} obs (${variant.observations[0]?.date}-${variant.observations.at(-1)?.date})`);
    }
  } catch (error) {
    failures.push({ status: "failed", region: item.region, metric: item.metric, fetchedAt, error: error.message });
    console.warn(`berkeley ${item.region}/${item.metric} failed: ${error.message}`);
  }
}

await writeSourceManifest("berkeley", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} Berkeley Earth artifact(s); ${failures.length} failure(s).`);
