"""Parse GII 2026 Appendix IV Tables 2 (top 100 clusters by size) and 3 (by intensity per person).

Reads the frozen GII 2026 report PDF and writes:
  data/series/wipo-gii.innov.clusters_2026.json        one row per cluster (size and intensity)
  data/series/wipo-gii.innov.clusters_india_2026.json  India's four clusters
  data/audits/innovation-india/clusters-audit.json     page, raw row text and checks

Run: python3 scripts/stories/innovation-india/build_clusters.py
"""
import hashlib, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PDF = ROOT / "data/raw/wipo-gii/report/wipo-pub-2000-2026-en-global-innovation-index-2026.pdf"
SERIES = ROOT / "data/series"
AUDIT = ROOT / "data/audits/innovation-india"
URL = "https://www.wipo.int/en/web/global-innovation-index/2026/innovation-clusters"
NUM = r"[\d,]+"
CHG = r"(?:[−\-–]?\d+|n\.a\.)"
CC = r"[A-Z]{2}\*?(?: ?/ ?[A-Z]{2}\*?)*"


def pages(a, b):
    return subprocess.run(["pdftotext", "-f", str(a), "-l", str(b), "-raw", str(PDF), "-"], capture_output=True, text=True, check=True).stdout


def flat(t):
    # Names and the intensity score wrap onto their own lines; read the table as one token stream.
    return re.sub(r"\s+", " ", t.replace("–\n", "–"))


def find_pages(title):
    hits = []
    for p in range(300, 349):
        if title in pages(p, p):
            hits.append(p)
    return hits


def to_int(s):
    return int(s.replace(",", ""))


def chg(s):
    return None if s == "n.a." else int(s.replace("−", "-").replace("–", "-"))


def parse(rx, text, fields):
    rows = {}
    for m in re.finditer(rx, text):
        rec = dict(zip(fields, m.groups()))
        rec["raw"] = m.group(0)
        rows.setdefault(int(rec["rank"]), rec)
    return rows


size_pages = find_pages("Appendix IV Table 2 Top innovation clusters, 2026")
int_pages = find_pages("Appendix IV Table 3 Innovation intensity ranking, 2026")
if not size_pages or not int_pages:
    sys.exit("cluster tables not found")
t2 = flat(pages(min(size_pages), max(size_pages)))
t3 = flat(pages(min(int_pages), max(int_pages)))
size = parse(rf"(?<![\d,.%])(\d{{1,3}}) ([^\d%]+?) ({CC}) ({NUM}) ({NUM}) ({NUM}) ([\d.]+)% ([\d.]+)% ([\d.]+)% ([\d.]+)% (\d+|n\.a\.) ({CHG})(?=\s)",
             t2, ["rank", "name", "cc", "pct", "pubs", "vc", "pctShare", "pubShare", "vcShare", "totalShare", "prevRank", "change"])
inten = parse(rf"(?<![\d,.%])(\d{{1,3}}) ([^\d%]+?) ({CC}) ({NUM}) ({NUM}) ({NUM}) ({NUM}) (\d\.\d{{3}}) ({CHG})(?=\s|$)",
              t3, ["rank", "name", "cc", "population", "pctPer", "pubsPer", "vcPer", "intensity", "change"])
problems = [f"size table ranks found: {len(size)}" for _ in [0] if sorted(size) != list(range(1, 101))]
problems += [f"intensity table ranks found: {len(inten)}" for _ in [0] if sorted(inten) != list(range(1, 101))]
if problems:
    missing2 = sorted(set(range(1, 101)) - set(size)); missing3 = sorted(set(range(1, 101)) - set(inten))
    sys.exit(f"build_clusters: {problems}; missing size {missing2}; missing intensity {missing3}")

def key_of(name, cc):
    # The two tables punctuate some names differently ("Washington, DC–Baltimore" / "Washington DC–Baltimore").
    return (re.sub(r"[^a-z]", "", name.lower()), cc)


