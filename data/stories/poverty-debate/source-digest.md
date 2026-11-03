# Source digest: World Bank, Poverty, Prosperity, and Planet Report 2026

Source: `data/raw/wb-3pr-2026/pppr-2026-full-report.pdf` (236 pages, sha256 in the
manifest). Reading aid: `pppr-2026-full-report.liteparse.md`. References `L<n>` are
lines of that Markdown file. Values marked `[check PDF]` were garbled in conversion
(mostly figure labels) and must be read from the page image before use.

Built 3 November 2026 by four parallel readers (one per chapter block), merged here.
Parts A to D keep their own section numbering.

## What the report says about India, in one paragraph

The report is global, and India is mostly a supporting character in it. Its
India-specific facts are few and strong: 33 million Indians (about 2%) below $3 a day in
2024, only 4% of the world's extreme poor; but India is the largest single group of
the world's poor at $4.20 (216 million, 14.6%) and $8.30 (1,143 million, 30.4%), and the
largest contributor to the global Prosperity Gap in 2026. India accounts for about 70%
of the world's fall in poverty among people with no schooling (2013-24). Its private
CPHS survey for 2015-21 was dropped, so India has no survey points for those years.
Its consumption Gini is not comparable with income Ginis. Chapters 3 and 4 give no
India figures at all; they give South Asia or income-group aggregates, which must not be
told as India's. The India detail in the article therefore comes from the replication
data (Country_FGT, GSAP, SPID, MPM, chapter 4 files), the October 2026 India Poverty &
Equity Brief and Indian sources.

## Skip list (India findings deliberately left out)

- South Asia hazard exposure (88%), heat risk and food-insecurity figures: regional
  aggregates only, and South Asia now excludes Pakistan; not India's numbers.
- Fig 3.6 and 3.7 India bubble positions (emissions decoupling, growth benefit-cost):
  unreadable in conversion and outside the poverty question.
- Chapter 4 group statements for lower-middle-income economies (employment 59.2% vs
  57.9%): an income-group average, not India; use only as context, labelled as such.
- Fixed fertiliser prices in India cushioning the 2026 Middle East conflict's food-price effect (Box 1.2): a note on shock modelling, outside the poverty question.
- China and India together held more than half of the global Prosperity Gap in 1990 (chapter 2): history of the global measure; the article uses India's 2026 position instead.
- India's relative decoupling of emissions from growth and its place among six economies with 62% of 2024 emissions (chapter 3): outside the poverty question.
- Haggblade et al. 2010 rural-India income share: a literature citation without a year
  of data; mention at most, with its source.


---

## Part A digest: WB PPP Report 2026, Main Messages, Overview, Ch.1 + Annex 1A-1D
Refs are "L<n>" = line of the liteparse .md (PDF pages not printed in text). Figures are 2021 PPP dollars a person a day unless stated. PIP version September 2026. 2025-26 are nowcasts; 2019 is a projection (India gap, see below).

## 1. The argument (in order)
- Extreme poverty fell from 43% (1990) to 11% (2020), but has stalled: 811m people, 1 in 10, at $3.00 in 2026, "unchanged since 2019/2020" (L512, L1003).
- Counterfactual: at the 2000-13 log-linear pace the 2026 rate would be ~7%, ~3 pps lower, ~240m (243m) fewer poor. The stall shows only at $3.00; at $4.20 and $8.30 progress kept pace (L514, L1119, Fig 1.1).
- Escaping extreme poverty is not reaching the middle class: 3.7bn (44%) live under $8.30; the $3.00-$8.30 group stayed "close to a third" of humanity since 2000 (L522, L1145, Box 1.3).
- Poverty lines were revised (2017 to 2021 PPP) from national lines of poor countries; "not a movement of the goalpost" (Box 1.1, L1013).
- Region story: East Asia, then South Asia, drove the global fall; Sub-Saharan Africa (SSA) stuck near 43-44%; MENAAP rising (L1301-1334).
- Concentration: >half the extreme poor live in 9 economies, three-quarters in 20; the dissimilarity index rose 0.31 (2000) to 0.65 (2024) (L1394, L1430).
- Mechanism of the projected rise: population grows fastest where poverty is highest and where fragility/conflict (FCS) is; so global rate rises even if most national rates edge down (L1495).
- Projection: at 2015-24 per-capita growth, rate and count are higher in 2030; 4% a year growth needed for ~3% by 2050 (L904, L1495).
- Who the poor are: young (children 18%), uneducated (no schooling 22%), rural (16% vs 5% urban), households with children lacking two working-age adults (L1623-1722).
- Subnational data: poverty clusters in places within countries; South Asia's subregions compressed, mostly under 10% (L1809).
- Beyond $3.00: societal poverty line and Multidimensional Poverty Measure (MPM) say the problem is bigger; South Asia's gap is the widest (L1891-1999).
- Overview then links this to prosperity, planet and jobs: employment among the poor fell in 88 of 138 economies 2003-24; earnings did the work (L940-944).
- Hedge: 2025-26 values are model nowcasts (GDP per capita growth x pass-through), distribution neutral (Annex 1A, L2049).

## 2. Every India / South Asia mention
- Box 1.4 (L1344): new PIP data added for "India (2022/23, 2023/24)"; Pakistan 2024/25; Ethiopia 2021; Nigeria 2022/23; Egypt 2021/22.
- Annex 1A (L2039): India's Consumer Pyramids Household Survey (private firm, 2015-2021) "removed from PIP" over comparability with government Household Consumption Expenditure Survey; so "no survey data on India ... 2015-21", and South Asia 2015-19 and global 2019 coverage lost. Hence 2019 is a projection (Fig 1.1 note).
- Box 1.2 (L1045): fertilizer prices "fixed in some countries, such as India" (cites PIB 2026); a mitigation of the Middle East conflict's food-price effect.
- Box 1.3 fig/text (L1249): welfare rise since 1990 "partly reflects the dramatic welfare increases in China and India".
- L1301: South Asia extreme poverty "fell from above 50 percent to low single digits".
- L1346: "In South Asia ... more than 70 percent of the population is living on less than $8.30 a day."
- L1390: "South Asia, in particular, has shown strong, broad-based welfare gains across the distribution" (2000-19 and 2019-25 growth incidence curves, Fig 1.5b; values unreadable [check PDF]).
- L1394: nine economies with most poor: six SSA plus India, Pakistan, Yemen. "India is among the top nine ... not because of a high extreme poverty rate, but because it is the most populous country." India's rate "has decreased substantially over the last 15 years"; the other eight stagnated or rose.
- L1394: at $4.20 and $8.30, India is a larger share of global poor.
- Fig 1.6 (L1412): India 33M, 4.0% of the global poor, 2024, $3.00 (extrapolated/interpolated to 2024). Pakistan 56M 6.8%.
- Footnote 5 (L2542): India extreme poverty rate 2 percent (2024, $3.00); Pakistan 22%, Indonesia 5%. (33M / ~1.45bn is consistent with ~2%.)
- L1485: at $4.20 India, Nigeria, Pakistan together >a third of global poor; at $8.30 India alone "over 1 billion".
- Fig 1B.2a ($4.20, 2024): India 216M, 14.6% of the global poor (largest; Pakistan 120M 8.1%, Nigeria 147M 9.9%, DRC 99M 6.7%). Fig 1B.2b ($8.30, 2024): India 1,143M, 30.4%; China 233M 6.2%; Pakistan 219M 5.8%; Bangladesh 119M 3.2%.
- L1645: among people with no schooling, poverty fell 12 pps 2013-24 (within-economy 15 pps); "India alone accounted for roughly 70 percent" of within-economy progress; five economies (Bangladesh, China, India, Indonesia, Pakistan) nearly all.
- L1809: South Asia subnational rates "clustered below 10 percent" (2024, $3.00); Fig 1B.5 shows South Asia (no India-state figure).
- L1934, Table 1.1: South Asia (4 economies, 98% coverage, 1,625.3m people): extreme poverty 5.3%, MPM 16.4%, circa 2023. L1999: South Asia MPM "three times" the monetary rate; driven by education and sanitation deprivations (Fig 1.19b, values not legible).
- Overview (L924): multidim vs monetary gap widest in SSA and South Asia (education, sanitation).
- Main Messages (L684): South Asia's share at high climate risk brought below 20% by reducing vulnerability (Ch.3, outside scope).
- Table 1C.1 South Asia, $3.00 rate %: 1990 50; 2010 30; 2019 9; 2020 9; 2021 8; 2022 6; 2023 4; 2024 3; 2025 2; 2026 2 (2000 blank). $4.20: 77; 2010 61; 2019 31; 2020 33; 2021 29; 2022 25; 2023 20; 2024 15; 2025 13; 2026 11. $8.30: 97; 2010 93; 2019 84; 2020 85; 2021 83; 2022 81; 2023 79; 2024 77; 2025 74; 2026 71. Note: rows are South Asia as now defined (Afghanistan, Pakistan moved to MENAAP) (L2297-2350).
- Table 1C.2 South Asia millions at $3.00 [check PDF, row garbled]: 1990 503; 2010 439; 2019 140; 2020 152; 2021 129; 2022 101; 2023 68; 2024 43; 2025 35; 2026 29. $4.20/$8.30 rows too jumbled to attribute.
- Table 1C.3 South Asia share of global poor: $3.00: 22 (1990), 30 (2010), 17 (2019), 14 (2021), 12 (2022), 8 (2023), 5 (2024), 4 (2025), 4 (2026). $4.20: 27, 35, 30, 28, 26, 21, 17, 15, 13. $8.30: 26, 32, 35, 35 (2019-23), 34 (2024), 34, 33 (2026).
- Regional definition change (L1344): Afghanistan and Pakistan moved from South Asia to MENAAP; so South Asia here is not the older WB South Asia. Legacy series on PIP.
- Fig 1.4 and Fig 1.11b show South Asia lines/contributions; no values legible.

