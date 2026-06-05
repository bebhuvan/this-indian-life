// SSR-SVG chart kit for the NFHS-6 hub. Designed for a layperson: every chart
// reads in one glance. Change = two labelled bars (then vs now). Geography =
// diverging colour anchored on the national average (amber worse / jade better)
// so the map is never a "sea of green". Every number is LOCKED (from nfhs6.mjs).

const INK = "#0b0b0b";
const MID = "#5c5c5c";
const DIM = "#a6a6a6";
const LINE = "#e9e9ec";
const TRACK = "#f3f3f5";
const OLD = "#b9c0c4"; // muted grey = the earlier survey
const JADE = "#159A82"; // better / good direction
const AMBER = "#D8894D"; // worse / concerning direction
const WORSE = "#C9553F";
const BETTER = "#159A82";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n1 = (v) => (v == null ? "—" : Number.isInteger(v) ? String(v) : v.toFixed(1));
const tw = (s, fs) => String(s).length * fs * 0.56;

function hx(c) { let m = c.replace("#", ""); if (m.length === 3) m = m.split("").map((x) => x + x).join(""); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); }
function mix(a, b, t) { const [ar, ag, ab] = hx(a), [br, bg, bb] = hx(b); return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`; }
const nice = (m) => (m <= 5 ? 5 : m <= 10 ? 10 : m <= 20 ? 20 : m <= 25 ? 25 : m <= 50 ? 50 : m <= 75 ? 75 : 100);
function svg(w, h, inner, cls = "") { return `<svg viewBox="0 0 ${w} ${Math.round(h)}" class="nf-svg ${cls}" role="img" preserveAspectRatio="xMidYMid meet">${inner}</svg>`; }

// Evenly spaced axis ticks 0..lim (n+1 of them).
const ticks = (lim, n = 4) => Array.from({ length: n + 1 }, (_, i) => +(lim * i / n).toFixed(2));
// Greedy word-wrap to <= maxLines, ellipsising the last line if it still overflows.
// Defends every chart against over-long indicator labels colliding with anything.
function wrapText(s, fs, maxW, maxLines = 2) {
  const words = String(s).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (tw(test, fs) > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  const clip = (l) => { let t = l; while (t.length && tw(t + "…", fs) > maxW) t = t.replace(/\s*\S$/, ""); return t + "…"; };
  if (lines.length > maxLines) { const kept = lines.slice(0, maxLines); kept[maxLines - 1] = clip(kept.slice(maxLines - 1).join(" ")); return kept; }
  return lines.map((l) => (tw(l, fs) > maxW ? clip(l) : l));
}

// Axis tick labels under a plot, with optional faint vertical gridlines.
// On track-bar charts we pass lines=false: the grey bar tracks already frame the
// scale, so gridlines just add clutter (the OWID look is tracks, no gridlines).
function gridX(sx, lim, yTop, yBot, unit, lines = true) {
  const p = [];
  for (const t of ticks(lim)) {
    const x = sx(t).toFixed(1);
    if (lines || t === 0) p.push(`<line x1="${x}" y1="${yTop}" x2="${x}" y2="${yBot}" class="${t === 0 ? "grid0" : "grid"}"/>`);
    p.push(`<text x="${x}" y="${yBot + 20}" class="ax" text-anchor="${t === 0 ? "start" : t === lim ? "end" : "middle"}">${Math.round(t)}${t === lim ? unit : ""}</text>`);
  }
  return p.join("");
}

// Diverging colour relative to a centre (the India value). `worseSide` says which
// direction is the concerning one: +1 high-is-bad, -1 high-is-good, 0 neutral.
function divColor(v, centre, maxDev, worseSide) {
  if (v == null) return "#fafafb";
  const d = (v - centre) / (maxDev || 1); // -1..1
  const mag = Math.min(1, Math.abs(d));
  if (worseSide === 0) return mix("#eaf6f2", JADE, 0.12 + mag * 0.88); // neutral: sequential jade
  const isWorse = worseSide > 0 ? v > centre : v < centre;
  return mix("#ffffff", isWorse ? AMBER : JADE, 0.12 + mag * 0.88);
}

// ===== CHANGE: two labelled bars, then (grey) vs now (jade) ==================
// rows: [{label, then, now}].  opts.worseSide drives the better/worse verdict.
export function barChange(rows, { max, unit = "%", worseSide = 1, signColor = false } = {}) {
  const W = 1000, x0 = 4, x1 = W - 70;         // bar plot; right strip holds outside values
  const LFS = 15, LINEH = 19, BH = 25, GAP = 7, CHIP = 150, labelMaxW = W - CHIP;
  const top = 50;
  const lim = max ?? nice(Math.max(...rows.flatMap((r) => [r.then, r.now]).filter((v) => v != null)) * 1.08);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  // lay rows out with wrapped labels; a 2-line label gets a taller row
  let yCur = top;
  const laid = rows.map((r) => {
    const lines = wrapText(r.label, LFS, labelMaxW, 2);
    const barsTop = lines.length === 2 ? 40 : 22;
    const rowH = barsTop + BH + GAP + BH + 16;
    const y = yCur; yCur += rowH;
    return { ...r, lines, barsTop, y };
  });
  const plotBot = yCur;
  const H = plotBot + 30;
  const p = [];
  p.push(gridX(sx, lim, top - 10, plotBot, unit, false));
  p.push(`<g><rect x="${x0}" y="8" width="26" height="13" rx="2" fill="${OLD}"/><text x="${x0 + 32}" y="19" class="lglab">2019-21 (NFHS-5)</text><rect x="${x0 + 186}" y="8" width="26" height="13" rx="2" fill="${JADE}"/><text x="${x0 + 218}" y="19" class="lglab">2023-24 (NFHS-6)</text></g>`);
  const bar = (v, y, fill, faint) => {
    if (v == null) return "";
    const end = sx(v), inside = end > x1 - tw(n1(v) + unit, 13.5) - 14;
    const valX = inside ? end - 10 : end + 9;
    return `<rect x="${x0}" y="${y}" width="${(x1 - x0).toFixed(1)}" height="${BH}" rx="3" fill="${TRACK}"/>` +
      `<rect x="${x0}" y="${y}" width="${Math.max(3, end - x0).toFixed(1)}" height="${BH}" rx="3" fill="${fill}"/>` +
      `<text x="${valX.toFixed(1)}" y="${y + BH - 7}" class="${inside ? "vIn" : "vOut"}" text-anchor="${inside ? "end" : "start"}" ${inside ? "" : `fill="${faint ? MID : INK}"`}>${n1(v)}${unit}</text>`;
  };
  laid.forEach((r) => {
    const nowC = signColor && r.then != null && r.now != null ? (r.now > r.then ? WORSE : BETTER) : JADE;
    r.lines.forEach((ln, li) => p.push(`<text x="${x0}" y="${r.y + 13 + li * LINEH}" class="rlab">${esc(ln)}</text>`));
    if (r.then != null && r.now != null) {
      const d = +(r.now - r.then).toFixed(1);
      const ws = r.ws != null ? r.ws : worseSide;
      const improved = ws === 0 ? null : (ws > 0 ? d < 0 : d > 0);
      const col = improved == null ? MID : improved ? BETTER : WORSE;
      const sign = d > 0 ? "+" : d < 0 ? "-" : "";
      p.push(`<text x="${W}" y="${r.y + 13}" class="dchip" text-anchor="end" fill="${col}">${sign}${Math.abs(d)} pts</text>`);
    }
    p.push(bar(r.then, r.y + r.barsTop, OLD, true));
    p.push(bar(r.now, r.y + r.barsTop + BH + GAP, nowC, false));
  });
  return svg(W, H, p.join(""), "change");
}

// MOBILE variant of barChange: a narrow (~360-unit) canvas that renders ~1:1 on a phone,
// so the same label fonts stay readable and the card fits the screen with NO horizontal
// scroll. Labels already sit above their bars here, so the layout is naturally portrait.
export function barChangeM(rows, { max, unit = "%", worseSide = 1, signColor = false } = {}) {
  const MW = 360, x0 = 2, x1 = MW - 2;
  const LFS = 14.8, LINEH = 18, BH = 21, GAP = 6;
  const top = 44;
  const lim = max ?? nice(Math.max(...rows.flatMap((r) => [r.then, r.now]).filter((v) => v != null)) * 1.08);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  let yCur = top;
  const laid = rows.map((r) => {
    const lines = wrapText(r.label, LFS, MW - 92, 2); // room for the delta chip on line 1
    const barsTop = lines.length * LINEH + 5;
    const rowH = barsTop + BH + GAP + BH + 16;
    const y = yCur; yCur += rowH;
    return { ...r, lines, barsTop, y };
  });
  const plotBot = yCur;
  const H = plotBot + 24;
  const p = [];
  p.push(gridX(sx, lim, top - 8, plotBot, unit, false));
  p.push(`<g><rect x="${x0}" y="8" width="20" height="11" rx="2" fill="${OLD}"/><text x="${x0 + 26}" y="17" class="lglab">2019-21</text><rect x="${x0 + 120}" y="8" width="20" height="11" rx="2" fill="${JADE}"/><text x="${x0 + 146}" y="17" class="lglab">2023-24</text></g>`);
  const bar = (v, y, fill, faint) => {
    if (v == null) return "";
    const end = sx(v), inside = end > x1 - tw(n1(v) + unit, 13.5) - 26;
    const valX = inside ? end - 8 : end + 7;
    return `<rect x="${x0}" y="${y}" width="${(x1 - x0).toFixed(1)}" height="${BH}" rx="3" fill="${TRACK}"/>` +
      `<rect x="${x0}" y="${y}" width="${Math.max(3, end - x0).toFixed(1)}" height="${BH}" rx="3" fill="${fill}"/>` +
      `<text x="${valX.toFixed(1)}" y="${y + BH - 6}" class="${inside ? "vIn" : "vOut"}" text-anchor="${inside ? "end" : "start"}" ${inside ? "" : `fill="${faint ? MID : INK}"`}>${n1(v)}${unit}</text>`;
  };
  laid.forEach((r) => {
    const nowC = signColor && r.then != null && r.now != null ? (r.now > r.then ? WORSE : BETTER) : JADE;
    r.lines.forEach((ln, li) => p.push(`<text x="${x0}" y="${r.y + 13 + li * LINEH}" class="rlab">${esc(ln)}</text>`));
    if (r.then != null && r.now != null) {
      const d = +(r.now - r.then).toFixed(1);
      const ws = r.ws != null ? r.ws : worseSide;
      const improved = ws === 0 ? null : (ws > 0 ? d < 0 : d > 0);
      const col = improved == null ? MID : improved ? BETTER : WORSE;
      const sign = d > 0 ? "+" : d < 0 ? "-" : "";
      p.push(`<text x="${x1}" y="${r.y + 13}" class="dchip" text-anchor="end" fill="${col}">${sign}${Math.abs(d)} pts</text>`);
    }
    p.push(bar(r.then, r.y + r.barsTop, OLD, true));
    p.push(bar(r.now, r.y + r.barsTop + BH + GAP, nowC, false));
  });
  return svg(MW, H, p.join(""), "change nf-m");
}

// ===== URBAN vs RURAL: two labelled bars + India marker =====================
export function splitGroup(rows, { max, unit = "%" } = {}) {
  const W = 1000, x0 = 4, rightPad = 128, x1 = W - rightPad;
  const top = 50, rowH = 96, BH = 25, GAP = 7;
  const lim = max ?? nice(Math.max(...rows.flatMap((r) => [r.urban, r.rural]).filter((v) => v != null)) * 1.08);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  const URB = JADE, RUR = mix(JADE, "#ffffff", 0.5);
  const plotBot = top + rows.length * rowH;
  const H = plotBot + 38;
  const p = [];
  p.push(gridX(sx, lim, top - 10, plotBot, unit, false));
  // legend
  p.push(`<g><rect x="${x0}" y="6" width="26" height="13" rx="2" fill="${URB}"/><text x="${x0 + 32}" y="17" class="lglab">Urban</text><rect x="${x0 + 104}" y="6" width="26" height="13" rx="2" fill="${RUR}"/><text x="${x0 + 136}" y="17" class="lglab">Rural</text></g>`);
  const bar = (v, y, fill) => {
    if (v == null) return "";
    const end = sx(v);
    return `<rect x="${x0}" y="${y}" width="${(x1 - x0).toFixed(1)}" height="${BH}" rx="3" fill="${TRACK}"/>` +
      `<rect x="${x0}" y="${y}" width="${Math.max(3, end - x0).toFixed(1)}" height="${BH}" rx="3" fill="${fill}"/>` +
      `<text x="${(end + 9).toFixed(1)}" y="${y + BH - 7}" class="vOut" text-anchor="start" fill="${INK}">${n1(v)}${unit}</text>`;
  };
  rows.forEach((r, i) => {
    const yTop = top + i * rowH;
    p.push(`<text x="${x0}" y="${yTop + 13}" class="rlab">${esc(r.label)}</text>`);
    const uY = yTop + 22, rY = yTop + 22 + BH + GAP;
    // India average lives in the header — a vertical marker collides with the
    // urban/rural value labels, so keep it out of the plot.
    if (r.total != null) p.push(`<text x="${W}" y="${yTop + 13}" class="indHdr" text-anchor="end">India avg ${n1(r.total)}${unit}</text>`);
    p.push(bar(r.urban, uY, URB));
    p.push(bar(r.rural, rY, RUR));
  });
  return svg(W, H, p.join(""), "split");
}

// ===== DIVERGING: two opposed quantities from a centre (the double burden) ===
export function diverging(groups, { leftLabel, rightLabel, leftColor = AMBER, rightColor = JADE, max, unit = "%" } = {}) {
  const W = 1000, top = 46, rowH = 84, cx = W / 2, half = W / 2 - 130, BH = 28;
  const lim = max ?? nice(Math.max(...groups.flatMap((g) => [g.left, g.right]).filter((v) => v != null)) * 1.1);
  const sx = (v) => (half * v) / lim;
  const plotBot = top + groups.length * rowH;
  const H = plotBot + 6;
  const p = [];
  p.push(`<text x="${cx - 14}" y="22" class="dvh" text-anchor="end" fill="${leftColor}">◀ ${esc(leftLabel)}</text>`);
  p.push(`<text x="${cx + 14}" y="22" class="dvh" text-anchor="start" fill="${rightColor}">${esc(rightLabel)} ▶</text>`);
  groups.forEach((g, i) => {
    const y = top + i * rowH + 36;
    p.push(`<text x="${cx}" y="${top + i * rowH + 14}" class="rlab" text-anchor="middle">${esc(g.label)}</text>`);
    p.push(`<line x1="${cx}" y1="${y - BH / 2 - 5}" x2="${cx}" y2="${y + BH / 2 + 5}" stroke="${DIM}" stroke-width="1.5"/>`);
    if (g.left != null) { p.push(`<rect x="${(cx - sx(g.left)).toFixed(1)}" y="${y - BH / 2}" width="${sx(g.left).toFixed(1)}" height="${BH}" rx="3" fill="${leftColor}"/>`); p.push(`<text x="${(cx - sx(g.left) - 11).toFixed(1)}" y="${y + 5}" class="vDiv" text-anchor="end" fill="${leftColor}">${n1(g.left)}${unit}</text>`); }
    if (g.right != null) { p.push(`<rect x="${cx}" y="${y - BH / 2}" width="${sx(g.right).toFixed(1)}" height="${BH}" rx="3" fill="${rightColor}"/>`); p.push(`<text x="${(cx + sx(g.right) + 11).toFixed(1)}" y="${y + 5}" class="vDiv" text-anchor="start" fill="${rightColor}">${n1(g.right)}${unit}</text>`); }
  });
  return svg(W, H, p.join(""), "diverging");
}

// ===== RANKED state league table (replaces the weak dot strip) ===============
// Every State/UT as a horizontal bar, sorted, coloured vs India, India marked.
export function rankedBars(map, { unit = "%", worseSide = 1 } = {}) {
  const W = 1000, gut = 210, x0 = gut, rightPad = 64, x1 = W - rightPad, top = 40, rowH = 24;
  const cells = map.cells.filter((c) => c.value != null).sort((a, b) => b.value - a.value);
  const lim = nice(map.max * 1.06);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  const centre = map.india ?? cells[Math.floor(cells.length / 2)].value;
  const maxDev = Math.max(...cells.map((c) => Math.abs(c.value - centre)));
  const plotBot = top + cells.length * rowH;
  const H = plotBot + 26;
  const p = [];
  // gridlines + axis behind the bars
  p.push(gridX(sx, lim, top - 8, plotBot, unit, false));
  // India reference line, emphasised, with a value pill clear of the bars
  if (map.india != null) {
    const ix = sx(map.india), iw = tw(`India ${n1(map.india)}${unit}`, 11.5) + 14;
    p.push(`<line x1="${ix.toFixed(1)}" y1="${top - 8}" x2="${ix.toFixed(1)}" y2="${plotBot}" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>`);
    p.push(`<rect x="${(ix - iw / 2).toFixed(1)}" y="${top - 26}" width="${iw.toFixed(1)}" height="17" rx="2" fill="${INK}"/><text x="${ix.toFixed(1)}" y="${top - 14}" class="indPill" text-anchor="middle">India ${n1(map.india)}${unit}</text>`);
  }
  cells.forEach((c, i) => {
    const y = top + i * rowH + 3, h = rowH - 7;
    const fill = divColor(c.value, centre, maxDev, worseSide);
    p.push(`<text x="${gut - 10}" y="${y + h - 2}" class="rkName" text-anchor="end">${esc(c.name || c.area)}</text>`);
    p.push(`<rect x="${x0}" y="${y}" width="${(x1 - x0).toFixed(1)}" height="${h}" rx="2" fill="${TRACK}"/>`);
    p.push(`<rect x="${x0}" y="${y}" width="${Math.max(2, sx(c.value) - x0).toFixed(1)}" height="${h}" rx="2" fill="${fill}" stroke="rgba(0,0,0,.06)"><title>${esc(c.area)}: ${n1(c.value)}${unit}</title></rect>`);
    p.push(`<text x="${(sx(c.value) + 7).toFixed(1)}" y="${y + h - 2}" class="rkVal">${n1(c.value)}${unit}</text>`);
  });
  return svg(W, H, p.join(""), "ranked");
}

// ===== TILE-GRID choropleth, diverging colour around the India average =======
export function tileMap(map, { unit = "%", rows = 7, cols = 10, worseSide = 1 } = {}) {
  const cell = 90, gap = 9, padX = 5, padTop = 8;
  const W = cols * (cell + gap) + padX * 2, legendH = 66;
  const H = rows * (cell + gap) + padTop + legendH;
  const centre = map.india ?? (map.min + map.max) / 2;
  const maxDev = Math.max(Math.abs(map.max - centre), Math.abs(map.min - centre)) || 1;
  const p = [];
  for (const d of map.cells) {
    const x = padX + d.c * (cell + gap), y = padTop + d.r * (cell + gap);
    const fill = divColor(d.value, centre, maxDev, worseSide);
    const dark = d.value != null && Math.abs((d.value - centre) / maxDev) > 0.5;
    p.push(`<g><rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${fill}" stroke="${d.value == null ? LINE : "rgba(0,0,0,.07)"}" ${d.value == null ? 'stroke-dasharray="2 2"' : ""}><title>${esc(d.area)}: ${d.value == null ? "suppressed" : n1(d.value) + unit}</title></rect>`);
    p.push(`<text x="${x + cell / 2}" y="${y + cell / 2}" class="tval" text-anchor="middle" fill="${dark ? "#fff" : INK}">${d.value == null ? "·" : n1(d.value)}</text>`);
    p.push(`<text x="${x + cell / 2}" y="${y + cell - 8}" class="tabbr" text-anchor="middle" fill="${dark ? "rgba(255,255,255,.92)" : MID}">${esc(d.abbr)}</text></g>`);
  }
  // diverging legend: worse <- India -> better (or sequential for neutral)
  const ly = padTop + rows * (cell + gap) + 18, lw = 300, lx = padX + 2, seg = 40;
  if (worseSide === 0) {
    const stops = [0, .5, 1].map((s) => `<stop offset="${s * 100}%" stop-color="${mix("#eaf6f2", JADE, 0.12 + s * 0.88)}"/>`).join("");
    p.push(`<defs><linearGradient id="rmp${map.num}">${stops}</linearGradient></defs><rect x="${lx}" y="${ly}" width="${lw}" height="13" rx="2" fill="url(#rmp${map.num})" stroke="rgba(0,0,0,.08)"/>`);
    p.push(`<text x="${lx}" y="${ly + 30}" class="ax">${n1(map.min)}${unit}</text><text x="${lx + lw}" y="${ly + 30}" class="ax" text-anchor="end">${n1(map.max)}${unit}</text>`);
  } else {
    const worseC = AMBER, betterC = JADE;
    p.push(`<rect x="${lx}" y="${ly}" width="${lw / 2}" height="13" fill="${mix("#fff", betterC, 0.85)}"/><rect x="${lx + lw / 2}" y="${ly}" width="${lw / 2}" height="13" fill="${mix("#fff", worseC, 0.85)}"/><rect x="${lx}" y="${ly}" width="${lw}" height="13" fill="none" stroke="rgba(0,0,0,.08)"/>`);
    p.push(`<line x1="${lx + lw / 2}" y1="${ly - 3}" x2="${lx + lw / 2}" y2="${ly + 16}" stroke="${INK}" stroke-width="1.5"/>`);
    p.push(`<text x="${lx}" y="${ly + 30}" class="ax" fill="${betterC}">◀ better than India</text>`);
    p.push(`<text x="${lx + lw / 2}" y="${ly + 30}" class="ind" text-anchor="middle">India ${n1(map.india)}${unit}</text>`);
    p.push(`<text x="${lx + lw}" y="${ly + 30}" class="ax" text-anchor="end" fill="${worseC}">worse ▶</text>`);
  }
  return svg(W, H, p.join(""), "tilemap");
}

