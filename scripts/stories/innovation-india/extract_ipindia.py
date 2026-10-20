#!/usr/bin/env python3
"""Extract patent tables from IP India (CGPDTM) annual reports, cell by cell.

Run from the repository root with an isolated interpreter, for example:

    python3 -I scripts/stories/innovation-india/extract_ipindia.py
    python3 -I scripts/stories/innovation-india/extract_ipindia.py --selfcheck 10

Inputs : data/raw/ipindia-patents/manifest.json and the PDFs it lists (sha256-checked).
Outputs: data/audits/innovation-india/ipindia_extract.json
         data/audits/innovation-india/ipindia_selfcheck.json (with --selfcheck)

Tables extracted (each value carries file, page, table, row label, raw source text):
  category   "Distribution of applications category-wise" (NP, SU, SE, EI, ONP; Indian/foreign)
  state      Appendix B, applications by state of origin (ordinary, convention, national phase)
  appC       Appendix C, applications by residents and non-residents, last 10 years
  appD       Appendix D, filings, examination requests, grants and patents in force, 10 years
  top        Top Indian applicant lists (IT, R&D organisations, academic institutes)

Text comes from the PDF text layer (poppler pdftotext) where one exists. The 2019-20 and
2023-24 reports have no usable text layer (2019-20 is an image scan; 2023-24 draws glyphs
as vector outlines), so their pages are rendered at 400 dpi with pdftoppm, table rules are
removed, and the page is read with tesseract (--psm 6). Every table is validated with the
arithmetic identities the source itself implies (row sums, column totals); a table whose
header does not match the expected layout is rejected, never coerced.

Requires: poppler-utils (pdftotext, pdftoppm), tesseract 5, numpy, Pillow.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import random
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/ipindia-patents"
OUT = ROOT / "data/audits/innovation-india"

FY = r"(20\d\d)\s*[-–·.]\s*(\d\d)"  # 2019-20, 2017·18 (OCR artefacts)

# --------------------------------------------------------------------------------------
# Report configuration. Page numbers are 1-based PDF page indices (not printed folios).
# --------------------------------------------------------------------------------------
L9 = ["np_indian", "np_foreign", "su_indian", "su_foreign", "se_indian", "se_foreign",
      "onp_indian", "onp_foreign", "grand_total"]
L11 = ["np_indian", "np_foreign", "su_indian", "su_foreign", "se_indian", "se_foreign",
       "onp_indian", "onp_foreign", "total_indian", "total_foreign", "grand_total"]
L13 = ["np_indian", "np_foreign", "su_indian", "su_foreign", "se_indian", "se_foreign",
       "ei_indian", "ei_foreign", "onp_indian", "onp_foreign", "total_indian",
       "total_foreign", "grand_total"]

IT = r"Top\s*(5|S|Five)\s*Indian\s*applicants\s*for\s*patents\s*in\s*the\s*field\s*of\s*Information"
RND = r"Top\s*(10\s*)?Indian\s*Applicants\s*for\s*patents\s*from\s*Scientific"
ACAD = r"Top\s*(10\s*)?Indian\s*Applicants\s*for\s*patents\s*from\s*(Academic\s*)?Institutes"
OVERALL5 = r"\(b\)\s*Top\s*5\s*Indian\s*applicants\s*for\s*patents\s*$"

REPORTS = [
    {"fy": "2014-15", "file": "ipindia_annual_report_2014-15_en.pdf", "mode": "text",
     "state": [35], "appC": None, "appD": None,
     "top": [("it", [25], IT, 5), ("rnd", [26], RND, 10), ("academic", [26, 27], ACAD, 10)]},
    {"fy": "2015-16", "file": "ipindia_annual_report_2015-16_en.pdf", "mode": "text",
     "state": [29], "appC": None, "appD": None,
     "top": [("it", [19], r"Top\s*Indian\s*applicants\s*for\s*patents\s*in\s*the\s*field", 5),
             ("rnd", [20], r"Top\s*Indian\s*Applicants\s*for\s*patents\s*from\s*Scientific", 10),
             ("academic", [20, 21], r"Top\s*Indian\s*Applicants\s*for\s*patents\s*from\s*Institutes", 10)]},
    {"fy": "2016-17", "file": "ipindia_annual_report_2016-17_en.pdf", "mode": "text",
     "state": [40, 41], "appC": [45], "appD": [46],
     "top": [("overall", [29], OVERALL5, 5), ("it", [29], r"Top\s*5\s*Indian\s*applicants\s*for\s*patents\s*in\s*the\s*field", 5),
             ("rnd", [29, 30], RND, 10), ("academic", [30], ACAD, 10)]},
    {"fy": "2017-18", "file": "ipindia_annual_report_2017-18_en.pdf", "mode": "text",
     "category": ([24], L9), "state": [34], "appC": None, "appD": [39],
     "top": [("it", [24], IT, 5), ("rnd", [25], RND, 10), ("academic", [25], ACAD, 10)]},
    {"fy": "2018-19", "file": "ipindia_annual_report_2018-19_en.pdf", "mode": "text",
     "category": ([25], L9), "state": [35, 36], "appC": [40], "appD": [41],
     "top": [("it", [25], IT, 5, False), ("rnd", [25, 26], RND, 10, False), ("academic", [26], ACAD, 10, False)]},
    {"fy": "2019-20", "file": "ipindia_annual_report_2019-20_en.pdf", "mode": "ocr",
     "category": ([23], L11), "state": [32, 33], "appC": None, "appD": None,
     "top": [("it", [23], IT, 5), ("rnd", [23], RND, 10), ("academic", [24], ACAD, 10)]},
    {"fy": "2020-21", "file": "ipindia_annual_report_2020-21_en.pdf", "mode": "text",
     "category": ([20], L11), "state": [31, 32], "appC": [36], "appD": [37],
     "top": [("it", [21], IT, 5), ("rnd", [22], RND, 10), ("academic", [23], ACAD, 10)]},
    {"fy": "2021-22", "file": "ipindia_annual_report_2021-22_en.pdf", "mode": "text",
     "category": ([20], L13), "state": [31, 32], "appC": [36], "appD": [37],
     "top": [("it", [21], IT, 5), ("rnd", [22, 23], RND, 10), ("academic", [23], ACAD, 10)]},
    {"fy": "2022-23", "file": "ipindia_annual_report_2022-23_en.pdf", "mode": "text",
     "category": ([25], L13), "state": [36, 37], "appC": [40], "appD": [41],
     "top": [("it", [26], IT, 5), ("rnd", [26, 27], RND, 10), ("academic", [27], ACAD, 10)]},
    {"fy": "2023-24", "file": "ipindia_annual_report_2023-24_en.pdf", "mode": "ocr",
     "category": ([25], L13), "state": [35, 36], "appC": [40], "appD": [41],
     "top": [("it", [25], IT, 5), ("rnd", [25, 26], RND, 10), ("academic", [26, 27], ACAD, 10)]},
    {"fy": "2024-25", "file": "ipindia_annual_report_2024-25_en.pdf", "mode": "text",
     "category": ([21], L13), "state": [31, 32], "appC": [36], "appD": [37],
     "top": [("it", [22], IT, 5), ("rnd", [22], RND, 10), ("academic", [23], ACAD, 10)]},
]

STATES = [
    "Andaman & Nicobar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
    "Chhattisgarh", "Dadra and Nagar Haveli", "Daman & Diu",
    "Dadra and Nagar Haveli and Daman Diu", "Delhi", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh",
    "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Not Applicable",
]
STATE_ALIASES = {  # spelling in the report -> canonical name used here
    "orissa": "Odisha", "pondicherry": "Puducherry", "uttaranchal": "Uttarakhand",
    "chattisgarh": "Chhattisgarh", "damandiu": "Daman & Diu", "dadranagarhaveli": "Dadra and Nagar Haveli",
    "dadraandnagarhavelianddamandiu": "Dadra and Nagar Haveli and Daman Diu",
    "dadranagarhavelianddamandiu": "Dadra and Nagar Haveli and Daman Diu",
}
TOTAL_RE = re.compile(r"^\s*(grand\s*total|total)\s*$", re.I)


def norm_key(s: str) -> str:
    return re.sub(r"[^a-z]", "", s.lower().replace("&", "and")).replace("and", "")


CANON = {norm_key(s): s for s in STATES}
CANON.update({norm_key(k): v for k, v in STATE_ALIASES.items()})


def canon_state(name: str):
    k = norm_key(name)
    if not k:
        return None, None
    if k in CANON:
        return CANON[k], "exact"
    m = difflib.get_close_matches(k, CANON.keys(), n=1, cutoff=0.8)
    if m:
        return CANON[m[0]], f"fuzzy({m[0]})"
    # OCR-garbled label: take the shortest canonical name containing every word of
    # 4+ letters in the label (e.g. 'nae and Nagar' -> 'Dadra and Nagar Haveli').
    vocab = {w for st in STATES for w in re.findall(r"[a-z]{4,}", st.lower())}
    words = [w for w in re.findall(r"[a-z]{4,}", name.lower()) if w in vocab]  # drop OCR debris
    if words:
        hits = [s for s in STATES if all(w in s.lower() for w in words)]
        if hits:
            best = min(hits, key=len)
            return best, f"token-fallback({' '.join(words)})"
    return None, None


# --------------------------------------------------------------------------------------
# Text access
# --------------------------------------------------------------------------------------
def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pdftotext(pdf: Path, page: int, mode: str) -> str:
    flag = {"layout": "-layout", "raw": "-raw"}[mode]
    r = subprocess.run(["pdftotext", flag, "-f", str(page), "-l", str(page), str(pdf), "-"],
                       capture_output=True, text=True)
    return r.stdout


def _run_mask(ink: np.ndarray, minlen: int) -> np.ndarray:
    out = np.zeros_like(ink)
    for r in range(ink.shape[0]):
        row = ink[r]
        if row.sum() < minlen:
            continue
        d = np.diff(np.concatenate(([0], row.astype(np.int8), [0])))
        for s, e in zip(np.flatnonzero(d == 1), np.flatnonzero(d == -1)):
            if e - s >= minlen:
                out[r, s:e] = True
    return out


def ocr_page(pdf: Path, page: int, thr: int, cache: Path, psm: int = 6) -> str:
    """Render at 400 dpi, drop table rules (long ink runs) and pale fills, tesseract it."""
    cache.mkdir(parents=True, exist_ok=True)
    stem = f"{pdf.stem}_p{page}"
    png = cache / f"{stem}_400.png"
    if not png.exists():
        subprocess.run(["pdftoppm", "-r", "400", "-gray", "-png", "-f", str(page), "-l", str(page),
                        "-singlefile", str(pdf), str(png.with_suffix(""))], check=True)
    txt = cache / f"{stem}_t{thr}_psm{psm}.txt"
    if txt.exists():
        return txt.read_text()
    im = np.array(Image.open(png).convert("L"))
    ink = im < thr
    if ink.shape[0] < ink.shape[1]:  # landscape page image: rotate to upright for reading
        pass
    scale = im.shape[1] / 3400
    lines = _run_mask(ink, int(150 * scale)) | _run_mask(ink.T, int(60 * scale)).T
    pad = np.pad(lines, 2)
    dil = np.zeros_like(lines)
    for dy in range(5):
        for dx in range(5):
            dil |= pad[dy:dy + lines.shape[0], dx:dx + lines.shape[1]]
    clean = np.where(ink & ~dil, 0, 255).astype(np.uint8)
    cpng = cache / f"{stem}_t{thr}_clean.png"
    Image.fromarray(clean).save(cpng)
    r = subprocess.run(["tesseract", str(cpng), "-", "--psm", str(psm)], capture_output=True, text=True)
    txt.write_text(r.stdout)
    return r.stdout


class Doc:
    def __init__(self, rep: dict, cache: Path):
        self.rep = rep
        self.pdf = RAW / rep["file"]
        self.cache = cache

    def text(self, page: int, mode: str = "layout", thr: int = 110) -> str:
        if self.rep["mode"] == "ocr":
            t = ocr_page(self.pdf, page, thr, self.cache)
        else:
            t = pdftotext(self.pdf, page, mode)
        return fix_fy(t)

    def method(self, mode: str, thr: int | None = None) -> str:
        if self.rep["mode"] == "ocr":
            return f"ocr:pdftoppm 400dpi gray, rules removed, ink<{thr}, tesseract --psm 6"
        return f"pdftotext -{mode}"


OCR_THRESHOLDS = [110, 100, 130, 150, 90, 120, 140, 170]


def fix_fy(t: str) -> str:
    """Repair OCR'd financial-year labels such as '201S-16' or '2017·18' -> '2015-16', '2017-18'."""
    tr = str.maketrans({"S": "5", "O": "0", "o": "0", "I": "1", "l": "1"})
    return re.sub(r"\b(20[0-9SOoIl]{2})\s?[-–·]\s?([0-9SOoIl]{2})\b",
                  lambda m: f"{m.group(1).translate(tr)}-{m.group(2).translate(tr)}", t)