## 3. Global findings that frame India
- Global extreme poverty (<$3.00): 43% (1990), 36% (2000), 21% (2010), 11% (2019-20), 10% (2023-26) (Table 1C.1). 2,301m (1990) to 837m (2019) to 811m (2026) [numbers from L1003, Table 1C.2].
- 2026 count 811m; with differential price shock 813m; sectoral income shock 816.6m; pre-conflict projection 808m; 2025 count 816.9m (Box 1.2).
- At $4.20: world 56% (1990), 36% (2010), 21% (2019), 17% (2026). At $8.30: 70% (1990), 60% (2010), 50% (2019), 44% (2026); 3.7bn people (L1145, Table 1C.1).
- Line definitions: $3.00 = median national line of low-income economies (international/extreme line); $4.20 = lower-middle-income; $8.30 = upper-middle-income; previous (2017 PPP) $2.15/$3.65/$6.85 (Table B1.1.1, L1021).
- $28.00 = prosperity standard; middle class = $8.30-$28.00 (Box 1.3; Ch.2 defines Prosperity Gap, outside scope). Overview: Prosperity Gap 10.5 (1990), 5.5 (2013), 4.5 (2026) (L612).
- Global median income $9.20 a day (2024); in 1990 half the world lived on under $3.55 (L1249, L888).
- Middle class roughly doubled as share of world population since 2000; expansion concentrated in upper-middle-income economies, where it is now the majority; lower-middle-income: $3.00-$8.30 group is largest; low-income: about half under $3.00, middle class negligible (L1247).
- Economic security lines (Bolch et al. 2026): ~$6.00, $7.00, $14.00 for low/lower-middle/upper-middle groups, "roughly twice" the poverty lines (L1193).
- Concentration: 9 economies = 53% of extreme poor; next 11 = 23%; remaining 53 = 24% (Fig 1.6, 2024). Top: Nigeria 95M 11.5%, DRC 90M 10.9%, Ethiopia 42M 5.1%, Tanzania 32M, Mozambique 28M, Uganda 27M, India 33M 4.0%, Pakistan 56M 6.8%, Yemen 29M.
- Low-income economies: 49% of extreme poor in 2025, up from 18% in 2010; lower-middle share fell 8 pps to 44% (L1434). Half of the world's poor still live in middle-income economies.
- At $4.20, 54% of poor are in lower-middle-income economies; at $8.30, 80% in middle-income economies (L1485).
- Low-income economies (26): poverty fell >2% a year in 2000s with GDP per capita ~3%; rose in decade to 2024 while GDP per capita fell; per capita income <0.1% growth a year since 2010; ratio to graduated economies 60% (2000) to 30% (2023) (L1434, L1390).
- SSA: extreme poverty 62% (1990) to 43% (2026), ~44% since 2014; MENAAP rising, 14% in 2026 (Table 1C.1).
- FCS share of extreme poor: 12% (2010) to 57% (2026); global population in FCS 6.0% to 13.5% (2010-25); 87% of poor in SSA or FCS by 2030 (L1575).
- Projection: GDP forecast gives >9% in 2030; 2000-09 growth still gives >8%; 4% growth gives ~3% by 2050; 3% target = 256m people in 2030 (Fig 1.2 note, L1495).
- Poor profile: children 18% vs adults 6%; no schooling 22%, secondary 6%, tertiary 1%; rural 16% vs urban 5% (2024; rural 25% and urban 7% in 2013); three-quarters of poor rural (L1645, L1722).
- Household types: one woman adult with children 24% to 21% (2013-24); two-adult with children 18% to 12%; multiple-adult 22% to 14% (L1651).
- Nowcast method: PIP data to 2024; 2025-26 from GDP per capita growth (GEP June 2026), pass-through 0.7 if last survey is consumption, 1.0 if income; distribution neutral (Annex 1A).
- Data coverage: 2,588 survey-years, 172 economies, 97% of population; welfare under $0.28 a day floored at $0.28 (L2035).
- Dissimilarity index: 0.31 (2000), 0.33 (2010), 0.65 (2024); top-20%-rate economies (20% of population) held 37% of poor in 2000, ~85% in 2024; 30% of world lives in economies with effectively zero extreme poverty, up from 9% (L2499).
- MPM across 103 economies: 16.7% multidim poor vs 11.3% extreme (circa 2023). By region MPM vs extreme: SSA 56.7 vs 47.0; MENAAP 15.1 vs 12.8; South Asia 16.4 vs 5.3; LAC 4.5 vs 3.9; EAP 3.8 vs 3.4 (Table 1.1).
- Societal poverty line = max($3.00, $1.30 + 0.5 x median) (L2045).

## 4. Concepts the report defines
- Extreme/international poverty line: $3.00 a person a day, 2021 PPP; median of low-income countries' national lines; "the typical standard by which governments in the poorest economies define poverty" (L1013). Not a living standard.
- $4.20 and $8.30 lines: typical national lines of lower-middle and upper-middle-income countries; read as "poor by a middle-income country's yardstick" (L1193, L2035).
- Vulnerable group: $3.00-$8.30, above extreme poverty, "one shock away from falling back"; short of security (L522, Box 1.3).
- Middle class: probability of falling into poverty is low (Lopez-Calva and Ortiz-Juarez 2014); $8.30-$28.00 as proxy. Report says thresholds "are proxies"; security needs more than the poverty line (Box 1.3).
- Prosperity standard: $28.00 a day. Prosperity Gap: average factor incomes must be multiplied to reach $28.00 (Overview L914).
- PPP: converts local currency to dollars via price levels, ICP; base year changed 2017 to 2021 in June 2025 (Box 1.1). Cannot tell you actual rupee purchasing power of any one household.
- Welfare: household consumption or income per capita, whichever the survey has; slightly more than half of economies use consumption (L2035). Assumes equal sharing within households (fn 11, L2548); cannot say anything on poverty by sex.
- Nowcast vs forecast: nowcast = 2025-26; forecast = later years (L2049). Distribution-neutral, one pass-through for all countries; Macro Poverty Outlook is preferred for country-specific work (fn 2).
- Coverage rule: a region or world estimate is published only if surveys within +/-3 years cover >=50% of population (Box 1.4, L1344).
- Interpolation/extrapolation: gaps between surveys filled with national accounts growth x pass-through (Annex 1A).
- Imputation (Mahler et al. 2026): economies with no survey (<3% of world population) modelled from GDP per capita, under-5 mortality, life expectancy, rural share, income group, region (L2039).
- Societal poverty line: weakly relative; "poverty partly involves exclusion from a normal life" (L1891).
- MPM: three equal-weight dimensions (monetary, education, infrastructure); poor if deprived in indicators summing to >=1/3 of weights; education: child up to grade 8 not enrolled or no adult finished primary; infrastructure: lacks clean water, sanitation or electricity; MPM >= extreme poverty by construction (L1929, L2045, Fig 1.18 note).
- FCS: World Bank classification of fragile and conflict-affected situations; fixed after 2025 in projections.
- MENAAP: Middle East, North Africa, Afghanistan, Pakistan; South Asia no longer includes the last two.
- Dissimilarity index: share of the poor who would have to relocate to match population shares; 0 to 1 (L2499).
- Growth incidence curve: annualised welfare growth by percentile; reflects surveys, "may not coincide with national accounts" (Fig 1.5 note).
- Shapley decomposition: splits change into within-economy and between-economy (composition) effects (fn 13).
- Poverty gap (PG): depth of poverty (used in Ch.4; not defined in this part).
- Household economies of scale caveat: per-capita measure ignores sharing; Jolliffe and Tetteh-Baah (2024) say it changes who is identified as poor (L1651).

