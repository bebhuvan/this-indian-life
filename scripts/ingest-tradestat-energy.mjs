import { fetchTradeStatCommodityAllCountriesImport } from "./adapters/tradestat.mjs";
import { createTableArtifact, writeRawSnapshot, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { tradeStatEnergyCommodities } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const fiscalYear = process.env.TRADESTAT_FISCAL_YEAR || "2025";
const manifest = [];
const failures = [];

for (const item of tradeStatEnergyCommodities) {
  try {
    const { html, parsed } = await fetchTradeStatCommodityAllCountriesImport({
      hsCode: item.hsCode,
      fiscalYear,
      report: item.report || "2"
    });
    const htmlSnapshot = await writeRawSnapshot("tradestat", `${item.hsCode}.imports.${fiscalYear}.html`, html, "html");
    const jsonSnapshot = await writeSnapshot("tradestat", `${item.hsCode}.imports.${fiscalYear}.parsed`, parsed);
    const rows = parsed.rows;
    if (!rows.length) throw new Error(`No TradeStat rows returned for ${item.hsCode}.${fiscalYear}`);
    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "tradestat",
      sourceIndicatorId: `${item.hsCode}.imports.${fiscalYear}`,
      sourceUrl: "https://tradestat.commerce.gov.in/eidb/commodity_wise_all_countries_import",
      unit: item.unit,
      geography: { type: "country", id: "IND", name: "India" },
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        hsCode: item.hsCode,
        fiscalYear,
        report: item.report || "2",
        commodityText: parsed.commodityText,
        htmlSnapshot: htmlSnapshot.path,
        htmlHash: htmlSnapshot.hash
      }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "tradestat",
      name: `tradestat.IN.${item.id}.${fiscalYear}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId: artifact.sourceIndicatorId,
      artifact: artifactPath,
      snapshot: jsonSnapshot.path,
      htmlSnapshot: htmlSnapshot.path,
      rawHash: htmlSnapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`tradestat ${item.id} ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: `${item.hsCode}.imports.${fiscalYear}`,
      fetchedAt,
      error: error.message
    });
    console.warn(`tradestat ${item.id} failed: ${error.message}`);
  }
}

await writeSourceManifest("tradestat", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} TradeStat artifacts; ${failures.length} failure(s).`);
