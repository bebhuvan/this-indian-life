import { mkdir, writeFile } from "node:fs/promises";
import {
  RBI_DBIE_HOME,
  RBI_DBIE_SERVICE_BASE,
  fetchDbieSession,
  postDbieJson
} from "./adapters/rbi-dbie.mjs";
import { stableJson, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const warnings = [];
const errors = [];

const MONTHS = new Map([
  ["JAN", "01"],
  ["FEB", "02"],
  ["MAR", "03"],
  ["APR", "04"],
  ["MAY", "05"],
  ["JUN", "06"],
  ["JUL", "07"],
  ["AUG", "08"],
  ["SEP", "09"],
  ["OCT", "10"],
  ["NOV", "11"],
  ["DEC", "12"]
]);

function cleanText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  return text || null;
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function parseDbieDate(value) {
  const text = cleanText(value);
  if (!text) return null;
  const match = text.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = MONTHS.get(match[2].toUpperCase());
    if (month) return `${match[3]}-${month}-${day}`;
  }
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  warnings.push({ severity: "warning", sourceId: "rbi-dbie", message: `Could not parse DBIE date: ${text}` });
  return null;
}

function addTag(tags, name, regex, text) {
  if (regex.test(text)) tags.add(name);
}

function classifyReport(record) {
  const text = [
    record.reportName,
    record.menuDescription,
    record.functionName,
    record.section,
    record.subSection,
    record.department
  ].filter(Boolean).join(" ").toLowerCase();
  const tags = new Set();
  addTag(tags, "prices_inflation", /\b(cpi|consumer price|wpi|wholesale price|inflation|price index)\b/i, text);
  addTag(tags, "external_sector", /\b(foreign exchange|exchange rate|forex|balance of payments|external debt|international investment|reserves?)\b/i, text);
  addTag(tags, "monetary_policy_rates", /\b(repo|reverse repo|policy rate|bank rate|cash reserve ratio|crr|statutory liquidity|slr|laf|msf)\b/i, text);
  addTag(tags, "banking_credit_deposits", /\b(bank credit|deposits?|scheduled commercial banks?|non-banking|nbfc|loan|advances?)\b/i, text);
  addTag(tags, "payments_systems", /\b(payment system|upi|rtgs|neft|imps|cards?|pos|atm|cheque)\b/i, text);
  addTag(tags, "financial_markets", /\b(g-sec|government securities|treasury bill|money market|yield|turnover|call money|commercial paper)\b/i, text);
  addTag(tags, "national_accounts", /\b(gdp|gva|gross domestic|national accounts|capital formation|consumption expenditure)\b/i, text);
  addTag(tags, "public_finance", /\b(government borrowing|public debt|fiscal|ways and means|market borrowings?)\b/i, text);
  addTag(tags, "household_life", /\b(housing|household|consumption|rural|urban|occupation|population|salary|wage)\b/i, text);
  return [...tags].sort();
}

function normalizeReport(row) {
  const reportId = row.reportId === undefined || row.reportId === null ? null : Number(row.reportId);
  const reportName = cleanText(row.reportName);
  const normalized = {
    reportKey: reportId ? `rbi-dbie-report-${reportId}` : `rbi-dbie-report-${slug(reportName || row.tableNo || row.docId || "unknown")}`,
    reportId: Number.isFinite(reportId) ? reportId : null,
    reportName,
    tableNo: cleanText(row.tableNo),
    docId: cleanText(row.docId),
    frequency: cleanText(row.reportFreq),
    frequencyHindi: cleanText(row.reportFreqHi),
    fromDate: parseDbieDate(row.fromdate),
    toDate: parseDbieDate(row.todate),
    menuDescription: cleanText(row.menudesc),
    menuDescriptionHindi: cleanText(row.menudescHi),
    functionName: cleanText(row.function),
    section: cleanText(row.section),
    subSection: cleanText(row.subSection),
    department: cleanText(row.department),
    departments: cleanText(row.departments),
    portal: cleanText(row.portal),
    tab: cleanText(row.tab),
    activeFlag: cleanText(row.activeFlag),
    dataValidation: row.dataValidation === true,
    count: Number.isFinite(Number(row.count)) ? Number(row.count) : null,
    likeCount: Number.isFinite(Number(row.likeCount)) ? Number(row.likeCount) : null,
    accessedDate: cleanText(row.accessedDate),
    createdDate: parseDbieDate(row.createdDt),
    modifiedDate: parseDbieDate(row.modifiedDate)
  };
  normalized.tags = classifyReport(normalized);
  return normalized;
}

function increment(map, key) {
  const label = key || "unknown";
  map.set(label, (map.get(label) || 0) + 1);
}

