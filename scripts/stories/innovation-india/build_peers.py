"""Build the peer and world comparison artifacts for "How innovative is India?".

Reads data/audits/innovation-india/peer_series.json (tidy, cell-checked) and the all-economy WDI
pulls in data/raw/innovation-peers/worldbank-wdi-world/, and writes data/series/innov-peers.*.json
plus data/audits/innovation-india/peer-build-audit.json.

Run: python3 scripts/stories/innovation-india/build_peers.py
"""
import json, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/innovation-peers/worldbank-wdi-world"
SERIES = ROOT / "data/series"
AUDIT = ROOT / "data/audits/innovation-india"
FETCHED = "2026-10-20T00:00:00.000Z"
TIDY = json.loads((AUDIT / "peer_series.json").read_text())
NAMES = {"IND": "India", "CHN": "China", "VNM": "Viet Nam", "IDN": "Indonesia", "BRA": "Brazil", "TUR": "Türkiye", "MYS": "Malaysia",
         "THA": "Thailand", "PHL": "Philippines", "MEX": "Mexico", "ZAF": "South Africa", "KOR": "Republic of Korea", "USA": "United States", "WLD": "World"}
audit = {"generatedBy": "scripts/stories/innovation-india/build_peers.py", "values": [], "checks": []}
OUT = {}


def fail(msg):
    sys.exit(f"build_peers: {msg}")


def check(ok, what):
    audit["checks"].append({"check": what, "ok": bool(ok)})
    if not ok:
        fail(what)


def tidy(ind, iso=None):
    rows = [r for r in TIDY if r["indicator"] == ind and (iso is None or r["iso3"] == iso)]
    return sorted(rows, key=lambda r: (r["iso3"], r["year"]))


def art(kind, iid, title, unit, payload, meta, url, src="worldbank", geo=None):
    a = {"schemaVersion": 1, "artifactType": kind, "indicatorId": iid, "title": title, "sourceId": src, "sourceIndicatorId": iid,
         "sourceUrl": url, "unit": unit, **({"frequency": "annual"} if kind == "series" else {}),
         "geography": geo or {"type": "world", "id": "WLD", "name": "World"}, "dimensions": [], "fetchedAt": FETCHED,
         ("observations" if kind == "series" else "rows"): payload, "metadata": meta}
    OUT[iid] = a


# ------------------------------------------------------------------ world WDI, for ranks
def wdi(code):
    body = json.loads((RAW / f"wdi_world_{code}.json").read_text())
    out = {}
    for r in body[1]:
        if r["value"] is not None:
            out.setdefault(r["countryiso3code"], {})[int(r["date"])] = float(r["value"])
    return out


countries = {c["id"]: c["name"] for c in json.loads((RAW / "wdi_countries.json").read_text())[1] if c["region"]["value"] != "Aggregates"}
check(180 <= len(countries) <= 230, f"WDI economies (not aggregates): {len(countries)}")
pop, gdp = wdi("SP.POP.TOTL"), wdi("NY.GDP.MKTP.PP.CD")


def measure(code, since, total=None):
    """Latest year since `since` per economy: (year, total, per million people)."""
    src, out = wdi(code), {}
    for iso, by in src.items():
        if iso not in countries:
            continue
        ys = [y for y in by if y >= since and y in pop.get(iso, {}) and (total != "rd" or y in gdp.get(iso, {}))]
        if not ys:
            continue
        y = max(ys)
        v, p = by[y], pop[iso][y]
        if total == "rd":          # R&D % GDP -> PPP dollars
            t = v / 100 * gdp[iso][y]
        elif total == "permillion":  # per million people -> people
            t = v * p / 1e6
        else:
            t = v
        out[iso] = (y, t, t / p * 1e6)
    return out


def rank_of(vals, iso):
    order = sorted(vals, key=lambda k: -vals[k])
    n, r = len(order), order.index(iso) + 1
    return r, n, round(100 * (n - r) / (n - 1), 1)


