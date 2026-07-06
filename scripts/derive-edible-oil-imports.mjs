import { canonicalComtradeRows, fetchUnComtradeData } from "./adapters/un-comtrade.mjs";
import {
  createSeriesArtifact,
  createTableArtifact,
  mergeSourceManifest,
  readJson,
  writeSeriesArtifact,
  writeSnapshot
} from "./core/artifacts.mjs";

const SOURCE_ID = "edible-oil-derived";
const fetchedAt = new Date().toISOString();
const yearStart = Number(process.env.EDIBLE_OIL_START_YEAR || 2012);
const tradeEndYear = Number(process.env.EDIBLE_OIL_TRADE_END_YEAR || 2024);
const years = Array.from({ length: tradeEndYear - yearStart + 1 }, (_, index) => yearStart + index);

const oilTradeCodes = [
  { code: "1511", label: "Palm oil", short: "Palm", rank: 1 },
  { code: "1507", label: "Soybean oil", short: "Soybean", rank: 2 },
  { code: "1512", label: "Sunflower, safflower and cottonseed oil", short: "Sunflower/safflower", rank: 3 },
  { code: "1514", label: "Rapeseed, colza and mustard oil", short: "Rapeseed/mustard", rank: 4 },
  { code: "1508", label: "Groundnut oil", short: "Groundnut", rank: 5 }
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const domesticCrops = [
  { crop: "Groundnut", label: "Groundnut", rank: 1 },
  { crop: "Soybean", label: "Soybean", rank: 2 },
  { crop: "Rapeseed & Mustard", label: "Rapeseed & mustard", rank: 3 },
  { crop: "Sesamum", label: "Sesamum", rank: 4 },
  { crop: "Castorseed", label: "Castorseed", rank: 5 },
  { crop: "Sunflower", label: "Sunflower", rank: 6 },
  { crop: "Linseed", label: "Linseed", rank: 7 },
  { crop: "Safflower", label: "Safflower", rank: 8 },
  { crop: "Nigerseed", label: "Nigerseed", rank: 9 }
];

function cleanNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function yearLabel(cropYearCode) {
  const start = Number(cropYearCode);
  return `${start}-${String(start + 1).slice(-2)}`;
}

function latestApyRows(rows) {
  const priority = {
    "Final Estimate": 3,
    "Third Advance Estimates": 2,
    "Second Advance Estimates": 1,
    "First Advance Estimates": 0
  };
  const byKey = new Map();
  for (const row of rows) {
    const key = [
      row.crop,
      row.crop_year_code,
      row.metric,
      row.season,
      row.state || "All India"
    ].join("\u0000");
    const current = byKey.get(key);
    const score = priority[row.estimation_cycle] ?? -1;
    const currentScore = priority[current?.estimation_cycle] ?? -1;
    if (!current || score >= currentScore) byKey.set(key, row);
  }
  return [...byKey.values()];
}

function domesticSeries(rows, crop, metric) {
  return latestApyRows(rows)
    .filter((row) => row.crop === crop && row.metric === metric && row.season === "Total")
    .map((row) => ({
      date: String(row.crop_year_code),
      value: cleanNumber(row.value),
      cropYear: row.crop_year || yearLabel(row.crop_year_code),
      estimationCycle: row.estimation_cycle
    }))
    .filter((point) => point.value !== null)
    .sort((a, b) => Number(a.date) - Number(b.date));
}

function createObservationSeries({ indicatorId, title, unit, sourceId = SOURCE_ID, sourceIndicatorId, sourceUrl, observations, method, sourceIds }) {
  return createSeriesArtifact({
    indicatorId,
    title,
    sourceId,
    sourceIndicatorId,
    sourceUrl,
    unit,
    fetchedAt,
    observations: observations.map(({ date, value }) => ({ date, value })),
    metadata: {
      method,
      sourceIds,
      note: method
    }
  });
}

async function fetchComtradeAnnualTotals({ flowCode = "M", snapshotName = "imports" } = {}) {
  const rawByCode = {};
  const rows = [];
  for (const item of oilTradeCodes) {
    rawByCode[item.code] = {};
    for (const year of years) {
      const raw = await fetchUnComtradeData({
        reporterCode: "699",
        partnerCode: "0",
        cmdCode: item.code,
        flowCode,
        period: String(year),
        breakdownMode: "classic"
      });
      rawByCode[item.code][year] = raw;
      const canonical = canonicalComtradeRows(Array.isArray(raw?.data) ? raw.data : []);
      for (const row of canonical) {
        rows.push({ ...row, edibleOilLabel: item.label, edibleOilShort: item.short, edibleOilRank: item.rank });
      }
      await wait(Number(process.env.EDIBLE_OIL_COMTRADE_DELAY_MS || 1600));
    }
  }
  const snapshot = await writeSnapshot("un-comtrade", `edible-oil-${snapshotName}.${yearStart}-${tradeEndYear}.annual`, rawByCode);
  return { rows, snapshot };
}

async function fetchComtradePartnerRows() {
  const rawByCode = {};
  const rows = [];
  for (const item of oilTradeCodes.slice(0, 4)) {
    const raw = await fetchUnComtradeData({
      reporterCode: "699",
      partnerCode: null,
      cmdCode: item.code,
      flowCode: "M",
      period: String(tradeEndYear),
      breakdownMode: "classic"
    });
    rawByCode[item.code] = raw;
    const canonical = canonicalComtradeRows(Array.isArray(raw?.data) ? raw.data : []);
    for (const row of canonical) {
      rows.push({ ...row, edibleOilLabel: item.label, edibleOilShort: item.short, edibleOilRank: item.rank });
    }
    await wait(Number(process.env.EDIBLE_OIL_COMTRADE_DELAY_MS || 1600));
  }
  const snapshot = await writeSnapshot("un-comtrade", `edible-oil-imports.${tradeEndYear}.partners`, rawByCode);
  return { rows, snapshot };
}

const upagAll = await readJson("data/series/upag.IN.agriculture.all_india_crop_apy_dash.json");
const upagState = await readJson("data/series/upag.IN.agriculture.statewise_crop_apy_recent_dash.json");
const upagProgressive = await readJson("data/series/upag.IN.agriculture.progressive_crop_area_sown_dash.json");
const allRows = upagAll.rows || [];
const stateRows = upagState.rows || [];
const progressiveRows = upagProgressive.rows || [];
const manifest = [];

const oilseedProduction = domesticSeries(allRows, "Total Oil Seeds", "Production");
const oilseedArea = domesticSeries(allRows, "Total Oil Seeds", "Area");
const oilseedYield = domesticSeries(allRows, "Total Oil Seeds", "Yield");

const domesticArtifacts = [
  {
    name: "edible-oil.IN.agriculture.oilseed_production",
    artifact: createObservationSeries({
      indicatorId: "agriculture.edible_oil.oilseed_production",
      title: "India oilseed production",
      sourceId: "upag",
      unit: "million tonnes of oilseeds",
      sourceIndicatorId: "UPAg allindiaapy Total Oil Seeds Production",
      sourceUrl: "https://dash.upag.gov.in/allindiaapy",
      observations: oilseedProduction.map((point) => ({ date: point.date, value: point.value / 10 })),
      method: "Filtered UPAg all-India APY rows to crop = Total Oil Seeds, metric = Production, season = Total; converted lakh tonnes to million tonnes. Final estimates are used where available; 2025-26 is UPAg's Third Advance Estimate.",
      sourceIds: ["agriculture.upag.all_india_crop_apy"]
    })
  },
  {
    name: "edible-oil.IN.agriculture.oilseed_area",
    artifact: createObservationSeries({
      indicatorId: "agriculture.edible_oil.oilseed_area",
      title: "India oilseed area",
      sourceId: "upag",
      unit: "million hectares",
      sourceIndicatorId: "UPAg allindiaapy Total Oil Seeds Area",
      sourceUrl: "https://dash.upag.gov.in/allindiaapy",
      observations: oilseedArea.map((point) => ({ date: point.date, value: point.value / 10 })),
      method: "Filtered UPAg all-India APY rows to crop = Total Oil Seeds, metric = Area, season = Total; converted lakh hectares to million hectares. Final estimates are used where available; 2025-26 is UPAg's Third Advance Estimate.",
      sourceIds: ["agriculture.upag.all_india_crop_apy"]
    })
  },
  {
    name: "edible-oil.IN.agriculture.oilseed_yield",
    artifact: createObservationSeries({
      indicatorId: "agriculture.edible_oil.oilseed_yield",
      title: "India oilseed yield",
      sourceId: "upag",
      unit: "kg per hectare",
      sourceIndicatorId: "UPAg allindiaapy Total Oil Seeds Yield",
      sourceUrl: "https://dash.upag.gov.in/allindiaapy",
      observations: oilseedYield.map((point) => ({ date: point.date, value: point.value })),
      method: "Filtered UPAg all-India APY rows to crop = Total Oil Seeds, metric = Yield, season = Total. Final estimates are used where available; 2025-26 is UPAg's Third Advance Estimate.",
      sourceIds: ["agriculture.upag.all_india_crop_apy"]
    })
  }
];

for (const item of domesticArtifacts) {
  const path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: item.name, artifact: item.artifact });
  manifest.push({ status: "ready", indicatorId: item.artifact.indicatorId, artifact: path, rows: item.artifact.observations.length, fetchedAt });
  console.log(`wrote ${item.artifact.indicatorId} (${item.artifact.observations.length} observations)`);
}

