// Round-three enrichment: learning quality (not just years), a human-capital composite,
// and gender depth. World Bank WDI. divergence.* namespace.
//   - HD.HCI.HLOS  harmonized test scores (learning outcomes) — snapshot, latest-bars
//   - HD.HCI.OVRL  Human Capital Index composite — snapshot, latest-bars
//   - SP.ADO.TFRT  adolescent fertility (births per 1,000 women 15-19) — long series
//   - SG.GEN.PARL.ZS women in national parliament (%) — 1997-
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

const COUNTRIES = [
  { code: "IN", cc: "in", name: "India" }, { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" }, { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "BGD", cc: "bgd", name: "Bangladesh" }, { code: "IDN", cc: "idn", name: "Indonesia" },
  { code: "JPN", cc: "jpn", name: "Japan" }
];
const METRICS = [
  { slug: "learning_score", code: "HD.HCI.HLOS", title: "Harmonized learning outcomes (test scores)", unit: "score (625 = advanced)" },
  { slug: "hci", code: "HD.HCI.OVRL", title: "Human Capital Index", unit: "index (0-1)" },
  { slug: "adolescent_fertility", code: "SP.ADO.TFRT", title: "Adolescent fertility", unit: "births per 1,000 women 15-19" },
  { slug: "women_parliament", code: "SG.GEN.PARL.ZS", title: "Women in parliament", unit: "% of seats" }
];

for (const m of METRICS) {
  for (const c of COUNTRIES) {
    const url = `https://api.worldbank.org/v2/country/${c.code}/indicator/${m.code}?format=json&per_page=20000`;
    try {
      const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
      const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
      const observations = rows.map((r) => ({ date: String(r.date), value: r.value == null ? null : Number(r.value) }))
        .filter((r) => r.date && r.date >= "1960").sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
      const indicatorId = `divergence.${m.slug}.${c.cc}`;
      const artifact = createSeriesArtifact({ indicatorId, title: `${m.title} — ${c.name}`, sourceId: "worldbank", sourceIndicatorId: m.code, sourceUrl: url, unit: m.unit, frequency: "annual", geography: { type: "country", id: c.code, name: c.name }, fetchedAt, observations, metadata: { angle: "round3", metric: m.slug, country: c.name } });
      await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${c.cc}.${m.code.replaceAll(".", "_")}`, artifact });
      await writeSnapshot("worldbank", `divergence.${c.code}.${m.code}`, raw);
      const real = observations.filter((o) => Number.isFinite(o.value));
      manifest.push({ status: "ready", indicatorId, observations: real.length, latest: real.at(-1) });
      console.log(`extras3 ${indicatorId} (${real.length} real, latest ${real.at(-1).date}=${real.at(-1).value})`);
    } catch (e) { failures.push({ indicatorId: `divergence.${m.slug}.${c.cc}`, error: e.message }); console.warn(`${m.slug}.${c.code} failed: ${e.message}`); }
  }
}

await writeSourceManifest("divergence-extras3", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} series; ${failures.length} failure(s).`);
