// Ingest global-lens (UNCTAD) + FII-driver (FRED) series for q.econ.foreign_investment.
//   - UNCTAD: India inward/outward FDI flow + stock, World inward flow, India share of world, peers (table)
//   - FRED: EM-currencies dollar index, US 10Y, Fed funds, VIX, EM volatility (Act 7 driver overlays)
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const EXT = "/home/bhuvanesh.r/Documents/Bhuvan projects/RBI DBIE/FDI";
const IN = { type: "country", id: "IN", name: "India" };
const UNCTAD_URL = "https://unctadstat.unctad.org/datacentre/dataviewer/US.FdiFlowsStock";
const FRED_URL = "https://fred.stlouisfed.org/series";
const manifest = [];

async function emitSeries(o) {
  const observations = o.observations.filter((p) => p.date && p.value !== null && Number.isFinite(p.value)).sort((a, b) => a.date.localeCompare(b.date));
  const artifact = createSeriesArtifact({
    indicatorId: o.indicatorId, title: o.title, sourceId: o.sourceId, sourceIndicatorId: o.sourceIndicatorId || o.indicatorId,
    sourceUrl: o.sourceUrl, unit: o.unit, frequency: o.frequency, geography: o.geography || IN, fetchedAt, observations, metadata: o.metadata || {}
  });
  const path = await writeSeriesArtifact({ sourceId: o.sourceId, name: o.name, artifact });
  manifest.push({ status: "ready", indicatorId: o.indicatorId, artifact: path, observations: observations.length, fetchedAt });
  console.log(`${o.name.padEnd(48)} ${String(observations.length).padStart(4)} obs (${o.unit})`);
}

// ---------- UNCTAD ----------
const u = JSON.parse(await readFile(`${EXT}/unctad_raw/unctad_fdi_flows_stock.json`, "utf8"));
const labels = JSON.parse(await readFile(`${EXT}/unctad_raw/economy_labels.json`, "utf8"));
await writeSnapshot("unctad", "fdi_flows_stock", u);
const yd = (y) => `${y}-12-31`; // UNCTAD is calendar year
const mn = (v) => (v === null || v === undefined ? null : v / 1e6); // absolute USD -> USD million

const unctadSeries = [
  ["india_inward_flow", "FDI inflows to India (UNCTAD, calendar year)", "extfin.fdi.inward_flow.unctad.usd", "usd"],
  ["india_outward_flow", "FDI outflows from India (UNCTAD, calendar year)", "extfin.fdi.outward_flow.unctad.usd", "usd"],
  ["india_inward_stock", "Inward FDI stock in India (UNCTAD)", "extfin.fdi.inward_stock.unctad.usd", "usd"],
  ["india_outward_stock", "Outward FDI stock of India (UNCTAD)", "extfin.fdi.outward_stock.unctad.usd", "usd"],
  ["world_inward_flow", "World FDI inflows (UNCTAD)", "extfin.fdi.world_inward_flow.unctad.usd", "usd"]
];
for (const [key, title, indicatorId] of unctadSeries) {
  await emitSeries({
    name: `unctad.IN.${indicatorId.replaceAll(".", "_")}`, indicatorId, title, sourceId: "unctad", sourceUrl: UNCTAD_URL,
    unit: "USD million", frequency: "annual",
    geography: key.startsWith("world") ? { type: "aggregate", id: "WLD", name: "World" } : IN,
    observations: u[key].map((r) => ({ date: yd(r.y), value: mn(r.usd) })),
    metadata: { source: "UNCTADstat US.FdiFlowsStock", basis: "calendar year, BoP directional principle", note: "differs from RBI fiscal-year net" }
  });
}
// India share of world (from M5011)
await emitSeries({
  name: "unctad.IN.extfin_fdi_india_share_world_pct", indicatorId: "extfin.fdi.india_share_world.pct",
  title: "India's share of world FDI inflows", sourceId: "unctad", sourceUrl: UNCTAD_URL, unit: "percent", frequency: "annual",
  observations: u.india_inward_flow.map((r) => ({ date: yd(r.y), value: r.share_world_pct })),
  metadata: { source: "UNCTADstat US.FdiFlowsStock (share in world total)" }
});
// Peers inward flow -> table artifact (economy x year), for the comparison bar
const peerByEcon = {};
for (const r of u.peers_inward_flow) (peerByEcon[r.e] ||= []).push(r);
const peerRows = [];
for (const [code, rows] of Object.entries(peerByEcon)) {
  for (const r of rows) peerRows.push({ economy: labels[code] || code, code, year: r.y, inward_flow_usd_million: mn(r.usd) });
}
const peerTable = createTableArtifact({
  indicatorId: "extfin.fdi.peers_inward_flow.unctad.usd", title: "FDI inflows by economy (UNCTAD): India vs peers",
  sourceId: "unctad", sourceIndicatorId: "extfin.fdi.peers_inward_flow.unctad.usd", sourceUrl: UNCTAD_URL, unit: "USD million",
  geography: { type: "multi", id: "MULTI", name: "Selected economies" }, fetchedAt,
  rows: peerRows.sort((a, b) => a.economy.localeCompare(b.economy) || a.year - b.year),
  dimensions: [{ id: "economy", label: "Economy" }, { id: "year", label: "Year" }],
  metadata: { source: "UNCTADstat US.FdiFlowsStock", economies: Object.values(labels) }
});
const ptPath = await writeSeriesArtifact({ sourceId: "unctad", name: "unctad.IN.extfin_fdi_peers_inward_flow", artifact: peerTable });
manifest.push({ status: "ready", indicatorId: peerTable.indicatorId, artifact: ptPath, rows: peerRows.length, fetchedAt });
console.log(`${"unctad.IN.extfin_fdi_peers_inward_flow".padEnd(48)} ${String(peerRows.length).padStart(4)} rows (table)`);

