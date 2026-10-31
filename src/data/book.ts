// The site as a book of questions: the contents (every question, numbered in chapter
// order, with its answer), each chapter's defining record, and the figures the home and
// chapter pages carry. Every chart is a chart-kit spec built here from data/series; the
// pages draw them at the width they are shown.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { domains, type DomainId } from "./site";
import { questionPages, questionUrl, type QuestionPage } from "./questions";
import { ANSWERS, type Answer } from "./answers";
import { draw, renderSvg, type AnySpec } from "../kit/index";
import { INK } from "../kit/theme";
import { SAMPLES } from "../kit/samples/index";

// ---------------------------------------------------------------- series
type Pt = { date: string; value: number };
const json = (file: string) => JSON.parse(readFileSync(resolve(process.cwd(), "data/series", file), "utf8"));
const obs = (file: string): Pt[] =>
  json(file).observations.filter((o: any) => o.value != null).map((o: any) => ({ date: String(o.date).slice(0, 4), value: +o.value }));
const owid = (file: string, key: string): Pt[] => {
  const d = json(file);
  return (d.observations || d.rows).filter((o: any) => o[key] !== "" && o[key] != null).map((o: any) => ({ date: String(o.Year), value: +o[key] }));
};
const un = (file: string, age?: string): Pt[] =>
  json(file).rows
    .filter((r: any) => r.variant === "Median" && r.sex === "Both sexes" && (!age || r.ageLabel === age))
    .map((r: any) => ({ date: String(r.timeLabel), value: +r.value }))
    .filter((p: Pt, i: number, a: Pt[]) => a.findIndex((q) => q.date === p.date) === i)
    .sort((a: Pt, b: Pt) => a.date.localeCompare(b.date));
const rows = (file: string, key: string): Pt[] => json(file).rows.map((r: any) => ({ date: String(r.date).slice(0, 4), value: +r[key] }));
const tfr = (state: string) => obs(`srs.IN.people.srs.tfr_long.${state}.json`);
const at = (s: Pt[], date: string) => s.find((p) => p.date === date)!.value;
const first = (s: Pt[]) => s[0];
const last = (s: Pt[]) => s[s.length - 1];
const sample = (id: string) => SAMPLES.find((s) => s.id === id)!.spec;

const D = {
  life: owid("owid.IN.life-expectancy.json", "Life expectancy"),
  net: owid("owid.IN.share-of-individuals-using-the-internet.json", "Share of the population using the Internet"),
  co2: owid("owid.IN.annual-co2-emissions-per-country.json", "Annual CO₂ emissions").map((p) => ({ ...p, value: p.value / 1e9 })),
  co2pc: owid("owid.IN.co-emissions-per-capita.json", "CO₂ emissions per capita"),
  gdp: obs("imf.IND.econ.world.cmp.gdp_pc.in.json"),
  demand: rows("ember.IN.electricity-demand.yearly.json", "demand_twh"),
  intensity: rows("ember.IN.carbon-intensity.yearly.json", "emissions_intensity_gco2_per_kwh"),
  agri: obs("heat-mortality.IN.worldbank_context_agriculture_employment_share.json"),
  imr: obs("srs.IN.health.srs.infant_mortality.json"),
  trade: obs("rbi-trade.IN.trade.trade_balance_total_inr.annual.json").map((p) => ({ ...p, value: p.value / 1e5 })),
  pop: un("un-population.IN.indicator-49.2000-2100.json").map((p) => ({ ...p, value: p.value / 1e7 })),
  medage: un("un-population.IN.indicator-67.2000-2100.json"),
  kids: un("un-population.IN.indicator-71.2000-2030.json", "0-14"),
  tfrIndia: tfr("india"),
  monsoon: obs("derived.IN.climate.el_nino.imd_monsoon_departure_1901_2025.json"),
};

const fmt = (v: number, d = 0) => v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const lead = (label: string, points: Pt[], extra: Record<string, unknown> = {}) => ({ label, points, role: "lead", ...extra });
const projected = { projectedAfter: "2024" };

