import { fetchAllClimateTraceAssets } from "./adapters/climatetrace.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { climateTraceAssetSectors } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://climatetrace.org/";
const topNBySector = { agriculture: 200 };

function ownerNames(owners) {
  if (!Array.isArray(owners) || owners.length === 0) return null;
  const seen = new Set();
  const names = [];
  for (const owner of owners) {
    const name = owner?.CompanyName;
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names.join("; ") || null;
}

function latestConfidence(confidenceByYear) {
  if (!Array.isArray(confidenceByYear) || confidenceByYear.length === 0) return null;
  const years = confidenceByYear
    .flatMap((entry) => Object.keys(entry))
    .map(Number)
    .filter((year) => !Number.isNaN(year));
  if (!years.length) return null;
  const latestYear = Math.max(...years);
  const entry = confidenceByYear.find((candidate) => Object.prototype.hasOwnProperty.call(candidate, String(latestYear)));
  const record = entry?.[String(latestYear)]?.[0];
  return record?.total_co2e_100yrgwp ?? null;
}

function toRow(asset, requestedSector) {
  const summary = Array.isArray(asset.EmissionsSummary) ? asset.EmissionsSummary[0] : undefined;
  return {
    id: asset.Id ?? null,
    name: asset.Name ?? null,
    requested_sector: requestedSector,
    subsector: asset.Sector ?? null,
    asset_type: asset.AssetType ?? null,
    owner: ownerNames(asset.Owners),
    gas: summary?.Gas ?? null,
    emissions_quantity_t: summary?.EmissionsQuantity ?? null,
    activity: summary?.Activity ?? null,
    activity_units: summary?.ActivityUnits ?? null,
    capacity: summary?.Capacity ?? null,
    capacity_units: summary?.CapacityUnits ?? null,
    confidence_total_co2e_100yr: latestConfidence(asset.Confidence)
  };
}

const manifest = [];
const failures = [];

for (const item of climateTraceAssetSectors) {
  try {
    const rawAssets = await fetchAllClimateTraceAssets({ country: "IND", sectors: item.sector, pageSize: 1000 });
    const snapshot = await writeSnapshot("climatetrace", `assets.${item.sector}.IND`, rawAssets);

    let rows = rawAssets.map((asset) => toRow(asset, item.sector));
    rows.sort((a, b) => (b.emissions_quantity_t ?? 0) - (a.emissions_quantity_t ?? 0));
    const cap = topNBySector[item.sector];
    const totalRows = rows.length;
    if (cap && rows.length > cap) {
      rows = rows.slice(0, cap);
    }

    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "climatetrace",
      sourceIndicatorId: `assets/${item.sector}`,
      sourceUrl,
      unit: "tonnes CO2e (100yr)",
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        sector: item.sector,
        totalAssetsFound: totalRows,
        rowsKept: rows.length,
        cappedToTopN: cap ?? null
      }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "climatetrace",
      name: `climatetrace.IN.assets.${item.sector.replace(/-/g, "_")}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: `assets/${item.sector}`,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      totalAssetsFound: totalRows,
      fetchedAt
    });
    console.log(`climatetrace assets ${item.sector}: found ${totalRows}, kept ${rows.length}`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: `assets/${item.sector}`,
      fetchedAt,
      error: error.message
    });
    console.warn(`climatetrace assets ${item.sector} failed: ${error.message}`);
  }
}

await writeSourceManifest("climatetrace-assets", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} Climate TRACE asset artifacts; ${failures.length} failure(s).`);
