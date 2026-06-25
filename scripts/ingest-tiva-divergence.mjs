import { fetchTiva } from "./adapters/oecd-tiva.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

// OECD TiVA 2025 GVC-participation divergence pull.
// Dataflow: OECD.STI.PIE,DSD_TIVA_MAINSH@DF_MAINSH,1.1
// KEY: MEASURE.REF_AREA.ACTIVITY.COUNTERPART_AREA.UNIT_MEASURE.FREQ
//   -> EXGR_FVA+EXGR_DVA.{ISO3}._T.W.PT_EXGR.A
// EXGR_FVA = foreign value added in exports = backward GVC participation (the key metric).
// EXGR_DVA = domestic value added in exports.

const fetchedAt = new Date().toISOString();

// reporter set: ISO3 (SDMX REF_AREA) -> { cc: lowercase short code, name }
const COUNTRIES = [
  { iso3: "IND", cc: "in", name: "India" },
  { iso3: "CHN", cc: "chn", name: "China" },
  { iso3: "KOR", cc: "kor", name: "Korea" },
  { iso3: "VNM", cc: "vnm", name: "Vietnam" },
  { iso3: "IDN", cc: "idn", name: "Indonesia" },
  { iso3: "JPN", cc: "jpn", name: "Japan" }
];

const MEASURES = [
  { measure: "EXGR_FVA", idBase: "divergence.gvc_fva", fileBase: "gvc_fva", title: "Foreign value added in exports (backward GVC participation)" },
  { measure: "EXGR_DVA", idBase: "divergence.gvc_dva", fileBase: "gvc_dva", title: "Domestic value added in exports" },
  // — 2026-06 additions —
  // EXGR_INT_DVA = domestic value added in intermediate exports = forward GVC participation
  //   (your inputs that partners re-export). India is upstream-tilted: forward > backward.
  { measure: "EXGR_INT_DVA", idBase: "divergence.gvc_forward", fileBase: "gvc_forward", title: "Domestic value added in intermediate exports (forward GVC participation)" },
  // EXGR_SERV_DVA = services domestic value added in gross exports = servicification of exports.
  { measure: "EXGR_SERV_DVA", idBase: "divergence.exports_serv_dva", fileBase: "exports_serv_dva", title: "Services domestic value added in gross exports" }
];

const UNIT = "% of gross exports";
const manifest = [];
const report = [];

for (const c of COUNTRIES) {
  let rows, url;
  try {
    ({ rows, url } = await fetchTiva(c.iso3, ["EXGR_FVA", "EXGR_DVA", "EXGR_INT_DVA", "EXGR_SERV_DVA"]));
  } catch (err) {
    console.warn(`oecd-tiva ${c.iso3}: fetch failed - ${err.message}`);
    continue;
  }
  const snapshot = await writeSnapshot("oecd-tiva", `EXGR.${c.iso3}._T.W`, { rowCount: rows.length, fetchedFrom: url });

  for (const m of MEASURES) {
    const obs = rows
      .filter((r) => r.MEASURE === m.measure)
      .map((r) => ({
        date: String(r.TIME_PERIOD),
        value: r.OBS_VALUE === "" || r.OBS_VALUE == null ? null : Math.round(Number(r.OBS_VALUE) * 100) / 100
      }))
      .filter((o) => o.date && o.value !== null && Number.isFinite(o.value))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!obs.length) { console.warn(`oecd-tiva ${c.iso3} ${m.measure}: no obs`); continue; }

    const indicatorId = `${m.idBase}.${c.cc}`;
    const artifact = createSeriesArtifact({
      indicatorId,
      title: `${m.title} — ${c.name}`,
      sourceId: "oecd-tiva",
      sourceIndicatorId: m.measure,
      sourceUrl: "https://www.oecd.org/sti/ind/measuring-trade-in-value-added.htm",
      unit: UNIT,
      frequency: "annual",
      geography: { type: "country", id: c.iso3, name: c.name },
      fetchedAt,
      observations: obs,
      metadata: { dataset: "TiVA 2025", activity: "Total", counterpart: "World" }
    });
    const path = await writeSeriesArtifact({ sourceId: "oecd-tiva", name: `oecd-tiva.${c.cc}.${m.fileBase}`, artifact });
    manifest.push({ status: "ready", indicatorId, sourceIndicatorId: m.measure, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
    report.push({ indicatorId, country: c.name, measure: m.measure, obs: obs.length, span: `${obs[0].date}-${obs.at(-1).date}`, latest: { date: obs.at(-1).date, value: obs.at(-1).value } });
    console.log(`oecd-tiva ${indicatorId} ${obs.length} obs (${obs[0].date}-${obs.at(-1).date}, →${obs.at(-1).date}=${obs.at(-1).value})`);
  }
}

await writeSourceManifest("oecd-tiva-divergence", manifest);
console.log(`\nWrote ${manifest.length} OECD TiVA divergence artifacts.`);
console.log("\nBackward GVC (EXGR_FVA) latest, by country:");
for (const r of report.filter((x) => x.measure === "EXGR_FVA")) {
  console.log(`  ${r.country.padEnd(12)} ${r.latest.value}% (${r.latest.date})`);
}
