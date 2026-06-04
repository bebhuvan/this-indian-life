import { fetchTradeStatCommodityAllCountriesImport } from "./adapters/tradestat.mjs";
import { fetchPpacInternationalCrudeOil, parsePpacInternationalCrudeOil } from "./adapters/ppac.mjs";
import { createSeriesArtifact, createTableArtifact, mergeSourceManifest, readJson, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const crudeBasketRequests = (process.env.PPAC_CRUDE_BASKET_YEARS || "2020-2021,2021-2022,2022-2023,2023-2024,2024-2025,2025-2026")
  .split(",")
  .map((year) => year.trim())
  .filter(Boolean);

function average(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : null;
}

function totalValue(artifact, predicate) {
  const row = (artifact.rows || []).find(predicate);
  return Number(row?.value || 0);
}

function fiscalYearSortKey(label) {
  return Number(String(label).match(/^(\d{4})/)?.[1] || 0);
}

const crudeBasketRows = [];
const crudeBasketSnapshots = [];
for (const requestedFinancialYear of crudeBasketRequests) {
  const raw = await fetchPpacInternationalCrudeOil({ financialYear: requestedFinancialYear, reportBy: "4", pageId: "30" });
  const rawSnapshot = await writeSnapshot("ppac", `crude-basket.${requestedFinancialYear}.raw`, raw);
  const parsed = parsePpacInternationalCrudeOil(raw, { requestedFinancialYear, reportBy: "4" });
  const parsedSnapshot = await writeSnapshot("ppac", `crude-basket.${requestedFinancialYear}.parsed`, parsed);
  if (!parsed.rows.length || !parsed.fiscalYear) {
    console.warn(`ppac crude basket ${requestedFinancialYear} returned no rows`);
    continue;
  }
  const avg = average(parsed.rows.map((row) => row.value));
  crudeBasketRows.push(...parsed.rows);
  crudeBasketSnapshots.push({
    requestedFinancialYear,
    fiscalYear: parsed.fiscalYear,
    modifiedDate: parsed.modifiedDate,
    fileName: parsed.fileName,
    rawSnapshot: rawSnapshot.path,
    rawHash: rawSnapshot.hash,
    parsedSnapshot: parsedSnapshot.path,
    parsedHash: parsedSnapshot.hash,
    months: parsed.rows.length,
    averageUsdPerBbl: avg
  });
}

const bestCrudeBasketSnapshots = [...crudeBasketSnapshots]
  .sort((a, b) => {
    if (a.fiscalYear !== b.fiscalYear) return fiscalYearSortKey(a.fiscalYear) - fiscalYearSortKey(b.fiscalYear);
    return b.months - a.months;
  })
  .filter((entry, index, entries) => index === 0 || entry.fiscalYear !== entries[index - 1].fiscalYear);

const observations = bestCrudeBasketSnapshots
  .filter((entry) => Number.isFinite(entry.averageUsdPerBbl))
  .map((entry) => ({ date: entry.fiscalYear, value: Number(entry.averageUsdPerBbl.toFixed(2)) }));

const crudeBasketArtifact = createSeriesArtifact({
  indicatorId: "energy.ppac.indian_crude_basket_price",
  title: "Indian crude basket price",
  sourceId: "ppac",
  sourceIndicatorId: "international-prices-crude-oil.indian-basket.$-per-bbl",
  sourceUrl: "https://ppac.gov.in/prices/international-prices-of-crude-oil",
  unit: "$/bbl",
  frequency: "fiscal-year average",
  fetchedAt,
  observations,
  metadata: {
    monthlyRows: crudeBasketRows,
    snapshots: crudeBasketSnapshots,
    selectedSnapshots: bestCrudeBasketSnapshots,
    note: "Fiscal-year average of available monthly Indian crude basket FOB prices from PPAC. Latest fiscal year may be year-to-date."
  }
});
const crudeBasketPath = await writeSeriesArtifact({
  sourceId: "ppac",
  name: "ppac.IN.energy.ppac.indian_crude_basket_price",
  artifact: crudeBasketArtifact
});

const ppacUsd = await readJson("data/series/ppac.IN.energy.ppac.import_export_petroleum_value_usd.json");
const ppacRupees = await readJson("data/series/ppac.IN.energy.ppac.import_export_petroleum_value_rupees.json");
const ppacLng = await readJson("data/series/ppac.IN.energy.ppac.lng_imports_current.json");
const coalUsdParsed = (await fetchTradeStatCommodityAllCountriesImport({ hsCode: "2701", fiscalYear: "2025", report: "2" })).parsed;
const coalRupeesParsed = (await fetchTradeStatCommodityAllCountriesImport({ hsCode: "2701", fiscalYear: "2025", report: "1" })).parsed;
const coalUsdMillion = coalUsdParsed.rows.reduce((sum, row) => sum + (Number(row.valueCurrentUsdMillion) || 0), 0);
const coalRupeesCrore = coalRupeesParsed.rows.reduce((sum, row) => sum + (Number(row.valueCurrentUsdMillion) || 0), 0);

const lngUsdMillion = totalValue(ppacLng, (row) => row.month === "Total" && row.measure === "lng_imports_usd_million");
const lngRupeesCrore = totalValue(ppacLng, (row) => row.month === "Total" && row.measure === "lng_imports_rupees_crore");
const spendRows = [
  {
    item: "Crude oil",
    measure: "usd_billion",
    value: totalValue(ppacUsd, (row) => row.section === "import" && row.item === "CRUDE OIL" && row.month === "Total") / 1000,
    unit: "US$ billions",
    sourceDetail: "PPAC import/export value in dollars"
  },
  {
    item: "Petroleum products",
    measure: "usd_billion",
    value: totalValue(ppacUsd, (row) => row.section === "import" && row.item === "PRODUCT IMPORT*" && row.month === "Total") / 1000,
    unit: "US$ billions",
    sourceDetail: "PPAC import/export value in dollars"
  },
  {
    item: "Coal",
    measure: "usd_billion",
    value: coalUsdMillion / 1000,
    unit: "US$ billions",
    sourceDetail: "TradeStat HS 2701 import value in dollars"
  },
  {
    item: "LNG",
    measure: "usd_billion",
    value: lngUsdMillion / 1000,
    unit: "US$ billions",
    sourceDetail: "PPAC LNG imports value in dollars"
  },
  {
    item: "Crude oil",
    measure: "rupees_crore",
    value: totalValue(ppacRupees, (row) => row.section === "import" && row.item === "CRUDE OIL" && row.month === "Total"),
    unit: "₹ crore",
    sourceDetail: "PPAC import/export value in rupees"
  },
  {
    item: "Petroleum products",
    measure: "rupees_crore",
    value: totalValue(ppacRupees, (row) => row.section === "import" && row.item === "PRODUCT IMPORT*" && row.month === "Total"),
    unit: "₹ crore",
    sourceDetail: "PPAC import/export value in rupees"
  },
  {
    item: "Coal",
    measure: "rupees_crore",
    value: coalRupeesCrore,
    unit: "₹ crore",
    sourceDetail: "TradeStat HS 2701 import value in rupees"
  },
  {
    item: "LNG",
    measure: "rupees_crore",
    value: lngRupeesCrore,
    unit: "₹ crore",
    sourceDetail: "PPAC LNG imports value in rupees"
  }
].map((row) => ({
  ...row,
  fiscalYear: "2025-2026"
}));

const spendArtifact = createTableArtifact({
  indicatorId: "energy.imports.fuel_spend_current",
  title: "Fuel import spend by category",
  sourceId: "india-energy-derived",
  sourceIndicatorId: "ppac-and-tradestat.fuel-import-spend.2025-2026",
  sourceUrl: "https://ppac.gov.in/import-export",
  unit: "US$ billions and ₹ crore",
  fetchedAt,
  rows: spendRows,
  dimensions: Object.keys(spendRows[0] || {}),
  metadata: {
    ppacUsd: ppacUsd.sourceIndicatorId,
    ppacRupees: ppacRupees.sourceIndicatorId,
    ppacLng: ppacLng.sourceIndicatorId,
    coalUsd: "TradeStat HS 2701 report 2",
    coalRupees: "TradeStat HS 2701 report 1"
  }
});
const spendPath = await writeSeriesArtifact({
  sourceId: "india-energy-derived",
  name: "india-energy-derived.IN.energy.imports.fuel_spend_current",
  artifact: spendArtifact
});

await mergeSourceManifest("ppac", [{
  status: "ready",
  indicatorId: crudeBasketArtifact.indicatorId,
  sourceIndicatorId: crudeBasketArtifact.sourceIndicatorId,
  artifact: crudeBasketPath,
  observations: observations.length,
  fetchedAt
}]);
await mergeSourceManifest("india-energy-derived", [{
  status: "ready",
  indicatorId: spendArtifact.indicatorId,
  sourceIndicatorId: spendArtifact.sourceIndicatorId,
  artifact: spendPath,
  rows: spendRows.length,
  fetchedAt
}]);

console.log(`ppac ${crudeBasketArtifact.indicatorId} ${observations.length} observations`);
console.log(`derived ${spendArtifact.indicatorId} ${spendRows.length} rows`);
