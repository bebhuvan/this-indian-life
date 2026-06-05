import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as Chart from "./nfhs6-charts.mjs";

// ---------------------------------------------------------------------------
// NFHS-6 (2023-24) data + the hub's chart spec. Numbers are LOCKED (cleaned
// fact-sheet extraction). The Astro page AND the DeepSeek prose script both
// import this so a chart and its explainer always describe the same numbers.
// ---------------------------------------------------------------------------

const bundle = JSON.parse(readFileSync(resolve(process.cwd(), "data/nfhs6/nfhs6_clean.json"), "utf8"));
export const SURVEY = "NFHS-6 (2023-24)";
export const PREV = "NFHS-5 (2019-21)";
export const indicators = bundle.indicators;
export const areas = bundle.areas;
export const HEALTH = "#15A382";

export function india(num) {
  return areas.India?.[String(num)] ?? { urban: null, rural: null, total: null, nfhs5: null };
}
export const total = (num) => india(num).total;

const SHORT = {
  1: "Children under age 5", 2: "Population under age 15", 3: "Population aged 60+",
  4: "Electricity at home", 5: "Improved drinking water", 6: "Iodised salt",
  7: "Household health insurance", 8: "Household bank account", 9: "Women who ever attended school",
  10: "Women who own a home or land", 11: "Pre-school (age 2-4)",
  12: "Women with 10+ years schooling", 13: "Men with 10+ years schooling",
  14: "Women who use the internet", 15: "Men who use the internet",
  16: "Women married before 18", 17: "Men married before 21",
  18: "Total fertility rate", 19: "Teen pregnancy (15-19)",
  20: "Any family-planning method", 21: "Any modern contraceptive", 22: "Traditional methods",
  23: "Female sterilisation", 24: "Male sterilisation",
  25: "Unmet need for family planning", 26: "Unmet need — spacing", 27: "Unmet need — limiting",
  28: "Antenatal care in 1st trimester", 29: "Any antenatal care",
  30: "4+ antenatal visits", 31: "Protected vs neonatal tetanus", 32: "Iron-folic acid, 100+ days",
  33: "Iron-folic acid, 180+ days", 34: "Mother & Child Protection card", 35: "Institutional births",
  36: "Births in a public facility", 37: "Skilled birth attendance", 38: "Caesarean births",
  39: "Caesarean — private facilities", 40: "Caesarean — public facilities", 41: "Mother postnatal care ≤2 days",
  42: "Home birth → check-up in 24h", 43: "Newborn postnatal care ≤2 days",
  44: "Children fully vaccinated", 45: "Fully vaccinated (card only)", 46: "Received any vaccine",
  47: "BCG", 48: "Polio (3 doses)", 49: "Pentavalent (3 doses)",
  50: "Measles (1st dose)", 51: "Measles 2nd dose", 52: "Hepatitis-B birth dose",
  53: "Rotavirus vaccine", 54: "Vitamin A (last 6 months)",
  55: "Vaccinated in a public facility", 56: "Vaccinated in a private facility",
  57: "Had diarrhoea (last 2 weeks)", 59: "Had ARI symptoms (last 2 weeks)", 60: "Fever/ARI taken to care",
  61: "Breastfed within 1 hour", 62: "Exclusively breastfed (<6 mo)", 63: "Currently breastfeeding (<6 mo)",
  64: "Breastfed (plain water allowed)", 65: "Solid food at 6-8 months",
  66: "Adequate diet — breastfed", 67: "Adequate diet — not breastfed", 68: "Adequate diet, 6-23 months",
  69: "Child stunting", 70: "Child wasting", 71: "Child severe wasting", 72: "Child underweight",
  73: "Child overweight", 74: "Women underweight", 75: "Men underweight",
  76: "Women overweight or obese", 77: "Men overweight or obese",
  80: "Women: high blood sugar", 83: "Men: high blood sugar", 86: "Women: high blood pressure",
  89: "Men: high blood pressure", 90: "Women in household decisions", 91: "Women in paid work",
  92: "Women with own bank account", 93: "Women with own mobile phone", 94: "Hygienic menstrual protection",
  95: "Spousal violence (ever)", 96: "Violence during pregnancy", 98: "Women using tobacco",
  99: "Men using tobacco", 100: "Women consuming alcohol", 101: "Men consuming alcohol",
};

