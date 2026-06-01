import { loadEnv } from "../env.mjs";
import { buildUrl } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.OECD_BASE_URL || "https://sdmx.oecd.org";

export function oecdUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchOecdDataflows() {
  const response = await fetch(oecdUrl("/public/rest/dataflow/all"), {
    headers: {
      accept: "application/vnd.sdmx.structure+xml",
      "accept-language": "en",
      "user-agent": "Indica/0.1 data ingest"
    }
  });
  if (!response.ok) throw new Error(`OECD dataflow failed ${response.status}`);
  return response.text();
}

export async function fetchOecdData({ agency, dataset, version, key = "", params = {}, format = "csvfilewithlabels" }) {
  const response = await fetch(oecdUrl(`/public/rest/data/${agency},${dataset},${version}/${key}`, {
    ...params,
    format
  }), {
    headers: {
      accept: "*/*",
      "accept-language": "en",
      "user-agent": "Indica/0.1 data ingest"
    }
  });
  if (!response.ok) throw new Error(`OECD data query failed ${response.status}: ${await response.text()}`);
  return response.text();
}
