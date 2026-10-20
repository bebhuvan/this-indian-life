"""Build the GII-derived artifacts for "How innovative is India?".

Reads only frozen files under data/raw/wipo-gii/ and writes:
  data/series/wipo-gii.*.json              chart artifacts
  data/audits/innovation-india/gii-source-audit.json   every value with its cell or page

Run: uv run --with openpyxl python3 scripts/stories/innovation-india/build_gii.py
"""
import hashlib, json, re, statistics, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/wipo-gii"
SERIES = ROOT / "data/series"
AUDIT = ROOT / "data/audits/innovation-india"
FETCHED = "2026-10-20T00:00:00.000Z"
EDITIONS = range(2022, 2027)
DB_URL = "https://www.wipo.int/edocs/pubdocs/en/wipo-pub-2000-{y}-tech1.xlsx"
GII_PAGE = "https://www.wipo.int/publications/en/details.jsp?id=4873&plang=EN"
REPORTS = {
    2022: "wipo-pub-2000-2022-en-main-report-global-innovation-index-2022-15th-edition.pdf",
    2023: "wipo-pub-2000-2023-en-main-report-global-innovation-index-2023-16th-edition.pdf",
    2024: "wipo-pub-2000-2024-en-global-innovation-index-2024.pdf",
    2025: "wipo-pub-2000-2025-en-global-innovation-index-2025-innovation-at-a-crossroads.pdf",
    2026: "wipo-pub-2000-2026-en-global-innovation-index-2026.pdf",
}
PILLARS = ["IN.1", "IN.2", "IN.3", "IN.4", "IN.5", "OUT.6", "OUT.7"]
# GII = mean(input, output); input = mean of five pillars; output = mean of two.
WEIGHT = {p: (0.1 if p.startswith("IN") else 0.25) for p in PILLARS}
PEERS = ["IND", "CHN", "VNM", "IDN", "BRA", "TUR", "MYS", "THA", "PHL", "MEX", "ZAF"]

audit = {"generatedBy": "scripts/stories/innovation-india/build_gii.py", "files": {}, "values": [], "checks": []}


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def fail(msg):
    sys.exit(f"build_gii: {msg}")


def check(ok, what):
    audit["checks"].append({"check": what, "ok": bool(ok)})
    if not ok:
        fail(f"check failed: {what}")


# ------------------------------------------------------------------ databases
def load_db(y):
    path = RAW / f"database/gii{y}-database.xlsx"
    audit["files"][str(path.relative_to(ROOT))] = {"sha256": sha(path), "url": DB_URL.format(y=y)}
    wb = openpyxl.load_workbook(path, read_only=True)
    sheets = {}
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        sheets[ws.title] = (rows[0], rows[1:])
    head = sheets["Data"][0]
    want = ("ISO3", "ECONOMY_NAME", "NUM", "NAME", "DATAYR", "VALUE_SCREEN", "SCORE", "RANK", "SW_OVERALL", "SW_INCGRP", "OUTDATED", "DMC")
    if tuple(head[:12]) != want:
        fail(f"{y} Data header changed: {head}")
    data = {}
    for i, r in enumerate(sheets["Data"][1], start=2):
        if r[0] is None:
            continue
        data[(r[0], r[2] or "GII")] = {"row": i, "name": r[1], "num": r[2] or "GII", "label": r[3], "year": r[4], "value": r[5], "score": r[6], "rank": r[7], "outdated": bool(r[10])}
    eh = sheets["Economies"][0]
    eco = {r[0]: dict(zip(eh, r)) for r in sheets["Economies"][1] if r[0]}
    st = sheets["Index Structure"]
    struct = {(r[0] or "GII"): dict(zip(st[0], r)) for r in st[1] if r[1]}
    return {"data": data, "eco": eco, "struct": struct, "file": str(path.relative_to(ROOT))}


DB = {y: load_db(y) for y in EDITIONS}


