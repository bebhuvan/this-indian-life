import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { createSeriesArtifact, sourceSlug, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";
import { discoverTraiTelecomSubscriptionReports } from "./adapters/trai.mjs";
import { extractTraiSubscriptionPdf, parseTraiReportPeriod } from "./extract-trai-subscription-pdf.mjs";

const args = process.argv.slice(2);

function argValue(name, fallback = undefined) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfExists(path) {
  if (!(await exists(path))) return null;
  return JSON.parse(await readFile(path, "utf8"));
}

function localPdfPath(url) {
  const parsed = new URL(url);
  const file = decodeURIComponent(basename(parsed.pathname));
  const slug = sourceSlug(file || parsed.pathname);
  return `data/snapshots/trai-pdf/${slug.endsWith(".pdf") ? slug : `${slug}.pdf`}`;
}

function isMonthlySubscriptionReport(report) {
  const title = `${report.title || ""} ${report.pdfUrl || ""}`;
  if (/corrigendum/i.test(title)) return false;
  return /telecom subscription data|telecom subscribers growth/i.test(title);
}

function monthIndex(month) {
  if (!/^\d{4}-\d{2}$/.test(String(month))) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) return null;
  return year * 12 + monthNumber;
}

async function downloadPdf(url, destination) {
  if (await exists(destination)) return { path: destination, downloaded: false };
  await mkdir("data/snapshots/trai-pdf", { recursive: true });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      accept: "application/pdf",
      "user-agent": "Indica/0.1 TRAI data ingestion"
    }
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`PDF download failed ${response.status}: ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length < 1000) throw new Error(`PDF download was unexpectedly small: ${url}`);
  await writeFile(destination, body);
  return { path: destination, downloaded: true };
}

async function loadReports({ refresh, maxPages }) {
  if (!refresh) {
    const discovery = await readJsonIfExists("data/catalog/india-gov-source-discovery.json");
    const reports = discovery?.sources?.trai?.reports;
    if (Array.isArray(reports) && reports.length) return { reports, source: "data/catalog/india-gov-source-discovery.json" };
  }
  const discovered = await discoverTraiTelecomSubscriptionReports({ maxPages });
  return { reports: discovered.reports, source: "live_TRAI_discovery" };
}

const seriesSpecs = [
  {
    slug: "telecom_subscribers_total",
    indicatorId: "society.trai.telecom_subscribers_total",
    title: "Telecom subscribers, total",
    section: "total",
    metric: "telephone_subscribers",
    valueField: "total",
    unit: "million"
  },
  {
    slug: "telecom_subscribers_wireless",
    indicatorId: "society.trai.telecom_subscribers_wireless",
    title: "Telecom subscribers, wireless",
    section: "total",
    metric: "telephone_subscribers",
    valueField: "wireless",
    unit: "million"
  },
  {
    slug: "telecom_subscribers_wireline",
    indicatorId: "society.trai.telecom_subscribers_wireline",
    title: "Telecom subscribers, wireline",
    section: "total",
    metric: "telephone_subscribers",
    valueField: "wireline",
    unit: "million"
  },
  {
    slug: "telecom_subscribers_urban_total",
    indicatorId: "society.trai.telecom_subscribers_urban_total",
    title: "Telecom subscribers, urban",
    section: "urban",
    metric: "telephone_subscribers",
    valueField: "total",
    unit: "million"
  },
  {
    slug: "telecom_subscribers_rural_total",
    indicatorId: "society.trai.telecom_subscribers_rural_total",
    title: "Telecom subscribers, rural",
    section: "rural",
    metric: "telephone_subscribers",
    valueField: "total",
    unit: "million"
  },
  {
    slug: "broadband_subscribers_total",
    indicatorId: "society.trai.broadband_subscribers_total",
    title: "Broadband subscribers, total",
    section: "broadband",
    metric: "broadband_subscribers",
    valueField: "total",
    unit: "million"
  },
  {
    slug: "teledensity_total",
    indicatorId: "society.trai.teledensity_total",
    title: "Tele-density, total",
    section: "overall",
    metric: "teledensity_without_m2m",
    fallbackMetrics: ["teledensity"],
    valueField: "total",
    unit: "%"
  },
  {
    slug: "active_wireless_mobile_subscribers_peak_vlr",
    indicatorId: "society.trai.active_wireless_mobile_subscribers_peak_vlr",
    title: "Active wireless mobile subscribers on peak VLR date",
    section: "wireless",
    metric: "active_wireless_mobile_subscribers_peak_vlr",
    valueField: "total",
    unit: "million"
  },
  {
    slug: "mobile_number_portability_requests",
    indicatorId: "society.trai.mobile_number_portability_requests",
    title: "Mobile Number Portability requests",
    section: "mnp",
    metric: "mobile_number_portability_requests",
    valueField: "total",
    unit: "million"
  }
];

function rowValue(rows, spec) {
  const metricCandidates = [spec.metric, ...(spec.fallbackMetrics || [])];
  const row = rows.find((item) => item.section === spec.section && metricCandidates.includes(item.metric));
  const value = row?.[spec.valueField];
  return Number.isFinite(value) ? value : null;
}

function observationsForSpec(results, spec) {
  const byDate = new Map();
  for (const result of results) {
    const date = result.reportPeriod.date;
    if (!date) continue;
    byDate.set(date, {
      date,
      value: rowValue(result.rows, spec)
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function mergeExistingObservations(path, observations) {
  const existing = await readJsonIfExists(path);
  const byDate = new Map();
  for (const observation of existing?.observations || []) {
    if (observation?.date) byDate.set(observation.date, observation);
  }
  for (const observation of observations) {
    if (observation?.date) byDate.set(observation.date, observation);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const limit = Number(argValue("--limit", "12"));
const maxPages = Number(argValue("--max-pages", "2"));
const refresh = args.includes("--refresh-discovery");
const ocrFallback = args.includes("--ocr-fallback");
const manifestName = argValue("--manifest-name", "trai-subscriptions");
const historicalPartial = args.includes("--historical-partial");
const skipNonMonthly = args.includes("--skip-non-monthly");
const ocrDpi = Number(argValue("--ocr-dpi", "180"));
const ocrMinMonth = argValue("--ocr-min-month", "");
const ocrMinMonthIndex = monthIndex(ocrMinMonth);
const fetchedAt = new Date().toISOString();
const { reports, source: reportSource } = await loadReports({ refresh, maxPages });
const candidateReports = skipNonMonthly ? reports.filter(isMonthlySubscriptionReport) : reports;
const skippedReports = skipNonMonthly ? reports.filter((report) => !isMonthlySubscriptionReport(report)) : [];
const selectedReports = candidateReports.slice(0, Number.isFinite(limit) && limit > 0 ? limit : candidateReports.length);
const manifest = [];
const extractionResults = [];
if (skippedReports.length) console.log(`trai skipped ${skippedReports.length} non-monthly report(s)`);

for (const report of selectedReports) {
  const pdfPath = localPdfPath(report.pdfUrl);
  const reportMonth = parseTraiReportPeriod("", report.title).date;
  const reportMonthIndex = monthIndex(reportMonth);
  const reportOcrFallback = ocrFallback && (
    !ocrMinMonthIndex || (reportMonthIndex !== null && reportMonthIndex >= ocrMinMonthIndex)
  );
  try {
    const download = await downloadPdf(report.pdfUrl, pdfPath);
    const result = await extractTraiSubscriptionPdf({
      pdfPath,
      sourceUrl: report.pdfUrl,
      title: report.title,
      fetchedAt,
      ocrFallback: reportOcrFallback,
      strictValidation: !historicalPartial,
      ocrDpi: Number.isFinite(ocrDpi) && ocrDpi > 0 ? ocrDpi : 180
    });
    extractionResults.push({ ...result, report });
    manifest.push({
      status: "ready",
      indicatorId: result.artifact.indicatorId,
      sourceIndicatorId: result.artifact.sourceIndicatorId,
      artifact: result.artifactPath,
      rows: result.rows.length,
      snapshot: result.snapshot,
      pdfSnapshot: pdfPath,
      rawHash: result.pdfHash,
      fetchedAt,
      sourceUrl: report.pdfUrl,
      releaseDate: report.releaseDate,
      downloaded: download.downloaded,
      extractionMethod: result.extractionMethod,
      validationProfile: historicalPartial ? "historical_partial_core_table" : "strict_current_report",
      ocrFallbackAllowed: reportOcrFallback,
      ocrDpi: result.artifact.metadata?.ocrDpi || null
    });
    console.log(`trai ${result.reportPeriod.date || sourceSlug(report.title)} ${result.rows.length} rows`);
  } catch (error) {
    manifest.push({
      status: "failed",
      indicatorId: "society.trai.telecom_subscription_summary",
      sourceIndicatorId: report.pdfUrl,
      fetchedAt,
      sourceUrl: report.pdfUrl,
      releaseDate: report.releaseDate,
      ocrFallbackAllowed: reportOcrFallback,
      error: error.message
    });
    console.warn(`trai ${sourceSlug(report.title)} failed: ${error.message}`);
  }
}

for (const spec of seriesSpecs) {
  const artifactPath = `data/series/${sourceSlug(`trai.IN.${spec.slug}`)}.json`;
  const observations = await mergeExistingObservations(artifactPath, observationsForSpec(extractionResults, spec));
  if (!observations.length) {
    manifest.push({
      status: "failed",
      indicatorId: spec.indicatorId,
      sourceIndicatorId: spec.slug,
      fetchedAt,
      error: "No observations extracted"
    });
    continue;
  }

  const artifact = createSeriesArtifact({
    indicatorId: spec.indicatorId,
    title: spec.title,
    sourceId: "trai",
    sourceIndicatorId: spec.slug,
    sourceUrl: "https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports",
    unit: spec.unit,
    frequency: "monthly",
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    observations,
    metadata: {
      sourceOwner: "Telecom Regulatory Authority of India",
      reportSource,
      extractionMethod: ocrFallback ? "native_pdf_text_with_optional_paddle_structure_fallback" : "native_pdf_text_pdftotext_layout",
      validationProfile: historicalPartial ? "historical_partial_core_table" : "strict_current_report",
      ocrFallback,
      ocrMinMonth: ocrMinMonth || null,
      ocrDpi: Number.isFinite(ocrDpi) && ocrDpi > 0 ? ocrDpi : 180,
      pdfBacked: true,
      selector: {
        section: spec.section,
        metric: spec.metric,
        fallbackMetrics: spec.fallbackMetrics || [],
        valueField: spec.valueField
      },
      reportsParsed: extractionResults.map((result) => ({
        period: result.reportPeriod.date,
        title: result.report.title,
        pdfUrl: result.report.pdfUrl,
        artifact: result.artifactPath
      })),
      caveats: [
        "Values are parsed from TRAI monthly report PDFs using embedded PDF text.",
        "Subscriber counts are subscriptions or connections, not unique individuals.",
        "Rows are profile-selected from the report headline table and should be revalidated when TRAI changes report layout."
      ]
    }
  });
  const writtenArtifactPath = await writeSeriesArtifact({ sourceId: "trai", name: `trai.IN.${spec.slug}`, artifact });
  manifest.push({
    status: "ready",
    indicatorId: spec.indicatorId,
    sourceIndicatorId: spec.slug,
    artifact: writtenArtifactPath,
    observations: observations.length,
    fetchedAt
  });
  console.log(`trai ${spec.slug} ${observations.length} observations`);
}

const manifestPath = await writeSourceManifest(manifestName, manifest);
console.log(`Wrote ${extractionResults.length} TRAI PDF table artifact(s), ${seriesSpecs.length} monthly series target(s), manifest ${manifestPath}.`);
