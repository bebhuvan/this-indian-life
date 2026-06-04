// Generate a per-chart explainer box for the NFHS-6 hub using DeepSeek Pro.
// Prose is written to LOCKED numbers (passed in as facts) — the model wraps
// them, never invents them. Cached to data/nfhs6/explainers.json.
//
//   node scripts/generate-nfhs6-explainers.mjs            # missing per-chart + per-tab Q&A
//   node scripts/generate-nfhs6-explainers.mjs --force    # regenerate everything
//   node scripts/generate-nfhs6-explainers.mjs --only db-children,se-diabetes
//   node scripts/generate-nfhs6-explainers.mjs --tabs --only overview   # one theme's Q&A
//   node scripts/generate-nfhs6-explainers.mjs --blocks   # per-chart pass only
//
// Two passes share one cache: per-chart {takeaway, read} keyed by block id, and
// per-tab Q&A keyed by "__tab__<id>". Numbers are LOCKED — prose wraps them.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { allBlocks, blockFacts, TABS } from "../src/data/nfhs6.mjs";

const OUT = resolve(process.cwd(), "data/nfhs6/explainers.json");
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";
const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only"));
const only = onlyArg ? new Set((onlyArg.split("=")[1] || args[args.indexOf(onlyArg) + 1] || "").split(",").filter(Boolean)) : null;

const SYSTEM = [
  "You write the interpretation that sits below one data chart in Indica, a beautifully designed almanac of India, read by ordinary curious people (not experts).",
  "Voice: a sharp, warm analyst who makes things click — precise, plain, vivid, never hype, never clichés. British/Indian English.",
  "You are given the chart's heading, the theme, and the EXACT locked numbers it plots. The reader can already SEE the bars/map and their numbers.",
  "HARD RULE on numbers: use ONLY the numbers in the facts. Never invent or alter a number, and never state a statistic that isn't given. You MAY add widely-known qualitative context (e.g. 'diabetes often goes undiagnosed for years') but NEVER a fabricated figure.",
  "Your job is INTERPRETATION, not narration. Do NOT restate every value or say 'the chart shows/compares...'. Instead explain: what this pattern MEANS, what is likely driving it, who it affects, and why an ordinary person should care. Cite at most one or two numbers as anchors.",
  "Return STRICT JSON: {\"takeaway\": string, \"read\": string}.",
  "takeaway: one vivid sentence, <= 16 words — the single thing to remember.",
  "read: 3-4 plain, flowing sentences (<= 90 words). Lead with meaning, not with a number or 'the chart'. Make a non-expert genuinely understand and care.",
].join("\n");

function userPrompt(block) {
  const f = blockFacts(block);
  return [
    `Theme: ${block.tabTitle} — ${block.dek}`,
    `Chart heading: "${block.h}"`,
    `Chart type: ${f.kind}`,
    "Locked numbers plotted (use these exactly, nothing else):",
    ...f.numbers.map((n) => `  - ${n}`),
    "",
    'Return only: {"takeaway": "...", "read": "..."}',
  ].join("\n");
}

// ---- Per-tab Q&A spine ------------------------------------------------------
// Each theme opens with editorial framing questions (owned by the spec); this
// pass writes the ANSWER prose to the locked numbers of the charts each question
// maps to, mirroring the regular-article Q&A voice.
const SYSTEM_QA = [
  "You write the narrative spine of one theme in Indica's NFHS-6 hub — a beautifully designed almanac of India, read by ordinary curious people (not experts).",
  "Voice: a sharp, warm analyst who makes things click — precise, plain, vivid, never hype, never clichés. British/Indian English.",
  "You are given a theme and, for each framing QUESTION, the EXACT locked numbers from the charts that answer it. The reader will see those charts right below your answer.",
  "HARD RULE on numbers: use ONLY the numbers in that question's facts. Never invent, never alter, never state a statistic that isn't given. You MAY add widely-known qualitative context (e.g. 'diabetes often goes undiagnosed for years') but NEVER a fabricated figure.",
  "Write a direct ANSWER to each question: 2-3 flowing paragraphs, <= 130 words total. Lead with meaning. Do NOT restate the question as a heading. Do NOT narrate ('the chart shows…') — interpret: what the pattern means, what is driving it, who it affects, why it matters. Cite a couple of numbers as anchors, not all of them.",
  "Separate paragraphs with a blank line. Plain prose only — no markdown headings, no bullet lists.",
  'Return STRICT JSON: {"answers": { "<questionId>": "<answer text>", ... }} with exactly one entry per question id given, keyed by the id verbatim.',
].join("\n");

