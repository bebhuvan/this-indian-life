import { readFile, writeFile } from "node:fs/promises";

const evidence = JSON.parse(await readFile("data/explanations/en/q.econ.poverty.evidence.json", "utf8"));

const visualTitles = [
  "The poverty rate changes when the poverty line changes",
  "The next floor is much more crowded",
  "At the $4.20 line, rural poverty is still higher",
  "India's last official poverty line stopped here",
  "A higher line counted more people as poor",
  "What the old poverty line meant in rupees",
  "A serious dissent says the post-2011 fall was much slower",
  "The consumption floor has risen",
  "Free welfare items matter to measured consumption",
  "The bottom rung is still thin",
  "Choose a monthly MPCE cutoff, get a different headcount",
  "Below Rs 3,000 MPCE, the state ranking changes sharply",
  "The map changes the poverty story",
  "Below Rs 3,000 MPCE, ST and SC households are most exposed",
  "Poverty risk still runs along caste",
  "NITI's MPI is a deprivation index, not a cash poverty line",
  "MPI by state confirms the geography of deprivation",
  "Nutrition is the hard caveat",
  "Basic services improved, but deprivation did not vanish",
  "Having work is not the same as being secure",
  "The broader line is crowded with children and low-education households",
  "The poorest half gets about a third of rural consumption",
  "The basic household floor rose, but health cover still lags",
  "A hospital bill can still push households back down",
  "Poverty gaps show depth, not just headcount",
  "The global MPI adds intensity and vulnerability"
];

