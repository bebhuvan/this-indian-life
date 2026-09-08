#!/usr/bin/env python3
"""Ingest the World Bank Global Economic Prospects, June 2026 edition.

This is the "energy shock" GEP: a Middle East conflict that began on 27 February
2026 near-closed the Strait of Hormuz, sending Brent from ~$71 to a $138 peak and
cutting global growth to 2.5 percent, the lowest since the pandemic.

Two things make it worth ingesting for an India story:

1. It dates and measures the shock precisely - daily Brent back to 2021, a daily
   index of Brent / European gas / urea / Asian LNG rebased to the last market day
   before the conflict, and daily Strait of Hormuz transits against the prior year.
2. It supplies a counterfactual. Every forecast carries its January 2026 vintage
   alongside, so "what the World Bank expected before the shock" is a real number,
   not a reconstruction. India's 2026/27 forecast moved +0.1pp; the composition
   behind it did not survive.

India itself is thinly covered - the report labels India in only four places
(annual growth, the January revision, quarterly growth, and the SAR PMI panel,
where India is the entire n=1 sample). Everything else about India has to be
backed out of the SAR aggregates or sourced elsewhere. See
`docs/` and the INDIA-DATA-INVENTORY note alongside the raw files.

Source files (World Bank, CC BY 3.0 IGO):
  https://www.worldbank.org/en/publication/global-economic-prospects
cached under data/raw/worldbank-gep/ (gitignored).

Writes ~20 artifacts under the `worldbank-gep` sourceId.
"""
import datetime as dt
import json
import re
from pathlib import Path

import openpyxl

REPO = Path(__file__).resolve().parent.parent
RAW = REPO / "data/raw/worldbank-gep"
CHARTS = RAW / "GEP-Jun-2026-All-Charts"
OUT = REPO / "data/series"
FETCHED = dt.datetime.now(dt.timezone.utc).isoformat()

SOURCE_ID = "worldbank-gep"
LANDING = "https://www.worldbank.org/en/publication/global-economic-prospects"
EDITION = "Global Economic Prospects, June 2026"

WORLD = {"type": "country", "id": "WLD", "name": "World"}
INDIA = {"type": "country", "id": "IND", "name": "India"}
EMDE = {"type": "region", "id": "EMDE", "name": "Emerging market and developing economies"}
SAR = {"type": "region", "id": "SAR", "name": "South Asia"}

written = []


def write_series(name, indicator_id, title, unit, frequency, observations, *,
                 geography=WORLD, source_indicator_id=None, source_url=LANDING,
                 metadata=None):
    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": SOURCE_ID,
        "sourceIndicatorId": str(source_indicator_id or indicator_id),
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": frequency,
        "geography": geography,
        "dimensions": [],
        "fetchedAt": FETCHED,
        "observations": observations,
        "metadata": {"edition": EDITION, **(metadata or {})},
    }
    path = OUT / f"{name}.json"
    path.write_text(json.dumps(artifact, indent=2) + "\n")
    written.append((path.name, len(observations)))
    return path


def write_table(name, indicator_id, title, unit, rows, *, geography=WORLD,
                source_indicator_id=None, source_url=LANDING, metadata=None):
    artifact = {
        "schemaVersion": 1,
        "artifactType": "table",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": SOURCE_ID,
        "sourceIndicatorId": str(source_indicator_id or indicator_id),
        "sourceUrl": source_url,
        "unit": unit,
        "geography": geography,
        "dimensions": [],
        "fetchedAt": FETCHED,
        "rows": rows,
        "metadata": {"edition": EDITION, **(metadata or {})},
    }
    path = OUT / f"{name}.json"
    path.write_text(json.dumps(artifact, indent=2) + "\n")
    written.append((path.name, len(rows)))
    return path


_books = {}


def sheet(book, name):
    if book not in _books:
        _books[book] = openpyxl.load_workbook(CHARTS / book, read_only=True, data_only=True)
    return _books[book][name]


def grid(book, name):
    """Sheet as a list of (row_index -> {col_index: value}) with blanks dropped."""
    return [{j: c for j, c in enumerate(row) if c is not None}
            for row in sheet(book, name).iter_rows(values_only=True)]


