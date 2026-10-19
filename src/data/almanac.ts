// The Almanac chart engine: pure functions that turn plain data into SVG strings,
// rendered at build time (no client JS). Each form takes a data shape, not a
// dataset, so any series of that shape can use it. Ported from the redesign
// prototype; the house rules live here:
//   white ground, hairline neutrals, labels in clear space (no boxes, no leaders
//   unless a label must move), thin marks with a white ring where they overlap,
//   one meaning per colour, and every number set in the grotesque.

export const INK = {
  ink: "#121212", ink2: "#4f4f4f", ink3: "#8a8a8a", grid: "#ededed", rule: "#cfcfcf", band: "#f4f4f4", paper: "#ffffff",
  neel: "#33489a", sindoor: "#c24a2e", hara: "#008a6e", haldi: "#b98014", jamun: "#7b4790",
} as const;

export const F = "Schibsted Grotesk, Helvetica Neue, Arial, sans-serif";
export const r1 = (v: number) => Math.round(v * 10) / 10;
export const esc = (s: string | number) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Final typesetting for a chart's SVG string: a true minus sign (U+2212) wherever a
 *  hyphen stands for a negative number, in visible text and in tooltips. Dates and
 *  ranges ("2016-2025") are untouched because their hyphen follows a digit. */
const minus = (t: string) => t
  .replace(/(^|[\s(\[~≈:|])-(?=\d|\.\d|₹|\$)/g, "$1\u2212")
  .replace(/\s?-(?:&gt;|>)/g, " \u2192")
  .replace(/(?:&lt;|<)-\s?/g, "\u2190 ")
  .replace(/(?:&lt;|<)=/g, "\u2264").replace(/(?:&gt;|>)=/g, "\u2265")
  .replace(/\bdeg(?:rees)? C\b/g, "\u00b0C")
  // a zero needs no scale word: "₹0 lakh" reads as a glitch
  .replace(/^([₹$]?)0 (lakh|crore|cr|L cr|lakh cr|bn|billion|trillion|T)$/, "$10");
export const typeset = (svg: string) =>
  String(svg)
    .replace(/>([^<]+)</g, (_m, t: string) => `>${minus(t)}<`)
    .replace(/data-tip="([^"]*)"/g, (_m, t: string) => `data-tip="${minus(t)}"`);

type TextOpts = { size?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number };
/** Words into lines of at most `chars` characters. */
export function wrapWords(s: string, chars: number) {
  const out: string[] = [];
  let cur = "";
  for (const w of String(s).split(/\s+/).filter(Boolean)) {
    if (cur && (cur + " " + w).length > chars) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}
export const txt = (x: number, y: number, s: string | number, o: TextOpts = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-family="${F}" font-size="${o.size ?? 12}" fill="${o.fill ?? INK.ink2}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.weight ? ` font-weight="${o.weight}"` : ""}>${esc(s)}</text>`;
/** Text with a white halo so it stays legible where it crosses marks. */
export const halo = (x: number, y: number, s: string | number, o: TextOpts = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-family="${F}" font-size="${o.size ?? 12}" fill="none" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.weight ? ` font-weight="${o.weight}"` : ""}>${esc(s)}</text>` + txt(x, y, s, o);
/** A right-aligned row label that wraps onto two lines when it would not fit in `maxW`. */
export function rowLabel(x: number, cy: number, s: string, maxW: number, o: TextOpts = {}) {
  const size = o.size ?? 12.5, fits = s.length * size * 0.55 <= maxW;
  if (fits) return txt(x, cy + size * 0.32, s, { ...o, anchor: "end" });
  const words = s.split(" "); let cut = 1, best = Infinity;
  for (let i = 1; i < words.length; i++) { const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length); if (d < best) { best = d; cut = i; } }
  const a = words.slice(0, cut).join(" "), b = words.slice(cut).join(" ");
  return `<text x="${r1(x)}" y="${r1(cy - size * 0.28)}" font-family="${F}" font-size="${size}" fill="${o.fill ?? INK.ink2}" text-anchor="end"${o.weight ? ` font-weight="${o.weight}"` : ""}><tspan x="${r1(x)}">${esc(a)}</tspan><tspan x="${r1(x)}" dy="${r1(size * 1.15)}">${esc(b)}</tspan></text>`;
}
export const line = (x1: number, y1: number, x2: number, y2: number, c: string = INK.grid, w = 1, dash?: string) =>
  `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
export const dot = (cx: number, cy: number, r: number, fill: string, ring = 1.5) =>
  `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${fill}" stroke="#ffffff" stroke-width="${ring}"/>`;
export const svg = (w: number, h: number, body: string, label: string, cls = "viz-svg alm") =>
  `<svg class="${cls}" viewBox="0 0 ${w} ${r1(h)}" role="img" aria-label="${esc(label)}">${body}</svg>`;
export const scale = (d0: number, d1: number, r0: number, r1_: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1_ - r0);
export const pathOf = (pts: Array<[number, number]>, x: (v: number) => number, y: (v: number) => number) =>
  pts.map(([a, v], i) => `${i ? "L" : "M"}${r1(x(a))} ${r1(y(v))}`).join("");
const AX: TextOpts = { size: 11.5, fill: INK.ink3 };
let UID = 0;
const uid = (p: string) => `${p}${(UID++).toString(36)}`;
export const fmtIN = (n: number) => n.toLocaleString("en-IN");

// ---------- colour: OKLab interpolation so ramps stay even in lightness ----------
const toLin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toS = (c: number) => Math.round(255 * Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)));
function oklab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab([L, a, b]: [number, number, number]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return "#" + rgb.map((c) => toS(c).toString(16).padStart(2, "0")).join("");
}
export type Stops = Array<[number, string]>;
/** A continuous colour scale through named stops, interpolated in OKLab. */
export function ramp(stops: Stops) {
  const labs = stops.map(([v, h]) => [v, oklab(h)] as [number, [number, number, number]]);
  return (v: number) => {
    if (v <= labs[0][0]) return fromLab(labs[0][1]);
    for (let i = 1; i < labs.length; i++) if (v <= labs[i][0]) {
      const [a, la] = labs[i - 1], [b, lb] = labs[i], t = (v - a) / (b - a);
      return fromLab(la.map((c, j) => c + t * (lb[j] - c)) as [number, number, number]);
    }
    return fromLab(labs[labs.length - 1][1]);
  };
}

// Named scales. Diverging scales have a neutral grey middle, never a hue.
export const SCALES = {
  /** births per woman around replacement (2.1) */
  fertility: [[1.0, "#24387f"], [1.3, "#2f4596"], [1.6, "#6a7bc0"], [1.85, "#aeb8de"], [2.1, "#e4e4e4"], [2.35, "#f1cbba"], [2.75, "#e39c81"], [3.5, "#cc6849"], [4.5, "#a8412a"], [5.6, "#7a2816"]] as Stops,
  /** rainfall departure from normal, % (dry haldi to wet hara) */
  rain: [[-22, "#6e4a12"], [-14, "#a8782a"], [-7, "#ddbe84"], [0, "#ededed"], [7, "#9fcfc0"], [14, "#3f9a82"], [22, "#0b5e4b"]] as Stops,
  /** sequential, one ink light to dark */
  neel: [[0, "#e3e7f3"], [0.5, "#6e80bf"], [1, "#233472"]] as Stops,
};

/**
 * Legend for a continuous scale. Stops are spaced evenly so both arms of a diverging
 * scale get equal room; `mark` names the meaningful middle once.
 */
export function scaleLegend(x0: number, y0: number, w: number, stops: Stops, opts: { ticks: number[]; mark?: { value: number; label: string }; title?: string; fmt?: (v: number) => string }) {
  const col = ramp(stops), n = 90, k = stops.length - 1;
  const pos = (v: number) => {
    let i = stops.findIndex(([s]) => s >= v); if (i <= 0) i = 1;
    const a = stops[i - 1][0], c = stops[i][0];
    return x0 + ((i - 1 + Math.min(1, Math.max(0, (v - a) / (c - a)))) / k) * w;
  };
  let b = opts.title ? txt(x0, y0 - 10, opts.title, { size: 11.5, fill: INK.ink2, weight: 500 }) : "";
  for (let i = 0; i < n; i++) {
    const f = ((i + 0.5) / n) * k, j = Math.min(k - 1, Math.floor(f));
    const v = stops[j][0] + (f - j) * (stops[j + 1][0] - stops[j][0]);
    b += `<rect x="${r1(x0 + (i * w) / n)}" y="${y0}" width="${r1(w / n + 0.5)}" height="7" fill="${col(v)}"/>`;
  }
  const fmt = opts.fmt ?? ((v: number) => String(v));
  for (const v of opts.ticks) {
    const mark = opts.mark && Math.abs(v - opts.mark.value) < 1e-9, x = pos(v);
    b += line(x, mark ? y0 - 3 : y0 + 7, x, y0 + 11, mark ? INK.ink : INK.ink3, mark ? 1 : 0.75);
    b += txt(x, y0 + 23, mark ? `${fmt(v)} ${opts.mark!.label}` : fmt(v), { size: 10.5, fill: mark ? INK.ink : INK.ink2, anchor: "middle", weight: mark ? 600 : undefined });
  }
  return b;
}

// =====================================================================
// 1. HEAT STRIP — many units × many years, one measure
// =====================================================================
export type HeatRow = { label: string; shortLabel?: string; points: Array<[number, number]>; emphasis?: boolean; marker?: number | null };
export function heatStrip(rows: HeatRow[], o: {
  stops: Stops; from: number; to: number; width?: number; rowH?: number; gap?: number; labelW?: number; rightW?: number;
  compact?: boolean; legendTicks: number[]; legendMark?: { value: number; label: string }; legendTitle?: string;
  markerNote?: string; valueFmt?: (v: number) => string; hot?: (v: number) => boolean; label: string;
}) {
  const W = o.width ?? 1040, compact = !!o.compact;
  const rowH = o.rowH ?? 20, gap = o.gap ?? 5;
  // The label and value columns are at least as wide as what they print, so a long name
  // ("Maharashtra") or the last year never runs off the figure on a phone.
  const ls = compact ? 11 : 12.5, fmt0 = o.valueFmt ?? ((v: number) => v.toFixed(1));
  const nameW = Math.max(...rows.map((r) => String(compact ? r.shortLabel ?? r.label : r.label).length * ls * (r.emphasis ? 0.6 : 0.56)));
  const valW = Math.max(String(o.to).length * (compact ? 10.5 : 11.5) * 0.58, ...rows.map((r) => fmt0(r.points[r.points.length - 1][1]).length * ls * 0.6));
  const labelW = Math.max(o.labelW ?? 140, nameW + 14), rightW = Math.max(o.rightW ?? 80, valW + 16);
  const col = ramp(o.stops), n = o.to - o.from + 1, id = uid("hs");
  const top = 30, plotW = W - labelW - rightW, cw = plotW / n;
  const split = rows.findIndex((r) => r.emphasis), extra = compact ? 4 : 8;
  const rowY = (i: number) => top + i * (rowH + gap) + (split < 0 ? 0 : i > split ? 2 * extra : i === split ? extra : 0);
  const rowsH = rowY(rows.length - 1) + rowH - top;
  const H = top + rowsH + (compact ? 64 : 76);
  const xOf = (y: number) => labelW + (y - o.from) * cw;
  const fmt = o.valueFmt ?? ((v: number) => v.toFixed(1));
  const step = compact ? 20 : 10, first = Math.ceil(o.from / step) * step;
  let b = "";
  for (let y = first; y < o.to - 2; y += step) {
    b += txt(xOf(y) + cw / 2, 14, y, { ...AX, anchor: "middle", size: compact ? 10.5 : 11.5 });
    b += line(xOf(y) + cw / 2, 19, xOf(y) + cw / 2, 24, INK.rule, 1);
  }
  b += txt(W - rightW + 12, 14, o.to, { ...AX, size: compact ? 10.5 : 11.5 });
  let clip = `<clipPath id="${id}">`;
  rows.forEach((r, i) => { const s0 = r.points[0][0]; clip += `<rect x="${r1(xOf(s0))}" y="${r1(rowY(i))}" width="${r1(xOf(o.to + 1) - xOf(s0))}" height="${rowH}" rx="${compact ? 1.5 : 2.5}"/>`; });
  b += `<defs>${clip}</clipPath></defs><g clip-path="url(#${id})">`;
  rows.forEach((r, i) => {
    for (const [y, v] of r.points) b += `<rect x="${r1(xOf(y))}" y="${r1(rowY(i))}" width="${r1(cw + 0.6)}" height="${rowH}" fill="${col(v)}"><title>${esc(r.label)}, ${y}: ${fmt(v)}</title></rect>`;
  });
  for (let y = first; y < o.to; y += 10) b += line(xOf(y), top - 2, xOf(y), top + rowsH + 2, "#ffffff", compact ? 0.6 : 0.9);
  b += `</g>`;
  rows.forEach((r, i) => {
    const yy = rowY(i), last = r.points[r.points.length - 1][1], hot = o.hot?.(last) ?? false;
    b += txt(labelW - 10, yy + rowH / 2 + 4, compact ? r.shortLabel ?? r.label : r.label, { anchor: "end", size: compact ? 11 : 12.5, fill: INK.ink, weight: r.emphasis ? 600 : undefined });
    if (r.marker) b += dot(xOf(r.marker) + cw / 2, yy + rowH / 2, compact ? 2.3 : 3, INK.ink, compact ? 1 : 1.25);
    b += txt(W - rightW + 12, yy + rowH / 2 + 4, fmt(last), { size: compact ? 11 : 12.5, fill: hot ? INK.sindoor : INK.ink, weight: r.emphasis || hot ? 600 : undefined });
  });
  const ly = top + rowsH + (compact ? 34 : 44);
  const lg = { ticks: o.legendTicks, mark: o.legendMark, title: compact ? undefined : o.legendTitle };
  if (compact) b += scaleLegend(0, ly, W, o.stops, lg);
  else {
    b += scaleLegend(labelW, ly, 340, o.stops, lg);
    if (o.markerNote) { const lx = labelW + 400; b += dot(lx, ly + 3, 3, INK.ink, 1.25) + txt(lx + 10, ly + 7, o.markerNote, { size: 11.5 }); }
  }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 2. TILE-MAP SMALL MULTIPLES — one series per state, laid out like the map
// =====================================================================
export type Tile = { label: string; col: number; row: number; points: Array<[number, number]> };
export function tileGrid(tiles: Tile[], o: {
  reference?: Array<[number, number]>; threshold: number; from: number; to: number; yMin: number; yMax: number;
  tw?: number; th?: number; g?: number; cols?: number; rows?: number; above?: string; below?: string; keyAt?: [number, number];
  valueFmt?: (v: number) => string; label: string; referenceLabel?: string; thresholdLabel?: string;
}) {
  const tw = o.tw ?? 124, th = o.th ?? 92, g = o.g ?? 14, small = tw < 100, id = uid("tg");
  const cols = o.cols ?? Math.max(...tiles.map((t) => t.col)) + 1, nrows = o.rows ?? Math.max(...tiles.map((t) => t.row)) + 1;
  const W = cols * (tw + g) - g, H = nrows * (th + g) - g;
  const fmt = o.valueFmt ?? ((v: number) => v.toFixed(1));
  const above = o.above ?? INK.sindoor, below = o.below ?? INK.neel;
  let b = "", defs = "";
  tiles.forEach((t, k) => {
    const ox = t.col * (tw + g), oy = t.row * (th + g), head = small ? 26 : 24;
    const px = scale(o.from, o.to, ox, ox + tw - 4), py = scale(o.yMin, o.yMax, oy + th, oy + head + 2);
    const last = t.points[t.points.length - 1][1], hot = last > o.threshold, rp = py(o.threshold);
    const area = `${pathOf(t.points, px, py)}V${r1(rp)}H${r1(px(t.points[0][0]))}Z`;
    defs += `<clipPath id="${id}a${k}"><rect x="${ox}" y="${oy}" width="${tw}" height="${r1(Math.max(0, rp - oy))}"/></clipPath><clipPath id="${id}b${k}"><rect x="${ox}" y="${r1(rp)}" width="${tw}" height="${r1(Math.max(0, oy + th - rp))}"/></clipPath>`;
    b += `<path d="${area}" fill="${above}" fill-opacity="0.17" clip-path="url(#${id}a${k})"/>`;
    b += `<path d="${area}" fill="${below}" fill-opacity="0.3" clip-path="url(#${id}b${k})"/>`;
    b += line(ox, oy + th, ox + tw, oy + th, INK.rule, 1);
    b += line(ox, rp, ox + tw, rp, INK.ink3, 0.6, "2 2");
    if (o.reference) b += `<path d="${pathOf(o.reference, px, py)}" fill="none" stroke="#bdbdbd" stroke-width="1"/>`;
    b += `<path d="${pathOf(t.points, px, py)}" fill="none" stroke="${INK.ink}" stroke-width="${small ? 1.1 : 1.35}" stroke-linejoin="round" stroke-linecap="round"><title>${esc(t.label)}: ${fmt(last)} in ${t.points[t.points.length - 1][0]}</title></path>`;
    b += `<circle cx="${r1(px(t.points[t.points.length - 1][0]))}" cy="${r1(py(last))}" r="${small ? 2 : 2.6}" fill="${hot ? above : below}" stroke="#ffffff" stroke-width="1"/>`;
    b += txt(ox, oy + 11, t.label, { size: small ? 10.5 : 11.5, fill: INK.ink, weight: 500 });
    b += txt(small ? ox : ox + tw, oy + (small ? 23 : 11), fmt(last), { size: small ? 10.5 : 12, fill: hot ? above : below, weight: 600, anchor: small ? "start" : "end" });
  });
  if (o.keyAt) {
    const kx = o.keyAt[0] * (tw + g), ky = o.keyAt[1] * (th + g) + 8, sw = 22, tl = o.thresholdLabel ?? String(o.threshold);
    const keys: Array<[string, string]> = [
      [`<rect x="${kx}" y="${ky - 6}" width="${sw}" height="10" fill="${above}" fill-opacity="0.17"/>`, `Years above ${tl}`],
      [`<rect x="${kx}" y="${ky + 14}" width="${sw}" height="10" fill="${below}" fill-opacity="0.3"/>`, `Years below ${tl}`],
      [line(kx, ky + 40, kx + sw, ky + 40, INK.ink, 1.35), "The state"],
    ];
    if (o.reference) keys.push([line(kx, ky + 60, kx + sw, ky + 60, "#bdbdbd", 1), o.referenceLabel ?? "India, for comparison"]);
    keys.forEach(([m, s], i) => { b += m + txt(kx + sw + 8, ky + i * 20 + 4, s, { size: small ? 10.5 : 11.5 }); });
    b += txt(kx, ky + keys.length * 20 + 6, `Figure: ${o.to}. Red if still above ${tl}`, { size: small ? 10.5 : 11.5, fill: INK.ink3 });
  }
  return svg(W, H, `<defs>${defs}</defs>` + b, o.label);
}

// =====================================================================
// 3. STRIPES — one value per year, a band of colour (the monsoon hero)
// =====================================================================
export function stripes(points: Array<{ year: number; value: number; flag?: boolean }>, o: {
  stops: Stops; width?: number; height?: number; compact?: boolean; marks?: Record<number, string>; label: string; valueFmt?: (v: number) => string; tickStep?: number;
}) {
  const W = o.width ?? 1160, H = o.height ?? 230, sm = !!o.compact, col = ramp(o.stops);
  // Stripes are placed by year, so a gap in the record stays a gap (and the last year
  // still lands at the right edge) instead of every later stripe sliding left.
  const y0 = points[0].year, top = sm ? 44 : 52, bh = H - top - (sm ? 54 : 46), sw = W / (points[points.length - 1].year - y0 + 1);
  const xOf = (yr: number) => (yr - y0) * sw;
  const fmt = o.valueFmt ?? ((v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v))}%`);
  let b = "";
  for (const p of points) b += `<rect x="${r1(xOf(p.year))}" y="${top}" width="${r1(sw + 0.5)}" height="${bh}" fill="${col(p.value)}"><title>${p.year}: ${fmt(p.value)}</title></rect>`;
  const marks = o.marks ?? {};
  const keys = Object.keys(marks).map(Number).sort((a, b2) => a - b2);
  for (const yr of keys) {
    const p = points.find((q) => q.year === yr); if (!p) continue;
    const cx = xOf(yr) + sw / 2, near = keys.find((k) => k !== yr && Math.abs(k - yr) <= 2);
    const anchor = near === undefined ? "middle" : near > yr ? "end" : "start";
    b += line(cx, top - 14, cx, top - 3, INK.ink, 0.75);
    b += txt(cx, top - 20, marks[yr], { size: sm ? 10.5 : 11.5, fill: INK.ink, weight: 600, anchor });
    b += txt(cx, top - 34, fmt(p.value), { size: sm ? 10 : 11, fill: INK.ink2, anchor });
  }
  for (const p of points) if (p.flag) b += `<rect x="${r1(xOf(p.year) + sw / 2 - 2)}" y="${top + bh + 5}" width="4" height="4" fill="${INK.sindoor}"/>`;
  const ay = top + bh + 26, st = o.tickStep ?? (sm ? 30 : 10);
  for (let yr = Math.ceil((y0 + 5) / st) * st; yr <= points[points.length - 1].year; yr += st) { const tx = xOf(yr) + sw / 2; b += txt(tx, ay, yr, { ...AX, size: sm ? 10.5 : 11.5, anchor: tx > W - 16 ? "end" : tx < 16 ? "start" : "middle" }); }
  return svg(W, H, b, o.label);
}

/** A small colour key for a continuous scale, labelled at chosen values. */
export function scaleKey(stops: Stops, ticks: Array<[number, string]>, width = 220) {
  // Inset the bar so end labels centred on the extremes stay inside the box.
  const col = ramp(stops), lo = stops[0][0], hi = stops[stops.length - 1][0], pad = 16, bw = width - 2 * pad;
  let b = "";
  for (let i = 0; i < 60; i++) { const v = lo + ((hi - lo) * (i + 0.5)) / 60; b += `<rect x="${r1(pad + (i * bw) / 60)}" y="0" width="${r1(bw / 60 + 0.5)}" height="7" fill="${col(v)}"/>`; }
  for (const [v, s] of ticks) { const x = pad + ((v - lo) / (hi - lo)) * bw; b += line(x, 7, x, 11, INK.ink3, 0.75) + txt(x, 23, s, { size: 10.5, fill: INK.ink2, anchor: "middle" }); }
  return svg(width, 26, b, "Colour key", "alm-key");
}

// =====================================================================
// 4. SCATTER WITH A FIT — two measures for the same units
// =====================================================================
export type ScatterPoint = { label: string; short?: string; x: number; y: number; size?: number; hot?: boolean; place?: "r" | "l" | "t" | "b" };
export function scatterFit(pts: ScatterPoint[], o: {
  x: [number, number]; y: [number, number]; xTicks: number[]; yTicks: number[]; xFmt?: (v: number) => string; yFmt?: (v: number) => string;
  xTitle: string; yTitle: string; width?: number; height?: number; refY?: { value: number; label: string }; fit?: boolean; sizeKey?: Array<[number, string]>; sizeTitle?: string; label: string;
  /** Colour per point (default: sindoor when hot, else neel). */
  colorOf?: (p: ScatterPoint) => string;
  /** Extra marks drawn under the points, given the scales (zones, guides). */
  under?: (x: (v: number) => number, y: (v: number) => number) => string;
  /** Tooltip lines per point (default: label, x, y). */
  tipOf?: (p: ScatterPoint) => string[];
}) {
  const W = o.width ?? 1040, sm = W < 700;
  // On a phone the size key moves under the plot, where it cannot sit on a point.
  const keyBelow = sm && pts.some((p) => p.size != null) && !!o.sizeKey;
  // Axis titles wrap to the figure instead of running off it; the plot gives up the room.
  const fitLines = (t: string, room: number) => (t.length * 11.5 * 0.56 <= room ? [t] : wrapWords(t, Math.floor(room / (11.5 * 0.56))));
  const xT = fitLines(`${o.xTitle} →`, W - 30 - 4), yT = fitLines(`${o.yTitle} ↑`, W - 4);
  const H = (o.height ?? 460) + (keyBelow ? 80 : 0) + (xT.length - 1) * 14 + (yT.length - 1) * 14;
  const ml = 30, mr = 10, mt = 30 + (yT.length - 1) * 14, mb = 50 + (keyBelow ? 80 : 0) + (xT.length - 1) * 14;
  const x = scale(o.x[0], o.x[1], ml, W - mr), y = scale(o.y[0], o.y[1], H - mb, mt);
  const xf = o.xFmt ?? ((v: number) => String(v)), yf = o.yFmt ?? ((v: number) => v.toFixed(1));
  const sized = pts.some((p) => p.size != null), rMax = sm ? 15 : 22;
  const pMax = Math.max(...pts.map((p) => p.size ?? 0));
  const rad = (s?: number) => (sized && s ? Math.max(sm ? 2.5 : 3.5, rMax * Math.sqrt(s / pMax)) : sm ? 4.5 : 5.5);
  let b = "";
  for (const v of o.yTicks) { if (v !== o.y[0]) b += line(ml, y(v), W - mr, y(v), INK.grid); b += txt(0, y(v) + 4, yf(v), AX); }
  b += line(ml, y(o.y[0]), W - mr, y(o.y[0]), INK.ink, 1);
  for (const v of o.xTicks) { b += line(x(v), y(o.y[0]), x(v), y(o.y[0]) + 5, INK.ink, 1); b += txt(x(v), y(o.y[0]) + 20, xf(v), { ...AX, anchor: x(v) > W - mr - 14 ? "end" : "middle" }); }
  xT.forEach((t, i) => (b += txt(ml, y(o.y[0]) + 46 + i * 14, t, { size: 11.5, fill: INK.ink2 })));
  yT.forEach((t, i) => (b += txt(0, 12 + i * 14, t, { size: 11.5, fill: INK.ink2 })));
  if (o.under) b += o.under(x, y);
  if (o.refY) b += line(ml, y(o.refY.value), W - mr, y(o.refY.value), INK.ink, 0.75, "3 3");
  let stats: { r: number; n: number; slope: number } | null = null;
  if (o.fit !== false && pts.length > 3) {
    // Unweighted least squares: each unit counts once. The band is the 95% interval
    // for the fitted mean, drawn only across the observed range.
    const n = pts.length, mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
    const sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0), sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0), syy = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
    const sl = sxy / sxx, ic = my - sl * mx;
    const se = Math.sqrt(pts.reduce((s, p) => s + (p.y - ic - sl * p.x) ** 2, 0) / (n - 2));
    const tq = tCrit(n - 2), x0 = Math.min(...pts.map((p) => p.x)), x1 = Math.max(...pts.map((p) => p.x)), N = 40;
    const band = (sg: number) => Array.from({ length: N + 1 }, (_, i) => { const xv = x0 + ((x1 - x0) * i) / N; return [xv, ic + sl * xv + sg * tq * se * Math.sqrt(1 / n + (xv - mx) ** 2 / sxx)] as [number, number]; });
    const cid = uid("sc");
    b += `<defs><clipPath id="${cid}"><rect x="${ml}" y="${mt}" width="${W - ml - mr}" height="${r1(y(o.y[0]) - mt)}"/></clipPath></defs>`;
    b += `<path d="${pathOf(band(1), x, y)}${pathOf(band(-1).reverse(), x, y).replace("M", "L")}Z" fill="${INK.ink}" fill-opacity="0.055" clip-path="url(#${cid})"/>`;
    b += `<g clip-path="url(#${cid})">${line(x(x0), y(ic + sl * x0), x(x1), y(ic + sl * x1), INK.ink2, 1)}</g>`;
    stats = { r: sxy / Math.sqrt(sxx * syy), n, slope: sl };
  }
  const tipA = (p: ScatterPoint) => (o.tipOf ? o.tipOf(p) : [p.label, `${o.xTitle}: ${xf(p.x)}`, `${o.yTitle}: ${yf(p.y)}`]).join("|").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  for (const p of [...pts].sort((a, c) => (c.size ?? 0) - (a.size ?? 0)))
    b += `<circle class="mk" cx="${r1(x(p.x))}" cy="${r1(y(p.y))}" r="${r1(rad(p.size))}" fill="${o.colorOf ? o.colorOf(p) : p.hot ? INK.sindoor : INK.neel}" fill-opacity="${sized ? 0.82 : 1}" stroke="#ffffff" stroke-width="1.25" data-tip="${tipA(p)}"/>`;
  if (o.refY) b += halo(W - mr, y(o.refY.value) - 7, o.refY.label, { size: 11.5, fill: INK.ink2, anchor: "end" });
  // Labels: each named point tries its preferred side, then the other three, and takes the
  // first that touches no dot, no other label, the reference label or the size key. The
  // biggest points are placed first. On a phone a label with no free side is left to the
  // tooltip; on the desk it keeps its preferred side.
  const fs = sm ? 11 : 12;
  const textW = (t: string, size: number) => t.length * size * 0.56;
  type Box = [number, number, number, number];
  const hit = (a: Box, c: Box) => a[0] < c[2] && a[2] > c[0] && a[1] < c[3] && a[3] > c[1];
  const blocked: Box[] = [];
  if (o.refY) { const ty = y(o.refY.value) - 7, w = textW(o.refY.label, 11.5); blocked.push([W - mr - w - 2, ty - 11, W - mr, ty + 3]); }
  if (sized && o.sizeKey && !keyBelow) blocked.push([W - 262, mt - 18, W, mt + 34 + rMax + 22]);
  const dots = pts.map((p) => ({ p, cx: x(p.x), cy: y(p.y), r: rad(p.size) }));
  const named = dots.filter((d) => d.p.place).sort((a, c) => (c.p.size ?? 0) - (a.p.size ?? 0) || Number(!!c.p.hot) - Number(!!a.p.hot));
  for (const d of named) {
    const text = sm ? d.p.short ?? d.p.label : d.p.label, w = textW(text, fs), rr = d.r + 4;
    const pref = d.p.place as "r" | "l" | "t" | "b";
    const order = [pref, ...(["r", "l", "t", "b"] as const).filter((k) => k !== pref)];
    const at = (k: "r" | "l" | "t" | "b") => {
      const [tx, ty, an] = k === "r" ? [d.cx + rr, d.cy + 4, "start"] : k === "l" ? [d.cx - rr, d.cy + 4, "end"] : k === "t" ? [d.cx, d.cy - rr - 1, "middle"] : [d.cx, d.cy + rr + 10, "middle"];
      const x0 = an === "start" ? tx : an === "end" ? tx - w : tx - w / 2;
      return { tx, ty, an, box: [x0 - 1, ty - fs + 2, x0 + w + 1, ty + 3] as Box };
    };
    const free = (bx: Box) => bx[0] >= 0 && bx[2] <= W && bx[1] >= mt - 14 && bx[3] <= y(o.y[0]) - 2
      && !blocked.some((c) => hit(bx, c))
      && !dots.some((q) => q !== d && hit(bx, [q.cx - q.r, q.cy - q.r, q.cx + q.r, q.cy + q.r]));
    // Desk fallback: a side that may graze a dot but never another label.
    const pick = order.map(at).find((c) => free(c.box)) ?? (sm ? null : order.map(at).find((c) => c.box[0] >= 0 && c.box[2] <= W && !blocked.some((q) => hit(c.box, q))) ?? null);
    if (!pick) continue;
    blocked.push(pick.box);
    b += halo(pick.tx, pick.ty, text, { size: fs, fill: INK.ink, anchor: pick.an as TextOpts["anchor"] });
  }
  if (sized && o.sizeKey) {
    const kx = keyBelow ? ml : sm ? W - 150 : W - 250, ky = keyBelow ? y(o.y[0]) + 92 + (xT.length - 1) * 14 : mt + 34;
    b += txt(kx, ky - 30, o.sizeTitle ?? "Size", { size: 11.5, fill: INK.ink2, weight: 500 });
    const offs = sm ? [6, 48, 108] : [8, 50, 116];
    o.sizeKey.forEach(([v, s], i) => {
      const rr = Math.max(sm ? 2.5 : 3.5, rMax * Math.sqrt(v / pMax)), cx = kx + (offs[i] ?? i * 50);
      b += `<circle cx="${r1(cx)}" cy="${r1(ky + rMax - rr)}" r="${r1(rr)}" fill="none" stroke="${INK.ink3}" stroke-width="1"/>`;
      b += txt(cx, ky + rMax + 16, s, { size: 10.5, fill: INK.ink2, anchor: "middle" });
    });
  }
  return { svg: svg(W, H, b, o.label), stats };
}
/** Two-sided 95% t critical value; exact table to 30 df, normal beyond. */
function tCrit(df: number) {
  const T = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];
  return df >= 1 && df <= 30 ? T[df - 1] : 1.96;
}

// =====================================================================
// 5. BEESWARM — one dot per case, every case visible
// =====================================================================
export type SwarmPoint = { id: string | number; value: number; group: string };
export function beeswarm(points: SwarmPoint[], o: {
  domain: [number, number]; groups: Array<{ key: string; label: string; color: string }>; width?: number; height?: number; r?: number;
  ticks: number[]; tickFmt?: (v: number) => string; guides?: number[]; guideLabel?: string; ends?: [string, string]; labels?: Record<string, { dir: 1 | -1; text: string; anchor?: "start" | "middle" | "end" }>; thumb?: boolean; label: string;
}) {
  const W = o.width ?? 1040, H = o.height ?? 230, r = o.r ?? 5.5, thumb = !!o.thumb, narrow = W < 700;
  const ml = 10, mr = 10, axisY = H - (thumb ? 4 : narrow ? 54 : 34);
  const x = scale(o.domain[0], o.domain[1], ml, W - mr);
  const cy = thumb ? H / 2 : (axisY + 30) / 2;
  const gapR = 2 * r + 1.2, d2 = gapR ** 2;
  const placed: Array<SwarmPoint & { x: number; y: number }> = [];
  for (const p of [...points].sort((a, b) => a.value - b.value)) {
    const px = x(p.value), near = placed.filter((q) => Math.abs(q.x - px) < gapR), cands = [0];
    for (const q of near) { const dy = Math.sqrt(Math.max(0, d2 - (q.x - px) ** 2)); cands.push(q.y - cy + dy + 0.01, q.y - cy - dy - 0.01); }
    cands.sort((a, b) => Math.abs(a) - Math.abs(b));
    const dy = cands.find((c) => near.every((q) => (q.x - px) ** 2 + (q.y - cy - c) ** 2 >= d2 - 0.05)) ?? 0;
    placed.push({ ...p, x: px, y: cy + dy });
  }
  const colOf = Object.fromEntries(o.groups.map((g) => [g.key, g.color]));
  const tf = o.tickFmt ?? ((v: number) => String(v));
  let b = "";
  if (!thumb) {
    for (const v of o.guides ?? []) b += line(x(v), 22, x(v), axisY, INK.ink3, 0.75, "3 3");
    if (o.guides?.length === 2 && o.guideLabel) b += txt((x(o.guides[0]) + x(o.guides[1])) / 2, 13, o.guideLabel, { ...AX, anchor: "middle" });
    b += line(ml, axisY, W - mr, axisY, INK.ink, 1);
    for (const v of o.ticks) { b += line(x(v), axisY, x(v), axisY + 5, INK.ink, 1); b += txt(x(v), axisY + 20, tf(v), { ...AX, anchor: "middle" }); }
    if (o.ends) { b += txt(ml, axisY + 20, `← ${o.ends[0]}`, { size: 11.5, fill: INK.ink2, weight: 500 }); b += txt(W - mr, axisY + 20, `${o.ends[1]} →`, { size: 11.5, fill: INK.ink2, weight: 500, anchor: "end" }); }
  }
  for (const p of placed) b += `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r}" fill="${colOf[p.group] ?? "#dcdcdc"}" stroke="#ffffff" stroke-width="1"><title>${esc(p.id)}: ${tf(p.value)}</title></circle>`;
  if (!thumb && o.labels) for (const p of placed) {
    const lab = o.labels[String(p.id)]; if (!lab) continue;
    const ext = placed.filter((q) => Math.abs(q.x - p.x) < r * 1.8).map((q) => q.y);
    const yEdge = lab.dir < 0 ? Math.min(...ext) - r - 3 : Math.max(...ext) + r + 3;
    b += line(p.x, p.y + lab.dir * (r + 1), p.x, yEdge + lab.dir * 6, INK.ink, 0.75);
    b += txt(p.x, yEdge + lab.dir * 10 + (lab.dir > 0 ? 9 : 0), lab.text, { size: 11.5, fill: INK.ink, weight: 600, anchor: lab.anchor ?? "middle" });
  }
  if (!thumb) {
    const widths = o.groups.map((g) => g.label.length * 5.9 + 26);
    let lx = narrow ? ml : W - mr - widths.reduce((a, c) => a + c, 0) + 12;
    const ly = narrow ? H - 4 : 9;
    o.groups.forEach((g, i) => { b += `<circle cx="${lx + 5}" cy="${ly}" r="4.5" fill="${g.color}"/>` + txt(lx + 14, ly + 4, g.label, { size: 11 }); lx += widths[i]; });
  }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 6. DAY RIBBON — parts of a fixed whole (24 hours, a rupee, a hectare)
// =====================================================================
export type RibbonRow = { label: string; parts: Array<{ label: string; value: number; color: string }> };
export function dayRibbon(rows: RibbonRow[], o: { total: number; width?: number; ticks?: Array<[number, string]>; partFmt?: (v: number) => string; hourly?: boolean; bare?: boolean; label: string }) {
  const W = o.width ?? 1040, sm = W < 700, bare = !!o.bare;
  const lw = sm || bare ? 0 : 76, bh = bare ? 26 : sm ? 18 : 22, rowGap = bare ? 26 : sm ? 78 : 62, top = bare ? 4 : sm ? 46 : 26;
  const x = scale(0, o.total, lw, W);
  const pf = o.partFmt ?? ((v: number) => `${Math.floor(v / 60)} h ${String(Math.round(v % 60)).padStart(2, "0")} m`);
  let b = "";
  if (!bare) for (const [v, s] of o.ticks ?? []) b += txt(x(v), 12, s, { ...AX, anchor: v === 0 ? "start" : v === o.total ? "end" : "middle" });
  rows.forEach((r, i) => {
    const yy = top + i * (bh + rowGap);
    if (!bare) b += sm ? txt(0, yy - 9, r.label, { size: 13, fill: INK.ink, weight: 600 }) : txt(lw - 14, yy + bh / 2 + 5, r.label, { size: 13.5, fill: INK.ink, weight: 600, anchor: "end" });
    b += `<rect x="${r1(x(0))}" y="${yy}" width="${r1(W - x(0))}" height="${bh}" fill="#efefef"/>`;
    let acc = 0;
    r.parts.forEach((p, j) => {
      const x0 = x(acc) + (j ? 1.5 : 0), x1 = x(acc + p.value);
      b += `<rect x="${r1(x0)}" y="${yy}" width="${r1(Math.max(1, x1 - x0))}" height="${bh}" fill="${p.color}"><title>${esc(r.label)}, ${esc(p.label)}: ${pf(p.value)}</title></rect>`;
      acc += p.value;
    });
    if (o.hourly) for (let h = 1; h < 24; h++) b += line(x(h * 60), yy + bh - 4, x(h * 60), yy + bh, "#ffffff", 1);
    if (bare) return;
    const ly = yy + bh + 20;
    let px = x(0), acc2 = 0;
    r.parts.forEach((p, j) => {
      if (j) px = Math.max(x(acc2) + 1.5, px + (sm ? 104 : 128));
      b += `<rect x="${r1(px)}" y="${ly - 8}" width="8" height="8" fill="${p.color}"/>` + txt(px + 13, ly, p.label, { size: 12 }) + txt(px + 13, ly + 16, pf(p.value), { size: 13, fill: INK.ink, weight: 600 });
      acc2 += p.value;
    });
  });
  const H = bare ? top + rows.length * (bh + rowGap) - rowGap + 4 : top + rows.length * bh + (rows.length - 1) * rowGap + 40;
  return svg(W, H, b, o.label);
}

// =====================================================================
// 7. PARADE — values for fractiles, each group as wide as its share
// =====================================================================
export type ParadeSeries = { label: string; color: string; values: number[]; fill?: number };
export function parade(series: ParadeSeries[], o: {
  widths: number[]; yMax: number; yTicks: number[]; yFmt?: (v: number) => string; width?: number; height?: number; xTitle?: string;
  note?: { at: number; value: number; title: string; body: string; y: number }; bare?: boolean; label: string;
}) {
  const W = o.width ?? 1040, H = o.height ?? 400, sm = W < 700, bare = !!o.bare;
  const ml = bare ? 0 : 54, mr = bare ? 0 : sm ? 70 : 96, mt = bare ? 4 : 22, mb = bare ? 1 : 46;
  const x = scale(0, 100, ml, W - mr), y = scale(0, o.yMax, H - mb, mt);
  const yf = o.yFmt ?? ((v: number) => `₹${fmtIN(v)}`);
  const step = (vals: number[]) => { let c = 0, d = ""; vals.forEach((v, i) => { d += `${i ? "L" : "M"}${r1(x(c))} ${r1(y(v))}H${r1(x(c + o.widths[i]))}`; c += o.widths[i]; }); return d; };
  let b = "";
  if (!bare) for (const v of o.yTicks) { b += line(ml, y(v), W - mr, y(v), INK.grid); b += txt(0, y(v) + 4, yf(v), AX); }
  for (const s of [...series].reverse()) b += `<path d="${step(s.values)}V${r1(y(0))}H${r1(x(0))}Z" fill="${s.color}" fill-opacity="${s.fill ?? 0.1}"/>`;
  for (const s of series) b += `<path d="${step(s.values)}" fill="none" stroke="${s.color}" stroke-width="${bare ? 1.75 : 2}"/>`;
  b += line(ml, y(0), W - mr, y(0), INK.ink, 1);
  if (bare) return svg(W, H, b, o.label);
  b += txt(0, y(0) + 4, "0", AX);
  for (let p = 0; p <= 100; p += sm ? 25 : 10) { b += line(x(p), y(0), x(p), y(0) + 5, INK.ink, 1); b += txt(x(p), y(0) + 20, p, { ...AX, anchor: "middle" }); }
  if (o.xTitle) b += txt(ml, H - 4, `${o.xTitle} →`, { size: 11.5, fill: INK.ink2 });
  for (const s of series) { const last = s.values[s.values.length - 1]; b += txt(W - mr + 10, y(last) + 4, s.label, { size: 12.5, fill: s.color, weight: 600 }) + txt(W - mr + 10, y(last) + 19, yf(last), { size: 11.5, fill: INK.ink2 }); }
  if (o.note) {
    const mx = x(o.note.at);
    b += dot(mx, y(o.note.value), 3.5, INK.ink) + line(mx, y(o.note.value) - 6, mx, y(o.note.y), INK.ink, 0.75) + line(mx - 4, y(o.note.y), mx, y(o.note.y), INK.ink, 0.75);
    b += txt(mx - 8, y(o.note.y) - 4, o.note.title, { size: 12.5, fill: INK.ink, weight: 600, anchor: "end" }) + txt(mx - 8, y(o.note.y) + 12, o.note.body, { size: 12.5, fill: INK.ink2, anchor: "end" });
  }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 8. DUMBBELL — two survey rounds, many units
// =====================================================================
export type DumbbellRow = { label: string; short?: string; a: number; b: number; emphasis?: boolean };
export function dumbbell(rows: DumbbellRow[], o: { domain: [number, number]; ticks: number[]; fmt?: (v: number) => string; aLabel: string; bLabel: string; width?: number; rowH?: number; half?: boolean; thumb?: boolean; label: string }) {
  const W = o.width ?? 640, rowH = o.rowH ?? 21, half = !!o.half, thumb = !!o.thumb;
  const lw = thumb ? 0 : half ? 84 : 140, mr = thumb ? 0 : 70, top = thumb ? 0 : 26;
  const x = scale(o.domain[0], o.domain[1], lw, W - mr), f = o.fmt ?? ((v: number) => `${Math.round(v)}%`);
  const H = top + rows.length * rowH + (thumb ? 0 : 36);
  let b = "";
  if (!thumb) for (const v of o.ticks) { b += line(x(v), top - 4, x(v), top + rows.length * rowH, INK.grid); b += txt(x(v), top - 12, f(v), { ...AX, anchor: "middle" }); }
  rows.forEach((r, i) => {
    const yy = top + i * rowH + rowH / 2;
    if (!thumb) b += txt(lw - 10, yy + 4, half ? r.short ?? r.label : r.label, { anchor: "end", size: half ? 11 : 12, fill: INK.ink, weight: r.emphasis ? 600 : undefined });
    const a = x(r.a), c = x(r.b), fell = r.b < r.a;
    b += line(a, yy, c, yy, r.emphasis ? "#9a9a9a" : "#c9cfe6", thumb ? 1.5 : 2);
    b += `<circle cx="${r1(a)}" cy="${r1(yy)}" r="${thumb ? 2 : 3.5}" fill="#ffffff" stroke="${INK.ink3}" stroke-width="1.25"/>`;
    b += `<circle cx="${r1(c)}" cy="${r1(yy)}" r="${thumb ? 2.6 : 4.5}" fill="${fell ? INK.sindoor : r.emphasis ? INK.ink : INK.neel}"><title>${esc(r.label)}: ${f(r.a)} to ${f(r.b)}</title></circle>`;
    if (!thumb && !half && (i === 0 || r.emphasis || i === rows.length - 1)) b += txt(Math.max(a, c) + 10, yy + 4, `${f(r.a)} → ${f(r.b)}`, { size: 11.5, fill: r.emphasis ? INK.ink : INK.ink2, weight: r.emphasis ? 600 : undefined });
  });
  if (!thumb) {
    const ly = H - 10;
    b += `<circle cx="${lw + 4}" cy="${ly - 4}" r="3.5" fill="#ffffff" stroke="${INK.ink3}" stroke-width="1.25"/>` + txt(lw + 13, ly, o.aLabel, { size: 11.5 });
    b += `<circle cx="${lw + 84}" cy="${ly - 4}" r="4.5" fill="${INK.neel}"/>` + txt(lw + 94, ly, o.bLabel, { size: 11.5 });
  }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 9. RANK SLOPE — the same units ranked two ways
// =====================================================================
export function rankSlope(left: string[], right: string[], o: { leftTitle: string; rightTitle: string; moveAt?: number; width?: number; rowH?: number; bare?: boolean; label: string }) {
  const W = o.width ?? 520, rowH = o.rowH ?? 22, bare = !!o.bare, top = bare ? 4 : 30, moveAt = o.moveAt ?? 5;
  const xl = bare ? 40 : 150, xr = W - (bare ? 40 : 150);
  const moved = (i: number, j: number) => Math.abs(i - j) >= moveAt;
  let b = bare ? "" : txt(xl, 12, o.leftTitle, { ...AX, anchor: "middle" }) + txt(xr, 12, o.rightTitle, { ...AX, anchor: "middle" });
  const order = left.map((s, i) => [s, i, right.indexOf(s)] as [string, number, number]).filter(([, , j]) => j >= 0).sort((a, c) => Number(moved(a[1], a[2])) - Number(moved(c[1], c[2])));
  for (const [s, i, j] of order) {
    const y1 = top + i * rowH, y2 = top + j * rowH, m = moved(i, j), c = m ? (j < i ? INK.neel : INK.sindoor) : "#d6d6d6";
    b += `<path d="M${xl + (bare ? 0 : 6)} ${r1(y1)}C${(xl + xr) / 2} ${r1(y1)} ${(xl + xr) / 2} ${r1(y2)} ${xr - (bare ? 0 : 6)} ${r1(y2)}" fill="none" stroke="${c}" stroke-width="${m ? (bare ? 1.5 : 1.75) : bare ? 0.9 : 1}"><title>${esc(s)}: ${i + 1} to ${j + 1}</title></path>`;
    b += `<circle cx="${xl + (bare ? 0 : 4)}" cy="${r1(y1)}" r="${bare ? 2 : 2.5}" fill="${m ? c : "#bdbdbd"}"/><circle cx="${xr - (bare ? 0 : 4)}" cy="${r1(y2)}" r="${bare ? 2 : 2.5}" fill="${m ? c : "#bdbdbd"}"/>`;
  }
  if (!bare) {
    left.forEach((s, i) => { const m = moved(i, right.indexOf(s)); b += txt(xl - 8, top + i * rowH + 4, `${s}  ${i + 1}`, { anchor: "end", size: 12, fill: m ? INK.ink : INK.ink2, weight: m ? 600 : undefined }); });
    right.forEach((s, j) => { const m = moved(left.indexOf(s), j); b += txt(xr + 8, top + j * rowH + 4, `${j + 1}  ${s}`, { size: 12, fill: m ? INK.ink : INK.ink2, weight: m ? 600 : undefined }); });
  }
  return svg(W, top + left.length * rowH - (bare ? 0 : 10), b, o.label);
}

// =====================================================================
// 10. UNIT CHART — a single share made countable
// =====================================================================
export function unitChart(share: number, o: { per?: number; cols?: number; cell?: number; gap?: number; color?: string; label: string }) {
  const per = o.per ?? 100, cols = o.cols ?? 10, cell = o.cell ?? 20, g = o.gap ?? 5, on = Math.round((share / 100) * per), color = o.color ?? INK.neel;
  let b = "";
  for (let i = 0; i < per; i++) {
    const c = i % cols, r = Math.floor(i / cols), lit = i < on;
    b += `<circle cx="${r1(c * (cell + g) + cell / 2)}" cy="${r1(r * (cell + g) + cell / 2)}" r="${r1(cell / 2 - 0.5)}" fill="${lit ? color : "#ffffff"}" stroke="${lit ? color : INK.rule}" stroke-width="1"/>`;
  }
  const rows = Math.ceil(per / cols);
  return svg(cols * (cell + g) - g, rows * (cell + g) - g, b, o.label);
}

// =====================================================================
// 11. SENSITIVITY CURVES — an estimate that depends on a chosen threshold
// =====================================================================
export type Curve = { label: string; color: string; width?: number; points: Array<[number, number]> };
export function sensitivity(curves: Curve[], o: {
  x: [number, number]; xTicks: number[]; xFmt?: (v: number) => string; yTicks: number[]; yFmt?: (v: number) => string; band?: [number, number];
  highlight?: { curve: string; at: [number, number]; title: string; body: [string, string] }; xTitle?: string; width?: number; height?: number; bare?: boolean; label: string;
}) {
  const W = o.width ?? 1040, H = o.height ?? 380, sm = W < 700, bare = !!o.bare;
  const ml = bare ? 0 : 34, mr = bare ? 0 : sm ? 66 : 84, mt = bare ? 4 : 14, mb = bare ? 2 : 46;
  const x = scale(o.x[0], o.x[1], ml, W - mr), y = scale(0, 100, H - mb, mt);
  const xf = o.xFmt ?? ((v: number) => `₹${fmtIN(v)}`), yf = o.yFmt ?? ((v: number) => `${v}%`);
  let b = o.band ? `<rect x="${r1(x(o.band[0]))}" y="${mt}" width="${r1(x(o.band[1]) - x(o.band[0]))}" height="${r1(y(0) - mt)}" fill="${INK.band}"/>` : "";
  if (!bare) {
    for (const v of o.yTicks) { if (v) b += line(ml, y(v), W - mr, y(v), INK.grid); b += txt(0, y(v) + 4, v ? yf(v) : "0", AX); }
    for (const v of o.xTicks) { b += line(x(v), y(0), x(v), y(0) + 5, INK.ink, 1); b += txt(x(v), y(0) + 20, xf(v), { ...AX, anchor: "middle" }); }
    if (o.xTitle) b += txt(ml, H - 4, `${o.xTitle} →`, { size: 11.5, fill: INK.ink2 });
  }
  b += line(ml, y(0), W - mr, y(0), INK.ink, 1);
  for (const c of curves) b += `<path d="${pathOf(c.points, x, y)}" fill="none" stroke="${c.color}" stroke-width="${c.width ?? (bare ? 1.75 : 2)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (bare) return svg(W, H, b, o.label);
  for (const c of curves) { const p = c.points[c.points.length - 1]; b += txt(x(p[0]) + 10, y(p[1]) + 4, c.label, { size: 12.5, fill: c.color, weight: 600 }); }
  if (o.highlight) {
    const c = curves.find((q) => q.label === o.highlight!.curve)!, at = o.highlight.at;
    const v0 = c.points.find((p) => p[0] === at[0])![1], v1 = c.points.find((p) => p[0] === at[1])![1];
    b += dot(x(at[0]), y(v0), 4, INK.ink) + dot(x(at[1]), y(v1), 4, INK.ink);
    b += txt(x(at[1]) + 10, y(v1) + 18, `${Math.round(v1)}%`, { size: 12.5, fill: INK.ink, weight: 600 }) + txt(x(at[0]) + 8, y(v0) + 18, `${Math.round(v0)}%`, { size: 12.5, fill: INK.ink, weight: 600 });
    const ax = sm ? x((o.x[0] + o.x[1]) / 2) : x(at[0]) - 10, ay = sm ? Math.min(y(13), y(0) - 42) : y(96), an = sm ? "start" : "end";
    // The note's three lines end clear of the x axis, with a halo where they cross a curve.
    b += halo(ax, ay, o.highlight.title, { size: 12.5, fill: INK.ink, weight: 600, anchor: an }) + halo(ax, ay + 16, o.highlight.body[0], { size: 12.5, fill: INK.ink2, anchor: an }) + halo(ax, ay + 32, o.highlight.body[1], { size: 12.5, fill: INK.ink2, anchor: an });
  }
  return svg(W, H, b, o.label);
}

// =====================================================================
// small marks for ledgers and cards
// =====================================================================
export function sparkLine(points: Array<[number, number]>, o: { width?: number; height?: number; yMin: number; yMax: number; ref?: number; color?: string; label: string }) {
  const W = o.width ?? 236, H = o.height ?? 44, c = o.color ?? INK.sindoor;
  const x = scale(points[0][0], points[points.length - 1][0], 2, W - 6), y = scale(o.yMin, o.yMax, H - 3, 5);
  const last = points[points.length - 1], first = points[0];
  return svg(W, H, (o.ref != null ? line(0, y(o.ref), W, y(o.ref), INK.ink3, 0.75, "2 2") : "") + `<path d="${pathOf(points, x, y)}" fill="none" stroke="${c}" stroke-width="1.75" stroke-linejoin="round"/>` + dot(x(last[0]), y(last[1]), 3, c, 1.25) + dot(x(first[0]), y(first[1]), 2.5, c, 1), o.label, "alm-mini");
}
export function miniRibbon(rows: Array<{ label: string; parts: Array<{ value: number; color: string }> }>, o: { total: number; width?: number; label: string }) {
  const W = o.width ?? 236, x = scale(0, o.total, 46, W);
  let b = "";
  rows.forEach((r, i) => {
    const yy = 6 + i * 20; let acc = 0;
    b += txt(0, yy + 9, r.label, { size: 10.5, fill: INK.ink2 }) + `<rect x="46" y="${yy}" width="${W - 46}" height="12" fill="#efefef"/>`;
    r.parts.forEach((p, j) => { const x0 = x(acc) + (j ? 1.5 : 0); b += `<rect x="${r1(x0)}" y="${yy}" width="${r1(Math.max(1, x(acc + p.value) - x0))}" height="12" fill="${p.color}"/>`; acc += p.value; });
  });
  return svg(W, 44, b, o.label, "alm-mini");
}
export function miniUnits(share: number, o: { per?: number; cols?: number; width?: number; color?: string; label: string }) {
  const per = o.per ?? 100, cols = o.cols ?? 25, W = o.width ?? 236, on = Math.round((share / 100) * per), step = (W - 8) / (cols - 1), c = o.color ?? INK.neel;
  let b = "";
  for (let i = 0; i < per; i++) { const col = i % cols, row = Math.floor(i / cols), lit = i < on; b += `<circle cx="${r1(4 + col * step)}" cy="${r1(6 + row * 10.5)}" r="3.4" fill="${lit ? c : "#ffffff"}" stroke="${lit ? c : INK.rule}" stroke-width="1"/>`; }
  return svg(W, 44, b, o.label, "alm-mini");
}
export function miniParade(values: number[], widths: number[], o: { yMax: number; band?: [number, number]; mark?: number; color?: string; width?: number; label: string }) {
  const W = o.width ?? 236, H = 44, c = o.color ?? INK.hara, x = scale(0, 100, 0, W), y = scale(0, o.yMax, H - 1, 2);
  let acc = 0, d = "";
  values.forEach((v, i) => { d += `${i ? "L" : "M"}${r1(x(acc))} ${r1(y(v))}H${r1(x(acc + widths[i]))}`; acc += widths[i]; });
  let b = `<path d="${d}V${H - 1}H0Z" fill="${c}" fill-opacity="0.16"/><path d="${d}" fill="none" stroke="${c}" stroke-width="1.5"/>` + line(0, H - 0.5, W, H - 0.5, INK.ink, 1);
  if (o.band) b += `<rect x="${r1(x(o.band[0]))}" y="2" width="${r1(x(o.band[1]) - x(o.band[0]))}" height="${H - 3}" fill="${c}" fill-opacity="0.12"/>`;
  if (o.mark != null) b += line(x(o.mark), 2, x(o.mark), H - 1, INK.ink, 0.75);
  return svg(W, H, b, o.label, "alm-mini");
}

// =====================================================================
// 12. INTERVAL PLOT — estimates that are ranges, not points
// =====================================================================
export type IntervalRow = { label: string; lo: number; hi: number; mid?: number; hot?: boolean };
export function intervalPlot(rows: IntervalRow[], o: { domain: [number, number]; ticks: number[]; fmt?: (v: number) => string; width?: number; rowH?: number; ref?: { value: number; label: string }; midLabel?: string; label: string }) {
  const W = o.width ?? 1040, sm = W < 480, rowH = o.rowH ?? (sm ? 34 : 30), lw = sm ? 0 : Math.min(200, W * 0.3), top = 26;
  const x = scale(o.domain[0], o.domain[1], lw + 4, W - 60), f = o.fmt ?? ((v: number) => fmtIN(v));
  const rowTop = (i: number) => top + i * rowH + (sm ? 14 : 0);
  const H = rowTop(rows.length - 1) + rowH + 34;
  let b = "";
  for (const v of o.ticks) { b += line(x(v), top - 6, x(v), H - 34, INK.grid); b += txt(x(v), top - 12, f(v), { ...AX, anchor: "middle" }); }
  if (o.ref) { b += line(x(o.ref.value), top - 6, x(o.ref.value), H - 34, INK.ink, 0.9, "4 3"); b += halo(x(o.ref.value) + 6, H - 38, o.ref.label, { size: 11.5, fill: INK.ink2 }); }
  rows.forEach((r, i) => {
    const cy = rowTop(i) + rowH / 2, c = r.hot ? INK.sindoor : INK.neel;
    if (sm) b += txt(0, rowTop(i) + 2, r.label, { size: 12, fill: INK.ink, weight: 500 });
    else b += rowLabel(lw - 12, cy, r.label, lw - 16, { size: 12.5, fill: INK.ink });
    b += `<rect x="${r1(x(r.lo))}" y="${r1(cy - 4)}" width="${r1(Math.max(2, x(r.hi) - x(r.lo)))}" height="8" rx="4" fill="${c}" fill-opacity="0.22"><title>${esc(r.label)}: ${f(r.lo)} to ${f(r.hi)}</title></rect>`;
    b += line(x(r.lo), cy - 6, x(r.lo), cy + 6, c, 1.25) + line(x(r.hi), cy - 6, x(r.hi), cy + 6, c, 1.25);
    if (r.mid != null) b += dot(x(r.mid), cy, sm ? 4 : 4.5, c, 1.5);
    b += txt(x(r.hi) + 8, cy + 4, `${f(r.lo)}–${f(r.hi)}`, { size: sm ? 11 : 11.5, fill: INK.ink2 });
  });
  if (o.midLabel) { const ly = H - 12; b += dot(lw + 8, ly - 4, 4, INK.neel, 1.5) + txt(lw + 18, ly, o.midLabel, { size: 11.5 }) + `<rect x="${lw + 150}" y="${ly - 8}" width="26" height="8" rx="4" fill="${INK.neel}" fill-opacity="0.22"/>` + txt(lw + 182, ly, "Range", { size: 11.5 }); }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 13. RIDGELINE — the shape of a distribution, group by group
// =====================================================================
export type RidgeGroup = { label: string; values: number[] };
export function ridgeline(groups: RidgeGroup[], o: { domain: [number, number]; ticks: number[]; fmt?: (v: number) => string; width?: number; rowH?: number; overlap?: number; stops?: Stops; ref?: number; label: string }) {
  const W = o.width ?? 1040, sm = W < 700, rowH = o.rowH ?? (sm ? 46 : 56), ov = o.overlap ?? 1.7, lw = sm ? 0 : 130, top = 18;
  const x = scale(o.domain[0], o.domain[1], lw, W - 12), f = o.fmt ?? ((v: number) => String(v));
  const N = 120, grid = Array.from({ length: N + 1 }, (_, i) => o.domain[0] + ((o.domain[1] - o.domain[0]) * i) / N);
  // Gaussian kernel density with Silverman's bandwidth, per group.
  const dens = groups.map((g) => {
    const n = g.values.length, m = g.values.reduce((a, v) => a + v, 0) / n, sd = Math.sqrt(g.values.reduce((a, v) => a + (v - m) ** 2, 0) / Math.max(1, n - 1)) || 1;
    const h = 1.06 * sd * n ** -0.2;
    return grid.map((t) => g.values.reduce((a, v) => a + Math.exp(-0.5 * ((t - v) / h) ** 2), 0) / (n * h * Math.sqrt(2 * Math.PI)));
  });
  const dMax = Math.max(...dens.flat());
  const base = (i: number) => top + rowH * ov + i * rowH;
  const H = base(groups.length - 1) + (sm ? 38 : 34);
  const col = o.stops ? ramp(o.stops) : () => INK.neel;
  let b = "";
  for (const v of o.ticks) { b += line(x(v), top, x(v), base(groups.length - 1), INK.grid); b += txt(x(v), H - 8, f(v), { ...AX, anchor: "middle" }); }
  if (o.ref != null) b += line(x(o.ref), top, x(o.ref), base(groups.length - 1), INK.ink, 0.9, "4 3");
  groups.forEach((g, i) => {
    const y0 = base(i), yy = (d: number) => y0 - (d / dMax) * rowH * ov;
    const d = grid.map((t, k) => `${k ? "L" : "M"}${r1(x(t))} ${r1(yy(dens[i][k]))}`).join("");
    const med = [...g.values].sort((a, c) => a - c)[Math.floor(g.values.length / 2)];
    const fill = col(med);
    b += `<path d="${d}L${r1(x(o.domain[1]))} ${y0}L${r1(x(o.domain[0]))} ${y0}Z" fill="${fill}" fill-opacity="0.85" stroke="#ffffff" stroke-width="1.5"><title>${esc(g.label)}: median ${f(med)}</title></path>`;
    b += `<path d="${d}" fill="none" stroke="${INK.ink}" stroke-width="0.9"/>`;
    b += line(x(o.domain[0]), y0, x(o.domain[1]), y0, INK.rule, 0.75);
    b += line(x(med), y0, x(med), yy(dens[i][Math.round(((med - o.domain[0]) / (o.domain[1] - o.domain[0])) * N)]), "#ffffff", 1.25);
    if (sm) b += halo(2, y0 - 6, g.label, { size: 11.5, fill: INK.ink, weight: 600 });
    else b += txt(lw - 12, y0 - 4, g.label, { size: 12.5, fill: INK.ink, anchor: "end", weight: 500 });
  });
  return svg(W, H, b, o.label);
}

// =====================================================================
// 14. CALENDAR HEATMAP — one cell per day, a year per row
// =====================================================================
export function calendarHeat(points: Array<{ date: string; value: number }>, o: { stops: Stops; width?: number; fmt?: (v: number) => string; legendTicks?: Array<[number, string]>; label: string }) {
  const W = o.width ?? 1040, sm = W < 480, col = ramp(o.stops), f = o.fmt ?? ((v: number) => String(v));
  const byYear = new Map<number, Array<{ d: Date; v: number; s: string }>>();
  for (const p of points) { const d = new Date(`${p.date}T00:00:00Z`); if (isNaN(+d)) continue; const y = d.getUTCFullYear(); if (!byYear.has(y)) byYear.set(y, []); byYear.get(y)!.push({ d, v: p.value, s: p.date }); }
  const years = [...byYear.keys()].sort((a, c) => a - c);
  const lw = sm ? 34 : 44, cell = Math.min(17, (W - lw - 4) / 54), gap = cell < 8 ? 0.8 : 2;
  const yearH = 7 * cell + (sm ? 12 : 18), top = 18;
  const H = top + years.length * yearH + 40;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let b = "";
  years.forEach((yr, yi) => {
    const oy = top + yi * yearH, jan1 = Date.UTC(yr, 0, 1), dow0 = new Date(jan1).getUTCDay();
    b += txt(lw - 8, oy + 3.5 * cell + 4, yr, { size: sm ? 10.5 : 12, fill: INK.ink, anchor: "end", weight: 600 });
    if (yi === 0) for (let m = 0; m < 12; m++) { const day = Math.round((Date.UTC(yr, m, 1) - jan1) / 864e5); const wk = Math.floor((day + dow0) / 7); b += txt(lw + wk * cell, top - 6, sm ? MONTHS[m][0] : MONTHS[m], { ...AX, size: sm ? 9.5 : 11 }); }
    for (const p of byYear.get(yr)!) {
      const day = Math.round((+p.d - jan1) / 864e5), wk = Math.floor((day + dow0) / 7), wd = p.d.getUTCDay();
      b += `<rect x="${r1(lw + wk * cell)}" y="${r1(oy + wd * cell)}" width="${r1(cell - gap)}" height="${r1(cell - gap)}" rx="${sm ? 0.5 : 1.5}" fill="${col(p.v)}"><title>${p.s}: ${f(p.v)}</title></rect>`;
    }
  });
  if (o.legendTicks) { const lx = lw, ly = H - 22; b += scaleLegend(lx, ly, sm ? W - lw - 10 : 300, o.stops, { ticks: o.legendTicks.map((t) => t[0]), fmt: (v) => o.legendTicks!.find((t) => t[0] === v)?.[1] ?? String(v) }); }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 15. CONNECTED SCATTER — two measures moving together through time
// =====================================================================
export type Path2D = { label: string; color: string; points: Array<{ t: number; x: number; y: number }>; emphasis?: boolean };
export function connectedScatter(paths: Path2D[], o: { x: [number, number]; y: [number, number]; xTicks: number[]; yTicks: number[]; xLog?: boolean; xFmt?: (v: number) => string; yFmt?: (v: number) => string; xTitle: string; yTitle: string; refY?: { value: number; label: string }; width?: number; height?: number; label: string }) {
  const W = o.width ?? 1040, H = o.height ?? 520, sm = W < 480, ml = sm ? 30 : 40, mr = sm ? 92 : 130, mt = 30, mb = 50;
  const tx = (v: number) => (o.xLog ? Math.log10(v) : v);
  const xs = scale(tx(o.x[0]), tx(o.x[1]), ml, W - mr), x = (v: number) => xs(tx(v)), y = scale(o.y[0], o.y[1], H - mb, mt);
  const xf = o.xFmt ?? ((v: number) => fmtIN(v)), yf = o.yFmt ?? ((v: number) => v.toFixed(1));
  let b = "";
  for (const v of o.yTicks) { if (v !== o.y[0]) b += line(ml, y(v), W - mr, y(v), INK.grid); b += txt(0, y(v) + 4, yf(v), AX); }
  b += line(ml, y(o.y[0]), W - mr, y(o.y[0]), INK.ink, 1);
  for (const v of o.xTicks) { b += line(x(v), y(o.y[0]), x(v), y(o.y[0]) + 5, INK.ink, 1); b += txt(x(v), y(o.y[0]) + 20, xf(v), { ...AX, anchor: x(v) > W - mr - 14 ? "end" : "middle" }); }
  b += txt(ml, H - 4, `${o.xTitle} →`, { size: 11.5, fill: INK.ink2 }) + txt(0, 12, `${o.yTitle} ↑`, { size: 11.5, fill: INK.ink2 });
  if (o.refY) { b += line(ml, y(o.refY.value), W - mr, y(o.refY.value), INK.ink, 0.75, "3 3"); b += halo(W - mr, y(o.refY.value) - 7, o.refY.label, { size: 11.5, fill: INK.ink2, anchor: "end" }); }
  // End labels are stacked so none overlap: sort by end y, push apart by a minimum gap.
  const gapY = sm ? 13 : 15, ends = paths.map((p) => ({ p, y: y(p.points[p.points.length - 1].y) + 4 })).sort((a, c) => a.y - c.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < gapY) ends[i].y = ends[i - 1].y + gapY;
  const endY = new Map(ends.map((e) => [e.p.label, e.y]));
  for (const p of [...paths].sort((a, c) => Number(Boolean(a.emphasis)) - Number(Boolean(c.emphasis)))) {
    const pts = p.points;
    b += `<path d="${pts.map((q, i) => `${i ? "L" : "M"}${r1(x(q.x))} ${r1(y(q.y))}`).join("")}" fill="none" stroke="${p.color}" stroke-width="${p.emphasis ? 2.2 : 1.5}" stroke-linejoin="round" stroke-opacity="${p.emphasis ? 1 : 0.8}"/>`;
    for (const q of pts) b += `<circle cx="${r1(x(q.x))}" cy="${r1(y(q.y))}" r="${sm ? 1.6 : 2.2}" fill="${p.color}"><title>${esc(p.label)}, ${q.t}: ${xf(q.x)}, ${yf(q.y)}</title></circle>`;
    const a = pts[0], z = pts[pts.length - 1];
    b += dot(x(a.x), y(a.y), sm ? 3 : 3.5, "#ffffff", 0) + `<circle cx="${r1(x(a.x))}" cy="${r1(y(a.y))}" r="${sm ? 3 : 3.5}" fill="#ffffff" stroke="${p.color}" stroke-width="1.5"/>`;
    b += halo(x(a.x) - 6, y(a.y) + 4, String(a.t), { size: sm ? 10.5 : 11.5, fill: INK.ink2, anchor: "end" });
    b += dot(x(z.x), y(z.y), sm ? 3.5 : 4.5, p.color, 1.5);
    const ly = endY.get(p.label)!, lx = Math.max(...paths.map((q) => x(q.points[q.points.length - 1].x))) + 10;
    if (Math.abs(ly - 4 - y(z.y)) > 2 || lx - x(z.x) > 12) b += line(x(z.x) + 5, y(z.y), lx - 3, ly - 4, p.color, 0.75);
    b += halo(lx, ly, `${p.label} ${z.t}`, { size: sm ? 11 : 12.5, fill: p.color, weight: 600 });
  }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 16. WATERFALL — how parts add up to a total (horizontal, so long labels fit)
// =====================================================================
export function waterfall(steps: Array<{ label: string; value: number }>, o: { totalLabel: string; fmt?: (v: number) => string; width?: number; rowH?: number; upColor?: string; downColor?: string; label: string }) {
  const W = o.width ?? 1040, sm = W < 480, rowH = o.rowH ?? (sm ? 40 : 30), lw = sm ? 0 : Math.min(230, W * 0.36), top = 8;
  const f = o.fmt ?? ((v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`);
  let acc = 0; const segs = steps.map((s) => { const a = acc; acc += s.value; return { ...s, a, z: acc }; });
  const total = acc, lo = Math.min(0, ...segs.map((s) => Math.min(s.a, s.z))), hi = Math.max(0, ...segs.map((s) => Math.max(s.a, s.z)));
  const x = scale(lo, hi, lw + 6, W - 70);
  const rowY = (i: number) => top + i * rowH + (sm ? 14 : 0);
  const H = rowY(segs.length) + rowH + 10;
  const up = o.upColor ?? INK.sindoor, down = o.downColor ?? INK.neel;
  let b = line(x(0), top - 4, x(0), H - 6, INK.ink, 1);
  segs.forEach((s, i) => {
    const yy = rowY(i), c = s.value >= 0 ? up : down, x0 = x(Math.min(s.a, s.z)), x1 = x(Math.max(s.a, s.z));
    if (sm) b += halo(0, yy + 2, s.label, { size: 11.5, fill: INK.ink });
    else b += rowLabel(lw - 12, yy + rowH / 2, s.label, lw - 16, { size: 12.5, fill: INK.ink });
    const by = yy + (sm ? 8 : rowH / 2 - 7);
    b += `<rect x="${r1(x0)}" y="${r1(by)}" width="${r1(Math.max(1.5, x1 - x0))}" height="14" fill="${c}"><title>${esc(s.label)}: ${f(s.value)}</title></rect>`;
    if (i < segs.length - 1) b += line(x(s.z), by + 14, x(s.z), rowY(i + 1) + (sm ? 8 : rowH / 2 - 7), INK.ink3, 0.75, "2 2");
    b += txt(x1 + 6, by + 11, f(s.value), { size: 11.5, fill: INK.ink2, weight: 500 });
  });
  const ty = rowY(segs.length), tby = ty + (sm ? 8 : rowH / 2 - 7);
  if (sm) b += halo(0, ty + 2, o.totalLabel, { size: 11.5, fill: INK.ink, weight: 600 });
  else b += txt(lw - 12, ty + rowH / 2 + 4, o.totalLabel, { size: 12.5, fill: INK.ink, anchor: "end", weight: 600 });
  b += `<rect x="${r1(x(Math.min(0, total)))}" y="${r1(tby)}" width="${r1(Math.abs(x(total) - x(0)))}" height="14" fill="${INK.ink}"/>`;
  b += txt(x(Math.max(0, total)) + 6, tby + 11, f(total).replace(/^\+/, ""), { size: 12, fill: INK.ink, weight: 600 });
  return svg(W, H, b, o.label);
}

// =====================================================================
// 16. SLOPE — two points in time for a handful of units, values at both ends
// =====================================================================
export type SlopeRow = { label: string; a: number; b: number; color?: string; emphasis?: boolean };
/** Spread end labels so none overlaps, keeping each as close to its point as it can. */
function spread(ys: number[], gap: number, lo: number, hi: number) {
  const idx = ys.map((y, i) => [y, i] as [number, number]).sort((p, q) => p[0] - q[0]);
  const out = idx.map(([y]) => y);
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + gap);
  const over = out.length ? out[out.length - 1] - hi : 0;
  if (over > 0) for (let i = out.length - 1; i >= 0; i--) out[i] = Math.min(out[i] - over, i < out.length - 1 ? out[i + 1] - gap : Infinity);
  for (let i = 0; i < out.length; i++) out[i] = Math.max(lo, out[i]);
  const res = new Array(ys.length);
  idx.forEach(([, i], k) => (res[i] = out[k]));
  return res as number[];
}
export function slope(rows: SlopeRow[], o: {
  aLabel: string; bLabel: string; fmt?: (v: number) => string; domain?: [number, number]; width?: number; height?: number; label: string;
}) {
  const W = o.width ?? 1040, sm = W < 700, H = o.height ?? (sm ? 360 : 420);
  const f = o.fmt ?? ((v: number) => fmtIN(Math.round(v * 10) / 10));
  const fs = sm ? 11.5 : 13;
  const tw = (s: string, bold = false) => s.length * fs * (bold ? 0.6 : 0.55);
  // Label columns as wide as the longest "Name 12.3" on each side.
  const leftW = Math.max(...rows.map((r) => tw(`${r.label} ${f(r.a)}`, !!r.emphasis))) + 12;
  const rightW = Math.max(...rows.map((r) => tw(`${f(r.b)} ${r.label}`, !!r.emphasis))) + 12;
  const x0 = sm ? Math.min(leftW, W * 0.36) : Math.max(leftW, W * 0.22), x1 = W - (sm ? Math.min(rightW, W * 0.36) : Math.max(rightW, W * 0.22));
  const top = 40, bot = H - 14;
  const vals = rows.flatMap((r) => [r.a, r.b]);
  const [lo, hi] = o.domain ?? [Math.min(...vals), Math.max(...vals)];
  const y = (v: number) => bot - ((v - lo) / (hi - lo || 1)) * (bot - top);
  let b = txt(x0, 14, o.aLabel, { size: 12, fill: INK.ink, weight: 600, anchor: "middle" }) + txt(x1, 14, o.bLabel, { size: 12, fill: INK.ink, weight: 600, anchor: "middle" });
  b += line(x0, 24, x0, bot + 6, INK.rule, 1) + line(x1, 24, x1, bot + 6, INK.rule, 1);
  const ink = (r: SlopeRow) => r.color ?? (r.emphasis ? INK.sindoor : "#8f8f8f");
  const order = [...rows].sort((p, q) => Number(!!p.emphasis) - Number(!!q.emphasis));
  const la = spread(rows.map((r) => y(r.a)), fs + 3, top - 6, bot), lb = spread(rows.map((r) => y(r.b)), fs + 3, top - 6, bot);
  for (const r of order) {
    const i = rows.indexOf(r), c = ink(r), w = r.emphasis ? 2.6 : 1.4;
    let g = line(x0, y(r.a), x1, y(r.b), c, w) + dot(x0, y(r.a), r.emphasis ? 4 : 3, c) + dot(x1, y(r.b), r.emphasis ? 4 : 3, c);
    const wt = r.emphasis ? 600 : undefined, lc = r.emphasis ? INK.ink : INK.ink2;
    g += `<text x="${r1(x0 - 10)}" y="${r1(la[i] + fs * 0.35)}" font-family="${F}" font-size="${fs}" text-anchor="end"><tspan fill="${lc}"${wt ? ` font-weight="${wt}"` : ""}>${esc(r.label)}</tspan><tspan fill="${INK.ink}" font-weight="600" dx="5">${esc(f(r.a))}</tspan></text>`;
    g += `<text x="${r1(x1 + 10)}" y="${r1(lb[i] + fs * 0.35)}" font-family="${F}" font-size="${fs}"><tspan fill="${INK.ink}" font-weight="600">${esc(f(r.b))}</tspan><tspan fill="${lc}"${wt ? ` font-weight="${wt}"` : ""} dx="5">${esc(r.label)}</tspan></text>`;
    const tipS = [r.label, `${o.aLabel}: ${f(r.a)}`, `${o.bLabel}: ${f(r.b)}`].join("|").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    b += `<g class="mk" data-tip="${tipS}" tabindex="0"><path d="M${r1(x0)} ${r1(y(r.a))}L${r1(x1)} ${r1(y(r.b))}" stroke="transparent" stroke-width="12"/>${g}</g>`;
  }
  return svg(W, H, b, o.label);
}

// =====================================================================
// 17. STACKED AREA — composition over time, each layer named at its end
// =====================================================================
export type AreaLayer = { label: string; color: string; points: Array<[number, number]> };
export function stackedArea(layers: AreaLayer[], o: {
  share?: boolean; width?: number; height?: number; yTicks?: number[]; fmt?: (v: number) => string; unit?: string; label: string;
}) {
  const W = o.width ?? 1040, sm = W < 700, H = o.height ?? (sm ? 300 : 420);
  const years = [...new Set(layers.flatMap((l) => l.points.map((p) => p[0])))].sort((a, b) => a - b);
  const at = (l: AreaLayer, t: number) => l.points.find((p) => p[0] === t)?.[1] ?? 0;
  const totals = years.map((t) => layers.reduce((s, l) => s + Math.max(0, at(l, t)), 0));
  const val = (l: AreaLayer, k: number) => (o.share ? (Math.max(0, at(l, years[k])) / (totals[k] || 1)) * 100 : Math.max(0, at(l, years[k])));
  const f = o.fmt ?? ((v: number) => fmtIN(Math.round(v)));
  const fs = sm ? 11.5 : 13;
  const last = years.length - 1;
  const lastVals = layers.map((l) => val(l, last)), lastTot = lastVals.reduce((s, v) => s + v, 0);
  const shareOf = (v: number) => `${Math.round((v / (lastTot || 1)) * 100)}%`;
  const endText = (l: AreaLayer, i: number) => (o.share ? `${l.label} ${f(lastVals[i])}` : `${l.label} ${f(lastVals[i])}`);
  const gut = Math.max(...layers.map((l, i) => endText(l, i).length * fs * 0.56)) + 32;
  const mr = Math.min(gut, W * (sm ? 0.42 : 0.26)), mt = 18, mb = 26;
  const t0 = years[0], t1 = years[last];
  const x = (t: number) => ml + ((t - t0) / (t1 - t0 || 1)) * (W - ml - mr);
  const yMax = o.share ? 100 : Math.max(...years.map((_, k) => layers.reduce((s, l) => s + val(l, k), 0)));
  const ticks = o.yTicks ?? (() => { const st = [1, 2, 2.5, 5, 10].map((m) => m * 10 ** Math.floor(Math.log10(yMax / 4))).find((s) => yMax / s <= 5)!; const t: number[] = []; for (let v = 0; v <= yMax + st * 0.01; v += st) t.push(v); if (t[t.length - 1] < yMax) t.push(t[t.length - 1] + st); return t; })();
  const top = ticks[ticks.length - 1];
  const ml = Math.max(...ticks.map((v) => (o.share ? `${v}%` : f(v)).length * AX.size! * 0.64)) + 12;
  const y = (v: number) => H - mb - (v / (top || 1)) * (H - mb - mt);
  let b = "";
  for (const v of ticks) { b += line(ml, y(v), W - mr, y(v), v === 0 ? INK.ink : INK.grid, 1); b += txt(ml - 6, y(v) + 4, o.share ? `${v}%` : f(v), { ...AX, anchor: "end" }); }
  const step = sm ? 10 : 5;
  // An end year is anchored at its edge, a middle one centred: they clear at 1.5 label widths.
  const gapPx = 4 * AX.size! * 0.64 * 1.5 + 6;
  for (const t of years) if (t % step === 0 || t === t0 || t === t1) {
    if (t !== t0 && t !== t1 && (x(t) - x(t0) < gapPx || x(t1) - x(t) < gapPx)) continue;
    b += txt(x(t), H - mb + 17, t, { ...AX, anchor: t === t0 ? "start" : t === t1 ? "end" : "middle" });
  }
  // stack bottom-up in the given order
  const base = years.map(() => 0);
  const mids: number[] = [];
  layers.forEach((l, i) => {
    const lower = base.slice(), upper = years.map((_, k) => base[k] + val(l, k));
    const d = years.map((t, k) => `${k ? "L" : "M"}${r1(x(t))} ${r1(y(upper[k]))}`).join("") + years.slice().reverse().map((t, k) => `L${r1(x(t))} ${r1(y(lower[last - k]))}`).join("") + "Z";
    const tipS = [l.label, `${years[last]}: ${f(lastVals[i])}${o.unit && !o.share ? ` ${o.unit}` : ""}${o.share ? "" : ` (${shareOf(lastVals[i])} of the total)`}`].join("|").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    b += `<path class="mk" d="${d}" fill="${l.color}" fill-opacity="0.88" stroke="#ffffff" stroke-width="0.8" data-tip="${tipS}"/>`;
    mids.push(y((lower[last] + upper[last]) / 2));
    years.forEach((_, k) => (base[k] = upper[k]));
  });
  const ly = spread(mids, fs + 3, mt + 4, H - mb - 2);
  layers.forEach((l, i) => {
    const xe = W - mr;
    if (Math.abs(ly[i] - mids[i]) > 2) b += `<path d="M${r1(xe + 1)} ${r1(mids[i])}L${r1(xe + 9)} ${r1(ly[i])}" stroke="${INK.ink3}" stroke-width="0.75" fill="none"/>`;
    // a swatch in the layer's colour, the name in ink: pale layers stay legible
    b += `<rect x="${r1(xe + 10)}" y="${r1(ly[i] - 4.5)}" width="9" height="9" fill="${l.color}"/>`;
    b += `<text x="${r1(xe + 24)}" y="${r1(ly[i] + fs * 0.35)}" font-family="${F}" font-size="${fs}"><tspan fill="${INK.ink}" font-weight="600">${esc(l.label)}</tspan><tspan fill="${INK.ink2}" dx="5">${esc(f(lastVals[i]))}</tspan></text>`;
  });
  return svg(W, H, b, o.label);
}
