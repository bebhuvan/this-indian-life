// Chart-explainer generator for q.people.population — dense, zero-fluff edition.
import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.people.population";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.POP_BATCH_SIZE || 5);
const path = `data/explanations/en/${QID}.json`;

const SYS = `You write chart descriptions for a data-journalism article on India's population. Audience: an Indian lay reader with high-school education.

STRICT RULES — failure will cause rejection:
1. NEVER start with "This chart shows", "The line chart displays", "A bar chart traces", or any mechanical description of the visual. Start with the FACT. Jump straight to the finding.
2. NO sentence should describe what kind of chart it is, what axis has what, or how the visual is laid out. The reader can see the chart.
3. Every sentence must earn its place. If you can delete it without losing information, delete it.
4. Lead with the numbers. "India's TFR fell from 5.9 in 1960 to 2.0 in 2024." Not "Fertility has declined significantly over the decades."
5. Detail block: exactly 4-5 dense sentences. Each sentence advances understanding. No throat-clearing.
6. No em-dashes. Round numbers like a human. Never invent data.

A good detail block looks like: "The TFR dropped from 5.9 births per woman in 1960 to 2.0 in 2024, slipping below the 2.1 replacement level around 2020. The steepest fall happened between 1970 and 1990 as family planning programmes expanded and incomes rose. Urban women now average 1.5 children, well below replacement, while rural women are at 2.1. Only five states — Bihar, Uttar Pradesh, Jharkhand, Madhya Pradesh and Rajasthan — still have fertility above replacement. This means India's population growth is now driven by momentum from its young age structure, not by large families."

NOT like: "This chart shows fertility rates over time with separate lines for rural and urban areas. The downward trend is visible. It is important because it tells us about population growth." (This is filler — rejected.)`;

function block(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || []).filter((n) => inds.includes(n.indicatorId)).slice(0, 8)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  const info = [
    `CHART: "${v.title}"`,
    `What it is: ${v.read || ""}`,
    `Why on page: ${v.why || ""}`,
    `Caveat: ${v.watch || ""}`
  ];
  if (nums.length) info.push(`Available numbers: ${nums.join("; ")}`);
  return info.join("\n");
}

async function genExplainers(charts, locked) {
  const blocks = charts.map((c) => block(c, locked)).join("\n\n---\n\n");
  const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens: 8000, messages: [
    { role: "system", content: SYS },
    { role: "user", content: `For each chart, write a dense, zero-filler description. Return JSON: {"explainers":[{"visualId":"EXACT chart title as given","title":"exact title","takeaway":"One sharp sentence — the single most important finding with its number","detail":"4-5 sentences. NO filler words. NO chart mechanics. Start with the fact. Use the numbers. Explain what drove the pattern and what it means. Every sentence must carry weight.","whyShowThis":"What question does this chart answer that others do not? One tight sentence.","howToRead":"ONLY write this if there is a genuine misreading trap. Otherwise: \"\" (empty string).","mistakeToAvoid":"The one wrong conclusion a casual reader might draw","mobileNote":"Brief phone note"}]} — one per chart. Same order. visualId exactly equals the CHART title above.\n\n${blocks}` },
  ]});
  return Array.isArray(c.json.explainers) ? c.json.explainers : [];
}

const question = v1Questions.find((q) => q.id === QID);
const files = await listJsonFiles("data/series");
const artifacts = [];
for (const f of files) { try { artifacts.push(await readJson(f)); } catch {} }
const evidence = buildEvidencePacket({ question, artifacts });
const locked = evidence.lockedNumbers || [];
const plan = (question.visualPlan || []).filter((v) => v.indicator || (v.series && v.series.length));

console.log(`${plan.length} charts in ${Math.ceil(plan.length / BATCH)} batches`);
let explainers = [];
// Clean start
for (let i = 0; i < plan.length; i += BATCH) {
  const e = await genExplainers(plan.slice(i, i + BATCH), locked);
  explainers = explainers.concat(e);
  console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${e.length} (${explainers.length} total)`);
}

// Build sectionVisualMap
const d = JSON.parse(await readFile(path, "utf8"));
const body = (d.article && d.article.bodyMarkdown) || "";
const headings = [];
for (const line of body.split("\n")) {
  const m = line.match(/^## (.+)/);
  if (m) headings.push(m.group(1).trim());
}
const svm = headings.slice(0, plan.length).map((heading, i) => ({
  heading,
  visualId: plan[i]?.title ?? ""
}));

d.chartExplainers = explainers;
d.sectionVisualMap = svm;
await writeFile(path, stableJson(d) + "\n");
const avg = Math.round(explainers.reduce((s, e) => s + (e.detail || "").length, 0) / Math.max(1, explainers.length));
console.log(`wrote ${explainers.length} explainers, avg detail ${avg} chars`);
console.log(`sectionVisualMap: ${svm.length} entries`);
