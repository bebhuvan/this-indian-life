// Derive the long headline-inflation series for the inflation article:
// World Bank "Inflation, consumer prices (annual %)" 1960→2024 (the long backbone),
// spliced with a provisional latest-year point from MOSPI monthly CPI (annual mean
// of YoY) for any year beyond World Bank's coverage. Carries an adjustment note.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const read = async (p) => JSON.parse(await readFile(p, "utf8"));

const wb = await read("data/series/worldbank.IN.FP_CPI_TOTL_ZG.json");
const wbPts = (wb.observations || wb.rows || [])
  .map((r) => ({ date: String(r.date ?? r.Year ?? r.year), value: Number(r.value ?? r["Inflation, consumer prices (annual %)"]) }))
  .filter((p) => p.date && Number.isFinite(p.value));
const wbLastYear = Math.max(...wbPts.map((p) => Number(p.date)));

// MOSPI combined General YoY inflation -> annual means for years beyond WB.
const mospi = await read("data/series/mospi.IN.prices.cpi.combined.general.inflation.json");
const byYear = new Map();
for (const o of mospi.observations) {
  const y = Number(o.date.slice(0, 4));
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y).push(o.value);
}
const spliced = [];
const observations = wbPts.map((p) => ({ date: p.date, value: Math.round(p.value * 100) / 100 }));
for (const [y, vals] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
  if (y > wbLastYear && vals.length === 12) {
    const avg = Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
    observations.push({ date: String(y), value: avg });
    spliced.push(y);
  }
}

const artifact = createSeriesArtifact({
  indicatorId: "prices.cpi.headline_annual_long",
  title: "India's consumer price inflation, 1960 to today",
  sourceId: "worldbank",
  sourceIndicatorId: "FP.CPI.TOTL.ZG + MOSPI splice",
  sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN",
  unit: "% per year",
  frequency: "annual",
  geography: { type: "country", id: "IND", name: "India" },
  fetchedAt,
  observations,
  metadata: {
    derived: `World Bank annual CPI inflation 1960–${wbLastYear}; year(s) ${spliced.join(", ") || "none"} are the annual mean of MOSPI monthly YoY CPI inflation (Combined), provisional.`,
    splicedYears: spliced,
    sources: ["worldbank", "mospi"]
  }
});
const path = await writeSeriesArtifact({ sourceId: "worldbank", name: "worldbank.IN.prices.cpi.headline_annual_long", artifact });
await writeSourceManifest("india-inflation-derived", [{ status: "ready", indicatorId: "prices.cpi.headline_annual_long", observations: observations.length, artifact: path, splicedYears: spliced, fetchedAt }]);
console.log(`Derived headline_annual_long: ${observations.length} points, WB to ${wbLastYear}, spliced ${spliced.join(", ") || "none"}. Latest: ${JSON.stringify(observations[observations.length - 1])}`);
