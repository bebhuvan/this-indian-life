// Gate for the rewritten FDI body: every figure in the prose must trace to the locked packet,
// and the draft must survive the VOICE.md banned lists.
//
// Exits non-zero on any unsupported number so a rewrite cannot be published on trust.
// Run: node scripts/verify-fdi-prose-numbers.mjs [path-to-body.md]

import { readFileSync, readdirSync, existsSync } from "node:fs";

const QID = "q.econ.fdi_development";
const target = process.argv[2] || `data/prose/${QID}.rewrite.md`;
const body = readFileSync(target, "utf8");
const evidence = JSON.parse(readFileSync(`data/explanations/en/${QID}.evidence.json`, "utf8"));
const brief = JSON.parse(readFileSync(`data/briefs/${QID}.json`, "utf8"));

// ---------------------------------------------------------------- allowed numbers
const allowed = new Set();
const add = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return;
  const n = Number(v);
  allowed.add(n);
  // The prose is allowed to round a locked value the way a human would.
  allowed.add(Math.round(n));
  allowed.add(Number(n.toFixed(1)));
  allowed.add(Number(n.toFixed(2)));
  if (Math.abs(n) >= 1000) allowed.add(Number((n / 1000).toFixed(1)));
  if (Math.abs(n) >= 1000) allowed.add(Number((n / 1000).toFixed(2)));
  if (Math.abs(n) >= 1000) allowed.add(Math.round(n / 1000));
  if (Math.abs(n) >= 1e6) allowed.add(Number((n / 1e6).toFixed(1)));
};
for (const l of evidence.lockedNumbers) { add(l.value); add(parseFloat(String(l.displayValue).replace(/[^0-9.\-]/g, ""))); }
// Every number written into the brief is editor-approved by construction.
const briefText = JSON.stringify(brief);
for (const m of briefText.matchAll(/-?\d+(?:\.\d+)?/g)) add(m[0]);
// Years and ranks that appear in the series artifacts.
for (const f of readdirSync("data/series")) {
  if (!f.endsWith(".json")) continue;
  let a; try { a = JSON.parse(readFileSync(`data/series/${f}`, "utf8")); } catch { continue; }
  if (!a.indicatorId || !String(a.indicatorId).startsWith("extfin.fdi.dev")) continue;
  for (const o of a.observations || []) { add(o.value); add(Number(String(o.date).slice(0, 4))); }
  for (const r of a.rows || []) for (const v of Object.values(r)) add(v);
  // The generator hands each section its artifact's definition/method/caveat text, so any
  // number stated there (e.g. "among the 170-203 economies reporting") is editor-approved.
  for (const m of JSON.stringify(a.metadata || {}).matchAll(/-?\d+(?:\.\d+)?/g)) add(m[0]);
}
for (let y = 1970; y <= 2027; y++) allowed.add(y);

// ---------------------------------------------------------------- extract & check
const prose = body.replace(/^## .*$/gm, "");            // headings carry no claims
const found = [];
for (const m of prose.matchAll(/(?<![\w.])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?![\w])/g)) {
  const raw = m[1];
  const n = Number(raw.replace(/,/g, ""));
  const ctx = prose.slice(Math.max(0, m.index - 55), m.index + raw.length + 45).replace(/\s+/g, " ");
  found.push({ raw, n, ctx });
}
const near = (n) => [...allowed].some((a) => Math.abs(a - n) < 1e-9 || (a !== 0 && Math.abs((a - n) / a) < 0.005));
const bad = found.filter((f) => !near(f.n));

// ---------------------------------------------------------------- voice checks
const HARD_BANNED = ["delve","dive in","deep dive","unpack","navigating the complexit","landscape","realm","the world of","tapestry","intricate","testament","showcase","underscore","underpin","leverage","utilize","harness","foster","facilitate","streamline","robust","holistic","seamless","scalable","vibrant","bustling","myriad","plethora","a host of","a wealth of","boasts","boasting","nestled","ever-evolving","fast-paced","game-chang","cutting-edge","state-of-the-art","elevate","empower","unlock","unleash","supercharge","revolutionize","treasure trove","paints a picture","speaks volumes","shed light on","a stark reminder","needless to say","the rise of","the dawn of","lies at the heart of","at its core","resonate","double-edged sword","the perfect blend of","stands as","serves as","plays a crucial role","in the grand scheme"];
const SHAPES = [/\bit'?s not just .*,? it'?s\b/i, /\bhere'?s the (thing|kicker)\b/i, /\bin conclusion\b/i, /\bat the end of the day\b/i, /\bthe bottom line is\b/i, /\blet'?s (break it down|take a closer look)\b/i, /\bimagine a world\b/i, /\bpicture this\b/i, /\bnot only\b[^.]*\bbut also\b/i, /\bon one hand\b[^.]*\bon the other hand\b/i, /\bit'?s worth noting\b/i, /\bit'?s important to (note|remember)\b/i];
const lower = prose.toLowerCase();
const bannedHits = HARD_BANNED.filter((w) => lower.includes(w));
const shapeHits = SHAPES.filter((r) => r.test(prose)).map((r) => String(r));
const emDashes = (body.match(/—/g) || []).length;
const firstPerson = [...prose.replace(/\bOur earlier article\b/gi, "").matchAll(/\b(we|our|us|I)\b/gi)].map((m) => prose.slice(Math.max(0, m.index - 45), m.index + 45).replace(/\s+/g, " "));

