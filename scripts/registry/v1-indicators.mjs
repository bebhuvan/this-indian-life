export const v1Questions = [
  { id: "q.people.total", question: "How many people live in India?", priority: "core", indicators: ["people.population.total", "people.population.un.total"] },
  { id: "q.people.growth", question: "Is India's population still growing?", priority: "core", indicators: ["people.population.un.change_rate"] },
  { id: "q.people.age", question: "How old is India?", priority: "core", indicators: ["people.population.un.median_age"] },
  { id: "q.people.pyramid", question: "What does India's population pyramid look like?", priority: "core", indicators: ["people.population.un.age_sex_5y"] },
  { id: "q.people.old_before_rich", question: "Is India getting old before it gets rich?", priority: "core", indicators: ["people.population.un.old_age_dependency", "econ.gdp.per_capita_current_usd"] },
  { id: "q.econ.size", question: "How big is India's economy?", priority: "core", indicators: ["econ.gdp.current_usd"] },
  { id: "q.econ.growth", question: "How fast is India's economy growing?", priority: "core", indicators: ["econ.gdp.growth_real"] },
  { id: "q.econ.per_person", question: "How rich is the average Indian?", priority: "core", indicators: ["econ.gdp.per_capita_current_usd"] },
  { id: "q.econ.feels", question: "Why does GDP growth not feel like salary growth?", priority: "core", indicators: ["econ.gdp.growth_real", "econ.gdp.per_capita_current_usd", "econ.inflation_cpi"] },
  { id: "q.econ.compare", question: "How does India compare with China, the US, and the world?", priority: "core", indicators: ["econ.gdp.current_usd", "econ.gdp.per_capita_current_usd", "people.population.total"] },
  { id: "q.health.life", question: "How long do Indians live?", priority: "core", indicators: ["health.life_expectancy", "health.who.life_expectancy"] },
  { id: "q.health.hale", question: "How healthy are those extra years?", priority: "core", indicators: ["health.who.hale_birth"] },
  { id: "q.health.u5mr", question: "How many Indian children die before age five?", priority: "core", indicators: ["health.under5_mortality", "health.who.under5_mortality", "people.population.un.u5mr"] },
  { id: "q.health.deaths", question: "What kills Indians?", priority: "core", indicators: ["health.who.ncd_mortality", "health.who.maternal_mortality", "health.who.neonatal_mortality"] },
  { id: "q.education.literacy", question: "How literate is India?", priority: "core", indicators: ["education.literacy_adult"] },
  { id: "q.education.years", question: "How many years of schooling do Indians get?", priority: "core", indicators: ["education.school_life_expectancy", "education.school_enrollment_secondary"] },
  { id: "q.work.force", question: "How many Indians are in the workforce?", priority: "core", indicators: ["work.labor_force_total"] },
  { id: "q.work.women", question: "Why is women's work participation so low?", priority: "core", indicators: ["work.labor_force_participation_female"] },
  { id: "q.work.agriculture", question: "What share of Indians still work in agriculture?", priority: "core", indicators: ["work.employment_agriculture", "econ.gdp.sector_agriculture"] },
  { id: "q.energy.mix", question: "How does India generate electricity?", priority: "core", indicators: ["energy.ember.generation"] },
  { id: "q.energy.coal", question: "How dependent is India on coal?", priority: "core", indicators: ["energy.ember.generation"] },
  { id: "q.energy.renewables", question: "How fast are renewables growing?", priority: "core", indicators: ["energy.ember.generation"] },
  { id: "q.energy.access", question: "Do nearly all Indians have electricity now?", priority: "core", indicators: ["energy.electricity_access"] },
  { id: "q.air.today", question: "How bad is India's air today?", priority: "core", indicators: ["climate.waqi.delhi"] },
  { id: "q.climate.co2", question: "How much CO2 does India emit?", priority: "core", indicators: ["climate.co2.total", "owid.co2_total"] },
  { id: "q.climate.co2_pc", question: "How much does India emit per person?", priority: "core", indicators: ["climate.co2.per_capita", "owid.co2_per_capita"] },
  { id: "q.climate.historical", question: "Is India a big emitter historically?", priority: "core", indicators: ["owid.co2_cumulative"] },
  { id: "q.services.water", question: "Do Indians have safe drinking water?", priority: "core", indicators: ["society.water_basic"] },
  { id: "q.state.tax", question: "How much tax does India collect?", priority: "core", indicators: ["state.tax_revenue_gdp"] },
  { id: "q.world.share", question: "What share of the world is India?", priority: "core", indicators: ["people.population.total", "econ.gdp.current_usd", "climate.co2.total"] }
];