## 5. Lay-reader questions this part raises
- India's extreme poverty is 2% but the world says it is stalled: how can both be true?
- Why does this report say 33 million Indians are extremely poor when national numbers I have read are different? (Which survey, which line, which year?)
- What does $3.00 a day actually buy in India? Is it rupees at the market rate?
- Why are most Indians still "poor" at $8.30 a day (over 70% of South Asia, 1,143m for India)? Does that match my life?
- Am I middle class by this report's definition, and what is the $28 standard?
- Why did the line move from $2.15 to $3.00? Did poverty increase on paper?
- How can a country with 2% extreme poverty still have 216m "poor" at $4.20?
- Why was India's private-survey data (CPHS, 2015-21) thrown out, and what does that do to the trend?
- Why does South Asia look fine on money poverty (5.3%) but 16.4% on the multidimensional measure?
- What is the "societal poverty line" and would India's number change?
- Why are the 2025-26 numbers estimates and how reliable are they?
- Will the Middle East conflict, El Nino, and fertilizer prices push Indian households back?
- Why does the report group Pakistan and Afghanistan out of South Asia?
- Are rural Indians as much worse off as the global three-to-one rural-urban gap?
- What did schooling do for India's poor, given India's ~70% share of progress among the unschooled?

## 6. Related indicators to pull
- PIP headcount at $3.00, $4.20, $8.30 (2021 PPP) for India, South Asia, world (pip.worldbank.org; API). Series by year, with welfare type (consumption).
- PIP societal poverty line headcount; poverty gap; Gini; median welfare; mean welfare for India.
- 1000 Binned Global Distribution 1990-2026 (datacatalog dataset 0064304): India's distribution; compute shares in $3.00-$8.30 / $8.30-$28 / above.
- PIP Poverty Projections (datacatalog 0067066).
- Global Subnational Poverty Atlas (0042041) and SPID (0064796): Indian states/regions.
- Multidimensional Poverty Measure database (September 2026): India MPM, education and infrastructure components.
- Global Monitoring Database (internal; microdata via PIP Statistics Online): India by age, education, rural/urban, household type.
- WDI: GDP per capita growth (constant prices), population (UN DESA 2024); report cites WDI generally, no codes given in this part.
- Macro Poverty Outlook (April 2026) for India-specific nowcast; Global Economic Prospects June 2026 (growth input).
- No WDI codes appear in this part [codes none given].

## 7. Literature the report leans on
- Alfani et al. 2025, "June 2025 Update to the Poverty and Inequality Platform" (2021 PPPs; line revision) (title partial in L2560).
- Foster et al. 2025: global poverty lines under 2021 PPPs; societal poverty line; trends robust to PPP series.
- Mahler et al. 2022: pass-through (0.7 / 1.0); COVID poverty setback; GDP-based projection works about as well as 1,000-indicator model.
- Mahler et al. 2026: imputation for economies without surveys.
- Lopez-Calva and Ortiz-Juarez 2014: vulnerability-based middle class definition; Bolch et al. 2026 (economic security lines); Bussolo et al. 2025.
- Kimura et al. 2026: distributional shocks from the Middle East conflict.
- Atkinson Commission (World Bank 2017): societal poverty line. Jolliffe and Prydz 2021: how national lines vary with income.
- Yonzan et al. 2026: $0.28 floor for very low welfare values.
- Lara Ibarra et al. 2026; World Bank 2026e: Multidimensional Poverty Measure.
- De la Flor Giuffra et al. 2025: household typology; Jolliffe and Tetteh-Baah 2024: household economies of scale; Beegle and Christiaensen 2019: agriculture growth benefits the poorest.

---

## Part B digest: PPP Report 2026, Chapter 2 "The Path to Shared Prosperity Is Bumpy and Uneven" + Annex 2A (and 2B)
Refs are "L" = line in pppr-2026-full-report.liteparse.md. PIP = Poverty and Inequality Platform, version September 2026. All $ are 2021 PPP, per person per day.

## 1. The argument
- Two shared-prosperity indicators: (a) number of economies with Gini above 40 ("high inequality"); (b) Global Prosperity Gap against a $28.00 a day standard (L2668, L2685).
- Why inequality matters: it can self-reinforce, trap poor households with low human capital, and make growth cut poverty less (Kuznets inverted-U doubted; Galor-Zeira, Bourguignon, Datt-Ravallion, Fosu, Bergstrom "double dividend") (L2685-2691).
- Headline: 42 of 169 economies had Gini above 40 in 2024; 94 moderate, 33 low. Concentrated in Latin America and Sub-Saharan Africa; South Asia and Europe/Central Asia mostly low or moderate (L2701, L2723).
- People, not economies: about 1.6 billion, one in five, live in high-inequality economies; China and India are not classified high-inequality, so excluding them lifts the share to nearly one in three (L2785). Fig 2.1.
- Count fell 70 (2000) to peak 76 (2004) to 42 (2024), but population share stuck near 20% since 2013; China's crossing the threshold drove the big swings (L2829).
- Average Gini fell (simple ~39-40 to ~36; population-weighted ~37-38 to ~34), by 2024 (L2919).
- Poverty and inequality are overlapping: share of extreme poor in high-inequality economies nearly doubled, 2000-24 (Fig 2.4) (L2927).
- High inequality is sticky: bimodal spell lengths (79 never, 37 always), yet the persistent 37 improved, mean Gini ~51 to ~46 (L3001-3037). Warning: threshold count hides progress (Box 2.2).
- Gini says nothing on level of welfare, poverty says nothing above the line; Mexico vs US example motivates the Prosperity Gap (L3043).
- Prosperity Gap: average of (28 / own income) across all people; pro-poor; computable from one survey (Box 2.3, L3053). Fell 10.5 (1990) to 4.5 (2026), but slowly now (~1.2%/yr latest decade) (L3077).
- Decomposition (Fig 2.8): welfare growth does most of the work; since 2021 between-economy inequality widened the gap for the first time; within-economy inequality rose before 2010 (L3135).
- Regions: East Asia and Pacific led (15.0 to 2.5), Sub-Saharan Africa stuck (17.1 to 11.1); China explains much of the global trend (Fig 2.11) (L3143, L3291).
- Where the gap sits now: South Asia plus SSA = 62.8% of the gap, 37.0% of population; India is the single largest contributor (L3175).
- Annex 2A and 2B: data construction and measurement limits (consumption vs income, top incomes, bottom-coding, household unit) (L3460-3558).

