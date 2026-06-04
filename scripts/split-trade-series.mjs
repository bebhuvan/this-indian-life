// One-off codemod: split the monolithic q.econ.trade question into a 4-page
// linked series, partitioning its visualPlan by each entry's `beat`.
import { readFileSync, writeFileSync } from "node:fs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const file = "scripts/registry/v1-indicators.mjs";
const src = v1Questions.find((q) => q.id === "q.econ.trade");
const plan = src.visualPlan;

const PAGES = [
  { id: "q.econ.trade", question: "How does India trade with the world?",
    beats: ["level", "deficit", "real-growth", "openness", "world-share", "per-capita", "who-pays", "net-balance", "remit-gdp", "current-account"] },
  { id: "q.econ.trade_partners", question: "Who does India trade with?",
    beats: ["export-partners", "import-partners", "export-products", "import-products", "basket", "import-basket", "china", "russia", "region-exports", "region-imports", "recency", "concentration"] },
  { id: "q.econ.trade_services", question: "Is India a services superpower?",
    beats: ["goods-vs-services", "share-comparison", "services-composition", "services-share", "ict", "services-peers"] },
  { id: "q.econ.trade_competitiveness", question: "How competitive is India's trade with the world?",
    beats: ["divergence", "goods-peers", "complexity", "complexity-rank", "rca", "value-added", "gvc", "shipping", "terms-of-trade", "openness-compare", "tariffs", "preferential", "tariff-compare", "high-tech", "import-share"] }
];

const refsOf = (entries) => {
  const s = new Set();
  for (const e of entries) {
    if (e.indicator) s.add(e.indicator);
    for (const ser of e.series || []) if (ser.indicator) s.add(ser.indicator);
  }
  return [...s];
};

const assigned = new Set();
const questions = PAGES.map((p) => {
  const entries = plan.filter((e) => p.beats.includes(e.beat));
  entries.forEach((e) => assigned.add(e.beat));
  const refs = refsOf(entries);
  return {
    id: p.id,
    question: p.question,
    priority: "core",
    series: "trade",
    indicators: refs.slice(0, 5),
    core: refs.slice(0, 5),
    context: refs,
    visualPlan: entries
  };
});

const orphans = plan.filter((e) => !assigned.has(e.beat)).map((e) => e.beat);
if (orphans.length) { console.error("ORPHAN beats (not assigned to any page):", orphans); process.exit(1); }
console.log("charts per page:", questions.map((q) => `${q.id}=${q.visualPlan.length}`).join(", "));

// Serialize the 4 question objects as JS (JSON is valid JS here), indented to sit
// as elements of the v1Questions array (2-space indent).
const serialized = questions
  .map((q) => JSON.stringify(q, null, 2).split("\n").map((l) => "  " + l).join("\n"))
  .join(",\n");

// Splice into the source file: replace the single q.econ.trade object literal
// (the last element of v1Questions) with the 4 new objects.
const text = readFileSync(file, "utf8");
const startMarker = '  {\n    id: "q.econ.trade",';
const startIdx = text.indexOf(startMarker);
if (startIdx === -1) throw new Error("could not locate q.econ.trade object start");
const arrEndIdx = text.indexOf("\n];", startIdx); // v1Questions closes here
if (arrEndIdx === -1) throw new Error("could not locate v1Questions array end");
// The object's closing brace is the last "}" before arrEndIdx.
const objEnd = text.lastIndexOf("}", arrEndIdx) + 1;
const before = text.slice(0, startIdx);
const after = text.slice(objEnd);
writeFileSync(file, before + serialized + after);
console.log("Spliced 4 trade pages into", file);
