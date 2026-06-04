// Derive clean, chart-ready SERIES artifacts for the "How India Trades with the
// World" flagship from the raw WTO table artifacts. Comtrade partner/commodity
// tables and World Bank series are consumed directly by the renderer, so they
// are not re-derived here. Values are converted to US$ billions (WTO reports
// US$ million) unless noted.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SRC = "https://stats.wto.org/";
const manifest = [];

const load = async (file) => JSON.parse(await readFile(`data/series/${file}`, "utf8"));
const round = (n, d = 2) => (n === null || n === undefined || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d);

// Index a WTO artifact's rows: { [reporterCode]: { [productCode]: { [year]: value } } }
function indexWto(rows) {
  const idx = new Map();
  for (const r of rows) {
    const rep = String(r.ReportingEconomyCode ?? "");
    const pc = String(r.ProductOrSectorCode ?? "");
    const yr = Number(r.Year);
    const val = Number(r.Value);
    if (!rep || !Number.isFinite(yr) || !Number.isFinite(val)) continue;
    if (!idx.has(rep)) idx.set(rep, new Map());
    const byPc = idx.get(rep);
    if (!byPc.has(pc)) byPc.set(pc, new Map());
    byPc.get(pc).set(yr, val);
  }
  return idx;
}

function yearSeries(map, { scale = 1000, decimals = 2 } = {}) {
  if (!map) return [];
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([yr, val]) => ({ date: String(yr), value: round(val / scale, decimals) }))
    .filter((o) => o.value !== null);
}

