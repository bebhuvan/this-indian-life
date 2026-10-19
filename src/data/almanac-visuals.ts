// Adapters from a registry visualPlan entry to an Almanac figure. Each reads plain
// artifacts (series or tables) and returns an AlmanacVisual: a desktop SVG, a phone
// SVG drawn for that width (not shrunk), and the rows behind it for the CSV download.
// Builders return null when their data is missing, so a plan entry fails soft.
import { INK, SCALES, type Stops, heatStrip, tileGrid, scatterFit, parade, sensitivity, dumbbell, rankSlope, beeswarm, dayRibbon, unitChart, intervalPlot, ridgeline, calendarHeat, connectedScatter, waterfall, type ScatterPoint } from "./almanac";

type Row = Record<string, unknown>;
export type AlmanacArtifact = {
  indicatorId: string; title: string; unit: string; sourceId: string; sourceIndicatorId: string; sourceUrl: string;
  artifactType?: string; observations?: Array<{ date: string; value: number | null }>; rows?: Row[]; metadata?: Record<string, unknown>;
};
export type AlmanacVisual = {
  kind: "almanac";
  form: string;
  title: string;
  subtitle: string;
  unit: string;
  source: { indicatorId?: string; sourceId: string; sourceIndicatorId: string; sourceUrl?: string };
  svg: string;
  svgM: string;
  rows: Row[];
  /** A one-line statistic the figure computed itself (for example a correlation). */
  stat?: string;
};
export type AlmanacEntry = {
  chart: string; indicator?: string; title?: string; subtitle?: string; unit?: string;
  series?: Array<{ indicator: string; label: string; short?: string; pos?: [number, number] }>;
  // form options
  scale?: keyof typeof SCALES; threshold?: number; thresholdLabel?: string; legendTicks?: number[]; emphasis?: string;
  reference?: string; yRange?: [number, number]; sizePrefix?: string; sizeFallback?: Record<string, number>; sizeTitle?: string; sizeKey?: Array<[number, string]>;
  labels?: string[]; refY?: { value: number; label: string }; xField?: string; yField?: string; groupField?: string; band?: [number, number];
  highlight?: { curve: string; at: [number, number] }; widths?: number[]; aField?: string; bField?: string; labelField?: string;
  aLabel?: string; bLabel?: string; exclude?: string[]; xFormat?: "pct" | "lakh" | "plain"; domain?: [number, number]; ticks?: number[]; xTitle?: string; yTitle?: string;
  groupIndicator?: string; groups?: Array<{ key: string; label: string; color: string }>; marks?: Record<string, string>;
  parts?: Array<{ label: string; rows: Array<{ indicator: string; label: string; color?: string }> }>; total?: number; match?: string;
  loField?: string; hiField?: string; midField?: string; eras?: Array<[number, number]>; transform?: "pctChange"; years?: number;
  paths?: Array<{ label: string; x: string; y: string; color?: string; emphasis?: boolean }>; xLog?: boolean; totalIndicator?: string; totalLabel?: string;
};
type Lookup = (indicatorId: string) => AlmanacArtifact | undefined;

const SHORT: Record<string, string> = {
  "Andhra Pradesh": "Andhra Pr.", "Madhya Pradesh": "Madhya Pr.", "Uttar Pradesh": "Uttar Pr.", "Himachal Pradesh": "Himachal",
  "Jammu & Kashmir": "J&K", "Jammu and Kashmir": "J&K", "West Bengal": "W. Bengal", "Arunachal Pradesh": "Arunachal", "Chhattisgarh": "Chhattisgarh",
};
const short = (s: string) => SHORT[s] ?? s;
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const series = (a?: AlmanacArtifact) =>
  (a?.observations ?? []).filter((o) => o.value != null && /^\d{4}/.test(o.date)).map((o) => [Number(o.date.slice(0, 4)), o.value as number] as [number, number]).sort((x, y) => x[0] - y[0]);
