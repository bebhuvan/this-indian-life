// Ingest: platform-wise + authority-wise blocking figures the government has
// disclosed to Parliament / via RTI, for q.policy.internet_control ("India's
// off switch").
//
// Source 1 (platform-wise URL blocks under IT Act s.69A, 2018 - Oct 2023):
//   Rajya Sabha Unstarred Question No. 732, answered 08.12.2023, reply by the
//   MoS for Electronics & IT (Rajeev Chandrasekhar). The annexure tabulates
//   "directions issued for blocking of URLs" by platform and year. The 2023
//   column is "till October 2023".
//   PDF: https://sansad.in/getFile/annex/262/AU732.pdf?source=pqars
//
// Source 2 (authority-wise website blocks, Jan 2015 - Sep 2022):
//   SFLC.in, "Finding 404: A report on website blocking in India 2022",
//   built from RTI replies (DoT/MeitY/MIB). Of 55,580 websites blocked, the
//   single biggest head is s.69A (executive) at 26,447 (47.5%); court orders
//   (mostly copyright) account for 26,024 (46.8%); the rest is unclassified.
//   PDF: https://images.assettype.com/barandbench/2023-01/5b3b5f47-930a-4c78-b425-1109b7f12e08/Finding_404___A_Report_on_Website_Blocking_in_India.pdf
//
// All counts are the government's own and do not fully reconcile across answers;
// the orders themselves are confidential by rule, so treat as order-of-magnitude.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SERIES_DIR = resolve(process.cwd(), "data/series");
const RS732_URL = "https://sansad.in/getFile/annex/262/AU732.pdf?source=pqars";
const SFLC_URL =
  "https://images.assettype.com/barandbench/2023-01/5b3b5f47-930a-4c78-b425-1109b7f12e08/Finding_404___A_Report_on_Website_Blocking_in_India.pdf";
const fetchedAt = "2026-06-22T00:00:00+00:00";

const geography = { type: "country", id: "IN", name: "India" };

// RS Q732 annexure: URLs blocked under s.69A, by platform and year (2023 = till Oct).
const PLATFORM_BLOCKS = {
  facebook: { label: "Facebook", color: "#1877f2", obs: { 2018: 1555, 2019: 2049, 2020: 1717, 2021: 1082, 2022: 1750, 2023: 2044 } },
  x: { label: "X (Twitter)", color: "#111111", obs: { 2018: 224, 2019: 1041, 2020: 2731, 2021: 2851, 2022: 3423, 2023: 3390 } },
  youtube: { label: "YouTube", color: "#ff0000", obs: { 2018: 161, 2019: 409, 2020: 2175, 2021: 1141, 2022: 939, 2023: 934 } },
  instagram: { label: "Instagram", color: "#c13584", obs: { 2018: 379, 2019: 75, 2020: 1273, 2021: 464, 2022: 359, 2023: 473 } },
  others: { label: "Others", color: "#9aa0a6", obs: { 2018: 480, 2019: 61, 2020: 1953, 2021: 580, 2022: 464, 2023: 661 } },
};

const platformNote =
  "URLs ordered blocked under Section 69A of the IT Act, by platform, as tabulated in the annexure to Rajya Sabha Unstarred Question No. 732 (answered 08.12.2023). The 2023 figure is till October 2023 only. These are the government's own counts and are confidential by rule, so what was blocked or why is never disclosed.";

for (const [key, { label, obs }] of Object.entries(PLATFORM_BLOCKS)) {
  const artifact = {
    schemaVersion: 1,
    artifactType: "series",
    indicatorId: `policy.blocking.urls_${key}`,
    title: `URLs blocked under s.69A: ${label}`,
    sourceId: "meity",
    sourceIndicatorId: "rs-uq-732-2023",
    sourceUrl: RS732_URL,
    unit: "URLs blocked",
    frequency: "annual",
    geography,
    dimensions: [],
    fetchedAt,
    metadata: { note: platformNote },
    observations: Object.entries(obs).map(([date, value]) => ({ date, value })),
  };
  writeFileSync(resolve(SERIES_DIR, `offswitch.IN.urls_${key}.json`), JSON.stringify(artifact, null, 2) + "\n");
  console.log(`wrote offswitch.IN.urls_${key}.json (${label})`);
}

