import { mkdir, writeFile } from "node:fs/promises";
import {
  createTableArtifact,
  hashObject,
  readJson,
  stableJson,
  writeSeriesArtifact,
  writeSnapshot
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const OUTPUT_ARTIFACT_NAME = "rbi-dbie.IN.banking.rbi.credit_related_macro.long";
const OUTPUT_CATALOG = "data/catalog/rbi-dbie-credit-related-downloads.json";

const PARENT_ARTIFACTS = [
  {
    key: "macro50",
    path: "data/series/rbi-dbie.IN.macro_50_indicators.long.json",
    manifestIndicatorId: "macro.rbi.dbie_50_indicators"
  },
  {
    key: "macroOther",
    path: "data/series/rbi-dbie.IN.macro_other_timeseries.long.json",
    manifestIndicatorId: "macro.rbi.dbie_other_timeseries"
  }
];

const CREDIT_RELATED_PATTERN = /\b(credit|loan|loans|advance|advances|deposit|deposits|borrow|borrowings|bank credit|commercial paper|non.?food|housing|personal loan|nbfc|external debt|debt|repo|call money|yield|bank rate|cash reserve|statutory liquidity|m1|m3|currency with the public)\b/i;

function rowText(row) {
  return [
    row.indicatorLabel,
    row.indicatorKey,
    row.frequency,
    row.unit
  ].filter(Boolean).join(" ");
}

function rowKey(row) {
  return [
    row.sourceParentKey,
    row.datasetKey,
    row.frequency,
    row.period,
    row.indicatorKey,
    row.unit
  ].join("|");
}

function summarizeRows(rows) {
  const bySeries = new Map();
  for (const row of rows) {
    const key = `${row.sourceParentKey}|${row.frequency}|${row.indicatorLabel}|${row.unit}`;
    const current = bySeries.get(key) || {
      sourceParentKey: row.sourceParentKey,
      datasetKey: row.datasetKey,
      frequency: row.frequency,
      indicatorKey: row.indicatorKey,
      indicatorLabel: row.indicatorLabel,
      unit: row.unit,
      rows: 0,
      firstPeriod: row.period,
      latestPeriod: row.period
    };
    current.rows += 1;
    if (row.period < current.firstPeriod) current.firstPeriod = row.period;
    if (row.period > current.latestPeriod) current.latestPeriod = row.period;
    bySeries.set(key, current);
  }
  return [...bySeries.values()].sort((a, b) => (
    a.sourceParentKey.localeCompare(b.sourceParentKey)
    || a.frequency.localeCompare(b.frequency)
    || a.indicatorLabel.localeCompare(b.indicatorLabel)
  ));
}

function assertRows(rows) {
  if (!rows.length) throw new Error("RBI DBIE credit-related extraction returned zero rows");
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (!row.sourceParentKey || !row.datasetKey || !row.frequency || !row.period || !row.indicatorKey) {
      throw new Error(`Credit-related row ${index} missing key fields`);
    }
    if (!Number.isFinite(row.NumericValue)) throw new Error(`Credit-related row ${index} has non-finite NumericValue`);
    const key = rowKey(row);
    if (seen.has(key)) throw new Error(`Duplicate credit-related row key: ${key}`);
    seen.add(key);
  }
}

const manifest = await readJson("data/catalog/rbi-dbie-manifest.json");
const parentManifestEntries = [];
const parentArtifacts = [];
const extractedRows = [];

for (const parentDefinition of PARENT_ARTIFACTS) {
  const artifact = await readJson(parentDefinition.path);
  if (artifact?.artifactType !== "table" || !Array.isArray(artifact.rows)) {
    throw new Error(`${parentDefinition.path} is not a table artifact with rows[]`);
  }
  const manifestEntry = manifest.find((entry) => entry.indicatorId === parentDefinition.manifestIndicatorId);
  if (!manifestEntry?.workbookSnapshot || !manifestEntry?.rawHash) {
    throw new Error(`RBI DBIE manifest is missing workbook snapshot/rawHash for ${parentDefinition.manifestIndicatorId}`);
  }
  const parentHash = hashObject(artifact);
  parentArtifacts.push({
    key: parentDefinition.key,
    indicatorId: artifact.indicatorId,
    path: parentDefinition.path,
    hash: parentHash,
    rows: artifact.rows.length,
    sourceIndicatorId: artifact.sourceIndicatorId
  });
  parentManifestEntries.push({
    key: parentDefinition.key,
    indicatorId: manifestEntry.indicatorId,
    sourceIndicatorId: manifestEntry.sourceIndicatorId,
    artifact: manifestEntry.artifact,
    parsedSnapshot: manifestEntry.snapshot,
    workbookSnapshot: manifestEntry.workbookSnapshot,
    rawHash: manifestEntry.rawHash,
    rows: manifestEntry.rows,
    fetchedAt: manifestEntry.fetchedAt,
    sourceUrl: manifestEntry.sourceUrl
  });

  for (const row of artifact.rows) {
    if (!CREDIT_RELATED_PATTERN.test(rowText(row))) continue;
    extractedRows.push({
      ...row,
      sourceParentKey: parentDefinition.key,
      sourceParentIndicatorId: artifact.indicatorId,
      sourceParentArtifact: parentDefinition.path,
      extractionRule: "credit_related_label_regex_v1"
    });
  }
}

