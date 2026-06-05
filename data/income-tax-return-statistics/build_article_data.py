#!/usr/bin/env python3
"""Emit canonical data/series/*.json artifacts for the income-tax article (q.econ.income_tax)
from the validated analysis JSONs. Reproducible; numbers traced to CBDT / IDH / OECD / ICTD."""
import json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(REPO, "data", "series")
TS = os.path.expanduser("~/Downloads/ITD_TimeSeries_FY2000-01_to_2024-25.pdf")

spine = json.load(open(os.path.join(HERE, "spine.json")))
series = json.load(open(os.path.join(HERE, "series.json")))
extras = json.load(open(os.path.join(HERE, "extras.json")))
intl = json.load(open(os.path.join(HERE, "international.json")))
oecd = json.load(open(os.path.join(HERE, "oecd-revenue.json")))

CBDT_URL = "https://www.incometaxindia.gov.in/pages/statistics.aspx"
ay_year = lambda k: k.replace("AY_", "").split("-")[0]      # AY_2012-13 -> 2012
fy_year = lambda k: k.replace("FY", "").split("-")[0]        # FY2000-01 -> 2000

def write(indicatorId, title, unit, observations=None, rows=None, sourceId="cbdt",
          sourceIndicatorId="", sourceUrl=CBDT_URL, metadata=None, artifactType=None):
    art = {
        "schemaVersion": 1,
        "artifactType": artifactType or ("table" if rows is not None else "series"),
        "indicatorId": indicatorId,
        "title": title,
        "sourceId": sourceId,
        "sourceIndicatorId": sourceIndicatorId or indicatorId,
        "sourceUrl": sourceUrl,
        "unit": unit,
        "geography": {"type": "country", "id": "IND", "name": "India"},
    }
    if observations is not None:
        art["observations"] = [{"date": d, "value": v} for d, v in observations if v is not None]
    if rows is not None:
        art["rows"] = rows
    if metadata:
        art["metadata"] = metadata
    fn = os.path.join(OUT, indicatorId.replace(".", "_") + ".json")
    json.dump(art, open(fn, "w"), indent=1)
    return os.path.basename(fn)

written = []
ays = sorted(spine.keys())

# 1) Zero-tax share over time (hero)
written.append(write("tax.itr.zero_tax_share", "Share of income-tax returns that owe zero tax",
    "% of returns", observations=[(ay_year(a), spine[a]["pct_zero"]) for a in ays],
    sourceIndicatorId="ITR Statistics: All Taxpayers, Range of Tax Payable"))

# 2) Returns filed vs returns that pay any tax
written.append(write("tax.itr.returns_total", "Income-tax returns filed (after consistency rules)",
    "returns", observations=[(ay_year(a), spine[a]["returns"]) for a in ays],
    sourceIndicatorId="ITR Statistics: total returns analysed"))
written.append(write("tax.itr.returns_paying", "Returns that actually pay income tax (tax payable > 0)",
    "returns", observations=[(ay_year(a), spine[a]["returns"] - spine[a]["zero_tax"]) for a in ays],
    sourceIndicatorId="ITR Statistics: returns with positive tax payable"))

# 3) Top-end concentration over time
written.append(write("tax.itr.income_share_top1cr", "Share of all declared income held by returns above ₹1 crore",
    "% of returned income", observations=[(ay_year(a), spine[a]["inc_share_gt1cr_pct"]) for a in ays],
    sourceIndicatorId="ITR Statistics: Range of Returned Income"))
written.append(write("tax.itr.tax_share_top1cr", "Share of all income tax paid by returns owing above ₹1 crore",
    "% of tax payable", observations=[(ay_year(a), spine[a]["tax_share_gt1cr_pct"]) for a in ays],
    sourceIndicatorId="ITR Statistics: Range of Tax Payable"))

