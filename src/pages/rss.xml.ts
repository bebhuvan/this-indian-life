import { questionPages, questionUrl, gitMetaFor } from "../data/questions";
import { domains } from "../data/site";

// Hand-rolled RSS 2.0 feed (no @astrojs/rss dependency, matching the existing
// sitemap.xml.ts / llms.txt.ts pattern). One <item> per published article,
// newest first. Dates come from the committed git-meta (publish date), falling
// back to the explanation's generatedAt.

const SITE_TITLE = "This Indian Life";
const SITE_DESCRIPTION =
  "India's most important numbers, dragged out of stubborn PDFs and tired government portals and written up in plain language — every page static, sourced, and tied back to where the numbers began.";

const domainLabel = (id: string) => domains.find((d) => d.id === id)?.label;

const esc = (value?: string) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const rfc822 = (value?: string) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toUTCString() : undefined;
};

export function GET({ site }: { site?: URL }) {
  const origin = (site?.origin || "https://thisindianlife.today").replace(/\/$/, "");

  const items = questionPages
    .map((page) => {
      const git = gitMetaFor(page.id);
      const dateStr = git.published || page.explanation.generatedAt;
      return {
        title: page.question,
        url: `${origin}${questionUrl(page, "en")}`,
        description: page.explanation.short?.dek || page.explanation.article?.standfirst || "",
        category: domainLabel(page.domain),
        date: rfc822(dateStr),
        sortKey: dateStr || ""
      };
    })
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));

  // Keep the build deterministic: use the newest item's date, not "now".
  const lastBuild = items.find((item) => item.date)?.date;

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${esc(SITE_TITLE)}</title>`,
    `    <link>${origin}/</link>`,
    `    <description>${esc(SITE_DESCRIPTION)}</description>`,
    "    <language>en-in</language>",
    `    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />`,
    lastBuild ? `    <lastBuildDate>${lastBuild}</lastBuildDate>` : "",
    ...items.map((item) =>
      [
        "    <item>",
        `      <title>${esc(item.title)}</title>`,
        `      <link>${item.url}</link>`,
        `      <guid isPermaLink="true">${item.url}</guid>`,
        item.date ? `      <pubDate>${item.date}</pubDate>` : "",
        item.category ? `      <category>${esc(item.category)}</category>` : "",
        `      <description>${esc(item.description)}</description>`,
        "    </item>"
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "  </channel>",
    "</rss>",
    ""
  ]
    .filter(Boolean)
    .join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}
