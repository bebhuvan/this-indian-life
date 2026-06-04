import { timeoutSignal } from "../lib/source-http.mjs";

// Berkeley Earth has NO API. Regional/national land-temperature summaries are plain
// whitespace-delimited text files in a public S3 bucket. This adapter fetches one
// region's "-Trend.txt" file and parses it into annual series.
//
// File shape (after a long `%`-prefixed header):
//   Year  Month  MonthlyAnomaly  Unc  AnnualAnomaly  Unc  5yr Unc  10yr Unc  20yr Unc
// Anomalies are degrees Celsius relative to the Jan 1951-Dec 1980 average; the header
// states the absolute baseline temperature so we can also reconstruct absolute degC.
const bucketUrl = process.env.BERKELEY_BASE_URL || "https://berkeley-earth-temperature.s3.us-west-1.amazonaws.com";

export function berkeleyRegionUrl(region, metric = "TAVG") {
  return `${bucketUrl}/Regional/${metric}/${region}-${metric}-Trend.txt`;
}

// Parse a Berkeley Earth regional text file into annual anomaly + absolute series.
// Annual value = mean of the 12 monthly anomalies; partial calendar years are dropped
// so every point is a clean full-year average.
export function parseBerkeleyRegion(text) {
  const absMatch = text.match(/absolute temperature \(C\):\s*([-\d.]+)/i);
  const baselineAbsolute = absMatch ? Number(absMatch[1]) : null;
  const periodMatch = text.match(/relative to the\s+([A-Za-z]+ \d{4})\s*-\s*([A-Za-z]+ \d{4})/i);
  const baselinePeriod = periodMatch ? `${periodMatch[1]} to ${periodMatch[2]}` : "Jan 1951 to Dec 1980";

  const byYear = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("%")) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) continue;
    if (parts[2] === "NaN") continue;
    const value = Number(parts[2]);
    if (!Number.isFinite(value)) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(value);
  }

  const anomaly = [];
  for (const [year, months] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    if (months.length < 12) continue;
    anomaly.push({ date: String(year), value: Number((months.reduce((s, v) => s + v, 0) / 12).toFixed(3)) });
  }
  const absolute = baselineAbsolute == null
    ? []
    : anomaly.map((o) => ({ date: o.date, value: Number((o.value + baselineAbsolute).toFixed(3)) }));

  return { baselineAbsolute, baselinePeriod, anomaly, absolute, latestYear: anomaly.at(-1)?.date || null };
}

export async function fetchBerkeleyRegion(region, metric = "TAVG") {
  const url = berkeleyRegionUrl(region, metric);
  const response = await fetch(url, {
    signal: timeoutSignal(Number(process.env.INDICA_BERKELEY_TIMEOUT_MS || 90000)),
    headers: { accept: "text/plain", "user-agent": "Indica/0.1 data ingest" }
  });
  if (!response.ok) throw new Error(`Berkeley Earth failed ${response.status}: ${url}`);
  const text = await response.text();
  const parsed = parseBerkeleyRegion(text);
  if (!parsed.anomaly.length) throw new Error(`Berkeley Earth: no annual rows parsed from ${url}`);
  return { url, ...parsed };
}
