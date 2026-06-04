import { readFile, stat } from "node:fs/promises";

const manifestPath = "data/catalog/trai-subscriptions-manifest.json";
const findings = [];
const minMonths = Number(process.env.TRAI_MIN_MONTHS || "12");
const maxLagDays = Number(process.env.TRAI_MAX_LAG_DAYS || "75");

function add(severity, path, message, detail = undefined) {
  findings.push({ severity, path, message, ...(detail === undefined ? {} : { detail }) });
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function parseMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(String(value))) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return { year, month, index: year * 12 + month };
}

function monthFromIndex(index) {
  const year = Math.floor((index - 1) / 12);
  const month = ((index - 1) % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthLagDays(month) {
  const parsed = parseMonth(month);
  if (!parsed) return Infinity;
  const endOfMonth = new Date(Date.UTC(parsed.year, parsed.month, 0));
  return (Date.now() - endOfMonth.getTime()) / (24 * 60 * 60 * 1000);
}

function checkAdditive(path, row, tolerance, label) {
  if (!isNumber(row.wireless) || !isNumber(row.wireline) || !isNumber(row.total)) {
    add("error", path, `${label} has missing numeric wireless/wireline/total`, row);
    return;
  }
  const delta = Math.abs(row.wireless + row.wireline - row.total);
  if (delta > tolerance) add("error", path, `${label} total check differs by ${delta.toFixed(2)}`, row);
}

function validateTableArtifact(path, artifact) {
  const rows = Array.isArray(artifact.rows) ? artifact.rows : [];
  const keys = new Set(rows.map((row) => `${row.section}:${row.metric}`));
  for (const key of [
    "broadband:broadband_subscribers",
    "urban:telephone_subscribers",
    "rural:telephone_subscribers",
    "total:telephone_subscribers",
    "mnp:mobile_number_portability_requests",
    "wireless:active_wireless_mobile_subscribers_peak_vlr"
  ]) {
    if (!keys.has(key)) add("error", path, `missing required row ${key}`);
  }
  if (!keys.has("overall:teledensity_without_m2m") && !keys.has("overall:teledensity")) {
    add("error", path, "missing overall teledensity row");
  }

  for (const row of rows) {
    if (row.unit === "million" && isNumber(row.wireless) && isNumber(row.wireline) && isNumber(row.total)) {
      checkAdditive(path, row, 0.03, `${row.section}:${row.metric}`);
    }
    if (/teledensity|tele-density/i.test(`${row.metric} ${row.label}`)) {
      checkAdditive(path, row, 0.08, `${row.section}:${row.metric}`);
    }
  }
}

function validateSeriesArtifact(path, artifact) {
  const observations = Array.isArray(artifact.observations) ? artifact.observations : [];
  if (observations.length < minMonths) add("error", path, `TRAI monthly series has fewer than ${minMonths} observations`, observations.length);
  const seenDates = new Set();
  for (let index = 1; index < observations.length; index += 1) {
    const prev = observations[index - 1];
    const current = observations[index];
    if (seenDates.has(prev.date)) add("error", path, "duplicate observation date", prev.date);
    seenDates.add(prev.date);
    const prevMonth = parseMonth(prev.date);
    const currentMonth = parseMonth(current.date);
    if (!prevMonth) add("error", path, "invalid observation month", prev.date);
    if (!currentMonth) add("error", path, "invalid observation month", current.date);
    if (prevMonth && currentMonth && currentMonth.index !== prevMonth.index + 1) {
      const severity = observations.length - index <= minMonths ? "error" : "warning";
      add(severity, path, "TRAI monthly series has a month gap", { prev: prev.date, current: current.date });
    }
    if (!isNumber(prev.value) || !isNumber(current.value)) continue;
    const delta = Math.abs(current.value - prev.value);
    if (artifact.indicatorId === "society.trai.teledensity_total" && delta > 5) {
      add("error", path, "teledensity month-to-month jump exceeds 5 percentage points", { prev, current, delta });
    }
    if (/subscribers/.test(artifact.indicatorId) && delta > 150) {
      add("warning", path, "subscriber month-to-month jump exceeds 150 million", { prev, current, delta });
    }
  }
  const last = observations.at(-1);
  if (last) {
    if (seenDates.has(last.date)) add("error", path, "duplicate observation date", last.date);
    if (!parseMonth(last.date)) add("error", path, "invalid observation month", last.date);
  }
}

const manifest = await readJson(manifestPath);
if (!Array.isArray(manifest)) {
  add("error", manifestPath, "manifest must be an array");
} else {
  const ready = manifest.filter((entry) => entry.status === "ready");
  const failures = manifest.filter((entry) => entry.status === "failed");
  const tableEntries = ready.filter((entry) => entry.indicatorId === "society.trai.telecom_subscription_summary");
  const seriesEntries = ready.filter((entry) => entry.indicatorId !== "society.trai.telecom_subscription_summary");
  if (failures.length) add("error", manifestPath, "TRAI manifest contains failed entries", failures);
  if (tableEntries.length < minMonths) add("error", manifestPath, `TRAI manifest has fewer than ${minMonths} table artifacts`, tableEntries.length);
  if (seriesEntries.length < 9) add("error", manifestPath, "TRAI manifest has fewer than 9 derived monthly series", seriesEntries.length);

  const tableMonths = [];
  const tableMonthSet = new Set();
  const seriesArtifacts = [];

  for (const entry of ready) {
    if (!entry.artifact || !(await exists(entry.artifact))) {
      add("error", manifestPath, "manifest artifact path is missing or does not exist", entry);
      continue;
    }
    if (entry.pdfSnapshot && !(await exists(entry.pdfSnapshot))) add("error", manifestPath, "PDF snapshot path does not exist", entry.pdfSnapshot);
    if (entry.rawHash && !/^[a-f0-9]{64}$/i.test(entry.rawHash)) add("error", manifestPath, "rawHash must be a sha256 hex digest", entry.rawHash);

    const artifact = await readJson(entry.artifact);
    if (artifact.artifactType === "table" && artifact.sourceId === "trai") {
      validateTableArtifact(entry.artifact, artifact);
      const month = artifact.metadata?.reportPeriod?.date || entry.sourceIndicatorId;
      if (!parseMonth(month)) add("error", entry.artifact, "table artifact has invalid report month", month);
      if (tableMonthSet.has(month)) add("error", manifestPath, "duplicate TRAI report month in manifest", month);
      tableMonthSet.add(month);
      tableMonths.push(month);
    }
    if (artifact.artifactType === "series" && artifact.sourceId === "trai") {
      validateSeriesArtifact(entry.artifact, artifact);
      seriesArtifacts.push({ path: entry.artifact, artifact });
    }
  }

  const sortedTableMonths = tableMonths.sort();
  if (sortedTableMonths.length) {
    const latestMonth = sortedTableMonths.at(-1);
    const lagDays = monthLagDays(latestMonth);
    if (Number.isFinite(maxLagDays) && lagDays > maxLagDays) {
      add("error", manifestPath, `latest TRAI report month is more than ${maxLagDays} days old`, { latestMonth, lagDays: Math.round(lagDays) });
    }
    for (let index = 1; index < sortedTableMonths.length; index += 1) {
      const prev = parseMonth(sortedTableMonths[index - 1]);
      const current = parseMonth(sortedTableMonths[index]);
      if (prev && current && current.index !== prev.index + 1) {
        const severity = sortedTableMonths.length - index <= minMonths ? "error" : "warning";
        add(severity, manifestPath, "TRAI table report months have a gap", {
          prev: sortedTableMonths[index - 1],
          current: sortedTableMonths[index],
          expected: monthFromIndex(prev.index + 1)
        });
      }
    }
  }

  for (const { path, artifact } of seriesArtifacts) {
    const observationMonths = new Set((artifact.observations || []).map((item) => item.date));
    for (const month of tableMonthSet) {
      if (!observationMonths.has(month)) add("error", path, "series is missing a month present in TRAI table artifacts", month);
    }
  }
}

const errors = findings.filter((finding) => finding.severity === "error");
const warnings = findings.filter((finding) => finding.severity === "warning");
const result = {
  ok: errors.length === 0,
  errors: errors.length,
  warnings: warnings.length,
  findings
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
