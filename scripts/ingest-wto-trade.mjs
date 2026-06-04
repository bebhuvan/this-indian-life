import { fetchWtoData } from "./adapters/wto.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { wtoTradeIndicators } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
// WTO limits timeseries data (data/data_count) to 1 call/second.
const throttleMs = Number(process.env.WTO_THROTTLE_MS || 1300);
const manifest = [];
const failures = [];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [index, item] of wtoTradeIndicators.entries()) {
  if (index > 0) await wait(throttleMs);
  const sourceIndicatorId = [item.i, item.r, item.pc || "default"].join(".");
  try {
    const { rows, raw } = await fetchWtoData({
      i: item.i,
      r: item.r,
      p: item.p,
      ps: item.ps,
      pc: item.pc
    });
    const snapshot = await writeSnapshot("wto", `${item.i}.r${item.r}.${item.pc || "all"}`, raw);
    if (!rows.length) {
      throw new Error(`No rows returned for ${sourceIndicatorId}`);
    }
    const isWorld = item.r === "000";
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "wto",
      sourceIndicatorId,
      sourceUrl: "https://stats.wto.org/",
      unit: item.unit,
      geography: isWorld
        ? { type: "aggregate", id: "WLD", name: "World" }
        : { type: "country", id: "IND", name: "India" },
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        indicatorCode: item.i,
        reportingEconomyCode: item.r,
        partnerCode: item.p || "000",
        productCode: item.pc || "default",
        period: item.ps,
        frequency: item.frequency
      }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "wto",
      name: `wto.${item.id}`,
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
    console.log(`wto ${item.id} ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId,
      fetchedAt,
      error: error.message
    });
    console.warn(`wto ${item.id} failed: ${error.message}`);
  }
}

await writeSourceManifest("wto", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} WTO artifacts; ${failures.length} failure(s).`);