// Indicator definitions (transcribed once from the NFHS-6 fact-sheet footnotes).
// Surfaced as an SVG <title> tooltip on a chart so a reader can check what a
// term actually counts. Keep terse — these are clarifications, not prose.
const DEFS = {
  5: "Improved source: piped water, public tap/standpipe, tube well or borehole, protected dug well/spring, rainwater, tanker, bottled water, or community RO plant.",
  20: "Any method includes modern and traditional methods, plus other methods not shown separately.",
  21: "Modern methods: sterilisation, pill, IUD, injectables, condoms and other modern methods.",
  25: "Fecund women not using contraception who want to delay (spacing) or stop (limiting) childbearing.",
  26: "Women who want to postpone their next birth but are not using contraception.",
  27: "Women who want no more children but are not using contraception.",
  31: "Protected against neonatal tetanus via the required tetanus-toxoid injections before the last birth.",
  37: "Doctor, nurse, LHV, ANM, midwife or other health personnel.",
  44: "Received BCG, measles-containing vaccine, and 3 doses each of polio and DPT/penta — from card or mother's recall.",
  45: "Fully vaccinated among children whose vaccination card was seen by the interviewer.",
  62: "Children under 6 months given only breast milk in the day before the survey.",
  66: "Breastfed children 6-23 months fed 4+ food groups at a minimum meal frequency.",
  67: "Non-breastfed children 6-23 months meeting the minimum feeding practices.",
  68: "Children 6-23 months fed a diet diverse and frequent enough for healthy growth.",
  69: "Height-for-age below −2 standard deviations of the WHO child growth standard.",
  70: "Weight-for-height below −2 standard deviations of the WHO standard.",
  71: "Weight-for-height below −3 standard deviations of the WHO standard.",
  72: "Weight-for-age below −2 standard deviations of the WHO standard.",
  73: "Weight-for-height above +2 standard deviations of the WHO standard.",
  74: "Body Mass Index below 18.5 kg/m² (excludes pregnant women and recent mothers).",
  75: "Body Mass Index below 18.5 kg/m².",
  76: "Body Mass Index of 25.0 kg/m² or higher.",
  77: "Body Mass Index of 25.0 kg/m² or higher.",
  80: "Random blood sugar above 140 mg/dl, or on medication to control it.",
  83: "Random blood sugar above 140 mg/dl, or on medication to control it.",
  86: "Systolic ≥140 and/or diastolic ≥90 mm Hg, or on blood-pressure medication.",
  89: "Systolic ≥140 and/or diastolic ≥90 mm Hg, or on blood-pressure medication.",
  90: "Women who take part in decisions on their own health care, major purchases, and visits to family.",
  94: "Reusable or disposable sanitary pads, tampons, or menstrual cups.",
  95: "Physical and/or sexual violence by a husband, ever experienced.",
};
export const defFor = (num) => DEFS[num] || null;

const FULL_LABEL_OVERRIDES = {
  76: "Women age 15-49 with BMI >= 25.0 kg/m2 (%)",
  77: "Men age 15-49 with BMI >= 25.0 kg/m2 (%)",
};

export function label(num) {
  if (SHORT[num]) return SHORT[num];
  return (indicators[String(num)] ?? "").replace(/\s*\(%\)\s*$/, "").replace(/[²³¹⁰-⁹,]+$/u, "").trim();
}
export const fullLabel = (num) => (FULL_LABEL_OVERRIDES[num] ?? indicators[String(num)] ?? "").trim();
export const unitFor = (num) => (num === 18 ? "" : "%");

const SHORT_AREA = {
  "Dadra & Nagar Haveli and Daman & Diu": "DNH & Daman & Diu",
  "Andaman and Nicobar Islands": "Andaman & Nicobar",
  "Jammu and Kashmir": "Jammu & Kashmir",
  "NCT of Delhi": "Delhi",
};
export const shortArea = (a) => SHORT_AREA[a] || a;

// Polarity: +1 = higher is worse, -1 = higher is better, 0 = neutral. Drives
// the "better/worse" verdict on change charts and amber/jade direction on maps.
const BAD_HIGH = new Set([16, 17, 19, 25, 26, 27, 57, 58, 59, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 95, 96, 97, 98, 99, 100, 101, 38, 39, 40]);
const NEUTRAL = new Set([1, 2, 3, 18, 20, 21, 22, 23, 24, 36, 55, 56]);
export const polarityOf = (num) => (NEUTRAL.has(num) ? 0 : BAD_HIGH.has(num) ? 1 : -1);

export const trend = (nums) => nums.map((num) => ({ num, label: label(num), then: india(num).nfhs5, now: india(num).total, ws: polarityOf(num) }));
export function movers(nums) {
  return nums.map((num) => {
    const c = india(num);
    if (c.total == null || c.nfhs5 == null) return null;
    const delta = +(c.total - c.nfhs5).toFixed(1);
    const ws = polarityOf(num);
    return { num, label: label(num), delta, improved: ws === 0 ? delta > 0 : ws > 0 ? delta < 0 : delta > 0 };
  }).filter(Boolean);
}
export const split = (nums) => nums.map((num) => ({ num, label: label(num), urban: india(num).urban, rural: india(num).rural, total: india(num).total }));

