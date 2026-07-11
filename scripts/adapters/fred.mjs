// FRED (Federal Reserve Bank of St. Louis) adapter.
// Open JSON API: https://api.stlouisfed.org/fred — requires FRED_API_KEY in .env.
// Series of interest for the rupee article: EXINUS (INR/USD monthly, from 1973),
// DEXINUS (daily), CPIAUCSL (US CPI), INDCPIALLMINMEI (India CPI), EXUSUK (USD/GBP).
import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson, requireEnv } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.FRED_BASE_URL || "https://api.stlouisfed.org/fred";

function withKey(params = {}) {
  return { ...params, api_key: requireEnv("FRED_API_KEY"), file_type: "json" };
}

export function fredUrl(path, params = {}) {
  return buildUrl(baseUrl, path, withKey(params));
}

const fetchOpts = () => ({
  timeoutMs: Number(process.env.FRED_FETCH_TIMEOUT_MS || 60000),
  retries: Number(process.env.FRED_FETCH_RETRIES || 3),
  retryDelayMs: Number(process.env.FRED_RETRY_DELAY_MS || 3000)
});

// Returns the FRED series metadata object (title, frequency, units, observation range).
export async function fetchFredSeriesMeta(seriesId) {
  const data = await fetchJson(fredUrl("/series", { series_id: seriesId }), fetchOpts());
  const meta = data?.seriess?.[0];
  if (!meta) throw new Error(`FRED: no metadata for series ${seriesId}`);
  return meta;
}

// Returns { meta, observations: [{ date, value|null }] }.
// FRED encodes missing values as ".", which we map to null. Dates are kept as
// the raw FRED period start (YYYY-MM-DD); callers can collapse to YYYY / YYYY-MM.
export async function fetchFredSeries(seriesId, { startDate, endDate, units } = {}) {
  const meta = await fetchFredSeriesMeta(seriesId);
  const data = await fetchJson(fredUrl("/series/observations", {
    series_id: seriesId,
    sort_order: "asc",
    observation_start: startDate,
    observation_end: endDate,
    units // e.g. "lin" (default), "pc1" (% change YoY)
  }), fetchOpts());
  const observations = (data?.observations || []).map((o) => ({
    date: o.date,
    value: o.value === "." || o.value == null ? null : Number(o.value)
  }));
  return { meta, observations };
}
