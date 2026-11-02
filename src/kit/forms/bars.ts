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
  items: { label: string; value: number; highlight?: boolean }[];
  sort?: "desc" | "asc" | "none";
  reference?: { value: number; label: string };
}

export function bars(spec: BarsSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const items = [...spec.items];
  if (spec.sort !== "none") items.sort((a, c) => (spec.sort === "asc" ? a.value - c.value : c.value - a.value));
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
  const names = items.map((d) => (b.tw(d.label, "label") <= maxCol ? [d.label] : stacked ? wrap(d.label, z.label, maxCol) : wrap(d.label, z.label, maxCol).slice(0, 2)));
  const col = stacked ? 0 : Math.min(maxCol, Math.max(...names.flat().map((l) => b.tw(l, "label"))));
  const rowH = (k: number) => (stacked ? names[k].length * b.lh("label") + 6 + z.bar + 14 : Math.max(z.row, names[k].length * b.lh("label") + 10));

  // Room for values on both sides, so no label leaves the frame or meets the names.
  const posW = Math.max(0, ...items.filter((d) => d.value >= 0).map((d) => b.tw(val(d.value), "value", true)));
  const negW = Math.max(0, ...items.filter((d) => d.value < 0).map((d) => b.tw(val(d.value), "value", true)));
  const lo = Math.min(0, ...values), hi = Math.max(0, ...values, spec.reference?.value ?? 0);
  const x0 = (stacked ? 0 : col + z.gap * 2) + (neg ? negW + z.gap : 0);
  const x1 = w - posW - z.gap - 2;
  const sx = linear([lo, hi], [x0, x1]);

  const top = spec.reference ? b.lh("note") + 10 : 4;
  let y = top;
  const rows = items.map((d, k) => {
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

  // The zero line; on a phone only beside each bar, so it never cuts through a name.
  if (stacked) for (const r of rows) b.hair(sx(0), r.y - z.bar / 2 - 4, sx(0), r.y + z.bar / 2 + 4, INK.axis);
  else b.hair(sx(0), top - 4, sx(0), bottom + 2, INK.axis);

  if (spec.reference) {
    const rx = sx(spec.reference.value);
    b.hair(rx, top - 4, rx, bottom + 2, INK.axis);
    b.tryText([[rx, top - 8 - b.lh("note") / 2 + 4, "middle"], [rx + 4, top - 8 - b.lh("note") / 2 + 4, "start"], [rx - 4, top - 8 - b.lh("note") / 2 + 4, "end"]], spec.reference.label, "note");
  }

  return b.scene(bottom + 4, spec.alt ?? `Bar chart of ${items.length} items, ${items[0].label} ${val(items[0].value)} first.`);
}
