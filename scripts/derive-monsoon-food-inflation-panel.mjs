import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const CLIMATE_INPUT = "data/series/derived.IN.climate.enso_imd_monsoon_join.json";

const SERIES = [
  ["headline", "Headline CPI", "data/series/mospi.IN.prices.cpi.combined.general.inflation.json"],
  ["consumer_food_price", "Consumer food price", "data/series/mospi.IN.prices.cpi.combined.consumer_food_price.inflation.json"],
  ["food_beverages", "Food and beverages", "data/series/mospi.IN.prices.cpi.combined.food_beverages.inflation.json"],
  ["cereals_products", "Cereals and products", "data/series/mospi.IN.prices.cpi.combined.cereals_products.inflation.json"],
  ["pulses_products", "Pulses and products", "data/series/mospi.IN.prices.cpi.combined.pulses_products.inflation.json"],
  ["vegetables", "Vegetables", "data/series/mospi.IN.prices.cpi.combined.vegetables.inflation.json"],
  ["oils_fats", "Oils and fats", "data/series/mospi.IN.prices.cpi.combined.oils_fats.inflation.json"],
  ["milk_products", "Milk and products", "data/series/mospi.IN.prices.cpi.combined.milk_products.inflation.json"],
  ["spices", "Spices", "data/series/mospi.IN.prices.cpi.combined.spices.inflation.json"],
  ["rice", "Rice", "data/series/mospi.IN.prices.cpi.item.rice.inflation.json"],
  ["wheat_atta", "Wheat / atta", "data/series/mospi.IN.prices.cpi.item.wheat_atta.inflation.json"],
  ["pulses_item", "Pulses item", "data/series/mospi.IN.prices.cpi.item.pulses.inflation.json"],
  ["onion", "Onion", "data/series/mospi.IN.prices.cpi.item.onion.inflation.json"],
  ["tomato", "Tomato", "data/series/mospi.IN.prices.cpi.item.tomato.inflation.json"],
  ["potato", "Potato", "data/series/mospi.IN.prices.cpi.item.potato.inflation.json"],
  ["mustard_oil", "Mustard oil", "data/series/mospi.IN.prices.cpi.item.mustard_oil.inflation.json"]
];

const WINDOWS = [
  ["monsoon_jun_sep", 0, [6, 7, 8, 9]],
  ["post_monsoon_oct_dec", 0, [10, 11, 12]],
  ["rabi_price_window_jan_mar", 1, [1, 2, 3]],
  ["following_food_year_jul_jun", null, null]
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function ym(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function mean(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2));
}

function monthsFor(windowId, monsoonYear, offset, months) {
  if (windowId === "following_food_year_jul_jun") {
    return [
      ...[7, 8, 9, 10, 11, 12].map((month) => ym(monsoonYear, month)),
      ...[1, 2, 3, 4, 5, 6].map((month) => ym(monsoonYear + 1, month))
    ];
  }
  return months.map((month) => ym(monsoonYear + offset, month));
}

function observationsMap(artifact) {
  return new Map((artifact.observations || []).map((row) => [row.date, row.value]));
}

const [climate, ...artifacts] = await Promise.all([
  readJson(CLIMATE_INPUT),
  ...SERIES.map(([, , path]) => readJson(path))
]);

const climateByYear = new Map(
  climate.rows
    .filter((row) => row.region_id === "all_india")
    .map((row) => [row.year, row])
);

const rows = [];
for (let index = 0; index < SERIES.length; index += 1) {
  const [seriesId, label, path] = SERIES[index];
  const artifact = artifacts[index];
  const obs = observationsMap(artifact);
  const years = [...climateByYear.keys()].filter((year) => year >= 2012).sort((a, b) => a - b);

  for (const year of years) {
    const climateRow = climateByYear.get(year);
    for (const [windowId, offset, months] of WINDOWS) {
      const expectedMonths = monthsFor(windowId, year, offset, months);
      const values = expectedMonths.map((date) => obs.get(date));
      const validCount = values.filter(Number.isFinite).length;
      if (!validCount) continue;

      rows.push({
        monsoon_year: year,
        series_id: seriesId,
        series: label,
        source_artifact: path,
        window_id: windowId,
        months_expected: expectedMonths.length,
        months_available: validCount,
        complete_window: validCount === expectedMonths.length,
        avg_yoy_inflation_pct: mean(values),
        monsoon_actual_jun_sep_mm: climateRow.actual_jun_sep_mm,
        monsoon_departure_jun_sep_pct: climateRow.departure_jun_sep_pct,
        oni_monsoon_mean_c: climateRow.oni_monsoon_mean_c,
        oni_monsoon_phase_by_mean: climateRow.oni_monsoon_phase_by_mean,
        official_enso_active_during_monsoon: climateRow.official_enso_active_during_monsoon
      });
    }
  }
}

const snapshot = await writeSnapshot("monsoon-food-inflation-panel", "derived.imd_enso.mospi_food_inflation", {
  inputs: [CLIMATE_INPUT, ...SERIES.map(([, , path]) => path)],
  rows
});

const artifact = createTableArtifact({
  indicatorId: "prices.derived.monsoon_food_inflation_panel",
  title: "Monsoon rainfall, ENSO, and food inflation windows",
  sourceId: "monsoon-food-inflation-panel",
  sourceIndicatorId: "derived.imd_enso.mospi_cpi_food",
  sourceUrl: "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi; https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html; https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt",
  unit: "rainfall: mm and percent departure; ONI: deg C; inflation: % YoY",
  geography: { type: "country", id: "IND", name: "India" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    inputs: [CLIMATE_INPUT, ...SERIES.map(([, , path]) => path)],
    windows: WINDOWS.map(([windowId]) => windowId),
    note: "MoSPI monthly YoY CPI inflation series are averaged into monsoon-year windows. The following_food_year_jul_jun window is marked incomplete when CPI months beyond the latest local MoSPI artifact are unavailable."
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "monsoon-food-inflation-panel",
  name: "derived.IN.prices.monsoon_food_inflation_panel",
  artifact
});

const years = rows.map((row) => row.monsoon_year);
await writeSourceManifest("monsoon-food-inflation-panel", [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  snapshot: snapshot.path,
  rawHash: snapshot.hash,
  rows: rows.length,
  earliestMonsoonYear: Math.min(...years),
  latestMonsoonYear: Math.max(...years),
  fetchedAt
}]);

console.log(`monsoon-food inflation panel ${rows.length} rows (${Math.min(...years)}-${Math.max(...years)})`);
