// Columns over ordered categories. When there is room, each value sits on its column (the
// largest in the display voice) and no value axis is drawn; when there is not, a quiet axis
// returns and only the ends and the extremes keep their numbers. Category names sit just
// under the baseline; only a column that falls below zero claims space beneath it.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { fmt, formatterFor } from "../format";
import { bands, domain, linear } from "../scale";

export interface ColumnsSpec extends BaseSpec {
  form: "columns";
  items: { label: string; value: number; highlight?: boolean }[];
  reference?: { value: number; label: string };
  /** Margin notes under the first and last categories, e.g. "Poorest tenth". */
  ends?: [string, string];
}

export function columns(spec: ColumnsSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const items = spec.items;
  const values = items.map((d) => d.value);
  const val = formatterFor(values, { unit: spec.unit, decimals: spec.decimals });
  const bare = formatterFor(values, { decimals: spec.decimals });
  // The unit rides on the first value only, the way a table states it once.
  const label = (v: number, i: number) => (i === 0 ? val(v) : bare(v));
  const anyHi = items.some((d) => d.highlight);
  const t = domain([...values, spec.reference?.value ?? 0], "zero", z.cls === "s" ? 4 : 5);
  const iMax = values.indexOf(Math.max(...values));

  const refText = spec.reference ? `${spec.reference.label} ${val(spec.reference.value)}` : "";
  const margin = spec.reference && z.cls !== "s" ? b.tw(refText, "note") + z.gap * 2 : 0;

  // Values on every column if they fit, else a quiet axis with only the extremes labelled.
  const tickText = (v: number, k: number) => fmt(v, { decimals: 0, unit: k === t.ticks.length - 1 ? spec.unit : undefined, grouping: spec.unit?.startsWith("₹") ? "in" : undefined });
  const tickW = Math.max(...t.ticks.map((v, k) => b.tw(tickText(v, k), "axis")));
  let B = bands(items.length, [0, w - margin], 0.46);
  let labelled = items.length <= 12 && values.every((v, i) => b.tw(label(v, i), i === iMax ? "display" : "value") <= B.step - 6);
  if (!labelled) B = bands(items.length, [tickW + z.gap, w - margin], 0.3);

  // Vertical layout: a fixed height above zero; below it only what a loss needs.
  const plotH = z.cls === "s" ? 210 : z.cls === "m" ? 240 : 270;
  const top = labelled ? b.lh("display") + 8 : b.lh("axis") + 4;
  const hi = labelled ? Math.max(...values, spec.reference?.value ?? 0, 1e-9) : t.hi;
  const z0 = top + plotH;
  const sy = linear([0, hi], [z0, top]);
  const catGap = 8;

  if (!labelled) {
    t.ticks.forEach((v, k) => {
      if (v <= 0) return;
      b.hair(B.at(0) - 4, sy(v), w - margin, sy(v), INK.rule);
      b.text(0, sy(v), tickText(v, k), "axis", "start");
    });
  }

  items.forEach((d, i) => {
    const x = B.at(i);
    const neg = d.value < 0;
    const ink = neg ? INK.sindoor : !anyHi || d.highlight ? INK.neel : INK.stone;
    const y0 = Math.min(sy(d.value), z0), y1 = Math.max(sy(d.value), z0);
    b.rect(x, y0, B.width, Math.max(y1 - y0, 1.5), ink);
    b.reserve({ x, y: y0, w: B.width, h: y1 - y0 });
  });

  // The reference: a solid hairline (dots are for estimates), its note in the margin voice.
  const xe = B.at(items.length - 1) + B.width + 6;
  if (spec.reference) {
    const ry = sy(spec.reference.value);
    b.hair(B.at(0) - 6, ry, xe, ry, INK.axis);
    if (margin) b.text(xe + z.gap, ry, refText, "note", "start");
  }

  // Values: on each column, below a loss; or only the ends and extremes when unlabelled.
  const extremes = new Set([0, items.length - 1, iMax, values.indexOf(Math.min(...values))]);
  const under: number[] = items.map(() => z0);
  items.forEach((d, i) => {
    if (!labelled && !extremes.has(i) && !d.highlight) return;
    const cx = B.at(i) + B.width / 2, neg = d.value < 0;
    const role = labelled && i === iMax ? "display" : "value";
    const lhR = b.lh(role);
    const y = neg ? sy(d.value) + lhR / 2 + 4 : sy(d.value) - lhR / 2 - 3;
    const text = labelled ? label(d.value, i) : val(d.value);
    const box = b.tryText([[cx, y, "middle"], [B.at(i) + B.width, y, "end"], [B.at(i), y, "start"]], text, role, { color: neg ? INK.sindoor : role === "display" ? INK.neel : INK.ink, bold: role === "value", halo: true });
    if (neg) under[i] = box ? box.y + box.h : sy(d.value);
  });
  items.forEach((d, i) => {
    if (d.value < 0) under[i] = Math.max(under[i], sy(d.value));
  });

  // Narrow: the reference note sits over its line at the right.
  if (spec.reference && !margin) {
    const ry = sy(spec.reference.value);
    const ex = Math.min(xe, w);
    b.tryText([[ex, ry - b.lh("note") / 2 - 3, "end"], [ex, ry + b.lh("note") / 2 + 3, "end"], [B.at(0), ry - b.lh("note") / 2 - 3, "start"]], refText, "note", { halo: true });
  }

  // Baseline, then category names 8 px under it (or under a loss and its value).
  b.line(B.at(0) - 6, z0, xe, z0, INK.ink, 1);
  const every = Math.max(1, Math.ceil((Math.max(...items.map((d) => b.tw(d.label, "axis"))) + 6) / B.step));
  let bottom = z0;
  const catY: number[] = [];
  items.forEach((d, i) => {
    const y = under[i] + catGap + b.lh("axis") / 2;
    catY[i] = y;
    if (i % every && i !== items.length - 1) return;
    b.text(B.at(i) + B.width / 2, y, d.label, "axis", "middle");
    bottom = Math.max(bottom, y + b.lh("axis") / 2);
  });
  if (spec.ends) {
    const last = items.length - 1;
    const y0 = catY[0] + b.lh("axis") / 2 + 4 + b.lh("note") / 2;
    const y1 = catY[last] + b.lh("axis") / 2 + 4 + b.lh("note") / 2;
    b.tryText([[B.at(0), y0, "start"]], spec.ends[0], "note");
    b.tryText([[B.at(last) + B.width, y1, "end"]], spec.ends[1], "note");
    bottom = Math.max(bottom, y0 + b.lh("note") / 2, y1 + b.lh("note") / 2);
  }

  return b.scene(bottom + 4, spec.alt ?? `Columns for ${items.length} groups, from ${val(values[0])} to ${val(values[values.length - 1])}.`);
}
