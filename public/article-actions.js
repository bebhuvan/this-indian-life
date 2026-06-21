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
  // browser does NOT load the site's web fonts — so shares would fall back to
  // Arial/Georgia. Inline the brand woff2 as base64 @font-face so every shared
  // chart renders in real Cormorant + DM Sans (+ the ₹ glyph). Fetched on demand
  // and cached, so the script itself stays light.
  let _fontCssPromise = null;
  function embeddedFontCss() {
    if (_fontCssPromise) return _fontCssPromise;
    const faces = [
      { f: "Cormorant Garamond", w: 400, s: "normal", u: "/fonts/cormorant-garamond-400.woff2" },
      { f: "Cormorant Garamond", w: 500, s: "normal", u: "/fonts/cormorant-garamond-500.woff2" },
      { f: "DM Sans", w: 400, s: "normal", u: "/fonts/dm-sans-400.woff2" },
      { f: "DM Sans", w: 500, s: "normal", u: "/fonts/dm-sans-500.woff2" },
      { f: "RupeeSerif", w: 400, s: "normal", u: "/fonts/rupee-serif.woff2", r: "U+20B9" },
      { f: "RupeeSans", w: 400, s: "normal", u: "/fonts/rupee-sans.woff2", r: "U+20B9" },
    ];
    _fontCssPromise = Promise.all(faces.map(async (face) => {
      try {
        const buf = await (await fetch(face.u)).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
        const b64 = btoa(bin);
        const range = face.r ? `;unicode-range:${face.r}` : "";
        return `@font-face{font-family:'${face.f}';font-weight:${face.w};font-style:${face.s};src:url(data:font/woff2;base64,${b64}) format('woff2')${range}}`;
      } catch (e) {
        return "";
      }
    })).then((parts) => parts.join(""));
    return _fontCssPromise;
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

  function portableSvg(card, svg, fontCss = "") {
    const meta = chartMeta(card);
    const viewBox = parseViewBox(svg);
    const width = Math.round(viewBox.width);
    const height = Math.round(viewBox.height);
    const header = meta.subtitle ? 104 : 78;
    const footer = 60;
    const exportHeight = height + header + footer;
    const primary = oneLine(getComputedStyle(card).getPropertyValue("--c")) || "#3f5fd6";
    const tint = oneLine(getComputedStyle(card).getPropertyValue("--c-tint")) || "rgba(63,95,214,0.12)";
    const titleLines = textLines(meta.title, Math.max(26, Math.floor((width - 140) / 15)), 2);
    const subtitleLines = textLines(meta.subtitle, Math.max(36, Math.floor((width - 60) / 7.2)), 2);
    const source = meta.source ? `Source: ${meta.source}` : "";
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.removeAttribute("role");
    clone.removeAttribute("aria-label");
    clone.querySelectorAll("script, foreignObject").forEach((node) => { node.remove(); });
    const inner = clone.innerHTML
      .replace(/var\(--c-tint\)/g, tint)
      .replace(/var\(--c\)/g, primary);
    const titleY = titleLines.length > 1 ? 33 : 45;
    const titleText = titleLines.map((line, index) => (
      `<tspan x="28" dy="${index === 0 ? 0 : 25}">${escapeXml(line)}</tspan>`
    )).join("");
    const subtitleStart = titleY + (titleLines.length > 1 ? 35 : 27);
    const subtitleText = subtitleLines.map((line, index) => (
      `<tspan x="28" dy="${index === 0 ? 0 : 17}">${escapeXml(line)}</tspan>`
    )).join("");
    const unitText = meta.unit
      ? `<text class="export-unit" x="${width - 28}" y="38" text-anchor="end">${escapeXml(meta.unit)}</text>`
      : "";
    const sourceText = source
      ? `<text class="export-source" x="28" y="${exportHeight - 20}">${escapeXml(source)}</text>`
      : "";
    // Quiet editorial footer: a short domain-accent rule, source on the left, the
    // wordmark + URL on the right. Replaces the faint corner watermark.
    const accentRule = `<rect x="28" y="${header + height + 20}" width="44" height="2" fill="${primary}"/>`;
    const brandText = `<text class="export-brand" x="${width - 28}" y="${exportHeight - 20}" text-anchor="end">THIS INDIAN LIFE · thisindianlife.today</text>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${exportHeight}" width="${width}" height="${exportHeight}">
  <style>
    ${fontCss}
    text{font-family:"RupeeSans","DM Sans",Arial,sans-serif;fill:#6f6f6f;font-variant-numeric:lining-nums tabular-nums}
    .serif,.export-title{font-family:"RupeeSerif","Cormorant Garamond",Georgia,serif}
    .export-title{font-size:27px;font-weight:500;fill:#18110d}
    .export-subtitle{font-size:13px;fill:#686868}
    .export-unit{font-size:11px;letter-spacing:2px;text-transform:uppercase;fill:#8a8580}
    .export-source{font-size:10px;letter-spacing:.6px;text-transform:uppercase;fill:#9a958f}
    .export-brand{font-size:10px;letter-spacing:1.2px;fill:#8a8580}
    .yaxt,.xaxt{font-size:17px;fill:#737373}
    .ref-label,.scatter-zone{font-size:12px;letter-spacing:1.1px;text-transform:uppercase;fill:#8a8580}
    .end-mini-v,.bar-value-label{font-family:"RupeeSerif","Cormorant Garamond",Georgia,serif;font-size:17px;font-weight:500}
    .chart-watermark{display:none}
  </style>
  <rect width="${width}" height="${exportHeight}" fill="#fff"/>
  <text class="export-title" x="28" y="${titleY}">${titleText}</text>
  ${meta.subtitle ? `<text class="export-subtitle" x="28" y="${subtitleStart}">${subtitleText}</text>` : ""}
  ${unitText}
  <svg x="0" y="${header}" width="${width}" height="${height}" viewBox="${escapeXml(viewBox.raw)}" overflow="visible">${inner}</svg>
  ${accentRule}
  ${sourceText}
  ${brandText}
</svg>`;
    return xml
      .replace(/var\(--c-tint\)/g, tint)
      .replace(/var\(--c\)/g, primary);
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLazySvgs);
  else initLazySvgs();
})();
