import { loadEnv } from "../env.mjs";
import { fetchText } from "../lib/source-http.mjs";
import { parseCsv } from "./harvard-atlas.mjs";

loadEnv();

// OECD Trade in Value Added (TiVA), 2025 edition. Public SDMX, no key.
// Data queries MUST use the sti-public base (the generic /public/ 500s for TiVA).
// Dataflow: OECD.STI.PIE,DSD_TIVA_MAINSH@DF_MAINSH,1.1 (principal indicators, shares).
// KEY order: MEASURE.REF_AREA.ACTIVITY.COUNTERPART_AREA.UNIT_MEASURE.FREQ
const baseUrl = process.env.OECD_TIVA_BASE_URL || "https://sdmx.oecd.org/sti-public/rest/data";
const dataflow = "OECD.STI.PIE,DSD_TIVA_MAINSH@DF_MAINSH,1.1";

export async function fetchTivaIndia(measures = ["EXGR_DVA", "EXGR_FVA", "EXGR_INT_DVA"]) {
  const key = `${measures.join("+")}.IND._T.W.PT_EXGR.A`;
  const url = `${baseUrl}/${dataflow}/${key}?startPeriod=1995&format=csvfile`;
  const text = await fetchText(url, {
    timeoutMs: Number(process.env.OECD_FETCH_TIMEOUT_MS || 90000),
    retries: 2,
    retryDelayMs: 3000,
    // OECD SDMX returns HTTP 500 ("languageTag") without an Accept-Language header.
    headers: { accept: "text/csv", "accept-language": "en" }
  });
  return { rows: parseCsv(text), url };
}
