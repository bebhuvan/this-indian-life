import { spawnSync } from "node:child_process";
import { createTableArtifact, stableJson, writeRawSnapshot, writeSeriesArtifact } from "./core/artifacts.mjs";
import { mkdir, writeFile } from "node:fs/promises";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://data.bis.org/topics/TOTAL_CREDIT";
const bulkUrl = "https://data.bis.org/static/bulk/WS_TC_csv_flat.zip";
const csvName = "WS_TC_csv_flat.csv";

const selectedCountries = new Set([
  "AU", "BR", "CA", "CN", "DE", "ES", "FR", "GB", "ID", "IN", "JP", "KR", "MX", "MY", "TH", "US", "ZA"
]);

const metricDefinitions = [
  { metric: "household_pct_gdp", borrowerCode: "H", lenderCode: "A", valuationCode: "M", unitTypeCode: "770", adjustmentCode: "A", unit: "% of GDP", label: "Households and NPISHs, all lenders" },
  { metric: "household_local_currency", borrowerCode: "H", lenderCode: "A", valuationCode: "M", unitTypeCode: "XDC", adjustmentCode: "A", unit: "billions local currency", label: "Households and NPISHs, all lenders" },
  { metric: "nfc_pct_gdp", borrowerCode: "N", lenderCode: "A", valuationCode: "M", unitTypeCode: "770", adjustmentCode: "A", unit: "% of GDP", label: "Non-financial corporations, all lenders" },
  { metric: "private_nonfinancial_pct_gdp", borrowerCode: "P", lenderCode: "A", valuationCode: "M", unitTypeCode: "770", adjustmentCode: "A", unit: "% of GDP", label: "Private non-financial sector, all lenders" },
  { metric: "private_nonfinancial_bank_pct_gdp", borrowerCode: "P", lenderCode: "B", valuationCode: "M", unitTypeCode: "770", adjustmentCode: "A", unit: "% of GDP", label: "Private non-financial sector, domestic banks" },
  { metric: "nonfinancial_sector_pct_gdp", borrowerCode: "C", lenderCode: "A", valuationCode: "M", unitTypeCode: "770", adjustmentCode: "A", unit: "% of GDP", label: "Non-financial sector, all lenders" },
  { metric: "government_pct_gdp", borrowerCode: "G", lenderCode: "A", valuationCode: "N", unitTypeCode: "770", adjustmentCode: "A", unit: "% of GDP", label: "General government, all lenders" }
];

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

function metricFor(row) {
  return metricDefinitions.find((metric) =>
    row.borrowerCode === metric.borrowerCode &&
    row.lenderCode === metric.lenderCode &&
    row.valuationCode === metric.valuationCode &&
    row.unitTypeCode === metric.unitTypeCode &&
    row.adjustmentCode === metric.adjustmentCode
  );
}

const response = await fetch(bulkUrl);
if (!response.ok) throw new Error(`BIS bulk download failed: ${response.status} ${response.statusText}`);
const zipBuffer = Buffer.from(await response.arrayBuffer());
const snapshot = await writeRawSnapshot("bis", "WS_TC_csv_flat", zipBuffer, "zip");

const unzip = spawnSync("unzip", ["-p", snapshot.path, csvName], { encoding: "utf8", maxBuffer: 200 * 1024 * 1024 });
if (unzip.status !== 0) {
  throw new Error(`Could not read ${csvName} from BIS ZIP: ${unzip.stderr || unzip.error?.message || "unknown unzip error"}`);
}

const lines = unzip.stdout.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);
const rows = [];
const matchedMetrics = new Map();