// ===== STACKED bars: composition within a total (e.g. high vs very-high) =====
// rows: [{label, values:[..]}]  segLabels + colors describe the segments.
export function stackBars(rows, { segLabels = [], colors = [], max, unit = "%" } = {}) {
  const W = 1000, gut = 200, x0 = gut, rightPad = 66, x1 = W - rightPad;
  const top = 44, rowH = 52, BH = 28;
  const lim = max ?? nice(Math.max(...rows.map((r) => r.values.reduce((a, b) => a + (b || 0), 0))) * 1.08);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  const plotBot = top + rows.length * rowH;
  const H = plotBot + 30;
  const p = [];
  p.push(gridX(sx, lim, top - 8, plotBot, unit, false));
  // legend
  let lx = x0;
  segLabels.forEach((s, i) => { p.push(`<rect x="${lx}" y="8" width="22" height="12" rx="2" fill="${colors[i]}"/><text x="${lx + 28}" y="18" class="lglab">${esc(s)}</text>`); lx += 34 + tw(s, 11.5) + 18; });
  rows.forEach((r, i) => {
    const y = top + i * rowH + (rowH - BH) / 2;
    p.push(`<text x="${gut - 12}" y="${y + BH - 9}" class="rkName" text-anchor="end">${esc(r.label)}</text>`);
    p.push(`<rect x="${x0}" y="${y}" width="${(x1 - x0).toFixed(1)}" height="${BH}" rx="3" fill="${TRACK}"/>`);
    let cx = x0, tot = 0;
    r.values.forEach((v, s) => {
      if (v == null) return;
      const w = sx(v) - x0; tot += v;
      p.push(`<rect x="${cx.toFixed(1)}" y="${y}" width="${Math.max(1, w).toFixed(1)}" height="${BH}" rx="${s === 0 ? "3" : "0"}" fill="${colors[s]}"/>`);
      if (w > 30) p.push(`<text x="${(cx + w / 2).toFixed(1)}" y="${y + BH - 9}" class="vIn" text-anchor="middle">${n1(v)}</text>`);
      cx += w;
    });
    p.push(`<text x="${(cx + 8).toFixed(1)}" y="${y + BH - 9}" class="vOut" text-anchor="start" fill="${INK}">${n1(tot)}${unit}</text>`);
  });
  return svg(W, H, p.join(""), "stack");
}

