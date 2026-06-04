import { mkdir, readFile } from "node:fs/promises";
import readWorkbook from "read-excel-file/node";
import {
  RBI_DBIE_HOME,
  downloadDbieHdfsFile,
  fetchDbieSession
} from "./adapters/rbi-dbie.mjs";
import {
  createTableArtifact,
  mergeSourceManifest,
  stableJson,
  writeRawSnapshot,
  writeSeriesArtifact,
  writeSnapshot
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const RBI_MACRO_FILES = [
  {
    datasetKey: "rbi_macro_50_indicators",
    hdfsFilename: "MacroeconomicIndicators",
    title: "RBI 50 macroeconomic indicators",
    artifactName: "rbi-dbie.IN.macro_50_indicators.long",
    indicatorId: "macro.rbi.dbie_50_indicators",
    expectedSheets: ["Weekly", "Fortnightly", "Monthly", "Quarterly"],
    minimumRows: 1000
  },
  {
    datasetKey: "rbi_macro_other_timeseries",
    hdfsFilename: "OtherMacroeconomicTimeseriesData",
    title: "RBI other macroeconomic time-series indicators",
    artifactName: "rbi-dbie.IN.macro_other_timeseries.long",
    indicatorId: "macro.rbi.dbie_other_timeseries",
    expectedSheets: ["Daily", "Weekly", "Monthly", "Quarterly"],
    minimumRows: 20000
  }
];

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
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || null;
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = cleanText(value);
  if (!text || text === "-" || /^n\.?a\.?$/i.test(text)) return null;
  const normalized = text.replace(/,/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parsePeriod(label, frequency) {
  if (label instanceof Date && !Number.isNaN(label.valueOf())) {
    const period = label.toISOString().slice(0, 10);
    return { period, date: period, periodType: "date", TimeDim: label.getUTCFullYear() };
  }
  const text = cleanText(label);
  if (!text) return null;

  let match = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const month = MONTHS.get(match[2].toUpperCase());
    if (!month) return null;
    const period = `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
    return { period, date: period, periodType: "date", TimeDim: Number(match[3]) };
  }

  match = text.match(/^([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const month = MONTHS.get(match[1].toUpperCase());
    if (!month) return null;
    return { period: `${match[2]}-${month}`, date: null, periodType: frequency === "Quarterly" ? "quarter_end_month" : "month", TimeDim: Number(match[2]) };
  }

  match = text.match(/^(\d{4})-Q([1-4])$/i);
  if (match) {
    return { period: `${match[1]}-Q${match[2]}`, date: null, periodType: "quarter", TimeDim: Number(match[1]) };
  }

  return null;
}

function inferUnit(label, unitRowValue) {
  const declared = cleanText(unitRowValue);
  if (declared && !/^units?$/i.test(declared)) return declared;
  const text = cleanText(label) || "";
  if (/%|\bper cent\b/i.test(text)) return "Percent";
  if (/₹\s*crore/i.test(text)) return "₹ Crore";
  if (/US\s*\$\s*Million/i.test(text)) return "US $ Million";
  if (/\$\s*Millions?/i.test(text)) return "$ Millions";
  if (/\bindex\b/i.test(text)) return "Index";
  return declared || "not_declared";
}

function workbookSheetNames(workbookSheets) {
  return workbookSheets.map((sheet) => sheet.sheet);
}

function sheetRows(workbookSheets, sheetName) {
  return workbookSheets.find((sheet) => sheet.sheet === sheetName)?.data || [];
}

function normalizeWorkbookRows(workbookSheets, dataset) {
  const rows = [];
  const diagnostics = [];

  for (const sheetName of workbookSheetNames(workbookSheets)) {
    const frequency = sheetName;
    const matrix = sheetRows(workbookSheets, sheetName);
    const headerIndex = matrix.findIndex((row) => row.some((cell) => /^(Period|Reporting Date)$/i.test(cleanText(cell) || "")));
    if (headerIndex < 0) throw new Error(`${dataset.hdfsFilename}/${sheetName} did not include a period header row`);

    const header = matrix[headerIndex];
    const periodCol = header.findIndex((cell) => /^(Period|Reporting Date)$/i.test(cleanText(cell) || ""));
    if (periodCol < 0) throw new Error(`${dataset.hdfsFilename}/${sheetName} did not include a period column`);

    const possibleUnitRow = matrix[headerIndex + 1] || [];
    const hasUnitRow = !cleanText(possibleUnitRow[periodCol]) && possibleUnitRow.slice(periodCol + 1).some((cell) => cleanText(cell));
    const unitRow = hasUnitRow ? possibleUnitRow : [];
    const dataStart = headerIndex + (hasUnitRow ? 2 : 1);
    const indicators = header
      .map((cell, columnIndex) => ({ columnIndex, label: cleanText(cell) }))
      .filter((item) => item.columnIndex > periodCol && item.label);

    let emitted = 0;
    for (const row of matrix.slice(dataStart)) {
      const parsedPeriod = parsePeriod(row[periodCol], frequency);
      if (!parsedPeriod) continue;
      for (const indicator of indicators) {
        const NumericValue = parseNumber(row[indicator.columnIndex]);
        if (NumericValue === null) continue;
        const unit = inferUnit(indicator.label, unitRow[indicator.columnIndex]);
        rows.push({
          datasetKey: dataset.datasetKey,
          frequency,
          period: parsedPeriod.period,
          date: parsedPeriod.date,
          periodType: parsedPeriod.periodType,
          TimeDim: parsedPeriod.TimeDim,
          indicatorKey: `${dataset.datasetKey}.${slug(frequency)}.${slug(indicator.label)}`,
          indicatorLabel: indicator.label,
          unit,
          NumericValue
        });
        emitted += 1;
      }
    }
    diagnostics.push({
      sheetName,
      range: null,
      sourceRows: matrix.length,
      indicatorColumns: indicators.length,
      hasUnitRow,
      emittedRows: emitted
    });
  }

  rows.sort((a, b) => (
    a.frequency.localeCompare(b.frequency)
    || a.indicatorKey.localeCompare(b.indicatorKey)
    || a.period.localeCompare(b.period)
  ));

  return { rows, diagnostics };
}

function assertWorkbook(dataset, workbookSheets, rows) {
  const sheetNames = workbookSheetNames(workbookSheets);
  for (const sheetName of dataset.expectedSheets) {
    if (!sheetNames.includes(sheetName)) throw new Error(`${dataset.hdfsFilename} missing expected sheet ${sheetName}`);
  }
  if (rows.length < dataset.minimumRows) {
    throw new Error(`${dataset.hdfsFilename} emitted ${rows.length} numeric rows, below minimum ${dataset.minimumRows}`);
  }
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (!row.period || !row.indicatorKey || !row.frequency) throw new Error(`${dataset.hdfsFilename} row ${index} missing key fields`);
    if (!Number.isFinite(row.NumericValue)) throw new Error(`${dataset.hdfsFilename} row ${index} has invalid NumericValue`);
    const key = `${row.datasetKey}|${row.frequency}|${row.period}|${row.indicatorKey}`;
    if (seen.has(key)) throw new Error(`${dataset.hdfsFilename} duplicate observation key ${key}`);
    seen.add(key);
  }
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function crossCheckRbiForex(rows) {
  const forexArtifact = await readJsonIfExists("data/series/rbi-dbie.IN.forex_reserves.weekly.json");
  if (!forexArtifact?.rows?.length) return { status: "skipped", reason: "RBI forex reserves artifact not present" };

  const macroRows = rows
    .filter((row) => row.frequency === "Weekly" && row.indicatorLabel === "FOREIGN CURRENCY ASSETS" && row.unit === "₹ Crore")
    .sort((a, b) => b.period.localeCompare(a.period));
  const forexRows = forexArtifact.rows
    .filter((row) => row.currencyCode === "INR" && row.reserveCode === "FCA")
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!macroRows.length || !forexRows.length) return { status: "skipped", reason: "Comparable FCA rows not present" };

  const macro = macroRows[0];
  const forex = forexRows.find((row) => row.date === macro.period);
  if (!forex) return { status: "skipped", reason: `No forex artifact row for ${macro.period}` };
  const forexCrore = forex.NumericValue / 10000000;
  const difference = Math.abs(macro.NumericValue - forexCrore);
  if (difference > 0.01) {
    throw new Error(`RBI macro FCA cross-check failed for ${macro.period}: macro=${macro.NumericValue}, forexCrore=${forexCrore}`);
  }
  return {
    status: "passed",
    date: macro.period,
    macroFcaCrore: macro.NumericValue,
    forexFcaCrore: forexCrore,
    absoluteDifference: difference
  };
}

const session = await fetchDbieSession({ timeoutMs: 60000 });
const manifestEntries = [];

for (const dataset of RBI_MACRO_FILES) {
  const download = await downloadDbieHdfsFile(dataset.hdfsFilename, { session, timeoutMs: 60000 });
  if (download.bytes < 10000 || download.body.slice(0, 2).toString("utf8") !== "PK") {
    throw new Error(`${dataset.hdfsFilename} did not download as a valid XLSX/ZIP workbook`);
  }

  const rawSnapshot = await writeRawSnapshot("rbi-dbie", dataset.hdfsFilename, download.body, "xlsx");
  const workbook = await readWorkbook(download.body);
  const sheetNames = workbookSheetNames(workbook);
  const { rows, diagnostics } = normalizeWorkbookRows(workbook, dataset);
  assertWorkbook(dataset, workbook, rows);
  const forexCrossCheck = dataset.datasetKey === "rbi_macro_other_timeseries" ? await crossCheckRbiForex(rows) : null;

  const parsedSnapshot = await writeSnapshot("rbi-dbie", `${dataset.hdfsFilename}.parsed-summary`, {
    fetchedAt,
    hdfsFilename: dataset.hdfsFilename,
    contentDisposition: download.contentDisposition,
    workbookSnapshot: rawSnapshot.path,
    workbookHash: rawSnapshot.hash,
    sheets: sheetNames,
    diagnostics,
    rowCount: rows.length,
    latestPeriodsByFrequency: Object.fromEntries(
      [...new Set(rows.map((row) => row.frequency))]
        .sort()
        .map((frequency) => [frequency, rows.filter((row) => row.frequency === frequency).map((row) => row.period).sort().at(-1)])
    ),
    validation: {
      expectedSheets: dataset.expectedSheets,
      minimumRows: dataset.minimumRows,
      forexCrossCheck
    }
  });

  const artifact = createTableArtifact({
    indicatorId: dataset.indicatorId,
    title: dataset.title,
    sourceId: "rbi-dbie",
    sourceIndicatorId: `download/dbie_FileDownloadHDFSAction:${dataset.hdfsFilename}`,
    sourceUrl: RBI_DBIE_HOME,
    unit: "mixed",
    fetchedAt,
    rows,
    dimensions: ["datasetKey", "frequency", "period", "indicatorKey"],
    metadata: {
      hdfsFilename: dataset.hdfsFilename,
      contentDisposition: download.contentDisposition,
      workbookSnapshot: rawSnapshot.path,
      workbookHash: rawSnapshot.hash,
      diagnostics,
      validation: {
        noDuplicateDatasetFrequencyPeriodIndicatorKeys: true,
        finiteNumericValuesOnly: true,
        forexCrossCheck
      }
    }
  });

  const artifactPath = await writeSeriesArtifact({
    sourceId: "rbi-dbie",
    name: dataset.artifactName,
    artifact
  });

  manifestEntries.push({
    status: "ready",
    indicatorId: artifact.indicatorId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    artifact: artifactPath,
    snapshot: parsedSnapshot.path,
    workbookSnapshot: rawSnapshot.path,
    rawHash: rawSnapshot.hash,
    rows: rows.length,
    fetchedAt,
    sourceUrl: RBI_DBIE_HOME
  });

  console.log(`rbi-dbie ${dataset.hdfsFilename}: ${rows.length} numeric rows from ${sheetNames.length} sheets`);
}

await mkdir("data/catalog", { recursive: true });
await mergeSourceManifest("rbi-dbie", manifestEntries);
console.log(`${stableJson({ written: manifestEntries.map((entry) => ({ indicatorId: entry.indicatorId, rows: entry.rows })) })}`);
