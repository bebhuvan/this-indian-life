// Rich-figure guard — every figure shown in a table, bullet list, or visual segment must
// trace to a locked number, just like prose figures. Lifted from the academy generator and
// parameterized: the caller extracts the figure-bearing lines and visual segments from its
// own document shape and passes them in, so both generators share one implementation.
//
// Warn-only: returns human-readable warnings for any figure that does not match a locked
// displayValue, so it can be verified. A caller writes these into qualityFlags.

import { normalizeFigure } from "./prose-guards.mjs";

// Figures the model packs into tables and bullets: rupee amounts, percentages, percentage
// points, and "index NNN" values.
export const FIG = /₹[\d.,]+\s*(?:lakh crore|crore|lakh)?|-?\d[\d.,]*\s*%|[+-]?[\d.]+\s*percentage points?|\bindex\s+-?\d[\d.,]*/gi;

// Pull the figure-bearing lines out of a markdown body: table rows (but not the
// |---| separator) and bullet list items, where index/inflation numbers get packed.
export function extractFigureLines(markdown) {
  return String(markdown || "").split("\n").filter((l) => {
    const t = l.trim();
    return (t.startsWith("|") && !l.includes("---")) || t.startsWith("- ") || t.startsWith("* ");
  });
}

// checkRichFigures({ lockedNumbers, figureLines, segments })
//   lockedNumbers: the evidence packet's locked numbers (each with displayValue / value)
//   figureLines:   array of strings (table/bullet lines) to scan for figures
//   segments:      array of { label, value } visual segments that must equal a locked share
export function checkRichFigures({ lockedNumbers = [], figureLines = [], segments = [] } = {}) {
  const warnings = [];
  const displays = new Set(lockedNumbers.map((n) => normalizeFigure(n.displayValue)));
  const numericValues = lockedNumbers.map((n) => Number(n.value)).filter((v) => Number.isFinite(v));
  const numericish = (v) => numericValues.some((x) => x !== 0 && Math.abs(x - v) / Math.abs(x) < 0.005) || numericValues.includes(v);

  // Visual segment values must equal a locked share (figure like "56.4%") or value.
  // Segments may carry visualTitle so the warning names the chart, matching the original
  // academy behaviour; the main pipeline has no visual segments and passes [].
  for (const s of segments || []) {
    const asPct = normalizeFigure(`${s.value}%`);
    if (!displays.has(asPct) && !numericish(Number(s.value))) {
      warnings.push(`visual "${s.visualTitle}" segment "${s.label}" value ${s.value} is not a locked number — verify or fix.`);
    }
  }

  // Figures in tables and bullet lists should each appear in the locked displayValues.
  for (const line of figureLines || []) {
    for (const fig of line.match(FIG) || []) {
      if (!displays.has(normalizeFigure(fig.replace(/index\s+/i, "")))) {
        warnings.push(`figure "${fig.trim()}" is not a locked displayValue — verify or fix.`);
      }
    }
  }
  return warnings;
}
