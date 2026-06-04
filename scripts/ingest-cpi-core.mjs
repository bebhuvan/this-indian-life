// CPI core inflation (excluding food & fuel) and excluding-food, from IndiaDataHub
// (official MOSPI series MOINCPACOR12M / MOINCPAXFD12M), monthly from Jan 2011.
// Core is the "sticky" underlying rate the RBI watches. YoY computed from index.
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
const fetchedAt = new Date().toISOString();
const url = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";
const idhRows = (raw) => { const ds = Array.isArray(raw?.dataset) ? raw.dataset[0] : null; return Array.isArray(ds?.data) ? ds.data : []; };
const obsOf = (rows) => rows.map((r) => ({ date: String(r.Date || r.date || "").slice(0, 7), value: r.India == null ? null : Number(r.India) })).filter((r) => r.date && r.value != null).sort((a, b) => a.date.localeCompare(b.date));
const yoy = (pts) => { const m = new Map(pts.map((p) => [p.date, p.value])); return pts.map((p) => { const [y, mo] = p.date.split("-"); const prev = m.get(`${Number(y) - 1}-${mo}`); return prev ? { date: p.date, value: Math.round(((p.value - prev) / prev) * 1000) / 10 } : null; }).filter(Boolean); };
const man = [];
for (const [id, slug, title] of [["MOINCPACOR12M", "core", "CPI excluding food & fuel (core)"], ["MOINCPAXFD12M", "ex_food", "CPI excluding food"]]) {
  const raw = await fetchIndiaEconomySeries({ id, fields: "India" });
  await writeSnapshot("indiadatahub", id, raw);
  const idx = obsOf(idhRows(raw)), inf = yoy(idx);
  for (const [suffix, unit, o] of [["index", "index (2012=100)", idx], ["inflation", "% YoY", inf]]) {
    const a = createSeriesArtifact({ indicatorId: `prices.cpi.${slug}.${suffix}`, title: `${title} (${suffix})`, sourceId: "indiadatahub", sourceIndicatorId: id, sourceUrl: url, unit, frequency: "monthly", geography: { type: "country", id: "IND", name: "India" }, fetchedAt, observations: o, metadata: { sourceCategory: "Inflation", sourceSubcategory: "CPI core", derived: suffix === "inflation" ? "YoY from index" : undefined } });
    const pth = await writeSeriesArtifact({ sourceId: "indiadatahub", name: `indiadatahub.IN.prices.cpi.${slug}.${suffix}`, artifact: a });
    man.push({ status: "ready", indicatorId: `prices.cpi.${slug}.${suffix}`, observations: o.length, artifact: pth, fetchedAt });
  }
  console.log(`${slug}: index ${idx.length} (${idx[0].date}->${idx.at(-1).date}), inflation latest ${inf.at(-1).date}=${inf.at(-1).value}%`);
}
await writeSourceManifest("india-cpi-core", man);
console.log(`wrote ${man.length} core series`);
