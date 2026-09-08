#!/usr/bin/env python3
"""Chart-ready artifacts for q.econ.oil_shock_2026.

The ingest scripts write faithful copies of their sources: Comtrade partner tables keyed
on partner code, CGA monthly flows in rupees crore, GEP panels in the shape the World Bank
drew them. None of those is what `tableBars` wants, which is rows of {label, value}. This
reshapes them, and does the small number of arithmetic steps the article needs (April-July
totals, year-on-year changes, Gulf shares by commodity).

Every derived artifact points its sourceUrl at the underlying source, records its inputs
and method in metadata, and carries the caveat that belongs to it. Nothing new is measured
here - this is reshaping and arithmetic only.

Inputs (all written by, in order):
  scripts/ingest-worldbank-gep.py
  scripts/ingest-ppac-monthly-oil-shock.mjs
  scripts/ingest-comtrade-hormuz-exposure.mjs
  scripts/ingest-idh-oil-benchmarks.mjs
  scripts/ingest-idh-cpi-2024-base.mjs
  scripts/ingest-idh-fiscal-energy-shock.mjs

Run: python3 scripts/derive-oil-shock-2026-charts.py
"""
import datetime as dt
import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "data/series"
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()
QUESTION = "q.econ.oil_shock_2026"

INDIA = {"type": "country", "id": "IN", "name": "India"}
WORLD = {"type": "country", "id": "WLD", "name": "World"}

written = []


def load(name):
    return json.loads((S / f"{name}.json").read_text())


def obs(name):
    return {o["date"]: o["value"] for o in load(name)["observations"]}


def write_table(name, indicator_id, title, unit, rows, *, source_url, source_id="oil-shock-derived",
                geography=INDIA, metadata=None):
    artifact = {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "geography": geography,
        "dimensions": [],
        "fetchedAt": FETCHED,
        "rows": rows,
        "metadata": {"generatedFor": QUESTION, **(metadata or {})},
    }
    (S / f"{name}.json").write_text(json.dumps(artifact, indent=2) + "\n")
    written.append((indicator_id, len(rows)))


def write_series(name, indicator_id, title, unit, frequency, observations, *,
                 source_url, source_id="oil-shock-derived", geography=INDIA, metadata=None):
    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": indicator_id,
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": frequency,
        "geography": geography,
        "dimensions": [],
        "fetchedAt": FETCHED,
        "observations": observations,
        "metadata": {"generatedFor": QUESTION, **(metadata or {})},
    }
    (S / f"{name}.json").write_text(json.dumps(artifact, indent=2) + "\n")
    written.append((indicator_id, len(observations)))


COMTRADE_URL = "https://comtradeplus.un.org/"
PPAC_TRADE_URL = "https://ppac.gov.in/import-export"
PPAC_PRICE_URL = "https://ppac.gov.in/prices/international-prices-of-crude-oil"
CGA_URL = "https://cga.nic.in/MonthDashboardReport/Published/list.aspx"
MOSPI_CPI_URL = "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi"
GEP_URL = "https://www.worldbank.org/en/publication/global-economic-prospects"

# ---------------------------------------------------------- 1. the exposure gradient
LABELS = [
    ("lpg", "LPG (cooking gas)"),
    ("lng", "LNG"),
    ("crude_oil", "Crude oil"),
    ("dap", "DAP fertiliser"),
    ("petroleum_products", "Refined fuels"),
    ("urea", "Urea"),
]
rows = []
for slug, label in LABELS:
    d = load(f"un-comtrade.IN.trade.comtrade.hormuz_exposure_{slug}.2025")
    md = d["metadata"]
    rows.append({
        "label": label,
        "value": md["gulfSharePercent"],
        "importsUsdBn": round(md["totalImportsUsd"] / 1e9, 1),
    })
