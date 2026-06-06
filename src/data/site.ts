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
  valueFormat: "usd_trillion" | "usd" | "people_billion" | "people_million" | "years" | "percent" | "tonnes_billion" | "raw";
  axisFormat: "usd_trillion" | "usd" | "people_billion" | "people_million" | "years" | "percent" | "tonnes_billion" | "raw";
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

// Public source repository. Used for the footer link and per-article "view the
// exact changes" links — GitHub renders the diffs, so the site ships none itself.
export const REPO_URL = "https://github.com/bebhuvan/this-indian-life";
export const REPO_BRANCH = "main";

/** GitHub commit history for one article's source JSON (the full edit trail + diffs). */
export function articleSourceUrl(questionId: string) {
  return `${REPO_URL}/commits/${REPO_BRANCH}/data/explanations/en/${questionId}.json`;
}

/** GitHub view of a single commit's diff. */
export function commitUrl(sha: string) {
  return `${REPO_URL}/commit/${sha}`;
}

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
  },
  indiadatahub: {
    name: "IndiaDataHub Economic Monitor",
    owner: "IndiaDataHub",
    homepage: "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor",
    api: "https://feeds.indiadatahub.com/openapi.json"
  },
  owid: {
    name: "Our World in Data Grapher",
    owner: "Our World in Data",
    homepage: "https://ourworldindata.org/",
    api: "https://docs.owid.io/projects/etl/api/chart-api/"
  },
  "who-gho": {
    name: "WHO Global Health Observatory",
    owner: "World Health Organization",
    homepage: "https://www.who.int/data/gho",
    api: "https://www.who.int/data/gho/info/gho-odata-api"
  },
  trai: {
    name: "Telecom Regulatory Authority of India",
    owner: "TRAI",
    homepage: "https://www.trai.gov.in/",
    api: "https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports"
  },
  ember: {
    name: "Ember Energy Data",
    owner: "Ember",
    homepage: "https://ember-climate.org/data-catalogue/",
    api: "https://ember-climate.org/data-catalogue/"
  },
  eia: {
    name: "EIA International Energy Data",
    owner: "U.S. Energy Information Administration",
    homepage: "https://www.eia.gov/international/",
    api: "https://www.eia.gov/opendata/"
  },
  ppac: {
    name: "Petroleum Planning & Analysis Cell",
    owner: "Government of India",
    homepage: "https://ppac.gov.in/",
    api: "https://ppac.gov.in/import-export"
  },
  tradestat: {
    name: "TradeStat / DGCI&S",
    owner: "Government of India, Department of Commerce",
    homepage: "https://tradestat.commerce.gov.in/",
    api: "https://tradestat.commerce.gov.in/eidb/commodity_wise_all_countries_import"
  },
  "un-comtrade": {
    name: "UN Comtrade",
    owner: "United Nations Statistics Division",
    homepage: "https://comtradeplus.un.org/",
    api: "https://comtradeapi.un.org/"
  },
  waqi: {
    name: "World Air Quality Index",
    owner: "WAQI",
    homepage: "https://waqi.info/",
    api: "https://aqicn.org/api/"
  },
  "open-meteo": {
    name: "Open-Meteo Historical Weather API",
    owner: "Open-Meteo",
    homepage: "https://open-meteo.com/",
    api: "https://open-meteo.com/en/docs/historical-weather-api"
  },
  "un-population": {
    name: "UN Population Data Portal",
    owner: "United Nations Population Division",
    homepage: "https://population.un.org/dataportal/home",
    api: "https://population.un.org/dataportalapi/index.html"
  }
};

