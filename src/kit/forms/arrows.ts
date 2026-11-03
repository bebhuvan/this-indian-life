// Before → after, one arrow per row, in groups. Each group has its own scale, stated in
// its own tick row. The colour says which way the change went for the reader: sindoor
// where things got worse, neel where they got better, ink and a single dot where they
// barely moved. The old value sits at the tail, the new one bold at the head; when the
// arrow is too short for both, they share one label.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { fmt, formatterFor } from "../format";
import { domain, linear, type DomainPolicy } from "../scale";
import { wrap } from "../text";

export interface ArrowsSpec extends BaseSpec {
  form: "arrows";
  /** What the tail and head measure, e.g. "2017 prices" and "2021 prices". */
  from: string;
  to: string;
  groups: { label: string; note?: string; rows: { label: string; a: number; b: number }[] }[];
  /** Which direction is worse; without it every arrow is neel. */
  worse?: "higher" | "lower";
  domain?: DomainPolicy;
}

const HEAD = 7;
const SHAFT = 12;

export function arrows(spec: ArrowsSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const phone = z.cls === "s";
  const all = spec.groups.flatMap((g) => g.rows.flatMap((r) => [r.a, r.b]));
  const val = formatterFor(all, { decimals: spec.decimals });

  const col = Math.max(...spec.groups.flatMap((g) => g.rows.map((r) => b.tw(r.label, "label"))));
  const x0 = col + z.gap * 2 + 4;
  const x1 = w - (phone ? 6 : 12);
  const ah = b.lh("axis") + 2;

  let y = 4;
  let first = true;
  spec.groups.forEach((g, gi) => {
    // This group's own scale, from zero, capped at 100 for shares.
    const gv = g.rows.flatMap((r) => [r.a, r.b]);
    const t = domain(gv, spec.domain ?? "zero", phone ? 3 : 5);
    if (spec.unit === "%") {
      t.hi = Math.min(t.hi, 100);
      t.ticks = t.ticks.filter((v) => v <= 100);
    }
    const sx = linear([t.lo, t.hi], [x0, x1]);
    const tone = (a: number, c: number) => {
      if (Math.abs(c - a) < (t.hi - t.lo) * 0.005) return INK.ink;
      if (!spec.worse) return INK.neel;
      return (spec.worse === "higher" ? c > a : c < a) ? INK.sindoor : INK.neel;
    };

    // Heading: the line in bold, its note beside it (or under it on a phone).
    if (gi) y += phone ? 18 : 22;
    const gl = b.lh("label");
    y += gl / 2;
    b.text(0, y, g.label, "label", "start", { bold: true });
    if (g.note) {
      const nx = b.tw(g.label, "label", true) + 12;
      if (!phone && nx + b.tw(g.note, "note") <= w) b.text(nx, y, g.note, "note", "start");
      else for (const l of wrap(g.note, z.note, w, false, "display")) {
        y += b.lh("note");
        b.text(0, y, l, "note", "start");
      }
    }
    y += gl / 2 + 6;
    if (first) y += ah;
    const bandTop = y;

    for (const r of g.rows) {
      const cy = y + z.row / 2;
      const xa = sx(r.a), xb = sx(r.b), ink = tone(r.a, r.b);
      const dir = Math.sign(xb - xa) || 1;
      b.text(col, cy, r.label, "label", "end", { color: INK.ink2 });
      const label = (s: string, x: number, a: "start" | "end", bold = false) =>
        b.tryText([[x, cy, a]], s, "value", { bold, color: bold ? ink : INK.ink2, halo: true });

      if (ink === INK.ink) {
        b.circle(xb, cy, z.dot, INK.ink);
        b.reserve({ x: Math.min(xa, xb) - z.dot - 2, y: cy - z.dot - 2, w: Math.abs(xb - xa) + z.dot * 2 + 4, h: z.dot * 2 + 4 });
        const s = `${val(r.a)} → ${val(r.b)}`;
        label(s, Math.max(xa, xb) + z.dot + z.gap, "start", true) ?? label(s, Math.min(xa, xb) - z.dot - z.gap, "end", true);
      } else {
        // The tip sits exactly on the new value and the tail dot exactly on the old one. A
        // short change still gets a full arrow: the shaft runs back past the tail dot.
        const start = Math.abs(xb - xa) >= HEAD + SHAFT ? xa : xb - dir * (HEAD + SHAFT);
        b.line(start, cy, xb - dir * (HEAD - 1), cy, ink, phone ? 1.75 : 2, undefined, "butt");
        b.path(`M${xb},${cy}L${xb - dir * HEAD},${cy - HEAD / 2}L${xb - dir * HEAD},${cy + HEAD / 2}Z`, { fill: ink });
        b.circle(xa, cy, 2.75, ink);
        const lo = Math.min(start, xa, xb), hi = Math.max(start, xa, xb);
        b.reserve({ x: lo - 4, y: cy - HEAD / 2 - 1, w: hi - lo + 8, h: HEAD + 2 });
        const old = val(r.a), neu = val(r.b);
        const tailEdge = dir > 0 ? lo : hi;
        const tailX = tailEdge - dir * (z.gap + 4), headX = xb + dir * (z.gap + 2);
        const tailA = dir > 0 ? "end" : "start", headA = dir > 0 ? "start" : "end";
        const ok = (bx: { x: number; w: number }) => bx.x >= x0 - 2 && bx.x + bx.w <= w && !b.occ.hits(bx as never, 2);
        // Both ends labelled only when both fit; otherwise one shared label.
        if (ok(b.box(tailX, cy, old, "value", tailA)) && ok(b.box(headX, cy, neu, "value", headA, true))) {
          label(old, tailX, tailA);
          label(neu, headX, headA, true);
        } else {
          const s = `${old} → ${neu}`;
          label(s, hi + z.gap + 2, "start", true) ?? label(s, lo - z.gap - 2, "end", true);
        }
        if (first) {
          const ly = cy - z.row / 2 - ah / 2 + 2;
          b.tryText([[xa + (dir > 0 ? 4 : -4), ly, dir > 0 ? "end" : "start"], [xa, ly, "middle"]], spec.from, "axis", { color: INK.ink2 });
          b.tryText([[xb - (dir > 0 ? 4 : -4), ly, dir > 0 ? "start" : "end"], [xb, ly, "middle"]], spec.to, "axis", { bold: true, color: ink });
        }
      }
      first = false;
      y += z.row;
    }

    // Gridlines inside this group's rows only (no line at the scale's start), then its
    // own tick row, which states the scale.
    const grid = t.ticks.filter((v) => v > t.lo).map((v) => ({ kind: "line" as const, x1: Math.round(sx(v)) + 0.5, y1: bandTop, x2: Math.round(sx(v)) + 0.5, y2: y, stroke: INK.rule, width: 1 }));
    b.marks.unshift(...grid);
    const fy = y + 4 + b.lh("axis") / 2;
    t.ticks.forEach((v, k) => {
      const last = k === t.ticks.length - 1;
      b.tryText([[sx(v), fy, last ? "end" : k === 0 ? "start" : "middle"]], fmt(v, { decimals: 0, unit: last ? spec.unit : undefined, grouping: spec.unit?.startsWith("₹") ? "in" : undefined }), "axis");
    });
    y = fy + b.lh("axis") / 2;
  });

  return b.scene(y + 2, spec.alt ?? `Arrows from ${spec.from} to ${spec.to} for ${all.length / 2} rows.`);
}
