// Gallery samples for waterfall, tug, columns and curve, from the published stories' data.

import type { Sample } from "./types";
import F from "../fixtures/stories.json";
import { POVERTY_LINES } from "./inks";

const change = F["lrs26.matched_purpose_change"].rows as { label: string; value: number }[];
const deciles = F["pov26.decile_real_growth_2022_2023"].rows as { label: string; decile: number; value: number }[];
const ladder = F["pov26.bunching_percentile_ladder"].rows as { quantile: number; y1990: number; y2011: number; y2024: number; y2026: number }[];

// Bridge order: the gain first, then losses largest to smallest, the residual last.
const order = ["Capital transfers", "Travel and studies", "Maintenance of relatives", "Medical treatment", "Gifts and donations", "Others"];
const steps = order.map((l) => change.find((d) => d.label === l)!).map((d) => ({ label: d.label, value: d.value }));

export const samples: Sample[] = [
  {
    id: "lrs-waterfall",
    title: "Foreign investing did all the growing",
    dek: "Change in remittances by purpose, April–August 2026 against a year earlier, $ million. Each step starts where the last ended.",
    source: "RBI, Database on Indian Economy",
    spec: { form: "waterfall", unit: "$m", decimals: 0, steps },
  },
  {
    id: "lrs-tug",
    title: "Investing pulled one way, everything else the other",
    dek: "Change in remittances by purpose, April–August 2026 against a year earlier, $ million.",
    source: "RBI, Database on Indian Economy",
    spec: { form: "tug", unit: "$m", decimals: 0, items: steps, lossLabel: "Everything else" },
  },
  {
    id: "decile-columns",
    title: "The poorest tenth gained most, the richest tenth fell",
    dek: "Change in average real consumption by tenth of the population, 2022–23 to 2023–24 household surveys, %.",
    source: "World Bank Poverty and Inequality Platform",
    spec: {
      form: "columns",
      unit: "%",
      decimals: 1,
      items: deciles.map((d) => ({ label: String(d.decile), value: d.value })),
      reference: { value: 4.7, label: "Average" },
      ends: ["Poorest tenth", "Richest tenth"],
    },
  },
  {
    id: "decile-curve",
    title: "Growth fell steadily from the bottom of the distribution to the top",
    dek: "Change in average real consumption by tenth of the population, 2022–23 to 2023–24 household surveys, %.",
    source: "World Bank Poverty and Inequality Platform",
    spec: {
      form: "curve",
      unit: "%",
      decimals: 1,
      groups: deciles.map((d) => ({ label: String(d.decile) })),
      series: [{ label: "Growth", values: deciles.map((d) => d.value) }],
      references: [{ value: 4.7, label: "Average 4.7%" }],
      ends: ["Poorest tenth", "Richest tenth"],
    },
  },
  {
    id: "consumption-ladder",
    title: "The whole ladder rose, but most rungs still sit below $8.30",
    dek: "Daily consumption per person at each point of India's distribution, in 2021 dollars a day (PPP), against the three poverty lines. The 2026 line is a nowcast.",
    source: "World Bank, Poverty, Prosperity and Planet Report 2026",
    spec: {
      form: "curve",
      unit: "$",
      decimals: 2,
      groups: ladder.map((r) => ({ label: `${r.quantile / 10}th`, x: r.quantile / 10 })),
      series: [
        { label: "1990", values: ladder.map((r) => r.y1990) },
        { label: "2011", values: ladder.map((r) => r.y2011) },
        { label: "2026", values: ladder.map((r) => r.y2026), role: "compare", dotted: true },
        { label: "2024", values: ladder.map((r) => r.y2024), role: "lead" },
      ],
      references: [
        { value: 3, label: "$3.00", color: POVERTY_LINES["$3.00"] },
        { value: 4.2, label: "$4.20", color: POVERTY_LINES["$4.20"] },
        { value: 8.3, label: "$8.30", color: POVERTY_LINES["$8.30"] },
      ],
      ends: ["Poorest", "Richest"],
    },
  },
];
