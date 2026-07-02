import { fetchJson } from "./lib/source-http.mjs";
import { climateTraceUrl } from "./adapters/climatetrace.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://climatetrace.org/";
const countries = new Map([
  ["CHN", "China"],
  ["USA", "United States"],
  ["IND", "India"],
  ["RUS", "Russia"],
  ["BRA", "Brazil"],
  ["IDN", "Indonesia"]
]);
const year = "2023";

const raw = await fetchJson(climateTraceUrl("/country/emissions", {
  countries: [...countries.keys()].join(","),
  since: year,
  to: year
}));
const snapshot = await writeSnapshot("climatetrace", `country-emissions.top-methane-emitters.${year}`, raw);

const rows = (Array.isArray(raw) ? raw : [])
  .map((entry) => ({
    name: countries.get(entry.country) || entry.country,
    group: entry.country === "IND" ? "India" : "Comparator",
    value: entry.emissions?.ch4 ?? null,
    rank: entry.rank ?? null
  }))
  .filter((row) => Number.isFinite(row.value))
  .sort((a, b) => b.value - a.value);

const artifact = createTableArtifact({
  indicatorId: "climate.climatetrace.top_methane_emitters",
  title: `Top methane-emitting countries, ${year}`,
  sourceId: "climatetrace",
  sourceIndicatorId: `country/emissions/top-methane-emitters/${year}`,
  sourceUrl,
  unit: "tonnes CH4",
  geography: { type: "multi-country", id: "selected", name: "Selected countries" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: { year }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "climatetrace",
  name: "climatetrace.global.top_methane_emitters",
  artifact
});

await writeSourceManifest("climatetrace-global-methane", [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  snapshot: snapshot.path,
  rawHash: snapshot.hash,
  rows: rows.length,
  fetchedAt
}]);

console.log(`Wrote top-methane-emitters artifact with ${rows.length} rows.`);