// ---------------------------------------------------------------- fluff
// The lexicon checks above pass prose that is padded, because padding uses ordinary words.
// These catch the two shapes that actually bloat a data piece: sentences whose only job is
// telling the reader what to look at, and vague quantifiers standing in for a figure.
const META = [
  /\bone (?:must|has to|needs to|should) (?:look|turn|consider|ask)\b/i,
  /\bto (?:understand|see|answer|grasp|appreciate)\b[^.]*\bone\b/i,
  /\bthis (?:shifts|changes|moves) the (?:denominator|measure|frame)\b/i,
  /\brequires? an? (?:immediate )?look\b/i,
  /\b(?:the|that) (?:trajectory|picture|performance|story) (?:shifted|changed|remained|tells)\b/i,
  /\bwhat (?:this|the chart|the data) (?:shows|tells|means) is\b/i,
  /\bit is (?:useful|helpful|instructive) to\b/i,
  /\bthe question (?:worth asking )?is\b/i,
  /\bin (?:dollar|absolute|percentage) terms\b/i,
  /\bon this (?:measure|metric)\b/i,
  /\bthis (?:measure|metric) (?:uses|excludes|counts|tracks)\b/i
];
const VAGUE = [/\ba trickle\b/i, /\btens of billions\b/i, /\ba hair behind\b/i, /\bvast(?:ly)?\b/i,
  /\bsignificant(?:ly)?\b/i, /\bsubstantial(?:ly)?\b/i, /\bdramatic(?:ally)?\b/i, /\bmodest(?:ly)?\b/i,
  /\broughly speaking\b/i, /\bby and large\b/i, /\bfar (?:more|less|behind|ahead)\b/i];
const sentences = prose.split("\n").flatMap((p) => p.trim().split(/(?<=[.?!])\s+/)).map((s) => s.trim()).filter(Boolean);
const metaHits = sentences.filter((s) => META.some((r) => r.test(s)));
const vagueHits = sentences.filter((s) => VAGUE.some((r) => r.test(s)));
// A sentence earns its place if it carries a figure or a named thing.
const loadless = sentences.filter((s) => !/\d/.test(s) && !/\b[A-Z][a-z]{2,}/.test(s.slice(1)));
const CAVEATISH = /\b(cannot|does not|do not|not a |is not |are not |rather than|caveat|careful|rough|approximate|preliminary|revis|settles none|deliberately|unknown|guess|inference|not proof|not comparable|only|limit|arbitrat)\b/i;
const empty = loadless.filter((s) => !CAVEATISH.test(s));
const loadlessPct = Math.round((100 * empty.length) / Math.max(1, sentences.length));

console.log(`\nsentences: ${sentences.length}`);
console.log(`meta-commentary sentences: ${metaHits.length}`);
for (const s of metaHits.slice(0, 12)) console.log(`  - ${s.slice(0, 120)}`);
console.log(`vague-quantifier sentences: ${vagueHits.length}`);
for (const s of vagueHits.slice(0, 8)) console.log(`  - ${s.slice(0, 120)}`);
console.log(`sentences with no number and no name: ${loadless.length}, of which ${loadless.length - empty.length} are caveats that must stay`);
console.log(`genuinely empty sentences: ${empty.length} (${loadlessPct}%)`);

// ---------------------------------------------------------------- report
console.log(`target: ${target}`);
console.log(`words: ${prose.split(/\s+/).filter(Boolean).length} | headings: ${(body.match(/^## /gm) || []).length}`);
console.log(`numerals found: ${found.length} | allowed set: ${allowed.size}`);
console.log(`\nUNSUPPORTED NUMBERS: ${bad.length}`);
for (const b of bad) console.log(`  ${String(b.raw).padEnd(12)} ...${b.ctx}...`);
console.log(`\nem-dashes: ${emDashes}`);
console.log(`banned lexicon: ${bannedHits.length ? bannedHits.join(", ") : "none"}`);
console.log(`banned shapes: ${shapeHits.length ? shapeHits.join(", ") : "none"}`);
console.log(`first-person slips: ${firstPerson.length}`);
for (const f of firstPerson.slice(0, 8)) console.log(`  ...${f}...`);

const fail = bad.length || emDashes || bannedHits.length || shapeHits.length || firstPerson.length
  || metaHits.length || vagueHits.length || loadlessPct > 25;
console.log(`\n${fail ? "FAIL" : "PASS"}`);
process.exit(fail ? 1 : 0);
