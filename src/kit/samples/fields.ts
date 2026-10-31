// Gallery samples for tiles, hundred and season, built from the published stories' data.

import type { Sample } from "./types";
import F from "../fixtures/stories.json";

const pg = F["pov26.state_prosperity_gap_2023"].rows as { state: string; prosperityGap: number }[];
const at2024 = (k: "pov26.linedup_300" | "pov26.linedup_420" | "pov26.linedup_830") => F[k].observations!.find((o) => o.date === "2024")!.value;
const p300 = at2024("pov26.linedup_300"), p420 = at2024("pov26.linedup_420"), p830 = at2024("pov26.linedup_830");
const peers = F["pov26.peer_thresholds_2024"].rows as { country: string; p300: number; p420: number; p830: number; estimateBasis: { p830: string } }[];
const seasonRows = F["lrs26.seasonal_allocation_share"].rows as Record<string, number | string>[];

const bands = [
  { label: "below $3 a day" },
  { label: "between $3 and $4.20" },
  { label: "between $4.20 and $8.30" },
  { label: "above $8.30" },
];
const partsOf = (a: number, b: number, c: number) => [a, b - a, c - b, 100 - c];

const SHORT: Record<string, string> = {
  "Andaman and Nicobar Islands": "Andaman & Nicobar",
  "Dadra and Nagar Haveli and Daman and Diu": "Dadra & Daman",
  "Jammu and Kashmir": "Jammu & Kashmir",
};

export const samples: Sample[] = [
  {
    id: "prosperity-tiles",
    title: "The prosperity gap is widest in the east and centre",
    dek: "How many times, on average, residents' consumption would have to multiply to reach $28 a day, by state, 2023. Higher is poorer.",
    source: "World Bank, Global Subnational Atlas of Poverty 2026",
    spec: {
      form: "tiles",
      decimals: 1,
      items: pg.map((d) => ({ label: SHORT[d.state] ?? d.state, value: d.prosperityGap })),
      reference: { label: "India", value: 4.95 },
      bins: [3.5, 4.2, 4.9, 5.6],
    },
  },
  {
    id: "india-hundred",
    title: "If India were 100 people, 79 would live on less than $8.30 a day",
    dek: "Indians by daily consumption in 2024, 2021 prices, rounded to whole people. Calendar-year estimates.",
    source: "World Bank, Poverty, Prosperity and Planet Report 2026",
    spec: {
      form: "hundred",
      segments: bands,
      rows: [{ label: "India", parts: partsOf(p300, p420, p830) }],
      cumulative: { upTo: 2, label: "of 100 live below $8.30 a day" },
    },
  },
  {
    id: "peers-hundred",
    title: "India has less extreme poverty than its neighbours, and more people below $8.30",
    dek: "Five Asian countries as 100 people each, by daily consumption in 2024, 2021 prices. Indonesia is a survey reading; the others are projections.",
    source: "World Bank, Poverty, Prosperity and Planet Report 2026",
    spec: {
      form: "hundred",
      segments: bands,
      rows: [...peers]
        .sort((a, c) => (a.country === "India" ? -1 : c.country === "India" ? 1 : c.p830 - a.p830))
        .map((p) => ({ label: p.country, parts: partsOf(p.p300, p.p420, p.p830), highlight: p.country === "India", note: p.estimateBasis.p830 === "projection" ? "projected" : undefined })),
      cumulative: { upTo: 2, label: "Below $8.30" },
    },
  },
  {
    id: "lrs-season",
    title: "March is when Indians move money into foreign investments",
    dek: "Share of each channel's yearly remittances sent in each month, %, averaged over 2022–23 to 2025–26. An even spread would be 8.3% a month.",
    source: "RBI, Database on Indian Economy",
    spec: {
      form: "season",
      unit: "%",
      decimals: 1,
      columns: seasonRows.map((r) => String(r.month)),
      rows: [
        { label: "Investment, deposits, property", values: seasonRows.map((r) => Number(r.capital)) },
        { label: "Studies abroad", values: seasonRows.map((r) => Number(r.studies)) },
        { label: "Travel", values: seasonRows.map((r) => Number(r.travel)) },
        { label: "Family and gifts", values: seasonRows.map((r) => Number(r.family)) },
      ],
    },
  },
];