extractedRows.sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
assertRows(extractedRows);

const seriesSummary = summarizeRows(extractedRows);
const snapshot = await writeSnapshot("rbi-dbie", "credit-related-macro-extraction", {
  schemaVersion: 1,
  fetchedAt,
  extractionRule: {
    name: "credit_related_label_regex_v1",
    pattern: CREDIT_RELATED_PATTERN.source,
    fields: ["indicatorLabel", "indicatorKey", "frequency", "unit"]
  },
  parentArtifacts,
  parentManifestEntries,
  rows: extractedRows.length,
  series: seriesSummary
});

const artifact = createTableArtifact({
  indicatorId: "banking.rbi.credit_related_macro",
  title: "RBI DBIE credit and credit-related macro time series",
  sourceId: "rbi-dbie",
  sourceIndicatorId: "derived:credit_related_label_regex_v1:MacroeconomicIndicators+OtherMacroeconomicTimeseriesData",
  sourceUrl: "https://data.rbi.org.in/DBIE/#/dbie/home",
  unit: "mixed",
  fetchedAt,
  rows: extractedRows,
  dimensions: ["sourceParentKey", "datasetKey", "frequency", "period", "indicatorKey"],
  metadata: {
    extractionRule: {
      name: "credit_related_label_regex_v1",
      pattern: CREDIT_RELATED_PATTERN.source,
      fields: ["indicatorLabel", "indicatorKey", "frequency", "unit"]
    },
    parentArtifacts,
    parentWorkbookSnapshots: parentManifestEntries.map((entry) => ({
      key: entry.key,
      workbookSnapshot: entry.workbookSnapshot,
      rawHash: entry.rawHash
    })),
    qualityGates: [
      "validated parent DBIE HDFS workbook artifacts only",
      "deterministic source label/key/frequency/unit regex",
      "finite numeric values only",
      "unique sourceParentKey/dataset/frequency/period/indicator/unit keys",
      "BO viewer/report HTML excluded"
    ]
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "rbi-dbie",
  name: OUTPUT_ARTIFACT_NAME,
  artifact
});

const catalog = {
  schemaVersion: 1,
  fetchedAt,
  sourceId: "rbi-dbie",
  purpose: "Evidence-ready download bundle for currently accessible RBI DBIE credit and credit-related data",
  evidenceStatus: "evidence_ready_for_macro_workbook_rows_only",
  artifact: artifactPath,
  snapshot: snapshot.path,
  rawWorkbookSources: parentManifestEntries,
  rows: extractedRows.length,
  seriesCount: seriesSummary.length,
  series: seriesSummary,
  excludedSources: {
    businessObjectsReports: {
      evidenceStatus: "excluded_discovery_only",
      reason: "BO/OpenDocument report links currently do not expose a stable raw XLS/CSV/PDF/JSON endpoint in this repo."
    },
    dataQueryBsrDsd: {
      evidenceStatus: "excluded_zero_rows",
      reason: "LNA_SCB_SR_OCC_BSR1_A_RN policy creation succeeds, but the current Impala payload returns zero rows."
    }
  },
  nextActions: [
    "Run npm run ingest:rbi-dbie-macro-timeseries before this extractor when fresh workbook bytes are needed.",
    "Run npm run derive:rbi-dbie-macro-series after workbook ingest to refresh hand-picked chart series.",
    "Do not promote BO/BSR split tables until a stable raw download or non-empty Data Query payload is captured and validated."
  ]
};

await mkdir("data/catalog", { recursive: true });
await writeFile(OUTPUT_CATALOG, `${stableJson(catalog)}\n`);

console.log(JSON.stringify({
  ok: true,
  artifact: artifactPath,
  catalog: OUTPUT_CATALOG,
  rows: extractedRows.length,
  series: seriesSummary.length,
  rawWorkbookSources: parentManifestEntries.length
}, null, 2));