// ---------------------------------------------------------------- contents
const ORDINALS = ["one", "two", "three", "four", "five", "six", "seven", "eight"];
const RANK: Record<string, number> = { ready: 0, work_in_progress: 1, needs_data: 2 };

export type Entry = { page: QuestionPage; n: number; href: string; answer: Answer | null; answered: boolean; state: string };

/** Chapters in reading order, each with its questions: answered first, then those under way. */
export const chapters = (() => {
  let n = 0;
  return domains.map((d, i) => {
    const pages = questionPages.filter((p) => p.domain === d.id).sort((a, b) => (RANK[a.explanation.status] ?? 9) - (RANK[b.explanation.status] ?? 9));
    const entries: Entry[] = pages.map((page) => {
      const answered = page.explanation.status === "ready";
      return {
        page,
        n: ++n,
        href: questionUrl(page),
        answer: answered ? ANSWERS[page.id] ?? null : null,
        answered,
        state: page.explanation.status === "needs_data" ? "awaiting data" : answered ? "" : "in progress",
      };
    });
    return { ...d, ordinal: ORDINALS[i], entries, answered: entries.filter((e) => e.answered).length };
  });
})();

const byId = new Map(chapters.flatMap((c) => c.entries).map((e) => [e.page.id, e]));
export const entry = (id: string) => byId.get(id)!;
export const totals = {
  all: byId.size,
  answered: [...byId.values()].filter((e) => e.answered).length,
};

// ---------------------------------------------------------------- numbers in words
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
export function inWords(n: number): string {
  if (n < 20) return WORDS[n];
  const t = TENS[Math.floor(n / 10)], u = n % 10;
  return u ? `${t}-${WORDS[u]}` : t;
}

// ---------------------------------------------------------------- emblems
const r1 = (x: number) => Math.round(x * 10) / 10;

/** A chart's own marks, with text, gridlines and notes taken out, fitted to a box. */
export function emblem(spec: AnySpec, W: number, H: number, opts: { base?: boolean } = {}): string {
  const sp: any = { ...spec };
  delete sp.callout;
  delete sp.annotations;
  const scene = draw(sp, 1040);
  const keep = scene.marks.filter((m) => m.kind === "path" || m.kind === "circle" || (m.kind === "rect" && m.h < 200));
  const pts: number[][] = [];
  for (const m of keep) {
    if (m.kind === "path") for (const [, x, y] of m.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) pts.push([+x, +y]);
    else if (m.kind === "rect") pts.push([m.x, m.y], [m.x + m.w, m.y + m.h]);
    else if (m.kind === "circle") pts.push([m.cx, m.cy]);
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = Math.min(4, H / 5), small = H < 20;
  const X = (x: number) => r1(pad + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * pad));
  const Y = (y: number) => r1(pad + ((y - y0) / (y1 - y0 || 1)) * (H - 2 * pad));
  const marks: any[] = keep.map((m: any) =>
    m.kind === "path" ? { ...m, d: m.d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_: string, x: string, y: string) => `${X(+x)},${Y(+y)}`), width: small ? 1.3 : 1.6 }
    : m.kind === "rect" ? { ...m, x: X(m.x), y: Y(m.y), w: Math.max(0.6, r1((m.w * (W - 2 * pad)) / (x1 - x0 || 1))), h: Math.max(0.6, r1((m.h * (H - 2 * pad)) / (y1 - y0 || 1))) }
    : { ...m, cx: X(m.cx), cy: Y(m.cy), r: small ? 1.9 : 2.6 });
  if (opts.base !== false && !small) marks.push({ kind: "line", x1: 0, x2: W, y1: H - 0.5, y2: H - 0.5, stroke: INK.stone, width: 1 });
  return renderSvg({ width: W, height: H, marks, alt: "" })
    .replace('role="img"', 'aria-hidden="true" focusable="false"')
    .replace(/ aria-label="[^"]*"/, "")
    .replace(/<path /g, '<path vector-effect="non-scaling-stroke" ');
}

