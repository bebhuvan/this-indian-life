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
// and six layout rules, each counted as the figures (cards, pages) that break it:
//   1 one left edge     the title, subtitle, key and the figure's leftmost text or mark start
//                       on one x: a figure starting more than 6 px in, or a subtitle, key or
//                       title more than 2 px off it
//   2 plot uses width   line charts: right gutter no wider than the widest end label + 16 px,
//                       desktop left gutter no wider than the widest y label + 16 px, phone
//                       y gutter no wider than its widest label + 10 px, gridlines to the
//                       figure's edge; other figures reach the
//                       card's right edge within 24 px
//   3 even ticks        x ticks evenly spaced in time, the last on the last period when the
//                       data end on a step, no two labels within 10 px, no fractional years,
//                       financial-year data ticked as financial years
//   4 no demoted sides  in a chart of two or more series, no line under 1.5 px or 0.7 opacity
//                       that the card names (title or takeaway) or that is one side of a
//                       rural/urban, male/female or India-against-one comparison
//   5 text on marks     no phone text under 11 px; no label crossing a line or a dot
//   6 notes align       the figure's notes (.fig-more), its printed statistic and its footer
//                       start on the title's x
// Allowed exceptions (rules 1 and 2): centred pyramids, a map strip beside its map, the
// climate theme's padded cards and the library's samples. The audit lists them apart.
// Run after `npm run build`:
//   INDICA_CHROME=/usr/bin/google-chrome INDICA_PUPPETEER_DIR=<dir with puppeteer-core> \
//     node scripts/audit-charts.mjs [--pages=/articles/x/,/library/] [--json=out.json]
//     [--summary=counts.json] [--list] [--rule=edge|width|ticks|demoted|text|notes]
// Exits 1 when any overlap, spill, phone small text, phone ladder or phone gutter is found, or
// any rule counts above zero; desktop small text, ladders and gutters are reported.
// See docs/DESIGN_REFINEMENT_LOG.md rows 35, 61 and 76 on.
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

