import { fetchEiaInternationalSeries } from "./adapters/eia.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { eiaInternationalSeries } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

function numberOrNull(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeObservations(rows) {
  return rows
    .map((row) => ({ date: String(row.period || ""), value: numberOrNull(row.value) }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

for (const item of eiaInternationalSeries) {
  try {
    const raw = await fetchEiaInternationalSeries({
      productId: item.productId,
      activityId: item.activityId,
      unit: item.eiaUnit,
      frequency: item.frequency || "annual"
    });
    const rows = Array.isArray(raw?.response?.data) ? raw.response.data : [];
    const observations = normalizeObservations(rows);
    const firstRow = rows[0] || {};
    const snapshot = await writeSnapshot("eia", `${item.productId}-${item.activityId}-IND-${item.eiaUnit}.${item.frequency || "annual"}`, raw);
    const artifact = createSeriesArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "eia",
      sourceIndicatorId: `${item.productId}-${item.activityId}-IND-${item.eiaUnit}.${item.frequency || "annual"}`,
      sourceUrl: "https://www.eia.gov/opendata/browser/international",
      unit: item.unit || firstRow.unitName || firstRow.unit || item.eiaUnit,
      frequency: item.frequency || "annual",
      geography: {
        type: "country",
        id: "IND",
        name: "India"
      },
      fetchedAt,
      observations,
      metadata: {
        productId: item.productId,
        activityId: item.activityId,
        unit: item.eiaUnit,
        productName: firstRow.productName,
        activityName: firstRow.activityName,
        unitName: firstRow.unitName,
        totalRows: raw?.response?.total
      }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "eia",
      name: `eia.IN.${item.id}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: artifact.sourceIndicatorId,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      observations: observations.length,
      fetchedAt
    });
    console.log(`eia ${item.id} ${observations.length} observations`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: `${item.productId}-${item.activityId}-IND-${item.eiaUnit}.${item.frequency || "annual"}`,
      fetchedAt,
      error: error.message
    });
    console.warn(`eia ${item.id} failed: ${error.message}`);
  }
}

await writeSourceManifest("eia", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} EIA artifacts; ${failures.length} failure(s).`);

