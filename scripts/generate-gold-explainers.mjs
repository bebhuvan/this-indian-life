// Batched chart-explainer generator for q.econ.gold. The batched body generator
// left chartExplainers empty (to dodge the output ceiling), so chart description
// boxes fell back to the thin one-line why/read/watch. This generates a rich
// explainer per chart, in batches, and writes them into the explanation.
// visualId = chart title (renderer matches via slugifyTitle).
import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.econ.gold";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.GOLD_BATCH_SIZE || 4);
const path = `data/explanations/en/${QID}.json`;

const SYS = `You write rich, specific chart explainers for a data-journalism article on India and gold, for a curious Indian general reader. Voice: warm but rigorous, someone who knows the gold market and Indian household finance cold. Never use em-dashes. Use only numbers provided to you; round like a human ("about 5 lakh crore", "around 880 tonnes", "roughly 12%"); never invent figures, dates, named studies, or quotes. Each explainer must be vividly concrete to ITS chart and its unique story, never generic boilerplate. The reader should finish each block knowing: what the chart says, why it is here, how to read it, and the one mistake to avoid.

IMPORTANT: the detail field must be 4-7 meaty sentences. Expand on what the chart reveals, what is driving the pattern (where evidence supports it), and what it genuinely means for the reader. Do not just describe the shape. Give the mechanism or the reason. Write as if explaining to a smart friend over chai.`;

function block(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || []).filter((n) => inds.includes(n.indicatorId)).slice(0, 8)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  const info = [
    `CHART TITLE: "${v.title}"`,
    `What it measures: ${v.read || ""}`,
    `Why it is on the page: ${v.why || ""}`,
    `Known caveat: ${v.watch || ""}`
  ];
  if (nums.length) info.push(`Numbers you MUST use (no others): ${nums.join("; ")}`);
  return info.join("\n");
}

async function genExplainers(charts, locked) {
  const blocks = charts.map((c) => block(c, locked)).join("\n\n---\n\n");
  const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens: 7000, messages: [
    { role: "system", content: SYS },
    { role: "user", content: `For EACH chart below, write a rich explainer. Return JSON exactly: {"explainers":[{"visualId":"<exact chart TITLE>","title":"<chart title>","takeaway":"one vivid, memorable sentence with the key number — the single point of this chart","detail":"4-7 descriptive sentences in plain language: what the chart shows, the key numbers and trend, what is driving it (where evidence supports), and what it means for the reader. Vivid and concrete. This should genuinely help a layperson understand the chart and see its significance.","whyShowThis":"one sentence on why this chart earns its place in the argument — what question it answers that the surrounding charts do not","howToRead":"one or two short, concrete lines on exactly how to read the axes/lines/bars/shapes","mistakeToAvoid":"the single most important misreading a casual reader could make — what not to conclude","mobileNote":"a short note for the small-screen version"}]} - one per chart, same order, visualId EXACTLY equal to the chart TITLE.\n\n${blocks}` },
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

console.log(`explainers: ${plan.length} charts in ${Math.ceil(plan.length / BATCH)} batches`);
let explainers = [];
for (let i = 0; i < plan.length; i += BATCH) {
  const e = await genExplainers(plan.slice(i, i + BATCH), locked);
  explainers = explainers.concat(e);
  console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${e.length} (${explainers.length} total)`);
}

// Build sectionVisualMap: match chart titles to section headings in order.
const d = JSON.parse(await readFile(path, "utf8"));
const body = (d.article && d.article.bodyMarkdown) || "";
const headings = [];
for (const line of body.split("\n")) {
  const m = line.match(/^## (.+)/);
  if (m) headings.push(m[1].trim());
}
// Walk sections in order, assign each chart title as the visualId for that section.
// Skip sections that have no more charts (prose-only sections at the end).
const svm = headings.slice(0, plan.length).map((heading, i) => ({
  heading,
  visualId: plan[i]?.title ?? ""
}));

d.chartExplainers = explainers;
d.sectionVisualMap = svm;
await writeFile(path, stableJson(d) + "\n");
console.log(`wrote ${explainers.length} chartExplainers; avg detail ${Math.round(explainers.reduce((s, e) => s + (e.detail || "").length, 0) / Math.max(1, explainers.length))} chars`);
console.log(`sectionVisualMap: ${svm.length} entries`);