MEASURES = [
    ("Patent applications by residents", "IP.PAT.RESD", 2020, None, "https://data.worldbank.org/indicator/IP.PAT.RESD"),
    ("Scientific and technical articles", "IP.JRN.ARTC.SC", 2020, None, "https://data.worldbank.org/indicator/IP.JRN.ARTC.SC"),
    ("Researchers in R&D", "SP.POP.SCIE.RD.P6", 2018, "permillion", "https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6"),
    ("Spending on R&D (PPP dollars)", "GB.XPD.RSDV.GD.ZS", 2018, "rd", "https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS"),
    ("ICT services exports", "BX.GSR.CCIS.CD", 2020, None, "https://data.worldbank.org/indicator/BX.GSR.CCIS.CD"),
]
# Phone labels: the full measure names do not fit a 350-wide figure.
SHORT = {"IP.PAT.RESD": "Patents", "IP.JRN.ARTC.SC": "Papers", "SP.POP.SCIE.RD.P6": "Researchers", "GB.XPD.RSDV.GD.ZS": "R&D spending", "BX.GSR.CCIS.CD": "ICT exports"}
rows = []
for label, code, since, kind, url in MEASURES:
    m = measure(code, since, kind)
    if "IND" not in m:
        fail(f"no India value for {code}")
    rt, n, at = rank_of({k: v[1] for k, v in m.items()}, "IND")
    rp, _, ap = rank_of({k: v[2] for k, v in m.items()}, "IND")
    y, t, pp = m["IND"]
    rows.append({"measure": label, "short": SHORT[code], "code": code, "year": y, "economies": n, "rankTotal": rt, "rankPerPerson": rp, "aheadTotal": at, "aheadPerPerson": ap,
                 "indiaTotal": round(t, 1), "indiaPerMillion": round(pp, 2)})
    audit["values"].append({"measure": code, "india_year": y, "india_total": t, "economies": n, "rank_total": rt, "rank_per_person": rp})
art("table", "innov.scale_vs_person.IN", "India's world rank by total and per person", "% of economies with data that India ranks ahead of", rows,
    {"definition": "Each economy's latest year since 2018 (R&D, researchers) or 2020 (others). Rank among economies with data; aggregates excluded. 'Ahead' = (n - rank)/(n - 1) x 100. Researchers = per million x population; R&D spending = % of GDP x GDP (PPP).",
     "sources": [m[4] for m in MEASURES]}, "https://data.worldbank.org/indicator/IP.PAT.RESD", geo={"type": "country", "id": "IND", "name": "India"})

# ------------------------------------------------------------------ R&D intensity and researchers, peers (latest year)
def latest(ind, isos, since):
    out = []
    for iso in isos:
        rs = [r for r in tidy(ind, iso) if r["year"] >= since and r["value"] is not None]
        if rs:
            r = rs[-1]
            out.append({"label": NAMES[iso], "iso3": iso, "value": round(r["value"], 2), "year": r["year"], "highlight": int(iso == "IND")})
            audit["values"].append({"indicator": ind, "iso3": iso, "year": r["year"], "value": r["value"], "raw_file": r.get("raw_file")})
    return out


PEERS = ["IND", "CHN", "VNM", "IDN", "BRA", "TUR", "MYS", "THA", "PHL", "MEX", "ZAF", "KOR", "USA"]
rd = latest("wdi.GB.XPD.RSDV.GD.ZS", PEERS + ["WLD"], 2018)
dst_new = [r for r in tidy("dst.gerd_pct_gdp", "IND") if r["edition"] == "2025-26" and r["period"] == "2023-24"]
check(len(dst_new) == 1 and dst_new[0]["value"] == 0.84, "DST 2025-26: GERD 0.84% of GDP in 2023-24")
rd.append({"label": "India (DST's new survey)", "iso3": "IND-DST", "value": 0.84, "year": 2023, "highlight": 1})
for r in rd:
    r["label"] = f"{r['label']}, {r['year']}" if r["iso3"] != "IND-DST" else "India, 2023-24 (DST)"
art("table", "innov.rd_pct_gdp_peers", "R&D spending as a share of GDP, India and peers, latest year", "% of GDP", sorted(rd, key=lambda r: -r["value"]),
    {"definition": "UNESCO UIS via World Bank WDI (Frascati GERD), latest year since 2018. The DST row is India's own 2025-26 R&D Statistics, built on a new national survey from 2021-22, so it is not on the same basis as India's 2020 UNESCO value.",
     "years": "Years differ by country and are printed with each name."}, "https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS")
res = latest("wdi.SP.POP.SCIE.RD.P6", PEERS + ["WLD"], 2014)
for r in res:
    r["label"] = f"{r['label']}, {r['year']}"
art("table", "innov.researchers_peers", "Researchers per million people, India and peers, latest year", "researchers (FTE) per million people", sorted(res, key=lambda r: -r["value"]),
    {"definition": "UNESCO UIS via World Bank WDI, full-time equivalent researchers per million people, latest year since 2014 (Brazil's latest is 2014)."}, "https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6")

