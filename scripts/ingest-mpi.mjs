// Ingest NITI Aayog National MPI 2023 (multidimensional poverty headcount, 2019-21)
// as a state choropleth joined onto the ERA5 state-warming SVG paths.
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("data/manual/mpi-niti-2023.json", "utf8"));
const stateArt = JSON.parse(readFileSync("data/series/era5.IN.state_warming.json", "utf8"));
const fetchedAt = new Date().toISOString();
const base = {
  schemaVersion: 1, sourceId: "niti", sourceIndicatorId: "National MPI 2023, headcount ratio (NFHS-5)",
  sourceUrl: data.sourceUrl, geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt, metadata: { study: data.source, year: data.year, method: data.method }
};

const byName = new Map(data.byState.map((r) => [r.state, r.mpi]));
const regions = stateArt.regions.map((r) => {
  const v = byName.get(r.name);
  return { name: r.name, value: (v === undefined || v === null) ? null : v, path: r.path };
});
const values = regions.map((r) => r.value).filter((v) => v !== null);
writeFileSync("data/series/niti.IN.mpi_by_state.json", `${JSON.stringify({
  ...base, artifactType: "choropleth", indicatorId: "heat.poverty.mpi_by_state",
  title: "Multidimensional poverty by state", unit: "% multidimensionally poor",
  viewBox: stateArt.viewBox, min: 0, max: Math.ceil(Math.max(...values)), regions
}, null, 2)}\n`);

// headline national series for prose
writeFileSync("data/series/niti.IN.mpi_national.json", `${JSON.stringify({
  ...base, artifactType: "series", indicatorId: "heat.poverty.mpi_national",
  title: "Multidimensional poverty, all India", unit: "% multidimensionally poor",
  frequency: "one-off survey", dimensions: [], geography: { type: "country", id: "IND", name: "India" },
  observations: [{ date: "2021", value: data.national2019_21 }]
}, null, 2)}\n`);

const matched = regions.filter((r) => r.value !== null).length;
console.log(`wrote MPI choropleth (${matched}/${regions.length} states, max ${Math.ceil(Math.max(...values))}%) + national series (${data.national2019_21}%)`);