export const worldBankIndicators = [
  { id: "econ.gdp.current_usd", sourceIndicatorId: "NY.GDP.MKTP.CD", title: "GDP, current US dollars", unit: "current US$", frequency: "annual" },
  { id: "econ.gdp.growth_real", sourceIndicatorId: "NY.GDP.MKTP.KD.ZG", title: "GDP growth, annual percent", unit: "annual %", frequency: "annual" },
  { id: "econ.gdp.per_capita_current_usd", sourceIndicatorId: "NY.GDP.PCAP.CD", title: "GDP per capita, current US dollars", unit: "current US$ per person", frequency: "annual" },
  { id: "econ.gdp.sector_agriculture", sourceIndicatorId: "NV.AGR.TOTL.ZS", title: "Agriculture, value added", unit: "% of GDP", frequency: "annual" },
  { id: "econ.gdp.sector_industry", sourceIndicatorId: "NV.IND.TOTL.ZS", title: "Industry, value added", unit: "% of GDP", frequency: "annual" },
  { id: "econ.gdp.sector_services", sourceIndicatorId: "NV.SRV.TOTL.ZS", title: "Services, value added", unit: "% of GDP", frequency: "annual" },
  { id: "econ.inflation_cpi", sourceIndicatorId: "FP.CPI.TOTL.ZG", title: "Inflation, consumer prices", unit: "annual %", frequency: "annual" },
  { id: "econ.trade_gdp", sourceIndicatorId: "NE.TRD.GNFS.ZS", title: "Trade", unit: "% of GDP", frequency: "annual" },
  { id: "people.population.total", sourceIndicatorId: "SP.POP.TOTL", title: "Population, total", unit: "people", frequency: "annual" },
  { id: "people.population.growth", sourceIndicatorId: "SP.POP.GROW", title: "Population growth", unit: "annual %", frequency: "annual" },
  { id: "people.fertility", sourceIndicatorId: "SP.DYN.TFRT.IN", title: "Fertility rate", unit: "births per woman", frequency: "annual" },
  { id: "people.age_0_14_share", sourceIndicatorId: "SP.POP.0014.TO.ZS", title: "Population ages 0-14", unit: "% of population", frequency: "annual" },
  { id: "people.age_15_64_share", sourceIndicatorId: "SP.POP.1564.TO.ZS", title: "Population ages 15-64", unit: "% of population", frequency: "annual" },
  { id: "people.age_65_plus_share", sourceIndicatorId: "SP.POP.65UP.TO.ZS", title: "Population ages 65 and above", unit: "% of population", frequency: "annual" },
  { id: "people.age_dependency", sourceIndicatorId: "SP.POP.DPND", title: "Age dependency ratio", unit: "% of working-age population", frequency: "annual" },
  { id: "society.urban_population_share", sourceIndicatorId: "SP.URB.TOTL.IN.ZS", title: "Urban population", unit: "% of population", frequency: "annual" },
  { id: "health.life_expectancy", sourceIndicatorId: "SP.DYN.LE00.IN", title: "Life expectancy at birth", unit: "years", frequency: "annual" },
  { id: "health.under5_mortality", sourceIndicatorId: "SH.DYN.MORT", title: "Under-five mortality rate", unit: "per 1,000 live births", frequency: "annual" },
  { id: "health.current_health_expenditure_gdp", sourceIndicatorId: "SH.XPD.CHEX.GD.ZS", title: "Current health expenditure", unit: "% of GDP", frequency: "annual" },
  { id: "education.literacy_adult", sourceIndicatorId: "SE.ADT.LITR.ZS", title: "Adult literacy rate", unit: "% ages 15 and above", frequency: "annual" },
  { id: "education.school_enrollment_secondary", sourceIndicatorId: "SE.SEC.ENRR", title: "School enrollment, secondary", unit: "% gross", frequency: "annual" },
  { id: "education.school_life_expectancy", sourceIndicatorId: "SE.SCH.LIFE", title: "School life expectancy", unit: "years", frequency: "annual" },
  { id: "work.labor_force_total", sourceIndicatorId: "SL.TLF.TOTL.IN", title: "Labor force, total", unit: "people", frequency: "annual" },
  { id: "work.labor_force_participation_female", sourceIndicatorId: "SL.TLF.CACT.FE.ZS", title: "Labor force participation rate, female", unit: "% ages 15+", frequency: "annual" },
  { id: "work.employment_agriculture", sourceIndicatorId: "SL.AGR.EMPL.ZS", title: "Employment in agriculture", unit: "% of total employment", frequency: "annual" },
  { id: "energy.electricity_access", sourceIndicatorId: "EG.ELC.ACCS.ZS", title: "Access to electricity", unit: "% of population", frequency: "annual" },
  { id: "energy.electric_power_consumption_pc", sourceIndicatorId: "EG.USE.ELEC.KH.PC", title: "Electric power consumption", unit: "kWh per capita", frequency: "annual" },
  { id: "energy.clean_cooking_access", sourceIndicatorId: "EG.CFT.ACCS.ZS", title: "Access to clean fuels and technologies for cooking", unit: "% of population", frequency: "annual" },
  { id: "climate.co2.total", sourceIndicatorId: "EN.ATM.CO2E.KT", title: "CO2 emissions", unit: "kt", frequency: "annual" },
  { id: "climate.co2.per_capita", sourceIndicatorId: "EN.ATM.CO2E.PC", title: "CO2 emissions per capita", unit: "metric tons per capita", frequency: "annual" },
  { id: "society.water_basic", sourceIndicatorId: "SH.H2O.BASW.ZS", title: "People using at least basic drinking water services", unit: "% of population", frequency: "annual" },
  { id: "society.sanitation_basic", sourceIndicatorId: "SH.STA.BASS.ZS", title: "People using at least basic sanitation services", unit: "% of population", frequency: "annual" },
  { id: "society.internet_users", sourceIndicatorId: "IT.NET.USER.ZS", title: "Individuals using the Internet", unit: "% of population", frequency: "annual" },
  { id: "state.tax_revenue_gdp", sourceIndicatorId: "GC.TAX.TOTL.GD.ZS", title: "Tax revenue", unit: "% of GDP", frequency: "annual" },
  { id: "state.expense_gdp", sourceIndicatorId: "GC.XPN.TOTL.GD.ZS", title: "Expense", unit: "% of GDP", frequency: "annual" },
  { id: "state.debt_central_gdp", sourceIndicatorId: "GC.DOD.TOTL.GD.ZS", title: "Central government debt", unit: "% of GDP", frequency: "annual" }
];