// --- state tile-grid cartogram ----------------------------------------------
export const TILE_GRID = {
  "Jammu and Kashmir": { abbr: "J&K", r: 0, c: 2 }, Ladakh: { abbr: "LA", r: 0, c: 3 },
  Chandigarh: { abbr: "CH", r: 1, c: 1 }, Punjab: { abbr: "PB", r: 1, c: 2 }, "Himachal Pradesh": { abbr: "HP", r: 1, c: 3 },
  Uttarakhand: { abbr: "UK", r: 1, c: 4 }, Sikkim: { abbr: "SK", r: 1, c: 7 }, "Arunachal Pradesh": { abbr: "AR", r: 1, c: 8 },
  Rajasthan: { abbr: "RJ", r: 2, c: 1 }, Haryana: { abbr: "HR", r: 2, c: 3 }, "NCT of Delhi": { abbr: "DL", r: 2, c: 4 },
  "Uttar Pradesh": { abbr: "UP", r: 2, c: 5 }, Bihar: { abbr: "BR", r: 2, c: 6 }, Assam: { abbr: "AS", r: 2, c: 8 },
  Nagaland: { abbr: "NL", r: 2, c: 9 }, Gujarat: { abbr: "GJ", r: 3, c: 0 }, "Madhya Pradesh": { abbr: "MP", r: 3, c: 3 },
  Jharkhand: { abbr: "JH", r: 3, c: 5 }, "West Bengal": { abbr: "WB", r: 3, c: 6 }, Meghalaya: { abbr: "ML", r: 3, c: 8 },
  Mizoram: { abbr: "MZ", r: 3, c: 9 }, "Dadra & Nagar Haveli and Daman & Diu": { abbr: "DH", r: 4, c: 1 },
  Maharashtra: { abbr: "MH", r: 4, c: 2 }, Telangana: { abbr: "TG", r: 4, c: 3 }, Chhattisgarh: { abbr: "CG", r: 4, c: 4 },
  Odisha: { abbr: "OD", r: 4, c: 6 }, Tripura: { abbr: "TR", r: 4, c: 8 }, Goa: { abbr: "GA", r: 5, c: 1 },
  Karnataka: { abbr: "KA", r: 5, c: 2 }, "Andhra Pradesh": { abbr: "AP", r: 5, c: 4 },
  "Andaman and Nicobar Islands": { abbr: "AN", r: 5, c: 8 }, Lakshadweep: { abbr: "LD", r: 6, c: 0 },
  Kerala: { abbr: "KL", r: 6, c: 2 }, "Tamil Nadu": { abbr: "TN", r: 6, c: 3 }, Puducherry: { abbr: "PY", r: 6, c: 4 },
};
export const TILE_ROWS = 7, TILE_COLS = 10;

export function stateMap(num) {
  const cells = Object.entries(TILE_GRID).map(([area, t]) => ({
    area, name: shortArea(area), abbr: t.abbr, r: t.r, c: t.c, value: areas[area]?.[String(num)]?.total ?? null, nfhs5: areas[area]?.[String(num)]?.nfhs5 ?? null,
  }));
  const vals = cells.map((d) => d.value).filter((v) => v != null);
  return { num, label: label(num), india: total(num), cells, min: Math.min(...vals), max: Math.max(...vals) };
}
export function extremes(num) {
  const m = stateMap(num);
  const ranked = m.cells.filter((d) => d.value != null).sort((a, b) => a.value - b.value);
  return { ...m, lowest: ranked[0], highest: ranked[ranked.length - 1] };
}

