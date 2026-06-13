import { writeFile } from "node:fs/promises";
import { v1Questions } from "./registry/v1-indicators.mjs";

const question = v1Questions.find((q) => q.id === "q.econ.motorisation");
if (!question) throw new Error("q.econ.motorisation not found in registry");

const headings = [
  ["How did the curve begin?", "The motorisation curve starts in 2003"],
  ["How large did the annual market become?", "Seven times more new vehicles a year"],
  ["Did income explain the boom?", "Registrations outran real income, but not nominal India"],
  ["Does GDP explain the year-to-year jumps?", "The year-to-year link is weaker than the level chart"],
  ["So what does the correlation really say?", "Correlation is high in levels, modest in growth"],
  ["Was this just population growth?", "Motorisation rose even after population is counted"],
  ["Did India become a car country?", "Still a two-wheeler country"],
  ["What changed under the tank?", "Petrol still dominates, diesel fades, EVs arrive"],
  ["How big is the EV shift in absolute numbers?", "EVs went from footnote to millions"],
  ["Where did the extra vehicles come from?", "Where the extra vehicles came from"],
  ["Why do some months suddenly explode?", "The festival spike is real"],
  ["Did transport inflation hit everyone equally?", "Transport inflation hit rural India harder"],
  ["What did petrol and diesel add to the story?", "Petrol and diesel are only one part of that cost"],
  ["Did high transport prices choke registrations?", "Transport CPI is not a simple demand brake"],
  ["How much did credit matter?", "Credit helped keep the engine turning"],
  ["Did credit growth move with registrations?", "Credit growth and registrations do not move one-for-one"],
  ["Does the industry-side data agree?", "The industry-side check says the same thing"],
  ["What do EVs plug into?", "EVs plug into a still-carbon-heavy grid"],
  ["Is the grid getting clean fast enough?", "The grid is cleaner, but still not clean"]
];

