import { timeoutSignal } from "../lib/source-http.mjs";

const baseUrl = process.env.CCKP_BASE_URL || "https://cckpapi.worldbank.org/cckp/v1";

// World Bank Climate Change Knowledge Portal (CCKP). Serves CMIP6 climate data —
// observed-proxy (historical run) and projections under SSP scenarios — as clean
// JSON, no key. Response shape: {data:{<geocode>:{"YYYY-07": value}}} where the
// "-07" is just the annual-aggregate stamp, not July. CC BY 4.0.
//
// URL template (11 underscore-joined params):
//   {collection}_{type}_{variable}_{product}_{aggregation}_{period}_{percentile}_{scenario}_{model}_{calc}_{statistic}/{geocode}
export function cckpTimeseriesUrl({ variable, period, scenario, geocode = "IND" }) {
  const slug = [
    "cmip6-x0.25", "timeseries", variable, "timeseries", "annual",
    period, "median", scenario, "ensemble", "all", "mean"
  ].join("_");
  return `${baseUrl}/${slug}/${geocode}?_format=json`;
}

export async function fetchCckpSeries({ variable, period, scenario, geocode = "IND" }) {
  const url = cckpTimeseriesUrl({ variable, period, scenario, geocode });
  const response = await fetch(url, {
    signal: timeoutSignal(Number(process.env.INDICA_CCKP_TIMEOUT_MS || 90000)),
    headers: { accept: "application/json", "user-agent": "Indica/0.1 data ingest" }
  });
  if (!response.ok) throw new Error(`CCKP failed ${response.status}: ${url}`);
  const payload = await response.json();
  if (payload?.metadata?.status !== "success") {
    throw new Error(`CCKP non-success: ${JSON.stringify(payload?.metadata?.message || payload?.metadata)}`);
  }
  const byDate = payload?.data?.[geocode] || {};
  const observations = Object.entries(byDate)
    .map(([stamp, value]) => ({ date: String(stamp).slice(0, 4), value: Number(value) }))
    .filter((o) => o.date && Number.isFinite(o.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { url, observations };
}
