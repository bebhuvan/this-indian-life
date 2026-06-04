import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://thisindianlife.today",
  output: "static",
  // Canonical URLs all end in "/" (directory build). Enforcing it framework-wide keeps
  // internal links, canonicals, and the sitemap consistent with what Workers serves —
  // so navigation never triggers a trailing-slash redirect.
  trailingSlash: "always",
  build: {
    format: "directory"
  }
});

