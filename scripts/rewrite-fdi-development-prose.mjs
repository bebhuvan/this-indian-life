// Rewrite the FDI-and-development body from scratch, section by section, with Gemini Flash.
//
// Run 1 produced fluff: 15 sentences whose only job was telling the reader what to look at,
// against 2 in the hand-written draft it was meant to beat. Two causes, both mine.
//   1. It was handed three summary statistics per chart and a title. With nothing substantive
//      in front of it, it narrated the axis. This version hands it the FULL series, every
//      observation, so it can find its own story.
//   2. It was told to name the parameter, period and source in the prose. That was right
//      before the charts had subtitles and wrong after, because the subtitle now does that
//      job. That instruction is gone, and narrating the measure is now banned outright.
// Sections are generated independently, so each is also told which terms earlier sections
// have already defined. Run 1 defined gross fixed capital formation three times.
//
// Output is gated by scripts/verify-fdi-prose-numbers.mjs, which fails on an unsupported
// number, a banned construction, meta-commentary, a vague quantifier, or more than 30% of
// sentences carrying neither a figure nor a name.
//
// Run: node scripts/rewrite-fdi-development-prose.mjs [--only=3,4] [--model=gemini-3.8-flash]

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const run = promisify(execFile);
const QID = "q.econ.fdi_development";
const OUT = "data/prose/sections/q.econ.fdi_development";
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const MODEL = args.model || "gemini-3.8-flash";
const ONLY = args.only ? new Set(args.only.split(",").map(Number)) : null;

const brief = JSON.parse(readFileSync(`data/briefs/${QID}.json`, "utf8"));
const evidence = JSON.parse(readFileSync(`data/explanations/en/${QID}.evidence.json`, "utf8"));
const voice = readFileSync("docs/academy/VOICE.md", "utf8");
const question = v1Questions.find((q) => q.id === QID);
const plan = question.visualPlan;
const sections = brief.requiredSections;

const byId = new Map();
for (const f of readdirSync("data/series")) {
  if (!f.endsWith(".json")) continue;
  let a; try { a = JSON.parse(readFileSync(`data/series/${f}`, "utf8")); } catch { continue; }
  if (a.indicatorId && !byId.has(a.indicatorId)) byId.set(a.indicatorId, a);
}

// The whole series, not a summary of it. This is the change that matters.
function dataTable(visual) {
  const entries = (visual.series || [{ indicator: visual.indicator }]);
  const out = [];
  for (const s of entries) {
    const id = typeof s === "string" ? s : s.indicator;
    const label = typeof s === "object" && s.label ? s.label : null;
    const a = byId.get(id);
    if (!a) { out.push(`  ${id}: ARTIFACT MISSING`); continue; }
    out.push(`\n  ${label ? `"${label}" — ` : ""}${a.title}`);
    out.push(`  unit: ${a.unit} | source: ${a.sourceId}`);
    for (const k of ["definition", "method", "caveat", "note", "vintage", "dataset"]) {
      if (a.metadata?.[k]) out.push(`  ${k}: ${a.metadata[k]}`);
    }
    if (a.observations?.length) {
      out.push("  every observation:");
      out.push("    " + a.observations.map((o) => `${o.date.slice(0, 7)}=${o.value}`).join("  "));
    } else if (a.rows?.length) {
      out.push("  every row:");
      for (const r of a.rows) out.push(`    ${JSON.stringify(r)}`);
    }
  }
  return out.join("\n");
}

const TERMS = [
  [0, "gross fixed capital formation", "Section 1 defines it. Later sections must use the term bare."],
  [0, "the UNCTAD net balance-of-payments measure vs DPIIT gross equity", "Section 1 explains the difference. Do not re-explain it."],
  [1, "FDI as a share of GDP, the World Bank series from 1970", "Section 2 introduces it."],
  [10, "announced greenfield projects are intentions, not money that moved", "Section 11 explains it. Section 13 may refer back in a clause."]
];

