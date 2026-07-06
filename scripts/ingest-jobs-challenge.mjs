// Ingest: India's jobs challenge, from the World Bank's "The Global Jobs Challenge"
// (2026 advance edition). Edited by T. Chrimes, M. A. Kose, K. Stamm. Washington, DC:
// World Bank. CC BY 3.0 IGO. Publication page:
//   https://www.worldbank.org/en/research/publication/global-jobs-challenge
//
// All figures transcribed from the report's companion chart workbooks (chapter 2 +
// appendixes) and the report text. Underlying population data: UN World Population
// Prospects 2024. The participation-scenario series (60-148m / 143-324m) is from the
// IMF study the report cites (Alonso & MacDonald 2024), not the World Bank's own count.
//
// This is a transcription ingest (the source is a published PDF + xlsx, not an API), so
// the values are embedded here with precise figure references in each series' metadata.
//
// Usage: node scripts/ingest-jobs-challenge.mjs

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSeriesArtifact, createTableArtifact } from "./core/artifacts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERIES_DIR = path.join(__dirname, "..", "data", "series");
const FETCHED_AT = "2026-06-27T00:00:00+00:00";

const WB_URL = "https://www.worldbank.org/en/research/publication/global-jobs-challenge";
const IMF_URL = "https://www.imf.org/en/Publications/WP/Issues/2024/02/02/Advancing-Indias-Structural-Transformation-and-Catch-up-544370";

const SOURCE_LINE =
  "World Bank, The Global Jobs Challenge (2026 advance edition). CC BY 3.0 IGO.";

async function emit(fileSlug, artifact) {
  const file = path.join(SERIES_DIR, `${fileSlug}.json`);
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n", "utf8");
  console.log(`wrote ${path.basename(file)}  (${artifact.indicatorId})`);
}

// ---------------------------------------------------------------------------
// 1. Youth method, top-10 EMDEs: young people reaching working age 2025-35.
//    Figure 2.8.A. Values in thousands -> render in millions via unit label.
// ---------------------------------------------------------------------------
const youthTop10 = [
  ["India", 238128],
  ["China", 168737],
  ["Nigeria", 61025],
  ["Pakistan", 58640],
  ["Indonesia", 46578],
  ["Ethiopia", 33374],
  ["Bangladesh", 31004],
  ["Congo, Dem. Rep.", 30661],
  ["Brazil", 27989],
  ["Egypt, Arab Rep.", 25279]
];

await emit(
  "jobs-challenge.IN.youth_reaching_wap_top10",
  createTableArtifact({
    indicatorId: "work.jobs.youth_reaching_wap_top10",
    title: "India tops the developing world's jobs challenge",
    sourceId: "worldbank",
    sourceIndicatorId: "GJC-fig-2.8.A",
    sourceUrl: WB_URL,
    unit: "million young people reaching working age, 2025-35",
    fetchedAt: FETCHED_AT,
    dimensions: ["label", "value", "group"],
    rows: youthTop10.map(([label, v]) => ({
      label,
      value: Math.round((v / 1000) * 10) / 10, // thousands -> millions, 1dp
      group: label === "India" ? "India" : "Other EMDEs"
    })),
    metadata: {
      note:
        "Top 10 emerging market and developing economies by the 'youth method' jobs " +
        "challenge: the number of young people (aged 15-24 in 2035) reaching working age " +
        "over 2025-35. India leads at ~238 million, ahead of China (~169m) and Nigeria " +
        "(~61m). Source: World Bank, The Global Jobs Challenge (2026), Figure 2.8.A; " +
        "underlying data UN World Population Prospects 2024. Projections, not measurements.",
      sourceLine: SOURCE_LINE,
      figure: "2.8.A"
    }
  })
);

