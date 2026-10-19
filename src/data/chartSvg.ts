import type { ChoroplethVisual } from "./viz";
import { ramp, SCALES } from "./almanac";

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgCoord(value: number, precision = 1) {
  return Number(value.toFixed(precision)).toString();
}

function watermarkSvg(viewBox: string) {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  const width = parts[2] && Number.isFinite(parts[2]) ? parts[2] : 740;
  const height = parts[3] && Number.isFinite(parts[3]) ? parts[3] : 820;
  return `<text class="chart-watermark" x="${svgCoord(width - 12)}" y="${svgCoord(height - 10)}" text-anchor="end" font-family="Schibsted Grotesk, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="600" letter-spacing="1.1" text-transform="uppercase" fill="#8a8a8a" opacity="0.42">thisindianlife.today</text>`;
}

export function compactSvgPath(path: string) {
  return path
    .replace(/-?\d+(?:\.\d+)?/g, (match) => svgCoord(Number(match), 1))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*([MLZ])\s*/g, "$1");
}

function fmt(value: number, unit = "") {
  const abs = Math.abs(value);
  if (/multiple/i.test(unit)) return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}x`;
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
  if (/US\$|usd|\$/i.test(unit)) {
    if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })}T`;
    if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}B`;
  }
  if (/people/i.test(unit) && abs >= 10_000_000) return `${(value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} cr`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (abs >= 100) return value.toFixed(0);
  return value.toFixed(1);
}

function signedFmt(value: number, unit = "") {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${fmt(Math.abs(value), unit)}`;
}

// Choropleth ramps, built from the Almanac's named inks and interpolated in OKLab
// (see `ramp` in almanac.ts). Pick one with the plan's `ramp` field; each is
// sequential, pale tint to deep ink.
const SEQUENTIAL: Record<string, (t: number) => string> = {
  // sindoor: heat, burden, more of something bad (the default)
  warm: ramp([[0, "#f6ebe6"], [0.4, "#e39c81"], [0.75, "#c24a2e"], [1, "#7a2816"]]),
  // neel
  cool: ramp(SCALES.neel),
  // jamun: a neutral "more of it" scale that carries no good/bad charge
  sunset: ramp([[0, "#f1ebf3"], [0.45, "#a986b8"], [0.8, "#7b4790"], [1, "#4f2b5e"]]),
  // hara
  teal: ramp([[0, "#e6f3ef"], [0.45, "#4fb39a"], [0.8, "#008a6e"], [1, "#005a47"]]),
};

// Diverging scale for maps with a meaningful threshold (`divergeAt`, e.g. fertility's
// 2.1 replacement line): below the pivot is neel, above it sindoor, and the pivot
// itself is neutral grey, never a hue. Each arm runs t = 0..1 from its far end to the
// pivot (low) or from the pivot to its far end (high). `ramp: "invert"` swaps the arms
// for measures where falling below the pivot is the concerning side (a yield loss).
const DIVERGE_LOW = ramp([[0, "#24387f"], [0.3, "#33489a"], [0.6, "#6a7bc0"], [0.82, "#aeb8de"], [1, "#e4e4e4"]]);
const DIVERGE_HIGH = ramp([[0, "#e4e4e4"], [0.18, "#f1cbba"], [0.42, "#e39c81"], [0.72, "#c24a2e"], [1, "#7a2816"]]);

export function choroColor(value: number, min: number, max: number, rampName: string = "warm", divergeAt?: number) {
  // Diverging mode: scale each side of the pivot independently so the threshold
  // always lands on the grey midpoint regardless of how lopsided the data is.
  if (divergeAt !== undefined && Number.isFinite(divergeAt)) {
    const invert = rampName === "invert";
    if (value <= divergeAt) {
      const tl = divergeAt > min ? Math.max(0, Math.min(1, (value - min) / (divergeAt - min))) : 1;
      return invert ? DIVERGE_HIGH(1 - tl) : DIVERGE_LOW(tl);
    }
    const th = max > divergeAt ? Math.max(0, Math.min(1, (value - divergeAt) / (max - divergeAt))) : 0;
    return invert ? DIVERGE_LOW(1 - th) : DIVERGE_HIGH(th);
  }
  const t = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  return (SEQUENTIAL[rampName] ?? SEQUENTIAL.warm)(t);
}