// ===== SHARED MOBILE ROW RENDERER ============================================
// The row-style charts (stack/split/ranked/diverging/dumbbell/diststrip) all reduce to
// "a vertical list of indicators, each label above a full-width body of bar(s)+value(s)".
// This renders that on a narrow 360-unit canvas (≈1:1 on a phone) so nothing scrolls and the
// existing label fonts stay readable. Each kind passes a drawBody(row, geom) for its bars.
// geom = { x0, x1, sx, y (body top), BH }. `valRoom` reserves space at the right for an
// end-of-bar value; `rightTag` puts a small chip on the label line; `legend` draws a header.
function rowChartM(rows, { lim, cls, bodyH = 20, gap = 13, valRoom = 0, legend = null, rightTag = null }, drawBody) {
  const MW = 360, x0 = 2, x1 = MW - 4 - valRoom;
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  const top = legend ? 38 : 24;
  let yCur = top;
  const laid = rows.map((r) => {
    const reserve = rightTag ? tw(rightTag(r) || "", 12.4) + 12 : 0;
    const lines = wrapText(r.label, 13.5, MW - 4 - reserve, 2);
    const bodyTop = lines.length * 16 + 4;
    const y = yCur; yCur += bodyTop + bodyH + gap;
    return { ...r, lines, y, bodyTop };
  });
  const p = [];
  if (legend) p.push(legend(x0));
  laid.forEach((r) => {
    r.lines.forEach((ln, li) => p.push(`<text x="${x0}" y="${r.y + 11 + li * 16}" class="rkName">${esc(ln)}</text>`));
    if (rightTag) { const t = rightTag(r); if (t) p.push(`<text x="${x1 + valRoom}" y="${r.y + 11}" class="dchip" text-anchor="end" fill="${r.tagColor || MID}">${t}</text>`); }
    p.push(drawBody(r, { x0, x1, sx, y: r.y + r.bodyTop, BH: bodyH }));
  });
  return svg(MW, yCur + 2, p.join(""), cls + " nf-m");
}