const bodyMarkdown = `## How did the curve begin?

India's motorisation story does not begin with a luxury SUV, a flyover opening, or an EV launch. It begins in the monthly VAHAN tables in 2003, when a country of more than a billion people was registering only a few lakh vehicles a month. The road economy was still early in its mass phase: no app-delivery fleets at national scale, no mainstream EV policy, fewer financed two-wheelers in small towns, and a thinner highway and dealer network than India has today.

By FY 2025-26, VAHAN recorded 30.8 million registrations in a year. That is the headline scale. The more useful story is the shape of the expansion. India did not simply become a car country. It became a motorised country on Indian terms: mostly two-wheelers, a meaningful but still minority car market, more three-wheelers and tractors, a diesel retreat, a visible EV wedge, and a road economy shaped by income, credit, fuel prices, festivals and state-level growth.

In January 2003, VAHAN recorded about 3.45 lakh registrations. By the mid-2020s, ordinary months were often above 20 lakh, and festival months could go much higher. October 2025 crossed 4.1 million registrations, the largest month in this series.

Read the monthly line as the pulse of the road economy. It shows the long rise in household and business mobility, the late-year festival burst, and the Covid break in the same frame. It also shows why this article uses more than one chart. A single rising line tells us the country motorised. It does not tell us who motorised, what they bought, how they paid, or what the energy consequences were.

The last 2026 point needs care. The raw VAHAN tables run into June 2026, but June is partial through June 13, 2026. That is useful for freshness, not for a full-year conclusion.

## How large did the annual market become?

Fiscal years make the scale easier to see. VAHAN registrations rose from about 4.4 million in FY 2003-04 to about 30.8 million in FY 2025-26. That is roughly seven times in a little over two decades.

This is not production. It is not wholesale sales. It is not the total fleet on the road. It is the flow of vehicles being registered into the system. That distinction matters because a registration is closer to what reaches roads than factory dispatches are, but it still does not tell us how much each vehicle is used, how long it stays in service, or whether an old vehicle was scrapped.

Even with those limits, a flow of this size changes institutions and everyday life. It means more work for RTOs, insurers, dealers, banks, service shops, fuel stations, charging networks and traffic police. It changes how families reach schools, hospitals and jobs. It changes how goods move within districts. It also puts pressure on roads, parking, air, energy demand and household budgets.

So the annual chart is not just a demand chart. It is the clearest measure of how the road became a mass economic platform.

## Did income explain the boom?

Income is the background engine, but not the whole machine. If every series is indexed to FY 2003-04, VAHAN rises to about seven times its starting level by FY 2025-26. [Real GDP](/academy/what-is-gdp/) rises to about four times. [Real per-capita GDP](/articles/how-rich-is-the-average-indian/) rises to about three times. Nominal GDP rises much more, because it includes inflation as well as real expansion.

That gives us the right reading. Rising incomes made motorisation possible. More people could afford a scooter, a motorcycle, a car, a tractor, a delivery vehicle, or an e-rickshaw. But the registration line outrunning real income says the market was also being pushed by finance, roads, dealer reach, changing work patterns, small-town aspiration and the sheer usefulness of a cheap motorised vehicle in places where public transport is limited.

Nominal income also matters because vehicles are bought in rupees at current prices. Real income tells us how much the economy's volume grew. Nominal income tells us how large the rupee economy became. For a threshold purchase, both count: households need real purchasing power, but they also take loans, pay down payments and compare EMIs in current rupees.

This is why the GDP chart should be read as an enabling condition, not a full explanation. Income opened the door. The vehicle market walked through it unevenly, in different forms, at different speeds.

## Does GDP explain the year-to-year jumps?

The growth-rate chart is the honesty test. Two lines can look related simply because both climb for twenty years. Year-to-year movement is harder.

Registration growth and real GDP growth move together in the obvious shock years, especially the Covid collapse and rebound. Outside that, the match is uneven. Some years with decent GDP growth do not produce an equal vehicle boom. Some registration surges are stronger than the income line alone would suggest.

That is exactly what we should expect. Vehicle buying is lumpy. It depends on credit availability, waiting periods, model launches, fuel costs, regulations, rural cash flow, monsoons, freight cycles, festivals and sentiment. It can also move around policy deadlines or tax changes. GDP is the weather system. Registrations are the traffic on a particular road.

The growth chart is therefore where the development story becomes less tidy and more believable. India got richer, but households and firms did not buy vehicles in a smooth line every year.

## So what does the correlation really say?

The correlation table stops the article from pretending to be more certain than the data allows. In levels, registrations correlate strongly with GDP and per-capita GDP because India, income and vehicle registrations all rose over the same period. That relationship is meaningful, but it is also partly the mathematics of two upward lines.

The growth correlations are more modest once FY 2020-21 and FY 2021-22 are excluded. Real GDP growth and registration growth are related, but not tightly. Real per-capita GDP growth is weaker still. Nominal income growth lines up better because vehicle buying happens in current rupees.

This matters editorially. A simple GDP story would be too confident. The data supports a more careful claim: income growth created the long runway, while the takeoffs and stalls along that runway were shaped by credit, costs, policy, supply and sentiment.

## Was this just population growth?

No. India added people, but registrations rose faster than population. New registrations per 1,000 people went from about 3.8 in 2003 to about 18.8 in 2024. That is a per-person reality check, the same instinct behind comparing India by [average income](/articles/how-rich-is-the-average-indian/) rather than only by total scale.

That number is still not ownership. It does not say 18.8 people per 1,000 own a new vehicle. It says that in that year, the flow of new registrations was 18.8 for every 1,000 residents. A country can have high registrations because first-time buyers are entering, households are adding second vehicles, commercial fleets are expanding, or vehicles are being replaced faster.

The measure also hides distribution. A district with poor bus service and rising two-wheeler access can look very different from a high-income urban market adding second cars. But it answers one doubt cleanly. The VAHAN boom is not just India becoming more populous. It is India becoming more motorised.

## Did India become a car country?

No. It became a motorised country, and those are not the same thing.

The easy image of development is a family graduating from a scooter to a hatchback to an SUV. Some of India did that, especially in richer cities. But the national road tells a less glamorous and more important story: two-wheelers stayed around seven out of every ten registrations even after two decades of growth.

That is the structure of Indian mobility. A two-wheeler is cheaper to buy, cheaper to run, easier to park, easier to finance, and more useful in congested towns than a car. It can be a family vehicle, a commute vehicle and a livelihood tool. It can connect a village to a bus stand, a worker to an industrial cluster, a student to a college, or a delivery rider to a platform job.

Cars arrived and became more visible in the public imagination. They did not take over the registration base. Any story of Indian motorisation that starts with cars will miss most of the market.

## What changed under the tank?

The fuel mix changed more than the vehicle mix, but even here the story is not an EV takeover. Petrol and petrol-hybrid registrations still made up about 79% of FY 2025-26 registrations. Diesel and diesel-hybrids were down to about 10%. Battery EVs reached about 8.25%. CNG was still small nationally.

Diesel's retreat matters. It reflects policy, urban restrictions, price economics and the changing mix of passenger vehicles. Petrol's dominance matters too, because the two-wheeler base is petrol-heavy. EVs matter most because a share that was almost invisible has become visible in only a few years.

The chart also warns against importing a car-market frame into India. If the marginal transition happens in scooters, motorcycles, e-rickshaws and small commercial vehicles, the infrastructure and policy questions look different from a premium-car EV story. Charging location, battery size, daily kilometres, finance and fleet ownership all matter.

The right EV sentence is plain: EVs are now too large to ignore and still too small to define the whole market.

## How big is the EV shift in absolute numbers?

Shares can make small bases look dramatic, so the count matters. Battery EV registrations rose from a footnote in the early VAHAN years to millions annually by the mid-2020s.

The definition here is VAHAN's fuel classification: ELECTRIC(BOV) plus PURE EV. That is the cleanest consistent bucket in this data, but it is still a registration category. It does not say how many electric vehicles are on the road today, how far they travel, how often they charge, or how much petrol they displaced.

The article also does not use a vehicle-class-by-fuel cross-tab, so it should not claim exactly how many of those EVs are two-wheelers, three-wheelers or cars. The national pattern and the known market structure point toward a two- and three-wheeler-heavy transition, but the chart itself is only the fuel count.

Even with that caveat, the arrival is real. A category that once barely moved the national total is now visible in the national fuel mix.

## Where did the extra vehicles come from?

The biggest absolute additions came from the biggest state markets. Uttar Pradesh added the most annual registrations between 2003 and 2025. Maharashtra, Gujarat and Tamil Nadu also added large numbers. Bihar, Rajasthan, Karnataka, Madhya Pradesh, Haryana, West Bengal and Telangana are all part of the expansion map.

This is not a per-capita ranking. A large state can add the most vehicles simply because it has more people and more households. But the absolute-additions view is still useful because it tells us where the road system, dealer network, fuel demand, credit demand and registration workload expanded most.

It also shifts the story away from a metro-only reading. The new road economy is visible in large state markets, district towns, rural commuting routes, freight corridors and peri-urban belts. The pressure is practical: more vehicles need roads, parking, enforcement, finance, insurance, repair labour and, increasingly, chargers.

## Why do some months suddenly explode?

Vehicle buying has a calendar. Recent complete years show clear October-November spikes, and October 2025 was the largest month in the series.

Part of this is festive buying. Part is dealer push. Part is model timing and stock. Part is the way auspicious purchase dates cluster demand that might otherwise have been spread across weeks. Financing offers and discounts can also pull purchases into a narrow window. The monthly line catches behaviour that annual data smooths away.

But the festival chart should not be read like a metronome. Diwali moves. Policy deadlines move. Supply constraints move. A spike is a rhythm, not a law. The key point is that the vehicle market is not only an income story. It is also a calendar story.

## Did transport inflation hit everyone equally?

No. MoSPI's transport-and-communication [CPI](/academy/cpi-vs-wpi/) gives a broader cost backdrop than petrol or diesel alone. By December 2025, the combined index was about 172 on a 2012 base. The rural index was higher, around 178.5, while the urban index was around 166.9.

That matters because mobility costs are not only pump prices. They include transport services and communication too. For rural households, the higher index suggests mobility-cost pressure has been heavier on this broad measure, even as the two-wheeler remains the practical way to access work, markets, schools and health care.

The rural point is important because a vehicle can be both a burden and a solution. Higher transport costs squeeze budgets. Limited alternatives make private motorised mobility more valuable. A household may buy a two-wheeler not because transport is cheap, but because the cost of not having reliable mobility is also high.

This is not the private vehicle running cost. It is the household transport-and-communication basket. That makes it broader, but also less precise.

## What did petrol and diesel add to the story?

Petrol and diesel CPI item indexes narrow the lens. Diesel rose faster than petrol after the 2012 base, and that changes the economics of commercial vehicles, taxis, tractors, rural transport and household choices.

But these are still indexes, not rupees per litre. State taxes differ. Vehicle efficiency differs. How much a household drives differs. A delivery rider and a weekend car owner do not experience the same fuel economy. A diesel goods vehicle, a tractor and a petrol scooter sit in different household or business budgets.

So fuel prices belong in the story as a pressure, not as a single explanation. They shape the cost of use after purchase, and they help explain why diesel's role weakened, but they cannot alone explain registrations.

## Did high transport prices choke registrations?

The correlation check says no simple story appears in this data. Monthly year-on-year registration growth has only small correlations with transport and fuel [inflation](/academy/what-is-inflation/), and the correlations are mostly positive, not strongly negative.

That does not mean higher prices are good for vehicle demand. It means expansion years often had both more registrations and higher mobility prices. A growing economy can raise demand and prices at the same time. A constrained supply chain can do the same. Credit can soften the immediate pain of higher prices. Households can also treat a vehicle as a way to reduce time cost or improve access, even when running costs are rising.

This is why the article should resist the easy line. Transport CPI is an affordability backdrop. It is not a clean demand brake in the VAHAN series. To prove a direct brake, we would need a model that controls for income, credit, supply, seasonality, policy and vehicle mix. The simple correlation does not do that.

## How much did credit matter?

Credit is one of the missing links between income and registrations. The available series is outstanding vehicle loans from the RBI data surfaced through IndiaDataHub. It more than doubled after January 2019, while registrations recovered from Covid and then pushed to new highs. For the broader household-credit backdrop, this sits beside the larger question of [how India borrows](/articles/how-does-india-borrow/).

That is important, but it has a boundary. Outstanding loan stock is not new lending. It rises when new loans are made, but it also depends on repayments, tenure, interest rates and the size of past loans. It cannot tell us exactly how many registered vehicles were financed.

Still, the direction fits the lived economy. The vehicle market is not only cash in hand. It is EMI capacity, bank underwriting, non-bank finance, dealer finance and household confidence. Credit can pull a purchase forward, turn a future income stream into current mobility, and spread a one-time cost across the working life of the vehicle.

That is why credit belongs in the article even though it cannot carry the whole explanation. It helps explain how registrations can rise faster than real income alone.

## Did credit growth move with registrations?

The YoY comparison is the sharper version of the credit question. The indexed chart shows that the loan book became much larger after 2019. The growth chart asks whether credit momentum and registration momentum moved together month by month.

They are related in the broad sense, but not one-for-one. Registration growth swings hard around Covid, recovery months and seasonal bursts. Vehicle-loan stock growth is steadier because it is a balance-sheet measure. It includes new loans, but it also includes repayments, tenures, larger ticket sizes and old loans still sitting on bank books.

That is the useful lesson. Credit is part of the motorisation machine, but outstanding loan growth is not a clean proxy for new vehicle demand. It tells us the financing channel expanded. It does not tell us exactly how many registrations were financed in a given month.

## Does the industry-side data agree?

SIAM is a useful cross-check because it measures a different point in the chain: domestic wholesale sales by manufacturers. In FY 2025-26, SIAM reported 28.3 million domestic sales, dominated by two-wheelers, with passenger vehicles far behind.

That is close enough in structure to VAHAN to strengthen the mix story. It does not replace VAHAN because wholesale dispatches and retail registrations are different. A vehicle can be dispatched before it is registered. Inventory can move. Categories do not align perfectly.

The agreement matters because it comes from an independent source with a different measurement point. VAHAN says the registered road flow is two-wheeler-heavy. SIAM says the factory-to-dealer domestic flow is also two-wheeler-heavy. The same broad structure appears from both ends.

There is another caveat: the public SIAM scrape currently gives a continuous early trend only up to FY 2013-14 and then the FY 2025-26 press release. So SIAM is an endpoint check here, not the backbone of the article.

## What do EVs plug into?

EV adoption does not end at the vehicle. It shifts energy demand toward [India's grid](/articles/what-powers-india/). That is why Ember matters, even though Ember is not EV data.

In 2025, renewables generated about 24% of India's electricity. Wind and solar together generated about 14%. Those shares are rising, and every point matters because a cleaner grid makes future electric kilometres cleaner.

But the grid is still largely fossil-powered. A registration chart can tell us EVs are arriving. It cannot tell us the full emissions effect. For that, we need charging patterns, battery manufacturing, vehicle lifetime, fuel displacement and the electricity mix over time.

The grid chart therefore changes the question from "Are EVs zero emission?" to "How clean are the electric kilometres that India is adding?" The answer improves as renewables rise, but it depends on the system into which vehicles are plugged.

## Is the grid getting clean fast enough?

Ember's carbon-intensity line gives the other half of the EV context. India's electricity carbon intensity fell to about 671 gCO2 per kWh in 2025, the lowest point in this series. The same transition also sits inside the wider question of whether [India's electricity is going green](/articles/is-indias-electricity-going-green/).

That is progress. It is also not clean. EVs become cleaner as the grid gets cleaner, and India's grid is moving in that direction. But a coal-heavy grid means the transition is gradual, not magical.

The honest conclusion is conditional. EV registrations are rising. The grid is improving. The climate benefit grows as those two lines move together. If EV adoption outruns grid cleaning, the transport transition still helps on tailpipe pollution and oil demand, but the climate story remains constrained. If the grid cleans faster, every future EV kilometre improves.

## How should you read these numbers?

The backbone is VAHAN registration data from January 2003 onward. Fiscal-year series are built by summing monthly VAHAN tables from April to March. Calendar-year state additions use complete calendar years, 2003 and 2025. Vehicle classes and fuel types are grouped into readable buckets: two-wheelers include motorcycles, scooters and mopeds; cars and cabs are grouped together; battery EVs are ELECTRIC(BOV) plus PURE EV.

Per-capita registrations divide calendar-year VAHAN totals by World Bank population. GDP and per-capita GDP come from MoSPI NAS. Transport, rural, urban, petrol and diesel CPI series come from MoSPI CPI. Vehicle credit is RBI/IndiaDataHub outstanding loan stock. SIAM is wholesale domestic sales, not registrations. Ember is electricity-grid data, not EV adoption data.

The correlation tables are Pearson correlations. The GDP correlation table uses fiscal-year registrations and MoSPI income series; the growth rows exclude FY 2020-21 and FY 2021-22 so the Covid collapse and rebound do not dominate the answer. The transport CPI table uses monthly year-on-year registration growth against monthly transport or fuel CPI inflation, with a second cut excluding 2020 and 2021.

The caveat is not a footnote. VAHAN measures registrations, not ownership, kilometres, scrappage, emissions, household access or congestion. Correlations are descriptive, not causal. The 2026 monthly tail is partial through June 13, 2026. So the story is strong where it is measured directly: India registered seven times more vehicles, stayed a two-wheeler country, saw diesel fade and EVs arrive, and plugged that transition into a grid that is cleaner than before but still carbon-heavy. Everything beyond that should be read as context, not proof.`;

