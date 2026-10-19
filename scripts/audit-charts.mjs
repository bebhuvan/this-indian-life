#!/usr/bin/env node
// Layout audit for every chart on the built site, at a phone (412 px) and a desktop
// (1440 px) width. Serves dist/ to a headless Chrome and measures, per figure:
//   overlaps   text boxes that overlap other text
//   spills     drawing that runs past the card's left or right edge
//   small      text rendered under 11 px
//   ladders    (line charts) an end label more than 18 px from every line's end dot,
//              i.e. pushed into a stack away from the line it names
//   gutters    (line charts) more than 24 px empty between the widest end label and the
//              figure's right edge, while the plot stops more than 40 px short of it
// Run after `npm run build`:
//   INDICA_CHROME=/usr/bin/google-chrome INDICA_PUPPETEER_DIR=<dir with puppeteer-core> \
//     node scripts/audit-charts.mjs [--pages=/articles/x/,/library/] [--json=out.json] [--list]
// Exits 1 when any overlap, spill, phone small text, phone ladder or phone gutter is found;
// desktop ladders and gutters are reported. See docs/DESIGN_REFINEMENT_LOG.md rows 35 and 61.
import { createRequire } from "node:module";
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(root, "dist");
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
const chrome = process.env.INDICA_CHROME;
if (!chrome || !existsSync(DIST)) {
  console.error("Needs a built dist/ and INDICA_CHROME (and INDICA_PUPPETEER_DIR if puppeteer-core is not installed here).");
  process.exit(2);
}
const base = process.env.INDICA_PUPPETEER_DIR ? join(process.env.INDICA_PUPPETEER_DIR, "noop.js") : import.meta.url;
const puppeteer = createRequire(base)("puppeteer-core");
const pages = arg("pages")?.split(",") ?? [
  ...readdirSync(join(DIST, "articles"), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.endsWith(".md")).map((d) => `/articles/${d.name}/`),
  "/library/",
];
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json" };

