import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson, requireEnv } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.INDIA_DATA_HUB_BASE_URL || "https://feeds.indiadatahub.com";

function withKey(params = {}) {
  return { ...params, api_key: requireEnv("INDIA_DATA_HUB_API_KEY") };
}

export function indiaDataHubUrl(path, params = {}) {
  return buildUrl(baseUrl, path, withKey(params));
}

export async function fetchIndiaDataHubOpenApi() {
  return fetchJson(buildUrl(baseUrl, "/openapi.json"));
}

export async function fetchIndiaEconomyCategories() {
  return fetchJson(indiaDataHubUrl("/economy/category_list"));
}

export async function fetchIndiaEconomySeries({ id, fields = "India", dateFrom, dateTo, lastModifiedAfter }) {
  return fetchJson(indiaDataHubUrl("/economy/data", {
    id,
    fields,
    date_from: dateFrom,
    date_to: dateTo,
    last_modified_after: lastModifiedAfter
  }));
}