class Rejected(Exception):
    pass


def ints(s: str):
    return [int(x) for x in re.findall(r"\d+", s)]


def fy_label(a: str, b: str) -> str:
    return f"{a}-{b}"


# --------------------------------------------------------------------------------------
# Category table
# --------------------------------------------------------------------------------------
def check_category(vals: dict):
    """Identities implied by the table. Returns list of failed identity names."""
    fails = []
    ind = [k for k in vals if k.endswith("_indian") and not k.startswith("total")]
    frn = [k for k in vals if k.endswith("_foreign") and not k.startswith("total")]
    si, sf = sum(vals[k] for k in ind), sum(vals[k] for k in frn)
    if "total_indian" in vals:
        if si != vals["total_indian"]:
            fails.append(f"sum(indian categories)={si} != total_indian={vals['total_indian']}")
        if sf != vals["total_foreign"]:
            fails.append(f"sum(foreign categories)={sf} != total_foreign={vals['total_foreign']}")
        if vals["total_indian"] + vals["total_foreign"] != vals["grand_total"]:
            fails.append(f"total_indian+total_foreign={vals['total_indian'] + vals['total_foreign']} != grand_total={vals['grand_total']}")
    if si + sf != vals["grand_total"]:
        fails.append(f"sum(all categories)={si + sf} != grand_total={vals['grand_total']}")
    return fails


