import { readFile } from "node:fs/promises";
import {
  createSeriesArtifact,
  mergeSourceManifest,
  writeSeriesArtifact
} from "./core/artifacts.mjs";
import { fetchPipNational, pipMeta } from "./adapters/pip.mjs";

const fetchedAt = new Date().toISOString();
const geoIN = { type: "country", id: "IN", name: "India" };
const entries = [];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeSeries({ id, title, sourceId, sourceIndicatorId, sourceUrl, unit, observations, metadata = {} }) {
  const artifact = createSeriesArtifact({
    indicatorId: id,
    title,
    sourceId,
    sourceIndicatorId,
    sourceUrl,
    unit,
    frequency: "survey years",
    geography: geoIN,
    fetchedAt,
    observations,
    metadata
  });
  const file = await writeSeriesArtifact({ sourceId: "poverty", name: `poverty.IN.${id.split(".").pop()}`, artifact });
  entries.push({ status: "ready", indicatorId: id, sourceIndicatorId, source: sourceId, artifact: file, observations: observations.length, fetchedAt });
  console.log(`poverty reader-unit series ${id} (${observations.length})`);
}

const wbLineUpdateUrl = "https://blogs.worldbank.org/en/opendata/the-world-bank-s-new-global-poverty-lines-in-2021-prices";
// $8.30 headcount now comes from PIP (canonical, version-pinned) rather than the
// WDI SI.POV.UMIC snapshot. The derived crore count below is rebuilt on the same
// PIP rates so the two stay consistent.
const pip830 = await fetchPipNational({ povline: "8.30" });
const umicUrl = pip830.sourceUrl;

const poor300 = await readJson("data/series/poverty.IN.wb_poor_300.json");
const poor420 = await readJson("data/series/poverty.IN.wb_poor_420.json");
const population = await readJson("data/series/worldbank.IN.SP_POP_TOTL.json");
const popByYear = new Map(population.observations.map((d) => [d.date, d.value]));
const umicRates = pip830.headcountObs;

const commonMeta = {
  provenance: "Derived for Indian-reader display from World Bank Poverty & Equity Brief counts and World Bank WDI population data.",
  method: "Count in crore = million people / 10. The upper-middle-income line count uses WDI SI.POV.UMIC headcount multiplied by WDI SP.POP.TOTL and divided by 1 crore.",
  note: "Original million-person counts are retained in the source artifacts and article prose."
};

await writeSeries({
  id: "econ.poverty.wb_poor_300_crore",
  title: "People below $3/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "Derived from Poverty & Equity Brief October 2025: $3 number of poor",
  sourceUrl: poor300.sourceUrl,
  unit: "crore people",
  observations: poor300.observations.map((d) => ({ date: d.date, value: Number((d.value / 10).toFixed(2)) })),
  metadata: commonMeta
});

await writeSeries({
  id: "econ.poverty.wb_poor_420_crore",
  title: "People below $4.20/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "Derived from Poverty & Equity Brief October 2025: LMIC number of poor",
  sourceUrl: poor420.sourceUrl,
  unit: "crore people",
  observations: poor420.observations.map((d) => ({ date: d.date, value: Number((d.value / 10).toFixed(2)) })),
  metadata: commonMeta
});

await writeSeries({
  id: "econ.poverty.wb_poverty_830",
  title: "Poverty headcount at $8.30/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "PIP: poverty headcount, $8.30/day (2021 PPP)",
  sourceUrl: umicUrl,
  unit: "% of population",
  observations: umicRates,
  metadata: {
    ...pipMeta({ povline: "8.30", measure: "headcount" }),
    lineUpdate: "The World Bank updated the previous $6.85/day line in 2017 PPP to $8.30/day in 2021 PPP."
  }
});

await writeSeries({
  id: "econ.poverty.wb_poor_830_crore",
  title: "People below $8.30/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "PIP $8.30/day headcount x WDI SP.POP.TOTL",
  sourceUrl: umicUrl,
  unit: "crore people",
  observations: umicRates
    .filter((d) => popByYear.has(d.date))
    .map((d) => ({ date: d.date, value: Number(((d.value / 100) * popByYear.get(d.date) / 10_000_000).toFixed(1)) })),
  metadata: {
    ...commonMeta,
    provenance: "Derived from the PIP $8.30/day (2021 PPP) headcount and WDI population.",
    lineUpdate: "The World Bank updated the previous $6.85/day line in 2017 PPP to $8.30/day in 2021 PPP."
  }
});

await writeSeries({
  id: "econ.poverty.ppp_rupee_equivalents_2021",
  title: "Rupee equivalents of World Bank poverty lines, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "World Bank 2021 PPP line update; PA.NUS.PRVT.PP",
  sourceUrl: wbLineUpdateUrl,
  unit: "₹ per person per day, 2021 PPP",
  observations: [
    { date: "$3/day", value: 58 },
    { date: "$4.20/day", value: 82 },
    { date: "$8.30/day", value: 162 }
  ],
  metadata: {
    provenance: "World Bank global poverty-line update and India household consumption PPP conversion factor for 2021.",
    method: "Approximate rupee equivalents use India's 2021 household final consumption PPP conversion factor of about Rs 19.47 per international dollar, rounded to whole rupees.",
    caveat: "These are 2021 PPP rupees, not market exchange-rate rupees and not current-price Indian poverty lines."
  }
});

await mergeSourceManifest("poverty", entries);
