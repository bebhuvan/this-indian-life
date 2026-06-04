import { canonicalComtradeRows, fetchUnComtradeData } from "./adapters/un-comtrade.mjs";
import { createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";
import { unComtradeHistoryQueries } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [index, item] of unComtradeHistoryQueries.entries()) {
  if (index > 0) await wait(1500);
  const sourceIndicatorId = `${item.cmdCode}.${item.flowCode}.${item.partnerCode || "all"}.hist`;
  try {
    // Comtrade caps the period list (~12) per request, so chunk long ranges.
    const years = String(item.period).split(",");
    const chunks = [];
    for (let i = 0; i < years.length; i += 10) chunks.push(years.slice(i, i + 10).join(","));
    let raw = null;
    const allRows = [];
    for (const [ci, period] of chunks.entries()) {
      if (ci > 0) await wait(1500);
      const part = await fetchUnComtradeData({ cmdCode: item.cmdCode, flowCode: item.flowCode, partnerCode: item.partnerCode, period });
      if (!raw) raw = part;
      if (Array.isArray(part?.data)) allRows.push(...part.data);
    }
    const rows = canonicalComtradeRows(allRows);
    const snapshot = await writeSnapshot("un-comtrade", `${item.cmdCode}.${item.flowCode}.${item.partnerCode || "all"}.IND.hist`, raw);
    if (!rows.length) throw new Error(`No rows returned for ${sourceIndicatorId}`);
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
      metadata: { reporterCode: "699", partnerCode: item.partnerCode || "all", cmdCode: item.cmdCode, flowCode: item.flowCode, period: item.period, breakdown: item.dim }
    });
    const artifactPath = await writeSeriesArtifact({ sourceId: "un-comtrade", name: `un-comtrade.IN.${item.id}`, artifact });
    manifest.push({ status: "ready", indicatorId: item.id, sourceIndicatorId, artifact: artifactPath, snapshot: snapshot.path, rawHash: snapshot.hash, rows: rows.length, fetchedAt });
    console.log(`un-comtrade ${item.id} ${rows.length} rows (of ${allRows.length} raw)`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: item.id, sourceIndicatorId, fetchedAt, error: error.message });
    console.warn(`un-comtrade ${item.id} failed: ${error.message}`);
  }
}

await mergeSourceManifest("un-comtrade", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} UN Comtrade history artifacts; ${failures.length} failure(s).`);
