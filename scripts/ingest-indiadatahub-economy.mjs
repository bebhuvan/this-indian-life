import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createSeriesArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const indiaDataHubEconomyIndicators = [
  { id: "econ.idh.nominal_gdp_annual", sourceIndicatorId: "NAGDNOMGDP12A", title: "Nominal GDP, annual", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.real_gdp_annual", sourceIndicatorId: "NAGDREAGDP12A", title: "Real GDP, annual", unit: "rupees, 2011-12 prices", frequency: "annual" },
  { id: "econ.idh.nominal_gdp_quarterly", sourceIndicatorId: "NAGDNOMGDP12Q", title: "Nominal GDP, quarterly", unit: "rupees", frequency: "quarterly" },
  { id: "econ.idh.real_gdp_quarterly", sourceIndicatorId: "NAGDREAGDP12Q", title: "Real GDP, quarterly", unit: "rupees, 2011-12 prices", frequency: "quarterly" },
  { id: "econ.idh.per_capita_nominal_gdp", sourceIndicatorId: "NAGDNPCGDP12A", title: "Per capita nominal GDP", unit: "rupees per person", frequency: "annual" },
  { id: "econ.idh.gva_agriculture_nominal", sourceIndicatorId: "NAGDNAGGVA12A", title: "Nominal GVA, agriculture and allied activities", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.gva_industry_nominal", sourceIndicatorId: "NAGDNINGVA12A", title: "Nominal GVA, industry", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.gva_services_nominal", sourceIndicatorId: "NAGDNSVGVA12A", title: "Nominal GVA, services", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.private_consumption_nominal", sourceIndicatorId: "NAGDNSPFCE12A", title: "Nominal private final consumption expenditure", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.gross_capital_formation_nominal", sourceIndicatorId: "NAGDNSGCFA12A", title: "Nominal gross capital formation", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.government_consumption_nominal", sourceIndicatorId: "NAGDNSGFCE12A", title: "Nominal government final consumption expenditure", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.exports_nominal", sourceIndicatorId: "NAGDNSXGAS12A", title: "Nominal exports of goods and services", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.imports_nominal", sourceIndicatorId: "NAGDNSIGAS12A", title: "Nominal imports of goods and services", unit: "rupees", frequency: "annual" },
  { id: "econ.idh.net_exports_nominal", sourceIndicatorId: "NAGDNSNXGS12A", title: "Nominal net exports of goods and services", unit: "rupees", frequency: "annual" }
];

function rowsFromPayload(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  return Array.isArray(dataset?.data) ? dataset.data : [];
}

function observationsFromRows(rows) {
  return rows
    .map((row) => ({
      date: String(row.Date || row.date || ""),
      value: row.India === null || row.India === undefined ? null : Number(row.India)
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function artifactName(indicator) {
  return `indiadatahub.IN.${indicator.sourceIndicatorId}`;
}

const manifest = [];
const failures = [];
const sourceUrl = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";

for (const indicator of indiaDataHubEconomyIndicators) {
  try {
    const raw = await fetchIndiaEconomySeries({ id: indicator.sourceIndicatorId, fields: "India" });
    const rows = rowsFromPayload(raw);
    const observations = observationsFromRows(rows);
    const snapshot = await writeSnapshot("indiadatahub", indicator.sourceIndicatorId, raw);
    const artifact = createSeriesArtifact({
      indicatorId: indicator.id,
      title: indicator.title,
      sourceId: "indiadatahub",
      sourceIndicatorId: indicator.sourceIndicatorId,
      sourceUrl,
      unit: indicator.unit,
      frequency: indicator.frequency,
      geography: { type: "country", id: "IN", name: "India" },
      fetchedAt,
      observations,
      metadata: {
        sourceCategory: "National Accounts",
        sourceSubcategory: "GDP",
        sourceOwner: rows.length ? raw.dataset?.[0]?.Source : "CSO"
      }
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "indiadatahub",
      name: artifactName(indicator),
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: indicator.id,
      sourceIndicatorId: indicator.sourceIndicatorId,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      observations: observations.length,
      fetchedAt
    });
    console.log(`indiadatahub ${sourceSlug(indicator.id)} ${observations.length} observations`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: indicator.id,
      sourceIndicatorId: indicator.sourceIndicatorId,
      fetchedAt,
      error: error.message
    });
    console.warn(`indiadatahub ${sourceSlug(indicator.id)} failed: ${error.message}`);
  }
}

await writeSourceManifest("indiadatahub", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} IndiaDataHub economy artifacts; ${failures.length} failure(s).`);
