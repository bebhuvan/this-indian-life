// National Health Profile 2023 (18th issue), CBHI / DGHS / MoHFW.
// India's own official count of the health system: medical-education capacity,
// public service infrastructure, and the registered health workforce.
//
// Numbers are transcribed (not model-emitted) from the PDF's text layer
// (data/snapshots/nhp-2023/NHP-2023.pdf, verified in nhp-verified-figures.md).
// HONESTY: registration counts are cumulative "registered", NOT active / in-position,
// and facility counts carry a reporting lag (RHS vintage). The article must frame
// these as "India's own count, on paper", cross-checked against WB modelled densities.
import { createSeriesArtifact, createTableArtifact, sourceSlug, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE_ID = "nhp";
const SOURCE_URL = "https://cbhidghs.mohfw.gov.in/sites/default/files/NHP/NHP-2023-Last-Final.pdf";
const ATTRIB = "National Health Profile 2023 (18th issue), CBHI, DGHS, Ministry of Health and Family Welfare";

// --- Table 6.1.1: Medical colleges & MBBS seats, 2006-07 to 2022-23 (Source: NMC) ---
// date = the later calendar year of the academic year.
const medEd = [
  ["2007", 262, 25058], ["2008", 266, 30290], ["2009", 289, 32815], ["2010", 300, 34084],
  ["2011", 314, 29263], ["2012", 356, 38210], ["2013", 381, 43576], ["2014", 381, 48567],
  ["2015", 398, 46456], ["2016", 412, 48855], ["2017", 462, 56748], ["2018", 476, 52646],
  ["2019", 529, 58756], ["2020", 542, 81400], ["2021", 558, 83275], ["2022", 648, 98013],
  ["2023", 679, 104163]
];

// --- Table 6.2.1: public service infrastructure, as on 31 March 2023 (RHS vintage) ---
const facilities = [
  { label: "Sub Centres", value: 161829 },
  { label: "Primary Health Centres", value: 31053 },
  { label: "Community Health Centres", value: 6064 },
  { label: "Sub-divisional Hospitals", value: 1275 },
  { label: "District Hospitals", value: 767 }
];

// --- Tables 5.1, 5.2, 5.5, 5.6: registered health workforce (cumulative registrations) ---
const workforce = [
  { label: "Registered nurses & midwives", value: 2556416, asOf: "31.12.2022" },
  { label: "Registered pharmacists", value: 1713730, asOf: "01.03.2023" },
  { label: "Registered doctors (allopathic)", value: 1349679, asOf: "31.12.2022" },
  { label: "ANM (auxiliary nurse midwives)", value: 1000434, asOf: "31.12.2022" },
  { label: "Registered dental surgeons", value: 294102, asOf: "2022-23" }
];

// --- Table 5.1: state/UT-wise registered MBBS doctors, upto 31.12.2022 (excl. MCI direct) ---
const doctorsByStateRaw = [
  ["Maharashtra", 211046], ["Tamil Nadu", 149397], ["Karnataka", 134448], ["Andhra Pradesh", 105804],
  ["Uttar Pradesh", 99734], ["West Bengal", 79748], ["Kerala", 73033], ["Gujarat", 72473],
  ["Punjab", 53445], ["Rajasthan", 49047], ["Bihar", 48198], ["Madhya Pradesh", 42597],
  ["Delhi", 30848], ["Odisha", 26986], ["Assam", 25980], ["Jammu & Kashmir", 18191],
  ["Haryana", 16806], ["Telangana", 15016], ["Chhattisgarh", 10962], ["Uttarakhand", 10249],
  ["Jharkhand", 7920], ["Himachal Pradesh", 5038], ["Goa", 4036], ["Tripura", 2681],
  ["Arunachal Pradesh", 1528], ["Sikkim", 1501], ["Mizoram", 156], ["Nagaland", 141]
];
const INDIA_DOCTORS = 1349679; // includes 52,670 MCI direct (registration stopped 2015)
// Top 12 states explicit; bucket the rest as "Other states & UTs" for a readable bar chart.
const TOP_N = 12;
const topStates = doctorsByStateRaw.slice(0, TOP_N);
const restSum = doctorsByStateRaw.slice(TOP_N).reduce((a, [, v]) => a + v, 0);
const doctorsByState = [
  ...topStates.map(([label, value]) => ({ label, value })),
  { label: "Other states & UTs", value: restSum }
];

const manifest = [];

async function writeSeries({ indicatorId, title, unit, observations, metadata }) {
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId: SOURCE_ID, sourceIndicatorId: indicatorId, sourceUrl: SOURCE_URL,
    unit, frequency: "annual", geography: { type: "country", id: "IN", name: "India" }, fetchedAt,
    observations, metadata: { source: ATTRIB, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: `nhp.IN.${sourceSlug(indicatorId)}`, artifact });
  manifest.push({ status: "ready", indicatorId, artifact: path, observations: observations.length, fetchedAt });
  console.log(`nhp ${indicatorId}: ${observations.length} obs`);
}

