#!/usr/bin/env node
import { writeFile } from "node:fs/promises";

const questionId = "q.econ.state_finances";
const generatedAt = new Date().toISOString();

const bodyMarkdown = `## The big budget is mostly the running budget

Indian states and UTs collected about Rs 39.3 lakh crore in revenue in 2023-24. They spent about Rs 40.2 lakh crore as revenue expenditure. The asset-building line, capital outlay, was about Rs 7.5 lakh crore.

That first split matters. A state budget speech can sound like roads, bridges, hospitals and schools being built. The accounts say most of the money is the running cost of government: salaries that are inside department budgets, subsidies, maintenance, police, schools already open, hospitals already treating patients, grants passed onward, interest on past borrowing and pensions for past employees.

Capital outlay is still large. Rs 7.5 lakh crore is not a footnote. But it is not the budget.

## Capital outlay is not the whole budget

In 2023-24 capital outlay was about 15.7% of revenue expenditure plus capital outlay. If someone says 18.6%, check the denominator: that is capital outlay divided by revenue expenditure, not by the combined direct-spending base used here.

The difference is not pedantry. The same rupee amount can sound larger when the denominator is smaller. A useful budget story states the denominator before making the claim.

## The running account still leaks

The all-state revenue balance was still negative in 2023-24, about -2.4% of total revenue. That means revenue receipts did not fully cover revenue expenditure before we even get to the capital account.

Revenue deficit is not the whole fiscal deficit. Borrowing, loans, capital receipts and capital outlay sit elsewhere. But it is a clean warning sign. If the running account is short, then part of borrowing is not building assets; it is paying for today's running bill.

## The Centre is in every state budget

In 2023-24, about 42.2% of all-state revenue came from central tax share plus grants. The remaining 57.8% was states' own revenue, mostly own taxes and own non-tax revenue.

That is not a scandal by itself. India designed fiscal federalism this way. Poorer states and hill states have smaller tax bases and higher costs, so transfers are meant to equalise. The uncomfortable part is choice. A government that raises most of its money locally has more room to change course. A government that depends on transfers must wait for tax devolution, Finance Commission rules, scheme design and grant timing.

## Transfer dependence is a state-level fact

The state ranking is stark. In 2023-24, central transfers were about 90% of Manipur's revenue, about 86% of Arunachal Pradesh's and Nagaland's, and about 72% of Bihar's. At the other end, Delhi was below 4%, Telangana and Haryana were near 20%, and Karnataka, Maharashtra, Tamil Nadu, Kerala and Gujarat sat far lower than the transfer-heavy states.

This is why one all-India average is not enough. The Centre is present everywhere, but it is not present in the same weight.

## Old bills arrive before new promises

Interest and pensions took about 25.4% of all-state revenue in 2023-24. That is before a new school, a bus depot, a welfare promise or an industrial park.

## The old bills are not evenly spread

The burden is uneven. Punjab's interest-plus-pension bill was about 47.8% of revenue in 2023-24. Kerala was about 42.3%. Himachal Pradesh was about 40.1%. These are not tiny accounting lines. They are the old budget arriving at the door before the new budget gets to speak.

The chart deliberately keeps interest and pensions together because both are rigid, but they are not the same thing. Interest is the price of past borrowing. Pensions are the price of past employment rules and the age structure of public employees. Salaries would make the rigidity larger, but this workbook does not separate them cleanly enough for the same all-state calculation.

## Capital outlay has its own mix

Capital outlay is not one kind of asset-building. In 2023-24, roads and bridges took about 22.9% of all-state capital outlay. Irrigation and flood control took about 17.8%. Water and sanitation took about 11.2%. Education was about 4.8% and medical and public health about 4.3%.

That matters because "more capex" can mean very different things. A road-heavy capital budget, an irrigation-heavy budget and a hospital-building budget all sit under the same capital-outlay label. The chart does not tell us whether the asset was completed on time or built well. It tells us what kind of claim the capital budget is making.

## The cut falls on the flexible line

Budget Estimates are promises made before the year begins. Accounts are what happened after revenue came in, grants arrived or did not arrive, and spending departments faced cash limits.

From 2014-15 to 2023-24, capital outlay actuals averaged about 81.0% of Budget Estimates. Interest payments averaged about 98.9%. Grants from the Centre averaged about 75.7%. In plain English: the line that builds assets is easier to miss than the line that pays lenders.

This does not prove bad faith. A state may budget a road, then face a revenue shock, a delayed grant or a land problem. But the pattern is still useful. When the accounts are written, capital outlay is less protected than interest.

## The human budget also gets revised down

Education and health are politically protected words, but the accounts still matter. From 2014-15 to 2023-24, education actuals generally came in below Budget Estimates. In 2023-24, education was about 94.1% of BE. Health plus family welfare was about 90.1%.

The health line has one important exception: shock years can push actuals above the original plan. That is exactly why budget realism should be read by category. Interest behaves like a hard bill. Capital outlay behaves like a flexible bill. Health can be routine in one year and emergency spending in another.

## A scatter for fiscal room

Transfer dependence and committed spending do not point to the same states. Bihar and the northeastern states depend heavily on the Centre. Punjab, Kerala and Himachal carry heavy interest-plus-pension bills. Odisha and Gujarat have more capital-outlay space in this particular cut of the data. Delhi is a special case because it is a UT with legislature and a different responsibility set.

The scatter is a sorting device. Rightward means more revenue is tied up in interest and pensions. Upward means more of direct state spending is capital outlay. Punjab sits low and right. Arunachal sits high and left. Gujarat and Odisha are high on the capital-outlay axis. This does not explain why. It tells you where the hard questions begin.

A clean state-finance story has to resist one villain. Low capital outlay can come from debt, pension load, low revenue, transfer design, political choices, project readiness or the fact that a small state has different fixed costs. The data shows the squeeze. It does not supply a single cause.

## The capital-outlay map cuts both ways

Punjab, Puducherry and Kerala sat near the bottom of the 2023-24 capital-outlay share ranking. Punjab's capital outlay was about 3.9% of revenue expenditure plus capital outlay; Kerala's was about 8.7%. At the other end, Arunachal Pradesh, Sikkim, Gujarat, Odisha, Meghalaya and Jharkhand were above 20%.

That is not a simple league table of virtue. A high capital-outlay share can reflect catch-up investment, central projects, geography, a small population, or one large project year. A low share can reflect debt pressure, pension pressure, project delays or a deliberate choice to protect current spending. The chart earns its place because it shows where to investigate.

## The running budget is still mostly developmental

Revenue expenditure is often dismissed as "just running costs". That is too lazy. In RBI's broad classification, developmental expenditure was about 62.3% of revenue expenditure in 2023-24. Non-developmental expenditure was about 34.7%, and grants-in-aid plus contributions were about 3.0%.

The useful signal is the drift. Developmental spending was closer to 68% of revenue expenditure in 1990-91. The share is still the majority, but it is lower. Non-developmental spending has taken more room. That is where interest, pensions, administration and other non-developmental heads begin to matter.

## Education and health need their own window

Education was about 16.9% of revenue expenditure in 2023-24. In 1990-91 it was about 21.6%. Health plus family welfare was about 6.1% in 2023-24, not much different from the early 1990s in share terms.

This is one of the article's sharper caveats. Shares can fall even while rupee spending rises, because the whole budget has grown. But a share still reveals priority inside the running budget. If education loses share while pensions and interest remain large, the budget's future-facing claim weakens.

## Raw rupees mislead across states

Uttar Pradesh will almost always look huge in rupees because it has so many people. Goa, Sikkim or Arunachal Pradesh can look tiny because they have fewer people. That is why the article joins the State Finances data to RBI Handbook denominators: GSDP for the size of the state economy, and a derived population estimate for per-person comparisons.

The per-person chart changes the feeling of the story. In 2023-24, revenue expenditure per derived resident was about Rs 14,900 in Bihar, about Rs 18,100 in Uttar Pradesh and about Rs 19,300 in Jharkhand. It was above Rs 1 lakh in Arunachal Pradesh, Sikkim and Goa. Some of that is real fiscal capacity. Some of it is the arithmetic of small populations, geography and grants.

## Education rupees are thinnest where the child count is large

Education revenue expenditure per derived resident was about Rs 2,900 in Uttar Pradesh, about Rs 3,000 in Jharkhand and about Rs 3,200 in Bihar in 2023-24. Sikkim and Goa were near Rs 20,000, and Arunachal Pradesh was above Rs 16,000.

This is not the perfect education denominator. The cleaner denominator would be school-age children or enrolled students. But per resident is still useful because it shows the fiscal floor behind a state's education system. The big-population states are trying to run large school systems with thin rupees per resident.

## Health spending needs rupees, not only shares

Health shows the same warning in a sharper way. Health and family welfare revenue expenditure per derived resident was about Rs 850 in Bihar and about Rs 1,035 in Uttar Pradesh. Arunachal Pradesh and Goa were around Rs 10,000 per derived resident. That is not the same as health outcomes, and it excludes private and out-of-pocket spending. But it is a useful floor check on the public budget.

## Capital outlay needs an economy denominator

Capital-outlay share answers one question: how the budget is split between running spending and asset-building. Capital outlay as a share of current-price GSDP asks a different question: how much state investment effort sits against the size of the state economy.

Punjab and NCT Delhi were around 0.6% of GSDP in 2023-24. Puducherry was about 0.9%, Kerala about 1.2%. At the other end, Arunachal Pradesh was about 21.9%, Meghalaya 8.5%, Nagaland 7.8% and Manipur 6.3%. Odisha and Sikkim were both around 5.4%.

Do not read this as an infrastructure-quality ranking. A high ratio can come from a small economy, transfer-heavy budgets, geography, or a lumpy project year. The chart earns its place because it separates a state's investment intensity from its budget mix.

## Revenue deficit is the pre-capex warning light

In 2023-24, Punjab's revenue balance was about -3.7% of GSDP. Andhra Pradesh, Himachal Pradesh and Rajasthan were around -2.6% to -2.7%. These states began with a running-account shortfall before capital spending entered the picture.

The surplus side is also telling. Odisha, Nagaland, Tripura, Meghalaya and Jharkhand had positive revenue balances as a share of GSDP, while Arunachal Pradesh was very high because its transfer-heavy budget is large relative to a small economy. A revenue surplus is not proof of better services. It says the running account is not the immediate leak.

## GST changed what own revenue means

The own-revenue line is not stable under the hood. Before GST, sales tax and VAT were the dominant state tax handle. In 2016-17, sales tax and VAT were about 64.3% of own tax revenue. SGST was zero because it did not exist yet.

By 2017-18, SGST was about 31.3% of own tax revenue and sales tax/VAT had fallen to about 35.5%. By 2023-24, SGST was about 43.1% and sales tax/VAT about 20.8%. State excise and stamps remain important, but GST changed the composition of what "own tax" means.

This is why state fiscal room cannot be read only as a revenue-effort morality play. The tax base, the rules of a shared GST system, the Centre's transfers and state choices all sit in the same account.

## How to read these numbers

This article uses RBI's State Finances: A Study of Budgets 2025-26 e-STATES workbook as the main source. Account values are treated as actuals. 2023-24 is the latest full actual year in this workbook. 2024-25 is Revised Estimate and 2025-26 is Budget Estimate, so they are not used as observed spending.

The all-state line has a scope break. RBI notes that the All States/UT aggregate excludes UTs from 1990-91 to 2016-17, except that NCT Delhi is included from 2000-01 to 2004-05. From 2017-18 onward, it covers all states and UTs. Long-run all-state charts should be read with that break in mind.

Derived shares are computed from the workbook's published rows. Central transfer share is share in central taxes plus grants from the Centre, divided by total revenue. Interest-plus-pensions share is interest payments plus pensions, divided by total revenue. Capital outlay share uses capital outlay divided by revenue expenditure plus capital outlay unless the chart says otherwise. Actual-to-budget is Account divided by Budget Estimate for the same fiscal year and the same budget head.

Cross-state per-person and per-GSDP charts join State Finances to RBI Handbook of Statistics on Indian States denominators. Per-person metrics convert the State Finances rupee-crore value into rupees and divide by population derived from current-price NSDP divided by per-capita NSDP in the Handbook snapshot. It is not a fresh Census count. GSDP metrics divide State Finances rupee-crore values by current-price GSDP from the same Handbook snapshot. The denominator charts exclude the All States/UT aggregate because the State Finances aggregate and Handbook UT coverage do not match exactly.

One source-quality issue is preserved rather than "fixed": Karnataka's top-level revenue components do not reconcile to total revenue for 2021-22 Account, 2022-23 Revised and 2023-24 Budget in the source workbook. The article avoids making a Karnataka composition claim from those problematic rows.`;