/** Source for a figure drawn from many per-unit series: drop the first unit's name. */
const multiSource = (a: AlmanacArtifact, label: string) => ({ ...srcOf(a), sourceIndicatorId: a.sourceIndicatorId.replace(new RegExp(`[\\s,·:-]*${label}$`), "") + " by state" });
const srcOf = (a: AlmanacArtifact) => ({ indicatorId: a.indicatorId, sourceId: a.sourceId, sourceIndicatorId: a.sourceIndicatorId, sourceUrl: a.sourceUrl });
const tag = (s: string, cls: string) => s.replace(`class="viz-svg alm"`, `class="viz-svg ${cls} alm"`);
const pair = (d: string, m: string) => ({ svg: tag(d, "viz-d"), svgM: tag(m, "viz-m") });
const fmt1 = (v: number) => v.toFixed(1);
const PALETTE = [INK.neel, INK.sindoor, INK.hara, INK.haldi, INK.jamun];
// Rural is always hara and urban always neel, wherever they appear.
const colourFor = (label: string, i: number) => (/rural|village/i.test(label) ? INK.hara : /urban|cit(y|ies)|town/i.test(label) ? INK.neel : /all india|^india$|total/i.test(label) ? INK.ink : PALETTE[i % PALETTE.length]);

/** Nice axis bounds and ticks on a 1/2/2.5/5 ladder, five to seven intervals. */
function niceAxis(lo: number, hi: number, zero = false): { min: number; max: number; ticks: number[] } {
  if (zero) lo = Math.min(0, lo);
  const span = hi - lo || Math.abs(hi) || 1, rough = span / 5, pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => span / s <= 7) ?? 10 * pow;
  const min = Math.floor(lo / step) * step, max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { min, max, ticks };
}
const unitFmt = (unit: string) => (/%|per ?cent/i.test(unit) ? (v: number) => `${Math.round(v)}%` : /₹|rupee|rs\b/i.test(unit) ? (v: number) => `₹${v.toLocaleString("en-IN")}` : (v: number) => (Math.abs(v) < 10 && v % 1 ? v.toFixed(1) : v.toLocaleString("en-IN")));

// ---------------------------------------------------------------- heat strip
function heatStripVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const rows0 = (e.series ?? []).map((s) => ({ s, a: get(s.indicator) })).filter((r) => r.a && series(r.a).length > 1);
  if (rows0.length < 2) return null;
  const t = e.threshold;
  const rows = rows0.map(({ s, a }) => {
    const points = series(a);
    return { label: s.label, shortLabel: s.short ?? short(s.label), points, emphasis: s.label === e.emphasis, marker: t == null ? null : points.find(([, v]) => v <= t)?.[0] ?? null };
  }).sort((a, b) => (a.marker ?? 9999) - (b.marker ?? 9999) || a.points[a.points.length - 1][1] - b.points[b.points.length - 1][1]);
  const from = Math.min(...rows.map((r) => r.points[0][0])), to = Math.max(...rows.map((r) => r.points[r.points.length - 1][0]));
  const stops: Stops = SCALES[e.scale ?? "fertility"];
  const first = rows0[0].a!, unit = e.unit ?? first.unit;
  const common = {
    stops, from, to, legendTicks: e.legendTicks ?? [1.5, 2.1, 3, 4, 5], legendTitle: unit.replace(/^./, (c) => c.toUpperCase()),
    legendMark: t != null ? { value: t, label: e.thresholdLabel ?? "" } : undefined, hot: (v: number) => (t != null ? v > t : false),
    markerNote: t != null ? `First year at or below ${t} ${unit}${e.thresholdLabel ? `, the ${e.thresholdLabel} rate` : ""}` : undefined,
    label: e.title ?? first.title,
  };
  const { svg, svgM } = pair(heatStrip(rows, { ...common, width: 1040 }), heatStrip(rows, { ...common, width: 350, rowH: 14, gap: 3, labelW: 70, rightW: 30, compact: true }));
  return {
    kind: "almanac", form: "heatStrip", title: e.title ?? first.title, subtitle: e.subtitle ?? "", unit, source: multiSource(first, rows0[0].s.label), svg, svgM,
    rows: rows.flatMap((r) => r.points.map(([date, value]) => ({ series: r.label, date, value }))),
  };
}

