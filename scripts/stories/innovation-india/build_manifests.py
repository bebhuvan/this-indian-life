"""Write the evidence-bundle manifests for "How innovative is India?".

Each raw folder gets a manifest whose `files` list every file under it with `path` (relative to the
folder), `url` and `sha256`, the shape scripts/check-story-evidence-commit.py reads. Existing entries
keep their extra fields (local_path, vintage, notes). The artifact catalog lists every chart artifact
this story ships.

Run: python3 scripts/stories/innovation-india/build_manifests.py
"""
import hashlib, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
RETRIEVED = "2026-10-20"
WIPO = "https://www.wipo.int/edocs/pubdocs/en/"
REPORT_URLS = {
    "wipo-pub-2000-2022-en-main-report-global-innovation-index-2022-15th-edition.pdf": WIPO + "wipo-pub-2000-2022-en-main-report-global-innovation-index-2022-15th-edition.pdf",
    "wipo-pub-2000-2023-en-main-report-global-innovation-index-2023-16th-edition.pdf": WIPO + "wipo-pub-2000-2023-en-main-report-global-innovation-index-2023-16th-edition.pdf",
    "wipo-pub-2000-2024-en-global-innovation-index-2024.pdf": WIPO + "wipo-pub-2000-2024-en-global-innovation-index-2024.pdf",
    "wipo-pub-2000-2025-en-global-innovation-index-2025-innovation-at-a-crossroads.pdf": WIPO + "wipo-pub-2000-2025-en-global-innovation-index-2025-innovation-at-a-crossroads.pdf",
    "wipo-pub-2000-2026-en-global-innovation-index-2026.pdf": WIPO + "wipo-pub-2000-2026-en-global-innovation-index-2026.pdf",
}
CLUSTER = "https://www.wipo.int/documents/d/global-innovation-index/docs-en-2026-in-{}.pdf"


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def wipo_gii_entries(folder):
    hist = {Path(e["local_path"]).relative_to("data/raw/wipo-gii").as_posix(): e["url_of_file"]
            for e in json.loads((folder / "history/README-findings.json").read_text())["editions"] if e.get("local_path")}
    out = []
    for f in sorted(p for p in folder.rglob("*") if p.is_file() and p.name != "manifest.json"):
        rel = f.relative_to(folder).as_posix()
        if rel.startswith("database/"):
            url = WIPO + f"wipo-pub-2000-{rel[len('database/gii'):][:4]}-tech1.xlsx"
        elif rel.startswith("report/"):
            url = REPORT_URLS[f.name]
        elif rel.startswith("clusters-2026/"):
            url = CLUSTER.format(f.stem)
        elif rel == "history/README-findings.json":
            url = None   # a reading aid: page-cited values for 2008-2021, re-verified by build_gii.py
        else:
            url = hist.get(rel)
        out.append({"path": rel, "url": url, "retrieved": RETRIEVED, "bytes": f.stat().st_size, "sha256": sha(f),
                    **({"note": "Reading aid written for this story: page-cited India values from the 2008-2021 reports; build_gii.py re-checks every snippet against the PDFs."} if url is None else {})})
    return {"story": "q.econ.innovation", "publisher": "WIPO, Global Innovation Index (CC BY 4.0)", "files": out}


def normalise(folder, manifest):
    """Add `path` (relative to the folder) to entries that carry only a repo-relative local_path."""
    known = {}
    for e in manifest["files"]:
        lp = e.get("path") or e.get("local_path")
        rel = Path(lp)
        if rel.parts[:3] == tuple(folder.relative_to(ROOT).parts):
            rel = rel.relative_to(folder.relative_to(ROOT))
        e["path"] = rel.as_posix()
        known[e["path"]] = e
    return known


bad = []
catalog_raw = {}
for name in ("wipo-gii", "innovation-peers", "ipindia-patents", "innovation-claims"):
    folder = ROOT / "data/raw" / name
    mpath = folder / "manifest.json"
    if name == "wipo-gii":
        manifest = wipo_gii_entries(folder)
    else:
        manifest = json.loads(mpath.read_text())
        known = normalise(folder, manifest)
        for f in sorted(p for p in folder.rglob("*") if p.is_file() and p.name != "manifest.json"):
            rel = f.relative_to(folder).as_posix()
            if rel not in known:
                bad.append(f"{name}/{rel}: on disk but not in its manifest")
    for e in manifest["files"]:
        f = folder / e["path"]
        if not f.is_file():
            bad.append(f"{name}/{e['path']}: in the manifest but missing")
            continue
        if e.get("sha256") != sha(f):
            if name == "wipo-gii":
                bad.append(f"{name}/{e['path']}: hash mismatch")
            else:
                bad.append(f"{name}/{e['path']}: hash differs from the manifest written at download")
        if not e.get("url") and "note" not in e and "notes" not in e:
            bad.append(f"{name}/{e['path']}: no source URL")
    mpath.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n")
    catalog_raw[name] = len(manifest["files"])
if bad:
    sys.exit("build_manifests:\n  " + "\n  ".join(bad))

catalog = []
for f in sorted((ROOT / "data/series").glob("*.json")):
    if not (f.name.startswith(("wipo-gii.innov.", "innov-peers.innov.", "ipindia.innov."))):
        continue
    a = json.loads(f.read_text())
    n = len(a.get("observations") or a.get("rows") or a.get("regions") or [])
    catalog.append({"status": "ready", "indicatorId": a["indicatorId"], "sourceIndicatorId": a["sourceIndicatorId"],
                    "artifact": f.relative_to(ROOT).as_posix(), "artifactType": a["artifactType"], "records": n,
                    "sha256": sha(f), "fetchedAt": a.get("fetchedAt")})
(ROOT / "data/catalog/innovation-india-manifest.json").write_text(json.dumps(catalog, indent=1, ensure_ascii=False) + "\n")
print("raw files by folder:", catalog_raw, "| artifacts:", len(catalog))
