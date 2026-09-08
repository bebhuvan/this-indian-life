import { readFile, writeFile } from "node:fs/promises";

const path = "data/explanations/en/q.econ.income_classification.json";
const evidencePath = "data/explanations/en/q.econ.income_classification.evidence.json";
const briefPath = "data/briefs/q.econ.income_classification.json";
const explanation = JSON.parse(await readFile(path, "utf8"));
const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
const brief = JSON.parse(await readFile(briefPath, "utf8"));

// The dry-run evidence packet is regenerated after every data or registry change.
// Keep the hand-refined article attached to that exact packet instead of retaining
// stale planned charts or locked numbers from an earlier draft.
explanation.evidence = evidence;

explanation.short = {
  headline: "What India's lower-middle-income label really measures",
  dek: "India is an economic giant because its output adds up across 1.46 billion people. Its income label divides national income by those people and converts it with the World Bank's Atlas method. The result is valid, narrow and easy to mistake for a verdict on Indian life.",
  body: "India ranks 3rd of 197 economies by total PPP GDP but 132nd of 196 by PPP GNI per person. The classification uses another ruler: Atlas GNI per person, where India's 2025 estimate is $2,760 against a $4,636 upper-middle entry line. That puts India at 59.5% of the threshold. History says a quick crossing is not automatic, and the arithmetic scenarios span 2036 to 2046. Even a crossing would move India to a different World Bank income group, not change household budgets overnight."
};

explanation.macha = {
  heading: "Okay macha, is India poor, middle income, or a giant economy?",
  body: "All three descriptions can coexist because they answer different questions. India ranks third in the World Bank workbook by total PPP GDP, but 132nd by PPP GNI per person. Divide national income across about 1.46 billion people, then apply the Bank's Atlas conversion, and the classification figure is $2,760 per person, ranked 156th among economies with an estimate. The tag is a country-level comparison, not the amount an Indian earns or spends. HCES consumption ranges from ₹1,677 a month for the poorest rural 5% to ₹20,310 for the richest urban 5%, and even that survey does not capture income or wealth.",
  soWhat: "India can be globally large, lower middle income per person, and deeply unequal at the same time."
};

