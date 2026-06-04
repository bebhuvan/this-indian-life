import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const path = "data/catalog/rbi-dbie-report-inventory.json";
const findings = [];

function add(severity, message, detail = undefined) {
  findings.push({ severity, message, ...(detail === undefined ? {} : { detail }) });
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function validateNoSecretFields(value, location = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoSecretFields(item, `${location}[${index}]`));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(authorization|cookie|token|accessToken|sessionToken)$/i.test(key)) {
      add("error", "RBI DBIE inventory contains a secret-like field", { location: `${location}.${key}` });
    }
    validateNoSecretFields(child, `${location}.${key}`);
  }
}

async function validateSnapshot(label, entry) {
  if (!entry?.path || !entry?.rawHash) {
    add("error", "snapshot entry missing path/rawHash", { label, entry });
    return;
  }
  if (!(await exists(entry.path))) {
    add("error", "snapshot file missing", { label, path: entry.path });
    return;
  }
  const payload = JSON.parse(await readFile(entry.path, "utf8"));
  const hash = createHash("sha256").update(stableJson(payload)).digest("hex");
  if (!hash.startsWith(entry.rawHash)) {
    add("error", "snapshot rawHash mismatch", { label, path: entry.path, expected: entry.rawHash, actual: hash });
  }
}

const inventory = JSON.parse(await readFile(path, "utf8"));

if (inventory.schemaVersion !== 1) add("error", "schemaVersion must be 1", inventory.schemaVersion);
if (inventory.source?.sourceId !== "rbi-dbie") add("error", "source.sourceId must be rbi-dbie", inventory.source?.sourceId);
if (Number.isNaN(Date.parse(inventory.fetchedAt))) add("error", "fetchedAt is not parseable", inventory.fetchedAt);
if (inventory.session?.authorizationHeaderObserved !== true) add("error", "DBIE session proof is missing authorizationHeaderObserved=true");

validateNoSecretFields(inventory);

const reports = inventory.reports;
if (!Array.isArray(reports) || !reports.length) {
  add("error", "reports must be a non-empty array");
} else {
  const keys = new Set();
  for (const [index, report] of reports.entries()) {
    if (!report.reportKey) add("error", "report missing reportKey", { index });
    if (keys.has(report.reportKey)) add("error", "duplicate reportKey", report.reportKey);
    keys.add(report.reportKey);
    if (!report.reportName) add("error", "report missing reportName", { index, reportKey: report.reportKey });
    if (!Array.isArray(report.tags)) add("error", "report tags must be an array", { index, reportKey: report.reportKey });
    for (const field of ["fromDate", "toDate"]) {
      if (report[field] && !/^\d{4}-\d{2}-\d{2}$/.test(report[field])) {
        add("warning", "report date is not YYYY-MM-DD", { index, reportKey: report.reportKey, field, value: report[field] });
      }
    }
  }
}

if (inventory.summary?.totalReports !== reports?.length) {
  add("error", "summary.totalReports does not match reports.length", {
    summary: inventory.summary?.totalReports,
    reports: reports?.length
  });
}

for (const [label, entry] of Object.entries(inventory.snapshots || {})) {
  await validateSnapshot(label, entry);
}

for (const finding of inventory.validation?.errors || []) {
  add("error", "inventory self-validation error", finding);
}

const errors = findings.filter((finding) => finding.severity === "error");
const warnings = findings.filter((finding) => finding.severity === "warning");
const result = {
  path,
  ok: errors.length === 0,
  reports: Array.isArray(reports) ? reports.length : 0,
  errors: errors.length,
  warnings: warnings.length,
  findings
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
