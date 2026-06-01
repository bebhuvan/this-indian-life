import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.WHO_GHO_BASE_URL || "https://ghoapi.azureedge.net/api";

export function whoGhoUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchWhoDimensions() {
  return fetchJson(whoGhoUrl("/Dimension"));
}

export async function fetchWhoDimensionValues(dimension) {
  return fetchJson(whoGhoUrl(`/DIMENSION/${dimension}/DimensionValues`));
}

export async function searchWhoIndicators(text) {
  return fetchJson(whoGhoUrl("/Indicator", {
    "$filter": `contains(IndicatorName,'${String(text).replaceAll("'", "''")}')`
  }));
}

export async function fetchWhoIndicatorForIndia(indicatorCode, extraFilter = "") {
  const filter = [`SpatialDim eq 'IND'`, extraFilter].filter(Boolean).join(" and ");
  return fetchJson(whoGhoUrl(`/${indicatorCode}`, { "$filter": filter }));
}
