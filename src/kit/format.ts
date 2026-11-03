// Number formatting. One chart uses one format: decimals are chosen once from all of its
// values, so "92%" never sits beside "92.8%".

export const MINUS = "−";

/**
 * Decimals a person would use for these values: enough to show the typical difference
 * between neighbouring values, no more. The median gap sets it (gaps of ~0.1 get one
 * decimal, gaps of ~1 get none), capped by magnitude, and raised only so that no
 * non-zero value prints as zero.
 */
export function decimalsFor(values: number[]): number {
  const v = values.filter((x) => Number.isFinite(x));
  if (!v.length) return 0;
  const max = Math.max(...v.map(Math.abs));
  const cap = max >= 100 ? 0 : max >= 1 ? 1 : 2;
  const s = [...new Set(v)].sort((a, b) => a - b);
  const gaps = s.slice(1).map((x, i) => x - s[i]).filter((g) => g > 0).sort((a, b) => a - b);
  const g = gaps.length ? gaps[Math.floor(gaps.length / 2)] : max || 1;
  let d = Math.min(cap, Math.max(0, Math.ceil(-Math.log10(g) - 1e-9)));
  // Values under 100 that carry a decimal keep one, so a chart never prints "13%" beside
  // prose that says 13.1%.
  if (max < 100 && v.some((x) => Math.abs(x - Math.round(x)) > 1e-9)) d = Math.max(d, Math.min(1, cap));
  // Only small-valued charts earn extra decimals to keep a value from printing as zero;
  // in a chart that reaches the thousands, a near-zero month is honestly "0".
  if (max < 10) while (d < 2 && v.some((x) => x !== 0 && Number(x.toFixed(d)) === 0)) d++;
  return d;
}

export interface FormatOpts {
  decimals: number;
  /** Prefix + for positive values. */
  sign?: boolean;
  unit?: string;
  /** "in" uses Indian grouping (1,02,900); "intl" uses 102,900. */
  grouping?: "in" | "intl";
}

export function fmt(v: number, o: FormatOpts): string {
  const abs = Math.abs(v);
  // Rupees are grouped the Indian way (₹1,02,900) unless a chart asks otherwise.
  const indian = o.grouping ? o.grouping === "in" : !!o.unit?.startsWith("₹");
  const body = abs.toLocaleString(indian ? "en-IN" : "en-US", {
    minimumFractionDigits: o.decimals,
    maximumFractionDigits: o.decimals,
  });
  const zero = Number(abs.toFixed(o.decimals)) === 0;
  const sgn = v < 0 && !zero ? MINUS : o.sign && v > 0 && !zero ? "+" : "";
  return sgn + withUnit(body, o.unit);
}

/** Attach a unit the way a reader writes it: $1,029m, 4.7%, +10.9 pts, 3.1x. */
export function withUnit(body: string, unit?: string): string {
  if (!unit) return body;
  if (unit === "%") return body + "%";
  if (unit === "pts") return body + " pts";
  if (unit === "x") return body + "×";
  if (unit === "$m") return "$" + body + "m";
  if (unit === "$bn") return "$" + body + "bn";
  if (unit === "$tn") return "$" + body + "tn";
  if (unit === "$") return "$" + body;
  if (unit === "₹") return "₹" + body;
  if (unit === "₹ lakh") return "₹" + body + " lakh";
  if (unit === "₹ crore") return "₹" + body + " crore";
  if (unit === "₹ lakh crore") return "₹" + body + " lakh crore";
  return body;
}

/** A formatter bound to a chart's values. */
export function formatterFor(values: number[], opts: Partial<FormatOpts> = {}) {
  const decimals = opts.decimals ?? decimalsFor(values);
  const base: FormatOpts = { ...opts, decimals };
  return (v: number, extra: Partial<FormatOpts> = {}) => fmt(v, { ...base, ...Object.fromEntries(Object.entries(extra).filter(([, x]) => x !== undefined)) });
}
