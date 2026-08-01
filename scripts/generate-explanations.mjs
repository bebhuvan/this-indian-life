import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { lintExplanation, findingsToInstruction } from "./core/prose-lint.mjs";
import { hardIssuesFromTexts, deepStripEmDash, derivedReport } from "./core/prose-guards.mjs";
import { checkRichFigures, extractFigureLines } from "./core/rich-figures.mjs";
import { checkNumberConsistency } from "./core/number-consistency.mjs";
import { checkNasIdentities } from "./core/accounting-identities.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

// The main article path runs on deepseek-v4-pro (the stronger model). We pass it
// explicitly rather than changing the adapter default, so other callers that rely on
// the cheaper default (and the academy, which sets its own) are unaffected.
const MODEL = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-pro";

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
  if (evidence.questionId === "q.media.news_consumption") {
    const newsPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how India consumes news, in the voice of someone who reads media-research reports for a living and refuses to let a survey of English-speaking phone users stand in for 1.4 billion people. The through-line is a single reframing the reader must feel by the end: there are two Indias in this story, and almost everyone quotes the smaller one. The Reuters Institute Digital News Report is the number the headlines run every June, but it surveys only online, mainly English-speaking Indians, and it says so itself, in plain print, every year. The honest article puts that surveyed slice next to the India it under-counts. Walk the argument in order: (1) open on the most-quoted figure, trust in news, and immediately establish whose trust it is; (2) show how that connected slice now gets its news, through YouTube and WhatsApp rather than front pages; (3) STOP and ask who actually got counted, using the connectivity explosion (TRAI), who can even use the internet (the official MoSPI survey, with its brutal rural-female gap), and the urban-rural divide; (4) come back to what the connected slice does, the fading of TV and print even among the online, the phone-first habit, the 2026 platform pecking order; (5) show the India the survey under-counts, the Hindi-and-regional print world that dwarfs English, and the IAMAI finding that most internet users only bump into news rather than seek it; (6) follow the money, where digital revenue overtook television in 2024; (7) close on which brands the online slice trusts, where public broadcasters and old print mastheads sit on top, and then the honest methodology. Carry the argument forward section by section; never treat the charts as a disconnected list. The single most important discipline: NEVER present the Reuters DNR figures as 'India'. Every time a DNR number appears, the reader must be able to tell it describes the online, English-leaning slice, not the country. The gap between the surveyed slice and the whole is not a caveat to bury at the end; it is the story. Be scrupulous: subscriptions are not users; self-declared circulation is not audited reach; industry revenue is not audience reach; a low brand-trust score can mean a brand is distrusted OR that it is critical of power and actively disliked. Never claim a single cause; present all sides. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and its news, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: newsPlanned.length
        ? [
            ...newsPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A closing reader-question H2, 'How should you read these numbers?', a short honest methodology paragraph. Name the sources plainly: the Reuters Institute Digital News Report (annual, but a survey of mainly English-speaking online users, not nationally representative, by its own statement); TRAI's administrative telecom data (subscriptions, not people); the MoSPI / NSS Comprehensive Modular Survey on Telecom 2025 (the nationally-representative anchor); IAMAI-Kantar's ICUBE internet-use survey; the PRGI 'Press in India' report (registered titles and self-declared, unaudited circulation); and the FICCI-EY Media & Entertainment report (industry revenue, not reach). State plainly which numbers describe the online slice and which describe the whole country, that print circulation is self-declared and likely inflated, that revenue is not the same as reach, and that no single source captures all of Indian news. CRUCIALLY, the paragraph must own the biggest limitation directly and humbly: there is no good, single, authoritative dataset on how India consumes news, so this piece is stitched together from whatever could be found - overlapping surveys with different definitions, administrative counts, self-declared figures and industry estimates that do not always agree - and it should be read as the best available mosaic, not a definitive measurement. Say this plainly and without false modesty; it is a feature of the topic, not a failure of effort. Write it as a short, honest paragraph, not a reference list."
          ]
        : [
            "Do Indians trust the news?",
            "How does the connected slice get its news?",
            "But who actually got counted?",
            "What does online India do with the news?",
            "What about the India the survey misses?",
            "Where did the money go?",
            "Which news do Indians trust?",
            "How should you read these numbers?"
          ],
      requiredConcepts: [
        "THE SPINE of the whole article, stated early and never contradicted: the Reuters Institute Digital News Report (DNR), the figure quoted every June, surveys only online, mainly English-speaking Indians. By the DNR's own words it is 'not nationally representative' and 'will tend to under-represent the continued importance of traditional media such as TV and print'. The India it describes is younger, richer, more urban and more male than the country. Roughly 2,000 people are surveyed each year (2,044 in 2026), and no education quota is applied to the India sample, so it skews even more educated. Every DNR number in the piece must be framed as the online/English slice, never as 'India'",
        "The headline trust number and its context: in the DNR, trust in news among surveyed online Indians has moved 38% (2021), 41% (2022), 38% (2023), 41% (2024), 43% (2025) and 39% (2026). The 2026 figure of 39% ranks India 18th of 48 markets and sits just above the global average of 37%. State the number, then immediately state whose trust it measures",
        "How the connected slice gets news (DNR, platforms used for news in the last week): YouTube leads at about 58% in 2026, WhatsApp jumped about 10 points in a single year to about 56%, Instagram is rising fast (about 45%), Facebook about 39%, Telegram about 23%. The shift is from front pages to video and chat apps. These are platforms USED for news, not trusted for it",
        "The misinformation counterpoint, which must sit near the platform story: in the DNR's 2025 round, about 53% of surveyed Indians named WhatsApp as the channel carrying the biggest threat of false or misleading information, the highest of any market. Closed, forwarded, video-first channels are exactly the ones hardest to fact-check",
        "THE ATTENTION SHIFT and the AI shock, both from the FICCI-EY Media & Entertainment report. (a) Time spent on social media keeps climbing: from about 103 billion hours a quarter in early 2022 to about 173 billion by late 2025; news increasingly lives inside these feeds rather than on its own pages. (b) THE NEW TWIST worth foregrounding: India's online news audience (Comscore, measuring reach of online news platforms) rose to about 461 million in 2024 then FELL about 9% to about 428 million in 2025, the first such drop. Industry stakeholders blame AI: AI search summaries and AI chat apps that answer questions without sending readers to news sites; some publishers say their own reach fell by over 30%. Online news still reaches roughly 29% of India's population, so it remains large. Note the lens: Comscore platform reach is a different measure from survey self-reports, so present it as its own signal, not a contradiction of the other numbers",
        "WHO ACTUALLY GOT COUNTED, part 1, connectivity (TRAI administrative data): total broadband subscriptions were almost flat until about 2016, then exploded from tens of millions to over a billion (about 1,070 million by early 2026) as cheap 4G arrived. But these are subscriptions, not people: one person can hold several, so the figure overstates unique users. India came online very recently and very fast",
        "WHO ACTUALLY GOT COUNTED, part 2, the official nationally-representative anchor (MoSPI / NSS Comprehensive Modular Survey on Telecom, 2025): about 86% of households have internet access (rural about 83%, urban about 92%), about 85% own a smartphone, and internet use among 15-29 year-olds is about 94%. But the ability to use the internet splits hard by gender and geography: urban men about 86%, urban women about 74%, rural men about 72%, rural women about 58%. That near-28-point gap between urban men and rural women is the divide an English online panel cannot see",
        "WHO ACTUALLY GOT COUNTED, part 3, the urban-rural ratio (TRAI, end-March 2025): about 111 internet subscriptions per 100 people in urban India against about 45 in rural India, with an all-India figure near 69 that hides the split. Wireless is about 96% of all internet subscriptions; India's internet is overwhelmingly mobile. Subscriptions can exceed population in cities (multiple SIMs, work lines), so this is supply, not unique users",
        "What the connected slice does with old media (DNR weekly use): even within the online sample, weekly TV use fell from about 59% (2021) to about 44% (2026) and weekly print from about 50% to about 35%. This is decline among online users only; nationally TV and print reach far more people and are fading more slowly. About three in four surveyed users reach news on a smartphone, mirroring the wider truth that India came online on mobile, not desktop",
        "PHONE-FIRST IS NATIONAL, not just the online slice (MoSPI / NSS CMS:T 2025, nationally representative): about 94% of India's internet users get online via a mobile phone on mobile data (98% in rural India, 89% in urban), and only about 4.5% use wifi. About 59% of all households own only a smartphone (rural 53%, urban 70%). So the phone-first, mobile-data pattern is not an artifact of an English online panel; it is how the whole country connects. Use this official figure to generalise the phone-first point beyond the DNR slice",
        "THE INDIA THE SURVEY UNDER-COUNTS, print (PRGI 'Press in India 2023-24'): India has about 151,000 registered periodicals, of which Hindi accounts for about 58,600 and English only about 20,200; regional languages add tens of thousands more. Self-declared daily circulation runs to about 378 million copies, of which Hindi is about 187 million and English only about 40 million. The language in which most Indians read the news is precisely the one the English online survey misses",
        "THE PRINT BOOM-AND-SLIP, the long view (CSO/MoSPI Statistical Year Book for 2008-2014, PRGI Press in India for 2018-2024, one statutory 'claimed circulation' metric): while Western newspapers were collapsing, Indian newspaper circulation roughly DOUBLED through the 2010s, from about 258 million copies a day in 2008-09 to a peak near 450 million by the mid-2010s, then eased back to about 379 million by 2023-24. Hindi led the boom (about 120 million rising to 230 million, now about 187 million); English was always a small slice (around 43-68 million) and is now shrinking to about 40 million. This is the opposite of the Western story, and it is a crucial counterweight to any 'print is dying' narrative imported from abroad. State the boom and the recent slip together. Caveat hard: claimed circulation is self-declared and unaudited and depends on how many publishers filed each year, the early and late years come from different compilers (CSO/MoSPI vs PRGI), and some years are not available, so read the broad arc and never single-year precision",
        "PRINT REVENUE AND WHO READS (FICCI-EY): print's money is roughly flat, not collapsing - advertising about 177-179 billion rupees and circulation revenue about 80-82 billion rupees a year (2023-2025), with total print revenue around 259 billion. But circulation revenue has now fallen for two years running (about 81.7 to 80.1 billion), and publishers increasingly describe newspapers as a news product for OLDER readers (35-plus) while younger audiences shift to digital. So print is not dying so much as ageing: stable for now, propped up by advertising, but with its reader base greying. This can be woven into the print section as prose; it does not need its own chart",
        "THE PRGI HONESTY RULE, which must be stated wherever its circulation numbers appear: PRGI does NOT verify circulation; the figures are self-declared by publishers and widely considered inflated. And 'registered' is a cumulative stock: of the roughly 151,000 registered titles, only about 36,000 (about a quarter) actually filed an annual return, on which all the circulation analysis rests. Treat circulation as indicative, not audited reach",
        "THE INDIA THE SURVEY UNDER-COUNTS, the seeing-vs-seeking gap (IAMAI-Kantar ICUBE 2024): of India's about 886 million active internet users, about 582 million (two-thirds) encounter news online, but only about 180 million (one in five) consciously seek it out. Most internet users bump into news in WhatsApp forwards, social feeds and YouTube rather than following it. Passive exposure is not the same as readership",
        "THE INDIA THE SURVEY UNDER-COUNTS, the rural centre of gravity (IAMAI-Kantar ICUBE 2024): rural India now has more active internet users (about 488 million) than urban India (about 397 million), and about 98% of users consume content in Indian languages. The fastest-growing, most numerous part of online India is rural and Indic-language, and almost invisible to an English online panel",
        "FOLLOW THE MONEY (FICCI-EY Media & Entertainment report, industry revenue in INR billion, 2022-2025): digital media revenue overtook television in 2024 (digital about 851 vs television about 679 that year) and kept climbing past a trillion rupees by 2025 (about 1,110); television is sliding (from about 726 to about 617), print is roughly flat (about 250-260), film is recovering modestly, radio is tiny (about 21-25). Digital advertising reached about 947 billion rupees in 2025, roughly 63% of all ad spend. State plainly that this is industry REVENUE, not audience reach: TV and print still reach far more people than their shrinking revenue implies",
        "WHICH BRANDS THE ONLINE SLICE TRUSTS (DNR brand trust, 2026): legacy newspapers and public broadcasters score highest (Times of India about 69%, Hindustan Times about 67%, All India Radio and Economic Times about 65%, BBC and Indian Express about 64%, DD India and The Hindu about 63%), private TV news lower (NDTV about 62%, CNN-News18 and India Today TV about 61%, Republic TV about 57%), and critical digital-born outlets lowest (The Wire about 51%, Scroll.in about 48%)",
        "THE BRAND-TRUST HONESTY RULE: a low trust score is ambiguous. It can mean a brand is genuinely distrusted, OR that it reports critically on those in power and is therefore actively disliked by some respondents, sometimes amid coordinated harassment. The DNR warns explicitly that these scores are not a measure of the quality or trustworthiness of the journalism. Never present the brand-trust chart as a quality ranking",
        "CORROBORATION, used carefully: a separate, nationally-representative survey, the Lokniti-CSDS 'Media in India' study (2022), points the same way on trust, finding public broadcaster Doordarshan and newspapers more trusted than private television channels. Cite it as directional corroboration from a representative survey; do not invent precise figures for it beyond this",
        "NUMBER DISCIPLINE is absolute: every statistic in the prose must come from the evidence packet's locked numbers or the specific figures stated in these concepts; never invent, recall or estimate a number. Present figures as rounded approximations ('about 58%', 'roughly 187 million', 'around a quarter'), never false-precision decimals. Anchor every number to its source and its population (online slice vs whole country) when it first appears",
        "THE OVERARCHING DATA CAVEAT, to be owned openly (and reflected in the methodology close): measuring how a country of 1.4 billion consumes news is genuinely hard, and there is no single authoritative dataset for it. This article is assembled from whatever could be found - overlapping surveys with different definitions and base populations, administrative subscription counts, self-declared and unaudited circulation, and industry revenue estimates - none of which fully agree or fully cover the question. Treat the piece as the best available mosaic, not a precise measurement, and let the disagreements between sources be visible rather than smoothed over. State this humbly and plainly; it is the nature of the topic",
        "Keep the macha layer warm and plain-spoken, a sharp friend explaining what the news numbers really mean: the figure everyone quotes describes the connected, English-reading minority, and the real story of how India consumes news is mostly happening in Hindi and regional languages, on cheap phones, in forwards and videos, among people the famous survey was never built to reach. The playfulness lives in the headings; the body stays grounded and genuinely helpful, and it summarises what the whole page means, not one chart"
      ],
      styleExample: [
        "## Do Indians actually trust the news?",
        "Every June, one number does the rounds: the share of Indians who say they trust the news. In 2026 it is 39%, a touch above the global average, and the headlines write themselves. But look at who was actually asked. The Reuters Digital News Report, the source of that number, surveys Indians who are online and answering in English, and it tells you so itself, in the small print, every single year. That is a real and interesting group, but it is younger, richer, more urban and more English than the country it gets used to describe. So 39% is not how much India trusts the news. It is how much a particular, connected slice of India trusts it. Hold on to that, because almost every striking fact about how India consumes news comes from this same slice, and the more interesting story is about everyone the survey never reaches: the Hindi newspaper reader in Kanpur, the woman in rural Bihar who has never been online, the man who only ever meets the news as a forwarded video. Keep both Indias in your head, and the numbers start telling the truth."
      ].join("\n\n")
    };
  }
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
  if (evidence.questionId === "q.econ.asia_divergence") {
    const planned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    const purpose = "Answer why India and China started together in 1950 but ended worlds apart, in the voice of someone who knows development and growth economics cold and refuses to reduce a seventy-year divergence to a single villain. This is ONE long, definitive flagship, not a part of a series: it must be the most complete and most honest single page a curious Indian can read on why the rest of Asia pulled ahead. The puzzle to open on: around 1950 India was no poorer than China, South Korea or its neighbours, and on some counts a little richer, yet over the next seventy years they raced ahead while India crawled. The article is organised around the 'integrated East Asian model', a sequence the data is arranged to follow, never asserted as proven causation: (1) THE PEOPLE first, build human capital before income, health and child survival, then schooling AND how little is actually learned, then women's near-absence from paid work; (2) THE ENGINE, force saving and investment far above India's, deepen the banks to channel it, pull in foreign factories, and pile up capital behind each worker; (3) THE FACTORY INDIA SKIPPED, the manufacturing escalator that never rose, the farm-to-services leap that bypassed mass industry, and the overwhelmingly informal work India made instead; (4) THE WORLD INDIA DIDN'T CAPTURE, the sliver of world goods trade as China seized a huge share, the tariff wall India still keeps highest, the export-complexity ladder it climbed slowly, the global value chains it barely plugged into, and how India became a customer of China's factories; (5) SO WHY, THE STATE AND ITS INSTITUTIONS, the capable developmental bureaucracies East Asia built against India's middling government effectiveness, handled with the crucial honest nuance that India is NOT uniformly weak, it ranks respectably on voice and the rule of law and far lower on delivery, regulation and corruption; (6) THE ARITHMETIC, the decade-after-decade growth-rate gap that compounds, the perspiration-versus-inspiration debate over capital versus productivity, the demographic window and who used it, whether growth reached everyone, and an illustrative projection of when India might reach where China and Korea stand today; and (7) THE HONEST OTHER SIDE, that India crushed extreme poverty without a manufacturing boom, built a real services-export escalator that lifts fewer low-skilled workers, climbed the human-development scorecard, and did all of it as a continuous democracy while Korea and Taiwan democratised only after their takeoffs. Carry the argument forward section by section; each section explains and sits beside its chart, never a disconnected list. Be scrupulously disciplined about cause throughout: state WHAT the data shows while being explicit the factors are entangled and the data cannot prove which mattered most or that any single one was the cause; never claim a single villain; and NEVER imply that India's mistake was failing to coerce its people, the human cost of the East Asian methods is exactly the trade-off the final act weighs. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and Asia. Never use em-dashes.";
    const closer = "A closing reader-question H2, 'How should you read these comparisons?', the methodology section and the LAST section of the whole flagship. Name the sources plainly: the Maddison Project for the long-run GDP reconstruction and decade growth rates; the IMF World Economic Outlook for the up-to-date per-capita income gap (PPP, current international dollars, 2024-2025 estimated); the World Bank for health, demography, learning, investment, finance, structure, trade, power and poverty indicators; the World Bank's Worldwide Governance Indicators for the institutional-quality measures; the World Bank Enterprise Survey for the 2014 snapshot of what India's firms call their biggest obstacle; Lee-Lee and Barro-Lee for long-run schooling; ILOSTAT for informal employment; WITS for the most-favoured-nation and effectively-applied tariff detail; the WTO merchandise-export series (via the World Bank) for world-trade shares; UN Comtrade for India's bilateral trade with China; the Harvard Growth Lab's Atlas of Economic Complexity; the Penn World Table for output per hour, total factor productivity and capital per worker; OECD TiVA for global-value-chain participation; the World Inequality Database for top-income shares; the UNDP Human Development Index; and the V-Dem electoral democracy index. State plainly: Maddison's pre-1950 figures are reconstructions read as trajectory not exact levels; PPP is a modelled price adjustment, never mixed with market rates, and the income-gap chart uses current-dollar IMF PPP while the convergence projection uses real constant-price World Bank PPP; learning scores, the Human Capital Index, the governance ranks and the Enterprise Survey are latest-year or single-vintage snapshots, not trends, and the Enterprise Survey is a lone 2014 reading of business sentiment; labour and informality figures are modelled and ILOSTAT lacks comparable informality for China and Korea; the world-export-share and India-China charts are merchandise only; total factor productivity is a contested residual and the perspiration-versus-inspiration debate is genuinely unsettled; backward value-chain participation reads low for large economies with deep domestic supply, like China, for reasons unrelated to success; top-income shares are modelled and contested; the convergence chart is an illustrative constant-growth projection, not a forecast, against where China and Korea stand today; Taiwan appears only where Maddison, the Penn World Table and V-Dem cover it; and several factors moving together is never proof any one caused the divergence. Close on the honest through-line: India under-did each link of the East Asian model, but the data shows what happened, not a single cause, and India's slower, democratic path still lifted hundreds of millions. Write it as a short, honest paragraph, not a reference list.";
    const fallback = ["Weren't India and China equally poor in 1950?", "What did East Asia build first?", "Is schooling the same as learning?", "Why do so few Indian women work for pay?", "How much did each country invest?", "Why did India skip the factory?", "What kind of work did India make?", "Who captured world trade?", "How walled-off is India still?", "What kind of state did each build?", "How fast did they actually grow?", "So when does India catch up?", "What did India get right?", "How should you read these comparisons?"];
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
        "State capacity and the developmental state, the institutional layer that answers 'so why': behind every policy choice sits the machine that carries it out, and a recurring theme in the scholarship is that South Korea, Taiwan, Japan and later China built relatively capable, insulated bureaucracies that could plan, target credit and discipline firms, while India's state was stretched, politicised and weaker at delivery. The World Bank's Worldwide Governance Indicators put this in numbers as percentile ranks against all countries: on government effectiveness India sits middling, well below the East Asian performers and far below city-state Singapore. Present capable-state-building as part of the East Asian package and a real difference, never as a proven single cause, and never as an argument that India should have been more authoritarian",
        "The crucial institutional NUANCE, which must be stated to keep the page honest: India is NOT uniformly weak on governance. On the same Worldwide Governance Indicators it ranks respectably on voice and accountability and on the rule of law, comparable to or above China, and far lower on government effectiveness, regulatory quality and control of corruption. The honest reading is that India built a participatory, rights-respecting state that is weaker at delivering and regulating, not a failed state, while China built a delivering, controlling state with little voice. These are perception-based indices from surveys and expert ratings, so cite broad standing and direction, not single-point moves",
        "What India's own firms say, from the World Bank Enterprise Survey (India, 2014, the only vintage in this dataset): asked their single biggest obstacle, Indian firms named corruption first (about a fifth), then unreliable electricity, then tax rates, informal-sector competition and access to finance, with labour regulations far down the list. Use this as a useful, grounded corrective to easy assumptions, but treat it strictly as one dated 2014 snapshot of business sentiment, never as a current or trending measure",
        "The tariff detail done properly, from WITS: a country's headline 'most-favoured-nation' tariff is the rate it advertises to any WTO member, while its 'effectively-applied' tariff is what importers actually pay on average after free-trade deals and exemptions, and the gap between them is preferential access. India's headline and effective tariffs both fell sharply after 1991 but remain the highest of this group, and even its effective wall (around 10%) sits above China's, Korea's and Vietnam's. Both are simple averages across products, so a few very high tariff lines lift them, and they say nothing about non-tariff barriers",
        "The single clearest trade picture, as given facts: China's share of all world goods exports rose from roughly 1% around 1980 to over 14% today, while India's barely moved off 1 to 2%. And as China became the world's factory India became one of its customers, with imports from China exploding since 2000 while India's exports back to China stayed comparatively flat, a wide and persistent bilateral deficit. These are merchandise (goods) flows in gross terms",
        "Keep the macha layer warm and plain-spoken, a sharp friend explaining the whole divergence, with the playfulness living in the headings and the body staying grounded and genuinely helpful; it summarises what the entire page means, not one chart"
      ],
      styleExample: [
        "## Weren't India and China equally poor to begin with?",
        "Yes, and that is exactly what makes the story so strange. Wind the clock back to 1950 and the two giants are standing on more or less the same line. By the best long-run reconstruction we have, the average Indian was actually a shade better off than the average Chinese, and not far behind a South Korean, who at the time had just been through a war and was about as poor as anyone on earth. If you had to bet that year on who would race ahead, you might well have picked India, the stable democracy with the railways and the universities, over a China about to throw itself into famine and chaos. The bet would have been wrong. Over the next seventy years the line India was standing on barely lifted while the others shot upward, until a South Korean produced in an afternoon what an Indian produced in a week. Nothing about 1950 explains that. The explanation is in everything that happened next, and it starts not with factories or reforms but with something quieter, whether a country bothered to keep its children alive and send them to school."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.econ.rupee") {
    const rupeePlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer why the rupee keeps falling and whether that has actually made ordinary Indians poorer, in the voice of someone who knows exchange-rate economics cold and refuses to feed the debasement panic OR to wave it away. This is the biography of a currency: tell the rupee's life story from a pegged colonial inheritance to a managed market float, and let the big reframings emerge FROM that history rather than as a lecture. The through-line is that the famous number, four rupees to a dollar at independence becoming about eighty-five today, is the most misread number in Indian economic life. Walk the story in order: (1) open on that long slide and plant the misconception honestly, that people read it as theft or debasement; (2) the pegged inheritance and the two forced devaluations of 1966 and 1991, where the 1991 step was a near-default with reserves down to a fortnight of imports, not a policy whim; (3) the move to a market rate in 1993 and the modern managed float, where the central bank's job, by its own research, is to curb volatility driven by foreign capital flows, not to defend a level, the words-versus-deeds question; (4) THE REVEAL, that against the dollar the rupee fell to a third since 1994 but in real, trade-weighted terms (REER) it is almost exactly where it began, so the 'collapse' and the 'stability' are the same currency seen through two lenses; (5) the counterfactual that defuses the panic, that nobody holds wealth in cash and a rupee left in an ordinary bank deposit kept and modestly grew its purchasing power while only the mattress lost; and (6) what depreciation genuinely costs and pays, dearer oil and imports against a larger rupee value for the diaspora's remittances. Carry the argument forward section by section; never treat the charts as a disconnected list. Be scrupulously honest in BOTH directions: depreciation is not theft, but it is not free either. Never claim a single cause; the rupee moves on inflation gaps, capital flows, the dollar's own cycle and policy at once. This is meant to be the CANONICAL reference on the rupee's history, so weave in the iconic episodes with confidence and precision: the secret 1991 gold airlift, the politically explosive 1966 devaluation, India's escape from the 1997 Asian crisis, the 2013 taper-tantrum plunge and Rajan's rescue, and the 2022 breach of 80, alongside the frameworks that explain them (the impossible trinity, capital-account convertibility, and the difference between a devaluation and a depreciation). Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and the rupee, and let each chart sit beside the prose. Never use em-dashes.",
      requiredSections: rupeePlanned.length
        ? [
            ...rupeePlanned.map((chart) => {
              const extra = {
                "the-number": " This early section should also introduce the clean distinction between a DEVALUATION (a deliberate one-off cut to a fixed peg, as in 1949, 1966 and 1991) and a DEPRECIATION (the continuous drift of a market-determined rate since 1993).",
                "reserves-arc": " This section MUST tell the 1991 gold-pledge story precisely, as two separate operations: about 20 tonnes of gold sold to UBS for roughly $200 million in May 1991, and a secret 46.91-tonne airlift of RBI gold to the Bank of England and Bank of Japan for $405 million in July 1991 (together about 67 tonnes for roughly $605 million), the rock bottom of the whole story.",
                "current-account": " This section MUST also cover the 1997-98 Asian financial crisis, when India's capital controls spared the rupee the collapse that struck Thailand, Indonesia and South Korea.",
                "managed-float": " This section MUST explain the impossible trinity (a country cannot simultaneously have a fixed exchange rate, free capital movement and an independent monetary policy) and India's deliberate middle path of a managed float with PARTIAL capital-account convertibility, including the two Tarapore committees (1997 and 2006) and why India never adopted full convertibility.",
                "intervention": " This section MUST include the 2013 taper tantrum: the record low of 68.85 per dollar on 28 August 2013, Raghuram Rajan becoming RBI governor on 4 September 2013, and his concessional FCNR(B) swap window that drew in about $34 billion and stabilised the rupee; and the 2022 stress when the rupee first breached 80 per dollar.",
              }[chart.beat] || "";
              return `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat}).${extra}`;
            }),
            "A closing reader-question H2, 'So how should you read the rupee?', a short honest methodology paragraph. Name the sources plainly: FRED for the dollar exchange rate and Brent crude; the Bank for International Settlements for the real and nominal effective exchange rates, the long India and US consumer-price series and the policy rate; the Reserve Bank of India for the 36-country REER back to 1975, deposit rates, its dollar intervention and forward book, foreign portfolio flows and the foreign-trade tables; the World Bank for remittances; and a verified historical chronology for the pre-1973 par values. State plainly that pre-1993 rupee-dollar rates are fixed-peg par values, not market prices; that the real-value (REER) story is a trade-weighted index whose stability means the fall tracked the inflation gap, not lost worth, and is not a claim the rupee is 'correctly' valued; that the purchasing-power counterfactual holds for a domestic spending basket only, since foreign travel, education and imported goods genuinely did get dearer; and that the bank-deposit real gain depends on which inflation series is used. Write it as a short, honest paragraph, not a reference list."
          ]
        : [
            "Why does everyone think the rupee is collapsing?",
            "Why did the rupee have to be devalued in 1966 and 1991?",
            "Who actually controls the rupee now?",
            "The rupee fell to a third against the dollar. So why hasn't it really fallen?",
            "Did the falling rupee actually make you poorer?",
            "What does a weak rupee really cost you?",
            "So how should you read the rupee?"
          ],
      requiredConcepts: [
        "The framing number to open on, stated carefully: the rupee went from about 3.30 per US dollar at independence in 1947 (NOT one-to-one, and NOT 4.76, a popular myth) to about 4.76 after the 1949 sterling devaluation, 7.50 after the 1966 devaluation, about 31 at the 1993 market unification, and roughly 83-93 in 2024-26. Pre-1993 these are fixed-peg PAR VALUES set by policy, not market prices, so the long flat stretches are pegs, not stability of worth",
        "The single most important reframing, the spine of the article: against the US dollar the rupee lost about two-thirds of its value since 1994 (an index of 100 falls to about 34), and its trade-weighted NOMINAL value (NEER) fell to about 41, but its trade-weighted REAL value (REER, which strips out inflation) ended near 97, almost exactly its 1994 level. The 'collapse' and the near-flat real line are the SAME currency through two lenses. State clearly that a stable REER means the nominal fall mostly tracked India's higher inflation, NOT that the rupee is 'correctly' valued",
        "Why a higher-inflation currency MUST drift down, the mechanism: India has run inflation persistently above the United States for decades. If the nominal rate did not fall to offset that gap, Indian goods would price themselves out of world markets. So the nominal slide is largely the inflation differential doing its job, not the country failing. State this as the core idea that defuses 'debasement'",
        "The honest limit on that mechanism, which must be stated so the article does not over-claim: the bilateral rupee-dollar rate has fallen MORE than the pure India-US inflation gap predicts (it overshoots relative PPP), because capital flows and the dollar's own strength also move it. Bilateral PPP is a weak predictor; this is exactly why the trade-weighted REER, not a back-of-envelope inflation calculation, is the truer gauge of the rupee's real value",
        "The long real story (RBI 36-country REER from 1975): the real rupee was OVERVALUED in the 1970s and 1980s (held artificially strong under the pegs, an index around 120 on a 1985 base), was sharply CORRECTED by the 1991 devaluation (down toward 60), bottomed in the mid-1990s, then drifted back to a stable range around 100-105 by 2021. So the devaluations were real-exchange-rate corrections, not arbitrary debasement",
        "The 1966 devaluation (6 June 1966): the rupee was cut from 4.76 to 7.50 per dollar, a fall of about 36.5% in foreign-currency terms, equivalently a 57.5% rise in the rupee price of a dollar (the same move measured two ways, state both to avoid confusing readers). Cause: a balance-of-payments crisis after the 1965 war, drought and an aid squeeze, with IMF and World Bank conditionality. It was widely read at the time, as now, as a national humiliation",
        "The 1991 crisis and devaluation, the dramatic turning point: India's foreign reserves fell to about 1 billion dollars in mid-1991, barely two to three weeks of imports, a near-default. The rupee was devalued in two steps on 1 and 3 July 1991, about 18-19% against the US dollar cumulatively. State precisely that the official '9% and 11%' figures are measured against the pound sterling (the intervention currency), not the dollar. It was executed by the RBI under Governor S. Venkitaramanan, with Deputy Governor C. Rangarajan carrying it out (Rangarajan was NOT yet Governor), under Finance Minister Manmohan Singh and PM Narasimha Rao",
        "The institutional milestones: a dual exchange rate (LERMS, March 1992, 40% of receipts surrendered at the official rate and 60% at the market rate), unification to a single market-determined rate in March 1993 at about 31-31.5 per dollar (use a range, this figure is secondary-sourced), and current-account convertibility under IMF Article VIII in August 1994. The rupee 'grew up' from a policy-set peg into a managed market float",
        "Words versus deeds, the modern intervention story, anchored in RBI's own research (Patra, Kumar, John and Acharya, 'Foreign Exchange Intervention: Efficacy and Trade-offs in the Indian Experience', RBI Bulletin, January 2025): the main source of rupee volatility is the volatility of foreign PORTFOLIO flows driven by global risk-on/risk-off spillovers, NOT inflation or interest-rate differentials. RBI intervention, both spot and in forwards, effectively counters that flow volatility with symmetric effects, and shows threshold 'leaning against the wind' behaviour, dampening volatility rather than defending a level. In the data, foreign portfolio outflows and RBI dollar sales move together in every stress episode",
        "The scale of the modern defence: foreign reserves rose from that 1 billion dollar trough in 1991 to over 600 billion dollars by 2021. And the RBI increasingly defends the rupee through the forwards market, its outstanding net forward dollar position reaching over 100 billion dollars of committed sales by 2026, firepower deployed without yet spending spot reserves. Note a large negative forward book is committed firepower, not free cushion",
        "THE COUNTERFACTUAL that defuses the debasement panic, the emotional core: nobody holds wealth in cash, so 'the rupee lost value' is the wrong test. One rupee left in an ordinary 1-3 year bank deposit since 1970 grew faster than the cost of living and ended AHEAD in real terms, while the same rupee under a mattress lost almost everything (about 97-98% of its purchasing power). State the real gain as a RANGE, roughly 1.3 to 1.7 times its 1970 purchasing power depending on which inflation series is used, and note interest tax would trim it. The direction is robust, the decimal is not",
        "The honest two-phase nuance of that counterfactual, which must be stated: through the financial-repression decades (1970s to early 1990s) deposit rates were held BELOW inflation by policy, so even the bank saver lost real value in that era; only after the 1991-93 liberalisation did real rates turn positive and the saver pull clearly ahead. The same 1991 hinge that corrected the overvalued rupee also flipped the domestic saver from loser to winner",
        "What depreciation genuinely COSTS, stated so the reframing never becomes its own propaganda: India imports most of its oil and much else in dollars, so a weaker rupee raises the import bill and feeds inflation even when world prices are flat (oil is India's single largest import). And the purchasing-power counterfactual holds only for a DOMESTIC spending basket: for anyone whose basket is foreign, a child studying abroad, a frequent traveller, an importer, depreciation genuinely did make them poorer. Say this plainly",
        "What depreciation PAYS, the other side: India is the world's largest recipient of remittances, over 130 billion dollars a year, and a weaker rupee turns every remitted dollar into more rupees for families at home. And the 'is the rupee just a number' point made concrete: India's merchandise exports since 1970 grew about 217 times measured in dollars but about 2,400 times measured in rupees, and the roughly elevenfold ratio between the two is almost exactly the rupee's depreciation. Same exports, two stories, the gap IS the exchange rate",
        "FRAME THE CONCEPT early, woven into the opening sections, not as a dry definition: an exchange rate is a RELATIVE price, the price of one currency in another, so it always moves on both sides. What it TELLS you is how many dollars a rupee buys today and, over time, roughly how much faster Indian prices rose than American ones; it is a signal of trade competitiveness and of cross-border money flows. What it does NOT tell you is whether Indians are getting poorer, what your money buys at home, or whether the rupee is 'mismanaged'. And exchange rates move for three main reasons the article should name plainly: the inflation gap between countries, the ebb and flow of foreign capital, and the global cycle of the dollar itself",
        "The rupee in global context (FRED bilateral rates, 2000-2025): almost every currency fell against a historically strong US dollar. The rupee lost about 48% of its dollar value, but the Brazilian real (about 67%), South African rand (about 61%) and Mexican peso (about 51%) fell further, while the Swiss franc, euro, Chinese yuan and Thai baht actually GAINED against the dollar. The rupee is a middle-of-the-pack emerging-market currency, not an outlier. By decade, the rupee's dollar losses were concentrated in the 1960s (the 1966 devaluation), the 1980s (about 55%) and the 1990s (about 61%), while the 2000s were almost flat (about 1%)",
        "Much of the rupee's 'weakness' is really dollar STRENGTH: since 1999 the rupee lost about half its value against the US dollar but far less against the pound and the yen, because the dollar itself rose against almost every currency. When a headline says 'rupee at an all-time low', it is almost always an all-time low against the dollar specifically, often on a day the dollar is broadly strong, not a sign of India-specific collapse. The trade-weighted REER is the honest summary; the dollar pair is the scary one",
        "Foreign investment is not one thing: stable, long-term foreign DIRECT investment (factories, controlling stakes, reinvested earnings) behaves very differently from fast, reversible foreign PORTFOLIO investment (stocks and bonds). FDI is relatively steady; portfolio money can flood out in a single risk-off week, and it is portfolio flows, not FDI, that drive the rupee's sharp swings. Never conflate the two when discussing 'foreign money leaving'",
        "THE 1991 GOLD PLEDGE, the iconic crisis image, told precisely (two separate operations that popular accounts wrongly merge): in May 1991 the caretaker government leased about 20 tonnes of confiscated gold to the State Bank of India, which sold it to UBS to raise about $200 million; then in July 1991 the RBI secretly airlifted 46.91 tonnes (nearly 47 tonnes) of its own gold to the Bank of England and the Bank of Japan to raise $405 million. Together roughly 67 tonnes for about $605 million; the gold was redeemed and returned later in 1991. Do NOT say the July airlift alone raised $600 million. This is the rock bottom of the whole story, India pledging its gold to avoid default",
        "THE 1966 DEVALUATION'S POLITICS: the June 1966 cut from 4.76 to 7.50 per dollar came under heavy pressure from Washington and the World Bank, who tied resumed aid (and, through the PL-480 food programme during the 1965-66 droughts, US wheat under Johnson's 'short-tether' policy) to devaluation and liberalisation. It was seen at home as a humiliating capitulation; Indira Gandhi faced a political storm and distanced herself from its architects. In the short run it largely FAILED to lift exports (they fell about 15% in the following months, hit by drought and contradictory trade policy). Present the short-run failure as well-established and any long-run benefit as debated",
        "THE 1997-98 ASIAN FINANCIAL CRISIS, the dog that did not bark: while the Thai baht, Indonesian rupiah and Korean won collapsed, the rupee depreciated only moderately (roughly 35-39 per dollar through 1997-98, drifting to the low 40s by 1998-99). India was insulated precisely BECAUSE it kept capital controls and the rupee was not fully convertible, so there was little flighty short-term foreign debt to flee. This is a central argument for India's cautious convertibility stance",
        "THE 2013 TAPER TANTRUM, the modern crisis: when the US Fed signalled tapering in mid-2013, foreign money fled and the rupee hit a record low of 68.85 per dollar on 28 August 2013. Raghuram Rajan took over as RBI Governor on 4 September 2013 and opened a concessional FCNR(B) deposit and bank-borrowing swap window that drew in about $34 billion (roughly $26 billion of deposits plus about $8 billion of overseas borrowing) over three months, stabilising the rupee. The record current-account deficit of 2012-13 (near $88 billion) was the vulnerability the taper exposed",
        "THE 2022 EPISODE, the latest stress: amid aggressive US Fed rate hikes, the rupee first breached 80 per dollar intraday on 19 July 2022 and first closed past 80 in September 2022. India's reserves fell from an all-time high near $642 billion in late 2021 to about $524 billion by late October 2022. State carefully that a large part of that fall was VALUATION (a strong dollar shrinking the dollar value of non-dollar assets and gold), not purely active intervention, so do NOT say the RBI 'spent $118 billion defending the rupee'",
        "THE IMPOSSIBLE TRINITY, the framework that explains WHY the RBI behaves as it does: a country cannot simultaneously have a fixed exchange rate, free movement of capital, and an independent monetary policy; it must give up one (the Mundell-Fleming trilemma). India deliberately takes a middle path, a managed float (smoothing volatility rather than pegging or fully floating) plus PARTIAL capital controls, which preserves monetary-policy independence. This is why the RBI can lean against the rupee but neither can nor tries to fix its level",
        "CAPITAL-ACCOUNT CONVERTIBILITY, why the rupee still is not fully free: India allows free conversion for trade (current-account convertibility since 1994) but still restricts cross-border CAPITAL flows. Two committees under S.S. Tarapore (reporting 1997 and 2006) laid out phased roadmaps to fuller capital-account convertibility, conditioned on preconditions; India deliberately never adopted it, a caution the 1997 Asian crisis vindicated. This is a deliberate policy choice, not a failure to reform",
        "THE DEPRECIATION-VERSUS-DEVALUATION distinction, a clean idea to teach explicitly: before 1993 the rupee's falls were DEVALUATIONS, deliberate one-off cuts to a fixed peg announced by the government (1949, 1966, 1991); since 1993 the rupee's slide is DEPRECIATION, the continuous drift of a market-determined rate. Same direction, completely different mechanism, and the public still often reads an ordinary market depreciation as if it were a deliberate policy devaluation",
        "THE CLOSE, where the rupee goes from here, handled with discipline and NO numeric forecast: the honest close is that the rupee will most likely keep drifting down against the dollar at roughly the pace of the India-US inflation gap (a few percent a year), with its real trade-weighted value staying broadly stable, punctuated by sharp moves whenever global capital turns risk-off. A weak rupee is neither a disaster nor a scandal; it is the price of being a fast-growing, higher-inflation, capital-importing economy, and what matters for an ordinary person is real returns at home, not the dollar headline",
        "ATTRIBUTION DISCIPLINE: never pin the rupee's path on a single Prime Minister, governor or party. The currency moves on the inflation gap, foreign capital flows, the dollar's own global cycle, oil shocks and policy regimes together. Attribute moves to REGIMES and SHOCKS (the pegs, 1966, 1991, the 2013 taper tantrum, dollar-strength cycles), not to personalities, that cheap-shot framing is exactly what the article is trying to correct",
        "NUMBER DISCIPLINE is absolute: every figure in the prose must come from the evidence packet's locked numbers or the specific figures in these concepts; never invent, recall or estimate. Present derived or contested figures (the counterfactual multiple, the 1991 percentages, the 1993 unification rate) as approximate ranges, never false-precision decimals. Anchor every number when it first appears (what it measures, high or low in plain words)",
        "Keep the macha layer warm, plain-spoken and genuinely reassuring without being dishonest, a sharp friend explaining what the falling rupee really means for an ordinary person's money, with the playfulness in the headings and the body grounded; it summarises what the whole page means, not one chart"
      ],
      styleExample: [
        "## The rupee fell to a third against the dollar. So why hasn't it really fallen?",
        "Here is the thing almost nobody tells you. Yes, a dollar cost about thirty-one rupees in 1994 and costs around eighty-five now, so against the dollar the rupee is worth roughly a third of what it was. But the dollar is one currency, and India does not trade only with America. Weigh the rupee against the whole basket of countries India actually buys from and sells to, and then strip out the one thing that was always going to drag it down, the fact that prices in India rose faster than prices abroad, and the picture flips completely. On that measure, the real, inflation-adjusted, trade-weighted rupee is almost exactly where it sat in 1994. It did not collapse. It drifted down against the dollar at very nearly the speed its extra inflation demanded, which is another way of saying the number did what it was supposed to do. The scary headline and the boring truth are the same currency. One is just wearing a costume."
      ].join("\n\n")
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
  if (evidence.questionId === "q.states.demographic_finances") {
    const demFinPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer what happens to a state's budget when its population grows old, in the voice of someone who knows Indian public finance and demography cold and refuses to let a national average stand in for a country ageing at thirty different speeds. The through-line is one unfair pattern: India's richest, most-developed states are growing old first, while its poorest states are still young, so the states best able to pay for ageing get the bill earliest and the states with the least money get a short, closing window to prepare. Walk the argument in order: (1) open on the map of ageing over time, the whole thesis in one image, the grey wave reaching the south and west first and Bihar and UP last; (2) make ageing concrete as a support ratio, how many elderly each 100 workers carry, already two-to-one across states; (3) show who is ageing fastest, not just who is oldest; (4) put one young state and one old state a generation apart on the same line; (5) reveal the fiscal engines, that the older states are the ones that raise most of their own taxes while the young states lean on Delhi; (6) the mirror image of transfer dependence; (7) the whole federation's own-revenue effort at a glance; (8) the self-reliance map; (9) the squeeze, that in the ageing states a third of running spending is already locked into interest and pensions; (10) the committed-spending map; (11) and (12) how spending tilts from education in young states to health in old ones; (13) where pensions already eat the budget; (14) the national support ratio climbing through 2036, the window one generation wide; (15) and close on who built revenue muscle while the window was open. Carry the argument forward section by section; never treat the charts as a disconnected list. Be scrupulously honest: the age structure is a 2020 projection, not a census; all fiscal comparisons are internal shares, not per-rupee-of-GSDP or per-person, and run through 2023-24 actuals; committed spending here is interest plus pensions only because salaries are not separable in this data; transfer dependence is partly by design, since devolution is meant to equalise; and ageing is not only a burden, a healthy older workforce can be a second dividend. Never claim a single cause. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and its states, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: demFinPlanned.length
        ? [
            ...demFinPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}"`),
            "A closing reader-question H2, 'How should you read these numbers?', a short honest methodology paragraph. Name the sources plainly: the RBI's e-STATES database, from its annual report State Finances: A Study of Budgets of 2025-26, for all the fiscal figures (state budgets, 1990-91 to 2023-24 actuals); and the age-structure projections from the Report of the Technical Group on Population Projections (Ministry of Health and Family Welfare, 2020), as published in that RBI report. State plainly that the age figures are PROJECTIONS made in 2020, not a census count; that the long-history cross-state comparisons are internal SHARES (a slice of the state's own revenue or spending), comparable across states of very different size; that a separate set of charts instead measures fiscal flows against the economy (per cent of GSDP) and per person, using GSDP and per-capita income from the RBI Handbook of Statistics on Indian States 2024-25 (current prices, 2011-12 series), so those charts begin only in 2011-12 and rely on a state population derived as NSDP divided by per-capita NSDP, an estimate and not a census count; that figures run to 2023-24, the latest actuals, while 2024-25 and 2025-26 in the budget books are revised and budget estimates; that committed spending here means interest plus pensions only, because salaries cannot be separated cleanly, so true budget rigidity is higher; that states are grouped by their 2026 elderly share, and group lines are aggregates a single big state can pull; and that several forces moving together is not proof any one caused the pattern. Write it as a short, honest paragraph, not a reference list."
          ]
        : [
            "Is India ageing all at once?",
            "How heavy is the ageing load already?",
            "Where is the grey wave rising fastest?",
            "How far apart are the youngest and oldest states?",
            "Who pays their own way, and who leans on Delhi?",
            "How much of the budget is already spoken for?",
            "Do young and old states spend differently?",
            "Where do pensions already eat the budget?",
            "How wide is the window?",
            "How should you read these numbers?"
          ],
      requiredConcepts: [
        "The framing fact and the spine of the whole article: India is not ageing as one country, it is ageing at thirty different speeds, and its richest states are ageing first. The RBI classifies states by the share of people aged 60 and above: ageing if 15% or more, intermediate if 10 to under 15%, youthful if under 10%. In 2011 every major state was youthful or intermediate; by 2026 Kerala and Tamil Nadu cross into ageing; by 2036 more than half the major states are ageing and none are still youthful. The national average (about 8.4% in 2011, 11.4% by 2026, 14.9% by 2036) hides this entire spread",
        "Ageing made concrete as the old-age dependency ratio, the number of people aged 60-plus for every 100 of working age (15 to 59). In 2026 it already ranges more than two-to-one across states: about 30 elderly per 100 workers in Kerala against about 14 in Bihar, with the national average about 18 (rising to about 23 by 2036). This is the support ratio that ultimately drives pension and health pressure",
        "The cruel asymmetry that makes this an Indian-specific story: the states ageing first (Kerala, Tamil Nadu, then the rest of the south and west) are the richer, more-developed ones, while the states that stay young longest (Bihar, Uttar Pradesh, Madhya Pradesh, Rajasthan, Jharkhand) are the poorest. So the places with the deepest tax bases get the ageing bill first, and the places with a closing window to prepare have the least money to do it with. A young state is not safe, it is Bihar getting Kerala's problem later with less money",
        "Why the timing differs: fertility and life expectancy vary sharply. India's total fertility rate has fallen to about 2.0, below replacement; only seven states (Bihar, Uttar Pradesh, Madhya Pradesh, Rajasthan, Chhattisgarh, Jharkhand and Assam) are still at or above the replacement rate of about 2.1, and these are exactly the youthful states. Life expectancy ranges from about 65 years in Chhattisgarh to about 76 in Delhi; lower-fertility, longer-living states age first",
        "The counter-intuitive fiscal engine, a central finding: the ageing states are the fiscally self-reliant ones. In 2023-24 Kerala raised about 60% of its total revenue from its own taxes, against about 25% for Bihar, which depends on central transfers (its share of central taxes plus grants) for most of its budget. As a group the ageing states raise well over half their revenue themselves while the youthful group raises only a quarter to a third. Richer, older states simply have deeper tax bases",
        "The mirror image, transfer dependence: the young, poor states get most of their budget from the Centre through tax devolution and grants. This is partly by design, because the Finance Commission's formula is meant to equalise across unequal states, so a high transfer share is not failure. But it does leave the youthful states more exposed to central decisions and less in control of their own fiscal fate",
        "The squeeze, the heart of the article: as a state ages, more of its budget is pre-committed before it can spend on anything new. Committed spending here is interest payments plus pensions as a share of revenue (running) expenditure. Over 2000-01 to 2023-24 the youthful states cut this share from about 29% to about 22%, gaining fiscal room, while the ageing states stayed stuck near a third (about 32%). In 2023-24 Kerala's committed share was about 37% against Bihar's about 22%. A third of every rupee of running spending locked in interest and pensions leaves little for new schools, hospitals or transfers",
        "Be precise and honest about what committed spending includes: this measure is interest plus pensions only, because salaries cannot be separated cleanly in this data. True budget rigidity (adding salaries) is higher everywhere, so the gap shown understates the squeeze rather than exaggerating it. High interest reflects past borrowing (so Punjab and West Bengal rank high regardless of age), while high pensions reflect ageing and past government hiring; the committed-spending map mixes both forces",
        "How spending tilts with age: the youthful states put a clearly bigger share of revenue spending into education (where their children are), about 18% against about 15% for the ageing states in 2023-24, a gap that has persisted and even widened over two decades. Crucially, a higher education SHARE in young states is not higher rupees per child or higher quality, because young states have far more children to spread the money across. HEALTH, by contrast, is a near-null result and must NOT be described as an ageing tilt: every group spends only about 5% of its revenue budget on medical and public health; the ageing states ran marginally ahead for most of the 2000s and 2010s, all groups jumped together during COVID-19, and by 2023-24 the lines had converged with almost nothing between them (the ageing group was in fact slightly the lowest). Health budgets serve all ages, so demography barely moves them; the real fiscal cost of ageing is pensions, not health",
        "Where pensions already bite, in 2023-24: pension outgo is a large slice of revenue expenditure in the hill and older states, led by Himachal Pradesh (about 22%), with Assam, Kerala, Punjab and Uttarakhand also high. This is today's pension bill from PAST hiring, not future ageing; the shift from the defined-benefit Old Pension Scheme (OPS) to the contributory National Pension System (NPS), and some states reverting to OPS, will reshape this bill for decades",
        "The policy lever the RBI emphasises, to be presented even-handedly as one side of a genuine debate: moving from the Old Pension Scheme to the National Pension System reduces the future fiscal burden of ageing, but several states have moved back to OPS for their employees, which is popular but raises long-term pension liabilities. Present both the fiscal-sustainability case and the reason reversion is politically attractive; do not take a partisan side",
        "The window framing for the close: India's old-age dependency ratio drifts up gently to 2021 then climbs faster toward 2036 as large mid-century-born cohorts retire, so the demographic dividend window is roughly one generation wide and the easiest fiscal years are now. The honest forward message by group: youthful states should build human capital (education, skilling, health) and strengthen their own tax base while they still can; intermediate states should balance growth with early preparation for ageing; ageing states should expand revenue capacity and reform healthcare, pension and workforce (including retirement-age) policy. Ageing is not only a burden, a healthier older workforce working longer can be a second dividend",
        "The GSDP lens, a myth-buster that must be stated carefully: measured against the SIZE of the economy (per cent of GSDP), the demographic groups tax themselves almost identically, all around 6 to 7% of GSDP, and the ageing group has if anything drifted down toward the others. So the wide gap in own-tax SHARE from the previous act (ageing states raising about 60% of revenue themselves, youthful states about 25%) is NOT because ageing states tax their people harder; it is because they receive far smaller central transfers. Their self-reliance is mostly the arithmetic of fewer transfers, not of heavier taxation",
        "The size-of-government surprise from the GSDP lens: the youthful, poorer states run the BIGGEST governments relative to their economies, spending about 17% of GSDP against about 12% for the intermediate and ageing groups. This is largely because their economies are small and central transfers are large, so the state looms larger over a smaller economy, not because they deliver more per person",
        "The per-capita income gap, the income dimension behind the whole ageing story (RBI Handbook, per-capita NSDP, current prices, 2023-24): the ageing states are simply the rich ones. Per-capita income runs about Rs 2.8 lakh in Kerala and Rs 3.1 lakh in Tamil Nadu against about Rs 62,000 in Bihar and Rs 97,000 in Uttar Pradesh, a gap of roughly four to five times. The income map and the ageing map are nearly the same map",
        "The rupees-per-person resolution, which corrects any complacency that shares look similar: although the budget SHARE spent on health or services is similar across states, in RUPEES PER PERSON the gap is large. Total revenue spending per resident runs about Rs 45,000 to 60,000 in the small hill and special-category states (Himachal Pradesh, Jammu and Kashmir, the northeast) against about Rs 15,000 in Bihar and Rs 18,000 in Uttar Pradesh, three to four times less, and per-person health spending follows the same pattern. Caveat: small states rank high partly because they have few people and large grants, and per-person spending is not the same as service quality or outcomes",
        "DATA-NATURE DISCIPLINE: the age-structure figures (60-plus share, old-age dependency, the year a state turns 'ageing') are PROJECTIONS from the 2020 Technical Group, not measured census counts, and the later years (2031, 2036) are less certain because projections compound; always frame them as projections and never as observed fact",
        "SHARE DISCIPLINE: most cross-state comparisons in this article are internal shares (a slice of that state's own revenue or spending), comparable across states of very different size and matching how the RBI presents its grouped tables; keep these distinct from the per-GSDP and per-person charts, which DO measure against the economy and population and which begin only in 2011-12. Never describe an internal-share figure as if it were rupees per person or a share of GSDP, or vice versa",
        "VINTAGE DISCIPLINE: all fiscal figures run through 2023-24, the latest year of actuals (Accounts); 2024-25 figures in state budgets are Revised Estimates and 2025-26 are Budget Estimates (intentions, not outcomes), so the time series stop at 2023-24 and any reference to current-year budgets must be flagged as an estimate. Also note that Telangana (formed 2014) and Chhattisgarh, Jharkhand and Uttarakhand (formed 2000) have shorter fiscal histories, and that the smallest states and union territories are left off the maps",
        "NUMBER DISCIPLINE is absolute: every statistic in the prose must come from the evidence packet's locked numbers or the specific figures stated in these concepts; never invent, recall or estimate a number. Present figures as rounded approximations ('about 60%', 'roughly a third', 'about 30 per 100 workers'), never false-precision decimals, and anchor every number when it first appears. Where independent estimates differ, let the gap carry meaning rather than forcing a single number",
        "Keep the macha layer warm and plain-spoken, a sharp friend explaining what India's lopsided ageing really means for the money: the country is running thirty demographic clocks at once, the rich states' alarms are going off first, and the averages flatter no one. The playfulness lives in the headings; the body stays grounded and genuinely helpful, and it summarises what the whole page means, not one chart"
      ],
      styleExample: [
        "## So is India about to grow old?",
        "Parts of it already have, and parts of it have decades to go, and that gap is the whole story. There is no single Indian clock. There are about thirty, and they are not even close to synced. In Kerala almost one person in five is over sixty, the kind of age structure you see in a rich, greying country, and for every hundred working-age Keralites there are already about thirty elderly to support. In Bihar that number is fourteen, and most of the state is still young. Here is the catch nobody planned for: the states that grew old first are the richer ones, the ones that can actually raise their own money. The states that are still young are the poor ones, the ones who will get the same ageing bill later with far less in the bank. India's demographic dividend is real. It is just not one dividend, and it is not going to everyone, and the window to use it is closing fastest exactly where there is the most money and slowest where there is the least."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.energy.state_transitions") {
    const stPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer whether India's electricity is really getting cleaner, in the voice of someone who knows the power sector cold and refuses to let a national average stand in for thirty wildly different state grids. The through-line is a single reframing: there is no one Indian electricity transition, there are about thirty, and the national number is an average that hides almost everything that matters. Walk the argument in order: (1) open on the state map of carbon intensity, the whole thesis in one image, grids ranging from near-zero-carbon to almost pure coal; (2) zoom out to the true national headline, the clean share has genuinely climbed from about a sixth to over a quarter of generation; (3) deliver the honest twist, that a rising clean SHARE hides coal generation almost quadrupling in absolute terms, because demand grew faster than clean supply; (4) explain why installed capacity is not the same as generation, using capacity factors, so the reader understands a megawatt of solar is not a megawatt of coal; (5) explain WHY states diverge, the crucial distinction between a grid that was born clean on inherited Himalayan hydro and one that built its way clean with new wind and solar, shown as three different maps; (6) show where the building actually happened, a handful of states doing most of the wind and solar; (7) apply the decisive test, of the new electricity each state added since 2019, how much was clean versus coal, where the national answer is a sobering one quarter; (8) show that in absolute tonnes power emissions are still climbing across almost every state, the hard counterpoint to the rising clean share; (9) anchor where the emissions physically come from in absolute mass; (10) and close on the seasonal rhythm, how hydro and wind surge with the monsoon while coal eases off. Carry the argument forward section by section; never treat the charts as a disconnected list. Be scrupulously honest: this is generation inside a state, not the power its people consume, because electricity crosses state lines; a high clean share is often inherited hydro, not transition leadership; capacity is not generation and a low capacity factor is physics not failure; falling carbon intensity is not the same as falling emissions; and one year of monthly data shows a seasonal shape, not a trend. Never claim a single cause. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and its electricity, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: stPlanned.length
        ? [
            ...stPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}"`),
            "A closing reader-question H2, 'How should you read these numbers?', a short honest methodology paragraph. Name the sources plainly: Ember's India electricity data at state level, which Ember compiles from India's Central Electricity Authority (CEA) and Ministry of New and Renewable Energy (MNRE) and releases under a Creative Commons licence; and Ember's separately-built national electricity series for the 2000-2024 long view. State plainly that the state-level data covers calendar years 2019 to 2024 only, so it is a snapshot of the current transition and not a long trend; that all figures are electricity GENERATED inside a state, not consumed there, so big generator states that export power look different from where the power is used; that the clean-grid carbon intensity floor of about 24 gCO2/kWh is a methodology constant, not a measured zero; and that several factors moving together is not proof any one caused the pattern. Write it as a short, honest paragraph, not a reference list."
          ]
        : [
            "How clean is each state's electricity?",
            "Is the national grid actually getting cleaner?",
            "If the clean share is rising, why are emissions still climbing?",
            "Why are some states so much cleaner than others?",
            "Where did India actually build its wind and solar?",
            "Where do India's power emissions actually come from?",
            "Who is moving, and who is sliding backwards?",
            "How should you read these numbers?"
          ],
      requiredConcepts: [
        "The framing fact and the spine of the whole article: India does not have one electricity grid getting cleaner at one pace, it has about thirty state grids that range from almost zero-carbon to almost pure coal. In 2024 the carbon intensity of state power generation runs from about 24 gCO2/kWh in the hydro-rich Himalayan and northeastern states (Himachal Pradesh, Jammu and Kashmir, Sikkim, Arunachal Pradesh and others) to over 800 in the coal belt (Bihar and Jharkhand about 815, Chhattisgarh about 806). The national average is about 620 gCO2/kWh. The national number is an average that hides this entire spread",
        "The true national headline, which must be stated before it is complicated: the clean share of India's electricity generation (renewables plus nuclear) has climbed from about 17% in 2000 to over a quarter (about 27%) by the mid-2020s. The grid genuinely is getting cleaner in this sense. Clean here means renewables plus nuclear, not renewables alone",
        "The honest twist that is the heart of the article: a rising clean SHARE does not mean falling coal. In absolute terms India's coal generation almost quadrupled over the same period, from roughly 390 TWh in 2000 to nearly 1,500 TWh in 2024, because total electricity demand grew faster than clean supply could be added. Solar generation rose from essentially zero to roughly 200 TWh, real and steep, but still small next to coal. Both facts are true at once: the clean slice of the pie grew while the coal slice grew too, because the whole pie grew. Hold them together",
        "Capacity is not generation, and the gap is the point: in 2024 solar was about 21% of India's installed capacity but only about 7% of the electricity actually generated, and wind about 10% of capacity for about 4.5% of generation, while coal was about 47% of capacity but about 74% of generation. The reason is the capacity factor, the share of the year a source runs at full output: roughly 76% for nuclear and 69% for coal, against about 34% for hydro, 19% for wind and only 16% for solar. A low capacity factor is physics, not failure; it means India must install far more solar to match the yearly output of a coal plant. Present these as approximate figures",
        "The crucial distinction that explains why states diverge, and the single most important honesty point: a clean grid can mean two completely different things. Some states were born clean on inherited large hydro decided by geography (Himachal Pradesh generates almost entirely from hydro, around 100%), which is not a transition anyone is running. Other states built their way clean with new wind and solar (Rajasthan, Gujarat, Tamil Nadu). A high clean share is therefore NOT the same as leading the energy transition, and the article must never conflate the two",
        "The decisive marginal test, which is the strongest single finding in the piece: of all the extra electricity India generated between 2019 and 2024 (generation rose about 31%, from roughly 1,380 to 1,800 TWh), only about a quarter (around 26%) came from clean sources; roughly three-quarters of the new power was fossil. By state the spread is stark: Gujarat met more than all its new demand with clean power (it actually cut fossil generation), Rajasthan about 69% and Tamil Nadu about 61%, while Bihar met essentially 0%, Odisha and West Bengal about 1%, Chhattisgarh about 4% and Uttar Pradesh about 5% of their growth with clean power. A high clean share of TOTAL generation can hide a dirty MARGIN of new growth",
        "The hard counterpoint on emissions, which the article must not soften: in absolute tonnes India's power-sector CO2 is still rising almost everywhere. National power emissions rose by roughly 267 million tonnes between 2019 and 2024. The biggest increases were Chhattisgarh (about +42 million tonnes), Uttar Pradesh (about +33), Madhya Pradesh (about +26), Odisha (about +23) and Bihar (about +21); Gujarat was almost the only state to cut its power emissions meaningfully (about -2.4 million tonnes). Falling carbon intensity per unit does not mean falling total emissions, because generation is growing so fast",
        "The seasonal rhythm, from 2024 monthly data: India's renewable output swings hard with the monsoon. Wind generation nearly quadruples from its November low to its July peak (about a 4.4-fold swing), hydro more than triples from its February low to its August-September peak (about a 3.6-fold swing), while solar is comparatively steady (about a 1.4-fold swing across the year). Coal generation dips during the monsoon months (it falls from about 123 TWh in May to about 100 TWh in September) as hydro and wind fill in. This is one year, so it shows a seasonal shape, not a trend",
        "The three-Indias geography, to be described from the maps: hydro dominates the Himalayan north and the northeast; wind and solar dominate the western desert (Rajasthan, Gujarat) and the south (Tamil Nadu, Karnataka, Andhra Pradesh); coal dominates the east and the Gangetic plain (Chhattisgarh about 98% coal, Bihar and Jharkhand about 99% fossil, West Bengal, Uttar Pradesh, Odisha)",
        "Where the wind and solar were actually built, by installed capacity in 2024 (in megawatts): Rajasthan leads at about 31,700 MW, Gujarat about 29,300, Tamil Nadu about 20,900, Karnataka about 15,700, Maharashtra about 14,200. A handful of states are doing most of the building. Be clear that installed capacity is not generation: solar and wind are intermittent, so a megawatt of solar produces far fewer units over a year than a megawatt of coal",
        "Where the power-sector emissions physically come from, in absolute tonnes in 2024 (this is mass, a different question from intensity): Chhattisgarh emits the most at roughly 135 million tonnes of CO2, followed by Uttar Pradesh about 132 and Madhya Pradesh about 121. Intensity tells you how dirty each unit is; absolute emissions tell you where the tonnes are, which is where decarbonisation has to happen. A big coal-burning state can top the absolute list without having the single highest intensity",
        "Who actually moved between 2019 and 2024, measured as the change in clean share of generation in percentage points: Rajasthan rose the most (about +17 points) and Gujarat also jumped, on new solar and wind. Crucially, being clean today and getting cleaner are different things, and some states went backwards: Karnataka's clean share FELL by about 10 points over these years. Present this honestly, including the backsliders",
        "The hydro-volatility caveat, essential for reading the 2019-2024 change honestly: states that lean on hydro swing with the monsoon. A dry year cuts hydro output and the clean share can fall even if the state burnt no extra coal. So a single-year change can mislead, and Karnataka's apparent slide partly reflects rainfall and fast-growing demand, not a deliberate turn back to coal. Read multi-year direction, not one endpoint gap",
        "The consumption-versus-generation caveat, which must be stated wherever per-state figures appear: every number here is electricity GENERATED inside a state, not the electricity its residents consume. Power crosses state lines constantly, so a state can generate a lot of coal power that is used elsewhere, and a low-generating state is not necessarily a low-consuming one. This is a map of where power is made, not where it is used",
        "VINTAGE DISCIPLINE: the state-level data covers calendar years 2019 to 2024 only, a six-year snapshot of the current transition, not a long historical trend; the national long-arc series runs from 2000 and extends to about 2025. Always keep the difference clear and never imply the state data shows a multi-decade trend",
        "NUMBER DISCIPLINE is absolute: every statistic in the prose must come from the evidence packet's locked numbers or the specific figures stated in these concepts; never invent, recall or estimate a number. Present figures as rounded approximations ('about 27%', 'nearly 1,500 TWh', 'roughly 31,700 MW'), never false-precision decimals. The clean-grid carbon-intensity floor of about 24 gCO2/kWh is a methodology constant applied to clean-dominated grids, not a measured value, and should not be over-read. Anchor every number when it first appears",
        "Keep the macha layer warm and plain-spoken, a sharp friend explaining what India's lopsided electricity transition really means: the country is not cleaning up its grid evenly, it is running thirty different experiments at once, and the averages flatter the laggards while hiding the leaders. The playfulness lives in the headings; the body stays grounded and genuinely helpful, and it summarises what the whole page means, not one chart"
      ],
      styleExample: [
        "## So is India's electricity actually getting cleaner?",
        "Yes, and also not really, and the honest answer is that the question is wrong. There is no single Indian grid to get cleaner or dirtier. There are about thirty, and they could hardly be more different. Plug something in in Himachal Pradesh and the electricity behind it is almost entirely hydro, near zero carbon, because the mountains were always going to make power that way. Plug the same thing in in Bihar and you are running on almost pure coal. Nationally the clean share has climbed from about a sixth of the grid to over a quarter, which is real progress and worth saying plainly. But that average is doing a lot of quiet work, smoothing the desert states racing to build solar together with the coal-locked east that has barely moved, and hiding the fact that underneath the rising clean share, India kept burning more coal every year, not less, because it needed more of everything. The transition is real. It is just not one transition, and it is not happening to everyone."
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
  if (evidence.questionId === "q.econ.foreign_investment") {
    const fiPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Explain what India's foreign-investment numbers actually mean, in the voice of someone who knows balance-of-payments accounting and global capital flows cold and is patient with a smart reader who has never been taught the difference between FDI and FII. The whole article is a myth-buster built on two misreads. Misread one: people read the NET foreign direct investment line (which fell from about 43 billion dollars in 2019-20 to under 1 billion in 2024-25) as if foreigners had stopped coming, when GROSS inflows actually rose to a record of about 81 billion dollars over the same years; net collapsed because money flowing back out (repatriation and Indians investing abroad) grew, not because money coming in shrank. Misread two: people blame Delhi for every portfolio (FII) outflow, when the bigger lever is global, the US dollar, US interest rates and global risk appetite. Walk the argument in order: (1) the scary headline net-FDI number; (2) what FDI and FII even are, control versus portfolio, patient versus hot money; (3) gross versus net, the central trick, gross hit a record the year net 'collapsed'; (4) why a flow turns negative, repatriation as a sign of a maturing market; (5) Indians investing abroad, India as a capital exporter with an outward stock that went from under 2 billion to about 260 billion dollars; (6) the FII rollercoaster shown monthly, where hot money really shows its character; (7) that not all FII is alike, equity and debt often move in opposite directions, with the bond-index inclusion driving debt; (8) what actually moves FII money, the dollar and the Fed more than Delhi, shown honestly as a tilt not a law; (9) the tax-haven puzzle, FDI routing through Mauritius and Singapore while portfolio money is genuinely American; (10) the global lens, India as a small and lagging slice of world FDI. Because the reader is a layperson, define every piece of jargon in plain words the first time it appears (FDI, FII/FPI, gross, net, repatriation, balance of payments, the Fully Accessible Route, assets under custody, the dollar index, the VIX). Be scrupulous about correlation versus causation in the drivers section, and about which 'foreign investment' number is being used, because RBI balance-of-payments, DPIIT, NSDL depository and UNCTAD figures are all different and must never be silently mixed. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and foreign money, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: fiPlanned.length
        ? fiPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "Is foreign money really fleeing India?",
            "What is the difference between FDI and FII?",
            "If FDI 'collapsed', why did gross inflows hit a record?",
            "Why does foreign investment flow back out?",
            "Are Indian companies now investing abroad?",
            "Why is FII money so volatile?",
            "Is all foreign portfolio money the same?",
            "What actually drives foreign investors in and out of India?",
            "Where does India's foreign money actually come from?",
            "How does India compare with the rest of the world?"
          ],
      requiredConcepts: [
        "The central myth-buster, stated precisely: India's NET foreign direct investment fell from about 43 billion US dollars in 2019-20 to about 1 billion in 2024-25, and this is what the panic is built on. But GROSS FDI inflows actually ROSE over the same period, from about 74 billion dollars to a record of about 81 billion. Net did not collapse because foreigners stopped coming; it collapsed because the money flowing back OUT grew. Net FDI equals gross inflows minus repatriation minus FDI by Indians abroad. Reading the net line as if it were the gross line is the single biggest mistake in this whole subject. All these RBI figures are independently cross-checked against IndiaDataHub to the dollar",
        "What FDI and FII actually are, defined plainly: Foreign Direct Investment (FDI) is money that buys lasting control of a business, conventionally a stake of 10 percent or more; it is 'patient' money that builds factories and stays. Foreign Institutional / Portfolio Investment (FII, now formally FPI) is money that buys shares and bonds on the market for returns, owning too little to control anything; it is 'hot' money that can be sold and pulled out tomorrow. They are recorded separately in the balance of payments (the national ledger of money in and out of the country), and they behave completely differently: FDI is steady, FII is a rollercoaster",
        "Why the net FDI number fell, decomposed: between 2019-20 and 2024-25 repatriation (profits, dividends and exit proceeds that foreign investments send back home, plus disinvestment) nearly tripled, from about 18 billion to about 51 billion dollars, and outward FDI (Indian firms investing abroad) roughly doubled, from about 13 billion to about 28 billion dollars. Gross inflows held up at a record; the two outflows grew. So a near-zero net FDI is partly a sign of MATURITY, older investments paying profits home and Indian companies going global, not foreigners fleeing",
        "Why a flow can be negative, said reassuringly and accurately: a negative or near-zero net figure does not mean catastrophe. Repatriation is normal and rises as a stock of past investment matures and pays profits home; disinvestment is investors exiting; and portfolio (FII) money leaves whenever global conditions turn. A maturing, profitable market repatriates more, almost by definition. Negative months and falling net lines are normal capital-flow behaviour, not a referendum on India",
        "India has quietly become a capital EXPORTER, not just a recipient. India's stock of outward FDI (the accumulated value of investments Indian firms hold abroad) grew from about 1.7 billion dollars in 2000 to roughly 260 billion by 2024 (UNCTAD). The annual outward flow roughly doubled from about 13 billion dollars in 2019-20 to about 28 billion in 2024-25. This is the conglomerates, the IT majors and overseas subsidiaries, and includes round-tripping; two-way capital flow is what maturing economies like Korea and China did at similar stages",
        "The FII rollercoaster, with the honest numbers: net portfolio (FII/FPI) investment swung from about plus 36 billion dollars in 2020-21 to about minus 17 billion in 2021-22 to about plus 44 billion in 2023-24. At monthly resolution it is wilder still: roughly minus 14.6 billion dollars in March 2020 (the COVID shock) and about plus 11 billion in November 2020. This volatility is the entire point of 'hot money'. These RBI monthly figures match IndiaDataHub's net-FPI series to the dollar",
        "Not all FII is the same, and lumping it together hides the story: foreign portfolio money splits into equity and debt, and they often move in OPPOSITE directions. Use the financial year 2024-25 for this contrast, the bond-index year, and NEVER the latest partial fiscal year (the current year has only a couple of months of data and shows debt barely moving, which is misleading). In 2024-25 foreigners SOLD a net of about 1.27 lakh crore rupees of Indian equities while BUYING a net of about 1.43 lakh crore rupees of Indian debt, of which about 80,000 crore (roughly 80,691 crore) came through the Fully Accessible Route (FAR). So debt genuinely poured in even as equity walked out. Always quote these 2024-25 figures, not the small numbers from the incomplete current year. Show the equity-versus-debt split in rupees, which reconcile exactly",
        "Where FDI actually GOES, by sector, an honest verdict on 'Make in India': on a cumulative-equity basis (DPIIT), India's FDI is overwhelmingly services and technology, not factories. Services (finance, banking, insurance and other services) is the largest single sector at about 119 billion dollars (about 16% of the total), and computer software and hardware is second at about 111 billion (about 15%), so those two alone are roughly a third of all FDI. Trading, telecommunications, the automobile industry, infrastructure construction and pharmaceuticals follow well behind. The fair reading: foreign money mostly chased India's services and digital economy, while manufacturing, the stated target of industrial policy, drew a noticeably smaller share. State this as the cumulative DPIIT picture, narrower than RBI balance-of-payments FDI and a stock since 2000, not a single year",
        "What actually moves FII money, stated as a tilt and never as a law: India's monthly FII equity flows are negatively correlated with global financial conditions over 2011-2026. A strengthening US dollar against emerging-market currencies has the clearest link (correlation about minus 0.37), followed by emerging-market volatility (about minus 0.34), the global VIX 'fear index' (about minus 0.33), the US 10-year Treasury yield (about minus 0.12) and the US Fed funds rate (about minus 0.11). As a rough sensitivity, a one-point monthly rise in the emerging-market dollar index is associated with about 840 million dollars of net FII equity LEAVING, and the dollar hits equity far harder than debt. The honest reading: these correlations are MODERATE, so global weather (the Fed, the dollar, risk appetite) meaningfully TILTS flows but does not fully determine them. This is correlation, not proven causation; the rupee's even stronger link is excluded as partly circular, since FII selling itself weakens the rupee. The payoff for the reader: blaming Delhi politics for every outflow is half-wrong, and so is crediting reform for every inflow",
        "The tax-haven puzzle, the sharpest contrast in the piece. Where FDI 'comes from': on a cumulative basis to 2024-25, Mauritius (about 180 billion dollars, roughly a quarter of all FDI) and Singapore (about 175 billion, about another quarter) together account for nearly half of India's cumulative FDI equity, with the United States a distant third at about 71 billion (DPIIT data). These small jurisdictions are treaty-routing hubs, not the ultimate origin of the money. Now flip to portfolio money: foreign portfolio assets held in India total about 74.8 lakh crore rupees (around 900 billion dollars) as of May 2026, and the United States ALONE is about 41 percent of that, with Mauritius down at under 5 percent (NSDL custody data). So FDI routes through tax havens to game treaties, while FII, where treaty-shopping matters far less, reveals itself as genuinely American money. Caveat plainly: the DPIIT cumulative-equity basis differs from RBI's balance-of-payments FDI, and assets under custody are a STOCK of holdings, not annual flows",
        "The global lens, to right-size the panic: India is a small slice of world FDI, usually around 2 to 3 percent of global inflows, so a swing in the global total moves India's number a lot and the recent dip is partly a worldwide FDI slowdown, not just India's. In the latest year of UNCTAD data (2024), inward FDI was about 279 billion dollars for the United States, about 143 billion for Singapore, about 116 billion for China and about 59 billion for Brazil, against roughly 28 billion for India. India attracts less FDI than its economic size might suggest and sits well behind the leaders; treat any single year's flow as volatile and read the trend",
        "Honesty and methodology rules the article must hold to, suitable for the closing caveats section. Never silently mix the four different 'foreign investment' measures: RBI balance-of-payments (used for the gross/net/repatriation/outward story, fiscal years), NSDL depository data (used for the equity-versus-debt FII split, in rupees), DPIIT (used for cumulative FDI by source country), and UNCTAD (used for the global comparison and outward stock, calendar years). Gross is not net; commitments are not actual flows; assets under custody are a stock, not a flow; a calendar year is not a fiscal year. The NSDL equity and debt series are shown in rupees because they reconcile exactly, while the dollar version carries a one-month source glitch. The second depository, CDSL, republishes essentially the same all-India figures as NSDL, so the two must never be added. And in the drivers section, several global factors moving with FII flows is evidence of a tilt, never proof that any one of them caused a given month's move"
      ],
      styleExample: [
        "## If FDI 'collapsed', why did gross inflows hit a record?",
        "Because the number everyone quotes is the net figure, and net is a subtraction. Picture two taps and a drain. The tap pouring foreign money into Indian businesses, the gross inflow, was running harder than ever in 2024-25: about 81 billion dollars, the most on record. What changed is the drain. More foreign companies were sending profits and exit money home, and more Indian firms were sending their own money abroad to buy and build overseas. Net FDI is just the gross inflow minus everything flowing back out, and when the outflows swell, the net can fall to almost nothing even while the inflow sets records. So the headline that foreign investors have abandoned India gets the direction exactly wrong. They came in record numbers. It is just that, for the first time, almost as much was heading the other way, some of it because Indian companies have grown big enough to invest abroad themselves."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.health.transition") {
    const planned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer the qualified question 'Is India getting healthier?' using the locked World Bank HNP, World Bank HNP wealth-quintile, and NFHS evidence only. The thesis is: yes on survival and service reach; not yet on nutrition, equality, state spread, rural-urban difference, adult metabolic risk, and household financial protection. World Bank supplies the long global/comparator frame and modelled or harmonised national indicators. NFHS supplies India-native survey facts for 2019-21 to 2023-24, including national change, state/UT spread, and rural-urban gaps. Wealth-quintile World Bank data supplies the distributional warning by household wealth. Write this as a tight public-data essay, not a medical advice article and not a policy manifesto. The prose must be candid about what the data cannot prove: no causal claims, no state-level claims unless the evidence says so, no pretending survey-year data is current-year data, and no ranking countries when the latest years differ. Never use em-dashes.",
      requiredSections: planned.length
        ? planned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "Are Indians living longer?",
            "Are children surviving?",
            "Are mothers safer?",
            "Is service delivery reaching families?",
            "Where does the health story still fail?",
            "Who is left behind?",
            "What is changing in adult health?",
            "Can the system pay for this?",
            "How to read these numbers"
          ],
      requiredConcepts: [
        "The answer type is qualified, not a simple yes or no. India is clearly healthier on survival: World Bank life expectancy is about 72.2 years in 2024, under-5 mortality is about 26.6 per 1,000 live births in 2024, and maternal mortality is about 80 per 100,000 live births in 2023. But nutrition and adult risk keep the answer from being celebratory",
        "World Bank HNP is an aggregator. The database was updated in 2026, but each indicator has its own latest year. Mortality and life expectancy are estimates/modelled series; expenditure is national accounts-style health spending; nutrition and skilled-birth indicators often come from household surveys. Always name the latest year when using a number",
        "The strongest global contrast: India is now below the world and lower-middle-income averages on under-5 mortality, but it still trails better Asian comparators such as Vietnam, Sri Lanka and China. This is progress, not arrival",
        "Maternal mortality should be read as a broad modelled level. India's latest value is lower than Bangladesh, Pakistan, Indonesia, the world and the lower-middle-income average, but far above Sri Lanka and China. Say this as a gap, not as a rank trophy",
        "Vaccination is a relative strength: World Bank measles immunisation puts India at about 97% in 2024, above the world and lower-middle-income averages. NFHS-6 also shows full immunisation rising from 76.6% to 82.6%, measles second dose from 58.6% to 71.8%, and rotavirus from 36.4% to 85.4%",
        "NFHS-6 is a mixed transition, not a simple progress report. Rotavirus vaccination rose 49 points, health insurance 19.2 points, measles second dose 13.2 points, and IFA for 180+ days 11.8 points. But exclusive breastfeeding fell, C-sections rose, women overweight rose, men high blood sugar rose, and wasting barely moved. Use this as the article's India-native depth section",
        "NFHS birth-care facts: institutional births rose from 88.6% in NFHS-5 to 90.6% in NFHS-6; skilled birth attendance from 89.4% to 91.3%; four-plus antenatal visits from 58.5% to 65.2%; iron folic acid for 180+ days from 26.0% to 37.8%; C-section births from 21.5% to 27.2%. C-section rise is a warning to scrutinise care, not proof of bad care by itself",
        "Nutrition is the main counterweight. World Bank's latest India stunting value is 35.5% for 2020, worse than Bangladesh 23.6% in 2022, Vietnam 18.2% in 2023, Indonesia 22.0% in 2023 and Sri Lanka 10.5% in 2024. Because years differ, this is a contrast, not a precise same-year ranking",
        "NFHS-6 improves the India nutrition vintage: child stunting fell from 35.5% in NFHS-5 to 29.3% in NFHS-6. But wasting barely moved, 19.3% to 19.0%; underweight barely moved, 32.1% to 31.8%; adequate diet among children 6-23 months rose from 11.0% to 15.3%, still extremely low. Say the improvement is real but incomplete",
        "NFHS-6 did not measure anaemia. Any current-looking anaemia claim must not be attributed to NFHS-6. World Bank women anaemia is 2023 and child anaemia is 2019; use these only with vintage caveats if at all",
        "Wealth-quintile evidence: in latest available India data, poorest-quintile stunting is 46.1% versus 22.9% in the richest; wasting is 22.5% versus 16.2%; money as a barrier to care is 37.5% versus 8.1%; distance as a barrier is 37.7% versus 10.7%; skilled birth attendance is 81.2% in the poorest versus 96.9% in the richest. This is the fairness section",
        "NFHS state spread evidence: highest-minus-lowest state/UT spreads are large enough to change the diagnosis, including 20.5 percentage points for stunting, 30.1 for underweight, 25.2 for adequate diet, 55.8 for C-section births, 37.5 for women overweight, 29.5 for men high blood sugar and 87.2 for health insurance. Call these survey spreads, not exact rankings",
        "NFHS rural-urban evidence: urban India is higher on four-plus antenatal visits, long-course IFA, C-section births and male high blood sugar; rural India is higher on stunting, underweight and health insurance coverage. Do not describe this as a simple urban healthy, rural unhealthy ladder",
        "Adult metabolic risk is rising in NFHS: women overweight/obese rose from 24.0% to 30.7%, men from 22.9% to 27.3%; high blood sugar or medication rose from 13.5% to 17.8% among women and 15.6% to 20.9% among men. Blood pressure moved down slightly, so do not say all adult risk indicators worsened",
        "Health financing: World Bank says India's total current health expenditure was about 3.34% of GDP in 2023, versus about 10.0% for the world. Out-of-pocket spending was about 43.9% of current health expenditure in India versus about 17.3% for the world. These two percentages have different denominators and must not be mixed as if they were the same measure",
        "System capacity: World Bank has India at about 0.72 physicians per 1,000 people in 2020 and 1.59 hospital beds per 1,000 in 2021, below world averages of about 1.86 physicians and 3.29 beds. Latest years differ, so present this as broad capacity context",
        "Methodology section must explicitly say: latest available does not mean measured this year; World Bank harmonises and models; NFHS is a household survey with sampling error; NFHS-6 fieldwork was 2023-24 and Manipur was not surveyed according to the local NFHS plan; wealth-quintile data is survey-year data and not a live inequality tracker; cross-country nutrition comparisons have different vintages; these data show patterns, not causes"
      ],
      styleExample: [
        "## So is India healthier now?",
        "Yes, if the question is survival. A child born in India is much less likely to die before five than a child born in the 1990s, and a newborn can expect about 72 years of life by the World Bank's latest estimate. That is a large public-health achievement. But the same data refuses the neat victory speech. NFHS-6 still finds roughly three in ten children stunted, nearly one in five wasted, and only about 15% of very young children getting an adequate diet. Adult India is also getting heavier and more diabetic. So the honest answer is not 'India became healthy'. It is that India became much better at keeping people alive, while the next health problems moved into nutrition, chronic disease and the household bill."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.health.overview") {
    const healthPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer how healthy India is, on one canonical flagship page, in the voice of someone who knows Indian epidemiology, public health and health financing cold and writes like a great essayist. The single through-line, stated up front and carried through every act: India's health story has flipped. The old enemy was infection and child death; the new one is the slow, expensive grind of non-communicable disease (heart disease, diabetes, high blood pressure, mental and joint disorders), arriving in a country that is still poor, still undernourished in parts, and that pays for most of its own healthcare out of pocket. Walk the argument in six acts: (1) the great flip, where NCDs overtook communicable disease as India's biggest source of disease burden around 2010; (2) what ails the living, the specific conditions and the measured rise of blood sugar and blood pressure; (3) the double burden, where child undernutrition and adult obesity now coexist, often in the same state; (4) the risk factors, led by air pollution and the metabolic risks; (5) the system and the bill, who actually pays for Indian healthcare and what a hospital stay costs, where the out-of-pocket share is finally falling and insurance is spreading; and (6) a deliberately speculative coda on what cheap GLP-1 drugs (Ozempic and its generics) might mean for a country with ~101 million diabetics. Deliberately triangulate the sources and say which does what: IHME GBD 2023 for the modelled burden, causes and risk attribution; NFHS-5 and NFHS-6 for what the household survey actually measured; the National Health Accounts for the financing mix; Indica's own tabulation of NSS 80th-round unit data for the cost ladder, insurance, hospital choice and childbirth; and the World Bank for the cross-country lens. The disagreements between these systems are informative, not errors: GBD models, NFHS measures, NSS asks households. Carry the argument forward act by act; never narrate the article itself (no 'this chart shows', 'as we saw above', 'the next section'); write about India and Indians, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: healthPlanned.length
        ? healthPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : [
            "Act 1 — The great flip: has India's disease burden really changed?",
            "Act 2 — What ails the living now?",
            "Act 3 — The double burden: hungry children, heavy adults?",
            "Act 4 — What are India's biggest health risks?",
            "Act 5 — Who pays for Indian healthcare, and what does it cost?",
            "Act 6 — What might Ozempic mean for India? (speculative, prose-led, one small chart only — facts about prices and patents are verified, but every population-impact claim must be presented as a scenario with the unknowns stated honestly)",
            "How to read these numbers (methodology and caveats)"
          ],
      requiredConcepts: [
        "The epidemiological flip is the spine of the piece: non-communicable diseases (NCDs) rose from about 26.4% of India's total disease burden (DALYs) in 1990 to about 62.2% in 2023, while the communicable-maternal-neonatal-nutritional group fell from about 65.6% to about 26.6%, with the crossover around 2010. State this as the single most important shift in Indian health",
        "What the burden is made of now: cardiovascular disease is the largest single cause of DALYs, with mental disorders, musculoskeletal conditions, diabetes-and-kidney disease and cancers all rising, while neonatal disorders, respiratory infections and TB, and enteric (diarrhoeal) infections have fallen sharply. The conditions that disable without killing (mental and musculoskeletal) are large and almost certainly under-counted",
        "The household survey corroborates the metabolic rise with measured, not modelled, numbers. NFHS-6 (2023-24) versus NFHS-5 (2019-21): women overweight or obese rose to 30.7% (from 24.0%), men to 27.3%; high blood sugar (including those on medication, a composite measure) reached 20.9% of men and 17.8% of women; elevated blood pressure reached 22.1% of men and 19.4% of women. Use these exact figures",
        "The double burden of malnutrition: child stunting fell to 29.3% (from 35.5% in NFHS-5), even as adult overweight climbed, and the two now coexist, often within the same state. Present this as undernutrition and over-nutrition happening together, not one replacing the other",
        "The risk-factor league table for 2023: air pollution is the single largest, with about 2.0 million attributed deaths (of which household air pollution is about 0.94 million), followed by high blood pressure at about 1.57 million, high blood sugar at about 0.97 million and smoking at about 0.74 million. Risk factors overlap, so these cannot be added together; they are modelled attributable-death estimates",
        "Who pays for Indian healthcare is finally shifting. By the National Health Accounts, the out-of-pocket share of total health expenditure fell from 64.2% in 2013-14 to 43.4% in 2022-23, while the government share rose from 28.6% to 43.7%. This is real progress, but government health spending is still only about 1.43% of GDP (2022-23), low by any standard",
        "The cost of care, from Indica's own tabulation of NSS 80th-round (2025) unit data: the average medical spend per hospitalisation case is about Rs 6,937 in a government hospital versus about Rs 56,215 in a private one, roughly an eightfold gap. About 60.3% of hospitalisation cases now go to private hospitals. Borrowing finances about 15% of hospitalisations. These are Indica's own figures from public microdata; the official report may differ slightly, and this must be flagged every time these numbers are used",
        "The insurance and access story from the same NSS 2025 tabulation: about 46.4% of persons are now covered by some health financing scheme, and rural coverage (47.4%) has overtaken urban (44.3%), a gradient that PMJAY (Ayushman Bharat) appears to have flipped. Childbirth shows the private-care intensity starkly: the C-section share is about 61% in private hospitals versus about 19% in government ones. About 8.8% of ailment spells go untreated, and roughly 73% of those untreated cases are because the ailment was 'not considered serious'. NFHS reports the same insurance idea differently (households with insurance reached 60.2% in NFHS-6, up from 41.0%); NSS 'persons covered' and NFHS 'households covered' are different measures and must never be mixed",
        "India's place in the world, from the World Bank: India has about 0.72 physicians and about 1.59 hospital beds per 1,000 people, against world averages of about 1.86 and 3.29; total health spending is about 3.3% of GDP. India runs a large, fast-changing health system on a small share of national income",
        "The speculative Act 6 facts that ARE verified: India's core semaglutide patent expired on 20 March 2026, generics launched the next day at up to about 80-90% below branded prices, and Dr Reddy's launched oral semaglutide at about Rs 99 per tablet in May 2026. The demand context is real too: ICMR-INDIAB estimates about 101 million Indians with diabetes and about 136 million with prediabetes (2023). The price ladder runs from branded injectables (Wegovy, Ozempic, Mounjaro) at roughly Rs 9,000 to 25,000 a month down to the cheapest generics near Rs 1,300 a month, against metformin at pennies a day. Even the cheapest generic GLP-1 is roughly 25 to 40 times the monthly cost of metformin",
        "HONESTY RULE: the three big data systems measure different things and their disagreements are informative, not errors. GBD numbers are modelled estimates; NFHS measures prevalence in the field; NSS asks households about spending and care. Never present a gap between them as one being wrong",
        "HONESTY RULE: every NSS 80th-round (2025) figure on this page is Indica's own tabulation of public unit-level microdata, weighted by the survey multiplier, and the official MoSPI report may differ slightly. Flag this explicitly wherever such a number appears",
        "HONESTY RULE: the hospital-cost ladder is in current rupees, not inflation-adjusted, and the earliest (1995-96) NSS figure is total hospitalisation expenditure, not just the medical component, so the rise overstates pure medical inflation. Say so",
        "HONESTY RULE: NSS 'persons covered' by a health scheme is not the same as NFHS 'households covered' by insurance; never mix the two, and name which one you are quoting",
        "HONESTY RULE: NFHS-6 dropped anaemia testing, so any claim about anaemia must cite the NFHS-5 (2019-21) vintage, not NFHS-6",
        "HONESTY RULE for Act 6: the Ozempic section is explicitly speculative. The facts about prices and patents are verified, but every population-impact claim is a scenario, not a measured outcome, and the unknowns must be presented honestly: weight regain is the rule after stopping (GLP-1s are effectively chronic therapy), lean-muscle loss is a real concern, India's 'lean diabetes' / thin-fat phenotype means Western trial evidence built on higher-BMI cohorts may transfer poorly, and affordability is a hard wall at roughly 25 to 40 times the cost of metformin. There is no India-specific population-impact model, so say the impact is genuinely unknown",
        "HONESTY RULE: never claim a single cause for any health trend. Diet, air, work, ageing, income and measurement all move together; present them as a web, not a chain",
        "Style and discipline: no em-dashes; round numbers like a human (about 2 million, not 1,997,431); present estimates as ranges, never false precision; use only numbers that trace to a source; and be scrupulous about the difference between an estimate (GBD), a measurement (NFHS) and a household self-report (NSS)"
      ],
      caveats: [
        "GBD 2023 figures (burden, causes, risk-attributed deaths) are modelled estimates produced by IHME, not counts from a death register; treat them as best estimates with uncertainty, not exact tallies.",
        "NFHS-5 (2019-21) and NFHS-6 (2023-24) are large household surveys that measure prevalence directly; only two recent time points exist, so read change between rounds, not a smooth trend. NFHS-6 dropped anaemia testing, so anaemia claims must cite NFHS-5.",
        "All NSS 80th-round (2025) figures here are Indica's own tabulation of public unit-level microdata; the official MoSPI report may differ slightly.",
        "The hospital-cost ladder is in current rupees, not inflation-adjusted; the earliest (1995-96) figure is total hospitalisation spend, not just the medical component.",
        "NSS 'persons covered' by a health scheme and NFHS 'households covered' by insurance are different measures and are not interchangeable.",
        "National Health Accounts shares are of total health expenditure; government health spending as a share of GDP (about 1.43%) is the more demanding benchmark.",
        "World Bank cross-country series have gaps and differing vintages; physicians and beds per 1,000 are reported in different years across countries.",
        "Act 6 (Ozempic) prices are press-verified reported retail prices as of mid-2026, not regulated MRPs, and generic prices were still falling; population-impact claims are scenarios, not measured outcomes, and no India-specific impact model exists."
      ],
      styleExample: [
        "## Act 1 — The great flip: has India's disease burden really changed?",
        "It has, and the change is so complete it is almost a different country's health problem. A generation ago, what stole Indian years of life was infection: diarrhoea, pneumonia, the deaths of babies in their first month, the diseases of being poor and crowded and short of clean water. Today the biggest thief is the slow kind: hearts that give out, blood sugar that climbs, pressure that never lets up. Around 2010 the two lines crossed. Non-communicable disease, once a quarter of India's disease burden, is now nearly two-thirds of it. The uncomfortable part is the timing. Rich countries made this same flip after they got rich, with hospitals and pensions and insurance already in place to catch the fall. India is making it while it is still poor, still spending barely a rupee in seventy of its national income on public health, and still asking most families to pay the hospital bill themselves. The disease profile of a wealthy, ageing society has arrived early, before the wealth did."
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
      purpose: "Answer how climate change is actually changing India, using the rebuilt ERA5 spine as the article's backbone: long-run warming, regional/state unevenness, hourly-derived hot days, warm nights and humid heat, 2026 Jan-May year-to-date, monsoon/rainfall risk, air, emissions, electricity, cooling access and exposed work. The goal is a canonical India climate article without filler: connect the data to sleep, work, farming, bills, air, and household ability to cope.",
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
        "Temperature anomaly is the gap from a 1991-2020 normal, not the absolute temperature, so a small number like half a degree is a large national climate shift",
        "ERA5 is reanalysis: a physically consistent gridded estimate blending observations and model physics, not a thermometer at every home",
        "The hourly-derived heat series are computed locally from ERA5 hourly 2m temperature and dew point, not from the CDS post-processed daily max/min product that was flagged with a known issue in June 2026",
        "A national average temperature hides far hotter local extremes, cities, informal housing and outdoor work",
        "Warm nights matter because people, buildings and bodies need night-time cooling to recover",
        "Humid heat matters because sweat stops cooling the body efficiently when the air is wet",
        "The 2026 figures are January-May year-to-date only. Never compare them with complete calendar years; compare them only with January-May history",
        "India runs on the monsoon, so rainfall variability, timing and intensity matter more than the annual total",
        "AQI is a live snapshot of air pollution, not a yearly average, and the same fossil-fuel burning drives both warming and dirty air",
        "Annual, per-capita, and cumulative CO2 each tell a different and fairer part of India's responsibility",
        "Carbon intensity of electricity can fall even while total emissions rise if demand grows faster",
        "Cooling access is an inequality story: household protection from heat depends on appliances, housing, electricity and money",
        "India's exposure is measured in livelihoods, outdoor work, farming, older people, air pollution, household bills and population, not only in degrees",
        "Close with a methodology and caveats section that names ERA5, IMD, WAQI, World Bank CCKP, OWID/Global Carbon Budget, Climate Watch/Data Commons, Ember, NSS/NFHS and World Bank context sources; state observed vs reanalysis vs modelled vs projected clearly"
      ],
      styleExample: [
        "## Is India actually getting hotter, or does it just feel that way?",
        "It is getting hotter, and the chart is careful about how it says so. It does not plot the temperature itself. It plots the anomaly, the gap between each year and the 1991-2020 average. So a value of one degree does not mean a mild day. It means the whole country, averaged across a year, ran a full degree above its recent normal. That is a lot of extra heat spread over a lot of land. And because this is a national average, it is gentler than what a construction worker in Nagpur or a family in a Delhi summer actually lives through. The average smooths out the spikes. The spikes are where the danger is."
      ].join("\n\n")
    };
  }
  if (evidence.questionId === "q.climate.el_nino_2026") {
    const planned2026 = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer what the 2026 El Nino can and cannot tell India, in the voice of someone who knows monsoon science and Indian agricultural economics cold, and who is more interested in disciplining a number than in scaring anyone with it. This is a canonical piece written from inside a live event, so it must stay useful in December and in March 2027, not just this week. The through-line, repeated until unmissable, is that the Pacific is shouting and that tells us the odds have moved, not what will happen, and that by the time it shouts loudest the monsoon will already be over. Walk the argument in deliberate order: (1) open on the measurement problem, because five official NOAA numbers describe this one ocean and they disagree wildly, so any single figure is a choice; (2) place the event among the El Ninos on record, and show that the measuring stick itself has drifted as the tropics warm; (3) establish the right reference class, which for 2026 is the small set of strong events and is far harsher than the all-El-Nino average most coverage quotes; (4) then dismantle the easy explanations, honestly reporting that the where-the-Pacific-warmed hypothesis does not discriminate on these cases and that the Indian Ocean is a tilt rather than a shield; (5) break the national average apart by region, by month and by crop, because India does not eat an average and irrigation decides who is actually hurt; (6) trace rain to prices, and be clear that the link is real but loose; (7) then make the argument nobody else makes, that this event peaks after the kharif season closes and that for southern India the sign of the effect reverses, which moves the real risk to reservoirs, the winter crop and prices in 2027; and (8) close on the human stake. Carry the argument forward section by section and never treat the charts as a list. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India, the ocean and the monsoon, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: planned2026.length
        ? [
            ...planned2026.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A short closing H2, 'How to read these numbers', that names the sources (NOAA CPC for the ENSO indices, IMD for Indian rainfall, ICRISAT district yields, RBI wholesale prices, World Bank and RBI national accounts) and states the method plainly: each index carries its own product, averaging period and baseline and they are not interchangeable; the strong-event base rate rests on seven cases; correlations are descriptive and not causal; and 2026 is a live, unfinished season. This is the methodology disclosure and must be the last section."
          ]
        : [
            "How big is this El Nino, really?",
            "Which El Ninos should 2026 be compared with?",
            "Why does the same El Nino sometimes spare India?",
            "Who actually gets hurt when the monsoon is weak?",
            "Does a weak monsoon mean dearer food?",
            "What happens after the monsoon ends?",
            "How to read these numbers"
          ],
      requiredConcepts: [
        "El Nino in plain English, defined before any statistic: a recurring warming of the central and eastern equatorial Pacific. It matters to India because it shifts the tropical rising air eastward, weakening the large-scale ascent that pulls the June-September monsoon inland, so the rains tend to be lighter. La Nina is the cool mirror image and tends to favour a strong monsoon",
        "The Oceanic Nino Index (ONI) in plain English: the temperature anomaly of a patch of the equatorial Pacific, averaged over three months. Above +0.5C is El Nino, below -0.5C is La Nina",
        "THE CENTRAL DISCIPLINE OF THIS ARTICLE. Five official NOAA numbers currently describe this same ocean and they span roughly +0.47C to +2.20C. They differ for three separate reasons which must never be blurred together: the PRODUCT (ERSSTv5 against OISST, worth about 0.1C for the same month, honest noise), the PERIOD AND SMOOTHING (an unsmoothed weekly value late in July against a three-month seasonal mean centred earlier, during which the Pacific genuinely warmed, so much of that gap is timing and not method), and the BASELINE (a fixed 1991-2020 climatology against NOAA's shifting centred 30-year one, and separately the trend adjustment in RONI). Whenever a number appears, its product, period and baseline must appear with it. Presented bare, that spread would itself be the misleading comparison this article criticises",
        "RONI, the relative index, and the correction that matters most. RONI subtracts the tropical-mean sea-surface-temperature trend, on the reasoning that convection responds to the Pacific's warmth relative to the rest of the tropics rather than to absolute local warmth. As the whole tropical ocean warms, the raw index drifts upward for the same relative gradient: the gap between the two indices sat near zero before 2000 and has widened to roughly +0.23C in the 2010s and +0.44C in the 2020s. What RONI changes is WHICH PAST EVENT IS THE BENCHMARK. On the raw index 2014-16 is the strongest event on record; on RONI, 1982-83 is. CRITICAL HONESTY RULE: RONI does NOT mean this event is smaller than it looks. Forecasts in RONI terms still project a record event. Never let the trend adjustment be written up as deflation or reassurance, and never compare our seasonal, unscaled RONI figures with the peak-monthly, variance-restoration-scaled figures published elsewhere",
        "The reference-class problem, which is the article's core analytical move. The same IMD record gives three very different answers depending on how strictly an El Nino monsoon is defined: about -3.2% averaged over 26 monsoons touched by El Nino at any point, about -6.8% over the 17 where the Pacific stayed in El Nino through the season, and about -12.1% over the 7 where the ONI reached +1.5 or above during June-September. If the 2026 forecast holds, 2026 belongs to that third group, not the first. Every quoted average must carry its definition and its number of cases",
        "The strong-event base rate, quoted precisely and never inflated: of those seven monsoons, six finished below normal and five finished more than 10% below, averaging about -12%. Three caveats travel with it every single time it is used. Seven cases is a small base and must never be dressed up as a forecast. The threshold is peak ONI DURING the monsoon, not the event's calendar peak, and many events peak later. And 2026 has not yet crossed +1.5 on either index, so this is where the forecast points, not where the season currently sits",
        "Amplitude does not rank the damage, and this is the single most counter-intuitive fact in the piece. Among the strong events the two largest sit at opposite ends of the outcome range: 2015 delivered a 12.7% deficit while 1997, whose peak was comparable and which was one of the largest events ever measured, finished at plus 0.2%, essentially a normal monsoon. So the coming wave of 'biggest El Nino on record' coverage invites exactly the wrong inference",
        "An honest negative result, reported rather than buried. The best-supported scientific explanation for why some large El Ninos spare India is where the Pacific warms: central-Pacific events focus drought-producing subsidence over India more effectively than eastern-Pacific ones (Kumar and colleagues, Science, 2006). Tested on the seven strong monsoon events with a simple eastern-minus-central warmth measure, it cannot discriminate, for a specific and stateable reason: all seven lean eastern-Pacific, so there is no central-Pacific case among them to contrast against. Five of those seven eastern-Pacific events still produced monsoons worse than -10%. State plainly that this is not a refutation of the research, because the measure is crude and seven cases cannot settle it, and state equally plainly that 2026 leaning eastern-Pacific is therefore NOT grounds for reassurance",
        "The Indian Ocean Dipole is a tilt, not a shield. El Nino monsoons that coincided with a positive dipole averaged near-normal rain and those without it averaged a clear deficit, but 1972 paired a positive dipole with the worst monsoon in the record. And in 2026 the dipole is only just approaching positive territory rather than established there, so the article must NOT tell readers the second ocean has already turned in India's favour",
        "The sign flip, which is the article's most under-covered contribution. El Nino moves rain as well as removing it. In El Nino conditions the June-September monsoon averages a national deficit of about -3%, while the October-December northeast monsoon over the southern belt averages about +4%, and Tamil Nadu on its own about +5%. The ordering of the three Pacific states reverses completely between the two seasons. Two honesty rules: this is a modest tilt in the odds and not a rule, with roughly half of El Nino years above normal against about a third of La Nina years; and more rain is not automatically good news, because the northeast monsoon delivers much of its total in intense spells, so a wet El Nino autumn can mean flooding in Chennai rather than a comfortable harvest",
        "Seasonal phase-locking, and why it changes where the risk sits. Every strong El Nino since 1950 has peaked between October and January, with the two-year 1986-88 event the lone exception. So this event is expected to reach its maximum AFTER the kharif harvest is already decided. That migrates the real exposure away from the summer crop and toward reservoir carryover, the winter rabi sowing, the northeast monsoon, and food prices in early 2027. Frame 2027 explicitly rather than leaving the story to end in September",
        "What the models can and cannot be trusted on. Forecast systems have real demonstrated skill at this lead time for ordinary events, but no ensemble has ever been verified against an event of the size now projected, because one has never happened. Model agreement is not the same thing as model skill, and this caveat must appear wherever the forecast is discussed",
        "Ground the percentages so a reader can feel them. The monsoon delivers roughly 70% of India's annual rain in one June-to-September burst, and the long-period average is about 88 cm. IMD calls a season normal within about 10% of that, and deficient once it falls more than 10% short, which is the line people loosely call a drought year. So a headline figure of -3% is, by IMD's own yardstick, still a normal monsoon; the damage lives in the tail. When citing an average, say which side of that line it sits on",
        "Explain how a deficit reaches the ground, not just the spreadsheet: the monsoon arrives late or breaks mid-season, reservoirs and groundwater do not refill, farmers delay or re-sow, kharif yields slip, rural wage work shrinks, and food prices can climb months later. Irrigation is the shield and it is distributed unevenly, which is why the rainfall map and the harvest map are not the same picture and why rainfed millets and pulses carry damage that irrigated rice does not",
        "EVIDENCE DISCIPLINE, absolute. Use only numbers present in the evidence packet. This pass does NOT include 2026 in-season rainfall totals, reservoir storage levels, or kharif sowing area, so the article must not quote figures for any of them, must not estimate them, and must not imply it knows how the season is going in millimetres or hectares. It is entirely legitimate to say the season is under way and unfinished. Present estimates as ranges rather than false precision, round like a human, and never invent a figure to complete a sentence"
      ],
      styleExample: "There is no such thing as the size of an El Nino. There is a weekly number and a monthly number and a seasonal one, a version measured against a fixed thirty-year window and a version measured against a window that moves, and a version that subtracts the warming of every other tropical ocean before it tells you anything at all. Right now those numbers run from a little under half a degree to a little over two. All of them are official. All of them are NOAA's. They are not disagreeing about the ocean; they are answering slightly different questions about it, and the answer you get depends on which question you happened to ask."
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
  if (evidence.questionId === "q.climate.monsoon_2026") {
    const monsoonPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer the question every Indian is asking in June 2026 - is the monsoon in trouble - in the voice of someone who knows monsoon science and Indian agriculture cold and refuses to either panic or soothe. This is a timely, focused piece, NOT a season verdict and NOT the El Nino flagship: the southwest monsoon runs June to September, so as this is written in mid-June there is no 2026 outcome yet, only a forecast and three weeks of patchy early rain. The single discipline that must hold from the first line to the last is that a June forecast is a probability, not a result. Walk the argument in order: (1) open on the actual news - IMD's updated forecast of about 90% of the long-period average and a 60% chance of a deficient season, and be honest that this is what set off the worry; (2) show the forecast moved (April 92%, May 90%) and that the move is inside its own error margin, so the direction matters more than the decimal; (3) widen out to the 125-year record so the reader sees that below-normal years are common and scattered, not a sign the sky is falling; (4) explain the driver honestly - a developing El Nino roughly doubles the odds of a weak monsoon, but a large minority of El Nino years still finished fine, and the Indian Ocean Dipole that usually rescues them is forecast neutral this year; (5) close on what is actually at stake - that a weak monsoon does not automatically mean dearer food, and that farming is a shrinking share of output but still two in five jobs. Carry the argument forward section by section. Point readers to the companion piece on what El Nino does to India for the deep history and science; this page is the live, 2026-specific read. Never narrate the article itself. Never use em-dashes.",
      requiredSections: monsoonPlanned.length
        ? [
            ...monsoonPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A short closing H2, 'How to read these numbers', that states the method plainly: the 2026 figures are an IMD forecast and not a finished season; the historical phase averages and frequencies are measured against each series' own baseline and are descriptive, not causal; the live June rainfall and onset facts are a moving snapshot dated mid-June; and the season will not be settled until October. Name the sources (IMD Long Range Forecast and rainfall records, NOAA and WMO ENSO/IOD guidance, RBI wholesale prices, World Bank and RBI national accounts). This must be the last section."
          ]
        : [
            "What is IMD actually forecasting for 2026?",
            "Why did the number move?",
            "Is a below-normal year unusual?",
            "Does El Nino mean the monsoon will fail?",
            "Will the Indian Ocean rescue it this time?",
            "Does a weak monsoon mean dearer food?",
            "Why does any of this matter?",
            "How to read these numbers"
          ],
      requiredConcepts: [
        "The headline 2026 forecast, stated as a forecast and anchored so it means something: in its updated Long Range Forecast issued 29 May 2026, IMD put the southwest monsoon at about 90% of the long-period average, with a 60% probability the season finishes deficient and a further 24% below normal, so about an 84% chance of a below-normal season against just 16% for normal or wetter. The long-period average (the 1971-2020 normal) is about 87 cm of rain. IMD calls a season normal within roughly 10% of that average, below normal between about 10% short and the normal band, and deficient once it falls more than 10% short. So 90% of normal is below normal but is NOT itself a drought; the danger is the tail. Say which side of the normal-to-deficient line a number sits on whenever you cite it",
        "The forecast moved, and the move should be read honestly: IMD's initial April 2026 forecast was about 92% of the long-period average; the May update trimmed it to about 90% as the El Nino signal firmed. The forecast carries a model error of roughly 4 to 5 percentage points, so a two-point revision is well inside that band - the direction of the change (downward, as El Nino risk rose) carries more meaning than the exact figure. Do not present 90% as a precise prediction of the final total",
        "El Nino in plain English, defined on first use: it is a recurring warming of the central and eastern equatorial Pacific that shifts the tropical rising air eastward, weakening the large-scale ascent that pulls India's June-September monsoon inland, so the rains tend to be lighter. La Nina is the cool mirror image and tends to favour a strong monsoon. In 2026 forecasters expect El Nino to develop during the season (IMD's MMCFS model; the WMO put the odds of El Nino at about 80% for June-August and higher later in the year). It is a risk signal, not a verdict",
        "The honest base rate, from the joined 1950-2025 record: El Nino monsoons finished below normal far more often than neutral or La Nina years, roughly doubling the odds of a weak monsoon (bad_monsoon_frequency). And yet a large minority of El Nino years still came out near or above normal (exceptions) - living proof the Pacific does not decide the season alone. State both halves together; neither on its own is honest",
        "The 2026 wildcard is the second ocean. The Indian Ocean Dipole (IOD) is a temperature seesaw in the ocean south of India: in its positive phase the western side near Africa runs warmer than usual, feeding extra moisture and rising air into the monsoon and pushing back against a drying El Nino. El Nino years that coincided with a positive dipole averaged near-normal rain; those without it averaged a clear deficit (enso_iod_matrix). The catch for 2026: IMD currently forecasts a neutral dipole through the core of the season, so the usual rescue is uncertain, not guaranteed. It is a tilt, not a shield - 1972 was a severe drought despite a positive dipole",
        "The early-June reality, dated and clearly provisional: the monsoon reached Kerala on 4 June 2026, three days later than the normal 1 June onset, then stalled in a 'monsoon break', leaving a large all-India rainfall deficit through mid-June (roughly a quarter below normal for 1-10 June, deeper over the following week), with a southward-shifted westerly jet stream blamed for the pause. This is three weeks of a four-month season and tells you almost nothing about the final total; June is historically the most variable and least decisive month. Present it as a snapshot dated mid-June, never as evidence the season has failed",
        "The price nuance, which is the opposite of the lazy story: a weak monsoon does not automatically mean dearer food. Over the 1982-2024 wholesale-price record, post-monsoon food inflation in El Nino years ran from almost nothing (2002, the worst drought on that chart, when large public buffer stocks held prices down) to over 16% (2009). Prices answer to stocks, imports, exports, global cycles and policy as much as to rainfall, and public grain stocks now blunt much of the shock (food_wpi_postmonsoon). Do not assert that a below-normal forecast will raise food prices",
        "Why it still matters, through the jobs-versus-output gap: agriculture has fallen to about a seventh of India's output, so a weak monsoon dents headline GDP far less than it did in the 1960s. But farming still employs roughly two in five working Indians (work.employment_agriculture, econ.el_nino.agri_gva_share). The gap between the two lines is the point - a bad rain year is a small event for GDP and a large one for rural livelihoods and the price of a meal. The output line is RBI national accounts; the jobs line is the World Bank's modelled estimate",
        "Cross-reference, not duplication: this page is the live 2026 read. The deep history (the famines, Gilbert Walker, the changing strength of the link, the regional and crop detail) lives in the companion article on what El Nino does to India, and the prose should point readers there once rather than re-deriving it",
        "Number discipline is absolute: every statistic in the prose must come from the evidence packet or the stated IMD/WMO 2026 forecast facts above, never invented or recalled with false precision. Anchor every number to what it is measured against (the long-period normal, a phase's share of years, year-on-year inflation, a share of a named whole). Prefer rounded spoken forms ('about 90% of normal', 'roughly two in five') over false-precision decimals. Keep the macha layer warm and plain-spoken, with the humour in the headings, not the explanations. No em-dashes"
      ],
      styleExample: [
        "## So is the monsoon going to fail this year?",
        "Nobody knows yet, and anyone who tells you otherwise in June is guessing. Here is what is actually true. The weather office has looked at its models and put the season at about 90% of a normal year's rain, with better-than-even odds it ends up properly short. That is a real warning, and the reason for it is a warming Pacific, an El Nino, building just as the rains arrive. But read the long record sitting behind this and you will see below-average years scattered all through it, most of them not disasters. El Nino loads the dice toward a weak monsoon; it does not throw them. The rain that has actually fallen so far, late and patchy, is three weeks out of four months. The honest answer is that the odds have tilted the wrong way, and we will not know if they landed until the rains pull back in the autumn."
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
  if (evidence.questionId === "q.health.dementia") {
    const dementiaPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Explain what dementia really costs India, in the voice of someone who knows Indian ageing, public health and household finance cold. The spine has three honest layers that must stay distinct. ONE, the Indian scale, measured: LASI-DAD gives India's first nationally representative, clinically adjudicated estimate, about 7.4% of adults over 60, roughly 8.8 million people, heading toward 16.9 million by 2036, and it falls hardest on women, rural Indians and those with little schooling. TWO, the mechanism, borrowed and clearly flagged from a US study: the financial damage of dementia begins years before any diagnosis and is driven by failing judgement, not overspending. THREE, why in India that cost is largely invisible: it lands on families as unpaid care, mostly by women, and as out-of-pocket spending, not as missed credit-card payments or shrinking mutual funds, because most elderly Indians have neither. The throughline that ties it together: dementia is large, growing, badly undercounted, and its true price is hidden inside households. Use the US numbers as a lens, never as an India figure, and be scrupulous that these are estimates.",
      requiredSections: dementiaPlanned.length
        ? dementiaPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`)
        : ["How common is dementia in India?", "Who gets it?", "Where is it worst?", "Is it growing?", "What does cognitive decline do to money?", "Where does the financial damage come from?", "What does care cost, and who pays?", "Why is the cost invisible in India?", "How should we read these numbers?"],
      requiredConcepts: [
        "LASI-DAD (Longitudinal Aging Study in India - Diagnostic Assessment of Dementia; Lee et al., Alzheimer's & Dementia 2023) is India's FIRST nationally representative, clinically adjudicated dementia estimate, from the 2018-20 wave; about 2,500 people were clinically rated and modelled to the 60+ population; estimated prevalence is 7.4% of adults 60+ (95% CI 6.35-8.51), age-standardised 8.0%, roughly 8.8 million people, projected to about 16.9 million by 2036; treat all of these as estimates with real uncertainty, never false precision",
        "Dementia is overwhelmingly a disease of late old age: estimated prevalence rises from about 2.9% at 60-64 to roughly a quarter (25.4%) past 85, roughly doubling every five years after 70",
        "Prevalence is higher in women (about 9.0% vs 5.8% for men), in rural India (about 8.4% vs 5.3% urban), and falls sharply with schooling (about 10.3% with no formal schooling vs 1.5% with middle school or more); these are associations, not clean causes; the women's gap is partly because they live longer into the highest-risk ages, and education tracks lifelong income, nutrition, health and even how dementia gets detected",
        "State prevalence ranges from about 4.5% in Delhi to about 11% in Jammu & Kashmir; north-eastern states other than Assam were published only as a single group (7.35%), and several small states and UTs had no estimate",
        "India's crude prevalence looks LOWER than rich countries mainly because India is still a young country, not because Indians are protected; the fair comparison is age-standardised, and on that basis India is broadly in line; never imply Indians are biologically spared",
        "Recorded deaths from dementia (IHME GBD, modelled) rose from about 17,000 in 1980 to over 140,000 in 2023, but dementia is badly under-recorded as a cause of death, so this is a floor, not a count; the jump after 2021 partly reflects a coding change, so read the long climb rather than the last kink",
        "The financial-damage evidence comes from a US study (Li, McGarry, Nicholas & Skinner, NBER Working Paper 34659, using the US Health and Retirement Study) and must ALWAYS be labelled as US evidence; its key findings: household wealth begins to diverge from similar households about six years BEFORE dementia onset and ends roughly $125,000 lower four years after; reduced earnings are tiny (about $1,000/year) and only at onset; there is no evidence of higher spending, intentional spend-down, or higher pre-onset medical bills; the losses concentrate in stocks, bonds, mutual funds and investment accounts that need active management; placebo conditions (cancer, heart, lung, arthritis) show NO such wealth gap; the conclusion is impaired financial decision-making, with losses largely transferred to counterparties",
        "NEVER convert the US dollar wealth-loss figures into rupees or present them as an India number; the mechanism (money slips away before diagnosis, driven by judgement) transfers, but the dollar amounts do not, because most older Indians hold little in stocks, pensions or formal credit and India's financial system is structurally different",
        "Timely diagnosis matters financially: in the US study the wealth gap flattens or reverses for people diagnosed in time and keeps widening for those with late or no diagnosis; this is directly relevant to India, where the large majority of dementia goes undiagnosed, often dismissed as normal ageing",
        "If a single rupee illustration is given, it may be applied ONLY to the out-of-pocket MEDICAL excess (about $1,668/year in the US study, an expenditure that conceptually transfers), converted using a PPP (purchasing-power) factor and presented as a clearly-labelled, heavily-caveated illustration and a RANGE (roughly 35,000-40,000 rupees a year), reconciled against the independent Indian-band cost below; the three caveats must travel with it: it is US data, PPP is purchasing-power equivalence not an actual Indian price, and the two health systems differ enormously; do NOT PPP-convert the wealth-loss figure",
        "The World Alzheimer Report 2010 (Alzheimer's Disease International; Wimo & Prince) estimated societal cost per person with dementia by country income group (2010 USD): about $868 in low-income, $3,109 in lower-middle income (India's band), $6,827 in upper-middle and $32,865 in high-income countries; the low figure for poorer countries is NOT because the illness is lighter, but because care is unpaid and there are almost no care homes",
        "In India's income band, informal (unpaid family) care is about 65% of the total cost of dementia (vs about 40% in rich countries, where paid and residential services take over); unpaid does not mean free, it is paid in lost wages and lost years, overwhelmingly by women, and it never appears in any budget",
        "India funds a large share of all health care straight out of household pockets (National Health Accounts), so even the medical slice of dementia care, drugs, doctor visits, attendants, falls directly on families, on top of the unpaid care at home; the real Indian cost is therefore largely invisible: drained savings and gold, a daughter or daughter-in-law leaving paid work, and an undiagnosed parent making poor decisions about land, loans and money",
        "Honesty rules: present estimates as estimates and use ranges, never false precision; never claim a single cause for prevalence patterns; keep the US evidence visibly separate from the Indian data; and write in the house voice with no em-dashes",
        "Numbering: express every large quantity in the Indian system (lakh and crore), never in millions or billions, e.g. 88 lakh and 1.69 crore cases, 1.4 lakh deaths; the ONLY exception is the US-dollar figures, which stay in dollars and are never converted to rupees or to crore"
      ],
      styleExample: [
        "## Okay, so how many Indians actually have dementia?",
        "About one in thirteen people over sixty, which works out to roughly 8.8 million people, and on current ageing that climbs toward 17 million by 2036. That comes from LASI-DAD, the first study to actually go out, test a representative sample of older Indians and have clinicians rate them, rather than guess from hospital files. Read the age bars and you see why the number will keep rising: dementia barely registers in your early sixties and then roughly doubles every five years, until past eighty-five it touches a quarter of everyone. The catch, and it is a big one, is that almost none of this is diagnosed. Most Indian families never get a name for what is happening, they just watch a parent get confused, forgetful, harder to manage money for, and call it old age."
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
  if (evidence.questionId === "q.people.fertility_divergence") {
    const fdPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer why Indian states have such different birth rates, in the voice of someone who knows demography and development economics cold and refuses to let a single national fertility number stand in for a country whose states are a full generation apart. The through-line is one argument: India's fertility fell, but it fell on a thirty-year lag between its states, and the thing the low-fertility states really share is not money but the schooling of their women, which is why the usual story about jobs for women does not fit and why the divergence is now becoming a fight about political power. Walk the argument in order: (1) open on the hero, the fifty-year divergence of state fertility, the south crossing the replacement line in the 1980s and 90s while the north only falls fast now; (2) the same split as a map; (3) the lag made concrete, the year each state hit replacement, Kerala in 1988 and several northern states not yet; (4) how low the low ones are, Indian states ranked among countries across the whole world range, Bihar above the world average and Tamil Nadu below Germany; (5) step back to the national average that hides all of it, now below replacement; (6) test the first suspect, income, richer states do have fewer children; (7) then show female education fits tighter than income, with Kerala the income outlier snapping into line on schooling; (8) the honest counter-twist, that female labour-force participation, the explanation that works across countries, breaks down across these states; (9) the same education lever at the household level; (10) the village-city divide that runs inside every state; (11) the payload, that the states which cut fertility earliest now grow slowest, so seats reallocated by population would move north, which is why delimitation is charged; (12) the government's own projection, near-total convergence by the 2030s with only Bihar still above the line; (13) close on a browse-your-state capstone, one small panel per state so any reader can find their own state's fifty-year fall. Carry the argument forward section by section; never treat the charts as a disconnected list. Be scrupulously honest: never claim a single cause, since education, income, urbanisation, health and family-planning access all move together; income and education are correlates of fertility, not proven levers; the state fertility lines use undivided-state boundaries before reorganisation, so pre-2014 Andhra Pradesh includes Telangana and pre-2000 Bihar, Madhya Pradesh and Uttar Pradesh include their child states; per-capita income compares states in nominal rupees within a year and is not adjusted for cost-of-living differences; and the fiscal consequences of ageing are the subject of a separate article and must not be overclaimed here. Never narrate the article itself ('this chart shows', 'as we saw above'); write about India and its states, and let each chart sit beside the prose that discusses it. Never use em-dashes.",
      requiredSections: fdPlanned.length
        ? [
            ...fdPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart \"${chart.title}\"`),
            "A closing reader-question H2, 'How should you read these numbers?', a short honest methodology paragraph. Name the sources plainly: state total fertility rates from the Sample Registration System (SRS) of the Registrar General of India, 1971 to 2023, compiled via Data For India; per-capita income (per-capita Net State Domestic Product, current prices, 2011-12 base) from the RBI Database on Indian Economy, cross-checked against MOSPI's State-wise SDP and IndiaDataHub; female schooling from NFHS-6 (2023-24) and the TFR-by-education cut from NFHS-5 (2019-21); female labour-force participation from MOSPI's PLFS 2023-24; state population from the RBI Handbook of Statistics on Indian States; the 2031-35 state fertility projections from the National Commission on Population's Technical Group (2019); and the national fertility projection to 2100 from the UN World Population Prospects 2024 (median variant). State plainly that TFR is a survey-based estimate rounded to one decimal; that the long state lines use undivided-state boundaries, so newer states appear only when SRS began reporting them; that per-capita income compares states in nominal rupees within a year and is not cost-of-living adjusted; that population figures after 2011 are official estimates because no census has been held since 2011; that the 2031-35 map is a projection, not a count; and that several forces moving together is not proof any one caused the pattern. Write it as a short, honest paragraph, not a reference list."
          ]
        : [
            "How can one country have two fertility histories?",
            "Is it just that richer states have fewer children?",
            "So what actually drives it down?",
            "Is it women going out to work?",
            "Does the divide run inside states too?",
            "Why does any of this become politics?",
            "Where is every state heading?",
            "How should you read these numbers?"
          ],
      requiredConcepts: [
        "The spine of the whole article: India's fertility did not fall as one country, it fell on a roughly thirty-year lag between its states. The southern states crossed the replacement rate of about 2.1 births per woman in the late 1980s and 1990s; several northern states are only reaching it now. The national total fertility rate is itself now below replacement (SRS: about 2.0 in 2019-21, about 1.9 by 2023-24), but that average is the midpoint of states a full generation apart, and the article is about the spread, not the average",
        "The divergence in hard numbers (SRS total fertility rate, births per woman): Kerala fell from about 4.1 in 1971 to about 1.5 in 2023; Bihar from about 5.7 to about 2.8; Tamil Nadu is now about 1.3, among the lowest in the country. The clearly-below-replacement states are the south and west (Kerala, Tamil Nadu, Karnataka, Andhra Pradesh, Telangana, Maharashtra, Punjab); the states still at or above replacement are a northern and eastern band, chiefly Bihar, Uttar Pradesh, Madhya Pradesh, Rajasthan, Jharkhand, Chhattisgarh and Assam",
        "The income correlation, the first and most intuitive suspect (per-capita Net State Domestic Product, 2023, current prices): the richer states have fewer children. Kerala is about Rs 2.8 lakh per person and Tamil Nadu about Rs 3.1 lakh, against about Rs 62,000 in Bihar and about Rs 98,000 in Uttar Pradesh, a gap of roughly four to five times that lines up with the fertility gap. But income is not the cleanest explanation: Kerala reached low fertility while still relatively poor, so it sits well to the left of where its income alone would place it",
        "The better explanation, the heart of the article: female education fits the fertility map more tightly than income does. The share of women with ten or more years of schooling (NFHS-6, 2023-24) runs about 87% in Kerala, 64% in Tamil Nadu, 55% in Haryana, 43% in Uttar Pradesh and 33% in Bihar, against about 46% for India. Kerala, the income outlier, falls right into line on education. The states that drove fertility down are the ones that put girls through school; schooling, more than income, is what they share",
        "The honest counter-twist that keeps this from being a lazy 'development lowers fertility' story: female labour-force participation, the explanation that works across COUNTRIES (women entering paid work have fewer children), breaks down ACROSS Indian states. Female LFP (PLFS 2023-24) is about 41% in Kerala and 43% in Tamil Nadu, but only about 24% in Haryana, which nonetheless has low fertility, while Bihar's female LFP (about 31%) is higher than Haryana's yet its fertility is far higher. There is no clean line. So the lever is education and the aspirations and autonomy that come with it, not paid work as such, this is India's well-known female-labour paradox",
        "The household-level gradient that mirrors the state scatter (NFHS-5, 2019-21, the latest year this cut exists): a woman with no schooling averages about 2.8 children; one with twelve or more years of schooling, about 1.8. The same gradient that separates Bihar from Kerala across the map separates women within the country. Note this is NFHS-5 because it is the last round with this breakdown; the gap has been narrowing as schooling spreads",
        "The village-city divide that runs inside every state (SRS, 2023): India's urban fertility is about 1.5, already below replacement, while rural fertility is about 2.1. The gap holds even in high-fertility states, though it does not erase them: Bihar's cities are at about 2.2 and its villages about 2.9, so urban Bihar is far below rural Bihar but still just above replacement. Do not overstate this as 'cities are below replacement everywhere', because the poorest states' cities are not yet",
        "The payload, where fertility becomes politics: the states that cut fertility earliest are now growing slowest. Population grew about 7% in Tamil Nadu and Kerala between 2011 and 2024 against about 23% in Bihar, more than three times faster, with Madhya Pradesh, Uttar Pradesh, Rajasthan, Jharkhand and Haryana also near 19-21%. Because Lok Sabha seats have been frozen on the 1971 population since the 1970s (extended until 2026) precisely so states were not punished for family planning, unfreezing them and reallocating by population would shift seats from the south to the north. The southern states, which did what national policy asked, fear losing representation for their success. Present this as a live, genuinely contested debate with both sides, not a settled grievance; note population figures after 2011 are official estimates, not a census",
        "Ageing, to be handled lightly and cross-linked, NOT overclaimed: low fertility ages a population, and the south is ageing first while the north stays young. The fiscal consequences (pensions, committed spending, own-tax capacity) are the subject of a separate Indica article and should be pointed to, not re-derived. Critically, do NOT claim the ageing states spend more of their economy on interest and pensions: measured as a share of GSDP the youthful states actually spend as much or more, because their economies are smaller and carry legacy interest, so any fiscal claim here must go through share-of-revenue framing that this article does not show. Keep the ageing point directional (it arrives first in the south) and defer the money detail",
        "The projection for the close (National Commission on Population, Technical Group, 2019): by 2031-35 almost every state is projected to settle near 1.5 births per woman; only Bihar is still projected above replacement, at about 2.4. The map converges. But convergence in the fertility rate does not undo the divergence already banked into different age structures, different growth rates and different political weight, so the consequences of the thirty-year gap are only beginning as the gap itself closes. This is a projection, not a forecast to be stated as fact",
        "The country-level projection, from a second and independent source (UN World Population Prospects 2024, median variant, NOT the Indian government): India's national total fertility rate is measured to about 2.0 in 2023 and projected to 2100. It fell below the 2.1 replacement line around 2020 and the UN median has it easing further to about 1.7 by mid-century and staying near there, never climbing back to replacement in any decade this century. Pair it with the state map as the whole-country counterpart: the states converge near 1.5 by the 2030s, and the national average is locked below replacement for good. Be honest about uncertainty: this is the median path and the UN's own 80% prediction interval for 2100 is wide, roughly 1.25 to 2.13, so the exact level is uncertain even though the below-replacement direction is not. The UN's estimates through 2023 and its projection from 2024 use its own model, so its historical numbers differ slightly from SRS; do not present the two as identical",
        "NEVER-A-SINGLE-CAUSE DISCIPLINE: education, income, urbanisation, women's autonomy, health and access to contraception all move together and reinforce each other; present the fall as a bundle, with female education as the clearest single correlate, not the sole cause. Income and education are correlates of the fertility difference, established by cross-sectional association, not proven causal levers; word them that way",
        "REORGANISATION DISCIPLINE: the long state fertility lines use undivided-state boundaries, so a line labelled Andhra Pradesh includes Telangana before the 2014 bifurcation, and Bihar, Madhya Pradesh and Uttar Pradesh include Jharkhand, Chhattisgarh and Uttarakhand before 2000; the child states appear only from when SRS began reporting them separately. Do not compare a state's pre-split and post-split numbers as if the boundary were constant",
        "DATA-NATURE DISCIPLINE: total fertility rate is a Sample Registration System estimate rounded to one decimal, not an exact count; per-capita income is per-capita NSDP in nominal rupees, comparable across states within a year but not adjusted for the lower cost of living in poorer states, which narrows the real gap somewhat; female schooling and labour-force figures are survey estimates (NFHS-6, PLFS); population after 2011 is an official estimate because the census due in 2021 has not been held; the 2031-35 fertility figures are projections",
        "NUMBER DISCIPLINE is absolute: every statistic in the prose must come from the evidence packet's locked numbers or the specific figures stated in these concepts; never invent, recall or estimate a number. Present figures as rounded approximations ('about 2.8 lakh', 'roughly three times faster', 'about a third of women'), never false-precision decimals, and anchor every number when it first appears",
        "Keep the macha layer warm and plain-spoken, a sharp friend explaining what India's split birth rate really means: the country is not one story about falling fertility, it is two countries a generation apart living under one flag and one average, and the gap is quietly redrawing who gets schooling, who gets old first, and who gets seats in Parliament. The playfulness lives in the headings; the body stays grounded and genuinely helpful, and it summarises what the whole page means, not one chart"
      ],
      styleExample: [
        "## How can one country have two fertility histories?",
        "Because it does not have one fertility history. It has about two dozen, and they are decades out of step. Back in 1971 a woman in Kerala had about four children and a woman in Bihar close to six, and both numbers fell, but they fell on completely different clocks. Kerala slipped under the replacement rate, the roughly 2.1 children per woman at which a generation just replaces itself, sometime around 1990. Bihar is only getting there now, more than thirty years later. So when you read that India's fertility has dropped below replacement, that is true, and it is also the least interesting way to say it, because that national figure is just the midpoint between a south that finished this transition a generation ago and a north still in the middle of it. The average describes almost no one. The gap is the whole story."
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
        "Fertility differs by religion and this is widely misread, so state it plainly and fairly: by NFHS-5, Muslim fertility is highest (about 2.4) and Hindu about 1.9, with Buddhist, Jain and Sikh lowest (about 1.4-1.6). The essential, non-negotiable context is that every group's fertility has fallen sharply over recent decades, the Muslim rate has fallen the fastest, and the gaps between groups are narrowing toward convergence, not widening. Report the numbers without moralising and without implying any group threatens demographic 'takeover'; the data shows convergence.",
        "State fertility is not just a current map but a 50-year convergence: SRS data shows every major state's TFR has fallen steeply from the 1970s (Bihar from about 5.7, Tamil Nadu from about 3.9 to 1.3 today), and by 2023 only five states remain above the 2.1 replacement line, Bihar (2.8), Uttar Pradesh (2.6), Madhya Pradesh (2.4), Rajasthan (2.3) and Chhattisgarh (2.2). The story is momentum, not divergence: even the highest states are falling fast, so the question is when they reach replacement, not whether. (The state series is SRS via dataforindia; note that states reorganised around 2000-2014, such as Telangana and Chhattisgarh, have shorter separate records.)",
        "The government's own state-level projection, from the National Commission on Population's Technical Group on Population Projections (2019), projects TFR for every state through 2031-35 and shows near-total convergence: almost every state settles around 1.5, with only Bihar projected to stay above replacement at about 2.4. Treat these as a scenario, the official medium projection off the 2011 census, not a certainty; they predate the SRS readings that already show fertility falling faster than projected in several states.",
        "Indian fertility is now low by world standards, not just by India's past: on the chart comparing states with developed countries, Tamil Nadu and West Bengal (both 1.3) sit below the United Kingdom (1.6), Denmark, Iceland and Portugal (1.5) and Norway (1.4), level with Finland (1.3), with only Japan (1.2) lower; Kerala, Karnataka, Andhra Pradesh and Telangana (1.5) match Denmark and Iceland. This compares India's official SRS 2023 state rates with UN World Population Prospects 2024 country rates; use only the countries actually shown, and make the point the scale of the fall, not a precise ranking.",
        "India broke the usual link between women's work and low fertility. Across countries, fertility tends to fall as more women enter paid work, but India has reached very low fertility (about 2.0, World Bank) with unusually low female labour-force participation (about a third of women). India's fertility is as low as Vietnam's while barely half as many women are in the workforce. State this as a striking pattern that complicates the simple 'women working drives fertility down' story, not as a single causal claim; many forces (education, son-stopping, contraception, costs of raising children) pushed Indian fertility down.",
        "The fall in fertility came less from women starting their families later and more from finishing far earlier. Across NFHS rounds since 1992 the median age at first birth has barely moved (about 19 to 21), but the median age at last birth has dropped sharply (from about 33 to under 28), so the years a woman spends bearing children have compressed. This is the household-level mechanism, fewer children by stopping sooner, behind the smaller-family numbers."
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

  if (evidence.questionId === "q.policy.internet_control") {
    const offPlanned = Array.isArray(evidence.plannedCharts) ? evidence.plannedCharts : [];
    return {
      purpose: "Answer when and how India switches off the internet, and whether switching it off actually works, in the voice of someone who knows India's digital-rights law, the shutdown data and the empirical research cold, and refuses to either wave it away or turn it into a slogan. This is a flagship policy page, triggered by a live hook: in June 2026 the government blocked Telegram for all of its roughly 150 million Indian users under Section 69A, over fears of leaked NEET re-exam papers, and Telegram has taken it to the Delhi High Court in the first serious test of whether that power has a limit. The single through-line, carried from the first line to the last, is that India has built the world's most-used internet OFF SWITCH, reaches for it as a reflex, and that the justification it leans on hardest, stopping violence, is the one the best evidence contradicts, while the justifications that are real, rumour-driven lynchings and exam-paper leaks, are met with a tool far too blunt for them, and the cost falls hardest on the people the state spent a decade pushing online. The other half of the spine is honesty about what we cannot see: every count is a documented floor, because shutdown and blocking orders are secret by rule. Be scrupulous and non-partisan: present the government's case fairly before testing it, name no single villain, and refuse the lazy 'it is all censorship' line, because the data does not support it. Crucially, there is not one 'ban' but three distinct mechanisms that must never be conflated: regional connectivity SHUTDOWNS (under the Telegraph Act and the Temporary Suspension Rules of 2017), nationwide APP and URL BLOCKING (under Section 69A of the IT Act and the 2009 Blocking Rules), and ISP-level DNS blocking. Walk the argument in the order of the charts: open on Telegram and the three switches; show how often India goes dark and the astonishing concentration in Jammu and Kashmir; show that most shutdowns are pre-emptive and that we often do not even know how long they lasted; turn to the quieter, larger machinery of URL and DNS blocking and what is actually on the list; then the economic and human cost; and close on who decides and who checks. Carry the does-it-work argument inside the preventive-versus-reactive section and the accountability and secrecy argument inside the duration section; do not bolt them on. Never narrate the article itself (no 'this chart shows', 'as we saw above'); write about India. Never use em-dashes.",
      requiredSections: offPlanned.length
        ? [
            ...offPlanned.map((chart) => `A reader-question H2 heading whose section explains and is paired with the chart "${chart.title}" (${chart.beat})`),
            "A short closing H2, 'Where these numbers come from, and what they can't show', that names the sources plainly (the SFLC.in Internet Shutdowns Tracker for shutdowns; the dnsblocks.in 'Poisoned Wells' study for DNS blocking; the Access Now / #KeepItOn STOP dataset for platform blocks; MeitY's own answers to Parliament for Section 69A counts; Top10VPN for the cost estimates; and the Supreme Court's Anuradha Bhasin judgment for the legal test) and states the limits without flinching: every count is a documented floor because shutdown and blocking orders are kept secret by rule, so the true totals are higher; independent trackers disagree on the very same year because they define a shutdown differently (SFLC recorded about 60 shutdowns in 2024 where Access Now counted 84), and that gap is information, not error; the cost figures are model estimates built from outage hours and a GDP loss rate, not measured losses; and the June 2026 Telegram block is unfinished, now before the Delhi High Court as the first real test of whether Section 69A has any limit at all. This must be the last section.",
          ]
        : [
            "What did the Telegram block actually do, and how?",
            "How often does India switch off the internet?",
            "Where does India go dark?",
            "Are shutdowns imposed before trouble, or during it?",
            "What else does India block, and what is on the list?",
            "What does switching it off cost?",
            "Who decides, and who checks?",
            "Where these numbers come from, and what they can't show",
          ],
      requiredConcepts: [
        "The three off-switches, defined plainly on first use and never conflated. (1) A SHUTDOWN cuts connectivity itself in a place: mobile data, sometimes broadband, goes dead for everyone in a district or state. These run under the Telegraph Act and the Temporary Suspension of Telecom Services Rules of 2017 (folded into the Telecommunications Act, 2023), ordered by a state or central home secretary. (2) An APP or URL BLOCK leaves connectivity up but makes a specific service or page unreachable nationally, under Section 69A of the Information Technology Act, 2000 and the 2009 Blocking Rules. (3) DNS BLOCKING is how ISPs usually implement a block, refusing to resolve a domain name, which is why it is uneven and easily bypassed. The Telegram case is a type-2 block; Manipur's blackout is type-1.",
        "The live hook, stated as given fact: in June 2026 the Ministry of Electronics and IT (MeitY) blocked Telegram across India under Section 69A, acting on a National Testing Agency request, over fears that leaked NEET-UG re-exam papers were circulating on the platform; the block hit roughly 150 million Indian users. Telegram petitioned the Delhi High Court on 17 June 2026, arguing 69A allows blocking specific content, not switching off an entire messaging service. This is the first serious judicial test of the scope of the power, and the article opens and closes on it.",
        "Locked shutdown numbers, all from the SFLC tracker in the evidence packet, to be used and not invented: India has recorded about 922 government-ordered shutdowns from 2012 to 2026; the count climbed to a peak of 136 in 2018, then fell to 60 in 2024 (its lowest in years) as court scrutiny bit; 2026 is a partial, year-to-date figure and must never be read as a full year. Anchor the fall honestly: fewer shutdowns can still mean longer ones.",
        "The geography is the most striking single fact and must land hard: Jammu and Kashmir alone accounts for about 453 of the roughly 922 shutdowns on record, close to HALF of every shutdown India has ever logged. Rajasthan is a distant second near 114, then Manipur, Haryana and Uttar Pradesh. Most of India has had almost none. Say plainly that 'India shuts down the internet a lot' is really 'a few places shut down the internet a lot', and that the all-India figure hides a concentrated emergency in one disputed region.",
        "Preventive versus reactive is the heart of the does-it-work argument. By SFLC's classification, most Indian shutdowns are PREVENTIVE, imposed in anticipation of an event (an exam, a protest, a sensitive anniversary) rather than in REACTION to unfolding violence; in some years the split is lopsided, around 94 preventive to 6 reactive in 2021, narrowing to roughly 33 to 27 by 2024. The official defence of shutdowns is public safety in a crisis, but a mostly pre-emptive pattern sits awkwardly with that. This section must carry the empirical verdict (next concept).",
        "The empirical verdict, stated as research-supported and central: the most-cited study of Indian shutdowns, Jan Rydzak's 'Of Blackouts and Bandhs' (Stanford, 2019), found that shutdowns were associated with MORE violent collective action, not less. The mechanism is intuitive: cutting communication does not stop people mobilising, it pushes them from coordinated, non-violent tactics that depend on communication toward decentralised, spontaneous, often violent ones that do not. So the justification governments lean on most, that shutdowns prevent violence, is the one the best evidence most directly contradicts. State this as the study's finding, and pair it with the honest counterpoint that the problems shutdowns respond to are real (next concept).",
        "The steelman, given its full weight before it is tested: the problems are real, not invented. In 2018 a wave of mob lynchings, more than a dozen people killed, was fuelled by false child-kidnapping rumours forwarded on WhatsApp, and police cut connectivity in places precisely to stop a rumour that could get someone killed within hours. Exam-paper leaks via Telegram and similar channels are a documented, recurring problem, which is exactly what the 2026 NEET block invoked. The honest framing is not 'shutdowns are evil' but 'these are real problems met with a sledgehammer': blunt, collective punishment of millions for the acts of a few, with evidence it can backfire.",
        "Opacity is itself a finding and carries the accountability argument. Across the record, the single largest duration bucket is 'never disclosed', roughly half of all shutdowns, because orders are rarely published and the length of a blackout can only be guessed from news reports that seldom say when the internet returned. This is where Anuradha Bhasin v. Union of India (Supreme Court, January 2020) belongs: the Court held that an indefinite shutdown is impermissible, that any suspension must be temporary, necessary and proportionate, and that orders must be PUBLISHED and open to review. Years on, that transparency is still largely unmet, which is why independent trackers, not the government, are the public's only real record.",
        "The quieter, larger machinery: URL and content blocking under Section 69A dwarfs shutdowns in scale but happens silently. As disclosed to Parliament, the number of websites, accounts and URLs ordered blocked ran from about 1,385 in 2017 to a spike near 9,849 in 2020, and in the thousands every year since (about 7,502 in 2023). Two honesty notes are mandatory: these are the government's OWN figures and do not fully reconcile across different answers (2019 has been stated as both 3,635 and 3,655), and the orders themselves are confidential by Rule 16 of the 2009 Blocking Rules, so the public never learns what was blocked or why.",
        "The crucial nuance that defeats the lazy take, from the dnsblocks.in 'Poisoned Wells' study: of about 43,083 domains found DNS-blocked across six major Indian ISPs, the overwhelming majority are piracy and streaming (Movies and TV alone is about 20,986), followed by pornography (about 2,953) and gambling (about 1,906). Content tied to speech and access is a tiny sliver: news media around 30 domains, political criticism around 10, government around 8, circumvention tools around 8. Say this plainly: most of what India DNS-blocks is copyright and vice enforcement, not political censorship. This complicates the story and is exactly why the article is trustworthy. Add the caveats that DNS blocking is one mechanism, trivially bypassed, so it measures intent not an airtight wall, and that the large 'uncategorised' bucket is unclassified.",
        "Blocking is implemented unevenly, so the open internet you get depends on your ISP: in the same study Airtel was found to DNS-block by far the most domains (around 27,647) and the lightest providers under half that (Connect around 9,412). The same legal orders, very different walls.",
        "The cost, anchored to the authoritative source and never to false precision. The strongest India-specific estimate is ICRIER's 2018 macro-econometric study 'The Anatomy of an Internet Blackout' (Kathuria, Kedia and others): about 16,315 hours of shutdowns over 2012 to 2017 cost the economy roughly 3 billion dollars, and mobile-only shutdowns did about four-fifths of that damage. Present this as the measured headline, while saying plainly it is a rigorous model estimate, not exact accounting. For recent years, attribute figures to the methodology that produces them, the NetBlocks and Internet Society Cost of Shutdown Tool (built on the Brookings method), which puts annual losses in the hundreds of millions of dollars; do NOT cite the VPN-company repackager as if it were the authority, and do not pin false-precision year-by-year decimals.",
        "The human cost and the distributional sting, the angle that makes it concrete. The cruel irony is that India spent a decade pushing its informal economy onto digital rails (UPI, mobile payments, online welfare) and a shutdown then strands exactly those people: the small trader who can no longer take a payment, the gig worker who cannot get a ride, the patient whose hospital cannot process an Ayushman Bharat claim (doctors in Kashmir reported being unable to for 25 days running). The 2019-20 Kashmir blackout alone was estimated by local trade bodies to have cost well over a billion dollars and idled tens of thousands of artisans. Be careful with evidence tiers here: peer-reviewed work (such as an Indian Journal of Medical Research study of Manipur medical trainees) and trade-body estimates are stronger than viral single figures (the often-cited '80,000 Jaipur shops shut' should be flagged as reported, not measured). The distributional point is solid and should be stated: shutdowns hit the poorest and most digitally dependent hardest.",
        "India in the world, for scale: independent trackers put India at or near the top of the global league table for years. Access Now counted 84 Indian shutdowns in 2024, the most of any democracy and second only to Myanmar's 85, out of 296 shutdowns across 54 countries worldwide. Use this to place India, not to moralise.",
        "Evidence-tier discipline is a rule, not a nicety, and the page must wear it openly: peer-reviewed and primary research (Rydzak, the IJMR study, the Supreme Court judgment) is the firm ground; advocacy-tracker counts (SFLC, Access Now) and modelled costs (Top10VPN) are credible but are estimates and must be labelled as such; press and viral figures are illustrative only and must be flagged. Every count is a FLOOR, not a total, because the orders are secret. And independent trackers legitimately disagree on the same year because they count events differently; present that gap as information about how hard this is to measure, not as anyone's mistake.",
        "Number discipline is absolute: every statistic, count, share and rupee or dollar figure in the prose must come from the evidence packet or the given facts listed here, never invented or recalled with false precision. Anchor every number to what it is measured against (a share of all shutdowns, a count out of 922, a category's share of 43,083 domains, an estimate versus a measurement). Prefer rounded spoken forms ('close to half', 'about 60 in 2024', 'a tiny sliver') over false-precision decimals. Keep the macha layer warm and plain-spoken, a sharp friend explaining a power most people never think about, with the humour in the headings, not the explanations. No em-dashes.",
      ],
      styleExample: [
        "## So does shutting down the internet actually stop the trouble?",
        "This is the part the official story gets backwards. The case for a shutdown sounds reasonable in the moment: a rumour is spreading, a crowd is gathering, cut the signal and you cut the spark. And the problems are real, nobody should pretend otherwise. In 2018 false kidnapping rumours on WhatsApp got more than a dozen people beaten to death, and a leaked exam paper can travel a Telegram channel faster than any official can stop it. But look at what the data says actually happens when the signal goes dark. The most careful study we have of India's shutdowns found that violence did not fall during a blackout, it rose. The reason is almost obvious once you see it: cutting communication does not switch off an angry crowd, it just blinds the organisers who were keeping it orderly and leaves the rumour that started it still ringing in everyone's ears. And here is the tell. Most of India's shutdowns are not even ordered in the heat of a crisis. They are switched on beforehand, ahead of an exam or a protest that has not happened yet, just in case. A tool reached for as a reflex, for a job the evidence says it does not do.",
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
  const generic = {
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

  // A question without a bespoke in-code brief may supply one as DATA at
  // data/briefs/<questionId>.json ({ purpose, tension, requiredConcepts[],
  // requiredSections?[], styleExample? }). This is the quality lever for the tail:
  // enrich a thin article's brief without editing this generator. Missing fields fall
  // back to the generic shape; requiredSections defaults to one-per-chart above.
  const external = loadExternalBrief(evidence.questionId);
  if (!external) return generic;
  const purpose = [external.purpose, external.tension ? `The tension the article circles: ${external.tension}` : ""]
    .filter(Boolean)
    .join(" ");
  return {
    purpose: purpose || generic.purpose,
    requiredSections: Array.isArray(external.requiredSections) && external.requiredSections.length ? external.requiredSections : requiredSections,
    requiredConcepts: Array.isArray(external.requiredConcepts) && external.requiredConcepts.length ? external.requiredConcepts : generic.requiredConcepts,
    styleExample: external.styleExample || generic.styleExample
  };
}

function loadExternalBrief(questionId) {
  const path = `data/briefs/${questionId}.json`;
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.warn(`brief file ${path} is unreadable, using the generic template: ${error.message}`);
    return null;
  }
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

// Deterministic vocabulary swaps for common AI tells. Em-dash handling is delegated to
// the shared deepStripEmDash (horizontal-whitespace-only, so it never collapses the
// newlines that hold markdown structure — the old /\s*—\s*/ regex could).
function sanitizeVocab(text) {
  return String(text)
    .replace(/\bit is important to note that\b/gi, "the caveat is that")
    .replace(/\bit is important to note\b/gi, "the caveat matters")
    .replace(/\bcrucially\b/gi, "importantly")
    .replace(/\bcrucial\b/gi, "important")
    .replace(/\bdelve\b/gi, "examine")
    .replace(/\btapestry\b/gi, "pattern")
    .replace(/\bcomplex interplay\b/gi, "relationship")
    .replace(/\bin conclusion\b/gi, "overall");
}

function sanitizeText(text) {
  return deepStripEmDash(sanitizeVocab(text));
}

// Every reader-facing prose field of an explanation, so the gate and warn-guards see all
// of them (the old build lint only covered short + article). Titles/slugs/ids are NOT
// prose and are excluded so the em-dash sweep never mangles a chartId or indicator slug.
function explanationFields(doc) {
  const out = [];
  const s = doc.short || {};
  out.push(s.headline, s.dek, s.body);
  const a = doc.article || {};
  out.push(a.title, a.standfirst, a.bodyMarkdown);
  const m = doc.macha || {};
  out.push(m.heading, m.body, m.soWhat);
  for (const c of doc.chartExplainers || []) {
    out.push(c.takeaway, c.detail, c.howToRead, c.mistakeToAvoid, c.mobileNote);
  }
  for (const cav of doc.caveats || []) out.push(cav);
  return out.filter((x) => typeof x === "string");
}

// Apply the deterministic sanitizer to every prose field of a document (clone). Replaces
// the old short+article-only sweep, closing the macha / chartExplainers / caveats gap.
function sanitizeExplanation(document) {
  const d = structuredClone(document);
  const t = (x) => (typeof x === "string" ? sanitizeText(x) : x);
  if (d.short) {
    d.short.headline = t(d.short.headline);
    d.short.dek = t(d.short.dek);
    d.short.body = t(d.short.body);
  }
  if (d.article) {
    d.article.title = t(d.article.title);
    d.article.standfirst = t(d.article.standfirst);
    d.article.bodyMarkdown = t(d.article.bodyMarkdown);
  }
  if (d.macha) {
    d.macha.heading = t(d.macha.heading);
    d.macha.body = t(d.macha.body);
    d.macha.soWhat = t(d.macha.soWhat);
  }
  if (Array.isArray(d.chartExplainers)) {
    for (const c of d.chartExplainers) {
      c.takeaway = t(c.takeaway);
      c.detail = t(c.detail);
      c.howToRead = t(c.howToRead);
      c.mistakeToAvoid = t(c.mistakeToAvoid);
      c.mobileNote = t(c.mobileNote);
    }
  }
  if (Array.isArray(d.caveats)) d.caveats = d.caveats.map(t);
  return d;
}

// Post-generation gate shared by every path (single / multi / batched). Runs the
// deterministic sanitize, then a loop-until-clean lint gate (fixes residual banned-word /
// em-dash tells the model introduced), then warn-level guards whose findings are recorded
// in qualityFlags. It never throws and never blocks a write: full automation means a
// residual tell becomes a flag, not a failed generation. The build gate
// (validate-explanations) is what stops a bad page from deploying.
async function finishExplanation(document, evidence, question) {
  let doc = sanitizeExplanation(document);
  const maxRounds = Number(process.env.INDICA_CLEANUP_ROUNDS || 2);
  const cleanupPasses = [];
  for (let round = 1; round <= maxRounds; round += 1) {
    const issues = hardIssuesFromTexts(explanationFields(doc));
    if (!issues.blocked) break;
    const completion = await createDeepSeekJsonCompletion({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content: [
            "Fix ONLY the listed defects in this explanation JSON. Return the SAME JSON object, unchanged except for those fixes. Do not rewrite content, do not add or remove ideas, and do not change any numeric value, only how a tell is worded.",
            findingsToInstruction(issues.lint.findings),
            issues.emdash ? "Also remove every em-dash character (—); replace each with a comma, or a period and a capital letter." : "",
            "EXPLANATION JSON:",
            stableJson(doc),
          ].join("\n\n"),
        },
      ],
      maxTokens: Number(process.env.INDICA_EXPLANATION_MAX_TOKENS || 16000),
      temperature: 0,
    });
    doc = sanitizeExplanation(normalizeCompletion(completion.json));
    cleanupPasses.push({ name: `cleanup-${round}`, model: completion.payload.model });
  }

  // Warn-level guards -> qualityFlags (never block).
  const texts = explanationFields(doc);
  const figureLines = extractFigureLines(doc.article?.bodyMarkdown).concat(
    (doc.chartExplainers || []).flatMap((c) => extractFigureLines(c.detail))
  );
  const chartCount = (evidence.plannedCharts || []).filter((c) => c.indicator || (c.series && c.series.length)).length;
  const words = String(doc.article?.bodyMarkdown || "").split(/\s+/).filter(Boolean).length;
  const explainerCount = (doc.chartExplainers || []).length;

  const flags = Array.isArray(doc.qualityFlags) ? [...doc.qualityFlags] : [];
  const residual = hardIssuesFromTexts(texts);
  if (residual.blocked) {
    flags.push({ type: "lint-residual", detail: residual.lint.errors.map((f) => f.match).join("; "), emdash: residual.emdash });
  }
  for (const f of derivedReport(...texts)) flags.push({ type: "derived-number", match: f.match, hint: f.hint });
  for (const f of checkNumberConsistency(texts)) flags.push({ type: "number-inconsistency", match: f.match, hint: f.hint });
  for (const w of checkRichFigures({ lockedNumbers: evidence.lockedNumbers || [], figureLines, segments: [] })) {
    flags.push({ type: "rich-figure", detail: w });
  }
  // National-accounts identities (GDP = NDP + depreciation, etc.) must tie on the same
  // vintage; only fires when the relevant econ.nas.* numbers are present (GDP pages).
  for (const w of checkNasIdentities(evidence.lockedNumbers || []).warnings) {
    flags.push({ type: "accounting-identity", detail: w });
  }
  if (chartCount > 0 && (words < 120 * chartCount || explainerCount !== chartCount)) {
    flags.push({ type: "thin", detail: `body ${words} words for ${chartCount} charts; chartExplainers ${explainerCount}/${chartCount}` });
  }
  doc.qualityFlags = flags;
  return { document: doc, cleanupPasses };
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
      model: MODEL,
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
      model: MODEL,
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

// Whether an article is big enough to overflow the model's output ceiling in one pass
// and should be generated chart-by-chart. Normal pages (< ~12 charts) keep the multi-pass
// path; only the flagships (20+ charts) route to batching.
function isBig(evidence) {
  const chartCount = (evidence.plannedCharts || []).filter((c) => c.indicator || (c.series && c.series.length)).length;
  return chartCount >= Number(process.env.INDICA_BATCH_THRESHOLD || 14);
}

// Compact system prompt for the batched path. It carries the same discipline as the full
// systemPrompt() but omits the "return the whole explanation JSON object" mandate, because
// each batched call returns a small shape ({sections:[...]} / {explainers:[...]} / meta).
function batchedSystemPrompt() {
  return [
    "You write for Indica, a public data almanac about India, in the voice of a sharp editor explaining a chart to a smart friend who has limited time.",
    "Return only valid JSON in exactly the shape the user asks for. No markdown fences, no commentary.",
    "NUMBER DISCIPLINE IS ABSOLUTE: every number, rate, share, rupee figure, and date-as-a-fact must come from the numbers you are given. Never invent, estimate, or recall a figure from memory. Use a locked number's displayValue verbatim. You MAY add uncontested textbook framing (a mechanism, a concept the reader needs) but NO new numbers, dates, named people, or studies.",
    "Write clean Indian English. Short sentences, concrete nouns, one idea per sentence, define jargon the instant it appears. Round like a human ('about 5 lakh crore', 'around 880 tonnes', 'roughly 12%').",
    "Never use em-dashes (use a comma, period, or rephrase). Do not use the 'not just X, it is Y' construction, the 'Imagine…'/'Picture this:' opener, or end on an editorial aphorism.",
    "Do not narrate the article ('this chart shows', 'as we saw above'). Write about India; let each section answer its own question with the mechanism and the reason, not a description of the chart's shape.",
    "Each H2 section heading is a real reader question; the body (120-200 words) genuinely ANSWERS it. Do not claim a cause the numbers do not prove; say 'one visible pattern in this data is'.",
  ].join("\n");
}

function batchChartNote(entry, locked) {
  const inds = [entry.indicator, ...(entry.series || []).map((s) => s.indicator)].filter(Boolean);
  const nums = (locked || [])
    .filter((n) => inds.includes(n.indicatorId))
    .slice(0, 8)
    .map((n) => `${n.label}: ${n.displayValue ?? n.value} ${n.unit || ""}`.trim());
  return [
    `CHART: "${entry.title}"`,
    `  shows: ${entry.read || ""}`,
    `  why it matters: ${entry.why || ""}`,
    `  caveat: ${entry.watch || ""}`,
    nums.length ? `  numbers you MAY use (no others): ${nums.join("; ")}` : "  (no locked numbers for this chart; use only established framing)",
  ].join("\n");
}

const slugifyTitle = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Built-in batched generation for big articles. Reuses buildEvidencePacket output and runs
// the SAME finish gate as every other path (applied by the driver loop). Replaces the old
// per-flagship generate-*-batched.mjs / -explainers.mjs forks, which were copy-pasted per QID
// and skipped every gate.
async function createBatchedExplanation(evidence, question) {
  const locked = evidence.lockedNumbers || [];
  const charts = (question.visualPlan || []).filter((v) => v.indicator || (v.series && v.series.length));
  const bodyBatch = Number(process.env.INDICA_BATCH_SIZE || 6);
  const explainerBatch = Number(process.env.INDICA_EXPLAINER_BATCH_SIZE || 4);
  // Per-call output budgets. These MUST leave room for reasoning: deepseek-v4-pro is a
  // reasoning model, so reasoning_tokens are charged against max_tokens. The original
  // hardcoded 7000 was enough for the visible JSON but not for reasoning on top of a long
  // requiredConcepts block, and the model then returns HTTP 200 with EMPTY content rather
  // than an error - which surfaces as "DeepSeek completion returned no message content".
  // Raising a max_tokens ceiling is safe: it is an upper bound, not a target, so articles
  // that already generate cleanly are unaffected.
  const thesisTokens = Number(process.env.INDICA_BATCH_THESIS_MAX_TOKENS || 4000);
  const bodyTokens = Number(process.env.INDICA_BATCH_BODY_MAX_TOKENS || 16000);
  const explainerTokens = Number(process.env.INDICA_BATCH_EXPLAINER_MAX_TOKENS || 16000);
  const metaTokens = Number(process.env.INDICA_BATCH_META_MAX_TOKENS || 8000);
  const passes = [];
  const call = async (messages, maxTokens, temperature = 0.32) => {
    const c = await createDeepSeekJsonCompletion({ model: MODEL, messages, maxTokens, temperature });
    passes.push({ name: "batch", model: c.payload.model });
    return normalizeCompletion(c.json);
  };

  // Honour the hand-authored editorial brief (this is the quality lever the old forks
  // lacked): its purpose is the through-line, its requiredConcepts carry the locked facts
  // and honesty rules. A question with only the generic fallback brief still works.
  const template = articleTemplateFor(evidence);
  const conceptsBlock = (template.requiredConcepts || []).length
    ? `Facts and honesty rules you MUST honour (do not contradict, do not add numbers beyond these and the chart notes):\n${(template.requiredConcepts || []).map((c) => `- ${c}`).join("\n")}`
    : "";

  // 1. Through-line thesis. Use the brief's purpose when it is substantial; otherwise
  // generate one so cross-batch sections stay coherent.
  let thesis = typeof template.purpose === "string" && template.purpose.length > 140 ? template.purpose : "";
  if (!thesis) {
    const thesisJson = await call([
      { role: "system", content: batchedSystemPrompt() },
      { role: "user", content: [
        `Write the through-line for the article that answers: "${question.question}".`,
        "Return JSON: {\"thesis\":\"one paragraph (60-100 words) stating the article's single answer and the arc of the argument, using only established framing (NO new numbers)\"}.",
        conceptsBlock,
        "The ordered charts, each of which becomes one section:",
        charts.map((c) => `- ${c.title}`).join("\n"),
      ].filter(Boolean).join("\n\n") }], thesisTokens, 0.3);
    thesis = String(thesisJson.thesis || "");
  }

  // 2. Body sections, in batches, each told the through-line and the headings already written.
  const sections = [];
  for (let i = 0; i < charts.length; i += bodyBatch) {
    const batch = charts.slice(i, i + bodyBatch);
    const priorHeadings = sections.length ? sections.map((s) => `- ${s.heading}`).join("\n") : "(none yet; this is the opening batch, so open by answering the page question)";
    const out = await call([
      { role: "system", content: batchedSystemPrompt() },
      { role: "user", content: [
        `Article question: "${question.question}".`,
        `Through-line to stay consistent with: ${thesis}`,
        conceptsBlock,
        `Sections already written (continue the thread, do not repeat them):\n${priorHeadings}`,
        `Write one H2 reader-question section for EACH chart below, in order (${batch.length} sections). Heading is a real question with no "##" prefix; body 120-200 words that answers it with the mechanism, using only the given numbers.`,
        batch.map((c) => batchChartNote(c, locked)).join("\n\n"),
        `Return JSON exactly: {"sections":[{"heading":"a question","body":"..."}]}`,
      ].filter(Boolean).join("\n\n") }], bodyTokens);
    if (Array.isArray(out.sections)) sections.push(...out.sections);
  }
  const bodyMarkdown = sections
    .map((s) => `## ${String(s.heading || "").replace(/^#+\s*/, "")}\n\n${s.body || ""}`)
    .join("\n\n");

  // 3. Chart explainers, in batches; visualId aligned to the chartId (slug of the title).
  const explainers = [];
  for (let i = 0; i < charts.length; i += explainerBatch) {
    const batch = charts.slice(i, i + explainerBatch);
    const out = await call([
      { role: "system", content: batchedSystemPrompt() },
      { role: "user", content: [
        "For EACH chart below, write a rich explainer. Return JSON exactly:",
        // whyShowThis is REQUIRED. It was missing from this schema until 2026-07-30, so every
        // article generated through the batched path lacked it and the reader-facing box fell
        // back to the thin one-line `why` hint from the visualPlan. The retired per-flagship
        // forks did request it, which is why older flagships have it and newer ones did not.
        `{"explainers":[{"visualId":"<exact chart TITLE>","title":"<chart title>","takeaway":"one vivid sentence with the key number","detail":"4-7 plain sentences: what it shows, the numbers and trend, what drives it, what it means for the reader","whyShowThis":"2-3 sentences on why this chart earns its place in the argument and what the reader would misunderstand without it","howToRead":"one or two concrete lines on how to read it","mistakeToAvoid":"the single most important misreading","mobileNote":"a short small-screen note"}]}`,
        "One per chart, same order.",
        batch.map((c) => batchChartNote(c, locked)).join("\n\n---\n\n"),
      ].join("\n\n") }], explainerTokens);
    if (Array.isArray(out.explainers)) explainers.push(...out.explainers);
  }
  for (let i = 0; i < explainers.length; i += 1) {
    const title = charts[i]?.title;
    if (title) { explainers[i].visualId = slugifyTitle(title); explainers[i].title = title; }
  }

  // 4. sectionVisualMap: walk the body headings in order, bind each to its chart's chartId.
  const headings = bodyMarkdown.split("\n").map((l) => l.match(/^## (.+)/)).filter(Boolean).map((m) => m[1].trim());
  const sectionVisualMap = headings.slice(0, charts.length).map((heading, i) => ({ heading, visualId: slugifyTitle(charts[i]?.title || "") }));

  // 5. Meta: title, standfirst, short, macha, caveats, sourceNotes.
  const meta = await call([
    { role: "system", content: batchedSystemPrompt() },
    { role: "user", content: [
      `For the article answering "${question.question}", return JSON:`,
      `{"title":"the article title","standfirst":"a 1-2 sentence dek","short":{"headline":"a punchy one-liner","dek":"one sentence","body":"a 90-150 word plain-language summary"},"macha":{"heading":"a cheeky Indian-English question","body":"a warm 80-120 word plain explanation of what the whole page means for a layperson","soWhat":"one sentence on why it matters"},"caveats":["4-6 honest caveats: estimate vs measurement, survey vintage, what the data cannot show"],"sourceNotes":["name every source plainly"]}`,
      `Through-line: ${thesis}`,
      "Introduce NO new numbers beyond those already in the body.",
    ].join("\n\n") }], metaTokens, 0.3);

  const document = {
    schemaVersion: 1,
    questionId: question.id,
    status: "ready",
    short: meta.short || { headline: "", dek: "", body: "" },
    macha: meta.macha || { heading: "", body: "", soWhat: "" },
    article: { title: meta.title || question.question, standfirst: meta.standfirst || "", bodyMarkdown },
    editorialPlan: { audience: "Curious Indian general reader", heroDescription: "", selectedDataPoints: [], pullQuotes: [], glossaryBlocks: [] },
    chartExplainers: explainers,
    sectionVisualMap,
    sourceNotes: meta.sourceNotes || [],
    caveats: meta.caveats || [],
    lockedNumbersUsed: [],
    qualityFlags: [],
  };
  return { document, model: MODEL, passes: [...passes, { name: "batched" }], plan: null };
}

async function createMultiPassExplanation(evidence, question) {
  const generationEvidence = compactEvidenceForGeneration(evidence, question);
  const planCompletion = await createDeepSeekJsonCompletion({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: planPrompt(generationEvidence) }
    ],
    maxTokens: Number(process.env.INDICA_PLAN_MAX_TOKENS || 8000),
    temperature: 0.2
  });
  const plan = normalizeCompletion(planCompletion.json);

  const draftCompletion = await createDeepSeekJsonCompletion({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: draftPrompt(generationEvidence, plan) }
    ],
    maxTokens: Number(process.env.INDICA_EXPLANATION_MAX_TOKENS || 16000),
    temperature: 0.32
  });
  const draft = sanitizeExplanation(normalizeCompletion(draftCompletion.json));

  const editCompletion = await createDeepSeekJsonCompletion({
    model: MODEL,
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

async function main() {
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
      : isBig(evidence)
        ? await createBatchedExplanation(evidence, question)
        : await createMultiPassExplanation(evidence, question);
    const { document: gated, cleanupPasses } = await finishExplanation(generatedResult.document, evidence, question);
    validateExplanation(gated, question.id);
    const document = {
      ...gated,
      generatedAt: new Date().toISOString(),
      model: generatedResult.model,
      generationPasses: [...generatedResult.passes, ...cleanupPasses, { name: "finish-gate" }],
      editorialPlanDraft: generatedResult.plan,
      evidence
    };
    await writeFile(outputPath, `${stableJson(document)}\n`);
    const flagNote = document.qualityFlags?.length ? ` (${document.qualityFlags.length} qualityFlag(s))` : "";
    console.log(`wrote explanation ${question.id}${flagNote}`);
  }
}

// Exported for testing; guarded so importing this module does not run the generator.
export { finishExplanation, explanationFields, sanitizeExplanation, sanitizeText, articleTemplateFor, loadExternalBrief };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
