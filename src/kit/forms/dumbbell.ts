// Two values per row, joined by a stone connector. The first end is an open ring, the
// second (the protagonist) a solid neel dot. Each value is printed beside its own mark,
// the lower one to the left and the higher to the right, so a number is never a column
// away from the dot it describes. The two ends are keyed once, above the plot, as written.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { fmt, formatterFor } from "../format";
import { domain, linear } from "../scale";
import { wrap } from "../text";

export interface DumbbellSpec extends BaseSpec {
  form: "dumbbell";
  /** Names of the two ends, e.g. ["All ages", "Ages 0–5"]. The second is the protagonist. */
  ends: [string, string];
  items: { label: string; a: number; b: number; highlight?: boolean }[];
  sort?: "gap" | "a" | "b" | "none";
  /** Kept for the spec's meaning; colour no longer depends on it (sindoor is losses only). */
  worse?: "higher" | "lower";
}

export function dumbbell(spec: DumbbellSpec, w: number): Scene {
  return w < 520 ? stacked(spec, w) : wide(spec, w);
}

/** Order, formats and one domain shared by every width, so a phone shows the same scale. */
function prepare(spec: DumbbellSpec) {
  const items = [...spec.items];
  if (spec.sort === "gap") items.sort((p, q) => Math.abs(q.b - q.a) - Math.abs(p.b - p.a));
  else if (spec.sort === "a") items.sort((p, q) => q.a - p.a);
  else if (spec.sort === "b") items.sort((p, q) => q.b - p.b);
  const all = items.flatMap((d) => [d.a, d.b]);
  const val = formatterFor(all, { decimals: spec.decimals });
  const t = domain(all, "fit", 5);
  // The fit's padding must not invent a negative region for values that cannot be negative
  // (a "−20" tick on a headcount rate), nor run a share past 100.
  const lo = Math.min(...all) >= 0 ? Math.max(0, t.lo) : t.lo;
  const hi = spec.unit === "%" && Math.max(...all) > 85 ? 100 : t.hi;
  const ticks = t.ticks.filter((v) => v >= lo && v <= hi);
  if (hi === 100 && ticks[ticks.length - 1] !== 100) ticks.push(100);
  return { items, val, lo, hi, ticks };
}

function pair(b: Builder, xa: number, xb: number, cy: number, r: number) {
  const dir = Math.sign(xb - xa) || 1;
  const cw = r >= 6 ? 3 : 2.5;
  if (Math.abs(xb - xa) > r * 2 + 2) b.line(xa + dir * (r + 1), cy, xb - dir * (r + 1), cy, INK.stoneLine, cw, undefined, "butt");
  b.circle(xa, cy, r - 0.75, INK.ground, INK.ink2, 1.75);
  b.circle(xb, cy, r + 0.5, INK.neel);
  b.reserve({ x: Math.min(xa, xb) - r - 2, y: cy - r - 2, w: Math.abs(xb - xa) + r * 2 + 4, h: r * 2 + 4 });
}

/** The key: a ring and its end's name, then a dot and the protagonist's, set as written. */
function key(b: Builder, spec: DumbbellSpec, x: number, y: number) {
  const r = b.z.dot;
  b.circle(x + r, y, r - 0.75, INK.ground, INK.ink2, 1.75);
  const ka = b.text(x + r * 2 + 7, y, spec.ends[0], "label", "start", { color: INK.ink2 });
  const xb = ka.x + ka.w + 22;
  b.circle(xb + r, y, r + 0.5, INK.neel);
  b.text(xb + r * 2 + 7, y, spec.ends[1], "label", "start", { bold: true, color: INK.neel });
}

/** Ticks under a baseline, the unit on the last one. */
function scale(b: Builder, spec: DumbbellSpec, ticks: number[], sx: (v: number) => number, y: number) {
  ticks.forEach((v, k) => {
    const s = fmt(v, { decimals: 0, unit: k === ticks.length - 1 ? spec.unit : undefined });
    b.tryText([[sx(v), y, "middle"], [sx(v), y, k === 0 ? "start" : "end"]], s, "axis", {}, 6);
  });
}

