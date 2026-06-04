import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");

const findings = [];

function add(severity, path, message, detail = undefined) {
  findings.push({ severity, path, message, ...(detail === undefined ? {} : { detail }) });
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    add("error", path, `invalid JSON: ${error.message}`);
    return null;
  }
}

async function listJsonFiles(dir) {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => `${dir}/${entry.name}`)
    .sort();
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function parseTimeOrdinal(date, frequency) {
  const text = String(date || "").trim();
  const yearOnly = text.match(/^(\d{4})$/);
  if (yearOnly) return Number(yearOnly[1]) * 366;

  const quarter = text.match(/^(\d{4})-?Q([1-4])$/i);
  if (quarter) return Number(quarter[1]) * 4 + Number(quarter[2]);

  const month = text.match(/^(\d{4})-(\d{2})$/);
  if (month) return Number(month[1]) * 12 + Number(month[2]);

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return Math.floor(parsed / 86400000);

  if (frequency === "irregular") return null;
  return undefined;
}

function validateTimestamp(path, label, value) {
  if (!value) {
    add("error", path, `missing ${label}`);
    return;
  }
  if (Number.isNaN(Date.parse(value))) add("error", path, `${label} is not parseable`, value);
}

function validateSourceUrl(path, value) {
  if (!value) {
    add("error", path, "missing sourceUrl");
    return;
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    add("error", path, "sourceUrl is not a valid URL", value);
    return;
  }
  for (const key of url.searchParams.keys()) {
    if (/^(api[-_]?key|apikey|token|access_token|key)$/i.test(key)) {
      add("error", path, "sourceUrl contains a secret-like query parameter", key);
    }
  }
}

function validateBaseArtifact(path, artifact) {
  if (!isObject(artifact)) {
    add("error", path, "artifact must be an object");
    return false;
  }
  if (artifact.schemaVersion !== 1) add("error", path, "schemaVersion must be 1", artifact.schemaVersion);
  if (!["series", "table"].includes(artifact.artifactType)) {
    add("error", path, "artifactType must be series or table", artifact.artifactType);
  }
  for (const field of ["indicatorId", "title", "sourceId", "sourceIndicatorId", "unit"]) {
    if (!artifact[field]) add("error", path, `missing ${field}`);
  }
  validateSourceUrl(path, artifact.sourceUrl);
  validateTimestamp(path, "fetchedAt", artifact.fetchedAt);
  if (!isObject(artifact.geography)) {
    add("error", path, "missing geography object");
  } else {
    for (const field of ["type", "id", "name"]) {
      if (!artifact.geography[field]) add("error", path, `geography missing ${field}`);
    }
  }
  return true;
}

function validateSeriesArtifact(path, artifact) {
  if (!Array.isArray(artifact.observations) || !artifact.observations.length) {
    add("error", path, "series artifact has no observations");
    return;
  }

  const seenDates = new Set();
  let previousOrdinal = -Infinity;
  let nullRun = 0;
  let nullRunStart = null;
  const nullRunRanges = [];

  for (const [index, observation] of artifact.observations.entries()) {
    if (!isObject(observation)) {
      add("error", path, `observation ${index} is not an object`);
      continue;
    }
    if (!observation.date) {
      add("error", path, `observation ${index} missing date`);
    }
    const ordinal = parseTimeOrdinal(observation.date, artifact.frequency);
    if (ordinal === undefined) add("error", path, `observation ${index} has invalid date`, observation.date);
    if (ordinal !== undefined && ordinal !== null && ordinal < previousOrdinal) {
      add("error", path, "observations are not sorted ascending", { index, date: observation.date });
    }
    if (ordinal !== undefined && ordinal !== null) previousOrdinal = ordinal;

    const dateKey = String(observation.date);
    if (seenDates.has(dateKey)) add("error", path, "duplicate observation date", dateKey);
    seenDates.add(dateKey);

    if (observation.value === null) {
      if (nullRun === 0) nullRunStart = { index, date: observation.date };
      nullRun += 1;
    } else if (!isFiniteNumber(observation.value)) {
      add("error", path, `observation ${index} value must be finite number or null`, observation.value);
      if (nullRun >= 5) nullRunRanges.push({ start: nullRunStart, end: artifact.observations[index - 1]?.date, count: nullRun });
      nullRun = 0;
      nullRunStart = null;
    } else {
      if (nullRun >= 5) nullRunRanges.push({ start: nullRunStart, end: artifact.observations[index - 1]?.date, count: nullRun });
      nullRun = 0;
      nullRunStart = null;
    }
  }
  if (nullRun >= 5) {
    nullRunRanges.push({
      start: nullRunStart,
      end: artifact.observations[artifact.observations.length - 1]?.date,
      count: nullRun
    });
  }
  for (const range of nullRunRanges) add("warning", path, "five or more consecutive null observations", range);
}

