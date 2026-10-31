// Scene to SVG. The same string serves the page, the SVG download and the PNG export.
// On the page the chart has no chrome (the page sets the title); an export carries its
// title, dek, source and the site's name so it can travel on its own.

import type { Mark, Scene, TextMark } from "./types";
import { FONT, INK, sizes } from "./theme";
import { lineHeight, measure, wrap } from "./text";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n = (v: number) => String(Math.round(v * 100) / 100);

/** Distance from a line's vertical centre to its baseline, as a share of the font size. */
const CENTRE_TO_BASELINE = 0.36;

function textSvg(t: TextMark, size: number, ground: string): string {
  // Two voices: the grotesque measures, Literata comments (italic notes, display numbers).
  const face = t.role === "display" || t.role === "note" ? FONT.display : FONT.sans;
  const weight = t.role === "display" ? 500 : t.bold || t.role === "figure" ? 600 : 400;
  const italic = t.role === "note" ? ` font-style="italic"` : "";
  const fill = t.color ?? (t.role === "axis" ? INK.ink3 : t.role === "note" ? INK.ink2 : INK.ink);
  const halo = t.halo ? ` stroke="${ground}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"` : "";
  return `<text x="${n(t.x)}" y="${n(t.y + size * CENTRE_TO_BASELINE)}" text-anchor="${t.anchor}" font-family="${esc(face)}" font-size="${size}" font-weight="${weight}"${italic} fill="${fill}"${halo} style="font-variant-numeric:proportional-nums lining-nums">${esc(t.text)}</text>`;
}

function markSvg(m: Mark, z: ReturnType<typeof sizes>, ground: string): string {
  switch (m.kind) {
    case "rect":
      return `<rect x="${n(m.x)}" y="${n(m.y)}" width="${n(Math.max(0, m.w))}" height="${n(Math.max(0, m.h))}" fill="${m.fill}"${m.opacity != null ? ` fill-opacity="${m.opacity}"` : ""}/>`;
    case "line":
      return `<line x1="${n(m.x1)}" y1="${n(m.y1)}" x2="${n(m.x2)}" y2="${n(m.y2)}" stroke="${m.stroke}" stroke-width="${m.width}"${m.dash ? ` stroke-dasharray="${m.dash}"` : ""} stroke-linecap="${m.cap ?? "butt"}"/>`;
    case "path":
      return `<path d="${m.d}" fill="${m.fill ?? "none"}"${m.stroke ? ` stroke="${m.stroke}" stroke-width="${m.width ?? 1}" stroke-linecap="round" stroke-linejoin="${m.join ?? "round"}"` : ""}${m.dash ? ` stroke-dasharray="${m.dash}"` : ""}${m.opacity != null ? ` opacity="${m.opacity}"` : ""}/>`;
    case "circle":
      return `<circle cx="${n(m.cx)}" cy="${n(m.cy)}" r="${n(m.r)}" fill="${m.fill ?? "none"}"${m.stroke ? ` stroke="${m.stroke}" stroke-width="${m.width ?? 1}"` : ""}/>`;
    case "text":
      return textSvg(m, z[m.role], ground);
  }
}

/**
 * The site's credit on an exported chart: the double-rule mark, then the name set as a
 * wordmark, "thisindianlife" in Literata semibold and ".today" in the italic margin voice.
 * `y` is the text baseline; `anchor` places the whole mark at x.
 */
function wordmark(x: number, y: number, anchor: "start" | "end", site: string): string {
  const dot = site.lastIndexOf(".");
  const head = dot > 0 ? site.slice(0, dot) : site, tail = dot > 0 ? site.slice(dot) : "";
  const size = 13;
  const markW = 14, gap = 7;
  const w = markW + gap + measure(head, size, true, "display") + measure(tail, size, false, "display");
  const x0 = anchor === "end" ? x - w : x;
  const ty = n(x0 + markW + gap);
  return (
    `<line x1="${n(x0)}" y1="${n(y - 7.5)}" x2="${n(x0 + markW)}" y2="${n(y - 7.5)}" stroke="${INK.ink}" stroke-width="1"/>` +
    `<line x1="${n(x0)}" y1="${n(y - 4)}" x2="${n(x0 + markW)}" y2="${n(y - 4)}" stroke="${INK.ink}" stroke-width="2"/>` +
    `<text x="${ty}" y="${n(y)}" font-family="${esc(FONT.display)}" font-size="${size}" fill="${INK.ink}">` +
    `<tspan font-weight="600">${esc(head)}</tspan><tspan font-style="italic" fill="${INK.ink2}">${esc(tail)}</tspan></text>`
  );
}