def parse_category_text(text: str, cols: list[str]):
    t = re.sub(r"(20\d\d)\s*-\s*\n\s*(\d\d)\b", r"\1-\2", text)
    hits = list(re.finditer(r"(?m)^\W{0,3}" + FY + r"\W", t))
    rows = []
    for i, m in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(t)
        seg = t[m.end():end]
        toks = re.findall(r"\d+", seg)
        rows.append((fy_label(m.group(1), m.group(2)), toks, t[m.start():min(end, m.end() + 400)]))
    return rows


def resolve_category_row(toks: list[str], cols: list[str]):
    n = len(cols)
    if len(toks) < n:
        return None, None, "too few numeric cells"
    base = dict(zip(cols, map(int, toks[:n])))
    fails = check_category(base)
    if not fails:
        return base, None, None
    # A cell may wrap onto two lines in the PDF (e.g. "1459" / "9"). Try joining one
    # adjacent pair among the first n+1 tokens; accept only a unique join that satisfies
    # every identity.
    cands = []
    if len(toks) <= n:
        return base, None, "; ".join(fails)
    for j in range(n):
        tt = toks[:j] + [toks[j] + toks[j + 1]] + toks[j + 2:n + 1]
        v = dict(zip(cols, map(int, tt[:n])))
        if not check_category(v):
            cands.append((j, v))
    if len(cands) == 1:
        j, v = cands[0]
        return v, f"joined wrapped cell tokens '{toks[j]}'+'{toks[j + 1]}' at column {cols[j]}", None
    return base, None, "; ".join(fails)


def extract_category(doc: Doc, pages: list[int], cols: list[str], out: dict):
    page = pages[0]
    thrs = OCR_THRESHOLDS if doc.rep["mode"] == "ocr" else [None]
    best = None
    for thr in thrs:
        mode = "raw"
        text = doc.text(page, mode, thr or 0)
        # header labels are checked in both the layout and the raw reading order, since a
        # narrow cell can split a word ("Foreig" / "n") in one of them
        layout = text if doc.rep["mode"] == "ocr" else doc.text(page, "layout") + "\n" + text
        hdr_ok = all(re.search(p, layout, re.I) for p in [r"Natural", r"Person", r"Startups?", r"Small\s*Entity", r"Other\s*than", r"Indian", r"Forei\s*g\s*n"])
        has_ei = bool(re.search(r"Educational", layout[layout.lower().find("natural person"):] if "natural person" in layout.lower() else layout, re.I))
        if not hdr_ok:
            continue
        if ("ei_indian" in cols) != has_ei:
            raise Rejected(f"{doc.rep['file']} p{page}: header {'has' if has_ei else 'lacks'} Educational Institutes column; layout expects {'EI' if 'ei_indian' in cols else 'no EI'}")
        if "total_indian" in cols and not re.search(r"\bTotal\b.*\n?.*Grand|Grand", layout):
            raise Rejected(f"{doc.rep['file']} p{page}: header lacks Total/Grand Total")
        rows = []
        bad = 0
        for fy, toks, raw in parse_category_text(text, cols):
            vals, repair, fail = resolve_category_row(toks, cols)
            if vals is None:
                bad += 10
                continue
            if fail:
                bad += 1
            rows.append({"fy": fy, "vals": vals, "repair": repair, "identity_failures": fail, "raw": raw.strip()})
        if rows and (best is None or bad < best[0]):
            best = (bad, thr, rows, mode)
        if rows and bad == 0:
            break
    if best is None:
        raise Rejected(f"{doc.rep['file']} p{page}: category table header not found / no rows")
    bad, thr, rows, mode = best
    for r in rows:
        for c, v in r["vals"].items():
            out["records"].append({
                "table": "category", "report_fy": doc.rep["fy"], "file": doc.rep["file"], "page": page,
                "row_label": r["fy"], "column": c, "data_fy": r["fy"], "value": v,
                "raw_text": r["raw"][:300], "text_method": doc.method(mode, thr),
                **({"repair": r["repair"]} if r["repair"] else {})})
        out["checks"].append({"table": "category", "report_fy": doc.rep["fy"], "page": page, "row": r["fy"],
                              "status": "pass" if not r["identity_failures"] else "source_inconsistency",
                              "detail": r["identity_failures"] or "row sums match printed totals",
                              **({"repair": r["repair"]} if r["repair"] else {})})


# --------------------------------------------------------------------------------------
# Appendix B: state of origin
# --------------------------------------------------------------------------------------
ROW6 = re.compile(r"^\s*[|‘'\"]?\s*([A-Za-z][A-Za-z&.,()'’\- ]*?)?\s*[|:]?\s+((?:NA|\d+)(?:\s+(?:NA|\d+)){5})(?:\s+(.*))?$")
NOISE = re.compile(r"[=—–~«»|]+|(?<=\s)-+(?=\s)")


