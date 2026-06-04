import { fetchTradeStatCommodityAllCountriesImport } from "./adapters/tradestat.mjs";
import { createTableArtifact, mergeSourceManifest, writeRawSnapshot, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const hsCode = "270900";
const fiscalYears = (process.env.TRADESTAT_HISTORY_YEARS || "2017,2018,2019,2020,2021,2022,2023,2024,2025")
  .split(",")
  .map((year) => year.trim())
  .filter(Boolean);
const indicatorId = "energy.tradestat.crude_oil_imports_partner_history";
const selectedCountries = [
  { key: "RUSSIA", label: "Russia" },
  { key: "IRAQ", label: "Iraq" },
  { key: "SAUDI ARAB", label: "Saudi Arabia" },
  { key: "U ARAB EMTS", label: "UAE" },
  { key: "U S A", label: "US" },
  { key: "IRAN", label: "Iran" }
];

function fiscalYearLabel(year) {
  return `${year}-${String(Number(year) + 1).slice(-2)}`;
}

function countryKey(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
}

const rows = [];
const snapshots = [];

for (const fiscalYear of fiscalYears) {
  const { html, parsed } = await fetchTradeStatCommodityAllCountriesImport({
    hsCode,
    fiscalYear,
    report: "2"
  });
  const htmlSnapshot = await writeRawSnapshot("tradestat", `${hsCode}.imports.${fiscalYear}.history.html`, html, "html");
  const jsonSnapshot = await writeSnapshot("tradestat", `${hsCode}.imports.${fiscalYear}.history.parsed`, parsed);
  snapshots.push({
    fiscalYear,
    htmlSnapshot: htmlSnapshot.path,
    htmlHash: htmlSnapshot.hash,
    parsedSnapshot: jsonSnapshot.path,
    parsedHash: jsonSnapshot.hash,
    rows: parsed.rows.length
  });

  const byCountry = new Map(parsed.rows.map((row) => [countryKey(row.country), row]));
  const ranked = parsed.rows
    .filter((row) => Number(row.valueCurrentUsdMillion) > 0)
    .sort((a, b) => b.valueCurrentUsdMillion - a.valueCurrentUsdMillion);
  const rankByCountry = new Map(ranked.map((row, index) => [countryKey(row.country), index + 1]));

  for (const country of selectedCountries) {
    const sourceRow = byCountry.get(country.key);
    rows.push({
      fiscalYear,
      fiscalYearLabel: fiscalYearLabel(fiscalYear),
      country: country.label,
      sourceCountry: sourceRow?.country || country.key,
      valueUsdMillion: sourceRow?.valueCurrentUsdMillion || 0,
      quantity: sourceRow?.quantityCurrent || 0,
      rank: rankByCountry.get(country.key) || null
    });
  }
  console.log(`tradestat crude partner history ${fiscalYear}: ${parsed.rows.length} source rows`);
}

const artifact = createTableArtifact({
  indicatorId,
  title: "Crude oil imports by partner over time",
  sourceId: "tradestat",
  sourceIndicatorId: `${hsCode}.imports.partner-history.${fiscalYears[0]}-${fiscalYears.at(-1)}`,
  sourceUrl: "https://tradestat.commerce.gov.in/eidb/commodity_wise_all_countries_import",
  unit: "US$ million and quantity",
  geography: { type: "country", id: "IND", name: "India" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    hsCode,
    report: "2",
    fiscalYears,
    countries: selectedCountries,
    snapshots
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "tradestat",
  name: `tradestat.IN.${indicatorId}`,
  artifact
});

await mergeSourceManifest("tradestat", [{
  status: "ready",
  indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  rows: rows.length,
  fiscalYears,
  fetchedAt
}]);

console.log(`tradestat ${indicatorId} ${rows.length} rows`);