explanation.article = {
  title: "What India's lower-middle-income label really measures",
  standfirst: "India's size and its label are both correct. One totals a vast economy; the other spreads national income across 1.46 billion people, converts it with the Atlas method and compares it with a moving line. The label tells us where the country sits. It does not tell us how a typical Indian lives.",
  bodyMarkdown: `## What number puts India in the lower-middle-income box?

Start with the box itself. For its fiscal year 2027 classification, the World Bank sorted economies using their estimated 2025 Atlas GNI per person. Low income ended at $1,175. Lower middle income ran from $1,176 to $4,635. Upper middle income began at $4,636, and high income began above $14,375. India's estimate was $2,760, so it landed squarely in the second band. That is the label's formal claim: India's average national income per resident, converted by the Bank's method, falls inside that dollar interval.

India's $2,760 was 59.5% of the $4,636 upper-middle entry line. That does not mean India is 59.5% developed, or that the journey is 59.5% complete. It is simply one number divided by the boundary above it. If a future estimate rises above that year's boundary, the Bank will move India into its upper-middle-income tables. It will not reclassify each Indian household.

Both the income figure and the boundary need a date attached. The 2025 income is an estimate published in July 2026 and may be revised. The boundary is updated every year for international inflation. So India is chasing a moving line, not filling a fixed $4,636 bucket.

How does the Bank get India's number? It starts with GNI, not GDP. GDP counts production inside India; GNI adds net wages and investment income received from abroad and subtracts comparable income paid abroad. The national total is then divided by about 1.46 billion residents. This is an accounting average, not the median salary, household income or what a typical person can spend. For the wider distinction, see [How big is India's economy?](/articles/how-big-is-indias-economy/).

The final step converts rupees into dollars with the Atlas method. The Bank uses the current exchange rate and the previous two years, adjusted for the gap between Indian and international inflation. That reduces the effect of one bad currency year, but it does not remove currency effects. It is also not PPP: the calculation does not ask what $2,760 can buy in a kirana, hospital or rented home in India.

India has moved closer to the upper-middle line, but not every year. It was classified as low income from 1987 through 2006. When it entered lower middle income in 2007, its Atlas income was only 24.6% of the next line. The share reached 51.2% in 2019, fell to 46.4% during the pandemic and recovered to 59.5% by 2025. India's income can rise while its relative position falls if population growth, currency conversion or the threshold moves against it.

## Why does a giant economy rank so low per person?

India looks enormous before the total is divided by its population. The same release puts GDP at about $3.96 trillion using market exchange rates. After adjusting for local prices through PPP, it is about $17.2 trillion. Atlas GNI is about $4.04 trillion. These totals measure the whole economy. The per-person figures spread national income across about 1.46 billion residents.

That division changes India's rank dramatically. India is 3rd among 197 published PPP GDP estimates and 6th among 204 market-GDP estimates. But its PPP GNI per person is $11,600, ranked 132nd among 196 estimates. Its Atlas GNI per person is $2,760, ranked 156th among 200. The number of economies changes because the four workbooks do not all have estimates for the same places.

PPP and Atlas also answer different questions. PPP adjusts for local prices: how much would the same basket of goods and services cost in each country? Atlas converts income with a three-year exchange-rate average for the classification. India's PPP figure is about 4.2 times its Atlas figure. The multiple is about 4.3 in Pakistan, 3.8 in Bangladesh, 2.0 in China and 1.0 in the United States. India has a much larger PPP figure because many locally produced services cost less than they do in richer countries.

The larger PPP figure is useful, but it is not a pile of dollars India can spend abroad. It cannot pay for imported oil or repay debt denominated in dollars. Bangladesh makes the difference clear. Its Atlas GNI per person is $2,840 against India's $2,760, while India leads at PPP, $11,600 to $10,710. The ranking flips because one measure converts through exchange rates and the other adjusts for local prices. For the gap between a national average and people's actual incomes, see [How rich is the average Indian?](/articles/how-rich-is-the-average-indian/).

## Who belongs to the lower-middle-income world?

The biggest global change since 1987 is that far fewer people now live in countries labelled low income. Among economies with both classification and population data, the share fell from 61.2% in 1987 to 9.4% in 2025. The lower-middle share rose from 13.0% to 36.0%, and the upper-middle share from 8.6% to 37.6%. The high-income share barely changed, staying near 17%. Most of the movement was into the two middle groups.

The bars classify countries, not families. Everyone living in a country is placed in the same bar. When China changes category, hundreds of millions of people move between bars on the update date. That does not mean every Chinese household crossed an income line that year.

India dominates its present group. Of roughly 2.95 billion people living in lower-middle-income economies in 2025, 49.7% live in India. Pakistan accounts for 8.7%, Nigeria 8.1%, Bangladesh 6.0% and Egypt 4.0%. The other 42 economies together make up 23.6%. There are 47 countries in the group, but count people rather than countries and the group is half India.

That makes an eventual Indian upgrade unusually large on paper. Nearly 1.5 billion people would move from the lower-middle bar to the upper-middle bar in one annual update. The global chart would change dramatically. The lives of those people would not change on the update date.

## What does history say from India's position?

A shared label does not produce a shared journey. China crossed the upper-middle line in 2010 and reached more than three times the entry threshold by 2025. Indonesia crossed in 2019, fell back in 2020 and 2021, then returned in 2022. Sri Lanka first crossed in 2018, dropped back the next year and returned only in 2025.

Vietnam reached upper middle income for the first time in 2025. Bangladesh remained lower middle income, but at 61.3% of the next line it sat slightly ahead of India's 59.5%. The Philippines also crossed in 2025, although it is not one of the six lines plotted here.

The full record is slower than the familiar Asian success stories suggest. We found 67 economies that entered the historical data after 1987 as lower middle income. Each was then between 55% and 65% of the next line, the band around India's current position. About 13.3% crossed within five years. The estimated share reached 29.2% within ten years, 48.0% within fifteen and 64.3% within twenty.

Twenty-six of those economies had still not crossed by 2025. We did not delete them or count them as permanent failures. Each contributes all the years for which it can be observed, and its clock simply stops in 2025. Statisticians call this a Kaplan-Meier estimate with right-censoring. We also exclude economies already in the starting band in 1987 because the workbook cannot tell us when their journeys began.

It is not India's probability. The 67 economies include commodity exporters, factory economies, islands and countries hit by wars or financial crises. The calculation makes one narrower point: being three-fifths of the way to the line does not make a crossing within ten years normal or automatic.

Crossing often stuck, but not always. We found 76 economies that moved from low or lower middle income into upper middle or high income during the workbook's 1987 to 2025 window. Of those, 54 stayed at least upper middle for the rest of the observed period. Sixteen fell back and later recovered. Six were still below the line in 2025.

Put differently, 22 of 76 observed first crossers, nearly 29%, fell back at least once. Indonesia and Sri Lanka are part of a wider pattern. Currency moves, crises, commodity cycles and statistical revisions can all contribute. Because the workbook begins in 1987, the count covers only reversals visible from that year onward.

## What moved India's own number?

The bridge below replays India's 2015 to 2025 change one piece at a time. India began at 39.1% of the upper-middle line. First, update only GNI measured in rupees and leave population, currency conversion and the threshold at their 2015 settings. The running figure rises to 98.1%.

Now update the other pieces. Population growth spreads the income across more people, lowering the running figure to 89.0%. Updating the Atlas currency-and-inflation conversion lowers it to 68.4%. Finally, updating the upper-middle threshold brings the result to India's observed 59.5%.

The middle bars are bookkeeping steps, not alternative histories. Only the first and last bars are observed. Changing the order of the steps would change the middle values but not the final 59.5%. The safe conclusion is that rupee GNI growth pushed India upward, while population growth, Atlas conversion and a rising threshold absorbed much of that gain.

The six economies promoted in 2025 show why this accounting matters. Vietnam's Atlas GNI per person rose 10.7%, from $4,490 to $4,970, alongside strong growth and exports. The Philippines rose 8.5%, from $4,470 to $4,850, with broad-based growth. Sri Lanka's 20.7% jump, from $3,870 to $4,670, reflected recovery from crisis.

The less familiar cases show how better measurement can change a category. Jordan updated the base year and coverage of its national accounts. The new accounts captured activity the older system had missed and made the measured economy nearly 10% larger. Its Atlas GNI per person rose 7.8%. Togo's new population estimate was about 11.7% lower. Dividing national income among fewer estimated people helped lift GNI per person by 10.7%, enough to change category. Micronesia moved after a more modest post-Covid recovery.

Jordan did not build those newly measured businesses overnight, and Togo's households did not suddenly become richer when its population estimate changed. The revisions corrected older statistics. This is why a classification can move because the economy changed, because its measurement improved, or because both happened together. The bars show one-year changes; they do not measure how much each possible cause contributed.

## What would crossing change, and when might it happen?

The World Bank uses one ladder to describe income and another to make lending decisions. They overlap, but crossing one line does not automatically cross the other. In the 2025 data, the ceiling used for IDA allocations was $1,365. IDA provides grants and very low-cost loans to poorer countries, and India is listed as having graduated from it in fiscal year 2014. India was at $2,760, while upper middle income began at $4,636. A discussion about graduating from regular IBRD lending began much higher, at $8,105. High income began above $14,375.

An upgrade would first move India into a different column in World Bank tables. It could also matter for policies or programmes that refer to income groups. It would not automatically end IBRD borrowing, change Indian taxes or raise salaries. Lending decisions also depend on whether a country can repay and on wider institutional conditions. Crossing $4,636 would record higher average national income. It would not flip every policy switch.

The possible crossing date depends heavily on which part of India's past we extend. From 2007 to 2025, India's position relative to the line improved by about 5.0% a year. Continue that pace and the arithmetic reaches the line around 2036. Starting in 2015 gives about 2037, starting in 2021 gives about 2038, and using the slower period since 2019 gives about 2046.

These calculations compound growth in the ratio; they do not add the same number of percentage points each year. India's 59.5% position must grow to 100%, while the dollar threshold continues to move.

The 2036 to 2046 range is not a forecast. It shows how much the answer changes when we choose a different starting year. Future rupee income, population, inflation and exchange rates will all change India's Atlas figure, and the threshold will be updated each year. A weaker rupee can offset part of real growth. A statistical revision can also move the date without changing anyone's life that year.

## Would an upper-middle label fit the India people live in?

India's latest modelled estimate is about 27 deaths before age five for every 1,000 live births in 2024. The comparison is deliberately tied to the income milestone rather than one calendar year. For each peer, we use the year it first entered upper middle income. The rates were 15.7 in China, 21.8 in Indonesia, 17.3 in Vietnam and 26.5 in the Philippines. They were 14.1 in Thailand, 15.1 in Malaysia and 7.6 in Sri Lanka.

India is close to the Philippines at its crossing. But child mortality is much higher than it was in Sri Lanka, China or Thailand at theirs. The same income milestone can therefore arrive with very different levels of child survival. The comparison cannot tell us how much nutrition, sanitation, vaccination, maternal care or health-system reach produced those differences.

The production structure differs too. Manufacturing accounts for about 13.5% of India's GDP. At their first upper-middle classification, the share was 31.1% in China and 30.9% in Thailand. It was 25.8% in Malaysia, 24.5% in Vietnam and 19.7% in Indonesia. The Philippines, at 15.3%, was the closest selected peer, followed by Sri Lanka at 15.0%.

Most selected Asian crossers reached the line with a larger factory base than India has today. Manufacturing can employ large numbers of workers and support exports, but the comparison does not prove that factories caused the crossing. Services, productivity, education, infrastructure, trade and demographics also matter. The longer development argument is in [Why India stayed poor while Asia got rich](/articles/why-india-stayed-poor-while-asia-got-rich/).

Household life is the final test. MoSPI groups surveyed households from the poorest 5% to the richest 5% by monthly consumption per person. The poorest rural group averaged ₹1,677 a month, while the poorest urban group averaged ₹2,376. In the group just above the middle, the figures were ₹3,866 in rural India and ₹6,334 in urban India. For the richest 5%, they rose to ₹10,137 and ₹20,310.

These figures are not an alternative estimate of GNI. The survey records household consumption and divides it by the number of people in the household. GNI comes from the national accounts and includes income that never appears as cash in a household budget. The measures cover different things and different periods, so converting one into the other would create a false comparison.

Those gaps are why the country label cannot describe a typical Indian. Urban consumption is higher at every point shown, but urban prices are also different, so the gap is not a direct measure of living standards. HCES does not reveal inequality within a household, and consumption is usually distributed more evenly than income or wealth. "Lower middle income" places India's national average on an international scale. It does not tell us where a typical household sits. See [How unequal is India?](/articles/how-unequal-is-india/) and [Has India ended poverty?](/articles/has-india-ended-poverty/) for the distribution and threshold questions.

## How should you read these numbers?

**Sources.** The headline values come from the World Bank's July 2026 workbooks for 2025 GNI, GNI per person, GDP, PPP GDP and population. The Bank uses those estimates for its fiscal year 2027 groups. Historical classifications and thresholds come from its history workbook. Historical income, population, child mortality and manufacturing data come from World Development Indicators. The explanations for the six newly promoted economies come from the Bank's release. Household consumption comes separately from MoSPI's HCES 2023-24.

**Calculations.** The progress line divides each year's Atlas GNI per person by that year's upper-middle threshold. The 67-country comparison starts when an economy is first observed after 1987 as lower middle income and between 55% and 65% of the line. Economies that have not crossed remain in the calculation for every year we can observe them. The reversal count covers 76 first crossings visible in the workbook. The India bridge updates rupee GNI, population, Atlas conversion and the threshold one after another. Its middle bars depend on that order; its first and last bars do not. The scenarios continue historical growth in India's ratio until it reaches 100%.

**Limits.** Every 2025 World Bank value is an estimate and may be revised. The four rank workbooks cover different numbers of economies because some estimates are missing. GNI differs from GDP through wages and investment income crossing borders; ordinary personal remittances are transfers, not part of that adjustment. Classifications are annual, while social indicators can arrive later. PPP and Atlas answer different questions, and the historical comparison mixes very different countries and periods. HCES consumption is neither income nor GNI, and rural and urban prices differ. The label is useful for comparing countries. It is not a welfare score or a development finish line.`
};

