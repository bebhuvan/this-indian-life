// Ingest for the "How unequal is India?" flagship (q.econ.inequality).
//
// Inequality in India is the most contested data topic in Indian economics:
// the SAME country is "the 4th most equal on earth" (World Bank, consumption
// Gini 25.5) and home to inequality "starker than the British Raj" (World
// Inequality Lab, income/wealth concentration). They do not contradict — they
// measure different things (spend vs. earn vs. own) with instruments that have
// opposite blind spots. This script pulls every freely-fetchable side of that
// argument so the article can present all of them honestly.
//
// Sources, all open/no-auth:
//   - World Bank API ...... consumption Gini + decile/quintile shares + poverty
//   - OWID grapher CSV .... World Inequality Database income & wealth shares
//                            (1922→2023) AND the WID-vs-World-Bank comparison
//   - hardcoded (cited) ... HCES 2023-24 factsheet rural/urban Gini, and the
//                            WIL 2024 headline income/wealth distribution.
//
// Login-gated sources (HCES unit-level microdata, AIDIS, UBS/Hurun) are NOT
// fetched here — see data/catalog/inequality-data-gaps.json for the follow-ups.

import { fetchJson, fetchText } from "./lib/source-http.mjs";
import { parseCsv } from "./core/csv.mjs";
import {
  createSeriesArtifact,
  createTableArtifact,
  writeSeriesArtifact,
  writeSnapshot,
  writeSourceManifest
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE = "inequality";
const manifest = [];
const failures = [];

function record(entry) {
  manifest.push({ status: "ready", fetchedAt, ...entry });
}
function fail(indicatorId, sourceIndicatorId, error) {
  failures.push({ status: "failed", indicatorId, sourceIndicatorId, fetchedAt, error: error.message });
  console.warn(`inequality ${indicatorId} failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// 1. World Bank — consumption-based inequality (the "low and falling" story)
//    These come from India's NSSO/HCES consumption surveys, scale 0-100.
// ---------------------------------------------------------------------------
const worldBankSeries = [
  { id: "econ.inequality.gini_consumption", code: "SI.POV.GINI", title: "Gini index — consumption (World Bank)", unit: "Gini index (0–100)" },
  { id: "econ.inequality.cons_share_highest10", code: "SI.DST.10TH.10", title: "Consumption share of the richest 10% (World Bank)", unit: "% of consumption" },
  { id: "econ.inequality.cons_share_lowest10", code: "SI.DST.FRST.10", title: "Consumption share of the poorest 10% (World Bank)", unit: "% of consumption" },
  { id: "econ.inequality.cons_share_highest20", code: "SI.DST.05TH.20", title: "Consumption share of the richest 20% (World Bank)", unit: "% of consumption" },
  { id: "econ.inequality.cons_share_lowest20", code: "SI.DST.FRST.20", title: "Consumption share of the poorest 20% (World Bank)", unit: "% of consumption" },
  { id: "econ.inequality.poverty_215", code: "SI.POV.DDAY", title: "Extreme poverty headcount ($2.15/day, 2017 PPP)", unit: "% of population" }
];

for (const s of worldBankSeries) {
  try {
    const url = `https://api.worldbank.org/v2/country/IN/indicator/${s.code}?format=json&per_page=20000`;
    const raw = await fetchJson(url);
    const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
    const observations = rows
      .map((r) => ({ date: String(r.date), value: r.value == null ? null : Number(r.value) }))
      .filter((r) => Number.isFinite(r.value))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!observations.length) throw new Error("no finite observations");
    const artifact = createSeriesArtifact({
      indicatorId: s.id, title: s.title, sourceId: "worldbank", sourceIndicatorId: s.code,
      sourceUrl: url, unit: s.unit, frequency: "annual",
      geography: { type: "country", id: "IN", name: "India" }, fetchedAt, observations
    });
    const file = await writeSeriesArtifact({ sourceId: SOURCE, name: `worldbank.IN.${s.code.replaceAll(".", "_")}`, artifact });
    const snap = await writeSnapshot(SOURCE, `worldbank.${s.code}`, raw);
    record({ indicatorId: s.id, sourceIndicatorId: s.code, source: "worldbank", artifact: file, snapshot: snap.path, rawHash: snap.hash, observations: observations.length });
    console.log(`worldbank ${s.code} ${observations.length} obs`);
  } catch (e) { fail(s.id, s.code, e); }
}

