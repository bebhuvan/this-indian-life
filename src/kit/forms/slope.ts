// Slopes between two or three columns, in one or more panels. Each panel keeps its own
// scale from zero; panels flow into as many columns as fit. Columns that are years sit on
// a true time scale. Every line is named at its right end with its last value; left values
// sit at the left end. Endpoint labels are dodged at least 16 px apart, with leaders.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { fmt, formatterFor } from "../format";
import { domain, linear } from "../scale";
import { dodge } from "../labels";
import { wrap } from "../text";

export interface SlopeSpec extends BaseSpec {
  form: "slope";
  /** Column headings, two or three: ["1990", "2011", "2024"]. Years are spaced in time. */
  columns: string[];
  panels: { label?: string; note?: string; series: { label: string; values: number[]; color?: string }[] }[];
  /** direction: sindoor for worse, neel for better. series: a distinct ink per line. */
  colorBy?: "direction" | "series";
  worse?: "higher" | "lower";
  /** A one-line note under the chart, in the margin voice. */
  footnote?: string;
}

// Hara is reserved for rural, so it is not a general series ink.
const SERIES_INK = [INK.neel, INK.ink, INK.plum, INK.haldi];
const LEAD = 12;

export function slope(spec: SlopeSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const all = spec.panels.flatMap((p) => p.series.flatMap((s) => s.values));
  const val = formatterFor(all, { unit: spec.unit, decimals: spec.decimals });
  const n = spec.panels.length;
  const gutter = 40;
  // Panels flow into as many columns as keep each at least 250 px wide.
  const perRow = Math.max(1, Math.min(n, Math.floor((w + gutter) / (250 + gutter))));
  const side = perRow > 1;
  const pw = (w - gutter * (perRow - 1)) / perRow;
  const plotH = z.cls === "s" ? 190 : 220;
  const gap = Math.max(16, b.lh("value"));

  // Years go on a true time scale; other headings are evenly spaced.
  const years = spec.columns.every((c) => /^\d{4}$/.test(c)) ? spec.columns.map(Number) : null;
  const at = (c: number) => (years ? (years[c] - years[0]) / (years[years.length - 1] - years[0]) : c / (spec.columns.length - 1));

  const ink = (s: { values: number[]; color?: string }, k: number) => {
    if (s.color) return s.color;
    if (spec.colorBy === "series") return SERIES_INK[k % SERIES_INK.length];
    const a = s.values[0], c = s.values[s.values.length - 1];
    if (Math.abs(c - a) < 0.5 || !spec.worse) return Math.abs(c - a) < 0.5 ? INK.ink : INK.neel;
    return (spec.worse === "higher" ? c > a : c < a) ? INK.sindoor : INK.neel;
  };

  let yBase = 0;
  let maxBottom = 0;
  spec.panels.forEach((p, pi) => {
    const X = (pi % perRow) * (pw + gutter);
    if (pi && pi % perRow === 0) yBase = maxBottom + b.lh("axis") + 30;
    let y = yBase;

    if (p.label) {
      y += b.lh("label") / 2;
      b.text(X, y, p.label, "label", "start", { bold: true });
      y += b.lh("label") / 2 + 2;
    }
    if (p.note) for (const l of wrap(p.note, z.axis, pw)) {
      y += b.lh("axis") / 2;
      b.text(X, y, l, "axis", "start");
      y += b.lh("axis") / 2;
    }
    // Column heads are printed once, over the first panel; the first row keeps their room
    // in every panel so baselines align.
    const heads = pi === 0;
    const firstRow = pi < perRow;
    const colY = y + 10 + b.lh("axis") / 2;
    const top = firstRow ? colY + b.lh("axis") / 2 + 14 : y + 14;
    const row = spec.panels.slice(pi - (pi % perRow), pi - (pi % perRow) + perRow);
    const most = Math.max(...row.map((q) => q.series.length));
    const bottom = top + Math.max(110, plotH * Math.min(1, most / 3));

    const pv = p.series.flatMap((s) => s.values);
    const t = domain(pv, "zero", 4);
    const sy = linear([t.lo, t.hi], [bottom, top]);
    const leftW = Math.max(...p.series.map((s) => b.tw(val(s.values[0]), "value")), b.tw(val(0), "axis"));
    const maxName = pw * (side ? 0.42 : 0.4);
    const names = p.series.map((s) => (b.tw(s.label, "label") <= maxName ? [s.label] : wrap(s.label, z.label, maxName).slice(0, 2)));
    const rightW = Math.max(...p.series.map((s, k) => b.tw(val(s.values[s.values.length - 1]), "value", true) + 8 + Math.max(...names[k].map((l) => b.tw(l, "label")))));
    // The end labels set the right margin; nothing is left empty past them.
    const xl = X + leftW + LEAD + 4;
    const xr = X + pw - rightW - LEAD - 4;
    const cols = spec.columns.map((_, c) => xl + (xr - xl) * at(c));

    cols.forEach((cx, c) => {
      b.hair(cx, top - 6, cx, bottom, INK.rule);
      if (heads) b.text(cx, colY, spec.columns[c], "axis", c === 0 && cols.length > 2 ? "middle" : "middle", { bold: true, color: INK.ink2 });
    });
    b.hair(xl - 4, bottom, xr + 4, bottom, INK.axis);
    // The zero tick, under the baseline at the first column, where no value label can sit.
    b.text(cols[0], bottom + 4 + b.lh("axis") / 2, fmt(0, { decimals: 0, unit: spec.unit }), "axis", "middle");

    p.series.forEach((s, k) => {
      const c = ink(s, k);
      const pts = s.values.map((v, j) => [cols[j], sy(v)]);
      b.path(pts.map(([x, yy], j) => (j ? "L" : "M") + x.toFixed(1) + "," + yy.toFixed(1)).join(""), { stroke: c, width: z.line });
      pts.forEach(([x, yy]) => b.circle(x, yy, z.dot - 0.5, c));
    });

    // Left values, dodged; a moved label hangs on a short horizontal leader.
    const L = p.series.map((s, k) => ({ k, y: sy(s.values[0]), t: sy(s.values[0]) }));
    dodge(L, gap, top - 4, bottom - 2);
    for (const l of L) {
      const s = p.series[l.k];
      const lx = xl - LEAD;
      if (Math.abs(l.y - l.t) > 2) b.path(`M${xl - z.dot - 1},${l.t.toFixed(1)}L${xl - z.dot - 4},${l.y.toFixed(1)}L${lx + 2},${l.y.toFixed(1)}`, { stroke: INK.axis, width: 1 });
      b.text(lx, l.y, val(s.values[0]), "value", "end", { color: INK.ink2 });
    }

    if (spec.columns.length === 3) p.series.forEach((s) => {
      const x = cols[1], yy = sy(s.values[1]);
      b.tryText([[x, yy - b.lh("value") / 2 - 4, "middle"], [x, yy + b.lh("value") / 2 + 4, "middle"]], val(s.values[1]), "value", { color: INK.ink2, halo: true });
    });

    // Right labels: value bold in the line's ink, then the name; dodged as blocks.
    const R = p.series.map((s, k) => ({ k, y: sy(s.values[s.values.length - 1]), t: sy(s.values[s.values.length - 1]), h: names[k].length * b.lh("label") }));
    dodge(R, Math.max(gap, Math.max(...R.map((r) => r.h)) + 2), top - 4, bottom - 2);
    for (const r of R) {
      const s = p.series[r.k], c = ink(s, r.k);
      const v = val(s.values[s.values.length - 1]);
      const vx = xr + LEAD;
      if (Math.abs(r.y - r.t) > 2) b.path(`M${xr + z.dot + 1},${r.t.toFixed(1)}L${xr + z.dot + 4},${r.y.toFixed(1)}L${vx - 2},${r.y.toFixed(1)}`, { stroke: INK.axis, width: 1 });
      b.text(vx, r.y, v, "value", "start", { bold: true, color: c });
      const nx = vx + b.tw(v, "value", true) + 8;
      names[r.k].forEach((l, j) => b.text(nx, r.y + (j - (names[r.k].length - 1) / 2) * b.lh("label"), l, "label", "start", { color: INK.ink }));
    }

    maxBottom = Math.max(maxBottom, bottom + 4 + b.lh("axis"));
  });

  let H = maxBottom + 4;
  if (spec.footnote) {
    H += 8;
    for (const l of wrap(spec.footnote, z.note, w)) {
      H += b.lh("note") / 2;
      b.text(0, H, l, "note", "start");
      H += b.lh("note") / 2;
    }
    H += 4;
  }
  return b.scene(H, spec.alt ?? `Slope chart from ${spec.columns[0]} to ${spec.columns[spec.columns.length - 1]}.`);
}
