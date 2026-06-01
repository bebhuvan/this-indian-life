import { fetchOwidCsv, fetchOwidMetadata } from "./adapters/owid.mjs";
import { parseCsv } from "./core/csv.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { owidGrapherDatasets } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of owidGrapherDatasets) {
  try {
    const [metadata, csv] = await Promise.all([
      fetchOwidMetadata(item.slug),
      fetchOwidCsv(item.slug)
    ]);
    const rows = parseCsv(csv).filter((row) => row.Entity === "India" || row.Code === "IND");
    const snapshot = await writeSnapshot("owid", `${item.slug}.metadata-and-india-rows`, { metadata, rows });
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "owid",
      sourceIndicatorId: item.slug,
      sourceUrl: `https://ourworldindata.org/grapher/${item.slug}`,
      unit: item.unit,
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        chartTitle: metadata?.chart?.title || metadata?.title,
        grapherSlug: item.slug
      }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "owid",
      name: `owid.IN.${item.slug}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: item.slug,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`owid ${item.slug} ${rows.length} India rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: item.slug,
      fetchedAt,
      error: error.message
    });
    console.warn(`owid ${item.slug} failed: ${error.message}`);
  }
}

await writeSourceManifest("owid", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} OWID artifacts; ${failures.length} failure(s).`);
