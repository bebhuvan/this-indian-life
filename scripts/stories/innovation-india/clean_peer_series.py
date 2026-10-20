#!/usr/bin/env python3
"""Clean the raw peer sources into one tidy file for "How innovative is India?".

Reads only data/raw/innovation-peers/ (see fetch_peer_sources.py) and writes
data/audits/innovation-india/peer_series.json: a list of rows

  {iso3, indicator, year, value, unit, source, url, api_url?, period?, edition?,
   table?, page?, flag?, raw_file}

`year` is a calendar year for WDI, WIPO and UIS. For DST/NSTMIS rows it is the
start year of the Indian fiscal year (2021 = 2021-22), and `period` carries the
fiscal-year label exactly as printed. `page` is the 1-based PDF page.

DST tables are parsed from `pdftotext -layout` output, page by page; nothing is
typed in by hand. Run with: python3 -I scripts/stories/innovation-india/clean_peer_series.py
"""
from __future__ import annotations

import csv
import io
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data" / "raw" / "innovation-peers"
OUT = ROOT / "data" / "audits" / "innovation-india"

ISO2_TO_3 = {"IN": "IND", "CN": "CHN", "VN": "VNM", "ID": "IDN", "BR": "BRA", "TR": "TUR", "MY": "MYS",
             "TH": "THA", "PH": "PHL", "MX": "MEX", "ZA": "ZAF", "KR": "KOR", "US": "USA", "ZZ": "WLD"}

WDI_UNITS = {
    "GB.XPD.RSDV.GD.ZS": "% of GDP",
    "SP.POP.SCIE.RD.P6": "researchers (FTE) per million people",
    "BX.GSR.CCIS.ZS": "% of service exports (BoP)",
    "BX.GSR.CCIS.CD": "current US$ (BoP)",
    "IP.PAT.RESD": "applications",
    "IP.PAT.NRES": "applications",
    "IP.JRN.ARTC.SC": "articles (fractional count)",
    "SP.POP.TOTL": "people",
    "NY.GDP.MKTP.PP.CD": "current international $ (PPP)",
}

MANIFEST = json.loads((RAW / "manifest.json").read_text())


def man(local_name: str) -> dict:
    for e in MANIFEST["files"]:
        if e["local_path"].endswith("/" + local_name):
            return e
    raise KeyError(local_name)


def rel(p: Path) -> str:
    return str(p.relative_to(ROOT))


# ---------------------------------------------------------------- World Bank
def wdi_rows() -> list[dict]:
    rows = []
    for ind, unit in WDI_UNITS.items():
        f = RAW / "worldbank-wdi" / f"wdi_{ind}.json"
        m = man(f.name)
        meta = json.loads((RAW / "worldbank-wdi" / f"meta_{ind}.json").read_text())[1][0]
        for r in json.loads(f.read_text())[1]:
            if r["value"] is None:
                continue
            rows.append(dict(iso3=r["countryiso3code"], indicator=f"wdi.{ind}", year=int(r["date"]),
                             value=r["value"], unit=unit,
                             source=f"World Bank WDI ({meta['sourceOrganization'].split(',')[0].strip()[:80]})",
                             url=m["reader_url"], api_url=m["url"], raw_file=rel(f)))
    return rows


# ---------------------------------------------------------------- WIPO
def wipo_csv(name: str):
    f = RAW / "wipo-ipstats" / f"{name}.csv"
    text = f.read_text(encoding="utf-8")
    lines = [l for l in text.splitlines() if l.strip()]
    start = next(i for i, l in enumerate(lines) if l.startswith('"Receiving') or l.startswith("Office") or l.startswith("Origin"))
    reader = csv.reader(io.StringIO("\n".join(lines[start:])))
    header = next(reader)
    return f, header, list(reader)


def num(s: str):
    s = s.replace(",", "").strip()
    if s == "":
        return None
    return float(s) if "." in s else int(s)


