// One value across ordered groups: growth by decile, consumption by percentile. A single
// series is a line of dots with every point labelled;
// several series are named at their ends, the lead in neel and the rest in stone. Reference
// levels (a poverty line, an average) are dotted rules with a note in the margin voice.

import type { BaseSpec, Scene } from "../types";
import { Builder, polyline } from "../builder";
import { INK } from "../theme";
import { fmt, formatterFor } from "../format";
import { domain, linear, type DomainPolicy } from "../scale";
import { dodge } from "../labels";

export interface CurveSpec extends BaseSpec {
  form: "curve";
  /** The ordered groups. `x` places them unevenly (e.g. the 95th percentile). */
  groups: { label: string; x?: number }[];
  series: { label: string; values: number[]; role?: "lead" | "compare" | "context"; dotted?: boolean }[];
  references?: { value: number; label: string; color?: string }[];
  /** Margin notes under the first and last groups. */
  ends?: [string, string];
  domain?: DomainPolicy;
}

export function curve(spec: CurveSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const S = spec.series;
  const single = S.length === 1;
  const all = S.flatMap((s) => s.values);
  const refs = spec.references ?? [];
  const val = formatterFor(all, { unit: spec.unit, decimals: spec.decimals });
  const bare = formatterFor(all, { decimals: spec.decimals });
  const t = domain([...all, ...refs.map((r) => r.value)], spec.domain ?? "zero", z.cls === "s" ? 4 : 5);
  const tickDec = Math.max(0, Math.min(2, -Math.floor(Math.log10(t.step) + 1e-9)));
  const roles = S.map((s, i) => s.role ?? (i === S.length - 1 ? "lead" : "context"));
  const inks = roles.map((r) => (r === "lead" ? INK.neel : r === "compare" ? INK.ink : INK.stoneLine));

  // Right margin: series names for several series; reference notes when there is room.
  const refText = (r: { label: string }) => r.label;
  const nameW = single ? 0 : Math.max(...S.map((s, i) => b.tw(`${s.label}  ${val(s.values[s.values.length - 1])}`, "label", roles[i] === "lead")));
  const refW = refs.length ? Math.max(...refs.map((r) => b.tw(refText(r), "note"))) : 0;
  const margin = Math.max(nameW, z.cls === "s" ? 0 : refW) + z.gap * 2;

  const H = z.cls === "s" ? 320 : z.cls === "m" ? 360 : 400;
  const top = b.lh("axis") + (single ? b.lh("value") + 6 : 8);
  const catH = b.lh("axis") + (spec.ends ? b.lh("note") + 4 : 0) + 12;
  const bottom = H - catH;
  const xs = spec.groups.map((g, i) => g.x ?? i);
  const inset = single ? b.tw(val(S[0].values[0]), "value", true) / 2 + 4 : 10;
  const x0 = inset, x1 = w - margin - (single ? inset : 6);
  const sx = linear([Math.min(...xs), Math.max(...xs)], [x0, x1]);
  const sy = linear([t.lo, t.hi], [bottom, top]);

  // Gridlines, with their labels sitting on top at the left edge.
  for (const v of t.ticks) b.hair(0, sy(v), w - margin, sy(v), v === 0 ? INK.axis : INK.rule);

  // References: solid hairlines (dots are for estimates), named in the margin voice.
  for (const r of refs) b.hair(0, sy(r.value), w - margin, sy(r.value), INK.axis);

  // Lines, context first.
  const order = S.map((_, i) => i).sort((a, c) => (roles[a] === "lead" ? 1 : 0) - (roles[c] === "lead" ? 1 : 0));
  for (const i of order) {
    const pts = S[i].values.map((v, k) => [sx(xs[k]), sy(v)] as [number, number]);
    const width = roles[i] === "lead" ? z.line + 0.25 : roles[i] === "compare" ? z.line : z.lineCtx + 0.25;
    b.path(polyline(pts), S[i].dotted ? { stroke: inks[i], width: width + 0.75, dash: `0 ${Math.round(width * 2.6)}` } : { stroke: inks[i], width });
    for (const [x, y] of pts) b.reserve({ x: x - 3, y: y - 3, w: 6, h: 6 });
    if (single || roles[i] === "lead") {
      S[i].values.forEach((v, k) => {
        const neg = v < 0;
        b.circle(pts[k][0], pts[k][1], z.dot, neg ? INK.sindoor : inks[i]);
        if (single) b.circle(pts[k][0], pts[k][1], z.dot + 2.5, undefined, INK.ground, 1.5);
      });
    }
  }

  // Tick labels over their gridlines.
  t.ticks.forEach((v, k) => {
    if (v === t.lo && v > 0) return;
    b.text(0, sy(v) - b.lh("axis") / 2 - 2, fmt(v, { decimals: tickDec, unit: k === t.ticks.length - 1 ? spec.unit : undefined, grouping: spec.unit?.startsWith("₹") ? "in" : undefined }), "axis", "start", { halo: true });
  });

  // Reference notes: in the margin when wide, else above their rule at the right.
  for (const r of refs) {
    const y = sy(r.value);
    if (z.cls !== "s") b.tryText([[w - margin + z.gap, y, "start"], [w - margin - 4, y - b.lh("note") / 2 - 2, "end"]], refText(r), "note", { color: r.color });
    else {
      const up = y - b.lh("note") / 2 - 2, dn = y + b.lh("note") / 2 + 2;
      b.tryText([[w - margin, up, "end"], [w - margin, dn, "end"], [0, dn, "start"], [0, up, "start"], [(w - margin) / 2, dn, "middle"]], refText(r), "note", { color: r.color, halo: true });
    }
  }

  // Single series: every point labelled, above (below for a loss), nudged clear of the rest.
  if (single) {
    S[0].values.forEach((v, k) => {
      const x = sx(xs[k]), y = sy(v), neg = v < 0, off = z.dot + 4 + b.lh("value") / 2;
      const up: Array<[number, number, "middle" | "start" | "end"]> = [[x, y - off, "middle"], [x + 4, y - off, "start"], [x - 4, y - off, "end"]];
      const down: Array<[number, number, "middle" | "start" | "end"]> = [[x, y + off, "middle"], [x + 4, y + off, "start"], [x - 4, y + off, "end"]];
      // The unit rides on the first label only.
      const text = k === 0 ? val(v) : bare(v);
      b.tryText(neg ? [...down, ...up] : [...up, ...down], text, "value", { bold: k === 0 || neg, color: neg ? INK.sindoor : INK.ink, halo: true });
    });
  }

  // Several series: names at their ends, dodged.
  if (!single) {
    const ends = S.map((s, i) => ({ i, y: sy(s.values[s.values.length - 1]), target: sy(s.values[s.values.length - 1]) }));
    dodge(ends, b.lh("label") + 2, top, bottom);
    const lx = x1 + z.gap * 1.5;
    for (const e of ends) {
      const s = S[e.i], lead = roles[e.i] === "lead";
      if (Math.abs(e.y - e.target) > 3) b.line(x1 + 3, e.target, lx - 3, e.y, INK.axis, 1);
      b.text(lx, e.y, s.label, "label", "start", { bold: lead, color: lead ? INK.neel : roles[e.i] === "compare" ? INK.ink : INK.ink2 });
      b.text(lx + b.tw(s.label + "  ", "label", lead), e.y, val(s.values[s.values.length - 1]), "label", "start", { bold: true, color: lead ? INK.neel : INK.ink2 });
    }
  }

  // Group labels, thinned to fit, with margin notes under the ends.
  const lw = Math.max(...spec.groups.map((g) => b.tw(g.label, "axis")));
  const minStep = Math.min(...xs.slice(1).map((x, i) => sx(x) - sx(xs[i])));
  const every = Math.max(1, Math.ceil((lw + 8) / minStep));
  spec.groups.forEach((g, k) => {
    if (k % every && k !== spec.groups.length - 1) return;
    const gy = bottom + 8 + b.lh("axis") / 2;
    b.tryText([[sx(xs[k]), gy, "middle"], [sx(xs[k]) - 4, gy, "start"], [sx(xs[k]) + 4, gy, "end"]], g.label, "axis");
  });
  if (spec.ends) {
    const ny = bottom + 12 + b.lh("axis") + b.lh("note") / 2;
    b.tryText([[sx(xs[0]) - inset, ny, "start"]], spec.ends[0], "note");
    b.tryText([[sx(xs[xs.length - 1]) + (single ? inset : 0), ny, "end"]], spec.ends[1], "note");
  }

  return b.scene(H, spec.alt ?? `${S.map((s) => s.label).join(", ")} across ${spec.groups.length} groups.`);
}
