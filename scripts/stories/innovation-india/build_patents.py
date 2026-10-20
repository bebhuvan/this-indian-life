"""Build the IP India patent artifacts for "How innovative is India?".

Reads data/audits/innovation-india/ipindia_extract.json (every value with file, page and raw row
text; see extract_ipindia.py) and the NCP population projections, and writes:
  data/series/ipindia.innov.ipindia.filings_by_applicant.IN.json   long table for a stacked area
  data/series/ipindia.innov.ipindia.state_filings_per_million.json choropleth, 2024-25
  data/audits/innovation-india/patents-build-audit.json            values used and checks

Run: python3 scripts/stories/innovation-india/build_patents.py
"""
import hashlib, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EX = json.loads((ROOT / "data/audits/innovation-india/ipindia_extract.json").read_text())
NCP = ROOT / "data/raw/innovation-claims/ncp/Report_Population_Projection_2019.pdf"
GEO = json.loads((ROOT / "data/series/era5.IN.state_warming.json").read_text())
SERIES = ROOT / "data/series"
AUDIT = ROOT / "data/audits/innovation-india"
URL = "https://ipindia.gov.in/annual-report"
FETCHED = "2026-10-20T00:00:00.000Z"
audit = {"generatedBy": "scripts/stories/innovation-india/build_patents.py", "checks": [], "values": []}


def check(ok, what):
    audit["checks"].append({"check": what, "ok": bool(ok)})
    if not ok:
        sys.exit(f"build_patents: {what}")


def latest(table, **match):
    """For each (data_fy, row/column) keep the value from the most recent report that prints it."""
    best = {}
    for r in EX["records"]:
        if r["table"] != table or any(r.get(k) != v for k, v in match.items()):
            continue
        k = (r["data_fy"], r.get("state") or r.get("row_label"), r["column"])
        if k not in best or r["report_fy"] > best[k]["report_fy"]:
            best[k] = r
    return best


# ------------------------------------------------------------------ 1. Indian filings by applicant type
cat = latest("category")
years = sorted({k[0] for k in cat})
check(years[0] == "2016-17" and years[-1] == "2024-25", f"category table covers 2016-17 to 2024-25 ({years[0]}..{years[-1]})")
LAYERS = [
    ("Educational institutions", ["ei_indian"]),
    ("Companies and labs", ["onp_indian"]),
    ("Startups and small firms", ["su_indian", "se_indian"]),
    ("Individuals", ["np_indian"]),
]
rows, totals = [], {}
for fy in years:
    def val(col):
        hits = [r for k, r in cat.items() if k[0] == fy and k[2] == col]
        if not hits:
            return 0 if col.startswith("ei_") else None   # the category exists only from 2021-22
        audit["values"].append({"fy": fy, "column": col, "value": hits[0]["value"], "file": hits[0]["file"], "page": hits[0]["page"], "raw": hits[0]["raw_text"]})
        return hits[0]["value"]
    parts = {}
    for label, cols in LAYERS:
        vs = [val(c) for c in cols]
        check(all(v is not None for v in vs), f"{fy}: {label} present")
        parts[label] = sum(vs)
    printed = val("total_indian")
    s = sum(parts.values())
    # 2020-21: the categories add to 24,336; every later report prints a total of 24,326.
    check(abs(s - printed) <= 10, f"{fy}: categories ({s}) match the printed Indian total ({printed}) within 10")
    totals[fy] = {"sum": s, "printed": printed}
    for label, v in parts.items():
        rows.append({"date": fy[:4], "fy": fy, "series": label, "value": v})
by = {(r["fy"], r["series"]): r["value"] for r in rows}
ei = by[("2024-25", "Educational institutions")]
check(ei / totals["2024-25"]["printed"] > 0.5, f"educational institutions over half of Indian filings in 2024-25 ({ei}/{totals['2024-25']['printed']})")
combined = {fy: by[(fy, "Educational institutions")] + by[(fy, "Companies and labs")] for fy in years}

art = {"schemaVersion": 1, "artifactType": "table", "indicatorId": "innov.ipindia.filings_by_applicant.IN",
       "title": "Patent applications by Indian applicants, by type of applicant", "sourceId": "ipindia", "sourceIndicatorId": "IP India annual reports, applications by category of applicant",
       "sourceUrl": URL, "unit": "applications", "geography": {"type": "country", "id": "IND", "name": "India"}, "dimensions": [], "fetchedAt": FETCHED, "rows": rows,
       "metadata": {"definition": "Patent applications filed at the Indian Patent Office by Indian applicants, financial years, from the 'applications by category' table of each IP India annual report (latest edition printing each year). Startups and small entities are the two reduced-fee categories for firms.",
                    "break": "Educational institutions became a separate, reduced-fee category under the Patents (Amendment) Rules 2021, in force from 21 September 2021. Before that, universities filed among 'other than natural persons' (here, companies, labs and other organisations), so the two layers should be read together across 2021-22.",
                    "combinedInstitutionsAndOrganisations": combined, "printedIndianTotals": {k: v["printed"] for k, v in totals.items()},
                    "note2020_21": "Categories add to 24,336; later reports print 24,326 for the Indian total."}}