rows.sort(key=lambda r: -r["value"])
write_table(
    "oil-shock-derived.IN.energy.shock2026.gulf_share_by_commodity",
    "energy.shock2026.gulf_share_by_commodity",
    "India could replace the barrel. It could not replace the cooking gas.",
    "% of import value from the Gulf, 2025",
    rows,
    source_url=COMTRADE_URL,
    metadata={
        "method": "Gulf import value divided by Comtrade's own reported World total, calendar 2025.",
        "gulfDefinition": "Bahrain, Iran, Iraq, Kuwait, Qatar, Saudi Arabia and the UAE - the Middle East grouping used in GEP June 2026 figure 2.1.D. Oman is EXCLUDED because its ports lie outside the strait.",
        "caveat": ("Gulf share is an upper bound on Hormuz exposure. Saudi Arabia and the UAE have "
                   "partial pipeline bypasses to the Red Sea and Fujairah, though both are crude "
                   "lines and neither moves LPG at scale. Calendar 2025 is pre-shock, which is the "
                   "intended use, but it is the LOW mark of a 91.5-97.3% band for LPG since 2021 "
                   "(2024 was 97.3%), so do not call it the structural level. Excluding Oman is "
                   "decisive for urea specifically: Oman alone is 18.7% of India's urea imports, so "
                   "Gulf-plus-Oman would be 39.7%, not 20.9%."),
        "singleSourced": ("These shares rest entirely on India's own declarations. A mirror check is "
                          "structurally impossible: no Gulf state publishes partner-level LPG exports "
                          "for 2025 (Kuwait and Saudi Arabia report only to 'Areas, nes'; the rest "
                          "report nothing). The one proxy available contradicts India - Saudi Arabia's "
                          "declared 2024 LPG exports to the WORLD are 26% smaller than what India says "
                          "it imported from Saudi Arabia alone. Russia, at a third of India's crude, "
                          "has not reported to Comtrade since 2022 and is likewise unverifiable."),
    },
)

# ------------------------------------------------- 2 & 3. partner mixes, crude and LPG
for slug, indicator, title, note in [
    ("crude_oil", "energy.shock2026.crude_partners_2025",
     "Where India's crude actually comes from",
     "Russia became India's largest crude supplier after 2022. This is the most likely reason crude volumes held through the shock, but note it is a 2025 cross-section: partner-level import data for the shock months of 2026 was not available, so no one has shown which suppliers the 2026 barrels actually came from."),
    ("lpg", "energy.shock2026.lpg_partners_2025",
     "Where India's cooking gas comes from",
     "LPG moves on pressurised carriers with no pipeline bypass around Hormuz, and India never diversified away from the Gulf."),
]:
    d = load(f"un-comtrade.IN.trade.comtrade.hormuz_exposure_{slug}.2025")
    top = [r for r in d["rows"] if r["sharePercent"] and r["sharePercent"] >= 1.0][:8]
    rows = [{"label": r["partner"].replace("Rep. of Korea", "South Korea"),
             "value": r["sharePercent"], "gulf": r["gulf"]} for r in top]
    write_table(
        f"oil-shock-derived.IN.{indicator}",
        indicator,
        title,
        "% of import value, 2025",
        rows,
        source_url=COMTRADE_URL,
        metadata={
            "hsCode": d["metadata"]["hsCode"],
            "totalImportsUsdBn": round(d["metadata"]["totalImportsUsd"] / 1e9, 1),
            "note": note,
            "caveat": "Partners below 1% of import value are omitted, so the bars do not sum to 100.",
        },
    )

# ------------------------------------- 4. Middle East dependence by region (GEP 2.1.D)
d = load("worldbank-gep.REGIONS.energy.gep.middle_east_energy_dependence")
REGION_NAMES = {"SAR": "South Asia", "MNA": "Middle East and North Africa", "EAP": "East Asia and Pacific",
                "ECA": "Europe and Central Asia", "SSA": "Sub-Saharan Africa", "LAC": "Latin America"}
rows = [{"label": REGION_NAMES.get(r["region"], r["region"]), "value": r["oil"], "naturalGas": r["naturalGas"]}
        for r in d["rows"]]
rows.sort(key=lambda r: -r["value"])
write_table(
    "oil-shock-derived.REGIONS.energy.shock2026.middle_east_dependence",
    "energy.shock2026.middle_east_dependence",
    "South Asia is the region most exposed to Gulf energy",
    "% of economies in the region sourcing over 30% of oil imports from the Middle East",
    rows,
    source_url=GEP_URL,
    source_id="worldbank-gep",
    geography={"type": "region", "id": "EMDE-regions", "name": "EMDE regions"},
    metadata={
        "figure": "GEP June 2026, figure 2.1.D",
        "caveat": "This counts the SHARE OF ECONOMIES in a region, not volumes. South Asia has six economies in the sample, so 50% means three of six. It is not an India-specific statistic.",
    },
)

# ------------------------------------------------ 5. the crude bill: same barrels, more money
qty = obs("ppac.IN.energy.ppac.crude_import_quantity_monthly")
usd = obs("ppac.IN.energy.ppac.crude_import_value_usd_monthly")
lpg_q = obs("ppac.IN.energy.ppac.lpg_import_quantity_monthly")


def apr_jul(year):
    return [f"{year}-{m:02d}" for m in (4, 5, 6, 7)]


def total(series, months):
    return sum(series[m] for m in months if m in series)