# 4) Personal vs corporate collections (FY) — parse Time-Series PDF section 1.1
ts = subprocess.run(["pdftotext", "-layout", TS, "-"], capture_output=True, text=True).stdout
ts = "\n".join(l for l in ts.splitlines() if not re.search(r"\.{4,}", l))
corp, pers = [], []
seen = set()
for l in ts.splitlines():
    m = re.match(r"\s*(20\d\d)-\d\d\*?\s+(.+)$", l)
    if not m:
        continue
    y = m.group(1)
    nums = [int(re.sub(r"[^\d]", "", t)) for t in re.findall(r"[\d][\d,]*", m.group(2))]
    # section 1.1 row = corporate, non-corporate, other(small), total ; need >=4 and other<<rest
    if len(nums) >= 4 and y not in seen and 30000 < nums[0] < 2_000_000 and 30000 < nums[1] < 2_000_000 and nums[2] < 30000:
        seen.add(y)
        corp.append((y, nums[0])); pers.append((y, nums[1]))
written.append(write("tax.collect.corporate", "Corporate tax collected", "₹ crore",
    observations=corp, sourceId="cbdt", sourceIndicatorId="Time-Series 1.1 Corporate Tax"))
written.append(write("tax.collect.personal", "Personal (non-corporate) income tax collected", "₹ crore",
    observations=pers, sourceId="cbdt", sourceIndicatorId="Time-Series 1.1 Non-Corporate Tax"))

# 5) Direct taxes as % of all tax revenue (FY)
dvi = extras["direct_vs_indirect"]
written.append(write("tax.direct_share_of_total", "Direct taxes as a share of central tax revenue",
    "% of total taxes", observations=[(fy_year(k), dvi[k]["direct_pct_of_total"]) for k in sorted(dvi)],
    sourceIndicatorId="Time-Series 1.3"))

# 6) Cost of collection (FY)
coc = extras["cost_of_collection"]
written.append(write("tax.cost_of_collection", "Cost of collecting ₹100 of direct tax",
    "% of collection", observations=[(fy_year(k), coc[k]["cost_pct"]) for k in sorted(coc)],
    sourceIndicatorId="Time-Series 1.6"))

# 7) INDIVIDUAL income composition over time (AY) — salary / business / capital gains.
# IMPORTANT: use the Individual column only. The all-taxpayer totals fold company business
# income (~₹26 L cr) and company capital gains into "business"/"LTCG", which makes the chart
# apples-to-oranges next to salary (which is essentially individuals-only). Verified vs IDH.
master = json.load(open(os.path.join(HERE, "master.json")))
def _num(s):
    import re; s = re.sub(r"[^\d.-]", "", s or ""); return float(s) if s and s not in (".", "-") else None
def indiv_income(year, label):  # status-wise subtable1: [label, Individual, HUF, Firm, AOP/BOI, Companies, Others, Total]
    sw = master[year]["Status wise distribution of returns and key values"][1]
    for r in sw:
        if r and r[0].strip() == label:
            return _num(r[1])
    return None
mays = sorted(y for y in master if y != "AY_2012-13")
for ind, key, label in [("tax.income.salary", "Salary Income", "Salary income (individuals)"),
                        ("tax.income.business", "Business Income", "Business income (individuals)"),
                        ("tax.income.ltcg", "Long Term Capital Gains", "Long-term capital gains (individuals)")]:
    written.append(write(ind, label + " declared in returns", "₹ crore",
        observations=[(ay_year(a), indiv_income(a, key)) for a in mays if indiv_income(a, key) is not None],
        sourceIndicatorId="ITR Statistics: individual taxpayers, income by source"))

# 8) International tax-to-GDP (table bars)
ttg = intl["tax_to_gdp_pct"]
order = ["Germany", "United Kingdom", "Brazil", "South Africa", "United States", "China", "India", "Indonesia", "Bangladesh"]
rows = [{"label": ("India" if c == "India" else c), "value": ttg[c]["value"]} for c in order if c in ttg]
written.append(write("tax.intl.tax_to_gdp", "Tax-to-GDP ratio: India vs peers", "% of GDP",
    rows=rows, sourceId="ictd", sourceIndicatorId="UNU-WIDER/ICTD GRD (general government, incl. social contributions)",
    sourceUrl="https://ourworldindata.org/grapher/tax-revenues-as-a-share-of-gdp-unu-wider"))

# 9) International personal-income-tax/GDP (table bars) — OECD peers + India(CBDT)
od = oecd["data"]
pit_order = ["OECD average country", "Korea", "Asia and the Pacific", "India (CBDT/ICTD)",
             "Philippines", "Singapore", "China (People’s Republic of)", "Indonesia"]