def cell(y, iso, num, field="rank"):
    rec = DB[y]["data"].get((iso, num))
    if rec is None or rec[field] is None:
        return None
    audit["values"].append({"edition": y, "economy": iso, "node": num, "field": field, "value": rec[field], "file": DB[y]["file"], "sheet": "Data", "row": rec["row"]})
    return rec[field]


# ------------------------------------------------------------------ report PDFs
def pdf_text(path, page=None):
    args = ["pdftotext", "-layout"] + (["-f", str(page), "-l", str(page)] if page else []) + [str(path), "-"]
    return subprocess.run(args, capture_output=True, text=True, check=True).stdout


def report_ci(y):
    """India's 90% interval for the overall, input and output ranks from the JRC audit table."""
    path = RAW / "report" / REPORTS[y]
    audit["files"][str(path.relative_to(ROOT))] = {"sha256": sha(path)}
    txt = pdf_text(path)
    pat = re.compile(r"^\s*India\s+(\d+)\s+\[?(\d+),\s?(\d+)\]?\s+(\d+)\s+\[?(\d+),\s?(\d+)\]?\s+(\d+)\s+\[?(\d+),\s?(\d+)\]?\s*$", re.M)
    hits = {m.groups() for m in pat.finditer(txt)}
    if len(hits) != 1:
        fail(f"{y}: expected one India interval row, found {hits}")
    g = list(map(int, hits.pop()))
    line = next(m.group(0).strip() for m in pat.finditer(txt))
    audit["values"].append({"edition": y, "economy": "IND", "field": "ci90", "value": g, "file": str(path.relative_to(ROOT)), "snippet": re.sub(r"\s+", " ", line)})
    return {"rank": g[0], "ci": g[1:3], "inRank": g[3], "inCi": g[4:6], "outRank": g[6], "outCi": g[7:9]}


def report_ci_table(y):
    """Overall rank -> 90% interval from the JRC audit table (Appendix II). The table repeats over
    several pages and its columns collide in layout mode, so read raw text, key rows by rank (names
    come from the database) and require every rank to map to one interval."""
    txt = subprocess.run(["pdftotext", "-raw", str(RAW / "report" / REPORTS[y]), "-"], capture_output=True, text=True, check=True).stdout
    pat = re.compile(r"^(?:[^\d\[\]\n]+ )?(\d+) \[(\d+), ?(\d+)\] \d+ \[\d+, ?\d+\] \d+ \[\d+, ?\d+\]$", re.M)
    seen = {}
    for m in pat.finditer(txt):
        r, lo, hi = map(int, m.groups())
        seen.setdefault(r, set()).add((lo, hi))
    clash = {r: v for r, v in seen.items() if len(v) > 1}
    if clash:
        fail(f"{y}: ranks with more than one interval in the report: {clash}")
    return {r: (r, *next(iter(v))) for r, v in seen.items()}


# ------------------------------------------------------------------ history 2011-2021
hist = json.loads((RAW / "history/README-findings.json").read_text())["editions"]
HIST = {}
for e in hist:
    y = int(str(e["edition"])[:4]) if str(e["edition"]).isdigit() else None
    if y is None or y < 2011 or y > 2021:
        continue
    path = ROOT / e["local_path"]
    if sha(path) != e["sha256"]:
        fail(f"{path} hash differs from the findings file")
    audit["files"][e["local_path"]] = {"sha256": e["sha256"], "url": e["url_of_file"]}
    # Re-verify each cited snippet against the cited page, ignoring whitespace and ellipses.
    for ev in e["evidence"]:
        m = re.search(r"p(\d+)", ev["page_or_cell"])
        if not m or path.suffix != ".pdf":
            continue
        page = re.sub(r"\s+", " ", pdf_text(path, int(m.group(1))))
        parts = [p.strip() for p in re.split(r"\.\.\.|;", ev["snippet"]) if p.strip()]
        found = all(re.sub(r"\s+", " ", p) in page or all(tok in page for tok in p.split()) for p in parts)
        audit["checks"].append({"check": f"{y} {ev['field']} snippet on {ev['page_or_cell']}", "ok": found})
        if not found:
            print(f"warning: {y} {ev['field']}: snippet not found verbatim on page {m.group(1)}: {ev['snippet']!r}")
    HIST[y] = e