const chartExplainers = [
  {
    visualId: visualTitles[0],
    takeaway: "India has sharply reduced extreme poverty, but the verdict changes when the poverty line is raised.",
    detail: "The y-axis is a percent: the share of people below each poverty line. At the World Bank's $3-a-day line, about ₹58/day in 2021 PPP rupees, poverty fell from 27.1% in 2011-12 to 5.3% in 2022-23; at $4.20 a day, about ₹82/day, the latest rate is still 23.9%.",
    whyShowThis: "This is the article's central split: the low line supports the progress claim, while the higher line keeps vulnerability in view.",
    howToRead: "Compare the two lines at the same two survey years. The gap between them is the population above bare subsistence but below a fuller minimum.",
    mistakeToAvoid: "Do not treat one line as the only truth. Each line answers a different version of poverty.",
    mobileNote: "Read the latest endpoints first, then the fall since 2011-12."
  },
  {
    visualId: visualTitles[1],
    takeaway: "The next poverty floor is much more crowded than the extreme-poverty floor.",
    detail: "In 2022-23, about 7.5 crore people (75 million) were below the $3-a-day line, about 34.2 crore (342 million) were below $4.20, and about 117 crore (1,170 million) were below the World Bank's $8.30 upper-middle-income line.",
    whyShowThis: "Rates can make poverty sound smaller than it feels at India scale, while the higher line shows how far security is from bare subsistence.",
    howToRead: "The bars are counts in crore people below each line, not poverty rates. The parenthetical rupee amounts are 2021 PPP equivalents.",
    mistakeToAvoid: "Do not compare these counts with food-security beneficiaries. They are built for different policy questions.",
    mobileNote: "Read the bars as floors: extreme poverty, lower-middle-income poverty, then the broader upper-middle-income standard."
  },
  {
    visualId: visualTitles[2],
    takeaway: "Rural poverty fell fast, but remains much higher than urban poverty.",
    detail: "This chart is a poverty headcount rate, not a dollar amount. At the $4.20 line, rural poverty fell from 64.9% to 27.7%, while urban poverty fell from 39.7% to 14.3%.",
    whyShowThis: "A national average hides the rural-urban divide that still shapes welfare.",
    howToRead: "Both lines fall, but the rural line stays above the urban line throughout.",
    mistakeToAvoid: "Do not read this as a full rural income measure. It is consumption poverty at one international line.",
    mobileNote: "Focus on the latest gap: rural is nearly double urban."
  },
  {
    visualId: visualTitles[3],
    takeaway: "India's last adopted official poverty estimate is still the 2011-12 Tendulkar number.",
    detail: "The Planning Commission's Tendulkar series put all-India poverty at 21.9% in 2011-12, down from 45.3% in 1993-94. No newer national poverty line has been adopted in the same official way.",
    whyShowThis: "It explains why later claims often talk past each other.",
    howToRead: "This is the official historical line, not a current estimate.",
    mistakeToAvoid: "Do not use the 2011-12 endpoint to describe poverty today.",
    mobileNote: "The line ends where the official series ends."
  },
  {
    visualId: visualTitles[4],
    takeaway: "A higher poverty standard changes the 2011-12 answer by millions of people.",
    detail: "For the same 2011-12 survey year, Tendulkar gave an all-India poverty rate of 21.9%. Rangarajan's higher standard gave 29.5%.",
    whyShowThis: "The poverty-line controversy is about what minimum India should use, not only about arithmetic.",
    howToRead: "Compare Tendulkar and Rangarajan within the same geography.",
    mistakeToAvoid: "Rangarajan was not adopted as the official line. Treat it as the major alternative benchmark.",
    mobileNote: "The national pair is the first two bars."
  },
  {
    visualId: visualTitles[5],
    takeaway: "The old official rupee line was a very low floor.",
    detail: "The Tendulkar line was about Rs 816 per person per month in rural India and Rs 1,000 in urban India in 2011-12. Rangarajan proposed higher monthly lines: Rs 972 rural and Rs 1,407 urban.",
    whyShowThis: "It makes the abstract committee debate tangible.",
    howToRead: "Each bar is a monthly per-person poverty line in 2011-12 rupees.",
    mistakeToAvoid: "Do not treat these as current living-cost numbers.",
    mobileNote: "The urban Rangarajan bar shows how much the standard moved."
  },
  {
    visualId: visualTitles[6],
    takeaway: "A serious research estimate puts 2022-23 poverty much higher than the simplest HCES comparisons.",
    detail: "Himanshu, Lanjouw and Schirmer use PLFS-based survey-to-survey imputation to address the break between the 2011-12 and 2022-23 consumption surveys. Their Tendulkar-compatible estimates put poverty around 17.5-19.9% in 2022-23, depending on model.",
    whyShowThis: "This is the article's strongest methodological dissent: poverty fell, but maybe not as fast as direct comparisons suggest.",
    howToRead: "Each line is a different imputation model from the Tinbergen paper's Table 5. Read the range and trend, not one exact point.",
    mistakeToAvoid: "Do not treat this as an official poverty series. It is a research benchmark built to handle survey non-comparability.",
    mobileNote: "Focus on the 2022 endpoints and the flat post-2017 pattern."
  },
  {
    visualId: visualTitles[7],
    takeaway: "Average consumption rose in both rural and urban India.",
    detail: "Without imputation, rural MPCE rose from Rs 1,430 in 2011-12 to Rs 4,122 in 2023-24. Urban MPCE rose from Rs 2,630 to Rs 6,996.",
    whyShowThis: "Consumption growth is the main household-side evidence behind falling poverty estimates.",
    howToRead: "The lines are monthly per-person consumption in current rupees.",
    mistakeToAvoid: "Do not read current-rupee gains as full real gains. Inflation matters.",
    mobileNote: "Use the gap between the two latest points to see the rural-urban spread."
  },
  {
    visualId: visualTitles[8],
    takeaway: "Counting free welfare items lifts measured consumption, especially near the floor.",
    detail: "HCES reports MPCE both without and with the imputed value of items received free through welfare programmes. In 2023-24, the average imputation gap in our HCES artifacts is about ₹125 per person per month in rural India and ₹82 in urban India.",
    whyShowThis: "It separates a real welfare support from a pure cash-income story.",
    howToRead: "Compare each imputed line with its non-imputed counterpart.",
    mistakeToAvoid: "Counting transfers is not fake, but it changes what the number means.",
    mobileNote: "The rural pair is the cleanest read."
  },
  {
    visualId: visualTitles[9],
    takeaway: "The poorest rural households still consume on a very thin monthly budget.",
    detail: "In HCES 2023-24, the poorest 5% of rural India averaged Rs 1,677 per person per month. The ladder rises steadily, but the bottom rung is the point.",
    whyShowThis: "Averages can hide the people closest to the poverty line.",
    howToRead: "Move from the poorest fractile to the richest fractile and compare monthly per-person consumption.",
    mistakeToAvoid: "Do not turn household MPCE into individual wellbeing. Intra-household gaps are not shown.",
    mobileNote: "Read the first bar and the last bar."
  },
  {
    visualId: visualTitles[10],
    takeaway: "The poverty rate is highly sensitive to the monthly rupee cutoff.",
    detail: "Using the reconstructed HCES 2023-24 MPCE distribution, a Rs 3,000 monthly cutoff puts about 22.7% of people below the line. At Rs 4,000, the simulated headcount rises to 46.2%. Each bar is a percent of people, not rupees.",
    whyShowThis: "It lets readers see why poverty-line fights matter. Moving the floor changes the population counted as poor.",
    howToRead: "Each bar is a nominal monthly per-person MPCE cutoff and the share of people below it.",
    mistakeToAvoid: "This is not an official estimate and not a PPP-dollar poverty line. It is a sensitivity check in 2023-24 rupees.",
    mobileNote: "Compare Rs 3,000 and Rs 4,000 first."
  },
  {
    visualId: visualTitles[11],
    takeaway: "A single national cutoff hides where the simulated poverty burden is concentrated.",
    detail: "At a Rs 3,000 monthly MPCE cutoff, the simulated headcount is 60.1% in Chhattisgarh, 52.0% in Jharkhand and 43.4% in Odisha. The bars are shares of people below that rupee cutoff.",
    whyShowThis: "It turns the cutoff simulation from an all-India argument into a geography argument.",
    howToRead: "States are ranked by the share of people below Rs 3,000 per person per month.",
    mistakeToAvoid: "Do not treat this as an official state poverty rate. It does not adjust for state price levels.",
    mobileNote: "The first few bars carry the main message."
  },
  {
    visualId: visualTitles[12],
    takeaway: "Where a household lives changes the poverty conversation.",
    detail: "Rural Kerala's average MPCE is more than twice rural Chhattisgarh's. A national poverty rate compresses this geography into one figure.",
    whyShowThis: "It shows why state context matters even when national poverty falls.",
    howToRead: "States are ranked from higher to lower rural MPCE.",
    mistakeToAvoid: "This is not a state poverty rate. It is an average consumption level.",
    mobileNote: "Compare the top three and bottom three states."
  },
  {
    visualId: visualTitles[13],
    takeaway: "The same rupee floor produces very different simulated headcounts by social group.",
    detail: "At the Rs 3,000 MPCE cutoff, 46.8% of people in Scheduled Tribe households are below the line, compared with 28.4% in Scheduled Caste households, 20.8% in OBC households and 12.7% in Others.",
    whyShowThis: "It shows that poverty-line choice interacts with India's social structure.",
    howToRead: "Each bar is the simulated below-cutoff share for people living in households headed by that social group.",
    mistakeToAvoid: "This is descriptive, not causal. It does not isolate caste from region, education, land or occupation.",
    mobileNote: "Compare Scheduled Tribe and Others first."
  },
  {
    visualId: visualTitles[14],
    takeaway: "Social location still maps onto consumption.",
    detail: "HCES microdata shows average MPCE of Rs 6,148 for 'Others', Rs 5,068 for OBC households, Rs 4,277 for Scheduled Caste households and Rs 3,614 for Scheduled Tribe households.",
    whyShowThis: "It keeps caste from disappearing inside a national average.",
    howToRead: "The bars are group averages by social group of the household head.",
    mistakeToAvoid: "This is not a causal model. It is an observed gap shaped by many channels.",
    mobileNote: "Read the gradient from Others to Scheduled Tribe."
  },
  {
    visualId: visualTitles[15],
    takeaway: "NITI's MPI shows a big fall in deprivation, but it is not the same as a consumption-poverty line.",
    detail: "NITI's national MPI headcount falls from 55.34% in the 2005-06 NFHS-3 baseline to an estimated 11.28% in 2022-23. Some points are measured from NFHS rounds and some are interpolated or projected.",
    whyShowThis: "The article needs more than cash and consumption lines.",
    howToRead: "The line tracks the share of people classified as multidimensionally poor.",
    mistakeToAvoid: "Do not add MPI and consumption poverty together, and do not treat every point as directly surveyed.",
    mobileNote: "The endpoints carry the main message."
  },
  {
    visualId: visualTitles[16],
    takeaway: "The geography of deprivation remains visible in the MPI data too.",
    detail: "In NITI's NFHS-5-era state MPI, Bihar is at 33.76%, Jharkhand at 28.81% and Meghalaya at 27.79%. Kerala is 0.55%, Goa 0.84% and Tamil Nadu 2.20%.",
    whyShowThis: "It checks the consumption geography against a non-cash deprivation measure.",
    howToRead: "States and union territories are ranked by MPI headcount.",
    mistakeToAvoid: "Do not compare these directly with 2023-24 HCES consumption cutoffs. They come from a different measure and survey period.",
    mobileNote: "Read the top and bottom of the ranking."
  },
  {
    visualId: visualTitles[17],
    takeaway: "Nutrition keeps the poverty story from becoming a victory lap.",
    detail: "NFHS-6 puts child stunting at 29.3%, child underweight at 31.8% and child wasting at 19.0%. Adequate diet among children aged 6-23 months is only 15.3%.",
    whyShowThis: "Consumption lines can improve before human bodies fully recover from deprivation.",
    howToRead: "Each bar is the latest all-India NFHS-6 value for a nutrition indicator.",
    mistakeToAvoid: "Do not treat nutrition as a cash-poverty measure. It is shaped by food, disease, sanitation, care and health services.",
    mobileNote: "Stunting, underweight and adequate diet carry the main signal."
  },
  {
    visualId: visualTitles[18],
    takeaway: "Some basic-service gaps are now small, but sanitation and schooling deprivation remain visible.",
    detail: "The World Bank MPM components put electricity deprivation at 1.0% in 2022-23, while lack of limited-standard sanitation is 29.9% and no adult primary completion is 13.8%.",
    whyShowThis: "It shows the non-cash dimensions behind the MPI conversation.",
    howToRead: "Each bar is one deprivation component.",
    mistakeToAvoid: "The World Bank MPM excludes nutrition and health deprivation, so this cannot settle the child-nutrition question.",
    mobileNote: "The sanitation bar is the largest."
  },
  {
    visualId: visualTitles[19],
    takeaway: "A job does not automatically remove vulnerability.",
    detail: "Working poverty has fallen, but it remains a necessary caveat to any poverty-is-over claim. Work quality, informality and low earnings decide whether households stay above the line.",
    whyShowThis: "It connects poverty to labour-market security rather than treating poverty as a one-time threshold crossing.",
    howToRead: "Compare all workers with young workers over time.",
    mistakeToAvoid: "Modelled ILOSTAT working poverty should be read with PLFS wage and informality data, not alone.",
    mobileNote: "The youth line is the vulnerability check."
  },
  {
    visualId: "The broader line is crowded with children and low-education households",
    takeaway: "The remaining broader-line poverty burden is concentrated among children and people with low education.",
    detail: "At the World Bank's $4.20-a-day line, 31.2% of children aged 0-14 are below the line. Among adults aged 16 and above, the rate is 30.2% for those with no education and 8.7% for those with tertiary or post-secondary education.",
    whyShowThis: "It stops the article from treating the remaining poor as one undifferentiated national block.",
    howToRead: "Read each bar as the poverty rate within that group. The groups overlap, so the bars are not parts of a whole.",
    mistakeToAvoid: "Do not add the bars together. A child can live in a rural household, and education categories apply only to adults.",
    mobileNote: "Start with children, no education and tertiary education."
  },
  {
    visualId: "The poorest half gets about a third of rural consumption",
    takeaway: "Threshold poverty is falling, but rural consumption is still unevenly distributed.",
    detail: "In HCES 2023-24, the poorest half of rural India accounts for 33.6% of rural consumption. The richest 10% accounts for 20.7%, and the richest 5% alone accounts for 12.3%.",
    whyShowThis: "A poverty line tells us who is below a cutoff; this shows how the consumption mass is split around the cutoff.",
    howToRead: "Compare the poorest 50%, middle 40% and richest 10% shares. They are shares of total rural consumption, not population shares.",
    mistakeToAvoid: "Do not read consumption shares as income or wealth inequality. Income and asset concentration are usually sharper.",
    mobileNote: "Compare the poorest half with the richest 10%."
  },
  {
    visualId: "The basic household floor rose, but health cover still lags",
    takeaway: "Basic household services are now close to universal in some areas, but capability gaps remain.",
    detail: "NFHS-6 puts electricity at home at 98.3%, improved drinking water at 96.5% and household bank account access at 98.2%. Household health insurance is lower at 60.2%, and women ever attending school is 73.7%.",
    whyShowThis: "It separates genuine capability gains from the stronger claim that deprivation is over.",
    howToRead: "Treat the bars as a dashboard of basic capabilities. The denominator changes across indicators.",
    mistakeToAvoid: "Do not compare these as if they were all the same population. Some are household measures, one is for women.",
    mobileNote: "Near-universal electricity and water are the good-news bars; health insurance and women's schooling are the gap bars."
  },
  {
    visualId: "A hospital bill can still push households back down",
    takeaway: "Health spending is one of the clearest reasons above-the-line households remain vulnerable.",
    detail: "World Bank UHC financial-protection indicators put 30.94% of India's population facing financial hardship from out-of-pocket health spending in 2022. The same framework puts impoverishing out-of-pocket health spending at 22.27%.",
    whyShowThis: "It adds a shock-and-security lens that a static poverty headcount cannot show.",
    howToRead: "Each bar is a population share affected by out-of-pocket health spending under a World Bank financial-protection indicator.",
    mistakeToAvoid: "Do not treat this as an HCES poverty rate. It is a health-financing vulnerability measure.",
    mobileNote: "Read the financial-hardship and impoverishing-spending bars first."
  },
  {
    visualId: "Poverty gaps show depth, not just headcount",
    takeaway: "The lowest-line poverty gap is now small, but the higher-line gap remains large.",
    detail: "The World Bank poverty gap measures the average proportional shortfall from each line, with non-poor people counted as zero. In 2022, India's gap is 0.8% at $3/day, 4.4% at $4.20/day and 31.1% at $8.30/day.",
    whyShowThis: "Headcounts can miss depth. A poverty gap shows whether poor households are just below a line or far below it.",
    howToRead: "Compare the bars across poverty lines. Higher bars mean a larger average shortfall from that line.",
    mistakeToAvoid: "Do not read a poverty gap as a share of people. It is a depth measure, not a headcount.",
    mobileNote: "The $8.30 bar is the key contrast."
  },
  {
    visualId: "The global MPI adds intensity and vulnerability",
    takeaway: "Global MPI data shows not only who is poor, but how deprived and how close to poverty people are.",
    detail: "OPHI/UNDP's Global MPI country briefing puts India's 2019-21 MPI headcount at 16.4%, with 18.7% vulnerable to multidimensional poverty and 4.2% in severe multidimensional poverty. The rural headcount is 21.2%, compared with 5.5% urban, and intensity among the MPI poor is 42.0%.",
    whyShowThis: "NITI's national MPI is useful, but the global MPI adds internationally comparable intensity and vulnerability cuts.",
    howToRead: "The bars mix related MPI concepts: headcount, vulnerability, severe poverty and intensity. Use the labels, not just bar height.",
    mistakeToAvoid: "Do not treat this as the same index as NITI's national MPI. The indicator set and purpose differ.",
    mobileNote: "Compare national MPI poor, vulnerable and severe first."
  }
];