const glossaryBlocks = [
  {
    term: "GNI (gross national income)",
    plainMeaning: "GNI starts with everything produced inside the country, then adjusts for net primary income across the border. That includes wages and investment income residents receive from abroad, minus comparable income paid to non-residents. Personal remittances are generally transfers, so they are not the adjustment that turns GDP into GNI.",
    whyItMattersHere: "The World Bank divides Atlas-method GNI by population to set the analytical income classification. It is a national-accounts average, not a household pay packet."
  },
  {
    term: "GDP (gross domestic product)",
    plainMeaning: "GDP is the market value of production inside a country's borders. A foreign-owned factory in India adds to Indian GDP because the production happens here; profits later paid abroad are part of the cross-border income adjustment between GDP and GNI.",
    whyItMattersHere: "India can rank among the world's largest economies by total GDP and remain lower middle income after national income is divided across its very large population."
  },
  {
    term: "Atlas method",
    plainMeaning: "The Atlas method converts local-currency GNI into US dollars with an average of the current exchange rate and the previous two years, adjusted for the difference between domestic inflation and an international inflation measure. It reduces the effect of a sudden one-year currency move.",
    whyItMattersHere: "Atlas income is the ruler behind the label. It is more stable than a spot exchange-rate conversion, but it still does not measure domestic purchasing power.",
    keyTerm: true
  },
  {
    term: "PPP (purchasing power parity)",
    plainMeaning: "PPP compares price levels by asking how much a common basket of goods and services costs in each economy. An international dollar is a statistical unit with the purchasing power of a US dollar in the United States, not cash that can be spent abroad.",
    whyItMattersHere: "India's PPP GNI per person is much higher than its Atlas figure because many local goods and services are cheaper. PPP answers a purchasing-power question, not the classification question."
  },
  {
    term: "Upper-middle-income threshold",
    plainMeaning: "This is the Atlas GNI-per-person boundary between lower middle and upper middle income. For the 2025 data it begins at $4,636, and the World Bank updates the boundary each year for international inflation.",
    whyItMattersHere: "India must grow faster than a moving line. The remaining journey is not a fixed $1,876 addition."
  },
  {
    term: "IDA and IBRD",
    plainMeaning: "IDA offers grants and highly concessional finance to the poorest eligible countries. IBRD lends mainly to middle-income and creditworthy lower-income countries. Income thresholds matter, but lending status and graduation are not determined by the analytical income label alone.",
    whyItMattersHere: "India is listed as an IDA graduate from fiscal year 2014 and already borrows from IBRD. Entering upper middle income would not automatically end that borrowing."
  },
  {
    term: "MPCE (monthly per capita consumption expenditure)",
    plainMeaning: "MPCE is household consumption divided by household size and expressed per person per month. It is built from survey reports of goods and services consumed, so it is a different concept, period and coverage from national-accounts GNI.",
    whyItMattersHere: "The rural and urban fractiles reveal two dimensions of the spread hidden by a country average. They should not be converted into Atlas income or treated as household earnings or wealth."
  }
];

