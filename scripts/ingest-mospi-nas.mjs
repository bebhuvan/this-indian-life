// Ingest MOSPI eSankhyiki National Accounts Statistics (NAS) into Indica series.
// MOSPI is the source of truth for India's national accounts; this retires the
// IndiaDataHub NAS spine (econ.idh.*) for the "How big is India's economy?" page.
//
// Splicing: the long annual spine (1950-51 -> latest) is base 2011-12, series
// Current (2011-12 ->) joined to series Back (1950-51 -> 2010-11). Both are on the
// 2011-12 base (NSO back-cast the Back series), so the join is clean. Each fiscal
// year repeats across estimate revisions; we keep the MOST-FINAL per year and
// prefer Current over Back at the 2011-12 overlap. Values arrive in ₹ crore and
// are stored in rupees (x1e7) to match the existing econ artifacts.
//
// Derived series (shares, per-capita, saving rate, growth) are emitted as their
// own artifacts because the prose generator only auto-locks each series' latest +
// earliest value — a number the article cites must exist as a series.
// Source: https://esankhyiki.mospi.gov.in/macroindicators?product=nas (open, no auth)
import { readFile, readdir } from "node:fs/promises";
import { fetchNas } from "./adapters/mospi.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://esankhyiki.mospi.gov.in/macroindicators?product=nas";
const CRORE = 1e7; // ₹ crore -> rupees
const manifest = [];

// MOSPI_USE_CACHE=1 rebuilds series from the raw snapshots written by a prior run
// (data/snapshots/mospi/nas_i*) instead of hitting the API — useful when the host
// is rate-limiting or offline. The snapshot payload is the verbatim API response.
const SNAP_DIR = new URL("../data/snapshots/mospi/", import.meta.url);
const USE_CACHE = process.env.MOSPI_USE_CACHE === "1";
async function readSnapshot(code, series, freq) {
  const prefix = `nas_i${code}_${series}_f${freq}.`;
  const files = await readdir(SNAP_DIR).catch(() => []);
  const match = files.find((f) => f.startsWith(prefix));
  return match ? JSON.parse(await readFile(new URL(match, SNAP_DIR), "utf8")) : null;
}

// Revision finality rank (higher = more final). Back-series rows have revision
// null; give them a low baseline so any Current estimate wins at the overlap.
const REV_RANK = {
  "Final Estimates": 80,
  "Third Revised Estimates": 70,
  "Second Revised Estimates": 60,
  "First Revised Estimates": 50,
  "Additional Revision": 45,
  "Provisional Estimates": 40,
  "Second Advance Estimates": 20,
  "First Advance Estimates": 10
};
const revRank = (r) => (r == null ? 5 : (REV_RANK[r] ?? 5));
const num = (v) => (v == null || v === "" ? null : Number(v));
const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

// Fiscal year "2025-26" / "1999-2000" -> { startYear, endYear }.
function parseFY(yearStr) {
  const startYear = Number(String(yearStr).split("-")[0]);
  return { startYear, endYear: startYear + 1 };
}
// Annual fiscal year ends 31 March of the second year, matching existing artifacts.
const annualDate = (yearStr) => `${parseFY(yearStr).endYear}-03-31`;
function quarterDate(yearStr, q) {
  const { startYear, endYear } = parseFY(yearStr);
  return { Q1: `${startYear}-06-30`, Q2: `${startYear}-09-30`, Q3: `${startYear}-12-31`, Q4: `${endYear}-03-31` }[q];
}

