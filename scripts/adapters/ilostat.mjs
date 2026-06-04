// ILOSTAT — the ILO's official labour-statistics API via rplumber. Open, no auth.
// Docs: https://rplumber.ilo.org/__docs__/ ; SDMX alt: https://sdmx.ilo.org/rest/
// The /data/indicator endpoint returns a row per (ref_area, sex, classif1, time):
//   ?id=<INDICATOR>&ref_area=IND+CHN&sex=SEX_T&classif1=<CODE>&timefrom=2010&type=both&format=.json
// type=both returns code columns plus *.label columns. Bulk-fetch then filter in node.
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

const baseUrl = process.env.ILOSTAT_BASE_URL || "https://rplumber.ilo.org";

export async function fetchIlostatIndicator({ id, refArea, sex, classif1, timefrom, type = "both" } = {}) {
  const url = buildUrl(baseUrl, "/data/indicator", {
    id,
    ref_area: refArea,
    sex,
    classif1,
    timefrom,
    type,
    format: ".json"
  });
  const rows = await fetchJson(url, {
    headers: { "user-agent": "Mozilla/5.0" },
    timeoutMs: Number(process.env.ILOSTAT_TIMEOUT_MS || 60000),
    retries: 3
  });
  return Array.isArray(rows) ? rows : (rows?.data || []);
}

// Pivot ILOSTAT rows (for a single series key) to sorted {date, value} observations.
// Pass a predicate to pick the rows for one series (e.g. one classif1 code).
export function ilostatObservations(rows, predicate = () => true) {
  return rows
    .filter(predicate)
    .map((r) => ({ date: String(r.time), value: r.obs_value == null || r.obs_value === "" ? null : Number(r.obs_value) }))
    .filter((o) => o.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}
