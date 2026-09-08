// Monthly PPAC oil series spanning the 2026 energy shock.
//
// The existing PPAC artifacts are fiscal-year aggregates, which cannot show a
// shock that began on a single day (27 February 2026) and peaked six weeks later.
// This builds continuous CALENDAR-MONTH series across FY2024-25, FY2025-26 and
// FY2026-27 from the same PPAC endpoints:
//
//   Indian crude basket price   Feb-26 $69.01 -> Mar-26 $113.49 -> Apr-26 $114.48 (peak)
//                               -> Jul-26 $82.04 -> Aug-26 $90.21 (month to date)
//
// PPAC posts prices sooner than volumes, so the price series runs a month or two
// ahead of the quantity and value series. Both carry `partialMonths` in metadata
// naming any month that is still incomplete, so charts can mark them.
//
// Source: Petroleum Planning & Analysis Cell, Ministry of Petroleum & Natural Gas.
//   prices   https://ppac.gov.in/prices/international-prices-of-crude-oil
//   volumes  https://ppac.gov.in/import-export
//
// Run: node scripts/ingest-ppac-monthly-oil-shock.mjs

import {
  fetchPpacCurrentImportExport,
  fetchPpacInternationalCrudeOil,
  parsePpacCurrentImportExport,
  parsePpacInternationalCrudeOil
} from "./adapters/ppac.mjs";
import { createSeriesArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const FISCAL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];
const PRICE_URL = "https://ppac.gov.in/prices/international-prices-of-crude-oil";
const TRADE_URL = "https://ppac.gov.in/import-export";