(SERIES / "ipindia.innov.ipindia.filings_by_applicant.IN.json").write_text(json.dumps(art, indent=1, ensure_ascii=False) + "\n")

# ------------------------------------------------------------------ 2. filings per million people by state, 2024-25
st = latest("state", report_fy="2024-25")
filings = {}
for (fy, state, col), r in st.items():
    if fy != "2024-25" or state == "TOTAL":
        continue
    filings[state] = filings.get(state, 0) + r["value"]
tot = sum(r["value"] for (fy, s, c), r in st.items() if fy == "2024-25" and s == "TOTAL")
check(sum(filings.values()) == tot, f"state rows ({sum(filings.values())}) add to the printed total ({tot})")

# NCP Table 21: projected population on 1 March, '000. Interpolate 2021 -> 2026 to 1 March 2025.
txt = subprocess.run(["pdftotext", "-f", "263", "-l", "264", "-layout", str(NCP), "-"], capture_output=True, text=True, check=True).stdout
pages = txt.split("\f")
num = r"([\d,]+)"
pat = re.compile(rf"^\s*\d{{2}}\s+(.+?)\s+{num}\s+{num}\s+{num}\s+{num}\s+{num}\s+{num}\s+{num}\s+{num}\s+{num}\s*$", re.M)
p2021 = {m.group(1).strip(" *"): int(m.group(8).replace(",", "")) for m in pat.finditer(pages[0])}
p2026 = {m.group(1).strip(" *"): int(m.group(2).replace(",", "")) for m in pat.finditer(pages[1])}
check(len(p2021) == 37 and len(p2026) == 37, f"NCP Table 21: 37 states and UTs in 2021 ({len(p2021)}) and 2026 ({len(p2026)})")
pop25 = {k: (p2021[k] + 0.8 * (p2026[k] - p2021[k])) * 1000 for k in p2021}
NCP_NAME = {"Jammu & Kashmir": "Jammu & Kashmir (UT)", "Delhi": "NCT of Delhi", "Uttarakhand": "Uttaranchal",
            "Andaman & Nicobar": "Andaman & Nicobar Islands"}
GEO_NAME = {"Andaman & Nicobar": "Andaman and Nicobar Islands", "Jammu & Kashmir": "Jammu and Kashmir",
            "Dadra and Nagar Haveli and Daman Diu": "Dadra and Nagar Haveli and Daman and Diu"}
per = {}
for s, n in filings.items():
    if s == "Dadra and Nagar Haveli and Daman Diu":
        p = pop25["Dadra & Nagar Haveli"] + pop25["Daman Diu"]
    else:
        p = pop25[NCP_NAME.get(s, s)]
    per[s] = {"filings": n, "population": round(p), "perMillion": round(n / p * 1e6, 1)}
paths = {r["name"]: r["path"] for r in GEO["regions"]}
regions = []
for s, v in per.items():
    g = GEO_NAME.get(s, s)
    if g in paths:
        regions.append({"name": g, "value": v["perMillion"], "path": paths[g]})
check(len(regions) == 34, f"34 states and UTs mapped (Puducherry has no outline): {len(regions)}")
ranked = sorted(per.items(), key=lambda kv: -kv[1]["perMillion"])
vals = [r["value"] for r in regions]
chor = {"schemaVersion": 1, "artifactType": "choropleth", "indicatorId": "innov.ipindia.state_filings_per_million",
        "title": "Patent applications per million people, by state, 2024-25", "sourceId": "ipindia",
        "sourceIndicatorId": "IP India Annual Report 2024-25, applications by state of origin; NCP population projections",
        "sourceUrl": URL, "unit": "applications per million people", "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
        "fetchedAt": FETCHED, "viewBox": GEO["viewBox"], "min": min(vals), "max": max(vals), "regions": regions,
        "metadata": {"definition": "Patent applications (ordinary, convention and PCT national phase) by Indian applicants, by the applicant's state, 2024-25, divided by projected population on 1 March 2025.",
                     "population": "National Commission on Population, Technical Group on Population Projections (2019), Table 21, interpolated linearly between 1 March 2021 and 1 March 2026. India has had no census since 2011.",
                     "caveat": "State of origin is the applicant's address, so a university or company files where it is registered, not where its inventors work.",
                     "table": [{"state": s, **v} for s, v in ranked]}}
(SERIES / "ipindia.innov.ipindia.state_filings_per_million.json").write_text(json.dumps(chor, indent=1, ensure_ascii=False) + "\n")
audit["stateRanking"] = [{"state": s, **v} for s, v in ranked]
audit["combinedInstitutionsAndOrganisations"] = combined
audit["ncpSha256"] = hashlib.sha256(NCP.read_bytes()).hexdigest()
(AUDIT / "patents-build-audit.json").write_text(json.dumps(audit, indent=1, ensure_ascii=False) + "\n")
print("by applicant, 2024-25:", {k[1]: v for k, v in by.items() if k[0] == "2024-25"}, "printed", totals["2024-25"])
print("combined institutions + organisations:", combined)
print("top states per million:", [(s, v["perMillion"], v["filings"]) for s, v in ranked[:8]])
print("bottom:", [(s, v["perMillion"]) for s, v in ranked[-5:]])
