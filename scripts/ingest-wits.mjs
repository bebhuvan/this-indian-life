import { fetchWitsTariffSeries } from "./adapters/wits.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { witsTariffSeries } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [index, item] of witsTariffSeries.entries()) {
  if (index > 0) await wait(1500);
  try {
    const { points, raw, url } = await fetchWitsTariffSeries({ indicator: item.indicator });
    if (!points.length) throw new Error(`No observations for ${item.indicator}`);
    const snapshot = await writeSnapshot("wits", `${item.indicator}.IND.WLD.Total`, raw);
    const artifact = createSeriesArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "wits",
      sourceIndicatorId: item.indicator,
      sourceUrl: url,
      unit: item.unit,
      frequency: "annual",
      geography: { type: "country", id: "IND", name: "India" },
      fetchedAt,
      observations: points.map((p) => ({ date: p.date, value: Math.round(p.value * 100) / 100 })),
      metadata: { dataset: "tradestats-tariff", reporter: "IND", partner: "WLD", product: "Total" }
    });
    const artifactPath = await writeSeriesArtifact({ sourceId: "wits", name: `wits.IN.${item.id}`, artifact });
    manifest.push({ status: "ready", indicatorId: item.id, sourceIndicatorId: item.indicator, artifact: artifactPath, snapshot: snapshot.path, rawHash: snapshot.hash, observations: points.length, fetchedAt });
    console.log(`wits ${item.id} ${points.length} obs (→${points.at(-1).date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: item.id, sourceIndicatorId: item.indicator, fetchedAt, error: error.message });
    console.warn(`wits ${item.id} failed: ${error.message}`);
  }
}

await writeSourceManifest("wits", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} WITS artifacts; ${failures.length} failure(s).`);
