import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type DomainId = "people" | "economy" | "energy" | "climate" | "health" | "society";

export type Observation = {
  date: string;
  value: number | null;
};

export type SeriesArtifact = {
  schemaVersion: 1;
  indicatorId: string;
  title: string;
  sourceId: string;
  sourceIndicatorId: string;
  sourceUrl: string;
  unit: string;
  frequency: "annual" | "quarterly" | "monthly" | "daily";
  geography: {
    type: string;
    id: string;
    name: string;
  };
  fetchedAt: string;
  observations: Observation[];
};

export type ChartRecord = {
  id: string;
  slug: string;
  domain: DomainId;
  topic: string;
  title: string;
  dek: string;
  shortTitle: string;
  seriesPath: string;
  valueFormat: "usd_trillion" | "usd" | "people_billion" | "years" | "percent" | "raw";
  axisFormat: "usd_trillion" | "usd" | "people_billion" | "years" | "percent" | "raw";
  bottomLine: string;
  explanations: {
    reading: string;
    plain: string;
    ground: string;
  };
  methodology: {
    sourceIds: string[];
    transformations: string[];
    caveats: string[];
  };
  aliases: string[];
};

export const locales = ["en"] as const;

export const domains: Array<{ id: DomainId; label: string; line: string }> = [
  { id: "economy", label: "Economy", line: "How India earns, spends, grows, borrows, and saves." },
  { id: "people", label: "People", line: "Population, fertility, migration, age, and urban life." },
  { id: "health", label: "Health", line: "Lifespan, disease, nutrition, care, and public health." },
  { id: "energy", label: "Energy", line: "Power, fuels, renewables, access, and demand." },
  { id: "society", label: "Society", line: "Education, households, cities, work, and everyday capability." },
  { id: "climate", label: "Climate", line: "Heat, rain, air, pollution, emissions, and exposure." }
];

export const sources = {
  worldbank: {
    name: "World Bank Indicators API",
    owner: "World Bank",
    homepage: "https://data.worldbank.org/",
    api: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392"
  }
};

