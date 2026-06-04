import fs from "node:fs";

const path = "data/explanations/en/q.energy.system.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

doc.short = "India's electricity is still coal-led, but the wider energy story is imported fuel: crude oil dominates the bill, Russia has become the largest crude supplier, and PPAC's Indian crude basket shows why price matters as much as volume.";
doc.macha = "Coal runs the grid. Imported oil drains the wallet. Clean power is growing, but it is climbing against rising demand and a huge fuel-import bill.";

doc.article.title = "What powers India?";
doc.article.bodyMarkdown = `## What generates India's electricity?

India's electricity is still overwhelmingly coal-driven. In 2025, coal generated 1,474 TWh, or 70.8% of total generation. Clean sources together generated 555 TWh, or 26.7%. Gas was much smaller at 48.5 TWh, or 2.3%. So the first answer to "what powers India?" is simple for electricity: coal is the backbone, clean power is now a serious second block, and gas is marginal.

## How has the electricity mix changed over time?

The long-run chart shows why the transition feels slow even when renewables are growing fast. Coal generation rose from 390 TWh in 2000 to 1,474 TWh in 2025. Clean generation rose from 96 TWh to 555 TWh over the same period, which is a much faster multiple, but still a smaller absolute base. Gas went the other way, from 56 TWh in 2000 to 48.5 TWh in 2025. The grid is getting cleaner at the margin, but coal has not disappeared; it has grown with demand.

## How much crude oil does India import each month?

PPAC's current 2025-26 report shows crude oil imports of 245.4 million tonnes for the fiscal year. Monthly crude imports were consistently large, mostly around 19 to 22 million tonnes: 21.0 million tonnes in April 2025, a low of 18.9 million tonnes in July, and a high of 21.6 million tonnes in December. In value terms, PPAC reports a crude import bill of $123.1 billion. Oil is the big import-exposure layer of India's energy system.

## What India pays per barrel

The PPAC Indian crude basket puts a price on that dependence. The endpoint gives usable fiscal-year averages of $44.6/bbl in 2020-21, $78.9/bbl in 2021-22, $82.5/bbl in 2023-24, and $78.6/bbl in 2024-25. Its latest current row is 2026-27 year-to-date, averaging $110.4/bbl from the available months. That latest point is not a full-year average, but it shows the pressure clearly: when the basket price rises, the same crude-import volume costs many more dollars.

## Fuel import bill in dollars

Put the fuel imports next to each other and crude oil dominates. In 2025-26, PPAC puts crude oil imports at $123.1 billion. TradeStat puts coal imports at $26.7 billion. PPAC puts petroleum product imports at $20.9 billion and LNG imports at $13.3 billion. Together, these four buckets are about $184 billion. The electricity story begins with coal, but the macroeconomic story begins with the import bill.

## Fuel import bill in rupees

The rupee view makes the scale more legible for Indian readers. In 2025-26, crude oil imports cost ₹10,88,904 crore. Coal imports cost ₹2,35,954 crore. Petroleum product imports cost ₹1,83,890 crore. LNG imports cost ₹1,17,542 crore. Crude is the largest by far, but coal, products, and LNG together are still large enough to matter for the trade balance and for any serious energy-security story.

## Which countries supply India's crude oil?

TradeStat's 2025-26 partner table shows the current crude import map. Russia is the largest supplier by value at $40.8 billion, followed by Iraq at $23.1 billion, Saudi Arabia at $19.5 billion, the UAE at $15.1 billion, and the US at $9.9 billion. Kuwait, Nigeria, Angola, Brazil, and Qatar follow. This is the latest origin snapshot; the next chart shows how unusual Russia's rise is when viewed over time.

## How did Russia become India's top crude supplier?

Russia was not literally zero in the earlier TradeStat window, but it was small. In 2017-18 India imported about $1.2 billion of Russian crude, ranked 14th among suppliers. It stayed small through 2021-22, then jumped to $31.0 billion in 2022-23, became number one at $46.5 billion in 2023-24, peaked at $50.3 billion in 2024-25, and still led at $40.8 billion in 2025-26. At the same time, Iran falls from $9.0 billion in 2017-18 and $12.1 billion in 2018-19 to zero in later years. This is the clearest geopolitical shift in the energy-trade data.

## Where does India import its coal from?

Coal still powers most electricity, and imported coal adds another dependency layer. TradeStat's 2025-26 HS 2701 table has Australia and Indonesia almost tied at the top, with $6.2 billion each. Russia follows at $3.4 billion, the US at $3.3 billion, and South Africa at $2.9 billion. These are value rankings, not heat-content rankings, so price and coal grade both affect the order.

## Which countries supply India's LNG?

LNG is smaller than crude and coal, but it is still a named import channel. TradeStat's 2025-26 LNG table is led by Qatar at $5.6 billion, followed by the UAE at $1.5 billion, the US at $1.4 billion, Angola at $1.3 billion, Oman at $1.2 billion, and Nigeria at $1.2 billion. This is LNG under HS 271111, not pipeline gas.

## How much LNG does India import each month?

PPAC reports 25.8 million tonnes of LNG imports in 2025-26, equal to 34,216 MMSCM, with a value of $13.3 billion. Monthly LNG imports usually sit around 2.0 to 2.4 million tonnes, with September and October both around 2.44 million tonnes. PPAC marks the March 2026 value as provisional, so the final row can move when official trade data is finalized.

## What about petroleum product imports?

India imports crude at a much larger scale than finished petroleum products, but product imports are not zero. PPAC puts petroleum product imports at $20.9 billion in 2025-26, while product exports are $41.1 billion. TradeStat's product-origin table is led by Russia at $3.5 billion, Korea at $1.2 billion, the UAE at $1.1 billion, Iraq at $698 million, Singapore at $532 million, and Qatar at $401 million. India is a major refiner, but it still imports selected products.

## Is India's electricity grid getting cleaner?

Yes, per unit. Ember's carbon-intensity series falls from about 740 gCO2/kWh in 2000 to about 670 gCO2/kWh in 2025. That is real progress, but it is gradual because coal generation remains large. The country can make each unit of electricity cleaner while total generation, and therefore total fuel demand, keeps rising.

## How fast is electricity demand climbing?

Electricity demand rose from 573 TWh in 2000 to 2,083 TWh in 2025. Per-capita electricity demand rose from 0.5 MWh to 1.4 MWh over the same period. This is the core constraint on the transition: clean generation has to grow against a moving target. The system is not just replacing old coal; it is trying to meet new demand at the same time.`;