// MOBILE: stacked composition bars (e.g. modern vs traditional methods).
export function stackBarsM(rows, { segLabels = [], colors = [], max, unit = "%" } = {}) {
  const maxTot = Math.max(...rows.map((r) => r.values.reduce((a, b) => a + (b || 0), 0)));
  const lim = Math.max(max ?? 0, nice(maxTot * 1.08)); // never let a total bar exceed the scale
  const legend = (x0) => {
    let lx = x0, s = "";
    segLabels.forEach((sl, i) => { s += `<rect x="${lx}" y="13" width="12" height="12" rx="2" fill="${colors[i]}"/><text x="${lx + 18}" y="23" class="lglab">${esc(sl)}</text>`; lx += 24 + tw(sl, 11.5) + 16; });
    return s;
  };
  return rowChartM(rows, { lim, cls: "stack", bodyH: 24, valRoom: 50, legend }, (r, g) => {
    let cx = g.x0, tot = 0;
    let s = `<rect x="${g.x0}" y="${g.y}" width="${(g.x1 - g.x0).toFixed(1)}" height="${g.BH}" rx="3" fill="${TRACK}"/>`;
    r.values.forEach((v, i) => {
      if (v == null) return;
      const w = g.sx(v) - g.x0; tot += v;
      s += `<rect x="${cx.toFixed(1)}" y="${g.y}" width="${Math.max(1, w).toFixed(1)}" height="${g.BH}" rx="${i === 0 ? "3" : "0"}" fill="${colors[i]}"/>`;
      if (w > 34) s += `<text x="${(cx + w / 2).toFixed(1)}" y="${g.y + g.BH - 7}" class="vIn" text-anchor="middle">${n1(v)}</text>`;
      cx += w;
    });
    s += `<text x="${(cx + 7).toFixed(1)}" y="${g.y + g.BH - 7}" class="vOut" text-anchor="start" fill="${INK}">${n1(tot)}${unit}</text>`;
    return s;
  });
}

