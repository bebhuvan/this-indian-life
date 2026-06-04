import { loadEnv } from "../env.mjs";
import { fetchText } from "../lib/source-http.mjs";

loadEnv();

// Harvard Growth Lab — Atlas of Economic Complexity. No public REST API; the
// server-friendly path is the Dataverse bulk-file API (public, no key).
// "Growth Projections and Complexity Rankings" dataset (doi:10.7910/DVN/XTAQMC).
const baseUrl = process.env.HARVARD_DATAVERSE_BASE_URL || "https://dataverse.harvard.edu/api/access/datafile";

// Version-pinned datafile id for the ECI rankings CSV (resolve dynamically if it
// 404s after a Growth Lab release — see adapter note).
const eciRankingsFileId = process.env.HARVARD_ECI_FILE_ID || "13439575";

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    header.forEach((h, i) => { row[h.trim()] = cells[i]; });
    return row;
  });
}

export async function fetchAtlasEciRankings() {
  const url = `${baseUrl}/${eciRankingsFileId}?format=original`;
  const text = await fetchText(url, {
    timeoutMs: Number(process.env.HARVARD_FETCH_TIMEOUT_MS || 90000),
    retries: 2,
    retryDelayMs: 3000
  });
  return { rows: parseCsv(text), url };
}
