// NFHS-6 (2023-24) fertility + family-planning, extracted from the parsed factsheet
// data in NHFS/nfhs6_clean.json into standard series + a by-state choropleth, so the
// canonical population article can show the regional fertility divide and the
// contraception story. National TFR time-trend lives in SRS; NFHS adds the state map
// and family-planning mix that SRS does not carry. Wealth/education/religion cuts are
// NOT in the public factsheet, so they are deliberately absent here.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://rchiips.org/nfhs/factsheet_NFHS-6.shtml";
const YEAR = "2024"; // NFHS-6 fieldwork 2023-24

const nfhs = JSON.parse(await readFile("NHFS/nfhs6_clean.json", "utf8"));
const stateArtifact = JSON.parse(await readFile("data/series/era5.IN.state_warming.json", "utf8"));

// NFHS factsheet names -> the state-map (era5) region names.
const NAME_FIX = {
  "NCT of Delhi": "Delhi",
  "Dadra & Nagar Haveli and Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu"
};
const fix = (name) => NAME_FIX[name] || name;

// Build a lookup of area -> indicator-number -> {urban, rural, total, nfhs5}.
const areas = nfhs.areas;
const byState = new Map();
for (const [area, indicators] of Object.entries(areas)) byState.set(fix(area), indicators);

const manifest = [];

// ---- National single-point series (NFHS-6) ----
const india = areas["India"];
const nationalSeries = [
  { id: "people.nfhs.tfr", num: "18", unit: "births per woman", title: "Total fertility rate (NFHS-6)" },
  { id: "people.nfhs.contraception_any", num: "20", unit: "% of married women 15-49", title: "Contraceptive use, any method (NFHS-6)" },
  { id: "people.nfhs.contraception_modern", num: "21", unit: "% of married women 15-49", title: "Contraceptive use, any modern method (NFHS-6)" },
  { id: "people.nfhs.sterilization_female", num: "23", unit: "% of married women 15-49", title: "Female sterilization (NFHS-6)" },
  { id: "people.nfhs.sterilization_male", num: "24", unit: "% of married women 15-49", title: "Male sterilization (NFHS-6)" },
  { id: "people.nfhs.unmet_need", num: "25", unit: "% of married women 15-49", title: "Total unmet need for family planning (NFHS-6)" },
  { id: "people.nfhs.teen_mothers", num: "19", unit: "% of women age 15-19", title: "Women 15-19 already mothers or pregnant (NFHS-6)" },
  { id: "people.nfhs.child_marriage", num: "16", unit: "% of women age 20-24", title: "Women 20-24 married before age 18 (NFHS-6)" }
];
for (const s of nationalSeries) {
  const cell = india[s.num];
  if (!cell || cell.total == null) { manifest.push({ status: "failed", indicatorId: s.id, error: `India indicator ${s.num} missing` }); continue; }
  const artifact = createSeriesArtifact({
    indicatorId: s.id,
    title: s.title,
    sourceId: "nfhs",
    sourceIndicatorId: `NFHS-6 (2023-24), indicator ${s.num}: ${nfhs.indicators[s.num]}`,
    sourceUrl,
    unit: s.unit,
    frequency: "survey",
    fetchedAt,
    observations: [{ date: YEAR, value: cell.total }],
    metadata: { survey: nfhs.survey, urban: cell.urban, rural: cell.rural, nfhs5: cell.nfhs5, indicatorLabel: nfhs.indicators[s.num] }
  });
  const path = await writeSeriesArtifact({ sourceId: "nfhs", name: `nfhs.IN.${s.id.replace(/\./g, "_")}`, artifact });
  manifest.push({ status: "ready", indicatorId: s.id, artifact: path, fetchedAt, value: cell.total });
  console.log(`nfhs ${s.id} = ${cell.total} (urban ${cell.urban}, rural ${cell.rural})`);
}

// ---- TFR by state choropleth (indicator 18, total) ----
const regions = stateArtifact.regions.map((region) => {
  const cell = byState.get(region.name)?.["18"];
  return { name: region.name, value: cell?.total ?? null, path: region.path, nfhs5: cell?.nfhs5 ?? null };
});
const values = regions.map((r) => r.value).filter((v) => v !== null);
const choropleth = {
  schemaVersion: 1,
  artifactType: "choropleth",
  indicatorId: "people.nfhs.tfr_by_state",
  title: "Total fertility rate by state",
  sourceId: "nfhs",
  sourceIndicatorId: "NFHS-6 (2023-24), indicator 18: Total fertility rate (children per woman)",
  sourceUrl,
  unit: "births per woman",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt,
  viewBox: stateArtifact.viewBox,
  min: Math.min(...values),
  max: Math.max(...values),
  regions,
  metadata: {
    survey: nfhs.survey,
    note: "Total fertility rate by state, NFHS-6 (2023-24). Replacement level is about 2.1. Manipur was not surveyed in NFHS-6; states absent from the base map (e.g. Lakshadweep, Puducherry) are not shown.",
    replacementLevel: 2.1,
    nationalTfr: india["18"]?.total ?? null
  }
};
const chPath = await writeSeriesArtifact({ sourceId: "nfhs", name: "nfhs.IN.people_nfhs_tfr_by_state", artifact: choropleth });
await writeSnapshot("nfhs", "tfr_by_state", { regions: regions.map(({ name, value, nfhs5 }) => ({ name, value, nfhs5 })) });
manifest.push({ status: "ready", indicatorId: choropleth.indicatorId, artifact: chPath, fetchedAt, regions: regions.length, matched: values.length });
console.log(`nfhs tfr_by_state choropleth ${values.length}/${regions.length} states (min ${choropleth.min}, max ${choropleth.max})`);

// ---- Ranked top-5 / bottom-5 states by TFR (grouped bar) ----
const ranked = regions.filter((r) => r.value != null).sort((a, b) => b.value - a.value);
const top5 = ranked.slice(0, 5).map((r) => ({ label: r.name, value: r.value, group: "Highest" }));
const bottom5 = ranked.slice(-5).reverse().map((r) => ({ label: r.name, value: r.value, group: "Lowest" }));
const rankedArtifact = createTableArtifact({
  indicatorId: "people.nfhs.tfr_state_ranked",
  title: "Highest and lowest fertility states",
  sourceId: "nfhs",
  sourceIndicatorId: "NFHS-6 (2023-24), indicator 18: Total fertility rate, top 5 and bottom 5 states/UTs",
  sourceUrl,
  unit: "births per woman",
  fetchedAt,
  rows: [...top5, ...bottom5],
  dimensions: ["label", "value", "group"],
  metadata: { survey: nfhs.survey, replacementLevel: 2.1, note: "Top 5 and bottom 5 of the 33 surveyed states/UTs by total fertility rate, NFHS-6." }
});
manifest.push({ status: "ready", indicatorId: "people.nfhs.tfr_state_ranked", artifact: await writeSeriesArtifact({ sourceId: "nfhs", name: "nfhs.IN.people_nfhs_tfr_state_ranked", artifact: rankedArtifact }), fetchedAt, rows: top5.length + bottom5.length });
console.log(`nfhs tfr_state_ranked: top ${top5[0].label} ${top5[0].value}, bottom ${bottom5[0].label} ${bottom5[0].value}`);

await writeSourceManifest("nfhs-fertility", manifest);
console.log(`\nWrote ${manifest.filter((m) => m.status === "ready").length} NFHS fertility artifact(s).`);
