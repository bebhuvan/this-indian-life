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
  /** Dates after which the series is not joined to its next point: a change of survey or
   *  method that the source marks as not comparable. Each run is solid, the step across a
   *  break is a stone hairline, and every observation gets a dot so a lone survey shows. */
  breaksAfter?: string[];
}

export interface LineSpec extends BaseSpec {
  form: "line";
  series: LineSeries[];
  domain?: DomainPolicy;
  /** Events: a hairline at a date, its note above the plot. */
  annotations?: { date: string; label: string }[];
  /** Reference values (a poverty line, replacement fertility): a hairline across the plot,
   *  named in the margin voice at one end. They extend the scale to include themselves. */
  references?: { value: number; label: string }[];
  /** Periods (a recession, a lockdown, a survey gap): a faint ground behind the data, named
   *  at its top. */
  bands?: { from: string; to: string; label?: string }[];
  /** Notes on single points, written beside them with a short leader: "Peak, May 2021". */
  notes?: { date: string; series?: number; label: string }[];
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
  // Beside rural (hara) and urban (neel) the national line is ink: neel is already urban's,
  // and a second neel line made All India and Urban one colour.
  const fixed = S.some((s) => fixedInk(s.label));
  const national = (l: string) => /^(all[- ]india|india|national|total)$/i.test(l.trim());
  const inks = S.map((s, i) => s.color ?? fixedInk(s.label) ?? (fixed && national(s.label) ? INK.ink : roles[i] === "lead" ? (fixed ? INK.ink : INK.neel) : roles[i] === "context" ? INK.stoneLine : COMPARE[ci++ % COMPARE.length]));

  // The x axis: real time when the dates are dates, otherwise ordered categories.
  const timeAxis = S.every((s) => s.points.every((p) => isDate(p.date)));
  const cats = timeAxis ? [] : [...new Set(S.flatMap((s) => s.points.map((p) => p.date)))];
  const xv = (d: string) => (timeAxis ? yearOf(d) : cats.indexOf(d));
  const xs = S.flatMap((s) => s.points.map((p) => xv(p.date)));
  const xmin = Math.min(...xs), xmax = Math.max(...xs);