// Friendly display names for the source IDs that appear in evidence packets. Many
// of these (state/health/climate sources) aren't in the `sources` map above, which
// only tracks ingestion endpoints. Unknown IDs fall back to a tidy title-case.
const SOURCE_LABELS: Record<string, string> = {
  worldbank: "World Bank",
  "world-context": "World Bank (context)",
  indiadatahub: "IndiaDataHub",
  mospi: "MoSPI",
  hces: "MoSPI HCES",
  owid: "Our World in Data",
  "who-gho": "WHO",
  "un-population": "UN Population",
  "un-comtrade": "UN Comtrade",
  ember: "Ember",
  eia: "EIA",
  ppac: "PPAC",
  tradestat: "DGCI&S",
  trai: "TRAI",
  waqi: "WAQI",
  "open-meteo": "Open-Meteo",
  era5: "ERA5 · Copernicus",
  cckp: "World Bank CCKP",
  ceew: "CEEW",
  niti: "NITI Aayog",
  imd: "IMD",
  "heat-mortality": "Heat-mortality studies",
  "heat-vulnerability": "CEEW + MoSPI + NITI + HCES + MCCD",
  "heat-work": "MoSPI + ILOSTAT",
  "lancet-countdown": "Lancet Countdown",
  "undp-hch": "UNDP",
  ilostat: "ILOSTAT",
  nfhs: "NFHS",
  gbd: "IHME · GBD",
  srs: "SRS",
  srscod: "SRS (cause of death)",
  mccd: "MCCD",
  rbi: "RBI"
};