// ===== MOVERS: what changed most — improvements right (jade), worse left ======
// items: [{label, delta, improved}]  delta = signed pp change (now - then).
export function moversChart(items, { unit = "%" } = {}) {
  const W = 1000, gut = 270, plotL = gut, plotR = W - 26, cx = (plotL + plotR) / 2, half = (plotR - plotL) / 2;
  const top = 42, rowH = 34, BH = 21;
  const sorted = [...items].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const maxMag = Math.max(...sorted.map((d) => Math.abs(d.delta))) || 1;
  const sx = (m) => (half * m) / maxMag;
  const plotBot = top + sorted.length * rowH;
  const H = plotBot + 12;
  const p = [];
  p.push(`<text x="${cx - 10}" y="20" class="dvh" text-anchor="end" fill="${WORSE}">◀ got worse</text>`);
  p.push(`<text x="${cx + 10}" y="20" class="dvh" text-anchor="start" fill="${BETTER}">got better ▶</text>`);
  p.push(`<line x1="${cx}" y1="${top - 8}" x2="${cx}" y2="${plotBot}" stroke="${DIM}" stroke-width="1.25"/>`);
  sorted.forEach((d, i) => {
    const y = top + i * rowH + (rowH - BH) / 2;
    const mag = sx(Math.abs(d.delta)), col = d.improved ? BETTER : WORSE;
    p.push(`<text x="${gut - 14}" y="${y + BH - 4}" class="rkName" text-anchor="end">${esc(d.label)}</text>`);
    if (d.improved) { p.push(`<rect x="${cx}" y="${y}" width="${mag.toFixed(1)}" height="${BH}" rx="2" fill="${col}"/>`); p.push(`<text x="${(cx + mag + 8).toFixed(1)}" y="${y + BH - 4}" class="vMov" fill="${col}">${Math.abs(d.delta)}</text>`); }
    else { p.push(`<rect x="${(cx - mag).toFixed(1)}" y="${y}" width="${mag.toFixed(1)}" height="${BH}" rx="2" fill="${col}"/>`); p.push(`<text x="${(cx - mag - 8).toFixed(1)}" y="${y + BH - 4}" class="vMov" text-anchor="end" fill="${col}">${Math.abs(d.delta)}</text>`); }
  });
  return svg(W, H, p.join(""), "movers");
}

// MOBILE movers: a ranked list (biggest change on top) via the shared row engine. Direction
// is shown two ways so it's unambiguous: a ▲/▼ arrow (the metric went up or down) and colour
// (jade = improved, amber = worsened). So "internet ▲ 31" reads good, "overweight ▲ 6.7" reads
// bad, "stunting ▼ 6.2" reads good — arrow = what happened, colour = whether that's good.
export function moversM(items, { unit = "%" } = {}) {
  const sorted = [...items].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const maxMag = Math.max(...sorted.map((d) => Math.abs(d.delta))) || 1;
  const legend = (x0) => `<rect x="${x0}" y="12" width="12" height="12" rx="2" fill="${BETTER}"/><text x="${x0 + 18}" y="22" class="lglab">improved</text><rect x="${x0 + 96}" y="12" width="12" height="12" rx="2" fill="${WORSE}"/><text x="${x0 + 114}" y="22" class="lglab">worsened</text>`;
  return rowChartM(sorted, { lim: maxMag, cls: "movers", bodyH: 17, valRoom: 56, legend }, (d, g) => {
    const w = Math.max(2, g.sx(Math.abs(d.delta)) - g.x0), col = d.improved ? BETTER : WORSE;
    const arrow = d.delta >= 0 ? "▲" : "▼";
    return `<rect x="${g.x0}" y="${g.y}" width="${w.toFixed(1)}" height="${g.BH}" rx="2" fill="${col}"/>` +
      `<text x="${(g.x0 + w + 7).toFixed(1)}" y="${g.y + g.BH - 3}" class="vMov" fill="${col}">${arrow} ${Math.abs(d.delta)}</text>`;
  });
}

// MOBILE ranked state list — used for map / ranked / dotstrip / diststrip (all state data).
// A compact "abbr · bar · value" row per State/UT, sorted, coloured vs the India average
// (amber worse / jade better), with the India reference marked. Replaces the tiny tile-map.
export function rankedBarsM(map, { unit = "%", worseSide = 1 } = {}) {
  const MW = 360, gut = 140, x0 = gut, x1 = MW - 44, top = 34, rowH = 20, BH = 14;
  // Full State/UT names (not cryptic abbreviations); ellipsis only the over-long UT names
  // that no phone gutter can fit.
  const clipLab = (s) => { let t = String(s); if (tw(t, 12.5) <= gut - 16) return t; while (t.length && tw(t + "…", 12.5) > gut - 16) t = t.slice(0, -1); return t.replace(/\s+$/, "") + "…"; };
  const cells = map.cells.filter((c) => c.value != null).sort((a, b) => b.value - a.value);
  const lim = nice(map.max * 1.06);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  const centre = map.india ?? cells[Math.floor(cells.length / 2)].value;
  const maxDev = Math.max(...cells.map((c) => Math.abs(c.value - centre))) || 1;
  const plotBot = top + cells.length * rowH;
  const H = plotBot + 8;
  const p = [];
  if (map.india != null) {
    const ix = sx(map.india);
    p.push(`<line x1="${ix.toFixed(1)}" y1="${top - 6}" x2="${ix.toFixed(1)}" y2="${plotBot}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="3 3"/>`);
    p.push(`<text x="${x0}" y="20" class="ind">India ${n1(map.india)}${unit}</text>`);
  }
  cells.forEach((c, i) => {
    const y = top + i * rowH;
    const fill = divColor(c.value, centre, maxDev, worseSide);
    p.push(`<text x="${gut - 10}" y="${y + BH - 2}" class="rkName" text-anchor="end">${esc(clipLab(c.name || c.area || c.abbr))}</text>`);
    p.push(`<rect x="${x0}" y="${y}" width="${(x1 - x0).toFixed(1)}" height="${BH}" rx="2" fill="${TRACK}"/>`);
    p.push(`<rect x="${x0}" y="${y}" width="${Math.max(2, sx(c.value) - x0).toFixed(1)}" height="${BH}" rx="2" fill="${fill}"><title>${esc(c.area)}: ${n1(c.value)}${unit}</title></rect>`);
    p.push(`<text x="${(sx(c.value) + 5).toFixed(1)}" y="${y + BH - 2}" class="rkVal">${n1(c.value)}</text>`);
  });
  return svg(MW, H, p.join(""), "ranked nf-m");
}

