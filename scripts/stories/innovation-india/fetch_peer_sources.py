#!/usr/bin/env python3
"""Download the raw peer-comparison sources for "How innovative is India?".

Every payload is saved unchanged under data/raw/innovation-peers/<source>/ and
listed in data/raw/innovation-peers/manifest.json with url, local_path,
retrieved, vintage, bytes and sha256.

Sources
  worldbank-wdi  World Bank WDI API (JSON), 9 indicators, 13 peers + World, 2000-2026
  wipo-ipstats   WIPO IP Statistics Data Center public API (the backend of
                 https://www3.wipo.int/ipstats/), PCT and patent indicators
  dst-nstmis     DST/NSTMIS R&D Statistics 2025-26 and 2022-23 PDFs, PIB answer
  unesco-uis     UNESCO UIS public data API (GERD % GDP, researchers per million FTE)

Usage: python3 scripts/stories/innovation-india/fetch_peer_sources.py [--retrieved 2026-10-20]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data" / "raw" / "innovation-peers"

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

PEERS_ISO3 = ["IND", "CHN", "VNM", "IDN", "BRA", "TUR", "MYS", "THA", "PHL", "MEX", "ZAF", "KOR", "USA"]
PEERS_ISO2 = ["IN", "CN", "VN", "ID", "BR", "TR", "MY", "TH", "PH", "MX", "ZA", "KR", "US"]

WDI_INDICATORS = [
    "GB.XPD.RSDV.GD.ZS", "SP.POP.SCIE.RD.P6", "BX.GSR.CCIS.ZS", "BX.GSR.CCIS.CD",
    "IP.PAT.RESD", "IP.PAT.NRES", "IP.JRN.ARTC.SC", "SP.POP.TOTL", "NY.GDP.MKTP.PP.CD",
]

WIPO_API = "https://api.ipstatsdc.deda.prd.web1.wipo.int/api/v1/public"


def wipo_queries() -> list[dict]:
    p2 = ",".join(PEERS_ISO2)
    q = []
    # PCT applications by filing date, by origin (country of residence of the first-named applicant), all receiving offices.
    pct = dict(selectedTab="pct", indicator="1001", reportType="4001", fromYear="2005", toYear="2026",
               pmhOffSelValues="ZZ", pmhOriSelValues=p2 + ",ZZ")
    q.append(dict(name="pct_1001_by_origin", tab="pmh-search", params=pct, ui="pmh-search/pct"))
    # Total patent applications (direct + PCT national phase), office x origin; the diagonal (office == origin) is resident filings.
    res = dict(selectedTab="patent", indicator="10", reportType="15", fromYear="2005", toYear="2024",
               ipsOffSelValues=p2, ipsOriSelValues=p2)
    q.append(dict(name="patent_10_office_x_origin", tab="ips-search", params=res, ui="ips-search/patent"))
    # Resident applications per million population (by origin).
    pm = dict(selectedTab="patent", indicator="101", reportType="13", fromYear="2005", toYear="2024", ipsOriSelValues=p2)
    q.append(dict(name="patent_101_resident_per_million", tab="ips-search", params=pm, ui="ips-search/patent"))
    # Foreign-oriented patent families by origin.
    fo = dict(selectedTab="patent", indicator="22", reportType="13", fromYear="2005", toYear="2024", ipsOriSelValues=p2)
    q.append(dict(name="patent_22_foreign_oriented_families", tab="ips-search", params=fo, ui="ips-search/patent"))
    return q


DST_FILES = [
    ("dst-nstmis", "ST_INDICATORS_TABLES_2025-26.pdf",
     "https://nstmis-dst.org/Pdfs/ST%20INDICATORS%20TABLES%202025-26.pdf",
     "S&T Indicators Tables, R&D Statistics 2025-26 (NSTMIS, DST; PDF created 29 Jul 2026)"),
    ("dst-nstmis", "RD_STATISTICS_AT_A_GLANCE_2025-26.pdf",
     "https://nstmis-dst.org/Pdfs/RD%20STATISTICS%20AT%20A%20GLANCE%202025-26.pdf",
     "R&D Statistics at a Glance 2025-26 (NSTMIS, DST)"),
    ("dst-nstmis", "ST_INDICATORS_TABLES_2022-23.pdf",
     "https://nstmis-dst.org/Pdfs/S%26T%20INDICATORS%20TABLES%202022-23.pdf",
     "S&T Indicators Tables, R&D Statistics 2022-23 (NSTMIS, DST)"),
    ("dst-nstmis", "RD_STATISTICS_AT_A_GLANCE_2022-23.pdf",
     "https://nstmis-dst.org/Pdfs/R%26D%20Statistics%20at%20a%20Glance%2C%202022-23.pdf",
     "R&D Statistics at a Glance 2022-23 (NSTMIS, DST)"),
    ("dst-nstmis", "NSTMIS_RegularPublication.html",
     "https://nstmis-dst.org/RegularPublication.aspx",
     "NSTMIS publications listing page (landing page that links the PDFs)"),
    ("dst-nstmis", "PIB_PRID_2291139.html",
     "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2291139",
     "PIB, Parliament question: Research and Development Expenditure, 29 Jul 2026"),
]


def fetch(url: str, headers: dict | None = None, tries: int = 4) -> bytes:
    h = {"User-Agent": UA}
    h.update(headers or {})
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"failed {url}: {last}")


def save(entries: list, retrieved: str, source: str, fname: str, url: str, vintage: str, body: bytes, **extra):
    d = RAW / source
    d.mkdir(parents=True, exist_ok=True)
    p = d / fname
    p.write_bytes(body)
    e = dict(url=url, local_path=str(p.relative_to(ROOT)), retrieved=retrieved, vintage=vintage,
             bytes=len(body), sha256=hashlib.sha256(body).hexdigest())
    e.update(extra)
    entries.append(e)
    print(f"{len(body):>10}  {e['local_path']}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--retrieved", default="2026-10-20")
    args = ap.parse_args()
    entries: list = []

    # 1. World Bank WDI
    countries = ";".join(PEERS_ISO3 + ["WLD"])
    for ind in WDI_INDICATORS:
        url = (f"https://api.worldbank.org/v2/country/{countries}/indicator/{ind}"
               f"?format=json&date=2000:2026&per_page=20000")
        body = fetch(url)
        meta = json.loads(body)[0]
        save(entries, args.retrieved, "worldbank-wdi", f"wdi_{ind}.json", url,
             f"WDI, lastupdated {meta.get('lastupdated')}", body,
             reader_url=f"https://data.worldbank.org/indicator/{ind}")
        murl = f"https://api.worldbank.org/v2/indicator/{ind}?format=json"
        save(entries, args.retrieved, "worldbank-wdi", f"meta_{ind}.json", murl,
             "WDI indicator metadata", fetch(murl), reader_url=f"https://data.worldbank.org/indicator/{ind}")

    # 2. WIPO IP Statistics Data Center (needs an Accept-Language header or it returns 400)
    wh = {"Accept-Language": "en"}
    for q in wipo_queries():
        qs = urllib.parse.urlencode(q["params"])
        ui = f"https://www3.wipo.int/ipstats/{q['ui']}?{qs}"
        for kind, ext in (("downloadCsv", "csv"), ("table-result", "json")):
            url = f"{WIPO_API}/{q['tab']}/{kind}?{qs}"
            body = fetch(url, wh)
            vint = "WIPO statistics database"
            if ext == "csv":
                for line in body.decode("utf-8", "replace").splitlines():
                    if "Last updated" in line:
                        vint = line.strip()
            save(entries, args.retrieved, "wipo-ipstats", f"{q['name']}.{ext}", url, vint, body, reader_url=ui)
    for tab, sel in (("pmh-search", "pct"), ("ips-search", "patent")):
        url = f"{WIPO_API}/{tab}/formcontrols?selectedTab={sel}"
        save(entries, args.retrieved, "wipo-ipstats", f"formcontrols_{sel}.json", url,
             "WIPO IPSDC form controls (indicator list)", fetch(url, wh), reader_url=f"https://www3.wipo.int/ipstats/{tab}/{sel}")

    # 3. DST / NSTMIS PDFs and the PIB answer
    for source, fname, url, vint in DST_FILES:
        save(entries, args.retrieved, source, fname, url, vint, fetch(url))

    # 4. UNESCO UIS (Feb 2026 data release at time of retrieval)
    ver = fetch("https://api.uis.unesco.org/api/public/versions/default")
    save(entries, args.retrieved, "unesco-uis", "uis_version.json",
         "https://api.uis.unesco.org/api/public/versions/default", "UIS default data version", ver)
    geo = "&".join(f"geoUnit={c}" for c in PEERS_ISO3)
    url = ("https://api.uis.unesco.org/api/public/data/indicators?indicator=EXPGDP.TOT&indicator=RESDEN.INHAB.TFTE"
           f"&{geo}&footnotes=true&indicatorMetadata=true")
    vjson = json.loads(ver)
    save(entries, args.retrieved, "unesco-uis", "uis_rd_peers.json", url,
         f"UIS data version {vjson.get('version')} ({vjson.get('publicationDate')})", fetch(url),
         reader_url="https://databrowser.uis.unesco.org/")

    (RAW / "manifest.json").write_text(json.dumps(
        {"story": "innovation-india", "retrieved": args.retrieved, "files": entries}, indent=2) + "\n")
    print(f"manifest: {len(entries)} files")


if __name__ == "__main__":
    main()
