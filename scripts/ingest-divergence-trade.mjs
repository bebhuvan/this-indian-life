// Trade-and-openness layer for the "Why India stayed poor" flagship, all via the World
// Bank API (which surfaces the WTO commercial-services series TX.VAL.SERV.CD.WT), so the
// comparison stays on one consistent source rather than splicing a second trade adapter:
//   - applied tariff rate (the "how walled-off was the economy" / protectionism beat)
//   - services as a share of total exports, derived from BoP goods and services exports
//     (India's distinctive "services escalator" rather than the factory one)
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const COUNTRIES = [
  { code: "IN", cc: "in", name: "India" },
  { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" },
  { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "BGD", cc: "bgd", name: "Bangladesh" },
  { code: "IDN", cc: "idn", name: "Indonesia" }
];

const wb = async (code, indicator) => {
  const url = `https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&per_page=20000`;
  const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
  return { rows: Array.isArray(raw?.[1]) ? raw[1] : [], raw, url };
};

const manifest = [];
const failures = [];

for (const c of COUNTRIES) {
  // 1) applied tariff rate (weighted mean, all products)
  try {
    const { rows, raw, url } = await wb(c.code, "TM.TAX.MRCH.WM.AR.ZS");
    const observations = rows.map((r) => ({ date: String(r.date), value: r.value == null ? null : Number(r.value) }))
      .filter((r) => r.date && r.date >= "1960").sort((a, b) => a.date.localeCompare(b.date));
    if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
    const indicatorId = `divergence.tariff.${c.cc}`;
    const artifact = createSeriesArtifact({ indicatorId, title: `Applied tariff rate — ${c.name}`, sourceId: "worldbank", sourceIndicatorId: "TM.TAX.MRCH.WM.AR.ZS", sourceUrl: url, unit: "% (weighted mean, all products)", frequency: "annual", geography: { type: "country", id: c.code, name: c.name }, fetchedAt, observations, metadata: { angle: "trade", metric: "tariff", country: c.name } });
    await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${c.cc}.TM_TAX_MRCH_WM_AR_ZS`, artifact });
    await writeSnapshot("worldbank", `divergence.${c.code}.TM_TAX_MRCH_WM_AR_ZS`, raw);
    manifest.push({ status: "ready", indicatorId, observations: observations.filter((o) => Number.isFinite(o.value)).length, fetchedAt });
    console.log(`trade ${indicatorId} (${observations.filter((o) => Number.isFinite(o.value)).length} real)`);
  } catch (e) { failures.push({ indicatorId: `divergence.tariff.${c.cc}`, error: e.message }); console.warn(`tariff.${c.code} failed: ${e.message}`); }

  // 2) services share of total exports = services / (goods + services), from BoP exports in US$
  try {
    const [svc, gds] = await Promise.all([wb(c.code, "BX.GSR.NFSV.CD"), wb(c.code, "BX.GSR.MRCH.CD")]);
    const svcBy = new Map(svc.rows.filter((r) => r.value != null).map((r) => [String(r.date), Number(r.value)]));
    const gdsBy = new Map(gds.rows.filter((r) => r.value != null).map((r) => [String(r.date), Number(r.value)]));
    const observations = [...svcBy.keys()].filter((d) => d >= "1960" && gdsBy.has(d))
      .map((d) => { const s = svcBy.get(d), g = gdsBy.get(d); const tot = s + g; return { date: d, value: tot > 0 ? (s / tot) * 100 : null }; })
      .filter((o) => Number.isFinite(o.value)).sort((a, b) => a.date.localeCompare(b.date));
    if (observations.length < 2) throw new Error("insufficient overlapping goods+services data");
    const indicatorId = `divergence.services_export_share.${c.cc}`;
    const artifact = createSeriesArtifact({ indicatorId, title: `Services share of exports — ${c.name}`, sourceId: "worldbank", sourceIndicatorId: "BX.GSR.NFSV.CD / (BX.GSR.NFSV.CD + BX.GSR.MRCH.CD)", sourceUrl: "https://api.worldbank.org/v2/country/" + c.code + "/indicator/BX.GSR.NFSV.CD", unit: "% of goods+services exports", frequency: "annual", geography: { type: "country", id: c.code, name: c.name }, fetchedAt, observations, metadata: { angle: "trade", metric: "services_export_share", country: c.name, derivation: "services BoP exports as a share of goods+services BoP exports" } });
    await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${c.cc}.services_export_share`, artifact });
    manifest.push({ status: "ready", indicatorId, observations: observations.length, fetchedAt });
    console.log(`trade ${indicatorId} (${observations.length} obs, ${observations[0].date}-${observations.at(-1).date})`);
  } catch (e) { failures.push({ indicatorId: `divergence.services_export_share.${c.cc}`, error: e.message }); console.warn(`services_share.${c.code} failed: ${e.message}`); }
}

await writeSourceManifest("divergence-trade", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} trade series; ${failures.length} failure(s).`);
