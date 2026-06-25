// One-off: generate a single body section + chart explainer for the newly added
// "Same income, different starting points" startingGrid chart (plan position 3),
// splice them into the existing explanation, and rebuild sectionVisualMap from the
// full 42-chart plan order. Avoids regenerating the whole article.
import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.econ.asia_divergence";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const path = `data/explanations/en/${QID}.json`;
const POS = 2; // zero-based plan index of the startingGrid chart (3rd chart)

const SYS = `You write for one long, definitive data-journalism article, "Why did India stay poor while the rest of Asia got rich?", for a curious Indian general reader. Voice: warm, plain-spoken, rigorous; knows development economics cold. Never use em-dashes. Use ONLY the numbers given; round like a human; never invent figures or named studies. State WHAT the data shows, never a single cause, and never imply India should have coerced its people.`;

const FACTS = `CHART: "Same income, different starting points" (a small-multiples grid: India, China and South Korea, each panel one measure, all from 1960, each on its own scale).
THE POINT: in 1960 the three earned roughly the same income (Maddison 2011 int-$: India about 1,200, China about 1,060, South Korea about 1,550, so close, with India actually above China), yet on the things that build a workforce they were already far apart, and from that shared income line every measure fanned out.
NUMBERS YOU MAY USE (1960 unless noted): mean years of schooling, India about 1, China about 3, South Korea about 4. Life expectancy, India 46, China 33, South Korea 54. Under-five deaths per 1,000, India 241, China about 118, South Korea 113. Fertility about 6 for India and Korea, about 4 for China. Investment rate (share of GDP), India about 14%, China about 33%, Korea about 11% (Korea's surged later). City-dwelling share, India 18%, China 20%, Korea 28%. Korea then raced ahead on all of them while India moved slowly.`;

async function call(messages, maxTokens) {
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try { return (await createDeepSeekJsonCompletion({ model: MODEL, maxTokens, messages })).json; }
    catch (e) { lastErr = e; console.warn(`  attempt ${attempt}/5: ${String(e.message).slice(0, 100)}`); await new Promise((r) => setTimeout(r, 4000 * attempt)); }
  }
  throw lastErr;
}

const out = await call([
  { role: "system", content: SYS },
  { role: "user", content: `${FACTS}\n\nReturn JSON exactly: {"section":{"heading":"a reader-question H2 (no ## prefix) this chart answers","body":"150-200 words answering it with only the given numbers, making the point that they earned the same in 1960 but their people were already on different tracks, and that the gaps fanned out from a shared starting line"},"explainer":{"visualId":"Same income, different starting points","title":"Same income, different starting points","takeaway":"one vivid sentence with the key 1960 contrast","detail":"4-7 sentences: what the grid shows, the 1960 numbers, what fanned out, what it means for the human-capital-first argument","whyShowThis":"one sentence on why this earns its place","howToRead":"one or two concrete lines on reading the panels and their own scales","mistakeToAvoid":"the key misreading to avoid (incomes were close not identical; do not compare heights across panels)","mobileNote":"a short small-screen note"}}` },
], 4000);

const d = JSON.parse(await readFile(path, "utf8"));

// 1) splice the body section at plan position POS (so section order stays 1:1 with plan).
const chunks = d.article.bodyMarkdown.split(/(?=^## )/m);
const newSection = `## ${String(out.section.heading).replace(/^#+\s*/, "")}\n\n${out.section.body}\n\n`;
chunks.splice(POS, 0, newSection);
d.article.bodyMarkdown = chunks.join("");

// 2) splice the explainer at the same index.
d.chartExplainers.splice(POS, 0, out.explainer);

// 3) rebuild sectionVisualMap 1:1 against the full plan order.
const plan = (v1Questions.find((q) => q.id === QID).visualPlan || []).filter((v) => v.indicator || (v.series && v.series.length) || (v.panels && v.panels.length));
const headings = [];
for (const line of d.article.bodyMarkdown.split("\n")) { const m = line.match(/^## (.+)/); if (m) headings.push(m[1].trim()); }
d.sectionVisualMap = headings.slice(0, plan.length).map((heading, i) => ({ heading, visualId: plan[i]?.title ?? "" }));

await writeFile(path, stableJson(d) + "\n");
console.log(`spliced. sections now: ${headings.length}, chartExplainers: ${d.chartExplainers.length}, plan: ${plan.length}`);
console.log(`new section heading: "${out.section.heading}"`);
console.log(`svm[${POS}] -> heading "${d.sectionVisualMap[POS].heading}" bound to visualId "${d.sectionVisualMap[POS].visualId}"`);
