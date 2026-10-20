#!/usr/bin/env python3
"""Re-verify a random sample of peer_series.json rows against the raw downloads.

Each check uses a route independent of clean_peer_series.py: WDI and UIS values
are looked up again in the raw JSON; WIPO values are matched as the formatted
cell text in the raw CSV line for that country; DST values must appear as the
printed number on the cited PDF page. Also checks each raw file's sha256 against
the manifest. Writes data/audits/innovation-india/peer_series_selfcheck.json.

Usage: python3 -I scripts/stories/innovation-india/selfcheck_peer_series.py [--n 10] [--seed 20261020]
"""
import argparse
import hashlib
import json
import random
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AUD = ROOT / "data" / "audits" / "innovation-india"
ISO3_TO_2 = {"IND": "IN", "CHN": "CN", "VNM": "VN", "IDN": "ID", "BRA": "BR", "TUR": "TR", "MYS": "MY",
             "THA": "TH", "PHL": "PH", "MEX": "MX", "ZAF": "ZA", "KOR": "KR", "USA": "US", "WLD": "ZZ"}


def fmt_variants(v):
    out = set()
    if isinstance(v, int) or (isinstance(v, float) and v.is_integer()):
        i = int(v)
        out |= {str(i), f"{i:,}"}
    if isinstance(v, float):
        out |= {repr(v), f"{v:.2f}", f"{v:.1f}", str(v)}
    return out


def check(row):
    raw = ROOT / row["raw_file"]
    ind, y, v = row["indicator"], row["year"], row["value"]
    if ind.startswith("wdi."):
        recs = json.loads(raw.read_text())[1]
        hit = [r["value"] for r in recs if r["countryiso3code"] == row["iso3"] and r["date"] == str(y)]
        return hit == [v], f"raw JSON value {hit}"
    if ind.startswith("uis."):
        recs = json.loads(raw.read_text())["records"]
        hit = [r["value"] for r in recs if r["geoUnit"] == row["iso3"] and r["year"] == y and r["indicatorId"] == ind[4:]]
        return hit == [v], f"raw JSON value {hit}"
    if ind.startswith("wipo."):
        lines = raw.read_text().splitlines()
        hdr = next(l for l in lines if "2005" in l and ("Office" in l or "Origin" in l))
        cols = [c.strip('"') for c in hdr.split(",")]
        col = cols.index(str(y))
        code = ISO3_TO_2[row["iso3"]]
        import csv, io
        for rec in csv.reader(io.StringIO("\n".join(l for l in lines if l.startswith('"')))):
            codes = [c for c in rec[:4] if len(c) == 2 and c.isupper()]
            if ind == "wipo.resident_patent_applications":
                ok_row = rec[1] == code and rec[2] == rec[0]
            elif ind == "wipo.pct_applications_by_origin":
                ok_row = rec[3] == code
            else:
                ok_row = rec[1] == code
            if ok_row:
                cell = rec[col]
                return cell in fmt_variants(v), f"raw CSV cell '{cell}' in row {rec[:4]}"
        return False, "row not found"
    if ind.startswith("dst."):
        txt = subprocess.run(["pdftotext", "-layout", "-f", str(row["page"]), "-l", str(row["page"]), str(raw), "-"],
                             capture_output=True, text=True).stdout
        found = [s for s in fmt_variants(v) if s in txt]
        has_period = row.get("period", "") in txt or row.get("period", "").replace("-", "–") in txt
        return bool(found) and has_period, f"page {row['page']} contains {found} and period {row.get('period')}: {has_period}"
    return False, "unknown indicator family"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=10)
    ap.add_argument("--seed", type=int, default=20261020)
    a = ap.parse_args()
    rows = json.loads((AUD / "peer_series.json").read_text())
    rng = random.Random(a.seed)
    # stratify: guarantee each source family appears, then fill randomly
    fams = ["wdi.", "wipo.", "uis.", "dst."]
    sample = [rng.choice([r for r in rows if r["indicator"].startswith(f)]) for f in fams]
    rest = [r for r in rows if r not in sample]
    sample += rng.sample(rest, a.n - len(sample))
    results = []
    for r in sample:
        ok, why = check(r)
        results.append(dict(ok=ok, iso3=r["iso3"], indicator=r["indicator"], year=r["year"], value=r["value"],
                            raw_file=r["raw_file"], evidence=why))
        print(("PASS" if ok else "FAIL"), r["iso3"], r["indicator"], r["year"], r["value"], "|", why)
    man = json.loads((ROOT / "data/raw/innovation-peers/manifest.json").read_text())
    hash_fail = [e["local_path"] for e in man["files"]
                 if hashlib.sha256((ROOT / e["local_path"]).read_bytes()).hexdigest() != e["sha256"]]
    print("manifest sha256 mismatches:", hash_fail or "none")
    (AUD / "peer_series_selfcheck.json").write_text(json.dumps(
        dict(seed=a.seed, n=a.n, passed=sum(x["ok"] for x in results), results=results,
             manifest_hash_mismatches=hash_fail), indent=1) + "\n")


if __name__ == "__main__":
    main()