# ------------------------------------------------------------------ India's own R&D intensity, two survey bases
old = [r for r in tidy("dst.gerd_pct_gdp", "IND") if r["edition"] == "2022-23" and r["year"] >= 2005]
new = [r for r in tidy("dst.gerd_pct_gdp", "IND") if r["edition"] == "2025-26" and 2021 <= r["year"] <= 2023]
check(old[-1]["period"] == "2020-21" and [r["period"] for r in new] == ["2021-22", "2022-23", "2023-24"], "DST bases split at 2021-22; projections (2024-25 on) excluded")
for key, rs, title in [("old", old, "earlier survey basis (to 2020-21)"), ("new", new, "new National S&T Survey basis (from 2021-22)")]:
    art("series", f"innov.dst_gerd_pct_gdp_{key}.IN", f"India's R&D spending, % of GDP, {title}", "% of GDP",
        [{"date": f"{r['year']}-03-31" if False else f"{r['year']}", "value": r["value"]} for r in rs],
        {"definition": "DST/NSTMIS Gross Expenditure on R&D as % of GDP, fiscal years (2021 = 2021-22).", "edition": rs[0]["edition"], "table": rs[0]["table"], "page": rs[0]["page"]},
        rs[0]["url"], src="dst", geo={"type": "country", "id": "IND", "name": "India"})

# ------------------------------------------------------------------ do Indian inventions go abroad? PCT per 100 resident filings
pct = {r["iso3"]: {x["year"]: x["value"] for x in tidy("wipo.pct_applications_by_origin", r["iso3"])} for r in tidy("wipo.pct_applications_by_origin")}
resd = {r["iso3"]: {x["year"]: x["value"] for x in tidy("wipo.resident_patent_applications", r["iso3"])} for r in tidy("wipo.resident_patent_applications")}
abroad = []
for iso in PEERS:
    y = 2024
    if y in pct.get(iso, {}) and y in resd.get(iso, {}) and resd[iso][y]:
        abroad.append({"label": NAMES[iso], "iso3": iso, "value": round(100 * pct[iso][y] / resd[iso][y], 1), "pct": pct[iso][y], "resident": resd[iso][y], "highlight": int(iso == "IND")})
art("table", "innov.pct_per_resident_2024", "International (PCT) filings per 100 resident patent filings, 2024", "PCT applications per 100 resident applications",
    sorted(abroad, key=lambda r: -r["value"]),
    {"definition": "WIPO: PCT international applications by origin (first-named applicant's residence), 2024, divided by resident patent applications at the home office, 2024. A rough signal of how many inventions are taken abroad; not a measure of quality on its own."},
    "https://www3.wipo.int/ipstats/", src="wipo")
for iso in ("IND",):
    art("series", "innov.pct_by_origin.IN", "PCT international patent applications from India", "applications",
        [{"date": str(y), "value": v} for y, v in sorted(pct[iso].items())], {"definition": "WIPO PCT applications by origin, filing year."},
        "https://www3.wipo.int/ipstats/", src="wipo", geo={"type": "country", "id": "IND", "name": "India"})

# ------------------------------------------------------------------ ICT services: India's share of the world's exports
ict = {r["iso3"]: {x["year"]: x["value"] for x in tidy("wdi.BX.GSR.CCIS.CD", r["iso3"])} for r in tidy("wdi.BX.GSR.CCIS.CD")}
share = [{"date": str(y), "value": round(100 * v / ict["WLD"][y], 2)} for y, v in sorted(ict["IND"].items()) if y in ict.get("WLD", {}) and y >= 2005]
check(len(share) >= 15, "India's share of world ICT services exports covers 15+ years")
art("series", "innov.ict_exports_world_share.IN", "India's share of the world's ICT services exports", "% of world ICT services exports", share,
    {"definition": "World Bank WDI BX.GSR.CCIS.CD (IMF balance of payments): computer, communications and other ICT services exports, India / World."},
    "https://data.worldbank.org/indicator/BX.GSR.CCIS.CD", geo={"type": "country", "id": "IND", "name": "India"})
art("series", "innov.ict_exports_usd.IN", "India's ICT services exports", "US$ billion",
    [{"date": str(y), "value": round(v / 1e9, 1)} for y, v in sorted(ict["IND"].items()) if y >= 2005],
    {"definition": "World Bank WDI BX.GSR.CCIS.CD, current US$."}, "https://data.worldbank.org/indicator/BX.GSR.CCIS.CD", geo={"type": "country", "id": "IND", "name": "India"})

for iid, a in OUT.items():
    (SERIES / f"innov-peers.{iid}.json").write_text(json.dumps(a, indent=1, ensure_ascii=False) + "\n")
audit["generatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
(AUDIT / "peer-build-audit.json").write_text(json.dumps(audit, indent=1, ensure_ascii=False) + "\n")
print(f"wrote {len(OUT)} artifacts")
for r in rows:
    print(r)
for k in ("innov.rd_pct_gdp_peers", "innov.researchers_peers", "innov.pct_per_resident_2024"):
    print(k, [(r["label"], r["value"]) for r in OUT[k]["rows"]])
print("ICT share", share[0], share[-1])