if (explanation.editorialPlan) explanation.editorialPlan.glossaryBlocks = glossaryBlocks;
if (explanation.editorialPlanDraft) explanation.editorialPlanDraft.glossaryPlan = glossaryBlocks;

const explainers = {
  "india-has-reached-three-fifths-of-the-next-income-line": {
    takeaway: "India reached 59.5% of the upper-middle-income entry line in 2025. It has more than doubled its relative position since first becoming lower middle income in 2007, but the remaining gap is still large.",
    detail: "The comparison is recalculated every year: India's Atlas GNI per person is divided by that year's upper-middle entry line. India rose from 24.6% when it entered lower middle income in 2007 to 51.2% in 2019. The share fell to 46.4% in 2020 before recovering to 59.5% in 2025. Both India's estimate and the line can be revised, so this is a dated reading rather than a permanent score.",
    whyShowThis: "A fixed dollar gap would become stale as the threshold rises. The ratio turns two moving series into the clearest answer to how close India actually is.",
    howToRead: "Treat 100 as the crossing line. A rising Indian line means Atlas income per person grew faster than the threshold; a falling line means it lost relative ground.",
    mistakeToAvoid: "Do not subtract $2,760 from $4,636 and assume India only needs to add that fixed amount. The entry threshold changes each year.",
    mobileNote: "Keep the 100% reference line and label the 2007, 2019, 2020 and 2025 turning points."
  },
  "india-ranks-3rd-in-ppp-output-132nd-in-ppp-income-per-person": {
    takeaway: "India's 3rd-place PPP GDP rank measures the size of the whole economy. Its 132nd-place PPP GNI-per-person rank measures how that purchasing-power-adjusted income looks after division by 1.46 billion people.",
    detail: "The same release ranks India 6th among 204 published market-GDP estimates and 156th among 200 Atlas GNI-per-person estimates. PPP GDP places India 3rd among 197 economies, while PPP GNI per person places it 132nd among 196. The workbooks cover different numbers of economies because some estimates are missing. The rank falls when a very large national total is divided among 1.46 billion people; the two accounts are not contradicting each other.",
    whyShowThis: "The chart resolves the article's central paradox in one view and stops aggregate economic power from being mistaken for average prosperity.",
    howToRead: "Rank 1 is highest, so shorter bars indicate a higher position. Compare the two whole-economy rows with the two per-person rows, not PPP with Atlas as if they were otherwise identical measures.",
    mistakeToAvoid: "Do not call India the 132nd-largest PPP economy. It is 3rd by total PPP GDP and 132nd by PPP GNI per person among economies with a published estimate.",
    mobileNote: "Keep the group labels 'Whole economy' and 'Per person' visible and state directly that 1 is the highest rank."
  },
  "one-income-label-six-very-different-journeys": {
    takeaway: "Countries sharing the lower-middle label have accelerated, stalled, crossed and fallen back. China's breakout, Indonesia's pandemic reversal and Sri Lanka's two crossings show why the category is a snapshot, not a destiny.",
    detail: "Every line uses the same relative ruler, so a crossing above 100 is comparable across decades even though the dollar threshold changed. China moved far beyond the line after 2010. Indonesia crossed in 2019, fell below in 2020 and returned in 2022; Sri Lanka crossed in 2018, slipped back in 2019 and returned in 2025. Bangladesh ends at 61.3%, slightly above India's 59.5%, while both remain lower middle income.",
    whyShowThis: "The Indian line alone can tempt readers into assuming a smooth national trajectory. Peer paths reveal how shocks, exchange rates and revisions interrupt the climb.",
    howToRead: "Follow the shape before the final value. A steep rise means the country moved towards the line quickly. A flat stretch means its income and the line rose at similar speeds. A dip means it lost ground.",
    mistakeToAvoid: "Do not read the lines as pure real-growth performance. Atlas conversion, inflation, population and statistical revisions also move them.",
    mobileNote: "Emphasise India, direct-label all six endpoints, and preserve the 100% crossing line."
  },
  "the-world-moved-from-low-income-into-the-middle": {
    takeaway: "Among people living in economies with both classification and population data, the low-income share fell from 61.2% to 9.4%. The high-income share stayed near 17%, so most of the movement was into the middle.",
    detail: "The low-income share fell from 61.2% in 1987 to 9.4% in 2025. Lower middle income expanded from 13.0% to 36.0%, while upper middle rose from 8.6% to 37.6%. High income stayed close to 17%. A large country can move millions of people between bars in one update, because every resident inherits the country's category; the chart does not follow the same households over time.",
    whyShowThis: "India's classification makes more sense inside the defining global development change of the era: low income became much rarer, but high income did not become universal.",
    howToRead: "Compare each category across the two years rather than reading only the four bars within one year. The middle tiers absorb nearly all of the decline in low income.",
    mistakeToAvoid: "Do not say 52 percentage points of individuals personally escaped poverty. Whole national populations are assigned to a country's category.",
    mobileNote: "Use paired 1987 and 2025 bars for each class, with the low-income collapse labelled directly."
  },
  "half-the-lower-middle-income-population-lives-in-india": {
    takeaway: "India alone accounts for 49.7% of the population living in lower-middle-income economies. The category's demographic centre is far more concentrated than its list of 47 members suggests.",
    detail: "India accounts for 49.7% of the roughly 2.95 billion people in lower-middle-income economies. Pakistan contributes 8.7%, Nigeria 8.1%, Bangladesh 6.0% and Egypt 4.0%. The other 42 economies together make up 23.6%. Count countries and India is one of 47; count people and it is half the group. An Indian reclassification would move nearly half the group in one update without making those households middle class on that date.",
    whyShowThis: "It reveals who the category actually describes and explains why India's eventual crossing would visibly reshape global population shares.",
    howToRead: "Every segment is a share of people living in lower-middle-income economies, not a share of world population or a share of member countries.",
    mistakeToAvoid: "Do not say half of lower-middle-income countries are India. India is one economy containing about half of the group's people.",
    mobileNote: "Use a 100% share strip with India directly labelled; combine the long tail as 'Other economies'."
  },
  "fewer-than-three-in-ten-peers-crossed-within-a-decade": {
    takeaway: "The estimated share crossing within ten years was only 29.2%. Even after twenty years, the historical estimate reaches 64.3%, not certainty.",
    detail: "The comparison contains 67 economies first observed after 1987 as lower middle income and at 55% to 65% of the next line. Twenty-six had not crossed by 2025, and the calculation keeps every year we can observe for them instead of dropping them. Estimated first-crossing shares are 13.3% by five years, 29.2% by ten, 48.0% by fifteen and 64.3% by twenty. Economies already in the band in 1987 are excluded because the workbook cannot show when their journeys began.",
    whyShowThis: "It corrects the article's largest potential bias: learning only from countries selected because they eventually succeeded.",
    howToRead: "The bars are cumulative. The ten-year bar includes economies that crossed earlier; each later bar asks how many had crossed at least once by that duration.",
    mistakeToAvoid: "Do not report 29.2% as India's probability. The estimate combines very different economies and periods; it only describes what happened in that historical comparison.",
    mobileNote: "Keep the four horizons in chronological order and place 'historical estimate, not forecast' beside the ten-year value."
  },
  "among-asian-successes-the-journey-still-took-four-to-twenty-one-years": {
    takeaway: "Even after selecting only Asian economies that completed the transition, the journey from India's relative position ranged from four to twenty-one years.",
    detail: "The comparison begins at the first lower-middle-income year when each peer stood at 55% to 65% of the upper-middle threshold. China then took 4 years, Sri Lanka 8, Indonesia 9, Vietnam 11, the Philippines 15 and Thailand 21. The preceding full-cohort chart supplies the missing non-crossers.",
    whyShowThis: "It shows the spread among recognisable completed Asian routes after success bias has been made explicit.",
    howToRead: "The bar length is elapsed time from the comparable starting band to the first upper-middle classification. Read the start and crossing years with the duration.",
    mistakeToAvoid: "Do not average the six bars into India's expected waiting time. This is deliberately a success-only Asian subset.",
    mobileNote: "Order from shortest to longest and display both endpoint years beneath each country."
  },
  "crossing-did-not-stick-for-29-of-observed-movers": {
    takeaway: "Twenty-two of 76 observed first crossers, about 29%, later fell below upper middle income at least once. Six remained below the line in 2025.",
    detail: "Of 76 first observed crossers, 54 never fell below upper middle again. Sixteen fell back and later recovered, while six were still below the line in 2025. Indonesia and Sri Lanka are therefore examples of a broader classification pattern, not isolated anomalies. The workbook begins in 1987, so these are outcomes inside the observed window rather than complete national histories.",
    whyShowThis: "A global outcome count turns the warning that categories are not permanent into measurable historical evidence.",
    howToRead: "The three segments partition 76 economies observed moving up from low or lower middle income during 1987-2025.",
    mistakeToAvoid: "Do not treat 29% as an eternal reversal rate. The workbook starts in 1987 and covers only transitions observable inside that window.",
    mobileNote: "Use a 100% share strip and visually join the two fall-back categories while keeping recovered and still-below distinct."
  },
  "india-and-bangladesh-swap-places-when-the-ruler-changes": {
    takeaway: "Bangladesh leads India by 2.9% on the Atlas classification ruler, while India leads by 8.3% at PPP. The ranking flips because the measures answer different questions.",
    detail: "Atlas GNI per person is $2,840 for Bangladesh and $2,760 for India. PPP GNI per person is $10,710 for Bangladesh and $11,600 for India. The reversal is not a data error: PPP incorporates country-specific price levels, while Atlas uses a smoothed exchange-rate conversion.",
    whyShowThis: "One two-country example teaches the measurement distinction more effectively than a page of definitions.",
    howToRead: "Each bar is the percentage lead under one method, not the income level itself. The country named in the label is the leader under that ruler.",
    mistakeToAvoid: "Do not call Atlas a spot-market dollar conversion or PPP the more 'real' number. Atlas smooths exchange rates; PPP measures domestic purchasing power.",
    mobileNote: "Keep the two bars large and print the underlying dollar values in the annotation."
  },
  "ppp-lifts-india-s-per-person-figure-more-than-fourfold": {
    takeaway: "India's PPP income is about 4.2 times its Atlas income, one of the largest gaps in the selected group. The multiple broadly narrows as economies become richer.",
    detail: "India's PPP GNI per person is $11,600 against Atlas GNI per person of $2,760, a multiple of about 4.2. Pakistan is at 4.3, Bangladesh 3.8, Vietnam 3.5, China 2.0, South Korea 1.7 and the United States about 1.0. The wedge reflects lower prices for many locally produced goods and services, especially services tied to local wages. It is a price-level comparison, not evidence of unrecorded dollars that can be spent abroad.",
    whyShowThis: "It turns India's apparently conflicting $2,760 and $11,600 figures into a systematic cross-country pattern.",
    howToRead: "A value of 4.2 means PPP GNI per person is 4.2 times Atlas GNI per person. It does not mean every rupee buys 4.2 times as much as every dollar-priced item.",
    mistakeToAvoid: "PPP international dollars cannot pay for imports or foreign-currency debt. They are a statistical unit for comparing purchasing power at home.",
    mobileNote: "Sort from high to low and retain India, China, South Korea and the United States as visual anchors."
  },
  "india-s-gni-rose-fast-population-conversion-and-the-threshold-absorbed-much-of-it": {
    takeaway: "Local-currency GNI growth was the large upward force from 2015 to 2025. Population growth, the changed Atlas conversion and the rising threshold absorbed much of that gain, leaving India at 59.5% of the line.",
    detail: "The bridge starts with India's observed 2015 position of 39.1% and updates one item at a time. First, rupee GNI growth lifts the running figure to 98.1%. Updating population lowers it to 89.0%, updating the Atlas conversion lowers it to 68.4%, and updating the threshold produces the observed 59.5%. Only the first and last bars are observed; the middle bars are bookkeeping steps whose values depend on the order chosen.",
    whyShowThis: "It explains India's own classification movement instead of asking readers to infer Indian mechanics from this year's promoted countries.",
    howToRead: "Follow the bars in order as an accounting bridge. The first and last are observed ratios; the three middle stages show the running result as each additional factor is applied.",
    mistakeToAvoid: "Do not call 98.1% a forecast or say India would have reached it without currency changes. The middle values depend on the order of the bookkeeping steps and do not describe alternative histories.",
    mobileNote: "Number every step, distinguish the upward GNI step from the three drags, and keep the 39.1% and 59.5% endpoints prominent."
  },
  "some-countries-moved-because-the-measurement-changed": {
    takeaway: "The six 2025 promotions came through different combinations of growth, recovery and revised measurement. A category change is not a single economic event.",
    detail: "Sri Lanka recorded the largest one-year rise, 20.7%, during its recovery; Vietnam and the Philippines crossed alongside strong growth. Jordan's updated national accounts made measured activity nearly 10% larger. Togo's revised population estimate was 11.7% lower, so national income was divided among fewer estimated people. Micronesia moved during a steadier post-Covid recovery. The bars measure the change in Atlas GNI per person; the labels summarise the World Bank's explanation rather than calculating each cause's contribution.",
    whyShowThis: "It opens the black box behind a classification update and separates lived economic improvement from better or different measurement.",
    howToRead: "Compare the percentage changes, then read the mechanism label. Similar bar heights can come from very different economic and statistical stories.",
    mistakeToAvoid: "Do not treat the explanation beside each bar as the only cause or as a measured share of the change. Exchange rates and other forces can operate at the same time.",
    mobileNote: "Preserve mechanism labels even if the underlying from-to dollar annotations must be shortened."
  },
  "an-upper-middle-label-would-not-end-world-bank-lending": {
    takeaway: "India is above the IDA concessional-finance ceiling but far below the point where an IBRD graduation discussion begins. Becoming upper middle income would change the label, not automatically end World Bank lending.",
    detail: "The 2025 ladder places the IDA allocation ceiling at $1,365, India at $2,760 and upper-middle entry at $4,636. The IBRD graduation discussion threshold is much higher at $8,105, while high income begins above $14,375. India is listed as an IDA graduate from fiscal year 2014 and already borrows through IBRD. Lending decisions also consider a country's ability to repay and wider institutional conditions, so a new income label does not trigger automatic graduation.",
    whyShowThis: "Readers commonly assume the income label and lending rules are one staircase. Putting both sets of thresholds together shows that they are separate systems.",
    howToRead: "Position India against each labelled threshold. The order matters more than the distance between visually scaled bars.",
    mistakeToAvoid: "Do not describe $8,105 as automatic graduation or $4,636 as loss of lending access. Both are inputs to different systems.",
    mobileNote: "Use a single ordered ladder and distinguish analytical, operational and India with color or symbols."
  },
  "india-s-past-gives-a-2036-2046-range-not-a-forecast": {
    takeaway: "Mechanical continuations of India's own history produce crossing dates from about 2036 to 2046. The wide range is the message, not any one year.",
    detail: "India's position relative to the line improved by about 5.04% a year from 2007 to 2025, 4.28% from 2015, 3.95% from 2021 and 2.56% from 2019. Continuing those four rates gives waits of 11, 12, 13 and 21 years after 2025, or dates from 2036 to 2046. Small differences in the yearly pace create large differences in the crossing date. None of the paths predicts future growth, inflation, currency movements, population revisions or changes in the threshold.",
    whyShowThis: "It answers the inevitable 'when?' question while showing how strongly the answer depends on which years we use, instead of hiding that choice inside one forecast.",
    howToRead: "Each bar is the number of years after 2025, and its label gives the calendar year. The only change between rows is the starting year used to calculate India's past pace.",
    mistakeToAvoid: "Do not call the compound rates percentage-point gains or the dates predictions. The threshold, currency, population and estimates all change.",
    mobileNote: "Show the projected year at the bar end and put the relative annual rate in smaller text."
  },
  "the-income-line-does-not-set-a-child-survival-standard": {
    takeaway: "The same income milestone came with very different child-survival estimates. India's latest modelled value is about 27 deaths per 1,000 live births, close to the Philippines' first-crossing estimate but well above Sri Lanka's.",
    detail: "China, Thailand and Malaysia were around 14 to 16 deaths per 1,000 when they first became upper middle income; Vietnam was at 17.3 and Indonesia 21.8. The Philippines was at 26.5, close to India's latest estimate of about 27, while Sri Lanka was at 7.6. India uses its 2024 UN IGME model estimate because it has not crossed. The peer bars use each country's own crossing year, so this is not a same-year ranking.",
    whyShowThis: "Child mortality gives the abstract warning that 'GNI is not welfare' a concrete human meaning.",
    howToRead: "Lower is better. India is the latest available 2024 estimate; each peer is the estimate in its own first-crossing year. Read the reference year and data year together.",
    mistakeToAvoid: "Do not treat 26.6 as an official Indian SRS measurement or compare the bars as if they came from one calendar year. These are WDI/UN IGME model estimates with different vintages.",
    mobileNote: "Keep India visually separate from the crossing-year peers and retain the data-year labels on every bar."
  },
  "india-has-a-smaller-factory-base-than-most-asian-crossers": {
    takeaway: "India's manufacturing share is 13.5% of GDP. Most selected Asian economies crossed into upper middle income with shares closer to 20% to 31%.",
    detail: "India's latest manufacturing share is about 13.5% of GDP. China and Thailand were near 31% at their first upper-middle classification, Malaysia 25.8%, Vietnam 24.5% and Indonesia 19.7%. The Philippines at 15.3% and Sri Lanka at 15.0% are closer to India. The comparison aligns countries at a classification milestone, not a calendar year, and it identifies a structural contrast rather than a mechanical factory-share requirement.",
    whyShowThis: "It connects the income classification to the productive capabilities that may support the next stage of growth.",
    howToRead: "Compare India now with peers at their first upper-middle classification. The bars align the milestone, not the calendar year.",
    mistakeToAvoid: "Do not claim factories alone caused the crossing. Services, productivity, education, trade, infrastructure and institutions interact.",
    mobileNote: "Sort high to low, highlight India, and retain reference years in compact labels."
  },
  "lower-middle-income-does-not-describe-a-typical-household": {
    takeaway: "Monthly consumption ranges from ₹1,677 for the poorest rural 5% to ₹20,310 for the richest urban 5%. The country label hides both the class ladder and the rural-urban divide.",
    detail: "Average monthly consumption is ₹1,677 per person for the poorest rural 5% and ₹2,376 for the poorest urban 5%. In the group just above the middle, it is ₹3,866 in rural India and ₹6,334 in urban India. For the richest 5%, it reaches ₹10,137 and ₹20,310. These are group averages, so people within each group still differ. They measure surveyed consumption, not GNI, income or wealth, and different rural and urban prices prevent a direct living-standard comparison.",
    whyShowThis: "The story should end where the label is most likely to be misused: as a description of the typical Indian.",
    howToRead: "Move from the poorest survey group to the richest. At each step, compare rural with urban, then follow how consumption rises within each settlement type.",
    mistakeToAvoid: "Do not compare monthly MPCE numerically with annual Atlas GNI per person, or assume the survey captures inequality within households.",
    mobileNote: "Keep rural and urban bars paired for every survey group. If labels must shorten, preserve the poorest, middle and richest anchors."
  }
};