// All locked numbers in a tab, de-duplicated — the evidence base for an intro.
function tabFactLines(tab) {
  const out = [];
  for (const b of tab.blocks) for (const n of blockFacts(b).numbers) out.push(n);
  return [...new Set(out)];
}

const SYSTEM_INTRO = [
  "You write the short standfirst that introduces one theme in Indica's NFHS-6 hub — a beautifully designed almanac of India, read by ordinary curious people (not experts).",
  "Voice: a sharp, warm analyst who makes things click — precise, plain, vivid, never hype, never clichés. British/Indian English.",
  "You are given the theme and the EXACT locked numbers behind its charts.",
  "HARD RULE on numbers: use ONLY the numbers in the facts. Never invent, alter, or state a statistic not given. You MAY add widely-known qualitative context but NEVER a fabricated figure.",
  "Write 2-3 sentences (<= 60 words) that frame WHAT this theme is about and the single biggest thing the reader should take from it. Set the scene; do not list charts or say 'this section'. Lead with meaning. Cite at most one number.",
  'Return STRICT JSON: {"intro": "..."}.',
].join("\n");

function tabIntroPrompt(tab) {
  return [
    `Theme: ${tab.title} — ${tab.dek}`,
    "Locked numbers behind this theme's charts (use only these, and only if helpful):",
    ...tabFactLines(tab).map((n) => `  - ${n}`),
    "",
    'Return only: {"intro": "..."}',
  ].join("\n");
}

// "Tell me what this means, bro" — the warm, plain-language layer. A friend
// explaining the whole theme over chai: grounded, human, ends with a 'so what'.
const SYSTEM_MACHA = [
  "You write the 'Tell me what this means, bro' panel for one theme of Indica's NFHS-6 hub — the bit where a sharp friend explains what the data actually means for ordinary Indians, in plain warm language.",
  "Voice: friendly, grounded, vivid, a little conversational ('basically…', 'here's the catch…') but never silly, never hype, never clichés. British/Indian English. You're explaining, not performing.",
  "You are given the theme, a punchy one-line headline (already shown above your text — do NOT repeat it), and the EXACT locked numbers.",
  "HARD RULE on numbers: use ONLY the numbers in the facts. Never invent or alter a figure. You MAY add widely-known qualitative context but NEVER a fabricated number.",
  "Write a 'body': 3-5 plain sentences (<= 110 words) that explain what's really going on and why it matters to a normal person — what changed, why, and what it means for them. Then a 'soWhat': one punchy sentence (<= 20 words) — the bottom line to walk away with.",
  'Return STRICT JSON: {"body": "...", "soWhat": "..."}.',
].join("\n");

function tabMachaPrompt(tab) {
  return [
    `Theme: ${tab.title} — ${tab.dek}`,
    `Headline already shown (do not repeat it): "${tab.macha}"`,
    "Locked numbers behind this theme (use only these, as anchors):",
    ...tabFactLines(tab).map((n) => `  - ${n}`),
    "",
    'Return only: {"body": "...", "soWhat": "..."}',
  ].join("\n");
}