## 2. Every India / South Asia mention
- Gini threshold: "China and India have large populations, but are not classified as highly unequal economies." Excluding China, share in high-inequality economies about one in four; also excluding India, nearly one in three, in 2024 (L2785). Fig 2.1 (L2793-2825): all economies 19.4%, excl China 23.6%, excl China and India 30.3% (labels from garbled figure; match text) [check PDF for which number sits on which bar].
- Map 2.1 text: "Europe and Central Asia region and South Asia exhibit predominantly low or moderate inequality"; pattern stable over 25 years (L2723). Gini mixes income and consumption.
- Note 2 (L3563): China and India classifications "are also based on consumption surveys, which typically yield lower measured inequality than income-based surveys and may capture concentration at the top less fully." KEY CAVEAT for any India Gini story.
- Annex 2B (L3490): lower-income economies "particularly those in South Asia or Sub-Saharan Africa, predominantly use consumption-based surveys." Consumption Gini systematically lower than income Gini (smoothing, saving, lower bound).
- Prosperity Gap by region: South Asia is a region in Fig 2.9 (panels a, b); series values not legible in conversion [check PDF]. Text gives none for South Asia alone except the combined share below.
- "As of 2026, South Asia and Sub-Saharan Africa together accounted for 62.8 percent of the gap, but only 37.0 percent of the global population" (L3175).
- 1990: "Together, China and India accounted for more than half the global gap" (China alone 37.5%) (L3175). Fig 2.10 label "India 18.5" in the 1990 column is plausibly India's 1990 share [check PDF]. 18.5 + 37.5 = 56, consistent with "more than half".
- 2026: "seven economies accounted for more than half the global gap (India, China, DRC, Nigeria, Pakistan, Indonesia, and Ethiopia, in order of the size of the contribution)" (L3175). So India is first.
- "Despite the significant progress toward the eradication of extreme poverty (refer to chapter 1), India still weighs heavily in the global gap" (L3175).
- Fig 2.10 2026 column (garbled, L3185-3241): readable pairs: China 7.9, DRC 7.3, Nigeria 6.3, Pakistan 5.1?, Indonesia 3.5?, Ethiopia 3.0, Mozambique 2.5, Bangladesh 2.3. India's 2026 share is likely the large figure (stray "15.7" appears next to "India"; but 15.7 is also the stated share of 10 high-ratio economies, L3175) [check PDF: India's 2026 share unknown]. 1990 column: China 37.5, India 18.5(?), Pakistan 3.5, Nigeria 2.6, Brazil 2.6, Bangladesh 2.1, Indonesia 5.1(?) [check PDF]. Bangladesh and Pakistan are South Asia/MENAAP.
- Region definitions: Pakistan sits in MENAAP (Middle East, North Africa, Afghanistan, Pakistan), not South Asia; MENAAP gap ~5 since 2015, no improvement (L3175, Summary L2681). Important when quoting "South Asia".
- Fertiliser/"Atmanirbhar" reference (PIB 2026) is in the references only (L2634), outside this chapter body.
- No India-specific Gini value, Prosperity Gap value, or subnational India figure appears in text. Map 2.2 (subnational Prosperity Gaps, L3247-3257) may show Indian states but the map text is not extracted [check PDF]; source: Global Subnational Atlas of Poverty.
- Box 2.3 / Table 2A.1: no India row.

## 3. Global findings that frame India
- 169 economies in the dataset (97.4% of world population 2024); PIP has 172 economies (L3562).
- 42 high-inequality economies in 2024 (Gini above 40); 94 moderate (30-40); 33 low (30 or less) (L2701).
- 70 in 2000, peak 76 in 2004; 62 in 2015, 52 in 2020, 42 in 2024 (L2829, L3037).
- About 1.6 billion people, 19.4% (one in five), in high-inequality economies, 2024 (L2785, Fig 2.1).
- Population share in high-inequality economies about 50% early 2000s to 25% by 2013, then near 20%; China drove it, "more than a billion people" in one step (L2829).
- Simple average Gini: 39-40 (2000-05) to ~36 (2024); population-adjusted: 37-38 (2000-13) to ~34 (2024) (L2919).
- Table 2A.1: 169 economies, 1,764 survey-year obs; average Gini 36.9 total; consumption-based 36.2 (100 economies, 584 surveys, 66% LIC/LMIC); income-based 37.2 (69 economies, 1,180 surveys, 7% LIC/LMIC) (L3472-3476). Unweighted means.
- Box 2.2: share of economies with Gini above 42 fell 34% (2000) to 19% (2024); below 38 rose 49% to 63% (L2729).
- Extreme poor (below $3.00): share in high-inequality economies about a fifth (2000, Fig 2.4: 20.3) to about two-fifths (36.3); low-inequality 25.1 to 5.9; moderate 54.6 / 57.8 (garbled order) [check PDF]; ratio low:high from ~1:1 to ~1:6 (L2927, Fig 2.4).
- Spell lengths: 79 economies never high, 37 always high (25 years) (L3001). Persistent 37: mean Gini ~51 to ~46; upper quartile ~56 to ~50; lower quartile ~47 to ~43; 25th percentile only 3 points above 40 by 2024 (L3005-3037).
- Mexico vs US 2024: Gini 42.6 and 41.8; extreme poverty 1.7% and 1.1%; mean income $20.00 vs $96.00 a day (L3043).
- Prosperity standard $28.00 a day = income of typical person in a country at the high-income threshold; poverty lines $3.00, $4.20, $8.30 (L3043, L3061).
- Global Prosperity Gap: 10.5 (1990), 5.5 (2013), 4.5 (2026, nowcast); latest decade about 1.2% a year improvement; mid-2015 value ~4.5-5 (summary says fivefold 2015) (L2672, L2680, L3077).
- Without China: 8.4 (1990) to 5.0 (2026) (Note 6, L3567). With China no progress in 1990s if excluded (L3291).
- Regions: EAP 15.0 to 2.5 (more than 80% cut; 4.4% a year); SSA 17.1 to 11.1 (0.7% a year; 41% of global gap; ~1980 global level); MENAAP ~5 since 2015 (L3143, L3291).
- Gap widened in 18 economies 1990-2026 (about 10% of economies and people): SSA 6 of 48, ECA 5 of 48, MENAAP 4 of 17 (L3175).
- 10 economies with highest gap-to-population ratio (9 SSA plus Yemen) = 15.7% of gap, 3.6% of population (L3175, Note 7).
- Decomposition: welfare growth reduced gap every decade since 1990 and is the sole driver since 2020; between-economy inequality widened the gap since 2021, linked to uneven COVID recovery (L3077, L3135).
- Bottom-coding threshold $0.28 a day in PIP; negligible effect on mean and Gini (L3548).
- SSA: Nigeria, Ethiopia, DRC = more than one-third of population, 40% of regional gap; FCS economies 65% (L3372, L3444).

## 4. Concepts the report defines
- High inequality: Gini above 40 (Box 2.1, L2707). Threshold chosen as UN usage, top third of Ginis in 2000-22, and median expert view for consumption-based measures. "No universally recognized standards."
- Moderate: above 30 to 40; low: 30 or less (L2701).
- Gini: scale 0 (equal) to 100 (one person has all); computed from household surveys; correlates highly with other measures (L2707).
- Consumption vs income Gini: consumption Gini systematically lower (smoothing, saving, floor at zero). Income data can include zero or negative values. Most economies sit above the 45-degree line in Fig 2B.1. Converting to income basis would add high-inequality economies, mostly in SSA (L3490). Cannot compare India (consumption) with Latin America (income) naively.
- Survey limits: underrepresent top incomes (Gini likely too low; falling measured inequality may be partly artefact); wealth inequality can rise while income inequality falls; household-level welfare ignores intra-household sharing (understates) but treats shared goods as private (overstates); net effect open (L2719, L3540-3558).
- Threshold count caveat: carrying survey values forward means apparent crossings reflect new survey arrival, not sudden change (L3464); 55-to-45 economy counts same as stagnant 55.
- Global Prosperity Gap: average across all people of (standard / own welfare); "number of times an average person's income would need to be multiplied" to reach $28.00; weights poor more; level and inequality together (Box 2.3, L3053). Example: $7 and $14 give 4 and 2; $18 and $38 give 1.1, not 1 (L3073). Value below 1 for individuals above the standard.
- Prosperity head count: people below $28.00 a day (L3347).
- Between-economy vs within-economy inequality (L3135). Welfare = consumption or income, depending on survey (L2685).
- Spell length: longest run of consecutive years in 2000-24 with Gini above 40 (L2975).
- Prosperity Gap history: first set at $25.00 (2017 PPP), updated to $28.00 for 2021 PPP (Note 5). Launched 2023 (L3061).
- Population-adjusted vs simple average Gini (L2891).
- MENAAP; FCS (fragile and conflict-affected situation).

## 5. Lay-reader questions
- Is India a high-inequality country, and what does the World Bank's "not high" label really mean?
- Why does the World Bank use a Gini of 40 as the line, and who chose it?
- Is India's Gini low because India is equal, or because it is measured by spending rather than income?
- Why do spending surveys show less inequality than income surveys?
- If the rich are missed by household surveys, how much higher might India's true inequality be?
- What is the "Prosperity Gap" and what does a score like 4.5 mean for an ordinary person?
- Why $28 a day? Who in India earns that, and how many do not?
- Which country adds the most to the world's prosperity gap, and why is it India?
- Why does India matter so much for a global average even as poverty has fallen?
- Has the world got more equal, or has China just pulled the average?
- Why did the world's progress slow after 2013 or so?
- What does it mean that rich countries are recovering faster since 2021?
- Does it matter that only the household, not the person, is measured? What about women?
- Is South Asia doing better or worse than Africa on prosperity?
- Can a country be less poor and still very unequal (Mexico vs US)?

