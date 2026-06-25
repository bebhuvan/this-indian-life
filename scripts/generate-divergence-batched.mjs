// Batched explanation generator for the single maximal q.econ.asia_divergence
// flagship (41 charts). The standard single-call multi-pass generator overflows
// deepseek-v4-pro's output ceiling on an article this large (JSON truncates ->
// "invalid JSON (length)"), so we generate the body a few charts at a time, then
// assemble a render-compatible explanation reusing buildEvidencePacket. Chart
// explainers + sectionVisualMap are added afterward by
// generate-divergence-explainers.mjs. Mirrors generate-gold-batched.mjs.
import { writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.econ.asia_divergence";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.DIVERGENCE_BATCH_SIZE || 6);

const BRIEF = `You are writing sections of one long, definitive data-journalism article, "Why did India stay poor while the rest of Asia got rich?", for a curious Indian general reader. Voice: someone who knows development and growth economics cold; warm, plain-spoken and rigorous; never use em-dashes.
HARD RULES: use ONLY numbers given to you in the chart notes (or the through-line facts below); round like a human ("about a third", "roughly 15%", "near $19,000"); never invent figures, dates, named studies, or quotes. Each section is an H2 heading phrased as a reader's real question, then 130-200 words that genuinely ANSWER it with the mechanism and the reason, not a description of the chart's shape. Write about India and Asia; never narrate the article itself ("this chart shows", "as we saw above"). Be scrupulous about estimate vs measurement.
CAUSE DISCIPLINE (the spine): say clearly WHAT the data shows, but be explicit that the factors are entangled and the data cannot prove which mattered most or that any single one was the cause. Use "one visible pattern is" not "the reason was". Never name a single villain. NEVER imply India's mistake was failing to coerce its people; the human cost of the East Asian methods is a real trade-off, not a model to envy.
THROUGH-LINE to stay consistent with: around 1950 India was no poorer than its Asian peers and on some counts a little richer (Maddison, 2011 int-$: India ~$990, China ~$800, Korea ~$1,000), yet by 2022 China neared $19,000 and Korea passed $41,000 while India was about $7,800. The article follows the "integrated East Asian model" as an organising sequence, never as proven causation: build human capital first (health, child survival, schooling AND actual learning, women's work), then force up saving and investment and deepen finance, then move labour into manufacturing, then climb into sophisticated exports, then grow rich. India under-did each link: manufacturing stuck near 15% of GDP for sixty years while Korea's humped to ~28%; work stayed about nine-in-ten informal; China took over 14% of world goods exports while India stayed near 1-2%; India still levies the group's highest effective tariff; it plugged only shallowly into global value chains. The institutional layer is honest, not a hit-job: India ranks respectably on voice and the rule of law and far lower on government effectiveness, regulation and corruption control, a participatory state weaker at delivery, not a failed one. The arithmetic is compounding: a few points of extra growth a year, sustained for decades, became the whole gap, and at its recent pace India reaches China's CURRENT income only around 2043. The honest other side is real and must be given full weight: India crushed extreme poverty even without a factory boom, built a genuine services-export escalator (that lifts fewer low-skilled workers than mass manufacturing would), climbed the human-development scorecard, and did all of it as a continuous democracy while Korea and Taiwan democratised only after their takeoffs. PPP is a modelled price adjustment, never mixed with market exchange rates; flag modelled estimates (ILO labour, informality, top-income shares) as different in level from surveys; Taiwan appears only where Maddison, the Penn World Table and V-Dem cover it.`;

function chartBlock(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((n) => inds.includes(n.indicatorId))
    .slice(0, 7)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  return `CHART: "${v.title}"\n  shows: ${v.read || ""}\n  why it matters: ${v.why || ""}\n  caveat: ${v.watch || ""}\n  ${nums.length ? "numbers you MAY use: " + nums.join("; ") : "(use only through-line facts)"}`;
}

// deepseek-v4-pro intermittently returns empty content (reasoning budget spent,
// or a dropped completion); the shared adapter throws on that, so retry here.
async function call(messages, maxTokens) {
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens, messages });
      return c.json;
    } catch (e) {
      lastErr = e;
      console.warn(`  call attempt ${attempt}/5 failed: ${String(e.message).slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  throw lastErr;
}

async function genSections(charts, locked) {
  const blocks = charts.map((c) => chartBlock(c, locked)).join("\n\n");
  const out = await call([
    { role: "system", content: BRIEF },
    { role: "user", content: `Write one H2 reader-question section for EACH chart below, in order (${charts.length} sections). Heading must be a real question a reader would ask; body 130-200 words answering it with only the given numbers and the through-line facts.\n\n${blocks}\n\nReturn JSON exactly: {"sections":[{"heading":"a question (no ## prefix)","body":"..."}]}` },
  ], 9000);
  return Array.isArray(out.sections) ? out.sections : [];
}

const question = v1Questions.find((q) => q.id === QID);
async function loadAll() {
  const files = await listJsonFiles("data/series");
  const a = [];
  for (const f of files) { try { a.push(await readJson(f)); } catch {} }
  return a;
}
const artifacts = await loadAll();
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

// Safety net: persist the expensive body sections immediately, so a meta-call
// failure can never discard 7 batches of generated prose.
await writeFile(`data/explanations/en/${QID}.sections.json`, stableJson(sections) + "\n");

console.log("generating title/short/macha/caveats/sources...");
async function genMeta() {
  const metaPrompt = { role: "user", content: `For this whole article, return JSON: {"title":"Why did India stay poor while the rest of Asia got rich?","standfirst":"a 1-2 sentence dek that states the puzzle and the answer-shape","short":{"headline":"a punchy one-liner","dek":"one sentence","body":"a 60-word plain-language summary of the whole argument"},"macha":{"heading":"Okay, but what does this actually mean?","body":"a warm 80-word plain explanation for a layperson of the whole divergence","soWhat":"one sentence on why it matters"},"caveats":["5-6 honest caveats: Maddison pre-1950 figures are reconstructions read as trajectory not exact levels; PPP is a modelled adjustment and the income chart uses current-dollar IMF PPP while the convergence projection uses real constant-price World Bank PPP; learning scores, governance ranks and the 2014 Enterprise Survey are snapshots not trends; labour and informality figures are modelled and differ from India's surveys, and ILOSTAT lacks comparable informality for China and Korea; the convergence chart is an illustrative constant-growth projection not a forecast; several factors moving together is not proof any one caused the divergence"],"sourceNotes":["6-7 source notes naming: the Maddison Project (long-run GDP and decade growth); the IMF World Economic Outlook (current PPP income, 2024-25 estimated); the World Bank (health, demography, learning, investment, finance, structure, trade, power, poverty); the World Bank Worldwide Governance Indicators and the 2014 India Enterprise Survey; Lee-Lee and Barro-Lee (schooling); ILOSTAT (informality); WITS (tariff detail); UN Comtrade (India-China trade); the Harvard Growth Lab Atlas of Economic Complexity; the Penn World Table (productivity, capital per worker, TFP); OECD TiVA (value chains); the World Inequality Database (top incomes); the UNDP Human Development Index; and the V-Dem electoral democracy index"]}` };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const m = await call([{ role: "system", content: BRIEF }, metaPrompt], 8000);
      if (m && (m.title || m.short || m.caveats)) return m;
      console.warn(`  meta attempt ${attempt}: empty, retrying...`);
    } catch (e) {
      console.warn(`  meta attempt ${attempt} failed: ${e.message}`);
    }
  }
  console.warn("  meta failed after 3 attempts; writing body with fallback meta (re-run meta separately if needed).");
  return {};
}
const meta = await genMeta();

const document = {
  schemaVersion: 1,
  questionId: QID,
  status: "ready",
  short: meta.short || { headline: "", dek: "", body: "" },
  macha: meta.macha || { heading: "Okay, but what does this mean?", body: "", soWhat: "" },
  article: { title: meta.title || question.question, standfirst: meta.standfirst || "Around 1950, India was no poorer than China or South Korea. Today its income per person is a fraction of theirs. The gap opened because East Asia built human capital, forced up investment, moved its workers into factories and climbed the export ladder, and India under-did each link, while crushing poverty and staying a democracy.", bodyMarkdown },
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
