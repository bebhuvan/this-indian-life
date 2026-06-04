(() => {
  function downloadBlob(name, type, content) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

    if (action === "svg") {
      const svg = card.querySelector("svg");
      const svgText = svg ? new XMLSerializer().serializeToString(svg) : actions?.dataset.svgUrl ? await fetchText(actions.dataset.svgUrl) : "";
      if (!svgText) return;
      downloadBlob(`${file}.svg`, "image/svg+xml;charset=utf-8", svgText);
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
