// Targeted generator for the 5 new state-fertility charts added to q.people.population.
// Generates a body section + a rich chartExplainer for each new chart (in the house
// voice) and SPLICES them into the existing explanation, preserving all current prose.
// A full regenerate would hit the deepseek output ceiling at 35 charts and risk the
// already-published prose, so we splice (per CLAUDE.md gotchas) and rebuild
// sectionVisualMap by walking headings in visualPlan order.
import { readFile, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { stableJson } from "./core/artifacts.mjs";

const QID = "q.people.population";
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const path = `data/explanations/en/${QID}.json`;

// Each new chart: its exact visualPlan title, the body section it follows (anchor
// heading already in the article), the locked facts, and a short brief for the section.
const NEW = [
  {
    title: "Indian states next to the rich world",
    afterHeading: "How does India's fertility compare globally?",
    facts: "TFR 2023 on the chart (use ONLY these): Indian states — Tamil Nadu 1.3, West Bengal 1.3, Maharashtra 1.4, Kerala 1.5, Karnataka 1.5, Andhra Pradesh 1.5, Telangana 1.5. Countries — United Kingdom 1.6, Denmark 1.5, Iceland 1.5, Portugal 1.5, Norway 1.4, Finland 1.3, Japan 1.2. So Tamil Nadu and West Bengal sit below the UK, Denmark, Iceland, Portugal and Norway, level with Finland; only Japan is lower. Source: SRS 2023 (states) and UN World Population Prospects 2024 (countries).",
    brief: "The point: Indian fertility is now low by world standards, not just by India's own past. Stand the states beside developed countries on one scale. Do not claim a precise rank; say several Indian states now sit among the lowest-fertility rich nations."
  },
  {
    title: "Low fertility without the jobs",
    afterHeading: "How does India's fertility compare globally?",
    facts: "World Bank: India TFR about 2.0 (1.99) with female labour-force participation about 31.6% of women. Vietnam TFR about 1.9 (1.93) with LFP about 75.7%. China TFR ~1.0 with LFP ~69.5%; United States TFR ~1.7 with LFP ~67.7%; Bangladesh TFR ~2.2 with LFP ~46.9%. India reached very low fertility with unusually FEW women in paid work, breaking the usual pattern where fertility falls as women enter the workforce.",
    brief: "The paradox: in most countries fertility falls as women take paid work; India got to low fertility with barely a third of women working, as low as Vietnam's fertility but with half its female workforce. Present as a striking pattern that complicates the simple story, NOT a single cause. Many forces drove fertility down."
  },
  {
    title: "The same map, projected to 2031-35",
    afterHeading: "Does fertility look different across India's states?",
    facts: "National Commission on Population, Technical Group on Population Projections (2019): projected TFR for 2031-35. Almost every state settles near 1.5; only Bihar is projected above replacement, at about 2.4. Madhya Pradesh about 2.0; Uttar Pradesh, Rajasthan, Jharkhand about 1.9. These are the official medium projection off the 2011 census, a SCENARIO not a certainty, and several states' actual SRS fertility is already falling faster than projected.",
    brief: "Pair with the current state map: 'here is the map now, here is the projected map of 2031-35.' Near-total convergence to ~1.5, Bihar the lone holdout. Stress these are projections, not certainties, and that reality is running ahead of them in places."
  },
  {
    title: "Every state is falling, fast",
    afterHeading: "Which states have the highest and lowest fertility?",
    facts: "SRS, TFR about a decade ago (around 2013) versus 2023: Bihar 3.4 to 2.8, Uttar Pradesh about 3.3 to 2.6, Madhya Pradesh to 2.4, Rajasthan to 2.3, Tamil Nadu 1.7 to 1.3, Kerala 1.8 to 1.5. By 2023 only five states stay above the 2.1 replacement line: Bihar (2.8), UP (2.6), MP (2.4), Rajasthan (2.3), Chhattisgarh (2.2). Every major state fell over the decade.",
    brief: "The map is a snapshot; this is the motion. Over a single decade every major state's fertility dropped. Even the highest are falling fast, so the question is when they reach replacement, not whether. Note the bars show roughly a decade ago versus 2023, ranked by where each state stands now."
  },
  {
    title: "The childbearing window is closing from the top",
    afterHeading: "Are women having children later?",
    facts: "NFHS rounds 1-5 (1992 to 2020), median ages: age at first marriage rose from about 16.1 to 18.8; age at first birth barely moved, about 19.4 to 21.2; age at LAST birth fell sharply, from about 32.8 to 27.6. So the years a woman spends bearing children have compressed, mostly because she stops earlier, not because she starts much later.",
    brief: "The mechanism behind smaller families: not a later start, but a much earlier stop. First birth barely moved; last birth dropped about five years. The childbearing window narrowed from the top."
  }
];

const SYS = `You write for Indica, a data-journalism site on India, for a curious Indian general reader. Voice: warm, plain, grounded, someone who knows demography cold and writes like a fine essayist. Never use em-dashes. Use ONLY the numbers given to you; round like a human ("about 1.5", "roughly a third", "under 28"); never invent figures, dates, studies, or quotes. Never narrate the article itself (no "this chart shows", "as we saw", "the next section"); write about India and Indians. Each body section is a single H2 reader-question heading followed by 1-2 tight paragraphs (about 110-160 words) that explain and sit beside the named chart. Be specific and concrete; carry the argument; end with a line that lands.`;

function block(c) {
  return [
    `CHART TITLE (use as the explainer visualId, exactly): "${c.title}"`,
    `Editorial brief: ${c.brief}`,
    `Numbers you MUST use (no others): ${c.facts}`
  ].join("\n");
}

const user = `Write a body section AND a rich chart explainer for EACH of the ${NEW.length} charts below.

Return JSON exactly:
{"items":[{
  "visualId":"<exact chart TITLE>",
  "heading":"<a reader-question H2 heading, no ## prefix, in the style of the existing ones like 'Which states have the highest and lowest fertility?'>",
  "body":"<1-2 paragraphs, ~110-160 words, plain prose, no heading inside, no markdown bullet, no em-dashes>",
  "takeaway":"<one vivid memorable sentence with the key number>",
  "detail":"<3-5 sentences: what the chart shows, the key numbers and trend, what drives it, what it means>",
  "whyShowThis":"<one sentence: why this chart earns its place>",
  "howToRead":"<one or two concrete lines on reading the axes/bars/map/lines>",
  "mistakeToAvoid":"<the single most important misreading to avoid>",
  "mobileNote":"<short note for the small-screen version>"
}]}

One item per chart, SAME ORDER, visualId EXACTLY equal to the chart TITLE.

${NEW.map(block).join("\n\n---\n\n")}`;

console.log(`Generating ${NEW.length} sections + explainers via ${MODEL}...`);
const c = await createDeepSeekJsonCompletion({ model: MODEL, maxTokens: 9000, messages: [
  { role: "system", content: SYS },
  { role: "user", content: user }
]});
const items = Array.isArray(c.json.items) ? c.json.items : [];
if (items.length !== NEW.length) {
  console.error(`Expected ${NEW.length} items, got ${items.length}. Aborting.`);
  process.exit(1);
}

const d = JSON.parse(await readFile(path, "utf8"));
let body = d.article.bodyMarkdown;

// Group new sections by their (existing) anchor heading, preserving order, then
// insert each group as one block after the anchor's section. Grouping avoids the
// chained-anchor problem when two new sections follow the same existing heading.
const groups = new Map();
for (const spec of NEW) {
  const item = items.find((x) => x.visualId === spec.title);
  if (!item) { console.error(`No generated item for "${spec.title}"`); process.exit(1); }
  const section = `\n\n## ${item.heading.replace(/^#+\s*/, "").trim()}\n\n${item.body.trim()}`;
  if (!groups.has(spec.afterHeading)) groups.set(spec.afterHeading, []);
  groups.get(spec.afterHeading).push(section);
}
for (const [anchor, sections] of groups) {
  const anchorRe = new RegExp(`(\\n## ${escapeRe(anchor)}\\n[\\s\\S]*?)(?=\\n## |$)`);
  const m = body.match(anchorRe);
  if (!m) { console.error(`Anchor heading not found: "${anchor}"`); process.exit(1); }
  const at = m.index + m[0].length;
  body = body.slice(0, at) + sections.join("") + body.slice(at);
}
d.article.bodyMarkdown = body;

// Merge explainers in visualPlan order is handled by the renderer (matched by visualId);
// just append the 5 new ones to the existing 30.
const newExplainers = items.map((x) => ({
  visualId: x.visualId, title: x.visualId, takeaway: x.takeaway, detail: x.detail,
  whyShowThis: x.whyShowThis, howToRead: x.howToRead, mistakeToAvoid: x.mistakeToAvoid, mobileNote: x.mobileNote
}));
d.chartExplainers = [...(d.chartExplainers || []), ...newExplainers];

// Rebuild sectionVisualMap by walking headings in order against the visualPlan titles.
const headings = [];
for (const line of body.split("\n")) { const mm = line.match(/^## (.+)/); if (mm) headings.push(mm[1].trim()); }
const { v1Questions } = await import("./registry/v1-indicators.mjs");
const plan = (v1Questions.find((q) => q.id === QID).visualPlan || []).filter((v) => v.indicator || (v.series && v.series.length));
d.sectionVisualMap = headings.slice(0, plan.length).map((heading, i) => ({ heading, visualId: plan[i]?.title ?? "" }));

// Caveats + source notes for the new material.
const addCaveat = (t) => { if (!(d.caveats || []).some((c) => c.includes(t.slice(0, 24)))) d.caveats.push(t); };
addCaveat("State fertility series come from the SRS (via dataforindia) and the state-level projections to 2035 from the National Commission on Population's 2019 Technical Group; the projections are the official medium scenario off the 2011 census, and several states' fertility is already falling faster than projected. States reorganised after 2000 (Telangana, Chhattisgarh, Jharkhand, Uttarakhand) have shorter separate records.");
addCaveat("The fertility-and-work comparison uses World Bank modelled estimates of female labour-force participation, which differ from India's own survey measures; the low-fertility, low-participation pattern is a striking correlation, not a single proven cause.");
const addNote = (t) => { if (!(d.sourceNotes || []).some((c) => c.includes(t.slice(0, 20)))) d.sourceNotes.push(t); };
addNote("Sample Registration System (SRS) Annual Statistical Reports, Registrar General of India, for state total fertility rates over time, accessed via dataforindia.com/fertility.");
addNote("National Commission on Population, Report of the Technical Group on Population Projections, November 2019, for state-wise TFR projections to 2031-35.");
addNote("UN World Population Prospects 2024 (country fertility), World Bank World Development Indicators (fertility and female labour-force participation) and NFHS rounds 1-5, IIPS (median ages at marriage and birth), via dataforindia.com/fertility.");

await writeFile(path, stableJson(d) + "\n");
console.log(`Spliced ${items.length} sections. Body now ${body.split("\n## ").length - 1 + 1} headings; chartExplainers ${d.chartExplainers.length}; sectionVisualMap ${d.sectionVisualMap.length}.`);

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