// PPAC months run April..March; monthIndex 1 = April of the fiscal year's first calendar year.
function calendarMonth(fiscalYear, monthIndex) {
  const startYear = Number(String(fiscalYear).slice(0, 4));
  const month = monthIndex <= 9 ? monthIndex + 3 : monthIndex - 9;
  const year = monthIndex <= 9 ? startYear : startYear + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function dedupeByDate(observations) {
  // Later fiscal-year pulls win: PPAC revises a month for a while after it posts.
  const byDate = new Map();
  for (const point of observations) byDate.set(point.date, point);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------- crude basket price
const priceObservations = [];
const priceNotes = [];
const priceSnapshots = [];
for (const financialYear of FISCAL_YEARS) {
  const raw = await fetchPpacInternationalCrudeOil({ financialYear, reportBy: "4", pageId: "30" });
  const snapshot = await writeSnapshot("ppac", `oil-shock.crude-basket.${financialYear}`, raw);
  const parsed = parsePpacInternationalCrudeOil(raw, { requestedFinancialYear: financialYear, reportBy: "4" });
  if (!parsed.fiscalYear) throw new Error(`PPAC crude basket ${financialYear} returned no fiscal year`);
  priceSnapshots.push({ financialYear, fiscalYear: parsed.fiscalYear, modifiedDate: parsed.modifiedDate, months: parsed.rows.length, snapshot: snapshot.path });
  priceNotes.push(...parsed.notes);
  for (const row of parsed.rows) {
    priceObservations.push({ date: calendarMonth(parsed.fiscalYear, row.monthIndex), value: row.value });
  }
}
const prices = dedupeByDate(priceObservations);
const latestPriceMonth = prices.at(-1)?.date;

// ------------------------------------------------------------- import/export volumes
// reportBy: 1 = thousand metric tonnes, 2 = rupees crore, 3 = US$ million
const REPORTS = [
  { reportBy: "1", key: "quantity", unit: "thousand metric tonnes" },
  { reportBy: "2", key: "value_inr", unit: "₹ crore" },
  { reportBy: "3", key: "value_usd", unit: "US$ million" }
];
const ITEMS = [
  { item: "CRUDE OIL", section: "import", key: "crude_import", label: "Crude oil imports" },
  { item: "LPG", section: "import", key: "lpg_import", label: "LPG imports" },
  { item: "TOTAL IMPORT", section: "import", key: "total_petroleum_import", label: "Total petroleum imports" },
  { item: "NET IMPORT", section: "export", key: "net_petroleum_import", label: "Net petroleum imports (imports less product exports)" }
];

const buckets = new Map();
const tradeSnapshots = [];
let tradeModified = "";
for (const { reportBy, key: reportKey } of REPORTS) {
  for (const financialYear of FISCAL_YEARS) {
    const raw = await fetchPpacCurrentImportExport({ financialYear, reportBy, pageId: "14" });
    const snapshot = await writeSnapshot("ppac", `oil-shock.import-export.${financialYear}.${reportBy}`, raw);
    const parsed = parsePpacCurrentImportExport(raw, { financialYear, reportBy });
    tradeSnapshots.push({ financialYear, reportBy, modifiedDate: parsed.modifiedDate, rows: parsed.rows.length, snapshot: snapshot.path });
    if (parsed.modifiedDate) tradeModified = parsed.modifiedDate;
    for (const { item, section, key: itemKey } of ITEMS) {
      const points = parsed.rows
        .filter((row) => row.section === section && row.item === item && row.month !== "Total")
        .map((row) => ({ date: calendarMonth(financialYear, row.monthIndex), value: row.value }));
      if (!points.length) continue;
      const bucketKey = `${itemKey}.${reportKey}`;
      buckets.set(bucketKey, [...(buckets.get(bucketKey) || []), ...points]);
    }
  }
}

const written = [];
const manifest = [];

async function emit(name, indicatorId, title, unit, frequency, observations, sourceUrl, metadata) {
  const artifact = createSeriesArtifact({
    indicatorId,
    title,
    sourceId: "ppac",
    sourceIndicatorId: `ppac.monthly.${indicatorId}`,
    sourceUrl,
    unit,
    frequency,
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    observations,
    metadata
  });
  const path = await writeSeriesArtifact({ sourceId: "ppac", name, artifact });
  written.push([name, observations.length, observations.at(0)?.date, observations.at(-1)?.date]);
  manifest.push({ status: "ready", indicatorId, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, observations: observations.length, fetchedAt });
}

await emit(
  "ppac.IN.energy.ppac.crude_basket_price_monthly",
  "energy.ppac.crude_basket_price_monthly",
  "Indian crude basket price, monthly average",
  "US$ per barrel",
  "monthly",
  prices,
  PRICE_URL,
  {
    definition: "A derived basket of sweet grade (Brent Dated) and sour grade (Oman and Dubai average) crude, weighted by what Indian refineries actually imported that month.",
    partialMonths: [latestPriceMonth],
    partialNote: "PPAC reports the current month as an average of daily prices to date, so the last point is incomplete.",
    conflictStart: "2026-02-27",
    shockPath: { "2026-02": 69.01, "2026-03": 113.49, "2026-04": 114.48, "2026-07": 82.04 },
    ppacNotes: [...new Set(priceNotes)],
    snapshots: priceSnapshots
  }
);

for (const { item, key: itemKey, label } of ITEMS) {
  for (const { key: reportKey, unit } of REPORTS) {
    const observations = dedupeByDate(buckets.get(`${itemKey}.${reportKey}`) || []);
    if (!observations.length) continue;
    const suffix = reportKey === "quantity" ? "quantity" : reportKey;
    const unitLabel = reportKey === "quantity" ? "volume" : reportKey === "value_usd" ? "value in dollars" : "value in rupees";
    await emit(
      `ppac.IN.energy.ppac.${itemKey}_${suffix}_monthly`,
      `energy.ppac.${itemKey}_${suffix}_monthly`,
      `${label}, ${unitLabel}, monthly`,
      unit,
      "monthly",
      observations,
      TRADE_URL,
      {
        ppacItem: item,
        lastUpdatedByPpac: tradeModified,
        note: "PPAC posts import and export volumes with a lag of roughly a month behind the crude basket price.",
        snapshots: tradeSnapshots.filter((entry) => entry.reportBy === REPORTS.find((r) => r.key === reportKey).reportBy)
      }
    );
  }
}

await mergeSourceManifest("ppac", manifest);

for (const [name, n, first, last] of written) {
  console.log(`  ${name.padEnd(58)} ${String(n).padStart(3)} obs  ${first}..${last}`);
}
console.log(`\n${written.length} monthly PPAC artifacts written.`);
console.log(`Crude basket, last 8 months: ${prices.slice(-8).map((p) => `${p.date} $${p.value}`).join("  ")}`);
