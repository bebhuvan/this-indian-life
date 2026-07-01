import { fetchClimateTraceCountryEmissions } from "./adapters/climatetrace.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { climateTraceSectors } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const startYear = 2015;
const endYear = 2024;
const sourceUrl = "https://climatetrace.org/";

const manifest = [];
const failures = [];

for (const item of climateTraceSectors) {
  try {
    const rows = [];
    const rawByYear = {};
    for (let year = startYear; year <= endYear; year += 1) {
      const raw = await fetchClimateTraceCountryEmissions({
        country: "IND",
        since: String(year),
        to: String(year),
        sectors: item.sector
      });
      rawByYear[year] = raw;
      const entry = Array.isArray(raw) ? raw[0] : raw;
      const emissions = entry?.emissions || {};
      const worldEmissions = entry?.worldEmissions || {};
      rows.push({
        date: String(year),
        co2_t: emissions.co2 ?? null,
        ch4_t: emissions.ch4 ?? null,
        n2o_t: emissions.n2o ?? null,
        co2e_100yr_t: emissions.co2e_100yr ?? null,
        co2e_20yr_t: emissions.co2e_20yr ?? null,
        world_co2_t: worldEmissions.co2 ?? null,
        world_ch4_t: worldEmissions.ch4 ?? null,
        world_n2o_t: worldEmissions.n2o ?? null,
        world_co2e_100yr_t: worldEmissions.co2e_100yr ?? null,
        world_co2e_20yr_t: worldEmissions.co2e_20yr ?? null,
        rank: entry?.rank ?? null
      });
    }

    const snapshot = await writeSnapshot("climatetrace", `country-emissions.${item.sector || "total"}.IND`, rawByYear);
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "climatetrace",
      sourceIndicatorId: `country/emissions/${item.sector || "total"}`,
      sourceUrl,
      unit: "tonnes",
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: { sector: item.sector || "total", since: startYear, to: endYear }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "climatetrace",
      name: `climatetrace.IN.emissions.${item.sector ? item.sector.replace(/-/g, "_") : "total"}.annual`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: `country/emissions/${item.sector || "total"}`,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`climatetrace country ${item.sector || "total"} ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: `country/emissions/${item.sector || "total"}`,
      fetchedAt,
      error: error.message
    });
    console.warn(`climatetrace country ${item.sector || "total"} failed: ${error.message}`);
  }
}

await writeSourceManifest("climatetrace-country", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} Climate TRACE country artifacts; ${failures.length} failure(s).`);
