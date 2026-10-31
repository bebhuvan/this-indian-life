// Ranked fields of colour: one tile per member, in rank order, its value inside. A
// reference member (the national figure) takes its place in the ranking as an outlined
// tile. The key is a sentence: each range written out and underlined in its tone.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK } from "../theme";
import { fmt, formatterFor } from "../format";
import { fit, wrap } from "../text";

export interface TilesSpec extends BaseSpec {
  form: "tiles";
  items: { label: string; value: number }[];
  /** A member drawn as an outline in its rank position, e.g. the national figure. */
  reference?: { label: string; value: number };
  /** Four ascending cut points for the five steps; quintiles of the data if absent. */
  bins?: number[];
  /** Rank order: highest value first (default) or lowest first. */
  order?: "desc" | "asc";
}

/** Five steps that stop at sindoor: a field of tiles is large, so it never goes darker. */
const TONES = ["#F3ECDD", "#EBD3A2", "#DDAE63", "#D58A5C", INK.sindoor];
const WHITE_FROM = 4;

export function tiles(spec: TilesSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const desc = spec.order !== "asc";
  const items = [...spec.items].sort((a, c) => (desc ? c.value - a.value : a.value - c.value));
  const vals = items.map((d) => d.value);
  const val = formatterFor(vals, { unit: spec.unit, decimals: spec.decimals });

  const dec = spec.decimals ?? 1;
  const sorted = [...vals].sort((a, c) => a - c);
  const cuts = spec.bins ?? [0.2, 0.4, 0.6, 0.8].map((q) => Number(sorted[Math.floor(q * sorted.length)].toFixed(dec)));
  const step = (v: number) => cuts.filter((c) => v >= c).length;

  // The key as a sentence: ranges written out, each underlined in its tone, darkest first.
  const unit = Math.pow(10, -dec);
  const ranges = TONES.map((_, i) => {
    if (i === 0) return `under ${fmt(cuts[0], { decimals: dec })}`;
    if (i === TONES.length - 1) return `${fmt(cuts[i - 1], { decimals: dec })} and over`;
    return `${fmt(cuts[i - 1], { decimals: dec })}–${fmt(cuts[i] - unit, { decimals: dec })}`;
  });
  const order = desc ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
  let kx = 0, ky = b.lh("label") / 2 + 2;
  order.forEach((i, k) => {
    const t = ranges[i] + (k < order.length - 1 ? "," : "");
    const tw = b.tw(t, "label");
    if (kx > 0 && kx + tw > w) {
      kx = 0;
      ky += b.lh("label") + 10;
    }
    b.text(kx, ky, t, "label", "start", { color: INK.ink2 });
    const uw = b.tw(ranges[i], "label");
    b.rect(kx, ky + b.lh("label") / 2 + 1, uw, 4, TONES[i]);
    kx += tw + b.tw("  ", "label");
  });

  // The grid: column count by width; every tile the same height, sized for its text.
  const cols = z.cls === "s" ? (w >= 440 ? 3 : 2) : z.cls === "m" ? 5 : 7;
  const gap = 4;
  const tw = (w - gap * (cols - 1)) / cols;
  const pad = z.cls === "s" ? 10 : 12;
  const inner = tw - pad * 2;
  const list: { label: string; value: number; ref?: boolean }[] = [...items];
  if (spec.reference) {
    const r = spec.reference;
    const at = list.findIndex((d) => (desc ? d.value < r.value : d.value > r.value));
    list.splice(at < 0 ? list.length : at, 0, { ...r, ref: true });
  }
  // On phones a tile is one line, name left and value right; wider tiles stack them.
  const compact = z.cls === "s";
  const valW = compact ? Math.max(...list.map((d) => b.tw(val(d.value), "figure"))) + 8 : 0;
  const nameRoom = compact ? inner - valW : inner;
  const names = list.map((d) => {
    const lines = wrap(d.label, z.label, nameRoom, !!d.ref);
    return lines.length <= 2 ? lines : [lines[0], fit(lines.slice(1).join(" "), z.label, nameRoom)];
  });
  const nameH = Math.max(...names.map((n) => n.length)) * b.lh("label");
  const th = compact ? Math.max(nameH, b.lh("figure")) + pad * 1.6 : pad + nameH + 4 + b.lh("figure") + pad - 2;
  const top = ky + b.lh("label") / 2 + 20;

  list.forEach((d, k) => {
    const x = (k % cols) * (tw + gap), y = top + Math.floor(k / cols) * (th + gap);
    const lines = names[k];
    let ink: string = INK.ink;
    if (d.ref) {
      b.rect(x, y, tw, th, INK.ground);
      b.path(`M${x + 0.75},${y + 0.75}h${tw - 1.5}v${th - 1.5}h${-(tw - 1.5)}Z`, { stroke: INK.ink, width: 1.5 });
    } else {
      const s = step(d.value);
      b.rect(x, y, tw, th, TONES[s]);
      if (s >= WHITE_FROM) ink = INK.ground;
    }
    const v = val(d.value);
    if (compact) {
      const cy = y + th / 2;
      lines.forEach((l, j) => b.text(x + pad, cy + (j - (lines.length - 1) / 2) * b.lh("label"), l, "label", "start", { color: ink, bold: d.ref }));
      b.text(x + tw - pad, cy, v, "figure", "end", { color: ink });
      return;
    }
    lines.forEach((l, j) => b.text(x + pad, y + pad + b.lh("label") / 2 + j * b.lh("label"), l, "label", "start", { color: ink, bold: d.ref }));
    b.text(x + pad, y + th - pad - b.lh("figure") / 2 + 2, v, "figure", "start", { color: ink });
  });

  const rows = Math.ceil(list.length / cols);
  return b.scene(top + rows * (th + gap) - gap, spec.alt ?? `${items.length} members ranked by value, from ${items[0].label} (${val(items[0].value)}) to ${items[items.length - 1].label} (${val(items[items.length - 1].value)}).`);
}
