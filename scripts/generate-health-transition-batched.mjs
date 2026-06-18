import { writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.health.transition";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const BATCH = Number(process.env.HEALTH_TRANSITION_BATCH_SIZE || 3);
const OUT = `data/explanations/en/${QID}.json`;

const SYS = `You write Indica data-journalism prose for a curious Indian general reader. The article answers, to the best extent the data allows: "Is India getting healthier?" — naming clearly what is getting better, what is mixed, and what is getting worse.

Voice: plain, specific, direct. No em-dashes. No generic transitions. No "this chart shows". No medical advice. Use only the numbers provided in the prompt. Every number needs its year or survey round when first used. Round like a human; present estimates as ranges, never false precision.

Verdict spine: India is clearly better on SURVIVAL and infection retreat (life expectancy, child and maternal mortality, vaccines, the old infectious/newborn killers in decline, more medical-college capacity). It is MIXED on nutrition and on fairness (stunting fell but wasting is stuck; large wealth, state and rural-urban gaps). It is getting WORSE on the new burden (non-communicable disease overtook infection around 2010; rising blood sugar, blood pressure, overweight; air pollution and metabolic risk) and on the household bill (out-of-pocket spending still high, private care expensive, a thin public system). Hold the honest answer: India became much better at keeping people alive, while the next problems moved into chronic disease, inequality and the cost of care.

Sources do different jobs and their disagreements are informative, not errors: IHME GBD 2023 MODELS the disease burden, causes and risk-attributed deaths; NFHS-5/6 MEASURES prevalence in the field; the National Health Accounts track the financing mix; Indica's own tabulation of NSS 80th-round (2025) unit data ASKS households about cost and care; the World Bank gives the cross-country lens; and the National Health Profile 2023 (CBHI) is India's own official COUNT of facilities and registered workforce.

Honesty rules: latest available does not mean measured this year; World Bank harmonises/models; NFHS is a household survey with sampling error and NFHS-6 dropped anaemia testing; NSS 80th-round figures are Indica's own tabulation and the official MoSPI report may differ; NHP registration counts are cumulative and "on paper", NOT active or in-position staff, and facility counts carry a reporting lag; NSS "persons covered" is not NFHS "households covered"; never claim a single cause; these data show patterns, not causes. For the GLP-1/Ozempic coda, the prices and patent facts are verified but every population-impact claim is an explicit scenario, not a measured outcome.`;

function chartBlock(chart, locked) {
  const ids = [chart.indicator, ...(chart.series || []).map((item) => item.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((item) => ids.includes(item.indicatorId))
    .slice(0, 18)
    .map((item) => `${item.label}: ${item.displayValue ?? item.value}${item.unit ? ` ${item.unit}` : ""}, ${item.date || ""}`.trim());
  return [
    `CHART TITLE: ${chart.title}`,
    `BEAT: ${chart.beat || ""}`,
    `WHY: ${chart.why || ""}`,
    `READ: ${chart.read || ""}`,
    `CAVEAT: ${chart.watch || ""}`,
    nums.length ? `LOCKED NUMBERS YOU MAY USE: ${nums.join("; ")}` : "LOCKED NUMBERS YOU MAY USE: none"
  ].join("\n");
}

async function call(messages, maxTokens = 5000) {
  const retries = Number(process.env.HEALTH_TRANSITION_CALL_RETRIES || 3);
  let last;
  for (let i = 0; i < retries; i += 1) {
    try {
      const result = await createDeepSeekJsonCompletion({
        model: MODEL,
        messages,
        maxTokens,
        temperature: 0.25,
        jsonRetries: 1
      });
      return result.json;
    } catch (error) {
      last = error;
      console.warn(`  DeepSeek call failed (${error.message.slice(0, 120)}); retry ${i + 1}/${retries}`);
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

console.log(`generating ${QID}: ${plan.length} chart sections in ${Math.ceil(plan.length / BATCH)} batches`);

const sections = [];
for (let i = 0; i < plan.length; i += BATCH) {
  const charts = plan.slice(i, i + BATCH);
  const blocks = charts.map((chart) => chartBlock(chart, locked)).join("\n\n---\n\n");
  const out = await call([
    { role: "system", content: SYS },
    {
      role: "user",
      content: `Write one H2 section for EACH chart below, in the same order. Each heading must be a reader question. Each body must be 120-190 words, answer the question directly, and include the caveat before a reader can misuse the number. Do not invent numbers. Do not use em-dashes.

${blocks}

Return JSON exactly: {"sections":[{"heading":"question heading without ##","body":"section body"}]}`
    }
  ], 7000);
  const batchSections = Array.isArray(out.sections) ? out.sections : [];
  batchSections.forEach((section, j) => {
    sections.push({
      heading: String(section.heading || charts[j]?.title || "").replace(/^#+\s*/, "").trim(),
      body: String(section.body || "").trim(),
      chartTitle: charts[j]?.title || null
    });
  });
  console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${batchSections.length}`);
}

const method = await call([
  { role: "system", content: SYS },
  {
    role: "user",
    content: `Write the final methodology section. Heading exactly: "How to read these numbers". Body 220-300 words. Cover: the five data systems do different jobs (GBD models burden/causes/risks; NFHS measures prevalence; NHA tracks financing; NSS 80th-round 2025 is Indica's own tabulation of unit data and the official report may differ; World Bank harmonises/models; NHP 2023 is India's own count); latest available is not measured-this-year; NFHS-6 fieldwork 2023-24, Manipur not surveyed, anaemia testing dropped; wealth-quintile data is survey-year data; cross-country nutrition years differ; health-spending denominators differ; NHP registration counts are cumulative and on-paper, NOT active/in-position, and facility counts lag; NSS "persons covered" is not NFHS "households covered"; the GLP-1 coda is speculative (prices verified, population impact a scenario); these data show patterns, not causes. Return JSON exactly: {"heading":"How to read these numbers","body":"..."}`
  }
], 3500);
sections.push({ heading: "How to read these numbers", body: String(method.body || "").trim(), chartTitle: null });

const meta = await call([
  { role: "system", content: SYS },
  {
    role: "user",
    content: `Return article metadata as JSON exactly: {"title":"...","standfirst":"1-2 sentence dek","short":{"headline":"...","dek":"...","body":"70-100 words"},"macha":{"heading":"Okay, but what does this actually mean?","body":"80-120 words","soWhat":"one sentence"},"caveats":["7-9 caveats"],"sourceNotes":["7-9 source notes"],"glossaryBlocks":[{"term":"...","plainMeaning":"one-sentence plain definition","whyItMattersHere":"one sentence on why it matters in this article"}]}. The article spans World Bank HNP + wealth quintiles, NFHS-5/6, IHME GBD 2023, National Health Accounts, Indica's NSS 80th-round tabulation, NHP 2023 (CBHI), and a speculative GLP-1 coda; the title and dek must frame the better/mixed/worse verdict. Source notes must name all of these. Include glossary definitions for: modeled estimate, DALY, non-communicable disease, stunting, wasting, out-of-pocket expenditure, wealth quintile, and GLP-1. Caveats must include that NHP registration counts are cumulative/on-paper not active, and that the GLP-1 coda is speculative.`
  }
], 6000);

const bodyMarkdown = sections.map((section) => `## ${section.heading}\n\n${section.body}`).join("\n\n");
const sectionVisualMap = sections
  .filter((section) => section.chartTitle)
  .map((section) => ({ heading: section.heading, visualId: section.chartTitle }));

const document = {
  schemaVersion: 1,
  questionId: QID,
  status: "ready",
  short: meta.short || { headline: "", dek: "", body: "" },
  macha: meta.macha || { heading: "Okay, but what does this actually mean?", body: "", soWhat: "" },
  article: {
    title: meta.title || "Is India Getting Healthier?",
    standfirst: meta.standfirst || "",
    bodyMarkdown
  },
  editorialPlan: {
    audience: "Curious Indian general reader",
    heroDescription: "",
    selectedDataPoints: [],
    pullQuotes: [],
    glossaryBlocks: Array.isArray(meta.glossaryBlocks) ? meta.glossaryBlocks : []
  },
  chartExplainers: [],
  sectionVisualMap,
  sourceNotes: Array.isArray(meta.sourceNotes) ? meta.sourceNotes : [],
  furtherReading: [
    "On the GLP-1 coda: Bloomberg, 'Ozempic copies to cost $14 in India as generic GLP-1 era starts' (20 Mar 2026): https://www.bloomberg.com/news/articles/2026-03-20/ozempic-copies-to-cost-14-in-india-as-generic-glp-1-era-starts",
    "On the GLP-1 coda: CNBC, 'India is launching cheap weight-loss drugs, but Novo Nordisk is betting its brands will stay on top' (23 Mar 2026): https://www.cnbc.com/2026/03/23/novo-nordisk-cheap-weight-loss-drugs-india-generic-ozempic-wegovy-semaglutide.html",
    "On the GLP-1 coda: Business Today, 'India's weight loss drug moment: what happens when semaglutide goes generic' (20 Mar 2026): https://www.businesstoday.in/industry/pharma/story/indias-weight-loss-drug-moment-what-happens-when-semaglutide-goes-generic-521612-2026-03-20"
  ],
  caveats: Array.isArray(meta.caveats) ? meta.caveats : [],
  lockedNumbersUsed: [],
  qualityFlags: [],
  generatedAt: new Date().toISOString(),
  model: MODEL,
  generationPasses: [{ name: "batched-body", model: MODEL }],
  evidence
};

await writeFile(OUT, `${stableJson(document)}\n`);
console.log(`wrote ${OUT}: ${sections.length} sections, ${sectionVisualMap.length} chart bindings`);
