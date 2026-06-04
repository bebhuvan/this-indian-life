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
    "Every number and factual claim in the prose must come from the evidence packet. Do not add outside facts, rankings, census context, policy claims, causes, or forecasts.",
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
    "The audience is the average Indian reader: intelligent, busy, curious, and not trained in economics or statistics.",
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
    return {
      purpose: "Answer the size of India's economy while teaching how GDP should be read.",
      requiredSections: [
        "What does GDP actually measure?",
        "Why do we need nominal GDP and real GDP?",
        "What does the number mean per person?",
        "What is GVA, and how is it different from GDP?",
        "What does the spending side show?",
        "Why show imports and exports separately?",
        "What does GDP tell us well?",
        "What does GDP not tell us?"
      ],
      requiredConcepts: [
        "GDP as final goods and services produced inside the country",
        "Nominal GDP as current-price rupee size",
        "Real GDP as inflation-adjusted output using the stated base year",
        "Per capita GDP as an average, not salary or typical income",
        "GVA as producer/sector value before product taxes and subsidies adjustment",
        "GDP expenditure view: consumption, investment, government consumption, net exports",
        "Imports and exports as separate flows behind net exports",
        "GDP limitations: distribution, jobs, unpaid work, environment, regional variation"
      ],
      styleExample: [
        "## What does GDP actually measure?",
        "GDP is the value of final goods and services produced inside a country during a period. The word final matters. If wheat becomes flour and flour becomes bread, GDP is trying to count the final bread, not count the same value again at every step."
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