rows = []
for year in (2024, 2025, 2026):
    months = apr_jul(year)
    rows.append({
        "label": f"April-July {year}",
        "value": round(total(usd, months) / 1000, 1),
        "volumeMt": round(total(qty, months) / 1000, 1),
    })
write_table(
    "oil-shock-derived.IN.energy.shock2026.crude_bill_apr_jul",
    "energy.shock2026.crude_bill_apr_jul",
    "The same barrels, a $22.8 billion bigger bill",
    "US$ billion spent on crude oil imports",
    rows,
    source_url=PPAC_TRADE_URL,
    metadata={
        "method": "PPAC monthly crude import value (report 3, US$ million) summed over April to July, with the matching volume from report 1.",
        "volumes": {r["label"]: r["volumeMt"] for r in rows},
        "keyFact": "Volume rose 0.45% between April-July 2025 and April-July 2026; value rose 56%.",
        "caveat": "2026 figures are provisional and get revised. Volume is million metric tonnes, not barrels.",
    },
)

rows = [{"label": f"April-July {year}", "value": round(total(lpg_q, apr_jul(year)) / 1000, 2)}
        for year in (2024, 2025, 2026)]
write_table(
    "oil-shock-derived.IN.energy.shock2026.lpg_volume_apr_jul",
    "energy.shock2026.lpg_volume_apr_jul",
    "Cooking gas imports nearly halved",
    "million tonnes of LPG imported",
    rows,
    source_url=PPAC_TRADE_URL,
    metadata={
        "keyFact": "April-July LPG imports fell 47.7% between 2025 and 2026, from 7.08 Mt to 3.70 Mt.",
        "caveat": "These are imports, not consumption. Domestic production and stock draw are not captured.",
    },
)

# ------------------------------------------------------- 6. consumer price pass-through
CPI_ITEMS = [
    ("item_diesel", "Diesel"),
    ("item_petrol", "Petrol"),
    ("item_cng", "CNG"),
    ("item_lpg", "LPG cylinder"),
    ("food_beverages", "Food and drink"),
    ("general", "Everything (headline CPI)"),
]
rows = []
for slug, label in CPI_ITEMS:
    series = obs(f"indiadatahub.IN.prices.cpi24.{slug}.inflation")
    if "2026-07" in series:
        rows.append({"label": label, "value": series["2026-07"]})
rows.sort(key=lambda r: -r["value"])
write_table(
    "oil-shock-derived.IN.energy.shock2026.consumer_price_passthrough",
    "energy.shock2026.consumer_price_passthrough",
    "The shock barely reached the shelf",
    "% year-on-year inflation, July 2026",
    rows,
    source_url=MOSPI_CPI_URL,
    metadata={
        "comparison": "India's realised crude import price was 81% above its February level at the May peak. Retail petrol inflation in July was 7.5%.",
        "caveat": "MOSPI rebased the CPI to 2024 from January 2026; these are not continuous with the 2012-base series, which ends in December 2025. Year-on-year is computable only from December 2025. These are inflation rates, not a pass-through estimate, which would need pump prices and tax rates.",
    },
)

# ------------------------------------------------------------- 7. where it hit the budget
FISCAL = [
    ("urea_subsidy", "Urea subsidy"),
    ("nutrient_based_subsidy", "Other fertiliser subsidy"),
    ("customs", "Customs collections"),
    ("petroleum_subsidy", "Petroleum subsidy"),
    ("excise", "Union excise (fuel taxes)"),
]
rows = []
for slug, label in FISCAL:
    series = obs(f"indiadatahub.IN.fiscal.cga.{slug}_monthly")
    months25 = [f"2025-{m:02d}" for m in (4, 5, 6)]
    months26 = [f"2026-{m:02d}" for m in (4, 5, 6)]
    # A missing month must fail loudly. Filling it with zero would silently compare two
    # months against three and understate the later year.
    for m in months25 + months26:
        if m not in series:
            raise SystemExit(f"FATAL: {slug} is missing {m}; the April-June comparison would be uneven")
    a = sum(series[m] for m in months25)
    b = sum(series[m] for m in months26)
    pct = round(100 * (b / a - 1), 1) if a else None
    # The petroleum subsidy line is ~Rs 250-280 crore against an excise swing of Rs 12,456
    # crore. A percent change on that base renders as a bar comparable to the real movers
    # and contradicts the article's own point that this line did not move, so it is charted
    # as zero change and its levels are carried in metadata for the explainer to quote.
    smallBase = a < 1000
    rows.append({"label": label, "value": 0.0 if smallBase else pct,
                 "actualPercentChange": pct, "negligible": smallBase,
                 "aprJun2025Crore": round(a), "aprJun2026Crore": round(b)})
