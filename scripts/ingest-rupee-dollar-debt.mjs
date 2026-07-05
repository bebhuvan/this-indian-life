// India's US-dollar debt, from BIS Global Liquidity Indicators (WS_GLI).
// The missing piece in the rupee article's "who does a weak rupee hurt?" story:
// dollar-denominated credit to Indian non-bank borrowers. When the rupee falls,
// the rupee cost of servicing this debt rises - the 2013 taper-tantrum squeeze.
// Series: USD-denominated credit to India, borrowers = non-banks (N), all
// lending sources (A), all instruments (B = loans + debt securities), US$ value.
import { fetchBisData } from "./adapters/bis.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const { raw, series } = await fetchBisData({ flow: "WS_GLI", key: "all", startPeriod: "2005-Q1" });

const pick = series.find((s) => {
  const d = s.dims;
  return d["Currency of denomination"] === "USD" && d["Borrowers' country"] === "IN" &&
    d["Borrowers' sector"] === "N" && d["Lending sector"] === "A" &&
    d["Type of instruments"] === "B" && d["Unit of measure"] === "USD";
});
if (!pick) throw new Error("WS_GLI: USD-credit-to-India non-bank series not found");

await writeSnapshot("bis", "WS_GLI.IN.usd_credit", { raw: { picked: pick.dims }, series: pick.observations });

// "2005-Q1" -> "2005-03" (quarter-end month) so it renders like the monthly series
const qEnd = { Q1: "03", Q2: "06", Q3: "09", Q4: "12" };
const observations = pick.observations
  .filter((o) => o.value != null)
  .map((o) => {
    const [y, q] = o.period.split("-");
    return { date: `${y}-${qEnd[q] || "12"}`, value: Math.round((o.value / 1000) * 1000) / 1000 }; // US$mn -> US$bn
  });

const indicatorId = "IN.extfin.usd_credit_nonbank.quarterly";
const artifact = createSeriesArtifact({
  indicatorId,
  title: "US-dollar credit to Indian non-bank borrowers",
  sourceId: "bis",
  sourceIndicatorId: "WS_GLI",
  sourceUrl: "https://data.bis.org/topics/GLI/data",
  unit: "US$ billion",
  frequency: "quarterly",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt,
  observations,
  metadata: { biskey: pick.key, note: "BIS Global Liquidity Indicators: USD-denominated credit (loans + debt securities) to non-bank borrowers resident in India, all lenders" }
});
await writeSeriesArtifact({ sourceId: "bis", name: `bis.${indicatorId}`, artifact });
console.log(`${indicatorId}: ${observations.length} obs (${observations[0].date} -> ${observations.at(-1).date}), latest=$${observations.at(-1).value}bn`);
