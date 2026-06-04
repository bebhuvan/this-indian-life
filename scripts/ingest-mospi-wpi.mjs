// Ingest MOSPI eSankhyiki WPI (Wholesale Price Index, base 2011-12) top-level
// aggregates: All commodities, Primary articles, Fuel & power, Manufactured
// products, Food index. WPI has no inflation field, so YoY is computed here.
// Source: https://esankhyiki.mospi.gov.in/macroindicators?product=wpi
import { fetchWpi, monthNumber } from "./adapters/mospi.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://esankhyiki.mospi.gov.in/macroindicators?product=wpi";
const empty = (v) => v == null || v === "";

const TOPS = [
  ["all_commodities", "Wholesale price index", "WPI — all commodities"],
  ["primary_articles", "Primary articles", "WPI — primary articles"],
  ["fuel_power", "Fuel & power", "WPI — fuel & power"],
  ["manufactured", "Manufactured products", "WPI — manufactured products"],
  ["food", "Food index", "WPI — food index"]
];

function yoy(points) {
  const byDate = new Map(points.map((p) => [p.date, p.value]));
  return points.map((p) => {
    const [y, m] = p.date.split("-");
    const prev = byDate.get(`${Number(y) - 1}-${m}`);
    return { date: p.date, value: prev ? Math.round(((p.value - prev) / prev) * 1000) / 10 : null };
  });
}

const manifest = [];
async function writeSeries({ indicatorId, title, unit, observations, metadata }) {
  const clean = observations.filter((o) => o.value != null && Number.isFinite(o.value));
  if (clean.length < 2) return;
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId: "mospi", sourceIndicatorId: metadata.sourceIndicatorId || indicatorId,
    sourceUrl, unit, frequency: "monthly", geography: { type: "country", id: "IND", name: "India" },
    fetchedAt, observations: clean, metadata
  });
  const path = await writeSeriesArtifact({ sourceId: "mospi", name: `mospi.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: clean.length, artifact: path, fetchedAt });
}

try {
  // 5-level tree is ~147k rows; the API caps a page at 100k, so paginate.
  const rows = [];
  let page = 1, total = Infinity;
  while (rows.length < total) {
    const raw = await fetchWpi({ baseYear: "2011-12", limit: 100000, page });
    const batch = raw?.data || [];
    total = raw?.meta_data?.totalRecords ?? batch.length;
    rows.push(...batch);
    if (page === 1) await writeSnapshot("mospi", "wpi_2011-12_p1", raw);
    console.log(`mospi wpi base 2011-12 page ${page}: ${batch.length} rows (${rows.length}/${total})`);
    if (!batch.length) break;
    page += 1;
  }

  for (const [slug, majorgroup, title] of TOPS) {
    const series = rows
      .filter((r) => r.majorgroup === majorgroup && empty(r.group) && empty(r.subgroup) && empty(r.sub_subgroup) && empty(r.item))
      .map((r) => ({ date: `${r.year}-${monthNumber(r.month)}`, value: r.index_value == null || r.index_value === "" ? null : Number(r.index_value) }))
      .filter((p) => p.value != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    const meta = { sourceCategory: "Inflation", sourceSubcategory: "WPI", baseYear: "2011-12", majorgroup };
    await writeSeries({ indicatorId: `prices.wpi.${slug}.index`, title: `${title} (index)`, unit: "index (2011-12=100)",
      observations: series, metadata: { ...meta, sourceIndicatorId: `WPI_${slug}_idx` } });
    await writeSeries({ indicatorId: `prices.wpi.${slug}.inflation`, title: `${title} (inflation)`, unit: "% YoY",
      observations: yoy(series), metadata: { ...meta, derived: "YoY % from monthly index", sourceIndicatorId: `WPI_${slug}_inf` } });
    console.log(`  wpi ${slug}: ${series.length} index points`);
  }

  await writeSourceManifest("mospi-wpi", manifest);
  console.log(`\nWrote ${manifest.length} WPI series.`);
} catch (error) {
  console.error("MOSPI WPI ingest failed:", error.message);
  process.exit(1);
}