// ---------------------------------------------------------------------------
// 2. India alone vs each EMDE *region* (youth method). Region totals = Fig 2.7.B;
//    India = Fig 2.8.A. Shows India alone rivals whole regions.
// ---------------------------------------------------------------------------
const regionYouth = [
  ["India (one country)", 238127.8, "India"],
  ["Sub-Saharan Africa", 332249.9, "EMDE region"],
  ["East Asia & Pacific", 284984.3, "EMDE region"],
  ["South Asia", 278125.2, "EMDE region"],
  ["Middle East & N. Africa", 170052.9, "EMDE region"],
  ["Latin America & Caribbean", 98790.2, "EMDE region"],
  ["Europe & Central Asia", 65168.8, "EMDE region"]
];

await emit(
  "jobs-challenge.IN.india_vs_regions_youth",
  createTableArtifact({
    indicatorId: "work.jobs.india_vs_regions_youth",
    title: "One country, a fifth of the problem",
    sourceId: "worldbank",
    sourceIndicatorId: "GJC-fig-2.7.B+2.8.A",
    sourceUrl: WB_URL,
    unit: "million young people reaching working age, 2025-35",
    fetchedAt: FETCHED_AT,
    dimensions: ["label", "value", "group"],
    rows: regionYouth.map(([label, v, group]) => ({
      label,
      value: Math.round((v / 1000) * 10) / 10,
      group
    })),
    metadata: {
      note:
        "India's youth-method jobs challenge (~238m) set against the total for each entire " +
        "EMDE region. India alone is about 86% of all South Asia, ~72% of all Sub-Saharan " +
        "Africa, and larger than the Middle East & North Africa, Latin America, or Europe & " +
        "Central Asia regions individually. Across all EMDEs the youth-method total is ~1.23 " +
        "billion, so India is roughly one in five. Source: World Bank, The Global Jobs " +
        "Challenge (2026), regional totals from Figure 2.7.B, India from Figure 2.8.A.",
      sourceLine: SOURCE_LINE,
      figure: "2.7.B / 2.8.A"
    }
  })
);

// ---------------------------------------------------------------------------
// 3. Working-age method, top-10 EMDEs: net working-age increase 2025-50.
//    Figure 2.8.D. India still #1 a generation out.
// ---------------------------------------------------------------------------
const wap2050Top10 = [
  ["India", 132447],
  ["Nigeria", 97929],
  ["Pakistan", 89038],
  ["Congo, Dem. Rep.", 71612],
  ["Ethiopia", 66906],
  ["Tanzania", 40240],
  ["Egypt, Arab Rep.", 31229],
  ["Bangladesh", 28456],
  ["Uganda", 27153],
  ["Afghanistan", 24670]
];

await emit(
  "jobs-challenge.IN.wap_increase_2050_top10",
  createTableArtifact({
    indicatorId: "work.jobs.wap_increase_2050_top10",
    title: "Still the biggest a generation out",
    sourceId: "worldbank",
    sourceIndicatorId: "GJC-fig-2.8.D",
    sourceUrl: WB_URL,
    unit: "million net working-age increase, 2025-50",
    fetchedAt: FETCHED_AT,
    dimensions: ["label", "value", "group"],
    rows: wap2050Top10.map(([label, v]) => ({
      label,
      value: Math.round((v / 1000) * 10) / 10,
      group: label === "India" ? "India" : "Other EMDEs"
    })),
    metadata: {
      note:
        "Top 10 EMDEs by the 'working-age method': net increase in the working-age " +
        "population (15-64) over 2025-50. India leads at ~132 million, ahead of Nigeria " +
        "(~98m) and Pakistan (~89m). India is also #1 over the shorter 2025-35 window " +
        "(~91m, Figure 2.8.C). Source: World Bank, The Global Jobs Challenge (2026), " +
        "Figure 2.8.D; underlying data UN World Population Prospects 2024.",
      sourceLine: SOURCE_LINE,
      figure: "2.8.D"
    }
  })
);

