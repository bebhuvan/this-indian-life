// Seed verified water-stress figures that have no clean API — hand-entered from primary
// reports and fact-checked (see memory: indica-water-stress-research). Each value carries its
// exact source + year in metadata so the prose generator can cite it. NOT scraped: these are
// periodic studies (CWC per-capita) or report tables (CGWB quality) with no machine endpoint.

import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const geo = { type: "country", id: "IN", name: "India" };

async function emit(sourceId, manifest, artifact) {
  const path = await writeSeriesArtifact({ sourceId, name: artifact.indicatorId, artifact });
  manifest.push({
    status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: artifact.sourceIndicatorId,
    artifact: path, fetchedAt,
    [artifact.artifactType === "series" ? "observations" : "rows"]:
      artifact.artifactType === "series" ? artifact.observations.length : artifact.rows.length
  });
  console.log(`${artifact.artifactType} ${artifact.indicatorId}`);
}

// --- CWC: Reassessment of Water Availability in India using Space Inputs, 2019 ---
const cwc = [];
const CWC_URL = "https://www.cwc.gov.in/water-resource-estimation";

await emit("cwc", cwc, createSeriesArtifact({
  indicatorId: "water.cwc.per_capita_availability",
  title: "Average annual per-capita water availability",
  sourceId: "cwc", sourceIndicatorId: "cwc.percapita", sourceUrl: CWC_URL,
  unit: "cubic metres per person per year", frequency: "annual", geography: geo, fetchedAt,
  observations: [
    { date: "2001", value: 1816 },
    { date: "2011", value: 1545 },
    { date: "2021", value: 1486 },
    { date: "2031", value: 1367 }
  ],
  metadata: {
    collection: "CWC Reassessment of Water Availability in India using Space Inputs, 2019",
    sourceDetail: "Min. of Jal Shakti / CWC; per PIB PRID 1604871 & 2002726",
    thresholds: "Falkenmark (Min. Jal Shakti): <1700 m3 = water-stressed; <1000 m3 = water-scarce",
    note: "2031 is a projection. India crossed below the 1700 m3 stress line between 2001 and 2011."
  }
}));

await emit("cwc", cwc, createTableArtifact({
  indicatorId: "water.cwc.resource_breakdown",
  title: "India's water resource: total vs usable (BCM/year)",
  sourceId: "cwc", sourceIndicatorId: "cwc.resourcebreakdown", sourceUrl: CWC_URL,
  unit: "billion cubic metres per year", geography: geo, fetchedAt,
  rows: [
    { component: "Total average annual water resource", value: 1999.20, kind: "resource" },
    { component: "Total utilizable water", value: 1137, kind: "usable" },
    { component: "Utilizable surface water", value: 690, kind: "usable-part" },
    { component: "Replenishable groundwater", value: 447, kind: "usable-part" }
  ],
  dimensions: ["component"],
  metadata: {
    collection: "CWC water-resource estimation (post-2019 vintage)",
    note: "Resource (1999.20) and utilizable (1137 = 690 surface + 447 groundwater) must not be conflated."
  }
}));

await writeSourceManifest("cwc", cwc);

// --- CGWB: Annual Ground Water Quality Report 2024 (15,259 monitoring sites) ---
const cgwbq = [];
const CGWBQ_URL = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2109942";

await emit("cgwb-quality", cgwbq, createTableArtifact({
  indicatorId: "water.cgwb.contamination_share",
  title: "Groundwater samples exceeding safe limits (2024)",
  sourceId: "cgwb-quality", sourceIndicatorId: "cgwb.quality.share", sourceUrl: CGWBQ_URL,
  unit: "% of tested samples above limit", geography: geo, fetchedAt,
  rows: [
    { contaminant: "Nitrate (>45 mg/L)", value: 19.8 },
    { contaminant: "Fluoride (>1.5 mg/L)", value: 9.04 },
    { contaminant: "Arsenic (>10 ppb)", value: 3.1 }
  ],
  dimensions: ["contaminant"],
  metadata: {
    collection: "CGWB Annual Ground Water Quality Report 2024 (15,259 sites)",
    note: "Arsenic is 3.1% in the parliamentary answer (PIB 2109942) vs ~3.5% in the full report — cite source explicitly."
  }
}));

await emit("cgwb-quality", cgwbq, createTableArtifact({
  indicatorId: "water.cgwb.contamination_districts",
  title: "Districts with groundwater contamination (2023)",
  sourceId: "cgwb-quality", sourceIndicatorId: "cgwb.quality.districts", sourceUrl: CGWBQ_URL,
  unit: "number of districts (parts of) affected", geography: geo, fetchedAt,
  rows: [
    { contaminant: "Nitrate (>45 mg/L)", value: 443, statesUTs: 23 },
    { contaminant: "Fluoride (>1.5 mg/L)", value: 263, statesUTs: 20 },
    { contaminant: "Uranium (>30 ppb)", value: 132, statesUTs: 13 },
    { contaminant: "Arsenic (>10 ppb)", value: 118, statesUTs: 20 }
  ],
  dimensions: ["contaminant"],
  metadata: {
    collection: "CGWB Annual Ground Water Quality Report 2024 (Year-2023 data); also data.gov.in",
    note: "'Parts of' districts — contamination is localised within a district, not district-wide."
  }
}));

await writeSourceManifest("cgwb-quality", cgwbq);

// --- Jal Jeevan Mission: rural tap-water coverage (Dept. of Drinking Water & Sanitation) ---
const jjm = [];
const JJM_URL = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2098651";

await emit("jjm", jjm, createSeriesArtifact({
  indicatorId: "water.jjm.tap_coverage_rural",
  title: "Rural households with tap-water connections",
  sourceId: "jjm", sourceIndicatorId: "jjm.tapcoverage", sourceUrl: JJM_URL,
  unit: "% of rural households", frequency: "annual", geography: geo, fetchedAt,
  observations: [
    { date: "2019", value: 16.71 },
    { date: "2025", value: 79.74 }
  ],
  metadata: {
    collection: "Jal Jeevan Mission dashboard / PIB PRID 2098651",
    detail: "Launch 15 Aug 2019: 3.23 crore (16.71%) of rural households. As of 1 Feb 2025: 15.44 crore (79.74%), +12.20 crore connections.",
    note: "Self-reported dashboard 'connections provided', not independently audited functional connections (CAG has flagged reported-vs-functional gaps). Two anchor points only; the line is the trajectory, not annual measurements."
  }
}));

await writeSourceManifest("jjm", jjm);

// --- Context stat: India's groundwater use in global terms (verified; for prose, no clean chart) ---
const ctx = [];
await emit("water-context", ctx, createTableArtifact({
  indicatorId: "water.context.gw_global_share",
  title: "India's groundwater use in global context",
  sourceId: "water-context", sourceIndicatorId: "context.gwglobal",
  sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2089039",
  unit: "mixed (see rows)", geography: geo, fetchedAt,
  rows: [
    { metric: "India annual groundwater extraction", value: 245.64, unit: "BCM/year", year: "2024" },
    { metric: "India share of global groundwater withdrawals", value: 25, unit: "%", year: "2022" }
  ],
  dimensions: ["metric"],
  metadata: {
    collection: "CGWB 2024; UN World Water Development Report 2022; Public Accounts Committee 41st report (2026)",
    note: "India is the world's largest groundwater user, extracting more than the US and China combined (World Bank). Per-country US/China BCM deliberately NOT used: no clean primary comparison exists."
  }
}));
await writeSourceManifest("water-context", ctx);

console.log("\nSeeded verified CWC + CGWB-quality + JJM + context artifacts.");