def wipo_rows() -> list[dict]:
    rows = []
    # PCT applications by origin (filing date)
    f, h, data = wipo_csv("pct_1001_by_origin")
    m = man(f.name)
    years = [(i, int(c)) for i, c in enumerate(h) if c.strip().isdigit()]
    for rec in data:
        iso3 = ISO2_TO_3[rec[3]]
        for i, y in years:
            v = num(rec[i]) if i < len(rec) else None
            if v is None:
                continue
            rows.append(dict(iso3=iso3, indicator="wipo.pct_applications_by_origin", year=y, value=v,
                             unit="PCT international applications (filing date, origin = residence of first-named applicant)",
                             source="WIPO IP Statistics Data Center, PCT indicator 1", url=m["reader_url"],
                             api_url=m["url"], raw_file=rel(f)))
    # Resident applications: office x origin matrix, keep the diagonal
    f, h, data = wipo_csv("patent_10_office_x_origin")
    m = man(f.name)
    years = [(i, int(c)) for i, c in enumerate(h) if c.strip().isdigit()]
    name_to_code = {}
    for rec in data:
        name_to_code[rec[0]] = rec[1]
    for rec in data:
        office_code = rec[1]
        origin_code = name_to_code.get(rec[2])
        if origin_code != office_code:
            continue
        for i, y in years:
            v = num(rec[i]) if i < len(rec) else None
            if v is None:
                continue
            rows.append(dict(iso3=ISO2_TO_3[office_code], indicator="wipo.resident_patent_applications", year=y, value=v,
                             unit="patent applications (direct + PCT national phase) filed at own national office by residents",
                             source="WIPO IP Statistics Data Center, patent indicator 1 (office = origin)",
                             url=m["reader_url"], api_url=m["url"], raw_file=rel(f)))
    for name, ind, unit, src in (
        ("patent_101_resident_per_million", "wipo.resident_applications_per_million",
         "resident applications per million population (by origin)", "WIPO IPSDC patent indicator 10"),
        ("patent_22_foreign_oriented_families", "wipo.foreign_oriented_patent_families",
         "foreign-oriented patent families (by origin)", "WIPO IPSDC patent indicator 7"),
    ):
        f, h, data = wipo_csv(name)
        m = man(f.name)
        years = [(i, int(c)) for i, c in enumerate(h) if c.strip().isdigit()]
        for rec in data:
            for i, y in years:
                v = num(rec[i]) if i < len(rec) else None
                if v is None:
                    continue
                rows.append(dict(iso3=ISO2_TO_3[rec[1]], indicator=ind, year=y, value=v, unit=unit, source=src,
                                 url=m["reader_url"], api_url=m["url"], raw_file=rel(f)))
    return rows


# ---------------------------------------------------------------- UNESCO UIS
def uis_rows() -> list[dict]:
    f = RAW / "unesco-uis" / "uis_rd_peers.json"
    m = man(f.name)
    units = {"EXPGDP.TOT": "% of GDP", "RESDEN.INHAB.TFTE": "researchers (FTE) per million inhabitants"}
    rows = []
    for r in json.loads(f.read_text())["records"]:
        if r["value"] is None:
            continue
        fn = "; ".join(x["value"] for x in (r.get("footnotes") or []))
        row = dict(iso3=r["geoUnit"], indicator=f"uis.{r['indicatorId']}", year=r["year"], value=r["value"],
                   unit=units[r["indicatorId"]], source=f"UNESCO UIS ({m['vintage']})",
                   url=m["reader_url"], api_url=m["url"], raw_file=rel(f))
        if fn:
            row["flag"] = fn
        rows.append(row)
    return rows


# ---------------------------------------------------------------- DST / NSTMIS
def pdf_pages(path: Path) -> list[str]:
    n = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", str(path)], capture_output=True, text=True).stdout).group(1))
    return [subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), str(path), "-"],
                           capture_output=True, text=True).stdout for p in range(1, n + 1)]


def find_page(pages, *needles) -> int:
    for i, t in enumerate(pages):
        u = re.sub(r"\s+", " ", t).upper()
        if all(n.upper() in u for n in needles):
            return i
    raise ValueError(f"page not found: {needles}")


FY = r"(\d{4})-(\d{2})(\*?)"
NUMTOK = re.compile(r"^-?\d[\d,]*\.?\d*$|^-$")


def fy_start(a: str) -> int:
    return int(a)