rows.sort(key=lambda r: -(r["value"] or 0))
write_table(
    "oil-shock-derived.IN.energy.shock2026.fiscal_impact",
    "energy.shock2026.fiscal_impact",
    "It went to the exchequer instead",
    "% change, April-June 2026 against April-June 2025",
    rows,
    source_url=CGA_URL,
    metadata={
        "method": "Comptroller General of Accounts monthly flows summed over April to June and compared year on year.",
        "aprilCaveat": "April posts as a near-zero or negative month for excise in the CGA accounts every year (April 2025 was MINUS 39 crore), so only April-June TOTALS are comparable. Never compare a single month against April.",
        "caveat": "Union excise post-GST is overwhelmingly petroleum, and the GEP records a fuel tax cut in India, so that attribution is sound. Customs covers ALL imports and India levies little basic customs duty on crude, so do NOT attribute its rise to oil. Excise and customs together were roughly flat, +2.9%. The petroleum subsidy line stayed near nil throughout: there was no fuel subsidy surge.",
    },
)

# --------------------------------------------------- 8. the forecast that did not move
d = load("worldbank-gep.EMDE.macro.gep.forecast_revisions_2026")
counts = d["metadata"]["counts"]
all_counts = d["metadata"]["countsIncludingSubAggregates"]
write_table(
    "oil-shock-derived.EMDE.macro.shock2026.forecast_revisions",
    "macro.shock2026.forecast_revisions",
    f"The World Bank cut {counts['downgraded']} of {counts['total']} forecasts. India's went up.",
    "number of 2026 growth forecasts",
    [
        {"label": "Cut since January", "value": counts["downgraded"]},
        {"label": "Raised since January", "value": counts["upgraded"]},
        {"label": "Unchanged", "value": counts["unchanged"]},
    ],
    source_url=GEP_URL,
    source_id="worldbank-gep",
    geography={"type": "region", "id": "EMDE", "name": "Emerging market and developing economies"},
    metadata={
        "indiaRevision": "+0.1pp for FY2026/27 and +0.6pp for FY2027/28.",
        "countsIncludingSubAggregates": all_counts,
        "caveat": ("These are individual economies. The GEP's regional tables also carry "
                   f"{all_counts['total'] - counts['total']} sub-aggregates (GCC, Central Asia, "
                   "SAR excluding India and so on) that double count their own members; counting "
                   f"those too gives {all_counts['downgraded']} cut of {all_counts['total']}. "
                   "India reports on an April-March fiscal year, so its 2026 column is FY2026/27 "
                   "while most others are calendar-year. Most other upgrades are commodity "
                   "exporters or very small economies, but 14 commodity importers were upgraded "
                   "too, the largest Jamaica at +1.3."),
    },
)

india_fy = obs("worldbank-gep.IN.macro.gep.india_gdp_growth_fy")
meta = load("worldbank-gep.IN.macro.gep.india_gdp_growth_fy")["metadata"]
jan = meta["january2026Implied"]
rows = [{"label": fy, "value": v, "januaryForecast": jan.get(fy)} for fy, v in india_fy.items()]
write_table(
    "oil-shock-derived.IN.macro.shock2026.india_growth_vs_january",
    "macro.shock2026.india_growth_vs_january",
    "India's growth forecast barely moved",
    "% real GDP growth, fiscal years",
    rows,
    source_url=GEP_URL,
    source_id="worldbank-gep",
    metadata={
        "revisionVsJanuary": meta["revisionVsJanuary2026"],
        "keyFact": "The June forecast for FY2026/27 is 6.6%, against 6.5% in January. India still decelerates sharply from 7.7% - the upgrade is against the January forecast, not against last year.",
        "caveat": "Fiscal years run April to March. FY2025-26 is an estimate; everything after is a forecast.",
    },
)

# The Hormuz index that used to live here has been REMOVED. It rebased both the 2026 and
# the prior-year line to a single pre-conflict PEAK DAY, which pushed normal traffic to ~82
# on a scale labelled "pre-conflict peak = 100" and made a normal year look 18% depressed.
# It also existed only because the unit was thought to be unknown. It is not: figure 1.10.B
# is labelled "Millions of metric tons" on its y-axis (the panel is a raster image, which is
# why the label never appeared in the PDF text layer). The article now plots the World Bank
# series directly, in millions of tonnes per day.

for indicator, n in written:
    print(f"  {indicator:56s} {n:>4} rows")
print(f"\n{len(written)} derived artifacts written.")
