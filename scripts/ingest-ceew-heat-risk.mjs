// Ingest CEEW district Heat Risk Index (2025) for the heat article: a state choropleth of
// the share of each state's districts at high/very-high heat risk (composite HRI, Table 6),
// plus headline series (district + population shares) for prose. Joins onto the ERA5
// state-warming SVG paths so it lines up with the warming map.
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("data/manual/ceew-heat-risk.json", "utf8"));
const stateArtifact = JSON.parse(readFileSync("data/series/era5.IN.state_warming.json", "utf8"));
const fetchedAt = new Date().toISOString();
const base = {
  schemaVersion: 1, sourceId: "ceew", sourceIndicatorId: "Heat Risk Index 2025 (Table 6)",
  sourceUrl: data.sourceUrl, geography: { type: "country", id: "IND", name: "India" },
  fetchedAt, metadata: { study: data.source, method: data.method }
};

// Choropleth: share of districts at high/very-high risk, by state.
const pctByName = new Map(data.byState.map((r) => [r.state, r.highVeryHighPct]));
const regions = stateArtifact.regions.map((r) => {
  const v = pctByName.get(r.name);
  return { name: r.name, value: (v === undefined || v === null) ? null : v, path: r.path };
});
const values = regions.map((r) => r.value).filter((v) => v !== null);
writeFileSync("data/series/ceew.IN.state_heat_risk.json", `${JSON.stringify({
  ...base, artifactType: "choropleth", indicatorId: "heat.ceew.state_heat_risk",
  title: "Share of districts at high or very high heat risk, by state",
  unit: "% of districts", geography: { type: "subnational", id: "IND-states", name: "India states" },
  viewBox: stateArtifact.viewBox, min: 0, max: 100, regions
}, null, 2)}\n`);

// Headline series for prose citation.
function series(slug, indicatorId, title, value, unit) {
  writeFileSync(`data/series/ceew.IN.${slug}.json`, `${JSON.stringify({
    ...base, artifactType: "series", indicatorId, title, unit, frequency: "one-off study",
    dimensions: [], observations: [{ date: "2025", value }]
  }, null, 2)}\n`);
}
series("districts_high_risk_share", "heat.ceew.districts_high_risk_share", "Districts at high/very-high heat risk", data.headline.shareDistrictsHighVeryHigh, "% of districts");
series("population_high_risk_share", "heat.ceew.population_high_risk_share", "Population at high/very-high heat risk", data.headline.sharePopulationHighVeryHigh, "% of population");

const matched = regions.filter((r) => r.value !== null).length;
console.log(`wrote CEEW heat-risk choropleth (${matched}/${regions.length} states matched, max ${Math.max(...values)}%) + 2 headline series`);