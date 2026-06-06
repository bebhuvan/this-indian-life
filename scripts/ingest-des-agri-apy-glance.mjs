import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createTableArtifact, writeRawSnapshot, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const REPORT_PAGE_URL = "https://desagri.gov.in/document-report/agricultural-statistics-at-a-glance-2024/";
const fetchedAt = new Date().toISOString();

const tables = [
  {
    cropId: "foodgrains",
    crop: "Foodgrains",
    sourceTable: "Table 2.3(a)",
    startMarker: "Table 2.3(a): Foodgrains: All-India Area, Production and Yield",
    endMarker: "Table 2.3(b):"
  },
  {
    cropId: "rice",
    crop: "Rice",
    sourceTable: "Table 2.4(a)",
    startMarker: "Table 2.4(a): Rice: All-India Area, Production and Yield",
    endMarker: "Table 2.4 (b):"
  },
  {
    cropId: "wheat",
    crop: "Wheat",
    sourceTable: "Table 2.5(a)",
    startMarker: "Table 2.5(a): Wheat: All-India Area, Production and Yield",
    endMarker: "Table 2.5 (b):"
  },
  {
    cropId: "nutri_coarse_cereals",
    crop: "Nutri/Coarse Cereals",
    sourceTable: "Table 2.6(a)",
    startMarker: "Table 2.6(a): Nutri/Coarse Cereals: All-India Area, Production and Yield",
    endMarker: "Table 2.6(b):"
  },
  {
    cropId: "total_pulses",
    crop: "Total Pulses",
    sourceTable: "Table 2.10(a)",
    startMarker: "Table 2.10(a): Total Pulses: All-India Area, Production and Yield",
    endMarker: "Table 2.10 (b):"
  },
  {
    cropId: "nine_oilseeds",
    crop: "Nine Oilseeds",
    sourceTable: "Table 2.14(a)",
    startMarker: "Table 2.14(a): Nine Oilseeds: All-India Area, Production and Yield",
    endMarker: "Table 2.14(b):"
  }
];

function textContent(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function numberValue(value) {
  if (value === "-" || value === "–") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function cropYearStart(cropYear) {
  const parsed = Number(String(cropYear).slice(0, 4));
  return Number.isFinite(parsed) ? parsed : null;
}

function findPdfUrl(html) {
  const hrefs = [...String(html).matchAll(/href=["']([^"']+\.pdf)["']/gi)].map((match) => match[1]);
  const candidate = hrefs.find((href) => /Agricultural-Statis?tics-at-a-Glance-2024/i.test(href)) || hrefs[0];
  if (!candidate) throw new Error("Could not find Agricultural Statistics at a Glance PDF link");
  return new URL(candidate, REPORT_PAGE_URL).toString();
}

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

function parseRowsForTable(text, config) {
  const start = text.indexOf(config.startMarker);
  if (start === -1) throw new Error(`Could not find ${config.sourceTable}`);
  const afterStart = text.slice(start);
  const end = afterStart.indexOf(config.endMarker);
  const block = end === -1 ? afterStart : afterStart.slice(0, end);
  const rows = [];

  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d{4}-\d{2})\s+([0-9.,-]+)\s+([0-9.,-]+)\s+([0-9.,-]+)(?:\s+([0-9.,-]+))?\s*$/);
    if (!match) continue;
    rows.push({
      crop_id: config.cropId,
      crop: config.crop,
      source_table: config.sourceTable,
      crop_year: match[1],
      year_start: cropYearStart(match[1]),
      area_million_hectares: numberValue(match[2]),
      production_million_tonnes: numberValue(match[3]),
      yield_kg_per_hectare: numberValue(match[4]),
      area_under_irrigation_pct: numberValue(match[5] ?? "-")
    });
  }

  if (!rows.length) throw new Error(`No rows parsed for ${config.sourceTable}`);
  return rows;
}

const manifest = [];
let tmpDir;

try {
  tmpDir = await mkdtemp(join(tmpdir(), "des-agri-apy-"));

  const pageHtml = curlBytes(REPORT_PAGE_URL, "30").toString("utf8");
  const pdfUrl = findPdfUrl(pageHtml);

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

  const rows = tables.flatMap((table) => parseRowsForTable(extractedText, table));
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
      reportTitle: textContent((pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "Agricultural Statistics at a Glance 2024"),
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
