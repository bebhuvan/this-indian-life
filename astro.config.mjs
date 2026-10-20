import { defineConfig } from "astro/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Chart artboards (src/data/artboards.ts): each chart's drawings at the ladder's in-between
// widths are collected while the pages render, then written beside each article as
// charts/<file>@<width>.json for the page to fetch when a card is that wide.
const artboards = {
  name: "indica-artboards",
  hooks: {
    "astro:build:done": ({ dir, logger }) => {
      const store = globalThis.__indicaArtboards;
      if (!store?.size) {
        logger.warn("no chart artboards were collected; cards will scale their inline drawings");
        return;
      }
      const out = fileURLToPath(dir);
      let bytes = 0;
      for (const [rel, html] of store) {
        const file = path.join(out, rel);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const body = JSON.stringify({ html });
        bytes += body.length;
        fs.writeFileSync(file, body);
      }
      logger.info(`wrote ${store.size} chart artboards (${Math.round(bytes / 1024 / 1024)} MB)`);
    }
  }
};

export default defineConfig({
  site: "https://thisindianlife.today",
  output: "static",
  // Canonical URLs all end in "/" (directory build). Enforcing it framework-wide keeps
  // internal links, canonicals, and the sitemap consistent with what Workers serves —
  // so navigation never triggers a trailing-slash redirect.
  trailingSlash: "always",
  integrations: [artboards],
  build: {
    format: "directory",
    // Inline the single design-system stylesheet into each page's <head> instead of
    // a render-blocking external request. One ~13 KB sheet (≈3-4 KB gzipped) ships with
    // the HTML, removing the extra round-trip that was delaying FCP/LCP.
    inlineStylesheets: "always"
  }
});