// ---------------------------------------------------------------- chapter records
type Record_ = { spec: AnySpec; start: Answer; end: Answer; series: string };
const lineOf = (label: string, s: Pt[], extra: Record<string, unknown> = {}): AnySpec => ({ form: "line", series: [lead(label, s)], ...extra } as AnySpec);

export const RECORDS: Record<DomainId, Record_> = {
  economy: { spec: lineOf("GDP per person", D.gdp), series: "GDP per person, current dollars (IMF)",
    start: { value: `$${fmt(first(D.gdp).value)}`, note: `a head in ${first(D.gdp).date}` },
    end: { value: `$${fmt(last(D.gdp).value)}`, note: `in ${last(D.gdp).date}, an IMF estimate` } },
  people: { spec: lineOf("Births per woman", D.tfrIndia, { domain: "fit" }), series: "Births per woman (Sample Registration System)",
    start: { value: fmt(first(D.tfrIndia).value, 1), note: `births per woman, ${first(D.tfrIndia).date}` },
    end: { value: fmt(last(D.tfrIndia).value, 1), note: `in ${last(D.tfrIndia).date}` } },
  health: { spec: lineOf("Life expectancy", D.life), series: "Life expectancy at birth (Our World in Data)",
    start: { value: fmt(first(D.life).value), note: `years of life expected, ${first(D.life).date}` },
    end: { value: fmt(last(D.life).value), note: `in ${last(D.life).date}` } },
  energy: { spec: lineOf("Electricity demand", D.demand), series: "Electricity demand, TWh (Ember)",
    start: { value: fmt(first(D.demand).value), note: `TWh of electricity used, ${first(D.demand).date}` },
    end: { value: fmt(last(D.demand).value), note: `TWh in ${last(D.demand).date}` } },
  society: { spec: lineOf("Using the internet", D.net), series: "Share of Indians online (ITU)",
    start: { value: `${fmt(first(D.net).value)}%`, note: `of Indians online, ${first(D.net).date}` },
    end: { value: `${fmt(last(D.net).value)}%`, note: `in ${last(D.net).date}` } },
  climate: { spec: lineOf("CO₂", D.co2.filter((p) => +p.date >= 1950)), series: "CO₂ from fossil fuels and industry (Global Carbon Budget)",
    start: { value: fmt(at(D.co2, "1950"), 2), note: "bn tonnes of CO₂, 1950" },
    end: { value: fmt(last(D.co2).value, 2), note: `bn tonnes in ${last(D.co2).date}` } },
};

/** Each chapter's mark: its record as a tiny line, set before its name wherever it appears. */
export const glyph = (d: DomainId) => emblem(RECORDS[d].spec, 36, 13);

// ---------------------------------------------------------------- figures
export type Fig = { id: string; q: string; text: string; title?: string; dek?: string; spec: AnySpec; source: string; sourceUrl?: string };