def note_of(book, name):
    """The 'Note:'/'Source:' lines that sit at the bottom of every chart sheet."""
    out = []
    for row in grid(book, name):
        for v in row.values():
            if isinstance(v, str) and re.match(r"^(Note|Source)s?\s*:", v.strip()):
                out.append(" ".join(v.split()))
    return out


def d(x):
    return x.strftime("%Y-%m-%d")


CH1 = "GEP-June-2026-Chapter1-Fig1.1-1.10.xlsx"
CH2_OV = "GEP-June-2026-Chapter2-Overview.xlsx"
CH2_SAR = "GEP-June-2026-Chapter2-SAR.xlsx"

# ---------------------------------------------------------------- 1. Brent daily
rows = [r for r in grid(CH1, "1.4.A") if 12 in r and isinstance(r[12], dt.datetime) and 13 in r]
write_series(
    "worldbank-gep.WLD.energy.gep.brent_daily",
    "energy.gep.brent_daily",
    "Brent crude oil price, daily",
    "US$ per barrel",
    "daily",
    [{"date": d(r[12]), "value": round(float(r[13]), 2)} for r in rows],
    source_indicator_id="GEP-June-2026:figure-1.4.A",
    metadata={
        "figure": "Figure 1.4.A. Brent oil prices and geopolitical events",
        "upstream": "U.S. Energy Information Administration",
        "notes": note_of(CH1, "1.4.A"),
        "conflictStart": "2026-02-27",
    },
)

# --------------------------------------------- 2. The shock index (100 = 27 Feb 2026)
rows = [r for r in grid(CH1, "1.1.B") if 12 in r and isinstance(r[12], dt.datetime)]
for col, key, label in [(13, "brent", "Brent crude"),
                        (14, "eu_gas", "European natural gas"),
                        (15, "urea", "Urea"),
                        (16, "asian_lng", "Asian LNG")]:
    obs = [{"date": d(r[12]), "value": round(float(r[col]), 1)} for r in rows if col in r]
    write_series(
        f"worldbank-gep.WLD.energy.gep.shock_index_{key}",
        f"energy.gep.shock_index_{key}",
        f"{label} since the Middle East conflict began (27 Feb 2026 = 100)",
        "index, 27 Feb 2026 = 100",
        "daily",
        obs,
        source_indicator_id="GEP-June-2026:figure-1.1.B",
        metadata={
            "figure": "Figure 1.1.B. Energy and fertilizer prices",
            "rebaseDate": "2026-02-27",
            "rebaseNote": "27 February 2026 was the last market day before the onset of the conflict.",
            "seriesFrequency": "daily for Brent and European gas; weekly for urea",
            "notes": note_of(CH1, "1.1.B"),
        },
    )

# ------------------------------------------------------- 3. Strait of Hormuz transits
rows = [r for r in grid(CH1, "1.10.B") if 13 in r and isinstance(r[13], dt.datetime)]
for col, key, label in [(14, "daily", "daily total"),
                        (15, "7dma", "seven-day moving average"),
                        (16, "7dma_prior_year", "seven-day moving average, prior year")]:
    obs = [{"date": d(r[13]), "value": round(float(r[col]) / 1e6, 3)} for r in rows if col in r]
    write_series(
        f"worldbank-gep.WLD.trade.gep.hormuz_transits_{key}",
        f"trade.gep.hormuz_transits_{key}",
        f"Shipping through the Strait of Hormuz, {label}",
        "million metric tons per day",
        "daily",
        obs,
        source_indicator_id="GEP-June-2026:figure-1.10.B",
        metadata={
            "figure": "Figure 1.10.B. Shipping through the Strait of Hormuz",
            "upstream": "IMF PortWatch",
            "unitSource": ("The y-axis of figure 1.10.B reads 'Millions of metric tons'. That panel "
                           "is a raster image on PDF page 33, so the label does not appear in the "
                           "text layer and 'metric ton' cannot be grepped from the PDF - it has to "
                           "be read off the extracted image. An earlier version of this ingest "
                           "wrongly recorded that the GEP states no unit."),
            "valueScale": ("The workbook stores tonnes (3,467,990); these observations are divided "
                           "by 1e6 to match the published axis, so 3.468 means 3.468 million metric "
                           "tons that day."),
            "priorYearDates": ("The prior-year series carries 2025 volumes stamped with 2026 dates. "
                               "That is the World Bank's overlay convention for a year-on-year "
                               "comparison line, not an error, but it makes the series misleading "
                               "read standalone."),
            "lastObservation": "2026-05-24",
            "notes": note_of(CH1, "1.10.B"),
        },
    )