// ---------------------------------------------------------------------------
// 2. OWID grapher CSVs — World Inequality Database (the "high and rising" story)
//    plus the head-to-head WID-vs-World-Bank chart (the core disagreement).
//    Each config maps one CSV column -> one series indicator.
// ---------------------------------------------------------------------------
const owidSeries = [
  { slug: "income-share-top-1-before-tax-wid", col: "Share (top 1%, before tax)", id: "econ.inequality.income_share_top1_wid", title: "Income share of the top 1%, before tax (WID)", unit: "% of pre-tax national income" },
  { slug: "income-share-top-10-before-tax-wid", col: "Share (top 10%, before tax)", id: "econ.inequality.income_share_top10_wid", title: "Income share of the top 10%, before tax (WID)", unit: "% of pre-tax national income" },
  { slug: "wealth-share-richest-1-percent", col: "Share (top 1%, wealth)", id: "econ.inequality.wealth_share_top1_wid", title: "Wealth share of the richest 1% (WID)", unit: "% of net personal wealth" },
  { slug: "wealth-share-richest-10-percent", col: "Share (top 10%, wealth)", id: "econ.inequality.wealth_share_top10_wid", title: "Wealth share of the richest 10% (WID)", unit: "% of net personal wealth" },
  // The disagreement, in one chart: same metric (top-1% income share), two methods.
  { slug: "share-richest-1-wid-vs-pip", col: "Share according to the World Inequality Database", id: "econ.inequality.top1_income_wid", title: "Top 1% income share — World Inequality Database method", unit: "% (pre-tax income)" },
  { slug: "share-richest-1-wid-vs-pip", col: "Share according to the World Bank", id: "econ.inequality.top1_income_wb", title: "Top 1% income share — World Bank (survey) method", unit: "% (consumption/income)" },
  // World Bank consumption distribution: the bottom-50 / middle-40 / top-10 split.
  { slug: "income-share-distribution-wb", col: "Richest 10%", id: "econ.inequality.cons_dist_top10", title: "Consumption share of the richest 10% (World Bank distribution)", unit: "% of consumption" },
  { slug: "income-share-distribution-wb", col: "Middle 40%", id: "econ.inequality.cons_dist_middle40", title: "Consumption share of the middle 40% (World Bank distribution)", unit: "% of consumption" },
  { slug: "income-share-distribution-wb", col: "Poorest 50%", id: "econ.inequality.cons_dist_bottom50", title: "Consumption share of the poorest 50% (World Bank distribution)", unit: "% of consumption" }
];

const owidCsvCache = new Map();
async function getOwidIndiaRows(slug) {
  if (!owidCsvCache.has(slug)) {
    const csv = await fetchText(`https://ourworldindata.org/grapher/${slug}.csv?country=IND`, { headers: { accept: "text/csv" } });
    const rows = parseCsv(csv).filter((r) => r.Code === "IND" || r.Entity === "India");
    owidCsvCache.set(slug, rows);
    await writeSnapshot(SOURCE, `owid.${slug}.india`, rows);
  }
  return owidCsvCache.get(slug);
}