def dst_rows() -> list[dict]:
    rows = []
    editions = [
        ("2025-26", "ST_INDICATORS_TABLES_2025-26.pdf"),
        ("2022-23", "ST_INDICATORS_TABLES_2022-23.pdf"),
    ]
    for edition, fname in editions:
        f = RAW / "dst-nstmis" / fname
        m = man(fname)
        pages = pdf_pages(f)
        base = dict(iso3="IND", source=f"DST/NSTMIS, R&D Statistics {edition}, S&T Indicators Tables",
                    url=m["url"], edition=edition, raw_file=rel(f))

        # Table 3: GERD, GDP, GERD % GDP with GDP series label
        pi = find_page(pages, "Table 3", "IN RELATION TO GDP") if edition == "2025-26" else find_page(pages, "Table 3", "R&D % of GDP")
        series = None
        for line in pages[pi].splitlines():
            s = re.search(r"Series:\s*(\d{4}-\d{2})", line)
            if s:
                series = s.group(1)
                continue
            mm = re.match(r"^\s*" + FY + r"\s+([\d.]+)\s+(\d+)\s+([\d.]+)\s*$", line)
            if not mm:
                continue
            y, star = fy_start(mm.group(1)), mm.group(3)
            period = f"{mm.group(1)}-{mm.group(2)}"
            extra = dict(period=period, table="Table 3", page=pi + 1, gdp_series=series)
            if star:
                extra["flag"] = "estimated (DST projection, sector-wise CAGR 2021-22 to 2023-24)"
            for ind, v, unit in (("dst.gerd_current_crore", mm.group(4), "Rs crore, current prices"),
                                 ("dst.gdp_current_crore", mm.group(5), "Rs crore, current prices (as used by DST)"),
                                 ("dst.gerd_pct_gdp", mm.group(6), "% of GDP")):
                rows.append(dict(base, indicator=ind, year=y, value=float(v), unit=unit, **extra))

        # Table 1: GERD by sector, all years in the header
        pi = find_page(pages, "Table 1", "BY SECTOR")
        lines = pages[pi].splitlines()
        hdr = next(l for l in lines if re.search(r"Sector\s+1970-71", l))
        years = re.findall(r"(\d{4})-(\d{2})(\*?)", hdr)
        labels = [("Central", "central"), ("State", "state"), ("Private", "private"), ("Higher", "higher_education"), ("Total", "total")]
        for lab, key in labels:
            idx = next(i for i, l in enumerate(lines) if re.match(r"^\s*" + lab + r"\b", l))
            vals = None
            for j in range(idx, min(idx + 4, len(lines))):
                toks = [t for t in lines[j].split() if NUMTOK.match(t)]
                if len(toks) >= 8:
                    vals = toks
                    break
            if vals is None:
                raise ValueError(f"Table 1 row {lab} not parsed ({edition})")
            yrs = years[-len(vals):]  # right-align: missing early years are blank
            for (a, b, star), t in zip(yrs, vals):
                if t == "-":
                    continue
                r = dict(base, indicator=f"dst.gerd_sector_crore.{key}", year=int(a), value=float(t.replace(",", "")),
                         unit="Rs crore, current prices", period=f"{a}-{b}", table="Table 1", page=pi + 1)
                if star:
                    r["flag"] = "estimated (DST projection)"
                rows.append(r)

        # Table 21: FTE personnel engaged in R&D activities (researchers), total and higher education
        pi = find_page(pages, "Table 21", "FULL TIME EQUIVALENT OF MANPOWER")
        txt = pages[pi]
        asof = re.search(r"AS ON (\d{2}\.\d{2}\.\d{4})", txt).group(1)
        y = int(asof[-4:]) - 1  # as on 1 April Y+1 -> fiscal year Y-(Y+1)
        tot = re.search(r"TOTAL \(1\+2\)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)", txt, re.I)
        he = re.search(r"HIGHER EDUCATION SECTOR\s+(\d+)", txt, re.I)
        for ind, v in (("dst.researchers_fte_total", tot.group(1)), ("dst.researchers_fte_higher_education", he.group(1))):
            rows.append(dict(base, indicator=ind, year=y, value=int(v),
                             unit=f"FTE personnel engaged in R&D activities, as on {asof}",
                             period=f"{y}-{str(y + 1)[2:]}", table="Table 21", page=pi + 1))
        rows.append(dict(base, indicator="dst.rd_personnel_fte_all", year=y, value=int(tot.group(4)),
                         unit=f"FTE personnel, R&D + auxiliary + administrative, as on {asof}",
                         period=f"{y}-{str(y + 1)[2:]}", table="Table 21", page=pi + 1))

        if edition == "2025-26":
            # Table 5: public / private shares
            pi = find_page(pages, "Table 5", "PUBLIC AND PRIVATE INVESTMENT")
            for line in pages[pi].splitlines():
                mm = re.match(r"^\s*" + FY + r"\s+([\d.]+)\(([\d.]+)\)\s+([\d.]+)\s+([\d.]+)\(([\d.]+)\)\s+([\d.]+)\s+([\d.]+)\(([\d.]+)\)", line)
                if not mm:
                    continue
                y = int(mm.group(1))
                extra = dict(period=f"{mm.group(1)}-{mm.group(2)}", table="Table 5", page=pi + 1)
                if mm.group(3):
                    extra["flag"] = "estimated (DST projection)"
                for ind, v, unit in (("dst.gerd_public_crore", mm.group(4), "Rs crore"),
                                     ("dst.gerd_public_share", mm.group(6), "% of GERD"),
                                     ("dst.gerd_private_crore", mm.group(7), "Rs crore"),
                                     ("dst.gerd_private_share", mm.group(9), "% of GERD")):
                    rows.append(dict(base, indicator=ind, year=y, value=float(v), unit=unit, **extra))
            # Table 2: higher education split public / private, SIROs, industry
            pi = find_page(pages, "Table 2", "INSTITUTIONAL AND INDUSTRIAL SECTORS")
            txt = pages[pi]
            yrs = [int(a) for a, _ in re.findall(r"(\d{4})-(\d{2})", txt.split("Sector", 2)[1].splitlines()[0])][:3] or [2021, 2022, 2023]
            for lab, key in (("Higher Education \\(Public\\)", "he_public"), ("Higher Education \\(Private\\)", "he_private"),
                             ("Scientific and Industrial Research Organisation \\(SIRO\\)", "siro"),
                             ("Industry \\(Private\\)", "industry_private"), ("Industry \\(Public\\)", "industry_public"),
                             ("Institutions under Central Government", "central_govt_institutions")):
                mm = re.search(lab + r"\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)", txt)
                for yy, v in zip(yrs, mm.groups()):
                    rows.append(dict(base, indicator=f"dst.gerd_institutional_crore.{key}", year=yy, value=float(v),
                                     unit="Rs crore", period=f"{yy}-{str(yy + 1)[2:]}", table="Table 2", page=pi + 1))
            # Table 24: India researchers per million (FTE)
            pi = find_page(pages, "Table 24", "RESEARCHERS PER MILLION")
            mm = re.search(r"\bIndia\s+(\d+)\s+([\d.]+)", pages[pi])
            rows.append(dict(base, indicator="dst.researchers_fte_per_million", year=2023, value=int(mm.group(1)),
                             unit="FTE researchers per million inhabitants (DST)", period="2023-24",
                             table="Table 24", page=pi + 1))
    # Glance 2025-26: researchers per million in 2020-21 vs 2023-24 (stated in text)
    f = RAW / "dst-nstmis" / "RD_STATISTICS_AT_A_GLANCE_2025-26.pdf"
    m = man(f.name)
    pages = pdf_pages(f)
    pi = find_page(pages, "per million population in India has increased")
    t = re.sub(r"\s+", " ", pages[pi])
    mm = re.search(r"per million population in India has increased to (\d+) in (\d{4})-(\d{2}) from (\d+) in (\d{4})-(\d{2})", t)
    for v, a, b in ((mm.group(1), mm.group(2), mm.group(3)), (mm.group(4), mm.group(5), mm.group(6))):
        rows.append(dict(iso3="IND", indicator="dst.researchers_fte_per_million", year=int(a), value=int(v),
                         unit="FTE researchers per million population (DST)", source="DST/NSTMIS, R&D Statistics at a Glance 2025-26",
                         url=m["url"], edition="2025-26 (Glance)", period=f"{a}-{b}", table="Chart 9 text", page=pi + 1,
                         raw_file=rel(f)))
    return rows


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = wdi_rows() + wipo_rows() + uis_rows() + dst_rows()
    # de-duplicate exact repeats (Table 24 vs Glance both give 2023-24 = 354; keep both editions but drop identical rows)
    seen, out = set(), []
    for r in rows:
        k = (r["iso3"], r["indicator"], r["year"], r.get("edition"), r.get("table"))
        if k in seen:
            continue
        seen.add(k)
        out.append(r)
    out.sort(key=lambda r: (r["indicator"], r["iso3"], r["year"], str(r.get("edition"))))
    (OUT / "peer_series.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {len(out)} rows")
    by = {}
    for r in out:
        by.setdefault(r["indicator"], 0)
        by[r["indicator"]] += 1
    for k, v in sorted(by.items()):
        print(f"  {k:55s} {v}")


if __name__ == "__main__":
    sys.exit(main())