# ------------------------------------- 4. Middle East energy dependence, by region
rows = [r for r in grid(CH2_OV, "2.1.D") if 16 in r and isinstance(r[16], str) and 17 in r]
write_table(
    "worldbank-gep.REGIONS.energy.gep.middle_east_energy_dependence",
    "energy.gep.middle_east_energy_dependence",
    "Share of economies sourcing more than 30% of energy imports from the Middle East, 2023",
    "percent of economies in region",
    [{"region": r[16], "oil": float(r[17]), "naturalGas": float(r[18])} for r in rows],
    geography={"type": "region", "id": "EMDE-regions", "name": "EMDE regions"},
    source_indicator_id="GEP-June-2026:figure-2.1.D",
    metadata={
        "figure": "Figure 2.1.D. Dependence on Middle East energy imports",
        "middleEastDefinition": ("Bahrain, the Islamic Republic of Iran, Iraq, Kuwait, "
                                 "Qatar, Saudi Arabia, and the United Arab Emirates"),
        "sample": "108 EMDEs for oil, 89 for natural gas",
        "notes": note_of(CH2_OV, "2.1.D"),
    },
)

# ---------------------------------------- 5. Policy responses to the energy shock
rows = [r for r in grid(CH2_OV, "2.1.F") if 16 in r and isinstance(r[16], str) and 17 in r]
write_table(
    "worldbank-gep.REGIONS.trade.gep.energy_shock_policy_responses",
    "trade.gep.energy_shock_policy_responses",
    "Government policy responses to the 2026 energy shock, by region",
    "count of measures; response rate in percent",
    [{"region": r[16], "domesticSubsidy": r[17], "priceManagement": r[18],
      "supplyDemandManagement": r[19], "exportImportBarrier": r[20], "other": r[21],
      "responseRatePercent": r[22]} for r in rows],
    geography={"type": "region", "id": "EMDE-regions", "name": "EMDE regions"},
    source_indicator_id="GEP-June-2026:figure-2.1.F",
    metadata={
        "figure": "Figure 2.1.F. Policy responses to the energy shock",
        "upstream": "Global Trade Alert",
        "lastObservation": "2026-05-29",
        "notes": note_of(CH2_OV, "2.1.F"),
    },
)

# --------------------------------- 6. Growth by country group, June vs January 2026
rows = grid(CH1, "1.1.F")
groups, current = [], None
for r in rows:
    if 14 in r and isinstance(r[14], str):
        current = " ".join(str(r[14]).split())
    if current and 15 in r and 16 in r:
        groups.append({"group": current, "period": str(r[15]),
                       "june2026": float(r[16]),
                       "january2026": float(r[17]) if 17 in r else None})
write_table(
    "worldbank-gep.WLD.macro.gep.growth_by_group_vs_january",
    "macro.gep.growth_by_group_vs_january",
    "GDP growth by country group: June 2026 forecast against the January 2026 forecast",
    "percent",
    groups,
    source_indicator_id="GEP-June-2026:figure-1.1.F",
    metadata={"figure": "Figure 1.1.F. Growth by country group relative to January",
              "notes": note_of(CH1, "1.1.F")},
)

