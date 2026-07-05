// Rebuild "value of the rupee" vs USD/EUR/GBP/JPY from FRED daily rates so the
// chart "Did the rupee fall, or did the dollar rise?" runs to the present instead
// of stopping at Jan 2024 (the old RBI reference-rate spreadsheet's last month).
//
// Method (unchanged from the original Python build, just a fresher source):
//   INR per USD = DEXINUS
//   INR per EUR = DEXINUS * DEXUSEU   (USD per EUR)
//   INR per GBP = DEXINUS * DEXUSUK   (USD per GBP)
//   INR per JPY = DEXINUS / DEXJPUS   (JPY per USD)
//   value of the rupee vs c = 100 * rate(1999-01) / rate(month)   (down = weaker)
// Daily series are collapsed to monthly averages; base month 1999-01 = 100.
import { fetchFredSeries } from "./adapters/fred.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const FRED_PAGE = (id) => `https://fred.stlouisfed.org/series/${id}`;

// monthly average of a daily FRED series -> Map "YYYY-MM" -> value
async function monthly(seriesId) {
  const { meta, observations } = await fetchFredSeries(seriesId, { startDate: "1998-12-01" });
  await writeSnapshot("fred", seriesId, { meta, observations });
  const bucket = new Map();
  for (const o of observations) {
    if (o.value == null) continue;
    const m = o.date.slice(0, 7);
    if (!bucket.has(m)) bucket.set(m, []);
    bucket.get(m).push(o.value);
  }
  const out = new Map();
  for (const [m, arr] of bucket) out.set(m, arr.reduce((a, b) => a + b, 0) / arr.length);
  return out;
}

const inrUsd = await monthly("DEXINUS"); // INR per USD
const usdEur = await monthly("DEXUSEU"); // USD per EUR
const usdGbp = await monthly("DEXUSUK"); // USD per GBP
const jpyUsd = await monthly("DEXJPUS"); // JPY per USD

// INR per <currency> for each month present in INR/USD
function inrPer(curr) {
  const out = new Map();
  for (const [m, inr] of inrUsd) {
    let rate = null;
    if (curr === "usd") rate = inr;
    else if (curr === "eur" && usdEur.has(m)) rate = inr * usdEur.get(m);
    else if (curr === "gbp" && usdGbp.has(m)) rate = inr * usdGbp.get(m);
    else if (curr === "jpy" && jpyUsd.has(m)) rate = inr / jpyUsd.get(m);
    if (rate != null && rate > 0) out.set(m, rate);
  }
  return out;
}

const LABEL = { usd: "US dollar", eur: "euro", gbp: "pound", jpy: "yen" };
const BASE = "1999-01";
// drop the in-progress current month (a partial daily average would read noisy)
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

for (const curr of ["usd", "eur", "gbp", "jpy"]) {
  const rates = inrPer(curr);
  const baseRate = rates.get(BASE);
  if (!baseRate) throw new Error(`no base ${BASE} rate for ${curr}`);
  const months = [...rates.keys()].filter((m) => m >= BASE && m < CURRENT_MONTH).sort();
  const observations = months.map((m) => ({ date: m, value: Math.round((100 * baseRate / rates.get(m)) * 10) / 10 }));
  const indicatorId = `derived.IN.fx.rupee_value_vs_${curr}`;
  const artifact = createSeriesArtifact({
    indicatorId,
    title: `Rupee's value against the ${LABEL[curr]} (base = 100)`,
    sourceId: "rupee-derived",
    sourceIndicatorId: indicatorId,
    sourceUrl: FRED_PAGE("DEXINUS"),
    unit: "index (1999-01=100)",
    frequency: "monthly",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: { derived: `100 x base/(INR per ${curr.toUpperCase()}); monthly avg of FRED daily rates (DEXINUS x DEXUSEU/DEXUSUK / DEXJPUS); 1999-01=100; down = rupee weaker` }
  });
  await writeSeriesArtifact({ sourceId: "rupee-derived", name: `rupee-derived.${indicatorId}`, artifact });
  console.log(`${indicatorId}: ${observations.length} obs (${observations[0].date} -> ${observations.at(-1).date}) latest=${observations.at(-1).value}`);
}
console.log("done");