# ------------------------------------------------------------------ 1. rank history
history_rows = []
for y in range(2011, 2027):
    if y <= 2021:
        e = HIST[y]
        rank, n, ci, ir, orr = e["india_rank"], e["n_economies"], e["ci"], e["input_rank"], e["output_rank"]
        src = e["local_path"]
    else:
        rank, n = cell(y, "IND", "GII"), len(DB[y]["eco"])
        ir, orr = cell(y, "IND", "IN"), cell(y, "IND", "OUT")
        r = report_ci(y)
        check(r["rank"] == rank and r["inRank"] == ir and r["outRank"] == orr, f"{y} report table agrees with database ranks")
        ci, src = r["ci"], DB[y]["file"]
    ahead = lambda k: round(100 * (n - k) / (n - 1), 1)
    history_rows.append({
        "year": y, "rank": rank, "economies": n, "ciLow": ci[0] if ci else None, "ciHigh": ci[1] if ci else None,
        "aheadPct": ahead(rank), "aheadLow": ahead(ci[1]) if ci else None, "aheadHigh": ahead(ci[0]) if ci else None,
        "inputRank": ir, "outputRank": orr, "inputAheadPct": ahead(ir), "outputAheadPct": ahead(orr), "source": src,
    })


def series_artifact(iid, title, unit, obs, meta, src_id="wipo-gii", url=GII_PAGE, geo=None):
    return {"schemaVersion": 1, "artifactType": "series", "indicatorId": iid, "title": title, "sourceId": src_id,
            "sourceIndicatorId": iid, "sourceUrl": url, "unit": unit, "frequency": "annual",
            "geography": geo or {"type": "country", "id": "IND", "name": "India"}, "dimensions": [],
            "fetchedAt": FETCHED, "observations": obs, "metadata": meta}


def table_artifact(iid, title, unit, rows, meta, src_id="wipo-gii", url=GII_PAGE, geo=None):
    return {"schemaVersion": 1, "artifactType": "table", "indicatorId": iid, "title": title, "sourceId": src_id,
            "sourceIndicatorId": iid, "sourceUrl": url, "unit": unit,
            "geography": geo or {"type": "country", "id": "IND", "name": "India"}, "dimensions": [],
            "fetchedAt": FETCHED, "rows": rows, "metadata": meta}


OUT = {}
COMMON = {"publisher": "World Intellectual Property Organization (WIPO)", "licence": "CC BY 4.0",
          "comparability": "WIPO: scores and rankings are not directly comparable between one year and another (GII 2026, Appendix I)."}
AHEAD_DEF = "Share of the other ranked economies that India ranks ahead of: (economies - rank) / (economies - 1) x 100. It keeps the rank readable while the number of economies changes (125 to 143)."

OUT["innov.gii.rank_history.IN"] = table_artifact(
    "innov.gii.rank_history.IN", "India in the Global Innovation Index, 2011-2026", "rank and share of economies ranked below India",
    history_rows, {**COMMON, "definition": AHEAD_DEF, "ci": "90% rank interval from the European Commission JRC statistical audit, published from 2012."})
for key, field, title in [("ahead", "aheadPct", "Overall"), ("input_ahead", "inputAheadPct", "Innovation inputs"), ("output_ahead", "outputAheadPct", "Innovation outputs")]:
    iid = f"innov.gii.{key}.IN"
    OUT[iid] = series_artifact(iid, f"India, GII {title.lower()}: share of economies ranked below", "% of ranked economies India is ahead of",
                               [{"date": f"{r['year']}-12-31", "value": r[field]} for r in history_rows], {**COMMON, "definition": AHEAD_DEF})