// Fetch every row for an indicator across Current(+Back) (annual) or Current
// (quarterly), snapshotting each raw payload.
async function fetchRows(indicatorCode, { freq = 1, withBack = true } = {}) {
  const out = [];
  const seriesList = freq === 2 ? ["Current"] : withBack ? ["Current", "Back"] : ["Current"];
  for (const series of seriesList) {
    let raw = USE_CACHE ? await readSnapshot(indicatorCode, series, freq) : null;
    const cached = Boolean(raw);
    if (!raw) {
      raw = await fetchNas({ indicatorCode, series, frequencyCode: freq });
      await writeSnapshot("mospi", `nas_i${indicatorCode}_${series}_f${freq}`, raw);
    }
    const data = raw?.data || [];
    out.push(...data.map((r) => ({ ...r, _series: series })));
    console.log(`  nas ind=${indicatorCode} ${series} f${freq}: ${data.length} rows${cached ? " (cache)" : ""}`);
  }
  return out;
}

// Collapse rows (a single concept, already dimension-filtered) to one most-final
// estimate per fiscal year. Returns [{date, current, constant}] sorted ascending,
// in ₹ crore.
// Valid fiscal-year labels look like "2025-26" or "1999-2000". MOSPI occasionally
// returns a corrupt bare-year row (e.g. year:"1999" carrying the latest value),
// which would collide with the real "1999-2000" point and spike the chart; reject
// anything not in YYYY-YY(YY) form.
const FY_RE = /^\d{4}-\d{2,4}$/;
function bestAnnualByYear(rows) {
  const byYear = new Map();
  for (const r of rows) {
    if (r.frequency !== "Annual") continue;
    if (!FY_RE.test(String(r.year))) continue;
    const rank = revRank(r.revision) + (r._series === "Current" ? 1000 : 0);
    const prev = byYear.get(r.year);
    if (!prev || rank >= prev.rank) byYear.set(r.year, { rank, row: r });
  }
  return [...byYear.values()]
    .map(({ row }) => ({ date: annualDate(row.year), current: num(row.current_price), constant: num(row.constant_price) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function bestQuarterly(rows) {
  const byKey = new Map();
  for (const r of rows) {
    if (r.frequency !== "Quarterly" || !r.quarter) continue;
    if (!FY_RE.test(String(r.year))) continue;
    const key = `${r.year}|${r.quarter}`;
    const rank = revRank(r.revision);
    const prev = byKey.get(key);
    if (!prev || rank >= prev.rank) byKey.set(key, { rank, row: r });
  }
  return [...byKey.values()]
    .map(({ row }) => ({ date: quarterDate(row.year, row.quarter), current: num(row.current_price), constant: num(row.constant_price) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Sum several level series by date. A date's total is null unless EVERY input
// series contributed (avoids partial sums at the ragged ends of coverage).
function sumByDate(seriesArr) {
  const m = new Map();
  for (const s of seriesArr) {
    for (const o of s) {
      if (!m.has(o.date)) m.set(o.date, { date: o.date, current: 0, constant: 0, nC: 0, nK: 0 });
      const e = m.get(o.date);
      if (o.current != null) { e.current += o.current; e.nC += 1; }
      if (o.constant != null) { e.constant += o.constant; e.nK += 1; }
    }
  }
  const n = seriesArr.length;
  return [...m.values()]
    .map((e) => ({ date: e.date, current: e.nC === n ? e.current : null, constant: e.nK === n ? e.constant : null }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// a - b by date (for net exports = exports - imports).
function diffByDate(a, b) {
  const bmap = new Map(b.map((o) => [o.date, o]));
  return a
    .map((o) => {
      const o2 = bmap.get(o.date);
      const sub = (x, y) => (x == null || y == null ? null : x - y);
      return { date: o.date, current: sub(o.current, o2?.current), constant: sub(o.constant, o2?.constant) };
    })
    .sort((x, y) => x.date.localeCompare(y.date));
}

// share = numerator / denominator x 100, aligned by date.
function shareSeries(numer, denom, key = "current") {
  const dmap = new Map(denom.map((o) => [o.date, o[key]]));
  return numer.map((o) => {
    const d = dmap.get(o.date);
    return { date: o.date, value: o[key] != null && d ? round((o[key] / d) * 100, 2) : null };
  });
}

const toRupees = (rows, key) => rows.map((o) => ({ date: o.date, value: o[key] == null ? null : o[key] * CRORE }));
const asValue = (rows, key) => rows.map((o) => ({ date: o.date, value: o[key] })); // already a % / ratio

async function writeSeries({ indicatorId, title, unit, frequency = "annual", observations, metadata = {}, sourceIndicatorId }) {
  const clean = observations.filter((o) => o.value != null && Number.isFinite(o.value));
  if (clean.length < 2) { console.warn(`  skip ${indicatorId}: <2 obs`); return null; }
  const artifact = createSeriesArtifact({
    indicatorId,
    title,
    sourceId: "mospi",
    sourceIndicatorId: sourceIndicatorId || indicatorId,
    sourceUrl,
    unit,
    frequency,
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations: clean,
    metadata: { sourceCategory: "National Accounts", sourceSubcategory: "NAS", baseYear: "2011-12", sourceOwner: "MoSPI / National Statistical Office", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: "mospi", name: `mospi.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: clean.length, artifact: path, fetchedAt, latest: clean[clean.length - 1] });
  console.log(`  wrote ${indicatorId} (${clean.length} obs, latest ${clean[clean.length - 1].date})`);
  return clean;
}

// Emit nominal + real level artifacts for one aggregate; returns the raw {current,
// constant} rows for downstream derivations.
async function writeLevel(id, label, rows, { real = true } = {}) {
  await writeSeries({ indicatorId: `econ.nas.${id}_nominal`, title: `${label}, nominal`, unit: "rupees", observations: toRupees(rows, "current"), sourceIndicatorId: `NAS_${id}_current` });
  if (real) {
    await writeSeries({ indicatorId: `econ.nas.${id}_real`, title: `${label}, real (2011-12 prices)`, unit: "rupees, 2011-12 prices", observations: toRupees(rows, "constant"), sourceIndicatorId: `NAS_${id}_constant` });
  }
  return rows;
}

// Industry names exactly as returned by the API. We use the ELEVEN fine
// industries that appear in BOTH the Current and Back series (and sum to total
// GVA), not the coarse aggregate rows — the Back series only carries the fine
// names, so matching the aggregates would truncate the long history.
const IND = {
  agri: "Agriculture, Livestock, Forestry and Fishing",
  mining: "Mining and Quarrying",
  mfg: "Manufacturing",
  elec: "Electricity, Gas, Water Supply & Other Utility Services",
  constr: "Construction",
  trade: "Trade, Repair, Hotels and Restaurants",
  transport: "Transport, Storage, Communication & Services Related to Broadcasting",
  financial: "Financial Services",
  realestate: "Real Estate, Ownership of Dwelling & Professional Services",
  pubadmin: "Public Administration and Defence",
  other: "Other Services",
  total: "Total Gross Value Added"
};

try {
  console.log("MOSPI NAS ingest starting…");

  // ---- 1. GDP (annual long spine + quarterly) ----
  const gdp = bestAnnualByYear(await fetchRows(5));
  await writeLevel("gdp", "GDP", gdp);
  const gdpQ = bestQuarterly(await fetchRows(5, { freq: 2 }));
  await writeSeries({ indicatorId: "econ.nas.gdp_nominal_quarterly", title: "GDP, nominal, quarterly", unit: "rupees", frequency: "quarterly", observations: toRupees(gdpQ, "current"), sourceIndicatorId: "NAS_gdp_q_current" });
  await writeSeries({ indicatorId: "econ.nas.gdp_real_quarterly", title: "GDP, real, quarterly (2011-12 prices)", unit: "rupees, 2011-12 prices", frequency: "quarterly", observations: toRupees(gdpQ, "constant"), sourceIndicatorId: "NAS_gdp_q_constant" });

  // ---- 2. GVA by industry (3-sector roll-up + 8-sector detail + total) ----
  const gvaRows = await fetchRows(1);
  // GVA rows come at industry level (subindustry null) AND subindustry level — keep
  // only the industry total for each named industry, else sub-rows pollute the pick.
  const gvaFor = (name) => bestAnnualByYear(gvaRows.filter((r) => r.industry === name && r.subindustry == null));
  const gvaTotal = gvaFor(IND.total);
  const agri = gvaFor(IND.agri);
  const industry = sumByDate([gvaFor(IND.mining), gvaFor(IND.mfg), gvaFor(IND.elec), gvaFor(IND.constr)]);
  // Services as the residual (total − agriculture − industry). The fine service
  // industries aren't published in advance-estimate years (only coarse aggregates
  // are), so summing them truncates at 2023-24; the residual spans every year.
  const services = diffByDate(diffByDate(gvaTotal, agri), industry);
  await writeLevel("gva_total", "Gross Value Added (total)", gvaTotal);
  await writeLevel("gva_agriculture", "GVA — agriculture", agri);
  await writeLevel("gva_industry", "GVA — industry", industry);
  await writeLevel("gva_services", "GVA — services", services);
  // Fine-sector detail (nominal, long) — the eleven industries that sum to total.
  const detail = [
    ["gva_mining", "GVA — mining & quarrying", IND.mining],
    ["gva_manufacturing", "GVA — manufacturing", IND.mfg],
    ["gva_utilities", "GVA — electricity, gas & utilities", IND.elec],
    ["gva_construction", "GVA — construction", IND.constr],
    ["gva_trade_hotels", "GVA — trade, repair, hotels & restaurants", IND.trade],
    ["gva_transport_comm", "GVA — transport, storage & communication", IND.transport],
    ["gva_financial", "GVA — financial services", IND.financial],
    ["gva_realestate", "GVA — real estate, dwellings & professional services", IND.realestate],
    ["gva_public_admin", "GVA — public administration & defence", IND.pubadmin],
    ["gva_other_services", "GVA — other services", IND.other]
  ];
  for (const [id, label, name] of detail) await writeLevel(id, label, gvaFor(name), { real: false });
  // Sector shares of total GVA (also the citable "services is X% of GVA" numbers)
  await writeSeries({ indicatorId: "econ.nas.gva_agriculture_share", title: "Agriculture share of GVA", unit: "% of GVA", observations: shareSeries(agri, gvaTotal), sourceIndicatorId: "NAS_share_agri" });
  await writeSeries({ indicatorId: "econ.nas.gva_industry_share", title: "Industry share of GVA", unit: "% of GVA", observations: shareSeries(industry, gvaTotal), sourceIndicatorId: "NAS_share_industry" });
  await writeSeries({ indicatorId: "econ.nas.gva_services_share", title: "Services share of GVA", unit: "% of GVA", observations: shareSeries(services, gvaTotal), sourceIndicatorId: "NAS_share_services" });
  await writeSeries({ indicatorId: "econ.nas.gva_manufacturing_share", title: "Manufacturing share of GVA", unit: "% of GVA", observations: shareSeries(gvaFor(IND.mfg), gvaTotal), sourceIndicatorId: "NAS_share_mfg" });

  // ---- 3. Expenditure side ----
  const pfce = bestAnnualByYear(await fetchRows(10));
  const gfce = bestAnnualByYear(await fetchRows(11));
  const gfcf = bestAnnualByYear((await fetchRows(9)).filter((r) => r.institutional_sector == null));
  const stock = bestAnnualByYear(await fetchRows(12));
  const valuables = bestAnnualByYear(await fetchRows(13));
  const exports = bestAnnualByYear(await fetchRows(14));
  const imports = bestAnnualByYear(await fetchRows(15));
  const gcf = sumByDate([gfcf, stock, valuables]); // total gross capital formation
  const netExports = diffByDate(exports, imports);
  await writeLevel("pfce", "Private final consumption expenditure", pfce);
  await writeLevel("gfce", "Government final consumption expenditure", gfce);
  await writeLevel("gfcf", "Gross fixed capital formation", gfcf);
  await writeLevel("gcf", "Gross capital formation", gcf);
  await writeLevel("exports", "Exports of goods and services", exports);
  await writeLevel("imports", "Imports of goods and services", imports);
  await writeLevel("net_exports", "Net exports of goods and services", netExports);
  // Expenditure components as % of GDP
  for (const [comp, id, label] of [
    [pfce, "pfce", "Private consumption"],
    [gfce, "gfce", "Government consumption"],
    [gcf, "gcf", "Gross capital formation"],
    [gfcf, "gfcf", "Gross fixed capital formation"],
    [exports, "exports", "Exports"],
    [imports, "imports", "Imports"],
    [netExports, "net_exports", "Net exports"]
  ]) {
    await writeSeries({ indicatorId: `econ.nas.${id}_share_gdp`, title: `${label} as % of GDP`, unit: "% of GDP", observations: shareSeries(comp, gdp), sourceIndicatorId: `NAS_${id}_share_gdp` });
  }

  // ---- 4. Income & saving aggregates ----
  const gni = await writeLevel("gni", "Gross National Income", bestAnnualByYear(await fetchRows(17)));
  const gndi = bestAnnualByYear(await fetchRows(19));
  await writeLevel("gndi", "Gross National Disposable Income", gndi);
  await writeLevel("ndp", "Net Domestic Product", bestAnnualByYear(await fetchRows(7)));
  const cfcRows = (await fetchRows(6)).filter((r) => r.institutional_sector === "Total Consumption of Fixed Capital");
  await writeLevel("cfc", "Consumption of fixed capital (depreciation)", bestAnnualByYear(cfcRows));
  await writeLevel("net_taxes_products", "Net taxes on products", bestAnnualByYear(await fetchRows(2)));
  // GDP - GNI = net primary income paid to the rest of the world ("money that leaves")
  const gdpGniGap = diffByDate(gdp, gni);
  await writeSeries({ indicatorId: "econ.nas.income_paid_abroad_nominal", title: "Net primary income paid abroad (GDP − GNI)", unit: "rupees", observations: toRupees(gdpGniGap, "current"), sourceIndicatorId: "NAS_gdp_gni_gap" });

  // Saving by institutional sector (current price only)
  const savRows = await fetchRows(20, { withBack: false });
  const savFor = (name) => bestAnnualByYear(savRows.filter((r) => r.institutional_sector === name));
  const savTotal = savFor("Total Gross Saving");
  const savHH = savFor("Households Including NPISH");
  const savPrivate = sumByDate([savFor("Private Non-Financial Corporations"), savFor("Private Financial Corporations")]);
  const savPublic = sumByDate([savFor("General Government"), savFor("Public Non-Financial Corporations"), savFor("Public Financial Corporations")]);
  await writeSeries({ indicatorId: "econ.nas.gross_saving_nominal", title: "Gross saving", unit: "rupees", observations: toRupees(savTotal, "current"), sourceIndicatorId: "NAS_saving_total" });
  await writeSeries({ indicatorId: "econ.nas.saving_rate_gdp", title: "Gross saving rate (% of GDP)", unit: "% of GDP", observations: shareSeries(savTotal, gdp), sourceIndicatorId: "NAS_saving_rate" });
  await writeSeries({ indicatorId: "econ.nas.saving_households_share_gdp", title: "Household saving as % of GDP", unit: "% of GDP", observations: shareSeries(savHH, gdp), sourceIndicatorId: "NAS_saving_hh_gdp" });
  await writeSeries({ indicatorId: "econ.nas.saving_private_corp_share_gdp", title: "Private-corporate saving as % of GDP", unit: "% of GDP", observations: shareSeries(savPrivate, gdp), sourceIndicatorId: "NAS_saving_priv_gdp" });
  await writeSeries({ indicatorId: "econ.nas.saving_public_share_gdp", title: "Public-sector saving as % of GDP", unit: "% of GDP", observations: shareSeries(savPublic, gdp), sourceIndicatorId: "NAS_saving_pub_gdp" });
  // Shares of total saving (for the latest-year "who saves" split)
  await writeSeries({ indicatorId: "econ.nas.saving_households_share", title: "Household share of gross saving", unit: "% of gross saving", observations: shareSeries(savHH, savTotal), sourceIndicatorId: "NAS_saving_hh_share" });
  await writeSeries({ indicatorId: "econ.nas.saving_private_corp_share", title: "Private-corporate share of gross saving", unit: "% of gross saving", observations: shareSeries(savPrivate, savTotal), sourceIndicatorId: "NAS_saving_priv_share" });
  await writeSeries({ indicatorId: "econ.nas.saving_public_share", title: "Public-sector share of gross saving", unit: "% of gross saving", observations: shareSeries(savPublic, savTotal), sourceIndicatorId: "NAS_saving_pub_share" });

  // ---- 5. Official growth rates (value is already %, in current/constant cols) ----
  const gdpGrowth = bestAnnualByYear(await fetchRows(22));
  await writeSeries({ indicatorId: "econ.nas.gdp_growth_real", title: "Real GDP growth rate", unit: "% YoY", observations: asValue(gdpGrowth, "constant"), sourceIndicatorId: "NAS_gdp_growth_real" });
  await writeSeries({ indicatorId: "econ.nas.gdp_growth_nominal", title: "Nominal GDP growth rate", unit: "% YoY", observations: asValue(gdpGrowth, "current"), sourceIndicatorId: "NAS_gdp_growth_nominal" });
  const gvaGrowthRows = (await fetchRows(21)).filter((r) => r.industry === "Total Gross Value Added" && r.subindustry == null);
  const gvaGrowth = bestAnnualByYear(gvaGrowthRows);
  await writeSeries({ indicatorId: "econ.nas.gva_growth_real", title: "Real GVA growth rate", unit: "% YoY", observations: asValue(gvaGrowth, "constant"), sourceIndicatorId: "NAS_gva_growth_real" });

  // ---- 6. Per-capita GDP (derived: GDP / mid-year population, World Bank) ----
  const popRaw = JSON.parse(await readFile(new URL("../data/series/worldbank.IN.SP_POP_TOTL.json", import.meta.url), "utf8"));
  const popByYear = new Map((popRaw.observations || []).filter((o) => o.value != null).map((o) => [Number(String(o.date).slice(0, 4)), o.value]));
  const maxPopYear = Math.max(...popByYear.keys());
  // FY ending Mar YYYY -> mid-year population (YYYY-1); if that year isn't
  // published yet (latest FY), fall back to the most recent population available.
  const popForYear = (py) => popByYear.get(py) ?? popByYear.get(Math.min(py, maxPopYear));
  const perCapita = (rows, key) =>
    rows.map((o) => {
      const pop = popForYear(Number(o.date.slice(0, 4)) - 1);
      return { date: o.date, value: o[key] != null && pop ? Math.round((o[key] * CRORE) / pop) : null };
    });
  await writeSeries({ indicatorId: "econ.nas.per_capita_gdp_nominal", title: "Per capita GDP, nominal", unit: "rupees per person", observations: perCapita(gdp, "current"), sourceIndicatorId: "NAS_pc_gdp_nominal" });
  await writeSeries({ indicatorId: "econ.nas.per_capita_gdp_real", title: "Per capita GDP, real (2011-12 prices)", unit: "rupees per person", observations: perCapita(gdp, "constant"), sourceIndicatorId: "NAS_pc_gdp_real" });

  await writeSourceManifest("mospi-nas", manifest);
  console.log(`\nWrote ${manifest.length} MOSPI NAS series.`);
} catch (error) {
  console.error("MOSPI NAS ingest failed:", error.message);
  console.error(error.stack);
  process.exit(1);
}
