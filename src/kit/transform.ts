// Transformations a story applies to its data before drawing. Each returns the new data
// and a phrase saying what was done, so a dek or note can state it plainly.

export interface Point {
  date: string;
  value: number;
}

export interface Transformed<T> {
  data: T;
  note: string;
}

/** Rebase a series so `base` (a date) equals 100. */
export function indexTo(points: Point[], base: string): Transformed<Point[]> {
  const b = points.find((p) => p.date === base)?.value;
  if (!b) throw new Error(`indexTo: no value at ${base}`);
  return { data: points.map((p) => ({ date: p.date, value: (p.value / b) * 100 })), note: `indexed, ${base} = 100` };
}

/** Each value as a share of the row total, for composition. */
export function shares<T extends Record<string, number | string>>(rows: T[], keys: (keyof T)[]): Transformed<T[]> {
  const data = rows.map((r) => {
    const total = keys.reduce((s, k) => s + Number(r[k]), 0);
    return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, keys.includes(k as keyof T) ? (Number(v) / total) * 100 : v])) as T;
  });
  return { data, note: "share of the total, %" };
}

/** Change against the value `lag` steps earlier: absolute or %. */
export function change(points: Point[], lag: number, kind: "abs" | "pct"): Transformed<Point[]> {
  const data = points.slice(lag).map((p, i) => {
    const prev = points[i].value;
    return { date: p.date, value: kind === "abs" ? p.value - prev : ((p.value - prev) / prev) * 100 };
  });
  return { data, note: kind === "pct" ? `% change on ${lag} periods earlier` : `change on ${lag} periods earlier` };
}

/** Trailing mean over `n` points; the first n−1 points are dropped, not padded. */
export function rolling(points: Point[], n: number): Transformed<Point[]> {
  const data: Point[] = [];
  let sum = 0;
  points.forEach((p, i) => {
    sum += p.value;
    if (i >= n) sum -= points[i - n].value;
    if (i >= n - 1) data.push({ date: p.date, value: sum / n });
  });
  return { data, note: `${n}-period moving average` };
}

/** Sum monthly points ("YYYY-MM") into Indian fiscal years (April-March), complete years only. */
export function fiscalYears(points: Point[]): Transformed<Point[]> {
  const sums = new Map<number, { v: number; n: number }>();
  for (const p of points) {
    const [y, m] = p.date.split("-").map(Number);
    const fy = m >= 4 ? y + 1 : y;
    const s = sums.get(fy) ?? { v: 0, n: 0 };
    s.v += p.value;
    s.n += 1;
    sums.set(fy, s);
  }
  const data = [...sums].filter(([, s]) => s.n === 12).map(([fy, s]) => ({ date: `FY${String(fy).slice(2)}`, value: s.v }));
  return { data, note: "summed over April-March fiscal years; partial years left out" };
}

/** Keep the top `n` items by value and fold the rest into one "Other" item. */
export function topN<T extends { label: string; value: number }>(items: T[], n: number, other = "Other"): Transformed<{ label: string; value: number }[]> {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, n).map(({ label, value }) => ({ label, value }));
  const rest = sorted.slice(n).reduce((s, x) => s + x.value, 0);
  return { data: rest ? [...head, { label: other, value: rest }] : head, note: rest ? `top ${n}, the rest combined` : "" };
}
