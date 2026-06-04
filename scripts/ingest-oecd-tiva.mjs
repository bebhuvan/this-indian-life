import { fetchTivaIndia } from "./adapters/oecd-tiva.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

const { rows, url } = await fetchTivaIndia();
const snapshot = await writeSnapshot("oecd-tiva", "EXGR.IND._T.W", { rowCount: rows.length, fetchedFrom: url });

const SERIES = [
  { measure: "EXGR_DVA", id: "trade.tiva.dva_share", title: "Domestic value added in exports", unit: "% of gross exports" },
  { measure: "EXGR_FVA", id: "trade.tiva.fva_share", title: "Foreign value added in exports (backward GVC participation)", unit: "% of gross exports" },
  { measure: "EXGR_INT_DVA", id: "trade.tiva.fwd_participation", title: "Domestic value added in intermediate exports (forward GVC)", unit: "% of gross exports" }
];

for (const s of SERIES) {
  const obs = rows
    .filter((r) => r.MEASURE === s.measure)
    .map((r) => ({ date: String(r.TIME_PERIOD), value: r.OBS_VALUE === "" || r.OBS_VALUE == null ? null : Math.round(Number(r.OBS_VALUE) * 100) / 100 }))
    .filter((o) => o.date && o.value !== null && Number.isFinite(o.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!obs.length) { console.warn(`oecd-tiva ${s.id}: no obs`); continue; }
  const artifact = createSeriesArtifact({
    indicatorId: s.id, title: s.title, sourceId: "oecd-tiva", sourceIndicatorId: s.measure,
    sourceUrl: "https://www.oecd.org/sti/ind/measuring-trade-in-value-added.htm", unit: s.unit, frequency: "annual",
    geography: { type: "country", id: "IND", name: "India" }, fetchedAt, observations: obs,
    metadata: { dataset: "TiVA 2025", activity: "Total", counterpart: "World" }
  });
  const path = await writeSeriesArtifact({ sourceId: "oecd-tiva", name: `oecd-tiva.IN.${s.id}`, artifact });
  manifest.push({ status: "ready", indicatorId: s.id, sourceIndicatorId: s.measure, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
  console.log(`oecd-tiva ${s.id} ${obs.length} obs (→${obs.at(-1).date}=${obs.at(-1).value})`);
}

await writeSourceManifest("oecd-tiva", manifest);
console.log(`Wrote ${manifest.length} OECD TiVA artifacts.`);
