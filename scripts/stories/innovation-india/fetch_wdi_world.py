#!/usr/bin/env python3
"""Download World Bank WDI indicators for every economy, for ranking India by total and per person.

Saves each payload unchanged under data/raw/innovation-peers/worldbank-wdi-world/ and adds it to
data/raw/innovation-peers/manifest.json (url, local_path, retrieved, vintage, bytes, sha256).

Usage: python3 scripts/stories/innovation-india/fetch_wdi_world.py [--retrieved 2026-10-20]
"""
import argparse, hashlib, json, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/innovation-peers"
OUT = RAW / "worldbank-wdi-world"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
INDICATORS = ["IP.PAT.RESD", "IP.JRN.ARTC.SC", "GB.XPD.RSDV.GD.ZS", "SP.POP.SCIE.RD.P6", "BX.GSR.CCIS.CD", "SP.POP.TOTL", "NY.GDP.MKTP.PP.CD"]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--retrieved", default="2026-10-20")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    mpath = RAW / "manifest.json"
    manifest = json.loads(mpath.read_text())
    entries = []
    for code in INDICATORS:
        url = f"https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&date=2010:2026&per_page=20000"
        body = get(url)
        head = json.loads(body)[0]
        if head.get("pages") != 1:
            raise SystemExit(f"{code}: expected one page, got {head}")
        p = OUT / f"wdi_world_{code}.json"
        p.write_bytes(body)
        entries.append({"url": url, "local_path": str(p.relative_to(ROOT)), "retrieved": a.retrieved, "vintage": f"WDI, lastupdated {head.get('lastupdated')}",
                        "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(), "reader_url": f"https://data.worldbank.org/indicator/{code}"})
    url = "https://api.worldbank.org/v2/country?format=json&per_page=400"
    body = get(url)
    p = OUT / "wdi_countries.json"
    p.write_bytes(body)
    entries.append({"url": url, "local_path": str(p.relative_to(ROOT)), "retrieved": a.retrieved, "vintage": "WDI country metadata (aggregates flagged by region 'Aggregates')",
                    "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(), "reader_url": "https://datahelpdesk.worldbank.org/knowledgebase/articles/898590"})
    paths = {e["local_path"] for e in entries}
    manifest["files"] = [m for m in manifest["files"] if m["local_path"] not in paths] + entries
    mpath.write_text(json.dumps(manifest, indent=1) + "\n")
    print(f"saved {len(entries)} files")


if __name__ == "__main__":
    main()
