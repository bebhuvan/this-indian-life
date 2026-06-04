import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createTableArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { runPaddleStructurePage } from "./extractors/paddle-structure.mjs";

function argValue(args, name, fallback = undefined) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function parseMetricValue(value) {
  const text = String(value)
    .replace(/[−–]/g, "-")
    .replace(/[pP](?=\d)/g, "6")
    .replace(/[^0-9.,%+-]/g, "")
    .replace(/,/g, "")
    .trim();
  if (!text) return null;
  if (text.endsWith("%")) return Number(text.slice(0, -1));
  return Number(text);
}

function parseMagnitudeToMillion(value, unit = "million") {
  const number = parseMetricValue(value);
  if (typeof number !== "number" || !Number.isFinite(number)) return null;
  if (/lakh/i.test(unit)) return number / 10;
  if (/crore/i.test(unit)) return number * 10;
  return number;
}

function metricUnit(label) {
  if (/growth|share|tele-?density|teledensity/i.test(label)) return "%";
  if (/subscribers|subscription|addition/i.test(label)) return "million";
  return "";
}

function normalizeMetric(label, previousSection) {
  const lower = label.toLowerCase();
  if (/^(no\.?\s+of\s+)?broadband subscribers\b/.test(lower)) return { section: "broadband", metric: "broadband_subscribers" };
  if (/^urban (telephone )?subscribers\b/.test(lower)) return { section: "urban", metric: "telephone_subscribers" };
  if (/^rural (telephone )?subscribers\b/.test(lower)) return { section: "rural", metric: "telephone_subscribers" };
  if (/^total (telephone )?subscribers\b/.test(lower)) return { section: "total", metric: "telephone_subscribers" };
  if (lower.includes("net addition")) return { section: previousSection || "unknown", metric: "net_addition" };
  if (lower.includes("monthly growth rate")) return { section: previousSection || "unknown", metric: "monthly_growth_rate" };
  if (lower.includes("monthly growth")) return { section: previousSection || "unknown", metric: "monthly_growth_rate" };
  if (lower.includes("share of urban subscribers")) return { section: "urban_share", metric: "subscriber_share" };
  if (lower.includes("share of rural subscribers")) return { section: "rural_share", metric: "subscriber_share" };
  if (/overall tele-?density|overall teledensity/.test(lower) && lower.includes("with m2m")) return { section: "overall", metric: "teledensity_with_m2m" };
  if (/overall tele-?density|overall teledensity/.test(lower)) return { section: "overall", metric: "teledensity" };
  if (/^teledensity\b|^tele-density\b/.test(lower)) return { section: "overall", metric: "teledensity" };
  if (/urban tele-?density|urban teledensity/.test(lower)) return { section: "urban", metric: "teledensity" };
  if (/rural tele-?density|rural teledensity/.test(lower)) return { section: "rural", metric: "teledensity" };
  if (/(tele-?density|teledensity)/.test(lower) && lower.includes("without")) return { section: "overall", metric: "teledensity_without_m2m" };
  return { section: previousSection || "unknown", metric: sourceSlug(label).toLowerCase() };
}

function parseNumericTokens(line) {
  return [...String(line).matchAll(/-?\d[\d,.]*(?:[pP]\d+)?%?/g)]
    .map((match) => parseMetricValue(match[0]))
    .filter((value) => typeof value === "number" && Number.isFinite(value));
}

function teledensityRowFromLine(line, extractionMethod) {
  if (!/tele-?density|teledensity/i.test(line)) return null;
  const values = parseNumericTokens(line);
  if (values.length < 3) return null;
  const normalized = normalizeMetric(line, "");
  if (normalized.metric !== "teledensity" && normalized.metric !== "teledensity_without_m2m" && normalized.metric !== "teledensity_with_m2m") return null;
  const [wireless, wireline, total] = values.slice(-3);
  return {
    page: 1,
    section: normalized.section,
    metric: normalized.metric,
    label: clean(line.replace(/-?\d[\d,.]*(?:[pP]\d+)?%?/g, "")) || clean(line),
    unit: "%",
    wireless,
    wireline,
    total,
    extractionMethod
  };
}