function validateTableArtifact(path, artifact) {
  if (!Array.isArray(artifact.rows) || !artifact.rows.length) {
    add("error", path, "table artifact has no rows");
    return;
  }
  if (!Array.isArray(artifact.dimensions)) add("warning", path, "table artifact dimensions should be an array");

  for (const [index, row] of artifact.rows.entries()) {
    if (!isObject(row)) {
      add("error", path, `row ${index} is not an object`);
      continue;
    }
    if ("NumericValue" in row && row.NumericValue !== null && !isFiniteNumber(row.NumericValue)) {
      add("error", path, `row ${index} NumericValue must be finite number or null`, row.NumericValue);
    }
    if (isFiniteNumber(row.Low) && isFiniteNumber(row.NumericValue) && row.Low > row.NumericValue) {
      add("error", path, `row ${index} Low is greater than NumericValue`);
    }
    if (isFiniteNumber(row.High) && isFiniteNumber(row.NumericValue) && row.High < row.NumericValue) {
      add("error", path, `row ${index} High is less than NumericValue`);
    }
    if ("TimeDim" in row && row.TimeDim !== null && !Number.isFinite(Number(row.TimeDim))) {
      add("warning", path, `row ${index} TimeDim is not numeric`, row.TimeDim);
    }
  }
}

async function validateArtifact(path) {
  const artifact = await readJson(path);
  if (!artifact) return;
  validateBaseArtifact(path, artifact);
  if (artifact.artifactType === "series") validateSeriesArtifact(path, artifact);
  if (artifact.artifactType === "table") validateTableArtifact(path, artifact);
}

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

async function validateSnapshotHash(manifestPath, entry) {
  if (!entry.snapshot || !entry.rawHash) return;
  const rawPath = entry.rawSnapshot || entry.workbookSnapshot || entry.pdfSnapshot || null;
  if (rawPath) {
    if (!(await exists(rawPath))) {
      add("error", manifestPath, "manifest raw snapshot does not exist", rawPath);
      return;
    }
    const rawBody = await readFile(rawPath);
    const rawHash = createHash("sha256").update(rawBody).digest("hex");
    if (!rawHash.startsWith(String(entry.rawHash))) {
      add("error", manifestPath, "rawHash does not match raw snapshot bytes", {
        snapshot: rawPath,
        expected: entry.rawHash,
        actual: rawHash
      });
    }
    return;
  }

  if (!(await exists(entry.snapshot))) {
    add("error", manifestPath, "manifest snapshot does not exist", entry.snapshot);
    return;
  }
  if (!entry.snapshot.endsWith(".json")) return;
  const payload = await readJson(entry.snapshot);
  if (!payload) return;
  const fullHash = createHash("sha256").update(stableJson(payload)).digest("hex");
  if (!fullHash.startsWith(String(entry.rawHash))) {
    add("warning", manifestPath, "rawHash does not match parsed JSON snapshot; add rawSnapshot/workbookSnapshot/pdfSnapshot if rawHash belongs to another file", {
      snapshot: entry.snapshot,
      expected: entry.rawHash,
      actual: fullHash
    });
  }
}

