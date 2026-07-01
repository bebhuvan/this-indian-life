import { buildUrl, fetchJson } from "../lib/source-http.mjs";

const baseUrl = process.env.CLIMATEWATCH_BASE_URL || "https://www.climatewatchdata.org/api/v1";

export function climateWatchUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchClimateWatchHistoricalEmissions({ region = "IND", gas, sector }) {
  const url = climateWatchUrl("/data/historical_emissions", {});
  url.searchParams.append("regions[]", region);
  if (gas) url.searchParams.append("gases[]", gas);
  if (sector) url.searchParams.append("sectors[]", sector);
  return fetchJson(url);
}