// A map whose every value is a whole number prints whole numbers ("97", not "97.0").
const wholeMaps = new WeakMap<ChoroplethVisual, boolean>();
function isWholeMap(visual: ChoroplethVisual) {
  let w = wholeMaps.get(visual);
  if (w === undefined) {
    const vals = visual.regions.map((r) => r.value).filter((v): v is number => typeof v === "number");
    w = vals.length > 0 && vals.every((v) => Number.isInteger(v));
    wholeMaps.set(visual, w);
  }
  return w;
}

export function choroplethValueLabel(visual: ChoroplethVisual, value: number) {
  const suffix = /%/.test(visual.unit) ? "%" : /°C|degree/i.test(visual.unit) ? "°C" : "";
  if (isWholeMap(visual) && Number.isInteger(value) && Math.abs(value) < 1000) {
    const sign = visual.signed && value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}${Math.abs(value)}${suffix}`;
  }
  const out = `${visual.signed ? signedFmt(value, visual.unit) : fmt(value, visual.unit)}${suffix}`;
  // A scale that runs into the hundreds is read in whole numbers: "97" beside "459", not "97.0".
  return !suffix && Math.max(Math.abs(visual.min), Math.abs(visual.max)) >= 100 ? out.replace(/(\d)\.0(?!\d)/, "$1") : out;
}

// Area-weighted centroid and area of a region's largest ring, in viewBox units.
function ringCentroid(path: string) {
  let best: [number, number, number] | null = null;
  for (const ring of path.split(/(?=M)/)) {
    const pts = [...ring.matchAll(/(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    if (pts.length < 3) continue;
    let A = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], c = x0 * y1 - x1 * y0;
      A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
    }
    if (A && (!best || Math.abs(A) > Math.abs(best[0]))) best = [A, cx / (3 * A), cy / (3 * A)];
  }
  return best ? { area: Math.abs(best[0]) / 2, x: best[1], y: best[2] } : null;
}

// The map: hairline white borders, no shadow, and the value printed inside every
// region large enough to hold it (names live in the ranked strip beside the map).
export function renderChoroplethSvg(visual: ChoroplethVisual) {
  const [, , vw, vh] = visual.viewBox.trim().split(/\s+/).map(Number);
  const total = (vw || 740) * (vh || 820);
  const fontSize = Math.max(11, (vw || 740) / 48);
  let labels = "";
  const paths = visual.regions.map((region) => {
    const has = region.value !== null && region.value !== undefined;
    const valueLabel = has ? choroplethValueLabel(visual, region.value as number) : "no data";
    const fill = has ? choroColor(region.value as number, visual.min, visual.max, visual.ramp, visual.divergeAt) : "#ffffff";
    if (has) {
      const c = ringCentroid(region.path);
      if (c && c.area / total > 0.006 && valueLabel.length * fontSize * 0.6 < Math.sqrt(c.area) * 1.3) {
        labels += `<text x="${svgCoord(c.x)}" y="${svgCoord(c.y + fontSize * 0.35)}" text-anchor="middle" font-family="Schibsted Grotesk, Helvetica Neue, Arial, sans-serif" font-size="${svgCoord(fontSize)}" font-weight="600" fill="#121212" stroke="#ffffff" stroke-width="${svgCoord(fontSize * 0.28)}" stroke-opacity="0.75" paint-order="stroke" stroke-linejoin="round">${escapeHtml(valueLabel)}</text>`;
      }
    }
    return `<path d="${escapeHtml(compactSvgPath(region.path))}" fill="${fill}" stroke="${has ? "#ffffff" : "#8a8a8a"}" stroke-width="${has ? 0.7 : 0.8}"${has ? "" : ' stroke-dasharray="2 2"'} stroke-linejoin="round" stroke-linecap="round"><title>${escapeHtml(region.name)}: ${escapeHtml(valueLabel)}</title></path>`;
  }).join("");
  return `<svg class="viz-svg choro-map" viewBox="${escapeHtml(visual.viewBox)}" role="img" aria-label="${escapeHtml(visual.title)}"><g>${paths}</g><g>${labels}</g>${watermarkSvg(visual.viewBox)}</svg>`;
}

