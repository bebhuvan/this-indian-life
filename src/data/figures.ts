// SVG renderers for the older chart kinds (bars, share strips, pyramids, small
// multiples, ranked change, load curves, scatters, scenario maps). They follow the
// Almanac's anatomy: hairline neutrals, thin marks, values written beside the data,
// the unit printed once, and a phone version drawn for ~346px rather than shrunk.
// Every mark that carries a number has a `data-tip` ("Head|line|line"), which the
// tooltip layer in public/article-actions.js shows on hover, tap and keyboard focus.
import type { BarVisual, StackVisual, StripPairVisual, PyramidVisual, RankedChangeVisual, ChangeVisual, SparkGridVisual, StartingGridVisual, LinePanelsVisual, LoadCurveVisual, ScatterVisual, ScatterXYVisual, ScenarioMapsVisual, GroupedBarVisual, VisualSpec } from "./viz";
import { INK, F, esc, r1, txt, halo, line, scatterFit, type ScatterPoint } from "./almanac";
import { countFmt, harmoniseDecimals, fmt, compactBarLabel, signedFmt, niceScale, tightScale, sparkEndpoint, pct, multiple, yearSpan } from "./chartFormat";
import { choroColor, compactSvgPath } from "./chartSvg";

export type Figure = { svg: string; svgM: string; note?: string };
export type FigureContext = { narrow?: boolean; chartId: string };

