import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createTableArtifact, writeRawSnapshot, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";
import { REPORT_PAGE_URL, apyTables as tables, findGlancePdfUrl, htmlText, parseApyTable } from "./adapters/des-agri.mjs";

const fetchedAt = new Date().toISOString();

function curlBytes(url, maxTime = "120") {
  const result = spawnSync("curl", ["-k", "--max-time", maxTime, "-L", "-s", url], {
    encoding: null,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(`curl failed for ${url}: ${String(result.stderr || result.stdout || result.status)}`);
  }
  if (!result.stdout?.length) throw new Error(`curl returned empty body for ${url}`);
  return Buffer.from(result.stdout);
}

const manifest = [];
let tmpDir;

try {
  tmpDir = await mkdtemp(join(tmpdir(), "des-agri-apy-"));

  const pageHtml = curlBytes(REPORT_PAGE_URL, "30").toString("utf8");
  const pdfUrl = findGlancePdfUrl(pageHtml);

  const pdfBytes = curlBytes(pdfUrl, "120");

  const pdfSnapshot = await writeRawSnapshot("des-agri-apy", "agricultural-statistics-at-a-glance-2024-25", pdfBytes, "pdf");
  const pageSnapshot = await writeRawSnapshot("des-agri-apy", "agricultural-statistics-at-a-glance-2024-page", pageHtml, "html");

  const pdfPath = join(tmpDir, "glance.pdf");
  const textPath = join(tmpDir, "glance.txt");
  await writeFile(pdfPath, pdfBytes);

  const pdftotext = spawnSync("pdftotext", ["-layout", pdfPath, textPath], { encoding: "utf8" });
  if (pdftotext.status !== 0) {
    throw new Error(`pdftotext failed: ${pdftotext.stderr || pdftotext.stdout || pdftotext.status}`);
  }
  const extractedText = await readFile(textPath, "utf8");
  const textSnapshot = await writeRawSnapshot("des-agri-apy", "agricultural-statistics-at-a-glance-2024-25-text", extractedText, "txt");

  const rows = tables.flatMap((table) => parseApyTable(extractedText, table));
  const years = rows.map((row) => row.year_start).filter(Number.isFinite);
  const artifact = createTableArtifact({
    indicatorId: "agriculture.des.all_india_crop_apy",
    title: "All-India crop area, production and yield",
    sourceId: "des-agri",
    sourceIndicatorId: "agricultural-statistics-at-a-glance-2024-25.tables-2.3a-2.14a",
    sourceUrl: pdfUrl,
    unit: "area: million hectares; production: million tonnes; yield: kg/hectare",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata: {
      reportPageUrl: REPORT_PAGE_URL,
      reportTitle: htmlText((pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "Agricultural Statistics at a Glance 2024"),
      publisher: "Directorate of Economics and Statistics, Department of Agriculture and Farmers Welfare, Ministry of Agriculture and Farmers Welfare, Government of India",
      sourceTables: tables.map(({ sourceTable, crop }) => ({ sourceTable, crop })),
      earliestYearStart: Math.min(...years),
      latestYearStart: Math.max(...years),
      note: "Parsed from official DES Agricultural Statistics at a Glance 2024-25 PDF using pdftotext -layout. The 2024-25 row is advance/provisional in the source report."
    }
  });

  const artifactPath = await writeSeriesArtifact({
    sourceId: "des-agri",
    name: "des-agri.IN.agriculture.all_india_crop_apy",
    artifact
  });

  manifest.push({
    status: "ready",
    indicatorId: "agriculture.des.all_india_crop_apy",
    sourceIndicatorId: "agricultural-statistics-at-a-glance-2024-25.tables-2.3a-2.14a",
    artifact: artifactPath,
    sourceUrl: pdfUrl,
    sourcePageSnapshot: pageSnapshot.path,
    pdfSnapshot: pdfSnapshot.path,
    textSnapshot: textSnapshot.path,
    rawHash: pdfSnapshot.hash,
    rows: rows.length,
    crops: tables.length,
    earliestYearStart: Math.min(...years),
    latestYearStart: Math.max(...years),
    fetchedAt
  });

  console.log(`des agri all-India APY ${rows.length} rows, ${tables.length} crops (${Math.min(...years)}-${Math.max(...years)})`);
} catch (error) {
  manifest.push({
    status: "failed",
    indicatorId: "agriculture.des.all_india_crop_apy",
    sourceIndicatorId: "agricultural-statistics-at-a-glance-2024-25.tables-2.3a-2.14a",
    fetchedAt,
    error: error.message
  });
  console.warn(`des agri APY failed: ${error.message}`);
} finally {
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
}

await writeSourceManifest("des-agri-apy", manifest);
