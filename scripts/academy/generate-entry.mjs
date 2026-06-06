// Academy entry generator: draft -> lint -> self-critique -> revise.
//
// Usage: node scripts/academy/generate-entry.mjs --slug=what-is-gdp [--model=deepseek-v4-pro]
//
// Reads a brief (docs/academy/briefs/<slug>.json), pulls locked numbers from the
// brief's evidenceSource packet, loads VOICE.md + critique-loop.md, and runs the
// generation loop. Writes <slug>.draft.json, <slug>.final.json and <slug>.md into
// docs/academy/drafts/. Numbers and cross-disciplinary facts are constrained to the
// locked numbers and the brief's vetted contextCards (no model-memory facts).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createDeepSeekJsonCompletion } from "../adapters/deepseek.mjs";
import { lintProse } from "../core/prose-lint.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function lintReport(...texts) {
  const findings = texts.flatMap((t) => lintProse(t || ""));
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  return { findings, errors, warns };
}

// Every prose-bearing field of an entry, so the gate sees all of them.
function fieldsOf(e) {
  return [
    e.bottomLine, e.standfirst, e.body, e.onTheGround?.body, e.onTheGround?.heading,
    e.whatPeopleGetWrong, e.caveat,
    ...(e.keyTerms || []).map((t) => t.plainMeaning)
  ];
}

// Deterministic hard gate: blocked if any lint error OR any em-dash anywhere.
// (The linter only reports the first match per field, so check em-dash directly.)
function hardIssues(e) {
  const texts = fieldsOf(e);
  const lint = lintReport(...texts);
  const emdash = texts.some((t) => String(t || "").includes("—"));
  return { lint, emdash, blocked: lint.errors.length > 0 || emdash };
}

// Derived-number guard. The model cannot reliably audit its own arithmetic, and the
// self-critique misses invented ratios (e.g. "the economy grew fifty times"). These
// patterns surface every multiplier/ratio claim so the critique pass must tie it to a
// locked-number comparison or cut it, and so a human verifies what survives. Warn-only
// (not a hard block): a multiplier CAN be legitimate if a locked number states it.
const DERIVED_NUMBER_RES = [
  /\b\d+(?:\.\d+)?\s*(?:times|fold|x|×)\b/gi,
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|dozen)\s*(?:times|fold)\b/gi,
  /\b(?:doubled|tripled|trebled|quadrupled|quintupled|halved)\b/gi
];
function derivedReport(...texts) {
  const out = [];
  for (const t of texts) {
    const s = String(t || "");
    for (const re of DERIVED_NUMBER_RES) {
      for (const m of s.matchAll(re)) {
        out.push({ rule: "derived-number", severity: "warn", match: m[0], hint: `"${m[0]}" is a multiplier or ratio. Verify it equals a comparison stated in the locked numbers, otherwise remove it. Never compute a ratio from memory.` });
      }
    }
  }
  return out;
}

const LC = 1e12; // one lakh crore in rupees

// Pick the most-recent locked number per indicator (prefer a label that says "latest").
function latestByIndicator(lockedNumbers) {
  const map = new Map();
  for (const n of lockedNumbers) {
    if (!n.indicatorId) continue;
    const cur = map.get(n.indicatorId);
    const nLatest = /latest/i.test(n.label || "");
    if (!cur) { map.set(n.indicatorId, n); continue; }
    const curLatest = /latest/i.test(cur.label || "");
    if (nLatest && !curLatest) { map.set(n.indicatorId, n); continue; }
    if (nLatest === curLatest && String(n.date || "") > String(cur.date || "")) map.set(n.indicatorId, n);
  }
  return map;
}

