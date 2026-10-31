// Gallery samples for dumbbell, arrows and slope, built from the published stories' data.

import type { Sample } from "./types";
import F from "../fixtures/stories.json";
import { POVERTY_LINES } from "./inks";

const child = F["pov26.child_poverty_2023"].rows as { state: string; allAges: number; ages0to5: number }[];
const ppp = F["pov26.ppp_revision_paradox"].rows as { benchmark: string; ppp2017: number; ppp2021: number }[];
const at = (key: "pov26.linedup_300" | "pov26.linedup_420" | "pov26.linedup_830", years: string[]) => {
  const o = Object.fromEntries(F[key].observations!.map((p) => [p.date, p.value]));
  return years.map((y) => o[y]);
};

const LINES = [
  { key: "Extreme", label: "Extreme poverty", note: "$2.15 → $3.00 a day" },
  { key: "LMIC", label: "Lower-middle-income line", note: "$3.65 → $4.20 a day" },
  { key: "UMIC", label: "Upper-middle-income line", note: "$6.85 → $8.30 a day" },
];
const year = (benchmark: string) => benchmark.slice(0, 7).replace("-", "–");
const pppGroups = LINES.map((l) => ({
  label: l.label,
  note: l.note,
  rows: ppp.filter((r) => r.benchmark.includes(` ${l.key} `)).map((r) => ({ label: year(r.benchmark), a: r.ppp2017, b: r.ppp2021 })),
}));

const childItems = child.map((d) => ({ label: d.state, a: d.allAges, b: d.ages0to5 }));
const YEARS = ["1990", "2011", "2024"];

export const samples: Sample[] = [
  {
    id: "child-dumbbell",
    title: "In every state, young children are more likely to live below $8.30 a day",
    dek: "Share of people in households consuming under $8.30 a day at 2021 prices, %. Selected states, 2023.",
    source: "World Bank, Subnational Poverty and Inequality Database",
    spec: { form: "dumbbell", unit: "%", decimals: 1, ends: ["All ages", "Ages 0–5"], worse: "higher", items: childItems },
  },
  {
    id: "child-dumbbell-gap",
    title: "Young children fall furthest behind in the better-off states",
    dek: "The same estimates, sorted by how far children aged 0–5 sit above everyone else, %.",
    source: "World Bank, Subnational Poverty and Inequality Database",
    spec: { form: "dumbbell", unit: "%", decimals: 1, ends: ["All ages", "Ages 0–5"], worse: "higher", sort: "gap", items: childItems },
  },
  {
    id: "ppp-arrows",
    title: "New prices raised extreme poverty and lowered the next line up",
    dek: "Share of Indians below each line, %, for the same surveys measured at 2017 and at 2021 prices.",
    source: "World Bank Poverty and Inequality Platform, September 2026",
    spec: { form: "arrows", unit: "%", decimals: 1, from: "2017 prices", to: "2021 prices", worse: "higher", groups: pppGroups },
  },
  {
    id: "poverty-slope",
    title: "Extreme poverty collapsed; the share below $8.30 fell far less",
    dek: "Share of Indians below each poverty line, % (2021 prices).",
    source: "World Bank, Poverty, Prosperity and Planet Report 2026",
    spec: {
      form: "slope",
      unit: "%",
      decimals: 0,
      colorBy: "series",
      columns: YEARS,
      panels: [{ series: [
        { label: "Below $8.30", values: at("pov26.linedup_830", YEARS), color: POVERTY_LINES["$8.30"] },
        { label: "Below $4.20", values: at("pov26.linedup_420", YEARS), color: POVERTY_LINES["$4.20"] },
        { label: "Below $3", values: at("pov26.linedup_300", YEARS), color: POVERTY_LINES["$3.00"] },
      ] }],
    },
  },
  {
    id: "ppp-slope",
    title: "One price update, two directions",
    dek: "Share of Indians below each line, %, measured at 2017 and at 2021 prices. Each panel has its own scale.",
    source: "World Bank Poverty and Inequality Platform, September 2026",
    spec: {
      form: "slope",
      unit: "%",
      decimals: 1,
      worse: "higher",
      columns: ["2017 prices", "2021 prices"],
      // The flat upper-middle line gets a sentence, not a panel of empty ground.
      panels: pppGroups.slice(0, 2).map((g) => ({ label: g.label, note: g.note, series: g.rows.map((r) => ({ label: r.label, values: [r.a, r.b] })) })),
      footnote: `At the upper-middle-income line ($6.85 → $8.30 a day), 2023–24 barely moved: ${pppGroups[2].rows[0].a.toFixed(1)}% to ${pppGroups[2].rows[0].b.toFixed(1)}%.`,
    },
  },
];