function summarizeReports(reports) {
  const byFrequency = new Map();
  const byMenu = new Map();
  const byTag = new Map();
  for (const report of reports) {
    increment(byFrequency, report.frequency);
    increment(byMenu, report.menuDescription);
    for (const tag of report.tags) increment(byTag, tag);
  }
  const top = (map, limit = 20) => [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
  return {
    totalReports: reports.length,
    byFrequency: top(byFrequency),
    byMenuDescription: top(byMenu),
    byHighValueTag: top(byTag),
    taggedReports: reports.filter((report) => report.tags.length).length
  };
}

function flattenMenuMapping(menuList) {
  const rows = [];
  function walk(items, path = []) {
    for (const item of items || []) {
      const title = cleanText(item.title || item.menuDesc || item.reportMenu);
      const nextPath = title ? [...path, title] : path;
      if (title) rows.push({ id: item.id ?? null, title, url: cleanText(item.url), path: nextPath.join(" > ") });
      if (Array.isArray(item.subTitle)) walk(item.subTitle, nextPath);
    }
  }
  walk(menuList);
  return rows;
}

function validateReports(reports) {
  if (!reports.length) errors.push({ severity: "error", sourceId: "rbi-dbie", message: "DBIE report inventory returned zero reports" });
  const ids = new Map();
  for (const report of reports) {
    if (!report.reportName) errors.push({ severity: "error", sourceId: "rbi-dbie", message: "DBIE report row missing reportName", reportKey: report.reportKey });
    if (!report.reportId) warnings.push({ severity: "warning", sourceId: "rbi-dbie", message: "DBIE report row missing reportId", reportName: report.reportName });
    if (report.reportId) ids.set(report.reportId, (ids.get(report.reportId) || 0) + 1);
  }
  for (const [reportId, count] of ids.entries()) {
    if (count > 1) warnings.push({ severity: "warning", sourceId: "rbi-dbie", message: "Duplicate DBIE reportId in inventory", reportId, count });
  }
}

const session = await fetchDbieSession();
const allReports = await postDbieJson("/dbie_getAllDBIEReports", { body: {} }, { session });
const mainMenu = await postDbieJson("/dbie_mainMenuList", { body: {} }, { session });
const menuMapping = await postDbieJson("/dbie_menuMappingList", { body: {} }, { session });
const currentMacroPreview = await postDbieJson("/dbie_getPublicationDataImpala", { body: {} }, { session });

const allReportsRows = allReports.json?.body?.response;
if (!Array.isArray(allReportsRows)) {
  errors.push({ severity: "error", sourceId: "rbi-dbie", message: "DBIE all-reports response did not include body.response[]" });
}

const reports = (Array.isArray(allReportsRows) ? allReportsRows : []).map(normalizeReport);
reports.sort((a, b) => (a.reportId || 0) - (b.reportId || 0) || String(a.reportName).localeCompare(String(b.reportName)));
validateReports(reports);

const snapshots = {
  allReports: await writeSnapshot("rbi-dbie", "dbie-get-all-reports", allReports.json),
  mainMenu: await writeSnapshot("rbi-dbie", "dbie-main-menu-list", mainMenu.json),
  menuMapping: await writeSnapshot("rbi-dbie", "dbie-menu-mapping-list", menuMapping.json),
  currentMacroPreview: await writeSnapshot("rbi-dbie", "dbie-publication-data-impala", currentMacroPreview.json)
};

const inventory = {
  schemaVersion: 1,
  fetchedAt,
  source: {
    sourceId: "rbi-dbie",
    name: "RBI Database on Indian Economy",
    owner: "Reserve Bank of India",
    homepage: RBI_DBIE_HOME,
    serviceBase: RBI_DBIE_SERVICE_BASE,
    reliability: "official",
    accessMode: "spa_gateway_authorized_json"
  },
  session: {
    generatedAt: session.generatedAt,
    status: session.status,
    contentType: session.contentType,
    header: session.header,
    authorizationHeaderObserved: true
  },
  snapshots: {
    allReports: { path: snapshots.allReports.path, rawHash: snapshots.allReports.hash },
    mainMenu: { path: snapshots.mainMenu.path, rawHash: snapshots.mainMenu.hash },
    menuMapping: { path: snapshots.menuMapping.path, rawHash: snapshots.menuMapping.hash },
    currentMacroPreview: { path: snapshots.currentMacroPreview.path, rawHash: snapshots.currentMacroPreview.hash }
  },
  menus: {
    mainMenu: (mainMenu.json?.body?.menuList || []).map((item) => ({
      id: item.id ?? null,
      orderNo: item.orderNo ?? null,
      menuDescription: cleanText(item.menuDesc),
      department: cleanText(item.department),
      url: cleanText(item.url),
      isActive: cleanText(item.isActive)
    })),
    mappedMenuPaths: flattenMenuMapping(menuMapping.json?.body?.menuList || [])
  },
  currentMacroPreview: {
    endpoint: "/dbie_getPublicationDataImpala",
    warning: "Dashboard preview only. Do not use as article evidence until a dedicated value adapter validates dates, units, and table semantics.",
    rows: currentMacroPreview.json?.body?.result || []
  },
  reports,
  validation: {
    policy: "Discovery artifacts can be used to choose adapters. They are not production article evidence until a separate ingest writes validated series/table artifacts.",
    errors,
    warnings
  },
  nextActions: [
    "Choose one RBI report class from reports[] and build a narrow adapter with fixed request payloads, snapshots, and no-empty-output checks.",
    "Prefer endpoints with explicit date, frequency, unit, and table identifiers before promoting to article evidence.",
    "For each promoted RBI series, reconcile latest values against RBI published PDFs or press releases before enabling generated articles."
  ],
  summary: {
    ...summarizeReports(reports),
    mainMenuItems: inventoryMenuLength(mainMenu.json?.body?.menuList),
    mappedMenuPaths: flattenMenuMapping(menuMapping.json?.body?.menuList || []).length,
    currentMacroPreviewRows: Array.isArray(currentMacroPreview.json?.body?.result) ? currentMacroPreview.json.body.result.length : 0,
    warnings: warnings.length,
    errors: errors.length
  }
};

function inventoryMenuLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/rbi-dbie-report-inventory.json", `${stableJson(inventory)}\n`);

console.log(JSON.stringify(inventory.summary, null, 2));
if (errors.length) process.exit(1);
