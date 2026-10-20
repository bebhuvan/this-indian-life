#!/usr/bin/env node
// Checks that every chart on every article renders its type near the size it was set at, at
// phone, tablet and desktop widths (src/data/artboards.ts explains the artboard ladder).
//
// An SVG with a viewBox scales its text with its box, so a drawing shown wider or narrower
// than it was drawn sets its labels larger or smaller than designed. This serves ./dist,
// opens each article at each width in headless Chrome, scrolls so every card picks its
// drawing, and reports per card the drawing's scale (shown width / drawn width) and its
// smallest rendered text. It fails when a drawing is shrunk below 0.95 or stretched past
// 1.25, or when any label renders under --min px (default 10.5).
//
//   npm run build
//   INDICA_CHROME=/usr/bin/google-chrome INDICA_PUPPETEER_DIR=<dir with puppeteer-core> \
//     node scripts/check-chart-type-scale.mjs [--article=<slug>] [--widths=360,768,1024,1440] [--min=10.5] [--jobs=1]
//
// Widths under 340 are reported but not failed: the phone drawing is set for a 360-wide
// phone's card, and a 320-wide phone shows it at 0.86.
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, extname, resolve } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const widths = String(args.widths ?? "360,768,1024,1440").split(",").map(Number);
const MIN_PX = Number(args.min ?? 10.5);
const SCALE = [0.95, 1.25];
const DIST = resolve("dist");

const chrome = process.env.INDICA_CHROME;
if (!chrome) {
  console.error("Set INDICA_CHROME to a Chrome binary (and INDICA_PUPPETEER_DIR to a directory with puppeteer-core).");
  process.exit(2);
}
const puppeteer = createRequire(process.env.INDICA_PUPPETEER_DIR ? join(process.env.INDICA_PUPPETEER_DIR, "noop.js") : import.meta.url)("puppeteer-core");

const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".csv": "text/csv" };
const server = createServer(async (req, res) => {
  let path = join(DIST, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try {
    if ((await stat(path)).isDirectory()) path = join(path, "index.html");
    res.writeHead(200, { "Content-Type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const slugs = args.article ? [args.article] : (await readdir(join(DIST, "articles"), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
// Background tabs throttle the observers that pick a drawing, so pages run one at a time unless
// --jobs says otherwise (a parallel run can leave cards unsettled; they are reported).
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"] });

async function measure(slug, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(`${origin}/articles/${slug}/`, { waitUntil: "networkidle0", timeout: 120000 });
  await page.evaluate(async () => {
    // In steps under a screen, two frames each, so the observer sees every card pass (a card
    // skipped over keeps its inline drawing until it is next on screen).
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await frame(); }
    // On a long page the observer can miss a card passed at this speed (a reader who stops on it
    // triggers it), so any card it missed is brought into view and given a moment.
    for (const card of document.querySelectorAll(".viz-card[data-rungs]:not([data-near])")) {
      card.scrollIntoView({ block: "center" });
      for (let i = 0; i < 10 && !card.dataset.near; i++) await frame();
    }
  });
  // Every card with rungs has chosen its drawing and, if that is a fetched rung, shows it.
  const unsettled = () => [...document.querySelectorAll(".viz-card[data-rungs]")].filter((c) => {
    const { show, want } = c.dataset;
    return !(show && want && want.startsWith(show) && (show !== "r" || c.querySelector(":scope > .viz-rung")?.dataset.w === want.slice(1)));
  }).map((c) => `${c.querySelector("h2")?.textContent?.trim().slice(0, 50)} (show ${c.dataset.show ?? "-"}, want ${c.dataset.want ?? "-"})`);
  await page.waitForFunction(`(${unsettled})().length === 0`, { timeout: 60000, polling: 200 })
    .catch(async () => console.warn(`   ${slug} at ${width}px: not settled after 60 s: ${(await page.evaluate(unsettled)).join("; ")}`));
  const rows = await page.evaluate(() => [...document.querySelectorAll(".viz-card")].flatMap((card) => {
    // Every drawing the card shows: the chart, and beside a map its ranked strip and dots.
    const svgs = [...card.querySelectorAll("svg")].filter((s) => !s.classList.contains("ic") && s.getBoundingClientRect().width > 0 && s.viewBox?.baseVal?.width > 100);
    return svgs.map((svg) => {
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const sizes = [...svg.querySelectorAll("text")].filter((t) => t.getBBox().width > 0 && getComputedStyle(t).display !== "none").map((t) => parseFloat(getComputedStyle(t).fontSize) * scale);
      // A map is scaled to its column by design; its labels are re-set for the shown size (fitMapLabels).
      const map = svg.classList.contains("choro-map");
      return { title: card.querySelector("h2")?.textContent?.trim() ?? card.id, part: map ? "map" : svg.classList.contains("viz-svg") ? "chart" : String(svg.getAttribute("class") ?? "svg"), drawn: svg.viewBox.baseVal.width, scale, scaled: !map && svg.classList.contains("viz-svg"), min: sizes.length ? Math.min(...sizes) : null };
    });
  }));
  await page.close();
  return rows;
}

let failures = 0;
for (const width of widths) {
  const strict = width >= 340;
  let charts = 0, lo = Infinity, hi = 0, minPx = Infinity;
  const bad = [];
  const queue = [...slugs];
  await Promise.all(Array.from({ length: Number(args.jobs ?? 1) }, async () => {
    for (let slug = queue.shift(); slug; slug = queue.shift()) {
      for (const r of await measure(slug, width)) {
        charts++;
        if (r.scaled) { lo = Math.min(lo, r.scale); hi = Math.max(hi, r.scale); }
        if (r.min != null) minPx = Math.min(minPx, r.min);
        if ((r.scaled && (r.scale < SCALE[0] || r.scale > SCALE[1])) || (r.min != null && r.min < MIN_PX)) bad.push({ slug, ...r });
      }
    }
  }));
  console.log(`${width}px: ${charts} drawings, scale ${lo.toFixed(2)}-${hi.toFixed(2)}, smallest text ${minPx.toFixed(1)}px, ${bad.length} outside the limits${strict ? "" : " (reported only)"}`);
  for (const b of bad.slice(0, 40)) console.log(`   ${b.slug} | ${b.title.slice(0, 60)} | ${b.part} drawn ${b.drawn} at ${b.scale.toFixed(2)}, smallest ${b.min?.toFixed(1) ?? "-"}px`);
  if (bad.length > 40) console.log(`   ... and ${bad.length - 40} more`);
  if (strict) failures += bad.length;
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
