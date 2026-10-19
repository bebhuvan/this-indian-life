// Number formatting and axis scales shared by every figure renderer.
// Moved out of ArticleVisuals.astro so the SVG renderers in figures.ts can use them.
export function fmt(value: number, unit = "") {
  const abs = Math.abs(value);
  // Zero is special: a bare "0.0" on a rupee/dollar axis reads as a glitch.
  // Give it a clean, unit-appropriate label before the magnitude branches run.
  // Match the SAME conditions the magnitude branches use to emit a currency — a bare
  // "crore"/"rs" unit (counts, not money) must NOT get "₹0" while its other ticks stay
  // bare numbers (the mismatch that put "₹0" next to "$20"/"40.0" on non-rupee axes).
  if (value === 0) {
    if (/%|percent/i.test(unit)) return "0%";
    if (/US\$|usd|\$/i.test(unit)) return "$0";
    if (/rupees|inr|₹/i.test(unit) || (/crore/i.test(unit) && /inr|₹|rs/i.test(unit))) return "₹0";
    return "0";
  }
  if (/multiple/i.test(unit)) return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}x`;
  if (/%|percent/i.test(unit)) return `${value.toLocaleString("en-IN", { maximumFractionDigits: abs >= 100 ? 0 : 1 })}%`;
  if (/(station-years|station-days|station records|daily rows|listed files|stations|towns\/city names)/i.test(unit)) {
    return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }
  if (/crore/i.test(unit) && /inr|₹|rs/i.test(unit)) {
    if (abs >= 100_000) return `₹${(value / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh cr`;
    if (abs >= 1_000) return `₹${(value / 1_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k cr`;
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} cr`;
  }
  if (/rupees|inr|₹/i.test(unit)) {
    if (abs >= 1_000_000_000_000) return `₹${(value / 1_000_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh cr`;
    if (abs >= 10_000_000_000) return `₹${(value / 10_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k cr`;
    if (abs >= 10_000_000) return `₹${(value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} cr`;
    if (abs >= 100_000) return `₹${(value / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh`;
    if (abs >= 1000) return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  if (/US\$|usd|\$/i.test(unit) && /billion|\bbn\b/i.test(unit)) {
    return `$${value.toLocaleString("en-IN", { maximumFractionDigits: abs >= 10 ? 1 : 2 })}bn`;
  }
  if (/US\$|usd|\$/i.test(unit)) {
    if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} trillion`;
    if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 0 })} billion`;
    return `$${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  if (/people/i.test(unit)) {
    if (abs >= 10_000_000) return `${(value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} crore`;
    if (abs >= 100_000) return `${(value / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh`;
  }
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} billion`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} million`;
  if (abs >= 1000) return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  if (abs >= 100) return value.toFixed(0);
  // Sub-unit values need more than one decimal or the rounding invents a story. A chart of
  // ONI-minus-RONI gaps rendered -0.116 and -0.056 as an identical "-0.1", flattening a
  // two-fold difference and contradicting prose that correctly quoted -0.12 and -0.06.
  // Values at or above 1 are unchanged, and toLocaleString drops trailing zeros, so this
  // only ever ADDS a digit where one is meaningful.
  if (abs < 0.01) return value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
  if (abs < 10) return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

// Spark-grid endpoints need more precision than ordinary axis ticks. Monthly
// series stored in US$ billion are often below 1, where fmt() intentionally
// rounds to a whole axis label and would turn real values into "$0". Switch
// those endpoints to millions until they reach a billion.
export function sparkEndpoint(value: number, unit = "") {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (/US\$|usd|\$/i.test(unit) && /billion|\bbn\b/i.test(unit)) {
    if (abs === 0) return "$0";
    if (abs >= 1) return `${sign}$${abs.toLocaleString("en-IN", { maximumFractionDigits: 2 })}bn`;
    return `${sign}$${(abs * 1_000).toLocaleString("en-IN", { maximumFractionDigits: abs < 0.01 ? 1 : 0 })}m`;
  }
  return fmt(value, unit);
}

// Split a formatted axis label ("₹400 lakh cr") into its numeric head ("₹400") and
// unit suffix ("lakh cr"). The suffix is read from the top tick (the only one fmt()
// always tags with the unit) so every tick splits on the same boundary.
export function splitUnitLabel(full: string, ref: string) {
  const m = ref.match(/^([₹$]?\s?[\d.,]+)(.*)$/);
  const suffix = m && m[2] ? m[2].trim() : "";
  let bare = suffix && full.endsWith(suffix) ? full.slice(0, full.length - suffix.length).trimEnd() : full;
  // If the axis's reference (top) tick carries no currency symbol, this axis isn't money
  // at this magnitude — so strip a stray leading ₹/$ off other ticks. Fixes the zero
  // special-case emitting "₹0" next to bare "20.0/40.0" on small-value rupee/index axes.
  if (!/^[₹$]/.test(ref)) bare = bare.replace(/^[₹$]/, "");
  return { bare, suffix };
}

// The unit suffix to show ONCE as a caption above the axis (mobile), e.g. "lakh cr".
export function yUnitCaption(ticks: number[], unit = "") {
  const ref = fmt(ticks[ticks.length - 1], unit);
  return splitUnitLabel(ref, ref).suffix;
}

// Y-axis label. Desktop: show the unit on the top tick only, bare numbers below —
// repeating "lakh cr" on every gridline is visual noise. Mobile (`bareAll`): every
// tick is a bare number and the unit moves to a caption above the axis (yUnitCaption),
// so the narrow box doesn't reserve a wide left gutter for one long top label.
export function yTickLabel(tick: number, ti: number, ticks: number[], unit = "", bareAll = false) {
  const full = fmt(tick, unit);
  const ref = fmt(ticks[ticks.length - 1], unit);
  if (!bareAll && ti === ticks.length - 1) return full; // topmost tick keeps the full unit
  return splitUnitLabel(full, ref).bare;
}

export function compactBarLabel(value: number, unit = "") {
  const abs = Math.abs(value);
  if (/multiple/i.test(unit)) return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}x`;
  if (/%|percent/i.test(unit)) return `${value.toLocaleString("en-IN", { maximumFractionDigits: abs >= 100 ? 0 : 1 })}%`;
  if (/crore/i.test(unit) && /inr|₹|rs/i.test(unit)) {
    if (abs >= 100_000) return `₹${(value / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L cr`;
    if (abs >= 1_000) return `₹${(value / 1_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k cr`;
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} cr`;
  }
  if (/rupees|inr|₹/i.test(unit)) {
    if (abs >= 1_000_000_000_000) return `₹${(value / 1_000_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L cr`;
    if (abs >= 10_000_000) return `₹${(value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} cr`;
  }
  return fmt(value, unit);
}

export function endLabelInScale(value: number, maxAbs: number, unit = "", compact = false, bare = false) {
  // Format every line's end label in ONE scale (chosen from the chart's largest value)
  // so they're comparable AND the unit is obvious — a small line reads "₹0.2 lakh cr",
  // not fmt()'s per-value "₹22.3k cr" which looks bigger than the "₹7.4 lakh cr" on top.
  // `compact` swaps verbose scale words for short ones on the narrow mobile box.
  // `bare` drops the scale word entirely (keeps currency + number) — mobile multi-line
  // charts carry the unit once in the axis caption, so the end labels stay short and
  // the plot keeps its width. "%" / "x" attach directly and always survive.
  const n = (v: number, divisor: number) =>
    (v / divisor).toLocaleString("en-IN", { maximumFractionDigits: 1 });
  const w = (short: string, long: string) => bare ? "" : ` ${compact ? short : long}`;
  if (/multiple/i.test(unit)) return `${n(value, 1)}x`;
  if (/%|percent/i.test(unit)) return `${value.toLocaleString("en-IN", { maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1 })}%`;
  if (/(station-years|station-days|station records|daily rows|listed files|stations|towns\/city names)/i.test(unit)) {
    return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }
  if (/crore/i.test(unit) && /inr|₹|rs/i.test(unit)) {
    if (maxAbs >= 100_000) return `₹${n(value, 100_000)}${w("L cr", "lakh cr")}`;
    if (maxAbs >= 1_000) return `₹${n(value, 1_000)}${bare ? "k" : "k cr"}`;
    return `₹${n(value, 1)}${w("cr", "cr")}`;
  }
  if (/rupees|inr|₹/i.test(unit)) {
    if (maxAbs >= 1e12) return `₹${n(value, 1e12)}${w("L cr", "lakh cr")}`;
    if (maxAbs >= 1e7) return `₹${n(value, 1e7)}${w("cr", "cr")}`;
    if (maxAbs >= 1e5) return `₹${n(value, 1e5)}${w("lakh", "lakh")}`;
  }
  if (/US\$|usd|\$/i.test(unit) && /billion|\bbn\b/i.test(unit)) {
    return `$${value.toLocaleString("en-IN", { maximumFractionDigits: Math.abs(value) >= 10 ? 1 : 2 })}${w("bn", "billion")}`;
  }
  if (/US\$|usd|\$/i.test(unit)) {
    if (maxAbs >= 1e12) return `$${n(value, 1e12)}${w("T", "trillion")}`;
    if (maxAbs >= 1e9) return `$${n(value, 1e9)}${w("B", "billion")}`;
  }
  if (/people/i.test(unit)) {
    if (maxAbs >= 1e7) return `${n(value, 1e7)}${w("crore", "crore")}`;
    if (maxAbs >= 1e5) return `${n(value, 1e5)}${w("lakh", "lakh")}`;
  }
  if (maxAbs >= 1e9) return `${n(value, 1e9)}${w("bn", "billion")}`;
  if (maxAbs >= 1e6) return `${n(value, 1e6)}${w("M", "million")}`;
  return bare ? fmt(value, "") : fmt(value, unit);
}

export function pct(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "n/a";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
}

export function signedFmt(value: number, unit = "") {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${fmt(Math.abs(value), unit)}`;
}

export function yearSpan(start: string, end: string) {
  const startYear = Number(start);
  const endYear = Number(end);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  const span = endYear - startYear;
  return span > 0 ? span : null;
}

export function multiple(start: number, end: number) {
  if (!start || !Number.isFinite(start) || !Number.isFinite(end)) return "n/a";
  return `${(end / start).toLocaleString("en-IN", { maximumFractionDigits: 2 })}x`;
}

// Round axis bounds and ticks to "nice" values (1/2/5 x 10^n), the d3-style algorithm,
// so a chart reads 0 / 1B / 2B / 3B instead of 0 / 835.1M / 1.7B / 2.5B.
export function niceNum(range: number, round: boolean) {
  if (!(range > 0) || !Number.isFinite(range)) return 1;
  const exp = Math.floor(Math.log10(range));
  const frac = range / Math.pow(10, exp);
  const nf = round
    ? (frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10)
    : (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10);
  return nf * Math.pow(10, exp);
}
/** Like niceScale, but picks the tick count (4 to 6) that leaves the least empty
 *  headroom above the data, so a series that tops out at 6.6 gets an axis to 7, not 8. */
export function tightScale(lo: number, hi: number) {
  const options = [4, 5, 6].map((count) => niceScale(lo, hi, count)).filter((s) => s.ticks.length >= 3 && s.ticks.length <= 8);
  const waste = (s: { min: number; max: number }) => (s.max - hi) / Math.max(1e-9, s.max - s.min) + (lo - s.min) / Math.max(1e-9, s.max - s.min);
  return options.sort((a, b) => waste(a) - waste(b))[0] ?? niceScale(lo, hi, 5);
}
export function niceScale(lo: number, hi: number, count = 5) {
  if (!(hi > lo)) hi = lo + 1;
  const step = niceNum(niceNum(hi - lo, false) / Math.max(1, count - 1), true);
  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) ticks.push(Number(v.toPrecision(12)));
  return { min: niceMin, max: niceMax, ticks };
}

/** Give every label in one chart the same number of decimals, so "2.2" does not sit
 *  beside "1.83". Labels are grouped by what surrounds the number (unit, suffix), and
 *  each group is padded to its most precise member; nothing is rounded away. */
export function harmoniseDecimals(labels: string[]) {
  const re = /^([^\d]*?)(\d[\d,]*)(?:\.(\d+))?(.*)$/;
  const parts = labels.map((l) => String(l).match(re));
  const key = (m: RegExpMatchArray | null) => (m ? `${m[1].replace(/[-\u2212+]/g, "")}|${m[4]}` : "");
  const need = new Map<string, number>();
  for (const m of parts) if (m) need.set(key(m), Math.max(need.get(key(m)) ?? 0, (m[3] ?? "").length));
  return labels.map((l, i) => {
    const m = parts[i];
    if (!m) return l;
    const d = need.get(key(m)) ?? 0, have = (m[3] ?? "").length;
    if (!d || have >= d || m[2].replace(/,/g, "").length >= 3) return l;
    return `${m[1]}${m[2]}.${(m[3] ?? "").padEnd(d, "0")}${m[4]}`;
  });
}
