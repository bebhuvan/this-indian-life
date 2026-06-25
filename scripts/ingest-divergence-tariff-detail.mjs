// WITS tariff architecture for the Asia-divergence flagship. The main WB battery
// and ingest-divergence-trade.mjs carry only one blunt tariff number (weighted
// mean, all products). WITS gives the two simple-average rates whose GAP is the
// real signal:
//   MFN-SMPL-AVRG = most-favoured-nation applied rate (the wall a country shows
//                   to any WTO member with no special deal)
//   AHS-SMPL-AVRG = effectively-applied rate (after FTAs, preferences, exemptions)
// MFN minus AHS = how much of the wall is actually waved through via preferential
// access. Tells blanket protection apart from selective/negotiated openness.
//
// indicatorId divergence.tariff_mfn.<cc> / divergence.tariff_ahs.<cc>;
// filename wits.divergence.<cc>.<indicator>. WITS reporters are lowercase ISO3.
import { fetchWitsTariffSeries } from "./adapters/wits.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const COUNTRIES = [
  { iso3: "ind", cc: "in", name: "India" },
  { iso3: "chn", cc: "chn", name: "China" },
  { iso3: "kor", cc: "kor", name: "South Korea" },
  { iso3: "vnm", cc: "vnm", name: "Vietnam" },
  { iso3: "bgd", cc: "bgd", name: "Bangladesh" },
  { iso3: "idn", cc: "idn", name: "Indonesia" },
  { iso3: "tha", cc: "tha", name: "Thailand" },
  { iso3: "mys", cc: "mys", name: "Malaysia" }
];

const INDICATORS = [
  { code: "MFN-SMPL-AVRG", slug: "tariff_mfn", title: "MFN applied tariff (simple average, all products)" },
  { code: "AHS-SMPL-AVRG", slug: "tariff_ahs", title: "Effectively-applied tariff (simple average, all products)" }
];

const UNIT = "%";
const manifest = [];
const failures = [];
const report = [];

for (const ind of INDICATORS) {
  for (const c of COUNTRIES) {
    try {
      const { points, raw, url } = await fetchWitsTariffSeries({ reporter: c.iso3, partner: "wld", product: "Total", indicator: ind.code });
      const observations = points
        .map((p) => ({ date: String(p.date), value: Math.round(Number(p.value) * 100) / 100 }))
        .filter((o) => o.date && Number.isFinite(o.value))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.length) throw new Error("no observations");
      await writeSnapshot("wits", `tariff.${c.iso3}.${ind.code}`, raw);
      const indicatorId = `divergence.${ind.slug}.${c.cc}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${ind.title} — ${c.name}`,
        sourceId: "wits",
        sourceIndicatorId: ind.code,
        sourceUrl: url,
        unit: UNIT,
        frequency: "annual",
        geography: { type: "country", id: c.iso3.toUpperCase(), name: c.name },
        fetchedAt,
        observations,
        metadata: { angle: "trade", metric: ind.slug, country: c.name, dataset: "WITS tradestats-tariff", partner: "World" }
      });
      const path = await writeSeriesArtifact({ sourceId: "wits", name: `wits.divergence.${c.cc}.${ind.slug}`, artifact });
      const last = observations.at(-1);
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: ind.code, artifact: path, observations: observations.length, latest: last.date, fetchedAt });
      report.push({ slug: ind.slug, country: c.name, last });
      console.log(`wits ${indicatorId} (${observations.length} obs, ${observations[0].date}→${last.date}=${last.value})`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId: `divergence.${ind.slug}.${c.cc}`, sourceIndicatorId: ind.code, fetchedAt, error: error.message });
      console.warn(`wits ${ind.slug}.${c.iso3} failed: ${error.message}`);
    }
  }
}

await writeSourceManifest("wits-divergence-tariff", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} WITS tariff artifacts; ${failures.length} failure(s).`);
console.log("\nLatest MFN vs effectively-applied (gap = preferential effect):");
for (const c of COUNTRIES) {
  const mfn = report.find((r) => r.slug === "tariff_mfn" && r.country === c.name)?.last;
  const ahs = report.find((r) => r.slug === "tariff_ahs" && r.country === c.name)?.last;
  if (mfn && ahs) console.log(`  ${c.name.padEnd(13)} MFN ${String(mfn.value).padStart(5)}%  applied ${String(ahs.value).padStart(5)}%  gap ${(mfn.value - ahs.value).toFixed(1)}pp  (${ahs.date})`);
}
