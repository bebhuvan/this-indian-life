import { buildUrl, timeoutSignal } from "../lib/source-http.mjs";

const baseUrl = process.env.TRAI_BASE_URL || "https://www.trai.gov.in";

function textFromHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteTraiUrl(path) {
  return new URL(path, baseUrl).toString();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    signal: timeoutSignal(options.timeoutMs || 60000),
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml",
      "user-agent": "Indica/0.1 data discovery",
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`TRAI fetch failed ${response.status}: ${url}`);
  return response.text();
}

export function traiUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchTraiTelecomSubscriptionReportsPage(page = 0) {
  const params = page ? { page } : {};
  return fetchText(traiUrl("/release-publication/reports/telecom-subscriptions-reports", params));
}

export function parseTraiTelecomSubscriptionReports(html) {
  const reports = [];
  const seen = new Set();
  const itemRegex = /<li><div class="views-field views-field-counter">[\s\S]*?<\/li>/g;
  for (const match of html.matchAll(itemRegex)) {
    const item = match[0];
    const title = textFromHtml(item.match(/views-field-title"><div class="field-content">([\s\S]*?)<\/div>/i)?.[1] || "");
    const releaseDate = textFromHtml(item.match(/views-field-field-date"><div class="field-content">([\s\S]*?)<\/div>/i)?.[1] || "");
    const href = item.match(/href="([^"]+\.pdf)"/i)?.[1];
    const size = textFromHtml(item.match(/Download\(([^)]+)\)/i)?.[1] || item.match(/Download PDF[^"]*-\s*\(([^)]+)\)/i)?.[1] || "");
    const nodeUrl = item.match(/data-a2a-url="([^"]+)"/i)?.[1];
    if (title && href) {
      const pdfUrl = absoluteTraiUrl(href);
      if (seen.has(pdfUrl)) continue;
      seen.add(pdfUrl);
      reports.push({
        title,
        releaseDate,
        pdfUrl,
        size,
        nodeUrl: nodeUrl || ""
      });
    }
  }

  if (!reports.length) {
    for (const match of html.matchAll(/<div class="views-field views-field-title"><div class="field-content">([\s\S]*?)<\/div>[\s\S]*?<div class="views-field views-field-field-date"><div class="field-content">([\s\S]*?)<\/div>[\s\S]*?href="([^"]+\.pdf)"/g)) {
      const pdfUrl = absoluteTraiUrl(match[3]);
      if (seen.has(pdfUrl)) continue;
      seen.add(pdfUrl);
      reports.push({
        title: textFromHtml(match[1]),
        releaseDate: textFromHtml(match[2]),
        pdfUrl,
        size: "",
        nodeUrl: ""
      });
    }
  }

  const lastPageMatches = [...html.matchAll(/data-page="(\d+)"/g)].map((item) => Number(item[1])).filter(Number.isFinite);
  return {
    lastPage: lastPageMatches.length ? Math.max(...lastPageMatches) : undefined,
    reports
  };
}

export async function discoverTraiTelecomSubscriptionReports({ maxPages = 2 } = {}) {
  const firstHtml = await fetchTraiTelecomSubscriptionReportsPage(0);
  const first = parseTraiTelecomSubscriptionReports(firstHtml);
  const pageCount = Math.min(maxPages, (first.lastPage ?? maxPages - 1) + 1);
  const reports = [...first.reports];
  for (let page = 1; page < pageCount; page += 1) {
    const html = await fetchTraiTelecomSubscriptionReportsPage(page);
    reports.push(...parseTraiTelecomSubscriptionReports(html).reports);
  }
  const byPdf = new Map();
  for (const report of reports) byPdf.set(report.pdfUrl, report);
  return {
    pagesDiscovered: pageCount,
    reports: [...byPdf.values()]
  };
}
