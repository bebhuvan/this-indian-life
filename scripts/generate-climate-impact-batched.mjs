// Batched explanation generator for q.climate.impact.
// This article is intentionally large, so the normal multi-pass generator can
// hit DeepSeek's output ceiling. Generate body sections in small chart batches,
// then assemble a render-compatible explanation.
import { writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.climate.impact";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.CLIMATE_BATCH_SIZE || 5);

const BRIEF = `You are writing sections of a definitive Indica data-journalism article answering: "How is climate change changing India?"

Voice: rigorous, Indian, human, occasionally dry and sharp. Controlled snark is allowed only against bad claims, never against people. Target bad arguments like "one cool week disproves warming" or "the national average is the temperature outside your house". Every sharp line must be followed by evidence. Never use abuse. Never use em-dashes.

HARD RULES:
- Use ONLY numbers given in chart notes and locked numbers.
- Never invent figures, dates, rankings, named studies, or quotes.
- Round like a human.
- Do not overclaim attribution. Distinguish observed/reanalysis/model/projection, warming/urban heat/humidity/El Nino/land use.
- Do not say one dataset "proves" everything. The source-comparison chart is a validation check, not a magic wand.
- Write one H2 reader-question section for each chart, in chart order.
- Each section should answer the question in 100-170 words. Do not merely describe chart shapes.
- End with a methodology/caveat section in the meta call.

Through-line: India is warming, but the article must not stop at "it is hotter". The physical climate has shifted; the shift is uneven by region, state, season and threshold; heat becomes lived experience through warm nights, humid heat, work, farming, bills, air and household ability to cool. Treat 2026 as a separate January-May year-to-date section only, never as a completed year. The hourly ERA5 heat metrics are locally computed from hourly 2m temperature and dew point, not from the CDS daily-statistics product flagged with a known issue in June 2026. Rainfall is not just an annual total: timing, monsoon concentration, dry spells and extremes are what people feel.`;

function chartBlock(v, locked) {
  const ids = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((n) => ids.includes(n.indicatorId))
    .slice(0, 8)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  return [
    `CHART: "${v.title}"`,
    `chart type: ${v.chart || v.chartType || ""}`,
    `what it measures: ${v.read || ""}`,
    `why it matters: ${v.why || ""}`,
    `mistake to avoid: ${v.watch || ""}`,
    nums.length ? `numbers you MAY use: ${nums.join("; ")}` : "numbers you MAY use: none beyond the chart notes"
  ].join("\n");
}

async function call(messages, maxTokens) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const completion = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens, messages });
      return completion.json;
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      if (!/no message content|invalid JSON|Unexpected end/i.test(message) || attempt === 4) break;
      const waitMs = attempt * 5000;
      console.warn(`DeepSeek empty/truncated response, retrying attempt ${attempt + 1}/4 in ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function loadAllArtifacts() {
  const files = await listJsonFiles("data/series");
  const artifacts = [];
  for (const file of files) {
    try {
      artifacts.push(await readJson(file));
    } catch {}
  }
  return artifacts;
}

async function generateSections(charts, locked) {
  const blocks = charts.map((chart) => chartBlock(chart, locked)).join("\n\n---\n\n");
  const out = await call([
    { role: "system", content: BRIEF },
    { role: "user", content: `Write one H2 reader-question section for EACH chart below, in order. Return JSON exactly: {"sections":[{"heading":"question, no ## prefix","body":"100-170 words, evidence-backed, no em dash"}]}\n\n${blocks}` }
  ], 8000);
  return Array.isArray(out.sections) ? out.sections : [];
}

const question = v1Questions.find((q) => q.id === QID);
if (!question) throw new Error(`Missing ${QID}`);

const artifacts = await loadAllArtifacts();
const evidence = buildEvidencePacket({ question, artifacts });
const locked = evidence.lockedNumbers || [];
const plan = question.visualPlan || [];

console.log(`climate batched gen: ${plan.length} charts in ${Math.ceil(plan.length / BATCH)} batches`);

let sections = [];
for (let i = 0; i < plan.length; i += BATCH) {
  const batch = plan.slice(i, i + BATCH);
  const generated = await generateSections(batch, locked);
  sections = sections.concat(generated);
  console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${generated.length} sections (${sections.length} total)`);
}

const bodyMarkdown = sections
  .map((section) => `## ${String(section.heading || "").replace(/^#+\s*/, "")}\n\n${section.body || ""}`)
  .join("\n\n");

console.log("generating intro/short/macha/caveats/source notes...");
const meta = await call([
  { role: "system", content: BRIEF },
  { role: "user", content: `Return JSON exactly: {"title":"article title","standfirst":"1-2 sentence dek","short":{"headline":"one line","dek":"one sentence","body":"60-90 words"},"macha":{"heading":"warm Indian-English heading","body":"80-120 words, plain-language summary","soWhat":"one sentence"},"caveats":["6-9 methodology caveats"],"sourceNotes":["6-9 source notes"]}. Include source notes for ERA5 hourly and monthly reanalysis, IMD monsoon rainfall, WAQI, World Bank CCKP, OWID/Global Carbon Budget, Climate Watch/Data Commons, Ember, NSS/NFHS cooling access, and World Bank employment/exposure context. Include caveats on anomalies vs absolute temperatures, 2026 Jan-May YTD, observed vs reanalysis vs model projections, region/state averages hiding local extremes, AQI snapshots, survey-vintage cooling access, and correlation vs causation.` }
], 4500);

const sectionVisualMap = sections.slice(0, plan.length).map((section, i) => ({
  heading: String(section.heading || "").replace(/^#+\s*/, ""),
  visualId: plan[i]?.title || ""
}));

const document = {
  schemaVersion: 1,
  questionId: QID,
  status: "ready",
  short: meta.short || { headline: "", dek: "", body: "" },
  macha: meta.macha || { heading: "Okay, but what does this mean?", body: "", soWhat: "" },
  article: {
    title: meta.title || "Is India warming?",
    standfirst: meta.standfirst || "",
    bodyMarkdown
  },
  editorialPlan: {
    audience: "Curious Indian general reader",
    heroDescription: "A canonical, evidence-first answer to whether India is warming and what follows from that warming.",
    selectedDataPoints: [],
    pullQuotes: [],
    glossaryBlocks: []
  },
  chartExplainers: [],
  sectionVisualMap,
  sourceNotes: meta.sourceNotes || [],
  caveats: meta.caveats || [],
  lockedNumbersUsed: [],
  qualityFlags: [],
  generatedAt: new Date().toISOString(),
  model: MODEL,
  generationPasses: [{ name: "batched-body", model: MODEL }],
  evidence
};

await writeFile(`data/explanations/en/${QID}.json`, stableJson(document) + "\n");
console.log(`wrote ${QID}: ${sections.length} sections, ${bodyMarkdown.length} body chars`);
