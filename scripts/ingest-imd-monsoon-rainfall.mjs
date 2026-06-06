import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const SOURCE_URL = "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html";
const fetchedAt = new Date().toISOString();

const regionByHeading = [
  ["North West India", { id: "north_west_india", name: "North West India", subdivisions: 9 }],
  ["North East India", { id: "north_east_india", name: "North East India", subdivisions: 7 }],
  ["Central India", { id: "central_india", name: "Central India", subdivisions: 10 }],
  ["South Peninsula", { id: "south_peninsula", name: "South Peninsula", subdivisions: 10 }],
  ["India", { id: "all_india", name: "All India", subdivisions: null }]
];

function textContent(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function numberValue(value) {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCells(rowHtml) {
  return [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => textContent(match[1]));
}

function regionForHeading(heading) {
  const match = regionByHeading.find(([prefix]) => heading.includes(prefix));
  if (!match) return null;
  return match[1];
}

function parseRainfallTables(html) {
  const sections = html.split(/<div class="tab-pane[^"]*"[^>]*>/i).slice(1);
  const rows = [];

  for (const section of sections) {
    const heading = textContent((section.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i) || [])[1] || "");
    const region = regionForHeading(heading);
    if (!region) continue;

    const tableHtml = (section.match(/<table[^>]*>([\s\S]*?)<\/table>/i) || [])[1];
    if (!tableHtml) continue;

    for (const rowMatch of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = parseCells(rowMatch[1]);
      if (cells.length !== 12) continue;
      const actualYear = numberValue(cells[0]);
      const departureYear = numberValue(cells[6]);
      if (!actualYear || actualYear !== departureYear) continue;

      rows.push({
        region_id: region.id,
        region: region.name,
        subdivisions: region.subdivisions,
        year: actualYear,
        actual_jun_mm: numberValue(cells[1]),
        actual_jul_mm: numberValue(cells[2]),
        actual_aug_mm: numberValue(cells[3]),
        actual_sep_mm: numberValue(cells[4]),
        actual_jun_sep_mm: numberValue(cells[5]),
        departure_jun_pct: numberValue(cells[7]),
        departure_jul_pct: numberValue(cells[8]),
        departure_aug_pct: numberValue(cells[9]),
        departure_sep_pct: numberValue(cells[10]),
        departure_jun_sep_pct: numberValue(cells[11])
      });
    }
  }

  return rows;
}

const manifest = [];

try {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const rows = parseRainfallTables(html);
  if (!rows.length) throw new Error("No monsoon rainfall rows parsed");

  const regions = [...new Set(rows.map((row) => row.region_id))];
  const years = rows.map((row) => row.year);
  const snapshot = await writeSnapshot("imd-monsoon-rainfall", "rainfall_data.html", { sourceUrl: SOURCE_URL, html });
  const artifact = createTableArtifact({
    indicatorId: "climate.imd.monsoon_rainfall_regions",
    title: "June-September rainfall by all-India and homogeneous regions",
    sourceId: "imd",
    sourceIndicatorId: "cmpg.Product.Rainfall_Data",
    sourceUrl: SOURCE_URL,
    unit: "mm and percent departure",
    geography: { type: "region-set", id: "imd_homogeneous_regions", name: "India and IMD homogeneous rainfall regions" },
    fetchedAt,
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata: {
      sourceTable: "IMD Pune Climate Prediction and Monitoring Group, SW Monsoon Rainfall Data",
      season: "June-September",
      regions,
      earliestYear: Math.min(...years),
      latestYear: Math.max(...years),
      note: "The page provides actual rainfall in mm and percent departure for June, July, August, September, and June-September."
    }
  });

  const artifactPath = await writeSeriesArtifact({
    sourceId: "imd",
    name: "imd.IN.climate.imd.monsoon_rainfall_regions",
    artifact
  });

  manifest.push({
    status: "ready",
    indicatorId: "climate.imd.monsoon_rainfall_regions",
    sourceIndicatorId: "cmpg.Product.Rainfall_Data",
    artifact: artifactPath,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    rows: rows.length,
    regions: regions.length,
    earliestYear: Math.min(...years),
    latestYear: Math.max(...years),
    fetchedAt
  });
  console.log(`imd monsoon rainfall ${rows.length} rows, ${regions.length} regions (${Math.min(...years)}-${Math.max(...years)})`);
} catch (error) {
  manifest.push({
    status: "failed",
    indicatorId: "climate.imd.monsoon_rainfall_regions",
    sourceIndicatorId: "cmpg.Product.Rainfall_Data",
    fetchedAt,
    error: error.message
  });
  console.warn(`imd monsoon rainfall failed: ${error.message}`);
}

await writeSourceManifest("imd-monsoon-rainfall", manifest);
