// Two values per row, joined by a stone connector. The first end is an open ring, the
// second (the protagonist) a solid neel dot. The two ends are named once, in place, above
// the first row; there is no legend and no second set of column heads.

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
  const hi = spec.unit === "%" && Math.max(...all) > 85 ? 100 : t.hi;
  const ticks = t.ticks.filter((v) => v >= t.lo && v <= hi);
  if (hi === 100 && ticks[ticks.length - 1] !== 100) ticks.push(100);
  return { items, val, lo: t.lo, hi, ticks };
}

function pair(b: Builder, xa: number, xb: number, cy: number, r: number) {
  const dir = Math.sign(xb - xa) || 1;
  if (Math.abs(xb - xa) > r * 2 + 2) b.line(xa + dir * (r + 1), cy, xb - dir * (r + 1), cy, INK.stoneLine, 2, undefined, "butt");
  b.circle(xa, cy, r - 0.5, INK.ground, INK.ink2, 1.5);
  b.circle(xb, cy, r + 0.5, INK.neel);
  b.reserve({ x: Math.min(xa, xb) - r - 2, y: cy - r - 2, w: Math.abs(xb - xa) + r * 2 + 4, h: r * 2 + 4 });
}

/** The two ends named once, in place, above the first row's marks. */
function ends(b: Builder, spec: DumbbellSpec, xa: number, xb: number, y: number) {
  const left = xa < xb;
  b.tryText([[xa + (left ? 2 : -2), y, left ? "end" : "start"], [xa, y, "middle"]], spec.ends[0].toLowerCase(), "axis", { color: INK.ink2 });
  b.tryText([[xb + (left ? -2 : 2), y, left ? "start" : "end"], [xb, y, "middle"]], spec.ends[1].toLowerCase(), "axis", { bold: true, color: INK.neel });
}

function scale(b: Builder, spec: DumbbellSpec, ticks: number[], sx: (v: number) => number, y: number) {
  ticks.forEach((v, k) => {
    const s = fmt(v, { decimals: 0, unit: k === ticks.length - 1 ? spec.unit : undefined });
    b.tryText([[sx(v), y, k === 0 ? "start" : k === ticks.length - 1 ? "end" : "middle"]], s, "axis", {}, 6);
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
  const rowH = lh + 24;
  const legend = b.lh("axis") + 4;
  const top = legend + 2;
  const bottom = top + items.length * rowH;

  for (const v of ticks) b.hair(sx(v), top, sx(v), bottom, INK.rule);

  // On a phone the value columns name the two ends; they are the only set of headers.
  const colB = Math.max(...items.map((d) => b.tw(val(d.b), "value", true)), b.tw(spec.ends[1].toLowerCase(), "axis", true));
  const xA = w - colB - 10;
  b.text(xA, top - legend / 2 + 1, spec.ends[0].toLowerCase(), "axis", "end", { color: INK.ink2 });
  b.text(w, top - legend / 2 + 1, spec.ends[1].toLowerCase(), "axis", "end", { bold: true, color: INK.neel });
  items.forEach((d, k) => {
    const ty = top + k * rowH + lh / 2 + 2;
    const cy = ty + lh / 2 + 11;
    b.text(0, ty, d.label, "label", "start", { bold: d.highlight, halo: true });
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

  // Name column, then the plot, then the two values in a compact column.
  const maxCol = w * 0.24;
  const names = items.map((d) => (b.tw(d.label, "label") <= maxCol ? [d.label] : wrap(d.label, z.label, maxCol).slice(0, 2)));
  const col = Math.min(maxCol, Math.max(...names.flat().map((l) => b.tw(l, "label", true))));
  const colW = Math.max(...items.flatMap((d) => [b.tw(val(d.a), "value"), b.tw(val(d.b), "value", true)]));
  const xB = w;
  const xA = xB - colW - 18;
  const x0 = col + z.gap * 2 + z.dot + 2;
  const x1 = xA - colW - 28;
  const sx = linear([lo, hi], [x0, x1]);

  const legend = b.lh("axis") + 8;
  const top = legend;
  const rowH = (k: number) => Math.max(z.row, names[k].length * b.lh("label") + 8);
  let y = top;
  const rows = items.map((d, k) => {
    const h = rowH(k);
    const r = { d, k, y: y + h / 2 };
    y += h;
    return r;
  });
  const bottom = y;

  for (const v of ticks) b.hair(sx(v), top, sx(v), bottom + 2, INK.rule);

  for (const { d, k, y: cy } of rows) {
    pair(b, sx(d.a), sx(d.b), cy, z.dot);
    const lines = names[k];
    lines.forEach((l, j) => b.text(col, cy + (j - (lines.length - 1) / 2) * b.lh("label"), l, "label", "end", { bold: d.highlight }));
    b.text(xA, cy, val(d.a), "value", "end", { color: INK.ink2 });
    b.text(xB, cy, val(d.b), "value", "end", { bold: true, color: INK.neel });
  }

  if (rows[0]) ends(b, spec, sx(rows[0].d.a), sx(rows[0].d.b), top - legend / 2);

  const fy = bottom + 2 + b.lh("axis") / 2 + 4;
  scale(b, spec, ticks, sx, fy);
  return b.scene(fy + b.lh("axis") / 2 + 2, spec.alt ?? `${items.length} rows comparing ${spec.ends[0]} with ${spec.ends[1]}.`);
}
