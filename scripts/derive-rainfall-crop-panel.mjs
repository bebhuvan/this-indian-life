import { writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { readFile } from "node:fs/promises";

const fetchedAt = new Date().toISOString();

const INPUTS = {
  rainfallEnso: "data/series/derived.IN.climate.enso_imd_monsoon_join.json",
  desApy: "data/series/des-agri.IN.agriculture.all_india_crop_apy.json",
  upagAllIndiaApy: "data/series/upag.IN.agriculture.all_india_crop_apy_dash.json"
};

const UPAG_METRIC_FIELDS = {
  Area: "area_lakh_hectares",
  Production: "production_lakh_tonnes",
  Yield: "yield_kg_per_hectare"
};

function cropId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function percentChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function mean(values) {
  const numeric = values.filter(Number.isFinite);
  if (!numeric.length) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function pctDeviationFrom(value, baseline) {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline === 0) return null;
  return ((value - baseline) / baseline) * 100;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function monsoonByYear(rows) {
  const allIndiaRows = rows.filter((row) => row.region_id === "all_india");
  return new Map(allIndiaRows.map((row) => [row.year, row]));
}

function normalizeDesRows(rows) {
  return rows.map((row) => ({
    source_dataset: "des_agri_glance_2024_25",
    source_row_type: "annual_all_india_table",
    crop_id: row.crop_id,
    crop: row.crop,
    crop_category: null,
    crop_sub_category: null,
    season: "Total",
    crop_year: row.crop_year,
    year_start: row.year_start,
    estimate_stage: row.year_start === 2024 ? "source_advance_or_provisional" : "final_or_historical",
    area_lakh_hectares: Number.isFinite(row.area_million_hectares) ? row.area_million_hectares * 10 : null,
    production_lakh_tonnes: Number.isFinite(row.production_million_tonnes) ? row.production_million_tonnes * 10 : null,
    yield_kg_per_hectare: row.yield_kg_per_hectare,
    area_under_irrigation_pct: row.area_under_irrigation_pct,
    source_table: row.source_table,
    notes: null
  }));
}

function normalizeUpagRows(rows) {
  const groups = new Map();

  for (const row of rows) {
    if (row.state !== "All India") continue;
    const field = UPAG_METRIC_FIELDS[row.metric];
    if (!field) continue;

    const key = [
      row.crop,
      row.crop_year,
      row.season,
      row.estimation_cycle
    ].join("\u0000");

    if (!groups.has(key)) {
      groups.set(key, {
        source_dataset: "upag_dash_allindiaapy",
        source_row_type: "public_dash_grid",
        crop_id: cropId(row.crop),
        crop: row.crop,
        crop_category: row.crop_category,
        crop_sub_category: Array.isArray(row.crop_sub_category) ? row.crop_sub_category.join("; ") : row.crop_sub_category ?? null,
        season: row.season,
        crop_year: row.crop_year,
        year_start: row.crop_year_code,
        estimate_stage: row.estimation_cycle,
        area_lakh_hectares: null,
        production_lakh_tonnes: null,
        yield_kg_per_hectare: null,
        area_under_irrigation_pct: null,
        source_table: "UPAg public Dash report: allindiaapy",
        notes: row.crop_year_code === 2025 ? "2025-26 is labeled Third Advance Estimates in the UPAg dashboard." : null
      });
    }

    groups.get(key)[field] = row.value;
  }

  return [...groups.values()].sort((a, b) => (
    a.year_start - b.year_start ||
    a.crop.localeCompare(b.crop) ||
    a.season.localeCompare(b.season) ||
    a.estimate_stage.localeCompare(b.estimate_stage)
  ));
}

function addMonsoonFields(rows, rainfallMap) {
  return rows.map((row) => {
    const monsoon = rainfallMap.get(row.year_start);
    return {
      ...row,
      monsoon_actual_jun_sep_mm: monsoon?.actual_jun_sep_mm ?? null,
      monsoon_departure_jun_sep_pct: monsoon?.departure_jun_sep_pct ?? null,
      oni_monsoon_mean_c: monsoon?.oni_monsoon_mean_c ?? null,
      oni_monsoon_strongest_c: monsoon?.oni_monsoon_strongest_c ?? null,
      oni_monsoon_phase_by_mean: monsoon?.oni_monsoon_phase_by_mean ?? null,
      official_enso_active_during_monsoon: monsoon?.official_enso_active_during_monsoon ?? null,
      oni_seasons_used: monsoon?.oni_seasons_used ?? null
    };
  });
}

function addLaggedCropFields(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = [row.source_dataset, row.crop_id, row.season].join("\u0000");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  for (const group of grouped.values()) {
    group.sort((a, b) => a.year_start - b.year_start);
    for (let index = 0; index < group.length; index += 1) {
      const row = group[index];
      const previous = group[index - 1];
      row.area_yoy_pct = percentChange(row.area_lakh_hectares, previous?.area_lakh_hectares);
      row.production_yoy_pct = percentChange(row.production_lakh_tonnes, previous?.production_lakh_tonnes);
      row.yield_yoy_pct = percentChange(row.yield_kg_per_hectare, previous?.yield_kg_per_hectare);

      const trailing = group.slice(Math.max(0, index - 5), index);
      row.area_vs_prev5_mean_pct = pctDeviationFrom(row.area_lakh_hectares, mean(trailing.map((item) => item.area_lakh_hectares)));
      row.production_vs_prev5_mean_pct = pctDeviationFrom(row.production_lakh_tonnes, mean(trailing.map((item) => item.production_lakh_tonnes)));
      row.yield_vs_prev5_mean_pct = pctDeviationFrom(row.yield_kg_per_hectare, mean(trailing.map((item) => item.yield_kg_per_hectare)));
    }
  }

  return rows;
}

const rainfallEnso = await readJson(INPUTS.rainfallEnso);
const desApy = await readJson(INPUTS.desApy);
const upagApy = await readJson(INPUTS.upagAllIndiaApy);

const rainfallMap = monsoonByYear(rainfallEnso.rows);
const rows = addLaggedCropFields(addMonsoonFields([
  ...normalizeDesRows(desApy.rows),
  ...normalizeUpagRows(upagApy.rows)
], rainfallMap)).sort((a, b) => (
  a.year_start - b.year_start ||
  a.source_dataset.localeCompare(b.source_dataset) ||
  a.crop.localeCompare(b.crop) ||
  a.season.localeCompare(b.season)
));

const years = rows.map((row) => row.year_start).filter(Number.isFinite);
const snapshot = await writeSnapshot("rainfall-crop-panel", "derived.imd_enso.crop_apy_panel", rows);

const artifact = {
  schemaVersion: 1,
  artifactType: "table",
  indicatorId: "agriculture.derived.rainfall_crop_apy_panel",
  title: "All-India monsoon rainfall, ENSO, and crop APY panel",
  sourceId: "rainfall-crop-panel",
  sourceIndicatorId: "derived.imd_enso.des_upag_crop_apy",
  sourceUrl: "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html",
  unit: "rainfall: mm and percent departure; ONI: deg C; area: lakh hectares; production: lakh tonnes; yield: kg/hectare",
  geography: { type: "country", id: "IN", name: "India" },
  dimensions: Object.keys(rows[0] || {}),
  fetchedAt,
  rows,
  metadata: {
    inputs: INPUTS,
    rowSnapshot: snapshot.path,
    rowHash: snapshot.hash,
    earliestYearStart: Math.min(...years),
    latestYearStart: Math.max(...years),
    rows: rows.length,
    sourceDatasets: [...new Set(rows.map((row) => row.source_dataset))].sort(),
    note: "Panel joins the all-India IMD/NOAA monsoon-ENSO derived table to crop APY rows by crop-year start. DES rows provide long final-history coverage for selected aggregates/crops; UPAg rows provide broader crop/season coverage through 2025-26. Estimate stage is retained and should be labeled in analysis."
  }
};

const artifactPath = await writeSeriesArtifact({
  sourceId: "rainfall-crop-panel",
  name: "derived.IN.agriculture.rainfall_crop_apy_panel",
  artifact
});

const manifest = [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  snapshot: snapshot.path,
  rawHash: snapshot.hash,
  rows: rows.length,
  earliestYearStart: Math.min(...years),
  latestYearStart: Math.max(...years),
  fetchedAt
}];

await writeSourceManifest("rainfall-crop-panel", manifest);

console.log(`rainfall-crop APY panel ${rows.length} rows (${Math.min(...years)}-${Math.max(...years)})`);