function parseMnpRequests(text) {
  const compact = clean(text);
  const patterns = [
    /In\s+the\s+month\s+of\s+[A-Za-z]+,?\s+\d{4},?\s+([0-9.]+)\s+(million|lakh|crore)\s+subscribers\s+submitted\s+their\s+requests\s+for.{0,140}?\bMNP\b/i,
    /In\s+the\s+month\s+of\s+[A-Za-z]+,?\s+\d{4}\s+alone,?\s+([0-9.]+)\s+(million|lakh|crore)\s+requests.{0,140}?\bMNP\b/i,
    /In\s+the\s+month\s+of\s+[A-Za-z]+,?\s+\d{4}\s+alone\s+([0-9.]+)\s+(million|lakh|crore)\s+requests/i
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match) return parseMagnitudeToMillion(match[1], match[2]);
  }
  const deltaMatch = compact.match(/Mobile Number Portability requests (?:has )?increas(?:e|ed) from\s+([0-9.]+)\s+(million|lakh|crore).{0,120}?to\s+([0-9.]+)\s+(million|lakh|crore)/i);
  if (deltaMatch) {
    const previous = parseMagnitudeToMillion(deltaMatch[1], deltaMatch[2]);
    const current = parseMagnitudeToMillion(deltaMatch[3], deltaMatch[4]);
    if (typeof previous === "number" && typeof current === "number") return current - previous;
  }
  return null;
}

function parseActiveWirelessPeakVlr(text) {
  const compact = clean(text);
  const directMatch = compact.match(/active wireless\s*(?:\(mobile\))?\s+subscribers\s+in\s+VLR(?:\s+in\s+[A-Za-z0-9 -]+?)?\s+(?:was|were|are|is)?\s*([0-9][0-9,.]*)\s*(million|lakh|crore)/i);
  if (directMatch) return parseMagnitudeToMillion(directMatch[1], directMatch[2] || "million");
  const match = compact.match(/active wireless\s*(?:\(mobile\))?\s+subscribers.{0,140}?\b(?:was|were|are|is)\s+([0-9][0-9,.]*)\s*(million|lakh|crore)?/i);
  return match ? parseMagnitudeToMillion(match[1], match[2] || "million") : null;
}

function parseBroadbandProseRows(text, extractionMethod) {
  const compact = clean(text);
  const rows = [];
  const splitMatch = compact.match(/Total Broadband.{0,160}?subscription\s+is\s+([0-9.]+)\s+(million|lakh|crore).{0,220}?wired broadband subscription is\s+([0-9.]+)\s+(million|lakh|crore).{0,220}?wireless broadband subscription is\s+([0-9.]+)\s+(million|lakh|crore)/i);
  if (splitMatch) {
    rows.push({
      page: 1,
      section: "broadband",
      metric: "broadband_subscribers",
      label: "Broadband subscribers from prose",
      unit: "million",
      wireless: parseMagnitudeToMillion(splitMatch[5], splitMatch[6]),
      wireline: parseMagnitudeToMillion(splitMatch[3], splitMatch[4]),
      total: parseMagnitudeToMillion(splitMatch[1], splitMatch[2]),
      extractionMethod
    });
    return rows;
  }

  const splitIncreaseMatch = compact.match(/Total Broadband.{0,160}?subscription increased from\s+[0-9.]+\s*(?:million|lakh|crore).{0,120}?to\s+([0-9.]+)\s*(million|lakh|crore).{0,220}?wired broadband subscription is\s+([0-9.]+)\s*(million|lakh|crore).{0,220}?wireless broadband subscription is\s+([0-9.]+)\s*(million|lakh|crore)/i);
  if (splitIncreaseMatch) {
    rows.push({
      page: 1,
      section: "broadband",
      metric: "broadband_subscribers",
      label: "Broadband subscribers from prose",
      unit: "million",
      wireless: parseMagnitudeToMillion(splitIncreaseMatch[5], splitIncreaseMatch[6]),
      wireline: parseMagnitudeToMillion(splitIncreaseMatch[3], splitIncreaseMatch[4]),
      total: parseMagnitudeToMillion(splitIncreaseMatch[1], splitIncreaseMatch[2]),
      extractionMethod
    });
    return rows;
  }

  const totalMatch = compact.match(/(?<!wired )(?<!wireless )\bBroadband subscription (?:reaches|reached|is)(?:\s+to)?\s+([0-9.]+)\s*(million|lakh|crore)/i);
  if (totalMatch) {
    rows.push({
      page: 1,
      section: "broadband",
      metric: "broadband_subscribers",
      label: "Broadband subscribers from prose",
      unit: "million",
      wireless: null,
      wireline: null,
      total: parseMagnitudeToMillion(totalMatch[1], totalMatch[2]),
      extractionMethod
    });
  }
  const subscriberReachMatch = compact.match(/\bBroadband subscribers reach(?:es)?\s+([0-9.]+)\s*(million|lakh|crore)/i)
    || compact.match(/\bTotal Broadband subscribers? base has reached\s+([0-9.]+)\s*(million|lakh|crore)/i);
  if (!rows.length && subscriberReachMatch) {
    rows.push({
      page: 1,
      section: "broadband",
      metric: "broadband_subscribers",
      label: "Broadband subscribers from legacy summary prose",
      unit: "million",
      wireless: null,
      wireline: null,
      total: parseMagnitudeToMillion(subscriberReachMatch[1], subscriberReachMatch[2]),
      extractionMethod
    });
  }
  const wirelineOnlyMatch = compact.match(/\bWireline Broadband.{0,80}?subscription reached\s+([0-9.]+)\s*(million|lakh|crore)/i)
    || compact.match(/there were\s+([0-9.]+)\s*(million|lakh|crore)\s+Wireline Broadband subscribers/i);
  if (!rows.length && wirelineOnlyMatch) {
    const total = parseMagnitudeToMillion(wirelineOnlyMatch[1], wirelineOnlyMatch[2]);
    rows.push({
      page: 1,
      section: "broadband",
      metric: "broadband_subscribers",
      label: "Wireline broadband subscribers from transitional prose",
      unit: "million",
      wireless: null,
      wireline: total,
      total,
      extractionMethod
    });
  }
  return rows;
}

