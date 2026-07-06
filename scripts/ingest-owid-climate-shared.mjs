import { fetchOwidCsv, fetchOwidMetadata } from "./adapters/owid.mjs";
import { parseCsv } from "./core/csv.mjs";
import { createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const datasets = [
  {
    id: "climate.owid.decadal_temp_anomaly",
    slug: "decadal-temperature-anomaly",
    title: "Decadal temperature anomaly",
    unit: "°C above/below normal"
  },
  {
    id: "climate.owid.monthly_average_temp_by_decade",
    slug: "monthly-average-surface-temperatures-by-decade",
    title: "Monthly average surface temperatures by decade",
    unit: "°C"
  },
  {
    id: "climate.owid.monthly_temp_anomaly_by_decade",
    slug: "monthly-surface-temperature-anomalies-by-decade",
    title: "Monthly surface temperature anomalies by decade",
    unit: "°C above/below normal"
  },
  {
    id: "climate.owid.summer_temp_anomalies",
    slug: "summer-temperature-anomalies",
    title: "Summer temperature anomalies",
    unit: "°C above/below normal"
  },
  {
    id: "climate.owid.warming_fossil_land_use",
    slug: "warming-fossil-fuels-land-use",
    title: "Global warming contribution from India, by source",
    unit: "°C"
  },
  {
    id: "climate.owid.warming_contribution_share",
    slug: "contributions-global-temp-change",
    title: "India's share of contribution to global warming",
    unit: "%"
  },
  {
    id: "climate.owid.climate_belief_serious_threat",
    slug: "share-believe-climate",
    title: "Believes climate change is a serious threat",
    unit: "%"
  }
];

const fetchedAt = new Date().toISOString();
const manifest = [];

for (const item of datasets) {
  const [metadata, csv] = await Promise.all([
    fetchOwidMetadata(item.slug),
    fetchOwidCsv(item.slug)
  ]);
  const rows = parseCsv(csv).filter((row) => row.Entity === "India" || row.Code === "IND");
  if (!rows.length) throw new Error(`No India rows found for OWID grapher ${item.slug}`);

  const snapshot = await writeSnapshot("owid", `${item.slug}.metadata-and-india-rows`, { metadata, rows });
  const artifact = createTableArtifact({
    indicatorId: item.id,
    title: item.title,
    sourceId: "owid",
    sourceIndicatorId: item.slug,
    sourceUrl: `https://ourworldindata.org/grapher/${item.slug}?country=~IND`,
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
}

await mergeSourceManifest("owid", manifest);
console.log(`Wrote ${manifest.length} targeted OWID climate artifacts.`);