def _state_rows(doc: Doc, pages: list[int], thr):
    """Parse one reading of Appendix B. Returns header years, data rows, the printed TOTAL
    row, and every line holding six or more integers that could not be read as a row."""
    started = False
    years = None
    rows, pending, unparsed = [], [], []
    total = total_raw = total_page = None
    for page in pages:
        lines = doc.text(page, "layout", thr or 0).splitlines()
        for li, line in enumerate(lines):
            nxt = lines[li + 1].strip() if li + 1 < len(lines) else ""
            if not started:
                if re.search(r"STATE\s*OF\s*ORIGIN", line, re.I) or (
                        re.search(r"According\s+to\s+State\s*$", line, re.I) and re.match(r"of\s+Origin", nxt, re.I)):
                    started = True
                continue
            if years is None:
                fys = re.findall(FY, line)
                if len(fys) >= 6:
                    fys = [fy_label(a, b) for a, b in fys[:6]]
                    if fys != [fys[0], fys[1]] * 3:
                        raise Rejected(f"{doc.rep['file']} p{page}: unexpected year header {fys}")
                    years = (fys[0], fys[1])
                elif re.search(r"\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+", line):
                    raise Rejected(f"{doc.rep['file']} p{page}: data row before year header: '{line.strip()}'")
                continue
            if not line.strip():
                continue
            cleaned = NOISE.sub(" ", line)
            m = ROW6.match(cleaned)
            if m:
                name = (m.group(1) or "").strip(" .|-")
                vals = [None if x == "NA" else int(x) for x in m.group(2).split()]
                if re.fullmatch(r"(grand\s*)?total", name, re.I):
                    total, total_raw, total_page = vals, line.strip(), page
                    break
                cands = []
                if nxt and not re.search(r"\d", nxt):
                    cands.append(((name + " " + nxt).strip(), True))   # wrapped label, next line
                if not name and pending:
                    cands.append(((pending[-1] + " " + nxt).strip(), True))  # label above and below
                cands.append((name, False))
                if pending:
                    cands.append((pending[-1] + " " + name, True))
                st = how = None
                for cand, exact_only in cands:
                    s_, h_ = canon_state(cand)
                    if s_ and (not exact_only or h_ == "exact"):
                        st, how, name = s_, h_, cand
                        break
                if st is None:
                    unparsed.append(f"p{page}: {line.strip()}")
                else:
                    rows.append({"label": name, "state": st, "match": how, "vals": vals, "raw": line.strip(), "page": page})
                pending = []
            else:
                if len(re.findall(r"\b\d+\b", cleaned)) >= 6:
                    unparsed.append(f"p{page}: {line.strip()}")
                elif not re.search(r"\d", line):
                    pending.append(line.strip())
        if total is not None:
            break
    if not started or years is None:
        raise Rejected(f"{doc.rep['file']}: state-of-origin header or year row not found on pages {pages}")
    if total is None:
        raise Rejected(f"{doc.rep['file']}: state table TOTAL row not found on pages {pages}")
    return years, rows, (total, total_raw, total_page), unparsed


def extract_state(doc: Doc, pages: list[int], out: dict):
    """Text PDFs: one reading. OCR PDFs: one reading per binarisation threshold, then a
    per-cell majority vote across readings (a cell needs agreement from at least two
    readings, or a single clean reading when only one exists)."""
    thrs = OCR_THRESHOLDS if doc.rep["mode"] == "ocr" else [None]
    readings, errs = [], []
    for thr in thrs:
        try:
            readings.append((thr, *_state_rows(doc, pages, thr)))
        except Rejected as e:
            errs.append(str(e))
    if not readings:
        raise Rejected("; ".join(errs))
    years = readings[0][1]
    if any(r[1] != years for r in readings):
        raise Rejected(f"{doc.rep['file']}: year header differs between OCR readings")
    if doc.rep["mode"] == "text":
        _, _, rows, (total, total_raw, total_page), unparsed = readings[0]
        if unparsed:
            raise Rejected(f"{doc.rep['file']}: unparsed state-table lines {unparsed}")
        method = doc.method("layout")
    else:
        order, cand, meta = [], {}, {}
        for thr, _, rws, tot, _u in readings:
            for r in rws:
                if r["state"] not in cand:
                    order.append(r["state"]); cand[r["state"]] = []; meta[r["state"]] = r
                cand[r["state"]].append((thr, r["vals"], r["raw"]))
            cand.setdefault("__TOTAL__", []).append((thr, tot[0], tot[1]))
        rows = []
        unresolved = []
        def vote(lst):
            vals = []
            for i in range(6):
                c = {}
                for _, v, _ in lst:
                    c[v[i]] = c.get(v[i], 0) + 1
                best = sorted(c.items(), key=lambda kv: -kv[1])
                if len(lst) > 1 and (best[0][1] < 2 or (len(best) > 1 and best[1][1] == best[0][1])):
                    return None, c
                vals.append(best[0][0])
            return vals, None
        ties = {}
        for s_ in order:
            vals, tie = vote(cand[s_])
            r = dict(meta[s_]); r["vals"] = vals
            r["raw"] = " || ".join(f"[ink<{t}] {raw}" for t, _, raw in cand[s_])
            r["votes"] = len(cand[s_])
            if vals is None:
                ties[s_] = r
            rows.append(r)
        total, tie = vote(cand["__TOTAL__"])
        if total is None:
            raise Rejected(f"{doc.rep['file']}: OCR readings disagree on TOTAL row")
        # A row whose readings tie is resolved only if exactly one of its distinct readings
        # makes every column sum to the printed TOTAL.
        for s_, r in ties.items():
            others = [x for x in rows if x is not r]
            if any(x["vals"] is None for x in others):
                unresolved.append(f"{s_}: tie and another unresolved row"); continue
            opts = {tuple(v) for _, v, _ in cand[s_]}
            ok = [o for o in opts if all(sum(x["vals"][i] or 0 for x in others) + (o[i] or 0) == total[i] for i in range(6))]
            if len(ok) == 1:
                r["vals"] = list(ok[0]); r["resolved_by"] = "OCR readings tied; the only reading consistent with the printed TOTAL row"
            else:
                unresolved.append(f"{s_}: readings disagree {[(t, v) for t, v, _ in cand[s_]]}")
        total_raw = " || ".join(f"[ink<{t}] {raw}" for t, _, raw in cand["__TOTAL__"])
        total_page = readings[0][3][2]
        if unresolved:
            raise Rejected(f"{doc.rep['file']}: OCR cells without a majority: {unresolved}")
        method = f"ocr: per-cell majority vote over thresholds {[r[0] for r in readings]} (pdftoppm 400dpi, rules removed, tesseract --psm 6)"
    cols = [("ordinary", years[0]), ("ordinary", years[1]), ("convention", years[0]),
            ("convention", years[1]), ("national_phase", years[0]), ("national_phase", years[1])]
    fails, seen = [], set()
    for r in rows:
        if r["state"] in seen:
            fails.append(f"duplicate state row {r['state']}")
        seen.add(r["state"])
    for i, c in enumerate(cols):
        s = sum(r["vals"][i] or 0 for r in rows)
        if s != total[i]:
            fails.append(f"{c}: sum of rows {s} != printed TOTAL {total[i]}")
    for r in rows:
        for i, (route, yr) in enumerate(cols):
            out["records"].append({
                "table": "state", "report_fy": doc.rep["fy"], "file": doc.rep["file"], "page": r["page"],
                "row_label": r["label"], "state": r["state"], "column": route, "data_fy": yr,
                "value": r["vals"][i], "raw_text": r["raw"], "text_method": method,
                **({"name_match": r["match"]} if r["match"] != "exact" else {}),
                **({"ocr_readings": r["votes"]} if "votes" in r else {}),
                **({"resolved_by": r["resolved_by"]} if "resolved_by" in r else {})})
    for i, (route, yr) in enumerate(cols):
        out["records"].append({
            "table": "state", "report_fy": doc.rep["fy"], "file": doc.rep["file"], "page": total_page,
            "row_label": "TOTAL (printed)", "state": "TOTAL", "column": route, "data_fy": yr,
            "value": total[i], "raw_text": total_raw, "text_method": method})
    # A column that does not sum to its printed TOTAL is kept (values are what the page
    # prints) but flagged; ipindia_notes.md records whether the page itself is inconsistent.
    out["checks"].append({"table": "state", "report_fy": doc.rep["fy"], "pages": pages,
                          "status": "pass" if not fails else "sum_mismatch",
                          "detail": fails or "every column sums to the printed TOTAL row",
                          "n_rows": len(rows)})

