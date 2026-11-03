// Ranked or signed horizontal bars. Names sit right-aligned against the bars, values at
// the bar ends; no value axis is drawn because every bar is labelled. Losses are sindoor.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { formatterFor } from "../format";
import { linear } from "../scale";
import { wrap } from "../text";

export interface BarsSpec extends BaseSpec {
  form: "bars";
  /** `group` sets bars under a heading per group (regions, then states), each group
   *  sorted within itself, groups in the order they first appear. */
  items: { label: string; value: number; highlight?: boolean; group?: string }[];
  sort?: "desc" | "asc" | "none";
  reference?: { value: number; label: string };
}

export function bars(spec: BarsSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const order = (a: { value: number }, c: { value: number }) => (spec.sort === "asc" ? a.value - c.value : c.value - a.value);
  const groupNames = [...new Set(spec.items.map((d) => d.group).filter((g): g is string => !!g))];
  const grouped = groupNames.length > 1;
  const items = grouped
    ? groupNames.flatMap((g) => spec.items.filter((d) => d.group === g).sort((a, c) => (spec.sort === "none" ? 0 : order(a, c)))).concat(spec.items.filter((d) => !d.group))
    : [...spec.items];
  if (!grouped && spec.sort !== "none") items.sort(order);
  // Where each group starts, for its heading.
  const heads = new Map<number, string>();
  if (grouped) items.forEach((d, k) => { if (d.group && (k === 0 || items[k - 1].group !== d.group)) heads.set(k, d.group); });
  const headH = b.lh("label") + 14;
  const values = items.map((d) => d.value);
  const neg = values.some((v) => v < 0);
  const val = formatterFor(values, { unit: spec.unit, decimals: spec.decimals, sign: neg });
  const anyHi = items.some((d) => d.highlight);

  // Wide: a name column, as wide as the names need up to 30% of the width, longer names
  // wrapping. Phone: each name sits above its bar and the bars take the full width.
  const stacked = z.cls === "s";
  const maxCol = stacked ? w : w * 0.3;
  // On a phone a name longer than the width wraps onto further lines above its bar, so it
  // never runs out of the frame.
  const names = items.map((d) => (b.tw(d.label, "label") <= maxCol ? [d.label] : stacked ? wrap(d.label, z.label, maxCol) : wrap(d.label, z.label, maxCol)));
  // Every word kept: the column holds a word too long to break.
  const col = stacked ? 0 : Math.max(...names.flat().map((l) => b.tw(l, "label")));
  const rowH = (k: number) => (stacked ? names[k].length * b.lh("label") + 6 + z.bar + 14 : Math.max(z.row, names[k].length * b.lh("label") + 10));

  // Room for values on both sides, so no label leaves the frame or meets the names.
  const posW = Math.max(0, ...items.filter((d) => d.value >= 0).map((d) => b.tw(val(d.value), "value", true)));
  const negW = Math.max(0, ...items.filter((d) => d.value < 0).map((d) => b.tw(val(d.value), "value", true)));
  const lo = Math.min(0, ...values), hi = Math.max(0, ...values, spec.reference?.value ?? 0);
  const x0 = (stacked ? 0 : col + z.gap * 2) + (neg ? negW + z.gap : 0);
  const x1 = w - posW - z.gap - 2;
  const sx = linear([lo, hi], [x0, x1]);

  const capLines = spec.unitLabel ? wrap(spec.unitLabel, z.axis, w) : [];
  const capH = capLines.length ? capLines.length * b.lh("axis") + 6 : 0;
  capLines.forEach((l, k) => b.text(0, b.lh("axis") / 2 + k * b.lh("axis"), l, "axis", "start", { color: INK.ink2 }));
  const top = capH + (spec.reference ? b.lh("note") + 10 : 4);
  let y = top;
  const headAt: Array<{ y: number; label: string }> = [];
  const rows = items.map((d, k) => {
    // A group heading: a hairline across the figure, the group's name under it.
    if (heads.has(k)) {
      headAt.push({ y: y + (k ? 8 : 0), label: heads.get(k)! });
      y += headH + (k ? 8 : 0);
    }
    const h = rowH(k);
    const r = { d, k, y: stacked ? y + names[k].length * b.lh("label") + 6 + z.bar / 2 : y + h / 2, nameY: y + b.lh("label") / 2 };
    y += h;
    return r;
  });
  const bottom = y;

  for (const { d, k, y: cy, nameY } of rows) {
    const ink = d.value < 0 ? INK.sindoor : !anyHi || d.highlight ? INK.neel : INK.stone;
    const a = sx(Math.min(0, d.value)), e = sx(Math.max(0, d.value));
    // A value too small to see still gets a 2 px stub in its own ink.
    b.rect(a, cy - z.bar / 2, Math.max(e - a, 2), z.bar, ink);
    const lines = names[k];
    if (stacked) lines.forEach((l, j) => b.text(0, nameY + j * b.lh("label"), l, "label", "start", { bold: d.highlight }));
    else lines.forEach((l, j) => b.text(col, cy + (j - (lines.length - 1) / 2) * b.lh("label"), l, "label", "end", { bold: d.highlight }));
    // Gains and losses take the same weight; only the protagonist is set bold.
    const v = val(d.value);
    const strong = !anyHi || !!d.highlight;
    if (d.value >= 0) b.text(e + z.gap, cy, v, "value", "start", { bold: strong, color: strong ? INK.ink : INK.ink2 });
    else b.text(a - z.gap, cy, v, "value", "end", { bold: strong, color: INK.sindoor });
  }

  for (const g of headAt) {
    b.hair(0, g.y, w, g.y, INK.rule);
    b.text(0, g.y + 6 + b.lh("label") / 2, g.label, "label", "start", { bold: true, color: INK.ink2 });
  }

  // The zero line; on a phone only beside each bar, so it never cuts through a name.
  if (stacked || grouped) for (const r of rows) b.hair(sx(0), r.y - z.bar / 2 - 4, sx(0), r.y + z.bar / 2 + 4, INK.axis);
  else b.hair(sx(0), top - 4, sx(0), bottom + 2, INK.axis);

  if (spec.reference) {
    const rx = sx(spec.reference.value);
    b.hair(rx, top - 4, rx, bottom + 2, INK.axis);
    b.tryText([[rx, top - 8 - b.lh("note") / 2 + 4, "middle"], [rx + 4, top - 8 - b.lh("note") / 2 + 4, "start"], [rx - 4, top - 8 - b.lh("note") / 2 + 4, "end"]], spec.reference.label, "note");
  }

  return b.scene(bottom + 4, spec.alt ?? `Bar chart of ${items.length} items, ${items[0].label} ${val(items[0].value)} first.`);
}