// MOBILE urban/rural split — two bars (urban, rural) per indicator with the India avg tagged.
export function splitGroupM(rows, { max, unit = "%" } = {}) {
  const lim = max ?? nice(Math.max(...rows.flatMap((r) => [r.urban, r.rural]).filter((v) => v != null)) * 1.08);
  const URB = JADE, RUR = mix(JADE, "#ffffff", 0.5);
  const legend = (x0) => `<rect x="${x0}" y="13" width="12" height="12" rx="2" fill="${URB}"/><text x="${x0 + 18}" y="23" class="lglab">Urban</text><rect x="${x0 + 74}" y="13" width="12" height="12" rx="2" fill="${RUR}"/><text x="${x0 + 92}" y="23" class="lglab">Rural</text>`;
  return rowChartM(rows, { lim, cls: "split", bodyH: 42, valRoom: 54, legend, rightTag: (r) => (r.total != null ? `India ${n1(r.total)}${unit}` : null) }, (r, g) => {
    const BH = 18, gap = 6;
    const bar = (v, yy, fill) => v == null ? "" : `<rect x="${g.x0}" y="${yy}" width="${(g.x1 - g.x0).toFixed(1)}" height="${BH}" rx="3" fill="${TRACK}"/><rect x="${g.x0}" y="${yy}" width="${Math.max(3, g.sx(v) - g.x0).toFixed(1)}" height="${BH}" rx="3" fill="${fill}"/><text x="${(g.sx(v) + 7).toFixed(1)}" y="${yy + BH - 5}" class="vOut" text-anchor="start" fill="${INK}">${n1(v)}${unit}</text>`;
    return bar(r.urban, g.y, URB) + bar(r.rural, g.y + BH + gap, RUR);
  });
}

// MOBILE diverging (e.g. the "double burden": underweight vs overweight). Per group: the label
// centred above a bar that diverges from the middle — left quantity one way, right the other —
// with values clear of the bars. `half` leaves room so wide values never overflow the canvas.
export function divergingM(groups, { leftLabel, rightLabel, leftColor = AMBER, rightColor = JADE, max, unit = "%" } = {}) {
  const MW = 360, cx = MW / 2, half = 120, top = 46, BH = 20, LINEH = 16;
  const lim = max ?? nice(Math.max(...groups.flatMap((g) => [g.left, g.right]).filter((v) => v != null)) * 1.1);
  const sx = (v) => (half * v) / lim;
  let yCur = top;
  const laid = groups.map((g) => { const lines = wrapText(g.label, 13.5, MW - 8, 1); const bodyTop = lines.length * LINEH + 4; const y = yCur; yCur += bodyTop + BH + 18; return { ...g, lines, y, bodyTop }; });
  const H = yCur + 2;
  const p = [];
  p.push(`<text x="${cx - 10}" y="22" class="dvh" text-anchor="end" fill="${leftColor}">◀ ${esc(leftLabel)}</text>`);
  p.push(`<text x="${cx + 10}" y="22" class="dvh" text-anchor="start" fill="${rightColor}">${esc(rightLabel)} ▶</text>`);
  laid.forEach((g) => {
    g.lines.forEach((ln, li) => p.push(`<text x="${cx}" y="${g.y + 11 + li * LINEH}" class="rkName" text-anchor="middle">${esc(ln)}</text>`));
    const by = g.y + g.bodyTop;
    p.push(`<line x1="${cx}" y1="${by - 3}" x2="${cx}" y2="${by + BH + 3}" stroke="${DIM}" stroke-width="1.2"/>`);
    if (g.left != null) { p.push(`<rect x="${(cx - sx(g.left)).toFixed(1)}" y="${by}" width="${sx(g.left).toFixed(1)}" height="${BH}" rx="3" fill="${leftColor}"/>`); p.push(`<text x="${(cx - sx(g.left) - 7).toFixed(1)}" y="${by + BH - 5}" class="vDiv" text-anchor="end" fill="${leftColor}">${n1(g.left)}${unit}</text>`); }
    if (g.right != null) { p.push(`<rect x="${cx}" y="${by}" width="${sx(g.right).toFixed(1)}" height="${BH}" rx="3" fill="${rightColor}"/>`); p.push(`<text x="${(cx + sx(g.right) + 7).toFixed(1)}" y="${by + BH - 5}" class="vDiv" text-anchor="start" fill="${rightColor}">${n1(g.right)}${unit}</text>`); }
  });
  return svg(MW, H, p.join(""), "diverging nf-m");
}

