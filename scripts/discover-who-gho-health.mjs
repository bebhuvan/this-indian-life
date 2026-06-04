import { mkdir, writeFile } from "node:fs/promises";
import { searchWhoIndicators, fetchWhoIndicatorForIndiaSample } from "./adapters/who-gho.mjs";
import { stableJson } from "./core/artifacts.mjs";

const args = new Set(process.argv.slice(2));
const probeIndia = args.has("--probe-india");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const probeLimit = limitArg ? Number(limitArg.split("=")[1]) : 120;

const SEARCH_PLAN = [
  { family: "life_expectancy", terms: ["life expectancy", "healthy life expectancy"] },
  { family: "child_maternal", terms: ["under-five mortality", "infant mortality", "neonatal mortality", "maternal mortality"] },
  { family: "cause_of_death", terms: ["death rates", "mortality rate", "suicide", "road traffic"] },
  { family: "ncds", terms: ["diabetes", "hypertension", "cardiovascular", "cancer", "chronic respiratory"] },
  { family: "communicable", terms: ["tuberculosis", "malaria", "hiv", "hepatitis"] },
  { family: "risk_factors", terms: ["tobacco", "alcohol", "air pollution", "unsafe water", "sanitation"] },
  { family: "immunization", terms: ["immunization", "vaccination", "measles", "DTP3", "rotavirus"] },
  { family: "health_system", terms: ["universal health coverage", "health expenditure", "service coverage", "financial protection"] }
];

function cleanIndicator(row, family, term) {
  return {
    indicatorCode: row.IndicatorCode,
    indicatorName: row.IndicatorName,
    language: row.Language || row.LanguageCode || null,
    family,
    matchedTerms: [term]
  };
}

function mergeIndicator(map, row) {
  const existing = map.get(row.indicatorCode);
  if (!existing) {
    map.set(row.indicatorCode, row);
    return;
  }
  existing.matchedTerms = [...new Set([...existing.matchedTerms, ...row.matchedTerms])].sort();
  existing.families = [...new Set([...(existing.families || [existing.family]), row.family])].sort();
  delete existing.family;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const fetchedAt = new Date().toISOString();
const indicatorMap = new Map();
const searchResults = [];
const warnings = [];

for (const group of SEARCH_PLAN) {
  for (const term of group.terms) {
    try {
      const raw = await searchWhoIndicators(term);
      const rows = Array.isArray(raw?.value) ? raw.value : [];
      searchResults.push({ family: group.family, term, count: rows.length });
      for (const row of rows) mergeIndicator(indicatorMap, cleanIndicator(row, group.family, term));
    } catch (error) {
      warnings.push({ sourceId: "who-gho", severity: "warning", message: `WHO indicator search failed for "${term}": ${error.message}` });
    }
  }
}

const indicators = [...indicatorMap.values()].sort((a, b) => a.indicatorCode.localeCompare(b.indicatorCode));

if (probeIndia) {
  let probed = 0;
  for (const indicator of indicators) {
    if (probed >= probeLimit) break;
    try {
      const raw = await fetchWhoIndicatorForIndiaSample(indicator.indicatorCode, { top: 2 });
      const rows = Array.isArray(raw?.value) ? raw.value : [];
      indicator.indiaProbe = {
        status: rows.length ? "has_rows" : "no_rows",
        sampleRows: rows.map((row) => ({
          TimeDim: row.TimeDim ?? null,
          Dim1: row.Dim1 ?? null,
          Dim2: row.Dim2 ?? null,
          Dim3: row.Dim3 ?? null,
          NumericValue: row.NumericValue ?? null,
          Value: row.Value ?? null
        }))
      };
    } catch (error) {
      indicator.indiaProbe = { status: "failed", error: error.message };
    }
    probed += 1;
    await wait(80);
  }
}

const discovery = {
  schemaVersion: 1,
  fetchedAt,
  source: {
    sourceId: "who-gho",
    name: "WHO Global Health Observatory",
    owner: "World Health Organization",
    baseUrl: "https://ghoapi.azureedge.net/api",
    accessMode: "odata_api",
    reliability: "multilateral",
    cadence: "annual_irregular"
  },
  searchPlan: SEARCH_PLAN,
  searchResults,
  indicators,
  summary: {
    indicatorCandidates: indicators.length,
    probedIndia: indicators.filter((indicator) => indicator.indiaProbe).length,
    indiaRowsFound: indicators.filter((indicator) => indicator.indiaProbe?.status === "has_rows").length,
    warnings: warnings.length
  },
  warnings
};

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/who-gho-health-discovery.json", `${stableJson(discovery)}\n`);

console.log(JSON.stringify(discovery.summary, null, 2));
