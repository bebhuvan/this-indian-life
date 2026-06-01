import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson, requireEnv } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.EMBER_BASE_URL || "https://api.ember-energy.org/v1";

function withKey(params = {}) {
  return { ...params, api_key: requireEnv("EMBER_API_KEY") };
}

export function emberUrl(path, params = {}) {
  return buildUrl(baseUrl, path, withKey(params));
}

export async function fetchEmberOpenApi() {
  return fetchJson(buildUrl(baseUrl, "/openapi.json"));
}

export async function fetchEmberDataset({ dataset, resolution = "yearly", entityCode = "IND", startDate = "2000", endDate, series }) {
  return fetchJson(emberUrl(`/${dataset}/${resolution}`, {
    entity_code: entityCode,
    start_date: startDate,
    end_date: endDate,
    series
  }));
}

export async function fetchEmberOptions({ dataset, resolution = "yearly", filterName }) {
  return fetchJson(emberUrl(`/options/${dataset}/${resolution}/${filterName}`));
}