const explainerOrder = [
  "india-has-reached-three-fifths-of-the-next-income-line",
  "india-ranks-3rd-in-ppp-output-132nd-in-ppp-income-per-person",
  "ppp-lifts-india-s-per-person-figure-more-than-fourfold",
  "the-world-moved-from-low-income-into-the-middle",
  "half-the-lower-middle-income-population-lives-in-india",
  "one-income-label-six-very-different-journeys",
  "fewer-than-three-in-ten-peers-crossed-within-a-decade",
  "crossing-did-not-stick-for-29-of-observed-movers",
  "india-s-gni-rose-fast-population-conversion-and-the-threshold-absorbed-much-of-it",
  "some-countries-moved-because-the-measurement-changed",
  "an-upper-middle-label-would-not-end-world-bank-lending",
  "india-s-past-gives-a-2036-2046-range-not-a-forecast",
  "the-income-line-does-not-set-a-child-survival-standard",
  "india-has-a-smaller-factory-base-than-most-asian-crossers",
  "lower-middle-income-does-not-describe-a-typical-household"
];

explanation.chartExplainers = explainerOrder.map((visualId) => ({
  visualId,
  ...explainers[visualId]
}));

const sectionVisualGroups = [
  ["What number puts India in the lower-middle-income box?", [explainerOrder[0]]],
  ["Why does a giant economy rank so low per person?", [explainerOrder[1], explainerOrder[2]]],
  ["Who belongs to the lower-middle-income world?", [explainerOrder[3], explainerOrder[4]]],
  ["What does history say from India's position?", [explainerOrder[5], explainerOrder[6], explainerOrder[7]]],
  ["What moved India's own number?", [explainerOrder[8], explainerOrder[9]]],
  ["What would crossing change, and when might it happen?", [explainerOrder[10], explainerOrder[11]]],
  ["Would an upper-middle label fit the India people live in?", [explainerOrder[12], explainerOrder[13], explainerOrder[14]]],
  ["How should you read these numbers?", []]
];

