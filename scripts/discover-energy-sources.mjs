import { fetchDiscoveryPage } from "./adapters/source-discovery.mjs";
import { writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { officialEnergySourceDiscoveryPages } from "./registry/v1-indicators.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

function interestingLinks(links) {
  return links.filter((link) => ["api", "download", "excel", "csv", "json", "pdf", "report"].includes(link.kind));
}

for (const source of officialEnergySourceDiscoveryPages) {
  const pages = [];
  const failures = [];
  for (const url of source.pages) {
    try {
      const page = await fetchDiscoveryPage(url);
      const links = interestingLinks(page.links);
      pages.push({
        ...page,
        links,
        linkCounts: links.reduce((counts, link) => {
          counts[link.kind] = (counts[link.kind] || 0) + 1;
          return counts;
        }, {})
      });
      console.log(`${source.id} ${page.status} ${url} ${links.length} interesting link(s)`);
    } catch (error) {
      failures.push({ url, error: error.message });
      console.warn(`${source.id} failed ${url}: ${error.message}`);
    }
  }
  const snapshot = await writeSnapshot(source.id, "source-discovery", { source, fetchedAt, pages, failures });
  const badPages = pages.filter((page) => page.status < 200 || page.status >= 300);
  manifest.push({
    status: failures.length || badPages.length ? "partial" : "ready",
    sourceId: source.id,
    title: source.title,
    homepage: source.homepage,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    pages: pages.length,
    failures: failures.length,
    nonOkPages: badPages.length,
    links: pages.reduce((total, page) => total + page.links.length, 0),
    fetchedAt
  });
}

await writeSourceManifest("official-energy-discovery", manifest);
console.log(`Wrote discovery snapshots for ${manifest.length} source(s).`);
