// Each question declares its scope explicitly:
//   core    = the must-have indicators that answer the question (drives prose + charts + "primary" visuals)
//   context = supporting indicators; when present, the page is locked to core ∪ context only,
//             so unrelated theme indicators can never leak into the evidence packet or the charts.
//   context: [] means "lock to core only".
//   indicators = legacy field, kept for backward compatibility (sidebar tags etc.); always equals core.
// Off-topic indicators are excluded simply by not listing them — no separate exclude list needed.
export const v1Questions = [
  {
    id: "q.econ.asia_divergence",
    slug: "why-india-stayed-poor-while-asia-got-rich",
    question: "Why did India stay poor while the rest of Asia got rich?",
    priority: "core",
    // Flagship comparison: India vs China + the Asian tigers + later-wave peers, organised
    // as the "integrated East Asian model" causal chain — human capital, then investment,
    // then manufacturing-led structural transformation, then export sophistication, then
    // outcomes — with India under-doing each link, and an honest "other side" act. Stance:
    // confident about WHAT the data shows, humble about WHY; present all sides; never imply
    // coercion was the necessary price. Maddison is a long-run reconstruction (read as broad
    // trajectory); measured WB/PWT data carries the modern, precision-mattering comparisons.
    indicators: ["divergence.gdp_pc_ppp.in"],
    core: [
      "divergence.gdp_pc_maddison.in",
      "divergence.gdp_pc_ppp.in",
      "divergence.flfp.in",
      "divergence.gfcf.in",
      "divergence.mfg_va.in",
      "divergence.schooling_years.in"
    ],
    context: [
      "divergence.gdp_pc_maddison.chn", "divergence.gdp_pc_maddison.kor", "divergence.gdp_pc_maddison.idn", "divergence.gdp_pc_maddison.bgd",
      "divergence.gdp_pc_ppp.chn", "divergence.gdp_pc_ppp.kor", "divergence.gdp_pc_ppp.vnm", "divergence.gdp_pc_ppp.bgd", "divergence.gdp_pc_ppp.idn", "divergence.gdp_pc_ppp.wld",
      "divergence.life_expectancy.in", "divergence.life_expectancy.chn", "divergence.life_expectancy.kor", "divergence.life_expectancy.vnm", "divergence.life_expectancy.bgd", "divergence.life_expectancy.wld",
      "divergence.under5_mortality.in", "divergence.under5_mortality.chn", "divergence.under5_mortality.kor", "divergence.under5_mortality.vnm", "divergence.under5_mortality.bgd", "divergence.under5_mortality.wld",
      "divergence.fertility.in", "divergence.fertility.chn", "divergence.fertility.kor", "divergence.fertility.vnm", "divergence.fertility.bgd",
      "divergence.schooling_years.chn", "divergence.schooling_years.kor", "divergence.schooling_years.twn", "divergence.schooling_years.bgd", "divergence.schooling_years.jpn",
      "divergence.flfp.chn", "divergence.flfp.kor", "divergence.flfp.vnm", "divergence.flfp.bgd", "divergence.flfp.wld",
      "divergence.stunting.in", "divergence.stunting.chn", "divergence.stunting.vnm", "divergence.stunting.bgd", "divergence.stunting.idn", "divergence.stunting.pak",
      "divergence.gfcf.chn", "divergence.gfcf.kor", "divergence.gfcf.vnm", "divergence.gfcf.jpn", "divergence.gfcf.wld",
      "divergence.gross_savings.chn", "divergence.gross_savings.kor", "divergence.gross_savings.vnm", "divergence.gross_savings.wld", "divergence.gross_savings.in",
      "divergence.fdi_in.in", "divergence.fdi_in.chn", "divergence.fdi_in.kor", "divergence.fdi_in.vnm", "divergence.fdi_in.bgd",
      "divergence.mfg_va.kor", "divergence.mfg_va.mys", "divergence.mfg_va.tha", "divergence.mfg_va.bgd",
      "divergence.agri_va.in", "divergence.industry_va.in", "divergence.services_va.in",
      "divergence.emp_agriculture.in", "divergence.emp_agriculture.chn", "divergence.emp_agriculture.kor", "divergence.emp_agriculture.vnm", "divergence.emp_agriculture.bgd",
      "trade.atlas.eci", "trade.atlas.eci_chn", "trade.atlas.eci_kor", "trade.atlas.eci_vnm", "trade.atlas.eci_tha",
      "divergence.tariff.in", "divergence.tariff.chn", "divergence.tariff.kor", "divergence.tariff.vnm", "divergence.tariff.bgd", "divergence.tariff.idn",
      "divergence.services_export_share.in", "divergence.services_export_share.chn", "divergence.services_export_share.kor", "divergence.services_export_share.vnm", "divergence.services_export_share.bgd",
      "divergence.manuf_exports_share.in", "divergence.manuf_exports_share.chn", "divergence.manuf_exports_share.kor", "divergence.manuf_exports_share.vnm", "divergence.manuf_exports_share.bgd",
      "divergence.productivity_hour.in", "divergence.productivity_hour.chn", "divergence.productivity_hour.kor", "divergence.productivity_hour.twn", "divergence.productivity_hour.vnm", "divergence.productivity_hour.jpn",
      "divergence.rnd_gdp.in", "divergence.rnd_gdp.chn", "divergence.rnd_gdp.kor", "divergence.rnd_gdp.jpn",
      "divergence.electric_consumption_pc.in", "divergence.electric_consumption_pc.chn", "divergence.electric_consumption_pc.kor", "divergence.electric_consumption_pc.vnm", "divergence.electric_consumption_pc.wld",
      "divergence.urban_share.in", "divergence.urban_share.chn", "divergence.urban_share.kor", "divergence.urban_share.vnm", "divergence.urban_share.wld",
      "divergence.poverty_owid.in", "divergence.poverty_owid.chn", "divergence.poverty_owid.idn", "divergence.poverty_owid.vnm", "divergence.poverty_owid.bgd",
      "divergence.hdi.in", "divergence.hdi.chn", "divergence.hdi.kor", "divergence.hdi.vnm", "divergence.hdi.bgd",
      "divergence.democracy.in", "divergence.democracy.chn", "divergence.democracy.kor", "divergence.democracy.twn"
    ],
    visualPlan: [
      // ACT 1 — the same starting line, and the great divergence
      { chart: "multiLine", title: "The same starting line, and the great divergence", size: "hero", beat: "divergence", unit: "GDP per capita (2011 int-$)", fromYear: 1950,
        subtitle: "Maddison Project 2023 · GDP per capita in 2011 int-$ · a long-run reconstruction, read as broad trajectory not precise levels",
        bands: [{ year: 1978, label: "China opens up" }, { year: 1991, label: "India opens up" }],
        series: [
          { indicator: "divergence.gdp_pc_maddison.in", label: "India" },
          { indicator: "divergence.gdp_pc_maddison.chn", label: "China" },
          { indicator: "divergence.gdp_pc_maddison.kor", label: "S. Korea" },
          { indicator: "divergence.gdp_pc_maddison.idn", label: "Indonesia" },
          { indicator: "divergence.gdp_pc_maddison.bgd", label: "Bangladesh" }
        ],
        why: "Around 1950 India was no poorer than its Asian peers; this is the gap that opened up afterward.",
        read: "Each line is one country's average output per person, on a long-run reconstruction. Lines that climb steeply pulled away from India.",
        watch: "These are reconstructed historical estimates with wide error bars, especially before 1950. Read the shape and the divergence, not the exact value in any single year." },
      { chart: "multiLine", title: "The income gap, measured", size: "feature", beat: "level", unit: "GDP per capita at PPP (constant 2021 int-$)", fromYear: 1990,
        subtitle: "World Bank · GDP per capita at purchasing-power parity, constant 2021 international dollars",
        series: [
          { indicator: "divergence.gdp_pc_ppp.in", label: "India" },
          { indicator: "divergence.gdp_pc_ppp.chn", label: "China" },
          { indicator: "divergence.gdp_pc_ppp.kor", label: "S. Korea" },
          { indicator: "divergence.gdp_pc_ppp.vnm", label: "Vietnam" },
          { indicator: "divergence.gdp_pc_ppp.bgd", label: "Bangladesh" },
          { indicator: "divergence.gdp_pc_ppp.wld", label: "World" }
        ],
        why: "The measured, modern version of the gap, on a like-for-like PPP basis.",
        watch: "PPP adjusts for price differences so a rupee and a dollar buy comparable baskets; it is a modelled price-level adjustment, not a market exchange rate." },
      // ACT 2 — human capital first
      { chart: "multiLine", title: "How long people live", size: "feature", beat: "human-capital", unit: "life expectancy at birth (years)", fromYear: 1960,
        subtitle: "World Bank · life expectancy at birth · 1960 to latest",
        series: [
          { indicator: "divergence.life_expectancy.in", label: "India" },
          { indicator: "divergence.life_expectancy.chn", label: "China" },
          { indicator: "divergence.life_expectancy.kor", label: "S. Korea" },
          { indicator: "divergence.life_expectancy.vnm", label: "Vietnam" },
          { indicator: "divergence.life_expectancy.bgd", label: "Bangladesh" },
          { indicator: "divergence.life_expectancy.wld", label: "World" }
        ],
        why: "East Asia invested in survival first; the life-expectancy gap opened decades before the income gap." },
      { chart: "multiLine", title: "Children who don't reach five", size: "small", beat: "human-capital", unit: "under-five deaths per 1,000 live births", fromYear: 1960,
        subtitle: "World Bank · under-five mortality · 1960 to latest",
        series: [
          { indicator: "divergence.under5_mortality.in", label: "India" },
          { indicator: "divergence.under5_mortality.chn", label: "China" },
          { indicator: "divergence.under5_mortality.kor", label: "S. Korea" },
          { indicator: "divergence.under5_mortality.vnm", label: "Vietnam" },
          { indicator: "divergence.under5_mortality.bgd", label: "Bangladesh" }
        ],
        why: "A healthy, surviving child is the first input into a future workforce." },
      { chart: "multiLine", title: "Years of schooling, the long view", size: "feature", beat: "human-capital", unit: "mean years of schooling", fromYear: 1900,
        subtitle: "Lee-Lee / Barro-Lee via Our World in Data · average years of schooling, adults · the human-capital stock, not just enrolment",
        series: [
          { indicator: "divergence.schooling_years.in", label: "India" },
          { indicator: "divergence.schooling_years.chn", label: "China" },
          { indicator: "divergence.schooling_years.kor", label: "S. Korea" },
          { indicator: "divergence.schooling_years.twn", label: "Taiwan" },
          { indicator: "divergence.schooling_years.bgd", label: "Bangladesh" },
          { indicator: "divergence.schooling_years.jpn", label: "Japan" }
        ],
        why: "Schooling is the human-capital stock a country brings to industrialisation; India started this climb late and slow." },
      { chart: "multiLine", title: "Where are the women at work?", size: "hero", beat: "female-labour", unit: "female labour-force participation (% of women 15+)", fromYear: 1990,
        subtitle: "World Bank / ILO modelled estimate · share of women 15+ in the labour force",
        series: [
          { indicator: "divergence.flfp.in", label: "India" },
          { indicator: "divergence.flfp.chn", label: "China" },
          { indicator: "divergence.flfp.kor", label: "S. Korea" },
          { indicator: "divergence.flfp.vnm", label: "Vietnam" },
          { indicator: "divergence.flfp.bgd", label: "Bangladesh" },
          { indicator: "divergence.flfp.wld", label: "World" }
        ],
        why: "India's single most striking outlier: barely a quarter to a third of women are in the measured workforce, far below its Asian peers.",
        read: "Each line is the share of working-age women in the labour force. Higher means more women earning.",
        watch: "These are modelled ILO estimates and differ from India's own survey levels; much of women's work in India is unpaid or informal and undercounted." },
      { chart: "multiLine", title: "How fast families shrank", size: "small", beat: "demography", unit: "births per woman", fromYear: 1960,
        subtitle: "World Bank · total fertility rate · 1960 to latest",
        series: [
          { indicator: "divergence.fertility.in", label: "India" },
          { indicator: "divergence.fertility.chn", label: "China" },
          { indicator: "divergence.fertility.kor", label: "S. Korea" },
          { indicator: "divergence.fertility.vnm", label: "Vietnam" },
          { indicator: "divergence.fertility.bgd", label: "Bangladesh" }
        ],
        why: "Faster fertility decline opened the demographic-dividend window earlier in East Asia." },
      { chart: "latestBars", title: "Children too short for their age", size: "small", beat: "human-capital", unit: "% of children under 5 stunted",
        subtitle: "World Bank · child stunting, latest available year per country",
        series: [
          { indicator: "divergence.stunting.in", label: "India" },
          { indicator: "divergence.stunting.pak", label: "Pakistan" },
          { indicator: "divergence.stunting.bgd", label: "Bangladesh" },
          { indicator: "divergence.stunting.idn", label: "Indonesia" },
          { indicator: "divergence.stunting.vnm", label: "Vietnam" },
          { indicator: "divergence.stunting.chn", label: "China" }
        ],
        why: "Stunting is malnutrition written into a child's body and brain; India's rate is high even against much poorer countries.",
        watch: "Survey years differ by country, so read this as the latest snapshot, not a single common year." },
      // ACT 3 — the investment engine
      { chart: "multiLine", title: "How much each country built", size: "feature", beat: "investment", unit: "gross fixed capital formation (% of GDP)", fromYear: 1960,
        subtitle: "World Bank · gross fixed capital formation as a share of GDP · the investment rate",
        series: [
          { indicator: "divergence.gfcf.in", label: "India" },
          { indicator: "divergence.gfcf.chn", label: "China" },
          { indicator: "divergence.gfcf.kor", label: "S. Korea" },
          { indicator: "divergence.gfcf.vnm", label: "Vietnam" },
          { indicator: "divergence.gfcf.jpn", label: "Japan" },
          { indicator: "divergence.gfcf.wld", label: "World" }
        ],
        why: "The under-told engine of the miracle: East Asia poured a huge share of output into factories, roads and machines.",
        read: "Each line is the share of GDP spent building productive capacity each year. Higher means more of today's output invested in tomorrow." },
      { chart: "multiLine", title: "Who saved to pay for it", size: "small", beat: "investment", unit: "gross savings (% of GDP)", fromYear: 1975,
        subtitle: "World Bank · gross savings as a share of GDP",
        series: [
          { indicator: "divergence.gross_savings.in", label: "India" },
          { indicator: "divergence.gross_savings.chn", label: "China" },
          { indicator: "divergence.gross_savings.kor", label: "S. Korea" },
          { indicator: "divergence.gross_savings.vnm", label: "Vietnam" },
          { indicator: "divergence.gross_savings.wld", label: "World" }
        ],
        why: "High investment was financed by high domestic saving; the two move together." },
      { chart: "multiLine", title: "Foreign money coming in", size: "small", beat: "investment", unit: "FDI net inflows (% of GDP)", fromYear: 1980,
        subtitle: "World Bank · foreign direct investment, net inflows, as a share of GDP",
        series: [
          { indicator: "divergence.fdi_in.in", label: "India" },
          { indicator: "divergence.fdi_in.chn", label: "China" },
          { indicator: "divergence.fdi_in.kor", label: "S. Korea" },
          { indicator: "divergence.fdi_in.vnm", label: "Vietnam" },
          { indicator: "divergence.fdi_in.bgd", label: "Bangladesh" }
        ],
        why: "Foreign factories brought capital, technology and export markets; Vietnam and China pulled in far more, relative to their size." },
      // ACT 4 — the factory India skipped
      { chart: "multiLine", title: "The factory escalator India never rode", size: "hero", beat: "structure", unit: "manufacturing value added (% of GDP)", fromYear: 1960,
        subtitle: "World Bank · manufacturing value added as a share of GDP · India and South Korea have full records; China's WB series starts only in 2004",
        series: [
          { indicator: "divergence.mfg_va.in", label: "India" },
          { indicator: "divergence.mfg_va.kor", label: "S. Korea" },
          { indicator: "divergence.mfg_va.mys", label: "Malaysia" },
          { indicator: "divergence.mfg_va.tha", label: "Thailand" },
          { indicator: "divergence.mfg_va.bgd", label: "Bangladesh" }
        ],
        why: "Manufacturing is the escalator out of poverty; Korea's share humped up and stayed, India's never really rose.",
        read: "Each line is the share of the economy that is factory output. A rising-then-high line is a country that industrialised.",
        watch: "China is left off this chart because the World Bank's manufacturing series for it only begins in 2004 and would mislead; its industrial rise is discussed in the text." },
      { chart: "multiLine", title: "India's leap from farm to office", size: "feature", beat: "structure", unit: "share of value added (%)", fromYear: 1960,
        subtitle: "World Bank · India's value added by sector · the structural leap that skipped the factory",
        series: [
          { indicator: "divergence.agri_va.in", label: "Agriculture" },
          { indicator: "divergence.industry_va.in", label: "Industry" },
          { indicator: "divergence.mfg_va.in", label: "Manufacturing" },
          { indicator: "divergence.services_va.in", label: "Services" }
        ],
        why: "India's workers and output moved from farms to services, largely skipping the mass-manufacturing stage in between." },
      { chart: "multiLine", title: "Who left the farm, and when", size: "feature", beat: "structure", unit: "employment in agriculture (% of workers)", fromYear: 1991,
        subtitle: "World Bank / ILO modelled estimate · share of workers in agriculture",
        series: [
          { indicator: "divergence.emp_agriculture.in", label: "India" },
          { indicator: "divergence.emp_agriculture.chn", label: "China" },
          { indicator: "divergence.emp_agriculture.kor", label: "S. Korea" },
          { indicator: "divergence.emp_agriculture.vnm", label: "Vietnam" },
          { indicator: "divergence.emp_agriculture.bgd", label: "Bangladesh" }
        ],
        why: "Development means moving workers off the farm into higher-productivity work; India did this slower than its peers." },
      { chart: "multiLine", title: "The tariff wall India kept up", size: "small", beat: "openness", unit: "applied tariff rate (%)", fromYear: 1988,
        subtitle: "World Bank · applied tariff rate, weighted mean across all products · how walled-off the economy was",
        series: [
          { indicator: "divergence.tariff.in", label: "India" },
          { indicator: "divergence.tariff.chn", label: "China" },
          { indicator: "divergence.tariff.kor", label: "S. Korea" },
          { indicator: "divergence.tariff.vnm", label: "Vietnam" },
          { indicator: "divergence.tariff.idn", label: "Indonesia" }
        ],
        why: "Export-led growth needs an open economy; India taxed imports far more heavily than its peers and opened later.",
        watch: "Tariffs are only one barrier among many (quotas, licences, red tape); a falling tariff line understates how closed the pre-1991 economy really was." },
      { chart: "multiLine", title: "Climbing the complexity ladder", size: "feature", beat: "sophistication", unit: "Economic Complexity Index", fromYear: 1995,
        subtitle: "Harvard Growth Lab Atlas of Economic Complexity · how diverse and sophisticated each country's exports are",
        series: [
          { indicator: "trade.atlas.eci", label: "India" },
          { indicator: "trade.atlas.eci_chn", label: "China" },
          { indicator: "trade.atlas.eci_kor", label: "S. Korea" },
          { indicator: "trade.atlas.eci_vnm", label: "Vietnam" },
          { indicator: "trade.atlas.eci_tha", label: "Thailand" }
        ],
        why: "It is not just how much you export but what: Korea and China climbed to complex, high-value goods while India's basket stayed simpler.",
        watch: "A higher index means a more diverse, harder-to-imitate export mix; it is a ranking-based measure, so read relative positions, not absolute units." },
      { chart: "multiLine", title: "Making things to sell the world", size: "small", beat: "sophistication", unit: "manufactures (% of merchandise exports)", fromYear: 1965,
        subtitle: "World Bank · manufactured goods as a share of merchandise exports",
        series: [
          { indicator: "divergence.manuf_exports_share.in", label: "India" },
          { indicator: "divergence.manuf_exports_share.chn", label: "China" },
          { indicator: "divergence.manuf_exports_share.kor", label: "S. Korea" },
          { indicator: "divergence.manuf_exports_share.vnm", label: "Vietnam" },
          { indicator: "divergence.manuf_exports_share.bgd", label: "Bangladesh" }
        ],
        why: "Export-led growth runs on selling manufactures to the world; the peers built that engine, India leaned more on services and commodities." },
      // ACT 5 — where it left India
      { chart: "multiLine", title: "How much each worker produces", size: "feature", beat: "outcome", unit: "output per hour worked (int-$)", fromYear: 1970,
        subtitle: "Penn World Table via Our World in Data · real GDP per hour worked",
        series: [
          { indicator: "divergence.productivity_hour.in", label: "India" },
          { indicator: "divergence.productivity_hour.chn", label: "China" },
          { indicator: "divergence.productivity_hour.kor", label: "S. Korea" },
          { indicator: "divergence.productivity_hour.twn", label: "Taiwan" },
          { indicator: "divergence.productivity_hour.vnm", label: "Vietnam" },
          { indicator: "divergence.productivity_hour.jpn", label: "Japan" }
        ],
        why: "The income gap is, at bottom, a productivity gap: how much value an hour of work creates." },
      { chart: "multiLine", title: "Spending on inventing the future", size: "small", beat: "capability", unit: "R&D expenditure (% of GDP)", fromYear: 1996,
        subtitle: "World Bank · gross domestic expenditure on research and development as a share of GDP",
        series: [
          { indicator: "divergence.rnd_gdp.in", label: "India" },
          { indicator: "divergence.rnd_gdp.chn", label: "China" },
          { indicator: "divergence.rnd_gdp.kor", label: "S. Korea" },
          { indicator: "divergence.rnd_gdp.jpn", label: "Japan" }
        ],
        why: "Korea now spends a world-leading share on R&D; India's has been stuck below one percent for decades." },
      { chart: "multiLine", title: "The power to run a factory", size: "small", beat: "infrastructure", unit: "electricity use (kWh per capita)", fromYear: 1990,
        subtitle: "World Bank · electric power consumption per person · a proxy for industrial and household capacity",
        series: [
          { indicator: "divergence.electric_consumption_pc.in", label: "India" },
          { indicator: "divergence.electric_consumption_pc.chn", label: "China" },
          { indicator: "divergence.electric_consumption_pc.kor", label: "S. Korea" },
          { indicator: "divergence.electric_consumption_pc.vnm", label: "Vietnam" },
          { indicator: "divergence.electric_consumption_pc.wld", label: "World" }
        ],
        why: "Power per person tracks how industrial and how comfortable a society has become." },
      { chart: "multiLine", title: "Moving to the city", size: "small", beat: "structure", unit: "urban population (% of total)", fromYear: 1960,
        subtitle: "World Bank · share of population living in urban areas",
        series: [
          { indicator: "divergence.urban_share.in", label: "India" },
          { indicator: "divergence.urban_share.chn", label: "China" },
          { indicator: "divergence.urban_share.kor", label: "S. Korea" },
          { indicator: "divergence.urban_share.vnm", label: "Vietnam" },
          { indicator: "divergence.urban_share.wld", label: "World" }
        ],
        why: "Factories and services cluster in cities; East Asia urbanised fast, India more slowly and messily." },
      // ACT 6 — the other side
      { chart: "multiLine", title: "The poverty India did crush", size: "feature", beat: "other-side", unit: "% living under $3 a day", fromYear: 1980,
        subtitle: "World Bank Poverty and Inequality Platform via Our World in Data · share below the $3-a-day extreme-poverty line",
        series: [
          { indicator: "divergence.poverty_owid.in", label: "India" },
          { indicator: "divergence.poverty_owid.chn", label: "China" },
          { indicator: "divergence.poverty_owid.idn", label: "Indonesia" },
          { indicator: "divergence.poverty_owid.vnm", label: "Vietnam" },
          { indicator: "divergence.poverty_owid.bgd", label: "Bangladesh" }
        ],
        why: "India's genuine win: hundreds of millions lifted out of extreme poverty, even without the manufacturing boom.",
        watch: "India's poverty points are sparse because of gaps between its consumption surveys; read the trend, not every year." },
      { chart: "multiLine", title: "India's other escalator: services", size: "feature", beat: "other-side", unit: "services as % of total exports", fromYear: 1975,
        subtitle: "World Bank balance-of-payments data · services as a share of goods-plus-services exports · India's distinctive tilt toward selling services, not goods",
        series: [
          { indicator: "divergence.services_export_share.in", label: "India" },
          { indicator: "divergence.services_export_share.chn", label: "China" },
          { indicator: "divergence.services_export_share.kor", label: "S. Korea" },
          { indicator: "divergence.services_export_share.vnm", label: "Vietnam" },
          { indicator: "divergence.services_export_share.bgd", label: "Bangladesh" }
        ],
        why: "India did build an export engine, but in services (IT, business services) rather than factory goods, a different escalator that lifts fewer low-skilled workers.",
        watch: "A high services share is not automatically better or worse; it reflects what India sells to the world, and services have so far employed far fewer people than mass manufacturing would." },
      { chart: "multiLine", title: "The all-in human scorecard", size: "small", beat: "other-side", unit: "Human Development Index (0-1)", fromYear: 1990,
        subtitle: "UNDP via Our World in Data · Human Development Index, combining health, schooling and income",
        series: [
          { indicator: "divergence.hdi.in", label: "India" },
          { indicator: "divergence.hdi.chn", label: "China" },
          { indicator: "divergence.hdi.kor", label: "S. Korea" },
          { indicator: "divergence.hdi.vnm", label: "Vietnam" },
          { indicator: "divergence.hdi.bgd", label: "Bangladesh" }
        ],
        why: "A single composite of health, schooling and income, to see the whole gap at once." },
      { chart: "multiLine", title: "The road not taken: democracy", size: "feature", beat: "other-side", unit: "electoral democracy index (0-1)", fromYear: 1947,
        subtitle: "V-Dem via Our World in Data · electoral democracy index · India stayed democratic; Korea and Taiwan democratised only after their growth takeoff",
        series: [
          { indicator: "divergence.democracy.in", label: "India" },
          { indicator: "divergence.democracy.chn", label: "China" },
          { indicator: "divergence.democracy.kor", label: "S. Korea" },
          { indicator: "divergence.democracy.twn", label: "Taiwan" }
        ],
        why: "The honest counterweight: India built its record under continuous democracy, while the East Asian transformations were often coerced and only democratised later.",
        watch: "The index runs 0 to 1; this is a measure of electoral democracy, not of growth, and the chart makes no claim that either system causes growth." }
    ]
  },
  {
    id: "q.people.total",
    question: "How many people live in India?",
    priority: "core",
    indicators: ["people.population.total", "people.population.un.total"],
    core: ["people.population.total", "people.population.un.total"],
    // Flagship population page: comprehensive on purpose. Leads with the total, then
    // the growth/fertility mechanism, then the age structure (pyramid, broad shares,
    // median age, dependency). The sibling pages (q.people.pyramid / q.people.age /
    // q.people.old_before_rich) are deeper dives, not the only home for this material.
    context: [
      "people.population.growth",
      "people.fertility",
      "people.population.un.age_sex_5y",
      "people.age_0_14_share",
      "people.age_15_64_share",
      "people.age_65_plus_share",
      "people.population.un.median_age",
      "people.population.un.life_expectancy",
      "people.population.un.child_dependency",
      "people.population.un.old_age_dependency",
      "health.who.under5_mortality",
      "health.who.infant_mortality",
      "health.who.life_expectancy_age_60"
    ],
    // Curated set built from the lens framework in docs/CHART_SELECTION_PHILOSOPHY.md.
    // Each entry is a distinct angle; no duplicated facts. `size`: hero | feature | small.
    // why/read/watch are the chart-note fallback until LLM chartExplainers are generated.
    visualPlan: [
      { indicator: "people.population.total", chart: "line", title: "India's population, 1960 to today", size: "hero", window: "full", beat: "level",
        why: "The headline count, and the shape of how it got here.", read: "Each point is the number of people in that year. The line bends flatter as yearly growth slows.", watch: "This is a head count, not density or distribution. It says nothing about where people live or how crowded it feels." },
      { indicator: "people.population.un.age_sex_5y", chart: "pyramid", title: "Population pyramid, 2025", size: "feature", window: "latest", beat: "distribution",
        why: "Who those people are, by age and sex.", read: "Each bar is a five-year cohort, men on the left, women on the right. A wide base means lots of young people.", watch: "A bulge in the middle is the working-age dividend; a top-heavy shape would mean an ageing society." },
      { indicator: "people.population.growth", chart: "line", title: "Annual population growth rate", size: "small", window: "full", beat: "rate",
        why: "How fast the population is still rising each year.", read: "The percentage added each year, falling steadily toward zero.", watch: "The rate is falling, but it is still positive, so the total keeps rising even as growth slows." },
      { indicator: "people.fertility", chart: "line", title: "Births per woman", size: "small", window: "full", beat: "driver",
        why: "The main driver behind the slowdown.", read: "The average number of children a woman has over her life.", watch: "Below about 2.1 each generation is smaller, but built-in momentum keeps the total growing for decades." },
      { indicator: "people.population.un.age_sex_5y", chart: "ageStructure", title: "Age structure today", size: "small", window: "latest", beat: "composition",
        why: "The population split into life stages, not just three buckets.", read: "Each bar is that age group's share of everyone alive today.", watch: "Shares add to 100%, so a bigger older share has to mean a smaller younger one." },
      { indicator: "people.population.un.median_age", chart: "line", title: "Median age", size: "small", window: "full", beat: "level",
        why: "The single number for how old the country is.", read: "The age that splits the population into two equal halves.", watch: "It is rising, but India is still young compared with most of the world." },
      { chart: "multiLine", title: "How India's age mix has shifted", size: "feature", beat: "composition-over-time", unit: "% of population", subtitle: "World Bank · share of population · 1960 to today",
        series: [
          { indicator: "people.age_0_14_share", label: "Children (0–14)" },
          { indicator: "people.age_15_64_share", label: "Working age (15–64)" },
          { indicator: "people.age_65_plus_share", label: "Older (65+)" }
        ],
        indicator: "people.age_15_64_share",
        why: "The shift that opened India's demographic-dividend window.", read: "Three lines: the child share falling, the working-age share rising, the older share creeping up.", watch: "The dividend is the gap while working-age is high and old-age is still low, and it does not last forever." },
      { indicator: "people.population.un.life_expectancy", chart: "line", title: "Life expectancy at birth", size: "small", window: "full", beat: "subgroup",
        why: "How long people now live, by sex.", read: "The years a newborn can expect to live, given today's mortality.", watch: "Longer lives add to the older share, feeding the slow ageing of the population." },
      { indicator: "health.who.life_expectancy_age_60", chart: "line", title: "Life expectancy at 60", size: "small", window: "full", beat: "longevity",
        why: "How many more years someone who reaches 60 can expect.", read: "Extra years of life remaining at age 60, a direct read on the years spent in old age.", watch: "Rising old-age survival is what makes pensions and elder care a growing question." },
      { chart: "multiLine", title: "Child mortality by age", size: "feature", beat: "survival", unit: "per 1,000 live births", subtitle: "WHO · deaths before each age, per 1,000 live births",
        series: [
          { indicator: "health.who.under5_mortality", label: "Before age 5" },
          { indicator: "health.who.infant_mortality", label: "Before age 1" }
        ],
        indicator: "health.who.under5_mortality",
        why: "Child survival, split into deaths before five and before one.", read: "Two falling lines: deaths before age five and before age one, per 1,000 live births. The gap between them is deaths between ages one and five.", watch: "The two lines have converged, meaning most child deaths now happen in the first year, especially the first weeks." },
      { indicator: "people.population.un.child_dependency", chart: "dependencyLine", title: "Child dependency ratio", size: "small", window: "full", beat: "burden",
        why: "How many children each 100 working-age adults support.", read: "Children (under 15) per 100 people of working age.", watch: "A falling ratio frees up household and public budgets, which is the dividend in numbers." },
      { indicator: "people.population.un.old_age_dependency", chart: "dependencyLine", title: "Old-age dependency ratio", size: "small", window: "full", beat: "burden",
        why: "How many older adults each 100 working-age adults support.", read: "People aged 65+ per 100 of working age.", watch: "It rises slowly now and much faster later, which is the pension and care challenge ahead." },
      { indicator: "people.population.un.total", chart: "scenarioSpread", title: "Population scenarios to 2030", size: "feature", window: "projection", beat: "projection",
        why: "How much the near future depends on fertility assumptions.", read: "Each bar is the 2030 total under a different fertility path.", watch: "Near-term scenarios sit close together; they only diverge sharply much later in the century." }
    ]
  },
  {
    id: "q.people.growth",
    question: "Is India's population still growing?",
    priority: "core",
    indicators: ["people.population.un.change_rate"],
    core: ["people.population.un.change_rate"],
    context: ["people.population.total", "people.population.growth", "people.fertility", "people.population.un.total", "people.srs.tfr", "people.srs.tfr_rural", "people.srs.tfr_urban"],
    // Curated set: the answer is "yes, but slowing". Headcount still rising (hero),
    // the growth rate falling toward zero, the fertility driver now below replacement
    // (World Bank long arc + SRS 2024 rural/urban detail), then near-term projections.
    visualPlan: [
      { indicator: "people.population.total", chart: "line", title: "India's population, 1960 to today", size: "hero", window: "full", beat: "level",
        why: "The headline answer: the total is still climbing.", read: "Each point is the number of people alive that year. The line still rises, but it bends flatter as growth slows.", watch: "A flattening line is not a falling one — India keeps adding people even as the yearly pace eases." },
      { indicator: "people.population.un.change_rate", chart: "line", title: "Annual population growth rate", size: "small", window: "full", beat: "rate",
        why: "How fast the population is still rising each year.", read: "The percentage added each year, falling steadily toward zero.", watch: "Still positive, so the total keeps growing — but the trend points to an eventual peak." },
      { indicator: "people.fertility", chart: "line", title: "Births per woman, 1960 to today", size: "small", window: "full", beat: "driver",
        why: "The long arc of the force behind the slowdown.", read: "The average number of children a woman has over her life, falling for six decades.", watch: "Below about 2.1 — the replacement line — each generation is smaller, but built-in momentum keeps the total growing for years." },
      { chart: "multiLine", title: "Fertility has dropped below replacement", size: "feature", beat: "below-replacement", unit: "births per woman", subtitle: "SRS 2024 · total fertility rate · 2019–2024",
        series: [
          { indicator: "people.srs.tfr", label: "All India" },
          { indicator: "people.srs.tfr_rural", label: "Rural" },
          { indicator: "people.srs.tfr_urban", label: "Urban" }
        ],
        indicator: "people.srs.tfr",
        why: "India's own latest count: fertility is now below the 2.1 replacement level, and has been since 2020.", read: "Three lines — all-India, rural and urban. Rural women still average about 2.1; urban women just 1.5.", watch: "Below replacement does not mean shrinking yet: the large young generation still has children, so the population grows by momentum." },
      { indicator: "people.population.un.total", chart: "scenarioSpread", title: "Population scenarios to 2030", size: "feature", window: "projection", beat: "projection",
        why: "How much the near future hinges on fertility.", read: "Each bar is the 2030 total under a different fertility path.", watch: "Near-term scenarios sit close together; they only diverge sharply later in the century, around the eventual peak." }
    ]
  },
  {
    id: "q.people.age",
    question: "How old is India?",
    priority: "core",
    indicators: ["people.population.un.median_age"],
    core: ["people.population.un.median_age"],
    context: [
      "people.population.un.age_sex_5y",
      "people.age_0_14_share",
      "people.age_15_64_share",
      "people.age_65_plus_share",
      "people.population.un.old_age_dependency",
      "people.population.un.child_dependency",
      "people.population.un.life_expectancy",
      "health.who.life_expectancy_age_60"
    ],
    // Curated set (docs/CHART_SELECTION_PHILOSOPHY.md). Leads with median age (the
    // answer to "how old"), then the shape, the shift over time, and what is driving
    // the ageing. Feature charts span full width; simpler lines are short-and-wide.
    visualPlan: [
      { indicator: "people.population.un.median_age", chart: "line", title: "India's median age, 2000 to 2030", size: "hero", window: "full", beat: "level",
        why: "The single clearest number for how old the country is.", read: "The age that splits the population into two equal halves, rising year on year.", watch: "A rising median does not mean India is old yet; it is still young by world standards, just ageing." },
      { indicator: "people.population.un.age_sex_5y", chart: "pyramid", title: "Age pyramid, 2025", size: "feature", window: "latest", beat: "distribution",
        why: "The full age-and-sex shape behind a single median number.", read: "Each bar is a five-year cohort, men left, women right. A wide base is children, a bulge in the middle is working-age.", watch: "The median can stay low while the shape shifts, so read the bands, not just the midpoint." },
      { chart: "multiLine", title: "How India's age mix has shifted", size: "feature", beat: "composition-over-time", unit: "% of population", subtitle: "World Bank · share of population · 1960 to today",
        series: [
          { indicator: "people.age_0_14_share", label: "Children (0–14)" },
          { indicator: "people.age_15_64_share", label: "Working age (15–64)" },
          { indicator: "people.age_65_plus_share", label: "Older (65+)" }
        ],
        indicator: "people.age_15_64_share",
        why: "Ageing is really three shares moving at once.", read: "The child share falling, the working-age share rising, the older share creeping up.", watch: "The working-age bulge is temporary; as it ages, the older line will rise much faster." },
      { indicator: "people.population.un.age_sex_5y", chart: "ageStructure", title: "Age structure today", size: "small", window: "latest", beat: "composition",
        why: "The population split into life stages right now.", read: "Each bar is that age group's share of everyone alive today.", watch: "Shares add to 100%, so a bigger older share has to mean a smaller younger one." },
      { indicator: "people.population.un.old_age_dependency", chart: "dependencyLine", title: "Old-age dependency ratio", size: "small", window: "full", beat: "burden",
        why: "How many older adults each 100 working-age adults support.", read: "People aged 65+ per 100 of working age.", watch: "It rises slowly now and far faster later, which is the real ageing pressure." },
      { indicator: "people.population.un.child_dependency", chart: "dependencyLine", title: "Child dependency ratio", size: "small", window: "full", beat: "burden",
        why: "The youth side of the dependency picture.", read: "Children under 15 per 100 working-age adults, falling as fertility drops.", watch: "A falling child ratio is what opens the dividend window, before the old-age ratio closes it." },
      { indicator: "people.population.un.life_expectancy", chart: "line", title: "Life expectancy at birth", size: "small", window: "full", beat: "driver",
        why: "Longer lives are half of why a population ages.", read: "The years a newborn can expect to live, by sex.", watch: "Rising life expectancy adds people at the top of the pyramid, pushing the median up." },
      { indicator: "health.who.life_expectancy_age_60", chart: "line", title: "Life expectancy at 60", size: "small", window: "full", beat: "longevity",
        why: "How many more years someone who reaches 60 can expect.", read: "Extra years remaining at age 60, a direct read on time spent in old age.", watch: "This is what turns a rising older share into a real pension and care challenge." }
    ]
  },
  {
    id: "q.people.pyramid",
    question: "What does India's population pyramid look like?",
    priority: "core",
    indicators: ["people.population.un.age_sex_5y", "people.population.un.broad_age_share", "people.population.un.total_dependency", "people.population.un.median_age"],
    core: ["people.population.un.age_sex_5y", "people.population.un.broad_age_share", "people.population.un.total_dependency", "people.population.un.median_age"],
    context: ["people.population.un.child_dependency", "people.population.un.old_age_dependency"]
  },
  {
    id: "q.people.old_before_rich",
    question: "Is India getting old before it gets rich?",
    priority: "core",
    indicators: ["people.population.un.old_age_dependency", "econ.gdp.per_capita_current_usd"],
    core: ["people.population.un.old_age_dependency", "econ.gdp.per_capita_current_usd"],
    context: ["people.population.un.median_age", "people.population.un.broad_age_share", "people.age_65_plus_share", "people.srs.tfr", "people.srs.tfr_rural", "people.srs.tfr_urban"],
    // Curated set: ageing is locked in by below-replacement fertility (SRS 2024) and
    // rising longevity, while income per head is still low — the "old before rich"
    // squeeze. Older share rising (hero), the dependency burden, the income level,
    // the median age, then the fertility engine underneath it all.
    visualPlan: [
      { indicator: "people.age_65_plus_share", chart: "line", title: "Share of Indians aged 65 and over", size: "hero", window: "full", beat: "level",
        why: "The clearest sign of ageing: the older share is climbing.", read: "The percentage of the population aged 65+, rising year on year.", watch: "Still low today, but the slope steepens from here as big working-age cohorts grow old." },
      { indicator: "people.population.un.old_age_dependency", chart: "dependencyLine", title: "Old-age dependency ratio", size: "small", window: "full", beat: "burden",
        why: "How many older adults each 100 working-age adults must support.", read: "People aged 65+ per 100 of working age, edging up.", watch: "It rises slowly now and far faster later — the pension and care pressure is mostly still ahead." },
      { indicator: "econ.gdp.per_capita_current_usd", chart: "line", title: "Income per person", size: "small", window: "full", beat: "wealth",
        why: "The 'rich' half of the question — how wealthy India is as it ages.", read: "GDP per head in current US dollars.", watch: "Rich countries aged at $20,000–40,000 per head; India is ageing at a small fraction of that." },
      { indicator: "people.population.un.median_age", chart: "line", title: "Median age", size: "small", window: "full", beat: "level",
        why: "The single number for how old the country is.", read: "The age that splits the population into two equal halves, rising steadily.", watch: "Each year on the median is a year closer to the ageing wall, before incomes have caught up." },
      { chart: "multiLine", title: "The engine of ageing: fertility below replacement", size: "feature", beat: "driver", unit: "births per woman", subtitle: "SRS 2024 · total fertility rate · 2019–2024",
        series: [
          { indicator: "people.srs.tfr", label: "All India" },
          { indicator: "people.srs.tfr_rural", label: "Rural" },
          { indicator: "people.srs.tfr_urban", label: "Urban" }
        ],
        indicator: "people.srs.tfr",
        why: "Ageing is locked in years in advance by fertility — and India's is already below replacement.", read: "All-India fertility sits at 1.9, with urban women at just 1.5 and rural at about 2.1.", watch: "Once fertility falls below replacement, ageing is essentially baked in — the only question is how fast incomes rise to meet it." }
    ]
  },
  {
    id: "q.people.population",
    slug: "population-of-india",
    question: "How many Indians are there, and where is the population heading?",
    priority: "core",
    indicators: ["people.population.total", "people.fertility", "people.projections.un_median"],
    core: ["people.population.total", "people.fertility", "people.projections.un_median"],
    context: [
      "compare.population.in", "compare.population.chn", "compare.population.wld", "world.share.population",
      "people.population.un.change_rate", "people.srs.birth_rate", "people.srs.birth_rate_rural", "people.srs.birth_rate_urban",
      "people.srs.tfr", "people.srs.tfr_rural", "people.srs.tfr_urban",
      "people.nfhs.tfr_by_state", "people.nfhs.tfr_state_ranked", "people.srs.asfr", "people.srs.birth_order",
      "people.nfhs.contraception_modern", "people.nfhs.sterilization_female", "people.nfhs.sterilization_male", "people.nfhs.unmet_need",
      "people.nfhs.teen_mothers", "people.nfhs.child_marriage",
      "people.population.un.mean_age_childbearing", "people.nfhs5.tfr_by_education", "people.nfhs5.tfr_by_wealth", "people.nfhs5.tfr_by_religion",
      "people.srs.sex_ratio_at_birth", "people.srs.sex_ratio_at_birth_rural", "people.srs.sex_ratio_at_birth_urban",
      "society.urban_population_share",
      "people.population.un.age_sex_5y", "people.age_0_14_share", "people.age_15_64_share", "people.age_65_plus_share",
      "people.population.un.median_age", "people.population.un.old_age_dependency", "health.life_expectancy",
      "econ.gdp.per_capita_current_usd", "people.population.un.total", "people.projections.ihme_reference"
    ],
    // CANONICAL population flagship: absorbs total + growth + age + pyramid +
    // old_before_rich. Seven acts: how many -> still growing -> fertility ->
    // ageing -> old before rich -> where headed (peak to 2100, models disagree) ->
    // the census caveat. Blends World Bank (long arc), UN WPP 2024 (to 2100), SRS
    // 2024 (current, rural/urban), NFHS-6 (state map + contraception) and IHME.
    visualPlan: [
      { indicator: "people.population.total", chart: "line", title: "India's population, 1960 to today", size: "hero", window: "full", beat: "level",
        why: "The headline count, and the shape of how it got here.", read: "Each point is the number of people alive that year, climbing from about 44 crore in 1960 to over 145 crore now.", watch: "The line still rises but bends flatter: India keeps adding people even as the yearly pace eases." },
      { chart: "multiLine", title: "India, China and the world", size: "feature", beat: "comparison", unit: "people", subtitle: "World Bank · total population · 1990 to today",
        series: [ { indicator: "compare.population.in", label: "India" }, { indicator: "compare.population.chn", label: "China" }, { indicator: "compare.population.wld", label: "World" } ],
        indicator: "compare.population.in",
        why: "India is now the most populous country on earth, having passed China.", read: "Three lines: India rising past a flattening China, against the world total.", watch: "India and China are each about a sixth of humanity; the crossover happened around 2023." },
      { indicator: "world.share.population", chart: "line", title: "India's share of world population", size: "small", window: "full", beat: "share",
        why: "How much of humanity is Indian.", read: "India's people as a percentage of everyone alive.", watch: "The share is near its peak; as growth slows it will plateau and slowly fall." },
      { indicator: "society.urban_population_share", chart: "line", title: "Where Indians live: the slow shift to cities", size: "feature", window: "full", beat: "place",
        why: "Population is also about where people live, and India is urbanising slowly.", read: "The share of Indians living in towns and cities, rising gradually from about a sixth in 1960.", watch: "India is still mostly rural, but cities grow faster, and urban fertility is far lower than rural." },
      { indicator: "people.population.un.change_rate", chart: "line", title: "Annual population growth rate, to 2100", size: "feature", window: "full", beat: "rate",
        why: "How fast the population changes each year, and when that reaches zero.", read: "The percent added each year, falling from over 2% toward zero and then below it later this century.", watch: "While the rate is positive the total still grows; the moment it crosses zero is the peak." },
      { chart: "multiLine", title: "Births per 1,000 people", size: "small", beat: "births", unit: "per 1,000 population", subtitle: "SRS 2024 · crude birth rate · 2019 to 2024",
        series: [ { indicator: "people.srs.birth_rate", label: "All India" }, { indicator: "people.srs.birth_rate_rural", label: "Rural" }, { indicator: "people.srs.birth_rate_urban", label: "Urban" } ],
        indicator: "people.srs.birth_rate",
        why: "The flow of new births, India's own latest count.", read: "Births per 1,000 people a year, higher in villages than cities.", watch: "Falling birth rates are the engine of the slowdown, but a young population keeps total births high." },
      { indicator: "people.fertility", chart: "line", title: "Births per woman, 1960 to today", size: "feature", window: "full", beat: "driver",
        why: "The long arc of fertility, the force behind everything else on this page.", read: "The average children per woman, falling from nearly six in 1960 to about two now.", watch: "Below about 2.1, the replacement line, each generation is smaller, but momentum keeps the total rising for years." },
      { chart: "multiLine", title: "Fertility is now below replacement", size: "feature", beat: "below-replacement", unit: "births per woman", subtitle: "SRS 2024 · total fertility rate · 2019 to 2024",
        series: [ { indicator: "people.srs.tfr", label: "All India" }, { indicator: "people.srs.tfr_rural", label: "Rural" }, { indicator: "people.srs.tfr_urban", label: "Urban" } ],
        indicator: "people.srs.tfr",
        why: "India's own current reading: national fertility is below the 2.1 replacement level.", read: "All-India at 1.9, rural about 2.1, urban just 1.5.", watch: "Below replacement is not shrinking yet: the large young generation still has children." },
      { chart: "multiLine", title: "India's fertility in a global context", size: "feature", beat: "global-comparison", unit: "births per woman", subtitle: "World Bank · total fertility rate · 1960 to today", window: "full", refLine: { value: 2.1, label: "replacement" },
        series: [
          { indicator: "divergence.fertility.in", label: "India", color: "#b3245a", emphasis: true },
          { indicator: "divergence.fertility.bgd", label: "Bangladesh", color: "#e08a2b" },
          { indicator: "divergence.fertility.idn", label: "Indonesia", color: "#e08a2b" },
          { indicator: "divergence.fertility.vnm", label: "Vietnam", color: "#e08a2b" },
          { indicator: "divergence.fertility.chn", label: "China", color: "#2a8597" },
          { indicator: "divergence.fertility.jpn", label: "Japan", color: "#2a8597" },
          { indicator: "divergence.fertility.kor", label: "South Korea", color: "#2a8597" },
          { indicator: "divergence.fertility.usa", label: "United States", color: "#3f7d4f" },
          { indicator: "divergence.fertility.gbr", label: "United Kingdom", color: "#3f7d4f" },
          { indicator: "divergence.fertility.deu", label: "Germany", color: "#3f7d4f" },
          { indicator: "divergence.fertility.wld", label: "World", color: "#8a8597", dash: true }
        ],
        indicator: "divergence.fertility.in",
        why: "India's fall is not unique: it has joined the low-fertility world, but sits above every advanced economy and far above East Asia's ultra-low rates.", read: "Each line is a country's births per woman since 1960; India is highlighted, with South Asia in amber, East Asia in teal and the advanced West in green.", watch: "India reached low fertility at a fraction of the income the West or East Asia had when they got there, and unlike Korea or China it has levelled near replacement rather than crashing below it." },
      { indicator: "people.nfhs.tfr_by_state", chart: "choropleth", title: "Fertility by state", size: "feature", window: "latest", beat: "geography", rankLabel: "Highest", bottomLabel: "Lowest", divergeAt: 2.1, pivotLabel: "replacement",
        why: "Fertility is not one number; it is a north-south map.", read: "Each state shaded by its fertility rate, from about 0.9 in some islands to 2.7 in Bihar.", watch: "The south and west are well below replacement; a band of northern states is still above it." },
      { indicator: "people.nfhs.tfr_state_ranked", chart: "tableBars", title: "Highest and lowest fertility states", size: "feature", beat: "ranking", unit: "births per woman", subtitle: "NFHS-6 (2023-24) · top 5 and bottom 5 of 33 surveyed states/UTs",
        why: "The map, sharpened into a league table.", read: "The five highest-fertility states set against the five lowest.", watch: "Even the highest, Bihar at 2.7, is far below India's past; the lowest sit deep under replacement." },
      { indicator: "people.srs.asfr", chart: "tableBars", title: "At what age Indian women have children", size: "feature", beat: "timing", unit: "births per 1,000 women", subtitle: "SRS 2024 · age-specific fertility rate",
        why: "Fertility is not just how many, but when.", read: "Births per 1,000 women in each age band, peaking sharply at 25-29.", watch: "Childbearing is concentrated in the twenties; teenage and over-40 births are now rare." },
      { indicator: "people.population.un.mean_age_childbearing", chart: "line", title: "Women are having children later", size: "small", window: "full", beat: "delay",
        why: "Are women delaying childbirth? The trend says yes.", read: "The average age at which women have their children, rising steadily since 2000.", watch: "Later childbearing both reflects more schooling and work and itself nudges fertility down." },
      { chart: "latestBars", title: "How India avoids pregnancy, and who carries it", size: "feature", beat: "mechanism", unit: "% of married women 15-49", subtitle: "NFHS-6 (2023-24)",
        series: [ { indicator: "people.nfhs.contraception_any", label: "Any method" }, { indicator: "people.nfhs.contraception_modern", label: "Any modern method" }, { indicator: "people.nfhs.sterilization_female", label: "Female sterilisation" }, { indicator: "people.nfhs.sterilization_male", label: "Male sterilisation" }, { indicator: "people.nfhs.unmet_need", label: "Unmet need" } ],
        indicator: "people.nfhs.sterilization_female",
        why: "Falling fertility runs on contraception, and in India that burden is overwhelmingly female.", read: "Modern-method use against female versus male sterilisation, and the unmet need that remains.", watch: "Female sterilisation dwarfs male; the gap is one of the starkest in the world." },
      { indicator: "people.srs.birth_order", chart: "tableBars", title: "Families are getting smaller", size: "small", beat: "parity", unit: "% of live births", subtitle: "SRS 2024 · live births by birth order",
        why: "Smaller families are the texture of below-replacement fertility.", read: "Nearly nine in ten births are now a first or second child.", watch: "Third and higher-order births have shrunk to a small minority." },
      { chart: "latestBars", title: "Marrying and giving birth young", size: "small", beat: "early-childbearing", unit: "%", subtitle: "NFHS-6 (2023-24)",
        series: [ { indicator: "people.nfhs.child_marriage", label: "Married before 18 (women 20-24)" }, { indicator: "people.nfhs.teen_mothers", label: "Already mothers or pregnant (women 15-19)" } ],
        indicator: "people.nfhs.child_marriage",
        why: "Early marriage and teenage motherhood still shape fertility at the margins.", read: "The share of young women married before 18, and of teenagers already mothers or pregnant.", watch: "Both have fallen but remain high in poorer, rural states." },
      { indicator: "people.nfhs5.tfr_by_education", chart: "tableBars", title: "Fertility falls with schooling", size: "small", beat: "education", unit: "births per woman", subtitle: "NFHS-5 (2019-21) · TFR by years of schooling",
        why: "Education is the strongest single lever on fertility.", read: "Women with no schooling average 2.8 children; those with 12 or more years, 1.8.", watch: "This is NFHS-5 (2019-21), the latest year this cut exists; the gap has been narrowing as schooling spreads." },
      { indicator: "people.nfhs5.tfr_by_wealth", chart: "tableBars", title: "Fertility falls with wealth", size: "small", beat: "wealth", unit: "births per woman", subtitle: "NFHS-5 (2019-21) · TFR by wealth quintile",
        why: "Fertility is also a class story.", read: "The poorest fifth average 2.6 children; the richest fifth, 1.6.", watch: "Wealth and schooling overlap heavily; both track the same underlying shift, not two separate causes." },
      { indicator: "people.nfhs5.tfr_by_religion", chart: "tableBars", title: "Fertility by religion", size: "small", beat: "religion", unit: "births per woman", subtitle: "NFHS-5 (2019-21) · TFR by religion",
        why: "The most misread fertility number in India, shown plainly.", read: "Muslim fertility is highest at 2.4 and Buddhist/Jain lowest near 1.4-1.6; Hindu is 1.9.", watch: "Every group's fertility has fallen sharply and is converging; the Muslim rate fell fastest, so the gaps are narrowing, not widening." },
      { chart: "multiLine", title: "Boys per girl at birth: the son-preference signal", size: "feature", beat: "sex-ratio", unit: "females per 1,000 males", subtitle: "SRS · sex ratio at birth · 3-year averages",
        series: [ { indicator: "people.srs.sex_ratio_at_birth", label: "All India" }, { indicator: "people.srs.sex_ratio_at_birth_rural", label: "Rural" }, { indicator: "people.srs.sex_ratio_at_birth_urban", label: "Urban" } ],
        indicator: "people.srs.sex_ratio_at_birth",
        why: "Fewer children combined with a preference for sons shows up as too few girls born.", read: "Girls born per 1,000 boys; India sits below the natural balance, so girls are missing at birth.", watch: "The ratio has improved recently and is now higher in towns than villages." },
      { indicator: "people.population.un.age_sex_5y", chart: "pyramid", title: "India's age pyramid today", size: "feature", window: "latest", beat: "distribution",
        why: "Who those people are, by age and sex.", read: "Each bar is a five-year cohort, men left, women right; a wide base is children, the bulge is working age.", watch: "The base is narrowing as fertility falls, which is what will age the country." },
      { chart: "multiLine", title: "The age mix is shifting", size: "feature", beat: "composition-over-time", unit: "% of population", subtitle: "World Bank · share of population · 1960 to today",
        series: [ { indicator: "people.age_0_14_share", label: "Children (0-14)" }, { indicator: "people.age_15_64_share", label: "Working age (15-64)" }, { indicator: "people.age_65_plus_share", label: "Older (65+)" } ],
        indicator: "people.age_15_64_share",
        why: "Ageing is three shares moving at once.", read: "The child share falling, working-age rising, older creeping up.", watch: "The working-age bulge is the dividend; it is temporary." },
      { indicator: "people.population.un.median_age", chart: "line", title: "Median age, to 2100", size: "small", window: "full", beat: "level",
        why: "The single number for how old the country is.", read: "The age that splits the population in half, rising steadily through the century.", watch: "Still young today, but the rise does not stop." },
      { indicator: "people.population.un.old_age_dependency", chart: "dependencyLine", title: "Old-age dependency ratio", size: "small", window: "full", beat: "burden",
        why: "How many older adults each 100 working-age adults support.", read: "People 65+ per 100 of working age, edging up now.", watch: "It rises slowly now and far faster later, the pension and care challenge ahead." },
      { indicator: "health.life_expectancy", chart: "line", title: "Indians are living longer", size: "small", window: "full", beat: "longevity",
        why: "The other engine of ageing: longer lives, not just fewer births.", read: "Life expectancy at birth, up by decades since 1960.", watch: "Longer lives add people at the top of the age pyramid, accelerating the greying." },
      { indicator: "people.age_65_plus_share", chart: "line", title: "Share of Indians aged 65 and over", size: "small", window: "full", beat: "ageing",
        why: "The clearest sign of ageing.", read: "The percent of people aged 65+, more than doubling since 1960.", watch: "Still low, but the slope steepens from here." },
      { indicator: "econ.gdp.per_capita_current_usd", chart: "line", title: "Income per person as India ages", size: "feature", window: "full", beat: "wealth",
        why: "The 'old before rich' question: how wealthy India is as it greys.", read: "GDP per head in current US dollars, about 2,700 today.", watch: "Rich countries aged at 20,000 to 40,000 dollars a head; India is ageing at a fraction of that." },
      { indicator: "people.projections.un_median", chart: "line", title: "India's population to 2100: the peak", size: "hero", window: "full", beat: "projection",
        why: "The payoff: when India stops growing and starts to shrink.", read: "The UN median path rising to a peak around 2061 near 1.70 billion, then declining to about 1.51 billion by 2100.", watch: "This is the median; the exact peak depends on how fast fertility keeps falling." },
      { indicator: "people.population.un.total", chart: "scenarioSpread", title: "How high, how soon? Scenarios to 2100", size: "feature", window: "projection", beat: "uncertainty",
        why: "How much the future hinges on fertility.", read: "Each band is the population under a different fertility path by 2100.", watch: "Near-term paths sit close; they fan out sharply later, which is where the real uncertainty lives." },
      { chart: "multiLine", title: "The models disagree on the peak", size: "feature", beat: "models", unit: "people", subtitle: "UN WPP 2024 vs IHME (Vollset 2020)",
        series: [ { indicator: "people.projections.un_median", label: "UN (median)" }, { indicator: "people.projections.ihme_reference", label: "IHME (reference)" } ],
        indicator: "people.projections.un_median",
        why: "How confident can we be about the peak? Compare the two most-cited models.", read: "The UN peaks about 2061 near 1.70 billion and eases to 1.51 billion; IHME peaks earlier, around 2048, and falls much further, to about 1.09 billion by 2100.", watch: "IHME assumes faster fertility decline, so it is the low outlier; the US Census and Wittgenstein models sit closer to the UN." }
    ]
  },
  {
    id: "q.econ.size",
    question: "How big is India's economy?",
    priority: "core",
    // Rebuilt Jun 2026 on MOSPI National Accounts (econ.nas.*, the source of
    // truth) + a World Bank world-lens for the market-vs-PPP ranking. Retires the
    // old single-source IndiaDataHub spine (econ.idh.*, still used by sibling
    // pages q.econ.growth / q.econ.per_person).
    indicators: [
      "econ.nas.gdp_nominal", "econ.nas.gdp_real",
      "econ.world.gdp_market_usd", "econ.world.gdp_ppp_intl",
      "econ.world.cmp.gdp_total.in", "econ.world.cmp.gdp_total.chn", "econ.world.cmp.gdp_total.jpn", "econ.world.cmp.gdp_total.deu", "econ.world.cmp.gdp_total.gbr",
      "econ.world.cmp.gdp_pc.in", "econ.world.cmp.gdp_pc.chn", "econ.world.cmp.gdp_pc.kor", "econ.world.cmp.gdp_pc.bgd", "econ.world.cmp.gdp_pc.idn", "econ.world.cmp.gdp_pc.vnm",
      "econ.nas.per_capita_gdp_nominal",
      "econ.nas.gva_agriculture_share", "econ.nas.gva_industry_share", "econ.nas.gva_services_share", "econ.nas.gva_manufacturing_share",
      "econ.nas.pfce_share_gdp", "econ.nas.gfcf_share_gdp", "econ.nas.gfce_share_gdp", "econ.nas.net_exports_share_gdp",
      "econ.nas.gni_nominal",
      "econ.nas.saving_households_share_gdp", "econ.nas.saving_private_corp_share_gdp", "econ.nas.saving_public_share_gdp",
      "econ.nas.gdp_growth_real"
    ],
    core: [
      "econ.nas.gdp_nominal", "econ.nas.gdp_real",
      "econ.world.gdp_market_usd", "econ.world.gdp_ppp_intl",
      "econ.world.cmp.gdp_total.in", "econ.world.cmp.gdp_total.chn", "econ.world.cmp.gdp_total.jpn", "econ.world.cmp.gdp_total.deu", "econ.world.cmp.gdp_total.gbr",
      "econ.world.cmp.gdp_pc.in", "econ.world.cmp.gdp_pc.chn", "econ.world.cmp.gdp_pc.kor", "econ.world.cmp.gdp_pc.bgd", "econ.world.cmp.gdp_pc.idn", "econ.world.cmp.gdp_pc.vnm",
      "econ.nas.per_capita_gdp_nominal",
      "econ.nas.gva_agriculture_share", "econ.nas.gva_industry_share", "econ.nas.gva_services_share", "econ.nas.gva_manufacturing_share",
      "econ.nas.pfce_share_gdp", "econ.nas.gfcf_share_gdp", "econ.nas.gfce_share_gdp", "econ.nas.net_exports_share_gdp",
      "econ.nas.gni_nominal",
      "econ.nas.saving_households_share_gdp", "econ.nas.saving_private_corp_share_gdp", "econ.nas.saving_public_share_gdp",
      "econ.nas.gdp_growth_real"
    ],
    // Locked to the national-accounts set + world-lens; no tax/debt/inflation leak.
    context: [
      "econ.nas.gdp_nominal_quarterly", "econ.nas.gdp_real_quarterly", "econ.nas.per_capita_gdp_real",
      "econ.nas.gva_total_nominal", "econ.nas.gva_agriculture_nominal", "econ.nas.gva_industry_nominal", "econ.nas.gva_services_nominal", "econ.nas.gva_manufacturing_nominal",
      "econ.nas.pfce_nominal", "econ.nas.gfcf_nominal", "econ.nas.gfce_nominal", "econ.nas.gcf_nominal",
      "econ.nas.exports_nominal", "econ.nas.imports_nominal", "econ.nas.net_exports_nominal", "econ.nas.exports_share_gdp", "econ.nas.imports_share_gdp",
      "econ.nas.gni_real", "econ.nas.gndi_nominal", "econ.nas.ndp_nominal", "econ.nas.cfc_nominal", "econ.nas.net_taxes_products_nominal", "econ.nas.income_paid_abroad_nominal",
      "econ.nas.saving_rate_gdp", "econ.nas.gross_saving_nominal", "econ.nas.gdp_growth_nominal", "econ.nas.gva_growth_real"
    ],
    visualPlan: [
      { indicator: "econ.nas.gdp_nominal", chart: "line", title: "India's economy, 1950-51 to today", size: "hero", window: "full", beat: "scale",
        why: "The headline answer: the total rupee size of everything India produces in a year.", read: "Each point is nominal GDP — output valued at that year's prices — climbing from about ₹10,000 crore in 1950-51 to ₹357 lakh crore now.", watch: "This is current-price rupees, so part of the steep rise is just inflation, not extra output. The next chart strips that out." },
      { chart: "multiLine", title: "Nominal vs real: how much is just prices?", size: "feature", beat: "real-vs-nominal", unit: "rupees", subtitle: "MOSPI · GDP at current prices vs at constant 2011-12 prices",
        series: [ { indicator: "econ.nas.gdp_nominal", label: "Nominal (current prices)" }, { indicator: "econ.nas.gdp_real", label: "Real (2011-12 prices)" } ],
        indicator: "econ.nas.gdp_real",
        why: "The single most misread thing about GDP: most of the headline number's growth is inflation.", read: "Nominal GDP (₹357 lakh crore) counts today's prices; real GDP (₹202 lakh crore) measures actual output at fixed 2011-12 prices. The widening gap is accumulated inflation.", watch: "When people say 'the economy grew 7%', they mean the real line. The nominal line always grows faster because prices keep rising." },
      { indicator: "econ.nas.per_capita_gdp_nominal", chart: "line", title: "GDP per person", size: "feature", window: "full", beat: "per-person",
        why: "Divide the economy by 1.4 billion people and the picture changes completely.", read: "GDP split evenly across everyone: about ₹404 a year in the 1960s, about ₹2.5 lakh now. A big rise, but it is an arithmetic average.", watch: "This is not a salary or a typical income. A small number of high earners pull the average well above what most Indians actually make. In US dollars this same figure is about $2,700, the number the next world comparison uses." },
      { chart: "multiLine", title: "How big, compared with the world", size: "feature", beat: "world-rank", unit: "trillion $", subtitle: "IMF World Economic Outlook · India's GDP at market exchange rates vs at purchasing-power parity",
        series: [ { indicator: "econ.world.gdp_market_usd", label: "At market exchange rate (US$)" }, { indicator: "econ.world.gdp_ppp_intl", label: "At purchasing-power parity (int'l $)" } ],
        indicator: "econ.world.gdp_market_usd",
        why: "Whether India is the 5th or the 3rd largest economy depends entirely on which ruler you use.", read: "Two measures of the same economy: about $3.9 trillion at the market exchange rate in 2025, but about $17 trillion once you adjust for how much cheaper things are in India.", watch: "PPP is bigger because a haircut or a meal costs far less in rupees than in dollars. By market rates India is around 5th in the world; by PPP it is 3rd, behind only China and the US." },
      { chart: "multiLine", title: "Where India sits among the big economies", size: "feature", beat: "world-size-rank", unit: "trillion $", subtitle: "IMF World Economic Outlook · GDP at market exchange rates, 1980 to 2025",
        series: [ { indicator: "econ.world.cmp.gdp_total.chn", label: "China" }, { indicator: "econ.world.cmp.gdp_total.deu", label: "Germany" }, { indicator: "econ.world.cmp.gdp_total.jpn", label: "Japan" }, { indicator: "econ.world.cmp.gdp_total.in", label: "India" }, { indicator: "econ.world.cmp.gdp_total.gbr", label: "UK" } ],
        indicator: "econ.world.cmp.gdp_total.in",
        why: "Size made concrete: the economies India has caught and is jostling with.", read: "India is about $3.9 trillion in 2025, around the fifth-largest economy in the world, neck and neck with the UK and behind Germany and Japan. Only the US and China are far ahead.", watch: "These are market-exchange-rate dollars, so a weaker rupee or a stronger pound flips the India-UK ranking from year to year. China pulled away decades ago; India is climbing the next rung." },
      { chart: "multiLine", title: "Big economy, small incomes", size: "feature", beat: "per-person-global", unit: "$ per person", subtitle: "IMF World Economic Outlook · GDP per capita at market exchange rates, India vs Asian peers",
        series: [ { indicator: "econ.world.cmp.gdp_pc.kor", label: "South Korea" }, { indicator: "econ.world.cmp.gdp_pc.chn", label: "China" }, { indicator: "econ.world.cmp.gdp_pc.idn", label: "Indonesia" }, { indicator: "econ.world.cmp.gdp_pc.vnm", label: "Vietnam" }, { indicator: "econ.world.cmp.gdp_pc.in", label: "India" }, { indicator: "econ.world.cmp.gdp_pc.bgd", label: "Bangladesh" } ],
        indicator: "econ.world.cmp.gdp_pc.in",
        why: "The other half of the story: enormous in total, near the bottom per person.", read: "India's GDP per head was about $2,700 in 2025, barely above Bangladesh, roughly five times below China and more than ten times below South Korea.", watch: "This is the gap the 'fifth-largest economy' headline hides. India is rich as a country and poor as a people, because it divides a large output among a very large population." },
      { chart: "multiLine", title: "What India makes: from farms to services", size: "feature", beat: "production-structure", unit: "% of GVA", subtitle: "MOSPI · share of gross value added by sector",
        series: [ { indicator: "econ.nas.gva_agriculture_share", label: "Agriculture" }, { indicator: "econ.nas.gva_industry_share", label: "Industry" }, { indicator: "econ.nas.gva_services_share", label: "Services" } ],
        indicator: "econ.nas.gva_services_share",
        why: "The deepest change in the Indian economy since independence: what it produces.", read: "Three lines that cross over time. Agriculture fell from 53% of output in 1951 to 17%; services rose from 31% to 56%; industry sits in the middle.", watch: "Shares add to 100%, so a falling farm share is the mirror image of the rising services share. Most Indians still work on farms even as farming shrinks in the output mix." },
      { indicator: "econ.nas.gva_manufacturing_share", chart: "line", title: "The factories that never came", size: "small", window: "full", beat: "missing-factories",
        why: "India's most important economic gap: it grew rich in services while skipping the manufacturing stage East Asia built on.", read: "Manufacturing's share of output has barely moved in 75 years — about 12% in 1951, about 14% now.", watch: "This is why 'Make in India' exists. Unlike China or Korea, India never turned into a factory economy; it jumped from farms to services." },
      { chart: "multiLine", title: "Who spends: consumption, investment, trade", size: "feature", beat: "spending-structure", unit: "% of GDP", subtitle: "MOSPI · expenditure components as a share of GDP",
        series: [ { indicator: "econ.nas.pfce_share_gdp", label: "Private consumption" }, { indicator: "econ.nas.gfcf_share_gdp", label: "Investment (fixed)" }, { indicator: "econ.nas.gfce_share_gdp", label: "Government" }, { indicator: "econ.nas.net_exports_share_gdp", label: "Net exports" } ],
        indicator: "econ.nas.pfce_share_gdp",
        why: "The same GDP, seen as who spends the money rather than who produces it.", read: "Households dominate at about 61% of GDP; investment is about 30%; government about 10%; net exports are slightly negative because India imports more than it exports.", watch: "India is a consumption-led economy. The investment share is what economists watch most — it is the seed of future growth." },
      { chart: "multiLine", title: "How India opened up to the world", size: "feature", beat: "trade-openness", unit: "% of GDP", subtitle: "MOSPI · exports and imports of goods & services as a share of GDP",
        series: [ { indicator: "econ.nas.exports_share_gdp", label: "Exports" }, { indicator: "econ.nas.imports_share_gdp", label: "Imports" } ],
        indicator: "econ.nas.exports_share_gdp",
        why: "Behind the small net-exports number are two big, fast-growing flows, and the story of 1991.", read: "Both exports and imports were tiny, about 7% of GDP, through the closed decades up to 1991, then climbed steeply after liberalisation to roughly 21% and 24% of GDP today.", watch: "Trade roughly tripled as a share of the economy after India opened up. The two lines move together: India both sells to and buys from the world far more than it used to." },
      { chart: "multiLine", title: "Produced here, owned by whom, kept by whom", size: "feature", beat: "output-vs-income", unit: "rupees", subtitle: "MOSPI · GDP vs GNI vs GNDI",
        series: [ { indicator: "econ.nas.gdp_nominal", label: "GDP (output in India)" }, { indicator: "econ.nas.gni_nominal", label: "GNI (income to Indians)" }, { indicator: "econ.nas.gndi_nominal", label: "GNDI (after remittances)" } ],
        indicator: "econ.nas.gndi_nominal",
        why: "Three subtly different ways to size the economy, and the gap between them is a very Indian story.", read: "GNI sits just below GDP, by about ₹5.5 lakh crore, because India pays more income (profits, interest) to foreigners than it earns abroad. But GNDI climbs back above GDP, to about ₹362 lakh crore, because remittances from Indians working overseas more than fill the gap.", watch: "India's disposable income is larger than its output. Few big economies can say that: it is the remittance economy showing up in the national accounts." },
      { chart: "multiLine", title: "Who saves the money India invests", size: "feature", beat: "who-saves", unit: "% of GDP", subtitle: "MOSPI · gross saving by who does the saving",
        series: [ { indicator: "econ.nas.saving_households_share_gdp", label: "Households" }, { indicator: "econ.nas.saving_private_corp_share_gdp", label: "Private companies" }, { indicator: "econ.nas.saving_public_share_gdp", label: "Government & public sector" } ],
        indicator: "econ.nas.saving_households_share_gdp",
        why: "India saves about 30% of GDP — among the highest rates anywhere — and that saving is what funds investment.", read: "Households do most of the saving (about 59% of the total), far more than companies or the government.", watch: "Ordinary households, not corporations or the state, are the main financiers of India's growth — through bank deposits, gold, provident funds and property." },
      { indicator: "econ.nas.gdp_growth_real", chart: "line", title: "How fast it grows, year to year", size: "small", window: "full", beat: "growth-volatility",
        why: "The size is one thing; the speed is what makes headlines.", read: "Annual real GDP growth: usually 5-8%, with a sharp COVID contraction of about -5.8% in 2020-21 and a strong rebound after.", watch: "India is among the fastest-growing large economies, but growth is volatile year to year. One bad year (a drought, a shock) can swing the line hard." }
    ]
  },
  {
    id: "q.econ.motorisation",
    slug: "india-vehicle-registrations-two-wheeler-boom",
    question: "What does India's vehicle boom really look like?",
    priority: "core",
    // Built Jun 2026. Sources: VAHAN registration dashboard tables (2003-Jun 2026),
    // MoSPI NAS GDP/per-capita GDP, MoSPI CPI fuel-item indexes, SIAM public
    // domestic-sales trend and FY 2025-26 press release, IndiaDataHub/RBI vehicle
    // loan stock, World Bank population, and Ember electricity data.
    indicators: ["auto.vahan.registrations.total_fy"],
    core: [
      "auto.vahan.registrations.total_monthly",
      "auto.vahan.registrations.total_fy",
      "auto.vahan.registrations.index_fy_2004_100",
      "auto.vahan.registrations.growth_fy",
      "auto.vahan.registrations.yoy_complete_monthly",
      "auto.vahan.registrations.per_1000_people",
      "auto.vahan.registrations.seasonality_recent",
      "auto.vahan.economy.nominal_gdp_index_fy_2004_100",
      "auto.vahan.economy.real_gdp_index_fy_2004_100",
      "auto.vahan.economy.real_pc_gdp_index_fy_2004_100",
      "auto.vahan.economy.real_gdp_growth_fy",
      "auto.vahan.economy.real_pc_gdp_growth_fy",
      "auto.vahan.economy.correlation_summary",
      "auto.vahan.vehicle.two_wheelers.share_fy",
      "auto.vahan.vehicle.cars_cabs.share_fy",
      "auto.vahan.vehicle.three_wheelers.share_fy",
      "auto.vahan.vehicle.tractors.share_fy",
      "auto.vahan.vehicle.goods.share_fy",
      "auto.vahan.vehicle.buses.share_fy",
      "auto.vahan.vehicle.class_additions_2003_2025",
      "auto.vahan.vehicle.e_rickshaw.registrations_fy",
      "auto.vahan.fuel.petrol_all.share_fy",
      "auto.vahan.fuel.diesel_all.share_fy",
      "auto.vahan.fuel.ev_battery.share_fy",
      "auto.vahan.fuel.cng_all.share_fy",
      "auto.vahan.ev_battery.registrations_fy",
      "auto.vahan.state.registration_gain_2003_2025",
      "auto.vahan.state.registrations_latest_2025",
      "auto.vahan.state.top5_share",
      "auto.fuel_price.petrol_cpi_index",
      "auto.fuel_price.diesel_cpi_index",
      "auto.transport_cpi.combined_transport",
      "auto.transport_cpi.rural_transport",
      "auto.transport_cpi.urban_transport",
      "auto.transport_cpi.combined_transport_inflation",
      "auto.transport_cpi.rural_transport_inflation",
      "auto.transport_cpi.urban_transport_inflation",
      "auto.vahan.transport_cpi.correlation_summary",
      "auto.credit.vehicle_loans_index_2019_100",
      "auto.vahan.registrations.index_2019_100_monthly",
      "auto.credit.vehicle_loans_yoy_monthly",
      "auto.vahan.registrations.yoy_credit_window_monthly",
      "auto.siam.domestic_sales.mix_fy_2026",
      "auto.ember.grid.renewables_share",
      "auto.ember.grid.wind_solar_share",
      "auto.ember.grid.carbon_intensity"
    ],
    context: [
      "econ.nas.gdp_real",
      "econ.nas.gdp_nominal",
      "econ.nas.per_capita_gdp_real",
      "econ.nas.per_capita_gdp_nominal",
      "prices.cpi.combined.transport_communication.index",
      "energy.ember.demand"
    ],
    visualPlan: [
      { indicator: "auto.vahan.registrations.total_monthly", chart: "line", title: "The motorisation curve starts in 2003", size: "hero", window: "full", beat: "scale",
        why: "The first answer is scale: registrations rose from a few lakh a month to multi-million festival-season months.", read: "Monthly VAHAN registrations from January 2003 to May 2026, all states and vehicle classes combined.", watch: "The raw scrape includes a partial June 2026 point through June 13; the chart drops it so the line does not show a fake collapse." },
      { indicator: "auto.vahan.registrations.total_fy", chart: "line", title: "Seven times more new vehicles a year", size: "feature", window: "full", beat: "fiscal-scale",
        why: "Fiscal years remove the monthly noise and line up with GDP and SIAM.", read: "VAHAN registrations rose from about 4.4 million in FY 2003-04 to about 30.8 million in FY 2025-26.", watch: "VAHAN is registrations, not production or wholesale sales. It records vehicles entering the road fleet, with dashboard coverage and classification caveats." },
      { chart: "multiLine", title: "Registrations outran real income, but not nominal India", size: "feature", beat: "income-link", unit: "index, FY 2003-04 = 100",
        series: [
          { indicator: "auto.vahan.registrations.index_fy_2004_100", label: "Registrations" },
          { indicator: "auto.vahan.economy.nominal_gdp_index_fy_2004_100", label: "Nominal GDP" },
          { indicator: "auto.vahan.economy.real_gdp_index_fy_2004_100", label: "Real GDP" },
          { indicator: "auto.vahan.economy.real_pc_gdp_index_fy_2004_100", label: "Real GDP/person" }
        ],
        why: "This is the careful GDP test: rising income explains the long climb, but the vehicle line has its own cycle.", read: "All series start at 100 in FY 2003-04. By FY 2025-26, VAHAN is about seven times its starting level, real GDP about four times, and real per-capita GDP about three times.", watch: "Nominal GDP includes inflation; real GDP removes it. Use the nominal line for spending capacity in rupees, the real lines for volume growth." },
      { chart: "multiLine", title: "The year-to-year link is weaker than the level chart", size: "small", beat: "growth-link", unit: "% year-on-year",
        series: [
          { indicator: "auto.vahan.registrations.growth_fy", label: "Registrations" },
          { indicator: "auto.vahan.economy.real_gdp_growth_fy", label: "Real GDP" },
          { indicator: "auto.vahan.economy.real_pc_gdp_growth_fy", label: "Real GDP/person" }
        ],
        why: "A rich-country story would be too simple. Vehicle buying is also credit, prices, supply, policy, and sentiment.", read: "Fiscal-year growth rates move together in big shocks, especially Covid, but not cleanly every year.", watch: "A correlation is not a cause. The Covid collapse and rebound mechanically dominate growth charts unless called out." },
      { indicator: "auto.vahan.registrations.yoy_complete_monthly", chart: "line", title: "The latest complete months were still growing", size: "small", window: "recent", beat: "monthly-yoy", fromYear: 2025,
        why: "This fixes the partial-month problem and gives the reader the recent momentum without the fake June cliff.", read: "January-May 2026 registrations were all above the same months in 2025, with growth strongest in February and March.", watch: "This is monthly year-on-year growth, not a seasonally adjusted series. Festival timing and base effects still matter." },
      { indicator: "auto.vahan.economy.correlation_summary", chart: "tableBars", title: "Correlation is high in levels, modest in growth", size: "small", beat: "correlation", unit: "correlation",
        why: "This directly answers the GDP question without overclaiming.", read: "Levels correlate strongly because both series trend upward over two decades; growth correlations are lower once Covid years are excluded.", watch: "Level correlations can flatter any two rising series. The growth rows are the more honest test of same-year movement." },
      { indicator: "auto.vahan.registrations.per_1000_people", chart: "line", title: "Motorisation rose even after population is counted", size: "small", window: "full", beat: "per-capita",
        why: "India did not merely add vehicles because it added people.", read: "New registrations per 1,000 people rose from about 3.8 in 2003 to about 18.8 in 2024.", watch: "This is new registrations per person, not vehicles owned per person. Scrappage and second-hand transfers are outside the measure." },
      { chart: "multiLine", title: "Still a two-wheeler country", size: "hero", beat: "vehicle-mix", unit: "% of registrations",
        series: [
          { indicator: "auto.vahan.vehicle.two_wheelers.share_fy", label: "Two-wheelers" },
          { indicator: "auto.vahan.vehicle.cars_cabs.share_fy", label: "Cars & cabs" },
          { indicator: "auto.vahan.vehicle.three_wheelers.share_fy", label: "Three-wheelers" },
          { indicator: "auto.vahan.vehicle.tractors.share_fy", label: "Tractors" },
          { indicator: "auto.vahan.vehicle.goods.share_fy", label: "Goods" },
          { indicator: "auto.vahan.vehicle.buses.share_fy", label: "Buses" }
        ],
        why: "The composition is the punchline: the road filled up, but mostly on two wheels.", read: "Two-wheelers remain around seven in ten registrations, cars and cabs are roughly one-sixth, while three-wheelers rose after the e-rickshaw wave.", watch: "These are registration classes grouped for readability. They do not measure kilometres travelled, seats, emissions, or household ownership." },
      { indicator: "auto.vahan.vehicle.class_additions_2003_2025", chart: "tableBars", title: "Two-wheelers added most of the new flow", size: "feature", beat: "vehicle-additions", unit: "additional annual registrations",
        why: "Shares can feel abstract. Absolute additions show what physically changed on the road.", read: "Between calendar 2003 and 2025, two-wheelers added about 18.1 million annual registrations, far more than cars and cabs.", watch: "This is the change in annual registrations, not the stock of vehicles on the road. E-rickshaws are separated from other three-wheelers for clarity." },
      { indicator: "auto.vahan.vehicle.e_rickshaw.registrations_fy", chart: "line", title: "E-rickshaws became their own mobility story", size: "small", window: "full", beat: "e-rickshaw",
        why: "The three-wheeler line hides one of the clearest new categories in the raw vehicle-class data.", read: "E-rickshaw registrations went from near zero in the early VAHAN years to more than half a million in FY 2025-26.", watch: "This is VAHAN's vehicle-class label, not a fuel-by-class cross-tab. It should not be added to the fuel EV count as if they were independent categories." },
      { chart: "multiLine", title: "Petrol still dominates, diesel fades, EVs arrive", size: "feature", beat: "fuel-mix", unit: "% of registrations",
        series: [
          { indicator: "auto.vahan.fuel.petrol_all.share_fy", label: "Petrol" },
          { indicator: "auto.vahan.fuel.diesel_all.share_fy", label: "Diesel" },
          { indicator: "auto.vahan.fuel.ev_battery.share_fy", label: "Battery EVs" },
          { indicator: "auto.vahan.fuel.cng_all.share_fy", label: "CNG" }
        ],
        why: "The fuel story is not an EV takeover yet. It is petrol dominance with a visible EV wedge and a diesel retreat.", read: "Battery EVs rose from near zero to about 8.25% of FY 2025-26 registrations; diesel fell to about a tenth.", watch: "EV share by registrations is not the same as EV share of the fleet or vehicle-kilometres. Two- and three-wheelers can move the share quickly." },
      { indicator: "auto.vahan.ev_battery.registrations_fy", chart: "line", title: "EVs went from footnote to millions", size: "small", window: "full", beat: "ev-scale",
        why: "A share can hide the absolute jump.", read: "Battery EV registrations crossed the million mark annually after 2022 and kept climbing into FY 2025-26.", watch: "VAHAN fuel categories changed over time; ELECTRIC(BOV) plus PURE EV is the best consistent read, but it is still a registration classification." },
      { indicator: "auto.vahan.state.registration_gain_2003_2025", chart: "tableBars", title: "Where the extra vehicles came from", size: "feature", beat: "state-geography", unit: "additional registrations",
        why: "Motorisation is national, but the additions are not evenly spread.", read: "Uttar Pradesh added the most annual registrations between 2003 and 2025; Maharashtra, Gujarat and Tamil Nadu also added large absolute markets.", watch: "This ranks absolute additions, so large states naturally dominate. It is not a per-capita or per-household comparison." },
      { indicator: "auto.vahan.state.top5_share", chart: "line", title: "The boom was not only a top-five-state story", size: "small", window: "full", beat: "state-concentration",
        why: "This checks whether growth concentrated only in a few large states.", read: "The five largest state markets were about half of registrations in 2003 and about 46% in 2025.", watch: "The top five can change over time. This is a concentration check, not a ranking of the same five states every year." },
      { indicator: "auto.vahan.registrations.seasonality_recent", chart: "monthDecadeLines", title: "The festival spike is real", size: "small", beat: "seasonality", unit: "registrations", decades: ["2019", "2020", "2023", "2024", "2025"],
        why: "Monthly data adds a behavioural rhythm that annual totals hide.", read: "Recent complete years show October-November spikes, with October 2025 the largest month in the series.", watch: "Festival timing moves between months. 2020 is included as the disruption year, not as a normal seasonal template." },
      { chart: "multiLine", title: "Transport inflation hit rural India harder", size: "small", beat: "transport-cpi", unit: "index, 2012 = 100",
        series: [
          { indicator: "auto.transport_cpi.combined_transport", label: "Combined" },
          { indicator: "auto.transport_cpi.rural_transport", label: "Rural" },
          { indicator: "auto.transport_cpi.urban_transport", label: "Urban" }
        ],
        why: "A vehicle is not only a purchase. It is a stream of fuel, repair, fare and communication costs.", read: "MoSPI's transport-and-communication CPI rose to 172 for India overall by December 2025, with the rural index higher than the urban index.", watch: "This is a broad CPI subgroup, not only private vehicle running cost. It includes transport services and communication items, so read it as household mobility-cost pressure." },
      { chart: "multiLine", title: "Petrol and diesel are only one part of that cost", size: "small", beat: "fuel-prices", unit: "index, 2012 = 100",
        series: [
          { indicator: "auto.fuel_price.petrol_cpi_index", label: "Petrol" },
          { indicator: "auto.fuel_price.diesel_cpi_index", label: "Diesel" }
        ],
        why: "The cost of using a vehicle matters after the purchase.", read: "MoSPI CPI item indexes show diesel rising faster than petrol since the 2012 base.", watch: "These are consumer price indexes, not pump prices in rupees per litre, and state taxes differ." },
      { indicator: "auto.vahan.transport_cpi.correlation_summary", chart: "tableBars", title: "Transport CPI is not a simple demand brake", size: "small", beat: "transport-correlation", unit: "correlation",
        why: "This checks whether the price story actually lines up with registration growth.", read: "Monthly correlations between registration growth and transport or fuel inflation are small, and mostly positive, not strongly negative.", watch: "This is not a causal model. It says expansion years often had both rising registrations and rising mobility prices; it cannot isolate affordability, credit, supply or policy." },
      { chart: "multiLine", title: "Credit helped keep the engine turning", size: "small", beat: "credit", unit: "index, Jan 2019 = 100",
        series: [
          { indicator: "auto.credit.vehicle_loans_index_2019_100", label: "Vehicle-loan stock" },
          { indicator: "auto.vahan.registrations.index_2019_100_monthly", label: "Registrations" }
        ],
        why: "Vehicle buying is partly a credit cycle, not just an income cycle.", read: "Outstanding vehicle loans more than doubled after 2019, while monthly registrations recovered and then set new highs.", watch: "Loan stock is not new loan disbursement. It accumulates old loans and depends on repayments, tenure and interest rates." },
      { chart: "multiLine", title: "Credit growth and registrations do not move one-for-one", size: "small", beat: "credit-growth", unit: "% year-on-year", fromYear: 2023,
        series: [
          { indicator: "auto.credit.vehicle_loans_yoy_monthly", label: "Vehicle-loan stock growth" },
          { indicator: "auto.vahan.registrations.yoy_credit_window_monthly", label: "Registration growth" }
        ],
        why: "The growth-rate comparison is the sharper credit test: it asks whether credit momentum lines up with registration momentum.", read: "The post-reopening window is easier to read: loan-stock growth is steadier, while registrations still swing more sharply.", watch: "Loan-stock growth is not disbursement growth. It reflects new loans, repayments, tenure, loan size and old balances." },
      { indicator: "auto.siam.domestic_sales.mix_fy_2026", chart: "tableBars", title: "The industry-side check says the same thing", size: "small", beat: "siam-check", unit: "vehicles sold wholesale",
        why: "SIAM is a different source and a different measure, useful as a sanity check on mix.", read: "In FY 2025-26, two-wheelers dominated domestic wholesale sales, followed by passenger vehicles.", watch: "SIAM reports wholesale domestic sales, not VAHAN registrations. Public SIAM history scraped here has a large gap after FY 2013-14." },
      { chart: "multiLine", title: "EVs plug into a still-carbon-heavy grid", size: "feature", beat: "grid-context", unit: "% of generation",
        series: [
          { indicator: "auto.ember.grid.renewables_share", label: "Renewables" },
          { indicator: "auto.ember.grid.wind_solar_share", label: "Wind & solar" }
        ],
        why: "The EV question cannot stop at the vehicle. It has to ask what powers the charger.", read: "Renewables generated about a quarter of India's electricity in 2025; wind and solar together were about 14%.", watch: "Ember is electricity data, not EV data. This chart gives grid context for EV charging, not a lifecycle-emissions calculation." },
      { indicator: "auto.ember.grid.carbon_intensity", chart: "line", title: "The grid is cleaner, but still not clean", size: "small", window: "full", beat: "grid-carbon",
        why: "A cleaner grid makes every future EV kilometre cleaner too.", read: "India's power-sector carbon intensity fell to about 671 gCO2/kWh in 2025, the lowest point in the Ember series.", watch: "Carbon intensity is per unit of electricity generated. It does not include vehicle manufacturing, battery supply chains, or charging-time variation." }
    ]
  },
  {
    id: "q.econ.gold",
    slug: "india-and-gold",
    question: "How much gold does India have, and why can't we stop buying it?",
    priority: "core",
    // Built Jun 2026. Sources: UN Comtrade HS 7108/7113 (monthly to Mar 2026),
    // WGC Gold Demand Trends (India jewellery/bar-coin/supply), WGC Goldhub price
    // (USD+INR), Nifty 500 TRI + FRED USD-INR (Data bank), RBI DBIE forex reserves.
    indicators: [
      "gold.derived.household_stock", "gold.reserves.value_usd", "gold.reserves.forex_share",
      "gold.wgc.india_per_capita",
      "gold.comtrade.imports_value_monthly", "gold.comtrade.imports_value_annual", "gold.comtrade.imports_tonnes_annual",
      "gold.comtrade.imports_by_partner", "gold.wgc.india_gross_imports",
      "gold.comtrade.jewellery_exports_value_annual", "gold.comtrade.jewellery_exports_by_partner",
      "gold.comtrade.jewellery_imports_value_annual", "gold.derived.consumer_demand_tonnes",
      "gold.wgc.india_jewellery", "gold.wgc.india_bar_coin",
      "gold.derived.gold_growth_index", "gold.derived.nifty500_growth_index", "gold.derived.gold_real_index",
      "gold.derived.gold_growth_long", "gold.derived.nifty500_growth_long",
      "gold.derived.imports_value_vs_tonnes", "banking.idh.credit_monthly",
      "gold.derived.import_shares", "gold.policy.import_duty", "market.gold_etf_aum", "market.gold_etf_netflow", "market.digital_gold_upi",
      "macro.current_account_usd", "gold.reserves.tonnes", "gold.comtrade.imports_value_inr_annual",
      "gold.derived.duty_wedge"
    ],
    core: [
      "gold.derived.household_stock", "gold.reserves.value_usd", "gold.reserves.forex_share",
      "gold.wgc.india_per_capita",
      "gold.comtrade.imports_value_monthly", "gold.comtrade.imports_value_annual", "gold.comtrade.imports_tonnes_annual",
      "gold.comtrade.imports_by_partner", "gold.wgc.india_gross_imports",
      "gold.comtrade.jewellery_exports_value_annual", "gold.comtrade.jewellery_exports_by_partner",
      "gold.comtrade.jewellery_imports_value_annual", "gold.derived.consumer_demand_tonnes",
      "gold.wgc.india_jewellery", "gold.wgc.india_bar_coin",
      "gold.derived.gold_growth_index", "gold.derived.nifty500_growth_index", "gold.derived.gold_real_index",
      "gold.derived.gold_growth_long", "gold.derived.nifty500_growth_long",
      "gold.derived.imports_value_vs_tonnes", "banking.idh.credit_monthly",
      "gold.derived.import_shares", "gold.policy.import_duty", "market.gold_etf_aum", "market.gold_etf_netflow", "market.digital_gold_upi",
      "macro.current_account_usd", "gold.reserves.tonnes", "gold.comtrade.imports_value_inr_annual",
      "gold.derived.duty_wedge"
    ],
    context: [],
    visualPlan: [
      // --- ACT 1: THE HOARD (how much gold India has) ---
      { indicator: "gold.derived.household_stock", chart: "line", title: "India's private gold mountain", size: "hero", window: "full", beat: "scale",
        why: "The headline answer: Indians privately hold more gold than almost any nation on earth.", read: "A bottom-up reconstruction: a base of about 20,000 tonnes around 2010 (an industry estimate) plus each year's net consumer demand, reaching roughly 30,000 tonnes.", watch: "An estimate with a wide band; the World Gold Council's independent figure is about 25,000 tonnes, so read this as a 25,000-31,000t range, with the upward direction the robust signal." },
      { indicator: "gold.reserves.value_usd", chart: "line", title: "What the RBI keeps in the vault", size: "small", window: "full", beat: "official-reserves",
        why: "Set the private hoard against the state's: the central bank's gold is tiny next to households'.", read: "The value of the RBI's official gold reserves, about $83 billion in mid-2025 (around 880 tonnes).", watch: "This is the value of the gold, which rises with the price; the latest official MoSPI figure is mid-2025, and the dollar value has climbed further with the price since." },
      { indicator: "gold.reserves.tonnes", chart: "line", title: "The RBI has been buying real metal", size: "small", window: "full", beat: "rbi-tonnes",
        why: "Strip out the price and the RBI is genuinely accumulating gold, not just watching its value rise.", read: "RBI gold reserves in tonnes: flat near 558t for years after the 2009 IMF purchase, then climbing steadily from 2018 to about 880 tonnes.", watch: "Tonnage, not value, so this shows actual buying; the figures are the World Gold Council / IMF official series." },
      { indicator: "gold.reserves.forex_share", chart: "line", title: "The RBI is quietly buying more gold", size: "small", window: "full", beat: "diversification",
        why: "Gold is a growing slice of how India holds its foreign reserves.", read: "Gold as a share of total forex reserves, rising toward an eighth as the RBI diversifies away from dollars.", watch: "The share moves with both purchases and the gold price, not purchases alone." },
      { indicator: "gold.wgc.india_per_capita", chart: "line", title: "Half a gram per Indian, every year", size: "small", window: "full", beat: "per-capita",
        why: "The obsession, divided across 1.4 billion people.", read: "Grams of gold bought per person each year, jewellery and bars combined.", watch: "A national average; actual buying is hugely skewed by wealth and by wedding seasons." },
      // --- ACT 2: THE RIVER (the import habit) ---
      { indicator: "gold.comtrade.imports_value_inr_annual", chart: "recentBars", title: "India's gold bill, in rupees, keeps climbing", size: "feature", window: "full", beat: "import-bill", unit: "INR crore",
        why: "Gold is one of India's largest imports, and the rupee bill keeps setting records.", read: "What India spends importing gold each year, now near 5 lakh crore rupees. Shown in rupees, the currency Indians actually feel.", watch: "Read alongside the tonnage chart: the rising bill is mostly the world price, not more metal." },
      { indicator: "gold.comtrade.imports_tonnes_annual", chart: "line", title: "But the tonnage barely moved", size: "small", window: "full", beat: "paid-more-for-less",
        why: "The record bill is mostly price, not more metal.", read: "Tonnes of gold imported each year, range-bound around 700-1,000t with no upward trend while the dollar bill soared.", watch: "The 2014 point is estimated from the reported import value, since Comtrade did not record 2014 net weight." },
      { indicator: "gold.derived.imports_value_vs_tonnes", chart: "decoupleIndex", title: "The bill and the tonnage have come apart", size: "small", beat: "decoupling",
        columns: [ { key: "Import bill (US$)", label: "Import bill (US$)" }, { key: "Tonnes imported", label: "Tonnes imported" } ],
        why: "The clearest picture of paying more for the same gold: the bill and the metal pulling apart.", read: "Both lines start at 100 in 2010. The import bill climbs while the tonnage stays flat, so the whole gap is price.", watch: "Indexed to 100, so this shows the divergence, not the absolute dollars or tonnes." },
      { indicator: "gold.wgc.india_gross_imports", chart: "line", title: "The import figures check out", size: "small", window: "full", beat: "corroboration",
        why: "Two independent estimates of India's gold imports line up.", read: "The World Gold Council's own estimate of gross bullion imports, alongside the customs trade data.", watch: "WGC and Comtrade are built differently; close agreement is a good sign, not a coincidence." },
      { indicator: "gold.derived.import_shares", chart: "columnLines", title: "Gold is India's second-biggest import after oil", size: "small", beat: "import-rank", unit: "% of total imports",
        columns: [ { key: "Crude oil", label: "Crude oil" }, { key: "Gold", label: "Gold" } ],
        why: "Gold's pull on the economy is easier to feel against India's other big imports.", read: "Crude oil and gold as a share of all India's merchandise imports. Oil leads at around a fifth; gold is usually second or third at 5 to 10 percent.", watch: "Both shares move with world prices as much as with volumes, so a rising share is not always more barrels or more grams." },
      { indicator: "macro.current_account_usd", chart: "line", title: "Gold helped tip India into its 2013 crisis", size: "small", window: "full", beat: "current-account", subtitle: "India's current-account balance, US$ billion, financial years · MoSPI / RBI",
        why: "Gold imports are paid for in scarce dollars, so they widen the gap between what India earns and spends abroad.", read: "India's current-account balance. The record deficit of 2012-13, when gold and oil imports both surged, is the squeeze that forced the government to act on gold.", watch: "Gold is one driver among several, oil and the global cycle matter too; but the 2013 deficit is precisely what triggered the gold import-duty hikes." },
      { indicator: "gold.comtrade.imports_by_partner", chart: "comtradePartnerBars", title: "Where India's gold comes from", size: "feature", field: "primaryValue", limit: 10, beat: "sources",
        why: "Two refining hubs supply most of it, not the mines.", read: "Top source countries in 2024: Switzerland and the UAE alone are about 60% of the value.", watch: "Switzerland and the UAE are refiners and entrepots; the metal is often mined elsewhere." },
      // --- ACT 3: THE REFINERY (re-export engine) ---
      { chart: "multiLine", title: "Raw gold in, jewellery out", size: "feature", beat: "refinery", unit: "US$ billion",
        series: [ { indicator: "gold.comtrade.imports_value_annual", label: "Gold imports (raw)" }, { indicator: "gold.comtrade.jewellery_exports_value_annual", label: "Jewellery exports" } ],
        indicator: "gold.comtrade.imports_value_annual",
        why: "India is not just a sink for gold; it is a workshop that re-exports it as jewellery.", read: "Raw gold imported against finished jewellery exported, both in US$ billions.", watch: "These are gross flows; the gold content of exports is less than the raw import bill." },
      { indicator: "gold.comtrade.jewellery_exports_by_partner", chart: "comtradePartnerBars", title: "Where India's jewellery goes", size: "feature", field: "primaryValue", limit: 10, beat: "destinations",
        why: "The re-export engine's customers.", read: "Top destinations for India's gold jewellery exports in 2024: the UAE, the US and Hong Kong lead.", watch: "One year's snapshot; the Gulf and US dominate Indian-diaspora and bullion-trade demand." },
      { indicator: "gold.comtrade.jewellery_imports_value_annual", chart: "line", title: "The jewellery imports India just clamped down on", size: "small", window: "full", beat: "policy-reaction",
        why: "A quiet surge in jewellery imports provoked a 2026 policy crackdown.", read: "Gold jewellery imports rose sharply to 2024, prompting the DGFT to restrict several categories.", watch: "Small next to raw-gold imports, but fast-growing, which is why it drew attention." },
      { chart: "multiLine", title: "Imported versus actually bought", size: "small", beat: "absorption", unit: "tonnes",
        series: [ { indicator: "gold.comtrade.imports_tonnes_annual", label: "Gold imported" }, { indicator: "gold.derived.consumer_demand_tonnes", label: "Bought by Indians" } ],
        indicator: "gold.comtrade.imports_tonnes_annual",
        why: "Not all imported gold stays; some leaves as jewellery or is recycled.", read: "Tonnes imported each year against tonnes Indians consumed (jewellery plus bars and coins); imports sit above demand in most years.", watch: "Customs imports and WGC demand are different sources and not a same-year identity, so compare the trend, not a single year's gap." },
      // --- ACT 4: WHY WE CAN'T STOP (demand, culture, returns) ---
      { chart: "multiLine", title: "Jewellery is fading; investment gold is recovering", size: "feature", beat: "investment-shift", unit: "tonnes",
        series: [ { indicator: "gold.wgc.india_jewellery", label: "Jewellery" }, { indicator: "gold.wgc.india_bar_coin", label: "Bars & coins" } ],
        indicator: "gold.wgc.india_jewellery",
        why: "How Indians hold gold is shifting, but it is a recovery from a low, not a clean secular rise.", read: "Jewellery demand has drifted down from 2010; bar-and-coin (investment) demand fell from its 2013 peak to a mid-decade low, then recovered since 2020.", watch: "By WGC's own data, investment's share of demand fell from about 35% in 2013 to about 22% in 2022 before bouncing back, so read this as a recent revival, not a one-way trend." },
      { indicator: "market.gold_etf_aum", chart: "line", title: "Money is pouring into gold ETFs", size: "feature", window: "full", beat: "financialisation",
        why: "Gold is being financialised: held as a fund unit in a demat account, not only as a bangle.", read: "Assets in Indian gold exchange-traded funds, from a few thousand crore in the 2010s to well over a lakh crore, a sixfold jump since 2023.", watch: "Part of the rise is the soaring gold price lifting the value of existing holdings, but fresh inflows are large too. ETFs are still tiny next to physical gold." },
      { indicator: "market.gold_etf_netflow", chart: "line", title: "And it is fresh money, rushing in by the month", size: "small", window: "full", beat: "etf-flows",
        why: "AUM rises partly because gold got dearer; net flows show real new money actually moving in.", read: "Net monthly money into gold ETFs (purchases minus redemptions); inflows turned torrential in late 2025 and peaked near 24,000 crore in January 2026.", watch: "This is new money, separate from the price lifting existing holdings; a month can go negative when investors book profits." },
      { indicator: "market.digital_gold_upi", chart: "line", title: "Indians are now buying gold by the rupee, on UPI", size: "small", window: "full", beat: "digital-gold",
        why: "The most modern face of the obsession: gold bought in tiny amounts, instantly, through a payments app.", read: "Monthly value of digital gold bought via UPI, climbing past 2,000 crore rupees a month in late 2025; volumes rose about 377% in sixteen months.", watch: "Compiled from NPCI's UPI merchant-category disclosures at selected months, not every month; digital gold was promoted to a 'medium transacting' UPI category in May 2025." },
      { chart: "multiLine", title: "One rupee in gold versus one rupee in the stock market", size: "hero", beat: "returns", unit: "index (base 100)",
        series: [ { indicator: "gold.derived.gold_growth_index", label: "Gold (rupee price)" }, { indicator: "gold.derived.nifty500_growth_index", label: "Nifty 500 (total return)" } ],
        indicator: "gold.derived.gold_growth_index",
        why: "The question every Indian saver asks: would I have done better in gold or in shares?", read: "The growth of one rupee since 2005 in gold versus the Nifty 500 total-return index.", watch: "Equities led for years; gold's recent lead is the 2025-26 price surge, which may not last." },
      { chart: "multiLine", title: "Stretch it to thirty years, and shares win", size: "feature", beat: "long-returns", unit: "index (base 100)",
        series: [ { indicator: "gold.derived.gold_growth_long", label: "Gold (rupee price)" }, { indicator: "gold.derived.nifty500_growth_long", label: "Nifty 500 (total return)" } ],
        indicator: "gold.derived.gold_growth_long",
        why: "The answer flips with the horizon: over a full generation, equities clearly beat gold.", read: "The growth of one rupee since 1996: about 32 times in gold versus about 58 times in the Nifty 500 total-return index.", watch: "The long-run gold line uses the international price in rupees (LBMA times the exchange rate); the start date is what decides who looks ahead." },
      { indicator: "gold.derived.gold_real_index", chart: "line", title: "Did gold actually beat inflation?", size: "small", window: "full", beat: "real-return",
        why: "A rising price is not the same as rising purchasing power.", read: "The rupee gold price after stripping out CPI inflation; the real, inflation-adjusted line.", watch: "Real returns are far less dramatic than the headline rupee price suggests." },
      // --- ACT 5: THE STATE VS THE SAVER ---
      { indicator: "gold.derived.duty_wedge", chart: "line", title: "The tax wedge on Indian gold", size: "feature", window: "full", beat: "policy",
        why: "Indians pay more than the world price for gold, and policy is why.", read: "India's domestic gold premium over the world price: about 2-3% before 2013, near 10% after the duty hike, easing after the 2024 cut.", watch: "This is the import-duty-plus-premium wedge; it steps with policy, it does not drift." },
      { indicator: "gold.policy.import_duty", chart: "line", title: "The duty the government keeps moving", size: "feature", window: "full", beat: "duty-history",
        why: "Behind that premium is a single policy lever the state has yanked again and again.", read: "India's gold import duty: roughly 2% before 2012, hiked to 10% by 2013 to fight the current-account crisis, up to 15% in 2022, cut sharply to 6% in July 2024, then slammed back to 15% in May 2026 as the rupee weakened.", watch: "This is the effective customs duty and excludes the 3% GST; a curated timeline from Budget notifications and the WGC duty history. The May 2026 hike was the steepest on record." },
      { indicator: "banking.idh.credit_monthly", chart: "idhCreditGrowthBars", title: "Gold loans are the fastest-growing way Indians borrow", size: "feature", unit: "multiple", fromYear: 2019, subtitle: "IndiaDataHub/RBI · personal-loan subcategories · Jan 2019 to Apr 2026", beat: "gold-loans",
        series: [
          { indicator: "nonFoodSectoral:personal:Gold Loans", label: "Gold loans" },
          { indicator: "nonFoodSectoral:personal:Consumer Durable Loans", label: "Consumer durables" },
          { indicator: "nonFoodSectoral:personal:Credit Card Outstanding", label: "Credit cards" },
          { indicator: "nonFoodSectoral:personal:Other Personal Loans", label: "Other personal" },
          { indicator: "nonFoodSectoral:personal:Housing / Mortgage Loans", label: "Housing / mortgage" },
          { indicator: "nonFoodSectoral:personal:Vehicle Loans", label: "Vehicle loans" },
          { indicator: "nonFoodSectoral:personal:Education Loans", label: "Education" }
        ],
        why: "Gold is no longer only stored; it is increasingly borrowed against, a fast-rising form of household credit.", read: "Each bar is April 2026 outstanding divided by January 2019. Gold loans have grown about twentyfold, faster than any other retail-loan category.", watch: "Part of the jump is the reclassification of informal lenders into the formal data, but the surge in gold-backed borrowing is real." }
    ]
  },
  {
    id: "q.econ.foreign_investment",
    slug: "foreign-investment",
    question: "Is foreign money really fleeing India? What FDI and FII numbers actually mean.",
    priority: "core",
    // Built Jun 2026. Sources: RBI Handbook/SAP_290 (gross/repat/net FDI, monthly+annual),
    // NSDL FPI net investment (equity/debt/hybrid, reconciled), UNCTAD (India/world/peers
    // flow+stock), FRED (EM dollar index, US 10Y, Fed funds, VIX, EM-VIX), DPIIT-via-IDH
    // (FDI by source country). All numbers cross-checked against IndiaDataHub to the dollar.
    indicators: [
      "extfin.fdi.net.annual.usd", "extfin.fdi.portfolio_net.annual.usd", "extfin.narrative_anchors.usd",
      "extfin.fdi.gross_inflows.annual.usd", "extfin.fdi.repatriation.annual.usd",
      "extfin.fdi.outward.annual.usd", "extfin.fdi.outward_stock.unctad.usd",
      "extfin.fdi.portfolio_net.monthly.usd",
      "extfin.fpi.equity_net.annual.inr", "extfin.fpi.debt_net.annual.inr", "extfin.fpi.debt_far_net.annual.inr", "extfin.fpi.recent_split.nsdl.inr",
      "extfin.driver.usd_em_index", "extfin.driver.us_10y_yield", "extfin.driver.fed_funds_rate",
      "extfin.driver.vix", "extfin.driver.em_vix", "extfin.fpi.global_sensitivity.corr",
      "extfin.fdi.source_country.dpiit.usd", "extfin.fdi.sector.dpiit.usd", "extfin.fpi.auc_by_country.nsdl.inr",
      "extfin.fdi.india_share_world.pct", "extfin.fdi.peers_inward_flow_latest.unctad.usd"
    ],
    core: [
      "extfin.fdi.net.annual.usd", "extfin.fdi.portfolio_net.annual.usd", "extfin.narrative_anchors.usd",
      "extfin.fdi.gross_inflows.annual.usd", "extfin.fdi.repatriation.annual.usd",
      "extfin.fdi.outward.annual.usd", "extfin.fdi.outward_stock.unctad.usd",
      "extfin.fdi.portfolio_net.monthly.usd",
      "extfin.fpi.equity_net.annual.inr", "extfin.fpi.debt_net.annual.inr", "extfin.fpi.debt_far_net.annual.inr", "extfin.fpi.recent_split.nsdl.inr",
      "extfin.driver.usd_em_index", "extfin.driver.us_10y_yield", "extfin.driver.fed_funds_rate",
      "extfin.driver.vix", "extfin.driver.em_vix", "extfin.fpi.global_sensitivity.corr",
      "extfin.fdi.source_country.dpiit.usd", "extfin.fdi.sector.dpiit.usd", "extfin.fpi.auc_by_country.nsdl.inr",
      "extfin.fdi.india_share_world.pct", "extfin.fdi.peers_inward_flow_latest.unctad.usd"
    ],
    context: [],
    visualPlan: [
      // --- ACT 0: THE SCARY NUMBER ---
      { indicator: "extfin.fdi.net.annual.usd", chart: "line", title: "The number everyone is panicking about", size: "hero", window: "full", beat: "the-cliff", unit: "US$ million",
        why: "Net FDI fell from about $43bn (FY20) to under $1bn (FY25). Every headline screams this.", read: "Net foreign direct investment, the figure the panic is built on.", watch: "Real, but the most misread line in Indian macro. The rest of the article is why." },
      // --- ACT 1: WHAT FDI AND FII EVEN ARE ---
      { chart: "multiLine", title: "Patient money and hot money", size: "feature", beat: "definitions", unit: "US$ million",
        indicator: "extfin.fdi.net.annual.usd",
        series: [ { indicator: "extfin.fdi.net.annual.usd", label: "Net FDI (control, lasting)" }, { indicator: "extfin.fdi.portfolio_net.annual.usd", label: "Net FPI / FII (portfolio, mobile)" } ],
        why: "The two kinds of foreign money behave completely differently.", read: "FDI buys lasting control of a business; FII (portfolio) buys shares and bonds it can sell tomorrow.", watch: "FDI is steady; the FII line is a rollercoaster. That difference is the whole story." },
      // --- ACT 2: GROSS VS NET (THE BIG MISREAD) ---
      { chart: "multiLine", title: "Gross inflows hit a record the year net 'collapsed'", size: "hero", beat: "gross-vs-net", unit: "US$ million",
        indicator: "extfin.fdi.gross_inflows.annual.usd",
        series: [ { indicator: "extfin.fdi.gross_inflows.annual.usd", label: "Gross FDI coming in", emphasis: true }, { indicator: "extfin.fdi.net.annual.usd", label: "Net FDI (what the headlines quote)" } ],
        why: "Foreigners did not stop coming. Gross inflows actually rose to a record ~$81bn.", read: "Gross inflows climbed while net fell, because net subtracts money flowing back out.", watch: "Reading the net line as if it were gross is the core mistake." },
      { chart: "multiLine", title: "What eats the gap: repatriation and Indians investing abroad", size: "feature", beat: "decomposition", unit: "US$ million",
        indicator: "extfin.fdi.gross_inflows.annual.usd",
        series: [ { indicator: "extfin.fdi.gross_inflows.annual.usd", label: "Gross inflows" }, { indicator: "extfin.fdi.repatriation.annual.usd", label: "Repatriation (profits/exits leaving)" }, { indicator: "extfin.fdi.outward.annual.usd", label: "FDI by India (going abroad)" }, { indicator: "extfin.fdi.net.annual.usd", label: "Net FDI (what's left)" } ],
        why: "Net = gross minus repatriation minus outward FDI. Both subtractions grew.", read: "Repatriation nearly tripled and outward FDI doubled between FY20 and FY25.", watch: "Net near zero is partly maturity, not flight." },
      // --- ACT 3: WHY MONEY FLOWS BACK OUT ---
      { indicator: "extfin.fdi.repatriation.annual.usd", chart: "line", title: "Foreign investors are taking profits home", size: "small", window: "full", beat: "repatriation", unit: "US$ million",
        why: "Repatriation and disinvestment are why a flow turns negative, and they are rising.", read: "Money older foreign investments send back as profit, dividends or on exit.", watch: "A maturing market repatriates more; it is not the same as capital flight." },
      // --- ACT 4: INDIANS INVEST ABROAD TOO ---
      { indicator: "extfin.fdi.outward_stock.unctad.usd", chart: "line", title: "India has quietly become a capital exporter", size: "feature", window: "full", beat: "outward-stock", unit: "US$ million",
        why: "Indian firms now hold a large and growing stock of investments abroad.", read: "India's outward FDI stock grew from about $1.7bn in 2000 to roughly $260bn in 2024 (UNCTAD).", watch: "Two-way capital flows are a sign of a maturing economy, like Korea or China before." },
      { indicator: "extfin.fdi.outward.annual.usd", chart: "line", title: "And the yearly outflow has doubled", size: "small", window: "full", beat: "outward-flow", unit: "US$ million",
        why: "The annual pace of Indian investment abroad roughly doubled in five years.", read: "FDI by India (the outward flow), about $13bn in FY20 and $28bn in FY25.", watch: "Includes round-tripping and overseas subsidiary funding, not only greenfield expansion." },
      // --- ACT 5: THE FII ROLLERCOASTER ---
      { indicator: "extfin.fdi.portfolio_net.monthly.usd", chart: "line", title: "Hot money, month by month", size: "hero", window: "full", beat: "rollercoaster", unit: "US$ million",
        why: "Portfolio flows are violent at monthly resolution, which is the point of 'hot money'.", read: "Net monthly FII flows: roughly -$14.6bn in March 2020 (COVID), +$11bn in November 2020.", watch: "A negative month is normal market behaviour, not a verdict on India." },
      { indicator: "extfin.fdi.portfolio_net.annual.usd", chart: "recentBars", title: "Three wild years in a row", size: "small", window: "full", beat: "fii-annual", unit: "US$ million",
        why: "Even annually, FII swings between large inflows and outflows.", read: "Net portfolio investment swung from about +$36bn (FY21) to -$17bn (FY22) to +$44bn (FY24).", watch: "These reversals are mostly global, not India-specific (see the drivers act)." },
      // --- ACT 6: NOT ALL FII IS THE SAME (EQUITY VS DEBT) ---
      { chart: "multiLine", title: "Equity walked out while debt poured in", size: "feature", beat: "equity-vs-debt", unit: "INR crore",
        indicator: "extfin.fpi.equity_net.annual.inr",
        series: [ { indicator: "extfin.fpi.equity_net.annual.inr", label: "Equity" }, { indicator: "extfin.fpi.debt_net.annual.inr", label: "Debt" } ],
        why: "Lumping 'FII' together hides that equity and debt often move in opposite directions.", read: "In FY25 foreigners sold equities heavily even as they bought Indian bonds.", watch: "Shown in rupees, which reconcile exactly; the dollar series has a one-month source glitch." },
      { indicator: "extfin.fpi.debt_far_net.annual.inr", chart: "line", title: "The bond-index moment", size: "small", window: "full", beat: "bond-index", unit: "INR crore",
        why: "A structural event, not sentiment, drove the recent debt inflows.", read: "Debt under the Fully Accessible Route surged after JPMorgan added India to its bond index.", watch: "This debt money follows index mechanics, largely ignoring the dollar (see drivers)." },
      // --- ACT 7: WHAT ACTUALLY MOVES THIS MONEY (THE FED, NOT DELHI) ---
      { indicator: "extfin.driver.usd_em_index", chart: "line", title: "The real trigger sits in Washington", size: "feature", window: "full", beat: "dollar", unit: "index (Jan 2006 = 100)",
        why: "When the dollar strengthens against emerging-market currencies, money leaves India.", read: "The US dollar index versus emerging-market currencies; spikes in 2013 and 2022 line up with FII outflows.", watch: "A global force India does not control, not a referendum on Indian policy." },
      { chart: "multiLine", title: "The US rate cycle pulls the strings", size: "small", beat: "us-rates", unit: "percent", fromYear: 2011,
        indicator: "extfin.driver.us_10y_yield",
        series: [ { indicator: "extfin.driver.us_10y_yield", label: "US 10-year yield" }, { indicator: "extfin.driver.fed_funds_rate", label: "US Fed funds rate" } ],
        why: "Higher US rates make safe US assets more attractive than emerging-market risk.", read: "The US 10-year Treasury yield and the Fed funds rate, the global price of money.", watch: "FII tilts against these, but the link is a tilt, not a law." },
      { chart: "multiLine", title: "When the world gets scared, India gets sold", size: "small", beat: "risk-off", unit: "index",
        indicator: "extfin.driver.vix",
        series: [ { indicator: "extfin.driver.vix", label: "Global volatility (VIX)" }, { indicator: "extfin.driver.em_vix", label: "Emerging-market volatility" } ],
        why: "FII is risk-on/risk-off money; spikes in global fear coincide with outflows.", read: "Wall Street's VIX and the emerging-market volatility index, two fear gauges.", watch: "India rides the broad emerging-market tide more than its own news cycle." },
      { indicator: "extfin.fpi.global_sensitivity.corr", chart: "tableBars", title: "What actually moves FII money", size: "feature", beat: "sensitivity", unit: "correlation with monthly FII equity",
        why: "Putting the global drivers side by side: all of them pull the same way.", read: "Correlation of monthly FII equity flow with each global factor; the dollar and volatility matter most.", watch: "Magnitudes are moderate (~-0.1 to -0.4): global weather tilts flows, it does not fully decide them. Correlation, not cause." },
      // --- ACT 8: WHERE THE MONEY COMES FROM (THE TAX-HAVEN PUZZLE) ---
      { indicator: "extfin.fdi.source_country.dpiit.usd", chart: "tableBars", title: "FDI 'comes from' tiny tax-treaty hubs", size: "feature", beat: "fdi-source", unit: "US$ million (cumulative)",
        why: "Two small jurisdictions account for nearly half of India's cumulative FDI.", read: "Cumulative FDI equity by source: Mauritius and Singapore together are about 49% (DPIIT).", watch: "These are routing hubs, not ultimate origin; the real money often starts elsewhere." },
      { indicator: "extfin.fpi.auc_by_country.nsdl.inr", chart: "tableBars", title: "But portfolio money is real American money", size: "feature", beat: "fpi-source", unit: "INR crore",
        why: "Flip to portfolio holdings and the tax-haven pattern vanishes.", read: "Foreign portfolio assets held in India by source country: the United States alone is about 41%.", watch: "Stock of holdings (assets under custody), not annual flows; treaty routing matters far less here." },
      { indicator: "extfin.fdi.sector.dpiit.usd", chart: "tableBars", title: "And it goes into services, not factories", size: "feature", beat: "fdi-sector", unit: "US$ million (cumulative)",
        why: "Where the money lands is as revealing as where it comes from.", read: "Cumulative FDI equity by sector: services and computer software lead, far ahead of manufacturing lines (DPIIT).", watch: "DPIIT equity basis, cumulative since 2000; 'Make in India' aimed at factories, but the money mostly chased services and tech." },
      // --- ACT 9: THE GLOBAL LENS ---
      { indicator: "extfin.fdi.india_share_world.pct", chart: "line", title: "India is a small slice of world FDI", size: "small", window: "full", beat: "world-share", unit: "percent",
        why: "Zoom out and India's recent dip is partly a global FDI slowdown, not just India's.", read: "India's share of total world FDI inflows, usually around 2 to 3 percent.", watch: "A small share means global swings move India's numbers a lot." },
      { indicator: "extfin.fdi.peers_inward_flow_latest.unctad.usd", chart: "tableBars", title: "Still well behind the leaders", size: "small", beat: "peers", unit: "US$ million",
        why: "Against peers, India attracts less FDI than its size might suggest.", read: "Inward FDI in the latest year: the US, China and Singapore are far ahead of India.", watch: "One year's flow (volatile); the longer-run trend matters more than any single year." }
    ]
  },
  {
    id: "q.econ.growth",
    question: "How fast is India's economy growing?",
    priority: "core",
    indicators: ["econ.gdp.growth_real", "econ.idh.real_gdp_annual", "econ.idh.real_gdp_quarterly"],
    core: ["econ.gdp.growth_real", "econ.idh.real_gdp_annual", "econ.idh.real_gdp_quarterly"],
    context: ["econ.inflation_cpi"]
  },
  {
    id: "q.econ.per_person",
    question: "How rich is the average Indian?",
    priority: "core",
    indicators: ["econ.idh.per_capita_nominal_gdp", "econ.gdp.per_capita_current_usd"],
    core: ["econ.idh.per_capita_nominal_gdp", "econ.gdp.per_capita_current_usd"],
    context: ["econ.idh.nominal_gdp_annual"]
  },
  {
    id: "q.econ.inflation",
    question: "Why does everything keep getting more expensive?",
    priority: "core",
    primer: {
      kicker: "Inflation, demystified",
      lead: "Inflation is the speed at which prices rise, not the prices themselves. Hold on to that one idea and the rest of this page falls into place.",
      myths: [
        { myth: "Inflation fell, so prices are falling.", reality: "No. Lower inflation means prices are still rising, just more slowly. Prices only actually fall when inflation turns negative, which is called deflation and is rare." },
        { myth: "Low inflation means things are cheap now.", reality: "No. It means prices rose slowly this year. They are still higher than last year, and far higher than a decade ago. The increases simply got smaller." },
        { myth: "Inflation is the price of things.", reality: "No, it is the rate of change. A packet going from Rupees 100 to 105 is 5% inflation; 105 to 107 the next year is about 2%, lower inflation but a higher price." }
      ],
      ladder: [
        { term: "Deflation", note: "prices actually fall, below 0%", tone: "cold" },
        { term: "Disinflation", note: "still rising, but slower", tone: "cool" },
        { term: "Normal inflation", note: "about 2 to 6%, India most years", tone: "mid", here: true },
        { term: "High inflation", note: "double digits, painful", tone: "warm" },
        { term: "Hyperinflation", note: "prices double in weeks", tone: "hot" }
      ],
      example: { lead: "A worked example: why a falling rate still hurts", steps: [ { year: "2023", from: 100, to: 110, rate: "+10%" }, { year: "2024", from: 110, to: 115, rate: "+4.5%" }, { year: "2025", from: 115, to: 117, rate: "+1.7%" } ], insight: "Prices rose every single year. Inflation fell from 10% to 1.7%, but the price climbed from ₹100 to ₹117 and never came back down. Falling inflation means the climb got gentler, not that you got your money back." },
      hyperinflation: { heading: "When money breaks: hyperinflation", stat: "23,773%", statLabel: "Congo’s 1994 inflation. India’s worst year ever was 29%.", body: "At the nightmare end of the scale, money loses meaning. At Bolivia in 1985 (11,750%) or Congo in 1994 (23,773%), prices doubled within weeks. People spent their wages the moment they were paid, and lifetime savings vanished. India has never come close: its worst year ever, 1974, was 29%." },
      protect: { heading: "This is why money cannot sit still", points: [ "Cash kept at home loses about 5% of its value every year, quietly and invisibly.", "A bank fixed deposit only protects you if its rate beats inflation. Right now it does, by roughly 5 percentage points; in 2022 it did not.", "To stay ahead of prices, savings have to grow faster than them, which is why Indians put money into gold, property and shares, not just the almirah." ], disclaimer: "This is how inflation works, not investment advice." }
    },
    // Comprehensive inflation/purchasing-power flagship — the single most-felt
    // number for an ordinary Indian (10 acts). Blended: MOSPI CPI (granular to item
    // level, 3 sectors, monthly since 2011) + MOSPI WPI (wholesale) + World Bank
    // long arc & cross-country + IndiaDataHub bank deposit rate + RBI policy repo.
    // Answers: how prices rose, what drove it, is it high vs the world, does it eat
    // your salary and your savings, and how it differs across town and country.
    indicators: ["prices.cpi.combined.purchasing_power", "prices.cpi.headline_annual_long", "prices.cpi.combined.general.inflation"],
    core: ["prices.cpi.combined.purchasing_power", "prices.cpi.headline_annual_long", "prices.cpi.combined.general.inflation"],
    context: [
      "prices.cpi.combined.general.index", "econ.inflation_cpi", "prices.cpi.core.inflation", "prices.cpi.core.index", "prices.cpi.ex_food.inflation",
      "prices.cpi.price_multiple_since_1960", "prices.cpi.purchasing_power_1960", "prices.cpi.decade_avg_inflation", "prices.cpi.price_level_since_1960",
      "compare.cpi_inflation.in", "compare.cpi_inflation.us", "compare.cpi_inflation.chn", "compare.cpi_inflation.bra", "compare.cpi_inflation.idn", "compare.cpi_inflation.vnm", "compare.cpi_inflation.bgd", "compare.cpi_inflation.zaf",
      "prices.wpi.all_commodities.inflation", "prices.wpi.primary_articles.inflation", "prices.wpi.fuel_power.inflation", "prices.wpi.manufactured.inflation",
      "prices.cpi.weight.food_beverages", "prices.cpi.weight.miscellaneous", "prices.cpi.weight.housing", "prices.cpi.weight.fuel_light", "prices.cpi.weight.clothing_footwear", "prices.cpi.weight.pan_tobacco_intoxicants", "prices.cpi.weight2012.food_beverages", "prices.cpi.weight2012.miscellaneous", "prices.cpi.weight2012.housing_fuel", "prices.cpi.weight2012.clothing_footwear", "prices.cpi.weight2012.pan_tobacco", "prices.cpi.weight2024.food_beverages", "prices.cpi.weight2024.miscellaneous", "prices.cpi.weight2024.housing_fuel", "prices.cpi.weight2024.clothing_footwear", "prices.cpi.weight2024.pan_tobacco",
      "prices.cpi.contribution.food_beverages", "prices.cpi.contribution.miscellaneous", "prices.cpi.contribution.housing", "prices.cpi.contribution.fuel_light", "prices.cpi.contribution.clothing_footwear", "prices.cpi.contribution.pan_tobacco_intoxicants",
      "prices.cpi.combined.food_beverages.inflation", "prices.cpi.combined.fuel_light.inflation", "prices.cpi.combined.housing.inflation", "prices.cpi.combined.clothing_footwear.inflation", "prices.cpi.combined.health.inflation", "prices.cpi.combined.education.inflation", "prices.cpi.combined.transport_communication.inflation", "prices.cpi.combined.miscellaneous.inflation", "prices.cpi.combined.pan_tobacco_intoxicants.inflation", "prices.cpi.combined.personal_care_effects.inflation", "prices.cpi.combined.recreation_amusement.inflation", "prices.cpi.combined.household_goods_services.inflation",
      "prices.cpi.combined.food_beverages.index", "prices.cpi.combined.fuel_light.index", "prices.cpi.combined.housing.index", "prices.cpi.combined.clothing_footwear.index", "prices.cpi.combined.health.index", "prices.cpi.combined.education.index", "prices.cpi.combined.transport_communication.index", "prices.cpi.combined.miscellaneous.index", "prices.cpi.combined.pan_tobacco_intoxicants.index",
      "prices.cpi.combined.consumer_food_price.inflation",
      "prices.cpi.combined.cereals_products.index", "prices.cpi.combined.vegetables.index", "prices.cpi.combined.pulses_products.index", "prices.cpi.combined.oils_fats.index", "prices.cpi.combined.milk_products.index",
      "prices.cpi.combined.vegetables.inflation", "prices.cpi.combined.pulses_products.inflation", "prices.cpi.combined.oils_fats.inflation",
      "prices.cpi.item.onion.index", "prices.cpi.item.tomato.index", "prices.cpi.item.potato.index",
      "prices.cpi.item.onion.inflation", "prices.cpi.item.tomato.inflation", "prices.cpi.item.potato.inflation", "prices.cpi.item.rice.inflation", "prices.cpi.item.wheat_atta.inflation", "prices.cpi.item.milk.inflation", "prices.cpi.item.eggs.inflation", "prices.cpi.item.pulses.inflation", "prices.cpi.item.mustard_oil.inflation", "prices.cpi.item.sugar.inflation",
      "prices.cpi.item.tuition_fees.index", "prices.cpi.item.doctor_fee.index", "prices.cpi.item.medicine.index",
      "prices.cpi.item.petrol.index", "prices.cpi.item.diesel.index", "prices.cpi.item.lpg.index", "prices.cpi.item.electricity.index",
      "prices.cpi.item.gold.index", "prices.cpi.item.gold.inflation", "prices.cpi.item.lpg.inflation", "prices.cpi.item.mustard_oil.inflation",
      "prices.cpi.real_fd_return", "prices.deposit_rate_term", "prices.repo_rate", "prices.lending_rate", "compare.cpi_inflation.idn", "compare.cpi_peak.ind", "compare.cpi_peak.bra", "compare.cpi_peak.arg", "compare.cpi_peak.per", "compare.cpi_peak.bol", "compare.cpi_peak.tur", "compare.cpi_peak.ago", "compare.cpi_peak.cod", "compare.cpi_peak.isr",
      "prices.cpi.rural.general.inflation", "prices.cpi.urban.general.inflation", "prices.cpi.rural.food_beverages.inflation", "prices.cpi.urban.food_beverages.inflation"
    ],
    visualPlan: [
      // ACT I — Is your money shrinking?
      { indicator: "prices.cpi.combined.purchasing_power", chart: "line", title: "What ₹100 from 2012 buys today", size: "hero", window: "full", beat: "purchasing-power",
        why: "The most concrete way to feel inflation: the same rupee buys steadily less.", read: "The real value, in 2012 rupees, of ₹100 — now about half.", watch: "This tracks the official consumer basket, not any one household's spending." },
      { indicator: "prices.cpi.price_multiple_since_1960", chart: "line", title: "Prices are over 90 times their 1960 level", size: "feature", window: "full", beat: "long-multiple",
        why: "The long view that puts a lifetime of inflation in one number.", read: "How many times higher prices are than in 1960; ₹100 then buys barely ₹1 of goods now.", watch: "Steady single-digit inflation looks mild year to year, but compounds into an enormous rise over decades." },
      { indicator: "prices.cpi.headline_annual_long", chart: "line", title: "India's inflation rate, 1960 to today", size: "feature", window: "full", beat: "long-view",
        why: "Inflation is normal and usually positive; the question is how fast, not whether.", read: "Annual CPI inflation. World Bank to 2024; 2025 provisional from MOSPI.", watch: "The double-digit years of the 1970s–90s are gone; recent inflation is lower and steadier." },
      { indicator: "prices.cpi.headline_annual_long", chart: "decadeBars", title: "Average inflation, decade by decade", size: "small", unit: "% per year", beat: "decades",
        why: "The cleanest long story, stripped of year-to-year noise.", read: "Average annual inflation in each decade since the 1960s.", watch: "The 1970s and 1990s were the painful decades; the 2010s–20s have been calmer by India's own history." },
      { indicator: "prices.cpi.combined.general.inflation", chart: "line", title: "Inflation month by month since 2012", size: "feature", window: "full", beat: "recent-volatility",
        why: "The recent, lived experience: the headline rate swings a lot within a few years.", read: "Year-on-year CPI each month, with spikes around 2020 and 2022 and a sharp fall through 2025.", watch: "2025 fell close to zero — a real disinflation, mostly food prices cooling." },
      { chart: "multiLine", indicator: "prices.cpi.combined.general.inflation", title: "The sticky core: inflation without food and fuel", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.cpi.combined.general.inflation", label: "Headline" }, { indicator: "prices.cpi.core.inflation", label: "Core (ex food and fuel)" }, { indicator: "prices.cpi.combined.consumer_food_price.inflation", label: "Food" } ],
        beat: "core",
        why: "Core inflation strips out volatile food and fuel to reveal the underlying, sticky trend the RBI watches most.", read: "Headline, core, and food inflation together. Core is the calm spine; food is the noise that swings the headline.", watch: "When headline drops below core (late 2025: about 1% headline vs 4.6% core), it is usually a temporary food dip while underlying prices keep rising." },
      { chart: "multiLine", indicator: "prices.cpi.combined.general.inflation", title: "Shops vs mandis: retail (CPI) vs wholesale (WPI)", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.cpi.combined.general.inflation", label: "CPI (retail)" }, { indicator: "prices.wpi.all_commodities.inflation", label: "WPI (wholesale)" } ],
        beat: "retail-vs-wholesale",
        why: "Two official inflation measures: what you pay (CPI) vs what producers and traders pay (WPI).", read: "Wholesale inflation is far more volatile and often leads retail.", watch: "WPI has no services and is commodity-heavy, so it can swing negative while CPI stays positive." },
      // ACT II — Is India's inflation high?
      { chart: "multiLine", indicator: "compare.cpi_inflation.in", title: "Is India's inflation high? A world comparison", size: "feature", unit: "% per year", fromYear: 2000,
        series: [ { indicator: "compare.cpi_inflation.in", label: "India" }, { indicator: "compare.cpi_inflation.chn", label: "China" }, { indicator: "compare.cpi_inflation.bra", label: "Brazil" }, { indicator: "compare.cpi_inflation.idn", label: "Indonesia" }, { indicator: "compare.cpi_inflation.vnm", label: "Vietnam" }, { indicator: "compare.cpi_inflation.bgd", label: "Bangladesh" }, { indicator: "compare.cpi_inflation.zaf", label: "South Africa" }, { indicator: "compare.cpi_inflation.us", label: "United States" } ],
        beat: "cross-country",
        why: "Whether India's inflation is unusually high — or normal for a fast-growing economy.", read: "Annual CPI inflation since 2000 for India against major emerging markets (China, Brazil, Indonesia, Vietnam, Bangladesh, South Africa) and the US (World Bank). The older hyperinflation spikes are in the next chart.", watch: "India runs hotter than rich countries but is calm next to its own past and many emerging peers; China is unusually low." },
      { chart: "latestBars", indicator: "compare.cpi_peak.cod", title: "The world’s worst inflations, and where India sits", size: "feature", unit: "% in the peak year", subtitle: "World Bank · peak annual inflation · log scale",
        series: [ { indicator: "compare.cpi_peak.cod", label: "DR Congo (1994)" }, { indicator: "compare.cpi_peak.bol", label: "Bolivia (1985)" }, { indicator: "compare.cpi_peak.per", label: "Peru (1990)" }, { indicator: "compare.cpi_peak.ago", label: "Angola (1996)" }, { indicator: "compare.cpi_peak.bra", label: "Brazil (1990)" }, { indicator: "compare.cpi_peak.isr", label: "Israel (1984)" }, { indicator: "compare.cpi_peak.arg", label: "Argentina (2024)" }, { indicator: "compare.cpi_peak.tur", label: "Turkiye (1994)" }, { indicator: "compare.cpi_peak.ind", label: "India (1974)" } ],
        beat: "hyperinflation",
        why: "What runaway inflation actually looks like, and how far India has stayed from it.", read: "Each country’s worst single year of inflation (World Bank). India’s worst year, 1974, barely registers next to history’s hyperinflations.", watch: "These are annual averages; at the peak, prices in Bolivia or Congo were doubling within weeks. India has never come close." },
      // ACT III — What's in your basket, and what drove the number
      { chart: "stripPair", indicator: "prices.cpi.weight2012.food_beverages", title: "How India's shopping basket shifted, 2012 to today", size: "feature", unit: "% of basket",
        rows: [
          { label: "2012 base", series: [ { indicator: "prices.cpi.weight2012.food_beverages", label: "Food & beverages" }, { indicator: "prices.cpi.weight2012.miscellaneous", label: "Services & other" }, { indicator: "prices.cpi.weight2012.housing_fuel", label: "Housing & fuel" }, { indicator: "prices.cpi.weight2012.clothing_footwear", label: "Clothing & footwear" }, { indicator: "prices.cpi.weight2012.pan_tobacco", label: "Pan, tobacco" } ] },
          { label: "2024 base", series: [ { indicator: "prices.cpi.weight2024.food_beverages", label: "Food & beverages" }, { indicator: "prices.cpi.weight2024.miscellaneous", label: "Services & other" }, { indicator: "prices.cpi.weight2024.housing_fuel", label: "Housing & fuel" }, { indicator: "prices.cpi.weight2024.clothing_footwear", label: "Clothing & footwear" }, { indicator: "prices.cpi.weight2024.pan_tobacco", label: "Pan, tobacco" } ] }
        ],
        beat: "basket-shift",
        why: "How a typical household's spending split moved as incomes rose.", read: "Two snapshots of the CPI basket, same five buckets: the 2012 base (top) and the new 2024 base (bottom). Food's share fell from about 46% to 37%, while services, transport and health grew.", watch: "The 2024 series uses finer categories; here they are aggregated up to the 2012 groups so the two baskets are directly comparable." },
      { chart: "latestBars", indicator: "prices.cpi.contribution.food_beverages", title: "Which categories actually drove the latest inflation", size: "feature", unit: "percentage points",
        series: [ { indicator: "prices.cpi.contribution.food_beverages", label: "Food & beverages" }, { indicator: "prices.cpi.contribution.miscellaneous", label: "Miscellaneous" }, { indicator: "prices.cpi.contribution.housing", label: "Housing" }, { indicator: "prices.cpi.contribution.fuel_light", label: "Fuel & light" }, { indicator: "prices.cpi.contribution.clothing_footwear", label: "Clothing & footwear" }, { indicator: "prices.cpi.contribution.pan_tobacco_intoxicants", label: "Pan, tobacco" } ],
        beat: "contribution",
        why: "Weight times speed: a category matters to the headline only if it is both big and rising.", read: "Each category's contribution (weight × its inflation) to the latest headline rate; they sum to roughly the headline.", watch: "A big category with low inflation can contribute less than a small category that is spiking." },
      { chart: "latestBars", indicator: "prices.cpi.combined.health.inflation", title: "What's getting dearer fastest right now", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.cpi.combined.health.inflation", label: "Health" }, { indicator: "prices.cpi.combined.education.inflation", label: "Education" }, { indicator: "prices.cpi.combined.housing.inflation", label: "Housing" }, { indicator: "prices.cpi.combined.transport_communication.inflation", label: "Transport & comms" }, { indicator: "prices.cpi.combined.personal_care_effects.inflation", label: "Personal care" }, { indicator: "prices.cpi.combined.recreation_amusement.inflation", label: "Recreation" }, { indicator: "prices.cpi.combined.household_goods_services.inflation", label: "Household goods" }, { indicator: "prices.cpi.combined.pan_tobacco_intoxicants.inflation", label: "Pan, tobacco" }, { indicator: "prices.cpi.combined.fuel_light.inflation", label: "Fuel & light" }, { indicator: "prices.cpi.combined.clothing_footwear.inflation", label: "Clothing & footwear" }, { indicator: "prices.cpi.combined.food_beverages.inflation", label: "Food & beverages" } ],
        beat: "whats-biting",
        why: "The headline hides very different speeds across categories.", read: "Latest year-on-year inflation for each major category.", watch: "A low headline can sit on top of fast-rising services like health and education." },
      { chart: "multiLine", indicator: "prices.cpi.combined.food_beverages.index", title: "How each part of life got pricier since 2012", size: "feature", unit: "index (2012=100)",
        series: [ { indicator: "prices.cpi.combined.food_beverages.index", label: "Food & beverages" }, { indicator: "prices.cpi.combined.fuel_light.index", label: "Fuel & light" }, { indicator: "prices.cpi.combined.housing.index", label: "Housing" }, { indicator: "prices.cpi.combined.clothing_footwear.index", label: "Clothing & footwear" }, { indicator: "prices.cpi.combined.miscellaneous.index", label: "Miscellaneous" }, { indicator: "prices.cpi.combined.pan_tobacco_intoxicants.index", label: "Pan, tobacco" } ],
        beat: "compounding-groups",
        why: "Inflation compounds: even 'low' categories pile up over a decade.", read: "Each broad category's price level, all starting at 100 in 2012.", watch: "Levels here are cumulative, not annual rates — a flat-looking line still sits far above 100." },
      // ACT IV — Food: half your basket
      { chart: "multiLine", indicator: "prices.cpi.combined.consumer_food_price.inflation", title: "Food swings drive the headline", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.cpi.combined.consumer_food_price.inflation", label: "Food" }, { indicator: "prices.cpi.combined.general.inflation", label: "Headline (all items)" } ],
        beat: "food-driver",
        why: "Because food is half the basket, food prices largely steer the headline.", read: "Food inflation against overall inflation; the two move together, food more violently.", watch: "When the headline falls it is usually food cooling — core (non-food) inflation moves far less." },
      { chart: "multiLine", indicator: "prices.cpi.combined.cereals_products.index", title: "How food prices climbed, group by group", size: "feature", unit: "index (2012=100)",
        series: [ { indicator: "prices.cpi.combined.cereals_products.index", label: "Cereals" }, { indicator: "prices.cpi.combined.vegetables.index", label: "Vegetables" }, { indicator: "prices.cpi.combined.pulses_products.index", label: "Pulses" }, { indicator: "prices.cpi.combined.oils_fats.index", label: "Oils & fats" }, { indicator: "prices.cpi.combined.milk_products.index", label: "Milk" } ],
        beat: "food-groups",
        why: "Food is not one thing: staples like cereals and milk grind up steadily, others lurch.", read: "Price level since 2012 for the main food groups.", watch: "A high level reflects cumulative rises; vegetables can be volatile around a lower trend." },
      { chart: "multiLine", indicator: "prices.cpi.combined.vegetables.inflation", title: "The food prices that whipsaw", size: "small", unit: "% YoY",
        series: [ { indicator: "prices.cpi.combined.vegetables.inflation", label: "Vegetables" }, { indicator: "prices.cpi.combined.pulses_products.inflation", label: "Pulses" }, { indicator: "prices.cpi.combined.oils_fats.inflation", label: "Oils & fats" } ],
        beat: "volatile-food",
        why: "A few items spike and crash hardest — the prices people notice most.", read: "Year-on-year inflation for vegetables, pulses, and edible oils.", watch: "These swing on monsoons and harvests; a vegetable spike can dominate a month's headline." },
      { chart: "multiLine", indicator: "prices.cpi.item.onion.index", title: "The price of onion, tomato and potato", size: "feature", unit: "index (2012=100)",
        series: [ { indicator: "prices.cpi.item.onion.index", label: "Onion" }, { indicator: "prices.cpi.item.tomato.index", label: "Tomato" }, { indicator: "prices.cpi.item.potato.index", label: "Potato" } ],
        beat: "tomato-onion",
        why: "The vegetables that make headlines and move household budgets, item by item.", read: "Price index for the three vegetables Indians watch most.", watch: "These are violently seasonal — a single bad harvest can double a price, then it crashes." },
      { chart: "latestBars", indicator: "prices.cpi.item.onion.inflation", title: "What your groceries cost this year", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.cpi.item.tomato.inflation", label: "Tomato" }, { indicator: "prices.cpi.item.milk.inflation", label: "Milk" }, { indicator: "prices.cpi.item.eggs.inflation", label: "Eggs" }, { indicator: "prices.cpi.item.mustard_oil.inflation", label: "Mustard oil" }, { indicator: "prices.cpi.item.sugar.inflation", label: "Sugar" }, { indicator: "prices.cpi.item.rice.inflation", label: "Rice" }, { indicator: "prices.cpi.item.wheat_atta.inflation", label: "Wheat/atta" }, { indicator: "prices.cpi.item.pulses.inflation", label: "Pulses" }, { indicator: "prices.cpi.item.potato.inflation", label: "Potato" }, { indicator: "prices.cpi.item.onion.inflation", label: "Onion" } ],
        beat: "grocery-basket",
        why: "The grocery list, item by item — where some prices jumped and others fell.", read: "Latest year-on-year inflation for everyday food items.", watch: "A single year is noisy for seasonal items; read it beside the longer trends." },
      // ACT V — The quiet compounders: services
      { chart: "multiLine", indicator: "prices.cpi.combined.health.index", title: "The quiet compounders: health, education, transport", size: "feature", unit: "index (2012=100)",
        series: [ { indicator: "prices.cpi.combined.health.index", label: "Health" }, { indicator: "prices.cpi.combined.education.index", label: "Education" }, { indicator: "prices.cpi.combined.transport_communication.index", label: "Transport & comms" } ],
        beat: "services-compounding",
        why: "Services rarely spike, so they escape attention — but they climb relentlessly.", read: "Price level since 2012 for health, education, and transport.", watch: "Steady 5–6% a year doubles a price in ~13 years; this is the inflation that erodes savings quietly." },
      { chart: "multiLine", indicator: "prices.cpi.item.tuition_fees.index", title: "The price of school fees, doctors and medicine", size: "feature", unit: "index (2012=100)",
        series: [ { indicator: "prices.cpi.item.tuition_fees.index", label: "Tuition fees" }, { indicator: "prices.cpi.item.doctor_fee.index", label: "Doctor's fee" }, { indicator: "prices.cpi.item.medicine.index", label: "Medicine" } ],
        beat: "services-items",
        why: "The bills families dread, made concrete: school and healthcare.", read: "Price index for tuition fees, doctor consultation, and medicine.", watch: "These are out-of-pocket costs; they bite hardest where public services are thin." },
      // ACT VI — Fuel and power at home
      { chart: "multiLine", indicator: "prices.cpi.item.petrol.index", title: "The price of fuel and power", size: "feature", unit: "index (2012=100)",
        series: [ { indicator: "prices.cpi.item.petrol.index", label: "Petrol" }, { indicator: "prices.cpi.item.diesel.index", label: "Diesel" }, { indicator: "prices.cpi.item.lpg.index", label: "LPG cylinder" }, { indicator: "prices.cpi.item.electricity.index", label: "Electricity" } ],
        beat: "fuel-items",
        why: "Energy at home and on the road — petrol, diesel, the gas cylinder, the power bill.", read: "Price index for the fuels every household buys.", watch: "These carry heavy taxes and subsidies, so prices reflect policy as much as global oil." },
      // ACT VII — The extremes
      { chart: "latestBars", indicator: "prices.cpi.item.gold.inflation", title: "The biggest price moves this year", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.cpi.item.gold.inflation", label: "Gold" }, { indicator: "prices.cpi.item.mustard_oil.inflation", label: "Mustard oil" }, { indicator: "prices.cpi.item.lpg.inflation", label: "LPG cylinder" }, { indicator: "prices.cpi.item.tomato.inflation", label: "Tomato" }, { indicator: "prices.cpi.item.pulses.inflation", label: "Pulses" }, { indicator: "prices.cpi.item.potato.inflation", label: "Potato" }, { indicator: "prices.cpi.item.onion.inflation", label: "Onion" } ],
        beat: "extremes",
        why: "Inflation is an average; the lived experience is the extremes — what spiked and what crashed.", read: "Latest year-on-year change for the items that moved most, up and down.", watch: "Gold is an asset and a hedge, not a consumption staple, so treat it separately from food." },
      { indicator: "prices.cpi.item.gold.index", chart: "line", title: "Gold: the household hedge against inflation", size: "small", window: "full", beat: "gold",
        why: "Indians buy gold partly to protect savings from inflation — and it has paid off.", read: "The price index for gold since 2012.", watch: "Gold protects wealth but is not part of the cost of living; it is in the CPI as a personal good." },
      // ACT VIII — Does inflation eat your savings?
      { indicator: "prices.cpi.real_fd_return", chart: "line", title: "Does your fixed deposit beat inflation?", size: "feature", window: "full", beat: "real-return",
        why: "The question every saver asks: is my bank deposit actually growing my money?", read: "The bank term-deposit rate minus the past year's average inflation. Above zero, your FD grows in real terms; below zero, it quietly shrinks.", watch: "Real FD returns are usually thin (1-2 points) and were near zero or negative in 2020-22. The unusually high 2025 reading is a one-off: inflation collapsed while deposit rates stayed up, so it is not a normal, sustainable real return." },
      { chart: "multiLine", indicator: "prices.deposit_rate_term", title: "FD rate vs inflation, the two lines behind the gap", size: "small", unit: "% per year",
        series: [ { indicator: "prices.deposit_rate_term", label: "FD rate" }, { indicator: "prices.cpi.combined.general.inflation", label: "Inflation" } ],
        beat: "fd-vs-cpi",
        why: "The real return is just the distance between these two lines.", read: "The average bank term-deposit rate against CPI inflation.", watch: "Banks are slow to change deposit rates, so the real return swings mostly with inflation." },
      { chart: "multiLine", indicator: "prices.repo_rate", title: "How the RBI fights inflation: the repo rate", size: "feature", unit: "%", fromYear: 2013,
        series: [ { indicator: "prices.repo_rate", label: "RBI repo rate" }, { indicator: "prices.cpi.combined.general.inflation", label: "CPI inflation" } ],
        beat: "repo",
        why: "The main tool against inflation: the central bank's policy rate.", read: "The RBI repo rate against CPI inflation. The RBI targets 4% inflation (with a 2–6% band).", watch: "The RBI raises rates when inflation runs hot and cuts when it cools — but rate changes act with a long lag." },
      { chart: "multiLine", indicator: "prices.repo_rate", title: "From the repo rate to your loan EMI", size: "feature", unit: "%", fromYear: 2012,
        series: [ { indicator: "prices.repo_rate", label: "RBI repo rate" }, { indicator: "prices.lending_rate", label: "Bank lending rate" } ],
        beat: "transmission",
        why: "How the RBI’s rate reaches your wallet: banks price loans off the policy rate.", read: "The repo rate against the average bank lending rate. Lending sits a few points above repo and tracks it with a lag.", watch: "Your actual home or car loan rate is higher still, and floating-rate loans reprice faster than fixed ones." },
      // ACT IX — Town vs country
      { chart: "multiLine", indicator: "prices.cpi.combined.general.inflation", title: "Town and country feel it differently", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.cpi.rural.general.inflation", label: "Rural" }, { indicator: "prices.cpi.urban.general.inflation", label: "Urban" }, { indicator: "prices.cpi.combined.general.inflation", label: "Combined" } ],
        beat: "rural-urban",
        why: "One national number hides that villages and cities buy different baskets.", read: "Headline inflation for rural, urban, and combined India.", watch: "Rural leans more on food; urban leans more on housing and services, so they diverge." },
      { chart: "multiLine", indicator: "prices.cpi.rural.food_beverages.inflation", title: "Food inflation hits the village harder", size: "small", unit: "% YoY",
        series: [ { indicator: "prices.cpi.rural.food_beverages.inflation", label: "Rural food" }, { indicator: "prices.cpi.urban.food_beverages.inflation", label: "Urban food" } ],
        beat: "rural-food",
        why: "Food is a bigger share of a rural household's spend, so food spikes hurt more there.", read: "Food & beverages inflation, rural vs urban.", watch: "Even when the rate is similar, the same food inflation eats a larger slice of a rural budget." },
      // ACT X — The wholesale pipeline
      { chart: "multiLine", indicator: "prices.wpi.primary_articles.inflation", title: "The wholesale pipeline: where prices start", size: "feature", unit: "% YoY",
        series: [ { indicator: "prices.wpi.primary_articles.inflation", label: "Primary articles" }, { indicator: "prices.wpi.fuel_power.inflation", label: "Fuel & power" }, { indicator: "prices.wpi.manufactured.inflation", label: "Manufactured products" } ],
        beat: "wholesale-pipeline",
        why: "Before prices reach you they move through wholesale; this is the pressure upstream.", read: "Wholesale inflation for raw articles, fuel & power, and manufactured goods.", watch: "Fuel & power is the most volatile and often signals where retail inflation heads next." }
    ]
  },
  {
    id: "q.work.how_india_works",
    question: "How does India work?",
    priority: "core",
    // "How India Works" flagship — a portrait of India's labour market. Spine =
    // MOSPI PLFS (official survey, granular by gender/sector/age/education/caste),
    // blended with World Bank (long arc + cross-country peers), OWID (working
    // hours, output-per-hour, Maddison long run) and IndiaDataHub (MGNREGA demand,
    // EPFO payroll, rural wages, Naukri hiring). Thesis: India has the world's
    // largest, youngest workforce, but the way it works defies the development
    // script. See memory: indica-how-india-works-flagship.
    indicators: ["work.plfs.lfpr_person", "work.plfs.ur_person", "work.plfs.status_self_employed"],
    core: [
      "work.plfs.lfpr_person",
      "work.plfs.ur_person",
      "work.plfs.lfpr_female",
      "work.plfs.status_self_employed",
      "work.plfs.ur_edu_graduate",
      "work.idh.nrega_persons_demanding"
    ],
    context: [
      "work.labor_force_total", "people.age_15_64_share", "people.age_0_14_share", "people.age_65_plus_share",
      "work.plfs.wpr_person", "work.plfs.lfpr_male", "work.plfs.lfpr_female_rural", "work.plfs.lfpr_female_urban",
      "compare.lfpr.in", "compare.lfpr.chn", "compare.lfpr.bgd", "compare.lfpr.vnm", "compare.lfpr.idn", "compare.lfpr.wld",
      "compare.lfpr_female.in", "compare.lfpr_female.chn", "compare.lfpr_female.bgd", "compare.lfpr_female.vnm", "compare.lfpr_female.idn", "compare.lfpr_female.wld",
      "work.plfs.status_regular_wage", "work.plfs.status_casual",
      "work.self_employed", "work.wage_salaried", "work.vulnerable_employment", "work.idh.epfo_net_new_subscribers_monthly",
      "work.plfs.empshare_agriculture", "work.plfs.empshare_industry", "work.plfs.empshare_services",
      "econ.gdp.sector_agriculture", "econ.gdp.sector_industry", "econ.gdp.sector_services",
      "compare.emp_agriculture.in", "compare.emp_agriculture.chn", "compare.emp_agriculture.bgd", "compare.emp_agriculture.vnm", "compare.emp_agriculture.idn", "compare.emp_agriculture.wld",
      "work.owid.gdp_per_capita_maddison",
      "work.plfs.wage_regular_person", "work.plfs.wage_self_employed_person", "work.plfs.wage_casual_person",
      "work.idh.rural_wage_men", "work.idh.rural_wage_women",
      "compare.productivity.in", "compare.productivity.chn", "compare.productivity.bgd", "compare.productivity.vnm", "compare.productivity.idn", "compare.productivity.wld",
      "work.owid.working_hours", "work.owid.productivity_per_hour",
      "work.plfs.ur_edu_not_literate", "work.plfs.ur_edu_primary", "work.plfs.ur_edu_middle", "work.plfs.ur_edu_secondary", "work.plfs.ur_edu_higher_secondary", "work.plfs.ur_edu_diploma", "work.plfs.ur_edu_postgraduate",
      "work.plfs.ur_youth_person",
      "compare.youth_unemployment.in", "compare.youth_unemployment.chn", "compare.youth_unemployment.bgd", "compare.youth_unemployment.vnm", "compare.youth_unemployment.idn", "compare.youth_unemployment.wld",
      "work.plfs.ur_social_st", "work.plfs.ur_social_sc", "work.plfs.ur_social_obc", "work.plfs.ur_social_others",
      "work.idh.plfs_monthly_ur",
      "work.idh.nrega_person_days_created", "work.idh.nrega_active_workers", "work.idh.jobspeak_total",
      "work.ilo.informal_rate_total", "work.ilo.informal_rate_agriculture", "work.ilo.informal_rate_industry", "work.ilo.informal_rate_services",
      "compare.informal_rate.ind", "compare.informal_rate.bgd", "compare.informal_rate.vnm", "compare.informal_rate.idn",
      "work.ilo.neet_youth", "work.ilo.neet_youth_female", "work.ilo.neet_youth_male",
      "work.ilo.working_poverty", "work.ilo.working_poverty_youth",
      "work.real.wage_regular_person", "work.real.rural_wage_men", "work.real.rural_wage_women"
    ],
    visualPlan: [
      { indicator: "work.labor_force_total", chart: "line", title: "India sends the world's largest workforce out to work", size: "hero", window: "full", beat: "scale",
        subtitle: "World Bank · total labour force · 1990 to today",
        why: "Any account of how India works has to start with the sheer size of the labour pool it has to absorb.", read: "The total number of Indians either working or looking for work, growing every year.", watch: "A bigger labour force is an opportunity only if the economy creates enough work for it; otherwise it is pressure." },
      { chart: "multiLine", indicator: "people.age_15_64_share", title: "A young country, in its working years", size: "feature", window: "full", beat: "demographics", unit: "% of population",
        subtitle: "World Bank · share of population by age · 1960 to today",
        series: [ { indicator: "people.age_0_14_share", label: "Children (0–14)" }, { indicator: "people.age_15_64_share", label: "Working age (15–64)" }, { indicator: "people.age_65_plus_share", label: "Older (65+)" } ],
        why: "India's labour story rides on its demography: the working-age share is near its peak — the 'dividend' window.", read: "The child share falling, the working-age share rising, the older share still low.", watch: "The dividend pays out only if those working-age people actually find productive work; the window does not stay open forever." },
      { chart: "multiLine", indicator: "work.plfs.lfpr_person", title: "Who shows up: participation and employment", size: "feature", window: "full", beat: "participation", unit: "%",
        subtitle: "PLFS · usual status (PS+SS), 15+ · survey years 2017-18 to 2023-24",
        series: [ { indicator: "work.plfs.lfpr_person", label: "In the labour force (LFPR)" }, { indicator: "work.plfs.wpr_person", label: "Actually working (WPR)" } ],
        why: "Two of the three headline numbers: how many Indians offer to work, and how many are working.", read: "LFPR is everyone working or seeking work; WPR is those actually employed. The gap between them is unemployment.", watch: "Both have risen sharply since 2017-18 — but read that alongside who is counted as working, including unpaid family labour." },
      { indicator: "work.plfs.ur_person", chart: "line", title: "The unemployment rate is low — and that is the puzzle", size: "feature", window: "full", beat: "unemployment", unit: "%",
        subtitle: "PLFS · unemployment rate, usual status, 15+",
        why: "India's headline joblessness is strikingly low for a poor country, which is itself the central paradox of how India works.", read: "The share of the labour force that wants work but cannot find it.", watch: "A low rate here does not mean plentiful good jobs; with little unemployment insurance, most people cannot afford to be openly unemployed, so they take whatever work exists." },
      { chart: "multiLine", indicator: "compare.lfpr.in", title: "India works less than its neighbours", size: "feature", window: "full", beat: "comparison", unit: "% of population 15+",
        subtitle: "World Bank (modelled ILO) · labour force participation · 1990 to today",
        series: [ { indicator: "compare.lfpr.in", label: "India" }, { indicator: "compare.lfpr.chn", label: "China" }, { indicator: "compare.lfpr.bgd", label: "Bangladesh" }, { indicator: "compare.lfpr.vnm", label: "Vietnam" }, { indicator: "compare.lfpr.idn", label: "Indonesia" }, { indicator: "compare.lfpr.wld", label: "World" } ],
        why: "Put India next to its peers and it is a participation outlier — fewer of its adults are in the workforce at all.", read: "Participation rates for India, four Asian peers, and the world average.", watch: "These are modelled ILO estimates, not PLFS, so levels differ from the official figures; the comparison is the point, not the exact number." },
      { chart: "multiLine", indicator: "work.plfs.lfpr_female", title: "The single biggest reason India works less: women", size: "feature", window: "full", beat: "gender-gap", unit: "%",
        subtitle: "PLFS · LFPR by sex, 15+ · 2017-18 to 2023-24",
        series: [ { indicator: "work.plfs.lfpr_male", label: "Men" }, { indicator: "work.plfs.lfpr_female", label: "Women" } ],
        why: "The gap between male and female participation is the largest single fact about who works in India.", read: "Male participation sits far above female; the distance between the lines is India's gender gap in work.", watch: "Female participation has risen fast since 2017-18, but much of the rise is in self-employment and unpaid family work, which the survey now counts more fully." },
      { chart: "multiLine", indicator: "work.plfs.lfpr_female_rural", title: "Where the women returning to work are", size: "small", window: "full", beat: "gender-detail", unit: "%",
        subtitle: "PLFS · female LFPR by sector, 15+",
        series: [ { indicator: "work.plfs.lfpr_female_rural", label: "Rural women" }, { indicator: "work.plfs.lfpr_female_urban", label: "Urban women" } ],
        why: "The female rebound is overwhelmingly a rural, farm-based story, not an office one.", read: "Rural female participation climbing steeply; urban female participation much flatter and lower.", watch: "Rural gains are concentrated in agriculture and self-employment, often as distress or unpaid help — rising participation is not automatically rising opportunity." },
      { chart: "multiLine", indicator: "compare.lfpr_female.in", title: "India's women work less than almost anywhere comparable", size: "feature", window: "full", beat: "gender-comparison", unit: "% of female population 15+",
        subtitle: "World Bank (modelled ILO) · female labour force participation · 1990 to today",
        series: [ { indicator: "compare.lfpr_female.in", label: "India" }, { indicator: "compare.lfpr_female.chn", label: "China" }, { indicator: "compare.lfpr_female.bgd", label: "Bangladesh" }, { indicator: "compare.lfpr_female.vnm", label: "Vietnam" }, { indicator: "compare.lfpr_female.idn", label: "Indonesia" }, { indicator: "compare.lfpr_female.wld", label: "World" } ],
        why: "Even after the recent rise, India sits near the bottom of the world on women in the workforce.", read: "Female participation for India against its peers and the world.", watch: "Bangladesh — poorer than India — pulled far ahead, largely through garment-factory jobs for women; the gap is about the kind of work on offer, not just culture." },
      { chart: "multiLine", indicator: "work.ilo.neet_youth_female", title: "Four in ten young women are doing nothing officially counted", size: "feature", window: "full", beat: "neet-gender", unit: "% of youth 15–24",
        subtitle: "ILOSTAT (SDG 8.6.1) · youth not in employment, education or training",
        series: [ { indicator: "work.ilo.neet_youth_female", label: "Young women" }, { indicator: "work.ilo.neet_youth_male", label: "Young men" }, { indicator: "work.ilo.neet_youth", label: "All youth" } ],
        why: "The missing-women story has a sharp young edge: a huge share of young women are neither working, in school, nor in training — the NEET measure.", read: "The share of 15–24-year-olds not in employment, education or training, by sex. The female line sits dramatically above the male.", watch: "Much of female NEET is unpaid domestic and care work, which the labour statistics do not count as employment — so 'doing nothing' is a statistical artefact, not idleness." },
      { chart: "multiLine", indicator: "work.plfs.status_self_employed", title: "Most Indians don't have a job — they have work", size: "feature", window: "full", beat: "informality", unit: "% of workers",
        subtitle: "PLFS · distribution of workers by status · 2017-18 to 2023-24",
        series: [ { indicator: "work.plfs.status_self_employed", label: "Self-employed" }, { indicator: "work.plfs.status_regular_wage", label: "Regular wage/salaried" }, { indicator: "work.plfs.status_casual", label: "Casual labour" } ],
        why: "The defining feature of how India works: the typical worker runs a tiny own-account enterprise, not holds a salaried job.", read: "Three slices of the workforce — self-employed, regular-salaried, and casual — with self-employment the rising majority.", watch: "Self-employment is climbing again, including unpaid family helpers; a salaried job with a payslip remains a minority experience." },
      { chart: "multiLine", indicator: "work.self_employed", title: "Secure formal jobs stay scarce", size: "small", window: "full", beat: "job-quality", unit: "% of total employment",
        subtitle: "World Bank (modelled ILO) · status in employment, India · 1991 to today",
        series: [ { indicator: "work.self_employed", label: "Self-employed" }, { indicator: "work.wage_salaried", label: "Wage & salaried" }, { indicator: "work.vulnerable_employment", label: "Vulnerable employment" } ],
        why: "The long World Bank view confirms the survey: wage employment grows only slowly while vulnerable work stays high.", read: "Self-employed and vulnerable-employment shares high and sticky; the wage-and-salaried share low and rising gently.", watch: "'Vulnerable employment' means own-account and unpaid family workers — no contract, no benefits, little security." },
      { chart: "multiLine", indicator: "work.ilo.informal_rate_total", title: "How informal India's work really is", size: "feature", window: "full", beat: "informality-rate", unit: "% of employment",
        subtitle: "ILOSTAT (SDG 8.3.1) · informal employment rate · 2010 to today",
        series: [ { indicator: "work.ilo.informal_rate_total", label: "All sectors" }, { indicator: "work.ilo.informal_rate_agriculture", label: "Agriculture" }, { indicator: "work.ilo.informal_rate_industry", label: "Industry" }, { indicator: "work.ilo.informal_rate_services", label: "Services" } ],
        why: "The ILO's official informality measure puts a hard number on the informality engine: the overwhelming majority of Indian jobs have no contract, no social security, no protection.", read: "The share of employment that is informal, overall and by broad sector. Nearly nine in ten jobs are informal; in agriculture it is almost universal.", watch: "Informal does not only mean the unorganised sector — it includes informal jobs inside formal firms (no written contract or benefits), which is why even industry and services are heavily informal." },
      { chart: "multiLine", indicator: "compare.informal_rate.ind", title: "Informal work, India versus its peers", size: "small", window: "full", beat: "informality-comparison", unit: "% of employment",
        subtitle: "ILOSTAT (SDG 8.3.1) · informal employment rate",
        series: [ { indicator: "compare.informal_rate.ind", label: "India" }, { indicator: "compare.informal_rate.bgd", label: "Bangladesh" }, { indicator: "compare.informal_rate.idn", label: "Indonesia" }, { indicator: "compare.informal_rate.vnm", label: "Vietnam" } ],
        why: "High informality is common across developing Asia, but India sits at the top of the range.", read: "Informal employment rates for India and three regional peers.", watch: "Vietnam's lower informality tracks its factory-led shift; China is absent because it does not report this SDG indicator." },
      { indicator: "work.idh.epfo_net_new_subscribers_monthly", chart: "line", title: "Formal hiring, month by month", size: "small", window: "full", beat: "formal-jobs",
        subtitle: "IndiaDataHub · net new EPF subscribers · monthly",
        why: "The clearest high-frequency signal of formal-sector job creation is who is newly paying into the pension fund.", read: "Net new formal (EPFO) subscribers added each month.", watch: "This captures only the organised sector the provident fund covers — a small top layer of total employment, and partly formalisation of existing jobs rather than brand-new ones." },
      { chart: "multiLine", indicator: "work.plfs.empshare_agriculture", title: "India's workers are still on the farm", size: "feature", window: "full", beat: "structure-jobs", unit: "% of workers",
        subtitle: "PLFS · workers by broad sector (current weekly status) · 2017-18 to 2023-24",
        series: [ { indicator: "work.plfs.empshare_agriculture", label: "Agriculture" }, { indicator: "work.plfs.empshare_industry", label: "Industry" }, { indicator: "work.plfs.empshare_services", label: "Services" } ],
        why: "The textbook path runs farm to factory to office. India's workers largely stopped at the first step — and lately drifted back.", read: "The share of workers in agriculture, industry and services; agriculture is still the largest and has stopped falling.", watch: "After 2019 the agriculture share rose again as workers returned to farms during and after the pandemic — a reversal of the expected shift." },
      { chart: "multiLine", indicator: "econ.gdp.sector_agriculture", title: "...but the economy's output moved to services long ago", size: "feature", window: "full", beat: "structure-output", unit: "% of GDP",
        subtitle: "World Bank · gross value added by sector · share of GDP",
        series: [ { indicator: "econ.gdp.sector_agriculture", label: "Agriculture" }, { indicator: "econ.gdp.sector_industry", label: "Industry" }, { indicator: "econ.gdp.sector_services", label: "Services" } ],
        why: "Set output beside employment and the scissors open: services dominate what India produces while farms dominate who works.", read: "Agriculture is a small and shrinking share of output; services are the largest.", watch: "Read this together with the previous chart — agriculture makes only a sixth of GDP but employs over 40% of workers, the productivity trap in one comparison." },
      { chart: "multiLine", indicator: "compare.emp_agriculture.in", title: "Stuck on the land, compared with peers", size: "small", window: "full", beat: "structure-comparison", unit: "% of total employment",
        subtitle: "World Bank (modelled ILO) · employment in agriculture · 1991 to today",
        series: [ { indicator: "compare.emp_agriculture.in", label: "India" }, { indicator: "compare.emp_agriculture.chn", label: "China" }, { indicator: "compare.emp_agriculture.vnm", label: "Vietnam" }, { indicator: "compare.emp_agriculture.bgd", label: "Bangladesh" }, { indicator: "compare.emp_agriculture.idn", label: "Indonesia" }, { indicator: "compare.emp_agriculture.wld", label: "World" } ],
        why: "China and Vietnam pulled workers off farms far faster than India; the comparison shows the shift is possible.", read: "Agriculture's share of employment falling steeply in China and Vietnam, more slowly in India.", watch: "Faster doesn't always mean better, but it usually means workers moving into higher-output factory and service jobs." },
      { indicator: "work.owid.gdp_per_capita_maddison", chart: "line", title: "The very long view: India's income over the centuries", size: "small", window: "full", beat: "long-run",
        subtitle: "Our World in Data · Maddison Project · real GDP per capita",
        why: "Today's labour market is one frame in a much longer film — India was a large share of the world economy, then fell far behind, and is now climbing back.", read: "Real income per person over centuries, flat for ages and rising steeply only recently.", watch: "The recent surge is real but starts from a very low base; per-person income is still a fraction of the rich-world level." },
      { chart: "multiLine", indicator: "work.plfs.wage_regular_person", title: "What a month of work earns — and the gulf between kinds of work", size: "feature", window: "full", beat: "earnings", unit: "₹ per month",
        subtitle: "PLFS · average monthly earnings · 2017-18 to 2023-24",
        series: [ { indicator: "work.plfs.wage_regular_person", label: "Regular wage/salaried" }, { indicator: "work.plfs.wage_self_employed_person", label: "Self-employed" } ],
        why: "Pay is where informality bites: the salaried earn far more per month than the self-employed majority.", read: "Average monthly earnings for regular-salaried versus self-employed workers.", watch: "The self-employed figure is gross earnings before costs, and averages hide huge spread — a shopkeeper and a street vendor are both 'self-employed'." },
      { chart: "multiLine", indicator: "work.real.wage_regular_person", title: "The salary freeze: pay rose on paper, not in real life", size: "feature", window: "full", beat: "real-wages", unit: "₹/month",
        subtitle: "PLFS earnings · nominal vs CPI-deflated (2012 ₹) · 2017-18 to 2023-24",
        series: [ { indicator: "work.plfs.wage_regular_person", label: "Nominal" }, { indicator: "work.real.wage_regular_person", label: "Real (2012 ₹)" } ],
        why: "The single most important thing about Indian pay this decade: once you strip out inflation, salaried earnings have not risen — they have fallen.", read: "Two lines for the same regular-wage earnings: the nominal rupee figure climbing, the inflation-adjusted figure flat-to-down.", watch: "Nominal pay rose about a quarter from 2017-18 to 2023-24, but in constant 2012 rupees real earnings fell — a real-terms pay cut hidden by inflation." },
      { indicator: "work.plfs.wage_casual_person", chart: "line", title: "The casual daily wage", size: "small", window: "full", beat: "casual-pay",
        subtitle: "PLFS · average daily earnings, casual labour · ₹ per day",
        why: "At the bottom of the ladder, work is paid by the day, and that daily rate sets the floor for hundreds of millions.", read: "The average daily wage for casual labourers.", watch: "A daily wage means no income on days without work; multiply by the days actually worked, not 30, to picture a month." },
      { chart: "multiLine", indicator: "work.idh.rural_wage_men", title: "Rural wages since the 1990s", size: "small", window: "full", beat: "rural-wages",
        subtitle: "IndiaDataHub · daily average rural wage rate (blended series)",
        series: [ { indicator: "work.idh.rural_wage_men", label: "Men" }, { indicator: "work.idh.rural_wage_women", label: "Women" } ],
        why: "Rural wages set the living standard for most Indian workers and reveal a persistent gender gap.", read: "The daily wage for rural men and women, rising over time in rupees.", watch: "These are nominal rupees — not adjusted for inflation — so part of the rise just keeps up with prices; the men-women gap is the durable story." },
      { chart: "multiLine", indicator: "work.real.rural_wage_men", title: "Rural wages, once you strip out inflation", size: "small", window: "full", beat: "real-rural-wages", unit: "₹/day (2012 prices)",
        subtitle: "IndiaDataHub rural wage deflated by MOSPI CPI-Rural (2012=100)",
        series: [ { indicator: "work.real.rural_wage_men", label: "Men (real)" }, { indicator: "work.real.rural_wage_women", label: "Women (real)" } ],
        why: "The same deflation applied to rural wages shows how much of the headline rise is real gain versus just keeping up with prices.", read: "Rural daily wages in constant 2012 rupees, so the slope is genuine purchasing-power growth.", watch: "Real rural wage growth has been slow and uneven; stretches of near-stagnation matter because most Indian workers live on these wages." },
      { chart: "multiLine", indicator: "compare.productivity.in", title: "How much each worker produces — and how far behind", size: "feature", window: "full", beat: "productivity", unit: "constant PPP $ per worker",
        subtitle: "World Bank · GDP per person employed · 1991 to today",
        series: [ { indicator: "compare.productivity.in", label: "India" }, { indicator: "compare.productivity.chn", label: "China" }, { indicator: "compare.productivity.vnm", label: "Vietnam" }, { indicator: "compare.productivity.bgd", label: "Bangladesh" }, { indicator: "compare.productivity.idn", label: "Indonesia" }, { indicator: "compare.productivity.wld", label: "World" } ],
        why: "Wages can only rise sustainably if output per worker rises; this is where the farm-overhang shows up as a number.", read: "Output produced per employed person, India against peers and the world.", watch: "China raced ahead of India on this measure over thirty years; the gap is the price of keeping so many workers in low-output agriculture." },
      { chart: "multiLine", indicator: "work.ilo.working_poverty", title: "Having a job is not the same as escaping poverty", size: "small", window: "full", beat: "working-poverty", unit: "% of employed",
        subtitle: "ILOSTAT (SDG 1.1.1) · employed living below US$3.65/day PPP",
        series: [ { indicator: "work.ilo.working_poverty", label: "All workers" }, { indicator: "work.ilo.working_poverty_youth", label: "Young workers (15–24)" } ],
        why: "Low unemployment hides a different problem: many Indians who do work are still poor. Working poverty is the missing half of the jobs story.", read: "The share of employed people living below the extreme-poverty line, overall and for the young — falling sharply but not gone.", watch: "Working poverty has dropped enormously since 2000, real progress, but it shows that the question is not only whether people work, but whether work pays enough to live on." },
      { chart: "latestBars", indicator: "work.plfs.ur_edu_graduate", title: "The paradox: the more educated you are, the more likely you are jobless", size: "feature", window: "latest", beat: "graduate-unemployment", unit: "% unemployed (latest)",
        subtitle: "PLFS · unemployment rate by education, 15+ · latest survey year",
        series: [ { indicator: "work.plfs.ur_edu_not_literate", label: "Not literate" }, { indicator: "work.plfs.ur_edu_primary", label: "Up to primary" }, { indicator: "work.plfs.ur_edu_middle", label: "Middle" }, { indicator: "work.plfs.ur_edu_secondary", label: "Secondary" }, { indicator: "work.plfs.ur_edu_higher_secondary", label: "Higher secondary" }, { indicator: "work.plfs.ur_edu_diploma", label: "Diploma" }, { indicator: "work.plfs.ur_edu_graduate", label: "Graduate" }, { indicator: "work.plfs.ur_edu_postgraduate", label: "Postgraduate+" } ],
        why: "This single chart explains why low headline unemployment and a real jobs crisis are both true at once.", read: "Unemployment by education level: near-zero for the unlettered, far higher for graduates.", watch: "The unlettered cannot afford to be unemployed and take any work; the educated hold out for jobs that match their qualifications and often cannot find them. Joblessness here is a luxury of those with options." },
      { chart: "multiLine", indicator: "work.plfs.ur_youth_person", title: "It is the young who can't find work", size: "feature", window: "full", beat: "youth", unit: "%",
        subtitle: "PLFS · unemployment rate, all ages vs 15-29 · 2017-18 to 2023-24",
        series: [ { indicator: "work.plfs.ur_person", label: "All workers (15+)" }, { indicator: "work.plfs.ur_youth_person", label: "Youth (15-29)" } ],
        why: "The overall jobless rate hides the crisis: among the young entering the labour market, unemployment is several times higher.", read: "Two lines — overall unemployment near the bottom, youth unemployment far above it.", watch: "Youth unemployment falling in recent years partly reflects young people leaving the labour force for education, not all of them finding jobs." },
      { chart: "multiLine", indicator: "compare.youth_unemployment.in", title: "Young and jobless, in context", size: "small", window: "full", beat: "youth-comparison", unit: "% of youth labour force",
        subtitle: "World Bank (modelled ILO) · youth unemployment (15-24) · 1991 to today",
        series: [ { indicator: "compare.youth_unemployment.in", label: "India" }, { indicator: "compare.youth_unemployment.chn", label: "China" }, { indicator: "compare.youth_unemployment.bgd", label: "Bangladesh" }, { indicator: "compare.youth_unemployment.vnm", label: "Vietnam" }, { indicator: "compare.youth_unemployment.idn", label: "Indonesia" }, { indicator: "compare.youth_unemployment.wld", label: "World" } ],
        why: "Youth joblessness is high across South and Southeast Asia, but India's is severe given how many young people it has.", read: "Youth unemployment for India and peers.", watch: "A percentage of a huge youth population is an enormous absolute number of young Indians without work." },
      { chart: "latestBars", indicator: "work.plfs.ur_social_others", title: "Unemployment by social group", size: "small", window: "latest", beat: "caste", unit: "% unemployed (latest)",
        subtitle: "PLFS · unemployment rate by social category, 15+ · latest survey year",
        series: [ { indicator: "work.plfs.ur_social_st", label: "Scheduled Tribe" }, { indicator: "work.plfs.ur_social_sc", label: "Scheduled Caste" }, { indicator: "work.plfs.ur_social_obc", label: "OBC" }, { indicator: "work.plfs.ur_social_others", label: "Others" } ],
        why: "Who is unemployed also tracks social position, in ways that complicate the simple education story.", read: "Unemployment rates across India's broad social categories.", watch: "Lower measured unemployment among the most disadvantaged often means they cannot afford to search and take low-paid informal work instead — not that they are better off." },
      { indicator: "work.idh.plfs_monthly_ur", chart: "line", title: "Unemployment, now month by month", size: "small", window: "full", beat: "recency",
        subtitle: "IndiaDataHub · monthly PLFS unemployment rate · 2025 onward",
        why: "From 2025 India finally publishes monthly labour data, turning an annual snapshot into something closer to a live feed.", read: "The all-India unemployment rate, now reported every month.", watch: "This new monthly series is short and seasonal — read the trend over several months, not any single print." },
      { indicator: "work.idh.nrega_persons_demanding", chart: "line", title: "When private work runs out, India falls back on a guarantee", size: "feature", window: "full", beat: "safety-net",
        subtitle: "IndiaDataHub · persons demanding work under MGNREGA · monthly",
        why: "The rural job-guarantee scheme is the shock absorber of India's labour market: demand for it spikes exactly when other work disappears.", read: "The number of people each month demanding work under MGNREGA, with a dramatic spike in 2020.", watch: "The 2020 surge is the lockdown, when migrants who lost city jobs went home and asked for guaranteed rural work; demand staying elevated afterwards signals continued rural distress." },
      { chart: "multiLine", indicator: "work.idh.nrega_person_days_created", title: "The rural safety valve, in days of work", size: "small", window: "full", beat: "safety-net-detail",
        subtitle: "IndiaDataHub · MGNREGA · monthly",
        series: [ { indicator: "work.idh.nrega_person_days_created", label: "Person-days of work created" }, { indicator: "work.idh.nrega_active_workers", label: "Active workers" } ],
        why: "Behind the demand figure sits the actual work delivered — days of employment created when nothing else is available.", read: "Person-days of work generated and the number of active workers on the rolls.", watch: "The scheme guarantees up to 100 days a year per household — a floor against destitution, not a route into better jobs." },
      { indicator: "work.idh.jobspeak_total", chart: "line", title: "What the hiring market is signalling next", size: "small", window: "full", beat: "coda",
        subtitle: "IndiaDataHub · Naukri JobSpeak white-collar hiring index · monthly",
        why: "To close, a forward-looking read: the private hiring market for the formal, white-collar jobs that India's graduates are waiting for.", read: "An index of white-collar job postings, rising and falling with employer appetite.", watch: "This tracks the narrow formal-sector top of the labour market — the destination most graduates want, and the bottleneck the rest of this story keeps running into." }
    ]
  },
  {
    id: "q.work.who_works_in_india",
    question: "Who works in India?",
    priority: "core",
    // Companion to q.work.how_india_works but a DIFFERENT thesis and a different data
    // spine: built EXCLUSIVELY from PLFS 2025 unit-level microdata (microdata.gov.in,
    // calendar-2025 person+household files), recomputed in scripts/plfs/build_who_works.py.
    // Argument: there is no single Indian labour market — whether you work, what you do,
    // whether you're paid and how much is decided by who you are (sex, education, caste,
    // religion, marriage, age) and where you live (state, rural/urban). Re-cuts the SAME
    // workforce through lens after lens. All series are work.who.* (usual status ps+ss,
    // weighted by Subsample_Multiplier/100). See memory: indica-mospi-microdata-nada.
    indicators: ["work.who.lfpr_female", "work.who.ur_youth_edu_graduate", "work.who.informal_overall"],
    core: [
      "work.who.lfpr_male", "work.who.lfpr_female", "work.who.ur_youth_edu_graduate",
      "work.who.unpaid_share_female", "work.who.informal_overall", "work.who.casual_share_sc"
    ],
    context: [
      "work.who.lfpr_person", "work.who.wpr_male", "work.who.wpr_female", "work.who.wpr_person",
      "work.who.ur_male", "work.who.ur_female", "work.who.ur_person",
      "work.who.status_self_emp", "work.who.status_regular", "work.who.status_casual", "work.who.unpaid_overall",
      "work.who.unpaid_share_male",
      "work.who.flfpr_mar_never_married", "work.who.flfpr_mar_married", "work.who.flfpr_mar_widowed", "work.who.flfpr_mar_divorced",
      "work.who.flfpr_relig_hindu", "work.who.flfpr_relig_muslim", "work.who.flfpr_relig_christian", "work.who.flfpr_relig_sikh", "work.who.flfpr_relig_buddhist", "work.who.flfpr_relig_jain",
      "work.who.ur_edu_not_literate", "work.who.ur_edu_below_primary", "work.who.ur_edu_primary", "work.who.ur_edu_middle", "work.who.ur_edu_secondary", "work.who.ur_edu_higher_secondary", "work.who.ur_edu_diploma", "work.who.ur_edu_graduate", "work.who.ur_edu_postgraduate",
      "work.who.ur_youth_edu_not_literate", "work.who.ur_youth_edu_below_primary", "work.who.ur_youth_edu_primary", "work.who.ur_youth_edu_middle", "work.who.ur_youth_edu_secondary", "work.who.ur_youth_edu_higher_secondary", "work.who.ur_youth_edu_diploma", "work.who.ur_youth_edu_postgraduate",
      "work.who.casual_share_st", "work.who.casual_share_obc", "work.who.casual_share_others",
      "work.who.regular_share_st", "work.who.regular_share_sc", "work.who.regular_share_obc", "work.who.regular_share_others",
      "work.who.wage_caste_st", "work.who.wage_caste_sc", "work.who.wage_caste_obc", "work.who.wage_caste_others",
      "work.who.informal_share_st", "work.who.informal_share_sc", "work.who.informal_share_obc", "work.who.informal_share_others",
      "work.who.ur_st", "work.who.ur_sc", "work.who.ur_obc", "work.who.ur_others",
      "work.who.ur_age_15_29", "work.who.ur_age_30_59", "work.who.ur_age_60plus",
      "work.who.ur_youth_male", "work.who.ur_youth_female", "work.who.ur_youth_person",
      "work.who.neet_female", "work.who.neet_male", "work.who.neet_person",
      "work.who.self_emp_rural", "work.who.regular_rural", "work.who.casual_rural",
      "work.who.self_emp_urban", "work.who.regular_urban", "work.who.casual_urban",
      "work.who.informal_rural", "work.who.informal_urban",
      "work.who.ind_agri", "work.who.ind_manufacturing", "work.who.ind_construction", "work.who.ind_trade_services", "work.who.ind_public_other", "work.who.ind_mining_utilities",
      "work.who.salaried_no_socsec", "work.who.salaried_no_contract", "work.who.salaried_no_paidleave",
      "work.who.wage_formal", "work.who.wage_informal", "work.who.wage_male", "work.who.wage_female", "work.who.wage_casual_daily", "work.who.mpce_median",
      "work.who.informal_mpce_q1", "work.who.informal_mpce_q2", "work.who.informal_mpce_q3", "work.who.informal_mpce_q4",
      "work.who.flfpr_state_choropleth",
      "work.who.flfpr_state_sikkim", "work.who.flfpr_state_nagaland", "work.who.flfpr_state_meghalaya", "work.who.flfpr_state_arunachal_pradesh", "work.who.flfpr_state_himachal_pradesh", "work.who.flfpr_state_chhattisgarh", "work.who.flfpr_state_jammu_kashmir", "work.who.flfpr_state_rajasthan", "work.who.flfpr_state_ladakh", "work.who.flfpr_state_manipur", "work.who.flfpr_state_assam", "work.who.flfpr_state_odisha", "work.who.flfpr_state_madhya_pradesh", "work.who.flfpr_state_dadra_nagar_haveli_and_daman_diu", "work.who.flfpr_state_tamil_nadu", "work.who.flfpr_state_jharkhand", "work.who.flfpr_state_gujarat", "work.who.flfpr_state_uttarakhand", "work.who.flfpr_state_tripura", "work.who.flfpr_state_telangana", "work.who.flfpr_state_andhra_pradesh", "work.who.flfpr_state_mizoram", "work.who.flfpr_state_maharashtra", "work.who.flfpr_state_kerala", "work.who.flfpr_state_west_bengal", "work.who.flfpr_state_karnataka", "work.who.flfpr_state_chandigarh", "work.who.flfpr_state_andaman_nicobar_islands", "work.who.flfpr_state_puducherry", "work.who.flfpr_state_goa", "work.who.flfpr_state_uttar_pradesh", "work.who.flfpr_state_punjab", "work.who.flfpr_state_bihar", "work.who.flfpr_state_haryana", "work.who.flfpr_state_lakshadweep", "work.who.flfpr_state_delhi",
      "work.who.goodjob_a_urban_upper_male_grad", "work.who.goodjob_b_urban_obc_male_sec", "work.who.goodjob_c_rural_obc_male_sec", "work.who.goodjob_d_rural_sc_male_loed", "work.who.goodjob_e_rural_scst_female_loed"
    ],
    // Curated lenses — each chart re-cuts the same 2025 workforce by a different identity
    // or place. Mostly latestBars (a single 2025 cross-section). why/read/watch are the
    // chart-note fallback until LLM chartExplainers run.
    visualPlan: [
      { chart: "latestBars", indicator: "work.who.lfpr_female", title: "Whether you work at all comes down, first, to your sex", size: "hero", window: "latest", beat: "gender", unit: "% in the labour force, 15+ (ps+ss)",
        subtitle: "PLFS 2025 microdata · labour-force participation by sex",
        series: [ { indicator: "work.who.lfpr_male", label: "Men" }, { indicator: "work.who.lfpr_female", label: "Women" } ],
        why: "Before education, caste or geography, the deepest fault line in who works in India is sex: nearly four in five men are in the workforce, but only two in five women.", read: "Two bars — male participation almost double the female rate.", watch: "Even the 40% female figure leans heavily on unpaid family work that the survey only recently counts fully; paid female work is rarer still." },
      { chart: "latestBars", indicator: "work.who.status_self_emp", title: "Most Indians don't have a job — they have work", size: "feature", window: "latest", beat: "anatomy", unit: "% of all workers",
        subtitle: "PLFS 2025 microdata · workers by status in employment",
        series: [ { indicator: "work.who.status_self_emp", label: "Self-employed" }, { indicator: "work.who.status_regular", label: "Regular salaried" }, { indicator: "work.who.status_casual", label: "Casual labour" }, { indicator: "work.who.unpaid_overall", label: "…of which unpaid family" } ],
        why: "The single most important fact about the shape of Indian work: the typical worker runs a tiny own-account enterprise or helps the family, rather than holding a salaried job.", read: "Self-employment is over half of all work; a salaried job with a payslip is a minority experience; one in seven workers is an unpaid family helper.", watch: "'Self-employed' spans a shopkeeper and a subsistence farmer; the label flattens enormous differences in security and earnings." },
      { chart: "latestBars", indicator: "work.who.informal_overall", title: "Nine in ten Indians work with no contract and no safety net", size: "feature", window: "latest", beat: "informality", unit: "% of workers in informal employment",
        subtitle: "PLFS 2025 microdata · informal employment, overall and by location",
        series: [ { indicator: "work.who.informal_overall", label: "All workers" }, { indicator: "work.who.informal_rural", label: "Rural" }, { indicator: "work.who.informal_urban", label: "Urban" } ],
        why: "Informality is the water Indian workers swim in: no written contract, no social security, no paid leave — for the overwhelming majority.", read: "Around 85% of all jobs are informal; in the countryside it is nine in ten.", watch: "Informal is not only the unorganised sector — it includes informal jobs inside formal firms, which is why even cities sit near 70%." },
      { chart: "latestBars", indicator: "work.who.ur_edu_graduate", title: "The cruel paradox: the more you study, the more likely you're jobless", size: "feature", window: "latest", beat: "education", unit: "% unemployed, 15+ (ps+ss)",
        subtitle: "PLFS 2025 microdata · unemployment rate by education level",
        series: [ { indicator: "work.who.ur_edu_not_literate", label: "Not literate" }, { indicator: "work.who.ur_edu_below_primary", label: "Below primary" }, { indicator: "work.who.ur_edu_primary", label: "Primary" }, { indicator: "work.who.ur_edu_middle", label: "Middle" }, { indicator: "work.who.ur_edu_secondary", label: "Secondary" }, { indicator: "work.who.ur_edu_higher_secondary", label: "Higher secondary" }, { indicator: "work.who.ur_edu_diploma", label: "Diploma" }, { indicator: "work.who.ur_edu_graduate", label: "Graduate" }, { indicator: "work.who.ur_edu_postgraduate", label: "Postgraduate" } ],
        why: "This one chart dissolves the puzzle of low headline unemployment: joblessness is near zero for the unlettered and climbs steeply with every diploma.", read: "Unemployment rises almost monotonically with education — a graduate is many times more likely to be unemployed than someone who never went to school.", watch: "The unlettered cannot afford to be idle and take any work; the educated hold out for jobs worthy of their qualification — and often cannot find them. Joblessness here is the privilege of having options." },
      { chart: "latestBars", indicator: "work.who.ur_youth_edu_postgraduate", title: "For the young, a degree is the riskiest qualification of all", size: "feature", window: "latest", beat: "education-youth", unit: "% unemployed, 15–29 (ps+ss)",
        subtitle: "PLFS 2025 microdata · youth unemployment by education level",
        series: [ { indicator: "work.who.ur_youth_edu_not_literate", label: "Not literate" }, { indicator: "work.who.ur_youth_edu_below_primary", label: "Below primary" }, { indicator: "work.who.ur_youth_edu_primary", label: "Primary" }, { indicator: "work.who.ur_youth_edu_middle", label: "Middle" }, { indicator: "work.who.ur_youth_edu_secondary", label: "Secondary" }, { indicator: "work.who.ur_youth_edu_higher_secondary", label: "Higher secondary" }, { indicator: "work.who.ur_youth_edu_diploma", label: "Diploma" }, { indicator: "work.who.ur_youth_edu_graduate", label: "Graduate" }, { indicator: "work.who.ur_youth_edu_postgraduate", label: "Postgraduate" } ],
        why: "The education paradox is sharpest at the start of working life, where India's graduate-unemployment crisis actually lives.", read: "Among the young, unemployment for graduates and postgraduates runs to a quarter or more — a different universe from school-leavers.", watch: "These are the most visible, most vocal jobless: educated, urban-leaning young people queuing for formal jobs that the economy is not creating fast enough." },
      { chart: "latestBars", indicator: "work.who.unpaid_share_female", title: "Of the women who do work, almost a third are paid nothing", size: "feature", window: "latest", beat: "gender-unpaid", unit: "% of that sex's workers who are unpaid family labour",
        subtitle: "PLFS 2025 microdata · unpaid family workers, by sex",
        series: [ { indicator: "work.who.unpaid_share_female", label: "Women" }, { indicator: "work.who.unpaid_share_male", label: "Men" } ],
        why: "Women's work is not only rarer, it is far more likely to be invisible — unpaid labour on the family farm or in the family shop.", read: "Nearly 29% of working women are unpaid family helpers, against about 8% of working men.", watch: "Counting unpaid family work as 'employment' is what lifts female participation on paper; it tells you little about a woman's own income or independence." },
      { chart: "latestBars", indicator: "work.who.flfpr_mar_divorced", title: "Marriage decides whether a woman works — necessity decides harder", size: "feature", window: "latest", beat: "gender-marriage", unit: "female LFPR, % (ps+ss)",
        subtitle: "PLFS 2025 microdata · female participation by marital status",
        series: [ { indicator: "work.who.flfpr_mar_never_married", label: "Never married" }, { indicator: "work.who.flfpr_mar_married", label: "Married" }, { indicator: "work.who.flfpr_mar_widowed", label: "Widowed" }, { indicator: "work.who.flfpr_mar_divorced", label: "Divorced / separated" } ],
        why: "A woman's place in the labour market shifts with her marital status in a way a man's never does.", read: "Participation is low for the never-married (many still studying), higher among the married, and highest by far among the divorced and separated — for whom work is not a choice.", watch: "The divorced/separated figure is a small group, but it is the clearest sign that much female work is driven by need, not opportunity." },
      { chart: "latestBars", indicator: "work.who.flfpr_relig_muslim", title: "A woman's faith tracks whether she works", size: "small", window: "latest", beat: "religion", unit: "female LFPR, % (ps+ss)",
        subtitle: "PLFS 2025 microdata · female participation by religion",
        series: [ { indicator: "work.who.flfpr_relig_hindu", label: "Hindu" }, { indicator: "work.who.flfpr_relig_muslim", label: "Muslim" }, { indicator: "work.who.flfpr_relig_christian", label: "Christian" }, { indicator: "work.who.flfpr_relig_sikh", label: "Sikh" }, { indicator: "work.who.flfpr_relig_buddhist", label: "Buddhist" }, { indicator: "work.who.flfpr_relig_jain", label: "Jain" } ],
        why: "Religion is another axis along which the female labour market splits, with Muslim women's participation among the lowest.", read: "Christian and Buddhist women participate most; Muslim and Jain women least.", watch: "Religion here is tangled with region, urbanisation and household income — it is a correlate, not a cause, of who works." },
      { chart: "choropleth", indicator: "work.who.flfpr_state_choropleth", title: "Same country, a completely different deal for women in every state", size: "feature", window: "latest", beat: "geography", unit: "female LFPR, %", ramp: "sunset", rankLabel: "Most women working", bottomLabel: "Fewest women working",
        subtitle: "PLFS 2025 microdata · female labour-force participation (ps+ss, 15+) by state",
        why: "Where a woman is born changes her odds of working more than almost any national policy — the spread across the map is enormous.", read: "Each state is shaded by its female participation rate: deep tones across the North-East and hill states where most women work, palest in the northern plains and big cities where few do.", watch: "Counter-intuitively, the darkest states are often poorer and more agricultural, where women work the land out of necessity; the palest include rich, urban Delhi. High participation is not automatically the better deal — it tangles prosperity, culture and the kind of work on offer." },
      { chart: "latestBars", indicator: "work.who.casual_share_sc", title: "Who gets handed the hardest, least secure work", size: "feature", window: "latest", beat: "caste", unit: "% of that group's workers in casual labour",
        subtitle: "PLFS 2025 microdata · casual-labour share by social group",
        series: [ { indicator: "work.who.casual_share_st", label: "Scheduled Tribe" }, { indicator: "work.who.casual_share_sc", label: "Scheduled Caste" }, { indicator: "work.who.casual_share_obc", label: "OBC" }, { indicator: "work.who.casual_share_others", label: "Others" } ],
        why: "Caste still sorts Indians into kinds of work: the most insecure, day-to-day casual labour falls disproportionately on Dalits and Adivasis.", read: "More than a quarter of SC and ST workers are casual labourers, against one in eight 'Other' (upper-caste) workers.", watch: "Casual work means no income on a day without work — the precarity gradient runs straight down the caste hierarchy." },
      { chart: "latestBars", indicator: "work.who.regular_share_others", title: "...and who gets the secure salaried jobs", size: "small", window: "latest", beat: "caste-regular", unit: "% of that group's workers in regular salaried jobs",
        subtitle: "PLFS 2025 microdata · regular-salaried share by social group",
        series: [ { indicator: "work.who.regular_share_st", label: "Scheduled Tribe" }, { indicator: "work.who.regular_share_sc", label: "Scheduled Caste" }, { indicator: "work.who.regular_share_obc", label: "OBC" }, { indicator: "work.who.regular_share_others", label: "Others" } ],
        why: "The mirror image of the casual-work chart: the secure, salaried jobs concentrate at the top of the caste order.", read: "'Other' workers are more than twice as likely as STs to hold a regular salaried job.", watch: "Reservation in government jobs lifts the salaried share for SC/ST/OBC somewhat, but the private-sector gap remains wide." },
      { chart: "latestBars", indicator: "work.who.wage_caste_others", title: "The caste pay gap", size: "small", window: "latest", beat: "caste-wage", unit: "₹/month, median salaried wage",
        subtitle: "PLFS 2025 microdata · median monthly salaried earnings by social group",
        series: [ { indicator: "work.who.wage_caste_st", label: "Scheduled Tribe" }, { indicator: "work.who.wage_caste_sc", label: "Scheduled Caste" }, { indicator: "work.who.wage_caste_obc", label: "OBC" }, { indicator: "work.who.wage_caste_others", label: "Others" } ],
        why: "Even among those who do hold a salaried job, what it pays still tracks caste.", read: "The median 'Other' salaried worker out-earns the median SC salaried worker by a wide margin.", watch: "Part of this gap is the kind of jobs each group holds (sweeper vs manager), not pay for identical work — but that sorting is itself the inequality." },
      { chart: "latestBars", indicator: "work.who.ur_sc", title: "Why measured unemployment is lowest for the most disadvantaged", size: "small", window: "latest", beat: "caste-unemployment", unit: "% unemployed, 15+",
        subtitle: "PLFS 2025 microdata · unemployment rate by social group",
        series: [ { indicator: "work.who.ur_st", label: "Scheduled Tribe" }, { indicator: "work.who.ur_sc", label: "Scheduled Caste" }, { indicator: "work.who.ur_obc", label: "OBC" }, { indicator: "work.who.ur_others", label: "Others" } ],
        why: "Unemployment rates barely differ by caste — and that flatness is itself revealing.", read: "All four groups cluster near the low national rate.", watch: "Low measured unemployment among the poorest does not mean they are doing well — it means they cannot afford to search and take whatever casual work exists. Read this beside the casual-labour chart." },
      { chart: "latestBars", indicator: "work.who.ur_age_15_29", title: "Unemployment in India is almost entirely a young person's condition", size: "feature", window: "latest", beat: "age", unit: "% unemployed",
        subtitle: "PLFS 2025 microdata · unemployment rate by age band",
        series: [ { indicator: "work.who.ur_age_15_29", label: "Youth (15–29)" }, { indicator: "work.who.ur_age_30_59", label: "Prime age (30–59)" }, { indicator: "work.who.ur_age_60plus", label: "Older (60+)" } ],
        why: "The headline jobless rate of under 4% hides the fact that unemployment is overwhelmingly concentrated among the young.", read: "Youth unemployment dwarfs the near-zero rate for prime-age and older workers.", watch: "Older workers show almost no unemployment because the poor cannot retire — they keep working, formally or not, until they can't." },
      { chart: "latestBars", indicator: "work.who.neet_female", title: "The young women who vanish from the data", size: "feature", window: "latest", beat: "neet", unit: "% of youth 15–29 not in employment, education or training",
        subtitle: "PLFS 2025 microdata · NEET rate by sex",
        series: [ { indicator: "work.who.neet_female", label: "Young women" }, { indicator: "work.who.neet_male", label: "Young men" }, { indicator: "work.who.neet_person", label: "All youth" } ],
        why: "The missing-women story has a sharp young edge: a huge share of young women are neither working, studying, nor training.", read: "More than four in ten young women are NEET, against fewer than one in ten young men.", watch: "Most female NEET is unpaid domestic and care work, which the statistics don't count as employment — 'doing nothing' is a measurement artefact, not idleness." },
      { chart: "latestBars", indicator: "work.who.self_emp_rural", title: "In the village, you mostly work for yourself", size: "small", window: "latest", beat: "rural", unit: "% of rural workers",
        subtitle: "PLFS 2025 microdata · rural workers by status",
        series: [ { indicator: "work.who.self_emp_rural", label: "Self-employed" }, { indicator: "work.who.regular_rural", label: "Regular salaried" }, { indicator: "work.who.casual_rural", label: "Casual labour" } ],
        why: "The rural and urban labour markets are almost different economies; in the countryside, self-employment and casual work dominate.", read: "Six in ten rural workers are self-employed, mostly on the farm; salaried jobs are scarce.", watch: "Rural self-employment is often subsistence farming, not entrepreneurship — low, uncertain returns." },
      { chart: "latestBars", indicator: "work.who.regular_urban", title: "In the city, you mostly work for a wage", size: "small", window: "latest", beat: "urban", unit: "% of urban workers",
        subtitle: "PLFS 2025 microdata · urban workers by status",
        series: [ { indicator: "work.who.self_emp_urban", label: "Self-employed" }, { indicator: "work.who.regular_urban", label: "Regular salaried" }, { indicator: "work.who.casual_urban", label: "Casual labour" } ],
        why: "Cities are where the salaried job lives — about half of urban workers have one, against one in seven in villages.", read: "Regular salaried work is the largest urban category, with self-employment close behind.", watch: "A salaried urban job still often lacks a contract or social security; 'regular' is not the same as 'formal'." },
      { chart: "latestBars", indicator: "work.who.ind_agri", title: "What India's workers actually do all day", size: "feature", window: "latest", beat: "industry", unit: "% of all workers",
        subtitle: "PLFS 2025 microdata · workers by broad industry",
        series: [ { indicator: "work.who.ind_agri", label: "Agriculture" }, { indicator: "work.who.ind_trade_services", label: "Trade, transport & services" }, { indicator: "work.who.ind_construction", label: "Construction" }, { indicator: "work.who.ind_manufacturing", label: "Manufacturing" }, { indicator: "work.who.ind_public_other", label: "Public admin, education, health" }, { indicator: "work.who.ind_mining_utilities", label: "Mining & utilities" } ],
        why: "For all the talk of a services superpower, the largest single thing Indian workers do is farm.", read: "Agriculture still employs over 40% of workers; manufacturing — the classic ladder out of poverty — holds barely one in eight.", watch: "Agriculture is about 40% of jobs but only ~15% of GDP: the productivity trap that keeps incomes low for the most workers." },
      { chart: "latestBars", indicator: "work.who.salaried_no_socsec", title: "Even a salaried job often isn't a 'good' job", size: "small", window: "latest", beat: "formality-detail", unit: "% of salaried workers without it",
        subtitle: "PLFS 2025 microdata · regular-salaried workers lacking each protection",
        series: [ { indicator: "work.who.salaried_no_contract", label: "No written contract" }, { indicator: "work.who.salaried_no_socsec", label: "No social security" }, { indicator: "work.who.salaried_no_paidleave", label: "No paid leave" } ],
        why: "The salaried job is the aspiration — but for half of those who have one, it comes without the protections that are supposed to define it.", read: "More than half of salaried workers have no written contract and no social security; nearly half get no paid leave.", watch: "This is informal employment inside the formal-looking economy — a payslip without the safety net." },
      { chart: "latestBars", indicator: "work.who.wage_formal", title: "What a month of work pays — and who gets which deal", size: "feature", window: "latest", beat: "wages", unit: "₹/month, median",
        subtitle: "PLFS 2025 microdata · median monthly salaried earnings",
        series: [ { indicator: "work.who.wage_formal", label: "Formal salaried (has social security)" }, { indicator: "work.who.wage_informal", label: "Informal salaried (none)" }, { indicator: "work.who.wage_male", label: "Men (all salaried)" }, { indicator: "work.who.wage_female", label: "Women (all salaried)" } ],
        why: "Pay is where every divide in this story compounds: formal vs informal, men vs women.", read: "A formal salaried worker earns roughly double an informal one; men out-earn women across the board.", watch: "These are medians for salaried workers only — the self-employed majority and casual labourers (about ₹400 a day) earn less and far less predictably." },
      { chart: "latestBars", indicator: "work.who.informal_mpce_q1", title: "The poorer the household, the more precarious the work", size: "feature", window: "latest", beat: "working-poor", unit: "% of workers in informal employment",
        subtitle: "PLFS 2025 microdata · informality by household consumption quartile",
        series: [ { indicator: "work.who.informal_mpce_q1", label: "Poorest 25%" }, { indicator: "work.who.informal_mpce_q2", label: "Lower-middle" }, { indicator: "work.who.informal_mpce_q3", label: "Upper-middle" }, { indicator: "work.who.informal_mpce_q4", label: "Richest 25%" } ],
        why: "Informality and poverty reinforce each other: bad work keeps households poor, and poor households can only get bad work.", read: "Over 90% of workers in the poorest households are informal, falling steadily to about 70% in the richest.", watch: "Even in the top consumption quartile most work is informal — formality is a thin sliver at the very top, not a middle-class norm." },
      { chart: "latestBars", indicator: "work.who.goodjob_a_urban_upper_male_grad", title: "Stack the advantages, and this is the gap", size: "hero", window: "latest", beat: "compounding", unit: "% holding a secure formal job",
        subtitle: "PLFS 2025 microdata · share with a regular salaried job + social security, by stacked identity",
        series: [ { indicator: "work.who.goodjob_a_urban_upper_male_grad", label: "Urban · upper-caste · male · graduate" }, { indicator: "work.who.goodjob_b_urban_obc_male_sec", label: "Urban · OBC · male · secondary" }, { indicator: "work.who.goodjob_c_rural_obc_male_sec", label: "Rural · OBC · male · secondary" }, { indicator: "work.who.goodjob_d_rural_sc_male_loed", label: "Rural · Dalit · male · low-educated" }, { indicator: "work.who.goodjob_e_rural_scst_female_loed", label: "Rural · Dalit/Adivasi · woman · low-educated" } ],
        why: "Every divide in this story is a single cut; this is what happens when you stack them. It is the whole argument in one chart.", read: "The share of each profile holding a secure formal job — a regular salary with social security — falls from nearly 40% to almost nothing as advantages strip away.", watch: "The top profile is over a hundred times more likely to hold a good job than the bottom one. Same country, same year, same economy — utterly different odds, decided mostly at birth." }
    ]
  },
  {
    id: "q.econ.inequality",
    question: "How unequal is India?",
    priority: "core",
    // The most contested data topic in Indian economics: the SAME country is
    // "the 4th most equal on earth" (World Bank consumption Gini 25.5) and home
    // to concentration "starker than the British Raj" (World Inequality Lab).
    // They do not contradict — consumption, income and wealth are different
    // rulers with opposite blind spots. The page presents all three plus the
    // methodological fight, rather than picking a winner. `context` locks the
    // packet to exactly these indicators so nothing off-topic can leak in.
    indicators: ["econ.inequality.gini_consumption", "econ.inequality.income_share_top1_wid", "econ.inequality.wealth_share_top1_wid"],
    core: ["econ.inequality.gini_consumption", "econ.inequality.income_share_top1_wid", "econ.inequality.wealth_share_top1_wid"],
    context: [
      "econ.inequality.top1_income_wid", "econ.inequality.top1_income_wb",
      "econ.inequality.income_share_top10_wid",
      "econ.inequality.wealth_share_top10_wid",
      "econ.inequality.cons_dist_top10", "econ.inequality.cons_dist_middle40", "econ.inequality.cons_dist_bottom50",
      "econ.inequality.cons_share_highest20", "econ.inequality.cons_share_lowest20",
      "econ.inequality.cons_share_highest10", "econ.inequality.cons_share_lowest10",
      "econ.inequality.hces_gini_rural", "econ.inequality.hces_gini_urban",
      "econ.inequality.hces_mpce_rural", "econ.inequality.hces_mpce_urban",
      "econ.inequality.hces_mpce_rural_imputed", "econ.inequality.hces_mpce_urban_imputed",
      "econ.inequality.hces_fractile_mpce_rural", "econ.inequality.hces_fractile_mpce_urban",
      "econ.inequality.hces_state_mpce_rural", "econ.inequality.hces_state_mpce_urban",
      "econ.inequality.hces_cons_share_rural", "econ.inequality.hces_cons_share_urban",
      "econ.inequality.hces_mpce_by_caste", "econ.inequality.hces_mpce_by_religion",
      "econ.inequality.plfs_wage_by_caste", "econ.inequality.plfs_gender_ratio_by_caste", "econ.inequality.plfs_wage_by_religion",
      "econ.inequality.poverty_215",
      "econ.inequality.wil_headline_2023"
    ],
    visualPlan: [
      // ACT I — the paradox, in one chart: the same metric, two methods.
      { chart: "multiLine", title: "Same country, two verdicts on inequality", size: "hero", beat: "paradox", unit: "% income share of top 1%",
        subtitle: "Top 1% income share — World Inequality Database (tax + national accounts) vs World Bank (household survey)",
        indicator: "econ.inequality.top1_income_wid",
        series: [
          { indicator: "econ.inequality.top1_income_wid", label: "World Inequality Database method" },
          { indicator: "econ.inequality.top1_income_wb", label: "World Bank survey method" }
        ],
        why: "The whole debate fits in one frame: both lines try to measure the share of income going to the richest 1%, and they disagree sharply because they are built differently.", read: "Two estimates of the same thing over time. The WID line uses tax tabulations and national accounts to catch the top tail; the World Bank line comes from household surveys.", watch: "Surveys miss the very rich (they refuse, or under-report); tax-based estimates impute a full distribution. Neither is 'the truth' — the gap between them is the story." },

      // ACT II — three different rulers.
      { indicator: "econ.inequality.gini_consumption", chart: "line", title: "By what people spend, India looks equal — and more so", size: "feature", window: "full", beat: "consumption",
        subtitle: "World Bank · Gini index of consumption (0 = total equality, 100 = total inequality)",
        why: "The 'most equal' headline comes from here: a consumption Gini that fell to 25.5 in 2022-23, among the lowest in the world.", read: "Each point is the Gini of household consumption in a survey year. Lower means spending is more evenly distributed.", watch: "This measures what households spend, not what they earn or own — and surveys of spending barely reach the rich, whose extra income mostly turns into savings and assets, not visible consumption." },
      { chart: "multiLine", title: "By what people earn, the top is pulling away", size: "feature", beat: "income", unit: "% of pre-tax national income",
        subtitle: "World Inequality Database · share of pre-tax income going to the top, 1922 to 2023",
        indicator: "econ.inequality.income_share_top1_wid",
        series: [
          { indicator: "econ.inequality.income_share_top10_wid", label: "Top 10%" },
          { indicator: "econ.inequality.income_share_top1_wid", label: "Top 1%" }
        ],
        why: "Income tells the opposite story to consumption: the share captured by the top 10% and top 1% has climbed back to, and past, colonial-era highs.", read: "Two rising lines: the share of all pre-tax income taken by the richest 10% and the richest 1%.", watch: "This is a modelled series that leans on tax data; it captures capital income that surveys miss, which is exactly why it runs so much higher than the survey numbers." },
      { chart: "multiLine", title: "By what people own, concentration is extreme", size: "feature", beat: "wealth", unit: "% of net personal wealth",
        subtitle: "World Inequality Database · share of net personal wealth held by the top, 1961 to 2023",
        indicator: "econ.inequality.wealth_share_top1_wid",
        series: [
          { indicator: "econ.inequality.wealth_share_top10_wid", label: "Top 10%" },
          { indicator: "econ.inequality.wealth_share_top1_wid", label: "Top 1%" }
        ],
        why: "Wealth is where inequality is starkest: a small group owns a very large share of everything India has accumulated.", read: "The share of all net personal wealth (property, financial assets, gold, minus debts) held by the richest 10% and 1%.", watch: "Wealth is harder to measure than income; this combines rich lists, tax data and surveys, so treat the level as an estimate and the upward direction as the robust signal." },

      // ACT III — the distribution, top to bottom.
      { chart: "latestBars", title: "How consumption splits, bottom half to top tenth", size: "feature", beat: "distribution", unit: "% of consumption, latest survey",
        subtitle: "World Bank · share of total consumption by group, 2022-23",
        indicator: "econ.inequality.cons_dist_bottom50",
        series: [
          { indicator: "econ.inequality.cons_dist_bottom50", label: "Poorest 50%" },
          { indicator: "econ.inequality.cons_dist_middle40", label: "Middle 40%" },
          { indicator: "econ.inequality.cons_dist_top10", label: "Richest 10%" }
        ],
        why: "The flip side of a low Gini: even on consumption, the poorest half and the richest tenth spend strikingly different amounts.", read: "Each bar is one group's share of all household consumption in the latest survey.", watch: "These three bars sum to 100% of consumption. The same exercise on income or wealth would push far more onto the top bar." },
      { chart: "multiLine", title: "The richest fifth vs the poorest fifth", size: "small", beat: "spread", unit: "% of consumption",
        subtitle: "World Bank · consumption share of the top and bottom 20%",
        indicator: "econ.inequality.cons_share_highest20",
        series: [
          { indicator: "econ.inequality.cons_share_highest20", label: "Richest 20%" },
          { indicator: "econ.inequality.cons_share_lowest20", label: "Poorest 20%" }
        ],
        why: "A simple, durable gap: how much of national consumption the top fifth takes versus the bottom fifth, and how little it has moved.", read: "Two lines across survey years — the share of consumption held by the richest and poorest 20%.", watch: "The gap is wide but fairly stable on consumption; the income and wealth gaps over the same period widened much more." },

      // ACT IV — sub-national, and the survey that says inequality fell.
      { chart: "multiLine", title: "Town and country, and the survey behind the 'falling' claim", size: "feature", beat: "rural-urban", unit: "Gini index (0–100)",
        subtitle: "MoSPI HCES · consumption Gini, rural vs urban, 2011-12 to 2023-24",
        indicator: "econ.inequality.hces_gini_rural",
        series: [
          { indicator: "econ.inequality.hces_gini_urban", label: "Urban" },
          { indicator: "econ.inequality.hces_gini_rural", label: "Rural" }
        ],
        why: "India's own consumption survey shows the Gini falling in both rural and urban areas — the basis for the 'inequality is declining' story.", read: "Two lines: the consumption Gini for rural and urban India across the three latest survey rounds.", watch: "Part of this 2023-24 decline reflects newly counting the value of free government rations and welfare as consumption — a real change in living standards, but also a change in what the survey measures." },
      { indicator: "econ.inequality.hces_fractile_mpce_rural", chart: "tableBars", title: "The spending ladder, rung by rung", size: "feature", beat: "fractile-ladder", unit: "₹ per person per month",
        subtitle: "MoSPI HCES 2023-24 · average rural MPCE by fractile class (computed from the unit-level survey of 1,54,357 rural households)",
        why: "The Gini compresses the whole distribution into one number; this shows the actual rungs. The poorest 5% of rural India spends about ₹1,677 per person a month while the richest 5% spends ₹10,137 — on consumption alone, before income or wealth widen the gap.", read: "Each bar is the average monthly per-person consumption of one fractile of rural India, from the poorest 5% at the bottom to the richest 5% at the top.", watch: "These are consumption averages, not income; the top bar is held down by the fact that the rich save rather than spend most of what they earn — which is exactly why consumption looks more equal than income." },
      { chart: "multiLine", title: "Spending is rising, and the town-country gap is narrowing", size: "small", beat: "mpce-growth", unit: "₹ per person per month",
        subtitle: "MoSPI HCES · average monthly per-capita consumption, current prices",
        indicator: "econ.inequality.hces_mpce_urban",
        series: [
          { indicator: "econ.inequality.hces_mpce_urban", label: "Urban" },
          { indicator: "econ.inequality.hces_mpce_rural", label: "Rural" }
        ],
        why: "The reason poverty fell: average consumption rose for both rural and urban India, and the urban-rural gap shrank from 84% in 2011-12 to about 70% in 2023-24.", read: "Two lines: average monthly per-person consumption in rural and urban India across the survey rounds.", watch: "These are current-price rupees, so part of the rise is just inflation; and the average says nothing about how the gains were split between the bottom and the top." },

      // ACT IV.5 — the inequality the Gini hides: geography.
      { indicator: "econ.inequality.hces_state_mpce_rural", chart: "tableBars", title: "Which India you live in matters as much as which class", size: "feature", beat: "regional", unit: "₹ per person per month",
        subtitle: "MoSPI HCES 2023-24 · average rural MPCE by major state (all-India rural average ₹4,122)",
        why: "A national Gini erases the map. Rural Kerala spends ₹6,611 per person a month — more than twice rural Chhattisgarh's ₹2,739. The gap between Indian states rivals the gap between countries, and it is invisible in any single national number.", read: "Each bar is a major state's average rural monthly per-person consumption, ranked from highest to lowest.", watch: "This is the average for each state; inequality within states (and the urban figures, which run higher) is a separate layer on top of this regional gap." },

      // ACT IV.6 — the inequality the Gini hides: caste & religion (computed from microdata).
      { indicator: "econ.inequality.hces_mpce_by_caste", chart: "tableBars", title: "The consumption gap that runs along caste", size: "feature", beat: "caste", unit: "₹ per person per month",
        subtitle: "Computed from HCES 2023-24 unit-level microdata · average MPCE by social group of the household head",
        why: "The factsheet never publishes this, but the microdata does: average consumption falls in a clean caste gradient. A Scheduled Tribe household spends about ₹3,614 per person a month against ₹6,148 for 'Others' — a 41% gap that no single national Gini reveals.", read: "Each bar is a social group's average monthly per-person consumption: Others (forward castes), OBC, Scheduled Caste, Scheduled Tribe.", watch: "Computed by us from the unit data and calibrated to the published national average; the gap between groups is robust, the exact rupee level carries a small margin. This is consumption, not wealth — the asset gap by caste is wider still." },
      { indicator: "econ.inequality.hces_mpce_by_religion", chart: "tableBars", title: "And along religion", size: "small", beat: "religion", unit: "₹ per person per month",
        subtitle: "Computed from HCES 2023-24 unit-level microdata · average MPCE by religion of the household head",
        why: "The same microdata splits consumption by religion: Jain and Sikh households spend well above the Hindu average, while Muslim households spend about 10% below it.", read: "Each bar is a religious group's average monthly per-person consumption.", watch: "Group averages hide wide spread inside each community; and smaller groups (e.g. Jain) are a tiny share of the population, so their average rests on fewer households." },

      // ACT IV.7 — the earnings side: wages by caste & gender (PLFS microdata).
      { indicator: "econ.inequality.plfs_wage_by_caste", chart: "tableBars", title: "The same gap in what a job pays", size: "feature", beat: "wage-caste", unit: "₹ per month, regular-salaried",
        subtitle: "Computed from PLFS 2023-24 unit-level microdata · average monthly earnings of regular wage/salaried workers (validated against the published ₹21,000)",
        why: "Consumption is the gap after the fact; wages are where it starts. Among regular salaried workers, a forward-caste ('Others') worker earns about ₹25,957 a month against ₹16,516 for a Scheduled Caste worker — a 36% pay gap inside the same kind of job.", read: "Each bar is the average monthly wage of a regular salaried worker by social group: Others, OBC, Scheduled Tribe, Scheduled Caste.", watch: "Regular salaried workers are a minority (about a fifth of all workers); this is the pay gap among those who hold the most secure jobs, so it understates the gap across all work. Our figure reproduces the published national average exactly." },
      { indicator: "econ.inequality.plfs_gender_ratio_by_caste", chart: "tableBars", title: "Caste and gender stack on top of each other", size: "feature", beat: "gender-caste", unit: "women's pay as % of men's",
        subtitle: "Computed from PLFS 2023-24 unit-level microdata · female regular-salaried wage as a share of male, by caste",
        why: "The two disadvantages compound. A forward-caste woman earns 84% of what a forward-caste man does; a Scheduled Caste or Scheduled Tribe woman earns just 63% of her male counterpart. The gender pay gap is widest exactly where the caste gap is widest.", read: "Each bar is women's average regular wage as a percentage of men's, within that caste group. 100 would mean parity; lower means a wider gap.", watch: "This compares women and men inside the same caste; it does not adjust for hours, occupation or experience — it is the raw gap a worker actually experiences, not a like-for-like estimate." },
      { indicator: "econ.inequality.plfs_wage_by_religion", chart: "tableBars", title: "And wages split by religion too", size: "small", beat: "wage-religion", unit: "₹ per month, regular-salaried",
        subtitle: "Computed from PLFS 2023-24 unit-level microdata · average monthly regular-salaried earnings by religion",
        why: "On the earnings side too, Muslim regular-salaried workers earn about ₹17,700 a month against ₹21,300 for Hindu workers, with Christian and Jain workers higher still.", read: "Each bar is the average monthly regular wage of workers by religion.", watch: "Composition matters: groups differ in how many work in salaried jobs at all, so this is the wage among the salaried, not average income across everyone." },

      // ACT V — the other half of the story.
      { indicator: "econ.inequality.poverty_215", chart: "line", title: "The other half: extreme poverty fell sharply", size: "small", window: "full", beat: "poverty",
        subtitle: "World Bank · share of people below $2.15/day (2017 PPP)",
        why: "Rising top-end inequality and falling extreme poverty are both true at once — the bottom rose even as the top pulled away faster.", read: "The share of Indians living below the international extreme-poverty line, falling over time.", watch: "Less extreme poverty does not mean less inequality: the floor can rise while the ceiling rises faster. Hold this chart beside the income and wealth lines, not instead of them." }
    ]
  },
  {
    id: "q.econ.borrow",
    question: "How does India borrow?",
    priority: "core",
    indicators: ["banking.idh.credit_monthly", "credit.bis.total_credit_quarterly", "credit.bis.credit_gap_quarterly", "credit.imf.household_debt_pct_gdp"],
    core: ["banking.idh.credit_monthly"],
    context: ["banking.rbi.sibc_sectoral_deployment_monthly", "banking.rbi.bank_credit_fortnightly", "banking.rbi.commercial_survey_fortnightly", "credit.bis.total_credit_quarterly", "credit.bis.credit_gap_quarterly", "credit.imf.household_debt_pct_gdp"],
    visualPlan: [
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLines",
        title: "Where non-food bank credit went",
        subtitle: "IndiaDataHub/RBI · outstanding credit by sector · old classification through 2018, current classification from 2019",
        size: "hero",
        unit: "INR crore",
        series: [
          { indicator: "nonFoodSectoral:personal:Personal Loans", label: "Personal loans" },
          { indicator: "nonFoodSectoral:services:Services", label: "Services" },
          { indicator: "nonFoodSectoral:industry:Industry", label: "Industry" },
          { indicator: "nonFoodSectoral:agriculture:Agriculture", label: "Agriculture" }
        ],
        beat: "answer",
        why: "This gives the long answer: bank credit moved from an industry-led book toward personal and services credit.",
        detail: "The broad credit book used to be read mainly through industry. By April 2026, personal loans are the largest of these four buckets, services are close behind, and industry is no longer the dominant line. The point is not that industry stopped borrowing; it is that the banking system now carries a much larger household-facing and services-facing book.",
        read: "Each line is outstanding credit in INR crore. The pre-2019 segment uses RBI's old classification and the post-2019 segment uses the current classification.",
        watch: "Do not read January 2019 as an ordinary monthly move; it is also a taxonomy boundary."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLatestStack",
        title: "The latest credit mix",
        subtitle: "IndiaDataHub/RBI · selected non-food credit buckets · April 2026",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "nonFoodSectoral:personal:Personal Loans", label: "Personal loans" },
          { indicator: "nonFoodSectoral:services:Services", label: "Services" },
          { indicator: "nonFoodSectoral:industry:Industry", label: "Industry" },
          { indicator: "nonFoodSectoral:agriculture:Agriculture", label: "Agriculture" }
        ],
        beat: "latest-composition",
        why: "The current balance sheet is the simplest way to see why personal credit now leads the story.",
        detail: "The latest mix compresses the long history into one balance-sheet snapshot: personal loans at Rs 69.6 lakh crore, services at Rs 59.5 lakh crore, industry at Rs 45.4 lakh crore, and agriculture at Rs 26.3 lakh crore. That ordering is the article's headline in miniature.",
        read: "Segments are latest outstanding credit amounts. They are selected sector buckets, not every bank asset.",
        watch: "The four buckets cover most non-food credit but are not a household-debt microdata set."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLatestBars",
        title: "What is inside personal loans?",
        subtitle: "IndiaDataHub/RBI · personal-loan subcategories · April 2026",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "nonFoodSectoral:personal:Housing / Mortgage Loans", label: "Housing / mortgage" },
          { indicator: "nonFoodSectoral:personal:Other Personal Loans", label: "Other personal" },
          { indicator: "nonFoodSectoral:personal:Vehicle Loans", label: "Vehicle loans" },
          { indicator: "nonFoodSectoral:personal:Gold Loans", label: "Gold loans" },
          { indicator: "nonFoodSectoral:personal:Credit Card Outstanding", label: "Credit cards" },
          { indicator: "nonFoodSectoral:personal:Loans against Fixed Deposits", label: "Against deposits" },
          { indicator: "nonFoodSectoral:personal:Education Loans", label: "Education" },
          { indicator: "nonFoodSectoral:personal:Consumer Durable Loans", label: "Consumer durables" },
          { indicator: "nonFoodSectoral:personal:Loans against Shares/Bonds", label: "Against shares/bonds" }
        ],
        beat: "personal-composition",
        why: "Personal credit is not one product; housing is the anchor, while other personal, vehicles, gold, cards and education each tell a different story.",
        detail: "Housing is still the largest retail loan stock, but the chart prevents 'personal loans' from becoming a vague label. Other personal loans, vehicles, gold and cards are now large enough to matter separately, and each carries a different borrower behaviour and risk story.",
        read: "Bars are outstanding credit in the latest current-classification month.",
        watch: "Credit-card outstanding is a loan balance, not card spending. Gold loans have a classification caveat."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditGrowthBars",
        title: "Which personal loans grew fastest?",
        subtitle: "IndiaDataHub/RBI · latest outstanding divided by April 2007, where old-classification history exists",
        size: "feature",
        unit: "multiple",
        series: [
          { indicator: "nonFoodSectoral:personal:Other Personal Loans", label: "Other personal" },
          { indicator: "nonFoodSectoral:personal:Credit Card Outstanding", label: "Credit cards" },
          { indicator: "nonFoodSectoral:personal:Personal Loans", label: "Total personal" },
          { indicator: "nonFoodSectoral:personal:Housing / Mortgage Loans", label: "Housing / mortgage" },
          { indicator: "nonFoodSectoral:personal:Vehicle Loans", label: "Vehicle loans" },
          { indicator: "nonFoodSectoral:personal:Education Loans", label: "Education" },
          { indicator: "nonFoodSectoral:personal:Consumer Durable Loans", label: "Consumer durables" }
        ],
        beat: "personal-growth",
        why: "The latest ranking hides the growth story: smaller categories such as cards and other personal loans compounded faster than the housing anchor.",
        detail: "Housing remains the largest rupee stock, but it is not the fastest long-run mover. Other personal loans and credit-card outstanding expanded faster from the 2007 base, showing how retail credit widened beyond the classic home-loan story.",
        read: "A value of 10x means the outstanding stock is ten times its April 2007 level.",
        watch: "Gold is omitted from this long-growth chart because no old-classification monthly pair was found."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLines",
        title: "The personal-loan engine",
        subtitle: "IndiaDataHub/RBI · selected personal-loan categories · old classification through 2018, current from 2019",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "nonFoodSectoral:personal:Housing / Mortgage Loans", label: "Housing / mortgage" },
          { indicator: "nonFoodSectoral:personal:Other Personal Loans", label: "Other personal" },
          { indicator: "nonFoodSectoral:personal:Vehicle Loans", label: "Vehicle loans" },
          { indicator: "nonFoodSectoral:personal:Credit Card Outstanding", label: "Credit cards" },
          { indicator: "nonFoodSectoral:personal:Education Loans", label: "Education" }
        ],
        beat: "personal-shift",
        why: "This shows the path, not just the latest ranking: housing remains the base, while other personal loans became a second large retail bucket.",
        detail: "The line chart shows why the personal-credit story is not a single boom. Housing rises steadily as the base. Other personal loans become the second large line. Vehicles and cards grow into visible smaller channels, while education stays comparatively flat.",
        read: "Each line is an outstanding-stock series in INR crore.",
        watch: "The old/current splice is useful for history but not a perfect unchanged taxonomy."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditGrowthBars",
        title: "Since 2019, gold lending grew fastest",
        subtitle: "IndiaDataHub/RBI · current-classification personal-loan subcategories · Jan 2019 to Apr 2026",
        size: "feature",
        unit: "multiple",
        fromYear: 2019,
        series: [
          { indicator: "nonFoodSectoral:personal:Gold Loans", label: "Gold loans" },
          { indicator: "nonFoodSectoral:personal:Consumer Durable Loans", label: "Consumer durables" },
          { indicator: "nonFoodSectoral:personal:Credit Card Outstanding", label: "Credit cards" },
          { indicator: "nonFoodSectoral:personal:Other Personal Loans", label: "Other personal" },
          { indicator: "nonFoodSectoral:personal:Housing / Mortgage Loans", label: "Housing / mortgage" },
          { indicator: "nonFoodSectoral:personal:Vehicle Loans", label: "Vehicle loans" },
          { indicator: "nonFoodSectoral:personal:Loans against Fixed Deposits", label: "Against deposits" },
          { indicator: "nonFoodSectoral:personal:Education Loans", label: "Education" },
          { indicator: "nonFoodSectoral:personal:Loans against Shares/Bonds", label: "Against shares/bonds" }
        ],
        beat: "gold-surge",
        why: "Gold is too Indian and too visible to bury in a caveat. The comparable current-classification window shows gold loans expanding much faster than the other named personal-loan products.",
        detail: "Gold loans start from a smaller base, so the multiple is not the same as the rupee-stock ranking. But the 2019-to-2026 comparison is still important: gold is the fastest-growing named retail product in the comparable current-classification window.",
        read: "Each bar is April 2026 outstanding divided by January 2019 outstanding.",
        watch: "This is not the long 2007 bridge; gold loans only have current monthly coverage in the IDH probe."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLines",
        title: "Gold became a separate retail-credit story",
        subtitle: "IndiaDataHub/RBI · current-classification smaller personal-loan lines · Jan 2019 to Apr 2026",
        size: "feature",
        unit: "INR crore",
        fromYear: 2019,
        series: [
          { indicator: "nonFoodSectoral:personal:Vehicle Loans", label: "Vehicle loans" },
          { indicator: "nonFoodSectoral:personal:Gold Loans", label: "Gold loans" },
          { indicator: "nonFoodSectoral:personal:Credit Card Outstanding", label: "Credit cards" },
          { indicator: "nonFoodSectoral:personal:Loans against Fixed Deposits", label: "Against deposits" },
          { indicator: "nonFoodSectoral:personal:Education Loans", label: "Education" },
          { indicator: "nonFoodSectoral:personal:Consumer Durable Loans", label: "Consumer durables" }
        ],
        beat: "gold-path",
        why: "The latest personal-credit map is not only homes and unsecured personal loans. Gold loans are now larger than credit-card outstanding and education loans in bank books.",
        detail: "The path matters because gold is not just a high multiple from a tiny base. By April 2026 it has become a sizeable bank-credit line, above cards and education in this comparison, and close enough to vehicles to deserve its own treatment.",
        read: "Lines use only the current RBI classification, so the comparison starts in January 2019.",
        watch: "A gold-loan balance can rise because households borrow more, because gold prices change collateral capacity, or because classification/reporting changes."
      },
      {
        indicator: "credit.bis.total_credit_quarterly",
        chart: "countryMetricLines",
        title: "Household credit is bigger than bank personal loans",
        subtitle: "BIS · credit to households and NPISHs from all sectors · quarterly · adjusted for breaks",
        size: "feature",
        unit: "% of GDP",
        fromYear: 2007,
        series: [
          { indicator: "household_pct_gdp:IN", label: "Households, all lenders" }
        ],
        beat: "household-system-scale",
        why: "RBI/IDH tells us what sits in bank books. BIS tells us how large household credit is across the credit system.",
        detail: "The latest BIS point is 45.5% of GDP in 2025-Q3, or about Rs 150.6 lakh crore in domestic-currency terms. That is larger than RBI/IDH bank personal loans because BIS covers household credit from all sectors, not only loans sitting directly on bank balance sheets.",
        read: "The line is total credit to households and NPISHs from all sectors as a percentage of GDP.",
        watch: "This is not a product breakup. BIS does not split India's household credit into housing, gold, cards or vehicles."
      },
      {
        indicator: "credit.imf.household_debt_pct_gdp",
        chart: "countryMetricLatestBars",
        title: "Household debt, India and peers",
        subtitle: "IMF Global Debt Database · household loans and debt securities · latest available",
        size: "feature",
        unit: "% of GDP",
        series: [
          { indicator: "household_debt_pct_gdp:CAN", label: "Canada" },
          { indicator: "household_debt_pct_gdp:KOR", label: "Korea" },
          { indicator: "household_debt_pct_gdp:THA", label: "Thailand" },
          { indicator: "household_debt_pct_gdp:GBR", label: "UK" },
          { indicator: "household_debt_pct_gdp:MYS", label: "Malaysia" },
          { indicator: "household_debt_pct_gdp:USA", label: "US" },
          { indicator: "household_debt_pct_gdp:CHN", label: "China" },
          { indicator: "household_debt_pct_gdp:FRA", label: "France" },
          { indicator: "household_debt_pct_gdp:DEU", label: "Germany" },
          { indicator: "household_debt_pct_gdp:IND", label: "India" },
          { indicator: "household_debt_pct_gdp:BRA", label: "Brazil" },
          { indicator: "household_debt_pct_gdp:ZAF", label: "South Africa" },
          { indicator: "household_debt_pct_gdp:MEX", label: "Mexico" },
          { indicator: "household_debt_pct_gdp:IDN", label: "Indonesia" }
        ],
        beat: "international-context",
        why: "This prevents an India-only chart from making household borrowing look large or small without a denominator.",
        detail: "India's latest IMF GDD value is 40.8% of GDP, well below Canada, Korea, Thailand, the UK, the US and China, but above Indonesia and Mexico. The comparison changes the tone: India has a fast-changing retail-credit mix, not the world's highest household-debt ratio.",
        read: "Bars are household debt as a share of GDP. Most countries are 2024; Thailand's latest IMF GDD point is 2023.",
        watch: "IMF GDD is annual and broad. Use it for peer context, not Indian product composition."
      },
      {
        indicator: "credit.bis.total_credit_quarterly",
        chart: "countryMetricLines",
        title: "Banks are not the whole credit system",
        subtitle: "BIS · private non-financial sector credit · all lenders vs domestic banks",
        size: "feature",
        unit: "% of GDP",
        fromYear: 2000,
        series: [
          { indicator: "private_nonfinancial_pct_gdp:IN", label: "All lenders" },
          { indicator: "private_nonfinancial_bank_pct_gdp:IN", label: "Domestic banks" }
        ],
        beat: "beyond-banks",
        why: "The RBI charts are bank-credit charts. BIS shows the difference between bank credit and total private non-financial credit.",
        detail: "In 2025-Q3, total private non-financial credit was 97.4% of GDP, while the domestic-bank line was 59.5%. The distance between them is the part of the credit system that the domestic-bank view does not capture directly: non-bank lenders, market credit, foreign sources and other all-lender channels.",
        read: "Both lines are private non-financial credit as a percentage of GDP. The top line is all lenders; the lower line is domestic banks.",
        watch: "The measure is private non-financial credit, not household credit alone."
      },
      {
        indicator: "credit.bis.credit_gap_quarterly",
        chart: "countryMetricLines",
        title: "Is credit running ahead of trend?",
        subtitle: "BIS · private non-financial credit-to-GDP gap · actual minus HP-filter trend",
        size: "feature",
        unit: "percentage points",
        fromYear: 2000,
        series: [
          { indicator: "private_credit_pct_gdp_gap:IN", label: "India" }
        ],
        beat: "risk-context",
        why: "Borrowing composition is one question; whether credit is running hot is another. The BIS gap gives a compact risk lens.",
        detail: "India's latest BIS gap is -3.1 percentage points in 2025-Q3: private non-financial credit is below the BIS long-run trend, not above it. That does not prove there is no stress, but it argues against describing the current story as a simple economy-wide credit boom.",
        read: "Positive values mean private non-financial credit-to-GDP is above its BIS long-run trend; negative values mean it is below trend.",
        watch: "This is an early-warning indicator, not a forecast. BIS explicitly cautions against mechanical policy use."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLatestBars",
        title: "Services credit is finance-heavy",
        subtitle: "IndiaDataHub/RBI · selected services subcategories · April 2026",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "nonFoodSectoral:services:NBFCs", label: "NBFCs" },
          { indicator: "nonFoodSectoral:services:Trade", label: "Trade" },
          { indicator: "nonFoodSectoral:services:Other Services", label: "Other services" },
          { indicator: "nonFoodSectoral:services:Commercial Real Estate", label: "Commercial real estate" },
          { indicator: "nonFoodSectoral:services:Transport Operators", label: "Transport operators" },
          { indicator: "nonFoodSectoral:services:Professional Services", label: "Professional services" }
        ],
        beat: "services-composition",
        why: "Services credit is not just shops and hotels; finance companies, trade and real estate sit inside the services bucket.",
        detail: "NBFCs are the biggest selected services line, which means part of 'services credit' is really credit to financial intermediaries. Trade, other services and commercial real estate add a business-credit layer that is very different from household personal loans.",
        read: "Each bar is latest outstanding credit for a selected services subcategory.",
        watch: "NBFCs include several finance-company types; it is not direct household borrowing."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLines",
        title: "Where services credit went",
        subtitle: "IndiaDataHub/RBI · selected services subcategories · old classification through 2018, current from 2019",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "nonFoodSectoral:services:NBFCs", label: "NBFCs" },
          { indicator: "nonFoodSectoral:services:Trade", label: "Trade" },
          { indicator: "nonFoodSectoral:services:Other Services", label: "Other services" },
          { indicator: "nonFoodSectoral:services:Commercial Real Estate", label: "Commercial real estate" },
          { indicator: "nonFoodSectoral:services:Transport Operators", label: "Transport operators" },
          { indicator: "nonFoodSectoral:services:Tourism, Hotels and Restaurants", label: "Tourism/hotels" },
          { indicator: "nonFoodSectoral:services:Computer Software", label: "Computer software" }
        ],
        beat: "services-history",
        why: "Services became one of the large destinations for bank credit, and the internal path is led by finance-company and trade credit.",
        detail: "The history shows services credit becoming finance-heavy over time rather than simply growing as a broad service-economy proxy. NBFC and trade credit are the key lines to watch because they connect bank balance sheets to onward lending and working-capital flows.",
        read: "Each line is outstanding bank credit to a services subcategory.",
        watch: "Trade, wholesale trade and retail trade are related categories; this chart uses the broader trade line."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLatestBars",
        title: "Priority-sector credit is not one thing",
        subtitle: "IndiaDataHub/RBI · priority-sector line items · April 2026",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "prioritySector:prioritySector:Micro and Small Enterprises", label: "MSEs" },
          { indicator: "prioritySector:agriculture:Agriculture", label: "Agriculture" },
          { indicator: "prioritySector:prioritySector:Weaker Sections", label: "Weaker sections" },
          { indicator: "prioritySector:prioritySector:Housing", label: "Housing" },
          { indicator: "prioritySector:prioritySector:Medium Enterprises", label: "Medium enterprises" },
          { indicator: "prioritySector:personal:Education", label: "Education" },
          { indicator: "prioritySector:prioritySector:Other Priority Sectors", label: "Other priority" },
          { indicator: "prioritySector:prioritySector:Renewable Energy", label: "Renewable energy" },
          { indicator: "prioritySector:industry:Social Infrastructure", label: "Social infrastructure" }
        ],
        beat: "priority-sector",
        why: "Priority-sector lending is a policy category layered over borrower categories, so it is useful context for how banks are directed to lend.",
        detail: "This chart is not another sectoral split of the same loan book. It is the policy lens: MSEs, agriculture, weaker sections and housing show how directed-lending rules shape where bank credit is pushed, sometimes cutting across the borrower categories above.",
        read: "Bars are latest priority-sector outstanding amounts by named line item.",
        watch: "Priority-sector rows are not additive with the non-food sectoral rows above; they are a separate classification lens."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLatestBars",
        title: "Which industries borrow most?",
        subtitle: "IndiaDataHub/RBI · selected industry-detail categories · April 2026",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "industryDetail:industry:Infrastructure", label: "Infrastructure" },
          { indicator: "industryDetail:industry:Power", label: "Power" },
          { indicator: "industryDetail:industry:Basic Metal and Metal Products", label: "Metals" },
          { indicator: "industryDetail:industry:Iron and Steel", label: "Iron & steel" },
          { indicator: "industryDetail:industry:Roads", label: "Roads" },
          { indicator: "industryDetail:industry:Engineering", label: "Engineering" },
          { indicator: "industryDetail:industry:Chemicals", label: "Chemicals" },
          { indicator: "industryDetail:industry:Textiles", label: "Textiles" },
          { indicator: "industryDetail:industry:Food Processing", label: "Food processing" },
          { indicator: "industryDetail:industry:Construction", label: "Construction" },
          { indicator: "industryDetail:industry:Gems and Jewellery", label: "Gems & jewellery" }
        ],
        beat: "industry-composition",
        why: "Industry is smaller as a share than before, but it still has a clear internal hierarchy.",
        detail: "The latest industrial map is concentrated in infrastructure and its related pieces: power, roads, metals and engineering. That is why industry can be smaller than personal loans in the broad chart and still remain central to capital formation.",
        read: "These are industry-detail categories, not the broad industry total.",
        watch: "Sub-industries are nested; do not add child rows to parent rows."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLines",
        title: "Infrastructure still anchors industrial credit",
        subtitle: "IndiaDataHub/RBI · selected industry categories · old classification through 2018, current from 2019",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "industryDetail:industry:Infrastructure", label: "Infrastructure" },
          { indicator: "industryDetail:industry:Power", label: "Power" },
          { indicator: "industryDetail:industry:Roads", label: "Roads" },
          { indicator: "industryDetail:industry:Basic Metal and Metal Products", label: "Metals" },
          { indicator: "industryDetail:industry:Chemicals", label: "Chemicals" }
        ],
        beat: "industry-shift",
        why: "The industry story is not dead; it is concentrated. Infrastructure remains the main industrial borrower even after retail credit became larger.",
        detail: "The industrial-credit story is less about a broad manufacturing surge and more about long-lived, debt-heavy infrastructure. Power and roads sit inside that story, while metals and chemicals form the next tier of borrowers.",
        read: "Each line is outstanding credit to a selected industry-detail category.",
        watch: "The industry table reports borrower industry, not the final use of every rupee."
      },
      {
        indicator: "banking.idh.credit_monthly",
        chart: "idhCreditLines",
        title: "The industrial long tail",
        subtitle: "IndiaDataHub/RBI · selected smaller industry categories · old classification through 2018, current from 2019",
        size: "feature",
        unit: "INR crore",
        series: [
          { indicator: "industryDetail:industry:Engineering", label: "Engineering" },
          { indicator: "industryDetail:industry:Chemicals", label: "Chemicals" },
          { indicator: "industryDetail:industry:Textiles", label: "Textiles" },
          { indicator: "industryDetail:industry:Food Processing", label: "Food processing" },
          { indicator: "industryDetail:industry:Construction", label: "Construction" },
          { indicator: "industryDetail:industry:Gems and Jewellery", label: "Gems & jewellery" },
          { indicator: "industryDetail:industry:Transport Equipment", label: "Transport equipment" }
        ],
        beat: "industry-long-tail",
        why: "Once infrastructure is separated out, industrial credit has many mid-sized borrower clusters rather than one clean second story.",
        detail: "The long tail matters because industrial credit is not only mega infrastructure. Engineering, chemicals, textiles, construction, food processing and gems and jewellery each form smaller credit pockets that move differently over time.",
        read: "Each line is outstanding credit to a selected industry-detail category.",
        watch: "Some categories have parent-child relationships; compare shapes and levels, do not sum the lines as a total."
      }
    ]
  },
  {
    id: "q.econ.compare",
    question: "How does India compare with China, the US, and the world?",
    priority: "core",
    indicators: [
      "econ.compare.gdp_current_usd",
      "econ.compare.gdp_per_capita_current_usd",
      "econ.compare.population_total",
      "econ.compare.gdp_ppp_current_intl",
      "compare.health.life_expectancy",
      "compare.health.under5_mortality",
      "compare.energy.electricity_access",
      "compare.society.internet_users",
      "compare.society.urban_population_share",
      "compare.work.female_labor_participation",
      "world.share.gdp_current_usd"
    ],
    core: [
      "econ.compare.gdp_current_usd",
      "econ.compare.gdp_per_capita_current_usd",
      "econ.compare.population_total",
      "econ.compare.gdp_ppp_current_intl",
      "compare.health.life_expectancy",
      "compare.health.under5_mortality",
      "compare.energy.electricity_access",
      "compare.society.internet_users",
      "compare.society.urban_population_share",
      "compare.work.female_labor_participation",
      "world.share.gdp_current_usd"
    ],
    context: []
  },
  {
    id: "q.health.life",
    question: "How long do Indians live?",
    priority: "core",
    indicators: [
      "people.population.un.life_expectancy",
      "health.who.hale_birth",
      "health.who.life_expectancy_age_60",
      "health.life_expectancy",
      "compare.health.life_expectancy",
      "health.who.under5_mortality",
      "health.who.infant_mortality",
      "health.who.current_health_expenditure_gdp"
    ],
    core: [
      "people.population.un.life_expectancy",
      "health.who.hale_birth",
      "health.who.life_expectancy_age_60",
      "health.life_expectancy",
      "compare.health.life_expectancy"
    ],
    context: [
      "health.who.under5_mortality",
      "health.who.infant_mortality",
      "health.who.current_health_expenditure_gdp",
      "health.un.crude_death_rate"
    ],
    visualPlan: [
      { indicator: "people.population.un.life_expectancy", chart: "line", title: "Life expectancy at birth, by sex", size: "hero", window: "full", beat: "answer",
        why: "The single clearest number for how long Indians live. Three lines — male, female, both sexes — from 2000 to 2030, with the UN's median projection visible after 2024.", read: "Years a newborn of that sex can expect to live given that year's age-specific death rates. The female line sits above the male line by 3 to 4 years in every year. After 2024 the lines become projections, extending to 2030.", watch: "Life expectancy at birth is a period measure, not a prediction for anyone born today. It answers 'if death rates stay exactly as they are now, how long would the average newborn live?' — not 'how long will my child live?'" },
      { chart: "compareLine", title: "India vs the world", size: "feature", beat: "comparison", unit: "years", subtitle: "World Bank · 1960 to latest · life expectancy at birth",
        indicator: "compare.health.life_expectancy",
        why: "India's life expectancy in the context of China, the United States, and the world average. The convergence and the gap are both visible.", read: "Four trajectories from 1960. India started far below the world average, converged rapidly after 1970, and has now nearly caught up to the global line. China pulled away earlier; the US is a benchmark of high-income longevity.", watch: "These are World Bank estimates, which differ slightly from WHO and UN numbers. Differences under 1 year between sources are normal." },
      { indicator: "health.who.hale_birth", chart: "line", title: "Healthy life expectancy at birth", size: "small", window: "full", beat: "normalized",
        why: "Years lived are one thing. Years lived in full health — without disease or disability — is what people actually experience.", read: "WHO estimate of years a newborn can expect to live in full health, adjusted for time lost to illness and disability. The gap between this line and total life expectancy is the lifelong burden of disease.", watch: "A growing HALE is good. A widening gap between HALE and total life expectancy means people are living longer but spending a growing share of those extra years in poor health." },
      { indicator: "health.who.life_expectancy_age_60", chart: "line", title: "Remaining life expectancy at age 60", size: "small", window: "full", beat: "longevity",
        why: "Life expectancy at birth is dominated by child mortality. Survival at 60 measures health in later life, where the next gains must come from.", read: "Additional years someone who has already reached 60 can expect to live. By sex. The female advantage here is larger than at birth — women who reach 60 live longer than men who reach 60.", watch: "This is a period measure for 60-year-olds today, not a projection for today's 30-year-olds when they reach 60." },
      { indicator: "health.life_expectancy", chart: "line", title: "Life expectancy since 1960", size: "feature", window: "full", beat: "level",
        why: "Zoomed out to six decades, the transformation is stark: Indian life expectancy has nearly doubled, from 46 to 72 years.", read: "World Bank estimates from 1960 to 2024. The line climbs steadily for 60 years. The COVID dip around 2020-21 is visible — a rare reversal in a generation-long upward trend — but the long arc is unmistakably upward.", watch: "World Bank methodology differs from WHO and UN. The three will differ by fractions of a year. Trust the trend, not the exact decimal." },
      { indicator: "health.who.under5_mortality", chart: "line", title: "Under-five child mortality rate", size: "small", window: "full", beat: "driver",
        why: "Falling child deaths are the main engine that pushed Indian life expectancy from 46 to 72. Every child who survives to five adds a full lifetime.", read: "Deaths before age five per 1,000 live births. From over 90 to under 30 in two decades. This improvement accounts for the majority of India's life expectancy gain.", watch: "Most low-hanging child-survival gains have been captured. Further life expectancy improvements will increasingly require reducing deaths in middle and older ages." },
      { indicator: "health.who.infant_mortality", chart: "line", title: "Infant mortality rate", size: "small", window: "full", beat: "driver",
        why: "The first year of life is the single riskiest. Infant deaths are the most dependent on institutional healthcare — skilled birth attendants, neonatal units, immunisation.", read: "Deaths before age one per 1,000 live births. Falling from over 60 to under 25. The first days and hours of life are the most dangerous; most infant deaths happen in the neonatal period.", watch: "Infant mortality is harder to reduce than under-five mortality overall, because the interventions — emergency obstetric care, neonatal ICUs — require functioning health facilities, not just community outreach." },
      { indicator: "health.who.current_health_expenditure_gdp", chart: "line", title: "Health expenditure as a share of GDP", size: "small", window: "full", beat: "context",
        why: "Life expectancy is not just biology. It is also a function of what a country spends on health. This provides that structural context.", read: "Current health expenditure as a percentage of GDP. India spends around 3.3% — low by global standards and lower than it spent in 2000. The line has been broadly flat or declining.", watch: "This includes private out-of-pocket spending, which in India is among the highest in the world as a share of total health expenditure. Public health spending alone is closer to 1% of GDP." }
    ]
  },
  {
    id: "q.health.transition",
    slug: "is-india-getting-healthier",
    question: "Is India getting healthier?",
    priority: "core",
    // Flagship merged 2026-06: folds the former q.health.overview into the answerable
    // "Is India getting healthier?" question. Verdict spine = better / mixed / worse /
    // the system / a speculative GLP-1 coda. Blends World Bank HNP + wealth quintiles,
    // NFHS-5/6 (measured), IHME GBD 2023 (modelled burden/causes/risks; non-redistributable
    // — see metadata.redistributable), National Health Accounts, Indica's NSS 80th-round
    // tabulation, NHP 2023 (India's own count of facilities/workforce), and press-verified
    // GLP-1 prices. The three systems disagree by design: GBD models, NFHS measures, NSS asks.
    indicators: ["health.transition.wb.life_expectancy.ind", "health.transition.wb.life_expectancy.wld", "health.transition.wb.life_expectancy.bgd", "health.transition.wb.life_expectancy.chn", "health.transition.wb.life_expectancy.lka", "health.transition.wb.under5_mortality.ind", "health.transition.wb.under5_mortality.wld", "health.transition.wb.under5_mortality.lmc", "health.transition.wb.under5_mortality.bgd", "health.transition.wb.under5_mortality.pak", "health.transition.wb.under5_mortality.vnm", "health.transition.wb.under5_mortality.idn", "health.transition.wb.maternal_mortality.ind", "health.transition.wb.maternal_mortality.wld", "health.transition.wb.maternal_mortality.lmc", "health.transition.wb.maternal_mortality.bgd", "health.transition.wb.maternal_mortality.pak", "health.transition.wb.maternal_mortality.chn", "health.transition.wb.maternal_mortality.vnm", "health.transition.wb.maternal_mortality.idn", "health.transition.wb.maternal_mortality.lka", "health.transition.wb.measles_immunization.ind", "health.transition.wb.measles_immunization.wld", "health.transition.wb.measles_immunization.lmc", "health.transition.wb.measles_immunization.bgd", "health.transition.wb.measles_immunization.pak", "health.transition.wb.measles_immunization.chn", "health.transition.wb.measles_immunization.vnm", "health.transition.wb.measles_immunization.idn", "health.transition.wb.measles_immunization.lka", "health.transition.wb.stunting.ind", "health.transition.wb.stunting.bgd", "health.transition.wb.stunting.pak", "health.transition.wb.stunting.chn", "health.transition.wb.stunting.vnm", "health.transition.wb.stunting.idn", "health.transition.wb.stunting.lka", "health.transition.wb.wasting.ind", "health.transition.nfhs.institutional_births", "health.transition.nfhs.skilled_birth_attendant", "health.transition.nfhs.anc_4plus", "health.transition.nfhs.ifa_180_days", "health.transition.nfhs.c_section", "health.transition.nfhs.rotavirus", "health.transition.nfhs.insurance_households", "health.transition.nfhs.measles_second_dose", "health.transition.nfhs.early_breastfeeding", "health.transition.nfhs.adequate_diet", "health.transition.nfhs.full_immunisation", "health.transition.nfhs.child_stunting", "health.transition.nfhs.child_wasting", "health.transition.nfhs.child_severe_wasting", "health.transition.nfhs.child_underweight", "health.transition.nfhs.women_overweight", "health.transition.nfhs.men_overweight", "health.transition.nfhs.women_high_sugar", "health.transition.nfhs.men_high_sugar", "health.transition.nfhs.women_high_bp", "health.transition.nfhs.men_high_bp", "health.transition.nfhs.women_thin", "health.transition.nfhs.state_spread", "health.transition.nfhs.rural_urban_gaps", "health.transition.wealth_gaps", "health.gbd.dalys_share_ncd", "health.gbd.dalys_share_cmnn", "health.gbd.dalys_share_injury", "health.gbd.dalys_ncd_share_compare", "health.gbd.diabetes_prevalence_compare", "health.gbd.dalys_cause_cardiovascular", "health.gbd.dalys_cause_mental", "health.gbd.dalys_cause_musculoskeletal", "health.gbd.dalys_cause_diabetes_kidney", "health.gbd.dalys_cause_neonatal", "health.gbd.dalys_cause_respiratory_infections_tb", "health.gbd.dalys_cause_enteric", "health.gbd.dalys_cause_neoplasms", "health.gbd.risk_deaths_air_pollution", "health.gbd.risk_deaths_high_blood_pressure", "health.gbd.risk_deaths_high_blood_sugar", "health.gbd.risk_deaths_smoking", "health.gbd.risk_deaths_diet_low_fruits", "health.gbd.risk_deaths_high_bmi", "health.gbd.risk_deaths_high_ldl", "health.gbd.risk_deaths_unsafe_water", "health.gbd.risk_deaths_household_air_pollution", "health.who.hale_birth", "health.life_expectancy", "health.nfhs.state_double_burden", "health.nfhs.child_stunting", "health.nfhs.child_wasting", "health.nfhs.women_overweight", "health.nfhs.men_overweight", "health.nfhs.women_thin", "health.nha.oope_the_pct", "health.nha.ghe_the_pct", "health.nssladder.hosp_cost_public", "health.nssladder.hosp_cost_private", "health.nssladder.hosp_private_share_rural", "health.nssladder.hosp_private_share_urban", "health.nssladder.insurance_covered_rural", "health.nssladder.insurance_covered_urban", "health.nss80.hosp_finance_sources", "health.nss80.govt_bypass_reasons", "health.nss80.childbirth_by_institution", "health.wb.che_gdp.in", "health.wb.che_gdp.bgd", "health.wb.che_gdp.chn", "health.wb.che_gdp.idn", "health.wb.che_gdp.vnm", "health.wb.che_gdp.lka", "health.wb.che_gdp.nga", "health.wb.che_gdp.usa", "health.wb.che_gdp.wld", "health.wb.physicians.in", "health.wb.physicians.wld", "health.wb.beds.in", "health.wb.beds.wld", "health.nhp.mbbs_seats", "health.nhp.public_facilities", "health.nhp.registered_workforce", "health.nhp.doctors_by_state", "health.glp1.price_ladder", "health.gbd.deaths_cardiovascular", "health.gbd.deaths_chronic_respiratory", "health.gbd.deaths_neoplasms", "health.gbd.deaths_diabetes", "health.gbd.deaths_diarrheal", "health.gbd.deaths_lower_respiratory", "health.gbd.deaths_digestive", "health.gbd.deaths_tuberculosis", "health.gbd.deaths_neonatal", "health.gbd.deaths_road_injuries", "health.nhpcod.cod1719_cardiovascular_male", "health.nhpcod.cod1719_cardiovascular_female", "health.nhpcod.cod1719_road_accidents_male", "health.nhpcod.cod1719_road_accidents_female", "health.nhpcod.cod1719_neoplasms_male", "health.nhpcod.cod1719_neoplasms_female", "health.nhpcod.cod1719_fever_unknown_male", "health.nhpcod.cod1719_fever_unknown_female", "health.nhpcod.cod1719_ill_defined_male", "health.nhpcod.cod1719_ill_defined_female", "health.crsmccd.medically_certified_pct", "health.ncrb.accidental_deaths_total", "health.ncrb.suicides_total", "health.ncrb.suicides_male", "health.ncrb.suicides_female", "health.transition.nfhs.c_section_private", "health.transition.nfhs.c_section_public", "health.transition.nfhs.tobacco_men", "health.transition.nfhs.tobacco_women", "health.transition.nfhs.alcohol_men", "health.transition.nfhs.alcohol_women"],
    core: ["health.transition.wb.life_expectancy.ind", "health.transition.wb.life_expectancy.wld", "health.transition.wb.life_expectancy.bgd", "health.transition.wb.life_expectancy.chn", "health.transition.wb.life_expectancy.lka", "health.transition.wb.under5_mortality.ind", "health.transition.wb.under5_mortality.wld", "health.transition.wb.under5_mortality.lmc", "health.transition.wb.under5_mortality.bgd", "health.transition.wb.under5_mortality.pak", "health.transition.wb.under5_mortality.vnm", "health.transition.wb.under5_mortality.idn", "health.transition.wb.maternal_mortality.ind", "health.transition.wb.maternal_mortality.wld", "health.transition.wb.maternal_mortality.lmc", "health.transition.wb.maternal_mortality.bgd", "health.transition.wb.maternal_mortality.pak", "health.transition.wb.maternal_mortality.chn", "health.transition.wb.maternal_mortality.vnm", "health.transition.wb.maternal_mortality.idn", "health.transition.wb.maternal_mortality.lka", "health.transition.wb.measles_immunization.ind", "health.transition.wb.measles_immunization.wld", "health.transition.wb.measles_immunization.lmc", "health.transition.wb.measles_immunization.bgd", "health.transition.wb.measles_immunization.pak", "health.transition.wb.measles_immunization.chn", "health.transition.wb.measles_immunization.vnm", "health.transition.wb.measles_immunization.idn", "health.transition.wb.measles_immunization.lka", "health.transition.wb.stunting.ind", "health.transition.wb.stunting.bgd", "health.transition.wb.stunting.pak", "health.transition.wb.stunting.chn", "health.transition.wb.stunting.vnm", "health.transition.wb.stunting.idn", "health.transition.wb.stunting.lka", "health.transition.wb.wasting.ind", "health.transition.nfhs.institutional_births", "health.transition.nfhs.skilled_birth_attendant", "health.transition.nfhs.anc_4plus", "health.transition.nfhs.ifa_180_days", "health.transition.nfhs.c_section", "health.transition.nfhs.rotavirus", "health.transition.nfhs.insurance_households", "health.transition.nfhs.measles_second_dose", "health.transition.nfhs.early_breastfeeding", "health.transition.nfhs.adequate_diet", "health.transition.nfhs.full_immunisation", "health.transition.nfhs.child_stunting", "health.transition.nfhs.child_wasting", "health.transition.nfhs.child_severe_wasting", "health.transition.nfhs.child_underweight", "health.transition.nfhs.women_overweight", "health.transition.nfhs.men_overweight", "health.transition.nfhs.women_high_sugar", "health.transition.nfhs.men_high_sugar", "health.transition.nfhs.women_high_bp", "health.transition.nfhs.men_high_bp", "health.transition.nfhs.women_thin", "health.transition.nfhs.state_spread", "health.transition.nfhs.rural_urban_gaps", "health.transition.wealth_gaps", "health.gbd.dalys_share_ncd", "health.gbd.dalys_share_cmnn", "health.gbd.dalys_share_injury", "health.gbd.dalys_ncd_share_compare", "health.gbd.diabetes_prevalence_compare", "health.gbd.dalys_cause_cardiovascular", "health.gbd.dalys_cause_mental", "health.gbd.dalys_cause_musculoskeletal", "health.gbd.dalys_cause_diabetes_kidney", "health.gbd.dalys_cause_neonatal", "health.gbd.dalys_cause_respiratory_infections_tb", "health.gbd.dalys_cause_enteric", "health.gbd.dalys_cause_neoplasms", "health.gbd.risk_deaths_air_pollution", "health.gbd.risk_deaths_high_blood_pressure", "health.gbd.risk_deaths_high_blood_sugar", "health.gbd.risk_deaths_smoking", "health.gbd.risk_deaths_diet_low_fruits", "health.gbd.risk_deaths_high_bmi", "health.gbd.risk_deaths_high_ldl", "health.gbd.risk_deaths_unsafe_water", "health.gbd.risk_deaths_household_air_pollution", "health.who.hale_birth", "health.life_expectancy", "health.nfhs.state_double_burden", "health.nfhs.child_stunting", "health.nfhs.child_wasting", "health.nfhs.women_overweight", "health.nfhs.men_overweight", "health.nfhs.women_thin", "health.nha.oope_the_pct", "health.nha.ghe_the_pct", "health.nssladder.hosp_cost_public", "health.nssladder.hosp_cost_private", "health.nssladder.hosp_private_share_rural", "health.nssladder.hosp_private_share_urban", "health.nssladder.insurance_covered_rural", "health.nssladder.insurance_covered_urban", "health.nss80.hosp_finance_sources", "health.nss80.govt_bypass_reasons", "health.nss80.childbirth_by_institution", "health.wb.che_gdp.in", "health.wb.che_gdp.bgd", "health.wb.che_gdp.chn", "health.wb.che_gdp.idn", "health.wb.che_gdp.vnm", "health.wb.che_gdp.lka", "health.wb.che_gdp.nga", "health.wb.che_gdp.usa", "health.wb.che_gdp.wld", "health.wb.physicians.in", "health.wb.physicians.wld", "health.wb.beds.in", "health.wb.beds.wld", "health.nhp.mbbs_seats", "health.nhp.public_facilities", "health.nhp.registered_workforce", "health.nhp.doctors_by_state", "health.glp1.price_ladder", "health.gbd.deaths_cardiovascular", "health.gbd.deaths_chronic_respiratory", "health.gbd.deaths_neoplasms", "health.gbd.deaths_diabetes", "health.gbd.deaths_diarrheal", "health.gbd.deaths_lower_respiratory", "health.gbd.deaths_digestive", "health.gbd.deaths_tuberculosis", "health.gbd.deaths_neonatal", "health.gbd.deaths_road_injuries", "health.nhpcod.cod1719_cardiovascular_male", "health.nhpcod.cod1719_cardiovascular_female", "health.nhpcod.cod1719_road_accidents_male", "health.nhpcod.cod1719_road_accidents_female", "health.nhpcod.cod1719_neoplasms_male", "health.nhpcod.cod1719_neoplasms_female", "health.nhpcod.cod1719_fever_unknown_male", "health.nhpcod.cod1719_fever_unknown_female", "health.nhpcod.cod1719_ill_defined_male", "health.nhpcod.cod1719_ill_defined_female", "health.crsmccd.medically_certified_pct", "health.ncrb.accidental_deaths_total", "health.ncrb.suicides_total", "health.ncrb.suicides_male", "health.ncrb.suicides_female", "health.transition.nfhs.c_section_private", "health.transition.nfhs.c_section_public", "health.transition.nfhs.tobacco_men", "health.transition.nfhs.tobacco_women", "health.transition.nfhs.alcohol_men", "health.transition.nfhs.alcohol_women"],
    context: ["health.transition.wbq.stunting_poorest", "health.transition.wbq.stunting_richest", "health.transition.wbq.wasting_poorest", "health.transition.wbq.wasting_richest", "health.transition.wbq.skilled_birth_poorest", "health.transition.wbq.skilled_birth_richest", "health.transition.wbq.money_barrier_poorest", "health.transition.wbq.money_barrier_richest", "health.transition.wbq.distance_barrier_poorest", "health.transition.wbq.distance_barrier_richest", "health.nhp.medical_colleges"],
    visualPlan: [
      // ===== THE VERDICT =====
      { chart: "multiLine", title: "Indians live much longer than they used to", size: "hero", beat: "survival", unit: "years", fromYear: 1960,
        indicator: "health.transition.wb.life_expectancy.ind",
        series: [
          { indicator: "health.transition.wb.life_expectancy.ind", label: "India", emphasis: true },
          { indicator: "health.transition.wb.life_expectancy.wld", label: "World" },
          { indicator: "health.transition.wb.life_expectancy.bgd", label: "Bangladesh" },
          { indicator: "health.transition.wb.life_expectancy.chn", label: "China" },
          { indicator: "health.transition.wb.life_expectancy.lka", label: "Sri Lanka" }
        ],
        why: "The headline answer is survival: India has climbed close to the world line, but not to the best Asian comparators.", read: "World Bank estimates, 1960 to 2024. India is about 72 years, near the world average but below Bangladesh, Sri Lanka and China.", watch: "A period estimate, not a forecast for one child; small source differences are normal." },
      { chart: "multiLine", title: "Living longer, but not always in good health", size: "feature", beat: "hale-gap", unit: "years",
        indicator: "health.who.hale_birth",
        series: [
          { indicator: "health.life_expectancy", label: "Life expectancy" },
          { indicator: "health.who.hale_birth", label: "Healthy life expectancy (HALE)" }
        ],
        why: "The extra years are not all healthy years; the gap is time lived in illness.", read: "Life expectancy against WHO healthy life expectancy. The gap is years lost to disease and disability.", watch: "World Bank and WHO differ by fractions of a year; read the gap, not the decimal." },

      // ===== CLEARLY BETTER: survival and infection in retreat =====
      { chart: "multiLine", title: "The biggest win is children surviving", size: "feature", beat: "child-survival", unit: "deaths per 1,000 live births", fromYear: 1990,
        indicator: "health.transition.wb.under5_mortality.ind",
        series: [
          { indicator: "health.transition.wb.under5_mortality.ind", label: "India", emphasis: true },
          { indicator: "health.transition.wb.under5_mortality.wld", label: "World" },
          { indicator: "health.transition.wb.under5_mortality.lmc", label: "Lower middle income" },
          { indicator: "health.transition.wb.under5_mortality.bgd", label: "Bangladesh" },
          { indicator: "health.transition.wb.under5_mortality.pak", label: "Pakistan" },
          { indicator: "health.transition.wb.under5_mortality.vnm", label: "Vietnam" },
          { indicator: "health.transition.wb.under5_mortality.idn", label: "Indonesia" }
        ],
        why: "Falling child deaths explain much of the life-expectancy gain.", read: "Under-5 deaths per 1,000 live births. India is now below the world and lower-middle-income averages, still above Vietnam and Indonesia.", watch: "Modelled estimates built from registration and survey inputs." },
      { chart: "multiLine", title: "Maternal deaths fell fast, but are still far above the best countries", size: "feature", beat: "mothers", unit: "deaths per 100,000 live births", fromYear: 1985,
        indicator: "health.transition.wb.maternal_mortality.ind",
        series: [
          { indicator: "health.transition.wb.maternal_mortality.ind", label: "India", emphasis: true },
          { indicator: "health.transition.wb.maternal_mortality.wld", label: "World" },
          { indicator: "health.transition.wb.maternal_mortality.lmc", label: "Lower middle income" },
          { indicator: "health.transition.wb.maternal_mortality.bgd", label: "Bangladesh" },
          { indicator: "health.transition.wb.maternal_mortality.pak", label: "Pakistan" },
          { indicator: "health.transition.wb.maternal_mortality.chn", label: "China" },
          { indicator: "health.transition.wb.maternal_mortality.vnm", label: "Vietnam" },
          { indicator: "health.transition.wb.maternal_mortality.idn", label: "Indonesia" },
          { indicator: "health.transition.wb.maternal_mortality.lka", label: "Sri Lanka" }
        ],
        why: "The path matters more than the rank: India fell sharply, while Sri Lanka and China show how much lower the frontier is.", read: "World Bank estimates since 1985. India fell to around 80 per 100,000, but the best Asian comparators are far lower.", watch: "Modelled; read broad levels and direction, not single-year wiggles." },
      { chart: "multiLine", title: "The old infectious killers are fading", size: "feature", beat: "old-killers", unit: "DALYs",
        indicator: "health.gbd.dalys_cause_neonatal",
        series: [
          { indicator: "health.gbd.dalys_cause_neonatal", label: "Neonatal disorders" },
          { indicator: "health.gbd.dalys_cause_enteric", label: "Enteric (diarrhoeal) infections" },
          { indicator: "health.gbd.dalys_cause_respiratory_infections_tb", label: "Respiratory infections & TB" }
        ],
        why: "The diseases of being poor and crowded are falling fast in disease-burden terms.", read: "GBD disease burden from the classic infectious and newborn killers, which have dropped sharply since 1990.", watch: "Absolute DALYs and GBD model estimates; population growth works against the fall, so the decline is real." },
      { chart: "multiLine", title: "Vaccination went from near-zero to near-universal", size: "feature", beat: "vaccines", unit: "% of children", fromYear: 1985,
        indicator: "health.transition.wb.measles_immunization.ind",
        series: [
          { indicator: "health.transition.wb.measles_immunization.ind", label: "India", emphasis: true },
          { indicator: "health.transition.wb.measles_immunization.wld", label: "World" },
          { indicator: "health.transition.wb.measles_immunization.lmc", label: "Lower middle income" },
          { indicator: "health.transition.wb.measles_immunization.bgd", label: "Bangladesh" },
          { indicator: "health.transition.wb.measles_immunization.pak", label: "Pakistan" },
          { indicator: "health.transition.wb.measles_immunization.chn", label: "China" },
          { indicator: "health.transition.wb.measles_immunization.vnm", label: "Vietnam" },
          { indicator: "health.transition.wb.measles_immunization.idn", label: "Indonesia" },
          { indicator: "health.transition.wb.measles_immunization.lka", label: "Sri Lanka" }
        ],
        why: "The child-survival gains are backed by a long vaccine build-out.", read: "World Bank measles immunisation, 1985 to 2024. India climbs from near-zero to high coverage, now above the world and lower-middle-income averages.", watch: "Administrative immunisation series can differ from household-survey estimates." },
      { chart: "multiLine", title: "Care around birth is deepening", size: "feature", beat: "service-reach", unit: "% of births or mothers",
        categoricalX: true, xLabels: ["NFHS-5", "NFHS-6"], subtitle: "Two survey rounds: NFHS-5 (2019-21) and NFHS-6 (2023-24), not annual data",
        indicator: "health.transition.nfhs.institutional_births",
        series: [
          { indicator: "health.transition.nfhs.institutional_births", label: "Institutional births" },
          { indicator: "health.transition.nfhs.skilled_birth_attendant", label: "Skilled attendant" },
          { indicator: "health.transition.nfhs.anc_4plus", label: "4+ antenatal visits" },
          { indicator: "health.transition.nfhs.ifa_180_days", label: "IFA for 180+ days" },
          { indicator: "health.transition.nfhs.c_section", label: "C-section births" }
        ],
        why: "NFHS shows the service-delivery story directly, including the less comfortable rise in C-sections.", read: "NFHS-5 to NFHS-6 national values. Birth attendance is high; antenatal depth improved; C-sections rose sharply.", watch: "Two survey rounds, not annual data. A fast C-section rise needs scrutiny, not automatic alarm." },
      { chart: "multiLine", title: "India is training far more doctors than it used to", size: "feature", beat: "training-pipeline", unit: "MBBS seats", fromYear: 2007,
        indicator: "health.nhp.mbbs_seats",
        series: [ { indicator: "health.nhp.mbbs_seats", label: "MBBS seats", emphasis: true } ],
        why: "Capacity to produce doctors has expanded fast, a genuine investment in the future.", read: "NHP 2023 (National Medical Commission). MBBS seats roughly quadrupled from about 25,000 in 2006-07 to about 104,000 in 2022-23, as colleges rose from 262 to 679.", watch: "Seats are training capacity, not doctors in service; many graduates emigrate or leave clinical work." },

      // ===== MIXED: nutrition and the unevenness =====
      { chart: "multiLine", title: "India's child nutrition improved slowly, and still trails its neighbours", size: "feature", beat: "nutrition-global", unit: "% of children under 5", fromYear: 1989,
        indicator: "health.transition.wb.stunting.ind",
        series: [
          { indicator: "health.transition.wb.stunting.ind", label: "India stunting", emphasis: true },
          { indicator: "health.transition.wb.wasting.ind", label: "India wasting" },
          { indicator: "health.transition.wb.stunting.bgd", label: "Bangladesh" },
          { indicator: "health.transition.wb.stunting.pak", label: "Pakistan" },
          { indicator: "health.transition.wb.stunting.chn", label: "China" },
          { indicator: "health.transition.wb.stunting.vnm", label: "Vietnam" },
          { indicator: "health.transition.wb.stunting.idn", label: "Indonesia" },
          { indicator: "health.transition.wb.stunting.lka", label: "Sri Lanka" }
        ],
        why: "The counterweight to the survival story is the slow grind of nutrition.", read: "World Bank survey-year points. India stunting fell a lot since the late 1980s, but wasting barely improved and better Asian comparators sit much lower.", watch: "Survey-year observations, not smooth annual data; country years differ." },
      { chart: "multiLine", title: "NFHS says stunting fell, but wasting barely moved", size: "feature", beat: "nutrition-india", unit: "% of children",
        categoricalX: true, xLabels: ["NFHS-5", "NFHS-6"], subtitle: "Two survey rounds: NFHS-5 (2019-21) and NFHS-6 (2023-24), not annual data",
        indicator: "health.transition.nfhs.child_stunting",
        series: [
          { indicator: "health.transition.nfhs.child_stunting", label: "Child stunting" },
          { indicator: "health.transition.nfhs.child_wasting", label: "Child wasting" },
          { indicator: "health.transition.nfhs.child_severe_wasting", label: "Severe wasting" },
          { indicator: "health.transition.nfhs.child_underweight", label: "Child underweight" },
          { indicator: "health.transition.nfhs.adequate_diet", label: "Adequate diet, 6-23m" }
        ],
        why: "The India-native survey update: the good news is real, but thin.", read: "NFHS-5 to NFHS-6. Stunting fell to 29.3%, but wasting stayed around 19% and adequate diet stays very low.", watch: "NFHS-6 did not measure anaemia; do not use it for current anaemia claims." },
      { chart: "rankedChange", title: "Between NFHS-5 and NFHS-6, some things improved, some got worse", size: "feature", beat: "mixed-transition", unit: "percentage-point change",
        series: [
          { indicator: "health.transition.nfhs.rotavirus", label: "Rotavirus vaccine" },
          { indicator: "health.transition.nfhs.insurance_households", label: "Health insurance" },
          { indicator: "health.transition.nfhs.measles_second_dose", label: "Measles second dose" },
          { indicator: "health.transition.nfhs.ifa_180_days", label: "IFA for 180+ days" },
          { indicator: "health.transition.nfhs.early_breastfeeding", label: "Early breastfeeding" },
          { indicator: "health.transition.nfhs.adequate_diet", label: "Adequate diet" },
          { indicator: "health.transition.nfhs.child_stunting", label: "Child stunting" },
          { indicator: "health.transition.nfhs.child_wasting", label: "Child wasting" },
          { indicator: "health.transition.nfhs.c_section", label: "C-section births" },
          { indicator: "health.transition.nfhs.women_overweight", label: "Women overweight" },
          { indicator: "health.transition.nfhs.men_high_sugar", label: "Men high blood sugar" },
          { indicator: "health.transition.nfhs.women_high_bp", label: "Women high BP" }
        ],
        diverging: true, baselineYears: 1, latestYears: 1, rowLabel: "Indicator", divergeLabel: "← fell · rose →", startLabel: "NFHS-5", endLabel: "NFHS-6",
        why: "The honest India-native summary: the newest survey does not move in one direction.", read: "Percentage-point change from NFHS-5 to NFHS-6 across services, nutrition and adult risks.", watch: "A positive change can be good or bad depending on the indicator; rising C-sections and blood sugar are warnings, not progress." },
      { indicator: "health.nfhs.state_double_burden", chart: "tableBars", title: "Overweight women, state by state", size: "feature", beat: "double-burden-map", unit: "% of women overweight",
        subtitle: "NFHS-6 (2023-24) · overweight/obese women 15-49, by state · child stunting and thinness carried alongside",
        why: "The double burden mapped: states where adult overweight and child undernutrition coexist.", read: "Each bar is a state's share of overweight/obese women; the data also carries child stunting and women's thinness.", watch: "One side of the double burden per bar; stunting and thinness sit in the underlying data." },
      { chart: "multiLine", title: "Children thinner, adults heavier", size: "feature", beat: "double-burden-trend", unit: "% of group",
        categoricalX: true, xLabels: ["NFHS-5", "NFHS-6"], subtitle: "Two survey rounds: NFHS-5 (2019-21) and NFHS-6 (2023-24), not annual data",
        indicator: "health.nfhs.women_overweight",
        series: [
          { indicator: "health.nfhs.child_stunting", label: "Children stunted" },
          { indicator: "health.nfhs.women_overweight", label: "Women overweight" },
          { indicator: "health.nfhs.men_overweight", label: "Men overweight" },
          { indicator: "health.nfhs.women_thin", label: "Women thin" },
          { indicator: "health.nfhs.child_wasting", label: "Children wasted" }
        ],
        why: "Undernutrition is falling while adult overweight rises: two malnutritions at once.", read: "NFHS-5 to NFHS-6 movement for child stunting and wasting, adult overweight and women's thinness.", watch: "Two survey points; the two trends happen together, not in sequence." },
      { indicator: "health.transition.wealth_gaps", chart: "tableBars", title: "The poorest child still starts far behind", size: "feature", beat: "wealth-gap", unit: "percentage-point gap",
        subtitle: "World Bank HNP by wealth quintile · latest India survey year available",
        why: "The average hides the fairness problem: wealth still changes nutrition, access and survival.", read: "Bars show the gap between the worse-off and better-off wealth quintiles for each measure.", watch: "Survey-year quintile data, mostly 2021; not a live 2026 inequality measure." },
      { indicator: "health.transition.nfhs.state_spread", chart: "tableBars", title: "The national average hides huge gaps between states", size: "feature", beat: "state-spread", unit: "percentage-point spread",
        subtitle: "NFHS-6 · highest state or UT minus lowest state or UT",
        why: "The same indicator can describe very different state realities.", read: "Bars show the range between the highest and lowest state/UT value in NFHS-6.", watch: "A spread, not a ranking. Small-state and UT estimates can be noisy; Manipur is not in the local NFHS-6 artifact." },
      { indicator: "health.transition.nfhs.rural_urban_gaps", chart: "tableBars", title: "Rural and urban India have different health problems", size: "feature", beat: "rural-urban", unit: "percentage-point gap",
        subtitle: "NFHS-6 · absolute rural-urban gap in India values",
        why: "Rural-urban gaps are not a simple backward-forward story.", read: "Bars show the absolute rural-urban gap; metadata records which side is higher.", watch: "A higher value can be good or bad depending on the indicator; read as difference, not deprivation." },

      // ===== GETTING WORSE: the new burden =====
      { chart: "multiLine", title: "What India dies of has flipped", size: "feature", beat: "the-flip", unit: "% of total DALYs",
        indicator: "health.gbd.dalys_share_ncd",
        series: [
          { indicator: "health.gbd.dalys_share_ncd", label: "Non-communicable (NCDs)" },
          { indicator: "health.gbd.dalys_share_cmnn", label: "Communicable, maternal, neonatal" },
          { indicator: "health.gbd.dalys_share_injury", label: "Injuries" }
        ],
        why: "The single biggest shift in Indian health: lifestyle disease overtook infection.", read: "Each line is a broad cause group's share of total disease burden (DALYs), 1990 to 2023. The NCD line crosses the communicable line around 2010.", watch: "Shares, not absolute burden; total burden also grew. GBD figures are modelled estimates." },
      { indicator: "health.gbd.dalys_ncd_share_compare", chart: "compareLine", title: "India's NCD share, against its neighbours", size: "feature", beat: "flip-compare", unit: "% of total DALYs",
        subtitle: "IHME GBD 2023 · non-communicable share of disease burden · selected countries",
        why: "Richer and older countries flipped earlier; India flipped while still poor.", read: "NCD share of disease burden over time for India and comparator economies.", watch: "Filtered to contrasting economies; all are GBD model estimates." },
      { chart: "rankedChange", title: "The diseases that carry India's burden, 1990 vs now", size: "feature", beat: "top-causes", unit: "DALYs",
        series: [
          { indicator: "health.gbd.dalys_cause_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.gbd.dalys_cause_neonatal", label: "Neonatal disorders" },
          { indicator: "health.gbd.dalys_cause_respiratory_infections_tb", label: "Resp. infections & TB" },
          { indicator: "health.gbd.dalys_cause_musculoskeletal", label: "Musculoskeletal" },
          { indicator: "health.gbd.dalys_cause_mental", label: "Mental disorders" },
          { indicator: "health.gbd.dalys_cause_diabetes_kidney", label: "Diabetes & kidney" },
          { indicator: "health.gbd.dalys_cause_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.dalys_cause_enteric", label: "Enteric infections" }
        ],
        why: "The leaderboard of disease burden reshuffled: heart disease up, childhood infection down.", read: "Each row is a cause's burden in the baseline decade versus the latest, sorted by today's burden.", watch: "Absolute DALYs, so rising population lifts levels; GBD model estimates." },
      { chart: "latestBars", title: "What kills the most Indians", size: "feature", beat: "death-counts", unit: "deaths a year (2023)",
        subtitle: "IHME GBD 2023 · estimated deaths by cause, India, 2023",
        indicator: "health.gbd.deaths_cardiovascular",
        series: [
          { indicator: "health.gbd.deaths_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.gbd.deaths_chronic_respiratory", label: "Chronic respiratory" },
          { indicator: "health.gbd.deaths_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.deaths_diabetes", label: "Diabetes" },
          { indicator: "health.gbd.deaths_diarrheal", label: "Diarrhoeal disease" },
          { indicator: "health.gbd.deaths_lower_respiratory", label: "Lower respiratory infections" },
          { indicator: "health.gbd.deaths_digestive", label: "Digestive disease" },
          { indicator: "health.gbd.deaths_tuberculosis", label: "Tuberculosis" },
          { indicator: "health.gbd.deaths_neonatal", label: "Newborn disorders" },
          { indicator: "health.gbd.deaths_road_injuries", label: "Road injuries" }
        ],
        why: "The death-count version of the flip: cardiovascular disease alone kills about 3.1 million Indians a year, roughly as many as the next three causes combined.", read: "Each bar is one cause's estimated deaths in 2023, ranked. Heart disease towers; the old infectious and newborn killers now sit far down the list.", watch: "Counts, not rates, so a growing and ageing population lifts the totals; GBD model estimates, not a death register." },
      { chart: "latestBars", title: "What men and women die of in India", size: "feature", beat: "death-sex-gap", unit: "% of each sex's deaths",
        subtitle: "Causes of Death Statistics 2017-19 (Registrar General), via NHP 2023 · share of each sex's deaths",
        indicator: "health.nhpcod.cod1719_cardiovascular_male",
        series: [
          { indicator: "health.nhpcod.cod1719_cardiovascular_male", label: "Cardiovascular (men)" },
          { indicator: "health.nhpcod.cod1719_cardiovascular_female", label: "Cardiovascular (women)" },
          { indicator: "health.nhpcod.cod1719_road_accidents_male", label: "Road accidents (men)" },
          { indicator: "health.nhpcod.cod1719_road_accidents_female", label: "Road accidents (women)" },
          { indicator: "health.nhpcod.cod1719_neoplasms_male", label: "Cancers (men)" },
          { indicator: "health.nhpcod.cod1719_neoplasms_female", label: "Cancers (women)" },
          { indicator: "health.nhpcod.cod1719_fever_unknown_male", label: "Fever, unknown cause (men)" },
          { indicator: "health.nhpcod.cod1719_fever_unknown_female", label: "Fever, unknown cause (women)" },
          { indicator: "health.nhpcod.cod1719_ill_defined_male", label: "Ill-defined (men)" },
          { indicator: "health.nhpcod.cod1719_ill_defined_female", label: "Ill-defined (women)" }
        ],
        why: "Men die far more from heart disease and road accidents; women's deaths are far more often logged as 'fever of unknown origin' or 'ill-defined', a sign their causes go less often recorded.", read: "Paired bars for men and women across five causes, as a share of each sex's own deaths. The injury gap and the recording gap are the story.", watch: "Shares of each sex's deaths, not counts, pooled over 2017-19. 'Ill-defined' is not a real disease; it flags deaths whose cause was never established." },
      { chart: "multiLine", title: "Most Indian deaths still aren't medically certified", size: "feature", beat: "recording", unit: "% of registered deaths",
        subtitle: "RGI Civil Registration / MCCD, via NHP 2023 · registered deaths with a doctor-certified cause",
        indicator: "health.crsmccd.medically_certified_pct",
        series: [
          { indicator: "health.crsmccd.medically_certified_pct", label: "Medically certified" }
        ],
        why: "The share of registered deaths with a doctor-certified cause crept up from 14% in 1995 to about 23% by 2020, which means roughly four in five deaths still have no medically certified cause.", read: "One line, the percentage of registered deaths that were medically certified each year. It rises slowly and then stalls near a fifth.", watch: "Even this counts only registered deaths, and MCCD skews to urban and hospital deaths; it is why nationally representative cause data leans on the SRS survey and on models." },
      { chart: "multiLine", title: "Accidents are flat, but suicides are climbing", size: "feature", beat: "external-causes", unit: "deaths a year",
        subtitle: "NCRB, Accidental Deaths & Suicides in India, 2011-2021, via NHP 2023",
        indicator: "health.ncrb.suicides_total",
        series: [
          { indicator: "health.ncrb.accidental_deaths_total", label: "Accidental deaths" },
          { indicator: "health.ncrb.suicides_total", label: "Suicides" }
        ],
        why: "Police-recorded suicides rose from about 1.36 lakh in 2011 to 1.64 lakh in 2021, with the steepest jump in the COVID years, while accidental deaths stayed roughly flat and dipped during the 2020 lockdown.", read: "Two lines of annual counts. Accidental deaths hover near 4 lakh; suicides climb, especially after 2019.", watch: "Police-reported counts, widely held to undercount suicides, so a floor not a true total; counts not rates, so population growth lifts them." },
      { chart: "multiLine", title: "Adults are getting heavier and more diabetic", size: "feature", beat: "adult-risk", unit: "% of adults",
        categoricalX: true, xLabels: ["NFHS-5", "NFHS-6"], subtitle: "Two survey rounds: NFHS-5 (2019-21) and NFHS-6 (2023-24), not annual data",
        indicator: "health.transition.nfhs.women_overweight",
        series: [
          { indicator: "health.transition.nfhs.women_overweight", label: "Women overweight" },
          { indicator: "health.transition.nfhs.men_overweight", label: "Men overweight" },
          { indicator: "health.transition.nfhs.women_high_sugar", label: "Women high blood sugar" },
          { indicator: "health.transition.nfhs.men_high_sugar", label: "Men high blood sugar" },
          { indicator: "health.transition.nfhs.women_high_bp", label: "Women high BP" },
          { indicator: "health.transition.nfhs.men_high_bp", label: "Men high BP" }
        ],
        why: "Measured, not modelled: the household survey caught metabolic risk rising between rounds.", read: "NFHS-5 to NFHS-6 adult measurements. Overweight and high blood sugar rose; blood pressure did not rise the same way.", watch: "Two survey points; field measurements, but one survey cannot prove cause." },
      { indicator: "health.gbd.diabetes_prevalence_compare", chart: "compareLine", title: "Diabetes across the neighbourhood", size: "feature", beat: "diabetes-compare", unit: "% of adults 20-79",
        subtitle: "IHME GBD 2023 · diabetes prevalence · selected countries",
        why: "India's diabetes burden in cross-country context.", read: "Diabetes prevalence among adults for India and comparator economies.", watch: "Few time points per country; model estimates, not survey counts." },
      { chart: "multiLine", title: "The quiet burden: mental illness and joint disease", size: "feature", beat: "invisible-burden", unit: "DALYs",
        indicator: "health.gbd.dalys_cause_mental",
        series: [
          { indicator: "health.gbd.dalys_cause_mental", label: "Mental disorders" },
          { indicator: "health.gbd.dalys_cause_musculoskeletal", label: "Musculoskeletal" }
        ],
        why: "Conditions that rarely kill but increasingly disable, and are easy to overlook.", read: "Disease burden from mental and musculoskeletal disorders over time.", watch: "Years lived with disability, not death; under-reported and likely understated." },
      { chart: "latestBars", title: "India's biggest killers, by risk factor", size: "feature", beat: "risk-ranked", unit: "attributed deaths (2023)",
        series: [
          { indicator: "health.gbd.risk_deaths_air_pollution", label: "Air pollution (total)" },
          { indicator: "health.gbd.risk_deaths_high_blood_pressure", label: "High blood pressure" },
          { indicator: "health.gbd.risk_deaths_high_blood_sugar", label: "High blood sugar" },
          { indicator: "health.gbd.risk_deaths_smoking", label: "Smoking" },
          { indicator: "health.gbd.risk_deaths_diet_low_fruits", label: "Diet low in fruit" },
          { indicator: "health.gbd.risk_deaths_high_bmi", label: "High BMI" },
          { indicator: "health.gbd.risk_deaths_high_ldl", label: "High LDL cholesterol" },
          { indicator: "health.gbd.risk_deaths_unsafe_water", label: "Unsafe water" }
        ],
        why: "Deaths sorted by the risk factor behind them, India 2023.", read: "Each bar is the deaths GBD attributes to that risk factor in 2023.", watch: "Risk factors overlap, so do not add the bars; modelled attributable-death estimates." },
      { chart: "latestBars", title: "Tobacco and alcohol are still a male habit", size: "feature", beat: "behaviour-risk", unit: "% of each sex, NFHS-6 (2023-24)",
        subtitle: "NFHS-6 (2023-24) · share of each sex aged 15+ who use tobacco or alcohol",
        indicator: "health.transition.nfhs.tobacco_men",
        series: [
          { indicator: "health.transition.nfhs.tobacco_men", label: "Tobacco (men)" },
          { indicator: "health.transition.nfhs.tobacco_women", label: "Tobacco (women)" },
          { indicator: "health.transition.nfhs.alcohol_men", label: "Alcohol (men)" },
          { indicator: "health.transition.nfhs.alcohol_women", label: "Alcohol (women)" }
        ],
        why: "More than a third of Indian men still use tobacco (36.3%) and nearly a fifth drink alcohol (18.9%), against 8.4% and 1.1% of women, two of the biggest behavioural drivers behind the rising cancer and heart-disease burden.", read: "Each bar is the latest NFHS-6 share for one sex. The gender gap is enormous and the levels among men are stubbornly high.", watch: "Self-reported, so likely undercounts, especially for women; both fell only slightly since NFHS-5 (men's tobacco 38% to 36.3%)." },
      { chart: "multiLine", title: "Air pollution's toll, household and total", size: "feature", beat: "air-pollution", unit: "attributed deaths",
        indicator: "health.gbd.risk_deaths_air_pollution",
        series: [
          { indicator: "health.gbd.risk_deaths_air_pollution", label: "Air pollution (total)" },
          { indicator: "health.gbd.risk_deaths_household_air_pollution", label: "Household air pollution" }
        ],
        why: "The single largest environmental risk, and how much is indoor smoke.", read: "Attributable deaths from total and from household (indoor) air pollution over time.", watch: "Household pollution sits within the total; both are modelled attribution." },

      // ===== GETTING WORSE: the system and the bill =====
      { chart: "multiLine", title: "Who pays for Indian healthcare is changing", size: "feature", beat: "who-pays", unit: "% of total health spending",
        indicator: "health.nha.oope_the_pct",
        series: [
          { indicator: "health.nha.oope_the_pct", label: "Out-of-pocket (households)" },
          { indicator: "health.nha.ghe_the_pct", label: "Government" }
        ],
        why: "The most important number in Indian health financing: the out-of-pocket share is finally falling.", read: "Out-of-pocket versus government share of total health expenditure, 2013-14 to 2022-23.", watch: "Shares of total spending, not rupee levels; government health spend is still about 1.4% of GDP." },
      { chart: "multiLine", title: "What a hospital stay costs, public vs private", size: "feature", beat: "cost-ladder", unit: "Rs per case (current prices)",
        indicator: "health.nssladder.hosp_cost_private",
        series: [
          { indicator: "health.nssladder.hosp_cost_public", label: "Government hospital" },
          { indicator: "health.nssladder.hosp_cost_private", label: "Private hospital" }
        ],
        why: "The price gap between a public and a private bed, across NSS rounds.", read: "Average medical spend per hospitalisation case, public versus private.", watch: "Current rupees, not inflation-adjusted; the earliest figure is total, not just medical, spend." },
      { chart: "multiLine", title: "Where Indians actually get hospitalised", size: "feature", beat: "private-share", unit: "% of hospitalisations in private",
        indicator: "health.nssladder.hosp_private_share_rural",
        series: [
          { indicator: "health.nssladder.hosp_private_share_rural", label: "Rural" },
          { indicator: "health.nssladder.hosp_private_share_urban", label: "Urban" }
        ],
        why: "The private sector now handles most hospitalisations, even in villages.", read: "Share of hospitalisation cases in private hospitals, rural and urban, across NSS rounds.", watch: "Indica tabulation of NSS unit data; the 2025 round is Indica's own, the official report may differ." },
      { chart: "multiLine", title: "The insurance revolution", size: "feature", beat: "insurance", unit: "% of persons covered",
        categoricalX: true, xLabels: ["NSS 2017-18", "NSS 2024"], subtitle: "Two NSS health rounds: 75th (2017-18) and 80th (2024), not annual data",
        indicator: "health.nssladder.insurance_covered_rural",
        series: [
          { indicator: "health.nssladder.insurance_covered_rural", label: "Rural" },
          { indicator: "health.nssladder.insurance_covered_urban", label: "Urban" }
        ],
        why: "Health-scheme coverage roughly tripled, and PMJAY flipped the rural-urban gradient.", read: "Share of persons covered by some health financing scheme, rural and urban.", watch: "NSS persons covered, not NFHS households covered; do not mix the two measures." },
      { indicator: "health.nss80.hosp_finance_sources", chart: "tableBars", title: "How families pay the hospital bill", size: "feature", beat: "finance-sources", unit: "% of cases",
        subtitle: "NSS 80th round (2025) · Indica tabulation of unit data · major source of finance",
        why: "Most stays are paid from savings, but a sizeable share is financed by borrowing.", read: "Each bar is the share of hospitalisation cases funded mainly by that source.", watch: "Indica tabulation of public microdata; excludes childbirth cases." },
      { indicator: "health.nss80.govt_bypass_reasons", chart: "tableBars", title: "Why patients skip government hospitals", size: "feature", beat: "govt-bypass", unit: "% of non-government cases",
        subtitle: "NSS 80th round (2025) · Indica tabulation of unit data · reasons for not using a government facility",
        why: "Free care exists; people still pay private. This is why.", read: "Each bar is a reason given for choosing a non-government hospital.", watch: "Self-reported reasons, Indica tabulation; categories are not mutually ranked." },
      { chart: "multiLine", title: "India's health spending against the world", size: "feature", beat: "spending-world", unit: "% of GDP",
        indicator: "health.wb.che_gdp.in",
        series: [
          { indicator: "health.wb.che_gdp.in", label: "India" },
          { indicator: "health.wb.che_gdp.bgd", label: "Bangladesh" },
          { indicator: "health.wb.che_gdp.chn", label: "China" },
          { indicator: "health.wb.che_gdp.idn", label: "Indonesia" },
          { indicator: "health.wb.che_gdp.vnm", label: "Vietnam" },
          { indicator: "health.wb.che_gdp.lka", label: "Sri Lanka" },
          { indicator: "health.wb.che_gdp.nga", label: "Nigeria" },
          { indicator: "health.wb.che_gdp.usa", label: "United States" },
          { indicator: "health.wb.che_gdp.wld", label: "World" }
        ],
        why: "India spends a strikingly small share of GDP on health.", read: "Current health expenditure as a percentage of GDP for India, comparators and the world.", watch: "Includes private out-of-pocket spending; public spend alone is far lower." },
      { chart: "multiLine", title: "Doctors and beds, India vs the world", size: "feature", beat: "supply-world", unit: "per 1,000 people",
        indicator: "health.wb.physicians.in",
        series: [
          { indicator: "health.wb.physicians.in", label: "Doctors, India" },
          { indicator: "health.wb.physicians.wld", label: "Doctors, world" },
          { indicator: "health.wb.beds.in", label: "Beds, India" },
          { indicator: "health.wb.beds.wld", label: "Beds, world" }
        ],
        why: "India has fewer doctors and hospital beds per person than the world average.", read: "Physicians and hospital beds per 1,000 people, India against the world.", watch: "World Bank series have gaps; beds and doctors are reported in different vintages." },
      { indicator: "health.nss80.childbirth_by_institution", chart: "tableBars", title: "What childbirth costs, by hospital type", size: "feature", beat: "childbirth", unit: "Rs per delivery (medical spend)",
        subtitle: "NSS 80th round (2025) · Indica tabulation of unit data · average medical spend per delivery; C-section share carried alongside",
        why: "The cost and the C-section rate both jump in private hospitals.", read: "Each bar is average medical spend per delivery by hospital type; the data also carries the C-section share.", watch: "Current rupees; Indica tabulation, the official report may differ." },
      { chart: "multiLine", title: "Private hospitals cut far more often", size: "feature", beat: "csection-incentive", unit: "% of births by C-section",
        categoricalX: true, xLabels: ["NFHS-5", "NFHS-6"], subtitle: "Two survey rounds: NFHS-5 (2019-21) and NFHS-6 (2023-24) · caesarean share by facility type",
        indicator: "health.transition.nfhs.c_section_private",
        series: [
          { indicator: "health.transition.nfhs.c_section_private", label: "Private facility" },
          { indicator: "health.transition.nfhs.c_section_public", label: "Public facility" }
        ],
        why: "By NFHS-6, 54.1% of births in private facilities were by caesarean, against 16.9% in public ones, a roughly threefold gap that points to financial incentives more than medical need.", read: "Two lines across the two survey rounds. Both rose, but the private rate is far higher and climbing faster.", watch: "Two survey rounds, not annual data. The WHO views a population C-section rate above 10-15% as rarely justified on medical grounds alone." },

      // ===== THE SYSTEM, INDIA'S OWN COUNT (NHP 2023) =====
      { indicator: "health.nhp.public_facilities", chart: "tableBars", title: "How many public health facilities India has", size: "feature", beat: "facility-counts", unit: "facilities",
        subtitle: "NHP 2023 (CBHI) · Rural Health Statistics, as on 31 March 2023",
        why: "India's own count of the public scaffolding, from village sub-centre to district hospital.", read: "Each bar is the number of public facilities of that type: 161,829 sub-centres down to 767 district hospitals.", watch: "Counts carry a reporting lag (RHS vintage) and say nothing about whether each facility is staffed or stocked." },
      { indicator: "health.nhp.registered_workforce", chart: "tableBars", title: "India's health workforce, on paper", size: "feature", beat: "workforce-count", unit: "registered (cumulative)",
        subtitle: "NHP 2023 (CBHI) · cumulative registrations with professional councils",
        why: "The official headcount of doctors, nurses and others, with a heavy caveat.", read: "Each bar is the cumulative number registered: about 2.6 million nurses and midwives, 1.3 million allopathic doctors, and so on.", watch: "These are cumulative registrations, NOT active or in-position staff; they overstate the working workforce, and many have retired, emigrated or left clinical work." },
      { indicator: "health.nhp.doctors_by_state", chart: "tableBars", title: "Doctors cluster in a few states", size: "feature", beat: "doctors-state", unit: "registered doctors",
        subtitle: "NHP 2023 (CBHI) · MBBS doctors registered with state councils, upto 31.12.2022",
        why: "Even on paper, registered doctors are concentrated in a handful of states.", read: "Each bar is a state's registered MBBS doctors; the top four states hold a large share of the national total of about 1.35 million.", watch: "Registered, not active; doctors registered in one state may practise in another." },

      // ===== SPECULATIVE CODA: the GLP-1 question =====
      { indicator: "health.glp1.price_ladder", chart: "tableBars", title: "What a month of GLP-1 costs in India", size: "feature", beat: "glp1-coda", unit: "INR per month",
        subtitle: "Press-verified retail prices, mid-2026 · representative monthly cost, ranges in the data",
        why: "Deliberately speculative: after the March 2026 patent cliff, GLP-1 prices fell off a wall, and the effect on India's metabolic burden could be large but is genuinely unknown.", read: "Each bar is a representative monthly cost for a branded or generic GLP-1, with metformin as a baseline. India's core semaglutide patent expired on 20 March 2026; 40-plus firms launched generics around 90% below branded prices, from roughly Rs 1,300 a month down to about Rs 220 a shot. Demand is already surging: Mounjaro became India's top-selling medicine by value in late 2025, GLP-1 sales were up about 178% year-on-year in early 2026, and the market (about 153 million dollars in 2026) is projected past half a billion by 2030, against roughly 101 million Indians with diabetes.", watch: "Reported retail prices, not regulated MRPs; generic prices were still falling. Every population-impact claim here is a scenario, not a measured outcome. Weight returns after stopping, so these are effectively chronic therapy, lean-muscle loss is a concern, India's thin-fat phenotype may not match Western trials, and even the cheapest generic is far above metformin." }
    ]
  },
  {
    id: "q.health.hale",
    question: "How healthy are those extra years?",
    priority: "core",
    indicators: ["health.who.hale_birth"],
    core: ["health.who.hale_birth"],
    context: ["health.who.life_expectancy", "health.who.life_expectancy_age_60"]
  },
  {
    id: "q.health.u5mr",
    question: "How many Indian children die before age five?",
    priority: "core",
    indicators: ["health.under5_mortality", "health.who.under5_mortality", "health.who.infant_mortality", "health.who.neonatal_mortality", "people.population.un.u5mr"],
    core: ["health.under5_mortality", "health.who.under5_mortality", "health.who.infant_mortality", "health.who.neonatal_mortality", "people.population.un.u5mr"],
    context: []
  },
  {
    id: "q.health.deaths",
    question: "What kills Indians?",
    priority: "core",
    // Rebuilt 2026-06 on a fresher, multi-source spine. The cause-of-death backbone
    // is IHME GBD 2023 (annual 1980-2023, so it shows the COVID spike AND the recovery
    // that the old WHO GHE 2019/2021 series could not). India's own registers add the
    // "what our own data says" layer: SRS 2023 for the crude death rate, MCCD 2023 for
    // certified cause shares. UN WPP stays for demographic totals; WHO for maternal.
    indicators: [
      "health.gbd.deaths_cardiovascular",
      "health.gbd.deaths_neoplasms",
      "health.gbd.deaths_chronic_respiratory",
      "health.gbd.deaths_diabetes",
      "health.gbd.deaths_covid19",
      "health.srs.crude_death_rate",
      "health.srscod.cause_cardiovascular",
      "health.un.total_deaths",
      "health.who.maternal_mortality"
    ],
    core: [
      "health.gbd.deaths_cardiovascular",
      "health.gbd.deaths_neoplasms",
      "health.gbd.deaths_chronic_respiratory",
      "health.gbd.deaths_diabetes",
      "health.gbd.deaths_covid19",
      "health.srs.crude_death_rate",
      "health.srscod.cause_cardiovascular",
      "health.un.total_deaths",
      "health.who.maternal_mortality"
    ],
    context: [
      "health.gbd.deaths_chronic_kidney",
      "health.gbd.deaths_digestive",
      "health.gbd.deaths_lower_respiratory",
      "health.gbd.deaths_tuberculosis",
      "health.gbd.deaths_diarrheal",
      "health.gbd.deaths_neonatal",
      "health.gbd.deaths_self_harm",
      "health.gbd.deaths_road_injuries",
      "health.gbd.deaths_drowning",
      "health.gbd.deaths_interpersonal_violence",
      "health.gbd.deaths_hiv",
      "health.gbd.deaths_malaria",
      "health.srs.crude_death_rate_male",
      "health.srs.crude_death_rate_female",
      "health.srs.infant_mortality",
      "health.srscod.cause_respiratory_infections",
      "health.srscod.cause_cancers",
      "health.srscod.cause_respiratory_diseases",
      "health.srscod.cause_digestive",
      "health.srscod.cause_fever_unknown",
      "health.srscod.cause_injuries_nonvehicle",
      "health.srscod.cause_diabetes",
      "health.srscod.cause_genitourinary",
      "health.srscod.cause_tuberculosis",
      "health.srscod.broad_ncd",
      "health.srscod.broad_communicable",
      "health.srscod.broad_injuries",
      "health.srscod.broad_ill_defined",
      "health.mccd.share_circulatory",
      "health.mccd.share_symptoms_nec",
      "health.mccd.share_respiratory",
      "health.mccd.share_infectious",
      "health.mccd.share_genitourinary",
      "health.mccd.share_neoplasms",
      "health.mccd.share_injury",
      "health.mccd.share_digestive",
      "health.mccd.share_perinatal",
      "health.mccd.share_other",
      "health.gbd.age_under5_preterm", "health.gbd.age_under5_lri", "health.gbd.age_under5_asphyxia", "health.gbd.age_under5_congenital", "health.gbd.age_under5_diarrheal", "health.gbd.age_under5_sepsis",
      "health.gbd.age_5_14_drowning", "health.gbd.age_5_14_neoplasms", "health.gbd.age_5_14_diarrheal", "health.gbd.age_5_14_road", "health.gbd.age_5_14_lri", "health.gbd.age_5_14_cardiovascular",
      "health.gbd.age_15_49_cardiovascular", "health.gbd.age_15_49_neoplasms", "health.gbd.age_15_49_road", "health.gbd.age_15_49_self_harm", "health.gbd.age_15_49_digestive", "health.gbd.age_15_49_tuberculosis",
      "health.gbd.age_50_69_cardiovascular", "health.gbd.age_50_69_neoplasms", "health.gbd.age_50_69_chronic_respiratory", "health.gbd.age_50_69_diabetes", "health.gbd.age_50_69_tuberculosis", "health.gbd.age_50_69_digestive",
      "health.gbd.age_70plus_cardiovascular", "health.gbd.age_70plus_chronic_respiratory", "health.gbd.age_70plus_neoplasms", "health.gbd.age_70plus_diabetes", "health.gbd.age_70plus_diarrheal", "health.gbd.age_70plus_dementias",
      "health.srscod.broad_ncd_male", "health.srscod.broad_ncd_female", "health.srscod.broad_communicable_male", "health.srscod.broad_communicable_female", "health.srscod.broad_injuries_male", "health.srscod.broad_injuries_female", "health.srscod.broad_ill_defined_male", "health.srscod.broad_ill_defined_female"
    ],
    visualPlan: [
      { chart: "latestBars", title: "What kills the most Indians, 2023", size: "hero", beat: "answer", unit: "deaths in 2023", subtitle: "IHME Global Burden of Disease 2023 · estimated deaths, all ages, both sexes",
        series: [
          { indicator: "health.gbd.deaths_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.gbd.deaths_chronic_respiratory", label: "Chronic respiratory" },
          { indicator: "health.gbd.deaths_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.deaths_diabetes", label: "Diabetes" },
          { indicator: "health.gbd.deaths_diarrheal", label: "Diarrhoeal" },
          { indicator: "health.gbd.deaths_lower_respiratory", label: "Lower respiratory infections" },
          { indicator: "health.gbd.deaths_digestive", label: "Digestive" },
          { indicator: "health.gbd.deaths_tuberculosis", label: "Tuberculosis" },
          { indicator: "health.gbd.deaths_neonatal", label: "Neonatal" },
          { indicator: "health.gbd.deaths_road_injuries", label: "Road injuries" },
          { indicator: "health.gbd.deaths_self_harm", label: "Suicide" },
          { indicator: "health.gbd.deaths_chronic_kidney", label: "Chronic kidney" }
        ],
        indicator: "health.gbd.deaths_cardiovascular",
        why: "The direct answer to the page question, ranked. Heart disease dwarfs everything: at about 3.1 million deaths in 2023 it kills more Indians than the next two causes combined.", read: "Each bar is one cause's estimated 2023 death toll. Cardiovascular disease towers over the rest; cancers and chronic respiratory disease form a second tier near a million each; infections and injuries trail below.", watch: "Modelled estimates from GBD, not a death register. Absolute counts, so a large, ageing population lifts every bar. Causes are grouped, so 'cardiovascular' bundles heart attacks and strokes." },
      // The age ladder: the all-ages ranking above hides that what kills you depends
      // entirely on how old you are. Five bands, each its own leading-causes bar.
      { chart: "latestBars", title: "What kills babies (under 5)", size: "small", beat: "age-ladder", unit: "deaths in 2023", subtitle: "IHME GBD 2023 · India · children under five, both sexes",
        series: [
          { indicator: "health.gbd.age_under5_preterm", label: "Preterm birth" },
          { indicator: "health.gbd.age_under5_lri", label: "Lower respiratory infections" },
          { indicator: "health.gbd.age_under5_asphyxia", label: "Birth asphyxia & trauma" },
          { indicator: "health.gbd.age_under5_congenital", label: "Congenital defects" },
          { indicator: "health.gbd.age_under5_diarrheal", label: "Diarrhoeal" },
          { indicator: "health.gbd.age_under5_sepsis", label: "Neonatal sepsis" }
        ],
        indicator: "health.gbd.age_under5_preterm",
        why: "For the youngest, death looks nothing like the all-ages chart. The biggest killers are the complications of birth itself, prematurity, asphyxia, infection, not chronic disease.", read: "Each bar is a cause's 2023 death toll among under-fives. Preterm birth leads, followed closely by lower respiratory infections and birth asphyxia.", watch: "These are the deaths that institutional delivery and newborn care target; most happen in the first month of life." },
      { chart: "latestBars", title: "What kills children (5 to 14)", size: "small", beat: "age-ladder", unit: "deaths in 2023", subtitle: "IHME GBD 2023 · India · ages 5-14, both sexes",
        series: [
          { indicator: "health.gbd.age_5_14_drowning", label: "Drowning" },
          { indicator: "health.gbd.age_5_14_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.age_5_14_diarrheal", label: "Diarrhoeal" },
          { indicator: "health.gbd.age_5_14_road", label: "Road injuries" },
          { indicator: "health.gbd.age_5_14_lri", label: "Lower respiratory infections" },
          { indicator: "health.gbd.age_5_14_cardiovascular", label: "Cardiovascular" }
        ],
        indicator: "health.gbd.age_5_14_drowning",
        why: "School-age children are mostly past the dangers of birth, so accidents move to the front: drowning is the single biggest killer, ahead of cancers and road crashes.", read: "Bars of 2023 deaths among 5-to-14-year-olds. Drowning tops the list, with cancers and lingering infections close behind.", watch: "Small absolute numbers compared with adults, every bar here is a fraction of the adult totals, but these are deaths of otherwise healthy children." },
      { chart: "latestBars", title: "What kills young adults (15 to 49)", size: "feature", beat: "age-ladder", unit: "deaths in 2023", subtitle: "IHME GBD 2023 · India · ages 15-49, both sexes",
        series: [
          { indicator: "health.gbd.age_15_49_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.gbd.age_15_49_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.age_15_49_road", label: "Road injuries" },
          { indicator: "health.gbd.age_15_49_self_harm", label: "Suicide" },
          { indicator: "health.gbd.age_15_49_digestive", label: "Digestive" },
          { indicator: "health.gbd.age_15_49_tuberculosis", label: "Tuberculosis" }
        ],
        indicator: "health.gbd.age_15_49_self_harm",
        why: "This is the chart the all-ages ranking hides. Among working-age Indians, road injuries and suicide are the third and fourth biggest killers, each around 1.5 lakh deaths, the tragedy of dying young.", read: "Bars of 2023 deaths among 15-to-49-year-olds. Heart disease and cancers still lead, but road injuries and suicide rank just below them, far higher than in the all-ages view.", watch: "Road injuries and suicide skew heavily male; India's own police count (NCRB) records about 1.7 lakh suicides in 2023, close to this GBD estimate." },
      { chart: "latestBars", title: "What kills the middle-aged (50 to 69)", size: "small", beat: "age-ladder", unit: "deaths in 2023", subtitle: "IHME GBD 2023 · India · ages 50-69, both sexes",
        series: [
          { indicator: "health.gbd.age_50_69_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.gbd.age_50_69_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.age_50_69_chronic_respiratory", label: "Chronic respiratory" },
          { indicator: "health.gbd.age_50_69_diabetes", label: "Diabetes" },
          { indicator: "health.gbd.age_50_69_tuberculosis", label: "Tuberculosis" },
          { indicator: "health.gbd.age_50_69_digestive", label: "Digestive" }
        ],
        indicator: "health.gbd.age_50_69_cardiovascular",
        why: "By middle age the non-communicable diseases take over completely. Cardiovascular disease alone kills over 1.2 million people aged 50-69, with cancer and chronic respiratory disease next.", read: "Bars of 2023 deaths among 50-to-69-year-olds. Cardiovascular towers over everything; diabetes and chronic respiratory disease are firmly in the top tier.", watch: "Injuries and infections have largely dropped away; this is where the NCD burden concentrates in working life's later years." },
      { chart: "latestBars", title: "What kills the elderly (70 and older)", size: "feature", beat: "age-ladder", unit: "deaths in 2023", subtitle: "IHME GBD 2023 · India · ages 70+, both sexes",
        series: [
          { indicator: "health.gbd.age_70plus_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.gbd.age_70plus_chronic_respiratory", label: "Chronic respiratory" },
          { indicator: "health.gbd.age_70plus_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.age_70plus_diabetes", label: "Diabetes" },
          { indicator: "health.gbd.age_70plus_diarrheal", label: "Diarrhoeal" },
          { indicator: "health.gbd.age_70plus_dementias", label: "Dementias" }
        ],
        indicator: "health.gbd.age_70plus_cardiovascular",
        why: "In old age, cardiovascular disease is overwhelming: nearly 1.6 million deaths among the over-70s in 2023, more than the next three causes combined, with chronic respiratory disease a distant second.", read: "Bars of 2023 deaths among the over-70s. Cardiovascular disease dominates; chronic respiratory disease, cancers and diabetes follow.", watch: "This band carries the largest share of all deaths because it is where most Indians now die; the ladder's top rung is the NCD endgame." },
      { chart: "latestBars", title: "How men and women die differently", size: "feature", beat: "sex", unit: "% of each sex's deaths", subtitle: "SRS Cause of Death 2022-24 (Registrar General) · share of all male vs female deaths",
        series: [
          { indicator: "health.srscod.broad_ncd_male", label: "Non-communicable (men)" },
          { indicator: "health.srscod.broad_ncd_female", label: "Non-communicable (women)" },
          { indicator: "health.srscod.broad_injuries_male", label: "Injuries (men)" },
          { indicator: "health.srscod.broad_injuries_female", label: "Injuries (women)" },
          { indicator: "health.srscod.broad_communicable_male", label: "Communicable (men)" },
          { indicator: "health.srscod.broad_communicable_female", label: "Communicable (women)" },
          { indicator: "health.srscod.broad_ill_defined_male", label: "Ill-defined (men)" },
          { indicator: "health.srscod.broad_ill_defined_female", label: "Ill-defined (women)" }
        ],
        indicator: "health.srscod.broad_injuries_male",
        why: "The biggest sex difference is injuries: 12.6% of male deaths versus 7.5% of female deaths, men die far more from accidents, suicide and violence. Women carry more 'ill-defined' deaths, a sign their causes go less often recorded.", read: "Paired bars for men and women across four broad cause groups, as a share of each sex's deaths. Injuries are clearly higher for men; ill-defined causes higher for women.", watch: "Shares of each sex's own deaths, not counts. This is the SRS survey's sex split (all ages); GBD's true age-by-sex breakdown is not published through OWID." },
      { indicator: "health.gbd.deaths_cardiovascular", chart: "line", title: "The rise of heart disease, 1980 to 2023", size: "feature", window: "full", beat: "trend",
        why: "Why the heart sits at the top, and how fast it got there. CVD deaths roughly tripled from under a million in 1980 to about 3.1 million in 2023 as the population grew, aged, and urbanised.", read: "A single rising line of annual cardiovascular deaths. The slope steepens through the 2000s and 2010s. The small 2020-21 wobble is the pandemic; the line resumes its climb after.", watch: "Absolute counts, not per-person risk. Part of the rise is simply more, older Indians; the age-standardised rate has risen far less steeply than the raw count." },
      { chart: "multiLine", title: "The four non-communicable killers", size: "feature", beat: "composition-over-time", unit: "deaths per year", subtitle: "IHME GBD 2023 · annual deaths, 1980 to 2023",
        series: [
          { indicator: "health.gbd.deaths_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.gbd.deaths_neoplasms", label: "Cancers" },
          { indicator: "health.gbd.deaths_chronic_respiratory", label: "Chronic respiratory" },
          { indicator: "health.gbd.deaths_diabetes", label: "Diabetes" }
        ],
        indicator: "health.gbd.deaths_cardiovascular",
        why: "The non-communicable surge, broken into its four engines. Together these are the bulk of Indian deaths today, and all four are rising.", read: "Four climbing lines. Cardiovascular is far above; chronic respiratory and cancers cluster near a million; diabetes is lowest but rising fastest in proportional terms.", watch: "Absolute counts. Chronic respiratory deaths are inflated by India's air pollution; diabetes is often under-recorded as a cause because people die of its complications." },
      { chart: "latestBars", title: "What India's own death survey finds, 2022-24", size: "feature", beat: "second-source", unit: "% of all deaths", subtitle: "SRS Cause of Death 2022-2024 (Registrar General) · nationally representative, verbal-autopsy",
        series: [
          { indicator: "health.srscod.cause_cardiovascular", label: "Cardiovascular" },
          { indicator: "health.srscod.cause_cancers", label: "Cancers" },
          { indicator: "health.srscod.cause_respiratory_diseases", label: "Respiratory disease" },
          { indicator: "health.srscod.cause_digestive", label: "Digestive" },
          { indicator: "health.srscod.cause_respiratory_infections", label: "Respiratory infections" },
          { indicator: "health.srscod.cause_fever_unknown", label: "Fever of unknown origin" },
          { indicator: "health.srscod.cause_injuries_nonvehicle", label: "Unintentional injuries" },
          { indicator: "health.srscod.cause_diabetes", label: "Diabetes" },
          { indicator: "health.srscod.cause_genitourinary", label: "Genito-urinary" },
          { indicator: "health.srscod.cause_tuberculosis", label: "Tuberculosis" }
        ],
        indicator: "health.srscod.cause_cardiovascular",
        why: "India's own nationally representative cause-of-death data, the strongest check on the modelled GBD estimates. It agrees on the headline, cardiovascular disease leads at 32.1% of all deaths, and unlike hospital records it counts the rural and at-home deaths most Indians actually have.", read: "Each bar is a cause's share of all deaths, assigned by verbal autopsy on the SRS sample. Cardiovascular towers over everything; cancers, respiratory and digestive disease form a distant second tier; a 'fever of unknown origin' bar shows how much still goes undiagnosed.", watch: "Shares of all deaths, not counts, pooled over 2022-24. About 10% of deaths are still 'ill-defined', mostly at ages 70+. The narrower hospital-certified MCCD data skews even higher to circulatory disease (36.4%), a sign of its urban bias." },
      { indicator: "health.gbd.deaths_covid19", chart: "line", title: "The COVID scar, and the recovery", size: "feature", window: "full", beat: "shock-and-recovery",
        why: "What the pandemic did to the death toll, and the crucial point the old data missed: it then receded. COVID deaths spiked in 2020-21 and fell back sharply by 2023.", read: "A line near zero for decades, a sharp spike at 2020-2021, then a steep fall toward a small residual by 2023.", watch: "Pandemic mortality is hard to measure; GBD's estimate is one of several and is lower than some excess-death studies. The point here is the shape: spike, then recovery." },
      { indicator: "health.srs.crude_death_rate", chart: "line", title: "India's own death rate: spike, then recovery", size: "feature", window: "full", beat: "normalized", subtitle: "SRS 2023 (Registrar General) · deaths per 1,000 population",
        why: "Are Indians dying at a lower rate? India's own Sample Registration System says yes, with a clear COVID interruption: the crude death rate jumped to 7.5 in 2021, then fell back to 6.4 by 2023.", read: "Deaths per 1,000 people. Flat near 6.0 before the pandemic, a sharp 2021 spike, then a return toward the pre-COVID level.", watch: "The crude rate is not age-adjusted, so an ageing population pushes it up over the long run even as age-specific risk falls. SRS is a large sample survey, India's official source for vital rates." },
      { chart: "multiLine", title: "The retreat of infectious disease", size: "feature", beat: "decline", unit: "deaths per year", subtitle: "IHME GBD 2023 · annual deaths, 1980 to 2023",
        series: [
          { indicator: "health.gbd.deaths_lower_respiratory", label: "Lower respiratory infections" },
          { indicator: "health.gbd.deaths_diarrheal", label: "Diarrhoeal" },
          { indicator: "health.gbd.deaths_tuberculosis", label: "Tuberculosis" },
          { indicator: "health.gbd.deaths_hiv", label: "HIV/AIDS" },
          { indicator: "health.gbd.deaths_malaria", label: "Malaria" }
        ],
        indicator: "health.gbd.deaths_tuberculosis",
        why: "The other half of the story: as non-communicable deaths climb, infectious killers have fallen steeply. This is the epidemiological transition in one chart.", read: "Five lines, all trending down. Lower respiratory infections and diarrhoeal disease fall the most; TB declines steadily; HIV and malaria drop to low levels.", watch: "Falling but not gone, India still has the world's largest TB burden in absolute terms. Malaria and HIV estimates carry wide uncertainty." },
      { chart: "multiLine", title: "Death by injury and suicide", size: "feature", beat: "injury", unit: "deaths per year", subtitle: "IHME GBD 2023 · annual deaths, 1980 to 2023",
        series: [
          { indicator: "health.gbd.deaths_self_harm", label: "Suicide" },
          { indicator: "health.gbd.deaths_road_injuries", label: "Road injuries" },
          { indicator: "health.gbd.deaths_drowning", label: "Drowning" },
          { indicator: "health.gbd.deaths_interpersonal_violence", label: "Interpersonal violence" }
        ],
        indicator: "health.gbd.deaths_self_harm",
        why: "Injuries kill working-age Indians in their prime. Suicide and road crashes are the two largest, each around 200,000-250,000 deaths a year.", read: "Suicide and road injuries run well above drowning and violence. Road deaths rise with motorisation; suicide stays stubbornly high.", watch: "These are GBD modelled estimates. India's own police count (NCRB) reports about 1.7 lakh suicides in 2023 and is the figure to cite for the domestic record." },
      { chart: "change", title: "Maternal mortality: the steepest fall", size: "small", window: "full", beat: "improvement", subtitle: "WHO/UN MMEIG · maternal deaths per 100,000 live births",
        indicator: "health.who.maternal_mortality",
        why: "The single biggest public-health win on this page. Maternal deaths fell from 658 to about 80 per 100,000 live births, a nearly 90% decline.", read: "First and latest recorded values, side by side. The drop is enormous, driven by institutional delivery and emergency obstetric care.", watch: "National averages hide large state variation; the latest figure is for 2023." },
      { indicator: "health.srs.infant_mortality", chart: "line", title: "Fewer babies dying", size: "small", window: "full", beat: "improvement", subtitle: "SRS 2023 (Registrar General) · infant deaths per 1,000 live births",
        why: "Child survival is the engine behind India's falling overall death rate. The infant mortality rate fell to 25 per 1,000 live births in 2023.", read: "A steadily falling line of infant deaths per 1,000 live births. Each point is India's own SRS estimate.", watch: "Still high by global standards, and the first month of life remains the riskiest. National average hides rural-urban and state gaps." },
      { indicator: "health.un.total_deaths", chart: "line", title: "Total deaths each year", size: "small", window: "full", beat: "level",
        why: "The denominator behind everything else. Total annual deaths have risen even as the death rate has fallen, because the population is larger and older.", read: "Total deaths per year, climbing gently. The rise is demographic arithmetic, not worsening health.", watch: "A rising total alongside a falling rate is the expected pattern for a growing, ageing country. UN estimates through 2024 with projections." }
    ]
  },
  {
    id: "q.health.dementia",
    slug: "dementia-in-india",
    question: "What dementia costs India",
    priority: "core",
    // Built 2026-06. India's dementia scale comes from LASI-DAD (Lee et al.,
    // Alzheimer's & Dementia 2023) — the first nationally representative, clinically
    // adjudicated estimate. The financial-damage *mechanism* is borrowed, clearly
    // flagged, from a US study (NBER WP 34659): wealth diverges years before any
    // diagnosis, driven by impaired decision-making, not overspending. The cost
    // layer is ADI's World Alzheimer Report 2010 (cost by income group; unpaid-care
    // share) plus India's own NHA out-of-pocket series. Dollar harm figures are NEVER
    // converted to rupees; the US charts stay in US units and are labelled US.
    indicators: [
      "health.lasidad.prev_by_age",
      "health.lasidad.prev_gradients",
      "health.lasidad.prev_by_education",
      "health.lasidad.cases_projection",
      "health.lasidad.prev_by_state",
      "health.gbd.deaths_alzheimers",
      "ref.us.nber.wealth_gap_by_event_time",
      "ref.us.nber.assets_cases_vs_controls",
      "health.adi.cost_per_person_by_income",
      "health.adi.informal_care_share",
      "health.nha.oope_the_pct"
    ],
    core: [
      "health.lasidad.prev_by_age",
      "health.lasidad.prev_gradients",
      "health.lasidad.prev_by_education",
      "health.lasidad.cases_projection",
      "health.lasidad.prev_by_state",
      "health.gbd.deaths_alzheimers"
    ],
    context: [
      "ref.us.nber.wealth_gap_by_event_time",
      "ref.us.nber.assets_cases_vs_controls",
      "health.adi.cost_per_person_by_income",
      "health.adi.informal_care_share",
      "health.nha.oope_the_pct"
    ],
    visualPlan: [
      { chart: "tableBars", indicator: "health.lasidad.prev_by_age", title: "Dementia climbs steeply with age", size: "hero", beat: "answer", unit: "% of age group with dementia", subtitle: "LASI-DAD 2018-20 (Lee et al., Alzheimer's & Dementia 2023) · estimated prevalence by age band",
        why: "The first thing to know: dementia is overwhelmingly a disease of late old age. It jumps from about 3% in the early 60s to a quarter of everyone past 85.", read: "Each bar is the estimated share of that age band living with dementia. The rise is not gradual; it roughly doubles every five years after 70.", watch: "Estimates from a survey of about 2,500 clinically assessed adults, modelled to the 60+ population. Read the shape, not the second decimal." },
      { chart: "change", indicator: "health.lasidad.cases_projection", title: "8.8 million now, 16.9 million by 2036", size: "feature", beat: "scale", unit: "million people 60+ with dementia", subtitle: "LASI-DAD · estimated cases, 2016 population base and 2036 projection",
        why: "Because India is ageing fast, the headcount is set to nearly double in twenty years even if the risk at each age stays flat.", read: "Two figures side by side: an estimated 8.8 million adults over 60 with dementia today, and a projected 16.9 million by 2036.", watch: "Both numbers are estimates with wide uncertainty. The projection is demographic arithmetic, more people surviving into old age, not a worsening of the disease." },
      { chart: "tableBars", indicator: "health.lasidad.prev_gradients", title: "Who carries more: women, and rural India", size: "feature", beat: "gradient", unit: "% of adults 60+ with dementia", subtitle: "LASI-DAD 2018-20 · crude prevalence among adults 60+",
        why: "Dementia is not spread evenly. Women carry noticeably more of it than men, and rural Indians more than city dwellers.", read: "Two pairs of bars: women versus men, and rural versus urban. In both, the first bar is clearly taller.", watch: "Part of the women's gap is that they live longer and reach the highest-risk ages; part of the rural gap tracks lower schooling. These overlap." },
      { chart: "tableBars", indicator: "health.lasidad.prev_by_education", title: "Dementia falls sharply with schooling", size: "small", beat: "gradient", unit: "% of adults 60+ with dementia", subtitle: "LASI-DAD 2018-20 · crude prevalence by education",
        why: "The steepest gradient of all is education: those with no schooling have many times the measured prevalence of those who finished middle school.", read: "Three bars, falling fast from left to right as schooling rises.", watch: "This is association, not a clean cause. Education tracks lifelong income, nutrition and health, and may also change how dementia is detected and reported." },
      { chart: "choropleth", indicator: "health.lasidad.prev_by_state", title: "Where dementia is most common", size: "feature", beat: "where", unit: "% of adults 60+", rankLabel: "Highest", bottomLabel: "Lowest", subtitle: "LASI-DAD 2018-20 · estimated prevalence among adults 60+, by state",
        why: "The map runs from about 4.5% in Delhi to roughly 11% in Jammu & Kashmir, with the south and east generally higher than the north-western plains.", read: "Darker states have higher estimated prevalence among the over-60s. Grey states had no separate estimate.", watch: "North-eastern states other than Assam were published only as one group, so they share a single value. Small-state estimates are the least certain." },
      { chart: "line", indicator: "health.gbd.deaths_alzheimers", title: "Deaths recorded from dementia have risen eightfold", size: "feature", beat: "trend", window: "full", subtitle: "IHME Global Burden of Disease 2023 · estimated annual deaths from Alzheimer's & other dementias, India",
        why: "As Indians live longer and other killers recede, dementia surfaces in the mortality data: recorded deaths have climbed from about 17,000 in 1980 to over 140,000.", read: "A single line rising steeply, especially after 2000.", watch: "Modelled estimates, and dementia is badly under-recorded as a cause of death, so this is a floor. The jump after 2021 partly reflects a coding change, read the long climb, not the last kink." },
      { chart: "tableBars", indicator: "ref.us.nber.wealth_gap_by_event_time", title: "America: money trouble starts before the diagnosis", size: "feature", beat: "mechanism", unit: "US$1,000s of net worth vs similar households", subtitle: "NBER WP 34659 (Li et al. 2026) · US Health & Retirement Study · evidence from the United States",
        why: "This is US data, shown to explain the mechanism, not to put a rupee figure on India. American households heading into dementia fall behind similar households starting about six years before onset, ending roughly $125,000 poorer.", read: "Each bar is the wealth gap versus matched controls at that point in time. It is near zero six years out and sinks steadily, deepening even after diagnosis.", watch: "United States, not India. The dollar amounts do not transfer; what transfers is the timing and the cause, money slips away before anyone has a name for why." },
      { chart: "tableBars", indicator: "ref.us.nber.assets_cases_vs_controls", title: "America: the gap sits in hard-to-manage assets", size: "feature", beat: "mechanism", unit: "US$1,000s held, two years before onset", subtitle: "NBER WP 34659 · means two years before onset · evidence from the United States",
        why: "The losses concentrate in stocks, bonds and investment accounts, the assets that need active judgement to manage. Earnings barely differ, and cancer or heart disease show no such gap, which points at decision-making, not spending.", read: "For each asset type, two bars: households developing dementia versus similar households without. The dementia group holds less everywhere, most in investments needing active management.", watch: "United States, 2018 dollars. Most older Indians hold little in stocks or pensions, so this exact channel is smaller here; the lesson is about judgement, not portfolios." },
      { chart: "tableBars", indicator: "health.adi.cost_per_person_by_income", title: "What a year of dementia care costs", size: "small", beat: "cost", unit: "US$ per person per year (2010)", subtitle: "World Alzheimer Report 2010 (ADI / Wimo & Prince) · societal cost per person, by country income group",
        why: "On paper, dementia looks far cheaper in poorer countries. India sat in the lower-middle band at about US$3,100 a year per person, against nearly US$33,000 in rich countries.", read: "Four bars rising with country income. India's band is the second from the left.", watch: "Lower is not better. The figure is small mostly because care is unpaid and there are few care homes, not because the illness is lighter. 2010 dollars." },
      { chart: "tableBars", indicator: "health.adi.informal_care_share", title: "The poorer the country, the more care is unpaid", size: "feature", beat: "cost", unit: "% of dementia cost that is unpaid family care", subtitle: "World Alzheimer Report 2010 (ADI) · share of total cost that is informal (family) care",
        why: "Here is why India's cost looks low and is in fact hidden: in its income band about two-thirds of the entire cost of dementia is unpaid family labour that never enters any budget.", read: "Three bars: the share of total dementia cost that is unpaid family care is highest in poorer countries and lower in rich ones, where paid services take over.", watch: "Unpaid does not mean free. It is paid in lost wages and lost years, mostly by women, and it simply never shows up as spending." },
      { chart: "line", indicator: "health.nha.oope_the_pct", title: "Why it lands on families: India pays out of pocket", size: "small", beat: "cost", window: "full", subtitle: "National Health Accounts (MoHFW) · out-of-pocket spending as a share of total health expenditure, India",
        why: "Even the medical slice of dementia care falls on households, because India funds a large share of all health care straight out of family pockets.", read: "The share of India's total health spending that comes directly out of household pockets, year by year.", watch: "Falling slowly but still high. Dementia care, drugs, doctor visits, attendants, mostly sits inside this out-of-pocket share, on top of the unpaid care at home." }
    ]
  },
  {
    id: "q.education.literacy",
    question: "How literate is India?",
    priority: "core",
    indicators: ["education.literacy_adult"],
    core: ["education.literacy_adult"],
    context: ["education.school_enrollment_secondary"]
  },
  {
    id: "q.education.years",
    question: "How many years of schooling do Indians get?",
    priority: "core",
    indicators: ["education.school_life_expectancy", "education.school_enrollment_secondary"],
    core: ["education.school_life_expectancy", "education.school_enrollment_secondary"],
    context: ["education.literacy_adult"]
  },
  {
    id: "q.work.force",
    question: "How many Indians are in the workforce?",
    priority: "core",
    // Comprehensive jobs page. Blended: World Bank/ILO for the long backbone
    // (labour force size, LFPR, unemployment, 1991→), MOSPI PLFS for the rich
    // recent breakdowns (gender, youth, education, social group, status, sector),
    // IndiaDataHub for high-frequency signals (JobSpeak hiring, NREGA demand).
    indicators: ["work.labor_force_total", "work.labor_force_participation_total", "work.unemployment_total"],
    core: ["work.labor_force_total", "work.labor_force_participation_total", "work.unemployment_total"],
    context: [
      "work.plfs.lfpr_person", "work.plfs.wpr_person", "work.plfs.ur_person",
      "work.plfs.lfpr_male", "work.plfs.lfpr_female",
      "work.plfs.ur_youth_person", "work.plfs.ur_youth_male", "work.plfs.ur_youth_female",
      "work.plfs.ur_edu_not_literate", "work.plfs.ur_edu_secondary", "work.plfs.ur_edu_graduate", "work.plfs.ur_edu_postgraduate",
      "work.plfs.ur_social_sc", "work.plfs.ur_social_st", "work.plfs.ur_social_obc", "work.plfs.ur_social_others",
      "work.plfs.status_self_employed", "work.plfs.status_regular_wage", "work.plfs.status_casual",
      "work.plfs.empshare_agriculture", "work.plfs.empshare_industry", "work.plfs.empshare_services",
      "compare.lfpr.in", "compare.lfpr.bgd", "compare.lfpr.chn", "compare.lfpr.vnm", "compare.lfpr.idn", "compare.lfpr.wld",
      "work.neet_youth", "work.idh.jobspeak_total", "work.idh.nrega_person_days_created",
      "work.plfs.wage_regular_person", "work.plfs.wage_casual_person", "work.plfs.wage_self_employed_person",
      "people.age_15_64_share"
    ],
    visualPlan: [
      { indicator: "work.labor_force_total", chart: "line", title: "India's labour force", size: "hero", window: "full", beat: "size",
        why: "The headline count: how many Indians are working or looking for work.", read: "Total labour force, rising as the working-age population grows.", watch: "The labour force is people working OR actively seeking work — not everyone of working age." },
      { indicator: "work.labor_force_participation_total", chart: "line", title: "Labour force participation rate, 1991 to today", size: "feature", window: "full", beat: "participation-long",
        why: "What share of working-age Indians are in the labour force at all.", read: "The participation rate over three decades (World Bank/ILO estimates).", watch: "A large working-age population only helps if participation is high; India's is modest by world standards." },
      { chart: "multiLine", indicator: "work.plfs.lfpr_person", title: "In the labour force vs actually working", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.lfpr_person", label: "In the labour force (LFPR)" }, { indicator: "work.plfs.wpr_person", label: "Actually working (WPR)" } ],
        beat: "lfpr-vs-wpr",
        why: "The gap between wanting work and having it is unemployment.", read: "Participation rate vs worker ratio (PLFS, survey years).", watch: "Both have risen recently; the small gap between them is the unemployment rate." },
      { indicator: "work.unemployment_total", chart: "line", title: "The unemployment rate over time", size: "feature", window: "full", beat: "unemployment",
        why: "How hard it is to find work, the number people feel most.", read: "Unemployment as a share of the labour force (World Bank/ILO).", watch: "India's headline rate looks low partly because discouraged workers leave the labour force entirely." },
      { chart: "multiLine", indicator: "work.plfs.lfpr_male", title: "Men and women in the labour force", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.lfpr_male", label: "Men" }, { indicator: "work.plfs.lfpr_female", label: "Women" } ],
        beat: "gender-gap",
        why: "The single biggest fact about India's workforce: the gender gap.", read: "Male vs female participation (PLFS).", watch: "Female participation is rising fast recently but still far below men's." },
      { chart: "multiLine", indicator: "work.plfs.ur_youth_person", title: "Youth struggle most to find work", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.ur_youth_person", label: "All youth" }, { indicator: "work.plfs.ur_youth_male", label: "Young men" }, { indicator: "work.plfs.ur_youth_female", label: "Young women" } ],
        beat: "youth-unemployment",
        why: "Joblessness is concentrated among the young, not the whole workforce.", read: "Unemployment rate for 15–29 year-olds (PLFS).", watch: "Youth unemployment runs several times the headline rate; this is the real jobs problem." },
      { chart: "multiLine", indicator: "work.plfs.ur_edu_graduate", title: "The more educated, the higher the unemployment", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.ur_edu_not_literate", label: "Not literate" }, { indicator: "work.plfs.ur_edu_secondary", label: "Secondary" }, { indicator: "work.plfs.ur_edu_graduate", label: "Graduate" }, { indicator: "work.plfs.ur_edu_postgraduate", label: "Post-graduate" } ],
        beat: "educated-unemployment",
        why: "India's paradox: unemployment rises with education, not falls.", read: "Unemployment rate by education level (PLFS).", watch: "Graduates can afford to wait for a 'good' job; the less educated cannot, so they take any work." },
      { chart: "multiLine", indicator: "work.plfs.ur_social_sc", title: "Unemployment by social group", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.ur_social_st", label: "Scheduled tribe" }, { indicator: "work.plfs.ur_social_sc", label: "Scheduled caste" }, { indicator: "work.plfs.ur_social_obc", label: "OBC" }, { indicator: "work.plfs.ur_social_others", label: "Others" } ],
        beat: "social-group",
        why: "Whether finding work depends on who you are.", read: "Unemployment rate by social group (PLFS).", watch: "Rates are a labour-market read, not a measure of discrimination by themselves." },
      { chart: "multiLine", indicator: "work.plfs.status_self_employed", title: "How Indians are employed: the quality question", size: "feature", unit: "% of workers",
        series: [ { indicator: "work.plfs.status_self_employed", label: "Self-employed" }, { indicator: "work.plfs.status_regular_wage", label: "Regular wage" }, { indicator: "work.plfs.status_casual", label: "Casual labour" } ],
        beat: "job-quality",
        why: "Having work is not the same as having a good job.", read: "Share of workers who are self-employed, in regular jobs, or casual labour (PLFS).", watch: "Most Indians are self-employed or casual; regular salaried jobs are the minority." },
      { chart: "multiLine", indicator: "work.plfs.empshare_services", title: "Where India works: farm, factory, office", size: "feature", unit: "% of workers",
        series: [ { indicator: "work.plfs.empshare_agriculture", label: "Agriculture" }, { indicator: "work.plfs.empshare_industry", label: "Industry" }, { indicator: "work.plfs.empshare_services", label: "Services" } ],
        beat: "sectors",
        why: "The structure of work across the economy.", read: "Share of workers in each broad sector (PLFS).", watch: "Agriculture's share fell for decades but ticked up again after 2019 — a sign of distress, not strength." },
      { chart: "multiLine", indicator: "compare.lfpr.in", title: "How India's participation compares", size: "feature", unit: "%",
        series: [ { indicator: "compare.lfpr.in", label: "India" }, { indicator: "compare.lfpr.chn", label: "China" }, { indicator: "compare.lfpr.vnm", label: "Vietnam" }, { indicator: "compare.lfpr.bgd", label: "Bangladesh" }, { indicator: "compare.lfpr.idn", label: "Indonesia" }, { indicator: "compare.lfpr.wld", label: "World" } ],
        beat: "cross-country",
        why: "India's participation against its peers and the world.", read: "Labour force participation across countries (ILO modelled).", watch: "India sits below the world average, dragged down mainly by low female participation." },
      { indicator: "work.neet_youth", chart: "line", title: "Young Indians not in work, education or training", size: "small", window: "full", beat: "neet",
        why: "The disengaged young — neither learning nor earning.", read: "Share of youth who are NEET (not in employment, education or training).", watch: "A high NEET share, especially among young women, signals wasted potential." },
      { indicator: "work.idh.jobspeak_total", chart: "line", title: "Hiring momentum, month by month", size: "small", window: "full", beat: "hiring",
        why: "A real-time read on formal hiring, faster than annual surveys.", read: "The Naukri JobSpeak white-collar hiring index, monthly.", watch: "This is formal/white-collar hiring only — a small, visible slice of the job market." },
      { indicator: "work.idh.nrega_person_days_created", chart: "line", title: "Demand for rural guaranteed work", size: "small", window: "full", beat: "nrega",
        why: "When other work dries up, rural Indians fall back on the NREGA jobs guarantee.", read: "Person-days of work created under MGNREGA each month.", watch: "Spikes signal rural distress (e.g. the 2020 lockdown), not a healthy job market." },
      { chart: "multiLine", indicator: "work.plfs.wage_regular_person", title: "What different kinds of work pay", size: "small", unit: "₹ per month / day",
        series: [ { indicator: "work.plfs.wage_regular_person", label: "Regular (monthly)" }, { indicator: "work.plfs.wage_self_employed_person", label: "Self-employed (monthly)" }, { indicator: "work.plfs.wage_casual_person", label: "Casual (daily)" } ],
        beat: "wages",
        why: "Earnings vary hugely by the kind of work.", read: "Average earnings by employment type (PLFS).", watch: "Casual is a daily wage, the others monthly — different units; compare each to its own past, not to each other." }
    ]
  },
  {
    id: "q.work.women",
    question: "Why is women's work participation so low?",
    priority: "core",
    // Comprehensive page on the gender gap in work. PLFS for the rich recent
    // breakdowns (rural/urban, youth, wages), World Bank/ILO for the long arc and
    // cross-country, IndiaDataHub for high-frequency monthly female LFPR and rural
    // wages. Honest about what the data can and cannot show (unpaid work).
    indicators: ["work.plfs.lfpr_female", "work.plfs.lfpr_male", "work.labor_force_participation_female"],
    core: ["work.plfs.lfpr_female", "work.plfs.lfpr_male", "work.labor_force_participation_female"],
    context: [
      "work.plfs.lfpr_female_rural", "work.plfs.lfpr_female_urban",
      "compare.lfpr_female.in", "compare.lfpr_female.bgd", "compare.lfpr_female.chn", "compare.lfpr_female.vnm", "compare.lfpr_female.idn", "compare.lfpr_female.wld",
      "work.plfs.wpr_female", "work.plfs.wpr_male",
      "work.plfs.ur_youth_female", "work.plfs.ur_youth_male", "work.plfs.ur_female",
      "work.plfs.wage_regular_female", "work.plfs.wage_regular_male",
      "work.idh.rural_wage_men", "work.idh.rural_wage_women", "work.idh.plfs_monthly_lfpr_female"
    ],
    visualPlan: [
      { indicator: "work.plfs.lfpr_female", chart: "line", title: "Women's participation in the labour force", size: "hero", window: "full", beat: "answer",
        why: "The headline: how many working-age women are in the labour force.", read: "Female labour force participation rate (PLFS), rising sharply in recent years.", watch: "This counts paid work and active job search — not unpaid housework and care, which women do most of." },
      { chart: "multiLine", indicator: "work.plfs.lfpr_male", title: "The gap between men and women at work", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.lfpr_male", label: "Men" }, { indicator: "work.plfs.lfpr_female", label: "Women" } ],
        beat: "gap",
        why: "The chasm is the story: men's participation is roughly double women's.", read: "Male vs female participation (PLFS).", watch: "Even with the recent rise, the gap is among the widest in the world." },
      { indicator: "work.labor_force_participation_female", chart: "line", title: "The long view: decline, then recovery", size: "feature", window: "full", beat: "long-arc",
        why: "Female participation fell for years before the recent turnaround.", read: "Female participation since 1991 (World Bank/ILO).", watch: "The earlier decline has several debated explanations; this data shows the pattern, not the cause." },
      { chart: "multiLine", indicator: "work.plfs.lfpr_female_rural", title: "The puzzle: urban women work less", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.lfpr_female_rural", label: "Rural women" }, { indicator: "work.plfs.lfpr_female_urban", label: "Urban women" } ],
        beat: "rural-urban",
        why: "Counter to intuition, rural female participation is higher than urban.", read: "Female participation, rural vs urban (PLFS).", watch: "Much rural female work is unpaid farm labour; urban norms and a lack of suitable jobs keep urban rates low." },
      { chart: "multiLine", indicator: "compare.lfpr_female.in", title: "India near the bottom of the world", size: "feature", unit: "%",
        series: [ { indicator: "compare.lfpr_female.in", label: "India" }, { indicator: "compare.lfpr_female.bgd", label: "Bangladesh" }, { indicator: "compare.lfpr_female.vnm", label: "Vietnam" }, { indicator: "compare.lfpr_female.chn", label: "China" }, { indicator: "compare.lfpr_female.idn", label: "Indonesia" }, { indicator: "compare.lfpr_female.wld", label: "World" } ],
        beat: "cross-country",
        why: "How far below its neighbours India sits on women's work.", read: "Female participation across countries (ILO modelled).", watch: "Bangladesh, poorer than India, has far higher female participation — income alone does not explain it." },
      { chart: "multiLine", indicator: "work.plfs.wpr_female", title: "Women actually working vs men", size: "feature", unit: "%",
        series: [ { indicator: "work.plfs.wpr_male", label: "Men" }, { indicator: "work.plfs.wpr_female", label: "Women" } ],
        beat: "employment",
        why: "Not just looking for work — actually employed.", read: "Worker population ratio, men vs women (PLFS).", watch: "The employment gap is even starker than the participation gap." },
      { chart: "multiLine", indicator: "work.plfs.ur_youth_female", title: "Young women struggle most to find work", size: "small", unit: "%",
        series: [ { indicator: "work.plfs.ur_youth_female", label: "Young women" }, { indicator: "work.plfs.ur_youth_male", label: "Young men" } ],
        beat: "youth",
        why: "Where the barrier bites hardest: young women entering the market.", read: "Youth unemployment by gender (PLFS).", watch: "High young-women unemployment can push them out of the labour force entirely." },
      { chart: "multiLine", indicator: "work.plfs.wage_regular_female", title: "The pay gap in regular jobs", size: "feature", unit: "₹ per month",
        series: [ { indicator: "work.plfs.wage_regular_male", label: "Men" }, { indicator: "work.plfs.wage_regular_female", label: "Women" } ],
        beat: "pay-gap",
        why: "Even in regular salaried work, women earn less.", read: "Average monthly earnings in regular jobs, by gender (PLFS).", watch: "Part of the gap is different jobs and hours, not only unequal pay for the same work." },
      { chart: "multiLine", indicator: "work.idh.rural_wage_women", title: "Rural wages: men vs women", size: "small", unit: "₹ per day",
        series: [ { indicator: "work.idh.rural_wage_men", label: "Men" }, { indicator: "work.idh.rural_wage_women", label: "Women" } ],
        beat: "rural-wages",
        why: "The pay gap shows up in daily rural wages too.", read: "Average rural daily wages by gender, monthly (IndiaDataHub).", watch: "Rural wage data covers specific occupations; treat it as a signal, not the whole rural economy." },
      { indicator: "work.idh.plfs_monthly_lfpr_female", chart: "line", title: "The recent surge, month by month", size: "small", window: "full", beat: "recent",
        why: "The fast recent rise in female participation, at monthly frequency.", read: "Monthly female participation rate (IndiaDataHub/PLFS).", watch: "Some of the recent rise is self-employment and unpaid family work, not new salaried jobs." }
    ]
  },
  {
    id: "q.work.agriculture",
    question: "What share of Indians still work in agriculture?",
    priority: "core",
    // Comprehensive page on agriculture's outsized share of work. World Bank/ILO
    // for the long sector arc, PLFS for the recent (post-2019 reversal), GDP sector
    // shares for the productivity gap, cross-country for context, IndiaDataHub NREGA
    // and rural wages for the lived rural economy.
    indicators: ["work.employment_agriculture", "econ.gdp.sector_agriculture"],
    core: ["work.employment_agriculture", "econ.gdp.sector_agriculture"],
    context: [
      "work.employment_industry", "work.employment_services",
      "work.plfs.empshare_agriculture", "work.plfs.empshare_industry", "work.plfs.empshare_services",
      "econ.gdp.sector_industry", "econ.gdp.sector_services",
      "compare.emp_agriculture.in", "compare.emp_agriculture.chn", "compare.emp_agriculture.vnm", "compare.emp_agriculture.bgd", "compare.emp_agriculture.idn", "compare.emp_agriculture.wld",
      "work.productivity_per_worker", "work.owid.agri_employment_share_longrun",
      "work.idh.nrega_person_days_created", "work.idh.rural_wage_men", "work.idh.rural_wage_women"
    ],
    visualPlan: [
      { indicator: "work.employment_agriculture", chart: "line", title: "Share of Indians working in agriculture", size: "hero", window: "full", beat: "answer",
        why: "The headline: how much of the workforce is still on the farm.", read: "Agriculture's share of employment since 1991 (World Bank/ILO), falling but still very high.", watch: "Agriculture's share of jobs is far above its share of the economy — the heart of this story." },
      { chart: "multiLine", indicator: "work.employment_services", title: "The slow shift from farm to factory to office", size: "feature", unit: "% of workers",
        series: [ { indicator: "work.employment_agriculture", label: "Agriculture" }, { indicator: "work.employment_industry", label: "Industry" }, { indicator: "work.employment_services", label: "Services" } ],
        beat: "structural-shift",
        why: "The classic development path — and how far India still has to go.", read: "Employment share by sector since 1991 (World Bank/ILO).", watch: "Workers leaving farms went more to services and construction than to factories." },
      { chart: "multiLine", indicator: "work.plfs.empshare_agriculture", title: "The post-2019 reversal", size: "feature", unit: "% of workers",
        series: [ { indicator: "work.plfs.empshare_agriculture", label: "Agriculture" }, { indicator: "work.plfs.empshare_industry", label: "Industry" }, { indicator: "work.plfs.empshare_services", label: "Services" } ],
        beat: "reversal",
        why: "Recent PLFS data shows agriculture's share rising again — a warning sign.", read: "Sector employment shares, recent survey years (PLFS).", watch: "People returning to farms usually means non-farm jobs were not available, not that farming got better." },
      { chart: "multiLine", indicator: "work.employment_agriculture", title: "Half the workers, a fraction of the output", size: "feature", unit: "%",
        series: [ { indicator: "work.employment_agriculture", label: "Share of workers" }, { indicator: "econ.gdp.sector_agriculture", label: "Share of GDP" } ],
        beat: "productivity-gap",
        why: "The core problem: agriculture employs far more people than the value it produces.", read: "Agriculture's share of employment vs its share of GDP.", watch: "The gap between the two lines is why farm incomes lag — too many people sharing too little output." },
      { chart: "multiLine", indicator: "econ.gdp.sector_services", title: "Where the economy's value comes from", size: "feature", unit: "% of GDP",
        series: [ { indicator: "econ.gdp.sector_agriculture", label: "Agriculture" }, { indicator: "econ.gdp.sector_industry", label: "Industry" }, { indicator: "econ.gdp.sector_services", label: "Services" } ],
        beat: "gdp-shares",
        why: "The mirror image: services dominate output while agriculture shrinks.", read: "Each sector's share of GDP.", watch: "Compare with the employment chart — services produce most value with far fewer workers." },
      { chart: "multiLine", indicator: "compare.emp_agriculture.in", title: "How India compares on leaving the farm", size: "feature", unit: "% of workers",
        series: [ { indicator: "compare.emp_agriculture.in", label: "India" }, { indicator: "compare.emp_agriculture.chn", label: "China" }, { indicator: "compare.emp_agriculture.vnm", label: "Vietnam" }, { indicator: "compare.emp_agriculture.bgd", label: "Bangladesh" }, { indicator: "compare.emp_agriculture.idn", label: "Indonesia" }, { indicator: "compare.emp_agriculture.wld", label: "World" } ],
        beat: "cross-country",
        why: "China and Vietnam moved workers off farms much faster than India.", read: "Agriculture's employment share across countries (ILO modelled).", watch: "Faster structural change abroad came with manufacturing booms India has not matched." },
      { indicator: "work.productivity_per_worker", chart: "line", title: "Output per worker", size: "small", window: "full", beat: "productivity",
        why: "Why moving out of agriculture matters: productivity.", read: "Output per worker across the economy (World Bank).", watch: "Average productivity hides that a farm worker produces far less than a services worker." },
      { indicator: "work.owid.agri_employment_share_longrun", chart: "line", title: "The very long view", size: "small", window: "full", beat: "longrun",
        why: "Agriculture's grip on Indian work over more than a century.", read: "Long-run agricultural employment share (OWID).", watch: "Change has been real but slow; this is a multi-generational transition." },
      { indicator: "work.idh.nrega_person_days_created", chart: "line", title: "Rural work demand: the NREGA signal", size: "small", window: "full", beat: "nrega",
        why: "When farm and non-farm work fall short, rural Indians turn to the jobs guarantee.", read: "Person-days created under MGNREGA each month (IndiaDataHub).", watch: "High demand signals rural distress, not a thriving farm economy." },
      { chart: "multiLine", indicator: "work.idh.rural_wage_men", title: "Rural wages", size: "small", unit: "₹ per day",
        series: [ { indicator: "work.idh.rural_wage_men", label: "Men" }, { indicator: "work.idh.rural_wage_women", label: "Women" } ],
        beat: "rural-wages",
        why: "What rural work actually pays — the floor under farm livelihoods.", read: "Average rural daily wages by gender, monthly (IndiaDataHub).", watch: "Nominal wages; rising rupee wages can still lose ground to rural inflation." }
    ]
  },
  {
    id: "q.energy.mix",
    question: "How does India generate electricity?",
    priority: "core",
    indicators: ["energy.ember.generation"],
    core: ["energy.ember.generation"],
    // Blended: Ember (actual generation, to 2025) is the backbone; EIA adds the
    // installed-capacity side (to 2024) so the page can separate "what is built"
    // from "what actually runs" — the key misreading-stopper for renewables.
    context: [
      "energy.eia.electricity_capacity_total",
      "energy.eia.electricity_capacity_fossil",
      "energy.eia.electricity_capacity_renewable",
      "energy.eia.electricity_capacity_solar",
      "energy.eia.electricity_capacity_wind",
      "energy.owid.renewable_share_elec",
      "energy.ember.carbon_intensity",
      "energy.ember.demand"
    ],
    visualPlan: [
      { indicator: "energy.ember.generation", chart: "stack", title: "Where India's electricity came from last year", size: "hero", window: "latest", beat: "answer",
        why: "The direct answer: the split of actual generation by source in the latest year.", read: "Each block is one source's share of the electricity actually generated.", watch: "This is generation (power produced), not capacity (power that could be produced); the two differ a lot for solar and wind." },
      { chart: "emberLines", indicator: "energy.ember.generation", field: "generation_twh", title: "Coal, clean power and gas over time", size: "feature", unit: "TWh",
        series: [ { indicator: "Coal", label: "Coal" }, { indicator: "Clean", label: "Clean sources" }, { indicator: "Gas", label: "Gas" } ],
        beat: "composition-over-time",
        why: "How the actual generation mix has moved: coal still does most of the work while clean sources climb.", read: "Annual generation in terawatt-hours, by source group.", watch: "Coal generation is still rising in absolute terms even as its share slips." },
      { chart: "multiLine", indicator: "energy.eia.electricity_capacity_total", title: "What India has built: installed capacity by source", size: "feature", unit: "GW (million kW)",
        series: [ { indicator: "energy.eia.electricity_capacity_fossil", label: "Fossil" }, { indicator: "energy.eia.electricity_capacity_renewable", label: "Renewable" }, { indicator: "energy.eia.electricity_capacity_solar", label: "Solar" }, { indicator: "energy.eia.electricity_capacity_wind", label: "Wind" } ],
        beat: "buildout",
        why: "The installed base tells a faster-moving story than generation: renewable capacity has been added at speed.", read: "Installed generating capacity in gigawatts, by source.", watch: "Capacity is the maximum a plant could produce; renewables run far fewer hours, so their capacity share runs ahead of their generation share." },
      { indicator: "energy.owid.renewable_share_elec", chart: "line", title: "Renewables' share of generation", size: "small", window: "full", beat: "trend",
        why: "The single line for how green the grid's output is becoming.", read: "Share of electricity generated from renewable sources, rising especially after 2015.", watch: "Share of generation, not of capacity; the capacity share above is higher." },
      { indicator: "energy.ember.carbon_intensity", chart: "line", title: "The grid is getting cleaner per unit", size: "small", window: "full", beat: "direction",
        why: "Progress per kilowatt-hour, even as total demand keeps rising.", read: "Grams of CO₂ per kilowatt-hour generated, edging down.", watch: "Falling intensity is slow because coal still sets the baseline; it is improving, not transformed." }
    ]
  },
  {
    id: "q.energy.system",
    question: "What powers India?",
    priority: "core",
    indicators: [
      "energy.ember.generation",
      "energy.tradestat.crude_oil_imports",
      "energy.tradestat.coal_imports",
      "energy.ppac.import_export_petroleum_current"
    ],
    core: [
      "energy.ember.generation",
      "energy.tradestat.crude_oil_imports",
      "energy.tradestat.coal_imports",
      "energy.ppac.import_export_petroleum_current"
    ],
    context: [
      "energy.tradestat.lng_imports",
      "energy.tradestat.crude_oil_imports_partner_history",
      "energy.ppac.indian_crude_basket_price",
      "energy.imports.fuel_spend_current",
      "energy.ppac.lng_imports_current",
      "energy.tradestat.petroleum_products_imports",
      "energy.tradestat.coke_imports",
      "energy.ppac.import_export_petroleum_value_usd",
      "energy.ember.generation",
      "energy.ember.demand",
      "energy.ember.carbon_intensity",
      "energy.electricity_access",
      "people.population.total"
    ],
    visualPlan: [
      { indicator: "energy.ember.generation", chart: "stack", title: "Electricity is the visible layer", size: "hero", window: "latest", beat: "power-layer",
        why: "Most readers feel the energy system through electricity: coal still dominates generation, while clean sources are growing.", read: "Latest electricity generation split by source.", watch: "Electricity is only part of total energy; oil for transport and industry sits outside this chart." },
      { chart: "emberLines", title: "Coal, clean power, and gas generation", size: "feature", beat: "power-mix-over-time", unit: "TWh", field: "generation_twh",
        series: [
          { indicator: "Coal", label: "Coal" },
          { indicator: "Clean", label: "Clean sources" },
          { indicator: "Gas", label: "Gas" }
        ],
        indicator: "energy.ember.generation",
        why: "The central power-system chart: it shows the absolute work done by coal versus clean generation." },
      { indicator: "energy.ppac.import_export_petroleum_current", chart: "ppacMonthlyBars", item: "CRUDE OIL", title: "Crude oil imports in 2025-26", size: "feature", beat: "oil-volume", limit: 12,
        why: "PPAC is the Indian petroleum source; it shows the monthly crude import flow in the latest available fiscal-year report.", read: "Monthly crude oil imports in thousand metric tonnes.", watch: "This is a fiscal-year series, so April is month one and March is month twelve." },
      { indicator: "energy.ppac.indian_crude_basket_price", chart: "line", title: "What India pays per barrel", size: "small", beat: "oil-price",
        why: "The Indian crude basket price translates global oil markets into the price India actually pays for imported crude.", read: "Fiscal-year average crude basket price in dollars per barrel.", watch: "The latest fiscal year may be year-to-date because PPAC updates the current report monthly." },
      { indicator: "energy.imports.fuel_spend_current", chart: "fuelSpendBars", measure: "usd_billion", title: "Fuel import bill in dollars", size: "small", beat: "fuel-spend-usd",
        why: "This shows the money scale of India's imported fuels: crude dominates, but coal, products, and LNG are material.", read: "Bars are 2025-26 import values in US$ billions.", watch: "Crude, products, and LNG use PPAC; coal uses TradeStat HS 2701." },
      { indicator: "energy.imports.fuel_spend_current", chart: "fuelSpendBars", measure: "rupees_crore", title: "Fuel import bill in rupees", size: "small", beat: "fuel-spend-rupees",
        why: "The rupee view makes the import bill legible in Indian fiscal terms.", read: "Bars are 2025-26 import values in rupees crore.", watch: "This is import value, not subsidy, retail price, or tax revenue." },
      { indicator: "energy.tradestat.crude_oil_imports", chart: "tradestatPartnerBars", title: "Where India's crude oil imports come from", size: "feature", beat: "oil-origin", field: "valueCurrentUsdMillion", limit: 10,
        why: "TradeStat/DGCI&S gives the official India-side partner table for HS 270900 crude oil in 2025-26.", read: "Top partner countries by import value.", watch: "This is fiscal-year trade value, not barrels or refinery ownership." },
      { indicator: "energy.tradestat.crude_oil_imports_partner_history", chart: "tradestatPartnerHistoryLines", title: "How Russia became a major crude supplier", size: "feature", beat: "oil-origin-shift", field: "valueUsdMillion", unit: "US$ billions",
        series: [
          { indicator: "Russia", label: "Russia" },
          { indicator: "Iraq", label: "Iraq" },
          { indicator: "Saudi Arabia", label: "Saudi Arabia" },
          { indicator: "UAE", label: "UAE" },
          { indicator: "US", label: "US" },
          { indicator: "Iran", label: "Iran" }
        ],
        why: "The current partner chart needs history: Russia was not a major source in 2017-18, then became India's largest crude supplier after 2022.", read: "Each line is a supplier's crude import value by Indian fiscal year.", watch: "This is value, not barrels. Price swings can move the lines even when physical volumes move less." },
      { indicator: "energy.tradestat.coal_imports", chart: "tradestatPartnerBars", title: "Where India's coal imports come from", size: "small", beat: "coal-origin", field: "valueCurrentUsdMillion", limit: 8,
        why: "Coal still powers the grid, and TradeStat shows which countries supply imported coal.", read: "Top partner countries by import value for HS 2701 coal.", watch: "This is value, not tonnes. Prices and coal grades change country rankings." },
      { indicator: "energy.tradestat.lng_imports", chart: "tradestatPartnerBars", title: "Where India's LNG imports come from", size: "small", beat: "gas-origin", field: "valueCurrentUsdMillion", limit: 8,
        why: "Gas is smaller than coal and oil, but LNG creates another named import channel.", read: "Top partner countries by import value for HS 271111 liquefied natural gas.", watch: "Pipeline gas and LNG are different products; this chart is LNG only." },
      { indicator: "energy.ppac.lng_imports_current", chart: "ppacMonthlyBars", item: "Total LNG Imports (Long Term, Spot)", measure: "lng_imports_mmt", title: "LNG import volumes in 2025-26", size: "small", beat: "gas-volume", limit: 12,
        why: "PPAC's gas page gives the physical monthly LNG import flow, complementing TradeStat's partner-country value table.", read: "Monthly LNG imports in million metric tonnes.", watch: "PPAC marks the March 2026 value provisional and reports the source as DGCIS." },
      { indicator: "energy.tradestat.petroleum_products_imports", chart: "tradestatPartnerBars", title: "Where petroleum product imports come from", size: "small", beat: "product-origin", field: "valueCurrentUsdMillion", limit: 8,
        why: "India imports not only crude but also selected petroleum products, so this shows the product side of the oil trade.", read: "Top partner countries by import value for HS 2710 petroleum oils and products.", watch: "HS 2710 is broad; it is not the same as crude oil." },
      { indicator: "energy.ember.carbon_intensity", chart: "line", title: "The grid is getting cleaner per unit", size: "small", window: "full", beat: "transition",
        why: "The transition is visible in electricity carbon intensity, even if total energy use keeps rising.", read: "CO2 per kilowatt-hour of electricity.", watch: "Cleaner electricity per unit is not the same as lower total emissions." },
      { indicator: "energy.ember.demand", chart: "line", title: "Electricity demand keeps climbing", size: "small", window: "full", beat: "demand",
        why: "Clean power has to grow against rising demand, not a fixed electricity system.", read: "Annual electricity demand in terawatt-hours.", watch: "Demand is electricity only; petroleum use in transport and industry is outside this chart." }
    ]
  },
  {
    id: "q.energy.coal",
    question: "How dependent is India on coal?",
    priority: "core",
    indicators: ["energy.ember.generation"],
    core: ["energy.ember.generation"],
    // Blended: Ember for the electricity share/absolute (to 2025); EIA for the
    // production-vs-imports and total-consumption angle (to 2024), which is where
    // the "dependence" story really lives; EIA CO2-from-coal for the cost.
    context: [
      "energy.eia.consumption_coal",
      "energy.eia.coal_production",
      "energy.eia.coal_imports",
      "climate.eia.co2_coal",
      "energy.ember.emissions",
      "energy.ember.carbon_intensity"
    ],
    visualPlan: [
      { indicator: "energy.ember.generation", chart: "emberShare", seriesName: "Coal", title: "How much of India's electricity is coal", size: "hero", window: "full", beat: "dependence",
        why: "The headline measure of dependence: coal's share of all electricity generated.", read: "Coal's share of total generation, holding near three-quarters for years.", watch: "A falling share can still sit on top of rising coal tonnes if total demand grows faster." },
      { chart: "emberLines", indicator: "energy.ember.generation", field: "generation_twh", title: "Coal generation keeps rising", size: "feature", unit: "TWh",
        series: [ { indicator: "Coal", label: "Coal" }, { indicator: "Clean", label: "Clean sources" } ],
        beat: "share-vs-tonnes",
        why: "Why a falling share is not falling coal: in absolute terms, coal generation is still growing.", read: "Annual generation in terawatt-hours, coal versus clean sources.", watch: "Clean energy is growing faster, but from far below coal; the lines have not crossed." },
      { chart: "multiLine", indicator: "energy.eia.coal_production", title: "Coal: home production vs imports", size: "feature", unit: "thousand tonnes",
        series: [ { indicator: "energy.eia.coal_production", label: "Domestic production" }, { indicator: "energy.eia.coal_imports", label: "Imports" } ],
        beat: "import-exposure",
        why: "Dependence is not only on coal but on imported coal: India mines most of its coal but still buys a large amount abroad.", read: "Coal produced at home versus coal imported, in thousand tonnes.", watch: "Imports expose the power bill to global coal prices and shipping, beyond India's control." },
      { indicator: "energy.eia.consumption_coal", chart: "line", title: "Total coal use, beyond just power", size: "small", window: "full", beat: "scale",
        why: "Coal also feeds steel and cement, so total use is larger than the power figure alone.", read: "Total coal consumption in quadrillion Btu.", watch: "This is all coal demand, not only the grid's; it keeps climbing with the economy." },
      { indicator: "climate.eia.co2_coal", chart: "line", title: "The CO₂ cost of coal", size: "small", window: "full", beat: "cost",
        why: "The reason coal dependence matters for climate: it is India's single largest source of CO₂.", read: "CO₂ emitted from burning coal, in million tonnes.", watch: "This is coal's emissions alone; oil and gas add more on top." }
    ]
  },
  {
    id: "q.energy.renewables",
    question: "Is India's electricity going green?",
    priority: "core",
    indicators: ["energy.owid.renewable_share_elec", "energy.ember.generation"],
    core: ["energy.owid.renewable_share_elec", "energy.ember.generation"],
    // Blended and current to 2025: Ember (electricity) is the backbone, OWID for the
    // renewable share. Coal's share comes from Ember (to 2025), not the World Bank
    // series (which lags to 2023). Opens with a tight power-specific climate hook.
    context: [
      "owid.co2_per_capita",
      "energy.ember.demand",
      "energy.ember.carbon_intensity"
    ],
    visualPlan: [
      { indicator: "energy.ember.generation", chart: "emberShare", seriesName: "Coal", title: "How much of India's electricity comes from coal", size: "feature", window: "full", beat: "problem",
        why: "The starting point: India's grid runs overwhelmingly on coal.", read: "Coal's share of total electricity generation, hovering around three-quarters.", watch: "A falling share can still mean rising coal in absolute terms if total generation grows faster." },
      { indicator: "owid.co2_per_capita", chart: "line", title: "India's CO₂ emissions per person", size: "small", window: "full", beat: "context",
        why: "Why the energy mix matters: burning coal drives emissions.", read: "Tonnes of CO₂ per person each year, rising as the economy and power use grow.", watch: "India's per-person emissions are still far below rich countries; the total is large only because the population is." },
      { indicator: "energy.owid.renewable_share_elec", chart: "line", title: "Renewables' share of India's electricity", size: "hero", window: "full", beat: "answer",
        why: "The response: how much of the grid is now renewable.", read: "The share of electricity from renewable sources, climbing steadily, especially after 2015.", watch: "Share of generation is not share of capacity; renewables sit idle more often, so capacity share runs ahead of generation share." },
      { indicator: "energy.ember.generation", chart: "line", title: "How India generates its electricity, by source", size: "feature", window: "full", beat: "composition-over-time",
        why: "The transition in one chart: which sources are rising and which are flattening.", read: "Generation in terawatt-hours by source over time, with coal high but clean energy climbing fast.", watch: "Coal generation is still growing in absolute terms even as its share slips; the lines are TWh, not percentages." },
      { indicator: "energy.ember.generation", chart: "emberLines", field: "generation_twh", title: "Solar and wind: India's fastest-growing power", size: "feature", unit: "TWh", beat: "growth",
        series: [
          { indicator: "Solar", label: "Solar" },
          { indicator: "Wind", label: "Wind" }
        ],
        why: "The standout of the transition: solar especially has gone from almost nothing to a major source.", read: "Annual generation from solar and wind in terawatt-hours, with solar's line bending sharply upward.", watch: "Both still trail coal by a wide margin; fast growth from a small base is not the same as dominance." },
      { indicator: "energy.ember.generation", chart: "emberLines", field: "generation_twh", title: "Clean energy is chasing fossil fuels", size: "feature", unit: "TWh", beat: "race",
        series: [
          { indicator: "Fossil", label: "Fossil fuels" },
          { indicator: "Clean", label: "Clean energy" }
        ],
        why: "The race that decides the transition: can clean generation catch fossil?", read: "Total clean (renewables plus nuclear) versus fossil generation in terawatt-hours; both rise, but fossil is still far ahead.", watch: "Clean is growing faster in percentage terms, but the absolute gap is still large and demand keeps climbing." },
      { indicator: "energy.ember.generation", chart: "stack", title: "Where India's power came from last year", size: "feature", window: "latest", beat: "composition",
        why: "Today's mix at a glance.", read: "Each block is one source's share of total generation in the latest year.", watch: "A single year can be skewed by weather (a weak monsoon cuts hydro); read it beside the trend." },
      { indicator: "energy.ember.demand", chart: "line", title: "India's electricity demand", size: "small", window: "full", beat: "pressure",
        why: "The hard part: demand is racing up, so clean energy has to run just to keep coal from growing.", read: "Total electricity demand in terawatt-hours, rising year after year.", watch: "Renewables can grow fast and still not cover new demand, leaving coal to fill the gap." },
      { indicator: "energy.ember.carbon_intensity", chart: "line", title: "How dirty each unit of electricity is", size: "small", window: "full", beat: "intensity",
        why: "Progress per kilowatt-hour: is the grid getting cleaner?", read: "Grams of CO₂ emitted per kilowatt-hour, edging down as cleaner sources are added.", watch: "Intensity falls slowly because coal still sets the baseline; it is improving, not transformed." }
    ]
  },
  {
    id: "q.energy.access",
    question: "Do nearly all Indians have electricity now?",
    priority: "core",
    indicators: ["energy.electricity_access"],
    core: ["energy.electricity_access"],
    // Blended: World Bank for access/cooking/per-capita electricity (to 2025);
    // EIA for total energy per person (to 2024) — together they separate "has a
    // connection" from "uses much energy", the honest answer to this question.
    context: [
      "energy.clean_cooking_access",
      "energy.electric_power_consumption_pc",
      "energy.eia.energy_per_capita"
    ],
    visualPlan: [
      { indicator: "energy.electricity_access", chart: "line", title: "Share of Indians with electricity", size: "hero", window: "full", beat: "answer",
        why: "The direct answer: how close India is to universal household electricity access.", read: "Percent of the population with access to electricity, now near 100%.", watch: "Access means a connection exists, not that supply is reliable, affordable, or 24×7." },
      { indicator: "energy.clean_cooking_access", chart: "line", title: "Access to clean cooking fuel", size: "feature", window: "full", beat: "the-real-gap",
        why: "The gap the headline hides: a wired home can still cook on wood or dung.", read: "Percent with access to clean fuels and technologies for cooking, far below the electricity line.", watch: "Clean cooking is a health story (indoor smoke), distinct from having a power connection." },
      { indicator: "energy.electric_power_consumption_pc", chart: "line", title: "Electricity used per person", size: "small", window: "full", beat: "access-not-usage",
        why: "Access is not the same as use: per-person electricity is still low by world standards.", read: "Kilowatt-hours of electricity used per person per year.", watch: "A connection plus low use often signals supply gaps or affordability limits, not low need." },
      { indicator: "energy.eia.energy_per_capita", chart: "line", title: "Total energy used per person", size: "small", window: "full", beat: "energy-poverty",
        why: "The widest frame: all energy per person, the clearest single read on energy poverty.", read: "Total primary energy per person, in million Btu.", watch: "Rising, but still a fraction of rich-country levels; near-universal access has not closed the use gap." }
    ]
  },
  {
    id: "q.air.today",
    question: "How bad is India's air today?",
    priority: "core",
    indicators: ["climate.waqi.delhi", "climate.waqi.mumbai", "climate.waqi.kolkata", "climate.waqi.chennai", "climate.waqi.bengaluru"],
    core: ["climate.waqi.delhi", "climate.waqi.mumbai", "climate.waqi.kolkata", "climate.waqi.chennai", "climate.waqi.bengaluru"],
    context: []
  },
  {
    id: "q.climate.city_heat",
    question: "Are India's big cities getting hotter?",
    priority: "core",
    indicators: [
      "climate.berkeley.temp_anomaly",
      "climate.era5.temp_mean",
      "climate.openmeteo.delhi.mean_temperature",
      "climate.openmeteo.mumbai.mean_temperature",
      "climate.openmeteo.chennai.mean_temperature",
      "climate.openmeteo.bengaluru.mean_temperature"
    ],
    core: [
      "climate.berkeley.temp_anomaly",
      "climate.era5.temp_mean",
      "climate.openmeteo.delhi.mean_temperature",
      "climate.openmeteo.mumbai.mean_temperature",
      "climate.openmeteo.chennai.mean_temperature",
      "climate.openmeteo.bengaluru.mean_temperature"
    ],
    context: [
      "climate.berkeley.temp_abs",
      "climate.openmeteo.delhi.mean_temperature",
      "climate.openmeteo.mumbai.mean_temperature",
      "climate.openmeteo.kolkata.mean_temperature",
      "climate.openmeteo.chennai.mean_temperature",
      "climate.openmeteo.bengaluru.mean_temperature",
      "climate.openmeteo.jodhpur.mean_temperature",
      "climate.openmeteo.jaipur.mean_temperature",
      "climate.openmeteo.nagpur.mean_temperature",
      "climate.openmeteo.ahmedabad.mean_temperature",
      "climate.openmeteo.hyderabad.mean_temperature",
      "climate.openmeteo.patna.mean_temperature",
      "climate.openmeteo.lucknow.mean_temperature",
      "climate.openmeteo.bhopal.mean_temperature",
      "climate.openmeteo.varanasi.mean_temperature",
      "climate.openmeteo.bhubaneswar.mean_temperature",
      "climate.openmeteo.raipur.mean_temperature",
      "climate.openmeteo.ranchi.mean_temperature",
      "climate.openmeteo.srinagar.mean_temperature",
      "climate.openmeteo.pune.mean_temperature",
      "climate.openmeteo.surat.mean_temperature",
      "climate.openmeteo.indore.mean_temperature",
      "climate.openmeteo.gwalior.mean_temperature",
      "climate.openmeteo.visakhapatnam.mean_temperature",
      "climate.openmeteo.vijayawada.mean_temperature",
      "climate.openmeteo.coimbatore.mean_temperature",
      "climate.openmeteo.madurai.mean_temperature",
      "climate.openmeteo.kochi.mean_temperature",
      "climate.openmeteo.thiruvananthapuram.mean_temperature",
      "climate.openmeteo.guwahati.mean_temperature",
      "climate.openmeteo.shillong.mean_temperature",
      "climate.openmeteo.imphal.mean_temperature",
      "climate.openmeteo.agartala.mean_temperature",
      "climate.openmeteo.chandigarh.mean_temperature",
      "climate.openmeteo.amritsar.mean_temperature",
      "climate.openmeteo.dehradun.mean_temperature",
      "climate.openmeteo.shimla.mean_temperature",
      "climate.openmeteo.leh.mean_temperature",
      "climate.openmeteo.bikaner.mean_temperature",
      "climate.openmeteo.delhi.very_hot_days",
      "climate.openmeteo.mumbai.very_hot_days",
      "climate.openmeteo.kolkata.very_hot_days",
      "climate.openmeteo.chennai.very_hot_days",
      "climate.openmeteo.bengaluru.very_hot_days",
      "climate.openmeteo.jodhpur.very_hot_days",
      "climate.openmeteo.jaipur.very_hot_days",
      "climate.openmeteo.nagpur.very_hot_days",
      "climate.openmeteo.ahmedabad.very_hot_days",
      "climate.openmeteo.hyderabad.very_hot_days",
      "climate.openmeteo.patna.very_hot_days",
      "climate.openmeteo.lucknow.very_hot_days",
      "climate.openmeteo.bhopal.very_hot_days",
      "climate.openmeteo.varanasi.very_hot_days",
      "climate.openmeteo.bhubaneswar.very_hot_days",
      "climate.openmeteo.raipur.very_hot_days",
      "climate.openmeteo.ranchi.very_hot_days",
      "climate.openmeteo.srinagar.very_hot_days",
      "climate.openmeteo.pune.very_hot_days",
      "climate.openmeteo.surat.very_hot_days",
      "climate.openmeteo.indore.very_hot_days",
      "climate.openmeteo.gwalior.very_hot_days",
      "climate.openmeteo.visakhapatnam.very_hot_days",
      "climate.openmeteo.vijayawada.very_hot_days",
      "climate.openmeteo.coimbatore.very_hot_days",
      "climate.openmeteo.madurai.very_hot_days",
      "climate.openmeteo.kochi.very_hot_days",
      "climate.openmeteo.thiruvananthapuram.very_hot_days",
      "climate.openmeteo.guwahati.very_hot_days",
      "climate.openmeteo.shillong.very_hot_days",
      "climate.openmeteo.imphal.very_hot_days",
      "climate.openmeteo.agartala.very_hot_days",
      "climate.openmeteo.chandigarh.very_hot_days",
      "climate.openmeteo.amritsar.very_hot_days",
      "climate.openmeteo.dehradun.very_hot_days",
      "climate.openmeteo.shimla.very_hot_days",
      "climate.openmeteo.leh.very_hot_days",
      "climate.openmeteo.bikaner.very_hot_days",
      "climate.openmeteo.delhi.hot_nights",
      "climate.openmeteo.mumbai.hot_nights",
      "climate.openmeteo.kolkata.hot_nights",
      "climate.openmeteo.chennai.hot_nights",
      "climate.openmeteo.bengaluru.hot_nights",
      "climate.openmeteo.jodhpur.hot_nights",
      "climate.openmeteo.jaipur.hot_nights",
      "climate.openmeteo.nagpur.hot_nights",
      "climate.openmeteo.ahmedabad.hot_nights",
      "climate.openmeteo.hyderabad.hot_nights",
      "climate.openmeteo.patna.hot_nights",
      "climate.openmeteo.lucknow.hot_nights",
      "climate.openmeteo.bhopal.hot_nights",
      "climate.openmeteo.varanasi.hot_nights",
      "climate.openmeteo.bhubaneswar.hot_nights",
      "climate.openmeteo.raipur.hot_nights",
      "climate.openmeteo.ranchi.hot_nights",
      "climate.openmeteo.srinagar.hot_nights",
      "climate.openmeteo.pune.hot_nights",
      "climate.openmeteo.surat.hot_nights",
      "climate.openmeteo.indore.hot_nights",
      "climate.openmeteo.gwalior.hot_nights",
      "climate.openmeteo.visakhapatnam.hot_nights",
      "climate.openmeteo.vijayawada.hot_nights",
      "climate.openmeteo.coimbatore.hot_nights",
      "climate.openmeteo.madurai.hot_nights",
      "climate.openmeteo.kochi.hot_nights",
      "climate.openmeteo.thiruvananthapuram.hot_nights",
      "climate.openmeteo.guwahati.hot_nights",
      "climate.openmeteo.shillong.hot_nights",
      "climate.openmeteo.imphal.hot_nights",
      "climate.openmeteo.agartala.hot_nights",
      "climate.openmeteo.chandigarh.hot_nights",
      "climate.openmeteo.amritsar.hot_nights",
      "climate.openmeteo.dehradun.hot_nights",
      "climate.openmeteo.shimla.hot_nights",
      "climate.openmeteo.leh.hot_nights",
      "climate.openmeteo.bikaner.hot_nights",
      "climate.openmeteo.delhi.mean_apparent_temperature",
      "climate.openmeteo.mumbai.mean_apparent_temperature",
      "climate.openmeteo.kolkata.mean_apparent_temperature",
      "climate.openmeteo.chennai.mean_apparent_temperature",
      "climate.openmeteo.bengaluru.mean_apparent_temperature",
      "climate.openmeteo.jodhpur.mean_apparent_temperature",
      "climate.openmeteo.jaipur.mean_apparent_temperature",
      "climate.openmeteo.nagpur.mean_apparent_temperature",
      "climate.openmeteo.ahmedabad.mean_apparent_temperature",
      "climate.openmeteo.hyderabad.mean_apparent_temperature",
      "climate.openmeteo.patna.mean_apparent_temperature",
      "climate.openmeteo.lucknow.mean_apparent_temperature",
      "climate.openmeteo.bhopal.mean_apparent_temperature",
      "climate.openmeteo.varanasi.mean_apparent_temperature",
      "climate.openmeteo.bhubaneswar.mean_apparent_temperature",
      "climate.openmeteo.raipur.mean_apparent_temperature",
      "climate.openmeteo.ranchi.mean_apparent_temperature",
      "climate.openmeteo.srinagar.mean_apparent_temperature",
      "climate.openmeteo.pune.mean_apparent_temperature",
      "climate.openmeteo.surat.mean_apparent_temperature",
      "climate.openmeteo.indore.mean_apparent_temperature",
      "climate.openmeteo.gwalior.mean_apparent_temperature",
      "climate.openmeteo.visakhapatnam.mean_apparent_temperature",
      "climate.openmeteo.vijayawada.mean_apparent_temperature",
      "climate.openmeteo.coimbatore.mean_apparent_temperature",
      "climate.openmeteo.madurai.mean_apparent_temperature",
      "climate.openmeteo.kochi.mean_apparent_temperature",
      "climate.openmeteo.thiruvananthapuram.mean_apparent_temperature",
      "climate.openmeteo.guwahati.mean_apparent_temperature",
      "climate.openmeteo.shillong.mean_apparent_temperature",
      "climate.openmeteo.imphal.mean_apparent_temperature",
      "climate.openmeteo.agartala.mean_apparent_temperature",
      "climate.openmeteo.chandigarh.mean_apparent_temperature",
      "climate.openmeteo.amritsar.mean_apparent_temperature",
      "climate.openmeteo.dehradun.mean_apparent_temperature",
      "climate.openmeteo.shimla.mean_apparent_temperature",
      "climate.openmeteo.leh.mean_apparent_temperature",
      "climate.openmeteo.bikaner.mean_apparent_temperature",
      "climate.openmeteo.delhi.humid_heat_days",
      "climate.openmeteo.mumbai.humid_heat_days",
      "climate.openmeteo.kolkata.humid_heat_days",
      "climate.openmeteo.chennai.humid_heat_days",
      "climate.openmeteo.bengaluru.humid_heat_days",
      "climate.openmeteo.jodhpur.humid_heat_days",
      "climate.openmeteo.jaipur.humid_heat_days",
      "climate.openmeteo.nagpur.humid_heat_days",
      "climate.openmeteo.ahmedabad.humid_heat_days",
      "climate.openmeteo.hyderabad.humid_heat_days",
      "climate.openmeteo.patna.humid_heat_days",
      "climate.openmeteo.lucknow.humid_heat_days",
      "climate.openmeteo.bhopal.humid_heat_days",
      "climate.openmeteo.varanasi.humid_heat_days",
      "climate.openmeteo.bhubaneswar.humid_heat_days",
      "climate.openmeteo.raipur.humid_heat_days",
      "climate.openmeteo.ranchi.humid_heat_days",
      "climate.openmeteo.srinagar.humid_heat_days",
      "climate.openmeteo.pune.humid_heat_days",
      "climate.openmeteo.surat.humid_heat_days",
      "climate.openmeteo.indore.humid_heat_days",
      "climate.openmeteo.gwalior.humid_heat_days",
      "climate.openmeteo.visakhapatnam.humid_heat_days",
      "climate.openmeteo.vijayawada.humid_heat_days",
      "climate.openmeteo.coimbatore.humid_heat_days",
      "climate.openmeteo.madurai.humid_heat_days",
      "climate.openmeteo.kochi.humid_heat_days",
      "climate.openmeteo.thiruvananthapuram.humid_heat_days",
      "climate.openmeteo.guwahati.humid_heat_days",
      "climate.openmeteo.shillong.humid_heat_days",
      "climate.openmeteo.imphal.humid_heat_days",
      "climate.openmeteo.agartala.humid_heat_days",
      "climate.openmeteo.chandigarh.humid_heat_days",
      "climate.openmeteo.amritsar.humid_heat_days",
      "climate.openmeteo.dehradun.humid_heat_days",
      "climate.openmeteo.shimla.humid_heat_days",
      "climate.openmeteo.leh.humid_heat_days",
      "climate.openmeteo.bikaner.humid_heat_days"
    ],
    visualPlan: [
      { chart: "stripes", title: "India's warming, one stripe per year since 1817", size: "hero", beat: "national-backdrop", window: "full", unit: "°C vs 1951–1980",
        subtitle: "Berkeley Earth · India-wide annual temperature anomaly vs the 1951–1980 average",
        indicator: "climate.berkeley.temp_anomaly",
        why: "Before zooming into cities, establish that the whole country has warmed — the long, homogenised record makes the trend unmistakable." },
      { chart: "line", title: "India's average temperature has climbed about 1°C since the 1940s", size: "feature", beat: "national-backdrop", window: "full", unit: "°C",
        subtitle: "ERA5 reanalysis (Copernicus / ECMWF) · India-wide annual mean temperature",
        indicator: "climate.era5.temp_mean",
        why: "A second, independent dataset confirms the warming the stripes show." },
      { chart: "sparkGrid", title: "Every big city, one small chart: annual average temperature", size: "feature", beat: "all-cities", window: "full", unit: "°C",
        subtitle: "Open-Meteo ERA5 · annual mean of daily mean temperature, 1940–2025, 38 cities",
        series: [
          { indicator: "climate.openmeteo.delhi.mean_temperature", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.mean_temperature", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.mean_temperature", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.mean_temperature", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.mean_temperature", label: "Bengaluru" },
          { indicator: "climate.openmeteo.jodhpur.mean_temperature", label: "Jodhpur" },
          { indicator: "climate.openmeteo.jaipur.mean_temperature", label: "Jaipur" },
          { indicator: "climate.openmeteo.nagpur.mean_temperature", label: "Nagpur" },
          { indicator: "climate.openmeteo.ahmedabad.mean_temperature", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.hyderabad.mean_temperature", label: "Hyderabad" },
          { indicator: "climate.openmeteo.patna.mean_temperature", label: "Patna" },
          { indicator: "climate.openmeteo.lucknow.mean_temperature", label: "Lucknow" },
          { indicator: "climate.openmeteo.bhopal.mean_temperature", label: "Bhopal" },
          { indicator: "climate.openmeteo.varanasi.mean_temperature", label: "Varanasi" },
          { indicator: "climate.openmeteo.bhubaneswar.mean_temperature", label: "Bhubaneswar" },
          { indicator: "climate.openmeteo.raipur.mean_temperature", label: "Raipur" },
          { indicator: "climate.openmeteo.ranchi.mean_temperature", label: "Ranchi" },
          { indicator: "climate.openmeteo.srinagar.mean_temperature", label: "Srinagar" },
          { indicator: "climate.openmeteo.pune.mean_temperature", label: "Pune" },
          { indicator: "climate.openmeteo.surat.mean_temperature", label: "Surat" },
          { indicator: "climate.openmeteo.indore.mean_temperature", label: "Indore" },
          { indicator: "climate.openmeteo.gwalior.mean_temperature", label: "Gwalior" },
          { indicator: "climate.openmeteo.visakhapatnam.mean_temperature", label: "Visakhapatnam" },
          { indicator: "climate.openmeteo.vijayawada.mean_temperature", label: "Vijayawada" },
          { indicator: "climate.openmeteo.coimbatore.mean_temperature", label: "Coimbatore" },
          { indicator: "climate.openmeteo.madurai.mean_temperature", label: "Madurai" },
          { indicator: "climate.openmeteo.kochi.mean_temperature", label: "Kochi" },
          { indicator: "climate.openmeteo.thiruvananthapuram.mean_temperature", label: "Thiruvananthapuram" },
          { indicator: "climate.openmeteo.guwahati.mean_temperature", label: "Guwahati" },
          { indicator: "climate.openmeteo.shillong.mean_temperature", label: "Shillong" },
          { indicator: "climate.openmeteo.imphal.mean_temperature", label: "Imphal" },
          { indicator: "climate.openmeteo.agartala.mean_temperature", label: "Agartala" },
          { indicator: "climate.openmeteo.chandigarh.mean_temperature", label: "Chandigarh" },
          { indicator: "climate.openmeteo.amritsar.mean_temperature", label: "Amritsar" },
          { indicator: "climate.openmeteo.dehradun.mean_temperature", label: "Dehradun" },
          { indicator: "climate.openmeteo.shimla.mean_temperature", label: "Shimla" },
          { indicator: "climate.openmeteo.leh.mean_temperature", label: "Leh" },
          { indicator: "climate.openmeteo.bikaner.mean_temperature", label: "Bikaner" }
        ],
        why: "Thirty-eight small charts at once show whether cities move together or each on their own clock." },
      { chart: "rankedChange", diverging: true, title: "Almost every city is warmer — except two neighbours", size: "feature", beat: "ranked-warming", window: "full", unit: "°C",
        subtitle: "Open-Meteo ERA5 · 38 cities · warming since the 1940s (1940s average vs 2016–2025)",
        series: [
          { indicator: "climate.openmeteo.delhi.mean_temperature", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.mean_temperature", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.mean_temperature", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.mean_temperature", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.mean_temperature", label: "Bengaluru" },
          { indicator: "climate.openmeteo.jodhpur.mean_temperature", label: "Jodhpur" },
          { indicator: "climate.openmeteo.jaipur.mean_temperature", label: "Jaipur" },
          { indicator: "climate.openmeteo.nagpur.mean_temperature", label: "Nagpur" },
          { indicator: "climate.openmeteo.ahmedabad.mean_temperature", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.hyderabad.mean_temperature", label: "Hyderabad" },
          { indicator: "climate.openmeteo.patna.mean_temperature", label: "Patna" },
          { indicator: "climate.openmeteo.lucknow.mean_temperature", label: "Lucknow" },
          { indicator: "climate.openmeteo.bhopal.mean_temperature", label: "Bhopal" },
          { indicator: "climate.openmeteo.varanasi.mean_temperature", label: "Varanasi" },
          { indicator: "climate.openmeteo.bhubaneswar.mean_temperature", label: "Bhubaneswar" },
          { indicator: "climate.openmeteo.raipur.mean_temperature", label: "Raipur" },
          { indicator: "climate.openmeteo.ranchi.mean_temperature", label: "Ranchi" },
          { indicator: "climate.openmeteo.srinagar.mean_temperature", label: "Srinagar" },
          { indicator: "climate.openmeteo.pune.mean_temperature", label: "Pune" },
          { indicator: "climate.openmeteo.surat.mean_temperature", label: "Surat" },
          { indicator: "climate.openmeteo.indore.mean_temperature", label: "Indore" },
          { indicator: "climate.openmeteo.gwalior.mean_temperature", label: "Gwalior" },
          { indicator: "climate.openmeteo.visakhapatnam.mean_temperature", label: "Visakhapatnam" },
          { indicator: "climate.openmeteo.vijayawada.mean_temperature", label: "Vijayawada" },
          { indicator: "climate.openmeteo.coimbatore.mean_temperature", label: "Coimbatore" },
          { indicator: "climate.openmeteo.madurai.mean_temperature", label: "Madurai" },
          { indicator: "climate.openmeteo.kochi.mean_temperature", label: "Kochi" },
          { indicator: "climate.openmeteo.thiruvananthapuram.mean_temperature", label: "Thiruvananthapuram" },
          { indicator: "climate.openmeteo.guwahati.mean_temperature", label: "Guwahati" },
          { indicator: "climate.openmeteo.shillong.mean_temperature", label: "Shillong" },
          { indicator: "climate.openmeteo.imphal.mean_temperature", label: "Imphal" },
          { indicator: "climate.openmeteo.agartala.mean_temperature", label: "Agartala" },
          { indicator: "climate.openmeteo.chandigarh.mean_temperature", label: "Chandigarh" },
          { indicator: "climate.openmeteo.amritsar.mean_temperature", label: "Amritsar" },
          { indicator: "climate.openmeteo.dehradun.mean_temperature", label: "Dehradun" },
          { indicator: "climate.openmeteo.shimla.mean_temperature", label: "Shimla" },
          { indicator: "climate.openmeteo.leh.mean_temperature", label: "Leh" },
          { indicator: "climate.openmeteo.bikaner.mean_temperature", label: "Bikaner" }
        ],
        why: "Comparing decade averages, not single noisy years, gives an honest ranking — and exposes the one city that bucks the trend." },
      { chart: "sparkGrid", title: "Very hot afternoons send no single signal", size: "feature", beat: "hot-days", window: "full", unit: "days",
        subtitle: "Open-Meteo ERA5 · days at or above 35°C each year, 1940–2025, 38 cities",
        series: [
          { indicator: "climate.openmeteo.delhi.very_hot_days", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.very_hot_days", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.very_hot_days", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.very_hot_days", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.very_hot_days", label: "Bengaluru" },
          { indicator: "climate.openmeteo.jodhpur.very_hot_days", label: "Jodhpur" },
          { indicator: "climate.openmeteo.jaipur.very_hot_days", label: "Jaipur" },
          { indicator: "climate.openmeteo.nagpur.very_hot_days", label: "Nagpur" },
          { indicator: "climate.openmeteo.ahmedabad.very_hot_days", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.hyderabad.very_hot_days", label: "Hyderabad" },
          { indicator: "climate.openmeteo.patna.very_hot_days", label: "Patna" },
          { indicator: "climate.openmeteo.lucknow.very_hot_days", label: "Lucknow" },
          { indicator: "climate.openmeteo.bhopal.very_hot_days", label: "Bhopal" },
          { indicator: "climate.openmeteo.varanasi.very_hot_days", label: "Varanasi" },
          { indicator: "climate.openmeteo.bhubaneswar.very_hot_days", label: "Bhubaneswar" },
          { indicator: "climate.openmeteo.raipur.very_hot_days", label: "Raipur" },
          { indicator: "climate.openmeteo.ranchi.very_hot_days", label: "Ranchi" },
          { indicator: "climate.openmeteo.srinagar.very_hot_days", label: "Srinagar" },
          { indicator: "climate.openmeteo.pune.very_hot_days", label: "Pune" },
          { indicator: "climate.openmeteo.surat.very_hot_days", label: "Surat" },
          { indicator: "climate.openmeteo.indore.very_hot_days", label: "Indore" },
          { indicator: "climate.openmeteo.gwalior.very_hot_days", label: "Gwalior" },
          { indicator: "climate.openmeteo.visakhapatnam.very_hot_days", label: "Visakhapatnam" },
          { indicator: "climate.openmeteo.vijayawada.very_hot_days", label: "Vijayawada" },
          { indicator: "climate.openmeteo.coimbatore.very_hot_days", label: "Coimbatore" },
          { indicator: "climate.openmeteo.madurai.very_hot_days", label: "Madurai" },
          { indicator: "climate.openmeteo.kochi.very_hot_days", label: "Kochi" },
          { indicator: "climate.openmeteo.thiruvananthapuram.very_hot_days", label: "Thiruvananthapuram" },
          { indicator: "climate.openmeteo.guwahati.very_hot_days", label: "Guwahati" },
          { indicator: "climate.openmeteo.shillong.very_hot_days", label: "Shillong" },
          { indicator: "climate.openmeteo.imphal.very_hot_days", label: "Imphal" },
          { indicator: "climate.openmeteo.agartala.very_hot_days", label: "Agartala" },
          { indicator: "climate.openmeteo.chandigarh.very_hot_days", label: "Chandigarh" },
          { indicator: "climate.openmeteo.amritsar.very_hot_days", label: "Amritsar" },
          { indicator: "climate.openmeteo.dehradun.very_hot_days", label: "Dehradun" },
          { indicator: "climate.openmeteo.shimla.very_hot_days", label: "Shimla" },
          { indicator: "climate.openmeteo.leh.very_hot_days", label: "Leh" },
          { indicator: "climate.openmeteo.bikaner.very_hot_days", label: "Bikaner" }
        ],
        why: "A fixed 35°C threshold rises in some cities and falls in others, so the afternoon peak is a poor summary of urban heat." },
      { chart: "rankedChange", title: "Hot nights are rising in almost every city", size: "feature", beat: "hot-nights", window: "full", unit: "nights",
        subtitle: "Open-Meteo ERA5 · nights at or above 28°C · 1940s average vs 2016–2025, with the change",
        series: [
          { indicator: "climate.openmeteo.delhi.hot_nights", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.hot_nights", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.hot_nights", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.hot_nights", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.hot_nights", label: "Bengaluru" },
          { indicator: "climate.openmeteo.jodhpur.hot_nights", label: "Jodhpur" },
          { indicator: "climate.openmeteo.jaipur.hot_nights", label: "Jaipur" },
          { indicator: "climate.openmeteo.nagpur.hot_nights", label: "Nagpur" },
          { indicator: "climate.openmeteo.ahmedabad.hot_nights", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.hyderabad.hot_nights", label: "Hyderabad" },
          { indicator: "climate.openmeteo.patna.hot_nights", label: "Patna" },
          { indicator: "climate.openmeteo.lucknow.hot_nights", label: "Lucknow" },
          { indicator: "climate.openmeteo.bhopal.hot_nights", label: "Bhopal" },
          { indicator: "climate.openmeteo.varanasi.hot_nights", label: "Varanasi" },
          { indicator: "climate.openmeteo.bhubaneswar.hot_nights", label: "Bhubaneswar" },
          { indicator: "climate.openmeteo.raipur.hot_nights", label: "Raipur" },
          { indicator: "climate.openmeteo.ranchi.hot_nights", label: "Ranchi" },
          { indicator: "climate.openmeteo.srinagar.hot_nights", label: "Srinagar" },
          { indicator: "climate.openmeteo.pune.hot_nights", label: "Pune" },
          { indicator: "climate.openmeteo.surat.hot_nights", label: "Surat" },
          { indicator: "climate.openmeteo.indore.hot_nights", label: "Indore" },
          { indicator: "climate.openmeteo.gwalior.hot_nights", label: "Gwalior" },
          { indicator: "climate.openmeteo.visakhapatnam.hot_nights", label: "Visakhapatnam" },
          { indicator: "climate.openmeteo.vijayawada.hot_nights", label: "Vijayawada" },
          { indicator: "climate.openmeteo.coimbatore.hot_nights", label: "Coimbatore" },
          { indicator: "climate.openmeteo.madurai.hot_nights", label: "Madurai" },
          { indicator: "climate.openmeteo.kochi.hot_nights", label: "Kochi" },
          { indicator: "climate.openmeteo.thiruvananthapuram.hot_nights", label: "Thiruvananthapuram" },
          { indicator: "climate.openmeteo.guwahati.hot_nights", label: "Guwahati" },
          { indicator: "climate.openmeteo.shillong.hot_nights", label: "Shillong" },
          { indicator: "climate.openmeteo.imphal.hot_nights", label: "Imphal" },
          { indicator: "climate.openmeteo.agartala.hot_nights", label: "Agartala" },
          { indicator: "climate.openmeteo.chandigarh.hot_nights", label: "Chandigarh" },
          { indicator: "climate.openmeteo.amritsar.hot_nights", label: "Amritsar" },
          { indicator: "climate.openmeteo.dehradun.hot_nights", label: "Dehradun" },
          { indicator: "climate.openmeteo.shimla.hot_nights", label: "Shimla" },
          { indicator: "climate.openmeteo.leh.hot_nights", label: "Leh" },
          { indicator: "climate.openmeteo.bikaner.hot_nights", label: "Bikaner" }
        ],
        why: "Night heat is the clearest health signal, and unlike the afternoon metric it climbs almost everywhere." },
      { chart: "multiLine", title: "The cities where the night stopped cooling", size: "feature", beat: "night-heat-detail", window: "full", unit: "nights",
        subtitle: "Open-Meteo ERA5 · nights at or above 28°C per year, 1940–2025",
        series: [
          { indicator: "climate.openmeteo.chennai.hot_nights", label: "Chennai" },
          { indicator: "climate.openmeteo.jodhpur.hot_nights", label: "Jodhpur" },
          { indicator: "climate.openmeteo.patna.hot_nights", label: "Patna" },
          { indicator: "climate.openmeteo.ahmedabad.hot_nights", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.kolkata.hot_nights", label: "Kolkata" },
          { indicator: "climate.openmeteo.mumbai.hot_nights", label: "Mumbai" }
        ],
        indicator: "climate.openmeteo.chennai.hot_nights",
        why: "The year-by-year lines show how recent and how steep the night-heat climb has been in the worst-hit cities." },
      { chart: "sparkGrid", title: "How hot it actually feels, city by city", size: "feature", beat: "feels-like", window: "full", unit: "°C",
        subtitle: "Open-Meteo ERA5 · annual mean feels-like temperature (humidity-adjusted), 1940–2025, 38 cities",
        series: [
          { indicator: "climate.openmeteo.delhi.mean_apparent_temperature", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.mean_apparent_temperature", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.mean_apparent_temperature", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.mean_apparent_temperature", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.mean_apparent_temperature", label: "Bengaluru" },
          { indicator: "climate.openmeteo.jodhpur.mean_apparent_temperature", label: "Jodhpur" },
          { indicator: "climate.openmeteo.jaipur.mean_apparent_temperature", label: "Jaipur" },
          { indicator: "climate.openmeteo.nagpur.mean_apparent_temperature", label: "Nagpur" },
          { indicator: "climate.openmeteo.ahmedabad.mean_apparent_temperature", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.hyderabad.mean_apparent_temperature", label: "Hyderabad" },
          { indicator: "climate.openmeteo.patna.mean_apparent_temperature", label: "Patna" },
          { indicator: "climate.openmeteo.lucknow.mean_apparent_temperature", label: "Lucknow" },
          { indicator: "climate.openmeteo.bhopal.mean_apparent_temperature", label: "Bhopal" },
          { indicator: "climate.openmeteo.varanasi.mean_apparent_temperature", label: "Varanasi" },
          { indicator: "climate.openmeteo.bhubaneswar.mean_apparent_temperature", label: "Bhubaneswar" },
          { indicator: "climate.openmeteo.raipur.mean_apparent_temperature", label: "Raipur" },
          { indicator: "climate.openmeteo.ranchi.mean_apparent_temperature", label: "Ranchi" },
          { indicator: "climate.openmeteo.srinagar.mean_apparent_temperature", label: "Srinagar" },
          { indicator: "climate.openmeteo.pune.mean_apparent_temperature", label: "Pune" },
          { indicator: "climate.openmeteo.surat.mean_apparent_temperature", label: "Surat" },
          { indicator: "climate.openmeteo.indore.mean_apparent_temperature", label: "Indore" },
          { indicator: "climate.openmeteo.gwalior.mean_apparent_temperature", label: "Gwalior" },
          { indicator: "climate.openmeteo.visakhapatnam.mean_apparent_temperature", label: "Visakhapatnam" },
          { indicator: "climate.openmeteo.vijayawada.mean_apparent_temperature", label: "Vijayawada" },
          { indicator: "climate.openmeteo.coimbatore.mean_apparent_temperature", label: "Coimbatore" },
          { indicator: "climate.openmeteo.madurai.mean_apparent_temperature", label: "Madurai" },
          { indicator: "climate.openmeteo.kochi.mean_apparent_temperature", label: "Kochi" },
          { indicator: "climate.openmeteo.thiruvananthapuram.mean_apparent_temperature", label: "Thiruvananthapuram" },
          { indicator: "climate.openmeteo.guwahati.mean_apparent_temperature", label: "Guwahati" },
          { indicator: "climate.openmeteo.shillong.mean_apparent_temperature", label: "Shillong" },
          { indicator: "climate.openmeteo.imphal.mean_apparent_temperature", label: "Imphal" },
          { indicator: "climate.openmeteo.agartala.mean_apparent_temperature", label: "Agartala" },
          { indicator: "climate.openmeteo.chandigarh.mean_apparent_temperature", label: "Chandigarh" },
          { indicator: "climate.openmeteo.amritsar.mean_apparent_temperature", label: "Amritsar" },
          { indicator: "climate.openmeteo.dehradun.mean_apparent_temperature", label: "Dehradun" },
          { indicator: "climate.openmeteo.shimla.mean_apparent_temperature", label: "Shimla" },
          { indicator: "climate.openmeteo.leh.mean_apparent_temperature", label: "Leh" },
          { indicator: "climate.openmeteo.bikaner.mean_apparent_temperature", label: "Bikaner" }
        ],
        why: "Feels-like temperature folds in humidity, so it reveals heat the dry thermometer misses — especially on the coasts." },
      { chart: "rankedChange", title: "Days when it feels like 40°C or hotter", size: "feature", beat: "humid-heat", window: "full", unit: "days",
        subtitle: "Open-Meteo ERA5 · days with feels-like maximum at or above 40°C · 1940s average vs 2016–2025, with the change",
        series: [
          { indicator: "climate.openmeteo.delhi.humid_heat_days", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.humid_heat_days", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.humid_heat_days", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.humid_heat_days", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.humid_heat_days", label: "Bengaluru" },
          { indicator: "climate.openmeteo.jodhpur.humid_heat_days", label: "Jodhpur" },
          { indicator: "climate.openmeteo.jaipur.humid_heat_days", label: "Jaipur" },
          { indicator: "climate.openmeteo.nagpur.humid_heat_days", label: "Nagpur" },
          { indicator: "climate.openmeteo.ahmedabad.humid_heat_days", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.hyderabad.humid_heat_days", label: "Hyderabad" },
          { indicator: "climate.openmeteo.patna.humid_heat_days", label: "Patna" },
          { indicator: "climate.openmeteo.lucknow.humid_heat_days", label: "Lucknow" },
          { indicator: "climate.openmeteo.bhopal.humid_heat_days", label: "Bhopal" },
          { indicator: "climate.openmeteo.varanasi.humid_heat_days", label: "Varanasi" },
          { indicator: "climate.openmeteo.bhubaneswar.humid_heat_days", label: "Bhubaneswar" },
          { indicator: "climate.openmeteo.raipur.humid_heat_days", label: "Raipur" },
          { indicator: "climate.openmeteo.ranchi.humid_heat_days", label: "Ranchi" },
          { indicator: "climate.openmeteo.srinagar.humid_heat_days", label: "Srinagar" },
          { indicator: "climate.openmeteo.pune.humid_heat_days", label: "Pune" },
          { indicator: "climate.openmeteo.surat.humid_heat_days", label: "Surat" },
          { indicator: "climate.openmeteo.indore.humid_heat_days", label: "Indore" },
          { indicator: "climate.openmeteo.gwalior.humid_heat_days", label: "Gwalior" },
          { indicator: "climate.openmeteo.visakhapatnam.humid_heat_days", label: "Visakhapatnam" },
          { indicator: "climate.openmeteo.vijayawada.humid_heat_days", label: "Vijayawada" },
          { indicator: "climate.openmeteo.coimbatore.humid_heat_days", label: "Coimbatore" },
          { indicator: "climate.openmeteo.madurai.humid_heat_days", label: "Madurai" },
          { indicator: "climate.openmeteo.kochi.humid_heat_days", label: "Kochi" },
          { indicator: "climate.openmeteo.thiruvananthapuram.humid_heat_days", label: "Thiruvananthapuram" },
          { indicator: "climate.openmeteo.guwahati.humid_heat_days", label: "Guwahati" },
          { indicator: "climate.openmeteo.shillong.humid_heat_days", label: "Shillong" },
          { indicator: "climate.openmeteo.imphal.humid_heat_days", label: "Imphal" },
          { indicator: "climate.openmeteo.agartala.humid_heat_days", label: "Agartala" },
          { indicator: "climate.openmeteo.chandigarh.humid_heat_days", label: "Chandigarh" },
          { indicator: "climate.openmeteo.amritsar.humid_heat_days", label: "Amritsar" },
          { indicator: "climate.openmeteo.dehradun.humid_heat_days", label: "Dehradun" },
          { indicator: "climate.openmeteo.shimla.humid_heat_days", label: "Shimla" },
          { indicator: "climate.openmeteo.leh.humid_heat_days", label: "Leh" },
          { indicator: "climate.openmeteo.bikaner.humid_heat_days", label: "Bikaner" }
        ],
        why: "This humidity-aware danger count is the wet-bulb dimension the temperature charts cannot show." },
      { chart: "multiLine", title: "Where humid heat is climbing fastest", size: "feature", beat: "humid-heat-detail", window: "full", unit: "days",
        subtitle: "Open-Meteo ERA5 · days with feels-like maximum at or above 40°C per year, 1940–2025",
        series: [
          { indicator: "climate.openmeteo.madurai.humid_heat_days", label: "Madurai" },
          { indicator: "climate.openmeteo.kochi.humid_heat_days", label: "Kochi" },
          { indicator: "climate.openmeteo.guwahati.humid_heat_days", label: "Guwahati" },
          { indicator: "climate.openmeteo.kolkata.humid_heat_days", label: "Kolkata" },
          { indicator: "climate.openmeteo.vijayawada.humid_heat_days", label: "Vijayawada" },
          { indicator: "climate.openmeteo.chennai.humid_heat_days", label: "Chennai" }
        ],
        indicator: "climate.openmeteo.madurai.humid_heat_days",
        why: "The fastest-rising cities show how quickly dangerous feels-like heat is accumulating, on the coasts and in the Northeast." }
    ]
  },
  {
    id: "q.climate.heat_mortality",
    question: "Are India's heat deaths being counted?",
    priority: "core",
    indicators: [
      "climate.temp_anomaly_annual",
      "climate.era5.state_warming",
      "climate.era5.rel_humidity_mean",
      "climate.era5.hotdays40_observed",
      "climate.era5.warmnights26_observed",
      "climate.cckp.heatindex39_historical",
      "climate.cckp.heatindex39_ssp126",
      "climate.cckp.heatindex39_ssp245",
      "climate.cckp.heatindex39_ssp585",
      "climate.cckp.heatindex39_scenario_maps",
      "climate.cckp.cdd_historical",
      "climate.cckp.cdd_ssp126",
      "climate.cckp.cdd_ssp245",
      "climate.cckp.cdd_ssp585",
      "climate.openmeteo.delhi.very_hot_days",
      "climate.openmeteo.mumbai.very_hot_days",
      "climate.openmeteo.chennai.very_hot_days",
      "climate.openmeteo.kolkata.very_hot_days",
      "climate.openmeteo.bengaluru.very_hot_days",
      "climate.openmeteo.jodhpur.very_hot_days",
      "climate.openmeteo.nagpur.very_hot_days",
      "climate.openmeteo.lucknow.very_hot_days",
      "climate.openmeteo.patna.very_hot_days",
      "climate.openmeteo.hyderabad.very_hot_days",
      "climate.openmeteo.jaipur.very_hot_days",
      "climate.openmeteo.ahmedabad.very_hot_days",
      "climate.openmeteo.bhopal.very_hot_days",
      "climate.openmeteo.varanasi.very_hot_days",
      "climate.openmeteo.bhubaneswar.very_hot_days",
      "climate.openmeteo.raipur.very_hot_days",
      "climate.openmeteo.ranchi.very_hot_days",
      "climate.openmeteo.srinagar.very_hot_days",
      "climate.openmeteo.delhi.hot_nights",
      "climate.openmeteo.mumbai.hot_nights",
      "climate.openmeteo.chennai.hot_nights",
      "climate.openmeteo.bengaluru.hot_nights",
      "heat.death_count_comparison",
      "heat.counting.death_certification_funnel",
      "heat.mccd.certified_deaths_by_state",
      "heat.sensitivity_scale_check",
      "heat.reported_extreme_temperature_deaths.owid_emdat",
      "heat.imd_dwe_2024.heatwave_deaths_by_month",
      "heat.imd_dwe_2024.heatwave_deaths_by_state",
      "heat.imd_dwe.heatwave_deaths_annual",
      "heat.lancet_countdown_2025.extracted_indicators",
      "heat.human_climate_horizons.india",
      "heat.context.crude_death_rate",
      "heat.context.agriculture_employment_share",
      "heat.context.vulnerable_employment_share",
      "heat.context.electricity_access",
      "heat.context.population_65plus_share",
      "heat.context.urban_population_share",
      "heat.context.pm25_exposure",
      "work.ilo.informal_rate_agriculture",
      "work.plfs.empshare_agriculture",
      "work.plfs.empshare_industry",
      "work.plfs.empshare_services",
      "heat.work.worker_security_exposure",
      "heat.work.lancet_labour_loss_sector_shares",
      "heat.cooling.ac_urban",
      "heat.cooling.ac_rural",
      "heat.cooling.cooler_urban",
      "heat.cooling.cooler_rural",
      "heat.cooling.ac_all",
      "heat.cooling.cooler_all",
      "heat.cooling.nfhs6_electricity_all",
      "heat.cooling.nfhs6_electricity_urban",
      "heat.cooling.nfhs6_electricity_rural",
      "heat.cooling.nfhs5_fan_all",
      "heat.cooling.nfhs5_ac_cooler_all",
      "heat.cooling.nfhs5_ac_cooler_urban",
      "heat.cooling.nfhs5_ac_cooler_rural",
      "heat.cooling.cooler_by_state",
      "heat.health.anaemia_children",
      "heat.health.anaemia_women",
      "heat.health.anaemia_men",
      "heat.ceew.state_heat_risk",
      "heat.ceew.districts_high_risk_share",
      "heat.ceew.population_high_risk_share",
      "heat.vulnerability.state_risk_cooling_poverty",
      "heat.affordability.lowest_rural_mpce_states",
      "heat.poverty.mpi_by_state",
      "heat.poverty.mpi_national"
    ],
    core: [
      "climate.temp_anomaly_annual",
      "climate.era5.state_warming",
      "climate.cckp.heatindex39_historical",
      "heat.cooling.cooler_by_state",
      "heat.ceew.state_heat_risk",
      "climate.cckp.heatindex39_scenario_maps",
      "heat.vulnerability.state_risk_cooling_poverty",
      "heat.poverty.mpi_by_state",
      "heat.death_count_comparison",
      "heat.counting.death_certification_funnel",
      "heat.mccd.certified_deaths_by_state",
      "heat.imd_dwe_2024.heatwave_deaths_by_state",
      "heat.imd_dwe.heatwave_deaths_annual",
      "heat.sensitivity_scale_check"
    ],
    context: [
      "climate.era5.rel_humidity_mean",
      "climate.era5.hotdays40_observed",
      "climate.era5.warmnights26_observed",
      "climate.cckp.heatindex39_ssp126",
      "climate.cckp.heatindex39_ssp245",
      "climate.cckp.heatindex39_ssp585",
      "climate.cckp.heatindex39_scenario_maps",
      "climate.cckp.cdd_historical",
      "climate.cckp.cdd_ssp126",
      "climate.cckp.cdd_ssp245",
      "climate.cckp.cdd_ssp585",
      "climate.openmeteo.delhi.very_hot_days",
      "climate.openmeteo.mumbai.very_hot_days",
      "climate.openmeteo.chennai.very_hot_days",
      "climate.openmeteo.kolkata.very_hot_days",
      "climate.openmeteo.bengaluru.very_hot_days",
      "climate.openmeteo.jodhpur.very_hot_days",
      "climate.openmeteo.nagpur.very_hot_days",
      "climate.openmeteo.lucknow.very_hot_days",
      "climate.openmeteo.patna.very_hot_days",
      "climate.openmeteo.hyderabad.very_hot_days",
      "climate.openmeteo.jaipur.very_hot_days",
      "climate.openmeteo.ahmedabad.very_hot_days",
      "climate.openmeteo.bhopal.very_hot_days",
      "climate.openmeteo.varanasi.very_hot_days",
      "climate.openmeteo.bhubaneswar.very_hot_days",
      "climate.openmeteo.raipur.very_hot_days",
      "climate.openmeteo.ranchi.very_hot_days",
      "climate.openmeteo.srinagar.very_hot_days",
      "climate.openmeteo.delhi.hot_nights",
      "climate.openmeteo.mumbai.hot_nights",
      "climate.openmeteo.chennai.hot_nights",
      "climate.openmeteo.bengaluru.hot_nights",
      "heat.counting.death_certification_funnel",
      "heat.mccd.certified_deaths_by_state",
      "heat.reported_extreme_temperature_deaths.owid_emdat",
      "heat.imd_dwe_2024.heatwave_deaths_by_month",
      "heat.lancet_countdown_2025.extracted_indicators",
      "heat.human_climate_horizons.india",
      "heat.context.crude_death_rate",
      "heat.context.agriculture_employment_share",
      "heat.context.vulnerable_employment_share",
      "heat.context.electricity_access",
      "heat.context.population_65plus_share",
      "heat.context.urban_population_share",
      "heat.context.pm25_exposure",
      "work.ilo.informal_rate_agriculture",
      "work.plfs.empshare_agriculture",
      "work.plfs.empshare_industry",
      "work.plfs.empshare_services",
      "heat.cooling.ac_urban",
      "heat.cooling.ac_rural",
      "heat.cooling.cooler_urban",
      "heat.cooling.cooler_rural",
      "heat.cooling.ac_all",
      "heat.cooling.cooler_all",
      "heat.cooling.nfhs6_electricity_all",
      "heat.cooling.nfhs6_electricity_urban",
      "heat.cooling.nfhs6_electricity_rural",
      "heat.cooling.nfhs5_fan_all",
      "heat.cooling.nfhs5_ac_cooler_all",
      "heat.cooling.nfhs5_ac_cooler_urban",
      "heat.cooling.nfhs5_ac_cooler_rural",
      "heat.cooling.cooler_by_state",
      "heat.health.anaemia_children",
      "heat.health.anaemia_women",
      "heat.health.anaemia_men",
      "heat.ceew.state_heat_risk",
      "heat.ceew.districts_high_risk_share",
      "heat.ceew.population_high_risk_share",
      "heat.vulnerability.state_risk_cooling_poverty",
      "heat.poverty.mpi_by_state",
      "heat.poverty.mpi_national"
    ],
    visualPlan: [
      // ACT I — the heat is real, and it is uneven (signal: line, stripes, decade staircase, the map, humidity)
      { indicator: "climate.temp_anomaly_annual", chart: "line", title: "India is running hotter than the climate it was built for", size: "hero", beat: "signal",
        subtitle: "OWID / Copernicus ERA5 · annual temperature anomaly vs 1991-2020",
        why: "A viral death number means nothing until you know whether the heat behind it is real. It is: India's average year now runs well above the climate its cities, crops and hospitals were designed around.",
        read: "Each point is how far that year sat above or below the 1991-2020 normal. Above zero is a hotter-than-normal year. Watch the drift of the whole line, not the last dot.",
        watch: "This is a national yearly average, so it is gentler than the afternoon a roof-tiler or a Delhi family actually lives through. The spikes are where the danger is, and the average smooths them out." },
      { indicator: "climate.temp_anomaly_annual", chart: "stripes", title: "A warming century, one stripe per year", size: "feature", beat: "signal", unit: "°C vs 1991-2020",
        why: "The same warming with no axis to argue with, the famous climate-stripes view: blue years gave way to red.",
        read: "Each vertical band is one year, blue for cooler than normal, red for hotter. Read left to right; the slide from blue to red is the warming.",
        watch: "Colour shows rank, not exact degrees. Use the line above for precise values." },
      { indicator: "climate.temp_anomaly_annual", chart: "decadeBars", title: "Each decade has been hotter than the one before", size: "small", beat: "signal", unit: "°C vs 1991-2020",
        why: "Smooth out the year-to-year noise and the warming becomes a staircase, not a wobble.",
        read: "Each bar is the average anomaly for a whole decade. Bars below the line are cooler-than-normal decades, bars above are hotter.",
        watch: "Decade averages flatten extremes; a calm-looking decade can still hold a record-breaking heatwave year." },
      { indicator: "climate.era5.state_warming", chart: "choropleth", title: "The warming is not shared evenly across the map", size: "feature", beat: "regional", unit: "°C warmer", signed: true, rankLabel: "Warmed most", bottomLabel: "Warmed least",
        subtitle: "Copernicus ERA5 · warming of 2015-2024 vs the 1951-1980 baseline, by state",
        why: "One national number hides the geography, and India's heat lands unevenly: a single figure cannot tell a farmer in Telangana from a herder in Ladakh.",
        read: "Each state is shaded by how much its average temperature has risen. Darker means more warming. The Himalayan states have heated fastest; the densest, most-exposed plains are warming too.",
        watch: "Fastest warming is not the same as most danger: the mountains warm most in degrees, but the deadly heat is where heat, humidity and crowds meet on the plains. State averages still smooth over local extremes." },
      { indicator: "climate.era5.rel_humidity_mean", chart: "line", title: "And it is not only the heat, it is the humidity", size: "small", beat: "heat-stress", window: "full",
        subtitle: "Copernicus ERA5 · average relative humidity over India",
        why: "Dry heat the body can survive by sweating; humid heat is what kills, because sweat stops working when the air is already wet.",
        read: "Average relative humidity across India. Combined with rising temperature, higher humidity pushes up the 'feels-like' heat the body actually has to fight.",
        watch: "This is an annual national mean. The lethal combination is high heat and high humidity together, in specific weeks and places, which a yearly average cannot show." },
      // ACT II — how the heat reaches the body (heat-index fan to 2100, very hot days, hot nights, cooling demand)
      { chart: "multiLine", title: "Days that feel dangerously hot, now and to 2100", size: "feature", beat: "exposure", window: "full", unit: "days",
        subtitle: "World Bank CCKP · CMIP6 · days with a heat index of 39°C or higher",
        series: [
          { indicator: "climate.cckp.heatindex39_historical", label: "Observed (to 2014)" },
          { indicator: "climate.cckp.heatindex39_ssp126", label: "Low emissions" },
          { indicator: "climate.cckp.heatindex39_ssp245", label: "Middle road" },
          { indicator: "climate.cckp.heatindex39_ssp585", label: "High emissions" }
        ],
        indicator: "climate.cckp.heatindex39_ssp245",
        why: "The heat index counts the days the air actually feels dangerous, temperature and humidity together. About 5 such days a year in the 1950s, 14 by 2014, and tens more by 2100 depending on how much the world keeps emitting.",
        read: "The observed line runs to 2014, then three projections fan out by emissions, low to high. How hot it gets is still a choice.",
        watch: "The observed line is a model's historical run, not live measurement, and it ends in 2014; the rest are projections, not a death count. Gangetic-plain humidity makes the lived danger far higher than this national average." },
      { chart: "multiLine", title: "What actually happened after 2014, where the models stop", size: "feature", beat: "observed-exposure", window: "full", unit: "days or nights",
        subtitle: "Copernicus ERA5 reanalysis · India-averaged days per year above threshold · 2015-2025",
        series: [
          { indicator: "climate.era5.warmnights26_observed", label: "Warm nights (min ≥ 26°C)" },
          { indicator: "climate.era5.hotdays40_observed", label: "Hot days (max ≥ 40°C)" }
        ],
        indicator: "climate.era5.warmnights26_observed",
        why: "The model-based exposure record stops in 2014, which is exactly when the worst heat years arrived. This is the observed reanalysis filling that gap: every year since, an average Indian location has seen 70 to 85 warm nights and 10 to 30 dangerously hot days. Exposure did not pause when the projections took over, and the warm nights, when the body cannot recover, vastly outnumber the extreme hot days.",
        read: "Each line is the India-averaged number of days per year above the threshold, from ERA5 reanalysis. Year-to-year wobble is normal weather; the point is the sustained high level of warm nights right through to 2025.",
        watch: "This is a reanalysis (a model blended with observations), India-averaged, so it smooths local extremes; its levels are not directly comparable to the CMIP6 model line above, which is why it is shown as its own observed series." },
      { chart: "rankedChange", title: "The local heat the national average hides", size: "feature", beat: "exposure", unit: "days/year ≥ 35°C",
        subtitle: "Days per year above 35°C: average year in the 1940s versus the average year from 2016-2025",
        series: [
          { indicator: "climate.openmeteo.jodhpur.very_hot_days", label: "Jodhpur" },
          { indicator: "climate.openmeteo.nagpur.very_hot_days", label: "Nagpur" },
          { indicator: "climate.openmeteo.delhi.very_hot_days", label: "Delhi" },
          { indicator: "climate.openmeteo.lucknow.very_hot_days", label: "Lucknow" },
          { indicator: "climate.openmeteo.jaipur.very_hot_days", label: "Jaipur" },
          { indicator: "climate.openmeteo.ahmedabad.very_hot_days", label: "Ahmedabad" },
          { indicator: "climate.openmeteo.bhopal.very_hot_days", label: "Bhopal" },
          { indicator: "climate.openmeteo.raipur.very_hot_days", label: "Raipur" },
          { indicator: "climate.openmeteo.varanasi.very_hot_days", label: "Varanasi" },
          { indicator: "climate.openmeteo.patna.very_hot_days", label: "Patna" },
          { indicator: "climate.openmeteo.ranchi.very_hot_days", label: "Ranchi" },
          { indicator: "climate.openmeteo.hyderabad.very_hot_days", label: "Hyderabad" },
          { indicator: "climate.openmeteo.bhubaneswar.very_hot_days", label: "Bhubaneswar" },
          { indicator: "climate.openmeteo.kolkata.very_hot_days", label: "Kolkata" },
          { indicator: "climate.openmeteo.mumbai.very_hot_days", label: "Mumbai" },
          { indicator: "climate.openmeteo.chennai.very_hot_days", label: "Chennai" },
          { indicator: "climate.openmeteo.srinagar.very_hot_days", label: "Srinagar" },
          { indicator: "climate.openmeteo.bengaluru.very_hot_days", label: "Bengaluru" }
        ],
        why: "A national average is a fiction nobody lives in. Read this mainly as a burden chart, not a trend chart: in the latest decade, Jodhpur averaged nearly 150 days a year above 35°C, and Delhi, Lucknow, Varanasi, Jaipur and Nagpur were around or above 100. That is a long very-hot season, not a short heatwave. The 1940s bars are there as reference, because several interior cities were already brutally hot before recent warming pushed the wider climate system upward.",
        read: "Read each row left to right: the muted bar is the 1940s baseline average, the hot bar is the 2016-2025 average, and the last column is the difference. Rows are sorted by the latest-decade heat burden, so the cities with the longest very-hot season rise to the top.",
        watch: "Do not make the small change column do too much work. This threshold captures dry maximum-temperature burden at one city point; humid coastal danger and night-time heat show up more clearly in the adjacent charts." },
      { chart: "linePanels", title: "And the nights are not cooling down either", size: "feature", beat: "exposure", window: "full", unit: "nights",
        subtitle: "Nights per year that stayed at or above 28°C, shown for metros and vulnerable-region city points on the same scale",
        panels: [
          { label: "Major metros", series: [
            { indicator: "climate.openmeteo.delhi.hot_nights", label: "Delhi" },
            { indicator: "climate.openmeteo.mumbai.hot_nights", label: "Mumbai" },
            { indicator: "climate.openmeteo.kolkata.hot_nights", label: "Kolkata" },
            { indicator: "climate.openmeteo.chennai.hot_nights", label: "Chennai" },
            { indicator: "climate.openmeteo.bengaluru.hot_nights", label: "Bengaluru" }
          ] },
          { label: "Vulnerability-context capitals", series: [
            { indicator: "climate.openmeteo.patna.hot_nights", label: "Patna" },
            { indicator: "climate.openmeteo.lucknow.hot_nights", label: "Lucknow" },
            { indicator: "climate.openmeteo.bhubaneswar.hot_nights", label: "Bhubaneswar" },
            { indicator: "climate.openmeteo.hyderabad.hot_nights", label: "Hyderabad" },
            { indicator: "climate.openmeteo.raipur.hot_nights", label: "Raipur" },
            { indicator: "climate.openmeteo.ranchi.hot_nights", label: "Ranchi" }
          ] }
        ],
        indicator: "climate.openmeteo.delhi.hot_nights",
        why: "Hot nights are the hidden killer. A body can take a brutal afternoon if the night lets it cool and recover; when the night stays hot, the strain never lets up, and that is when the heart and kidneys give out. The split keeps two questions separate: what is happening in the big metros, and what the same metric looks like in city points from states the vulnerability section already flags.",
        read: "Each line counts nights a year that never dropped below 28°C. Both panels use the same y-axis, so Chennai, Patna, Lucknow and Bhubaneswar can be compared without scale tricks. Hyderabad and Ranchi are included because of the predefined regional rule, not because they create the strongest trend.",
        watch: "A fixed 28°C threshold fits each city's climate differently, and these are single reanalysis grid-cell city points, not district or neighbourhood maps. The panel is context, not a ranking of India's worst hot-night cities." },
      { chart: "multiLine", title: "Heat is also a power bill and a grid problem", size: "small", beat: "heat-economy", window: "full", unit: "degree-days",
        subtitle: "World Bank CCKP · CMIP6 · cooling degree days (base 18°C)",
        series: [
          { indicator: "climate.cckp.cdd_historical", label: "Observed (to 2014)" },
          { indicator: "climate.cckp.cdd_ssp245", label: "Middle road" },
          { indicator: "climate.cckp.cdd_ssp585", label: "High emissions" }
        ],
        indicator: "climate.cckp.cdd_ssp245",
        why: "More heat means more cooling, more electricity, more strain on the grid exactly when people most need a fan to survive the night. The danger and the power cut arrive together.",
        read: "Cooling degree days measure how far and how long temperatures sit above a comfort baseline, the standard proxy for cooling demand. The line climbs steeply under higher emissions.",
        watch: "This is potential demand from temperature alone. How much electricity it actually draws depends on who can afford cooling, which is its own inequality." },
      { indicator: "climate.cckp.heatindex39_scenario_maps", chart: "scenarioMaps", title: "The future, mapped: where dangerous heat lands by 2100", size: "feature", beat: "scenario-maps", unit: "dangerous heat-index days/year",
        subtitle: "World Bank CCKP · CMIP6 · days a year with a heat index of 39°C or higher, 2080-2099 average, by state, under three emissions futures",
        why: "The line charts say how much hotter India gets; these three maps say where, and how much it depends on the choices the world makes now. Read left to right, low to high emissions, and watch the country darken. Under high emissions, much of the hot, humid plains and coasts spend more than half the year, up to about 200 days, in dangerous heat-index conditions by the end of the century.",
        read: "All three maps share one colour scale, so darker always means more dangerous-heat days. The only difference between them is the emissions pathway. The gap between the first and last map is the part still within human control.",
        watch: "These are CMIP6 model projections, not forecasts, and state averages hide local extremes. Ladakh has no CCKP estimate and is left grey." },
      // ACT III — who actually gets hit (work exposure, vulnerability, cooling; Lancet labour burden + informality cited in prose)
      { chart: "multiLine", title: "Most of India's workers are out in the heat", size: "feature", beat: "work-exposure", window: "full", unit: "% of workers",
        subtitle: "MoSPI · Periodic Labour Force Survey · share of workers by broad sector",
        series: [
          { indicator: "work.plfs.empshare_agriculture", label: "Agriculture" },
          { indicator: "work.plfs.empshare_industry", label: "Industry" },
          { indicator: "work.plfs.empshare_services", label: "Services" }
        ],
        indicator: "work.plfs.empshare_agriculture",
        why: "Heat exposure is decided at work. About 43% of India's workers are in agriculture, out in open fields, and much of industry is construction and brick kilns under the same sun. Only services, a minority of jobs, is mostly indoors. For most Indians, a heatwave is not something you can wait out at home.",
        read: "Each line is the share of all workers in that broad sector, from the official labour survey. Agriculture is the largest and the most sun-exposed; the slow shift to services is the long story underneath.",
        watch: "Sector is a rough proxy for outdoor exposure: some farm and factory work is sheltered, some service work (delivery, street vending, traffic police) is brutally exposed." },
      { indicator: "heat.work.worker_security_exposure", chart: "tableBars", title: "Most workers cannot simply stay home", size: "small", beat: "work-security", unit: "%",
        subtitle: "MoSPI PLFS 2023-24 worker status + ILOSTAT informality, latest available",
        why: "The heat warning only helps if a worker can act on it. Most Indian workers cannot. PLFS says 58.4% of workers are self-employed and 19.8% are casual labour; only 21.7% have regular wage or salaried jobs. ILOSTAT puts informal employment at 87.2% overall and 98.6% in agriculture. That means no paid heat leave for most workers, no enforceable shade break, and no easy way to skip a dangerous day.",
        read: "Read each bar independently. The first three bars are PLFS worker-status shares; the last two are ILOSTAT informality rates. They describe different dimensions of the same constraint: weak work security during heat.",
        watch: "Do not add the bars. Worker status and informality overlap and come from different systems; the point is not a total, but how little protection sits between heat and income." },
      { indicator: "heat.work.lancet_labour_loss_sector_shares", chart: "tableBars", title: "Heat is already costing work hours", size: "feature", beat: "labour-loss", unit: "% of heat-related labour-hour losses",
        subtitle: "Lancet Countdown India 2025 · sector split of 247 billion potential labour hours lost in 2024",
        why: "The workplace burden is already visible in labour-capacity estimates. Lancet Countdown's India 2025 data sheet estimates heat exposure cost India 247 billion potential labour hours in 2024, 419 hours per person and 124% more than the 1990-1999 average. Agriculture accounts for 66% of those heat-related labour-hour losses, and construction for 20%, which is exactly where work is hardest to pause.",
        read: "Each bar is a sector's share of heat-related labour-hour losses in 2024. Agriculture and construction are directly reported; other sectors are the residual share.",
        watch: "This is a labour-capacity estimate, not a count of deaths, observed absences or actual wages lost. The bars are percentages of one Lancet estimate, not PLFS worker shares." },
      { chart: "latestBars", title: "Electricity reached the home. Cooling did not.", size: "feature", beat: "cooling", unit: "%",
        subtitle: "NFHS-6 electricity, NFHS-5 fan and AC/cooler, NSS 78 separate AC and cooler ownership",
        series: [
          { indicator: "heat.cooling.nfhs6_electricity_all", label: "Lives in home with electricity" },
          { indicator: "heat.cooling.nfhs5_fan_all", label: "Household owns electric fan" },
          { indicator: "heat.cooling.nfhs5_ac_cooler_all", label: "Household owns AC/cooler" },
          { indicator: "heat.cooling.cooler_all", label: "Household owns air cooler" },
          { indicator: "heat.cooling.ac_all", label: "Household owns air conditioner" }
        ],
        indicator: "heat.cooling.nfhs6_electricity_all",
        why: "This is the question behind every heat death: can people actually cool down? NFHS-6 says 98.3% of people live in households with electricity, and NFHS-5 says 88.3% of households own an electric fan. But the ladder drops quickly after that. Only 23.7% of households had an AC or cooler in NFHS-5; NSS 78 separates the appliances and finds 14.1% with an air cooler and just 4.9% with an air conditioner. The wire reached the home; reliable, effective cooling did not.",
        read: "Every bar is a percentage on the same scale. Read it as a ladder from access to relief: electricity, fan, some cooling appliance, then real cooling split into cooler and AC.",
        watch: "NFHS-5 combines AC and cooler, while NSS 78 separates them; do not subtract one from the other. Ownership is also not reliable use during a long heatwave or power cut." },
      { indicator: "heat.cooling.cooler_by_state", chart: "choropleth", title: "The cooling map does not match the heat map", size: "feature", beat: "cooling-regional", unit: "% with an air cooler", signed: false, ramp: "cool", rankLabel: "Most air coolers", bottomLabel: "Almost none",
        subtitle: "MoSPI · NSS 78th Round 2020-21 · households owning an air cooler, by state",
        why: "Where India keeps coolers is almost the opposite of where humid heat is most dangerous. The dry north, Punjab, Haryana, Rajasthan, Delhi and Chandigarh, runs on evaporative coolers, which work in dry air; the humid south and east, where wet-bulb heat is deadliest, own almost none because coolers barely work in damp air.",
        read: "Each state is shaded by the share of households owning an air cooler. Darker means more coolers. Compare it with the warming and death maps elsewhere on this page.",
        watch: "Coolers are evaporative, so low ownership in the humid south is partly physics, not just poverty. A few small states were not sampled and are left unshaded." },
      { indicator: "heat.poverty.mpi_by_state", chart: "choropleth", title: "And who can least afford to cope: India's poverty map", size: "feature", beat: "poverty", unit: "% multidimensionally poor", signed: false, rankLabel: "Poorest", bottomLabel: "Least poor",
        subtitle: "NITI Aayog National MPI 2023 · share of people who are multidimensionally poor (NFHS-5, 2019-21), by state",
        why: "Heat is only as deadly as your ability to escape it, and India is a poor country: about 15% of Indians are multidimensionally poor, deprived in housing, cooking fuel, assets or health. That poverty is concentrated in the east and centre, Bihar (34%), Jharkhand, Uttar Pradesh, Madhya Pradesh, exactly the populous, humid, heat-exposed plains. A tin-roof home with no reliable power and an undernourished body is what turns a hot week into a fatal one. For scale, the old global extreme-poverty line, $1.90 a day, is barely 150 rupees at today's exchange rate.",
        read: "Each state is shaded by the share of people who are multidimensionally poor. Darker means poorer. Compare it with the cooling and heat-risk maps: the poorest belt overlaps the humid, crowded plains where coolers barely work.",
        watch: "Multidimensional poverty is a composite of deprivations, not an income line, and these are 2019-21 figures; poverty has fallen since, but the geography of who is least able to cope with heat is what matters here." },
      { indicator: "heat.affordability.lowest_rural_mpce_states", chart: "tableBars", title: "Where monthly spending room is thinnest", size: "small", beat: "affordability", unit: "Rs per person per month",
        subtitle: "MoSPI HCES 2023-24 · ten lowest rural MPCE states plus all-India rural average",
        why: "Poverty tells us deprivation; MPCE puts a rupee scale on the same heat problem. HCES 2023-24 shows the lowest rural monthly consumption is in Chhattisgarh (Rs 2,739 per person), Jharkhand (Rs 2,946), Odisha (Rs 3,357), Madhya Pradesh (Rs 3,441), Uttar Pradesh (Rs 3,481), West Bengal (Rs 3,620) and Bihar (Rs 3,670), against an all-India rural average of Rs 4,122. That is the thin monthly budget from which cooling, water, transport to care and lost work time must be absorbed.",
        read: "Rows are sorted from the lowest rural MPCE upward, with the all-India rural average added as a benchmark. Shorter bars mean less monthly consumption room per person.",
        watch: "MPCE is consumption expenditure, not income or savings. It does not say what households can spend specifically on cooling, and HCES values exclude imputation of free welfare items." },
      { chart: "latestBars", title: "Heat hits a body that is often already weakened", size: "small", beat: "health-vulnerability", unit: "% anaemic",
        subtitle: "NFHS-5 (2019-21) · share who are anaemic",
        series: [
          { indicator: "heat.health.anaemia_children", label: "Children 6-59 months" },
          { indicator: "heat.health.anaemia_women", label: "Women 15-49" },
          { indicator: "heat.health.anaemia_men", label: "Men 15-49" }
        ],
        indicator: "heat.health.anaemia_children",
        why: "Heat does not kill at random. It finds bodies already under strain, and India's are: two in three young children and well over half of women are anaemic, which weakens the body's ability to handle heat stress. Add widespread high blood pressure, diabetes and kidney disease, and an ageing population, and the same heatwave that a healthy adult shrugs off can be fatal.",
        read: "Each bar is the share of that group found anaemic in the national health survey. Anaemia is most common in exactly the groups, poor households, women and children, who are also most exposed to heat.",
        watch: "Anaemia is one marker of underlying vulnerability, not a direct count of heat deaths; high blood pressure, diabetes, heart and kidney disease matter too." },
      { indicator: "heat.ceew.state_heat_risk", chart: "choropleth", title: "The deadliest heat is humid, not just hot", size: "feature", beat: "risk-synthesis", unit: "% of districts high/very high risk", signed: false, rankLabel: "All districts high-risk", bottomLabel: "No districts high-risk",
        subtitle: "CEEW · district Heat Risk Index 2025 · share of each state's districts rated high or very high risk",
        why: "Here is the twist this whole section has been building to. When CEEW folds heat, humidity, exposure and vulnerability into one risk index for all 734 districts, the places that top it are not the dry, record-breaking north, they are the humid south and coasts: Kerala, Goa, coastal Andhra Pradesh, all of Maharashtra. Wet heat stops the body cooling itself, so a humid 40C is deadlier than a dry 45C, and that is where the people are. 57% of districts, home to 76% of Indians, sit in the high or very high band.",
        read: "Each state is shaded by the share of its districts CEEW rates high or very high risk. The humid peninsula and plains run dark; the cool, dry Himalaya and northeast sit at the bottom, the inverse of the warming map up top.",
        watch: "This is composite risk, not a death count, and it is a share of districts, so small states (Goa, with two districts) hit 100% easily while a large state can be 'only' 76% with far more at-risk districts in absolute terms. Read the colour pattern, not the league table." },
      { indicator: "heat.vulnerability.state_risk_cooling_poverty", chart: "heatVulnerabilityScatter", title: "Where heat is hardest to survive", size: "feature", beat: "vulnerability-synthesis", unit: "%",
        subtitle: "CEEW heat risk + NSS 78 cooling + NITI MPI + HCES MPCE · state-level context",
        why: "A heat-risk map tells you where the weather and vulnerability combine. A cooling chart tells you who can escape indoors. This scatter puts them together, with HCES MPCE carried into the tooltip and CSV as affordability context. States far to the right have many districts rated high or very high heat risk. States high up the chart have little AC/cooler protection by the conservative cooling proxy. Bigger bubbles are poorer states. The danger zone is the upper-right: high heat risk, little cooling, and often deeper poverty.",
        read: "Right means more districts at high heat risk. Up means more households without the AC/cooler protection proxy. Bubble size is multidimensional poverty. Labels are chosen by the plotted combined exposure/cooling/poverty score.",
        watch: "This is not a death-risk model. The cooling measure uses the higher of AC or cooler ownership to avoid double-counting households that own both, so it is a conservative protection proxy, not a true combined ownership rate. States without NSS cooling observations are excluded rather than treated as zero ownership." },
      // ACT IV — now the death numbers, and why they disagree (count comparison, by state, by month, disaster history)
      { indicator: "heat.death_count_comparison", chart: "heatDeathCountBars", title: "So how many die? It depends entirely who you ask", size: "feature", beat: "definition", unit: "deaths or excess deaths",
        subtitle: "Curated from Frontiers, OWID/EM-DAT, NCRB, IMD and NCDC reporting · log scale",
        why: "Here is the heart of the confusion. The viral 3,400 is a modelled estimate of extra deaths on an extreme day; the small official numbers are head-counts of deaths formally labelled as heatstroke. They are not rival versions of one fact.",
        read: "The Frontiers bar is modelled excess deaths. The others are reported administrative, disaster or surveillance counts. The scale is logarithmic because the values span a huge range.",
        watch: "Do not rank these as better or worse measurements of the same thing. They answer different questions, which is exactly why the public argument goes in circles." },
      { indicator: "heat.counting.death_certification_funnel", chart: "deathCertificationFunnelBars", title: "Most deaths are registered. Most causes are not medically certified.", size: "feature", beat: "counting-system", unit: "deaths",
        subtitle: "CRS 2023 + MCCD 2023 · death registration, medical attention and cause certification",
        why: "This is the missing plumbing behind the heat-death fight. India registers most deaths, but only a small share occur in institutions and only about a fifth get medically certified causes. Heat can push a weak heart, kidney or lung over the edge and never appear as heat on the record.",
        read: "Each bar is an official 2023 count. The percentage in brackets is the approximate share of estimated deaths. Registration is high; medically certified cause is much lower; no medical attention at death is a large category.",
        watch: "The bars are related measures, not a perfect step-by-step funnel. Institutional deaths, medical attention and MCCD certification come from different CRS/MCCD reporting layers, so read this as visibility, not one accounting ledger." },
      { indicator: "heat.mccd.certified_deaths_by_state", chart: "choropleth", title: "Where causes of death are least visible", size: "feature", beat: "counting-geography", unit: "% medically certified", signed: false, ramp: "cool", rankLabel: "Most certified", bottomLabel: "Least certified",
        subtitle: "MCCD 2023 · medically certified deaths as a share of registered deaths, by state",
        why: "The undercount is geographical too. In Maharashtra, around 42% of registered deaths are medically certified by cause; in Uttar Pradesh, Assam and Bihar it is about 6%. A heat death is easiest to miss where the cause-of-death system is thinnest.",
        read: "Each state is shaded by the share of registered deaths that received a medically certified cause. Darker means the death's medical cause is more likely to be visible in official data.",
        watch: "Medical certification is not heat attribution, and high certification does not mean perfect heat counting. Small states can rank high; large low-certification states matter because they contain many more deaths." },
      { indicator: "heat.imd_dwe_2024.heatwave_deaths_by_state", chart: "imdHeatStateBars", title: "Where India officially counted its heat deaths in 2024", size: "feature", beat: "regional-deaths", unit: "reported deaths",
        subtitle: "IMD Disastrous Weather Events 2024 · Table 22 · reported heatwave deaths by state",
        why: "When the counting works at all, it points at the same plains the warming map flagged: Uttar Pradesh alone reported more than half of 2024's official heatwave deaths.",
        read: "Each bar is one state's reported heatwave deaths in 2024. Uttar Pradesh, Bihar, Telangana and Jharkhand lead; together the bars sum to 460.",
        watch: "This is reported, labelled heatwave mortality from a meteorological agency, not all the deaths heat pushed over the edge. States that count carefully can look worse than states that do not count at all." },
      { indicator: "heat.imd_dwe_2024.heatwave_deaths_by_month", chart: "imdHeatMonthBars", title: "Heat kills in a tight, predictable window", size: "small", beat: "official-2024-months",
        subtitle: "IMD Disastrous Weather Events 2024 · Table 7 · reported heatwave deaths by month",
        why: "The official deaths cluster in May and June, the pre-monsoon furnace, which is exactly why they are foreseeable and, in principle, preventable.",
        read: "The non-zero monthly bars sum to 460 reported heatwave deaths, almost all in May and June.",
        watch: "This is meteorological disaster-event reporting, not an all-cause excess-mortality count." },
      { indicator: "heat.imd_dwe.heatwave_deaths_annual", chart: "line", title: "In 2015 India counted 2,000 heat deaths. In 2021, zero.", size: "feature", beat: "official-trend", window: "full", unit: "reported deaths",
        subtitle: "IMD Disastrous Weather Events · reported heatwave deaths · 2013 to 2024",
        why: "This single line is the strongest proof that India does not really know its heat toll. The same agency recorded over 2,000 heat deaths in 2015 and exactly zero in 2021. The sun did not take a year off. What changed was attention and bookkeeping: after the catastrophic 2015 heatwave, states launched Heat Action Plans that genuinely saved lives, but the recorded number also collapsed because no one was systematically counting, and it can fall even in years when the heat is rising. The official figure measures how hard India is looking, not how many die.",
        read: "Each point is the heatwave deaths IMD recorded that year. Forget a smooth trend and look at the absurd range: ~1,400 to 2,000 in the mid-2010s, near zero around 2020-21, back up to 460 in 2024.",
        watch: "It is not a consistent series, so do not read the fall as lives saved by weather, nor the rise as the whole story. The early years are rounded national tallies, the recent ones precise event counts, and even 460 is far below all heat-attributable deaths." },
      { indicator: "heat.reported_extreme_temperature_deaths.owid_emdat", chart: "owidExtremeTemperatureDeathsLine", title: "Why the disaster databases always look too small", size: "feature", beat: "reported-history", fromYear: 2000,
        subtitle: "OWID / EM-DAT · India reported extreme-temperature disaster deaths since 2000",
        why: "International disaster databases catch the big, named heatwaves and miss the slow burn, so the long record is spiky and almost certainly an undercount of heat's real toll.",
        read: "Each point is the year's reported extreme-temperature disaster deaths. The peaks are events that made the record; the quiet years are not proof heat killed nobody.",
        watch: "EM-DAT is event-based reporting, not a continuous health ledger. A low year often means low reporting, not low mortality." },
      // ACT V — so is 3,400 plausible? the honest model and the verdict (sensitivity, denominator)
      { indicator: "heat.sensitivity_scale_check", chart: "heatSensitivityBars", title: "How a single hot day can plausibly reach four figures", size: "feature", beat: "scale-check", unit: "excess deaths per day",
        subtitle: "Illustrative denominator model using 2024 population and a rounded crude death rate · not attribution",
        why: "This is the test of the viral number. India loses roughly 26,000 people a day no matter the weather, so even a small temporary lift in that baseline, spread across a huge exposed population, adds up to thousands. That makes 3,400 plausible, not proven.",
        read: "Each bar takes a share of the population as exposed and a small rise in their death rate, and reads off the extra deaths a day. Modest assumptions already reach the four figures the headlines fight about.",
        watch: "This is arithmetic for scale, not an epidemiological model. It ignores district, age, humidity, delayed deaths and mortality that was merely brought forward. It does not validate any specific study." },
      { indicator: "heat.context.crude_death_rate", chart: "line", title: "The number any honest estimate has to start from", size: "small", beat: "baseline", window: "full",
        subtitle: "World Bank · crude death rate, deaths per 1,000 population",
        why: "Every excess-death claim, viral or rigorous, begins by asking how many people would have died anyway. Get that baseline wrong and the whole heat number is wrong.",
        read: "Deaths per 1,000 people a year. It looks dull, but it is the denominator the entire 3,400 debate quietly rests on.",
        watch: "A national annual rate is a blunt starting point. Real attribution needs daily deaths by district, age and season, which India does not yet publish, and that gap is the actual story." }
    ]
  },
  {
    id: "q.climate.rainfall_cities",
    question: "How has rainfall changed in India's big cities?",
    priority: "core",
    indicators: [
      "climate.openmeteo.delhi.precipitation_sum",
      "climate.openmeteo.mumbai.precipitation_sum",
      "climate.openmeteo.kolkata.precipitation_sum",
      "climate.openmeteo.chennai.precipitation_sum",
      "climate.openmeteo.bengaluru.precipitation_sum"
    ],
    core: [
      "climate.openmeteo.delhi.precipitation_sum",
      "climate.openmeteo.mumbai.precipitation_sum",
      "climate.openmeteo.kolkata.precipitation_sum",
      "climate.openmeteo.chennai.precipitation_sum",
      "climate.openmeteo.bengaluru.precipitation_sum"
    ],
    context: [
      "climate.openmeteo.delhi.rainy_days",
      "climate.openmeteo.mumbai.rainy_days",
      "climate.openmeteo.kolkata.rainy_days",
      "climate.openmeteo.chennai.rainy_days",
      "climate.openmeteo.bengaluru.rainy_days"
    ],
    visualPlan: [
      { chart: "multiLine", title: "Annual rainfall in five Indian cities", size: "hero", beat: "rainfall-total", window: "full", unit: "mm", subtitle: "Open-Meteo ERA5 · annual sum of daily precipitation",
        series: [
          { indicator: "climate.openmeteo.delhi.precipitation_sum", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.precipitation_sum", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.precipitation_sum", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.precipitation_sum", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.precipitation_sum", label: "Bengaluru" }
        ],
        indicator: "climate.openmeteo.delhi.precipitation_sum",
        why: "A city-by-city rainfall history shows how different India's water story is across regions." },
      { chart: "multiLine", title: "Rainy days each year", size: "feature", beat: "rainfall-frequency", window: "full", unit: "days", subtitle: "Open-Meteo ERA5 · days with at least 1 mm of precipitation",
        series: [
          { indicator: "climate.openmeteo.delhi.rainy_days", label: "Delhi" },
          { indicator: "climate.openmeteo.mumbai.rainy_days", label: "Mumbai" },
          { indicator: "climate.openmeteo.kolkata.rainy_days", label: "Kolkata" },
          { indicator: "climate.openmeteo.chennai.rainy_days", label: "Chennai" },
          { indicator: "climate.openmeteo.bengaluru.rainy_days", label: "Bengaluru" }
        ],
        indicator: "climate.openmeteo.delhi.rainy_days",
        why: "Total rain and the number of rainy days answer different reader questions." }
    ]
  },
  {
    id: "q.climate.co2",
    question: "How much CO2 does India emit?",
    priority: "core",
    indicators: ["owid.co2_total"],
    core: ["owid.co2_total"],
    // Blended: OWID for the total/cumulative/per-capita backbone (to 2024); EIA
    // for the fuel breakdown that explains the rise (to 2024); world-context for
    // India's share of the global total — scale that the raw number alone misses.
    context: [
      "climate.eia.co2_coal",
      "climate.eia.co2_petroleum",
      "climate.eia.co2_gas",
      "climate.eia.co2_total",
      "world.share.co2_total",
      "owid.co2_cumulative",
      "owid.co2_per_capita"
    ],
    visualPlan: [
      { indicator: "owid.co2_total", chart: "line", title: "India's annual CO₂ emissions", size: "hero", window: "full", beat: "scale",
        why: "The direct answer: total CO₂ India emits each year, now among the world's largest.", read: "Annual CO₂ emissions, rising steeply over recent decades.", watch: "A large total is not the same as a large footprint per person — that comes later." },
      { chart: "multiLine", indicator: "climate.eia.co2_total", title: "What India's CO₂ comes from", size: "feature", unit: "million tonnes CO₂",
        series: [ { indicator: "climate.eia.co2_coal", label: "Coal" }, { indicator: "climate.eia.co2_petroleum", label: "Oil" }, { indicator: "climate.eia.co2_gas", label: "Gas" } ],
        beat: "drivers",
        why: "What is actually driving the rise: coal dominates, with oil second and gas a distant third.", read: "CO₂ from each fossil fuel, in million tonnes.", watch: "Coal's lead here is why the power and transport stories sit at the centre of India's emissions." },
      { indicator: "world.share.co2_total", chart: "line", title: "India's share of world CO₂", size: "feature", window: "full", beat: "scale-in-context",
        why: "The number that puts the total in context: how much of all human CO₂ comes from India.", read: "India's emissions as a percent of the world total, rising with its economy.", watch: "Share is rising, but still well below India's share of world population." },
      { indicator: "owid.co2_cumulative", chart: "line", title: "India's cumulative CO₂ since 1850", size: "small", window: "full", beat: "historical-responsibility",
        why: "Climate responds to the stock of past emissions, not just this year's.", read: "Running total of all CO₂ India has emitted since the 1800s.", watch: "Despite a large annual figure today, India's cumulative share stays small next to early industrialisers." },
      { indicator: "owid.co2_per_capita", chart: "line", title: "CO₂ per person", size: "small", window: "full", beat: "fairness-caveat",
        why: "The caveat that reframes the total: per person, India emits little.", read: "Tonnes of CO₂ per person each year.", watch: "The total is large mainly because India has 1.4 billion people, not because each person emits a lot." }
    ]
  },
  {
    id: "q.climate.co2_pc",
    question: "How much does India emit per person?",
    priority: "core",
    indicators: ["owid.co2_per_capita"],
    core: ["owid.co2_per_capita"],
    // Blended: OWID for India's per-capita and total (to 2024); world-context
    // compare table for the all-important India-vs-China/US/world bars (to 2024);
    // EIA energy-per-person as the driver behind the emissions figure.
    context: [
      "compare.climate.co2_per_capita",
      "owid.co2_total",
      "energy.eia.energy_per_capita",
      "owid.co2_cumulative"
    ],
    visualPlan: [
      { indicator: "owid.co2_per_capita", chart: "line", title: "India's CO₂ per person", size: "hero", window: "full", beat: "answer",
        why: "The direct answer: how much CO₂ an average Indian emits, rising but from a low base.", read: "Tonnes of CO₂ per person per year.", watch: "An average hides huge spread — a metro professional and a rural household are nowhere near the same." },
      { indicator: "compare.climate.co2_per_capita", chart: "compareBars", title: "CO₂ per person: India vs the world", size: "feature", beat: "the-context",
        why: "The essential comparison: per person, India sits far below the US, China, and the world average.", read: "Latest CO₂ per person for major economies, side by side.", watch: "This is the fair way to compare countries of very different sizes." },
      { indicator: "owid.co2_total", chart: "line", title: "Why the national total still looks big", size: "small", window: "full", beat: "population-effect",
        why: "Reconciling low per-person with a large total: 1.4 billion small footprints add up.", read: "India's total annual CO₂, climbing.", watch: "Low per person and a high total are both true at once; population is the bridge between them." },
      { indicator: "energy.eia.energy_per_capita", chart: "line", title: "Energy used per person", size: "small", window: "full", beat: "driver",
        why: "The driver behind per-person emissions: how much energy each person uses.", read: "Total energy per person, in million Btu.", watch: "As energy use per person rises toward world levels, per-person emissions will follow unless the energy gets cleaner." }
    ]
  },
  {
    id: "q.climate.historical",
    question: "Is India a big emitter historically?",
    priority: "core",
    indicators: ["owid.co2_cumulative"],
    core: ["owid.co2_cumulative"],
    context: ["owid.co2_total", "owid.co2_per_capita"]
  },
  {
    id: "q.climate.impact",
    question: "How is climate change changing India?",
    priority: "core",
    // Flagship comprehensive climate page. Rebuilt around the local ERA5 spine:
    // long-run warming, regional/state unevenness, hourly-derived heat exposure,
    // 2026 Jan-May YTD, rainfall/monsoon shifts, emissions, air and household exposure.
    indicators: [
      "climate.era5.region.all_india.temp_anomaly_1991_2020",
      "climate.era5.hourly.region.all_india.warm_nights_26",
      "climate.era5.ytd.all_india.temp_anomaly_jan_may_1991_2020"
    ],
    core: [
      "climate.era5.region.all_india.temp_anomaly_1991_2020",
      "compare.climate.warming_since_1940s",
      "climate.derived.temp_anomaly_era5_1991_2020",
      "climate.derived.temp_anomaly_owid_1991_2020",
      "climate.derived.temp_anomaly_berkeley_1991_2020",
      "climate.era5.region.all_india.temp_anomaly_pre_monsoon_1991_2020",
      "climate.era5.state_warming",
      "climate.era5.hourly.region.all_india.hot_days_40",
      "climate.era5.hourly.region.all_india.warm_nights_26",
      "climate.era5.hourly.region.all_india.humid_heat_days_40",
      "climate.era5.region.all_india.precip_anomaly_pct_southwest_monsoon_1991_2020",
      "climate.era5.hourly_precip.region.all_india.wet_days_1mm",
      "climate.era5.hourly_precip.region.all_india.heavy_days_50mm",
      "climate.era5.hourly_precip.region.all_india.max_5day_mm",
      "climate.era5.ytd.all_india.temp_anomaly_jan_may_1991_2020",
      "climate.era5.ytd.all_india.precip_anomaly_pct_jan_may_1991_2020"
    ],
    context: [
      "climate.temp_anomaly_annual",
      "climate.precipitation_annual",
      "climate.berkeley.temp_anomaly",
      "climate.berkeley.temp_abs",
      "climate.era5.region.himalayan_belt.temp_anomaly_1991_2020",
      "climate.era5.region.indo_gangetic_plain.temp_anomaly_1991_2020",
      "climate.era5.region.west_arid.temp_anomaly_1991_2020",
      "climate.era5.region.central_deccan.temp_anomaly_1991_2020",
      "climate.era5.region.south_peninsula.temp_anomaly_1991_2020",
      "climate.era5.region.northeast_hills.temp_anomaly_1991_2020",
      "climate.era5.region.all_india.rel_humidity_mean",
      "climate.era5.hourly.region.indo_gangetic_plain.warm_nights_26",
      "climate.era5.hourly.region.west_arid.hot_days_40",
      "climate.era5.hourly.region.south_peninsula.humid_heat_days_40",
      "climate.era5.hourly.region.central_deccan.humid_heat_days_40",
      "climate.era5.ytd.indo_gangetic_plain.temp_anomaly_jan_may_1991_2020",
      "climate.era5.ytd.west_arid.temp_anomaly_jan_may_1991_2020",
      "climate.era5.ytd.central_deccan.temp_anomaly_jan_may_1991_2020",
      "climate.era5.ytd.south_peninsula.temp_anomaly_jan_may_1991_2020",
      "climate.era5.ytd.northeast_hills.temp_anomaly_jan_may_1991_2020",
      "climate.era5.ytd.himalayan_belt.temp_anomaly_jan_may_1991_2020",
      "climate.era5.ytd.indo_gangetic_plain.precip_anomaly_pct_jan_may_1991_2020",
      "climate.era5.ytd.west_arid.precip_anomaly_pct_jan_may_1991_2020",
      "climate.era5.ytd.central_deccan.precip_anomaly_pct_jan_may_1991_2020",
      "climate.era5.ytd.south_peninsula.precip_anomaly_pct_jan_may_1991_2020",
      "climate.era5.ytd.northeast_hills.precip_anomaly_pct_jan_may_1991_2020",
      "climate.era5.ytd.himalayan_belt.precip_anomaly_pct_jan_may_1991_2020",
      "climate.era5.hourly_precip.region.central_deccan.wet_days_1mm",
      "climate.era5.hourly_precip.region.indo_gangetic_plain.wet_days_1mm",
      "climate.era5.hourly_precip.region.northeast_hills.wet_days_1mm",
      "climate.era5.hourly_precip.region.south_peninsula.wet_days_1mm",
      "climate.era5.hourly_precip.region.west_arid.wet_days_1mm",
      "climate.era5.hourly_precip.region.central_deccan.heavy_days_50mm",
      "climate.era5.hourly_precip.region.indo_gangetic_plain.heavy_days_50mm",
      "climate.era5.hourly_precip.region.northeast_hills.heavy_days_50mm",
      "climate.era5.hourly_precip.region.south_peninsula.heavy_days_50mm",
      "climate.era5.hourly_precip.region.west_arid.heavy_days_50mm",
      "climate.era5.hourly_precip.region.central_deccan.max_5day_mm",
      "climate.era5.hourly_precip.region.indo_gangetic_plain.max_5day_mm",
      "climate.era5.hourly_precip.region.northeast_hills.max_5day_mm",
      "climate.era5.hourly_precip.region.south_peninsula.max_5day_mm",
      "climate.era5.hourly_precip.region.west_arid.max_5day_mm",
      "climate.era5.hourly_precip.region.all_india.monsoon_share_pct",
      "climate.el_nino.imd_monsoon_departure_1901_2025",
      "climate.waqi.delhi",
      "climate.waqi.mumbai",
      "climate.waqi.kolkata",
      "climate.waqi.chennai",
      "climate.waqi.bengaluru",
      "owid.co2_total",
      "owid.co2_per_capita",
      "owid.co2_cumulative",
      "energy.ember.carbon_intensity",
      "world.share.co2_total",
      "work.employment_agriculture",
      "people.population.total",
      "climate.cckp.temp_historical",
      "climate.cckp.temp_ssp126",
      "climate.cckp.temp_ssp245",
      "climate.cckp.temp_ssp585",
      "climate.cckp.precip_ssp245",
      "climate.ghg_total",
      "climate.ghg_by_gas",
      "climate.co2_consumption",
      "climate.pm25_iqair_country",
      "climate.disaster_deaths",
      "compare.climate.co2_per_capita",
      "compare.climate.co2_total",
      "compare.climate.co2_cumulative",
      "climate.ghg_by_sector",
      "climate.co2_vs_gdp",
      "climate.psmsl.mumbai",
      "climate.psmsl.chennai",
      "energy.ember.generation",
      "energy.eia.electricity_capacity_solar",
      "energy.eia.electricity_capacity_wind",
      "energy.eia.electricity_capacity_renewable",
      "climate.cckp.heatindex39_historical",
      "climate.cckp.heatindex39_ssp126",
      "climate.cckp.heatindex39_ssp245",
      "climate.cckp.heatindex39_ssp585",
      "climate.cckp.heatindex39_scenario_maps",
      "climate.cckp.hotdays40_historical",
      "climate.cckp.hotdays40_ssp245",
      "climate.cckp.warmnights26_historical",
      "climate.cckp.cdd_historical",
      "climate.cckp.cdd_ssp245",
      "heat.cooling.ac_all",
      "heat.cooling.ac_rural",
      "heat.cooling.ac_urban",
      "heat.cooling.nfhs5_ac_cooler_all",
      "heat.cooling.nfhs5_ac_cooler_rural",
      "heat.cooling.nfhs5_ac_cooler_urban",
      "heat.cooling.cooler_by_state",
      "heat.vulnerability.state_risk_cooling_poverty",
      "heat.work.lancet_labour_loss_sector_shares",
      "heat.death_count_comparison",
      "heat.context.agriculture_employment_share",
      "heat.context.vulnerable_employment_share",
      "heat.context.population_65plus_share",
      "heat.context.electricity_access",
      "water.cgwb.stage_trend_india_national",
      "water.cgwb.stage_trend_delhi",
      "water.cgwb.stage_trend_tamil_nadu",
      "agriculture.el_nino.rainfall_crop_correlations",
      "agriculture.el_nino.crop_yield_sensitivity",
      "prices.el_nino.food_wpi_components"
    ],
    visualPlan: [
      // ACT I — what changed physically
      { indicator: "climate.era5.region.all_india.temp_anomaly_1991_2020", chart: "line", title: "India's climate line has moved", size: "hero", window: "full", beat: "signal", unit: "°C vs 1991-2020",
        why: "The core answer: the national climate is warmer than the recent normal, not just in one bad summer.", read: "Each point is India's annual mean temperature anomaly from ERA5, compared with the 1991-2020 average. Positive years are hotter than the recent normal.", watch: "This is a national annual average. It smooths out the heat that people feel in particular weeks, cities and worksites." },
      { chart: "multiLine", title: "Three datasets tell the same warming story", size: "feature", beat: "source-check", unit: "°C vs 1991-2020",
        series: [
          { indicator: "climate.derived.temp_anomaly_era5_1991_2020", label: "ERA5" },
          { indicator: "climate.derived.temp_anomaly_owid_1991_2020", label: "OWID/Copernicus" },
          { indicator: "climate.derived.temp_anomaly_berkeley_1991_2020", label: "Berkeley Earth" }
        ],
        indicator: "climate.derived.temp_anomaly_era5_1991_2020",
        why: "This answers the cherry-picking objection: the warming signal is not a quirk of one dataset.", read: "Three independent India temperature-anomaly series are rebased to the same 1991-2020 normal so the direction can be compared.", watch: "The lines will not match exactly because sources, land masks and methods differ. Agreement on direction matters more than tiny annual gaps." },
      { indicator: "compare.climate.warming_since_1940s", chart: "tableBars", title: "India has warmed about as much as the world", size: "feature", beat: "comparison", unit: "°C warmer",
        why: "This answers the 'India is not warming fast' claim with a fair cross-country comparison.", read: "Each bar compares the average annual temperature anomaly in 2016-2025 with the 1940s average for that country or region.", watch: "This is a change in temperature anomaly, not a percent. A roughly one-degree national shift is not small in a hot, humid, populous country." },
      { chart: "multiLine", title: "Every region is warming, but not the same way", size: "feature", beat: "regional", unit: "°C vs 1991-2020",
        series: [
          { indicator: "climate.era5.region.himalayan_belt.temp_anomaly_1991_2020", label: "Himalayan belt" },
          { indicator: "climate.era5.region.indo_gangetic_plain.temp_anomaly_1991_2020", label: "Indo-Gangetic plain" },
          { indicator: "climate.era5.region.west_arid.temp_anomaly_1991_2020", label: "West and arid India" },
          { indicator: "climate.era5.region.central_deccan.temp_anomaly_1991_2020", label: "Central and Deccan India" },
          { indicator: "climate.era5.region.south_peninsula.temp_anomaly_1991_2020", label: "South peninsula" },
          { indicator: "climate.era5.region.northeast_hills.temp_anomaly_1991_2020", label: "Northeast hills" }
        ],
        indicator: "climate.era5.region.indo_gangetic_plain.temp_anomaly_1991_2020",
        why: "The national average hides different regional climates and different lived risks.", read: "Each line is a broad Indian region's ERA5 annual temperature anomaly from the same 1991-2020 baseline.", watch: "Regions are broad state groupings. They explain scale better than a national average, but they still hide city and district extremes." },
      { indicator: "climate.era5.state_warming", chart: "choropleth", title: "The warming map is uneven", size: "feature", beat: "regional", unit: "°C warmer", signed: true, rankLabel: "Warmed most", bottomLabel: "Warmed least",
        why: "People live in states, not in an all-India average, and warming has not landed evenly.", read: "Each state is shaded by how much its average temperature rose, comparing 2015-2024 against the 1951-1980 baseline. Darker means more warming.", watch: "State averages still smooth over cities, valleys and coastlines. Mountain states often warm faster, but dense plains carry the larger population exposure." },
      { indicator: "climate.era5.region.all_india.temp_anomaly_pre_monsoon_1991_2020", chart: "line", title: "The pre-monsoon heat window matters most", size: "feature", window: "full", beat: "season",
        why: "March-May is when heat stress peaks before rain relief arrives, so seasonal warming matters more than annual warming alone.", read: "ERA5 March-May temperature anomaly for all India, compared with 1991-2020.", watch: "A hot pre-monsoon season does not automatically predict the monsoon. It is a heat-exposure measure, not a rainfall forecast." },
      { chart: "multiLine", title: "2026 so far belongs in its own box", size: "feature", beat: "current-year", unit: "°C vs Jan-May 1991-2020",
        series: [
          { indicator: "climate.era5.ytd.all_india.temp_anomaly_jan_may_1991_2020", label: "All India" },
          { indicator: "climate.era5.ytd.indo_gangetic_plain.temp_anomaly_jan_may_1991_2020", label: "Indo-Gangetic plain" },
          { indicator: "climate.era5.ytd.west_arid.temp_anomaly_jan_may_1991_2020", label: "West and arid India" },
          { indicator: "climate.era5.ytd.central_deccan.temp_anomaly_jan_may_1991_2020", label: "Central and Deccan India" },
          { indicator: "climate.era5.ytd.south_peninsula.temp_anomaly_jan_may_1991_2020", label: "South peninsula" }
        ],
        indicator: "climate.era5.ytd.all_india.temp_anomaly_jan_may_1991_2020",
        why: "The current year is a live hook, but partial years must be compared only with the same months in earlier years.", read: "Each line compares January-May temperature in every year with the January-May 1991-2020 normal. The latest point is 2026 through May.", watch: "Do not rank 2026 against full calendar years. This is a year-to-date comparison through May only." },
      // ACT II — how heat is lived
      { chart: "multiLine", title: "The nights are not cooling like they used to", size: "feature", beat: "lived-heat", unit: "nights per year",
        series: [
          { indicator: "climate.era5.hourly.region.all_india.warm_nights_26", label: "All India" },
          { indicator: "climate.era5.hourly.region.indo_gangetic_plain.warm_nights_26", label: "Indo-Gangetic plain" },
          { indicator: "climate.era5.hourly.region.central_deccan.warm_nights_26", label: "Central and Deccan India" },
          { indicator: "climate.era5.hourly.region.south_peninsula.warm_nights_26", label: "South peninsula" }
        ],
        indicator: "climate.era5.hourly.region.all_india.warm_nights_26",
        why: "Warm nights are what make heat hard to recover from: the body, the house and the city never get a proper reset.", read: "Hourly ERA5 temperatures are converted into daily minimums, then counted as warm nights when the minimum stays at or above 26°C.", watch: "This is region-average exposure. A city neighbourhood or a tin-roofed room can be worse than the grid-cell average." },
      { chart: "multiLine", title: "The hottest days are a regional story", size: "feature", beat: "lived-heat", unit: "days per year",
        series: [
          { indicator: "climate.era5.hourly.region.all_india.hot_days_40", label: "All India" },
          { indicator: "climate.era5.hourly.region.west_arid.hot_days_40", label: "West and arid India" },
          { indicator: "climate.era5.hourly.region.indo_gangetic_plain.hot_days_40", label: "Indo-Gangetic plain" },
          { indicator: "climate.era5.hourly.region.central_deccan.hot_days_40", label: "Central and Deccan India" }
        ],
        indicator: "climate.era5.hourly.region.all_india.hot_days_40",
        why: "A national annual average cannot tell a farmer in Rajasthan or a street vendor in Delhi how many punishing days they face.", read: "Hourly ERA5 temperatures are converted to daily maximums. Each line counts days when the maximum reached at least 40°C.", watch: "Threshold days can fall in a cooler year if the heat was short and sharp. Use this with the anomaly charts, not instead of them." },
      { chart: "multiLine", title: "Humidity turns heat into body stress", size: "feature", beat: "lived-heat", unit: "days per year",
        series: [
          { indicator: "climate.era5.hourly.region.all_india.humid_heat_days_40", label: "All India" },
          { indicator: "climate.era5.hourly.region.south_peninsula.humid_heat_days_40", label: "South peninsula" },
          { indicator: "climate.era5.hourly.region.central_deccan.humid_heat_days_40", label: "Central and Deccan India" },
          { indicator: "climate.era5.hourly.region.indo_gangetic_plain.humid_heat_days_40", label: "Indo-Gangetic plain" }
        ],
        indicator: "climate.era5.hourly.region.all_india.humid_heat_days_40",
        why: "The danger is not only thermometer heat. Humidity decides whether sweat can cool the body.", read: "Hourly ERA5 temperature and dew point are used to calculate heat index. A day counts when the daily maximum heat index reaches at least 40°C.", watch: "Heat index is a body-stress proxy, not a medical outcome. It says exposure rose, not how many people fell sick." },
      // ACT III — rain, water and the monsoon
      { indicator: "climate.era5.region.all_india.precip_anomaly_pct_southwest_monsoon_1991_2020", chart: "line", title: "The monsoon has become a sharper risk", size: "feature", window: "full", beat: "rain", unit: "% vs 1991-2020",
        why: "India does not live on annual rainfall alone. It lives on whether the monsoon arrives, pauses, dumps or fails.", read: "ERA5 June-September precipitation anomaly for all India, compared with 1991-2020.", watch: "A national monsoon total hides dry spells, floods and regional failures. Timing can hurt even when the season total looks normal." },
      { chart: "multiLine", title: "Rainy days are not moving together across India", size: "feature", beat: "rain-frequency", unit: "days per year",
        series: [
          { indicator: "climate.era5.hourly_precip.region.all_india.wet_days_1mm", label: "All India" },
          { indicator: "climate.era5.hourly_precip.region.indo_gangetic_plain.wet_days_1mm", label: "Indo-Gangetic plain" },
          { indicator: "climate.era5.hourly_precip.region.central_deccan.wet_days_1mm", label: "Central and Deccan India" },
          { indicator: "climate.era5.hourly_precip.region.south_peninsula.wet_days_1mm", label: "South peninsula" },
          { indicator: "climate.era5.hourly_precip.region.northeast_hills.wet_days_1mm", label: "Northeast hills" }
        ],
        indicator: "climate.era5.hourly_precip.region.all_india.wet_days_1mm",
        why: "Annual rain totals miss whether rain is spread across usable days or squeezed into fewer bursts.", read: "ERA5 hourly precipitation is summed to daily rainfall. A wet day is counted when the regional daily total reaches at least 1 mm.", watch: "This is a regional-average wet-day count. It does not say that every district got rain on the same days." },
      { chart: "multiLine", title: "Heavy-rain days are the drainage problem", size: "feature", beat: "rain-intensity", unit: "days per year",
        series: [
          { indicator: "climate.era5.hourly_precip.region.all_india.heavy_days_50mm", label: "All India" },
          { indicator: "climate.era5.hourly_precip.region.central_deccan.heavy_days_50mm", label: "Central and Deccan India" },
          { indicator: "climate.era5.hourly_precip.region.south_peninsula.heavy_days_50mm", label: "South peninsula" },
          { indicator: "climate.era5.hourly_precip.region.northeast_hills.heavy_days_50mm", label: "Northeast hills" },
          { indicator: "climate.era5.hourly_precip.region.indo_gangetic_plain.heavy_days_50mm", label: "Indo-Gangetic plain" }
        ],
        indicator: "climate.era5.hourly_precip.region.all_india.heavy_days_50mm",
        why: "The lived rain risk is often an overloaded drain, a flooded road or a crop field waterlogged in one spell.", read: "A heavy-rain day is counted when ERA5-derived daily precipitation reaches at least 50 mm in the regional average.", watch: "A regional average mutes local cloudbursts. District-level flood risk can be worse than this line looks." },
      { chart: "multiLine", title: "The wettest five-day spell is getting heavier", size: "feature", beat: "rain-intensity", unit: "mm",
        series: [
          { indicator: "climate.era5.hourly_precip.region.all_india.max_5day_mm", label: "All India" },
          { indicator: "climate.era5.hourly_precip.region.central_deccan.max_5day_mm", label: "Central and Deccan India" },
          { indicator: "climate.era5.hourly_precip.region.south_peninsula.max_5day_mm", label: "South peninsula" },
          { indicator: "climate.era5.hourly_precip.region.northeast_hills.max_5day_mm", label: "Northeast hills" },
          { indicator: "climate.era5.hourly_precip.region.indo_gangetic_plain.max_5day_mm", label: "Indo-Gangetic plain" }
        ],
        indicator: "climate.era5.hourly_precip.region.all_india.max_5day_mm",
        why: "Reservoirs, drains and fields feel clustered rain, not just seasonal totals.", read: "For each year, this picks the rainiest five-day stretch in each region from ERA5 hourly-derived daily rainfall.", watch: "The line is an annual maximum, so it is naturally jumpy. Read the decade-level shift, not one spike." },
      { indicator: "climate.era5.hourly_precip.region.all_india.monsoon_share_pct", chart: "line", title: "The monsoon still carries most of the year's rain", size: "feature", window: "full", beat: "rain-concentration", unit: "%",
        why: "The monsoon matters because so much of India's annual water arrives in one season.", read: "Share of annual ERA5 hourly-derived precipitation falling in June-September.", watch: "A stable or rising share does not mean the monsoon is safe. Timing, region and intensity still decide damage." },
      { indicator: "climate.el_nino.imd_monsoon_departure_1901_2025", chart: "line", title: "IMD's long monsoon record shows why averages mislead", size: "feature", window: "full", beat: "rain-check",
        why: "ERA5 gives the gridded climate layer; IMD's observed monsoon record is the historical reality check.", read: "All-India southwest monsoon rainfall departure from the long-period average, 1901-2025.", watch: "This is all-India rainfall. It does not say which district flooded or failed in a given year." },
      { chart: "multiLine", title: "2026 is hot and drier so far, but only through May", size: "feature", beat: "current-year", unit: "% vs Jan-May 1991-2020",
        series: [
          { indicator: "climate.era5.ytd.all_india.precip_anomaly_pct_jan_may_1991_2020", label: "All India" },
          { indicator: "climate.era5.ytd.indo_gangetic_plain.precip_anomaly_pct_jan_may_1991_2020", label: "Indo-Gangetic plain" },
          { indicator: "climate.era5.ytd.west_arid.precip_anomaly_pct_jan_may_1991_2020", label: "West and arid India" },
          { indicator: "climate.era5.ytd.central_deccan.precip_anomaly_pct_jan_may_1991_2020", label: "Central and Deccan India" },
          { indicator: "climate.era5.ytd.south_peninsula.precip_anomaly_pct_jan_may_1991_2020", label: "South peninsula" }
        ],
        indicator: "climate.era5.ytd.all_india.precip_anomaly_pct_jan_may_1991_2020",
        why: "The current-year section should show heat and rainfall together, while being explicit that the monsoon is not complete.", read: "Each line compares January-May precipitation with the same-month 1991-2020 normal. The latest point is 2026 through May.", watch: "This is before the full southwest monsoon. It is not a verdict on 2026 rainfall." },
      { chart: "multiLine", title: "Groundwater stress makes weak rain harder to absorb", size: "feature", beat: "water", unit: "% extraction",
        series: [
          { indicator: "water.cgwb.stage_trend_india_national", label: "India" },
          { indicator: "water.cgwb.stage_trend_delhi", label: "Delhi" },
          { indicator: "water.cgwb.stage_trend_tamil_nadu", label: "Tamil Nadu" }
        ],
        indicator: "water.cgwb.stage_trend_india_national",
        why: "Climate risk is not only how much rain falls. It is also whether farms and cities have a water buffer when rain fails or arrives badly.", read: "CGWB stage of groundwater extraction compares annual extraction with extractable groundwater resource. Values near or above 100% mean extraction is close to or above the assessed rechargeable resource.", watch: "These are assessment-cycle groundwater accounts, not monthly aquifer levels. They do not capture every local well or urban tanker market." },
      { chart: "multiLine", title: "The sea is rising on India's coasts", size: "feature", beat: "coast", unit: "mm vs 1961-1990",
        series: [
          { indicator: "climate.psmsl.mumbai", label: "Mumbai" },
          { indicator: "climate.psmsl.chennai", label: "Chennai" }
        ],
        indicator: "climate.psmsl.mumbai",
        why: "For coastal cities, climate change is not only a hot-day problem. Higher seas raise the floor under storm surge, drainage failure and chronic flooding.", read: "Permanent Service for Mean Sea Level tide-gauge series, expressed relative to the 1961-1990 average.", watch: "Tide gauges combine ocean change with local land movement and have gaps. Use the direction and scale, not a single annual point." },
      { indicator: "agriculture.el_nino.rainfall_crop_correlations", chart: "tableBars", title: "The monsoon still shows up in the harvest", size: "feature", beat: "food", unit: "correlation",
        why: "The rain story becomes a household story through crops. Even after irrigation and technology gains, monsoon rainfall is still visible in output.", read: "Bars show the correlation between monsoon rainfall and crop output in the DES panel. Higher bars mean crop output tracks the monsoon more closely.", watch: "Correlation is not causation. Crop prices, area, irrigation, procurement, seed technology and heat all move output too." },
      { indicator: "agriculture.el_nino.crop_yield_sensitivity", chart: "tableBars", title: "Rainfed crops take the climate hit first", size: "feature", beat: "food", unit: "% vs recent 5-year normal",
        why: "Climate damage is not evenly spread across the plate. Rainfed kharif crops are more exposed than irrigated or winter crops.", read: "Each bar shows how far that crop's national yield ran from its own recent five-year average in El Nino years.", watch: "This uses El Nino years as a stress-test for weak monsoon risk. It is not a full model of every climate pathway." },
      { indicator: "prices.el_nino.food_wpi_components", chart: "tableBars", title: "Climate shocks reach the plate unevenly", size: "feature", beat: "food", unit: "% post-monsoon WPI inflation",
        why: "Food inflation is not one number in lived experience. A weak monsoon can leave cereals buffered while pulses, onions or vegetables do the damage.", read: "Bars split post-monsoon wholesale inflation by food group in selected El Nino drought years.", watch: "Prices answer to stocks, imports, procurement and global markets as well as rain. Do not read this as a one-cause inflation model." },
      // ACT IV — air, cause and transition
      { indicator: "climate.pm25_iqair_country", chart: "line", title: "PM2.5 is still many times the safe-air guideline", size: "feature", window: "full", beat: "air",
        why: "The live AQI snapshot needs a recent annual PM2.5 measure beside it, not a stale World Bank series ending in 2020.", read: "IQAir annual country-average PM2.5 concentration, in micrograms per cubic metre, 2018-2025.", watch: "This is monitor-network coverage, not a perfectly population-weighted exposure estimate. Use it for recent national air-quality context, not district-level exposure." },
      { indicator: "owid.co2_total", chart: "line", title: "India's emissions are rising because development is energy-hungry", size: "feature", window: "full", beat: "cause",
        why: "The country is both exposed to warming and a growing contributor to the cause.", read: "Annual CO2 emissions from fossil fuels and cement.", watch: "Total emissions are not the fairness number. Use them with per-person and historical comparisons." },
      { indicator: "compare.climate.co2_per_capita", chart: "compareBars", title: "Per person, India is still far below rich-country emissions", size: "feature", window: "latest", beat: "fairness",
        why: "A fair climate article has to hold scale and responsibility together.", read: "Latest CO2 per person for India, China, the United States and the world average.", watch: "Per-person emissions do not erase India's rising total, and total emissions do not erase the per-person gap." },
      { indicator: "climate.ghg_by_sector", chart: "compositionStack", title: "Where the emissions come from", size: "feature", beat: "cause",
        columns: [
          { key: "Electricity and heat", label: "Electricity & heat" },
          { key: "Agriculture", label: "Agriculture" },
          { key: "Manufacturing and construction", label: "Manufacturing" },
          { key: "Transport", label: "Transport" },
          { key: "Industry", label: "Industry" },
          { key: "Buildings", label: "Buildings" },
          { key: "Fugitive emissions", label: "Fugitive" },
          { key: "Waste", label: "Waste" }
        ],
        why: "The solution set depends on the source: power, farms, industry and transport are different problems.", read: "Latest sector composition of greenhouse gas emissions, in CO2-equivalent.", watch: "This is composition, not a policy scorecard. It says where emissions sit, not which intervention is easiest." },
      { chart: "emberLines", title: "The grid is changing, but coal still does the work", size: "feature", beat: "transition", unit: "TWh",
        field: "generation_twh",
        series: [
          { indicator: "Coal", label: "Coal" },
          { indicator: "Solar", label: "Solar" },
          { indicator: "Wind", label: "Wind" },
          { indicator: "Hydro", label: "Hydro" },
          { indicator: "Gas", label: "Gas" },
          { indicator: "Nuclear", label: "Nuclear" }
        ],
        indicator: "energy.ember.generation",
        why: "India's climate path turns heavily on whether clean electricity grows faster than demand.", read: "Annual electricity generation by source. Coal remains the largest line while solar and wind rise from a low base.", watch: "Generation is not capacity. A gigawatt of solar and a gigawatt of coal do not produce the same annual electricity." },
      // ACT V — what it means for households and work
      { chart: "multiLine", title: "Cooling demand rises faster than cooling access", size: "feature", beat: "household",
        series: [
          { indicator: "heat.cooling.ac_all", label: "AC ownership, all households" },
          { indicator: "heat.cooling.ac_urban", label: "AC ownership, urban" },
          { indicator: "heat.cooling.ac_rural", label: "AC ownership, rural" },
          { indicator: "heat.cooling.nfhs5_ac_cooler_all", label: "AC or cooler, NFHS-5" }
        ],
        indicator: "heat.cooling.ac_all",
        why: "Heat becomes inequality when the escape route is an appliance most households do not have.", read: "Household cooling ownership measures from NSS/NFHS-derived artifacts.", watch: "These are survey snapshots from different instruments, not a perfect annual time series. Read the rural-urban gap more than tiny differences." },
      { indicator: "heat.cooling.cooler_by_state", chart: "choropleth", title: "The cooling map does not match the heat map", size: "feature", beat: "household", unit: "% with an air cooler", signed: false, ramp: "cool", rankLabel: "Most air coolers", bottomLabel: "Almost none",
        why: "The appliance people can afford is not always the appliance the climate needs. Evaporative coolers are common in the dry north and weak in humid heat.", read: "Each state is shaded by the share of households owning an air cooler in NSS 78.", watch: "Coolers are not air conditioners. Low ownership in humid states reflects both affordability and the fact that coolers work poorly in damp air." },
      { indicator: "heat.vulnerability.state_risk_cooling_poverty", chart: "heatVulnerabilityScatter", title: "Where heat is hardest to survive", size: "feature", beat: "vulnerability", unit: "%",
        why: "A climate impact article needs to join hazard with the ability to cope. The dangerous zone is high heat risk, low cooling protection and poverty together.", read: "Right means more districts rated high or very high heat risk. Up means more households without the conservative cooling-protection proxy. Bigger bubbles are poorer states.", watch: "This is not a death-risk model. It combines state-level context from different sources, so use it to locate vulnerability, not to rank exact mortality risk." },
      { chart: "multiLine", title: "Heat hits work before it hits GDP tables", size: "feature", beat: "livelihood",
        series: [
          { indicator: "heat.context.agriculture_employment_share", label: "Agriculture employment" },
          { indicator: "heat.context.vulnerable_employment_share", label: "Vulnerable employment" }
        ],
        indicator: "heat.context.agriculture_employment_share",
        why: "Outdoor and insecure work turns climate from a weather story into an income story.", read: "Shares of employment in agriculture and vulnerable work, both exposed to heat and rainfall disruption.", watch: "These series show exposure, not measured heat damages. They say who is in harm's way, not exactly how much income was lost." },
      { indicator: "heat.work.lancet_labour_loss_sector_shares", chart: "tableBars", title: "Heat is already costing work hours", size: "feature", beat: "livelihood", unit: "% of heat-related labour-hour losses",
        why: "This moves from exposure to measured economic loss: heat already cuts labour capacity, especially in outdoor sectors.", read: "Bars split heat-related labour-hour losses by sector in Lancet Countdown's India data sheet.", watch: "These are shares of estimated heat-related labour-hour losses, not observed absences or wages." },
      { indicator: "heat.death_count_comparison", chart: "heatDeathCountBars", title: "Heat deaths depend on how you count them", size: "feature", beat: "health", unit: "deaths or excess deaths",
        why: "The mortality record is part of the climate story because official heatstroke counts and modelled excess deaths answer different questions.", read: "Bars compare administrative, disaster, surveillance and modelled estimates on a log scale, using each source's own definition.", watch: "Do not rank these as rival measurements of one fact. The large estimates are modelled excess mortality; the smaller ones are reported or certified counts." },
      { chart: "multiLine", title: "A hotter century means more cooling load", size: "feature", beat: "household",
        series: [
          { indicator: "climate.cckp.cdd_historical", label: "Observed" },
          { indicator: "climate.cckp.cdd_ssp126", label: "Low emissions" },
          { indicator: "climate.cckp.cdd_ssp245", label: "Middle road" },
          { indicator: "climate.cckp.cdd_ssp585", label: "High emissions" }
        ],
        indicator: "climate.cckp.cdd_ssp245",
        why: "Cooling is the bridge between climate, household bills and the power grid.", read: "Cooling degree days estimate how much and how long temperatures exceed a comfort baseline.", watch: "This is potential cooling demand. Actual electricity use depends on income, housing, appliance access and power reliability." }
    ]
  },
  {
    id: "q.services.water",
    question: "Do Indians have safe drinking water?",
    priority: "core",
    indicators: ["society.water_basic"],
    core: ["society.water_basic"],
    context: ["society.sanitation_basic"]
  },
  {
    id: "q.state.tax",
    question: "How much tax does India collect?",
    priority: "core",
    indicators: ["state.tax_revenue_gdp", "state.expense_gdp", "state.debt_central_gdp"],
    core: ["state.tax_revenue_gdp", "state.expense_gdp", "state.debt_central_gdp"],
    context: []
  },
  {
    id: "q.world.share",
    question: "What share of the world is India?",
    priority: "core",
    indicators: ["world.share.population", "world.share.gdp_current_usd", "world.share.co2_total"],
    core: ["world.share.population", "world.share.gdp_current_usd", "world.share.co2_total"],
    context: []
  },
  {
    id: "q.society.connected",
    question: "How connected is India?",
    priority: "core",
    indicators: ["society.owid.internet_share"],
    core: ["society.owid.internet_share"],
    // Blended: World Bank backbone + OWID comparison + IndiaDataHub (TRAI/NPCI) detail + official TRAI PDF-backed monthly reports.
    context: [
      "energy.electricity_access",
      "society.mobile_subscriptions_p100",
      "society.broadband_subscriptions_p100",
      "society.fixed_telephone_p100",
      "society.idh.data_per_user",
      "society.idh.data_cost",
      "society.idh.upi_volume",
      "society.idh.internet_subs_wireless",
      "society.idh.internet_subs_fixed",
      "society.trai.telecom_subscribers_total",
      "society.trai.telecom_subscribers_wireless",
      "society.trai.telecom_subscribers_wireline",
      "society.trai.telecom_subscribers_rural_total",
      "society.trai.telecom_subscribers_urban_total",
      "society.trai.broadband_subscribers_total",
      "society.trai.teledensity_total",
      "society.trai.active_wireless_mobile_subscribers_peak_vlr",
      "society.trai.mobile_number_portability_requests",
      "society.internet_users_female",
      "society.internet_users_male",
      "compare.society.internet_users"
    ],
    visualPlan: [
      { indicator: "society.owid.internet_share", chart: "line", title: "Indians online, % of population", size: "hero", window: "full", beat: "level",
        why: "The headline climb from almost nobody to most of the country.", read: "The share of Indians using the internet each year, rising steeply after the mid-2010s.", watch: "Using the internet at least once is a low bar; it does not mean daily, fast, or meaningful access." },
      { indicator: "energy.electricity_access", chart: "line", title: "The foundation: access to electricity", size: "small", window: "full", beat: "prerequisite",
        why: "You cannot connect what you cannot power; near-universal electricity came first.", read: "The share of the population with electricity, reaching almost everyone before the data boom.", watch: "Access to a connection is not the same as reliable, all-day power." },
      { chart: "multiLine", title: "How India connects: mobile vs broadband vs landline", size: "feature", beat: "composition", unit: "per 100 people", subtitle: "World Bank · subscriptions per 100 people",
        series: [
          { indicator: "society.mobile_subscriptions_p100", label: "Mobile" },
          { indicator: "society.broadband_subscriptions_p100", label: "Fixed broadband" },
          { indicator: "society.fixed_telephone_p100", label: "Landline" }
        ],
        indicator: "society.mobile_subscriptions_p100",
        why: "India leapfrogged wires and went straight to mobile.", read: "Mobile per 100 people towers over fixed broadband and landlines, which barely moved.", watch: "Mobile subscriptions count SIMs, not people; many Indians hold more than one." },
      { indicator: "society.idh.data_per_user", chart: "line", title: "Mobile data used per person each month", size: "feature", window: "full", beat: "intensity",
        why: "The Jio shock: data use exploded after 2016.", read: "Average gigabytes per subscriber per month, which jumped many times over in a few years.", watch: "This is an average; heavy users pull it up, and it says nothing about speed or quality." },
      { indicator: "society.idh.data_cost", chart: "line", title: "What a gigabyte of mobile data costs", size: "feature", window: "full", beat: "driver",
        why: "The mirror image of the surge: price collapsed.", read: "The average cost per gigabyte in rupees, which fell dramatically as data use soared.", watch: "Cheap data drove the boom, but the price war also squeezed the companies providing it." },
      { indicator: "society.idh.upi_volume", chart: "line", title: "UPI transactions each month", size: "feature", window: "full", beat: "payments",
        why: "Being connected reshaped how India pays.", read: "The number of UPI transactions per month, climbing from a standing start in 2020.", watch: "Transaction count includes tiny payments; volume is not the same as the value moved." },
      { chart: "multiLine", title: "Internet subscribers: wireless vs fixed line", size: "small", beat: "composition", unit: "subscribers", subtitle: "IndiaDataHub · TRAI · internet subscribers",
        series: [
          { indicator: "society.idh.internet_subs_wireless", label: "Wireless" },
          { indicator: "society.idh.internet_subs_fixed", label: "Fixed line" }
        ],
        indicator: "society.idh.internet_subs_wireless",
        why: "Almost all of India's internet rides on mobile networks.", read: "Wireless internet subscribers dwarf the fixed-line connections.", watch: "A wireless subscription can be slower and less stable than a good fixed line." },
      { chart: "multiLine", title: "Rural vs urban telecom subscribers", size: "small", beat: "divide", unit: "million subscriptions", subtitle: "TRAI monthly report PDFs · telephone subscribers",
        series: [
          { indicator: "society.trai.telecom_subscribers_rural_total", label: "Rural" },
          { indicator: "society.trai.telecom_subscribers_urban_total", label: "Urban" }
        ],
        indicator: "society.trai.telecom_subscribers_rural_total",
        why: "The divide: where the connections actually are.", read: "Rural and urban telecom subscribers over time; rural is catching up but from behind.", watch: "Subscriber counts are not population-adjusted; rural India is far larger, so per-person access lags more than the totals suggest." },
      { chart: "line", title: "Tele-density, total", size: "small", beat: "reach", unit: "%", subtitle: "TRAI monthly report PDFs · telephone connections per population",
        indicator: "society.trai.teledensity_total",
        why: "Subscriber totals need a population lens; tele-density shows the rough reach of phone connections.", read: "Total tele-density from TRAI monthly reports, including older single-row tele-density and newer without-M2M rows where available.", watch: "Tele-density is connections per population, not unique people. One person can hold multiple SIMs, and M2M connections changed definitions in late 2025." },
      { chart: "line", title: "Mobile number portability requests", size: "small", beat: "market-behaviour", unit: "million requests", subtitle: "TRAI monthly report PDFs · MNP requests",
        indicator: "society.trai.mobile_number_portability_requests",
        why: "A connected market is also a switchable market; MNP shows how many subscribers ask to move providers while keeping their number.", read: "Monthly MNP requests from the TRAI headline report table and note text.", watch: "Requests are not completed ports, and one person can submit more than one request over time." },
      { chart: "latestBars", title: "The gender gap online", size: "small", beat: "divide", unit: "% who use the internet", subtitle: "World Bank · internet use by sex, latest available",
        series: [
          { indicator: "society.internet_users_female", label: "Women" },
          { indicator: "society.internet_users_male", label: "Men" }
        ],
        indicator: "society.internet_users_female",
        why: "Connection is not shared equally between men and women.", read: "The share of women versus men using the internet at the latest measured year.", watch: "Two bars are a snapshot, not a trend; the gap may be closing, but at the latest reading men are still clearly ahead." },
      { indicator: "compare.society.internet_users", chart: "compareBars", title: "India vs China vs world, internet use", size: "small", window: "latest", beat: "comparison",
        why: "How India's connection rate stacks up globally.", read: "The share online in India compared with China, the US, and the world average at the latest common year.", watch: "India started later and is catching up fast; a gap today is not a gap forever." }
    ]
  },
  {
    id: "q.agriculture.edible_oil_imports",
    slug: "why-india-imports-so-much-edible-oil",
    question: "Why does India import so much edible oil?",
    priority: "core",
    series: "agriculture",
    indicators: [
      "trade.edible_oil.import_volume",
      "trade.edible_oil.import_mix_latest",
      "agriculture.edible_oil.oilseed_production"
    ],
    core: [
      "trade.edible_oil.import_volume",
      "trade.edible_oil.import_mix_latest",
      "agriculture.edible_oil.oilseed_production"
    ],
    context: [
      "trade.edible_oil.import_volume",
      "trade.edible_oil.export_volume",
      "trade.edible_oil.import_export_volume",
      "trade.edible_oil.import_value",
      "trade.edible_oil.import_mix_latest",
      "trade.edible_oil.import_partners_latest",
      "agriculture.edible_oil.oilseed_production",
      "agriculture.edible_oil.oilseed_area",
      "agriculture.edible_oil.sowing_progress_latest",
      "agriculture.edible_oil.oilseed_yield",
      "agriculture.edible_oil.crop_mix_latest",
      "agriculture.edible_oil.state_oilseed_production_top",
      "prices.cpi.combined.oils_fats.inflation",
      "prices.cpi.item.refined_oil.inflation"
    ],
    visualPlan: [
      {
        chart: "multiLine",
        indicator: "trade.edible_oil.import_volume",
        title: "Edible-oil trade is almost all imports",
        subtitle: "UN Comtrade · HS 1511, 1507, 1512, 1514 and 1508 · calendar years",
        size: "hero",
        window: "full",
        beat: "answer",
        unit: "million tonnes",
        series: [
          { indicator: "trade.edible_oil.import_volume", label: "Imports" },
          { indicator: "trade.edible_oil.export_volume", label: "Exports" }
        ],
        why: "The dependency is not a balanced trade relationship: imports tower over exports.",
        read: "Annual net weight of major edible-oil imports and exports, summed across palm, soybean, sunflower/safflower/cottonseed, rapeseed/mustard and groundnut oil.",
        watch: "This is calendar-year customs trade, not India's crop year. It measures oil trade, not domestic oil production."
      },
      {
        indicator: "trade.edible_oil.import_mix_latest",
        chart: "tableBars",
        title: "Three oils explain almost the whole import basket",
        subtitle: "UN Comtrade · import volume by HS heading · 2024",
        size: "feature",
        beat: "composition",
        unit: "million tonnes",
        why: "Dependency is concentrated: palm, soybean and sunflower-type oils dominate.",
        read: "Each bar is the imported volume of an edible-oil category in 2024.",
        watch: "HS 1512 combines sunflower, safflower and cottonseed oil. Palm is one category, but it includes crude and refined fractions."
      },
      {
        indicator: "trade.edible_oil.import_value",
        chart: "line",
        title: "The bill is a world-price shock, not just a volume story",
        subtitle: "UN Comtrade · current US$ · same HS basket as volume chart",
        size: "feature",
        window: "full",
        beat: "price-exposure",
        unit: "US$ billions",
        why: "Even when volumes move gradually, the import bill can spike with global prices.",
        read: "Current-dollar import value for the same edible-oil basket.",
        watch: "This is not inflation-adjusted; the 2021-22 jump is a price story as much as a quantity story."
      },
      {
        indicator: "agriculture.edible_oil.oilseed_production",
        chart: "line",
        title: "The harvest grew, but seed tonnes are not oil tonnes",
        subtitle: "UPAg · Total Oil Seeds production · crop years · final estimates to 2024-25, 2025-26 third advance estimate",
        size: "feature",
        window: "full",
        beat: "domestic-supply",
        unit: "million tonnes of oilseeds",
        why: "India is not standing still: oilseed output has grown a lot. The import problem survives anyway.",
        read: "Total oilseed crop production, converted from lakh tonnes to million tonnes.",
        watch: "Oilseed tonnes are seed tonnes. They are not edible-oil tonnes because crushing recovery differs by crop."
      },
      {
        indicator: "agriculture.edible_oil.oilseed_yield",
        chart: "line",
        title: "Yield is improving, but not fast enough to do the job alone",
        subtitle: "UPAg · Total Oil Seeds yield · kg/ha",
        size: "feature",
        window: "full",
        beat: "productivity",
        unit: "kg per hectare",
        why: "Long-run self-reliance depends more on yield than on endlessly adding land.",
        read: "Average oilseed yield across all oilseed crops.",
        watch: "This is a blended yield. A shift from one oilseed crop to another can move the average even if crop-specific yields do not improve."
      },
      {
        indicator: "agriculture.edible_oil.oilseed_area",
        chart: "line",
        title: "More oilseed land helps until it displaces something else",
        subtitle: "UPAg · Total Oil Seeds area · crop years",
        size: "feature",
        window: "full",
        beat: "land-constraint",
        unit: "million hectares",
        why: "Land is the hard constraint: more oilseeds compete with cereals, pulses, cotton and fodder.",
        read: "Total area planted under oilseeds, converted from lakh hectares to million hectares.",
        watch: "Area can rise in a good price year, but it cannot expand indefinitely without displacing something else."
      },
      {
        indicator: "agriculture.edible_oil.sowing_progress_latest",
        chart: "tableBars",
        title: "This season's sowing is ahead of last year, but below target",
        subtitle: "UPAg · progressive crop area sown · Total Oilseeds · All India",
        size: "feature",
        beat: "current-season",
        unit: "million hectares",
        why: "The live UPAg snapshot adds timing: acreage can improve in the current season without settling the structural import question.",
        read: "Compare current area sown with last year's coverage, the official target and the normal area.",
        watch: "This is area coverage, not production or yield. A better sowing snapshot does not automatically become more oil."
      },
      {
        indicator: "agriculture.edible_oil.crop_mix_latest",
        chart: "tableBars",
        title: "India grows soybean, mustard and groundnut; imports want palm too",
        subtitle: "UPAg · oilseed crop production · 2024-25 Final Estimate",
        size: "feature",
        beat: "domestic-composition",
        unit: "million tonnes of oilseeds",
        why: "The domestic crop mix does not match the import basket perfectly.",
        read: "Latest oilseed production by crop.",
        watch: "This is seed production. Sunflower seed output is tiny beside the volume of imported sunflower-type oil."
      },
      {
        indicator: "agriculture.edible_oil.state_oilseed_production_top",
        chart: "tableBars",
        title: "The domestic bet rests heavily on four states",
        subtitle: "UPAg · Total Oil Seeds production by state · 2024-25 Final Estimate",
        size: "feature",
        beat: "geography",
        unit: "million tonnes of oilseeds",
        why: "Domestic supply is geographically concentrated, so weather and prices in a few states matter nationally.",
        read: "Top oilseed-producing states by crop output.",
        watch: "This is crop production, not crushing capacity. A state can grow seed that is processed elsewhere."
      },
      {
        indicator: "trade.edible_oil.import_partners_latest",
        chart: "comtradePartnerBars",
        title: "The cooking-oil shelf begins in a few foreign supply chains",
        subtitle: "UN Comtrade · India edible-oil import value by partner · 2024",
        size: "feature",
        beat: "external-sources",
        field: "primaryValue",
        limit: 10,
        unit: "US$ billions",
        why: "The source-country chart makes the supply chain real: palm from Southeast Asia, soybean oil from South America, sunflower oil from the Black Sea.",
        read: "Top partner countries by current-dollar import value, summed across major edible-oil HS headings.",
        watch: "This is a value chart, not tonnes. Expensive oils and price spikes can lift a partner's bar."
      },
      {
        chart: "multiLine",
        indicator: "prices.cpi.combined.oils_fats.inflation",
        title: "When imports get costly, the kitchen feels it",
        subtitle: "MoSPI CPI · oils and fats group + refined oil item · year-on-year inflation",
        size: "feature",
        beat: "household-price",
        unit: "% YoY",
        series: [
          { indicator: "prices.cpi.combined.oils_fats.inflation", label: "Oils & fats" },
          { indicator: "prices.cpi.item.refined_oil.inflation", label: "Refined oil" }
        ],
        why: "This is the real-life bridge: import dependence becomes household price volatility.",
        read: "Retail inflation for the oils-and-fats CPI group and refined oil item.",
        watch: "CPI is retail price inflation, not import price. Duties, inventories, brands and local margins sit between port prices and the kirana shelf."
      }
    ]
  },
  {
    "id": "q.econ.trade",
    "question": "How does India trade with the world?",
    "priority": "core",
    "series": "trade",
    "indicators": [
      "trade.derived.merch_exports",
      "trade.derived.merch_imports",
      "trade.derived.merch_balance",
      "trade.wb.exports_gdp",
      "trade.wb.imports_gdp"
    ],
    "core": [
      "trade.derived.merch_exports",
      "trade.derived.merch_imports",
      "trade.derived.merch_balance",
      "trade.wb.exports_gdp",
      "trade.wb.imports_gdp"
    ],
    "context": [
      "trade.derived.merch_exports",
      "trade.derived.merch_imports",
      "trade.derived.merch_balance",
      "trade.wb.exports_gdp",
      "trade.wb.imports_gdp",
      "trade.derived.merch_export_world_share",
      "trade.derived.export_volume_index",
      "trade.derived.export_value_index",
      "trade.derived.trade_per_capita",
      "trade.derived.services_balance",
      "trade.derived.remittances",
      "trade.derived.net_goods_services_balance",
      "trade.derived.remittances_gdp",
      "trade.wb.current_account_gdp"
    ],
    "visualPlan": [
      {
        "chart": "multiLine",
        "title": "How much India trades, 1948 to today",
        "size": "hero",
        "beat": "level",
        "unit": "US$ billions",
        "subtitle": "WTO · merchandise exports and imports · current US$",
        "series": [
          {
            "indicator": "trade.derived.merch_exports",
            "label": "Exports"
          },
          {
            "indicator": "trade.derived.merch_imports",
            "label": "Imports"
          }
        ],
        "indicator": "trade.derived.merch_exports",
        "why": "The headline: the scale of India's goods trade and how recently it took off.",
        "read": "Two lines — what India sells abroad and what it buys — in current dollars. Both were tiny until the 1990s, then surged.",
        "watch": "These are current dollars, not inflation-adjusted, so part of the rise is global prices. Imports sitting above exports is the trade deficit."
      },
      {
        "indicator": "trade.derived.merch_balance",
        "chart": "line",
        "title": "India's goods trade deficit",
        "size": "small",
        "window": "full",
        "beat": "deficit",
        "why": "India buys more goods than it sells, and the gap has widened.",
        "read": "Exports minus imports each year. Below zero means a deficit.",
        "watch": "A goods deficit is not automatically bad — services exports and remittances help pay for it, which this goods-only line cannot show."
      },
      {
        "chart": "multiLine",
        "title": "How open India's economy is",
        "size": "feature",
        "beat": "openness",
        "unit": "% of GDP",
        "subtitle": "World Bank · trade as a share of GDP",
        "series": [
          {
            "indicator": "trade.wb.exports_gdp",
            "label": "Exports"
          },
          {
            "indicator": "trade.wb.imports_gdp",
            "label": "Imports"
          }
        ],
        "indicator": "trade.wb.exports_gdp",
        "why": "Trade matters more to India than the raw dollars suggest — measured against the size of the economy.",
        "read": "Exports and imports of goods and services as a percentage of GDP. The climb after 1991 is the opening-up.",
        "watch": "The ratio peaked around the late 2000s and has drifted since; a high ratio means more exposure to global shocks."
      },
      {
        "indicator": "trade.derived.merch_export_world_share",
        "chart": "line",
        "title": "India's slice of world exports",
        "size": "feature",
        "window": "full",
        "beat": "world-share",
        "why": "The single clearest measure of India's rise as a trading nation.",
        "read": "India's merchandise exports as a share of all world merchandise exports.",
        "watch": "The share roughly tripled since the mid-1990s but is still under 2% — India is a fast-growing minnow in goods, not yet a giant."
      },
      {
        "chart": "multiLine",
        "title": "Real vs nominal export growth",
        "size": "small",
        "beat": "real-growth",
        "unit": "index, 2015 = 100",
        "subtitle": "WTO · merchandise export value vs volume index",
        "series": [
          {
            "indicator": "trade.derived.export_value_index",
            "label": "Value (nominal)"
          },
          {
            "indicator": "trade.derived.export_volume_index",
            "label": "Volume (real)"
          }
        ],
        "indicator": "trade.derived.export_volume_index",
        "why": "How much of India's export 'growth' is real, and how much is just higher prices.",
        "read": "Two indices rebased to 2015. Value counts dollars; volume counts the quantity of goods.",
        "watch": "When the value line runs above the volume line, prices — not extra shipments — are doing the lifting."
      },
      {
        "indicator": "trade.derived.trade_per_capita",
        "chart": "line",
        "title": "India's trade per person",
        "size": "small",
        "window": "full",
        "beat": "per-capita",
        "why": "The per-person reality check behind the big aggregate numbers.",
        "read": "Goods exports plus imports, divided by population, in dollars per person.",
        "watch": "India's huge population means even large totals shrink to modest per-person figures — far below Asian export economies."
      },
      {
        "chart": "multiLine",
        "title": "Who pays for the goods deficit?",
        "size": "feature",
        "beat": "who-pays",
        "unit": "US$ billions",
        "subtitle": "WTO + World Bank · annual flows with the world",
        "series": [
          {
            "indicator": "trade.derived.merch_balance",
            "label": "Goods balance"
          },
          {
            "indicator": "trade.derived.services_balance",
            "label": "Services balance"
          },
          {
            "indicator": "trade.derived.remittances",
            "label": "Remittances"
          }
        ],
        "indicator": "trade.derived.services_balance",
        "why": "The deficit story is incomplete without the two flows that fund it.",
        "read": "Three lines: the goods balance (deep negative), the services surplus, and remittances from Indians abroad.",
        "watch": "The services surplus and remittances together nearly cancel the goods deficit — India is far closer to balance than the goods figure alone suggests."
      },
      {
        "indicator": "trade.derived.net_goods_services_balance",
        "chart": "line",
        "title": "The net trade balance",
        "size": "small",
        "window": "full",
        "beat": "net-balance",
        "why": "Goods and services combined — a truer picture than goods alone.",
        "read": "Exports minus imports for goods and services together. Still negative, but a fraction of the goods-only gap.",
        "watch": "Add remittances (not shown here) and India's external position is close to balanced most years."
      },
      {
        "indicator": "trade.derived.remittances_gdp",
        "chart": "line",
        "title": "The remittance lifeline",
        "size": "small",
        "window": "full",
        "beat": "remit-gdp",
        "why": "India is the world's largest recipient of remittances — money sent home by its diaspora.",
        "read": "Remittances received as a share of GDP.",
        "watch": "This is income, not trade, but it is a major source of the dollars that pay for imports."
      },
      {
        "indicator": "trade.wb.current_account_gdp",
        "chart": "line",
        "title": "The external balance",
        "size": "small",
        "window": "full",
        "beat": "current-account",
        "why": "Whether India, overall, lives within its external means.",
        "read": "The current account balance as a share of GDP — all goods, services, and income flows with the world. Below zero is a deficit.",
        "watch": "Services exports and remittances usually shrink the goods deficit to a far smaller current-account gap."
      }
    ]
  },
  {
    "id": "q.econ.trade_partners",
    "question": "Who does India trade with?",
    "priority": "core",
    "series": "trade",
    "indicators": [
      "trade.derived.merch_exports_manufactures",
      "trade.derived.merch_exports_fuels_mining",
      "trade.derived.merch_exports_chemicals",
      "trade.derived.merch_exports_agriculture",
      "trade.comtrade.exports_by_partner"
    ],
    "core": [
      "trade.derived.merch_exports_manufactures",
      "trade.derived.merch_exports_fuels_mining",
      "trade.derived.merch_exports_chemicals",
      "trade.derived.merch_exports_agriculture",
      "trade.comtrade.exports_by_partner"
    ],
    "context": [
      "trade.derived.merch_exports_manufactures",
      "trade.derived.merch_exports_fuels_mining",
      "trade.derived.merch_exports_chemicals",
      "trade.derived.merch_exports_agriculture",
      "trade.comtrade.exports_by_partner",
      "trade.comtrade.imports_by_partner",
      "trade.comtrade.exports_by_hs_chapter",
      "trade.comtrade.imports_by_hs_chapter",
      "trade.derived.merch_exports_monthly",
      "trade.derived.merch_imports_monthly",
      "trade.derived.merch_imports_fuels_mining",
      "trade.derived.merch_imports_manufactures",
      "trade.derived.merch_imports_machinery",
      "trade.derived.merch_imports_agriculture",
      "trade.derived.china_imports",
      "trade.derived.china_exports",
      "trade.derived.russia_imports",
      "trade.derived.russia_exports",
      "trade.derived.exports_region_north_america",
      "trade.derived.exports_region_europe",
      "trade.derived.exports_region_east_se_asia",
      "trade.derived.exports_region_middle_east",
      "trade.derived.exports_region_africa",
      "trade.derived.exports_region_south_asia",
      "trade.derived.imports_region_east_se_asia",
      "trade.derived.imports_region_middle_east",
      "trade.derived.imports_region_europe",
      "trade.derived.imports_region_north_america",
      "trade.derived.export_partner_top5_share"
    ],
    "visualPlan": [
      {
        "chart": "multiLine",
        "title": "What India sells abroad, by product",
        "size": "feature",
        "beat": "basket",
        "unit": "US$ billions",
        "subtitle": "WTO · merchandise exports by product group · current US$",
        "series": [
          {
            "indicator": "trade.derived.merch_exports_manufactures",
            "label": "Manufactures"
          },
          {
            "indicator": "trade.derived.merch_exports_fuels_mining",
            "label": "Fuels & mining"
          },
          {
            "indicator": "trade.derived.merch_exports_chemicals",
            "label": "Chemicals"
          },
          {
            "indicator": "trade.derived.merch_exports_agriculture",
            "label": "Agriculture"
          }
        ],
        "indicator": "trade.derived.merch_exports_manufactures",
        "why": "The export basket is not what most people picture: manufactures lead, and refined fuels became huge.",
        "read": "Four product groups over time. Manufactures dominate; fuels & mining (mostly refined petroleum) surged in the 2000s.",
        "watch": "Fuels here are largely refined products made from imported crude — value added, not domestic oil."
      },
      {
        "indicator": "trade.comtrade.exports_by_partner",
        "chart": "comtradePartnerBars",
        "title": "Where India's exports go",
        "size": "feature",
        "field": "primaryValue",
        "limit": 10,
        "beat": "export-partners",
        "why": "India's top customers, ranked.",
        "read": "The ten largest destination countries for India's goods exports in the latest year, in US$ billions.",
        "watch": "The United States and UAE lead by a wide margin; this is one year's snapshot, not a trend."
      },
      {
        "indicator": "trade.comtrade.imports_by_partner",
        "chart": "comtradePartnerBars",
        "title": "Where India's imports come from",
        "size": "feature",
        "field": "primaryValue",
        "limit": 10,
        "beat": "import-partners",
        "why": "India's top suppliers, ranked — a very different list from its customers.",
        "read": "The ten largest source countries for India's goods imports in the latest year, in US$ billions.",
        "watch": "China dominates, with Russia now second on the back of discounted crude — a sharp recent shift."
      },
      {
        "indicator": "trade.comtrade.exports_by_hs_chapter",
        "chart": "comtradeCommodityBars",
        "title": "India's biggest export products",
        "size": "small",
        "field": "primaryValue",
        "limit": 10,
        "beat": "export-products",
        "why": "What actually leaves India's ports, by product chapter.",
        "read": "The ten largest export product chapters in the latest year, in US$ billions.",
        "watch": "Refined fuels, gems & jewellery, machinery, and pharma lead — a mix of resource-processing and skilled manufacturing."
      },
      {
        "indicator": "trade.comtrade.imports_by_hs_chapter",
        "chart": "comtradeCommodityBars",
        "title": "India's biggest import products",
        "size": "small",
        "field": "primaryValue",
        "limit": 10,
        "beat": "import-products",
        "why": "What India most depends on buying from abroad.",
        "read": "The ten largest import product chapters in the latest year, in US$ billions.",
        "watch": "Crude oil, gold, electronics, and machinery dominate — the structural reasons behind the goods deficit."
      },
      {
        "chart": "multiLine",
        "title": "The latest monthly trade",
        "size": "small",
        "beat": "recency",
        "unit": "US$ billions",
        "subtitle": "WTO · monthly merchandise trade · current US$",
        "series": [
          {
            "indicator": "trade.derived.merch_exports_monthly",
            "label": "Exports"
          },
          {
            "indicator": "trade.derived.merch_imports_monthly",
            "label": "Imports"
          }
        ],
        "indicator": "trade.derived.merch_exports_monthly",
        "why": "The freshest read on India's goods trade, month by month.",
        "read": "Monthly exports and imports over the last six years, running to within a couple of months of today.",
        "watch": "Monthly data is volatile and seasonal; watch the trend, not any single month's spike or dip."
      },
      {
        "chart": "multiLine",
        "title": "What India buys abroad, by product",
        "size": "small",
        "beat": "import-basket",
        "unit": "US$ billions",
        "subtitle": "WTO · merchandise imports by product group · current US$",
        "series": [
          {
            "indicator": "trade.derived.merch_imports_fuels_mining",
            "label": "Fuels & mining"
          },
          {
            "indicator": "trade.derived.merch_imports_manufactures",
            "label": "Manufactures"
          },
          {
            "indicator": "trade.derived.merch_imports_machinery",
            "label": "Machinery & transport"
          },
          {
            "indicator": "trade.derived.merch_imports_agriculture",
            "label": "Agriculture"
          }
        ],
        "indicator": "trade.derived.merch_imports_fuels_mining",
        "why": "The import basket explains the deficit: it is dominated by energy and capital goods India cannot yet make at home.",
        "read": "Four import groups over time. Fuels & mining (crude oil) is the single biggest, with machinery close behind.",
        "watch": "Manufactures here include gold, a large cultural import; energy and machinery are the structural drivers."
      },
      {
        "chart": "multiLine",
        "title": "India's lopsided trade with China",
        "size": "feature",
        "beat": "china",
        "unit": "US$ billions",
        "subtitle": "UN Comtrade · India–China merchandise trade",
        "series": [
          {
            "indicator": "trade.derived.china_imports",
            "label": "Imports from China"
          },
          {
            "indicator": "trade.derived.china_exports",
            "label": "Exports to China"
          }
        ],
        "indicator": "trade.derived.china_imports",
        "why": "No bilateral relationship shapes India's deficit more than China's.",
        "read": "Imports from China against exports to China since 2000. Imports exploded; exports barely moved.",
        "watch": "The gap between the lines — over $100B a year — is India's single largest bilateral deficit."
      },
      {
        "chart": "multiLine",
        "title": "The Russia trade surge",
        "size": "small",
        "beat": "russia",
        "unit": "US$ billions",
        "subtitle": "UN Comtrade · India–Russia merchandise trade",
        "series": [
          {
            "indicator": "trade.derived.russia_imports",
            "label": "Imports from Russia"
          },
          {
            "indicator": "trade.derived.russia_exports",
            "label": "Exports to Russia"
          }
        ],
        "indicator": "trade.derived.russia_imports",
        "why": "How fast a single geopolitical shift can redraw a trade map.",
        "read": "Imports from Russia jumped after 2022 as India bought discounted crude oil.",
        "watch": "Exports to Russia stayed flat, so this surge widened the deficit and is largely about energy."
      },
      {
        "chart": "multiLine",
        "title": "Where India's exports go, by region",
        "size": "feature",
        "beat": "region-exports",
        "unit": "US$ billions",
        "subtitle": "UN Comtrade · merchandise exports by region · benchmark years",
        "series": [
          {
            "indicator": "trade.derived.exports_region_europe",
            "label": "Europe & CIS"
          },
          {
            "indicator": "trade.derived.exports_region_north_america",
            "label": "North America"
          },
          {
            "indicator": "trade.derived.exports_region_east_se_asia",
            "label": "East & SE Asia"
          },
          {
            "indicator": "trade.derived.exports_region_middle_east",
            "label": "Middle East"
          },
          {
            "indicator": "trade.derived.exports_region_africa",
            "label": "Africa"
          },
          {
            "indicator": "trade.derived.exports_region_south_asia",
            "label": "South Asia"
          }
        ],
        "indicator": "trade.derived.exports_region_north_america",
        "why": "India's export map, and how it has spread across regions.",
        "read": "Exports to each world region at benchmark years from 2000. North America and Europe lead, with the Middle East and Asia close behind.",
        "watch": "These are benchmark-year snapshots, not every year; regions are grouped, so single countries (like the US) sit inside the totals."
      },
      {
        "chart": "multiLine",
        "title": "Where India's imports come from, by region",
        "size": "small",
        "beat": "region-imports",
        "unit": "US$ billions",
        "subtitle": "UN Comtrade · merchandise imports by region · benchmark years",
        "series": [
          {
            "indicator": "trade.derived.imports_region_east_se_asia",
            "label": "East & SE Asia"
          },
          {
            "indicator": "trade.derived.imports_region_middle_east",
            "label": "Middle East"
          },
          {
            "indicator": "trade.derived.imports_region_europe",
            "label": "Europe & CIS"
          },
          {
            "indicator": "trade.derived.imports_region_north_america",
            "label": "North America"
          }
        ],
        "indicator": "trade.derived.imports_region_east_se_asia",
        "why": "India's supply map is far more concentrated than its sales map.",
        "read": "Imports by region at benchmark years. East & SE Asia (mainly China) and the Middle East (oil) dominate.",
        "watch": "The Europe & CIS line jumps recently as Russian oil reroutes through it."
      },
      {
        "indicator": "trade.derived.export_partner_top5_share",
        "chart": "line",
        "title": "Is India's customer base concentrated?",
        "size": "small",
        "window": "full",
        "beat": "concentration",
        "why": "Whether India's exports depend on a handful of buyers or are spread widely.",
        "read": "The share of exports going to India's five largest partner countries, at benchmark years.",
        "watch": "A falling share means India has diversified its customers — less exposed to any single market's downturn."
      }
    ]
  },
  {
    "id": "q.econ.trade_services",
    "question": "Is India a services superpower?",
    "priority": "core",
    "series": "trade",
    "indicators": [
      "trade.derived.services_exports",
      "trade.derived.merch_exports",
      "trade.derived.services_export_world_share",
      "trade.derived.merch_export_world_share",
      "trade.derived.services_other_commercial"
    ],
    "core": [
      "trade.derived.services_exports",
      "trade.derived.merch_exports",
      "trade.derived.services_export_world_share",
      "trade.derived.merch_export_world_share",
      "trade.derived.services_other_commercial"
    ],
    "context": [
      "trade.derived.services_exports",
      "trade.derived.merch_exports",
      "trade.derived.services_export_world_share",
      "trade.derived.merch_export_world_share",
      "trade.derived.services_other_commercial",
      "trade.derived.services_travel",
      "trade.derived.services_transport",
      "trade.derived.services_share_of_exports",
      "trade.wb.ict_service_exports_share",
      "trade.derived.services_exports_chn",
      "trade.derived.services_exports_kor",
      "trade.derived.services_exports_phl"
    ],
    "visualPlan": [
      {
        "chart": "multiLine",
        "title": "India's two export engines",
        "size": "feature",
        "beat": "goods-vs-services",
        "unit": "US$ billions",
        "subtitle": "WTO · goods vs commercial-services exports · current US$",
        "series": [
          {
            "indicator": "trade.derived.merch_exports",
            "label": "Goods"
          },
          {
            "indicator": "trade.derived.services_exports",
            "label": "Services"
          }
        ],
        "indicator": "trade.derived.services_exports",
        "why": "India's services exports have grown into a rival of its goods exports — unusual for a developing economy.",
        "read": "Goods exports and commercial-services exports side by side, in current dollars.",
        "watch": "Services here exclude government; the gap between the two lines is far smaller for India than for most peers."
      },
      {
        "chart": "latestBars",
        "title": "India punches far harder in services",
        "size": "feature",
        "beat": "share-comparison",
        "unit": "% of world exports",
        "subtitle": "WTO · India's share of world exports, latest year",
        "series": [
          {
            "indicator": "trade.derived.merch_export_world_share",
            "label": "Goods"
          },
          {
            "indicator": "trade.derived.services_export_world_share",
            "label": "Services"
          }
        ],
        "indicator": "trade.derived.services_export_world_share",
        "why": "The single most important fact about India's trade: it matters more to the world in services than in goods.",
        "read": "India's share of world exports — goods versus commercial services — at the latest year.",
        "watch": "The services share is more than double the goods share. This is India's genuine global edge."
      },
      {
        "chart": "multiLine",
        "title": "Inside India's services exports",
        "size": "feature",
        "beat": "services-composition",
        "unit": "US$ billions",
        "subtitle": "WTO · commercial-services exports by category · current US$",
        "series": [
          {
            "indicator": "trade.derived.services_other_commercial",
            "label": "Other commercial (incl. IT)"
          },
          {
            "indicator": "trade.derived.services_travel",
            "label": "Travel"
          },
          {
            "indicator": "trade.derived.services_transport",
            "label": "Transport"
          }
        ],
        "indicator": "trade.derived.services_other_commercial",
        "why": "Services exports are overwhelmingly one thing: software and business services.",
        "read": "Three categories of services exports. 'Other commercial services' — which holds IT and software — dwarfs travel and transport.",
        "watch": "WTO's category bundles IT with other business services, so it is broader than 'software exports' alone."
      },
      {
        "indicator": "trade.derived.services_share_of_exports",
        "chart": "line",
        "title": "Services keep gaining share",
        "size": "small",
        "window": "full",
        "beat": "services-share",
        "why": "The long shift toward services in what India sells the world.",
        "read": "Commercial services as a share of India's total goods-plus-services exports.",
        "watch": "A rising share reflects both fast services growth and the relative ceiling on goods exports."
      },
      {
        "indicator": "trade.wb.ict_service_exports_share",
        "chart": "line",
        "title": "How IT-heavy India's services are",
        "size": "small",
        "window": "full",
        "beat": "ict",
        "why": "A second source confirming the software story.",
        "read": "ICT services as a share of India's total services exports, from World Bank balance-of-payments data.",
        "watch": "Different source and definition from the WTO chart above, which is why the levels differ — but the message agrees."
      },
      {
        "chart": "multiLine",
        "title": "India among services exporters",
        "size": "small",
        "beat": "services-peers",
        "unit": "US$ billions",
        "subtitle": "WTO · commercial-services exports · current US$",
        "series": [
          {
            "indicator": "trade.derived.services_exports",
            "label": "India"
          },
          {
            "indicator": "trade.derived.services_exports_chn",
            "label": "China"
          },
          {
            "indicator": "trade.derived.services_exports_kor",
            "label": "South Korea"
          },
          {
            "indicator": "trade.derived.services_exports_phl",
            "label": "Philippines"
          }
        ],
        "indicator": "trade.derived.services_exports",
        "why": "Where India ranks among the world's services-export powers.",
        "read": "India's commercial-services exports against China, South Korea and the Philippines.",
        "watch": "India trails only China among these — and unlike Korea, services are a bigger global strength for India than goods."
      }
    ]
  },
  {
    "id": "q.econ.trade_competitiveness",
    "question": "How competitive is India's trade with the world?",
    "priority": "core",
    "series": "trade",
    "indicators": [
      "trade.derived.terms_of_trade",
      "trade.derived.merch_export_share_ind",
      "trade.derived.merch_export_share_chn",
      "trade.derived.merch_export_share_kor",
      "trade.derived.merch_export_share_vnm"
    ],
    "core": [
      "trade.derived.terms_of_trade",
      "trade.derived.merch_export_share_ind",
      "trade.derived.merch_export_share_chn",
      "trade.derived.merch_export_share_kor",
      "trade.derived.merch_export_share_vnm"
    ],
    "context": [
      "trade.derived.terms_of_trade",
      "trade.derived.merch_export_share_ind",
      "trade.derived.merch_export_share_chn",
      "trade.derived.merch_export_share_kor",
      "trade.derived.merch_export_share_vnm",
      "trade.derived.merch_export_share_tha",
      "compare.exports_gdp.in",
      "compare.exports_gdp.vnm",
      "compare.exports_gdp.kor",
      "compare.exports_gdp.chn",
      "compare.exports_gdp.wld",
      "trade.derived.tariff_ind",
      "trade.derived.tariff_vnm",
      "trade.derived.tariff_chn",
      "trade.derived.tariff_kor",
      "trade.derived.tariff_usa",
      "trade.derived.rca_textiles",
      "trade.derived.rca_clothing",
      "trade.derived.rca_iron_steel",
      "trade.derived.rca_pharma",
      "trade.derived.rca_fuels",
      "trade.derived.rca_chemicals",
      "trade.derived.rca_agriculture",
      "trade.derived.rca_machinery",
      "trade.derived.rca_office_telecom",
      "trade.derived.rca_automotive",
      "trade.wits.tariff_effective",
      "trade.wits.tariff_mfn",
      "trade.atlas.eci",
      "trade.atlas.eci_kor",
      "trade.atlas.eci_chn",
      "trade.atlas.eci_tha",
      "trade.atlas.eci_vnm",
      "trade.atlas.eci_rank",
      "trade.tiva.fva_share",
      "trade.tiva.dva_share",
      "trade.tiva.fwd_participation",
      "trade.unctad.lsci",
      "trade.unctad.lsci_chn",
      "trade.unctad.lsci_sgp",
      "trade.derived.merch_exports_ind",
      "trade.derived.merch_exports_chn",
      "trade.derived.merch_exports_kor",
      "trade.derived.merch_exports_vnm",
      "trade.derived.merch_exports_tha",
      "trade.derived.merch_exports_bgd",
      "trade.derived.tariff_mfn_all",
      "trade.derived.tariff_mfn_agri",
      "trade.derived.tariff_mfn_nonagri",
      "trade.derived.merch_import_world_share",
      "trade.wb.high_tech_exports_share"
    ],
    "visualPlan": [
      {
        "indicator": "trade.derived.terms_of_trade",
        "chart": "line",
        "title": "India's terms of trade",
        "size": "small",
        "window": "full",
        "beat": "terms-of-trade",
        "why": "Whether India gets more or less for what it sells, relative to what it buys.",
        "read": "Export prices divided by import prices, rebased to 2015. Above 100 means exports buy more imports than in 2015.",
        "watch": "As a big oil importer, India's terms of trade fall when crude prices rise — a hidden squeeze on the trade bill."
      },
      {
        "chart": "multiLine",
        "title": "The Asian divergence: shares of world exports",
        "size": "feature",
        "beat": "divergence",
        "unit": "% of world exports",
        "fromYear": 1990,
        "subtitle": "WTO · share of world merchandise exports since 1990",
        "series": [
          {
            "indicator": "trade.derived.merch_export_share_chn",
            "label": "China"
          },
          {
            "indicator": "trade.derived.merch_export_share_kor",
            "label": "South Korea"
          },
          {
            "indicator": "trade.derived.merch_export_share_ind",
            "label": "India"
          },
          {
            "indicator": "trade.derived.merch_export_share_vnm",
            "label": "Viet Nam"
          },
          {
            "indicator": "trade.derived.merch_export_share_tha",
            "label": "Thailand"
          }
        ],
        "indicator": "trade.derived.merch_export_share_ind",
        "why": "The defining comparison: economies that began near India's trajectory and pulled away.",
        "read": "Each line is that country's share of world merchandise exports since 1990. In 1990 India, China, Korea and Thailand were within striking distance; Vietnam was nothing.",
        "watch": "China and Vietnam rocketed, Korea held a lead — India rose only modestly. Same starting line, very different finish."
      },
      {
        "chart": "multiLine",
        "title": "How open, India vs Asian peers",
        "size": "small",
        "beat": "openness-compare",
        "unit": "% of GDP",
        "fromYear": 1990,
        "subtitle": "World Bank · exports of goods & services as % of GDP",
        "series": [
          {
            "indicator": "compare.exports_gdp.vnm",
            "label": "Vietnam"
          },
          {
            "indicator": "compare.exports_gdp.kor",
            "label": "South Korea"
          },
          {
            "indicator": "compare.exports_gdp.chn",
            "label": "China"
          },
          {
            "indicator": "compare.exports_gdp.in",
            "label": "India"
          },
          {
            "indicator": "compare.exports_gdp.wld",
            "label": "World"
          }
        ],
        "indicator": "compare.exports_gdp.in",
        "why": "Export-led economies bet their whole growth model on trade; India did so far less.",
        "read": "Exports as a share of GDP. Vietnam exceeds 90%; India sits well below the world average.",
        "watch": "A high ratio means exports drive growth; India's lower ratio reflects a more domestically-driven economy."
      },
      {
        "chart": "multiLine",
        "title": "Tariff walls: India vs peers",
        "size": "small",
        "beat": "tariff-compare",
        "unit": "% (simple average)",
        "subtitle": "WTO · MFN applied tariff, simple average",
        "series": [
          {
            "indicator": "trade.derived.tariff_ind",
            "label": "India"
          },
          {
            "indicator": "trade.derived.tariff_vnm",
            "label": "Viet Nam"
          },
          {
            "indicator": "trade.derived.tariff_chn",
            "label": "China"
          },
          {
            "indicator": "trade.derived.tariff_kor",
            "label": "South Korea"
          },
          {
            "indicator": "trade.derived.tariff_usa",
            "label": "United States"
          }
        ],
        "indicator": "trade.derived.tariff_ind",
        "why": "Part of why India trades less: it is one of the more protected large economies.",
        "read": "Average import tariffs for India and peers. India's bars sit consistently among the highest.",
        "watch": "Korea and China lowered tariffs as they industrialised; India's remain comparatively high."
      },
      {
        "chart": "latestBars",
        "title": "What India is unusually good at exporting",
        "size": "feature",
        "beat": "rca",
        "unit": "RCA index (>1 = specialised)",
        "subtitle": "WTO · revealed comparative advantage · latest year",
        "series": [
          {
            "indicator": "trade.derived.rca_textiles",
            "label": "Textiles"
          },
          {
            "indicator": "trade.derived.rca_clothing",
            "label": "Clothing"
          },
          {
            "indicator": "trade.derived.rca_iron_steel",
            "label": "Iron & steel"
          },
          {
            "indicator": "trade.derived.rca_pharma",
            "label": "Pharmaceuticals"
          },
          {
            "indicator": "trade.derived.rca_fuels",
            "label": "Fuels"
          },
          {
            "indicator": "trade.derived.rca_chemicals",
            "label": "Chemicals"
          },
          {
            "indicator": "trade.derived.rca_agriculture",
            "label": "Agriculture"
          },
          {
            "indicator": "trade.derived.rca_machinery",
            "label": "Machinery & transport"
          },
          {
            "indicator": "trade.derived.rca_office_telecom",
            "label": "Office & telecom"
          },
          {
            "indicator": "trade.derived.rca_automotive",
            "label": "Automotive"
          }
        ],
        "indicator": "trade.derived.rca_textiles",
        "why": "What India punches above its weight in — and where it is a global laggard.",
        "read": "Revealed comparative advantage: above 1 means India is more specialised in that product than the world average. Textiles, clothing, pharma and chemicals lead.",
        "watch": "India scores below 1 in machinery, electronics and automotive — exactly the high-value goods that dominate world trade."
      },
      {
        "chart": "multiLine",
        "title": "How much India's trade deals cut tariffs",
        "size": "small",
        "beat": "preferential",
        "unit": "% (simple average)",
        "subtitle": "WITS · MFN vs effectively applied tariff",
        "series": [
          {
            "indicator": "trade.wits.tariff_mfn",
            "label": "MFN applied"
          },
          {
            "indicator": "trade.wits.tariff_effective",
            "label": "Effectively applied"
          }
        ],
        "indicator": "trade.wits.tariff_effective",
        "why": "The headline tariff overstates what imports actually pay, because of trade deals and exemptions.",
        "read": "Two lines: the standard MFN tariff and the rate actually applied after preferences. The gap is the preferential effect.",
        "watch": "Both fell dramatically from 1990s peaks; the gap shows how much India's FTAs and exemptions lower the real tariff."
      },
      {
        "chart": "multiLine",
        "title": "How complex is India's export economy?",
        "size": "feature",
        "beat": "complexity",
        "unit": "Economic Complexity Index",
        "fromYear": 1995,
        "subtitle": "Harvard Growth Lab · Economic Complexity Index (HS92)",
        "series": [
          {
            "indicator": "trade.atlas.eci_kor",
            "label": "South Korea"
          },
          {
            "indicator": "trade.atlas.eci_chn",
            "label": "China"
          },
          {
            "indicator": "trade.atlas.eci_tha",
            "label": "Thailand"
          },
          {
            "indicator": "trade.atlas.eci",
            "label": "India"
          },
          {
            "indicator": "trade.atlas.eci_vnm",
            "label": "Viet Nam"
          }
        ],
        "indicator": "trade.atlas.eci",
        "why": "Complexity measures how much know-how is embedded in what a country exports — a strong predictor of future growth.",
        "read": "The Economic Complexity Index over time. Higher means a more diverse, sophisticated export basket.",
        "watch": "India sits well below Korea and China and is being caught by Viet Nam — its exports are less complex than its size suggests."
      },
      {
        "indicator": "trade.atlas.eci_rank",
        "chart": "line",
        "title": "India's economic complexity rank",
        "size": "small",
        "window": "full",
        "beat": "complexity-rank",
        "why": "Where India places among all countries on export sophistication.",
        "read": "India's global rank on the Economic Complexity Index (lower is better).",
        "watch": "India hovers in the low-40s out of ~130 — respectable, but it has barely improved in two decades."
      },
      {
        "chart": "multiLine",
        "title": "How much of India's exports is really Indian?",
        "size": "feature",
        "beat": "value-added",
        "unit": "% of gross exports",
        "subtitle": "OECD TiVA · value-added content of gross exports",
        "series": [
          {
            "indicator": "trade.tiva.dva_share",
            "label": "Domestic value added"
          },
          {
            "indicator": "trade.tiva.fva_share",
            "label": "Foreign value added"
          }
        ],
        "indicator": "trade.tiva.fva_share",
        "why": "Modern exports are assembled from imported inputs; this splits out how much value is genuinely domestic.",
        "read": "Domestic vs foreign value-added as a share of India's gross exports. The two always sum to 100%.",
        "watch": "The foreign share roughly doubled since the 1990s — India's exports increasingly embed imported components and energy."
      },
      {
        "indicator": "trade.tiva.fwd_participation",
        "chart": "line",
        "title": "India in global value chains",
        "size": "small",
        "window": "full",
        "beat": "gvc",
        "why": "How much India feeds its own value into others' exports — forward participation in global value chains.",
        "read": "Domestic value added in intermediate exports, as a share of gross exports.",
        "watch": "A higher share means India is more of a supplier of inputs to other countries' production."
      },
      {
        "chart": "multiLine",
        "title": "The plumbing: India's shipping connectivity",
        "size": "small",
        "beat": "shipping",
        "unit": "index (Q1 2023 = 100)",
        "subtitle": "UNCTAD · Liner Shipping Connectivity Index",
        "series": [
          {
            "indicator": "trade.unctad.lsci_chn",
            "label": "China"
          },
          {
            "indicator": "trade.unctad.lsci_sgp",
            "label": "Singapore"
          },
          {
            "indicator": "trade.unctad.lsci",
            "label": "India"
          }
        ],
        "indicator": "trade.unctad.lsci",
        "why": "Trade needs ships; this measures how well-connected a country's ports are to global shipping networks.",
        "read": "The Liner Shipping Connectivity Index over time. India's connectivity has nearly doubled since 2006.",
        "watch": "India has climbed to a global rank near 9, but still trails hubs like Singapore and China by a wide margin."
      },
      {
        "chart": "multiLine",
        "title": "India among manufacturing peers",
        "size": "feature",
        "beat": "goods-peers",
        "unit": "US$ billions",
        "subtitle": "WTO · merchandise exports · current US$",
        "series": [
          {
            "indicator": "trade.derived.merch_exports_chn",
            "label": "China"
          },
          {
            "indicator": "trade.derived.merch_exports_kor",
            "label": "South Korea"
          },
          {
            "indicator": "trade.derived.merch_exports_ind",
            "label": "India"
          },
          {
            "indicator": "trade.derived.merch_exports_vnm",
            "label": "Viet Nam"
          },
          {
            "indicator": "trade.derived.merch_exports_tha",
            "label": "Thailand"
          },
          {
            "indicator": "trade.derived.merch_exports_bgd",
            "label": "Bangladesh"
          }
        ],
        "indicator": "trade.derived.merch_exports_ind",
        "why": "How India's goods exports compare with its Asian manufacturing rivals.",
        "read": "Merchandise exports for India and peers. China is in a league of its own; South Korea — once poorer than India — and Viet Nam now rival or exceed it.",
        "watch": "Viet Nam, with a fraction of India's population, exports almost as much in goods — a pointed comparison."
      },
      {
        "chart": "multiLine",
        "title": "India's import tariffs",
        "size": "small",
        "beat": "tariffs",
        "unit": "% (simple average)",
        "subtitle": "WTO · MFN applied tariff, simple average",
        "series": [
          {
            "indicator": "trade.derived.tariff_mfn_all",
            "label": "All products"
          },
          {
            "indicator": "trade.derived.tariff_mfn_agri",
            "label": "Agriculture"
          },
          {
            "indicator": "trade.derived.tariff_mfn_nonagri",
            "label": "Non-agriculture"
          }
        ],
        "indicator": "trade.derived.tariff_mfn_all",
        "why": "How protected India's market is — the policy backdrop to its trade.",
        "read": "India's most-favoured-nation applied tariffs, averaged across products. Farm goods are taxed far more heavily.",
        "watch": "Simple averages weight every tariff line equally; the tax actually collected on trade can look different."
      },
      {
        "indicator": "trade.derived.merch_import_world_share",
        "chart": "line",
        "title": "India as a global buyer",
        "size": "small",
        "window": "full",
        "beat": "import-share",
        "why": "India's weight in world trade as a customer, not just a seller.",
        "read": "India's merchandise imports as a share of all world merchandise imports.",
        "watch": "India's import share slightly exceeds its export share — the mirror image of its goods deficit."
      },
      {
        "indicator": "trade.wb.high_tech_exports_share",
        "chart": "line",
        "title": "How high-tech India's exports are",
        "size": "small",
        "window": "full",
        "beat": "high-tech",
        "why": "The sophistication of India's manufactured exports.",
        "read": "High-technology goods as a share of India's manufactured exports.",
        "watch": "This covers goods only — it misses India's software strength, which shows up in services, not merchandise."
      }
    ]
  },
  {
    id: "q.econ.income_tax",
    question: "Who actually pays income tax in India?",
    priority: "core",
    indicators: ["tax.itr.zero_tax_share", "tax.itr.returns_total"],
    core: ["tax.itr.zero_tax_share", "tax.itr.returns_total"],
    context: [
      "tax.policy.nil_tax_ceiling",
      "tax.itr.returns_paying",
      "tax.itr.income_share_top1cr",
      "tax.itr.tax_share_top1cr",
      "tax.itr.tax_concentration",
      "tax.collect.personal",
      "tax.collect.corporate",
      "tax.direct_share_of_total",
      "tax.cost_of_collection",
      "tax.income.salary",
      "tax.income.business",
      "tax.income.ltcg",
      "tax.intl.tax_to_gdp",
      "tax.intl.pit_to_gdp"
    ],
    visualPlan: [
      {
        indicator: "tax.itr.zero_tax_share",
        chart: "line",
        title: "Most filers owe nothing",
        size: "hero",
        window: "full",
        beat: "level",
        unit: "% of returns",
        subtitle: "CBDT Income Tax Return Statistics · assessment year 2012-13 to 2023-24",
        why: "The single most surprising fact: filing a return and paying tax are very different things.",
        read: "Each point is the share of all analysed returns that ended the year with zero tax to pay.",
        watch: "The jump after AY2019-20 is the ₹5-lakh rebate (Section 87A), not a change in behaviour."
      },
      {
        indicator: "tax.policy.nil_tax_ceiling",
        chart: "line",
        title: "The income you can earn before paying any tax",
        size: "feature",
        window: "full",
        beat: "policy",
        unit: "₹ lakh",
        subtitle: "Section 87A rebate + basic exemption history · by assessment year · general individual, most favourable regime",
        why: "The zero-tax majority is engineered by policy: Parliament keeps lifting the income at which tax becomes nil.",
        read: "Each step is the total income up to which an individual owes no tax that year.",
        watch: "It jumped to ₹5 lakh (2019), then ₹7 lakh (2023), then ₹12 lakh (2025) — so the zero-tax share is set to climb further beyond our data."
      },
      {
        indicator: "tax.itr.returns_total",
        chart: "multiLine",
        title: "Returns filed vs returns that pay",
        size: "feature",
        beat: "gap",
        unit: "returns",
        subtitle: "CBDT ITR Statistics · assessment year",
        series: [
          { indicator: "tax.itr.returns_total", label: "Returns filed" },
          { indicator: "tax.itr.returns_paying", label: "Returns that pay any tax" }
        ],
        why: "The true taxpaying base is the lower line — about 3 crore, not the headline ~8 crore filers.",
        read: "Top line: all returns analysed. Bottom line: those with any tax payable.",
        watch: "The gap is the zero-tax majority; it widened sharply after the 2019 rebate."
      },
      {
        indicator: "tax.itr.tax_concentration",
        chart: "tableBars",
        title: "0.1% of filers pay most of the income tax",
        size: "feature",
        beat: "concentration",
        unit: "% of all income tax",
        subtitle: "CBDT ITR Statistics · AY2023-24 · how every rupee of income tax splits",
        why: "Income tax in India rests on a needle point: a tiny group at the top pays most of it.",
        read: "One bar split in two: the left part is the share of all income tax paid by the ~91,000 returns that each owed over ₹1 crore; the right is everyone else who pays, combined.",
        watch: "That ~91,000 returns is just 0.1% of all filers, yet they pay about 58% of the total."
      },
      {
        indicator: "tax.collect.personal",
        chart: "multiLine",
        title: "Individuals now out-pay companies",
        size: "feature",
        beat: "crossover",
        unit: "₹ crore",
        subtitle: "CBDT Time-Series · financial year · ₹ crore",
        fromYear: 2000,
        series: [
          { indicator: "tax.collect.personal", label: "Personal (non-corporate) tax" },
          { indicator: "tax.collect.corporate", label: "Corporate tax" }
        ],
        why: "The quiet structural shift: the personal income tax has overtaken corporate tax.",
        read: "Annual direct-tax collection, split into corporate and non-corporate.",
        watch: "The lines crossed around FY2020-21; the personal-tax lead is now over ₹2.5 lakh crore."
      },
      {
        indicator: "tax.income.salary",
        chart: "multiLine",
        title: "How individuals' income is earned",
        size: "feature",
        beat: "composition",
        unit: "₹ crore",
        subtitle: "CBDT ITR Statistics · individual taxpayers · income by source · assessment year",
        series: [
          { indicator: "tax.income.salary", label: "Salary income" },
          { indicator: "tax.income.business", label: "Business income" },
          { indicator: "tax.income.ltcg", label: "Long-term capital gains" }
        ],
        why: "For individual taxpayers, where does the declared income actually come from?",
        read: "Income declared by individuals under each head, by year (excludes companies and other entities).",
        watch: "Salary is the biggest source for individuals; their capital gains grew about 9× in a decade — the financialisation story."
      },
      {
        indicator: "tax.direct_share_of_total",
        chart: "line",
        title: "The system tilted toward direct taxes",
        size: "small",
        window: "full",
        beat: "progressivity",
        unit: "% of total taxes",
        subtitle: "CBDT Time-Series · direct as % of central taxes · financial year",
        why: "Direct taxes (on income) are more progressive than indirect taxes (on spending).",
        read: "Direct taxes as a share of all central tax revenue.",
        watch: "It rose from ~36% in 2000-01 to ~59% now, with a COVID-year dip."
      },
      {
        indicator: "tax.cost_of_collection",
        chart: "line",
        title: "Among the cheapest tax systems to run",
        size: "small",
        window: "full",
        beat: "efficiency",
        unit: "% of collection",
        subtitle: "CBDT Time-Series · cost of collection · financial year",
        why: "How much it costs the state to collect ₹100 of direct tax.",
        read: "Total department expenditure as a percentage of direct-tax collected.",
        watch: "It fell from 1.36% in 2000-01 to 0.41% — world-class efficiency."
      },
      {
        indicator: "tax.intl.tax_to_gdp",
        chart: "tableBars",
        title: "India's tax-to-GDP is mid-low",
        size: "feature",
        beat: "comparison",
        unit: "% of GDP",
        subtitle: "UNU-WIDER / ICTD · general government, incl. social contributions · latest year",
        why: "How much of the economy the state collects in tax, versus peers.",
        read: "Total tax revenue as a share of GDP, India against a peer set.",
        watch: "India (~17%) sits below upper-middle peers and far below rich economies."
      },
      {
        indicator: "tax.intl.pit_to_gdp",
        chart: "tableBars",
        title: "Personal income tax: a narrow base",
        size: "feature",
        beat: "comparison",
        unit: "% of GDP",
        subtitle: "OECD Revenue Statistics; India from CBDT · personal income tax · % of GDP",
        why: "The sharpest cross-country cut: how much personal income tax each economy raises.",
        read: "Personal income tax as a share of GDP, India against OECD and Asian peers.",
        watch: "India's ~3.7% beats the Asia-Pacific average but is less than half the OECD average (8.2%)."
      }
    ]
  },
  {
    id: "q.climate.el_nino_india",
    slug: "what-el-nino-does-to-india",
    question: "What does El Nino do to India?",
    priority: "core",
    indicators: ["climate.el_nino.imd_monsoon_departure_1901_2025", "climate.el_nino.phase_rain_summary", "climate.el_nino.bad_monsoon_frequency"],
    core: ["climate.el_nino.imd_monsoon_departure_1901_2025", "climate.el_nino.phase_rain_summary", "climate.el_nino.bad_monsoon_frequency"],
    context: [
      "climate.el_nino.monsoon_departure_1950_2025",
      "climate.el_nino.oni_monsoon_mean",
      "climate.el_nino.dmi_jjas_mean",
      "climate.el_nino.worst_years",
      "climate.el_nino.exceptions",
      "climate.el_nino.definition_sensitivity",
      "climate.el_nino.enso_monsoon_rolling_corr",
      "climate.el_nino.enso_iod_matrix",
      "climate.el_nino.oni_rain_scatter",
      "climate.el_nino.regional_sensitivity",
      "climate.el_nino.subseasonal_composite",
      "climate.el_nino.region_all_india",
      "climate.el_nino.region_northwest_india",
      "climate.el_nino.region_central_india",
      "climate.el_nino.region_south_peninsula",
      "climate.el_nino.region_east_northeast_india",
      "agriculture.el_nino.rainfall_crop_correlations",
      "agriculture.el_nino.rice_yield_anomaly_state",
      "agriculture.el_nino.irrigation_yield_split",
      "agriculture.el_nino.crop_yield_sensitivity",
      "agriculture.el_nino.crop_baseline_2025_26",
      "econ.el_nino.agri_gva_growth_by_phase",
      "econ.el_nino.agri_gva_share",
      "work.employment_agriculture",
      "prices.el_nino.food_wpi_postmonsoon",
      "prices.el_nino.food_wpi_components",
      "prices.cpi.inflation_annual_worldbank",
      "prices.el_nino.food_wpi_annual",
      "prices.el_nino.food_cpi_annual",
      "prices.el_nino.food_inflation_cases"
    ],
    primer: {
      kicker: "Plain English first",
      lead: "El Nino is a warming of the central and eastern Pacific Ocean that recurs every few years. Through it, an ocean thousands of kilometres away can nudge how much rain falls on an Indian field. It works by weakening the winds and rising air that pull the June-September monsoon inland, so the rains tend to come lighter. That matters because the monsoon delivers about 70% of India's annual rain, fills the reservoirs and wells, decides the kharif crop, and sets roughly two in five Indians' incomes. When it falls short, sowing is delayed, wells and dams run low, farm wages dry up and food prices can climb; when it overshoots, floods and waterlogging can ruin crops just as badly. But El Nino is a risk signal, not a verdict - the Indian Ocean, the timing of the rain and where it lands all get a vote.",
      myths: [
        { myth: "El Nino always means drought in India.", reality: "No. It raises the odds of a weak monsoon, but 11 of 26 El Nino monsoons since 1950 still finished above normal. And a small national shortfall is not a drought: IMD calls a monsoon normal within about 10% of the long-period average, and only labels it deficient past minus 10%. The danger is the tail - the El Nino years that breach that line." },
        { myth: "One all-India rainfall number tells the whole story.", reality: "No. The same national figure can hide a wheat-belt drought, a flooded coast, a dry June at sowing, or a price spike in pulses while cereals stay calm. Timing, region, irrigation, stocks and policy decide who actually gets hurt." }
      ]
    },
    visualPlan: [
      // ACT 1 - the long record, before El Nino enters the story
      { indicator: "climate.el_nino.imd_monsoon_departure_1901_2025", chart: "stripes", title: "A century and a quarter of monsoons that never sit still", subtitle: "IMD all-India June-September rainfall departure · 1901-2025", unit: "% rainfall departure", size: "hero", beat: "climate-history", why: "Before El Nino enters the story, see the raw material: every monsoon since 1901, with no two alike.", read: "Each vertical stripe is one monsoon. Deep blue years had a big rain shortfall; coral years were wetter than normal. The eye should land on how jumpy the record is.", watch: "This is the national June-September total only. It hides where the rain fell, when it fell, and the floods and dry spells inside a single season." },
      { indicator: "climate.el_nino.monsoon_departure_1950_2025", chart: "line", title: "The same record as a line, so the swings are easy to follow", subtitle: "IMD all-India monsoon rainfall departure · 1950-2025", unit: "% rainfall departure", size: "feature", beat: "climate-history", why: "A line makes the booms, busts and recoveries clearer than stripes, and sets up the El Nino overlay that follows.", read: "Anything below the zero line is a deficient monsoon; above it is a surplus. Notice how rarely two severe droughts come back to back.", watch: "A near-zero national number can still sit on top of a regional drought. The average is a starting point, not the whole picture." },

      // ACT 2 - the honest answer: risk, not destiny
      { indicator: "climate.el_nino.phase_rain_summary", chart: "tableBars", title: "On average, El Nino monsoons are the driest", subtitle: "Average rainfall departure by Pacific state · all-India · 1950-2025", unit: "% rainfall departure", size: "feature", beat: "answer", why: "The shortest honest answer to the question: sort every monsoon by the Pacific's state and average the rain.", read: "El Nino years averaged a rainfall deficit, La Nina years a surplus, and neutral years sat in between.", watch: "An average is not a forecast. Some El Nino years were wet and some La Nina years were dry - the spread matters as much as the middle." },
      { indicator: "climate.el_nino.bad_monsoon_frequency", chart: "tableBars", title: "El Nino roughly doubles the odds of a weak monsoon", subtitle: "Share of each Pacific state's years that finished below normal · 1950-2025", unit: "% of phase years", size: "feature", beat: "risk", why: "Risk is a frequency, not a slogan - so count how often each Pacific state actually produced a weak monsoon.", read: "Each bar is the share of that phase's years that ended below normal, more than 5% below, or more than 10% below. The El Nino bars stand well above the rest.", watch: "The groups are different sizes - 26 El Nino, 27 neutral and 23 La Nina monsoons - so read shares, not raw counts." },
      { indicator: "climate.el_nino.definition_sensitivity", chart: "tableBars", title: "How you define 'an El Nino year' changes the headline", subtitle: "Average all-India rainfall under three El Nino definitions · 1950-2025", unit: "% mean rainfall departure", size: "feature", beat: "method", why: "Whether El Nino looks mild or menacing depends on how strictly you count it - a choice most coverage hides. We show three definitions at once.", read: "Counting only the monsoons when the Pacific stayed in El Nino all season doubles the average deficit (to about -7%) versus counting any brush with El Nino (about -3%). Restrict to strong events and it triples (about -12%).", watch: "The reassuring '-3%' figure uses the loosest definition. The El Nino monsoons people actually remember are meaningfully worse than that." },
      { indicator: "climate.el_nino.enso_monsoon_rolling_corr", chart: "line", title: "Has the Pacific's grip on the monsoon loosened?", subtitle: "21-year rolling correlation between Pacific warmth and India's rainfall · centred years 1960-2015", unit: "correlation", size: "feature", beat: "science-debate", why: "Scientists have argued since the late 1990s that the El Nino-monsoon link is fraying. This tracks the link's strength decade by decade instead of asserting it.", read: "A more negative line means a tighter El-Nino-equals-drought bond. It loosened to its weakest around the late 1990s, then tightened again through the 2000s.", watch: "This is a rolling 21-year window, so the most recent points lean on recent decades. A correlation can wobble without the underlying physics disappearing." },

      // ACT 3 - why the rule breaks: the second ocean
      { chart: "multiLine", title: "Two oceans, not one, set the monsoon's odds", subtitle: "Pacific ONI and Indian Ocean Dipole, monsoon-season averages · 1950-2025", unit: "deg C anomaly", size: "feature", beat: "climate-drivers", series: [
        { indicator: "climate.el_nino.oni_monsoon_mean", label: "Pacific warmth (ONI)" },
        { indicator: "climate.el_nino.dmi_jjas_mean", label: "Indian Ocean Dipole (DMI)" }
      ], why: "India does not only watch the Pacific. The Indian Ocean Dipole right next door can push the monsoon the other way.", read: "When the Pacific line (ONI) climbs above zero it is El Nino; when the Indian Ocean line (DMI) climbs it is a positive dipole, which tends to help India's rain.", watch: "The two can pull in opposite directions. 1997 paired a record El Nino with a strong positive dipole - and the monsoon held near normal." },
      { indicator: "climate.el_nino.enso_iod_matrix", chart: "tableBars", title: "Does the Indian Ocean rescue an El Nino monsoon?", subtitle: "Average rainfall in El Nino years, split by the Indian Ocean Dipole · 1950-2025", unit: "% mean rainfall departure", size: "feature", beat: "climate-drivers", why: "If the second ocean really matters, El Nino years with a friendly Indian Ocean should look different from those without.", read: "El Nino monsoons that came with a positive dipole averaged near-normal rain; those without averaged a clear deficit. The La Nina bar at the bottom is there for contrast.", watch: "It is a tilt, not a shield. 1972 was a devastating drought despite a positive dipole, and only a handful of El Nino years had one." },
      { indicator: "climate.el_nino.exceptions", chart: "tableBars", title: "The El Nino years that refused to follow the rule", subtitle: "El Nino monsoons that still finished near-normal or wet · rainfall departure", unit: "% rainfall departure", size: "feature", beat: "caveat", why: "If the article stopped at the drought years it would mislead. These El Nino monsoons came out fine.", read: "Every bar here is an El Nino year that ended near or above normal - living proof the Pacific does not decide the monsoon on its own.", watch: "Do not flip this into false comfort. A friendly Indian Ocean or lucky timing helped, but neither is guaranteed in 2026." },
      { indicator: "climate.el_nino.worst_years", chart: "tableBars", title: "...and the El Nino droughts India still remembers", subtitle: "The deepest all-India rainfall deficits among El Nino monsoons", unit: "% rainfall departure", size: "feature", beat: "history", why: "These are the benchmarks 2026 will be measured against if the season turns.", read: "Each bar is one of the worst El Nino droughts on record - 1972, 2002, 2009, 2015 - against the IMD normal.", watch: "A severe national deficit can still hide very different regional patterns, as the next charts show." },

      // ACT 4 - India does not eat an average: region and timing
      { chart: "linePanels", indicator: "climate.el_nino.region_all_india", title: "Same El Nino, very different Indias", subtitle: "Rainfall departure in El Nino years, by IMD region", unit: "% rainfall departure", size: "feature", beat: "distribution", panels: [
        { label: "All India", series: [{ indicator: "climate.el_nino.region_all_india", label: "All India" }] },
        { label: "Northwest", series: [{ indicator: "climate.el_nino.region_northwest_india", label: "Northwest" }] },
        { label: "Central", series: [{ indicator: "climate.el_nino.region_central_india", label: "Central" }] },
        { label: "South", series: [{ indicator: "climate.el_nino.region_south_peninsula", label: "South" }] },
        { label: "NE India", series: [{ indicator: "climate.el_nino.region_east_northeast_india", label: "NE India" }] }
      ], why: "The national average hides the geography that actually decides crops and incomes.", read: "Each small panel is one region's rainfall in El Nino years. The lines rarely move together.", watch: "These are broad regions, not districts or individual crop belts - the real spread on the ground is even wider." },
      { indicator: "climate.el_nino.regional_sensitivity", chart: "tableBars", title: "El Nino hits the northwest hardest", subtitle: "Average rainfall departure in El Nino monsoons, by region · 17 events", unit: "% rainfall departure", size: "feature", beat: "distribution", why: "Some regions lean on the monsoon far more than others. This ranks who loses the most rain when the Pacific warms.", read: "Northwest India - the wheat-and-pulses belt - averages a 14% shortfall in El Nino monsoons, double the all-India figure.", watch: "Less rain does not translate one-to-one into more harm: irrigation cover and crop choice differ sharply by region." },
      { indicator: "climate.el_nino.subseasonal_composite", chart: "tableBars", title: "When in the season the rain goes missing", subtitle: "Average monthly rainfall departure, El Nino monsoons vs a typical year · all-India", unit: "% rainfall departure", size: "feature", beat: "timing", why: "Timing decides damage: a dry July at sowing hurts more than a dry, post-harvest September. So we split the season by month.", read: "El Nino monsoons are driest at the two ends - a weak June onset and a faltering September - while August tends to hold up best.", watch: "These are averages across many El Nino years; any single year can fail on its own schedule." },
      { indicator: "agriculture.el_nino.rice_yield_anomaly_state", chart: "choropleth", title: "Where El Nino actually cuts the rice harvest", subtitle: "Average kharif rice yield change in El Nino monsoons, by state · ICRISAT district data · 1966-2017", unit: "% yield vs prior 5-year mean", size: "feature", beat: "yield-geography", signed: true, rankLabel: "Rice yields rose", bottomLabel: "Rice yields fell", why: "The rainfall map and the harvest map are not the same picture - this puts El Nino's actual yield mark on the states.", read: "Red states lost rice yield in El Nino years; blue states held or gained. The eastern rainfed belt (Jharkhand, Bihar, Chhattisgarh, Maharashtra) is hit hardest, while irrigated Punjab and Haryana actually rise.", watch: "This is yield, not total output, and ICRISAT covers 20 major farming states; blank states are simply not in the dataset." },
      { indicator: "agriculture.el_nino.irrigation_yield_split", chart: "tableBars", title: "Why the rainfall map is not the yield map", subtitle: "El Nino-year yield vs the crop's own prior 5-year average: irrigated rice vs rainfed coarse cereals, by region · ICRISAT · 1966-2017", unit: "% above or below the recent 5-year normal", size: "feature", beat: "irrigation", why: "The northwest loses the most monsoon rain, yet its rice barely flinches. Splitting an irrigated crop from a rainfed one shows why.", read: "Bars show how far each crop's yield ran above or below its own recent five-year average in El Nino years. In the rain-starved northwest, irrigated rice rose about 7% above its normal while rainfed coarse cereals fell about 12% below theirs.", watch: "Crop mix and irrigation cover differ by region, so this contrast is sharpest in the northwest and muted elsewhere." },
      { indicator: "agriculture.el_nino.crop_yield_sensitivity", chart: "tableBars", title: "Which crops El Nino actually hits", subtitle: "Average El Nino-year yield vs the crop's own prior 5-year normal, all-India · ICRISAT · 1966-2017", unit: "% above or below the crop's recent 5-year normal", size: "feature", beat: "crop-sensitivity", why: "If irrigation is the shield, the damage should sort cleanly by crop. It does.", read: "Each bar is how far that crop's national yield ran from its own recent five-year average in El Nino years. The rainfed kharif crops - groundnut, jowar, bajra, pulses, oilseeds - take the hit, while irrigated and winter crops like wheat, rice and sugarcane are flat or even gain.", watch: "These are national averages; a rainfed crop can still fail badly in one region while the all-India figure looks mild." },

      // ACT 5 - from rain to food: the crop channel
      { indicator: "agriculture.el_nino.rainfall_crop_correlations", chart: "tableBars", title: "Rainfall still shows up in the harvest", subtitle: "Correlation of monsoon rainfall with crop output · DES panel · 1950-51 to 2024-25", unit: "correlation", size: "feature", beat: "mechanism", why: "The monsoon matters because, decades of irrigation later, it is still visible in the crop record.", read: "The taller the bar, the more tightly that crop's output tracks the monsoon. Foodgrains, rice and oilseeds lean on it most; irrigated wheat least.", watch: "Correlation is not causation - technology, sown area, prices, heat and policy all move output too." },
      { indicator: "econ.el_nino.agri_gva_growth_by_phase", chart: "tableBars", title: "Farm output feels the Pacific - but less than you would guess", subtitle: "Average real agriculture GVA growth by Pacific state · RBI national accounts · 1951-2025", unit: "% real GVA growth", size: "feature", beat: "mechanism", why: "If El Nino reaches the wider economy, it should show up in how fast farm output grows. RBI's national accounts let us check.", read: "Farm output grows about twice as fast in La Nina years as in El Nino or neutral ones - the boost from a good monsoon is bigger than the average drag from a bad one.", watch: "This is a national average across all El Nino years, mild ones included; the worst droughts still cut farm output outright." },
      { indicator: "agriculture.el_nino.crop_baseline_2025_26", chart: "tableBars", title: "The food buffer India carries into the 2026 risk season", subtitle: "Production estimates for major crops · UPAg 2025-26 Third Advance Estimates", unit: "lakh tonnes", size: "feature", beat: "current-context", why: "Whether a weak 2026 monsoon becomes a price shock depends partly on the stockpile the country starts with.", read: "Bars show estimated 2025-26 output for the major crops - the supply cushion sitting in front of the next monsoon.", watch: "These are advance estimates, not final numbers, and public stocks matter as much as a single year's harvest." },

      // ACT 6 - from rain to prices, and why the macro stakes have shrunk
      { indicator: "prices.el_nino.food_wpi_postmonsoon", chart: "tableBars", title: "A drought does not automatically mean dearer food", subtitle: "Post-monsoon (Oct-Dec) wholesale food inflation in El Nino years · RBI WPI · 1982-2024", unit: "% food inflation, year-on-year", size: "feature", beat: "prices", why: "The longest food-price record we have - wholesale prices back to 1982 - lets us test the El-Nino-to-inflation link across eight events, not two.", read: "There is no clean rule. 2002 had the worst drought on the chart yet almost no food inflation; 2009's drought pushed it above 16%.", watch: "Prices answer to stocks, imports, global commodity cycles and policy. 1991's spike owed more to a currency crisis than to the monsoon." },
      { indicator: "prices.el_nino.food_wpi_components", chart: "tableBars", title: "After a drought, food prices do not move as one", subtitle: "Post-monsoon wholesale inflation by food group, four El Nino droughts · RBI WPI", unit: "% inflation, year-on-year", size: "feature", beat: "prices", why: "'Food inflation' is really a bundle of separate shocks. Splitting it shows which foods actually carry the pain.", read: "Pulses and onions can spike 40-90% after a drought while cereals barely budge, shielded by huge public grain stocks.", watch: "The same drought year can show falling prices in one food and a price explosion in another - compare 2002 with 2015." },
      { chart: "multiLine", title: "El Nino is one driver of food prices, not the only one", subtitle: "Headline, wholesale-food and retail-food inflation, with El Nino monsoon years shaded · 1960-2025", unit: "% year-on-year", size: "feature", beat: "prices-longview", series: [
        { indicator: "prices.cpi.inflation_annual_worldbank", label: "Headline CPI (World Bank)" },
        { indicator: "prices.el_nino.food_wpi_annual", label: "Wholesale food (WPI)" },
        { indicator: "prices.el_nino.food_cpi_annual", label: "Retail food (CPI)" }
      ], bands: [
        { year: 1963, label: "El Nino 1963" }, { year: 1965, label: "El Nino 1965" }, { year: 1969, label: "El Nino 1969" },
        { year: 1972, label: "El Nino 1972" }, { year: 1982, label: "El Nino 1982" }, { year: 1987, label: "El Nino 1987" },
        { year: 1991, label: "El Nino 1991" }, { year: 1997, label: "El Nino 1997" }, { year: 2002, label: "El Nino 2002" },
        { year: 2004, label: "El Nino 2004" }, { year: 2009, label: "El Nino 2009" }, { year: 2015, label: "El Nino 2015" },
        { year: 2023, label: "El Nino 2023" }
      ], why: "The long view is the honest test of the El Nino-to-prices idea: if the monsoon drove inflation, the spikes would line up with the shaded El Nino years. Mostly they do not.", read: "Red bands mark El Nino monsoons. A few sit under price spikes (2009), but the biggest jumps - 1974's oil shock, 1991's currency crisis, the 2020 and 2022 spikes - owe more to oil, global markets and policy than to the monsoon. Wholesale food (the middle line) is the most monsoon-sensitive, yet even it does not climb in every shaded year.", watch: "Each line starts where its data begins - headline CPI from 1960, wholesale food from 1983, retail food only from 2012 - so the lines have different lengths by design. Wholesale food (WPI) is not the retail price households pay, which is why the retail-food line can sit well below it." },
      { chart: "multiLine", title: "A shrinking share of the economy, but still two in five jobs", subtitle: "Agriculture's share of India's output and of its workforce · 1951-2025", unit: "% share", size: "feature", beat: "macro-context", series: [
        { indicator: "work.employment_agriculture", label: "Share of India's workers" },
        { indicator: "econ.el_nino.agri_gva_share", label: "Share of India's output (GVA)" }
      ], why: "This is the human heart of the monsoon question: how many people a bad rain year can actually reach, set against how little it now moves headline GDP.", read: "Farming has fallen to about a seventh of India's output, so a drought dents GDP far less than it did in 1965. But it still employs roughly two in five working Indians - the gap between the two lines is the monsoon's real human reach.", watch: "The output line is from RBI national accounts; the jobs line is the World Bank's modelled estimate. Both fall over time, but the jobs line stays far higher - which is the point." }
    ]
  },

  {
    id: "q.econ.industrial_policy",
    slug: "india-industrial-policy-surge",
    question: "Has India\u2019s industrial policy surge paid off?",
    priority: "core",
    // Built Jun 2026. Source: World Bank South Asia Economic Update April 2026
    // ("Working with Industrial Policy"). Disclosure: this article draws on the
    // WB SAEU April 2026 report and links to it.
    indicators: [
      "ipp.sa_protective_measures", "ipp.world_total_measures", "ipp.world_protective_measures",
      "ipp.top_countries_protective",
      "ipp.instrument_mix", "ipp.sectors_targeted", "ipp.average_import_duties",
      "ipp.policy_drivers_india",
      "ipp.trade_defense_imports", "ipp.export_incentive_exports",
      "ipp.employment_by_ip_quartile",
      "ipp.fta_consumption_effects", "ipp.fta_income_effects", "ipp.india_tariff_cuts_rca",
      "ipp.tax_revenue", "ipp.customs_clearance_days", "ipp.govt_effectiveness", "ipp.fta_coverage"
    ],
    core: [
      "ipp.sa_protective_measures", "ipp.world_total_measures", "ipp.world_protective_measures",
      "ipp.top_countries_protective",
      "ipp.instrument_mix", "ipp.sectors_targeted", "ipp.average_import_duties",
      "ipp.policy_drivers_india",
      "ipp.trade_defense_imports", "ipp.export_incentive_exports",
      "ipp.employment_by_ip_quartile",
      "ipp.fta_consumption_effects", "ipp.fta_income_effects", "ipp.india_tariff_cuts_rca",
      "ipp.tax_revenue", "ipp.customs_clearance_days", "ipp.govt_effectiveness", "ipp.fta_coverage"
    ],
    context: [],
    visualPlan: [
      { chart: "tableBars", title: "India nearly doubled its protective industrial policy measures", size: "hero", beat: "surge",
        why: "The headline: India went from 125 to 239 protective measures a year, far above any other South Asian country and most EMDEs.",
        read: "Each bar shows the annual average number of new protective industrial policy measures. India nearly doubled between the four years before and after COVID-19.",
        watch: "These are counts of measures, not their size or monetary value. A single import ban and a small subsidy tweak both count as one.",
        series: [{ indicator: "ipp.sa_protective_measures", label: "South Asia" }] },
      { chart: "multiLine", title: "The world is doing it too \u2014 a global protectionist wave", size: "feature", beat: "global-wave", unit: "number of measures", fromYear: 2010,
        subtitle: "Global Trade Alert database via WB SAEU April 2026",
        why: "India is not alone. Industrial policy has surged worldwide since the pandemic, led by advanced economies.",
        read: "Two lines: total industrial policy measures worldwide and protective ones. Both have roughly doubled since the 2010s.",
        watch: "India\u2019s surge is large even against this global trend, but it is swimming with the current, not against it.",
        series: [
          { indicator: "ipp.world_total_measures", label: "Total measures" },
          { indicator: "ipp.world_protective_measures", label: "Protective measures" }
        ] },
      { chart: "tableBars", title: "Where India sits among the big protectionist players", size: "feature", beat: "global-rank",
        why: "India is the 6th most active country globally in protective industrial policy, and 3rd among EMDEs after China and Brazil.",
        read: "The top 10 countries by annual average new protective measures in 2022\u201325. India at 239 sits between Germany (268) and Canada (227).",
        watch: "Advanced economies dominate the top of this list. India is the outlier \u2014 an EMDE at the high table.",
        series: [{ indicator: "ipp.top_countries_protective", label: "Top 10 countries" }] },
      { chart: "tableBars", title: "India\u2019s toolkit: procurement and subsidies, not just tariffs", size: "feature", beat: "instruments",
        why: "India uses a very different mix of industrial policy tools from its South Asian neighbours \u2014 heavy on procurement, lighter on import restrictions.",
        read: "Five instrument categories for each country. India uses 23% procurement measures (versus 0% elsewhere in the region), 30% subsidies, and only 23% import restrictions (versus 78% in Sri Lanka).",
        watch: "This is the distinctive shape of India\u2019s approach: the state as a buyer, not just a tariff-setter.",
        series: [{ indicator: "ipp.instrument_mix", label: "Instrument mix" }] },
      { chart: "tableBars", title: "Who India protects: high-wage sectors and large firms", size: "feature", beat: "who-gets-protected",
        why: "Contrary to the stereotype of protecting sunset industries, India directs more protection at manufacturing sectors with higher wages and larger, more productive firms.",
        read: "Regression results: a 10% increase in manufacturing wages predicts 0.24 more protective measures. A 1 pp increase in import share predicts 0.47 more measures.",
        watch: "These are correlations, not causal proof. They show what characteristics predict more protection, not whether the protection caused those characteristics.",
        series: [{ indicator: "ipp.policy_drivers_india", label: "Policy drivers" }] },
      { chart: "tableBars", title: "Which sectors wear the armour", size: "feature", beat: "sectors",
        why: "Manufacturing gets half of all protective measures. Within manufacturing, food and electronics lead, with electronics rising sharply in the 2020s.",
        read: "Top manufacturing sectors by share of protective IP in South Asia. Food manufacturing (7.5%) still leads, but electronics (6.6%) has surged from near-zero before 2020.",
        watch: "These are SA-wide shares. India dominates the totals, so the pattern broadly reflects India\u2019s priorities. Electronics includes the PLI-supported sectors.",
        series: [{ indicator: "ipp.sectors_targeted", label: "Sectors" }] },
      { chart: "tableBars", title: "The tariff wall: India\u2019s import duties vs the world", size: "feature", beat: "tariffs",
        why: "Even as India opens up through FTAs, its average import duty of about 16% remains among the highest of any large economy.",
        read: "Average applied MFN import duties. India at 15.8% is about double the EMDE median of 8.5%.",
        watch: "This is the simple average, not trade-weighted. It understates effective protection on sensitive products.",
        series: [{ indicator: "ipp.average_import_duties", label: "Import duties" }] },
      { chart: "multiLine", title: "Trade defence cuts imports. Export incentives? Not so much.", size: "hero", beat: "trade-effects",
        subtitle: "WB SAEU April 2026, local projection estimates",
        why: "The policy scorecard: import-restricting measures do reduce imports significantly. Export-promoting measures show no clear effect.",
        read: "Left panel: imports fall about 15% by year 3 after trade defence. Right panel: exports after incentives show no statistically significant increase.",
        watch: "Wide confidence bands on the right panel mean we simply cannot tell if export incentives work.",
        series: [
          { indicator: "ipp.trade_defense_imports", label: "Imports after trade defence" },
          { indicator: "ipp.export_incentive_exports", label: "Exports after export incentives" }
        ] },
      { chart: "tableBars", title: "The jobs paradox: services create jobs but get no protection", size: "feature", beat: "jobs-paradox",
        why: "Manufacturing received half of all IP measures but accounts for only 14% of employment. Services, which generate most new jobs, received almost no targeted protection.",
        read: "Annual employment growth in India: least-protected sectors (mostly services) grew at 0.91%, most-protected at 0.95% \u2014 barely different.",
        watch: "IP quartile groups sectors by how many protective measures they received.",
        series: [{ indicator: "ipp.employment_by_ip_quartile", label: "Employment growth" }] },
      { chart: "tableBars", title: "The hidden tax: tariffs hurt Indian households", size: "feature", beat: "fta-households",
        why: "The proposed FTA tariff cuts with the EU and UK would raise consumption for every Indian household, across all income levels.",
        read: "First-order consumption effects of the India-EU/UK FTA tariff cuts. Rural households gain 0.20\u20130.33%, urban households 0.16\u20130.26%. The poorest rural quintile gains most.",
        watch: "Static first-order effects assuming full pass-through. They do not include longer-term gains from export expansion or FDI.",
        series: [{ indicator: "ipp.fta_consumption_effects", label: "Consumption effects" }] },
      { chart: "tableBars", title: "Real incomes rise too, especially for the poorest", size: "small", beat: "fta-income",
        why: "The same story through income: tariff cuts raise real incomes across all households.",
        read: "Real income effects. Rural Q1 gains 0.24%, urban Q5 gains 0.19%. Every bar is positive.",
        watch: "Real income accounts for both consumption gains and any producer-price losses. Net effect is still positive.",
        series: [{ indicator: "ipp.fta_income_effects", label: "Real income effects" }] },
      { chart: "tableBars", title: "Fiscal space is tight", size: "feature", beat: "fiscal",
        why: "Industrial policy costs money, and India collects about 18% of GDP in tax \u2014 below the EMDE average of 20.4%.",
        read: "Tax revenue as a share of GDP. Only Maldives exceeds the EMDE average among South Asian countries.",
        watch: "The gap between what governments collect and what industrial policy ambitions demand is the fiscal constraint the WB warns about.",
        series: [{ indicator: "ipp.tax_revenue", label: "Tax revenue" }] },
      { chart: "tableBars", title: "Customs clearance: India takes 3\u20134 times longer than EMDE peers", size: "small", beat: "customs",
        why: "Even well-designed industrial policy hits a wall if it takes weeks to clear goods through customs.",
        read: "India: 16 days imports, 20 days exports. EMDE median: about 5 days for both.",
        watch: "Averages for medium firms. Large firms may clear faster; small firms slower.",
        series: [{ indicator: "ipp.customs_clearance_days", label: "Customs clearance days" }] },
      { chart: "tableBars", title: "Government effectiveness: India scores well, but far behind advanced economies", size: "small", beat: "effectiveness",
        why: "India\u2019s government effectiveness ranks in the 68th percentile globally \u2014 good for an EMDE, but the gap to the AE median (88th) is where implementation falls short.",
        read: "Worldwide Governance Indicators percentile rank. India at 68 vs EMDE median 37, AE median 88.",
        watch: "Perception-based index combining survey data on public service quality and policy credibility.",
        series: [{ indicator: "ipp.govt_effectiveness", label: "Government effectiveness" }] },
      { chart: "tableBars", title: "India is also opening up: FTA coverage set to double", size: "feature", beat: "fta-coverage",
        why: "The counterweight: India\u2019s new FTAs with the EU and UK will double preferential market access from 16% to 33% of global GDP.",
        read: "Current FTAs cover 15.5% of global output. With EU/UK deals: 33% \u2014 above China, Turkey and Brazil.",
        watch: "Negotiations concluded means signed but not yet in force. EU deal: Jan 2026; UK CETA: mid-2025.",
        series: [{ indicator: "ipp.fta_coverage", label: "FTA coverage" }] }
    ]
  },

  {
    id: "q.econ.rnd",
    slug: "how-much-india-spends-on-research",
    question: "How much does India spend on research, and is it enough?",
    priority: "core",
    indicators: [
      "rnd.rd_gdp.in", "rnd.rd_gdp.chn", "rnd.rd_gdp.kor", "rnd.rd_gdp.isr",
      "rnd.rd_gdp.usa", "rnd.rd_gdp.jpn", "rnd.rd_gdp.deu", "rnd.rd_gdp.bra",
      "rnd.rd_gdp.zaf", "rnd.rd_gdp.vnm", "rnd.rd_gdp.wld", "rnd.researchers.kor",
      "rnd.researchers.deu", "rnd.researchers.jpn", "rnd.researchers.usa", "rnd.researchers.chn",
      "rnd.researchers.wld", "rnd.researchers.vnm", "rnd.researchers.zaf", "rnd.researchers.in",
      "rnd.in.gerd_inr", "rnd.in.target_2pct", "rnd.in.researchers_per_million", "rnd.in.performer_split",
      "rnd.in.agency_split", "rnd.business_share_compare", "rnd.absolute_ppp", "rnd.returns_by_type",
      "rnd.publications_volume", "rnd.in.patents_resident", "rnd.in.patents_nonresident", "rnd.gii_subranks",
      "rnd.isro_cost", "rnd.budget_utilisation", "rnd.new_funds", "divergence.rnd_gdp.in", "divergence.rnd_gdp.mys", "divergence.rnd_gdp.tha", "divergence.rnd_gdp.vnm", "divergence.rnd_gdp.idn", "divergence.rnd_gdp.pak", "rnd.rd_gdp.fin", "rnd.rd_gdp.sgp"
    ],
    visualPlan: [
      { chart: "multiLine", indicator: "rnd.rd_gdp.in", series: [{ indicator: "rnd.rd_gdp.isr", label: "Israel" }, { indicator: "rnd.rd_gdp.kor", label: "South Korea" }, { indicator: "rnd.rd_gdp.usa", label: "United States" }, { indicator: "rnd.rd_gdp.jpn", label: "Japan" }, { indicator: "rnd.rd_gdp.chn", label: "China" }, { indicator: "rnd.rd_gdp.wld", label: "World average" }, { indicator: "rnd.rd_gdp.in", label: "India" }], size: "hero", unit: "R&D as % of GDP", fromYear: 1996, subtitle: "World Bank / UNESCO \u00b7 gross R&D spending as a share of GDP, 1996 to latest", title: "The world spends very differently on research", why: "The frame for the whole article: India has spent about 0.6% of its economy on research for three decades, while the leaders pulled steadily away.", read: "Each line is a country's R&D spending as a share of GDP over time. India's line runs flat along the bottom; Israel, Korea and China climb.", watch: "This is a share of GDP, not total rupees or dollars, so a smaller research-intensive economy like Israel sits at the top." },
      { chart: "tableBars", indicator: "rnd.returns_by_type", size: "feature", unit: "annual return, % (midpoint of estimates)", subtitle: "Economics literature \u00b7 midpoints of wide ranges, shown to make a point, not as precise measurements", title: "Research pays: the question is who reaps it", why: "Before asking whether India spends enough, it helps to know what research is worth: the measured returns are high.", read: "Bars show the estimated annual return; longer bars mean a higher payoff per rupee spent.", watch: "These are not guaranteed returns for any individual project. They are average estimates from many studies." },
      { chart: "multiLine", indicator: "rnd.rd_gdp.in", series: [{ indicator: "rnd.rd_gdp.in", label: "India" }, { indicator: "rnd.rd_gdp.wld", label: "World average" }, { indicator: "rnd.in.target_2pct", label: "2% target (2013 policy)" }], size: "feature", unit: "R&D as % of GDP", subtitle: "World Bank / UNESCO (India, World) \u00b7 against the 2% of GDP target set in the 2013 STI Policy", title: "India's research spending peaked over a decade ago", why: "India set itself a 2% target in 2013 and has drifted further from it, not closer.", read: "The y-axis is R&D as a percentage of GDP; the x-axis is years. The dashed line is a policy goal, not a measurement.", watch: "Don't think of the target as an actual spending level; it was never reached. Also note that the world average includes India, so the gap for the rest of the world is even larger." },
      { chart: "line", indicator: "rnd.in.gerd_inr", size: "small", unit: "\u20b9 crore", subtitle: "DST / NSTMIS \u00b7 gross expenditure on R&D, current prices \u00b7 fiscal years, latest 2020-21", title: "More rupees, the same thin sliver", why: "In rupees, India's research budget keeps climbing; the catch is that the economy grew just as fast.", read: "The line shows gross R&D spending in \u20b9 crore. See the rise, but remember it doesn't account for GDP growth or inflation.", watch: "Don't mistake the rupee rise for a real increase in research effort relative to the economy." },
      { chart: "tableBars", indicator: "rnd.in.performer_split", size: "small", unit: "% of national R&D spend", subtitle: "DST / NSTMIS \u00b7 who performs India's R&D \u00b7 2020-21", title: "In India, the government still does the research", why: "In most advanced economies business does most of the research; in India the state still dominates.", read: "Each bar is a sector's share of the total R&D performed. Compare the sizes to see the public dominance.", watch: "Performer share is not the same as funder share; some government-performed research may be funded by industry." },
      { chart: "multiLine", indicator: "rnd.in.gerd_business_share", series: [{ indicator: "rnd.in.gerd_government_share", label: "Government bloc" }, { indicator: "rnd.in.gerd_business_share", label: "Business sector" }], size: "feature", unit: "% of national R&D spend", fromYear: 1990, subtitle: "DST / NSTMIS \u00b7 share of gross R&D performed by the government bloc vs business \u00b7 1990-91 to 2020-21", title: "India's private sector never took over", why: "Unlike the rest of the world, India's private sector never came to dominate research; its share rose, peaked around 2012-13, then slipped back.", read: "Two lines that mirror each other and always sum to 100. The business line climbs through the 2000s, tops out near 45% in 2012-13, then falls back below 41%.", watch: "Business here is private plus public-sector industry; the government bloc is central and state government plus higher education." },
      { chart: "tableBars", indicator: "rnd.business_share_compare", size: "small", unit: "% of R&D from business / private sector", subtitle: "OECD / WIPO / NITI Aayog \u00b7 business-enterprise share of R&D \u00b7 India is its private-industry share (DST 2020-21)", title: "Everywhere else, business pays for research", why: "The clearest single diagnosis of India's R&D gap: its private sector barely shows up.", read: "Bars show the percentage of total R&D funded or performed by business. India's short bar highlights the dependence on the state.", watch: "India's figure isn't perfectly comparable to the OECD's, but the pattern is robust." },
      { chart: "tableBars", indicator: "rnd.in.agency_split", size: "small", unit: "% of central-government R&D", subtitle: "DST / NSTMIS \u00b7 central-government R&D by agency \u00b7 2020-21", title: "Where India's public research money goes", why: "The public money that does exist is tilted heavily toward defence, space and atomic energy.", read: "Bars represent each agency's share of central government R&D spending. The top three alone account for more than half.", watch: "This is only central-government R&D, not all public R&D, but it dominates the public effort." },
      { chart: "tableBars", indicator: "rnd.in.industry_split", size: "small", unit: "% of industrial R&D", subtitle: "DST / NSTMIS \u00b7 leading industry groups by share of industrial R&D \u00b7 2020-21", title: "And where the private money goes", why: "The private R&D that does happen is narrow: one sector, pharmaceuticals, dominates, with IT and autos some way behind.", read: "Each bar is an industry's share of India's industrial R&D. Drugs and pharmaceuticals alone is a third of the total.", watch: "This is the composition of industrial R&D only, not its size; the whole private effort is still a small slice of the economy." },
      { chart: "multiLine", indicator: "rnd.rd_gdp.in", series: [{ indicator: "rnd.rd_gdp.kor", label: "South Korea" }, { indicator: "rnd.rd_gdp.chn", label: "China" }, { indicator: "rnd.rd_gdp.wld", label: "World average" }, { indicator: "rnd.rd_gdp.in", label: "India" }], size: "feature", unit: "R&D as % of GDP", subtitle: "World Bank / UNESCO \u00b7 R&D spending as a share of GDP, India vs the risers", title: "China and Korea pulled away", why: "Two generations ago India and China spent similar shares on research; then their paths split.", read: "The y-axis is R&D as % of GDP; India's line is nearly flat, China's and Korea's slope sharply upward.", watch: "Don't assume India started exactly where China did in absolute terms; but their shares were similar in the mid-1990s." },
      { chart: "multiLine", indicator: "divergence.rnd_gdp.in", series: [{ indicator: "divergence.rnd_gdp.in", label: "India" }, { indicator: "divergence.rnd_gdp.mys", label: "Malaysia" }, { indicator: "divergence.rnd_gdp.tha", label: "Thailand" }, { indicator: "divergence.rnd_gdp.vnm", label: "Vietnam" }, { indicator: "divergence.rnd_gdp.idn", label: "Indonesia" }, { indicator: "divergence.rnd_gdp.pak", label: "Pakistan" }], size: "feature", unit: "R&D as % of GDP", subtitle: "World Bank / UNESCO · gross R&D spending as a share of GDP · India vs its Asian neighbours", fromYear: 1996, title: "Even Southeast Asia is pulling ahead", why: "The giants are easy to wave away; the harder fact is that economies India once out-spent have overtaken it.", read: "The y-axis is R&D as a share of GDP. Watch the Malaysia and Thailand lines cross above India's flat line during the 2000s and 2010s.", watch: "These are modest spenders too; the story is the direction of travel, not the level." },
      { chart: "sparkGrid", series: [{ indicator: "rnd.rd_gdp.isr", label: "Israel" }, { indicator: "rnd.rd_gdp.kor", label: "South Korea" }, { indicator: "rnd.rd_gdp.fin", label: "Finland" }, { indicator: "rnd.rd_gdp.chn", label: "China" }, { indicator: "rnd.rd_gdp.sgp", label: "Singapore" }, { indicator: "rnd.rd_gdp.in", label: "India" }], size: "feature", unit: "R&D as % of GDP", fromYear: 1996, subtitle: "World Bank / UNESCO · R&D spending as a share of GDP since 1996 · one panel per country", title: "Everyone made the climb except India", why: "Five economies that started at or below today's India, or alongside it, all built far more research-intensive economies; India did not.", read: "Each small chart is one country's R&D-to-GDP trajectory since 1996, with its latest value. They are sorted high to low, so India sits at the bottom.", watch: "Singapore's and Finland's recent dips are not failure; both still spend two to five times India's share. The point is the decades-long climb." },
      { chart: "latestBars", series: [{ indicator: "rnd.researchers.kor", label: "South Korea" }, { indicator: "rnd.researchers.deu", label: "Germany" }, { indicator: "rnd.researchers.jpn", label: "Japan" }, { indicator: "rnd.researchers.usa", label: "United States" }, { indicator: "rnd.researchers.chn", label: "China" }, { indicator: "rnd.researchers.wld", label: "World average" }, { indicator: "rnd.researchers.vnm", label: "Vietnam" }, { indicator: "rnd.researchers.zaf", label: "South Africa" }, { indicator: "rnd.researchers.in", label: "India" }], size: "feature", unit: "researchers per million people", subtitle: "World Bank / UNESCO \u00b7 full-time-equivalent researchers per million population \u00b7 latest available per country", title: "India has strikingly few researchers", why: "Money is only half of it; the other half is people, and India has remarkably few researchers for its size.", read: "Bars show researchers (full-time equivalent) per million population. India's bar is the shortest among major comparators.", watch: "This counts full-time researchers in the country, not all Indian-origin scientists (many are abroad)." },
      { chart: "line", indicator: "rnd.in.researchers_per_million", size: "small", unit: "researchers per million people", subtitle: "DST / NSTMIS \u00b7 researchers per million population in India \u00b7 selected years", title: "India is adding researchers, but from a very low base", why: "The trend is up, which is real, but the starting point is so low that the climb barely registers globally.", read: "The line goes up, y-axis is researchers per million, but the values are all under 300.", watch: "Don't read the growth rate in isolation; 100% growth on a tiny base is still a tiny number." },
      { chart: "line", indicator: "rnd.in.women_extramural_share", size: "small", unit: "% of principal investigators", fromYear: 2000, subtitle: "DST / NSTMIS \u00b7 women's share of principal investigators on extramural R&D grants \u00b7 2000-01 to 2019-20", title: "And the researchers are mostly men", why: "The thin researcher pool is also lopsided: women lead only about a quarter of funded research projects, and that share has stopped rising.", read: "The line is the share of research grant leads who are women. It jumps from 13% in the 2000s into the mid-20s, peaks at 33% in 2013-14, then drifts back to 25%.", watch: "This tracks who leads extramural grants from central agencies, not all researchers; women are 18.6% of R&D personnel overall." },
      { chart: "tableBars", indicator: "rnd.absolute_ppp", size: "small", unit: "R&D spend, PPP$ billions", subtitle: "OECD MSTI (China, US \u00b7 2024) and DST / UNESCO (India \u00b7 2020-21) \u00b7 purchasing-power-parity dollars", title: "The absolute scale of the gap", why: "Shares of GDP understate the gap; in absolute money the distance is an order of magnitude.", read: "Bars represent total R&D spending in PPP billions; see the enormous disparity.", watch: "The India figure is from 2020-21; the gap has likely widened since then." },
      { chart: "tableBars", indicator: "rnd.publications_volume", size: "small", unit: "scientific papers, thousands (2022)", subtitle: "NSF Science & Engineering Indicators / Scopus \u00b7 scientific & technical publications \u00b7 2022", title: "And yet: third in the world for research papers", why: "Here is the paradox: India spends like an also-ran but produces like a heavyweight.", read: "Bars show thousands of papers published. India's bar is third-highest.", watch: "Don't equate paper count with quality or impact; citation metrics tell a more nuanced story." },
      { chart: "multiLine", indicator: "rnd.in.patents_resident", series: [{ indicator: "rnd.in.patents_resident", label: "Resident (Indian) applicants" }, { indicator: "rnd.in.patents_nonresident", label: "Non-resident (foreign) applicants" }], size: "feature", unit: "patent applications", subtitle: "WIPO / World Bank \u00b7 applications filed at the Indian Patent Office, by applicant", title: "Indians now file most of their own patents", why: "A genuine shift: domestic inventors have gone from a minority of patent filings to a clear majority.", read: "Two lines over time; watch resident (Indian) filings climb and cross non-resident (foreign) around 2022.", watch: "Patent filings are an intermediate indicator, not a direct measure of innovation success." },
      { chart: "tableBars", indicator: "rnd.gii_subranks", size: "feature", unit: "world rank, of 139 (lower is better)", subtitle: "WIPO Global Innovation Index 2025 \u00b7 India's rank on innovation inputs vs outputs", title: "India spends like 50th, innovates like 30th", why: "The paradox in one chart: India converts modest inputs into outsized innovation output.", read: "Two bars, lower rank is better; note the gap of 20 places between the two.", watch: "Don't interpret the overperformance as proof that low spending is fine. It's a warning that potential is being left on the table." },
      { chart: "tableBars", indicator: "rnd.isro_cost", size: "small", unit: "mission cost, US$ million", subtitle: "Mission budgets \u00b7 India's space programme vs comparable foreign missions \u00b7 approximate", title: "India does science cheap: the ISRO model", why: "The best of Indian research is mission-focused and frugal, doing for tens of millions what others spend hundreds on.", read: "Bars show approximate mission costs in millions of US dollars. India's bars are dramatically shorter.", watch: "These are mission-specific budgets, not total program costs. They omit shared overheads, but the contrast remains valid." },
      { chart: "tableBars", indicator: "rnd.budget_utilisation", size: "small", unit: "% of budgeted allocation actually spent", subtitle: "Open Budgets India \u00b7 share of the budgeted R&D allocation actually used", title: "The research money that doesn't get spent", why: "Some of India's R&D problem is not too little money but money that never gets out the door.", read: "Bars show the percentage of budgeted allocation actually utilized. Short bars mean unused money.", watch: "Underutilisation doesn't always mean waste; some projects are multi-year, but the chronic pattern suggests systemic bottlenecks." },
      { chart: "tableBars", indicator: "rnd.new_funds", size: "small", unit: "\u20b9 crore", subtitle: "ANRF / RDI Scheme \u00b7 the headline new funding commitments", title: "The new bets on Indian research", why: "India's answer is a set of large new vehicles, betting that private money will finally show up.", read: "Bars show the headline corpus amounts in \u20b9 crore. Note which parts are committed vs aspirational.", watch: "Don't treat the \u20b936,000 crore or \u20b91 lakh crore as committed money. The RDI fund is a financing vehicle, not a grant programme." }
    ]
  },

  {
    id: "q.econ.poverty",
    slug: "has-india-ended-poverty",
    question: "Has India ended poverty?",
    priority: "core",
    indicators: [
      "econ.poverty.wb_poverty_300", "econ.poverty.wb_poverty_420", "econ.poverty.wb_poor_300_crore", "econ.poverty.wb_poor_420_crore", "econ.poverty.wb_poor_830_crore", "econ.poverty.wb_gap_300",
      "econ.poverty.wb_gap_420", "econ.poverty.wb_gap_830", "econ.poverty.wb_poverty_420_rural", "econ.poverty.wb_poverty_420_urban", "econ.poverty.wb_group_poverty_420", "econ.poverty.tendulkar_headcount",
      "econ.poverty.committee_headcount_2011", "econ.poverty.committee_lines_2011", "econ.poverty.tinbergen_plfs_tendulkar_sfe", "econ.poverty.tinbergen_plfs_tendulkar_state", "econ.poverty.tinbergen_plfs_tendulkar_lasso", "econ.inequality.hces_mpce_urban",
      "econ.inequality.hces_mpce_rural", "econ.inequality.hces_mpce_rural_imputed", "econ.inequality.hces_mpce_urban_imputed", "econ.inequality.hces_fractile_mpce_rural", "econ.inequality.hces_cons_share_rural", "econ.poverty.hces_cutoff_simulation",
      "econ.poverty.hces_cutoff_state_3000", "econ.inequality.hces_state_mpce_rural", "econ.poverty.hces_cutoff_social_3000", "econ.inequality.hces_mpce_by_caste", "econ.poverty.niti_mpi_headcount", "econ.poverty.ophi_global_mpi_profile",
      "econ.poverty.niti_mpi_by_state", "econ.poverty.nfhs_basic_floor_latest", "econ.poverty.nfhs_nutrition_latest", "econ.poverty.wb_mpm_components", "econ.poverty.health_financial_hardship", "work.ilo.working_poverty",
      "work.ilo.working_poverty_youth", "econ.poverty.pip_peer_420_ind", "econ.poverty.pip_peer_420_chn", "econ.poverty.pip_peer_420_idn", "econ.poverty.pip_peer_420_vnm", "econ.poverty.pip_peer_420_bgd",
      "econ.poverty.pip_peer_300_ind", "econ.poverty.pip_peer_300_chn", "econ.poverty.pip_peer_300_idn", "econ.poverty.pip_peer_300_vnm", "econ.poverty.pip_peer_300_bgd",
      "econ.poverty.wb_poverty_830", "econ.poverty.wb_poverty_2800",
      "econ.poverty.hces_imputation_share_rural", "econ.poverty.real_floor_poorest5_rural", "econ.poverty.real_floor_poorest5_urban"
    ],
    visualPlan: [
      { chart: "multiLine", indicator: "econ.poverty.wb_poverty_300", series: [{ indicator: "econ.poverty.wb_poverty_300", label: "$3/day extreme poverty" }, { indicator: "econ.poverty.wb_poverty_420", label: "$4.20/day lower-middle-income line" }], size: "hero", unit: "% of people below each line", subtitle: "World Bank Poverty and Inequality Platform (PIP) · poverty headcount rates, not dollars · $3/day and $4.20/day in 2021 PPP · survey years 1977-2022", title: "The poverty rate changes when the poverty line changes", why: "The strongest version of the good news is true at the lowest line; the broader poverty line still leaves nearly a quarter of India below it.", read: "Both lines fall across the survey years; the gap between them at any year is the population above bare subsistence but below a fuller minimum. The points are sparse because India's consumption surveys are years apart.", watch: "Do not read the long gap between 2011-12 and 2022-23 as a smooth slide. It spans a missing survey and a comparability break; read the endpoints, not a straight line." },
      { chart: "latestBars", indicator: "econ.poverty.wb_poor_300_crore", series: [{ indicator: "econ.poverty.wb_poor_300_crore", label: "Below $3/day (~₹58 PPP)" }, { indicator: "econ.poverty.wb_poor_420_crore", label: "Below $4.20/day (~₹82 PPP)" }, { indicator: "econ.poverty.wb_poor_830_crore", label: "Below $8.30/day (~₹162 PPP)" }], size: "feature", unit: "crore people below each line", subtitle: "World Bank Poverty & Equity Brief + WDI/PIP · $3, $4.20 and $8.30 poverty lines in 2021 PPP, 2022-23", title: "The next floor is much more crowded", why: "India-scale turns small percentages into large populations, and the upper-middle-income line shows how far 'secure' is from 'above extreme poverty'.", read: "The bars are counts in crore people below each line, not poverty rates. The parenthetical rupee amounts are 2021 PPP equivalents.", watch: "Do not compare these counts with food-security beneficiaries. They are built for different policy questions." },
      { chart: "latestBars", indicator: "econ.poverty.wb_gap_300", series: [{ indicator: "econ.poverty.wb_gap_300", label: "$3/day gap" }, { indicator: "econ.poverty.wb_gap_420", label: "$4.20/day gap" }, { indicator: "econ.poverty.wb_gap_830", label: "$8.30/day gap" }], size: "feature", unit: "% poverty gap", subtitle: "World Bank WDI/PIP · poverty gap at $3, $4.20 and $8.30 lines, 2021 PPP · latest 2022", title: "Poverty gaps show depth, not just headcount", why: "A headcount only says how many people are below a line; the poverty gap says how far below the line they are on average.", read: "Compare the bars across poverty lines. Higher bars mean a larger average shortfall from that line.", watch: "Do not read a poverty gap as a share of people. It is a depth measure, not a headcount." },
      { chart: "multiLine", indicator: "econ.poverty.wb_poverty_420_rural", series: [{ indicator: "econ.poverty.wb_poverty_420_rural", label: "Rural" }, { indicator: "econ.poverty.wb_poverty_420_urban", label: "Urban" }], size: "feature", unit: "% of people below the line", subtitle: "World Bank Poverty & Equity Brief · poverty headcount rate at the lower-middle-income line, 2021 PPP", title: "At the $4.20 line, rural poverty is still higher", why: "Both rural and urban poverty fell, but the rural rate remains nearly twice the urban rate at the broader line.", read: "Both lines fall, but the rural line stays above the urban line throughout.", watch: "Do not read this as a full rural income measure. It is consumption poverty at one international line." },
      { chart: "tableBars", indicator: "econ.poverty.wb_group_poverty_420", size: "small", unit: "% below the broader line", subtitle: "World Bank Poverty & Equity Brief · group poverty rates at the lower-middle-income line, 2022-23", title: "The broader line is crowded with children and low-education households", why: "The remaining poor are not evenly spread across age and education.", read: "Read each bar as the poverty rate within that group. The groups overlap, so the bars are not parts of a whole.", watch: "Do not add the bars together. A child can live in a rural household, and education categories apply only to adults." },
      { chart: "multiLine", indicator: "econ.poverty.wb_poverty_300", series: [{ indicator: "econ.poverty.wb_poverty_300", label: "$3/day" }, { indicator: "econ.poverty.wb_poverty_420", label: "$4.20/day" }, { indicator: "econ.poverty.wb_poverty_830", label: "$8.30/day" }, { indicator: "econ.poverty.wb_poverty_2800", label: "$28/day rich-country line" }], size: "feature", unit: "% of people below each line", subtitle: "World Bank Poverty and Inequality Platform (PIP) · poverty headcount at four lines, 2021 PPP · survey years 1977-2022", title: "Raise the line to a rich-country level and the gains fade", why: "The progress is concentrated at the very bottom: at $3 India transformed, but at a rich-country line almost everyone is still below, and barely moved.", read: "Each line is the share of India below that daily line. The $3 and $4.20 lines plunge; the $8.30 line dips modestly; the $28 line sits flat near 100% across the whole period.", watch: "The $28 line is the World Bank's prosperity standard, not a poverty line. It marks a rich-country floor, used here only to show how the headcount behaves as the line rises." },
      { chart: "line", indicator: "econ.poverty.tendulkar_headcount", size: "small", subtitle: "Planning Commission · official Tendulkar poverty estimates · NSS consumption rounds", title: "India's last official poverty line stopped here", why: "India's last adopted national poverty estimate is still the 2011-12 Tendulkar number: 21.9%. Every newer claim is an estimate under another method.", read: "This is the official historical line, not a current estimate.", watch: "Do not use the 2011-12 endpoint to describe poverty today." },
      { chart: "tableBars", indicator: "econ.poverty.committee_headcount_2011", size: "small", unit: "% of people below the committee line", subtitle: "Planning Commission press note + Rangarajan Expert Group · poverty headcount rates for the same year, 2011-12", title: "A higher line counted more people as poor", why: "The famous poverty-line fight is not abstract. Rangarajan's higher standard raises the all-India poverty estimate from 21.9% to 29.5% in the same year.", read: "Compare Tendulkar and Rangarajan within the same geography.", watch: "Rangarajan was not adopted as the official line. Treat it as the major alternative benchmark." },
      { chart: "tableBars", indicator: "econ.poverty.committee_lines_2011", size: "small", unit: "₹ per person per month", subtitle: "Planning Commission press note + Rangarajan Expert Group · monthly per-capita poverty lines, 2011-12", title: "What the old poverty line meant in rupees", why: "The official line was low enough to make the political controversy obvious: about Rs 816 per person per month in rural India and Rs 1,000 in urban India.", read: "Each bar is a monthly per-person poverty line in 2011-12 rupees.", watch: "Do not treat these as current living-cost numbers." },
      { chart: "multiLine", indicator: "econ.poverty.tinbergen_plfs_tendulkar_sfe", series: [{ indicator: "econ.poverty.tinbergen_plfs_tendulkar_sfe", label: "Sector-wide model" }, { indicator: "econ.poverty.tinbergen_plfs_tendulkar_state", label: "State-level model" }, { indicator: "econ.poverty.tinbergen_plfs_tendulkar_lasso", label: "State LASSO model" }], size: "feature", unit: "% of population", subtitle: "Tinbergen Institute Discussion Paper 2025-069/V · PLFS-imputed Tendulkar-compatible poverty estimates, Table 5", title: "A serious dissent says the post-2011 fall was much slower", why: "This is the strongest methodological counterweight to simple HCES comparisons: it adjusts for survey non-comparability using imputation.", read: "Each line is a different imputation model from the Tinbergen paper's Table 5. Read the range and trend, not one exact point.", watch: "Do not treat this as an official poverty series. It is a research benchmark built to handle survey non-comparability." },
      { chart: "multiLine", indicator: "econ.inequality.hces_mpce_urban", series: [{ indicator: "econ.inequality.hces_mpce_urban", label: "Urban" }, { indicator: "econ.inequality.hces_mpce_rural", label: "Rural" }], size: "feature", unit: "₹ per person per month", subtitle: "MoSPI HCES · average monthly per-capita consumption, current prices, without imputation", title: "The consumption floor has risen", why: "Rising MPCE is the direct consumption-side reason poverty estimates fell after 2011-12.", read: "The lines are monthly per-person consumption in current rupees.", watch: "Do not read current-rupee gains as full real gains. Inflation matters." },
      { chart: "multiLine", indicator: "econ.inequality.hces_mpce_rural", series: [{ indicator: "econ.inequality.hces_mpce_rural", label: "Rural without imputation" }, { indicator: "econ.inequality.hces_mpce_rural_imputed", label: "Rural with imputation" }, { indicator: "econ.inequality.hces_mpce_urban", label: "Urban without imputation" }, { indicator: "econ.inequality.hces_mpce_urban_imputed", label: "Urban with imputation" }], size: "feature", unit: "₹ per person per month", subtitle: "MoSPI HCES · average MPCE with imputed value of free welfare items", title: "Free welfare items matter to measured consumption", why: "Free food and other transfers raise what poor households consume, and HCES now counts that value explicitly.", read: "Compare each imputed line with its non-imputed counterpart.", watch: "Counting transfers is not fake, but it changes what the number means." },
      { chart: "tableBars", indicator: "econ.inequality.hces_fractile_mpce_rural", size: "small", unit: "₹ per person per month", subtitle: "MoSPI HCES 2023-24 · average rural MPCE by fractile class", title: "The bottom rung is still thin", why: "The average can look comfortable while the poorest 5% of rural India spends only Rs 1,677 per person per month.", read: "Move from the poorest fractile to the richest fractile and compare monthly per-person consumption.", watch: "Do not turn household MPCE into individual wellbeing. Intra-household gaps are not shown." },
      { chart: "tableBars", indicator: "econ.inequality.hces_cons_share_rural", size: "small", unit: "% of rural consumption", subtitle: "MoSPI HCES 2023-24 · rural consumption share by group, computed from HCES tables", title: "The poorest half gets about a third of rural consumption", why: "Poverty is a threshold story; this shows the distribution around it.", read: "Compare the poorest 50%, middle 40% and richest 10% shares. They are shares of total rural consumption, not population shares.", watch: "Do not read consumption shares as income or wealth inequality. Income and asset concentration are usually sharper." },
      { chart: "tableBars", indicator: "econ.poverty.hces_cutoff_simulation", size: "small", unit: "% of people below the chosen cutoff", subtitle: "Computed from HCES 2023-24 unit-level microdata · nominal monthly MPCE cutoffs, calibrated to published rural/urban means", title: "Choose a monthly MPCE cutoff, get a different headcount", why: "This lets readers test the sensitivity directly: poverty is not a natural fact; it changes with the monthly consumption cutoff we choose.", read: "Each bar is a nominal monthly per-person MPCE cutoff and the share of people below it.", watch: "This is not an official estimate and not a PPP-dollar poverty line. It is a sensitivity check in 2023-24 rupees." },
      { chart: "tableBars", indicator: "econ.poverty.hces_cutoff_state_3000", size: "small", unit: "% of people below Rs 3,000 MPCE", subtitle: "Computed from HCES 2023-24 unit-level microdata · Rs 3,000 nominal monthly MPCE cutoff", title: "Below Rs 3,000 MPCE, the state ranking changes sharply", why: "The sensitivity test is not evenly distributed: the same rupee floor produces very different headcounts across states.", read: "States are ranked by the share of people below Rs 3,000 per person per month.", watch: "Do not treat this as an official state poverty rate. It does not adjust for state price levels." },
      { chart: "tableBars", indicator: "econ.inequality.hces_state_mpce_rural", size: "small", unit: "₹ per person per month", subtitle: "MoSPI HCES 2023-24 · average rural MPCE by major state", title: "The map changes the poverty story", why: "Rural Kerala's average MPCE is more than twice rural Chhattisgarh's. A national poverty line hides that regional gap.", read: "States are ranked from higher to lower rural MPCE.", watch: "This is not a state poverty rate. It is an average consumption level." },
      { chart: "tableBars", indicator: "econ.poverty.hces_cutoff_social_3000", size: "small", unit: "% of people below Rs 3,000 MPCE", subtitle: "Computed from HCES 2023-24 unit-level microdata · Rs 3,000 nominal monthly MPCE cutoff by household-head social group", title: "Below Rs 3,000 MPCE, ST and SC households are most exposed", why: "Average caste gaps become starker when translated into a below-cutoff headcount.", read: "Each bar is the simulated below-cutoff share for people living in households headed by that social group.", watch: "This is descriptive, not causal. It does not isolate caste from region, education, land or occupation." },
      { chart: "tableBars", indicator: "econ.inequality.hces_mpce_by_caste", size: "small", unit: "₹ per person per month", subtitle: "Computed from HCES 2023-24 unit-level microdata · average MPCE by social group of household head", title: "Poverty risk still runs along caste", why: "The consumption ladder is not socially neutral: Scheduled Tribe and Scheduled Caste households sit far below the 'Others' average.", read: "The bars are group averages by social group of the household head.", watch: "This is not a causal model. It is an observed gap shaped by many channels." },
      { chart: "line", indicator: "econ.poverty.niti_mpi_headcount", size: "small", subtitle: "NITI Aayog · National MPI headcount · 2005-06 is NFHS-3 baseline; 2013-14 and 2022-23 are estimated points", title: "NITI's MPI is a deprivation index, not a cash poverty line", why: "The non-cash evidence also shows a large fall: deprivation across health, education and living standards has come down sharply.", read: "The line tracks the share of people classified as multidimensionally poor.", watch: "Do not add MPI and consumption poverty together, and do not treat every point as directly surveyed." },
      { chart: "tableBars", indicator: "econ.poverty.ophi_global_mpi_profile", size: "small", unit: "%", subtitle: "OPHI/UNDP Global MPI Country Briefing 2023 · India, NFHS/DHS 2019-21", title: "The global MPI adds intensity and vulnerability", why: "The global MPI gives extra texture: how deprived the MPI poor are, who is vulnerable, and the rural-urban split.", read: "The bars mix related MPI concepts: headcount, vulnerability, severe poverty and intensity. Use the labels, not just bar height.", watch: "Do not treat this as the same index as NITI's national MPI. The indicator set and purpose differ." },
      { chart: "tableBars", indicator: "econ.poverty.niti_mpi_by_state", size: "small", unit: "% multidimensionally poor", subtitle: "NITI Aayog National MPI 2023 · state headcount ratios from NFHS-5, 2019-21", title: "MPI by state confirms the geography of deprivation", why: "The regional story is visible outside consumption too: the high-deprivation states are not random.", read: "States and union territories are ranked by MPI headcount.", watch: "Do not compare these directly with 2023-24 HCES consumption cutoffs. They come from a different measure and survey period." },
      { chart: "tableBars", indicator: "econ.poverty.nfhs_basic_floor_latest", size: "small", unit: "% of relevant households or women", subtitle: "NFHS-6 (2023-24) · latest India totals; denominators differ by indicator", title: "The basic household floor rose, but health cover still lags", why: "A poverty article needs to show what the welfare state and household capabilities have actually built.", read: "Treat the bars as a dashboard of basic capabilities. The denominator changes across indicators.", watch: "Do not compare these as if they were all the same population. Some are household measures, one is for women." },
      { chart: "tableBars", indicator: "econ.poverty.nfhs_nutrition_latest", size: "small", unit: "% of relevant population", subtitle: "NFHS-6 (2023-24) · selected nutrition indicators, latest India totals", title: "Nutrition is the hard caveat", why: "No poverty article should declare victory while child stunting, wasting, underweight and inadequate diets remain this high.", read: "Each bar is the latest all-India NFHS-6 value for a nutrition indicator.", watch: "Do not treat nutrition as a cash-poverty measure. It is shaped by food, disease, sanitation, care and health services." },
      { chart: "tableBars", indicator: "econ.poverty.wb_mpm_components", size: "small", unit: "% of population", subtitle: "World Bank Poverty & Equity Brief · multidimensional poverty components, 2022-23", title: "Basic services improved, but deprivation did not vanish", why: "Electricity deprivation is near zero, but sanitation and schooling deprivations still show up at meaningful levels.", read: "Each bar is one deprivation component.", watch: "The World Bank MPM excludes nutrition and health deprivation, so this cannot settle the child-nutrition question." },
      { chart: "tableBars", indicator: "econ.poverty.health_financial_hardship", size: "small", unit: "% of population", subtitle: "World Bank UHC financial-protection indicators · latest India observations, mostly 2022", title: "A hospital bill can still push households back down", why: "Poverty is not only crossing a line; it is also whether a household can survive a health shock without falling back.", read: "Each bar is a population share affected by out-of-pocket health spending under a World Bank financial-protection indicator.", watch: "Do not treat this as an HCES poverty rate. It is a health-financing vulnerability measure." },
      { chart: "multiLine", indicator: "work.ilo.working_poverty", series: [{ indicator: "work.ilo.working_poverty", label: "All workers" }, { indicator: "work.ilo.working_poverty_youth", label: "Young workers (15-24)" }], size: "feature", unit: "% of employed", subtitle: "ILOSTAT · working poverty rate, employed people below international poverty line", title: "Having work is not the same as being secure", why: "The last poverty layer is vulnerability: a household can work and still be close to the line.", read: "Compare all workers with young workers over time.", watch: "Modelled ILOSTAT working poverty should be read with PLFS wage and informality data, not alone." },
      { chart: "multiLine", indicator: "econ.poverty.pip_peer_420_ind", series: [{ indicator: "econ.poverty.pip_peer_420_ind", label: "India" }, { indicator: "econ.poverty.pip_peer_420_chn", label: "China" }, { indicator: "econ.poverty.pip_peer_420_idn", label: "Indonesia" }, { indicator: "econ.poverty.pip_peer_420_vnm", label: "Vietnam" }, { indicator: "econ.poverty.pip_peer_420_bgd", label: "Bangladesh" }], size: "feature", unit: "% of population below the line", subtitle: "World Bank PIP · % below $4.20/day (2021 PPP) · latest survey per country; survey years differ", title: "At $4.20 a day, India is the poorest of these Asian peers", why: "India cleared extreme poverty at roughly its neighbours' pace, but carries the largest group stranded just above it.", read: "Each line is one country's headcount below $4.20/day across its own survey years. Compare the latest end-points; lower is better.", watch: "The countries survey on different calendars, so this is not a same-year race. Read levels and trajectories, not a single shared year." },
      { chart: "multiLine", indicator: "econ.poverty.pip_peer_300_ind", series: [{ indicator: "econ.poverty.pip_peer_300_ind", label: "India" }, { indicator: "econ.poverty.pip_peer_300_chn", label: "China" }, { indicator: "econ.poverty.pip_peer_300_idn", label: "Indonesia" }, { indicator: "econ.poverty.pip_peer_300_vnm", label: "Vietnam" }, { indicator: "econ.poverty.pip_peer_300_bgd", label: "Bangladesh" }], size: "feature", unit: "% of population below the line", subtitle: "World Bank PIP · % below $3/day (2021 PPP) · latest survey per country; survey years differ", title: "Even at the lowest line, China and Vietnam pulled ahead", why: "At the extreme line India is middling among peers, not exceptional; China and Vietnam are far ahead.", read: "Each line is a country's headcount below $3/day across its survey years. China runs along the floor; India, Indonesia and Bangladesh sit close together near the top.", watch: "China at 0% means below this very low line, not that China has no poverty; its poverty now shows up only at higher lines." },
      { chart: "tableBars", indicator: "econ.poverty.hces_imputation_share_rural", size: "small", unit: "% of household MPCE", subtitle: "Computed from HCES 2023-24 unit-level microdata · imputed value of free welfare items as a share of consumption, rural deciles", title: "Free welfare items are a bigger slice of the poorest budgets", why: "Free foodgrain and other transfers are worth a near-identical rupee amount to most households, so they are a much larger share of consumption for the poorest.", read: "Each bar is the imputed value of free welfare items as a percentage of that decile's consumption. The share falls steadily from the poorest decile to the richest.", watch: "This is a share, not a rupee amount. In rupees the gift is broadly flat across deciles; it looms larger at the bottom only because the poor consume so little." },
      { chart: "multiLine", indicator: "econ.poverty.real_floor_poorest5_rural", series: [{ indicator: "econ.poverty.real_floor_poorest5_rural", label: "Rural poorest 5%" }, { indicator: "econ.poverty.real_floor_poorest5_urban", label: "Urban poorest 5%" }], size: "feature", unit: "₹ per person per month (2023-24 prices)", subtitle: "Published bottom-fractile MPCE (NSS Report 555 MMRP; HCES press note) deflated to 2023-24 prices · CES 2011-12, HCES 2022-23, 2023-24", title: "The real floor rose, and is still low", why: "In constant prices the consumption of the poorest 5% rose by about 62% (rural) and 76% (urban) since 2011-12, faster than the median, yet the floor is still only about Rs 1,677 a month in rural India.", read: "Each line is the inflation-adjusted average consumption of the poorest 5%, in today's rupees, across the three survey rounds. Both rise.", watch: "The surveys are not perfectly comparable (recall periods and free-item treatment changed), so part of the measured rise is a methodological lift. Read the direction, not a precise rate." }
    ]
  },

  {
    id: "q.energy.state_transitions",
    slug: "indias-thirty-electricity-transitions",
    question: "Is India's electricity getting cleaner, or only in some states?",
    priority: "core",
    // Built Jun 2026. Source: Ember India sub-national electricity data (state-level,
    // compiled from CEA + MNRE), 2019-2024 + monthly, cross-checked against Ember's
    // national series (2000-2025). Ingest: scripts/ingest-ember-states.mjs +
    // scripts/derive-ember-states.mjs.
    indicators: [
      "energy.ember.state.carbon_intensity_2024",
      "energy.ember.clean_share_national",
      "energy.ember.national.gen.coal", "energy.ember.national.gen.solar", "energy.ember.national.gen.wind",
      "energy.ember.national.gen.hydro", "energy.ember.national.gen.nuclear", "energy.ember.national.gen.gas",
      "energy.ember.national.capacity_factor",
      "energy.ember.state.generation_mix_2024",
      "energy.ember.state.wind_solar_capacity_2024",
      "energy.ember.state.clean_share_of_growth",
      "energy.ember.state.emissions_change",
      "energy.ember.state.power_emissions_2024",
      "energy.ember.national.monthly.solar", "energy.ember.national.monthly.wind", "energy.ember.national.monthly.hydro"
    ],
    visualPlan: [
      { chart: "choropleth", indicator: "energy.ember.state.carbon_intensity_2024", size: "hero", unit: "gCO2/kWh", divergeAt: 620, pivotLabel: "national average", rankLabel: "Most carbon-heavy", bottomLabel: "Cleanest grids", subtitle: "Ember India electricity data (compiled from CEA + MNRE) \u00b7 carbon intensity of power generation \u00b7 2024", title: "How clean is each state's electricity?", why: "The whole argument in one map: there is no single Indian grid, there are thirty, ranging from near-zero-carbon to almost pure coal.", read: "Each state is shaded by the carbon intensity of the power it generates, from about 24 gCO2/kWh in the hydro-rich states to over 800 in the coal belt. The cream band sits at the national average of about 620.", watch: "This is the carbon intensity of generation inside a state, not of the electricity its people consume; power crosses state lines." },
      { chart: "line", indicator: "energy.ember.clean_share_national", size: "feature", unit: "% of generation", subtitle: "Ember \u00b7 clean (renewables + nuclear) share of India's electricity generation \u00b7 2000-2025", title: "Nationally, the grid really is getting cleaner", why: "Start with the true national headline before complicating it: the clean share of India's electricity has climbed from about 17% to over a quarter.", read: "The line is the share of India's total generation from clean sources (renewables plus nuclear). It rises unevenly but clearly across two decades.", watch: "A rising share is not falling coal. This is the slice of a growing pie, not the size of the fossil slice." },
      { chart: "multiLine", indicator: "energy.ember.national.gen.coal", series: [{ indicator: "energy.ember.national.gen.coal", label: "Coal", color: "#1f1d1a" }, { indicator: "energy.ember.national.gen.solar", label: "Solar", color: "#f0a51f" }, { indicator: "energy.ember.national.gen.wind", label: "Wind", color: "#1f9e8a" }, { indicator: "energy.ember.national.gen.hydro", label: "Hydro", color: "#3a6fd0" }, { indicator: "energy.ember.national.gen.nuclear", label: "Nuclear", color: "#9b5de5" }, { indicator: "energy.ember.national.gen.gas", label: "Gas", color: "#b8a99a" }], size: "feature", unit: "TWh generated", subtitle: "Ember \u00b7 electricity generation by source, India \u00b7 2000-2025", title: "But coal kept growing the whole time", why: "The honest twist: a rising clean share hides the fact that coal generation almost quadrupled, because demand grew faster than clean supply.", read: "Each line is absolute generation in terawatt-hours. Coal climbs from about 390 to nearly 1,500 TWh; solar rises from essentially zero, but the gap is still enormous.", watch: "Read the absolute heights, not just the slopes. Solar's steep recent climb is real but starts from a tiny base." },
      { chart: "tableBars", indicator: "energy.ember.national.capacity_factor", size: "feature", unit: "% capacity factor (2024)", subtitle: "Ember \u00b7 generation as a share of maximum possible output, by source \u00b7 India 2024", title: "Why a megawatt of solar isn't a megawatt of coal", why: "The hidden reason capacity and generation tell different stories: intermittent sources run only a fraction of the time.", read: "Each bar is the capacity factor, the share of the year a source effectively runs flat out. Nuclear and coal run most of the time; solar and wind only about 15 to 19 percent.", watch: "A low capacity factor is not a fault, it is physics. It means you must install far more solar to match the yearly output of one coal plant." },
      { chart: "scenarioMaps", indicator: "energy.ember.state.generation_mix_2024", size: "feature", unit: "% of generation", subtitle: "Ember \u00b7 share of 2024 generation from each source, by state", title: "Three different ways to run a power grid", why: "Why states diverge so sharply: a clean grid can mean inherited Himalayan hydro or newly-built wind and solar, and these are completely different maps.", read: "Three maps, one scale. Hydro lights up the Himalayas and the northeast; wind and solar light up the western desert and the south; coal owns the east and the Gangetic plain.", watch: "High clean share is not the same as leading the transition. A hydro state was born clean by geography; a solar state built its way there." },
      { chart: "tableBars", indicator: "energy.ember.state.wind_solar_capacity_2024", size: "feature", unit: "MW installed", subtitle: "Ember \u00b7 installed wind + solar capacity, by state \u00b7 2024", title: "Where India actually built its wind and solar", why: "Strip away the inherited hydro and this is the real transition: a handful of states are doing most of the building.", read: "Each bar is installed wind plus solar capacity in megawatts. Rajasthan and Gujarat lead by a wide margin, with most of it added since 2019, followed by Tamil Nadu, Karnataka and Maharashtra.", watch: "Installed capacity is not generation. Sun and wind are intermittent, so a megawatt of solar produces less over a year than a megawatt of coal." },
      { chart: "tableBars", indicator: "energy.ember.state.clean_share_of_growth", size: "feature", unit: "% of new generation that was clean", subtitle: "Ember \u00b7 clean share of the rise in generation, 2019 to 2024, by state", title: "Of the new power added since 2019, how much was clean?", why: "The most decisive test of a transition: when a state needed more electricity, did it reach for clean or for coal?", read: "Each bar is the share of a state's 2019-to-2024 generation growth that came from clean sources. Gujarat and Rajasthan met most of their new demand with clean power; Bihar, Odisha and Chhattisgarh met almost none.", watch: "Nationally only about a quarter of the new power added since 2019 was clean. A high clean SHARE of total generation can still hide a dirty MARGIN of new growth." },
      { chart: "choropleth", indicator: "energy.ember.state.emissions_change", size: "feature", signed: true, divergeAt: 0, pivotLabel: "no change", rankLabel: "Rose the most", bottomLabel: "Actually fell", subtitle: "Ember \u00b7 change in absolute power-sector CO2 emissions, 2019 to 2024", title: "Power emissions are still rising across most of India", why: "The sobering counterpoint to a rising clean share: in absolute tonnes, India's power emissions are still going up almost everywhere.", read: "Each state is shaded by how much its power-sector CO2 rose or fell from 2019 to 2024. Chhattisgarh, Uttar Pradesh and Madhya Pradesh added the most; Gujarat is almost the only state to cut.", watch: "Falling carbon intensity does not mean falling emissions. A state can clean up each unit and still emit more in total because it generates so much more." },
      { chart: "tableBars", indicator: "energy.ember.state.power_emissions_2024", size: "feature", unit: "ktCO2 (2024)", subtitle: "Ember \u00b7 absolute power-sector CO2 emissions, by state \u00b7 2024", title: "Where India's power emissions actually come from", why: "Intensity tells you how dirty each unit is; this tells you where the tonnes physically come from, which is where decarbonisation has to happen.", read: "Each bar is total CO2 emitted by a state's power sector in 2024. Chhattisgarh, Uttar Pradesh and Madhya Pradesh top the list on sheer volume of coal burnt.", watch: "This is mass, not intensity. A big, coal-heavy state can emit a lot in total while a tiny grid has a higher per-unit intensity." },
      { chart: "multiLine", indicator: "energy.ember.national.monthly.hydro", series: [{ indicator: "energy.ember.national.monthly.hydro", label: "Hydro", color: "#3a6fd0" }, { indicator: "energy.ember.national.monthly.wind", label: "Wind", color: "#1f9e8a" }, { indicator: "energy.ember.national.monthly.solar", label: "Solar", color: "#f0a51f" }], size: "feature", unit: "GWh per month", subtitle: "Ember \u00b7 monthly generation from each renewable source \u00b7 India 2024", title: "The clean grid runs on the monsoon's calendar", why: "Renewables are not steady: India's clean power has a strong seasonal rhythm that the rest of the grid has to work around.", read: "Each line is monthly generation in 2024. Hydro and wind surge together in the monsoon (wind nearly quadruples and hydro more than triples from their lows) while solar stays comparatively flat.", watch: "This is a single year, so read the seasonal shape, not a trend. The monsoon months are exactly when coal eases off as hydro and wind fill in." }
    ]
  },

  {
    id: "q.states.demographic_finances",
    slug: "young-states-old-states",
    question: "What happens to a state's budget when it grows old?",
    priority: "core",
    // Built Jun 2026. Sources: RBI e-STATES database (State Finances: A Study of
    // Budgets of 2025-26), 1990-91..2023-24 actuals; demographic spine from MoHFW
    // Report of the Technical Group on Population Projections (2020) as published in
    // the report's Chapter III (Tables III.2 / III.7). Ingest: scripts/ingest-estates.py
    // + scripts/derive-estates.py. All fiscal comparisons are internal shares.
    indicators: [
      "states.demog.share60_scenario",
      "states.demog.oadr_2026",
      "states.demog.share60_rise_2011_2036",
      "states.demog.share60.kerala", "states.demog.share60.bihar", "states.demog.share60.india",
      "states.demog.oadr.india",
      "states.fiscal.own_tax_share.youthful", "states.fiscal.own_tax_share.intermediate", "states.fiscal.own_tax_share.ageing",
      "states.fiscal.central_transfer_share.youthful", "states.fiscal.central_transfer_share.intermediate", "states.fiscal.central_transfer_share.ageing",
      "states.fiscal.committed_share.youthful", "states.fiscal.committed_share.intermediate", "states.fiscal.committed_share.ageing",
      "states.fiscal.education_share.youthful", "states.fiscal.education_share.intermediate", "states.fiscal.education_share.ageing",
      "states.fiscal.health_share.youthful", "states.fiscal.health_share.intermediate", "states.fiscal.health_share.ageing",
      "states.fiscal.own_tax_share_2024",
      "states.fiscal.committed_share_2024",
      "states.fiscal.pension_share_2024",
      "states.fiscal.own_tax_share.st.kerala", "states.fiscal.own_tax_share.st.tamil_nadu", "states.fiscal.own_tax_share.st.bihar",
      "states.income.per_capita_2024",
      "states.gsdp.own_tax_gsdp.youthful", "states.gsdp.own_tax_gsdp.intermediate", "states.gsdp.own_tax_gsdp.ageing",
      "states.gsdp.rev_exp_gsdp.youthful", "states.gsdp.rev_exp_gsdp.intermediate", "states.gsdp.rev_exp_gsdp.ageing",
      "states.percap.rev_exp_2024", "states.percap.health_2024"
    ],
    visualPlan: [
      // ACT 1 - India is not ageing as one country
      { chart: "scenarioMaps", indicator: "states.demog.share60_scenario", size: "hero", unit: "% aged 60+", subtitle: "MoHFW 2020 projections (via RBI) · share of population aged 60 and above · 2011, 2026, 2036", title: "India is ageing, but not all at once", why: "The whole argument in one image: the grey wave reaches the south and west first and the poor northern states last.", read: "Three maps on one scale. In 2011 almost the whole country is pale; by 2026 the south darkens; by 2036 ageing has spread north and west while Bihar and UP are still comparatively young.", watch: "These are projections from 2020, not a census count. Read the pattern and the direction, not any single state's decimal." },
      { chart: "choropleth", indicator: "states.demog.oadr_2026", size: "feature", unit: "elderly per 100 workers", divergeAt: 17.6, pivotLabel: "national average", rankLabel: "Heaviest load", bottomLabel: "Lightest load", subtitle: "MoHFW 2020 projections (via RBI) · population 60+ per 100 aged 15-59 · 2026", title: "How many elderly each 100 workers must support", why: "Ageing is not abstract: it is how many retired people each working-age person has to carry, and that already varies two-to-one across India.", read: "Each state is shaded by its old-age dependency ratio in 2026. Kerala carries about 30 elderly per 100 workers; Bihar about 14. The cream band sits at the national average of about 18.", watch: "This counts people, not money. A high ratio is a fiscal warning only to the extent the elderly draw on state pensions and health spending." },
      { chart: "tableBars", indicator: "states.demog.share60_rise_2011_2036", size: "feature", unit: "percentage points", subtitle: "MoHFW 2020 projections (via RBI) · rise in 60+ share, 2011 to 2036", title: "Where the grey wave rises fastest", why: "The states that look young today are not safe; several are ageing faster than the ones already old.", read: "Each bar is the projected increase in a state's 60-plus share between 2011 and 2036. Kerala and Tamil Nadu rise most in level, but West Bengal, Andhra and Karnataka are close behind.", watch: "A big rise from a low base still leaves a young state; a small rise on top of an already-old base, like Kerala, is the harder fiscal problem." },
      { chart: "multiLine", indicator: "states.demog.share60.india", series: [{ indicator: "states.demog.share60.kerala", label: "Kerala", color: "#c2476b" }, { indicator: "states.demog.share60.india", label: "India", color: "#8a8580" }, { indicator: "states.demog.share60.bihar", label: "Bihar", color: "#1f9e8a" }], size: "feature", unit: "% aged 60+", subtitle: "MoHFW 2020 projections (via RBI) · share of population aged 60+, 2011-2036", title: "A generation apart: Kerala and Bihar", why: "The national average hides a gap of decades: Kerala in 2026 is where Bihar will not be even in 2036.", read: "Three trajectories of the 60-plus share. Kerala is already past the ageing threshold; Bihar is still climbing toward where Kerala began.", watch: "Both lines rise; this is not Bihar staying young forever. It is Bihar getting Kerala's problem later, with less money to meet it." },

      // ACT 2 - Young states and old states run on different fiscal engines
      { chart: "multiLine", indicator: "states.fiscal.own_tax_share.ageing", series: [{ indicator: "states.fiscal.own_tax_share.ageing", label: "Ageing states", color: "#c2476b" }, { indicator: "states.fiscal.own_tax_share.intermediate", label: "Intermediate states", color: "#d99a1f" }, { indicator: "states.fiscal.own_tax_share.youthful", label: "Youthful states", color: "#1f9e8a" }], size: "feature", unit: "% of total revenue", subtitle: "RBI e-STATES · own-tax revenue as a share of total revenue, by demographic group · 2000-01 to 2023-24", title: "Older states pay their own way; younger states lean on Delhi", why: "Counter-intuitively, the ageing states are the fiscally self-reliant ones: they raise most of their money themselves.", read: "Each line is a group's own taxes as a share of its total revenue. The ageing group raises well over half; the youthful group raises a quarter to a third and depends on central transfers for the rest.", watch: "States are grouped by their 2026 60-plus share; the lines are aggregates, so a single large state can pull a group." },
      { chart: "multiLine", indicator: "states.fiscal.central_transfer_share.youthful", series: [{ indicator: "states.fiscal.central_transfer_share.ageing", label: "Ageing states", color: "#c2476b" }, { indicator: "states.fiscal.central_transfer_share.intermediate", label: "Intermediate states", color: "#d99a1f" }, { indicator: "states.fiscal.central_transfer_share.youthful", label: "Youthful states", color: "#1f9e8a" }], size: "feature", unit: "% of total revenue", subtitle: "RBI e-STATES · central tax share + grants as a share of total revenue, by group · 2000-01 to 2023-24", title: "The mirror image: who depends on transfers", why: "The flip side of own taxes: the young, poor states get most of their budget from the Centre.", read: "Each line is the share of a group's revenue that comes from central tax devolution plus grants. The youthful group sits highest; the ageing group lowest.", watch: "Dependence on transfers is not failure; it is partly by design, since devolution is meant to equalise. But it makes young states hostage to central decisions." },
      { chart: "sparkGrid", indicator: "states.fiscal.own_tax_share.st.kerala", series: [{ indicator: "states.fiscal.own_tax_share.st.andhra_pradesh", label: "Andhra Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.assam", label: "Assam" }, { indicator: "states.fiscal.own_tax_share.st.bihar", label: "Bihar" }, { indicator: "states.fiscal.own_tax_share.st.chhattisgarh", label: "Chhattisgarh" }, { indicator: "states.fiscal.own_tax_share.st.delhi", label: "Delhi" }, { indicator: "states.fiscal.own_tax_share.st.gujarat", label: "Gujarat" }, { indicator: "states.fiscal.own_tax_share.st.haryana", label: "Haryana" }, { indicator: "states.fiscal.own_tax_share.st.himachal_pradesh", label: "Himachal Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.jammu_and_kashmir", label: "Jammu and Kashmir" }, { indicator: "states.fiscal.own_tax_share.st.jharkhand", label: "Jharkhand" }, { indicator: "states.fiscal.own_tax_share.st.karnataka", label: "Karnataka" }, { indicator: "states.fiscal.own_tax_share.st.kerala", label: "Kerala" }, { indicator: "states.fiscal.own_tax_share.st.madhya_pradesh", label: "Madhya Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.maharashtra", label: "Maharashtra" }, { indicator: "states.fiscal.own_tax_share.st.odisha", label: "Odisha" }, { indicator: "states.fiscal.own_tax_share.st.punjab", label: "Punjab" }, { indicator: "states.fiscal.own_tax_share.st.rajasthan", label: "Rajasthan" }, { indicator: "states.fiscal.own_tax_share.st.tamil_nadu", label: "Tamil Nadu" }, { indicator: "states.fiscal.own_tax_share.st.telangana", label: "Telangana" }, { indicator: "states.fiscal.own_tax_share.st.uttar_pradesh", label: "Uttar Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.uttarakhand", label: "Uttarakhand" }, { indicator: "states.fiscal.own_tax_share.st.west_bengal", label: "West Bengal" }], size: "feature", unit: "% of total revenue", subtitle: "RBI e-STATES · own-tax revenue as a share of total revenue · each state, 1990-91 to 2023-24", title: "Every state's own-revenue effort, one panel each", why: "Behind the group averages, each state has its own trajectory; this is the whole federation at a glance.", read: "Each mini-panel is one state's own-tax share over three decades, shaded by its latest level. The southern and western states cluster high; the poorest northern and eastern states stay low.", watch: "A flat low line can mean a weak tax base, not laziness; poorer states simply have less to tax." },
      { chart: "choropleth", indicator: "states.fiscal.own_tax_share_2024", size: "feature", unit: "% of total revenue", divergeAt: 45, pivotLabel: "about 45%", rankLabel: "Most self-reliant", bottomLabel: "Most transfer-dependent", subtitle: "RBI e-STATES · own-tax revenue as a share of total revenue · 2023-24", title: "The self-reliance map", why: "Own-revenue effort mapped: it traces almost the same line as the ageing map, because richer, older states have deeper tax bases.", read: "Each state is shaded by how much of its revenue it raises itself in 2023-24. The south and west are dark and self-funding; the Hindi-belt and the northeast lean on Delhi.", watch: "Special-category and hill states get larger grants by formula, so a low own-tax share there is partly structural, not just a weak economy." },

      // ACT 3 - But how big is all this against the economy?
      { chart: "choropleth", indicator: "states.income.per_capita_2024", size: "feature", unit: "Rs thousand per person", divergeAt: 150, pivotLabel: "about Rs 1.5 lakh", rankLabel: "Richest", bottomLabel: "Poorest", subtitle: "RBI Handbook of Statistics on Indian States · per-capita net state income (NSDP), current prices · 2023-24", title: "How rich each state actually is", why: "The income map behind the ageing map: the states that grow old first are simply the richer ones.", read: "Each state is shaded by income per person in 2023-24. Kerala, Tamil Nadu, Karnataka and the west run two to five times richer than Bihar, Uttar Pradesh and the eastern states.", watch: "This is income produced per resident, not what households take home, and a few mineral or capital states can look richer than daily life feels." },
      { chart: "multiLine", indicator: "states.gsdp.own_tax_gsdp.ageing", series: [{ indicator: "states.gsdp.own_tax_gsdp.ageing", label: "Ageing states", color: "#c2476b" }, { indicator: "states.gsdp.own_tax_gsdp.intermediate", label: "Intermediate states", color: "#d99a1f" }, { indicator: "states.gsdp.own_tax_gsdp.youthful", label: "Youthful states", color: "#1f9e8a" }], size: "feature", unit: "% of GSDP", subtitle: "RBI e-STATES over GSDP (Handbook of Statistics on Indian States) · own-tax revenue as a share of state GDP · 2011-12 to 2023-24", title: "Everyone taxes their economy about the same", why: "The myth-buster: measured against the size of the economy, the ageing states do not tax harder, they all take a similar slice.", read: "Each line is a group's own-tax revenue as a share of its GSDP. All three sit close to 6 to 7%, and the ageing group has drifted down to meet the others.", watch: "Similar tax effort with very different own-tax SHARES means the gap in the last act was about how much Delhi sends, not about how hard states tax their own economies." },
      { chart: "multiLine", indicator: "states.gsdp.rev_exp_gsdp.youthful", series: [{ indicator: "states.gsdp.rev_exp_gsdp.youthful", label: "Youthful states", color: "#1f9e8a" }, { indicator: "states.gsdp.rev_exp_gsdp.intermediate", label: "Intermediate states", color: "#d99a1f" }, { indicator: "states.gsdp.rev_exp_gsdp.ageing", label: "Ageing states", color: "#c2476b" }], size: "feature", unit: "% of GSDP", subtitle: "RBI e-STATES over GSDP · revenue spending as a share of state GDP · 2011-12 to 2023-24", title: "The poorest states run the biggest governments", why: "A second surprise from the GSDP lens: relative to their small economies, the young, poor states spend the most.", read: "Each line is a group's revenue spending as a share of GSDP. The youthful group runs near 17%, well above the intermediate and ageing groups near 12%.", watch: "A bigger government relative to GSDP is partly because the economy is small and central transfers are large, not because the state does more per person, which the next charts show." },
      { chart: "tableBars", indicator: "states.percap.rev_exp_2024", size: "feature", unit: "Rs per person", subtitle: "RBI e-STATES per derived population · revenue spending per resident · 2023-24", title: "How much government each citizen actually gets", why: "Flip from shares to rupees per person and the picture inverts: the richer states spend far more on each resident.", read: "Each bar is a state's revenue spending divided by its population. A resident of Himachal or the hill and northeastern states gets three to four times the rupees of one in Bihar or Uttar Pradesh.", watch: "Small hill and special-category states sit on top partly because they have few people and large grants; per-person spending is not the same as quality of services." },
      { chart: "tableBars", indicator: "states.percap.health_2024", size: "feature", unit: "Rs per person", subtitle: "RBI e-STATES per derived population · medical and public-health spending per resident · 2023-24", title: "Same share of the budget, very different rupees", why: "The resolution of the health puzzle: states spend a similar SHARE on health, but in rupees per person the gap is enormous.", read: "Each bar is health spending per resident in 2023-24. The richer and hill states spend multiples of what the poor, populous states manage per person, even though the budget SHARE looked similar.", watch: "Per-person health spending still says nothing about outcomes or the large role of private and out-of-pocket health spending in India." },

      // ACT 4 - The squeeze: ageing locks the budget
      { chart: "multiLine", indicator: "states.fiscal.committed_share.ageing", series: [{ indicator: "states.fiscal.committed_share.ageing", label: "Ageing states", color: "#c2476b" }, { indicator: "states.fiscal.committed_share.intermediate", label: "Intermediate states", color: "#d99a1f" }, { indicator: "states.fiscal.committed_share.youthful", label: "Youthful states", color: "#1f9e8a" }], size: "feature", unit: "% of revenue spending", subtitle: "RBI e-STATES · interest payments + pensions as a share of revenue expenditure, by group · 2000-01 to 2023-24", title: "How much of the budget is already spoken for", why: "This is the squeeze: in the ageing states a third of every rupee of running spending is locked into interest and pensions before a single new scheme.", read: "Each line is a group's committed spending (interest plus pensions) as a share of revenue expenditure. The youthful group cut its share over two decades; the ageing group stayed stuck near a third.", watch: "Committed spending here is interest plus pensions only; salaries are not separable in this data, so the true rigidity is even higher everywhere." },
      { chart: "choropleth", indicator: "states.fiscal.committed_share_2024", size: "feature", unit: "% of revenue spending", divergeAt: 28, pivotLabel: "about 28%", rankLabel: "Most locked-in", bottomLabel: "Most flexible", subtitle: "RBI e-STATES · interest + pensions as a share of revenue expenditure · 2023-24", title: "Where the budget is most pre-committed", why: "The committed-spending burden mapped: the older states and the most indebted states light up together.", read: "Each state is shaded by the share of its running budget already promised to interest and pensions in 2023-24. The ageing southern states and the heavily indebted states (Punjab, Kerala, West Bengal) carry the heaviest load.", watch: "High interest is about past borrowing, not ageing; high pensions is about ageing and past hiring. The map mixes both forces." },
      { chart: "multiLine", indicator: "states.fiscal.education_share.youthful", series: [{ indicator: "states.fiscal.education_share.youthful", label: "Youthful states", color: "#1f9e8a" }, { indicator: "states.fiscal.education_share.intermediate", label: "Intermediate states", color: "#d99a1f" }, { indicator: "states.fiscal.education_share.ageing", label: "Ageing states", color: "#c2476b" }], size: "feature", unit: "% of revenue spending", subtitle: "RBI e-STATES · education spending as a share of revenue expenditure, by group · 2000-01 to 2023-24", title: "Young states still spend more on schooling", why: "Where the money goes follows the age structure: the young states put a bigger slice into education, where their need is.", read: "Each line is a group's education spending as a share of revenue expenditure. The youthful group sits highest, the ageing group lowest, matching where the children are.", watch: "A higher share is not higher quality or even higher rupees per child; young states also have far more children to spread it across." },
      { chart: "multiLine", indicator: "states.fiscal.health_share.ageing", series: [{ indicator: "states.fiscal.health_share.ageing", label: "Ageing states", color: "#c2476b" }, { indicator: "states.fiscal.health_share.intermediate", label: "Intermediate states", color: "#d99a1f" }, { indicator: "states.fiscal.health_share.youthful", label: "Youthful states", color: "#1f9e8a" }], size: "feature", unit: "% of revenue spending", subtitle: "RBI e-STATES · medical and public-health spending as a share of revenue expenditure, by group · 2000-01 to 2023-24", title: "How much states spend on health", why: "The surprising null result: health budgets barely move with age, which is why pensions, not hospitals, are the real fiscal cost of ageing.", read: "Each line is a group's medical and public-health spending as a share of revenue expenditure. All three sit near 5%, rose together during the pandemic, and by 2023-24 had converged with almost nothing between them.", watch: "State health budgets serve all ages, so demography barely shows up here; do not read the small wiggles as a strong ageing signal." },
      { chart: "tableBars", indicator: "states.fiscal.pension_share_2024", size: "feature", unit: "% of revenue spending", subtitle: "RBI e-STATES · pensions as a share of revenue expenditure · 2023-24", title: "Where pensions already eat the budget", why: "The single clearest ageing cost: in some states pensions alone are nearly a fifth of all running spending.", read: "Each bar is state pension outgo as a share of revenue expenditure in 2023-24. Himachal, Kerala, Punjab and the hill states top the list.", watch: "This is today's pension bill from past hiring, not future ageing. The shift from the Old Pension Scheme to NPS, and some states reverting, will reshape it." },

      // ACT 5 - The closing window
      { chart: "line", indicator: "states.demog.oadr.india", size: "feature", unit: "elderly per 100 workers", subtitle: "MoHFW 2020 projections (via RBI) · India's old-age dependency ratio · 2011-2036", title: "The window is one generation wide", why: "Zoom out to the country: the support ratio is set to rise steeply, and the easy years are now.", read: "The line is India's old-age dependency ratio. It drifts up gently to 2021, then climbs faster toward 2036 as the post-1960s cohorts retire.", watch: "Projections compound, so the later years are less certain; but the near-term rise is already baked into people who are alive today." },
      { chart: "rankedChange", indicator: "states.fiscal.own_tax_share.st.kerala", diverging: true, series: [{ indicator: "states.fiscal.own_tax_share.st.andhra_pradesh", label: "Andhra Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.assam", label: "Assam" }, { indicator: "states.fiscal.own_tax_share.st.bihar", label: "Bihar" }, { indicator: "states.fiscal.own_tax_share.st.chhattisgarh", label: "Chhattisgarh" }, { indicator: "states.fiscal.own_tax_share.st.delhi", label: "Delhi" }, { indicator: "states.fiscal.own_tax_share.st.gujarat", label: "Gujarat" }, { indicator: "states.fiscal.own_tax_share.st.haryana", label: "Haryana" }, { indicator: "states.fiscal.own_tax_share.st.himachal_pradesh", label: "Himachal Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.jammu_and_kashmir", label: "Jammu and Kashmir" }, { indicator: "states.fiscal.own_tax_share.st.jharkhand", label: "Jharkhand" }, { indicator: "states.fiscal.own_tax_share.st.karnataka", label: "Karnataka" }, { indicator: "states.fiscal.own_tax_share.st.kerala", label: "Kerala" }, { indicator: "states.fiscal.own_tax_share.st.madhya_pradesh", label: "Madhya Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.maharashtra", label: "Maharashtra" }, { indicator: "states.fiscal.own_tax_share.st.odisha", label: "Odisha" }, { indicator: "states.fiscal.own_tax_share.st.punjab", label: "Punjab" }, { indicator: "states.fiscal.own_tax_share.st.rajasthan", label: "Rajasthan" }, { indicator: "states.fiscal.own_tax_share.st.tamil_nadu", label: "Tamil Nadu" }, { indicator: "states.fiscal.own_tax_share.st.telangana", label: "Telangana" }, { indicator: "states.fiscal.own_tax_share.st.uttar_pradesh", label: "Uttar Pradesh" }, { indicator: "states.fiscal.own_tax_share.st.uttarakhand", label: "Uttarakhand" }, { indicator: "states.fiscal.own_tax_share.st.west_bengal", label: "West Bengal" }], size: "feature", unit: "% of total revenue", subtitle: "RBI e-STATES · change in own-tax share, first decade vs latest decade", title: "Who built revenue muscle while the window was open", why: "The test for the young states is whether they strengthen their own tax base before they age; this shows who has.", read: "Each row compares a state's own-tax share in its first decade of data with its most recent decade. States to the right strengthened their own revenue; states to the left slid toward more dependence.", watch: "Own-tax share can fall simply because central transfers rose faster, not because tax effort weakened; read it alongside the levels in the map above." }
    ]
  },

  {
    id: "q.econ.rupee",
    slug: "why-the-rupee-falls",
    question: "Why does the rupee keep falling, and does it actually make you poorer?",
    priority: "core",
    // Built Jun 2026. The biography of a currency: a pegged colonial inheritance,
    // the 1966 and 1991 devaluations, the 1993 move to a market rate, the
    // words-vs-deeds intervention era, then the REER reveal and the purchasing-power
    // counterfactual. Sources: FRED (INR/USD, Brent), BIS (REER/NEER, long CPI,
    // policy rate), RBI (REER 36c from 1975, deposit rates, intervention + forward
    // book, FPI, foreign trade), World Bank (remittances), and a verified pre-1973
    // devaluation chronology. See scripts/ingest-rupee-*.* + derive-rupee-charts.py.
    indicators: [
      "IN.fx.inr_usd_long.annual", "derived.IN.reserves.total_usd.monthly",
      "IN.fx.rbi_net_intervention_usd.monthly", "IN.extfin.net_fpi_usd.monthly",
      "IN.fx.rbi_forward_book_usd.monthly", "IN.fx.inr_usd_month_high.monthly", "IN.fx.inr_usd_month_low.monthly",
      "derived.IN.fx.idx_rupee_vs_usd", "derived.IN.fx.idx_neer_broad", "derived.IN.fx.idx_reer_broad",
      "IN.fx.reer_36c.monthly", "IN.fx.neer_36c.monthly",
      "IN.fx.inr_usd.monthly", "derived.IN.fx.inr_usd_ppp_implied",
      "IN.prices.cpi_yoy_bis.monthly", "US.prices.cpi_yoy_bis.monthly",
      "derived.IN.trade.exports_idx_inr", "derived.IN.trade.exports_idx_usd",
      "derived.IN.savings.fd_nominal", "derived.IN.savings.cost_of_living", "derived.IN.savings.fd_real",
      "derived.IN.energy.brent_inr_idx", "derived.IN.energy.brent_usd_idx",
      "IN.trade.imports_oil_usd.annual", "IN.extfin.remittances_received_usd.annual",
      "derived.IN.fx.rupee_value_vs_usd", "derived.IN.fx.rupee_value_vs_eur", "derived.IN.fx.rupee_value_vs_gbp", "derived.IN.fx.rupee_value_vs_jpy",
      "IN.rates.policy_rate.monthly", "IN.extfin.net_fdi_usd.monthly", "extfin.driver.usd_em_index", "derived.IN.fx.regime_volatility",
      "derived.IN.prices.cpi_cum_in", "derived.IN.prices.cpi_cum_us", "derived.IN.rates.real_deposit_rate",
      "IN.trade.exports_total_usd.annual", "IN.trade.imports_total_usd.annual",
      "derived.IN.fx.decade_fall", "derived.IN.fx.peer_fall_vs_usd", "macro.current_account_usd",
      "IN.extfin.usd_credit_nonbank.quarterly"
    ],
    core: [
      "IN.fx.inr_usd_long.annual", "derived.IN.reserves.total_usd.monthly",
      "IN.fx.rbi_net_intervention_usd.monthly", "IN.extfin.net_fpi_usd.monthly",
      "IN.fx.rbi_forward_book_usd.monthly", "IN.fx.inr_usd_month_high.monthly", "IN.fx.inr_usd_month_low.monthly",
      "derived.IN.fx.idx_rupee_vs_usd", "derived.IN.fx.idx_neer_broad", "derived.IN.fx.idx_reer_broad",
      "IN.fx.reer_36c.monthly", "IN.fx.neer_36c.monthly",
      "IN.fx.inr_usd.monthly", "derived.IN.fx.inr_usd_ppp_implied",
      "IN.prices.cpi_yoy_bis.monthly", "US.prices.cpi_yoy_bis.monthly",
      "derived.IN.trade.exports_idx_inr", "derived.IN.trade.exports_idx_usd",
      "derived.IN.savings.fd_nominal", "derived.IN.savings.cost_of_living", "derived.IN.savings.fd_real",
      "derived.IN.energy.brent_inr_idx", "derived.IN.energy.brent_usd_idx",
      "IN.trade.imports_oil_usd.annual", "IN.extfin.remittances_received_usd.annual",
      "derived.IN.fx.rupee_value_vs_usd", "derived.IN.fx.rupee_value_vs_eur", "derived.IN.fx.rupee_value_vs_gbp", "derived.IN.fx.rupee_value_vs_jpy",
      "IN.rates.policy_rate.monthly", "IN.extfin.net_fdi_usd.monthly", "extfin.driver.usd_em_index", "derived.IN.fx.regime_volatility",
      "derived.IN.prices.cpi_cum_in", "derived.IN.prices.cpi_cum_us", "derived.IN.rates.real_deposit_rate",
      "IN.trade.exports_total_usd.annual", "IN.trade.imports_total_usd.annual",
      "derived.IN.fx.decade_fall", "derived.IN.fx.peer_fall_vs_usd", "macro.current_account_usd",
      "IN.extfin.usd_credit_nonbank.quarterly"
    ],
    context: [],
    visualPlan: [
      // --- ACT 1: THE NUMBER EVERYONE MISREADS ---
      { indicator: "IN.fx.inr_usd_long.annual", chart: "line", title: "From four rupees to ninety", size: "hero", window: "full", beat: "the-number", subtitle: "What one US dollar has cost in rupees since Independence: flat for decades under fixed pegs, then stepping down through each devaluation.",
        why: "The headline everyone knows and almost everyone misreads: the rupee's long slide against the dollar.", read: "Rupees per US dollar from 1947 to today, pegged and flat for decades, then stepping down through the 1966 and 1991 devaluations before floating.", watch: "Pre-1993 these are fixed-peg par values, not market prices; the flat stretches are policy, not stability of value." },
      { indicator: "derived.IN.fx.decade_fall", chart: "tableBars", title: "The fall, decade by decade", size: "feature", beat: "decade-fall", subtitle: "How much of its dollar value the rupee gave up in each decade. The losses came in bursts, not a steady slide.", unit: "% of value lost vs the dollar",
        why: "The slide was never steady; it came in bursts, and naming the decades shows the rupee has been broadly stable against the dollar for long stretches.", read: "How much of its dollar value the rupee lost in each decade. The 1960s devaluation, the 1980s and the 1991 crisis decade did most of the damage; the 2000s were almost flat.", watch: "Pre-1970 decades are fixed pegs, so a near-zero decade is policy holding the line, not a free market judging the rupee strong." },
      { chart: "multiLine", title: "Did the rupee fall, or did the dollar rise?", size: "feature", beat: "rupee-vs-currencies", subtitle: "The rupee's value against four big currencies since 1999. It slid most against the dollar, far less against the pound and yen.", unit: "value of the rupee (1999 = 100)",
        series: [ { indicator: "derived.IN.fx.rupee_value_vs_usd", label: "vs US dollar" }, { indicator: "derived.IN.fx.rupee_value_vs_eur", label: "vs euro" }, { indicator: "derived.IN.fx.rupee_value_vs_gbp", label: "vs pound" }, { indicator: "derived.IN.fx.rupee_value_vs_jpy", label: "vs yen" } ],
        indicator: "derived.IN.fx.rupee_value_vs_usd",
        why: "The rupee did not weaken evenly against everything; it fell hardest against the dollar and far less against the pound and yen, so much of the 'weakness' is really dollar strength.", read: "The rupee's value against four major currencies since 1999, each set to 100. The dollar line falls the most; against the pound and yen the rupee held up far better.", watch: "These are bilateral pairs, not the trade-weighted average; the yen and pound had their own weak spells, which flatters the rupee here." },
      { indicator: "derived.IN.fx.peer_fall_vs_usd", chart: "tableBars", title: "The rupee was not alone", size: "feature", beat: "peer-comparison", subtitle: "How far every major currency fell against a strong dollar since 2000. The rupee sits mid-pack, not among the worst.", unit: "% of value lost vs the dollar, 2000-2025",
        why: "The most freeing chart in the article: a currency's price is relative, and against a strong dollar most currencies lost ground, with the rupee sitting mid-pack among emerging markets, far from the worst.", read: "How far each major currency fell against the dollar since 2000. The Brazilian real, South African rand and Mexican peso fell more than the rupee; several currencies, including the franc, euro, yuan and baht, actually gained. The rupee is a normal emerging-market currency, not an outlier.", watch: "A loss against the dollar is not a loss against everything; the dollar was unusually strong over this period, and these are bilateral dollar pairs, not trade-weighted." },
      // --- ACT 2: A PEGGED INHERITANCE, AND TWO DEVALUATIONS (1947-1991) ---
      { indicator: "derived.IN.reserves.total_usd.monthly", chart: "line", title: "From a fortnight of imports to over six hundred billion dollars", size: "feature", window: "full", beat: "reserves-arc", subtitle: "India's stockpile of foreign currency and gold. This buffer shrank to almost nothing in 1991 and now ranks among the world's largest.",
        why: "The 1991 devaluation was not a choice, it was a near-default: India had almost run out of dollars.", read: "India's total foreign reserves including gold. The 1991 trough is about $1 billion, barely two-three weeks of imports; the modern surge runs past $680 billion.", watch: "Dollar values, so partly the size of the economy; but the 1991 collapse and the modern cushion are both real and enormous." },
      { indicator: "macro.current_account_usd", chart: "line", title: "The deficit that sets off every crisis", size: "feature", window: "full", beat: "current-account", subtitle: "India's current-account balance, the gap between what the country earns abroad and what it spends. It turns into a dollar squeeze whenever foreign money stops coming.",
        why: "Behind every rupee crisis is the same trigger: India spending more abroad than it earns, so it must pull in foreign money to bridge the gap, and when that money stops, the rupee breaks.", read: "India's current-account balance since the 1950s. The deficit yawned to a record near $88 billion in 2012-13, just before the rupee's 2013 plunge; it was only near balance before 1991 because imports had been throttled to almost nothing.", watch: "A deficit is normal for a developing economy importing capital; it turns dangerous only when it is large and financed by flighty money. Services exports and remittances shrink it well below the goods gap." },
      { indicator: "IN.rates.policy_rate.monthly", chart: "line", title: "The price of money, through every regime", size: "small", window: "full", beat: "policy-rate", subtitle: "The RBI's main interest rate over the decades: towering in the controlled era, spiking to defend the rupee in crises, calmer today.",
        why: "The interest-rate backdrop to the whole story: sky-high in the controlled era, spiking to defend the rupee in crises, low and steadier today.", read: "The RBI's main policy rate since the 1940s. It towered in the 1970s-90s, was hiked hard to defend the rupee in 1998 and 2013, and trended down in the inflation-targeting era.", watch: "The policy rate is one lever among many; a rate spike often signals a currency or inflation scare, it does not by itself set the exchange rate." },
      // --- ACT 3: LEARNING TO FLOAT, AND WHAT THE RBI ACTUALLY DOES ---
      { chart: "multiLine", title: "The rupee's monthly trading range", size: "small", beat: "managed-float", subtitle: "The highest and lowest the rupee touched within each month. The band is so tight it reveals how much the RBI smooths the currency.", unit: "INR per USD",
        series: [ { indicator: "IN.fx.inr_usd_month_high.monthly", label: "Month's weakest" }, { indicator: "IN.fx.inr_usd_month_low.monthly", label: "Month's strongest" } ],
        indicator: "IN.fx.inr_usd_month_high.monthly",
        why: "A genuine free float would swing wildly; the rupee's tight monthly band is the fingerprint of management.", read: "The highest and lowest rupee-dollar rate within each month. The gap is usually small, widening only in crisis months.", watch: "A narrow band is partly calm markets and partly RBI smoothing; the two are hard to separate from price alone." },
      { indicator: "IN.fx.rbi_net_intervention_usd.monthly", chart: "line", title: "What the RBI actually does in the market", size: "feature", window: "full", beat: "intervention", subtitle: "How many dollars the RBI bought or sold each month: buying to hold the rupee down in calm times, selling hard to defend it in a crisis.",
        why: "The central bank says it only curbs volatility; its dollar buying and selling shows what that means month to month.", read: "Net RBI dollar purchases each month: positive when it buys dollars (selling rupees to stop appreciation), sharply negative when it sells dollars to defend the rupee in a crisis.", watch: "This is spot intervention only; the forward book below is the other, larger, half of the story." },
      { chart: "multiLine", title: "The tide the central bank leans against", size: "feature", beat: "fpi-vs-intervention", subtitle: "Foreign investors' stock-and-bond flows alongside the RBI's dollar trades. When hot money rushes out, the RBI sells dollars to cushion the fall.", unit: "US$ millions",
        series: [ { indicator: "IN.extfin.net_fpi_usd.monthly", label: "Net foreign portfolio flows" }, { indicator: "IN.fx.rbi_net_intervention_usd.monthly", label: "RBI net dollar purchases" } ],
        indicator: "IN.extfin.net_fpi_usd.monthly",
        why: "RBI research finds the rupee is moved mainly by volatile foreign portfolio flows, not by inflation; intervention leans against that tide.", read: "Net foreign portfolio investment against RBI intervention. When foreigners pull money out (a sharp negative), the RBI sells dollars to cushion the fall.", watch: "Correlation, not proof; but the two move together in every stress episode, exactly as the RBI's own study describes." },
      { indicator: "IN.fx.rbi_forward_book_usd.monthly", chart: "line", title: "The hundred-billion-dollar shadow defence", size: "small", window: "full", beat: "forward-book", subtitle: "The RBI's hidden forward position: dollars it has promised to deliver later, a way to defend the rupee today without spending visible reserves.",
        why: "Modern intervention increasingly hides in the forwards market, off the visible spot reserves.", read: "The RBI's outstanding net forward dollar position. Deeply negative by 2026, over $100 billion of dollar sales promised forward to defend the rupee without spending spot reserves yet.", watch: "A forward sale defers the reserve hit; a large negative book is firepower already committed, not free cushion." },
      { chart: "multiLine", title: "Patient money and hot money", size: "feature", beat: "fdi-vs-fpi", subtitle: "Sticky factory-building investment against fast-moving stock-market money. It is the second kind that whipsaws the rupee.", unit: "US$ millions",
        series: [ { indicator: "IN.extfin.net_fdi_usd.monthly", label: "Direct investment (patient)" }, { indicator: "IN.extfin.net_fpi_usd.monthly", label: "Portfolio flows (hot)" } ],
        indicator: "IN.extfin.net_fdi_usd.monthly",
        why: "Not all foreign money behaves the same: direct investment is sticky and builds factories, portfolio money is fast and can leave in a week, and it is the second kind that whipsaws the rupee.", read: "Net foreign direct investment against net portfolio flows. FDI is relatively steady; portfolio flows swing violently, turning to large outflows in every global scare.", watch: "FDI is lumpy and revised; the point is the contrast in volatility, not any single month's figure." },
      { chart: "multiLine", title: "What really moves the rupee", size: "small", beat: "global-drivers", subtitle: "When the dollar strengthens against all emerging markets, the rupee falls with the pack. The two lines mirror each other.", unit: "index", fromYear: 2006,
        series: [ { indicator: "derived.IN.fx.idx_rupee_vs_usd", label: "Rupee vs the dollar (down = weaker)" }, { indicator: "extfin.driver.usd_em_index", label: "Global dollar strength (up = stronger dollar)" } ],
        indicator: "derived.IN.fx.idx_rupee_vs_usd",
        why: "The rupee's worst stretches line up with a globally strong dollar, not with India-specific news: when the dollar rises against all emerging markets, the rupee falls with the pack.", read: "The rupee against the dollar alongside a broad index of the dollar's strength versus emerging-market currencies. When the dollar index climbs, the rupee line slides.", watch: "Two different indices on one frame; read the mirror-image shape, not the levels. The dollar is one driver among several." },
      { chart: "line", title: "How tightly the RBI actually held the rupee", size: "feature", beat: "regime-volatility", unit: "INR per USD", fromYear: 2000,
        subtitle: "The rupee against the dollar, split into the RBI's unspoken regimes. The labels mark how freely it was allowed to move: the steadier the line, the tighter the grip.",
        indicator: "IN.fx.inr_usd.monthly",
        bands: [ { year: 2002, label: "very steady" }, { year: 2005, label: "freer" }, { year: 2010, label: "swung hard" }, { year: 2018, label: "freer" }, { year: 2024, label: "barely moved" } ],
        why: "The clearest 'words versus deeds' evidence: the RBI never announces how hard it is managing the rupee, but how much the rupee moves in each regime gives it away.", read: "The rupee's climb, marked into the de-facto regimes Sengupta and Shah identify. The volatility label on each stretch shows how freely it was allowed to move: about 2% in the calm early 2000s, near 8% through the 2007-2013 crisis years, and a remarkable 0.9% from late 2023 to end-2024 before it was let loose.", watch: "Volatility is our own calculation from monthly INR/USD; the regime break dates are from Sengupta and Shah. Low volatility can also reflect calm markets, not only intervention." },
      // --- ACT 4: WHAT THE NUMBER NEVER TOLD YOU (THE REVEAL) ---
      { chart: "multiLine", title: "The rupee collapsed. Or did it?", size: "hero", beat: "nominal-vs-real", subtitle: "The rupee three ways since 1994: crashing against the dollar, falling less on a trade-weighted basis, and almost flat once inflation is stripped out.", unit: "index (Jan 1994 = 100)",
        series: [ { indicator: "derived.IN.fx.idx_rupee_vs_usd", label: "Against the US dollar" }, { indicator: "derived.IN.fx.idx_neer_broad", label: "Trade-weighted (nominal)" }, { indicator: "derived.IN.fx.idx_reer_broad", label: "Trade-weighted, inflation-adjusted (REER)" } ],
        indicator: "derived.IN.fx.idx_reer_broad",
        why: "The single chart that overturns the panic: against the dollar the rupee fell to a third, but in real trade-weighted terms it barely moved.", read: "All three start at 100 in 1994. The dollar line falls to about 34, the nominal trade-weighted line to about 41, but the inflation-adjusted REER ends near 97, almost exactly where it began.", watch: "REER stability is not the same as the rupee being correctly valued; it means the fall mostly tracked the inflation gap, not lost worth." },
      { chart: "multiLine", title: "The real rupee across fifty years", size: "feature", beat: "long-reer", subtitle: "The rupee's inflation-adjusted value since 1975: overvalued under the old pegs, sharply corrected in 1991, then broadly stable.", unit: "index (1985 = 100)",
        series: [ { indicator: "IN.fx.reer_36c.monthly", label: "Real (REER)" }, { indicator: "IN.fx.neer_36c.monthly", label: "Nominal (NEER)" } ],
        indicator: "IN.fx.reer_36c.monthly",
        why: "Zoom out to half a century and the real rupee tells a story of correction, not collapse.", read: "The RBI's 36-country REER and NEER from 1975. The real rupee was overvalued in the 1970s-80s, was sharply corrected in 1991, bottomed in the mid-90s, then drifted back to a stable range.", watch: "Post-2020 this 1985-base 36-currency line is chain-linked to RBI's 40-currency successor (RBI discontinued the 36c basket end-2021), so compare the shape across the join, not exact levels against the other indices." },
      { chart: "multiLine", title: "Why the rupee had to fall", size: "feature", beat: "inflation-gap", subtitle: "The cost of living in India versus the US since 1991. India's climbs far higher, and that gap is roughly what the rupee had to give up.", unit: "index (1991 = 100)",
        series: [ { indicator: "derived.IN.prices.cpi_cum_in", label: "Cost of living in India" }, { indicator: "derived.IN.prices.cpi_cum_us", label: "Cost of living in the US" } ],
        indicator: "derived.IN.prices.cpi_cum_in",
        why: "The engine under the whole story: since 1991 Indian prices have risen far more than American prices, and a currency cannot hold a fixed dollar value while its prices outrun the other country's.", read: "The cost of living in India and the US, both set to 100 in 1991. India's line climbs far higher, and that widening gap is roughly the amount the rupee had to give up against the dollar.", watch: "Cumulative inflation, not the exchange rate; it explains the direction and rough size of the fall, not the month-to-month moves." },
      { chart: "multiLine", title: "How much of the fall is just inflation?", size: "feature", beat: "ppp", subtitle: "The actual rupee-dollar rate against the rate inflation alone would justify. Inflation explains most of the fall, but the rupee overshoots it.", unit: "INR per USD", fromYear: 1994,
        series: [ { indicator: "IN.fx.inr_usd.monthly", label: "Actual rate" }, { indicator: "derived.IN.fx.inr_usd_ppp_implied", label: "If only inflation mattered" } ],
        indicator: "IN.fx.inr_usd.monthly",
        why: "Inflation differences explain the direction of the fall, but not all of it, and the gap is the honest part of the story.", read: "The actual rupee-dollar rate against the rate implied purely by the India-US inflation gap since 1994. The actual rate falls further: the rupee overshoots pure inflation maths.", watch: "Bilateral PPP is a weak predictor; the overshoot reflects capital flows and dollar strength, which is why the trade-weighted REER, not this line, is the truer gauge." },
      { chart: "multiLine", title: "Why a higher-inflation currency drifts down", size: "small", beat: "inflation-diff", subtitle: "Year-on-year inflation in India and the US. India's has sat above America's for decades, the gap the rupee keeps having to offset.", unit: "% year-on-year", fromYear: 1954,
        series: [ { indicator: "IN.prices.cpi_yoy_bis.monthly", label: "India inflation" }, { indicator: "US.prices.cpi_yoy_bis.monthly", label: "US inflation" } ],
        indicator: "IN.prices.cpi_yoy_bis.monthly",
        why: "The mechanism under the whole story: India has run higher inflation than the US for decades, so the rupee must fall to keep trade competitive.", read: "Year-on-year inflation in India and the US. India's line sits persistently above the US line, the gap that the exchange rate has to offset over time.", watch: "Year-to-year the link is loose; it is the cumulative gap over decades that drives the currency, not any single year." },
      { chart: "multiLine", title: "Is the rupee just a number?", size: "feature", beat: "dual-currency-exports", subtitle: "The same Indian exports measured in rupees and in dollars. The rupee line looks like a miracle, and the gap between them is purely the exchange rate.", unit: "index (1970 = 100, log scale)", logScale: true,
        series: [ { indicator: "derived.IN.trade.exports_idx_inr", label: "Exports measured in rupees" }, { indicator: "derived.IN.trade.exports_idx_usd", label: "Exports measured in dollars" } ],
        indicator: "derived.IN.trade.exports_idx_inr",
        why: "The same exports look like a miracle in rupees and a steady climb in dollars; the entire gap is the exchange rate.", read: "India's merchandise exports since 1970, indexed in each currency. The rupee line ends far above the dollar line, and the ratio between them is almost exactly the rupee's depreciation.", watch: "A log scale, so equal vertical steps are equal percentage gains; the gap is a measurement effect, not extra exports." },
      // --- ACT 5: DID YOU ACTUALLY LOSE MONEY? ---
      { chart: "multiLine", title: "Did you actually lose money?", size: "hero", beat: "counterfactual", subtitle: "One rupee left in a bank deposit since 1970 against the rising cost of living. The saved rupee stays ahead; cash under the mattress loses almost everything.", unit: "rupees (1970 = 1)",
        series: [ { indicator: "derived.IN.savings.fd_nominal", label: "One rupee in a bank deposit" }, { indicator: "derived.IN.savings.cost_of_living", label: "Cost of living" }, { indicator: "derived.IN.savings.fd_real", label: "The deposit, after inflation" } ],
        indicator: "derived.IN.savings.fd_nominal",
        why: "The reframe that defuses the debasement panic: nobody holds wealth in cash, and a banked rupee kept its purchasing power.", read: "One rupee left in a simple 1-3 year deposit since 1970 against the cost of living. The deposit grows faster than prices and ends ahead in real terms, while cash under a mattress would have lost almost everything.", watch: "The real gain depends on which inflation series you trust, somewhere between about 1.3 and 1.7 times; interest tax would trim it. The point is the direction, not the decimal." },
      { indicator: "derived.IN.rates.real_deposit_rate", chart: "line", title: "When even the bank lost to inflation", size: "small", window: "full", beat: "real-deposit-rate", subtitle: "What a bank deposit paid after subtracting inflation. Negative through the repression decades, reliably positive only after the 1990s reforms.",
        why: "The honest other half of the savings story: in the controlled decades the interest a deposit paid was less than inflation, so even the careful saver lost ground, until liberalisation turned real rates positive.", read: "The return on a bank deposit after subtracting inflation. It dips below zero in the 1970s-80s repression years, then turns reliably positive after the 1990s reforms.", watch: "A single representative deposit rate against one inflation series; the level is approximate, the sign and the era-shift are the robust signal." },
      // --- ACT 6: WHAT IT COSTS YOU ---
      { chart: "multiLine", title: "Why petrol hurts more here", size: "feature", beat: "oil-two-currencies", subtitle: "The price of crude oil in dollars and in rupees since 2000. The rupee line climbs higher because a weaker currency stacks on top of the world price.", unit: "index (Jan 2000 = 100)",
        series: [ { indicator: "derived.IN.energy.brent_inr_idx", label: "Oil in rupees" }, { indicator: "derived.IN.energy.brent_usd_idx", label: "Oil in dollars" } ],
        indicator: "derived.IN.energy.brent_inr_idx",
        why: "India imports most of its oil in dollars, so a weaker rupee raises the pump price even when world oil is flat.", read: "Brent crude since 2000 in dollars and in rupees. The rupee line sits above the dollar line, the depreciation stacked on top of the world price.", watch: "Retail petrol also carries large taxes and is not a pure passthrough; this is the import-cost channel, not the pump price itself." },
      { indicator: "IN.trade.imports_oil_usd.annual", chart: "line", title: "The petroleum bill the rupee has to pay", size: "small", window: "full", beat: "oil-bill", subtitle: "India's annual bill for imported oil, its single biggest dollar outflow and the main way a weak rupee feeds straight into inflation.",
        why: "Oil is India's single biggest import and the main reason a weak rupee feeds straight into inflation.", read: "India's annual oil import bill in dollars, swinging with both the world price and the volume the country burns.", watch: "Driven by the world oil price as much as by the rupee; the currency amplifies the bill, it does not set it." },
      { indicator: "IN.extfin.usd_credit_nonbank.quarterly", chart: "line", title: "The dollar debt a weak rupee makes heavier", size: "small", window: "full", beat: "dollar-debt", subtitle: "Dollar-denominated debt owed by Indian companies and other non-banks. A weaker rupee raises the rupee cost of repaying it, which is what bit unhedged borrowers in the 2013 panic.",
        why: "Beyond importers and travellers, a weak rupee squeezes borrowers who owe in dollars: the dollar figure is flat but the rupee bill rises.", read: "BIS data on dollar-denominated credit to Indian non-bank borrowers, from about $14bn in 2005 to a peak near $142bn in 2020, easing to ~$118bn by end-2025.", watch: "This is only the dollar-denominated, non-bank slice of external debt, not government or rupee debt; the level matters less than the fact it must be serviced in dollars." },
      { indicator: "IN.extfin.remittances_received_usd.annual", chart: "line", title: "The other side: a weak rupee pays the diaspora more", size: "small", window: "full", beat: "remittances", subtitle: "The money Indians abroad send home each year. A falling rupee quietly turns each of those dollars into more rupees for families.",
        why: "Depreciation is not all cost: India is the world's largest remittance recipient, and every weaker rupee turns each sent dollar into more rupees at home.", read: "Personal remittances received by India each year, climbing past $100 billion, the inflow that a falling rupee quietly makes more valuable to families.", watch: "A weaker rupee lifts the rupee value of remittances but not the dollar amount; senders' wages abroad, not the exchange rate, set the dollars." },
      { chart: "multiLine", title: "Why India always needs more dollars", size: "small", beat: "trade-gap", subtitle: "India's exports against its imports. The country buys more from the world than it sells, so it is forever in need of dollars.", unit: "US$ millions",
        series: [ { indicator: "IN.trade.exports_total_usd.annual", label: "Exports" }, { indicator: "IN.trade.imports_total_usd.annual", label: "Imports" } ],
        indicator: "IN.trade.imports_total_usd.annual",
        why: "Underneath the currency sits a simple fact: India buys more from the world than it sells, so it constantly needs dollars, which is why capital flows and remittances matter so much.", read: "India's merchandise exports and imports in dollars. Imports run persistently above exports, the goods trade gap that the rupee and the inflows have to cover.", watch: "Goods trade only; India's services exports and remittances offset much of this gap, which is why the rupee has not fallen even faster." }
    ]
  },


  {
    id: "q.media.news_consumption",
    slug: "how-india-consumes-news",
    question: "How does India consume news?",
    priority: "core",
    // Blended across SIX independent sources, built on a "two Indias" spine. The Reuters Digital
    // News Report is the survey everyone quotes, but it samples only English-speaking, online users
    // and says so itself. The honest article puts that surveyed slice next to the India it under-
    // counts: TRAI/MoSPI/IAMAI on who is actually online (rural>urban, a sharp gender divide),
    // PRGI on the Hindi-vs-English print reality, and FICCI-EY on where the money went (digital
    // overtook TV in 2024). Stance: confident about what each source measures, scrupulous about the
    // gap between the surveyed slice and the 1.4bn. The gap IS the story; never present the DNR slice
    // as "India".
    indicators: ["media.news.dnr_trust"],
    core: [
      "media.news.dnr_trust",
      "media.news.dnr_source_tv",
      "media.news.dnr_source_print",
      "media.news.dnr_platform_youtube",
      "media.news.dnr_platform_whatsapp",
      "society.trai.broadband_subscribers_total",
      "media.access.mospi_internet_use_gender",
      "media.news.iamai_news_users_2024",
      "media.industry.ficci_digital",
      "media.industry.ficci_television",
      "media.news.dnr_brand_trust_2026"
    ],
    context: [
      "media.news.dnr_source_online",
      "media.news.dnr_source_social",
      "media.news.dnr_platform_instagram",
      "media.news.dnr_platform_facebook",
      "media.news.dnr_platform_telegram",
      "media.news.dnr_smartphone",
      "media.access.trai_penetration",
      "media.access.trai_data_gb",
      "media.access.iamai_aiu",
      "media.access.iamai_aiu_split_2024",
      "media.access.mospi_hh_internet",
      "media.industry.ficci_print",
      "media.industry.ficci_film",
      "media.industry.ficci_radio",
      "media.print.registered_by_language",
      "media.print.circulation_by_language",
      "media.print.circ_total",
      "media.print.circ_hindi",
      "media.print.circ_english",
      "media.news.social_media_hours",
      "media.news.online_news_audience",
      "media.print.ad_revenue",
      "media.print.circulation_revenue"
    ],
    visualPlan: [
      // ACT 1 - The survey everyone quotes (the online-English slice)
      { chart: "line", indicator: "media.news.dnr_trust", size: "hero", beat: "survey", window: "full", unit: "% who trust most news most of the time",
        subtitle: "Reuters Institute Digital News Report · India · surveyed online, English-speaking users · 2021-2026",
        title: "Do Indians trust the news?",
        why: "The single most-quoted number about Indian news, and the one that needs the most context.",
        read: "Each point is the share of surveyed online Indians who say they trust most news most of the time. It wobbles between 38% and 43% and sits at 39% in 2026, just above the global average.",
        watch: "This is not 'India'. The DNR samples mainly English-speaking, online users, who are younger, richer and more urban than the country as a whole." },
      { chart: "multiLine", indicator: "media.news.dnr_platform_youtube", size: "feature", beat: "survey", unit: "% using each platform for news",
        subtitle: "Reuters DNR · India · platforms used for news in the last week · surveyed online users",
        title: "How the connected slice gets its news",
        series: [
          { indicator: "media.news.dnr_platform_youtube", label: "YouTube" },
          { indicator: "media.news.dnr_platform_whatsapp", label: "WhatsApp" },
          { indicator: "media.news.dnr_platform_instagram", label: "Instagram" },
          { indicator: "media.news.dnr_platform_facebook", label: "Facebook" }
        ],
        why: "Among the online slice, news now arrives through video and chat apps, not front pages.",
        read: "Each line is the share using that platform for news. YouTube leads near 58%, WhatsApp jumps to 56% in 2026, Instagram is rising fast.",
        watch: "These are platforms used for news, not trusted for it; WhatsApp was also named the biggest source of false information." },

      // ACT 2 - But who got counted? (who is actually online)
      { chart: "line", indicator: "society.trai.broadband_subscribers_total", size: "feature", beat: "who-online", window: "full", unit: "broadband subscribers (million)",
        subtitle: "TRAI monthly Telecom Subscription reports · total broadband subscribers · 2008-2026",
        title: "The India that came online",
        why: "Before asking how India consumes digital news, see how recently and how fast it got online at all.",
        read: "Each point is total broadband subscriptions. The line is almost flat until about 2016, then explodes past a billion as cheap 4G data arrives.",
        watch: "These are subscriptions, not people; one person can hold several, so this overstates unique users." },
      { chart: "tableBars", indicator: "media.access.mospi_internet_use_gender", size: "feature", beat: "who-online", unit: "% of persons 15+ able to use the internet",
        subtitle: "MoSPI · NSS Comprehensive Modular Survey: Telecom 2025 · nationally representative",
        title: "Who can actually use the internet",
        why: "The official, nationally-representative survey shows the divide the online polls cannot see.",
        read: "Each bar is the share of people who can use the internet. Urban men lead at 86%; rural women trail at 58%, a near-28-point gap.",
        watch: "'Able to use' is self-reported capability, not daily use; the gap in actual news-seeking is likely wider still." },
      { chart: "tableBars", indicator: "media.access.trai_penetration", size: "small", beat: "who-online", unit: "internet subscribers per 100 people",
        subtitle: "TRAI · internet subscribers per 100 population · end-March 2025",
        title: "Town and country, online",
        why: "The connectivity gap between urban and rural India in one ratio.",
        read: "Urban India has about 111 internet subscriptions per 100 people; rural India has 45. The all-India figure of 69 hides that split.",
        watch: "Subscriptions can exceed population in cities because of multiple SIMs and work connections; this is supply, not unique users." },

      // ACT 3 - What the connected slice actually does
      { chart: "multiLine", indicator: "media.news.dnr_source_tv", size: "feature", beat: "what-they-do", unit: "% using each source weekly",
        subtitle: "Reuters DNR · India · weekly use of TV and print for news · surveyed online users",
        title: "Even online, TV and print are fading",
        series: [
          { indicator: "media.news.dnr_source_tv", label: "Television" },
          { indicator: "media.news.dnr_source_print", label: "Print" }
        ],
        why: "Within the same surveyed slice, the old formats are losing weekly reach year on year.",
        read: "Both lines slope down: weekly TV use falls from 59% to 44%, print from 50% to 35%, between 2021 and 2026.",
        watch: "This is decline among online users only; nationally, TV and print reach is far higher and falling more slowly." },
      { chart: "latestBars", indicator: "media.news.dnr_platform_youtube", size: "feature", beat: "what-they-do", unit: "% using each platform for news (2026)",
        subtitle: "Reuters DNR · India · share using each platform for news in 2026 · surveyed online users",
        title: "The 2026 pecking order for news",
        series: [
          { indicator: "media.news.dnr_platform_youtube", label: "YouTube" },
          { indicator: "media.news.dnr_platform_whatsapp", label: "WhatsApp" },
          { indicator: "media.news.dnr_platform_instagram", label: "Instagram" },
          { indicator: "media.news.dnr_platform_facebook", label: "Facebook" },
          { indicator: "media.news.dnr_platform_telegram", label: "Telegram" }
        ],
        why: "A snapshot of where the online slice turned for news in the latest year.",
        read: "Each bar is the 2026 share using that platform for news. YouTube (58%) and WhatsApp (56%) lead; WhatsApp rose 10 points in a single year.",
        watch: "Closed and video platforms are hard to fact-check and easy to forward, which is why misinformation worries track them." },
      { chart: "line", indicator: "media.news.dnr_smartphone", size: "small", beat: "what-they-do", window: "full", unit: "% using a smartphone for news",
        subtitle: "Reuters DNR · India · smartphone as a source for news · surveyed online users",
        title: "A phone-first newsroom",
        why: "For the online slice, the news device is overwhelmingly the phone.",
        read: "Around three in four surveyed users reach news on a smartphone, far ahead of computers.",
        watch: "Among online users only; but it mirrors the wider fact that India came online on mobile, not desktop." },
      { chart: "line", indicator: "media.news.social_media_hours", size: "small", beat: "what-they-do", window: "full", unit: "billion hours per quarter",
        subtitle: "FICCI-EY Media & Entertainment report · time Indians spend on social media, per quarter",
        title: "The attention is moving to the feed",
        why: "News is competing for attention inside apps where time spent keeps climbing.",
        read: "Quarterly hours on social media rose from about 103 billion in early 2022 to about 173 billion by late 2025.",
        watch: "This is total social-media time, not news time; news is a sliver of it, increasingly delivered inside the same feeds." },
      { chart: "line", indicator: "media.news.online_news_audience", size: "feature", beat: "what-they-do", window: "full", unit: "online news audience (million)",
        subtitle: "Comscore (December each year), via FICCI-EY · reach of online news platforms in India",
        title: "AI just started eating the news audience",
        why: "For the first time, the online news audience shrank, and the industry blames AI.",
        read: "The reach of online news platforms rose to about 461 million in 2024, then fell about 9% to 428 million in 2025. Industry stakeholders blame AI search summaries and AI apps answering questions without sending readers on; some say their own reach fell over 30%.",
        watch: "This is platform reach measured by Comscore, a different lens from survey self-reports; online news still reaches roughly 29% of Indians, so the medium is large even as it dips." },

      // ACT 4 - The India the survey under-counts
      { chart: "multiLine", indicator: "media.print.circ_total", size: "feature", beat: "undercounted", unit: "claimed circulation (million copies/day)",
        subtitle: "CSO/MoSPI (2008-2014) + PRGI Press in India (2018-2024) · claimed circulation · gap years not shown",
        title: "India's print boom, and its recent slip",
        series: [
          { indicator: "media.print.circ_total", label: "All languages" },
          { indicator: "media.print.circ_hindi", label: "Hindi" },
          { indicator: "media.print.circ_english", label: "English" }
        ],
        why: "While Western newspapers were collapsing, Indian print circulation roughly doubled through the 2010s, led by Hindi, and has only recently begun to slip.",
        read: "Each line is claimed daily circulation. Total copies rose from about 258m (2008) to a peak near 450m in the mid-2010s, then eased to about 379m by 2023-24. English was always a small slice and is now shrinking.",
        watch: "Claimed circulation is self-declared and unaudited, and depends on how many publishers filed that year; read the broad arc, not single-year values. Early years are CSO/MoSPI, later years PRGI; some years are not plotted." },
      { chart: "tableBars", indicator: "media.print.circulation_by_language", size: "feature", beat: "undercounted", unit: "claimed circulation (million copies/day)",
        subtitle: "PRGI · Press in India 2023-24 · self-declared circulation by language",
        title: "The news India actually reads on paper",
        why: "The English-online survey misses the language in which most Indians read the news.",
        read: "Each bar is claimed daily circulation by language. Hindi (187m) and the regional languages dwarf English (40m).",
        watch: "Circulation here is self-declared by publishers and not verified by PRGI; treat it as indicative and likely inflated." },
      { chart: "tableBars", indicator: "media.print.registered_by_language", size: "small", beat: "undercounted", unit: "registered periodicals",
        subtitle: "PRGI · Press in India 2023-24 · registered periodicals by language",
        title: "...and the titles behind it",
        why: "The sheer number of vernacular titles shows where the news ecosystem really lives.",
        read: "Hindi has about 58,600 registered periodicals and English about 20,200; regional languages add tens of thousands more.",
        watch: "'Registered' is a cumulative stock; only about a quarter of registered titles actually filed a return this year." },
      { chart: "tableBars", indicator: "media.news.iamai_news_users_2024", size: "feature", beat: "undercounted", unit: "internet users (million)",
        subtitle: "IAMAI-Kantar ICUBE 2024 · online news users among 886m active internet users",
        title: "Seeing news vs seeking news",
        why: "Even among those online, deliberately reading news is far rarer than bumping into it.",
        read: "About 582m internet users encounter news online (in forwards, feeds, videos), but only 180m consciously seek it out.",
        watch: "'Encounter' includes passive exposure via WhatsApp forwards and YouTube; it is not the same as following the news." },
      { chart: "tableBars", indicator: "media.access.iamai_aiu_split_2024", size: "small", beat: "undercounted", unit: "active internet users (million)",
        subtitle: "IAMAI-Kantar ICUBE 2024 · active internet users by area",
        title: "The internet's centre of gravity moved to the village",
        why: "The online India of 2024 is more rural than the English-online survey implies.",
        read: "Rural India now has more active internet users (488m) than urban India (397m).",
        watch: "Rural users skew toward video and Indic-language content and are largely invisible to an English online panel." },

      // ACT 5 - Follow the money
      { chart: "multiLine", indicator: "media.industry.ficci_digital", size: "hero", beat: "money", unit: "industry revenue (INR billion)",
        subtitle: "FICCI-EY Media & Entertainment report · segment revenue · 2022-2025",
        title: "The year digital overtook television",
        series: [
          { indicator: "media.industry.ficci_digital", label: "Digital" },
          { indicator: "media.industry.ficci_television", label: "Television" },
          { indicator: "media.industry.ficci_print", label: "Print" },
          { indicator: "media.industry.ficci_film", label: "Film" },
          { indicator: "media.industry.ficci_radio", label: "Radio" }
        ],
        why: "Audiences and advertisers move together; the money confirms where attention went.",
        read: "Digital revenue crossed television in 2024 and kept climbing past a trillion rupees; TV is sliding, print is flat, radio is tiny.",
        watch: "This is industry revenue, not audience reach; TV and print still reach far more people than their shrinking revenue suggests." },

      // ACT 6 - Who Indians trust + the honesty close
      { chart: "tableBars", indicator: "media.news.dnr_brand_trust_2026", size: "feature", beat: "trust", unit: "% who trust the brand (2026)",
        subtitle: "Reuters DNR · India · trust in individual news brands · surveyed online users",
        title: "Which brands the online slice trusts",
        why: "When you ask about specific brands, public broadcasters and old print mastheads come out on top.",
        read: "Legacy newspapers and public broadcasters (Times of India, All India Radio, DD India, BBC) score highest; partisan TV and critical digital-born outlets score lower.",
        watch: "Low scores can mean a brand is distrusted OR is critical of power and actively disliked by some; this is not a quality ranking." }
    ]
  },
  {
    id: "q.policy.internet_control",
    slug: "indias-off-switch",
    question: "When does India switch off the internet, and does it actually work?",
    priority: "core",
    // Built Jun 2026. Trigger: the June 2026 nationwide Telegram block (NEET re-exam
    // paper-leak fears), now before the Delhi High Court as the first real test of
    // whether Section 69A can lawfully kill an entire platform. Frame: India's three
    // distinct off-switches (regional shutdowns under the Telegraph Act / Temporary
    // Suspension Rules; app/platform bans and URL blocks under IT Act s.69A; ISP-level
    // DNS blocking). Sources: SFLC.in Internet Shutdowns Tracker (live JSON endpoints,
    // 2012-2026); dnsblocks.in "Poisoned Wells" blocklist (43,083 domains x 6 ISPs);
    // Access Now / #KeepItOn STOP dataset (India platform blocks); MeitY s.69A counts
    // disclosed to Parliament; Top10VPN cost estimates. Ingest: scripts/ingest-offswitch.py.
    // Honesty spine: the most-invoked justification (stopping violence) is the one the
    // best evidence (Rydzak 2019) contradicts; most DNS blocking is piracy/vice, not
    // speech; every count is a documented floor because orders are secret by rule.
    indicators: [
      "policy.blocking.app_bans",
      "policy.shutdowns.annual",
      "policy.shutdowns.by_state",
      "policy.shutdowns.state_ranked",
      "policy.shutdowns.preventive",
      "policy.shutdowns.reactive",
      "policy.shutdowns.duration",
      "policy.blocking.urls_annual",
      "policy.blocking.dns_by_category",
      "policy.blocking.dns_by_isp",
      "policy.shutdowns.cost_usd",
      "policy.blocking.platform_events",
      "policy.blocking.urls_by_platform_total",
      "policy.blocking.authority_split",
      "policy.blocking.urls_facebook",
      "policy.blocking.urls_x",
      "policy.blocking.urls_youtube",
      "policy.blocking.urls_instagram",
      "policy.blocking.urls_others"
    ],
    // Curated "Further reading" — durable here in the registry so it survives
    // explanation regeneration (merged into explanation.furtherReading at build time).
    furtherReading: [
      { label: "SFLC.in — Internet Shutdowns Tracker (the live database behind this page)", url: "https://internetshutdowns.in/" },
      { label: "Jan Rydzak, ‘Of Blackouts and Bandhs’ (2019) — the study finding shutdowns track more violence, not less", url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3330413" },
      { label: "Anuradha Bhasin v. Union of India (Supreme Court, 2020) — shutdowns must be temporary, proportionate and published", url: "https://indiankanoon.org/doc/82461587/" },
      { label: "ICRIER, ‘The Anatomy of an Internet Blackout’ (2018) — the economic-cost study", url: "https://icrier.org/publications/the-anatomy-of-an-internet-blackout-measuring-the-economic-impact-of-internet-shutdowns-in-india/" },
      { label: "Access Now — #KeepItOn 2024 report (India in global context)", url: "https://www.accessnow.org/internet-shutdowns-2024/" }
    ],
    visualPlan: [
      // ACT 1 - There isn't one ban. There are three.
      { chart: "tableBars", indicator: "policy.blocking.app_bans", size: "hero", beat: "taxonomy", unit: "apps blocked in one action", subtitle: "Indica, from MeitY notifications + reporting · major Section 69A app/platform blocks · 2020-2026", title: "The apps India has switched off", why: "Telegram in 2026 was not a one-off: India has a standing power to switch off whole apps, and has used it in waves.", read: "Each bar is one blocking action and how many apps it took down. The 2020 surge (about 224 apps in a year) followed the India-China border clash; the 2026 Telegram block is a single app but roughly 150 million users.", watch: "Bars count apps, not users. Telegram is one app yet dwarfs the others in reach, which is exactly why its block went to court." },

      // ACT 2 - How often, and where
      { chart: "line", indicator: "policy.shutdowns.annual", size: "hero", beat: "scale", unit: "shutdowns per year", subtitle: "SFLC.in Internet Shutdowns Tracker · government-ordered internet suspensions · 2012-2026", title: "How often India goes dark", why: "The simplest measure of the off switch: how many times a year some part of India loses the internet by government order.", read: "Each point is the number of shutdowns recorded in a year. They climb from a handful in 2012 to a peak of 136 in 2018, then fall to 60 in 2024 as courts and scrutiny bit. 2026 is year-to-date.", watch: "A documented floor, not a ceiling: SFLC rebuilds this from news reports because the government rarely publishes shutdown orders. The fall is real but partly reflects fewer, longer blackouts." },
      { chart: "choropleth", indicator: "policy.shutdowns.by_state", size: "feature", beat: "geography", unit: "shutdowns, 2012-2026", rankLabel: "Goes dark most", bottomLabel: "Never recorded", subtitle: "SFLC.in · cumulative government-ordered shutdowns by state · 2012-2026", title: "Where India goes dark", why: "The national count hides a stark geography: shutdowns are not spread across India, they are concentrated in a few places.", read: "Each state is shaded by its cumulative shutdowns. Jammu & Kashmir alone accounts for 453 of 922 (about half of every shutdown India has ever recorded); most of the country has had almost none.", watch: "These are counts of orders, not their length or severity. A region with many short shutdowns can rank above one with a single months-long blackout." },
      { chart: "tableBars", indicator: "policy.shutdowns.state_ranked", size: "feature", beat: "geography-ranked", unit: "shutdowns, 2012-2026", subtitle: "SFLC.in · top 12 states by cumulative recorded shutdowns · 2012-2026", title: "The states that go dark most", why: "The map sharpened into a league table: a handful of states do nearly all of India's switching-off.", read: "Each bar is a state's cumulative shutdowns. Jammu & Kashmir is in a category of its own; Rajasthan is a distant second; the rest trail far behind.", watch: "Cumulative since 2012, so a long-troubled region dominates even if it is quieter now. This is history, not a snapshot of today." },

      // ACT 3 - Most of it happens before anything does
      { chart: "multiLine", indicator: "policy.shutdowns.preventive", series: [ { indicator: "policy.shutdowns.preventive", label: "Preventive (before any event)", color: "#c2476b" }, { indicator: "policy.shutdowns.reactive", label: "Reactive (during an event)", color: "#1f9e8a" } ], size: "feature", beat: "preventive", unit: "shutdowns per year", subtitle: "SFLC.in · shutdowns imposed in anticipation vs in response · 2012-2026", title: "Most blackouts are imposed before anything happens", why: "The justification is usually public safety in a crisis, but the data says most shutdowns are pre-emptive, ordered before any trouble has begun.", read: "Two lines: shutdowns imposed in anticipation of an event (an exam, a protest, an anniversary) against those responding to one unfolding. Preventive runs far above reactive for most of the record, peaking near 94-to-6 in 2021.", watch: "Preventive vs reactive is SFLC's classification from the stated reason; the line between anticipating trouble and pre-empting dissent is exactly what is contested." },
      { chart: "tableBars", indicator: "policy.shutdowns.duration", size: "feature", beat: "opacity", unit: "shutdowns, 2012-2026", subtitle: "SFLC.in · every recorded shutdown bucketed by duration · 2012-2026", title: "How long they last, and how often we just don't know", why: "Even basic facts about a shutdown are hidden: for a huge share, nobody outside government knows how long the internet stayed off.", read: "Each bar is a duration bucket across all recorded shutdowns. The single largest bucket is 'never disclosed' (about half), because orders are rarely published and duration is guessed from news reports.", watch: "The opacity is the finding, not a data gap to apologise for. Undisclosed duration means the public cannot check whether a shutdown was as brief or proportionate as claimed." },

      // ACT 4 - The quieter switch: blocking orders
      { chart: "line", indicator: "policy.blocking.urls_annual", size: "feature", beat: "blocking-orders", unit: "URLs blocked", subtitle: "MeitY answers to Parliament · websites, accounts and URLs blocked under IT Act s.69A · 2017-2023", title: "The quieter off switch: blocking orders", why: "Shutdowns are visible and noisy; URL blocking is silent and far larger, and it has grown.", read: "Each point is the number of websites, accounts and URLs ordered blocked under Section 69A in a year, as disclosed to Parliament. They spike to nearly 9,900 in 2020 and run in the thousands every year.", watch: "These are the government's own figures and do not fully reconcile across answers; the orders themselves are confidential by rule, so the public never learns what was blocked or why. Read the magnitude, not the exact count." },
      { chart: "tableBars", indicator: "policy.blocking.authority_split", size: "feature", beat: "who-orders", unit: "websites blocked, 2015-2022", subtitle: "SFLC.in 'Finding 404', from RTI replies · India's website blocks by ordering authority · Jan 2015-Sep 2022", title: "Who orders India's website blocks", why: "Blocking is often pictured as judges weighing free speech, but nearly half of it is the executive acting in secret.", read: "Of about 55,580 websites blocked over 2015-22, court orders (mostly copyright) and executive orders under Section 69A are almost neck-and-neck, at roughly 47% each. The executive half is the opaque one: those orders are confidential by rule.", watch: "This is an aggregate split across the whole period, not a year-by-year trend. Court-ordered blocks are dominated by a few large anti-piracy orders that each cover many mirror sites." },
      { chart: "multiLine", indicator: "policy.blocking.urls_x", size: "feature", beat: "which-platforms", unit: "URLs blocked under s.69A", subtitle: "Rajya Sabha Unstarred Q732 (08.12.2023) · URLs blocked under IT Act s.69A, by platform · 2018-2023 (2023 till Oct)", title: "X overtook Facebook as the most-blocked platform", series: [ { indicator: "policy.blocking.urls_x", label: "X (Twitter)", color: "#111111" }, { indicator: "policy.blocking.urls_facebook", label: "Facebook", color: "#1877f2" }, { indicator: "policy.blocking.urls_youtube", label: "YouTube", color: "#e0245e" }, { indicator: "policy.blocking.urls_instagram", label: "Instagram", color: "#c13584" }, { indicator: "policy.blocking.urls_others", label: "Others", color: "#9aa0a6" } ], why: "The aggregate count hides who actually gets censored, and the answer flipped as the politics did.", read: "Each line is one platform's URLs blocked under Section 69A. Facebook drew the most takedowns in 2018-19; from 2020 X (Twitter) pulled far ahead, peaking near 3,400 a year, even as Facebook stayed high.", watch: "Counts are URLs/accounts/posts, not unique pieces of content, and 2023 is only till October. The crossover tracks contested political moments (farmer protests, 2021) as much as platform size." },
      { chart: "tableBars", indicator: "policy.blocking.urls_by_platform_total", size: "small", beat: "which-platforms-total", unit: "URLs blocked, 2018-Oct 2023", subtitle: "Rajya Sabha Unstarred Q732 (08.12.2023) · total URLs blocked under s.69A by platform · 2018-Oct 2023", title: "Which platforms India blocks the most", why: "Summed over six years, the league table makes the target plain.", read: "Each bar is a platform's total URLs blocked under Section 69A from 2018 to October 2023. X leads with 13,660, then Facebook (10,197), YouTube (5,759), a catch-all 'others' (4,199) and Instagram (3,023).", watch: "Totals lump together very different years; the same six-year window saw Facebook lead early and X lead late. 'Others' bundles every smaller platform." },
      { chart: "tableBars", indicator: "policy.blocking.dns_by_category", size: "feature", beat: "what-blocked", unit: "blocked domains", subtitle: "dnsblocks.in 'Poisoned Wells' study · 43,083 DNS-blocked domains across 6 ISPs, by category", title: "What India's ISPs actually block", why: "Before calling all blocking censorship, look at what is on the list: the answer complicates the easy story.", read: "Each bar is how many blocked domains fall in a category, grouped by kind. Piracy and streaming dominate by far; pornography and gambling follow; content tied to speech and access (news, political criticism, government, circumvention tools) is a tiny sliver.", watch: "DNS blocking is one mechanism among several and is trivially bypassed, so this measures intent, not an airtight wall. 'Uncategorised' is large and unclassified." },
      { chart: "tableBars", indicator: "policy.blocking.dns_by_isp", size: "small", beat: "uneven", unit: "blocked domains", subtitle: "dnsblocks.in · number of domains found DNS-blocked, by internet provider", title: "What you can reach depends on your ISP", why: "The same blocking orders are implemented unevenly, so the open internet you get depends on who you pay for it.", read: "Each bar is how many domains one provider was found to DNS-block. Airtel blocks the most by a wide margin; the lightest providers block under half as many.", watch: "Differences partly reflect how each ISP implements orders and how thoroughly the study could probe it, not just policy zeal." },

      // ACT 5 - What it costs (evidence: Rydzak / does-it-work handled in prose)
      { chart: "tableBars", indicator: "policy.shutdowns.cost_usd", size: "feature", beat: "cost", unit: "US$ million, 2012-2017", subtitle: "ICRIER, The Anatomy of an Internet Blackout (2018) · economic loss from internet shutdowns · 2012-2017", title: "What switching it off costs", why: "Shutdowns are not free: the most authoritative India study put the loss at about three billion dollars in six years.", read: "The two bars split ICRIER's roughly $3bn estimate by type. Mobile-only shutdowns did about four-fifths of the damage; combined mobile-and-fixed shutdowns the rest.", watch: "This is a macro-econometric estimate over 2012-2017, not exact accounting and not a recent-year figure. More recent annual losses, tracked by the NetBlocks Cost of Shutdown Tool, run in the hundreds of millions a year." }
    ]
  },
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
  { id: "health.cod_ncd_share", sourceIndicatorId: "SH.DTH.NCOM.ZS", title: "Share of deaths from non-communicable diseases", unit: "% of total deaths", frequency: "annual" },
  { id: "health.cod_communicable_share", sourceIndicatorId: "SH.DTH.COMM.ZS", title: "Share of deaths from communicable diseases", unit: "% of total deaths", frequency: "annual" },
  { id: "health.cod_injury_share", sourceIndicatorId: "SH.DTH.INJR.ZS", title: "Share of deaths from injuries", unit: "% of total deaths", frequency: "annual" },
  { id: "health.suicide_rate_wb", sourceIndicatorId: "SH.STA.SUIC.P5", title: "Suicide mortality rate", unit: "per 100,000 population", frequency: "annual" },
  { id: "health.air_pollution_mortality_wb", sourceIndicatorId: "SH.STA.AIRP.P5", title: "Mortality from air pollution", unit: "per 100,000 population", frequency: "annual" },
  { id: "education.literacy_adult", sourceIndicatorId: "SE.ADT.LITR.ZS", title: "Adult literacy rate", unit: "% ages 15 and above", frequency: "annual" },
  { id: "education.school_enrollment_secondary", sourceIndicatorId: "SE.SEC.ENRR", title: "School enrollment, secondary", unit: "% gross", frequency: "annual" },
  { id: "education.school_life_expectancy", sourceIndicatorId: "SE.SCH.LIFE", title: "School life expectancy", unit: "years", frequency: "annual" },
  { id: "work.labor_force_total", sourceIndicatorId: "SL.TLF.TOTL.IN", title: "Labor force, total", unit: "people", frequency: "annual" },
  { id: "work.labor_force_participation_total", sourceIndicatorId: "SL.TLF.CACT.ZS", title: "Labor force participation rate, total", unit: "% ages 15+", frequency: "annual" },
  { id: "work.labor_force_participation_male", sourceIndicatorId: "SL.TLF.CACT.MA.ZS", title: "Labor force participation rate, male", unit: "% ages 15+", frequency: "annual" },
  { id: "work.labor_force_participation_female", sourceIndicatorId: "SL.TLF.CACT.FE.ZS", title: "Labor force participation rate, female", unit: "% ages 15+", frequency: "annual" },
  { id: "work.unemployment_total", sourceIndicatorId: "SL.UEM.TOTL.ZS", title: "Unemployment, total", unit: "% of labor force", frequency: "annual" },
  { id: "work.employment_agriculture", sourceIndicatorId: "SL.AGR.EMPL.ZS", title: "Employment in agriculture", unit: "% of total employment", frequency: "annual" },
  { id: "energy.electricity_access", sourceIndicatorId: "EG.ELC.ACCS.ZS", title: "Access to electricity", unit: "% of population", frequency: "annual" },
  { id: "energy.electric_power_consumption_pc", sourceIndicatorId: "EG.USE.ELEC.KH.PC", title: "Electric power consumption", unit: "kWh per capita", frequency: "annual" },
  { id: "energy.clean_cooking_access", sourceIndicatorId: "EG.CFT.ACCS.ZS", title: "Access to clean fuels and technologies for cooking", unit: "% of population", frequency: "annual" },
  { id: "climate.pm25_exposure", sourceIndicatorId: "EN.ATM.PM25.MC.M3", title: "PM2.5 air pollution, mean annual exposure", unit: "µg/m³", frequency: "annual" },
  { id: "society.water_basic", sourceIndicatorId: "SH.H2O.BASW.ZS", title: "People using at least basic drinking water services", unit: "% of population", frequency: "annual" },
  { id: "society.sanitation_basic", sourceIndicatorId: "SH.STA.BASS.ZS", title: "People using at least basic sanitation services", unit: "% of population", frequency: "annual" },
  { id: "society.internet_users", sourceIndicatorId: "IT.NET.USER.ZS", title: "Individuals using the Internet", unit: "% of population", frequency: "annual" },
  { id: "state.tax_revenue_gdp", sourceIndicatorId: "GC.TAX.TOTL.GD.ZS", title: "Tax revenue", unit: "% of GDP", frequency: "annual" },
  { id: "state.expense_gdp", sourceIndicatorId: "GC.XPN.TOTL.GD.ZS", title: "Expense", unit: "% of GDP", frequency: "annual" },
  { id: "state.debt_central_gdp", sourceIndicatorId: "GC.DOD.TOTL.GD.ZS", title: "Central government debt", unit: "% of GDP", frequency: "annual" },
  { id: "society.mobile_subscriptions_p100", sourceIndicatorId: "IT.CEL.SETS.P2", title: "Mobile cellular subscriptions", unit: "per 100 people", frequency: "annual" },
  { id: "society.broadband_subscriptions_p100", sourceIndicatorId: "IT.NET.BBND.P2", title: "Fixed broadband subscriptions", unit: "per 100 people", frequency: "annual" },
  { id: "society.fixed_telephone_p100", sourceIndicatorId: "IT.MLT.MAIN.P2", title: "Fixed telephone subscriptions", unit: "per 100 people", frequency: "annual" },
  { id: "society.internet_users_female", sourceIndicatorId: "IT.NET.USER.FE.ZS", title: "Internet use, women", unit: "% of female population", frequency: "annual" },
  { id: "society.internet_users_male", sourceIndicatorId: "IT.NET.USER.MA.ZS", title: "Internet use, men", unit: "% of male population", frequency: "annual" },
  { id: "energy.coal_share_electricity", sourceIndicatorId: "EG.ELC.COAL.ZS", title: "Electricity generated from coal", unit: "% of total", frequency: "annual" },
  { id: "energy.renewable_energy_consumption", sourceIndicatorId: "EG.FEC.RNEW.ZS", title: "Renewables in total energy use", unit: "% of final energy", frequency: "annual" },
  // "How India Works" flagship — labour-market indicators (India, modelled-ILO/WDI)
  { id: "work.employment_industry", sourceIndicatorId: "SL.IND.EMPL.ZS", title: "Employment in industry", unit: "% of total employment", frequency: "annual" },
  { id: "work.employment_services", sourceIndicatorId: "SL.SRV.EMPL.ZS", title: "Employment in services", unit: "% of total employment", frequency: "annual" },
  { id: "work.productivity_per_worker", sourceIndicatorId: "SL.GDP.PCAP.EM.KD", title: "GDP per person employed (labour productivity)", unit: "constant 2021 PPP $", frequency: "annual" },
  { id: "work.vulnerable_employment", sourceIndicatorId: "SL.EMP.VULN.ZS", title: "Vulnerable employment", unit: "% of total employment", frequency: "annual" },
  { id: "work.self_employed", sourceIndicatorId: "SL.EMP.SELF.ZS", title: "Self-employed", unit: "% of total employment", frequency: "annual" },
  { id: "work.wage_salaried", sourceIndicatorId: "SL.EMP.WORK.ZS", title: "Wage and salaried workers", unit: "% of total employment", frequency: "annual" },
  { id: "work.unemployment_youth", sourceIndicatorId: "SL.UEM.1524.ZS", title: "Youth unemployment (ages 15-24)", unit: "% of youth labour force", frequency: "annual" },
  { id: "work.neet_youth", sourceIndicatorId: "SL.UEM.NEET.ZS", title: "Youth not in employment, education or training (NEET)", unit: "% of youth", frequency: "annual" },
  // "How India Trades with the World" flagship — macro trade context (India, WDI).
  { id: "trade.wb.exports_gdp", sourceIndicatorId: "NE.EXP.GNFS.ZS", title: "Exports of goods and services", unit: "% of GDP", frequency: "annual" },
  { id: "trade.wb.imports_gdp", sourceIndicatorId: "NE.IMP.GNFS.ZS", title: "Imports of goods and services", unit: "% of GDP", frequency: "annual" },
  { id: "trade.wb.current_account_gdp", sourceIndicatorId: "BN.CAB.XOKA.GD.ZS", title: "Current account balance", unit: "% of GDP", frequency: "annual" },
  { id: "trade.wb.fdi_inflows_gdp", sourceIndicatorId: "BX.KLT.DINV.WD.GD.ZS", title: "Foreign direct investment, net inflows", unit: "% of GDP", frequency: "annual" },
  { id: "trade.wb.ict_service_exports_share", sourceIndicatorId: "BX.GSR.CCIS.ZS", title: "ICT service exports", unit: "% of service exports, BoP", frequency: "annual" },
  { id: "trade.wb.high_tech_exports_share", sourceIndicatorId: "TX.VAL.TECH.MF.ZS", title: "High-technology exports", unit: "% of manufactured exports", frequency: "annual" },
  { id: "trade.wb.remittances_usd", sourceIndicatorId: "BX.TRF.PWKR.CD.DT", title: "Personal remittances received", unit: "current US$", frequency: "annual" },
  // "Water stress in India" flagship — resource base, demand split & access (World Bank, sourced from FAO AQUASTAT).
  // Note: WB/AQUASTAT per-capita differs slightly from CWC's official India series (1,486 m³ for 2021); lead with CWC, use WB for the long run and international comparability.
  { id: "water.wb.renewable_internal_pc", sourceIndicatorId: "ER.H2O.INTR.PC", title: "Renewable internal freshwater resources per capita", unit: "cubic metres per person", frequency: "annual" },
  { id: "water.wb.renewable_internal_total", sourceIndicatorId: "ER.H2O.INTR.K3", title: "Renewable internal freshwater resources, total", unit: "billion cubic metres", frequency: "annual" },
  { id: "water.wb.withdrawal_share_of_resources", sourceIndicatorId: "ER.H2O.FWTL.ZS", title: "Annual freshwater withdrawals as a share of internal resources", unit: "% of internal resources", frequency: "annual" },
  { id: "water.wb.withdrawal_total", sourceIndicatorId: "ER.H2O.FWTL.K3", title: "Annual freshwater withdrawals, total", unit: "billion cubic metres", frequency: "annual" },
  { id: "water.wb.withdrawal_agriculture", sourceIndicatorId: "ER.H2O.FWAG.ZS", title: "Annual freshwater withdrawals, agriculture", unit: "% of total withdrawal", frequency: "annual" },
  { id: "water.wb.withdrawal_industry", sourceIndicatorId: "ER.H2O.FWIN.ZS", title: "Annual freshwater withdrawals, industry", unit: "% of total withdrawal", frequency: "annual" },
  { id: "water.wb.withdrawal_domestic", sourceIndicatorId: "ER.H2O.FWDM.ZS", title: "Annual freshwater withdrawals, domestic", unit: "% of total withdrawal", frequency: "annual" },
  { id: "water.wb.productivity_gdp_per_m3", sourceIndicatorId: "ER.GDP.FWTL.M3.KD", title: "Water productivity (GDP per cubic metre of freshwater withdrawal)", unit: "constant 2015 US$ per m³", frequency: "annual" },
  { id: "water.wb.drinking_safely_managed", sourceIndicatorId: "SH.H2O.SMDW.ZS", title: "People using safely managed drinking water services", unit: "% of population", frequency: "annual" }
];

export const unPopulationIndicators = [
  { indicator: 19, id: "people.population.un.fertility", title: "Total fertility rate", unit: "births per woman", start: 2000, end: 2100 },
  { indicator: 18, id: "people.population.un.mean_age_childbearing", title: "Mean age at childbearing", unit: "years", start: 2000, end: 2100 },
  { indicator: 24, id: "people.population.un.u5mr", title: "Under-five mortality rate", unit: "per 1,000 live births", start: 2000, end: 2030 },
  { indicator: 46, id: "people.population.un.age_sex_5y", title: "Population by 5-year age groups and sex", unit: "people", start: 2000, end: 2030 },
  { indicator: 49, id: "people.population.un.total", title: "Total population by sex", unit: "people", start: 2000, end: 2100 },
  { indicator: 51, id: "people.population.un.change_rate", title: "Annual rate of total population change", unit: "%", start: 2000, end: 2100 },
  { indicator: 61, id: "people.population.un.life_expectancy", title: "Life expectancy by sex at birth", unit: "years", start: 2000, end: 2030 },
  { indicator: 67, id: "people.population.un.median_age", title: "Median age of population", unit: "years", start: 2000, end: 2100 },
  { indicator: 71, id: "people.population.un.broad_age_share", title: "Percentage of total population by broad age group", unit: "%", start: 2000, end: 2030 },
  { indicator: 83, id: "people.population.un.child_dependency", title: "Child dependency ratio", unit: "ratio", start: 2000, end: 2030 },
  { indicator: 84, id: "people.population.un.old_age_dependency", title: "Old-age dependency ratio", unit: "ratio", start: 2000, end: 2030 },
  { indicator: 86, id: "people.population.un.total_dependency", title: "Total dependency ratio", unit: "ratio", start: 2000, end: 2030 },
  { indicator: 59, id: "health.un.crude_death_rate", title: "Crude death rate", unit: "per 1,000 population", start: 2000, end: 2030 },
  { indicator: 60, id: "health.un.total_deaths", title: "Total deaths by sex", unit: "thousands", start: 2000, end: 2030 },
  { indicator: 64, id: "health.un.deaths_by_age", title: "Deaths by 5-year age groups and sex", unit: "thousands", start: 2000, end: 2030 }
];

export const whoIndicators = [
  { indicatorCode: "WHOSIS_000001", id: "health.who.life_expectancy", title: "Life expectancy at birth", unit: "years" },
  { indicatorCode: "WHOSIS_000002", id: "health.who.hale_birth", title: "Healthy life expectancy at birth", unit: "years" },
  { indicatorCode: "WHOSIS_000015", id: "health.who.life_expectancy_age_60", title: "Life expectancy at age 60", unit: "years" },
  { indicatorCode: "MDG_0000000007", id: "health.who.under5_mortality", title: "Under-five mortality rate", unit: "per 1,000 live births" },
  { indicatorCode: "MDG_0000000001", id: "health.who.infant_mortality", title: "Infant mortality rate", unit: "per 1,000 live births" },
  { indicatorCode: "nmr", id: "health.who.neonatal_mortality", title: "Neonatal mortality rate", unit: "per 1,000 live births" },
  { indicatorCode: "MDG_0000000026", id: "health.who.maternal_mortality", title: "Maternal mortality ratio", unit: "per 100,000 live births" },
  { indicatorCode: "WHS2_131", id: "health.who.ncd_mortality", title: "Age-standardized NCD mortality rate", unit: "per 100,000 population" },
  { indicatorCode: "NCDMORT3070", id: "health.who.ncd_premature_mortality", title: "Probability of dying from major NCDs between age 30 and 70", unit: "%" },
  { indicatorCode: "NCD_DIABETES_PREVALENCE_AGESTD", id: "health.who.diabetes_prevalence", title: "Age-standardized diabetes prevalence", unit: "%" },
  { indicatorCode: "NCD_HYP_PREVALENCE_A", id: "health.who.hypertension_prevalence", title: "Age-standardized hypertension prevalence", unit: "%" },
  { indicatorCode: "MDG_0000000020", id: "health.who.tb_incidence", title: "Tuberculosis incidence", unit: "per 100,000 population per year" },
  { indicatorCode: "MDG_0000000017", id: "health.who.tb_death_rate_hiv_negative", title: "Tuberculosis death rate among HIV-negative people", unit: "per 100,000 population" },
  { indicatorCode: "SDGSUICIDE", id: "health.who.suicide_rate", title: "Crude suicide rate", unit: "per 100,000 population" },
  { indicatorCode: "WHS8_110", id: "health.who.immunization_mcv1", title: "Measles-containing vaccine first-dose coverage", unit: "%" },
  { indicatorCode: "MCV2", id: "health.who.immunization_mcv2", title: "Measles-containing vaccine second-dose coverage", unit: "%" },
  { indicatorCode: "WHS4_543", id: "health.who.immunization_bcg", title: "BCG immunization coverage", unit: "%" },
  { indicatorCode: "ROTAC", id: "health.who.immunization_rotavirus", title: "Rotavirus completed-dose immunization coverage", unit: "%" },
  { indicatorCode: "GHED_CHEGDP_SHA2011", id: "health.who.current_health_expenditure_gdp", title: "Current health expenditure as share of GDP", unit: "% of GDP" },
  { indicatorCode: "GHED_CHE_pc_US_SHA2011", id: "health.who.current_health_expenditure_pc_usd", title: "Current health expenditure per capita", unit: "current US$" },
  { indicatorCode: "NCD_UNDER70", id: "health.who.ncd_premature_death_share", title: "Premature NCD deaths as share of all NCD deaths", unit: "%" },
  { indicatorCode: "AIR_41", id: "health.who.air_pollution_deaths", title: "Ambient air pollution attributable deaths", unit: "number" },
  { indicatorCode: "AIR_35", id: "health.who.air_pollution_joint_deaths", title: "Joint effects of household and ambient air pollution attributable deaths", unit: "number" },
  { indicatorCode: "HIV_0000000006", id: "health.who.hiv_deaths", title: "Number of people dying from HIV-related causes", unit: "number" },
  { indicatorCode: "HEPATITIS_DEATHS_RATE", id: "health.who.hepatitis_death_rate", title: "Hepatitis deaths from chronic hepatitis B and C", unit: "per 100,000 population" },
  { indicatorCode: "MALARIA_EST_DEATHS", id: "health.who.malaria_deaths", title: "Estimated number of malaria deaths", unit: "number" },
  { indicatorCode: "MORT_100", id: "health.who.child_deaths_by_cause", title: "Number of deaths in children aged under 5 years, by cause", unit: "number" },
  { indicatorCode: "DEATHADO", id: "health.who.adolescent_deaths", title: "Number of deaths among adolescents aged 10 to 19 years", unit: "number" },
  { indicatorCode: "TB_e_mort_exc_tbhiv_num", id: "health.who.tb_deaths_number", title: "Number of deaths due to tuberculosis excluding HIV", unit: "number" },
  { indicatorCode: "RS_198", id: "health.who.road_traffic_death_rate", title: "Estimated road traffic death rate", unit: "per 100,000 population" },
  { indicatorCode: "M_Est_tob_curr", id: "health.who.tobacco_prevalence", title: "Tobacco use prevalence among adults", unit: "%" },
  { indicatorCode: "SDG_SH_DTH_RNCOM", id: "health.who.ncd_deaths_cvd", title: "NCD deaths: cardiovascular diseases", unit: "number", extraFilter: "Dim2 eq 'GHECAUSES_GHE110'" },
  { indicatorCode: "SDG_SH_DTH_RNCOM", id: "health.who.ncd_deaths_cancer", title: "NCD deaths: malignant neoplasms", unit: "number", extraFilter: "Dim2 eq 'GHECAUSES_GHE061'" },
  { indicatorCode: "SDG_SH_DTH_RNCOM", id: "health.who.ncd_deaths_respiratory", title: "NCD deaths: chronic respiratory diseases", unit: "number", extraFilter: "Dim2 eq 'GHECAUSES_GHE117'" },
  { indicatorCode: "SDG_SH_DTH_RNCOM", id: "health.who.ncd_deaths_diabetes", title: "NCD deaths: diabetes mellitus", unit: "number", extraFilter: "Dim2 eq 'GHECAUSES_GHE080'" }
];

export const emberDatasets = [
  { id: "energy.ember.generation", dataset: "electricity-generation", title: "Electricity generation by source", unit: "TWh", startDate: "2000" },
  { id: "energy.ember.demand", dataset: "electricity-demand", title: "Electricity demand", unit: "TWh", startDate: "2000" },
  { id: "energy.ember.emissions", dataset: "power-sector-emissions", title: "Power-sector emissions", unit: "MtCO2", startDate: "2000" },
  { id: "energy.ember.carbon_intensity", dataset: "carbon-intensity", title: "Electricity carbon intensity", unit: "gCO2/kWh", startDate: "2000" }
];

export const eiaInternationalSeries = [
  { id: "energy.eia.total_consumption", productId: "44", activityId: "2", eiaUnit: "QBTU", title: "Total energy consumption", unit: "quadrillion Btu" },
  { id: "energy.eia.total_production", productId: "44", activityId: "1", eiaUnit: "QBTU", title: "Total energy production", unit: "quadrillion Btu" },
  { id: "energy.eia.consumption_coal", productId: "4411", activityId: "2", eiaUnit: "QBTU", title: "Total energy consumption from coal", unit: "quadrillion Btu" },
  { id: "energy.eia.consumption_petroleum", productId: "4415", activityId: "2", eiaUnit: "QBTU", title: "Total energy consumption from petroleum and other liquids", unit: "quadrillion Btu" },
  { id: "energy.eia.consumption_gas", productId: "4413", activityId: "2", eiaUnit: "QBTU", title: "Total energy consumption from natural gas", unit: "quadrillion Btu" },
  { id: "energy.eia.consumption_nuclear", productId: "4417", activityId: "2", eiaUnit: "QBTU", title: "Total energy consumption from nuclear", unit: "quadrillion Btu" },
  { id: "energy.eia.consumption_renewables_other", productId: "4418", activityId: "2", eiaUnit: "QBTU", title: "Total energy consumption from renewables and other", unit: "quadrillion Btu" },
  { id: "energy.eia.production_coal_qbtu", productId: "4411", activityId: "1", eiaUnit: "QBTU", title: "Total energy production from coal", unit: "quadrillion Btu" },
  { id: "energy.eia.production_petroleum_qbtu", productId: "4415", activityId: "1", eiaUnit: "QBTU", title: "Total energy production from petroleum and other liquids", unit: "quadrillion Btu" },
  { id: "energy.eia.production_gas_qbtu", productId: "4413", activityId: "1", eiaUnit: "QBTU", title: "Total energy production from natural gas", unit: "quadrillion Btu" },
  { id: "energy.eia.coal_production", productId: "7", activityId: "1", eiaUnit: "MT", title: "Coal production", unit: "1000 metric tons" },
  { id: "energy.eia.coal_imports", productId: "7", activityId: "3", eiaUnit: "MT", title: "Coal imports", unit: "1000 metric tons" },
  { id: "energy.eia.petroleum_production", productId: "53", activityId: "1", eiaUnit: "TBPD", title: "Petroleum and other liquids production", unit: "thousand barrels per day" },
  { id: "energy.eia.gas_consumption", productId: "26", activityId: "2", eiaUnit: "BCM", title: "Dry natural gas consumption", unit: "billion cubic meters" },
  { id: "energy.eia.gas_imports", productId: "26", activityId: "3", eiaUnit: "BCM", title: "Dry natural gas imports", unit: "billion cubic meters" },
  { id: "energy.eia.energy_intensity", productId: "47", activityId: "34", eiaUnit: "TBTUUSDPP", title: "Energy consumption per GDP", unit: "thousand Btu per USD at PPP" },
  { id: "energy.eia.energy_per_capita", productId: "47", activityId: "33", eiaUnit: "MBTUPP", title: "Energy consumption per capita", unit: "million Btu per person" },
  { id: "energy.eia.electricity_capacity_total", productId: "2", activityId: "7", eiaUnit: "MK", title: "Electricity installed capacity", unit: "million kilowatts" },
  { id: "energy.eia.electricity_capacity_fossil", productId: "28", activityId: "7", eiaUnit: "MK", title: "Fossil fuels electricity installed capacity", unit: "million kilowatts" },
  { id: "energy.eia.electricity_capacity_renewable", productId: "29", activityId: "7", eiaUnit: "MK", title: "Renewable electricity installed capacity", unit: "million kilowatts" },
  { id: "energy.eia.electricity_capacity_solar", productId: "116", activityId: "7", eiaUnit: "MK", title: "Solar electricity installed capacity", unit: "million kilowatts" },
  { id: "energy.eia.electricity_capacity_wind", productId: "37", activityId: "7", eiaUnit: "MK", title: "Wind electricity installed capacity", unit: "million kilowatts" },
  { id: "climate.eia.co2_total", productId: "4008", activityId: "8", eiaUnit: "MMTCD", title: "Energy-related CO2 emissions", unit: "million metric tonnes carbon dioxide" },
  { id: "climate.eia.co2_coal", productId: "4002", activityId: "8", eiaUnit: "MMTCD", title: "Coal and coke CO2 emissions", unit: "million metric tonnes carbon dioxide" },
  { id: "climate.eia.co2_petroleum", productId: "4006", activityId: "8", eiaUnit: "MMTCD", title: "Petroleum and other liquids CO2 emissions", unit: "million metric tonnes carbon dioxide" },
  { id: "climate.eia.co2_gas", productId: "3002", activityId: "8", eiaUnit: "MMTCD", title: "Natural gas CO2 emissions", unit: "million metric tonnes carbon dioxide" }
];

export const ppacDatasets = [
  {
    id: "energy.ppac.import_export_petroleum_current",
    title: "Import/export of crude oil and petroleum products, quantity",
    financialYear: "2025-2026",
    reportBy: "1",
    pageId: "14",
    unit: "000 metric tonnes"
  },
  {
    id: "energy.ppac.import_export_petroleum_value_rupees",
    title: "Import/export of crude oil and petroleum products, value in rupees",
    financialYear: "2025-2026",
    reportBy: "2",
    pageId: "14",
    unit: "₹ crore"
  },
  {
    id: "energy.ppac.import_export_petroleum_value_usd",
    title: "Import/export of crude oil and petroleum products, value in dollars",
    financialYear: "2025-2026",
    reportBy: "3",
    pageId: "14",
    unit: "US$ million"
  },
  {
    id: "energy.ppac.lng_imports_current",
    title: "LNG imports, quantity and value",
    kind: "lng_import_workbook",
    financialYear: "2025-2026",
    workbookUrl: "https://ppac.gov.in/uploads/page-images/1778125589_NG-C-LNG-Import.xls",
    sourceUrl: "https://ppac.gov.in/natural-gas/import",
    unit: "MMT, MMSCM, US$ million, ₹ crore"
  }
];

export const unComtradeEnergyCommodities = [
  { id: "energy.comtrade.crude_oil_imports", cmdCode: "270900", flowCode: "M", title: "Crude oil imports", unit: "trade value and quantity" },
  { id: "energy.comtrade.petroleum_products_imports", cmdCode: "2710", flowCode: "M", title: "Petroleum oils and products imports", unit: "trade value and quantity" },
  { id: "energy.comtrade.coal_imports", cmdCode: "2701", flowCode: "M", title: "Coal imports", unit: "trade value and quantity" },
  { id: "energy.comtrade.coke_imports", cmdCode: "2704", flowCode: "M", title: "Coke and semi-coke imports", unit: "trade value and quantity" },
  { id: "energy.comtrade.lng_imports", cmdCode: "271111", flowCode: "M", title: "Liquefied natural gas imports", unit: "trade value and quantity" },
  { id: "energy.comtrade.gas_imports", cmdCode: "271121", flowCode: "M", title: "Natural gas imports", unit: "trade value and quantity" }
];

// UN Comtrade — "How India Trades with the World": latest-year partner and
// product detail (India reporter 699). Complements the WTO long time-series.
export const unComtradeTradeQueries = [
  { id: "trade.comtrade.exports_by_partner", flowCode: "X", cmdCode: "TOTAL", partnerCode: "", dim: "partner", title: "Merchandise exports by partner country", unit: "current US$" },
  { id: "trade.comtrade.imports_by_partner", flowCode: "M", cmdCode: "TOTAL", partnerCode: "", dim: "partner", title: "Merchandise imports by partner country", unit: "current US$" },
  { id: "trade.comtrade.exports_by_hs_chapter", flowCode: "X", cmdCode: "AG2", partnerCode: "0", dim: "commodity", title: "Merchandise exports by HS chapter", unit: "current US$" },
  { id: "trade.comtrade.imports_by_hs_chapter", flowCode: "M", cmdCode: "AG2", partnerCode: "0", dim: "commodity", title: "Merchandise imports by HS chapter", unit: "current US$" }
];

// UN Comtrade — historical partner evolution + key bilateral relationships.
// benchmark-year snapshots feed regional aggregation + partner-shift charts;
// the bilateral pulls (China 156, Russia 643) feed long annual relationship lines.
const COMTRADE_BENCHMARK_YEARS = "2000,2005,2010,2015,2020,2024";
const COMTRADE_ANNUAL_RANGE = Array.from({ length: 2024 - 2000 + 1 }, (_, i) => 2000 + i).join(",");
// WITS (World Bank) — the preferential-vs-MFN tariff gap, which no other source
// we use captures. AHS = effectively applied (includes preferential rates).
export const witsTariffSeries = [
  { id: "trade.wits.tariff_effective", indicator: "AHS-SMPL-AVRG", title: "Effectively applied tariff (incl. preferences)", unit: "% (simple average)" },
  { id: "trade.wits.tariff_mfn", indicator: "MFN-SMPL-AVRG", title: "MFN applied tariff", unit: "% (simple average)" }
];

export const unComtradeHistoryQueries = [
  { id: "trade.comtrade.exports_by_partner_history", flowCode: "X", cmdCode: "TOTAL", partnerCode: "", period: COMTRADE_BENCHMARK_YEARS, dim: "partner-history", title: "Merchandise exports by partner, benchmark years", unit: "current US$" },
  { id: "trade.comtrade.imports_by_partner_history", flowCode: "M", cmdCode: "TOTAL", partnerCode: "", period: COMTRADE_BENCHMARK_YEARS, dim: "partner-history", title: "Merchandise imports by partner, benchmark years", unit: "current US$" },
  { id: "trade.comtrade.china_bilateral", flowCode: "X,M", cmdCode: "TOTAL", partnerCode: "156", period: COMTRADE_ANNUAL_RANGE, dim: "bilateral", title: "India–China merchandise trade", unit: "current US$" },
  { id: "trade.comtrade.russia_bilateral", flowCode: "X,M", cmdCode: "TOTAL", partnerCode: "643", period: COMTRADE_ANNUAL_RANGE, dim: "bilateral", title: "India–Russia merchandise trade", unit: "current US$" }
];

export const tradeStatEnergyCommodities = [
  { id: "energy.tradestat.crude_oil_imports", hsCode: "270900", title: "Crude oil imports by partner", unit: "US$ million and quantity" },
  { id: "energy.tradestat.petroleum_products_imports", hsCode: "2710", title: "Petroleum oils and products imports by partner", unit: "US$ million and quantity" },
  { id: "energy.tradestat.coal_imports", hsCode: "2701", title: "Coal imports by partner", unit: "US$ million and quantity" },
  { id: "energy.tradestat.coke_imports", hsCode: "2704", title: "Coke and semi-coke imports by partner", unit: "US$ million and quantity" },
  { id: "energy.tradestat.lng_imports", hsCode: "271111", title: "Liquefied natural gas imports by partner", unit: "US$ million and quantity" }
];

// WTO Timeseries API — "How India Trades with the World" flagship.
// r = reporting economy (356 India, 000 World); pc = product/sector (default = all
// top-level groups + total). World aggregates are fetched to compute India's world share.
export const wtoTradeIndicators = [
  // Merchandise — India, full product-group breakdown + total, full annual history.
  { i: "ITS_MTV_AX", r: "356", ps: "all", id: "trade.wto.merch_exports_by_product", title: "Merchandise exports by product group", unit: "current US$ million", frequency: "annual" },
  { i: "ITS_MTV_AM", r: "356", ps: "all", id: "trade.wto.merch_imports_by_product", title: "Merchandise imports by product group", unit: "current US$ million", frequency: "annual" },
  // Commercial services — India, main-sector breakdown + total (2005-2025 estimates).
  { i: "ITS_CS_QAX", r: "356", ps: "all", id: "trade.wto.services_exports_by_sector", title: "Commercial services exports by sector", unit: "current US$ million", frequency: "annual" },
  { i: "ITS_CS_QAM", r: "356", ps: "all", id: "trade.wto.services_imports_by_sector", title: "Commercial services imports by sector", unit: "current US$ million", frequency: "annual" },
  // World aggregates (000) — denominators for India's world export/import share.
  { i: "ITS_MTV_AX", r: "000", ps: "all", pc: "TO", id: "trade.wto.world_merch_exports_total", title: "World merchandise exports, total", unit: "current US$ million", frequency: "annual" },
  { i: "ITS_MTV_AM", r: "000", ps: "all", pc: "TO", id: "trade.wto.world_merch_imports_total", title: "World merchandise imports, total", unit: "current US$ million", frequency: "annual" },
  { i: "ITS_CS_QAX", r: "000", ps: "all", id: "trade.wto.world_services_exports_by_sector", title: "World commercial services exports by sector", unit: "current US$ million", frequency: "annual" },
  { i: "ITS_MTV_AX", r: "000", ps: "all", id: "trade.wto.world_merch_exports_by_product", title: "World merchandise exports by product group", unit: "current US$ million", frequency: "annual" },
  // Higher-frequency merchandise totals — fresh trend (monthly runs to ~2 months ago).
  { i: "ITS_MTV_QX", r: "356", ps: "all", id: "trade.wto.merch_exports_quarterly", title: "Total merchandise exports, quarterly", unit: "current US$ million", frequency: "quarterly" },
  { i: "ITS_MTV_QM", r: "356", ps: "all", id: "trade.wto.merch_imports_quarterly", title: "Total merchandise imports, quarterly", unit: "current US$ million", frequency: "quarterly" },
  { i: "ITS_MTV_MX", r: "356", ps: "all", id: "trade.wto.merch_exports_monthly", title: "Total merchandise exports, monthly", unit: "current US$ million", frequency: "monthly" },
  { i: "ITS_MTV_MM", r: "356", ps: "all", id: "trade.wto.merch_imports_monthly", title: "Total merchandise imports, monthly", unit: "current US$ million", frequency: "monthly" },
  // Peer comparison (multi-reporter) — the "Asian divergence": economies that started
  // near India's trajectory and pulled ahead. 356 India, 156 China, 410 South Korea,
  // 704 Viet Nam, 764 Thailand, 458 Malaysia, 050 Bangladesh, 360 Indonesia.
  { i: "ITS_MTV_AX", r: "356,156,410,704,764,458,050,360", ps: "all", pc: "TO", id: "trade.wto.merch_exports_peers", title: "Merchandise exports, India vs Asian peers", unit: "current US$ million", frequency: "annual" },
  // Services peers: 356 India, 156 China, 410 South Korea, 608 Philippines, 840 USA, 826 UK.
  { i: "ITS_CS_QAX", r: "356,156,410,608,840,826", ps: "all", id: "trade.wto.services_exports_peers", title: "Commercial services exports, India vs peers", unit: "current US$ million", frequency: "annual" },
  // Real vs nominal growth + terms of trade — fixed-base indices (2015 = 100).
  { i: "ITS_MTP_AXF", r: "356", ps: "all", id: "trade.wto.merch_export_value_index", title: "Merchandise export value index (fixed base)", unit: "index", frequency: "annual" },
  { i: "ITS_MTP_AXVF", r: "356", ps: "all", id: "trade.wto.merch_export_volume_index", title: "Merchandise export volume index (fixed base)", unit: "index", frequency: "annual" },
  { i: "ITS_MTP_AUVXF", r: "356", ps: "all", id: "trade.wto.merch_export_unitvalue_index", title: "Merchandise export unit value index (fixed base)", unit: "index", frequency: "annual" },
  { i: "ITS_MTP_AUVMF", r: "356", ps: "all", id: "trade.wto.merch_import_unitvalue_index", title: "Merchandise import unit value index (fixed base)", unit: "index", frequency: "annual" },
  // Tariff comparison (multi-reporter) — India vs peers + a major open market.
  { i: "TP_A_0010", r: "356,156,410,704,360,840", ps: "all", id: "trade.wto.tariff_mfn_peers", title: "MFN applied tariff, India vs peers", unit: "percent", frequency: "annual" },
  // Tariff profile — India MFN applied averages.
  { i: "TP_A_0010", r: "356", ps: "all", id: "trade.wto.tariff_mfn_all", title: "Simple average MFN applied tariff, all products", unit: "percent", frequency: "annual" },
  { i: "TP_A_0160", r: "356", ps: "all", id: "trade.wto.tariff_mfn_agri", title: "Simple average MFN applied tariff, agricultural products", unit: "percent", frequency: "annual" },
  { i: "TP_A_0430", r: "356", ps: "all", id: "trade.wto.tariff_mfn_nonagri", title: "Simple average MFN applied tariff, non-agricultural products", unit: "percent", frequency: "annual" }
];

export const officialEnergySourceDiscoveryPages = [
  {
    id: "ppac",
    title: "Petroleum Planning & Analysis Cell",
    homepage: "https://ppac.gov.in/",
    pages: [
      "https://ppac.gov.in/import-export",
      "https://ppac.gov.in/reports-and-analysis"
    ]
  },
  {
    id: "cea",
    title: "Central Electricity Authority",
    homepage: "https://cea.nic.in/",
    pages: [
      "https://cea.nic.in/power-data-management-division/?lang=en",
      "https://cea.nic.in/api-for-central-electricity-authority-data/?lang=en"
    ]
  },
  {
    id: "grid-india",
    title: "Grid India",
    homepage: "https://grid-india.in/",
    pages: [
      "https://report.grid-india.in/psp_report.php",
      "https://report.grid-india.in/index.php?p=Daily+Report%2FPSP+Report"
    ]
  },
  {
    id: "mospi-energy",
    title: "MoSPI Energy Statistics",
    homepage: "https://www.mospi.gov.in/",
    pages: [
      "https://www.mospi.gov.in/web/mospi/reports-",
      "https://www.mospi.gov.in/publication/energy-statistics-india-2025"
    ]
  },
  {
    id: "mnre",
    title: "Ministry of New and Renewable Energy",
    homepage: "https://mnre.gov.in/",
    pages: [
      "https://mnre.gov.in/renewable-energy-statistics/",
      "https://mnre.gov.in/en/annual-report/",
      "https://mnre.gov.in/en/other-report/"
    ]
  },
  {
    id: "coal",
    title: "Ministry of Coal",
    homepage: "https://coal.gov.in/",
    pages: [
      "https://www.coal.gov.in/en/major-statistics/import-and-export",
      "https://coal.gov.in/major-statistics/coal-statistics",
      "https://www.coal.gov.in/en/major-statistics/production-and-supplies"
    ]
  },
  {
    id: "un-comtrade",
    title: "UN Comtrade",
    homepage: "https://comtradeplus.un.org/",
    pages: [
      "https://comtradeapi.un.org/data/v1/get/C/A/HS",
      "https://comtradedeveloper.un.org/"
    ]
  },
  {
    id: "tradestat",
    title: "TradeStat / DGCI&S",
    homepage: "https://tradestat.commerce.gov.in/",
    pages: [
      "https://tradestat.commerce.gov.in/eidb/commodity_wise_import",
      "https://tradestat.commerce.gov.in/eidb/commodity_wise_all_countries_import",
      "https://tradestat.commerce.gov.in/eidb/commodityx_countries_wise_import"
    ]
  }
];

export const owidGrapherDatasets = [
  { id: "owid.co2_total", slug: "annual-co2-emissions-per-country", title: "Annual CO2 emissions", unit: "tonnes" },
  { id: "owid.co2_per_capita", slug: "co-emissions-per-capita", title: "Annual CO2 emissions per capita", unit: "tonnes per person" },
  { id: "owid.co2_cumulative", slug: "cumulative-co-emissions", title: "Cumulative CO2 emissions", unit: "tonnes" },
  { id: "owid.life_expectancy", slug: "life-expectancy", title: "Life expectancy", unit: "years" },
  { id: "owid.child_mortality", slug: "child-mortality", title: "Child mortality", unit: "%" },
  { id: "owid.energy_per_capita", slug: "per-capita-energy-use", title: "Energy use per person", unit: "kWh/person" },
  { id: "society.owid.internet_share", slug: "share-of-individuals-using-the-internet", title: "Individuals using the internet", unit: "% of population" },
  { id: "energy.owid.renewable_share_elec", slug: "share-of-electricity-production-from-renewable-sources", title: "Renewables' share of electricity", unit: "%" },
  // Physical climate for India, processed by OWID from Copernicus ERA5 reanalysis,
  // latitude-weighted to India's national boundary. The national layer of the
  // climate flagship (q.climate.impact). State-level needs raw ERA5 (Pass B).
  { id: "climate.temp_anomaly_annual", slug: "annual-temperature-anomalies", title: "Annual temperature anomaly", unit: "°C vs 1991-2020" },
  { id: "climate.surface_temp_monthly", slug: "average-monthly-surface-temperature", title: "Average monthly surface temperature", unit: "°C" },
  { id: "climate.temp_anomaly_monthly", slug: "monthly-temperature-anomalies", title: "Monthly temperature anomaly", unit: "°C vs 1991-2020" },
  { id: "climate.precipitation_annual", slug: "average-precipitation-per-year", title: "Average annual precipitation", unit: "mm" },
  // Beyond CO2: total greenhouse gases (CO2 alone undersells India's agri-methane),
  // consumption/trade-adjusted responsibility, and disaster deaths (EM-DAT via OWID,
  // India-covered by type 1900-2025). All verified to return India rows.
  { id: "climate.ghg_total", slug: "total-ghg-emissions", title: "Total greenhouse gas emissions", unit: "tonnes CO₂e" },
  { id: "climate.ghg_by_gas", slug: "ghg-emissions-by-gas", title: "Greenhouse gas emissions by gas", unit: "tonnes CO₂e" },
  { id: "climate.methane", slug: "methane-emissions", title: "Methane emissions", unit: "tonnes CO₂e" },
  { id: "climate.ghg_by_sector", slug: "ghg-emissions-by-sector", title: "Greenhouse gas emissions by sector", unit: "tonnes CO₂e" },
  { id: "climate.co2_consumption", slug: "consumption-co2-emissions", title: "Consumption-based CO2 emissions", unit: "tonnes" },
  { id: "climate.co2_trade_share", slug: "share-co2-embedded-in-trade", title: "Share of CO2 embedded in trade", unit: "%" },
  { id: "climate.co2_vs_gdp", slug: "co2-emissions-and-gdp", title: "CO2 emissions vs GDP", unit: "tonnes / US$" },
  { id: "climate.disaster_deaths", slug: "natural-disasters-deaths", title: "Deaths from natural disasters by type", unit: "deaths" },
  // "How India Works" flagship — labour: unique OWID long-run / hours / productivity (India rows)
  { id: "work.owid.working_hours", slug: "annual-working-hours-per-worker", title: "Annual working hours per worker", unit: "hours/year" },
  { id: "work.owid.productivity_per_hour", slug: "labor-productivity-per-hour-pennworldtable", title: "Labour productivity per hour", unit: "constant int-$ / hour" },
  { id: "work.owid.gdp_per_capita_maddison", slug: "gdp-per-capita-maddison-project-database", title: "GDP per capita (Maddison, long run)", unit: "int-$ (2011 prices)" },
  { id: "work.owid.agri_employment_share_longrun", slug: "share-of-agriculture-in-total-employment", title: "Share of employment in agriculture (long run)", unit: "%" }
];

// IHME Global Burden of Disease 2023 (released Oct 2025), accessed through OWID's
// per-indicator data API (the bulk grapher CSV 403s for this 32-column chart, so we
// fetch each cause variable directly: api.ourworldindata.org/v1/indicators/{id}.data.json).
// This is the cause-of-death backbone for "What kills Indians?" — annual 1980→2023,
// so it shows the COVID spike AND the post-2021 recovery that WHO GHE (caps at 2021)
// cannot. `group` tags the GBD level-1 family so the NCD/communicable/injury broad
// split can be derived. `chartSlug` is the OWID chart the variable belongs to (used
// for provenance + snapshotting). metric "number" = death counts; "percent" = share.
export const gbdDeathChartSlug = "annual-number-of-deaths-by-cause";
export const gbdDeathIndicators = [
  // Non-communicable diseases (the dominant family)
  { id: "health.gbd.deaths_cardiovascular", variableId: 1158977, title: "Deaths from cardiovascular disease", label: "Cardiovascular", group: "ncd", unit: "deaths" },
  { id: "health.gbd.deaths_neoplasms", variableId: 1159277, title: "Deaths from cancers", label: "Cancers", group: "ncd", unit: "deaths" },
  { id: "health.gbd.deaths_chronic_respiratory", variableId: 1159018, title: "Deaths from chronic respiratory disease", label: "Chronic respiratory", group: "ncd", unit: "deaths" },
  { id: "health.gbd.deaths_diabetes", variableId: 1159055, title: "Deaths from diabetes", label: "Diabetes", group: "ncd", unit: "deaths" },
  { id: "health.gbd.deaths_chronic_kidney", variableId: 1158990, title: "Deaths from chronic kidney disease", label: "Chronic kidney", group: "ncd", unit: "deaths" },
  { id: "health.gbd.deaths_digestive", variableId: 1159062, title: "Deaths from digestive diseases", label: "Digestive", group: "ncd", unit: "deaths" },
  { id: "health.gbd.deaths_alzheimers", variableId: 1158943, title: "Deaths from Alzheimer's & other dementias", label: "Dementias", group: "ncd", unit: "deaths" },
  // Communicable, maternal, neonatal & nutritional
  { id: "health.gbd.deaths_lower_respiratory", variableId: 1159214, title: "Deaths from lower respiratory infections", label: "Lower respiratory infections", group: "cmnn", unit: "deaths" },
  { id: "health.gbd.deaths_tuberculosis", variableId: 1159506, title: "Deaths from tuberculosis", label: "Tuberculosis", group: "cmnn", unit: "deaths" },
  { id: "health.gbd.deaths_diarrheal", variableId: 1159060, title: "Deaths from diarrheal diseases", label: "Diarrheal", group: "cmnn", unit: "deaths" },
  { id: "health.gbd.deaths_neonatal", variableId: 1159267, title: "Deaths from neonatal disorders", label: "Neonatal", group: "cmnn", unit: "deaths" },
  { id: "health.gbd.deaths_hiv", variableId: 1159129, title: "Deaths from HIV/AIDS", label: "HIV/AIDS", group: "cmnn", unit: "deaths" },
  { id: "health.gbd.deaths_malaria", variableId: 1159213, title: "Deaths from malaria", label: "Malaria", group: "cmnn", unit: "deaths" },
  { id: "health.gbd.deaths_nutritional", variableId: 1159302, title: "Deaths from nutritional deficiencies", label: "Nutritional", group: "cmnn", unit: "deaths" },
  // Injuries
  { id: "health.gbd.deaths_self_harm", variableId: 1159450, title: "Deaths from self-harm (suicide)", label: "Self-harm", group: "injury", unit: "deaths" },
  { id: "health.gbd.deaths_road_injuries", variableId: 1159449, title: "Deaths from road injuries", label: "Road injuries", group: "injury", unit: "deaths" },
  { id: "health.gbd.deaths_interpersonal_violence", variableId: 1159170, title: "Deaths from interpersonal violence", label: "Interpersonal violence", group: "injury", unit: "deaths" },
  { id: "health.gbd.deaths_drowning", variableId: 1159070, title: "Deaths from drowning", label: "Drowning", group: "injury", unit: "deaths" },
  // Pandemic (kept separate from the three GBD families)
  { id: "health.gbd.deaths_covid19", variableId: 1158971, title: "Deaths from COVID-19", label: "COVID-19", group: "pandemic", unit: "deaths" }
];

// GBD 2023 cause-of-death by AGE BAND (India, both sexes), via OWID's per-age
// "causes-of-death-in-..." graphers. Each band's top causes, so the article can show
// how the leading killer flips across life: birth complications -> accidents & suicide
// -> the NCD endgame. (OWID's age-band variables carry no sex dimension; a true
// age x sex cut would need IHME's GBD Results Tool directly.) variableIds verified 2026-06.
export const gbdAgeBands = [
  { band: "under5", label: "Under 5", causes: [
    { id: "health.gbd.age_under5_preterm", variableId: 1158693, label: "Preterm birth" },
    { id: "health.gbd.age_under5_lri", variableId: 1158658, label: "Lower respiratory infections" },
    { id: "health.gbd.age_under5_asphyxia", variableId: 1158690, label: "Birth asphyxia & trauma" },
    { id: "health.gbd.age_under5_congenital", variableId: 1158518, label: "Congenital defects" },
    { id: "health.gbd.age_under5_diarrheal", variableId: 1158545, label: "Diarrhoeal" },
    { id: "health.gbd.age_under5_sepsis", variableId: 1158694, label: "Neonatal sepsis" }
  ] },
  { band: "5_14", label: "5 to 14", causes: [
    { id: "health.gbd.age_5_14_drowning", variableId: 1156814, label: "Drowning" },
    { id: "health.gbd.age_5_14_neoplasms", variableId: 1156985, label: "Cancers" },
    { id: "health.gbd.age_5_14_diarrheal", variableId: 1156797, label: "Diarrhoeal" },
    { id: "health.gbd.age_5_14_road", variableId: 1157131, label: "Road injuries" },
    { id: "health.gbd.age_5_14_lri", variableId: 1156930, label: "Lower respiratory infections" },
    { id: "health.gbd.age_5_14_cardiovascular", variableId: 1156739, label: "Cardiovascular" }
  ] },
  { band: "15_49", label: "15 to 49", causes: [
    { id: "health.gbd.age_15_49_cardiovascular", variableId: 1156130, label: "Cardiovascular" },
    { id: "health.gbd.age_15_49_neoplasms", variableId: 1156415, label: "Cancers" },
    { id: "health.gbd.age_15_49_road", variableId: 1156585, label: "Road injuries" },
    { id: "health.gbd.age_15_49_self_harm", variableId: 1156590, label: "Suicide" },
    { id: "health.gbd.age_15_49_digestive", variableId: 1156217, label: "Digestive" },
    { id: "health.gbd.age_15_49_tuberculosis", variableId: 1156651, label: "Tuberculosis" }
  ] },
  { band: "50_69", label: "50 to 69", causes: [
    { id: "health.gbd.age_50_69_cardiovascular", variableId: 1157287, label: "Cardiovascular" },
    { id: "health.gbd.age_50_69_neoplasms", variableId: 1157578, label: "Cancers" },
    { id: "health.gbd.age_50_69_chronic_respiratory", variableId: 1157324, label: "Chronic respiratory" },
    { id: "health.gbd.age_50_69_diabetes", variableId: 1157364, label: "Diabetes" },
    { id: "health.gbd.age_50_69_tuberculosis", variableId: 1157820, label: "Tuberculosis" },
    { id: "health.gbd.age_50_69_digestive", variableId: 1157372, label: "Digestive" }
  ] },
  { band: "70plus", label: "70 and older", causes: [
    { id: "health.gbd.age_70plus_cardiovascular", variableId: 1157927, label: "Cardiovascular" },
    { id: "health.gbd.age_70plus_chronic_respiratory", variableId: 1157960, label: "Chronic respiratory" },
    { id: "health.gbd.age_70plus_neoplasms", variableId: 1158175, label: "Cancers" },
    { id: "health.gbd.age_70plus_diabetes", variableId: 1157998, label: "Diabetes" },
    { id: "health.gbd.age_70plus_diarrheal", variableId: 1158002, label: "Diarrhoeal" },
    { id: "health.gbd.age_70plus_dementias", variableId: 1157891, label: "Dementias" }
  ] }
];

// India's own vital registration — extracted from official RGI PDF reports into
// auditable JSON under data/manual/ (the source hosts are PDF-only / unreachable
// from the build server, so these are extracted once with page-level provenance).
// SRS = Sample Registration System (the survey behind India's official birth/death
// rates); a time series 2018-2023 that shows the COVID-2021 spike AND the recovery.
export const srsSeries = [
  { id: "health.srs.crude_death_rate", key: "crude_death_rate_total", title: "Crude death rate (SRS)" },
  { id: "health.srs.crude_death_rate_male", key: "crude_death_rate_male", title: "Crude death rate, male (SRS)" },
  { id: "health.srs.crude_death_rate_female", key: "crude_death_rate_female", title: "Crude death rate, female (SRS)" },
  { id: "health.srs.infant_mortality", key: "infant_mortality_total", title: "Infant mortality rate (SRS)" },
  { id: "health.srs.infant_mortality_male", key: "infant_mortality_male", title: "Infant mortality rate, male (SRS)" },
  { id: "health.srs.infant_mortality_female", key: "infant_mortality_female", title: "Infant mortality rate, female (SRS)" },
  { id: "people.srs.birth_rate", key: "birth_rate_total", title: "Crude birth rate (SRS)" },
  { id: "people.srs.birth_rate_rural", key: "birth_rate_rural", title: "Crude birth rate, rural (SRS)" },
  { id: "people.srs.birth_rate_urban", key: "birth_rate_urban", title: "Crude birth rate, urban (SRS)" },
  { id: "people.srs.tfr", key: "tfr_total", title: "Total fertility rate (SRS)" },
  { id: "people.srs.tfr_rural", key: "tfr_rural", title: "Total fertility rate, rural (SRS)" },
  { id: "people.srs.tfr_urban", key: "tfr_urban", title: "Total fertility rate, urban (SRS)" },
  { id: "people.srs.sex_ratio_at_birth", key: "sex_ratio_at_birth_total", title: "Sex ratio at birth (SRS)" },
  { id: "people.srs.sex_ratio_at_birth_rural", key: "sex_ratio_at_birth_rural", title: "Sex ratio at birth, rural (SRS)" },
  { id: "people.srs.sex_ratio_at_birth_urban", key: "sex_ratio_at_birth_urban", title: "Sex ratio at birth, urban (SRS)" }
];

// MCCD = Medical Certification of Cause of Death. India's own certified cause-of-death
// data (covers only the ~22% of deaths that are medically certified, so it is
// urban/institution-skewed, NOT representative — frame honestly). One share indicator
// per leading cause group, 2023 snapshot, keyed by label into data/manual/mccd-2023.json.
export const mccdCauseGroups = [
  { id: "health.mccd.share_circulatory", label: "Circulatory system" },
  { id: "health.mccd.share_symptoms_nec", label: "Symptoms/signs, ill-defined (NEC)" },
  { id: "health.mccd.share_respiratory", label: "Respiratory system" },
  { id: "health.mccd.share_infectious", label: "Infectious & parasitic" },
  { id: "health.mccd.share_genitourinary", label: "Genitourinary system" },
  { id: "health.mccd.share_neoplasms", label: "Neoplasms (cancers)" },
  { id: "health.mccd.share_injury", label: "Injury, poisoning & external" },
  { id: "health.mccd.share_digestive", label: "Digestive system" },
  { id: "health.mccd.share_perinatal", label: "Perinatal conditions" },
  { id: "health.mccd.share_other", label: "Other groups" }
];

// SRS Cause of Death Statistics 2021-2023 (RGI). India's NATIONALLY REPRESENTATIVE
// cause-of-death data — verbal-autopsy cause assignment on the SRS sample, so unlike
// MCCD (urban/certified only) it covers rural and at-home deaths. Reads keyed by
// label into data/manual/srs-cod-2021-2023.json. `set` selects causes vs broad groups.
export const srscodCauses = [
  { id: "health.srscod.cause_cardiovascular", label: "Cardiovascular disease" },
  { id: "health.srscod.cause_respiratory_infections", label: "Respiratory infections" },
  { id: "health.srscod.cause_cancers", label: "Cancers (malignant & other neoplasms)" },
  { id: "health.srscod.cause_respiratory_diseases", label: "Respiratory diseases" },
  { id: "health.srscod.cause_digestive", label: "Digestive diseases" },
  { id: "health.srscod.cause_fever_unknown", label: "Fever of unknown origin" },
  { id: "health.srscod.cause_injuries_nonvehicle", label: "Unintentional injuries (non-vehicle)" },
  { id: "health.srscod.cause_diabetes", label: "Diabetes mellitus" },
  { id: "health.srscod.cause_genitourinary", label: "Genito-urinary diseases" },
  { id: "health.srscod.cause_tuberculosis", label: "Tuberculosis" }
];
export const srscodBroadGroups = [
  { id: "health.srscod.broad_ncd", key: "ncd", label: "Non-communicable" },
  { id: "health.srscod.broad_communicable", key: "communicable_maternal_perinatal_nutritional", label: "Communicable, maternal & nutritional" },
  { id: "health.srscod.broad_injuries", key: "injuries", label: "Injuries" },
  { id: "health.srscod.broad_ill_defined", key: "ill_defined", label: "Ill-defined" }
];
// Sex contrast from SRS-CoD broad groups (India's own; GBD's age x sex cut is not on
// OWID). Men die far more of injuries; women carry more 'ill-defined' deaths.
export const srscodSexBroad = [
  { id: "health.srscod.broad_ncd_male", key: "ncd", sex: "male", label: "Non-communicable (men)" },
  { id: "health.srscod.broad_ncd_female", key: "ncd", sex: "female", label: "Non-communicable (women)" },
  { id: "health.srscod.broad_communicable_male", key: "communicable_maternal_perinatal_nutritional", sex: "male", label: "Communicable (men)" },
  { id: "health.srscod.broad_communicable_female", key: "communicable_maternal_perinatal_nutritional", sex: "female", label: "Communicable (women)" },
  { id: "health.srscod.broad_injuries_male", key: "injuries", sex: "male", label: "Injuries (men)" },
  { id: "health.srscod.broad_injuries_female", key: "injuries", sex: "female", label: "Injuries (women)" },
  { id: "health.srscod.broad_ill_defined_male", key: "ill_defined", sex: "male", label: "Ill-defined (men)" },
  { id: "health.srscod.broad_ill_defined_female", key: "ill_defined", sex: "female", label: "Ill-defined (women)" }
];

// World Bank CCKP — India national CMIP6 climate: observed-proxy (historical run)
// + projections to 2100 under SSP scenarios. Gives the article a forward-looking view
// it otherwise lacks. State-level (adm1) is available too but the geocode->name
// cross-walk is unresolved, so the state choropleth is a separate task.
export const cckpIndicators = [
  { id: "climate.cckp.temp_historical", variable: "tas", period: "1950-2014", scenario: "historical", title: "India average temperature, observed (CMIP6 historical)", unit: "°C" },
  { id: "climate.cckp.temp_ssp126", variable: "tas", period: "2015-2100", scenario: "ssp126", title: "India temperature projection, low emissions (SSP1-2.6)", unit: "°C" },
  { id: "climate.cckp.temp_ssp245", variable: "tas", period: "2015-2100", scenario: "ssp245", title: "India temperature projection, middle road (SSP2-4.5)", unit: "°C" },
  { id: "climate.cckp.temp_ssp585", variable: "tas", period: "2015-2100", scenario: "ssp585", title: "India temperature projection, high emissions (SSP5-8.5)", unit: "°C" },
  { id: "climate.cckp.precip_historical", variable: "pr", period: "1950-2014", scenario: "historical", title: "India annual precipitation, observed (CMIP6 historical)", unit: "mm" },
  { id: "climate.cckp.precip_ssp245", variable: "pr", period: "2015-2100", scenario: "ssp245", title: "India precipitation projection, middle road (SSP2-4.5)", unit: "mm" },
  // Heat-risk indices (CCKP heat-risk module): hi39 = days the HEAT INDEX (temp + humidity)
  // feels like 39C+, the human-danger metric; hd40 = days max temp >40C; tr26 = nights >26C.
  { id: "climate.cckp.heatindex39_historical", variable: "hi39", period: "1950-2014", scenario: "historical", title: "Dangerous heat-index days, observed", unit: "days" },
  { id: "climate.cckp.heatindex39_ssp126", variable: "hi39", period: "2015-2100", scenario: "ssp126", title: "Dangerous heat-index days, low emissions (SSP1-2.6)", unit: "days" },
  { id: "climate.cckp.heatindex39_ssp245", variable: "hi39", period: "2015-2100", scenario: "ssp245", title: "Dangerous heat-index days, middle road (SSP2-4.5)", unit: "days" },
  { id: "climate.cckp.heatindex39_ssp585", variable: "hi39", period: "2015-2100", scenario: "ssp585", title: "Dangerous heat-index days, high emissions (SSP5-8.5)", unit: "days" },
  { id: "climate.cckp.hotdays40_historical", variable: "hd40", period: "1950-2014", scenario: "historical", title: "Days above 40C, observed", unit: "days" },
  { id: "climate.cckp.hotdays40_ssp245", variable: "hd40", period: "2015-2100", scenario: "ssp245", title: "Days above 40C projection (SSP2-4.5)", unit: "days" },
  { id: "climate.cckp.warmnights26_historical", variable: "tr26", period: "1950-2014", scenario: "historical", title: "Warm nights above 26C, observed", unit: "nights" },
  { id: "climate.cckp.warmnights26_ssp245", variable: "tr26", period: "2015-2100", scenario: "ssp245", title: "Warm nights above 26C projection (SSP2-4.5)", unit: "nights" },
  // Cooling degree days (base 65F): the heat-driven demand for cooling / air-conditioning,
  // a direct heat-to-economy-and-grid link the article otherwise lacks.
  { id: "climate.cckp.cdd_historical", variable: "cdd65", period: "1950-2014", scenario: "historical", title: "Cooling demand (degree days), observed", unit: "degree-days" },
  { id: "climate.cckp.cdd_ssp126", variable: "cdd65", period: "2015-2100", scenario: "ssp126", title: "Cooling demand projection, low emissions (SSP1-2.6)", unit: "degree-days" },
  { id: "climate.cckp.cdd_ssp245", variable: "cdd65", period: "2015-2100", scenario: "ssp245", title: "Cooling demand projection, middle road (SSP2-4.5)", unit: "degree-days" },
  { id: "climate.cckp.cdd_ssp585", variable: "cdd65", period: "2015-2100", scenario: "ssp585", title: "Cooling demand projection, high emissions (SSP5-8.5)", unit: "degree-days" }
];

// Google Data Commons (supplementary). Coverage for India climate is thin — most
// emissions/PM2.5/disaster variables return empty or stale single points. Only add a
// (variable, India) pair here after verifying it is populated, fresh, and not already
// covered better by a direct adapter. Total GHG via ClimateTrace is ~1yr fresher than OWID.
export const dataCommonsIndicators = [
  { id: "climate.dc.ghg_total_climatetrace", variable: "Annual_Emissions_GreenhouseGas", title: "Total greenhouse gas emissions (ClimateTrace, near real-time)", unit: "tonnes CO₂e" }
];

// Berkeley Earth (file-based, no API). Long land-temperature record back to ~1816,
// but only updated to 2020, so it is the deep-history complement to OWID/ERA5/CCKP,
// not a recency source. Each entry yields an anomaly series (vs 1951-1980) and an
// absolute-degC series (anomaly + the header's baseline absolute temperature).
export const berkeleyIndicators = [
  {
    region: "india",
    metric: "TAVG",
    anomaly: { id: "climate.berkeley.temp_anomaly", title: "India land temperature anomaly since 1816 (Berkeley Earth)", unit: "°C vs 1951-1980" },
    absolute: { id: "climate.berkeley.temp_abs", title: "India average land temperature since 1816 (Berkeley Earth)", unit: "°C" }
  }
];

// PSMSL tide-gauge sea level (file-based, no API). Rebased to each station's 1961-1990
// mean so the series shows sea-level rise in mm. India's longest coastal records.
export const psmslStations = [
  { id: 43, city: "Mumbai", indicator: "climate.psmsl.mumbai", title: "Sea level at Mumbai (since 1878)" },
  { id: 205, city: "Chennai", indicator: "climate.psmsl.chennai", title: "Sea level at Chennai (since 1916)" }
];

export const waqiCities = [
  { id: "climate.waqi.delhi", city: "delhi", title: "Delhi air quality index", unit: "AQI" },
  { id: "climate.waqi.mumbai", city: "mumbai", title: "Mumbai air quality index", unit: "AQI" },
  { id: "climate.waqi.kolkata", city: "kolkata", title: "Kolkata air quality index", unit: "AQI" },
  { id: "climate.waqi.chennai", city: "chennai", title: "Chennai air quality index", unit: "AQI" },
  { id: "climate.waqi.bengaluru", city: "bengaluru", title: "Bengaluru air quality index", unit: "AQI" }
];

export const openMeteoCities = [
  { id: "delhi", name: "Delhi", latitude: 28.6139, longitude: 77.2090 },
  { id: "mumbai", name: "Mumbai", latitude: 19.0760, longitude: 72.8777 },
  { id: "kolkata", name: "Kolkata", latitude: 22.5726, longitude: 88.3639 },
  { id: "chennai", name: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { id: "bengaluru", name: "Bengaluru", latitude: 12.9716, longitude: 77.5946 },
  { id: "jodhpur", name: "Jodhpur", latitude: 26.2389, longitude: 73.0243 },
  { id: "jaipur", name: "Jaipur", latitude: 26.9124, longitude: 75.7873 },
  { id: "nagpur", name: "Nagpur", latitude: 21.1458, longitude: 79.0882 },
  { id: "ahmedabad", name: "Ahmedabad", latitude: 23.0225, longitude: 72.5714 },
  { id: "hyderabad", name: "Hyderabad", latitude: 17.3850, longitude: 78.4867 },
  { id: "patna", name: "Patna", latitude: 25.5941, longitude: 85.1376 },
  { id: "lucknow", name: "Lucknow", latitude: 26.8467, longitude: 80.9462 },
  { id: "bhopal", name: "Bhopal", latitude: 23.2599, longitude: 77.4126 },
  { id: "varanasi", name: "Varanasi", latitude: 25.3176, longitude: 82.9739 },
  { id: "bhubaneswar", name: "Bhubaneswar", latitude: 20.2961, longitude: 85.8245 },
  { id: "raipur", name: "Raipur", latitude: 21.2514, longitude: 81.6296 },
  { id: "ranchi", name: "Ranchi", latitude: 23.3441, longitude: 85.3096 },
  { id: "srinagar", name: "Srinagar", latitude: 34.0837, longitude: 74.7973 },
  { id: "pune", name: "Pune", latitude: 18.5204, longitude: 73.8567 },
  { id: "surat", name: "Surat", latitude: 21.1702, longitude: 72.8311 },
  { id: "indore", name: "Indore", latitude: 22.7196, longitude: 75.8577 },
  { id: "gwalior", name: "Gwalior", latitude: 26.2183, longitude: 78.1828 },
  { id: "visakhapatnam", name: "Visakhapatnam", latitude: 17.6868, longitude: 83.2185 },
  { id: "vijayawada", name: "Vijayawada", latitude: 16.5062, longitude: 80.6480 },
  { id: "coimbatore", name: "Coimbatore", latitude: 11.0168, longitude: 76.9558 },
  { id: "madurai", name: "Madurai", latitude: 9.9252, longitude: 78.1198 },
  { id: "kochi", name: "Kochi", latitude: 9.9312, longitude: 76.2673 },
  { id: "thiruvananthapuram", name: "Thiruvananthapuram", latitude: 8.5241, longitude: 76.9366 },
  { id: "guwahati", name: "Guwahati", latitude: 26.1445, longitude: 91.7362 },
  { id: "shillong", name: "Shillong", latitude: 25.5788, longitude: 91.8933 },
  { id: "imphal", name: "Imphal", latitude: 24.8170, longitude: 93.9368 },
  { id: "agartala", name: "Agartala", latitude: 23.8315, longitude: 91.2868 },
  { id: "chandigarh", name: "Chandigarh", latitude: 30.7333, longitude: 76.7794 },
  { id: "amritsar", name: "Amritsar", latitude: 31.6340, longitude: 74.8723 },
  { id: "dehradun", name: "Dehradun", latitude: 30.3165, longitude: 78.0322 },
  { id: "shimla", name: "Shimla", latitude: 31.1048, longitude: 77.1734 },
  { id: "leh", name: "Leh", latitude: 34.1526, longitude: 77.5770 },
  { id: "bikaner", name: "Bikaner", latitude: 28.0229, longitude: 73.3119 }
];

export const openMeteoDerivedIndicators = [
  {
    metric: "mean_temperature",
    titleSuffix: "annual mean temperature",
    unit: "°C",
    calculation: "Average of daily mean temperature for each calendar year."
  },
  {
    metric: "very_hot_days",
    titleSuffix: "very hot days",
    unit: "days",
    threshold: "Daily maximum temperature >= 35°C",
    calculation: "Count of days in each calendar year where daily maximum temperature is at or above 35°C."
  },
  {
    metric: "hot_nights",
    titleSuffix: "hot nights",
    unit: "nights",
    threshold: "Daily minimum temperature >= 28°C",
    calculation: "Count of days in each calendar year where daily minimum temperature is at or above 28°C."
  },
  {
    metric: "precipitation_sum",
    titleSuffix: "annual rainfall",
    unit: "mm",
    calculation: "Sum of daily precipitation for each calendar year."
  },
  {
    metric: "rainy_days",
    titleSuffix: "rainy days",
    unit: "days",
    threshold: "Daily precipitation >= 1 mm",
    calculation: "Count of days in each calendar year with at least 1 mm of precipitation."
  },
  {
    metric: "mean_apparent_temperature",
    titleSuffix: "annual mean feels-like temperature",
    unit: "°C",
    calculation: "Average of daily mean apparent ('feels-like') temperature for each calendar year. Apparent temperature combines air temperature with humidity, wind, and radiation."
  },
  {
    metric: "humid_heat_days",
    titleSuffix: "dangerous-heat days",
    unit: "days",
    threshold: "Daily maximum apparent ('feels-like') temperature >= 40°C",
    calculation: "Count of days in each calendar year where the daily maximum apparent ('feels-like') temperature is at or above 40°C — a humidity-aware measure of oppressive heat."
  }
];