export const unPopulationIndicators = [
  { indicator: 19, id: "people.population.un.fertility", title: "Total fertility rate", unit: "births per woman", start: 2000, end: 2030 },
  { indicator: 24, id: "people.population.un.u5mr", title: "Under-five mortality rate", unit: "per 1,000 live births", start: 2000, end: 2030 },
  { indicator: 46, id: "people.population.un.age_sex_5y", title: "Population by 5-year age groups and sex", unit: "people", start: 2000, end: 2030 },
  { indicator: 49, id: "people.population.un.total", title: "Total population by sex", unit: "people", start: 2000, end: 2030 },
  { indicator: 51, id: "people.population.un.change_rate", title: "Crude rate of total population change", unit: "per 1,000 population", start: 2000, end: 2030 },
  { indicator: 61, id: "people.population.un.life_expectancy", title: "Life expectancy by sex at birth", unit: "years", start: 2000, end: 2030 },
  { indicator: 67, id: "people.population.un.median_age", title: "Median age of population", unit: "years", start: 2000, end: 2030 },
  { indicator: 71, id: "people.population.un.broad_age_share", title: "Percentage of total population by broad age group", unit: "%", start: 2000, end: 2030 },
  { indicator: 83, id: "people.population.un.child_dependency", title: "Child dependency ratio", unit: "ratio", start: 2000, end: 2030 },
  { indicator: 84, id: "people.population.un.old_age_dependency", title: "Old-age dependency ratio", unit: "ratio", start: 2000, end: 2030 },
  { indicator: 86, id: "people.population.un.total_dependency", title: "Total dependency ratio", unit: "ratio", start: 2000, end: 2030 }
];