# -------------------------------------------------- 7. SAR panels (India back-out)
for name, key, unit, title in [
    ("2.7.A", "primary_fiscal_balance", "percent of GDP", "Primary fiscal balances"),
    ("2.7.B", "current_account_balance", "percent of GDP", "Current account balances"),
    ("2.7.C", "headline_inflation", "percent", "Headline inflation"),
]:
    rows, agg, out = grid(CH2_SAR, name), None, []
    for r in rows:
        if 17 in r and isinstance(r[17], str):
            agg = r[17]
        if agg and 18 in r and 19 in r:
            out.append({"aggregate": agg, "period": str(r[18]).replace("–", "-"),
                        "value": float(r[19]),
                        "sarExIndiaAndBangladesh": float(r[20]) if 20 in r else None})
    write_table(
        f"worldbank-gep.SAR.macro.gep.sar_{key}",
        f"macro.gep.sar_{key}",
        f"South Asia: {title}, with and without India",
        unit,
        out,
        geography=SAR,
        source_indicator_id=f"GEP-June-2026:figure-{name}",
        metadata={
            "figure": f"Figure {name}. {title}",
            "backOutNote": ("India is roughly four-fifths of South Asia's nominal GDP, so an "
                            "approximate India figure can be backed out of the SAR and "
                            "SAR-excluding-India rows. Any such number is a derivation, not a "
                            "World Bank publication."),
            "notes": note_of(CH2_SAR, name),
        },
    )

# ------------------------------------------------------ 8. India: the four labelled facts
GDP_BOOK = "GEP-Jun-2026-GDP-growth-data.xlsx"
_gdp = openpyxl.load_workbook(RAW / GDP_BOOK, read_only=True, data_only=True)


def gdp_grid(name):
    return [{j: c for j, c in enumerate(row) if c is not None}
            for row in _gdp[name].iter_rows(values_only=True)]


india_fy = [("2023-24", 7.2), ("2024-25", 7.1), ("2025-26", 7.7),
            ("2026-27", 6.6), ("2027-28", 7.2), ("2028-29", 7.0)]
sar_rows = gdp_grid("SAR")
for r in sar_rows:
    if r.get(0) == "India":
        vals = [r[k] for k in sorted(r) if k > 0 and isinstance(r[k], (int, float))]
        assert [round(v, 1) for v in vals[:6]] == [v for _, v in india_fy], vals
        rev26, rev27 = float(vals[6]), float(vals[7])
        break
else:
    raise SystemExit("India row not found in SAR sheet")

write_series(
    "worldbank-gep.IN.macro.gep.india_gdp_growth_fy",
    "macro.gep.india_gdp_growth_fy",
    "India real GDP growth, World Bank forecast (fiscal years)",
    "percent",
    "fiscal-year",
    [{"date": fy, "value": v} for fy, v in india_fy],
    geography=INDIA,
    source_indicator_id="GEP-June-2026:table-2.10",
    metadata={
        "table": "Table 2.10 South Asia economy forecasts",
        "fiscalYear": "1 April to 31 March",
        "estimateFrom": "2025-26",
        "vintage": "June 2026",
        "revisionVsJanuary2026": {"2026-27": rev26, "2027-28": rev27},
        "january2026Implied": {"2026-27": round(6.6 - rev26, 1), "2027-28": round(7.2 - rev27, 1)},
        "revisionNote": ("The June 2026 edition raised India's 2026-27 forecast by 0.1pp and "
                         "2027-28 by 0.6pp against January 2026 - even as the same edition cut "
                         "112 of 170 EMDE forecasts. The World Bank attributes India's resilience "
                         "to robust domestic demand, lower U.S. tariffs, new EU and UK free trade "
                         "agreements, a GST rate cut and a fuel tax cut."),
    },
)

# India quarterly, from the statistical annex
annex = gdp_grid("Statistical Appendix")
quarters = ["2024-Q4", "2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"]
for r in annex:
    label = next((str(v) for v in r.values() if isinstance(v, str)), "")
    if label.strip().startswith("India"):
        vals = [float(r[k]) for k in sorted(r) if isinstance(r[k], (int, float))]
        annual, qtr = vals[:6], vals[6:12]
        assert [round(v, 1) for v in annual] == [v for _, v in india_fy], annual
        write_series(
            "worldbank-gep.IN.macro.gep.india_gdp_growth_quarterly",
            "macro.gep.india_gdp_growth_quarterly",
            "India real GDP growth, year on year, by quarter",
            "percent",
            "quarterly",
            [{"date": q, "value": round(v, 1)} for q, v in zip(quarters, qtr)],
            geography=INDIA,
            source_indicator_id="GEP-June-2026:statistical-annex",
            metadata={
                "table": "Statistical Annex: Real GDP",
                "estimateFrom": "2026-Q1",
                "note": ("Calendar quarters, year-on-year. India accelerated through the first "
                         "months of the shock: 6.8 in 2025Q2, 8.3 in 2025Q3, 8.0 in 2025Q4, "
                         "7.8 estimated for 2026Q1."),
            },
        )
        break
