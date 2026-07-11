import { fetchClimateWatchHistoricalEmissions } from "./adapters/climatewatch.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { climateWatchMethaneSectors } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://www.climatewatchdata.org/";

const manifest = [];
const failures = [];

for (const item of climateWatchMethaneSectors) {
  try {
    const raw = await fetchClimateWatchHistoricalEmissions({ region: "IND", gas: "CH4", sector: item.sector });
    const record = (raw?.data || []).find((entry) => entry.sector === item.sector && entry.gas === "CH4");
    if (!record) throw new Error(`No CH4 record found for sector "${item.sector}"`);

    const snapshot = await writeSnapshot("climatewatch", `historical-emissions.ch4.${item.sector}.IND`, raw);
    const observations = record.emissions
      .filter((point) => point.value !== null && point.value !== undefined)
      .map((point) => ({ date: String(point.year), value: point.value }));

    const artifact = createSeriesArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "climatewatch",
      sourceIndicatorId: `historical_emissions/CH4/${item.sector}`,
      sourceUrl,
      unit: record.unit || "MtCO2e",
      frequency: "annual",
      fetchedAt,
      observations,
      metadata: { sector: item.sector, gas: "CH4", dataSource: record.data_source }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "climatewatch",
      name: `climatewatch.IN.methane.${item.sector.toLowerCase().replace(/[^a-z]+/g, "_")}.annual`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: `historical_emissions/CH4/${item.sector}`,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: observations.length,
      fetchedAt
    });
    console.log(`climatewatch methane ${item.sector} ${observations.length} points`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: `historical_emissions/CH4/${item.sector}`,
      fetchedAt,
      error: error.message
    });
    console.warn(`climatewatch methane ${item.sector} failed: ${error.message}`);
  }
}

await writeSourceManifest("climatewatch", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} Climate Watch methane artifacts; ${failures.length} failure(s).`);
