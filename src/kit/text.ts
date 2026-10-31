// Text measurement from the font's own advance widths (see scripts/kit/build-metrics.mjs).
// Charts set proportional lining figures; `tabular` exists for a table that must align.

import { METRICS } from "./metrics.generated";

type Face = { avg: number; tab: number; map: Record<string, number> };
const SANS400 = METRICS.sans400 as unknown as Face;
const SANS600 = METRICS.sans600 as unknown as Face;
// Literata is not in the repo yet; these are its published tabular-figure and average
// lowercase advances. Display text is numerals and short words, so this is close.
const DISPLAY: Face = { avg: 540, tab: 600, map: {} };

export type FaceName = "sans" | "display";

export function measure(text: string, size: number, bold = false, face: FaceName = "sans", tabular = true): number {
  const f = face === "display" ? DISPLAY : bold ? SANS600 : SANS400;
  let units = 0;
  for (const ch of text) {
    if (ch >= "0" && ch <= "9" && (tabular || !f.map[ch])) units += f.tab;
    else units += f.map[ch] ?? f.avg;
  }
  return (units / 1000) * size;
}

/** Break text into lines no wider than `width`. Words longer than a line are kept whole. */
export function wrap(text: string, size: number, width: number, bold = false): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (!line || measure(next, size, bold) <= width) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shorten text with an ellipsis until it fits. Used only where a form allows it. */
export function fit(text: string, size: number, width: number, bold = false): string {
  if (measure(text, size, bold) <= width) return text;
  let t = text;
  while (t.length > 1 && measure(t + "…", size, bold) > width) t = t.slice(0, -1);
  return t.trimEnd() + "…";
}

/** Height of one line of text at a size: cap height plus room for descenders. */
export const lineHeight = (size: number) => Math.round(size * 1.25);