doc.editorialPlan = {
  audience: "average Indian reader",
  heroDescription: "India's electricity is coal-led, but the wider energy story is imported fuel: crude dominates the bill, Russia now leads crude supply, and PPAC's crude basket shows why price matters.",
  selectedDataPoints: [
    { label: "Coal generation, 2025", reason: "Core electricity-mix fact", use: "hero" },
    { label: "Clean generation, 2025", reason: "Shows the second block in the grid", use: "hero" },
    { label: "Crude oil import bill, 2025-26", reason: "Largest imported-fuel cost", use: "hero" },
    { label: "Indian crude basket price, 2026-27 YTD", reason: "Explains the price pressure behind the bill", use: "chart" },
    { label: "Russia crude imports, 2017-18 to 2025-26", reason: "Most important country-origin shift", use: "chart" },
    { label: "Electricity demand, 2000 to 2025", reason: "Frames the transition challenge", use: "chart" }
  ],
  pullQuotes: [
    { quote: "Coal generated 1,474 TWh of India's electricity in 2025, about 71% of the total.", numberLabel: "Coal generation, 2025" },
    { quote: "Crude oil imports cost $123.1 billion, or ₹10,88,904 crore, in 2025-26.", numberLabel: "Crude oil import bill, 2025-26" },
    { quote: "Russia rose from a small crude supplier in 2017-18 to India's largest in 2025-26.", numberLabel: "Russia crude imports, 2017-18 to 2025-26" }
  ],
  glossaryBlocks: [
    {
      term: "TWh",
      plainMeaning: "A terawatt-hour is a unit for very large amounts of electricity. It is useful for national power systems because household-scale units are too small.",
      whyItMattersHere: "India generated 2,083 TWh of electricity in 2025, so the page uses TWh to compare coal, clean power, gas, and demand."
    },
    {
      term: "Carbon intensity",
      plainMeaning: "Carbon intensity measures grams of CO2 released per kilowatt-hour of electricity. Lower values mean each unit of power is cleaner.",
      whyItMattersHere: "India's electricity carbon intensity fell from about 740 to 670 gCO2/kWh between 2000 and 2025, even though total demand rose."
    },
    {
      term: "Crude basket price",
      plainMeaning: "India's crude basket price is the average price of the crude oil grades India buys. It is not the same thing as Brent or WTI.",
      whyItMattersHere: "PPAC's latest current row puts the basket at $110.4/bbl for 2026-27 year-to-date, while the completed 2024-25 average was $78.6/bbl."
    },
    {
      term: "LNG",
      plainMeaning: "Liquefied natural gas is natural gas cooled into liquid form so it can be shipped by sea, then turned back into gas after arrival.",
      whyItMattersHere: "PPAC reports 25.8 million tonnes of LNG imports in 2025-26, worth $13.3 billion."
    }
  ]
};

