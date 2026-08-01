import { loadEnv } from "../env.mjs";
import { buildUrl, timeoutSignal } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.TRADESTAT_BASE_URL || "https://tradestat.commerce.gov.in";

function textFromHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function numberOrNull(value) {
  const text = textFromHtml(value).replaceAll(",", "");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractToken(html) {
  const match = String(html).match(/name=["']_token["']\s+value=["']([^"']+)["']/i);
  if (!match) throw new Error("TradeStat CSRF token not found");
  return match[1];
}

function extractCookie(headers) {
  const cookies = headers.getSetCookie ? headers.getSetCookie() : [];
  const fallback = headers.get("set-cookie");
  return (cookies.length ? cookies : fallback ? [fallback] : [])
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

function extractTableRows(html) {
  const table = String(html).match(/<table[^>]+id=["']example1["'][\s\S]*?<\/table>/i)?.[0];
  if (!table) return [];
  const tbody = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] || table;
  const rows = [];
  for (const rowMatch of tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => textFromHtml(match[1]));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

export function parseCommodityAllCountriesImport(html, { hsCode, fiscalYear, report = "2" } = {}) {
  const commodityText = textFromHtml(String(html).match(/Commodity:\s*[\s\S]*?<\/p>/i)?.[0] || "");
  const rows = extractTableRows(html)
    .map((cells) => ({
      serial: numberOrNull(cells[0]),
      country: cells[1] || "",
      valuePreviousUsdMillion: numberOrNull(cells[2]),
      valueCurrentUsdMillion: numberOrNull(cells[3]),
      valueGrowthPct: numberOrNull(cells[4]),
      quantityPrevious: numberOrNull(cells[5]),
      quantityCurrent: numberOrNull(cells[6]),
      quantityGrowthPct: numberOrNull(cells[7])
    }))
    .filter((row) => row.country);
  return {
    hsCode,
    fiscalYear,
    report,
    commodityText,
    rows
  };
}

export async function fetchTradeStatCommodityAllCountriesImport({ hsCode, fiscalYear = "2025", report = "2" }) {
  const path = "/eidb/commodity_wise_all_countries_import";
  const url = buildUrl(baseUrl, path);
  const getResponse = await fetch(url, {
    signal: timeoutSignal(Number(process.env.TRADESTAT_FETCH_TIMEOUT_MS || 90000)),
    headers: {
      accept: "text/html",
      "user-agent": "Indica/0.1 data ingest"
    }
  });
  if (!getResponse.ok) throw new Error(`TradeStat form fetch failed ${getResponse.status} ${getResponse.statusText}`);
  const formHtml = await getResponse.text();
  const token = extractToken(formHtml);
  const cookie = extractCookie(getResponse.headers);
  const body = new URLSearchParams({
    _token: token,
    Eidbhscode_cmaci: String(hsCode),
    EidbYear_cmaci: String(fiscalYear),
    EidbReport_cmaci: String(report)
  });
  const postResponse = await fetch(url, {
    method: "POST",
    signal: timeoutSignal(Number(process.env.TRADESTAT_FETCH_TIMEOUT_MS || 90000)),
    headers: {
      accept: "text/html",
      "content-type": "application/x-www-form-urlencoded",
      referer: url.toString(),
      "user-agent": "Indica/0.1 data ingest",
      ...(cookie ? { cookie } : {})
    },
    body
  });
  if (!postResponse.ok) throw new Error(`TradeStat query failed ${postResponse.status} ${postResponse.statusText}`);
  const html = await postResponse.text();
  return {
    html,
    parsed: parseCommodityAllCountriesImport(html, { hsCode, fiscalYear, report })
  };
}