// Latest-year peers snapshot -> tableBars (label/value), World excluded
const latestYear = Math.max(...peerRows.map((r) => r.year));
const peerLatestRows = peerRows
  .filter((r) => r.year === latestYear && r.code !== "0000" && r.inward_flow_usd_million !== null)
  .sort((a, b) => b.inward_flow_usd_million - a.inward_flow_usd_million)
  .map((r) => ({ economy: r.economy, year: r.year, inward_flow_usd_million: r.inward_flow_usd_million, label: r.economy, value: r.inward_flow_usd_million }));
const peerLatestTable = createTableArtifact({
  indicatorId: "extfin.fdi.peers_inward_flow_latest.unctad.usd",
  title: `FDI inflows: India vs peers (${latestYear})`,
  sourceId: "unctad", sourceIndicatorId: "extfin.fdi.peers_inward_flow_latest.unctad.usd", sourceUrl: UNCTAD_URL, unit: "USD million",
  geography: { type: "multi", id: "MULTI", name: "Selected economies" }, fetchedAt, rows: peerLatestRows,
  dimensions: [{ id: "economy", label: "Economy" }],
  metadata: { source: "UNCTADstat US.FdiFlowsStock", period: String(latestYear), note: "calendar-year inward FDI flow; World excluded" }
});
const pltPath = await writeSeriesArtifact({ sourceId: "unctad", name: "unctad.IN.extfin_fdi_peers_inward_flow_latest", artifact: peerLatestTable });
manifest.push({ status: "ready", indicatorId: peerLatestTable.indicatorId, artifact: pltPath, rows: peerLatestRows.length, fetchedAt });
console.log(`${"unctad.IN.extfin_fdi_peers_inward_flow_latest".padEnd(48)} ${String(peerLatestRows.length).padStart(4)} rows (table)`);

// ---------- FRED drivers (monthly average) ----------
const fred = JSON.parse(await readFile(`${EXT}/fred_raw/fred_series.json`, "utf8"));
const fredEm = JSON.parse(await readFile(`${EXT}/fred_raw/fred_em_series.json`, "utf8"));
const fredDxy = JSON.parse(await readFile(`${EXT}/fred_raw/fred_dollar_em_indices.json`, "utf8"));
await writeSnapshot("fred", "fii_drivers", { ...fred, ...fredEm, ...fredDxy });
function monthlyAvg(obs) {
  const m = {};
  for (const [d, v] of obs) (m[d.slice(0, 7)] ||= []).push(v);
  return Object.entries(m).map(([ym, vs]) => ({ date: `${ym}-01`, value: vs.reduce((a, b) => a + b, 0) / vs.length }));
}
const fredSpec = [
  [fredDxy.DTWEXEMEGS, "extfin.driver.usd_em_index", "US dollar index vs emerging-market currencies (nominal)", "index (Jan 2006 = 100)", "DTWEXEMEGS"],
  [fred.DGS10, "extfin.driver.us_10y_yield", "US 10-year Treasury yield", "percent", "DGS10"],
  [fred.FEDFUNDS, "extfin.driver.fed_funds_rate", "US federal funds rate", "percent", "FEDFUNDS"],
  [fred.VIXCLS, "extfin.driver.vix", "CBOE Volatility Index (VIX)", "index", "VIXCLS"],
  [fredEm.VXEEMCLS, "extfin.driver.em_vix", "CBOE Emerging-Markets ETF Volatility Index", "index", "VXEEMCLS"]
];
for (const [obs, indicatorId, title, unit, sid] of fredSpec) {
  await emitSeries({
    name: `fred.IN.${indicatorId.replaceAll(".", "_")}`, indicatorId, title, sourceId: "fred", sourceIndicatorId: sid,
    sourceUrl: `${FRED_URL}/${sid}`, unit, frequency: "monthly", geography: { type: "global", id: "GLOBAL", name: "Global" },
    observations: monthlyAvg(obs), metadata: { source: `FRED ${sid}`, note: "monthly average of daily/native observations" }
  });
}

await writeSourceManifest("foreign-investment-global", manifest);
console.log(`\nWrote ${manifest.length} global/driver artifacts.`);
