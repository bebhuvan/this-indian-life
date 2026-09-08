// How much of what India imports has to come through the Strait of Hormuz.
//
// The June 2026 GEP ranks South Asia as the most Middle-East-dependent region on
// earth (figure 2.1.D: half of SAR economies source over 30% of their oil from the
// Gulf, a third for natural gas), but it never breaks that down by country or by
// commodity. This does, for India, from UN Comtrade partner detail.
//
// The answer is not uniform, and that asymmetry is the point. India's crude is
// diversified enough to reroute — Russia, the United States and West Africa all sell
// it. Its LPG is not: cooking gas comes almost entirely from the Gulf, on pressurised
// carriers that have no route around Hormuz. That is why, through the 2026 shock,
// India's crude import VOLUMES held flat while LPG volumes fell by roughly half.
//
// Gulf here means the seven Middle East economies the GEP itself uses in figure
// 2.1.D — Bahrain, Iran, Iraq, Kuwait, Qatar, Saudi Arabia and the UAE. Every one
// of them ships through Hormuz, with the partial exception of Saudi Arabia and the
// UAE, which have pipelines to the Red Sea and Fujairah respectively. That caveat
// is recorded in each artifact's metadata and must survive into the article.
//
// Run: node scripts/ingest-comtrade-hormuz-exposure.mjs

import { canonicalComtradeRows, fetchUnComtradeData } from "./adapters/un-comtrade.mjs";
import { createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const PERIOD = process.env.COMTRADE_EXPOSURE_YEAR || "2025";
const SOURCE_URL = "https://comtradeplus.un.org/";

// The GEP's own Middle East definition (figure 2.1.D note).
const GULF = new Set([48, 364, 368, 414, 634, 682, 784]); // BHR IRN IRQ KWT QAT SAU ARE
// Gulf exporters with at least a partial pipeline bypass around Hormuz.
const PARTIAL_BYPASS = { 682: "East-West pipeline to Yanbu on the Red Sea", 784: "Habshan-Fujairah pipeline to the Gulf of Oman" };

const COMMODITIES = [
  { slug: "crude_oil", cmdCode: "270900", label: "Crude petroleum oils" },
  // 271119 ("LPG n.e.c.") is small at $205m but 87% Gulf, and almost all of it is Iraq -
  // omitting it understated Iraq's LPG standing roughly thirteenfold in the partner table.
  { slug: "lpg", cmdCode: "271112,271113,271119", label: "LPG (propane, butane and other liquefied petroleum gases)" },
  { slug: "lng", cmdCode: "271111", label: "Liquefied natural gas" },
  { slug: "urea", cmdCode: "310210", label: "Urea" },
  { slug: "dap", cmdCode: "310530", label: "Diammonium phosphate (DAP)" },
  { slug: "petroleum_products", cmdCode: "2710", label: "Refined petroleum products" }
];

const manifest = [];
const summary = [];

for (const { slug, cmdCode, label } of COMMODITIES) {
  const raw = await fetchUnComtradeData({ cmdCode, flowCode: "M", period: PERIOD, partnerCode: "" });
  await writeSnapshot("un-comtrade", `hormuz-exposure.${slug}.${PERIOD}`, raw);
  const rows = canonicalComtradeRows(raw?.data || []);
  if (!rows.length) {
    console.warn(`  ${slug}: no rows for ${PERIOD}`);
    continue;
  }

  // Comtrade returns a "World" row (partnerCode 0) as the reported total. Use it as
  // the denominator rather than summing partners, which double counts nothing but
  // can fall short when small partners are suppressed.
  const byPartner = new Map();
  let worldValue = 0;
  let worldNetWeight = 0;
  for (const row of rows) {
    const value = Number(row.primaryValue) || 0;
    const weight = Number(row.netWgt) || 0;
    if (row.partnerCode === 0) {
      worldValue += value;
      worldNetWeight += weight;
      continue;
    }
    const existing = byPartner.get(row.partnerCode) || { partner: row.partnerDesc, partnerCode: row.partnerCode, value: 0, netWeightKg: 0 };
    existing.value += value;
    existing.netWeightKg += weight;
    byPartner.set(row.partnerCode, existing);
  }
  const partners = [...byPartner.values()].sort((a, b) => b.value - a.value);
  const denominator = worldValue || partners.reduce((sum, p) => sum + p.value, 0);

  const gulfValue = partners.filter((p) => GULF.has(p.partnerCode)).reduce((sum, p) => sum + p.value, 0);
  const gulfShare = denominator ? (gulfValue / denominator) * 100 : null;

  const tableRows = partners.map((p) => ({
    partner: p.partner,
    partnerCode: p.partnerCode,
    valueUsd: Math.round(p.value),
    sharePercent: denominator ? Number(((p.value / denominator) * 100).toFixed(2)) : null,
    netWeightKg: p.netWeightKg || null,
    gulf: GULF.has(p.partnerCode),
    pipelineBypass: PARTIAL_BYPASS[p.partnerCode] || null
  }));

  const artifact = createTableArtifact({
    indicatorId: `trade.comtrade.hormuz_exposure_${slug}`,
    title: `India's ${label} imports by partner, ${PERIOD}`,
    sourceId: "un-comtrade",
    sourceIndicatorId: `HS ${cmdCode} imports, reporter 699, ${PERIOD}`,
    sourceUrl: SOURCE_URL,
    unit: "current US$ and percent of total",
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    rows: tableRows,
    dimensions: ["partner", "valueUsd", "sharePercent", "netWeightKg", "gulf"],
    metadata: {
      hsCode: cmdCode,
      period: PERIOD,
      totalImportsUsd: Math.round(denominator),
      gulfImportsUsd: Math.round(gulfValue),
      gulfSharePercent: gulfShare == null ? null : Number(gulfShare.toFixed(1)),
      gulfDefinition: "Bahrain, Iran, Iraq, Kuwait, Qatar, Saudi Arabia and the United Arab Emirates - the Middle East grouping used in GEP June 2026 figure 2.1.D.",
      hormuzCaveat: "Gulf share is an upper bound on Hormuz exposure. Saudi Arabia can move crude to the Red Sea via the East-West pipeline and the UAE to Fujairah via the Habshan pipeline, both of which bypass the strait; neither has the capacity to replace tanker traffic, and neither carries LPG at scale.",
      denominatorNote: "Denominator is Comtrade's reported World total for the same HS code and flow, not the sum of listed partners.",
      canonicalisation: "Rows filtered with canonicalComtradeRows to drop second-partner, customs-procedure and mode-of-transport duplicates."
    }
  });

  const path = await writeSeriesArtifact({ sourceId: "un-comtrade", name: `un-comtrade.IN.trade.comtrade.hormuz_exposure_${slug}.${PERIOD}`, artifact });
  manifest.push({ status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, rows: tableRows.length, fetchedAt });
  summary.push({ slug, label, totalUsdBn: denominator / 1e9, gulfShare, top: tableRows.slice(0, 5) });
}

await mergeSourceManifest("un-comtrade", manifest);

console.log(`India import exposure by partner, ${PERIOD}\n`);
for (const s of summary) {
  console.log(`${s.label}  ($${s.totalUsdBn.toFixed(2)}bn)   Gulf share: ${s.gulfShare?.toFixed(1)}%`);
  for (const p of s.top) console.log(`    ${p.partner.padEnd(26)} ${String(p.sharePercent).padStart(5)}%${p.gulf ? "  [Gulf]" : ""}`);
  console.log();
}
