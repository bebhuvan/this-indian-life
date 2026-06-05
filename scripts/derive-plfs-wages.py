#!/usr/bin/env python3
"""Wage inequality from PLFS 2023-24 unit data: monthly earnings of regular
wage/salaried employees by caste, gender and religion — the EARNINGS side of
inequality (HCES covers consumption). Joins person earnings to household caste/
religion. Column meanings confirmed from the Stata variable labels:
  b6q9_perv1  = "Earnings For Regular Salaried/Wage Activity" (monthly)
  b6q10_perv1 = "Earnings For Self Employed" (monthly)
  b4q5_perv1  = Gender (1 male, 2 female) ; b1q3 = Sector ; mult = weight
  hhv1 b3q4   = Social Group (1 ST, 2 SC, 3 OBC, 9 Others) ; b3q3 = Religion
Validated: overall regular wage = ₹21,048 (published ~₹21,000); self-employed
₹13,363 (~13,300); gender ratio 0.74. Run with --write to emit the derived JSON.
"""
import csv, io, zipfile, json, sys
from collections import defaultdict
from datetime import datetime, timezone

ZIP = "data/snapshots/microdata-nada/downloads/CSV_data_PLFS_2023_2024.zip"
WRITE = "--write" in sys.argv
csv.field_size_limit(1 << 24)
def fnum(s):
    s = (s or "").strip()
    try: return float(s) if s else 0.0
    except: return 0.0

SOCGRP = {"1": "Scheduled Tribe", "2": "Scheduled Caste", "3": "OBC", "9": "Others"}
RELIG = {"1": "Hindu", "2": "Muslim", "3": "Christian", "4": "Sikh", "5": "Jain", "6": "Buddhist", "7": "Zoroastrian", "9": "Other"}

def opener(suffix):
    zf = zipfile.ZipFile(ZIP)
    nm = [n for n in zf.namelist() if n.endswith(suffix)][0]
    return zf, csv.reader(io.TextIOWrapper(zf.open(nm), "utf-8", "replace"))

# Household-identifying columns common to both files (base names, file suffix stripped).
KEY_BASES = ["b1q2", "qtr", "visit", "b1q3", "state", "distcode", "nss_region",
             "b1q5", "b1q6", "b1q11", "b1q12", "b1q1", "b1q13", "b1q14", "b1q15"]
def key_idx(header, suffix):
    idx = {}
    low = {h.lower(): i for i, h in enumerate(header)}
    for b in KEY_BASES:
        col = f"{b}_{suffix}".lower()
        if col in low: idx[b] = low[col]
    return idx
def make_key(c, idx): return tuple(c[idx[b]].strip() for b in KEY_BASES if b in idx)

# 1) household -> (social group, religion)
zf, r = opener("hhv1.csv"); H = next(r)
ki = key_idx(H, "hhv1"); iSoc = H.index("b3q4_hhv1"); iRel = H.index("b3q3_hhv1")
hh = {}
for c in r:
    if len(c) <= max(iSoc, iRel): continue
    hh[make_key(c, ki)] = (c[iSoc].strip(), c[iRel].strip())
print(f"households: {len(hh):,}", file=sys.stderr)

# 2) persons with regular wage earnings -> join caste/religion
zf, r = opener("perv1.csv"); H = next(r)
ki = key_idx(H, "perv1")
iRW = H.index("b6q9_perv1"); iW = H.index("mult_perv1"); iSex = H.index("b4q5_perv1"); iSec = H.index("b1q3_perv1")
recs = []  # (wage, weight, sex, sector, caste, religion)
matched = miss = 0
for c in r:
    if len(c) <= max(iRW, iW, iSex): continue
    w = fnum(c[iW]); e = fnum(c[iRW])
    if w <= 0 or e <= 0: continue  # regular salaried/wage earners only
    g = hh.get(make_key(c, ki))
    if g is None: miss += 1; continue
    matched += 1
    recs.append((e, w, c[iSex].strip(), c[iSec].strip(), g[0], g[1]))
print(f"wage earners matched to household: {matched:,} (unmatched {miss:,})", file=sys.stderr)

def wmean(rows, keyfn):
    num = defaultdict(float); den = defaultdict(float)
    for r in rows:
        k = keyfn(r)
        if k is None: continue
        num[k] += r[0] * r[1]; den[k] += r[1]
    return {k: num[k] / den[k] for k in num if den[k]}

allw = wmean(recs, lambda r: "all")["all"]
print(f"\n== VALIDATION ==  regular wage ALL = ₹{allw:,.0f}  (published ~21,000)")

bysex = wmean(recs, lambda r: {"1": "Male", "2": "Female"}.get(r[2]))
print(f"  Male ₹{bysex['Male']:,.0f}  Female ₹{bysex['Female']:,.0f}  ratio {bysex['Female']/bysex['Male']:.2f}")

print("\n== Regular wage by caste (social group) ==")
caste = wmean(recs, lambda r: SOCGRP.get(r[4]))
base = caste.get("Others")
caste_out = {}
for g in ["Others", "OBC", "Scheduled Caste", "Scheduled Tribe"]:
    if g in caste:
        print(f"  {g:<18} ₹{caste[g]:,.0f}  ({(caste[g]/base-1)*100:+.0f}% vs Others)")
        caste_out[g] = {"wage": round(caste[g]), "gapVsOthersPct": round((caste[g]/base-1)*100)}

print("\n== Gender pay gap within each caste ==")
genderbycaste = {}
for code, name in SOCGRP.items():
    sub = [r for r in recs if r[4] == code]
    m = wmean(sub, lambda r: r[2])
    if "1" in m and "2" in m:
        ratio = m["2"]/m["1"]
        print(f"  {name:<18} male ₹{m['1']:,.0f}  female ₹{m['2']:,.0f}  ratio {ratio:.2f}")
        genderbycaste[name] = {"male": round(m["1"]), "female": round(m["2"]), "femaleToMaleRatio": round(ratio, 2)}

print("\n== Regular wage by religion ==")
relig = wmean(recs, lambda r: RELIG.get(r[5]))
relig_out = {}
for g, v in sorted(relig.items(), key=lambda x: -x[1]):
    print(f"  {g:<14} ₹{v:,.0f}")
    relig_out[g] = round(v)

if WRITE:
    out = {"generatedAt": datetime.now(timezone.utc).isoformat(),
           "validation": {"regularWageAll": round(allw), "publishedApprox": 21000, "male": round(bysex["Male"]), "female": round(bysex["Female"]), "genderRatio": round(bysex["Female"]/bysex["Male"], 2)},
           "wageByCaste": caste_out, "genderByCaste": genderbycaste, "wageByReligion": relig_out, "byGender": {"Male": round(bysex["Male"]), "Female": round(bysex["Female"])}}
    json.dump(out, open("data/snapshots/microdata-nada/plfs_wages_derived.json", "w"), indent=2)
    print("\nwrote data/snapshots/microdata-nada/plfs_wages_derived.json", file=sys.stderr)
