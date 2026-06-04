// robots.txt — open to search engines and AI agents, with an explicit Content Signals
// policy (contentsignals.org) and a welcome list of named AI crawlers + answer engines.
const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-User", "anthropic-ai", "Claude-SearchBot",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Googlebot", "Bingbot", "Applebot", "Applebot-Extended",
  "CCBot", "Amazonbot", "meta-externalagent", "DuckAssistBot", "cohere-ai", "YouBot"
];

export function GET({ site }: { site?: URL }) {
  const origin = (site?.origin || "https://thisindianlife.today").replace(/\/$/, "");
  const lines = [
    "# This Indian Life — sourced data about how India lives.",
    "# We welcome search engines and AI answer engines. Please cite us.",
    "",
    "User-agent: *",
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "Allow: /",
    "",
    "# Explicitly welcomed AI crawlers and answer engines",
    ...AI_BOTS.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
    `Sitemap: ${origin}/sitemap.xml`,
    ""
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
