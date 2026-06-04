import { readFile } from "node:fs/promises";

const path = process.argv[2] || "data/catalog/india-gov-source-discovery.json";
const discovery = JSON.parse(await readFile(path, "utf8"));

const findings = [];

function add(severity, sourceId, message) {
  findings.push({ severity, sourceId, message });
}

if (discovery.schemaVersion !== 1) add("error", "discovery", "schemaVersion must be 1");
if (!discovery.fetchedAt) add("error", "discovery", "missing fetchedAt");
if (!Array.isArray(discovery.sources) || !discovery.sources.length) add("error", "discovery", "missing sources registry");

for (const source of discovery.sources || []) {
  if (!source.sourceId) add("error", "registry", "source missing sourceId");
  if (!source.name) add("error", source.sourceId || "registry", "source missing name");
  if (!source.owner) add("warning", source.sourceId || "registry", "source missing owner");
  if (!source.baseUrl) add("error", source.sourceId || "registry", "source missing baseUrl");
  if (!source.accessMode) add("warning", source.sourceId || "registry", "source missing accessMode");
  if (!Array.isArray(source.articlePotential) || !source.articlePotential.length) {
    add("warning", source.sourceId || "registry", "source missing articlePotential");
  }
}

if (!Array.isArray(discovery.nada?.records) || !discovery.nada.records.length) {
  add("error", "nada", "NADA records missing");
} else {
  const missingRef = discovery.nada.records.filter((record) => !record.referenceId).length;
  if (missingRef) add("warning", "nada", `${missingRef} NADA records missing referenceId`);
  const topicCounts = new Map();
  for (const record of discovery.nada.records) {
    for (const topic of record.topics || []) topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  }
  for (const topic of ["jobs", "consumption", "industry", "education", "telecom"]) {
    if (!topicCounts.has(topic) && discovery.runMode !== "sample") add("warning", "nada", `No NADA records classified as ${topic}`);
  }
}

for (const detail of discovery.nada?.focusDetails || []) {
  if (!detail.dataDictionary?.files?.length) {
    add("warning", "nada", `Catalog ${detail.catalogId} has no data-dictionary files in discovery output`);
  }
}

if (!Array.isArray(discovery.trai?.reports) || !discovery.trai.reports.length) {
  add("error", "trai", "TRAI reports missing");
} else {
  const badPdf = discovery.trai.reports.filter((report) => !/^https:\/\/www\.trai\.gov\.in\/.+\.pdf$/i.test(report.pdfUrl || "")).length;
  if (badPdf) add("error", "trai", `${badPdf} TRAI reports have invalid PDF URLs`);
}

if (discovery.dataGovIn?.status !== "api_key_configured") {
  add("warning", "data-gov-in", "DATAGOVIN_API_KEY not configured");
}

for (const finding of discovery.validation || []) {
  add(finding.severity || "warning", finding.sourceId || "discovery", finding.message || "embedded validation finding");
}

const deduped = [...new Map(findings.map((finding) => [`${finding.severity}:${finding.sourceId}:${finding.message}`, finding])).values()];
const errors = deduped.filter((finding) => finding.severity === "error");
const warnings = deduped.filter((finding) => finding.severity !== "error");

console.log(JSON.stringify({
  path,
  ok: errors.length === 0,
  errors: errors.length,
  warnings: warnings.length,
  findings: deduped
}, null, 2));

if (errors.length) process.exit(1);
