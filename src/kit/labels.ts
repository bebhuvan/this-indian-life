// Label placement. Forms never draw a label on top of another; they ask here.

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const overlaps = (a: Box, b: Box, pad = 0) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/** A record of everything already drawn that a label must avoid. */
export class Occupancy {
  boxes: Box[] = [];
  add(b: Box) {
    this.boxes.push(b);
    return b;
  }
  hits(b: Box, pad = 2) {
    return this.boxes.some((o) => overlaps(o, b, pad));
  }
  /** The first candidate that collides with nothing, added and returned; else null. */
  take(cands: Box[], pad = 2): Box | null {
    for (const c of cands) if (!this.hits(c, pad)) return this.add(c);
    return null;
  }
}

/** Box of a text centred vertically on y, for an anchor. */
export function textBox(x: number, y: number, w: number, h: number, anchor: "start" | "middle" | "end"): Box {
  const left = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
  return { x: left, y: y - h / 2, w, h };
}

/**
 * Dodge spans of different sizes along one axis: each item wants its centre at `c` and
 * occupies `w`; items keep their order, never overlap (with `gap` between), stay inside
 * [lo, hi], and colliding runs centre themselves on the mean of their targets.
 */
export function dodgeSpans<T extends { c: number; w: number }>(items: T[], gap: number, lo: number, hi: number): T[] {
  const order = [...items].sort((a, b) => a.c - b.c);
  type Run = { members: T[]; start: number; width: number };
  const fitRun = (r: Run) => {
    r.width = r.members.reduce((s, m) => s + m.w, 0) + gap * (r.members.length - 1);
    const mean = r.members.reduce((s, m) => s + m.c, 0) / r.members.length;
    r.start = Math.min(Math.max(mean - r.width / 2, lo), hi - r.width);
  };
  let runs: Run[] = order.map((m) => ({ members: [m], start: 0, width: 0 }));
  runs.forEach(fitRun);
  let merged = true;
  while (merged) {
    merged = false;
    const next: Run[] = [];
    for (const r of runs) {
      const prev = next[next.length - 1];
      if (prev && prev.start + prev.width + gap > r.start) {
        prev.members.push(...r.members);
        fitRun(prev);
        merged = true;
      } else next.push(r);
    }
    runs = next;
  }
  for (const r of runs) {
    let x = r.start;
    for (const m of r.members) {
      m.c = x + m.w / 2;
      x += m.w + gap;
    }
  }
  return items;
}

/**
 * One-dimensional dodge: move labels along y so no two are closer than `gap`, keeping
 * each as near its target as possible and inside [lo, hi]. Labels that collide form a
 * cluster centred on the mean of their targets, the arrangement a person would choose.
 */
export function dodge<T extends { y: number }>(items: T[], gap: number, lo = -Infinity, hi = Infinity): T[] {
  const order = items.map((it, i) => ({ it, i, target: it.y })).sort((a, b) => a.target - b.target);
  type Cluster = { start: number; members: typeof order };
  let clusters: Cluster[] = order.map((o) => ({ start: o.target, members: [o] }));
  const place = (c: Cluster) => {
    const mean = c.members.reduce((s, m) => s + m.target, 0) / c.members.length;
    const span = (c.members.length - 1) * gap;
    c.start = Math.min(Math.max(mean - span / 2, lo), hi - span);
  };
  let merged = true;
  while (merged) {
    merged = false;
    clusters.forEach(place);
    const next: Cluster[] = [];
    for (const c of clusters) {
      const prev = next[next.length - 1];
      if (prev && prev.start + (prev.members.length - 1) * gap + gap > c.start) {
        prev.members.push(...c.members);
        place(prev);
        merged = true;
      } else next.push(c);
    }
    clusters = next;
  }
  for (const c of clusters) c.members.forEach((m, k) => (m.it.y = c.start + k * gap));
  return items;
}