const sectionHeadings = sectionVisualGroups.map(([heading]) => heading);

explanation.sectionVisualMap = sectionVisualGroups.map(([heading, visualIds]) => ({
  heading,
  visualIds
}));

if (explanation.editorialPlan) {
  explanation.editorialPlan.heroDescription = "India is lower middle income by the World Bank's Atlas ruler, even though it ranks among the largest economies in total. The expanded story separates size from per-person income, measures the full historical crossing record, opens India's accounting mechanics and ends with rural and urban household consumption.";
  explanation.editorialPlan.selectedDataPoints = explainerOrder.map((visualId, index) => ({
    label: visualId,
    reason: explainers[visualId].whyShowThis,
    use: index === 0 || index === 8 || index === 14 ? "hero" : "chart"
  }));
}

if (explanation.editorialPlanDraft) {
  explanation.editorialPlanDraft.requiredConcepts = brief.requiredConcepts;
  explanation.editorialPlanDraft.sectionPlan = sectionVisualGroups.map(([heading, visualIds]) => ({
    heading,
    job: visualIds.length ? visualIds.map((visualId) => explainers[visualId].whyShowThis).join(" ") : "State methods, revisions and limits.",
    lockedNumbersToUse: [],
    conceptsToExplain: [],
    caveat: visualIds.length ? visualIds.map((visualId) => explainers[visualId].mistakeToAvoid).join(" ") : "End with the estimate and comparability warnings."
  }));
  const headingForVisual = Object.fromEntries(sectionVisualGroups.flatMap(([heading, visualIds]) => visualIds.map((visualId) => [visualId, heading])));
  explanation.editorialPlanDraft.chartPlan = explainerOrder.map((visualId) => ({
    visualId,
    sectionHeading: headingForVisual[visualId],
    takeaway: explainers[visualId].takeaway,
    watch: explainers[visualId].mistakeToAvoid
  }));
}

