import { readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { basename } from "node:path";
import { createTableArtifact, writeRawSnapshot, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const execFileAsync = promisify(execFile);
const SOURCE_ID = "heat-mortality";
const SNAPSHOT_DIR = "data/snapshots/heat-mortality";
const IMD_DWE_DIR = "data/snapshots/imd-dwe";
const fetchedAt = new Date().toISOString();

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER"
];

function parseArgs(argv) {
  const args = {
    years: [2024],
    download: false,
    timeoutMs: 15000
  };
  for (const arg of argv) {
    if (arg === "--download") args.download = true;
    if (arg.startsWith("--timeout-ms=")) args.timeoutMs = Number(arg.split("=")[1]);
    if (arg.startsWith("--years=")) {
      const value = arg.split("=")[1];
      const range = value.match(/^(\d{4})-(\d{4})$/);
      args.years = range
        ? Array.from({ length: Number(range[2]) - Number(range[1]) + 1 }, (_, index) => Number(range[1]) + index)
        : value.split(",").map((year) => Number(year.trim())).filter(Number.isFinite);
    }
  }
  return args;
}

async function pdfToText(path) {
  const result = await execFileAsync("pdftotext", ["-layout", path, "-"], {
    maxBuffer: 80 * 1024 * 1024
  });
  return result.stdout;
}

function numberFrom(value) {
  if (value === "*" || value === undefined || value === null || value === "") return 0;
  const parsed = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function matchNumber(text, regex) {
  const match = text.match(regex);
  if (!match) return null;
  return numberFrom(match[1]);
}

function extractBlock(text, startPattern, endPattern) {
  const matches = [...text.matchAll(new RegExp(startPattern.source, startPattern.flags.includes("g") ? startPattern.flags : `${startPattern.flags}g`))];
  const start = matches.length ? matches.at(-1).index : -1;
  if (start < 0) return "";
  const rest = text.slice(start);
  const end = rest.search(endPattern);
  return end >= 0 ? rest.slice(0, end) : rest;
}

function sourceUrlForYear(year) {
  return `https://www.imdpune.gov.in/library/public/DWE_${year}.pdf`;
}

async function listSnapshotFiles(dir) {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

function fileYear(file) {
  const match = file.match(/(?:DWE_|dwe-|events-)(20\d{2}|19\d{2})/i);
  return match ? Number(match[1]) : null;
}

async function findLocalPdf(year) {
  const dirs = [IMD_DWE_DIR, SNAPSHOT_DIR];
  const pdfs = [];
  for (const dir of dirs) {
    const files = await listSnapshotFiles(dir);
    pdfs.push(...files
      .filter((file) => file.endsWith(".pdf"))
      .filter((file) => {
      const detected = fileYear(file);
      if (detected === year) return true;
      return year === 2024 && file.includes("imd-disastrous-weather-events-2024");
      })
      .map((file) => `${dir}/${file}`));
  }
  pdfs.sort();
  return pdfs.length ? pdfs.at(-1) : null;
}

async function downloadYear(year, timeoutMs) {
  const candidates = [
    `https://www.imdpune.gov.in/library/public/DWE_${year}.pdf`,
    `https://imdpune.gov.in/library/public/DWE_${year}.pdf`
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/pdf,*/*",
          "user-agent": "Indica/0.1 IMD DWE historical heatwave extractor"
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1000) continue;
      const snapshot = await writeRawSnapshot(SOURCE_ID, `imd-dwe-${year}.pdf`, bytes, "pdf");
      return {
        status: "downloaded",
        year,
        url,
        snapshot: snapshot.path,
        rawHash: snapshot.hash,
        bytes: bytes.length
      };
    } catch (error) {
      // Try the next candidate. IMD can be slow/unavailable; cache-first parsing
      // should continue even when downloads fail.
    }
  }

  return {
    status: "missing",
    year,
    sourceUrl: sourceUrlForYear(year),
    reason: "No local PDF and download failed or timed out"
  };
}

function parseStateRows(text, year) {
  const block = extractBlock(
    text,
    /Human and Livestock Loss due to Heat Wave/i,
    /Human and Livestock Loss due to (?:Lightning|Hailstorm|Floods|Cyclonic|Cold Wave|Snowfall)/i
  );
  const rows = [];
  const rowRegex = /^\s*([A-Za-z][A-Za-z ]*?[A-Za-z])\s+(\d+)\s+(?:\*|\d+)/gm;
  for (const match of block.matchAll(rowRegex)) {
    const stateOrUt = match[1].trim().replace(/\s+/g, " ");
    if (/^(Total|Human|State|Deaths|Injured|Missing|Livestock)$/i.test(stateOrUt)) continue;
    rows.push({
      year,
      stateOrUt,
      humanDeaths: Number(match[2]),
      sourceTable: "IMD DWE Human and Livestock Loss due to Heat Wave",
      interpretation: "Reported human deaths due to heat wave; administrative meteorological disaster count"
    });
  }
  return rows.sort((a, b) => b.humanDeaths - a.humanDeaths || a.stateOrUt.localeCompare(b.stateOrUt));
}

function parseMonthlyRows(text, year) {
  const block = extractBlock(
    text,
    /Month wise Deaths due to Disastrous Weather Events/i,
    /Month Wise and State Wise Deaths|Table\s+\d+:/i
  );
  const rows = [];
  for (const month of MONTHS) {
    const regex = new RegExp(`^\\s*${month}\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)`, "m");
    const match = block.match(regex);
    if (!match) continue;
    const humanDeaths = numberFrom(match[3]);
    if (humanDeaths === null) continue;
    rows.push({
      year,
      month,
      humanDeaths,
      sourceTable: "IMD DWE Month wise Deaths due to Disastrous Weather Events",
      interpretation: "Reported monthly human deaths due to heat wave; administrative meteorological disaster count"
    });
  }
  return rows;
}

function parseSummary(text, year, stateRows, monthlyRows) {
  const normalized = text.replace(/\s+/g, " ");
  const eventTableTotal =
    matchNumber(normalized, /Heat Wave\s+([\d,]+)\s+(?:Pre Monsoon|Summer|Monsoon|Whole year|Winter)/i) ??
    matchNumber(normalized, /Heat wave.*?claimed about\s+([\d,]+)\s+lives/i);
  const stateTotal = stateRows.reduce((sum, row) => sum + row.humanDeaths, 0);
  const monthlyTotal = monthlyRows.reduce((sum, row) => sum + row.humanDeaths, 0);
  const bestTotal = eventTableTotal ?? (stateRows.length ? stateTotal : null) ?? (monthlyRows.length ? monthlyTotal : null);

  return {
    year,
    heatwaveDeaths: bestTotal,
    eventTableTotal,
    stateTotal: stateRows.length ? stateTotal : null,
    monthlyTotal: monthlyRows.length ? monthlyTotal : null,
    stateRows: stateRows.length,
    monthlyRows: monthlyRows.length,
    stateTotalMatches: bestTotal !== null && stateRows.length ? stateTotal === bestTotal : null,
    monthlyTotalMatches: bestTotal !== null && monthlyRows.length ? monthlyTotal === bestTotal : null,
    sourceUrl: sourceUrlForYear(year),
    interpretation: "Reported IMD heatwave deaths; not all-cause heat-attributable excess mortality"
  };
}

async function parseYear(year, pdfPath) {
  const text = await pdfToText(pdfPath);
  const textSnapshot = await writeRawSnapshot(SOURCE_ID, `imd-dwe-${year}.extracted`, text, "txt");
  const stateRows = parseStateRows(text, year);
  const monthlyRows = parseMonthlyRows(text, year);
  const summary = parseSummary(text, year, stateRows, monthlyRows);
  return {
    status: "parsed",
    year,
    pdfPath,
    textSnapshot: textSnapshot.path,
    stateRows,
    monthlyRows,
    summary
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const parsed = [];
  const unavailable = [];
  const downloads = [];

  for (const year of args.years) {
    let pdfPath = await findLocalPdf(year);
    if (!pdfPath && args.download) {
      const download = await downloadYear(year, args.timeoutMs);
      downloads.push(download);
      if (download.status === "downloaded") pdfPath = download.snapshot;
    }
    if (!pdfPath) {
      unavailable.push({
        year,
        status: "missing",
        sourceUrl: sourceUrlForYear(year),
        reason: "No local PDF snapshot available"
      });
      continue;
    }
    try {
      parsed.push(await parseYear(year, pdfPath));
    } catch (error) {
      unavailable.push({
        year,
        status: "failed",
        pdfPath,
        error: error.message
      });
    }
  }

  const totalRows = parsed.map((item) => item.summary);
  const stateRows = parsed.flatMap((item) => item.stateRows);
  const monthlyRows = parsed.flatMap((item) => item.monthlyRows);

  const artifacts = [];
  if (parsed.length) {
    artifacts.push(await writeSeriesArtifact({
      sourceId: SOURCE_ID,
      name: "heat-mortality.IN.imd_dwe_historical_heatwave_totals",
      artifact: createTableArtifact({
        indicatorId: "heat.imd_dwe_historical.heatwave_totals",
        title: "IMD DWE historical heatwave death totals",
        sourceId: "imd",
        sourceIndicatorId: "Disastrous Weather Events annual PDFs",
        sourceUrl: "https://imdpune.gov.in/library/publicationnew.html",
        unit: "reported deaths",
        fetchedAt,
        rows: totalRows,
        dimensions: ["year"],
        metadata: {
          yearsRequested: args.years,
          unavailable,
          downloads,
          note: "Reported disaster deaths from IMD DWE PDFs. These are not all-cause heat-attributable excess deaths."
        }
      })
    }));

    artifacts.push(await writeSeriesArtifact({
      sourceId: SOURCE_ID,
      name: "heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_state",
      artifact: createTableArtifact({
        indicatorId: "heat.imd_dwe_historical.heatwave_deaths_by_state",
        title: "IMD DWE historical heatwave deaths by state/UT",
        sourceId: "imd",
        sourceIndicatorId: "Disastrous Weather Events annual PDFs",
        sourceUrl: "https://imdpune.gov.in/library/publicationnew.html",
        unit: "reported deaths",
        fetchedAt,
        rows: stateRows,
        dimensions: ["year", "stateOrUt"],
        metadata: {
          yearsRequested: args.years,
          unavailable,
          downloads,
          note: "Reported disaster deaths from IMD DWE PDFs. These are not all-cause heat-attributable excess deaths."
        }
      })
    }));

    artifacts.push(await writeSeriesArtifact({
      sourceId: SOURCE_ID,
      name: "heat-mortality.IN.imd_dwe_historical_heatwave_deaths_by_month",
      artifact: createTableArtifact({
        indicatorId: "heat.imd_dwe_historical.heatwave_deaths_by_month",
        title: "IMD DWE historical heatwave deaths by month",
        sourceId: "imd",
        sourceIndicatorId: "Disastrous Weather Events annual PDFs",
        sourceUrl: "https://imdpune.gov.in/library/publicationnew.html",
        unit: "reported deaths",
        fetchedAt,
        rows: monthlyRows,
        dimensions: ["year", "month"],
        metadata: {
          yearsRequested: args.years,
          unavailable,
          downloads,
          note: "Reported disaster deaths from IMD DWE PDFs. These are not all-cause heat-attributable excess deaths."
        }
      })
    }));
  }

  const runSummary = {
    fetchedAt,
    args,
    artifacts,
    parsed: parsed.map((item) => ({
      year: item.year,
      pdfPath: item.pdfPath,
      pdfFile: basename(item.pdfPath),
      textSnapshot: item.textSnapshot,
      ...item.summary
    })),
    unavailable,
    downloads
  };
  const snapshot = await writeSnapshot(SOURCE_ID, "imd-dwe-historical-extraction-summary", runSummary);

  console.log(JSON.stringify({
    yearsRequested: args.years,
    parsedYears: parsed.map((item) => item.year),
    unavailableYears: unavailable.map((item) => item.year),
    totalRows: totalRows.length,
    stateRows: stateRows.length,
    monthlyRows: monthlyRows.length,
    summarySnapshot: snapshot.path
  }, null, 2));

  if (!parsed.length) {
    process.exitCode = 1;
  }
}

await main();
