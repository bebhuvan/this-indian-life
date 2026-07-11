import { createTableArtifact, writeSeriesArtifact, writeSnapshot, mergeSourceManifest } from "./core/artifacts.mjs";
import { fetchJson } from "./lib/source-http.mjs";

const fetchedAt = new Date().toISOString();

const INDICATORS = [
  {
    code: "SH_UHC_FH40",
    label: "Facing financial hardship from health spending",
    short: "Financial hardship from OOP health spending"
  },
  {
    code: "SH_UHC_FH40_IMPOV",
    label: "Facing impoverishing health spending",
    short: "Impoverishing OOP health spending"
  },
  {
    code: "SH_UHC_FH40_LARGE",
    label: "Large but non-impoverishing health spending",
    short: "Large non-impoverishing OOP health spending"
  }
];

async function fetchIndicator(code) {
  const url = `https://api.worldbank.org/v2/country/IND/indicator/${code}?format=json&per_page=20000`;
  const raw = await fetchJson(url);
  const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
  const observations = rows
    .map((row) => ({
      date: String(row.date),
      value: row.value === null || row.value === undefined ? null : Number(row.value),
      indicator: row.indicator?.value
    }))
    .filter((row) => row.date && Number.isFinite(row.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!observations.length) throw new Error(`No finite observations for ${code}`);
  await writeSnapshot("worldbank", `poverty-health-financial-${code}`, raw);
  return { url, observations, latest: observations.at(-1) };
}

const rows = [];
const sourceUrls = [];
for (const indicator of INDICATORS) {
  const result = await fetchIndicator(indicator.code);
  sourceUrls.push(result.url);
  rows.push({
    label: indicator.short,
    indicator: indicator.label,
    code: indicator.code,
    date: result.latest.date,
    value: Number(result.latest.value.toFixed(2))
  });
}

const artifact = createTableArtifact({
  indicatorId: "econ.poverty.health_financial_hardship",
  title: "Financial hardship from out-of-pocket health spending",
  sourceId: "worldbank",
  sourceIndicatorId: INDICATORS.map((item) => item.code).join(", "),
  sourceUrl: "https://data.worldbank.org/indicator/SH_UHC_FH40",
  unit: "% of population",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    provenance: "World Bank World Development Indicators / Universal Health Coverage financial protection indicators, fetched from the World Bank API.",
    method: "Each row uses the latest finite India observation for that indicator. The indicators measure population shares affected by out-of-pocket health spending under the World Bank societal-poverty-line financial-protection framework.",
    sourceUrls
  }
});

const file = await writeSeriesArtifact({ sourceId: "worldbank", name: "worldbank.IN.poverty.health_financial_hardship", artifact });
await mergeSourceManifest("worldbank", [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  source: artifact.sourceId,
  artifact: file,
  rows: rows.length,
  fetchedAt
}]);

console.log(`wrote ${file}`);
for (const row of rows) console.log(`${row.label}: ${row.value}% (${row.date})`);
