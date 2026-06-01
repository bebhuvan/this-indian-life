import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson, requireEnv } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.UN_POPULATION_BASE_URL || "https://population.un.org/dataportalapi";

function authHeader() {
  const token = requireEnv("UN_POPULATION_BEARER_TOKEN");
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

export function unPopulationUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchUnPopulationLocations(params = {}) {
  return fetchJson(unPopulationUrl("/api/v1/locations", params));
}

export async function fetchUnPopulationLocation(code) {
  return fetchJson(unPopulationUrl(`/api/v1/locations/${code}`));
}

export async function fetchUnPopulationIndicators(params = {}) {
  return fetchJson(unPopulationUrl("/api/v1/Indicators", params));
}

export async function fetchUnPopulationIndicator(code) {
  return fetchJson(unPopulationUrl(`/api/v1/Indicators/${code}`));
}

export async function fetchUnPopulationData({ indicators, locations, start, end, params = {} }) {
  return fetchJson(unPopulationUrl(`/api/v1/data/indicators/${indicators}/locations/${locations}/start/${start}/end/${end}`, {
    pagingInHeader: false,
    format: "json",
    ...params
  }), {
    headers: {
      authorization: authHeader()
    }
  });
}

export async function fetchUnPopulationIndiaData({ indicator, start, end, params = {} }) {
  return fetchUnPopulationData({
    indicators: indicator,
    locations: 356,
    start,
    end,
    params
  });
}

export async function fetchAllUnPopulationData({ indicators, locations, start, end, params = {} }) {
  const first = await fetchUnPopulationData({
    indicators,
    locations,
    start,
    end,
    params: {
      pageSize: 1000,
      pageNumber: 1,
      ...params
    }
  });

  if (!Array.isArray(first?.data)) return first;

  const data = [...first.data];
  const pages = Number(first.pages || 1);
  for (let pageNumber = 2; pageNumber <= pages; pageNumber += 1) {
    const page = await fetchUnPopulationData({
      indicators,
      locations,
      start,
      end,
      params: {
        pageSize: 1000,
        pageNumber,
        ...params
      }
    });
    if (Array.isArray(page?.data)) data.push(...page.data);
  }

  return {
    ...first,
    pageNumber: 1,
    previousPage: null,
    nextPage: null,
    data
  };
}

export async function fetchAllUnPopulationIndiaData({ indicator, start, end, params = {} }) {
  return fetchAllUnPopulationData({
    indicators: indicator,
    locations: 356,
    start,
    end,
    params
  });
}
