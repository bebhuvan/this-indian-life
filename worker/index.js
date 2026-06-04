// Markdown for Agents.
//
// The site is static assets; this tiny Worker is scoped (via wrangler.toml
// `assets.run_worker_first = ["/en/articles/*"]`) to run ONLY on article pages.
// Everything else is served straight from static assets with no Worker invocation.
//
// When a client sends `Accept: text/markdown`, return the article's prebuilt .md
// variant (/en/articles/<slug>/ -> /en/articles/<slug>.md) as text/markdown.
// Browsers, which don't send that Accept value, keep getting HTML.

// Article slug, no trailing slash, single slug segment (won't match /og/... or sub-paths).
const ARTICLE_RE = /^\/articles\/[^/]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const accept = request.headers.get("Accept") || "";

    if (request.method === "GET" && /text\/markdown/i.test(accept)) {
      const path = url.pathname.replace(/\/+$/, "");
      if (ARTICLE_RE.test(path)) {
        const md = await env.ASSETS.fetch(new URL(path + ".md", url.origin));
        if (md.ok) {
          const body = await md.text();
          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": "text/markdown; charset=utf-8",
              "X-Markdown-Tokens": String(Math.ceil(body.length / 4)),
              "Vary": "Accept",
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "public, max-age=3600"
            }
          });
        }
      }
    }

    // Default: serve the static asset, marking it Accept-varying so caches keep the
    // HTML and markdown variants separate.
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Vary", "Accept");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