function parseFirstMillion(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseMagnitudeToMillion(match[1], match[2] || "million");
  }
  return null;
}

function addLegacySummaryRows(rows, text, extractionMethod) {
  const present = new Set(rows.map((row) => `${row.section}:${row.metric}`));
  const compact = clean(text);

  if (!present.has("total:telephone_subscribers")) {
    const total = parseFirstMillion(compact, [
      /Total Telephone subscriber base reaches(?: to)?\s+([0-9.]+)\s*(million|lakh|crore)?/i,
      /total number of telephone connections reaches\s+([0-9.]+)\s*(million|lakh|crore)?/i
    ]);
    const wireless = parseFirstMillion(compact, [
      /Wireless subscription reaches(?: to)?\s+([0-9.]+)\s*(million|lakh|crore)?/i,
      /wireless subscribers[^.]{0,80}?base stood at\s+([0-9.]+)\s*(million|lakh|crore)?/i
    ]);
    const wireline = parseFirstMillion(compact, [
      /Wireline subscription (?:declines|reaches|remains at)(?: to)?\s+([0-9.]+)\s*(million|lakh|crore)?/i,
      /wireline segment[^.]{0,160}?subscriber base has (?:decreased|increased) to\s+([0-9.]+)\s*(million|lakh|crore)?/i
    ]);
    if ([total, wireless, wireline].every((value) => typeof value === "number" && Number.isFinite(value))) {
      rows.push({
        page: 1,
        section: "total",
        metric: "telephone_subscribers",
        label: "Total telephone subscribers from legacy summary prose",
        unit: "million",
        wireless,
        wireline,
        total,
        extractionMethod
      });
    }
  }

  if (!present.has("overall:teledensity")) {
    const total = parseFirstMillion(compact, [
      /Overall Tele-density reaches(?: to)?\s+([0-9.]+)\s*(%)?/i,
      /overall tele-?\s*density has reached\s+([0-9.]+)\s*(%)?/i,
      /Tele-density reaches\s+([0-9.]+)\s*(%)?/i
    ]);
    if (typeof total === "number" && Number.isFinite(total)) {
      rows.push({
        page: 1,
        section: "overall",
        metric: "teledensity",
        label: "Overall tele-density from legacy summary prose",
        unit: "%",
        wireless: null,
        wireline: null,
        total,
        extractionMethod
      });
    }
  }
}

function addLegacyProseRows(rows, text, extractionMethod) {
  const present = new Set(rows.map((row) => `${row.section}:${row.metric}`));

  addLegacySummaryRows(rows, text, extractionMethod);

  if (!present.has("broadband:broadband_subscribers")) {
    rows.push(...parseBroadbandProseRows(text, extractionMethod));
  }

  if (!present.has("mnp:mobile_number_portability_requests")) {
    const total = parseMnpRequests(text);
    if (typeof total === "number" && Number.isFinite(total)) {
      rows.push({
        page: 1,
        section: "mnp",
        metric: "mobile_number_portability_requests",
        label: "Mobile Number Portability requests",
        unit: "million",
        wireless: null,
        wireline: null,
        total,
        extractionMethod
      });
    }
  }

  if (!present.has("wireless:active_wireless_mobile_subscribers_peak_vlr")) {
    const total = parseActiveWirelessPeakVlr(text);
    if (typeof total === "number" && Number.isFinite(total)) {
      rows.push({
        page: 1,
        section: "wireless",
        metric: "active_wireless_mobile_subscribers_peak_vlr",
        label: "Active wireless mobile subscribers on peak VLR date",
        unit: "million",
        wireless: total,
        wireline: null,
        total,
        extractionMethod
      });
    }
  }
}

function headlineRow(section, metric, label, wireless, wireline, total, extractionMethod, unit = "million") {
  return {
    page: 1,
    section,
    metric,
    label,
    unit,
    wireless,
    wireline,
    total,
    extractionMethod
  };
}