const SPEC = {
  life: { form: "line", unit: "years", series: [lead("Life expectancy at birth", D.life)],
    annotations: [{ date: "1918", label: "Influenza" }, { date: "1947", label: "Independence" }, { date: "2021", label: "Covid" }] },
  poverty: sample("poverty-three-lines"),
  lrs: sample("lrs-monthly"),
  net: { form: "line", unit: "%", domain: "share", series: [lead("Using the internet", D.net)], callout: { date: last(D.net).date, note: `of Indians online in ${last(D.net).date}` } },
  co2: { form: "line", unit: "bn t", series: [lead("CO₂ emissions", D.co2.filter((p) => +p.date >= 1950))], callout: { date: last(D.co2).date, note: `billion tonnes in ${last(D.co2).date}` } },
  co2pc: { form: "line", unit: "t", series: [lead("Per person", D.co2pc.filter((p) => +p.date >= 1950))], callout: { date: last(D.co2pc).date, note: `tonnes a person in ${last(D.co2pc).date}` } },
  pop: { form: "line", domain: "fit", unit: "crore", series: [lead("Population", D.pop, projected)], callout: { date: "2024", note: "crore people in 2024" } },
  medage: { form: "line", unit: "years", series: [lead("Median age", D.medage, projected)], callout: { date: "2100", note: "years, projected for 2100" } },
  kids: { form: "line", unit: "%", series: [lead("Under 15", D.kids, projected)], callout: { date: "2030", note: "of Indians under 15 by 2030" } },
  imr: { form: "line", unit: "per 1,000", series: [lead("Infant deaths", D.imr)], callout: { date: last(D.imr).date, note: `per 1,000 births in ${last(D.imr).date}` } },
  agri: { form: "line", unit: "%", series: [lead("Working in agriculture", D.agri.filter((p) => +p.date >= 1991))], callout: { date: last(D.agri).date, note: `of workers in ${last(D.agri).date}` } },
  intensity: { form: "line", unit: "g/kWh", series: [lead("Carbon intensity", D.intensity)], callout: { date: last(D.intensity).date, note: `grams of CO₂ a kWh, ${last(D.intensity).date}` } },
  trade: { form: "columns", unit: "₹ lakh crore", items: D.trade.filter((p) => +p.date >= 2000).map((p) => ({ label: p.date, value: p.value })) },
  tfrStates: {
    form: "dumbbell", decimals: 1, unit: "births per woman", ends: ["1991", "2023"], sort: "b",
    items: [["Tamil Nadu", "tamil_nadu"], ["West Bengal", "west_bengal"], ["Maharashtra", "maharashtra"], ["Kerala", "kerala"], ["Andhra Pradesh", "andhra_pradesh"], ["Punjab", "punjab"], ["Karnataka", "karnataka"], ["Odisha", "odisha"], ["Gujarat", "gujarat"], ["Haryana", "haryana"], ["Assam", "assam"], ["Rajasthan", "rajasthan"], ["Madhya Pradesh", "madhya_pradesh"], ["Uttar Pradesh", "uttar_pradesh"], ["Bihar", "bihar"]]
      .map(([label, f]) => { const s = tfr(f); return { label, a: at(s, "1991"), b: at(s, "2023"), highlight: label === "Kerala" || label === "Bihar" }; }),
  },
} as Record<string, AnySpec>;

const SRC = {
  owidLife: "Our World in Data, life expectancy at birth",
  wb: "World Bank, Poverty, Prosperity and Planet 2026",
  rbi: "RBI, Database on Indian Economy",
  itu: "ITU via Our World in Data",
  gcb: "Global Carbon Budget via Our World in Data",
  wpp: "UN World Population Prospects 2024",
  srs: "Sample Registration System, Statistical Reports",
  ember: "Ember, India electricity data",
  wdi: "World Bank, World Development Indicators",
};

/** The home page's lead: one question, its answer as a numeral, its chart beside it. */
export const homeLead = {
  id: "q.health.life",
  numeral: fmt(last(D.life).value),
  unit: "years",
  text: `An Indian born in ${last(D.life).date} can expect to live about ${fmt(last(D.life).value)} years, three times as long as one born in 1911. The healthy share has not kept pace: about 58 of those years are lived in good health.`,
  title: "Life expectancy has nearly tripled since 1911; Covid took more than three years off it",
  dek: `Life expectancy at birth, India, years, ${first(D.life).date}–${last(D.life).date}`,
  spec: SPEC.life,
  source: `${SRC.owidLife} (Riley; UN World Population Prospects)`,
};

export const homeBand: Fig[] = [
  { id: "fig-poverty", q: "q.econ.poverty", text: "Extreme poverty, below $3 a day, is down to 5.3%. Move the line to $4.20 and it is still 23.9%.", spec: SPEC.poverty, source: SRC.wb },
  { id: "fig-online", q: "q.society.connected", text: "Seven in ten Indians used the internet in 2025. In 2019 it was three in ten.", spec: SPEC.net, source: SRC.itu },
  { id: "fig-co2", q: "q.climate.co2", text: `${fmt(last(D.co2).value, 2)} billion tonnes in ${last(D.co2).date}, more than doubled since 2005, yet only ${fmt(last(D.co2pc).value, 1)} tonnes a person.`, spec: SPEC.co2, source: SRC.gcb },
];

