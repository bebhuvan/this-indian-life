import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const archiveBaseUrl = process.env.OPEN_METEO_ARCHIVE_BASE_URL || "https://archive-api.open-meteo.com";

export const defaultDailyVariables = [
  "temperature_2m_mean",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "apparent_temperature_max",
  "apparent_temperature_mean",
  "relative_humidity_2m_mean"
];

export function openMeteoArchiveUrl(params = {}) {
  const query = {
    ...params,
    daily: Array.isArray(params.daily) ? params.daily.join(",") : params.daily,
    apikey: process.env.OPEN_METEO_API_KEY || undefined
  };
  return buildUrl(archiveBaseUrl, "/v1/archive", query);
}

export async function fetchOpenMeteoHistoricalDaily({
  latitude,
  longitude,
  startDate,
  endDate,
  daily = defaultDailyVariables,
  timezone = "Asia/Kolkata",
  models = "era5",
  cellSelection = "land"
}) {
  return fetchJson(openMeteoArchiveUrl({
    latitude,
    longitude,
    start_date: startDate,
    end_date: endDate,
    daily,
    timezone,
    models,
    cell_selection: cellSelection
  }), {
    timeoutMs: Number(process.env.OPEN_METEO_FETCH_TIMEOUT_MS || 120000),
    retries: Number(process.env.OPEN_METEO_FETCH_RETRIES || 4),
    retryDelayMs: Number(process.env.OPEN_METEO_RETRY_DELAY_MS || 10000)
  });
}
