import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson, requireEnv } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.EIA_BASE_URL || "https://api.eia.gov/v2";

function withKey(params = {}) {
  return { ...params, api_key: requireEnv("EIA_API_KEY") };
}

export function eiaUrl(path, params = {}) {
  return buildUrl(baseUrl, path, withKey(params));
}

export async function fetchEiaInternationalSeries({
  frequency = "annual",
  countryRegionId = "IND",
  productId,
  activityId,
  unit,
  length = 5000
}) {
  return fetchJson(eiaUrl("/international/data/", {
    frequency,
    "data[0]": "value",
    "facets[countryRegionId][]": countryRegionId,
    "facets[productId][]": productId,
    "facets[activityId][]": activityId,
    "facets[unit][]": unit,
    length
  }), {
    timeoutMs: Number(process.env.EIA_FETCH_TIMEOUT_MS || 90000),
    retries: Number(process.env.EIA_FETCH_RETRIES || 3),
    retryDelayMs: Number(process.env.EIA_RETRY_DELAY_MS || 3000)
  });
}

