// NFHS-5 (2019-21) total fertility rate by background characteristic: education,
// wealth quintile and religion. These cuts are absent from the NFHS-6 factsheets, so
// NFHS-5 is the latest year for them. Written as table artifacts (bar charts) for the
// canonical population article. Exact figures from the India report, Table 4.2.
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const d = JSON.parse(await readFile("data/manual/nfhs5-fertility-by-background.json", "utf8"));
const manifest = [];

async function writeCut({ indicatorId, title, block, name }) {
  const rows = block.labels.map((label, i) => ({ label, value: block.values[i] }));
  const artifact = createTableArtifact({
    indicatorId, title,
    sourceId: "nfhs",
    sourceIndicatorId: d.extractedFrom,
    sourceUrl: d.sourceUrl,
    unit: d.unit,
    fetchedAt, rows,
    dimensions: ["label", "value"],
    metadata: { source: d.source, publisher: d.publisher, extractedFrom: d.extractedFrom, replacementLevel: 2.1, nationalTfr: d.nationalTfr, survey: "NFHS-5 (2019-21)" }
  });
  manifest.push({ status: "ready", indicatorId, artifact: name, fetchedAt, rows: rows.length });
  await writeSeriesArtifact({ sourceId: "nfhs", name, artifact });
}

await writeCut({ indicatorId: "people.nfhs5.tfr_by_education", title: "Fertility falls with schooling", block: d.byEducation, name: "nfhs.IN.people_nfhs5_tfr_by_education" });
await writeCut({ indicatorId: "people.nfhs5.tfr_by_wealth", title: "Fertility falls with wealth", block: d.byWealth, name: "nfhs.IN.people_nfhs5_tfr_by_wealth" });
await writeCut({ indicatorId: "people.nfhs5.tfr_by_religion", title: "Fertility by religion", block: d.byReligion, name: "nfhs.IN.people_nfhs5_tfr_by_religion" });

await writeSourceManifest("nfhs5-fertility-background", manifest);
console.log(`Wrote ${manifest.length} NFHS-5 fertility-by-background artifact(s):`);
console.log(`  education ${d.byEducation.values[0]} -> ${d.byEducation.values.at(-1)}`);
console.log(`  wealth    ${d.byWealth.values[0]} -> ${d.byWealth.values.at(-1)}`);
console.log(`  religion  ${Math.min(...d.byReligion.values)} - ${Math.max(...d.byReligion.values)}`);
