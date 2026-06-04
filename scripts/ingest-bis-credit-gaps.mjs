import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createTableArtifact, stableJson, writeRawSnapshot, writeSeriesArtifact } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://data.bis.org/topics/CREDIT_GAPS";
const bulkUrl = "https://data.bis.org/static/bulk/WS_CREDIT_GAP_csv_flat.zip";
const csvName = "WS_CREDIT_GAP_csv_flat.csv";

const selectedCountries = new Set([
  "AU", "BR", "CA", "CN", "DE", "ES", "FR", "GB", "ID", "IN", "JP", "KR", "MX", "MY", "TH", "US", "ZA"
]);

const dtypeMetrics = new Map([
  ["A", { metric: "private_credit_pct_gdp_actual", unit: "% of GDP", label: "Private non-financial credit-to-GDP ratio" }],
  ["B", { metric: "private_credit_pct_gdp_trend", unit: "% of GDP", label: "Private non-financial credit-to-GDP trend" }],
  ["C", { metric: "private_credit_pct_gdp_gap", unit: "percentage points", label: "Private non-financial credit-to-GDP gap" }]
]);

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (quoted && line[i + 1] === "\"") {
        value += "\"";
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function codeOf(value) {
  return String(value || "").split(":")[0].trim();
}

function labelOf(value) {
  return String(value || "").replace(/^[^:]+:\s*/, "").trim();
}

function quarterDate(period) {
  const match = String(period || "").match(/^(\d{4})-Q([1-4])$/);
  if (!match) return String(period || "");
  return `${match[1]}-${["03", "06", "09", "12"][Number(match[2]) - 1]}`;
}

const response = await fetch(bulkUrl);
if (!response.ok) throw new Error(`BIS credit-gap bulk download failed: ${response.status} ${response.statusText}`);
const zipBuffer = Buffer.from(await response.arrayBuffer());
const snapshot = await writeRawSnapshot("bis", "WS_CREDIT_GAP_csv_flat", zipBuffer, "zip");

const unzip = spawnSync("unzip", ["-p", snapshot.path, csvName], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
if (unzip.status !== 0) {
  throw new Error(`Could not read ${csvName} from BIS ZIP: ${unzip.stderr || unzip.error?.message || "unknown unzip error"}`);
}

const lines = unzip.stdout.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);
const rows = [];

for (const line of lines.slice(1)) {
  const cells = parseCsvLine(line);
  const raw = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  if (codeOf(raw["FREQ:Frequency"]) !== "Q") continue;
  const countryCode = codeOf(raw["BORROWERS_CTY:Borrowers' country"]);
  if (!selectedCountries.has(countryCode)) continue;
  if (codeOf(raw["TC_BORROWERS:Borrowing sector"]) !== "P") continue;
  if (codeOf(raw["TC_LENDERS:Lending sector"]) !== "A") continue;

  const dataTypeCode = codeOf(raw["CG_DTYPE:Credit gap data type"]);
  const metric = dtypeMetrics.get(dataTypeCode);
  if (!metric) continue;
  const value = Number(raw["OBS_VALUE:Observation Value"]);
  if (!Number.isFinite(value)) continue;

  rows.push({
    datasetKey: "bis_credit_gap",
    metric: metric.metric,
    metricLabel: metric.label,
    countryCode,
    country: labelOf(raw["BORROWERS_CTY:Borrowers' country"]),
    period: raw["TIME_PERIOD:Time period or range"],
    date: quarterDate(raw["TIME_PERIOD:Time period or range"]),
    frequency: "quarterly",
    value,
    NumericValue: value,
    unit: metric.unit,
    borrowerCode: codeOf(raw["TC_BORROWERS:Borrowing sector"]),
    borrower: labelOf(raw["TC_BORROWERS:Borrowing sector"]),
    lenderCode: codeOf(raw["TC_LENDERS:Lending sector"]),
    lender: labelOf(raw["TC_LENDERS:Lending sector"]),
    dataTypeCode,
    dataType: labelOf(raw["CG_DTYPE:Credit gap data type"]),
    sourceTitle: raw["TITLE_TS:Title (tseries level)"]
  });
}

rows.sort((a, b) => `${a.metric}:${a.countryCode}:${a.period}`.localeCompare(`${b.metric}:${b.countryCode}:${b.period}`));

const artifact = createTableArtifact({
  indicatorId: "credit.bis.credit_gap_quarterly",
  title: "BIS credit-to-GDP gaps, selected countries",
  sourceId: "bis",
  sourceIndicatorId: "BIS:WS_CREDIT_GAP(1.0)",
  sourceUrl,
  unit: "mixed",
  geography: { type: "multi-country", id: "selected", name: "Selected countries" },
  fetchedAt,
  dimensions: ["metric", "countryCode", "period"],
  rows,
  metadata: {
    method: "Downloaded BIS WS_CREDIT_GAP flat bulk CSV and retained selected country rows for private non-financial sector credit-to-GDP actual, trend and gap.",
    bulkUrl,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    selectedCountries: [...selectedCountries],
    caveats: [
      "Credit-to-GDP gaps are actual credit-to-GDP minus a one-sided HP-filter trend.",
      "This is an early-warning/risk lens, not a loan-product composition measure.",
      "Quarterly dates are stored as quarter-end months for chart geometry; the source period is retained as YYYY-Qn."
    ]
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "bis",
  name: "bis.IN.credit.credit_gap_quarterly.long",
  artifact
});

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/bis-credit-gaps-manifest.json", `${stableJson({
  schemaVersion: 1,
  sourceId: "bis",
  generatedAt: fetchedAt,
  sourceUrl,
  bulkUrl,
  artifact: artifactPath,
  rows: rows.length,
  coverage: {
    firstPeriod: rows.map((row) => row.period).sort()[0] || null,
    latestPeriod: rows.map((row) => row.period).sort().at(-1) || null,
    metrics: [...dtypeMetrics.values()].map((metric) => metric.metric),
    selectedCountries: [...selectedCountries]
  }
})}\n`);

console.log(`Wrote ${artifactPath} with ${rows.length} BIS credit-gap rows.`);
