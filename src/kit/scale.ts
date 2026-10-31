// Scales and ticks. A domain is chosen by policy, never by the renderer's habit:
// "zero" for anything drawn as a length, "share" for percentages of a whole,
// "fit" for lines that may start away from zero, "symmetric" for signed change.

export type DomainPolicy = "zero" | "share" | "fit" | "symmetric";

const STEPS = [1, 2, 2.5, 5, 10];

export function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const s of STEPS) if (s * mag >= raw) return s * mag;
  return 10 * mag;
}

export interface Ticks {
  lo: number;
  hi: number;
  step: number;
  ticks: number[];
}

/** Ticks covering [min, max] at round steps, aiming for `count` intervals. */
export function ticks(min: number, max: number, count: number): Ticks {
  if (min === max) {
    max = min + 1;
  }
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v / step) * step);
  return { lo, hi, step, ticks: out.map((t) => +t.toPrecision(12)) };
}

/** A domain for the values under a policy, extended to round ticks. */
export function domain(values: number[], policy: DomainPolicy, count = 5): Ticks {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (policy === "zero" || policy === "share") {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (policy === "symmetric") {
    const m = Math.max(Math.abs(min), Math.abs(max));
    min = -m;
    max = m;
  }
  if (policy === "fit") {
    const pad = (max - min) * 0.06 || 1;
    min -= pad;
    max += pad;
  }
  const t = ticks(min, max, count);
  if (policy === "share") {
    t.hi = Math.min(t.hi, 100);
    t.ticks = t.ticks.filter((v) => v <= 100);
    if (t.ticks[t.ticks.length - 1] !== 100 && max > 90) t.ticks.push(100);
  }
  return t;
}

export interface Linear {
  (v: number): number;
  domain: [number, number];
  range: [number, number];
  invert(px: number): number;
}

export function linear(d: [number, number], r: [number, number]): Linear {
  const k = (r[1] - r[0]) / (d[1] - d[0] || 1);
  const f = ((v: number) => r[0] + (v - d[0]) * k) as Linear;
  f.domain = d;
  f.range = r;
  f.invert = (px: number) => d[0] + (px - r[0]) / k;
  return f;
}

/** Positions for `n` evenly spaced bands across a range, with inner padding as a share. */
export function bands(n: number, r: [number, number], padding = 0.3) {
  const step = (r[1] - r[0]) / Math.max(1, n);
  const width = step * (1 - padding);
  return { step, width, at: (i: number) => r[0] + i * step + (step - width) / 2 };
}

/** Parse "2008-04", "2008" or "2008-04-15" into a fractional year for a time axis. */
export function yearOf(date: string): number {
  const [y, m = "1", d = "1"] = date.split("-");
  return Number(y) + (Number(m) - 1) / 12 + (Number(d) - 1) / 365;
}

/** Year ticks: round years at an interval that leaves room for each label. */
export function yearTicks(lo: number, hi: number, maxCount: number): number[] {
  const span = hi - lo;
  const every = [1, 2, 5, 10, 20, 25, 50].find((e) => span / e <= maxCount) ?? 100;
  const out: number[] = [];
  for (let y = Math.ceil(lo / every) * every; y <= hi + 1e-9; y += every) out.push(y);
  return out;
}
