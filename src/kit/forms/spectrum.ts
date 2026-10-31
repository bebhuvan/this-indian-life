// Every member on one scale, every member named, nothing overlapping. On a wide screen the
// scale runs across and names sit in lanes above and below it on leader lines; on a phone
// the scale stands up and the names run down its right side.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { formatterFor, fmt } from "../format";
import { domain, linear } from "../scale";
import { dodgeSpans } from "../labels";

export interface SpectrumSpec extends BaseSpec {
  form: "spectrum";
  items: { label: string; value: number; highlight?: boolean }[];
  reference?: { value: number; label: string };
  /** Words for the two ends of the scale, e.g. "poorer" and "richer". */
  ends?: [string, string];
}

export function spectrum(spec: SpectrumSpec, w: number): Scene {
  return w < 620 ? ranked(spec, w) : horizontal(spec, w);
}

function horizontal(spec: SpectrumSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const vals = spec.items.map((d) => d.value);
  const val = formatterFor(vals, { unit: spec.unit, decimals: spec.decimals });
  const t = domain(vals, "fit", 6);
  const pad = 16;
  const sx = linear([t.lo, t.hi], [pad, w - pad]);
  // Lanes breathe on wide screens so the chart has presence, not a thin strip.
  const laneH = b.lh("label") + (z.cls === "l" ? 16 : 10);

  // Names go in lanes above and below the scale, neighbours alternating sides and then
  // depth, so a dense cluster fans out. Use the fewest lanes in which every name fits.
  const items = spec.items
    .map((d) => ({ ...d, x: sx(d.value), text: d.highlight ? `${d.label}  ${val(d.value)}` : d.label }))
    .sort((a, c) => a.x - c.x);
  // The named members speak at label size; the rest are set smaller, in a quieter ink.
  const roleOf = (it: { highlight?: boolean }) => (it.highlight ? "label" : "axis") as "label" | "axis";
  const widths = items.map((it) => b.tw(it.text, roleOf(it), it.highlight));
  let L = 1;
  for (; L < 8; L++) {
    const load = new Array(2 * L).fill(0);
    items.forEach((_, k) => (load[k % (2 * L)] += widths[k] + 14));
    if (Math.max(...load) <= (w - 2 * pad) * 0.82) break;
  }
  const top = spec.ends ? b.lh("note") + 14 : 4;
  const ay = top + 46 + (L - 1) * laneH + b.lh("label") / 2;

  // Ties stack upward from the axis, a dot's width apart; the axis stays a clean line.
  const groups = new Map<string, string[]>();
  for (const d of spec.items) groups.set(val(d.value), [...(groups.get(val(d.value)) ?? []), d.label]);
  const dotY = new Map<string, number>(), stackTop = new Map<string, number>();
  for (const names of groups.values()) names.forEach((n, j) => {
    dotY.set(n, ay - j * (z.dot * 2 + 2));
    stackTop.set(n, (names.length - 1) * (z.dot * 2 + 2));
  });

  b.hair(pad - 6, ay, w - pad + 6, ay, INK.axis);
  const tickY = ay + 20;
  for (const v of t.ticks) {
    if (v < t.lo || v > t.hi) continue;
    b.hair(sx(v), ay, sx(v), ay + 4, INK.axis);
  }
  if (spec.reference) {
    const rx = sx(spec.reference.value);
    b.line(rx, ay - 14, rx, ay + 6, INK.ink, 2);
    b.text(rx, tickY, `${spec.reference.label} ${val(spec.reference.value)}`, "label", "middle", { bold: true });
  }
  const inRange = t.ticks.filter((v) => v >= t.lo && v <= t.hi);
  inRange.forEach((v, k) => b.tryText([[sx(v), tickY, "middle"]], fmt(v, { decimals: 0, unit: k === inRange.length - 1 ? spec.unit : undefined }), "axis"));
  if (spec.ends) {
    b.text(pad - 6, b.lh("note") / 2 + 2, "← " + spec.ends[0], "note", "start");
    b.text(w - pad + 6, b.lh("note") / 2 + 2, spec.ends[1] + " →", "note", "end");
  }

  // Each lane spaces its own names; a leader runs from each dot to its name.
  const lanes = Array.from({ length: 2 * L }, (_, j) => {
    const side = j % 2 === 0 ? -1 : 1, k = Math.floor(j / 2);
    return { side, y: side < 0 ? ay - 40 - k * laneH : ay + 58 + k * laneH, spans: [] as { c: number; w: number; it: (typeof items)[number] }[] };
  });
  items.forEach((it, k) => lanes[k % (2 * L)].spans.push({ c: it.x, w: widths[k], it }));
  for (const ln of lanes) {
    dodgeSpans(ln.spans, 14, 0, w);
    for (const s of ln.spans) {
      const reach = ln.side < 0 ? ay - (stackTop.get(s.it.label) ?? 0) - z.dot - 2 : ay + z.dot + 2;
      const from = ln.y - ln.side * (b.lh("label") / 2 - 1);
      b.line(s.it.x, reach, s.c, from, s.it.highlight ? INK.neel : INK.stone, 1);
    }
  }
  for (const ln of lanes)
    for (const s of ln.spans) b.text(s.c, ln.y, s.it.text, roleOf(s.it), "middle", { bold: s.it.highlight, color: s.it.highlight ? INK.neel : INK.ink2, halo: true });
  for (const d of spec.items) b.circle(sx(d.value), dotY.get(d.label)!, z.dot, d.highlight ? INK.neel : INK.stoneLine);

  const H = ay + 58 + (L - 1) * laneH + b.lh("label");
  return b.scene(H, spec.alt ?? `${spec.items.length} items on one scale.`);
}