## 6. Related indicators to pull
- PIP Gini index (consumption and income separately) for India, all survey years; PIP "welfare type" flag (WDI SI.POV.GINI).
- PIP Prosperity Gap, prosperity head count, and share of global gap by country (pip.worldbank.org); regional South Asia and MENAAP gaps.
- Poverty at $3.00, $4.20, $8.30 lines (WDI SI.POV.DDAY, SI.POV.LMIC, SI.POV.UMIC; codes are not given in this chapter, listed only as likely names [check]).
- Mean daily welfare per person in 2021 PPP (PIP).
- Global Subnational Atlas of Poverty / PIP map (subnational Prosperity Gaps) for Indian states.
- PIP survey comparability metadata for India's consumption surveys.
- World Inequality Lab (WID) top-income shares for India as tax and national-accounts cross-check (cited via Andreescu et al. 2025).
- UN DESA World Population Prospects 2024 for weights.
- Deudibe et al. 2026 income-equivalent Gini adjustment (Map 2B.1) for India's adjusted classification [check PDF].
- No WDI codes are printed in the chapter.

## 7. Literature the report leans on
- Haddad et al. 2024: basis for the Gini 40 threshold (L2701, L2719); full title in the reference list is not in my range.
- Kraay et al. 2023: Prosperity Gap definition and decomposition (L3053, L3129).
- Deudibe et al. 2026: income-equivalent conversion of consumption distributions (L2719, L3490).
- Castañeda Aguilar et al. 2026 and Yonzan et al. 2026 ("Bottom-Coding for the Measurement of Global Poverty and Inequality", PRWP 11349): data handling (L2656, L3548).
- Lakner and Milanović 2016: global distribution, "elephant" gains (L2691).
- Datt and Ravallion 1992; Bourguignon 2003: growth/redistribution decomposition (L2691).
- Alvaredo et al. 2026, "Is Income Inequality on the Rise Everywhere?"; Andreescu et al. 2025 (WIL, top-income corrections) (L2578, L3540).
- Disslbacher et al. 2026 (wealth inequality rising since 1990s) (L2719); Lustig and Vigorito 2025; Korinek et al. 2006 (top-income undercoverage).
- Kose et al. 2026 (uneven COVID recovery) (L3135).
- Jolliffe et al. 2025 and Jolliffe and Tetteh Baah 2024 (household economies of scale, within-household inequality).

---

## Part C digest: Chapter 3, "The Livable Planet: Tracking Progress" (md lines 3666-4430)
Refs are "L<n>" = line of pppr-2026-full-report.liteparse.md. PDF pages not shown in the md (only img_p144 appears in Box 3.1, so Box 3.1 is ~PDF p.144 [check PDF]).
Note: the chapter does NOT contain a multidimensional-poverty measure. "Multidimensional" appears only as a one-line remark on climate vulnerability (L3847). Chapter 3 is five monitoring indicators.

## 1. The argument
- Livable-planet pillar is tracked by five indicators: people at high climate risk, GHG emissions, key ecosystems, food/nutrition insecurity, WASH (L3687). Poverty reduction depends on environmental conditions.
- The five are interlinked; the same groups (poor and near-poor in low and lower-middle-income countries) are hit across all (L3707). Chapter is "primarily a monitoring exercise".
- New data used: EDGAR 2025 (emissions to 2024), SOFI 2026, JMP 2025 (WASH 2000-24), Global Nature Watch 2024 tree loss. Unchanged indicators are flagged as carried forward (L3707).
- Climate risk = exposed to at least one of four hazards (floods, droughts, cyclones, heat waves) AND vulnerable on at least one dimension (L3713). 103 economies, 86% of world population.
- About 4.5 billion (60%) live in exposed areas; heat waves dominate; South Asia has the highest exposed share (L3740).
- Exposure follows an inverted U by income group: lower-middle highest (L3774).
- 2.8 billion (35%) highly vulnerable; most of them are above the extreme poverty line, so climate risk reaches the middle class (L3841-3847).
- Net "high risk" (exposed and vulnerable) is about 1.5 billion, 17.3% in 2024; share fell since 2010 but the number exposed rose (L3851).
- Emissions at record 52.8 GtCO2e in 2024; growth is partly decoupling from emissions; a few big economies, India among them, emit most (L3970-4062).
- Core claim: ending extreme poverty adds little to emissions; in poor economies the poverty benefit of growth far exceeds the future poverty cost of emissions; mitigation room lies in rich countries (L4062).
- Ecosystems: record primary tropical forest loss in 2024 driven by fire; ecosystems are the rural poor's asset base and safety net (L4128-4184).
- Food insecurity stuck at a high level; undernourishment falling in South Asia; stunting down but off track (L4190-4242).
- WASH improving but safely managed tiers lag; rural-urban gaps (L4254-4321).
- Conclusion: the same populations are worst affected on all five; data gaps are largest where need is greatest (L4329-4337).

## 2. Every India / South Asia mention
India by name (only three places):
- Decoupling text: "China and India have also experienced relative decoupling. In 2001-22, relative to the growth of the economies, emissions there grew at a substantially slower pace, thereby lowering emissions intensity." (L4006). Measure: average annual change in GHG index vs GDP index, 2001-22. No number for India in text.
- Fig 3.6 (L4012-4050): India plotted as a labelled point in the upper-middle part of the chart; axes average change in GDP index (%, about -2.5 to 10) and GHG index (%, about -? to 12); India appears near "4" on the GHG axis, between China/Saudi Arabia and Iran [reading is jumbled, check PDF]. Bubble shows average share of global GHG (0.05-0.20 scale). Source: World Bank 2025b, 2000-22 data. Colour = income group (India is lower-middle; colour not recoverable [check PDF]).
- Emissions concentration: "In 2024, Brazil, China, the European Union, India, the Russian Federation, and the United States together accounted for 62 percent of global GHG emissions." (L4062). India's own share not given.
- Fig 3.7 (L4068-4116): India is a labelled bubble in the benefit-cost chart (growth benefit vs emissions poverty cost, 1% GDP growth in 2026), x-axis annual GDP per capita ($), around $3,000 to $10,000 range [placement approximate, check PDF]; benefit-cost ratio axis log (1 to 300); India sits between the 10 and 30 gridlines, near Indonesia [check PDF]. Source: Hallegatte et al. 2026. The text says the ratio is "often a factor of 100 or more" only for the poorest economies, not India.
South Asia (regional aggregate):
- Exposure: "South Asia has the highest proportion of exposed population, at 88 percent" (L3740); East Asia and Pacific 68%. Heat waves: "Four in five South Asians are living under significant heat risk" (L3740). More than 1 in 10 exposed to flooding in South Asia (also EAP, MENAAP) (L3740). Measure: share exposed to at least one of four hazards (thresholds in Section 4).
- High risk: "In South Asia, the population at risk has declined substantially, to below 20 percent, since 2010, driven by a reduction in vulnerability." (L3851). Fig 3.4 note: trend reflects vulnerability only, because exposure is assumed fixed (L3892).
- Fig 3.4 (L3857-3892): South Asia plotted with exposed/at-risk circles; values unreadable [check PDF].
- Box 3.3: "Water stress is most widespread in South Asia and in the Middle East and North Africa." "In South Asia, nearly everyone faces at least one serious hazard." (L3904). Fig B3.3.1 panel d has South Asia bars; values not recoverable [check PDF].
- Fig 3.5 panels c, d (per capita and per-GDP emissions, by region) include a South Asia line (L3984-3998); no values legible [check PDF].
- Food: "Notable improvements ... are evident in South Asia and in Latin America" in moderate/severe food insecurity (L4194). Undernourishment: "In South Asia, undernourishment fell from 19.5 percent to 10.6 percent between 2004-06 and 2023-25," "a decline of nearly 100 million people" (L4194). Fig 3.9 (L4196-4236) has a South Asia line, 2014-2023; values unreadable.
- Food crisis drivers: climate extremes are the second driver "particularly in Sub-Saharan Africa and South Asia, where smallholder agriculture is dependent on rain" (L4246).
- WASH: Figs 3.10 (L4256-4273) and 3.11 panel f (L4289-4315) include South Asia lines (water/sanitation/hygiene; urban vs rural safely managed water, 2000 vs 2024); no values legible [check PDF]. Text does not discuss South Asia numbers in WASH.
- Box 3.1 (Latin America) and Box 3.2 (El Nino) do not name India or South Asia (Box 3.2 says effects "vary sharply by region", L3823).

