// Ingest India gold (HS 7108) and jewellery (HS 7113) trade for the gold
// flagship from UN Comtrade. Annual world series 2010-2024 (value + tonnes),
// MONTHLY world series 2014->latest (for the 2025-26 price-surge story, since
// annual stops at 2024), and by-partner tables for the latest full year.
//
// Reuses canonicalComtradeRows (drops customs/MoT/partner2 duplicate rows).
// Jewellery is charted by VALUE only — Comtrade netWgt for HS 7113 is glitched.
import { loadEnv } from "./env.mjs";
import { canonicalComtradeRows } from "./adapters/un-comtrade.mjs";
import { createSeriesArtifact, createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

loadEnv();
const BASE = process.env.UN_COMTRADE_BASE_URL || "https://comtradeapi.un.org";
const KEY = process.env.UN_COMTRADE_API_KEY || process.env.UN_COMTRADE__PRIMARY_API_KEY
  || process.env.COMTRADE_API_KEY || process.env.UN_COMTRADE__SECONDARY_API_KEY;
if (!KEY) throw new Error("No UN Comtrade API key found in env (.env).");
const FETCHED = new Date().toISOString();
const SRC = "https://comtradeplus.un.org/";
const manifest = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchComtrade({ freq, cmd, flow, period, partner = "0" }) {
  const url = `${BASE}/data/v1/get/C/${freq}/HS?reporterCode=699&period=${period}`
    + `&partnerCode=${partner}&cmdCode=${cmd}&flowCode=${flow}&includeDesc=true`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": KEY } });
      if (res.status === 429) { await sleep(3000 * (attempt + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return Array.isArray(body?.data) ? body.data : [];
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(2000 * (attempt + 1));
    }
  }
  return [];
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const bn = (v) => (Number.isFinite(v) ? Math.round((v / 1e9) * 1000) / 1000 : null);
const t = (v) => (Number.isFinite(v) ? Math.round((v / 1000) * 10) / 10 : null);

// World-aggregate series across periods (partner 0 -> one canonical row per period)
async function worldSeries({ freq, cmd, flow, periods }) {
  const byPeriod = new Map();
  for (const grp of chunk(periods, 10)) {
    const rows = canonicalComtradeRows(await fetchComtrade({ freq, cmd, flow, period: grp.join(","), partner: "0" }));
    for (const r of rows) byPeriod.set(String(r.period), { usd: r.primaryValue, kg: r.netWgt });
    await sleep(400);
  }
  return byPeriod;
}
const annDate = (p) => `${p}-12-31`;
const monDate = (p) => `${String(p).slice(0, 4)}-${String(p).slice(4, 6)}-01`;

async function emitSeries({ name, indicator, title, unit, observations, frequency, metadata }) {
  const obs = observations.filter((o) => o.value !== null);
  if (!obs.length) { console.warn(`  skip ${indicator}: no obs`); return; }
  const artifact = createSeriesArtifact({
    indicatorId: indicator, title, sourceId: "un-comtrade", sourceIndicatorId: indicator,
    sourceUrl: SRC, unit, frequency, geography: { type: "country", id: "IND", name: "India" },
    fetchedAt: FETCHED, observations: obs, metadata
  });
  const path = await writeSeriesArtifact({ sourceId: "un-comtrade", name, artifact });
  manifest.push({ status: "ready", indicatorId: indicator, sourceIndicatorId: indicator, artifact: path, observations: obs.length, fetchedAt: FETCHED });
  console.log(`  wrote ${name}.json: ${obs.length} obs`);
}

async function emitPartnerTable({ name, indicator, title, cmd, flow, period }) {
  const raw = await fetchComtrade({ freq: "A", cmd, flow, period, partner: "" });
  const snap = await writeSnapshot("un-comtrade", `gold.${cmd}.${flow}.${period}.partners`, raw);
  const rows = canonicalComtradeRows(raw).filter((r) => r.partnerCode !== 0);
  if (!rows.length) { console.warn(`  skip ${indicator}: no partner rows`); return; }
  const artifact = createTableArtifact({
    indicatorId: indicator, title, sourceId: "un-comtrade", sourceIndicatorId: `${cmd}.${flow}.${period}`,
    sourceUrl: SRC, unit: "current US$", geography: { type: "country", id: "IND", name: "India" },
    fetchedAt: FETCHED, rows, dimensions: Object.keys(rows[0] || {}),
    metadata: { cmdCode: cmd, flowCode: flow, period, breakdown: "partner",
      method: `UN Comtrade HS ${cmd}, India ${flow === "M" ? "imports from" : "exports to"} partner countries, ${period}. Canonical rows only.` }
  });
  const path = await writeSeriesArtifact({ sourceId: "un-comtrade", name, artifact });
  manifest.push({ status: "ready", indicatorId: indicator, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, rows: rows.length, snapshot: snap.path, fetchedAt: FETCHED });
  console.log(`  wrote ${name}.json: ${rows.length} partner rows`);
}

const YEARS = Array.from({ length: 15 }, (_, i) => String(2010 + i)); // 2010..2024
const MONTHS = [];
for (let y = 2014; y <= 2026; y++) for (let m = 1; m <= 12; m++) MONTHS.push(`${y}${String(m).padStart(2, "0")}`);

try {
  // --- Gold (HS 7108) imports: annual value + tonnes ---
  const giA = await worldSeries({ freq: "A", cmd: "7108", flow: "M", periods: YEARS });
  await emitSeries({ name: "un-comtrade.IN.gold.comtrade.imports_value_annual", indicator: "gold.comtrade.imports_value_annual",
    title: "India gold imports (HS 7108), US$ billion", unit: "current US$ billion", frequency: "annual",
    observations: YEARS.map((y) => ({ date: annDate(y), value: bn(giA.get(y)?.usd) })),
    metadata: { method: "UN Comtrade HS 7108 (gold), India imports from World, annual.", note: "Calendar year. Switzerland + UAE are ~60% of value." } });
  await emitSeries({ name: "un-comtrade.IN.gold.comtrade.imports_tonnes_annual", indicator: "gold.comtrade.imports_tonnes_annual",
    title: "India gold imports (HS 7108), tonnes", unit: "tonnes", frequency: "annual",
    observations: YEARS.map((y) => ({ date: annDate(y), value: t(giA.get(y)?.kg) })),
    metadata: { method: "UN Comtrade HS 7108 net weight, India imports from World, annual.", note: "2014 weight not reported by Comtrade (gap)." } });

  // --- Gold imports: MONTHLY value + tonnes (currency through latest month) ---
  const giM = await worldSeries({ freq: "M", cmd: "7108", flow: "M", periods: MONTHS });
  await emitSeries({ name: "un-comtrade.IN.gold.comtrade.imports_value_monthly", indicator: "gold.comtrade.imports_value_monthly",
    title: "India monthly gold imports (HS 7108), US$ billion", unit: "current US$ billion", frequency: "monthly",
    observations: MONTHS.filter((p) => giM.has(p)).map((p) => ({ date: monDate(p), value: bn(giM.get(p)?.usd) })),
    metadata: { method: "UN Comtrade HS 7108, India imports from World, monthly.", note: "Annual data stops at 2024; monthly carries the 2025-26 surge." } });
  await emitSeries({ name: "un-comtrade.IN.gold.comtrade.imports_tonnes_monthly", indicator: "gold.comtrade.imports_tonnes_monthly",
    title: "India monthly gold imports (HS 7108), tonnes", unit: "tonnes", frequency: "monthly",
    observations: MONTHS.filter((p) => giM.has(p)).map((p) => ({ date: monDate(p), value: t(giM.get(p)?.kg) })),
    metadata: { method: "UN Comtrade HS 7108 net weight, India imports, monthly.", note: "Compare with value to see the 'paid more for less' price effect." } });

  // --- Jewellery (HS 7113): exports + imports by VALUE (weight glitched) ---
  const jX = await worldSeries({ freq: "A", cmd: "7113", flow: "X", periods: YEARS });
  await emitSeries({ name: "un-comtrade.IN.gold.comtrade.jewellery_exports_value_annual", indicator: "gold.comtrade.jewellery_exports_value_annual",
    title: "India jewellery exports (HS 7113), US$ billion", unit: "current US$ billion", frequency: "annual",
    observations: YEARS.map((y) => ({ date: annDate(y), value: bn(jX.get(y)?.usd) })),
    metadata: { method: "UN Comtrade HS 7113 (jewellery), India exports to World, annual, by value.", note: "The re-export engine: raw gold in, jewellery out. Weight is unreliable for 7113; value only." } });
  const jM = await worldSeries({ freq: "A", cmd: "7113", flow: "M", periods: YEARS });
  await emitSeries({ name: "un-comtrade.IN.gold.comtrade.jewellery_imports_value_annual", indicator: "gold.comtrade.jewellery_imports_value_annual",
    title: "India jewellery imports (HS 7113), US$ billion", unit: "current US$ billion", frequency: "annual",
    observations: YEARS.map((y) => ({ date: annDate(y), value: bn(jM.get(y)?.usd) })),
    metadata: { method: "UN Comtrade HS 7113, India imports from World, annual, by value.", note: "Surge to 2024 triggered the 2026 DGFT import restriction." } });

  // --- By-partner tables (latest full year = 2024) ---
  await emitPartnerTable({ name: "un-comtrade.IN.gold.comtrade.imports_by_partner.2024", indicator: "gold.comtrade.imports_by_partner",
    title: "Where India's gold comes from (2024)", cmd: "7108", flow: "M", period: "2024" });
  await emitPartnerTable({ name: "un-comtrade.IN.gold.comtrade.jewellery_exports_by_partner.2024", indicator: "gold.comtrade.jewellery_exports_by_partner",
    title: "Where India's gold jewellery goes (2024)", cmd: "7113", flow: "X", period: "2024" });
} catch (err) {
  console.error("gold comtrade ingest error:", err.message);
}

await mergeSourceManifest("un-comtrade", manifest);
console.log(`gold comtrade ingest done: ${manifest.length} artifacts.`);