  // Value scale and formats.
  // A line is a position, not a length, so it need not start at zero: life expectancy from
  // 45 to 73 on a scale from 0 is a flat line at the top. Zero is kept when the data come
  // near it anyway (the lowest value under 40% of the highest), where it costs nothing.
  const lo0 = Math.min(...all), hi0 = Math.max(...all);
  const policy = spec.domain ?? (lo0 >= 0 && spec.unit !== "index" && lo0 <= hi0 * 0.4 ? "zero" : "fit");
  // A fitted scale asks for one more step, so a range of 33 to 79 is ticked in tens up to 80,
  // not in twenties up to 100.
  const yt = domain([...all, ...(spec.references ?? []).map((r) => r.value)], policy, (z.cls === "s" ? 4 : 5) + (policy === "fit" ? 1 : 0));
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
    // A name wraps onto as many lines as it needs; cutting it at two dropped words unseen.
    const lines = inside || b.tw(s.label, "label") <= maxName ? [s.label] : wrap(s.label, z.label, maxName);
    const nameW = inside ? 0 : Math.max(...lines.map((l) => b.tw(l, "label")));
    return { i, last, v, lines, nameW, h: lines.length * b.lh("label"), y: 0 };
  });
  const gutter = inside ? vW + z.gap * 2 : Math.max(...blocks.map((k) => k.nameW)) + vW + z.gap * 4;

  // Geometry.
  // Phones get a taller frame so slopes keep their angle and the chart has presence.
  const ratio = z.cls === "s" ? 0.9 : z.cls === "m" ? 0.56 : 0.44;
  const annRows = spec.annotations?.length ? (z.cls === "s" ? 2 : 1) : 0;
  // A free-text unit is captioned once, above the top tick: "years", not a bare number.
  const capLines = spec.unitLabel ? wrap(spec.unitLabel, z.axis, w) : [];
  const capH = capLines.length ? capLines.length * b.lh("axis") + 4 : 0;
  const top = capH + b.lh("axis") + 6 + annRows * (b.lh("note") + 2);
  const H = Math.max(240, Math.min(480, Math.round(w * ratio))) + annRows * b.lh("note") + capH;
  capLines.forEach((l, k) => b.text(0, b.lh("axis") / 2 + k * b.lh("axis"), l, "axis", "start", { color: INK.ink2 }));
  const bottom = H - b.lh("axis") - 10;
  const x0 = 0, x1 = w - gutter;
  const sx = linear([xmin, xmax], [x0, x1]);
  const sy = linear([yt.lo, yt.hi], [bottom, top]);

  // Gridlines and the baseline.
  for (const t of yt.ticks) {
    // The dark baseline means zero; a scale that starts elsewhere ends on an ordinary rule.
    if (t === 0) b.hair(x0, sy(t), x1, sy(t), INK.axis);
    else b.hair(x0, sy(t), x1, sy(t), INK.rule);
  }

  // Periods: a faint ground behind everything, clipped to the plot.
  const bands = (spec.bands ?? []).map((p) => {
    const a = Math.max(x0, sx(xv(p.from))), c = Math.min(x1, sx(xv(p.to)));
    return { ...p, a, c };
  }).filter((p) => p.c > p.a);
  for (const p of bands) b.rect(p.a, top, p.c - p.a, bottom - top, INK.track);

  // References: solid stone hairlines (dots mean estimate, so never dotted), under the data.
  const refs = (spec.references ?? []).map((r) => ({ ...r, y: sy(r.value) }));
  for (const r of refs) b.line(x0, Math.round(r.y) + 0.5, x1, Math.round(r.y) + 0.5, INK.stoneLine, 1);

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
    const breaks = new Set(s.breaksAfter ?? []);
    if (breaks.size && cut < 0) {
      let run: Array<[number, number]> = [];
      s.points.forEach((p, k) => {
        run.push(pts[k]);
        const last = k === s.points.length - 1;
        if (last || breaks.has(p.date)) {
          if (run.length > 1) b.path(polyline(run), { stroke: inks[i], width });
          if (!last) b.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], INK.stone, 1);
          run = [];
        }
      });
      for (const [px, py] of pts) b.circle(px, py, Math.max(2, z.dot - 2), inks[i]);
    } else if (cut >= 0) {
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
    // Every tick is labelled, the lowest too: a scale that does not start at zero says where it starts.
    const text = tick(t, k === yt.ticks.length - 1);
    // Under the zero line the label clears a line lying on the floor (its reserved band plus padding).
    const above = sy(t) - b.lh("axis") / 2 - 2, below = sy(t) + b.lh("axis") / 2 + (t === 0 ? 5 : 2);
    // The zero line may also take the space under it when a line runs along the floor at the
    // left edge; the time-axis labels there are reserved, so it is used only when free.
    // A label with no clear place is left off (its gridline stays; a lone label moved to the
    // right end read as a stray), except the top one, which carries the unit and keeps its
    // place on a halo.
    // The lowest tick only above its line: below it is the time axis, whose first year it took.
    const cands: Array<[number, number, "start"]> = k === 0 && t !== 0 ? [[x0, above, "start"]] : [[x0, above, "start"], [x0, below, "start"]];
    const top1 = k === yt.ticks.length - 1;
    if (!b.tryText(cands, text, "axis", { halo: true }) && top1) b.text(x0, above, text, "axis", "start", { halo: true });
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

  // End labels, placed before the phone's inside names so those names find the values
  // taken (a name set first was overprinted by a value). Dodged so blocks never touch, joined to their line by a hairline if moved.
  // The value comes first, beside the line's end in its ink, and the name follows it: a
  // number set a whole name's width away at the page edge read as a separate table.
  // Values share one right-aligned column so their decimals line up.
  for (const k of blocks) k.y = sy(k.last.value);
  const gap = Math.max(...blocks.map((k) => k.h)) + (inside ? 2 : 4);
  dodge(blocks, gap, top + gap / 2 - b.lh("label") / 2, bottom - gap / 2 + b.lh("label") / 2);
  const lx = x1 + z.gap * 1.5;
  const vx = inside ? w : lx + vW, nx = vx + z.gap * 1.5;
  for (const k of blocks) {
    const i = k.i, ctx = roles[i] === "context";
    const ink = ctx ? INK.ink2 : inks[i];
    const target = sy(k.last.value);
    let y = k.y - (k.h - b.lh("label")) / 2;
    const reach = inside ? w - b.tw(k.v, "label", true) - 3 : lx - 3;
    if (Math.abs(k.y - target) > 3) b.line(sx(xv(k.last.date)) + 3, target, reach, k.y, INK.stone, 1);
    b.text(vx, y, k.v, "label", "end", { bold: true, color: ink });
    if (inside) continue;
    for (const l of k.lines) {
      b.text(nx, y, l, "label", "start", { color: INK.ink2 });
      y += b.lh("label");
    }
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

  // Reference names, in the margin voice, on their line's right end where it is free (the
  // eye arrives there from the end labels), else its left end; above, else below.
  for (const r of refs) {
    const up = r.y - b.lh("note") / 2 - 2, dn = r.y + b.lh("note") / 2 + 2;
    b.tryText([[x1 - 4, up, "end"], [x1 - 4, dn, "end"], [x0 + 64, up, "start"], [x0 + 64, dn, "start"]], r.label, "note", { halo: true });
  }
  // Period names, inside the top of their band, when the band is wide enough to hold them.
  // A name that does not fit is keyed under the axis instead: a shaded period with no name
  // is a question the reader cannot answer.
  const bandKey: string[] = [];
  for (const p of bands) if (p.label && !(b.tw(p.label, "note") <= p.c - p.a - 8 && b.tryText([[p.a + 4, top + b.lh("note") / 2 + 2, "start"]], p.label, "note"))) bandKey.push(p.label);

  // Point notes: a ring on the point, the note in clear space beside it (up to two lines),
  // and a hairline leader from the ring to the note.
  for (const n of spec.notes ?? []) {
    const si = n.series ?? 0, p = S[si]?.points.find((q) => q.date === n.date);
    if (!p) continue;
    const px = sx(xv(p.date)), py = sy(p.value), lh = b.lh("note");
    const lines = wrap(n.label, z.note, Math.min(220, w * 0.4), false, "display");
    const bw = Math.max(...lines.map((l) => b.tw(l, "note"))), bh = lines.length * lh;
    let placed: { x: number; y: number; right: boolean } | null = null;
    for (const d of [22, 38, 56]) for (const [dx, dy] of [[1, -1], [-1, -1], [1, 1], [-1, 1]] as const) {
      const bx = dx > 0 ? px + 10 : px - 10 - bw, by = dy < 0 ? py - d - bh : py + d;
      const box = { x: bx, y: by, w: bw, h: bh };
      if (bx < 0 || bx + bw > x1 || by < top || by + bh > bottom || b.occ.hits(box, 3)) continue;
      placed = { x: bx, y: by, right: dx > 0 };
      break;
    }
    if (!placed) continue;
    const { x: nx, y: ny, right } = placed;
    // The leader runs from the ring's edge to the note's near corner.
    const lx = right ? nx - 2 : nx + bw + 2, ly = ny + bh / 2 > py ? ny + 2 : ny + bh - 2;
    const ang = Math.atan2(ly - py, lx - px), rr = z.dot + 3;
    b.line(px + Math.cos(ang) * rr, py + Math.sin(ang) * rr, lx, ly, INK.axis, 1);
    b.circle(px, py, z.dot + 1.5, undefined, inks[si], 1.25);
    lines.forEach((l, j) => b.text(right ? nx : nx + bw, ny + lh / 2 + j * lh, l, "note", right ? "start" : "end", { halo: true }));
  }

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

  // Names that found no clear space on a phone are set under the axis as a sentence:
  // a short stroke in the series' ink, then its name. Never dropped, never a legend box.
  let total = H;
  if (missing.length) {
    let kx = 0, ky = H + 4 + b.lh("label") / 2;
    for (const name of missing) {
      const i = S.findIndex((q) => q.label === name);
      // A name longer than the line wraps under itself, beside one stroke.
      const lines = wrap(name, z.label, w - 18);
      const wItem = 18 + Math.max(...lines.map((l) => b.tw(l, "label"))) + 14;
      if (kx > 0 && (kx + wItem > w || lines.length > 1)) {
        kx = 0;
        ky += b.lh("label") + 4;
      }
      b.line(kx, ky, kx + 12, ky, inks[i], roles[i] === "context" ? 2 : z.line, undefined, "round");
      lines.forEach((l, j) => b.text(kx + 18, ky + j * b.lh("label"), l, "label", "start", { color: roles[i] === "context" ? INK.ink2 : INK.ink }));
      ky += (lines.length - 1) * b.lh("label");
      kx = lines.length > 1 ? w : kx + wItem;
    }
    total = ky + b.lh("label") / 2 + 2;
  }
  for (const label of bandKey) {
    const lines = wrap(label, z.note, w - 22, false, "display");
    let ky = total + 6 + b.lh("note") / 2;
    b.rect(0, ky - 6, 14, 12, INK.track);
    b.hair(0, ky - 6, 14, ky - 6, INK.stone);
    b.hair(0, ky + 6, 14, ky + 6, INK.stone);
    for (const l of lines) {
      b.text(22, ky, l, "note", "start");
      ky += b.lh("note");
    }
    total = ky - b.lh("note") / 2 + 2;
  }
  return b.scene(total, spec.alt ?? `Line chart: ${S.map((s) => s.label).join(", ")}.`);
}
