// Ingest FDI/FII series for q.econ.foreign_investment.
// Sources (all snapshotted under data/snapshots/):
//   - RBI SAP_290 Handbook annual decomposition (gross/repat/inward/outward/net FDI/net portfolio), INR+USD, FY2000-01..2024-25
//   - RBI monthly Foreign Investment Inflows (net FDI/inward/outward/net portfolio/total), USD+INR, 2011..2026
//   - NSDL FPI net investment, reconciled annual + monthly (equity/debt/hybrid/total), INR+USD, 2002..2026
// Raw prepared files live in the external "RBI DBIE" working folder; we read, snapshot, and emit artifacts.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const EXT = "/home/bhuvanesh.r/Documents/Bhuvan projects/RBI DBIE";

const RBI_URL = "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+Economy";
const NSDL_ANNUAL_URL = "https://www.fpi.nsdl.co.in/web/Reports/Yearwise.aspx?RptType=5";
const NSDL_MONTHLY_URL = "https://www.fpi.nsdl.co.in/web/Reports/Yearwise.aspx?RptType=6";

const IN = { type: "country", id: "IN", name: "India" };
const manifest = [];

function fyEnd(fy) { // "2024-25" -> "2025-03-31"
  const start = Number(fy.slice(0, 4));
  return `${start + 1}-03-31`;
}
async function readCsv(path) {
  const text = await readFile(path, "utf8");
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(",");
  return lines.slice(1).map((l) => {
    const cells = l.split(",");
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
}
const num = (v) => (v === undefined || v === "" || v === null ? null : Number(v));

async function emit({ name, indicatorId, title, sourceId, sourceUrl, unit, frequency, observations, metadata, sourceIndicatorId }) {
  const clean = observations.filter((o) => o.date && o.value !== null && Number.isFinite(o.value)).sort((a, b) => a.date.localeCompare(b.date));
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId, sourceIndicatorId: sourceIndicatorId || indicatorId, sourceUrl,
    unit, frequency, geography: IN, fetchedAt, observations: clean, metadata
  });
  const path = await writeSeriesArtifact({ sourceId, name, artifact });
  manifest.push({ status: "ready", indicatorId, artifact: path, observations: clean.length, fetchedAt });
  console.log(`${name.padEnd(46)} ${String(clean.length).padStart(4)} obs  (${unit})`);
}

// ---------- 1) RBI annual decomposition (SAP_290) ----------
const sap = JSON.parse(await readFile(`${EXT}/FDI/sap290_annual.json`, "utf8"));
await writeSnapshot("rbi", "sap290_foreign_investment_inflows", sap);
const rbiAnnualSpec = [
  ["gross_inflows", "Gross FDI inflows to India", "gross"],
  ["repatriation", "Repatriation / disinvestment of FDI", "repat"],
  ["inward_net", "Direct investment to India (net of repatriation)", "inward"],
  ["outward", "FDI by India (outward direct investment)", "outward"],
  ["net", "Net foreign direct investment", "netfdi"],
  ["portfolio_net", "Net portfolio investment (FII/FPI), BoP basis", "netport"]
];
for (const [slug, title, key] of rbiAnnualSpec) {
  for (const [cur, unit, label] of [["usd", "USD million", "US$ mn"], ["inr", "INR crore", "₹ cr"]]) {
    await emit({
      name: `rbi.IN.extfin.${slug}_annual_${cur}`,
      indicatorId: `extfin.fdi.${slug}.annual.${cur}`,
      title: `${title} (annual, ${label})`,
      sourceId: "rbi", sourceUrl: RBI_URL, unit, frequency: "annual",
      observations: sap.map((r) => ({ date: fyEnd(r.fy), value: r[`${key}_${cur}`] })),
      metadata: { source: "RBI Handbook of Statistics, Foreign Investment Inflows (SAP_290, HBS149)", basis: "BoP, fiscal year", currency: cur.toUpperCase() }
    });
  }
}

