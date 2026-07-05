// Pull the BIS half: India's effective exchange rates (broad basket).
// REER (real) = the "true strength" lens that barely moves while the nominal
// INR/USD slides; NEER (nominal) = the trade-weighted nominal counterpart.
// India is broad-basket only on BIS, monthly from 1994-01 (no narrow series).
import { fetchBisData } from "./adapters/bis.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://data.bis.org/topics/EER";

const SERIES = [
  { key: "M.R.B.IN", indicatorId: "IN.fx.reer_broad.monthly", name: "bis.IN.fx.reer_broad.monthly", title: "India real effective exchange rate, broad basket (BIS)" },
  { key: "M.N.B.IN", indicatorId: "IN.fx.neer_broad.monthly", name: "bis.IN.fx.neer_broad.monthly", title: "India nominal effective exchange rate, broad basket (BIS)" }
];

const manifest = [];
const failures = [];

for (const item of SERIES) {
  try {
    const { flowName, raw, series } = await fetchBisData({ flow: "WS_EER", key: item.key });
    const s = series[0];
    if (!s) throw new Error(`no series returned for ${item.key}`);
    const observations = s.observations.map((o) => ({ date: o.period, value: o.value }));
    const snapshot = await writeSnapshot("bis", `WS_EER.${item.key}`, raw);
    const artifact = createSeriesArtifact({
      indicatorId: item.indicatorId,
      title: item.title,
      sourceId: "bis",
      sourceIndicatorId: `WS_EER/${item.key}`,
      sourceUrl,
      unit: "index 2020=100",
      frequency: "monthly",
      fetchedAt,
      observations,
      metadata: { flow: "WS_EER", flowName, seriesKey: item.key, dims: s.dims, basket: "broad" }
    });
    const path = await writeSeriesArtifact({ sourceId: "bis", name: item.name, artifact });
    manifest.push({ status: "ready", indicatorId: item.indicatorId, sourceIndicatorId: `WS_EER/${item.key}`, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: observations.length, fetchedAt });
    console.log(`bis ${item.key}: ${observations.length} obs (${observations[0]?.date} -> ${observations.at(-1)?.date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: item.indicatorId, sourceIndicatorId: `WS_EER/${item.key}`, fetchedAt, error: error.message });
    console.warn(`bis ${item.key} failed: ${error.message}`);
  }
}

await writeSourceManifest("bis-eer", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} BIS EER artifacts; ${failures.length} failure(s).`);
