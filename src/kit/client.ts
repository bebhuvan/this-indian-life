// Browser runtime: redraw each chart at the exact width it is shown, whenever that width
// changes. The server's drawing stays in place until then, so a chart is never blank and
// works without JavaScript. For speed, nothing happens until a chart is near the screen,
// and a chart already drawn at its shown width is left alone.

import { draw, renderSvg, type AnySpec } from "./index";

function mount(host: HTMLElement) {
  const plot = host.querySelector<HTMLElement>("[data-kit-plot]");
  const raw = host.getAttribute("data-kit");
  if (!plot || !raw) return;
  let spec: AnySpec | null = null;
  let last = Number(host.dataset.kitW) || 0;
  const redraw = () => {
    const w = Math.round(plot.clientWidth);
    if (!w || w === last) return;
    last = w;
    spec ??= JSON.parse(raw) as AnySpec;
    plot.innerHTML = renderSvg(draw(spec, w));
  };
  const watch = () => {
    new ResizeObserver(() => requestAnimationFrame(redraw)).observe(plot);
    redraw();
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        watch();
      }
    }, { rootMargin: "600px 0px" });
    io.observe(host);
  } else watch();

  // The download carries its own title, dek, source and the site's mark.
  host.querySelector("[data-kit-dl]")?.addEventListener("click", () => {
    spec ??= JSON.parse(raw) as AnySpec;
    const chrome = { title: host.dataset.title ?? "", dek: host.dataset.dek, source: host.dataset.source };
    const svg = renderSvg(draw(spec, Math.max(640, last || 1040)), { chrome });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${host.id || "chart"}.svg` });
    a.click();
    URL.revokeObjectURL(url);
  });
}

/**
 * The standalone export of a kit chart, for the article's SVG and PNG buttons: drawn at
 * the width it is shown (at least 640), with title, dek, source and the site's mark, and
 * the page's fonts embedded so a PNG renders in the right faces.
 */
function exportSvg(host: HTMLElement, fontCss = ""): string {
  const spec = JSON.parse(host.getAttribute("data-kit") ?? "{}") as AnySpec;
  const shown = Math.round(host.querySelector<HTMLElement>("[data-kit-plot]")?.clientWidth ?? 0);
  const chrome = { title: host.dataset.title ?? "", dek: host.dataset.dek, source: host.dataset.source };
  const svg = renderSvg(draw(spec, Math.max(640, shown || 1040)), { chrome });
  return fontCss ? svg.replace(/^<svg([^>]*)>/, `<svg$1><defs><style>${fontCss}</style></defs>`) : svg;
}

declare global {
  interface Window {
    tilKit?: { exportSvg: typeof exportSvg };
  }
}
window.tilKit = { exportSvg };

document.querySelectorAll<HTMLElement>("[data-kit]").forEach(mount);