const bodyMarkdown = `## So has India ended poverty?

Only at the lowest meaning of the word. At the World Bank's $3-a-day line, which is about ₹58 per person per day in 2021 PPP rupees, India's poverty rate fell from 27.1% in 2011-12 to 5.3% in 2022-23. That is a large, real fall. It means India is no longer the country where extreme consumption poverty described a quarter of the population.

Move the line to $4.20 a day, about ₹82 in the same PPP terms and the lower-middle-income-country benchmark, and the same data gives a different answer. Poverty still falls hard, from 57.7% to 23.9%, but nearly a quarter of the country remains below that fuller floor. In people, that is about 34.2 crore (342 million). The honest answer is plain: the floor rose. The floor is still low.

## What does PPP mean?

PPP means purchasing-power parity. It is a way to translate money by what it can buy locally, not by the market exchange rate. In this article, one international dollar is not the same thing as one US dollar converted at today's forex rate. It is a standardised purchasing-power unit.

That is why the World Bank lines should be read as global comparison lines. In India's 2021 consumption PPP, $3 a day is roughly ₹58 a day, $4.20 is roughly ₹82, and $8.30 is roughly ₹162. These are not today's Indian official poverty lines. They are a way to ask how many people fall below comparable global floors.

The line names also changed in 2025 because the World Bank moved from 2017 PPPs to 2021 PPPs after the International Comparison Program released new price data. The old $2.15 extreme-poverty line became $3.00; the old $3.65 lower-middle-income line became $4.20; and the old $6.85 upper-middle-income line became $8.30. That update changes the price-year and benchmark. It is not a claim that every household suddenly became poorer overnight.

## Why does the next floor get so crowded?

India turns percentages into populations. A 5.3% extreme-poverty rate at the $3 line is about 7.5 crore people (75 million). At the $4.20 line, the count is about 34.2 crore (342 million). At the $8.30 upper-middle-income line, the World Bank WDI/PIP series implies about 117 crore people (1,170 million) in 2022.

That is why "poverty is gone" is too loose. It may describe the direction of the lowest line, but it does not describe the scale of remaining vulnerability. If a household is above $3 but below $4.20, it is not destitute by the global extreme-poverty floor. It is also not secure in any normal Indian sense.

## How far below the line are people?

The World Bank also publishes poverty gaps. This is the depth measure the headcount leaves out. A headcount asks how many people are below a line. A poverty gap asks, on average, how far below that line people are, counting people above the line as zero gap.

At the $3 line, India's poverty gap is down to 0.8% in 2022. That supports the claim that the deepest poverty has become much shallower. At the $4.20 line the gap is 4.4%. At the $8.30 line it is still 31.1%. So the depth story matches the headcount story: the lowest floor has improved dramatically, but the broader security floor is still far away.

## Why is rural poverty still the harder half?

At the $4.20 line, rural poverty fell from 64.9% in 2011-12 to 27.7% in 2022-23. Urban poverty fell from 39.7% to 14.3%. Both are big declines. The rural rate is still nearly twice the urban rate.

That matters because rural India is where low productivity, farm risk, casual work and weaker services meet. The poverty line does not prove those causes by itself. It does show where the burden remains heavier.

## Who remains below the broader line?

The World Bank group cuts add another layer. At the $4.20 line, 31.2% of children aged 0-14 are below the line. Adults with no education are at 30.2%. Adults with tertiary or post-secondary education are at 8.7%.

This is not a causal model, and the groups overlap. But it is an important descriptive fact: the remaining poverty burden is younger and more education-linked than a national average can show.

## Why is India's official poverty line still controversial?

India's last adopted official poverty estimate is the Planning Commission's Tendulkar number for 2011-12: 21.9%. That series fell from 45.3% in 1993-94 to 21.9% in 2011-12. Then the official line stopped. Since then, newer poverty claims have usually come from international lines, HCES-based estimates, NITI's MPI, or independent work.

The missing middle matters. India conducted a 2017-18 consumption survey, but the government did not release it, citing data-quality concerns. Leaked reporting from the unreleased "Key Indicators" report said real average MPCE fell 3.7% between 2011-12 and 2017-18, with rural MPCE down 8.8% and urban MPCE up 2.0%. Because that survey was discarded, India has an 11-year break in the official consumption-poverty series.

The controversy is not only political. It is methodological. A poverty line is a moral choice disguised as a number: what basket of consumption is enough to stop calling a person poor?

## What did Tendulkar and Rangarajan disagree on?

Tendulkar and Rangarajan used the same broad object, household consumption, but drew different floors. In 2011-12, Tendulkar put all-India poverty at 21.9%. Rangarajan's higher standard put it at 29.5%.

That difference is the point. A higher poverty standard did not just move a line on paper. It counted a much larger share of the same country as poor in the same survey year.

## What did the old poverty lines mean in rupees?

The rupee lines make the fight easier to see. Tendulkar's line was about Rs 816 per person per month in rural India and Rs 1,000 in urban India. Rangarajan proposed Rs 972 rural and Rs 1,407 urban. None of these are current living-cost numbers. They show why the old official line felt too low to many people even when the measured trend was improving.

## What if the post-2011 fall is overstated?

This is where the Tinbergen paper is useful. Himanshu, Lanjouw and Schirmer argue that a direct 2011-12 to 2022-23 comparison is unsafe because the newer HCES changed the consumption definition, recall periods, field process and treatment of free welfare items. So they estimate poverty through survey-to-survey imputation instead.

Their finding is not that poverty failed to fall. It is that the fall may have slowed sharply. In their PLFS-imputation exercise, Tendulkar-compatible poverty is around 17.5-19.9% in 2022-23, depending on model, and the post-2017 path is fairly flat. That is a very different story from treating the new HCES as directly comparable and reading poverty as nearly gone.

## What does HCES say about the consumption floor?

HCES measures MPCE, monthly per-capita consumption expenditure. Take a household's monthly consumption, divide it by the number of members, and you get the per-person figure.

By that measure, average consumption rose. Rural MPCE, without imputation of free welfare items, went from Rs 1,430 in 2011-12 to Rs 4,122 in 2023-24. Urban MPCE went from Rs 2,630 to Rs 6,996. Some of that is inflation. Some is real improvement. Either way, this is the consumption base on which poverty estimates changed.

This is also where the wage-versus-consumption puzzle enters. The PLFS-derived real casual wage series in our data rises from about Rs 187 a day in 2017-18 to Rs 224 in 2023-24, in 2012 prices. That is progress, but not a boom. Rural-wage series are also much flatter than a simple reading of current-rupee HCES growth. So the article should not pretend every data source is saying the same thing with the same force.

## What changes when free welfare items are counted?

HCES now reports consumption with and without the imputed value of items received free through welfare programmes. This matters most near the floor. Free foodgrain is real consumption. A household that eats it is better off than a household that does not receive it.

But it changes the reading. With imputation, we are measuring consumption supported by public transfers, not only what households bought from cash income. That is not a trick. It is also not the same as saying household earning power rose by the full amount.

In the HCES series we are using, imputation adds about Rs 125 per person per month to average rural MPCE in 2023-24 and about Rs 82 in urban India. In 2022-23, the comparable gaps are about Rs 87 rural and Rs 62 urban. Those are averages; the effect can matter more for households close to the floor.

## Who is still close to the floor?

Averages are too comfortable. In rural HCES 2023-24, the poorest 5% averaged Rs 1,677 per person per month. The next 5% averaged Rs 2,126. The ladder rises from there, but the bottom rungs are thin enough to make "eradication" sound careless.

MPCE is not income. It does not show assets, debts, medical shocks, rent pressure, or who inside the household actually consumes what. A child, an elderly person and an adult earner can sit behind the same household average.

## How is rural consumption split?

The poorest half of rural India accounts for 33.6% of rural consumption in HCES 2023-24. The middle 40% accounts for 45.7%. The richest 10% accounts for 20.7%, with the richest 5% alone at 12.3%.

This is not income inequality or wealth inequality. It is narrower than both. But it gives useful texture around the poverty line: the floor rose, while the rural consumption distribution still leaves the bottom half with about a third of the spending.

## Can we simulate different poverty cutoffs?

Yes, as long as we are clear about what is being simulated. Using the HCES 2023-24 unit data, we can ask: what share of people live in households below any chosen monthly MPCE cutoff? This is not the World Bank's PPP method and not an official Indian line. It is a sensitivity test in 2023-24 rupees.

The sensitivity is huge. At Rs 2,500 per person per month, the simulated all-India headcount is 11.6%. At Rs 3,000 it is 22.7%. At Rs 4,000 it is 46.2%. This is why the poverty-line debate matters. The line is not a small technical footnote; it decides who counts.

## Where does the simulated cutoff bite hardest?

The Rs 3,000 cutoff also shows why a national rate is incomplete. In the reconstructed HCES distribution, 60.1% of people in Chhattisgarh fall below that line. Jharkhand is 52.0%, Odisha is 43.4%, Madhya Pradesh is 37.3% and Uttar Pradesh is 34.4%.

These are not official state poverty rates. We are applying one nominal rupee cutoff across states, without adjusting for state price differences. But as a sensitivity check, the point is clear: the same national poverty line produces very different social and political realities across India.

## Why does the map change the answer?

National poverty lines flatten India. Rural Kerala averaged Rs 6,611 per person per month in HCES 2023-24. Rural Chhattisgarh averaged Rs 2,739. Jharkhand and Odisha were also near the lower end. These are state averages, not poverty rates, but they show how different the floor is across India.

This is the part a national victory lap misses. A falling all-India rate can coexist with large state gaps. It usually does.

## What happens when the same cutoff is applied by caste?

At Rs 3,000 per person per month, the simulated below-cutoff share is 46.8% for people in Scheduled Tribe households and 28.4% for Scheduled Caste households. It is 20.8% for OBC households and 12.7% for households in the 'Others' category.

This is the same sensitivity exercise, but now by social group of the household head. It is descriptive, not causal. Still, it says something important: the poverty-line debate is not socially neutral. A higher line does not simply add a random slice of the population. It disproportionately pulls in communities already sitting lower in the consumption distribution.

## How does caste enter the poverty story?

HCES microdata puts the social gradient in plain view. Households in the 'Others' category averaged Rs 6,148 per person per month. OBC households averaged Rs 5,068. Scheduled Caste households averaged Rs 4,277. Scheduled Tribe households averaged Rs 3,614.

These are raw averages, not a causal estimate. They combine land, education, occupation, region, discrimination and history. But as observed facts, they are hard to ignore. Poverty risk in India is still socially patterned.

## What does multidimensional poverty add?

NITI's national MPI tells a different but related story. Its headcount fell from 55.34% in 2005-06 to 11.28% in 2022-23. That is a large fall in deprivation across health, education and living standards.

MPI should not be mixed up with cash poverty. It asks whether households are deprived across a set of capabilities. Some NITI points are interpolated or projected because matching NFHS survey years do not exist. The direction is useful. The exact endpoint should be read with that caveat.

## What does the global MPI add?

The OPHI/UNDP Global MPI gives a slightly different view because it is built for international comparability, while NITI's national MPI is tailored to India. In the 2019-21 Global MPI country briefing, India's headcount is 16.4%. The average intensity among MPI-poor people is 42.0%, which means the poor are deprived in 42.0% of weighted indicators on average.

Two extra numbers are useful. Another 18.7% of the population is vulnerable to multidimensional poverty, meaning they are deprived in 20-33.33% of weighted indicators and are close to the poverty cutoff. Severe multidimensional poverty is much smaller, at 4.2%. The rural-urban split is sharp too: 21.2% rural, 5.5% urban. This is not the same as NITI's index, but it tells the same larger story: poverty is lower, not gone.

## Where does multidimensional poverty remain highest?

The state MPI ranking puts geography back into the story. Bihar's NFHS-5-era MPI headcount is 33.76%. Jharkhand is 28.81%, Meghalaya is 27.79%, Uttar Pradesh is 22.93% and Madhya Pradesh is 20.63%. At the other end, Kerala is 0.55%, Goa is 0.84% and Tamil Nadu is 2.20%.

This is not the same as HCES consumption poverty. It is a deprivation index built from health, education and living-standard indicators. But it confirms the larger pattern: poverty fell nationally, while the map of deprivation remains uneven.

## What basic floor has India built?

NFHS-6 shows large gains in some basic household capabilities. Electricity at home is 98.3%. Improved drinking water is 96.5%. Household bank-account access is 98.2%. These are not small achievements.

But the same dashboard keeps the story grounded. Household health insurance is 60.2%, and women who ever attended school is 73.7%. The basic floor is much stronger than it used to be. It is still not the same thing as security.

## What does nutrition refuse to let us forget?

Nutrition is where the poverty-is-over claim becomes weakest. NFHS-6 puts child stunting at 29.3%, child underweight at 31.8% and child wasting at 19.0%. Only 15.3% of children aged 6-23 months received an adequate diet. Women underweight rose slightly from 18.7% in NFHS-5 to 19.7% in NFHS-6.

These are not poverty rates. They are outcomes shaped by food, infection, sanitation, care work and public health. But if poverty is meant to mean deprivation in lived life, not only crossing a low consumption line, these numbers belong in the article.

## Did basic services erase deprivation?

Some service gaps have shrunk dramatically. In the World Bank's multidimensional components, lack of electricity is down to 1.0% in 2022-23. But lack of limited-standard sanitation is 29.9%, and no adult completing primary education is 13.8%.

Also, the World Bank notes that its multidimensional poverty measure excludes nutrition and health deprivation. That matters for India, where child nutrition and anaemia have been central to the welfare debate. Services improved. That does not settle the whole poverty question.

## What happens when illness hits the household budget?

This is the vulnerability section the poverty-line debate often misses. The World Bank's UHC financial-protection indicators put 30.94% of India's population facing financial hardship from out-of-pocket health spending in 2022. They put impoverishing out-of-pocket health spending at 22.27%.

That is not an HCES poverty rate. It is a health-financing measure. But it belongs here because a household just above a poverty line is not secure if one hospital bill can pull it back below the line, force borrowing, or cut food and schooling.

## Why does work quality matter?

Poverty is not only whether a household crossed a line in a survey year. It is also whether it can stay above the line after a bad monsoon, a fever, a job loss or a rent increase. That is where work quality enters.

ILOSTAT's working-poverty series has fallen, but it keeps a hard fact in view: employment is not the same as security. India's labour market has too much casual work, self-employment with low returns, and informality inside salaried work. A poverty article that stops at the headcount misses this fragility.

## Methodology: how to read these numbers

This article is built as a set of floors, not one verdict. The World Bank's $3 line measures extreme consumption poverty using international PPP dollars. In India's 2021 household-consumption PPP, that is roughly Rs 58 per person per day. The $4.20 line is the lower-middle-income-country standard, roughly Rs 82 per day. The $8.30 line is the upper-middle-income-country standard, roughly Rs 162 per day. These rupee figures are PPP translations for comparison, not market exchange-rate conversions and not official Indian poverty lines.

The PPP conversion is approximate and rounded. We used India's 2021 household final consumption PPP conversion factor, about Rs 19.47 per international dollar, then multiplied it by each World Bank daily line: $3, $4.20 and $8.30. That gives about Rs 58, Rs 82 and Rs 162 per person per day in 2021 PPP rupees. We show those rupee equivalents only to make the lines legible for Indian readers.

The World Bank line names changed because the World Bank moved from 2017 PPPs to 2021 PPPs after the International Comparison Program released new price data. The old $2.15 extreme-poverty line became $3.00. The old $3.65 lower-middle-income line became $4.20. The old $6.85 upper-middle-income line became $8.30. This is a price-year and benchmark update. It does not mean every household suddenly became poorer when the line changed.

The people counts are shown in crores because that is easier for Indian readers. We did not change the underlying World Bank million-person counts. For the $3 and $4.20 lines, we converted the World Bank brief's counts from millions into crores by dividing by 10: 75.24 million becomes 7.52 crore, and 342.32 million becomes 34.23 crore. In prose, we round this to 7.5 crore (75 million) and 34.2 crore (342 million).

The $8.30 count is derived, not copied from the World Bank brief. We took the World Bank WDI/PIP headcount rate for India at the $8.30 line, 82.1% in 2022, multiplied it by the World Bank population series for India, and divided by one crore. That gives about 117 crore people, or about 1,170 million. Because this is a derived count, the article treats it as an approximate scale marker, not as a separately published World Bank count in the India brief.

The official Indian poverty-line section uses the Planning Commission's Tendulkar series and the Rangarajan Expert Group report. Tendulkar is India's last adopted official national poverty line, and the official all-India estimate stops at 2011-12. Rangarajan is included because it is the best-known higher committee benchmark for the same 2011-12 survey year, not because it became the official line.

The post-2011 comparability problem is central. HCES 2022-23 and 2023-24 are not mechanically comparable with NSS/CES 2011-12 because questionnaire design, recall periods, survey process, sampling and the treatment of free welfare items changed. The World Bank adjusts old and new consumption surveys for its international estimates, but even then the comparison is not the same as having an unbroken official Indian poverty series.

The unreleased 2017-18 consumption survey is treated as reported evidence, not as an official table. Media reporting on the leaked "Key Indicators" report said real average MPCE fell 3.7% between 2011-12 and 2017-18, with rural MPCE down 8.8% and urban MPCE up 2.0%. The government did not release the survey, citing data-quality concerns. We include the figures because they explain the 11-year break and the political economy of the poverty debate, but we do not use them as a formal article data series.

The Tinbergen paper is used as a methodological counterweight. Himanshu, Lanjouw and Schirmer do not simply compare the old NSS consumption survey with the new HCES. They use survey-to-survey imputation through PLFS data to estimate Tendulkar-compatible poverty after 2011-12. We chart their three reported model paths as research estimates, not official poverty rates. The point is the range of credible disagreement: poverty fell, but the speed of the post-2011 fall is contested.

The HCES MPCE charts use MoSPI's published 2023-24 tables and related HCES artifacts. MPCE means monthly per-capita consumption expenditure: household monthly consumption divided by household members. It is consumption, not income, savings, assets, debt or wealth. A household can have low MPCE but own assets; another can have temporarily high MPCE funded by borrowing. MPCE also cannot show who inside the household actually consumes what.

For welfare imputation, we compare HCES MPCE without imputation and with the imputed value of items received free through welfare programmes. Counting free foodgrain or other free items is not fake: those items are real consumption. But it changes the meaning of the number because measured consumption now includes state-supported consumption, not only what households bought from cash income. In the HCES series used here, imputation adds about Rs 125 per person per month to average rural MPCE in 2023-24 and about Rs 82 in urban India. In 2022-23, the comparable gaps are about Rs 87 rural and Rs 62 urban.

We did not publish a bottom-5 welfare-imputation estimate because we do not yet have a reproducible artifact for that specific bottom-fractile imputation gap. If we add it later, it should come either from unit-level reconstruction that separately identifies imputed free-item value by household, or from a published MoSPI fractile table that reports MPCE with and without imputation by fractile. Until then, the article uses only the average imputation gaps we can trace.

The rupee-cutoff simulation is our own sensitivity exercise using HCES 2023-24 unit-level microdata. For each household, we reconstruct monthly consumption from the unit records, apply reference-period scaling to put weekly and annual items onto a monthly basis, divide by household size to get MPCE, and weight by household multiplier times household size. Then we ask what share of people live in households below chosen monthly MPCE cutoffs such as Rs 2,500, Rs 3,000 or Rs 4,000 per person per month.

The simulation is calibrated to published rural and urban HCES means. After reconstructing MPCE from the unit files, we scale rural and urban records so their weighted means match the published 2023-24 non-imputed MPCE values: Rs 4,122 rural and Rs 6,996 urban. This keeps the microdata distribution aligned with the official published averages while preserving the shape of the reconstructed distribution.

The cutoff simulation is not an official poverty estimate. It uses nominal 2023-24 rupees, not PPP dollars. It does not adjust each state cutoff for local prices. It does not choose a normative poverty basket. It is a sensitivity test: if a reader thinks Rs 3,000 per person per month is too low or too high, the chart shows how sharply the headcount changes when that floor moves.

The state and social-group cutoff charts apply the same nominal MPCE threshold to subgroups. The state chart ranks people by the household's reported state. The social-group chart uses the social group of the household head: Scheduled Tribe, Scheduled Caste, OBC or Others. These are descriptive cuts, not causal estimates. They combine region, education, occupation, land, prices, discrimination and household composition into one observed headcount.

The consumption-share and fractile charts are also HCES consumption measures, not income or wealth measures. Consumption inequality is usually narrower than income inequality, and much narrower than wealth inequality. The poorest rural 5% MPCE chart is useful because it shows the floor behind the average, but it should not be read as a full account of deprivation, debt or vulnerability.

The multidimensional poverty section deliberately uses a different concept. NITI's MPI is a deprivation index across health, education and living standards. It is not a rupee poverty line and should not be added to the World Bank or HCES headcounts. Some NITI points are interpolated or projected because exact matching survey years do not exist, so the broad direction is stronger than the precision of any single non-survey-year point.

The NFHS charts are outcome evidence, not poverty rates. Electricity, water, bank accounts, schooling, insurance and nutrition indicators show whether the basic floor of life has improved. Nutrition indicators such as stunting, wasting, underweight and adequate diet are shaped by food, disease, sanitation, care, health systems and intra-household allocation. They belong in a poverty article because poverty is lived as deprivation, but they cannot be converted one-for-one into consumption poverty.

The health-spending chart uses World Bank UHC financial-protection indicators. These measure vulnerability from out-of-pocket health spending: whether health costs create financial hardship or push households below a poverty threshold. They are not HCES poverty headcounts. Their role here is to show why being just above a poverty line is not the same as being secure.

The work section uses ILOSTAT working-poverty indicators and PLFS-derived wage context. Working poverty is modelled internationally and should be paired with Indian labour-market data before making strong job-quality claims. The PLFS-derived real casual wage series we cite rises from about Rs 187 a day in 2017-18 to Rs 224 in 2023-24 in 2012 prices. That adds an important warning: consumption estimates, wage trends and deprivation indicators are not all saying the same thing with the same force.

The source audit also found official measures that are useful context but too easy to misread as direct poverty rates. The World Bank societal poverty headcount is 21.3% in 2022. Its prosperity gap is 5.4, an average shortfall from a $28/day prosperity standard, not a poverty line. World Bank learning poverty is 56.1% for end-of-primary-age children in 2017. The World Bank's October 2025 India brief reports its Multidimensional Poverty Measure at 15.5% for 2022-23, while the WDI API series reports 17.7% for 2022. These belong in the evidence base and caveats, but they should not be mixed into the main poverty headcount unless the article explicitly changes the question.

The main assumption of the article is that poverty in India is best read through multiple lenses: international consumption poverty, old official Indian lines, HCES consumption distribution, multidimensional deprivation, nutrition and vulnerability. The main transformation choices are: converting World Bank counts from millions to crores; translating international PPP dollars into approximate 2021 PPP rupees; deriving the $8.30 count from headcount rate times population; calibrating HCES unit-level MPCE to published rural and urban means; and treating all simulated cutoffs as sensitivity tests rather than official poverty lines.

The right conclusion is not that nothing changed. Too much changed for that. The right conclusion is also not that poverty is over. Extreme poverty fell sharply; broader poverty, deprivation and vulnerability remain.`;