export const charts: ChartRecord[] = [
  {
    id: "econ.gdp.current_usd",
    slug: "how-big-is-indias-economy",
    domain: "economy",
    topic: "National accounts",
    title: "How big is India's economy?",
    shortTitle: "India's economy",
    dek: "India's gross domestic product in current US dollars, shown annually from 1960 onward.",
    seriesPath: "data/series/worldbank.IN.NY_GDP_MKTP_CD.json",
    valueFormat: "usd_trillion",
    axisFormat: "usd_trillion",
    bottomLine: "India is now a nearly $4 trillion economy, but total size and household prosperity are still very different things.",
    explanations: {
      reading: "India's nominal GDP has risen from a small post-independence base to one of the world's largest aggregate economies. This series is in current US dollars, so it combines real output growth, domestic inflation, and exchange-rate movement.",
      plain: "This is the size of everything India produces in a year, converted into US dollars. The line shows a very large rise, but it is not the same as saying every family became equally richer.",
      ground: "The headline is true: India is a giant economy. But divide that giant number across more than 1.4 billion people and the lived reality becomes more mixed: big malls, stretched salaries, rising services, and households still watching school fees, rent, and fuel."
    },
    methodology: {
      sourceIds: ["worldbank"],
      transformations: ["Display converts US dollars to trillions; stored values remain raw current US dollars."],
      caveats: ["Current-dollar GDP is affected by prices and exchange rates. Use real GDP for inflation-adjusted growth."]
    },
    aliases: ["gdp", "economy size", "how big is the indian economy", "india gdp"]
  },
  {
    id: "econ.gdp.growth_real",
    slug: "how-fast-is-indias-economy-growing",
    domain: "economy",
    topic: "Growth",
    title: "How fast is India's economy growing?",
    shortTitle: "GDP growth",
    dek: "Annual real GDP growth, the inflation-adjusted speed of India's economy.",
    seriesPath: "data/series/worldbank.IN.NY_GDP_MKTP_KD_ZG.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "India's growth rate is high by global standards, but year-to-year growth is volatile and does not automatically translate into broad household gains.",
    explanations: {
      reading: "This chart uses annual percentage growth of GDP at constant prices. It is a better measure of volume growth than current-dollar GDP, but it is still an economy-wide average.",
      plain: "This is the speedometer, not the size of the economy. A high number means India produced more than the previous year after adjusting for inflation.",
      ground: "A 6-7% growth year can still feel uneven. Some sectors hire, some automate, some prices rise, and many households only feel growth when stable income reaches them."
    },
    methodology: {
      sourceIds: ["worldbank"],
      transformations: ["Values displayed as annual percent growth."],
      caveats: ["GDP growth is an aggregate and does not show distribution across people, states, or sectors."]
    },
    aliases: ["growth", "real gdp growth", "economic growth", "fastest major economy"]
  },
  {
    id: "econ.gdp.per_capita_current_usd",
    slug: "how-rich-is-the-average-indian",
    domain: "economy",
    topic: "Income per person",
    title: "How rich is the average Indian by GDP per person?",
    shortTitle: "GDP per person",
    dek: "GDP per capita in current US dollars, a rough average of output per person.",
    seriesPath: "data/series/worldbank.IN.NY_GDP_PCAP_CD.json",
    valueFormat: "usd",
    axisFormat: "usd",
    bottomLine: "India's total economy is enormous, but GDP per person is still modest because the output is shared across a very large population.",
    explanations: {
      reading: "GDP per capita divides aggregate GDP by population. It is not household income, but it is a useful first-pass measure for comparing average economic output per person.",
      plain: "This asks: if India's yearly output were divided equally, how much would one person's share be? Real life is not equal, so this is an average, not a salary.",
      ground: "This is why the top-5 economy headline and the monthly-budget squeeze can both be real. The country is big; the average slice is still small."
    },
    methodology: {
      sourceIds: ["worldbank"],
      transformations: ["Values rounded only for display."],
      caveats: ["GDP per capita is not median income and does not show inequality."]
    },
    aliases: ["per capita", "income per person", "average indian income", "gdp per person"]
  },
  {
    id: "people.population.total",
    slug: "how-many-people-live-in-india",
    domain: "people",
    topic: "Population",
    title: "How many people live in India?",
    shortTitle: "Population",
    dek: "India's total population, shown annually from 1960 onward.",
    seriesPath: "data/series/worldbank.IN.SP_POP_TOTL.json",
    valueFormat: "people_billion",
    axisFormat: "people_billion",
    bottomLine: "India is home to about one in every six people on Earth, which makes every national average unusually consequential.",
    explanations: {
      reading: "This series tracks total resident population. Population size affects every denominator in Indian statistics, from GDP per capita to hospital beds, classrooms, jobs, and electricity demand.",
      plain: "India's population is not just a large number. It changes how every other number should be read.",
      ground: "In India, scale is the story. A small percentage can mean millions of people; a national average can hide entire state-sized realities."
    },
    methodology: {
      sourceIds: ["worldbank"],
      transformations: ["Display converts people to billions; stored values remain raw people counts."],
      caveats: ["Population estimates are revised and are not a substitute for detailed Census tables."]
    },
    aliases: ["population", "people", "how many indians", "india population"]
  },
  {
    id: "health.life_expectancy",
    slug: "how-long-do-indians-live",
    domain: "health",
    topic: "Life expectancy",
    title: "How long do Indians live?",
    shortTitle: "Life expectancy",
    dek: "Life expectancy at birth, a summary measure of mortality conditions in a given year.",
    seriesPath: "data/series/worldbank.IN.SP_DYN_LE00_IN.json",
    valueFormat: "years",
    axisFormat: "years",
    bottomLine: "India has added decades to average lifespan, but life expectancy still compresses large differences by state, gender, income, and health access.",
    explanations: {
      reading: "Life expectancy at birth summarizes the mortality rates observed in a given period. It is sensitive to infant mortality, epidemics, public health, nutrition, and access to care.",
      plain: "This is the average number of years a newborn would live if today's death rates stayed the same through life.",
      ground: "The rise is one of modern India's biggest quiet wins. But the number does not tell you whether a person can afford treatment, reach a good hospital, or live in a clean environment."
    },
    methodology: {
      sourceIds: ["worldbank"],
      transformations: ["Values rounded to one decimal year in display."],
      caveats: ["National life expectancy hides regional and social differences."]
    },
    aliases: ["life expectancy", "lifespan", "health", "how long do indians live"]
  },
  {
    id: "energy.electricity_access",
    slug: "how-many-indians-have-electricity",
    domain: "energy",
    topic: "Access",
    title: "How many Indians have access to electricity?",
    shortTitle: "Electricity access",
    dek: "Share of India's population with access to electricity.",
    seriesPath: "data/series/worldbank.IN.EG_ELC_ACCS_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Electricity access is now near-universal, shifting the harder question from connection to reliability, affordability, and demand.",
    explanations: {
      reading: "This indicator reports the share of population with electricity access. It is an access measure, not a full measure of supply quality, outages, affordability, or per-capita consumption.",
      plain: "This tells us whether households are connected to electricity. It does not tell us how many hours power is available or how costly it feels.",
      ground: "The big connection push changed daily life. But the next question is the fan, pump, fridge, factory, and AC actually running when people need them."
    },
    methodology: {
      sourceIds: ["worldbank"],
      transformations: ["Values displayed as percent of population."],
      caveats: ["Access does not measure reliability, voltage quality, or affordability."]
    },
    aliases: ["electricity", "power access", "rural electrification", "energy access"]
  },
  {
    id: "society.urban_population_share",
    slug: "how-urban-is-india",
    domain: "society",
    topic: "Urbanization",
    title: "How urban is India?",
    shortTitle: "Urban population",
    dek: "Share of India's population living in urban areas.",
    seriesPath: "data/series/worldbank.IN.SP_URB_TOTL_IN_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "India is still less urban than many large economies, but even a one-point shift means millions of people moving into urban systems.",
    explanations: {
      reading: "This is the urban share of total population. It depends on official urban definitions, so comparisons should account for classification differences.",
      plain: "This chart shows what share of people live in places counted as urban.",
      ground: "India's urban change often looks slow as a percentage. On the ground, it can mean new towns, crowded edges of cities, longer commutes, and farmland turning into plots."
    },
    methodology: {
      sourceIds: ["worldbank"],
      transformations: ["Values displayed as percent of population."],
      caveats: ["Urban definitions vary and may understate settlement change around cities."]
    },
    aliases: ["urban", "cities", "urbanisation", "urbanization"]
  }
];

