// BIS Statistics SDMX REST adapter.
// API docs: https://stats.bis.org/api-doc/v1/  Base: https://stats.bis.org/api/v1
// General fetcher over any dataflow + series key, returning a flat shape.
//
// Flagship dataflow for the rupee article: WS_EER (Effective exchange rates).
//   key = FREQ.TYPE.BASKET.REF_AREA  e.g. M.R.B.IN = Monthly, Real, Broad, India.
//   NOTE: India is BROAD-basket only (M.R.B.IN / M.N.B.IN), from 1994-01. There is
//   no narrow-basket (M.*.N.IN) series for India, so BIS cannot supply a pre-1994
//   real series for the rupee.
import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.BIS_BASE_URL || "https://stats.bis.org/api/v1";

const fetchOpts = () => ({
  timeoutMs: Number(process.env.BIS_FETCH_TIMEOUT_MS || 90000),
  retries: Number(process.env.BIS_FETCH_RETRIES || 3),
  retryDelayMs: Number(process.env.BIS_RETRY_DELAY_MS || 4000),
  // lowercase `accept` overwrites the helper's default so BIS doesn't see two
  // conflicting Accept values (which makes it fall back to XML).
  headers: { accept: "application/vnd.sdmx.data+json" }
});

// Fetch one (or more) series from a BIS dataflow.
// Returns { flowName, series: [{ key, dims: {DimName: valueId}, observations: [{period, value|null}] }] }.
// SDMX-JSON encodes observations as { obsIndex: [value, ...] } against an ordered
// list of period values in structure.dimensions.observation[0].values — we re-join them.
export async function fetchBisData({ flow, key = "all", version = "1.0", agency = "BIS", startPeriod, endPeriod } = {}) {
  if (!flow) throw new Error("fetchBisData: `flow` is required (e.g. 'WS_EER')");
  const params = {};
  if (startPeriod) params.startPeriod = startPeriod;
  if (endPeriod) params.endPeriod = endPeriod;
  const url = buildUrl(baseUrl, `/data/${agency},${flow},${version}/${key}/all`, params);
  const data = await fetchJson(url, fetchOpts());

  const structure = data?.data?.structure;
  const dataSet = data?.data?.dataSets?.[0];
  if (!structure || !dataSet) throw new Error(`BIS: empty response for ${flow}/${key}`);

  const seriesDims = structure.dimensions.series;
  const periodValues = structure.dimensions.observation[0].values.map((v) => v.id);

  const series = Object.entries(dataSet.series || {}).map(([seriesKey, payload]) => {
    const dimIdx = seriesKey.split(":").map(Number);
    const dims = {};
    seriesDims.forEach((dim, i) => {
      dims[dim.name] = dim.values[dimIdx[i]]?.id ?? null;
    });
    const observations = Object.entries(payload.observations || {})
      .map(([obsIdx, arr]) => ({
        period: periodValues[Number(obsIdx)],
        value: arr?.[0] == null ? null : Number(arr[0])
      }))
      .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
    return { key: seriesKey, dims, observations };
  });

  return { flowName: structure.name, raw: data, series };
}