/**
 * On a phone: a ranked strip. Each row is a name, a dot on a short shared scale, and the
 * value; the reference (India) is a ruled row in its rank position. No leader lines.
 */
function ranked(spec: SpectrumSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const vals = spec.items.map((d) => d.value);
  const val = formatterFor(vals, { unit: spec.unit, decimals: spec.decimals });
  type Row = { label: string; value: number; highlight?: boolean; ref?: boolean };
  const rows: Row[] = [...spec.items].sort((a, c) => c.value - a.value);
  if (spec.reference) {
    const at = rows.findIndex((r) => r.value < spec.reference!.value);
    rows.splice(at < 0 ? rows.length : at, 0, { label: spec.reference.label, value: spec.reference.value, ref: true });
  }
  const valW = Math.max(...rows.map((r) => b.tw(val(r.value), "value", true)));
  const nameW = Math.max(...rows.map((r) => b.tw(r.label, "label", r.highlight || r.ref)));
  const scaleW = Math.max(72, Math.min(150, w - nameW - valW - z.gap * 4));
  const xs1 = w - valW - z.gap * 2, xs0 = xs1 - scaleW;
  const lo = Math.min(...vals, spec.reference?.value ?? Infinity), hi = Math.max(...vals, spec.reference?.value ?? -Infinity);
  const sx = linear([lo, hi], [xs0 + z.dot, xs1 - z.dot]);
  const rowH = b.lh("label") + 7;

  // Every row prints its value, so the strip needs no scale labels of its own.
  let y = rowH / 2 + 2;
  for (const r of rows) {
    if (r.ref) {
      b.hair(0, y - rowH / 2, w, y - rowH / 2, INK.axis);
      b.hair(0, y + rowH / 2, w, y + rowH / 2, INK.axis);
    }
    b.hair(xs0, y, xs1, y, INK.rule);
    const ink = r.ref ? INK.ink : r.highlight ? INK.neel : INK.stoneLine;
    b.circle(sx(r.value), y, z.dot, ink);
    b.text(0, y, r.label, "label", "start", { bold: r.highlight || r.ref, color: r.highlight ? INK.neel : INK.ink });
    b.text(w, y, val(r.value), "value", "end", { bold: r.highlight || r.ref, color: r.highlight ? INK.neel : r.ref ? INK.ink : INK.ink2 });
    y += rowH;
  }
  return b.scene(y - rowH / 2 + 4, spec.alt ?? `${spec.items.length} members ranked on one scale.`);
}