// ---------- 2) RBI monthly (wide CSVs) ----------
const monthlyCols = [
  ["net", "A. Net Foreign Direct Investment", "Net foreign direct investment"],
  ["inward_net", "A.I. Direct Investment to India", "Direct investment to India"],
  ["outward", "A.II. Foreign Direct Investment by India", "FDI by India (outward)"],
  ["portfolio_net", "B. Net Portfolio Investment", "Net portfolio investment (FII/FPI)"],
  ["total", "C) Total Investment Inflows", "Total foreign investment inflows"]
];
for (const [cur, unit, div, label] of [["USD", "USD million", 1e6, "US$ mn"], ["INR", "INR crore", 1e7, "₹ cr"]]) {
  const rows = await readCsv(`${EXT}/FDI/fdi_fii_monthly_${cur}_wide.csv`);
  const header = Object.keys(rows[0]);
  for (const [slug, match, title] of monthlyCols) {
    const col = header.find((h) => h.startsWith(match));
    if (!col) { console.warn(`  monthly col not found: ${match} (${cur})`); continue; }
    await emit({
      name: `rbi.IN.extfin.${slug}_monthly_${cur.toLowerCase()}`,
      indicatorId: `extfin.fdi.${slug}.monthly.${cur.toLowerCase()}`,
      title: `${title} (monthly, ${label})`,
      sourceId: "rbi", sourceUrl: RBI_URL, unit, frequency: "monthly",
      observations: rows.map((r) => ({ date: r.date, value: num(r[col]) === null ? null : num(r[col]) / div })),
      metadata: { source: "RBI monthly Foreign Investment Inflows (RBIB34)", basis: "BoP", currency: cur }
    });
  }
}

// ---------- 3) NSDL FPI annual (reconciled) + monthly ----------
const nsdlSpec = [
  ["equity_net", "equity", "Net FPI investment in equity"],
  ["debt_net", "debt", "Net FPI investment in debt"],
  ["debt_far_net", "debt_far", "Net FPI debt under Fully Accessible Route (FAR)"],
  ["hybrid_net", "hybrid", "Net FPI investment in hybrid instruments"],
  ["total_net", "total", "Net FPI investment, total (all instruments)"]
];
const nsdlAnnual = await readCsv(`${EXT}/NSDL_FII/nsdl_fii_annual_reconciled.csv`);
await writeSnapshot("nsdl", "fpi_net_annual_reconciled", nsdlAnnual);
const nsdlMonthly = await readCsv(`${EXT}/NSDL_FII/nsdl_fii_monthly.csv`);
await writeSnapshot("nsdl", "fpi_net_monthly", nsdlMonthly);

for (const cur of ["INR", "USD"]) {
  const unit = cur === "INR" ? "INR crore" : "USD million";
  const label = cur === "INR" ? "₹ cr" : "US$ mn";
  // Drop partial (incomplete) fiscal years from the ANNUAL series so a 2-month stub
  // never appears as the latest bar or gets mistaken for a full year in prose.
  const annRows = nsdlAnnual.filter((r) => r.currency === cur && String(r.is_partial).toLowerCase() !== "true");
  const monRows = nsdlMonthly.filter((r) => r.currency === cur);
  for (const [slug, key, title] of nsdlSpec) {
    await emit({
      name: `nsdl.IN.extfin.fpi_${slug}_annual_${cur.toLowerCase()}`,
      indicatorId: `extfin.fpi.${slug}.annual.${cur.toLowerCase()}`,
      title: `${title} (annual, ${label})`,
      sourceId: "nsdl", sourceUrl: NSDL_ANNUAL_URL, unit, frequency: "annual",
      observations: annRows.map((r) => ({ date: fyEnd(r.fiscal_year), value: num(r[key]) })),
      metadata: { source: "NSDL FPI Net Investment (reconciled annual)", note: "FY2009-10 & FY2014-15 corrected to monthly sums; see reconciliation audit", currency: cur }
    });
    await emit({
      name: `nsdl.IN.extfin.fpi_${slug}_monthly_${cur.toLowerCase()}`,
      indicatorId: `extfin.fpi.${slug}.monthly.${cur.toLowerCase()}`,
      title: `${title} (monthly, ${label})`,
      sourceId: "nsdl", sourceUrl: NSDL_MONTHLY_URL, unit, frequency: "monthly",
      observations: monRows.map((r) => ({ date: r.date, value: num(r[key]) })),
      metadata: { source: "NSDL FPI Net Investment (calendar-year monthly)", currency: cur, note: cur === "USD" ? "Apr-2014 USD total has a $344m NSDL source discrepancy vs components" : undefined }
    });
  }
}

await writeSourceManifest("foreign-investment", manifest);
console.log(`\nWrote ${manifest.length} foreign-investment series artifacts.`);
