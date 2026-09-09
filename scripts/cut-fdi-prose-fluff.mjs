// Subtractive fluff edit for the FDI-and-development body.
//
// A from-scratch regeneration fixed the padding but broke the reasoning: it read FDI stock
// as a share of GDP as if it were a share of ASSETS, and decomposed recorded inflows using
// the M&A line, which the article's own caveat forbids. The analysis in the live prose is
// correct and hard-won, so this edits rather than rewrites: sentences may be DELETED, not
// reworded, and any edit that drops a figure, a link or a caveat is rejected and re-run with
// the dropped lines quoted back as must-keep.
//
// Run: node scripts/cut-fdi-prose-fluff.mjs [--only=3] [--model=gemini-3.8-flash]

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const run = promisify(execFile);
const QID = "q.econ.fdi_development";
const OUT = `data/prose/cut/${QID}`;
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const MODEL = args.model || "gemini-3.8-flash";
const ONLY = args.only ? new Set(args.only.split(",").map(Number)) : null;

const body = JSON.parse(readFileSync(`data/explanations/en/${QID}.json`, "utf8")).article.bodyMarkdown;
const parts = body.split(/\n(?=## )/);

// Verified figures the regeneration surfaced that the live prose never used. Offered, not
// required; every number is checked against the locked packet by the verifier regardless.
const EXTRA = {
  1: ["FDI first exceeded 1 per cent of India's capital formation in 1994, at 1.27 per cent",
      "it crossed 5 per cent in 2006", "it was 6.79 per cent in 2015",
      "4.64 per cent in 2010, 4.49 per cent in 2021 and 2.18 per cent in 2024"],
  2: ["in 2025 India was at 0.99 per cent of GDP against 1.27 per cent for East Asia and Pacific and 2.68 per cent for Latin America and the Caribbean",
      "India's FDI peaked at 3.62 per cent of GDP in 2008"]
};

const CAVEAT = /\b(cannot|can not|does not|do not|not a |is not |are not |rather than|caveat|careful|carefully|rough|approximate|preliminary|revis|settles none|should be read|do not subtract|deliberately|unknown|guess|inference|not proof|not comparable|only|limit)\b/i;
const sentencesOf = (t) => t.replace(/^## .*$/m, "").split(/\n/).flatMap((p) => p.trim().split(/(?<=[.?!])\s+/)).map((s) => s.trim()).filter(Boolean);
const numbersOf = (t) => (t.match(/\d[\d,.]*/g) || []);
const linksOf = (t) => (t.match(/\]\(([^)]*)\)/g) || []);

const RULES = `
You are cutting fluff from one section of a published data-journalism article.
This is a SUBTRACTIVE edit. Delete whole sentences. Do not reword, do not smooth, do not
merge, do not add transitions, do not improve phrasing.

DELETE:
- Any sentence whose job is telling the reader what to look at, what the chart measures, what
  you are about to do, or what the previous sentence meant.
- Any sentence that restates the sentence before it, or restates the section's opening line.
- Throat-clearing: "That is the article, and it is worth putting down...", "Read X carefully,
  because...", "India's line has a clear shape.", "It is worth noting...".

KEEP, EXACTLY AS WRITTEN, every one of these. They are load-bearing:
- Every number, date, unit, currency figure, proper noun and source name.
- Every caveat, limit, hedge, and statement about what the data cannot show or must not be
  used for. KEEP THESE EVEN WHEN THEY CARRY NO NUMBER. They are the most important sentences
  in the piece and the reason it can be trusted.
- Every markdown link, character for character, including any trailing slash.
- The H2 heading, verbatim.

The only rewriting permitted is repairing a connective left dangling by a deletion
("But", "That", "This", "Even so") so the paragraph still reads.

No em-dashes. Third person. Output only the edited markdown, no commentary, no code fences.
`.trim();

mkdirSync(OUT, { recursive: true });
let cutTotal = 0, keptOriginal = 0;

for (let i = 0; i < parts.length; i++) {
  const n = i + 1;
  if (ONLY && !ONLY.has(n)) continue;
  const original = parts[i];
  const origNums = numbersOf(original), origLinks = linksOf(original);
  const origCaveats = sentencesOf(original).filter((s) => CAVEAT.test(s));
  let mustKeep = "";
  let accepted = null;

  for (let attempt = 1; attempt <= 3 && !accepted; attempt++) {
    const extra = EXTRA[i] ? `\nYou MAY add any of these verified figures if one fits a sentence that already exists, but adding nothing is a valid outcome:\n${EXTRA[i].map((e) => `  - ${e}`).join("\n")}\n` : "";
    const prompt = `${RULES}${extra}${mustKeep}\n\n============ SECTION ============\n${original}`;
    let out;
    try {
      const { stdout } = await run("gemini", ["--skip-trust", "--approval-mode", "plan", "-m", MODEL, "-p", prompt],
        { maxBuffer: 20 * 1024 * 1024, timeout: 600000, cwd: "/tmp" });
      out = stdout.replace(/^.*?(?=^## )/s, "").replace(/^```(?:markdown)?\s*/gm, "").replace(/```\s*$/gm, "").trim();
    } catch (e) { console.log(`  [${n}] attempt ${attempt} call failed: ${String(e.message).slice(0, 80)}`); continue; }
    if (!out.startsWith("## ")) { console.log(`  [${n}] attempt ${attempt} lost the heading`); continue; }

    const gotNums = numbersOf(out), gotLinks = linksOf(out);
    const lostNums = origNums.filter((x) => !gotNums.includes(x));
    const lostLinks = origLinks.filter((x) => !gotLinks.includes(x));
    const gotSents = sentencesOf(out);
    const lostCaveats = origCaveats.filter((c) => !gotSents.some((s) => s === c || s.includes(c.slice(0, 40))));

    if (!lostNums.length && !lostLinks.length && !lostCaveats.length) { accepted = out; break; }
    console.log(`  [${n}] attempt ${attempt} rejected: ${lostNums.length} numbers, ${lostLinks.length} links, ${lostCaveats.length} caveats lost`);
    mustKeep = `\n\n============ YOU DROPPED THESE. THEY MUST SURVIVE VERBATIM ============\n` +
      [...lostCaveats, ...lostLinks.map((l) => `link ${l}`)].map((s) => `  - ${s}`).join("\n") +
      (lostNums.length ? `\n  - these figures must all still appear: ${[...new Set(lostNums)].join(", ")}` : "");
  }

  const final = accepted || original;
  if (!accepted) { keptOriginal++; console.log(`  [${n}] KEPT ORIGINAL after 3 attempts`); }
  else cutTotal += original.split(/\s+/).length - final.split(/\s+/).length;
  writeFileSync(`${OUT}/${String(n).padStart(2, "0")}.md`, final.trim() + "\n");
  console.log(`[${n}/${parts.length}] ${original.split(/\s+/).length} -> ${final.split(/\s+/).length} words${accepted ? "" : "  (unchanged)"}`);
}
console.log(`\ncut ${cutTotal} words; ${keptOriginal} section(s) left unchanged. -> ${OUT}/`);