const latestFinalYear = 2024;
const latestCropRows = domesticCrops.map((item) => {
  const point = domesticSeries(allRows, item.crop, "Production").find((row) => Number(row.date) === latestFinalYear);
  return point ? { label: item.label, value: point.value / 10, group: "Production", crop: item.crop, rank: item.rank } : null;
}).filter(Boolean);

const cropMix = createTableArtifact({
  indicatorId: "agriculture.edible_oil.crop_mix_latest",
  title: "Latest oilseed production by crop",
  sourceId: "upag",
  sourceIndicatorId: `UPAg allindiaapy oilseed crop production ${latestFinalYear}-${String(latestFinalYear + 1).slice(-2)}`,
  sourceUrl: "https://dash.upag.gov.in/allindiaapy",
  unit: "million tonnes of oilseeds",
  fetchedAt,
  rows: latestCropRows.sort((a, b) => b.value - a.value),
  dimensions: ["label", "value", "group", "crop", "rank"],
  metadata: {
    method: "Filtered UPAg all-India APY rows to major oilseed crops, metric = Production, season = Total, crop year 2024-25 Final Estimate; converted lakh tonnes to million tonnes.",
    note: "This is oilseed crop production, not edible-oil output. Different seeds have different oil recovery rates."
  }
});
let path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.agriculture.crop_mix_latest", artifact: cropMix });
manifest.push({ status: "ready", indicatorId: cropMix.indicatorId, artifact: path, rows: cropMix.rows.length, fetchedAt });
console.log(`wrote ${cropMix.indicatorId} (${cropMix.rows.length} rows)`);