// ---------------------------------------------------------------- tile map
function tileGridVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const tiles = (e.series ?? []).filter((s) => s.pos).map((s) => ({ label: short(s.label), col: s.pos![0], row: s.pos![1], points: series(get(s.indicator)) })).filter((t) => t.points.length > 1);
  if (tiles.length < 3) return null;
  const ref = e.reference ? series(get(e.reference)) : undefined;
  const first = get(e.series![0].indicator)!;
  const all = tiles.flatMap((t) => t.points.map((p) => p[0]));
  const vals = tiles.flatMap((t) => t.points.map((p) => p[1]));
  const [yMin, yMax] = e.yRange ?? [Math.floor(Math.min(...vals)), Math.ceil(Math.max(...vals))];
  const opts = { reference: ref, threshold: e.threshold ?? 0, thresholdLabel: e.thresholdLabel ? `${e.threshold}` : undefined, from: Math.min(...all), to: Math.max(...all), yMin, yMax, label: e.title ?? first.title };
  const cols = Math.max(...tiles.map((t) => t.col)) + 1;
  const { svg, svgM } = pair(tileGrid(tiles, { ...opts, tw: 124, th: 92, keyAt: [Math.max(0, cols - 3), Math.max(...tiles.map((t) => t.row)) - 1] }), tileGrid(tiles, { ...opts, tw: 44, th: 40, g: 6 }));
  return { kind: "almanac", form: "tileGrid", title: e.title ?? first.title, subtitle: e.subtitle ?? "", unit: e.unit ?? first.unit, source: multiSource(first, e.series![0].label), svg, svgM, rows: tiles.flatMap((t) => t.points.map(([date, value]) => ({ series: t.label, date, value }))) };
}

// ---------------------------------------------------------------- scatter with fit
function scatterFitVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? "");
  if (!a?.rows?.length) return null;
  const md = (a.metadata ?? {}) as Record<string, unknown>;
  const sizeOf = (label: string): number | undefined => {
    if (!e.sizePrefix) return undefined;
    if (e.sizeFallback?.[label] != null) return e.sizeFallback[label];
    const s = series(get(`${e.sizePrefix}${slug(label)}`));
    return s.length ? s[s.length - 1][1] : undefined;
  };
  const pts: ScatterPoint[] = a.rows.map((r) => ({ label: String(r.label ?? ""), x: Number(r.x), y: Number(r.y), hl: r.highlight === 1 || r.highlight === true }))
    .filter((p) => p.label && Number.isFinite(p.x) && Number.isFinite(p.y))
    .map((p) => ({ label: p.label, short: short(p.label), x: p.x, y: p.y, size: sizeOf(p.label), hot: e.threshold != null ? p.y > e.threshold : false, wantLabel: (e.labels ? e.labels.includes(p.label) : p.hl) }) as ScatterPoint & { wantLabel: boolean });
  if (pts.length < 4) return null;
  const xa = niceAxis(Math.min(...pts.map((p) => p.x)), Math.max(...pts.map((p) => p.x))), ya = niceAxis(Math.min(...pts.map((p) => p.y)), Math.max(...pts.map((p) => p.y)));
  const xf = e.xFormat === "pct" ? (v: number) => `${Math.round(v)}%` : e.xFormat === "lakh" ? (v: number) => `₹${v % 1 ? v.toFixed(1) : v} lakh` : e.xFormat === "plain" ? (v: number) => v.toLocaleString("en-IN") : unitFmt(String(md.xLabel ?? "")), yf = (v: number) => (Math.abs(ya.max) < 10 ? v.toFixed(1) : v.toLocaleString("en-IN"));
  const build = (W: number, H: number) => {
    const placed = placeLabels(pts as Array<ScatterPoint & { wantLabel: boolean }>, { W, H, x: [xa.min, xa.max], y: [ya.min, ya.max], sized: pts.some((p) => p.size != null) });
    return scatterFit(placed, {
      x: [xa.min, xa.max], y: [ya.min, ya.max], xTicks: W < 700 ? xa.ticks.filter((_, i) => i % 2 === 0) : xa.ticks, yTicks: ya.ticks, xFmt: xf, yFmt: yf,
      xTitle: e.xTitle ?? String(md.xLabel ?? "x"), yTitle: e.yTitle ?? String(md.yLabel ?? a.unit), width: W, height: H, refY: e.refY,
      sizeKey: e.sizeKey, sizeTitle: e.sizeTitle, label: e.title ?? a.title,
    });
  };
  const d = build(1040, 460), m = build(350, 360);
  const r = d.stats?.r, n = d.stats?.n;
  return {
    kind: "almanac", form: "scatterFit", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a),
    ...pair(d.svg, m.svg),
    rows: pts.map((p) => ({ label: p.label, x: p.x, y: p.y, ...(p.size != null ? { size: p.size } : {}) })),
    stat: r != null ? `Least-squares fit across ${n} ${n === 1 ? "unit" : "units"}, r = ${r < 0 ? "−" : ""}${Math.abs(r).toFixed(2)}. The grey band is the 95% interval for the fitted line.` : undefined,
  };
}
/**
 * Greedy label placement: try right, left, above, below for each wanted label and
 * keep the first spot that clears the plot edges, every circle and every label
 * already placed. A label that fits nowhere is dropped; the tooltip still names it.
 */
