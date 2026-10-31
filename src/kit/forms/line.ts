// Lines over time. Every series is named at its end, never in a legend; context series
// are named too, in a quieter ink. Handles a few points or thousands. Events are marked
// with a hairline and a note; a projection is dashed on a faint ground.

import type { BaseSpec, Scene } from "../types";
import { Builder, polyline } from "../builder";
import { INK, fixedInk } from "../theme";
import { domain, linear, yearOf, yearTicks, type DomainPolicy } from "../scale";
import { fmt, formatterFor } from "../format";
import { dodge } from "../labels";
import { wrap } from "../text";

export interface LineSeries {
  label: string;
  points: { date: string; value: number }[];
  /** lead: the story's line. compare: a named peer. context: background, quiet ink. */
  role?: "lead" | "compare" | "context";
  color?: string;
  /** Points after this date are estimates and are dashed. */
  projectedAfter?: string;
}

export interface LineSpec extends BaseSpec {
  form: "line";
  series: LineSeries[];
  domain?: DomainPolicy;
  annotations?: { date: string; label: string }[];
  /** The one number the chart is about: a point on a series, set large, with a note. */
  callout?: { series?: number; date: string; note?: string };
}

// Hara is reserved for rural, so it is not a general comparison ink.
const COMPARE = [INK.ink, INK.plum, INK.haldi, INK.ink2];
const isDate = (d: string) => /^\d{4}(-\d{2}){0,2}$/.test(d);

