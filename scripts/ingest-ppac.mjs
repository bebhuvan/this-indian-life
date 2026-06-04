import {
  fetchPpacCurrentImportExport,
  fetchPpacWorkbook,
  parsePpacCurrentImportExport,
  parsePpacImportExportWorkbook,
  parsePpacLngImportWorkbook,
  writePpacBinarySnapshot
} from "./adapters/ppac.mjs";
import { createTableArtifact, mergeSourceManifest, stableJson, writeRawSnapshot, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";
import { ppacDatasets } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

for (const item of ppacDatasets) {
  try {
    const sourceIndicatorId = item.workbookUrl || `import-export:${item.financialYear}:reportBy:${item.reportBy}:page:${item.pageId}`;
    let parsed;
    let jsonSnapshot;
    let binarySnapshot = null;
    let artifactMetadata = {};

    if (item.workbookUrl) {
      const isLngWorkbook = item.kind === "lng_import_workbook";
      const workbook = await fetchPpacWorkbook(item.workbookUrl, { allowLegacy: isLngWorkbook });
      binarySnapshot = await writePpacBinarySnapshot(`${item.id}.workbook`, workbook, isLngWorkbook ? "xls" : "xlsx");
      parsed = isLngWorkbook
        ? await parsePpacLngImportWorkbook(workbook, { financialYear: item.financialYear })
        : await parsePpacImportExportWorkbook(workbook);
      jsonSnapshot = await writeSnapshot("ppac", `${item.id}.parsed`, parsed);
      artifactMetadata = {
        kind: item.kind || "import_export_workbook",
        financialYear: item.financialYear,
        workbookUrl: item.workbookUrl,
        workbookSnapshot: binarySnapshot.path,
        workbookHash: binarySnapshot.hash,
        sheetNames: parsed.sheetNames,
        headerRow: parsed.headerRow,
        headers: parsed.headers,
        notes: parsed.notes,
        reportedSource: parsed.source
      };
    } else {
      const raw = await fetchPpacCurrentImportExport({
        financialYear: item.financialYear,
        reportBy: item.reportBy,
        pageId: item.pageId
      });
      const rawSnapshot = await writeRawSnapshot("ppac", `${item.id}.${item.financialYear}.${item.reportBy}.raw`, `${stableJson(raw)}\n`, "json");
      parsed = parsePpacCurrentImportExport(raw, {
        financialYear: item.financialYear,
        reportBy: item.reportBy
      });
      jsonSnapshot = await writeSnapshot("ppac", `${item.id}.${item.financialYear}.${item.reportBy}.parsed`, parsed);
      artifactMetadata = {
        financialYear: item.financialYear,
        reportBy: item.reportBy,
        pageId: item.pageId,
        modifiedDate: parsed.modifiedDate,
        fileName: parsed.fileName,
        rawSnapshot: rawSnapshot.path,
        rawHash: rawSnapshot.hash
      };
    }

    const artifact = createTableArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "ppac",
      sourceIndicatorId,
      sourceUrl: item.sourceUrl || "https://ppac.gov.in/import-export",
      unit: item.unit,
      fetchedAt,
      rows: parsed.rows,
      dimensions: Object.keys(parsed.rows[0] || {}),
      metadata: artifactMetadata
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "ppac",
      name: `ppac.IN.${item.id}`,
      artifact
    });
    manifest.push({
      status: "ready",
      indicatorId: item.id,
      sourceIndicatorId,
      artifact: artifactPath,
      snapshot: jsonSnapshot.path,
      rawSnapshot: artifactMetadata.rawSnapshot,
      workbookSnapshot: binarySnapshot?.path,
      rawHash: binarySnapshot?.hash || artifactMetadata.rawHash,
      modifiedDate: parsed.modifiedDate,
      fileName: parsed.fileName,
      rows: parsed.rows.length,
      fetchedAt
    });
    console.log(`ppac ${item.id} ${parsed.rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: item.id,
      sourceIndicatorId: item.workbookUrl,
      fetchedAt,
      error: error.message
    });
    console.warn(`ppac ${item.id} failed: ${error.message}`);
  }
}

await mergeSourceManifest("ppac", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} PPAC artifacts; ${failures.length} failure(s).`);
