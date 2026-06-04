import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.UN_COMTRADE_BASE_URL || "https://comtradeapi.un.org";

export function unComtradeUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchUnComtradeAnnualCommodity({
  reporterCode = "699",
  partnerCode = "0",
  cmdCode,
  flowCode = "M",
  period,
  classificationCode = "HS"
}) {
  const endpoint = process.env.UN_COMTRADE_ENDPOINT || "public/v1/preview";
  const headers = process.env.UN_COMTRADE_API_KEY
    ? { "Ocp-Apim-Subscription-Key": process.env.UN_COMTRADE_API_KEY }
    : {};
  return fetchJson(unComtradeUrl(`/${endpoint}/C/A/${classificationCode}`, {
    reporterCode,
    partnerCode,
    cmdCode,
    flowCode,
    period,
    includeDesc: "true"
  }), {
    headers,
    timeoutMs: Number(process.env.UN_COMTRADE_FETCH_TIMEOUT_MS || 90000),
    retries: Number(process.env.UN_COMTRADE_FETCH_RETRIES || 2),
    retryDelayMs: Number(process.env.UN_COMTRADE_RETRY_DELAY_MS || 3000)
  });
}

/**
 * Fetch from the keyed subscription endpoint (data/v1/get), which removes the
 * 500-row cap of the public preview endpoint. Requires UN_COMTRADE_API_KEY.
 * Returns the parsed body ({ count, data: [...] }).
 */
export async function fetchUnComtradeData({
  reporterCode = "699",
  partnerCode = "0",
  cmdCode = "TOTAL",
  flowCode = "X",
  period,
  classificationCode = "HS",
  typeCode = "C",
  freqCode = "A",
  breakdownMode
}) {
  const key = process.env.UN_COMTRADE_API_KEY;
  if (!key) throw new Error("Missing UN_COMTRADE_API_KEY. Add it to .env.");
  return fetchJson(unComtradeUrl(`/data/v1/get/${typeCode}/${freqCode}/${classificationCode}`, {
    reporterCode,
    partnerCode,
    cmdCode,
    flowCode,
    period,
    breakdownMode,
    includeDesc: "true"
  }), {
    headers: { "Ocp-Apim-Subscription-Key": key },
    timeoutMs: Number(process.env.UN_COMTRADE_FETCH_TIMEOUT_MS || 90000),
    retries: Number(process.env.UN_COMTRADE_FETCH_RETRIES || 2),
    retryDelayMs: Number(process.env.UN_COMTRADE_RETRY_DELAY_MS || 3000)
  });
}

/**
 * Keep only the canonical aggregate rows: no second-partner, customs, or
 * mode-of-transport breakdowns (which the API returns as extra duplicate rows).
 */
export function canonicalComtradeRows(rows) {
  return rows.filter(
    (r) =>
      (r.partner2Code === 0 || r.partner2Code == null) &&
      (r.motCode === 0 || r.motCode == null) &&
      (r.customsCode === "C00" || r.customsCode == null)
  );
}
