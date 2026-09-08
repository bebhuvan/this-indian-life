#!/usr/bin/env python3
"""Assemble data/explanations/en/q.econ.fdi_development.json by hand.

The generator is normally what writes this file, but the DeepSeek account has no
balance, so the prose here is hand-written against the same evidence packet the
generator would have used. Every figure traces to a locked number.
"""
import json, datetime, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ev = json.load(open(ROOT / "data/explanations/en/q.econ.fdi_development.evidence.json"))

SECTIONS = [
    "How much of India did foreigners actually pay for?",
    "Where does India sit among the developing regions, over fifty-six years?",
    "Did India climb at all?",
    "Is there more than one way to build a country?",
    "Is India unusual in its own neighbourhood?",
    "What does all of it add up to, per Indian?",
    "When the factories left China, where did they go?",
    "Is India gaining on its actual competitors?",
    "How much of the economy do foreigners own?",
    "Did that money build anything, or just buy it?",
    "Why do the announcements not match the arrivals?",
    "Which era actually worked?",
    "Do Indian firms build abroad?",
    "What does it mean that India now invests abroad too?",
    "Where are the Indian multinationals?",
    "How to read these numbers: methodology and caveats",
]
CHART_IDS = [c["chartId"] for c in ev["plannedCharts"]]
CHART_TITLES = [c["title"] for c in ev["plannedCharts"]]
assert len(CHART_IDS) == 15, len(CHART_IDS)

# The prose lives in data/prose/<questionId>.md so it can be edited as markdown rather
# than as a Python string. It must start directly with an H2: any text before the first
# heading becomes a section headed by article.title, which has no sectionVisualMap entry
# and therefore steals a chart via the token-overlap fallback in bindSectionVisuals.
BODY = (ROOT / "data/prose/q.econ.fdi_development.md").read_text().strip()

def slug(v):
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", v.lower()))


# --- integrity checks on the prose itself -------------------------------------
heads = re.findall(r"^## (.+)$", BODY, re.M)
assert heads == SECTIONS, f"heading mismatch:\n{heads}\nvs\n{SECTIONS}"
assert "—" not in BODY, "em-dash in body"
assert BODY.startswith("## "), "body must open with an H2"
assert BODY.count("\n## ") == len(SECTIONS) - 1, "heading/paragraph structure broken"

