(() => {
  function downloadBlob(name, type, content) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeXml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function oneLine(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function textLines(value, maxChars, maxLines) {
    const words = oneLine(value).split(" ").filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    if (lines.length <= maxLines) return lines;
    return [...lines.slice(0, maxLines - 1), `${lines.slice(maxLines - 1).join(" ").slice(0, Math.max(0, maxChars - 1)).trim()}...`];
  }

  function svgFromText(svgText) {
    const template = document.createElement("template");
    template.innerHTML = String(svgText || "").trim();
    return template.content.querySelector("svg");
  }

  // Exported SVGs render off-DOM (in an <img> for PNG, or standalone), where the
  // browser does NOT load the site's web fonts, so shares would fall back to
  // Arial/Georgia. Inline the brand woff2 (variable Newsreader + Schibsted Grotesk,
  // with the latin-ext files that carry the ₹ sign) as base64 @font-face so every
  // shared chart renders in the real faces. Fetched on demand and cached.
  let _fontCssPromise = null;
  function embeddedFontCss() {
    if (_fontCssPromise) return _fontCssPromise;
    const faces = [
      { f: "Newsreader", w: "300 700", u: "/fonts/newsreader-latin.woff2" },
      { f: "Newsreader", w: "300 700", u: "/fonts/newsreader-latin-ext.woff2", r: "U+0100-02BA,U+20A0-20C0" },
      { f: "Schibsted Grotesk", w: "400 800", u: "/fonts/schibsted-grotesk-latin.woff2" },
      { f: "Schibsted Grotesk", w: "400 800", u: "/fonts/schibsted-grotesk-latin-ext.woff2", r: "U+0100-02BA,U+20A0-20C0" },
    ];
    _fontCssPromise = Promise.all(faces.map(async (face) => {
      try {
        const buf = await (await fetch(face.u)).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
        const b64 = btoa(bin);
        const range = face.r ? `;unicode-range:${face.r}` : "";
        return `@font-face{font-family:'${face.f}';font-weight:${face.w};font-style:normal;src:url(data:font/woff2;base64,${b64}) format('woff2')${range}}`;
      } catch (e) {
        return "";
      }
    })).then((parts) => parts.join(""));
    return _fontCssPromise;
  }

  // Replace every var(--x) with the value it has on this card, so the file carries
  // real colours (the series palette uses --c, --s2..--s6 and the named inks).
  function resolveVars(text, el) {
    const style = getComputedStyle(el);
    return text.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_, name, fallback) => oneLine(style.getPropertyValue(name)) || oneLine(fallback) || "#121212");
  }

  function chartMeta(card) {
    const title = oneLine(card.querySelector(".viz-head h2")?.textContent) || "Indica chart";
    const subtitle = oneLine(card.querySelector(".viz-head p")?.textContent);
    const unit = oneLine(card.querySelector(".viz-head > span, .viz-head .choro-unit")?.textContent);
    const source = oneLine(card.querySelector(".viz-source a, .viz-source b")?.textContent);
    return { title, subtitle, unit, source };
  }

  function parseViewBox(svg) {
    const raw = svg.getAttribute("viewBox");
    if (raw) {
      const parts = raw.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3], raw };
      }
    }
    const width = Number.parseFloat(svg.getAttribute("width") || "1000") || 1000;
    const height = Number.parseFloat(svg.getAttribute("height") || "560") || 560;
    return { minX: 0, minY: 0, width, height, raw: `0 0 ${width} ${height}` };
  }

  async function chartSvg(card, actions) {
    const inlineSvg = card.querySelector("svg.viz-d, svg.viz-svg, svg");
    if (inlineSvg) return inlineSvg.cloneNode(true);
    if (!actions?.dataset.svgUrl) return null;
    const svgText = await fetchText(actions.dataset.svgUrl);
    return svgFromText(svgText);
  }

  // The downloaded figure: a domain-colour rule, the finding as a Newsreader title,
  // the measure in the grotesque, the chart, then a ruled footer with the source on
  // the left and the site's name on the right. It must make sense on its own.
  function portableSvg(card, svg, fontCss = "") {
    const meta = chartMeta(card);
    const viewBox = parseViewBox(svg);
    // The chart keeps its own coordinate box and sits inside a margin of `pad`.
    const chartW = Math.round(viewBox.width);
    const height = Math.round(viewBox.height);
    const pad = Math.round(Math.max(28, chartW * 0.045));
    const width = chartW + 2 * pad;
    const titleSize = Math.round(Math.max(22, Math.min(34, width * 0.03)));
    const subSize = Math.round(titleSize * 0.5);
    const titleLines = textLines(meta.title, Math.max(26, Math.floor((width - 2 * pad) / (titleSize * 0.5))), 3);
    const subtitleLines = textLines(meta.subtitle, Math.max(36, Math.floor((width - 2 * pad) / (subSize * 0.55))), 2);
    const top = 6 + pad;
    const titleY = top + titleSize;
    const subY = titleY + (titleLines.length - 1) * titleSize * 1.15 + subSize * 2;
    const header = Math.round((meta.subtitle ? subY + (subtitleLines.length - 1) * subSize * 1.4 : titleY) + pad * 0.8);
    const footer = Math.round(pad * 2.2);
    const exportHeight = header + height + footer;
    const primary = oneLine(getComputedStyle(card).getPropertyValue("--c")) || "#121212";
    const source = meta.source ? `Source: ${meta.source}` : "";
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.removeAttribute("role");
    clone.removeAttribute("aria-label");
    clone.querySelectorAll("script, foreignObject").forEach((node) => { node.remove(); });
    const inner = resolveVars(clone.innerHTML, card);
    const titleText = titleLines.map((line, index) => `<tspan x="${pad}" dy="${index === 0 ? 0 : Math.round(titleSize * 1.15)}">${escapeXml(line)}</tspan>`).join("");
    const subtitleText = subtitleLines.map((line, index) => `<tspan x="${pad}" dy="${index === 0 ? 0 : Math.round(subSize * 1.4)}">${escapeXml(line)}</tspan>`).join("");
    const ruleY = header + height + Math.round(pad * 0.7);
    const footY = ruleY + Math.round(pad * 0.9);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${exportHeight}" width="${width}" height="${exportHeight}">
  <style>
    ${fontCss}
    text{font-family:"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif;font-variant-numeric:lining-nums}
    :where(text:not([fill])){fill:#8a8a8a}
    .serif,.export-title,.export-brand{font-family:"Newsreader",Georgia,serif}
    .export-title{font-size:${titleSize}px;font-weight:500;fill:#121212}
    .export-subtitle{font-size:${subSize}px;fill:#4f4f4f}
    .export-source{font-size:${Math.max(11, Math.round(subSize * 0.85))}px;fill:#4f4f4f}
    .export-brand{font-size:${Math.round(subSize * 1.3)}px;font-weight:500;fill:#121212}
    .yaxt,.xaxt,.end-s{font-size:14px;fill:#8a8a8a}
    .ref-label{font-size:14px;fill:#4f4f4f}
    .end-mini-v{font-size:15px;font-weight:600}
    .point-label{font-size:14px;font-weight:500;fill:#121212}
    .axis-title{font-size:14px;fill:#4f4f4f}
    .bar-value-label{font-size:11px;font-weight:500}
    .chart-watermark{display:none}
  </style>
  <rect width="${width}" height="${exportHeight}" fill="#ffffff"/>
  <rect width="${width}" height="6" fill="${primary}"/>
  <text class="export-title" x="${pad}" y="${titleY}">${titleText}</text>
  ${meta.subtitle ? `<text class="export-subtitle" x="${pad}" y="${Math.round(subY)}">${subtitleText}</text>` : ""}
  <svg x="${pad}" y="${header}" width="${chartW}" height="${height}" viewBox="${escapeXml(viewBox.raw)}" overflow="visible">${inner}</svg>
  <rect x="${pad}" y="${ruleY}" width="${width - 2 * pad}" height="1" fill="#dadada"/>
  ${source ? `<text class="export-source" x="${pad}" y="${footY}">${escapeXml(source)}</text>` : ""}
  <text class="export-brand" x="${width - pad}" y="${footY}" text-anchor="end">This Indian Life</text>
</svg>`;
    return xml;
  }

  async function downloadPng(file, svgText) {
    const svg = svgFromText(svgText);
    const viewBox = svg ? parseViewBox(svg) : { width: 1000, height: 560 };
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      const scale = Math.max(2, window.devicePixelRatio || 1);
      const loaded = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      img.src = url;
      await loaded;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewBox.width * scale);
      canvas.height = Math.round(viewBox.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
      if (pngBlob) downloadBlob(`${file}.png`, "image/png", pngBlob);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function fetchText(url) {
    const response = await fetch(url);
    return response.ok ? response.text() : "";
  }

  async function loadLazySvg(frame) {
    if (!frame?.dataset.lazySvg || frame.dataset.loaded) return;
    const svgText = await fetchText(frame.dataset.lazySvg);
    if (!svgText) return;
    const template = document.createElement("template");
    template.innerHTML = svgText.trim();
    const svg = template.content.querySelector("svg");
    if (!svg) return;
    frame.dataset.loaded = "true";
    frame.replaceWith(svg);
  }

  function initLazySvgs() {
    const frames = [...document.querySelectorAll("[data-lazy-svg]")];
    if (!frames.length) return;
    if (!("IntersectionObserver" in window)) {
      frames.forEach((frame) => { loadLazySvg(frame); });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        loadLazySvg(entry.target);
      });
    }, { rootMargin: "700px 0px" });
    frames.forEach((frame) => { observer.observe(frame); });
  }

  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("[data-viz-action]");
    if (!button) return;
    const card = button.closest(".viz-card");
    if (!card) return;
    const action = button.dataset.vizAction;
    const actions = card.querySelector(".viz-actions");
    const file = actions?.dataset.file || "indica-chart";

    if (action === "csv" && actions?.dataset.csvUrl) {
      const csv = await fetchText(actions.dataset.csvUrl);
      if (!csv) return;
      downloadBlob(`${file}.csv`, "text/csv;charset=utf-8", csv);
    }

    if (action === "svg" || action === "png") {
      const svg = await chartSvg(card, actions);
      if (!svg) return;
      const fontCss = await embeddedFontCss();
      const svgText = portableSvg(card, svg, fontCss);
      if (action === "svg") downloadBlob(`${file}.svg`, "image/svg+xml;charset=utf-8", svgText);
      if (action === "png") await downloadPng(file, svgText);
    }

    if (action === "share") {
      const anchor = actions?.id;
      const url = `${location.origin}${location.pathname}${anchor ? `#${anchor}` : ""}`;
      if (navigator.share) await navigator.share({ title: document.title, url });
      else await navigator.clipboard.writeText(url);
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Share"; }, 1400);
    }
  });

  // Crosshair for Almanac line charts. Each svg[data-hover] carries its series as
  // viewBox points; on pointer move we find each series' point nearest the cursor's x,
  // draw a hairline and dots, and show one small tooltip with the date and values.
  function initHover() {
    const NS = "http://www.w3.org/2000/svg";
    document.querySelectorAll("svg[data-hover]").forEach((svg) => {
      let data;
      try { data = JSON.parse(svg.getAttribute("data-hover")); } catch (e) { return; }
      if (!data?.series?.length) return;
      const card = svg.closest(".viz-card") || svg.parentElement;
      card.style.position = card.style.position || "relative";
      const layer = document.createElementNS(NS, "g");
      layer.setAttribute("class", "hov-layer");
      layer.style.display = "none";
      layer.style.pointerEvents = "none";
      const rule = document.createElementNS(NS, "line");
      rule.setAttribute("stroke", "#121212"); rule.setAttribute("stroke-width", "0.75"); rule.setAttribute("stroke-dasharray", "2 2");
      rule.setAttribute("y1", data.plot[1]); rule.setAttribute("y2", data.plot[3]);
      layer.append(rule);
      const dots = data.series.map((s) => {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("r", "4.5"); c.setAttribute("fill", s.color); c.setAttribute("stroke", "#fff"); c.setAttribute("stroke-width", "2");
        layer.append(c); return c;
      });
      svg.append(layer);
      const tip = document.createElement("div");
      tip.className = "hov-tip";
      tip.hidden = true;
      card.append(tip);
      const toLocal = (evt) => {
        const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
        const m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : null;
      };
      const nearest = (pts, x) => {
        let lo = 0, hi = pts.length - 1;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid][0] < x) lo = mid; else hi = mid; }
        return Math.abs(pts[lo][0] - x) <= Math.abs(pts[hi][0] - x) ? pts[lo] : pts[hi];
      };
      const hide = () => { layer.style.display = "none"; tip.hidden = true; };
      const move = (evt) => {
        const p = toLocal(evt);
        if (!p || p.x < data.plot[0] - 6 || p.x > data.plot[2] + 6) return hide();
        const hits = data.series.map((s) => nearest(s.pts, p.x));
        const lead = hits.reduce((a, b) => (Math.abs(b[0] - p.x) < Math.abs(a[0] - p.x) ? b : a));
        rule.setAttribute("x1", lead[0]); rule.setAttribute("x2", lead[0]);
        hits.forEach((h, i) => { const on = Math.abs(h[0] - lead[0]) < 1.5; dots[i].style.display = on ? "" : "none"; dots[i].setAttribute("cx", h[0]); dots[i].setAttribute("cy", h[1]); });
        layer.style.display = "";
        const rows = data.series.map((s, i) => (Math.abs(hits[i][0] - lead[0]) < 1.5 ? `<span><i style="background:${s.color}"></i>${data.series.length > 1 ? escapeXml(s.label) + " " : ""}<b>${escapeXml(hits[i][2])}</b></span>` : "")).join("");
        tip.innerHTML = `<em>${escapeXml(lead[3])}</em>${rows}`;
        tip.hidden = false;
        const box = card.getBoundingClientRect(), sb = svg.getBoundingClientRect();
        const scale = sb.width / svg.viewBox.baseVal.width;
        let left = sb.left - box.left + lead[0] * scale + 12, top = sb.top - box.top + Math.min(...hits.map((h) => h[1])) * scale - 10;
        if (left + tip.offsetWidth > box.width) left -= tip.offsetWidth + 24;
        tip.style.left = `${Math.max(0, left)}px`; tip.style.top = `${Math.max(0, top)}px`;
      };
      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerdown", move);
      svg.addEventListener("pointerleave", hide);
    });
  }

  const ready = () => { initLazySvgs(); initHover(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