/** Series order, as in ArticleVisuals: the domain ink, ink black, then the free inks. */
export const SERIES = ["var(--c)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "#b3b3b3"];
const W_D = 1040, W_NARROW = 508, W_M = 346;
/** Inks for a departure from a normal, as the stripes use them: temperature runs neel
 *  (cooler) to sindoor (warmer), rainfall haldi (drier) to hara (wetter). Null when the
 *  unit is not a departure, so other signed values keep the domain ink. */
const anomalyInks = (unit = "", title = ""): [string, string] | undefined => {
  const t = `${unit} ${title}`;
  if (!/°[CF]|anomal|departure|above or below normal/i.test(t)) return undefined;
  return /rain|monsoon|precip|wet|dry/i.test(t) ? ["#b98014", "#008a6e"] : ["#33489a", "#c24a2e"];
};
const isNational = (s: string) => /^(all[- ]india|india|national|all states|total)$/i.test(s.trim());

// ---------- shared bits ----------
const attr = (s: string) => esc(s).replace(/"/g, "&quot;");
/** A tooltip on a mark: first part is the heading, the rest are value lines. */
export const tip = (head: string, ...lines: string[]) => ` data-tip="${attr([head, ...lines].join("|"))}"`;
const textW = (s: string, size: number, bold = false) => String(s).length * size * (bold ? 0.6 : 0.56);
/** Width of a label, counting capitals wider: "SOUTH AFRICA" is a third wider than "South Africa". */
const labelTextW = (s: string, size: number) => [...String(s)].reduce((w, ch) => w + size * (/[A-Z]/.test(ch) ? 0.68 : /[\s.,'()-]/.test(ch) ? 0.32 : 0.54), 0);
function svgDoc(cls: string, w: number, h: number, body: string, label: string, extra = "") {
  // max-width: a desktop figure drawn narrower than its card is never stretched (text would
  // grow). The phone drawing drops it in renderFigure.
  return `<svg class="viz-svg alm fig ${cls}" viewBox="0 0 ${w} ${r1(h)}" style="max-width:${w}px" role="img" aria-label="${attr(label)}"${extra}>${body}</svg>`;
}
/** The unit, once, in the top-left corner of the plot. */
function unitCaption(x: number, y: number, unit: string, size: number) {
  const u = cleanUnit(unit);
  return u ? txt(x, y, u, { size, fill: INK.ink3 }) : "";
}
export function cleanUnit(unit = "") {
  const u = String(unit).trim();
  if (!u || /^[a-z0-9_.:-]+$/i.test(u) && /[_:]/.test(u)) return "";
  return u.length > 64 ? `${u.slice(0, 62)}…` : u;
}
/** Wrap a label onto at most `maxLines` lines of about `chars` characters. */
function wrap(s: string, chars: number, maxLines = 2) {
  const words = String(s).split(/\s+/).filter(Boolean), out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > chars && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  if (out.length > maxLines) { const head = out.slice(0, maxLines - 1); head.push(out.slice(maxLines - 1).join(" ")); return head; }
  return out;
}
function multiText(x: number, y: number, lines: string[], o: { size: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number; lh?: number }) {
  const lh = o.lh ?? o.size * 1.2;
  return `<text x="${r1(x)}" y="${r1(y)}" font-family="${F}" font-size="${o.size}" fill="${o.fill ?? INK.ink2}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.weight ? ` font-weight="${o.weight}"` : ""}>${lines.map((l, i) => `<tspan x="${r1(x)}"${i ? ` dy="${r1(lh)}"` : ""}>${esc(l)}</tspan>`).join("")}</text>`;
}
const fmtU = (v: number, unit: string) => compactBarLabel(v, unit);

// =====================================================================
// HORIZONTAL BARS — one row per category, value at the bar's end
// =====================================================================
type BarRow = { label: string; value: number; group?: string };
function barsSvg(rows: BarRow[], o: { width: number; mobile: boolean; unit: string; log?: boolean; label: string; groups?: string[]; anomaly?: [string, string] }) {
  const W = o.width, phone = o.mobile, unit = o.unit;
  // Fine bars with room between them: a figure, not a wall of ink. The values carry the weight.
  const labSize = phone ? 13 : 13.5, valSize = phone ? 12.5 : 13.5, few = rows.length <= 6, barH = phone ? (few ? 11 : 8) : few ? 13 : rows.length <= 12 ? 10 : 8;
  // On a phone, labels go above their bars only when they are too long to sit beside them.
  const m = phone && Math.max(...rows.map((r) => labelTextW(r.label, labSize))) > W * 0.36;
  const vals = rows.map((r) => r.value), lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const neg = lo < 0;
  // One precision per group: groups often come from different sources (World Bank to two
  // decimals, SRS to one), and padding one to match the other would overstate it.
  const harmonised = new Map<BarRow, string>();
  for (const g of o.groups?.length ? o.groups : [undefined]) {
    const items = g === undefined ? rows : rows.filter((r) => r.group === g);
    harmoniseDecimals(items.map((r) => fmtU(r.value, unit))).forEach((t, i) => harmonised.set(items[i], t));
  }
  const rowTxt = (r: BarRow) => harmonised.get(r) ?? fmtU(r.value, unit);
  const valTxt = (v: number) => fmtU(v, unit);
  const posValW = Math.max(0, ...rows.filter((r) => r.value >= 0).map((r) => textW(rowTxt(r), valSize, true))) + 10;
  const negValW = neg ? Math.max(0, ...rows.filter((r) => r.value < 0).map((r) => textW(rowTxt(r), valSize, true))) + 10 : 0;
  // Label column on desktop: wide enough for the longest label (wrapped to two lines past ~30 chars).
  const longest = Math.max(...rows.map((r) => labelTextW(r.label.slice(0, 34), labSize)));
  const labelW = m ? 0 : Math.min(W * 0.36, Math.max(80, longest + 18));
  const x0 = labelW + negValW, x1 = W - posValW - 2;
  let xs: (v: number) => number;
  let logTicks: number[] = [];
  if (o.log) {
    const pos = vals.filter((v) => v > 0), lmin = Math.log10(Math.min(...pos)), lmax = Math.log10(Math.max(...pos));
    const a = Math.floor(lmin), b = Math.ceil(lmax);
    for (let e = a; e <= b; e++) logTicks.push(10 ** e);
    xs = (v) => x0 + ((Math.log10(Math.max(v, 10 ** a)) - a) / Math.max(1e-9, b - a)) * (x1 - x0);
  } else {
    xs = (v) => x0 + ((v - lo) / Math.max(1e-9, hi - lo)) * (x1 - x0);
  }
  const zx = o.log ? x0 : xs(0);
  // The header: the unit (wrapped to the figure, and moved to the left edge when it would
  // run past the right one), then on a log scale the note and the gridline values, each on
  // its own row so none of the three can run into another.
  const capU = cleanUnit(unit), capSize = m ? 11.5 : 12, note = "Log scale: each gridline is ten times the last", noteSize = m ? 11 : 11.5;
  const capX = o.log || m || (capU && textW(capU, capSize) > W - labelW) ? 0 : labelW;
  const capLines = !capU ? [] : textW(capU, capSize) > W - capX ? wrap(capU, Math.floor((W - capX) / (capSize * 0.56)), 3) : [capU];
  const capBase = capLines.length ? 12 + (capLines.length - 1) * 14 : 0;
  const noteInline = o.log && capLines.length <= 1 && capX + (capLines[0] ? textW(capLines[0], capSize) : 0) + 24 + textW(note, noteSize) < W;
  const noteBase = !o.log ? 0 : noteInline ? 12 : capBase + 15;
  const tickBase = o.log ? Math.max(capBase, noteBase) + 18 : 0;
  const top = o.log ? tickBase + 8 : Math.max(26, capBase + 14);
  const zeroSegs: Array<[number, number]> = [];
  let y = top, b = "";
  const rowsOut: string[] = [];
  const groups = o.groups?.length ? o.groups : [undefined];
  const chars = m ? Math.floor(W / (labSize * 0.55)) : Math.floor((labelW - 16) / (labSize * 0.54));
  for (const g of groups) {
    const items = g === undefined ? rows : rows.filter((r) => r.group === g);
    if (g !== undefined) {
      y += y > top ? 14 : 0;
      b += txt(0, y + 10, g.toUpperCase(), { size: 11, fill: INK.ink, weight: 600 });
      b += line(0, y - 2, W, y - 2, INK.rule, 1);
      y += 22;
    }
    // A suffix every label in the group shares ("Bihar (India)" under "Indian state") is noise.
    const common = items.length > 1 ? items[0].label.match(/\s\([^)]+\)$/)?.[0] : undefined;
    const strip = common && items.every((r) => r.label.endsWith(common)) ? common : "";
    for (const r of items) {
      const own = strip ? r.label.slice(0, -strip.length) : r.label;
      // Capitals run wider, so an all-caps label wraps sooner.
      const lines = wrap(own, Math.max(6, Math.floor(chars * (own.length * labSize * 0.54) / Math.max(1, labelTextW(own, labSize)))), 2);
      const nat = isNational(r.label);
      const rowH = m ? 16 + lines.length * 15 + barH : Math.max(barH + (few ? 22 : 16), lines.length * 15 + 12);
      const by = m ? y + lines.length * 15 + 4 : y + rowH / 2 - barH / 2;
      const xa = o.log ? x0 : Math.min(xs(r.value), zx), xb = o.log ? xs(r.value) : Math.max(xs(r.value), zx);
      // An anomaly (departure from a normal) diverges in the house colours: below normal
      // neel, above it sindoor. Other signed values keep the domain ink either side of zero.
      const fill = nat ? INK.ink : o.anomaly ? o.anomaly[r.value < 0 ? 0 : 1] : "var(--c)";
      let row = `<rect x="0" y="${r1(y)}" width="${W}" height="${r1(rowH)}" fill="transparent"/>`;
      row += m
        ? multiText(0, y + 12, lines, { size: labSize, fill: INK.ink, weight: nat ? 600 : undefined, lh: 15 })
        : multiText(labelW - 12, y + rowH / 2 + 4.5 - (lines.length - 1) * 7.5, lines, { size: labSize, fill: INK.ink, anchor: "end", weight: nat ? 600 : undefined, lh: 15 });
      row += `<rect class="mk-bar" x="${r1(xa)}" y="${r1(by)}" width="${r1(Math.max(1.5, xb - xa))}" height="${barH}" fill="${fill}"/>`;
      const vx = r.value < 0 && !o.log ? xa - 6 : xb + 6;
      row += txt(vx, by + barH / 2 + valSize * 0.36, rowTxt(r), { size: valSize, fill: INK.ink, weight: 600, anchor: r.value < 0 && !o.log ? "end" : "start" });
      rowsOut.push(`<g class="mk"${tip(r.label + (g ? ` · ${g}` : ""), rowTxt(r) + (cleanUnit(unit) && !/[%₹$x]/.test(rowTxt(r)) ? ` ${cleanUnit(unit)}` : ""))} tabindex="0">${row}</g>`);
      if (!m) b += line(labelW, y + rowH, W, y + rowH, "#f3f3f3", 1);
      // On a phone the labels sit above the bars, so the zero line runs beside the bars only.
      else zeroSegs.push([by - 3, by + barH + 3]);
      y += rowH;
    }
  }
  const H = y + 8;
  let axis = "";
  if (o.log) {
    // Gridline values: the edge ones anchored inward, and any that would touch the one before dropped.
    let lastR = -Infinity;
    for (const t of logTicks) {
      axis += line(xs(t), top - 4, xs(t), H - 8, INK.grid, 1);
      const label = fmtU(t, unit), w = textW(label, 11.5), anchor = xs(t) - w / 2 < 0 ? "start" : xs(t) + w / 2 > W ? "end" : "middle";
      const left = anchor === "start" ? xs(t) : anchor === "end" ? xs(t) - w : xs(t) - w / 2;
      if (left < lastR + 6) continue;
      lastR = left + w;
      axis += txt(xs(t), tickBase, label, { size: 11.5, fill: INK.ink3, anchor });
    }
    axis += noteInline ? txt(W, 12, note, { size: noteSize, fill: INK.ink3, anchor: "end" }) : txt(0, noteBase, note, { size: noteSize, fill: INK.ink3 });
  }
  if (m && !o.log) for (const [a, c] of zeroSegs) axis += line(zx, a, zx, c, INK.ink, 1);
  else axis += line(zx, top - 4, zx, H - 8, INK.ink, 1);
  const cap = capLines.length ? multiText(capX, 12, capLines, { size: capSize, fill: INK.ink3, lh: 14 }) : "";
  return svgDoc("fig-bars", W, H, cap + axis + b + rowsOut.join(""), o.label);
}

// =====================================================================
// SHARE STRIP — parts of one whole, labels inside when they fit
// =====================================================================
type Seg = { label: string; value: number; color: string; detail?: string };
function stripRow(segs: Seg[], x0: number, y0: number, w: number, h: number, o: { size: number; outside: boolean; rowLabel?: string }) {
  const total = segs.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  let acc = 0, b = "", outs: Array<{ cx: number; text: string[]; color: string }> = [];
  segs.forEach((s, i) => {
    const sw = (Math.max(0, s.value) / total) * w, sx = x0 + acc;
    acc += sw;
    const share = (Math.max(0, s.value) / total) * 100;
    const pctS = `${share < 1 ? share.toFixed(1) : Math.round(share)}%`;
    b += `<rect class="mk" x="${r1(sx + (i ? 1 : 0))}" y="${r1(y0)}" width="${r1(Math.max(0.8, sw - (i ? 1 : 0)))}" height="${h}" fill="${s.color}"${tip((o.rowLabel ? o.rowLabel + " · " : "") + s.label, pctS + (s.detail ? ` · ${s.detail}` : ""))}/>`;
    const dark = s.color !== "#b3b3b3" && !/s6/.test(s.color);
    const fillT = dark ? "#ffffff" : INK.ink;
    const inner = `${s.label} ${pctS}`;
    if (textW(inner, o.size, true) + 14 < sw) b += txt(sx + 7, y0 + h / 2 + o.size * 0.36, inner, { size: o.size, fill: fillT, weight: 600 });
    else if (textW(pctS, o.size, true) + 10 < sw) { b += txt(sx + sw / 2, y0 + h / 2 + o.size * 0.36, pctS, { size: o.size, fill: fillT, weight: 600, anchor: "middle" }); if (o.outside) outs.push({ cx: sx + sw / 2, text: [s.label], color: s.color }); }
    else if (o.outside) outs.push({ cx: sx + sw / 2, text: [`${s.label} ${pctS}`], color: s.color });
  });
  return { body: b, outs };
}
/** Place outside labels under a strip on as few rows as possible, with a tick to each segment. */
function placeOutside(outs: Array<{ cx: number; text: string[]; color: string }>, y0: number, W: number, size: number) {
  const rows: Array<Array<[number, number]>> = [];
  let b = "", maxRow = -1;
  for (const o of outs) {
    // A long label wraps to at most two thirds of the figure, so it can never run off an edge.
    const lines = textW(o.text[0], size) + 6 > W * 0.66 ? wrap(o.text[0], Math.floor((W * 0.66) / (size * 0.56)), 3) : [o.text[0]];
    const w = Math.max(...lines.map((l) => textW(l, size))) + 6;
    const x = Math.min(Math.max(0, o.cx - w / 2), W - w);
    const free = (r: number) => lines.every((_, k) => !rows[r + k]?.some(([a, c]) => x < c + 8 && x + w > a - 8));
    let r = 0;
    while (!free(r)) r++;
    lines.forEach((_, k) => (rows[r + k] ??= []).push([x, x + w]));
    maxRow = Math.max(maxRow, r + lines.length - 1);
    const ty = y0 + 20 + r * 17;
    b += line(o.cx, y0 + 2, o.cx, ty - size + 1, INK.ink3, 0.75);
    b += multiText(x + w / 2, ty, lines, { size, fill: INK.ink, anchor: "middle", lh: 17 });
  }
  return { body: b, h: outs.length ? 22 + (maxRow + 1) * 17 : 0 };
}
function shareSvg(rowsIn: Array<{ label?: string; segs: Seg[] }>, o: { width: number; mobile: boolean; label: string; key?: boolean }) {
  const W = o.width, m = o.mobile, size = m ? 12 : 13, h = m ? 26 : 32;
  let y = 4, b = "";
  for (const r of rowsIn) {
    if (r.label) { b += txt(0, y + 13, r.label, { size: 13, fill: INK.ink, weight: 600 }); y += 22; }
    const s = stripRow(r.segs, 0, y, W, h, { size, outside: !o.key, rowLabel: r.label });
    b += s.body;
    y += h;
    if (!o.key) { const p = placeOutside(s.outs, y, W, size); b += p.body; y += p.h; }
    y += 18;
  }
  if (o.key) {
    // A key for strips that repeat the same categories row after row.
    let kx = 0, ky = y + 4;
    for (const s of rowsIn[0].segs) {
      const w = textW(s.label, 12) + 30;
      if (kx + w > W) { kx = 0; ky += 20; }
      b += `<rect x="${r1(kx)}" y="${r1(ky - 9)}" width="10" height="10" fill="${s.color}"/>` + txt(kx + 15, ky, s.label, { size: 12, fill: INK.ink2 });
      kx += w;
    }
    y = ky + 10;
  }
  return svgDoc("fig-share", W, y, b, o.label);
}

// =====================================================================
// PYRAMID — two populations by age, the age scale down the middle
// =====================================================================
function pyramidSvg(v: PyramidVisual, o: { width: number; mobile: boolean }) {
  const W = o.width, m = o.mobile, mid = m ? 46 : 64, valSize = m ? 11 : 12;
  const n = v.rows.length, rowH = m ? 15 : 21, gap = m ? 2 : 4, top = 30;
  const max = Math.max(...v.rows.flatMap((r) => [r.male, r.female]), 1);
  const pv = (x: number) => (m ? fmt(x, v.unit).replace(" crore", " cr") : fmt(x, v.unit));
  // The value gutter is as wide as the longest value printed, not a fixed allowance.
  const valW = Math.max(...v.rows.flatMap((r) => [r.male, r.female]).map((x) => textW(pv(x), valSize))) + 10;
  const half = (W - mid) / 2 - valW;
  const cx = W / 2;
  const ml = cx - mid / 2, fr = cx + mid / 2;
  let b = txt(ml, 14, "Men", { size: m ? 12 : 13, fill: INK.ink, weight: 600, anchor: "end" }) + txt(fr, 14, "Women", { size: m ? 12 : 13, fill: INK.ink, weight: 600 });
  // the rows run oldest at the top, as a pyramid should
  const rows = [...v.rows];
  const ages = rows.map((r) => r.age);
  if (/^0|^0-4/.test(ages[0] ?? "")) rows.reverse();
  rows.forEach((r, i) => {
    const y = top + i * rowH, bh = rowH - gap;
    const wm = (r.male / max) * half, wf = (r.female / max) * half;
    b += `<g class="mk"${tip(`Age ${r.age}`, `Men ${fmt(r.male, v.unit)}`, `Women ${fmt(r.female, v.unit)}`)} tabindex="0"><rect x="0" y="${r1(y)}" width="${W}" height="${rowH}" fill="transparent"/>`;
    b += `<rect x="${r1(ml - wm)}" y="${r1(y + gap / 2)}" width="${r1(Math.max(0.8, wm))}" height="${r1(bh)}" fill="var(--c)"/>`;
    b += `<rect x="${r1(fr)}" y="${r1(y + gap / 2)}" width="${r1(Math.max(0.8, wf))}" height="${r1(bh)}" fill="${INK.ink2}"/>`;
    b += txt(cx, y + rowH / 2 + 4, r.age, { size: m ? 11 : 12, fill: INK.ink, anchor: "middle" });
    const showVal = !m || i % 2 === 0 || i === rows.length - 1;
    if (showVal) {
      b += txt(ml - wm - 5, y + rowH / 2 + 4, pv(r.male), { size: valSize, fill: INK.ink2, anchor: "end" });
      b += txt(fr + wf + 5, y + rowH / 2 + 4, pv(r.female), { size: valSize, fill: INK.ink2 });
    }
    b += `</g>`;
  });
  const H = top + n * rowH + 6;
  return svgDoc("fig-pyramid", W, H, b, v.title);
}

// =====================================================================
// RANKED CHANGE — where each unit started and where it is now
// =====================================================================
function rankedSvg(v: RankedChangeVisual, o: { width: number; mobile: boolean }) {
  const W = o.width, m = o.mobile, rows = v.rows, unit = v.unit;
  const labSize = 13, rowH = m ? 40 : 26;
  const lo0 = Math.min(...rows.flatMap((r) => [r.start, r.end])), hi0 = Math.max(...rows.flatMap((r) => [r.start, r.end]));
  const zeroBased = !(lo0 > hi0 * 0.25);
  const sc = tightScale(zeroBased ? Math.min(0, lo0) : lo0, hi0);
  const labelW = m ? 0 : Math.min(W * 0.3, Math.max(90, Math.max(...rows.map((r) => r.label.length)) * 7.2 + 16));
  const chW = m ? 54 : 70;
  const x0 = labelW + 8, x1 = W - chW - 10;
  const x = (val: number) => x0 + ((val - sc.min) / (sc.max - sc.min || 1)) * (x1 - x0);
  const top = 46;
  const chg = harmoniseDecimals(rows.map((r) => signedFmt(r.change, unit)));
  let b = "";
  // key
  b += `<circle cx="${r1(m ? 5 : x0 + 5)}" cy="10" r="4" fill="#fff" stroke="${INK.ink3}" stroke-width="1.5"/>` + txt((m ? 5 : x0 + 5) + 9, 14, `${v.startLabel}${/avg|average/.test(v.startLabel) ? "" : ""}`, { size: 12, fill: INK.ink2 });
  const kx2 = (m ? 5 : x0 + 5) + 9 + textW(v.startLabel, 12) + 22;
  b += `<circle cx="${r1(kx2)}" cy="10" r="4.5" fill="var(--c)"/>` + txt(kx2 + 9, 14, v.endLabel, { size: 12, fill: INK.ink2 });
  b += txt(W, 14, "Change", { size: 12, fill: INK.ink2, anchor: "end" });
  for (const t of sc.ticks.filter((_, i) => !m || i % 2 === 0)) {
    b += line(x(t), top - 6, x(t), top + rows.length * rowH, t === 0 ? INK.ink : INK.grid, 1);
    b += txt(x(t), top - 11, fmt(t, unit), { size: 11.5, fill: INK.ink3, anchor: "middle" });
  }
  rows.forEach((r, i) => {
    const y = top + i * rowH, cy = m ? y + 27 : y + rowH / 2;
    const xa = x(r.start), xb = x(r.end), up = r.end >= r.start;
    let g = `<rect x="0" y="${r1(y)}" width="${W}" height="${rowH}" fill="transparent"/>`;
    g += m ? halo(0, y + 13, r.label, { size: labSize, fill: INK.ink, weight: isNational(r.label) ? 600 : undefined }) : txt(labelW, cy + 4.5, r.label, { size: labSize, fill: INK.ink, anchor: "end", weight: isNational(r.label) ? 600 : undefined });
    g += line(xa, cy, xb, cy, "var(--c)", 2);
    g += `<circle cx="${r1(xa)}" cy="${r1(cy)}" r="4" fill="#fff" stroke="${INK.ink3}" stroke-width="1.5"/>`;
    g += `<circle cx="${r1(xb)}" cy="${r1(cy)}" r="4.5" fill="var(--c)" stroke="#fff" stroke-width="1"/>`;
    g += txt(W, cy + 4.5, chg[i], { size: m ? 12.5 : 13, fill: INK.ink, weight: 600, anchor: "end" });
    b += `<g class="mk"${tip(r.label, `${v.startLabel}: ${fmt(r.start, unit)}`, `${v.endLabel}: ${fmt(r.end, unit)}`, `Change: ${signedFmt(r.change, unit)}`)} tabindex="0">${g}</g>`;
    void up;
  });
  return svgDoc("fig-ranked", W, top + rows.length * rowH + 8, b, v.title);
}
/** Diverging ranked change: one bar per unit from zero. */
function rankedDivergeSvg(v: RankedChangeVisual, o: { width: number; mobile: boolean }) {
  const label = v.divergeLabel ? v.divergeLabel : "";
  const bars = barsSvg(v.rows.map((r) => ({ label: r.label, value: r.change })), { width: o.width, mobile: o.mobile, unit: v.unit, label: v.title, anomaly: anomalyInks(v.unit, v.title) });
  if (!label) return bars;
  // put the direction note in the caption row, right-aligned
  return bars.replace(/(<svg[^>]*>)/, `$1${txt(o.width, 12, `${label}  ·  ${v.startLabel} to ${v.endLabel}`, { size: 11.5, fill: INK.ink3, anchor: "end" })}`);
}

// =====================================================================
// CHANGE — up to four headline changes, each with its own start and end
// =====================================================================
function changeSvg(v: ChangeVisual, o: { width: number; mobile: boolean }) {
  const items = v.items.slice(0, 4), m = o.mobile;
  const cols = m ? 1 : items.length, gap = 32, cw = Math.min(m ? o.width : 420, (o.width - gap * (cols - 1)) / cols);
  const W = m ? o.width : cols * cw + gap * (cols - 1);
  // A change in a percentage is a change in points, not a per cent of a per cent.
  const isPct = /%|percent/i.test(v.unit);
  const val = (x: number) => countFmt(x, v.unit) ?? fmt(x, v.unit);
  const chg = (x: number) => (isPct ? `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x).toLocaleString("en-IN", { maximumFractionDigits: 1 })} points` : countFmt(x, v.unit) ? `${x > 0 ? "+" : ""}${countFmt(x, v.unit)}` : signedFmt(x, v.unit));
  // The closing facts wrap to the card; past a tenfold rise a multiple reads better than
  // a percentage ("+1,67,49,130%").
  const factsOf = (it: (typeof items)[number]) => {
    const yrs = yearSpan(it.start.date, it.end.date);
    const growth = Math.abs(it.pctChange) >= 1000 && it.start.value > 0 ? `${(it.end.value / it.start.value).toLocaleString("en-IN", { maximumFractionDigits: it.end.value / it.start.value >= 100 ? 0 : 1 })} times the starting value` : `${pct(it.pctChange)} on the starting value`;
    return wrap([growth, yrs ? `${chg(it.change / yrs)} a year on average` : ""].filter(Boolean).join("  ·  "), Math.floor(cw / (12 * 0.56)), 3);
  };
  const factLines = Math.max(1, ...items.map((it) => factsOf(it).length));
  const ch = (m ? 150 : 176) + (factLines - 1) * 15;
  let b = "";
  items.forEach((it, i) => {
    const c = i % cols, r = Math.floor(i / cols), ox = c * (cw + gap), oy = r * (ch + 18);
    const lab = it.label.replace(/: value$/i, "").replace(/\s+\([^)]*\)/g, "");
    b += line(ox, oy, ox + cw, oy, INK.ink, 1);
    b += multiText(ox, oy + 20, wrap(lab, Math.floor(cw / 7.3), 2), { size: 13, fill: INK.ink, weight: 600, lh: 16 });
    b += txt(ox, oy + 74, chg(it.change), { size: m ? 28 : 32, fill: "var(--c)", weight: 500 });
    b += txt(ox, oy + 96, `from ${it.start.date} to ${it.end.date}`, { size: 12, fill: INK.ink2 });
    // a two-point slope: start value to end value
    // Inset by the dots' radius so the end dots sit inside the figure.
    const sx0 = ox + 5, sx1 = ox + cw - 6, sy = oy + 128;
    b += line(sx0, sy, sx1, sy, INK.grid, 1);
    const lo = Math.min(it.start.value, it.end.value, 0), hi = Math.max(it.start.value, it.end.value);
    const px = (val: number) => sx0 + ((val - lo) / (hi - lo || 1)) * (sx1 - sx0);
    b += `<g class="mk"${tip(lab, `${it.start.date}: ${val(it.start.value)}`, `${it.end.date}: ${val(it.end.value)}`, `Total growth ${pct(it.pctChange)}, ${multiple(it.start.value, it.end.value)}`)} tabindex="0">`;
    b += `<rect x="${r1(ox)}" y="${r1(oy)}" width="${r1(cw)}" height="${ch}" fill="transparent"/>`;
    b += line(px(it.start.value), sy, px(it.end.value), sy, "var(--c)", 3);
    b += `<circle cx="${r1(px(it.start.value))}" cy="${sy}" r="4" fill="#fff" stroke="${INK.ink3}" stroke-width="1.5"/><circle cx="${r1(px(it.end.value))}" cy="${sy}" r="5" fill="var(--c)"/>`;
    // the two values the change runs between, above their dots
    const sxS = px(it.start.value), sxE = px(it.end.value), apart = Math.abs(sxE - sxS) > 90;
    if (apart) {
      // Each value is anchored inward at whichever end of the line it sits (a fall puts the start on the right).
      const anchorAt = (x: number) => (x < sx0 + 30 ? "start" : x > sx1 - 30 ? "end" : "middle");
      b += txt(sxS, sy - 10, val(it.start.value), { size: 12, fill: INK.ink2, anchor: anchorAt(sxS) });
      b += txt(sxE, sy - 10, val(it.end.value), { size: 12, fill: INK.ink, weight: 600, anchor: anchorAt(sxE) });
    }
    b += `</g>`;
    b += multiText(ox, sy + 24, factsOf(it), { size: 12, fill: INK.ink2, lh: 15 });
  });
  const rowsN = Math.ceil(items.length / cols);
  return svgDoc("fig-change", W, rowsN * (ch + 18), b, v.title);
}

// =====================================================================
// SMALL MULTIPLES — one panel per series, the same anatomy in every panel
// =====================================================================
type Panel = { label: string; lines: Array<{ label: string; color: string; points: Array<{ date: string; value: number }> }>; head?: string; headColor?: string; sub?: string; unit?: string; min?: number; max?: number };
const yearOf = (d: string) => { const m = String(d).match(/^(\d{4})(?:-(\d{2}))?/); return m ? Number(m[1]) + (m[2] ? (Number(m[2]) - 1) / 12 : 0) : NaN; };
function smallMultiples(panels: Panel[], o: { width: number; mobile: boolean; cols: number; ph: number; label: string; shared?: { min: number; max: number }; ticks?: boolean; unit: string; valueFmt: (v: number) => string; firstLast?: boolean; chartId: string; key?: Array<{ label: string; color: string }>; panelKeys?: boolean; tickCount?: number }) {
  const W = o.width, m = o.mobile, cols = o.cols, gx = m ? 14 : 22, gy = m ? 22 : 30;
  const pw = (W - gx * (cols - 1)) / cols, ph = o.ph;
  // Panels with several lines carry their own key under the name (series differ by panel).
  const keyLayout = (p: Panel) => { let kx = 0, row = 0; const at: Array<[number, number]> = []; for (const l of p.lines) { const w = textW(l.label, 11.5) + 28; if (kx + w > pw && kx > 0) { kx = 0; row++; } at.push([kx, row]); kx += w; } return { at, rows: row + 1 }; };
  const keyRows = o.panelKeys ? Math.max(0, ...panels.map((p) => (p.lines.length > 1 ? keyLayout(p).rows : 0))) : 0;
  const head = 34 + keyRows * 17, foot = 18;
  let b = "", y0 = 0;
  if (o.key?.length) {
    let kx = 0;
    for (const k of o.key) { const w = textW(k.label, 12) + 34; if (kx + w > W) { kx = 0; y0 += 20; } b += line(kx, y0 + 7, kx + 16, y0 + 7, k.color, 2.5) + txt(kx + 22, y0 + 11, k.label, { size: 12, fill: INK.ink2 }); kx += w; }
    y0 += 30;
  }
  const hoverPanels: Array<{ plot: number[]; series: Array<{ label: string; color: string; pts: Array<[number, number, string, string]> }> }> = [];
  panels.forEach((p, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const ox = c * (pw + gx), oy = y0 + r * (head + ph + foot + gy);
    const all = p.lines.flatMap((l) => l.points);
    const vals = all.map((q) => q.value);
    let lo = o.shared ? o.shared.min : p.min ?? Math.min(...vals), hi = o.shared ? o.shared.max : p.max ?? Math.max(...vals);
    if (!(hi > lo)) { hi = lo + 1; lo -= 1; }
    const sc = o.ticks ? niceScale(lo, hi, o.tickCount ?? 3) : { min: lo - (hi - lo) * 0.08, max: hi + (hi - lo) * 0.08, ticks: [] as number[] };
    const ts = all.map((q) => yearOf(q.date)).filter(Number.isFinite);
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    // The axis gutter is as wide as its widest value ("-50%" needs more than "0").
    const padL = o.ticks ? Math.max(m ? 26 : 32, ...sc.ticks.map((t) => textW(o.valueFmt(t), 11) + 7)) : 0, padR = 4;
    const px = (t: number) => ox + padL + ((t - t0) / (t1 - t0 || 1)) * (pw - padL - padR);
    const py = (val: number) => oy + head + ph - ((val - sc.min) / (sc.max - sc.min || 1)) * ph;
    // head: name left, the panel's figure right
    // A long name gives way to the panel's figure: a size smaller first, then an ellipsis.
    const room = pw - (p.head ? textW(p.head, 13, true) + 10 : 0);
    const ls = textW(p.label, 13, true) <= room ? 13 : 12;
    const maxC = Math.floor(room / (ls * 0.6));
    b += txt(ox, oy + 14, p.label.length > maxC ? `${p.label.slice(0, maxC - 1)}…` : p.label, { size: ls, fill: INK.ink, weight: 600 });
    if (p.head) b += txt(ox + pw, oy + 14, p.head, { size: 13, fill: p.headColor ?? INK.ink, weight: 600, anchor: "end" });
    if (p.sub) b += txt(ox + pw, oy + 29, p.sub, { size: 11, fill: INK.ink3, anchor: "end" });
    if (o.panelKeys && p.lines.length > 1) keyLayout(p).at.forEach(([kx, row], k) => { const l = p.lines[k], ky = oy + 32 + row * 17; b += line(ox + kx, ky - 4, ox + kx + 14, ky - 4, l.color, 2.2) + txt(ox + kx + 19, ky, l.label, { size: 11.5, fill: INK.ink2 }); });
    for (const t of sc.ticks) {
      b += line(ox + padL, py(t), ox + pw, py(t), t === 0 ? INK.ink : t === sc.ticks[0] ? INK.rule : INK.grid, 1);
      b += txt(ox + padL - 5, py(t) + 4, o.valueFmt(t), { size: 11, fill: INK.ink3, anchor: "end" });
    }
    if (!o.ticks) b += line(ox, oy + head + ph + 1, ox + pw, oy + head + ph + 1, INK.rule, 1);
    const hs: (typeof hoverPanels)[number]["series"] = [];
    for (const l of p.lines) {
      const pts = l.points.filter((q) => Number.isFinite(yearOf(q.date)));
      if (!pts.length) continue;
      const d = pts.map((q, k) => `${k ? "L" : "M"}${r1(px(yearOf(q.date)))} ${r1(py(q.value))}`).join("");
      b += `<path d="${d}" fill="none" stroke="${l.color}" stroke-width="${p.lines.length > 1 ? 1.4 : 1.6}" stroke-linejoin="round" stroke-linecap="round"/>`;
      const last = pts[pts.length - 1], first = pts[0];
      b += `<circle cx="${r1(px(yearOf(last.date)))}" cy="${r1(py(last.value))}" r="2.6" fill="${l.color}" stroke="#fff" stroke-width="1"/>`;
      if (o.firstLast) b += `<circle cx="${r1(px(yearOf(first.date)))}" cy="${r1(py(first.value))}" r="2.2" fill="#fff" stroke="${l.color}" stroke-width="1.2"/>`;
      hs.push({ label: l.label, color: l.color, pts: pts.map((q) => [r1(px(yearOf(q.date))), r1(py(q.value)), o.valueFmt(q.value), String(q.date)] as [number, number, string, string]) });
    }
    hoverPanels.push({ plot: [r1(ox + padL), r1(oy + head), r1(ox + pw), r1(oy + head + ph)], series: hs });
    const y0s = String(all[0]?.date ?? "").slice(0, 4), y1s = String(all[all.length - 1]?.date ?? "").slice(0, 4);
    const firstDate = p.lines.map((l) => l.points[0]?.date).filter(Boolean).sort()[0] ?? y0s;
    const lastDate = p.lines.map((l) => l.points.at(-1)?.date).filter(Boolean).sort().at(-1) ?? y1s;
    b += txt(ox + padL, oy + head + ph + 15, String(firstDate).slice(0, 4), { size: 11, fill: INK.ink3 });
    b += txt(ox + pw, oy + head + ph + 15, String(lastDate).slice(0, 4), { size: 11, fill: INK.ink3, anchor: "end" });
  });
  const rowsN = Math.ceil(panels.length / cols);
  const H = y0 + rowsN * (head + ph + foot + gy) - gy;
  const hover = JSON.stringify({ panels: hoverPanels }).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return svgDoc("fig-multiples", W, H, b, o.label, ` data-hover="${hover}"`);
}

function sparkGridFigure(v: SparkGridVisual, ctx: FigureContext): Figure {
  const isTemp = /°[CF]/.test(v.unit);
  const pctUnit = /%/.test(v.unit);
  // Temperatures read to one decimal with the degree sign, so 32 prints as 32.0°.
  const f = isTemp ? (x: number) => `${x.toFixed(1)}°` : (x: number) => { const s = sparkEndpoint(x, v.unit); return pctUnit && !s.endsWith("%") ? `${s}%` : s; };
  const signedT = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x).toFixed(1)}°`;
  const allDates = v.cells.flatMap((c) => c.points.map((p) => p.date)).sort();
  const startY = String(allDates[0] ?? "").slice(0, 4);
  const panels: Panel[] = v.cells.map((c) => {
    const first = c.points[0]?.value ?? 0;
    return {
      label: c.label,
      lines: [{ label: c.label, color: "var(--c)", points: c.points }],
      head: f(c.latest ?? 0),
      sub: isTemp && typeof c.change === "number" ? `${signedT(c.change)} since the ${startY.slice(0, 3)}0s` : v.latestPeriodLabel ? `${String(c.points.at(-1)?.date ?? "")} only` : `from ${f(first)}`,
    };
  });
  const heads = harmoniseDecimals(panels.map((p) => p.head ?? ""));
  const froms = harmoniseDecimals(panels.map((p) => (p.sub ?? "").replace(/^from /, "")));
  panels.forEach((p, i) => { p.head = heads[i]; if (p.sub?.startsWith("from ")) p.sub = `from ${froms[i]}`; });
  const mk = (W: number, mobile: boolean, cols: number) => smallMultiples(panels, { width: W, mobile, cols, ph: mobile ? 46 : 54, label: v.title, unit: v.unit, valueFmt: f, firstLast: !isTemp, chartId: ctx.chartId });
  const note = isTemp
    ? `Each panel is one city on its own scale, so read the slope, not the height. The figure is the latest year; beneath it, the change between the first and last ten years.`
    : v.latestPeriodLabel
      ? `Each panel plots monthly observations on its own scale, so read the slope, not the height. The figure is the latest month only, not a financial-year total.`
      : `Each panel uses its own vertical scale, so read the slope, not the height. The figures are the latest observation and, beneath it, the first. They are not totals for the period.`;
  return { svg: mk(ctx.narrow ? W_NARROW : W_D, false, ctx.narrow ? 2 : 4), svgM: mk(W_M, true, 2), note };
}

function startingGridFigure(v: StartingGridVisual, ctx: FigureContext): Figure {
  const panels: Panel[] = v.panels.map((p) => ({ label: p.label, sub: p.unit, lines: p.lines, min: p.min, max: p.max }));
  const f = (x: number) => fmt(x, "");
  const mk = (W: number, mobile: boolean, cols: number) => smallMultiples(panels, { width: W, mobile, cols, ph: mobile ? 70 : 90, label: v.title, unit: v.unit, valueFmt: f, chartId: ctx.chartId, key: v.legend });
  const note = `Each panel is one measure, every country drawn from ${v.anchorYear || "the same start"} on that panel's own scale. Read the fan-out: lines that start close and spread apart show a gap opening from a shared starting point.`;
  return { svg: mk(ctx.narrow ? W_NARROW : W_D, false, ctx.narrow ? 2 : 3), svgM: mk(W_M, true, 2), note };
}

function linePanelsFigure(v: LinePanelsVisual, ctx: FigureContext): Figure {
  const f = (x: number) => fmt(x, v.unit);
  // The shared scale is fitted to the data, not to a padded bound, so no panel is half empty.
  const all = v.panels.flatMap((p) => p.lines.flatMap((l) => l.points.map((q) => q.value)));
  const shared = { min: Math.min(v.min, ...all), max: Math.max(...all) };
  // Four or more lines in a panel is a tangle. Each line then gets its own small panel on
  // the shared scale, captioned with the group it came from and its latest value.
  if (v.panels.some((p) => p.lines.length >= 4)) {
    const panels: Panel[] = v.panels.flatMap((p) => p.lines.map((l) => ({
      label: l.label, head: f(l.points.at(-1)?.value ?? 0),
      lines: [{ label: l.label, color: "var(--c)", points: l.points }],
    })));
    const mk = (W: number, mobile: boolean, cols: number) => smallMultiples(panels, { width: W, mobile, cols, ph: mobile ? 60 : 78, label: v.title, unit: v.unit, valueFmt: f, chartId: ctx.chartId, shared, ticks: true, tickCount: 4, firstLast: true });
    const groups = v.panels.map((p, i) => `${i === 0 ? `the first ${p.lines.length}` : i === v.panels.length - 1 ? `the last ${p.lines.length}` : `the next ${p.lines.length}`} are ${p.label.toLowerCase()}`).join("; ");
    return { svg: mk(ctx.narrow ? W_NARROW : W_D, false, ctx.narrow ? 2 : 4), svgM: mk(W_M, true, 2), note: `One panel for each line, every panel on the same scale, so heights compare directly; the figure is the latest year. In order, ${groups}.` };
  }
  const panels: Panel[] = v.panels.map((p) => ({ label: p.label, lines: p.lines.map((l, i) => ({ label: l.label, color: l.color ?? SERIES[i % SERIES.length], points: l.points })) }));
  const mk = (W: number, mobile: boolean, cols: number) => smallMultiples(panels, { width: W, mobile, cols, ph: mobile ? 120 : 170, label: v.title, unit: v.unit, valueFmt: f, chartId: ctx.chartId, shared, ticks: true, panelKeys: true });
  return { svg: mk(ctx.narrow ? W_NARROW : W_D, false, ctx.narrow ? 1 : 2), svgM: mk(W_M, true, 1) };
}

// =====================================================================
// LOAD CURVE — a day, hour by hour, with the series named at their ends
// =====================================================================
function loadCurveSvg(v: LoadCurveVisual, o: { width: number; mobile: boolean }) {
  const W = o.width, m = o.mobile, H = m ? 330 + 20 * Math.ceil(v.series.length / 2) : 440;
  const vals = v.series.flatMap((s) => s.values);
  const sc = niceScale(0, Math.max(v.yMax ?? 0, ...vals), m ? 4 : 5);
  const labelSize = m ? 12 : 13;
  const endTxt = (s: LoadCurveVisual["series"][number]) => (m ? fmt(s.values.at(-1) ?? 0, v.unit) : `${s.label} ${fmt(s.values.at(-1) ?? 0, v.unit)}`);
  const padR = Math.max(...v.series.map((s) => textW(endTxt(s), labelSize, true))) + 16;
  const padL = 40, top = m ? 30 + 20 * Math.ceil(v.series.length / 2) : 30, bot = 34;
  const x = (h: number) => padL + (h / 23) * (W - padL - padR), y = (val: number) => H - bot - ((val - sc.min) / (sc.max - sc.min)) * (H - top - bot);
  // On a phone the unit sits just above the plot, so it starts where the plot does, clear of the top tick.
  let b = unitCaption(m ? padL : 0, m ? top - 6 : 12, v.unit, m ? 11.5 : 12);
  // Phones print values only at the line ends, so the series are named in a key above.
  if (m) v.series.forEach((s, i) => { const kx = (i % 2) * (W / 2), ky = 12 + Math.floor(i / 2) * 20, c = s.color ?? SERIES[i % SERIES.length]; b += line(kx, ky - 4, kx + 16, ky - 4, c, 2.5) + txt(kx + 22, ky, s.label, { size: 12, fill: INK.ink2 }); });
  if (v.gap) {
    b += `<rect x="${r1(x(v.gap.fromHour))}" y="${top}" width="${r1(x(v.gap.toHour) - x(v.gap.fromHour))}" height="${r1(H - top - bot)}" fill="rgba(194,74,46,0.07)"/>`;
    // The band is narrow on a phone, so its name sits above the plot, flush right.
    if (v.gap.label) b += m ? txt(W - padR, top - 6, v.gap.label, { size: 11, fill: "#a63d24", anchor: "end" }) : txt(x(v.gap.fromHour) + 6, top + 14, v.gap.label, { size: 12, fill: "#a63d24" });
  }
  sc.ticks.forEach((t, i) => { b += line(padL, y(t), W - padR, y(t), i === 0 ? INK.ink : INK.grid, 1); b += txt(padL - 8, y(t) + 4, fmt(t, ""), { size: m ? 12 : 12.5, fill: INK.ink3, anchor: "end" }); });
  for (const h of m ? [0, 6, 12, 18] : [0, 3, 6, 9, 12, 15, 18, 21, 23]) {
    b += line(x(h), H - bot, x(h), H - bot + 5, INK.ink, 1);
    b += txt(x(h), H - bot + 20, h === 23 ? "23:00" : `${String(h).padStart(2, "0")}:00`, { size: m ? 12 : 12.5, fill: INK.ink3, anchor: h === 23 ? "end" : h === 0 ? "start" : "middle" });
  }
  if (typeof v.peakHour === "number") b += line(x(v.peakHour), top, x(v.peakHour), H - bot, INK.ink2, 0.9, "4 3");
  const paths = v.series.map((s, i) => ({ s, color: s.color ?? SERIES[i % SERIES.length], d: s.values.map((val, h) => `${h ? "L" : "M"}${r1(x(h))} ${r1(y(val))}`).join("") }));
  for (const p of paths) {
    if (p.s.area) b += `<path d="${p.d}L${r1(x(p.s.values.length - 1))} ${r1(y(0))}L${r1(x(0))} ${r1(y(0))}Z" fill="${p.color}" fill-opacity="0.1"/>`;
    b += `<path d="${p.d}" fill="none" stroke="${p.color}" stroke-width="${p.s.emphasis ? 2.6 : 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  // end labels, stacked so none overlap
  const ends = paths.map((p) => ({ p, y: y(p.s.values.at(-1) ?? 0) })).sort((a, c) => a.y - c.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;
  for (const e of ends) {
    const lx = x(e.p.s.values.length - 1);
    b += `<circle cx="${r1(lx)}" cy="${r1(y(e.p.s.values.at(-1) ?? 0))}" r="3.5" fill="${e.p.color}" stroke="#fff" stroke-width="1.5"/>`;
    b += m ? txt(lx + 8, e.y + 4, endTxt(e.p.s), { size: labelSize, fill: e.p.color, weight: 600 })
      : `<text x="${r1(lx + 10)}" y="${r1(e.y + 4)}" font-family="${F}" font-size="${labelSize}"><tspan fill="${e.p.color}" font-weight="600">${esc(e.p.s.label)}</tspan><tspan fill="${INK.ink2}" dx="5">${esc(fmt(e.p.s.values.at(-1) ?? 0, v.unit))}</tspan></text>`;
  }
  const hover = { plot: [padL, top, W - padR, H - bot], series: paths.map((p) => ({ label: p.s.label, color: p.color, pts: p.s.values.map((val, h) => [r1(x(h)), r1(y(val)), fmt(val, v.unit), `${String(h).padStart(2, "0")}:00`]) })) };
  return svgDoc("fig-load", W, H, b, v.title, ` data-hover="${JSON.stringify(hover).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`);
}

// =====================================================================
// SCATTERS — on the scatterFit anatomy
// =====================================================================
function niceTicks(lo: number, hi: number) { const s = niceScale(lo, hi, 5); return s; }
const scatterTickFmt = (label: string) => (v: number) => (/%|percent/i.test(label) ? `${Math.round(v)}%` : Math.abs(v) < 10 && v % 1 ? v.toFixed(1) : v.toLocaleString("en-IN"));
function scatterXYFigure(v: ScatterXYVisual, ctx: FigureContext): Figure {
  const xa = niceTicks(v.xMin, v.xMax), ya = niceTicks(v.yMin, v.yMax);
  const xf = scatterTickFmt(v.xLabel), yf = scatterTickFmt(v.yLabel);
  const few = v.points.length <= 12;
  const pts = v.points.map((p) => ({ label: p.label, x: p.x, y: p.y, hot: p.highlight || p.label === "India", wantLabel: few || p.highlight || p.label === "India", color: p.label === "India" ? INK.ink : p.highlight ? INK.sindoor : "#a9a9a9" }));
  const build = (W: number, H: number) => {
    const placed = placeScatterLabels(pts, { W, H, x: [xa.min, xa.max], y: [ya.min, ya.max] });
    return scatterFit(placed as ScatterPoint[], {
      x: [xa.min, xa.max], y: [ya.min, ya.max], xTicks: W < 700 ? xa.ticks.filter((_, i) => i % 2 === 0) : xa.ticks, yTicks: ya.ticks, xFmt: xf, yFmt: yf,
      xTitle: v.xLabel, yTitle: v.yLabel, width: W, height: H, refY: v.refY, fit: false, label: v.title, colorOf: (p) => (p as typeof pts[number]).color,
    }).svg;
  };
  const W = ctx.narrow ? W_NARROW : W_D;
  return { svg: build(W, ctx.narrow ? 380 : 460), svgM: build(W_M, 340) };
}
function heatScatterFigure(v: ScatterVisual, ctx: FigureContext): Figure {
  const pts = v.points.map((p) => ({ label: p.label, x: p.x, y: p.y, size: p.size ?? undefined, hot: p.x >= 70 && p.y >= 80, wantLabel: false }));
  // label the five largest exposures, as before, by x·y·size
  [...pts].sort((a, c) => c.x * c.y * (c.size || 1) - a.x * a.y * (a.size || 1)).filter((p) => !/Andaman|Chandigarh|Dadra/.test(p.label)).slice(0, 6).forEach((p) => { p.wantLabel = true; });
  const build = (W: number, H: number) => {
    const placed = placeScatterLabels(pts, { W, H, x: [0, 100], y: [0, 100], sized: true });
    return scatterFit(placed as ScatterPoint[], {
      x: [0, 100], y: [0, 100], xTicks: W < 700 ? [0, 50, 100] : [0, 25, 50, 75, 100], yTicks: [0, 25, 50, 75, 100], xFmt: (t) => `${t}%`, yFmt: (t) => `${t}%`,
      xTitle: W < 700 ? "More high-risk districts" : v.xLabel, yTitle: W < 700 ? "Less household cooling" : v.yLabel, width: W, height: H, fit: false, label: v.title,
      sizeKey: W < 700 ? undefined : undefined,
      under: (x, y) => `<rect x="${r1(x(70))}" y="${r1(y(100))}" width="${r1(x(100) - x(70))}" height="${r1(y(80) - y(100))}" fill="rgba(194,74,46,0.07)"/>` + line(x(70), y(100), x(70), y(0), "rgba(194,74,46,0.45)", 1, "4 4") + line(x(0), y(80), x(100), y(80), "rgba(194,74,46,0.45)", 1, "4 4") + txt(x(100), y(100) - 10, "Shaded: hardest to endure", { size: 12, fill: "#a63d24", anchor: "end", weight: 600 }),
      tipOf: (p) => { const q = v.points.find((z) => z.label === p.label); return [p.label, `Heat risk ${Math.round(p.x)}%`, `Without cooling ${Math.round(p.y)}%`, q?.size != null ? `${v.sizeLabel ? "MPI" : "Size"} ${Number(q.size).toFixed(1)}%` : ""].filter(Boolean); },
    }).svg;
  };
  return { svg: build(ctx.narrow ? W_NARROW : W_D, 480), svgM: build(W_M, 360), note: v.sizeLabel ? `Circle area: ${v.sizeLabel}. Shaded corner: more than 70% of districts at high heat risk and more than 80% of homes without AC or a cooler.` : undefined };
}
/** Greedy label placement for scatters (right, left, above, below; skip if nothing clears). */
export function placeScatterLabels<T extends { label: string; x: number; y: number; size?: number; wantLabel?: boolean; place?: ScatterPoint["place"]; short?: string }>(pts: T[], o: { W: number; H: number; x: [number, number]; y: [number, number]; sized?: boolean }) {
  const sm = o.W < 700, ml = 30, mr = 10, mt = 30, mb = 50, rMax = sm ? 15 : 22, size = sm ? 11 : 12, cw = size * 0.56;
  const X = (v: number) => ml + ((v - o.x[0]) / (o.x[1] - o.x[0])) * (o.W - ml - mr), Y = (v: number) => o.H - mb + ((v - o.y[0]) / (o.y[1] - o.y[0])) * (mt - (o.H - mb));
  const pMax = Math.max(...pts.map((p) => p.size ?? 0));
  const rad = (p: T) => (o.sized && p.size ? Math.max(sm ? 2.5 : 3.5, rMax * Math.sqrt(p.size / pMax)) : sm ? 4.5 : 5.5);
  const boxes: Array<[number, number, number, number]> = pts.map((p) => { const r = rad(p); return [X(p.x) - r, Y(p.y) - r, X(p.x) + r, Y(p.y) + r]; });
  const hit = (b: [number, number, number, number]) => b[0] < ml || b[2] > o.W - mr || b[1] < mt - 8 || b[3] > o.H - mb || boxes.some((c) => b[0] < c[2] && b[2] > c[0] && b[1] < c[3] && b[3] > c[1]);
  for (const p of [...pts].sort((a, b) => (b.size ?? 0) - (a.size ?? 0))) {
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

// =====================================================================
// SCENARIO MAPS — the same map under several scenarios, one scale
// =====================================================================
function scenarioMapsSvg(v: ScenarioMapsVisual, o: { width: number; mobile: boolean }) {
  const [, , vw, vh] = v.viewBox.trim().split(/\s+/).map(Number);
  const n = v.panels.length, gap = o.mobile ? 8 : 24, W = o.width;
  const pw = (W - gap * (n - 1)) / n, s = pw / (vw || 740), ph = (vh || 820) * s;
  const top = o.mobile ? 34 : 24;
  const usuffix = /°C|degree/i.test(v.unit) ? "°C" : "";
  const f = (x: number) => `${fmt(x, v.unit)}${usuffix}`;
  let b = "";
  v.panels.forEach((p, i) => {
    const ox = i * (pw + gap);
    b += o.mobile ? multiText(ox, 11, wrap(p.label, Math.floor(pw / 6.2), 2), { size: 11, fill: INK.ink, weight: 600, lh: 13 }) : txt(ox, 14, p.label, { size: 13, fill: INK.ink, weight: 600 });
    b += `<g transform="translate(${r1(ox)} ${top}) scale(${s.toFixed(4)})">`;
    for (const r of p.regions) {
      const has = r.value !== null && r.value !== undefined;
      b += `<path d="${compactSvgPath(r.path)}" fill="${has ? choroColor(r.value as number, v.min, v.max) : "#f2f2f2"}" stroke="#fff" stroke-width="${r1(0.8 / s) / 2}" stroke-linejoin="round"${tip(r.name, `${p.label}: ${has ? f(r.value as number) : "no data"}`)}/>`;
    }
    b += `</g>`;
  });
  // one legend for every panel
  const ly = top + ph + 18, lw = Math.min(300, W * 0.7), N = 60;
  for (let k = 0; k < N; k++) { const val = v.min + ((v.max - v.min) * (k + 0.5)) / N; b += `<rect x="${r1((k * lw) / N)}" y="${r1(ly)}" width="${r1(lw / N + 0.5)}" height="7" fill="${choroColor(val, v.min, v.max)}"/>`; }
  b += txt(0, ly + 22, f(v.min), { size: 11.5, fill: INK.ink2 }) + txt(lw, ly + 22, f(v.max), { size: 11.5, fill: INK.ink2, anchor: "end" });
  // The measure sits beside the key on desktop and under it on a phone.
  if (o.mobile) { b += txt(0, ly + 40, cleanUnit(v.unit), { size: 11.5, fill: INK.ink3 }); return svgDoc("fig-scenmaps", W, ly + 46, b, v.title); }
  b += txt(lw + 14, ly + 8, cleanUnit(v.unit), { size: 11.5, fill: INK.ink3 });
  return svgDoc("fig-scenmaps", W, ly + 28, b, v.title);
}

// =====================================================================
// GROUPED COLUMNS — kept for completeness (no live article uses them today)
// =====================================================================
function groupedSvg(v: GroupedBarVisual, o: { width: number; mobile: boolean }) {
  const W = o.width, m = o.mobile, H = m ? 300 : 400, padL = 44, top = 34, bot = 30;
  const sc = tightScale(0, Math.max(...v.groups.flatMap((g) => g.values), 1));
  const gw = (W - padL) / v.groups.length, ns = v.series.length, bw = Math.min(m ? 10 : 22, (gw - 8) / ns - 2);
  const y = (val: number) => H - bot - ((val - sc.min) / (sc.max - sc.min)) * (H - top - bot);
  let b = unitCaption(0, 12, v.unit, 12);
  sc.ticks.forEach((t, i) => { b += line(padL, y(t), W, y(t), i ? INK.grid : INK.ink, 1); b += txt(padL - 8, y(t) + 4, fmt(t, v.unit), { size: 12, fill: INK.ink3, anchor: "end" }); });
  let kx = padL;
  v.series.forEach((s, i) => { b += `<rect x="${kx}" y="${18}" width="10" height="10" fill="${SERIES[i % SERIES.length]}"/>` + txt(kx + 15, 27, s, { size: 12 }); kx += textW(s, 12) + 34; });
  v.groups.forEach((g, gi) => {
    const cx = padL + gi * gw + gw / 2;
    g.values.forEach((val, si) => { const x = cx - (ns * (bw + 2)) / 2 + si * (bw + 2); b += `<rect class="mk" x="${r1(x)}" y="${r1(y(val))}" width="${r1(bw)}" height="${r1(Math.max(1, y(0) - y(val)))}" fill="${SERIES[si % SERIES.length]}"${tip(`${g.label} · ${v.series[si]}`, fmt(val, v.unit))}/>`; });
    if (!m || (v.groups.length - 1 - gi) % 2 === 0) b += txt(cx, H - bot + 18, g.label, { size: 12, fill: INK.ink3, anchor: "middle" });
  });
  return svgDoc("fig-grouped", W, H, b, v.title);
}

// =====================================================================
// dispatch
// =====================================================================
/** Render a figure and tag its two drawings so CSS shows one per screen size. */
export function renderFigure(visual: VisualSpec, ctx: FigureContext): Figure | null {
  const f = renderRaw(visual, ctx);
  if (!f) return null;
  const tag = (s: string, c: string) => s.replace(/^<svg class="viz-svg /, `<svg class="viz-svg ${c} `);
  // A phone figure fills the column: phones run 360 to 430 wide, and capping the 346 drawing
  // left a dead strip down the right of every figure on the larger ones.
  return { ...f, svg: tag(f.svg, "viz-d"), svgM: tag(f.svgM, "viz-m").replace(/^(<svg[^>]*?) style="max-width:[\d.]+px"/, "$1") };
}
function renderRaw(visual: VisualSpec, ctx: FigureContext): Figure | null {
  const W = ctx.narrow ? W_NARROW : W_D;
  const both = (fn: (o: { width: number; mobile: boolean }) => string): Figure => ({ svg: fn({ width: W, mobile: false }), svgM: fn({ width: W_M, mobile: true }) });
  switch (visual.kind) {
    case "bar": {
      const v = visual as BarVisual;
      const hasNeg = v.bars.some((b) => b.value < 0);
      const total = v.bars.reduce((s, b) => s + Math.max(0, b.value), 0);
      const isComparison = Boolean(v.source.indicatorId?.startsWith("compare.") || v.source.indicatorId?.startsWith("econ.compare."));
      const isShare = v.share === true || (/%/.test(v.unit) && v.bars.length <= 4 && Math.abs(total - 100) <= 3 && !hasNeg && !isComparison);
      if (isShare) return both((o) => shareSvg([{ segs: v.bars.map((b, i) => ({ label: b.label, value: b.value, color: SERIES[i % SERIES.length] })) }], { ...o, label: v.title }));
      const groups = [...new Set(v.bars.map((b) => b.group).filter(Boolean))] as string[];
      return both((o) => barsSvg(v.bars, { ...o, unit: v.unit, log: v.scale === "log", label: v.title, groups, anomaly: v.bars.some((b) => b.value < 0) ? anomalyInks(v.unit, v.title) : undefined }));
    }
    case "stack": {
      const v = visual as StackVisual;
      return both((o) => shareSvg([{ segs: v.segments.map((s, i) => ({ label: s.label, value: s.value, color: SERIES[i % SERIES.length], detail: fmt(s.value, v.unit) })) }], { ...o, label: v.title }));
    }
    case "stripPair": {
      const v = visual as StripPairVisual;
      return both((o) => shareSvg(v.rows.map((r) => ({ label: r.label, segs: r.segments.map((s, i) => ({ label: s.label, value: s.value, color: SERIES[i % SERIES.length] })) })), { ...o, label: v.title, key: true }));
    }
    case "pyramid": return both((o) => pyramidSvg(visual as PyramidVisual, o));
    case "rankedChange": { const v = visual as RankedChangeVisual; return both((o) => (v.diverging ? rankedDivergeSvg(v, o) : rankedSvg(v, o))); }
    case "change": return both((o) => changeSvg(visual as ChangeVisual, o));
    case "sparkGrid": return sparkGridFigure(visual as SparkGridVisual, ctx);
    case "startingGrid": return startingGridFigure(visual as StartingGridVisual, ctx);
    case "linePanels": return linePanelsFigure(visual as LinePanelsVisual, ctx);
    case "loadCurve": return both((o) => loadCurveSvg(visual as LoadCurveVisual, o));
    case "scatterXY": return scatterXYFigure(visual as ScatterXYVisual, ctx);
    case "scatter": return heatScatterFigure(visual as ScatterVisual, ctx);
    case "scenarioMaps": return both((o) => scenarioMapsSvg(visual as ScenarioMapsVisual, o));
    case "groupedBar": return both((o) => groupedSvg(visual as GroupedBarVisual, o));
    default: return null;
  }
}