const chartExplainers = [
  {
    visualId: "State budgets are mostly running money",
    title: "State budgets are mostly running money",
    takeaway: "The running budget is many times larger than the asset-building line.",
    detail: "In 2023-24, revenue expenditure for all states and UTs was about Rs 40.24 lakh crore. Capital outlay was about Rs 7.47 lakh crore. The gap is the first guardrail for the whole article.",
    whyShowThis: "It prevents the article from treating every state-budget announcement as asset creation.",
    howToRead: "Compare the two lines in Rs lakh crore. Revenue expenditure is the recurring operating side; capital outlay is the asset-building side.",
    mistakeToAvoid: "Do not call the two lines total state spending. This is a direct-spending lens from the selected workbook heads.",
    mobileNote: "Focus on the 2024 endpoints; the level gap is more important than small year-to-year wiggles."
  },
  {
    visualId: "Where the money comes from",
    title: "Where the money comes from",
    takeaway: "About two-fifths of all-state revenue came from the Centre in 2023-24.",
    detail: "Own revenue was about 57.8% of total revenue in 2023-24. Central tax share plus grants was about 42.2%. That split is the fiscal-federal background behind every state choice.",
    whyShowThis: "It separates money raised by states from money transferred through the Union system.",
    howToRead: "The two lines are shares of total revenue and add to 100%. A higher central-transfer line means more dependence on devolution and grants.",
    mistakeToAvoid: "Do not treat transfers as failure. Equalisation is part of the design.",
    mobileNote: "Read the latest labels first, then scan the broad range since the 1990s."
  },
  {
    visualId: "A quarter of revenue is already spoken for",
    title: "A quarter of revenue is already spoken for",
    takeaway: "Interest and pensions took about 25.4% of all-state revenue in 2023-24.",
    detail: "This is the visible rigid bill in the workbook: past borrowing plus past pension promises. It has fallen from the early-2000s peak but still claims roughly one rupee in four of revenue.",
    whyShowThis: "Fiscal room is about what remains after the bills that are hard to cut.",
    howToRead: "Higher means less revenue is left before new programme choices begin.",
    mistakeToAvoid: "Do not treat this as all committed spending. Salaries are not included here.",
    mobileNote: "The latest point is the anchor; the early-2000s peak provides historical context."
  },
  {
    visualId: "What capital outlay is spent on",
    title: "What capital outlay is spent on",
    takeaway: "Roads, irrigation and water works take a large part of the capital-outlay line.",
    detail: "In 2023-24, roads and bridges were about 22.9% of all-state capital outlay, irrigation and flood control about 17.8%, and water and sanitation about 11.2%. Education was about 4.8% and medical and public health about 4.3%.",
    whyShowThis: "It opens the capital-outlay line instead of treating it as one generic investment bucket.",
    howToRead: "Each bar is a selected non-overlapping Appendix-4 capital-outlay component divided by total capital outlay. Other capital outlay is the residual.",
    mistakeToAvoid: "Do not treat this as completed infrastructure or asset quality. These are accounting flows.",
    mobileNote: "Read the first three named bars and the residual; exact ordering below that is less important."
  },
  {
    visualId: "Capital outlay is smaller than the speech version",
    title: "Capital outlay is smaller than the speech version",
    takeaway: "Capital outlay was about 15.7% of revenue expenditure plus capital outlay in 2023-24.",
    detail: "The same rupee amount can sound larger if divided by a smaller denominator. This chart uses capital outlay over revenue expenditure plus capital outlay, so it reads as a direct-spending share.",
    whyShowThis: "It forces the denominator into the open.",
    howToRead: "Higher means a larger share of this spending lens went to capital outlay.",
    mistakeToAvoid: "Do not mix this with capital outlay divided by revenue expenditure. That 2023-24 number is about 18.6%.",
    mobileNote: "Use the chart title and unit together; they tell you the denominator."
  },
  {
    visualId: "The running account is still in deficit",
    title: "The running account is still in deficit",
    takeaway: "The all-state revenue account was still short in 2023-24.",
    detail: "The revenue balance was about -2.4% of total revenue in 2023-24. That means revenue receipts did not cover revenue expenditure before capital spending and borrowing are brought into the story.",
    whyShowThis: "It adds the missing deficit lens to the fiscal-room argument.",
    howToRead: "Values below zero are revenue deficits. Values above zero are revenue surpluses.",
    mistakeToAvoid: "Do not treat this as the fiscal deficit. It excludes the capital account and borrowing flows.",
    mobileNote: "The zero line is the anchor: below it, the running budget is short."
  },
  {
    visualId: "Budgets promise capital outlay, accounts trim it",
    title: "Budgets promise capital outlay, accounts trim it",
    takeaway: "Capital outlay under-delivers more often than interest payments.",
    detail: "From 2014-15 to 2023-24, capital outlay actuals averaged about 81.0% of Budget Estimates. Interest payments averaged about 98.9%. Grants from the Centre were also volatile, averaging about 75.7%.",
    whyShowThis: "It tests budget speeches against accounts.",
    howToRead: "Values below 100 mean the final account came in below the original Budget Estimate.",
    mistakeToAvoid: "Do not treat every miss as dishonesty. Revenue and grant shocks can force revisions.",
    mobileNote: "Compare capital outlay with interest payments; the separation is the story."
  },
  {
    visualId: "Education and health are not fully protected either",
    title: "Education and health are not fully protected either",
    takeaway: "The social budget also comes in below its original plan in many years.",
    detail: "In 2023-24, education actuals were about 94.1% of Budget Estimate and health plus family welfare was about 90.1%. The health line can jump in shock years, but routine under-spending still matters for services people actually use.",
    whyShowThis: "It tests whether the human-development lines are protected when the accounts close.",
    howToRead: "Values below 100 mean actuals came in below the Budget Estimate for that fiscal year.",
    mistakeToAvoid: "Do not compare this directly with outcomes. A rupee spent can still be spent badly or late.",
    mobileNote: "Use the 100% line mentally: everything below it is a shortfall against the original plan."
  },
  {
    visualId: "States most dependent on transfers",
    title: "States most dependent on transfers",
    takeaway: "Transfer dependence is concentrated in the northeast, hill states and Bihar.",
    detail: "In 2023-24, Manipur, Arunachal Pradesh, Nagaland, Tripura, Mizoram and Meghalaya all got around four-fifths or more of revenue from central transfers. Bihar was above 70%.",
    whyShowThis: "The all-India average hides a federation of very different fiscal engines.",
    howToRead: "Each bar is central tax share plus grants divided by total revenue in 2023-24.",
    mistakeToAvoid: "Do not compare Delhi mechanically with full states. Its responsibilities differ.",
    mobileNote: "The top half of the chart carries the main message; exact ranks below that matter less."
  },
  {
    visualId: "Where interest and pensions lock the budget",
    title: "Where interest and pensions lock the budget",
    takeaway: "Punjab, Kerala and Himachal start each budget year with unusually heavy old bills.",
    detail: "Punjab's interest-plus-pension burden was about 47.8% of revenue in 2023-24. Kerala was about 42.3% and Himachal Pradesh about 40.1%.",
    whyShowThis: "It shows why two states with similar revenues can have very different room for new choices.",
    howToRead: "Higher bars mean a larger share of revenue is pre-claimed by interest and pensions.",
    mistakeToAvoid: "Do not read this as pension burden alone. Interest is a large part of the measure.",
    mobileNote: "Read the first five bars; they define the high-burden cluster."
  },
  {
    visualId: "Where capital outlay gets squeezed",
    title: "Where capital outlay gets squeezed",
    takeaway: "Punjab, Puducherry and Kerala put very little of this spending lens into capital outlay in 2023-24.",
    detail: "Punjab's capital outlay was about 3.9% of revenue expenditure plus capital outlay; Kerala's was about 8.7%. At the other end, Arunachal Pradesh, Sikkim, Gujarat, Odisha, Meghalaya and Jharkhand were above 20%.",
    whyShowThis: "It gives the reader a state-level counterpart to the all-India capital-outlay share.",
    howToRead: "Lowest and highest states are shown together. Higher means a bigger capital-outlay share of revenue expenditure plus capital outlay.",
    mistakeToAvoid: "Do not treat high capital outlay as completed infrastructure. This is an accounting flow, not an asset-quality audit.",
    mobileNote: "Read the grouped extremes; the chart is about the spread, not a full league table."
  },
  {
    visualId: "Locked bills versus capital outlay",
    title: "Locked bills versus capital outlay",
    takeaway: "States do not sit on one neat line from bad to good.",
    detail: "The scatter separates two pressures: rigid old bills on the x-axis and capital-outlay share on the y-axis. Punjab sits in the high-rigidity, low-capital corner, while Arunachal is high on capital outlay and low on the rigid-bill measure.",
    whyShowThis: "It keeps the article honest: fiscal room has more than one dimension.",
    howToRead: "Right is more interest plus pensions. Up is more capital outlay in the direct-spending base.",
    mistakeToAvoid: "Do not infer causality from the slope. The chart is a map for questions, not a model.",
    mobileNote: "Highlighted states are guideposts; pinch less on the exact point cloud."
  },
  {
    visualId: "Developmental spending still dominates, but less than before",
    title: "Developmental spending still dominates, but less than before",
    takeaway: "Developmental spending remains the majority of revenue expenditure, but its share is lower than in the early 1990s.",
    detail: "Developmental expenditure was about 62.3% of revenue expenditure in 2023-24, down from about 68.1% in 1990-91. Non-developmental expenditure was about 34.7% in 2023-24.",
    whyShowThis: "It opens up the running budget instead of treating revenue expenditure as one undifferentiated block.",
    howToRead: "The three lines are shares of revenue expenditure: developmental, non-developmental, and grants-in-aid/contributions.",
    mistakeToAvoid: "Do not read developmental as automatically effective or non-developmental as automatically wasteful. These are accounting categories.",
    mobileNote: "The gap between developmental and non-developmental is the main read."
  },
  {
    visualId: "Education's slice has drifted down; health stays small",
    title: "Education's slice has drifted down; health stays small",
    takeaway: "Education takes a smaller revenue-expenditure share than in the early 1990s, while health remains a small slice.",
    detail: "Education was about 16.9% of revenue expenditure in 2023-24, compared with about 21.6% in 1990-91. Health plus family welfare was about 6.1% in 2023-24.",
    whyShowThis: "It gives education and health their own fiscal window instead of leaving them hidden inside developmental spending.",
    howToRead: "Both lines are shares of revenue expenditure, not rupees and not outcomes.",
    mistakeToAvoid: "Do not infer school quality or health access from shares alone. This is budget priority, not service performance.",
    mobileNote: "Compare the latest labels and the broad drift from the early 1990s."
  },
  {
    visualId: "How much government each resident gets",
    title: "How much government each resident gets",
    takeaway: "Per-person spending changes the state-finance story.",
    detail: "In 2023-24, revenue expenditure per derived resident was about Rs 14,900 in Bihar and about Rs 18,100 in Uttar Pradesh. Arunachal Pradesh, Sikkim and Goa were above Rs 1 lakh.",
    whyShowThis: "Raw rupee totals are mostly population totals in disguise.",
    howToRead: "The chart shows the lowest and highest states or UTs with legislatures by revenue expenditure per derived resident.",
    mistakeToAvoid: "Do not treat high per-person spending as high service quality.",
    mobileNote: "Use the grouped low/high layout rather than trying to compare every state."
  },
  {
    visualId: "Education rupees per resident are thin in the big states",
    title: "Education rupees per resident are thin in the big states",
    takeaway: "The big-population states sit near the bottom on education rupees per resident.",
    detail: "Education revenue expenditure per derived resident was about Rs 2,900 in Uttar Pradesh, Rs 3,000 in Jharkhand and Rs 3,200 in Bihar in 2023-24. Sikkim and Goa were near Rs 20,000.",
    whyShowThis: "It converts an education share into the fiscal scale behind residents.",
    howToRead: "Lowest and highest states or UTs with legislatures are shown. Values are rupees per derived resident.",
    mistakeToAvoid: "Do not treat this as spending per student. The denominator is total derived population.",
    mobileNote: "The contrast between the low big states and the high small states is the point."
  },
  {
    visualId: "Health rupees per resident are not equal",
    title: "Health rupees per resident are not equal",
    takeaway: "Health budget shares can hide large per-person gaps.",
    detail: "Health and family welfare revenue expenditure was about Rs 850 per derived resident in Bihar and about Rs 1,035 in Uttar Pradesh in 2023-24. Arunachal Pradesh and Goa were around Rs 10,000.",
    whyShowThis: "It turns an abstract budget share into rupees behind a resident.",
    howToRead: "Medical and public health plus family welfare is divided by derived population.",
    mistakeToAvoid: "Do not treat this as total health spending. Private spending and central spending are outside this chart.",
    mobileNote: "The first and last groups are the main comparison."
  },
  {
    visualId: "Capital outlay against state economy",
    title: "Capital outlay against state economy",
    takeaway: "Capital-outlay intensity looks very different once the state economy is the denominator.",
    detail: "In 2023-24, capital outlay was about 0.6% of GSDP in Punjab and NCT Delhi, about 0.9% in Puducherry and about 1.2% in Kerala. Arunachal Pradesh was about 21.9%, Meghalaya 8.5%, Nagaland 7.8% and Manipur 6.3%.",
    whyShowThis: "It checks whether a high capital-outlay share in the budget is also large relative to the state economy.",
    howToRead: "Each bar is State Finances capital outlay divided by current-price GSDP from the RBI Handbook.",
    mistakeToAvoid: "Do not treat this as completed infrastructure or asset quality. It is an accounting flow against an economy denominator.",
    mobileNote: "Read the low and high groups; the extreme spread matters more than the middle ranks."
  },
  {
    visualId: "Who runs a revenue deficit before capital spending",
    title: "Who runs a revenue deficit before capital spending",
    takeaway: "Punjab, Andhra Pradesh, Himachal Pradesh and Rajasthan had among the deepest revenue deficits relative to GSDP in 2023-24.",
    detail: "Punjab's revenue balance was about -3.7% of GSDP. Odisha, Nagaland, Tripura, Meghalaya and Jharkhand were on the surplus side, while Arunachal Pradesh's surplus was unusually large relative to its small economy.",
    whyShowThis: "It shows which states start with a running-account gap before discussing capital spending.",
    howToRead: "Negative bars are revenue deficits. Positive bars are revenue surpluses.",
    mistakeToAvoid: "Do not treat a surplus as proof of better services. It only says revenue receipts covered revenue expenditure.",
    mobileNote: "Use the zero line: left/below-zero states are in revenue deficit."
  },
  {
    visualId: "GST rewired the states' own-tax basket",
    title: "GST rewired the states' own-tax basket",
    takeaway: "SGST became the largest shown own-tax component after GST.",
    detail: "Sales tax and VAT were about 64.3% of own tax revenue in 2016-17. SGST was 31.3% in 2017-18 and about 43.1% by 2023-24, while sales tax/VAT fell to about 20.8%.",
    whyShowThis: "The own-revenue line changed composition after GST.",
    howToRead: "Each group is a fiscal year. Compare the components within and across years.",
    mistakeToAvoid: "Do not add these selected components and expect exactly 100.",
    mobileNote: "The 2016-17 to 2023-24 SGST shift is the main mobile read."
  }
];

