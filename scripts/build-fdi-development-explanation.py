#!/usr/bin/env python3
"""Assemble the FDI explanation from edited prose and a refreshed evidence packet."""
import json, datetime, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ev = json.load(open(ROOT / "data/explanations/en/q.econ.fdi_development.evidence.json"))

SECTIONS = [
    "How large was foreign investment beside India's own investment?",
    "Where does India sit among the developing regions, over fifty-six years?",
    "Did India climb at all?",
    "How does India compare with countries that drew more FDI?",
    "Is India unusual in its own neighbourhood?",
    "What does all of it add up to, per Indian?",
    "Did the shift toward Southeast Asia lift India's FDI?",
    "Is India gaining on its actual competitors?",
    "How large is India's accumulated FDI stock?",
    "What do the acquisition figures add?",
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
    "fdi-equalled-3-1-of-indian-fixed-investment-in-2025":
{
        "takeaway": "Inward FDI equalled 3.1 per cent of India's fixed investment in 2025. The ratio reached 10.3 per cent only once, in 2008.",
        "detail": "The line is inward foreign direct investment divided by gross fixed capital formation, which is the money India spends in a year on factories, machines, roads and buildings. It sits near zero through the 1990s, climbs through the 2000s to a single peak of 10.3 per cent in 2008, reaches 8.3 per cent in 2020, and falls back to 3.1 per cent in 2025. The ratio reached one tenth only once.",
        "whyShowThis": "It sets the size of annual FDI beside India's annual fixed investment, which gives the dollar figure useful scale.",
        "howToRead": "Read the vertical axis as inward FDI divided by gross fixed capital formation. The numerator includes purchases and reinvested earnings, so it cannot identify what foreign money built.",
        "mistakeToAvoid": "Do not read a falling line as foreign investment shrinking. The denominator grows too, so the share can fall in a year when dollar inflows rise.",
        "mobileNote": "One line, so label the 2008 and 2020 peaks directly and keep only a few year ticks.",
    },
    "india-s-fdi-to-gdp-ratio-stayed-below-latin-america-s":
{
        "takeaway": "Across fifty-six years India has never once taken in a larger share of GDP than Latin America, and has beaten East Asia in three years.",
        "detail": "This is the World Bank's measure of foreign investment against GDP, an independent compilation from the UNCTAD data used elsewhere on this page, and it reaches back to 1970. India runs along the bottom for most of the period, below 0.09 per cent of GDP throughout the 1970s and 1980s and negative in 1975, 1976 and 1977. The regional lines show what the alternative looked like at the same moment. India exceeded Sub-Saharan Africa in five of the fifty-five years they can be compared, and East Asia and the Pacific in three of fifty-six.",
        "whyShowThis": "It supplies the two decades before liberalisation that UNCTAD's series cannot reach, and it checks the India story against a second source.",
        "howToRead": "Compare the vertical position of the India line against the regional lines in any given year. The zero line matters: below it, more foreign capital left than arrived.",
        "mistakeToAvoid": "Do not treat the regional aggregates as averages of comparable countries. Each is dominated by a few large recipients, and the Latin America line in particular reflects a handful of economies.",
        "mobileNote": "Five lines is the ceiling on a phone. Keep India emphasised and label the lines at their right-hand ends.",
    },
    "from-43rd-in-the-world-in-1990-to-11th-in-2025":
{
        "takeaway": "India went from 43rd in the world in 1990 to 7th in 2020, fell to 16th in 2023, and was 11th in 2025.",
        "detail": "Rank is calculated among reporting individual economies, excluding regional aggregates and 16 Caribbean financial centres. This reproduces the report's 2025 ranking. India was behind Pakistan, Saudi Arabia, Colombia and the Philippines in 1990. The 2008 and 2009 jump to 8th is partly other people's collapse rather than India's surge, which is worth knowing before reading it as an achievement. The 2020 peak at 7th put India just behind Germany and ahead of the United Kingdom, Brazil, Mexico and Canada.",
        "whyShowThis": "Rank gives the ratio comparisons their necessary context: India's place in the annual recipient list changed substantially.",
        "howToRead": "The axis is inverted so that up means climbing. Rank 1 is the largest recipient in the world.",
        "mistakeToAvoid": "A rank improvement can come from other countries falling rather than India rising, which is exactly what happened in 2009 and again in 2020.",
        "mobileNote": "Invert the axis clearly and annotate 1990, 2020 and 2025 so the arc survives a small screen.",
    },
    "viet-nam-s-fdi-ratio-has-stayed-well-above-india-s":
{
        "takeaway": "Viet Nam recorded inward FDI equal to at least 13.8 per cent of its fixed investment every year since 2011. India averaged 4.9 per cent over the same years, nearer Korea's 2.6 than Viet Nam's 15.0.",
        "detail": "This puts the same FDI-to-fixed-investment ratio for five economies on one axis. Averaged over 2011 to 2025 the shares are Viet Nam 15.0 per cent, Poland 15.4 per cent, India 4.9 per cent, Korea 2.6 per cent and China 2.5 per cent. The ratios describe the scale of recorded FDI, not the source of every machine or factory.",
        "whyShowThis": "It shows where India's ratio sits beside Viet Nam, Poland, China and Korea.",
        "howToRead": "Each line divides inward FDI by that country's gross fixed capital formation, so economies of different sizes can be compared on this measure.",
        "mistakeToAvoid": "A low ratio does not establish how much a country saved domestically or whether its industrial policy worked.",
        "mobileNote": "Poland's single-deal spikes are noisy on a small screen. Keep India and Viet Nam emphasised and let the rest recede.",
    },
    "pakistan-s-fdi-ratio-exceeded-india-s-in-23-of-36-years":
{
        "takeaway": "Pakistan had a higher FDI-to-fixed-investment ratio than India in 23 of the last 36 years, and in each of the last three.",
        "detail": "Averaged over 2011 to 2025, inward FDI averaged 4.9 per cent of India's fixed investment, 4.6 per cent of Pakistan's, 3.9 per cent of Sri Lanka's and 2.2 per cent of Bangladesh's. India leads that list narrowly and the ordering is unstable: Sri Lanka has beaten India in 22 of 36 years including the last four. In 2024 the figures were India 2.2 per cent, Sri Lanka 4.0 and Pakistan 6.2. The neighbours provide a regional comparison, although their smaller denominators make the ratios sensitive to crises.",
        "whyShowThis": "It answers the most common objection to this article, which is that a low share is just what a large, poor, high-saving economy looks like.",
        "howToRead": "Each line divides inward FDI by that country's gross fixed capital formation.",
        "mistakeToAvoid": "Do not read this as Pakistan out-competing India for factories. Pakistan and Sri Lanka have smaller fixed-investment totals, so modest dollar inflows can produce larger ratios. Pakistan's 6.2 per cent in 2024 is $2.7bn against India's $27.1bn.",
        "mobileNote": "Four lines that cross often. Keep India emphasised and label at the right edge.",
    },
    "547-per-indian-against-2-243-per-chinese":
{
        "takeaway": "India has received about $547 of foreign investment per person since 1990. China is around $2,243 and Viet Nam $2,652.",
        "detail": "Every dollar of inward foreign direct investment from 1990 to 2025, divided by 2025 population. India's $800 billion total sits beside a population of 1.46 billion people. Thailand is at $3,319 and Malaysia at $7,127. Sri Lanka, at $813, is ahead of India on this calculation. Only Nigeria, Pakistan and Bangladesh sit below India here.",
        "whyShowThis": "It is the scale correction the dollar figures need. India's totals look large mainly because India is large.",
        "howToRead": "The scale is logarithmic, so each gridline is ten times the one before. Bar lengths compare orders of magnitude, not simple ratios.",
        "mistakeToAvoid": "This divides thirty-six years of flows by one year's population, so it is a sense of scale and not a precise per-person figure. Singapore and Ireland lead partly because money is booked there rather than invested there.",
        "mobileNote": "Keep the log gridlines labelled in dollars and place value labels outside the bars so short bars stay readable.",
    },
    "southeast-asia-took-6-3-times-india-s-inflow-in-2025":
{
        "takeaway": "Southeast Asia's annual foreign investment rose about 73 per cent between 2013 to 2017 and 2021 to 2025. India's fell about 2 per cent.",
        "detail": "China's share of foreign investment into developing economies fell from 23.7 per cent in 2020 to 11.6 per cent in 2025. These FDI totals cannot identify relocated factories. Southeast Asia's annual average went from $126 billion to $219 billion across the two comparison windows. India's went from $38.2 billion to $37.6 billion, which is slightly lower before adjusting for anything at all. In 2015 Southeast Asia received 2.6 times India's inflow; by 2025 it received 6.3 times.",
        "whyShowThis": "The regional flow comparison shows how recorded FDI changed across two periods.",
        "howToRead": "Compare the gap between the Southeast Asia line and the India line at the left and right ends of the chart, rather than reading any single year.",
        "mistakeToAvoid": "The chart shows where FDI was recorded, not its final use or why it went there. It settles nothing about land, labour law, tariffs or clearances. UNCTAD's Southeast Asia aggregate also includes Singapore, where much of the inflow is booked rather than built.",
        "mobileNote": "Three lines with wide separation, so direct labels work. Anchor the axis at zero.",
    },
    "india-s-share-of-developing-economy-fdi-was-4-3-in-2025":
{
        "takeaway": "India's share of all foreign investment going to developing economies fell from 6.0 per cent in 2015 to 4.3 per cent in 2025.",
        "detail": "The share rose above 10 per cent in 2020, which reads as a breakthrough but was mostly the rest of the developing world stopping during the pandemic while India's large Jio-era deals went through. It has been below that level in every year since, and the 2025 figure of 4.3 per cent is below where the decade started. The denominator excludes Caribbean financial centres and special-purpose entities, but includes Singapore and other routing hubs.",
        "whyShowThis": "The developing-economy denominator gives one consistent comparison group, though its membership and flows require care.",
        "howToRead": "This is India's slice of a pie that itself grows and shrinks, so a falling line means losing ground relative to other developing economies specifically.",
        "mistakeToAvoid": "Do not read the 2020 spike as a policy success. It is mostly a denominator effect from a year when global investment collapsed.",
        "mobileNote": "A single line with a clear spike. Annotate 2020 so the pandemic distortion is not misread.",
    },
    "india-s-inward-fdi-stock-equalled-13-5-of-gdp-in-2025":
{
        "takeaway": "India's inward FDI stock equalled 13.5 per cent of GDP in 2025. In Viet Nam the figure is 55.1 per cent and in Thailand 66.5 per cent.",
        "detail": "Accumulated inward foreign direct investment stock as a share of GDP in 2025. It is a book-value stock ratio and moves more slowly than annual flows. India at 13.5 per cent sits below China at 19.3 per cent, Indonesia at 23.8 per cent, Poland at 40.6 per cent and Brazil at 50.7 per cent. Only Bangladesh, at 4.3 per cent, is lower among the economies shown.",
        "whyShowThis": "Annual flows are volatile and easy to argue about. The accumulated stock gives a longer-run scale measure than a single year's flow.",
        "howToRead": "Read this as FDI stock divided by one year of GDP, not as the share of Indian assets under foreign ownership.",
        "mistakeToAvoid": "Stock is recorded at book value rather than market value, and the 2025 figures are preliminary. Treat the ordering as a broad comparison and the exact levels as preliminary.",
        "mobileNote": "Bars sorted high to low with India highlighted; values outside the bars.",
    },
    "in-2024-and-2025-foreign-firms-were-net-sellers-of-indian-companies":
{
        "takeaway": "In 2018 foreign firms bought $33.6bn of Indian companies against $42.2bn of recorded FDI. In 2024 and 2025 they were net sellers.",
        "detail": "UNCTAD tracks the net value of cross-border acquisitions separately from recorded FDI. The acquisition series was $33.6 billion in 2018 and $21.8 billion in 2020. It turned negative: minus $1.4 billion in 2024 and minus $3.3 billion in 2025, meaning foreign sellers disposed of more Indian corporate assets by value than foreign buyers acquired on this measure. The series cannot tell us how much annual FDI came through acquisitions.",
        "whyShowThis": "Acquisition values add context to the FDI series, though they cannot decompose it.",
        "howToRead": "Compare the shape of the two lines, particularly where the acquisition line spikes or drops below zero.",
        "mistakeToAvoid": "Never subtract one line from the other. Acquisitions can contribute to FDI, but net deal values and balance-of-payments flows come from different sources and use different timing conventions. The annex line is not a measured component of the FDI line.",
        "mobileNote": "Two lines with a zero rule that has to stay visible, because crossing it is the point.",
    },
    "india-announced-111-billion-of-projects-in-2024-and-recorded-27-billion":
{
        "takeaway": "India announced a record $111.1 billion of greenfield projects in 2024, the same year it recorded its smallest inflow in a decade at $27.1 billion.",
        "detail": "Announced greenfield project value against foreign investment actually recorded in the balance of payments, from 2003. The two lines track loosely for most of the period and separate sharply after 2022. Announcements were $89.5 billion in 2023, $111.1 billion in 2024 and $74.1 billion in 2025, against recorded flows of $28.1 billion, $27.1 billion and $38.9 billion. The series have different definitions and timing.",
        "whyShowThis": "Project announcements and recorded FDI moved differently, and the chart shows why their definitions matter.",
        "howToRead": "Compare the direction of the two lines rather than the distance between them at any point.",
        "mistakeToAvoid": "Never subtract one line from the other. They are different concepts on different clocks: an announcement is an intention that may be built over several later years or abandoned, and it comes from a commercial project database rather than official statistics.",
        "mobileNote": "Two labelled lines, with their different definitions visible beside the chart.",
    },
    "2015-2020-had-india-s-highest-average-fdi-ratio":
{
        "takeaway": "2015 to 2020 had the highest average annual FDI-to-fixed-investment ratio of the five periods shown: 6.3 per cent.",
        "detail": "Five editorial periods with their total recorded FDI and average annual FDI-to-fixed-investment ratio. The 1991 to 2000 reform decade brought $18.5 billion at an average 1.8 per cent. The 2001 to 2008 boom brought $122 billion at 4.7 per cent, and 2009 to 2014 brought $186 billion at 5.1 per cent. The 2015 to 2020 period is the peak on both measures. The most recent era, 2021 to 2025, brought $188 billion at 3.3 per cent.",
        "whyShowThis": "The period comparison shows when the ratio was highest without attributing it to a policy.",
        "howToRead": "The bars are period totals, so longer periods have an advantage. The share column is the annual average within each era and is the fairer comparison.",
        "mistakeToAvoid": "Do not compare the bar lengths without checking the period lengths. 2001 to 2008 covers eight years and 2021 to 2025 covers five.",
        "mobileNote": "Era labels are long, so keep them on their own line above each bar.",
    },
    "in-2025-one-dollar-announced-abroad-for-every-three-announced-at-home":
{
        "takeaway": "Indian firms announced $25.3bn of greenfield projects abroad in 2025, against $74.1bn announced into India.",
        "detail": "Roughly one dollar announced overseas for every three announced inward, from a country that spent decades purely as a destination. The outbound line peaked at $42.3bn in 2022. Both series are announcements rather than recorded money, and the outbound one carries an extra distortion: an Indian group building in the Gulf or in Africa may route the project through a holding company that makes it appear to originate elsewhere, and the reverse happens too.",
        "whyShowThis": "The outward project series gives another view of activity by Indian firms abroad.",
        "howToRead": "Read the gap between the two lines as a rough ratio rather than a difference, since both are intentions.",
        "mistakeToAvoid": "Do not treat either line as investment that happened. Announced projects are compiled from company statements and a share of them never get built.",
        "mobileNote": "Two lines, wide apart, direct labels at the right edge.",
    },
    "foreign-holdings-were-13-times-indian-holdings-abroad-in-1990-now-1-9":
{
        "takeaway": "What foreigners own in India was 13.4 times what India owned abroad in 1990. In 2025 it is 1.9 times.",
        "detail": "Accumulated foreign direct investment stock in both directions, at book value. In 2025 foreign holdings in India come to $559 billion against $296 billion of Indian holdings overseas. The two lines have been converging since the mid-2000s, when Indian firms began buying abroad in earnest. The series alone cannot explain why the two stocks moved closer.",
        "whyShowThis": "It closes the article on the accumulated position rather than on a single year, and it hands the reader to the separate article that explains the net-flow arithmetic.",
        "howToRead": "Both lines are book-value stock estimates and may be revised. Compare their scale, with that qualification in mind.",
        "mistakeToAvoid": "Do not read the converging lines as capital flight. Outward investment can reflect several activities, and some of it is holding-company structure rather than new factories abroad.",
        "mobileNote": "Two lines that converge; label both at the right edge where they are closest.",
    },
    "china-has-41-firms-on-unctad-s-developing-economy-list-india-has-4":
{
        "takeaway": "China has 41 firms in the top 100 multinationals from developing economies. India has 4, and none in the world's top 100.",
        "detail": "UNCTAD ranks these firms by the assets they hold outside their home country. China has 41 of them. India has 4, level with Mexico: Tata Motors, Hindalco, ONGC and Bharti Airtel. On the separate world top 100, Korea has three companies and India none. The list counts foreign assets, so it says less about export reach or intangible services.",
        "whyShowThis": "The foreign-assets ranking gives a narrow view of Indian firms' international reach.",
        "howToRead": "Bars are counts of firms, not company size. A country with two very large multinationals scores below one with five medium ones.",
        "mistakeToAvoid": "Ranking by foreign assets flatters heavy-asset businesses and undercounts software exporters, so India's services strength is under-represented here. This chart alone cannot explain the gap with China.",
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
        "headline": "Inward FDI equalled 3.1 per cent of India's fixed investment in 2025",
        "dek": "India received $38.9 billion of foreign direct investment in 2025 and climbed to eleventh in the world. That was equivalent to 3.1 per cent of the year's fixed investment. The high-water mark, in 2008, was 10.3 per cent.",
        "body": "India received $38.9 billion of inward FDI in 2025. Against fixed investment of about $1.24 trillion, that is 3.1 per cent. The ratio peaked at 10.3 per cent in 2008. Viet Nam's ratio has averaged about 15 per cent since 2011. Southeast Asia's annual inflows rose much faster than India's between the two five-year windows shown here. These comparisons show the scale and direction of recorded FDI; they cannot identify which assets it financed or why firms chose a destination.",
    },
    "macha": {
        "heading": "Okay bro, what does this actually mean?",
        "body": "Imagine India spent 100 rupees on fixed assets in a year. Recorded inward FDI that year was worth about 3 rupees. That comparison gives us a sense of scale, but it cannot trace those 3 rupees to a particular factory or road. Some FDI is a purchase of an existing business, and some is profit a foreign-owned firm earned and reinvested here.",
        "soWhat": "When you see a headline about record FDI, ask what it is a share of. India's foreign investment numbers are big because India is big. Spread across 1.46 billion people, thirty-six years of it comes to about $547 each, which is less than Sri Lanka has managed.",
    },
    "article": {
        "title": "How much foreign investment did India attract? What 56 years of data show.",
        "standfirst": "India received $38.9 billion in foreign direct investment in 2025 and moved up to eleventh in the world. That was equivalent to 3.1 per cent of the year's fixed investment. UNCTAD has published that ratio since 1990 and it has never once passed 10.3 per cent.",
        "bodyMarkdown": BODY,
    },
    "chartExplainers": explainers,
    "sectionVisualMap": [
        {"heading": SECTIONS[i], "visualId": CHART_IDS[i]} for i in range(len(CHART_IDS))
    ],
    "sourceNotes": [
        {"label": "UN Trade and Development (UNCTAD), UNCTADstat: Foreign direct investment, inward and outward flows and stock, annual. The 1990 to 2025 panel for 293 economies, in current US dollars and as shares of world total, GDP and gross fixed capital formation. Updated 10 August 2026.",
         "url": "https://unctadstat.unctad.org/datacentre/dataviewer/US.FdiFlowsStock"},
        {"label": "UNCTAD, World Investment Report 2026: International Investment in a Turbulent Era. Annex table 01 was used to validate India's inflow series line by line. Tables 05, 13, 14 and 17 supplied cross-border acquisition and announced greenfield values and counts; tables 19 and 20 supplied multinational rankings.",
         "url": "https://unctad.org/topic/investment/world-investment-report"},
        {"label": "World Bank, Foreign direct investment, net inflows as a share of GDP, indicator BX.KLT.DINV.WD.GD.ZS. Used for the 1970 to 2025 regional comparison, and as an independent check on the UNCTAD figures for India. Updated 13 July 2026.",
         "url": "https://data.worldbank.org/indicator/BX.KLT.DINV.WD.GD.ZS"},
        {"label": "UNCTADstat, Total and urban population, annual. Supplies the 2025 population denominators for the per-person comparison.",
         "url": "https://unctadstat.unctad.org/datacentre/dataviewer/US.PopTotal"},
        {"label": "UNCTAD Handbook of Statistics 2021, country group definitions. Its Caribbean financial centre list is excluded from the calculated country rank, matching the 2025 ranking in World Investment Report 2026.",
         "url": "https://unctad.org/system/files/official-document/tdstat46_en.pdf"},
    ],
    "furtherReading": [
        {"label": "Indica: Is foreign money really fleeing India? What FDI and FII numbers actually mean. The companion article, which explains the gross, repatriation and net arithmetic behind India's falling net FDI figure using RBI data.",
         "url": "/articles/foreign-investment/"},
        {"label": "UNCTAD, World Investment Report 2026 regional trends: Developing Asia. The chapter behind the Southeast Asia and India comparisons.",
         "url": "https://unctad.org/topic/investment/world-investment-report"},
    ],
    "caveats": [
        "The main flow and stock series use UNCTAD's balance-of-payments definitions on calendar years. DPIIT's gross FDI equity inflows use a different coverage and fiscal-year timing. The two are not interchangeable.",
        "Announced greenfield project values come from a commercial project-tracking database, not official statistics. An announcement is an intention that may be built across several later years or abandoned, and it must never be subtracted from recorded balance-of-payments flows.",
        "Shares of GDP and of gross fixed capital formation depend on UNCTAD's own national accounts denominators, which are revised.",
        "The per-person comparison divides a thirty-six year cumulative flow by a single year's population. It is a sense of scale rather than a precise ratio. Singapore and Ireland rank high partly because investment is booked there rather than built there.",
        "UNCTAD's developing Southeast Asia aggregate includes Singapore, a financial hub, so the line is not a measure of physical investment alone. Regional aggregates exclude Caribbean financial centres and special-purpose entities, so they will not match naive sums of country figures.",
        "Foreign direct investment stock is recorded at book value rather than market value and is revised often.",
        "Outward investment by Indian firms is not all new overseas operations. Some reflects holding structures and redomiciling, which this dataset cannot separate.",
        "The 2025 figures are preliminary and may be revised. Figures here use the World Investment Report 2026 vintage and may differ from earlier publications.",
        "The World Bank and UNCTAD series rest on different compilations. They agree on India to within about a tenth of a percentage point in every year since 1990, but they are not mixed inside any single chart on this page.",
    ],
    "lockedNumbersUsed": [
        "FDI as a share of gross fixed capital formation, India, 2025 (3.1 per cent)",
        "FDI as a share of gross fixed capital formation, India, 2008 peak (10.3 per cent)",
        "FDI as a share of gross fixed capital formation, India, 2020 (8.3 per cent)",
        "FDI as a share of gross fixed capital formation, Viet Nam, 2025 (14.7 per cent)",
        "India inward FDI flow, 1990 ($237 million) and 2025 ($38.9 billion)",
        "India world rank for FDI received, excluding 16 Caribbean financial centres: 43rd (1990), 27th (2001), 8th (2008), 7th (2020), 16th (2023), 11th (2025)",
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
    "generationPasses": [{"name": "editorial-assembly", "note": "Prose edited against the evidence packet; source values checked by the FDI source-cell audit."}],
    "evidence": ev,
}

out = ROOT / "data/explanations/en/q.econ.fdi_development.json"
out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print("wrote", out)
print("body words:", len(BODY.split()))
print("sections:", len(heads), "| explainers:", len(explainers), "| map:", len(doc["sectionVisualMap"]))
