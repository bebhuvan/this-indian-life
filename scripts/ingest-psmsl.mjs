import { fetchPsmslStation } from "./adapters/psmsl.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { psmslStations } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const station of psmslStations) {
  try {
    const result = await fetchPsmslStation(station.id);
    const snapshot = await writeSnapshot("psmsl", `${station.id}`, { url: result.url, baselineMm: result.baselineMm, observations: result.observations });
    const artifact = createSeriesArtifact({
      indicatorId: station.indicator,
      title: station.title,
      sourceId: "psmsl",
      sourceIndicatorId: `station-${station.id}`,
      sourceUrl: `https://psmsl.org/data/obtaining/stations/${station.id}.php`,
      unit: "mm vs 1961-1990",
      fetchedAt,
      observations: result.observations,
      metadata: { stationId: station.id, city: station.city, baselineMm: result.baselineMm, baselineWindow: result.baselineWindow, note: "Tide-gauge annual mean sea level, rebased to the station's 1961-1990 mean. RLR datum; read the trend, not absolutes." }
    });
    const path = await writeSeriesArtifact({ sourceId: "psmsl", name: `psmsl.IN.${station.indicator}`, artifact });
    manifest.push({ status: "ready", indicatorId: station.indicator, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: result.observations.length, firstYear: result.observations[0]?.date, latestYear: result.observations.at(-1)?.date, fetchedAt });
    console.log(`psmsl ${station.indicator} ${result.observations.length} obs (${result.observations[0]?.date}-${result.observations.at(-1)?.date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: station.indicator, fetchedAt, error: error.message });
    console.warn(`psmsl ${station.indicator} failed: ${error.message}`);
  }
}

await writeSourceManifest("psmsl", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} PSMSL artifact(s); ${failures.length} failure(s).`);