# --------------------------------------------------------------------------------------
# Appendix C and D (token streams; rotated pages read fine in -raw order)
# --------------------------------------------------------------------------------------
def tokens_of(text: str):
    t = re.sub(r"(20\d\d)\s*-\s*\n?\s*(\d\d)\b", r"\1-\2", text)
    return re.findall(r"20\d\d-\d\d|[A-Za-z]+|\d+", t)


def extract_appC(doc: Doc, pages: list[int], out: dict):
    page = pages[0]
    thrs = OCR_THRESHOLDS if doc.rep["mode"] == "ocr" else [None]
    for thr in thrs:
        text = doc.text(page, "raw", thr or 0)
        if not re.search(r"RESIDENTS\s+AND\s+NON", text, re.I):
            raise Rejected(f"{doc.rep['file']} p{page}: Appendix C header not found")
        toks = tokens_of(text)
        try:
            i = next(k for k, x in enumerate(toks) if x.lower() == "applicants")
        except StopIteration:
            raise Rejected(f"{doc.rep['file']} p{page}: 'Applicants' header missing")
        years = [x for x in toks[i:i + 15] if re.fullmatch(r"20\d\d-\d\d", x)][:10]
        if len(years) != 10:
            raise Rejected(f"{doc.rep['file']} p{page}: expected 10 year columns, got {years}")
        pos = i
        rows = {}
        raws = {}
        ok = True
        for key, pat in [("residents", r"Residents"), ("nonres_ordinary", r"Ordinary"),
                         ("nonres_convention", r"Convention"), ("nonres_national_phase", r"Phase"),
                         ("grand_total", r"TOTAL")]:
            try:
                pos = next(k for k in range(pos, len(toks)) if re.fullmatch(pat, toks[k], re.I)
                           and not (key == "residents" and toks[k - 1].lower() == "non"))
            except StopIteration:
                ok = False
                break
            vals, k = [], pos + 1
            while len(vals) < 10 and k < len(toks):
                if toks[k].isdigit():
                    vals.append(int(toks[k]))
                k += 1
            rows[key] = vals
            raws[key] = " ".join(toks[pos:k])
            pos = k
        if not ok or any(len(v) != 10 for v in rows.values()):
            continue
        fails = [f"{y}: components {rows['residents'][j] + rows['nonres_ordinary'][j] + rows['nonres_convention'][j] + rows['nonres_national_phase'][j]} != printed {rows['grand_total'][j]}"
                 for j, y in enumerate(years)
                 if rows['residents'][j] + rows['nonres_ordinary'][j] + rows['nonres_convention'][j] + rows['nonres_national_phase'][j] != rows['grand_total'][j]]
        if fails and thr != thrs[-1]:
            continue
        break
    else:
        raise Rejected(f"{doc.rep['file']} p{page}: Appendix C rows not parsed")
    for key, vals in rows.items():
        for y, v in zip(years, vals):
            out["records"].append({"table": "appC", "report_fy": doc.rep["fy"], "file": doc.rep["file"], "page": page,
                                   "row_label": key, "column": y, "data_fy": y, "value": v,
                                   "raw_text": raws[key][:300], "text_method": doc.method("raw", thr)})
    out["checks"].append({"table": "appC", "report_fy": doc.rep["fy"], "page": page,
                          "status": "pass" if not fails else "fail",
                          "detail": fails or "residents + non-resident routes = grand total, every year"})
    if fails:
        raise Rejected(f"{doc.rep['file']} p{page}: Appendix C identity failures {fails}")


APPD_COLS = ["applications_filed", "examination_requests", "abandoned_s9_1", "abandoned_s21_1",
             "granted_indian", "granted_foreign", "in_force_indian", "in_force_foreign"]