// ---------------------------------------------------------------------------
// CHART SPEC — one declarative entry per chart. kind drives both render + facts.
// ---------------------------------------------------------------------------
// Tabs are ordered as a life-course arc — read top to bottom and the survey
// becomes a story: the home a child is born into → the woman who becomes a
// mother → the family she starts → pregnancy → birth → the first five years →
// the adult body → the diseases of middle age → ageing → who pays for it all.
// Each tab carries a Q&A spine (`questions`): editorial questions whose ANSWERS
// the prose script writes to locked numbers, with the charts that answer each.
export const TABS = [
  {
    id: "overview", label: "The Big Shift", title: "The big shift",
    dek: "NFHS-6 reads less like steady progress than a handover: childhood deprivation recedes, while adult metabolic disease moves forward.",
    macha: "The old health burden is easing. The new one is arriving fast.",
    kpis: [7, 14, 18, 69, 83, 38],
    questions: [
      { id: "ov-what", q: "What is the main shift in NFHS-6?", blockIds: ["ov-crossover", "ov-slope"] },
      { id: "ov-most", q: "Where did the survey move fastest?", blockIds: ["ov-movers"] },
    ],
    blocks: [
      { id: "ov-crossover", h: "Old burdens down, new burdens up", kind: "crossover", nums: [69, 16, 72, 76, 83, 38] },
      { id: "ov-slope", h: "A health transition in six lines", kind: "dumbbell", nums: [69, 16, 72, 7, 76, 83] },
      { id: "ov-movers", h: "The fastest changes", kind: "movers", nums: [14, 7, 51, 33, 92, 93, 95, 76, 69, 30, 38, 12, 83] },
    ],
  },
  {
    id: "household", label: "Life at Home", title: "How India lives at home",
    dek: "The basic household floor has risen: electricity, improved water and banking are close to universal. Ownership and early learning still lag behind access.",
    macha: "The house is better served. It is not yet equally owned.",
    kpis: [4, 5, 6, 8, 10, 11],
    questions: [
      { id: "hh-power", q: "Has basic household infrastructure reached saturation?", blockIds: ["hh-basics", "hh-water-map"] },
      { id: "hh-own", q: "Does financial access translate into assets?", blockIds: ["hh-assets", "hh-landown-map"] },
      { id: "hh-preschool-q", q: "Is early learning becoming normal?", blockIds: ["hh-preschool", "hh-preschool-map"] },
    ],
    blocks: [
      { id: "hh-basics", h: "The household floor is high", kind: "change", nums: [4, 5, 6], max: 100 },
      { id: "hh-water-map", h: "The remaining water gaps", kind: "map", num: 5 },
      { id: "hh-assets", h: "Accounts are common, assets are not", kind: "change", nums: [10, 8], max: 100 },
      { id: "hh-landown-map", h: "Where women own a home or land", kind: "map", num: 10 },
      { id: "hh-preschool", h: "Pre-school is still short of half", kind: "change", nums: [11], max: 70 },
      { id: "hh-preschool-map", h: "Early learning by state", kind: "map", num: 11 },
    ],
  },
  {
    id: "womens-lives", label: "A Woman's World", title: "The ground shifting under women",
    dek: "Women moved sharply into the internet and banking system. Schooling improved more slowly, and formal power inside work and households remains harder to move.",
    macha: "Access rose faster than authority.",
    kpis: [14, 15, 92, 16, 95, 93],
    questions: [
      { id: "wl-online", q: "How far did women move online?", blockIds: ["wl-digital", "wl-internet-map"] },
      { id: "wl-catchup", q: "Where is agency rising, and where is it stuck?", blockIds: ["wl-schooling-gap", "wl-autonomy", "wl-schooling-map", "wl-bank-map"] },
      { id: "wl-childbrides", q: "Where does child marriage remain concentrated?", blockIds: ["wl-marriage-map"] },
      { id: "wl-safety", q: "Is everyday safety improving?", blockIds: ["wl-violence", "wl-menstrual-map"] },
    ],
    blocks: [
      { id: "wl-digital", h: "Women entered the internet faster than men", kind: "change", nums: [14, 15, 93], max: 100 },
      { id: "wl-internet-map", h: "Women online, state by state", kind: "map", num: 14 },
      { id: "wl-schooling-gap", h: "Schooling narrows, but not enough", kind: "change", nums: [12, 13], max: 70 },
      { id: "wl-autonomy", h: "Financial access outruns household power", kind: "change", nums: [92, 12, 91, 90], max: 100 },
      { id: "wl-schooling-map", h: "Where women finish school", kind: "map", num: 12 },
      { id: "wl-bank-map", h: "Where women have their own bank account", kind: "map", num: 92 },
      { id: "wl-marriage-map", h: "Child marriage has a geography", kind: "map", num: 16 },
      { id: "wl-violence", h: "Violence fell, but remains common", kind: "change", nums: [95, 96, 97], max: 40 },
      { id: "wl-menstrual-map", h: "Menstrual hygiene, state by state", kind: "map", num: 94 },
    ],
  },
  {
    id: "family-fertility", label: "Starting a Family", title: "How India has children now",
    dek: "Fertility is at replacement nationally, but contraception remains gendered and uneven. The average hides a country moving at different speeds.",
    macha: "Fertility has fallen. The burden of preventing pregnancy has not moved much.",
    kpis: [18, 23, 24, 21, 19, 25],
    questions: [
      { id: "ff-howmany", q: "What does replacement fertility hide?", blockIds: ["ff-tfr-map", "ff-tfr-strip"] },
      { id: "ff-prevent", q: "Who carries the burden of contraception?", blockIds: ["ff-method-mix", "ff-method-trend", "ff-sterilisation", "ff-sterilisation-map"] },
      { id: "ff-unmet-q", q: "Who still can't get the family planning they want?", blockIds: ["ff-unmet"] },
      { id: "ff-teen-q", q: "Are teenagers still becoming mothers?", blockIds: ["ff-teen", "ff-teen-map"] },
    ],
    blocks: [
      { id: "ff-tfr-map", h: "Replacement fertility, unevenly reached", kind: "map", num: 18 },
      { id: "ff-tfr-strip", h: "The fertility spread", kind: "ranked", num: 18 },
      {
        id: "ff-method-mix", h: "Modern methods lose ground", kind: "stack",
        segLabels: ["Modern methods", "Traditional methods"], colors: ["#15A382", "#EFA227"], max: 80,
        rows: [
          { label: "2019-21", nums: [21, 22], period: "nfhs5" },
          { label: "2023-24", nums: [21, 22], period: "now" },
        ],
      },
      { id: "ff-method-trend", h: "Traditional methods gained share", kind: "change", nums: [20, 21, 22], max: 80 },
      { id: "ff-sterilisation", h: "Sterilisation is still mostly female", kind: "rows", rows: [{ label: "Female sterilisation", num: 23 }, { label: "Male sterilisation", num: 24 }, { label: "Any modern method", num: 21 }], max: 60 },
      { id: "ff-sterilisation-map", h: "The female-sterilisation belt", kind: "map", num: 23 },
      { id: "ff-unmet", h: "Spacing need has not disappeared", kind: "change", nums: [25, 26, 27], max: 12 },
      { id: "ff-teen", h: "Teen pregnancy barely moved", kind: "change", nums: [19, 16, 25], max: 30 },
      { id: "ff-teen-map", h: "Where teenagers still become mothers", kind: "map", num: 19 },
    ],
  },
  {
    id: "mothers", label: "The Pregnancy Journey", title: "The pregnancy journey",
    dek: "Pregnancy care is broader and earlier than before. The weak point is continuity: many women enter care, fewer complete the full course.",
    macha: "The first contact is easier. Full care is still uneven.",
    kpis: [29, 28, 30, 33, 41, 34],
    questions: [
      { id: "mh-anc", q: "Are pregnancy check-ups becoming complete care?", blockIds: ["mh-antenatal", "mh-anc-map", "mh-firsttri-map"] },
      { id: "mh-iron", q: "Does iron coverage last long enough?", blockIds: ["mh-ifa", "mh-ifa-map"] },
      { id: "mh-after", q: "Does care continue after delivery?", blockIds: ["mh-aftercare", "mh-newborn", "mh-mcp-map"] },
    ],
    blocks: [
      { id: "mh-antenatal", h: "More mothers get repeated check-ups", kind: "change", nums: [29, 28, 30], max: 100 },
      { id: "mh-anc-map", h: "Where mothers get full antenatal care", kind: "map", num: 30 },
      { id: "mh-firsttri-map", h: "Where check-ups start early", kind: "map", num: 28 },
      { id: "mh-ifa", h: "Iron coverage lengthened", kind: "change", nums: [32, 33], max: 70 },
      { id: "mh-ifa-map", h: "Where mothers get enough iron", kind: "map", num: 33 },
      { id: "mh-aftercare", h: "The first two days matter", kind: "change", nums: [31, 41], max: 100 },
      { id: "mh-newborn", h: "Newborn care depends on place of birth", kind: "change", nums: [43, 42], max: 100 },
      { id: "mh-mcp-map", h: "The Mother & Child Protection card", kind: "map", num: 34 },
    ],
  },
  {
    id: "being-born", label: "Being Born", title: "How birth changed",
    dek: "Institutional birth is now the norm. The new question is not whether women reach facilities, but what happens once they get there.",
    macha: "Hospital birth became normal. Surgical birth is becoming common.",
    kpis: [35, 38, 39, 40, 37, 36],
    questions: [
      { id: "bb-where", q: "Has birth moved fully into health facilities?", blockIds: ["bb-institutional", "bb-institutional-map"] },
      { id: "bb-csection-q", q: "Why are so many births surgical?", blockIds: ["bb-csection", "bb-csection-map", "bb-csection-strip"] },
    ],
    blocks: [
      { id: "bb-institutional", h: "Birth is now mostly institutional", kind: "change", nums: [35, 37], max: 100 },
      { id: "bb-institutional-map", h: "The last home-birth pockets", kind: "map", num: 35 },
      { id: "bb-csection", h: "C-sections are concentrated in private care", kind: "rows", rows: [{ label: "All Caesareans", num: 38 }, { label: "In public facilities", num: 40 }, { label: "In private facilities", num: 39 }], max: 60 },
      { id: "bb-csection-map", h: "Surgical birth by state", kind: "map", num: 38 },
      { id: "bb-csection-strip", h: "States vs the WHO band", kind: "ranked", num: 38 },
    ],
  },
  {
    id: "growing-up", label: "The First Five Years", title: "The first five years",
    dek: "The vaccine story is strong, especially rotavirus. The feeding story is weaker: many children are protected from infections but not well nourished.",
    macha: "The needle reached farther than the plate.",
    kpis: [44, 53, 51, 55, 68, 61],
    questions: [
      { id: "gu-vax", q: "How much did vaccination improve?", blockIds: ["gu-immunisation", "gu-vaccines", "gu-rotavirus-map", "gu-immunisation-map", "gu-publicprivate"] },
      { id: "gu-ill", q: "What happens when children fall ill?", blockIds: ["gu-illness"] },
      { id: "gu-feed", q: "Is feeding keeping pace with vaccination?", blockIds: ["gu-feeding", "gu-breastfeeding", "gu-adequate-diet"] },
    ],
    blocks: [
      { id: "gu-immunisation", h: "Rotavirus changed the immunisation picture", kind: "change", nums: [44, 51, 53], max: 100 },
      { id: "gu-vaccines", h: "Vaccine by vaccine", kind: "smallmult", nums: [47, 48, 49, 50, 52, 54], cols: 2 },
      { id: "gu-rotavirus-map", h: "The rotavirus rollout, mapped", kind: "map", num: 53 },
      { id: "gu-publicprivate", h: "The public system carries it", kind: "split", nums: [55, 56], max: 100 },
      { id: "gu-immunisation-map", h: "The immunisation map", kind: "map", num: 44 },
      { id: "gu-illness", h: "Care-seeking did not rise", kind: "change", nums: [60, 57, 59], max: 80 },
      { id: "gu-feeding", h: "The diet gap remains large", kind: "change", nums: [61, 65, 68], max: 70 },
      { id: "gu-breastfeeding", h: "Exclusive breastfeeding is slipping", kind: "change", nums: [62, 63, 64], max: 100 },
      { id: "gu-adequate-diet", h: "An adequate diet is rare either way", kind: "rows", rows: [{ label: "Breastfed children", num: 66 }, { label: "Not breastfed", num: 67 }, { label: "All children 6-23 mo", num: 68 }], max: 25 },
    ],
  },
  {
    id: "double-burden", label: "The Double Burden", title: "Healthier or sicker?",
    dek: "Child undernutrition has improved, but adult nutrition is splitting in two directions. Underweight persists while overweight rises.",
    macha: "India is no longer choosing between hunger and excess. It has both.",
    kpis: [69, 72, 76, 77, 74, 80],
    questions: [
      { id: "db-kids", q: "Are child nutrition indicators improving?", blockIds: ["db-children", "db-stunting-map"] },
      { id: "db-adults", q: "What does the adult double burden look like?", blockIds: ["db-diverging", "db-underweight-map"] },
      { id: "db-obesity-q", q: "Where is overweight most visible?", blockIds: ["db-obesity-map", "db-obesity-men-map", "db-obesity-strip", "db-obesity-dist"] },
    ],
    blocks: [
      { id: "db-children", h: "Stunting fell; wasting barely moved", kind: "change", nums: [69, 72, 70, 71, 73], max: 40 },
      { id: "db-stunting-map", h: "The stunting map", kind: "map", num: 69 },
      { id: "db-diverging", h: "Underweight and overweight now coexist", kind: "diverging", leftLabel: "Underweight", rightLabel: "Overweight / obese", left: "#EFA227", groups: [{ label: "Women", l: 74, r: 76 }, { label: "Men", l: 75, r: 77 }], max: 40 },
      { id: "db-underweight-map", h: "Where women still go hungry", kind: "map", num: 74 },
      { id: "db-obesity-map", h: "Women overweight or obese, by state", kind: "map", num: 76 },
      { id: "db-obesity-men-map", h: "Men overweight or obese, by state", kind: "map", num: 77 },
      { id: "db-obesity-strip", h: "The spread across states", kind: "ranked", num: 76 },
      { id: "db-obesity-dist", h: "How far apart the states are", kind: "diststrip", num: 76 },
    ],
  },
  {
    id: "silent-epidemics", label: "The Silent Epidemics", title: "What's rising in the blood",
    dek: "Blood sugar rose sharply; blood pressure did not. NFHS-6 points to a metabolic shift that is no longer only urban.",
    macha: "Sugar is rising faster than the old risk story explains.",
    kpis: [80, 83, 86, 89, 99, 101],
    questions: [
      { id: "se-diab", q: "How fast is high blood sugar rising?", blockIds: ["se-diabetes", "se-severity", "se-split", "se-diabetes-map", "se-diabetes-dist"] },
      { id: "se-bp-q", q: "Is blood pressure moving the same way?", blockIds: ["se-bp", "se-bp-severity"] },
      { id: "se-drivers", q: "What's driving it?", blockIds: ["se-tobacco", "se-tobacco-map"] },
    ],
    blocks: [
      { id: "se-diabetes", h: "High blood sugar rose fast", kind: "change", nums: [80, 83], max: 25 },
      {
        id: "se-severity", h: "Most of the rise is in the danger zone", kind: "stack",
        segLabels: ["High (141-160 mg/dl)", "Very high (>160 mg/dl)"], colors: ["#EFA227", "#C23B22"], max: 25,
        rows: [
          { label: "Women · 2019-21", nums: [78, 79], period: "nfhs5" },
          { label: "Women · 2023-24", nums: [78, 79], period: "now" },
          { label: "Men · 2019-21", nums: [81, 82], period: "nfhs5" },
          { label: "Men · 2023-24", nums: [81, 82], period: "now" },
        ],
      },
      { id: "se-split", h: "Urban higher, rural catching up", kind: "split", nums: [80, 83], max: 25 },
      { id: "se-diabetes-map", h: "Where sugar runs highest", kind: "map", num: 83 },
      { id: "se-diabetes-dist", h: "The gap between states", kind: "diststrip", num: 83 },
      { id: "se-bp", h: "Blood pressure moved the other way", kind: "change", nums: [86, 89], max: 25 },
      {
        id: "se-bp-severity", h: "Blood pressure, by severity", kind: "stack",
        segLabels: ["Mildly elevated", "Moderate/severe"], colors: ["#EFA227", "#C23B22"], max: 20,
        rows: [
          { label: "Women · 2019-21", nums: [84, 85], period: "nfhs5" },
          { label: "Women · 2023-24", nums: [84, 85], period: "now" },
          { label: "Men · 2019-21", nums: [87, 88], period: "nfhs5" },
          { label: "Men · 2023-24", nums: [87, 88], period: "now" },
        ],
      },
      { id: "se-tobacco", h: "Tobacco and alcohol changed little", kind: "change", nums: [99, 98, 101, 100], max: 45 },
      { id: "se-tobacco-map", h: "The tobacco map", kind: "map", num: 99 },
    ],
  },
  {
    id: "ageing", label: "Growing Older", title: "A country growing up",
    dek: "India remains young, but the direction has changed. Children form a smaller share; older adults form a larger one.",
    macha: "The age structure is shifting before the country feels old.",
    kpis: [1, 2, 3, 18, 19, 16],
    questions: [
      { id: "ag-young", q: "How is the age structure changing?", blockIds: ["ag-structure"] },
      { id: "ag-where", q: "Which states are ageing first?", blockIds: ["ag-old-map", "ag-young-map", "ag-old-strip"] },
    ],
    blocks: [
      { id: "ag-structure", h: "Children down, elders up", kind: "change", nums: [1, 2, 3], max: 30 },
      { id: "ag-old-map", h: "Where India is oldest", kind: "map", num: 3 },
      { id: "ag-young-map", h: "Where India is youngest", kind: "map", num: 2 },
      { id: "ag-old-strip", h: "The elderly share across states", kind: "ranked", num: 3 },
    ],
  },
  {
    id: "who-gets-care", label: "Who Gets Care", title: "Who pays, where they go",
    dek: "Insurance expanded quickly, helped by near-universal banking. But public and private systems now divide different kinds of care.",
    macha: "Insurance grew. The direction of care is more complicated.",
    kpis: [7, 36, 55, 35, 8, 9],
    questions: [
      { id: "wgc-insured", q: "How far did insurance coverage expand?", blockIds: ["wgc-insurance", "wgc-insurance-map"] },
      { id: "wgc-banked", q: "Is the payment infrastructure in place?", blockIds: ["wgc-bank"] },
      { id: "wgc-publicprivate-q", q: "Which care stays public, and which shifts private?", blockIds: ["wgc-publicshare", "wgc-publicbirth-map"] },
    ],
    blocks: [
      { id: "wgc-insurance", h: "Insurance reached three in five households", kind: "split", nums: [7], max: 100 },
      { id: "wgc-insurance-map", h: "The insurance map", kind: "map", num: 7 },
      { id: "wgc-bank", h: "Bank accounts are almost universal", kind: "split", nums: [8], max: 100 },
      { id: "wgc-publicshare", h: "Vaccines stay public; births shift", kind: "rows", rows: [{ label: "Institutional births in public facility", num: 36 }, { label: "Vaccinations in public facility", num: 55 }], max: 100 },
      { id: "wgc-publicbirth-map", h: "Where births stay public", kind: "map", num: 36 },
    ],
  },
];

