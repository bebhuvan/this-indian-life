import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const INDEX_URL = "https://imdpune.gov.in/cmpg/subdivrainfall/subdivisonrainfall.html";
const BASE_URL = "https://imdpune.gov.in/cmpg/subdivrainfall/";
const fetchedAt = new Date().toISOString();
const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function textContent(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceSlug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function numberValue(value) {
  const parsed = Number(String(value).replace(/[(),]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCells(rowHtml) {
  return [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => textContent(match[1]));
}

function parseOptions(html) {
  return [...html.matchAll(/<option[^>]*value\s*=\s*["']?\s*([^"'\s>]+)\s*["']?[^>]*>([\s\S]*?)(?=<option|<\/select>)/gi)]
    .map((match) => ({
      file: match[1].trim(),
      subdivision: textContent(match[2])
    }))
    .filter((entry) => entry.file && entry.subdivision);
}

function parseSubdivisionPage(html, fallbackName) {
  const heading = textContent((html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i) || [])[1] || fallbackName);
  const rows = [];
  let normal = null;

  for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = parseCells(rowMatch[1]);
    if (cells.length !== 15) continue;
    const rowType = String(cells[1] || "").toUpperCase();

    if (rowType === "NORM") {
      normal = {
        normal_period: cells[0].replace(/[()]/g, ""),
        ...Object.fromEntries(months.map((month, index) => [`normal_${month}_mm`, numberValue(cells[index + 2])])),
        normal_annual_mm: numberValue(cells[14])
      };
      continue;
    }

    if (rowType !== "ACTL") continue;
    const year = numberValue(cells[0]);
    if (!year) continue;
    rows.push({
      subdivision_id: sourceSlug(heading),
      subdivision: heading,
      year,
      ...Object.fromEntries(months.map((month, index) => [`actual_${month}_mm`, numberValue(cells[index + 2])])),
      actual_annual_mm: numberValue(cells[14])
    });
  }

  return { heading, normal, rows };
}

const manifest = [];
const rows = [];
const normals = [];
const sourcePages = [];

try {
  const indexResponse = await fetch(INDEX_URL);
  if (!indexResponse.ok) throw new Error(`Index HTTP ${indexResponse.status}`);
  const indexHtml = await indexResponse.text();
  const options = parseOptions(indexHtml);
  if (!options.length) throw new Error("No subdivision options parsed");

  const indexSnapshot = await writeSnapshot("imd-subdivision-rainfall", "subdivision-index", {
    sourceUrl: INDEX_URL,
    html: indexHtml
  });
  sourcePages.push({ url: INDEX_URL, snapshot: indexSnapshot.path, rawHash: indexSnapshot.hash });

  for (const option of options) {
    const url = new URL(option.file, BASE_URL).toString();
    const response = await fetch(url);
    if (!response.ok) {
      manifest.push({
        status: "failed",
        sourceUrl: url,
        subdivision: option.subdivision,
        fetchedAt,
        error: `HTTP ${response.status}`
      });
      continue;
    }

    const html = await response.text();
    const parsed = parseSubdivisionPage(html, option.subdivision);
    const snapshot = await writeSnapshot("imd-subdivision-rainfall", `${option.file}`, { sourceUrl: url, html });
    sourcePages.push({ url, snapshot: snapshot.path, rawHash: snapshot.hash });

    if (parsed.normal) {
      normals.push({
        subdivision_id: sourceSlug(parsed.heading),
        subdivision: parsed.heading,
        ...parsed.normal
      });
    }
    rows.push(...parsed.rows);
    console.log(`imd subdivision ${parsed.heading}: ${parsed.rows.length} rows`);
  }

  if (!rows.length) throw new Error("No subdivision rainfall rows parsed");
  const years = rows.map((row) => row.year);
  const subdivisions = [...new Set(rows.map((row) => row.subdivision_id))];
  const artifact = createTableArtifact({
    indicatorId: "climate.imd.subdivision_rainfall",
    title: "Monthly rainfall by IMD meteorological subdivision",
    sourceId: "imd",
    sourceIndicatorId: "cmpg.subdivrainfall",
    sourceUrl: INDEX_URL,
    unit: "mm",
    geography: { type: "region-set", id: "imd_meteorological_subdivisions", name: "IMD meteorological subdivisions" },
    fetchedAt,
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata: {
      sourceTable: "IMD Pune Climate Prediction and Monitoring Group, Sub Division Rainfall Data",
      normalPeriod: "1971-2020",
      normals,
      subdivisions: subdivisions.length,
      earliestYear: Math.min(...years),
      latestYear: Math.max(...years),
      note: "The source pages provide actual monthly and annual rainfall in millimetres for each meteorological subdivision, with a 1971-2020 normal row."
    }
  });

  const artifactPath = await writeSeriesArtifact({
    sourceId: "imd",
    name: "imd.IN.climate.imd.subdivision_rainfall",
    artifact
  });

  manifest.push({
    status: "ready",
    indicatorId: "climate.imd.subdivision_rainfall",
    sourceIndicatorId: "cmpg.subdivrainfall",
    artifact: artifactPath,
    sourcePages,
    rows: rows.length,
    subdivisions: subdivisions.length,
    earliestYear: Math.min(...years),
    latestYear: Math.max(...years),
    fetchedAt
  });
} catch (error) {
  manifest.push({
    status: "failed",
    indicatorId: "climate.imd.subdivision_rainfall",
    sourceIndicatorId: "cmpg.subdivrainfall",
    fetchedAt,
    error: error.message
  });
  console.warn(`imd subdivision rainfall failed: ${error.message}`);
}

await writeSourceManifest("imd-subdivision-rainfall", manifest);
console.log(`Wrote ${rows.length} IMD subdivision rainfall rows.`);