// Check definitional accounting identities on the LATEST value of each series. The
// failure we hit: GDP (FY26) minus a stale CFC (FY24) did not equal NDP. Per-number
// sourcing was fine; the numbers did not TIE because they were different vintages.
// Returns human warnings plus same-vintage derived figures the model should use instead.
function checkIdentities(lockedNumbers) {
  const m = latestByIndicator(lockedNumbers);
  const lc = (v) => `₹${(v / LC).toFixed(1)} lakh crore`;
  const warnings = [];
  const derived = [];

  const gdp = m.get("econ.nas.gdp_nominal");
  const ndp = m.get("econ.nas.ndp_nominal");
  const cfc = m.get("econ.nas.cfc_nominal");
  if (gdp && ndp && cfc) {
    const off = Math.abs(gdp.value - (ndp.value + cfc.value)) / gdp.value;
    if (off > 0.01) {
      warnings.push(`GDP (${gdp.displayValue}, ${gdp.date}) does not equal NDP (${ndp.displayValue}, ${ndp.date}) + CFC (${cfc.displayValue}, ${cfc.date}); off by ${(off * 100).toFixed(1)}%, a vintage mismatch (CFC dated ${cfc.date}). Do NOT present GDP minus that CFC as equal to NDP.`);
      const gap = gdp.value - ndp.value;
      derived.push({ label: "Depreciation, latest year (GDP minus NDP, same vintage)", value: gap, displayValue: lc(gap), date: gdp.date, unit: "rupees", sourceId: gdp.sourceId, indicatorId: "derived.cfc_consistent", note: "Definitional identity GDP = NDP + depreciation. Use this same-year figure, not the separately-dated CFC." });
    }
  }

  const gni = m.get("econ.nas.gni_nominal");
  const ipa = m.get("econ.nas.income_paid_abroad_nominal");
  if (gdp && gni && ipa) {
    const off = Math.abs((gdp.value - ipa.value) - gni.value) / gdp.value;
    if (off > 0.01) warnings.push(`GNI does not tie: GDP minus net income paid abroad does not equal GNI (off ${(off * 100).toFixed(1)}%).`);
  }

  return { warnings, derived };
}

// Every figure shown in a table or a visual must trace to a locked number, just like
// prose figures. Returns human warnings for any that do not, so they can be checked.
function checkRichFigures(entry, lockedNumbers) {
  const warnings = [];
  const displays = new Set(lockedNumbers.map((n) => normalizeFigure(n.displayValue)));
  const numericValues = lockedNumbers.map((n) => Number(n.value)).filter((v) => Number.isFinite(v));
  const numericish = (v) => numericValues.some((x) => x !== 0 && Math.abs(x - v) / Math.abs(x) < 0.005) || numericValues.includes(v);

  // Visual segment values must equal a locked share (figure like "56.4%") or value.
  for (const v of entry.visuals || []) {
    for (const s of v.segments || []) {
      const asPct = normalizeFigure(`${s.value}%`);
      if (!displays.has(asPct) && !numericish(Number(s.value))) {
        warnings.push(`visual "${v.title || v.type}" segment "${s.label}" value ${s.value} is not a locked number — verify or fix.`);
      }
    }
  }

  // Table cells: any rupee or percent figure should appear in the locked displayValues.
  const tableFigures = (entry.body || "").split("\n").filter((l) => l.trim().startsWith("|") && !l.includes("---"))
    .flatMap((l) => l.match(/₹[\d.,]+\s*(?:lakh crore|crore|lakh)?|[\d.]+\s*%/g) || []);
  for (const fig of tableFigures) {
    if (!displays.has(normalizeFigure(fig))) {
      warnings.push(`table figure "${fig.trim()}" is not a locked displayValue — verify or fix.`);
    }
  }
  return warnings;
}

function normalizeFigure(s) {
  return String(s || "").toLowerCase().replace(/minus|−|-/g, "").replace(/\s+/g, "").replace(/₹/g, "").trim();
}

// Link entities the model named that are NOT yet in the vetted map will not render —
// surface them so a human can add a verified URL.
function checkLinkEntities(entry, linksPath) {
  if (!existsSync(linksPath)) return { missing: entry.linkEntities || [], have: [] };
  const links = JSON.parse(readFileSync(linksPath, "utf8"));
  const known = new Set(links.flatMap((l) => l.match.map((m) => m.toLowerCase())));
  const missing = (entry.linkEntities || []).filter((e) => ![...known].some((k) => e.toLowerCase().includes(k) || k.includes(e.toLowerCase())));
  return { missing, have: (entry.linkEntities || []).filter((e) => !missing.includes(e)) };
}