// --- render dispatch (page) --------------------------------------------------
function renderChartInner(b) {
  switch (b.kind) {
    case "change": return Chart.barChange(trend(b.nums), { max: b.max });
    case "crossover": return Chart.barChange(trend(b.nums), { max: b.max, signColor: true });
    case "movers": return Chart.moversChart(movers(b.nums));
    case "split": return Chart.splitGroup(split(b.nums), { max: b.max });
    case "slope": return Chart.slope(trend(b.nums), { max: b.max });
    case "dumbbell": return Chart.dumbbell(trend(b.nums), { max: b.max });
    case "smallmult": return Chart.smallMultiples(trend(b.nums), { max: b.max, cols: b.cols || 3 });
    case "diststrip": return Chart.distStrip(stateMap(b.num), { unit: unitFor(b.num), worseSide: polarityOf(b.num) });
    case "diverging": return Chart.diverging(
      b.groups.map((g) => ({ label: g.label, left: total(g.l), right: total(g.r) })),
      { leftLabel: b.leftLabel, rightLabel: b.rightLabel, leftColor: b.left, rightColor: b.right || "#D9542B", max: b.max });
    case "rows": return Chart.barRows(b.rows.map((r) => ({ label: r.label, then: india(r.num).nfhs5, now: india(r.num).total, ws: 0 })), { max: b.max });
    case "stack": return Chart.stackBars(
      b.rows.map((r) => ({ label: r.label, values: r.nums.map((n) => (r.period === "nfhs5" ? india(n).nfhs5 : india(n).total)) })),
      { segLabels: b.segLabels, colors: b.colors, max: b.max });
    case "map": return Chart.tileMap(stateMap(b.num), { unit: unitFor(b.num), rows: TILE_ROWS, cols: TILE_COLS, worseSide: polarityOf(b.num) });
    case "ranked": case "dotstrip": return Chart.rankedBars(stateMap(b.num), { unit: unitFor(b.num), worseSide: polarityOf(b.num) });
    default: return "";
  }
}