doc.dataSelectionAudit = {
  areSelectedDataPointsGood: "yes, the selected points cover electricity generation, import volumes, import spend, crude price, partner origins, demand, and grid intensity",
  addDataPoints: [
    "A more complete PPAC crude-basket archive if PPAC exposes older annual rows or a stable downloadable workbook",
    "Coal import volumes by grade if the article later separates thermal coal from coking coal"
  ],
  removeDataPoints: [
    "Coke imports are not used in the article because the core story is electricity, crude oil, coal, LNG, and petroleum products."
  ],
  visualizationDecisions: [
    { indicatorOrVisual: "Electricity generation by source", bestChartType: "stacked bar plus selected fuel trends", timeWindow: "2025 for mix, 2000-2025 for trends", frequency: "annual", reason: "This gives both the current power mix and the direction of change." },
    { indicatorOrVisual: "Crude oil imports by month", bestChartType: "monthly bars", timeWindow: "2025-26", frequency: "monthly fiscal-year report", reason: "PPAC monthly bars show the physical flow behind the import bill." },
    { indicatorOrVisual: "Indian crude basket price", bestChartType: "line chart", timeWindow: "usable PPAC rows from 2020-21 to 2026-27 YTD", frequency: "fiscal-year average or current-row YTD", reason: "The price line explains why the same crude volume can become much more expensive." },
    { indicatorOrVisual: "Fuel import spend by category", bestChartType: "horizontal bars for dollars and rupees", timeWindow: "2025-26", frequency: "annual fiscal-year snapshot", reason: "Bars compare crude oil, coal, petroleum products, and LNG without overloading the reader." },
    { indicatorOrVisual: "Crude oil imports by partner", bestChartType: "horizontal bars plus country-history line chart", timeWindow: "latest partner table and 2017-18 to 2025-26 history", frequency: "annual fiscal-year tables", reason: "The latest chart identifies suppliers, while the history chart explains Russia's rise." },
    { indicatorOrVisual: "Electricity demand and carbon intensity", bestChartType: "line charts", timeWindow: "2000-2025", frequency: "annual", reason: "They close the story by showing cleaner units but rising demand." }
  ]
};

doc.sectionVisualMap = [
  { heading: "What generates India's electricity?", visualId: "electricity-is-the-visible-layer" },
  { heading: "How has the electricity mix changed over time?", visualId: "coal-clean-power-and-gas-generation" },
  { heading: "How much crude oil does India import each month?", visualId: "crude-oil-imports-in-2025-26" },
  { heading: "What India pays per barrel", visualId: "what-india-pays-per-barrel" },
  { heading: "Fuel import bill in dollars", visualId: "fuel-import-bill-in-dollars" },
  { heading: "Fuel import bill in rupees", visualId: "fuel-import-bill-in-rupees" },
  { heading: "Which countries supply India's crude oil?", visualId: "where-india-s-crude-oil-imports-come-from" },
  { heading: "How did Russia become India's top crude supplier?", visualId: "how-russia-became-a-major-crude-supplier" },
  { heading: "Where does India import its coal from?", visualId: "where-india-s-coal-imports-come-from" },
  { heading: "Which countries supply India's LNG?", visualId: "where-india-s-lng-imports-come-from" },
  { heading: "How much LNG does India import each month?", visualId: "lng-import-volumes-in-2025-26" },
  { heading: "What about petroleum product imports?", visualId: "where-petroleum-product-imports-come-from" },
  { heading: "Is India's electricity grid getting cleaner?", visualId: "the-grid-is-getting-cleaner-per-unit" },
  { heading: "How fast is electricity demand climbing?", visualId: "electricity-demand-keeps-climbing" },
];

