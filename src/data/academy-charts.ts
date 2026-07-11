// Build-time inline-SVG line/area charts for the academy. No client JS, no chart
// library — fed by sourced time-series from data/series/. Mobile-friendly via viewBox.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export type ChartSeries = { label: string; seriesId: string; color?: string };
export type ChartPoint = { t: number; v: number };
export type ResolvedSeries = { label: string; color: string; points: ChartPoint[] };

const PALETTE = ["var(--economy)", "var(--climate)", "var(--health)", "var(--energy)", "var(--society)"];

// "2025-12" -> 2025.916..., "1960" -> 1960
function dateToT(date: string): number {
  const m = String(date).match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return NaN;
  return Number(m[1]) + (m[2] ? (Number(m[2]) - 1) / 12 : 0);
}

export function loadSeries(seriesId: string): ChartPoint[] {
  const p = resolve("data/series", `${seriesId}.json`);
  if (!existsSync(p)) return [];
  const s = JSON.parse(readFileSync(p, "utf8"));
  return (s.observations || [])
    .map((o: { date: string; value: number }) => ({ t: dateToT(o.date), v: Number(o.value) }))
    .filter((p: ChartPoint) => Number.isFinite(p.t) && Number.isFinite(p.v));
}

export function resolveChartSeries(series: ChartSeries[]): ResolvedSeries[] {
  return series
    .map((s, i) => ({ label: s.label, color: s.color || PALETTE[i % PALETTE.length], points: loadSeries(s.seriesId) }))
    .filter((s) => s.points.length > 1);
}

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

const round = (n: number) => Number(n.toFixed(1)).toString();
const WATERMARK = `<text x="746" y="312" text-anchor="end" font-family="DM Sans, Arial, sans-serif" font-size="10" font-weight="600" letter-spacing="1" text-transform="uppercase" fill="#8c8780" opacity="0.42">thisindianlife.today</text>`;

// Render a multi-series line (or single-series area) chart as an inline SVG string.
export function renderLineChartSvg(
  series: ResolvedSeries[],
  opts: { yUnit?: string; zeroLine?: boolean; area?: boolean } = {}
): string {
  if (!series.length) return "";
  const W = 760, H = 320, padL = 46, padR = 14, padT = 14, padB = 26;
  const allT = series.flatMap((s) => s.points.map((p) => p.t));
  const allV = series.flatMap((s) => s.points.map((p) => p.v));
  let minT = Math.min(...allT), maxT = Math.max(...allT);
  let minV = Math.min(...allV), maxV = Math.max(...allV);
  if (opts.zeroLine) { minV = Math.min(minV, 0); maxV = Math.max(maxV, 0); }
  const padV = (maxV - minV) * 0.08 || 1;
  minV -= padV; maxV += padV;
  const x = (t: number) => padL + ((t - minT) / (maxT - minT || 1)) * (W - padL - padR);
  const y = (v: number) => padT + ((maxV - v) / (maxV - minV || 1)) * (H - padT - padB);

  const ticks = niceTicks(minV, maxV, 4);
  const grid = ticks.map((tv) =>
    `<line x1="${padL}" y1="${y(tv).toFixed(1)}" x2="${W - padR}" y2="${y(tv).toFixed(1)}" class="ac-grid"/>` +
    `<text x="${padL - 6}" y="${(y(tv) + 3).toFixed(1)}" class="ac-ylabel">${round(tv)}${/%/.test(opts.yUnit || "") ? "%" : ""}</text>`
  ).join("");

  const zero = opts.zeroLine && minV < 0 && maxV > 0
    ? `<line x1="${padL}" y1="${y(0).toFixed(1)}" x2="${W - padR}" y2="${y(0).toFixed(1)}" class="ac-zero"/>` : "";

  // x labels: first and last year
  const yr = (t: number) => Math.round(t).toString();
  const xlabels = `<text x="${padL}" y="${H - 6}" class="ac-xlabel" text-anchor="start">${yr(minT)}</text>` +
    `<text x="${W - padR}" y="${H - 6}" class="ac-xlabel" text-anchor="end">${yr(maxT)}</text>`;

  const paths = series.map((s, i) => {
    const d = s.points.map((p, j) => `${j ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
    const last = s.points[s.points.length - 1];
    const areaFill = opts.area && series.length === 1
      ? `<path d="${d} L${x(last.t).toFixed(1)} ${y(minV).toFixed(1)} L${x(s.points[0].t).toFixed(1)} ${y(minV).toFixed(1)} Z" fill="${s.color}" opacity="0.10"/>` : "";
    return `${areaFill}<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<circle cx="${x(last.t).toFixed(1)}" cy="${y(last.v).toFixed(1)}" r="3" fill="${s.color}"/>`;
  }).join("");

  return `<svg viewBox="0 0 ${W} ${H}" class="ac-chart" role="img" preserveAspectRatio="xMidYMid meet">${grid}${zero}${paths}${xlabels}${WATERMARK}</svg>`;
}