// ===== SLOPE: a slopegraph — every indicator's line from 2019-21 to 2023-24 ===
// rows: [{label, then, now, ws}].  Lines coloured by improvement (jade) / worse
// (red); flat = grey. Reads as "everything moved this way, at once".
export function slope(rows, { unit = "%", worseSide = 1 } = {}) {
  const data = rows.filter((r) => r.then != null && r.now != null);
  if (!data.length) return svg(900, 80, "", "slope");
  const W = 1000, xL = 340, xR = W - 156, top = 72, bot = 36;
  const vals = data.flatMap((r) => [r.then, r.now]);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const padv = (hi - lo) * 0.10 || 1;
  const dlo = lo - padv, dhi = hi + padv;
  const plotH = Math.max(230, data.length * 40);
  const H = top + plotH + bot;
  const sy = (v) => top + plotH - ((v - dlo) / (dhi - dlo)) * plotH;
  // De-collide labels: push apart to a minimum gap, then shift the whole stack
  // back inside the plot. Each label keeps a leader line to its true dot.
  const MIN_GAP = 25;
  const resolve = (key) => {
    const items = data.map((r, i) => ({ i, y: sy(r[key]) })).sort((a, b) => a.y - b.y);
    for (let k = 1; k < items.length; k++) if (items[k].y - items[k - 1].y < MIN_GAP) items[k].y = items[k - 1].y + MIN_GAP;
    const over = items[items.length - 1].y - (top + plotH);
    if (over > 0) for (const it of items) it.y -= over;
    const under = top - items[0].y;
    if (under > 0) for (const it of items) it.y += under;
    const out = {}; for (const it of items) out[it.i] = it.y; return out;
  };
  const lY = resolve("then"), rY = resolve("now");
  const p = [];
  p.push(`<text x="${xL}" y="${top - 34}" class="slpHdr" text-anchor="end">2019-21</text>`);
  p.push(`<text x="${xR}" y="${top - 34}" class="slpHdr" text-anchor="start">2023-24</text>`);
  p.push(`<line x1="${xL}" y1="${top - 18}" x2="${xL}" y2="${top + plotH + 12}" class="slpAxis"/>`);
  p.push(`<line x1="${xR}" y1="${top - 18}" x2="${xR}" y2="${top + plotH + 12}" class="slpAxis"/>`);
  data.forEach((r, i) => {
    const ws = r.ws != null ? r.ws : worseSide;
    const d = r.now - r.then;
    const improved = ws === 0 ? null : ws > 0 ? d < 0 : d > 0;
    const col = improved == null || Math.abs(d) < 0.05 ? DIM : improved ? BETTER : WORSE;
    const y1 = sy(r.then), y2 = sy(r.now), ly = lY[i], ry = rY[i];
    p.push(`<line x1="${xL}" y1="${y1.toFixed(1)}" x2="${xR}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="2.5" opacity="0.92"/>`);
    p.push(`<circle cx="${xL}" cy="${y1.toFixed(1)}" r="4.5" fill="${col}"/><circle cx="${xR}" cy="${y2.toFixed(1)}" r="4.5" fill="${col}"/>`);
    // left: name (far) + then-value (column hugging the axis), with a leader if nudged
    if (Math.abs(ly - 5 - y1) > 2) p.push(`<line x1="${xL - 9}" y1="${(ly - 5).toFixed(1)}" x2="${xL - 2}" y2="${y1.toFixed(1)}" class="slpLead"/>`);
    p.push(`<text x="${xL - 52}" y="${(ly).toFixed(1)}" class="slpName" text-anchor="end">${esc(r.label)}</text>`);
    p.push(`<text x="${xL - 14}" y="${(ly).toFixed(1)}" class="slpVal" text-anchor="end" fill="${col}">${n1(r.then)}${unit}</text>`);
    // right: now-value
    if (Math.abs(ry - 5 - y2) > 2) p.push(`<line x1="${xR + 2}" y1="${y2.toFixed(1)}" x2="${xR + 9}" y2="${(ry - 5).toFixed(1)}" class="slpLead"/>`);
    p.push(`<text x="${xR + 16}" y="${(ry).toFixed(1)}" class="slpVal" text-anchor="start" fill="${col}">${n1(r.now)}${unit}</text>`);
  });
  return svg(W, H, p.join(""), "slope");
}

// ===== DUMBBELL: one row per indicator, then-dot → now-dot ===================
// The clean way to show many indicators moving then→now without tangled lines.
// Sorted improvements-first; each row coloured by whether it got better/worse.
export function dumbbell(rows, { unit = "%", max, worseSide = 1 } = {}) {
  const data = rows.filter((r) => r.then != null && r.now != null);
  if (!data.length) return svg(900, 80, "", "dumbbell");
  const W = 1000, gut = 286, x0 = gut, rightPad = 74, x1 = W - rightPad, top = 50, rowH = 46, R = 6.5;
  const lim = max ?? nice(Math.max(...data.flatMap((r) => [r.then, r.now])) * 1.08);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  const scored = data.map((r) => {
    const d = +(r.now - r.then).toFixed(1);
    const ws = r.ws != null ? r.ws : worseSide;
    const improved = ws === 0 ? null : ws > 0 ? d < 0 : d > 0;
    return { ...r, d, improved };
  });
  scored.sort((a, b) => (a.improved === b.improved ? Math.abs(b.d) - Math.abs(a.d) : a.improved ? -1 : 1));
  const plotBot = top + scored.length * rowH;
  const H = plotBot + 30;
  const p = [];
  p.push(gridX(sx, lim, top - 10, plotBot, unit, false));
  p.push(`<g><circle cx="${x0 + 6}" cy="14" r="5.5" fill="${OLD}"/><text x="${x0 + 18}" y="18" class="lglab">2019-21</text><circle cx="${x0 + 122}" cy="14" r="5.5" fill="${JADE}"/><text x="${x0 + 134}" y="18" class="lglab">2023-24</text></g>`);
  scored.forEach((r, i) => {
    const y = top + i * rowH + rowH / 2;
    const col = r.improved == null ? MID : r.improved ? BETTER : WORSE;
    const xa = sx(r.then), xb = sx(r.now);
    p.push(`<rect x="${x0}" y="${(y - 12).toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="24" rx="2" fill="${TRACK}"/>`);
    p.push(`<text x="${gut - 16}" y="${(y + 4).toFixed(1)}" class="rlab" text-anchor="end">${esc(r.label)}</text>`);
    p.push(`<line x1="${xa.toFixed(1)}" y1="${y}" x2="${xb.toFixed(1)}" y2="${y}" stroke="${col}" stroke-width="3" opacity="0.55" stroke-linecap="round"/>`);
    p.push(`<circle cx="${xa.toFixed(1)}" cy="${y}" r="${R}" fill="${OLD}"/>`);
    p.push(`<circle cx="${xb.toFixed(1)}" cy="${y}" r="${R}" fill="${col}"/>`);
    // then-value outside its dot on the far side; now-value outside its dot on the far side
    if (xb >= xa) {
      p.push(`<text x="${(xa - 11).toFixed(1)}" y="${(y + 4).toFixed(1)}" class="vOut" text-anchor="end" fill="${MID}">${n1(r.then)}${unit}</text>`);
      p.push(`<text x="${(xb + 11).toFixed(1)}" y="${(y + 4).toFixed(1)}" class="vOut" text-anchor="start" fill="${col}">${n1(r.now)}${unit}</text>`);
    } else {
      p.push(`<text x="${(xb - 11).toFixed(1)}" y="${(y + 4).toFixed(1)}" class="vOut" text-anchor="end" fill="${col}">${n1(r.now)}${unit}</text>`);
      p.push(`<text x="${(xa + 11).toFixed(1)}" y="${(y + 4).toFixed(1)}" class="vOut" text-anchor="start" fill="${MID}">${n1(r.then)}${unit}</text>`);
    }
  });
  return svg(W, H, p.join(""), "dumbbell");
}