def extract_appD(doc: Doc, pages: list[int], out: dict):
    page = pages[0]
    thr = OCR_THRESHOLDS[0] if doc.rep["mode"] == "ocr" else None
    text = doc.text(page, "raw", thr or 0)
    if not re.search(r"MISCELLANEOUS\s+INFORMATION", text, re.I):
        raise Rejected(f"{doc.rep['file']} p{page}: Appendix D header not found")
    for need in [r"granted", r"force", r"Indian", r"Foreign", r"9\(1\)", r"21\(1\)"]:
        if not re.search(need, text, re.I):
            raise Rejected(f"{doc.rep['file']} p{page}: Appendix D header lacks {need}")
    toks = tokens_of(text)
    rows = []
    for k, x in enumerate(toks):
        if re.fullmatch(r"20\d\d-\d\d", x) and k + 8 < len(toks) and all(t.isdigit() for t in toks[k + 1:k + 9]):
            rows.append((x, [int(t) for t in toks[k + 1:k + 9]], " ".join(toks[k:k + 9])))
    # keep the first run of consecutive years (a following Appendix E table on the same
    # page restarts the sequence)
    run = rows[:1]
    for r in rows[1:]:
        if int(r[0][:4]) != int(run[-1][0][:4]) + 1:
            break
        run.append(r)
    rows = run
    yrs = [int(y[:4]) for y, _, _ in rows]
    if len(rows) < 10 or yrs != list(range(yrs[0], yrs[0] + len(yrs))):
        raise Rejected(f"{doc.rep['file']} p{page}: Appendix D expected >=10 consecutive year rows, got {[r[0] for r in rows]}")
    for y, vals, raw in rows:
        for c, v in zip(APPD_COLS, vals):
            out["records"].append({"table": "appD", "report_fy": doc.rep["fy"], "file": doc.rep["file"], "page": page,
                                   "row_label": y, "column": c, "data_fy": y, "value": v, "raw_text": raw,
                                   "text_method": doc.method("raw", thr)})
    out["checks"].append({"table": "appD", "report_fy": doc.rep["fy"], "page": page, "status": "pass",
                          "detail": f"{len(rows)} year rows x 8 numeric columns parsed; cross-checked against Appendix C in cross_checks"})


# --------------------------------------------------------------------------------------
# Top applicant lists
# --------------------------------------------------------------------------------------
CONT_START = re.compile(r"^(LIMITED|LTD|PVT|PRIVATE|TO-?\s?BE|\(|AND\b|OF\b|INSTITUTE|RESEARCH|SCIENCES?\b|"
                        r"UNIVERSITY|TECHNOLOGY|ORGANI[SZ]ATION|INCUBATOR|MANAGEMENT|EDUCATION|"
                        r"COLLEGE|HOSPITALS?|ENGINEERING|CENTRE|LABS?|\[?\(?Collective)", re.I)
END_RE = re.compile(r"^\s*(In this category|In the field|This year|Following|\(?[a-h]\)\s*Top|\(?[a-h]\)\s*Appl|"
                    r"\d\.\d?\s*(Top|Appl)|Table\.|Figure|2\.\s+APPL|\d+\.\s+Top|\(e\)|\(f\)|\(d\)|\(g\)|"
                    r"\(C\)|\(D\)|\(E\)|[0-9]\.\s*(PATENTS|APPLICATIONS)|S\.\s*Top|Top\s+(5|10)\s+Indian)", re.I)
HDR_RE = re.compile(r"^\s*(Sl\.?|SI\.?|St\.|S\.?\s*No\.?|51\.)(\s|$)|^\s*Name of|^\s*Appl\w*\s*(filed|flied|ftled)?\s*$|"
                    r"^\s*No\.?\s*(filed)?\s*$|^\s*filed\s*$|^\s*Organi[sz]ations\.?\s*$", re.I)
FOOTER_RE = re.compile(r"(Annual Report|Office of the Controller|Geographical Indications|ANNUAL REPORT|PANG|Patents, Designs)", re.I)
RANK_RE = re.compile(r"^[|\[]?\s*(\d{1,2})\s*[.|]?\s+(\S.*)$")
TRAIL_NUM = re.compile(r"^(.*?)[\s|]+(\d{1,5})\s*[|.,]?\s*\S{0,3}$")


def _split_count(text: str):
    """'NAME ... 233' -> ('NAME ...', 233); the number must be the last token."""
    m = TRAIL_NUM.match(text)
    if m and re.search(r"[A-Za-z]", m.group(1)) and not re.search(r"[A-Za-z]{3,}", text[m.end(2):]):
        return m.group(1).strip(" |"), int(m.group(2))
    if re.fullmatch(r"\d{1,5}", text.strip()):
        return "", int(text.strip())
    return text.strip(" |"), None