function systemPrompt(voice, critique) {
  return [
    "You write entries for the Academy, an interdisciplinary explainer series about how India's economy and society actually work. The model is Quanta Magazine's spirit applied to India: rigorous, data-rich, carefully reported, and interdisciplinary, but rooted in lived Indian reality, not the abstract economics seminar. Economics is the spine, not the whole body. An entry may reach into history, geography, sociology, institutions and politics.",
    "Return ONLY valid JSON matching the schema given in the user message. No markdown fences, no commentary.",
    "",
    "NUMBER & FACT DISCIPLINE IS ABSOLUTE. Every number, rate, share, rupee figure, ranking, and date-as-a-fact in your prose must come from the provided lockedNumbers or contextCards. Never invent, estimate, or recall a number from memory. When a locked number has displayValue, use that string verbatim. Cross-disciplinary facts (history, named people, studies, dates) may ONLY come from the provided contextCards. You may NOT introduce any other named person, study, institution, or date-as-fact from your own knowledge. Uncontested textbook FRAMING (the mechanism behind a pattern, a concept the reader needs) is allowed only if it adds no new specific number, date, name, or study.",
    "",
    "VOICE BIBLE (follow every rule; violations are defects):",
    voice,
    "",
    "Two extra hard rules: never use em-dashes (use a comma, period, or rephrase). Never use the 'not just X, it is Y' construction.",
    "",
    "The audience is everyone at once: a sharp sixteen-year-old in a small town with no economics must follow every sentence, while a domain expert finds nothing dumbed-down or wrong. Ground every abstraction in something an Indian reader can see (a shopkeeper, a field, a payslip, a bus queue) the instant it appears. Define each term the moment you use it. One idea per sentence.",
    "Reach into at least one discipline beyond economics using a contextCard, where it genuinely deepens understanding. Do not name-drop; weave the fact in so it earns its place.",
    "Hold a clear view and name the honest caveat. Never hedge into balanced mush.",
    "QUESTION-LED STRUCTURE: write the body as a sequence of '## ' H2 headings, each a real question a reader would ask as they try to understand the concept (the brief gives a sectionArc; follow its arc but phrase headings in your own natural reader-question voice). Each section must genuinely ANSWER its heading, not just describe. Lead a section with a concrete image or scene when it earns its place.",
    "DEPTH BAR (flagship entries): a flagship is NOT a tidy textbook definition. It is built around the brief's stated TENSION (the human stakes, the surprise, the live argument) and must keep returning to it. Cover the brief's full sectionArc; each section runs roughly 200-320 words and answers its question with a mechanism, a real Indian example, and a stake, not just a definition. Target 1500-2000 words. If your draft is under ~1300 words it is TOO THIN: go deeper using the context cards and locked numbers (more mechanism, the debate, a concrete episode, the consequence for ordinary people), never by padding or repeating. Depth comes from real material, not filler.",
    "PULL QUOTES: supply 1-3 short, punchy pull quotes in the pullQuotes array, each a line that distils a real point and is supported by the evidence (never an invented number, never an editorial aphorism). Set afterHeading to the H2 it should sit beside.",
    "TABLES: whenever you walk through a calculation or a breakdown of locked figures, present it as a markdown table inside the body, not only as a sentence. Header row, then a '| --- |' separator row, then data rows; the result/total on the last row. Every figure must be a locked number's displayValue. This is what makes the page a reference, not a text dump.",
    "VISUALS: if the entry has a composition (parts that sum to roughly 100%, like sector shares of GVA), emit ONE stacked-bar visual in the visuals array. Each segment value MUST equal a locked share number exactly; never invent or recompute a share. Set afterHeading to the exact text of the H2 it sits under. Do not emit a visual when there is no genuine composition.",
    "LINK ENTITIES: in linkEntities, list the proper names of notable people, events, institutions, laws, or cited reports you actually mention (for example Simon Kuznets, the Great Depression, GST, the Peterson Institute for International Economics). Names only, never URLs. The site resolves and verifies links from a curated map and silently skips any it does not have.",
    "CONTROVERSY / CRITICISM (the moat): when the brief includes a debate (e.g. whether GDP is mis-measured), present ALL sides fairly, attribute each claim to who made it, cite the source, and DO NOT pick a political winner. State the critique, state the rebuttal, state what was subsequently done. A reader on either side must feel the data was handled honestly. The figures in such a section come only from the relevant context cards.",
    "GDP guard: GDP is a measure of production/output, not the country's income and not money people receive. Do not call GDP 'income' or 'earnings'. You may use per-capita GDP as 'if you split output equally', but never imply it is a salary anyone is paid. The macha (onTheGround) block must never contradict the body's teaching.",
    "Macha (onTheGround) language: write it in English with light Indian-English flavor. The heading may be cheeky Hinglish; the body stays English with at most an occasional Hindi word a non-Hindi reader still follows. Never write the macha body as a full romanized-Hindi paragraph.",
    "ACCOUNTING-IDENTITY DISCIPLINE: some locked numbers relate by definitional identities (GDP = NDP + depreciation; GDP = GVA + net product taxes; GNI = GDP minus net income paid abroad). If a DATA INTEGRITY WARNING says specific numbers do not tie (usually a different-year vintage), do NOT present them as an exact subtraction or sum. Use the same-vintage figure provided in the locked numbers (its label says 'same vintage') and keep figures from the same year together. Never compute an identity yourself from numbers of different dates.",
    "",
    "THE CRITIQUE LOOP you will be held to (internalise it while drafting):",
    critique
  ].join("\n");
}