/** India in one sentence: each figure links to the question that answers it. */
export const opening = [
  { text: "India is " }, { fig: `${fmt(at(D.pop, "2024"))} crore`, q: "q.people.total" }, { text: " people who can expect to live " },
  { fig: `${fmt(last(D.life).value)} years`, q: "q.health.life" }, { text: ", on " },
  { fig: `about $${fmt(Math.round(at(D.gdp, "2025") / 100) * 100)}`, q: "q.econ.size" }, { text: " of output a head. " },
  { fig: "Seven in ten", q: "q.society.connected" }, { text: " are online. A woman has " },
  { fig: fmt(last(D.tfrIndia).value, 1), q: "q.people.fertility_divergence" }, { text: " children on average, and the country puts " },
  { fig: `${fmt(last(D.co2).value, 2)} billion tonnes`, q: "q.climate.co2" }, { text: " of carbon dioxide into the air each year." },
] as Array<{ text?: string; fig?: string; q?: string }>;

/** Each chapter's lead question and figure, and up to three more with theirs. */
export const CHAPTER_FIGS: Record<DomainId, { statement: string; lead: Fig; band: Fig[] }> = {
  people: {
    statement: `India passed ${fmt(at(D.pop, "2024"))} crore people with fewer than two children per woman. Its states reached that point on clocks set thirty years apart, and the gap is now a question of political weight.`,
    lead: { id: "fig-tfr-states", q: "q.people.fertility_divergence", text: "A woman in Kerala has, on average, 1.5 children; a woman in Bihar, 2.8. Both rates fell from far higher, but on clocks set thirty years apart. Schooling for girls tracks the gap more closely than income does.",
      title: "Every large state's fertility fell after 1991. Bihar is now about where Maharashtra was then", dek: "Total fertility rate, births per woman, 1991 and 2023. States with a 1991 estimate.", spec: SPEC.tfrStates, source: `${SRC.srs} 1991 and 2023` },
    band: [
      { id: "fig-pop", q: "q.people.total", text: "About 145 crore, still rising, though each generation is now smaller than the one before.", spec: SPEC.pop, source: SRC.wpp },
      { id: "fig-age", q: "q.people.age", text: "Half of India was under 21 in 2000. By 2100 the midpoint is projected near 48.", spec: SPEC.medage, source: SRC.wpp },
      { id: "fig-kids", q: "q.people.pyramid", text: "The base is narrowing: children fall from 35.6% of India in 2000 to 22.4% by 2030.", spec: SPEC.kids, source: SRC.wpp },
    ],
  },
  economy: {
    statement: "India's economy is the fifth largest in the world and among the poorest per person. The questions here follow the money: who earns it, who taxes it, where it goes abroad, and how far it stretches.",
    lead: { id: "fig-poverty", q: "q.econ.poverty", text: "Extreme poverty, below $3 a day, is down to 5.3%. Move the line to $4.20 and it is still 23.9%. The line you choose changes the answer.",
      title: "Extreme poverty all but gone; most Indians still below $8.30 a day", dek: "Share of Indians below each poverty line, % (2021 prices). Estimates after 2024 are projections.", spec: SPEC.poverty, source: SRC.wb },
    band: [
      { id: "fig-lrs", q: "q.econ.lrs_remittances", text: "Indians sent $28.98 billion abroad under the remittance scheme in 2025–26, most of it after the limit rose in 2015.", spec: SPEC.lrs, source: SRC.rbi },
      { id: "fig-trade", q: "q.econ.trade", text: "Goods exports reached $445 billion in 2025, and India still buys more than it sells.", spec: SPEC.trade, source: "RBI, Handbook of Statistics on the Indian Economy" },
    ],
  },
  health: {
    statement: "An Indian now lives nearly three times as long as one born in 1911. What kills Indians has changed too: heart disease and the roads more than infection.",
    lead: { id: "fig-life", q: "q.health.life", text: homeLead.text, title: homeLead.title, dek: homeLead.dek, spec: SPEC.life, source: homeLead.source },
    band: [
      { id: "fig-imr", q: "q.health.transition", text: `Infant deaths fell to ${fmt(last(D.imr).value)} in every 1,000 births in ${last(D.imr).date}. Chronic disease rose in their place.`, spec: SPEC.imr, source: SRC.srs },
    ],
  },
  energy: {
    statement: "India burns coal for most of its electricity and uses more of it every year. Two questions are answered so far; five more are being built.",
    lead: { id: "fig-intensity", q: "q.energy.state_transitions", text: "The national grid is getting cleaner slowly. Underneath, about thirty states are on separate paths, from almost all coal to almost none.",
      title: `Each unit of India's electricity carries a little less carbon than in ${first(D.intensity).date}`, dek: `Carbon intensity of electricity, grams of CO₂ per kWh, ${first(D.intensity).date}–${last(D.intensity).date}`, spec: SPEC.intensity, source: SRC.ember },
    band: [],
  },
  society: {
    statement: "How Indians work, learn and live: the world's largest workforce, most of it self-employed, and a country that came online in a decade.",
    lead: { id: "fig-online", q: "q.society.connected", text: "Seven in ten Indians used the internet in 2025. In 2019 it was three in ten. The connection is mobile-first and unequal.",
      title: "India came online in a decade", dek: `Share of Indians using the internet, %, ${first(D.net).date}–${last(D.net).date}`, spec: SPEC.net, source: SRC.itu },
    band: [
      { id: "fig-agri", q: "q.work.agriculture", text: "Two in five Indian workers still farm, for a sixth of the economy's output.", spec: SPEC.agri, source: SRC.wdi },
    ],
  },
  climate: {
    statement: "Heat, rain, air and carbon. India is among the largest emitters in total and among the smallest per person, and plants by a monsoon that is changing.",
    lead: { id: "fig-co2", q: "q.climate.co2", text: homeBand[2].text,
      title: "India's emissions more than doubled after 2005", dek: "CO₂ from fossil fuels and industry, billion tonnes, 1950–2024", spec: SPEC.co2, source: SRC.gcb },
    band: [
      { id: "fig-co2pc", q: "q.climate.co2_pc", text: `${fmt(last(D.co2pc).value, 1)} tonnes a person in ${last(D.co2pc).date}, far below the world average.`, spec: SPEC.co2pc, source: SRC.gcb },
    ],
  },
};