export function sourceLabel(id: string): string {
  if (SOURCE_LABELS[id]) return SOURCE_LABELS[id];
  // Tidy fallback: split on separators, keep short tokens upper-cased.
  return id
    .split(/[-_.]/)
    .map((part) => (part.length <= 4 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

/** Homepage link for a source ID, when we track it in the `sources` registry. */
export function sourceHomepage(id: string): string | undefined {
  const key = id === "world-context" ? "worldbank" : id;
  return (sources as Record<string, { homepage?: string }>)[key]?.homepage;
}

const curatedCharts: ChartRecord[] = [
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
    bottomLine: "India is now a roughly $4 trillion economy, but total size and household prosperity are still very different things.",
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

type ChartSeed = Omit<ChartRecord, "explanations" | "methodology"> & {
  sourceIds: string[];
  transform: string;
  caveat: string;
};

function makeChart(seed: ChartSeed): ChartRecord {
  return {
    ...seed,
    explanations: {
      reading: seed.dek,
      plain: seed.bottomLine,
      ground: "Read this as one piece of evidence, not the whole story. The useful question is what changes over time, what stays stuck, and what the indicator leaves out."
    },
    methodology: {
      sourceIds: seed.sourceIds,
      transformations: [seed.transform],
      caveats: [seed.caveat]
    }
  };
}

const generatedChartSeeds: ChartSeed[] = [
  {
    id: "people.population.growth",
    slug: "is-indias-population-growth-slowing",
    domain: "people",
    topic: "Population growth",
    title: "Is India's population growth slowing?",
    shortTitle: "Population growth",
    dek: "Annual population growth rate for India.",
    seriesPath: "data/series/worldbank.IN.SP_POP_GROW.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "India is still adding people, but the annual growth rate has slowed sharply from earlier decades.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as annual percent growth.",
    caveat: "Growth rate is not the same as absolute population added.",
    aliases: ["population growth", "india population growth", "is population slowing"]
  },
  {
    id: "people.fertility",
    slug: "how-fast-is-indias-fertility-falling",
    domain: "people",
    topic: "Fertility",
    title: "How fast is India's fertility falling?",
    shortTitle: "Fertility",
    dek: "Births per woman, shown annually.",
    seriesPath: "data/series/worldbank.IN.SP_DYN_TFRT_IN.json",
    valueFormat: "raw",
    axisFormat: "raw",
    bottomLine: "Fertility is one of the main reasons India can be huge and still move toward slower population growth.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as births per woman.",
    caveat: "National fertility hides very large state and district differences.",
    aliases: ["fertility", "birth rate", "children per woman"]
  },
  {
    id: "people.age_0_14_share",
    slug: "what-share-of-indians-are-children",
    domain: "people",
    topic: "Age structure",
    title: "What share of Indians are children?",
    shortTitle: "Children",
    dek: "Share of India's population aged 0-14.",
    seriesPath: "data/series/worldbank.IN.SP_POP_0014_TO_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "A falling child share changes the pressure on schools, families, and future labour markets.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of total population.",
    caveat: "This does not show the absolute number of children.",
    aliases: ["children", "age 0-14", "young population"]
  },
  {
    id: "people.age_15_64_share",
    slug: "what-share-of-indians-are-working-age",
    domain: "people",
    topic: "Age structure",
    title: "What share of Indians are working age?",
    shortTitle: "Working age",
    dek: "Share of India's population aged 15-64.",
    seriesPath: "data/series/worldbank.IN.SP_POP_1564_TO_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "The working-age share is the demographic base behind the jobs, productivity, and growth question.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of total population.",
    caveat: "Working age does not mean actually employed.",
    aliases: ["working age", "demographic dividend", "15-64"]
  },
  {
    id: "people.age_65_plus_share",
    slug: "what-share-of-indians-are-elderly",
    domain: "people",
    topic: "Ageing",
    title: "What share of Indians are elderly?",
    shortTitle: "Elderly",
    dek: "Share of India's population aged 65 and above.",
    seriesPath: "data/series/worldbank.IN.SP_POP_65UP_TO_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "India is still young, but the elderly share is rising steadily.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of total population.",
    caveat: "A small percentage can still mean a very large number of people in India.",
    aliases: ["elderly", "old age", "65 plus", "ageing"]
  },
  {
    id: "people.age_dependency",
    slug: "how-heavy-is-indias-dependency-burden",
    domain: "people",
    topic: "Dependency",
    title: "How heavy is India's dependency burden?",
    shortTitle: "Dependency",
    dek: "Age dependency ratio as a share of the working-age population.",
    seriesPath: "data/series/worldbank.IN.SP_POP_DPND.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Dependency ratios help explain how many children and elderly people sit on top of the working-age base.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of working-age population.",
    caveat: "This is an age structure measure, not a household income measure.",
    aliases: ["dependency ratio", "dependents", "demographic burden"]
  },
  {
    id: "econ.inflation_cpi",
    slug: "how-fast-are-prices-rising-in-india",
    domain: "economy",
    topic: "Inflation",
    title: "How fast are prices rising in India?",
    shortTitle: "Inflation",
    dek: "Annual consumer price inflation.",
    seriesPath: "data/series/worldbank.IN.FP_CPI_TOTL_ZG.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Inflation is why nominal money can rise while household comfort does not rise by the same amount.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as annual percent.",
    caveat: "National CPI does not show every household's personal inflation basket.",
    aliases: ["inflation", "prices", "cpi", "mehngai"]
  },
  {
    id: "econ.trade_gdp",
    slug: "how-open-is-indias-economy",
    domain: "economy",
    topic: "Trade",
    title: "How open is India's economy?",
    shortTitle: "Trade",
    dek: "Trade in goods and services as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.NE_TRD_GNFS_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Trade share shows how much India's economy is tied to the world through imports and exports.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "Trade share does not show who benefits from trade or which sectors are exposed.",
    aliases: ["trade", "exports imports", "open economy"]
  },
  {
    id: "econ.gdp.sector_agriculture",
    slug: "how-much-of-indias-economy-comes-from-agriculture",
    domain: "economy",
    topic: "Economic structure",
    title: "How much of India's economy comes from agriculture?",
    shortTitle: "Agriculture GDP",
    dek: "Agriculture value added as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.NV_AGR_TOTL_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Agriculture employs many people, but its GDP share is much smaller than its employment share.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "GDP share does not show farm incomes or landholding size.",
    aliases: ["agriculture gdp", "farm economy", "agriculture share"]
  },
  {
    id: "econ.gdp.sector_industry",
    slug: "how-much-of-indias-economy-is-industry",
    domain: "economy",
    topic: "Economic structure",
    title: "How much of India's economy is industry?",
    shortTitle: "Industry GDP",
    dek: "Industry value added as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.NV_IND_TOTL_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Industry share helps explain the manufacturing and jobs debate behind India's growth story.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "Industry includes more than factory manufacturing.",
    aliases: ["industry gdp", "manufacturing", "industry share"]
  },
  {
    id: "econ.gdp.sector_services",
    slug: "how-much-of-indias-economy-is-services",
    domain: "economy",
    topic: "Economic structure",
    title: "How much of India's economy is services?",
    shortTitle: "Services GDP",
    dek: "Services value added as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.NV_SRV_TOTL_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Services dominate India's GDP, which is one reason growth can look different from factory-led development.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "Services range from high-productivity IT to low-paid informal work.",
    aliases: ["services", "service sector", "services gdp"]
  },
  {
    id: "work.labor_force_total",
    slug: "how-many-indians-are-in-the-labour-force",
    domain: "society",
    topic: "Work",
    title: "How many Indians are in the labour force?",
    shortTitle: "Labour force",
    dek: "Total labour force count.",
    seriesPath: "data/series/worldbank.IN.SL_TLF_TOTL_IN.json",
    valueFormat: "people_million",
    axisFormat: "people_million",
    bottomLine: "India's labour-force scale is enormous; the harder question is what kind of work people find.",
    sourceIds: ["worldbank"],
    transform: "Display converts people to millions; stored values remain raw people counts.",
    caveat: "Labour force is not the same as stable, formal, well-paid employment.",
    aliases: ["labour force", "labor force", "workers", "jobs"]
  },
  {
    id: "work.labor_force_participation_female",
    slug: "how-many-indian-women-are-in-the-labour-force",
    domain: "society",
    topic: "Women and work",
    title: "How many Indian women are in the labour force?",
    shortTitle: "Women's work",
    dek: "Female labour-force participation rate.",
    seriesPath: "data/series/worldbank.IN.SL_TLF_CACT_FE_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Women's work participation is one of the biggest gaps between India's economic potential and lived reality.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of women aged 15+.",
    caveat: "This indicator can miss unpaid, informal, and irregular work.",
    aliases: ["female labour force", "women work", "women jobs"]
  },
  {
    id: "work.employment_agriculture",
    slug: "what-share-of-indians-work-in-agriculture",
    domain: "society",
    topic: "Work",
    title: "What share of Indians work in agriculture?",
    shortTitle: "Farm work",
    dek: "Employment in agriculture as a share of total employment.",
    seriesPath: "data/series/worldbank.IN.SL_AGR_EMPL_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "A large agriculture workforce beside a small agriculture GDP share is the productivity problem in one chart.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of total employment.",
    caveat: "This does not show underemployment or seasonal work.",
    aliases: ["agriculture employment", "farm workers", "rural jobs"]
  },
  {
    id: "education.literacy_adult",
    slug: "how-literate-is-india",
    domain: "society",
    topic: "Education",
    title: "How literate is India?",
    shortTitle: "Literacy",
    dek: "Adult literacy rate.",
    seriesPath: "data/series/worldbank.IN.SE_ADT_LITR_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Literacy is a basic capability measure, but it is only the floor of education quality.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of people aged 15+.",
    caveat: "Literacy does not measure learning quality or years of schooling.",
    aliases: ["literacy", "education", "adult literacy"]
  },
  {
    id: "education.school_life_expectancy",
    slug: "how-many-years-of-schooling-do-indians-get",
    domain: "society",
    topic: "Education",
    title: "How many years of schooling do Indians get?",
    shortTitle: "School years",
    dek: "Expected years of schooling.",
    seriesPath: "data/series/worldbank.IN.SE_SCH_LIFE.json",
    valueFormat: "years",
    axisFormat: "years",
    bottomLine: "Years of schooling show access and persistence, but not whether children are learning enough.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as years.",
    caveat: "Expected schooling is not the same as learning outcomes.",
    aliases: ["schooling", "years of school", "education years"]
  },
  {
    id: "education.school_enrollment_secondary",
    slug: "how-many-indian-children-reach-secondary-school",
    domain: "society",
    topic: "Education",
    title: "How many Indian children reach secondary school?",
    shortTitle: "Secondary school",
    dek: "Gross secondary school enrolment.",
    seriesPath: "data/series/worldbank.IN.SE_SEC_ENRR.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Secondary enrolment is where schooling starts to connect directly with future work and capability.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as gross enrolment percent.",
    caveat: "Gross enrolment can exceed 100% because it includes over-age and under-age students.",
    aliases: ["secondary school", "school enrolment", "high school"]
  },
  {
    id: "society.internet_users",
    slug: "how-many-indians-use-the-internet",
    domain: "society",
    topic: "Digital access",
    title: "How many Indians use the internet?",
    shortTitle: "Internet users",
    dek: "Individuals using the internet as a share of population.",
    seriesPath: "data/series/worldbank.IN.IT_NET_USER_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Internet access has become a basic capability question, not just a technology statistic.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of population.",
    caveat: "This does not show speed, affordability, device quality, or digital skills.",
    aliases: ["internet", "digital india", "online users"]
  },
  {
    id: "society.water_basic",
    slug: "do-indians-have-basic-drinking-water",
    domain: "society",
    topic: "Basic services",
    title: "Do Indians have basic drinking water?",
    shortTitle: "Drinking water",
    dek: "Share of people using at least basic drinking-water services.",
    seriesPath: "data/series/worldbank.IN.SH_H2O_BASW_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Water access is high on paper, but access does not automatically mean quality, reliability, or convenience.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of population.",
    caveat: "Basic service definitions do not capture every quality and reliability problem.",
    aliases: ["water", "drinking water", "basic water"]
  },
  {
    id: "society.sanitation_basic",
    slug: "do-indians-have-basic-sanitation",
    domain: "society",
    topic: "Basic services",
    title: "Do Indians have basic sanitation?",
    shortTitle: "Sanitation",
    dek: "Share of people using at least basic sanitation services.",
    seriesPath: "data/series/worldbank.IN.SH_STA_BASS_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Sanitation access is a public-health number, not just an infrastructure number.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of population.",
    caveat: "This does not fully measure usage, maintenance, waste treatment, or local conditions.",
    aliases: ["sanitation", "toilets", "basic sanitation"]
  },
  {
    id: "energy.clean_cooking_access",
    slug: "do-indians-have-clean-cooking-fuel",
    domain: "energy",
    topic: "Household energy",
    title: "Do Indians have clean cooking fuel?",
    shortTitle: "Clean cooking",
    dek: "Access to clean fuels and technologies for cooking.",
    seriesPath: "data/series/worldbank.IN.EG_CFT_ACCS_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Clean cooking is about health, time, gender, affordability, and household energy at once.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of population.",
    caveat: "Access does not always mean exclusive or affordable use.",
    aliases: ["clean cooking", "lpg", "cooking fuel"]
  },
  {
    id: "energy.electric_power_consumption_pc",
    slug: "how-much-electricity-does-the-average-indian-use",
    domain: "energy",
    topic: "Electricity use",
    title: "How much electricity does the average Indian use?",
    shortTitle: "Power use",
    dek: "Electric power consumption per person.",
    seriesPath: "data/series/worldbank.IN.EG_USE_ELEC_KH_PC.json",
    valueFormat: "raw",
    axisFormat: "raw",
    bottomLine: "Electricity access can be near-universal while per-person use remains modest.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as kWh per capita.",
    caveat: "This series does not show reliability, outages, or household-level inequality.",
    aliases: ["electricity use", "power consumption", "kwh per person"]
  },
  {
    id: "energy.ember.demand",
    slug: "how-fast-is-indias-electricity-demand-growing",
    domain: "energy",
    topic: "Electricity demand",
    title: "How fast is India's electricity demand growing?",
    shortTitle: "Power demand",
    dek: "Annual electricity demand.",
    seriesPath: "data/series/ember.IN.electricity-demand.yearly.json",
    valueFormat: "raw",
    axisFormat: "raw",
    bottomLine: "Electricity demand is the physical side of development: homes, pumps, factories, railways, offices, and cooling.",
    sourceIds: ["ember"],
    transform: "Values displayed as TWh.",
    caveat: "Demand is national and does not show regional shortages or peak-hour stress.",
    aliases: ["electricity demand", "power demand", "twh"]
  },
  {
    id: "energy.ember.carbon_intensity",
    slug: "is-indias-electricity-getting-cleaner",
    domain: "energy",
    topic: "Power emissions",
    title: "Is India's electricity getting cleaner?",
    shortTitle: "Grid intensity",
    dek: "Electricity carbon intensity.",
    seriesPath: "data/series/ember.IN.carbon-intensity.yearly.json",
    valueFormat: "raw",
    axisFormat: "raw",
    bottomLine: "Grid carbon intensity shows whether each unit of electricity is becoming cleaner or dirtier.",
    sourceIds: ["ember"],
    transform: "Values displayed as gCO2/kWh.",
    caveat: "Intensity can improve even if total emissions rise with demand.",
    aliases: ["carbon intensity", "clean electricity", "grid emissions"]
  },
  {
    id: "health.under5_mortality",
    slug: "how-many-indian-children-die-before-age-five",
    domain: "health",
    topic: "Child survival",
    title: "How many Indian children die before age five?",
    shortTitle: "Under-five deaths",
    dek: "Under-five mortality rate per 1,000 live births.",
    seriesPath: "data/series/worldbank.IN.SH_DYN_MORT.json",
    valueFormat: "raw",
    axisFormat: "raw",
    bottomLine: "Child mortality is one of the clearest long-run development indicators.",
    sourceIds: ["worldbank"],
    transform: "Values displayed per 1,000 live births.",
    caveat: "National child mortality hides state, income, and rural-urban differences.",
    aliases: ["child mortality", "under five", "children deaths"]
  },
  {
    id: "health.current_health_expenditure_gdp",
    slug: "how-much-does-india-spend-on-health",
    domain: "health",
    topic: "Health spending",
    title: "How much does India spend on health?",
    shortTitle: "Health spend",
    dek: "Current health expenditure as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.SH_XPD_CHEX_GD_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Health spending as a share of GDP is a rough measure of how much national output goes into care.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "This does not separate public, private, and out-of-pocket spending.",
    aliases: ["health spending", "health expenditure", "health gdp"]
  },
  {
    id: "health.who.hale_birth",
    slug: "how-many-healthy-years-do-indians-live",
    domain: "health",
    topic: "Healthy life",
    title: "How many healthy years do Indians live?",
    shortTitle: "Healthy years",
    dek: "Healthy life expectancy at birth.",
    seriesPath: "data/series/who-gho.IN.WHOSIS_000002.json",
    valueFormat: "years",
    axisFormat: "years",
    bottomLine: "Living longer is not the same as living those years in good health.",
    sourceIds: ["who-gho"],
    transform: "Values displayed as years.",
    caveat: "Healthy life expectancy is modelled and should be read with its source assumptions.",
    aliases: ["hale", "healthy life expectancy", "healthy years"]
  },
  {
    id: "health.who.maternal_mortality",
    slug: "how-many-mothers-die-in-childbirth-in-india",
    domain: "health",
    topic: "Maternal health",
    title: "How many mothers die in childbirth in India?",
    shortTitle: "Maternal mortality",
    dek: "Maternal mortality ratio per 100,000 live births.",
    seriesPath: "data/series/who-gho.IN.MDG_0000000026.json",
    valueFormat: "raw",
    axisFormat: "raw",
    bottomLine: "Maternal mortality turns health-system quality into one brutal number.",
    sourceIds: ["who-gho"],
    transform: "Values displayed per 100,000 live births.",
    caveat: "Estimates can be revised and hide local differences in care access.",
    aliases: ["maternal mortality", "mothers", "childbirth deaths"]
  },
  {
    id: "state.tax_revenue_gdp",
    slug: "how-much-tax-does-india-collect",
    domain: "economy",
    topic: "State capacity",
    title: "How much tax does India collect?",
    shortTitle: "Tax revenue",
    dek: "Tax revenue as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.GC_TAX_TOTL_GD_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Tax collection is a state-capacity number: it shapes what government can actually pay for.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "This does not show tax composition, compliance, or state-level revenue.",
    aliases: ["tax", "tax revenue", "state capacity"]
  },
  {
    id: "state.expense_gdp",
    slug: "how-much-does-the-government-spend",
    domain: "economy",
    topic: "Public finance",
    title: "How much does the government spend?",
    shortTitle: "Government spend",
    dek: "Government expense as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.GC_XPN_TOTL_GD_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Government spending share gives a first sense of the public sector's footprint.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "Expense is not the same as total public investment or service quality.",
    aliases: ["government spending", "public spending", "expense"]
  },
  {
    id: "state.debt_central_gdp",
    slug: "how-much-debt-does-the-central-government-have",
    domain: "economy",
    topic: "Public finance",
    title: "How much debt does the central government have?",
    shortTitle: "Central debt",
    dek: "Central government debt as a share of GDP.",
    seriesPath: "data/series/worldbank.IN.GC_DOD_TOTL_GD_ZS.json",
    valueFormat: "percent",
    axisFormat: "percent",
    bottomLine: "Debt-to-GDP is the basic scale measure for public debt.",
    sourceIds: ["worldbank"],
    transform: "Values displayed as percent of GDP.",
    caveat: "This is central government debt and does not give the whole fiscal picture by itself.",
    aliases: ["debt", "government debt", "debt to gdp"]
  },
  {
    id: "owid.co2_total",
    slug: "how-much-co2-does-india-emit",
    domain: "climate",
    topic: "Emissions",
    title: "How much CO2 does India emit?",
    shortTitle: "CO2 emissions",
    dek: "Annual CO2 emissions.",
    seriesPath: "data/series/owid.IN.annual-co2-emissions-per-country.json",
    valueFormat: "tonnes_billion",
    axisFormat: "tonnes_billion",
    bottomLine: "Total emissions show India's climate scale; per-person emissions tell a different fairness story.",
    sourceIds: ["owid"],
    transform: "Display converts tonnes to billions of tonnes; stored values remain raw tonnes.",
    caveat: "This chart covers CO2 and does not include every greenhouse gas.",
    aliases: ["co2", "emissions", "carbon dioxide"]
  },
  {
    id: "owid.co2_per_capita",
    slug: "how-much-co2-does-india-emit-per-person",
    domain: "climate",
    topic: "Emissions",
    title: "How much CO2 does India emit per person?",
    shortTitle: "CO2 per person",
    dek: "Annual CO2 emissions per person.",
    seriesPath: "data/series/owid.IN.co-emissions-per-capita.json",
    valueFormat: "raw",
    axisFormat: "raw",
    bottomLine: "Per-person emissions keep the climate story from becoming only a big-country headline.",
    sourceIds: ["owid"],
    transform: "Values displayed as tonnes per person.",
    caveat: "A national average hides income, region, and lifestyle differences.",
    aliases: ["co2 per capita", "carbon per person", "emissions per person"]
  },
  {
    id: "owid.co2_cumulative",
    slug: "is-india-a-big-emitter-historically",
    domain: "climate",
    topic: "Historical emissions",
    title: "Is India a big emitter historically?",
    shortTitle: "Cumulative CO2",
    dek: "Cumulative CO2 emissions over time.",
    seriesPath: "data/series/owid.IN.cumulative-co-emissions.json",
    valueFormat: "tonnes_billion",
    axisFormat: "tonnes_billion",
    bottomLine: "Cumulative emissions answer a different question from this year's emissions.",
    sourceIds: ["owid"],
    transform: "Display converts tonnes to billions of tonnes; stored values remain raw tonnes.",
    caveat: "Historical responsibility depends on method, gas coverage, and start date.",
    aliases: ["cumulative emissions", "historical emissions", "climate history"]
  }
];

export const charts: ChartRecord[] = [...curatedCharts, ...generatedChartSeeds.map(makeChart)].filter((chart) => {
  const artifact = JSON.parse(readFileSync(resolve(process.cwd(), chart.seriesPath), "utf8")) as SeriesArtifact;
  return Array.isArray(artifact.observations) && artifact.observations.some((item) => item.value !== null);
});

export function domainFor(id: DomainId) {
  return domains.find((domain) => domain.id === id);
}

export function chartUrl(chart: ChartRecord, _locale = "en") {
  return `/${chart.domain}/${chart.slug}/`;
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
  if (format === "people_million") return `${(value / 1_000_000).toFixed(1)} mn`;
  if (format === "years") return `${value.toFixed(1)} years`;
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (format === "tonnes_billion") return `${(value / 1_000_000_000).toFixed(2)}B t`;
  return value.toLocaleString("en-IN");
}

export function axisLabel(value: number, format: ChartRecord["axisFormat"]) {
  if (format === "usd_trillion") return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (format === "usd") return `$${Math.round(value).toLocaleString("en-IN")}`;
  if (format === "people_billion") return `${(value / 1_000_000_000).toFixed(1)}bn`;
  if (format === "people_million") return `${(value / 1_000_000).toFixed(0)}mn`;
  if (format === "years") return `${Math.round(value)}`;
  if (format === "percent") return `${Math.round(value)}%`;
  if (format === "tonnes_billion") return `${(value / 1_000_000_000).toFixed(1)}B`;
  return value.toLocaleString("en-IN");
}
