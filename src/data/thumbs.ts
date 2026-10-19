// Small marks-only pictures of an article's lead figure, for the lists that point to it
// (domain pages, the archive). No text: the card beside it carries the words. Drawn from
// the same visuals the article renders, so the picture is the article's own data.
import type { QuestionPage } from "./questions";
import { visualsForQuestion } from "./viz";

let W = 264, H = 112;
const r1 = (v: number) => Math.round(v * 10) / 10;
const INKS = ["var(--c)", "#121212", "#b3b3b3"];
const cache = new Map<string, string | null>();

type Pt = { date: string; value: number };
const timeOf = (d: string) => {
  const m = String(d).match(/^(-?\d{3,4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  return m ? Number(m[1]) + (m[2] ? (Number(m[2]) - 1) / 12 : 0) + (m[3] ? (Number(m[3]) - 1) / 365 : 0) : NaN;
};

function linesThumb(lines: Array<{ label: string; points: Pt[] }>) {
  // A thumbnail needs the shape, not every day: long series are thinned to ~140 points.
  const thin = (pts: Pt[]) => (pts.length <= 140 ? pts : pts.filter((_, i) => i % Math.ceil(pts.length / 140) === 0 || i === pts.length - 1));
  const ls = lines.filter((l) => l.points.length >= 5).slice(0, 3).map((l) => ({ ...l, points: thin(l.points) }));
  if (!ls.length) return null;
  const all = ls.flatMap((l) => l.points);
  const ts = all.map((p) => timeOf(p.date)), vs = all.map((p) => p.value);
  if (ts.some((t) => !Number.isFinite(t))) return null;
  const t0 = Math.min(...ts), t1 = Math.max(...ts);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (lo >= 0 && lo < hi * 0.35) lo = 0;
  const pad = (hi - lo) * 0.08 || 1;
  lo -= lo === 0 ? 0 : pad; hi += pad;
  const x = (t: number) => 2 + ((t - t0) / (t1 - t0 || 1)) * (W - 8);
  const y = (v: number) => H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 10);
  let b = `<line x1="0" y1="${H - 2.5}" x2="${W}" y2="${H - 2.5}" stroke="#121212" stroke-width="1"/>`;
  if (lo < 0 && hi > 0) b += `<line x1="0" y1="${r1(y(0))}" x2="${W}" y2="${r1(y(0))}" stroke="#dadada" stroke-width="1"/>`;
  ls.slice().reverse().forEach((l) => {
    const i = ls.indexOf(l), c = INKS[i];
    const d = l.points.map((p, k) => `${k ? "L" : "M"}${r1(x(timeOf(p.date)))} ${r1(y(p.value))}`).join("");
    b += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${i ? 1.4 : 1.9}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const last = l.points[l.points.length - 1];
    b += `<circle cx="${r1(x(timeOf(last.date)))}" cy="${r1(y(last.value))}" r="${i ? 2.2 : 2.8}" fill="${c}"/>`;
  });
  return b;
}

function barsThumb(bars: Array<{ label: string; value: number }>) {
  const bs = bars.filter((b) => Number.isFinite(b.value)).slice(0, 7);
  if (bs.length < 2) return null;
  const lo = Math.min(0, ...bs.map((b) => b.value)), hi = Math.max(0, ...bs.map((b) => b.value));
  const x = (v: number) => ((v - lo) / (hi - lo || 1)) * (W - 4);
  const step = H / bs.length, bh = Math.min(9, step * 0.55);
  let b = "";
  bs.forEach((r, i) => {
    const nat = /^(all[- ]india|india|national|total)$/i.test(r.label.trim());
    const xa = Math.min(x(r.value), x(0)), xb = Math.max(x(r.value), x(0));
    b += `<rect x="${r1(xa)}" y="${r1(i * step + (step - bh) / 2)}" width="${r1(Math.max(1.5, xb - xa))}" height="${r1(bh)}" fill="${nat ? "#121212" : "var(--c)"}"/>`;
  });
  return b + `<line x1="${r1(x(0))}" y1="0" x2="${r1(x(0))}" y2="${H}" stroke="#121212" stroke-width="1"/>`;
}

/** The lead line chart or bar chart of an article as a thumbnail (264x112 by default,
 *  drawn at the size it is shown so strokes keep their weight), or null. */
export function articleThumb(page: QuestionPage, size: [number, number] = [264, 112]): string | null {
  const key = `${page.id}|${size.join("x")}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  [W, H] = size;
  let body: string | null = null;
  try {
    const visuals = visualsForQuestion(page) as Array<{ kind: string; lines?: Array<{ label: string; points: Pt[] }>; bars?: Array<{ label: string; value: number }> }>;
    for (const v of visuals) {
      body = v.kind === "line" && v.lines ? linesThumb(v.lines) : v.kind === "bar" && v.bars ? barsThumb(v.bars) : null;
      if (body) break;
    }
  } catch {
    body = null;
  }
  const svg = body ? `<svg viewBox="0 0 ${W} ${H}" role="presentation" aria-hidden="true" focusable="false">${body}</svg>` : null;
  cache.set(key, svg);
  return svg;
}

/** How many figures an article carries, for the meta line under a card. */
export function figureCount(page: QuestionPage) {
  try { return visualsForQuestion(page).length; } catch { return 0; }
}
