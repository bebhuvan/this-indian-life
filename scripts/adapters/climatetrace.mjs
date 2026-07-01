import { buildUrl, fetchJson } from "../lib/source-http.mjs";

const baseUrl = process.env.CLIMATETRACE_BASE_URL || "https://api.climatetrace.org/v6";

export function climateTraceUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchClimateTraceCountryEmissions({ country = "IND", since, to, sectors }) {
  return fetchJson(climateTraceUrl("/country/emissions", {
    countries: country,
    since,
    to,
    sectors
  }));
}

export async function fetchClimateTraceAssetsPage({ country = "IND", sectors, limit = 1000, offset = 0 }) {
  return fetchJson(climateTraceUrl("/assets", {
    countries: country,
    sectors,
    limit,
    offset
  }));
}

export async function fetchAllClimateTraceAssets({ country = "IND", sectors, pageSize = 1000 }) {
  const assets = [];
  let offset = 0;
  for (;;) {
    const page = await fetchClimateTraceAssetsPage({ country, sectors, limit: pageSize, offset });
    const pageAssets = Array.isArray(page?.assets) ? page.assets : [];
    assets.push(...pageAssets);
    if (pageAssets.length < pageSize) break;
    offset += pageSize;
  }
  return assets;
}