// Runs in the page: one record per visible chart SVG.
function probe() {
  const out = [];
  for (const card of [...document.querySelectorAll(".viz-card, .lib-item")].filter((c) => c.offsetParent)) {
    const title = card.querySelector("h2,h3")?.textContent.trim().slice(0, 70);
    const cr = card.getBoundingClientRect();
    for (const s of card.querySelectorAll("svg")) {
      const sr = s.getBoundingClientRect();
      if (sr.width < 150 || getComputedStyle(s).display === "none" || s.closest(".viz-card, .lib-item") !== card) continue;
      const vb = s.viewBox.baseVal, scale = vb && vb.width ? sr.width / vb.width : 1;
      let minL = 1e9, maxR = -1e9;
      const texts = [], small = [];
      for (const el of s.querySelectorAll("path,line,rect,circle,text,polyline,polygon")) {
        if (el.getAttribute("fill") === "transparent" || el.getAttribute("fill-opacity") === "0" || el.closest("title")) continue;
        const br = el.getBoundingClientRect();
        if (!br.width && !br.height) continue;
        minL = Math.min(minL, br.left); maxR = Math.max(maxR, br.right);
        if (el.tagName === "text" && el.textContent.trim() && el.getAttribute("fill") !== "none") {
          const px = parseFloat(getComputedStyle(el).fontSize) * scale;
          if (px < 11) small.push(`${el.textContent.trim().slice(0, 16)}@${px.toFixed(1)}`);
          texts.push([br.left, br.top, br.right, br.bottom, el.textContent.trim().slice(0, 24)]);
        }
      }
      const overlaps = [];
      for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
        const A = texts[a], B = texts[b];
        if (Math.min(A[2], B[2]) - Math.max(A[0], B[0]) > 0.5 && Math.min(A[3], B[3]) - Math.max(A[1], B[1]) > 2) overlaps.push(`${A[4]} / ${B[4]}`);
      }
      const rec = { title, cls: s.getAttribute("class"), spillL: Math.round(minL - cr.left), spillR: Math.round(cr.right - maxR), overlaps, small: [...new Set(small)] };
      if (s.matches("svg.alm-line, svg.fig-load")) {
        let plotR = -1e9;
        for (const el of s.querySelectorAll('path[fill="none"]')) { const br = el.getBoundingClientRect(); if (br.width > 20) plotR = Math.max(plotR, br.right); }
        const dots = [...s.querySelectorAll("circle")].map((c) => c.getBoundingClientRect()).filter((br) => br.width > 0 && br.right > plotR - 30).map((br) => (br.top + br.bottom) / 2);
        const right = [...s.querySelectorAll("text")].filter((t) => t.textContent.trim() && t.getAttribute("fill") !== "none" && !t.matches(".xaxt,.yaxt"))
          .map((t) => ({ t: t.textContent.trim().slice(0, 30), br: t.getBoundingClientRect() })).filter((o) => o.br.width > 0 && o.br.left > plotR - 2);
        const edge = Math.min(cr.right, sr.right);
        const drift = right.map((o) => ({ t: o.t, d: Math.round(Math.min(...dots.map((y) => Math.abs(y - (o.br.top + o.br.bottom) / 2)))) }));
        rec.ladder = dots.length >= 2 ? drift.filter((l) => l.d > 18).map((l) => `${l.t}@${l.d}`) : [];
        rec.gutter = edge - plotR > 40 ? Math.max(0, Math.round(edge - (right.length ? Math.max(...right.map((o) => o.br.right)) : plotR)) - 24) : 0;
      }
      out.push(rec);
    }
  }
  return out;
}

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"], protocolTimeout: 300000 });
const results = [];
for (const width of [412, 1440]) {
  const queue = pages.slice();
  await Promise.all(Array.from({ length: 4 }, async () => {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, isMobile: width < 700, deviceScaleFactor: 1 });
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.host !== "dist.local") return req.abort();
      let f = join(DIST, decodeURIComponent(u.pathname));
      if (f.endsWith("/")) f += "index.html";
      if (!existsSync(f)) return req.respond({ status: 404, body: "" });
      req.respond({ status: 200, contentType: TYPES[extname(f)] || "application/octet-stream", body: readFileSync(f) });
    });
    for (let url; (url = queue.shift()); ) {
      await page.goto(`http://dist.local${url}`, { waitUntil: "networkidle0", timeout: 90000 }).catch(() => null);
      await page.evaluate(() => document.fonts.ready);
      for (const r of await page.evaluate(probe)) results.push({ width, url, ...r });
    }
    await page.close();
  }));
}
await browser.close();

let failed = false;
for (const width of [412, 1440]) {
  const rows = results.filter((r) => r.width === width), lines = rows.filter((r) => "gutter" in r);
  const counts = {
    figures: rows.length,
    overlaps: rows.filter((r) => r.overlaps.length).length,
    spills: rows.filter((r) => r.spillL < -1 || r.spillR < -1).length,
    small: rows.filter((r) => r.small.length).length,
    ladders: lines.filter((r) => r.ladder.length).length,
    gutters: lines.filter((r) => r.gutter > 0).length,
  };
  console.log(`${width}px: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  const hard = counts.overlaps + counts.spills + (width < 700 ? counts.small + counts.ladders + counts.gutters : 0);
  if (hard) failed = true;
  if (process.argv.includes("--list") || hard) {
    for (const r of rows) {
      const why = [r.overlaps.length && `overlap ${r.overlaps.slice(0, 2).join("; ")}`, (r.spillL < -1 || r.spillR < -1) && `spill L${r.spillL} R${r.spillR}`,
        r.small.length && `small ${r.small.slice(0, 3).join(" ")}`, r.ladder?.length && `ladder ${r.ladder.slice(0, 3).join(" ")}`, r.gutter && `gutter +${r.gutter}px`].filter(Boolean);
      if (why.length) console.log(`  ${r.url} | ${r.title} | ${why.join(" | ")}`);
    }
  }
}
if (arg("json")) writeFileSync(arg("json"), JSON.stringify(results, null, 1));
process.exit(failed ? 1 : 0);
