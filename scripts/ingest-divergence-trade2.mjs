// Two more trade comparisons for the "Why India stayed poor" series, both kept on
// World-Bank-consistent / already-ingested data:
//   1) India's bilateral trade with China, derived from the existing UN Comtrade
//      china_bilateral table -> two clean annual series (imports from / exports to China),
//      whose widening gap is India's deficit: India as a market for China's factories.
//   2) Each country's share of world merchandise exports, derived from the World Bank's
//      WTO-sourced merchandise-export series (TX.VAL.MRCH.CD.WT), country / world: the
//      "who captured globalisation" picture (China's surge vs India staying small).
import { readFile } from "node:fs/promises";
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

// 1) India-China bilateral, from the existing comtrade table
try {
  const table = JSON.parse(await readFile("data/series/un-comtrade.IN.trade.comtrade.china_bilateral.json", "utf8"));
  const total = (table.rows || []).filter((r) => r.cmdCode === "TOTAL");
  const make = async (flowDesc, slug, title) => {
    const observations = total.filter((r) => r.flowDesc === flowDesc && r.primaryValue != null)
      .map((r) => ({ date: String(r.period), value: Number(r.primaryValue) }))
      .filter((o) => o.date && Number.isFinite(o.value)).sort((a, b) => a.date.localeCompare(b.date));
    if (observations.length < 2) throw new Error(`insufficient ${flowDesc} rows`);
    const indicatorId = `divergence.${slug}`;
    const artifact = createSeriesArtifact({ indicatorId, title, sourceId: "un-comtrade", sourceIndicatorId: `IND.CHN.${flowDesc}.TOTAL`, sourceUrl: "https://comtradeplus.un.org/", unit: "current US$", frequency: "annual", geography: { type: "country", id: "IND", name: "India" }, fetchedAt, observations, metadata: { angle: "trade", metric: slug, bilateral: "India-China", flow: flowDesc } });
    await writeSeriesArtifact({ sourceId: "un-comtrade", name: `un-comtrade.IN.divergence.${slug}`, artifact });
    manifest.push({ status: "ready", indicatorId, observations: observations.length, latest: observations.at(-1).date });
    console.log(`derived ${indicatorId} (${observations.length} obs, →${observations.at(-1).date}=$${Math.round(observations.at(-1).value/1e9)}B)`);
  };
  await make("Import", "india_china_imports", "India's imports from China");
  await make("Export", "india_china_exports", "India's exports to China");
} catch (e) { failures.push({ step: "india_china", error: e.message }); console.warn(`india_china failed: ${e.message}`); }

// 2) Share of world merchandise exports
const SHARE_COUNTRIES = [
  { code: "IN", cc: "in", name: "India" },
  { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" },
  { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "JPN", cc: "jpn", name: "Japan" }
];
try {
  const wb = async (code) => {
    const url = `https://api.worldbank.org/v2/country/${code}/indicator/TX.VAL.MRCH.CD.WT?format=json&per_page=20000`;
    const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
    return { rows: Array.isArray(raw?.[1]) ? raw[1] : [], raw, url };
  };
  const world = await wb("WLD");
  await writeSnapshot("worldbank", "divergence.WLD.TX_VAL_MRCH_CD_WT", world.raw);
  const worldBy = new Map(world.rows.filter((r) => r.value != null).map((r) => [String(r.date), Number(r.value)]));
  for (const c of SHARE_COUNTRIES) {
    try {
      const { rows, url } = await wb(c.code);
      const observations = rows.filter((r) => r.value != null && worldBy.has(String(r.date)))
        .map((r) => ({ date: String(r.date), value: (Number(r.value) / worldBy.get(String(r.date))) * 100 }))
        .filter((o) => Number.isFinite(o.value) && Number(o.date) >= 1960).sort((a, b) => a.date.localeCompare(b.date));
      if (observations.length < 2) throw new Error("insufficient overlap with world total");
      const indicatorId = `divergence.world_export_share.${c.cc}`;
      const artifact = createSeriesArtifact({ indicatorId, title: `Share of world merchandise exports — ${c.name}`, sourceId: "worldbank", sourceIndicatorId: "TX.VAL.MRCH.CD.WT / world", sourceUrl: url, unit: "% of world goods exports", frequency: "annual", geography: { type: "country", id: c.code, name: c.name }, fetchedAt, observations, metadata: { angle: "trade", metric: "world_export_share", country: c.name, derivation: "country merchandise exports as a share of the world total (WTO via World Bank)" } });
      await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${c.cc}.world_export_share`, artifact });
      manifest.push({ status: "ready", indicatorId, observations: observations.length });
      console.log(`derived ${indicatorId} (${observations.length} obs, ${observations[0].date}=${observations[0].value.toFixed(1)}% → ${observations.at(-1).date}=${observations.at(-1).value.toFixed(1)}%)`);
    } catch (e) { failures.push({ indicatorId: `divergence.world_export_share.${c.cc}`, error: e.message }); console.warn(`world_export_share.${c.code} failed: ${e.message}`); }
  }
} catch (e) { failures.push({ step: "world_export_share", error: e.message }); console.warn(`world_export_share failed: ${e.message}`); }

await writeSourceManifest("divergence-trade2", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} series; ${failures.length} failure(s).`);
