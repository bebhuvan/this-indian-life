import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.OWID_BASE_URL || "https://ourworldindata.org";

export function owidGrapherUrl(slug, extension = "csv", params = {}) {
  return buildUrl(baseUrl, `/grapher/${slug}.${extension}`, params);
}

export async function fetchOwidMetadata(slug) {
  return fetchJson(owidGrapherUrl(slug, "metadata.json"));
}

export async function fetchOwidCsv(slug, params = {}) {
  const url = owidGrapherUrl(slug, "csv", params);
  const response = await fetch(url, {
    headers: {
      accept: "text/csv",
      "user-agent": "Indica/0.1 data ingest"
    }
  });
  if (!response.ok) throw new Error(`OWID CSV failed ${response.status}: ${url}`);
  return response.text();
}

