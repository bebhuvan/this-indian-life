import { timeoutSignal } from "../lib/source-http.mjs";

// PSMSL (Permanent Service for Mean Sea Level) — tide-gauge annual mean sea level.
// No API: per-station ".rlrdata" text files, semicolon-delimited:
//   year; value_mm; flag; flagcode      (value -99999 = missing)
// Values are on the station's arbitrary RLR datum (~7000 mm), so absolute numbers are
// meaningless; we rebase each station to its 1961-1990 mean so the series shows sea-level
// RISE in mm relative to a common baseline.
const baseUrl = process.env.PSMSL_BASE_URL || "https://psmsl.org/data/obtaining";

export function psmslStationUrl(stationId) {
  return `${baseUrl}/rlr.annual.data/${stationId}.rlrdata`;
}

export function parsePsmsl(text, baselineStart = 1961, baselineEnd = 1990) {
  const raw = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [yearStr, valStr] = line.split(";");
    const year = Number(yearStr);
    const value = Number(valStr);
    if (!Number.isInteger(year) || !Number.isFinite(value) || value <= -99999) continue;
    raw.push({ year, mm: value });
  }
  if (!raw.length) return { observations: [], baselineMm: null };
  const baseline = raw.filter((r) => r.year >= baselineStart && r.year <= baselineEnd);
  const pool = baseline.length >= 5 ? baseline : raw;
  const baselineMm = pool.reduce((s, r) => s + r.mm, 0) / pool.length;
  const observations = raw
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ date: String(r.year), value: Number((r.mm - baselineMm).toFixed(1)) }));
  return { observations, baselineMm: Number(baselineMm.toFixed(1)), baselineWindow: `${baselineStart}-${baselineEnd}` };
}

export async function fetchPsmslStation(stationId) {
  const url = psmslStationUrl(stationId);
  const response = await fetch(url, {
    signal: timeoutSignal(Number(process.env.INDICA_PSMSL_TIMEOUT_MS || 60000)),
    headers: { accept: "text/plain", "user-agent": "Indica/0.1 data ingest" }
  });
  if (!response.ok) throw new Error(`PSMSL failed ${response.status}: ${url}`);
  const parsed = parsePsmsl(await response.text());
  if (!parsed.observations.length) throw new Error(`PSMSL: no rows parsed from ${url}`);
  return { url, ...parsed };
}