const stateOilseedRows = latestApyRows(stateRows)
  .filter((row) => row.crop === "Total Oil Seeds" && row.metric === "Production" && row.season === "Total" && Number(row.crop_year_code) === latestFinalYear)
  .map((row) => ({ label: row.state, value: cleanNumber(row.value) / 10, group: "Production", stateCode: row.state_code }))
  .filter((row) => row.label && row.label !== "All India" && Number.isFinite(row.value) && row.value > 0)
  .sort((a, b) => b.value - a.value)
  .slice(0, 10);

const stateConcentration = createTableArtifact({
  indicatorId: "agriculture.edible_oil.state_oilseed_production_top",
  title: "Top oilseed-producing states",
  sourceId: "upag",
  sourceIndicatorId: `UPAg statewiseapy Total Oil Seeds Production ${latestFinalYear}-${String(latestFinalYear + 1).slice(-2)}`,
  sourceUrl: "https://dash.upag.gov.in/statewiseapy",
  unit: "million tonnes of oilseeds",
  fetchedAt,
  rows: stateOilseedRows,
  dimensions: ["label", "value", "group", "stateCode"],
  metadata: {
    method: "Filtered UPAg state-wise APY rows to crop = Total Oil Seeds, metric = Production, season = Total, crop year 2024-25 Final Estimate; converted lakh tonnes to million tonnes and kept the top 10 states.",
    note: "This ranks oilseed crop production by state, not edible-oil crushing capacity or oil output."
  }
});
path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.agriculture.state_oilseed_production_top", artifact: stateConcentration });
manifest.push({ status: "ready", indicatorId: stateConcentration.indicatorId, artifact: path, rows: stateConcentration.rows.length, fetchedAt });
console.log(`wrote ${stateConcentration.indicatorId} (${stateConcentration.rows.length} rows)`);