def parse_top(lines: list[tuple[int, str]], heading: str, counts_expected: bool, n_expected: int):
    hi = next((i for i, (_, l) in enumerate(lines) if re.search(heading, l, re.I)), None)
    if hi is None:
        raise Rejected(f"heading /{heading}/ not found")
    # first and last non-blank line of each page, to drop printed folios at page breaks
    edge = {}
    for i, (pg, l) in enumerate(lines):
        if l.strip():
            edge.setdefault(pg, [i, i])[1] = i
    body, started, pre_hdr = [], False, []
    for i in range(hi + 1, len(lines)):
        pg, l = lines[i]
        s = l.strip()
        if not s or FOOTER_RE.search(s):
            continue
        if re.fullmatch(r"\d{1,3}", s) and i in edge.get(pg, []):
            continue  # printed page number
        if HDR_RE.search(s):
            pre_hdr = []  # text above the column header is a chart label or prose
            continue
        if not started:
            m = RANK_RE.match(s)
            if m and m.group(1) == "1":
                started = True
                body += [(pg, x) for x in pre_hdr[-2:]]  # a wrapped first name can sit above its rank
                body.append((pg, s))
            elif not re.search(r"\d", s):
                pre_hdr.append(s)
            continue
        if END_RE.search(s):
            break
        body.append((pg, s))
    if not started:
        raise Rejected("no rank-1 row found after heading")
    entries, orphans = [], []

    def settle(next_name):
        """Assign orphan lines (no rank) between the previous entry and the next one."""
        nonlocal orphans
        to_next = []
        rest = []
        for pg, s in orphans:
            name, cnt = _split_count(s)
            if cnt is not None and entries and entries[-1]["count"] is None:
                entries[-1]["count"] = cnt
                if name:
                    entries[-1]["parts"].append(name)
                entries[-1]["raw"].append(s)
            else:
                rest.append((pg, s, name, cnt))
        texts = [r for r in rest if r[3] is None]
        nums = [r for r in rest if r[3] is not None]
        if (next_name is not None and texts and CONT_START.match(next_name)
                and (not entries or entries[-1]["count"] is not None or not counts_expected)):
            to_next.append(texts[-1])
            texts = texts[:-1]
        if entries:
            for r in texts:
                entries[-1]["parts"].append(r[2]); entries[-1]["raw"].append(r[1])
        to_next += nums
        orphans = []
        return to_next

    for pg, s in body:
        m = RANK_RE.match(s)
        if m:
            name, cnt = _split_count(m.group(2))
            carry = settle(name)
            parts = [c[2] for c in carry if c[2]] + [name]
            if cnt is None:
                cnt = next((c[3] for c in carry if c[3] is not None), None)
            entries.append({"rank": int(m.group(1)), "parts": parts, "count": cnt, "page": pg,
                            "raw": [c[1] for c in carry] + [s]})
        else:
            if (entries and entries[-1]["count"] is not None and entries[-1]["rank"] >= n_expected
                    and re.search(r"\d", s)):
                break  # list complete; numbered labels after it are a chart, not the table
            orphans.append((pg, s))
    settle(None)
    out, prev_rank, prev_count = [], 0, None
    for e in entries:
        name = re.sub(r"\s+", " ", " ".join(e["parts"])).strip(" |")
        flags = []
        if e["rank"] < prev_rank or e["rank"] > prev_rank + 2:
            flags.append(f"rank {e['rank']} out of sequence after {prev_rank} (OCR or source)")
        if counts_expected:
            if e["count"] is None:
                flags.append("no count parsed")
            elif prev_count is not None and e["count"] > prev_count:
                flags.append(f"count {e['count']} exceeds previous {prev_count}")
        out.append({"rank_printed": e["rank"], "name": name, "count": e["count"], "page": e["page"],
                    "raw_text": " / ".join(e["raw"]), **({"flags": flags} if flags else {})})
        prev_rank = max(prev_rank, e["rank"])
        prev_count = e["count"] if e["count"] is not None else prev_count
    return out


def extract_top(doc: Doc, spec, out: dict):
    lid, pages, heading, n = spec[:4]
    counts_expected = spec[4] if len(spec) > 4 else True
    thrs = OCR_THRESHOLDS if doc.rep["mode"] == "ocr" else [None]
    best = None
    for thr in thrs:
        lines = []
        for p in pages:
            lines += [(p, l) for l in doc.text(p, "layout", thr or 0).splitlines()]
        try:
            ents = parse_top(lines, heading, counts_expected, n)
        except Rejected as e:
            best = best or (999, thr, None, str(e))
            continue
        nflags = sum(len(e.get("flags", [])) for e in ents) + (5 if len(ents) < n else 0)
        if best is None or nflags < best[0]:
            best = (nflags, thr, ents, None)
        if nflags == 0:
            break
    nflags, thr, ents, err = best
    if ents is None:
        raise Rejected(f"{doc.rep['file']} {lid}: {err}")
    for e in ents:
        out["records"].append({"table": "top", "list": lid, "report_fy": doc.rep["fy"], "file": doc.rep["file"],
                               "page": e["page"], "row_label": f"rank {e['rank_printed']}: {e['name']}",
                               "column": "applications_filed", "data_fy": doc.rep["fy"], "value": e["count"],
                               "name": e["name"], "rank_printed": e["rank_printed"], "raw_text": e["raw_text"],
                               "text_method": doc.method("layout", thr), **({"flags": e["flags"]} if "flags" in e else {})})
    out["checks"].append({"table": "top", "list": lid, "report_fy": doc.rep["fy"], "pages": pages,
                          "status": "pass" if nflags == 0 else "flagged", "n_entries": len(ents),
                          "detail": "ranks in sequence, counts non-increasing" if nflags == 0 else
                          [f"rank {e['rank_printed']}: {f}" for e in ents for f in e.get("flags", [])]
                          + (["fewer entries than list size"] if len(ents) < n else [])})


# --------------------------------------------------------------------------------------
# Cross-checks across tables and reports
# --------------------------------------------------------------------------------------
def cross_checks(out: dict):
    recs = out["records"]
    def get(table, report, row, col):
        for r in recs:
            if r["table"] == table and r["report_fy"] == report and r["row_label"] == row and r["column"] == col:
                return r["value"]
    checks = []
    for rep in sorted({r["report_fy"] for r in recs}):
        # appD filed vs appC grand total, same report
        for r in [r for r in recs if r["table"] == "appD" and r["report_fy"] == rep and r["column"] == "applications_filed"]:
            c = get("appC", rep, "grand_total", r["data_fy"])
            if c is not None and c != r["value"]:
                checks.append({"type": "within_report", "report_fy": rep, "data_fy": r["data_fy"],
                               "detail": f"Appendix D applications filed {r['value']} != Appendix C grand total {c}"})
        # state totals (current year, all routes) vs Appendix C residents
        for yr in {r["data_fy"] for r in recs if r["table"] == "state" and r["report_fy"] == rep}:
            tot = [r["value"] for r in recs if r["table"] == "state" and r["report_fy"] == rep and r["state"] == "TOTAL" and r["data_fy"] == yr]
            if len(tot) == 3:
                c = get("appC", rep, "residents", yr)
                cat = get("category", rep, yr, "total_indian")
                checks.append({"type": "state_vs_residents", "report_fy": rep, "data_fy": yr, "state_sum_all_routes": sum(tot),
                               "appC_residents": c, "category_total_indian": cat,
                               "match": (c is None or c == sum(tot)) and (cat is None or cat == sum(tot))})
    # revisions: same (table,row,column,data_fy) reported differently by different reports
    key = lambda r: (r["table"], r.get("state", r["row_label"]) if r["table"] == "state" else r["row_label"], r["column"], r["data_fy"])
    groups = {}
    for r in recs:
        if r["table"] in ("category", "state", "appC", "appD"):
            groups.setdefault(key(r), []).append((r["report_fy"], r["value"], r["page"]))
    revs = []
    for k, v in sorted(groups.items()):
        vals = {x[1] for x in v}
        if len(vals) > 1:
            revs.append({"table": k[0], "row": k[1], "column": k[2], "data_fy": k[3],
                         "by_report": [{"report_fy": a, "value": b, "page": c} for a, b, c in sorted(v)]})
    out["cross_checks"] = checks
    out["revisions"] = revs


