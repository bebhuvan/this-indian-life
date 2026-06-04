// Markdown twin of every article — a clean, prose-only version for AI agents and
// "markdown content negotiation". Linked from the HTML page via <link rel="alternate">.
import { locales } from "../../data/site";
import { questionPages, questionUrl } from "../../data/questions";
import { SITE } from "../../data/seo";

export function getStaticPaths() {
  return questionPages.map((page) => ({ params: { slug: page.slug }, props: { page } }));
}

export function GET({ props }: { props: { page: typeof questionPages[number] } }) {
  const { page } = props;
  const ex = page.explanation;
  const canonical = new URL(questionUrl(page), SITE.url).toString();
  const updated = ex.generatedAt ? new Date(ex.generatedAt).toISOString().slice(0, 10) : null;

  const md = [
    `# ${page.question}`,
    "",
    ex.short?.dek ? `> ${ex.short.dek}` : "",
    "",
    ex.short?.headline ? `**${ex.short.headline}**` : "",
    "",
    ex.short?.body || "",
    "",
    ex.article?.bodyMarkdown || "",
    "",
    ex.sourceNotes?.length ? "## Sources\n\n" + ex.sourceNotes.map((s) => `- ${s}`).join("\n") : "",
    "",
    "---",
    "",
    `Source: [This Indian Life](${canonical})${updated ? ` · Updated ${updated}` : ""}. ` +
      `Licensed CC BY 4.0. Please cite as "This Indian Life — ${SITE.url}".`,
    ""
  ].filter((line, i, a) => !(line === "" && a[i - 1] === "")).join("\n");

  return new Response(md, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
