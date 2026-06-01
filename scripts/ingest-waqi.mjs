import { fetchWaqiCity } from "./adapters/waqi.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { waqiCities } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of waqiCities) {
  try {
    const raw = await fetchWaqiCity(item.city);
    const rows = raw?.data ? [{ ...raw.data, fetchedAt }] : [];
    const snapshot = await writeSnapshot("waqi", `${item.city}.feed`, raw);
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "waqi",
      sourceIndicatorId: item.city,
      sourceUrl: "https://aqicn.org/json-api/doc/",
      unit: item.unit,
      geography: {
        type: "city",
        id: item.city,
        name: item.city
      },
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: { status: raw?.status }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "waqi",
      name: `waqi.IN.${item.city}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: item.city,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`waqi ${item.city} ${rows.length} row(s)`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: item.city,
      fetchedAt,
      error: error.message
    });
    console.warn(`waqi ${item.city} failed: ${error.message}`);
  }
}

await writeSourceManifest("waqi", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} WAQI artifacts; ${failures.length} failure(s).`);
