import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://thisindianlife.today",
  output: "static",
  // Canonical URLs all end in "/" (directory build). Enforcing it framework-wide keeps
  // internal links, canonicals, and the sitemap consistent with what Workers serves —
  // so navigation never triggers a trailing-slash redirect.
  trailingSlash: "always",
  build: {
    format: "directory",
    // Inline the single design-system stylesheet into each page's <head> instead of
    // a render-blocking external request. One ~13 KB sheet (≈3-4 KB gzipped) ships with
    // the HTML, removing the extra round-trip that was delaying FCP/LCP.
    inlineStylesheets: "always"
  }
});