const doc = {
  schemaVersion: 1,
  questionId: "q.econ.poverty",
  status: "ready",
  short: {
    headline: "Extreme poverty fell. Poverty did not disappear.",
    dek: "At $3 a day, about ₹58/day in 2021 PPP rupees, India's poverty rate is down to 5.3%. At $4.20, about ₹82/day, it is still 23.9%. The line you choose changes the answer.",
    body: "India has made a large, real reduction in the deepest consumption poverty. But 'poverty has been eradicated' only works if you stop at the lowest line. The World Bank's October 2025 brief puts 7.5 crore people (75 million) below $3 a day in 2022-23, and about 34.2 crore (342 million) below $4.20. India's own official Tendulkar line still stops at 2011-12, HCES shows the bottom rung remains thin, and MPI/work data show that deprivation and vulnerability have not vanished."
  },
  macha: {
    heading: "So, are we poor or not?",
    body: "Less poor than before, no doubt. But not poverty-free. Think of it like this: India lifted a huge number of people above the bare floor. That is real. But the next floor is still crowded, and a lot of families are one hospital bill, bad crop or lost job away from slipping back.",
    soWhat: "Celebrate the fall in extreme poverty. Do not confuse it with economic security."
  },
  article: {
    title: "Has India Ended Poverty?",
    standfirst: "India has sharply reduced extreme poverty, but the claim that poverty is gone depends on a very low line. Broader poverty, deprivation and vulnerability remain.",
    bodyMarkdown
  },
  editorialPlan: {
    audience: "average Indian reader",
    heroDescription: "The hero chart shows that poverty falls under both World Bank lines, but the latest answer is 5.3% at $3/day, about ₹58/day in 2021 PPP rupees, and 23.9% at $4.20/day, about ₹82/day.",
    selectedDataPoints: [
      { label: "$3/day poverty rate", reason: "Lowest current World Bank extreme-poverty line.", use: "hero" },
      { label: "$4.20/day poverty rate", reason: "Broader lower-middle-income benchmark.", use: "hero" },
      { label: "Tendulkar 2011-12", reason: "Last adopted official Indian poverty estimate.", use: "method" },
      { label: "HCES bottom rural fractile", reason: "Shows the floor behind the average.", use: "distribution" }
    ],
    pullQuotes: [
      { quote: "The floor rose. The floor is still low." }
    ],
    glossaryBlocks: [
      {
        term: "Poverty line",
        plainMeaning: "A threshold used to decide who counts as poor. Change the threshold and the headcount changes.",
        whyItMattersHere: "India looks close to ending poverty at a low line, but far from done at a broader line."
      },
      {
        term: "MPCE",
        plainMeaning: "Monthly per-capita consumption expenditure: household consumption in a month divided by household members.",
        whyItMattersHere: "HCES uses MPCE to estimate how much households actually consume."
      },
      {
        term: "PPP",
        plainMeaning: "Think of PPP like comparing baskets, not exchange rates. Purchasing-power parity converts money by what it can buy locally, so an international dollar is a standard buying-power unit, not a US dollar changed at today's forex rate.",
        whyItMattersHere: "World Bank poverty lines are in international PPP dollars. In India's 2021 consumption PPP, $3/day is roughly ₹58/day, $4.20 is roughly ₹82/day and $8.30 is roughly ₹162/day.",
        keyTerm: true
      },
      {
        term: "Multidimensional poverty",
        plainMeaning: "A measure of deprivation across living standards, health and education, not just spending.",
        whyItMattersHere: "NITI's MPI shows non-cash deprivation fell, but it is not the same as income poverty."
      }
    ]
  },
  dataSelectionAudit: {
    areSelectedDataPointsGood: "yes",
    addDataPoints: ["A future revision could add household debt, medical shock exposure and NFSA/PDS receipt if comparable microdata are brought into the pipeline."],
    removeDataPoints: [],
    visualizationDecisions: visualTitles.map((title) => ({
      indicatorOrVisual: title,
      bestChartType: "as specified in registry visualPlan",
      timeWindow: "survey years or latest available",
      frequency: "survey/report",
      reason: "Each visual answers a separate lens: line choice, scale, official-line method, consumption floor, distribution, geography, social group, multidimensional deprivation or work vulnerability."
    }))
  },
  chartExplainers,
  sectionVisualMap: [
    { sectionTitle: "So has India ended poverty?", visualId: visualTitles[0] },
    { sectionTitle: "Why does the next floor get so crowded?", visualId: visualTitles[1] },
    { sectionTitle: "How far below the line are people?", visualId: "Poverty gaps show depth, not just headcount" },
    { sectionTitle: "Why is rural poverty still the harder half?", visualId: visualTitles[2] },
    { sectionTitle: "Who remains below the broader line?", visualId: "The broader line is crowded with children and low-education households" },
    { sectionTitle: "Why is India's official poverty line still controversial?", visualId: visualTitles[3] },
    { sectionTitle: "What did Tendulkar and Rangarajan disagree on?", visualId: visualTitles[4] },
    { sectionTitle: "What did the old poverty lines mean in rupees?", visualId: visualTitles[5] },
    { sectionTitle: "What if the post-2011 fall is overstated?", visualId: visualTitles[6] },
    { sectionTitle: "What does HCES say about the consumption floor?", visualId: visualTitles[7] },
    { sectionTitle: "What changes when free welfare items are counted?", visualId: visualTitles[8] },
    { sectionTitle: "Who is still close to the floor?", visualId: visualTitles[9] },
    { sectionTitle: "How is rural consumption split?", visualId: "The poorest half gets about a third of rural consumption" },
    { sectionTitle: "Can we simulate different poverty cutoffs?", visualId: visualTitles[10] },
    { sectionTitle: "Where does the simulated cutoff bite hardest?", visualId: visualTitles[11] },
    { sectionTitle: "Why does the map change the answer?", visualId: visualTitles[12] },
    { sectionTitle: "What happens when the same cutoff is applied by caste?", visualId: visualTitles[13] },
    { sectionTitle: "How does caste enter the poverty story?", visualId: visualTitles[14] },
    { sectionTitle: "What does multidimensional poverty add?", visualId: visualTitles[15] },
    { sectionTitle: "What does the global MPI add?", visualId: "The global MPI adds intensity and vulnerability" },
    { sectionTitle: "Where does multidimensional poverty remain highest?", visualId: visualTitles[16] },
    { sectionTitle: "What basic floor has India built?", visualId: "The basic household floor rose, but health cover still lags" },
    { sectionTitle: "What does nutrition refuse to let us forget?", visualId: visualTitles[17] },
    { sectionTitle: "Did basic services erase deprivation?", visualId: visualTitles[18] },
    { sectionTitle: "What happens when illness hits the household budget?", visualId: "A hospital bill can still push households back down" },
    { sectionTitle: "Why does work quality matter?", visualId: visualTitles[19] }
  ],
  sourceNotes: [
    "World Bank Poverty & Equity Brief: India, October 2025, for international poverty lines, poverty counts, rural-urban splits and multidimensional components.",
    "World Bank WDI/Poverty and Inequality Platform for poverty gaps at $3, $4.20 and $8.30, societal poverty, prosperity gap, World Bank multidimensional poverty headcount and learning poverty.",
    "World Bank Poverty & Equity Brief, India, October 2025, for the brief-specific World Bank MPM headcount of 15.5% in 2022-23.",
    "World Bank 2025 global poverty-line update for the shift from 2017 PPP lines to 2021 PPP lines: $2.15 to $3.00, $3.65 to $4.20 and $6.85 to $8.30.",
    "World Bank WDI/Poverty and Inequality Platform SI.POV.UMIC for the $8.30 upper-middle-income poverty headcount and WDI population for the derived crore count.",
    "OPHI/UNDP Global MPI Country Briefing 2023 for India's global MPI headcount, intensity, vulnerability, severe poverty and rural-urban MPI split.",
    "Business Standard/Hindustan Times reporting on the unreleased 2017-18 consumption survey for the leaked 3.7% real MPCE decline, including the 8.8% rural decline and 2.0% urban rise.",
    "Planning Commission poverty press note for the official Tendulkar poverty history and 2011-12 poverty lines.",
    "Rangarajan Expert Group report for the alternative 2011-12 poverty headcount and line.",
    "Tinbergen Institute Discussion Paper 2025-069/V by Himanshu, Lanjouw and Schirmer for imputation-based post-2011 poverty estimates and the survey-comparability critique.",
    "MoSPI HCES 2023-24 press note and final tables for MPCE, imputation, fractiles, consumption shares, Gini and state consumption.",
    "HCES 2023-24 unit-level microdata for the rupee-cutoff sensitivity simulation and caste MPCE cuts.",
    "NITI Aayog multidimensional poverty discussion paper for national MPI headcount history and state MPI headcounts.",
    "NFHS-6 India factsheet for basic household capability and nutrition indicators.",
    "World Bank UHC financial-protection indicators for out-of-pocket health-spending hardship.",
    "ILOSTAT and PLFS-derived artifacts for working-poverty and job-quality context."
  ],
  caveats: [
    "The World Bank's 2022-23 poverty estimates use HCES and international PPP lines; they are not India's adopted official national poverty line.",
    "World Bank poverty gaps are depth measures, not headcount rates. They should not be read as the share of people below a line.",
    "World Bank societal poverty, prosperity gap, MPM and learning poverty are official indicators, but they answer different questions and are not directly comparable to HCES consumption poverty.",
    "The rupee equivalents shown for World Bank poverty lines are 2021 PPP rupees, not current exchange-rate conversions and not official Indian poverty lines.",
    "HCES 2022-23 and 2023-24 are not perfectly comparable with NSS 2011-12 because questionnaire design, survey implementation and sampling changed.",
    "The 2017-18 consumption-survey figures cited here were leaked from an unreleased report and should be read as reported findings, not as an official published table.",
    "The Tinbergen estimates are research estimates, not official rates; they are included because they directly model the comparability problem between older NSS/CES rounds and newer HCES/PLFS data.",
    "MPCE measures consumption, not income, assets, debt or intra-household allocation.",
    "Welfare imputation counts real consumed items received free or subsidised, but it also means measured consumption includes state support.",
    "The article reports average welfare-imputation gaps from the HCES artifacts; it does not yet report a bottom-fractile imputation gap because that specific derivation is not in a reproducible artifact.",
    "MPI is not cash poverty. NITI's non-survey-year estimates include interpolation or projection.",
    "The OPHI/UNDP Global MPI is not the same index as NITI's national MPI; it is included because it adds internationally comparable intensity, vulnerability and severe-poverty cuts.",
    "The HCES cutoff simulation is not an official poverty estimate; it is a sensitivity check using nominal 2023-24 rupee MPCE cutoffs and does not adjust state cutoffs for local prices.",
    "HCES consumption shares are not income or wealth shares; they show the distribution of consumption expenditure only.",
    "NFHS basic-capability indicators have mixed denominators, so the dashboard should not be read as one comparable headcount.",
    "NFHS nutrition indicators are outcomes, not poverty headcounts, and they should not be added to consumption-poverty rates.",
    "World Bank health financial-protection indicators are vulnerability and health-financing measures, not HCES poverty rates."
  ],
  lockedNumbersUsed: [
    "$3/day poverty rate: 27.1% in 2011-12 and 5.3% in 2022-23.",
    "$4.20/day poverty rate: 57.7% in 2011-12 and 23.9% in 2022-23.",
    "World Bank line update: $2.15/day in 2017 PPP became $3.00/day in 2021 PPP; $3.65 became $4.20; $6.85 became $8.30.",
    "Approximate India 2021 PPP rupee equivalents: $3/day ≈ Rs 58/day; $4.20/day ≈ Rs 82/day; $8.30/day ≈ Rs 162/day.",
    "People below $3/day in 2022-23: 7.52 crore (75.24 million).",
    "People below $4.20/day in 2022-23: 34.23 crore (342.32 million).",
    "People below $8.30/day in 2022: about 117 crore (1,170 million), derived from WDI/PIP SI.POV.UMIC and WDI population.",
    "World Bank poverty gaps in 2022: 0.8% at $3/day, 4.4% at $4.20/day, 31.1% at $8.30/day.",
    "World Bank societal poverty headcount in 2022: 21.3%; prosperity gap in 2022: 5.4; learning poverty in 2017: 56.1%.",
    "Unreleased 2017-18 consumption survey, as reported: real MPCE down 3.7% all-India, rural down 8.8%, urban up 2.0% between 2011-12 and 2017-18.",
    "World Bank $4.20/day group poverty rates in 2022-23: children 0-14 at 31.2%, adults with no education at 30.2%, adults with tertiary/post-secondary education at 8.7%.",
    "Tendulkar official poverty headcount: 21.9% in 2011-12.",
    "Rangarajan alternative poverty headcount: 29.5% in 2011-12.",
    "Tinbergen PLFS-imputed Tendulkar-compatible poverty estimates for 2022-23: 17.5% to 19.9% across three reported models.",
    "Rural MPCE without imputation: Rs 4,122 in 2023-24.",
    "Urban MPCE without imputation: Rs 6,996 in 2023-24.",
    "HCES imputation gap in 2023-24: about Rs 125 per person per month rural and Rs 82 urban; in 2022-23: about Rs 87 rural and Rs 62 urban.",
    "PLFS-derived real casual wage: about Rs 187/day in 2017-18 and Rs 224/day in 2023-24, in 2012 prices.",
    "Poorest rural 5% MPCE: Rs 1,677 in 2023-24.",
    "Rural HCES 2023-24 consumption shares: poorest 50% at 33.6%, middle 40% at 45.7%, richest 10% at 20.7%, richest 5% at 12.3%.",
    "Simulated all-India HCES headcount below Rs 3,000/month: 22.7%.",
    "Simulated all-India HCES headcount below Rs 4,000/month: 46.2%.",
    "Simulated HCES headcount below Rs 3,000/month: Chhattisgarh 60.1%, Jharkhand 52.0%, Odisha 43.4%.",
    "Simulated HCES headcount below Rs 3,000/month by social group: Scheduled Tribe 46.8%, Scheduled Caste 28.4%, OBC 20.8%, Others 12.7%.",
    "NITI MPI headcount: 11.28% in 2022-23.",
    "OPHI/UNDP Global MPI, 2019-21: headcount 16.4%, intensity 42.0%, vulnerable 18.7%, severe 4.2%, rural headcount 21.2%, urban headcount 5.5%.",
    "World Bank multidimensional poverty headcount: WDI API reports 17.7% in 2022; the October 2025 Poverty & Equity Brief reports 15.5% in 2022-23.",
    "NITI state MPI headcount, 2019-21: Bihar 33.76%, Jharkhand 28.81%, Meghalaya 27.79%, Kerala 0.55%.",
    "NFHS-6 basic floor: electricity at home 98.3%, improved drinking water 96.5%, household bank account 98.2%, household health insurance 60.2%, women ever attended school 73.7%.",
    "NFHS-6 child stunting: 29.3%; child underweight: 31.8%; child wasting: 19.0%; adequate diet age 6-23 months: 15.3%.",
    "World Bank UHC financial-protection indicators: financial hardship from out-of-pocket health spending 30.94% in 2022; impoverishing out-of-pocket health spending 22.27% in 2022; large non-impoverishing out-of-pocket health spending 8.67% in 2022."
  ],
  qualityFlags: [
    "ready after data wiring, chart explainers and methodology caveats",
    "manual editorial draft, not model-generated prose",
    "remaining data gaps are clearly listed in the project handoff"
  ],
  evidence
};

doc.sectionVisualMap = doc.sectionVisualMap.map(({ sectionTitle, visualId }) => ({
  heading: sectionTitle,
  visualId
}));

await writeFile("data/explanations/en/q.econ.poverty.json", `${JSON.stringify(doc, null, 2)}\n`);
console.log("Wrote data/explanations/en/q.econ.poverty.json");
