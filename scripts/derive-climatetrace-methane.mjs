import { createSeriesArtifact, createTableArtifact, readJson, mergeSourceManifest, writeSeriesArtifact } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const total = readJson("data/series/climatetrace.IN.emissions.total.annual.json");
const agriculture = readJson("data/series/climatetrace.IN.emissions.agriculture.annual.json");
const waste = readJson("data/series/climatetrace.IN.emissions.waste.annual.json");
const fossilFuelOps = readJson("data/series/climatetrace.IN.emissions.fossil_fuel_operations.annual.json");
const [totalArtifact, agricultureArtifact, wasteArtifact, fossilFuelOpsArtifact] = await Promise.all([
  total,
  agriculture,
  waste,
  fossilFuelOps
]);

function rowsByYear(artifact) {
  return new Map(artifact.rows.map((row) => [row.date, row]));
}

// --- 1. Sector composition over time ---
const totalByYear = rowsByYear(totalArtifact);
const agByYear = rowsByYear(agricultureArtifact);
const wasteByYear = rowsByYear(wasteArtifact);
const ffoByYear = rowsByYear(fossilFuelOpsArtifact);

const compositionRows = [...totalByYear.keys()].sort().map((year) => {
  const totalCh4 = totalByYear.get(year)?.ch4_t ?? 0;
  const agCh4 = agByYear.get(year)?.ch4_t ?? 0;
  const wasteCh4 = wasteByYear.get(year)?.ch4_t ?? 0;
  const ffoCh4 = ffoByYear.get(year)?.ch4_t ?? 0;
  const otherCh4 = Math.max(0, totalCh4 - agCh4 - wasteCh4 - ffoCh4);
  return {
    date: year,
    total_ch4_t: totalCh4,
    agriculture_ch4_t: agCh4,
    waste_ch4_t: wasteCh4,
    fossil_fuel_operations_ch4_t: ffoCh4,
    other_sectors_ch4_t: otherCh4,
    agriculture_share_pct: totalCh4 ? Number(((agCh4 / totalCh4) * 100).toFixed(1)) : null,
    waste_share_pct: totalCh4 ? Number(((wasteCh4 / totalCh4) * 100).toFixed(1)) : null,
    fossil_fuel_operations_share_pct: totalCh4 ? Number(((ffoCh4 / totalCh4) * 100).toFixed(1)) : null,
    other_sectors_share_pct: totalCh4 ? Number(((otherCh4 / totalCh4) * 100).toFixed(1)) : null
  };
});

const compositionArtifact = createTableArtifact({
  indicatorId: "derived.IN.climate.methane.sector_composition",
  title: "India methane emissions by sector, 2015-2024",
  sourceId: "climatetrace-derived",
  sourceIndicatorId: "country/emissions/methane-composition",
  sourceUrl: "https://climatetrace.org/",
  unit: "tonnes CH4",
  fetchedAt,
  rows: compositionRows,
  dimensions: Object.keys(compositionRows[0] || {}),
  metadata: {
    method: "Agriculture, waste, and fossil-fuel-operations CH4 pulled directly from Climate TRACE's sector-scoped country/emissions endpoint. 'Other sectors' is the residual after subtracting those three from the all-sector CH4 total (covers forestry-and-land-use, transportation, manufacturing, buildings, mineral extraction)."
  }
});

// --- 2. Climate TRACE vs Climate Watch reconciliation ---
const CLIMATE_WATCH_GWP100_CH4 = 25; // AR4 100-year GWP, per Climate Watch's stated methodology

const cwTotal = readJson("data/series/climatewatch.IN.methane.total_excluding_lulucf.annual.json");
const cwAgriculture = readJson("data/series/climatewatch.IN.methane.agriculture.annual.json");
const cwFugitive = readJson("data/series/climatewatch.IN.methane.fugitive_emissions.annual.json");
const [cwTotalArtifact, cwAgricultureArtifact, cwFugitiveArtifact] = await Promise.all([
  cwTotal,
  cwAgriculture,
  cwFugitive
]);