// Runs in the page: one record per visible chart SVG, one per card (its notes) and one per page
// (The Point). Each rule is a list of problems on its record; a record with a non-empty list counts.
function probe() {
  const out = [];
  const phone = innerWidth < 700;
  const visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  // Where an element's text starts: its glyphs, not its box (a takeaway's rule hangs in the margin).
  const textLeft = (el) => {
    if (!visible(el)) return null;
    const r = document.createRange(); r.selectNodeContents(el);
    const rs = [...r.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5);
    return rs.length ? Math.min(...rs.map((q) => q.left)) : null;
  };
  const words = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}%.\s-]/gu, " ");
  const named = (label, hay) => {
    const l = words(label).replace(/,? projected$/, "").trim();
    return l.length > 1 && new RegExp(`(^|[^\\p{L}])${l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u").test(hay);
  };
  const light = (c) => {
    const m = String(c || "").match(/^#([0-9a-f]{6})$/i) || String(c || "").match(/^#([0-9a-f]{3})$/i);
    if (!m) return false;
    const h = m[1].length === 3 ? m[1].split("").map((x) => x + x).join("") : m[1];
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (r + g + b) / 3 > 200;
  };
  const isText = (el) => el.tagName === "text" && el.textContent.trim() && el.getAttribute("fill") !== "none" && !el.closest("title") && el.getAttribute("opacity") !== "0" && !el.classList.contains("chart-watermark");
  // A data line's name: its <title>, or the tooltip the page's script promotes that title into.
  const seriesName = (el) => (el.querySelector("title")?.textContent ?? el.getAttribute("data-tip")?.replace("|", ": ") ?? "").replace(/, projected$/, "");
  const yearOf = (d) => Number(String(d).slice(0, 4));
  const fyDates = (ds) => ds.length > 1 && ds.every((d) => /^\d{4}-03-31$/.test(d) || /^\d{4}-\d{2}$/.test(d) && (yearOf(d) + 1) % 100 === Number(d.slice(5)));
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // A tick label as a time: years, financial years (by start year), "Jan 24" in months, "Jan" alone.
  const tickTime = (s) => {
    let m;
    if ((m = s.match(/^(\d{4})$/))) return { k: "y", t: +m[1] };
    if ((m = s.match(/^(\d{4})-(\d{2})$/)) && (+m[1] + 1) % 100 === +m[2]) return { k: "fy", t: +m[1] };
    if ((m = s.match(/^([A-Z][a-z]{2}) (\d{2})$/)) && MON.includes(m[1])) return { k: "m", t: (+m[2] < 50 ? 2000 + +m[2] : 1900 + +m[2]) * 12 + MON.indexOf(m[1]) };
    if (MON.includes(s)) return { k: "mo", t: MON.indexOf(s) };
    return { k: "c", t: NaN };
  };

  for (const card of [...document.querySelectorAll(".viz-card, .lib-item")].filter((c) => c.offsetParent)) {
    const title = card.querySelector("h2,h3")?.textContent.trim().slice(0, 70);
    const cr = card.getBoundingClientRect(), cs = getComputedStyle(card);
    const contentL = cr.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
    const contentR = cr.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
    const titleX = textLeft(card.querySelector("h2,h3")) ?? contentL;
    const climate = !!card.closest(".theme-climate-canonical"), lib = card.matches(".lib-item");
    // The title and the takeaway name a chart's sides. The subtitle lists what is plotted
    // ("India, Pakistan, Sri Lanka and Bangladesh") and names none (row 87).
    const hay = words([card.querySelector("h2,h3")?.textContent, card.querySelector(".fig-take, .cn-take")?.textContent].join(" "));
    const cardEx = lib ? "library sample" : climate ? "climate theme card" : "";

    // Rule 1 (HTML parts) and rule 6: one left edge for title, subtitle, legend and the note.
    const edgeHtml = [], notes = [];
    if (Math.abs(titleX - contentL) > 2) edgeHtml.push(`title@${Math.round(titleX - contentL)}`);
    for (const sel of [".viz-head p", ".viz-legend"]) {
      for (const el of card.querySelectorAll(sel)) {
        const x = textLeft(el);
        if (x != null && Math.abs(x - titleX) > 2) edgeHtml.push(`${sel}@${Math.round(x - titleX)}`);
      }
    }
    for (const sel of [".fig-more", ".alm-stat", ".viz-foot"]) {
      const x = textLeft(card.querySelector(sel));
      if (x != null && Math.abs(x - titleX) > 2) notes.push(`${sel}@${Math.round(x - titleX)}`);
    }
    out.push({ kind: "card", title, ex: cardEx, edgeHtml, notes });

    for (const s of card.querySelectorAll("svg")) {
      const sr = s.getBoundingClientRect();
      if (sr.width < 150 || getComputedStyle(s).display === "none" || s.closest(".viz-card, .lib-item") !== card) continue;
      const vb = s.viewBox.baseVal, scale = vb && vb.width ? sr.width / vb.width : 1;
      let minL = 1e9, maxR = -1e9;
      const texts = [], small = [], textEls = [];
      for (const el of s.querySelectorAll("path,line,rect,circle,text,polyline,polygon")) {
        if (el.getAttribute("fill") === "transparent" || el.getAttribute("fill-opacity") === "0" || el.closest("title")) continue;
        const br = el.getBoundingClientRect();
        if (!br.width && !br.height) continue;
        minL = Math.min(minL, br.left); maxR = Math.max(maxR, br.right);
        if (el.tagName === "text" && el.textContent.trim() && el.getAttribute("fill") !== "none") {
          const px = parseFloat(getComputedStyle(el).fontSize) * scale;
          if (px < 11) small.push(`${el.textContent.trim().slice(0, 16)}@${px.toFixed(1)}`);
          texts.push([br.left, br.top, br.right, br.bottom, el.textContent.trim().slice(0, 24)]);
          if (isText(el)) textEls.push(el);
        }
      }
      const overlaps = [];
      for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
        const A = texts[a], B = texts[b];
        if (Math.min(A[2], B[2]) - Math.max(A[0], B[0]) > 0.5 && Math.min(A[3], B[3]) - Math.max(A[1], B[1]) > 2) overlaps.push(`${A[4]} / ${B[4]}`);
      }
      const cls = s.getAttribute("class") || "";
      const rec = { kind: "fig", title, cls, scale: +scale.toFixed(3), spillL: Math.round(minL - cr.left), spillR: Math.round(cr.right - maxR), overlaps, small: [...new Set(small)] };

      // Rule 1: the figure's leftmost text or mark starts at the title's x.
      const besideMap = !!s.closest(".choro-wrap") && sr.left > contentL + cr.width * 0.3;
      rec.edgeEx = cardEx || (s.matches(".fig-pyramid") ? "centred pyramid" : besideMap ? "strip beside the map" : "");
      rec.edge = Math.round(minL - titleX);

      const isLine = s.matches("svg.alm-line");
      const wide = [], ticks = [], demoted = [], cross = [];
      if (isLine) {
        const dataPaths = [...s.querySelectorAll('path[fill="none"]')].filter((p) => seriesName(p));
        let plotR = -1e9, plotL = 1e9;
        for (const el of dataPaths) { const br = el.getBoundingClientRect(); if (br.width > 20) { plotR = Math.max(plotR, br.right); plotL = Math.min(plotL, br.left); } }
        const grids = [...s.querySelectorAll("line")].filter((l) => l.getAttribute("y1") === l.getAttribute("y2") && +l.getAttribute("x2") - +l.getAttribute("x1") > 60).map((l) => l.getBoundingClientRect());
        const gridL = Math.min(...grids.map((g) => g.left)), gridR = Math.max(...grids.map((g) => g.right));
        const ylabs = [...s.querySelectorAll("text.yaxt")].filter(isText).map((t) => t.getBoundingClientRect());
        const ends = [...s.querySelectorAll("text")].filter((t) => isText(t) && !t.matches(".xaxt,.yaxt")).map((t) => t.getBoundingClientRect()).filter((br) => br.width > 0 && br.left > plotR - 2);
        const edgeR = contentR;
        // Rule 2: the plot uses the width.
        const widest = ends.length ? Math.max(...ends.map((b) => b.width)) : 0;
        const rg = edgeR - plotR;
        // Compared in whole pixels, as reported.
        if (Math.round(rg) > Math.round(widest) + 16) wide.push(`right gutter ${Math.round(rg)} > label ${Math.round(widest)}+16`);
        if (!phone && ylabs.length) {
          const yw = Math.max(...ylabs.map((b) => b.width)), lg = gridL - contentL;
          if (lg > yw + 16) wide.push(`left gutter ${Math.round(lg)} > y label ${Math.round(yw)}+16`);
        }
        // Phones keep a y gutter as narrow as their labels (row 87): no wider than the widest label + 10.
        if (phone && ylabs.length) {
          const yw = Math.max(...ylabs.map((b) => b.width)), lg = gridL - contentL;
          if (lg > yw + 10) wide.push(`phone y gutter ${Math.round(lg)} > y label ${Math.round(yw)}+10`);
        }
        if (edgeR - gridR > 4) wide.push(`grid stops ${Math.round(edgeR - gridR)} short`);

        // Rule 3: even ticks.
        let hover = null; try { hover = JSON.parse(s.dataset.hover || "null"); } catch { hover = null; }
        const dates = hover ? hover.series.flatMap((se) => se.pts.map((p) => String(p[3]))) : [];
        const xt = [...s.querySelectorAll("text.xaxt")].filter(isText);
        const ctm = s.getScreenCTM();
        const tk = xt.map((t) => {
          const pt = s.createSVGPoint(); pt.x = +t.getAttribute("x"); pt.y = 0;
          return { label: t.textContent.trim(), x: pt.matrixTransform(ctm).x, br: t.getBoundingClientRect(), ...tickTime(t.textContent.trim()) };
        }).sort((a, b) => a.x - b.x);
        for (let i = 1; i < tk.length; i++) if (tk[i].br.left - tk[i - 1].br.right < 10) ticks.push(`tick gap ${tk[i - 1].label}|${tk[i].label} ${Math.round(tk[i].br.left - tk[i - 1].br.right)}px`);
        for (const t of tk) if (/\d\.\d/.test(t.label)) ticks.push(`fractional ${t.label}`);
        if (fyDates(dates) && tk.some((t) => t.k === "y")) ticks.push("FY data on calendar-year ticks");
        // A categorical axis (survey rounds placed by order) is spaced by position, not time.
        const pts0 = hover?.series?.[0]?.pts || [];
        const xs0 = pts0.map((p) => p[0]), dx0 = xs0.slice(1).map((x, i) => x - xs0[i]);
        const catAxis = pts0.length > 2 && dx0.every((d) => Math.abs(d - dx0[0]) < 0.2) && new Set(pts0.slice(1).map((p, i) => yearOf(p[3]) - yearOf(pts0[i][3]))).size > 1;
        const timed = tk.filter((t) => t.k !== "c");
        if (!catAxis && timed.length === tk.length && tk.length >= 3) {
          const dt = tk.slice(1).map((t, i) => t.t - tk[i].t), dpx = tk.slice(1).map((t, i) => t.x - tk[i].x);
          if (new Set(dt).size > 1) ticks.push(`uneven steps ${tk.map((t) => t.label).join(",")}`);
          else {
            const per = dpx.map((d, i) => d / dt[i]);
            if (Math.max(...per) - Math.min(...per) > Math.max(1, 0.02 * Math.max(...per))) ticks.push(`uneven spacing ${dpx.map((d) => Math.round(d)).join(",")}`);
          }
          // The last tick sits on the last period when the series ends on a round step.
          const step = dt[0], last = tk.at(-1);
          const lastDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : "";
          let lastT = NaN;
          if (last.k === "fy") lastT = /-03-31$/.test(lastDate) ? yearOf(lastDate) - 1 : yearOf(lastDate);
          else if (last.k === "y") lastT = yearOf(lastDate);
          else if (last.k === "m") lastT = yearOf(lastDate) * 12 + Number(lastDate.slice(5, 7)) - 1;
          if (step > 0 && Number.isFinite(lastT) && lastT > last.t && (lastT - tk[0].t) % step === 0) ticks.push(`last tick ${last.label}, data end on step at ${lastDate}`);
        }

        // Rule 4: no demoted comparison sides.
        const labels = [...new Set(dataPaths.map(seriesName))];
        const india2 = labels.length === 2 && labels.some((l) => /^india\b/i.test(l));
        // A single series has no sides to demote (its years may recede behind a trend).
        if (labels.length < 2) dataPaths.length = 0;
        for (const p of dataPaths) {
          const label = seriesName(p);
          const sw = parseFloat(p.getAttribute("stroke-width") || "1") * scale, op = parseFloat(p.getAttribute("stroke-opacity") || "1");
          if (sw >= 1.5 && op >= 0.7) continue;
          const side = /\b(rural|urban|male|female|men|women|boys|girls)\b/i.test(label) || india2 || named(label, hay);
          if (side) demoted.push(`${label} ${sw.toFixed(2)}px@${op}`);
        }
      }

      // Rule 5: no label crossing a line or a dot anywhere in the plot.
      const marks = [];
      for (const el of s.querySelectorAll("path, polyline, line")) {
        const fill = el.getAttribute("fill"), stroke = el.getAttribute("stroke");
        if (el.tagName !== "line" && fill && fill !== "none" && fill !== "transparent") continue;
        if (!stroke || stroke === "none" || light(stroke) || /^#fff/i.test(stroke)) continue;
        if (parseFloat(el.getAttribute("stroke-width") || "1") < 1) continue;
        if (el.tagName === "line" && (el.getAttribute("x1") === el.getAttribute("x2") || el.getAttribute("y1") === el.getAttribute("y2"))) continue;
        marks.push(el);
      }
      const samples = [];
      for (const el of marks) {
        const m = el.getScreenCTM(); if (!m) continue;
        const pt = s.createSVGPoint();
        if (el.tagName === "line") {
          const x1 = +el.getAttribute("x1"), y1 = +el.getAttribute("y1"), x2 = +el.getAttribute("x2"), y2 = +el.getAttribute("y2");
          const n = Math.min(2000, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * scale));
          for (let i = 0; i <= n; i++) { pt.x = x1 + ((x2 - x1) * i) / n; pt.y = y1 + ((y2 - y1) * i) / n; const q = pt.matrixTransform(m); samples.push([q.x, q.y]); }
        } else {
          let len = 0; try { len = el.getTotalLength(); } catch { continue; }
          const n = Math.min(6000, Math.ceil(len * scale / 1.2));
          for (let i = 0; i <= n; i++) { const p = el.getPointAtLength((len * i) / Math.max(1, n)); pt.x = p.x; pt.y = p.y; const q = pt.matrixTransform(m); samples.push([q.x, q.y]); }
        }
      }
      const dots = [...s.querySelectorAll("circle")].filter((c) => +c.getAttribute("r") * scale >= 2 && c.getAttribute("fill") !== "none").map((c) => c.getBoundingClientRect());
      for (const t of textEls) {
        const br = t.getBoundingClientRect();
        if (br.width < 2) continue;
        // The ink of the letters: the box less its side bearings and the space above and below the glyphs.
        const box = [br.left + 1, br.top + br.height * 0.22, br.right - 1, br.bottom - br.height * 0.22];
        const hit = samples.some(([x, y]) => x > box[0] && x < box[2] && y > box[1] && y < box[3]);
        const onDot = dots.some((d) => Math.min(d.right, box[2]) - Math.max(d.left, box[0]) > 1 && Math.min(d.bottom, box[3]) - Math.max(d.top, box[1]) > 1);
        if (hit || onDot) cross.push(`${t.matches(".yaxt") ? "y:" : t.matches(".xaxt") ? "x:" : ""}${t.textContent.trim().slice(0, 22)}${onDot ? " (dot)" : ""}`);
      }
      if (!isLine) {
        // Other figures: the drawing reaches the card's right edge.
        const dead = contentR - maxR;
        // (A centred pyramid's shorter side and the library's samples are the listed exceptions.)
        if (dead > 24 && sr.right > contentR - 30 && !rec.edgeEx) wide.push(`right edge ${Math.round(dead)} short`);
      }
      Object.assign(rec, { wide, ticks, demoted, cross });
      if (isLine || s.matches("svg.fig-load")) {
        let plotR = -1e9;
        for (const el of s.querySelectorAll('path[fill="none"]')) { const br = el.getBoundingClientRect(); if (br.width > 20) plotR = Math.max(plotR, br.right); }
        const ds = [...s.querySelectorAll("circle")].map((c) => c.getBoundingClientRect()).filter((br) => br.width > 0 && br.right > plotR - 30).map((br) => (br.top + br.bottom) / 2);
        const right = [...s.querySelectorAll("text")].filter((t) => t.textContent.trim() && t.getAttribute("fill") !== "none" && !t.matches(".xaxt,.yaxt"))
          .map((t) => ({ t: t.textContent.trim().slice(0, 30), br: t.getBoundingClientRect() })).filter((o) => o.br.width > 0 && o.br.left > plotR - 2);
        const edge = Math.min(cr.right, sr.right);
        const drift = right.map((o) => ({ t: o.t, d: Math.round(Math.min(...ds.map((y) => Math.abs(y - (o.br.top + o.br.bottom) / 2)))) }));
        rec.ladder = ds.length >= 2 ? drift.filter((l) => l.d > 18).map((l) => `${l.t}@${l.d}`) : [];
        rec.gutter = edge - plotR > 40 ? Math.max(0, Math.round(edge - (right.length ? Math.max(...right.map((o) => o.br.right)) : plotR)) - 24) : 0;
      }
      out.push(rec);
    }
  }
  // Rule 6: The Point stacks on phones, number above sentence, one left edge.
  const pull = [];
  for (const dp of document.querySelectorAll(".data-pull")) {
    if (!visible(dp) || !phone) continue;
    const num = dp.querySelector("span"), p = dp.querySelector("p:not(.lbl)");
    if (!visible(num) || !visible(p)) continue;
    const a = num.getBoundingClientRect(), b = p.getBoundingClientRect();
    if (b.top < a.bottom - 1) pull.push("side by side");
    const xa = textLeft(num), xb = textLeft(p);
    if (xa != null && xb != null && Math.abs(xa - xb) > 4) pull.push(`edges differ ${Math.round(xb - xa)}`);
  }
  out.push({ kind: "page", pull });
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

// Each rule counts the figures (or cards, or pages) with at least one problem. A figure on the
// list of allowed exceptions is reported apart and not counted.
const RULES = {
  edge: "1 one left edge",
  width: "2 plot uses the width",
  ticks: "3 even ticks",
  demoted: "4 no demoted sides",
  text: "5 text on marks",
  notes: "6 notes align",
};
const problems = (r, width) => {
  if (r.kind === "page") return { notes: r.pull };
  if (r.kind === "card") return { edge: r.ex ? [] : r.edgeHtml, notes: r.ex ? [] : r.notes };
  return {
    edge: !r.edgeEx && r.edge > 6 ? [`figure starts ${r.edge}px in`] : [],
    width: r.wide,
    ticks: r.ticks,
    demoted: r.demoted,
    text: [...(width < 700 ? r.small.map((x) => `small ${x}`) : []), ...r.cross.map((x) => `crosses ${x}`)],
  };
};
let failed = false;
const summary = {};
for (const width of [412, 1440]) {
  const all = results.filter((r) => r.width === width), rows = all.filter((r) => r.kind === "fig"), lines = rows.filter((r) => "gutter" in r);
  const counts = {
    figures: rows.length,
    overlaps: rows.filter((r) => r.overlaps.length).length,
    spills: rows.filter((r) => r.spillL < -1 || r.spillR < -1).length,
    small: rows.filter((r) => r.small.length).length,
    ladders: lines.filter((r) => r.ladder.length).length,
    gutters: lines.filter((r) => r.gutter > 0).length,
  };
  const rules = Object.fromEntries(Object.keys(RULES).map((k) => [k, all.filter((r) => problems(r, width)[k]?.length).length]));
  const excepted = rows.filter((r) => r.edgeEx && r.edge > 6).length;
  summary[width] = { ...counts, ...rules, excepted };
  console.log(`${width}px: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  rules: ${Object.entries(rules).map(([k, v]) => `${RULES[k]} ${v}`).join(", ")}; edge exceptions ${excepted}`);
  const hard = counts.overlaps + counts.spills + (width < 700 ? counts.small + counts.ladders + counts.gutters : 0) + Object.values(rules).reduce((a, b) => a + b, 0);
  if (hard) failed = true;
  const only = arg("rule");
  if (process.argv.includes("--list") || only) {
    for (const r of all) {
      const pr = problems(r, width);
      const why = only ? (pr[only] || []).map((x) => `${only}: ${x}`) : [r.overlaps?.length && `overlap ${r.overlaps.slice(0, 2).join("; ")}`, r.kind === "fig" && (r.spillL < -1 || r.spillR < -1) && `spill L${r.spillL} R${r.spillR}`,
        r.ladder?.length && `ladder ${r.ladder.slice(0, 3).join(" ")}`, r.gutter && `gutter +${r.gutter}px`,
        ...Object.entries(pr).filter(([, v]) => v?.length).map(([k, v]) => `${k}: ${v.slice(0, 3).join("; ")}`)].filter(Boolean);
      if (why.length) console.log(`  ${r.url} | ${r.title ?? ""} | ${why.slice(0, 4).join(" | ")}`);
    }
  }
}
if (arg("json")) writeFileSync(arg("json"), JSON.stringify(results, null, 1));
if (arg("summary")) writeFileSync(arg("summary"), JSON.stringify(summary, null, 1));
process.exit(failed ? 1 : 0);
