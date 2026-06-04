import { mkdir, writeFile } from "node:fs/promises";
import { discoverNadaCatalog, fetchNadaDataDictionary, fetchNadaRelatedMaterials, parseNadaDataDictionary, parseNadaRelatedMaterials } from "./adapters/nada.mjs";
import { discoverTraiTelecomSubscriptionReports } from "./adapters/trai.mjs";
import { fetchNdapCatalogue, fetchNdapSearch } from "./adapters/ndap.mjs";
import { stableJson } from "./core/artifacts.mjs";

const args = new Set(process.argv.slice(2));
const deep = args.has("--deep");
const fetchedAt = new Date().toISOString();

const sourceRegistry = [
  {
    sourceId: "nada",
    name: "MoSPI Microdata Library / NADA",
    owner: "MoSPI / NSO",
    baseUrl: "https://microdata.gov.in/NADA/index.php",
    accessMode: "html_catalog_plus_metadata_json",
    articlePotential: ["jobs", "consumption", "industry", "health", "education", "telecom", "time_use", "enterprise", "living_conditions"],
    priority: 1
  },
  {
    sourceId: "trai",
    name: "TRAI Telecom Subscription Reports",
    owner: "Telecom Regulatory Authority of India",
    baseUrl: "https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports",
    accessMode: "html_report_listing_pdf_downloads",
    articlePotential: ["telecom", "internet", "rural_urban_connectivity", "competition"],
    priority: 1
  },
  {
    sourceId: "ndap",
    name: "National Data Analytics Platform",
    owner: "NITI Aayog",
    baseUrl: process.env.NDAP_BASE_URL || "https://loadqa.ndapapi.com",
    accessMode: "json_api_experimental",
    articlePotential: ["districts", "schemes", "cross_ministry_indicators"],
    priority: 2
  },
  {
    sourceId: "data-gov-in",
    name: "Open Government Data Platform India",
    owner: "MeitY / NIC and publishing ministries",
    baseUrl: "https://data.gov.in",
    accessMode: "api_key_required_resource_api",
    articlePotential: ["broad_government_catalog", "ministry_specific_datasets"],
    priority: 2
  },
  {
    sourceId: "rbi-dbie",
    name: "RBI Database on Indian Economy",
    owner: "Reserve Bank of India",
    baseUrl: "https://data.rbi.org.in",
    accessMode: "web_tables_downloads_needs_endpoint_discovery",
    articlePotential: ["banking", "inflation", "monetary_policy", "external_sector", "state_finance"],
    priority: 1
  },
  {
    sourceId: "nfhs",
    name: "NFHS / DHS / IIPS",
    owner: "IIPS / Ministry of Health and Family Welfare",
    baseUrl: "https://www.nfhsiips.in/",
    accessMode: "factsheet_downloads_dhs_api_microdata_registration",
    articlePotential: ["health", "fertility", "nutrition", "sanitation", "women", "digital_access"],
    priority: 1
  },
  {
    sourceId: "census-india",
    name: "Census India",
    owner: "Office of the Registrar General and Census Commissioner",
    baseUrl: "https://censusindia.gov.in",
    accessMode: "file_downloads_page_backed",
    articlePotential: ["population", "migration", "literacy", "households", "settlements"],
    priority: 1
  },
  {
    sourceId: "mospi-esankhyiki",
    name: "MoSPI / eSankhyiki",
    owner: "MoSPI",
    baseUrl: "https://www.esankhyiki.mospi.gov.in/",
    accessMode: "official_tables_downloads_needs_endpoint_discovery",
    articlePotential: ["national_accounts", "prices", "iip", "official_statistics"],
    priority: 1
  }
];

function classifyNadaRecord(record) {
  const text = `${record.title} ${record.collection} ${record.referenceId}`.toLowerCase();
  if (/plfs|labour|employment|unemployment/.test(text)) return ["jobs", "work", "labour"];
  if (/hces|consumption|expenditure/.test(text)) return ["consumption", "poverty", "living_conditions"];
  if (/asi|industr/.test(text)) return ["industry", "manufacturing", "firms"];
  if (/health|ayush|morbidity/.test(text)) return ["health"];
  if (/education|school|training|literacy/.test(text)) return ["education"];
  if (/telecom|cams|indicator|ict|mobile|internet/.test(text)) return ["digital_access", "telecom", "living_conditions"];
  if (/time use|tus/.test(text)) return ["time_use", "gender", "work"];
  if (/enterprise|unincorporated|asuse|service sector/.test(text)) return ["enterprise", "informal_economy"];
  if (/agricultur|livestock|land/.test(text)) return ["agriculture", "rural"];
  return ["general_survey"];
}

