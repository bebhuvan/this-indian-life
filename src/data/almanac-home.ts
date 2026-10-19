// Build-time data for the home page. Every number shown on the page is computed here
// from the series files, so the page cannot drift from the data it describes.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INK, SCALES, heatStrip, stripes, scaleKey, sparkLine, miniRibbon, miniParade, miniUnits, dayRibbon, parade, sensitivity, dumbbell, rankSlope, type HeatRow } from "./almanac";

type Obs = { date: string; value: number | null };
const read = (file: string) => JSON.parse(readFileSync(resolve(process.cwd(), "data/series", file), "utf8"));
const obs = (file: string): Array<[number, number]> =>
  (read(file).observations as Obs[]).filter((o) => o.value != null).map((o) => [Number(o.date), o.value as number] as [number, number]).sort((a, b) => a[0] - b[0]);
const sourceOf = (file: string) => read(file).sourceUrl as string;

// ---------- the monsoon hero ----------
const monsoon = obs("derived.IN.climate.el_nino.imd_monsoon_departure_1901_2025.json");
const phase = Object.fromEntries(
  (read("derived.IN.climate.enso_imd_monsoon_join.json").rows as Array<{ year: number; region_id: string; oni_monsoon_phase_by_mean: string }>)
    .filter((r) => r.region_id === "all_india").map((r) => [r.year, r.oni_monsoon_phase_by_mean])
);
// "Deficient" is IMD's term for a monsoon 10% or more below the long-period average.
const deficient = monsoon.filter(([y, v]) => y >= 1950 && v <= -10);
const deficientElNino = deficient.filter(([y]) => phase[y] === "El Nino");
const ONES = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
/** Numbers under 100 in words, as house style spells them in running text. */
const numberWord = (n: number) => n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "") : String(n);
const extreme = (sign: 1 | -1) => monsoon.reduce((best, p) => (sign * p[1] > sign * best[1] ? p : best));
const driest = extreme(-1), wettest = extreme(1);
const heroMarks: Record<number, string> = { [wettest[0]]: String(wettest[0]), [driest[0]]: String(driest[0]) };
for (const [y] of deficientElNino.slice().sort((a, b) => a[1] - b[1]).slice(0, 4)) heroMarks[y] = String(y);
const heroPoints = monsoon.map(([year, value]) => ({ year, value, flag: year >= 1950 && value <= -10 && phase[year] === "El Nino" }));
export const hero = {
  svg: stripes(heroPoints, { stops: SCALES.rain, width: 1160, height: 230, marks: heroMarks, label: `All-India monsoon rainfall departure from normal, ${monsoon[0][0]} to ${monsoon[monsoon.length - 1][0]}, one stripe per year` }),
  svgM: stripes(heroPoints, { stops: SCALES.rain, width: 358, height: 200, compact: true, marks: { [wettest[0]]: String(wettest[0]), [driest[0]]: String(driest[0]) }, label: "Monsoon rainfall departure from normal, one stripe per year" }),
  key: scaleKey(SCALES.rain, [[-20, "−20%"], [0, "Normal"], [20, "+20%"]]),
  first: monsoon[0][0],
  last: monsoon[monsoon.length - 1][0],
  years: monsoon.length,
  deficient: deficient.length,
  deficientElNino: deficientElNino.length,
  sentence: `Since 1950, ${numberWord(deficientElNino.length)} of the ${numberWord(deficient.length)} monsoons that fell 10% or more short came in El Niño summers`,
};

// ---------- fertility: heat strip of the long-series states ----------
const STATES: Record<string, string> = {
  andhra_pradesh: "Andhra Pradesh", assam: "Assam", bihar: "Bihar", gujarat: "Gujarat", haryana: "Haryana", india: "India",
  karnataka: "Karnataka", kerala: "Kerala", madhya_pradesh: "Madhya Pradesh", maharashtra: "Maharashtra", odisha: "Odisha",
  punjab: "Punjab", rajasthan: "Rajasthan", tamil_nadu: "Tamil Nadu", uttar_pradesh: "Uttar Pradesh", west_bengal: "West Bengal",
};
const SHORT: Record<string, string> = { "Andhra Pradesh": "Andhra Pr.", "Madhya Pradesh": "Madhya Pr.", "Uttar Pradesh": "Uttar Pr.", "West Bengal": "W. Bengal" };
export const REPLACEMENT = 2.1;
export const tfrSeries = (key: string) => obs(`srs.IN.people.srs.tfr_long.${key}.json`);
const crossYear = (pts: Array<[number, number]>) => pts.find(([, v]) => v <= REPLACEMENT)?.[0] ?? null;
// States with series back to at least 1981, ordered by the year they first reached 2.1.
export const tfrRows: HeatRow[] = Object.entries(STATES)
  .map(([k, label]) => ({ k, label, points: tfrSeries(k) }))
  .filter((r) => r.points[0][0] <= 1981)
  .map((r) => ({ label: r.label, shortLabel: SHORT[r.label], points: r.points, emphasis: r.k === "india", marker: crossYear(r.points) }))
  .sort((a, b) => (a.marker ?? 9999) - (b.marker ?? 9999) || a.points[a.points.length - 1][1] - b.points[b.points.length - 1][1]);