export function line(spec: LineSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const S = spec.series;
  const all = S.flatMap((s) => s.points.map((p) => p.value));

  // Roles and inks.
  let ci = 0;
  const roles = S.map((s, i) => s.role ?? (i === 0 ? "lead" : S.length > 4 ? "context" : "compare"));
  const inks = S.map((s, i) => s.color ?? fixedInk(s.label) ?? (roles[i] === "lead" ? INK.neel : roles[i] === "context" ? INK.stoneLine : COMPARE[ci++ % COMPARE.length]));

  // The x axis: real time when the dates are dates, otherwise ordered categories.
  const timeAxis = S.every((s) => s.points.every((p) => isDate(p.date)));
  const cats = timeAxis ? [] : [...new Set(S.flatMap((s) => s.points.map((p) => p.date)))];
  const xv = (d: string) => (timeAxis ? yearOf(d) : cats.indexOf(d));
  const xs = S.flatMap((s) => s.points.map((p) => xv(p.date)));
  const xmin = Math.min(...xs), xmax = Math.max(...xs);

  // Value scale and formats.
  const policy = spec.domain ?? (Math.min(...all) >= 0 && spec.unit !== "index" ? "zero" : "fit");
  const yt = domain(all, policy, z.cls === "s" ? 4 : 5);
  const val = formatterFor(all, { unit: spec.unit, decimals: spec.decimals });
  const tickDecimals = Math.max(0, Math.min(2, -Math.floor(Math.log10(yt.step) + 1e-9)));
  const tick = (v: number, top: boolean) => fmt(v, { decimals: tickDecimals, unit: top ? spec.unit : undefined });

  // End labels. Wide: a name column (wrapping once at most) and every last value
  // right-aligned in one column at the edge. Phone: only the values keep a narrow gutter,
  // so no number is ever dropped; the names move inside the plot, where their own line
  // has clear space, and the lines run nearly edge to edge.
  const inside = z.cls === "s";
  const vW = Math.max(...S.map((s) => b.tw(val(s.points[s.points.length - 1].value), "label", true)));
  const maxName = z.cls === "m" ? w * 0.2 : w * 0.17;
  const blocks = S.map((s, i) => {
    const last = s.points[s.points.length - 1];
    const v = val(last.value);
    const lines = inside || b.tw(s.label, "label") <= maxName ? [s.label] : wrap(s.label, z.label, maxName).slice(0, 2);
    const nameW = inside ? 0 : Math.max(...lines.map((l) => b.tw(l, "label")));
    return { i, last, v, lines, nameW, h: lines.length * b.lh("label"), y: 0 };
  });
  const gutter = inside ? vW + z.gap * 2 : Math.max(...blocks.map((k) => k.nameW)) + vW + z.gap * 4;

  // Geometry.
  // Phones get a taller frame so slopes keep their angle and the chart has presence.
  const ratio = z.cls === "s" ? 0.9 : z.cls === "m" ? 0.56 : 0.44;
  const annRows = spec.annotations?.length ? (z.cls === "s" ? 2 : 1) : 0;
  const top = b.lh("axis") + 6 + annRows * (b.lh("note") + 2);
  const H = Math.max(240, Math.min(480, Math.round(w * ratio))) + annRows * b.lh("note");
  const bottom = H - b.lh("axis") - 10;
  const x0 = 0, x1 = w - gutter;
  const sx = linear([xmin, xmax], [x0, x1]);
  const sy = linear([yt.lo, yt.hi], [bottom, top]);

  // Gridlines and the baseline.
  for (const t of yt.ticks) {
    if (t === 0 || t === yt.lo) b.hair(x0, sy(t), x1, sy(t), INK.axis);
    else b.hair(x0, sy(t), x1, sy(t), INK.rule);
  }

  // Projection ground.
  const proj = S.map((s) => s.projectedAfter).find(Boolean);
  if (proj) {
    const px = sx(xv(proj));
    b.rect(px, top, x1 - px, bottom - top, INK.track);
  }

  // Annotation hairlines go under the data.
  const ann = (spec.annotations ?? []).map((a) => ({ ...a, x: sx(xv(a.date)) }));
  // Events are solid stone hairlines with a short ink tick at the top; dots are kept for
  // estimates alone.
  for (const a of ann) {
    b.hair(a.x, top, a.x, bottom, INK.stone);
    b.line(Math.round(a.x) + 0.5, top - 5, Math.round(a.x) + 0.5, top, INK.axis, 1.5);
  }

  // Lines: context first, so the lead is drawn last and sits on top.
  const order = S.map((_, i) => i).sort((a, c) => (roles[a] === "context" ? 0 : roles[a] === "compare" ? 1 : 2) - (roles[c] === "context" ? 0 : roles[c] === "compare" ? 1 : 2));
  const ptsBy: Array<Array<[number, number]>> = [];
  for (const i of order) {
    const s = S[i];
    const width = roles[i] === "context" ? z.lineCtx : roles[i] === "lead" ? z.line + 0.25 : z.line;
    const pts = s.points.map((p) => [sx(xv(p.date)), sy(p.value)] as [number, number]);
    ptsBy[i] = pts;
    const cut = s.projectedAfter ? s.points.findIndex((p) => p.date === s.projectedAfter) : -1;
    if (cut >= 0) {
      b.path(polyline(pts.slice(0, cut + 1)), { stroke: inks[i], width });
      // Estimates are a line of round dots: zero-length dashes with round caps.
      b.path(polyline(pts.slice(cut)), { stroke: inks[i], width: width + 0.75, dash: `0 ${Math.round(width * 2.6)}` });
    } else b.path(polyline(pts), { stroke: inks[i], width });
    // Reserve the line's path, sampled every few pixels, so notes and callouts avoid it.
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6));
      for (let t = 0; t <= steps; t++) {
        const x = ax + ((bx - ax) * t) / steps, y = ay + ((by - ay) * t) / steps;
        b.reserve({ x: x - 2, y: y - 2, w: 4, h: 4 });
      }
    }
    if (roles[i] !== "context") {
      const [lx, ly] = pts[pts.length - 1];
      b.circle(lx, ly, z.dot - 1, inks[i]);
    }
  }

  // Tick labels sit above their gridlines at the left edge, over the lines with a halo.
  // A line crossing a tick label pushes it below its gridline; if both sides are taken
  // the label keeps its place over the line, on a halo.
  yt.ticks.forEach((t, k) => {
    if (t === yt.lo && t !== 0) return;
    const text = tick(t, k === yt.ticks.length - 1);
    const above = sy(t) - b.lh("axis") / 2 - 2, below = sy(t) + b.lh("axis") / 2 + 2;
    const cands: Array<[number, number, "start"]> = t === yt.lo || t === 0 ? [[x0, above, "start"]] : [[x0, above, "start"], [x0, below, "start"]];
    if (!b.tryText(cands, text, "axis", { halo: true })) b.text(x0, above, text, "axis", "start", { halo: true });
  });

  // The time axis.
  if (timeAxis) {
    const maxTicks = Math.max(2, Math.floor((x1 - x0) / (z.cls === "s" ? 52 : 64)));
    for (const y of yearTicks(xmin, xmax, maxTicks)) {
      const x = sx(y);
      b.hair(x, bottom, x, bottom + 4, INK.axis);
      b.tryText([[x, bottom + 6 + b.lh("axis") / 2, "middle"], [x, bottom + 6 + b.lh("axis") / 2, "start"]], String(y), "axis");
    }
  } else {
    const every = Math.ceil(cats.length / Math.max(2, Math.floor((x1 - x0) / 56)));
    cats.forEach((c, k) => {
      if (k % every && k !== cats.length - 1) return;
      b.tryText([[sx(k), bottom + 6 + b.lh("axis") / 2, "middle"]], c, "axis");
    });
  }

  // Projection note.
  if (proj) b.tryText([[x1 - 4, top + b.lh("note") / 2 + 2, "end"]], "Projected", "note");

  // Annotation notes, in rows above the plot, beside their hairlines.
  for (const a of ann) {
    const rows = Array.from({ length: Math.max(1, annRows) }, (_, r) => top - 4 - (b.lh("note") + 2) * (annRows - r) + b.lh("note") / 2);
    const cands: Array<[number, number, "start" | "end"]> = [];
    for (const y of rows) cands.push([a.x + 4, y, "start"], [a.x - 4, y, "end"]);
    b.tryText(cands, a.label, "note");
  }

  // On a phone, each series is named where its own line has clear space: positions along
  // the line from its end backwards, above then below, the first that touches nothing.
  // The last value sits beside the end dot. Lead and compare series are placed first.
  const missing: string[] = [];
  if (inside) {
    const byRole = blocks.slice().sort((a, c) => (roles[a.i] === "context" ? 1 : 0) - (roles[c.i] === "context" ? 1 : 0));
    for (const k of byRole) {
      const i = k.i, pts = ptsBy[i], ctx = roles[i] === "context";
      const ink = ctx ? INK.ink2 : inks[i];
      const [ex] = pts[pts.length - 1];
      const off = b.lh("label") / 2 + 5;
      const cands: Array<[number, number, "start" | "end"]> = [];
      for (let f = 1; f >= 0.25; f -= 0.06) {
        const [px, py] = pts[Math.round(f * (pts.length - 1))];
        for (const dy of [-off, off, -off - b.lh("label"), off + b.lh("label")]) cands.push([Math.min(px, ex), py + dy, "end"], [px, py + dy, "start"]);
      }
      if (!b.tryText(cands, S[i].label, "label", { color: ink, bold: !ctx, halo: true }, 3)) missing.push(S[i].label);
    }
  }
  b.reserve({ x: x1 + 2, y: top, w: w - x1, h: bottom - top });

  // The callout: one value, large, beside its point.
  if (spec.callout) {
    const si = spec.callout.series ?? 0;
    const p = S[si].points.find((q) => q.date === spec.callout!.date);
    if (p) {
      const px = sx(xv(p.date)), py = sy(p.value);
      b.circle(px, py, z.dot, inks[si]);
      b.circle(px, py, z.dot + 3, undefined, inks[si], 1);
      b.callout(px, py, val(p.value), spec.callout.note, inks[si]);
    }
  }

  // End labels, dodged so blocks never touch, joined to their line by a hairline if moved.
  // Values share one right-aligned column; names (wide screens only) sit to their left.
  for (const k of blocks) k.y = sy(k.last.value);
  const gap = Math.max(...blocks.map((k) => k.h)) + (inside ? 2 : 4);
  dodge(blocks, gap, top + gap / 2 - b.lh("label") / 2, bottom - gap / 2 + b.lh("label") / 2);
  const lx = x1 + z.gap * 1.5;
  for (const k of blocks) {
    const i = k.i, ctx = roles[i] === "context";
    const ink = ctx ? INK.ink2 : inks[i];
    const target = sy(k.last.value);
    let y = k.y - (k.h - b.lh("label")) / 2;
    const reach = inside ? w - b.tw(k.v, "label", true) - 3 : lx - 3;
    if (Math.abs(k.y - target) > 3) b.line(sx(xv(k.last.date)) + 3, target, reach, k.y, INK.stone, 1);
    b.text(w, y, k.v, "label", "end", { bold: true, color: ink });
    if (inside) continue;
    for (const l of k.lines) {
      b.text(lx, y, l, "label", "start", { color: ctx ? INK.ink2 : INK.ink });
      y += b.lh("label");
    }
  }

  // Names that found no clear space on a phone are set under the axis as a sentence:
  // a short stroke in the series' ink, then its name. Never dropped, never a legend box.
  let total = H;
  if (missing.length) {
    let kx = 0, ky = H + 4 + b.lh("label") / 2;
    for (const name of missing) {
      const i = S.findIndex((q) => q.label === name);
      const wItem = 18 + b.tw(name, "label") + 14;
      if (kx > 0 && kx + wItem > w) {
        kx = 0;
        ky += b.lh("label") + 4;
      }
      b.line(kx, ky, kx + 12, ky, inks[i], roles[i] === "context" ? 2 : z.line, undefined, "round");
      b.text(kx + 18, ky, name, "label", "start", { color: roles[i] === "context" ? INK.ink2 : INK.ink });
      kx += wItem;
    }
    total = ky + b.lh("label") / 2 + 2;
  }
  return b.scene(total, spec.alt ?? `Line chart: ${S.map((s) => s.label).join(", ")}.`);
}
