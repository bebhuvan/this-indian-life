import { mkdir, writeFile } from "node:fs/promises";
import { createTableArtifact, stableJson, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const indicatorId = "HH_LS";
const sourceUrl = "https://www.imf.org/external/datamapper/HH_LS@GDD";
const seriesUrl = `https://www.imf.org/external/datamapper/api/v1/${indicatorId}`;
const countriesUrl = "https://www.imf.org/external/datamapper/api/v1/countries";
const indicatorsUrl = "https://www.imf.org/external/datamapper/api/v1/indicators";

const selectedCountries = new Set([
  "AUS", "BRA", "CAN", "CHN", "DEU", "FRA", "GBR", "IDN", "IND", "ITA", "JPN", "KOR", "MEX", "MYS", "THA", "USA", "VNM", "ZAF"
]);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`IMF request failed: ${response.status} ${response.statusText} ${url}`);
  return response.json();
}

const [seriesPayload, countriesPayload, indicatorsPayload] = await Promise.all([
  fetchJson(seriesUrl),
  fetchJson(countriesUrl),
  fetchJson(indicatorsUrl)
]);

const [seriesSnapshot, countriesSnapshot, indicatorsSnapshot] = await Promise.all([
  writeSnapshot("imf", "datamapper-HH_LS", seriesPayload),
  writeSnapshot("imf", "datamapper-countries", countriesPayload),
  writeSnapshot("imf", "datamapper-indicators", indicatorsPayload)
]);

const countryLabels = countriesPayload.countries || {};
const indicatorMeta = indicatorsPayload.indicators?.[indicatorId] || {};
const valuesByCountry = seriesPayload.values?.[indicatorId] || {};
const rows = [];

for (const [countryCode, yearValues] of Object.entries(valuesByCountry)) {
  if (!selectedCountries.has(countryCode)) continue;
  for (const [year, value] of Object.entries(yearValues || {})) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) continue;
    rows.push({
      datasetKey: "imf_gdd_household_debt",
      metric: "household_debt_pct_gdp",
      countryCode,
      country: countryLabels[countryCode]?.label || countryCode,
      period: year,
      date: year,
      frequency: "annual",
      value: numeric,
      NumericValue: numeric,
      unit: "Percent of GDP",
      sourceIndicatorId: indicatorId,
      sourceLabel: indicatorMeta.label || "Household debt, loans and debt securities",
      sourceDescription: indicatorMeta.description || "",
      sourceDataset: indicatorMeta.dataset || "GDD",
      sourceVintage: indicatorMeta.source || "",
      sourceLastModified: indicatorMeta["last-modified"] || ""
    });
  }
}

rows.sort((a, b) => `${a.countryCode}:${a.period}`.localeCompare(`${b.countryCode}:${b.period}`));

const artifact = createTableArtifact({
  indicatorId: "credit.imf.household_debt_pct_gdp",
  title: "IMF Global Debt Database household debt, loans and debt securities",
  sourceId: "imf",
  sourceIndicatorId: "HH_LS@GDD",
  sourceUrl,
  unit: "Percent of GDP",
  geography: { type: "multi-country", id: "selected", name: "Selected countries" },
  fetchedAt,
  dimensions: ["countryCode", "period"],
  rows,
  metadata: {
    method: "Fetched IMF DataMapper HH_LS JSON and retained selected countries for the India borrowing article.",
    apiUrls: { seriesUrl, countriesUrl, indicatorsUrl },
    snapshots: {
      series: seriesSnapshot.path,
      countries: countriesSnapshot.path,
      indicators: indicatorsSnapshot.path
    },
    rawHashes: {
      series: seriesSnapshot.hash,
      countries: countriesSnapshot.hash,
      indicators: indicatorsSnapshot.hash
    },
    indicator: indicatorMeta,
    selectedCountries: [...selectedCountries],
    caveats: [
      "IMF GDD is annual and broader than RBI bank-credit composition data.",
      "HH_LS is household debt by loans and debt securities as a share of GDP.",
      "Use this for international context, not for Indian loan-product composition."
    ]
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "imf",
  name: "imf.GDD.HH_LS.household_debt_pct_gdp.long",
  artifact
});

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/imf-household-debt-manifest.json", `${stableJson({
  schemaVersion: 1,
  sourceId: "imf",
  generatedAt: fetchedAt,
  sourceUrl,
  apiUrl: seriesUrl,
  artifact: artifactPath,
  rows: rows.length,
  coverage: {
    firstPeriod: rows.map((row) => row.period).sort()[0] || null,
    latestPeriod: rows.map((row) => row.period).sort().at(-1) || null,
    selectedCountries: [...selectedCountries]
  },
  indicator: indicatorMeta
})}\n`);

console.log(`Wrote ${artifactPath} with ${rows.length} IMF household-debt rows.`);
