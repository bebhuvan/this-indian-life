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

export function choroColor(value: number, min: number, max: number, ramp: string = "warm") {
  const t = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
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
    const fill = region.value === null || region.value === undefined ? "#efeae4" : choroColor(region.value, visual.min, visual.max, visual.ramp);
    return `<path d="${escapeHtml(compactSvgPath(region.path))}" fill="${fill}" stroke="#fff" stroke-width="0.8" stroke-linejoin="round"><title>${escapeHtml(region.name)}: ${escapeHtml(valueLabel)}</title></path>`;
  }).join("");
  return `<svg class="viz-svg choro-map" viewBox="${escapeHtml(visual.viewBox)}" role="img" aria-label="${escapeHtml(visual.title)}">${paths}</svg>`;
}

export function viewBoxAspectRatio(viewBox: string) {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  const width = parts[2] && Number.isFinite(parts[2]) ? parts[2] : 740;
  const height = parts[3] && Number.isFinite(parts[3]) ? parts[3] : 820;
  return `${width} / ${height}`;
}