for key, f in [("ahead_ci_low", "aheadLow"), ("ahead_ci_high", "aheadHigh")]:
    iid = f"innov.gii.{key}.IN"
    OUT[iid] = series_artifact(iid, "India, GII overall: 90% interval bound", "% of ranked economies India is ahead of",
                               [{"date": f"{r['year']}-12-31", "value": r[f]} for r in history_rows if r[f] is not None], {**COMMON, "definition": AHEAD_DEF})

# ------------------------------------------------------------------ 2. table neighbours 2026, with intervals
ci_all = report_ci_table(2026)
names26 = {iso: DB[2026]["eco"][iso]["ECONOMY_NAME"] for iso in DB[2026]["eco"]}
neigh = []
for iso, nm in names26.items():
    rk = cell(2026, iso, "GII")
    if rk is None or not (28 <= rk <= 50):
        continue
    hit = ci_all.get(rk)
    if not hit or not (hit[1] <= rk <= hit[2]):
        fail(f"no interval row for {nm} (rank {rk}); parsed {hit}")
    neigh.append({"label": nm, "iso3": iso, "rank": rk, "low": hit[1], "high": hit[2], "highlight": int(iso == "IND")})
neigh.sort(key=lambda r: r["rank"])
check(len(neigh) == 23, f"23 economies ranked 28-50 in 2026 (got {len(neigh)})")
OUT["innov.gii.neighbours_2026"] = table_artifact(
    "innov.gii.neighbours_2026", "Economies ranked 28th to 50th in GII 2026, with 90% rank intervals", "GII 2026 rank",
    neigh, {**COMMON, "ci": "JRC 90% interval, GII 2026 Appendix II table."}, geo={"type": "world", "id": "WLD", "name": "World"})

# ------------------------------------------------------------------ 3. India's indicators in 2026
st26 = DB[2026]["struct"]
ind_rows = []
for (iso, num), rec in DB[2026]["data"].items():
    if iso != "IND" or num.count(".") != 3:
        continue
    pillar = ".".join(num.split(".")[:2])
    s = st26.get(num, {})
    ind_rows.append({"code": num, "indicator": rec["label"], "pillar": st26[pillar]["NAME"], "side": "Inputs" if num.startswith("IN") else "Outputs",
                     "type": s.get("TYPE"), "rank": rec["rank"], "value": rec["value"], "dataYear": rec["year"], "outdated": int(rec["outdated"]),
                     "row": rec["row"]})
ranked = [r for r in ind_rows if r["rank"] is not None]
check(len(ranked) >= 75, f"India has ranks on at least 75 indicators in 2026 (got {len(ranked)})")
OUT["innov.gii.indicators_2026.IN"] = table_artifact(
    "innov.gii.indicators_2026.IN", "India's rank on every GII 2026 indicator", "rank of 139 (1 = best)",
    sorted(ind_rows, key=lambda r: (r["rank"] is None, r["rank"] or 0)),
    {**COMMON, "note": "Indicators with no India value carry rank null. dataYear is the year of the underlying data; outdated = 1 where WIPO flags it older than the most common year."})

# Axis labels for grouped bars and phone dumbbells: the full pillar names do not fit.
SHORT = {"IN.1": "Institutions", "IN.2": "Human capital", "IN.3": "Infrastructure", "IN.4": "Markets",
         "IN.5": "Business", "OUT.6": "Knowledge outputs", "OUT.7": "Creative outputs"}
# ------------------------------------------------------------------ 4. pillars, 2022 vs 2026 (and peers' 2026 profile)
pil_rows = []
for p in PILLARS:
    a, b = cell(2022, "IND", p), cell(2026, "IND", p)
    pil_rows.append({"pillar": st26[p]["NAME"], "short": SHORT[p], "code": p, "rank2022": a, "rank2026": b,
                     "ahead2022": round(100 * (132 - a) / 131, 1), "ahead2026": round(100 * (139 - b) / 138, 1)})
