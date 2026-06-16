import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { stableJson, writeSnapshot } from "./core/artifacts.mjs";

const SOURCE_URL = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";
const IDH_TOTAL_ID = "INAUREGALL11M";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function parseArgs(argv) {
  const out = { from: "2010-01-01", to: null };
  for (const arg of argv) {
    const [key, value] = arg.split("=", 2);
    if (key === "--from") out.from = value;
    if (key === "--to") out.to = value;
  }
  return out;
}

function monthKey(date) {
  return String(date || "").slice(0, 7);
}

function pct(diff, base) {
  return base ? (diff / base) * 100 : null;
}

function summary(rows, diffField) {
  const diffs = rows.map((row) => row[diffField]).filter(Number.isFinite);
  const abs = diffs.map(Math.abs).sort((a, b) => a - b);
  const pctAbs = rows.map((row) => Math.abs(row[`${diffField}Pct`] ?? NaN)).filter(Number.isFinite).sort((a, b) => a - b);
  const pick = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : null;
  const maxRow = rows.reduce((best, row) => Math.abs(row[diffField] ?? 0) > Math.abs(best?.[diffField] ?? 0) ? row : best, null);
  return {
    observations: rows.length,
    exactMatches: rows.filter((row) => row[diffField] === 0).length,
    meanDiff: diffs.length ? Math.round(diffs.reduce((sum, value) => sum + value, 0) / diffs.length) : null,
    medianAbsDiff: pick(abs, 0.5),
    p90AbsDiff: pick(abs, 0.9),
    maxAbsDiff: maxRow ? Math.abs(maxRow[diffField]) : null,
    maxAbsDiffMonth: maxRow?.date ?? null,
    medianAbsPct: pick(pctAbs, 0.5),
    p90AbsPct: pick(pctAbs, 0.9)
  };
}

function periodSummary(rows, predicate) {
  const subset = rows.filter(predicate);
  return {
    observations: subset.length,
    allStatesVsIdh: summary(subset, "diffAll"),
    exTelanganaVsIdh: summary(subset, "diffExTelangana")
  };
}

function expectedDefinitionRows(rows) {
  return rows.map((row) => {
    const expectedBasis = row.date < "2025-01" ? "vahanExTelangana" : "vahanAllStates";
    const expectedValue = row[expectedBasis];
    const expectedDiff = expectedValue - row.idhValue;
    return {
      date: row.date,
      expectedBasis,
      idhValue: row.idhValue,
      expectedValue,
      expectedDiff,
      expectedDiffPct: pct(expectedDiff, row.idhValue)
    };
  });
}

function expectedDefinitionSummary(rows) {
  const expected = expectedDefinitionRows(rows);
  const absPct = expected.map((row) => Math.abs(row.expectedDiffPct ?? NaN)).filter(Number.isFinite).sort((a, b) => a - b);
  const absDiff = expected.map((row) => Math.abs(row.expectedDiff)).sort((a, b) => a - b);
  const pick = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : null;
  const maxRow = expected.reduce((best, row) => Math.abs(row.expectedDiff) > Math.abs(best?.expectedDiff ?? 0) ? row : best, null);
  const failures = expected.filter((row) => Math.abs(row.expectedDiffPct ?? Infinity) > 1.5 && Math.abs(row.expectedDiff) > 25_000);
  return {
    observations: expected.length,
    exactMatches: expected.filter((row) => row.expectedDiff === 0).length,
    medianAbsDiff: pick(absDiff, 0.5),
    p90AbsDiff: pick(absDiff, 0.9),
    maxAbsDiff: maxRow ? Math.abs(maxRow.expectedDiff) : null,
    maxAbsDiffMonth: maxRow?.date ?? null,
    medianAbsPct: pick(absPct, 0.5),
    p90AbsPct: pick(absPct, 0.9),
    validationRule: "Before 2025-01 compare IDH with VAHAN excluding Telangana; from 2025-01 compare IDH with all-state VAHAN. Fail if abs pct > 1.5% and abs count > 25,000.",
    failures
  };
}

async function readVahanStateTable(year) {
  return JSON.parse(await readFile(`Vaahan/tables/vahan_state_monthly_calendar_${year}.json`, "utf8"));
}

