import { charts, chartUrl } from "../data/site";
import { questionPages, questionUrl } from "../data/questions";

const staticPaths = [
  "/",
  "/en/about/",
  "/en/articles/",
  "/en/ask/",
  "/en/definitions/",
  "/en/economy/",
  "/en/people/",
  "/en/health/",
  "/en/energy/",
  "/en/society/",
  "/en/climate/"
];

type Entry = { path: string; lastmod?: string };
const isoDate = (value?: string) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;
};

export function GET({ site }: { site?: URL }) {
  const origin = (site?.origin || "https://thisindianlife.today").replace(/\/$/, "");

  const entries: Entry[] = [
    ...staticPaths.map((path) => ({ path })),
    ...charts.map((chart) => ({ path: chartUrl(chart, "en") })),
    ...questionPages.map((page) => ({
      path: questionUrl(page, "en"),
      lastmod: isoDate(page.explanation?.generatedAt)
    }))
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(({ path, lastmod }) =>
      `  <url><loc>${origin}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`
    ),
    '</urlset>',
    ''
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
