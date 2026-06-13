import { mkdir, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { lintExplanation, findingsToInstruction } from "./core/prose-lint.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, limit: Infinity, questions: null, singlePass: false };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    if (arg === "--single-pass") args.singlePass = true;
    if (arg.startsWith("--limit=")) args.limit = Number(arg.slice("--limit=".length));
    if (arg.startsWith("--questions=")) {
      args.questions = new Set(arg.slice("--questions=".length).split(",").map((value) => value.trim()).filter(Boolean));
    }
  }
  return args;
}

function systemPrompt() {
  return [
    "You write for Indica, a public data almanac about India.",
    "Return only valid JSON.",
    "You are not free-writing. Execute the evidence packet: read the theme, inspect all themeIndicatorIds, choose the most important data points, and explain the visualPlan.",
    "NUMBER DISCIPLINE IS ABSOLUTE: every number, statistic, rate, share, ranking, rupee figure, and date-as-a-fact in the prose must come from the evidence packet. Never invent, estimate, round-trip from memory, or 'recall' a number or a source. If a number is not in the evidence, you may not state it. When a locked number has displayValue, use it verbatim.",
    "CONTEXT LICENCE (use it to make the prose deep, but carefully): beyond the numbers, you MAY add brief, widely-established, uncontested context from general knowledge — the historical background a pattern sits in, the mechanism behind it, or a concept the reader needs — when it genuinely helps a layperson understand. Hard limits: introduce NO new numbers, dates-as-fact, or named studies this way; stay at textbook level that a domain expert would not dispute; phrase it as background, never as a finding from this data; attach it to the data, do not freewheel. If you are not certain a piece of context is both correct and uncontested, leave it out. When in doubt, cut it. This licence covers qualitative framing only — it never loosens NUMBER DISCIPLINE.",
    "Do not call World Bank, OWID, WHO, Ember, or WAQI an Indian official source. Say the source name plainly.",
    "Do not say 'the main reason' unless the evidence packet explicitly proves causality. Say 'one visible reason in this data' or 'the related trend is'.",
    "Do not predict policy effects such as pensions, healthcare demand, school pressure, or jobs unless you phrase them as questions the chart raises.",
    "Do not use outside benchmark numbers such as replacement fertility unless that number is present in the evidence packet.",
    "Do not compare India to the world, large economies, rich countries, China, the US, or any peer unless that comparison is present in lockedNumbers or sourceSummaries.",
    "Do not call a number low, high, strong, weak, fast, slow, huge, tiny, or modest unless the evidence packet contains a comparison that supports that judgment.",
    "Do not subtract one indicator from another or create rough derived claims unless the evidence packet explicitly provides that derived number.",
    "For GDP, do not call GDP the country's income. Say it is a measure of production/output.",
    "For GDP pages, explain the accounting clearly: production/output, expenditure/spending, nominal vs real, per capita, GVA, taxes/subsidies, imports/exports, and what GDP does not show.",
    "For GVA, explain that GVA is output by producers/sectors before adding product taxes and subtracting product subsidies; GDP is the headline aggregate after that adjustment.",
    "Do not merely describe chart shapes. Answer the reader's question and teach the economic concept needed to interpret the chart.",
    "When a locked number has displayValue, use displayValue exactly instead of reformatting the raw value yourself.",
    "The audience is everyone: write so a sharp sixteen-year-old, or a curious reader in a small town with no college and no economics, fully understands every sentence — while a domain expert finds nothing dumbed-down or wrong. Clarity for the last reader and rigour for the first are the same craft, not a trade-off.",
    "QUALITY BAR: this should be the best, most human writing a reader has ever found on the subject — deep, nuanced, and quietly authoritative, yet effortless to read. Lead a section with a concrete image, a person, or a small scene when it earns its place. Ground every abstraction in an everyday Indian example a reader can see (a shopkeeper, a field, a first salary, a bus queue). One idea per sentence; define each concept the instant it appears. Nuance means naming the honest 'but' a thoughtful reader would raise and answering it, never hedging into mush. Earn every sentence; cut anything that is not doing work.",
    "Write clean Indian English. Short sentences. Concrete nouns. No jargon unless you explain it immediately.",
    "Avoid AI-writing tells: no 'delve', 'tapestry', 'complex interplay', 'crucial', 'it is important to note', 'in conclusion', 'moreover', 'furthermore', generic balance paragraphs, or theatrical transitions.",
    "Never use em-dashes. Use a comma, a period, or rephrase. Do not use the 'not just X, it is Y' construction or end a section on an editorial aphorism.",
    "Round numbers the way a human editor would. Write '1.45 billion' or '145 crore', never '1,450,935,791'. Round rates and ratios to one decimal: '1.9 per 1,000', not '1.875'. When a locked number has a displayValue, prefer it. Keep full precision only inside charts, never in prose.",
    "Do not sound like a report. Sound like a sharp editor who is helping a normal person read a chart correctly.",
    "The short version should be precise and readable in one screen.",
    "The macha block is the 'tell me what this means, bro' layer. Its heading is playful and a little cheeky in Indian-English; its body is warm, grounded, plain, and genuinely helpful (a smart friend explaining the whole picture), never snarky, comedic, or jargon-filled. It summarises what the entire page means, not one chart.",
    "The article must be question-led. Use markdown H2 headings phrased as reader questions.",
    "The evidence packet's plannedCharts is the exact, ordered set of charts that will appear on the page. Build the article around them: write one H2 section per planned chart, in the same order, and tie that section's prose directly to its chart and its numbers. The article is the narrative thread that connects every chart into one answer to the page question.",
    "Open by answering the page question in plain terms, then move chart by chart: what this chart shows, what the number means, why it matters, and how it connects to the previous chart. Close on what the whole picture means and the main caveat. It must read as one coherent essay, not a list of captions.",
    "Each H2 section should be 120-200 words and must GENUINELY ANSWER its heading question, not just describe the chart's shape. If the heading asks 'why', give the mechanism and the reason (using evidence, phrased as 'one visible pattern in this data is' when causation is not proven). A reader should finish each section feeling the question was actually answered. Aim for the full available length: for a rich page with many planned charts, that is roughly 1500-2200 words. Do not skimp, but never pad with filler. If you cannot write at least 500 useful words using only evidence, set status to needs_data.",
    "Write a chartExplainer for EVERY planned chart, using its exact title from plannedCharts and setting its visualId to that chart's chartId from plannedCharts. Each explainer needs: a takeaway (one sharp sentence naming the key number), a detail (4-7 vivid plain-language sentences that genuinely explain the chart, its numbers, the trend, and what is driving it), howToRead, and mistakeToAvoid. Everything must be specific to that chart and its actual numbers, never generic boilerplate, and never identical across charts.",
    "In sectionVisualMap, map each H2 heading to the chartId (from plannedCharts) of the chart that section discusses. Use the chartId string exactly, not the indicator name or a made-up id.",
    "Write a glossaryBlock for EVERY technical term, acronym or piece of jargon a lay reader actually meets in the prose (typically 6-12; more on jargon-heavy pages). Cover acronyms (e.g. GVA, WPI, ONI, IOD), domain words (e.g. kharif, rabi, anomaly, departure, long-period average) and statistical terms (e.g. correlation). Spell each term EXACTLY as it appears in the body, accents included (e.g. 'El Niño', not 'El Nino'; 'GVA (gross value added)' so it matches the body's 'GVA'), because the term is matched against the prose to attach its definition. Assume zero economics or statistics background. Each plainMeaning opens with an everyday analogy or concrete example, then defines the idea simply, says what it counts, and warns what it does not mean. For at most one or two load-bearing terms that carry an important caveat (for instance a wholesale price index that is not the retail price households pay), set \"keyTerm\": true so it renders as a prominent inline box, and use its whyItMattersHere to state the caveat. These must genuinely teach a layperson, not just define a term.",
    "Always do a data-selection audit before finalizing: ask whether the selected data points answer the question, what to add, what to remove, and the best visualization type, duration/window, and frequency for each important visual.",
    "Use pull quotes only for banger points supported by locked numbers. No vague quotes.",
    "Glossary blocks should explain technical terms like GDP, CPI, fertility, dependency ratio, per capita, AQI, or TWh in plain language.",
    "If the evidence is not enough, set status to 'needs_data' and write honestly about the gap.",
    "The top-level JSON object must contain schemaVersion, questionId, status, short, article, sourceNotes, caveats, lockedNumbersUsed, and qualityFlags. Do not wrap the answer in task, outputSchema, or any other parent object."
  ].join("\n");
}

