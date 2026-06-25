// One-off: append a hand-authored "What does the research say?" section to the
// end of the q.econ.asia_divergence body. Links are verified canonical URLs; the
// section is prose-only (NOT added to sectionVisualMap), so bindSectionVisuals
// leaves it without a chart (all 42 charts already bind to the first 42 sections).
import { readFile, writeFile } from "node:fs/promises";
import { stableJson } from "./core/artifacts.mjs";

const path = "data/explanations/en/q.econ.asia_divergence.json";

const SECTION = `## What does the research actually say?

This divergence is one of the most studied questions in modern economics, and the argument on this page leans on that work. A few starting points, including where the experts disagree.

**The East Asian playbook.** Joe Studwell's [How Asia Works](https://groveatlantic.com/book/how-asia-works/) is the most readable account: land reform first, then export-disciplined manufacturing, then a financial system kept on a leash to fund both. The deeper scholarly versions are Robert Wade's [Governing the Market](https://press.princeton.edu/books/ebook/9780691187181/governing-the-market-pdf) and Alice Amsden's *Asia's Next Giant*, which argue East Asia's states deliberately "got prices wrong" and forced firms to hit hard export targets in return for support. The World Bank's more cautious official account is [The East Asian Miracle](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/975081468244550798).

**The skeptics.** Not everyone buys the miracle framing. Paul Krugman's [The Myth of Asia's Miracle](https://www.foreignaffairs.com/articles/asia/1994-11-01/myth-asias-miracle), drawing on Alwyn Young's [The Tyranny of Numbers](https://www.nber.org/papers/w4680), argued the boom was mostly "perspiration", the piling up of capital and workers, rather than "inspiration", or rising productivity, and so would eventually slow. That debate is still unsettled, which is why this page treats the productivity question with care rather than as a verdict.

**Why the factory mattered, and India's miss.** Dani Rodrik's [Premature Deindustrialization](https://www.nber.org/papers/w20935) shows that the manufacturing escalator now shuts earlier and at lower incomes for late developers, with India as the textbook case.

**On India itself.** Amartya Sen and Jean Drèze's [An Uncertain Glory](https://press.princeton.edu/books/hardcover/9780691160795/an-uncertain-glory) is the definitive case that India neglected the health and schooling of its own people, the human-capital-first critique that the 1960 panel on this page makes visible. Pranab Bardhan's [Awakening Giants, Feet of Clay](https://press.princeton.edu/books/paperback/9780691156408/awakening-giants-feet-of-clay) is a sober, myth-puncturing comparison of China and India. And Rodrik and Subramanian's [From "Hindu Growth" to Productivity Surge](https://drodrik.scholar.harvard.edu/publications/hindu-growth-productivity-surge-mystery-indian-growth-transition) finds India's growth actually turned up around 1980, a decade before the 1991 reforms, and not because of software.

**The essay that prompted this piece.** David Oks's [Why China Got Rich and India Didn't](https://davidoks.blog/p/why-china-got-rich-and-india-didnt) puts human capital and forced social modernisation at the centre of the story. It is an argument, not a settled finding, and its hardest claim, that China's coercion was the price of its head start, is exactly the trade-off this page refuses to wave away.

These works do not agree with each other. They disagree most on how much credit belongs to industrial policy, how much to coercion, and how much simply to starting early. Read them as a live argument, not a final answer.`;

const d = JSON.parse(await readFile(path, "utf8"));
const body = d.article.bodyMarkdown.replace(/\s*$/, "");
if (body.includes("What does the research actually say?")) {
  console.log("literature section already present; skipping.");
} else {
  d.article.bodyMarkdown = `${body}\n\n${SECTION}\n`;
  await writeFile(path, stableJson(d) + "\n");
  const headings = (d.article.bodyMarkdown.match(/^## /gm) || []).length;
  const links = (SECTION.match(/\]\(https?:\/\//g) || []).length;
  console.log(`appended literature section. body headings now: ${headings}, sectionVisualMap entries: ${d.sectionVisualMap.length}, verified links: ${links}`);
}