// ---------------------------------------------------------------- the monsoon plate
function stripeInk(v: number) {
  const hx = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mid = hx(INK.rule), end = hx(v < 0 ? INK.sindoor : INK.neel);
  const t = Math.abs(Math.max(-1, Math.min(1, v / 22))) ** 0.8;
  return "#" + mid.map((m, i) => Math.round(m + (end[i] - m) * t).toString(16).padStart(2, "0")).join("");
}

export const monsoon = (() => {
  const s = D.monsoon, n = s.length, y0 = +s[0].date;
  const pos = (year: number) => `${(((year - y0 + 0.5) / n) * 100).toFixed(2)}%`;
  const svg = `<svg viewBox="0 0 ${n * 10} 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${s.map((p, i) => `<rect x="${i * 10}" width="10.4" height="100" fill="${stripeInk(p.value)}"/>`).join("")}</svg>`;
  const wet = s.reduce((a, b) => (b.value > a.value ? b : a)), dry = s.reduce((a, b) => (b.value < a.value ? b : a));
  const pct = (v: number) => `${Math.abs(Math.round(v))}%`;
  const notes = [
    { at: pos(+wet.date), text: `${wet.date}, ${pct(wet.value)} over`, side: "end", phone: true },
    { at: pos(+dry.date), text: `${dry.date}, ${pct(dry.value)} short`, side: "start", phone: true },
    { at: pos(2002), text: `2002, ${pct(at(s, "2002"))} short`, side: "start", phone: false },
  ];
  const years = [y0, 1925, 1950, 1975, 2000, +last(s).date].map((y) => ({ y, at: pos(y) }));
  return { svg, notes, years, from: y0, to: +last(s).date, wet, dry,
    alt: `All-India June to September rainfall, departure from the long-run average, one stripe a year from ${y0} to ${last(s).date}. The driest year was ${dry.date}, ${pct(dry.value)} short; the wettest ${wet.date}, ${pct(wet.value)} over.` };
})();

