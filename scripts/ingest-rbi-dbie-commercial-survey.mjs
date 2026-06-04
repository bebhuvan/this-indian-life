// Ingest RBI DBIE "Commercial Survey" (Scheduled Commercial Banks' business in India) —
// the fortnightly credit/deposit aggregates, back to 1999, via the SDMX Data Query (DSD) path.
// This extends the fortnightly credit sheet (currently 2017+) ~18 years deeper.
//
//   CSURYSOR_F_RN  Sources    -> Bank Credit, Non-food Credit, Credit to Commercial Sector/Government,
//                                Domestic Credit, Investments, Net Bank Reserves (Cash + Balances w/ RBI)
//   CSURYCOM_F_RN  Components -> Aggregate Deposits of Residents, Demand/Time Deposits, CDs
//
// Valid observations are the rows where the alternate "Components and sources (Merger)" dimension
// is "Not applicable" (the two grouping dimensions form a cross-product otherwise).
import { fetchDbieSession } from "./adapters/rbi-dbie.mjs";
import { getElementMeta, getDimensions, runDsd, toISO } from "./ingest-rbi-dbie-dsd.mjs";
import { createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE_URL = "https://data.rbi.org.in/DBIE/#/dbie/dataquery_enhanced";
const FROM_DMY = "13-04-1999";
const TO_DMY = "15-05-2026";
const MERGER_COL = "Components and sources (Merger)";

const ELEMENTS = [
  { code: "CSURYSOR_F_RN", group: "sources", breakdownCol: "Sources of Commercial Survey" },
  { code: "CSURYCOM_F_RN", group: "components", breakdownCol: "Components of Commercial Survey" }
];

function slug(s) { return String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80); }
function fmtDate(t) { return new Date(t).toISOString().slice(0, 10); }

async function pullElement(session, el) {
  const meta = await getElementMeta(session, el.code); meta.code = el.code;
  const dims = await getDimensions(session, el.code, meta);
  const { ddlResult, rows } = await runDsd(session, el.code, meta, dims, toISO(FROM_DMY), toISO(TO_DMY), FROM_DMY, TO_DMY);
  if (ddlResult !== "Query created successfully") throw new Error(`${el.code}: DDL failed (${ddlResult})`);
  // Keep only the rows where the alternate grouping is "Not applicable"; drop exact-zero
  // VALUEs (unreported/placeholder fortnights — the survey lags the latest weeks).
  const valid = rows.filter((r) => r[MERGER_COL] === "Not applicable" && r[el.breakdownCol] && r.VALUE !== 0);
  const out = valid.map((r) => ({
    datasetKey: "rbi_commercial_survey",
    sourceElement: el.code,
    group: el.group,
    frequency: "fortnightly",
    period: fmtDate(r.Time),
    date: fmtDate(r.Time),
    TimeDim: new Date(r.Time).getUTCFullYear(),
    series: r[el.breakdownCol],
    seriesKey: `rbi_commercial_survey.${el.group}.${slug(r[el.breakdownCol])}`,
    unit: "INR crore",
    sourceValue: r.VALUE,
    NumericValue: Number((r.VALUE / 1e7).toFixed(2))
  }));
  return { meta, rowCount: rows.length, out };
}