// Cumulative platform totals (column sums of the RS Q732 annexure, 2018 - Oct 2023).
const cumulative = Object.values(PLATFORM_BLOCKS).map(({ label, obs }) => ({
  label,
  value: Object.values(obs).reduce((a, b) => a + b, 0),
  group: "URLs blocked, 2018 to Oct 2023",
}));
cumulative.sort((a, b) => b.value - a.value);
const cumulativeArtifact = {
  schemaVersion: 1,
  artifactType: "table",
  indicatorId: "policy.blocking.urls_by_platform_total",
  title: "Which platforms India blocks the most",
  sourceId: "meity",
  sourceIndicatorId: "rs-uq-732-2023",
  sourceUrl: RS732_URL,
  unit: "URLs blocked",
  frequency: "annual",
  geography,
  dimensions: ["label", "value", "group"],
  fetchedAt,
  metadata: {
    note: "Total URLs ordered blocked under Section 69A, by platform, summed over 2018 to October 2023, from the annexure to Rajya Sabha Unstarred Question No. 732 (08.12.2023). Column sums: X 13,660; Facebook 10,197; YouTube 5,759; Others 4,199; Instagram 3,023; total 36,838.",
  },
  rows: cumulative,
};
writeFileSync(resolve(SERIES_DIR, "offswitch.IN.urls_by_platform.json"), JSON.stringify(cumulativeArtifact, null, 2) + "\n");
console.log(`wrote offswitch.IN.urls_by_platform.json (total ${cumulative.reduce((a, b) => a + b.value, 0)})`);

// Authority-wise website blocks (SFLC Finding 404, Jan 2015 - Sep 2022).
const TOTAL_BLOCKS = 55580;
const EXEC_69A = 26447; // s.69A (MeitY + MIB), executive
const COURTS = 26024; // court orders, mostly copyright
const OTHER = TOTAL_BLOCKS - EXEC_69A - COURTS; // residual / unclassified
const authorityArtifact = {
  schemaVersion: 1,
  artifactType: "table",
  indicatorId: "policy.blocking.authority_split",
  title: "Who orders India's website blocks",
  sourceId: "sflc",
  sourceIndicatorId: "finding-404-2022",
  sourceUrl: SFLC_URL,
  unit: "websites blocked",
  frequency: "cumulative",
  geography,
  dimensions: ["label", "value", "group", "note"],
  fetchedAt,
  metadata: {
    note: "Of 55,580 websites blocked in India between January 2015 and September 2022 (SFLC.in 'Finding 404', built from RTI replies), 47.5% were blocked by the executive under Section 69A (MeitY + MIB) and 46.8% by court orders, mostly for copyright infringement. This is an aggregate split over the whole period, not a year-by-year series.",
  },
  rows: [
    { label: "Executive (Section 69A)", value: EXEC_69A, group: "Website blocks, 2015 to Sep 2022", note: "MeitY and MIB; orders confidential by rule." },
    { label: "Court orders", value: COURTS, group: "Website blocks, 2015 to Sep 2022", note: "Mostly copyright-infringement blocking." },
    { label: "Other / unclassified", value: OTHER, group: "Website blocks, 2015 to Sep 2022", note: "Residual; grounds not specified in disclosures." },
  ],
};
writeFileSync(resolve(SERIES_DIR, "offswitch.IN.authority_split.json"), JSON.stringify(authorityArtifact, null, 2) + "\n");
console.log(`wrote offswitch.IN.authority_split.json (69A ${EXEC_69A}, courts ${COURTS}, other ${OTHER})`);