# Keyed by chartId, not by list position. An earlier version kept these in a plain
# list and an off-by-index insert silently attached each explainer to the wrong
# chart from position 9 onward; INDICA_CARD_LINT caught it. Assemble by id.
CHART_EXPLAINERS_BY_ID = {
    "how-much-of-what-india-builds-is-paid-for-by-foreigners":
{
        "takeaway": "Foreign investment financed 3.1 per cent of India's capital formation in 2025. It has never passed 10.3 per cent, and did that once, in 2008.",
        "detail": "The line is inward foreign direct investment divided by gross fixed capital formation, which is the money India spends in a year on factories, machines, roads and buildings. It sits near zero through the 1990s, climbs through the 2000s to a single peak of 10.3 per cent in 2008, reaches 8.3 per cent in 2020, and falls back to 3.1 per cent in 2025. The shape matters more than any one year: there is no period in the record where foreign capital was financing a large share of what India built.",
        "whyShowThis": "It converts the headline dollar figure into the ratio that actually answers the article's question, and it is the one chart the rest of the piece leans on.",
        "howToRead": "Read the vertical axis as a share of everything India invested that year, not as a growth rate. Higher means more of India's building was paid for from abroad.",
        "mistakeToAvoid": "Do not read a falling line as foreign investment shrinking. The denominator grows too, so the share can fall in a year when dollar inflows rise.",
        "mobileNote": "One line, so label the 2008 and 2020 peaks directly and keep only a few year ticks.",
    },
    "fifty-six-years-and-india-is-almost-always-the-bottom-line":
{
        "takeaway": "Across fifty-six years India has never once taken in a larger share of GDP than Latin America, and has beaten East Asia in three years.",
        "detail": "This is the World Bank's measure of foreign investment against GDP, an independent compilation from the UNCTAD data used elsewhere on this page, and it reaches back to 1970. India runs along the bottom for most of the period, below 0.09 per cent of GDP throughout the 1970s and 1980s and negative in 1975, 1976 and 1977. The regional lines show what the alternative looked like at the same moment. India exceeded Sub-Saharan Africa in five of the fifty-five years they can be compared, and East Asia and the Pacific in three of fifty-six.",
        "whyShowThis": "It supplies the two decades before liberalisation that UNCTAD's series cannot reach, and it checks the India story against a second source.",
        "howToRead": "Compare the vertical position of the India line against the regional lines in any given year. The zero line matters: below it, more foreign capital left than arrived.",
        "mistakeToAvoid": "Do not treat the regional aggregates as averages of comparable countries. Each is dominated by a few large recipients, and the Latin America line in particular reflects a handful of economies.",
        "mobileNote": "Five lines is the ceiling on a phone. Keep India emphasised and label the lines at their right-hand ends.",
    },
    "india-did-climb-and-the-climb-was-real":
{
        "takeaway": "India went from 43rd in the world in 1990 to 7th in 2020, fell to 16th in 2023, and was 12th in 2025.",
        "detail": "Rank is taken among the 170 to 203 individual economies that report an inward flow in a given year, with regional and grouping aggregates excluded. India was behind Pakistan, Saudi Arabia, Colombia and the Philippines in 1990. The 2008 and 2009 jump to 9th is partly other people's collapse rather than India's surge, which is worth knowing before reading it as an achievement. The 2020 peak at 7th put India just behind Germany and ahead of the United Kingdom, Brazil, Mexico and Canada.",
        "whyShowThis": "The rise is genuine and has to be established before the article qualifies it. Leaving it out would be dishonest.",
        "howToRead": "The axis is inverted so that up means climbing. Rank 1 is the largest recipient in the world.",
        "mistakeToAvoid": "A rank improvement can come from other countries falling rather than India rising, which is exactly what happened in 2009 and again in 2020.",
        "mobileNote": "Invert the axis clearly and annotate 1990, 2020 and 2025 so the arc survives a small screen.",
    },
    "two-different-ways-to-build-a-country":
{
        "takeaway": "Viet Nam has financed 13.8 per cent or more of its capital formation with foreign money every year since 2011. India averaged 4.9 per cent over the same years, nearer Korea's 2.6 than Viet Nam's 15.0.",
        "detail": "Two development models sit on one axis. Viet Nam and Poland represent the foreign-investment-led path, where outside firms bring the plant, the technology and the export customer. China after 2010, Korea and India represent the domestic-capital path. Averaged over 2011 to 2025 the shares are Viet Nam 15.0 per cent, Poland 15.4 per cent, India 4.9 per cent, Korea 2.6 per cent and China 2.5 per cent. India's position is not unusual in world terms. It is unusual relative to what Indian policy has spent thirty years trying to achieve.",
        "whyShowThis": "It reframes a number that looks like failure into a choice between two documented development strategies, one of which Korea made deliberately.",
        "howToRead": "Each line is that country's own capital formation financed from abroad, so the countries are directly comparable despite being very different sizes.",
        "mistakeToAvoid": "Do not read a low share as a policy failure by itself. Korea's low share was deliberate and Korea developed anyway. What the chart shows is which model a country is in, not whether it is winning.",
        "mobileNote": "Poland's single-deal spikes are noisy on a small screen. Keep India and Viet Nam emphasised and let the rest recede.",
    },
    "india-is-the-south-asian-norm-not-the-exception":
{
        "takeaway": "Pakistan has financed a larger share of its capital formation from abroad than India in 23 of the last 36 years, and in each of the last three.",
        "detail": "Averaged over 2011 to 2025, foreign investment financed 4.9 per cent of India's capital formation, 4.6 per cent of Pakistan's, 3.9 per cent of Sri Lanka's and 2.2 per cent of Bangladesh's. India leads that list narrowly and the ordering is unstable: Sri Lanka has beaten India in 22 of 36 years including the last four. In 2024 the figures were India 2.2 per cent, Sri Lanka 4.0 and Pakistan 6.2. The neighbours are the fair test of whether India's low share is an Indian failure or a regional pattern, because they share the geography, the administrative inheritance and much of the political economy.",
        "whyShowThis": "It answers the most common objection to this article, which is that a low share is just what a large, poor, high-saving economy looks like.",
        "howToRead": "Each line is that country's own capital formation financed from abroad, so countries of very different sizes are directly comparable.",
        "mistakeToAvoid": "Do not read this as Pakistan out-competing India for factories. Pakistan and Sri Lanka have small capital formation and spent part of this period in balance-of-payments crises that shrank the denominator. Pakistan's 6.2 per cent in 2024 is $2.7bn against India's $27.1bn.",
        "mobileNote": "Four lines that cross often. Keep India emphasised and label at the right edge.",
    },
    "thirty-six-years-of-foreign-investment-per-indian":
{
        "takeaway": "India has received about $547 of foreign investment per person since 1990. China is around $2,243 and Viet Nam $2,652.",
        "detail": "Every dollar of inward foreign direct investment from 1990 to 2025, divided by 2025 population. India's $800 billion total ranks 16th in the world and looks substantial until it is spread across 1.46 billion people. Thailand is at $3,319 and Malaysia at $7,127. Sri Lanka, at $813, is ahead of India despite a civil war and a sovereign default inside the period. Only Nigeria, Pakistan and Bangladesh sit below India here.",
        "whyShowThis": "It is the scale correction the dollar figures need. India's totals look large mainly because India is large.",
        "howToRead": "The scale is logarithmic, so each gridline is ten times the one before. Bar lengths compare orders of magnitude, not simple ratios.",
        "mistakeToAvoid": "This divides thirty-six years of flows by one year's population, so it is a sense of scale and not a precise per-person figure. Singapore and Ireland lead partly because money is booked there rather than invested there.",
        "mobileNote": "Keep the log gridlines labelled in dollars and place value labels outside the bars so short bars stay readable.",
    },
    "where-the-factories-actually-went":
{
        "takeaway": "Southeast Asia's annual foreign investment rose about 73 per cent between 2013 to 2017 and 2021 to 2025. India's fell about 2 per cent.",
        "detail": "China's share of foreign investment into developing economies halved between 2020 and 2025, from 23.7 per cent to 11.6 per cent, as firms moved production out. Southeast Asia's annual average went from $126 billion to $219 billion across the two comparison windows. India's went from $38.2 billion to $37.6 billion, which is slightly lower before adjusting for anything at all. In 2015 Southeast Asia received 2.6 times India's inflow; by 2025 it received 6.3 times.",
        "whyShowThis": "The China-plus-one reallocation is the single event that could have changed India's position, and the data shows where it actually landed.",
        "howToRead": "Compare the gap between the Southeast Asia line and the India line at the left and right ends of the chart, rather than reading any single year.",
        "mistakeToAvoid": "The chart shows where the money went, not why. It settles nothing about land, labour law, tariffs or clearances. UNCTAD's Southeast Asia aggregate also includes Singapore, where much of the inflow is booked rather than built.",
        "mobileNote": "Three lines with wide separation, so direct labels work. Anchor the axis at zero.",
    },
    "india-s-slice-of-the-developing-world-s-investment":
{
        "takeaway": "India's share of all foreign investment going to developing economies fell from 6.0 per cent in 2015 to 4.3 per cent in 2025.",
        "detail": "The share rose above 10 per cent in 2020, which reads as a breakthrough but was mostly the rest of the developing world stopping during the pandemic while India's large Jio-era deals went through. It has been below that level in every year since, and the 2025 figure of 4.3 per cent is below where the decade started. The denominator excludes Caribbean financial centres and special-purpose entities, so this is a comparison against real destinations rather than routing hubs.",
        "whyShowThis": "Share of the developing world is the competitive measure. Share of the world mixes in rich-country flows India is not competing for.",
        "howToRead": "This is India's slice of a pie that itself grows and shrinks, so a falling line means losing ground relative to other developing economies specifically.",
        "mistakeToAvoid": "Do not read the 2020 spike as a policy success. It is mostly a denominator effect from a year when global investment collapsed.",
        "mobileNote": "A single line with a clear spike. Annotate 2020 so the pandemic distortion is not misread.",
    },
    "how-much-of-the-economy-foreigners-actually-own":
{
        "takeaway": "Foreign investors own the equivalent of 13.5 per cent of India's GDP. In Viet Nam the figure is 55.1 per cent and in Thailand 66.5 per cent.",
        "detail": "Accumulated inward foreign direct investment stock as a share of GDP in 2025. This is what three decades of policy actually produced, and it moves too slowly to be cherry-picked. India at 13.5 per cent sits below China at 19.3 per cent, Indonesia at 23.8 per cent, Poland at 40.6 per cent and Brazil at 50.7 per cent. Only Bangladesh, at 4.3 per cent, is lower among the economies shown.",
        "whyShowThis": "Annual flows are volatile and easy to argue about. The accumulated stock is the durable answer to how much of India foreigners actually own.",
        "howToRead": "Read this as ownership rather than as a league table. A low figure means productive assets are held domestically.",
        "mistakeToAvoid": "Stock is recorded at book value rather than market value, and the 2025 figures are preliminary. Treat the ordering as solid and the exact levels as approximate.",
        "mobileNote": "Bars sorted high to low with India highlighted; values outside the bars.",
    },
    "building-something-new-or-buying-something-old":
{
        "takeaway": "In 2018 foreign firms bought $33.6bn of Indian companies against $42.2bn of recorded FDI. In 2024 and 2025 they were net sellers.",
        "detail": "Foreign investment either builds new capacity or buys capacity that already exists, and only the first adds to capital formation. UNCTAD tracks acquisitions separately. The 2018 spike is Walmart buying Flipkart; 2020's $21.8bn sits inside that year's $64.1bn headline peak. Then the line turns negative: minus $1.4bn in 2024 and minus $3.3bn in 2025, meaning foreign firms sold more Indian assets than they bought in each of the two years that produced the celebrated 44 per cent rebound.",
        "whyShowThis": "For an article asking whether foreign money built India, the difference between building a plant and buying a company is the question itself.",
        "howToRead": "Compare the shape of the two lines, particularly where the acquisition line spikes or drops below zero.",
        "mistakeToAvoid": "Never subtract one line from the other. Deal values and balance-of-payments flows come from different sources on different timing conventions, an acquisition can be financed in ways that never appear as FDI, and the M&A line is not a component of the FDI line.",
        "mobileNote": "Two lines with a zero rule that has to stay visible, because crossing it is the point.",
    },
    "what-gets-announced-and-what-turns-up":
{
        "takeaway": "India announced a record $111.1 billion of greenfield projects in 2024, the same year it recorded its smallest inflow in a decade at $27.1 billion.",
        "detail": "Announced greenfield project value against foreign investment actually recorded in the balance of payments, from 2003. The two lines track loosely for most of the period and separate sharply after 2022. Announcements were $89.5 billion in 2023, $111.1 billion in 2024 and $74.1 billion in 2025, against recorded flows of $28.1 billion, $27.1 billion and $38.9 billion. The announcement number is the one that tends to get reported.",
        "whyShowThis": "The gap between what is promised and what arrives is the clearest available check on how much of the investment story is real.",
        "howToRead": "Compare the direction of the two lines rather than the distance between them at any point.",
        "mistakeToAvoid": "Never subtract one line from the other. They are different concepts on different clocks: an announcement is an intention that may be built over several later years or abandoned, and it comes from a commercial project database rather than official statistics.",
        "mobileNote": "Two lines only, labelled directly, with 2024 annotated as the crossing point of the story.",
    },
    "india-s-fdi-era-by-era":
{
        "takeaway": "The 2015 to 2020 stretch was India's strongest: $285 billion received, financing an average 6.3 per cent of capital formation.",
        "detail": "Five policy eras with what each brought in and what share of India's building it paid for. The 1991 to 2000 reform decade brought $18.5 billion at an average 1.8 per cent. The 2001 to 2008 boom brought $122 billion at 4.7 per cent, and 2009 to 2014 brought $186 billion at 5.1 per cent. The 2015 to 2020 period is the peak on both measures. The most recent era, 2021 to 2025, brought $188 billion at 3.3 per cent.",
        "whyShowThis": "An article arguing that foreign money never built India has to be able to say which era came closest, and credit it.",
        "howToRead": "The bars are period totals, so longer periods have an advantage. The share column is the annual average within each era and is the fairer comparison.",
        "mistakeToAvoid": "Do not compare the bar lengths without checking the period lengths. 2001 to 2008 covers eight years and 2021 to 2025 covers five.",
        "mobileNote": "Era labels are long, so keep them on their own line above each bar.",
    },
    "indian-firms-announce-projects-abroad-too":
{
        "takeaway": "Indian firms announced $25.3bn of greenfield projects abroad in 2025, against $74.1bn announced into India.",
        "detail": "Roughly one dollar announced overseas for every three announced inward, from a country that spent decades purely as a destination. The outbound line peaked at $42.3bn in 2022. Both series are announcements rather than recorded money, and the outbound one carries an extra distortion: an Indian group building in the Gulf or in Africa may route the project through a holding company that makes it appear to originate elsewhere, and the reverse happens too.",
        "whyShowThis": "The maturity argument in the closing sections should be visible in project activity, not only in the accumulated stock.",
        "howToRead": "Read the gap between the two lines as a rough ratio rather than a difference, since both are intentions.",
        "mistakeToAvoid": "Do not treat either line as investment that happened. Announced projects are compiled from company statements and a share of them never get built.",
        "mobileNote": "Two lines, wide apart, direct labels at the right edge.",
    },
    "two-stakes-converging":
{
        "takeaway": "What foreigners own in India was 13.4 times what India owned abroad in 1990. In 2025 it is 1.9 times.",
        "detail": "Accumulated foreign direct investment stock in both directions, at book value. In 2025 foreign holdings in India come to $559 billion against $296 billion of Indian holdings overseas. The two lines have been converging since the mid-2000s, when Indian firms began buying abroad in earnest. This is the pattern Korea and Japan showed at a similar stage of development, and it is a sign of corporate maturity rather than distress.",
        "whyShowThis": "It closes the article on the accumulated position rather than on a single year, and it hands the reader to the separate article that explains the net-flow arithmetic.",
        "howToRead": "The ratio between the two lines is more reliable than either level, because book-value stock estimates are revised often.",
        "mistakeToAvoid": "Do not read the converging lines as capital flight. Outward investment is a maturing economy behaving normally, and some of it is holding-company structure rather than new factories abroad.",
        "mobileNote": "Two lines that converge; label both at the right edge where they are closest.",
    },
    "where-the-developing-world-s-biggest-firms-come-from":
{
        "takeaway": "China has 41 firms in the top 100 multinationals from developing economies. India has 4, and none in the world's top 100.",
        "detail": "UNCTAD ranks these firms by the assets they hold outside their home country. China has 41 of them. India has 4, level with Mexico: Tata Motors, Hindalco, ONGC and Bharti Airtel. On the separate world top 100, Korea has three companies and India none. Korea ran a low-foreign-investment, domestic-capital model and finished it with Samsung, Hyundai and LG.",
        "whyShowThis": "A country that hosts foreign capital without producing firms that invest abroad stays permanently on one side of the relationship. It is the other half of the low-FDI story.",
        "howToRead": "Bars are counts of firms, not company size. A country with two very large multinationals scores below one with five medium ones.",
        "mistakeToAvoid": "Ranking by foreign assets flatters heavy-asset businesses and undercounts software exporters, so India's services strength is under-represented here. The gap against China is too large to be explained by that alone.",
        "mobileNote": "Short bar list, India highlighted, counts outside the bars.",
    },
}
missing = [c for c in CHART_IDS if c not in CHART_EXPLAINERS_BY_ID]
assert not missing, f"no explainer for {missing}"
CHART_EXPLAINERS = [CHART_EXPLAINERS_BY_ID[c] for c in CHART_IDS]
assert len(CHART_EXPLAINERS) == 15, len(CHART_EXPLAINERS)