const tfrFrom = Math.min(...tfrRows.map((r) => r.points[0][0])), tfrTo = Math.max(...tfrRows.map((r) => r.points[r.points.length - 1][0]));
const stripOpts = {
  stops: SCALES.fertility, from: tfrFrom, to: tfrTo, compact: true, legendTicks: [1.5, 2.1, 3, 4, 5],
  legendMark: { value: REPLACEMENT, label: "replacement" }, hot: (v: number) => v > REPLACEMENT,
  label: `Total fertility rate by state, ${tfrFrom} to ${tfrTo}`,
};
export const leadStrip = heatStrip(tfrRows, { ...stripOpts, width: 620, rowH: 15, gap: 4, labelW: 92, rightW: 36 });
export const leadStripM = heatStrip(tfrRows, { ...stripOpts, width: 350, rowH: 14, gap: 3, labelW: 70, rightW: 30 });

// ---------- the ledger: four numbers from an ordinary Indian life ----------
const india = tfrSeries("india");
const tus = (s: string) => obs(`mospi.IN.tus.time_${s}.json`).at(-1)!;
const [tusYear, unpaidF] = tus("unpaid_total_female"), paidF = tus("paid_total_female")[1], unpaidM = tus("unpaid_total_male")[1], paidM = tus("paid_total_male")[1];
const fractRural = read("mospi-hces.IN.hces_fractile_mpce_rural.json").rows as Array<{ label: string; value: number; date: string }>;
const fractUrban = read("mospi-hces.IN.hces_fractile_mpce_urban.json").rows as Array<{ label: string; value: number }>;
// HCES fractile classes: two 5% groups, eight 10% groups, two 5% groups.
export const FRACTILE_WIDTHS = [5, 5, 10, 10, 10, 10, 10, 10, 10, 10, 5, 5];
const ru = fractRural.map((r) => r.value), ur = fractUrban.map((r) => r.value);
// The median person sits on the 40-50% / 50-60% boundary, so the middle is a range.
const midLo = ru[5], midHi = ru[6];
const phones = read("nfhs.IN.people_nfhs_women_mobile_state.json").rows as Array<{ state: string; value: number; nfhs5: number | null }>;
const phoneIndia = phones.find((r) => r.state === "India")!;
const hm = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} m`;
const round50 = (v: number) => Math.round(v / 100) * 100;

export const ledger = [
  {
    key: "fertility", value: india.at(-1)![1].toFixed(1), color: INK.sindoor,
    mini: sparkLine(india, { yMin: 1, yMax: 5.6, ref: REPLACEMENT, label: `India's fertility rate, ${india[0][0]} to ${india.at(-1)![0]}` }),
    text: `births per woman in ${india.at(-1)![0]}, down from ${india[0][1].toFixed(1)} in ${india[0][0]}`, source: "Sample Registration System",
    question: "q.people.fertility_divergence",
  },
  {
    key: "work", value: hm(unpaidF), color: INK.sindoor,
    mini: miniRibbon([{ label: "Women", parts: [{ value: unpaidF, color: INK.sindoor }, { value: paidF, color: INK.neel }] }, { label: "Men", parts: [{ value: unpaidM, color: INK.sindoor }, { value: paidM, color: INK.neel }] }], { total: 1440, label: "Unpaid and paid work in a day" }),
    text: `of unpaid work a day for the average woman. For men, ${unpaidM} minutes`, source: `Time Use Survey ${tusYear}`,
    question: "q.work.women",
  },
  {
    key: "spend", value: `₹${round50(midLo).toLocaleString("en-IN")}–${round50(midHi).toLocaleString("en-IN")}`, color: INK.hara,
    mini: miniParade(ru, FRACTILE_WIDTHS, { yMax: 11000, band: [40, 60], mark: 50, label: "Rural spending by fractile" }),
    text: "a month per person, what the middle of rural India spends", source: `Household Consumption Survey ${fractRural[0].date}`,
    question: "q.econ.poverty",
  },
  {
    key: "phone", value: `${Math.round(phoneIndia.value)} in 100`, color: INK.neel,
    mini: miniUnits(phoneIndia.value, { label: `${Math.round(phoneIndia.value)} in 100 women have a phone they use` }),
    text: "women have a mobile phone they use themselves", source: "NFHS-6, 2023-24",
    question: "q.society.connected",
  },
];

