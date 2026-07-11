import { createTableArtifact, mergeSourceManifest, stableJson, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";
import { parseCsv } from "./core/csv.mjs";

const slug = "annual-temperature-anomalies";
const sourceUrl = `https://ourworldindata.org/grapher/${slug}`;
const csv = await fetch(`${sourceUrl}.csv`).then((response) => {
  if (!response.ok) throw new Error(`OWID fetch failed: ${response.status}`);
  return response.text();
});

const wanted = new Map([
  ["OWID_WRL", "World"],
  ["IND", "India"],
  ["BGD", "Bangladesh"],
  ["PAK", "Pakistan"],
  ["CHN", "China"],
  ["IDN", "Indonesia"],
  ["VNM", "Vietnam"],
  ["LKA", "Sri Lanka"],
  ["THA", "Thailand"],
  ["USA", "United States"],
  ["BRA", "Brazil"]
]);

const rows = parseCsv(csv)
  .filter((row) => wanted.has(row.Code))
  .map((row) => ({
    entity: wanted.get(row.Code),
    code: row.Code,
    year: Number(row.Year),
    anomaly: Number(row["Temperature anomaly"])
  }))
  .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.anomaly));

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const out = [];
for (const [code, label] of wanted.entries()) {
  const countryRows = rows.filter((row) => row.code === code);
  const early = countryRows.filter((row) => row.year >= 1940 && row.year <= 1949).map((row) => row.anomaly);
  const recent = countryRows.filter((row) => row.year >= 2016 && row.year <= 2025).map((row) => row.anomaly);
  if (early.length < 8 || recent.length < 8) continue;
  const earlyMean = mean(early);
  const recentMean = mean(recent);
  out.push({
    label,
    value: Number((recentMean - earlyMean).toFixed(2)),
    group: code === "IND" ? "India" : code === "OWID_WRL" ? "World" : "Comparator",
    code,
    earlyPeriod: "1940-1949",
    recentPeriod: "2016-2025",
    earlyMean: Number(earlyMean.toFixed(3)),
    recentMean: Number(recentMean.toFixed(3)),
    note: "Difference between each entity's 2016-2025 average annual temperature anomaly and its 1940-1949 average annual temperature anomaly."
  });
}

out.sort((a, b) => b.value - a.value);

const fetchedAt = new Date().toISOString();
const snapshot = await writeSnapshot("owid", "warming-comparison-1940s-to-latest-decade", {
  sourceUrl: `${sourceUrl}.csv`,
  method: "Mean annual temperature anomaly in 2016-2025 minus mean annual temperature anomaly in 1940-1949, by entity.",
  rows: out
});

const artifact = createTableArtifact({
  indicatorId: "compare.climate.warming_since_1940s",
  title: "Warming since the 1940s, selected countries",
  sourceId: "owid",
  sourceIndicatorId: slug,
  sourceUrl,
  unit: "°C warmer, 2016-2025 vs 1940-1949",
  geography: { type: "multi-country", id: "selected", name: "Selected countries and world" },
  fetchedAt,
  rows: out,
  dimensions: Object.keys(out[0] || {}),
  metadata: {
    method: "Each bar is the difference between two decade averages from OWID's annual temperature anomaly series. This avoids ranking countries by one noisy latest year."
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "owid-derived",
  name: "compare.climate.warming_since_1940s",
  artifact
});

await mergeSourceManifest("owid-derived", [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  snapshot: snapshot.path,
  rawHash: snapshot.hash,
  rows: out.length,
  fetchedAt
}]);

console.log(stableJson(out));
