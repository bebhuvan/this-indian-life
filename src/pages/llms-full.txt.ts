import { questionPages, questionUrl } from "../data/questions";
import { domains } from "../data/site";
import { SITE } from "../data/seo";

// llms-full.txt — the full text of every article in one document, for AI agents that
// want the whole corpus in a single fetch. https://llmstxt.org/
export function GET({ site }: { site?: URL }) {
  const origin = (site?.origin || SITE.url).replace(/\/$/, "");
  const url = (path: string) => `${origin}${path}`;

  const out: string[] = [];
  out.push(`# ${SITE.name} — full content`);
  out.push("");
  out.push(`> ${SITE.description} Public data turned into clear, sourced answers for ordinary readers. Licensed CC BY 4.0; please cite "${SITE.name} — ${origin}".`);
  out.push("");

  for (const domain of domains) {
    const pages = questionPages.filter((p) => p.domain === domain.id && p.explanation?.status !== "needs_data");
    if (!pages.length) continue;
    for (const page of pages) {
      const ex = page.explanation;
      out.push("---");
      out.push("");
      out.push(`# ${page.question}`);
      out.push(`URL: ${url(questionUrl(page, "en"))} · Section: ${domain.label}`);
      out.push("");
      if (ex.short?.dek) { out.push(`> ${ex.short.dek}`); out.push(""); }
      if (ex.short?.body) { out.push(ex.short.body); out.push(""); }
      if (ex.article?.bodyMarkdown) { out.push(ex.article.bodyMarkdown.trim()); out.push(""); }
      if (ex.sourceNotes?.length) {
        out.push("## Sources");
        out.push(...ex.sourceNotes.map((s) => `- ${s}`));
        out.push("");
      }
    }
  }

  return new Response(out.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
