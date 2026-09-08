// India's NEW 2024-base CPI, via IndiaDataHub — the only route to consumer prices
// through the 2026 energy shock.
//
// Why this exists: MOSPI rebased the CPI from 2012 to 2024 (COICOP 2018 classes)
// with effect from January 2026. The eSankhyiki open API still serves only the OLD
// 2012-base series, which STOPS AT DECEMBER 2025 — one month before the conflict
// began. Every 2012-base artifact under data/series/mospi.IN.prices.cpi.* therefore
// ends before the shock and cannot be extended.
//
// The two bases are NOT splice-compatible: different basket, different weights, and
// a different classification tree (the old "Fuel and light" group has no exact
// counterpart; its content is split across "Electricity, Gas, Fuels" under Housing
// and "Fuels and Lubricants" under Transport). Treat January 2026 as a hard break.
//
// The 2024-base index starts December 2024, so year-on-year inflation is computable
// from December 2025 onward — which happens to cover exactly the shock window. This
// script computes it rather than fetching it, because IDH publishes index levels only.
//
// Source: IndiaDataHub Economic Monitor (licensed feed, key in .env), restating MOSPI.
// Run: node scripts/ingest-idh-cpi-2024-base.mjs

import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createSeriesArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE_URL = "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi";
const IDH_URL = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";

// slug, IDH identifier, title, whether to also emit a computed y/y inflation series
const SERIES = [
  ["general", "INCPTTALLC24M", "CPI, all commodities", true],
  ["food_beverages", "INCPFBALLC24M", "CPI, food and beverages", true],
  ["housing_utilities", "INCPHWALLC24M", "CPI, housing, water, electricity and fuels", true],
  ["transport", "INCPTRALLC24M", "CPI, transport", true],
  ["electricity_gas_fuels", "INCPHWEFTT24M", "CPI, electricity, gas and fuels", true],
  ["gas", "INCPHWEFGS24M", "CPI, gas", true],
  ["liquid_fuels", "INCPHWEFLF24M", "CPI, liquid fuels", true],
  ["solid_fuels", "INCPHWEFSF24M", "CPI, solid fuels", true],
  ["electricity", "INCPHWEFEL24M", "CPI, electricity", true],
  ["transport_fuels_lubricants", "INCPTROTFL24M", "CPI, fuels and lubricants for personal transport", true],
  ["bus_coach_fare", "INTRPTROCB24M", "CPI, passenger transport by bus and coach", true],
  ["item_lpg", "CPIDLPLPAS24M", "CPI, LPG cylinder and piped natural gas", true],
  ["item_kerosene", "CPIDLIKENE24M", "CPI, kerosene", true],
  ["item_petrol", "CPIDPEPEOL24M", "CPI, petrol", true],
  ["item_diesel", "CPIDDIDIEL24M", "CPI, diesel", true],
  ["item_cng", "CPIDOTOTNG24M", "CPI, CNG and other natural gas", true],
  ["item_firewood", "CPIDFIFIPS24M", "CPI, firewood and chips", true]
];

const WEIGHTS = [
  ["weight_general", "INCWTTALLC24M", "CPI weight, all commodities"],
  ["weight_food_beverages", "INCWFBALLC24M", "CPI weight, food and beverages"],
  ["weight_housing_utilities", "INCWHWALLC24M", "CPI weight, housing, water, electricity and fuels"],
  ["weight_transport", "INCWTRALLC24M", "CPI weight, transport"]
];

const BASE_NOTE =
  "MOSPI rebased the CPI to 2024 (COICOP 2018) from January 2026. This series is NOT " +
  "continuous with the 2012-base mospi.IN.prices.cpi.* artifacts, which end in December " +
  "2025. Do not splice them.";