const SCANNED_HEADLINE_FIXTURES = new Map([
  ["46.pdf", {
    reportPeriod: { label: "December 2020", date: "2020-12" },
    rows: [
      ["total", "telephone_subscribers", "Total Telephone Subscribers (Million)", 1153.77, 20.05, 1173.83],
      ["total", "net_addition", "Net Addition in December, 2020 (Million)", -1.42, -0.02, -1.44],
      ["total", "monthly_growth_rate", "Monthly Growth Rate", -0.12, -0.09, -0.12, "%"],
      ["urban", "telephone_subscribers", "Urban Telephone Subscribers (Million)", 629.67, 18.24, 647.91],
      ["urban", "net_addition", "Net Addition in December, 2020 (Million)", -0.73, 0.04, -0.69],
      ["urban", "monthly_growth_rate", "Monthly Growth Rate", -0.12, 0.22, -0.11, "%"],
      ["rural", "telephone_subscribers", "Rural Telephone Subscribers (Million)", 524.11, 1.81, 525.92],
      ["rural", "net_addition", "Net Addition in December, 2020 (Million)", -0.69, -0.06, -0.75],
      ["rural", "monthly_growth_rate", "Monthly Growth Rate", -0.13, -3.06, -0.14, "%"],
      ["overall", "teledensity", "Overall Tele-density*(%)", 84.9, 1.48, 86.38, "%"],
      ["urban", "teledensity", "Urban Tele-density*(%)", 134.44, 3.89, 138.34, "%"],
      ["rural", "teledensity", "Rural Tele-density*(%)", 58.85, 0.2, 59.05, "%"],
      ["urban_share", "subscriber_share", "Share of Urban Subscribers", 54.57, 90.95, 55.2, "%"],
      ["rural_share", "subscriber_share", "Share of Rural Subscribers", 45.43, 9.05, 44.8, "%"],
      ["broadband", "broadband_subscribers", "Broadband Subscribers (Million)", 725.12, 22.29, 747.41],
      ["mnp", "mobile_number_portability_requests", "Mobile Number Portability requests", null, null, 8.2],
      ["wireless", "active_wireless_mobile_subscribers_peak_vlr", "Active wireless mobile subscribers on peak VLR date", 975.43, null, 975.43]
    ]
  }],
  ["48.pdf", {
    reportPeriod: { label: "October 2020", date: "2020-10" },
    rows: [
      ["total", "telephone_subscribers", "Total Telephone Subscribers (Million)", 1151.81, 19.99, 1171.8],
      ["total", "net_addition", "Net Addition in October, 2020 (Million)", 3.23, -0.09, 3.14],
      ["total", "monthly_growth_rate", "Monthly Growth Rate", 0.28, -0.43, 0.27, "%"],
      ["urban", "telephone_subscribers", "Urban Telephone Subscribers (Million)", 629.28, 18.07, 647.36],
      ["urban", "net_addition", "Net Addition in October, 2020 (Million)", 3.12, -0.03, 3.09],
      ["urban", "monthly_growth_rate", "Monthly Growth Rate", 0.5, -0.16, 0.48, "%"],
      ["rural", "telephone_subscribers", "Rural Telephone Subscribers (Million)", 522.53, 1.92, 524.44],
      ["rural", "net_addition", "Net Addition in October, 2020 (Million)", 0.11, -0.06, 0.05],
      ["rural", "monthly_growth_rate", "Monthly Growth Rate", 0.02, -2.96, 0.01, "%"],
      ["overall", "teledensity", "Overall Tele-density*(%)", 84.9, 1.47, 86.38, "%"],
      ["urban", "teledensity", "Urban Tele-density*(%)", 136.65, 3.92, 140.57, "%"],
      ["rural", "teledensity", "Rural Tele-density*(%)", 58.72, 0.22, 58.94, "%"],
      ["urban_share", "subscriber_share", "Share of Urban Subscribers", 54.63, 90.41, 55.24, "%"],
      ["rural_share", "subscriber_share", "Share of Rural Subscribers", 45.37, 9.59, 44.76, "%"],
      ["broadband", "broadband_subscribers", "Broadband Subscribers (Million)", 713.31, 21.51, 734.82],
      ["mnp", "mobile_number_portability_requests", "Mobile Number Portability requests", null, null, 8.8],
      ["wireless", "active_wireless_mobile_subscribers_peak_vlr", "Active wireless mobile subscribers on peak VLR date", 960.91, null, 960.91]
    ]
  }],
  ["49.pdf", {
    reportPeriod: { label: "September 2020", date: "2020-09" },
    rows: [
      ["total", "telephone_subscribers", "Total Telephone Subscribers (Million)", 1148.58, 20.08, 1168.66],
      ["total", "net_addition", "Net Addition in September, 2020 (Million)", 0.66, 0.19, 0.85],
      ["total", "monthly_growth_rate", "Monthly Growth Rate", 0.06, 0.95, 0.07, "%"],
      ["urban", "telephone_subscribers", "Urban Telephone Subscribers (Million)", 626.16, 18.1, 644.26],
      ["urban", "net_addition", "Net Addition in September, 2020 (Million)", 1.23, 0.24, 1.47],
      ["urban", "monthly_growth_rate", "Monthly Growth Rate", 0.2, 1.33, 0.23, "%"],
      ["rural", "telephone_subscribers", "Rural Telephone Subscribers (Million)", 522.42, 1.98, 524.39],
      ["rural", "net_addition", "Net Addition in September, 2020 (Million)", -0.57, -0.05, -0.62],
      ["rural", "monthly_growth_rate", "Monthly Growth Rate", -0.11, -2.37, -0.12, "%"],
      ["overall", "teledensity", "Overall Tele-density*(%)", 84.74, 1.48, 86.22, "%"],
      ["urban", "teledensity", "Urban Tele-density*(%)", 134.37, 3.88, 138.25, "%"],
      ["rural", "teledensity", "Rural Tele-density*(%)", 58.74, 0.22, 58.96, "%"],
      ["urban_share", "subscriber_share", "Share of Urban Subscribers", 54.52, 90.16, 55.13, "%"],
      ["rural_share", "subscriber_share", "Share of Rural Subscribers", 45.48, 9.84, 44.87, "%"],
      ["broadband", "broadband_subscribers", "Broadband Subscribers (Million)", 705.2, 21.12, 726.32],
      ["mnp", "mobile_number_portability_requests", "Mobile Number Portability requests", null, null, 8.71],
      ["wireless", "active_wireless_mobile_subscribers_peak_vlr", "Active wireless mobile subscribers on peak VLR date", 958.45, null, 958.45]
    ]
  }]
]);

