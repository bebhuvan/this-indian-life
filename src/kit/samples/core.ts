// Gallery samples for line, bars and spectrum, built from the published stories' data.

import type { Sample } from "./types";
import F from "../fixtures/stories.json";
import { LRS_PURPOSES, POVERTY_LINES } from "./inks";

const lrs = F["lrs26.monthly_total"].observations!;
const cap = F["lrs26.monthly_capital_triad"].observations!;
const travel = F["lrs26.monthly_travel_studies"].observations!;
const family = F["lrs26.monthly_family_gifts"].observations!;
const pg = F["pov26.state_prosperity_gap_2023"].rows as { state: string; prosperityGap: number }[];
const change = F["lrs26.matched_purpose_change"].rows as { label: string; value: number }[];

/** Names as a reader writes them in a crowded chart. */
export const SHORT: Record<string, string> = {
  "Dadra and Nagar Haveli and Daman and Diu": "Dadra & Daman",
  "Andaman and Nicobar Islands": "Andaman & Nicobar",
  "Jammu and Kashmir": "Jammu & Kashmir",
};

export const samples: Sample[] = [
  {
    id: "lrs-monthly",
    title: "Money sent abroad took off once the limit rose in 2015",
    dek: "Monthly outward remittances by resident individuals under the Liberalised Remittance Scheme, $ million.",
    source: "RBI, Database on Indian Economy",
    spec: {
      form: "line",
      unit: "$m",
      series: [
        { label: "All purposes", points: lrs, role: "lead", color: LRS_PURPOSES.total },
        { label: "Investment, deposits, property", points: cap, role: "compare", color: LRS_PURPOSES.capital },
        { label: "Travel and studies", points: travel, role: "context" },
        { label: "Family and gifts", points: family, role: "context" },
      ],
      annotations: [
        { date: "2015-06", label: "Limit raised to $250,000" },
        { date: "2020-10", label: "TCS begins" },
        { date: "2023-10", label: "TCS at 20%" },
      ],
    },
  },
  {
    id: "poverty-three-lines",
    title: "Extreme poverty all but gone; most Indians still below $8.30 a day",
    dek: "Share of Indians below each poverty line, % (2021 prices). Estimates after 2024 are projections.",
    source: "World Bank, Poverty, Prosperity and Planet Report 2026",
    spec: {
      form: "line",
      unit: "%",
      domain: "share",
      series: [
        { label: "Below $8.30", points: F["pov26.linedup_830"].observations!, role: "lead", color: POVERTY_LINES["$8.30"], projectedAfter: "2024" },
        { label: "Below $4.20", points: F["pov26.linedup_420"].observations!, role: "compare", color: POVERTY_LINES["$4.20"], projectedAfter: "2024" },
        { label: "Below $3.00", points: F["pov26.linedup_300"].observations!, role: "compare", color: POVERTY_LINES["$3.00"], projectedAfter: "2024" },
      ],
      callout: { series: 0, date: "2024", note: "still below $8.30 in 2024" },
    },
  },
  {
    id: "lrs-change",
    title: "Foreign investing did all the growing",
    dek: "Change in remittances by purpose, April–August 2026 against a year earlier, $ million.",
    source: "RBI, Database on Indian Economy",
    spec: {
      form: "bars",
      unit: "$m",
      decimals: 0,
      items: change.map((d) => ({ label: d.label, value: d.value, highlight: d.value > 500 })),
    },
  },
  {
    id: "prosperity-spectrum",
    title: "The prosperity gap is three times wider in Jharkhand than in Chandigarh",
    dek: "How many times, on average, residents' consumption would have to multiply to reach $28 a day. Higher is poorer.",
    source: "World Bank, Global Subnational Atlas of Poverty 2026",
    spec: {
      form: "spectrum",
      decimals: 1,
      items: pg.map((d) => ({ label: SHORT[d.state] ?? d.state, value: d.prosperityGap, highlight: d.state === "Jharkhand" || d.state === "Chandigarh" })),
      reference: { value: 4.95, label: "India" },
      ends: ["better off", "poorer"],
    },
  },
];
