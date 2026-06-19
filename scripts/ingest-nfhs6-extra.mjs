// Extra NFHS-5/6 indicators for q.health.transition: the private-vs-public C-section
// gap (indicators 39/40) and tobacco/alcohol use by sex (98-101). Two survey rounds,
// charted via categoricalX (NFHS-5 -> NFHS-6), never as an annual time series.
import { writeFile } from "node:fs/promises";
import { createSeriesArtifact, stableJson } from "./core/artifacts.mjs";

const SRC = "https://www.nfhsiips.in/nfhsuser/index.php";
const FETCHED_AT = new Date().toISOString();

// slug, title, factsheet indicator no, nfhs5, nfhs6, unit
const SERIES = [
  ["c_section_private", "Caesarean section, births in private facilities", 39, 47.4, 54.1, "% of private-facility births"],
  ["c_section_public", "Caesarean section, births in public facilities", 40, 14.3, 16.9, "% of public-facility births"],
  ["tobacco_men", "Men age 15+ who use any tobacco", 99, 38.0, 36.3, "% of men 15+"],
  ["tobacco_women", "Women age 15+ who use any tobacco", 98, 8.9, 8.4, "% of women 15+"],
  ["alcohol_men", "Men age 15+ who consume alcohol", 101, 18.7, 18.9, "% of men 15+"],
  ["alcohol_women", "Women age 15+ who consume alcohol", 100, 1.3, 1.1, "% of women 15+"]
];

async function main() {
  const written = [];
  for (const [slug, title, no, n5, n6, unit] of SERIES) {
    const artifact = createSeriesArtifact({
      indicatorId: `health.transition.nfhs.${slug}`,
      title,
      sourceId: "nfhs",
      sourceIndicatorId: `NFHS factsheet indicator ${no}`,
      sourceUrl: SRC,
      unit,
      frequency: "irregular",
      fetchedAt: FETCHED_AT,
      observations: [
        { date: "2021-03-31", value: n5 },
        { date: "2024-03-31", value: n6 }
      ],
      metadata: {
        survey: "NFHS-5 (2019-21) and NFHS-6 (2023-24)",
        method:
          "National Family Health Survey fact-sheet values. NFHS-5 is represented at 2021-03-31 and NFHS-6 at 2024-03-31 for charting; these are two survey rounds, not an annual time series."
      }
    });
    const file = `data/series/nfhs.health-transition.${slug}.json`;
    await writeFile(file, `${stableJson(artifact)}\n`);
    written.push(file);
  }
  console.log(`wrote ${written.length} NFHS extra series:`);
  written.forEach((f) => console.log("  " + f));
}

main();