/** Phones: each row is a line of text (name, then both values) over a full-width dumbbell. */
function stacked(spec: DumbbellSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const { items, val, lo, hi, ticks } = prepare(spec);
  const r = z.dot;
  const sx = linear([lo, hi], [r + 1, w - r - 1]);
  const lh = b.lh("label");
  const legend = b.lh("axis") + 4;
  const top = legend + 2;

  // On a phone the value columns name the two ends; they are the only set of headers.
  const colB = Math.max(...items.map((d) => b.tw(val(d.b), "value", true)), b.tw(spec.ends[1], "axis", true));
  const xA = w - colB - 10;
  const colA = Math.max(...items.map((d) => b.tw(val(d.a), "value")), b.tw(spec.ends[0], "axis"));
  // A name wraps within the space left of the value columns, so it never runs under them.
  const nameW = Math.max(60, xA - colA - 12);
  const names = items.map((d) => (b.tw(d.label, "label", d.highlight) <= nameW ? [d.label] : wrap(d.label, z.label, nameW, d.highlight)));
  const rowHs = names.map((n) => n.length * lh + 24);
  const rowTop = rowHs.map((_, k) => top + rowHs.slice(0, k).reduce((a, c) => a + c, 0));
  const bottom = top + rowHs.reduce((a, c) => a + c, 0);

  for (const v of ticks) b.hair(sx(v), top, sx(v), bottom, INK.rule);
  b.text(xA, top - legend / 2 + 1, spec.ends[0], "axis", "end", { color: INK.ink2 });
  b.text(w, top - legend / 2 + 1, spec.ends[1], "axis", "end", { bold: true, color: INK.neel });
  items.forEach((d, k) => {
    const ty = rowTop[k] + lh / 2 + 2;
    const cy = ty + (names[k].length - 1) * lh + lh / 2 + 11;
    names[k].forEach((l, j) => b.text(0, ty + j * lh, l, "label", "start", { bold: d.highlight, halo: true }));
    b.text(w, ty, val(d.b), "value", "end", { bold: true, color: INK.neel, halo: true });
    b.text(xA, ty, val(d.a), "value", "end", { color: INK.ink2, halo: true });
    pair(b, sx(d.a), sx(d.b), cy, r);
  });

  const fy = bottom + 4 + b.lh("axis") / 2;
  scale(b, spec, ticks, sx, fy);
  return b.scene(fy + b.lh("axis") / 2 + 2, spec.alt ?? `${items.length} rows comparing ${spec.ends[0]} with ${spec.ends[1]}.`);
}

function wide(spec: DumbbellSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const { items, val, lo, hi, ticks } = prepare(spec);

  // Name column, then the plot. The values travel with their marks, so the plot keeps
  // room on each side for the widest value that can sit there.
  const maxCol = w * 0.26;
  const names = items.map((d) => (b.tw(d.label, "label", d.highlight) <= maxCol ? [d.label] : wrap(d.label, z.label, maxCol, d.highlight).slice(0, 2)));
  // Each name is measured in the weight it is drawn in (bold only when highlighted), so the
  // longest one starts at the left edge rather than a bold-width gap in from it.
  const col = Math.min(maxCol, Math.max(...names.flatMap((n, k) => n.map((l) => b.tw(l, "label", items[k].highlight)))));
  const r = z.dot;
  const lowW = Math.max(...items.map((d) => b.tw(val(Math.min(d.a, d.b)), "value", d.b < d.a)));
  const highW = Math.max(...items.map((d) => b.tw(val(Math.max(d.a, d.b)), "value", d.b >= d.a)));
  const pad = r + z.gap;
  const x0 = col + z.gap * 3 + lowW + pad;
  const x1 = w - highW - pad;
  const sx = linear([lo, hi], [x0, x1]);

  const keyH = b.lh("label") + 14;
  const top = keyH + 6;
  const rowH = (k: number) => Math.max(z.row, names[k].length * b.lh("label") + 10);
  let y = top;
  const rows = items.map((d, k) => {
    const h = rowH(k);
    const row = { d, k, y: y + h / 2 };
    y += h;
    return row;
  });
  const bottom = y;

  // Each row runs on a rail the width of the scale: the eye follows it from the name to the
  // marks, which a field of vertical gridlines never did.
  for (const { y: cy } of rows) b.hair(sx(lo), cy, sx(hi), cy, INK.rule);

  for (const { d, k, y: cy } of rows) {
    const xa = sx(d.a), xb = sx(d.b);
    pair(b, xa, xb, cy, r);
    const lines = names[k];
    lines.forEach((l, j) => b.text(col, cy + (j - (lines.length - 1) / 2) * b.lh("label"), l, "label", "end", { bold: d.highlight }));
    // The lower value left of its mark, the higher right of its own. The protagonist's is bold neel.
    const aLeft = d.a <= d.b;
    const off = r + z.gap - 1;
    b.text(aLeft ? Math.min(xa, xb) - off : Math.max(xa, xb) + off, cy, val(d.a), "value", aLeft ? "end" : "start", { color: INK.ink2, halo: true });
    b.text(aLeft ? Math.max(xa, xb) + off : Math.min(xa, xb) - off, cy, val(d.b), "value", aLeft ? "start" : "end", { bold: true, color: INK.neel, halo: true });
  }

  key(b, spec, x0 - r, keyH / 2);

  // A baseline under the last row, ticks hanging from it.
  b.hair(sx(lo), bottom + 4, sx(hi), bottom + 4, INK.axis);
  for (const v of ticks) b.hair(sx(v), bottom + 4, sx(v), bottom + 8, INK.axis);
  const fy = bottom + 10 + b.lh("axis") / 2;
  scale(b, spec, ticks, sx, fy);
  return b.scene(fy + b.lh("axis") / 2 + 2, spec.alt ?? `${items.length} rows comparing ${spec.ends[0]} with ${spec.ends[1]}.`);
}