const SCHEMA_HINT = {
  schemaVersion: "academy-2",
  slug: "string",
  title: "string (the reader-question)",
  track: "string",
  standfirst: "one-line dek under the title",
  bottomLine: "the one-sentence answer, always visible, plain and precise",
  body: "markdown explainer, QUESTION-LED. Write one '## ' H2 heading per beat, each phrased as a real reader question (the brief's sectionArc is your guide; rephrase into natural reader-questions, do not copy verbatim). Each section ANSWERS its heading in plain, grounded prose. Use '- ' bullets where you are genuinely listing parallel items. When you present a CALCULATION or a breakdown of locked figures (how GVA builds to GDP, the expenditure split, GDP vs NDP vs GNI, a before/after), render it as a MARKDOWN TABLE (a header row, a '| --- |' separator row, then data rows), not only as a sentence. Every number in a table must be a locked number's displayValue, with the result/total row last. For a flagship entry aim ~1500-2200 words; for a card ~300-600 and 2-4 sections are fine.",
  pullQuotes: [{ quote: "a short, punchy line lifted from or distilling the argument, supported by the evidence (no invented numbers)", afterHeading: "the exact text of the H2 heading this quote should appear after (omit to append at the end)" }],
  visuals: [{ type: "stacked-bar", title: "string", subtitle: "string", afterHeading: "exact H2 heading text this sits under", segments: [{ label: "string", value: "NUMBER that must equal a locked share (e.g. a 'share of GVA' figure); never invent or recompute a share" }], source: "plain source name" }],
  linkEntities: ["proper names of notable people, events, institutions, laws, or cited reports you mention that deserve an external link (e.g. Simon Kuznets, the Great Depression, GST). NAMES ONLY, never URLs. The site resolves links from a vetted map and skips any it cannot verify."],
  keyTerms: [{ term: "string", plainMeaning: "everyday analogy first, then a plain definition, then what it does NOT mean" }],
  onTheGround: { heading: "playful, cheeky Indian-English heading", body: "warm, grounded, plain 'tell me what this means, bro' summary of the whole entry. English with light flavor. Never snarky or jargon-filled." },
  whatPeopleGetWrong: "the single most common misreading, named and corrected",
  caveat: "the honest limit of what this entry's number/idea can tell you",
  connects: ["adjacent-slug"],
  sources: ["plain source names, including any cited report or paper used via a context card"],
  lockedNumbersUsed: ["exact labels of locked numbers you cited"],
  contextCardsUsed: ["short identifier of each context card you used"],
  status: "ready | needs_data"
};