// Mobile-native variant for the chart kinds that are unreadable when the wide desktop
// canvas is shrunk to a phone. Returns "" for kinds without a mobile layout (those keep
// the desktop SVG with a horizontal-scroll fallback). See barChangeM / moversM.
function renderChartMobile(b) {
  switch (b.kind) {
    case "change": return Chart.barChangeM(trend(b.nums), { max: b.max });
    case "crossover": return Chart.barChangeM(trend(b.nums), { max: b.max, signColor: true });
    case "movers": return Chart.moversM(movers(b.nums));
    case "stack": return Chart.stackBarsM(
      b.rows.map((r) => ({ label: r.label, values: r.nums.map((n) => (r.period === "nfhs5" ? india(n).nfhs5 : india(n).total)) })),
      { segLabels: b.segLabels, colors: b.colors, max: b.max });
    case "split": return Chart.splitGroupM(split(b.nums), { max: b.max });
    // rows / dumbbell / smallmult all carry the same then→now data shape as `change`, so the
    // mobile then/now bar list reads them all cleanly.
    case "rows": return Chart.barChangeM(b.rows.map((r) => ({ label: r.label, then: india(r.num).nfhs5, now: india(r.num).total })), { max: b.max });
    case "dumbbell": return Chart.barChangeM(trend(b.nums), { max: b.max });
    case "smallmult": return Chart.barChangeM(trend(b.nums), { max: b.max });
    case "diverging": return Chart.divergingM(
      b.groups.map((g) => ({ label: g.label, left: total(g.l), right: total(g.r) })),
      { leftLabel: b.leftLabel, rightLabel: b.rightLabel, leftColor: b.left, rightColor: b.right || "#D9542B", max: b.max });
    // Maps and the state league tables all share State/UT data — on a phone they become a
    // compact, readable ranked list instead of a tiny tile-grid or a shrunk wide table.
    case "map": case "ranked": case "dotstrip": case "diststrip":
      return Chart.rankedBarsM(stateMap(b.num), { unit: unitFor(b.num), worseSide: polarityOf(b.num) });
    default: return "";
  }
}