else:
    raise SystemExit("India row not found in statistical annex")

# India PMI - India is the entire n=1 South Asia sample in figure 2.1.A
pmi_rows = grid(CH2_OV, "2.1.A")
# Layout: each region owns a three-column block of months; the row label sits in column 16.
header = next(r for r in pmi_rows if any(isinstance(v, dt.datetime) for v in r.values()))
dates = {j: v for j, v in header.items() if isinstance(v, dt.datetime)}
avg_row = next(r for r in pmi_rows if r.get(16) == "2025 average")
sar_row = next(r for r in pmi_rows if r.get(16) == "SAR")
sar_cols = sorted(j for j in dates if j in sar_row)
sar_avg = float(avg_row[sar_cols[0]])
obs = [{"date": dates[j].strftime("%Y-%m"), "value": float(sar_row[j])} for j in sar_cols]
write_series(
    "worldbank-gep.IN.macro.gep.india_pmi_monthly",
    "macro.gep.india_pmi_monthly",
    "India headline PMI (the entire South Asia sample in GEP figure 2.1.A)",
    "index, 50+ = expansion",
    "monthly",
    obs,
    geography=INDIA,
    source_indicator_id="GEP-June-2026:figure-2.1.A",
    metadata={
        "figure": "Figure 2.1.A. Headline PMIs",
        "upstream": "Haver Analytics",
        "sampleNote": "The GEP's South Asia PMI sample is n=1, and that one economy is India.",
        "seriesCaveat": ("The GEP note reads 'composite or manufacturing PMIs by region' and does "
                         "not say which one South Asia uses. Call this a headline PMI, not a "
                         "composite PMI, unless it is checked against the S&P Global release."),
        "average2025": sar_avg,
        "notes": note_of(CH2_OV, "2.1.A"),
    },
)

# ---------------------------- 9. Forecast revisions across every EMDE (derived count)
# The chapter-2 regional tables interleave real economies with sub-aggregates ("GCC",
# "Central Asia", "SAR excluding India", "Commodity exporters"). Counting those as
# economies inflates the total and double counts their members, so they are named and
# excluded here rather than caught by a prefix heuristic.
SUB_AGGREGATES = {
    "EAP excluding China", "Pacific Island Economies",
    "ECA excl. Russian Federation and Türkiye", "ECA plus Bulgaria and Croatia",
    "Commodity exporters", "Commodity importers", "Central Europe",
    "Central Europe plus Bulgaria and Croatia", "Western Balkans", "Eastern Europe",
    "South Caucasus", "Central Asia",
    "South America", "Central America", "Caribbean excluding Guyana",
    "Hydrocarbon exporters", "GCC", "Non-GCC", "Hydrocarbon importers",
    "SAR excluding India", "Excluding Bangladesh",
    "SSA excluding Nigeria and South Africa", "Non-resource-rich countries",
    "Industrial commodity exporters", "FCS", "Non-FCS",
}

economies, aggregates, seen = [], [], set()
for region in ["EAP", "ECA", "LAC", "MNA", "SAR", "SSA"]:
    for r in gdp_grid(region):
        name = str(r.get(0, "")).strip()
        if len(name) < 3 or name in seen:
            continue
        if name.lower().startswith(("emde", "gdp", "private", "public", "fixed", "exports",
                                    "imports", "net ", "memo", "source", "note", "table", "(")):
            continue
        # Read by COLUMN POSITION, not by filtering to numerics. The layout is fixed:
        # 0 name | 1-6 2023..2028 | 7 spacer | 8 revision to 2026 | 9 revision to 2027.
        # Compacting the row instead shifts every later field whenever a ".." appears
        # mid-row, which is exactly what dropped Myanmar and Yemen and would have
        # misread the growth columns of any row that survived.
        num = lambda col: float(r[col]) if isinstance(r.get(col), (int, float)) else None
        rev26, rev27 = num(8), num(9)
        if rev26 is None:
            continue
        seen.add(name)
        clean_name = re.sub(r"(?:\s+\d+)+$", "", name)
        entry = {
            "economy": clean_name, "region": region,
            "growth2025e": num(3), "growth2026f": num(4),
            "revision2026": rev26, "revision2027": rev27,
            "isSubAggregate": clean_name in SUB_AGGREGATES,
        }
        (aggregates if entry["isSubAggregate"] else economies).append(entry)