function draftUserPrompt({ brief, lockedNumbers, caveats, sourceSummaries, dataWarnings }) {
  return [
    "Write the academy entry described by this brief.",
    "",
    "BRIEF:",
    JSON.stringify(brief, null, 2),
    "",
    "DATA INTEGRITY WARNINGS (critical: respect these or the entry will contradict itself):",
    JSON.stringify(dataWarnings || [], null, 2),
    "",
    "LOCKED NUMBERS (the ONLY numbers you may state; use displayValue verbatim):",
    JSON.stringify(lockedNumbers, null, 2),
    "",
    "CONTEXT CARDS are inside the brief (contextCards) — the ONLY source of cross-disciplinary facts, names, dates, studies.",
    "",
    "EVIDENCE CAVEATS (weave the relevant ones in honestly, do not dump):",
    JSON.stringify(caveats || [], null, 2),
    "",
    "SOURCE SUMMARIES (for naming sources plainly):",
    JSON.stringify((sourceSummaries || []).slice(0, 12), null, 2),
    "",
    "Return ONLY a JSON object with exactly these keys (values per the hints):",
    JSON.stringify(SCHEMA_HINT, null, 2)
  ].join("\n");
}

function critiqueUserPrompt({ draft, lint, derived, brief }) {
  return [
    "Here is a draft academy entry you wrote:",
    JSON.stringify(draft, null, 2),
    "",
    "An automated prose linter flagged these AI-writing / discipline tells (each is a defect to fix):",
    JSON.stringify(lint.findings.map((f) => ({ rule: f.rule, severity: f.severity, match: f.match, hint: f.hint })), null, 2),
    "",
    "DERIVED-NUMBER CHECK. These multiplier/ratio phrases were detected in your draft. For EACH one, either (a) confirm it exactly matches a comparison stated in the locked numbers and keep it, or (b) remove it. You may NOT compute a ratio, fold-change, or 'N times' from the raw numbers yourself, even if the inputs are locked. If in doubt, cut it.",
    JSON.stringify((derived || []).map((f) => f.match), null, 2),
    "",
    "Now run the critique loop on your own draft, honestly and harshly, then rewrite it better.",
    "Answer each question briefly, then produce an improved entry that fixes everything you found.",
    "Questions: (1) What is wrong? any number/date/name not in the evidence, any false cause, any factual slip. (2) What is missing? the unanswered 'but', a discipline that would have deepened it. (3) What can we add from the locked numbers or contextCards, without padding? (4) How can it be more relevant to a normal person with no economics? where is an abstraction not yet cashed out in something they can see? (5) Does it still sound like AI? fix every linter tell and any uneven-less rhythm. (6) How can it be better, full stop? sharpen the open and close, cut what is not working.",
    "",
    "Keep the SAME output schema as the draft, with one added top-level key:",
    JSON.stringify({ selfCritique: { wrong: "...", missing: "...", toAdd: "...", relevance: "...", aiSmell: "...", betterHow: "..." } }, null, 2),
    "",
    "Number & fact discipline still absolute: no new numbers, dates, names, or studies beyond the locked numbers and the brief's contextCards. Return ONLY the JSON object."
  ].join("\n");
}

