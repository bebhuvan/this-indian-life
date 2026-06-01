import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson, requireEnv } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.WAQI_BASE_URL || "https://api.waqi.info";

function withToken(params = {}) {
  return { ...params, token: requireEnv("WAQI_API_KEY") };
}

export function waqiUrl(path, params = {}) {
  return buildUrl(baseUrl, path, withToken(params));
}

export async function fetchWaqiCity(city) {
  return fetchJson(waqiUrl(`/feed/${encodeURIComponent(city)}/`));
}

export async function fetchWaqiGeo(lat, lon) {
  return fetchJson(waqiUrl(`/feed/geo:${lat};${lon}/`));
}