// ---------------------------------------------------------------------------
// 4. India youth-population (15-24) growth rate, % per year. Figure 2.2.C.
//    Turns negative around 2021 -- the cohort has stopped growing.
// ---------------------------------------------------------------------------
const youthIndia = [[2000,2.18],[2001,2.07],[2002,1.95],[2003,1.87],[2004,1.64],[2005,1.45],[2006,1.33],[2007,1.14],[2008,1.06],[2009,1.03],[2010,0.91],[2011,0.82],[2012,0.79],[2013,0.75],[2014,0.75],[2015,0.84],[2016,0.82],[2017,0.66],[2018,0.48],[2019,0.34],[2020,0.2],[2021,-0.03],[2022,-0.17],[2023,-0.2],[2024,-0.33],[2027,-0.65],[2028,-0.81],[2029,-0.85],[2030,-0.67],[2031,-0.69],[2033,-0.83],[2034,-1.03],[2035,-1.12],[2036,-1.1],[2037,-1.02],[2038,-0.79],[2039,-0.66],[2040,-0.75]];

await emit(
  "jobs-challenge.IN.india_youth_growth",
  createSeriesArtifact({
    indicatorId: "work.jobs.india_youth_growth",
    title: "India's youth population has stopped growing",
    sourceId: "worldbank",
    sourceIndicatorId: "GJC-fig-2.2.C-IND",
    sourceUrl: WB_URL,
    unit: "% annual growth in population aged 15-24",
    frequency: "annual",
    fetchedAt: FETCHED_AT,
    observations: youthIndia.map(([y, v]) => ({ date: String(y), value: v })),
    metadata: {
      note:
        "Annual growth rate of India's youth population (aged 15-24). It crosses below zero " +
        "around 2021 and stays negative: India's youth cohort is no longer growing, even " +
        "though the absolute number reaching working age stays the largest in the world. The " +
        "demographic window is cresting, not still opening. A few projection years (2025, " +
        "2026, 2032) are absent in the source workbook and omitted here. Source: World Bank, " +
        "The Global Jobs Challenge (2026), Figure 2.2.C (India line); UN WPP 2024.",
      sourceLine: SOURCE_LINE,
      figure: "2.2.C",
      zeroBaseline: true
    }
  })
);

// ---------------------------------------------------------------------------
// 4b. India working-age (15-64) population growth rate, % per year. Figure 2.3.B.
//     Still positive but decelerating to ~zero by 2049; negative by 2050. Shows the
//     broader 15-64 pool flattening, a beat behind the youth cohort in 2.2.C.
// ---------------------------------------------------------------------------
const wapIndia = [[2000,2.47],[2001,2.46],[2002,2.39],[2003,2.31],[2004,2.31],[2005,2.26],[2006,2.21],[2007,2.17],[2008,2.08],[2009,2.08],[2010,2.09],[2011,2.05],[2012,1.99],[2013,1.95],[2014,1.86],[2015,1.76],[2016,1.75],[2017,1.71],[2018,1.6],[2019,1.49],[2020,1.42],[2021,1.29],[2022,1.19],[2023,1.2],[2024,1.2],[2027,1.08],[2028,1.02],[2029,0.93],[2030,0.87],[2031,0.85],[2033,0.73],[2034,0.68],[2035,0.61],[2036,0.54],[2037,0.49],[2038,0.46],[2039,0.42],[2040,0.39],[2041,0.35],[2042,0.31],[2043,0.28],[2044,0.23],[2045,0.18],[2046,0.13],[2047,0.08],[2048,0.03],[2049,-0.02],[2050,-0.07]];