# --------------------------------------------------------------------------------------
def selfcheck(out: dict, n: int, cache: Path, seed: int = 20261020):
    """Re-read N random values from the PDF with a second text method and confirm the value
    sits in the same row AND column position. Text PDFs: the other pdftotext mode (-raw vs
    -layout); OCR PDFs: a binarisation threshold (ink<160) that no extraction pass uses."""
    pool = [r for r in out["records"] if r["value"] is not None and r["table"] in ("category", "state", "appC", "appD", "top")]
    rng = random.Random(seed)
    picks = rng.sample(pool, min(n, len(pool)))
    res = []
    for r in picks:
        rep = next(x for x in REPORTS if x["fy"] == r["report_fy"])
        doc = Doc(rep, cache)
        if rep["mode"] == "ocr":
            text, method = doc.text(r["page"], "layout", 160), "ocr ink<160 (tesseract --psm 6)"
        else:
            m2 = "raw" if "layout" in r["text_method"] else "layout"
            text, method = doc.text(r["page"], m2), f"pdftotext -{m2}"
        t = NOISE.sub(" ", re.sub(r"(20\d\d)\s*-\s*\n?\s*(\d\d)\b", r"\1-\2", text))
        toks = re.findall(r"20\d\d-\d\d|[A-Za-z][A-Za-z&.'()-]*|\d+", t)
        if r["table"] == "state":
            words = [w for w in re.findall(r"[A-Za-z]{3,}", r["row_label"])]
            n_after, idx = 6, ["ordinary", "convention", "national_phase"].index(r["column"]) * 2 + (0 if r["data_fy"] == r["report_fy"] else 1)
            anchor = words[-1]
        elif r["table"] == "category":
            cols = next(x for x in REPORTS if x["fy"] == r["report_fy"])["category"][1]
            anchor, n_after, idx = r["row_label"], len(cols), cols.index(r["column"])
        elif r["table"] == "appD":
            anchor, n_after, idx = r["row_label"], 8, APPD_COLS.index(r["column"])
        elif r["table"] == "appC":
            anchor = {"residents": "Residents", "nonres_ordinary": "Ordinary", "nonres_convention": "Convention",
                      "nonres_national_phase": "Phase", "grand_total": "TOTAL"}[r["row_label"]]
            yrs = [x for x in toks if re.fullmatch(r"20\d\d-\d\d", x)][:10]
            n_after, idx = 10, yrs.index(r["column"]) if r["column"] in yrs else -1
        else:  # top list: the count follows the last word of the name
            anchor, n_after, idx = re.findall(r"[A-Za-z]{2,}", r["name"])[-1], 1, 0
        found = False
        for k, x in enumerate(toks):
            if x.lower().strip(".()") == anchor.lower().strip(".()") and idx >= 0:
                nums = [y for y in toks[k + 1:k + 1 + n_after + 8] if y.isdigit()][:n_after]
                if len(nums) > idx and int(nums[idx]) == r["value"]:
                    found = True
                    break
        res.append({"table": r["table"], "report_fy": r["report_fy"], "file": r["file"], "page": r["page"],
                    "row_label": r["row_label"], "column": r["column"], "data_fy": r["data_fy"], "value": r["value"],
                    "second_method": method, "same_row_and_column_in_second_read": found})
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cache", default="/tmp/ipindia-ocr-cache", help="OCR render cache (not committed)")
    ap.add_argument("--selfcheck", type=int, default=0)
    a = ap.parse_args()
    cache = Path(a.cache)
    manifest = json.loads((RAW / "manifest.json").read_text())
    by_path = {Path(f["local_path"]).name: f for f in manifest["files"]}
    out = {"generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "script": "scripts/stories/innovation-india/extract_ipindia.py",
           "tools": {"pdftotext": subprocess.run(["pdftotext", "-v"], capture_output=True, text=True).stderr.splitlines()[0],
                     "tesseract": subprocess.run(["tesseract", "--version"], capture_output=True, text=True).stdout.splitlines()[0]},
           "sources": [], "records": [], "checks": [], "rejected": []}
    for rep in REPORTS:
        p = RAW / rep["file"]
        m = by_path.get(rep["file"])
        if m is None:
            raise SystemExit(f"{rep['file']} not in manifest")
        h = sha256(p)
        if h != m["sha256"]:
            raise SystemExit(f"{rep['file']}: sha256 {h} differs from manifest {m['sha256']} (changed vintage?)")
        out["sources"].append({"report_fy": rep["fy"], "file": rep["file"], "url": m["url"], "sha256": h,
                               "text_layer": rep["mode"]})
        doc = Doc(rep, cache)
        jobs = []
        if rep.get("category"):
            jobs.append(("category", lambda d=doc, r=rep: extract_category(d, r["category"][0], r["category"][1], out)))
        if rep.get("state"):
            jobs.append(("state", lambda d=doc, r=rep: extract_state(d, r["state"], out)))
        if rep.get("appC"):
            jobs.append(("appC", lambda d=doc, r=rep: extract_appC(d, r["appC"], out)))
        if rep.get("appD"):
            jobs.append(("appD", lambda d=doc, r=rep: extract_appD(d, r["appD"], out)))
        for spec in rep.get("top", []):
            jobs.append((f"top:{spec[0]}", lambda d=doc, s=spec: extract_top(d, s, out)))
        for name, fn in jobs:
            try:
                fn()
            except Rejected as e:
                out["rejected"].append({"report_fy": rep["fy"], "table": name, "reason": str(e)})
                print(f"REJECTED {rep['fy']} {name}: {e}", file=sys.stderr)
    cross_checks(out)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "ipindia_extract.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    n = {}
    for r in out["records"]:
        n[r["table"]] = n.get(r["table"], 0) + 1
    print(f"records: {n}; checks: {len(out['checks'])}; rejected: {len(out['rejected'])}; revisions: {len(out['revisions'])}")
    if a.selfcheck:
        sc = selfcheck(out, a.selfcheck, cache)
        (OUT / "ipindia_selfcheck.json").write_text(json.dumps(sc, indent=1, ensure_ascii=False) + "\n")
        print(f"selfcheck: {sum(x['same_row_and_column_in_second_read'] for x in sc)}/{len(sc)} confirmed by a second read")


if __name__ == "__main__":
    main()