nice = {"OECD average country": "OECD average", "Asia and the Pacific": "Asia-Pacific avg",
        "China (People’s Republic of)": "China", "India (CBDT/ICTD)": "India"}
pit_rows = [{"label": nice.get(c, c), "value": od[c]["pit_gdp"]} for c in pit_order if c in od and od[c].get("pit_gdp")]
written.append(write("tax.intl.pit_to_gdp", "Personal income tax as % of GDP: India vs peers", "% of GDP",
    rows=pit_rows, sourceId="oecd", sourceIndicatorId="OECD Revenue Statistics in Asia & Pacific; India from CBDT",
    sourceUrl="https://www.oecd.org/tax/tax-policy/global-revenue-statistics-database.htm"))

# 10) Policy spine: total income up to which an individual pays ZERO tax (nil-tax ceiling),
# by assessment year, general (<60) individual under the most favourable regime, EXCLUDING
# the standard deduction (which lifts the salaried threshold further). Sources: Finance Acts /
# Section 87A history + Budget speeches (2013, 2016, 2017, 2019, 2020, 2023, 2025).
nil_tax_ceiling = {
    "2013": 2.0,   # AY2013-14: basic exemption 2.0L (87A not yet)
    "2014": 2.2,   # AY2014-15: 87A rebate 2,000 (income <=5L) introduced
    "2015": 2.7,   # AY2015-16: exemption raised to 2.5L + 87A
    "2016": 2.7,   # AY2016-17
    "2017": 3.0,   # AY2017-18: 87A rebate raised to 5,000
    "2018": 3.0,   # AY2018-19: 87A 2,500 (income <=3.5L), slab rate cut to 5%
    "2019": 3.0,   # AY2019-20
    "2020": 5.0,   # AY2020-21: 87A rebate 12,500 (income <=5L) -> the big jump
    "2021": 5.0,   # AY2021-22
    "2022": 5.0,   # AY2022-23
    "2023": 5.0,   # AY2023-24  (last year with ITR-distribution data)
    "2024": 7.0,   # AY2024-25: new regime default, 87A 25,000 (income <=7L)
    "2025": 7.0,   # AY2025-26
    "2026": 12.0,  # AY2026-27: 87A 60,000 (income <=12L) -> next big jump
}
written.append(write("tax.policy.nil_tax_ceiling",
    "Income you can earn before paying any income tax", "₹ lakh",
    observations=sorted(nil_tax_ceiling.items()),
    sourceId="finance-acts", sourceIndicatorId="Section 87A rebate + basic exemption history",
    sourceUrl="https://incometaxindia.gov.in",
    metadata={"basis": "general individual <60, most favourable regime, total income, excludes standard deduction"}))

# 3b) Concentration SNAPSHOT (clearer than the two-line trend): how all income tax in the
# latest year splits between the tiny top group and everyone else. 100%-stacked share strip.
ay_latest = ays[-1]  # AY_2023-24
top_share = spine[ay_latest]["tax_share_gt1cr_pct"]   # 58.1
n_top = spine[ay_latest]["n_tax_gt1cr"]               # ~91,062
n_all = spine[ay_latest]["returns"]
top_pct_filers = round(100 * n_top / n_all, 1)        # ~0.1
written.append(write("tax.itr.tax_concentration",
    "Who pays India's income tax", "% of all income tax",
    rows=[
        {"label": f"The top {top_pct_filers}% of filers (~{round(n_top/1000)*1000:,} returns each owing over ₹1 crore in tax)", "value": round(top_share, 1)},
        {"label": "Every other taxpayer combined", "value": round(100 - top_share, 1)},
    ],
    sourceIndicatorId="ITR Statistics: All Taxpayers, Range of Tax Payable (AY2023-24)",
    metadata={"share": True}))

print(f"wrote {len(written)} artifacts to data/series/:")
for w in written: print("  ", w)
print("\nPersonal/corporate FY coverage:", corp[0][0], "->", corp[-1][0], f"({len(corp)} yrs)")
print("tax-to-GDP rows:", len(rows), "| PIT rows:", len(pit_rows))