await emit(
  "jobs-challenge.IN.india_wap_growth",
  createSeriesArtifact({
    indicatorId: "work.jobs.india_wap_growth",
    title: "Even the working-age pool is starting to flatten",
    sourceId: "worldbank",
    sourceIndicatorId: "GJC-fig-2.3.B-IND",
    sourceUrl: WB_URL,
    unit: "% annual growth, population aged 15-64",
    frequency: "annual",
    fetchedAt: FETCHED_AT,
    observations: wapIndia.map(([y, v]) => ({ date: String(y), value: v })),
    metadata: {
      note:
        "Annual growth rate of India's working-age population (aged 15-64). Still positive " +
        "but slowing steadily, from about 2.5% in 2000 to under 1% by 2030 and roughly zero " +
        "by 2049, turning negative in 2050. The broad 15-64 pool is still expanding, a beat " +
        "behind the youth cohort (which already shrinks, Fig 2.2.C), but its growth is " +
        "fading too: the demographic tailwind has a clear end date. A few projection years " +
        "(2025, 2026, 2032) are absent in the source workbook and omitted here. Source: " +
        "World Bank, The Global Jobs Challenge (2026), Figure 2.3.B (India line); UN WPP 2024.",
      sourceLine: SOURCE_LINE,
      figure: "2.3.B",
      zeroBaseline: true
    }
  })
);

// ---------------------------------------------------------------------------
// 5. Total population, India vs China, billions. Figure 2.1.A (UN WPP 2024).
//    India overtakes China ~2022-23; peaks ~1.70bn around 2061.
// ---------------------------------------------------------------------------
const popIndia = [[1990,0.865],[1991,0.884],[1992,0.903],[1993,0.922],[1994,0.941],[1995,0.96],[1996,0.98],[1997,0.999],[1998,1.019],[1999,1.038],[2000,1.058],[2001,1.078],[2002,1.098],[2003,1.117],[2004,1.136],[2005,1.155],[2006,1.173],[2007,1.191],[2008,1.208],[2009,1.226],[2010,1.243],[2011,1.261],[2012,1.279],[2013,1.296],[2014,1.312],[2015,1.328],[2016,1.344],[2017,1.36],[2018,1.375],[2019,1.389],[2020,1.403],[2021,1.414],[2022,1.425],[2023,1.438],[2024,1.451],[2025,1.464],[2026,1.477],[2027,1.489],[2028,1.501],[2029,1.513],[2030,1.525],[2031,1.537],[2032,1.548],[2033,1.558],[2034,1.569],[2035,1.579],[2036,1.588],[2037,1.598],[2038,1.606],[2039,1.615],[2040,1.623],[2041,1.63],[2042,1.637],[2043,1.644],[2044,1.65],[2045,1.656],[2046,1.662],[2047,1.667],[2048,1.671],[2049,1.676],[2050,1.68],[2055,1.694],[2060,1.701],[2061,1.701],[2065,1.699],[2070,1.689],[2075,1.671],[2080,1.646],[2085,1.615],[2090,1.58],[2095,1.543],[2100,1.505]];
const popChina = [[1990,1.154],[1991,1.171],[1992,1.185],[1993,1.197],[1994,1.209],[1995,1.22],[1996,1.231],[1997,1.241],[1998,1.251],[1999,1.26],[2000,1.27],[2001,1.279],[2002,1.287],[2003,1.295],[2004,1.302],[2005,1.31],[2006,1.318],[2007,1.326],[2008,1.334],[2009,1.343],[2010,1.352],[2011,1.36],[2012,1.37],[2013,1.379],[2014,1.388],[2015,1.396],[2016,1.404],[2017,1.412],[2018,1.419],[2019,1.424],[2020,1.426],[2021,1.426],[2022,1.425],[2023,1.423],[2024,1.419],[2025,1.416],[2026,1.413],[2027,1.41],[2028,1.406],[2029,1.402],[2030,1.398],[2031,1.394],[2032,1.389],[2033,1.384],[2034,1.379],[2035,1.373],[2036,1.368],[2037,1.362],[2038,1.356],[2039,1.349],[2040,1.343],[2041,1.336],[2042,1.329],[2043,1.322],[2044,1.314],[2045,1.306],[2046,1.298],[2047,1.289],[2048,1.28],[2049,1.27],[2050,1.26],[2055,1.202],[2060,1.135],[2061,1.121],[2065,1.066],[2070,0.999],[2075,0.934],[2080,0.87],[2085,0.806],[2090,0.745],[2095,0.688],[2100,0.633]];