function articleTemplateFor(evidence) {
  if (evidence.questionId === "q.econ.motorisation") {
    const planned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how India became a motorised country from the beginning of the available VAHAN data in 2003, without turning the piece into either a car story or an EV puff piece. The core argument is: India added vehicles at astonishing scale, from 4.4 million registrations in FY 2003-04 to 30.8 million in FY 2025-26, but the structure of that motorisation stayed Indian: two-wheelers dominate, cars remain a minority, three-wheelers and e-rickshaws matter, petrol still rules, diesel fades, and EVs are now large enough to matter but not large enough to define the system. Use GDP and per-capita GDP as an honest test, not a magic explanation: registrations correlate strongly with income levels because both trend upward, but same-year growth correlations are much weaker once Covid is excluded, so the truthful reading is that income is the background engine while credit, prices, supply, policy, festivals and state-level development shape the year-to-year road. Bring in SIAM only as a wholesale-sales check, not as registrations. Bring in Ember only as electricity-grid context for EVs, not as EV adoption data. Carry the argument forward chart by chart. Write with confidence, but be scrupulous about measurement boundaries. Never narrate the article mechanically, never say 'this chart shows' as a crutch, never use em-dashes, and never pad with generic transport-policy prose.",
      requiredSections: planned.length
        ? [
            ...planned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A closing reader-question H2, 'How should you read these numbers?', that names the sources and methodology plainly, states what VAHAN can and cannot measure, explains the fiscal-year derivations, notes the 2026 partial-month caveat, separates registrations from sales, separates EV registrations from grid emissions, and avoids false precision."
          ]
        : [
            "How big did India's vehicle market become?",
            "Did GDP explain the boom?",
            "Why is India still a two-wheeler country?",
            "What changed in fuel and EVs?",
            "Where did the growth happen?",
            "What do credit, fuel prices and festivals add?",
            "How should you read these numbers?"
          ],
      requiredConcepts: [
        "The opening fact: VAHAN fiscal-year registrations rose from about 4.4 million in FY 2003-04 to about 30.8 million in FY 2025-26, roughly seven times. Calendar-year registrations rose from about 4.2 million in 2003 to about 29.3 million in 2025. Phrase these as registrations recorded in VAHAN, not vehicles sold, produced, or owned.",
        "Start the story in 2003 because that is where the VAHAN tables in the repository begin. The latest monthly data in the raw tables runs into June 2026, but 2026 is partial through June 13, 2026. Full-year comparisons should use complete calendar years through 2025 or complete fiscal years through FY 2025-26.",
        "The GDP test is important and must be honest: registrations and GDP levels have high correlations because both trend upward over two decades. Same-year growth is the harder test. Excluding the Covid collapse and rebound, registration growth correlates with nominal per-capita GDP growth around 0.81, nominal GDP around 0.78, real GDP around 0.54, and real per-capita GDP around 0.46. That means income matters, but does not explain the whole year-to-year pattern.",
        "Use nominal and real income differently. Nominal GDP and nominal per-capita GDP capture rupee spending capacity, including inflation. Real GDP and real per-capita GDP capture volume growth after inflation. Do not mix them casually. The article may say nominal India expanded faster than VAHAN, while VAHAN outran real income and real per-capita income.",
        "Per-capita registrations make the scale less population-driven: new registrations per 1,000 people rose from about 3.8 in 2003 to about 18.8 in 2024. That is still registrations per year, not total vehicles per person or vehicle ownership.",
        "The composition is the most Indian part of the story. Two-wheelers were about 68% of FY 2003-04 registrations and about 72% in FY 2025-26. Cars and cabs were about 18% at the start and about 16% in FY 2025-26. The country motorised mostly on scooters, motorcycles and mopeds, not cars.",
        "Three-wheelers matter because e-rickshaws changed the bottom of urban and small-town mobility. Three-wheelers rose to about 4% of FY 2025-26 registrations. Treat this as a class shift, not only a fuel shift.",
        "Fuel story: petrol and petrol-hybrids were about 79% of FY 2025-26 registrations, diesel and diesel-hybrids about 10%, battery EVs about 8.25%, and CNG about 1.6%. The honest EV headline is large enough to matter, not large enough to dominate.",
        "Battery EV registrations are ELECTRIC(BOV) plus PURE EV in VAHAN fuel tables. That is a registration classification. It is not fleet share, vehicle-kilometres, emissions saved, or charging demand.",
        "State geography: Uttar Pradesh added the most registrations between calendar 2003 and calendar 2025, followed by Maharashtra, Gujarat and Tamil Nadu. This is an absolute-additions ranking, so big states dominate. Do not present it as per-capita motorisation.",
        "Seasonality is real and visible. October and November spikes are large in recent years, with October 2025 the largest month in the VAHAN series. But festival timing shifts by year, so do not make one month a permanent seasonal law.",
        "Credit is a mechanism, but the available vehicle-loan series is outstanding stock from the RBI/IndiaDataHub feed, not new loan originations. It can support the idea that vehicle buying became more financed, but it cannot prove how many registrations were loan-funded.",
        "Fuel prices are consumer price indexes from MoSPI CPI, not pump prices per litre. Diesel's index rose faster than petrol's after the 2012 base, which changed running-cost economics, but state taxes and vehicle-use patterns are outside this chart.",
        "Transport-and-communication CPI is the broader household mobility-cost backdrop. It includes transport services and communication, not only private vehicle running costs. The rural transport index reached about 178.5 by December 2025, above the urban index around 166.9, so rural mobility-cost pressure looks higher on this measure.",
        "Do not write a simplistic 'higher CPI killed vehicle demand' claim. Monthly correlations between year-on-year VAHAN registration growth and transport/fuel CPI inflation are small and mostly positive, roughly 0.1 to 0.25 when Covid years are excluded. The honest interpretation is that expansion years often saw both more registrations and higher mobility prices, while CPI alone cannot isolate affordability, credit, supply or policy.",
        "SIAM reports domestic wholesale sales by manufacturers, not retail registrations. Use SIAM's FY 2025-26 mix as an industry-side sanity check that the two-wheeler dominance also appears outside VAHAN. The scraped public SIAM trend has a gap from FY 2013-14 to FY 2025-26, so do not turn it into a continuous history.",
        "Ember is electricity data, not EV India data. It gives the grid context for EV charging: renewables generated about 24% of India's electricity in 2025, wind and solar about 14%, and carbon intensity was about 671 gCO2/kWh. That is not a lifecycle EV emissions calculation.",
        "Avoid single-cause writing. The article should say income, credit, fuel prices, regulations, road infrastructure, urbanisation, rural incomes, festivals and supply constraints all shape vehicle registrations, but the data here directly measures only registrations and selected context series.",
        "Methodology must explain derived series: fiscal years are April-to-March sums of VAHAN monthly tables; vehicle classes and fuels are grouped into readable buckets; per-capita registrations divide calendar-year VAHAN totals by World Bank population; GDP indexes are MoSPI NAS series set to FY 2003-04 = 100; correlations are Pearson correlations; growth correlations exclude FY 2020-21 and FY 2021-22 to reduce Covid distortion."
      ],
      styleExample: [
        "## Did India become a car country?",
        "No. It became a motorised country, and those are not the same thing. The easy image of development is a family graduating from a scooter to a hatchback to an SUV. Some of India did that, especially in richer cities. But the national road tells a less glamorous and more important story: two-wheelers stayed at roughly seven out of every ten new registrations even after two decades of growth. That is not a rounding error. It is the structure of Indian mobility, built around price, parking, congestion, fuel cost, short trips, informal work and the fact that a motorcycle can be both a family vehicle and a livelihood tool. The car arrived. It did not take over."
      ].join("\n\n")
    };
  }
  if (["q.econ.asia_divergence", "q.econ.asia_divergence_engine", "q.econ.asia_divergence_2", "q.econ.asia_divergence_3"].includes(evidence.questionId)) {
    const planned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    const part = evidence.questionId === "q.econ.asia_divergence_3" ? 4 : evidence.questionId === "q.econ.asia_divergence_2" ? 3 : evidence.questionId === "q.econ.asia_divergence_engine" ? 2 : 1;
    const part1Purpose = "Answer why India and China started together in 1950 but ended worlds apart, and how India fell behind on the most basic foundation of all, its people. This is Part 1 of a four-part series. The puzzle: around 1950 India was no poorer than China, South Korea or its neighbours, and on some counts a little richer, yet over the next seventy years they pulled far ahead. The series argues the 'integrated East Asian model', a sequence: build human capital first, then force up investment, then move labour into manufacturing, then climb into sophisticated exports. Part 1 is the foundation, the people: the same starting line and the great divergence; then health (life expectancy, child survival, hunger and stunting); education, both years of schooling AND, crucially, how little is actually learned; the human-capital scorecard; women's near-absence from paid work and from public life; and how little India spent on its people. End on India's startling outliers, how few of its women work and how low it scores on learning. Be scrupulously disciplined about cause: state WHAT the data shows while being explicit it cannot prove WHICH mattered most or that there was a single cause. Close by pointing the reader to Part 2, the growth engine. Carry the argument forward section by section. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and Asia. Never use em-dashes.";
    const part2Purpose = "Answer why India could not build the growth engine that powered East Asia, in the voice of someone who knows development economics cold. This is Part 2 of a four-part series; Part 1 showed the human-capital foundation India under-built. Now the engine: East Asia forced its saving and investment rates far above India's, deepened its banks to channel that money into industry, pulled in foreign factories, and rode manufacturing up the value chain, while India invested less, financed less, and never built the mass-factory base. Walk it in order: gross fixed capital formation, gross saving, foreign direct investment, how deep the banking system reached (credit to the private sector), then the manufacturing escalator India never rode, China's industrial rise on the broader measure, and India's leap from farms straight to services. Be scrupulously disciplined about cause: state WHAT the data shows, never claim a single villain. Close by pointing the reader to Part 3, the road India took instead. Carry the argument forward section by section. Never narrate the article itself; write about India and Asia. Never use em-dashes.";
    const part3Purpose = "Answer what road India took instead of the East Asian factory route, and where it left the country, in the voice of someone who knows development economics cold. This is Part 3 of a four-part series; Parts 1 and 2 showed the human-capital foundation and the investment-and-manufacturing engine India under-built. Open by briefly recapping that, then carry the argument forward: India moved workers off the farm slowly, and the work it made was overwhelmingly informal, with no contract or safety net; it kept a high tariff wall while the tigers opened; won only a sliver of world goods trade as China seized a huge share; stayed lower on the export-complexity ladder; and became a large market for China's own factories. Then show where that left India, in productivity, research, power and cities. Then tell the honest other side in full: India did crush extreme poverty, it built a real export engine in services rather than goods (a different escalator that lifts fewer low-skilled workers), its human-development scorecard climbed, and it did all this as a continuous democracy while Korea and Taiwan democratised only after their growth takeoffs. Be scrupulously disciplined about cause: state WHAT the data shows, never claim a single villain, and never imply coercion was the price worth paying. Close by pointing the reader to Part 4, which opens the engine of growth itself and asks whether India can still catch up. Carry the argument forward section by section. Never narrate the article itself; write about India and Asia. Never use em-dashes.";
    const part4Purpose = "Answer how the East Asian economies actually pulled it off, and whether India can still catch up, in the voice of someone who knows growth economics cold. This is Part 4, the capstone, of a four-part series; Parts 1 to 3 covered the people, the engine, and the road India took instead. Open by briefly recapping the puzzle (same 1950 start, India now far behind), then go under the hood of growth itself: the sustained decade-after-decade growth-rate gap that income levels hide; the famous growth-accounting debate, whether East Asia grew by sheer capital accumulation ('perspiration', after Krugman in 1994) or by rising productivity ('inspiration'), and where India's productivity and capital-per-worker sit; the demographic-dividend window and who actually used it; whether the growth was broadly shared or top-heavy; how deeply each economy plugged into global value chains; and finally a clear-eyed projection of when India might reach where China and South Korea stand today. Be scrupulously disciplined: present the growth-accounting question as genuinely unsettled, and flag the projection as illustrative, not a forecast. Never claim a single cause; never imply coercion was the price. Carry the argument forward section by section. Never narrate the article itself; write about India and Asia. Never use em-dashes.";
    const part1Closer = "A closing reader-question H2, 'How should you read these comparisons, and what comes next?', the methodology-and-bridge section and the last section. Name the sources used in this part (the Maddison Project for the long-run GDP reconstruction; the IMF World Economic Outlook for the up-to-date per-capita income gap, at PPP in current international dollars with 2024-2025 estimated; the World Bank for health, demographic, learning, Human Capital Index, spending and gender indicators; Lee-Lee and Barro-Lee for the long-run schooling series; ILO modelled estimates for labour-force participation). State plainly: Maddison's pre-1950 figures are reconstructions read as trajectory not precise levels; PPP is a modelled price adjustment, never mixed with market rates; the learning scores and Human Capital Index are latest-year snapshots, not trends; labour figures are modelled and differ from India's surveys; Taiwan is absent from World Bank data; and several factors moving together is not proof any one caused the divergence. End by telling the reader Part 2 turns to the growth engine, saving, investment, finance and the factory India never built. Write it as a short, honest paragraph, not a reference list.";
    const part2Closer = "A closing reader-question H2, 'How should you read these comparisons, and what comes next?', the methodology-and-bridge section and the last section. Name the sources (the World Bank for capital formation, gross saving, foreign direct investment, credit to the private sector, and manufacturing and industry value added). State plainly: the World Bank's narrow manufacturing series for China begins only in 2004, which is why China appears on the broader industry measure rather than the factory-only chart; investment, saving and credit ratios say nothing about the quality of what was built or financed, and more credit is not always better; PPP and market-rate figures are never mixed. End by telling the reader Part 3 follows the road India took instead, the kind of work it made, the trade it missed, and the honest other side. Write it as a short, honest paragraph, not a reference list.";
    const part3Closer = "A closing reader-question H2, 'How should you read these comparisons, and what comes next?', the methodology-and-bridge section and the last section. Name the sources plainly (the World Bank for trade, structure, productivity, R&D, power and poverty indicators; the World Bank's surfacing of the WTO merchandise-export series for world-trade shares; UN Comtrade for India's bilateral trade with China; ILOSTAT for informal employment; the Harvard Growth Lab's Atlas of Economic Complexity; the Penn World Table for output per hour; the UNDP Human Development Index; and the V-Dem electoral democracy index). State plainly: the services-share figure is derived from balance-of-payments goods and services exports; the India-China and world-export-share charts are merchandise (goods) only; ILOSTAT does not report comparable informality for China and South Korea, which are far more formalised; PPP and market-rate figures are never mixed; the V-Dem index measures electoral democracy, not growth, and the chart makes no claim that either system causes growth; and several factors moving together is not proof any one caused the divergence. End by telling the reader Part 4 opens the engine of growth itself (how fast they grew, capital versus productivity, the demographic window, equity and value chains) and asks when India might catch up. Write it as a short, honest paragraph, not a reference list.";
    const part4Closer = "A closing reader-question H2, 'How should you read these comparisons?', the methodology section and the closer of the whole four-part series, which must be the last section. Name the sources plainly (the Penn World Table for total-factor productivity and capital per worker; the Maddison Project for the long-run decade growth rates; the World Bank for the demographic data; the World Inequality Database for top-income shares; OECD TiVA for value-chain participation). State plainly: total factor productivity is a residual measured with real uncertainty and the 'perspiration versus inspiration' question is genuinely debated; the top-income shares are modelled and contested at the very top; backward value-chain participation reads low for large economies with deep domestic supply, such as China, for reasons unrelated to success; and the convergence chart is a simple constant-growth projection in real (constant-price) terms, not a forecast, measured against where China and South Korea stand today, not where they will be. Close the whole series by reminding the reader of its honest through-line: India under-did each link of the East Asian model, but the data shows what happened, not a single cause, and India's slower, democratic path still lifted hundreds of millions. Write it as a short, honest paragraph, not a reference list.";
    const purpose = part === 4 ? part4Purpose : part === 3 ? part3Purpose : part === 2 ? part2Purpose : part1Purpose;
    const closer = part === 4 ? part4Closer : part === 3 ? part3Closer : part === 2 ? part2Closer : part1Closer;
    const fallback = part === 4
      ? ["How fast did they actually grow?", "Was it capital or productivity?", "How much does each worker have to work with?", "Who used the demographic window?", "Did the growth reach everyone?", "Were they plugged into the world?", "So when does India catch up?", "How should you read these comparisons?"]
      : part === 3
        ? ["Why did India's workers stay on the farm?", "What kind of work did India make?", "How walled-off was India's economy?", "Who captured world trade?", "Did India become a market for China's factories?", "How big is the productivity gap now?", "What did India get right?", "How should you read these comparisons?"]
        : part === 2
          ? ["How much did each country invest?", "Who saved to pay for it?", "How deep did the banks go?", "Why did India skip the factory stage?", "Where did China's industry go on the chart?", "How should you read these comparisons?"]
          : ["Weren't India and China equally poor in 1950?", "What did East Asia build first?", "Is schooling the same as learning?", "Why do so few Indian women work for pay?", "How much did India spend on its people?", "How should you read these comparisons, and what comes next?"];
    return {
      purpose,
      requiredSections: planned.length
        ? [
            ...planned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            closer
          ]
        : fallback,
      requiredConcepts: [
        "The puzzle to open on, stated as a given fact from the Maddison Project's long-run reconstruction: around 1950 India was not poorer than its Asian peers and was on some counts a little richer. In 2011 international dollars, India's GDP per person was about $990, slightly above China's roughly $800, close to South Korea's roughly $1,000, and above Bangladesh's roughly $860. By 2022 the same series put China near $19,000 and South Korea above $41,000 while India was about $7,800. These are reconstructed historical estimates with wide error bars, so cite them as approximate and as the shape of a divergence, not exact values",
        "The article's central claim is the 'integrated East Asian model': a sequence in which a country first builds human capital (health and schooling and women's participation in work), then raises its saving and investment rate, then shifts labour into manufacturing, then climbs into more sophisticated exports, and grows rich as a result. India under-did each link. State this as the argument the data is organised around, not as proven causation",
        "Discipline about cause is the spine of this page: say clearly WHAT the data shows (India lagged on human capital, investment, manufacturing and export sophistication) but be explicit that these factors are entangled and the data cannot establish which mattered most or that any single one was the cause. Use 'one visible pattern in this data is' rather than 'the reason was'. Never claim a single villain",
        "Structural transformation in plain English: as poor countries grow, workers move from low-productivity farming into higher-productivity factories and then services, and average incomes rise as they move. This is the central mechanism of development and the thread running through several charts",
        "Premature deindustrialization, the concept (Dani Rodrik, 2016): manufacturing has historically been the 'escalator' that carried poor countries to rich-country incomes, because factory work is far more productive than farm work and can absorb millions of unskilled workers and sell to the whole world. India is the textbook case of a country whose manufacturing share peaked early and low and which shifted from farming largely into services, skipping the mass-manufacturing stage. State this as an established idea in development economics",
        "India's manufacturing share barely moved in over sixty years: manufacturing value added was about 15% of GDP in 1960, about 16% in 1991, and about 13% by 2024. South Korea's, by contrast, rose from about 11% in 1960 to a peak near 28% in the late 1980s and stayed high. These figures are in the evidence; the contrast is the heart of the manufacturing act",
        "Human capital is the stock of health, skills and schooling embodied in a country's people; it is what lets workers be trained, show up healthy, and be productive. East Asia raised it dramatically before its income takeoff, which is why life expectancy, child survival and schooling pulled ahead of India's decades before the income gap fully opened",
        "India's most striking outlier is women's work: by the modelled estimates only about a third of working-age Indian women are in the labour force, far below China, Vietnam and the rich East Asian economies, and Bangladesh's female participation has risen past India's even though Bangladesh started poorer. A smaller share of women working means a smaller workforce and a heavier dependency burden. Be honest that these are modelled ILO estimates that differ from India's own surveys, and that much of Indian women's work is unpaid or informal and so undercounted; do not assert a single cause for the low figure",
        "Mean years of schooling measures the human-capital stock directly (the average years of education adults have completed), which is sharper than literacy or enrolment; India started this climb late and remained below its East Asian peers for decades. Child stunting (being too short for one's age) is chronic malnutrition written into a child's growth and brain development; India's rate is high even compared with poorer countries, which is a genuine puzzle given its income",
        "Schooling and learning are different things: India lengthened time in school but learning lagged. On the World Bank's harmonized test scores (national test results put on one comparable scale) India sits near the bottom of this group, while Vietnam, much poorer, scores almost like a rich country. Make the schooling-is-not-learning point; these are latest-year snapshots, not trends",
        "The World Bank's Human Capital Index folds child survival, quality-adjusted years of schooling and adult survival into a single 0-to-1 number, the productivity a child born today can expect at adulthood relative to full health and education. India is about 0.49, below China, Vietnam and the rich economies; it is a useful summary but blends many things into one figure, so use it as a scorecard, not a precise measure",
        "Informal work is the dominant Indian reality: roughly nine in ten Indian workers are informal, with no written contract, social security or protection. Moving off the farm is not enough if the new work is informal; East Asia built formal factory and then office jobs. ILOSTAT does not report comparable informality for China and South Korea here, but both are far more formalised, so present India as high among its South and Southeast Asian peers with East Asia well below",
        "Financial deepening: high saving only powers growth if the financial system lends it to producers. Domestic credit to the private sector as a share of GDP measures how far the banking system reaches into business; East Asia's deepened fast and channelled credit into industry, India's stayed shallower. Note more credit is not automatically better, since it can fuel bubbles",
        "Women's exclusion runs beyond paid work into public life: India has the lowest share of women in parliament in this group. Seat shares reflect quotas and electoral rules as well as deeper equality, so treat it as one window on women's public role, not the whole of gender equality",
        "Gross fixed capital formation is the share of a country's output spent each year building productive capacity: factories, machines, roads, power and buildings. It is financed mostly by domestic saving. The East Asian economies ran investment and saving rates far above India's for decades, which is the under-told engine of their growth. Define both terms when first used",
        "Foreign direct investment is money from foreign firms building or buying productive capacity in a country, which brings not just capital but technology and access to export markets; China and Vietnam pulled in far more relative to their size than India did in its early decades",
        "Export sophistication matters as much as export volume: the Economic Complexity Index (Harvard Growth Lab) measures how diverse and hard-to-imitate a country's export basket is, and Korea, China and even Vietnam climbed it while India's basket stayed simpler. It is a ranking-based measure, so describe relative positions rather than absolute units. Manufactures as a share of merchandise exports is the simpler companion measure of the same idea",
        "Openness and protectionism: export-led growth requires plugging into world markets, and India did this late and only partly. India ran a far more closed, protected economy than the export-oriented East Asian tigers, with high tariffs, import licensing and the 'License Raj' until the 1991 reforms; applied tariffs fell sharply after 1991 but India has stayed less open than China, South Korea or Vietnam. State this as established economic history, and note tariffs are only one barrier among many",
        "India's services escalator, stated fairly with its catch: India's exports are unusually tilted toward services rather than goods. By the balance-of-payments data a far larger share of India's exports are services (software, IT and business services) than for the manufacturing-led tigers. This is a genuine export engine and a real achievement, but it is a different escalator from mass manufacturing: services of this kind have so far employed far fewer, and far more educated, workers, which is why they have not absorbed India's vast low-skilled workforce the way factory jobs absorbed East Asia's. Present this as the heart of the honest 'other side', neither a triumph nor a failure but a different path with different limits",
        "Land reform and the developmental state, told as context and explicitly as debated, not settled: in the late 1940s and 1950s Japan, South Korea and Taiwan carried out sweeping 'land to the tiller' reforms that redistributed farmland, which many scholars link to more equal societies, broader domestic markets and a foundation for industrial growth; China collectivised land by force. India legislated land reform but largely failed to enforce it. Recent reassessments (for example of Taiwan) find the direct growth effect of land reform was more modest than once thought, so present it as part of the East Asian package and a live scholarly debate, never as a proven single cause",
        "The policy-history contrast Oks and others draw, to be told as fact but handled with great care: in 1950 China passed the New Marriage Law and pushed women into the workforce, while India's attempt at a comparable overhaul of personal law, the Hindu Code Bill, was watered down and weakly enforced. State this as history. Do NOT imply that India's mistake was failing to coerce its society, and do not present China's methods as a model; the human cost was immense, and that is exactly the trade-off the final act examines",
        "The income gap is, at bottom, a productivity gap: output per hour worked and output per worker are far higher in the East Asian economies, because their workers have more capital, skills and modern industry behind them. Capability gaps show up elsewhere too: South Korea now spends about 5% of GDP on research and development, among the highest in the world, while India's R&D spending has been stuck below 1% for decades; electricity use per person and urbanisation tell the same story of an economy that industrialised less",
        "Present all sides in the final act, with these as given facts: India lifted hundreds of millions out of extreme poverty even without a manufacturing boom, so the floor rose sharply; it built a genuinely world-class services and software export sector, a different escalator rather than no escalator; its demographic dividend, a young population, is still ahead while China's and Korea's are closing; and it achieved all of this as a continuous electoral democracy. The V-Dem data shows India scoring consistently high on electoral democracy while China stayed autocratic, and South Korea and Taiwan democratised only in the late 1980s, after their growth takeoffs, not before. The honest reading is that East Asia's transformations were often coerced and sometimes brutal, and India's gentler, democratic path is a real and defensible trade-off, not simply a failure",
        "PPP AND THE IMF FIGURES, what they tell and what they do not (Part 1 must carry a short, honest passage on this in the income-gap section, and the methodology section must repeat the essentials): the per-capita income figures use the IMF World Economic Outlook at purchasing-power parity, in current international dollars. PPP beats market exchange rates for comparing living standards because it converts incomes by what they actually buy locally, not by volatile exchange rates; that is why, in PPP, India looks markedly richer than its market-rate dollar figure. But state the limits plainly: (1) PPP rests on the International Comparison Program's global price surveys, run only about every six years (2011, 2017, 2021 benchmarks) and extrapolated in between, and a new benchmark can revise a country's level sharply; (2) the 'international dollar' is a synthetic construct, an average basket nobody actually pays in, and the basket a poor household buys differs from a rich one's, so one PPP figure smooths over real differences; (3) the most recent IMF years (2024 and 2025) are estimates, revised often, not hard data; (4) these are national averages that say nothing about how income is shared; and (5) the IMF, World Bank, Penn World Table and Maddison give different PPP numbers because they use different benchmarks and methods, so treat every figure as approximate and compare ratios and trends, not the last dollar. Say plainly, too, that the income-gap chart uses current-dollar IMF PPP for the up-to-date snapshot while the convergence projection uses real, constant-price World Bank PPP, because projecting a current-dollar growth rate would mix inflation into the growth; do not hide that switch",
        "COMPARISON DISCIPLINE, treat as absolute rules: never mix market-exchange-rate dollars with purchasing-power-parity dollars in the same comparison, and keep PPP figures on a consistent base year; always flag when a figure is a modelled estimate (ILO labour figures, some poverty figures) versus a direct survey, because they differ in level; do not compare one country's gross output to another's value added; note that Taiwan is absent from World Bank and UN datasets so its figures come only from Maddison, the Penn World Table and V-Dem; note that Singapore and Hong Kong are entrepot city-states whose trade-to-GDP is inflated by re-exports, so they are context not fair manufacturing comparators; and note that the World Bank's manufacturing series for China begins only in 2004, which is why China is not drawn on the manufacturing-share chart",
        "NUMBER DISCIPLINE is absolute: every statistic, share, rupee or dollar figure and date-as-fact in the prose must come from the evidence packet's locked numbers or from the specific figures stated in these concepts; never invent, recall or estimate a number. The qualitative history, mechanisms and concepts listed here may be stated as given background facts. Anchor every number when it first appears (what it measures, against what, and whether it is high or low in plain words), and prefer rounded spoken forms over false-precision decimals",
        "Growth accounting and the Krugman debate (Part 3): growth accounting splits a country's growth into more inputs (capital and labour) versus higher total factor productivity (TFP), the efficiency with which inputs are combined. The famous argument (Paul Krugman, 'The Myth of Asia's Miracle', 1994, drawing on Alwyn Young) was that East Asia grew mostly by 'perspiration', sheer accumulation, not 'inspiration', rising productivity, and so would slow. Later work found a larger productivity role. Present this as a genuine, unsettled debate; TFP is a residual measured with real uncertainty, so describe broad patterns, not precise figures. In the data both capital deepening and TFP rose strongly in the East Asian tigers while India lagged on both",
        "Capital per worker is the value of machines, buildings and infrastructure backing the average worker; more of it is a direct reason each hour of work produces more. The gap is large: by the Penn World Table an Indian worker in 2019 had roughly $69,000 of capital behind them against about $397,000 for a South Korean, the accumulated result of decades of much higher investment",
        "The demographic dividend is the one-time growth boost when the working-age share (15-64) is large relative to dependents; East Asia's window opened earlier and it used the window by pairing it with jobs and investment, while India's working-age share is high now, an opportunity that only pays off if those workers find productive work",
        "Growth with equity: East Asia's growth was, especially early, relatively broadly shared (helped by land reform and mass education), whereas India's faster recent growth has been more top-heavy, with the richest tenth taking a rising share of national income. Top-income estimates are modelled and contested at the very top, so describe direction and gaps, not precise shares",
        "Global value chains are cross-border production networks; backward participation measures the foreign value added embodied in a country's exports, and plugging in is how Vietnam and others industrialised fast while India stayed lower. Important quirk: a very large economy with a deep domestic supply base, such as China, can show LOW backward participation for reasons unrelated to success, because more of its export value is made at home, so treat this as one lens, not a ranking",
        "A convergence projection extends income forward at an assumed growth rate to ask when a country reaches another's level. At its recent growth rate India would reach where China is today around the early 2040s and today's South Korea only later; but this is an illustrative constant-growth projection, not a forecast, and it compares India's future to today's China and Korea, which themselves keep growing, so closing the live gap is harder still",
        "Keep the macha layer warm and plain-spoken, a sharp friend explaining the whole divergence, with the playfulness living in the headings and the body staying grounded and genuinely helpful; it summarises what the entire page means, not one chart"
      ],
      styleExample: (part === 4
        ? [
            "## So how did they actually pull it off?",
            "By doing the boring thing relentlessly for forty years. There is a famous argument, made by the economist Paul Krugman in 1994, that the Asian miracle was less magic than muscle: these countries did not get dramatically cleverer at making things, they just threw staggering amounts of saving, machinery and newly schooled workers at the problem, decade after decade. Build the factory, staff it, build the next one, compound it for a generation. Look at the growth rates and you can see the muscle, South Korea running 7, 8, 9 percent a year through the 1960s and 70s while India crawled at one or two. But look closer and there is some magic too: Korea did not just pile up capital, it got genuinely more productive at using it, climbing toward the efficiency of the richest countries. India did neither at that pace. It saved less, so each worker had less to work with, and it never closed the productivity gap. The miracle, in the end, was not a trick. It was a country deciding to invest in itself, and then not stopping."
          ]
        : part === 3
          ? [
              "## So if India skipped the factory, what did it build instead?",
              "A services economy, and this is the part of the story India tells best about itself. While the tigers were filling container ships with shirts, then televisions, then microchips, India was wiring up a different kind of export: software written in Bengaluru, back-office work done for firms half a world away, a call answered in Gurugram at two in the morning. It is real, it is large, and it earns India serious money. But look at who it employs. A garment line in Dhaka or a phone-assembly plant in Shenzhen can take a worker with a few years of schooling and put her to work the same week. A services-export job usually wants English, a degree, a computer. So the escalator India built carries the educated few up fast, while hundreds of millions with little schooling stand at the bottom with nowhere to step on. That is the difference between an escalator and a staircase only some can climb."
            ]
          : part === 2
            ? [
                "## Where did the money to build all this come from?",
                "From saving, on a scale India never matched. The deep secret of the Asian miracle is almost dull: these countries put aside a huge slice of everything they earned and poured it straight back into factories, roads, ports and machines, year after year. At its peak China was investing more than 40 percent of its entire economy; South Korea ran in the high 30s for decades. India saved respectably, but never at that pitch, and its banks were slower to channel what it did save into industry. Picture two families on the same street earning the same wage: one spends almost all of it, the other sets a third aside every month and ploughs it into a workshop. Give it thirty years and they are not on the same street anymore. That is the gap between India's investment rate and East Asia's, compounded across a generation, and it is much of why a Korean worker today stands beside far more machinery than an Indian one."
              ]
            : [
                "## Weren't India and China equally poor to begin with?",
                "Yes, and that is exactly what makes the story so strange. Wind the clock back to 1950 and the two giants are standing on more or less the same line. By the best long-run reconstruction we have, the average Indian was actually a shade better off than the average Chinese, and not far behind a South Korean, who at the time had just been through a war and was about as poor as anyone on earth. If you had to bet that year on who would race ahead, you might well have picked India, the stable democracy with the railways and the universities, over a China about to throw itself into famine and chaos. The bet would have been wrong. Over the next seventy years the line India was standing on barely lifted while the others shot upward, until a South Korean produced in an afternoon what an Indian produced in a week. Nothing about 1950 explains that. The explanation is in everything that happened next, and it starts not with factories or reforms but with something quieter, whether a country bothered to keep its children alive and send them to school."
              ]).join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.rnd") {
    const rndPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how much India spends on research and development, and whether it is enough, in the voice of someone who knows the economics of innovation cold and is scrupulously honest about thin, lagged data. The through-line is a paradox: India spends strikingly little on research (about 0.64% of GDP, stuck in the 0.6-0.7% band for two decades while peers raced ahead) and yet ranks high on the things research is supposed to produce (third in the world for scientific papers, sixth for patents, an innovation 'overperformer'). Hold both facts at once. Walk the argument in order: (1) why research matters at all, opening on the wide gulf in how much countries spend and the high measured returns to research; (2) how little India spends, in GDP terms (flat, below its own 2% target and the world average) and the rupee paradox (the budget doubled but the share did not move); (3) who funds and performs it, the unusual dominance of the state over business, and the heavy tilt toward defence, space and atomic energy; (4) how India compares, the China-and-Korea divergence, the startling shortage of researchers, the absolute scale gap; (5) the efficiency paradox, high output on low input, told honestly (volume is not impact, and yesterday's output reflects yesterday's capacity); (6) good research versus bad, the frugal brilliance of ISRO and the high returns to agricultural and public research set against waste, delay and money that never gets spent; and (7) the new bets (ANRF, the RDI fund) and whether they can change the picture. Carry the argument forward section by section. Be relentlessly disciplined about vintage (India's official R&D series ends at 2020-21), about estimate versus measurement, and about presenting contested figures as ranges. Never claim a single cause for India's under-investment. Never narrate the article itself ('this chart shows'); write about India and research. Never use em-dashes.",
      requiredSections: rndPlanned.length
        ? [
            ...rndPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A closing reader-question H2, 'How should you read these numbers?', a short honest methodology paragraph. Name the sources plainly: the World Bank and UNESCO Institute for Statistics for cross-country R&D intensity and researcher density; the Department of Science and Technology's NSTMIS ('R&D Statistics at a Glance 2022-23' and the S&T Indicators Tables) for India's rupee, sector and agency figures, whose latest year is 2020-21; NITI Aayog's 2025-26 reports for the diagnosis and the public-versus-private split; the WIPO Global Innovation Index and World Intellectual Property Indicators for innovation outputs and patents; the NSF Science and Engineering Indicators and Scopus for publications; and the OECD for absolute spending. State plainly that India's official R&D data lags about five years, that India is absent from the OECD's internationally comparable business-R&D database so its private-sector share is its own survey estimate, that the returns figures are midpoints of wide and contested ranges, and that several factors moving together is not proof any one caused the gap. Write it as a short, honest paragraph, not a reference list."
          ]
        : [
            "Why does research spending matter?",
            "How much does India spend on research?",
            "Who actually pays for, and does, India's research?",
            "How does India compare with the world?",
            "If India spends so little, how is it third in the world for research papers?",
            "What does India get right, and waste?",
            "Can the new funds fix it?",
            "How should you read these numbers?"
          ],
      requiredConcepts: [
        "The framing fact to open on: India spends about 0.64% of its GDP on research and development (DST, 2020-21), and the ratio has been stuck in the 0.6-0.7% band for about two decades. It is far below the leaders (Israel about 6.3%, South Korea about 4.9% in 2023), below the United States, Japan and Germany (all above 3%), below China (about 2.6%) and below the world average (about 2.6%). State this as the gap the whole article sits inside",
        "The honest nuance on the trend: India's R&D intensity actually nudged UP toward about 0.8% of GDP around 2008-2011 and then slid back to about 0.64%, so the truthful description is 'peaked over a decade ago and drifted down', not simply 'flat'. The World Bank/UNESCO series is the continuous India series used for the trend; DST corroborates it",
        "The rupee paradox: in current rupees India's gross expenditure on R&D more than doubled, from about ₹60,000 crore in 2010-11 to about ₹1.27 lakh crore in 2020-21. Yet as a share of GDP it barely moved, because the economy grew just as fast, and part of even the rupee rise is inflation. Both facts are true at once and the article must hold them together",
        "The 2% target: India's 2013 Science, Technology and Innovation Policy set a goal of 2% of GDP, and NITI Aayog restated it in 2026 (raise from 0.64% to at least 2%). It has gone unmet for over a decade with no credible path visible. The 2% line on the chart is a policy target, not a measurement",
        "Scale in absolute terms: measured in purchasing-power dollars India's R&D was about 58 billion PPP-dollars in 2020-21, against roughly 760 billion for the United States and about 860 billion for China (OECD, 2024). India is about a fifteenth of China's R&D spend in absolute money, a far larger gap than the GDP-share comparison alone suggests. India was about 3.1% of world R&D in 2018 (UNESCO). Flag that the China/US figures are 2024 and India's is 2020-21",
        "Who PERFORMS India's R&D (DST, 2020-21): central government about 43.7%, private-sector industry about 36.4%, higher education about 8.8%, state governments about 6.7%, public-sector industry about 4.4%. The public bloc (central plus state plus universities) is nearly 60%. This is the reverse of advanced economies",
        "The business-sector gap, the single clearest structural diagnosis: in South Korea, China and the United States businesses fund or perform roughly three-quarters or more of all R&D (about 79%, 77%, 75%; Germany about 67%), while in India the private sector is only about 36%. Be honest that India is absent from the OECD's comparable database, so its figure is DST's own survey and is the performer share, roughly but not exactly comparable in definition",
        "Where India's public research money goes (DST, 2020-21, shares of central-government R&D): DRDO/defence about 30.7%, Department of Space about 18.4%, ICAR/agriculture about 12.4%, Department of Atomic Energy about 11.4%, CSIR about 8.2%. Defence, space and atomic energy together take about 60%. Twelve major agencies account for about 84% of central-government R&D. A strategic tilt is a deliberate choice, not an accident, but it leaves civilian, university and health research thin",
        "The people shortage: India has only about 260 researchers per million people (DST 262 in 2020; the World Bank's 259 agrees), against roughly 9,500 in South Korea, about 5,900 in Germany, about 5,600 in Japan, about 4,900 in the United States, about 2,100 in China and a world average near 1,650. Strikingly, India sits below Vietnam (about 836) and South Africa (about 444). India's own series rose from about 110 (2000) to 218 (2015), 255 (2017) and 262 (2020), real progress from a very low base",
        "The China-and-Korea divergence: two generations ago India and China spent similar small shares on research; China then climbed from under 1% to about 2.6% of GDP and Korea to nearly 5%, while India's line stayed near 0.6%. Because these are shares of very differently sized economies, China's lead in absolute dollars is larger still",
        "The efficiency paradox, the spine of the middle of the article, stated carefully: India spends like an also-ran but produces like a heavyweight. It published about 278,000 scientific papers in 2022, third in the world behind only China (about a million) and the United States (about 721,000), having overtaken the United Kingdom, Germany and Japan (NSF/Scopus). On the WIPO Global Innovation Index 2025 it ranks 38th overall but 32nd on innovation outputs against 52nd on inputs, and has been an 'overperformer' for fifteen years running",
        "The honest caveats on the paradox, which must be stated so the article does not over-claim: publication counts measure VOLUME, not citations or impact, where India ranks lower; today's output partly reflects research capacity and people trained years ago, not current spending; and 'punching above your weight' is not the same as spending enough. Efficiency is a reason for optimism about what more money could buy, not evidence that the spending gap does not matter",
        "Patents, the genuine bright spot: in filings AT the Indian Patent Office, domestic (resident) applicants drew level with foreign applicants in 2022 for the first time and reached about 60% of filings by 2024; India is now sixth in the world for total patent filings (WIPO). Note these are calendar-year, office-level filing counts; filings are an input/intermediate indicator, not commercialised inventions",
        "Why research pays, the case for spending more, stated as established economics: the measured social return to R&D is high, commonly put around 30-50% a year, and runs well above the private return a single firm captures (often put around 7-30%), with influential work (Bloom, Van Reenen and co-authors) estimating social returns roughly four times private. Agricultural research has some of the highest measured returns of all (often 40-60% a year; the international CGIAR system is credited with benefit-cost ratios around 10 to 1). These are midpoints of wide, contested ranges, not precise figures; the gap between social and private return is the textbook reason governments fund research at all",
        "The public-seedbed argument, as context: a large body of work (Mariana Mazzucato's 'Entrepreneurial State'; Vannevar Bush's 1945 'Science, the Endless Frontier'; the DARPA model) holds that publicly funded basic research seeded technologies private firms later commercialised, from the internet and GPS to the touchscreen. Present it as an influential argument with critics (who say it overstates the state's role and understates the private adaptation required), not as settled fact",
        "Good uses, India's frugal-science success, with figures: India reached Mars (Mangalyaan) for about 74 million dollars and landed near the Moon's south pole (Chandrayaan-3) for about 75 million, against roughly 580 million for NASA's MAVEN Mars orbiter and about 133 million for Russia's failed Luna-25. The ISRO model is mission-focused, autonomous and frugal. These are headline mission costs that exclude shared overheads and decades of prior investment, so the point is the order-of-magnitude frugality, not an exact ratio. India's vaccine-manufacturing base (Serum Institute, Bharat Biotech with ICMR on Covaxin) and CSIR's generic-drug process chemistry are other genuine public/public-private wins",
        "Bad uses and waste, told fairly: money that never gets spent (in 2023-24 the science department used only about a third of its budgeted R&D head and the new research foundation barely an eighth; DST under-spent its budget by roughly 18% a year on average over 2018-24), driven by government financial rules, automatic year-end withdrawal of unspent funds, GST on research equipment and procurement delays (NITI Aayog, 2026). The 'valley of death' between lab and market, where a large majority of patents are never commercialised. Long-running prestige and defence projects with deep overruns, the clearest being the Kaveri jet engine, in development for about 39 years and still not powering a fighter, which is why India bought foreign engines. State these as documented problems, not as proof the whole system is wasteful",
        "Why India under-invests, the structural diagnosis, presented as several contributing factors and never a single cause (NITI Aayog 2025-26 and others): a weak private and philanthropic research base; an economy whose large IT-services sector does relatively little frontier R&D; brain drain (tens of thousands of Indian-origin researchers abroad); thin university research; fragmented funding across many agencies; and concentration of what funding exists (consultation input suggests the IIT system receives a very large share of the new foundation's grants, with grant-application success rates reported under 10%). India has on the order of 1,800 public R&D institutes",
        "The new bets, stated with their catch: the Anusandhan National Research Foundation (ANRF, created 2023) is built on a target of ₹50,000 crore over 2023-28, of which only ₹14,000 crore is committed government money and ₹36,000 crore is meant to come from private and other sources, an aspiration rather than committed funding; a separate Research, Development and Innovation (RDI) fund adds a ₹1 lakh crore financing corpus aimed at private, higher-readiness projects, which lends or takes equity rather than giving grants. Whether private money actually turns up is the open question on which the 2% target depends",
        "VINTAGE DISCIPLINE is absolute: India's official R&D statistics (rupee spend, sector and agency splits, researcher density) come from DST/NSTMIS and end at 2020-21; always make the year explicit and never imply these are current-year figures. The cross-country World Bank/UNESCO numbers are mostly 2020-2023. The NITI Aayog 2026 reports are fresh but largely restate the same 2020-21 base data",
        "NUMBER DISCIPLINE is absolute: every statistic, share, rupee or dollar figure in the prose must come from the evidence packet's locked numbers or the specific figures stated in these concepts; never invent, recall or estimate a number. Present contested or derived figures (returns to R&D, absolute PPP comparisons, the private-sector share) as approximate ranges, never false-precision decimals. Anchor every number when it first appears (what it measures, against what, high or low in plain words)",
        "Keep the macha layer warm and plain-spoken, a sharp friend explaining what India's research gap really means for the country's future, with the playfulness in the headings and the body grounded and genuinely helpful; it summarises what the whole page means, not one chart"
      ],
      styleExample: [
        "## So does India actually spend enough on research?",
        "No, and it is not close. Picture every rupee the country produced last year laid out in a line; India sets aside about sixty paise out of every hundred rupees for research. South Korea sets aside nearly five rupees, Israel more than six. India has been parked at roughly that same low figure for twenty years, even as China went from spending like India to spending four times as much. And yet here is the strange part, the part that makes this more than a simple story of neglect: on the things research is supposed to produce, papers, patents, clever frugal missions to Mars, India shows up near the top of the world. It is getting a great deal out of very little. The honest worry is not that India is bad at research. It is that it has quietly decided not to do very much of it, and is coasting on a thin budget while the countries it wants to catch are spending like their futures depend on it."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.size") {
    const sizePlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how big India's economy really is, in the voice of someone who knows Indian macroeconomics cold and can make a layperson feel the numbers. This is the flagship introduction to the Indian economy at a macro level: it must be the most complete and most readable single page a curious Indian can read to understand the shape of their own economy, built entirely on MOSPI's own National Accounts (the source of truth) with the World Bank used only for the cross-country lens. The hook and through-line is a single tension: India's economy is simultaneously enormous and poor. Add up everything produced and you get the world's ~5th-largest economy (3rd by purchasing power), about ₹357 lakh crore; divide it across 1.4 billion people and the average is only about ₹2.5 lakh a year. Walk the argument in order: (1) the headline rupee size and its 75-year climb from about ₹10,000 crore in 1950-51; (2) big compared with whom — the same economy is ~$3.9 trillion at the market exchange rate but ~$16 trillion at PPP, which is why the global ranking flips; (3) why most of the headline number's growth is just inflation (nominal vs real); (4) per person, the average that is not a salary and hides deep inequality; (5) what India actually makes — the historic shift from farms to services and the manufacturing stage India largely skipped; (6) who spends the money — a consumption-led economy; (7) output produced here vs income that belongs to Indians (GDP vs GNI); (8) who saves the money India invests — overwhelmingly households; (9) how fast it grows and how volatile that is; and (10) what GDP still cannot tell you. Carry the argument forward section by section; never treat the charts as a disconnected list. Be scrupulously honest about what the single number hides and about estimate revisions. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: sizePlanned.length
        ? [
            ...sizePlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A closing reader-question H2 on what GDP still does not tell us"
          ]
        : [
            "How big is India's economy?",
            "Is India the 5th-largest economy or the 3rd?",
            "How much of the headline number is just inflation?",
            "What does that work out to per person?",
            "What does India actually produce?",
            "Why did India never become a factory economy?",
            "Who spends all that money?",
            "Produced in India, but whose income is it?",
            "Who saves the money India invests?",
            "How fast does the economy grow?",
            "What does GDP still not tell us?"
          ],
      requiredConcepts: [
        "India's nominal GDP (output valued at current prices) is about ₹357 lakh crore in 2025-26, up from about ₹10,000 crore in 1950-51; the 2025-26 figure is a First Advance Estimate and will be revised",
        "Real GDP, which strips out inflation by valuing output at constant 2011-12 prices, is about ₹202 lakh crore; the large and widening gap between nominal (₹357 lakh crore) and real (₹202 lakh crore) is accumulated inflation, and when people say the economy 'grew about 7%' they mean the real figure, not the nominal one",
        "By the market exchange rate India's GDP is about $3.9 trillion in 2025 (IMF World Economic Outlook), which makes it around the fifth-largest economy in the world; by purchasing-power parity it is about $17 trillion, the third-largest behind only China and the United States. PPP is larger because the same rupee buys much more in India than a dollar buys in the US, so it adjusts for India's lower price level. Both are correct; they answer different questions",
        "Set against the other big economies (IMF World Economic Outlook, market exchange rate, 2025): India at about $3.9 trillion is around the fifth-largest in the world, essentially neck and neck with the United Kingdom (about $4.0 trillion) and behind Japan (about $4.4 trillion) and Germany (about $5.0 trillion); only the United States (about $31 trillion) and China (about $20 trillion) are far ahead. India overtook the UK around 2022, but because these are market-rate dollars the two trade places from year to year as the rupee and pound move",
        "On GDP per capita the ranking inverts, and this is the core of the 'big but poor' story: India was about $2,675 per person in 2025 (IMF), barely above Bangladesh (about $2,640), with even Indonesia and Vietnam (about $4,800 to $5,100) already ahead, China roughly five times higher (about $14,000) and South Korea more than ten times higher (about $36,000). India is large as a country and poor as a people because a large output is divided among a very large population",
        "Reconcile the two per-capita figures in one passing clause so a reader who converts is not confused: the about ₹2.5 lakh per person (MOSPI, current rupees, 2025-26) and the about $2,700 per person (IMF, current US dollars, 2025) are the same income expressed in two currencies; they do not divide to exactly the market exchange rate only because the two come from slightly different sources, base years and population estimates. Do not labour this point",
        "GDP per person is about ₹2.5 lakh a year in 2025-26, up from a few hundred rupees in the early 1960s; this is an arithmetic average (GDP divided by population), NOT a salary or a typical income, and it sits well above what most Indians actually earn because a small number of high earners pull the average up. Inequality is covered in depth on a separate page, so here just flag honestly that the average hides it",
        "The production structure has transformed since independence: agriculture's share of gross value added fell from about 53% in 1951 to about 17% now; services rose from about 31% to about 56%; industry is about 27%. Services is now the dominant sector",
        "Manufacturing is the key structural gap: its share of output has barely moved in 75 years, from about 12% in 1951 to about 14% now. Unlike China, South Korea or Japan, India never became a factory-led economy; it shifted from farms largely to services, skipping the mass-manufacturing stage. This is the backdrop to 'Make in India'",
        "A crucial mismatch: agriculture is only about 17% of output but still supports a far larger share of India's workers, so output shifted to services and industry while most people stayed in low-productivity farm work (the jobs question is a separate page; flag the mismatch, do not over-claim it here)",
        "GDP can be read from the spending side as private consumption + investment + government spending + net exports. For India in 2025-26 these are roughly: private final consumption about 61% of GDP, gross fixed capital formation (investment) about 30%, government consumption about 10%, and net exports about minus 2% because imports (about 24% of GDP) slightly exceed exports (about 21%). India is a consumption-led economy, and the investment share is what economists watch most as the seed of future growth",
        "GVA versus GDP: gross value added is the producers' view (what each sector adds), and GDP equals total GVA plus taxes on products minus subsidies on products. That is why the sector chart is labelled GVA while the headline is GDP",
        "GDP measures output produced inside India's borders; Gross National Income (GNI) measures income accruing to Indians. India's GNI is about ₹352 lakh crore, roughly ₹5.5 lakh crore below GDP, because India pays out more primary income (profits, interest, dividends) to the rest of the world than it receives. The gap is small for India, but for economies dominated by foreign-owned firms or large remittance-sending diasporas GDP and GNI can diverge a lot",
        "Gross National Disposable Income (GNDI) extends the income picture one step further and reveals a distinctly Indian twist: while GNI (about ₹352 lakh crore) sits just below GDP because of income paid to foreigners, GNDI rises BACK ABOVE GDP to about ₹362 lakh crore, because remittances sent home by Indians working abroad more than offset that outflow. India's disposable income is therefore larger than its domestic output, a hallmark of a major remittance-receiving economy",
        "India's openness to trade was transformed after the 1991 liberalisation: exports of goods and services rose from about 7% of GDP through the closed pre-reform decades to about 21% today, and imports to about 24%; both flows roughly tripled as a share of the economy even though net exports remain slightly negative, because a more open India both sells far more to and buys far more from the world",
        "India saves about 30% of GDP, among the highest rates in the world, and domestic saving is what finances domestic investment. Households (not companies or the government) do most of it: households are about 59% of gross saving, private corporations about 35%, and the public sector only about 6%. Ordinary households finance India's growth through bank deposits, gold, provident funds, insurance and property",
        "Real GDP growth is usually in the 5 to 8% range and is volatile: it fell about 5.8% in 2020-21 during the COVID lockdown (a genuine contraction, not just slower growth) and rebounded strongly afterwards; India is among the fastest-growing large economies but a single shock such as a drought or a global crisis can swing the annual figure hard",
        "What GDP does NOT tell you, stated plainly at the close: it does not show who gets the income (distribution and inequality), it misses most unpaid work such as housework and care, it does not net out environmental damage or resource depletion, it says nothing about the quality or informality of jobs (a large part of India's economy is informal and imperfectly measured), and it ignores regional gaps between states. GDP is an excellent measure of the SIZE and GROWTH of an economy and a poor measure of its wellbeing or fairness",
        "Honesty caveats to weave in, not dump: the latest-year national-accounts figures are advance estimates revised several times before they are final; the real series is on the 2011-12 base; per-capita is GDP divided by World Bank mid-year population; and the PPP figure is a modelled price-level adjustment, not a market value"
      ],
      styleExample: [
        "## So how big is it, really?",
        "Big and poor at the same time, and you have to hold both ideas at once. Add up everything India made and sold last year and you get about 357 lakh crore rupees, the fifth-largest heap of output on the planet, the kind of number that gets India called an economic superpower. Now divide that heap across 1.4 billion people. Each share comes to roughly 2.5 lakh rupees for the whole year. The same economy that ranks near the top of the world is, person by person, still not a rich one. Everything else on this page lives in the gap between those two facts."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.inequality") {
    const inequalityPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how unequal India really is, in the voice of someone who knows Indian development economics cold and refuses to oversimplify. The hook and through-line is a genuine paradox: the SAME country is, on the World Bank's consumption Gini (25.5 in 2022-23), among the most equal on earth, and on the World Inequality Lab's income and wealth estimates home to concentration 'starker than the British Raj'. These do not contradict each other — they measure different things (what people SPEND, what they EARN, what they OWN) with instruments that have opposite blind spots, and the honest answer is that India is mildly unequal in consumption, highly unequal in income, and extremely unequal in wealth, all at once. Walk the evidence in order: open on the paradox (the same top-1% metric, two methods, two answers); then take each ruler in turn — consumption looks equal and falling, income concentration is high and rising, wealth concentration is extreme; show the distribution top to bottom; bring in India's own HCES survey and be honest that part of the recent 'decline' comes from newly counting free welfare as consumption; and close on the other half of the story, that extreme poverty fell sharply even as the top pulled away. This is a flagship reference page: it must present ALL sides and the live methodological fight fairly, never pick a political winner, and let a sceptic on either side feel the data was handled honestly. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India, and let each chart sit beside the prose that discusses it.",
      requiredSections: inequalityPlanned.length
        ? inequalityPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "Why do experts disagree on whether India is equal?",
            "By what people spend, how unequal is India?",
            "By what people earn, how unequal is India?",
            "By what people own, how unequal is India?",
            "How is consumption split from the bottom half to the top?",
            "What does India's own survey say, and can we trust it?",
            "If inequality is high, why did poverty fall?",
            "So how unequal is India, really?"
          ],
      requiredConcepts: [
        "Inequality is not one number: a Gini (0 = everyone equal, 100 = one person has everything) or a top share can be computed on consumption, on income, or on wealth, and the three give very different answers for India because they measure different things",
        "Consumption inequality is lowest and is what the World Bank's '25.5, fourth-most-equal' headline measures; it is based on what households spend, and spending is naturally more equal than income because the rich save and invest most of their extra income rather than consuming it",
        "Income inequality is much higher than consumption inequality and has been rising; the World Inequality Lab estimates the top 1% take about 22.6% of national income (2022-23), among the highest in the world",
        "Wealth inequality is the most extreme of the three; the top 1% are estimated to own about 40.1% of net personal wealth and the bottom 50% only about 6.4%",
        "Household surveys (the basis of the World Bank consumption Gini and India's HCES) systematically miss the very rich — they refuse to participate or under-report — which mechanically lowers measured inequality; this is a known limitation the World Bank itself flags, not a conspiracy",
        "The World Inequality Lab method combines tax tabulations, national accounts and rich lists to estimate the full distribution including the top tail; this captures capital income surveys miss, but it is a MODELLED estimate, not a direct observation, and has been contested",
        "The Bhalla–Bhasin critique (2024) argues the World Inequality Lab does not observe the same individuals' income and wealth and instead imputes the full distribution, which they say overstates top concentration; present this as a genuine expert disagreement, not a settled question",
        "India's HCES (Household Consumption Expenditure Survey) 2022-23 and 2023-24 show the consumption Gini falling in both rural and urban areas; but part of the 2023-24 fall reflects a methodology change — newly imputing the value of free government rations and welfare into consumption — so it partly reflects a real rise in the floor and partly a change in what is being measured",
        "Falling extreme poverty and rising top-end inequality are both true at the same time: the floor rose (fewer people below $2.15/day) even as the ceiling rose faster, so 'poverty fell' is not evidence that 'inequality fell'",
        "These are national figures and hide large gaps by state, caste, religion and gender that this page's data does not fully capture; wealth-survey gaps (AIDIS) and unit-level microdata are follow-ups, so be honest about what is and is not shown"
      ],
      styleExample: [
        "## Why can't experts agree on whether India is equal?",
        "Because they are not measuring the same thing, and both are right. Look at the two lines: they are both trying to capture the share of income going to India's richest 1%, and they are miles apart. The lower line comes from household surveys — knock on enough doors, ask what people earn and spend, add it up. The trouble is that a billionaire does not open the door to a survey enumerator, and if he does, he does not report his capital gains. So surveys see a flatter, more equal India almost by construction. The higher line starts from tax records and national accounts and works out where the rest of the income must have gone. It catches the top tail the survey misses — but to do it, it has to estimate, and estimates can be argued with, which is exactly what critics do. Neither line is a lie. The distance between them — a top 1% share of 4% by one method, 22% by the other — is not a rounding error to average away; it is the measure of how much inequality the surveys cannot see."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.poverty") {
    const povertyPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer whether India has ended poverty with a qualified answer, not a slogan. The article must hold four facts together: the deepest international consumption poverty has fallen sharply; the answer changes when the line moves from $3/day to $4.20/day; India has no fresh adopted official national poverty line after the 2011-12 Tendulkar estimate; and poverty as vulnerability remains visible in HCES bottom fractiles, rural/state/social-group gaps, multidimensional deprivation and working poverty. The tone should be measured and sceptical of both victory laps and reflexive denial. Open with the poverty-line split, explain the Tendulkar/Rangarajan fight, then move through HCES consumption, welfare imputation, distribution, geography, caste, MPI, services and job-quality caveats. End with methodology and caveats, including survey comparability and the difference between cash poverty, consumption poverty and multidimensional poverty. Never use em-dashes.",
      requiredSections: povertyPlanned.length
        ? povertyPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "So has India ended poverty?",
            "What happens when the poverty line moves?",
            "Why is India's official poverty line still controversial?",
            "What does HCES say about the consumption floor?",
            "How much does welfare imputation change the reading?",
            "Who remains close to the floor?",
            "What does multidimensional poverty add?",
            "Why does work quality matter?",
            "How should we read these numbers?"
          ],
      requiredConcepts: [
        "State the answer early: India has sharply reduced extreme poverty, but poverty has not been eradicated under broader poverty lines or vulnerability lenses",
        "Use the World Bank October 2025 2021-PPP lines: $3/day fell from 27.1% in 2011-12 to 5.3% in 2022-23; $4.20/day fell from 57.7% to 23.9%",
        "Translate percentages into scale: in 2022-23 about 75.24 million people were below $3/day and about 342.32 million below $4.20/day",
        "Explain that the last adopted official Indian poverty estimate is Tendulkar 2011-12 at 21.9%, and that newer official-style claims are estimates under other methods rather than an adopted national line",
        "Explain Tendulkar vs Rangarajan without caricature: Rangarajan used a higher standard and gave a higher 2011-12 estimate, 29.5% instead of 21.9%",
        "Define MPCE in plain English as monthly household consumption divided by household members, and make clear that HCES measures consumption, not income",
        "Say welfare imputation is a real consumption support and a measurement change: it counts free/subsidised items consumed by households, so it raises the measured floor but is not the same as higher cash earnings",
        "Use the HCES bottom-fractile ladder to prevent false comfort from averages: the poorest rural 5% spent about Rs 1,677 per person per month in 2023-24",
        "Use geography and caste carefully: state and social-group gaps are observed consumption differences, not proof of one cause",
        "Keep MPI separate from cash poverty: NITI MPI measures deprivation in health, education and living standards, and some 2013-14/2022-23 points are interpolated or projected because matching NFHS survey years do not exist",
        "End with methodology and caveats: international PPP line choice, HCES comparability with NSS 2011-12, consumption vs income, survey under-coverage of the top, intra-household deprivation, and job/health shocks"
      ],
      styleExample: [
        "## So has India ended poverty?",
        "Only if you use a very low line and stop there. At the World Bank's $3-a-day extreme-poverty line, India is no longer the country it was in 2011-12: the rate fell from 27.1% to 5.3% by 2022-23. That is a large, real fall. But move the line to $4.20 a day, the lower-middle-income-country benchmark, and the same country still has 23.9% of people below it. In people, that is about 342 million. So the honest answer is not 'poverty is gone' or 'nothing changed'. The floor rose. The floor is still low."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.income_tax") {
    const taxPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer who actually pays income tax in India, in the voice of someone who knows Indian public finance cold and refuses the lazy takes. The hook and through-line is that filing a return and paying tax are completely different things: roughly 8 crore returns get filed, but only about 3 crore actually pay any income tax, because around 62% of filers legally owe nothing. The honest argument, walked in order, is this: the tax base is narrow; the zero-tax majority is mostly a deliberate policy choice (the 5-lakh rebate), not mass evasion; what is collected is carried by a vanishingly small apex (about a tenth of one percent of filers pay most of the tax); the burden has quietly shifted from companies onto individuals; the kind of income at the top is increasingly capital, not salary; and set against other countries India's tax effort is mid-low and its base unusually narrow, even though it runs one of the cheapest, most progressive-leaning tax systems in the world. Carry this argument forward section by section; never treat the charts as a disconnected list. This is a flagship reference page: it must be the most complete and most readable thing a layperson can find on who pays Indian income tax, while a researcher could trust every caveat. Be scrupulously fair: the zero-tax majority is overwhelmingly statutory exemption, NOT dodging, and you must say so. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: taxPlanned.length
        ? taxPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "How many Indians actually pay income tax?",
            "If most filers pay nothing, are they dodging tax?",
            "Who carries the income-tax load?",
            "Do individuals or companies pay more?",
            "Where does the taxed income come from?",
            "Is India's tax system getting more progressive?",
            "How does India compare with other countries?",
            "So who really pays, and what does it say about India?"
          ],
      requiredConcepts: [
        "Filing a return and paying tax are different things: in assessment year 2023-24, 7.97 crore returns were analysed but 4.91 crore (61.6%) had zero tax payable, so only about 3.06 crore returns actually paid any income tax",
        "The zero-tax majority is overwhelmingly STATUTORY exemption, not evasion: the zero-tax share jumped from about 40% (AY2018-19) to about 67% (AY2020-21) when the Section 87A rebate made income up to 5 lakh effectively tax-free, and the 4.5-to-5 lakh income band is the single largest, with about 2.4 crore returns bunched just under that rebate threshold",
        "The zero-tax line tracks a deliberate, repeated policy choice: the income at which tax becomes nil was lifted step by step. Section 87A was introduced in 2013 (small rebate, income up to 5 lakh); the basic exemption and rebate inched the nil-tax ceiling to about 3 lakh by the late 2010s; the Interim Budget 2019 raised the rebate to 12,500 so income up to 5 lakh paid nothing (effective from AY2020-21, the big jump in the data); Budget 2023 made the new regime the default and lifted the nil-tax ceiling to 7 lakh (AY2024-25); and Budget 2025 raised it again to 12 lakh (effective AY2026-27). Each step mechanically enlarges the zero-tax share",
        "Crucial forward-looking caveat: our return-level data ends at AY2023-24, when the nil-tax ceiling was 5 lakh and 61.6% owed nothing. The 7-lakh (2023) and especially the 12-lakh (2025) rebates take effect AFTER our data window, so the zero-tax share is almost certainly HIGHER now and will rise further in years not yet published; the article must say the ~62% is a floor, not a ceiling, and is policy-driven. Note these thresholds are total-income before the standard deduction, which lifts the salaried figure further (about 12.75 lakh for a salaried person in AY2026-27)",
        "Income tax is extraordinarily concentrated: in AY2023-24 roughly 91,000 returns that each owed more than 1 crore in tax (about 0.1% of all filers) paid about 58% of all income tax; about 3.35 lakh returns reporting income above 1 crore held about 45% of all declared income; just 908 returns reported income above 500 crore",
        "The personal (non-corporate) income tax overtook corporate tax around FY2020-21 and the gap is now over 2.5 lakh crore (FY2024-25 provisional: personal 12.35 lakh crore versus corporate 9.87 lakh crore); the burden has shifted onto individuals",
        "The composition of INDIVIDUAL taxpayers' declared income (the right cut for a who-pays story; do NOT use the all-taxpayer totals, which are inflated by company business income and company capital gains): for individuals, salary is the single largest source and grew about 4.2-fold over the decade to about 35.2 lakh crore (AY2023-24); individual business income grew about 3.6-fold to about 16.7 lakh crore; and individual long-term capital gains grew about 9-fold (from about 0.29 lakh crore in AY2013-14 to about 2.54 lakh crore in AY2023-24), a financialisation story. Do not claim business is the largest source, and do not say capital gains grew 17-fold; those are company-inflated all-taxpayer figures",
        "India's tax-to-GDP is about 17% of GDP (general government), mid-low: below upper-middle peers (China about 22%, Brazil about 33%, South Africa about 28%) and rich economies (United States about 25%, United Kingdom about 35%, Germany about 38%), but above Indonesia and Bangladesh",
        "India's personal income tax is about 3.7% of GDP, less than half the OECD average of about 8.2%, but ABOVE the Asia-Pacific average (about 3.6%) and far above China (about 1.1%); the right reading is a narrow base, not an unusually low effort for the region",
        "The system became MORE progressive over 25 years: direct taxes (on income) rose from about 36% of central tax revenue in 2000-01 to about 59% now, with a dip in the COVID year; direct taxes are more progressive than indirect taxes on spending",
        "India runs one of the cheapest tax systems in the world: the cost of collecting 100 rupees of direct tax fell from 1.36 rupees in 2000-01 to 0.41 rupees in 2024-25",
        "Honesty caveats to state plainly: the ITR Statistics cover returns that pass CBDT consistency checks (a filtered subset, not literally every return); figures are by assessment year, which taxes income earned the previous financial year; India's 'non-corporate' tax is slightly broader than the OECD's 'individuals only', and because India is absent from the OECD dataset its cross-country figures come from CBDT and ICTD (a documented splice); cross-country tax-to-GDP includes social contributions, which are large in Europe and near-zero in India"
      ],
      styleExample: [
        "## If most people who file pay nothing, are they dodging tax?",
        "Mostly, no, and this is where the lazy take falls apart. Look at when the zero-tax line jumps: it sits around 40% through the 2010s, then leaps to two-thirds in one year. Nobody suddenly learned to cheat in 2020. What changed was the law. A rebate made income up to 5 lakh effectively tax-free, and millions of perfectly honest filers, salaried people, pensioners, small traders, woke up owing nothing. You can see them pile up in the data: the single biggest cluster of returns sits in the income band just below 5 lakh, parked right under the cliff where tax becomes zero. So the right way to read the majority is not 'a nation of dodgers'. It is a country that decided, on purpose, to tax only the top of its income pyramid, and then built a return-filing habit far wider than the slice it actually taxes."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.gold") {
    const goldPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how much gold India has and why it cannot stop buying it, in the voice of someone who knows the gold market and Indian household finance cold and refuses the cliches. The hook and through-line is a paradox: India mines almost no gold yet privately holds more of it than almost any nation on earth, roughly 25,000 tonnes, far more than the RBI's official reserves, and it keeps importing more even when that swells the import bill and the trade deficit. Walk the argument in order: (1) the hoard, the enormous private stock of household and temple gold set against the RBI's much smaller official reserves; (2) the river, gold as one of India's largest imports, with a bill that has gone vertical in 2025-26; (3) the crucial twist that the record bill is mostly the global PRICE, not more metal, India is paying far more for slightly less gold; (4) where the gold comes from, two refining hubs (Switzerland and the UAE) rather than mines; (5) the refinery, India imports raw gold and re-exports a chunk as jewellery, so it is a workshop not just a sink; (6) why Indians buy, the slow shift from gold as ornament to gold as investment; (7) the saver's real question, whether gold beat the stock market, answered honestly; (8) and the state versus the saver, how import duty puts a wedge on the price and how the RBI itself has joined the buyers. Carry the argument forward section by section; never treat the charts as a disconnected list. Be scrupulously honest about what is estimated versus measured: the private stock is a reconstruction with a wide band, smuggling cannot be measured only bounded, and gold's recent edge over equities is a price surge that may not last. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and gold, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: goldPlanned.length
        ? goldPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "How much gold does India actually have?",
            "Why does India keep importing so much gold?",
            "Are we buying more gold, or just paying more for it?",
            "Where does India's gold come from?",
            "Does India just hoard gold, or does it sell some on?",
            "Why are Indians shifting from jewellery to gold bars?",
            "Would you have done better in gold or in the stock market?",
            "Why do Indians pay more than the world price for gold?"
          ],
      requiredConcepts: [
        "India mines almost no gold of its own, so almost all of it is imported; yet Indian households and temples privately hold an estimated 25,000 tonnes or more, among the largest private stocks of gold of any country, worth more than India's annual output by some estimates. This private hoard dwarfs the RBI's official gold reserves",
        "The RBI's official gold reserves are about 880 tonnes (worth over 115 billion US dollars in 2026), the eighth-largest official holding in the world, but a tiny fraction of what Indian households hold. Gold has risen to about one-sixth (about 16-17%) of India's total foreign-exchange reserves as the RBI diversifies away from dollar assets",
        "Gold is one of India's largest single imports. In calendar 2024 India imported about 57.6 billion US dollars of gold (about 806 tonnes); in the year to March 2026 the bill jumped to roughly 72 billion US dollars while tonnage was roughly flat near 700-720 tonnes. The crucial reading: the record bill is mostly the surging global gold PRICE, not more metal. India paid far more for slightly less gold",
        "Where the gold comes from: in 2024 Switzerland (about 19 billion US dollars) and the UAE (about 16 billion US dollars) together supplied roughly 60% of India's gold imports by value, with South Africa, Peru, Australia and Ghana behind them. Switzerland and the UAE are refining and trading hubs, not big miners, so the metal is often dug up elsewhere and refined there",
        "India is not only a sink for gold, it is a workshop. It imports raw gold and re-exports a large slice as finished jewellery, worth about 12 billion US dollars in 2024, going mostly to the UAE, the United States and Hong Kong. So the net amount of gold India absorbs is less than the gross import figure, and the gems-and-jewellery sector is a major exporter in its own right",
        "Why Indians buy is slowly changing. WGC data shows India's jewellery demand fell from about 662 tonnes in 2010 to about 441 tonnes in 2025, while bar-and-coin (investment) demand has climbed back toward 280 tonnes. Gold is shifting from something to wear toward something to hold as an investment, including newer digital and ETF forms",
        "The saver's question answered honestly: over the last 10-15 years gold in rupees and the Nifty 500 total-return index have run remarkably close (both roughly 12-15% a year for 2010-2025). Measured from 2005 gold looks ahead (about 22 times versus about 11 times for the Nifty 500 TRI), but that lead is mostly the 2025-26 price surge and is sensitive to the endpoint; equities led for much of the period. State this fairly and do not cherry-pick the window",
        "Decomposing gold's rupee return is the counter-intuitive payoff: the rupee gold return splits into the global gold price (in US dollars), rupee depreciation against the dollar, and India's import-duty-plus-premium wedge. Over 2010-2026 the global price was the majority driver (about 64-81% of the return) and currency the minority (about 21-33%); the duty wedge is a one-time level step, not a steady driver. The popular belief that Indian gold returns are mostly rupee debasement is quantifiably wrong for the modern era",
        "India's domestic gold price carries a wedge over the world price, driven by policy: it was about 2-3% before 2013, jumped to about 10% after the 2013 import-duty hike (raised to address the current-account deficit), and eased to about 6% after the July 2024 duty cut from 15% to 6%. The wedge steps with policy; it does not drift",
        "Honesty caveats to state plainly: the private-stock figure is a reconstruction (a base-year anchor plus cumulative net demand) with a wide band, not a measurement, so treat 25,000-31,000 tonnes as a range and the upward direction as the robust signal; official import data understates true inflows because smuggling rises when duties are high, and smuggling can only be bounded, never precisely measured; the RBI gold tonnage is approximate when derived from value, with about 880 tonnes the directly reported figure; the rupee gold price used here is the domestic price, which already includes the duty wedge; and several factors moving together is never proof that any one caused the result",
        "How the private-stock estimate is built, stated so the reader can judge it: take a base-year anchor of about 20,000 tonnes around 2010 (an industry estimate of accumulated household and temple gold), then add each year's net consumer demand (jewellery plus bars and coins, less recycling), which compounds to roughly 30,000 tonnes by the mid-2020s. The World Gold Council's independent top-down estimate is about 25,000 tonnes. Cite that WGC 25,000-tonne figure explicitly as corroboration, and present the stock as a 25,000 to 31,000 tonne RANGE, never a single precise number",
        "The long-run verdict on gold versus equities flips with the horizon, and you must show both honestly. Over the last decade or so gold has roughly matched the stock market, and from a 2005 start it even looks ahead, but that lead is mostly the 2025-26 price surge. Stretch the window to a full generation and shares win clearly: measured from 1996, one rupee grew to about 32 rupees in gold versus about 58 rupees in the Nifty 500 total-return index. The fair conclusion is that over long horizons Indian equities have beaten gold, gold's recent edge is start-date-dependent and may not last, and gold's real case is as a hedge and a store of value, not as a return-maximising asset",
        "Gold is increasingly borrowed against, not just stored: outstanding formal gold loans reached about 4.9 lakh crore rupees by April 2026, up roughly twentyfold since January 2019, the fastest-growing personal-loan category in India. Part of that jump is the reclassification of informal gold lenders into the formal banking data, but the rise of gold-backed borrowing is a real and important shift: the family hoard has become a source of credit",
        "Two precision guards for the import section: do not describe the import tonnage as 'stable' in the same breath as saying it fell; it is range-bound between roughly 700 and 1,000 tonnes a year with no upward trend, and the rising dollar bill is a price effect, not more metal. And never equate one year's imports with a different year's demand; consumer demand runs around 700 to 750 tonnes a year and imports sit above it in most years",
        "Gold is being financialised, and this deserves its own thread late in the piece. Assets in Indian gold ETFs have jumped from a few thousand crore in the mid-2010s (about 6,000 crore in 2015) to well over one lakh crore rupees, a roughly sixfold rise since 2023 (AMFI data), though part of that is simply the soaring price lifting existing holdings. Digital gold bought through UPI has surged too, climbing past 2,000 crore rupees a month by late 2025 with transaction volumes up about 377% in sixteen months (NPCI merchant-category data). Frame this as gold turning from an ornament into a financial asset, held as fund units, app balances and collateral, while honestly noting these digital forms are still tiny next to the physical hoard and that the digital-gold series is compiled from selected months of NPCI disclosures",
        "Gold's weight on the economy is clearest against India's other big imports: crude oil is the largest single import at around a fifth of the total, and gold is usually the second or third largest at roughly 5 to 10 percent. Both shares move with world prices as much as with volumes",
        "India's gold import duty is a policy lever the state has pulled repeatedly, and it is the engine behind the domestic price premium: roughly 2% before 2012, raised step by step to 10% by 2013 to fight a current-account crisis, up to 15% by 2022, then cut sharply to 6% in July 2024, a cut that visibly shrank smuggling. This is the effective customs duty and excludes the 3% GST",
        "Why gold is a macroeconomic worry, not just a cultural one: gold is imported and paid for in US dollars, so a surge in gold buying widens the current-account deficit (the gap between what India earns and spends abroad). India's current-account deficit hit a record of about 88 billion US dollars in 2012-13, when gold and oil imports both ballooned, and that squeeze on the rupee is exactly what pushed the government to raise gold import duties and curbs. The deficit has since narrowed to roughly 23 billion dollars (2024-25). Gold is one driver among several, so do not pin the whole deficit on it",
        "The state has also tried to wean Indians off physical gold with paper substitutes, with limited success. The flagship attempt, Sovereign Gold Bonds (government securities that track the gold price and pay interest), issued only about 147 tonnes of gold-equivalent over its life from 2015, raising roughly 72,000 crore rupees, a rounding error against the 25,000-tonne private hoard. The government effectively halted fresh issuance in 2024 because the scheme became too expensive for it as gold prices soared. State schemes to financialise or mobilise India's gold have repeatedly run aground on the same fact: Indians prefer to hold the metal itself",
        "The most current twist, and a natural place to end, is that the duty story just repeated itself. Having cut the gold import duty to 6% in July 2024, the government reversed course hard in 2026: facing a rupee that had fallen more than 7% and pressure on foreign-exchange reserves, it tightened gold imports through early April 2026 and then hiked the duty from 6% straight back to 15% on 13 May 2026, the steepest single increase on record, alongside curbs on jewellery, silver and platinum imports and even a public appeal from the Prime Minister urging people to avoid buying gold for a year. Early estimates expect 2026 demand to fall by roughly 10%. State and saver are, once again, pulling in opposite directions: the government trying to stem the dollar outflow, households reaching for gold precisely because the rupee is weak. Present this as the live, unresolved tension the whole piece has been building toward, not as a settled outcome",
        "Why Indians actually buy gold, told with established cultural and economic reasons rather than armchair psychology or claims about national character. Gold is woven into ritual and the life cycle: it is central to weddings, and to festivals like Akshaya Tritiya and Dhanteras when buying gold is considered auspicious. Gold given to a bride, stridhan, is legally her own property, which makes it one of the few forms of financial security and autonomy a woman may hold in her own right. Gold is also among the most liquid assets a household owns, pawnable for a loan within hours, which matters enormously where formal credit is thin (this connects directly to the gold-loan boom). And a long history of currency debasement, distrust of paper money and patchy rural banking access made the metal the default store of value for generations. India has been a sink for the world's gold for two thousand years, since Roman times. Give this its own section answering 'why gold, and not a bank deposit', and be careful to keep every claim to the well-established; do not speculate about psychology",
        "A note that builds trust in the numbers, suitable for the methods or caveats section: India's gold import figures are independently corroborated. Switzerland, India's single largest gold supplier, publishes its own customs record of gold it exports to India, and those figures match India's reported imports from Switzerland to within about 7% on average across recent years. So the import data the article relies on is reliable and reconciled across two countries' books, not a single unverified source"
      ],
      styleExample: [
        "## Are we buying more gold, or just paying more for it?",
        "Mostly the second, and it matters more than it sounds. Look at the two lines side by side: the rupee bill for imported gold has gone almost vertical, a record by a wide margin, while the tonnage underneath it has barely budged from the 700-or-so it has hovered around for years. India is not suddenly hauling in mountains more metal. It is paying far more for roughly the same amount, because the world price of gold has surged. That distinction changes the whole story. A bigger gold bill is usually read as Indians binge-buying, with all the hand-wringing about the trade deficit that follows. But when the tonnage is flat, the swollen bill is a price the world set, not an appetite India grew. The metal coming through the ports is about what it always was; what changed is how much each gram costs."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.industrial_policy") {
    const ippPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer whether India's dramatic surge in protective industrial policy has paid off, in the voice of someone who understands trade economics, Indian political economy and the World Bank's SAEU April 2026 report cold, but writes for a reader who has never heard of industrial policy. The hook is a question every reader can feel: India nearly doubled its use of protectionist measures after 2020 — more than almost any other country — and the honest answer from the data is that it is a bet, not a proven strategy. Walk the argument in four acts: (1) the surge, India went from 125 to 239 protective measures a year, joining a global wave but standing out even in that company; (2) the distinctive Indian playbook, procurement-heavy rather than tariff-first, targeting high-wage productive sectors rather than sunset industries; (3) the evidence, import restrictions do cut imports but export incentives show no clear effect, and the jobs the policy was meant to create are still in services not manufacturing; (4) the bill, fiscal space is tight, implementation lags ambition, and the FTA counterpoint shows that tariff cuts would help every Indian household. The article MUST open by disclosing that it draws on the World Bank's SAEU April 2026 report 'Working with Industrial Policy' and link to it. Be scrupulously honest about what the data can and cannot show: the policy counts are from the Global Trade Alert database and treat a simple import ban the same as a complex subsidy scheme; the employment data covers only formal-sector workers; the FTA household effects are static first-order estimates that assume full pass-through; the trade impulse responses have wide confidence intervals, especially for export incentives. Never narrate the article itself ('this chart shows', 'in the previous section'). Write about India and its industrial policy, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: ippPlanned.length
        ? ippPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "How much has India's industrial policy actually surged?",
            "Is India alone in this, or is the whole world doing it?",
            "Where does India rank among the big protectionist countries?",
            "What tools is India using — tariffs, subsidies, something else?",
            "Who gets protected and why?",
            "Which sectors wear the armour?",
            "How high are India's import duties compared with the rest of the world?",
            "Do these policies actually work?",
            "Where are the jobs?",
            "Who pays for the tariff wall?",
            "Does India have the money and capacity to do this well?",
            "Is India also opening up, or just closing down?"
          ],
      requiredConcepts: [
        "India nearly doubled its annual average of new protective industrial policy measures between the four years before COVID (2016-19, about 125 a year) and the four years after (2022-25, about 239 a year). This made India the sixth-most-active country globally in protective industrial policy and the third-most-active emerging economy, behind only China and Brazil",
        "This was not a uniquely Indian move. Industrial policy has surged worldwide since the pandemic, with the total number of new measures roughly doubling across both advanced economies and EMDEs. India is surfing a global wave, but it is a bigger wave than most",
        "India's playbook is distinctive. Unlike Sri Lanka, where 78% of protective measures are import restrictions, or Nepal at 55%, India uses import restrictions for only about 23% of its measures. Instead, India relies heavily on public procurement (about 23% of measures, versus near-zero in the rest of South Asia) and subsidies (about 30%). Government procurement spending in India is about 20% of GDP, more than twice the EMDE median of 8%. The Indian state is using its massive purchasing power as its main industrial policy tool",
        "Contrary to the stereotype of protecting uncompetitive sunset industries, India directs more industrial policy at manufacturing sectors with higher average wages and larger, more productive firms. Protected manufacturing sectors pay about 30% higher wages than unprotected ones, and the firms in them are about 100% larger by employment and 40% more productive. India is betting on upgrading, not preserving",
        "The policy flows to where import competition is highest. A one-percentage-point increase in a sector's import share predicts 0.47 more protective measures in India — a strong and statistically significant relationship. Export-oriented sectors also get more protection, suggesting the measures are dual-purpose rather than purely defensive",
        "About half of all protective industrial policy measures target manufacturing, even though manufacturing accounts for only about 14% of South Asian employment. Within manufacturing, food processing is still the largest beneficiary, but electronics has surged to second place in the 2020s, reflecting India's production-linked incentive schemes and the broader push into high-tech manufacturing",
        "India's average applied import duty of about 15.8% is roughly double the EMDE median of 8.5% and about triple the 25th percentile. Only Sri Lanka, with its additional para-tariffs on top of statutory duties, is higher in the region at about 19%",
        "The scorecard on whether these policies work is mixed. Import-restricting measures (anti-dumping duties, safeguards, import bans) do reduce imports significantly — by about 15% after three years — though with wide confidence intervals. Export-promoting measures (export subsidies, tax incentives) show no statistically significant effect on exports. The confidence band spans both positive and negative territory, meaning we simply cannot tell if they work from the available data",
        "The employment payoff is barely visible. In India, the non-agricultural sectors that received the fewest industrial policy measures — mostly services — grew employment at about 0.91% a year. The sectors that received the most protection grew at about 0.95% a year. The difference is trivial. The vast majority of job creation in India over the past decade came from services, which received almost no targeted industrial policy support",
        "The protection wall is paid for at the kitchen table. The World Bank's modelling of India's proposed free trade agreements with the European Union and the United Kingdom shows that the tariff cuts would raise consumption for every single household, across all income levels. Rural households would gain 0.20 to 0.33% in consumption; urban households 0.16 to 0.26%. The poorest rural quintile gains the most. Real income effects are also universally positive. Tariffs are a regressive tax on Indian consumers",
        "India's fiscal capacity to sustain an ambitious industrial policy is stretched. Tax revenue at about 18% of GDP lags the EMDE average of 20.4%, and is below every other South Asian country except Bangladesh and Sri Lanka. Government debt is above the EMDE average. The flagship Production-Linked Incentive scheme, a centrepiece of India's industrial policy, had disbursed only about 12% of its allocated funds as of September 2025, held back by bureaucratic hurdles and inter-ministerial coordination problems",
        "Implementation capacity is the binding constraint. It takes medium-sized Indian firms about 16 days to clear imports through customs and about 20 days to clear exports — roughly three to four times the EMDE medians of about five days. India's government effectiveness ranks in the 68th percentile globally, good for an EMDE but well below the advanced-economy median of the 88th percentile. The design of industrial policy in Delhi often runs into the reality of a customs shed in Mumbai",
        "The counterweight to the protection surge is that India is simultaneously negotiating its largest-ever free trade agreements. The deals with the EU and UK, once in force, will double the share of global output India has preferential access to — from about 16% to about 33%. This would put India ahead of China, Turkey and Brazil in FTA coverage. India is not only building walls; it is opening doors, and the two strategies exist in tension",
        "The electronics sector is the bright spot the World Bank holds up. Coordinated policies — the National Policy on Electronics, production-linked incentives, and plug-and-play industrial parks in Tamil Nadu — have attracted more than 4 billion US dollars in foreign direct investment, brought Apple suppliers to Indian soil, and driven a boom in mobile phone exports. It is the proof of concept. But it is the exception, not the rule, and it required unusually well-coordinated policy across multiple arms of government",
        "Honesty caveats to state plainly: the policy measure counts come from the Global Trade Alert database and treat a sweeping import ban the same as a minor subsidy tweak — they measure quantity, not size or monetary value. The employment data covers only the formal sector. The trade impulse responses have wide confidence intervals, especially for export incentives. The FTA household effects are static first-order estimates that assume full pass-through of tariff cuts to consumer prices and do not include second-order gains from export expansion or FDI. The regression results show correlations, not causal proof. And the data end in 2023-2025, so the most recent policy shifts — including the 2026 US tariff escalation and India's responses — are not captured"
      ],
      styleExample: [
        "## Do these policies actually work?",
        "The honest answer is that half of them do, and half of them we simply cannot tell. The half that works is the blunt instrument: import restrictions. When India slaps an anti-dumping duty on a product or raises a tariff barrier, the imports of that product do fall. Not instantly — it takes about three years for the full effect to show — but the direction is clear and the decline, at roughly 15%, is real. The half we cannot tell about is export promotion. Subsidies, tax breaks and incentives meant to boost exports show no statistically significant effect. The confidence band is so wide it covers both a sizeable increase and a sizeable decline. That does not mean the policies are failing. It means the data cannot distinguish success from noise. If you are spending public money on export incentives, that should trouble you.",
        "## Who pays for the tariff wall?",
        "You do. Every Indian household, across every income level. The World Bank modelled what would happen if India's proposed free trade agreements with the European Union and the United Kingdom went through — the tariff cuts they would bring — and the answer is that every single household gains. Rural households gain more than urban ones, and the poorest rural quintile gains the most, about a third of a percent in consumption. These are not large numbers — we are talking about a few hundred rupees a year for a typical family — but the direction is unanimous and the pattern is clear. A tariff is a tax, and when you lower it, people keep more of what they earn. The protection wall India has built over the past five years is paid for, quietly and invisibly, at every kitchen table in the country."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.climate.impact") {
    const climatePlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how climate change is actually changing India, weaving the physical signal, the air, the cause, and why India is exposed into one honest story. This is the flagship climate page, so it must be the most complete and the most readable.",
      requiredSections: climatePlanned.length
        ? climatePlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "Is India actually getting hotter?",
            "Is the monsoon changing?",
            "What does the air feel like right now?",
            "How much is India adding to the cause?",
            "Is India a big emitter per person and over history?",
            "Why is India so exposed?",
            "What should the reader remember?"
          ],
      requiredConcepts: [
        "Temperature anomaly is the gap from a 1991-2020 normal, not the absolute temperature, so a small number like one degree is a big shift",
        "A national average temperature hides far hotter local extremes, cities, and heat waves",
        "India runs on the monsoon, so rainfall variability and timing matter more than the annual total",
        "AQI is a live snapshot of air pollution, not a yearly average, and the same fossil-fuel burning drives both warming and dirty air",
        "Annual, per-capita, and cumulative CO2 each tell a different and fairer part of India's responsibility",
        "Carbon intensity of electricity (CO2 per unit of power) can fall even while total emissions rise",
        "India's exposure is measured in people and livelihoods, farming and population, not only in degrees"
      ],
      styleExample: [
        "## Is India actually getting hotter, or does it just feel that way?",
        "It is getting hotter, and the chart is careful about how it says so. It does not plot the temperature itself. It plots the anomaly, the gap between each year and the 1991-2020 average. So a value of one degree does not mean a mild day. It means the whole country, averaged across a year, ran a full degree above its recent normal. That is a lot of extra heat spread over a lot of land. And because this is a national average, it is gentler than what a construction worker in Nagpur or a family in a Delhi summer actually lives through. The average smooths out the spikes. The spikes are where the danger is."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.climate.el_nino_india") {
    const elNinoPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer what El Nino actually does to India, in the voice of someone who knows monsoon science and Indian agricultural economics cold and can make a layperson feel the stakes without dumbing them down. This is the flagship monsoon-risk page and is timed to a live hook: India enters the 2026 monsoon under a below-normal IMD forecast with El Nino risk rising. The single through-line, repeated until it is unmissable, is that El Nino is a warning light, not a verdict: it loads the dice toward a weak monsoon but does not decide the outcome, because the strength of the El Nino, the state of the Indian Ocean, the timing and geography of the rain, the buffer stocks, and government policy all get a vote. Walk the argument in deliberate order: (1) open on the long, jumpy rainfall record and the live 2026 hook; (2) give the honest statistical answer, that El Nino years are drier on average and far more often deficient, but a large minority still finish wet; (3) show that the scary-or-mild impression depends entirely on how strictly El Nino is defined, and that the relationship itself may be drifting over time; (4) bring in the second ocean, the Indian Ocean Dipole, and the idea that the flavour of El Nino matters, to explain why the rule keeps breaking; (5) break the all-India average apart by region and by month, because India does not eat a national average; (6) trace the chain from rain to harvest to farm incomes; and (7) trace it on to food prices and the shrinking macro footprint of farming, ending on what to actually watch through 2026. Carry the argument forward section by section; never treat the charts as a disconnected list. Be scrupulously honest about uncertainty and about what a single number hides. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and the monsoon, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: elNinoPlanned.length
        ? [
            ...elNinoPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A short closing H2, 'Where these numbers come from', that names the data sources (IMD rainfall, NOAA ENSO and IOD indices, RBI national accounts and wholesale prices, ICRISAT district yields, UPAg crop estimates) and states the method plainly: phases and anomalies are measured against each series' own baseline, correlations are descriptive not causal, and 2026 is a live forecast, not a finished year. This is the methodology disclosure and must be the last section."
          ]
        : [
            "What does El Nino actually do to the monsoon?",
            "Does El Nino guarantee a drought?",
            "Why does the same El Nino sometimes spare India?",
            "Does El Nino hit every part of India equally?",
            "How does a weak monsoon reach the dinner plate?",
            "What should India watch through 2026?",
            "Where these numbers come from"
          ],
      requiredConcepts: [
        "El Nino in plain English: it is a recurring warming of the central and eastern equatorial Pacific Ocean. It matters to India because it shifts the tropical rising air and the Walker circulation eastward toward the Pacific, weakening the large-scale ascent over the Indian and maritime-continent region that pulls the summer monsoon inland, so the June-September rains tend to be lighter. La Nina is the cool mirror image and tends to favour a strong monsoon. Define this on first use before any statistic",
        "ONI in plain English: the Oceanic Nino Index is how the warming is measured, the temperature anomaly of a patch of the equatorial Pacific; above +0.5C is El Nino, below -0.5C is La Nina, in between is neutral. Use this to explain the 'Pacific state' labelling without jargon",
        "Ground the rainfall percentages so they mean something, because a reader does not feel '-3.2%'. The monsoon delivers roughly 70% of India's rain for the whole year in one June-to-September burst, and the long-period average is about 88 cm of it. IMD calls a season normal when it lands within about 10% of that average, below normal between 10% below and the normal band, and deficient once it falls more than 10% short, which is the threshold people loosely call a drought year. So the headline -3.2% El Nino average is, by IMD's own yardstick, still a normal monsoon; the real damage lives in the tail, the years that breach -10% (1972 at -22%, 2002 at -21%). When you cite an average, briefly say which side of that normal-to-deficient line it sits on",
        "Explain how a deficit or a surplus actually shows up on the ground, not just as a number. A shortfall means the monsoon arrives late or breaks mid-season, so reservoirs and groundwater do not refill, farmers delay or re-sow, kharif yields slip, rural wage work shrinks, and food prices can climb months later. But more rain is not automatically good: a big surplus can mean floods, waterlogged fields, washed-out roads and rotted vegetables, which is why a wet year can still spike vegetable prices. Make at least the worst-year and the price sections concrete in these human terms",
        "The history is the reason the science exists, and it should be told with citations: the India Meteorological Department was founded in 1875, in the era of catastrophic monsoon-failure famines. After the famine of 1899, IMD's Gilbert Walker spent the 1900s and 1920s hunting for a way to forecast monsoon failure and identified the 'Southern Oscillation', the pressure seesaw between the eastern and western tropical Pacific, which is the atmospheric half of what we now call ENSO (Walker, 1924). The ocean half, El Nino, was tied to it by the meteorologist Jacob Bjerknes in 1969 (Bjerknes, 1969). The monsoon-prediction problem is literally why ENSO was discovered. These are given historical facts; state them, do not hedge them as uncertain",
        "The great El Nino famines, told with a citation and a moral: the monsoon failures of 1876-78 and 1896-1902 were among the deadliest events in Indian history and coincided with very strong El Ninos; the historian Mike Davis called them the 'Late Victorian Holocausts' and argued that British colonial laissez-faire policy turned drought into mass death (Davis, 2001). 1877 and 1899 sit in IMD's own list of the worst monsoon-deficit years on record. The lesson the article carries forward is exactly its thesis: El Nino sets the physical risk, but politics, stocks and policy decide whether a drought becomes a famine",
        "The honest statistical answer, all from the evidence packet: across the joined 1950-2025 record, El Nino monsoons averaged a rainfall deficit while La Nina monsoons averaged a surplus and neutral years sat in between (phase_rain_summary); El Nino years finished below normal far more often than La Nina or neutral years, roughly doubling the odds of a weak monsoon (bad_monsoon_frequency); yet a large minority of El Nino monsoons, 11 of 26, still finished above normal (exceptions). The one-line takeaway: El Nino raises the odds of a bad monsoon, it does not decide it",
        "Definition discipline is itself a finding: the reassuring 'about -3%' average uses the loosest possible count, any brush with El Nino during the season (26 years). Restrict to the monsoons when the Pacific stayed in El Nino through the whole season and the average deficit roughly doubles; restrict to strong events only and it roughly triples (definition_sensitivity). Say plainly that the comforting number is the most generous one, and that the El Nino monsoons people actually remember are worse than the headline",
        "The link may not be fixed in time: scientists have argued since Kumar, Rajagopalan and Cane (1999) that the El Nino-monsoon relationship is weakening. The rolling-correlation evidence shows the bond loosened to its weakest around the late 1990s and then tightened again through the 2000s (enso_monsoon_rolling_corr), so the historical base rate is a guide, not a guarantee, for 2026 (Kumar, Rajagopalan and Cane, 1999)",
        "The second ocean explains many of the exceptions, and the mechanism should be made concrete, not left as jargon. The Indian Ocean Dipole (IOD) is a temperature seesaw in the ocean just south of India: in its positive phase the western side near Africa runs warmer than usual and the eastern side near Indonesia runs cooler. That warm western pool sits right beside India and feeds extra moisture and rising air into the monsoon, which can push back against a drying El Nino in the Pacific; a negative dipole does the reverse and can deepen a weak monsoon. El Nino years that coincided with a positive dipole averaged near-normal rain, while those without averaged a clear deficit (enso_iod_matrix). 1997 is the textbook case: a record El Nino offset by a strong positive dipole, and the monsoon held. But it is a tilt, not a shield, and 1972 was a severe drought despite a positive dipole. In the section that asks whether the Indian Ocean matters, spell out this warm-west, cool-east picture so a lay reader can see why a second, nearer ocean gets a vote",
        "The flavour of El Nino matters too, presented as research-supported rather than settled law: studies find that central-Pacific or 'Modoki' El Ninos, where the warming peaks near the dateline, are more damaging to the Indian monsoon than classic eastern-Pacific events (Kumar, Rajagopalan, Hoerling, Bates and Cane, 2006; Ashok and others, 2007). This helps explain why the strong eastern-Pacific El Nino of 1997 spared India while the central-Pacific event of 2009 produced a severe drought",
        "India does not eat an all-India average, shown two ways. By region, the northwest, the wheat-and-pulses belt, loses the most rain in El Nino years, far more than the national figure (regional_sensitivity). By month, El Nino monsoons are driest at the two ends, a weak June onset and a faltering September, while August holds up best (subseasonal_composite); a dry June at sowing or a missing September can hurt the crop calendar more than the seasonal total suggests",
        "The rain reaches the plate through crops first: the monsoon is still visible in the harvest decades after the spread of irrigation (rainfall_crop_correlations). Do not leave the correlation coefficients bare; translate them. A correlation of about 0.7 for foodgrains means rainfall and output rise and fall largely together but not lockstep, while wheat's far weaker link (about 0.37) means its winter, irrigated crop barely follows the monsoon. Foodgrains, rice and oilseeds track the rain most, irrigated wheat least. In the national accounts, real farm output grows about twice as fast in La Nina years as in El Nino ones (agri_gva_growth_by_phase), though the average El Nino drag on farm GVA is smaller than people assume, because irrigation and buffer stocks cushion it; the damage concentrates in specific crops, regions and prices rather than the national output average",
        "The crucial price nuance, which is the opposite of the lazy story: a drought does not automatically mean dearer food. Over the 1982-2024 wholesale-price record, post-monsoon food inflation in El Nino years ran from near zero, in 2002, the worst drought on the chart, when large public buffer stocks and a global commodity lull held prices down, to over 16% in 2009 (food_wpi_postmonsoon). And 'food' is a bundle of separate shocks: pulses and onions can spike 40 to 90% after a drought while cereals barely move, shielded by public grain stocks and procurement (food_wpi_components). Prices answer to stocks, imports, exports, policy and global cycles, not rainfall alone; the 1991 food spike owed more to the balance-of-payments crisis and rupee devaluation than to the monsoon",
        "The long inflation view is the honest visual test of the whole price argument: a time chart of three inflation lines, each starting where its data begins (World Bank headline CPI from 1960, wholesale food from 1983, retail food from 2012), with El Nino monsoon years shaded as red bands. If the monsoon really drove inflation, the spikes would sit on the shaded years. Mostly they do not: the tallest spike of all is 1974's oil shock at about 28%, nowhere near an El Nino, and the 1991 currency crisis and the 2020 and 2022 spikes are not monsoon stories either. The wholesale-food line is the most monsoon-sensitive of the three, yet even it climbs in only some shaded years. Say plainly that this is the point - El Nino is one driver among oil, global markets, public stocks and policy - and remind the reader the wholesale (WPI) line is not the retail price households actually pay, which is why the retail-food line sits below it where they overlap",
        "Why the macro stakes have shrunk but the human stakes have not, told through the two-line jobs-versus-output chart so a reader can see how many people a bad monsoon reaches. Agriculture's share of India's output has fallen from over 60% in 1951 to about 14% today, so an identical rainfall miss moves headline GDP far less now than it did in 1965. But the share of India's WORKERS in farming has fallen much more slowly and is still around 41 to 42% - roughly two in five working Indians. The gap between the two lines is the whole point: a drought is a small event for GDP and a large event for livelihoods. Add that food is a big slice of poor households' budgets, so the monsoon still sets rural incomes and the price of a meal even when it barely dents the growth rate",
        "The 2026 live hook and watch-list: IMD's April 2026 long-range forecast put the southwest monsoon at about 92% of the long-period average, plus or minus 5%, which is below normal, with ENSO forecasts pointing toward El Nino risk during the summer and a positive IOD possible later in the season. Treat 2026 as live and incomplete and never chart it as a finished year. What to watch: whether the monsoon actually advances, whether July and August recover or deepen any June deficit, whether the Indian Ocean Dipole turns positive, whether reservoirs are comfortable, how sowing progresses, and food prices component by component",
        "The rainfall map is not the harvest map, and irrigation is why. These yield figures are deviations from each crop's average yield in the five years before each El Nino - its recent normal - not changes from zero, so you MUST say what they are measured against the first time you use them, or '+7.3%' is meaningless. Using ICRISAT district-level crop data (1966-2017), El Nino's yield damage falls on the rainfed belts, not necessarily where the most rain is lost. Eastern rainfed rice (Jharkhand, Bihar, Chhattisgarh) runs below its recent-normal in El Nino years, while heavily irrigated Punjab and Haryana rice runs above it (rice_yield_anomaly_state). Split by region, northwest irrigated rice averaged about 7% above its five-year normal across the El Nino monsoons even as the same region's rainfed coarse cereals ran about 12% below theirs (irrigation_yield_split). Phrase it as 'about 7% above the recent normal', not a bare '7.3%'. The lesson: a region can lose the most monsoon rain and still protect its main crop if it can irrigate, so canals and tubewells, not just the Pacific, decide the harvest",
        "Disclose the data sources and method in a plain closing section, because this article stitches together many feeds: IMD Pune for monsoon rainfall, NOAA for the ENSO (ONI) and Indian Ocean Dipole (DMI) indices, RBI national accounts for agricultural GVA and wholesale prices for food inflation, ICRISAT's district database for crop yields, and UPAg for the latest crop estimates. State plainly that each phase or anomaly is measured against that series' own baseline, that correlations are descriptive and not proof of cause, and that 2026 is a live forecast and not a completed year. Do not turn this into a reference list; write it as a short, honest paragraph a reader can trust",
        "NO BARE NUMBERS - this is the single most important style rule for this page, because the recurring weakness is percentages and coefficients that float without a referent. Every time a number first appears, anchor it: say what it is measured against and whether it is big or small in plain words. A rainfall figure is measured against the long-period normal (and sits in the normal or deficient band); a crop-yield figure is measured against that crop's own previous-five-year average (its recent normal), so write 'about 7% above its recent normal', never a naked '7.3%'; a correlation is put into words (move together or not); an inflation figure is year-on-year against the same month a year earlier; a share is a share of a named whole. If you cannot say what a number is measured against, do not use it. Prefer rounded, spoken forms ('about 12% below', 'roughly two in five') over false-precision decimals in the running prose. This rule applies to the body, the chart explainers and the macha layer alike",
        "Number discipline is absolute: every statistic, rate, share, rupee figure and rainfall percentage in the prose must come from the evidence packet, never invented or recalled. The qualitative history, mechanism and concepts listed here may be stated as given facts. Keep the macha layer warm and plain-spoken, a smart friend explaining the monsoon, with the humour living in the headings, not the explanations"
      ],
      styleExample: [
        "## So does El Nino mean India is headed for a drought?",
        "Not by itself, and that is the whole point. Think of El Nino as a warning light on the dashboard, not a diagnosis. When the Pacific warms in this particular way, it tugs the engine of the monsoon eastward, out over the ocean, and India tends to get less rain for it. On average. Over many years. But average is doing a lot of work in that sentence. Line up every El Nino monsoon since 1950 and yes, more of them came up short than in a normal year. And then look again, because a good chunk of them finished perfectly wet. The Pacific gets a vote. So does the Indian Ocean next door, so does the timing of the rain, so does the grain sitting in government warehouses. El Nino loads the dice. It does not throw them."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.work.how_india_works") {
    const workPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how India actually works as a labour market, in the voice of someone who knows Indian labour economics cold. This is a flagship: it must be the most complete, most rigorous and most readable page on the site. The through-line is that India has the world's largest, youngest workforce but a stalled structural transformation — most Indians are self-employed or in informal/casual work, the economy's output shifted to services while its workers stayed on farms, women largely sit outside measured work, and the headline unemployment rate is low even as graduate and youth joblessness run high, with MGNREGA acting as the shock absorber. Carry this argument forward section by section; do not treat the charts as a disconnected list.",
      requiredSections: workPlanned.length
        ? workPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : ["How big is India's workforce?", "Who works and who doesn't?", "Why do so few women work?", "What kind of work do Indians do?", "Why are workers still on the farm?", "What does work pay?", "Why are graduates the ones without jobs?", "What happens when work runs out?"],
      requiredConcepts: [
        "LFPR (labour force participation rate) is the share of people working OR looking for work; WPR (worker population ratio) is the share actually working; UR (unemployment rate) is the share of the labour force that wants work but cannot find it — UR is a share of the labour force, not of the population",
        "PLFS measures status two ways: usual status (PS+SS, over a year) and current weekly status (CWS, over the last week); they give different numbers and should not be mixed",
        "A low unemployment rate in a poor country with little unemployment insurance signals that people cannot afford to be jobless and take any work, not that good jobs are plentiful",
        "Self-employment and casual labour dominate Indian work; a regular salaried job with a payslip is a minority experience, and 'vulnerable employment' means own-account plus unpaid family workers with no security",
        "Structural transformation: as economies develop, workers move farm to factory to office; India's output moved to services but its workers stayed disproportionately in agriculture — output share and employment share diverge (the productivity trap)",
        "The graduate-unemployment paradox: unemployment rises with education in India because the educated can afford to wait for jobs matching their qualifications while the least educated cannot",
        "World Bank/ILO figures are modelled estimates and differ in level from PLFS survey numbers; use PLFS as the authoritative India spine and World Bank for the long arc and cross-country comparison",
        "Rural and PLFS wage figures here are nominal rupees unless stated, so part of any rise just tracks inflation",
        "MGNREGA is a rural job guarantee (up to 100 days per household); demand for it rises when private work disappears, so it is a distress signal and a safety net, not a ladder to better jobs"
      ],
      styleExample: [
        "## Why are the graduates the ones without jobs?",
        "Because in India, being unemployed is something you have to be able to afford. Look at the chart: a worker with no schooling has an unemployment rate near zero, while a graduate's is many times higher. That looks backwards until you remember what the number measures. The unemployment rate counts people who want work and are actively looking but have not found it. A landless labourer cannot spend six months searching for the right job; there is no cushion, so he takes whatever pays today, and by definition he is employed. A graduate from a family that can feed him while he waits will hold out for a job that uses his degree — and in an economy that creates very few such jobs, he waits a long time. So the rising line is not a story about education being useless. It is a story about an economy that produces millions of graduates and far too few of the formal, salaried jobs they were educated for."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.health.deaths") {
    const deathsPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer what actually kills Indians, in the voice of someone who knows Indian public health and demography cold. The through-line is the epidemiological transition: India has flipped from dying of infections to dying of non-communicable disease, heart disease is now the runaway number-one killer, infectious diseases and maternal/child deaths have fallen dramatically, COVID was a sharp spike that has since receded, and injuries and suicide quietly kill working-age adults. Carry that argument forward chart by chart; never treat the charts as a disconnected list. Be honest that the cause-of-death backbone is modelled (GBD) and cross-check it against India's own registers (MCCD, SRS, NCRB).",
      requiredSections: deathsPlanned.length
        ? deathsPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : ["What kills the most Indians?", "Why is heart disease number one?", "What drives the non-communicable surge?", "What does India's own death register say?", "What did COVID do, and did it recede?", "Are Indians dying at a lower rate?", "Are infectious diseases still killing Indians?", "How many die from injury and suicide?", "What is the biggest public-health win?", "Who dies, the young or the old?"],
      requiredConcepts: [
        "The epidemiological transition: as a country develops, the leading causes of death shift from communicable diseases (infections, maternal and child deaths) to non-communicable diseases (heart disease, cancer, diabetes); India is now well into this shift",
        "Non-communicable diseases (NCDs) are chronic, non-infectious conditions, mainly cardiovascular disease, cancers, chronic respiratory disease and diabetes; 'cardiovascular' bundles heart attacks and strokes",
        "Absolute death counts versus rates: total deaths from a cause can rise simply because the population is larger and older, even if an individual's age-adjusted risk is flat or falling, so a rising count is not the same as rising risk",
        "The crude death rate is deaths per 1,000 people, not age-adjusted, so an ageing population can push it up over time even as age-specific mortality falls",
        "GBD (Global Burden of Disease, IHME) figures are MODELLED estimates that fill gaps where registration is incomplete; they are internationally comparable and run to 2023, but they are not a count of certified deaths",
        "SRS-CoD (the SRS Cause of Death survey, 2022-24) is India's own NATIONALLY REPRESENTATIVE cause-of-death data: it assigns causes by verbal autopsy on the SRS sample and so counts rural and at-home deaths, unlike hospital records; it finds cardiovascular disease is 32.1% of all deaths and non-communicable diseases 60.1%; this is the strongest India check on the modelled GBD figures and should be treated as the primary India cause-of-death source",
        "MCCD (Medical Certification of Cause of Death) is a DIFFERENT India source: it covers only about 22% of registered deaths, all medically certified and skewed urban/institutional, so its higher circulatory share (36.4%) reflects that urban bias and it is NOT a representative sample of all deaths, useful only as a contrast to SRS-CoD",
        "SRS (Sample Registration System) is India's official large-sample survey behind the national birth and death rates; it is the domestic source to cite for the crude death rate and infant mortality (distinct from the SRS-CoD cause survey)",
        "Suicide figures differ by source: GBD models around 200,000 self-harm deaths, while India's police records (NCRB) report about 1.7 lakh suicides in 2023; suicide is widely undercounted due to stigma and registration gaps",
        "COVID-19 mortality is genuinely uncertain, GBD's estimate is lower than some excess-death studies, but every source agrees the toll spiked in 2020-21 and then receded",
        "What kills you depends overwhelmingly on your age: babies die of birth complications and infection, school-age children of accidents like drowning, working-age adults (15-49) of heart disease but also road injuries and suicide ranked third and fourth, and the elderly almost entirely of non-communicable disease; the all-ages ranking hides this completely",
        "Cause of death differs by sex: men die far more from injuries (accidents, suicide, violence) while women carry a higher share of 'ill-defined' deaths; the SRS survey shows this for all ages, but GBD's true age-by-sex cut is not available through OWID, so do not invent age-specific male/female numbers"
      ],
      styleExample: [
        "## So what actually kills the most Indians?",
        "Heart disease, and it is not close. Look at the top bar: cardiovascular disease, heart attacks and strokes together, killed around 3.1 million Indians in 2023, more than the next two causes combined. A century ago the answer would have been infections, plague, cholera, tuberculosis. Today India dies the way richer, older countries die: of clogged arteries, tumours, failing lungs and high blood sugar. That flip has a name, the epidemiological transition, and India is deep into it. The catch is that these are modelled estimates, not a headcount of death certificates, because most Indians still die at home without a doctor to record why. So read the bar as the best available picture, then watch how India's own death register, imperfect as it is, tells the same story about the heart."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.climate.heat_mortality") {
    const heatPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer whether India's heat deaths are really being counted, in the voice of someone who knows climate science and Indian public health cold. Start from the real hook: a study estimated about 3,400 excess deaths on a single nationally extreme heat day, the number went viral, and the honest question is whether it can be trusted. The through-line is that this is the wrong fight to pick over one number, because India cannot directly count heat's full mortality at all. So walk the evidence in order: the heat is real and rising and uneven across the map; it reaches the body through hot days, humid air and hot nights; who gets hit is decided by work, age, housing and cooling, not temperature alone; the official death counts are narrow and disagree because they measure different things; and a simple denominator check shows thousands is plausible without being proven. Land the verdict honestly: the exact number is uncertain, the undercount is near-certain, and the gap between how much heat India is exposed to and how little it counts is the actual story. This is a flagship reference page, so it must be the most complete and the most readable thing a layperson can find on Indian heat, while a researcher could trust every caveat. Never narrate the article itself (no 'this chart shows', 'as we saw above', 'the next section'); write about India, and let each chart sit beside the prose that discusses its subject.",
      requiredSections: heatPlanned.length
        ? heatPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "Is the heat behind the viral number even real?",
            "How does heat actually reach and harm the body?",
            "Who in India gets hit hardest?",
            "So how many people does heat kill?",
            "Why do the official counts and the model disagree?",
            "Is the 3,400 figure plausible?",
            "What can we honestly say, and what can't we?"
          ],
      requiredConcepts: [
        "A temperature anomaly is the gap from a 1991-2020 normal, not the absolute temperature, so a one-degree anomaly is a large shift across a whole year and country, and a national average is gentler than the local extremes that actually kill",
        "The difference between dry heat and humid heat: the body cools by sweating, and when humidity is high sweat cannot evaporate, so humid heat is far more dangerous than the thermometer alone suggests; the heat index combines temperature and humidity into a feels-like measure, and dangerous heat-index days rose from about 5 a year in the 1950s to about 14 by 2014",
        "Hot nights are a distinct killer: without a cool night the body never recovers from daytime heat, which is why night-time minimum temperature matters as much as the afternoon maximum",
        "Excess deaths means deaths above the number normally expected in that place and season; it is a modelled population estimate, not a list of death certificates, and it is a fundamentally different quantity from a reported, labelled heatstroke or heatwave death",
        "India's heat death numbers come from systems that measure different things and so cannot be ranked against each other: the Frontiers study models excess deaths for an extreme scenario (about 3,400 for one day, around 30,000 for a five-day heatwave); IMD's Disastrous Weather Events report counted 460 reported heatwave deaths in 2024 (led by Uttar Pradesh with 240), concentrated in May and June; NCRB logs a few hundred heat/sunstroke deaths under accidental deaths; NCDC surveillance counted a few hundred suspected or confirmed heatstroke deaths in a 2024 reporting window; OWID/EM-DAT records reported extreme-temperature disaster deaths internationally and is spiky and incomplete",
        "The broader burden beyond death certificates is large and measurable: the Lancet Countdown 2025 reports India faced about 19.8 heatwave days per person in 2024, of which roughly 6.6 days would not be expected without climate change, and about 247 billion potential labour hours were lost to heat exposure, with the bulk of those losses in agriculture and construction",
        "Heat exposure is decided largely at work, and India's job structure puts most workers in the heat with no way to stop: by the official labour survey (PLFS 2023-24) about 43.5% of workers are in agriculture (open fields) and another ~25% in industry (which includes open-air construction and brick kilns), while only ~32% are in mostly-indoor services; by job status about 58% are self-employed and ~20% casual labour, so only roughly 1 in 5 has a regular wage job, which means the vast majority have no paid leave and cannot afford to skip a dangerously hot day. Informality compounds this: about 98.6% of agricultural employment and 87% of all employment is informal, meaning no shade rules, no sick pay and no enforceable limit on working through heat. A national electricity-access figure near 100% is not the same as reliable power or an affordable cooling appliance",
        "Whether Indians can actually cool themselves is the heart of the vulnerability story, and the data is stark: NFHS-6 says 98.3% of people live in households with electricity (99.5% urban, 97.8% rural), NFHS-5 says 88.3% of households own an electric fan, and NFHS-5's combined AC/cooler category reaches 23.7% of households (39.5% urban, 15.8% rural). But the official MoSPI NSS 78 survey (2020-21), which separates the appliances, finds only 14.1% of Indian households own an air cooler and 4.9% own an air conditioner; AC ownership is 12.6% urban versus 1.2% rural. Air coolers cluster in the hot, dry north (Punjab, Haryana, Rajasthan, Delhi, Chandigarh all near or above 40-50%) while the humid south and east, where wet heat is most dangerous, own almost none. The remaining gap is that there is no good national series on cooling affordability or how reliably people can run what they own",
        "Heat kills through bodies that are already strained, so physiological vulnerability matters as much as exposure: by NFHS-5 (2019-21) about 67% of young children, 57% of women of reproductive age and 25% of men are anaemic, which lowers the body's tolerance of heat; high blood pressure, diabetes, and heart and kidney disease are widespread, and these are the conditions heat pushes over the edge. The deaths cluster in the already-sick, the very old and the very young, not in healthy adults",
        "Dehydration is a core route by which heat kills, and water access in India is uneven: a large share of households, especially rural ones, still do not have drinking water on the premises and must fetch it, a task that falls mainly on women and becomes dangerous in extreme heat; having a water source on paper is not the same as safe, sufficient water during a heatwave. Use this as supporting context, framed carefully, rather than a precise national death figure",
        "IMD's own reported heatwave deaths over 2013-2024 are the sharpest illustration that official counts are unreliable: over 2,000 in the catastrophic 2015 heatwave (Andhra Pradesh and Telangana) and exactly zero in 2021, then 460 in 2024. The killer insight is not that the count 'swings' but that India does not actually know its heat toll: the same agency recorded 2,000 one year and zero a few years later, because the official figure tracks attention and bookkeeping, not deaths. After 2015, Heat Action Plans genuinely saved lives, but the collapse to zero also reflects that no one was systematically counting, so the number can fall even as the heat rises. Lead with the 2,000-then-zero contrast; treat the official figure as a measure of how hard India is looking, not how many die",
        "The CEEW district Heat Risk Index (2025) carries one counterintuitive insight, lead with it: the deadliest heat is HUMID, not just hot. When CEEW folds heat, humidity, exposure and vulnerability into one index across 734 districts (IPCC framework), the highest-risk places are the humid south and coasts (Kerala, Goa, coastal Andhra Pradesh, all of Maharashtra near 100% of districts high-risk), NOT the dry record-breaking north, because wet heat stops the body cooling itself, so a humid 40C is deadlier than a dry 45C. 57% of districts, home to 76% of Indians, are high or very high risk, and the risk map is the near-inverse of the warming map. Caveat: it is a share-of-districts measure, so tiny states like Goa (2 districts) hit 100% easily; read the pattern, not the league table; and it is composite risk, not a death count",
        "The state vulnerability scatter combines CEEW heat risk, NSS cooling, NITI MPI and MCCD context. Read right as more districts high/very-high heat risk, up as more households without the conservative AC/cooler protection proxy, and bubble size as multidimensional poverty. It should be framed as 'where heat is hardest to survive', not as a death-risk model. The cooling proxy uses max(AC ownership, air-cooler ownership) by state to avoid double-counting households that may own both; explain that caveat plainly.",
        "CEEW's analysis also independently corroborates the hot-nights argument and can be cited for it: over the last decade (2012-2022 vs a 1982-2011 baseline) nearly 70% of Indian districts gained at least five additional very warm nights per summer, and very warm nights are now rising faster than very hot days, with Mumbai gaining about 15 extra warm nights per summer and Bengaluru about 11. This is an authoritative Indian source reinforcing why night-time heat, not just the afternoon peak, is the danger",
        "The World Bank CCKP scenario maps are the geographic version of the projection fan: three India maps of dangerous heat-index days by 2100 under low, middle and high emissions, on one shared colour scale. The story is the escalation and the choice, under high emissions much of the hot, humid plains and coasts spend up to ~200 days a year (more than half the year) in dangerous heat-index conditions by 2080-2099, while the low-emissions map is far lighter. Frame it as 'how bad it gets is still a choice', and note these are CMIP6 model projections, not forecasts, with Ladakh ungridded",
        "Poverty is the multiplier that turns heat into death, and India is a poor country: by NITI Aayog's National MPI 2023 (NFHS-5, 2019-21) about 15% of Indians are multidimensionally poor (deprived in housing, cooking fuel, assets, health), concentrated in the east and centre, Bihar ~34%, Jharkhand ~29%, Uttar Pradesh ~23%, Madhya Pradesh ~21%, versus Kerala 0.55% and Tamil Nadu 2.2%. This poverty belt overlaps the humid, crowded plains, so the people least able to afford cooling, decent housing or care are also among the most heat-exposed. For income poverty in rupee terms (the World Bank's lens, adjusted for India): by the World Bank about 24% of Indians live under $3.65 a day, roughly 300 rupees, and around a tenth under the old $1.90 line, roughly 150-160 rupees, at today's exchange rate (these are national figures; the WB does not publish them by state). The MAP itself is multidimensional poverty, the better vulnerability lens, but cite the rupee income figures to anchor that India is a poor country where most cannot buy their way out of the heat",
        "The denominator logic behind any excess-death estimate: India has about 1.45 billion people and a crude death rate near 6.6 per 1,000 a year, which works out to roughly 26,000 deaths a day regardless of weather, so a small temporary lift in that baseline across a large exposed population can plausibly reach four figures in a day; this makes the viral number plausible, not proven, and a real attribution would need daily all-cause deaths by district, age and season that India does not publish",
        "Be honest about the limits at every step: the CCKP exposure series is a model run that ends in 2014 and its later lines are projections; the warming map shows the Himalaya warming fastest in degrees while the deadliest heat is on the crowded, humid plains; city series are single points, not neighbourhood maps; and the sensitivity check is arithmetic for scale, not an epidemiological model"
      ],
      styleExample: [
        "## So can we trust the 3,400 figure?",
        "Not as a body count, and that is the wrong way to read it anyway. The number comes from a model that estimates how many more people die than usual when a severe heat day hits the whole country at once. It is not a tally of bodies labelled 'heatstroke'. To see why a four-figure number is not absurd, start somewhere unglamorous: India loses about 26,000 people every single day, heatwave or not, simply because it is a country of 1.45 billion. Now nudge that baseline up a little for the slice of people stuck outdoors, in tin-roofed rooms, or too old and ill to cope. A small lift across a huge exposed population becomes thousands of extra deaths in a day. That is the honest claim the arithmetic supports: thousands is plausible. It is not the same as proven, because nobody in India is counting daily deaths district by district to check."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.work.who_works_in_india") {
    const whoPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer who actually works in India, in the voice of someone who knows Indian labour economics and society cold and writes like a great essayist. This is a flagship companion to the separate 'How India Works' page, but it makes a DIFFERENT argument from a different source, so do not rehash macro/productivity material. The whole piece is built ONLY from the 2025 PLFS unit-level microdata (India's official labour survey, read one person at a time). The single through-line, stated plainly up front and carried through every section: there is no one Indian labour market. Whether you work at all, what kind of work you get, whether you are even paid for it, and what it pays are decided less by 'the economy' than by who you are (sex, schooling, caste, religion, marital status, age) and where you were born (state, village or city). The headline unemployment rate of about 3% is a near-useless number precisely because, in a country with almost no unemployment insurance, hardly anyone can afford to be openly jobless; the real story is the kind of work, not the absence of it. Re-cut the SAME workforce lens by lens, and let the divides accumulate toward the closing 'compounding' chart, where stacking disadvantages collapses the odds of a secure job from roughly two-in-five to almost nothing. Be scrupulously fair and humane: low female participation, high female NEET and women's unpaid family work are about how the economy and statistics are built, not about women 'not working'; low measured unemployment among the poorest and lowest castes is a sign they cannot afford to search, not that they are fine; high female participation in poorer states often reflects necessity, not liberation. Carry the argument forward section by section; never narrate the article itself (no 'this chart shows', 'as we saw above', 'the next section'); write about India and Indians, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: whoPlanned.length
        ? whoPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "If unemployment is only 3%, what is the problem?",
            "Does it matter whether you are a man or a woman?",
            "Why does more schooling mean more unemployment?",
            "Which caste you are born into decides what work you get?",
            "Where you are born changes a woman's odds of working?",
            "What kind of work do most Indians actually do?",
            "What does the work pay?",
            "What happens when you stack the disadvantages?"
          ],
      requiredConcepts: [
        "LFPR (labour force participation rate) is the share of working-age people (15+) who are working OR looking for work; WPR is the share actually working; UR (unemployment rate) is the share of the LABOUR FORCE that wants work but cannot find it, not a share of the whole population. A low UR can coexist with a real jobs problem.",
        "Usual status (PS+SS) is a person's main activity over the past year including subsidiary work; it is the lens used throughout this page. Counting subsidiary and unpaid family work is what lifts measured female participation, so 'a woman works' on this measure can mean unpaid help on the family farm, not a paid job of her own.",
        "Informal employment means work with no written contract, no social security and no paid leave; it is the default Indian working condition and exists even INSIDE formal-looking salaried jobs, which is why a payslip is not the same as a 'good job'.",
        "Self-employment in India is mostly survival, not entrepreneurship: an own-account farmer or a street vendor is 'self-employed', so the label flattens enormous differences in security and income.",
        "The education-unemployment paradox: unemployment RISES with schooling because the unlettered cannot afford to wait and take any work going (so they count as employed), while the educated can lean on family and hold out for the scarce salaried jobs their degree was for; joblessness here is a privilege of having options, not proof that education fails.",
        "NEET is the share of young people not in employment, education or training; female NEET is far higher than male mostly because unpaid domestic and care work is not counted as employment, so 'doing nothing' is a measurement artefact, not idleness.",
        "Caste shows up less in the unemployment rate (everyone poor cannot afford to search) and more in the KIND of work: the most precarious casual day-labour falls disproportionately on Dalits and Adivasis, while secure salaried jobs and higher pay concentrate among upper-caste workers.",
        "Female participation does not rise neatly with prosperity: some of the poorest, most agricultural states have the highest female participation (women working the land out of need), while rich, urban places can be among the lowest, and a wealthy, highly-educated state like Kerala sits only mid-table; read high participation as 'more women in some kind of work', not automatically 'a better deal for women'.",
        "A 'secure formal job' in the compounding chart means a regular salaried job that carries social security; the chart shows the share of each stacked-identity profile that holds one, which is why it falls so steeply.",
        "Household monthly consumption (MPCE) is used as a stand-in for living standards; informality is near-universal among the poorest households and still the majority even among the richest, so formality is a thin sliver at the top, not a middle-class norm.",
        "This page is a single 2025 cross-section, so it shows the STRUCTURE of who-gets-what, not a trend over time; do not describe anything as rising or falling unless the evidence packet contains more than one year."
      ],
      caveats: [
        "All figures are from PLFS 2025 unit-level microdata, usual status (PS+SS) for ages 15+, weighted by the survey multiplier; they are a single year, so this is structure, not trend.",
        "Measured female work depends heavily on counting unpaid family labour as employment; read female participation with that in mind.",
        "Caste and religion differences are correlates tangled with region, urbanisation and household income, not isolated causes; do not assert causation.",
        "Two senses of 'informal' appear: an all-worker informality rate (no social security or informal-sector enterprise) for the ~85% headline, and a social-security-based split for the formal-versus-informal salaried wage comparison.",
        "Self-employed and casual earnings are far noisier than salaried earnings, so wage comparisons centre on salaried medians; casual pay is a daily rate with no income on a day without work."
      ],
      styleExample: [
        "## Why are the people with degrees the ones without work?",
        "Start with a contradiction the chart puts right in front of you. A man who never finished school has an unemployment rate close to zero. A young graduate's is many times higher. Read that quickly and you might conclude that education in India is a trap. It is not. The unemployment rate only counts people who are looking for work and have not found it, and looking for work is a luxury. A landless labourer cannot spend three months holding out for the right job; there is no one to feed him while he waits, so he takes whatever pays today and is, by the survey's definition, employed. The graduate from a family that can carry him for a year does hold out, for the salaried, white-collar job his degree was meant to buy. India now produces those graduates in their millions and the jobs in far smaller numbers, so he waits, and the waiting is what the chart is counting. The cruelty is quiet: the degree did its job, the economy did not hold up its end."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.people.population") {
    const popPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer the whole of India's population story on one canonical page, in the voice of someone who knows demography cold and writes like a great essayist. This is THE flagship reference on Indian population, so it must be the most complete and most readable thing a layperson can find, while a demographer trusts every caveat. The single through-line, stated up front and carried through every act: India is the most populous country on earth and still growing, yet it has already tipped below the fertility level that replaces a generation, so today's growth is borrowed from the past (momentum) and will end within most readers' lifetimes, with the country growing old before it has grown rich. Walk it in order: (1) how many Indians there are and how that compares to China and the world; (2) whether the population is still growing and how fast; (3) why it is slowing, the long fall in fertility, now below replacement, uneven across states, and powered by contraception that falls overwhelmingly on women; (4) how the country is ageing, pyramid, age mix, median age, dependency; (5) the old-before-rich squeeze, ageing at a fraction of the income rich societies had; (6) where it is headed, the UN's median peak around 2061 near 1.70 billion then decline to about 1.51 billion by 2100, the scenario fan, and how the models disagree (IHME sees an earlier, far lower path); (7) the honest catch, that India has not run a census since 2011 so every current figure is an estimate and the 2027 count is under way. Deliberately triangulate five sources and say which does what: the World Bank for the long arc and the global comparison; the United Nations WPP 2024 for structure and the projection to 2100; India's own SRS 2024 for the most current fertility and birth rates with the rural-urban split; NFHS-6 for the state map and the contraception story; and IHME as the contrarian projection. Carry the argument forward act by act; never narrate the article itself (no 'this chart shows', 'as we saw above', 'the next section'); write about India and Indians, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: popPlanned.length
        ? popPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : ["How many Indians are there?", "Is the population still growing?", "Why is fertility falling?", "How fast is India ageing?", "Is India getting old before it gets rich?", "When does India's population peak?", "How sure can we be?"],
      requiredConcepts: [
        "The total fertility rate (TFR) is the average number of children a woman would have over her life at current birth rates; it is the clearest summary of how fast a population renews itself, and is not the same as the number of births in a year.",
        "Replacement-level fertility is about 2.1 children per woman, the level at which each generation exactly replaces itself (just above 2 to allow for children who do not survive to adulthood). Below 2.1 each generation is smaller. SRS 2024 puts national TFR at 1.9, with rural about 2.1 and urban just 1.5.",
        "Demographic momentum is why a country keeps growing for decades after fertility falls below replacement: a large generation born when fertility was high is still in its childbearing years, so total births stay high even as births per woman drop. A falling growth rate is not a falling population; the rate crossing zero is the peak.",
        "India became the world's most populous country around 2023, passing China; India and China are each roughly a sixth of humanity, so India is about 17-18% of all people alive.",
        "Falling fertility runs on contraception, and in India the burden is overwhelmingly on women: female sterilisation is the dominant method while male sterilisation is negligible, one of the widest such gaps in the world. Frame this as a fact about how family planning is delivered, not a judgment.",
        "Fertility is not uniform: it is below replacement across most of the south and west but still above it in a band of northern and central states (Bihar highest), so the national average hides a real geographic divide.",
        "Ageing: median age is the age splitting the population in half; the old-age dependency ratio is people 65+ per 100 of working age. Ageing is locked in years ahead by fertility, so once TFR is below replacement an older age structure is essentially baked in for decades, even though India is still young today.",
        "'Getting old before getting rich' means the elderly share rises while income per head is still low. India is ageing at a GDP per capita around 2,700 US dollars, a small fraction of the 20,000 to 40,000 dollars rich societies had when they aged, so it has a thinner cushion for pensions and care. GDP per capita is an average, not a typical income.",
        "Population projections fan out because the future depends mainly on fertility assumptions. The UN WPP 2024 median has India peaking around 2061 near 1.70 billion and easing to about 1.51 billion by 2100. Models disagree: IHME (Vollset 2020) assumes faster fertility decline and sees an earlier peak (about 2048, ~1.61 billion) and a far deeper fall to about 1.09 billion by 2100, while the US Census and Wittgenstein models sit closer to the UN. The peak is a direction everyone agrees on; its exact timing and depth are uncertain.",
        "Every current India population figure is an estimate, not a count: the last census was in 2011 and the next is under way, with enumeration in 2027, so all 2024-25 numbers, including these, are projections off the 2011 base, triangulated from surveys (SRS, NFHS) and global models (UN, World Bank).",
        "The sources are different instruments that agree on direction and differ slightly in level: World Bank and UN are partly modelled global series; SRS is India's official large sample survey of vital rates; NFHS is a household survey; IHME is a modelled forecast. Name each plainly and never call a global modelled series an Indian official source.",
        "Age-specific fertility rate shows the age pattern of childbearing, births per 1,000 women in each age band; in India it peaks sharply at ages 25-29, with little teenage or over-40 childbearing, so the average woman now compresses her births into a few years in her twenties.",
        "Sex ratio at birth is the number of girls born per 1,000 boys; an undistorted natural ratio is a little under 1,000 girls per 1,000 boys, and India sits below it because of son preference and past sex-selective practices, so girls are 'missing' at birth. The ratio has improved recently and is higher in towns than villages. State the number plainly and do not moralise.",
        "Birth order is how many children a mother has had; the rising share of first and second births and the shrinking share of fourth-and-higher births is the household-level signature of smaller families.",
        "Child marriage (women 20-24 married before 18) and teenage motherhood (15-19s already mothers or pregnant) raise fertility at the margins and concentrate in poorer, rural states; both have fallen but remain significant.",
        "Urbanisation matters because urban fertility is far below rural; India is still mostly rural and urbanising slowly, so the rural-urban balance shapes how fast national fertility falls.",
        "Life expectancy at birth is the average years a newborn would live at current death rates; rising life expectancy is the second engine of ageing alongside falling fertility, adding people to the older end of the age structure.",
        "Women are having children later: the mean age at childbearing has risen steadily, which both reflects more schooling and paid work and itself pushes fertility down as the childbearing years compress. Treat the rising-mean-age line as the 'delaying' signal.",
        "Fertility falls steeply with a woman's schooling and her household's wealth: NFHS-5 (2019-21) shows about 2.8 children for women with no schooling versus 1.8 for 12-plus years, and about 2.6 in the poorest fifth versus 1.6 in the richest. Education and wealth overlap and point the same way, so present them as one underlying shift, not two independent causes. These cuts are from NFHS-5 because the NFHS-6 factsheets do not carry them.",
        "Fertility differs by religion and this is widely misread, so state it plainly and fairly: by NFHS-5, Muslim fertility is highest (about 2.4) and Hindu about 1.9, with Buddhist, Jain and Sikh lowest (about 1.4-1.6). The essential, non-negotiable context is that every group's fertility has fallen sharply over recent decades, the Muslim rate has fallen the fastest, and the gaps between groups are narrowing toward convergence, not widening. Report the numbers without moralising and without implying any group threatens demographic 'takeover'; the data shows convergence."
      ],
      styleExample: [
        "## Is India still growing, or has it already peaked?",
        "It is still growing, and it is now the most populous country on earth, but the engine is quietly running down. India adds about thirteen million people a year, a large city every year, and yet the average woman now has fewer than two children, below the level that replaces her own generation. So why does the total keep climbing? Because India is young. The huge generation born when families were larger is still in its twenties and thirties, still having children, and that sheer number of parents keeps births high even as births per parent fall. Demographers call it momentum. It is why a population, like a train with the power cut, keeps moving long after the decision to slow down was made. The line is still rising. The date it stops is now a question of decades, not centuries."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.people.growth") {
    const growthPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer whether India's population is still growing, in the voice of someone who knows demography cold and writes like a great essayist. The honest answer is a paradox a reader can hold in one hand: yes, India is still adding people and is now the most populous country on earth, AND its fertility has already fallen below the level that replaces a generation, so the growth is running on momentum and will not last forever. Deliberately triangulate three sources, because each carries something the others cannot: the World Bank gives the long arc back to 1960, the headline count (about 1.45 billion in 2024) and the growth rate (about 0.9% a year); the United Nations gives the population structure and the near-term projection; and India's own Sample Registration System (SRS 2024, released 2026) gives the most current, official fertility reading and the rural-urban split a global modelled series cannot. The through-line: a falling growth RATE is not a falling population; below-replacement fertility does not mean immediate decline, because a large young generation still in its childbearing years keeps births high for a generation (demographic momentum); and the rural-urban gap (rural about 2.1, urban about 1.5) is where the future is being decided. Be honest that the World Bank, UN and SRS are different instruments that agree on direction but differ slightly in level, and that none rests on a fresh census, because India has not counted itself since 2011. Carry the argument forward section by section; never narrate the article itself (no 'this chart shows', 'as we saw above'); write about India and Indians, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: growthPlanned.length
        ? growthPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : ["Is India's population still growing?", "How fast is it still rising?", "What is driving the slowdown?", "Has fertility really dropped below replacement?", "When does India stop growing?"],
      requiredConcepts: [
        "The total fertility rate (TFR) is the average number of children a woman would have over her life at current birth rates; it is the single best summary of how fast a population renews itself, and is not the same as the number of births in a year.",
        "Replacement-level fertility is about 2.1 children per woman: the level at which each generation exactly replaces itself, set slightly above 2 to allow for children who do not survive to adulthood. Below 2.1 each generation is smaller than the last. India's SRS 2024 puts national TFR at 1.9, below replacement, with rural women at about 2.1 and urban women at about 1.5.",
        "Demographic momentum is why a country keeps growing for decades after fertility falls below replacement: a large generation born when fertility was high is still entering its childbearing years, so the number of births stays high even though births per woman have dropped. Growth slows long before it stops.",
        "A falling population GROWTH RATE is not a falling population: as long as the rate is positive (about 0.9% a year in 2024) the total still rises each year; the rate approaching zero is what eventually produces a peak.",
        "Three sources, three jobs: the World Bank gives the long historical arc and the headline count; the United Nations gives population structure and projections; India's own SRS gives the most current, official, rural-urban fertility reading. They agree on direction and differ slightly in level, which is normal for a modelled global series versus a national sample survey.",
        "Every current India population number is an estimate, not a count: India's last census was in 2011 and the next is under way (enumeration in 2027), so all 2024-25 figures, including these, are projections off the 2011 base.",
        "Projection scenarios fan out because the future depends on assumptions, mainly about fertility; near-term scenarios sit close together and only diverge sharply later in the century, which is why an eventual peak is visible in direction even though a near-term one is not."
      ],
      styleExample: [
        "## Is India's population still growing, or has it peaked?",
        "It is still growing, and it is now the most populous country on earth, but the engine is quietly running down. Look at the long line: India added people fast for fifty years and still adds them today, about 0.9% more in 2024, roughly thirteen million people, a large city's worth every year. Yet the same data carries the seed of the end. The average woman now has fewer than two children, below the level needed to replace her own generation. So why does the total keep climbing? Because India is young. The huge generation born when families were larger is still in its twenties and thirties, still having children, and that sheer number of parents keeps births high even as births per parent fall. Demographers call this momentum. It is why a population, like a train with the power cut, keeps moving long after the decision to slow down was made."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.people.old_before_rich") {
    const oldPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer whether India is getting old before it gets rich, in the voice of someone who knows development economics and demography cold. The honest answer is yes, and the page should make a reader feel the squeeze: India's population is ageing while it is still poor, the reverse of how today's rich countries did it. Triangulate three sources, each doing a job the others cannot: India's own SRS 2024 gives the most current fertility reading (national TFR 1.9, already below replacement) that explains WHY ageing is now locked in; the World Bank gives the long arc of the older share (about 7% aged 65 and over in 2024) and the income level (GDP per head about 2,700 US dollars in 2024); and the United Nations gives the age structure, the median age, and the old-age dependency ratio that show how fast the burden will rise. The through-line: ageing is decided years in advance by fertility, and India's has already fallen below replacement, so the older share will climb steeply from here; but India is reaching this point at a small fraction of the income per head that rich societies had when they aged, so it must grow old on a thin cushion of savings, pensions and health systems. Be careful and fair: this is a slow-moving structural fact, not a crisis tomorrow; India still has a young median age and a working-age bulge (the demographic dividend) that has not yet closed; frame the policy stakes such as pensions and elder care as questions the data raises, not predictions. Never narrate the article itself; write about India and Indians, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: oldPlanned.length
        ? oldPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : ["Is India getting old before it gets rich?", "How heavy is the dependency burden becoming?", "How rich is India as it ages?", "How old is India now?", "What is driving the ageing?"],
      requiredConcepts: [
        "'Getting old before getting rich' means a country's population starts ageing, a rising share of elderly, while its income per person is still low. Today's rich countries grew rich first and aged later, at high incomes; India is ageing at a much lower income per head, so it has a thinner financial cushion for pensions and elder care.",
        "The old-age dependency ratio is the number of people aged 65 and over for every 100 people of working age (15-64); it captures how many older people each working-age adult must in effect help support through families, taxes and pensions. India's is low now but the UN data shows it edging up and set to rise far faster later.",
        "GDP per capita is total output divided by population, used here as a rough stand-in for how rich the average Indian is, about 2,700 US dollars in 2024. It is an average, not a typical income, and it is a small fraction of the 20,000 to 40,000 dollars per head that countries like Japan or those in western Europe had reached when their populations began to age.",
        "Median age is the age that splits the population into two equal halves; a rising median is the simplest sign of ageing. India's is still young by world standards, which is why the squeeze is a slow build rather than an immediate emergency.",
        "Ageing is locked in years in advance by fertility: once the total fertility rate falls below the replacement level of about 2.1, smaller generations are already born, so an older age structure is essentially baked in for decades. India's SRS 2024 TFR of 1.9 (urban 1.5, rural 2.1) is the engine underneath the rising elderly share.",
        "The demographic dividend is the window when the working-age share is high and both child and old-age dependency are low, which can lift growth; it has not closed for India yet, but below-replacement fertility means it will, and the old-before-rich question is whether incomes rise fast enough before it does.",
        "Three sources, three jobs: SRS 2024 supplies the current, official fertility reading that drives ageing; the World Bank supplies the long arc of the elderly share and the income level; the United Nations supplies the age structure, median age and dependency ratios. They are different instruments that agree on the direction of travel."
      ],
      styleExample: [
        "## Is India getting old before it gets rich?",
        "Yes, and that order is the whole problem. Every society ages as it develops; the question is how much money is in the bank when it happens. Japan and Germany grew wealthy first and turned grey later, with tens of thousands of dollars of income per person to pay for pensions and hospitals. India is reaching into old age far earlier in its climb, on an income per head of roughly 2,700 dollars a year. The elderly share is still small, but it is rising, and the reason it will keep rising is already settled: the average Indian woman now has fewer than two children, below the level that replaces a generation. Smaller generations are already born. So the country will grow older on a thin cushion, and the real race is whether incomes can rise fast enough to thicken it before the working-age bulge that pays for everything begins to shrink."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.env.water_stress") {
    const waterPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how severe India's water stress really is, in the voice of someone who knows Indian water resources and development cold and writes like a great essayist. This is a canonical flagship reference page: it must be the most complete and most readable thing a layperson can find, while a hydrologist could trust every caveat. The single through-line, stated up front and carried through every act: India's water crisis is mostly invisible because it is underground, and mostly agricultural, not domestic; the calm national averages hide a concentrated north-west emergency; quantity and quality are separate problems; and access to water in the home is improving even as the resource beneath it is mined. Walk it in order: (1) how little water there is per person and how that has fallen; (2) how much of the resource can actually be used; (3) groundwater, where the real crisis lives, the national stage of extraction that looks safe at ~60%, the breakdown of assessment units, and the map and trend that reveal Punjab, Rajasthan and Haryana pumping far more than recharges; (4) where the water goes, the ~90% that agriculture takes and how little value India earns per drop; (5) quality, the contamination that makes even existing water unsafe; (6) access, the Jal Jeevan tap-water surge set against the depleting source. India is the world's largest groundwater user (about 245 BCM a year, roughly a quarter of all groundwater pumped on earth, more than the US and China combined). Be SCRUPULOUSLY rigorous about contested and misquoted claims, because debunking them is part of this page's job: the viral 'NITI Aayog said 21 cities will run out of groundwater by 2020' was a hedged, since-failed projection that never named the cities; Chennai's 2019 'Day Zero' was a real local crisis but a media label, not proof of uniform national stress; and the popular 'India is one of 17 most water-stressed countries' is the old 2019 WRI figure (now 25 countries). Where the data is genuinely mixed, say so, the decadal well-level record is contested, with some CGWB data showing many Punjab wells rising even as extraction stays catastrophic, so the depletion case rests on stage-of-extraction, not on cherry-picked falling wells. Be careful with causation and never imply a single villain. Never narrate the article itself (no 'this chart shows', 'as we saw above', 'the next section'); write about India and its water. Never use em-dashes.",
      requiredSections: waterPlanned.length
        ? waterPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : ["How much water does each Indian have?", "How much of it can be used?", "How hard is India pumping its groundwater?", "Where is the groundwater crisis worst?", "Where does the water actually go?", "Is the water that remains safe?", "Is access improving even as the resource shrinks?"],
      requiredConcepts: [
        "Stage of groundwater extraction: annual groundwater extraction divided by the annual extractable (replenishable) resource, as a percentage; below 100% the aquifer is refilling at least as fast as it is pumped, above 100% it is being mined and cannot last; this is the single most important number on the page",
        "Assessment units and their categories: CGWB divides India into thousands of small units (blocks, mandals, talukas) and rates each Safe, Semi-Critical, Critical, Over-Exploited or Saline based on its stage of extraction; 'Over-Exploited' means extraction exceeds recharge",
        "Recharge vs extractable resource vs extraction: annual recharge is the water nature returns to the aquifer each year, the extractable resource is the share of that which can be drawn, and extraction is what is actually pumped; the stage of extraction is the last divided by the second",
        "Per-capita water availability and the Falkenmark thresholds: total renewable water divided by population, in cubic metres per person per year; below 1,700 is 'water-stressed' and below 1,000 is 'water-scarce'; a falling figure is driven as much by a growing population as by less water",
        "Total resource vs utilizable water: most of India's average annual water resource cannot be captured and used; only the utilizable share (surface water that can be stored plus replenishable groundwater) is available supply, so the two must never be conflated",
        "Freshwater withdrawal by sector is the split of water use between agriculture, industry and households; for India it is a snapshot carried forward by FAO AQUASTAT, not an annual trend, so read it as 'latest available'",
        "Water productivity: economic output (GDP) per cubic metre of freshwater withdrawn; a low figure means water flows to low-value, thirsty uses, and a rising figure can simply reflect an economy shifting toward services rather than farms using water better",
        "Safely managed drinking water (WHO/UNICEF JMP) means water on premises, available when needed and free of contamination; it measures the service delivered to homes, not whether the underlying aquifer is sustainable, so access can rise while the resource falls",
        "Jal Jeevan Mission tap coverage is self-reported 'connections provided', not independently audited as functional; the CAG has flagged gaps between connections counted and taps that actually deliver water, so treat the figure as reported coverage, not guaranteed delivery",
        "Groundwater contamination shares are the percentage of tested sites exceeding a safe limit for nitrate, fluoride, arsenic or uranium; these cluster in known problem areas and 'parts of' a district means contamination is localised within it, not district-wide",
        "Why the national average misleads: a country-wide stage of extraction near 60% looks safe only because most of India is fine; it averages together the calm east and south with a north-west grain belt pumping well over 100%, so the average hides rather than reveals the crisis"
      ],
      styleExample: [
        "## So is India running out of water?",
        "Not the way the headlines say, and not where you would look. The dramatic stories are about cities queuing for tankers, but the real drain is silent and underground, on farms. India pumps about 245 billion cubic metres of groundwater a year, roughly a quarter of all the groundwater drawn anywhere on earth and more than the United States and China combined, and close to nine in ten of those litres go to irrigation. Nationally that still adds up to using only about 60 percent of what the rains put back, which sounds comfortable. The trouble is that an average is a blanket thrown over very different places: in Punjab the figure is past 150 percent, meaning the state takes half again more water than nature returns, year after year. The aquifer is not a tap that suddenly runs dry; it is a savings account being slowly emptied."
      ].join("\n\n")
    };
  }

  // When the question has a curated visual plan, the article must have exactly one
  // reader-question section per planned chart, in order, each tied to its chart.
  // Otherwise fall back to the generic six-section shape.
  const planned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
  const requiredSections = planned.length
    ? planned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
    : [
        "What is the headline answer?",
        "What exactly is being measured?",
        "How should a normal reader read the chart?",
        "What comparison or breakdown changes the meaning?",
        "What does the number not tell us?",
        "What should the reader remember?"
      ];
  return {
    purpose: "Answer the page question fully, not just describe the charts.",
    requiredSections,
    requiredConcepts: [
      "Define the indicator in plain English",
      "Explain the unit and denominator",
      "Explain the main chart",
      "Explain the most important supporting chart",
      "State the most important caveat"
    ],
    styleExample: [
      "## What exactly is being measured?",
      "Start with the plain meaning. Then explain the unit. Then use the locked number. Do not make the reader infer the concept from the chart."
    ].join("\n\n")
  };
}

function planPrompt(evidence) {
  const template = articleTemplateFor(evidence);
  return [
    "Create an editorial plan before writing.",
    "Return exactly one JSON object. Do not write the article yet.",
    "The plan must use the supplied template unless evidence is missing.",
    stableJson({
      questionId: evidence.questionId,
      answerThesis: "one-sentence answer to the page question",
      requiredConcepts: template.requiredConcepts,
      sectionPlan: template.requiredSections.map((heading) => ({
        heading,
        job: "what this section must teach",
        lockedNumbersToUse: ["labels from lockedNumbers only"],
        conceptsToExplain: ["plain-English concepts"],
        caveat: "specific caveat or empty string"
      })),
      chartPlan: [
        {
          visualId: "visualPlan visualId",
          title: "plain title",
          whyShowThis: "why it belongs",
          howToRead: "how to read it",
          mistakeToAvoid: "common misread"
        }
      ],
      dataSelectionAudit: {
        areSelectedDataPointsGood: "yes/no/mixed, with one concrete reason",
        addDataPoints: ["specific indicators needed, or empty array"],
        removeDataPoints: ["specific selected indicators that distract, or empty array"],
        visualizationDecisions: [
          {
            indicatorOrVisual: "indicator id or visual title",
            bestChartType: "line | grouped bars | stacked bars | share strip | pyramid | scatter | small multiples | latest cards",
            timeWindow: "full history | last 10 years | latest point | projection window | other",
            frequency: "annual | quarterly | monthly | daily/latest snapshot",
            reason: "why this duration/frequency is right for a phone reader"
          }
        ]
      },
      glossaryPlan: [
        {
          term: "term",
          plainMeaning: "short explanation",
          whyItMattersHere: "tie to question"
        }
      ],
      proseRules: [
        "No AI tells",
        "No outside facts",
        "No calculations unless the evidence packet supplies the derived number",
        "Question-led H2 sections"
      ]
    }),
    "Template:",
    stableJson(template),
    "Evidence packet:",
    stableJson(evidence)
  ].join("\n\n");
}

function userPrompt(evidence) {
  const template = articleTemplateFor(evidence);
  return [
    "Write the explanation for this question.",
    "Return exactly one JSON object with this shape:",
    stableJson({
      schemaVersion: 1,
      questionId: evidence.questionId,
      status: "ready | needs_data",
      short: {
        headline: "string, <= 90 characters",
        dek: "string, <= 180 characters",
        body: "string, 90-150 words"
      },
      macha: {
        heading: "a playful, slightly cheeky heading in Indian-English voice, e.g. 'Okay, but what does this actually mean, macha?'",
        body: "4-6 warm, grounded sentences telling a normal Indian reader, in plain words, what this whole page of data actually means for the country and for them. No jargon, no statistics-speak. Friendly and smart, never snarky or comedic.",
        soWhat: "one punchy line: the single thing to remember"
      },
      article: {
        title: "string",
        standfirst: "string, <= 260 characters",
        bodyMarkdown: "string; one H2 question section per planned chart in plannedCharts order; aim for the full length the evidence supports (roughly 1100-1700 words for rich multi-chart pages)"
      },
      editorialPlan: {
        audience: "average Indian reader",
        heroDescription: "2-3 sentence description of what the data is about",
        selectedDataPoints: [
          {
            label: "string from selectedDataPoints or lockedNumbers",
            reason: "why this number deserves attention",
            use: "hero | chart | pull_quote | caveat | glossary"
          }
        ],
        pullQuotes: [
          {
            quote: "short, sharp, evidence-backed sentence",
            numberLabel: "supporting locked number label"
          }
        ],
        glossaryBlocks: [
          {
            term: "GDP | CPI | fertility | dependency ratio | per capita | AQI | TWh | other evidence term",
            plainMeaning: "4-6 sentences for someone with zero economics or statistics background. Open with an everyday analogy or concrete example, then define the idea, say exactly what it counts, and warn what it does NOT mean. Warm, plain, vivid.",
            whyItMattersHere: "2-3 sentences tying it directly to this page's question and the charts on it"
          }
        ]
      },
      dataSelectionAudit: {
        areSelectedDataPointsGood: "yes/no/mixed, with one concrete reason",
        addDataPoints: ["specific indicators needed, or empty array"],
        removeDataPoints: ["specific selected indicators that distract, or empty array"],
        visualizationDecisions: [
          {
            indicatorOrVisual: "indicator id or visual title",
            bestChartType: "line | grouped bars | stacked bars | share strip | pyramid | scatter | small multiples | latest cards",
            timeWindow: "full history | last 10 years | latest point | projection window | other",
            frequency: "annual | quarterly | monthly | daily/latest snapshot",
            reason: "why this duration/frequency is right for a phone reader"
          }
        ]
      },
      chartExplainers: [
        {
          visualId: "the matching plannedCharts chartId",
          title: "reader-facing chart title (exact plannedCharts title)",
          takeaway: "one sharp sentence: the single point of this chart, naming the key number",
          detail: "4-7 descriptive sentences in plain language: what the chart shows, the key numbers and trend, what is driving it (where evidence supports), and what it means for the reader. Vivid and concrete, no jargon. This should genuinely help a layperson understand the chart.",
          whyShowThis: "why this visual belongs on the page",
          howToRead: "one short, concrete line on how to read the axes/shape",
          mistakeToAvoid: "one common misreading to avoid",
          mobileNote: "how to keep it readable on phones"
        }
      ],
      sectionVisualMap: [
        {
          heading: "exact text of an H2 question heading from article.bodyMarkdown",
          visualId: "the visualPlan visualId whose chart belongs beside that section"
        }
      ],
      sourceNotes: ["short source note strings"],
      caveats: ["specific caveats"],
      lockedNumbersUsed: ["labels of locked numbers used"],
      qualityFlags: ["specific issues or empty array"]
    }),
    "Article template and style target:",
    stableJson(template),
    "Evidence packet:",
    stableJson(evidence)
  ].join("\n\n");
}

function draftPrompt(evidence, plan) {
  const template = articleTemplateFor(evidence);
  return [
    "Write the article from this approved plan.",
    "Return exactly the final explanation JSON object, using the schema below.",
    "Follow the plan section-by-section. Do not skip concept teaching.",
    "Use the style example for rhythm only; do not copy facts unless present in evidence.",
    userPrompt(evidence),
    "Approved editorial plan:",
    stableJson(plan),
    "Style example:",
    template.styleExample
  ].join("\n\n");
}

function editPrompt(evidence, plan, draft) {
  const template = articleTemplateFor(evidence);
  const lintFindings = lintExplanation(draft);
  return [
    "You are the final editor. Rewrite the draft JSON into a stronger final JSON.",
    "Return only the final JSON object. Preserve the schema.",
    "Checklist:",
    "- Does it answer the page question fully?",
    "- Does EACH section actually answer its heading question with the reason or mechanism, not just describe the chart's shape? If a section only describes, rewrite it to answer. A 'why' heading must explain why.",
    "- Is each section a substantial 120-200 words? Expand thin sections with real explanation (never filler).",
    "- Does it define every required concept in plain English?",
    "- Does it explain what the indicator tells us and what it does not?",
    "- Are chart explainers specific and useful?",
    "- Does the dataSelectionAudit say what to keep, add, remove, and how each key visual should be charted by duration and frequency?",
    "- Is the prose clean Indian English with no AI tells?",
    "- Are all numbers from lockedNumbers or selectedDataPoints?",
    "- Are there no unsupported rankings, comparisons, causes, predictions, or outside facts?",
    "If a required concept is missing from evidence, mention the caveat instead of inventing data.",
    "Automated prose lint of the draft (fix each one, do not change locked numeric values, only how they are written):",
    findingsToInstruction(lintFindings),
    "Required template:",
    stableJson(template),
    "Approved plan:",
    stableJson(plan),
    "Evidence packet:",
    stableJson(evidence),
    "Draft JSON:",
    stableJson(draft)
  ].join("\n\n");
}

function normalizeCompletion(json) {
  if (json?.outputSchema && typeof json.outputSchema === "object") return json.outputSchema;
  return json;
}

function validateExplanation(document, questionId) {
  const missing = [];
  for (const key of ["schemaVersion", "questionId", "status", "short", "article", "sourceNotes", "caveats", "lockedNumbersUsed", "qualityFlags"]) {
    if (document[key] === undefined) missing.push(key);
  }
  if (document.status === "ready" && !Array.isArray(document.chartExplainers)) missing.push("chartExplainers");
  if (document.status === "ready" && !document.editorialPlan) missing.push("editorialPlan");
  if (document.questionId !== questionId) missing.push("matching questionId");
  if (!document.short?.body) missing.push("short.body");
  if (!document.article?.bodyMarkdown) missing.push("article.bodyMarkdown");
  if (missing.length) throw new Error(`Explanation ${questionId} is missing ${missing.join(", ")}`);
  const article = String(document.article?.bodyMarkdown || "").toLowerCase();
  const requiredConcepts = {
    "q.econ.size": ["gdp", "nominal", "real gdp", "per capita", "gva", "taxes", "subsidies", "imports", "exports", "does not"]
  }[questionId] || [];
  const absent = requiredConcepts.filter((term) => !article.includes(term));
  if (absent.length) throw new Error(`Explanation ${questionId} is missing required concept(s): ${absent.join(", ")}`);
}

function sanitizeText(text) {
  return String(text)
    .replace(/\bit is important to note that\b/gi, "the caveat is that")
    .replace(/\bit is important to note\b/gi, "the caveat matters")
    .replace(/\bcrucially\b/gi, "importantly")
    .replace(/\bcrucial\b/gi, "important")
    .replace(/\bdelve\b/gi, "examine")
    .replace(/\btapestry\b/gi, "pattern")
    .replace(/\bcomplex interplay\b/gi, "relationship")
    .replace(/\bin conclusion\b/gi, "overall")
    // Em-dash is a strong AI tell; replace with a comma. (En-dash, used in age
    // ranges like 0–14, is intentionally left alone.)
    .replace(/\s*—\s*/g, ", ");
}

function sanitizeExplanation(document) {
  const copy = structuredClone(document);
  if (copy.short) {
    copy.short.headline = sanitizeText(copy.short.headline || "");
    copy.short.dek = sanitizeText(copy.short.dek || "");
    copy.short.body = sanitizeText(copy.short.body || "");
  }
  if (copy.article) {
    copy.article.title = sanitizeText(copy.article.title || "");
    copy.article.standfirst = sanitizeText(copy.article.standfirst || "");
    copy.article.bodyMarkdown = sanitizeText(copy.article.bodyMarkdown || "");
  }
  return copy;
}

function plannedIndicatorIdsFor(question) {
  const ids = new Set([
    ...coreIndicatorIdsForGeneration(question),
    ...(Array.isArray(question.context) ? question.context : [])
  ]);
  for (const entry of question.visualPlan || []) {
    if (entry.indicator) ids.add(entry.indicator);
    for (const item of entry.series || []) if (item.indicator) ids.add(item.indicator);
  }
  return ids;
}

function coreIndicatorIdsForGeneration(question) {
  return Array.isArray(question.core) && question.core.length
    ? question.core
    : Array.isArray(question.indicators)
      ? question.indicators
      : [];
}

function compactEvidenceForGeneration(evidence, question) {
  const relevant = plannedIndicatorIdsFor(question);
  const keepByIndicator = (item) => !item?.indicatorId || relevant.has(item.indicatorId);
  const compact = {
    ...evidence,
    themeIndicatorIds: (evidence.themeIndicatorIds || []).filter((id) => relevant.has(id)),
    visualPlan: (evidence.visualPlan || []).filter(keepByIndicator),
    selectedDataPoints: (evidence.selectedDataPoints || []).filter(keepByIndicator).slice(0, 80),
    lockedNumbers: (evidence.lockedNumbers || []).filter(keepByIndicator).slice(0, 120),
    sourceSummaries: (evidence.sourceSummaries || []).filter(keepByIndicator)
  };
  compact.generationNote = [
    "This is a compact retry packet after an oversized generation failed.",
    "It is scoped to the curated plannedCharts and their source indicators.",
    "Write every planned chart section and chartExplainer, but keep each section tight."
  ];
  return compact;
}

async function loadArtifacts() {
  const files = await listJsonFiles("data/series");
  const artifacts = [];
  for (const file of files) {
    const artifact = await readJson(file);
    artifacts.push({ ...artifact, path: file });
  }
  return artifacts;
}

async function createSinglePassExplanation(evidence, question) {
  try {
    const completion = await createDeepSeekJsonCompletion({
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(evidence) }
      ],
      maxTokens: Number(process.env.INDICA_EXPLANATION_MAX_TOKENS || 16000),
      jsonRetries: Number(process.env.INDICA_EXPLANATION_JSON_RETRIES || 2)
    });
    return {
      document: sanitizeExplanation(normalizeCompletion(completion.json)),
      model: completion.payload.model,
      passes: [{ name: "single", model: completion.payload.model }]
    };
  } catch (error) {
    const compactEvidence = compactEvidenceForGeneration(evidence, question);
    console.warn(`single-pass generation failed for ${evidence.questionId}; retrying with compact evidence: ${error.message}`);
    const completion = await createDeepSeekJsonCompletion({
      messages: [
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content: [
            userPrompt(compactEvidence),
            "Compact retry instruction:",
            "Keep each H2 section to 80-130 words and each chart detail to 3-5 sentences so the JSON finishes cleanly.",
            "Still include every plannedCharts entry in chartExplainers and sectionVisualMap."
          ].join("\n\n")
        }
      ],
      maxTokens: Number(process.env.INDICA_EXPLANATION_COMPACT_MAX_TOKENS || 16000),
      temperature: 0.25,
      jsonRetries: Number(process.env.INDICA_EXPLANATION_JSON_RETRIES || 2)
    });
    return {
      document: sanitizeExplanation(normalizeCompletion(completion.json)),
      model: completion.payload.model,
      passes: [
        { name: "single", model: "failed" },
        { name: "single-compact-retry", model: completion.payload.model }
      ]
    };
  }
}

async function createMultiPassExplanation(evidence, question) {
  const generationEvidence = compactEvidenceForGeneration(evidence, question);
  const planCompletion = await createDeepSeekJsonCompletion({
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: planPrompt(generationEvidence) }
    ],
    maxTokens: Number(process.env.INDICA_PLAN_MAX_TOKENS || 8000),
    temperature: 0.2
  });
  const plan = normalizeCompletion(planCompletion.json);

  const draftCompletion = await createDeepSeekJsonCompletion({
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: draftPrompt(generationEvidence, plan) }
    ],
    maxTokens: Number(process.env.INDICA_EXPLANATION_MAX_TOKENS || 16000),
    temperature: 0.32
  });
  const draft = sanitizeExplanation(normalizeCompletion(draftCompletion.json));

  const editCompletion = await createDeepSeekJsonCompletion({
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: editPrompt(generationEvidence, plan, draft) }
    ],
    maxTokens: Number(process.env.INDICA_EDIT_MAX_TOKENS || 16000),
    temperature: 0.18
  });

  const edited = sanitizeExplanation(normalizeCompletion(editCompletion.json));
  const document = {
    ...draft,
    ...edited,
    short: edited.short || draft.short,
    article: edited.article || draft.article,
    editorialPlan: edited.editorialPlan || draft.editorialPlan,
    chartExplainers: edited.chartExplainers || draft.chartExplainers,
    sourceNotes: edited.sourceNotes || draft.sourceNotes,
    caveats: edited.caveats || draft.caveats,
    lockedNumbersUsed: edited.lockedNumbersUsed || draft.lockedNumbersUsed,
    qualityFlags: edited.qualityFlags || draft.qualityFlags || []
  };

  return {
    document,
    model: editCompletion.payload.model,
    passes: [
      { name: "plan", model: planCompletion.payload.model },
      { name: "draft", model: draftCompletion.payload.model },
      { name: "edit", model: editCompletion.payload.model }
    ],
    plan
  };
}