// ===== DISTRIBUTION STRIP: one dot per State/UT on a single axis ==============
// Shows the SPREAD between states around the India average. map = stateMap(num).
export function distStrip(map, { unit = "%", worseSide = 1 } = {}) {
  const cells = map.cells.filter((c) => c.value != null);
  if (!cells.length) return svg(900, 90, "", "diststrip");
  const W = 1000, x0 = 20, x1 = W - 20, top = 60, R = 7;
  const lim = nice(map.max * 1.06);
  const sx = (v) => x0 + (x1 - x0) * (v / lim);
  // Beeswarm: sort by value, then place each dot on the nearest free row
  // (0, +1, -1, +2, …) so dots at similar values stack instead of overlapping.
  const sorted = [...cells].sort((a, b) => a.value - b.value);
  const minDx = R * 2 + 1.5, rowsTry = [0];
  for (let m = 1; m < 9; m++) { rowsTry.push(m, -m); }
  const placed = [];
  for (const c of sorted) {
    const x = sx(c.value);
    let row = 0;
    for (const rr of rowsTry) { if (!placed.some((pd) => pd.row === rr && Math.abs(pd.x - x) < minDx)) { row = rr; break; } }
    placed.push({ ...c, x, row });
  }
  const maxRow = Math.max(1, ...placed.map((pd) => Math.abs(pd.row)));
  const lane = (maxRow * 2 + 1) * (R * 2 + 2);
  const midY = top + lane / 2;
  const H = top + lane + 52;
  const centre = map.india ?? (map.min + map.max) / 2;
  const maxDev = Math.max(Math.abs(map.max - centre), Math.abs(map.min - centre)) || 1;
  const p = [];
  p.push(gridX(sx, lim, top - 6, top + lane, unit));
  if (map.india != null) {
    const ix = sx(map.india);
    p.push(`<line x1="${ix.toFixed(1)}" y1="${top - 6}" x2="${ix.toFixed(1)}" y2="${top + lane}" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>`);
    const iw = tw(`India ${n1(map.india)}${unit}`, 11.5) + 14;
    p.push(`<rect x="${(ix - iw / 2).toFixed(1)}" y="${top - 26}" width="${iw.toFixed(1)}" height="17" rx="2" fill="${INK}"/><text x="${ix.toFixed(1)}" y="${top - 14}" class="indPill" text-anchor="middle">India ${n1(map.india)}${unit}</text>`);
  }
  for (const d of placed) {
    const cy = midY + d.row * (R * 2 + 2);
    const fill = divColor(d.value, centre, maxDev, worseSide);
    p.push(`<circle cx="${d.x.toFixed(1)}" cy="${cy.toFixed(1)}" r="${R}" fill="${fill}" stroke="rgba(0,0,0,.16)" stroke-width="1"><title>${esc(d.area)}: ${n1(d.value)}${unit}</title></circle>`);
  }
  const loC = sorted[0], hiC = sorted[sorted.length - 1];
  p.push(`<text x="${sx(loC.value).toFixed(1)}" y="${top + lane + 42}" class="rkName" text-anchor="middle">${esc(loC.name || loC.area)} ${n1(loC.value)}${unit}</text>`);
  p.push(`<text x="${sx(hiC.value).toFixed(1)}" y="${top + lane + 42}" class="rkName" text-anchor="middle">${esc(hiC.name || hiC.area)} ${n1(hiC.value)}${unit}</text>`);
  return svg(W, H, p.join(""), "diststrip");
}

// ===== SMALL MULTIPLES: a grid of tiny then→now cells ========================
// series: [{label, then, now, ws}].  One mini two-bar per cell, with a verdict.
export function smallMultiples(series, { unit = "%", max, cols = 3, worseSide = 1 } = {}) {
  const data = series.filter((r) => r.now != null);
  if (!data.length) return svg(1000, 60, "", "smallmult");
  const W = 1000, gap = 22, cellW = (W - gap * (cols - 1)) / cols;
  const rows = Math.ceil(data.length / cols);
  const top = 34;
  const cellH = 138, H = top + rows * cellH + (rows - 1) * gap;
  const lim = max ?? nice(Math.max(...data.flatMap((r) => [r.then, r.now]).filter((v) => v != null)) * 1.1);
  const labelPad = 62, plotW = cellW - labelPad; // reserve room so value labels never clip
  const p = [];
  p.push(`<g><rect x="0" y="4" width="24" height="12" rx="2" fill="${OLD}"/><text x="31" y="14" class="lglab">2019-21</text><rect x="116" y="4" width="24" height="12" rx="2" fill="${JADE}"/><text x="147" y="14" class="lglab">2023-24</text></g>`);
  data.forEach((r, i) => {
    const cx = (i % cols) * (cellW + gap), cy = top + Math.floor(i / cols) * (cellH + gap);
    const lines = wrapText(r.label, 13, cellW - 60, 2); // keep clear of the change chip
    lines.forEach((ln, li) => p.push(`<text x="${cx}" y="${cy + 14 + li * 16}" class="smName">${esc(ln)}</text>`));
    const bw = (v) => Math.max(2, plotW * (v / lim));
    const yT = cy + 60, yN = cy + 88, BH = 22;
    const ws = r.ws != null ? r.ws : worseSide;
    const drawBar = (v, y, fill, withUnit, faint) => {
      const end = bw(v), lab = `${n1(v)}${withUnit ? unit : ""}`;
      const inside = end > plotW - tw(lab, 13.5) - 6;
      const tx = inside ? cx + end - 7 : cx + end + 7;
      return `<rect x="${cx}" y="${y}" width="${cellW.toFixed(1)}" height="${BH}" rx="2" fill="${TRACK}"/>` +
        `<rect x="${cx}" y="${y}" width="${end.toFixed(1)}" height="${BH}" rx="2" fill="${fill}"/>` +
        `<text x="${tx.toFixed(1)}" y="${y + BH - 6}" class="${inside ? "vIn" : "smV"}" text-anchor="${inside ? "end" : "start"}"${inside ? "" : ` fill="${faint ? MID : INK}"`}>${lab}</text>`;
    };
    if (r.then != null) p.push(drawBar(r.then, yT, OLD, false, true));
    p.push(drawBar(r.now, yN, JADE, true, false));
    if (r.then != null) {
      const d = +(r.now - r.then).toFixed(1);
      const improved = ws === 0 ? null : ws > 0 ? d < 0 : d > 0;
      const col = improved == null ? MID : improved ? BETTER : WORSE;
      const sign = d > 0 ? "+" : d < 0 ? "-" : "";
      p.push(`<text x="${cx + cellW}" y="${cy + 14}" class="smChip" text-anchor="end" fill="${col}">${sign}${Math.abs(d)}</text>`);
    }
  });
  return svg(W, H, p.join(""), "smallmult");
}

// SVG <title> tooltip carrying an indicator definition (SSR-pure, no JS).
export const defTitle = (def) => (def ? `<title>${esc(def)}</title>` : "");

// alias kept for the spec
export const barRows = (rows, opts) => barChange(rows, opts);
export const dotStrip = (map, opts) => rankedBars(map, opts);
