import { readFile } from "node:fs/promises";
import { parsePpacHistoricalImportExportWorkbook } from "./adapters/ppac.mjs";
import { createTableArtifact, mergeSourceManifest, writeRawSnapshot, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const DEFAULT_FILES = {
  quantity: "data/manual/ppac/import-export-history/1751964547_PT_IMPORT_TMT_H.xlsx",
  rupees: "data/manual/ppac/import-export-history/1751964598_PT_IMPORT_VAL_RS.CRS._H.xlsx",
  usd: "data/manual/ppac/import-export-history/1751964622_PT_IMPORT_VAL_US$_H.xlsx"
};

const DATASETS = [
  {
    key: "quantity",
    env: "PPAC_HISTORY_QUANTITY_XLSX",
    indicatorId: "energy.ppac.import_export_petroleum_history_quantity",
    title: "Historical import/export of crude oil and petroleum products, quantity",
    unit: "000 metric tonnes",
    minRows: 1500
  },
  {
    key: "rupees",
    env: "PPAC_HISTORY_VALUE_RUPEES_XLSX",
    indicatorId: "energy.ppac.import_export_petroleum_history_value_rupees",
    title: "Historical import/export of crude oil and petroleum products, value in rupees",
    unit: "Rs crore",
    minRows: 1500
  },
  {
    key: "usd",
    env: "PPAC_HISTORY_VALUE_USD_XLSX",
    indicatorId: "energy.ppac.import_export_petroleum_history_value_usd",
    title: "Historical import/export of crude oil and petroleum products, value in US dollars",
    unit: "million US$",
    minRows: 1500
  }
];

function argValue(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function pathFor(dataset) {
  return argValue(dataset.key) || process.env[dataset.env] || DEFAULT_FILES[dataset.key];
}

function assertXlsx(buffer, path) {
  if (!buffer.subarray(0, 4).equals(Buffer.from("504b0304", "hex"))) {
    throw new Error(`Not an XLSX ZIP payload: ${path}`);
  }
}

function validateParsed(dataset, parsed) {
  const findings = [];
  if (!Array.isArray(parsed.rows) || parsed.rows.length < dataset.minRows) {
    findings.push(`expected at least ${dataset.minRows} rows, found ${parsed.rows?.length || 0}`);
  }

  const parsedSheets = parsed.sheets.filter((sheet) => sheet.status === "parsed");
  const annualSheets = parsedSheets.filter((sheet) => sheet.sheetType === "annual_summary");
  const monthlySheets = parsedSheets.filter((sheet) => sheet.sheetType === "monthly");
  if (!annualSheets.length) findings.push("no annual summary sheet parsed");
  if (monthlySheets.length < 10) findings.push(`expected at least 10 monthly fiscal-year sheets, found ${monthlySheets.length}`);

  const duplicateKeys = new Set();
  const seen = new Set();
  for (const row of parsed.rows) {
    if (!Number.isFinite(row.value)) findings.push(`non-finite value at ${row.sheetName} row ${row.sourceRow}`);
    const key = [
      row.datasetKind,
      row.sheetName,
      row.sourceRow,
      row.section,
      row.sourceItem,
      row.periodType,
      row.fiscalYear,
      row.monthIndex ?? "",
      row.period
    ].join("\u0000");
    if (seen.has(key)) duplicateKeys.add(key);
    seen.add(key);
  }
  if (duplicateKeys.size) findings.push(`${duplicateKeys.size} duplicate row-period keys`);

  const badReconciliations = parsed.reconciliations.filter((item) => {
    const tolerance = Math.max(0.01, Math.abs(item.reportedTotal) * 1e-7);
    return item.absoluteDifference > tolerance;
  });
  if (badReconciliations.length) {
    const first = badReconciliations[0];
    findings.push(`monthly total reconciliation failed for ${badReconciliations.length} rows; first ${first.sheetName} ${first.sourceItem} diff=${first.absoluteDifference}`);
  }

  if (findings.length) {
    throw new Error(`${dataset.key} validation failed: ${findings.join("; ")}`);
  }
}

const fetchedAt = new Date().toISOString();
const manifestEntries = [];

for (const dataset of DATASETS) {
  const sourcePath = pathFor(dataset);
  const workbook = await readFile(sourcePath);
  assertXlsx(workbook, sourcePath);

  const workbookSnapshot = await writeRawSnapshot("ppac", `${dataset.indicatorId}.manual-workbook`, workbook, "xlsx");
  const parsed = await parsePpacHistoricalImportExportWorkbook(workbook, {
    datasetKind: dataset.key,
    unit: dataset.unit
  });
  validateParsed(dataset, parsed);

  const parsedSnapshot = await writeSnapshot("ppac", `${dataset.indicatorId}.parsed`, {
    ...parsed,
    rowsSample: parsed.rows.slice(0, 20),
    rowCount: parsed.rows.length,
    rows: undefined
  });

  const artifact = createTableArtifact({
    indicatorId: dataset.indicatorId,
    title: dataset.title,
    sourceId: "ppac",
    sourceIndicatorId: "ppac-import-export-history-manual-xlsx",
    sourceUrl: "https://ppac.gov.in/import-export/history",
    unit: dataset.unit,
    fetchedAt,
    rows: parsed.rows,
    dimensions: Object.keys(parsed.rows[0] || {}),
    metadata: {
      acquisition: "manual_authenticated_download",
      localSourcePath: sourcePath,
      workbookSnapshot: workbookSnapshot.path,
      workbookHash: workbookSnapshot.hash,
      parsedSnapshot: parsedSnapshot.path,
      parsedHash: parsedSnapshot.hash,
      sheetNames: parsed.sheetNames,
      sheets: parsed.sheets,
      reconciliationChecks: parsed.reconciliations.length
    }
  });

  const artifactPath = await writeSeriesArtifact({
    sourceId: "ppac",
    name: `ppac.IN.${dataset.indicatorId}`,
    artifact
  });

  manifestEntries.push({
    status: "ready",
    indicatorId: dataset.indicatorId,
    sourceIndicatorId: "ppac-import-export-history-manual-xlsx",
    artifact: artifactPath,
    snapshot: parsedSnapshot.path,
    workbookSnapshot: workbookSnapshot.path,
    rawHash: workbookSnapshot.hash,
    rows: parsed.rows.length,
    sheets: parsed.sheets.filter((sheet) => sheet.status === "parsed").length,
    reconciliationChecks: parsed.reconciliations.length,
    fetchedAt
  });

  console.log(`ppac-history ${dataset.key} ${parsed.rows.length} rows, ${parsed.reconciliations.length} reconciliation checks`);
}

await mergeSourceManifest("ppac", manifestEntries);
console.log(`Wrote ${manifestEntries.length} PPAC history artifacts.`);
