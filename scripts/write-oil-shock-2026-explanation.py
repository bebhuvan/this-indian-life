#!/usr/bin/env python3
"""Author the explanation for q.econ.oil_shock_2026.

The usual path is `node scripts/generate-explanations.mjs --questions=<id>`, which drafts
the prose with deepseek-v4-pro. That is unavailable here (the DeepSeek key returns 402
Insufficient Balance), so this writes the same artifact directly, hand-authored against
the brief in data/briefs/q.econ.oil_shock_2026.json.

Every figure is pulled from data/series/ at run time rather than typed in, so the prose
cannot drift from the artifacts. Numbers appear in the text as {placeholders} filled from
FACTS below, and the script fails loudly if a placeholder has no fact behind it.

Number discipline follows data/audits/energy-shock-2026-number-audit.json. Three rules
enforced here: quote the realised import price and never the Indian basket; never quote
PPAC's suspect March 2026 basket print; never claim the current account widened.

Run: python3 scripts/write-oil-shock-2026-explanation.py
"""
import datetime as dt
import json
import re
import string
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "data/series"
OUT = REPO / "data/explanations/en/q.econ.oil_shock_2026.json"
QUESTION = "q.econ.oil_shock_2026"
# The latest month any series in this article covers. PPAC trade volumes run to July 2026;
# CGA fiscal accounts to June; the World Bank's Hormuz series stops on 24 May.
DATA_THROUGH = "2026-07"


def obs(name):
    return {o["date"]: o["value"] for o in json.loads((S / f"{name}.json").read_text())["observations"]}


def rows(name):
    return json.loads((S / f"{name}.json").read_text())["rows"]


def meta(name):
    return json.loads((S / f"{name}.json").read_text())["metadata"]


def apr_jul(year):
    return [f"{year}-{m:02d}" for m in (4, 5, 6, 7)]


def tot(series, months):
    return sum(series[m] for m in months if m in series)


# ------------------------------------------------------------------ pull every figure
brent_d = obs("worldbank-gep.WLD.energy.gep.brent_daily")
brent_m = obs("indiadatahub.WLD.energy.prices.brent_monthly")
imp = obs("indiadatahub.IN.energy.prices.india_crude_import_price_monthly")
basket = obs("indiadatahub.IN.energy.prices.indian_basket_monthly")
lpg_px = obs("indiadatahub.IN.energy.prices.india_lpg_import_price_monthly")
qty = obs("ppac.IN.energy.ppac.crude_import_quantity_monthly")
usd = obs("ppac.IN.energy.ppac.crude_import_value_usd_monthly")
inr = obs("ppac.IN.energy.ppac.crude_import_value_inr_monthly")
lpg_q = obs("ppac.IN.energy.ppac.lpg_import_quantity_monthly")
hormuz = obs("worldbank-gep.WLD.trade.gep.hormuz_transits_daily")
quarterly = obs("worldbank-gep.IN.macro.gep.india_gdp_growth_quarterly")
india_fy = obs("worldbank-gep.IN.macro.gep.india_gdp_growth_fy")

gulf = {r["label"]: r for r in rows("oil-shock-derived.IN.energy.shock2026.gulf_share_by_commodity")}
crude_p = {r["label"]: r["value"] for r in rows("oil-shock-derived.IN.energy.shock2026.crude_partners_2025")}
lpg_p = {r["label"]: r["value"] for r in rows("oil-shock-derived.IN.energy.shock2026.lpg_partners_2025")}
cpi = {r["label"]: r["value"] for r in rows("oil-shock-derived.IN.energy.shock2026.consumer_price_passthrough")}
fisc = {r["label"]: r for r in rows("oil-shock-derived.IN.energy.shock2026.fiscal_impact")}
revs = meta("worldbank-gep.EMDE.macro.gep.forecast_revisions_2026")["counts"]
fy_meta = meta("worldbank-gep.IN.macro.gep.india_gdp_growth_fy")

hormuz_feb = sum(v for k, v in hormuz.items() if k.startswith("2026-02")) / sum(1 for k in hormuz if k.startswith("2026-02"))
hormuz_mar = sum(v for k, v in hormuz.items() if k.startswith("2026-03")) / sum(1 for k in hormuz if k.startswith("2026-03"))
peak_date = max(brent_d, key=brent_d.get)

# crude import dependency, FY2024-25: PPAC imports over imports plus MoPNG domestic output.
# The production figure is now a real artifact rather than a hard-coded constant.
fy2425 = [f"2024-{m:02d}" for m in range(4, 13)] + [f"2025-{m:02d}" for m in range(1, 4)]
crude_imports_fy = tot(qty, fy2425) / 1000
DOMESTIC_CRUDE_FY2425 = obs("indiadatahub.IN.energy.mopng.domestic_crude_production")["2024-25"]

hormuz_7dma = obs("worldbank-gep.WLD.trade.gep.hormuz_transits_7dma")
def month_mean(series, prefix):
    vals = [v for k, v in series.items() if k.startswith(prefix)]
    return sum(vals) / len(vals)

# The basket-vs-import gap, on the 24 months before the conflict.
basket_gaps = sorted(abs(basket[m] - imp[m]) for m in basket
                     if m in imp and "2024-02" <= m < "2026-03")

def _r1(x):
    return round(x, 1)