const sectionVisualMap = [
  { heading: "The big budget is mostly the running budget", visualId: "State budgets are mostly running money" },
  { heading: "Capital outlay is not the whole budget", visualId: "Capital outlay is smaller than the speech version" },
  { heading: "The running account still leaks", visualId: "The running account is still in deficit" },
  { heading: "The Centre is in every state budget", visualId: "Where the money comes from" },
  { heading: "Transfer dependence is a state-level fact", visualId: "States most dependent on transfers" },
  { heading: "Old bills arrive before new promises", visualId: "A quarter of revenue is already spoken for" },
  { heading: "The old bills are not evenly spread", visualId: "Where interest and pensions lock the budget" },
  { heading: "Capital outlay has its own mix", visualId: "What capital outlay is spent on" },
  { heading: "The cut falls on the flexible line", visualId: "Budgets promise capital outlay, accounts trim it" },
  { heading: "The human budget also gets revised down", visualId: "Education and health are not fully protected either" },
  { heading: "A scatter for fiscal room", visualId: "Locked bills versus capital outlay" },
  { heading: "The capital-outlay map cuts both ways", visualId: "Where capital outlay gets squeezed" },
  { heading: "The running budget is still mostly developmental", visualId: "Developmental spending still dominates, but less than before" },
  { heading: "Education and health need their own window", visualId: "Education's slice has drifted down; health stays small" },
  { heading: "Raw rupees mislead across states", visualId: "How much government each resident gets" },
  { heading: "Education rupees are thinnest where the child count is large", visualId: "Education rupees per resident are thin in the big states" },
  { heading: "Health spending needs rupees, not only shares", visualId: "Health rupees per resident are not equal" },
  { heading: "Capital outlay needs an economy denominator", visualId: "Capital outlay against state economy" },
  { heading: "Revenue deficit is the pre-capex warning light", visualId: "Who runs a revenue deficit before capital spending" },
  { heading: "GST changed what own revenue means", visualId: "GST rewired the states' own-tax basket" }
];