async function writeTable({ indicatorId, title, unit, dimension, rows, metadata }) {
  const artifact = createTableArtifact({
    indicatorId, title, sourceId: SOURCE_ID, sourceIndicatorId: indicatorId, sourceUrl: SOURCE_URL,
    unit, geography: { type: "country", id: "IN", name: "India" }, fetchedAt,
    rows: rows.map((r) => ({ ...r, [dimension]: r.label })), dimensions: [dimension],
    metadata: { source: ATTRIB, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE_ID, name: `nhp.IN.${sourceSlug(indicatorId)}`, artifact });
  manifest.push({ status: "ready", indicatorId, artifact: path, rows: rows.length, fetchedAt });
  console.log(`nhp ${indicatorId}: ${rows.length} rows (table)`);
}

// 1. MBBS seats time series (the "training pipeline" — getting better)
await writeSeries({
  indicatorId: "health.nhp.mbbs_seats", title: "MBBS seats in India", unit: "MBBS seats",
  observations: medEd.map(([date, , seats]) => ({ date, value: seats })),
  metadata: { table: "NHP 2023 Table 6.1.1", origin: "National Medical Commission", note: "Academic-year seat capacity; dated by later calendar year." }
});
// 2. Medical colleges time series (companion to seats)
await writeSeries({
  indicatorId: "health.nhp.medical_colleges", title: "Medical colleges in India", unit: "colleges",
  observations: medEd.map(([date, colleges]) => ({ date, value: colleges })),
  metadata: { table: "NHP 2023 Table 6.1.1", origin: "National Medical Commission", note: "679 in 2022-23 = 380 Government + 299 Private (as on 30.06.2023)." }
});
// 3. Public service infrastructure (the system in counts)
await writeTable({
  indicatorId: "health.nhp.public_facilities", title: "Public health facilities in India", unit: "facilities",
  dimension: "facility", rows: facilities,
  metadata: { table: "NHP 2023 Table 6.2.1", asOf: "31 March 2023 (RHS vintage)", note: "Counts carry a reporting lag." }
});
// 4. Registered health workforce by cadre (on paper)
await writeTable({
  indicatorId: "health.nhp.registered_workforce", title: "India's registered health workforce", unit: "registered (cumulative)",
  dimension: "cadre", rows: workforce.map(({ label, value, asOf }) => ({ label, value, asOf })),
  metadata: { tables: "NHP 2023 Tables 5.1, 5.2, 5.5, 5.6", note: "Cumulative registrations, NOT active / in-position; overstates available workforce." }
});
// 5. Registered doctors by state (geographic concentration)
await writeTable({
  indicatorId: "health.nhp.doctors_by_state", title: "Registered doctors by state", unit: "registered doctors",
  dimension: "state", rows: doctorsByState,
  metadata: { table: "NHP 2023 Table 5.1", asOf: "upto 31.12.2022", indiaTotal: INDIA_DOCTORS, note: "Top 12 states shown; rest bucketed. India total includes 52,670 MCI-direct registrations (stopped 2015). Cumulative registrations, not active." }
});

await writeSourceManifest(SOURCE_ID, manifest);
console.log(`Wrote ${manifest.length} NHP series artifacts.`);
