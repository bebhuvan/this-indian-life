// Worldwide Governance Indicators (WGI) for the Asia-divergence flagship — the
// institutional "why" layer the original series lacked. Served by the World Bank
// API under source 3 (so the URL needs &source=3, unlike the main WDI battery).
//
// We pull the 0-100 percentile-rank score (.SC) for the six WGI dimensions: it is
// far more reader-friendly than the -2.5..+2.5 estimate, and ranks each country
// against all others in the same year. indicatorId divergence.wgi_<dim>.<cc>,
// filename worldbank.divergence.<cc>.GOV_WGI_<DIM>_SC. WGI runs from ~1996.
//
// The honest story here: India is NOT uniformly weak. On voice/accountability and
// rule of law it outscores China; on government effectiveness and regulatory
// quality it trails the East Asian performers. That nuance is the point.
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "CHN", name: "China" },
  { code: "KOR", name: "South Korea" },
  { code: "VNM", name: "Vietnam" },
  { code: "BGD", name: "Bangladesh" },
  { code: "IDN", name: "Indonesia" },
  { code: "THA", name: "Thailand" },
  { code: "MYS", name: "Malaysia" },
  { code: "SGP", name: "Singapore" },
  { code: "JPN", name: "Japan" }
];

// .SC = governance score as 0-100 percentile rank among all countries.
const DIMENSIONS = [
  { slug: "rule_of_law", code: "GOV_WGI_RL.SC", title: "Rule of law (percentile rank)" },
  { slug: "govt_effectiveness", code: "GOV_WGI_GE.SC", title: "Government effectiveness (percentile rank)" },
  { slug: "control_corruption", code: "GOV_WGI_CC.SC", title: "Control of corruption (percentile rank)" },
  { slug: "regulatory_quality", code: "GOV_WGI_RQ.SC", title: "Regulatory quality (percentile rank)" },
  { slug: "voice_accountability", code: "GOV_WGI_VA.SC", title: "Voice and accountability (percentile rank)" },
  { slug: "political_stability", code: "GOV_WGI_PV.SC", title: "Political stability (percentile rank)" }
];

const UNIT = "percentile rank (0-100)";
const manifest = [];
const failures = [];
const report = [];

for (const dim of DIMENSIONS) {
  for (const country of COUNTRIES) {
    const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${dim.code}?format=json&per_page=20000&source=3`;
    try {
      const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
      const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
      const observations = rows
        .map((r) => ({ date: String(r.date), value: r.value == null ? null : Math.round(Number(r.value) * 10) / 10 }))
        .filter((r) => r.date)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
      const indicatorId = `divergence.wgi_${dim.slug}.${country.code.toLowerCase()}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${dim.title} — ${country.name}`,
        sourceId: "worldbank",
        sourceIndicatorId: dim.code,
        sourceUrl: "https://www.worldbank.org/en/publication/worldwide-governance-indicators",
        unit: UNIT,
        frequency: "annual",
        geography: { type: "country", id: country.code, name: country.name },
        fetchedAt,
        observations,
        metadata: { angle: "institutions", metric: `wgi_${dim.slug}`, country: country.name, dataset: "Worldwide Governance Indicators" }
      });
      const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${country.code.toLowerCase()}.${dim.code.replaceAll(".", "_")}`, artifact });
      await writeSnapshot("worldbank", `divergence.wgi.${country.code}.${dim.code}`, raw);
      const last = observations.filter((o) => Number.isFinite(o.value)).at(-1);
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: dim.code, artifact: path, observations: observations.length, latest: last?.date, fetchedAt });
      report.push({ dim: dim.slug, country: country.name, latest: last });
      console.log(`divergence ${indicatorId} (${observations.length} obs, →${last?.date}=${last?.value})`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId: `divergence.wgi_${dim.slug}.${country.code.toLowerCase()}`, sourceIndicatorId: dim.code, fetchedAt, error: error.message });
      console.warn(`divergence wgi_${dim.slug}.${country.code} failed: ${error.message}`);
    }
  }
}

await writeSourceManifest("worldbank-divergence-governance", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} WGI divergence artifacts; ${failures.length} failure(s).`);
console.log("\nRule of law vs govt effectiveness, latest percentile rank:");
for (const c of COUNTRIES) {
  const rl = report.find((r) => r.dim === "rule_of_law" && r.country === c.name)?.latest;
  const ge = report.find((r) => r.dim === "govt_effectiveness" && r.country === c.name)?.latest;
  console.log(`  ${c.name.padEnd(13)} rule-of-law ${String(rl?.value ?? "-").padStart(5)}  govt-effectiveness ${String(ge?.value ?? "-").padStart(5)}`);
}
