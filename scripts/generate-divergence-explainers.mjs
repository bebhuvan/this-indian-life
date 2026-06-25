// Batched chart-explainer generator for the q.econ.asia_divergence flagship.
// The batched body generator leaves chartExplainers empty (to dodge the output
// ceiling), so the description boxes fall back to thin one-line why/read/watch.
// This generates a rich explainer per chart, in batches, and writes them plus a
// sectionVisualMap into the explanation. visualId = chart title (renderer matches
// via slugifyTitle). Mirrors generate-gold-explainers.mjs.
import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.econ.asia_divergence";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.DIVERGENCE_BATCH_SIZE || 4);
const path = `data/explanations/en/${QID}.json`;

const SYS = `You write rich, specific chart explainers for one long, definitive data-journalism article, "Why did India stay poor while the rest of Asia got rich?", for a curious Indian general reader. Voice: warm but rigorous, someone who knows development and growth economics cold. Never use em-dashes. Use only numbers provided to you; round like a human ("about a third", "roughly 15%", "near $19,000"); never invent figures, dates, named studies, or quotes. Each explainer must be vividly concrete to ITS chart and its unique story, never generic boilerplate. Hold the article's spine: India and its Asian peers started together around 1950 and diverged because East Asia built human capital, then investment, then manufacturing, then sophisticated exports, while India under-did each link; state WHAT the data shows but never claim a single cause, and never imply India should have coerced its people. The reader should finish each block knowing: what the chart says, why it is here, how to read it, and the one mistake to avoid.

IMPORTANT: the detail field must be 4-7 meaty sentences. Expand on what the chart reveals, what is driving the pattern (where evidence supports it), and what it genuinely means. Do not just describe the shape; give the mechanism or the reason. Write as if explaining to a smart friend over chai. Be scrupulous about estimate vs measurement (Maddison reconstructions, modelled ILO labour figures, PPP, contested TFP and top-income shares, single-vintage snapshots).`;

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
  const messages = [
    { role: "system", content: SYS },
    { role: "user", content: `For EACH chart below, write a rich explainer. Return JSON exactly: {"explainers":[{"visualId":"<exact chart TITLE>","title":"<chart title>","takeaway":"one vivid, memorable sentence with the key number — the single point of this chart","detail":"4-7 descriptive sentences in plain language: what the chart shows, the key numbers and trend, what is driving it (where evidence supports), and what it means for the reader. Vivid and concrete.","whyShowThis":"one sentence on why this chart earns its place in the argument — what question it answers that the surrounding charts do not","howToRead":"one or two short, concrete lines on exactly how to read the axes/lines/bars/shapes","mistakeToAvoid":"the single most important misreading a casual reader could make — what not to conclude","mobileNote":"a short note for the small-screen version"}]} - one per chart, same order, visualId EXACTLY equal to the chart TITLE.\n\n${blocks}` },
  ];
  // Retry on intermittent empty-content / dropped completions (see batched generator).
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens: 8000, messages });
      return Array.isArray(c.json.explainers) ? c.json.explainers : [];
    } catch (e) {
      lastErr = e;
      console.warn(`  explainer call attempt ${attempt}/5 failed: ${String(e.message).slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  throw lastErr;
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

// Build sectionVisualMap: pair section headings to plan charts in order (the body
// generator emits one section per chart, in plan order, so this is 1:1).
const d = JSON.parse(await readFile(path, "utf8"));
const body = (d.article && d.article.bodyMarkdown) || "";
const headings = [];
for (const line of body.split("\n")) {
  const m = line.match(/^## (.+)/);
  if (m) headings.push(m[1].trim());
}
const svm = headings.slice(0, plan.length).map((heading, i) => ({
  heading,
  visualId: plan[i]?.title ?? ""
}));

d.chartExplainers = explainers;
d.sectionVisualMap = svm;
await writeFile(path, stableJson(d) + "\n");
console.log(`wrote ${explainers.length} chartExplainers; avg detail ${Math.round(explainers.reduce((s, e) => s + (e.detail || "").length, 0) / Math.max(1, explainers.length))} chars`);
console.log(`sectionVisualMap: ${svm.length} entries`);