const indicatorIds = [
  "fiscal.state_budgets.revenue_expenditure_lakh_crore",
  "fiscal.state_budgets.capital_outlay_lakh_crore",
  "fiscal.state_budgets.capital_outlay_composition_2024",
  "fiscal.state_budgets.own_revenue_share",
  "fiscal.state_budgets.central_transfer_share",
  "fiscal.state_budgets.interest_pensions_revenue_share",
  "fiscal.state_budgets.capital_outlay_aggregate_spending_share",
  "fiscal.state_budgets.revenue_balance_revenue_share",
  "fiscal.state_budgets.developmental_expenditure_revenue_expenditure_share",
  "fiscal.state_budgets.non_developmental_expenditure_revenue_expenditure_share",
  "fiscal.state_budgets.grants_in_aid_contributions_revenue_expenditure_share",
  "fiscal.state_budgets.education_expenditure_share",
  "fiscal.state_budgets.health_family_welfare_expenditure_share",
  "fiscal.state_budgets.budget_realisation.capital_outlay_actual_to_budget",
  "fiscal.state_budgets.budget_realisation.interest_payments_actual_to_budget",
  "fiscal.state_budgets.budget_realisation.grants_from_centre_actual_to_budget",
  "fiscal.state_budgets.budget_realisation.education_actual_to_budget",
  "fiscal.state_budgets.budget_realisation.health_family_welfare_actual_to_budget",
  "fiscal.state_budgets.state.central_transfer_share_2024",
  "fiscal.state_budgets.state.interest_pensions_revenue_share_2024",
  "fiscal.state_budgets.state.capital_outlay_aggregate_share_2024",
  "fiscal.state_budgets.state.fiscal_room_scatter_2024",
  "fiscal.state_budgets.state.revenue_expenditure_per_person_2024",
  "fiscal.state_budgets.state.education_per_person_2024",
  "fiscal.state_budgets.state.health_per_person_2024",
  "fiscal.state_budgets.state.capital_outlay_gsdp_2024",
  "fiscal.state_budgets.state.revenue_balance_gsdp_2024",
  "fiscal.state_budgets.tax_basket_2017_2018_2024"
];