check(len(DB[2022]["eco"]) == 132 and len(DB[2026]["eco"]) == 139, "field sizes 132 (2022) and 139 (2026)")
OUT["innov.gii.pillars_2022_2026.IN"] = table_artifact(
    "innov.gii.pillars_2022_2026.IN", "India's rank on the seven GII pillars, 2022 and 2026", "% of ranked economies India is ahead of",
    pil_rows, {**COMMON, "definition": AHEAD_DEF})

# ------------------------------------------------------------------ 5. what the 2026 score is made of
gii_calc = (statistics.mean(cell(2026, "IND", p, "score") for p in PILLARS[:5]) + statistics.mean(cell(2026, "IND", p, "score") for p in PILLARS[5:])) / 2
check(abs(gii_calc - cell(2026, "IND", "GII", "score")) < 0.01, f"India GII 2026 score equals the pillar average ({gii_calc:.3f})")
isos = [iso for iso in DB[2026]["eco"] if cell(2026, iso, "GII", "score") is not None]
med = {p: statistics.median(DB[2026]["data"][(iso, p)]["score"] for iso in isos) for p in PILLARS}
contrib = {p: WEIGHT[p] * (cell(2026, "IND", p, "score") - med[p]) for p in PILLARS}
for p in PILLARS:
    iid = f"innov.gii.gap_vs_median_2026.{p.lower().replace('.', '_')}.IN"
    OUT[iid] = series_artifact(iid, f"{st26[p]['NAME']}: India's points above the median economy, weighted", "GII points",
                               [{"date": "2026-12-31", "value": round(contrib[p], 2)}],
                               {**COMMON, "definition": "Weight x (India's pillar score - median pillar score across 139 economies). Weights follow the GII formula: 1/10 for each input pillar, 1/4 for each output pillar. The parts sum to India's score minus a typical economy's pillar-weighted score.",
                                "india": round(cell(2026, "IND", p, "score"), 2), "median": round(med[p], 2), "weight": WEIGHT[p]})
OUT["innov.gii.gap_vs_median_2026.total.IN"] = series_artifact(
    "innov.gii.gap_vs_median_2026.total.IN", "India's GII 2026 score above a typical economy", "GII points",
    # The total is the sum of the rounded parts, so the chart's bars add up to its total exactly.
    [{"date": "2026-12-31", "value": round(sum(round(v, 2) for v in contrib.values()), 2)}],
    {**COMMON, "india": round(gii_calc, 2), "typical": round(sum(WEIGHT[p] * med[p] for p in PILLARS), 2), "unrounded": round(sum(contrib.values()), 3)})

# ------------------------------------------------------------------ 6. score against income, 2026
sc_rows = []
for iso in isos:
    e = DB[2026]["eco"][iso]
    if e.get("PPPPC"):
        sc_rows.append({"label": e["ECONOMY_NAME"], "iso3": iso, "x": round(float(e["PPPPC"]), 0), "y": round(cell(2026, iso, "GII", "score"), 2),
                        "income": e.get("INCOME_GRP"), "highlight": int(iso in ("IND", "VNM", "CHN"))})
# Least-squares fit of score on log10(GDP per person): how far each economy sits above the line.
import math
xs = [math.log10(r["x"]) for r in sc_rows]; ys = [r["y"] for r in sc_rows]
mx, my = statistics.mean(xs), statistics.mean(ys)
slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
resid = {r["iso3"]: r["y"] - (my + slope * (math.log10(r["x"]) - mx)) for r in sc_rows}
order = sorted(resid, key=lambda k: -resid[k])
r_val = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))
for r in sc_rows:
    r["aboveLine"] = round(resid[r["iso3"]], 1)
