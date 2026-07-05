// Curated, sourced rupee exchange-rate chronology (hand-authored from a
// verified research pass; every figure traces to a cited source, with a
// confidence flag where primary sourcing was unavailable). Produces:
//   1. regime_events  (table) — the dated devaluations / regime changes
//   2. pre-1973 par-value annual nominal INR/USD (series, 1947-1972)
//   3. a spliced long nominal INR/USD annual line 1947-2026 (pre-1973 par
//      anchors + FRED monthly averaged to annual from 1973)
// Pre-1993 the rupee was pegged to sterling, so ₹/US$ are implied par values,
// exact for the peg years. Use ranges, not false precision, where flagged.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

// --- 1. Events (verified; see source per row) ---
const EVENTS = [
  { date: "1947", event: "Independence: inherited sterling peg", rate_before: null, rate_after: 3.30, pct_vs_usd: null, regime: "Fixed sterling peg", note: "£1=₹13.33; ≈₹3.30/US$ (IMF par value, Dec 1946). NOT ₹4.76 — that came after 1949.", confidence: "high", source: "https://www.epw.in/system/files/pdf/1949_1/40/devaluation_of_the_rupee.pdf" },
  { date: "1949-09-19", event: "Sterling devaluation, rupee follows", rate_before: 3.30, rate_after: 4.76, pct_vs_usd: -30.5, regime: "Fixed sterling peg", note: "Par value cut 30.23→21.00 US cents; rupee held ₹13.33/£ as sterling fell $4.03→$2.80.", confidence: "high", source: "https://www.epw.in/system/files/pdf/1949_1/40/devaluation_of_the_rupee.pdf" },
  { date: "1966-06-06", event: "Major devaluation", rate_before: 4.76, rate_after: 7.50, pct_vs_usd: -36.5, regime: "Bretton Woods par-value peg", note: "-36.5% in foreign-currency terms = +57.5% in rupee terms (same move). BoP crisis, 1965 war, drought, aid suspension, IMF conditionality.", confidence: "high", source: "https://www.elibrary.imf.org/display/book/9781451971477/ch023.xml" },
  { date: "1971-12", event: "Bretton Woods collapse; re-pegged to sterling", rate_before: 7.50, rate_after: 7.50, pct_vs_usd: 0, regime: "Fixed peg to pound sterling", note: "After Nixon shock/Smithsonian, rupee linked to sterling £1=₹18.9677 (±2.25% band). [₹18.9677 well-attested-secondary, not primary-confirmed]", confidence: "medium", source: "https://mospi.gov.in/sites/default/files/Statistical_year_book_india_chapters/Exchange.pdf" },
  { date: "1975-09", event: "De-linked from sterling → basket peg", rate_before: null, rate_after: null, pct_vs_usd: null, regime: "Managed float vs undisclosed basket", note: "Late Sept 1975 (24-25th). ~5-currency basket, weights confidential; sterling kept as intervention currency. Rupee had drifted ~20% down with weak sterling 1971-75.", confidence: "high", source: "https://mospi.gov.in/sites/default/files/Statistical_year_book_india_chapters/Exchange.pdf" },
  { date: "1991-07-01", event: "Devaluation, step 1 (\"hop\")", rate_before: 21.1, rate_after: 23.1, pct_vs_usd: -9, regime: "End of sterling-anchored peg", note: "~9% vs sterling (the intervention currency). Venkitaramanan Governor; Rangarajan (Dep. Gov.) executed; Manmohan Singh FM. BoP crisis, ~2-3 weeks of reserves.", confidence: "high", source: "https://www.rbi.org.in/upload/Publications/PDFs/56513.pdf" },
  { date: "1991-07-03", event: "Devaluation, step 2 (\"jump\")", rate_before: 23.1, rate_after: 26.0, pct_vs_usd: -19, regime: "End of sterling-anchored peg", note: "~11% vs sterling; cumulative ≈18-19% vs US$ (RBI: ~18%). \"9%/11%\" are STERLING-leg, not dollar-leg.", confidence: "high", source: "https://www.rbi.org.in/commonman/english/history/Scripts/Chron1991to2000.aspx" },
  { date: "1992-03-01", event: "LERMS (dual exchange rate)", rate_before: null, rate_after: null, pct_vs_usd: null, regime: "Transitional dual rate", note: "40% of FX receipts surrendered to RBI at official rate, 60% at market rate.", confidence: "high", source: "https://www.rbi.org.in/scripts/FS_Overview.aspx?fn=5" },
  { date: "1993-03-01", event: "Unification to market-determined rate", rate_before: null, rate_after: 31.4, pct_vs_usd: null, regime: "Single market-determined / managed float", note: "Dual rates merged; ≈₹31-31.5/US$ at unification [secondary-sourced; use a range].", confidence: "medium", source: "https://www.rbi.org.in/scripts/FS_Overview.aspx?fn=5" },
  { date: "1994-08-20", event: "Current-account convertibility (IMF Art. VIII)", rate_before: null, rate_after: null, pct_vs_usd: null, regime: "Managed float, current-acct convertible", note: "India accepted IMF Article VIII obligations; capital account stayed controlled.", confidence: "high", source: "https://www.rbi.org.in/scripts/FS_Overview.aspx?fn=5" }
];