doc.chartExplainers = [
  {
    visualId: "electricity-is-the-visible-layer",
    title: "Electricity is the visible layer",
    takeaway: "Coal supplies 70.8% of India's electricity, while clean sources make up 26.7%.",
    detail: "This stacked bar shows the 2025 electricity generation mix. Coal is the largest block at 1,474 TWh. Clean sources together produce 555 TWh. Gas is much smaller at 48.5 TWh. Read this as the electricity layer only; oil, coal imports, and LNG imports sit outside the grid chart.",
    whyShowThis: "It gives the clearest power-sector answer to the page question.",
    howToRead: "Compare the coal block with the clean and gas blocks.",
    mistakeToAvoid: "Do not treat the electricity mix as the whole energy system.",
    mobileNote: "Keep coal, clean, and gas labels visible."
  },
  {
    visualId: "coal-clean-power-and-gas-generation",
    title: "Coal, clean power, and gas generation",
    takeaway: "Coal is still much larger in absolute generation, even as clean power grows faster.",
    detail: "Coal rose from 390 TWh in 2000 to 1,474 TWh in 2025. Clean generation rose from 96 TWh to 555 TWh. Gas fell from 56 TWh to 48.5 TWh. The clean line has grown quickly, but the coal line remains the top line.",
    whyShowThis: "It shows absolute work done by each fuel group, not just shares.",
    howToRead: "The vertical axis is TWh; higher lines mean more electricity generated.",
    mistakeToAvoid: "Do not infer falling coal generation from rising clean share.",
    mobileNote: "Use end labels for the three lines."
  },
  {
    visualId: "crude-oil-imports-in-2025-26",
    title: "Crude oil imports in 2025-26",
    takeaway: "PPAC reports 245.4 million tonnes of crude imports in 2025-26.",
    detail: "Monthly crude imports mostly sit around 19 to 22 million tonnes. April is 21.0 million tonnes, July is 18.9 million tonnes, and December is 21.6 million tonnes. The annual crude import bill is $123.1 billion.",
    whyShowThis: "It shows the physical flow behind the oil-import bill.",
    howToRead: "Each bar is one fiscal-year month in thousand metric tonnes.",
    mistakeToAvoid: "Do not confuse tonnes with dollars; the price chart explains why similar volumes can cost more.",
    mobileNote: "Use short month labels."
  },
  {
    visualId: "what-india-pays-per-barrel",
    title: "What India pays per barrel",
    takeaway: "PPAC's latest current row puts the Indian crude basket at $110.4/bbl year-to-date for 2026-27.",
    detail: "The PPAC endpoint gives fiscal-year averages of $44.6/bbl in 2020-21, $78.9/bbl in 2021-22, $82.5/bbl in 2023-24, and $78.6/bbl in 2024-25. The latest 2026-27 point is a year-to-date current-row average, not a completed fiscal year.",
    whyShowThis: "It connects the import-volume story to the price India pays.",
    howToRead: "Higher points mean a larger dollar bill for the same crude volume.",
    mistakeToAvoid: "Do not present the 2026-27 point as a completed annual average.",
    mobileNote: "Label the latest point as YTD."
  },
  {
    visualId: "fuel-import-bill-in-dollars",
    title: "Fuel import bill in dollars",
    takeaway: "Crude oil alone cost $123.1 billion in 2025-26.",
    detail: "The chart compares four import buckets: crude oil at $123.1 billion, coal at $26.7 billion, petroleum products at $20.9 billion, and LNG at $13.3 billion. Crude dominates the dollar bill.",
    whyShowThis: "It shows the money scale of imported fuels.",
    howToRead: "Longer bars mean higher import value in US$ billions.",
    mistakeToAvoid: "Do not read spending as physical volume; fuels have different prices per unit.",
    mobileNote: "Horizontal bars keep labels readable."
  },
  {
    visualId: "fuel-import-bill-in-rupees",
    title: "Fuel import bill in rupees",
    takeaway: "Crude oil imports cost ₹10,88,904 crore in 2025-26.",
    detail: "The rupee chart shows crude oil at ₹10,88,904 crore, coal at ₹2,35,954 crore, petroleum products at ₹1,83,890 crore, and LNG at ₹1,17,542 crore.",
    whyShowThis: "It makes the import bill legible in Indian fiscal language.",
    howToRead: "Bars are in ₹ crore; 1 lakh crore is 1,00,000 crore.",
    mistakeToAvoid: "Do not treat the rupee chart as a separate dataset; it is the same import-bill comparison in Indian currency.",
    mobileNote: "Use compact Indian-number labels."
  },
  {
    visualId: "where-india-s-crude-oil-imports-come-from",
    title: "Where India's crude oil imports come from",
    takeaway: "Russia is the largest current crude supplier at $40.8 billion.",
    detail: "TradeStat's 2025-26 partner table ranks Russia first at $40.8 billion, then Iraq at $23.1 billion, Saudi Arabia at $19.5 billion, the UAE at $15.1 billion, and the US at $9.9 billion.",
    whyShowThis: "It identifies the current country-origin map for crude oil.",
    howToRead: "Bars are sorted by import value in US$ billions.",
    mistakeToAvoid: "Do not read this as barrel-equivalent supply; it is import value by partner country.",
    mobileNote: "Show the top suppliers with country labels."
  },
  {
    visualId: "how-russia-became-a-major-crude-supplier",
    title: "How Russia became a major crude supplier",
    takeaway: "Russia rose from $1.2 billion in 2017-18 to $50.3 billion in 2024-25, then $40.8 billion in 2025-26.",
    detail: "Russia ranked 14th in 2017-18, stayed small through 2021-22, jumped to $31.0 billion in 2022-23, and became the largest supplier in 2023-24. Iran moves the other way, falling to zero after 2019-20 in this series.",
    whyShowThis: "It explains why the current crude-origin chart looks so different from the pre-2022 pattern.",
    howToRead: "Follow the Russia line from the bottom group to the top.",
    mistakeToAvoid: "Do not say Russia was zero before 2022; it was small, not absent.",
    mobileNote: "Highlight Russia and keep the other major suppliers visible."
  },
  {
    visualId: "where-india-s-coal-imports-come-from",
    title: "Where India's coal imports come from",
    takeaway: "Australia and Indonesia are almost tied at about $6.2 billion each.",
    detail: "TradeStat's 2025-26 coal table shows Australia at $6.2 billion and Indonesia at $6.2 billion, followed by Russia at $3.4 billion, the US at $3.3 billion, and South Africa at $2.9 billion.",
    whyShowThis: "It connects coal-heavy electricity with the geography of imported coal.",
    howToRead: "Bars show import value by partner country.",
    mistakeToAvoid: "Do not confuse value rankings with heat-content or tonne rankings.",
    mobileNote: "Use horizontal bars."
  },
  {
    visualId: "where-india-s-lng-imports-come-from",
    title: "Where India's LNG imports come from",
    takeaway: "Qatar is the largest LNG supplier at $5.6 billion.",
    detail: "The 2025-26 LNG table is led by Qatar at $5.6 billion, the UAE at $1.5 billion, the US at $1.4 billion, Angola at $1.3 billion, Oman at $1.2 billion, and Nigeria at $1.2 billion.",
    whyShowThis: "It shows the partner-country exposure for imported gas.",
    howToRead: "Bars show TradeStat HS 271111 import value.",
    mistakeToAvoid: "Do not treat LNG as a major electricity fuel; gas is a small part of generation.",
    mobileNote: "Keep Qatar and the next five suppliers visible."
  },
  {
    visualId: "lng-import-volumes-in-2025-26",
    title: "LNG import volumes in 2025-26",
    takeaway: "PPAC reports 25.8 million tonnes of LNG imports in 2025-26.",
    detail: "Monthly LNG imports are mostly around 2.0 to 2.4 million tonnes. September and October are both near 2.44 million tonnes. PPAC marks the March 2026 value as provisional.",
    whyShowThis: "It complements the partner-value chart with physical import volumes.",
    howToRead: "Each bar is a month; the unit is million metric tonnes.",
    mistakeToAvoid: "Do not confuse MMT with MMSCM; the chart uses MMT.",
    mobileNote: "Use a simple monthly bar chart."
  },
  {
    visualId: "where-petroleum-product-imports-come-from",
    title: "Where petroleum product imports come from",
    takeaway: "Russia leads petroleum product import origins at $3.5 billion.",
    detail: "TradeStat's product-origin table is led by Russia at $3.5 billion, Korea at $1.2 billion, the UAE at $1.1 billion, Iraq at $698 million, Singapore at $532 million, and Qatar at $401 million. PPAC puts total product imports at $20.9 billion.",
    whyShowThis: "It shows that finished product imports exist even though India is a major refiner.",
    howToRead: "Bars show value by partner country.",
    mistakeToAvoid: "Do not confuse petroleum products with crude oil.",
    mobileNote: "Use horizontal bars with compact value labels."
  },
  {
    visualId: "the-grid-is-getting-cleaner-per-unit",
    title: "The grid is getting cleaner per unit",
    takeaway: "Electricity carbon intensity fell from about 740 to 670 gCO2/kWh between 2000 and 2025.",
    detail: "The direction is cleaner, but the fall is gradual because coal generation remains large while total demand rises.",
    whyShowThis: "It gives the per-unit climate metric for the power sector.",
    howToRead: "Lower values mean fewer emissions per unit of electricity.",
    mistakeToAvoid: "Do not infer that total power-sector emissions have fallen from this chart alone.",
    mobileNote: "Label the first and latest points."
  },
  {
    visualId: "electricity-demand-keeps-climbing",
    title: "Electricity demand keeps climbing",
    takeaway: "Electricity demand grew from 573 TWh in 2000 to 2,083 TWh in 2025.",
    detail: "Demand growth explains why clean power has to grow very quickly. It is competing against a rising baseline, not a fixed electricity system.",
    whyShowThis: "It frames the transition challenge.",
    howToRead: "The upward slope shows rising total electricity demand.",
    mistakeToAvoid: "Do not treat demand growth as separate from the coal story; it is why coal remains large.",
    mobileNote: "Keep the line simple and label the endpoints."
  },
];

