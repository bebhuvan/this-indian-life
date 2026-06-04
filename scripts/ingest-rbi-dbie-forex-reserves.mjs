import { fetchDbieSession, postDbieJson, RBI_DBIE_HOME } from "./adapters/rbi-dbie.mjs";
import { createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const fromDate = process.env.RBI_DBIE_FOREX_FROM_DATE || "2001-04-01";
const toDate = process.env.RBI_DBIE_FOREX_TO_DATE || new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
const frequency = "Weekly";

const currencyCodes = ["USD", "INR"];
const reserveCodes = [
  { code: "TR", label: "Total Reserves", displayOrder: 1 },
  { code: "FCA", label: "Foreign Currency Assets", displayOrder: 2 },
  { code: "GOLD", label: "Gold", displayOrder: 3 },
  { code: "SDR", label: "SDRs", displayOrder: 4 },
  { code: "IMF", label: "Reserve Position in the IMF", displayOrder: 5 }
];

function indiaDateFromEpochMillis(value) {
  if (!Number.isFinite(Number(value))) throw new Error(`Invalid DBIE timeDate: ${value}`);
  return new Date(Number(value) + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function normalizeRow(row, request) {
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) throw new Error(`Invalid DBIE forex reserve amount for ${request.currencyCode}/${request.reserveCode}`);
  return {
    date: indiaDateFromEpochMillis(row.timeDate),
    day: row.timeDay || null,
    currencyCode: row.currencyCode || request.currencyCode,
    currencyDescription: row.currencyDescription || null,
    reserveCode: row.fxReservesCode || request.reserveCode,
    reserveDescription: row.fxReservesDescription || null,
    reserveDisplayOrder: Number.isFinite(Number(row.fxReservesDisplayOrder)) ? Number(row.fxReservesDisplayOrder) : request.displayOrder,
    fiscalYear: String(row.timeFisYear || "").trim() || null,
    fiscalYearEnd: row.timeFisEndOfYear || null,
    unitCode: Number.isFinite(Number(row.unit)) ? Number(row.unit) : null,
    unitDescription: row.unitDescription || null,
    NumericValue: amount
  };
}

function assertRows(rows, request) {
  if (!rows.length) throw new Error(`DBIE forex reserves returned zero rows for ${request.currencyCode}/${request.reserveCode}`);
  const seenDates = new Set();
  for (const [index, row] of rows.entries()) {
    if (row.currencyCode !== request.currencyCode) {
      throw new Error(`DBIE forex reserves row ${index} currency mismatch: expected ${request.currencyCode}, got ${row.currencyCode}`);
    }
    if (row.reserveCode !== request.reserveCode) {
      throw new Error(`DBIE forex reserves row ${index} reserve code mismatch: expected ${request.reserveCode}, got ${row.reserveCode}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) throw new Error(`DBIE forex reserves row ${index} has invalid date ${row.date}`);
    if (seenDates.has(row.date)) throw new Error(`DBIE forex reserves duplicate date ${row.date} for ${request.currencyCode}/${request.reserveCode}`);
    seenDates.add(row.date);
    if (row.NumericValue < 0) throw new Error(`DBIE forex reserves row ${index} has negative amount`);
  }
}

function assertComponentSums(rows) {
  const byCurrencyDate = new Map();
  const summary = {
    checked: 0,
    toleranceRatio: 0.0001,
    maxAbsoluteDifference: 0,
    maxRelativeDifference: 0,
    maxDifferenceKey: null
  };
  for (const row of rows) {
    const key = `${row.currencyCode}|${row.date}`;
    if (!byCurrencyDate.has(key)) byCurrencyDate.set(key, new Map());
    byCurrencyDate.get(key).set(row.reserveCode, row.NumericValue);
  }

  for (const [key, values] of byCurrencyDate.entries()) {
    const missing = ["TR", "FCA", "GOLD", "SDR", "IMF"].filter((code) => !values.has(code));
    if (missing.length) throw new Error(`DBIE forex reserves component check missing ${missing.join(", ")} for ${key}`);
    const total = values.get("TR");
    const componentSum = values.get("FCA") + values.get("GOLD") + values.get("SDR") + values.get("IMF");
    const difference = Math.abs(total - componentSum);
    const relativeDifference = total === 0 ? 0 : difference / Math.abs(total);
    summary.checked += 1;
    if (difference > summary.maxAbsoluteDifference) {
      summary.maxAbsoluteDifference = difference;
      summary.maxRelativeDifference = relativeDifference;
      summary.maxDifferenceKey = key;
    }
    if (relativeDifference > summary.toleranceRatio) {
      throw new Error(`DBIE forex reserves component check failed for ${key}: total=${total}, components=${componentSum}`);
    }
  }
  return summary;
}

const session = await fetchDbieSession({ timeoutMs: 60000 });
const rawResponses = [];
const rows = [];

for (const currencyCode of currencyCodes) {
  for (const reserve of reserveCodes) {
    const request = { currencyCode, reserveCode: reserve.code, displayOrder: reserve.displayOrder };
    const result = await postDbieJson(
      "/dbie_foreignExchangeReserves",
      {
        body: {
          currencyCode,
          reserveCode: reserve.code,
          fromDate: `${fromDate} 00:00:00`,
          toDate: `${toDate} 00:00:00`,
          frequency
        }
      },
      { session, timeoutMs: 60000 }
    );
    if (result.json?.header?.status !== "success") {
      throw new Error(`DBIE forex reserves header status was not success for ${currencyCode}/${reserve.code}`);
    }
    const resultRows = result.json?.body?.resultList;
    if (!Array.isArray(resultRows)) throw new Error(`DBIE forex reserves missing resultList for ${currencyCode}/${reserve.code}`);
    const normalized = resultRows.map((row) => normalizeRow(row, request)).sort((a, b) => a.date.localeCompare(b.date));
    assertRows(normalized, request);
    rows.push(...normalized);
    rawResponses.push({
      request: { currencyCode, reserveCode: reserve.code, fromDate, toDate, frequency },
      header: result.json.header,
      rows: resultRows
    });
    console.log(`rbi-dbie forex reserves ${currencyCode}/${reserve.code}: ${normalized.length} rows`);
  }
}

rows.sort((a, b) => (
  a.currencyCode.localeCompare(b.currencyCode)
  || a.reserveDisplayOrder - b.reserveDisplayOrder
  || a.date.localeCompare(b.date)
));
const componentReconciliation = assertComponentSums(rows);

const snapshot = await writeSnapshot("rbi-dbie", `forex-reserves.${fromDate}.${toDate}`, {
  endpoint: "/dbie_foreignExchangeReserves",
  fetchedAt,
  rawResponses
});

const artifact = createTableArtifact({
  indicatorId: "external.rbi.forex_reserves_weekly",
  title: "RBI weekly foreign exchange reserves",
  sourceId: "rbi-dbie",
  sourceIndicatorId: "dbie_foreignExchangeReserves.Weekly.TR,FCA,GOLD,SDR,IMF.USD,INR",
  sourceUrl: RBI_DBIE_HOME,
  unit: "actual_currency_units",
  fetchedAt,
  rows,
  dimensions: ["date", "currencyCode", "reserveCode"],
  metadata: {
    fromDate,
    toDate,
    frequency,
    reserveCodes,
    validation: "For every date and currency, TR is reconciled against FCA + GOLD + SDR + IMF with a 0.01% tolerance for published rounding/revaluation differences.",
    componentReconciliation
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "rbi-dbie",
  name: "rbi-dbie.IN.forex_reserves.weekly",
  artifact
});

await mergeSourceManifest("rbi-dbie", [
  {
    status: "ready",
    indicatorId: artifact.indicatorId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    artifact: artifactPath,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    rows: rows.length,
    fetchedAt,
    sourceUrl: RBI_DBIE_HOME
  }
]);

console.log(`Wrote RBI DBIE forex reserves artifact with ${rows.length} rows.`);
