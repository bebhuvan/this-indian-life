// Mechanism layer for the fertility-vs-economy article: female education by
// state. In India female *education* tracks fertility far more cleanly than
// female labour-force participation does (Kerala has the highest female
// schooling AND the lowest fertility; its female paid-work rate is only middling
// -- the well-known Indian female-LFP paradox). So the education-first spine
// rests on this series.
//
// Source: NFHS-6 (2023-24) state factsheets, indicator 12 "Women with 10 or more
// years of schooling", already parsed into NHFS/nfhs6_clean.json. National +
// paid-work-by-state are emitted elsewhere; this adds the state education table
// the existing NFHS ingest never surfaced.
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact } from "./core/artifacts.mjs";

const nfhs = JSON.parse(await readFile("NHFS/nfhs6_clean.json", "utf8"));
const NAME_FIX = { "NCT of Delhi": "Delhi" };
const NUM = "12";

const rows = [];
for (const [area, indicators] of Object.entries(nfhs.areas)) {
  if (area === "India") continue;
  const cell = indicators[NUM];
  if (!cell || cell.total == null) continue;
  rows.push({
    state: NAME_FIX[area] || area,
    value: cell.total,
    urban: cell.urban,
    rural: cell.rural,
    nfhs5: cell.nfhs5
  });
}
rows.sort((a, b) => b.value - a.value);

const artifact = createTableArtifact({
  indicatorId: "people.nfhs.women_schooling_10y_state",
  title: "Women with 10+ years of schooling, by state",
  sourceId: "nfhs",
  sourceIndicatorId: `NFHS-6 (2023-24), indicator ${NUM}: ${nfhs.indicators[NUM]}`,
  sourceUrl: "https://www.nfhsiips.in/nfhsuser/index.php",
  unit: "% of women",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt: new Date().toISOString(),
  rows,
  dimensions: ["value", "urban", "rural", "nfhs5"],
  metadata: {
    survey: nfhs.survey,
    india: nfhs.areas.India?.[NUM]?.total ?? null,
    note: "Share of women age 15-49 with 10 or more years of schooling. NFHS-5 (2019-21) value carried per row for the change read."
  }
});

const path = await writeSeriesArtifact({
  sourceId: "nfhs",
  name: "nfhs.IN.people_nfhs_women_schooling_10y_state",
  artifact
});
console.log(`wrote ${path} (${rows.length} states, India=${artifact.metadata.india}%)`);