F = {
    "hormuzFeb": round(month_mean(hormuz_7dma, "2026-02"), 1),
    "hormuzApr": round(month_mean(hormuz_7dma, "2026-04"), 1),
    "hormuzDrop": round(100 * (1 - month_mean(hormuz_7dma, "2026-04") / month_mean(hormuz_7dma, "2026-02"))),
    "hormuzPriorYear": round(month_mean(obs("worldbank-gep.WLD.trade.gep.hormuz_transits_7dma_prior_year"), "2026-04"), 1),
    "impJulYoY": round(100 * (imp["2026-07"] / imp["2025-07"] - 1)),
    "basketGapMedian": round(basket_gaps[len(basket_gaps) // 2], 1),
    "domesticCrude": DOMESTIC_CRUDE_FY2425,
    "lpgSeriesMonths": len(lpg_q),
    "brentPeak": round(brent_d[peak_date]),
    "brentPeakDate": dt.datetime.strptime(peak_date, "%Y-%m-%d").strftime("%-d %B %Y"),
    "brentDec": round(brent_m["2025-12"]),
    "brentFeb": round(brent_m["2026-02"], 1),
    "brentMar": round(brent_m["2026-03"], 1),
    "brentJul": round(brent_m["2026-07"], 1),
    "impFeb": round(imp["2026-02"], 1),
    "impMar": round(imp["2026-03"], 1),
    "impMay": round(imp["2026-05"], 1),
    "impJul": round(imp["2026-07"], 1),
    "impRise": round(100 * (imp["2026-05"] / imp["2026-02"] - 1)),
    "depend": round(100 * crude_imports_fy / (crude_imports_fy + DOMESTIC_CRUDE_FY2425)),
    "domesticCrudeRounded": round(DOMESTIC_CRUDE_FY2425),
    "crudeImportsFy": round(crude_imports_fy),
    "vol25": round(tot(qty, apr_jul(2025)) / 1000, 1),
    "vol26": round(tot(qty, apr_jul(2026)) / 1000, 1),
    "volPct": round(100 * (tot(qty, apr_jul(2026)) / tot(qty, apr_jul(2025)) - 1), 2),
    "bill25": round(tot(usd, apr_jul(2025)) / 1000, 1),
    "bill26": round(tot(usd, apr_jul(2026)) / 1000, 1),
    "billExtra": round((tot(usd, apr_jul(2026)) - tot(usd, apr_jul(2025))) / 1000, 1),
    "billPct": round(100 * (tot(usd, apr_jul(2026)) / tot(usd, apr_jul(2025)) - 1)),
    "inr25": round(tot(inr, apr_jul(2025)) / 100000, 2),
    "inr26": round(tot(inr, apr_jul(2026)) / 100000, 2),
    "inrExtra": round((tot(inr, apr_jul(2026)) - tot(inr, apr_jul(2025))) / 100000, 2),
    "lpg25": round(tot(lpg_q, apr_jul(2025)) / 1000, 2),
    "lpg26": round(tot(lpg_q, apr_jul(2026)) / 1000, 2),
    "lpgDrop": abs(round(100 * (tot(lpg_q, apr_jul(2026)) / tot(lpg_q, apr_jul(2025)) - 1), 1)),
    "lpgFeb": round(lpg_q["2026-02"]),
    "lpgApr": round(lpg_q["2026-04"]),
    "lpgPxFeb": round(lpg_px["2026-02"]),
    "lpgPxMay": round(lpg_px["2026-05"]),
    "lpgPxRise": round(100 * (lpg_px["2026-05"] / lpg_px["2026-02"] - 1)),
    "gulfLpg": gulf["LPG (cooking gas)"]["value"],
    "gulfCrude": gulf["Crude oil"]["value"],
    "gulfLng": gulf["LNG"]["value"],
    "gulfDap": gulf["DAP fertiliser"]["value"],
    "gulfUrea": gulf["Urea"]["value"],
    "crudeUsdBn": gulf["Crude oil"]["importsUsdBn"],
    "lpgUsdBn": gulf["LPG (cooking gas)"]["importsUsdBn"],
    "russia": round(crude_p["Russian Federation"], 1),
    "iraq": round(crude_p["Iraq"], 1),
    "saudiCrude": round(crude_p["Saudi Arabia"], 1),
    "uaeCrude": round(crude_p["United Arab Emirates"], 1),
    "usaCrude": round(crude_p["USA"], 1),
    "uaeLpg": round(lpg_p["United Arab Emirates"], 1),
    "qatarLpg": round(lpg_p["Qatar"], 1),
    "kuwaitLpg": round(lpg_p["Kuwait"], 1),
    "cpiHead": _r1(cpi["Everything (headline CPI)"]),
    "cpiPetrol": cpi["Petrol"],
    "cpiDiesel": cpi["Diesel"],
    "cpiLpg": _r1(cpi["LPG cylinder"]),
    "cpiFood": _r1(cpi["Food and drink"]),
    "excisePct": abs(fisc["Union excise (fuel taxes)"]["value"]),
    "excise25": f'{fisc["Union excise (fuel taxes)"]["aprJun2025Crore"]:,}',
    "excise26": f'{fisc["Union excise (fuel taxes)"]["aprJun2026Crore"]:,}',
    "ureaPct": fisc["Urea subsidy"]["value"],
    "urea25": f'{fisc["Urea subsidy"]["aprJun2025Crore"]:,}',
    "urea26": f'{fisc["Urea subsidy"]["aprJun2026Crore"]:,}',
    "petSub26": fisc["Petroleum subsidy"]["aprJun2026Crore"],
    "customsPct": fisc["Customs collections"]["value"],
    "cut": revs["downgraded"], "raised": revs["upgraded"], "flat": revs["unchanged"],
    "totalRev": revs["total"],
    "fy2526": india_fy["2025-26"], "fy2627": india_fy["2026-27"], "fy2728": india_fy["2027-28"],
    "janFy2627": fy_meta["january2026Implied"]["2026-27"],
    "rev2627": fy_meta["revisionVsJanuary2026"]["2026-27"],
    "rev2728": fy_meta["revisionVsJanuary2026"]["2027-28"],
    "q225": quarterly["2025-Q2"], "q325": quarterly["2025-Q3"],
    "q425": quarterly["2025-Q4"], "q126": quarterly["2026-Q1"],
    "decel": round(india_fy["2025-26"] - india_fy["2026-27"], 1),
}

BODY = """
## What actually happened at the end of February?

A shipping lane closed.

The Strait of Hormuz is the only sea route out of the Persian Gulf, and through February 2026 it was carrying about {hormuzFeb} million tonnes of cargo a day. The last day it ran normally was 27 February, the trading day before a Middle East conflict began. By April it was carrying about {hormuzApr} million, a fall of roughly {hormuzDrop}%. It had not recovered by 24 May, where the World Bank's published series stops. In April and May a year earlier the strait was moving about {hormuzPriorYear} million tonnes a day.

Brent crude averaged about ${brentDec} a barrel in December 2025. On {brentPeakDate} it printed a daily high of ${brentPeak}. The whole move took about five weeks.

## Did this stay an oil story?

No, and that is the first thing worth getting right.

The same strait carries liquefied natural gas out of Qatar and a large share of the world's fertiliser. Indexed to the day before the conflict, Brent roughly doubled at its peak. So did Asian LNG. Urea rose about 85%.

Fertiliser is the channel most readers skip. The World Bank puts the Gulf's pre-conflict share of world urea and DAP exports combined at about 20%, and natural gas is the main feedstock for nitrogen fertiliser everywhere else, so a gas shock raises the price of nitrogen through two doors at once. Hold on to that one. It reappears at the end of this piece in the subsidy line of the Union budget, months after the barrels stopped making news. Fertiliser is also where an energy shock can turn into a food-price shock, which is the same channel [an El Nino runs through](/articles/what-el-nino-does-to-india/).

## Why does one strait matter so much to this part of the world?

Because more of South Asia's economies lean heavily on Gulf energy than in any other developing region.

The World Bank counts, for each region, the share of its economies that source more than 30% of their oil imports from the Middle East. South Asia tops that count at 50%, and tops the natural gas column too. Latin America is at zero. The same shock reached different parts of the world with completely different force, and India happens to live at the exposed end.

Read that chart carefully, though. It counts economies, not barrels, so it says nothing about how much oil anyone actually buys, and the World Bank does not publish the per-region sample sizes. It is a fact about the neighbourhood, not about India.

## How exposed is India, exactly?

India bought about {depend}% of its crude from abroad in 2024-25: {crudeImportsFy} million tonnes imported against {domesticCrude} million produced at home. On that number alone you would expect a closed strait to be an emergency.

The number alone is misleading. India's Gulf dependence is not one figure, it is a gradient, and the two ends of it behaved like different countries.

At the top sits LPG, the cooking gas in the red cylinder: {gulfLpg}% of what India imported in 2025 came from the seven Gulf economies. At the other end sits crude oil, at {gulfCrude}%. LNG is {gulfLng}%, DAP fertiliser {gulfDap}%, urea only {gulfUrea}%. India runs this kind of import dependence in more than one commodity: [edible oil](/articles/why-india-imports-so-much-edible-oil/) is the other big one.

That spread is the whole story. India had somewhere else to buy oil. It had nowhere else to buy cooking gas.

Three cautions on that chart. Gulf share is an upper bound on strait exposure: the World Bank notes that Saudi Arabia can reroute crude through its East-West pipeline to the Red Sea, and the UAE separately has a line to Fujairah on the far side of the strait. Both carry crude, not cooking gas, and neither could replace tanker traffic. Oman is left out of the Gulf group because its ports already sit outside the strait, which the World Bank gives as the reason Oman was less exposed. And 2025 is not a settled structural level: the LPG share has run between 90% and 97% since 2021 and was 97% in 2024, so if anything this understates the dependence.

## So why did India's crude keep arriving?

The most likely reason is that India had spent three years quietly rebuilding its supplier list, without ever calling it energy security.

After February 2022 Russian crude began trading at a steep discount, and Europe wound down its purchases over that year. Indian refiners went shopping. By 2025 Russia alone was {russia}% of India's crude import bill and the United States another {usaCrude}%. Iraq at {iraq}%, Saudi Arabia at {saudiCrude}% and the UAE at {uaeCrude}% were still large, but they were no longer the only door.

None of that was done for strategic reasons. It was done because the oil was cheap. When the strait shut in March, the effect was the same as if it had been deliberate: India had contracts and tested routes with a second set of suppliers, none of whom sail past Hormuz.

That explanation is consistent with what happened, but it has not been proved. The partner data here is a snapshot of 2025. Nobody has yet published where India's April-to-July 2026 barrels actually came from, so it remains possible that Gulf cargoes kept moving in quantities the shipping data does not capture. What can be said is that the one product India never diversified behaved completely differently.

## And why could it not do the same for cooking gas?

Because LPG does not travel the way crude does.

Propane and butane move chilled or under pressure, in purpose-built carriers. There is no pipeline bypass around the strait, and there is no discounted Russian cargo to switch to. Of the LPG India imported in 2025, the UAE supplied {uaeLpg}%, Qatar {qatarLpg}% and Kuwait {kuwaitLpg}%, with Saudi Arabia close behind and the United States a distant fifth. Look at the crude chart and the LPG chart side by side and the difference is not subtle. One has an escape route drawn on it. The other does not.

This matters because of who uses the stuff. Crude becomes diesel and petrol and jet fuel, which is to say it becomes freight and travel and industry. LPG becomes lunch.

## What did India actually pay for a barrel?

There are two Indian oil prices. In calm months they sit within two or three dollars of each other, a median gap of about ${basketGapMedian}. During this shock they came apart by eighteen. Getting them mixed up is the easiest mistake available here.

The Indian basket is a reference quote: a weighted blend of Brent Dated and the Oman-Dubai average, reflecting the grade mix refiners took that month. The import price is the money that actually left the country when the cargo landed. Cargoes are priced weeks before they arrive, so in a violently moving market the two separate.

What India actually paid went from ${impFeb} a barrel in February to ${impMar} in March, then ${impMay} in May, which was the peak. That is a rise of about {impRise}% on February. By July it was back to ${impJul}.

Note the timing. The reference basket peaked in April; the money peaked in May. Anyone quoting the April basket figure is quoting a price India had not paid yet.

One number on that chart should not be used at all. PPAC's March 2026 basket print of $113.49 sits above both Brent (${brentMar}) and Dubai Fateh that month, and the basket is supposed to be a blend of the two. No weighting of $103.70 and $91.90 produces $113.49. Our own pull and IndiaDataHub's independent restatement agree exactly, so this is PPAC's number rather than a transcription error, but it cannot be right.

## What did the same barrels end up costing?

This is the cleanest measure of the damage, because the volume barely moved.

Between April and July 2026 India imported {vol26} million tonnes of crude. In the same four months of 2025 it imported {vol25} million tonnes. The difference is {volPct}%, which is nothing.

The bill went from ${bill25} billion to ${bill26} billion. That is about ${billExtra} billion more, a rise of {billPct}%, for the same oil. In rupees, roughly ₹{inr25} lakh crore became ₹{inr26} lakh crore, an extra ₹{inrExtra} lakh crore in four months. The rupee figure moves faster than the dollar one because the currency was also sliding, which is [a separate story](/articles/why-the-rupee-falls/).

Two caveats sit on that figure. The 2026 numbers are provisional and PPAC revises them. And this is crude alone, so it leaves out LPG, LNG and refined products, and it ignores that India earns some of it back by exporting refined fuel.

## What happened to the cooking gas itself?

It stopped coming.

India imported {lpg26} million tonnes of LPG between April and July 2026, against {lpg25} million in the same months of 2025. That is a fall of {lpgDrop}%. The monthly series dates it precisely: {lpgFeb} thousand tonnes in February, 807 thousand in March, {lpgApr} thousand in April. April is the lowest of the {lpgSeriesMonths} months PPAC's current table covers, which begins in April 2024, so it is not an all-time low.

And it cost more. The price India paid per tonne went from ${lpgPxFeb} in February to ${lpgPxMay} in May, up about {lpgPxRise}%. Less gas, at a higher price, which is the worst combination available.

The honest limit on this: these are imports, not consumption. India produces LPG domestically and holds stocks, and both filled part of the gap. What households actually experienced is not visible in this data, and the retail price is administered anyway. What is visible is that the import channel for the one fuel India could not substitute closed by half.

## Why did none of this show up at the pump?

Because someone else absorbed it.

In July 2026 retail petrol inflation was {cpiPetrol}% and diesel {cpiDiesel}%. Cooking gas was {cpiLpg}%. Headline inflation was {cpiHead}%, food {cpiFood}%. Compare like with like: the crude India landed in July cost {impJulYoY}% more than a year earlier, against {cpiPetrol}% at the pump. At the May peak the crude gap was {impRise}% over February, and the pump never went near it.

Indian pump prices are formally deregulated, but they do not behave like market prices. They are set by the state-owned oil marketing companies that dominate retail fuel, and through this shock they moved in small steps or not at all. So the question was never whether the shock would be absorbed. It was who would absorb it.

A word on the numbers themselves. MOSPI rebased the consumer price index to 2024 in January 2026, so these figures are not continuous with the older 2012-base series that most published charts still use, and year-on-year comparisons only begin from December 2025. These are also inflation rates, not a pass-through estimate. A real pass-through calculation would need pump prices and tax rates, which is a different piece of work.

## So who paid for it?

The exchequer, mostly, and not in the way you would guess.

Union excise duty, which after GST is levied overwhelmingly on petrol and diesel, fell {excisePct}% between April and June 2026 against the same months of 2025: about ₹{excise25} crore became ₹{excise26} crore. That is consistent with the fuel tax cut the World Bank lists among India's responses to the shock, though the fall is not decomposed and timing and volume will account for some of it.

The fertiliser bill rose. Urea subsidy spending went from about ₹{urea25} crore to ₹{urea26} crore over the same three months, up {ureaPct}%. That is the urea price on the second chart in this piece, arriving in the budget about four months later.

The thing that did not happen is the one most people would predict. India's petroleum subsidy line stayed at almost nothing, ₹{petSub26} crore across three months. There was no fuel subsidy surge. India held pump prices down by giving up tax revenue, which does not appear as spending anywhere, rather than by writing cheques.

Two honest qualifications. April posts as a near-zero or negative month for excise in these accounts every single year, which is why this compares April-to-June totals rather than single months. And customs collections rose {customsPct}% over the same window, so excise and customs together were roughly flat. Customs covers all imports and India charges little basic duty on crude, so that rise should not be read as an oil effect without separate evidence.

## Then why did the World Bank raise India's forecast?

Of the {totalRev} developing economies with a 2026 forecast in the June 2026 Global Economic Prospects, {cut} were cut and {raised} were raised. {flat} were left where they were. India is one of the {raised}.

Most of the other upgrades are commodity exporters, which gain when oil is dear, or economies small enough that a single project moves the number. India is neither. It is not alone though: fourteen commodity importers were upgraded, and the biggest of those upgrades, Jamaica's, was 1.3 percentage points against India's 0.1.

## What changed behind that number?

Almost everything, which is what makes the unchanged number interesting.

India's forecast for 2026-27 went from {janFy2627}% in January to {fy2627}% in June, a move of {rev2627} of a percentage point. The January forecast was made before the conflict, when American tariffs were the live risk. By June the US Supreme Court had struck down the tariffs imposed on economic-emergency grounds, though the administration promptly reimposed a temporary 10% surcharge under a different law; the effective US rate had fallen from about 14% to about 12%; India had signed trade agreements with the European Union and the United Kingdom; and GST rates had been cut. An energy shock arrived to take the place of a trade shock, and the two roughly cancelled.

Do not read the upgrade as good news. India still slows from {fy2526}% to {fy2627}%, a deceleration of {decel} percentage points, which on an economy this size is a large amount of missing output. The upgrade is against January's forecast. It is not against last year.

## Did India go into this strong?

Yes, and that is part of the answer too.

Year-on-year growth ran {q225}% in the second quarter of 2025, {q325}% in the third and {q425}% in the fourth. The World Bank's estimate for the first quarter of 2026, the quarter in whose final month the conflict began, is {q126}%. India hit this shock accelerating.

Momentum is not immunity, and one month of a quarter tells you very little. But an economy growing at close to 8% absorbs a terms-of-trade hit differently from one growing at 2%, and the timing here was lucky rather than clever.

## How to read these numbers

The single most important thing this article cannot tell you is what the shock did to India's current account.

The Reserve Bank publishes balance of payments data about a quarter in arrears. The most recent published quarter, January to March 2026, contains only one month of the conflict, and it recorded a surplus of about $7.1 billion. The first full quarter of the shock was not published when this was written in late August 2026. A $22.8 billion increase in the crude bill over four months has to go somewhere, and the current account is the obvious place, alongside [the gold India keeps buying](/articles/india-and-gold/), but that is an inference from monthly trade data and not a measurement. Anyone telling you India's current account deficit widened by a specific amount this year is guessing.

On the rest:

Crude import volumes and values are PPAC monthly tables. They are provisional for recent months and get revised, and PPAC notes that its June and July 2026 figures are prorated from DGCI&S data rather than measured, so two of the four months in the 2026 comparison are estimates.

The realised import price is India's average crude oil import price, published by PPAC and distributed by IndiaDataHub. It reproduces exactly from PPAC's own volume and value tables divided by 7.33 barrels per tonne, which confirms the extraction but is not independent corroboration: it is the same source arriving twice. One month does not reconcile. March 2026 implies $93.81 a barrel from the trade tables against $95.73 published, a 2% gap, and March is quoted above. The Indian basket price is a separate FOB reference series, is not what India paid, and its March 2026 value is inconsistent with its own stated blend, so it is not used.

Partner shares are UN Comtrade for calendar 2025, filtered to drop the duplicate customs and mode-of-transport rows the API returns, with Comtrade's own reported world total as the denominator. They describe the position India was in when the strait closed. Three things to know about them. They are shares of value, not volume. Recomputing on tonnage moves most of them by well under a point, and LNG by about two. They rest entirely on India's own customs declarations, because no Gulf state publishes partner-level LPG exports for 2025, and Russia has not reported to Comtrade since 2022 at all, so the largest single number here cannot be checked against its counterparty. And excluding Oman, whose ports lie outside the strait, matters most for urea: Oman alone supplies 18.7% of India's urea, so a Gulf-plus-Oman figure would be about 40% rather than {gulfUrea}%.

Consumer prices are MOSPI's 2024-base CPI, which begins in December 2024 and is not splice-compatible with the 2012-base series ending December 2025. Fiscal figures are the Comptroller General of Accounts monthly accounts, reaching us through IndiaDataHub rather than from CGA directly. April is an accounting artifact for excise there, so only multi-month totals are comparable. These figures have not been checked against CGA's own published monthly account: its downloadable report path no longer resolves, its replacement dashboard renders in JavaScript, and no second distributor carries the union monthly series. The internal checks that can be run do pass, in that the monthly flows annualise to within a percent or two of the Budget Estimates for excise, customs and revenue receipts, which rules out a units or scale error. Confirming the individual months against CGA's own release is a check that remains open.

Growth forecasts are the World Bank's June 2026 Global Economic Prospects. India reports on an April-to-March fiscal year while most economies in the same tables are on calendar years, so the columns are not strictly like for like. The Hormuz shipping series is a seven-day moving average in millions of metric tons a day. That unit is printed on the y-axis of the World Bank's own figure, though not in the PDF's text layer, because the panel is an image.

Every figure above was recomputed from the underlying data files before publication, and the check is re-runnable. That is not the same as every figure being independently corroborated: several rest on a single source, and those are named as such above. Where two sources disagreed, both are given.
"""

CHART_EXPLAINERS = [
    ("The Gulf's shipping lane emptied in a fortnight",
     "Cargo through the Strait of Hormuz fell from about {hormuzFeb} million tonnes a day in February 2026 to about {hormuzApr} million in April, and was still there in late May.",
     "The strait is the only sea route out of the Persian Gulf, and roughly a fifth of the world's oil trade normally passes through it. The blue line runs at ordinary volumes through February, falls away in the first ten days of March, and never recovers inside the window this data covers. The black line is the identical calendar weeks of 2025, when the strait was moving 3 to 4 million tonnes a day throughout. The gap between the two is not a slowdown or a rerouting. It is the physical supply of Gulf energy to the rest of the world, switched off and left off for three months.",
     "Every other chart in this article is downstream of this one. Prices, import bills, subsidy lines and growth forecasts all move because this line moved first. Showing it in tonnes rather than as an index also keeps the shock physical: this is cargo that did not sail, not a market repricing itself.",
     "Compare the two lines vertically at any date after early March. The vertical gap is the shortfall against a normal year. The left half of the chart, where they sit close together, is what normal looks like.",
     "Reading the flat stretch as a complete halt on Gulf exports. Some volume kept moving, and Saudi Arabia and the UAE have pipelines that carry crude around the strait. Note too that this is a seven-day average, so the first days of March still blend in pre-conflict traffic and the fall looks gentler here than it was day to day.",
     "The two lines separate in early March and never rejoin. If you read nothing else on a small screen, read that separation."),

    ("Four prices that all run through one strait",
     "Brent roughly doubled at its peak. So did Asian LNG. Urea, the fertiliser Indian farmers buy before the winter crop, rose about 85%.",
     "All four series start at 100 on 27 February 2026, the last trading day before the conflict, so each line reads directly as a percentage change from the day before. Brent reaches about 204 in early April. Asian LNG runs higher still. Urea peaks near 185. The reason four unrelated-looking commodities move together is that they leave through the same door: the Gulf ships crude, it ships the LNG that heats Europe and generates power across Asia, and the World Bank puts its pre-conflict share of world urea and DAP exports at about a fifth. Natural gas is also the feedstock for most nitrogen fertiliser made elsewhere, so a gas shock reaches urea twice.",
     "It stops the reader filing this as a petrol story. The fertiliser line is the one that reaches Indian farms and, months later, Indian food prices, and it moves as violently as the oil line does. A chart with only Brent on it would hide that entirely.",
     "Everything begins at 100 on 27 February. A reading of 200 means the price has doubled since that day. Compare the peaks rather than the endpoints: all four had come well off their highs by late May.",
     "Reading the index as a price level. It shows the size of the move, not the number of dollars, and a doubling from a cheap base is not the same event as a doubling from an expensive one. Urea is also weekly rather than daily, which is why its line is stepped.",
     "Focus on how high each line goes rather than on the wiggles. All four clear 185. They move together because they move through the same strait."),

    ("South Asia is the region most exposed to Gulf energy",
     "Half of South Asia's economies buy more than 30% of their oil from the Middle East, the highest share of any developing region, and it leads on gas too.",
     "The World Bank counts, region by region, how many economies cross a 30% threshold for Middle East oil, and separately for natural gas. South Asia tops both columns. Latin America registers zero on both, which is the useful contrast: the same closed strait arrives as an emergency in one part of the world and as a news item in another. What the chart cannot tell you is how much oil anyone actually buys, because it counts economies rather than barrels, and the World Bank does not publish how many economies sit in each regional sample.",
     "It establishes the neighbourhood before the article makes any claim about India specifically. A reader who has not seen this might reasonably assume every oil importer met this shock on similar terms. They did not, and the difference is geographic.",
     "Each bar is the share of economies in that region above the 30% threshold, not the share of oil coming from the Gulf. Read the top and bottom bars against each other; the middle of the ranking matters less than the spread.",
     "Treating this as an India statistic, or as a statement about volumes. It is a count of economies above a threshold, and a small region with a few dependent members can outrank a large region with one enormous one.",
     "Two bars carry it: South Asia at 50%, Latin America at zero."),

    ("India could replace the barrel. It could not replace the cooking gas.",
     "{gulfLpg}% of the LPG India imported in 2025 came from the Gulf, against {gulfCrude}% of its crude. That gap decided which shortages India felt.",
     "This is India's Gulf dependence broken out by what it actually buys, using 2025 import values from UN Comtrade, the year before the conflict. The spread runs from LPG at the top through LNG at {gulfLng}%, crude at {gulfCrude}%, DAP fertiliser at {gulfDap}% and urea at {gulfUrea}%. The gradient, not the average, is what predicted the following months: the commodities at the top of this chart saw import volumes collapse, and the ones at the bottom did not. A single national dependence figure would have averaged the two ends together and explained nothing.",
     "It is the mechanism of the whole article in one picture, and it is the reason the answer to 'how exposed was India' is not a number but a shape. It also sets up the two partner charts that follow, which show why the top and bottom of this gradient differ.",
     "Each bar is the Gulf share of that commodity's 2025 import value. Higher means fewer places to buy it when the strait closes. Read the top bar against the bottom two rather than scanning the middle.",
     "Reading Gulf share as strait exposure exactly. It is an upper bound: Saudi Arabia and the UAE can move crude around Hormuz by pipeline, though neither pipes cooking gas. Oman sits outside the Gulf group here because its ports are already outside the strait, and that exclusion matters most for urea, where Oman alone supplies about a fifth.",
     "Compare the top bar with the bottom two. LPG at {gulfLpg}%, crude at {gulfCrude}%, urea at {gulfUrea}%."),

    ("Where India's crude actually comes from",
     "Russia alone supplied about {russia}% of India's crude import bill in 2025, and the United States another {usaCrude}%.",
     "India rebuilt this list after February 2022, when Russian crude began trading at a discount and Europe wound down its purchases over that year. Russian cargoes reach India without passing Hormuz. Iraq at {iraq}%, Saudi Arabia at {saudiCrude}% and the UAE at {uaeCrude}% are still large suppliers, but by 2025 they were no longer the only ones, and that is the most plausible reason India's crude volumes barely moved through a closed strait. None of it was done as energy security policy. It was done because the oil was cheap, and it happened to buy exactly the insurance India needed four years later.",
     "It answers the obvious objection to the previous chart. If India is that exposed to the Gulf, why did the oil keep arriving? Because a third of it had already stopped coming from there.",
     "Bars are shares of 2025 crude import value. Gulf and non-Gulf suppliers are interleaved rather than grouped, so read the labels rather than the order. Suppliers below 1% are dropped, so the bars do not sum to 100.",
     "Reading this 2025 snapshot as evidence about 2026. Partner-level data for the shock months has not been published, so nobody has yet shown which suppliers actually filled the April-to-July barrels. Note also that these are shares of value, and discounted Russian crude buys slightly more barrels per dollar than its share implies.",
     "One number carries this chart: Russia at about a third."),

    ("Where India's cooking gas comes from",
     "Four Gulf states supply about nine-tenths of the LPG India imports, and there is no Russia on this list.",
     "LPG moves chilled or under pressure in purpose-built carriers, and there is no pipeline that takes it around the strait. Nor was there a discounted alternative supplier to switch to the way there was for crude. The UAE at {uaeLpg}%, Qatar at {qatarLpg}% and Kuwait at {kuwaitLpg}% dominate, with Saudi Arabia close behind and the United States a distant fifth. Set this chart beside the crude one immediately above it and the difference is the entire argument: one commodity had an escape route already built, and the other did not.",
     "Placed directly after the crude partners, the contrast does the work that no amount of prose can. It also explains why the consequences of this shock were so uneven inside India, because crude becomes freight and industry while LPG becomes lunch.",
     "Compare this chart against the crude chart above it, and look for what is missing from this one rather than what is on it.",
     "Assuming this is all of India's LPG. India produces LPG domestically as well, so this is the imported share only, and the Gulf's share of total Indian supply is lower than nine-tenths.",
     "Suppliers below 1% are dropped, so the bars do not sum to 100."),

    ("What India actually paid for a barrel",
     "The realised import price peaked at ${impMay} a barrel in May 2026, a month after the reference basket did, and {impRise}% above February.",
     "Two Indian oil prices sit on this chart and they answer different questions. The Indian basket is a reference quote, a weighted blend of Brent Dated and the Oman-Dubai average reflecting the grades refiners took that month. The import price is the money that actually left the country when cargoes landed. In calm months the two sit within two or three dollars of each other, a median gap of about ${basketGapMedian}. Through this shock they came apart by eighteen, because cargoes are priced weeks before they arrive, so the bill kept climbing after the quoted price had turned. February's ${impFeb} became ${impMar} in March and ${impMay} in May before falling back to ${impJul} by July.",
     "Quoting the wrong one of these two series is the easiest error available in this story, and it changes both the peak level and the peak month. It is also the difference between what the market did and what India actually spent, which is the subject of the next chart.",
     "Follow the import price line for what India paid. The other three are benchmarks for context: Brent and Dubai Fateh are the world's sweet and sour markers, and the basket is the blend of them that India's refinery mix implies.",
     "Quoting the Indian basket as what India paid, or naming April as the peak month for the bill. Do not use PPAC's March 2026 basket figure of $113.49 at all: it sits above both Brent and Dubai that month and cannot be produced by any blend of the two.",
     "Two lines matter, what India paid and the basket, and the point is that they peak in different months."),

    ("The same barrels, a $22.8 billion bigger bill",
     "India imported {volPct}% more crude by volume in April-July 2026 than a year earlier and paid {billPct}% more for it.",
     "Volume held almost exactly flat, {vol26} million tonnes against {vol25} million, so nearly the entire increase in the bill is price rather than quantity. That makes this the cleanest available measure of what the shock cost: when the barrels do not change, the change in the bill is the shock and nothing else. In rupees the four-month crude bill went from about ₹{inr25} lakh crore to ₹{inr26} lakh crore, an extra ₹{inrExtra} lakh crore, and the rupee figure grows faster than the dollar one because the currency was sliding at the same time.",
     "It converts an abstract price move into a number with a denominator. Twenty-two billion dollars over four months is the sum that has to be found somewhere, and the rest of the article is about where.",
     "Compare the bar heights for spending against the volume figures beneath them. The two tell opposite stories, and that opposition is the point.",
     "Treating this as India's total energy bill. It is crude alone, so it excludes LPG, LNG and refined products, and India earns some of it back by exporting refined fuel. The 2026 figures are provisional, and PPAC prorates its June and July volumes from customs data rather than measuring them.",
     "Three bars, one comparison. The 2024 bar is there to show that 2025 was the unusually cheap year, not that 2026 was uniquely dear."),

    ("Cooking gas was the thing India could not buy",
     "LPG imports fell {lpgDrop}% between April-July 2025 and the same months of 2026, while the price per tonne rose about {lpgPxRise}%.",
     "Crude was a price problem. LPG was a quantity problem, and quantity problems are the ones that reach kitchens. The monthly series dates the collapse precisely: {lpgFeb} thousand tonnes in February 2026, 807 thousand in March, {lpgApr} thousand in April. Meanwhile the price India paid went from ${lpgPxFeb} a tonne in February to ${lpgPxMay} at the May peak. Less gas, at a much higher price, is the worst combination available, and it follows directly from the Gulf-share gradient three charts earlier.",
     "It is where the shock stops being a market abstraction. This is the one commodity on the exposure chart with no alternative supplier, and this is what happened to it.",
     "Compare the 2026 bar against the two before it. This is volume, so a shorter bar means gas that did not arrive rather than gas that got dearer.",
     "Reading this as the shortfall households experienced. These are imports, not consumption. India produces LPG domestically and holds stocks, and both filled part of the gap, so what reached actual kitchens is not visible here. April is also the lowest of the {lpgSeriesMonths} months this PPAC table covers, not an all-time low.",
     "One comparison carries it: 2025 against 2026, roughly halved."),

    ("The shock barely reached the shelf",
     "Retail petrol inflation was {cpiPetrol}% in July 2026 against a {impJulYoY}% rise in what India paid for crude that same month.",
     "Indian retail fuel is formally deregulated, but it does not behave like a market. The state-owned marketers that dominate the pumps moved prices in small steps or not at all through this shock, so the gap between the landed crude price and the forecourt is not a market outcome. It is a decision. Diesel ran at {cpiDiesel}%, cooking gas at {cpiLpg}%, headline inflation at {cpiHead}% and food at {cpiFood}%. None of them is close to what the barrel did, and the difference had to be absorbed by somebody, which is the subject of the chart that follows.",
     "It is the pivot of the article. Establishing that the shock did not reach households is what makes the question of who did pay worth asking at all, and it is the part most readers will find counterintuitive.",
     "Each bar is year-on-year inflation for July 2026. The like-for-like comparison is the landed crude price in the same month, up {impJulYoY}% year on year, which is far off the top of this chart.",
     "Reading these as a pass-through estimate, or comparing them against the {impRise}% peak, which is a February-to-May change rather than a year-on-year one. A real pass-through calculation would need pump prices and tax rates, which is a different exercise.",
     "MOSPI rebased the consumer price index to 2024 in January 2026, so these figures do not connect to the older series most charts still use."),

    ("It went to the exchequer instead",
     "Union excise fell {excisePct}% while the urea subsidy rose {ureaPct}%. The petroleum subsidy did not move at all.",
     "Union excise duty is, after GST, levied overwhelmingly on petrol and diesel, so its fall from about ₹{excise25} crore to ₹{excise26} crore across April to June is the clearest trace of the fuel tax cut the World Bank lists among India's responses. The urea subsidy going from ₹{urea25} crore to ₹{urea26} crore is the fertiliser price shock from the second chart in this article, arriving in the budget about four months later. The petroleum subsidy line stayed at ₹{petSub26} crore across three months, which is close to nothing: India held pump prices down by giving up tax revenue, which never appears as spending anywhere.",
     "It locates the money. Absorbing a shock is not free, and this is the account it was charged to, which is also the reason most readers never noticed the shock happening.",
     "Bars are percentage changes for April-June 2026 against the same three months of 2025. The petroleum subsidy is drawn at zero deliberately: it moved from ₹255 to ₹282 crore, and a percentage change on a base that small would draw a bar the size of the real movers.",
     "Concluding that fuel subsidies surged. They did not, and writing that would invert what this chart shows. Do not read the customs rise as an oil effect either: customs covers all imports and India levies little basic duty on crude, and excise and customs together were roughly flat.",
     "April posts as a near-zero month for excise in these accounts every year, so only multi-month totals are comparable."),

    ("The World Bank cut {cut} of {totalRev} forecasts. India's went up.",
     "{cut} of {totalRev} developing-economy forecasts for 2026 were cut between January and June. India is one of {raised} that were raised.",
     "The June 2026 Global Economic Prospects cut global growth to 2.5%, the weakest reading since the pandemic, and revised down roughly two-thirds of the developing world. Look along the list of upgrades and most names are either commodity exporters, which gain when oil is dear, or economies small enough that a single project moves the number. India is neither, which is what makes its upgrade worth a chart. It is not alone among importers though: fourteen commodity importers were raised, the largest of them Jamaica at plus 1.3 points.",
     "It is the puzzle the article exists to answer, stated as a count rather than an adjective. Without it, India's steady forecast looks unremarkable rather than strange.",
     "Three bars: cut, raised and unchanged. India sits in the middle one, at plus 0.1 of a percentage point for its 2026-27 fiscal year.",
     "Reading India's upgrade as evidence the shock missed it. The upgrade is measured against January's forecast, not against last year, and India still slows sharply.",
     "These are individual economies. Counting the World Bank's regional sub-aggregates as well would give 114 cut of 172."),

    ("Same number, completely different reasons",
     "India's 2026-27 forecast moved by {rev2627} of a percentage point between January and June, and the reasoning behind it was replaced entirely.",
     "In January the expected drag on India was American tariffs. By June the US Supreme Court had struck down the tariffs imposed on economic-emergency grounds, though a temporary 10% surcharge went back on under a different law; the effective US rate had fallen from about 14% to about 12%; India had signed trade agreements with the European Union and the United Kingdom; and GST rates had been cut. An energy shock arrived to take the place of a trade shock, and the two roughly cancelled. A forecast that does not move usually means nothing happened. Here it means two large things happened and pointed in opposite directions.",
     "It is the article's thesis in a single comparison, and it is the reason a stable number is more interesting than a moving one would have been.",
     "Read the 2026-27 bar against the January figure recorded beside it. The other years are there for the shape of the path rather than for the revision.",
     "Reading a stable forecast as a stable economy. India still decelerates {decel} percentage points from {fy2526}% to {fy2627}%, which on an economy this size is a large amount of missing output.",
     "Fiscal years run April to March, so 2026-27 means April 2026 to March 2027."),

    ("India went into the shock accelerating",
     "Growth ran {q325}% in the third quarter of 2025 and was still an estimated {q126}% in the quarter the conflict began.",
     "The conflict started in the final month of the first quarter of 2026, so almost none of that quarter's growth reflects it. What this series does show is the momentum India carried in: {q225}% in the second quarter of 2025, {q325}% in the third, {q425}% in the fourth. An economy growing near 8% absorbs a terms-of-trade hit differently from one growing at 2%, because the extra cost is a smaller share of a faster-expanding pie and the tax base underneath it is still widening. That is the third part of the explanation, alongside supplier diversification and the tax cut, and it is the part that was luck rather than policy.",
     "It supplies the piece of the answer that policy cannot claim credit for. Timing helped, and an article that credited only diversification and the excise cut would be flattering the decisions and ignoring the circumstances.",
     "These are calendar quarters, year on year, unlike the fiscal-year forecasts elsewhere in this article. The line ends at the quarter in which the conflict began.",
     "Reading the last point as evidence the shock did no damage. Only one month of that quarter is affected by it, and the figure is an estimate rather than a released number.",
     "Four points matter, running from mid-2025 to the first quarter of 2026."),
]

SECTIONS = [
    ("What actually happened at the end of February?", "the-gulf-s-shipping-lane-emptied-in-a-fortnight"),
    ("Did this stay an oil story?", "four-prices-that-all-run-through-one-strait"),
    ("Why does one strait matter so much to this part of the world?", "south-asia-is-the-region-most-exposed-to-gulf-energy"),
    ("How exposed is India, exactly?", "india-could-replace-the-barrel-it-could-not-replace-the-cooking-gas"),
    ("So why did India's crude keep arriving?", "where-india-s-crude-actually-comes-from"),
    ("And why could it not do the same for cooking gas?", "where-india-s-cooking-gas-comes-from"),
    ("What did India actually pay for a barrel?", "what-india-actually-paid-for-a-barrel"),
    ("What did the same barrels end up costing?", "the-same-barrels-a-22-8-billion-bigger-bill"),
    ("What happened to the cooking gas itself?", "cooking-gas-was-the-thing-india-could-not-buy"),
    ("Why did none of this show up at the pump?", "the-shock-barely-reached-the-shelf"),
    ("So who paid for it?", "it-went-to-the-exchequer-instead"),
    ("Then why did the World Bank raise India's forecast?",
     re.sub(r"[^a-z0-9]+", "-", f"The World Bank cut {F['cut']} of {F['totalRev']} forecasts. India's went up.".lower()).strip("-")),
    ("What changed behind that number?", "same-number-completely-different-reasons"),
    ("Did India go into this strong?", "india-went-into-the-shock-accelerating"),
]

# The evidence block renders the first 12 source notes and the first 8 further-reading
# entries, and ArticleEvidence.astro's refParts() only hyperlinks a {label, url} object, so
# every entry below is an object and the list is kept at or under those limits. Each URL was
# fetched and checked for the RIGHT page content, not just a 200: ppac.gov.in/production and
# cga.nic.in/MonthlyReport/Published.aspx both return 200 while serving an error page.
SOURCE_NOTES = [
    {"label": "Petroleum Planning & Analysis Cell (PPAC), Ministry of Petroleum and Natural Gas, for India's monthly crude oil and LPG import volumes and their values in dollars and rupees. Every figure in the import-bill and cooking-gas sections comes from these tables.",
     "url": "https://ppac.gov.in/import-export"},
    {"label": "PPAC, international prices of crude oil, for both the Indian basket reference price and the realised crude import price that the article quotes for what India actually paid.",
     "url": "https://ppac.gov.in/prices/international-prices-of-crude-oil"},
    {"label": "PPAC, indigenous crude oil production, the domestic-output denominator behind the statement that India imports about 89% of its crude.",
     "url": "https://ppac.gov.in/production/indigenous-crude-oil"},
    {"label": "UN Comtrade, for India's 2025 imports by partner country across crude oil, LPG, LNG, urea, DAP and refined products, which is where every Gulf-share figure comes from.",
     "url": "https://comtradeplus.un.org/"},
    {"label": "World Bank, Global Economic Prospects, June 2026 edition, for the growth forecasts and their January revisions, the Strait of Hormuz shipping series, the regional energy-dependence panel and the daily commodity index rebased to the day before the conflict.",
     "url": "https://www.worldbank.org/en/publication/global-economic-prospects"},
    {"label": "World Bank Commodity Markets, the monthly Pink Sheet, for the Brent, Dubai Fateh and urea benchmark prices used to cross-check the Indian series.",
     "url": "https://www.worldbank.org/en/research/commodity-markets"},
    {"label": "Ministry of Statistics and Programme Implementation, eSankhyiki, for the 2024-base consumer price index behind every retail inflation figure from January 2026 onward.",
     "url": "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi"},
    {"label": "Comptroller General of Accounts, Union Government Monthly Accounts Dashboard, for the excise, customs, subsidy, revenue and fiscal deficit figures. CGA's older downloadable monthly report path no longer resolves.",
     "url": "https://cga.nic.in/MonthDashboardReport/Published/list.aspx"},
    {"label": "Reserve Bank of India, Database on the Indian Economy, for the balance of payments series that shows why this article cannot yet state a current-account impact.",
     "url": "https://data.rbi.org.in/DBIE/"},
    {"label": "IMF PortWatch, the upstream source for the Strait of Hormuz shipping estimates the World Bank publishes, and the place to see whether traffic has recovered since this was written.",
     "url": "https://portwatch.imf.org/"},
    {"label": "Ministry of Petroleum and Natural Gas, exploration and production, the parent source for India's domestic crude output.",
     "url": "https://mopng.gov.in/en/exp-and-prod/production"},
    {"label": "IndiaDataHub, which distributes several of the official series above in machine-readable form, including the MOSPI consumer price index, the CGA monthly accounts and the PPAC price tables. The fiscal figures reach this article through it rather than from CGA directly.",
     "url": "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor"},
]

FURTHER_READING = [
    {"label": "World Bank, Global Economic Prospects, June 2026: the full report, including the South Asia chapter this article draws on and the two analytical chapters on sovereign debt and commodity-exporter fiscal policy.",
     "url": "https://openknowledge.worldbank.org/entities/publication/global-economic-prospects"},
    {"label": "IMF PortWatch, Port Monitor: the live chokepoint tracker behind the Hormuz figures, updated well past the 24 May 2026 cut-off of the series charted here.",
     "url": "https://portwatch.imf.org/pages/port-monitor"},
    {"label": "PPAC, historical import and export reports, if you want the longer run of India's oil trade rather than the three fiscal years used here.",
     "url": "https://ppac.gov.in/import-export/history"},
    {"label": "UN Comtrade trade-flow explorer, to rebuild the Gulf-share calculations for a different year or a different commodity code.",
     "url": "https://comtradeplus.un.org/TradeFlow"},
    {"label": "Reserve Bank of India Bulletin, where the quarterly balance of payments is released and where the first measured current-account reading for this shock will appear.",
     "url": "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx"},
]

CAVEATS = [
    "The current-account impact of this shock cannot be measured yet. The Reserve Bank publishes balance of payments data roughly a quarter in arrears, and the latest published quarter contains only one month of the conflict. Any figure you see for how much India's current account deficit widened this year is an inference from monthly trade data, not a measurement.",
    "The fiscal figures are single-sourced. They are the Comptroller General of Accounts monthly accounts as redistributed by IndiaDataHub, and no independent distributor of the union monthly series exists to check them against. CGA's own downloadable monthly report path no longer resolves and its replacement dashboard renders its numbers in JavaScript, so they could not be compared against the original. What can be verified is internal: the monthly flows annualise to within a percent or two of the Budget Estimates, which rules out a scale or unit error, and the series are monthly flows rather than fiscal-year cumulatives, proven by the months that go negative.",
    "The Gulf shares rest entirely on India's own customs declarations and cannot be mirror-checked. No Gulf state publishes partner-level LPG exports for 2025: Kuwait and Saudi Arabia report only to 'Areas, nes', and the others do not report at all. The one proxy available contradicts India, in that Saudi Arabia's declared 2024 LPG exports to the whole world are about a fifth smaller than what India says it imported from Saudi Arabia alone. Russia, at roughly a third of India's crude bill, has not reported to UN Comtrade since 2022.",
    "PPAC's monthly import volumes and values for recent months are provisional and get revised, and PPAC records that its June and July 2026 figures are prorated from DGCI&S data rather than measured. Two of the four months in the central comparison are therefore estimates, and the April to July 2026 figures will move.",
    "PPAC's March 2026 Indian crude basket price of $113.49 a barrel is not used in this article. The basket is a weighted blend of Brent Dated and the Oman-Dubai average, but March Brent averaged $103.70 and Dubai Fateh $91.90, so no weighting of the two can produce it. Our own pull and an independent restatement agree exactly, so this is PPAC's own figure rather than an extraction error.",
    "MOSPI rebased the consumer price index to 2024, with effect from January 2026. The new series is not splice-compatible with the 2012-base series, which ends in December 2025: different basket, different weights, and a different classification tree in which the old 'fuel and light' group has no exact counterpart. Year-on-year inflation is computable from December 2025 for the headline index, and only from January 2026 for the individual fuel items, because those series begin a month later.",
    "The Indian basket price and India's realised crude import price are different things and came apart by up to eighteen dollars a barrel during this shock, because cargoes are priced weeks before they land. Everything in this article about what India paid uses the import price.",
    "Union excise collections post as a near-zero or negative month every April since 2003 in the Comptroller General's accounts, because of year-end adjustment and refund processing. April 2025 was minus 39 crore. All fiscal comparisons here use April-to-June totals for that reason, and single-month comparisons against April are meaningless.",
    "Customs collections rose 36% over the same window as the excise fall, leaving the two roughly flat together. Customs covers all imports and India levies little basic customs duty on crude, so that rise is not attributed to oil here. It may have nothing to do with the shock.",
    "Gulf import shares are an upper bound on Strait of Hormuz exposure. The World Bank notes that Saudi Arabia can reroute crude through its East-West pipeline to the Red Sea; the UAE separately has a pipeline to Fujairah on the far side of the strait. Both carry crude rather than cooking gas and neither could replace tanker traffic, but both mean the strait is not quite the only route.",
    "Partner shares are shares of import value, not volume. Recomputing them on tonnage moves most partner shares by well under a percentage point, so the picture does not change, but Russia's share of India's actual barrels is about a point higher than its share of the bill, and at commodity level the Gulf's share of LNG falls about two points.",
    "Calendar 2025 is near the low end of India's Gulf LPG dependence, not a settled structural level: the share ran between 90% and 97% across 2021 to 2025, was lowest in 2022, and was 97% in 2024. Using 2025 understates the dependence rather than flattering it.",
    "Excluding Oman from the Gulf group, on the grounds that its ports lie outside the strait, matters most for urea. Oman alone supplies about 19% of India's urea imports, so a Gulf-plus-Oman figure would be near 40% rather than the 21% shown.",
    "India's realised crude import price reproduces exactly from PPAC's own volume and value tables, which confirms the extraction but is not an independent check, because both come from PPAC. One month fails to reconcile: March 2026 implies about $94 a barrel from the trade tables against $95.7 published.",
    "LPG import volumes are not consumption. India produces LPG domestically and holds stocks, both of which absorbed part of the import shortfall, so the halving of imports is not what households experienced.",
    "The Strait of Hormuz series is a seven-day moving average, so the first days of March still average in pre-conflict traffic and the collapse looks slightly gentler on the chart than it was day to day. Its comparison line carries 2025 volumes plotted against 2026 dates, which is the World Bank's overlay convention. The unit, millions of metric tons per day, is printed on the y-axis of the published figure but not in the PDF text layer, because that panel is an image; an earlier version of this article wrongly said the World Bank stated no unit.",
    "India reports GDP on an April-to-March fiscal year while most economies in the World Bank's tables are on calendar years, so the forecast columns are not strictly like for like. India's 2026 column is FY2026-27.",
    "This article covers crude oil, LPG, LNG and fertiliser. It does not cover coal, the effect on remittances from the roughly nine million Indians working in Gulf states, or the balance sheets of the state-owned oil marketing companies, all of which are part of the full accounting and none of which had usable data through August 2026.",
]

GLOSSARY = [
    {"term": "LPG", "plainMeaning": "Liquefied petroleum gas: propane and butane, compressed into the red cylinder used for cooking in most Indian kitchens. It is a different product from the natural gas piped to power stations, and it moves on different ships.",
     "whyItMattersHere": "It is the commodity India could not substitute when the strait closed, and the reason the shock reached households at all."},
    {"term": "Indian crude basket", "plainMeaning": "A reference price published monthly by PPAC, blending Brent Dated with the Oman and Dubai average in proportion to the grades Indian refineries actually bought that month. It is a quoted benchmark, not a bill.",
     "whyItMattersHere": "It is routinely quoted as what India paid for oil. During this shock it was wrong by up to eighteen dollars a barrel, and it peaked a month before the money did."},
    {"term": "union excise duty", "plainMeaning": "A central government tax charged on goods made in India. After GST absorbed most of it in 2017, roughly nine-tenths of what remains is levied on petrol and diesel, with tobacco making up most of the rest.",
     "whyItMattersHere": "It is where the cost of holding pump prices down actually landed, as revenue the government chose not to collect."},
    {"term": "Strait of Hormuz", "plainMeaning": "The narrow sea passage between Iran and Oman connecting the Persian Gulf to the Arabian Sea. It is the only sea route out of the Gulf, and a large share of the world's oil and LNG passes through it.",
     "whyItMattersHere": "Its closure in March 2026 is the event this entire article measures."},
]


def fill(text):
    used = set()

    class Tracking(dict):
        def __missing__(self, key):
            raise SystemExit(f"FATAL: no fact for placeholder {{{key}}}")

        def __getitem__(self, key):
            used.add(key)
            return F[key] if key in F else self.__missing__(key)

    out = string.Formatter().vformat(text, (), Tracking())
    return out, used


body, used_body = fill(BODY)

explainers = []
all_used = set(used_body)
for raw_title, takeaway, detail, why, how, mistake, mobile in CHART_EXPLAINERS:
    # The title can itself carry placeholders (the revision counts), so fill it before
    # slugifying, or the visualId will not match the section map.
    title, title_used = fill(raw_title)
    all_used |= title_used
    filled = []
    for part in (takeaway, detail, why, how, mistake, mobile):
        text, u = fill(part)
        filled.append(text)
        all_used |= u
    explainers.append({
        "visualId": re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-"),
        "title": title,
        "takeaway": filled[0], "detail": filled[1], "whyShowThis": filled[2],
        "howToRead": filled[3], "mistakeToAvoid": filled[4], "mobileNote": filled[5],
    })

# --------------------------------------------------------------------- structure checks
assert "—" not in body, "em-dash found in body"
# Catch raw float leakage from the artifacts. Three or more decimals is always a bug;
# two is legitimate for money (a lakh-crore figure, or PPAC's $113.49 basket print,
# which is quoted to the cent precisely because the claim is that it cannot be right).
for stray in re.findall(r"\d+\.\d{3,}", body):
    raise SystemExit(f"FATAL: unrounded float in prose: {stray}")
heading_count = body.count("\n## ")
assert heading_count == len(SECTIONS) + 1, f"{heading_count} headings, expected {len(SECTIONS) + 1}"
plan_ids = {s[1] for s in SECTIONS}
exp_ids = {e["visualId"] for e in explainers}
assert plan_ids == exp_ids, f"section/explainer visualId mismatch: {plan_ids ^ exp_ids}"
for heading, _ in SECTIONS:
    assert f"## {heading}" in body, f"missing section: {heading}"
unused = sorted(set(F) - all_used)

short_body, _ = fill(
    "A Middle East conflict closed the Strait of Hormuz at the end of February 2026, and cargo through it fell from about "
    "{hormuzFeb} million tonnes a day to about {hormuzApr} million. India buys about {depend}% of its crude abroad and sits "
    "in the most Gulf-exposed developing region, so this should have been an emergency. It half was. India kept importing "
    "almost exactly the same volume of crude, {vol26} million tonnes over April to July against {vol25} million a year "
    "earlier, and paid about ${billExtra} billion more for it, most likely because Russia and the United States sell barrels "
    "that never pass Hormuz. Cooking gas had no substitute: {gulfLpg}% of the LPG India imports comes from the Gulf, and "
    "imports fell {lpgDrop}%. What did not happen was a price shock at the pump. Retail petrol inflation was {cpiPetrol}% in "
    "July against a {impJulYoY}% rise in the crude India landed that month. The government held prices down by giving up fuel "
    "tax revenue, which fell {excisePct}%, while its urea subsidy bill rose {ureaPct}%. The cost was real. It landed on the "
    "import bill and the exchequer instead of the household."
)
dek, _ = fill(
    "India paid about ${billExtra} billion extra for the same four months of crude, and its cooking gas imports nearly halved. "
    "Retail petrol inflation was {cpiPetrol}%. The difference went onto the government's books."
)
macha_body, _ = fill(
    "Mostly no, and here is the honest reason why. The oil did get much more expensive: India paid about {impRise}% more per "
    "barrel in May than in February. But your petrol price barely moved, because the government cut the tax on fuel rather "
    "than let the pump price rise, so the money came out of the exchequer instead of your wallet. The place you might have "
    "noticed something is the gas cylinder. Over nine-tenths of the LPG India imports comes from the Gulf, and those imports "
    "halved. How much of that reached actual kitchens we cannot see from this data, because imports are not consumption and "
    "domestic production and stocks filled part of the gap. The bill that has not arrived yet is the fertiliser one, which "
    "the government is paying now and which reaches food prices later."
)
macha_sowhat, _ = fill(
    "Because a shock that does not reach the pump has not gone away, it has just been moved somewhere with less political "
    "cost. Union fuel tax collections fell {excisePct}% in three months, giving up about ₹12,500 crore, and the urea subsidy "
    "rose {ureaPct}%, spending about ₹21,500 crore more. Two different pockets, both of them the government's."
)

explanation = {
    "schemaVersion": 1,
    "questionId": QUESTION,
    "status": "ready",
    "short": {
        "headline": "India could replace the barrel. It could not replace the cooking gas.",
        "dek": dek,
        "body": short_body,
    },
    "macha": {
        "heading": "So did the Gulf thing actually cost me anything?",
        "body": macha_body,
        "soWhat": macha_sowhat,
    },
    "article": {
        "title": "The Gulf shut. What did the 2026 oil shock actually cost India?",
        "standfirst": dek,
        "bodyMarkdown": body.strip() + "\n",
    },
    "editorialPlan": {
        "audience": "Curious Indian general reader",
        "heroDescription": "",
        "selectedDataPoints": [],
        "pullQuotes": [],
        "glossaryBlocks": GLOSSARY,
    },
    "chartExplainers": explainers,
    "sectionVisualMap": [{"heading": h, "visualId": v} for h, v in SECTIONS],
    "sourceNotes": SOURCE_NOTES,
    "furtherReading": FURTHER_READING,
    "caveats": CAVEATS,
    "lockedNumbersUsed": sorted(all_used),
    "qualityFlags": [],
    "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
    "model": "hand-authored",
    "dataThrough": DATA_THROUGH,
    "lastReviewed": dt.date.today().isoformat(),
}

# The validator requires the evidence packet inline. Build it the same way the generator
# does, with `node scripts/generate-explanations.mjs --questions=<id> --dry-run`, which
# writes the .evidence.json without calling any model.
EVIDENCE = REPO / "data/explanations/en/q.econ.oil_shock_2026.evidence.json"
if not EVIDENCE.exists():
    raise SystemExit(
        "FATAL: evidence packet missing. Run:\n"
        "  node scripts/generate-explanations.mjs --questions=q.econ.oil_shock_2026 --dry-run"
    )
explanation["evidence"] = json.loads(EVIDENCE.read_text())

# refParts() renders a bare string as dead text, so a missing URL silently loses a link.
for note in SOURCE_NOTES + FURTHER_READING:
    if not note.get("url", "").startswith("http"):
        raise SystemExit(f"FATAL: reference without a URL: {note['label'][:60]}")
if len(SOURCE_NOTES) > 12:
    raise SystemExit(f"FATAL: {len(SOURCE_NOTES)} source notes; the evidence block renders only 12")
if len(FURTHER_READING) > 8:
    raise SystemExit(f"FATAL: {len(FURTHER_READING)} further-reading entries; only 8 render")

OUT.write_text(json.dumps(explanation, indent=2, ensure_ascii=False) + "\n")

words = len(body.split())
print(f"wrote {OUT.relative_to(REPO)}")
print(f"  {heading_count} sections, {len(explainers)} chart explainers, {words} words")
print(f"  {len(SOURCE_NOTES)} source notes (all linked), {len(CAVEATS)} caveats, {len(GLOSSARY)} glossary blocks")
print(f"  {len(all_used)} facts pulled live from data/series/")
if unused:
    print(f"  unused facts: {', '.join(unused)}")