doc.sourceNotes = [
  "Electricity generation, demand, and carbon intensity: Ember yearly India power-sector datasets through 2025.",
  "Crude oil and petroleum product quantities and values: PPAC current 2025-26 import/export reports, modified 21 May 2026.",
  "Indian crude basket price: PPAC international crude oil page; current row modified 02 June 2026, with the latest 2026-27 point treated as year-to-date.",
  "LNG physical volumes and values: PPAC LNG imports current workbook for 2025-26; March 2026 is marked provisional by PPAC.",
  "Partner-country import rankings and crude partner history: TradeStat / DGCI&S commodity-wise import tables for fiscal years 2017-18 through 2025-26.",
  "Coal import spend: TradeStat / DGCI&S HS 2701 import value for 2025-26.",
  "Electricity access and population context: World Bank India indicators."
];

doc.caveats = [
  "PPAC's Indian crude basket endpoint did not return a usable 2022-23 annual row in this ingest; the latest 2026-27 value is year-to-date, not a completed fiscal year.",
  "PPAC petroleum and LNG figures are fiscal-year reports; compare them with calendar-year sources carefully.",
  "TradeStat partner rankings are import values by HS code, not barrel-equivalent, tonne-equivalent, or heat-content totals.",
  "Coal spend uses TradeStat HS 2701 import value, while PPAC supplies the petroleum and LNG value rows.",
  "The Russia history line is not literally zero before 2022; it is small relative to Iraq and Saudi Arabia, then rises sharply after 2022.",
  "PPAC marks the March 2026 LNG value provisional pending final DGCI&S data.",
  "Electricity charts describe the power sector only; transport and industrial fuel use sit outside the grid mix."
];

fs.writeFileSync(path, JSON.stringify(doc, null, 2) + "\n");
