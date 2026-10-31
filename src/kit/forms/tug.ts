// A tug of war: what was gained pushes right from zero, what was lost pushes left, and the
// net sits beneath as a black bar. The largest block carries the chart's one display number;
// other blocks hold their label inside when it fits and otherwise drop it below on a
// vertical leader. Items under 1% of the bar's length are named in a footnote instead of
// being drawn as slivers.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { formatterFor } from "../format";
import { linear } from "../scale";

export interface TugSpec extends BaseSpec {
  form: "tug";
  items: { label: string; value: number }[];
  /** Words for the bracket over the losses (default "Losses"). */
  lossLabel?: string;
  netLabel?: string;
}

const LOSS_TINT = [1, 0.62, 0.38, 0.26];

/** Break text into lines that fit a width, measured in a role. */
function wrapRole(b: Builder, text: string, width: number, role: "note" | "label"): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? line + " " + word : word;
    if (!line || b.tw(next, role) <= width) line = next;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  return out;
}

export function tug(spec: TugSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const all = spec.items;
  const gainSum = all.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0);
  const lossSum = all.filter((d) => d.value < 0).reduce((s, d) => s + d.value, 0);
  const net = gainSum + lossSum;
  const val = formatterFor(all.map((d) => d.value).concat(net, lossSum), { unit: spec.unit, decimals: spec.decimals, sign: true });

  // Items under 1% of the bar are not drawn; they go to the footnote.
  const cut = (gainSum - lossSum) * 0.01;
  const tiny = all.filter((d) => Math.abs(d.value) < cut).sort((p, q) => Math.abs(q.value) - Math.abs(p.value));
  const gains = all.filter((d) => d.value >= cut).sort((p, q) => q.value - p.value);
  const losses = all.filter((d) => d.value <= -cut).sort((p, q) => p.value - q.value);
  const drawnGain = gains.reduce((s, d) => s + d.value, 0);
  const drawnLoss = losses.reduce((s, d) => s + d.value, 0);

  const th = z.cls === "s" ? 56 : 68;
  const bracketY = b.lh("label") + 6;
  const ty = bracketY + 12;
  const sx = linear([Math.min(drawnLoss, net, 0), Math.max(drawnGain, net, 0)], [0, w]);
  const zx = sx(0);
  const pad = z.cls === "s" ? 8 : 12;

  type Block = { label: string; value: number; a: number; e: number; fill: string; opacity: number };
  const blocks: Block[] = [];
  let run = 0;
  for (const d of gains) {
    blocks.push({ ...d, a: sx(run), e: sx(run + d.value), fill: INK.neel, opacity: 1 });
    run += d.value;
  }
  run = 0;
  losses.forEach((d, k) => {
    blocks.push({ ...d, a: sx(run + d.value), e: sx(run), fill: INK.sindoor, opacity: LOSS_TINT[Math.min(k, LOSS_TINT.length - 1)] });
    run += d.value;
  });
  for (const k of blocks) {
    b.rect(k.a, ty, k.e - k.a, th, k.fill, k.opacity);
    b.reserve({ x: k.a, y: ty, w: k.e - k.a, h: th });
  }
  // A white seam where two blocks meet, never at zero or an outer end.
  const seams = new Set<number>();
  for (const k of blocks) for (const x of [k.a, k.e]) if (Math.abs(x - zx) > 1 && blocks.some((o) => o !== k && (Math.abs(o.a - x) < 0.5 || Math.abs(o.e - x) < 0.5))) seams.add(Math.round(x * 10) / 10);
  for (const x of seams) b.line(x, ty, x, ty + th, INK.ground, 1.5);

  // Keep the zero line and the net's guide clear of every label placed below.
  const nx = sx(net);
  b.reserve({ x: zx - 3, y: ty + th, w: 6, h: 400 });
  b.reserve({ x: nx - 3, y: ty + th, w: 6, h: 400 });

  // Inside labels: the largest block's number is the display voice; the rest use figure.
  const lead = blocks.reduce((m, k) => (Math.abs(k.value) > Math.abs(m.value) ? k : m), blocks[0]);
  const below: Block[] = [];
  for (const k of blocks) {
    const role = k === lead ? "display" : "figure";
    const name = k.label, value = val(k.value);
    const inner = k.e - k.a - pad * 2;
    const fits = k.opacity > 0.5 && inner >= Math.max(b.tw(name, "axis", true), b.tw(value, role)) && th >= b.lh(role) + b.lh("axis") + 8;
    if (!fits) {
      below.push(k);
      continue;
    }
    const left = k.value > 0;
    const x = left ? k.a + pad : k.e - pad;
    const an = left ? "start" : "end";
    b.text(x, ty + pad + b.lh("axis") / 2 - 2, name, "axis", an, { color: INK.ground, bold: true, reserve: false });
    b.text(x, ty + th - pad - b.lh(role) / 2 + 4, value, role, an, { color: INK.ground, reserve: false });
  }

  // Bracket over the drawn losses, labelled with the total of all losses.
  if (losses.length) {
    const la = sx(drawnLoss), le = zx;
    b.hair(la, bracketY + 4, le, bracketY + 4, INK.sindoor);
    b.hair(la, bracketY + 4, la, bracketY + 10, INK.sindoor);
    b.hair(le, bracketY + 4, le, bracketY + 10, INK.sindoor);
    const t = `${spec.lossLabel ?? "Losses"} ${val(lossSum)}`;
    b.tryText([[(la + le) / 2, bracketY - 4, "middle"], [la, bracketY - 4, "start"], [le, bracketY - 4, "end"]], t, "label", { bold: true, color: INK.sindoor });
  }

  // Labels below the track on vertical leaders. Outermost blocks take the nearest rows, so
  // inner leaders drop beside them rather than through.
  const rows = Array.from({ length: 4 }, (_, r) => ty + th + 16 + r * (b.lh("label") + 4));
  let lowest = ty + th;
  below.sort((p, q) => Math.abs((q.a + q.e) / 2 - zx) - Math.abs((p.a + p.e) / 2 - zx));
  for (const k of below) {
    const color = k.value < 0 ? INK.sindoor : INK.ink;
    const text = `${k.label} ${val(k.value)}`;
    // The leader drops straight down from the block into the label: a vertical line in the
    // overlap of block and label, clear of everything between.
    const leaderAt = (bx: { x: number; y: number; w: number }) => {
      const lo = Math.max(k.a + 3, bx.x + 2), hi = Math.min(k.e - 3, bx.x + bx.w - 2);
      if (lo > hi) return null;
      const cx = Math.min(Math.max((k.a + k.e) / 2, lo), hi);
      const top = ty + th + 3, h = bx.y - 2 - top;
      for (const x of [cx, lo, hi]) if (h <= 0 || !b.occ.hits({ x: x - 1, y: top, w: 2, h }, 1)) return x;
      return null;
    };
    // Single-line candidates, then two lines wrapped inside the block's side of zero.
    const room = k.value < 0 ? zx - 12 : w - zx - 12;
    const shapes = [[text], wrapRole(b, text, room, "label")];
    let placed: { x: number; y: number; w: number; h: number; at: number } | null = null;
    search: for (const ls of shapes) {
      const bw = Math.max(...ls.map((l) => b.tw(l, "label"))), bh = ls.length * b.lh("label");
      const mid = (k.a + k.e) / 2;
      const xs = [mid - bw / 2, k.a, k.e - bw, k.value < 0 ? zx - 12 - bw : zx + 12, k.value < 0 ? 0 : w - bw];
      for (const ry of rows) {
        for (const x of xs) {
          const cand = { x, y: ry - b.lh("label") / 2, w: bw, h: bh };
          if (x < 0 || x + bw > w || b.occ.hits(cand, 6)) continue;
          const at = leaderAt(cand);
          if (at == null) continue;
          b.reserve(cand);
          ls.forEach((l, j) => b.text(x, ry + j * b.lh("label"), l, "label", "start", { color, reserve: false }));
          placed = { ...cand, at };
          break search;
        }
      }
    }
    if (!placed) {
      tiny.push(k);
      continue;
    }
    b.line(placed.at, ty + th + 2, placed.at, placed.y - 1, INK.stoneLine, 1);
    b.reserve({ x: placed.at - 1, y: ty + th + 2, w: 2, h: placed.y - ty - th - 3 });
    lowest = Math.max(lowest, placed.y + placed.h);
  }

  // The net, 48 px under the track (or just under the lowest label), a solid guide up to it.
  const bh = z.cls === "s" ? 16 : 20;
  const ny = Math.max(ty + th + 48, lowest + 20);
  b.rect(Math.min(zx, nx), ny, Math.abs(nx - zx), bh, net < 0 ? INK.sindoor : INK.ink);
  b.hair(nx, ty + th + 4, nx, ny - 4, INK.axis);
  const nt = `${spec.netLabel ?? "Net"} ${val(net)}`;
  b.tryText([[Math.max(nx, zx) + z.gap, ny + bh / 2, "start"], [Math.min(nx, zx) - z.gap, ny + bh / 2, "end"]], nt, "label", { bold: true, color: net < 0 ? INK.sindoor : INK.ink });

  // Zero, the line both sides pull against.
  b.line(zx, ty - 8, zx, ny + bh + 6, INK.ink, 1.25);

  // The small ones, named together in the margin voice.
  let end = ny + bh + 8;
  if (tiny.length) {
    const t = "Also " + tiny.map((k) => `${k.label.toLowerCase()} ${val(k.value)}`).join(", ");
    const lines = wrapRole(b, t, w, "note");
    lines.forEach((l, i) => b.text(0, end + 10 + i * b.lh("note") + b.lh("note") / 2, l, "note", "start"));
    end += 12 + lines.length * b.lh("note");
  }

  return b.scene(end, spec.alt ?? `Gains of ${val(gainSum)} against losses of ${val(lossSum)}, net ${val(net)}.`);
}