const args = parseArgs(process.argv.slice(2));
const artifacts = await loadArtifacts();
const questions = v1Questions
  .filter((question) => !args.questions || args.questions.has(question.id))
  .slice(0, args.limit);

await mkdir("data/explanations/en", { recursive: true });

for (const question of questions) {
  const evidence = buildEvidencePacket({ question, artifacts });
  const outputPath = `data/explanations/en/${question.id}.json`;

  if (args.dryRun) {
    await writeFile(outputPath.replace(/\.json$/, ".evidence.json"), `${stableJson(evidence)}\n`);
    console.log(`dry-run evidence ${question.id}: ${evidence.themeIndicatorIds.length} selected artifact(s), ${evidence.lockedNumbers.length} locked number(s)`);
    continue;
  }

  const generatedResult = args.singlePass
    ? await createSinglePassExplanation(evidence, question)
    : await createMultiPassExplanation(evidence, question);
  const generated = generatedResult.document;
  validateExplanation(generated, question.id);
  const document = {
    ...generated,
    generatedAt: new Date().toISOString(),
    model: generatedResult.model,
    generationPasses: generatedResult.passes,
    editorialPlanDraft: generatedResult.plan,
    evidence
  };
  await writeFile(outputPath, `${stableJson(document)}\n`);
  console.log(`wrote explanation ${question.id}`);
}
