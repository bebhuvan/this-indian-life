import { writeFile, mkdir } from "node:fs/promises";
import { fetchIndiaEconomySeries, indiaDataHubUrl } from "./adapters/indiadatahub.mjs";
import { writeSnapshot, stableJson } from "./core/artifacts.mjs";
import { fetchJson } from "./lib/source-http.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";

function compactSeries(row) {
  return {
    identifier: row.Identifier,
    title: row.Title,
    category: row.Category,
    subcategory: row.SubCategory,
    frequency: row.Frequency,
    unit: row.Unit,
    source: row.Source,
    child: row.Child,
    discontinued: row.Discontinued,
    stateData: row.StateData,
    startDate: row.StartDate,
    endDate: row.EndDate,
    modifiedDate: row.modified_date
  };
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/\s*\((?:monthly|Monthly, Old Classification|Monthly, Adj for mergers)\)\s*$/i, "")
    .replace(/^Non-Food Credit of Scheduled Commercial Banks\s*-\s*/i, "")
    .replace(/^Scheduled Commercial Banks Credit to Industry\s*-\s*/i, "")
    .replace(/^Priority Sector Loans of Scheduled Commercial Banks\s*-\s*/i, "")
    .replace(/^Outstanding\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function scope(row) {
  const title = String(row.Title || "");
  if (/^Non-Food Credit of Scheduled Commercial Banks\s*-/i.test(title)) return "nonFoodSectoral";
  if (/^Scheduled Commercial Banks Credit to Industry\s*-/i.test(title)) return "industryDetail";
  if (/^Priority Sector Loans of Scheduled Commercial Banks\s*-/i.test(title)) return "prioritySector";
  if (/^Outstanding Non-Food Credit of Scheduled Commercial Banks/i.test(title)) return "aggregate";
  return "other";
}

function variant(row) {
  const title = String(row.Title || "");
  if (/Old Classification/i.test(title)) return "oldClassification";
  if (/Adj for mergers/i.test(title)) return "adjustedForMergers";
  return "current";
}

function family(row) {
  const title = String(row.Title || "");
  if (/Scheduled Commercial Banks Credit to Industry|Industry|Infrastructure|Power|Telecommunications|Roads|Airports|Ports|Railways|Mining|Food Processing|Textiles|Basic Metal|Engineering|Chemicals|Construction|Petroleum|Cement|Gems|Vehicles, Vehicle Parts|Rubber|Paper|Wood|Leather|Glass|Beverage|Sugar|Tea|Electronics|Drugs|Fertilisers|Petrochemicals/i.test(title)) return "industry";
  if (/Services|Transport Operators|Computer Software|Tourism|Shipping|Aviation|Professional Services|Trade|Wholesale|Retail|Commercial Real Estate|NBFC|HFC|PFI/i.test(title)) return "services";
  if (/Personal Loans|Consumer Durable|Credit Card|Education|Gold Loans|Fixed Deposits|Shares, Bonds|Vehicle Loans|Mortgage|Other Personal/i.test(title)) return "personal";
  if (/Agriculture/i.test(title)) return "agriculture";
  if (/Priority Sector/i.test(title)) return "prioritySector";
  if (/Food Credit|Non-Food Credit|Outstanding Credit|Scheduled Commercial Banks/i.test(title)) return "aggregate";
  return "other";
}

function rowsFromPayload(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  return Array.isArray(dataset?.data) ? dataset.data : [];
}

function observationSummary(raw) {
  const rows = rowsFromPayload(raw)
    .map((row) => ({
      date: String(row.Date || row.date || ""),
      value: row.India === null || row.India === undefined ? null : Number(row.India)
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    observations: rows.length,
    first: rows[0] || null,
    latest: rows.at(-1) || null
  };
}

const categoryRows = await fetchJson(indiaDataHubUrl("/economy/filter_category", {
  category: "Banking",
  subcategory: "Credit"
}));
const categorySnapshot = await writeSnapshot("indiadatahub", "banking-credit-filter-category", categoryRows);

const monthly = categoryRows
  .filter((row) => row.Frequency === "Monthly")
  .map((row) => ({
    ...compactSeries(row),
    family: family(row),
    scope: scope(row),
    variant: variant(row),
    normalizedLabel: cleanTitle(row.Title)
  }))
  .sort((a, b) => `${a.scope}:${a.family}:${a.normalizedLabel}:${a.variant}`.localeCompare(`${b.scope}:${b.family}:${b.normalizedLabel}:${b.variant}`));

const groupedMonthly = new Map();
for (const row of monthly) {
  const key = `${row.scope}\u0000${row.family}\u0000${row.normalizedLabel}`;
  if (!groupedMonthly.has(key)) {
    groupedMonthly.set(key, {
      scope: row.scope,
      family: row.family,
      label: row.normalizedLabel,
      variants: {}
    });
  }
  groupedMonthly.get(key).variants[row.variant] = row;
}

const recommendedLabels = new Set([
  "Non-Food Credit of Scheduled Commercial Banks",
  "Agriculture",
  "Industry",
  "Services",
  "Personal Loans",
  "Consumer Durable Loans",
  "Credit Card Outstanding",
  "Education Loans",
  "Gold Loans",
  "Loans against Fixed Deposits",
  "Loans against Shares, Bonds etc",
  "Mortgage Loans",
  "Other Personal Loans",
  "Vehicle Loans",
  "NBFCs",
  "Trade",
  "Retail Trade",
  "Wholesale Trade",
  "Commercial Real Estate",
  "Transport Operators",
  "Professional Services",
  "Infrastructure",
  "Power",
  "Roads",
  "Basic Metal and Metal Products",
  "Engineering",
  "Chemicals",
  "Construction",
  "Textiles",
  "Food Processing"
]);

const dataChecks = [];
for (const group of groupedMonthly.values()) {
  if (!recommendedLabels.has(group.label)) continue;
  for (const row of Object.values(group.variants)) {
    if (!["current", "oldClassification"].includes(row.variant)) continue;
    try {
      const raw = await fetchIndiaEconomySeries({ id: row.identifier, fields: "India" });
      dataChecks.push({
        identifier: row.identifier,
        label: group.label,
        scope: group.scope,
        family: group.family,
        variant: row.variant,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        unit: row.unit,
        ...observationSummary(raw)
      });
    } catch (error) {
      dataChecks.push({
        identifier: row.identifier,
        label: group.label,
        scope: group.scope,
        family: group.family,
        variant: row.variant,
        title: row.title,
        status: "failed",
        error: error.message
      });
    }
  }
}

const annualOrQuarterlyBsr = categoryRows
  .filter((row) => /(Annual|Quarterly)/.test(row.Frequency) && /BSR1|Individual Personal Loans|Scheduled Commercial Banks/i.test(row.Title || ""))
  .map(compactSeries)
  .sort((a, b) => `${a.frequency}:${a.title}`.localeCompare(`${b.frequency}:${b.title}`));

const report = {
  schemaVersion: 1,
  generatedAt: fetchedAt,
  sourceId: "indiadatahub",
  sourceUrl,
  purpose: "Probe IndiaDataHub Banking/Credit coverage for a long-history How India borrows article.",
  categorySnapshot,
  summary: {
    totalBankingCreditSeries: categoryRows.length,
    monthlySeries: monthly.length,
    groupedMonthlyLineItems: groupedMonthly.size,
    currentMonthlyLineItems: monthly.filter((row) => row.variant === "current").length,
    oldClassificationMonthlyLineItems: monthly.filter((row) => row.variant === "oldClassification").length,
    adjustedForMergersMonthlyLineItems: monthly.filter((row) => row.variant === "adjustedForMergers").length,
    annualOrQuarterlyBsrSeries: annualOrQuarterlyBsr.length
  },
  monthlyGroups: [...groupedMonthly.values()],
  dataChecks,
  annualOrQuarterlyBsr,
  articleGuidance: {
    recommendedPrimaryFrame: "Use monthly IndiaDataHub Banking/Credit current plus old-classification pairs for April 2007 onward, with a visible taxonomy break at January 2019.",
    personalLoanBreakout: "Break personal loans into monthly subcomponents where available: vehicle, credit card outstanding, education, consumer durable, loans against fixed deposits, loans against shares/bonds, mortgage, other personal, and gold.",
    goldLoanCaveat: "Gold loans have current monthly coverage from January 2019 but no old-classification monthly pair in this probe; RBI also has a May 2024 classification caveat.",
    bsrUse: "Use annual and quarterly BSR1 series for account counts, bank-group splits, gender/location/state details, not as the main monthly composition chart."
  }
};

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/indiadatahub-banking-credit-probe.json", `${stableJson(report)}\n`);

console.log(`IDH Banking/Credit series: ${report.summary.totalBankingCreditSeries}`);
console.log(`Monthly series: ${report.summary.monthlySeries}; grouped line items: ${report.summary.groupedMonthlyLineItems}`);
console.log(`Old-classification monthly line items: ${report.summary.oldClassificationMonthlyLineItems}`);
console.log(`Data checks: ${dataChecks.length}`);