const sowingMetricLabels = new Map([
  ["Area Sown\u00002025-26", "Area sown, 2025-26"],
  ["Area Sown\u00002024-25", "Area sown, 2024-25"],
  ["Target Area\u0000", "Target area"],
  ["Normal (DA&FW)\u0000", "Normal area"]
]);
const sowingProgressRows = progressiveRows
  .filter((row) => row.categoryname === "Oilseeds" && row.cropname === "Total Oilseeds")
  .map((row) => {
    const key = `${row.metric}\u0000${row.year || ""}`;
    const label = sowingMetricLabels.get(key);
    const value = cleanNumber(row.value);
    return label && value !== null ? { label, value, group: "Area", metric: row.metric, year: row.year || null } : null;
  })
  .filter(Boolean)
  .sort((a, b) => {
    const order = ["Area sown, 2025-26", "Area sown, 2024-25", "Target area", "Normal area"];
    return order.indexOf(a.label) - order.indexOf(b.label);
  });

const sowingProgress = createTableArtifact({
  indicatorId: "agriculture.edible_oil.sowing_progress_latest",
  title: "Oilseed sowing progress",
  sourceId: "upag",
  sourceIndicatorId: "UPAg progressive crop area sown Total Oilseeds",
  sourceUrl: "https://dash.upag.gov.in/progressivecropareasown",
  unit: "million hectares",
  fetchedAt,
  rows: sowingProgressRows,
  dimensions: ["label", "value", "group", "metric", "year"],
  metadata: {
    method: "Filtered UPAg progressive crop area sown rows to category = Oilseeds and crop = Total Oilseeds. Values are read as million hectares from the source table.",
    note: "This is a live/current-season area-coverage snapshot, not a final crop-year production estimate."
  }
});
path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.agriculture.sowing_progress_latest", artifact: sowingProgress });
manifest.push({ status: "ready", indicatorId: sowingProgress.indicatorId, artifact: path, rows: sowingProgress.rows.length, fetchedAt });
console.log(`wrote ${sowingProgress.indicatorId} (${sowingProgress.rows.length} rows)`);

const { rows: annualTradeRows, snapshot: annualTradeSnapshot } = await fetchComtradeAnnualTotals({ flowCode: "M", snapshotName: "imports" });
const byYearAndOil = new Map();
for (const row of annualTradeRows) {
  const year = String(row.period || row.refYear || "");
  if (!year) continue;
  const key = `${year}\u0000${row.edibleOilShort}`;
  const current = byYearAndOil.get(key) || {
    date: year,
    label: row.edibleOilShort,
    fullLabel: row.edibleOilLabel,
    netWgt: 0,
    primaryValue: 0
  };
  current.netWgt += cleanNumber(row.netWgt) || 0;
  current.primaryValue += cleanNumber(row.primaryValue) || cleanNumber(row.cifvalue) || 0;
  byYearAndOil.set(key, current);
}

const tradeByYear = new Map();
for (const item of byYearAndOil.values()) {
  const year = tradeByYear.get(item.date) || { date: item.date, tonnes: 0, valueUsd: 0 };
  year.tonnes += item.netWgt / 1000;
  year.valueUsd += item.primaryValue;
  tradeByYear.set(item.date, year);
}
const importVolume = [...tradeByYear.values()].sort((a, b) => a.date.localeCompare(b.date));

