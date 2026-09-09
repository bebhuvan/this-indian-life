// Retitle the FDI-and-development charts so each states a finding instead of naming a topic.
//
// Every figure in the new titles was checked against the artifacts before this script was
// written. The rebinding is the load-bearing part: chartId is slugifyTitle(title), and
// sectionVisualMap and chartExplainers both key off it, so changing a title without updating
// both silently unbinds the charts from their prose. The renderer falls back to a token
// heuristic and the build stays green, so nothing would tell you it broke.
//
// Run: node scripts/retitle-fdi-development-charts.mjs

import { readFileSync, writeFileSync } from "node:fs";

const QID = "q.econ.fdi_development";
const slug = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const RETITLE = [
  ["How much of what India builds is paid for by foreigners", "Foreign money has never paid for more than a tenth of what India builds"],
  ["Fifty-six years, and India is almost always the bottom line", "In fifty-six years India has never out-raised Latin America"],
  ["India did climb, and the climb was real", "From 43rd in the world in 1990 to 12th in 2025"],
  ["Two different ways to build a country", "Viet Nam builds with foreign money. India, like Korea, does not."],
  ["India is the South Asian norm, not the exception", "Pakistan has out-raised India in 23 of the last 36 years"],
  ["Thirty-six years of foreign investment, per Indian", "$547 per Indian, against $2,243 per Chinese"],
  ["Where the factories actually went", "Southeast Asia took 6.3 times India's inflow in 2025"],
  ["India's slice of the developing world's investment", "India's slice of developing-world investment fell from 10.2% to 4.3%"],
  ["How much of the economy foreigners actually own", "Foreigners own the equivalent of 13.5% of one year's output"],
  ["Building something new, or buying something old", "In 2024 and 2025, foreign firms were net sellers of Indian companies"],
  ["What gets announced, and what turns up", "India announced $111 billion of projects in 2024 and recorded $27 billion"],
  ["India's FDI, era by era", "The Make in India years were the best era, at 6.3% of capital formation"],
  ["Indian firms announce projects abroad too", "One dollar announced abroad for every three announced at home"],
  ["Two stakes converging", "Foreign holdings were 13 times Indian holdings abroad in 1990. Now 1.9."],
  ["Where the developing world's biggest firms come from", "China has 41 of the developing world's 100 biggest firms. India has 4."]
];

// ---- registry -------------------------------------------------------------
const regPath = "scripts/registry/v1-indicators.mjs";
let reg = readFileSync(regPath, "utf8");
const start = reg.indexOf(`id: "${QID}"`);
const end = reg.indexOf('id: "q.econ.', start + 10);
let block = reg.slice(start, end);
for (const [oldT, newT] of RETITLE) {
  const needle = `title: ${JSON.stringify(oldT)},`;
  if (block.split(needle).length - 1 !== 1) throw new Error(`registry title not found once: ${oldT}`);
  block = block.replace(needle, `title: ${JSON.stringify(newT)},`);
}
reg = reg.slice(0, start) + block + reg.slice(end);
writeFileSync(regPath, reg);
console.log(`registry: ${RETITLE.length} titles replaced`);

// ---- explanation: rebind the map and the explainers ------------------------
const expPath = `data/explanations/en/${QID}.json`;
const exp = JSON.parse(readFileSync(expPath, "utf8"));
const oldToNew = new Map(RETITLE.map(([o, n]) => [slug(o), slug(n)]));
let svm = 0, ce = 0;
for (const e of exp.sectionVisualMap || []) {
  if (oldToNew.has(e.visualId)) { e.visualId = oldToNew.get(e.visualId); svm++; }
}
for (const e of exp.chartExplainers || []) {
  const s = slug(e.visualId);
  if (oldToNew.has(s)) { e.visualId = oldToNew.get(s); ce++; }
  if (e.title) {
    const hit = RETITLE.find(([o]) => o === e.title);
    if (hit) e.title = hit[1];
  }
}
writeFileSync(expPath, JSON.stringify(exp, null, 2) + "\n");
console.log(`explanation: ${svm} sectionVisualMap entries, ${ce} chartExplainers rebound`);

// ---- evidence: plannedCharts carry chartId too ------------------------------
const evPath = `data/explanations/en/${QID}.evidence.json`;
const ev = JSON.parse(readFileSync(evPath, "utf8"));
let pc = 0;
for (const c of ev.plannedCharts || []) {
  const hit = RETITLE.find(([o]) => o === c.title);
  if (hit) { c.title = hit[1]; c.chartId = slug(hit[1]); pc++; }
}
writeFileSync(evPath, JSON.stringify(ev, null, 2) + "\n");
console.log(`evidence: ${pc} plannedCharts retitled`);