const doc = {
  schemaVersion: 1,
  questionId,
  status: "ready",
  generatedAt,
  lastReviewed: generatedAt.slice(0, 10),
  dataThrough: "2023-24 Account values from RBI State Finances 2025-26; RBI Handbook denominators through matching 2023-24 rows",
  model: "manual-codex",
  short: {
    headline: "State budgets are big. Their room is smaller.",
    dek: "In 2023-24, states spent about Rs 40 lakh crore on running expenditure and Rs 7.5 lakh crore on capital outlay. Transfers supplied about 42% of revenue, interest and pensions took about a quarter, and education's budget share was lower than in the early 1990s.",
    body: "The useful question is not how large state budgets are in raw rupees. It is what is left after transfers, old bills and recurring spending. RBI State Finances shows capital outlay at about 15.7% of revenue expenditure plus capital outlay in 2023-24. It also shows what that capital line is made of, the running account still in deficit, GST changing the own-tax basket, education down as a share of revenue expenditure, health still small, and thin per-person public spending in Bihar, Uttar Pradesh and Jharkhand."
  },
  macha: {
    heading: "Okay, but what does this mean for my state?",
    body: "It means the budget number in the speech is not the money available for new promises. First come salaries inside department budgets, interest, pensions, existing schemes and the ordinary cost of keeping schools, police stations and hospitals running. Then comes whatever the state can actually build. A poorer state may spend a large share of its economy and still have very few rupees per resident for education or health.",
    soWhat: "So judge a state budget by room, not size: own revenue, transfers, old bills, revenue balance, capital outlay, education, health and per-person spending together."
  },
  article: {
    title: "How much room do Indian states really have in their budgets?",
    standfirst: "The states spend enormous sums, but much of the money is already spoken for. RBI's e-STATES workbook shows a federation where transfers, GST, old bills, education, health and population size shape fiscal room before any new promise begins.",
    bodyMarkdown
  },
  editorialPlan: {
    audience: "Readers who follow state-budget announcements but need a rigorous account-level way to separate size, dependence and room.",
    heroDescription: "Start with the running-budget versus capital-outlay scale check, then narrow toward transfers, GST, old bills, social spending, state rankings and denominator-corrected comparisons.",
    selectedDataPoints: [
      { label: "Rs 40.24 lakh crore revenue expenditure in 2023-24", reason: "Sets the scale of running spending.", use: "Opening section" },
      { label: "Rs 7.47 lakh crore capital outlay in 2023-24", reason: "Shows the asset-building line beside the running budget.", use: "Opening section and hero chart" },
      { label: "22.9% of capital outlay went to roads and bridges in 2023-24", reason: "Shows what the capital-outlay line contains.", use: "Capital-outlay composition section" },
      { label: "42.2% central transfer share", reason: "Defines transfer dependence.", use: "Revenue-mix section" },
      { label: "25.4% interest plus pensions share", reason: "Defines visible rigid bills.", use: "Committed-spending section" },
      { label: "81.0% capital-outlay budget realisation average", reason: "Tests budget promises against accounts.", use: "Budget-realisation section" },
      { label: "16.9% education share of revenue expenditure", reason: "Shows the human-budget layer.", use: "Education and health section" },
      { label: "43.1% SGST share of own tax revenue", reason: "Shows how GST rewired state tax autonomy.", use: "GST section" }
    ],
    pullQuotes: [
      { quote: "The old budget arrives before the new budget gets to speak.", numberLabel: "Interest plus pensions: 25.4% of revenue" }
    ],
    glossaryBlocks: [
      { term: "Revenue receipts", plainMeaning: "Money a state receives without selling assets or borrowing: own taxes, own non-tax receipts, central tax share, grants, fees and similar current receipts.", whyItMattersHere: "This is the income-like side of the state budget and the denominator for transfer dependence and old-bill shares." },
      { term: "Own revenue", plainMeaning: "Money a state raises itself through its own taxes and non-tax receipts, including SGST, excise, stamps, vehicle tax, fees and dividends.", whyItMattersHere: "A state with more own revenue has more direct control over its budget than one relying mainly on transfers." },
      { term: "Central transfers", plainMeaning: "Money flowing from the Union to states through share in central taxes and grants from the Centre.", whyItMattersHere: "Transfers are part of federal finance, but a high transfer share changes timing, certainty and bargaining room." },
      { term: "Revenue expenditure", plainMeaning: "The running cost of government, including ordinary department spending, subsidies, schools, hospitals, police, interest, pensions and grants.", whyItMattersHere: "RBI Appendix-2 calls this total expenditure within the revenue-expenditure appendix; it is not all spending including capital outlay." },
      { term: "Capital outlay", plainMeaning: "Spending that creates assets or adds long-lived public capacity, such as roads, irrigation works, buildings and power assets.", whyItMattersHere: "This is the line most readers hear as investment, but it is not proof that finished infrastructure is good or even complete." },
      { term: "Revenue deficit or surplus", plainMeaning: "Revenue receipts minus revenue expenditure. A deficit means current receipts did not cover current spending.", whyItMattersHere: "It is the warning light before the capital account enters the story." },
      { term: "Budget Estimate", plainMeaning: "The plan announced before or at the start of the fiscal year.", whyItMattersHere: "Budget Estimates show intention, not observed spending." },
      { term: "Revised Estimate", plainMeaning: "The in-year update to the budget number, usually made before final accounts are available.", whyItMattersHere: "2024-25 is treated as a revised estimate here, not as an actual outcome." },
      { term: "Account", plainMeaning: "The final actual value for a completed fiscal year.", whyItMattersHere: "2023-24 Account is the latest full actual year in the RBI workbook." },
      { term: "Developmental expenditure", plainMeaning: "RBI's broad revenue-expenditure category for social and economic services.", whyItMattersHere: "It helps open up the running budget, but it is an accounting category, not a guarantee of effective services." }
    ]
  },
  chartExplainers,
  sectionVisualMap,
  sourceNotes: [
    {
      label: "RBI State Finances: A Study of Budgets 2025-26 publication page",
      url: "https://www.rbi.org.in/scripts/AnnualPublications.aspx?head=State+Finances+%3A+A+Study+of+Budgets"
    },
    {
      label: "RBI e-STATES workbook used for state-finance rows",
      url: "https://rbidocs.rbi.org.in/rdocs/Publications/DOCS/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A.XLSX"
    },
    {
      label: "RBI explanatory notes and methodology for the State Finances publication",
      url: "https://rbidocs.rbi.org.in/rdocs/Publications/PDFs/06EXPLANATORY24012608539CE016444F378E0A5AAB69B04CB8.PDF"
    },
    {
      label: "RBI Handbook of Statistics on Indian States, used for GSDP, NSDP and per-capita NSDP denominators",
      url: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States"
    }
  ],
  caveats: [
    "The All States/UT aggregate has a scope break: UTs are excluded from 1990-91 to 2016-17, except NCT Delhi is included from 2000-01 to 2004-05; from 2017-18 onward it covers all states and UTs.",
    "2023-24 Account is the latest full actual year in the workbook. 2024-25 Revised Estimate and 2025-26 Budget Estimate are not treated as observed spending.",
    "Rupee values are nominal. The article does not make real-growth claims from them.",
    "Capital outlay is not completed infrastructure or asset quality. It is an accounting head.",
    "Interest plus pensions is only a visible committed-spending proxy. Salaries and other rigid spending are not fully separated here.",
    "Per-person denominators use population derived from RBI Handbook NSDP divided by per-capita NSDP. This is not a fresh Census count.",
    "Per-GSDP charts use current-price GSDP from the RBI Handbook snapshot. They are not real or inflation-adjusted investment measures.",
    "Delhi and Puducherry are UTs with legislatures and do not have the same responsibilities as full states.",
    "Karnataka's top-level revenue components do not reconcile to total revenue for selected recent source rows; the article avoids using those rows for a Karnataka composition claim."
  ],
  lockedNumbersUsed: [
    "2023-24 total revenue: Rs 39.30 lakh crore",
    "2023-24 revenue expenditure: Rs 40.24 lakh crore",
    "2023-24 capital outlay: Rs 7.47 lakh crore",
    "2023-24 central transfer share: 42.18%",
    "2023-24 interest plus pensions share of revenue: 25.40%",
    "2023-24 capital outlay share of revenue expenditure plus capital outlay: 15.66%",
    "2014-15 to 2023-24 capital outlay actual-to-budget average: 81.0%",
    "2014-15 to 2023-24 interest payments actual-to-budget average: 98.9%"
  ],
  qualityFlags: [],
  evidence: {
    lockedNumbers: [
      { label: "Revenue expenditure", value: 40.24, displayValue: "about Rs 40.24 lakh crore", date: "2023-24", unit: "Rs lakh crore", sourceId: "rbi-state-finances", indicatorId: "fiscal.state_budgets.revenue_expenditure_lakh_crore" },
      { label: "Capital outlay", value: 7.47, displayValue: "about Rs 7.47 lakh crore", date: "2023-24", unit: "Rs lakh crore", sourceId: "rbi-state-finances", indicatorId: "fiscal.state_budgets.capital_outlay_lakh_crore" },
      { label: "Central transfer share", value: 42.18, displayValue: "about 42.2%", date: "2023-24", unit: "% of total revenue", sourceId: "rbi-state-finances", indicatorId: "fiscal.state_budgets.central_transfer_share" },
      { label: "Interest plus pensions share", value: 25.4, displayValue: "about 25.4%", date: "2023-24", unit: "% of total revenue", sourceId: "rbi-state-finances", indicatorId: "fiscal.state_budgets.interest_pensions_revenue_share" },
      { label: "Capital outlay share", value: 15.66, displayValue: "about 15.7%", date: "2023-24", unit: "% of revenue expenditure plus capital outlay", sourceId: "rbi-state-finances", indicatorId: "fiscal.state_budgets.capital_outlay_aggregate_spending_share" }
    ],
    availableIndicatorIds: indicatorIds,
    requiredIndicatorIds: indicatorIds,
    sourceSummaries: [
      { sourceId: "rbi-state-finances", sourceUrl: "https://www.rbi.org.in/scripts/AnnualPublications.aspx?head=State+Finances+%3A+A+Study+of+Budgets", note: "State Finances e-STATES workbook supplies revenue, expenditure, capital outlay, interest, pensions, grants and tax-component rows." },
      { sourceId: "rbi-handbook-states", sourceUrl: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States", note: "RBI Handbook snapshot supplies GSDP, NSDP and per-capita NSDP denominators for state comparisons." }
    ]
  }
};

await writeFile(`data/explanations/en/${questionId}.json`, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote data/explanations/en/${questionId}.json`);
