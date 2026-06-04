import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createTableArtifact, stableJson, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";

const fallbackLineItems = [
  { scope: "aggregate", family: "aggregate", label: "Non-Food Credit", variants: { current: "BKASCBNFCO11M", adjustedForMergers: "BKASSBCRAD19M" } },

  { scope: "nonFoodSectoral", family: "agriculture", label: "Agriculture", variants: { current: "BKASNFCAGA11M", oldClassification: "BKAONFCAGA11M", adjustedForMergers: "BKASNFAGAD19M" } },
  { scope: "nonFoodSectoral", family: "industry", label: "Industry", variants: { current: "BKASNFCIND11M", oldClassification: "BKAONFCIND11M", adjustedForMergers: "BKASNFINAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Services", variants: { current: "BKASNFCSVC11M", oldClassification: "BKAONFCSVC11M", adjustedForMergers: "BKASNFSVAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Personal Loans", variants: { current: "BKASNFCPER11M", oldClassification: "BKAONFCPER11M", adjustedForMergers: "BKASNFPLAD19M" } },

  { scope: "nonFoodSectoral", family: "personal", label: "Housing / Mortgage Loans", sourceLabel: "Mortgage Loans", variants: { current: "BKASNFCPMG11M", oldClassification: "BKAONFCPMG11M", adjustedForMergers: "BKASNFMGAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Vehicle Loans", variants: { current: "BKASNFCPVL11M", oldClassification: "BKAONFCPVL11M", adjustedForMergers: "BKASNFVLAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Credit Card Outstanding", variants: { current: "BKASNFCPCC11M", oldClassification: "BKAONFCPCC11M", adjustedForMergers: "BKASNFCCAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Education Loans", variants: { current: "BKASNFCPEL11M", oldClassification: "BKAONFCPEL11M", adjustedForMergers: "BKASNFELAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Gold Loans", variants: { current: "BKASNFCPGD11M", adjustedForMergers: "BKASNFGLAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Other Personal Loans", variants: { current: "BKASNFCPOT11M", oldClassification: "BKAONFCPOT11M", adjustedForMergers: "BKASNFOPAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Consumer Durable Loans", variants: { current: "BKASNFCPCD11M", oldClassification: "BKAONFCPCD11M", adjustedForMergers: "BKASNFCDAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Loans against Fixed Deposits", variants: { current: "BKASNFCPFD11M", oldClassification: "BKAONFCPFD11M", adjustedForMergers: "BKASNFFDAD19M" } },
  { scope: "nonFoodSectoral", family: "personal", label: "Loans against Shares/Bonds", sourceLabel: "Loans against Shares, Bonds etc", variants: { current: "BKASNFCPLS11M", oldClassification: "BKAONFCPLS11M", adjustedForMergers: "BKASNFLSAD19M" } },

  { scope: "nonFoodSectoral", family: "services", label: "NBFCs", variants: { current: "BKASNFCSNB11M", oldClassification: "BKAONFCSNB11M", adjustedForMergers: "BKASNFNBAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Trade", variants: { current: "BKASNFCTRD11M", oldClassification: "BKAONFCTRD11M", adjustedForMergers: "BKASNFTRAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Wholesale Trade", variants: { current: "BKASNFCSWT11M", oldClassification: "BKAONFCSWT11M", adjustedForMergers: "BKASNFWTAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Retail Trade", variants: { current: "BKASNFCSRT11M", oldClassification: "BKAONFCSRT11M", adjustedForMergers: "BKASNFRTAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Commercial Real Estate", variants: { current: "BKASNFCSCR11M", oldClassification: "BKAONFCSCR11M", adjustedForMergers: "BKASNFCRAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Transport Operators", variants: { current: "BKASNFCSTO11M", oldClassification: "BKAONFCSTO11M", adjustedForMergers: "BKASNFTOAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Professional Services", variants: { current: "BKASNFCSPS11M", oldClassification: "BKAONFCSPS11M", adjustedForMergers: "BKASNFPSAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "Other Services", variants: { current: "BKASNFCSOT11M", oldClassification: "BKAONFCSOT11M", adjustedForMergers: "BKASNFOSAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "HFCs", variants: { current: "BKASNFCSHF11M", adjustedForMergers: "BKASNFHFAD19M" } },
  { scope: "nonFoodSectoral", family: "services", label: "PFIs", variants: { current: "BKASNFCSPF11M", adjustedForMergers: "BKASNFPFAD19M" } },

  { scope: "industryDetail", family: "industry", label: "Infrastructure", variants: { current: "BKASNFCIIN11M", oldClassification: "BKAONFCIIN11M" } },
  { scope: "industryDetail", family: "industry", label: "Power", variants: { current: "BKASNFCIIP11M", oldClassification: "BKAONFCIIP11M" } },
  { scope: "industryDetail", family: "industry", label: "Roads", variants: { current: "BKASNFCIIR11M", oldClassification: "BKAONFCIIR11M" } },
  { scope: "industryDetail", family: "industry", label: "Basic Metal and Metal Products", variants: { current: "BKASNFCIBM11M", oldClassification: "BKAONFCIBM11M" } },
  { scope: "industryDetail", family: "industry", label: "Engineering", variants: { current: "BKASNFCIEN11M", oldClassification: "BKAONFCIEN11M" } },
  { scope: "industryDetail", family: "industry", label: "Chemicals", variants: { current: "BKASNFCICH11M", oldClassification: "BKAONFCICH11M" } },
  { scope: "industryDetail", family: "industry", label: "Textiles", variants: { current: "BKASNFCITX11M", oldClassification: "BKAONFCITX11M" } },
  { scope: "industryDetail", family: "industry", label: "Food Processing", variants: { current: "BKASNFCIFP11M", oldClassification: "BKAONFCIFP11M" } },
  { scope: "industryDetail", family: "industry", label: "Construction", variants: { current: "BKASNFCICN11M", oldClassification: "BKAONFCICN11M" } },
  { scope: "industryDetail", family: "industry", label: "Other Industries", variants: { current: "BKASNFCIOT11M", oldClassification: "BKAONFCIOT11M" } }
];

const canonicalLabels = new Map([
  ["Non-Food Credit of Scheduled Commercial Banks", "Non-Food Credit"],
  ["Mortgage Loans", "Housing / Mortgage Loans"],
  ["Loans against Shares, Bonds etc", "Loans against Shares/Bonds"]
]);

async function lineItemsFromProbe() {
  try {
    const probe = JSON.parse(await readFile("data/catalog/indiadatahub-banking-credit-probe.json", "utf8"));
    const groups = Array.isArray(probe.monthlyGroups) ? probe.monthlyGroups : [];
    const lineItems = groups
      .map((group) => {
        const variants = {};
        for (const [variant, meta] of Object.entries(group.variants || {})) {
          if (meta?.identifier) variants[variant] = meta.identifier;
        }
        return {
          scope: group.scope,
          family: group.family,
          label: canonicalLabels.get(group.label) || group.label,
          sourceLabel: group.label,
          variants
        };
      })
      .filter((item) => item.scope && item.family && item.label && Object.keys(item.variants).length);
    return lineItems.length ? lineItems : null;
  } catch {
    return null;
  }
}

const lineItems = await lineItemsFromProbe() || fallbackLineItems;

function rowsFromPayload(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  return Array.isArray(dataset?.data) ? dataset.data : [];
}

function periodFromDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : String(value || "");
}

const fetchedSeries = [];
const failures = [];
const longRows = [];

for (const item of lineItems) {
  for (const [variant, sourceIndicatorId] of Object.entries(item.variants)) {
    try {
      const raw = await fetchIndiaEconomySeries({ id: sourceIndicatorId, fields: "India" });
      const snapshot = await writeSnapshot("indiadatahub", `banking-credit-${sourceIndicatorId}`, raw);
      const rows = rowsFromPayload(raw)
        .map((row) => {
          const sourceValueRupees = row.India === null || row.India === undefined ? null : Number(row.India);
          return {
            datasetKey: "indiadatahub_banking_credit",
            scope: item.scope,
            family: item.family,
            label: item.label,
            sourceLabel: item.sourceLabel || item.label,
            variant,
            frequency: "monthly",
            period: periodFromDate(row.Date || row.date),
            date: String(row.Date || row.date || ""),
            sourceIndicatorId,
            sourceTitle: raw.dataset?.[0]?.Title || "",
            sourceUnit: raw.dataset?.[0]?.Unit || "Rupees",
            sourceValueRupees,
            NumericValue: sourceValueRupees === null || Number.isNaN(sourceValueRupees) ? null : sourceValueRupees / 10_000_000,
            unit: "INR crore"
          };
        })
        .filter((row) => row.date && row.NumericValue !== null)
        .sort((a, b) => a.period.localeCompare(b.period));
      longRows.push(...rows);
      fetchedSeries.push({
        status: "ready",
        scope: item.scope,
        family: item.family,
        label: item.label,
        variant,
        sourceIndicatorId,
        sourceTitle: raw.dataset?.[0]?.Title || "",
        observations: rows.length,
        firstPeriod: rows[0]?.period || null,
        latestPeriod: rows.at(-1)?.period || null,
        latestValueCrore: rows.at(-1)?.NumericValue || null,
        snapshot: snapshot.path,
        rawHash: snapshot.hash
      });
      console.log(`idh banking credit ${sourceIndicatorId} ${rows.length} observations`);
    } catch (error) {
      failures.push({
        status: "failed",
        scope: item.scope,
        family: item.family,
        label: item.label,
        variant,
        sourceIndicatorId,
        error: error.message
      });
      console.warn(`idh banking credit ${sourceIndicatorId} failed: ${error.message}`);
    }
  }
}

longRows.sort((a, b) =>
  `${a.scope}:${a.family}:${a.label}:${a.variant}:${a.period}`.localeCompare(`${b.scope}:${b.family}:${b.label}:${b.variant}:${b.period}`)
);

const artifact = createTableArtifact({
  indicatorId: "banking.idh.credit_monthly",
  title: "IndiaDataHub Banking/Credit monthly RBI series, selected line items",
  sourceId: "indiadatahub",
  sourceIndicatorId: "Banking/Credit:selected-monthly-current-old",
  sourceUrl,
  unit: "INR crore",
  geography: { type: "country", id: "IND", name: "India" },
  fetchedAt,
  dimensions: ["scope", "family", "label", "variant", "period"],
  rows: longRows,
  metadata: {
    method: "Fetched selected IndiaDataHub Banking/Credit monthly identifiers. Values are source rupees converted to INR crore.",
    taxonomyBreaks: [
      "Old-classification monthly series are available from April 2007 to December 2020 for many line items.",
      "Current monthly series generally begin in January 2019 and run to April 2026 for sectoral credit line items.",
      "Charts should not treat old and current classifications as a perfectly continuous taxonomy; January 2019 is the main visible break.",
      "Gold loans have current monthly coverage from January 2019, but no old-classification monthly pair was found in the probe."
    ],
    selectedLineItems: lineItems,
    fetchedSeries,
    failures
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "indiadatahub",
  name: "indiadatahub.IN.banking.idh.credit_monthly.long",
  artifact
});

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/indiadatahub-banking-credit-manifest.json", `${stableJson({
  schemaVersion: 1,
  sourceId: "indiadatahub",
  generatedAt: fetchedAt,
  sourceUrl,
  artifact: artifactPath,
  rows: longRows.length,
  fetchedSeries: fetchedSeries.length,
  failures,
  coverage: {
    firstPeriod: longRows.map((row) => row.period).sort()[0] || null,
    latestPeriod: longRows.map((row) => row.period).sort().at(-1) || null,
    lineItems: lineItems.length
  }
})}\n`);

console.log(`Wrote ${artifactPath} with ${longRows.length} rows; ${failures.length} failure(s).`);
