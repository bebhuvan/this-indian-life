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
const BATCH = Number(process.env.GOLD_BATCH_SIZE || 6);
const path = `data/explanations/en/${QID}.json`;

const SYS = `You write rich, specific chart explainers for a data-journalism article on India and gold, for a curious Indian reader. Warm, precise, never use em-dashes. Use ONLY numbers given to you; round like a human; never invent figures or studies. Each explainer must be concrete to ITS chart, never generic boilerplate. The reader should finish knowing what the chart says, why it is here, how to read it, and the one mistake to avoid.`;

function block(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || []).filter((n) => inds.includes(n.indicatorId)).slice(0, 6)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  return `TITLE: "${v.title}"\n  current note: ${v.read || ""}\n  significance: ${v.why || ""}\n  caveat: ${v.watch || ""}\n  ${nums.length ? "numbers: " + nums.join("; ") : ""}`;
}

async function genExplainers(charts, locked) {
  const blocks = charts.map((c) => block(c, locked)).join("\n\n");
  const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens: 7000, messages: [
    { role: "system", content: SYS },
    { role: "user", content: `For EACH chart below, write a rich explainer. Return JSON: {"explainers":[{"visualId":"<exact chart TITLE>","title":"<chart title>","takeaway":"one vivid sentence with the key number","detail":"2-3 sentences expanding what the chart reveals and why it matters, concrete to this chart","whyShowThis":"one sentence on why this chart earns its place in the argument","howToRead":"one or two sentences on exactly how to read the axes/lines/bars","mistakeToAvoid":"the single most important misreading to avoid","mobileNote":"a short note for the small-screen version"}]} - one per chart, same order, visualId EXACTLY equal to the chart TITLE.\n\n${blocks}` },
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
  console.log(`  batch ${i / BATCH + 1}: +${e.length} (${explainers.length} total)`);
}

const d = JSON.parse(await readFile(path, "utf8"));
d.chartExplainers = explainers;
await writeFile(path, stableJson(d) + "\n");
console.log(`wrote ${explainers.length} chartExplainers; avg detail ${Math.round(explainers.reduce((s, e) => s + (e.detail || "").length, 0) / Math.max(1, explainers.length))} chars`);