function tabQaPrompt(tab) {
  const byId = Object.fromEntries(tab.blocks.map((b) => [b.id, b]));
  const lines = [`Theme: ${tab.title} — ${tab.dek}`, ""];
  for (const q of tab.questions) {
    lines.push(`QUESTION id="${q.id}": ${q.q}`);
    lines.push("Locked numbers from the charts that answer it (use only these):");
    for (const bid of q.blockIds) {
      const b = byId[bid];
      if (!b) continue;
      lines.push(`  • ${b.h}:`);
      for (const n of blockFacts(b).numbers) lines.push(`      - ${n}`);
    }
    lines.push("");
  }
  lines.push('Return only: {"answers": {' + tab.questions.map((q) => `"${q.id}": "..."`).join(", ") + "}}");
  return lines.join("\n");
}

// One cache file, three passes: per-chart {takeaway, read} keyed by block id, and
// per-tab {intro, answers} keyed by "__tab__<id>". Pass flags --blocks / --intros
// / --tabs each run only that pass; with no pass flag all three run. --only /
// --force address all. Passes merge into the per-tab object, never clobber.
const passFlags = { blocks: args.includes("--blocks"), intros: args.includes("--intros"), macha: args.includes("--macha"), tabs: args.includes("--tabs") };
const anyPass = passFlags.blocks || passFlags.intros || passFlags.macha || passFlags.tabs;
const doBlocks = anyPass ? passFlags.blocks : true;
const doIntros = anyPass ? passFlags.intros : true;
const doMacha = anyPass ? passFlags.macha : true;
const doTabs = anyPass ? passFlags.tabs : true;
const wantTab = (tab) => (only ? only.has(tab.id) || only.has("__tab__" + tab.id) : true);

async function runBlocks(cache) {
  const blocks = allBlocks().filter((b) => (only ? only.has(b.id) : true) && (force || !cache[b.id]));
  if (!blocks.length) { console.log("Per-chart: nothing to generate (all cached)."); return; }
  console.log(`Per-chart: generating ${blocks.length} explainer(s) with ${MODEL}...`);
  let done = 0;
  for (const block of blocks) {
    try {
      const { json } = await createDeepSeekJsonCompletion({
        model: MODEL,
        temperature: 0.4,
        maxTokens: 4800, // deepseek-v4-pro reasons before answering; leave room for full prose
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt(block) },
        ],
      });
      const takeaway = String(json.takeaway || "").trim();
      const read = String(json.read || "").trim();
      if (!takeaway || !read) throw new Error("empty fields");
      cache[block.id] = { takeaway, read, model: MODEL, tab: block.tab };
      writeFileSync(OUT, JSON.stringify(cache, null, 2));
      done += 1;
      console.log(`  ✓ ${block.id}  (${done}/${blocks.length})  ${takeaway.slice(0, 60)}`);
    } catch (err) {
      console.error(`  ✗ ${block.id}: ${err.message}`);
    }
  }
  console.log(`Per-chart done. ${done}/${blocks.length} written.`);
}

async function runTabs(cache) {
  const tabs = TABS.filter((t) => (t.questions || []).length && wantTab(t) && (force || !cache["__tab__" + t.id]));
  if (!tabs.length) { console.log("Q&A: nothing to generate (all cached)."); return; }
  console.log(`Q&A: generating ${tabs.length} theme spine(s) with ${MODEL}...`);
  let done = 0;
  for (const tab of tabs) {
    try {
      const { json } = await createDeepSeekJsonCompletion({
        model: MODEL,
        temperature: 0.4,
        maxTokens: 6500, // a whole theme's worth of answers — the reasoner needs headroom
        messages: [
          { role: "system", content: SYSTEM_QA },
          { role: "user", content: tabQaPrompt(tab) },
        ],
      });
      const raw = json.answers || {};
      const answers = {};
      for (const q of tab.questions) {
        const a = String(raw[q.id] || "").trim();
        if (a) answers[q.id] = a;
      }
      const missing = tab.questions.filter((q) => !answers[q.id]).map((q) => q.id);
      if (!Object.keys(answers).length) throw new Error("no answers returned");
      cache["__tab__" + tab.id] = { ...(cache["__tab__" + tab.id] || {}), answers, model: MODEL, tab: tab.id };
      writeFileSync(OUT, JSON.stringify(cache, null, 2));
      done += 1;
      console.log(`  ✓ __tab__${tab.id}  (${done}/${tabs.length})  ${Object.keys(answers).length}/${tab.questions.length} answers${missing.length ? `  ⚠ missing: ${missing.join(",")}` : ""}`);
    } catch (err) {
      console.error(`  ✗ __tab__${tab.id}: ${err.message}`);
    }
  }
  console.log(`Q&A done. ${done}/${tabs.length} themes written.`);
}