const importVolumeArtifact = createObservationSeries({
  indicatorId: "trade.edible_oil.import_volume",
  title: "India edible-oil imports",
  sourceId: "un-comtrade",
  unit: "million tonnes",
  sourceIndicatorId: `UN Comtrade HS ${oilTradeCodes.map((item) => item.code).join("+")} imports`,
  sourceUrl: "https://comtradeplus.un.org/",
  observations: importVolume.map((row) => ({ date: row.date, value: row.tonnes / 1_000_000 })),
  method: "Summed UN Comtrade annual India import net weight for HS 1511 palm oil, 1507 soybean oil, 1512 sunflower/safflower/cottonseed oil, 1514 rapeseed/colza/mustard oil and 1508 groundnut oil; converted kilograms to million tonnes.",
  sourceIds: ["UN Comtrade"]
});
path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.trade.import_volume", artifact: importVolumeArtifact });
manifest.push({ status: "ready", indicatorId: importVolumeArtifact.indicatorId, artifact: path, snapshot: annualTradeSnapshot.path, rows: importVolumeArtifact.observations.length, fetchedAt });
console.log(`wrote ${importVolumeArtifact.indicatorId} (${importVolumeArtifact.observations.length} observations)`);

const importValueArtifact = createObservationSeries({
  indicatorId: "trade.edible_oil.import_value",
  title: "India edible-oil import bill",
  sourceId: "un-comtrade",
  unit: "US$ billions",
  sourceIndicatorId: `UN Comtrade HS ${oilTradeCodes.map((item) => item.code).join("+")} imports`,
  sourceUrl: "https://comtradeplus.un.org/",
  observations: importVolume.map((row) => ({ date: row.date, value: row.valueUsd / 1_000_000_000 })),
  method: "Summed UN Comtrade annual India import primary value for HS 1511, 1507, 1512, 1514 and 1508; converted current US dollars to US$ billions.",
  sourceIds: ["UN Comtrade"]
});
path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.trade.import_value", artifact: importValueArtifact });
manifest.push({ status: "ready", indicatorId: importValueArtifact.indicatorId, artifact: path, snapshot: annualTradeSnapshot.path, rows: importValueArtifact.observations.length, fetchedAt });
console.log(`wrote ${importValueArtifact.indicatorId} (${importValueArtifact.observations.length} observations)`);

const { rows: annualExportRows, snapshot: annualExportSnapshot } = await fetchComtradeAnnualTotals({ flowCode: "X", snapshotName: "exports" });
const exportsByYear = new Map();
for (const row of annualExportRows) {
  const year = String(row.period || row.refYear || "");
  if (!year) continue;
  const current = exportsByYear.get(year) || { date: year, tonnes: 0, valueUsd: 0 };
  current.tonnes += (cleanNumber(row.netWgt) || 0) / 1000;
  current.valueUsd += cleanNumber(row.primaryValue) || cleanNumber(row.fobvalue) || 0;
  exportsByYear.set(year, current);
}
const exportVolume = [...exportsByYear.values()].sort((a, b) => a.date.localeCompare(b.date));
const exportVolumeArtifact = createObservationSeries({
  indicatorId: "trade.edible_oil.export_volume",
  title: "India edible-oil exports",
  sourceId: "un-comtrade",
  unit: "million tonnes",
  sourceIndicatorId: `UN Comtrade HS ${oilTradeCodes.map((item) => item.code).join("+")} exports`,
  sourceUrl: "https://comtradeplus.un.org/",
  observations: exportVolume.map((row) => ({ date: row.date, value: row.tonnes / 1_000_000 })),
  method: "Summed UN Comtrade annual India export net weight for HS 1511 palm oil, 1507 soybean oil, 1512 sunflower/safflower/cottonseed oil, 1514 rapeseed/colza/mustard oil and 1508 groundnut oil; converted kilograms to million tonnes.",
  sourceIds: ["UN Comtrade"]
});
path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.trade.export_volume", artifact: exportVolumeArtifact });
manifest.push({ status: "ready", indicatorId: exportVolumeArtifact.indicatorId, artifact: path, snapshot: annualExportSnapshot.path, rows: exportVolumeArtifact.observations.length, fetchedAt });
console.log(`wrote ${exportVolumeArtifact.indicatorId} (${exportVolumeArtifact.observations.length} observations)`);