function observationsByYear(artifact) {
  return new Map(artifact.observations.map((point) => [point.date, point.value]));
}

function buildGapRows(traceByYear, watchObservations) {
  const watchByYear = observationsByYear(watchObservations);
  const years = [...traceByYear.keys()].filter((year) => watchByYear.has(year)).sort();
  return years.map((year) => {
    const traceCh4Mt = (traceByYear.get(year)?.ch4_t ?? 0) / 1e6;
    const watchCo2e = watchByYear.get(year);
    const watchCh4Mt = watchCo2e / CLIMATE_WATCH_GWP100_CH4;
    return {
      date: year,
      climatetrace_ch4_mt: Number(traceCh4Mt.toFixed(2)),
      climatewatch_ch4_mt: Number(watchCh4Mt.toFixed(2)),
      gap_mt: Number((traceCh4Mt - watchCh4Mt).toFixed(2)),
      gap_pct_of_climatewatch: watchCh4Mt ? Number((((traceCh4Mt - watchCh4Mt) / watchCh4Mt) * 100).toFixed(1)) : null
    };
  });
}

const gapMethod = "Climate Watch reports CH4 in MtCO2e using an AR4 100-year GWP of 25; we divide by 25 to recover an implied raw CH4 tonnage comparable to Climate TRACE's native CH4 figures. Climate TRACE uses a satellite-observation-informed, largely bottom-up per-source methodology; Climate Watch's figure is a modelled, gap-filled reconstruction (CAIT/PIK lineage), not a line-by-line transcription of India's own UNFCCC submissions. Waste has no Climate Watch equivalent sector for India, so no gap series exists for it here — see the sparse official BUR anchors for that sector instead.";

const gapComparisons = [
  { key: "total", title: "India's total methane: two independent estimates", traceByYear: totalByYear, watch: cwTotalArtifact },
  { key: "agriculture", title: "Agriculture methane: two independent estimates", traceByYear: agByYear, watch: cwAgricultureArtifact },
  { key: "fossil_fuel_operations", title: "Fossil-fuel methane: two independent estimates", traceByYear: ffoByYear, watch: cwFugitiveArtifact }
];

const gapArtifacts = gapComparisons.map(({ key, title, traceByYear: byYear, watch }) => {
  const rows = buildGapRows(byYear, watch);
  return {
    key,
    artifact: createTableArtifact({
      indicatorId: `derived.IN.climate.methane.tracewatch_gap.${key}`,
      title,
      sourceId: "climatetrace-derived",
      sourceIndicatorId: `methane/tracewatch-gap/${key}`,
      sourceUrl: "https://climatetrace.org/",
      unit: "million tonnes CH4",
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: { method: gapMethod, climateWatchGwp100Ch4: CLIMATE_WATCH_GWP100_CH4 }
    })
  };
});

// --- 3. Top named methane sources (waste + fossil-fuel fugitive subsectors) ---
const wasteAssetsArtifact = await readJson("data/series/climatetrace.IN.assets.waste.json");
const ffoAssetsArtifact = await readJson("data/series/climatetrace.IN.assets.fossil_fuel_operations.json");

const methaneRelevantFfoSubsectors = new Set(["coal-mining", "oil-and-gas-production", "oil-and-gas-transport"]);
const topN = 15;

function toRankedRow(row, group) {
  return {
    name: row.name,
    group,
    value: row.emissions_quantity_t,
    subsector: row.subsector,
    owner: row.owner
  };
}

const methaneRelevantFfoRows = ffoAssetsArtifact.rows.filter((row) => methaneRelevantFfoSubsectors.has(row.subsector));

const topSourceRows = [
  ...wasteAssetsArtifact.rows.map((row) => toRankedRow(row, "Waste")),
  ...methaneRelevantFfoRows.map((row) => toRankedRow(row, "Fossil-fuel operations"))
]
  .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  .slice(0, topN);

