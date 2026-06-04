import { mkdir, writeFile } from "node:fs/promises";
import {
  createSeriesArtifact,
  hashObject,
  mergeSourceManifest,
  readJson,
  stableJson,
  writeSeriesArtifact,
  writeSnapshot
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const PARENT_ARTIFACTS = {
  macro50: "data/series/rbi-dbie.IN.macro_50_indicators.long.json",
  macroOther: "data/series/rbi-dbie.IN.macro_other_timeseries.long.json"
};

const SERIES = [
  // Monetary policy and rates.
  { id: "monetary.rbi.policy_repo_rate_weekly", title: "RBI policy repo rate", parent: "macro50", frequency: "Weekly", label: "Policy Repo Rate (%)", unit: "Percent", min: 400 },
  { id: "monetary.rbi.sdf_rate_weekly", title: "RBI standing deposit facility rate", parent: "macro50", frequency: "Weekly", label: "Standing Deposit Facility (SDF) Rate (%)", unit: "Percent", min: 100 },
  { id: "monetary.rbi.reverse_repo_rate_weekly", title: "RBI reverse repo rate", parent: "macro50", frequency: "Weekly", label: "Reverse Repo Rate (%)", unit: "Percent", min: 400 },
  { id: "monetary.rbi.msf_rate_weekly", title: "RBI marginal standing facility rate", parent: "macro50", frequency: "Weekly", label: "Marginal Standing Facility (MSF) Rate (%)", unit: "Percent", min: 400 },
  { id: "monetary.rbi.bank_rate_weekly", title: "RBI bank rate", parent: "macro50", frequency: "Weekly", label: "Bank Rate (%)", unit: "Percent", min: 400 },
  { id: "monetary.rbi.cash_reserve_ratio_weekly", title: "RBI cash reserve ratio", parent: "macro50", frequency: "Weekly", label: "Cash Reserve Ratio (%)", unit: "Percent", min: 400 },
  { id: "monetary.rbi.statutory_liquidity_ratio_weekly", title: "RBI statutory liquidity ratio", parent: "macro50", frequency: "Weekly", label: "Statutory Liquidity Ratio (%)", unit: "Percent", min: 400 },
  { id: "money_market.rbi.overnight_repo_rate_daily", title: "RBI overnight repo rate", parent: "macroOther", frequency: "Daily", label: "REPO RATE (OVERNIGHT)", unit: "Per cent", min: 2500 },
  { id: "money_market.rbi.overnight_reverse_repo_rate_daily", title: "RBI overnight reverse repo rate", parent: "macroOther", frequency: "Daily", label: "REVERSE REPO RATE (OVERNIGHT)", unit: "Per cent", min: 2500 },
  { id: "money_market.rbi.call_money_high_daily", title: "Daily call money rate high", parent: "macroOther", frequency: "Daily", label: "DAILY CALL MONEY RATE -HIGH", unit: "Per cent", min: 2500 },
  { id: "money_market.rbi.call_money_low_daily", title: "Daily call money rate low", parent: "macroOther", frequency: "Daily", label: "DAILY CALL MONEY RATE - LOW", unit: "Per cent", min: 2500 },

  // Financial markets.
  { id: "market.rbi.gsec_10y_yield_weekly", title: "10-year government security yield", parent: "macro50", frequency: "Weekly", label: "10-Year G-Sec Yield (FBIL) (%)", unit: "Percent", min: 400 },
  { id: "market.rbi.tbill_91d_yield_weekly", title: "91-day Treasury Bill primary yield", parent: "macro50", frequency: "Weekly", label: "91-Day Treasury Bill (Primary) Yield (%)", unit: "Percent", min: 400 },
  { id: "market.rbi.nifty_daily", title: "NSE S&P CNX NIFTY index", parent: "macroOther", frequency: "Daily", label: "NSE S&P CNX NIFTY", unit: "Index", min: 2000 },
  { id: "market.rbi.bse_bankex_daily", title: "BSE BANKEX index", parent: "macroOther", frequency: "Daily", label: "BSE BANKEX", unit: "Index", min: 2000 },
  { id: "market.rbi.bse_market_cap_monthly", title: "BSE market capitalisation", parent: "macroOther", frequency: "Monthly", label: "MARKET CAPITALISATION - BSE", unit: "₹ Crore", min: 100 },
  { id: "finance.rbi.commercial_paper_outstanding_monthly", title: "Commercial paper amount outstanding", parent: "macro50", frequency: "Monthly", label: "Commercial Paper (Amount Outstanding) (₹ Crore)", unit: "₹ Crore", min: 50 },

  // Banking, money, and credit.
  { id: "banking.rbi.bank_credit_fortnightly", title: "Bank credit", parent: "macro50", frequency: "Fortnightly", label: "Bank Credit (₹ Crore)", unit: "₹ Crore", min: 200 },
  { id: "banking.rbi.non_food_credit_fortnightly", title: "Non-food credit", parent: "macro50", frequency: "Fortnightly", label: "Non Food Credit (₹ Crore)", unit: "₹ Crore", min: 200 },
  { id: "banking.rbi.aggregate_deposits_fortnightly", title: "Aggregate bank deposits", parent: "macro50", frequency: "Fortnightly", label: "Aggregate Desposits (₹ Crore)", unit: "₹ Crore", min: 200 },
  { id: "banking.rbi.credit_deposit_ratio_fortnightly", title: "Credit-deposit ratio", parent: "macro50", frequency: "Fortnightly", label: "Credit Deposit Ratio (%)", unit: "Percent", min: 100 },
  { id: "banking.rbi.credit_to_commercial_sector_monthly", title: "Credit to the commercial sector by the banking system", parent: "macroOther", frequency: "Monthly", label: "CREDIT TO THE COMMERCIAL SECTOR BY THE BANKING SYSTEM", unit: "₹ Crore", min: 300 },
  { id: "banking.rbi.govt_plus_commercial_credit_monthly", title: "Credit to government and commercial sector by the banking system", parent: "macroOther", frequency: "Monthly", label: "SUM OF CREDIT TO THE GOVERNMENT & CREDIT TO THE COMMERCIAL SECTOR BY THE BANKING SYSTEM", unit: "₹ Crore", min: 300 },
  { id: "banking.rbi.personal_loans_monthly", title: "Personal loans outstanding", parent: "macroOther", frequency: "Monthly", label: "Personal Loans - DEPLOYMENT OF BANK CREDIT BY MAJOR SECTORS", unit: "₹ Crore", min: 100 },
  { id: "banking.rbi.housing_credit_monthly", title: "Housing credit outstanding", parent: "macroOther", frequency: "Monthly", label: "Housing (Including Priority Sector Housing) - DEPLOYMENT OF BANK CREDIT BY MAJOR SECTORS", unit: "₹ Crore", min: 100 },
  { id: "money.rbi.m1_monthly", title: "Money supply M1", parent: "macroOther", frequency: "Monthly", label: "M1", unit: "₹ Crore", min: 100 },
  { id: "money.rbi.m3_fortnightly", title: "Money supply M3 fortnightly", parent: "macro50", frequency: "Fortnightly", label: "M3 (₹ Crore)", unit: "₹ Crore", min: 200 },
  { id: "money.rbi.m3_monthly", title: "Money supply M3 monthly", parent: "macroOther", frequency: "Monthly", label: "M3", unit: "₹ Crore", min: 100 },
  { id: "money.rbi.currency_with_public_monthly", title: "Currency with the public", parent: "macroOther", frequency: "Monthly", label: "CURRENCY WITH THE PUBLIC", unit: "₹ Crore", min: 100 },

  // Prices and production.
  { id: "prices.rbi.cpi_2024_monthly", title: "Consumer Price Index, 2024 base", parent: "macro50", frequency: "Monthly", label: "Consumer Price Index (2024=100)", unit: "Index", min: 10 },
  { id: "prices.rbi.cpi_2012_monthly", title: "Consumer Price Index, 2012 base", parent: "macro50", frequency: "Monthly", label: "Consumer Price Index (2012=100)", unit: "Index", min: 80 },
  { id: "prices.rbi.wpi_monthly", title: "Wholesale Price Index", parent: "macro50", frequency: "Monthly", label: "Wholesale Price Index (2011-12=100)", unit: "Index", min: 80 },
  { id: "prices.rbi.wpi_all_commodity_monthly", title: "WPI all commodities", parent: "macroOther", frequency: "Monthly", label: "WPI-Monthly-ALL COMMODITY", unit: "Index", min: 100 },
  { id: "industry.rbi.iip_monthly", title: "Index of Industrial Production", parent: "macro50", frequency: "Monthly", label: "Index of Industrial Production", unit: "Index", min: 80 },

  // External sector.
  { id: "external.rbi.trade_exports_usd_monthly", title: "Foreign trade exports", parent: "macro50", frequency: "Monthly", label: "Foreign Trade Exports Total (US $ Million)", unit: "US $ Million", min: 80 },
  { id: "external.rbi.trade_imports_usd_monthly", title: "Foreign trade imports", parent: "macro50", frequency: "Monthly", label: "Foreign Trade Imports Total (US $ Million)", unit: "US $ Million", min: 80 },
  { id: "external.rbi.trade_balance_usd_monthly", title: "Foreign trade balance", parent: "macro50", frequency: "Monthly", label: "Foreign Trade Balance Total (US $ Million)", unit: "US $ Million", min: 80 },
  { id: "external.rbi.fdi_net_usd_monthly", title: "Net foreign direct investment", parent: "macro50", frequency: "Monthly", label: "Net Foreign Direct Investment (US $ Million)", unit: "US $ Million", min: 80 },
  { id: "external.rbi.portfolio_investment_net_usd_monthly", title: "Net portfolio investment", parent: "macro50", frequency: "Monthly", label: "Net Portfolio Investment (US $ Million)", unit: "US $ Million", min: 80 },
  { id: "external.rbi.bop_overall_balance_usd_quarterly", title: "Overall balance of payments", parent: "macro50", frequency: "Quarterly", label: "Overall Balance of Payments Net (US $ Million)", unit: "US $ Million", min: 30 },
  { id: "external.rbi.external_debt_gross_usd_quarterly", title: "Gross external debt", parent: "macro50", frequency: "Quarterly", label: "India's External Debt - Gross Total (US $ Million)", unit: "US $ Million", min: 20 },
  { id: "external.rbi.current_account_balance_inr_quarterly", title: "Current account balance", parent: "macroOther", frequency: "Quarterly", label: "BoP - CURRENT ACCOUNT BALANCE INR", unit: "₹ Crore", min: 40 },

  // Payments and public finance.
  { id: "payments.rbi.total_digital_payments_monthly", title: "Total digital payments", parent: "macro50", frequency: "Monthly", label: "Total Digital Payments (₹ Crore)", unit: "₹ Crore", min: 50 },
  { id: "payments.rbi.total_retail_payments_monthly", title: "Total retail payments", parent: "macro50", frequency: "Monthly", label: "Total Retail Payments (₹ Crore)", unit: "₹ Crore", min: 50 },
  { id: "public_finance.rbi.fiscal_deficit_monthly", title: "Fiscal deficit", parent: "macroOther", frequency: "Monthly", label: "FISCAL DEFICIT", unit: "₹ Crore", min: 100 },
  { id: "public_finance.rbi.total_revenue_monthly", title: "Government total revenue", parent: "macroOther", frequency: "Monthly", label: "TOTAL REVENUE", unit: "₹ Crore", min: 100 },
  { id: "public_finance.rbi.total_expenditure_monthly", title: "Government total expenditure", parent: "macroOther", frequency: "Monthly", label: "TOTAL EXPENDITURE", unit: "₹ Crore", min: 100 },

  // National accounts and housing.
  { id: "national_accounts.rbi.gdp_current_quarterly", title: "GDP at market prices, current", parent: "macroOther", frequency: "Quarterly", label: "GDP AT MARKET PRICES CURRENT", unit: "₹ Crore", min: 40 },
  { id: "national_accounts.rbi.gdp_constant_quarterly", title: "GDP at market prices, constant", parent: "macroOther", frequency: "Quarterly", label: "GDP AT MARKET PRICES CONSTANT", unit: "₹ Crore", min: 40 },
  { id: "national_accounts.rbi.private_consumption_constant_quarterly", title: "Private final consumption expenditure, constant", parent: "macroOther", frequency: "Quarterly", label: "PRIVATE FINAL CONSUMPTION EXPENDITURE CONSTANT", unit: "₹ Crore", min: 40 },
  { id: "national_accounts.rbi.gfcf_current_quarterly", title: "Gross fixed capital formation, current", parent: "macroOther", frequency: "Quarterly", label: "GROSS FIXED CAPITAL FORMATION CURRENT", unit: "₹ Crore", min: 40 },
  { id: "housing.rbi.house_price_index_quarterly", title: "All India House Price Index", parent: "macroOther", frequency: "Quarterly", label: "ALL INDIA HOUSE PRICE INDEX (Base-Year : Q1:2010-11)", unit: "Index", min: 40 }
];

function frequencySlug(value) {
  return String(value).toLowerCase();
}

function assertDefinitionUniqueness() {
  const ids = new Set();
  for (const definition of SERIES) {
    if (ids.has(definition.id)) throw new Error(`Duplicate derived RBI series id: ${definition.id}`);
    ids.add(definition.id);
  }
}

function rowsForDefinition(parent, definition) {
  const rows = parent.rows.filter((row) => (
    row.frequency === definition.frequency
    && row.indicatorLabel === definition.label
    && row.unit === definition.unit
    && Number.isFinite(row.NumericValue)
  ));
  rows.sort((a, b) => a.period.localeCompare(b.period));
  return rows;
}

function assertRows(definition, rows) {
  if (rows.length < definition.min) {
    throw new Error(`${definition.id} has ${rows.length} observations, below minimum ${definition.min}`);
  }
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.period)) throw new Error(`${definition.id} has duplicate period ${row.period}`);
    seen.add(row.period);
    if (definition.unit.toLowerCase().includes("percent") || definition.unit.toLowerCase().includes("cent")) {
      if (row.NumericValue < -100 || row.NumericValue > 100) {
        throw new Error(`${definition.id} has implausible percentage value ${row.NumericValue} at ${row.period}`);
      }
    }
  }
}

