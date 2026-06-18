// Ingests the NHP 2023 "Top Ten Causes of Death in India 2017-2019" table
// (Table 1.2.12(b)), source: Causes of Deaths Statistics 2017-2019, Office of the
// Registrar General & Census Commissioner, India. We keep the five causes whose
// male/female split is most informative: cardiovascular and road deaths skew male,
// while women's deaths skew to "fever of unknown origin" and "ill-defined" causes,
// a recording-quality and access story, not just a biology one.
import { writeFile } from "node:fs/promises";
import { createSeriesArtifact, stableJson } from "./core/artifacts.mjs";

const SOURCE_URL =
  "https://cbhidghs.mohfw.gov.in/sites/default/files/NHP/NHP-2023-Last-Final.pdf";
const FETCHED_AT = new Date().toISOString();

// label, slug, male %, female %, person %
const CAUSES = [
  ["Cardiovascular diseases", "cardiovascular", 30.8, 26.2, 28.9],
  ["Cancers (neoplasms)", "neoplasms", 6.4, 7.3, 6.8],
  ["Road / motor-vehicle accidents", "road_accidents", 5.2, 1.4, 3.6],
  ["Fever of unknown origin", "fever_unknown", 4.2, 6.0, 5.0],
  ["Ill-defined / unrecorded causes", "ill_defined", 9.7, 15.5, 12.2]
];

const META = {
  publisher:
    "Office of the Registrar General & Census Commissioner, India (Causes of Death Statistics 2017-2019)",
  sourceFile: "NHP-2023-Last-Final.pdf",
  sourceTable: "NHP 2023, Table 1.2.12(b): Top Ten Causes of Death in India 2017-2019",
  period: "2017-2019",
  method:
    "Cause assigned on the SRS sample, pooled over 2017-2019. Shares are of each group's own deaths, not counts. 'Ill-defined' causes (R00-R99) are not properly diagnosed and should not be read as a true second cause group.",
  caveat:
    "Registration-based shares of deaths, pooled 2017-2019. A larger 'ill-defined' or 'fever of unknown origin' share signals deaths whose cause went unrecorded, more common for women, not a real disease pattern."
};

async function main() {
  const written = [];
  for (const [label, slug, male, female, person] of CAUSES) {
    for (const [sex, value] of [["male", male], ["female", female], ["person", person]]) {
      const indicatorId = `health.nhpcod.cod1719_${slug}_${sex}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${label} (${sex === "person" ? "all" : sex}) — share of ${
          sex === "person" ? "all" : sex
        } deaths, 2017-19`,
        sourceId: "srscod",
        sourceIndicatorId: `cod1719_${slug}_${sex}`,
        sourceUrl: SOURCE_URL,
        unit: `% of ${sex === "person" ? "all" : sex} deaths`,
        frequency: "annual",
        fetchedAt: FETCHED_AT,
        observations: [{ date: "2019", value }],
        metadata: { ...META, label, sex }
      });
      const file = `data/series/nhpcod.IN.${indicatorId}.json`;
      await writeFile(file, `${stableJson(artifact)}\n`);
      written.push(file);
    }
  }
  console.log(`wrote ${written.length} NHP causes-of-death series`);
}

main();
