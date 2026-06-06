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
    "Write 4-6 glossaryBlocks teaching the real concepts a reader needs here (e.g. fertility rate, dependency ratio, median age, life expectancy, demographic dividend). Assume zero economics or statistics background. Each plainMeaning opens with an everyday analogy or concrete example, then defines the idea simply, says what it counts, and warns what it does not mean. These must genuinely teach a layperson, not just define a term.",
    "Always do a data-selection audit before finalizing: ask whether the selected data points answer the question, what to add, what to remove, and the best visualization type, duration/window, and frequency for each important visual.",
    "Use pull quotes only for banger points supported by locked numbers. No vague quotes.",
    "Glossary blocks should explain technical terms like GDP, CPI, fertility, dependency ratio, per capita, AQI, or TWh in plain language.",
    "If the evidence is not enough, set status to 'needs_data' and write honestly about the gap.",
    "The top-level JSON object must contain schemaVersion, questionId, status, short, article, sourceNotes, caveats, lockedNumbersUsed, and qualityFlags. Do not wrap the answer in task, outputSchema, or any other parent object."
  ].join("\n");
}

function articleTemplateFor(evidence) {
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