## 3. Global findings that frame India
- Global population in analysis 7.50 bn; exposed to >=1 hazard 60%, 4.50 bn; heat waves 42% (3.15 bn), drought 18% (1.35 bn), floods 10% (0.75 bn), cyclones 8% (0.60 bn) (Fig 3.3, L3750-3764).
- Exposure by income group: low 41%, lower-middle 73% (India's group), upper-middle 55%, high 32% (L3774). Lower-middle is the peak.
- Highly vulnerable: 2.8 bn, 35% of world, 2024 (L3841). Drivers: no social protection 1.6 bn; financial exclusion 980 m; low education 900 m; income (below extreme poverty line) about 10% of world; no electricity 570 m; limited safe water access 410 m (L3841-3847).
- Majority of highly vulnerable are above the extreme poverty line (L3847).
- High risk 17.3% of people in 2024 (about 1.5 bn); MENAAP 47%, Sub-Saharan Africa 35%; South Asia below 20%; other regions below 15% (L3851, L4329).
- High-risk share fell from 1 in 3 (2010) to 1 in 5 (2021) but exposed people rose by 461 million (L3851).
- Environmental hazards (Box 3.3, Damania et al. 2025): about 75% of world exposed to at least one acute environmental or climate hazard; more than half to a climate hazard; hazardous air pollution and high water stress about 37% each; land degradation about 10% (L3904).
- Low-income economies: 79% exposed to air pollution, water risk and land degradation at once; high-income 43% exposed to none (L3904). More than half of low-income and 80% of lower-middle-income people exposed to at least one of the three; high-income 1 in 10 (L3904). About 80% of people exposed to unsafe outdoor PM2.5 live in low- and middle-income economies (L3904).
- Within countries outdoor PM2.5 can rise with income; poorer households face more indoor pollution from solid-fuel cooking (L3962). Regional/income-group aggregates only.
- Global GHG excl. LULUCF: 52.8 GtCO2e in 2024, +0.6% on 2023, about 48% above 2000, average growth nearly 1.6%/yr (L3970).
- Six emitters (Brazil, China, EU, India, Russia, US) = 62% of 2024 emissions (L4062). Sub-Saharan per capita: 1.6 tCO2e (West/Central), 2.0 tCO2e (East/Southern) (L4062).
- Ending extreme poverty would add less than 5% to global emissions relative to 2019 levels (Wollburg et al. 2023) (L4062).
- Poverty benefit vs emissions cost of 1% growth in 2026: ratio often 100 or more in the poorest economies; falls with GDP per capita; negative for rich (L4062, L4118).
- Low-emission pathways in 93 economies could cut global GHG about 70% by 2050 with neutral or positive GDP effects in most (L4052).
- Forests: removed 1.3 GtCO2e in 2024, fires emitted 2.2 GtCO2e, LULUCF net source 0.9 GtCO2e (L4128). Tropical primary forest loss 6.7 m ha in 2024, nearly twice 2023 (L4132).
- Food insecurity (moderate/severe): 28.0% (2.3 bn) in 2024 vs 28.4% in 2023; +335 m vs 2019 (L4190). The text also says 26.8% "currently" [two figures; check PDF]. Hunger 7.8% in 2025 (L4194). 2.6 bn could not afford a healthy diet in 2024 (L4246).
- Stunting: 150.2 m children under 5, 23.2% in 2024, vs 180.4 m (26.4%) in 2012 (L4242). Wasting 6.6%.
- WASH: basic water 91.4%, basic sanitation 82%, basic hygiene 78% of world (L4254). Safely managed water 74% in 2024 (68% in 2015); sanitation 58% (48%); 3.4 bn lack safely managed sanitation; 429 m fewer open defecators, 354 m still do (L4279). Hygiene: 1.7 bn lack basic hygiene (L4279).
- Urban vs rural safely managed water 2024: 83% vs 60% globally; Sub-Saharan Africa 53% vs 17% (L4283).
- Sub-Saharan Africa undernourishment 22.3% (2023-25), 277.4 m people (L4242). Latin America 8.5% to 5.1% (L4194).

## 4. Concepts the report defines
- Climate risk indicator (high risk): exposed to at least one of four hazards AND vulnerable on at least one dimension (L3713). Vulnerability is physical (limited mobility, no water, no electricity, low access to services and markets) or economic (low income, low education, no financial services, no social protection) (Fig 3.2, L3719-3736). Cannot tell: trends reflect vulnerability only because exposure is held fixed (L3892); 103 economies, small island states under-covered (L3713).
- Exposed thresholds (Fig 3.3 note, L3772): agricultural drought on >30% of rural cropland at least once in 39 years; floods above 0.5 m with annual probability above 1%; 5-day average max wet-bulb temperature above 33C at least 1% of the time; 1% or higher annual probability of category 2+ tropical cyclone.
- Income vulnerability: living below the extreme poverty threshold (L3841).
- Multidimensional poverty: "also a source of climate vulnerability"; same deficits decide whether a hazard becomes a welfare shock (L3847). No formal index in this chapter.
- Hazardous air pollution: annual mean outdoor PM2.5 above 35 micrograms/m3 (WHO threshold per report); high water risk: above high-risk threshold of WRI Aqueduct index; land degradation: net primary productivity falling 1980-2022 for reasons other than temperature or rain (L3960).
- GHG emissions: from energy, industry, agriculture; LULUCF shown separately because variable and can be sink or source (L3970).
- Decoupling: weakening link between economic growth and GHG emissions; relative decoupling = emissions grow slower than GDP (L4006). Not automatic.
- Key ecosystems: forests, wetlands, mangroves, coral reefs, savannas, others; baseline 7,860 m hectares in 2000, about 60% of land; indicator "currently being updated" (L4122). Captures area, not quality (L4333).
- Renewable natural capital: living ecosystem components; over 30% of total wealth in low and lower-middle-income economies (L4178).
- Food and nutrition insecurity (moderate or severe): living in a household where at least one adult has a low-quality diet or cuts normal quantity for lack of resources (L4190). Prevalence of undernourishment is a complementary measure (L4194).
- WASH ladder: basic water = improved source, 30-minute round trip; basic sanitation = improved, unshared; basic hygiene = handwashing facility with soap and water at home; safely managed water = on premises, available when needed, free of fecal and priority chemical contamination (L4254, notes L4342).
- Benefit-cost ratio (Fig 3.7): people exiting poverty by 2100 in an economy if GDP grows 1% in 2026, divided by people worldwide falling into poverty by 2100 from emissions of that growth (L4116).

## 5. Lay-reader questions
- Is it true South Asia is the most heat-exposed region, and what does "exposed" actually mean?
- How can 88% of South Asians be "exposed" yet under 20% be "at risk"?
- Does India fall in the group (lower-middle income) with the highest exposure, 73%?
- If most vulnerable people are above the poverty line, is my family at risk even if we are not poor?
- Why does lack of social protection matter more than low income for climate risk?
- India is one of the six biggest emitters; is that fair given how poor many Indians are?
- Does growing India's economy have to mean more emissions?
- Is India's growth "decoupling" from emissions, and is it enough?
- Will ending poverty make climate change worse?
- Did hunger really fall in South Asia, and by how much?
- How many Indians lack safe drinking water and a toilet, and how do rural and urban compare? (report gives only regional charts)
- How bad is air pollution for the poor versus the rich?
- What does the El Nino year mean for food prices at home?
- Why can poorer people suffer more indoors than outdoors from pollution?

## 6. Related indicators to pull (for India cuts)
- World Bank "Counting People at High Risk from Climate-Related Hazards" dataset (worldbank.github.io/counting-people-climate-risk; Doan et al. 2023): country exposure, vulnerability, high-risk shares, may give India directly [no WDI code given].
- World Bank Net GHG Emissions, Data360 WB_CSC_RES_GHG_EMS_YEAR (L4422); EDGAR (Crippa et al. 2025); WDI used for per capita and per GDP emissions (L4002).
- FAO/SOFI 2026: moderate-severe food insecurity, undernourishment, cost/affordability of healthy diet by country.
- JMP 2025: country WASH ladder, rural/urban, incl. India (no codes given).
- Global Nature Watch / WRI tree cover loss.
- Aqueduct 4.0 water risk, Shen et al. 2024 PM2.5, Bai et al. 2025 land degradation (via Damania et al. 2025).
- Hallegatte et al. 2026 benefit-cost ratios (country data behind Fig 3.7).
- Stunting and wasting (UNICEF/WHO/World Bank joint estimates; no WDI code shown).
- PIP poverty rates to pair with exposure (Chapter 1).

## 7. Literature the report leans on
- Doan, Hill, Hallegatte et al. 2023, "Counting People Exposed to, Vulnerable to, or at High Risk from Climate Shocks: A Methodology", PRWP 10619.
- Brunckhorst, Gorgulu, Hallegatte, Naikal, Nguyen 2026, "Who Is Most at Risk?" (blog).
- Damania, Ebadi, Mayr, Russ, Zaveri 2025, Reboot Development: The Economics of a Livable Planet.
- Hallegatte, Mahler, Decerf 2026, "The Poverty Cost of Greenhouse Gas Emissions".
- Wollburg, Hallegatte, Mahler 2023, "Ending Extreme Poverty Has a Negligible Impact on Global Greenhouse Gas Emissions", Nature.
- Crippa et al. 2025, GHG Emissions of All World Countries 2025 (JRC).
- Chepeliev et al., "Decoupling Economic Growth from Environmental Degradation" (Ecological Economics; the md shows 2027, probably 2026 [check PDF]).
- FAO et al. 2026, State of Food Security and Nutrition in the World 2026; JMP 2025.
- Rentschler and Leonova 2023, "Global Air Pollution Exposure and Poverty"; Behrer and Heft-Neal 2024; Jack and Ryan 2026.
- WRI 2025 (forest loss); Noack et al. 2019 (droughts, forests, rural incomes).

---

## Part D digest: Chapter 4 "Tackling Poverty and Vulnerability Requires More Jobs and Better-Paying Jobs" + annexes 4A-4F
Source: pppr-2026-full-report.liteparse.md lines 4440-5900 (cited as "L" + line). PDF page numbers not available in the conversion.
Lines are the md's own line numbers. Poverty lines are $3.00 and $8.30 a person a day (2021 PPP) unless stated. Data: Global Monitoring Database (GMD, version Sept 2026), 2003-24, 130+ economies.

## 1. The argument (in order)
- Labor income is the main income of the poor: close to two-thirds of household income among the poorest 40% (measured only for Latin America and the Caribbean; lower bound). Human capital is often their only asset. So poverty reduction "runs through the labor market" (L4440, L4536).
- Two margins: how much the poor work (employment) and how much they earn per worker. The chapter's message: both are needed (L4466).
- Decomposition 2003-24: growth in earnings per worker explains almost all welfare growth in every quintile. Employment contributed little and was negative for the bottom three quintiles (L4484, Fig 4.1).
- The poor work almost as much as the nonpoor: employment 58-61% of working-age adults (15-64) vs about 67% for the nonpoor. The real gap is dependants: about 110 vs about 38 per 100 working-age adults (L4550).
- The employment gap depends on country income: small or absent in low-income economies, wide in rich ones; the poor outside work are mostly out of the labor force, not unemployed (L4596, note 9).
- Barriers: gender is key. Female employment is U-shaped across the global distribution; the gap is widest around the 20th-40th percentiles (L4644).
- Employment among the poor fell in 88 of 138 economies, 2003-24. Not explained by schooling (annex 4F). Possible reasons (untested): composition, uneven structural transformation, technology, gender constraints (L4706-4742).
- Simulation 1 (employment): raise employment in poor households to 75% of working-age adults. Poverty falls about a fifth. Almost all of it comes via women (L4746-4816).
- Even then, the average poor person would need earnings up about 91% ($3.00) or 133% ($8.30) to cross the line. So earnings are the binding constraint at the bottom (L4826).
- Hours/underemployment (Box 4.1): the poor work slightly fewer hours, which signals underemployment, not preference. This blurs "more jobs" vs "better jobs".
- Why earnings are low: low schooling, concentration in agriculture/self-employment, lower returns in poorer economies (L4891-4899).
- Simulations 2-4 (earnings): education, self-employment to wage work, agriculture to nonagriculture. Education cuts extreme poverty most (L4945).
- Incidence: earnings gains concentrate on the poorest; employment gains on the near-poor, many of them women out of work (Fig 4.10, L5021). Box 4.2 on women's double disadvantage.
- Panel data, 41 economies: a rise in wage work pays off much less in poor economies; self-employment protects against falling into poverty; the "job ladder" is not universal (L5037-5119).
- Close: more jobs and better jobs are not competing strategies; AI exposure is lower in poor economies but unsettled; progress will be counted in cohorts and generations (L5125-5135).

## 2. Every India mention (only three in the whole range; no India-specific figure, table or box)
1. L4542 (text on income sources of the poor): "In rural India, the lowest quintile draws more than a quarter of its income from agricultural wage labor, the lowest return form of work, a share that falls to 2 percent at the top (Haggblade et al. 2010)." Measure: share of rural income, lowest vs top quintile; no year given in the chapter; source is a literature review of rural nonfarm income, not the GMD.
2. L4698 (gender, U-shape): many countries "particularly in the Middle East and South Asia, sit well below the curve and do not demonstrate a U-pattern in the country development path over time (Gaddis and Klasen 2014)". Context: female participation vs development; relationship "correlational rather than causal".
3. L5037 (panel evidence): panels in 41 economies "across East Asia, Europe, Latin America, South Asia, and Sub-Saharan Africa", windows of 2-7 years (Bussolo, Torre, et al. 2026). Note 17 (L5878): 10 low/lower-middle, 8 upper-middle, 23 high-income (all European) economies; ~4.3 billion people (52.9% of world population). India is not named as a panel country [check PDF].
Related, not naming India: L4742 cites Deshpande and Singh 2024 for women's participation falling as capital-intensive services create few jobs for women leaving contracting agriculture (the title/country is not visible in this chunk; check the reference list). L4506 etc: GMD figures give no country lists in the md. Country scatter plots (Fig 4.5, 4D, 4C) have unlabelled dots [check PDF for whether India is labelled]. Caution: the chapter gives NO India rate for any of its headline measures.
Why this matters: India sits in the lower-middle-income group, the zone where the report says (a) the poor-nonpoor employment gap is small (59.2% vs 57.9% at $3.00), (b) the female employment gap is widest, and (c) wage work lifts households least. These are group statements, not India figures.

## 3. Global findings that frame India (reference in brackets)
- Labor income close to two-thirds of income of the poorest 40% (Latin America only measured; lower bound; pensions counted as nonlabor) [L4536].
- Capital income under 3% of income across 18 Latin American countries; about 1% in poorest decile in South Africa [L4536].
- Welfare growth 2003-24, average annual, bottom quintile: earnings per worker +3.57 pp, employment -0.51 pp, working-age share -0.31 [Fig 4.1, L4512-4520; jumbled, check PDF]. Quintile 2: 3.52 and -0.42 pp. Quintile 3: 3.36 and -0.13. Quintile 4: 3.08 and -0.05. Top: 0.85, -0.01 [mapping of numbers to bars: check PDF].
- Employment rate of working-age adults, 2024: extreme poor (<$3.00) 60.8%; $3.00-4.20: 58.3%; $4.20-8.30: 58.8%; nonpoor about 67% [L4550, L4706, Fig 4.2a].
- Dependency ratio (under 15 plus 65+, per 100 aged 15-64): about 110 poorest vs about 38 richest [L4550].
- Low-income economies ($3.00 line): poor employed 67.7% vs nonpoor 68.1%; lower-middle: 59.2% vs 57.9%; upper-middle: extreme poor 36.5% vs about 66%; high: 26.5% vs about 70% [L4596].
- Out of labor force among the poor: about 30% in low-income to 65% in high-income economies. Measured unemployment only 3-4%, similar across poverty groups [L4596, note 9].
- Female employment is U-shaped; gap widest around 20th-40th percentile; male rates flat [L4644].
- Employment among the $8.30 poor fell 2003-24 in 88 of 138 economies; grew less or fell more than among the nonpoor in 99 of 137. Age 25-64 only: 90 of 136 [L4706, L5823].
- Employment rate of the poor "barely changed" over two decades; changes cluster near zero [L4742, L5135].
- 75% employment benchmark: poverty at $3.00 10.8% to 8.6%; at $8.30 51.3% to 42.0%. Poverty gap and percent poverty gap fall by similar or larger proportions [L4746, Fig 4.6].
- Women only: $3.00 10.8% to 8.5%; $8.30 51.3% to 40.8%. Men only: 10.8% to 10.4%; 51.3% to 49.8% [L4816].
- Country pattern: biggest drops (20-25 pp) in countries with moderate poverty (about 30-55% at $3.00; 40-70% at $8.30); small where poverty is low or very deep [L4810, L5348].
- Residual: after employment simulation, average poor person needs +91% ($3.00) / +133% ($8.30) earnings [L4826].
- Hours: poor workers work slightly fewer hours than nonpoor among wage workers and self-employed, strongest in low-income economies ($3.00 line) [Box 4.1, L4844].
- Poor vs nonpoor profile ($3.00 line): primary education only 61% vs 25%; self-employment 79% vs 35%; agriculture 66% vs 20%. At $8.30: 43% vs 15%; 59% vs 24%; 43% vs 9% [L4899]. Fig 4.7 numbers jumbled [check PDF].
- Within-country fact: poor are less educated, more self-employed, more in agriculture in nearly every economy; welfare per worker is higher with schooling, in wage work, outside agriculture [L4933].
- Smallholders in Ethiopia, Nigeria, Tanzania, Uganda (<5 ha): about 58% farm with <half sold; 14% market-oriented; 25% earn mostly off-farm; 67% of the poorest quintile in the first group [L4933].
- Predicted earnings gains: education to nonpoor average about +40%; self-employment to wage about +16%; agriculture to nonagriculture about +36% (upper bounds) [L4945, L5696].
- Poverty-rate cuts at $3.00: education -45% (10.7% to 5.9%); wage work -21%; leave agriculture -18%. At $8.30: education -20% (52.9% to 42.2%); wage -10%; leave agriculture -7% [L4945].
- Smallholder farming employs two-thirds of the extreme poor who work [L4991]. Agricultural productivity growth reduced poverty among the poorest more than growth elsewhere (Christiaensen et al. 2011).
- Earnings gains exceed 50% at the poorest percentiles; employment gains about 30-40% for treated households, hump peaking near 40th percentile at $8.30 [L5001-5021, L5730].
- Poor women vs poor men near $3.00: 15-20 pp less likely to hold a wage job; about 10 pp more likely in agriculture [L5027, L5602].
- Panel evidence: +10 pp household share in wage work raises chance of escaping poverty by 2.4 pp (upper-middle), 2.2 pp (high), 0.8 pp (low and lower-middle); nonwage +0.5 pp in low/lower-middle [L5037].
- Poor households' wage share rise: +3.4 pp (low/lower-middle), +5.4 (upper-middle), +7.7 pp (high); in poor economies movement is sideways (agriculture -2.2, nonemployment -2.2) [L5081].
- Nonagricultural self-employment protects against falling into poverty in every income group [L5119].
- Generative AI exposure: about 4.5% of jobs in low/middle-income vs 14.2% in high-income economies [L5131].
- Poor at $8.30 are "about half the world population"; about a tenth below $3.00 [L4470, L5444].

## 4. Concepts the report defines
- Employment rate: share of working-age (15-64) in work. Employed = worked at least 1 hour in reference period (usually 7 days), formal or informal, including household enterprise and subsistence farming (earlier ILO standard, 13th ICLS) [Box 4A.1, L5270, L5296]. Caveat: newer 19th ICLS counts only work for pay or profit; changes between surveys may be definitional.
- Unemployed / not in labor force: unemployed = seeking work; not in labor force = neither working nor seeking [L5270].
- Wage worker = employee regardless of formality; self-employed = own business or another household member's enterprise, typically no regular paycheck (chapter's "self-employment and others") [L5274].
- Welfare per worker used as proxy for earnings per worker (household consumption or income divided by number of workers). Bundles price per hour and hours; also bundles labor and nonlabor income [note 4, L5855; L5696]. Cannot separate wage from hours.
- Dependency ratio [Fig 4.2 note].
- Extensive vs intensive margin: whether vs how many hours (Box 4.1). Time-related underemployment (ILO 2013): working but wanting and available for more hours [L4875].
- Poverty rate (H), poverty gap (PG: average shortfall as fraction of line, times H), percent poverty gap (PPG = H x average percent increase needed to reach line; same idea as Prosperity Gap/related to Watts index; not FGT2) [Annex 4B, L5300-5322].
- Global welfare percentiles: people ranked by per capita consumption/income against one global distribution (218 economies, 1,000 bins) [L5184].
- Employment simulation: assigns non-working adults (20-64) to work at the household's own welfare per worker until 75% rate. Accounting exercise: no wage change, no displacement, upper bound; households with missing status untreated so underestimates; favorable for women since they are credited with men's earnings [L4746, notes 3, 10, 12].
- Earnings simulations: Mincer regressions; predicted earnings of a poor worker on destination terms; education switch uses one equation. Premiums are upper bounds: majority-sector allocation, association not causation, selection in destination [L5696, Annex 4D]. Describe where gains lie, not how fast or by what policy [L4991, note 3].
- Growth incidence curve (Ravallion-Chen 2003): proportional welfare gain at each percentile; anonymous (compares ranks, not households); gains above the line reflect reranking [Annex 4E, note 16].
- Job ladder: ranking of work types by average earnings (wage above self-employment, nonagriculture above agriculture); panel evidence says not universal [note 18].
- Panel 41 economies: poverty measured against line for each economy's income group ($3.00 low, $4.20 lower-middle, $8.30 upper-middle, $29.40 high) [note 17].
- Coverage: 150 economies, reference years 2003, 2013, 2024; 95.4-96.0% of global population; harmonized labor info coverage rose from ~70% to >90% [Table 4A.1, L5168]. Survey recall periods differ (7-day vs 12-month); hours, earnings and job tenure less comparable than status [L5194].
- Human Capital Index Plus (HCI+): 0-325 scale; low-income about 116 vs high-income about 254 [note 27].