// ---------------------------------------------------------------- small multiples
const frame = [{ date: "1971", value: 7 }, { date: "2023", value: 7 }];
/** One state's fertility, drawn by the kit on the shared 0 to 7 frame, with replacement at 2.1. */
function statePanel(points: Pt[], W: number, H: number) {
  const scene = draw({ form: "line", domain: "zero", series: [{ label: "x", points, role: "lead", color: INK.neel }, { label: "f", points: frame, role: "context" }] } as AnySpec, 520);
  const paths = scene.marks.filter((m) => m.kind === "path") as any[];
  const leadPath = paths.find((m) => m.stroke === INK.neel), fr = paths.find((m) => m !== leadPath);
  const P = (d: string) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  const f = P(fr.d), x0 = f[0][0], x1 = f[f.length - 1][0], y7 = f[0][1];
  const base = (scene.marks.find((m: any) => m.kind === "line" && m.stroke === INK.axis && m.y1 === m.y2) as any).y1;
  const X = (x: number) => r1(((x - x0) / (x1 - x0)) * (W - 6) + 1), Y = (y: number) => r1(((y - y7) / (base - y7)) * (H - 2) + 1);
  const pts = P(leadPath.d).map(([x, y]) => [X(x), Y(y)]);
  const yr = Y(y7 + (base - y7) * (1 - 2.1 / 7)), end = pts[pts.length - 1];
  return renderSvg({ width: W, height: H, alt: "", marks: [
    { kind: "line", x1: 0, x2: W, y1: H - 0.5, y2: H - 0.5, stroke: INK.stone, width: 1 },
    { kind: "line", x1: 0, x2: W, y1: yr, y2: yr, stroke: INK.stoneLine, width: 1 },
    { kind: "path", d: "M" + pts.map((p) => p.join(",")).join("L"), stroke: INK.neel, width: 1.7, join: "round" },
    { kind: "circle", cx: end[0], cy: end[1], r: 2.8, fill: INK.neel },
  ] as any }).replace('role="img"', 'aria-hidden="true" focusable="false"').replace(/ aria-label="[^"]*"/, "").replace(/<path /g, '<path vector-effect="non-scaling-stroke" ');
}

const STATES: Array<[string, string]> = [["Tamil Nadu", "tamil_nadu"], ["West Bengal", "west_bengal"], ["Maharashtra", "maharashtra"], ["Kerala", "kerala"], ["Andhra Pradesh", "andhra_pradesh"], ["Punjab", "punjab"], ["Karnataka", "karnataka"], ["Odisha", "odisha"], ["Gujarat", "gujarat"], ["Haryana", "haryana"], ["Assam", "assam"], ["Rajasthan", "rajasthan"], ["Madhya Pradesh", "madhya_pradesh"], ["Uttar Pradesh", "uttar_pradesh"], ["Bihar", "bihar"]];

/** Fifteen states' fertility, one panel each on one scale, lowest first. */
export const fertilityPanels = STATES.map(([name, f]) => {
  const s = tfr(f);
  return { name, first: first(s), last: last(s), above: last(s).value > 2.1, svg: statePanel(s, 204, 96) };
}).sort((a, b) => a.last.value - b.last.value);
