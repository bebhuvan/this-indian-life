import { mkdir, writeFile } from "node:fs/promises";
import {
  RBI_DBIE_HOME,
  RBI_DBIE_SERVICE_BASE,
  RBI_LOGIN_SERVICE_BASE,
  fetchDbieAsset,
  fetchDbieHome,
  extractAssetPaths,
  extractDbieEndpointPaths,
  extractServiceRoots,
  fetchDbieSession,
  probeDbieEndpoint
} from "./adapters/rbi-dbie.mjs";
import { stableJson, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const warnings = [];

function assetType(path) {
  if (/\.js(?:$|\?)/i.test(path)) return "javascript";
  if (/\.css(?:$|\?)/i.test(path)) return "stylesheet";
  return "asset";
}

const home = await fetchDbieHome();
const homeSnapshot = await writeSnapshot("rbi-dbie", "dbie-home-html", {
  url: home.url,
  status: home.status,
  contentType: home.contentType,
  text: home.text
});

const assetPaths = extractAssetPaths(home.text);
const assets = [];
const endpointSet = new Set();
const serviceRootSet = new Set();

for (const path of assetPaths.filter((path) => assetType(path) === "javascript")) {
  try {
    const asset = await fetchDbieAsset(path);
    const snapshot = await writeSnapshot("rbi-dbie", `asset-${path}`, {
      url: asset.url,
      status: asset.status,
      contentType: asset.contentType,
      text: asset.text
    });
    const endpoints = extractDbieEndpointPaths(asset.text);
    const serviceRoots = extractServiceRoots(asset.text);
    for (const endpoint of endpoints) endpointSet.add(endpoint);
    for (const root of serviceRoots) serviceRootSet.add(root);
    assets.push({
      path,
      type: assetType(path),
      status: asset.status,
      contentType: asset.contentType,
      bytes: asset.text.length,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      endpoints: endpoints.length,
      serviceRoots
    });
  } catch (error) {
    warnings.push({ severity: "warning", sourceId: "rbi-dbie", message: `Failed to fetch DBIE asset ${path}: ${error.message}` });
  }
}

const endpoints = [...endpointSet].sort();
const probeTargets = [
  "/dbie_mainMenuList",
  "/dbie_getAllDBIEReports",
  "/dbie_getReportsDbie",
  "/dbie_GetPopularReportsPortalNew",
  "/dbie_getEcoHeader",
  "/dbie_getPublicationDataImpala"
].filter((endpoint) => endpoints.includes(endpoint));

const endpointProbes = [];
let session = null;
try {
  session = await fetchDbieSession();
} catch (error) {
  warnings.push({ severity: "warning", sourceId: "rbi-dbie", message: `Failed to create DBIE session for endpoint probes: ${error.message}` });
}
for (const endpoint of probeTargets) {
  try {
    endpointProbes.push(await probeDbieEndpoint(endpoint, { session }));
  } catch (error) {
    endpointProbes.push({ path: endpoint, status: "failed", error: error.message });
  }
}

const discovery = {
  schemaVersion: 1,
  fetchedAt,
  source: {
    sourceId: "rbi-dbie",
    name: "RBI Database on Indian Economy",
    owner: "Reserve Bank of India",
    homepage: RBI_DBIE_HOME,
    serviceBase: RBI_DBIE_SERVICE_BASE,
    loginServiceBase: RBI_LOGIN_SERVICE_BASE,
    accessMode: "spa_gateway_reports_downloads",
    reliability: "official",
    cadence: "daily_monthly_quarterly_annual_mixed"
  },
  home: {
    status: home.status,
    contentType: home.contentType,
    bytes: home.text.length,
    snapshot: homeSnapshot.path,
    rawHash: homeSnapshot.hash
  },
  assets,
  serviceRoots: [...serviceRootSet].sort(),
  endpoints,
  endpointProbes,
  sessionProbe: session ? {
    generatedAt: session.generatedAt,
    status: session.status,
    contentType: session.contentType,
    header: session.header,
    authorizationHeaderObserved: true
  } : null,
  validation: [
    {
      severity: "warning",
      sourceId: "rbi-dbie",
      message: "DBIE endpoint discovery is not value ingestion. Endpoints use SPA headers, authorization, and encrypted payloads; promote only reproducible report/table downloads to production adapters."
    }
  ],
  nextActions: [
    "Reproduce the DBIE login token and encryptPayload path in a controlled adapter, or prefer public report-download endpoints when available.",
    "Build a DBIE report inventory: report id, report title, function/menu/department, frequency, download formats, and source URL.",
    "Promote one narrow table as a proof: policy rates, forex reserves, deposits/credit, or CPI-related RBI series.",
    "Validate table headings and known latest values before writing normalized artifacts."
  ],
  warnings,
  summary: {
    assets: assets.length,
    serviceRoots: serviceRootSet.size,
    endpoints: endpoints.length,
    probes: endpointProbes.length,
    warnings: warnings.length
  }
};

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/rbi-dbie-discovery.json", `${stableJson(discovery)}\n`);

console.log(JSON.stringify(discovery.summary, null, 2));
