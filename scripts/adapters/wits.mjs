import { loadEnv } from "../env.mjs";
import { fetchJson } from "../lib/source-http.mjs";

loadEnv();

// WITS (World Integrated Trade Solution) SDMX-JSON API. Public, no key.
// We use the tradestats-tariff dataset, which exposes both MFN-applied and
// AHS (effectively-applied, including preferential rates) simple averages —
// the gap between them is the preferential/exemption effect that no other
// source we use captures. Trade flows in WITS are just re-served Comtrade.
const baseUrl = process.env.WITS_BASE_URL || "https://wits.worldbank.org/API/V1/SDMX/V21/datasource";

/**
 * Fetch one WITS tradestats series and return decoded { date, value } points.
 * The SDMX-JSON encodes observations by index into the TIME_PERIOD dimension,
 * so we map each observation index back to its year via the structure block.
 */
export async function fetchWitsTariffSeries({
  reporter = "ind",
  partner = "wld",
  product = "Total",
  indicator,
  dataset = "tradestats-tariff",
  year = "all"
}) {
  if (!indicator) throw new Error("fetchWitsTariffSeries requires an `indicator`.");
  const url = `${baseUrl}/${dataset}/reporter/${reporter}/year/${year}/partner/${partner}/product/${product}/indicator/${indicator}?format=JSON`;
  const raw = await fetchJson(url, {
    timeoutMs: Number(process.env.WITS_FETCH_TIMEOUT_MS || 60000),
    retries: Number(process.env.WITS_FETCH_RETRIES || 3),
    retryDelayMs: Number(process.env.WITS_RETRY_DELAY_MS || 3000)
  });
  const years = (raw?.structure?.dimensions?.observation?.[0]?.values || []).map((v) => v.id);
  const series = raw?.dataSets?.[0]?.series || {};
  const firstKey = Object.keys(series)[0];
  const observations = firstKey ? series[firstKey].observations || {} : {};
  const points = Object.entries(observations)
    .map(([idx, arr]) => ({ date: years[Number(idx)], value: Array.isArray(arr) ? arr[0] : null }))
    .filter((p) => p.date && p.value !== null && Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { points, raw, url };
}