function observationsFrom(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  const rows = Array.isArray(dataset?.data) ? dataset.data : [];
  const observations = rows
    .map((row) => ({
      date: String(row.Date || row.date || "").slice(0, 7),
      value: row.India == null ? null : Number(row.India)
    }))
    .filter((row) => /^\d{4}-\d{2}$/.test(row.date) && row.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { observations, title: dataset?.Title, unit: dataset?.Unit, source: dataset?.Source };
}

// Year-on-year percent change. The 2024-base index starts 2024-12, so the first
// computable point is 2025-12 — the month before the conflict.
function yearOnYear(observations) {
  const byDate = new Map(observations.map((point) => [point.date, point.value]));
  return observations
    .map((point) => {
      const [year, month] = point.date.split("-");
      const previous = byDate.get(`${Number(year) - 1}-${month}`);
      if (previous == null || previous === 0) return null;
      return { date: point.date, value: Number((((point.value / previous) - 1) * 100).toFixed(2)) };
    })
    .filter(Boolean);
}

const manifest = [];
const written = [];
const failures = [];

async function emit(name, indicatorId, title, unit, observations, metadata) {
  const artifact = createSeriesArtifact({
    indicatorId,
    title,
    sourceId: "indiadatahub",
    sourceIndicatorId: metadata.idhIdentifier,
    sourceUrl: SOURCE_URL,
    unit,
    frequency: "monthly",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: { baseYear: 2024, baseBreak: "2026-01", baseNote: BASE_NOTE, distributor: IDH_URL, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: "indiadatahub", name, artifact });
  manifest.push({ status: "ready", indicatorId, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, observations: observations.length, fetchedAt });
  written.push([indicatorId, observations.length, observations.at(0)?.date, observations.at(-1)?.date, observations.at(-1)?.value]);
}

for (const [slug, identifier, title, wantInflation] of SERIES) {
  try {
    const raw = await fetchIndiaEconomySeries({ id: identifier, fields: "India" });
    await writeSnapshot("indiadatahub", `cpi24.${identifier}`, raw);
    const { observations, title: idhTitle, source } = observationsFrom(raw);
    if (!observations.length) {
      failures.push([identifier, "no rows"]);
      continue;
    }
    await emit(
      `indiadatahub.IN.prices.cpi24.${slug}.index`,
      `prices.cpi24.${slug}.index`,
      `${title} (2024 = 100)`,
      "index, 2024 = 100",
      observations,
      { idhIdentifier: identifier, idhTitle, upstream: source || "MOSPI/NSO" }
    );
    if (wantInflation) {
      const inflation = yearOnYear(observations);
      if (inflation.length) {
        await emit(
          `indiadatahub.IN.prices.cpi24.${slug}.inflation`,
          `prices.cpi24.${slug}.inflation`,
          `${title}, year-on-year inflation`,
          "% year on year",
          inflation,
          {
            idhIdentifier: identifier,
            idhTitle,
            upstream: source || "MOSPI/NSO",
            derived: "Computed here as the 12-month percent change in the 2024-base index; IDH publishes index levels only.",
            firstComputable: inflation.at(0)?.date
          }
        );
      }
    }
  } catch (error) {
    failures.push([identifier, error.message]);
  }
}

for (const [slug, identifier, title] of WEIGHTS) {
  try {
    const raw = await fetchIndiaEconomySeries({ id: identifier, fields: "India" });
    await writeSnapshot("indiadatahub", `cpi24.${identifier}`, raw);
    const { observations, title: idhTitle, source } = observationsFrom(raw);
    if (!observations.length) {
      failures.push([identifier, "no rows"]);
      continue;
    }
    await emit(
      `indiadatahub.IN.prices.cpi24.${slug}`,
      `prices.cpi24.${slug}`,
      `${title} (2024 base)`,
      "percent of the CPI basket",
      observations,
      { idhIdentifier: identifier, idhTitle, upstream: source || "MOSPI/NSO" }
    );
  } catch (error) {
    failures.push([identifier, error.message]);
  }
}

await mergeSourceManifest("indiadatahub", manifest);

for (const [id, n, first, last, latest] of written) {
  console.log(`  ${id.padEnd(46)} ${String(n).padStart(3)} obs  ${first}..${last}  latest=${latest}`);
}
console.log(`\n${written.length} artifacts written.`);
if (failures.length) {
  console.log("\nFailures:");
  for (const [id, why] of failures) console.log(`  ${id}: ${why}`);
}
