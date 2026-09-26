// Shared prose guards — deterministic cleanups and warn-level checks that run after
// generation, for BOTH the academy generator and the main article generator.
//
// These were originally inline in scripts/academy/generate-entry.mjs. They are lifted
// here verbatim (behaviour-preserving) so the main pipeline can reuse the exact same
// gate the academy already trusts. The only change is generalisation: functions that
// used to reach into an entry's fields now take plain text arrays, so each caller
// supplies its own field extractor (academy fieldsOf, main explanationFields).

import { lintProse } from "./prose-lint.mjs";

// Collect lint findings across a set of texts, split by severity.
export function lintReport(...texts) {
  const findings = texts.flatMap((t) => lintProse(t || ""));
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  return { findings, errors, warns };
}

// Deterministic hard gate over a set of texts: blocked if any lint error OR any em-dash
// anywhere. (The linter only reports the first match per field, so check em-dash directly.)
export function hardIssuesFromTexts(texts) {
  const lint = lintReport(...texts);
  const emdash = texts.some((t) => String(t || "").includes("—"));
  return { lint, emdash, blocked: lint.errors.length > 0 || emdash };
}

// Deterministic em-dash sanitizer. The model is unreliable at mechanically removing
// em-dashes even across several focused passes (it keeps reintroducing them), so this
// guarantees the tell is gone: every "—" becomes a comma. Rephrasing of banned WORDS
// still goes through the model; only this one mechanical tell is fixed deterministically.
export function deepStripEmDash(obj) {
  if (typeof obj === "string") {
    // Horizontal whitespace only — must NOT collapse newlines, or markdown structure
    // (paragraph breaks, headings, table rows) is destroyed.
    return obj.replace(/[ \t]*—[ \t]*/g, ", ").replace(/,[ \t]*([.;:,])/g, "$1").replace(/[ \t]{2,}/g, " ");
  }
  if (Array.isArray(obj)) return obj.map(deepStripEmDash);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepStripEmDash(obj[k]);
    return out;
  }
  return obj;
}

// Derived-number guard. The model cannot reliably audit its own arithmetic, and the
// self-critique misses invented ratios (e.g. "the economy grew fifty times"). These
// patterns surface every multiplier/ratio claim so the critique pass must tie it to a
// locked-number comparison or cut it, and so a human verifies what survives. Warn-only
// (not a hard block): a multiplier CAN be legitimate if a locked number states it.
export const DERIVED_NUMBER_RES = [
  /\b\d+(?:\.\d+)?\s*(?:times|fold|x|×)\b/gi,
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|dozen)\s*(?:times|fold)\b/gi,
  /\b(?:doubled|tripled|trebled|quadrupled|quintupled|halved)\b/gi
];
export function derivedReport(...texts) {
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

// The macha / on-the-ground body must be English (heading may be Hinglish). Catch a
// romanized-Hindi body even when the model ignores the prompt rule. Takes the body
// string (callers: academy entry.onTheGround?.body, main doc.macha?.body).
export const HINDI_MARKERS = ["hai", "hain", "mein", "ki", "ka", "ke", "ko", "toh", "yaad", "matlab", "kya", "raha", "raha", "hua", "nahi", "nahin", "aur", "yeh", "woh", "jab", "tab", "kuch", "sirf", "rakho", "samjhe", "liye", "hota", "hoti", "karega", "karta"];
export function machaHindiScore(bodyText) {
  const body = String(bodyText || "").toLowerCase();
  const words = body.split(/[^a-z]+/).filter(Boolean);
  return words.filter((w) => HINDI_MARKERS.includes(w)).length;
}

// Normalise a figure string for set-membership comparison against locked displayValues.
export function normalizeFigure(s) {
  return String(s || "").toLowerCase().replace(/minus|−|-/g, "").replace(/\.0+(?=%|$)/g, "").replace(/\s+/g, "").replace(/₹/g, "").trim();
}
