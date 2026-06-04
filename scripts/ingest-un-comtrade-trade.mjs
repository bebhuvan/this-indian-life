import { canonicalComtradeRows, fetchUnComtradeData } from "./adapters/un-comtrade.mjs";
import { createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";
import { unComtradeTradeQueries } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const period = process.env.UN_COMTRADE_TRADE_PERIOD || process.env.UN_COMTRADE_PERIOD || "2024";
const manifest = [];
const failures = [];

for (const item of unComtradeTradeQueries) {
  const sourceIndicatorId = `${item.cmdCode}.${item.flowCode}.${period}`;
  try {
    const raw = await fetchUnComtradeData({
      cmdCode: item.cmdCode,
      flowCode: item.flowCode,
      partnerCode: item.partnerCode,
      period
    });
    const allRows = Array.isArray(raw?.data) ? raw.data : [];
    const rows = canonicalComtradeRows(allRows);
    const snapshot = await writeSnapshot("un-comtrade", `${item.cmdCode}.${item.flowCode}.IND.${period}.trade`, raw);
    if (!rows.length) {
      throw new Error(`No rows returned for ${sourceIndicatorId}`);
    }
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "un-comtrade",
      sourceIndicatorId,
      sourceUrl: "https://comtradeplus.un.org/",
      unit: item.unit,
      geography: { type: "country", id: "IND", name: "India" },
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        reporterCode: "699",
        partnerCode: item.partnerCode || "all",
        cmdCode: item.cmdCode,
        flowCode: item.flowCode,
        period,
        breakdown: item.dim
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
      sourceIndicatorId,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`un-comtrade ${item.id} ${rows.length} rows (of ${allRows.length} raw)`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId,
      fetchedAt,
      error: error.message
    });
    console.warn(`un-comtrade ${item.id} failed: ${error.message}`);
  }
}

await mergeSourceManifest("un-comtrade", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} UN Comtrade trade artifacts; ${failures.length} failure(s).`);
