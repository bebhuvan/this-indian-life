// Extend the gold flagship's Comtrade ANNUAL series to calendar-year 2025.
//
// Comtrade has not yet published India's CY2025 annual aggregate (the API returns
// empty for period=2025), but the MONTHLY series is complete through Mar 2026. So
// we build CY2025 = sum of the 12 monthly observations for each annual series:
//   - gold.comtrade.imports_value_annual      (HS 7108, US$bn)  [7108 monthly already in repo]
//   - gold.comtrade.imports_tonnes_annual     (HS 7108, tonnes) [7108 monthly already in repo]
//   - gold.comtrade.jewellery_exports_value_annual (HS 7113 X)  [fetch 7113 monthly 2025]
//   - gold.comtrade.jewellery_imports_value_annual (HS 7113 M)  [fetch 7113 monthly 2025]
//
// By-partner tables stay at 2024 (partner shares are stable; 2025 would need 12
// monthly partner fetches). Idempotent: replaces an existing 2025-12-31 point.
import fs from "fs";
import path from "path";
import { loadEnv } from "./env.mjs";
import { canonicalComtradeRows } from "./adapters/un-comtrade.mjs";

loadEnv();
const BASE = process.env.UN_COMTRADE_BASE_URL || "https://comtradeapi.un.org";
const KEY = process.env.UN_COMTRADE_API_KEY || process.env.UN_COMTRADE__PRIMARY_API_KEY
  || process.env.COMTRADE_API_KEY || process.env.UN_COMTRADE__SECONDARY_API_KEY;
if (!KEY) throw new Error("No UN Comtrade API key in env.");
const SERDIR = "data/series";
const FETCHED = new Date().toISOString();
const CY = "2025";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bn = (v) => (Number.isFinite(v) ? Math.round((v / 1e9) * 1000) / 1000 : null);
const t = (v) => (Number.isFinite(v) ? Math.round((v / 1000) * 10) / 10 : null);

async function fetchComtrade({ cmd, flow, period }) {
  const url = `${BASE}/data/v1/get/C/M/HS?reporterCode=699&period=${period}`
    + `&partnerCode=0&cmdCode=${cmd}&flowCode=${flow}&includeDesc=true`;
  for (let a = 0; a < 5; a++) {
    const res = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": KEY } });
    if (res.status === 429) { await sleep(3000 * (a + 1)); continue; }
    if (!res.ok) { if (a === 4) throw new Error(`HTTP ${res.status}`); await sleep(2000 * (a + 1)); continue; }
    const b = await res.json();
    return Array.isArray(b?.data) ? b.data : [];
  }
  return [];
}

// CY2025 from already-ingested monthly file (sum of 12 obs)
function cyFromMonthlyFile(name, year) {
  const d = JSON.parse(fs.readFileSync(path.join(SERDIR, `${name}.json`)));
  const obs = d.observations.filter((o) => String(o.date).startsWith(String(year)) && o.value != null);
  if (obs.length !== 12) return null;
  return Math.round(obs.reduce((s, o) => s + o.value, 0) * 1000) / 1000;
}

// CY2025 USD value from a 7113 monthly API pull (sum of 12 canonical months)
async function cyJewelleryValue(flow) {
  const months = Array.from({ length: 12 }, (_, i) => `${CY}${String(i + 1).padStart(2, "0")}`);
  const rows = canonicalComtradeRows(await fetchComtrade({ cmd: "7113", flow, period: months.join(",") }));
  if (rows.length < 12) { console.warn(`  7113 ${flow}: only ${rows.length}/12 months — skipping`); return null; }
  return bn(rows.reduce((s, r) => s + (r.primaryValue || 0), 0));
}

function appendPoint(name, value, noteSuffix) {
  if (value == null) { console.warn(`  ${name}: no value, skip`); return; }
  const p = path.join(SERDIR, `${name}.json`);
  const d = JSON.parse(fs.readFileSync(p));
  const date = `${CY}-12-31`;
  d.observations = d.observations.filter((o) => o.date !== date);
  d.observations.push({ date, value });
  d.observations.sort((a, b) => a.date.localeCompare(b.date));
  d.fetchedAt = FETCHED;
  d.metadata = d.metadata || {};
  d.metadata.note = (d.metadata.note ? d.metadata.note + " " : "")
    + `CY2025 = sum of 12 monthly Comtrade obs (annual aggregate not yet published).${noteSuffix || ""}`;
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
  console.log(`  ${name}: set ${date} = ${value}`);
}

(async () => {
  console.log("Extending Comtrade gold annual series to CY2025...");
  // 7108 from monthly files already in repo
  appendPoint("un-comtrade.IN.gold.comtrade.imports_value_annual",
    cyFromMonthlyFile("un-comtrade.IN.gold.comtrade.imports_value_monthly", CY));
  appendPoint("un-comtrade.IN.gold.comtrade.imports_tonnes_annual",
    cyFromMonthlyFile("un-comtrade.IN.gold.comtrade.imports_tonnes_monthly", CY));
  // 7113 jewellery: fetch monthly 2025 and sum
  appendPoint("un-comtrade.IN.gold.comtrade.jewellery_exports_value_annual", await cyJewelleryValue("X"));
  await sleep(800);
  appendPoint("un-comtrade.IN.gold.comtrade.jewellery_imports_value_annual", await cyJewelleryValue("M"));
  console.log("Done. Re-run derive-gold.py to refresh derived series.");
})();
