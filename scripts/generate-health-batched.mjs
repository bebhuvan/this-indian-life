// Batched explanation generator for q.health.overview ("How healthy is India?").
// 22 charts across 6 acts overruns deepseek-v4-pro's output ceiling in a single
// multi-pass draft (JSON truncates -> "invalid JSON (length)"). This generates the
// body a few charts at a time (Acts 1-5), then a SEPARATE prose-led call for the
// speculative Act 6 (Ozempic) which the chart-driven batcher cannot produce well,
// then a methodology section, then a meta call (intro/short/macha/caveats/sources).
// It assembles a render-compatible explanation reusing buildEvidencePacket and sets
// sectionVisualMap EXPLICITLY (each section carries its bound chart title, prose-only
// sections carry none). chartExplainers are filled by generate-health-explainers.mjs.
import { writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.health.overview";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.HEALTH_BATCH_SIZE || 5);
const GLP1_TITLE = "What a month of GLP-1 costs in India";

const BRIEF = `You are writing sections of a long, definitive data-journalism article, "How healthy is India?", for a curious Indian general reader. Voice: someone who knows Indian epidemiology, public health and health financing cold, and writes like a great essayist; warm but rigorous; never use em-dashes.

HARD RULES: use ONLY numbers given to you in the chart notes plus the through-line facts below; round like a human ("about two-thirds", "around 30%", "roughly Rs 56,000"); never invent figures, dates, named studies or quotes; present estimates as ranges, never false precision (about 2 million, not 1,997,431). Each section is an H2 heading phrased as a reader's question, then 130-210 words that genuinely ANSWER it (give the mechanism and reason, not a description of the chart). Write about India and Indians; never narrate the article itself ("this chart shows", "as we saw above", "the next section"). Carry the argument forward act by act.

THROUGH-LINE to stay consistent with: India's health story has FLIPPED. The old enemy was infection and child death; the new one is the slow, expensive grind of non-communicable disease (heart disease, diabetes, high blood pressure, mental and joint disorders), arriving in a country that is still poor, still undernourished in parts, and that pays for most of its own healthcare out of pocket. Non-communicable diseases rose from about 26% of India's disease burden (DALYs) in 1990 to about 62% in 2023, while communicable-maternal-neonatal-nutritional causes fell from about 66% to about 27%, with the crossover around 2010. Cardiovascular disease is now the single largest cause of disease burden. The out-of-pocket share of health spending has finally started falling (about 64% in 2013-14 to about 43% in 2022-23) while government share rose to about 44%, yet public health spending is still only about 1.4% of GDP.

SOURCE DISCIPLINE (triangulate and say which does what): IHME GBD 2023 gives MODELLED estimates of burden, causes and risk attribution; NFHS-5 (2019-21) and NFHS-6 (2023-24) are household surveys that MEASURE prevalence in the field; the National Health Accounts give the financing mix; Indica's own tabulation of NSS 80th-round (2025) unit data gives the cost ladder, insurance, hospital choice and childbirth; the World Bank gives the cross-country lens. The disagreements between these systems are informative, not errors: GBD models, NFHS measures, NSS asks households. Whenever an NSS 80th-round (2025) number appears, flag that it is Indica's own tabulation of public microdata and the official MoSPI report may differ slightly. Never claim a single cause for any health trend; present diet, air, work, ageing, income and measurement as a web, not a chain. Risk-attributed deaths overlap and cannot be added together.`;

function chartBlock(v, locked) {
  const inds = [v.indicator, ...(v.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((n) => inds.includes(n.indicatorId))
    .slice(0, 14)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  return `CHART: "${v.title}"\n  shows: ${v.read || ""}\n  why it matters: ${v.why || ""}\n  caveat: ${v.watch || ""}\n  ${nums.length ? "numbers you MAY use: " + nums.join("; ") : "(use only through-line facts)"}`;
}

// deepseek-v4-pro (a reasoning model) intermittently returns empty content or a
// dropped connection; a single failure must not discard the whole (expensive) run,
// so retry each call a few times with backoff before giving up.
async function call(messages, maxTokens) {
  const tries = Number(process.env.HEALTH_CALL_RETRIES || 4);
  let lastErr;
  for (let t = 0; t < tries; t += 1) {
    try {
      const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens, messages });
      return c.json;
    } catch (e) {
      lastErr = e;
      console.warn(`  call failed (${e.message.slice(0, 80)}); retry ${t + 1}/${tries}`);
      await new Promise((r) => setTimeout(r, 4000 * (t + 1)));
    }
  }
  throw lastErr;
}

async function genSections(charts, locked) {
  const blocks = charts.map((c) => chartBlock(c, locked)).join("\n\n");
  const out = await call([
    { role: "system", content: BRIEF },
    { role: "user", content: `Write one H2 reader-question section for EACH chart below, in order (${charts.length} sections). Heading must be a real reader's question (no ## prefix); body 130-210 words answering it with only the given numbers and through-line facts.\n\n${blocks}\n\nReturn JSON exactly: {"sections":[{"heading":"a question","body":"..."}]}` },
  ], 8000);
  return Array.isArray(out.sections) ? out.sections : [];
}

const question = v1Questions.find((q) => q.id === QID);
const files = await listJsonFiles("data/series");
const artifacts = [];
for (const f of files) { try { artifacts.push(await readJson(f)); } catch {} }
const evidence = buildEvidencePacket({ question, artifacts });
const locked = evidence.lockedNumbers || [];
const plan = (question.visualPlan || []).filter((v) => v.indicator || (v.series && v.series.length));

// Acts 1-5 are charts 0..n-2; the final chart (GLP-1 price ladder) belongs to the
// prose-led Act 6, generated separately so the chart-driven batcher does not flatten it.
const glp1Index = plan.findIndex((v) => v.title === GLP1_TITLE);
const actCharts = plan.filter((_, i) => i !== glp1Index);
const glp1Chart = plan[glp1Index];

console.log(`batched gen: ${actCharts.length} Act 1-5 charts in ${Math.ceil(actCharts.length / BATCH)} batches + Ozempic + methodology + meta`);

// Each assembled section: { heading, body, chartTitle|null }
let sections = [];
for (let i = 0; i < actCharts.length; i += BATCH) {
  const batch = actCharts.slice(i, i + BATCH);
  const s = await genSections(batch, locked);
  s.forEach((sec, j) => sections.push({ heading: String(sec.heading || "").replace(/^#+\s*/, "").trim(), body: sec.body || "", chartTitle: batch[j]?.title || null }));
  console.log(`  batch ${i / BATCH + 1}: +${s.length} sections (${sections.length} total)`);
}

// --- Act 6: the Ozempic question (prose-led, two sections, one chart) ---
console.log("generating Act 6 (Ozempic) prose-led section...");
const glp1Nums = (locked || []).filter((n) => n.indicatorId === "health.glp1.price_ladder").slice(0, 14)
  .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
const ozempic = await call([
  { role: "system", content: BRIEF },
  { role: "user", content: `Write the SPECULATIVE Act 6 of this article, "the Ozempic question", as TWO H2 reader-question sections. This act is deliberately speculative: facts about prices and patents are VERIFIED, but every population-impact claim MUST be framed as a scenario with the unknowns stated honestly, not as a measured outcome.

VERIFIED facts you MAY use (round them):
- India's core semaglutide patent expired on 20 March 2026; generics launched the next day, up to about 80-90% below branded prices.
- Dr Reddy's launched oral semaglutide at about Rs 99 per tablet in May 2026 (roughly Rs 3,000 a month equivalent).
- Branded injectables: Ozempic about Rs 9,000-11,000 a month; Wegovy after its April 2026 cut roughly Rs 5,700-16,400; Mounjaro about Rs 13,000-26,000.
- Cheapest generic semaglutide near Rs 1,300 a month; metformin costs pennies a day (about Rs 40-50 a strip). Even the cheapest generic GLP-1 is roughly 25 to 40 times the monthly cost of metformin.
- Demand context: ICMR-INDIAB estimates about 101 million Indians with diabetes and about 136 million with prediabetes (2023); together roughly 237 million on the metabolic spectrum.
- NFHS-6 measured women overweight/obese at about 30.7% (from 24.0%) and men about 27.3%.

HONEST UNKNOWNS you MUST present as open questions, not settled facts:
- Weight regain is the rule after stopping; GLP-1s are effectively chronic, lifelong therapy, which compounds the affordability problem.
- Lean-muscle loss is a real concern (a meaningful share of weight lost is muscle).
- India's "lean diabetes" / thin-fat phenotype means a large share of Indian type-2 diabetes occurs at normal or low BMI; the GLP-1 trial evidence is built largely on higher-BMI Western cohorts, so whether the benefit-risk transfers cleanly to low-BMI Indian diabetics is genuinely unresolved.
- Affordability is a hard wall: even a likely settled generic price (analysts guess near Rs 5,000 a month) is roughly 15-20% of median monthly income and a lifelong cost; GLP-1s for weight loss are generally NOT covered by Indian health insurance.
- There is NO India-specific population-impact model, so the population-level health impact is genuinely unknown. Say so plainly.

The FIRST section is a reader-question whose heading is about what cheap Ozempic might mean for India, and it discusses the price ladder (the chart "${GLP1_TITLE}", which is a bar chart of representative monthly costs for branded and generic GLP-1s with metformin as a baseline). Numbers for that chart: ${glp1Nums.join("; ")}.
The SECOND section is a reader-question about what we still do not know / the catch, carrying the honest unknowns. It has no chart.

Each body 150-220 words. Return JSON exactly: {"sections":[{"heading":"...","body":"..."},{"heading":"...","body":"..."}]}` },
], 5000);
const ozSecs = Array.isArray(ozempic.sections) ? ozempic.sections : [];
if (ozSecs[0]) sections.push({ heading: String(ozSecs[0].heading || "").replace(/^#+\s*/, "").trim(), body: ozSecs[0].body || "", chartTitle: glp1Chart.title });
if (ozSecs[1]) sections.push({ heading: String(ozSecs[1].heading || "").replace(/^#+\s*/, "").trim(), body: ozSecs[1].body || "", chartTitle: null });

// --- Methodology / how to read these numbers (prose-only, last) ---
console.log("generating methodology section...");
const method = await call([
  { role: "system", content: BRIEF },
  { role: "user", content: `Write the FINAL section of the article, an H2 headed exactly "How to read these numbers" (a methodology and caveats section, not a reader-question). Body 200-280 words, plain and honest, covering ALL of these points: (1) the three systems measure different things and their disagreements are informative, not errors: GBD = modelled estimates, NFHS = measured field survey, NSS = household self-report; (2) every NSS 80th-round (2025) figure here is Indica's own tabulation of public unit-level microdata, weighted by the survey multiplier, and the official MoSPI report may differ slightly; (3) the hospital-cost ladder is in current rupees, not inflation-adjusted, and the earliest (1995-96) NSS figure is total hospitalisation expenditure, not just the medical component, so the rise overstates pure medical inflation; (4) NSS "persons covered" by a health scheme is not the same measure as NFHS "households covered" by insurance; never mix them; (5) NFHS-6 dropped anaemia testing, so any anaemia claim must cite NFHS-5 (2019-21); (6) Act 6 (Ozempic) prices are press-verified reported retail prices, not regulated MRPs, and its population-impact claims are scenarios, not measured outcomes. Do not use em-dashes. Return JSON exactly: {"heading":"How to read these numbers","body":"..."}` },
], 3500);
sections.push({ heading: "How to read these numbers", body: method.body || "", chartTitle: null });

// --- Meta: title, standfirst, short, macha, caveats, sourceNotes ---
console.log("generating intro/short/macha/caveats/sources...");
const meta = await call([
  { role: "system", content: BRIEF },
  { role: "user", content: `For this article, return JSON: {"title":"the article title","standfirst":"a 1-2 sentence dek that states the flip thesis","short":{"headline":"a punchy one-liner","dek":"one sentence","body":"a 60-word plain-language summary of the flip from infection to non-communicable disease in a still-poor, out-of-pocket-paying country"},"macha":{"heading":"Okay, but what does this actually mean?","body":"a warm 90-word plain explanation for a layperson, the tell-me-what-this-means-bro layer","soWhat":"one sentence on why it matters"},"caveats":["6-8 honest caveats: GBD is modelled not counted; NFHS measures only two recent points and dropped anaemia testing; all NSS 2025 figures are Indica's own tabulation and may differ from the official report; the cost ladder is current rupees and the 1995-96 figure is total not medical-only spend; NSS persons-covered is not NFHS households-covered; World Bank cross-country series have gaps and differing vintages; Act 6 Ozempic prices are press-verified retail prices and its population-impact claims are scenarios"],"sourceNotes":["6-7 source notes naming IHME GBD 2023, NFHS-5 and NFHS-6, the National Health Accounts (NHA), Indica's own tabulation of NSS 80th-round (2025) unit data, the World Bank, and press-verified GLP-1 prices and ICMR-INDIAB for the diabetes burden"]}` },
], 6000);

const bodyMarkdown = sections
  .map((s) => `## ${s.heading}\n\n${s.body}`)
  .join("\n\n");

// sectionVisualMap built EXPLICITLY from the assembled sections; prose-only sections
// (Ozempic honesty, methodology) carry no chart.
const sectionVisualMap = sections
  .filter((s) => s.chartTitle)
  .map((s) => ({ heading: s.heading, visualId: s.chartTitle }));

const document = {
  schemaVersion: 1,
  questionId: QID,
  status: "ready",
  short: meta.short || { headline: "", dek: "", body: "" },
  macha: meta.macha || { heading: "Okay, but what does this mean?", body: "", soWhat: "" },
  article: { title: meta.title || question.question, standfirst: meta.standfirst || "", bodyMarkdown },
  editorialPlan: { audience: "Curious Indian general reader", heroDescription: "", selectedDataPoints: [], pullQuotes: [], glossaryBlocks: [] },
  chartExplainers: [],
  sectionVisualMap,
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
const headingCount = (bodyMarkdown.match(/\n## /g) || []).length; // non-first headings
console.log(`wrote batched explanation: ${sections.length} sections, ${bodyMarkdown.length} chars`);
console.log(`sectionVisualMap: ${sectionVisualMap.length} entries (expect ${plan.length})`);
console.log(`non-first headings: ${headingCount} (total sections ${sections.length})`);
const titles = new Set(sectionVisualMap.map((e) => e.visualId));
const missing = plan.map((p) => p.title).filter((t) => !titles.has(t));
if (missing.length) console.warn(`WARNING: chart titles missing from SVM: ${JSON.stringify(missing)}`);