function tableTotalsByMonth(table) {
  const telangana = table.rows.find((row) => /TELANGANA/i.test(row.state));
  const out = new Map();
  for (const month of table.columns.slice(2, -1).filter((column) => MONTHS.includes(column))) {
    const monthIndex = MONTHS.indexOf(month) + 1;
    const date = `${String(table.year).padStart(4, "0")}-${String(monthIndex).padStart(2, "0")}`;
    const allStates = table.rows.reduce((sum, row) => sum + (Number.isFinite(row[month]) ? row[month] : 0), 0);
    const telanganaValue = Number.isFinite(telangana?.[month]) ? telangana[month] : 0;
    out.set(date, {
      date,
      vahanAllStates: allStates,
      vahanExTelangana: allStates - telanganaValue,
      telangana: telanganaValue
    });
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const fetchedAt = new Date().toISOString();
const raw = await fetchIndiaEconomySeries({ id: IDH_TOTAL_ID, fields: "India", dateFrom: args.from, dateTo: args.to });
const snapshot = await writeSnapshot("indiadatahub", `vahan_corroboration_${IDH_TOTAL_ID}`, raw);
const idhRows = raw.dataset?.[0]?.data || [];
const idh = new Map(idhRows.map((row) => [monthKey(row.Date), Number(row.India)]));

const years = [...new Set([...idh.keys()].map((date) => Number(date.slice(0, 4))))].sort((a, b) => a - b);
const comparisons = [];
for (const year of years) {
  let table;
  try {
    table = await readVahanStateTable(year);
  } catch {
    continue;
  }
  const totals = tableTotalsByMonth(table);
  for (const [date, idhValue] of idh.entries()) {
    if (!date.startsWith(`${year}-`)) continue;
    const local = totals.get(date);
    if (!local || !Number.isFinite(idhValue)) continue;
    const diffAll = local.vahanAllStates - idhValue;
    const diffExTelangana = local.vahanExTelangana - idhValue;
    comparisons.push({
      date,
      idhValue,
      ...local,
      diffAll,
      diffAllPct: pct(diffAll, idhValue),
      diffExTelangana,
      diffExTelanganaPct: pct(diffExTelangana, idhValue)
    });
  }
}

comparisons.sort((a, b) => a.date.localeCompare(b.date));
const report = {
  sourceId: "indiadatahub",
  sourceUrl: SOURCE_URL,
  fetchedAt,
  idhIndicator: {
    id: IDH_TOTAL_ID,
    title: raw.dataset?.[0]?.Title,
    source: raw.dataset?.[0]?.Source,
    unit: raw.dataset?.[0]?.Unit,
    frequency: raw.dataset?.[0]?.Frequency,
    note: "IDH metadata says ex Telangana, but this validation compares both all-state dashboard totals and dashboard totals excluding the Telangana row."
  },
  snapshot,
  coverage: {
    idhObservations: idh.size,
    comparedObservations: comparisons.length,
    firstCompared: comparisons[0]?.date ?? null,
    lastCompared: comparisons.at(-1)?.date ?? null
  },
  summary: {
    allStatesVsIdh: summary(comparisons, "diffAll"),
    exTelanganaVsIdh: summary(comparisons, "diffExTelangana"),
    expectedDefinitionVsIdh: expectedDefinitionSummary(comparisons),
    periods: {
      through2024: periodSummary(comparisons, (row) => row.date < "2025-01"),
      from2025: periodSummary(comparisons, (row) => row.date >= "2025-01")
    }
  },
  inferredDefinitionChange: {
    date: "2025-01",
    evidence: [
      "IDH automobile metadata includes Telangana-only Open Data series that end in May 2024.",
      "For 2010-2024, IDH INAUREGALL11M matches VAHAN dashboard totals after subtracting the dashboard Telangana row much better than it matches all-state totals.",
      "From 2025-01 onward, IDH INAUREGALL11M matches all-state VAHAN dashboard totals much better than it matches totals excluding Telangana.",
      "IDH state fields are not a complete reconciliation surface for this series: requesting all states returned only 23 populated state fields in spot checks, while India is a separate aggregate."
    ]
  },
  findings: [
    ...(expectedDefinitionSummary(comparisons).failures.length
      ? [{
          severity: "error",
          message: "IDH corroboration failed the inferred-definition rule.",
          detail: "Investigate IDH/VAHAN definition drift before using this source as a corroboration check."
        }]
      : [{
          severity: "warning",
          message: "IDH corroborates the VAHAN scrape, but Telangana treatment changes in January 2025.",
          detail: "Use VAHAN dashboard tables as the primary source. Use IDH only as a corroborating source with the period-specific rule recorded in this report."
        }])
  ],
  comparisons
};

await mkdir("Vaahan/validation", { recursive: true });
const path = "Vaahan/validation/vahan_idh_corroboration.json";
await writeFile(path, `${stableJson(report)}\n`);
console.log(`wrote ${path}`);
console.log(stableJson({
  coverage: report.coverage,
  summary: report.summary,
  findings: report.findings
}));