const popMeta = (who) => ({
  note:
    `Total population of ${who}, billions, 1990-2100 (UN World Population Prospects 2024, ` +
    "as presented in the World Bank's The Global Jobs Challenge, Figure 2.1.A). India " +
    "overtakes China around 2022-23 and peaks near 1.70 billion around 2061; China is in " +
    "sustained decline. Post-2050 points are shown at 5-year steps. Projections beyond 2024.",
  sourceLine: SOURCE_LINE,
  figure: "2.1.A"
});

await emit(
  "jobs-challenge.IN.population_india",
  createSeriesArtifact({
    indicatorId: "work.jobs.population_india",
    title: "India, total population",
    sourceId: "worldbank",
    sourceIndicatorId: "GJC-fig-2.1.A-IND",
    sourceUrl: WB_URL,
    unit: "billion people",
    frequency: "annual",
    fetchedAt: FETCHED_AT,
    observations: popIndia.map(([y, v]) => ({ date: String(y), value: v })),
    metadata: popMeta("India")
  })
);

await emit(
  "jobs-challenge.CN.population_china",
  createSeriesArtifact({
    indicatorId: "work.jobs.population_china",
    title: "China, total population",
    sourceId: "worldbank",
    sourceIndicatorId: "GJC-fig-2.1.A-CHN",
    sourceUrl: WB_URL,
    unit: "billion people",
    frequency: "annual",
    geography: { type: "country", id: "CN", name: "China" },
    fetchedAt: FETCHED_AT,
    observations: popChina.map(([y, v]) => ({ date: String(y), value: v })),
    metadata: popMeta("China")
  })
);

// ---------------------------------------------------------------------------
// 6. The participation lever: jobs India needs, by labour-force-participation
//    assumption. Alonso & MacDonald 2024 (IMF), cited by the report.
// ---------------------------------------------------------------------------
const lfpScenarios = [
  ["If participation stays flat", 60, "Jobs needed by 2030"],
  ["If participation rises to target", 148, "Jobs needed by 2030"],
  ["If participation stays flat", 143, "Jobs needed by 2050"],
  ["If participation rises to target", 324, "Jobs needed by 2050"]
];

await emit(
  "jobs-challenge.IN.lfp_job_scenarios",
  createTableArtifact({
    indicatorId: "work.jobs.lfp_job_scenarios",
    title: "A 60-million job problem, or a 148-million one",
    sourceId: "imf",
    sourceIndicatorId: "Alonso-MacDonald-2024",
    sourceUrl: IMF_URL,
    unit: "million new jobs needed",
    fetchedAt: FETCHED_AT,
    dimensions: ["label", "value", "group"],
    rows: lfpScenarios.map(([label, value, group]) => ({ label, value, group })),
    metadata: {
      note:
        "How many new jobs India must create depends overwhelmingly on one assumption: " +
        "labour-force participation, and above all women's. Holding participation at the " +
        "current rate implies ~60 million new jobs by 2030; lifting it toward a target rate " +
        "implies ~148 million. By 2050 the same lever spans ~143m to ~324m. Source: Alonso, " +
        "C. & M. MacDonald (2024), 'Advancing India's Structural Transformation' (IMF), as " +
        "cited in the World Bank's The Global Jobs Challenge (2026). A cited external study, " +
        "not the World Bank's own estimate.",
      sourceLine:
        "IMF (Alonso & MacDonald 2024), cited in World Bank, The Global Jobs Challenge (2026).",
      figure: "cited in text (ch.2)"
    }
  })
);

console.log("\nDone. 8 series written to data/series/.");