explanation.caveats = [
  "The World Bank's 2025 GNI, GNI per capita, GDP, GDP PPP and population values are estimates published in July 2026 and may be revised.",
  "The fiscal year 2027 country groups use 2025 Atlas GNI per capita. Analytical classifications are updated annually and are not permanent statuses.",
  "The ranks cover published estimates: 197 economies for PPP GDP, 204 for market GDP, 196 for PPP GNI per person and 200 for Atlas GNI per person. They are not ranks among one common universe.",
  "Atlas and PPP are different conversion systems. Atlas smooths exchange rates for classification; PPP compares domestic purchasing power. Neither is a household income measure.",
  "The progress ratio is derived by dividing Atlas GNI per capita by that year's upper-middle entry threshold. Both parts move and can be revised.",
  "The full historical cohort uses a Kaplan-Meier estimate to retain 26 incomplete journeys, but its 67 economies and periods are heterogeneous and it does not estimate India's probability.",
  "The reversal count covers transitions observed inside the 1987-2025 workbook window. It is not a lifetime history for every economy.",
  "The India accounting bridge is an exact multiplicative identity in a declared sequence. Only its endpoints are observed positions, and its intermediate levels are not causal counterfactuals.",
  "The crossing dates are arithmetic continuations of historical relative catch-up rates, not forecasts.",
  "Under-five mortality is a World Bank WDI series based on UN IGME model estimates, not India's official Sample Registration System series. India is shown at its latest available 2024 observation while peers are shown in their own first-crossing years, so this is a descriptive, non-same-year comparison and does not identify causes.",
  "HCES rural and urban MPCE measures surveyed consumption, not national income, earnings or wealth. Rural and urban price levels differ, and the survey does not reveal inequality within a household."
];

