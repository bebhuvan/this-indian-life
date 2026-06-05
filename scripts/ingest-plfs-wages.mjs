// PLFS 2023-24 wage inequality (earnings side) → series artifacts for
// q.econ.inequality. Reads scripts/derive-plfs-wages.py output. Monthly earnings
// of regular wage/salaried employees, validated against the published ₹21,000
// (computed ₹21,048; gender ratio 0.74; self-employed ₹13,363 vs ~13,300).
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, mergeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE = "inequality";
const URL = "https://microdata.gov.in/NADA/index.php/catalog/PLFS";
const geoIN = { type: "country", id: "IN", name: "India" };
const entries = [];
const g = JSON.parse(await readFile("data/snapshots/microdata-nada/plfs_wages_derived.json", "utf8"));
const meta = { provenance: "Computed from PLFS 2023-24 unit-level microdata (NADA); regular wage/salaried monthly earnings (var b6q9), validated vs published ₹21,000.", validation: g.validation };

async function table(id, title, unit, rows, extraMeta = {}) {
  const art = createTableArtifact({
    indicatorId: id, title, sourceId: "plfs", sourceIndicatorId: id, sourceUrl: URL,
    unit, geography: geoIN, fetchedAt, rows, dimensions: Object.keys(rows[0]), metadata: { ...meta, ...extraMeta }
  });
  const file = await writeSeriesArtifact({ sourceId: SOURCE, name: `plfs.IN.${id.split(".").pop()}`, artifact: art });
  entries.push({ status: "ready", indicatorId: id, sourceIndicatorId: id, source: "plfs", artifact: file, rows: rows.length, fetchedAt });
  console.log(`plfs ${id} (${rows.length} rows)`);
}

// Wage by caste (Others -> OBC -> ST -> SC, by wage)
const casteOrder = ["Others", "OBC", "Scheduled Tribe", "Scheduled Caste"];
await table("econ.inequality.plfs_wage_by_caste", "Regular-salaried monthly wage by caste, 2023-24", "₹ per month",
  casteOrder.filter((k) => g.wageByCaste[k]).map((k) => ({ label: k, value: g.wageByCaste[k].wage, gapVsOthersPct: g.wageByCaste[k].gapVsOthersPct })));

// Gender pay gap by caste — women's wage as % of men's (the compounding disadvantage)
const ratioOrder = ["Others", "OBC", "Scheduled Caste", "Scheduled Tribe"];
await table("econ.inequality.plfs_gender_ratio_by_caste", "Women's pay as a share of men's, by caste, 2023-24", "% (female ÷ male regular wage)",
  ratioOrder.filter((k) => g.genderByCaste[k]).map((k) => ({ label: k, value: Math.round(g.genderByCaste[k].femaleToMaleRatio * 100), maleWage: g.genderByCaste[k].male, femaleWage: g.genderByCaste[k].female })),
  { note: "Lower = wider gender pay gap. The gap is widest for the most disadvantaged castes." });

// Wage by religion (major groups only)
const religKeep = ["Christian", "Jain", "Buddhist", "Hindu", "Muslim", "Sikh"];
await table("econ.inequality.plfs_wage_by_religion", "Regular-salaried monthly wage by religion, 2023-24", "₹ per month",
  religKeep.filter((k) => g.wageByReligion[k]).map((k) => ({ label: k, value: g.wageByReligion[k] }))
    .sort((a, b) => b.value - a.value));

await mergeSourceManifest(SOURCE, entries);
console.log(`\nMerged ${entries.length} PLFS wage tables into the inequality manifest.`);