const explainerRows = [
  [
    "The motorisation curve starts in 2003",
    "India moved from lakh-scale registration months to multi-million registration months.",
    "This is the pulse chart for the whole article. It shows the long climb in new vehicles entering the system, the recurring festival peaks, the Covid break, and the sharp recovery in one view. The chart is monthly, so it preserves the volatility that annual totals hide.",
    "It establishes the basic fact that the road economy became mass-scale after 2003 before the article asks what kind of motorisation India actually got.",
    "Follow the line from left to right and treat every point as registrations in that month, not cumulative fleet size. The tallest spikes are monthly surges, usually clustered around the festive season.",
    "Do not read the final 2026 point as a full-year signal. The VAHAN source runs through June 13, 2026, so the latest month is partial.",
    "On a phone, ignore exact monthly labels and look for three features: the long rise, the Covid break, and the late-year spikes."
  ],
  [
    "Seven times more new vehicles a year",
    "The annual registration flow rose from 4.4 million in FY 2003-04 to 30.8 million in FY 2025-26.",
    "Fiscal years remove the monthly noise and make the scale plain. This is the cleanest chart for the headline because it compares complete April-to-March years and lines up with GDP, SIAM and credit context.",
    "It turns the story from a noisy monthly line into an annual system-level transformation.",
    "Read each point as vehicles registered during that fiscal year. A higher point means a larger annual flow into the registered vehicle system.",
    "Do not call this ownership, production or the total number of vehicles on road. It is the annual registration flow.",
    "The important mobile takeaway is the multiple: from a few million a year to more than 30 million a year."
  ],
  [
    "Registrations outran real income, but not nominal India",
    "Income made motorisation possible, but real income alone does not explain the full rise.",
    "Every series starts at 100 in FY 2003-04, which makes growth multiples comparable across registrations, GDP and per-capita GDP. Registrations rise faster than real GDP and real per-capita GDP, while nominal GDP rises even more because it includes inflation. That split is the core nuance: real purchasing power matters, but vehicles are bought, financed and priced in current rupees.",
    "It tests whether the vehicle boom can be reduced to the income boom.",
    "A line at 700 means seven times the FY 2003-04 level. Compare the spacing between the VAHAN line and the real-income lines rather than the exact value in every year.",
    "Do not mix nominal and real readings. Nominal series include inflation; real series strip it out.",
    "Use the legend carefully. The nominal GDP line climbs fastest, so the key comparison is VAHAN against the real GDP and real per-capita GDP lines."
  ],
  [
    "The year-to-year link is weaker than the level chart",
    "GDP growth and registration growth move together in shocks, but not consistently every year.",
    "The indexed chart can overstate the relationship because all large long-term series trend upward. Growth rates ask a harder question: when income growth speeds up or slows down, do registrations do the same? The answer is partly yes around shocks, but uneven in ordinary years.",
    "It prevents the article from using GDP as a one-variable explanation.",
    "Look for same-year rises and falls across the lines, then compare the calmer years outside the Covid collapse and rebound.",
    "Do not treat a matching year as proof of causation. Registrations also respond to credit, supply, regulations, fuel costs, monsoons, festivals and sentiment.",
    "The Covid swing is visually large. After noticing it, spend a moment on the pre- and post-Covid years."
  ],
  [
    "Correlation is high in levels, modest in growth",
    "The statistical check weakens the simple GDP story.",
    "Level correlations are high because registrations, GDP and population-linked income all rose over two decades. Growth correlations ask whether the annual changes move together, and those are more modest once Covid years are excluded. Nominal growth lines up better than real growth because vehicle purchases happen in current rupees.",
    "It gives the reader a compact test of the GDP claim without pretending correlation is a model.",
    "Bars closer to 1 mean a tighter positive relationship. Compare the level section with the growth section rather than reading only the largest number.",
    "Do not overread level correlations between two rising time series. They can look strong even when year-to-year movement is loose.",
    "Small labels are enough here. The visual point is that the growth bars are shorter than the level bars."
  ],
  [
    "Motorisation rose even after population is counted",
    "New registrations per 1,000 people rose about fivefold by 2024.",
    "This chart answers the simplest objection to the headline: maybe registrations rose because India had more people. The per-capita view says no. The flow of new registrations rose much faster than population, which means the average resident was living in a more motorised economy.",
    "It separates motorisation from population scale.",
    "Read the line as annual new registrations per 1,000 residents. It is a flow measure for each year.",
    "Do not read it as vehicles owned per 1,000 people. It does not include the existing fleet or scrapped vehicles.",
    "The line is intentionally simple. Upward means registrations were outpacing population."
  ],
  [
    "Still a two-wheeler country",
    "Even after the boom, roughly seven in ten registrations are two-wheelers.",
    "This is the article's composition anchor. The national market grew enormously, but the dominant vehicle remained the practical, lower-cost two-wheeler, not the car. That changes the social reading of motorisation: access, commuting and livelihoods matter as much as middle-class car aspiration.",
    "It guards the story against a car-centric frame.",
    "Each line is a vehicle-class bucket's share of total fiscal-year registrations. Compare the large two-wheeler share with the much smaller car, three-wheeler, tractor and goods-vehicle shares.",
    "Do not compare these shares with kilometres travelled, congestion impact or emissions. A small class by registration share can still matter a lot in use.",
    "The two-wheeler line will dominate. Use the smaller lines to see what changed beneath it."
  ],
  [
    "Petrol still dominates, diesel fades, EVs arrive",
    "The fuel mix changed, but petrol still rules the registration base.",
    "The chart shows three things at once: petrol remains the national base, diesel has lost ground, and battery EVs have become visible. That is a more accurate transition story than either 'nothing changed' or 'EVs took over'.",
    "It connects vehicle growth to energy demand without overstating the EV transition.",
    "Each line is a fuel bucket's share of fiscal-year registrations. Petrol includes petrol-hybrid, diesel includes diesel-hybrid, and battery EV combines VAHAN's electric BOV and pure EV labels.",
    "Do not read registration share as fleet share or energy use. Older vehicles and different usage intensity matter.",
    "The EV line is small but important. Watch its lift without losing sight of petrol's much larger base."
  ],
  [
    "EVs went from footnote to millions",
    "The EV count shows the absolute scale behind the share.",
    "A rising share from a tiny base can look dramatic, so the count is needed. This chart shows that the EV story is no longer just a percentage trick: annual battery EV registrations have reached the millions. It still does not tell us the existing EV fleet or kilometres driven.",
    "It proves that the EV wedge is numerically meaningful, not only visually noticeable.",
    "Read the y-axis as annual registrations in the battery EV bucket. The post-2020 lift is the feature to watch.",
    "Do not treat this as all EVs on the road, charging demand, or fuel saved. It is new registrations in a year.",
    "Focus on the change in order of magnitude rather than small early-year movements."
  ],
  [
    "Where the extra vehicles came from",
    "Large state markets added the most new annual registrations.",
    "The state chart grounds the national boom geographically. Uttar Pradesh, Maharashtra, Gujarat and Tamil Nadu added very large annual flows, but the broader list shows that the expansion was not confined to a few metros. It became a state-capacity question across dealer networks, roads, registration offices, fuel and finance.",
    "It shows where the physical road economy expanded most in absolute terms.",
    "Each bar is calendar-year 2025 registrations minus calendar-year 2003 registrations for that state.",
    "Do not read this as a per-capita ranking. Large states naturally have more people and can add more vehicles in absolute terms.",
    "On mobile, read the ranking and the gap between the top states. Exact bar labels are secondary."
  ],
  [
    "The festival spike is real",
    "October and November surges are a real feature of the monthly data.",
    "Annual charts make vehicle demand look smoother than it is. Monthly seasonality shows how festive purchases, dealer offers, auspicious dates, model timing and inventory can concentrate demand into a few weeks. That is why one month can look very different from the months around it.",
    "It explains the spikes in the headline monthly chart instead of treating them as noise.",
    "Compare the same month across recent complete years and look for the late-year hump.",
    "Do not assume the peak month is identical every year. Diwali and related purchase windows move across the calendar.",
    "Trace the hump rather than trying to read every crowded month label."
  ],
  [
    "Transport inflation hit rural India harder",
    "The broad transport-and-communication CPI rose more in rural India than urban India.",
    "This chart broadens affordability beyond petrol and diesel. The rural line being higher matters because mobility can be both a cost pressure and an access tool: households face rising transport costs, but a two-wheeler can still be the practical route to work, school, markets and health care.",
    "It adds the household-cost context that the registration charts cannot show.",
    "All lines are CPI indexes with 2012 as the base year. Higher values mean the transport-and-communication basket became more expensive relative to that base.",
    "Do not read this as the private cost of running a vehicle. It is a broad CPI subgroup that also includes transport services and communication.",
    "The rural-urban gap is the main mobile takeaway."
  ],
  [
    "Petrol and diesel are only one part of that cost",
    "Diesel's CPI index rose faster than petrol's after the 2012 base.",
    "Fuel CPI narrows the affordability lens to direct running-cost pressure. Diesel matters for goods vehicles, tractors, taxis and parts of rural and commercial mobility, while petrol matters heavily for two-wheelers and many passenger vehicles. The split helps explain why fuel pressure can be different across vehicle classes.",
    "It separates pump-related pressure from the broader transport CPI basket.",
    "Read the lines as price indexes, not rupees per litre. The chart shows relative movement from the 2012 base.",
    "Do not ignore state taxes, usage intensity or vehicle efficiency. Different households and businesses experience the same index differently.",
    "The diesel line is the one to compare against petrol."
  ],
  [
    "Transport CPI is not a simple demand brake",
    "The CPI-registration correlation is small and mostly positive.",
    "This chart answers the user's key doubt directly. If higher transport prices were a simple brake, we would expect strong negative correlations with registration growth. Instead the associations are small and mostly positive, which suggests that demand, prices, credit and supply can rise together in an expanding economy.",
    "It stops the article from making a lazy affordability claim.",
    "Bars show Pearson correlations between monthly year-on-year registration growth and CPI inflation measures. The Covid-excluded rows remove 2020 and 2021 to avoid shock dominance.",
    "Do not call this causal. It is only an association check and does not control for income, credit, seasonality, policy or supply.",
    "The message is in the small size of the bars, not in the second decimal place."
  ],
  [
    "Credit helped keep the engine turning",
    "Outstanding vehicle loans more than doubled after 2019.",
    "Credit helps explain how registrations can rise faster than real income alone. The loan-stock line rises steadily while registrations swing around Covid and then recover. That points to the EMI economy behind vehicle access, but the measure is still outstanding debt, not fresh monthly loans.",
    "It gives the article a financing mechanism instead of leaving income as the only demand channel.",
    "Both lines are indexed to January 2019 so their growth can be compared on the same scale.",
    "Do not call loan stock new lending or the number of financed registrations. Repayments, loan tenure and loan size also change the stock.",
    "Watch the credit line's steady climb against the more volatile registration line."
  ],
  [
    "Credit growth and registrations do not move one-for-one",
    "Loan-stock growth is steadier than registration growth.",
    "This is the growth-rate check behind the credit story. Registrations jump and fall sharply around Covid, recovery months and seasonal demand, while outstanding vehicle-loan growth moves more slowly because it is a stock on bank balance sheets. That contrast is exactly why the article should not treat credit growth as a direct count of financed vehicles.",
    "It adds a more honest test than the indexed stock chart: not just whether credit became larger, but whether its momentum matched registrations.",
    "Both lines are monthly year-on-year growth rates over the overlapping VAHAN and RBI/IndiaDataHub window. Compare direction and volatility, not only the latest value.",
    "Do not read loan-stock growth as fresh vehicle-loan disbursement growth. The stock changes with new loans, repayments, loan tenure, interest rates, ticket size and older balances.",
    "On mobile, focus on the smoother credit line versus the more jagged registration line."
  ],
  [
    "The industry-side check says the same thing",
    "SIAM's wholesale mix also remains two-wheeler-heavy.",
    "SIAM measures domestic wholesale sales, so it sits at a different point in the chain from VAHAN registrations. The FY 2025-26 mix still being dominated by two-wheelers is useful corroboration: the same composition story appears from both the industry side and the registration side.",
    "It brings in an independent source without using it as the article backbone.",
    "Read the bars as FY 2025-26 domestic wholesale sales by category.",
    "Do not compare SIAM wholesale counts one-for-one with VAHAN registrations. Dispatches, inventory, timing and category definitions differ.",
    "The large two-wheeler bar is the point. Passenger vehicles are visible but far smaller."
  ],
  [
    "EVs plug into a still-carbon-heavy grid",
    "Renewables are rising, but the grid is not yet clean.",
    "EV adoption shifts part of the transport-energy question from fuel pumps to electricity generation. Ember's data shows renewables and wind-plus-solar gaining share, which improves the future case for electric kilometres. But the generation mix remains far from clean.",
    "It gives the EV section the electricity-system context it needs.",
    "Read the lines as percent of electricity generation in Ember's India data.",
    "Do not treat this as EV adoption data or a lifecycle-emissions calculation. It is grid context.",
    "Compare renewables with wind and solar to see both broad clean generation and the variable-renewables subset."
  ],
  [
    "The grid is cleaner, but still not clean",
    "Carbon intensity fell to about 671 gCO2 per kWh in 2025.",
    "This is the emissions context for future EV kilometres. Lower carbon intensity means each unit of electricity is less carbon-heavy than before, so EVs become cleaner as the grid improves. The level is still high, which keeps the climate conclusion conditional rather than triumphant.",
    "It closes the loop between EV registrations and the power system.",
    "Lower values mean less CO2 per unit of electricity generated.",
    "Do not include battery manufacturing, charging-time effects or vehicle lifetime in this single line. Those require a separate lifecycle analysis.",
    "The latest downward move matters, but the level is still the main caution."
  ]
];

