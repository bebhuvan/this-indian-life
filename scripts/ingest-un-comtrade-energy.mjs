import { fetchUnComtradeAnnualCommodity } from "./adapters/un-comtrade.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { unComtradeEnergyCommodities } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const period = process.env.UN_COMTRADE_PERIOD || "2024";
const manifest = [];
const failures = [];

for (const item of unComtradeEnergyCommodities) {
  try {
    const raw = await fetchUnComtradeAnnualCommodity({
      cmdCode: item.cmdCode,
      flowCode: item.flowCode,
      period
    });
    const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.dataset) ? raw.dataset : [];
    const snapshot = await writeSnapshot("un-comtrade", `${item.cmdCode}.${item.flowCode}.IND.${period}`, raw);
    if (!rows.length) {
      throw new Error(`No rows returned for ${item.cmdCode}.${item.flowCode}.${period}`);
    }
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "un-comtrade",
      sourceIndicatorId: `${item.cmdCode}.${item.flowCode}.${period}`,
      sourceUrl: "https://comtradeplus.un.org/",
      unit: item.unit,
      geography: { type: "country", id: "IND", name: "India" },
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        reporterCode: "699",
        partnerCode: "0",
        cmdCode: item.cmdCode,
        flowCode: item.flowCode,
        period
      }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "un-comtrade",
      name: `un-comtrade.IN.${item.id}.${period}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: artifact.sourceIndicatorId,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`un-comtrade ${item.id} ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: `${item.cmdCode}.${item.flowCode}.${period}`,
      fetchedAt,
      error: error.message
    });
    console.warn(`un-comtrade ${item.id} failed: ${error.message}`);
  }
}

await writeSourceManifest("un-comtrade", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} UN Comtrade artifacts; ${failures.length} failure(s).`);