const importExportBalance = createTableArtifact({
  indicatorId: "trade.edible_oil.import_export_volume",
  title: "Edible-oil imports and exports",
  sourceId: "un-comtrade",
  sourceIndicatorId: `UN Comtrade HS ${oilTradeCodes.map((item) => item.code).join("+")} imports and exports`,
  sourceUrl: "https://comtradeplus.un.org/",
  unit: "million tonnes",
  fetchedAt,
  rows: importVolume.flatMap((row) => {
    const exportRow = exportsByYear.get(row.date);
    return [
      { date: row.date, label: "Imports", value: row.tonnes / 1_000_000 },
      { date: row.date, label: "Exports", value: (exportRow?.tonnes || 0) / 1_000_000 }
    ];
  }),
  dimensions: ["date", "label", "value"],
  metadata: {
    method: "Combined UN Comtrade annual India import and export net weights for HS 1511, 1507, 1512, 1514 and 1508; converted kilograms to million tonnes.",
    note: "Exports are included as a scale check. The article's dependence story is about net imports."
  }
});
path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.trade.import_export_volume", artifact: importExportBalance });
manifest.push({ status: "ready", indicatorId: importExportBalance.indicatorId, artifact: path, snapshot: annualExportSnapshot.path, rows: importExportBalance.rows.length, fetchedAt });
console.log(`wrote ${importExportBalance.indicatorId} (${importExportBalance.rows.length} rows)`);

const latestTradeYear = String(tradeEndYear);
const importMixRows = [...byYearAndOil.values()]
  .filter((row) => row.date === latestTradeYear)
  .map((row) => ({
    label: row.label,
    value: row.netWgt / 1_000_000_000,
    group: "Import volume",
    fullLabel: row.fullLabel,
    valueUsdBillion: row.primaryValue / 1_000_000_000
  }))
  .filter((row) => row.value > 0)
  .sort((a, b) => b.value - a.value);

const importMix = createTableArtifact({
  indicatorId: "trade.edible_oil.import_mix_latest",
  title: "Edible-oil import mix by oil type",
  sourceId: "un-comtrade",
  sourceIndicatorId: `UN Comtrade edible oil import mix ${latestTradeYear}`,
  sourceUrl: "https://comtradeplus.un.org/",
  unit: "million tonnes",
  fetchedAt,
  rows: importMixRows,
  dimensions: ["label", "value", "group", "fullLabel", "valueUsdBillion"],
  metadata: {
    method: "Grouped UN Comtrade 2024 India import net weight by HS oil category and converted kilograms to million tonnes.",
    note: "HS 1512 combines sunflower, safflower and cottonseed oil; labels shorten it for chart readability."
  }
});
path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: "edible-oil.IN.trade.import_mix_latest", artifact: importMix });
manifest.push({ status: "ready", indicatorId: importMix.indicatorId, artifact: path, snapshot: annualTradeSnapshot.path, rows: importMix.rows.length, fetchedAt });
console.log(`wrote ${importMix.indicatorId} (${importMix.rows.length} rows)`);

const { rows: partnerTradeRows, snapshot: partnerSnapshot } = await fetchComtradePartnerRows();
const partnerTable = createTableArtifact({
  indicatorId: "trade.edible_oil.import_partners_latest",
  title: "Edible-oil import partners",
  sourceId: "un-comtrade",
  sourceIndicatorId: `UN Comtrade edible oil partner imports ${latestTradeYear}`,
  sourceUrl: "https://comtradeplus.un.org/",
  unit: "current US$",
  fetchedAt,
  geography: { type: "country", id: "IND", name: "India" },
  rows: partnerTradeRows,
  dimensions: Object.keys(partnerTradeRows[0] || {}),
  metadata: {
    method: "Fetched UN Comtrade 2024 India import partner rows for HS 1511, 1507, 1512 and 1514, filtered to canonical aggregate customs/mode rows. Chart sums primaryValue across the selected oil HS headings by partner.",
    note: "Partner chart is by current-dollar import value, not physical tonnes."
  }
});
path = await writeSeriesArtifact({ sourceId: "un-comtrade", name: "edible-oil.IN.trade.import_partners_latest", artifact: partnerTable });
manifest.push({ status: "ready", indicatorId: partnerTable.indicatorId, artifact: path, snapshot: partnerSnapshot.path, rows: partnerTable.rows.length, fetchedAt });
console.log(`wrote ${partnerTable.indicatorId} (${partnerTable.rows.length} rows)`);

await mergeSourceManifest(SOURCE_ID, manifest);
console.log(`Wrote ${manifest.length} edible-oil article artifacts.`);