explanation.sourceNotes = [
  { label: "World Bank, GNI, GNI per capita, GDP, GDP PPP and Population 2025 workbooks, July 2026 release, from the World Development Indicators data catalogue.", url: "https://datacatalog.worldbank.org/search/dataset/0037712/World-Development-Indicators" },
  { label: "World Bank, historical analytical classifications and GNI per capita thresholds. Linked to the workbook itself, GNIPC.xlsx, because the thresholds have no reader-facing page of their own.", url: "https://datacatalogfiles.worldbank.org/ddh-published/0038128/DR0046433/GNIPC.xlsx" },
  { label: "World Bank, fiscal year 2027 country and lending groups, the classification this article is about.", url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups" },
  { label: "World Development Indicators: Atlas GNI per capita, population, under-five mortality and manufacturing value added, for the peer comparisons.", url: "https://data.worldbank.org/indicator/NY.GNP.PCAP.CD" },
  { label: "World Bank Open Data Blog, 'Who moves up and why?', accompanying the 2025 classification update.", url: "https://blogs.worldbank.org/en/opendata/who-moves-up-and-why--a-closer-look-at-the-new-world-bank-group-" },
  { label: "International Development Association, list of IDA graduates.", url: "https://ida.worldbank.org/en/about/borrowing-countries/ida-graduates" },
  { label: "MoSPI, Household Consumption Expenditure Survey 2023-24, press note.", url: "https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf" },
];

explanation.lockedNumbersUsed = [...new Set([
  "India gross national income, Atlas method, 2025",
  "India gross domestic product at market exchange rates, 2025",
  "India gross domestic product at purchasing power parity, 2025",
  "India population, 2025",
  "Atlas and PPP gross national income per capita for selected economies, 2025",
  "India's total-economy and per-person ranks in the World Bank 2025 workbooks",
  "Share of the population living in lower-middle-income economies",
  "How often economies at India's relative position crossed the upper-middle line",
  "What happened after economies first crossed into upper middle income",
  "An accounting bridge from India's 2015 position to its 2025 position",
  "Rural and urban monthly consumption across India's fractile ladder",
  ...(Array.isArray(explanation.lockedNumbersUsed) ? explanation.lockedNumbersUsed : [])
])];

explanation.qualityFlags = [];
explanation.generationPasses = [
  ...(Array.isArray(explanation.generationPasses)
    ? explanation.generationPasses.filter((item) => item !== "manual-evidence-and-chart-explainer-deepening")
    : []),
  "manual-evidence-and-chart-explainer-deepening"
];

await writeFile(path, `${JSON.stringify(explanation, null, 2)}\n`);
console.log(`refined ${path}`);
