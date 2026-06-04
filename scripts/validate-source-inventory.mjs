import { readFile } from "node:fs/promises";

const path = process.argv[2] || "data/catalog/source-inventory.seed.json";
const inventory = JSON.parse(await readFile(path, "utf8"));
const findings = [];

function add(severity, sourceId, message, detail = undefined) {
  findings.push({ severity, sourceId, message, ...(detail === undefined ? {} : { detail }) });
}

const REQUIRED_SOURCE_FIELDS = [
  "sourceId",
  "name",
  "owner",
  "homepage",
  "accessMode",
  "cadence",
  "reliability",
  "adapterStatus"
];

if (inventory.schemaVersion !== 1) add("error", "inventory", "schemaVersion must be 1");
if (!inventory.updatedAt) add("error", "inventory", "missing updatedAt");
if (!Array.isArray(inventory.sources) || !inventory.sources.length) add("error", "inventory", "sources must be a non-empty array");

const seen = new Set();
for (const source of inventory.sources || []) {
  const sourceId = source.sourceId || "unknown";
  for (const field of REQUIRED_SOURCE_FIELDS) {
    if (!source[field]) add("error", sourceId, `missing ${field}`);
  }
  if (seen.has(sourceId)) add("error", sourceId, "duplicate sourceId");
  seen.add(sourceId);

  if (source.homepage) {
    try {
      const url = new URL(source.homepage);
      if (!["http:", "https:"].includes(url.protocol)) add("error", sourceId, "homepage must be http(s)", source.homepage);
    } catch {
      add("error", sourceId, "homepage is not a valid URL", source.homepage);
    }
  }

  if (!Array.isArray(source.articleFamilies) || !source.articleFamilies.length) {
    add("warning", sourceId, "missing articleFamilies");
  }
  if (!Array.isArray(source.qualityNotes) || !source.qualityNotes.length) {
    add("warning", sourceId, "missing qualityNotes");
  }
}

const errors = findings.filter((finding) => finding.severity === "error");
const warnings = findings.filter((finding) => finding.severity !== "error");

console.log(JSON.stringify({
  path,
  ok: errors.length === 0,
  sources: inventory.sources?.length || 0,
  errors: errors.length,
  warnings: warnings.length,
  findings
}, null, 2));

if (errors.length) process.exit(1);