export function domainFor(id: DomainId) {
  return domains.find((domain) => domain.id === id);
}

export function chartUrl(chart: ChartRecord, locale = "en") {
  return `/${locale}/${chart.domain}/${chart.slug}/`;
}

export function loadSeries(seriesPath: string): SeriesArtifact {
  return JSON.parse(readFileSync(resolve(process.cwd(), seriesPath), "utf8"));
}

export function cleanObservations(series: SeriesArtifact) {
  return series.observations.filter((item) => item.value !== null) as Array<{ date: string; value: number }>;
}

export function latestObservation(series: SeriesArtifact) {
  return cleanObservations(series).at(-1);
}

export function firstObservation(series: SeriesArtifact) {
  return cleanObservations(series)[0];
}

export function formatValue(value: number, format: ChartRecord["valueFormat"]) {
  if (format === "usd_trillion") return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (format === "usd") return `$${Math.round(value).toLocaleString("en-IN")}`;
  if (format === "people_billion") return `${(value / 1_000_000_000).toFixed(2)} bn`;
  if (format === "years") return `${value.toFixed(1)} years`;
  if (format === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-IN");
}

export function axisLabel(value: number, format: ChartRecord["axisFormat"]) {
  if (format === "usd_trillion") return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (format === "usd") return `$${Math.round(value).toLocaleString("en-IN")}`;
  if (format === "people_billion") return `${(value / 1_000_000_000).toFixed(1)}bn`;
  if (format === "years") return `${Math.round(value)}`;
  if (format === "percent") return `${Math.round(value)}%`;
  return value.toLocaleString("en-IN");
}