## 5. Lay-reader questions this part raises
1. If poor people work almost as much as everyone else, why are they poor?
2. Do poor Indians work fewer hours, or do they just not find enough work (underemployment)?
3. Why does more work not help much when poor people earn so little per worker?
4. Why do so many women in poor households not work, and what would change if they did?
5. Why has the share of the poor who work fallen even as poverty fell?
6. Is a wage job really better than running your own small business or farm?
7. Would more schooling lift people out of poverty faster than more jobs? How long would it take?
8. Why does the same new wage job help a family in a poor country less than in a rich one?
9. What protects a family from slipping back into poverty, and is it the same as what lifts it out?
10. Why are poor people so often in farming, and is leaving agriculture the answer?
11. Can raising farm productivity help the poorest faster than waiting for factory or service jobs?
12. Will AI take jobs from the poor or help them?
13. What is a "poverty gap" and why does it matter if the headcount does not move?
14. Why does the female employment curve dip for lower-middle-income families?
15. Does the fall in poor people's employment just mean children are staying in school longer? (Report: no.)

## 6. Related indicators to pull
- GMD (Global Monitoring Database, internal; no public code given in chapter) and Poverty and Inequality Platform (PIP; pip.worldbank.org): India poverty rate, gap, welfare at $3.00 and $8.30 (2021 PPP).
- India employment rate by poverty status; female employment by percentile; share in agriculture / self-employment / only-primary-education among poor vs nonpoor (the Fig 4.2, 4.4, 4.7, 4D series) [the report gives no India values; requires microdata].
- World Bank 1000 Binned Global Distribution dataset (datacatalog.worldbank.org, dataset 0064304) [L5887].
- Human Capital Index Plus (humancapital.worldbank.org/hciplus) for India score [note 27].
- ILO: time-related underemployment (ILO 2013 definition), labor force participation by sex, employment status and sector shares, hours worked (ILOSTAT; codes not given in chapter).
- UN World Population Prospects (dependency ratios, working-age shares) [note 25].
- ISIC Rev. 4 for sector mapping [note 24]. LIS database (high-income supplement; irrelevant to India) [note 23].
- Childhood stunting by wealth quintile (twofold to sevenfold gap, annex 4D, L5462).

## 7. Literature the report leans on (max 10)
- Bandiera, Elsayed, Heil, Smurra 2022. "Presidential Address 2022: Economic Development and the Organisation of Labour, Evidence from the Jobs of the World Project." JEEA.
- Inchauste et al. 2014 (earnings, not employment, drove poverty fall) [note 5].
- Bussolo, Lakner, et al. 2026 and Bussolo, Torre, et al. 2026 (global profiling; 41-economy panels).
- Bick, Fuchs-Schundeln, Lagakos 2018. "How Do Hours Worked Vary with Income?" AER.
- Breza and Kaur 2025; Breza et al. 2021; Margolis 2014 (self-employment as rationing or residual).
- Donovan et al. 2023 (cycling between marginal employment and nonemployment).
- Fields et al. 2023 (job ladder); Fields 2011.
- Banerjee and Duflo 2007. "The Economic Lives of the Poor." JEP.
- Gaddis and Klasen 2014; Klasen 2019; Goldin 1994 (female participation U-shape).
- Haggblade et al. 2010; Christiaensen et al. 2011; Ravallion and Chen 2003; Kraay et al. 2023 (Prosperity Gap).