// The ranked strip beside the map: every region in order, a dot on the shared scale
// and its value. Its header doubles as the legend, with the pivot (e.g. replacement)
// marked once. Small regions that vanish on the map stay readable here.
export function renderChoroplethStrip(visual: ChoroplethVisual) {
  const rows = visual.regions.filter((r) => r.value !== null && r.value !== undefined).sort((a, b) => (b.value as number) - (a.value as number));
  const W = 320, nameW = 128, x0 = nameW + 8, x1 = W - 46, rowH = rows.length > 30 ? 16 : 19, top = 44;
  // Values past the colour scale (Delhi's income) sit at its end with an open arrowhead,
  // rather than running into the printed value.
  const x = (v: number) => x0 + ((Math.min(visual.max, Math.max(visual.min, v)) - visual.min) / (visual.max - visual.min || 1)) * (x1 - x0);
  const F = 'font-family="Schibsted Grotesk, Helvetica Neue, Arial, sans-serif"';
  const short = (n: string) => n.replace("Dadra and Nagar Haveli and Daman and Diu", "Dadra, Daman & Diu").replace("Andaman and Nicobar Islands", "Andaman & Nicobar").replace("Jammu and Kashmir", "Jammu & Kashmir");
  let b = "";
  const N = 60;
  for (let i = 0; i < N; i++) {
    const v = visual.min + ((visual.max - visual.min) * (i + 0.5)) / N;
    b += `<rect x="${svgCoord(x0 + ((x1 - x0) * i) / N)}" y="10" width="${svgCoord((x1 - x0) / N + 0.4)}" height="7" fill="${choroColor(v, visual.min, visual.max, visual.ramp, visual.divergeAt)}"/>`;
  }
  b += `<text x="${x0}" y="31" ${F} font-size="10.5" fill="#4f4f4f">${escapeHtml(choroplethValueLabel(visual, visual.min))}</text><text x="${x1}" y="31" ${F} font-size="10.5" fill="#4f4f4f" text-anchor="end">${escapeHtml(choroplethValueLabel(visual, visual.max))}</text>`;
  const pivot = visual.divergeAt !== undefined && visual.divergeAt > visual.min && visual.divergeAt < visual.max ? visual.divergeAt : null;
  if (pivot !== null) {
    b += `<line x1="${svgCoord(x(pivot))}" y1="6" x2="${svgCoord(x(pivot))}" y2="${top + rows.length * rowH}" stroke="#121212" stroke-width="0.8" stroke-dasharray="2 2"/>`;
    b += `<text x="${svgCoord(x(pivot))}" y="4" ${F} font-size="10.5" font-weight="600" fill="#121212" text-anchor="middle">${visual.pivotLabel && /\d/.test(visual.pivotLabel) ? escapeHtml(visual.pivotLabel) : `${escapeHtml(choroplethValueLabel(visual, pivot))}${visual.pivotLabel ? ` ${escapeHtml(visual.pivotLabel)}` : ""}`}</text>`;
  }
  rows.forEach((r, i) => {
    const v = r.value as number, cy = top + i * rowH + rowH / 2;
    b += `<text x="${nameW}" y="${svgCoord(cy + 4)}" ${F} font-size="11.5" fill="#121212" text-anchor="end">${escapeHtml(short(r.name))}</text>`;
    b += `<line x1="${x0}" y1="${svgCoord(cy)}" x2="${x1}" y2="${svgCoord(cy)}" stroke="#ededed" stroke-width="1"/>`;
    if (v > visual.max || v < visual.min) {
      const xe = x(v), dir = v > visual.max ? 1 : -1;
      b += `<path d="M${svgCoord(xe + dir * 6)} ${svgCoord(cy)}L${svgCoord(xe + dir * 11)} ${svgCoord(cy)}M${svgCoord(xe + dir * 8)} ${svgCoord(cy - 3)}L${svgCoord(xe + dir * 11)} ${svgCoord(cy)}L${svgCoord(xe + dir * 8)} ${svgCoord(cy + 3)}" fill="none" stroke="#121212" stroke-width="1"/>`;
    }
    b += `<circle cx="${svgCoord(x(v))}" cy="${svgCoord(cy)}" r="4.5" fill="${choroColor(v, visual.min, visual.max, visual.ramp, visual.divergeAt)}" stroke="#121212" stroke-width="0.6"><title>${escapeHtml(r.name)}: ${escapeHtml(choroplethValueLabel(visual, v))}</title></circle>`;
    b += `<text x="${W}" y="${svgCoord(cy + 4)}" ${F} font-size="11.5" font-weight="600" fill="#121212" text-anchor="end">${escapeHtml(choroplethValueLabel(visual, v))}</text>`;
  });
  return `<svg class="choro-strip" viewBox="0 0 ${W} ${top + rows.length * rowH + 4}" role="img" aria-label="${escapeHtml(visual.title)}, every region ranked">${b}</svg>`;
}

export function viewBoxAspectRatio(viewBox: string) {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  const width = parts[2] && Number.isFinite(parts[2]) ? parts[2] : 740;
  const height = parts[3] && Number.isFinite(parts[3]) ? parts[3] : 820;
  return `${width} / ${height}`;
}
