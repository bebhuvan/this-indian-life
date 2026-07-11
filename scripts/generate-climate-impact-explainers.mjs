// Batched chart-explainer generator for q.climate.impact.
import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.climate.impact";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.CLIMATE_EXPLAINER_BATCH_SIZE || 4);
const path = `data/explanations/en/${QID}.json`;

const SYS = `Write rich chart explainers for a definitive Indica article on India warming. Voice: rigorous, plain, human, slightly dry when debunking bad claims. Target bad arguments, not people. Never use em-dashes. Use only numbers provided. Do not invent figures, dates, named studies or quotes. Each explainer must be specific to its chart and must help a lay reader avoid the obvious misreading.`;

function block(v, locked) {
  const ids = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((n) => ids.includes(n.indicatorId))
    .slice(0, 8)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  return [
    `CHART TITLE: "${v.title}"`,
    `What it measures: ${v.read || ""}`,
    `Why it is here: ${v.why || ""}`,
    `Known caveat: ${v.watch || ""}`,
    nums.length ? `Numbers you may use: ${nums.join("; ")}` : "Numbers you may use: none beyond the chart notes"
  ].join("\n");
}

async function genExplainers(charts, locked) {
  const blocks = charts.map((chart) => block(chart, locked)).join("\n\n---\n\n");
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const completion = await createDeepSeekJsonCompletion({
        model: MODEL,
        maxTokens: 8000,
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: `For EACH chart below, write a rich explainer. Return JSON exactly: {"explainers":[{"visualId":"<exact chart TITLE>","title":"<chart title>","takeaway":"one sharp sentence with the key point","detail":"4-7 concrete sentences explaining what the chart says, the important numbers or pattern, and why it matters","whyShowThis":"why this chart earns its place","howToRead":"how to read axes/lines/bars/map","mistakeToAvoid":"main wrong conclusion to avoid","mobileNote":"small-screen reading note"}]}. visualId must equal the chart title exactly.\n\n${blocks}` }
        ]
      });
      return Array.isArray(completion.json.explainers) ? completion.json.explainers : [];
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      if (!/no message content|invalid JSON|Unexpected end/i.test(message) || attempt === 4) break;
      const waitMs = attempt * 5000;
      console.warn(`DeepSeek empty/truncated explainer response, retrying attempt ${attempt + 1}/4 in ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

const question = v1Questions.find((q) => q.id === QID);
if (!question) throw new Error(`Missing ${QID}`);

const files = await listJsonFiles("data/series");
const artifacts = [];
for (const file of files) {
  try {
    artifacts.push(await readJson(file));
  } catch {}
}

const evidence = buildEvidencePacket({ question, artifacts });
const locked = evidence.lockedNumbers || [];
const plan = question.visualPlan || [];

console.log(`climate explainers: ${plan.length} charts in ${Math.ceil(plan.length / BATCH)} batches`);

let explainers = [];
for (let i = 0; i < plan.length; i += BATCH) {
  const generated = await genExplainers(plan.slice(i, i + BATCH), locked);
  explainers = explainers.concat(generated);
  console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${generated.length} (${explainers.length} total)`);
}

const document = JSON.parse(await readFile(path, "utf8"));
const body = document.article?.bodyMarkdown || "";
const headings = [];
for (const line of body.split("\n")) {
  const match = line.match(/^## (.+)/);
  if (match) headings.push(match[1].trim());
}

document.chartExplainers = explainers;
document.sectionVisualMap = headings.slice(0, plan.length).map((heading, i) => ({
  heading,
  visualId: plan[i]?.title || ""
}));

await writeFile(path, stableJson(document) + "\n");
console.log(`wrote ${explainers.length} chartExplainers and ${document.sectionVisualMap.length} sectionVisualMap entries`);