async function runIntros(cache) {
  const tabs = TABS.filter((t) => wantTab(t) && (force || !(cache["__tab__" + t.id] || {}).intro));
  if (!tabs.length) { console.log("Intros: nothing to generate (all cached)."); return; }
  console.log(`Intros: generating ${tabs.length} theme intro(s) with ${MODEL}...`);
  let done = 0;
  for (const tab of tabs) {
    try {
      const { json } = await createDeepSeekJsonCompletion({
        model: MODEL,
        temperature: 0.4,
        maxTokens: 3000,
        messages: [
          { role: "system", content: SYSTEM_INTRO },
          { role: "user", content: tabIntroPrompt(tab) },
        ],
      });
      const intro = String(json.intro || "").trim();
      if (!intro) throw new Error("empty intro");
      cache["__tab__" + tab.id] = { ...(cache["__tab__" + tab.id] || {}), intro, model: MODEL, tab: tab.id };
      writeFileSync(OUT, JSON.stringify(cache, null, 2));
      done += 1;
      console.log(`  ✓ __tab__${tab.id} intro  (${done}/${tabs.length})  ${intro.slice(0, 64)}`);
    } catch (err) {
      console.error(`  ✗ __tab__${tab.id} intro: ${err.message}`);
    }
  }
  console.log(`Intros done. ${done}/${tabs.length} written.`);
}

async function runMacha(cache) {
  const tabs = TABS.filter((t) => t.macha && wantTab(t) && (force || !(cache["__tab__" + t.id] || {}).macha));
  if (!tabs.length) { console.log("Macha: nothing to generate (all cached)."); return; }
  console.log(`Macha: generating ${tabs.length} 'what this means' panel(s) with ${MODEL}...`);
  let done = 0;
  for (const tab of tabs) {
    try {
      const { json } = await createDeepSeekJsonCompletion({
        model: MODEL,
        temperature: 0.5,
        maxTokens: 3200,
        messages: [
          { role: "system", content: SYSTEM_MACHA },
          { role: "user", content: tabMachaPrompt(tab) },
        ],
      });
      const body = String(json.body || "").trim();
      const soWhat = String(json.soWhat || "").trim();
      if (!body) throw new Error("empty macha body");
      cache["__tab__" + tab.id] = { ...(cache["__tab__" + tab.id] || {}), macha: { body, soWhat }, model: MODEL, tab: tab.id };
      writeFileSync(OUT, JSON.stringify(cache, null, 2));
      done += 1;
      console.log(`  ✓ __tab__${tab.id} macha  (${done}/${tabs.length})  ${body.slice(0, 60)}`);
    } catch (err) {
      console.error(`  ✗ __tab__${tab.id} macha: ${err.message}`);
    }
  }
  console.log(`Macha done. ${done}/${tabs.length} written.`);
}

async function run() {
  const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  if (doBlocks) await runBlocks(cache);
  if (doIntros) await runIntros(cache);
  if (doMacha) await runMacha(cache);
  if (doTabs) await runTabs(cache);
  console.log(`All done → ${OUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