const RULES = `
HARD RULES. A draft breaking any of these is discarded.

NUMBERS
1. Use only figures from the DATA below, the LOCKED NUMBERS, or the LOCKED CONCEPTS. Do not
   compute new ratios. Every numeral you write is checked against that packet.
2. You have the complete series. Pick the years that carry the argument. Do not list a series
   year by year, and do not settle for first/last/peak if a better year makes the point.

FLUFF, which sank the previous attempt
3. NEVER narrate the measure. The chart sits under your section with a subtitle already
   naming the parameter, period and source. Sentences like these are banned outright:
     "To understand whether foreign money built the country, one must look at the share..."
     "To see the long view, one has to look at FDI as a share of GDP."
     "This shifts the denominator to the entire size of the economy."
     "But these comparisons require an immediate look at the denominator."
     "On this measure, foreign money has never built India."
     "In dollar terms, the inflows for 2025 stood at..."
     "From that trough, the trajectory shifted."
   Do not tell the reader what to look at, what the chart measures, what you are about to do,
   or what the previous sentence meant. Report the finding and move.
4. EVERY SENTENCE EARNS ITS PLACE. It carries a figure, a named actor, a mechanism, or a
   limit on what the data can show. If a sentence does none of those, delete it. Fewer than
   three in ten of your sentences may lack both a figure and a proper noun.
5. NO VAGUE QUANTIFIER WHERE A NUMBER EXISTS. Banned: significant, substantial, modest, vast,
   dramatic, a trickle, tens of billions, a hair behind, far more. You have the data. Use it.
6. Do not restate your opening line at the end of the section.

STYLE
7. NO EM-DASHES. Not one.
8. Third person. Never "we", "our", "us", "I".
9. Do not rank the sources. UNCTAD net and DPIIT gross measure different things; neither is
   better, more rigorous or more honest.
10. No invented colour. No headlines, ministers, factory floors or press reaction unless the
    packet contains it.
11. British spelling. "$38.9 billion", never "$38.9bn".
12. Open with a direct answer to the heading in one short line, then earn it.
13. Output ONLY the markdown for this section, starting with the exact H2. No code fences.
`.trim();

mkdirSync(OUT, { recursive: true });

for (let i = 0; i < sections.length; i++) {
  const n = i + 1;
  if (ONLY && !ONLY.has(n)) continue;
  const heading = sections[i];
  const visual = i < plan.length ? plan[i] : null;
  const already = TERMS.filter(([at]) => at < i).map(([, term, note]) => `  - ${term}: ${note}`).join("\n");

  const chartBlock = visual
    ? `The chart under this section is titled "${visual.title}"\nIts subtitle, already written, reads: "${visual.subtitle}"\nSo the reader is ALREADY told what is plotted. Do not repeat it.\n\nCOMPLETE DATA BEHIND THIS CHART:${dataTable(visual)}`
    : "This section has NO chart. It is the closing methodology and caveats section. Draw on the caveats and source notes below.";

  const locked = visual
    ? evidence.lockedNumbers.filter((l) => (visual.series || [{ indicator: visual.indicator }])
        .map((s) => (typeof s === "string" ? s : s.indicator)).includes(l.indicatorId))
    : evidence.lockedNumbers;

  const prompt = `You are writing ONE section of a data-journalism article for Indica, an Indian
data-journalism site. Article: "${question.question}"

${voice}

============ PURPOSE ============
${brief.purpose}

============ TENSION ============
${brief.tension}

============ LOCKED CONCEPTS (facts and honesty rules for the whole article) ============
${brief.requiredConcepts.map((c, k) => `${k + 1}. ${c}`).join("\n\n")}

============ STYLE TARGET ============
${brief.styleExample}

============ ALL SECTIONS (write only the one marked) ============
${sections.map((s, k) => `${k + 1}. ${s}${k === i ? "   <<< WRITE THIS ONE" : ""}`).join("\n")}

${already ? `============ ALREADY DEFINED EARLIER, DO NOT RE-EXPLAIN ============\n${already}\n` : ""}
============ THIS SECTION ============
## ${heading}

${chartBlock}

============ LOCKED NUMBERS ============
${locked.map((l) => `  - ${l.label}: ${l.displayValue} ${l.unit}${l.date ? ` (${l.date})` : ""}`).join("\n") || "  (none specific to this chart)"}

============ ARTICLE-LEVEL CAVEATS AND FORBIDDEN CLAIMS ============
${(evidence.caveats || []).map((c) => `  - ${c}`).join("\n")}
${(evidence.forbiddenClaims || []).map((c) => `  - FORBIDDEN: ${c}`).join("\n")}

${RULES}

Length: ${visual ? "200 to 340 words" : "300 to 460 words"}. Write it now.`;

  writeFileSync(`${OUT}/${String(n).padStart(2, "0")}.prompt.txt`, prompt);
  process.stdout.write(`[${n}/${sections.length}] ${heading.slice(0, 46)} ... `);
  try {
    const { stdout } = await run("gemini", ["--skip-trust", "--approval-mode", "plan", "-m", MODEL, "-p", prompt],
      { maxBuffer: 40 * 1024 * 1024, timeout: 600000, cwd: "/tmp" });
    let text = stdout.replace(/^.*?(?=^## )/s, "").trim();
    if (!text.startsWith("## ")) text = `## ${heading}\n\n${stdout.trim()}`;
    text = text.replace(/^```(?:markdown)?\s*/gm, "").replace(/```\s*$/gm, "").trim();
    writeFileSync(`${OUT}/${String(n).padStart(2, "0")}.md`, text + "\n");
    console.log(`${text.split(/\s+/).length} words`);
  } catch (e) {
    console.log(`FAILED: ${String(e.message).slice(0, 110)}`);
  }
}
console.log(`\nSections written to ${OUT}/`);