async function main() {
  const slug = arg("slug");
  if (!slug) throw new Error("Pass --slug=<entry-slug>");
  const model = arg("model", "deepseek-v4-pro");

  const brief = await readJson(resolve(ROOT, "docs/academy/briefs", `${slug}.json`));
  const evidence = await readJson(resolve(ROOT, "data/explanations/en", `${brief.evidenceSource}.evidence.json`));
  const voice = await readFile(resolve(ROOT, "docs/academy/VOICE.md"), "utf8");
  const critique = await readFile(resolve(ROOT, "docs/academy/critique-loop.md"), "utf8");

  const lockedNumbers = evidence.lockedNumbers || [];
  const integrity = checkIdentities(lockedNumbers);
  if (integrity.warnings.length) {
    console.log(`[academy] DATA INTEGRITY (${integrity.warnings.length}):`);
    integrity.warnings.forEach((w) => console.log(`  ! ${w}`));
    if (integrity.derived.length) console.log(`  + injected same-vintage figures: ${integrity.derived.map((d) => d.displayValue).join(", ")}`);
  }
  const lockedForModel = [...lockedNumbers, ...integrity.derived];
  const sys = systemPrompt(voice, critique);
  const dp = () => draftUserPrompt({ brief, lockedNumbers: lockedForModel, caveats: evidence.caveats, sourceSummaries: evidence.sourceSummaries, dataWarnings: integrity.warnings });
  // Flagship entries run ~1500-2200 words across many sections, so they need a far
  // bigger token ceiling than the short cards.
  const maxTokens = brief.depth === "flagship" ? 20000 : 9000;

  console.log(`[academy] ${slug}: drafting with ${model} (${lockedForModel.length} locked numbers, depth=${brief.depth || "card"}, maxTokens=${maxTokens})...`);
  const draftRes = await createDeepSeekJsonCompletion({
    model,
    maxTokens,
    temperature: 0.45,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: dp() }
    ]
  });
  const draft = draftRes.json;

  const lint = lintReport(draft.bottomLine, draft.body, draft.standfirst, draft.onTheGround?.body, draft.whatPeopleGetWrong, draft.caveat);
  console.log(`[academy] draft lint: ${lint.errors.length} errors, ${lint.warns.length} warns`);

  console.log(`[academy] ${slug}: self-critique + revise...`);
  const revRes = await createDeepSeekJsonCompletion({
    model,
    maxTokens,
    temperature: 0.3,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: dp() },
      { role: "assistant", content: JSON.stringify(draft) },
      { role: "user", content: critiqueUserPrompt({ draft, lint, derived: derivedReport(...fieldsOf(draft)), brief }) }
    ]
  });
  let cleaned = revRes.json;

  // Hard gate: do NOT trust the model's self-report. Loop until the prose is
  // actually clean (zero lint errors AND zero em-dash characters anywhere), or we
  // give up after a few focused edit passes.
  for (let round = 1; round <= 3; round += 1) {
    const issues = hardIssues(cleaned);
    if (!issues.blocked) break;
    console.log(`[academy] clean-up round ${round}: ${issues.lint.errors.length} lint errors, em-dash=${issues.emdash}`);
    const res = await createDeepSeekJsonCompletion({
      model,
      maxTokens,
      temperature: 0,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: [
          "Fix ONLY the listed defects in this academy entry. Return the SAME JSON object, unchanged except for those fixes. Do not rewrite content, do not add or remove ideas, do not change any number, keep the selfCritique key.",
          "Defect 1: remove EVERY em-dash character (—). Replace each with a comma, or a period and a capital letter, or rephrase. None may remain in any field.",
          "Defect 2: fix each linter finding below.",
          "",
          "ENTRY:",
          JSON.stringify(cleaned),
          "",
          "LINTER FINDINGS:",
          JSON.stringify(issues.lint.findings),
          issues.emdash ? "\nEm-dash characters are still present in the entry and every one must be removed." : ""
        ].join("\n") }
      ]
    });
    cleaned = res.json;
  }

  const finalLint = lintReport(...fieldsOf(cleaned));
  const finalDerived = derivedReport(...fieldsOf(cleaned));
  const figureWarnings = checkRichFigures(cleaned, lockedForModel);
  const linkCheck = checkLinkEntities(cleaned, resolve(ROOT, "data/academy/links.json"));
  const wordCount = String(cleaned.body || "").split(/\s+/).filter(Boolean).length;
  const thin = brief.depth === "flagship" && wordCount < 1300;
  if (thin) console.log(`[academy]   THIN: flagship body is ${wordCount} words (target ~1500-2000). Deepen the brief (tension, more sectionArc beats, more context cards) and regenerate.`);
  const stillBlocked = hardIssues(cleaned).blocked;
  console.log(`[academy] final: ${finalLint.errors.length} lint errors, ${finalLint.warns.length} warns, ${finalDerived.length} derived-number claims, ${wordCount} words, clean=${!stillBlocked}`);
  if (finalDerived.length) console.log(`[academy]   verify derived: ${finalDerived.map((f) => f.match).join(", ")}`);
  if (figureWarnings.length) { console.log(`[academy]   table/visual figures to verify (${figureWarnings.length}):`); figureWarnings.forEach((w) => console.log(`     ! ${w}`)); }
  if (linkCheck.missing.length) console.log(`[academy]   link entities NOT in vetted map (add verified URLs to links.json to render): ${linkCheck.missing.join(", ")}`);
  if ((cleaned.visuals || []).length) console.log(`[academy]   visuals: ${cleaned.visuals.map((v) => v.type).join(", ")}`);

  const outDir = resolve(ROOT, "docs/academy/drafts");
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, `${slug}.draft.json`), JSON.stringify({ ...draft, _lint: lint.findings }, null, 2));
  await writeFile(resolve(outDir, `${slug}.final.json`), JSON.stringify({ ...cleaned, _lint: finalLint.findings, _derived: finalDerived, _figureWarnings: figureWarnings, _linkEntitiesMissing: linkCheck.missing, _clean: !stillBlocked }, null, 2));
  await writeFile(resolve(outDir, `${slug}.md`), renderMd(cleaned, finalLint, finalDerived));
  console.log(`[academy] wrote docs/academy/drafts/${slug}.{draft,final}.json + ${slug}.md`);
}