function observationsFromRows(rows) {
  return rows.map((row) => ({
    date: row.period,
    value: row.NumericValue,
    sourcePeriodType: row.periodType,
    sourceDate: row.date
  }));
}

function latestObservation(observations) {
  for (let index = observations.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(observations[index].value)) return observations[index];
  }
  return null;
}

assertDefinitionUniqueness();

const parents = Object.fromEntries(await Promise.all(
  Object.entries(PARENT_ARTIFACTS).map(async ([key, path]) => {
    const artifact = await readJson(path);
    if (artifact?.artifactType !== "table" || !Array.isArray(artifact.rows)) {
      throw new Error(`${path} is not a table artifact`);
    }
    return [key, { path, artifact, hash: hashObject(artifact) }];
  })
));

const manifestEntries = [];
const catalogRows = [];

for (const definition of SERIES) {
  const parent = parents[definition.parent];
  if (!parent) throw new Error(`${definition.id} references unknown parent ${definition.parent}`);
  const sourceRows = rowsForDefinition(parent.artifact, definition);
  assertRows(definition, sourceRows);

  const observations = observationsFromRows(sourceRows);
  const artifact = createSeriesArtifact({
    indicatorId: definition.id,
    title: definition.title,
    sourceId: "rbi-dbie",
    sourceIndicatorId: `${parent.artifact.sourceIndicatorId}:${definition.frequency}:${definition.label}`,
    sourceUrl: parent.artifact.sourceUrl,
    unit: definition.unit,
    frequency: frequencySlug(definition.frequency),
    fetchedAt,
    observations,
    dimensions: ["period"],
    metadata: {
      derivedFrom: parent.path,
      derivedFromHash: parent.hash,
      parentIndicatorId: parent.artifact.indicatorId,
      sourceDatasetKey: sourceRows[0]?.datasetKey || null,
      sourceFrequency: definition.frequency,
      sourceIndicatorLabel: definition.label,
      sourceUnit: definition.unit,
      qualityGates: [
        "exact source label/frequency/unit match",
        "finite numeric values only",
        "unique period keys",
        "minimum observation count"
      ]
    }
  });

  const artifactPath = await writeSeriesArtifact({
    sourceId: "rbi-dbie",
    name: `rbi-dbie.IN.${definition.id}`,
    artifact
  });

  const latest = latestObservation(observations);
  catalogRows.push({
    indicatorId: definition.id,
    title: definition.title,
    parentArtifact: parent.path,
    sourceIndicatorLabel: definition.label,
    frequency: artifact.frequency,
    unit: definition.unit,
    observations: observations.length,
    firstPeriod: observations[0]?.date || null,
    latestPeriod: latest?.date || null,
    latestValue: latest?.value ?? null,
    artifact: artifactPath
  });
}

const snapshot = await writeSnapshot("rbi-dbie", "derived-macro-series", {
  schemaVersion: 1,
  fetchedAt,
  parentArtifacts: Object.fromEntries(
    Object.entries(parents).map(([key, parent]) => [key, { path: parent.path, hash: parent.hash, indicatorId: parent.artifact.indicatorId }])
  ),
  series: catalogRows
});

for (const row of catalogRows) {
  manifestEntries.push({
    status: "ready",
    indicatorId: row.indicatorId,
    sourceIndicatorId: `${row.parentArtifact}:${row.frequency}:${row.sourceIndicatorLabel}`,
    artifact: row.artifact,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    observations: row.observations,
    fetchedAt,
    sourceUrl: "https://data.rbi.org.in/DBIE/#/dbie/home"
  });
}

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/rbi-dbie-derived-series.json", `${stableJson({
  schemaVersion: 1,
  fetchedAt,
  snapshot: snapshot.path,
  series: catalogRows
})}\n`);

await mergeSourceManifest("rbi-dbie", manifestEntries);

console.log(JSON.stringify({
  ok: true,
  derivedSeries: catalogRows.length,
  observations: catalogRows.reduce((sum, row) => sum + row.observations, 0),
  snapshot: snapshot.path
}, null, 2));
