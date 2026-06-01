import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.NDAP_BASE_URL || "https://loadqa.ndapapi.com";

export function ndapUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchNdapCatalogue(params = {}) {
  return fetchJson(ndapUrl("/v1/search/catalogue", params));
}

export async function fetchNdapSearch(params = {}) {
  return fetchJson(ndapUrl("/v1/search", params));
}

export async function fetchNdapDatasetDetails(payload = {}) {
  const url = ndapUrl("/v1/dataset/details");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "Indica/0.1 data ingest"
    },
    body: JSON.stringify({
      ip_sourceid: [],
      ip_columns: {},
      ip_filter: [],
      ip_orderby: [],
      ip_sourcemaster: 1,
      ip_datavariables: 1,
      ip_datasetprofile: 1,
      ip_limit: 100,
      ip_offset: 0,
      view_name: "",
      ...payload
    })
  });

  if (!response.ok) {
    throw new Error(`NDAP dataset details failed ${response.status}: ${url}`);
  }

  return response.json();
}