by_name = {}
for r in inten.values():
    k = key_of(r["name"], r["cc"])
    if k in by_name:
        sys.exit(f"build_clusters: two intensity rows share the key {k}")
    by_name[k] = r
rows = []
for k in range(1, 101):
    s = size[k]
    key = key_of(s["name"], s["cc"])
    i = by_name.get(key)
    if i is None:
        sys.exit(f"build_clusters: {key} in the size table has no intensity row")
    rows.append({"label": s["name"].strip(), "economy": s["cc"], "sizeRank": k, "intensityRank": int(i["rank"]),
                 "pct": to_int(s["pct"]), "publications": to_int(s["pubs"]), "vcDeals": to_int(s["vc"]),
                 "totalSharePct": float(s["totalShare"]), "population": to_int(i["population"]),
                 "pctPerMillion": to_int(i["pctPer"]), "pubsPerMillion": to_int(i["pubsPer"]), "vcPerMillion": to_int(i["vcPer"]),
                 "intensity": float(i["intensity"]), "prevSizeRank": None if s["prevRank"] == "n.a." else int(s["prevRank"]), "sizeChange": chg(s["change"]),
                 "highlight": int(s["cc"] == "IN"),
                 # scatterFit reads label, x, y
                 "x": float(s["totalShare"]), "y": float(i["intensity"])})
india = [r for r in rows if r["economy"] == "IN"]
assert [r["label"] for r in india] == ["Bengaluru", "Delhi", "Mumbai", "Chennai"], india


def table(iid, title, unit, rs, meta):
    return {"schemaVersion": 1, "artifactType": "table", "indicatorId": iid, "title": title, "sourceId": "wipo-gii", "sourceIndicatorId": iid,
            "sourceUrl": URL, "unit": unit, "geography": {"type": "world", "id": "WLD", "name": "World"}, "dimensions": [],
            "fetchedAt": "2026-10-20T00:00:00.000Z", "rows": rs, "metadata": meta}


META = {"publisher": "WIPO, GII 2026 Appendix IV Tables 2 and 3", "licence": "CC BY 4.0",
        "definition": "Clusters are areas of dense inventor and author activity (WIPO's DBSCAN method). Size = share of the world's PCT applications, scientific publications and venture-capital deals (fractional counts). Intensity = the same three per person, combined.",
        "comparability": "Method changed in 2023 (data years) and 2025 (VC deals added): compare 2025 and 2026 only.",
        "xLabel": "Share of the world's patents, papers and VC deals, %", "yLabel": "Innovation intensity (per person)"}
SERIES.joinpath("wipo-gii.innov.clusters_2026.json").write_text(json.dumps(table("innov.clusters_2026", "The world's top 100 innovation clusters, 2026: size and intensity", "share of world activity, % / intensity score", rows, META), indent=1, ensure_ascii=False) + "\n")
SERIES.joinpath("wipo-gii.innov.clusters_india_2026.json").write_text(json.dumps(table("innov.clusters_india_2026", "India's four clusters in the GII 2026 top 100", "count (fractional)", india, META), indent=1, ensure_ascii=False) + "\n")
AUDIT.mkdir(parents=True, exist_ok=True)
AUDIT.joinpath("clusters-audit.json").write_text(json.dumps({
    "generatedBy": "scripts/stories/innovation-india/build_clusters.py", "pdf": str(PDF.relative_to(ROOT)), "sha256": hashlib.sha256(PDF.read_bytes()).hexdigest(),
    "sizePages": size_pages, "intensityPages": int_pages, "checks": ["100 ranks in each table", "every size row matched to one intensity row by name and economy"],
    "india": [{"size": size[r["sizeRank"]]["raw"], "intensity": inten[r["intensityRank"]]["raw"]} for r in india]}, indent=1, ensure_ascii=False) + "\n")
for r in india:
    print(r)