for (const s of owidSeries) {
  try {
    const rows = await getOwidIndiaRows(s.slug);
    if (!rows.length) throw new Error("no India rows");
    if (!(s.col in rows[0])) throw new Error(`column "${s.col}" not found; have [${Object.keys(rows[0]).join(", ")}]`);
    const observations = rows
      .map((r) => ({ date: String(r.Year), value: r[s.col] === "" ? null : Number(r[s.col]) }))
      .filter((r) => Number.isFinite(r.value))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!observations.length) throw new Error("no finite observations");
    const artifact = createSeriesArtifact({
      indicatorId: s.id, title: s.title, sourceId: "owid", sourceIndicatorId: `${s.slug}::${s.col}`,
      sourceUrl: `https://ourworldindata.org/grapher/${s.slug}`, unit: s.unit, frequency: "annual",
      geography: { type: "country", id: "IN", name: "India" }, fetchedAt, observations,
      metadata: { grapherSlug: s.slug, column: s.col }
    });
    const file = await writeSeriesArtifact({ sourceId: SOURCE, name: `owid.IN.${s.id.split(".").pop()}`, artifact });
    record({ indicatorId: s.id, sourceIndicatorId: `${s.slug}::${s.col}`, source: "owid", artifact: file, observations: observations.length });
    console.log(`owid ${s.slug} [${s.col}] ${observations.length} obs`);
  } catch (e) { fail(s.id, `${s.slug}::${s.col}`, e); }
}

// ---------------------------------------------------------------------------
// 3. HCES 2023-24 factsheet — rural/urban consumption Gini (MPCE-based).
//    The full, authoritative HCES layer (Gini, MPCE levels, fractile
//    distribution, state MPCE, derived consumption shares) is written by
//    scripts/ingest-hces-published.mjs from the MoSPI press-note tables.
//    Run that after this script; it merges into the same "inequality" manifest.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 4. World Inequality Lab 2024 headline distribution (2022-23 shares).
//    From Bharti, Chancel, Piketty & Somanchi, "Income and Wealth Inequality
//    in India, 1922-2023: The Rise of the Billionaire Raj" (WIL WP 2024/09).
//    Stored as a table for the distribution-bar visual.
// ---------------------------------------------------------------------------
const wilTable = createTableArtifact({
  indicatorId: "econ.inequality.wil_headline_2023",
  title: "How income and wealth are split, 2022-23 (World Inequality Lab)",
  sourceId: "world-inequality-lab", sourceIndicatorId: "wil.2024.headline_shares",
  sourceUrl: "https://wid.world/document/income-and-wealth-inequality-in-india-1922-2023-the-rise-of-the-billionaire-raj-world-inequality-lab-working-paper-2024-09/",
  unit: "% share", geography: { type: "country", id: "IN", name: "India" }, fetchedAt,
  rows: [
    { group: "Bottom 50%", incomeSharePct: 15.0, wealthSharePct: 6.4 },
    { group: "Middle 40%", incomeSharePct: 27.3, wealthSharePct: 28.6 },
    { group: "Top 10%", incomeSharePct: 57.7, wealthSharePct: 65.0 },
    { group: "Top 1%", incomeSharePct: 22.6, wealthSharePct: 40.1 }
  ],
  dimensions: ["group", "incomeSharePct", "wealthSharePct"],
  metadata: { provenance: "WIL Working Paper 2024/09 (Bharti, Chancel, Piketty, Somanchi)", year: "2022-23", note: "Middle-40 wealth share is residual; top-10 figures approximate per paper. VERIFY against paper tables." }
});
const wilFile = await writeSeriesArtifact({ sourceId: SOURCE, name: "world-inequality-lab.IN.headline_shares_2023", artifact: wilTable });
record({ indicatorId: "econ.inequality.wil_headline_2023", sourceIndicatorId: "wil.2024.headline_shares", source: "world-inequality-lab", artifact: wilFile, rows: wilTable.rows.length, needsVerification: true });
console.log("wil headline distribution (manual table)");

// ---------------------------------------------------------------------------
await writeSourceManifest(SOURCE, [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} inequality series; ${failures.length} failure(s).`);
