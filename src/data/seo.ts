// Central SEO/GEO constants + JSON-LD builders. Each builder returns an array of
// schema.org nodes; Base.astro wraps them in a single {"@context",@graph} block.
import type { QuestionPage } from "./questions";
import { questionUrl } from "./questions";
import { sources, domains, chartUrl } from "./site";

export const SITE = {
  url: "https://thisindianlife.today",
  name: "This Indian Life",
  tagline: "India, one number at a time",
  description: "Sourced charts and plain-language explainers about how India lives.",
  author: { name: "Bhuvanesh", url: "https://bebhuvan.com" },
  sameAs: ["https://twitter.com/bebhuvan", "https://www.linkedin.com/in/bebhuvan/"],
  ogImage: "/og-default.png"
};

export const abs = (path: string) => new URL(path, SITE.url).toString();
const ORG_ID = `${SITE.url}/#org`;
const WEBSITE_ID = `${SITE.url}/#website`;

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: { "@type": "ImageObject", url: abs("/icon-512.png"), width: 512, height: 512 },
    founder: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
    sameAs: SITE.sameAs
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    alternateName: `${SITE.name} · ${SITE.tagline}`,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": ORG_ID }
  };
}

export function breadcrumbNode(items: Array<{ name: string; url: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.url)
    }))
  };
}

function yearRange(dates: Array<string | undefined>): string | undefined {
  const ys = dates
    .map((d) => parseInt(String(d ?? "").match(/\d{4}/)?.[0] || "", 10))
    .filter((y) => Number.isFinite(y));
  if (!ys.length) return undefined;
  const lo = Math.min(...ys), hi = Math.max(...ys);
  return lo === hi ? String(lo) : `${lo}/${hi}`;
}

function sourceOrgs(ids: string[]) {
  return [...new Set(ids.filter(Boolean))]
    .map((id) => {
      const s = (sources as Record<string, { owner: string; homepage: string }>)[id];
      return s ? { "@type": "Organization", name: s.owner, url: s.homepage } : null;
    })
    .filter(Boolean);
}

const domainLabel = (id: string) => domains.find((d) => d.id === id)?.label || id;

// Article pages (/{locale}/articles/{slug}) — the primary GEO targets.
export function articleGraph(page: QuestionPage, locale = "en") {
  const url = abs(questionUrl(page, locale));
  const ex = page.explanation;
  const date = ex.generatedAt;
  const orgs = sourceOrgs((ex.evidence.sourceSummaries || []).map((s) => String((s as Record<string, unknown>).sourceId || "")));
  const section = domainLabel(page.domain);

  const article = {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: page.question,
    description: ex.short?.dek,
    abstract: ex.short?.body,
    inLanguage: "en",
    image: abs(SITE.ogImage),
    datePublished: date,
    dateModified: date,
    author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: url,
    articleSection: section,
    isAccessibleForFree: true,
    keywords: ["India", section, ...orgs.map((o) => (o as { name: string }).name)].join(", ")
  };

  const dataset = {
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: `${page.question} — data`,
    description: ex.short?.dek || page.question,
    url,
    inLanguage: "en",
    isAccessibleForFree: true,
    creator: { "@id": ORG_ID },
    spatialCoverage: { "@type": "Place", name: "India" },
    ...(orgs.length ? { sourceOrganization: orgs } : {}),
    ...(yearRange((ex.evidence.lockedNumbers || []).map((n) => n.date)) ? { temporalCoverage: yearRange((ex.evidence.lockedNumbers || []).map((n) => n.date)) } : {}),
    variableMeasured: [...new Set((ex.evidence.lockedNumbers || []).map((n) => n.label).filter(Boolean))].slice(0, 12)
  };

  const crumbs = breadcrumbNode([
    { name: "Home", url: `/${locale}/` },
    { name: section, url: `/${locale}/${page.domain}/` },
    { name: page.question, url: questionUrl(page, locale) }
  ]);

  return [organizationNode(), article, dataset, crumbs];
}

// Single-series chart pages (/{locale}/{domain}/{slug}) — a clean Dataset each.
export function chartGraph(chart: { title: string; dek: string; domain: string }, series: Record<string, unknown>, locale = "en") {
  const url = abs(chartUrl(chart as never, locale));
  const sourceId = String(series.sourceId || "");
  const orgs = sourceOrgs([sourceId]);
  const obs = (series.observations as Array<{ date?: string }>) || [];
  const section = domainLabel(chart.domain);

  const dataset = {
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: chart.title,
    description: chart.dek,
    url,
    inLanguage: "en",
    isAccessibleForFree: true,
    creator: { "@id": ORG_ID },
    spatialCoverage: { "@type": "Place", name: (series.geography as { name?: string })?.name || "India" },
    ...(series.unit ? { unitText: String(series.unit) } : {}),
    ...(orgs.length ? { sourceOrganization: orgs } : {}),
    ...(yearRange(obs.map((o) => o.date)) ? { temporalCoverage: yearRange(obs.map((o) => o.date)) } : {}),
    ...(series.fetchedAt ? { dateModified: String(series.fetchedAt) } : {}),
    variableMeasured: [String(series.title || chart.title)]
  };

  const crumbs = breadcrumbNode([
    { name: "Home", url: `/${locale}/` },
    { name: section, url: `/${locale}/${chart.domain}/` },
    { name: chart.title, url: chartUrl(chart as never, locale) }
  ]);

  return [organizationNode(), dataset, crumbs];
}

export function homeGraph() {
  return [organizationNode(), websiteNode()];
}