function placeLabels(pts: Array<ScatterPoint & { wantLabel: boolean }>, o: { W: number; H: number; x: [number, number]; y: [number, number]; sized: boolean }) {
  const sm = o.W < 700, ml = 30, mr = 10, mt = 30, mb = 50, rMax = sm ? 15 : 22, size = sm ? 11 : 12, cw = size * 0.56;
  const X = (v: number) => ml + ((v - o.x[0]) / (o.x[1] - o.x[0])) * (o.W - ml - mr), Y = (v: number) => o.H - mb + ((v - o.y[0]) / (o.y[1] - o.y[0])) * (mt - (o.H - mb));
  const pMax = Math.max(...pts.map((p) => p.size ?? 0));
  const rad = (p: ScatterPoint) => (o.sized && p.size ? Math.max(sm ? 2.5 : 3.5, rMax * Math.sqrt(p.size / pMax)) : sm ? 4.5 : 5.5);
  const boxes: Array<[number, number, number, number]> = pts.map((p) => { const r = rad(p); return [X(p.x) - r, Y(p.y) - r, X(p.x) + r, Y(p.y) + r]; });
  const hit = (b: [number, number, number, number]) => b[0] < ml || b[2] > o.W - mr || b[1] < mt - 8 || b[3] > o.H - mb || boxes.some((c) => b[0] < c[2] && b[2] > c[0] && b[1] < c[3] && b[3] > c[1]);
  const order = [...pts].sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  for (const p of order) {
    if (!p.wantLabel) continue;
    const text = sm ? p.short ?? p.label : p.label, w = text.length * cw, r = rad(p) + 5, cx = X(p.x), cy = Y(p.y);
    const tries: Array<[ScatterPoint["place"], [number, number, number, number]]> = [
      ["r", [cx + r, cy - size * 0.7, cx + r + w, cy + size * 0.35]], ["l", [cx - r - w, cy - size * 0.7, cx - r, cy + size * 0.35]],
      ["t", [cx - w / 2, cy - r - size - 1, cx + w / 2, cy - r]], ["b", [cx - w / 2, cy + r, cx + w / 2, cy + r + size + 2]],
    ];
    const ok = tries.find(([, b]) => !hit(b));
    if (ok) { p.place = ok[0]; boxes.push(ok[1]); }
  }
  return pts;
}

// ---------------------------------------------------------------- parade
const FRACTILE_WIDTHS = [5, 5, 10, 10, 10, 10, 10, 10, 10, 10, 5, 5];
function paradeVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const groups = (e.series ?? []).map((s, i) => ({ s, a: get(s.indicator), i })).filter((g) => g.a?.rows?.length);
  if (!groups.length) return null;
  const widths = e.widths ?? FRACTILE_WIDTHS;
  const ser = groups.map(({ s, a, i }) => ({ label: s.label, color: colourFor(s.label, i), values: a!.rows!.map((r) => Number(r.value)), fill: /urban/i.test(s.label) ? 0.07 : 0.14 }));
  if (ser.some((s) => s.values.length !== widths.length)) return null;
  const top = Math.max(...ser.flatMap((s) => s.values)), ax = niceAxis(0, top * 1.04, true);
  const first = groups[0].a!;
  const opts = { widths, yMax: ax.max, yTicks: ax.ticks.filter((v) => v > 0), xTitle: "Everyone lined up from the lowest spender to the highest, percentile", label: e.title ?? first.title };
  const { svg, svgM } = pair(parade(ser, { ...opts, width: 1040, height: 400 }), parade(ser, { ...opts, width: 350, height: 300, xTitle: "Lowest to highest spender, percentile", yTicks: ax.ticks.filter((v, k) => v > 0 && k % 2 === 0) }));
  return { kind: "almanac", form: "parade", title: e.title ?? first.title, subtitle: e.subtitle ?? "", unit: e.unit ?? first.unit, source: srcOf(first), svg, svgM, rows: groups.flatMap(({ s, a }) => a!.rows!.map((r) => ({ series: s.label, group: r.label, value: r.value }))) };
}