async function emit({ id, title, unit, observations, frequency = "annual", sourceId = "trade-derived", sourceIndicatorId, metadata = {} }) {
  if (!observations.length) {
    console.warn(`derive-trade ${id}: no observations, skipped`);
    return;
  }
  const artifact = createSeriesArtifact({
    indicatorId: id,
    title,
    sourceId,
    sourceIndicatorId: sourceIndicatorId || id,
    sourceUrl: SRC,
    unit,
    frequency,
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    observations,
    metadata: { derivedFrom: "WTO Timeseries API", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: "trade-derived", name: `trade-derived.IN.${id}`, artifact });
  manifest.push({ status: "ready", indicatorId: id, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, observations: observations.length, fetchedAt });
  console.log(`derive-trade ${id} ${observations.length} obs`);
}

// ---- Load raw WTO artifacts ----
const merchX = indexWto((await load("wto.trade.wto.merch_exports_by_product.json")).rows);
const merchM = indexWto((await load("wto.trade.wto.merch_imports_by_product.json")).rows);
const worldX = indexWto((await load("wto.trade.wto.world_merch_exports_total.json")).rows);
const worldM = indexWto((await load("wto.trade.wto.world_merch_imports_total.json")).rows);
const svcX = indexWto((await load("wto.trade.wto.services_exports_by_sector.json")).rows);
const svcM = indexWto((await load("wto.trade.wto.services_imports_by_sector.json")).rows);
const worldSvcX = indexWto((await load("wto.trade.wto.world_services_exports_by_sector.json")).rows);
const peersX = indexWto((await load("wto.trade.wto.merch_exports_peers.json")).rows);
const peersSvcX = indexWto((await load("wto.trade.wto.services_exports_peers.json")).rows);

const IND = "356";
const get = (idx, rep, pc) => idx.get(rep)?.get(pc) || null;

// ---- 1. Headline merchandise levels (US$ bn) ----
await emit({ id: "trade.derived.merch_exports", title: "Merchandise exports", unit: "US$ billions", observations: yearSeries(get(merchX, IND, "TO")), metadata: { product: "Total merchandise" } });
await emit({ id: "trade.derived.merch_imports", title: "Merchandise imports", unit: "US$ billions", observations: yearSeries(get(merchM, IND, "TO")), metadata: { product: "Total merchandise" } });

// ---- 2. Trade balance (exports - imports, US$ bn) ----
{
  const x = get(merchX, IND, "TO");
  const m = get(merchM, IND, "TO");
  const obs = x && m ? [...x.keys()].filter((y) => m.has(y)).sort((a, b) => a - b)
    .map((y) => ({ date: String(y), value: round((x.get(y) - m.get(y)) / 1000) })) : [];
  await emit({ id: "trade.derived.merch_balance", title: "Merchandise trade balance", unit: "US$ billions", observations: obs, metadata: { formula: "exports − imports" } });
}

// ---- 3. World export/import share (%) ----
function shareSeries(numMap, denMap) {
  if (!numMap || !denMap) return [];
  return [...numMap.keys()].filter((y) => denMap.has(y) && denMap.get(y)).sort((a, b) => a - b)
    .map((y) => ({ date: String(y), value: round((numMap.get(y) / denMap.get(y)) * 100, 2) }));
}
await emit({ id: "trade.derived.merch_export_world_share", title: "India's share of world merchandise exports", unit: "% of world", observations: shareSeries(get(merchX, IND, "TO"), get(worldX, "000", "TO")), metadata: { formula: "India / World × 100" } });
await emit({ id: "trade.derived.merch_import_world_share", title: "India's share of world merchandise imports", unit: "% of world", observations: shareSeries(get(merchM, IND, "TO"), get(worldM, "000", "TO")), metadata: { formula: "India / World × 100" } });

// ---- 4. Services levels + world share (commercial services = SOX) ----
await emit({ id: "trade.derived.services_exports", title: "Commercial services exports", unit: "US$ billions", observations: yearSeries(get(svcX, IND, "SOX")), metadata: { sector: "Commercial services (SOX)" } });
await emit({ id: "trade.derived.services_imports", title: "Commercial services imports", unit: "US$ billions", observations: yearSeries(get(svcM, IND, "SOX")), metadata: { sector: "Commercial services (SOX)" } });
await emit({ id: "trade.derived.services_export_world_share", title: "India's share of world commercial services exports", unit: "% of world", observations: shareSeries(get(svcX, IND, "SOX"), get(worldSvcX, "000", "SOX")), metadata: { formula: "India / World × 100" } });

// ---- 5. Services composition (US$ bn): IT/other, travel, transport ----
await emit({ id: "trade.derived.services_other_commercial", title: "Other commercial services exports (incl. IT/software)", unit: "US$ billions", observations: yearSeries(get(svcX, IND, "SOX1")), metadata: { sector: "Other commercial services (SOX1)" } });
await emit({ id: "trade.derived.services_travel", title: "Travel services exports", unit: "US$ billions", observations: yearSeries(get(svcX, IND, "SD")), metadata: { sector: "Travel (SD)" } });
await emit({ id: "trade.derived.services_transport", title: "Transport services exports", unit: "US$ billions", observations: yearSeries(get(svcX, IND, "SC")), metadata: { sector: "Transport (SC)" } });

// ---- 6. Goods vs services share of total exports (%) ----
{
  const g = get(merchX, IND, "TO");
  const s = get(svcX, IND, "SOX");
  const obs = g && s ? [...g.keys()].filter((y) => s.has(y)).sort((a, b) => a - b)
    .map((y) => ({ date: String(y), value: round((s.get(y) / (g.get(y) + s.get(y))) * 100, 1) })) : [];
  await emit({ id: "trade.derived.services_share_of_exports", title: "Services as a share of India's total exports", unit: "% of goods + services exports", observations: obs, metadata: { formula: "services / (goods + services) × 100" } });
}

// ---- 7. Export-basket composition over time (US$ bn, key SITC groups) ----
const basket = [
  ["MA", "trade.derived.merch_exports_manufactures", "Manufactures exports"],
  ["MI", "trade.derived.merch_exports_fuels_mining", "Fuels & mining exports"],
  ["AG", "trade.derived.merch_exports_agriculture", "Agricultural exports"],
  ["MACH", "trade.derived.merch_exports_chemicals", "Chemicals exports"]
];
for (const [pc, id, title] of basket) {
  await emit({ id, title, unit: "US$ billions", observations: yearSeries(get(merchX, IND, pc)), metadata: { product: pc } });
}

// ---- 8. Peer merchandise exports (US$ bn) for the "catching up" comparison ----
const merchPeers = [["356", "ind", "India"], ["156", "chn", "China"], ["704", "vnm", "Viet Nam"], ["050", "bgd", "Bangladesh"], ["360", "idn", "Indonesia"]];
for (const [code, slug, name] of merchPeers) {
  await emit({ id: `trade.derived.merch_exports_${slug}`, title: `Merchandise exports — ${name}`, unit: "US$ billions", observations: yearSeries(get(peersX, code, "TO")), metadata: { reporter: name } });
}

// ---- 9. Peer commercial-services exports (US$ bn) ----
const svcPeers = [["356", "ind", "India"], ["156", "chn", "China"], ["410", "kor", "South Korea"], ["608", "phl", "Philippines"], ["840", "usa", "United States"], ["826", "gbr", "United Kingdom"]];
for (const [code, slug, name] of svcPeers) {
  await emit({ id: `trade.derived.services_exports_${slug}`, title: `Commercial services exports — ${name}`, unit: "US$ billions", observations: yearSeries(get(peersSvcX, code, "SOX")), metadata: { reporter: name } });
}

// ---- 10. Recent monthly merchandise (US$ bn, date YYYY-MM, last ~72 months) ----
function monthlySeries(rows, months = 72) {
  const obs = rows
    .map((r) => {
      const yr = Number(r.Year);
      const mc = String(r.PeriodCode || "");
      const mm = mc.startsWith("M") ? mc.slice(1).padStart(2, "0") : null;
      const val = Number(r.Value);
      if (!Number.isFinite(yr) || !mm || !Number.isFinite(val)) return null;
      return { date: `${yr}-${mm}`, value: round(val / 1000) };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  return obs.slice(-months);
}
await emit({ id: "trade.derived.merch_exports_monthly", title: "Monthly merchandise exports", unit: "US$ billions", frequency: "monthly", observations: monthlySeries((await load("wto.trade.wto.merch_exports_monthly.json")).rows) });
await emit({ id: "trade.derived.merch_imports_monthly", title: "Monthly merchandise imports", unit: "US$ billions", frequency: "monthly", observations: monthlySeries((await load("wto.trade.wto.merch_imports_monthly.json")).rows) });

// ---- 11. India MFN applied tariffs (%) ----
const tariffs = [
  ["wto.trade.wto.tariff_mfn_all.json", "trade.derived.tariff_mfn_all", "MFN applied tariff — all products"],
  ["wto.trade.wto.tariff_mfn_agri.json", "trade.derived.tariff_mfn_agri", "MFN applied tariff — agricultural products"],
  ["wto.trade.wto.tariff_mfn_nonagri.json", "trade.derived.tariff_mfn_nonagri", "MFN applied tariff — non-agricultural products"]
];
for (const [file, id, title] of tariffs) {
  const rows = (await load(file)).rows;
  const obs = rows.map((r) => ({ date: String(r.Year), value: round(Number(r.Value), 1) })).filter((o) => o.value !== null).sort((a, b) => a.date.localeCompare(b.date));
  await emit({ id, title, unit: "% (simple average)", observations: obs });
}

// ---- 12. The "who pays for the deficit" story: services & net balances ----
const gx = get(merchX, IND, "TO");
const gm = get(merchM, IND, "TO");
const sx = get(svcX, IND, "SOX");
const sm = get(svcM, IND, "SOX");
const yrsBoth = (a, b) => (a && b ? [...a.keys()].filter((y) => b.has(y)).sort((p, q) => p - q) : []);
await emit({ id: "trade.derived.services_balance", title: "Commercial services trade balance", unit: "US$ billions",
  observations: yrsBoth(sx, sm).map((y) => ({ date: String(y), value: round((sx.get(y) - sm.get(y)) / 1000) })), metadata: { formula: "services exports − imports" } });
{
  const yrs = gx && gm && sx && sm ? [...gx.keys()].filter((y) => gm.has(y) && sx.has(y) && sm.has(y)).sort((p, q) => p - q) : [];
  await emit({ id: "trade.derived.net_goods_services_balance", title: "Net trade balance (goods + services)", unit: "US$ billions",
    observations: yrs.map((y) => ({ date: String(y), value: round(((gx.get(y) - gm.get(y)) + (sx.get(y) - sm.get(y))) / 1000) })), metadata: { formula: "(goods + services) exports − imports" } });
}

// ---- 13. Remittances — the third leg that pays for the goods deficit ----
const loadObs = async (file) => {
  try {
    const a = JSON.parse(await readFile(`data/series/${file}`, "utf8"));
    const m = new Map();
    for (const o of a.observations || []) if (o.value != null && Number.isFinite(o.value)) m.set(String(o.date).slice(0, 4), o.value);
    return m;
  } catch { return new Map(); }
};
const remit = await loadObs("worldbank.IN.BX_TRF_PWKR_CD_DT.json");
const gdp = await loadObs("worldbank.IN.NY_GDP_MKTP_CD.json");
const pop = await loadObs("worldbank.IN.SP_POP_TOTL.json");
await emit({ id: "trade.derived.remittances", title: "Personal remittances received", unit: "US$ billions",
  observations: [...remit.entries()].sort().map(([y, v]) => ({ date: y, value: round(v / 1e9) })), metadata: { source: "World Bank" } });
await emit({ id: "trade.derived.remittances_gdp", title: "Remittances as a share of GDP", unit: "% of GDP",
  observations: [...remit.keys()].filter((y) => gdp.has(y) && gdp.get(y)).sort().map((y) => ({ date: y, value: round((remit.get(y) / gdp.get(y)) * 100, 2) })), metadata: { formula: "remittances / GDP × 100" } });

// ---- 14. Import basket over time ----
const importBasket = [
  ["MA", "trade.derived.merch_imports_manufactures", "Manufactures imports"],
  ["MI", "trade.derived.merch_imports_fuels_mining", "Fuels & mining imports"],
  ["MAMT", "trade.derived.merch_imports_machinery", "Machinery & transport imports"],
  ["AG", "trade.derived.merch_imports_agriculture", "Agricultural imports"]
];
for (const [pc, id, title] of importBasket) await emit({ id, title, unit: "US$ billions", observations: yearSeries(get(merchM, IND, pc)), metadata: { product: pc } });

// ---- 15. Real vs nominal growth + terms of trade (WTO fixed-base indices) ----
const wtoIndex = async (file) => {
  const m = new Map();
  try { for (const r of (await load(file)).rows) { const y = Number(r.Year), v = Number(r.Value); if (Number.isFinite(y) && Number.isFinite(v)) m.set(y, v); } } catch {}
  return m;
};
const valIdx = await wtoIndex("wto.trade.wto.merch_export_value_index.json");
const volIdx = await wtoIndex("wto.trade.wto.merch_export_volume_index.json");
const expUV = await wtoIndex("wto.trade.wto.merch_export_unitvalue_index.json");
const impUV = await wtoIndex("wto.trade.wto.merch_import_unitvalue_index.json");
const idxObs = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]).map(([y, v]) => ({ date: String(y), value: round(v, 1) }));
await emit({ id: "trade.derived.export_value_index", title: "Export value index (nominal)", unit: "index, 2015=100", observations: idxObs(valIdx) });
await emit({ id: "trade.derived.export_volume_index", title: "Export volume index (real)", unit: "index, 2015=100", observations: idxObs(volIdx) });
await emit({ id: "trade.derived.terms_of_trade", title: "Terms of trade", unit: "index (2015=100)",
  observations: [...expUV.keys()].filter((y) => impUV.has(y) && impUV.get(y)).sort((a, b) => a - b).map((y) => ({ date: String(y), value: round((expUV.get(y) / impUV.get(y)) * 100, 1) })), metadata: { formula: "export unit value / import unit value × 100" } });

// ---- 16. Trade per capita ----
{
  const yrs = gx && gm ? [...gx.keys()].filter((y) => gm.has(y) && pop.has(String(y))).sort((a, b) => a - b) : [];
  await emit({ id: "trade.derived.trade_per_capita", title: "Trade per person", unit: "US$ per person",
    observations: yrs.map((y) => ({ date: String(y), value: round(((gx.get(y) + gm.get(y)) * 1e6) / pop.get(String(y)), 0) })), metadata: { formula: "(exports + imports) / population" } });
  await emit({ id: "trade.derived.exports_per_capita", title: "Exports per person", unit: "US$ per person",
    observations: yrs.map((y) => ({ date: String(y), value: round((gx.get(y) * 1e6) / pop.get(String(y)), 0) })), metadata: { formula: "exports / population" } });
}

// ---- 17. The Asian divergence: peer world-export shares + absolute exports ----
const worldTO = get(worldX, "000", "TO");
const sharePeers = [["356", "ind", "India"], ["156", "chn", "China"], ["410", "kor", "South Korea"], ["704", "vnm", "Viet Nam"], ["764", "tha", "Thailand"], ["458", "mys", "Malaysia"], ["050", "bgd", "Bangladesh"]];
for (const [code, slug, name] of sharePeers) {
  const c = get(peersX, code, "TO");
  if (!c || !worldTO) continue;
  await emit({ id: `trade.derived.merch_export_share_${slug}`, title: `Share of world merchandise exports — ${name}`, unit: "% of world",
    observations: [...c.keys()].filter((y) => worldTO.has(y) && worldTO.get(y)).sort((a, b) => a - b).map((y) => ({ date: String(y), value: round((c.get(y) / worldTO.get(y)) * 100, 2) })), metadata: { reporter: name } });
}
for (const [code, slug, name] of [["410", "kor", "South Korea"], ["764", "tha", "Thailand"], ["458", "mys", "Malaysia"]]) {
  await emit({ id: `trade.derived.merch_exports_${slug}`, title: `Merchandise exports — ${name}`, unit: "US$ billions", observations: yearSeries(get(peersX, code, "TO")), metadata: { reporter: name } });
}

// ---- 18. China & Russia bilateral relationships over time ----
function bilateral(rows, flow) {
  const m = new Map();
  for (const r of rows) { const y = Number(r.refYear ?? r.period); const fc = String(r.flowCode || ""); const v = Number(r.primaryValue); if (fc === flow && Number.isFinite(y) && Number.isFinite(v)) m.set(y, v); }
  return m;
}
async function emitBilateral(file, slug, name) {
  let rows = [];
  try { rows = (await load(file)).rows; } catch { return; }
  const x = bilateral(rows, "X"), m = bilateral(rows, "M");
  await emit({ id: `trade.derived.${slug}_exports`, title: `India's exports to ${name}`, unit: "US$ billions", observations: [...x.entries()].sort((a, b) => a[0] - b[0]).map(([y, v]) => ({ date: String(y), value: round(v / 1e9) })) });
  await emit({ id: `trade.derived.${slug}_imports`, title: `India's imports from ${name}`, unit: "US$ billions", observations: [...m.entries()].sort((a, b) => a[0] - b[0]).map(([y, v]) => ({ date: String(y), value: round(v / 1e9) })) });
  await emit({ id: `trade.derived.${slug}_balance`, title: `India's trade balance with ${name}`, unit: "US$ billions", observations: [...x.keys()].filter((y) => m.has(y)).sort((a, b) => a - b).map((y) => ({ date: String(y), value: round((x.get(y) - m.get(y)) / 1e9) })) });
}
await emitBilateral("un-comtrade.IN.trade.comtrade.china_bilateral.json", "china", "China");
await emitBilateral("un-comtrade.IN.trade.comtrade.russia_bilateral.json", "russia", "Russia");

// ---- 19. Regional composition of trade (benchmark years) ----
const REGION_OF = {};
const REGION_GROUPS = {
  east_se_asia: { label: "East & SE Asia", codes: [156, 392, 410, 408, 344, 490, 702, 458, 764, 704, 360, 608, 104, 116, 418, 96, 496, 446] },
  south_asia: { label: "South Asia", codes: [50, 144, 524, 586, 64, 462, 4] },
  middle_east: { label: "Middle East", codes: [784, 682, 368, 364, 634, 414, 512, 376, 400, 48, 887, 422, 760, 792] },
  europe: { label: "Europe & CIS", codes: [528, 826, 276, 56, 380, 250, 724, 757, 616, 752, 300, 40, 208, 372, 620, 203, 246, 578, 643, 398, 804, 112, 860, 31, 705, 348, 642, 100, 191, 196, 233, 428, 440] },
  north_america: { label: "North America", codes: [842, 124, 484] },
  africa: { label: "Africa", codes: [710, 566, 818, 404, 834, 504, 12, 288, 231, 24, 508, 729, 768, 384, 480, 686, 434, 788, 180, 894, 716, 800, 854, 466, 562] },
  rest: { label: "Latin America & Oceania", codes: [76, 32, 152, 604, 170, 862, 218, 591, 600, 858, 36, 554, 598, 242] }
};
for (const [slug, g] of Object.entries(REGION_GROUPS)) for (const c of g.codes) REGION_OF[c] = slug;
async function emitRegional(file, prefix, flowLabel) {
  let rows = [];
  try { rows = (await load(file)).rows; } catch { return; }
  const byRegionYear = new Map(); // slug -> Map(year->value)
  for (const r of rows) {
    const pc = Number(r.partnerCode);
    if (!pc) continue; // skip World
    const slug = REGION_OF[pc] || "rest";
    const y = Number(r.refYear ?? r.period);
    const v = Number(r.primaryValue);
    if (!Number.isFinite(y) || !Number.isFinite(v)) continue;
    if (!byRegionYear.has(slug)) byRegionYear.set(slug, new Map());
    const ym = byRegionYear.get(slug);
    ym.set(y, (ym.get(y) || 0) + v);
  }
  for (const [slug, g] of Object.entries(REGION_GROUPS)) {
    const ym = byRegionYear.get(slug);
    if (!ym) continue;
    await emit({ id: `trade.derived.${prefix}_region_${slug}`, title: `${flowLabel} — ${g.label}`, unit: "US$ billions",
      observations: [...ym.entries()].sort((a, b) => a[0] - b[0]).map(([y, v]) => ({ date: String(y), value: round(v / 1e9) })), metadata: { region: g.label } });
  }
}
await emitRegional("un-comtrade.IN.trade.comtrade.exports_by_partner_history.json", "exports", "Exports by region");
await emitRegional("un-comtrade.IN.trade.comtrade.imports_by_partner_history.json", "imports", "Imports by region");

// ---- 20. Tariff comparison: India vs peers (from multi-reporter WTO table) ----
{
  let rows = [];
  try { rows = (await load("wto.trade.wto.tariff_mfn_peers.json")).rows; } catch {}
  const tariffPeers = [["356", "ind", "India"], ["156", "chn", "China"], ["410", "kor", "South Korea"], ["704", "vnm", "Viet Nam"], ["360", "idn", "Indonesia"], ["840", "usa", "United States"]];
  for (const [code, slug, name] of tariffPeers) {
    const obs = rows.filter((r) => String(r.ReportingEconomyCode) === code).map((r) => ({ date: String(r.Year), value: round(Number(r.Value), 1) })).filter((o) => o.value !== null).sort((a, b) => a.date.localeCompare(b.date));
    await emit({ id: `trade.derived.tariff_${slug}`, title: `MFN applied tariff — ${name}`, unit: "% (simple average)", observations: obs, metadata: { reporter: name } });
  }
}

// ---- 21. Revealed Comparative Advantage (RCA) by product group ----
// RCA_p = (India's share of its exports in p) / (world's share of its exports in p).
// > 1 means India is more specialised in p than the world average.
{
  let worldByProduct = new Map();
  try { worldByProduct = indexWto((await load("wto.trade.wto.world_merch_exports_by_product.json")).rows).get("000") || new Map(); } catch {}
  const indiaByProduct = merchX.get(IND) || new Map();
  const indiaTot = indiaByProduct.get("TO");
  const worldTot = worldByProduct.get("TO");
  const rcaGroups = [
    ["MACHPH", "pharma", "Pharmaceuticals"], ["MACL", "clothing", "Clothing"], ["MATE", "textiles", "Textiles"],
    ["MACH", "chemicals", "Chemicals"], ["MAIS", "iron_steel", "Iron & steel"], ["AG", "agriculture", "Agriculture"],
    ["MIFU", "fuels", "Fuels"], ["MAMTAU", "automotive", "Automotive"], ["MAMT", "machinery", "Machinery & transport"],
    ["MAMTOF", "office_telecom", "Office & telecom"]
  ];
  for (const [pc, slug, name] of rcaGroups) {
    const ip = indiaByProduct.get(pc), wp = worldByProduct.get(pc);
    if (!ip || !wp || !indiaTot || !worldTot) continue;
    const yrs = [...ip.keys()].filter((y) => wp.has(y) && indiaTot.has(y) && worldTot.has(y) && wp.get(y) && worldTot.get(y)).sort((a, b) => a - b);
    const obs = yrs.map((y) => ({ date: String(y), value: round((ip.get(y) / indiaTot.get(y)) / (wp.get(y) / worldTot.get(y)), 2) })).filter((o) => o.value !== null);
    await emit({ id: `trade.derived.rca_${slug}`, title: `Revealed comparative advantage — ${name}`, unit: "RCA index (>1 = specialised)", observations: obs, metadata: { product: pc, formula: "(India_p/India_total)/(World_p/World_total)" } });
  }
}

// ---- 22. Export partner concentration: top-5 share over time ----
{
  let rows = [];
  try { rows = (await load("un-comtrade.IN.trade.comtrade.exports_by_partner_history.json")).rows; } catch {}
  const byYear = new Map(); // year -> [values]
  for (const r of rows) {
    const pc = Number(r.partnerCode);
    if (!pc) continue;
    const y = Number(r.refYear ?? r.period);
    const v = Number(r.primaryValue);
    if (!Number.isFinite(y) || !Number.isFinite(v) || v <= 0) continue;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(v);
  }
  const obs = [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([y, vals]) => {
    const total = vals.reduce((s, v) => s + v, 0);
    const top5 = vals.sort((a, b) => b - a).slice(0, 5).reduce((s, v) => s + v, 0);
    return { date: String(y), value: total ? round((top5 / total) * 100, 1) : null };
  }).filter((o) => o.value !== null);
  await emit({ id: "trade.derived.export_partner_top5_share", title: "Share of exports going to top-5 partners", unit: "% of exports", observations: obs, metadata: { formula: "sum(top 5 partners) / total exports × 100" } });
}

await writeSourceManifest("trade-derived", manifest);
console.log(`Wrote ${manifest.length} derived trade series artifacts.`);