export const whoIndicators = [
  { indicatorCode: "WHOSIS_000001", id: "health.who.life_expectancy", title: "Life expectancy at birth", unit: "years" },
  { indicatorCode: "WHOSIS_000002", id: "health.who.hale_birth", title: "Healthy life expectancy at birth", unit: "years" },
  { indicatorCode: "WHOSIS_000015", id: "health.who.life_expectancy_age_60", title: "Life expectancy at age 60", unit: "years" },
  { indicatorCode: "MDG_0000000007", id: "health.who.under5_mortality", title: "Under-five mortality rate", unit: "per 1,000 live births" },
  { indicatorCode: "MDG_0000000001", id: "health.who.infant_mortality", title: "Infant mortality rate", unit: "per 1,000 live births" },
  { indicatorCode: "nmr", id: "health.who.neonatal_mortality", title: "Neonatal mortality rate", unit: "per 1,000 live births" },
  { indicatorCode: "MDG_0000000026", id: "health.who.maternal_mortality", title: "Maternal mortality ratio", unit: "per 100,000 live births" },
  { indicatorCode: "WHS2_131", id: "health.who.ncd_mortality", title: "Age-standardized NCD mortality rate", unit: "per 100,000 population" }
];

export const emberDatasets = [
  { id: "energy.ember.generation", dataset: "electricity-generation", title: "Electricity generation by source", unit: "TWh", startDate: "2000" },
  { id: "energy.ember.demand", dataset: "electricity-demand", title: "Electricity demand", unit: "TWh", startDate: "2000" },
  { id: "energy.ember.emissions", dataset: "power-sector-emissions", title: "Power-sector emissions", unit: "MtCO2", startDate: "2000" },
  { id: "energy.ember.carbon_intensity", dataset: "carbon-intensity", title: "Electricity carbon intensity", unit: "gCO2/kWh", startDate: "2000" }
];

export const owidGrapherDatasets = [
  { id: "owid.co2_total", slug: "annual-co2-emissions-per-country", title: "Annual CO2 emissions", unit: "tonnes" },
  { id: "owid.co2_per_capita", slug: "co-emissions-per-capita", title: "Annual CO2 emissions per capita", unit: "tonnes per person" },
  { id: "owid.co2_cumulative", slug: "cumulative-co-emissions", title: "Cumulative CO2 emissions", unit: "tonnes" },
  { id: "owid.life_expectancy", slug: "life-expectancy", title: "Life expectancy", unit: "years" },
  { id: "owid.child_mortality", slug: "child-mortality", title: "Child mortality", unit: "%" },
  { id: "owid.energy_per_capita", slug: "per-capita-energy-use", title: "Energy use per person", unit: "kWh/person" }
];

export const waqiCities = [
  { id: "climate.waqi.delhi", city: "delhi", title: "Delhi air quality index", unit: "AQI" },
  { id: "climate.waqi.mumbai", city: "mumbai", title: "Mumbai air quality index", unit: "AQI" },
  { id: "climate.waqi.kolkata", city: "kolkata", title: "Kolkata air quality index", unit: "AQI" },
  { id: "climate.waqi.chennai", city: "chennai", title: "Chennai air quality index", unit: "AQI" },
  { id: "climate.waqi.bengaluru", city: "bengaluru", title: "Bengaluru air quality index", unit: "AQI" }
];