// ---------------------------------------------------------------- sensitivity
function sensitivityVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? "");
  if (!a?.rows?.length) return null;
  const xf = e.xField ?? "cutoffRsPerPersonMonth", yf = e.yField ?? "value", gf = e.groupField;
  const keys = gf ? [...new Set(a.rows.map((r) => String(r[gf])))] : [e.title ?? "All"];
  const curves = keys.map((k, i) => ({ label: k, color: colourFor(k, i), width: /all india|total/i.test(k) ? 2.5 : 2, points: a.rows!.filter((r) => !gf || String(r[gf]) === k).map((r) => [Number(r[xf]), Number(r[yf])] as [number, number]).sort((p, q) => p[0] - q[0]) }));
  const xs = curves.flatMap((c) => c.points.map((p) => p[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const span = x1 - x0, step = span / 6 > 900 ? 1000 : 500;
  const xTicks: number[] = []; for (let v = Math.ceil(x0 / step) * step; v <= x1; v += step) xTicks.push(v);
  let highlight;
  if (e.highlight) {
    const c = curves.find((q) => q.label === e.highlight!.curve);
    const v0 = c?.points.find((p) => p[0] === e.highlight!.at[0])?.[1], v1 = c?.points.find((p) => p[0] === e.highlight!.at[1])?.[1];
    if (c && v0 != null && v1 != null) highlight = { curve: c.label, at: e.highlight.at, title: `Move the line by ₹${(e.highlight.at[1] - e.highlight.at[0]).toLocaleString("en-IN")}`, body: ["and the share below it moves", `from ${Math.round(v0)}% to ${Math.round(v1)}%`] as [string, string] };
  }
  const opts = { x: [x0, x1] as [number, number], xTicks, yTicks: [0, 25, 50, 75, 100], band: e.band, highlight, label: e.title ?? a.title };
  const { svg, svgM } = pair(sensitivity(curves, { ...opts, width: 1040, height: 380, xTitle: "Where the line is drawn, rupees per person per month" }), sensitivity(curves, { ...opts, width: 350, height: 300, xTicks: xTicks.filter((_, k) => k % 2 === 0), xTitle: "Line, ₹ per person per month" }));
  return { kind: "almanac", form: "sensitivity", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a), svg, svgM, rows: curves.flatMap((c) => c.points.map(([x, y]) => ({ series: c.label, threshold: x, value: y }))) };
}

// ---------------------------------------------------------------- dumbbell
function dumbbellVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? "");
  if (!a?.rows?.length) return null;
  const lf = e.labelField ?? "state", af = e.aField ?? "nfhs5", bf = e.bField ?? "value";
  const rows = a.rows.filter((r) => r[af] != null && r[bf] != null && !(e.exclude ?? []).includes(String(r[lf])))
    .map((r) => ({ label: String(r[lf]).replace("Jammu and Kashmir", "Jammu & Kashmir"), short: short(String(r[lf])), a: Number(r[af]), b: Number(r[bf]), emphasis: String(r[lf]) === (e.emphasis ?? "India") }))
    .sort((p, q) => q.b - p.b);
  if (rows.length < 3) return null;
  const all = rows.flatMap((r) => [r.a, r.b]), ax = e.domain ? { min: e.domain[0], max: e.domain[1], ticks: e.ticks ?? [] } : niceAxis(Math.min(...all), Math.max(...all));
  const opts = { domain: [ax.min, ax.max] as [number, number], ticks: e.ticks ?? ax.ticks, aLabel: e.aLabel ?? "Before", bLabel: e.bLabel ?? "Latest", label: e.title ?? a.title };
  const { svg, svgM } = pair(dumbbell(rows, { ...opts, width: 1040, rowH: 21 }), dumbbell(rows.filter((r, i) => i % 2 === 0 || r.emphasis), { ...opts, width: 350, rowH: 20, half: true }));
  return { kind: "almanac", form: "dumbbell", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a), svg, svgM, rows: rows.map((r) => ({ label: r.label, [af]: r.a, [bf]: r.b })) };
}

// ---------------------------------------------------------------- rank slope
function rankSlopeVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const [l, r] = (e.series ?? []).map((s) => get(s.indicator));
  if (!l?.rows?.length || !r?.rows?.length) return null;
  const order = (a: AlmanacArtifact) => [...a.rows!].sort((p, q) => Number(q.value) - Number(p.value)).map((x) => String(x.label));
  const left = order(l), right = order(r).filter((s) => left.includes(s));
  const opts = { leftTitle: e.series![0].label, rightTitle: e.series![1].label, label: e.title ?? l.title };
  const { svg, svgM } = pair(rankSlope(left, right, { ...opts, width: 1040, rowH: 22 }), rankSlope(left.map(short), right.map(short), { ...opts, width: 350, rowH: 20 }));
  return { kind: "almanac", form: "rankSlope", title: e.title ?? l.title, subtitle: e.subtitle ?? "", unit: e.unit ?? l.unit, source: srcOf(l), svg, svgM, rows: left.map((s, i) => ({ label: s, [e.series![0].label]: i + 1, [e.series![1].label]: right.indexOf(s) + 1 })) };
}

