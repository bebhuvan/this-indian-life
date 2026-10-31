// A population as a hundred people. On a wide screen one tall upright stroke per person
// in a single line, split at thresholds and bracketed in words; on a phone a 10 × 10 grid
// of the same strokes, with the bands listed beneath in order. Several rows compare
// populations person for person, the bands named once, in place, above the first row.
// Shares are rounded to whole people by largest remainder, so every row holds exactly 100.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK, RAMP } from "../theme";

export interface HundredSpec extends BaseSpec {
  form: "hundred";
  /** Bands from poorest (or first) to last; the last is the "rest" and is drawn in stone. */
  segments: { label: string; color?: string }[];
  /** One row per population; `parts` are % shares of the segments, summing to about 100. */
  rows: { label: string; parts: number[]; highlight?: boolean; note?: string }[];
  /** A bracket over the first `upTo + 1` segments, e.g. everyone below the top line. */
  cumulative?: { upTo: number; label: string };
}

/** Round shares to whole people that sum to exactly 100 (largest remainder). */
export function toPeople(parts: number[]): number[] {
  const total = parts.reduce((s, p) => s + p, 0) || 1;
  const exact = parts.map((p) => (p / total) * 100);
  const out = exact.map(Math.floor);
  let left = 100 - out.reduce((s, v) => s + v, 0);
  const order = exact.map((e, i) => ({ i, r: e - Math.floor(e) })).sort((a, c) => c.r - a.r);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length].i]++;
  return out;
}

function inksFor(spec: HundredSpec): string[] {
  const n = spec.segments.length;
  // Poorest deepest; the last band is context, exactly stone.
  const ramp = [RAMP[4], RAMP[3], RAMP[2], RAMP[1]];
  return spec.segments.map((s, i) => s.color ?? (i === n - 1 ? INK.stone : ramp[i] ?? RAMP[1]));
}

interface Seg {
  x0: number;
  x1: number;
  count?: number;
  text: string;
  ink: string;
}

/**
 * Words for each segment, beside a base line (below it when dir is 1, above when -1).
 * A label with no room moves one row further out on a leader; neither the label nor the
 * leader may cross anything already set. Returns the number of rows used.
 */
function callouts(b: Builder, segs: Seg[], baseY: number, dir: 1 | -1): number {
  const lh = b.lh("label");
  const rowY = (r: number) => baseY + dir * (10 + lh / 2 + r * (lh + 6));
  let used = 0;
  for (const g of segs) {
    const count = g.count != null ? String(g.count) : "";
    const cw = count ? b.tw(count, "label", true) + b.tw(" ", "label") : 0;
    const tw = cw + b.tw(g.text, "label");
    const mid = (g.x0 + g.x1) / 2;
    let placed = false;
    for (let r = 0; r < 6 && !placed; r++) {
      const y = rowY(r);
      for (const lx of [mid, g.x0 + 1, g.x1 - 1]) {
        for (const left of [lx - tw / 2, lx - 2, lx - tw + 2]) {
          if (left < 0 || left + tw > b.width) continue;
          const box = { x: left, y: y - lh / 2, w: tw, h: lh };
          if (b.occ.hits(box, 6)) continue;
          const near = dir > 0 ? box.y - 2 : box.y + box.h + 2;
          const leader = r > 0 ? { x: lx - 2, y: Math.min(baseY + dir * 3, near), w: 4, h: Math.abs(near - (baseY + dir * 3)) } : null;
          if (leader && b.occ.hits(leader, 1)) continue;
          if (leader) {
            b.hair(lx, baseY + dir * 3, lx, near, INK.axis);
            b.reserve(leader);
          }
          if (count) b.text(left, y, count, "label", "start", { bold: true });
          b.text(left + cw, y, g.text, "label", "start", { color: count ? INK.ink2 : INK.ink });
          used = Math.max(used, r + 1);
          placed = true;
          break;
        }
        if (placed) break;
      }
    }
  }
  return used;
}

export function hundred(spec: HundredSpec, w: number): Scene {
  if (spec.rows.length > 1) return many(spec, w);
  return w < 520 ? grid(spec, w) : strip(spec, w);
}

