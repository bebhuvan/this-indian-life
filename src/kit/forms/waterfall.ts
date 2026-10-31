// A bridge: each step starts where the last one ended, so the eye walks from the start to
// the net. Gains are neel, losses sindoor, the running total joined by hairlines, and the
// net set apart under a rule with its number given the display voice.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { formatterFor } from "../format";
import { linear } from "../scale";
import { wrap } from "../text";

export interface WaterfallSpec extends BaseSpec {
  form: "waterfall";
  steps: { label: string; value: number }[];
  /** A starting level drawn as a stone bar; omit to bridge a change from zero. */
  start?: { label: string; value: number };
  /** Name of the closing row (default "Net change", or "End" when there is a start). */
  endLabel?: string;
}

export function waterfall(spec: WaterfallSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const start = spec.start?.value ?? 0;
  const net = spec.steps.reduce((s, d) => s + d.value, 0);
  const end = start + net;
  const endLabel = spec.endLabel ?? (spec.start ? "End" : "Net change");
  const val = formatterFor([...spec.steps.map((d) => d.value), net], { unit: spec.unit, decimals: spec.decimals, sign: true });
  const lvl = formatterFor([start, end], { unit: spec.unit, decimals: spec.decimals });

  // Running totals, so the domain covers every level the bridge passes through.
  let run = start;
  const rows = spec.steps.map((d) => {
    const from = run;
    run += d.value;
    return { ...d, from, to: run };
  });
  const levels = [0, start, ...rows.flatMap((r) => [r.from, r.to])];
  const lo = Math.min(...levels), hi = Math.max(...levels);

  // Name column, right-aligned against the bars.
  const names = [spec.start?.label, ...spec.steps.map((d) => d.label), endLabel].filter(Boolean) as string[];
  const maxCol = w * (z.cls === "s" ? 0.38 : 0.28);
  const lines = (s: string) => (b.tw(s, "label") <= maxCol ? [s] : wrap(s, z.label, maxCol).slice(0, 2));
  const col = Math.min(maxCol, Math.max(...names.flatMap(lines).map((l) => b.tw(l, "label", true))));
  const valW = Math.max(...rows.map((r) => b.tw(val(r.value), "value", true)));
  const netText = val(net);
  const netW = b.tw(netText, "display");
  const x0 = col + z.gap * 2 + (lo < 0 ? valW + z.gap : 0);
  const x1 = w - Math.max(valW, netW) - z.gap - 2;
  const sx = linear([lo, hi], [x0, x1]);
  const rowH = (s: string) => Math.max(z.row + 4, lines(s).length * b.lh("label") + 12);

  let y = 6;
  const nameAt = (s: string, cy: number, bold = false, color: string = INK.ink) => {
    const ls = lines(s);
    ls.forEach((l, j) => b.text(col, cy + (j - (ls.length - 1) / 2) * b.lh("label"), l, "label", "end", { bold, color }));
  };

  if (spec.start) {
    const h = rowH(spec.start.label), cy = y + h / 2;
    b.rect(sx(0), cy - z.bar / 2, sx(start) - sx(0), z.bar, INK.stone);
    nameAt(spec.start.label, cy);
    b.text(sx(start) + z.gap, cy, lvl(start), "value", "start", { color: INK.ink2 });
    b.hair(sx(start), cy + z.bar / 2, sx(start), cy + h - z.bar / 2 + 2, INK.stoneLine);
    y += h;
  }

  rows.forEach((r, k) => {
    const h = rowH(r.label), cy = y + h / 2;
    const a = sx(Math.min(r.from, r.to)), e = sx(Math.max(r.from, r.to));
    const gain = r.value >= 0;
    // A step too small to see still gets a visible tick, never a missing bar.
    b.rect(a, cy - z.bar / 2, Math.max(e - a, 2), z.bar, gain ? INK.neel : INK.sindoor);
    b.reserve({ x: a, y: cy - z.bar / 2, w: Math.max(e - a, 2), h: z.bar });
    nameAt(r.label, cy, k === 0 && Math.abs(r.value) === Math.max(...rows.map((q) => Math.abs(q.value))));
    const text = val(r.value), color = gain ? INK.ink : INK.sindoor;
    const left: [number, number, "end"] = [a - z.gap, cy, "end"], right: [number, number, "start"] = [Math.max(e, a + 2) + z.gap, cy, "start"];
    b.tryText(gain ? [right, left] : [left, right], text, "value", { bold: true, color });
    // Connector to the next row at the new running total.
    if (k < rows.length - 1) b.hair(sx(r.to), cy + z.bar / 2, sx(r.to), cy + h / 2 + rowH(rows[k + 1].label) / 2 - z.bar / 2, INK.stoneLine);
    y += h;
  });

  // The net, under a rule: an ink bar from zero (or the start) and its number in display type.
  // A quiet rule under the plot only, with air either side.
  y += 10;
  b.hair(x0 - z.gap, y, w, y, INK.axis);
  y += 10;
  const h = Math.max(rowH(endLabel), b.lh("display") + 10), cy = y + h / 2;
  const base = spec.start ? 0 : 0;
  const a = sx(Math.min(base, end)), e = sx(Math.max(base, end));
  b.rect(a, cy - z.bar / 2, Math.max(e - a, 2), z.bar, end < base ? INK.sindoor : INK.ink);
  nameAt(endLabel, cy, true);
  const shown = spec.start ? lvl(end) : netText;
  b.tryText([[e + z.gap, cy, "start"], [a - z.gap, cy, "end"]], shown, "display", { color: end < 0 ? INK.sindoor : INK.ink });
  b.hair(sx(0), 2, sx(0), y - 20, INK.axis);

  return b.scene(y + h + 2, spec.alt ?? `Bridge from ${spec.start ? lvl(start) : "zero"} through ${rows.length} steps to ${shown}.`);
}
