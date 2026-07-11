// Batched chart-explainer generator for q.health.overview. The batched body
// generator left chartExplainers empty (to dodge the output ceiling), so chart
// description boxes fall back to the thin one-line why/read/watch. This generates a
// rich explainer per chart, in batches, and writes them into the explanation.
// visualId = chart title (renderer matches via slugifyTitle). It does NOT touch the
// sectionVisualMap, which generate-health-batched.mjs built explicitly.
import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.health.overview";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.HEALTH_BATCH_SIZE || 4);
const path = `data/explanations/en/${QID}.json`;

const SYS = `You write rich, specific chart explainers for the data-journalism flagship "How healthy is India?", for a curious Indian general reader. Voice: warm but rigorous, someone who knows Indian epidemiology, public health and health financing cold. Never use em-dashes. Use only numbers provided to you; round like a human ("about two-thirds", "around 30%", "roughly Rs 56,000"); never invent figures, dates, named studies or quotes; present estimates as ranges, never false precision. Each explainer must be vividly concrete to ITS chart and its unique story, never generic boilerplate.

Be scrupulous about what kind of number it is: IHME GBD figures are MODELLED estimates; NFHS figures are MEASURED in a household survey; NSS 80th-round (2025) figures are Indica's OWN tabulation of public microdata and the official MoSPI report may differ slightly (flag this for NSS charts); World Bank figures are cross-country with gaps. Risk-attributed deaths overlap and cannot be added. The Act 6 GLP-1 prices are press-verified retail prices, not regulated MRPs, and population-impact claims are scenarios. Never claim a single cause for a health trend.

IMPORTANT: the detail field must be 4-7 meaty sentences. Expand on what the chart reveals, what is driving the pattern (where evidence supports it), and what it genuinely means for the reader. Give the mechanism or the reason, not just the shape. Write as if explaining to a smart friend over chai.`;

function block(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || []).filter((n) => inds.includes(n.indicatorId)).slice(0, 14)
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
  const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens: 8000, messages: [
    { role: "system", content: SYS },
    { role: "user", content: `For EACH chart below, write a rich explainer. Return JSON exactly: {"explainers":[{"visualId":"<exact chart TITLE>","title":"<chart title>","takeaway":"one vivid, memorable sentence with the key number","detail":"4-7 descriptive sentences in plain language: what the chart shows, the key numbers and trend, what is driving it (where evidence supports), and what it means for the reader","whyShowThis":"one sentence on why this chart earns its place in the argument","howToRead":"one or two short, concrete lines on exactly how to read the axes/lines/bars/shapes","mistakeToAvoid":"the single most important misreading a casual reader could make","mobileNote":"a short note for the small-screen version"}]} - one per chart, same order, visualId EXACTLY equal to the chart TITLE.\n\n${blocks}` },
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

const d = JSON.parse(await readFile(path, "utf8"));
d.chartExplainers = explainers;
// Deliberately leave d.sectionVisualMap as the explicit map from the batched generator.
await writeFile(path, stableJson(d) + "\n");
console.log(`wrote ${explainers.length} chartExplainers; avg detail ${Math.round(explainers.reduce((s, e) => s + (e.detail || "").length, 0) / Math.max(1, explainers.length))} chars`);
console.log(`sectionVisualMap left as-is: ${(d.sectionVisualMap || []).length} entries`);
const planTitles = new Set(plan.map((p) => p.title));
const got = explainers.map((e) => e.visualId);
const missing = [...planTitles].filter((t) => !got.includes(t));
if (missing.length) console.warn(`WARNING: charts without explainer: ${JSON.stringify(missing)}`);
