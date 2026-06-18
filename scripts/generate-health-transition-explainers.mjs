import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.health.transition";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.HEALTH_TRANSITION_EXPLAINER_BATCH_SIZE || 4);
const PATH = `data/explanations/en/${QID}.json`;

const SYS = `Write rich, insightful chart explainers for Indica's flagship "Is India getting healthier?". Each explainer must earn its place: surface the non-obvious point a reader would otherwise miss, not a caption of the bars. Lead with the specific number, the comparison or ratio, the turning point, or the contradiction, and say what it means for an ordinary Indian or for the better/mixed/worse verdict. Voice: plain, specific, concrete, honest. No em-dashes. Never write "this chart shows", a generic caption, or a restatement of the title. Use only the provided numbers and chart notes. Be precise about the difference between modelled estimates (GBD), household-survey measurements (NFHS), household self-reports (NSS) and India's own administrative counts (NHP), and about latest-year and survey-vintage gaps. Where a number can mislead, say exactly how.`;

function chartBlock(chart, locked) {
  const ids = [chart.indicator, ...(chart.series || []).map((item) => item.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((item) => ids.includes(item.indicatorId))
    .slice(0, 18)
    .map((item) => `${item.label}: ${item.displayValue ?? item.value}${item.unit ? ` ${item.unit}` : ""}, ${item.date || ""}`.trim());
  return [
    `TITLE: ${chart.title}`,
    `WHY: ${chart.why || ""}`,
    `READ: ${chart.read || ""}`,
    `CAVEAT: ${chart.watch || ""}`,
    nums.length ? `NUMBERS: ${nums.join("; ")}` : "NUMBERS: none"
  ].join("\n");
}

async function call(messages) {
  const retries = Number(process.env.HEALTH_TRANSITION_CALL_RETRIES || 3);
  let last;
  for (let i = 0; i < retries; i += 1) {
    try {
      const result = await createDeepSeekJsonCompletion({
        model: MODEL,
        messages,
        maxTokens: 7500,
        temperature: 0.25,
        jsonRetries: 1
      });
      return result.json;
    } catch (error) {
      last = error;
      console.warn(`  DeepSeek explainer call failed (${error.message.slice(0, 120)}); retry ${i + 1}/${retries}`);
      await new Promise((resolve) => setTimeout(resolve, 3000 * (i + 1)));
    }
  }
  throw last;
}

const question = v1Questions.find((item) => item.id === QID);
if (!question) throw new Error(`Question not found: ${QID}`);

const artifacts = [];
for (const file of await listJsonFiles("data/series")) {
  try {
    artifacts.push(await readJson(file));
  } catch {}
}
const evidence = buildEvidencePacket({ question, artifacts });
const locked = evidence.lockedNumbers || [];
const plan = (question.visualPlan || []).filter((chart) => chart.indicator || chart.series?.length);

console.log(`generating explainers for ${plan.length} charts`);
let explainers = [];
for (let i = 0; i < plan.length; i += BATCH) {
  const charts = plan.slice(i, i + BATCH);
  const blocks = charts.map((chart) => chartBlock(chart, locked)).join("\n\n---\n\n");
  const out = await call([
    { role: "system", content: SYS },
    {
      role: "user",
      content: `For each chart below, write one chartExplainer object. visualId MUST exactly equal the chart title, copied verbatim. Make every field insightful, not a caption:
- takeaway: the single most striking, specific fact, with the number and its year or survey round.
- detail: 4 to 5 sentences that ADD what the chart alone cannot show: the comparison, the ratio, the cause or implication, the tension with another number, the human meaning. Do not narrate the bars or lines.
- whyShowThis: one sentence on why it matters to whether India is getting healthier.
- howToRead: one or two concrete reading cues.
- mistakeToAvoid: the specific wrong conclusion a reader might draw from this exact chart.
- mobileNote: short small-screen tip.
Return JSON exactly: {"explainers":[{"visualId":"exact title","title":"exact title","takeaway":"...","detail":"4-5 sentences","whyShowThis":"...","howToRead":"...","mistakeToAvoid":"...","mobileNote":"..."}]}.

${blocks}`
    }
  ]);
  const batch = Array.isArray(out.explainers) ? out.explainers : [];
  explainers = explainers.concat(batch);
  console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${batch.length}`);
}

const doc = JSON.parse(await readFile(PATH, "utf8"));
doc.chartExplainers = explainers;
doc.generationPasses = [...(doc.generationPasses || []), { name: "chart-explainers", model: MODEL }];
await writeFile(PATH, `${stableJson(doc)}\n`);

const got = new Set(explainers.map((item) => item.visualId));
const missing = plan.map((item) => item.title).filter((title) => !got.has(title));
console.log(`wrote ${explainers.length} explainers to ${PATH}`);
if (missing.length) console.warn(`missing explainers: ${missing.join(", ")}`);