function validateDiscovery(discovery) {
  const findings = [];
  for (const source of discovery.sources) {
    if (!source.baseUrl) findings.push({ severity: "error", sourceId: source.sourceId, message: "Missing baseUrl" });
    if (!source.accessMode) findings.push({ severity: "warning", sourceId: source.sourceId, message: "Missing accessMode" });
  }
  if (!discovery.nada?.records?.length) {
    findings.push({ severity: "error", sourceId: "nada", message: "NADA catalog returned no records" });
  }
  if (discovery.nada?.records?.some((record) => !record.referenceId)) {
    findings.push({ severity: "warning", sourceId: "nada", message: "Some NADA records are missing reference IDs" });
  }
  if (!discovery.trai?.reports?.length) {
    findings.push({ severity: "error", sourceId: "trai", message: "TRAI report listing returned no reports" });
  }
  if (discovery.ndap?.status === "failed") {
    findings.push({ severity: "warning", sourceId: "ndap", message: `NDAP probe failed: ${discovery.ndap.error}` });
  }
  if (!process.env.DATAGOVIN_API_KEY) {
    findings.push({ severity: "warning", sourceId: "data-gov-in", message: "DATAGOVIN_API_KEY is not configured; adapter can only document API templates" });
  }
  return findings;
}

async function safeProbe(fn) {
  try {
    return { status: "ready", ...(await fn()) };
  } catch (error) {
    return { status: "failed", error: String(error.message || error).slice(0, 300) };
  }
}

async function withRetry(fn, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const nada = await safeProbe(async () => {
  const catalog = await discoverNadaCatalog({ maxPages: deep ? undefined : 2 });
  const records = catalog.records.map((record) => ({
    ...record,
    topics: classifyNadaRecord(record)
  }));
  const focusIds = records
    .filter((record) => /CAMS|MIS|Telecom|PLFS|HCES|ASI|Time Use|Health|Education|ASUSE/i.test(record.title))
    .slice(0, deep ? 20 : 8)
    .map((record) => record.catalogId);
  const details = [];
  for (const catalogId of focusIds) {
    const [dictionaryHtml, materialsHtml] = await Promise.all([
      withRetry(() => fetchNadaDataDictionary(catalogId), 3).catch(() => ""),
      withRetry(() => fetchNadaRelatedMaterials(catalogId), 2).catch(() => "")
    ]);
    details.push({
      catalogId,
      dataDictionary: dictionaryHtml ? parseNadaDataDictionary(dictionaryHtml) : { files: [] },
      relatedMaterials: materialsHtml ? parseNadaRelatedMaterials(materialsHtml) : { materials: [] }
    });
  }
  return {
    total: catalog.total,
    pagesDiscovered: catalog.pagesDiscovered,
    records,
    focusDetails: details
  };
});

const trai = await safeProbe(async () => discoverTraiTelecomSubscriptionReports({ maxPages: deep ? 7 : 2 }));

const ndap = await safeProbe(async () => {
  const catalogue = await fetchNdapCatalogue({ q: "telecom", page: 1, size: 5 }).catch((error) => ({ error: error.message }));
  const search = await fetchNdapSearch({ q: "health", page: 1, size: 5 }).catch((error) => ({ error: error.message }));
  return {
    catalogueShape: Array.isArray(catalogue) ? { type: "array", count: catalogue.length } : { type: typeof catalogue, keys: Object.keys(catalogue || {}).slice(0, 12), error: catalogue?.error },
    searchShape: Array.isArray(search) ? { type: "array", count: search.length } : { type: typeof search, keys: Object.keys(search || {}).slice(0, 12), error: search?.error }
  };
});

const discovery = {
  schemaVersion: 1,
  fetchedAt,
  runMode: deep ? "deep" : "sample",
  sources: sourceRegistry,
  nada,
  trai,
  ndap,
  dataGovIn: {
    status: process.env.DATAGOVIN_API_KEY ? "api_key_configured" : "api_key_missing",
    apiTemplate: "https://api.data.gov.in/resource/{resource_id}?api-key=$DATAGOVIN_API_KEY&format=json&limit=1000&offset=0"
  }
};
discovery.validation = validateDiscovery(discovery);

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/india-gov-source-discovery.json", `${stableJson(discovery)}\n`);

console.log(JSON.stringify({
  ok: discovery.validation.every((finding) => finding.severity !== "error"),
  fetchedAt,
  runMode: discovery.runMode,
  nadaRecords: discovery.nada.records?.length || 0,
  traiReports: discovery.trai.reports?.length || 0,
  validationFindings: discovery.validation.length,
  output: "data/catalog/india-gov-source-discovery.json"
}, null, 2));
