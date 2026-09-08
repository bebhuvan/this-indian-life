// Independent crude, LPG and urea benchmarks — the verification layer for the
// 2026 energy shock, and the source of the price numbers that should actually be
// quoted.
//
// WHY THIS EXISTS. Two price series for India's oil are easy to confuse, and the
// difference matters during a shock:
//
//   Indian basket (ENPTIBCRPR11M / PPAC)  - a FOB reference price, a weighted blend
//        of Brent Dated (sweet) and the Oman/Dubai average (sour), reflecting the
//        grade mix Indian refineries took that month.
//   India crude import price (ENPTAECRPR11M) - what India actually paid on landing,
//        which is what shows up in the import bill and the current account.
//
// In calm months they sit within a dollar of each other. Through the shock they came
// apart by up to $18/bbl, because cargoes are priced weeks before they land. The
// basket spiked in March and fell back in June; the realised import price peaked two
// months later, in May, and was still above the basket in July.
//
//   month     Brent   Dubai   Indian basket   India import price
//   2026-02    71.1    68.4        69.0            65.6
//   2026-03   103.7    91.9       113.5            95.7
//   2026-04   120.4    92.7       114.5           115.3
//   2026-05   107.5    94.7       106.2           118.6   <- realised peak
//   2026-06    85.4    77.7        83.2           101.4
//   2026-07    83.4    76.7        82.0            87.4
//
// TWO FINDINGS TO CARRY INTO ANY ARTICLE:
//
// 1. Quote the IMPORT PRICE, not the basket, for "what India paid". The realised
//    peak was $118.6/bbl in May 2026, +81% on February - not April, and not $114.
//
// 2. PPAC's March 2026 basket print of $113.49 is not reproducible from its own
//    stated methodology. The basket is a blend of Brent Dated and Oman/Dubai, but
//    March Brent averaged $103.7 and Dubai Fateh $91.9, so no weighting of the two
//    can yield $113.5. Treat that single month as suspect. It does not affect the
//    import bill, which comes from separate volume and value tables.
//
// The import price series independently reproduces the landed cost derived from
// PPAC's own monthly volume and value tables (value/tonne / 7.33) to the cent in
// April, May, June and July - so the PPAC trade data itself is sound.
//
// Source: IndiaDataHub, restating the World Bank Pink Sheet (Brent, Dubai, urea) and
// PPAC / Ministry of Petroleum and Natural Gas (Indian basket, import prices).
// Run: node scripts/ingest-idh-oil-benchmarks.mjs

import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createSeriesArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const PINK_SHEET = "https://www.worldbank.org/en/research/commodity-markets";
const PPAC_PRICES = "https://ppac.gov.in/prices/international-prices-of-crude-oil";

const SERIES = [
  {
    slug: "brent_monthly", id: "CPWBBRENTO11M", geoId: "WLD", geoName: "World",
    title: "Brent crude, monthly average", unit: "US$ per barrel", url: PINK_SHEET,
    note: "World Bank Pink Sheet. Use to sanity-check the GEP's daily Brent series."
  },
  {
    slug: "dubai_fateh_monthly", id: "CPWBDUBAIO11M", geoId: "WLD", geoName: "World",
    title: "Dubai Fateh crude, monthly average", unit: "US$ per barrel", url: PINK_SHEET,
    note: "The Gulf sour benchmark. Roughly 60-70% of the Indian basket by weight."
  },
  {
    slug: "indian_basket_monthly", id: "ENPTIBCRPR11M", geoId: "IND", geoName: "India",
    title: "Indian crude basket, monthly average (FOB reference price)", unit: "US$ per barrel", url: PPAC_PRICES,
    note: "FOB reference price, not what India paid on landing. Reproduces the PPAC pull in ppac.IN.energy.ppac.crude_basket_price_monthly exactly. The March 2026 print of $113.49 exceeds both Brent and Dubai that month and is not reproducible from the stated blend - treat it as suspect."
  },
  {
    slug: "india_crude_import_price_monthly", id: "ENPTAECRPR11M", geoId: "IND", geoName: "India",
    title: "India's average crude oil import price, monthly (realised landed cost)", unit: "US$ per barrel", url: PPAC_PRICES,
    note: "What India actually paid on landing. This is the series to quote for the import bill and the current account. Realised peak $118.6/bbl in May 2026, two months after the FOB basket peaked, because cargoes are priced weeks before they land."
  },
  {
    slug: "india_lpg_import_price_monthly", id: "ENPTAIPLPG11M", geoId: "IND", geoName: "India",
    title: "India's average LPG import price, monthly", unit: "US$ per tonne", url: PPAC_PRICES,
    note: "Pairs with ppac.IN.energy.ppac.lpg_import_quantity_monthly: through the shock India paid far more per tonne for far fewer tonnes."
  },
  {
    slug: "urea_price_monthly", id: "CPWBUREAFE11M", geoId: "WLD", geoName: "World",
    title: "International urea price, monthly average", unit: "US$ per tonne", url: PINK_SHEET,
    note: "World Bank Pink Sheet. Cross-checks the GEP's daily urea index (figure 1.1.B)."
  }
];