export interface Chrome {
  title: string;
  dek?: string;
  source?: string;
  site?: string;
}

export interface RenderOpts {
  /** Background colour; halos use it too. */
  ground?: string;
  /** Add title, dek and source for a standalone export. */
  chrome?: Chrome;
}

export function renderSvg(scene: Scene, opts: RenderOpts = {}): string {
  const ground = opts.ground ?? INK.ground;
  const z = sizes(scene.width);
  const body = scene.marks.map((m) => markSvg(m, z, ground)).join("");
  if (!opts.chrome) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(scene.width)} ${n(scene.height)}" width="${n(scene.width)}" height="${n(scene.height)}" role="img" aria-label="${esc(scene.alt)}" style="overflow:visible">${body}</svg>`;
  }

  const c = opts.chrome;
  const pad = z.cls === "s" ? 18 : 28;
  const W = scene.width + pad * 2;
  const tSize = z.cls === "s" ? 20 : 26;
  const dSize = z.cls === "s" ? 13 : 14.5;
  const titleLines = wrap(c.title, tSize, scene.width, true);
  const dekLines = c.dek ? wrap(c.dek, dSize, scene.width) : [];
  // The double rule: a hairline above a 2 px line, the site's one ornament.
  const head: string[] = [
    `<line x1="${pad}" y1="${pad + 0.5}" x2="${n(W - pad)}" y2="${pad + 0.5}" stroke="${INK.ink}" stroke-width="1"/>`,
    `<line x1="${pad}" y1="${pad + 4}" x2="${n(W - pad)}" y2="${pad + 4}" stroke="${INK.ink}" stroke-width="2"/>`,
  ];
  let y = pad + 14;
  for (const l of titleLines) {
    y += lineHeight(tSize);
    head.push(`<text x="${pad}" y="${n(y - tSize * 0.22)}" font-family="${esc(FONT.display)}" font-size="${tSize}" font-weight="600" fill="${INK.ink}">${esc(l)}</text>`);
  }
  if (dekLines.length) y += 6;
  for (const l of dekLines) {
    y += lineHeight(dSize) + 2;
    head.push(`<text x="${pad}" y="${n(y - dSize * 0.25)}" font-family="${esc(FONT.sans)}" font-size="${dSize}" fill="${INK.ink2}">${esc(l)}</text>`);
  }
  y += 22;
  const chartY = y;
  y += scene.height + 22;
  // Source on the left, the site on the right; on a narrow export they take a line each.
  const site = c.site ?? "thisindianlife.today";
  const srcLines = c.source ? wrap("Source: " + c.source, 11.5, scene.width) : [];
  const sideBySide = z.cls !== "s" && srcLines.length <= 1 && measure(srcLines[0] ?? "", 11.5) + measure(site, 11.5, true) + 24 <= scene.width;
  let fy = y + 20;
  let foot = `<line x1="${pad}" y1="${n(y)}" x2="${n(W - pad)}" y2="${n(y)}" stroke="${INK.rule}" stroke-width="1"/>`;
  srcLines.forEach((l, k) => {
    foot += `<text x="${pad}" y="${n(fy + k * 16)}" font-family="${esc(FONT.sans)}" font-size="11.5" fill="${INK.ink3}">${esc(l)}</text>`;
  });
  if (!sideBySide) fy += srcLines.length * 16 + 4;
  foot += wordmark(sideBySide ? W - pad : pad, fy, sideBySide ? "end" : "start", site);
  const H = fy + pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(W)} ${n(H)}" width="${n(W)}" height="${n(H)}" role="img" aria-label="${esc(c.title + ". " + scene.alt)}"><rect width="100%" height="100%" fill="${ground}"/>${head.join("")}<g transform="translate(${pad} ${n(chartY)})">${body}</g>${foot}</svg>`;
}
