// NFHS-6 (2023-24) women's empowerment indicators extracted from the parsed
// factsheet in NHFS/nfhs6_clean.json — decision-making, paid work, financial
// inclusion, mobile ownership, spousal violence, and education.
// Used by: q.work.women_missing ("Why are Indian women missing from paid work?")
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://www.nfhsiips.in/nfhsuser/index.php";
const YEAR = "2024";

const nfhs = JSON.parse(await readFile("NHFS/nfhs6_clean.json", "utf8"));

const NAME_FIX = {
  "NCT of Delhi": "Delhi",
  "Dadra & Nagar Haveli and Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu"
};
const fix = (name) => NAME_FIX[name] || name;

const areas = nfhs.areas;
const india = areas["India"];

const manifest = [];

// ---- National single-point series ----
const nationalSeries = [
  // Women's empowerment core
  { id: "people.nfhs.women_decisions",    num: "90", unit: "% of married women",           title: "Married women participating in 3+ household decisions" },
  { id: "people.nfhs.women_paid_work",    num: "91", unit: "% of women",                    title: "Women who worked in last 12 months and were paid in cash" },
  { id: "people.nfhs.women_bank_account", num: "92", unit: "% of women",                    title: "Women with bank/savings account they use themselves" },
  { id: "people.nfhs.women_mobile",       num: "93", unit: "% of women",                    title: "Women with mobile phone they use themselves" },
  { id: "people.nfhs.spousal_violence",   num: "95", unit: "% of ever-married women 18-49", title: "Ever-married women who experienced spousal violence" },
  { id: "people.nfhs.violence_pregnancy", num: "96", unit: "% of ever-married women 18-49", title: "Women who experienced physical violence during pregnancy" },
  
  // Context indicators
  { id: "people.nfhs.women_schooling_10y", num: "12", unit: "% of women",                   title: "Women with 10+ years of schooling" },
  { id: "people.nfhs.women_internet",      num: "14", unit: "% of women",                   title: "Women who have ever used the internet" },
  { id: "people.nfhs.female_house_land",   num: "10", unit: "% of households",              title: "Households with female members owning house/land" },
];

for (const s of nationalSeries) {
  const cell = india[s.num];
  if (!cell || cell.total == null) {
    manifest.push({ status: "failed", indicatorId: s.id, error: `India indicator ${s.num} missing` });
    continue;
  }
  const artifact = createSeriesArtifact({
    indicatorId: s.id,
    title: s.title,
    sourceId: "nfhs",
    sourceIndicatorId: `NFHS-6 (2023-24), indicator ${s.num}: ${nfhs.indicators[s.num]}`,
    sourceUrl,
    unit: s.unit,
    frequency: "survey",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations: [{ date: YEAR, value: cell.total }],
    metadata: { survey: nfhs.survey, urban: cell.urban, rural: cell.rural, nfhs5: cell.nfhs5, indicatorLabel: nfhs.indicators[s.num] }
  });
  const path = await writeSeriesArtifact({ sourceId: "nfhs", name: `nfhs.IN.${s.id.replace(/\./g, "_")}`, artifact });
  manifest.push({ status: "ready", indicatorId: s.id, artifact: path, fetchedAt, value: cell.total });
  console.log(`nfhs ${s.id} = ${cell.total}% (urban ${cell.urban}%, rural ${cell.rural}%)`);
}

// ---- State-level tables for key indicators ----
for (const [num, idSuffix, label] of [
  ["90", "women_decisions", "Married women in 3+ household decisions"],
  ["91", "women_paid_work", "Women paid in cash for work"],
  ["93", "women_mobile", "Women with mobile phone"],
  ["95", "spousal_violence", "Ever-married women experiencing spousal violence"],
]) {
  const rows = [];
  for (const [area, indicators] of Object.entries(areas)) {
    const cell = indicators[num];
    if (!cell || cell.total == null) continue;
    rows.push({
      state: fix(area),
      value: cell.total,
      urban: cell.urban,
      rural: cell.rural,
      nfhs5: cell.nfhs5,
    });
  }
  if (!rows.length) continue;
  const artifact = createTableArtifact({
    indicatorId: `people.nfhs.${idSuffix}_by_state`,
    title: `${label} by state — NFHS-6 (2023-24)`,
    sourceId: "nfhs",
    sourceIndicatorId: `NFHS-6 indicator ${num}: ${nfhs.indicators[num]}`,
    sourceUrl,
    unit: "%",
    frequency: "survey",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    rows,
    dimensions: ["state", "value", "urban", "rural", "nfhs5"],
    metadata: { survey: nfhs.survey, indicatorLabel: nfhs.indicators[num] }
  });
  const path = await writeSeriesArtifact({ sourceId: "nfhs", name: `nfhs.IN.${`people_nfhs_${idSuffix}_state`.replace(/\./g, "_")}`, artifact });
  manifest.push({ status: "ready", indicatorId: `people.nfhs.${idSuffix}_by_state`, artifact: path, fetchedAt, rows: rows.length });
  console.log(`nfhs ${idSuffix}_by_state: ${rows.length} state rows`);
}

await writeSourceManifest("nfhs-women", manifest);
console.log(`\nWrote ${manifest.filter(m => m.status === "ready").length} NFHS women's artifacts.`);