for (const line of lines.slice(1)) {
  const cells = parseCsvLine(line);
  const raw = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  if (codeOf(raw["FREQ:Frequency"]) !== "Q") continue;

  const countryCode = codeOf(raw["BORROWERS_CTY:Borrowers' country"]);
  if (!selectedCountries.has(countryCode)) continue;

  const normalized = {
    countryCode,
    country: labelOf(raw["BORROWERS_CTY:Borrowers' country"]),
    borrowerCode: codeOf(raw["TC_BORROWERS:Borrowing sector"]),
    borrower: labelOf(raw["TC_BORROWERS:Borrowing sector"]),
    lenderCode: codeOf(raw["TC_LENDERS:Lending sector"]),
    lender: labelOf(raw["TC_LENDERS:Lending sector"]),
    valuationCode: codeOf(raw["VALUATION:Valuation method"]),
    valuation: labelOf(raw["VALUATION:Valuation method"]),
    unitTypeCode: codeOf(raw["UNIT_TYPE:Unit type"]),
    unitType: labelOf(raw["UNIT_TYPE:Unit type"]),
    adjustmentCode: codeOf(raw["TC_ADJUST:Adjustment"]),
    adjustment: labelOf(raw["TC_ADJUST:Adjustment"])
  };
  const metric = metricFor(normalized);
  if (!metric) continue;

  const value = Number(raw["OBS_VALUE:Observation Value"]);
  if (!Number.isFinite(value)) continue;

  const period = raw["TIME_PERIOD:Time period or range"];
  const unitMultiplier = labelOf(raw["UNIT_MULT:Unit Multiplier"]);
  const unitMeasure = labelOf(raw["UNIT_MEASURE:Unit of measure"]);
  const row = {
    datasetKey: "bis_total_credit",
    metric: metric.metric,
    metricLabel: metric.label,
    countryCode: normalized.countryCode,
    country: normalized.country,
    period,
    date: quarterDate(period),
    frequency: "quarterly",
    value,
    NumericValue: value,
    unit: metric.unit,
    borrowerCode: normalized.borrowerCode,
    borrower: normalized.borrower,
    lenderCode: normalized.lenderCode,
    lender: normalized.lender,
    valuationCode: normalized.valuationCode,
    valuation: normalized.valuation,
    unitTypeCode: normalized.unitTypeCode,
    unitType: normalized.unitType,
    adjustmentCode: normalized.adjustmentCode,
    adjustment: normalized.adjustment,
    unitMultiplier,
    unitMeasure,
    sourceTitle: raw["TITLE_TS:Title (tseries level)"]
  };
  if (normalized.countryCode === "IN" && normalized.unitTypeCode === "XDC" && unitMultiplier === "Billions" && unitMeasure === "Indian rupee") {
    row.valueInrCrore = value * 100;
  }
  rows.push(row);
  matchedMetrics.set(`${metric.metric}:${countryCode}`, (matchedMetrics.get(`${metric.metric}:${countryCode}`) || 0) + 1);
}

rows.sort((a, b) => `${a.metric}:${a.countryCode}:${a.period}`.localeCompare(`${b.metric}:${b.countryCode}:${b.period}`));

const artifact = createTableArtifact({
  indicatorId: "credit.bis.total_credit_quarterly",
  title: "BIS total credit, selected borrower sectors and countries",
  sourceId: "bis",
  sourceIndicatorId: "BIS:WS_TC(2.0)",
  sourceUrl,
  unit: "mixed",
  geography: { type: "multi-country", id: "selected", name: "Selected countries" },
  fetchedAt,
  dimensions: ["metric", "countryCode", "period"],
  rows,
  metadata: {
    method: "Downloaded BIS WS_TC flat bulk CSV and retained adjusted quarterly total-credit rows needed for the India borrowing article.",
    bulkUrl,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    selectedCountries: [...selectedCountries],
    metricDefinitions,
    caveats: [
      "BIS total credit is a broad credit-system measure and is not the same as RBI sectoral deployment of bank credit.",
      "Quarterly dates are stored as quarter-end months for chart geometry; the source period is retained as YYYY-Qn.",
      "Domestic-currency values are source billions. India rows additionally include valueInrCrore."
    ]
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "bis",
  name: "bis.IN.credit.total_credit_quarterly.long",
  artifact
});

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/bis-total-credit-manifest.json", `${stableJson({
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
    metrics: metricDefinitions.map((metric) => metric.metric),
    selectedCountries: [...selectedCountries]
  },
  matchedMetrics: Object.fromEntries([...matchedMetrics.entries()].sort())
})}\n`);

console.log(`Wrote ${artifactPath} with ${rows.length} BIS total-credit rows.`);