// ---------------------------------------------------------------- beeswarm
function beeswarmVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? ""), pts0 = series(a);
  if (!a || pts0.length < 10) return null;
  const g = e.groupIndicator ? get(e.groupIndicator) : undefined, gf = e.groupField ?? "oni_monsoon_phase_by_mean";
  const phase = new Map((g?.rows ?? []).filter((r) => !r.region_id || r.region_id === "all_india").map((r) => [Number(r.year), String(r[gf])]));
  const groups = e.groups ?? [{ key: "El Nino", label: "El Niño summer", color: INK.sindoor }, { key: "La Nina", label: "La Niña", color: INK.neel }, { key: "Neutral", label: "Neutral", color: "#a8a8a8" }, { key: "none", label: "Not classified", color: "#dcdcdc" }];
  const pts = pts0.map(([yr, v]) => ({ id: yr, value: v, group: phase.get(yr) ?? "none" }));
  const vals = pts.map((p) => p.value), lo = Math.floor(Math.min(...vals) / 5) * 5 - 3, hi = Math.ceil(Math.max(...vals) / 5) * 5 + 3;
  const labels = Object.fromEntries(Object.entries(e.marks ?? {}).map(([k, text], i) => [k, { dir: (i % 2 ? 1 : -1) as 1 | -1, text }]));
  const sign = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`;
  const opts = { domain: [lo, hi] as [number, number], groups, guides: e.band ?? [-10, 10], guideLabel: "Within 10% of normal", ends: ["Drier", "Wetter"] as [string, string], tickFmt: sign, labels, label: e.title ?? a.title };
  const { svg, svgM } = pair(beeswarm(pts, { ...opts, width: 1040, height: 240, ticks: [-20, -10, 0, 10, 20] }), beeswarm(pts, { ...opts, width: 350, height: 240, r: 2.6, ticks: [-10, 0, 10], labels: {} }));
  return { kind: "almanac", form: "beeswarm", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a), svg, svgM, rows: pts.map((p) => ({ year: p.id, value: p.value, group: p.group })) };
}

// ---------------------------------------------------------------- day ribbon
function dayRibbonVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const rows = (e.parts ?? []).map((row) => ({ label: row.label, parts: row.rows.map((p, i) => { const s = series(get(p.indicator)); return { label: p.label, value: s.length ? s[s.length - 1][1] : NaN, color: p.color ?? [INK.sindoor, INK.neel, INK.hara][i % 3] }; }) }));
  if (!rows.length || rows.some((r) => r.parts.some((p) => !Number.isFinite(p.value)))) return null;
  const first = get(e.parts![0].rows[0].indicator)!, total = e.total ?? 1440;
  const ticks: Array<[number, string]> = total === 1440 ? [[0, "0"], [360, "6"], [720, "12"], [1080, "18"], [1440, "24 hours"]] : [[0, "0"], [total, String(total)]];
  const { svg, svgM } = pair(dayRibbon(rows, { total, ticks, hourly: total === 1440, width: 1040, label: e.title ?? first.title }), dayRibbon(rows, { total, ticks, hourly: total === 1440, width: 350, label: e.title ?? first.title }));
  return { kind: "almanac", form: "dayRibbon", title: e.title ?? first.title, subtitle: e.subtitle ?? "", unit: e.unit ?? first.unit, source: srcOf(first), svg, svgM, rows: rows.flatMap((r) => r.parts.map((p) => ({ group: r.label, part: p.label, value: p.value }))) };
}

// ---------------------------------------------------------------- unit chart
function unitChartVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? "");
  const v = a?.rows?.length ? Number(a.rows.find((r) => String(r[e.labelField ?? "state"]) === (e.match ?? "India"))?.[e.bField ?? "value"]) : series(a).at(-1)?.[1];
  if (!a || v == null || !Number.isFinite(v)) return null;
  const s = unitChart(v, { label: e.title ?? a.title });
  return { kind: "almanac", form: "unitChart", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a), ...pair(s, s), rows: [{ value: v }] };
}

// ---------------------------------------------------------------- interval plot
function intervalVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? "");
  if (!a?.rows?.length) return null;
  const lf = e.labelField ?? "label", lo = e.loField ?? "low", hi = e.hiField ?? "high", mid = e.midField ?? "value";
  const rows = a.rows.map((r) => ({ label: String(r[lf]), lo: Number(r[lo]), hi: Number(r[hi]), mid: r[mid] != null ? Number(r[mid]) : undefined, hot: e.threshold != null && Number(r[mid]) > e.threshold }))
    .filter((r) => Number.isFinite(r.lo) && Number.isFinite(r.hi)).sort((p, q) => (q.mid ?? q.hi) - (p.mid ?? p.hi));
  if (!rows.length) return null;
  const ax = niceAxis(Math.min(0, ...rows.map((r) => r.lo)), Math.max(...rows.map((r) => r.hi)), true), f = unitFmt(a.unit);
  const opts = { domain: [ax.min, ax.max] as [number, number], fmt: f, ref: e.refY, label: e.title ?? a.title, midLabel: rows.some((r) => r.mid != null) ? "Central estimate" : undefined };
  const { svg, svgM } = pair(intervalPlot(rows, { ...opts, ticks: ax.ticks, width: 1040 }), intervalPlot(rows, { ...opts, ticks: ax.ticks.filter((_, i) => i % 2 === 0), width: 350 }));
  return { kind: "almanac", form: "intervalPlot", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a), svg, svgM, rows: rows.map((r) => ({ label: r.label, low: r.lo, high: r.hi, central: r.mid })) };
}

// ---------------------------------------------------------------- ridgeline
function ridgelineVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? ""), pts = series(a);
  if (!a || pts.length < 20 || !e.eras?.length) return null;
  const groups = e.eras.map(([x0, x1]) => ({ label: `${x0}–${String(x1).slice(2)}`, values: pts.filter(([y]) => y >= x0 && y <= x1).map(([, v]) => v) })).filter((g) => g.values.length >= 5);
  const vals = pts.map(([, v]) => v), ax = niceAxis(Math.min(...vals), Math.max(...vals));
  const pad = (ax.max - ax.min) * 0.12, f = unitFmt(a.unit);
  const opts = { domain: [ax.min - pad, ax.max + pad] as [number, number], ticks: ax.ticks, fmt: f, stops: e.scale ? SCALES[e.scale] : undefined, ref: e.threshold, label: e.title ?? a.title };
  const { svg, svgM } = pair(ridgeline(groups, { ...opts, width: 1040 }), ridgeline(groups, { ...opts, width: 350, ticks: ax.ticks.filter((_, i) => i % 2 === 0) }));
  return { kind: "almanac", form: "ridgeline", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a), svg, svgM, rows: groups.flatMap((g) => g.values.map((value) => ({ group: g.label, value }))) };
}

// ---------------------------------------------------------------- calendar heatmap
function calendarVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const a = get(e.indicator ?? "");
  const raw = (a?.observations ?? []).filter((o) => o.value != null && /^\d{4}-\d{2}-\d{2}$/.test(o.date)).map((o) => ({ date: o.date, value: o.value as number })).sort((p, q) => (p.date < q.date ? -1 : 1));
  if (!a || raw.length < 60) return null;
  let pts = e.transform === "pctChange" ? raw.slice(1).map((p, i) => ({ date: p.date, value: ((p.value - raw[i].value) / raw[i].value) * 100 })) : raw;
  const last = Number(pts[pts.length - 1].date.slice(0, 4));
  pts = pts.filter((p) => Number(p.date.slice(0, 4)) > last - (e.years ?? 3));
  const stops: Stops = e.scale ? SCALES[e.scale] : [[-3, "#7a2816"], [-1.5, "#c24a2e"], [-0.4, "#f1cbba"], [0, "#ededed"], [0.4, "#9fcfc0"], [1.5, "#008a6e"], [3, "#0b5e4b"]];
  const f = e.transform === "pctChange" ? (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%` : unitFmt(a.unit);
  const lt: Array<[number, string]> = e.transform === "pctChange" ? [[-2, "−2%"], [0, "0"], [2, "+2%"]] : [];
  const { svg, svgM } = pair(calendarHeat(pts, { stops, width: 1040, fmt: f, legendTicks: lt, label: e.title ?? a.title }), calendarHeat(pts, { stops, width: 350, fmt: f, legendTicks: lt, label: e.title ?? a.title }));
  return { kind: "almanac", form: "calendarHeat", title: e.title ?? a.title, subtitle: e.subtitle ?? "", unit: e.unit ?? a.unit, source: srcOf(a), svg, svgM, rows: pts.map((p) => ({ date: p.date, value: p.value })) };
}