// ---------- thumbnails for the story cards: marks only ----------
const cutoffRows = read("derived.IN.poverty.hces_cutoff_simulation_sector.json").rows as Array<{ sector: string; cutoffRsPerPersonMonth: number; value: number }>;
const cutoffBy = (s: string) => cutoffRows.filter((r) => r.sector === s).map((r) => [r.cutoffRsPerPersonMonth, r.value] as [number, number]);
const stateRural = (read("mospi-hces.IN.hces_state_mpce_rural.json").rows as Array<{ label: string }>).map((r) => r.label);
const stateUrban = (read("mospi-hces.IN.hces_state_mpce_urban.json").rows as Array<{ label: string }>).map((r) => r.label);
const DROP = ["Lakshadweep", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Chandigarh", "Ladakh", "Puducherry"];
const phoneRows = phones.filter((r) => r.nfhs5 != null && !DROP.includes(r.state)).sort((a, b) => b.value - a.value);
const under = phoneRows.filter((r) => r.state !== "India" && r.value < 50);
const punjab = { rural: stateRural.indexOf("Punjab") + 1, urban: stateUrban.indexOf("Punjab") + 1 };

export const thumbs = {
  ribbon: dayRibbon([
    { label: "Women", parts: [{ label: "Unpaid work", value: unpaidF, color: INK.sindoor }, { label: "Paid work", value: paidF, color: INK.neel }] },
    { label: "Men", parts: [{ label: "Unpaid work", value: unpaidM, color: INK.sindoor }, { label: "Paid work", value: paidM, color: INK.neel }] },
  ], { total: 1440, width: 355, bare: true, hourly: true, label: "Paid and unpaid work in a day, women and men" }),
  parade: parade([{ label: "Urban", color: INK.neel, values: ur, fill: 0.07 }, { label: "Rural", color: INK.hara, values: ru, fill: 0.14 }], { widths: FRACTILE_WIDTHS, yMax: Math.ceil(Math.max(...ur) / 1000) * 1000 + 700, yTicks: [], width: 355, height: 141, bare: true, label: "Spending per person by fractile, rural and urban" }),
  cutoff: sensitivity([{ label: "Rural", color: INK.hara, points: cutoffBy("Rural") }, { label: "Urban", color: INK.neel, points: cutoffBy("Urban") }, { label: "All India", color: INK.ink, width: 2.25, points: cutoffBy("All India") }], { x: [1500, 8000], xTicks: [], yTicks: [], band: [3000, 3500], width: 355, height: 141, bare: true, label: "Share below a range of poverty lines" }),
  dumbbell: dumbbell(phoneRows.map((r) => ({ label: r.state, a: r.nfhs5 as number, b: r.value, emphasis: r.state === "India" })), { domain: [30, 100], ticks: [], aLabel: "", bLabel: "", width: 264, rowH: 5.8, thumb: true, label: "Women with a phone they use, by state" }),
  slope: rankSlope(stateRural, stateUrban, { leftTitle: "", rightTitle: "", width: 264, rowH: 172 / stateRural.length, bare: true, label: "State spending ranks, rural against urban" }),
};

const ratio = Math.round(ur[ur.length - 1] / ru[0]);
const ruleCount = (n: number) => (n === 1 ? "one state" : `${numberWord(n)} states`);
const cut = cutoffBy("All India");
const at = (v: number) => cut.find(([c]) => c === v)?.[1] ?? 0;
const share = (a: number, b: number) => Math.round(100 / Math.max(1e-9, b - a));
export const cardFacts = {
  ribbon: `Women spend about ${numberWord(Math.round(unpaidF / 60))} hours a day on unpaid work at home and one on paid work. For men it runs the other way.`,
  parade: `Line every Indian up by what they spend. The top 5% in cities spend about ${numberWord(ratio)} times the bottom 5% in villages.`,
  cutoff: `It depends where the line is drawn. Move it by ₹500 a month and roughly one Indian in ${numberWord(share(at(3000), at(3500)))} moves with it.`,
  dumbbell: `Women with a phone of their own went from ${Math.round(phoneIndia.nfhs5 ?? 0)}% to ${Math.round(phoneIndia.value)}% between the last two health surveys. In ${ruleCount(under.length)} it is still under half.`,
  slope: `Rank ${stateRural.length} large states by what a person spends in a month. Punjab comes ${ordinal(punjab.rural)} in its villages and ${ordinal(punjab.urban)} in its cities.`,
};
function ordinal(n: number) { return ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"][n] ?? `${n}th`; }

export const sources = {
  monsoon: sourceOf("derived.IN.climate.el_nino.imd_monsoon_departure_1901_2025.json"),
};

// ---------- facts for the lead explainer's dek ----------
const allStates = readdirSync(resolve(process.cwd(), "data/series"))
  .filter((f) => /^srs\.IN\.people\.srs\.tfr_long\.[a-z_]+\.json$/.test(f) && !f.includes(".india."))
  .map((f) => ({ key: f.split(".")[5], points: obs(f) }));
const stillAbove = allStates.filter((s) => s.points[s.points.length - 1][1] > REPLACEMENT);
const kerala = tfrSeries("kerala");
export const leadFacts = {
  keralaYear: crossYear(kerala),
  indiaYear: crossYear(india),
  stillAbove: stillAbove.length,
  years: tfrTo - tfrFrom + 1,
  from: tfrFrom,
  to: tfrTo,
  numberWord,
};