async function validateManifest(path) {
  if (path.includes("discovery-manifest")) return;
  const manifest = await readJson(path);
  if (!manifest) return;
  if (!Array.isArray(manifest)) return;

  for (const [index, entry] of manifest.entries()) {
    const label = `${path}[${index}]`;
    if (!isObject(entry)) {
      add("error", path, `manifest entry ${index} is not an object`);
      continue;
    }
    if (!["ready", "failed"].includes(entry.status)) add("error", label, "status must be ready or failed", entry.status);
    if (!entry.indicatorId) add("error", label, "missing indicatorId");
    if (!entry.sourceIndicatorId) add("error", label, "missing sourceIndicatorId");
    validateTimestamp(label, "fetchedAt", entry.fetchedAt);

    if (entry.status === "ready") {
      if (!entry.artifact) add("error", label, "ready manifest entry missing artifact");
      if (entry.artifact && !(await exists(entry.artifact))) add("error", label, "manifest artifact does not exist", entry.artifact);
      if (entry.snapshot && !(await exists(entry.snapshot))) add("error", label, "manifest snapshot does not exist", entry.snapshot);

      if (entry.artifact && (await exists(entry.artifact))) {
        const artifact = await readJson(entry.artifact);
        if (artifact?.indicatorId && artifact.indicatorId !== entry.indicatorId) {
          add("error", label, "manifest indicatorId differs from artifact", {
            manifest: entry.indicatorId,
            artifact: artifact.indicatorId
          });
        }
        const count = artifact?.artifactType === "series" ? artifact.observations?.length : artifact?.rows?.length;
        if (Number.isFinite(entry.observations) && count !== entry.observations) {
          add("error", label, "manifest observation count differs from artifact", { manifest: entry.observations, artifact: count });
        }
        if (Number.isFinite(entry.rows) && count !== entry.rows) {
          add("error", label, "manifest row count differs from artifact", { manifest: entry.rows, artifact: count });
        }
      }
      await validateSnapshotHash(path, entry);
    }

    if (entry.status === "failed" && !entry.error) add("warning", label, "failed manifest entry missing error");
  }
}

function latestSeriesPoint(artifact) {
  let best = null;
  for (const observation of artifact.observations || []) {
    if (!isFiniteNumber(observation.value)) continue;
    const ordinal = parseTimeOrdinal(observation.date, artifact.frequency);
    if (ordinal === undefined || ordinal === null) continue;
    if (!best || ordinal > best.ordinal) {
      const year = Number(String(observation.date).slice(0, 4));
      best = { year, value: observation.value, ordinal };
    }
  }
  return best;
}

function latestTablePoint(artifact, selector = {}) {
  let best = null;
  for (const row of artifact.rows || []) {
    let matches = true;
    for (const [key, value] of Object.entries(selector.filters || {})) {
      if (row[key] !== value) matches = false;
    }
    if (!matches || !isFiniteNumber(row[selector.valueField || "NumericValue"])) continue;
    const year = Number(row[selector.timeField || "TimeDim"]);
    if (!Number.isFinite(year)) continue;
    if (!best || year > best.year) {
      best = { year, value: row[selector.valueField || "NumericValue"] };
    }
  }
  return best;
}

async function loadPoint(selector) {
  const artifact = await readJson(selector.artifact);
  if (!artifact) return null;
  if (selector.type === "series") return latestSeriesPoint(artifact);
  if (selector.type === "table") return latestTablePoint(artifact, selector);
  throw new Error(`Unknown cross-source selector type ${selector.type}`);
}

async function validateCrossSourceChecks() {
  const path = "data/quality/cross-source-checks.json";
  if (!(await exists(path))) return;
  const checks = await readJson(path);
  if (!Array.isArray(checks)) {
    add("error", path, "cross-source checks must be an array");
    return;
  }

  for (const check of checks) {
    const label = `${path}:${check.id || "unnamed"}`;
    try {
      const left = await loadPoint(check.left);
      const right = await loadPoint(check.right);
      if (!left || !right) {
        add("error", label, "could not find comparable latest points", { left, right });
        continue;
      }
      const yearGap = Math.abs(left.year - right.year);
      const diff = Math.abs(left.value - right.value);
      if (Number.isFinite(check.maxYearGap) && yearGap > check.maxYearGap) {
        add("warning", label, "cross-source latest-year gap exceeds threshold", { left, right, yearGap });
      }
      if (Number.isFinite(check.maxAbsDiff) && diff > check.maxAbsDiff) {
        add("warning", label, "cross-source value difference exceeds threshold", { left, right, diff });
      }
    } catch (error) {
      add("error", label, `cross-source check failed: ${error.message}`);
    }
  }
}

for (const path of await listJsonFiles("data/series")) {
  await validateArtifact(path);
}

for (const path of await listJsonFiles("data/catalog")) {
  await validateManifest(path);
}

await validateCrossSourceChecks();

const errors = findings.filter((finding) => finding.severity === "error");
const warnings = findings.filter((finding) => finding.severity === "warning");
const result = {
  ok: errors.length === 0 && (!strict || warnings.length === 0),
  strict,
  checked: {
    seriesArtifacts: (await listJsonFiles("data/series")).length,
    catalogFiles: (await listJsonFiles("data/catalog")).length
  },
  errors: errors.length,
  warnings: warnings.length,
  findings
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok) process.exit(1);
