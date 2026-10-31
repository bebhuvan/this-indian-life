// The helper every form draws through. It measures text, records what has been drawn,
// and refuses to place a label on top of anything already reserved.

import type { Anchor, Mark, Role, Scene } from "./types";
import { sizes, type Sizes } from "./theme";
import { measure, lineHeight } from "./text";
import { Occupancy, textBox, type Box } from "./labels";

export interface TextOpts {
  bold?: boolean;
  color?: string;
  halo?: boolean;
  /** Reserve the text's box so later labels avoid it (default true). */
  reserve?: boolean;
}

export class Builder {
  readonly width: number;
  readonly z: Sizes;
  readonly marks: Mark[] = [];
  readonly occ = new Occupancy();

  constructor(width: number) {
    this.width = width;
    this.z = sizes(width);
  }

  /** Width of a text in a role. */
  tw(text: string, role: Role, bold = false): number {
    // Proportional lining figures everywhere. Schibsted's tabular setting also widens the
    // period, comma and dash to a full digit, which makes numbers look typewritten.
    return measure(text, this.z[role], bold || role === "figure", role === "display" || role === "note" ? "display" : "sans", false);
  }

  /** Height of one line in a role. */
  lh(role: Role): number {
    return lineHeight(this.z[role]);
  }

  box(x: number, y: number, text: string, role: Role, anchor: Anchor, bold = false): Box {
    return textBox(x, y, this.tw(text, role, bold), this.lh(role), anchor);
  }

  text(x: number, y: number, text: string, role: Role, anchor: Anchor = "start", o: TextOpts = {}): Box {
    const b = this.box(x, y, text, role, anchor, o.bold);
    this.marks.push({ kind: "text", x, y, text, role, anchor, bold: o.bold, color: o.color, halo: o.halo });
    if (o.reserve !== false) this.occ.add(b);
    return b;
  }

  /** Place a text at the first candidate position that collides with nothing. */
  tryText(cands: Array<[number, number, Anchor]>, text: string, role: Role, o: TextOpts = {}, pad = 2): Box | null {
    for (const [x, y, a] of cands) {
      const b = this.box(x, y, text, role, a, o.bold);
      if (b.x < 0 || b.x + b.w > this.width + 0.5) continue;
      if (!this.occ.hits(b, pad)) return this.text(x, y, text, role, a, o);
    }
    return null;
  }

  /**
   * The one number a chart is about: set large in Literata beside its mark, a margin note
   * under it. Tried above-left, above-right, below-right and below-left of the point;
   * skipped, never overlapped, if none is clear.
   */
  callout(px: number, py: number, value: string, note: string | undefined, color: string): Box | null {
    const vh = this.lh("display"), nh = note ? this.lh("note") : 0;
    const w = Math.max(this.tw(value, "display"), note ? this.tw(note, "note") : 0);
    const h = vh + nh;
    const off = this.z.gap * 1.5;
    const cands: Array<[number, number, Anchor]> = [
      [px - off, py - off - h, "end"],
      [px + off, py - off - h, "start"],
      [px + off, py + off, "start"],
      [px - off, py + off, "end"],
    ];
    for (const [x, top, a] of cands) {
      const left = a === "end" ? x - w : x;
      const box = { x: left, y: top, w, h };
      if (left < 0 || left + w > this.width || top < 0 || this.occ.hits(box, 4)) continue;
      this.occ.add(box);
      this.marks.push({ kind: "text", x, y: top + vh / 2, text: value, role: "display", anchor: a, color, halo: true });
      if (note) this.marks.push({ kind: "text", x, y: top + vh + nh / 2 - 2, text: note, role: "note", anchor: a, halo: true });
      return box;
    }
    return null;
  }

  /** Mark an area as taken without drawing anything (a bar, a dot, a line's path). */
  reserve(b: Box) {
    this.occ.add(b);
  }

  rect(x: number, y: number, w: number, h: number, fill: string, opacity?: number) {
    if (w < 0) {
      x += w;
      w = -w;
    }
    this.marks.push({ kind: "rect", x, y, w, h, fill, opacity });
  }

  line(x1: number, y1: number, x2: number, y2: number, stroke: string, width = 1, dash?: string, cap?: "butt" | "round") {
    this.marks.push({ kind: "line", x1, y1, x2, y2, stroke, width, dash, cap });
  }

  /** A hairline snapped to the pixel grid so it renders one device pixel wide. */
  hair(x1: number, y1: number, x2: number, y2: number, stroke: string, dash?: string) {
    const s = (v: number) => Math.round(v) + 0.5;
    if (x1 === x2) this.line(s(x1), y1, s(x2), y2, stroke, 1, dash);
    else if (y1 === y2) this.line(x1, s(y1), x2, s(y2), stroke, 1, dash);
    else this.line(x1, y1, x2, y2, stroke, 1, dash);
  }

  path(d: string, o: { stroke?: string; fill?: string; width?: number; dash?: string; opacity?: number; join?: "round" | "miter" }) {
    this.marks.push({ kind: "path", d, ...o });
  }

  circle(cx: number, cy: number, r: number, fill?: string, stroke?: string, width?: number) {
    this.marks.push({ kind: "circle", cx, cy, r, fill, stroke, width });
  }

  scene(height: number, alt: string): Scene {
    // Signature 4: one number gets the display voice. A second is a design error.
    const displays = this.marks.filter((m) => m.kind === "text" && m.role === "display").length;
    if (displays > 1) throw new Error(`chart kit: ${displays} display numbers in one chart; at most one is allowed`);
    return { width: this.width, height: Math.ceil(height), marks: this.marks, alt };
  }
}

/** Points to an SVG path, rounding to tenths. */
export const polyline = (pts: Array<[number, number]>) =>
  pts.map(([x, y], i) => (i ? "L" : "M") + (Math.round(x * 10) / 10) + "," + (Math.round(y * 10) / 10)).join("");