/** Wide: one line of a hundred tall strokes. */
function strip(spec: HundredSpec, w: number): Scene {
  const b = new Builder(w);
  const counts = toPeople(spec.rows[0].parts);
  const inks = inksFor(spec);
  const pitch = Math.min(7.8, w / 100);
  const stroke = Math.max(2, pitch * 0.46);
  const h = w >= 800 ? 72 : 60;
  const top = spec.cumulative ? b.lh("label") + 22 : 4;
  const xs: number[] = [];
  let k = 0;
  counts.forEach((c, s) => {
    for (let j = 0; j < c; j++, k++) {
      const x = k * pitch + (pitch - stroke) / 2;
      b.rect(x, top, stroke, h, inks[s]);
      xs.push(x + stroke / 2);
    }
  });
  const bottom = top + h;

  if (spec.cumulative) {
    const n = counts.slice(0, spec.cumulative.upTo + 1).reduce((s, v) => s + v, 0);
    const x0 = xs[0] - pitch / 3, x1 = xs[n - 1] + pitch / 3, by = top - 10;
    b.hair(x0, by, x1, by, INK.ink);
    b.hair(x0, by, x0, by + 5, INK.ink);
    b.hair(x1, by, x1, by + 5, INK.ink);
    b.tryText([[x0, by - b.lh("label") / 2 - 3, "start"]], `${n} ${spec.cumulative.label}`, "label", { bold: true });
  }

  // The bands, in order, top to bottom: beside the strip when there is room, else below.
  const lh = b.lh("label") + 4;
  const listW = Math.max(...counts.map((c, s) => b.tw(String(c), "label", true) + b.tw(" " + spec.segments[s].label, "label"))) + 14;
  const right = xs[99] + pitch + 28;
  const beside = right + listW <= w;
  const lx = beside ? right : 0;
  let ly = beside ? top + h / 2 - ((counts.length - 1) * lh) / 2 : bottom + 18 + lh / 2;
  counts.forEach((c, s) => {
    b.rect(lx, ly - 8, 4, 16, inks[s]);
    b.text(lx + 12, ly, String(c), "label", "start", { bold: true });
    b.text(lx + 12 + b.tw(String(c), "label", true) + b.tw(" ", "label"), ly, spec.segments[s].label, "label", "start", { color: INK.ink2 });
    ly += lh;
  });
  return b.scene(beside ? bottom + 2 : ly - lh / 2 + b.lh("label") / 2, spec.alt ?? altText(spec, [counts]));
}

/** Phone: a 10 × 10 grid of strokes, the bands listed beneath in order. */
function grid(spec: HundredSpec, w: number): Scene {
  const b = new Builder(w);
  const counts = toPeople(spec.rows[0].parts);
  const inks = inksFor(spec);
  const cell = Math.min(28, Math.floor(w / 10));
  const sw = Math.round(cell * 0.32), sh = Math.round(cell * 0.82);
  let y = 0;
  if (spec.cumulative) {
    const n = counts.slice(0, spec.cumulative.upTo + 1).reduce((s, v) => s + v, 0);
    b.text(0, b.lh("label") / 2, `${n} ${spec.cumulative.label}`, "label", "start", { bold: true });
    y = b.lh("label") + 12;
  }
  let k = 0;
  counts.forEach((c, s) => {
    for (let j = 0; j < c; j++, k++) {
      const col = k % 10, row = Math.floor(k / 10);
      b.rect(col * cell + (cell - sw) / 2, y + row * cell + (cell - sh) / 2, sw, sh, inks[s]);
    }
  });
  y += 10 * cell + 14;
  const lh = b.lh("label") + 6;
  counts.forEach((c, s) => {
    const cy = y + lh / 2;
    b.rect(0, cy - 8, 5, 16, inks[s]);
    const n = String(c);
    b.text(14, cy, n, "label", "start", { bold: true });
    b.text(14 + b.tw(n, "label", true) + b.tw(" ", "label"), cy, spec.segments[s].label, "label", "start", { color: INK.ink2 });
    y += lh;
  });
  return b.scene(y, spec.alt ?? altText(spec, [counts]));
}

