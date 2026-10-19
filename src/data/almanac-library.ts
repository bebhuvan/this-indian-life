// The chart library: every Almanac form drawn from real data already on the site, with
// the data shape it serves and when to avoid it. Built at compile time for /library/.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  INK, SCALES, heatStrip, tileGrid, scatterFit, parade, sensitivity, dumbbell, rankSlope, beeswarm, dayRibbon, unitChart,
  stripes, intervalPlot, ridgeline, calendarHeat, connectedScatter, waterfall, type Stops,
} from "./almanac";
import { tfrRows, tfrSeries, FRACTILE_WIDTHS, REPLACEMENT } from "./almanac-home";

const read = (file: string) => JSON.parse(readFileSync(resolve(process.cwd(), "data/series", file), "utf8"));
const obs = (file: string): Array<[string, number]> => (read(file).observations as Array<{ date: string; value: number | null }>).filter((o) => o.value != null).map((o) => [o.date, o.value as number]);
const yearly = (file: string): Array<[number, number]> => obs(file).map(([d, v]) => [Number(d.slice(0, 4)), v] as [number, number]).sort((a, b) => a[0] - b[0]);

export type LibraryEntry = { key: string; name: string; shape: string; use: string; avoid: string; svg: string; svgM: string; note: string; source: string };
const pair = (d: string, m: string) => ({ svg: d.replace('class="viz-svg alm"', 'class="viz-svg viz-d alm"'), svgM: m.replace('class="viz-svg alm"', 'class="viz-svg viz-m alm"') });
const fmtPct = (v: number) => `${Math.round(v)}%`;
const SHORT: Record<string, string> = { "Andhra Pradesh": "Andhra Pr.", "Madhya Pradesh": "Madhya Pr.", "Uttar Pradesh": "Uttar Pr.", "West Bengal": "W. Bengal", "Himachal Pradesh": "Himachal", "Jammu & Kashmir": "J&K" };

const entries: LibraryEntry[] = [];