function renderMd(e, lint, derived = []) {
  const terms = (e.keyTerms || []).map((t) => `- **${t.term}** — ${t.plainMeaning}`).join("\n");
  const sc = e.selfCritique || {};
  return [
    `# ${e.title}`,
    `*${e.standfirst || ""}*`,
    ``,
    `**Bottom line.** ${e.bottomLine || ""}`,
    ``,
    e.body || "",
    ``,
    `### Key terms`,
    terms || "_none_",
    ``,
    `### ${e.onTheGround?.heading || "On the ground"}`,
    e.onTheGround?.body || "",
    ``,
    `### What people get wrong`,
    e.whatPeopleGetWrong || "",
    ``,
    `### Caveat`,
    e.caveat || "",
    ``,
    `---`,
    `**Connects:** ${(e.connects || []).join(", ")}`,
    `**Sources:** ${(e.sources || []).join("; ")}`,
    `**Locked numbers used:** ${(e.lockedNumbersUsed || []).join("; ")}`,
    `**Context cards used:** ${(e.contextCardsUsed || []).join("; ")}`,
    `**Status:** ${e.status || "?"}`,
    ``,
    `### Self-critique`,
    `- **Wrong:** ${sc.wrong || ""}`,
    `- **Missing:** ${sc.missing || ""}`,
    `- **To add:** ${sc.toAdd || ""}`,
    `- **Relevance:** ${sc.relevance || ""}`,
    `- **AI smell:** ${sc.aiSmell || ""}`,
    `- **Better how:** ${sc.betterHow || ""}`,
    ``,
    `### Linter (final)`,
    lint.findings.length ? lint.findings.map((f) => `- [${f.severity}] ${f.rule}: "${f.match}"`).join("\n") : "_clean_",
    ``,
    `### Derived-number claims to verify (human)`,
    derived.length ? derived.map((f) => `- "${f.match}" ${f.hint}`).join("\n") : "_none detected_"
  ].join("\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
