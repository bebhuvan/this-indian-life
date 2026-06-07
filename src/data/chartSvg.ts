import type { ChoroplethVisual } from "./viz";

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

// Multi-stop perceptual ramps (opt-in via the `ramp` field). Smoothly interpolated in
// sRGB across hand-picked stops — richer and less muddy than a single two-colour lerp.
const RAMP_STOPS: Record<string, string[]> = {
  // pale peach -> gold -> coral -> rose -> plum -> deep indigo
  sunset: ["#fbe9d6", "#f6c879", "#ef9a4f", "#e16a5f", "#b34a78", "#6d2f72", "#3a2356"],
  // soft mint -> teal -> deep sea -> midnight
  teal: ["#eef6f2", "#a6dccb", "#56b6a6", "#2a8597", "#1f5278", "#16315a"],
};

// Diverging palette for maps with a meaningful threshold (passed via `divergeAt`,
// e.g. fertility's 2.1 replacement line). Below the pivot reads cool, above reads
// warm, with a near-neutral cream exactly at the pivot — so "above vs below the
// line" is legible from colour alone, not just the numbers.
const DIVERGE_LOW = ["#1f5278", "#2a8597", "#56b6a6", "#a6dccb", "#f1ead8"]; // deep teal (min) -> cream (pivot)
const DIVERGE_HIGH = ["#f1ead8", "#f6c879", "#ef9a4f", "#e16a5f", "#b34a78"]; // cream (pivot) -> rose (max)
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpStops(stops: string[], t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const [r1, g1, b1] = hexToRgb(stops[i]);
  const [r2, g2, b2] = hexToRgb(stops[i + 1]);
  return `rgb(${Math.round(r1 + (r2 - r1) * f)},${Math.round(g1 + (g2 - g1) * f)},${Math.round(b1 + (b2 - b1) * f)})`;
}

export function choroColor(value: number, min: number, max: number, ramp: string = "warm", divergeAt?: number) {
  // Diverging mode: scale each side of the pivot independently so the threshold
  // always lands on the cream midpoint regardless of how lopsided the data is.
  if (divergeAt !== undefined && Number.isFinite(divergeAt)) {
    if (value <= divergeAt) {
      const tl = divergeAt > min ? Math.max(0, Math.min(1, (value - min) / (divergeAt - min))) : 1;
      return lerpStops(DIVERGE_LOW, tl);
    }
    const th = max > divergeAt ? Math.max(0, Math.min(1, (value - divergeAt) / (max - divergeAt))) : 0;
    return lerpStops(DIVERGE_HIGH, th);
  }
  const t = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  if (RAMP_STOPS[ramp]) return lerpStops(RAMP_STOPS[ramp], t);
  if (ramp === "cool") {
    const r = Math.round(233 + (31 - 233) * t);
    const g = Math.round(239 + (111 - 239) * t);
    const b = Math.round(243 + (156 - 243) * t);
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(242 + (212 - 242) * t);
  const g = Math.round(233 + (69 - 233) * t);
  const b = Math.round(226 + (42 - 226) * t);
  return `rgb(${r},${g},${b})`;
}

export function choroplethValueLabel(visual: ChoroplethVisual, value: number) {
  const suffix = /%/.test(visual.unit) ? "%" : /°C|degree/i.test(visual.unit) ? "°C" : "";
  return `${visual.signed ? signedFmt(value, visual.unit) : fmt(value, visual.unit)}${suffix}`;
}

export function renderChoroplethSvg(visual: ChoroplethVisual) {
  const paths = visual.regions.map((region) => {
    const valueLabel = region.value === null || region.value === undefined ? "no data" : choroplethValueLabel(visual, region.value);
    const fill = region.value === null || region.value === undefined ? "#efeae4" : choroColor(region.value, visual.min, visual.max, visual.ramp, visual.divergeAt);
    return `<path d="${escapeHtml(compactSvgPath(region.path))}" fill="${fill}" stroke="#ffffff" stroke-width="0.6" stroke-linejoin="round" stroke-linecap="round"><title>${escapeHtml(region.name)}: ${escapeHtml(valueLabel)}</title></path>`;
  }).join("");
  // Soft drop-shadow lifts the whole map off the page; applied once to the group, not per path.
  return `<svg class="viz-svg choro-map" viewBox="${escapeHtml(visual.viewBox)}" role="img" aria-label="${escapeHtml(visual.title)}"><defs><filter id="choroLift" x="-6%" y="-6%" width="112%" height="116%"><feDropShadow dx="0" dy="1.5" stdDeviation="2.4" flood-color="#241f3a" flood-opacity="0.16"/></filter></defs><g filter="url(#choroLift)">${paths}</g></svg>`;
}

export function viewBoxAspectRatio(viewBox: string) {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  const width = parts[2] && Number.isFinite(parts[2]) ? parts[2] : 740;
  const height = parts[3] && Number.isFinite(parts[3]) ? parts[3] : 820;
  return `${width} / ${height}`;
}