function observationsFrom(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  const rows = Array.isArray(dataset?.data) ? dataset.data : [];
  return {
    dataset,
    observations: rows
      .map((row) => ({ date: String(row.Date || "").slice(0, 7), value: row.India == null ? null : Number(row.India) }))
      .filter((row) => /^\d{4}-\d{2}$/.test(row.date) && row.value != null)
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}

const manifest = [];
const collected = {};

for (const spec of SERIES) {
  const raw = await fetchIndiaEconomySeries({ id: spec.id, fields: "India" });
  await writeSnapshot("indiadatahub", `oil-benchmark.${spec.id}`, raw);
  const { dataset, observations } = observationsFrom(raw);
  if (!observations.length) {
    console.warn(`  ${spec.id}: no rows`);
    continue;
  }
  collected[spec.slug] = Object.fromEntries(observations.map((o) => [o.date, o.value]));
  const artifact = createSeriesArtifact({
    indicatorId: `energy.prices.${spec.slug}`,
    title: spec.title,
    sourceId: "indiadatahub",
    sourceIndicatorId: spec.id,
    sourceUrl: spec.url,
    unit: spec.unit,
    frequency: "monthly",
    geography: { type: "country", id: spec.geoId, name: spec.geoName },
    fetchedAt,
    observations,
    metadata: {
      idhTitle: dataset?.Title,
      idhUnit: dataset?.Unit,
      upstream: dataset?.Source,
      distributor: "https://feeds.indiadatahub.com",
      note: spec.note,
      conflictStart: "2026-02-27"
    }
  });
  const path = await writeSeriesArtifact({ sourceId: "indiadatahub", name: `indiadatahub.${spec.geoId === "IND" ? "IN" : "WLD"}.energy.prices.${spec.slug}`, artifact });
  manifest.push({ status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: spec.id, artifact: path, observations: observations.length, fetchedAt });
  console.log(`  ${artifact.indicatorId.padEnd(46)} ${String(observations.length).padStart(4)} obs  ${observations.at(0).date}..${observations.at(-1).date}`);
}

await mergeSourceManifest("indiadatahub", manifest);

const months = Object.keys(collected.brent_monthly || {}).filter((m) => m >= "2025-12").sort();
console.log("\n month     Brent   Dubai  Basket  Import   LPG$/t  Urea$/t");
for (const m of months) {
  const f = (slug, dp = 1) => {
    const v = collected[slug]?.[m];
    return (v == null ? "-" : v.toFixed(dp)).padStart(7);
  };
  console.log(` ${m} ${f("brent_monthly")} ${f("dubai_fateh_monthly")} ${f("indian_basket_monthly")} ${f("india_crude_import_price_monthly")} ${f("india_lpg_import_price_monthly")} ${f("urea_price_monthly")}`);
}