await writeSeriesArtifact({
  sourceId: "rupee-chronology",
  name: "rupee-chronology.IN.fx.regime_events",
  artifact: createTableArtifact({
    indicatorId: "IN.fx.regime_events",
    title: "Rupee devaluations and exchange-rate regime changes (1947-1994)",
    sourceId: "rupee-chronology",
    sourceIndicatorId: "IN.fx.regime_events",
    sourceUrl: "https://www.rbi.org.in/scripts/FS_Overview.aspx?fn=5",
    unit: "INR per USD / event",
    fetchedAt,
    rows: EVENTS,
    dimensions: Object.keys(EVENTS[0]),
    metadata: { curated: true, method: "verified research pass with per-row citations + confidence flags", note: "pre-1993 ₹/US$ are implied par values (rupee pegged to sterling)" }
  })
});
console.log(`wrote regime_events: ${EVENTS.length} events`);

// --- 2. Pre-1973 par-value annual nominal INR/USD (1947-1972) ---
// Fixed pegs => the annual value IS the par value (exact), except the 1971-72
// sterling-drift transition which we mark approximate.
const PRE1973 = [];
const par = (y, v) => PRE1973.push({ date: String(y), value: v });
for (let y = 1947; y <= 1948; y++) par(y, 3.30);   // sterling par ≈3.30
for (let y = 1949; y <= 1965; y++) par(y, 4.76);   // post-Sept-1949 par (1949 mid-year change; annual≈4.76)
for (let y = 1966; y <= 1971; y++) par(y, 7.50);   // post-June-1966 par
par(1972, 7.59);                                    // sterling-peg drift (approx)
await writeSeriesArtifact({
  sourceId: "rupee-chronology",
  name: "rupee-chronology.IN.fx.inr_usd_par_pre1973.annual",
  artifact: createSeriesArtifact({
    indicatorId: "IN.fx.inr_usd_par_pre1973.annual",
    title: "INR per USD, pre-1973 par values (annual)",
    sourceId: "rupee-chronology",
    sourceIndicatorId: "IN.fx.inr_usd_par_pre1973.annual",
    sourceUrl: "https://www.epw.in/system/files/pdf/1949_1/40/devaluation_of_the_rupee.pdf",
    unit: "INR per USD",
    frequency: "annual",
    fetchedAt,
    observations: PRE1973,
    metadata: { curated: true, note: "fixed-peg par values (exact for peg years); 1972 sterling-drift approx; 1949 & 1966 are mid-year changes shown at the new par" }
  })
});
console.log(`wrote pre-1973 par series: ${PRE1973.length} years`);

// --- 3. Spliced long nominal INR/USD annual 1947-2026 (par anchors + FRED) ---
const fred = JSON.parse(await readFile("data/series/fred.IN.fx.inr_usd.monthly.json", "utf8")).observations;
const byYear = {};
for (const o of fred) {
  if (o.value == null) continue;
  const y = o.date.slice(0, 4);
  (byYear[y] ||= []).push(o.value);
}
const long = [...PRE1973];
for (const y of Object.keys(byYear).sort()) {
  const arr = byYear[y];
  long.push({ date: y, value: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 });
}
await writeSeriesArtifact({
  sourceId: "rupee-chronology",
  name: "rupee-chronology.IN.fx.inr_usd_long.annual",
  artifact: createSeriesArtifact({
    indicatorId: "IN.fx.inr_usd_long.annual",
    title: "INR per USD, long annual series (1947-2026)",
    sourceId: "rupee-chronology",
    sourceIndicatorId: "IN.fx.inr_usd_long.annual",
    sourceUrl: "https://fred.stlouisfed.org/series/EXINUS",
    unit: "INR per USD",
    frequency: "annual",
    fetchedAt,
    observations: long,
    metadata: { curated: true, splice: "pre-1973 par values + FRED EXINUS annual average 1973->", note: "pre-1973 are fixed-peg par values, not market averages" }
  })
});
console.log(`wrote long nominal series: ${long.length} years (${long[0].date} -> ${long.at(-1).date})`);
