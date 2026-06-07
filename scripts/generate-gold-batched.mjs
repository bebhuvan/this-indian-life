// Batched explanation generator for q.econ.gold.
// The single-call multi-pass generator hits deepseek-v4-pro's output ceiling on
// this 25-chart article (JSON truncates -> "invalid JSON (length)"). This script
// generates the article body a few charts at a time (each call small), then
// assembles a render-compatible explanation reusing buildEvidencePacket. It does
// NOT modify the main pipeline.
import { writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.econ.gold";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.GOLD_BATCH_SIZE || 6);

const BRIEF = `You are writing sections of a long, definitive data-journalism article, "How much gold does India have, and why can't we stop buying it?", for a curious Indian general reader. Voice: someone who knows the gold market and Indian household finance cold; warm but rigorous; never use em-dashes.
HARD RULES: use ONLY numbers given to you in the chart notes; round like a human ("about 5 lakh crore", "around 880 tonnes", "roughly 12%"); never invent figures, dates, named studies, or quotes. Each section is an H2 heading phrased as a reader's question, then 120-200 words that genuinely ANSWER it (give the mechanism and reason, not a description of the chart). Write about India and gold; never narrate the article itself ("this chart shows", "as we saw"). Be scrupulous about estimate vs measurement.
THROUGH-LINE to stay consistent with: India mines almost no gold yet privately holds an estimated 25,000 to 30,000 tonnes (the World Gold Council, using Metals Focus, puts it at up to 25,000; a bottom-up build-up reaches about 30,000 because it assumes little gold ever leaves), far more than the RBI's roughly 880 tonnes. The record RUPEE import bill is mostly the world PRICE, not more metal (tonnage is range-bound near 700-1,000t). Gold's rupee return is mostly the global price plus rupee depreciation, with a one-time import-duty wedge; over a full generation since the mid-1990s, equities (Nifty 500 TRI) beat gold. Indians buy gold for established reasons: weddings and festivals, stridhan (a bride's gold is legally hers), instant pawnable liquidity, and a long distrust of paper money. The state and the saver keep pulling against each other, climaxing in May 2026 when the government reversed its 2024 duty cut, hiking gold duty from 6% back to 15%.`;

function chartBlock(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((n) => inds.includes(n.indicatorId))
    .slice(0, 6)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  return `CHART: "${v.title}"\n  shows: ${v.read || ""}\n  why it matters: ${v.why || ""}\n  caveat: ${v.watch || ""}\n  ${nums.length ? "numbers you MAY use: " + nums.join("; ") : "(use only through-line facts)"}`;
}

async function call(messages, maxTokens) {
  const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens, messages });
  return c.json;
}

async function genSections(charts, locked) {
  const blocks = charts.map((c) => chartBlock(c, locked)).join("\n\n");
  const out = await call([
    { role: "system", content: BRIEF },
    { role: "user", content: `Write one H2 reader-question section for EACH chart below, in order (${charts.length} sections). Heading must be a real question; body 120-200 words answering it with only the given numbers.\n\n${blocks}\n\nReturn JSON exactly: {"sections":[{"heading":"a question (no ## prefix)","body":"..."}]}` },
  ], 7000);
  return Array.isArray(out.sections) ? out.sections : [];
}

const question = v1Questions.find((q) => q.id === QID);
const artifacts = await loadAll();
async function loadAll() {
  const files = await listJsonFiles("data/series");
  const a = [];
  for (const f of files) { try { a.push(await readJson(f)); } catch {} }
  return a;
}
const evidence = buildEvidencePacket({ question, artifacts });
const locked = evidence.lockedNumbers || [];
const plan = (question.visualPlan || []).filter((v) => v.indicator || (v.series && v.series.length));

console.log(`batched gen: ${plan.length} charts in ${Math.ceil(plan.length / BATCH)} batches`);
let sections = [];
for (let i = 0; i < plan.length; i += BATCH) {
  const batch = plan.slice(i, i + BATCH);
  const s = await genSections(batch, locked);
  sections = sections.concat(s);
  console.log(`  batch ${i / BATCH + 1}: +${s.length} sections (${sections.length} total)`);
}
const bodyMarkdown = sections
  .map((s) => `## ${String(s.heading || "").replace(/^#+\s*/, "")}\n\n${s.body || ""}`)
  .join("\n\n");

console.log("generating intro/short/caveats/sources + macha...");
const meta = await call([
  { role: "system", content: BRIEF },
  { role: "user", content: `For this article, return JSON: {"title":"the article title","standfirst":"a 1-2 sentence dek","short":{"headline":"a punchy one-liner","dek":"one sentence","body":"a 60-word plain-language summary"},"macha":{"heading":"Okay, but what does this actually mean?","body":"a warm 80-word plain explanation for a layperson","soWhat":"one sentence on why it matters"},"caveats":["4-5 honest caveats, e.g. the private-stock figure is an estimate not a count; survey gold data is dated; mirror gaps are normal"],"sourceNotes":["5-6 source notes naming UN Comtrade (HS 7108/7113), World Gold Council and Metals Focus, MoSPI eSankhyiki for RBI reserves and balance of payments, AMFI for gold ETFs, NPCI for digital gold, FRED for USD-INR, and noting Switzerland's export records corroborate India's imports within about 7%"]}` },
], 3500);

const document = {
  schemaVersion: 1,
  questionId: QID,
  status: "ready",
  short: meta.short || { headline: "", dek: "", body: "" },
  macha: meta.macha || { heading: "Okay, but what does this mean?", body: "", soWhat: "" },
  article: { title: meta.title || question.question, standfirst: meta.standfirst || "", bodyMarkdown },
  editorialPlan: { audience: "Curious Indian general reader", heroDescription: "", selectedDataPoints: [], pullQuotes: [], glossaryBlocks: [] },
  chartExplainers: [],
  sectionVisualMap: [],
  sourceNotes: meta.sourceNotes || [],
  caveats: meta.caveats || [],
  lockedNumbersUsed: [],
  qualityFlags: [],
  generatedAt: new Date().toISOString(),
  model: MODEL,
  generationPasses: [{ name: "batched", model: MODEL }],
  evidence,
};
await writeFile(`data/explanations/en/${QID}.json`, stableJson(document) + "\n");
console.log(`wrote batched explanation: ${sections.length} sections, ${bodyMarkdown.length} chars, ${locked.length} locked numbers`);