def tally(rows):
    return {
        "upgraded": sum(1 for e in rows if e["revision2026"] > 0),
        "unchanged": sum(1 for e in rows if e["revision2026"] == 0),
        "downgraded": sum(1 for e in rows if e["revision2026"] < 0),
        "total": len(rows),
    }

economy_counts = tally(economies)
all_counts = tally(economies + aggregates)
up = economy_counts["upgraded"]
flat = economy_counts["unchanged"]
down = economy_counts["downgraded"]
economies = economies + aggregates
write_table(
    "worldbank-gep.EMDE.macro.gep.forecast_revisions_2026",
    "macro.gep.forecast_revisions_2026",
    "How every EMDE forecast for 2026 moved between the January and June 2026 GEP",
    "percentage points",
    sorted(economies, key=lambda e: -e["revision2026"]),
    geography=EMDE,
    source_indicator_id="GEP-June-2026:tables-2.3-to-2.11",
    metadata={
        "derivation": ("Assembled from the six regional forecast tables in chapter 2. Each row "
                       "is one economy or sub-aggregate carrying a revision against the January "
                       "2026 edition. Rows that are expenditure components or regional totals "
                       "are dropped."),
        "counts": economy_counts,
        "countsIncludingSubAggregates": all_counts,
        "countsNote": ("Quote the economy-only counts. The regional tables also carry %d "
                       "sub-aggregates (GCC, Central Asia, SAR excluding India and so on) that "
                       "double count their own members; including them gives %d down / %d up / "
                       "%d unchanged of %d entries."
                       % (len(aggregates), all_counts["downgraded"], all_counts["upgraded"],
                          all_counts["unchanged"], all_counts["total"])),
        "indiaNote": ("India is one of %d economies upgraded for 2026. Most other upgrades are "
                      "commodity exporters that gain when oil is dear, or economies small enough "
                      "that one project moves the number; by the GEP's own Table 1.2 the "
                      "commodity-IMPORTING upgrades number 14, the largest of them Jamaica at "
                      "+1.3. Do not describe the importer upgrades as a short list."
                      % up),
        "caveat": ("India, Bangladesh, Bhutan, Nepal, Egypt, Pakistan, Ethiopia, Afghanistan and "
                   "the Islamic Republic of Iran report on a fiscal-year basis; their revision "
                   "columns refer to the fiscal year straddling 2026. Myanmar and Yemen carry a "
                   "2026 revision but no 2027 one."),
    },
)

# ---------------------------------------------- 10. The World Bank's oil price path
oil = {"2023": 82.6, "2024": 80.7, "2025": 69.0, "2026": 94.0, "2027": 76.0, "2028": 65.0}
write_series(
    "worldbank-gep.WLD.energy.gep.brent_annual_path",
    "energy.gep.brent_annual_path",
    "Brent crude oil, annual average: World Bank estimates and forecast",
    "US$ per barrel",
    "annual",
    [{"date": k, "value": v} for k, v in oil.items()],
    source_indicator_id="GEP-June-2026:table-1.1",
    metadata={
        "table": "Table 1.1 Real GDP, commodity price memorandum items",
        "estimateFrom": "2025",
        "forecastFrom": "2026",
        "revisionVsJanuary2026": {"2026": 34.0, "2027": 11.0},
        "january2026Implied": {"2026": 60.0, "2027": 65.0},
        "baselineAssumption": ("Shipping through the Strait of Hormuz stays severely disrupted "
                              "through July 2026, resumes haltingly, and approaches pre-conflict "
                              "levels by end-2026."),
    },
)

for name, n in written:
    print(f"  {name}  ({n} rows)")
print(f"\n{len(written)} artifacts written to data/series/")
print(f"EMDE 2026 revisions: {up} up / {flat} unchanged / {down} down "
      f"(of {len(economies)})")