export function renderChart(b) {
  // A definition tooltip only makes sense when the whole chart is one indicator.
  const single = b.num ?? (b.nums && b.nums.length === 1 ? b.nums[0] : null);
  const def = b.def ?? defFor(single);
  let desktop = renderChartInner(b);
  const mobile = renderChartMobile(b);
  // When a mobile variant exists, tag the desktop svg so CSS shows one or the other
  // (.nf-d on wide screens, .nf-m on phones). Kinds without a mobile variant stay untagged
  // and always render (with the existing horizontal-scroll fallback on mobile).
  if (mobile && desktop) desktop = desktop.replace('class="nf-svg ', 'class="nf-svg nf-d ');
  const html = desktop + mobile;
  // inject the indicator definition as an SVG <title> (hover tooltip) into the first svg
  return def && html ? html.replace(/(<svg\b[^>]*?>)/, (m) => m + Chart.defTitle(def)) : html;
}

// --- locked facts for one chart (DeepSeek prose input) -----------------------
export function blockFacts(b) {
  const u = (num) => unitFor(num);
  const f = { id: b.id, heading: b.h, kind: b.kind, survey: SURVEY, prev: PREV, numbers: [] };
  const push = (text) => f.numbers.push(text);
  if (b.kind === "change" || b.kind === "crossover" || b.kind === "slope" || b.kind === "dumbbell" || b.kind === "smallmult") {
    for (const num of b.nums) { const c = india(num); push(`${label(num)}: ${PREV} ${c.nfhs5}${u(num)} -> ${SURVEY} ${c.total}${u(num)}`); }
  } else if (b.kind === "movers") {
    for (const m of movers(b.nums)) push(`${m.label}: ${m.delta > 0 ? "+" : ""}${m.delta} points (${m.improved ? "improvement" : "worsening"})`);
  } else if (b.kind === "split") {
    for (const num of b.nums) { const c = india(num); push(`${label(num)}: urban ${c.urban}${u(num)}, rural ${c.rural}${u(num)}, India total ${c.total}${u(num)}`); }
  } else if (b.kind === "diverging") {
    for (const g of b.groups) push(`${g.label}: ${label(g.l)} ${total(g.l)}% vs ${label(g.r)} ${total(g.r)}%`);
  } else if (b.kind === "rows") {
    for (const r of b.rows) { const c = india(r.num); push(`${r.label}: ${PREV} ${c.nfhs5}% -> ${SURVEY} ${c.total}%`); }
  } else if (b.kind === "stack") {
    for (const r of b.rows) {
      const seg = r.nums.map((n, i) => `${b.segLabels[i]} ${r.period === "nfhs5" ? india(n).nfhs5 : india(n).total}%`).join(", ");
      push(`${r.label}: ${seg}`);
    }
  } else if (b.kind === "map" || b.kind === "ranked" || b.kind === "dotstrip" || b.kind === "diststrip") {
    const e = extremes(b.num);
    push(`${label(b.num)} by State/UT (${SURVEY}). India ${e.india}${u(b.num)}. Highest: ${e.highest.area} ${e.highest.value}${u(b.num)}. Lowest: ${e.lowest.area} ${e.lowest.value}${u(b.num)}.`);
    const c = india(b.num);
    if (c.nfhs5 != null) push(`India trend: ${PREV} ${c.nfhs5}${u(b.num)} -> ${SURVEY} ${c.total}${u(b.num)}.`);
  }
  return f;
}
export const allBlocks = () => TABS.flatMap((t) => t.blocks.map((b) => ({ tab: t.id, tabTitle: t.title, dek: t.dek, ...b })));
