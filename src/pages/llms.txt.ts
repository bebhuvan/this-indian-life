import { questionPages, questionUrl } from "../data/questions";
import { domains } from "../data/site";
import { SITE } from "../data/seo";

// llms.txt — a clean, machine-readable map of the site for AI answer engines.
// https://llmstxt.org/
export function GET({ site }: { site?: URL }) {
  const origin = (site?.origin || SITE.url).replace(/\/$/, "");
  const url = (path: string) => `${origin}${path}`;

  const lines: string[] = [];
  lines.push(`# ${SITE.name}`);
  lines.push("");
  lines.push(`> ${SITE.description} Public data (World Bank, UN, WHO, Our World in Data, RBI, TRAI, EIA, Ember and more) turned into clear, sourced answers for ordinary readers.`);
  lines.push("");
  lines.push("Every page answers one question about India, pairs it with a short plain-language answer, charts the underlying numbers, and lists the original data sources. Numbers are locked from sources before any prose is written; pages are static and do not call statistical APIs at request time.");
  lines.push("");

  for (const domain of domains) {
    const pages = questionPages.filter((p) => p.domain === domain.id && p.explanation?.status !== "needs_data");
    if (!pages.length) continue;
    lines.push(`## ${domain.label}`);
    for (const page of pages) {
      const dek = page.explanation.short?.dek?.replace(/\s+/g, " ").trim();
      lines.push(`- [${page.question}](${url(questionUrl(page, "en"))})${dek ? `: ${dek}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## More");
  lines.push(`- [About](${url("/en/about/")}): who makes this and why`);
  lines.push(`- [Definitions](${url("/en/definitions/")}): the question spine, indicator registry, and data contracts`);
  lines.push(`- [Sitemap](${url("/sitemap.xml")})`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