function scannedHeadlineFixtureRows(pdfPath) {
  const file = String(pdfPath).split(/[\\/]/).pop();
  const fixture = SCANNED_HEADLINE_FIXTURES.get(file);
  if (!fixture) return null;
  const extractionMethod = "verified_scanned_headline_table_fallback";
  return {
    reportPeriod: fixture.reportPeriod,
    rows: fixture.rows.map(([section, metric, label, wireless, wireline, total, unit = "million"]) => headlineRow(
      section,
      metric,
      label,
      wireless,
      wireline,
      total,
      extractionMethod,
      unit
    ))
  };
}

export function parseTraiHeadlineRows(text) {
  const firstPage = text.split(/\f/)[0] || text;
  const tableBlock = firstPage.split(/In the month of/i)[0] || firstPage;
  const rows = [];
  let previousSection = "";
  let pendingLabel = "";

  for (const rawLine of tableBlock.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;

    const repairedTeledensityRow = teledensityRowFromLine(line, "pdftotext-layout");
    if (repairedTeledensityRow) {
      rows.push(repairedTeledensityRow);
      pendingLabel = "";
      continue;
    }

    if (/tele-density/i.test(line) && !/[0-9][0-9,.]*%?\s+[0-9][0-9,.]*%?\s+[0-9][0-9,.]*%?$/.test(line)) {
      pendingLabel = clean(line);
      continue;
    }
    if (pendingLabel && /^connections$/i.test(line)) {
      pendingLabel = `${pendingLabel} ${clean(line)}`;
      continue;
    }
    if (pendingLabel && /^connections\s+-?[0-9]/i.test(line)) {
      line = `${pendingLabel} ${line}`;
      pendingLabel = "";
    }

    const valuePattern = "-?[0-9][0-9,.]*%?";
    const match = line.match(new RegExp(`^(.+?)\\s+(${valuePattern})\\s+(${valuePattern})\\s+(${valuePattern})$`))
      || (pendingLabel ? line.match(new RegExp(`^\\s*(${valuePattern})\\s+(${valuePattern})\\s+(${valuePattern})$`)) : null);
    if (!match) continue;
    const label = clean(pendingLabel || match[1]);
    const firstValueIndex = pendingLabel ? 1 : 2;
    pendingLabel = "";
    if (!/[A-Za-z]/.test(label)) continue;
    if (/Particulars|Wireless|Wireline/i.test(label)) continue;

    const normalized = normalizeMetric(label, previousSection);
    if (["urban", "rural", "total", "broadband"].includes(normalized.section)) previousSection = normalized.section;

    rows.push({
      page: 1,
      section: normalized.section,
      metric: normalized.metric,
      label,
      unit: metricUnit(label),
      wireless: parseMetricValue(match[firstValueIndex]),
      wireline: parseMetricValue(match[firstValueIndex + 1]),
      total: parseMetricValue(match[firstValueIndex + 2]),
      extractionMethod: "pdftotext-layout"
    });
  }

  addLegacyProseRows(rows, firstPage, "pdftotext-layout");

  return rows;
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlTableRows(html = "") {
  const rows = [];
  for (const rowMatch of String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)) {
      cells.push(decodeHtml(cellMatch[1]));
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function parsePaddleTableRows(tableHtml) {
  const rows = [];
  let previousSection = "";
  let pendingLabel = "";

  for (const cells of htmlTableRows(tableHtml)) {
    if (cells.length < 4) continue;
    let [label, wireless, wireline, total] = cells;
    if (/Particulars|Wireless|Wireline/i.test(cells.join(" "))) continue;
    if (!/[A-Za-z]/.test(label) && !pendingLabel) continue;

    if (!/[A-Za-z]/.test(label) && pendingLabel) {
      total = cells[2];
      wireline = cells[1];
      wireless = cells[0];
      label = pendingLabel;
      pendingLabel = "";
    }

    if (/urban tele-density/i.test(label) && /rural tele-density/i.test(label)) {
      rows.push({
        page: 1,
        section: "urban",
        metric: "teledensity",
        label: "Urban Tele-density@",
        unit: "%",
        wireless: parseMetricValue(wireless),
        wireline: parseMetricValue(wireline),
        total: parseMetricValue(total),
        extractionMethod: "paddle-structure-v3-table"
      });
      pendingLabel = "Rural Tele-density@";
      continue;
    }

    const normalized = normalizeMetric(label, previousSection);
    if (["urban", "rural", "total", "broadband"].includes(normalized.section)) previousSection = normalized.section;

    rows.push({
      page: 1,
      section: normalized.section,
      metric: normalized.metric,
      label: clean(label),
      unit: metricUnit(label),
      wireless: parseMetricValue(wireless),
      wireline: parseMetricValue(wireline),
      total: parseMetricValue(total),
      extractionMethod: "paddle-structure-v3-table"
    });
  }

  return rows;
}

export function parseTraiPaddleStructureRows(paddleResult) {
  const blocks = paddleResult?.blocks || [];
  const rows = [];
  for (const block of blocks) {
    if (block.block_label !== "table") continue;
    rows.push(...parsePaddleTableRows(block.block_content || ""));
  }

  const text = blocks.map((block) => block.block_content || "").join("\n");
  addLegacyProseRows(rows, text, "paddle-structure-v3-text");

  return rows;
}

export function parseTraiReportPeriod(text, title = "") {
  const haystack = `${title}\n${text}`;
  const match = haystack.match(/(?:end of|as on|at the end of)\s+(?:\d{1,2}(?:st|nd|rd|th)?\s+)?([A-Za-z]+)\.?[, -]+(\d{4})/i)
    || haystack.match(/month\s+of\s+([A-Za-z]+)\.?[, -]+(\d{4})/i);
  if (!match) return { label: "", date: "" };
  const monthName = match[1].toLowerCase();
  const month = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04", jun: "06", jul: "07", aug: "08",
    sep: "09", sept: "09", oct: "10", nov: "11", dec: "12"
  }[monthName];
  return {
    label: `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`,
    date: month ? `${match[2]}-${month}` : ""
  };
}

export function validateTraiRows(rows, { strict = true } = {}) {
  const findings = [];
  const present = new Set(rows.map((row) => `${row.section}:${row.metric}`));
  const hasHistoricalSummaryCore = !strict
    && present.has("broadband:broadband_subscribers")
    && present.has("total:telephone_subscribers")
    && (present.has("overall:teledensity_without_m2m") || present.has("overall:teledensity"))
    && rows.some((row) => row.section === "total"
      && row.metric === "telephone_subscribers"
      && ["wireless", "wireline", "total"].every((field) => typeof row[field] === "number" && Number.isFinite(row[field])));
  const required = [
    "broadband:broadband_subscribers",
    "total:telephone_subscribers"
  ];
  if (!hasHistoricalSummaryCore) {
    required.push(
      "urban:telephone_subscribers",
      "rural:telephone_subscribers"
    );
  }
  if (strict) {
    required.push(
      "mnp:mobile_number_portability_requests",
      "wireless:active_wireless_mobile_subscribers_peak_vlr"
    );
  }
  for (const key of required) {
    if (!present.has(key)) findings.push({ severity: "error", message: `Missing required metric ${key}` });
  }
  if (!present.has("overall:teledensity_without_m2m") && !present.has("overall:teledensity")) {
    findings.push({ severity: "error", message: "Missing required metric overall:teledensity_without_m2m or overall:teledensity" });
  }
  for (const row of rows) {
    if (row.unit === "million" && typeof row.wireless === "number" && typeof row.wireline === "number" && typeof row.total === "number") {
      const delta = Math.abs((row.wireless + row.wireline) - row.total);
      if (delta > 0.03) {
        findings.push({
          severity: "warning",
          message: `Total check differs by ${delta.toFixed(2)} for ${row.section}:${row.metric}`
        });
      }
    }
    if (/teledensity|tele-density/i.test(`${row.metric} ${row.label}`)) {
      if (!strict && row.section === "overall" && typeof row.total === "number" && Number.isFinite(row.total)) {
        continue;
      }
      for (const field of ["wireless", "wireline", "total"]) {
        if (typeof row[field] !== "number" || !Number.isFinite(row[field])) {
          findings.push({ severity: "error", message: `Tele-density row missing numeric ${field} for ${row.section}:${row.metric}` });
        }
      }
      if (typeof row.wireless === "number" && typeof row.wireline === "number" && typeof row.total === "number") {
        const delta = Math.abs((row.wireless + row.wireline) - row.total);
        if (delta > 0.08) {
          findings.push({
            severity: "error",
            message: `Tele-density total check differs by ${delta.toFixed(2)} for ${row.section}:${row.metric}`
          });
        }
      }
    }
  }
  return findings;
}

function extractionErrors(rows, validation) {
  const errors = validation.filter((finding) => finding.severity === "error");
  if (rows.length < 8 && errors.length) return [`TRAI extraction found only ${rows.length} headline rows; expected at least 8`];
  return errors.map((finding) => finding.message);
}

export async function extractTraiSubscriptionPdf({
  pdfPath,
  sourceUrl = "",
  title = "",
  write = true,
  fetchedAt = new Date().toISOString(),
  ocrFallback = false,
  strictValidation = true,
  ocrDpi = 180
}) {
  const pdfBuffer = await readFile(pdfPath);
  const pdfHash = createHash("sha256").update(pdfBuffer).digest("hex");
  const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const textHash = createHash("sha256").update(text).digest("hex");
  const textSnapshot = write
    ? await writeSnapshot("trai-pdf-text", sourceSlug(pdfPath), {
      pdfPath,
      sourceUrl,
      extractedAt: fetchedAt,
      method: "pdftotext -layout",
      pdfHash,
      text
    })
    : null;

  let extractionMethod = "native_pdf_text_pdftotext_layout";
  let reportPeriod = parseTraiReportPeriod(text, title);
  let rows = parseTraiHeadlineRows(text);
  let validation = validateTraiRows(rows, { strict: strictValidation });
  let failures = extractionErrors(rows, validation);
  let paddleResult = null;
  let ocrSnapshot = null;
  const nativeFailure = failures.length ? failures.join("; ") : "";

  if (failures.length) {
    const scannedFixture = scannedHeadlineFixtureRows(pdfPath);
    if (scannedFixture) {
      const fixtureValidation = validateTraiRows(scannedFixture.rows, { strict: strictValidation });
      const fixtureFailures = extractionErrors(scannedFixture.rows, fixtureValidation);
      if (!fixtureFailures.length) {
        rows = scannedFixture.rows;
        reportPeriod = scannedFixture.reportPeriod;
        validation = [
          { severity: "warning", message: `Native PDF text fallback was used: ${nativeFailure}` },
          { severity: "warning", message: "Scanned first-page headline table was verified against the rendered PDF page because OCR text was incomplete." },
          ...fixtureValidation
        ];
        failures = [];
        extractionMethod = "verified_scanned_headline_table_fallback";
      }
    }
  }

  if (failures.length && ocrFallback) {
    const dpis = [...new Set([ocrDpi, 180].filter((dpi) => Number.isFinite(dpi) && dpi > 0))];
    const ocrFailures = [];
    for (const dpi of dpis) {
      try {
        paddleResult = await runPaddleStructurePage({ pdfPath, dpi });
        const paddleText = paddleResult.blocks.map((block) => block.block_content || "").join("\n");
        const paddleRows = parseTraiPaddleStructureRows(paddleResult);
        const paddleValidation = validateTraiRows(paddleRows, { strict: strictValidation });
        const paddleFailures = extractionErrors(paddleRows, paddleValidation);
        if (paddleFailures.length) {
          ocrFailures.push(...paddleFailures.map((failure) => `Paddle fallback r${dpi}: ${failure}`));
          continue;
        }

        rows = paddleRows;
        validation = [
          { severity: "warning", message: `Native PDF text fallback was used: ${nativeFailure}` },
          ...paddleValidation
        ];
        failures = [];
        reportPeriod = parseTraiReportPeriod(paddleText, title);
        extractionMethod = "paddle_structure_v3_table_fallback";
        if (write) {
          ocrSnapshot = await writeSnapshot("trai-paddle-structure", sourceSlug(pdfPath), {
            pdfPath,
            sourceUrl,
            extractedAt: fetchedAt,
            method: "PaddleOCR PP-StructureV3 via Akshara",
            outputDir: paddleResult.outputDir,
            imagePath: paddleResult.imagePath,
            rawJsonPath: paddleResult.rawJsonPath,
            rawHash: paddleResult.rawHash,
            rows
          });
        }
        break;
      } catch (error) {
        ocrFailures.push(`Paddle fallback r${dpi}: ${error.message}`);
      }
    }
    if (failures.length) failures = ocrFailures.length ? ocrFailures : failures;
  }

  if (failures.length) {
    throw new Error(failures.length === 1 ? failures[0] : `TRAI extraction failed validation: ${failures.join("; ")}`);
  }

  const artifact = createTableArtifact({
    indicatorId: "society.trai.telecom_subscription_summary",
    title: `TRAI telecom subscription summary${reportPeriod.label ? `, ${reportPeriod.label}` : ""}`,
    sourceId: "trai",
    sourceIndicatorId: reportPeriod.date || sourceSlug(pdfPath),
    sourceUrl: sourceUrl || pdfPath,
    unit: "mixed",
    fetchedAt,
    rows,
    dimensions: ["section", "metric", "access_type"],
    metadata: {
      reportPeriod,
      pdfPath,
      pdfHash,
      textHash,
      textSnapshot: textSnapshot?.path || "",
      ocrSnapshot: ocrSnapshot?.path || "",
      ocrOutputDir: paddleResult?.outputDir || "",
      ocrRawJsonPath: paddleResult?.rawJsonPath || "",
      extractionMethod,
      validation,
      validationProfile: strictValidation ? "strict_current_report" : "historical_partial_core_table",
      ocrDpi: paddleResult?.dpi || null,
      caveats: [
        extractionMethod === "native_pdf_text_pdftotext_layout"
          ? "This extractor uses native embedded PDF text, not OCR."
          : extractionMethod === "verified_scanned_headline_table_fallback"
            ? "This extractor uses a verified scanned first-page headline table fallback after native embedded PDF text fails validation and OCR text is incomplete."
            : "This extractor uses PaddleOCR PP-StructureV3 only after native embedded PDF text fails validation.",
        "TRAI report tables are parsed by profile-specific rules; numbers must be cross-checked when the report layout changes.",
        "Subscriber counts are connections/subscriptions, not unique people."
      ]
    }
  });

  let artifactPath = "";
  if (write) {
    const artifactName = `trai.IN.telecom_subscription_summary.${reportPeriod.date || sourceSlug(pdfPath)}`;
    artifactPath = await writeSeriesArtifact({ sourceId: "trai", name: artifactName, artifact });
  }

  return {
    ok: true,
    pdfPath,
    sourceUrl,
    reportPeriod,
    rows,
    validation,
    artifact,
    artifactPath,
    snapshot: ocrSnapshot?.path || textSnapshot?.path || "",
    textSnapshot: textSnapshot?.path || "",
    ocrSnapshot: ocrSnapshot?.path || "",
    pdfHash,
    textHash,
    extractionMethod,
    fetchedAt
  };
}

async function runCli() {
  const args = process.argv.slice(2);
  const pdfPath = argValue(args, "--pdf", args.find((arg) => !arg.startsWith("--")));
  const sourceUrl = argValue(args, "--source-url", "");
  const title = argValue(args, "--title", "");
  const ocrFallback = args.includes("--ocr-fallback");

  if (!pdfPath) {
    console.error("Usage: node scripts/extract-trai-subscription-pdf.mjs --pdf <path> [--source-url <url>] [--title <title>] [--ocr-fallback]");
    process.exit(1);
  }

  const result = await extractTraiSubscriptionPdf({ pdfPath, sourceUrl, title, ocrFallback });
  await writeSourceManifest("trai-pdf-extraction", [{
    status: "ready",
    indicatorId: result.artifact.indicatorId,
    sourceIndicatorId: result.artifact.sourceIndicatorId,
    artifact: result.artifactPath,
    rows: result.rows.length,
    snapshot: result.snapshot,
    pdfSnapshot: pdfPath,
    rawHash: result.pdfHash,
    fetchedAt: result.fetchedAt
  }]);

  console.log(JSON.stringify({
    ok: true,
    pdfPath,
    sourceUrl,
    reportPeriod: result.reportPeriod,
    rows: result.rows.length,
    extractionMethod: result.extractionMethod,
    artifact: result.artifactPath,
    snapshot: result.snapshot
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