explainers = []
for i, e in enumerate(CHART_EXPLAINERS):
    explainers.append({"visualId": CHART_IDS[i], "title": CHART_TITLES[i], **e})

doc = {
    "schemaVersion": 1,
    "questionId": "q.econ.fdi_development",
    "status": "ready",
    "short": {
        "headline": "Foreign investment financed about 3 per cent of what India built last year, and it has never financed more than a tenth",
        "dek": "India received $38.9 billion of foreign direct investment in 2025 and climbed to twelfth in the world. Measured against everything the country actually built that year, it came to 3.1 per cent. The high-water mark, in 2008, was 10.3 per cent.",
        "body": "India has spent thirty-five years trying to attract foreign investment, and at its very best, across 2015 to 2020, foreign investment financed 6.3 per cent of the country's capital formation. Last year it was 3.1 per cent. Viet Nam runs at about 15 per cent. Per person, India has received roughly $547 since 1990, against China's $2,243 and Viet Nam's $2,652. When firms finally began moving production out of China after 2018, Southeast Asia's annual inflows rose about 73 per cent while India's fell about 2 per cent. None of this makes India a failure. It financed its own development out of its own savings, which is what Korea and Japan did. It does mean the number the policy debate watches was never the number that built the country.",
    },
    "macha": {
        "heading": "Okay bro, what does this actually mean?",
        "body": "Say you build a house for 100 rupees. Your uncle abroad chips in 3 rupees and you find the other 97 yourself. Later someone asks who built the house. The honest answer is that you did, and your uncle helped a little. That is India and foreign investment, every year, for thirty-five years. The 3 rupees went up to 10 once, in 2008, and came straight back down. Next door in Viet Nam the uncle is paying for 15 rupees of every 100, which is a genuinely different arrangement and a genuinely different house.",
        "soWhat": "When you see a headline about record FDI, ask what it is a share of. India's foreign investment numbers are big because India is big. Spread across 1.46 billion people, thirty-six years of it comes to about $547 each, which is less than Sri Lanka has managed.",
    },
    "article": {
        "title": "Did foreign money build India? What 56 years of FDI data show.",
        "standfirst": "India received $38.9 billion in foreign direct investment in 2025 and moved up to twelfth in the world. Set against everything the country built that year, it came to 3.1 per cent. UNCTAD has published that ratio since 1990 and it has never once passed 10.3 per cent.",
        "bodyMarkdown": BODY,
    },
    "chartExplainers": explainers,
    "sectionVisualMap": [
        {"heading": SECTIONS[i], "visualId": CHART_IDS[i]} for i in range(len(CHART_IDS))
    ],
    "sourceNotes": [
        {"label": "UN Trade and Development (UNCTAD), UNCTADstat: Foreign direct investment, inward and outward flows and stock, annual. The 1990 to 2025 panel for 293 economies, in current US dollars and as shares of world total, GDP and gross fixed capital formation. Updated 10 August 2026.",
         "url": "https://unctadstat.unctad.org/datacentre/dataviewer/US.FdiFlowsStock"},
        {"label": "UNCTAD, World Investment Report 2026: International Investment in a Turbulent Era. Annex table 01 was used to validate India's inflow series line by line, and annex table 14 supplied announced greenfield project values.",
         "url": "https://unctad.org/publication/world-investment-report-2026-international-investment-turbulent-era"},
        {"label": "World Bank, Foreign direct investment, net inflows as a share of GDP, indicator BX.KLT.DINV.WD.GD.ZS. Used for the 1970 to 2025 regional comparison, and as an independent check on the UNCTAD figures for India. Updated 13 July 2026.",
         "url": "https://data.worldbank.org/indicator/BX.KLT.DINV.WD.GD.ZS"},
        {"label": "UNCTADstat, Total and urban population, annual. Supplies the 2025 population denominators for the per-person comparison.",
         "url": "https://unctadstat.unctad.org/datacentre/dataviewer/US.PopTotal"},
    ],
    "furtherReading": [
        {"label": "Indica: Is foreign money really fleeing India? What FDI and FII numbers actually mean. The companion article, which explains the gross, repatriation and net arithmetic behind India's falling net FDI figure using RBI data.",
         "url": "/articles/foreign-investment/"},
        {"label": "UNCTAD, World Investment Report 2026 regional trends: Developing Asia. The chapter behind the Southeast Asia and India comparisons.",
         "url": "https://unctad.org/topic/investment/world-investment-report"},
    ],
    "caveats": [
        "Every figure here is UNCTAD's balance-of-payments measure of foreign direct investment: equity, plus reinvested earnings, plus intra-company loans, net of divestment and repatriation, on calendar years. It is not DPIIT's gross FDI equity inflows, which subtract nothing, run on fiscal years, and are therefore larger. The two are not interchangeable.",
        "A large share of investment into India is routed through Mauritius, Singapore and the Netherlands. Source-country attribution is a routing fact rather than a statement of economic ownership, and some of the money is Indian in origin.",
        "Announced greenfield project values come from a commercial project-tracking database, not official statistics. An announcement is an intention that may be built across several later years or abandoned, and it must never be subtracted from recorded balance-of-payments flows.",
        "Shares of GDP and of gross fixed capital formation depend on UNCTAD's own national accounts denominators, which are revised.",
        "The per-person comparison divides a thirty-six year cumulative flow by a single year's population. It is a sense of scale rather than a precise ratio. Singapore and Ireland rank high partly because investment is booked there rather than built there.",
        "UNCTAD's developing Southeast Asia aggregate includes Singapore, which flatters the level of the regional line although not its trend. Regional aggregates exclude Caribbean financial centres and special-purpose entities, so they will not match naive sums of country figures.",
        "Foreign direct investment stock is recorded at book value rather than market value and is revised often. The ratio between inward and outward stock is more reliable than either level.",
        "Outward investment by Indian firms is not all new overseas operations. Some reflects holding structures and redomiciling, which this dataset cannot separate.",
        "The 2025 figures are preliminary and will be revised in the World Investment Report 2027. Revisions are routine and real: the 2024 inflow was $27.6 billion in last year's report and is $27.1 billion in this one. Our earlier foreign-investment article was built on the older vintage, so a few of its figures differ slightly from the ones here.",
        "The World Bank and UNCTAD series rest on different compilations. They agree on India to within about a tenth of a percentage point in every year since 1990, but they are not mixed inside any single chart on this page.",
    ],
    "lockedNumbersUsed": [
        "FDI as a share of gross fixed capital formation, India, 2025 (3.1 per cent)",
        "FDI as a share of gross fixed capital formation, India, 2008 peak (10.3 per cent)",
        "FDI as a share of gross fixed capital formation, India, 2020 (8.3 per cent)",
        "FDI as a share of gross fixed capital formation, Viet Nam, 2025 (14.7 per cent)",
        "India inward FDI flow, 1990 ($237 million) and 2025 ($38.9 billion)",
        "India world rank for FDI received: 43rd (1990), 27th (2001), 9th (2008), 7th (2020), 16th (2023), 12th (2025)",
        "Cumulative FDI per person 1990 to 2025: India $547, China $2,243, Viet Nam $2,652, Thailand $3,319, Malaysia $7,127, Sri Lanka $813, Indonesia $1,214",
        "Annual average FDI, India: $38.2 billion (2013 to 2017) and $37.6 billion (2021 to 2025)",
        "Annual average FDI, developing Southeast Asia: $126 billion (2013 to 2017) and $219 billion (2021 to 2025)",
        "India's share of developing-economy FDI: 6.0 per cent (2015), 4.3 per cent (2025)",
        "China's share of developing-economy FDI: 23.7 per cent (2020), 11.6 per cent (2025)",
        "Inward FDI stock as a share of GDP, 2025: India 13.5, China 19.3, Viet Nam 55.1, Thailand 66.5, Malaysia 56.8, Brazil 50.7, Mexico 44.5, Poland 40.6, Indonesia 23.8, Bangladesh 4.3 per cent",
        "India announced greenfield project value: $89.5 billion (2023), $111.1 billion (2024), $74.1 billion (2025)",
        "India FDI by era, received and average share of capital formation: $18.5bn/1.8 per cent (1991 to 2000), $122bn/4.7 per cent (2001 to 2008), $186bn/5.1 per cent (2009 to 2014), $285bn/6.3 per cent (2015 to 2020), $188bn/3.3 per cent (2021 to 2025)",
        "India FDI stock, 2025: inward $559 billion, outward $296 billion; inward-to-outward ratio 13.4 (1990), 2.1 (2010), 1.9 (2025)",
        "World Bank FDI as a share of GDP, India: never above 0.09 per cent in the 1970s and 1980s, negative in 1975, 1976 and 1977",
    ],
    "qualityFlags": [],
    "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
    "model": "hand-written",
    "generationPasses": [{"name": "hand-written", "note": "Prose written by hand against the generator's evidence packet; the DeepSeek account had no balance. Every figure traces to a locked number and was recomputed from the source artifacts."}],
    "evidence": ev,
}

out = ROOT / "data/explanations/en/q.econ.fdi_development.json"
out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print("wrote", out)
print("body words:", len(BODY.split()))
print("sections:", len(heads), "| explainers:", len(explainers), "| map:", len(doc["sectionVisualMap"]))