const topSourcesArtifact = createTableArtifact({
  indicatorId: "derived.IN.climate.methane.top_sources",
  title: `India's ${topN} biggest named methane-relevant point sources`,
  sourceId: "climatetrace-derived",
  sourceIndicatorId: "assets/methane-top-sources",
  sourceUrl: "https://climatetrace.org/",
  unit: "tonnes CO2e (100yr)",
  fetchedAt,
  rows: topSourceRows,
  dimensions: Object.keys(topSourceRows[0] || {}),
  metadata: {
    method: `Ranked by Climate TRACE's asset-level co2e_100yr figure (the API does not split asset-level emissions by gas), pooling Waste-sector assets (landfills, wastewater plants) with Fossil-fuel-operations assets limited to coal-mining, oil-and-gas-production, and oil-and-gas-transport subsectors (oil-and-gas-refining excluded: those are combustion-driven CO2 point sources, not fugitive-methane sources). Top ${topN} of ${wasteAssetsArtifact.rows.length + methaneRelevantFfoRows.length} candidate assets shown.`
  }
});

// Landfills/wastewater plants alone rarely crack the combined top-15 (coal mines dominate by
// raw tonnage), but named sites like Ghazipur and Pirana are independently newsworthy -> a
// dedicated top-10 waste-only ranking so they don't disappear from the article.
const topWasteN = 10;
const topWasteRows = wasteAssetsArtifact.rows
  .map((row) => toRankedRow(row, "Waste"))
  .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  .slice(0, topWasteN);

const topWasteArtifact = createTableArtifact({
  indicatorId: "derived.IN.climate.methane.top_waste_sources",
  title: `India's ${topWasteN} biggest named landfill and wastewater methane sources`,
  sourceId: "climatetrace-derived",
  sourceIndicatorId: "assets/methane-top-waste-sources",
  sourceUrl: "https://climatetrace.org/",
  unit: "tonnes CO2e (100yr)",
  fetchedAt,
  rows: topWasteRows,
  dimensions: Object.keys(topWasteRows[0] || {}),
  metadata: { method: `Ranked by Climate TRACE's asset-level co2e_100yr figure. Top ${topWasteN} of ${wasteAssetsArtifact.rows.length} waste-sector assets shown.` }
});

await Promise.all([
  writeSeriesArtifact({ sourceId: "climatetrace-derived", name: "derived.IN.climate.methane.sector_composition", artifact: compositionArtifact }),
  ...gapArtifacts.map(({ key, artifact }) => writeSeriesArtifact({ sourceId: "climatetrace-derived", name: `derived.IN.climate.methane.tracewatch_gap.${key}`, artifact })),
  writeSeriesArtifact({ sourceId: "climatetrace-derived", name: "derived.IN.climate.methane.top_sources", artifact: topSourcesArtifact }),
  writeSeriesArtifact({ sourceId: "climatetrace-derived", name: "derived.IN.climate.methane.top_waste_sources", artifact: topWasteArtifact })
]);

await mergeSourceManifest("climatetrace-derived", [
  { status: "ready", indicatorId: compositionArtifact.indicatorId, sourceIndicatorId: compositionArtifact.sourceIndicatorId, rows: compositionRows.length, fetchedAt },
  ...gapArtifacts.map(({ artifact }) => ({ status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: artifact.sourceIndicatorId, rows: artifact.rows.length, fetchedAt })),
  { status: "ready", indicatorId: topSourcesArtifact.indicatorId, sourceIndicatorId: topSourcesArtifact.sourceIndicatorId, rows: topSourceRows.length, fetchedAt },
  { status: "ready", indicatorId: topWasteArtifact.indicatorId, sourceIndicatorId: topWasteArtifact.sourceIndicatorId, rows: topWasteRows.length, fetchedAt }
]);

console.log(`Wrote ${3 + gapArtifacts.length} derived Climate TRACE methane artifacts.`);
