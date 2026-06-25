// Adds the honesty/fairness pass to q.econ.asia_divergence: (1) a "So is this
// comparison even fair?" prose section (survivorship bias, the counterfactual,
// the closing manufacturing escalator + Rodrik/Baldwin services debate, China's
// 2020s wobble) inserted just before the literature section; (2) a "road ahead"
// group appended into the literature section; (3) three new caveats. Prose-only,
// so sectionVisualMap stays 42 (charts bind to the first 42 sections).
import { readFile, writeFile } from "node:fs/promises";
import { stableJson } from "./core/artifacts.mjs";

const path = "data/explanations/en/q.econ.asia_divergence.json";

const FAIRNESS = `## So is this comparison even fair?

Three honest problems sit under everything above.

First, survivorship. This page measures India against the winners: South Korea, Taiwan, China and now Vietnam, the greatest growth successes in modern history. It does not line India up against the Philippines, or Nigeria, or its own twin Pakistan, which started alongside it in 1947 and slipped further behind. East Asia's miracle is the rare exception, not a bar every country clears. Set against its own neighbourhood, India looks less like a failure than the stronger half of a hard pack.

Second, the counterfactual is not clean. South Korea and Taiwan were small, homogeneous, ruled by authoritarian governments and backed by the United States through the Cold War, with aid, security and privileged access to American markets, and their land reforms were imposed under occupation. India is a subcontinent-sized, diverse democracy that stayed non-aligned. To say India should have done what Korea did quietly assumes it could have, on the same terms. It could not.

Third, and most important, the very door India is faulted for missing may now be closing. The economist Dani Rodrik, who once argued for a manufacturing imperative, has [become a manufacturing skeptic](https://www.project-syndicate.org/commentary/services-not-manufacturing-best-hope-for-developing-countries-by-dani-rodrik-2026-05): automation has made factories far less hungry for low-skilled workers, so even Vietnam and Bangladesh now pull fewer people into industry than Korea once did. What might replace the factory escalator is contested. Richard Baldwin is the optimist, arguing that digital tools and remote work let poor countries export services directly, and that India, which built its services-export boom without signing a single trade deal, is the test case. Rodrik is warier: India's software and back-office exports employ only a small, educated sliver, and the real prize is lifting the productivity of the hundreds of millions stuck in low-end local services, the shops, kitchens, salons and delivery routes. Read that way, India's services-heavy path looks less like a wrong turn than an early, forced step down a road the rest of the world is now being pushed onto too.

One caution on the other side. China, the headline winner on this page, is itself stumbling through the 2020s, with a property crash, falling prices and a shrinking workforce. Pranab Bardhan called it feet of clay back in 2010. The miracle has limits of its own, and the gap India is chasing is not standing still.`;

const ROAD_AHEAD = `**The road ahead, and whether it is even open.** The newest and most relevant debate is whether the manufacturing route India is faulted for missing still exists. Dani Rodrik now argues it largely does not, and with Rohan Sandhu lays out [The Way Forward for Services-Led Economic Development](https://www.project-syndicate.org/commentary/strategies-for-services-led-economic-development-by-dani-rodrik-and-rohan-sandhu-1-2024-06). The optimistic counter-case is Richard Baldwin's, that digitally traded services and remote work are the new escalator and India its poster child, set out in [Globotics and Development](https://www.nber.org/papers/w26731). And Stefan Dercon's [Gambling on Development](https://www.hurstpublishers.com/book/gambling-on-development/) reframes the whole question around the bargain a country's elite strikes, memorably calling India "a peacock, its vibrant exterior masking a fragile frame."

`;

const NEW_CAVEATS = [
  "This page measures India mainly against East Asia's successes (South Korea, Taiwan, China, Vietnam), which are the rare winners of the development race, not a baseline every country reaches. Set against neighbours like Pakistan, which started alongside India in 1947 and fell further behind, India looks middling rather than failed.",
  "The manufacturing-export path East Asia rode may be narrowing: automation means factories now hire far fewer workers, so the route this page faults India for missing is contested in current research, and India's tilt toward services may be an early adaptation rather than a simple mistake. What replaces the factory as a mass-employment escalator is genuinely unsettled.",
  "China, the headline success on this page, is itself slowing sharply in the 2020s, with a property crash, deflation and a shrinking workforce, so the convergence comparison freezes a moving and now-wobbling target."
];

const d = JSON.parse(await readFile(path, "utf8"));

if (d.article.bodyMarkdown.includes("So is this comparison even fair?")) {
  console.log("fairness section already present; skipping body insert.");
} else {
  // Insert the fairness section just before the literature section.
  const marker = "## What does the research actually say?";
  const idx = d.article.bodyMarkdown.indexOf(marker);
  if (idx < 0) throw new Error("literature section marker not found");
  d.article.bodyMarkdown = d.article.bodyMarkdown.slice(0, idx) + FAIRNESS + "\n\n" + d.article.bodyMarkdown.slice(idx);
}

// Insert the "road ahead" group into the literature section, before its closing line.
const closer = "These works do not agree with each other.";
if (!d.article.bodyMarkdown.includes("The road ahead, and whether it is even open")) {
  d.article.bodyMarkdown = d.article.bodyMarkdown.replace(closer, ROAD_AHEAD + closer);
}

// Add the three caveats if not already there.
d.caveats = Array.isArray(d.caveats) ? d.caveats : [];
for (const c of NEW_CAVEATS) {
  if (!d.caveats.some((x) => x.slice(0, 40) === c.slice(0, 40))) d.caveats.push(c);
}

await writeFile(path, stableJson(d) + "\n");
const headings = (d.article.bodyMarkdown.match(/^## /gm) || []).length;
const links = (d.article.bodyMarkdown.match(/\]\(https?:\/\//g) || []).length;
console.log(`done. headings: ${headings}, total body links: ${links}, caveats: ${d.caveats.length}, sectionVisualMap: ${d.sectionVisualMap.length}`);
