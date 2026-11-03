// Text measurement from the font's own advance widths (see scripts/kit/build-metrics.mjs).
// Charts set proportional lining figures; `tabular` exists for a table that must align.

import { METRICS } from "./metrics.generated";
import { KERNING } from "./kerning.generated";

type Face = { avg: number; tab: number; map: Record<string, number> };
const SANS400 = METRICS.sans400 as unknown as Face;
const SANS600 = METRICS.sans600 as unknown as Face;
// Literata is not in the repo yet; these are its published tabular-figure and average
// lowercase advances. Display text is numerals and short words, so this is close.
const DISPLAY: Face = { avg: 540, tab: 600, map: {} };

export type FaceName = "sans" | "display";

export function measure(text: string, size: number, bold = false, face: FaceName = "sans", tabular = true): number {
  const f = face === "display" ? DISPLAY : bold ? SANS600 : SANS400;
  // Kerning as the browser applies it (scripts/kit/build-kerning.mjs); without it a kerned
  // label measured up to 4% wide and a right-aligned name started a few pixels in.
  const kern = face === "sans" && !tabular ? KERNING[bold ? "sans600" : "sans400"] : null;
  let units = 0, prev = "";
  for (const ch of text) {
    if (ch >= "0" && ch <= "9" && (tabular || !f.map[ch])) units += f.tab;
    else units += f.map[ch] ?? f.avg;
    if (kern && prev) units += kern[prev + ch] ?? 0;
    prev = ch;
  }
  return (units / 1000) * size;
}

/** Break text into lines no wider than `width`, measured in the face it will be set in
 *  (a note is Literata, wider than the grotesque). Words longer than a line are kept whole. */
export function wrap(text: string, size: number, width: number, bold = false, face: FaceName = "sans"): string[] {
  // A slash is a place to break too ("Tertiary/" then "post-secondary"), joined without a space.
  const words = text.split(/\s+/).filter(Boolean).flatMap((w) => (measure(w, size, bold, face, false) > width ? w.split(/(?<=\/)/) : [w]));
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? (line.endsWith("/") ? line + w : line + " " + w) : w;
    if (!line || measure(next, size, bold, face, false) <= width) line = next;
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
