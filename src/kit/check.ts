// Invariants every Scene must keep, checked from the Scene alone (no DOM, no fonts loaded):
// no text over other text, nothing outside the frame, no text under 11 px, and every text
// readable against the ground. scripts/kit/stress.mjs runs this at every width; a form
// that breaks one is wrong, whatever it looks like at the widths someone happened to view.

import type { Scene, TextMark } from "./types";
import { INK, sizes, textInk } from "./theme";
import { measure, lineHeight } from "./text";
import { overlaps, textBox, type Box } from "./labels";

export interface Problem {
  kind: "overlap" | "outside" | "small" | "contrast";
  text: string;
  detail: string;
}

/** Relative luminance of a #rrggbb colour (WCAG 2). */
function luminance(hex: string): number {
  const lin = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The box a text mark occupies, measured as the Builder measures it. */
export function textMarkBox(t: TextMark, width: number): Box {
  const z = sizes(width);
  const size = z[t.role];
  const w = measure(t.text, size, !!t.bold || t.role === "figure", t.role === "display" || t.role === "note" ? "display" : "sans", false);
  return textBox(t.x, t.y, w, lineHeight(size), t.anchor);
}

export function checkScene(scene: Scene, ground: string = INK.ground): Problem[] {
  const out: Problem[] = [];
  const z = sizes(scene.width);
  const texts = scene.marks.filter((m): m is TextMark => m.kind === "text" && m.text.trim() !== "");
  // Ink boxes, not line boxes: two lines of a wrapped name sit a line-height apart and their
  // line boxes touch by design, so the test shrinks each box to the glyphs' own height.
  const boxes = texts.map((t) => {
    const b = textMarkBox(t, scene.width), size = z[t.role], h = size * 0.92;
    return { ...b, y: t.y - h / 2, h };
  });
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i], b = boxes[i], size = z[t.role];
    if (b.x < -1 || b.x + b.w > scene.width + 1) out.push({ kind: "outside", text: t.text, detail: `x ${Math.round(b.x)} to ${Math.round(b.x + b.w)} of ${scene.width}` });
    if (size < 11) out.push({ kind: "small", text: t.text, detail: `${size} px` });
    const fill = t.color ? textInk(t.color) : t.role === "axis" ? INK.ink3 : t.role === "note" ? INK.ink2 : INK.ink;
    // Text set on a pigment (a value inside a bar or tile) is checked against white only when
    // it is light itself; dark-on-pigment is the form's choice and is checked by eye.
    if (/^#[0-9a-f]{6}$/i.test(fill) && luminance(fill) < 0.5 && contrast(fill, ground) < 4.5) out.push({ kind: "contrast", text: t.text, detail: `${fill} at ${contrast(fill, ground).toFixed(2)}:1` });
    for (let j = i + 1; j < texts.length; j++) {
      if (overlaps(b, boxes[j], -1)) out.push({ kind: "overlap", text: t.text, detail: `with "${texts[j].text}"` });
    }
  }
  return out;
}
