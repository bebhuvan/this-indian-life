// Derive the curated artifacts for q.energy.state_transitions from the parsed
// Ember sub-national CSV (written by ingest-ember-states.mjs) plus the existing
// national Ember generation table (for the 2000-2024 long arc).
//
// Emits (all under data/series/, indexed by indicatorId):
//   energy.ember.clean_share_national           series  - chart 1 (line)
//   energy.ember.national.gen.<fuel>            series  - chart 2 (multiLine)
//   energy.ember.state.carbon_intensity_2024    choro   - chart 3 (hero)
//   energy.ember.state.generation_mix_2024      scenarioMaps - chart 4 (3 panels)
//   energy.ember.state.clean_share_change       choro   - chart 7 (signed)
//   energy.ember.state.wind_solar_capacity_2024 table   - chart 5 (tableBars)
//   energy.ember.state.power_emissions_2024      table   - chart 6 (tableBars)
import { readFile, readdir } from "node:fs/promises";
import { writeSeriesArtifact, writeSourceManifest, readJson } from "./core/artifacts.mjs";

// Minimal CSV parser (handles the one quoted-comma variable) for the monthly file.
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function csvObjects(text) {
  const rows = parseCsv(text);
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const SOURCE_URL = "https://ember-energy.org/data/india-electricity-data/";
const SOURCE_ID = "ember-states";
const LATEST = 2024;
const BASE = 2019;
const fetchedAt = new Date().toISOString();

// Ember state name -> choropleth region name (where they differ).
const NAME_FIX = { "Andaman and Nicobar": "Andaman and Nicobar Islands" };
// Aggregate rows -> never treated as states.
const AGGREGATES = new Set(["India Total", "Others"]);

const num = (x) => { const n = Number(x); return Number.isFinite(n) ? n : null; };

async function loadStateRows() {
  const parsed = JSON.parse(await readFile("data/snapshots/ember-states/india_yearly.parsed.json", "utf8"));
  return parsed.rows;
}

// (state, year) -> { "Category|Variable|Unit": value }. Unit is part of the key
// because each generation/emissions variable appears in BOTH a "%" and an
// absolute ("GWh"/"ktCO2") row; keying without unit lets one clobber the other.
function indexRows(rows) {
  const idx = new Map();
  for (const r of rows) {
    const key = r.State + "::" + r.Year;
    if (!idx.has(key)) idx.set(key, {});
    idx.get(key)[r.Category + "|" + r.Variable + "|" + r.Unit] = num(r.Value);
  }
  return idx;
}

function choroArtifact({ indicatorId, title, unit, regions, min, max }) {
  const vals = regions.map((r) => r.value).filter((v) => v != null);
  return {
    schemaVersion: 1,
    artifactType: "choropleth",
    indicatorId,
    title,
    sourceId: SOURCE_ID,
    sourceIndicatorId: "Ember India electricity data (state-level)",
    sourceUrl: SOURCE_URL,
    unit,
    geography: { type: "subnational", id: "IND-states", name: "India states" },
    fetchedAt,
    viewBox: "0 0 740 820",
    min: min ?? Math.min(...vals),
    max: max ?? Math.max(...vals),
    regions
  };
}

function scenarioArtifact({ indicatorId, title, unit, scenarios, min, max }) {
  return {
    schemaVersion: 1,
    artifactType: "choropleth",
    indicatorId,
    title,
    sourceId: SOURCE_ID,
    sourceIndicatorId: "Ember India electricity data (state-level)",
    sourceUrl: SOURCE_URL,
    unit,
    geography: { type: "subnational", id: "IND-states", name: "India states" },
    fetchedAt,
    viewBox: "0 0 740 820",
    min,
    max,
    scenarios
  };
}

function tableArtifact({ indicatorId, title, unit, rows }) {
  return {
    schemaVersion: 1,
    artifactType: "table",
    indicatorId,
    title,
    sourceId: SOURCE_ID,
    sourceIndicatorId: "Ember India electricity data (state-level)",
    sourceUrl: SOURCE_URL,
    unit,
    geography: { type: "subnational", id: "IND-states", name: "India states" },
    dimensions: ["label", "value"],
    fetchedAt,
    rows
  };
}

function seriesArtifact({ indicatorId, title, unit, observations, sourceIndicatorId, sourceUrl }) {
  return {
    schemaVersion: 1,
    artifactType: "series",
    indicatorId,
    title,
    sourceId: SOURCE_ID,
    sourceIndicatorId: sourceIndicatorId || "Ember India electricity data",
    sourceUrl: sourceUrl || SOURCE_URL,
    unit,
    frequency: "annual",
    geography: { type: "country", id: "IN", name: "India" },
    dimensions: [],
    fetchedAt,
    observations,
    metadata: {}
  };
}

async function run() {
  const rows = await loadStateRows();

  if (process.argv.includes("--inspect")) {
    const combos = new Set(rows.map((r) => r.Category + " || " + r.Variable + " || " + r.Unit));
    console.log([...combos].sort().join("\n"));
    return;
  }

  const idx = indexRows(rows);
  const get = (state, year, cat, vr, unit) => idx.get(state + "::" + year)?.[cat + "|" + vr + "|" + unit] ?? null;

  const fert = await readJson("data/series/nfhs.IN.people_nfhs_tfr_by_state.json");
  const pathsMap = Object.fromEntries(fert.regions.map((r) => [r.name, r.path]));

  const states = [...new Set(rows.map((r) => r.State))].filter((s) => !AGGREGATES.has(s));
  const regionName = (s) => NAME_FIX[s] || s;
  const hasPath = (s) => Boolean(pathsMap[regionName(s)]);
  const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
  const region = (s, value) => ({ name: regionName(s), value: round1(value), path: pathsMap[regionName(s)] });
  const mapStates = states.filter(hasPath);

  const manifest = [];
  const add = async (indicatorId, name, artifact) => {
    const path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name, artifact });
    manifest.push({ status: "ready", indicatorId, artifact: path, fetchedAt });
  };

  // ---- Chart 3: carbon intensity by state, 2024 (hero, diverging) ----
  {
    const regions = mapStates.map((s) => region(s, get(s, LATEST, "Power sector emissions", "CO2 intensity", "gCO2/kWh")));
    await add("energy.ember.state.carbon_intensity_2024", "energy.IN.state.carbon_intensity_2024",
      choroArtifact({ indicatorId: "energy.ember.state.carbon_intensity_2024", title: "How clean is each state's electricity?", unit: "gCO2/kWh", regions }));
  }

  // ---- Chart 4: three Indias - hydro / wind+solar / coal share of generation, 2024 ----
  {
    const share = (s, vr) => get(s, LATEST, "Electricity generation", vr, "%");
    const panel = (vr) => mapStates.map((s) => region(s, share(s, vr)));
    const scenarios = [
      { key: "hydro", label: "Hydro", regions: panel("Hydro") },
      { key: "windsolar", label: "Wind + solar", regions: panel("Wind and Solar") },
      { key: "coal", label: "Coal", regions: panel("Coal") }
    ];
    await add("energy.ember.state.generation_mix_2024", "energy.IN.state.generation_mix_2024",
      scenarioArtifact({ indicatorId: "energy.ember.state.generation_mix_2024", title: "Three different ways to run a power grid", unit: "% of generation", scenarios, min: 0, max: 100 }));
  }

  // ---- Chart 7: change in clean-electricity share, 2019->2024 (pp, signed) ----
  {
    const cleanShare = (s, y) => get(s, y, "Electricity generation", "Clean", "%");
    const regions = mapStates.map((s) => {
      const a = cleanShare(s, BASE), b = cleanShare(s, LATEST);
      return region(s, a != null && b != null ? b - a : null);
    });
    await add("energy.ember.state.clean_share_change", "energy.IN.state.clean_share_change",
      choroArtifact({ indicatorId: "energy.ember.state.clean_share_change", title: "Who actually cleaned up their grid, 2019 to 2024", unit: "pp change in clean share", regions }));
  }

  // ---- Chart 5: wind+solar installed capacity by state, 2024 (ranked) ----
  {
    const rowsOut = states
      .map((s) => ({ label: regionName(s), value: get(s, LATEST, "Capacity", "Wind and Solar", "MW") }))
      .filter((r) => r.value != null && r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 18)
      .map((r) => ({ label: r.label, value: Math.round(r.value) }));
    await add("energy.ember.state.wind_solar_capacity_2024", "energy.IN.state.wind_solar_capacity_2024",
      tableArtifact({ indicatorId: "energy.ember.state.wind_solar_capacity_2024", title: "Where India built its wind and solar", unit: "MW installed", rows: rowsOut }));
  }

  // ---- Chart 6: power-sector emissions by state, 2024 (ranked, absolute) ----
  {
    const rowsOut = states
      .map((s) => ({ label: regionName(s), value: get(s, LATEST, "Power sector emissions", "Total emissions", "ktCO2") }))
      .filter((r) => r.value != null && r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 18)
      .map((r) => ({ label: r.label, value: Math.round(r.value) }));
    await add("energy.ember.state.power_emissions_2024", "energy.IN.state.power_emissions_2024",
      tableArtifact({ indicatorId: "energy.ember.state.power_emissions_2024", title: "Where India's power-sector emissions actually come from", unit: "ktCO2 (2024)", rows: rowsOut }));
  }

  // ---- National long arc (charts 1 & 2) from the existing national TWh table ----
  const gen = await readJson("data/series/ember.IN.electricity-generation.yearly.json");
  const natRows = gen.rows.filter((r) => r.entity_code === "IND");
  const byFuel = (fuel) => natRows
    .filter((r) => r.series === fuel)
    .map((r) => ({ date: String(r.date), value: num(r.generation_twh) }))
    .filter((o) => o.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Chart 1: clean share of generation, national, 2000-2024
  {
    const obs = natRows
      .filter((r) => r.series === "Clean")
      .map((r) => ({ date: String(r.date), value: num(r.share_of_generation_pct) }))
      .filter((o) => o.value != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    await add("energy.ember.clean_share_national", "energy.IN.national.clean_share",
      seriesArtifact({ indicatorId: "energy.ember.clean_share_national", title: "Clean share of India's electricity", unit: "% of generation",
        observations: obs, sourceIndicatorId: "Ember electricity-generation (Clean share, India)", sourceUrl: "https://ember-energy.org/data/yearly-electricity-data/" }));
  }

  // Chart 2: generation by fuel, absolute TWh, 2000-2024
  {
    const FUELS = [
      ["Coal", "energy.ember.national.gen.coal"],
      ["Solar", "energy.ember.national.gen.solar"],
      ["Wind", "energy.ember.national.gen.wind"],
      ["Hydro", "energy.ember.national.gen.hydro"],
      ["Nuclear", "energy.ember.national.gen.nuclear"],
      ["Gas", "energy.ember.national.gen.gas"]
    ];
    for (const [fuel, indicatorId] of FUELS) {
      const obs = byFuel(fuel);
      if (obs.length < 2) { console.warn("!! national fuel " + fuel + ": " + obs.length + " obs"); continue; }
      await add(indicatorId, "energy.IN.national.gen." + fuel.toLowerCase(),
        seriesArtifact({ indicatorId, title: fuel + " generation", unit: "TWh", observations: obs,
          sourceIndicatorId: "Ember electricity-generation (" + fuel + ", India)", sourceUrl: "https://ember-energy.org/data/yearly-electricity-data/" }));
    }
  }

  // ---- Capacity factor by fuel (national 2024): why a megawatt isn't a megawatt ----
  {
    const CF_FUELS = ["Nuclear", "Coal", "Hydro", "Wind", "Solar", "Gas", "Bioenergy"];
    const rowsOut = CF_FUELS
      .map((f) => {
        const cap = get("India Total", LATEST, "Capacity", f, "MW");
        const gwh = get("India Total", LATEST, "Electricity generation", f, "GWh");
        if (!cap || cap <= 0 || gwh == null) return null;
        return { label: f, value: Math.round((gwh / (cap * 8760 / 1000)) * 100) };
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
    await add("energy.ember.national.capacity_factor", "energy.IN.national.capacity_factor",
      tableArtifact({ indicatorId: "energy.ember.national.capacity_factor", title: "How much of the year each power source actually runs", unit: "% capacity factor (2024)", rows: rowsOut }));
  }

  // ---- Wind+solar capacity ADDED 2019->2024 by state (the build momentum) ----
  {
    const rowsOut = states
      .map((s) => {
        const a = get(s, BASE, "Capacity", "Wind and Solar", "MW");
        const b = get(s, LATEST, "Capacity", "Wind and Solar", "MW");
        return a != null && b != null ? { label: regionName(s), value: Math.round(b - a) } : null;
      })
      .filter((r) => r && r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
    await add("energy.ember.state.wind_solar_added", "energy.IN.state.wind_solar_added",
      tableArtifact({ indicatorId: "energy.ember.state.wind_solar_added", title: "Who added the most wind and solar since 2019", unit: "MW added, 2019-2024", rows: rowsOut }));
  }

  // ---- Clean share of NEW generation 2019->2024 by state (the decisive test) ----
  {
    const rowsOut = states
      .map((s) => {
        const t19 = get(s, BASE, "Electricity generation", "Total Generation", "GWh");
        const t24 = get(s, LATEST, "Electricity generation", "Total Generation", "GWh");
        const c19 = get(s, BASE, "Electricity generation", "Clean", "GWh");
        const c24 = get(s, LATEST, "Electricity generation", "Clean", "GWh");
        if ([t19, t24, c19, c24].some((v) => v == null)) return null;
        const grow = t24 - t19;
        if (grow < 2000) return null; // drop tiny states where a % is meaningless
        return { label: regionName(s), value: Math.max(0, Math.round(((c24 - c19) / grow) * 100)) };
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
    await add("energy.ember.state.clean_share_of_growth", "energy.IN.state.clean_share_of_growth",
      tableArtifact({ indicatorId: "energy.ember.state.clean_share_of_growth", title: "Of the new power added since 2019, how much was clean?", unit: "% of generation growth that was clean", rows: rowsOut }));
  }

  // ---- Change in absolute power emissions 2019->2024 by state (still climbing) ----
  {
    const regions = mapStates.map((s) => {
      const a = get(s, BASE, "Power sector emissions", "Total emissions", "ktCO2");
      const b = get(s, LATEST, "Power sector emissions", "Total emissions", "ktCO2");
      return region(s, a != null && b != null ? b - a : null);
    });
    await add("energy.ember.state.emissions_change", "energy.IN.state.emissions_change",
      choroArtifact({ indicatorId: "energy.ember.state.emissions_change", title: "Power emissions are still climbing across most of India", unit: "ktCO2 change, 2019 to 2024", regions }));
  }

  // ---- Monthly seasonality (national 2024): the monsoon grid ----
  {
    const dir = "data/snapshots/ember-states";
    const mf = (await readdir(dir)).find((f) => f.startsWith("india_monthly_full_release_long_format") && f.endsWith(".csv"));
    if (mf) {
      const monthly = csvObjects(await readFile(dir + "/" + mf, "utf8"));
      const MFUELS = [
        ["Solar", "energy.ember.national.monthly.solar", "energy.IN.national.monthly.solar"],
        ["Wind", "energy.ember.national.monthly.wind", "energy.IN.national.monthly.wind"],
        ["Hydro", "energy.ember.national.monthly.hydro", "energy.IN.national.monthly.hydro"]
      ];
      for (const [fuel, indicatorId, name] of MFUELS) {
        const obs = monthly
          .filter((r) => r.State === "India Total" && r.Category === "Electricity generation" && r.Variable === fuel && r.Unit === "GWh" && r.Date && r.Date.startsWith(String(LATEST)))
          .map((r) => ({ date: r.Date.slice(0, 7), value: num(r.Value) }))
          .filter((o) => o.value != null)
          .sort((a, b) => a.date.localeCompare(b.date));
        if (obs.length >= 2) {
          await add(indicatorId, name,
            seriesArtifact({ indicatorId, title: fuel + " generation (monthly)", unit: "GWh", observations: obs,
              sourceIndicatorId: "Ember India electricity data (monthly, " + fuel + ", India)" }));
        }
      }
    }
  }

  await writeSourceManifest(SOURCE_ID, manifest);
  console.log("Wrote " + manifest.length + " artifacts:");
  for (const m of manifest) console.log("  " + m.indicatorId + " -> " + m.artifact);
}

run().catch((e) => { console.error(e); process.exit(1); });
