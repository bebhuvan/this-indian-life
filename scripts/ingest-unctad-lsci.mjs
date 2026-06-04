import { fetchUnctadLsciCsv, parseLsci, quarterToDate } from "./adapters/unctad.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

const { csv, url } = await fetchUnctadLsciCsv();
const rows = parseLsci(csv);
const snapshot = await writeSnapshot("unctad", "US_LSCI", { rowCount: rows.length, fetchedFrom: url });

const ECONOMIES = [
  { code: "356", id: "trade.unctad.lsci", title: "Liner shipping connectivity — India", gid: "IND", name: "India" },
  { code: "156", id: "trade.unctad.lsci_chn", title: "Liner shipping connectivity — China", gid: "CHN", name: "China" },
  { code: "702", id: "trade.unctad.lsci_sgp", title: "Liner shipping connectivity — Singapore", gid: "SGP", name: "Singapore" }
];

for (const e of ECONOMIES) {
  const obs = rows
    .filter((r) => r.economy === e.code)
    .map((r) => ({ date: quarterToDate(r.quarter), value: Math.round(r.index * 100) / 100 }))
    .filter((o) => o.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!obs.length) { console.warn(`unctad ${e.id}: no obs`); continue; }
  const artifact = createSeriesArtifact({
    indicatorId: e.id, title: e.title, sourceId: "unctad", sourceIndicatorId: `US.LSCI.${e.code}`,
    sourceUrl: "https://unctadstat.unctad.org/datacentre/reportInfo/US.LSCI", unit: "index (avg Q1 2023 = 100)", frequency: "quarterly",
    geography: { type: "country", id: e.gid, name: e.name }, fetchedAt, observations: obs,
    metadata: { dataset: "UNCTAD Liner Shipping Connectivity Index", economyCode: e.code }
  });
  const path = await writeSeriesArtifact({ sourceId: "unctad", name: `unctad.${e.gid}.${e.id}`, artifact });
  manifest.push({ status: "ready", indicatorId: e.id, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
  console.log(`unctad ${e.id} ${obs.length} obs (→${obs.at(-1).date}=${obs.at(-1).value})`);
}

await writeSourceManifest("unctad", manifest);
console.log(`Wrote ${manifest.length} UNCTAD LSCI artifacts.`);
