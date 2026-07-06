// Rich chart-explainer generator for q.econ.rupee. The article shipped with thin
// (2-sentence) explainer details, well below the gold/asia flagship standard
// (~117-word details). This regenerates a rich explainer per chart, in batches,
// using ONLY the locked numbers each chart is allowed to cite. It writes the
// result to a scratchpad file and does NOT touch the article or sectionVisualMap
// (that binding was hand-fixed and must be preserved). visualId = chart title.
import { writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.econ.rupee";
const MODEL = "deepseek-v4-pro";
const BATCH = Number(process.env.RUPEE_BATCH_SIZE || 4);
const OUT = process.env.RUPEE_EXPLAINER_OUT || "/tmp/rupee-explainers.json";

const SYS = `You write rich, specific chart explainers for a flagship data-journalism article on why the Indian rupee falls, for a curious, intelligent Indian general reader. Voice: warm but rigorous, an economist who knows Indian macro, the balance of payments, RBI exchange-rate policy and the empirical FX literature cold, explaining to a smart friend over chai. Never use em-dashes. Never talk down.

Hard rules on accuracy, because this article must survive an economist reading it:
- Use ONLY the numbers provided to you for each chart. Never invent figures, dates, named studies, or quotes. If no number is provided for a claim, describe the shape qualitatively instead.
- Round like a human ("about 55%", "roughly 95 on a 1994 base", "around 100 billion dollars"). Present estimates as ranges, never false precision.
- Keep the core distinctions straight: devaluation (a policy event under a peg) vs depreciation (a market move); bilateral INR/USD vs effective (trade-weighted NEER); nominal vs real (REER, inflation-adjusted). A rising rupees-per-dollar number means a WEAKER rupee.
- Never claim a single cause. The rupee reflects inflation gaps, capital flows, the dollar cycle and RBI management at once.

IMPORTANT: the detail field must be 5 to 7 meaty sentences. State the key numbers actually on the chart, explain the mechanism or reason behind the pattern (where the evidence supports it), give a sense of scale or context, and land what it genuinely means for the reader (importer, saver, traveller, borrower). Do not merely describe the shape of the line. Each explainer must be vivid and specific to ITS chart, never generic boilerplate.`;

function block(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || []).filter((n) => inds.includes(n.indicatorId)).slice(0, 10)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  const info = [
    `CHART TITLE: "${v.title}"`,
    v.subtitle ? `Subtitle: ${v.subtitle}` : "",
    `What it measures: ${v.read || ""}`,
    `Why it is on the page: ${v.why || ""}`,
    `Known caveat: ${v.watch || ""}`
  ].filter(Boolean);
  if (nums.length) info.push(`Numbers you MUST use (no others): ${nums.join("; ")}`);
  return info.join("\n");
}

async function genExplainers(charts, locked) {
  const blocks = charts.map((c) => block(c, locked)).join("\n\n---\n\n");
  const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens: 8000, messages: [
    { role: "system", content: SYS },
    { role: "user", content: `For EACH chart below, write a rich explainer. Return JSON exactly: {"explainers":[{"visualId":"<exact chart TITLE>","title":"<chart title>","takeaway":"one vivid, memorable sentence carrying the single key number and point of this chart","detail":"5-7 descriptive sentences: what the chart shows, the key numbers and trend, the mechanism driving it, the scale/context, and what it means for the reader. Vivid, concrete, economist-grade but plain-language.","whyShowThis":"one sentence on why this chart earns its place in the argument that the surrounding charts do not answer","howToRead":"one or two concrete lines on exactly how to read the axes, lines, bars or base=100 indexing","mistakeToAvoid":"the single most important misreading a casual reader could make","mobileNote":"a short note for the small-screen version"}]} - one per chart, same order, visualId EXACTLY equal to the chart TITLE.\n\n${blocks}` },
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

console.log(`explainers: ${plan.length} charts in ${Math.ceil(plan.length / BATCH)} batches (model ${MODEL})`);
let explainers = [];
for (let i = 0; i < plan.length; i += BATCH) {
  const e = await genExplainers(plan.slice(i, i + BATCH), locked);
  explainers = explainers.concat(e);
  console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${e.length} (${explainers.length} total)`);
}

await writeFile(OUT, JSON.stringify({ explainers }, null, 2) + "\n");
const avg = Math.round(explainers.reduce((s, e) => s + (e.detail || "").split(/\s+/).length, 0) / Math.max(1, explainers.length));
console.log(`wrote ${explainers.length} explainers to ${OUT}; avg detail ${avg} words`);
