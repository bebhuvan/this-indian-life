// World Bank world-lens for "How big is India's economy?": India's GDP at the
// market exchange rate (current US$) vs at purchasing-power parity (current
// international $). The ~4x gap between the two is why India ranks ~5th in the
// world at market rates but ~3rd by PPP. MOSPI is the source of truth for India's
// rupee national accounts; the World Bank supplies only this cross-country lens.
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://data.worldbank.org/indicator";
const manifest = [];

const METRICS = [
  { id: "econ.world.gdp_market_usd", code: "NY.GDP.MKTP.CD", title: "India GDP at market exchange rate", unit: "current US$" },
  { id: "econ.world.gdp_ppp_intl", code: "NY.GDP.MKTP.PP.CD", title: "India GDP at purchasing-power parity", unit: "current international $" }
];

try {
  for (const m of METRICS) {
    const url = `https://api.worldbank.org/v2/country/IND/indicator/${m.code}?format=json&per_page=20000`;
    const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
    await writeSnapshot("worldbank", `world_lens_${m.code}`, raw);
    const rows = Array.isArray(raw) && Array.isArray(raw[1]) ? raw[1] : [];
    const observations = rows
      .filter((r) => r.value != null)
      .map((r) => ({ date: String(r.date), value: Number(r.value) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const artifact = createSeriesArtifact({
      indicatorId: m.id,
      title: m.title,
      sourceId: "worldbank",
      sourceIndicatorId: m.code,
      sourceUrl,
      unit: m.unit,
      frequency: "annual",
      geography: { type: "country", id: "IN", name: "India" },
      fetchedAt,
      observations,
      metadata: { sourceCategory: "National Accounts", sourceSubcategory: "World comparison", sourceOwner: "World Bank" }
    });
    const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.IN.${m.id}`, artifact });
    manifest.push({ status: "ready", indicatorId: m.id, observations: observations.length, artifact: path, fetchedAt, latest: observations[observations.length - 1] });
    console.log(`worldbank ${m.id}: ${observations.length} obs, latest ${observations[observations.length - 1]?.date} = ${observations[observations.length - 1]?.value}`);
  }
  await writeSourceManifest("worldbank-gdp-world-lens", manifest);
  console.log(`\nWrote ${manifest.length} World Bank world-lens series.`);
} catch (error) {
  console.error("World Bank world-lens ingest failed:", error.message);
  process.exit(1);
}