function derive(rows) {
  // index by period -> series -> NumericValue (crore)
  const byPeriod = new Map();
  for (const r of rows) {
    if (!byPeriod.has(r.period)) byPeriod.set(r.period, {});
    byPeriod.get(r.period)[r.series] = r.NumericValue;
  }
  const derived = [];
  const emit = (period, series, val) => {
    if (val === null || !Number.isFinite(val)) return;
    derived.push({ datasetKey: "rbi_commercial_survey", sourceElement: "derived", group: "derived", frequency: "fortnightly", period, date: period, TimeDim: Number(period.slice(0, 4)), series, seriesKey: `rbi_commercial_survey.derived.${slug(series)}`, unit: /Ratio/.test(series) ? "Percent" : "INR crore", sourceValue: null, NumericValue: Number(val.toFixed(2)) });
  };
  for (const [period, s] of byPeriod) {
    const bankCredit = s["Bank Credit"];
    const nonFood = s["Non-food Credit"];
    const aggDep = s["Aggregate Deposits of Residents"];
    const balRbi = s["Balances with the RBI"];
    const cash = s["Cash in Hand"];
    if (bankCredit != null && nonFood != null) emit(period, "Food Credit (derived)", bankCredit - nonFood);
    if (bankCredit != null && aggDep) emit(period, "Credit-Deposit Ratio (derived)", (bankCredit / aggDep) * 100);
    if (aggDep && (balRbi != null || cash != null)) emit(period, "Cash-Deposit Ratio (derived)", (((balRbi || 0) + (cash || 0)) / aggDep) * 100);
  }
  return derived;
}

const session = await fetchDbieSession({ timeoutMs: 20000 });
let allRows = [];
const elementMeta = [];
for (const el of ELEMENTS) {
  const { meta, rowCount, out } = await pullElement(session, el);
  elementMeta.push({ code: el.code, label: meta.label, frequency: meta.freq, rawRows: rowCount, validRows: out.length });
  allRows = allRows.concat(out);
  console.error(`${el.code}: ${out.length} valid obs from ${rowCount} raw rows`);
}
allRows = allRows.concat(derive(allRows));
allRows.sort((a, b) => a.seriesKey.localeCompare(b.seriesKey) || a.period.localeCompare(b.period));

const periods = [...new Set(allRows.map((r) => r.period))].sort();
const seriesList = [...new Set(allRows.map((r) => r.series))];
const summary = {
  rows: allRows.length,
  series: seriesList.length,
  periods: periods.length,
  firstPeriod: periods[0],
  lastPeriod: periods.at(-1),
  elements: elementMeta,
  seriesNames: seriesList
};

const snapshot = await writeSnapshot("rbi-dbie", "commercial-survey-fortnightly-parse-summary", { schemaVersion: 1, fetchedAt, sourceUrl: SOURCE_URL, fromDate: FROM_DMY, toDate: TO_DMY, summary });

const artifact = createTableArtifact({
  indicatorId: "banking.rbi.commercial_survey_fortnightly",
  title: "RBI Scheduled Commercial Banks' business in India (Commercial Survey) — fortnightly",
  sourceId: "rbi-dbie",
  sourceIndicatorId: "dbie_getImpalaDQActionEnhanced:CSURYSOR_F_RN+CSURYCOM_F_RN",
  sourceUrl: SOURCE_URL,
  unit: "mixed",
  fetchedAt,
  rows: allRows,
  dimensions: ["group", "series", "frequency", "period"],
  metadata: {
    elements: elementMeta,
    parseSnapshot: snapshot.path,
    method: "SDMX Data Query (policy->DDL->Impala); valid rows where Components-and-sources (Merger) = Not applicable; VALUE rupees converted to INR crore",
    derivedSeries: ["Food Credit (derived) = Bank Credit - Non-food Credit", "Credit-Deposit Ratio (derived)", "Cash-Deposit Ratio (derived)"],
    recipe: "data/catalog/rbi-dbie-dsd-working-recipe.json"
  }
});

const artifactPath = await writeSeriesArtifact({ sourceId: "rbi-dbie", name: "rbi-dbie.IN.banking.rbi.commercial_survey_fortnightly.long", artifact });
await mergeSourceManifest("rbi-dbie", [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  snapshot: snapshot.path,
  rows: allRows.length,
  fetchedAt,
  sourceUrl: SOURCE_URL,
  evidenceStatus: "evidence_ready_dsd_impala_rows"
}]);

console.log(JSON.stringify({ ok: true, artifact: artifactPath, snapshot: snapshot.path, summary }, null, 2));
