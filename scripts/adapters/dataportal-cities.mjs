import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.DATA_PORTAL_CITIES_BASE_URL || "https://dataportalforcities.org";

export function dataPortalCitiesUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchCityEmissions({ cityid, year, sector, scope = "total" }) {
  return fetchJson(dataPortalCitiesUrl("/api/emissions", {
    cityid,
    year,
    sector,
    scope
  }));
}