const detailAdditions = {
  "The motorisation curve starts in 2003": "The key is not only that the line rises. It changes regime: early years look like a smaller, thinner vehicle economy, while the 2020s look like a national machine capable of registering tens of lakh vehicles in a normal month. That makes the later composition charts necessary, because a line this big can hide very different kinds of vehicles.",
  "Seven times more new vehicles a year": "A sevenfold flow is large enough to reshape more than the auto industry. It affects road use, insurance, repair markets, household debt, fuel demand and state administration. This is why registrations are a better backbone for this story than only production or company sales.",
  "Registrations outran real income, but not nominal India": "The gap with real income is the first clue that motorisation was not just a smooth prosperity story. Cheaper vehicle formats, more credit, more dealer reach and the utility of two-wheelers all helped registrations run ahead of real per-person income. The nominal line is useful because the rupee economy, not a constant-price abstraction, is where down payments and EMIs happen.",
  "The year-to-year link is weaker than the level chart": "This is where the story becomes less linear. A household can delay a purchase because fuel is expensive, bring it forward because finance is available, or buy during a festival month even if GDP growth has not changed much. The chart therefore moves the reader from macro trend to vehicle-market behaviour.",
  "Correlation is high in levels, modest in growth": "The split between levels and growth is the whole lesson. In levels, almost every big India series rises together after 2003, so correlation can flatter the story. In growth rates, the relationship survives but weakens, which is a better fit for a market shaped by income plus credit, prices, policy, supply and sentiment.",
  "Motorisation rose even after population is counted": "This does not mean India has become a high-ownership country by global standards. It means the yearly flow of new registrations became much larger relative to the population. That can come from first-time access, replacement demand, households adding another vehicle, or commercial vehicles expanding with local economies.",
  "Still a two-wheeler country": "This chart is the antidote to the SUV-led public image of motorisation. The typical new registered vehicle is still far more likely to be a two-wheeler than a car, which points to affordability, parking, congestion and daily access rather than only status consumption. It also means the EV transition, credit market and fuel-price story have to be read through two-wheelers, not only passenger cars.",
  "Petrol still dominates, diesel fades, EVs arrive": "The fuel transition is real, but it sits on top of a petrol-heavy base. Diesel's decline changes the story for passenger vehicles and some commercial use, while EV growth is now visible enough to matter for policy and infrastructure. The chart is deliberately about registrations, because the existing fleet will change more slowly than the new-flow mix.",
  "EVs went from footnote to millions": "The absolute count matters because it separates a meaningful transition from a tiny-base percentage story. Millions of annual EV registrations can alter dealer behaviour, charging demand, battery supply chains and city-level transport policy. But it still leaves open the harder questions: vehicle class, kilometres driven, charging time and fuel actually displaced.",
  "Where the extra vehicles came from": "The state ranking shows where the boom became administratively and physically visible. A state adding lakhs or millions of annual registrations also has to absorb more traffic, credit demand, service shops, fuel or charging infrastructure and enforcement work. The chart is intentionally absolute because absolute additions are what hit roads and institutions first.",
  "The festival spike is real": "This is demand timing, not just demand level. In India, vehicles are often bought around auspicious dates, discounts, dealer campaigns and family decisions that cluster purchases. That makes monthly registrations partly a cultural and retail calendar, not only an economic indicator.",
  "Transport inflation hit rural India harder": "The rural-urban gap matters because rural mobility is often less optional. When buses are sparse, work sites are far, or health and education access require travel, a two-wheeler can remain necessary even when mobility costs rise. That is why transport CPI can be pressure and motivation at the same time.",
  "Petrol and diesel are only one part of that cost": "Fuel indexes tell us about running-cost pressure after purchase, but they do not map neatly onto one household decision. A tractor, a goods carrier, a taxi, a scooter and a weekend car face different fuel exposure. The chart should therefore be read as a cost backdrop that interacts with vehicle class, use intensity and local taxation.",
  "Transport CPI is not a simple demand brake": "This is the article's guardrail against an attractive but weak claim. If price pressure were the dominant monthly brake, the bars should be clearly negative. They are not, which points to a messier reality where expansion, inflation, credit, supply constraints and seasonality can occur together.",
  "Credit helped keep the engine turning": "The indexed stock chart is about balance-sheet scale. It shows that vehicle credit became a much larger channel during the same period in which registrations recovered and reached new highs. The important interpretation is mechanism: credit can turn future income into current mobility, but the stock line cannot identify individual financed purchases.",
  "Credit growth and registrations do not move one-for-one": "This is the check that keeps the credit story honest. Registrations are a flow and can jump sharply in a month; loan stock is an accumulated balance and naturally moves more smoothly. If the two lines do not match month to month, that is not a failure of the credit story, it is a reminder that stock and flow answer different questions.",
  "The industry-side check says the same thing": "The value of SIAM here is independence, not exact matching. Wholesale dispatches happen before registration and can be affected by inventory, but the mix still tells the same broad story: two-wheelers dominate the Indian vehicle market. When two separate measurement points agree on structure, the composition claim becomes stronger.",
  "EVs plug into a still-carbon-heavy grid": "This chart keeps the EV section from becoming tailpipe-only. An electric vehicle moves emissions away from the street, but the climate effect depends on the electricity system that charges it. Rising renewables improve that equation, while the remaining fossil-heavy grid keeps the conclusion conditional.",
  "The grid is cleaner, but still not clean": "Carbon intensity is the compact way to express that condition. A lower number makes each electric unit cleaner than before, but the absolute level still matters because India generates a huge volume of power from fossil fuels. The EV story therefore improves over time if adoption and grid cleaning move together."
};