// ---------------------------------------------------------------- connected scatter
function connectedVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const paths = (e.paths ?? []).map((p, i) => {
    const xs = new Map(series(get(p.x))), ys = series(get(p.y));
    return { label: p.label, color: p.color ?? PALETTE[i % PALETTE.length], emphasis: p.emphasis, points: ys.filter(([t]) => xs.has(t)).map(([t, y]) => ({ t, x: xs.get(t)!, y })) };
  }).filter((p) => p.points.length > 2);
  if (!paths.length) return null;
  const first = get(e.paths![0].y)!, all = paths.flatMap((p) => p.points);
  const ya = niceAxis(Math.min(...all.map((p) => p.y)), Math.max(...all.map((p) => p.y)));
  const xmin = Math.min(...all.map((p) => p.x)), xmax = Math.max(...all.map((p) => p.x));
  const xa = e.xLog ? { min: 10 ** Math.floor(Math.log10(xmin)), max: 10 ** Math.ceil(Math.log10(xmax)), ticks: [] as number[] } : niceAxis(xmin, xmax);
  if (e.xLog) for (let v = xa.min; v <= xa.max; v *= 10) xa.ticks.push(v);
  const opts = { x: [xa.min, xa.max] as [number, number], y: [ya.min, ya.max] as [number, number], xTicks: xa.ticks, yTicks: ya.ticks, xLog: e.xLog, refY: e.refY, xTitle: e.xTitle ?? "", yTitle: e.yTitle ?? first.unit, label: e.title ?? first.title };
  const { svg, svgM } = pair(connectedScatter(paths, { ...opts, width: 1040, height: 520 }), connectedScatter(paths, { ...opts, width: 350, height: 340 }));
  return { kind: "almanac", form: "connectedScatter", title: e.title ?? first.title, subtitle: e.subtitle ?? "", unit: e.unit ?? first.unit, source: srcOf(first), svg, svgM, rows: paths.flatMap((p) => p.points.map((q) => ({ series: p.label, year: q.t, x: q.x, y: q.y }))) };
}