// 1. heat strip
{
  const from = 1971, to = 2023, o = { stops: SCALES.fertility, from, to, legendTicks: [1.5, 2.1, 3, 4, 5], legendMark: { value: REPLACEMENT, label: "replacement" }, hot: (v: number) => v > REPLACEMENT, label: "Fertility by state" };
  entries.push({ key: "heatStrip", name: "Heat strip", shape: "Many units × many years, one measure", use: "When each unit crossed a threshold, and in what order", avoid: "Exact values matter more than the pattern",
    ...pair(heatStrip(tfrRows, { ...o, width: 620, rowH: 15, gap: 4, labelW: 92, rightW: 36, compact: true }), heatStrip(tfrRows, { ...o, width: 350, rowH: 14, gap: 3, labelW: 70, rightW: 30, compact: true })),
    note: "Births per woman by state, 1971 to 2023", source: "Sample Registration System, via Data For India" });
}
// 2. tile map
{
  const POS: Record<string, [string, number, number]> = {
    jammu_and_kashmir: ["J&K", 2, 0], punjab: ["Punjab", 2, 1], himachal_pradesh: ["Himachal", 3, 1], uttarakhand: ["Uttarakhand", 4, 1],
    rajasthan: ["Rajasthan", 1, 2], haryana: ["Haryana", 2, 2], delhi: ["Delhi", 3, 2], uttar_pradesh: ["Uttar Pr.", 4, 2], bihar: ["Bihar", 5, 2], assam: ["Assam", 6, 2],
    gujarat: ["Gujarat", 1, 3], madhya_pradesh: ["Madhya Pr.", 2, 3], chhattisgarh: ["Chhattisgarh", 3, 3], jharkhand: ["Jharkhand", 4, 3], west_bengal: ["W. Bengal", 5, 3],
    maharashtra: ["Maharashtra", 1, 4], telangana: ["Telangana", 2, 4], odisha: ["Odisha", 4, 4], karnataka: ["Karnataka", 1, 5], andhra_pradesh: ["Andhra Pr.", 2, 5],
    kerala: ["Kerala", 1, 6], tamil_nadu: ["Tamil Nadu", 2, 6],
  };
  const tiles = Object.entries(POS).map(([k, [label, col, row]]) => ({ label, col, row, points: tfrSeries(k) }));
  const o = { reference: tfrSeries("india"), threshold: REPLACEMENT, thresholdLabel: "2.1", from: 1971, to: 2023, yMin: 1, yMax: 6.8, label: "Fertility by state, arranged like the map" };
  entries.push({ key: "tileGrid", name: "Tile-map small multiples", shape: "One time series per state", use: "Regional patterns, with every state given equal space", avoid: "Area or population should dominate the read",
    ...pair(tileGrid(tiles, { ...o, tw: 78, th: 62, g: 9 }), tileGrid(tiles, { ...o, tw: 44, th: 40, g: 6 })),
    note: "Births per woman, 1971 to 2023; shading is the gap to 2.1, the grey line is India", source: "Sample Registration System, via Data For India" });
}
// 3. scatter with fit
{
  const rows = read("derived.IN.education_vs_tfr.json").rows as Array<{ label: string; x: number; y: number }>;
  const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_");
  const pop = (label: string) => { const f = `states.population.${slug(label)}.json`; return existsSync(resolve(process.cwd(), "data/series", f)) ? yearly(f).at(-1)![1] : label === "Jammu & Kashmir" ? 12541302 : undefined; };
  const named = ["Bihar", "Uttar Pradesh", "Kerala", "Tamil Nadu", "West Bengal", "Madhya Pradesh"];
  const pts = rows.map((r) => ({ label: r.label, short: SHORT[r.label], x: r.x, y: r.y, size: pop(r.label), hot: r.y > REPLACEMENT }));
  const mk = (W: number, H: number) => scatterFit(pts.map((p) => ({ ...p, place: (named.includes(p.label) ? (p.x > 70 ? "t" : p.label === "West Bengal" || p.label === "Madhya Pradesh" ? "l" : "r") : undefined) as "t" | "l" | "r" | undefined })), {
    x: [20, 90], y: [1, 3], xTicks: W < 700 ? [20, 40, 60, 80] : [20, 30, 40, 50, 60, 70, 80, 90], yTicks: [1, 1.5, 2, 2.5, 3], xFmt: fmtPct, xTitle: "Women with 10+ years of schooling", yTitle: "Births per woman, 2023",
    refY: { value: 2.1, label: "replacement" }, width: W, height: H, sizeKey: [[2e7, "2 cr"], [1e8, "10 cr"], [2.4e8, "24 cr"]], sizeTitle: "Population", label: "Schooling against fertility",
  });
  const d = mk(620, 380), m = mk(350, 330);
  entries.push({ key: "scatterFit", name: "Scatter with a fit", shape: "Two measures for the same units", use: "An association, with the outliers named and the correlation printed", avoid: "Readers will take it as cause; say so in the title",
    ...pair(d.svg, m.svg), note: `Circles sized by population; least-squares line with its 95% band, r = −${Math.abs(d.stats!.r).toFixed(2)}`, source: "NFHS-6 2023-24; SRS 2023; RBI state population" });
}
// 4. parade
{
  const ru = (read("mospi-hces.IN.hces_fractile_mpce_rural.json").rows as Array<{ value: number }>).map((r) => r.value);
  const ur = (read("mospi-hces.IN.hces_fractile_mpce_urban.json").rows as Array<{ value: number }>).map((r) => r.value);
  const ser = [{ label: "Urban", color: INK.neel, values: ur, fill: 0.07 }, { label: "Rural", color: INK.hara, values: ru, fill: 0.14 }];
  entries.push({ key: "parade", name: "Parade", shape: "Values for fractiles of a population", use: "Inequality, with each group as wide as its share of people", avoid: "The groups are not ordered",
    ...pair(parade(ser, { widths: FRACTILE_WIDTHS, yMax: 22000, yTicks: [5000, 10000, 15000, 20000], width: 620, height: 320, xTitle: "Lowest to highest spender, percentile", label: "Spending by fractile" }), parade(ser, { widths: FRACTILE_WIDTHS, yMax: 22000, yTicks: [10000, 20000], width: 350, height: 280, xTitle: "Percentile", label: "Spending by fractile" })),
    note: "Monthly spending per person by fractile class, 2023-24", source: "MoSPI Household Consumption Expenditure Survey 2023-24" });
}
// 5. sensitivity
{
  const rows = read("derived.IN.poverty.hces_cutoff_simulation_sector.json").rows as Array<{ sector: string; cutoffRsPerPersonMonth: number; value: number }>;
  const by = (s: string) => rows.filter((r) => r.sector === s).map((r) => [r.cutoffRsPerPersonMonth, r.value] as [number, number]);
  const curves = [{ label: "Rural", color: INK.hara, points: by("Rural") }, { label: "Urban", color: INK.neel, points: by("Urban") }, { label: "All India", color: INK.ink, width: 2.5, points: by("All India") }];
  const hi = { curve: "All India", at: [3000, 3500] as [number, number], title: "Move the line by ₹500", body: ["and the share below it moves", `from ${Math.round(by("All India").find((p) => p[0] === 3000)![1])}% to ${Math.round(by("All India").find((p) => p[0] === 3500)![1])}%`] as [string, string] };
  entries.push({ key: "sensitivity", name: "Sensitivity curves", shape: "An estimate that depends on a chosen threshold", use: "Showing the range a choice creates, not one answer", avoid: "The threshold is fixed by law and not in dispute",
    ...pair(sensitivity(curves, { x: [1500, 8000], xTicks: [2000, 4000, 6000, 8000], yTicks: [0, 25, 50, 75, 100], band: [3000, 3500], highlight: hi, width: 620, height: 310, xTitle: "Poverty line, ₹ per person per month", label: "Share below a poverty line" }), sensitivity(curves, { x: [1500, 8000], xTicks: [2000, 5000, 8000], yTicks: [0, 50, 100], band: [3000, 3500], highlight: hi, width: 350, height: 280, xTitle: "Line, ₹ a month", label: "Share below a poverty line" })),
    note: "A sensitivity simulation from unit-level data, not an official estimate", source: "HCES 2023-24 unit-level data; This Indian Life calculation" });
}
// 6. dumbbell
{
  const drop = ["Lakshadweep", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Chandigarh", "Ladakh", "Puducherry"];
  const rows = (read("nfhs.IN.people_nfhs_women_mobile_state.json").rows as Array<{ state: string; value: number; nfhs5: number | null }>)
    .filter((r) => r.nfhs5 != null && !drop.includes(r.state)).sort((a, b) => b.value - a.value)
    .map((r) => ({ label: r.state.replace("Jammu and Kashmir", "Jammu & Kashmir"), short: SHORT[r.state.replace("Jammu and Kashmir", "Jammu & Kashmir")], a: r.nfhs5 as number, b: r.value, emphasis: r.state === "India" }));
  const o = { domain: [30, 100] as [number, number], ticks: [40, 60, 80, 100], aLabel: "2019-21", bLabel: "2023-24", label: "Women with a phone they use" };
  entries.push({ key: "dumbbell", name: "Dumbbell", shape: "Two survey rounds, many units", use: "Who moved, by how much, and who fell back", avoid: "There are more than two time points",
    ...pair(dumbbell(rows, { ...o, width: 620, rowH: 16.5 }), dumbbell(rows.filter((r, i) => i % 2 === 0 || r.emphasis), { ...o, width: 350, rowH: 20, half: true })),
    note: "Women aged 15-49 with a mobile phone they use themselves", source: "NFHS-5 and NFHS-6" });
}
// 7. rank slope
{
  const ru = (read("mospi-hces.IN.hces_state_mpce_rural.json").rows as Array<{ label: string }>).map((r) => r.label);
  const ur = (read("mospi-hces.IN.hces_state_mpce_urban.json").rows as Array<{ label: string }>).map((r) => r.label);
  entries.push({ key: "rankSlope", name: "Rank slope", shape: "The same units ranked two ways", use: "Where two rankings disagree", avoid: "The gaps between ranks are what matter",
    ...pair(rankSlope(ru, ur, { leftTitle: "Rural rank", rightTitle: "Urban rank", width: 520, rowH: 19, label: "State spending ranks" }), rankSlope(ru.map((s) => SHORT[s] ?? s), ur.map((s) => SHORT[s] ?? s), { leftTitle: "Rural", rightTitle: "Urban", width: 350, rowH: 19, label: "State spending ranks" })),
    note: "Large states ranked by monthly spending per person, 2023-24", source: "MoSPI HCES 2023-24" });
}
// 8 + 11 + 13. the monsoon: beeswarm, stripes, ridgeline
const monsoon = yearly("derived.IN.climate.el_nino.imd_monsoon_departure_1901_2025.json");
const phase = Object.fromEntries((read("derived.IN.climate.enso_imd_monsoon_join.json").rows as Array<{ year: number; region_id: string; oni_monsoon_phase_by_mean: string }>).filter((r) => r.region_id === "all_india").map((r) => [r.year, r.oni_monsoon_phase_by_mean]));
{
  const pts = monsoon.map(([y, v]) => ({ id: y, value: v, group: phase[y] ?? "none" }));
  const groups = [{ key: "El Nino", label: "El Niño", color: INK.sindoor }, { key: "La Nina", label: "La Niña", color: INK.neel }, { key: "Neutral", label: "Neutral", color: "#a8a8a8" }, { key: "none", label: "Before 1950", color: "#dcdcdc" }];
  const sign = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`;
  const o = { domain: [-25, 28] as [number, number], groups, guides: [-10, 10], guideLabel: "Within 10% of normal", ends: ["Drier", "Wetter"] as [string, string], tickFmt: sign, label: "125 monsoons" };
  entries.push({ key: "beeswarm", name: "Beeswarm", shape: "One value per year or place, up to a few hundred", use: "A whole distribution, with every case still visible", avoid: "The order in time is the point",
    ...pair(beeswarm(pts, { ...o, width: 620, height: 250, r: 3.9, ticks: [-20, -10, 0, 10, 20], labels: { "2002": { dir: -1, text: "2002" }, "1917": { dir: -1, text: "1917", anchor: "end" }, "1972": { dir: 1, text: "1972" } } }), beeswarm(pts, { ...o, width: 350, height: 230, r: 2.6, ticks: [-10, 0, 10] })),
    note: "All-India June to September rainfall, departure from normal, one dot per year", source: "IMD; NOAA Oceanic Niño Index" });
  const sp = monsoon.map(([year, value]) => ({ year, value, flag: year >= 1950 && value <= -10 && phase[year] === "El Nino" }));
  entries.push({ key: "stripes", name: "Stripes", shape: "One value per year, a long run", use: "Making a century of variation visible at a glance", avoid: "Readers need to read off exact values",
    ...pair(stripes(sp, { stops: SCALES.rain, width: 620, height: 170, marks: { 1917: "1917", 1972: "1972", 2002: "2002" }, label: "Monsoon stripes" }), stripes(sp, { stops: SCALES.rain, width: 350, height: 170, compact: true, marks: { 1917: "1917", 2002: "2002" }, label: "Monsoon stripes" })),
    note: "One stripe per monsoon, brown dry and green wet; red marks are droughts in El Niño summers", source: "IMD; NOAA Oceanic Niño Index" });
  const eras = [[1901, 1925], [1926, 1950], [1951, 1975], [1976, 2000], [2001, 2025]].map(([a, b]) => ({ label: `${a}–${String(b).slice(2)}`, values: monsoon.filter(([y]) => y >= a && y <= b).map(([, v]) => v) }));
  const ro = { domain: [-30, 30] as [number, number], ticks: [-20, -10, 0, 10, 20], fmt: sign, stops: SCALES.rain, ref: 0, label: "Monsoon by era" };
  entries.push({ key: "ridgeline", name: "Ridgeline", shape: "A distribution for each of several groups", use: "How the shape of a spread changes across eras or places", avoid: "A group has fewer than about 20 values",
    ...pair(ridgeline(eras, { ...ro, width: 620 }), ridgeline(eras, { ...ro, width: 350 })),
    note: "Monsoon rainfall departures by 25-year era; the white tick is each era's median", source: "IMD" });
}
// 9. day ribbon
{
  const v = (f: string) => yearly(f).at(-1)![1];
  const rows = [
    { label: "Women", parts: [{ label: "Unpaid work", value: v("mospi.IN.tus.time_unpaid_total_female.json"), color: INK.sindoor }, { label: "Paid work", value: v("mospi.IN.tus.time_paid_total_female.json"), color: INK.neel }] },
    { label: "Men", parts: [{ label: "Unpaid work", value: v("mospi.IN.tus.time_unpaid_total_male.json"), color: INK.sindoor }, { label: "Paid work", value: v("mospi.IN.tus.time_paid_total_male.json"), color: INK.neel }] },
  ];
  const ticks: Array<[number, string]> = [[0, "0"], [360, "6"], [720, "12"], [1080, "18"], [1440, "24 hours"]];
  entries.push({ key: "dayRibbon", name: "Day ribbon", shape: "Parts of a fixed whole: a day, a rupee, a hectare", use: "How two groups divide the same whole", avoid: "The parts do not add up to a real total",
    ...pair(dayRibbon(rows, { total: 1440, ticks, hourly: true, width: 620, label: "A day of work" }), dayRibbon(rows, { total: 1440, ticks, hourly: true, width: 350, label: "A day of work" })),
    note: "Minutes a day in paid and unpaid work, people aged 15-59", source: "MoSPI Time Use Survey 2024" });
}
// 10. unit chart
{
  const india = (read("nfhs.IN.people_nfhs_women_mobile_state.json").rows as Array<{ state: string; value: number }>).find((r) => r.state === "India")!;
  const s = unitChart(india.value, { cell: 18, gap: 5, label: `${Math.round(india.value)} in 100 women` });
  entries.push({ key: "unitChart", name: "Unit chart", shape: "A single share", use: "Making a percentage feel like people", avoid: "The share is under 2% or must be compared with many others",
    ...pair(s, s), note: `${Math.round(india.value)} in every 100 women have a mobile phone they use`, source: "NFHS-6, 2023-24" });
}
// 12. interval plot
{
  const a = read("glp1.IN.health.price_ladder.json");
  const rows = (a.rows as Array<{ label: string; value: number; inr_per_month_low: number; inr_per_month_high: number }>).map((r) => ({ label: r.label, lo: r.inr_per_month_low, hi: r.inr_per_month_high, mid: r.value })).sort((p, q) => q.mid - p.mid);
  const hiMax = Math.ceil(Math.max(...rows.map((r) => r.hi)) / 5000) * 5000;
  const ticks = Array.from({ length: hiMax / 5000 + 1 }, (_, i) => i * 5000);
  const f = (v: number) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);
  entries.push({ key: "intervalPlot", name: "Interval plot", shape: "Estimates that are ranges, not points", use: "Showing honest uncertainty, side by side", avoid: "The range is so narrow that a dot would do",
    ...pair(intervalPlot(rows, { domain: [0, hiMax], ticks, fmt: f, width: 620, midLabel: "Typical price", label: a.title }), intervalPlot(rows, { domain: [0, hiMax], ticks: ticks.filter((_, i) => i % 2 === 0), fmt: f, width: 350, label: a.title })),
    note: "What a month of GLP-1 treatment costs in India, low to high, with the typical price", source: String(a.sourceIndicatorId ?? a.sourceId) });
}
// 14. calendar heatmap
{
  const nifty = obs("rbi-dbie.IN.market.rbi.nifty_daily.json").sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const ret = nifty.slice(1).map(([d, v], i) => ({ date: d, value: ((v - nifty[i][1]) / nifty[i][1]) * 100 }));
  const lastYear = Number(ret.at(-1)!.date.slice(0, 4)), recent = ret.filter((r) => Number(r.date.slice(0, 4)) >= lastYear - 3);
  const stops: Stops = [[-3, "#7a2816"], [-1.5, "#c24a2e"], [-0.4, "#f1cbba"], [0, "#ededed"], [0.4, "#9fcfc0"], [1.5, "#008a6e"], [3, "#0b5e4b"]];
  const lt: Array<[number, string]> = [[-2, "−2%"], [0, "0"], [2, "+2%"]];
  const f = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
  entries.push({ key: "calendarHeat", name: "Calendar heatmap", shape: "One value per day over months or years", use: "Seasons, weekdays and shocks in daily data", avoid: "The series is weekly or sparser",
    ...pair(calendarHeat(recent, { stops, width: 620, fmt: f, legendTicks: lt, label: "Nifty daily moves" }), calendarHeat(recent, { stops, width: 350, fmt: f, legendTicks: lt, label: "Nifty daily moves" })),
    note: `Daily change in the Nifty 50, ${lastYear - 3} to ${lastYear}; trading days only`, source: "RBI Database on Indian Economy" });
}
// 15. connected scatter
{
  const STATES: Array<[string, string, string, boolean]> = [["kerala", "Kerala", INK.neel, true], ["tamil_nadu", "Tamil Nadu", "#6a7bc0", false], ["punjab", "Punjab", INK.haldi, true], ["bihar", "Bihar", INK.sindoor, true]];
  const paths = STATES.map(([k, label, color, emphasis]) => {
    const inc = new Map(yearly(`dbie.IN.econ.percap_income.${k}.json`)), tfr = tfrSeries(k);
    return { label, color, emphasis, points: tfr.filter(([y]) => inc.has(y) && y % 2 === 1).map(([t, yv]) => ({ t, x: inc.get(t)!, y: yv })) };
  }).filter((p) => p.points.length > 3);
  const o = { x: [1000, 400000] as [number, number], y: [1, 6] as [number, number], xLog: true, yTicks: [1, 2, 3, 4, 5, 6], refY: { value: 2.1, label: "replacement, 2.1" }, xTitle: "Income per person, ₹ at current prices (log scale)", yTitle: "Births per woman", yFmt: (v: number) => String(v), xFmt: (v: number) => (v >= 100000 ? `₹${v / 100000} lakh` : `₹${(v / 1000).toLocaleString("en-IN")}k`), label: "Income and fertility over time" };
  entries.push({ key: "connectedScatter", name: "Connected scatter", shape: "Two measures moving together through time, for a few units", use: "Paths: who got where, and in what order", avoid: "More than about six units, or readers new to charts",
    ...pair(connectedScatter(paths, { ...o, xTicks: [1000, 10000, 100000], width: 620, height: 400 }), connectedScatter(paths, { ...o, xTicks: [1000, 10000, 100000], width: 350, height: 340 })),
    note: "Odd years, 1981 to 2023. Incomes are nominal and the RBI back-series steps up about 15 to 18% at the 2011-12 base change", source: "RBI DBIE per-capita NSDP; SRS via Data For India" });
}
// 16. waterfall
{
  const G: Array<[string, string]> = [["food_beverages", "Food and beverages"], ["miscellaneous", "Miscellaneous"], ["housing", "Housing"], ["fuel_light", "Fuel and light"], ["clothing_footwear", "Clothing and footwear"], ["pan_tobacco_intoxicants", "Pan, tobacco and intoxicants"]];
  const latest = obs(`mospi.IN.prices.cpi.contribution.food_beverages.json`).at(-1)![0];
  const at = (f: string) => obs(f).find(([d]) => d === latest)?.[1] ?? 0;
  const steps = G.map(([k, label]) => ({ label, value: at(`mospi.IN.prices.cpi.contribution.${k}.json`) }));
  const headline = at("mospi.IN.prices.cpi.combined.general.inflation.json");
  const gap = Math.round((headline - steps.reduce((a, s) => a + s.value, 0)) * 100) / 100;
  if (Math.abs(gap) >= 0.01) steps.push({ label: "Rounding and weights in the published figures", value: gap });
  const month = new Date(`${latest}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
  entries.push({ key: "waterfall", name: "Waterfall", shape: "Parts that add up to a total, some negative", use: "Which parts pushed a total up and which pulled it down", avoid: "The parts are not additive",
    ...pair(waterfall(steps, { totalLabel: "Headline CPI inflation", width: 620, label: "CPI inflation by group" }), waterfall(steps, { totalLabel: "Headline CPI inflation", width: 350, label: "CPI inflation by group" })),
    note: `Contributions to all-India CPI inflation, ${month}, percentage points`, source: "MoSPI, Consumer Price Index" });
}

export const library = entries;