const explainers = explainerRows.map(([visualId, takeaway, detail, whyShowThis, howToRead, mistakeToAvoid, mobileNote]) => ({
  visualId,
  title: visualId,
  takeaway,
  detail: [detail, detailAdditions[visualId]].filter(Boolean).join(" "),
  whyShowThis,
  howToRead,
  mistakeToAvoid,
  mobileNote
}));

const artifact = {
  schemaVersion: 1,
  questionId: "q.econ.motorisation",
  status: "ready",
  dataThrough: "VAHAN through 2026-06-13; full fiscal years through FY 2025-26",
  short: {
    headline: "Seven times more vehicles, still a two-wheeler country",
    dek: "VAHAN registrations show India motorised at astonishing scale after 2003. But the road filled mostly with two-wheelers, while diesel faded, EVs arrived, and income explained only part of the ride.",
    body: "India recorded about 4.4 million VAHAN registrations in FY 2003-04. By FY 2025-26, it recorded about 30.8 million. Real income rose too, but the year-to-year link is not tight enough to make GDP the whole explanation. The deeper story is composition: roughly seven in ten registrations are still two-wheelers, petrol still dominates, EVs are now visible but not dominant, and credit, transport costs, festivals and state-level growth shape the pattern."
  },
  macha: {
    heading: "Okay, macha, what does this mean?",
    body: "India did not become America on wheels. It became India on wheels. More people bought vehicles, yes, but mostly the practical kind: scooters, motorcycles, three-wheelers, tractors, small goods vehicles, and only then cars. EVs are finally visible in the data, but petrol is still the base. GDP explains the long climb, not every bump on the road.",
    soWhat: "The vehicle boom is a story of access and aspiration, but also of congestion, fuel cost, credit and grid pressure."
  },
  article: {
    title: "Seven times more vehicles, still a two-wheeler country",
    standfirst: "From 2003 to today, VAHAN data captures one of India's biggest everyday transformations: the road became dramatically more motorised, but not in the car-first way people often imagine.",
    bodyMarkdown
  },
  editorialPlan: {
    audience: "Indian readers who want the economic story behind the vehicle boom",
    heroDescription: "A data-led article using VAHAN, MoSPI, SIAM, IndiaDataHub/RBI, World Bank and Ember to explain India's motorisation since 2003.",
    selectedDataPoints: [
      { label: "VAHAN registrations, FY 2003-04", reason: "Starting point for the article", use: "lede" },
      { label: "VAHAN registrations, FY 2025-26", reason: "Latest complete fiscal-year scale", use: "lede" },
      { label: "Two-wheeler registration share, FY 2025-26", reason: "Core composition point", use: "hero" },
      { label: "Battery EV registration share, FY 2025-26", reason: "Energy-transition point", use: "chart" },
      { label: "Transport CPI rural vs urban, Dec 2025", reason: "Affordability and rural-urban context", use: "chart" }
    ],
    pullQuotes: [
      { quote: "India registered roughly seven times as many vehicles in FY 2025-26 as in FY 2003-04.", numberLabel: "VAHAN registrations, FY 2025-26" },
      { quote: "Two-wheelers still account for roughly seven in ten new registrations.", numberLabel: "Two-wheeler registration share, FY 2025-26" }
    ],
    glossaryBlocks: [
      { term: "VAHAN registrations", plainMeaning: "Vehicles recorded in the government's registration system.", whyItMattersHere: "This is closer to vehicles entering the road fleet than factory dispatches, but it is not the same as ownership or kilometres driven.", keyTerm: true },
      { term: "Fiscal year", plainMeaning: "India's accounting year from April to March.", whyItMattersHere: "The article uses fiscal years to compare VAHAN with GDP and SIAM." },
      { term: "Correlation", plainMeaning: "A number showing how closely two series move together.", whyItMattersHere: "It helps test whether GDP, CPI or fuel prices move with registrations, but it does not prove causation.", keyTerm: true },
      { term: "Transport CPI", plainMeaning: "The consumer price index subgroup for transport and communication.", whyItMattersHere: "It captures a broad mobility-cost backdrop, not only private fuel cost.", keyTerm: true },
      { term: "Loan stock", plainMeaning: "The outstanding amount of loans still on bank books.", whyItMattersHere: "Vehicle-loan stock shows financing scale, but it is not the same as new loans issued in a month.", keyTerm: true },
      { term: "Carbon intensity", plainMeaning: "CO2 emitted per unit of electricity generated.", whyItMattersHere: "EVs get cleaner as the grid's carbon intensity falls.", keyTerm: true }
    ]
  },
  chartExplainers: explainers,
  sectionVisualMap: headings.map(([heading, visualId]) => ({ heading, visualId })),
  sourceNotes: [
    "VAHAN dashboard tables provide monthly registrations by state, vehicle class and fuel from 2003 into June 2026.",
    "MoSPI NAS provides GDP and per-capita GDP; MoSPI CPI provides transport, rural, urban, petrol and diesel price indexes.",
    "SIAM public pages and the FY 2025-26 press release provide domestic wholesale sales by category.",
    "IndiaDataHub's RBI banking feed provides outstanding vehicle-loan stock adjusted for mergers.",
    "World Bank total population is used for registrations per 1,000 people.",
    "Ember electricity data provides grid generation shares and carbon intensity for EV charging context."
  ],
  caveats: [
    "VAHAN measures registrations, not total vehicle ownership, vehicle kilometres, scrappage, production or wholesale sales.",
    "The 2026 VAHAN monthly data is partial through June 13, 2026; full-year comparisons use complete fiscal years through FY 2025-26 or calendar years through 2025.",
    "Vehicle-class and fuel buckets are derived groupings for readability and do not capture every regulatory nuance.",
    "Correlations are descriptive association tests and do not prove causation.",
    "SIAM is wholesale domestic sales, not registrations; the public scrape has a gap between FY 2013-14 and FY 2025-26.",
    "Ember is electricity data, not EV registration data, and the grid charts are not a lifecycle-emissions calculation.",
    "Transport CPI includes transport services and communication items, so it should be read as a broad mobility-cost backdrop rather than only private vehicle running cost.",
    "Vehicle-loan data is outstanding stock, not fresh loan originations, so it cannot identify how many registrations were financed."
  ],
  lockedNumbersUsed: [
    "VAHAN registrations rose from 4.4 million in FY 2003-04 to 30.8 million in FY 2025-26.",
    "Battery EVs were about 8.25% of FY 2025-26 registrations.",
    "Two-wheelers were about 72% of FY 2025-26 registrations.",
    "New registrations per 1,000 people rose from about 3.8 in 2003 to about 18.8 in 2024.",
    "Rural transport-and-communication CPI was about 178.5 in December 2025; urban was about 166.9.",
    "Ember puts India's 2025 electricity carbon intensity at about 671 gCO2/kWh."
  ],
  qualityFlags: [],
  generatedAt: new Date().toISOString(),
  model: "manual-editorial-build",
  generationPasses: [{ name: "manual", model: "manual-editorial-build" }],
  evidence: {
    schemaVersion: 1,
    questionId: question.id,
    question: question.question,
    priority: question.priority,
    theme: "economy",
    requiredIndicatorIds: question.core,
    availableIndicatorIds: [...question.core, ...(question.context || [])],
    themeIndicatorIds: [...question.core, ...(question.context || [])],
    visualPlan: question.visualPlan,
    plannedCharts: question.visualPlan,
    selectedDataPoints: [],
    lockedNumbers: [
      { label: "VAHAN registrations, FY 2003-04", value: 4416663, displayValue: "4.4 million", date: "2004-03-31", unit: "registrations", sourceId: "vahan-derived", indicatorId: "auto.vahan.registrations.total_fy" },
      { label: "VAHAN registrations, FY 2025-26", value: 30838645, displayValue: "30.8 million", date: "2026-03-31", unit: "registrations", sourceId: "vahan-derived", indicatorId: "auto.vahan.registrations.total_fy" },
      { label: "Two-wheeler share, FY 2025-26", value: 71.867529, displayValue: "about 72%", date: "2026-03-31", unit: "% of registrations", sourceId: "vahan-derived", indicatorId: "auto.vahan.vehicle.two_wheelers.share_fy" },
      { label: "Battery EV share, FY 2025-26", value: 8.253994, displayValue: "8.25%", date: "2026-03-31", unit: "% of registrations", sourceId: "vahan-derived", indicatorId: "auto.vahan.fuel.ev_battery.share_fy" },
      { label: "Registrations per 1,000 people, 2024", value: 18.772, displayValue: "18.8", date: "2024", unit: "registrations per 1,000 people", sourceId: "vahan-derived", indicatorId: "auto.vahan.registrations.per_1000_people" }
    ],
    sourceSummaries: [],
    selectionRules: [],
    caveats: [],
    forbiddenClaims: ["Do not claim VAHAN registrations equal vehicle ownership.", "Do not claim Ember is EV India data.", "Do not claim correlation proves causation."]
  }
};

await writeFile("data/explanations/en/q.econ.motorisation.json", `${JSON.stringify(artifact, null, 2)}\n`);
console.log("Wrote data/explanations/en/q.econ.motorisation.json");