// ---------------------------------------------------------------- waterfall
function waterfallVisual(e: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  const parts = (e.series ?? []).map((s) => ({ s, obs: (get(s.indicator)?.observations ?? []).filter((o) => o.value != null) }));
  if (!parts.length || parts.some((p) => !p.obs.length)) return null;
  const date = parts[0].obs[parts[0].obs.length - 1].date;
  const steps = parts.map((p) => ({ label: p.s.label, value: Number(p.obs.find((o) => o.date === date)?.value ?? 0) }));
  if (e.totalIndicator) {
    const tot = (get(e.totalIndicator)?.observations ?? []).find((o) => o.date === date)?.value;
    if (tot != null) { const gap = Math.round((tot - steps.reduce((x, s) => x + s.value, 0)) * 100) / 100; if (Math.abs(gap) >= 0.01) steps.push({ label: "Rounding and weights in the published figures", value: gap }); }
  }
  const first = get(e.series![0].indicator)!, opts = { totalLabel: e.totalLabel ?? "Total", label: e.title ?? first.title };
  const { svg, svgM } = pair(waterfall(steps, { ...opts, width: 1040 }), waterfall(steps, { ...opts, width: 350 }));
  return { kind: "almanac", form: "waterfall", title: e.title ?? first.title, subtitle: e.subtitle ?? "", unit: e.unit ?? first.unit, source: srcOf(first), svg, svgM, rows: steps.map((s) => ({ part: s.label, value: s.value, date })) };
}

const BUILDERS: Record<string, (e: AlmanacEntry, get: Lookup) => AlmanacVisual | null> = {
  heatStrip: heatStripVisual, tileGrid: tileGridVisual, scatterFit: scatterFitVisual, parade: paradeVisual, sensitivity: sensitivityVisual,
  dumbbell: dumbbellVisual, rankSlope: rankSlopeVisual, beeswarm: beeswarmVisual, dayRibbon: dayRibbonVisual, unitChart: unitChartVisual,
  intervalPlot: intervalVisual, ridgeline: ridgelineVisual, calendarHeat: calendarVisual, connectedScatter: connectedVisual, waterfall: waterfallVisual,
};
export const ALMANAC_FORMS = Object.keys(BUILDERS);
export function buildAlmanacVisual(entry: AlmanacEntry, get: Lookup): AlmanacVisual | null {
  return BUILDERS[entry.chart]?.(entry, get) ?? null;
}