fit = {"slopePerTenfold": round(slope, 2), "r": round(r_val, 2), "indiaAboveLine": round(resid["IND"], 1), "indiaAboveLineRank": order.index("IND") + 1,
       "economies": len(order), "aheadOfIndiaAboveLine": [DB[2026]["eco"][k]["ECONOMY_NAME"] for k in order[:order.index("IND")]]}
check(fit["indiaAboveLineRank"] <= 10, f"India in the top ten above the income line ({fit['indiaAboveLineRank']})")
OUT["innov.gii.score_vs_income_2026"] = table_artifact(
    "innov.gii.score_vs_income_2026", "GII 2026 score against GDP per person", "GII score (0-100)", sc_rows,
    {**COMMON, "xLabel": "GDP per person, PPP dollars (log scale)", "yLabel": "GII 2026 score", "note": "GDP per person from the GII 2026 Economies sheet (IMF, PPP).", "fit": fit},
    geo={"type": "world", "id": "WLD", "name": "World"})

# ------------------------------------------------------------------ 7. peers' ranks, 2022 and 2026
for y in (2022, 2026):
    iid = f"innov.gii.peers_score_{y}"
    rows = [{"label": DB[2026]["eco"][iso]["ECONOMY_NAME"], "iso3": iso, "value": round(cell(y, iso, "GII", "score"), 2), "rank": cell(y, iso, "GII")} for iso in PEERS]
    OUT[iid] = table_artifact(iid, f"GII {y} score, India and peers", "GII score (0-100)", rows, COMMON, geo={"type": "world", "id": "WLD", "name": "World"})

# ------------------------------------------------------------------ 8. India, China, Vietnam pillar profile, 2026
prof = []
for p in PILLARS:
    row = {"pillar": st26[p]["NAME"], "code": p, "short": SHORT[p]}
    for iso in ("IND", "CHN", "VNM"):
        row[iso] = cell(2026, iso, p)
        row[f"{iso}_ahead"] = round(100 * (139 - row[iso]) / 138, 1)
    prof.append(row)
OUT["innov.gii.pillar_profile_2026"] = table_artifact(
    "innov.gii.pillar_profile_2026", "India, China and Viet Nam on the seven GII pillars, 2026", "rank of 139 (1 = best)", prof, COMMON,
    geo={"type": "world", "id": "WLD", "name": "World"})

# ------------------------------------------------------------------ 9. how old is the data behind India's 2026 score
from collections import Counter
years = Counter(r["dataYear"] for r in ind_rows if r["rank"] is not None and r["dataYear"])
age_rows = [{"label": str(y), "value": years[y], "year": y,
             "indicators": "; ".join(sorted(r["indicator"] for r in ind_rows if r["dataYear"] == y and r["rank"] is not None))} for y in sorted(years)]
check(sum(years.values()) == len(ranked), "every ranked India indicator has a data year")
OUT["innov.gii.data_age_2026.IN"] = table_artifact(
    "innov.gii.data_age_2026.IN", "India's GII 2026 indicators by the year their data describes", "number of indicators", age_rows,
    {**COMMON, "note": "Data year as published in the GII 2026 database (DATAYR). WIPO flags as outdated any value older than the most common year across economies."})

# ------------------------------------------------------------------ write
for iid, art in OUT.items():
    (SERIES / f"wipo-gii.{iid}.json").write_text(json.dumps(art, indent=1, ensure_ascii=False) + "\n")
AUDIT.mkdir(parents=True, exist_ok=True)
audit["generatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
(AUDIT / "gii-source-audit.json").write_text(json.dumps(audit, indent=1, ensure_ascii=False) + "\n")
bad = [c for c in audit["checks"] if not c["ok"]]
print(f"wrote {len(OUT)} artifacts; {len(audit['values'])} audited values; {len(audit['checks'])} checks, {len(bad)} not verbatim")