/** Several populations, one row each; bands named once above the first row. */
function many(spec: HundredSpec, w: number): Scene {
  const inks = inksFor(spec);
  const all = spec.rows.map((r) => toPeople(r.parts));
  const narrow = w < 520;
  const lines = narrow ? 2 : 1;
  const h = narrow ? 20 : 30;
  const lineGap = 6;
  const cum = spec.cumulative;

  const layout = (b: Builder, labelRows: number, belowRows: number) => {
    const valW = cum ? Math.max(b.tw("100", "figure"), b.tw(cum.label, "axis")) + 8 : 0;
    const nameW = narrow ? 0 : Math.max(...spec.rows.map((r) => Math.max(b.tw(r.label, "label", true), r.note ? b.tw(r.note, "note") : 0))) + 16;
    const x0 = nameW, x1 = w - valW - (cum ? 14 : 0);
    const pitch = (x1 - x0) / (100 / lines);
    const stroke = Math.max(1.5, Math.min(pitch * 0.46, 4));
    const blockH = lines * h + (lines - 1) * lineGap;
    let y = labelRows * (b.lh("label") + 6) + 14 + (labelRows === 0 && cum ? b.lh("axis") + 4 : 0);
    if (cum) b.text(w, y - 14 - b.lh("axis") / 2, cum.label, "axis", "end");
    let rowsUsed = 0, belowUsed = 0;
    spec.rows.forEach((r, k) => {
      let sy = y;
      if (narrow) {
        const ny = y + b.lh("label") / 2;
        b.text(0, ny, r.label, "label", "start", { bold: r.highlight });
        if (r.note) b.text(b.tw(r.label + "  ", "label", r.highlight), ny, r.note, "note");
        sy = y + b.lh("label") + 4;
      } else {
        const ny = y + blockH / 2 - (r.note ? b.lh("note") / 2 : 0);
        b.text(0, ny, r.label, "label", "start", { bold: r.highlight });
        if (r.note) b.text(0, ny + b.lh("label") / 2 + b.lh("note") / 2, r.note, "note");
      }
      const xs: number[] = [];
      let i = 0;
      all[k].forEach((c, s) => {
        for (let j = 0; j < c; j++, i++) {
          const line = Math.floor(i / (100 / lines)), col = i % (100 / lines);
          const x = x0 + col * pitch + (pitch - stroke) / 2;
          b.rect(x, sy + line * (h + lineGap), stroke, h, inks[s]);
          xs.push(x + stroke / 2);
        }
      });
      if (cum) {
        const n = all[k].slice(0, cum.upTo + 1).reduce((s, v) => s + v, 0);
        b.text(w, sy + blockH / 2, String(n), "figure", "end", { color: r.highlight ? INK.ink : INK.ink2 });
      }
      // The bands, named once, on the first row's own strokes: a band that starts on the
      // first line is named above it, one that starts on the second line below it.
      // On a phone the name sits where the band names would go, so the bands are listed in
      // order under the first row instead, each with its ink.
      if (k === 0 && narrow) {
        let ly = sy + blockH + 12 + b.lh("label") / 2;
        all[0].forEach((c, s) => {
          b.rect(0, ly - 7, 4, 14, inks[s]);
          b.text(12, ly, spec.segments[s].label, "label", "start", { color: INK.ink2 });
          ly += b.lh("label") + 3;
        });
        y = ly - b.lh("label") / 2 + 16;
        return;
      }
      if (k === 0) {
        const per = 100 / lines;
        let start = 0;
        const above: Seg[] = [], below: Seg[] = [];
        all[0].forEach((c, s) => {
          const from = start, to = start + c;
          start = to;
          if (!c) return;
          const onFirst = from < per;
          const sp = onFirst ? xs.slice(from, Math.min(to, per)) : xs.slice(from, to);
          const g = { x0: sp[0] - pitch / 3, x1: sp[sp.length - 1] + pitch / 3, text: spec.segments[s].label, ink: inks[s] };
          const ly = onFirst ? sy - 5 : sy + blockH + 5;
          b.hair(g.x0, ly, g.x1, ly, g.ink === INK.stone ? INK.stoneLine : g.ink);
          (onFirst ? above : below).push(g);
        });
        rowsUsed = callouts(b, above, sy - 5, -1);
        if (below.length) belowUsed = callouts(b, below, sy + blockH + 5, 1);
        if (belowRows) {
          y = sy + blockH + 5 + 10 + belowRows * (b.lh("label") + 6) + (narrow ? 12 : 10);
          return;
        }
      }
      y = sy + blockH + (narrow ? 18 : 16);
    });
    return { height: y - (narrow ? 18 : 16) + 2, rowsUsed, belowUsed };
  };

  // Lay out once to learn how many rows the band names need, then for real.
  const trial = layout(new Builder(w), 4, 4);
  const b = new Builder(w);
  const { height } = layout(b, narrow ? 0 : Math.max(1, trial.rowsUsed), narrow ? 0 : trial.belowUsed);
  return b.scene(height, spec.alt ?? altText(spec, all));
}

function altText(spec: HundredSpec, all: number[][]): string {
  const rows = spec.rows.map((r, k) => `${r.label}: ${all[k].map((c, s) => `${c} ${spec.segments[s].label}`).join(", ")}`);
  return `Each population drawn as 100 people, shares rounded to whole people. ${rows.join(". ")}.`;
}
