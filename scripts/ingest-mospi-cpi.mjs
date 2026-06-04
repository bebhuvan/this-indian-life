// Ingest MOSPI eSankhyiki CPI (base 2012) into Indica series artifacts.
//  - Group/subgroup level for ALL THREE sectors (Combined, Rural, Urban): index + inflation.
//  - Item level (Combined): a curated marquee set (Onion, Petrol, LPG, Gold, Rent, Tuition…).
//  - Derived: "purchasing power of ₹100 (2012)" from Combined General index.
// Source: https://esankhyiki.mospi.gov.in/macroindicators?product=cpi  (open, no auth)
import { fetchCpiIndex, fetchCpiItems, groupCpiRows, monthNumber } from "./adapters/mospi.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi";
const SECTOR_SLUG = { Rural: "rural", Urban: "urban", Combined: "combined" };

function slugify(name) {
  return String(name).replace(/-Overall$/i, "").toLowerCase()
    .replace(/&/g, " and ").replace(/\band\b/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}
const norm = (s) => String(s).toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

// Curated marquee items: slug -> substring matcher (against normalised item name).
const MARQUEE = [
  ["onion", "onion"], ["tomato", "tomato"], ["potato", "potato"],
  ["rice_pds", "rice - pds"], ["rice", "rice - other"], ["wheat_atta", "wheat/ atta - other"],
  ["milk", "milk: liquid"], ["eggs", "eggs (no"], ["chicken", "chicken"],
  ["pulses", "other pulses"], ["mustard_oil", "mustard oil"], ["refined_oil", "refined oil"],
  ["sugar", "sugar - other"], ["tea", "tea: leaf"],
  ["petrol", "petrol for vehicle"], ["diesel", "diesel for vehicle"], ["lpg", "lpg"],
  ["electricity", "electricity (std"], ["gold", "gold"], ["house_rent", "house rent"],
  ["tuition_fees", "tuition and other fees"], ["doctor_fee", "doctor"], ["medicine", "medicine (non"],
  ["bus_fare", "bus/tram fare"], ["railway_fare", "railway fare"], ["mobile_charges", "telephone charges: mobile"]
];
const MARQUEE_LABEL = {
  onion: "Onion", tomato: "Tomato", potato: "Potato", rice_pds: "Rice (PDS)", rice: "Rice (market)",
  wheat_atta: "Wheat / atta", milk: "Milk", eggs: "Eggs", chicken: "Chicken", pulses: "Pulses",
  mustard_oil: "Mustard oil", refined_oil: "Refined oil", sugar: "Sugar", tea: "Tea",
  petrol: "Petrol", diesel: "Diesel", lpg: "LPG cylinder", electricity: "Electricity", gold: "Gold",
  house_rent: "House rent", tuition_fees: "Tuition fees", doctor_fee: "Doctor's fee",
  medicine: "Medicine", bus_fare: "Bus fare", railway_fare: "Railway fare", mobile_charges: "Mobile charges"
};

const manifest = [];

async function writeSeries({ indicatorId, title, unit, frequency, observations, metadata }) {
  const clean = observations.filter((o) => o.value != null && Number.isFinite(o.value));
  if (clean.length < 2) return null;
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId: "mospi", sourceIndicatorId: metadata.sourceIndicatorId || indicatorId,
    sourceUrl, unit, frequency, geography: { type: "country", id: "IND", name: "India" },
    fetchedAt, observations: clean, metadata
  });
  const path = await writeSeriesArtifact({ sourceId: "mospi", name: `mospi.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: clean.length, artifact: path, fetchedAt, latest: clean[clean.length - 1] });
  return path;
}

async function pullGroups(sectorCode) {
  const all = [];
  for (const series of ["Current", "Back"]) {
    const raw = await fetchCpiIndex({ baseYear: 2012, stateCode: 99, sectorCode, series });
    all.push(...(raw?.data || []));
    await writeSnapshot("mospi", `cpi_2012_s${sectorCode}_${series}`, raw);
    console.log(`mospi cpi groups sector=${sectorCode} ${series}: ${(raw?.data || []).length} rows`);
  }
  return all;
}

try {
  // 1. Group/subgroup level, all three sectors.
  const rows = [...await pullGroups(3), ...await pullGroups(1), ...await pullGroups(2)];
  const byKey = groupCpiRows(rows);
  for (const { sector, group, subgroup, points } of byKey.values()) {
    const sec = SECTOR_SLUG[sector] || slugify(sector);
    const isOverall = /-Overall$/i.test(subgroup);
    const slug = isOverall ? slugify(group) : slugify(subgroup);
    const label = isOverall ? group : `${group}: ${subgroup}`;
    const base = `prices.cpi.${sec}.${slug}`;
    const meta = { sourceCategory: "Inflation", sourceSubcategory: "CPI", baseYear: "2012", group, subgroup, sector };
    await writeSeries({ indicatorId: `${base}.index`, title: `CPI index — ${label} (${sector})`, unit: "index (2012=100)", frequency: "monthly",
      observations: points.map((p) => ({ date: p.date, value: p.index })), metadata: { ...meta, sourceIndicatorId: `CPI2012_${sec}_${slug}_idx` } });
    await writeSeries({ indicatorId: `${base}.inflation`, title: `CPI inflation — ${label} (${sector})`, unit: "% YoY", frequency: "monthly",
      observations: points.map((p) => ({ date: p.date, value: p.inflation })), metadata: { ...meta, sourceIndicatorId: `CPI2012_${sec}_${slug}_inf` } });
  }

  // 2. Item level (Combined), marquee set.
  const itemRaw = [];
  for (const series of ["Current", "Back"]) {
    const raw = await fetchCpiItems({ baseYear: 2012, stateCode: 99, sectorCode: 3, series });
    itemRaw.push(...(raw?.data || []));
    await writeSnapshot("mospi", `cpi_items_2012_s3_${series}`, raw);
    console.log(`mospi cpi items ${series}: ${(raw?.data || []).length} rows`);
  }
  for (const [slug, matcher] of MARQUEE) {
    const rs = itemRaw.filter((r) => norm(r.item).includes(matcher));
    if (!rs.length) { console.warn(`  marquee item not found: ${slug} (${matcher})`); continue; }
    // Pick the single best-matching item name (shortest, to avoid grabbing a variant).
    const names = [...new Set(rs.map((r) => r.item))].sort((a, b) => a.length - b.length);
    const chosen = names[0];
    const pts = rs.filter((r) => r.item === chosen).map((r) => ({
      date: `${r.year}-${monthNumber(r.month)}`, index: r.index == null || r.index === "" ? null : Number(r.index),
      inflation: r.inflation == null || r.inflation === "" ? null : Number(r.inflation)
    })).sort((a, b) => a.date.localeCompare(b.date));
    const label = MARQUEE_LABEL[slug] || chosen;
    const meta = { sourceCategory: "Inflation", sourceSubcategory: "CPI item", baseYear: "2012", item: chosen, sector: "Combined" };
    await writeSeries({ indicatorId: `prices.cpi.item.${slug}.index`, title: `Price index — ${label}`, unit: "index (2012=100)", frequency: "monthly",
      observations: pts.map((p) => ({ date: p.date, value: p.index })), metadata: { ...meta, sourceIndicatorId: `CPI2012_item_${slug}_idx` } });
    await writeSeries({ indicatorId: `prices.cpi.item.${slug}.inflation`, title: `Price inflation — ${label}`, unit: "% YoY", frequency: "monthly",
      observations: pts.map((p) => ({ date: p.date, value: p.inflation })), metadata: { ...meta, sourceIndicatorId: `CPI2012_item_${slug}_inf` } });
  }

  // 3. Derived: purchasing power of ₹100 (2012) from Combined General index.
  const gen = [...byKey.values()].find((v) => v.sector === "Combined" && /^General/.test(v.group));
  if (gen) {
    const pp = gen.points.filter((p) => p.index).map((p) => ({ date: p.date, value: Math.round((10000 / p.index) * 10) / 10 }));
    await writeSeries({ indicatorId: "prices.cpi.combined.purchasing_power", title: "What ₹100 from 2012 buys today", unit: "₹ (2012 rupees)", frequency: "monthly",
      observations: pp, metadata: { sourceCategory: "Inflation", sourceSubcategory: "CPI", derived: "10000 / (CPI General index, 2012=100)", sourceIndicatorId: "DERIVED_purchasing_power" } });
  }

  await writeSourceManifest("mospi", manifest);
  console.log(`\nWrote ${manifest.length} MOSPI CPI series.`);
} catch (error) {
  console.error("MOSPI CPI ingest failed:", error.message);
  process.exit(1);
}
