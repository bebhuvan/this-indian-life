// Shared prose linter for Indica explanations.
//
// Two jobs:
//   1. A hard gate (validate-explanations.mjs) that fails the build on AI-writing
//      tells, so robotic prose never ships.
//   2. A feedback source (generate-explanations.mjs) that hands the edit pass the
//      exact list of tells in its own draft, so the model fixes them itself.
//
// Findings have a severity: "error" tells fail the gate; "warn" tells are surfaced
// to the editor but do not block, because they are sometimes legitimate.

// Vocabulary and phrase tells. Each becomes a case-insensitive word/phrase match.
const PHRASE_TELLS = [
  // overused AI vocabulary
  "delve", "tapestry", "complex interplay", "crucial", "crucially",
  "moreover", "furthermore", "notably", "it is important to note",
  "it is worth noting", "it should be noted", "in conclusion", "in summary",
  "stark reminder", "testament to", "a testament", "underscores", "underscoring",
  "highlights the importance", "speaks volumes", "paints a picture",
  "paints a vivid", "at its core", "in today's world", "when it comes to",
  "the world of", "navigate the", "shed light", "a double-edged sword",
  // hedging filler that reads as machine balance
  "on the other hand, it is", "that being said", "needless to say",
];

// Phrases that smuggle in causality the data does not prove. Forbidden by the
// generation guardrails (generate-explanations.mjs) but they still leak.
const CAUSALITY_TELLS = [
  "the main reason", "the primary reason", "this is because",
  "due to the fact", "as a result of the fact", "driven primarily by",
];

// Structural patterns — the real AI signatures, matched as regexes.
const PATTERN_TELLS = [
  { rule: "not-just-but", severity: "error", re: /\b(?:is|are|was|were|it'?s)\s+not\s+just\s+[^.,;]{1,60}[,—-]\s*(?:it'?s|it is|but|they are)\b/i, hint: "Drop the 'not just X, it's Y' construction. State Y directly." },
  { rule: "dramatic-colon-reveal", severity: "warn", re: /[a-z]{3,}\s*:\s+[a-z][^.]{0,40}\s+has\s+(?:collapsed|exploded|plunged|soared|crashed)\b/i, hint: "Avoid the colon-then-dramatic-verb reveal. Use a plain sentence." },
  { rule: "abstraction-pair-flourish", severity: "warn", re: /\b(?:gradual but profound|small but significant|simple yet powerful|slow but steady|quiet but)\b/i, hint: "Cut the abstraction-pair flourish; it adds no information." },
  { rule: "closing-aphorism", severity: "warn", re: /\b(?:no longer \w+ing[,—-]\s*it is|is not just a number|tells a story|the story (?:is|here is) clear)\b/i, hint: "Remove the editorial closing line. End on the last concrete point." },
  { rule: "em-dash", severity: "error", re: /—/, hint: "Replace the em-dash with a comma, period, or rephrase. Em-dashes are a strong AI tell." },
  { rule: "rhetorical-question-pivot", severity: "warn", re: /\?\s+(?:the answer is|turns out|well,)/i, hint: "Don't pose-and-answer rhetorically. State the point." },
];

// False precision: numbers written to machine accuracy instead of human roundness.
// e.g. "1,450,935,791" people, "5.92 children", "1.875 per 1,000".
function falsePrecisionFindings(text) {
  const findings = [];
  const prose = String(text || "").replace(/https?:\/\/[^\s)]+/g, "");
  // Long full-precision integers (>= 7 significant digits), with or without commas.
  const longInt = /\b\d{1,3}(?:,\d{3}){2,}\b|\b\d{7,}\b/g;
  for (const match of prose.matchAll(longInt)) {
    findings.push({ rule: "false-precision-integer", severity: "warn", match: match[0], hint: `Round "${match[0]}" to a human figure (e.g. 1.45 billion / 145 crore), keep full precision only in charts.` });
  }
  // Decimals with 3+ fractional digits (rates, ratios) — round to one decimal in prose.
  const longDecimal = /\b\d+\.\d{3,}\b/g;
  for (const match of prose.matchAll(longDecimal)) {
    findings.push({ rule: "false-precision-decimal", severity: "warn", match: match[0], hint: `Round "${match[0]}" to one decimal in prose.` });
  }
  return findings;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lint a block of prose. Returns an array of findings:
 *   { rule, severity: "error" | "warn", match, hint }
 */
export function lintProse(text) {
  const input = String(text || "");
  const findings = [];

  for (const phrase of PHRASE_TELLS) {
    const re = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
    const match = input.match(re);
    if (match) findings.push({ rule: "ai-phrase", severity: "error", match: match[0], hint: `Remove the AI-writing tell "${phrase}".` });
  }

  for (const phrase of CAUSALITY_TELLS) {
    const re = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
    const match = input.match(re);
    if (match) findings.push({ rule: "causality-claim", severity: "error", match: match[0], hint: `"${phrase}" asserts a cause. Use "one visible pattern in this data is" unless the evidence proves causation.` });
  }

  for (const { rule, severity, re, hint } of PATTERN_TELLS) {
    const match = input.match(re);
    if (match) findings.push({ rule, severity, match: match[0], hint });
  }

  findings.push(...falsePrecisionFindings(input));
  return findings;
}

/** Convenience: collect findings across the reader-facing fields of an explanation. */
export function lintExplanation(doc) {
  const fields = [
    ["short.headline", doc.short?.headline],
    ["short.dek", doc.short?.dek],
    ["short.body", doc.short?.body],
    ["article.standfirst", doc.article?.standfirst],
    ["article.bodyMarkdown", doc.article?.bodyMarkdown],
  ];
  const findings = [];
  for (const [field, value] of fields) {
    for (const finding of lintProse(value)) findings.push({ field, ...finding });
  }
  return findings;
}

/** Format findings as a compact instruction block for the edit-pass prompt. */
export function findingsToInstruction(findings) {
  if (!findings.length) return "No automated prose tells were detected. Keep it clean.";
  const lines = findings.map((f) => `- [${f.severity}] ${f.field ? `${f.field}: ` : ""}${f.rule} — found "${f.match}". ${f.hint}`);
  return ["Fix every one of these detected AI-writing tells in the final text:", ...lines].join("\n");
}
