// Country-level fertility projection for the fertility-divergence article.
//
// Pairs with the STATE-level projection (NCP choropleth "Where each state is
// heading, 2031-35"). This is the national trajectory: India's total fertility
// rate as measured and projected by the UN World Population Prospects 2024,
// median variant, 2000-2100. Source table: data/series/un-population.IN.indicator-19
// (UN WPP indicator 19, Total fertility rate, all variants). We take the Median
// variant and keep the 80% prediction interval at key horizons for the caveat.
//
// Story: India crossed below the 2.1 replacement line around 2020 and the UN
// projects it keeps easing to ~1.7 and settles there for the rest of the century
// -- it never climbs back to replacement.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSeriesArtifact } from "./core/artifacts.mjs";

const ROOT = process.cwd();
const OUT = resolve(ROOT, "data/series");
const SRC = resolve(OUT, "un-population.IN.indicator-19.2000-2100.json");
const WPP_URL = "https://population.un.org/wpp/";
const FETCHED = "2026-07-10T00:00:00.000Z";

const round2 = (v) => (v === null || v === undefined ? null : Math.round(v * 1000) / 1000);
const table = JSON.parse(readFileSync(SRC, "utf8"));
const rows = table.rows || [];

const byVariant = (name) =>
  rows
    .filter((r) => r.variant === name)
    .map((r) => ({ date: String(r.timeLabel), value: round2(r.value) }))
    .sort((a, b) => Number(a.date) - Number(b.date));

const median = byVariant("Median");
const lo80 = new Map(byVariant("80% lower bound").map((o) => [o.date, o.value]));
const hi80 = new Map(byVariant("80% upper bound").map((o) => [o.date, o.value]));

if (median.length < 50) {
  console.error("Median TFR series looks short:", median.length);
  process.exit(1);
}

// First year the median dips below replacement (2.1).
const crossing = median.find((o) => o.value < 2.1)?.date ?? null;
const at = (yr) => median.find((o) => o.date === yr)?.value ?? null;
const band = (yr) => [lo80.get(yr) ?? null, hi80.get(yr) ?? null];

const artifact = createSeriesArtifact({
  indicatorId: "people.projections.un_tfr_median",
  title: "India's fertility rate to 2100",
  sourceId: "un-population",
  sourceIndicatorId: "UN WPP 2024 total fertility rate, India, median variant",
  sourceUrl: WPP_URL,
  unit: "births per woman",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt: FETCHED,
  observations: median,
  metadata: {
    model: "UN WPP 2024 (median variant)",
    replacement: 2.1,
    crossedBelowReplacement: crossing,
    tfr2023: at("2023"),
    tfr2050: at("2050"),
    tfr2100: at("2100"),
    band80_2050: band("2050"),
    band80_2100: band("2100"),
    note:
      "Median variant of the UN World Population Prospects 2024. Values through 2023 are estimates; 2024 onward are projections. The 80% prediction interval is stored for the caveat."
  }
});

writeFileSync(resolve(OUT, "un-population.IN.people_un_tfr_projection.json"), JSON.stringify(artifact, null, 2) + "\n");
console.log("wrote un-population.IN.people_un_tfr_projection.json");
console.log(`  median 2000=${at("2000")} 2023=${at("2023")} 2050=${at("2050")} 2100=${at("2100")}`);
console.log(`  crossed below replacement (2.1) in ${crossing}`);
console.log(`  80% band 2050=${band("2050").join("-")}  2100=${band("2100").join("-")}`);
