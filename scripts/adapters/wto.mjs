import { loadEnv } from "../env.mjs";
import { buildUrl, redactUrl, timeoutSignal } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.WTO_BASE_URL || "https://api.wto.org/timeseries/v1";

export function wtoUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The WTO Timeseries API advertises `charset=utf-8` but actually streams
// Windows-1252 bytes (en-dashes etc. in indicator/product names). Decoding as
// UTF-8 mojibakes those names, so we read raw bytes and decode as windows-1252.
const decoder = new TextDecoder("windows-1252");

async function fetchWtoJson(url, options = {}) {
  const {
    timeoutMs = Number(process.env.WTO_FETCH_TIMEOUT_MS || 90000),
    retries = Number(process.env.WTO_FETCH_RETRIES || 3),
    retryDelayMs = Number(process.env.WTO_RETRY_DELAY_MS || 3000),
    headers
  } = options;

  const key = process.env.WTO_API_KEY;
  if (!key) throw new Error("Missing WTO_API_KEY. Add it to .env.");

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: timeoutSignal(timeoutMs),
        headers: {
          accept: "application/json",
          "user-agent": "Indica/0.1 data ingest",
          "Ocp-Apim-Subscription-Key": key,
          ...headers
        }
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return JSON.parse(decoder.decode(buffer));
      }
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === retries) {
        throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${redactUrl(url)}`);
      }
    } catch (error) {
      if (attempt === retries || error.name === "AbortError" || error.message.startsWith("Fetch failed 4")) throw error;
    }
    await wait(retryDelayMs * (attempt + 1));
  }

  throw new Error(`Fetch failed after retries: ${redactUrl(url)}`);
}

/**
 * Fetch a WTO Timeseries data set. Returns { rows, raw } where rows is the
 * normalised Dataset array (each datapoint in `mode=full` form).
 *
 * @param {object} opts
 * @param {string} opts.i   Indicator code (required), e.g. "ITS_MTV_AX".
 * @param {string} [opts.r] Reporting economy code(s), e.g. "356" for India, "000" for World.
 * @param {string} [opts.p] Partner economy code(s).
 * @param {string} [opts.ps] Time period ("all", "default", "YYYY", "YYYY-YYYY", ...).
 * @param {string} [opts.pc] Product/sector code(s) ("default", "all", or csv codes).
 * @param {boolean} [opts.spc] Include sub products/sectors recursively.
 * @param {number} [opts.max] Max records (default 1_000_000 cap server-side).
 */
export async function fetchWtoData({
  i,
  r = "356",
  p,
  ps = "all",
  pc,
  spc,
  max = 100000,
  lang = 1
}) {
  if (!i) throw new Error("fetchWtoData requires an indicator code `i`.");
  const url = wtoUrl("data", {
    i,
    r,
    p,
    ps,
    pc,
    spc: spc === undefined ? undefined : String(spc),
    fmt: "json",
    mode: "full",
    head: "H",
    lang,
    max
  });
  const raw = await fetchWtoJson(url);
  const rows = Array.isArray(raw?.Dataset) ? raw.Dataset : Array.isArray(raw?.dataset) ? raw.dataset : [];
  return { rows, raw };
}

export async function fetchWtoIndicators({ lang = 1 } = {}) {
  return fetchWtoJson(wtoUrl("indicators", { lang }));
}
