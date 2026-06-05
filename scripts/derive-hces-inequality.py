#!/usr/bin/env python3
"""Derive India's consumption inequality (Gini, deciles, by-state MPCE) from the
HCES 2023-24 unit-level microdata, instead of quoting the MoSPI factsheet.

Method
------
LEVEL-14 of the HCES 2023-24 CSV release is the consolidated value block: one
row per consumed item, with VALUE_RS already reference-period-adjusted to a
monthly figure, spanning every consumption section (5-14: food, fuel, services,
rent, durables). Summing VALUE_RS over all items of a household gives that
household's total monthly consumption expenditure. Dividing by household size
(from LEVEL-15) gives MPCE. Weighting by the survey Multiplier gives population
estimates.

This script is VALIDATION-FIRST: it prints weighted mean MPCE and the Gini by
sector so they can be checked against the published HCES 2023-24 factsheet
(rural MPCE ~Rs 4,122, urban ~Rs 6,996; Gini rural ~0.237, urban ~0.284) BEFORE
any artifact is written. Pass --write to emit series artifacts once validated.
"""
import csv, sys, io, zipfile, json, os
from collections import defaultdict
from datetime import datetime, timezone

ZIP = "data/snapshots/microdata-nada/downloads/HCES_Data_2023-24_Csv.zip"
L14 = "LEVEL - 14"
L15 = "LEVEL - 15"
WRITE = "--write" in sys.argv
csv.field_size_limit(1 << 24)

# State code -> name (NSS / Census 2011 codes used by HCES).
STATE = {
 "01":"Jammu & Kashmir","02":"Himachal Pradesh","03":"Punjab","04":"Chandigarh",
 "05":"Uttarakhand","06":"Haryana","07":"Delhi","08":"Rajasthan","09":"Uttar Pradesh",
 "10":"Bihar","11":"Sikkim","12":"Arunachal Pradesh","13":"Nagaland","14":"Manipur",
 "15":"Mizoram","16":"Tripura","17":"Meghalaya","18":"Assam","19":"West Bengal",
 "20":"Jharkhand","21":"Odisha","22":"Chhattisgarh","23":"Madhya Pradesh","24":"Gujarat",
 "25":"Daman & Diu","26":"Dadra & Nagar Haveli","27":"Maharashtra","28":"Andhra Pradesh",
 "29":"Karnataka","30":"Goa","31":"Lakshadweep","32":"Kerala","33":"Tamil Nadu",
 "34":"Puducherry","35":"Andaman & Nicobar","36":"Telangana","37":"Ladakh",
}

def member(zf, needle):
    for n in zf.namelist():
        if needle in n and n.lower().endswith(".csv"):
            return n
    raise SystemExit(f"member not found: {needle}")

def hhid(cols):
    # Household identity = identification prefix cols 2..15 (FSU .. Sample_Household_No);
    # col16 Questionnaire_No is the schedule type (H/F/C) and varies within a household.
    return tuple(cols[2:16])

def fnum(s):
    s = (s or "").strip()
    if not s:
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0

print("Reading household size from LEVEL-15 ...", file=sys.stderr)
hhsize = {}
with zipfile.ZipFile(ZIP) as zf:
    with zf.open(member(zf, L15)) as fh:
        r = csv.reader(io.TextIOWrapper(fh, "utf-8", errors="replace"))
        header = next(r)
        H = header.index("HOUSEHOLD_SIZE")
        for c in r:
            if len(c) <= H:
                continue
            k = hhid(c)
            v = fnum(c[H])
            if v > 0 and k not in hhsize:
                hhsize[k] = v
print(f"  households with size: {len(hhsize):,}", file=sys.stderr)

print("Summing consumption from LEVEL-14 ...", file=sys.stderr)
total = defaultdict(float)     # hhid -> sum VALUE_RS (monthly)
meta = {}                      # hhid -> (sector, state, multiplier)
with zipfile.ZipFile(ZIP) as zf:
    with zf.open(member(zf, L14)) as fh:
        r = csv.reader(io.TextIOWrapper(fh, "utf-8", errors="replace"))
        header = next(r)
        V = header.index("VALUE_RS"); M = header.index("MULTIPLIER")
        for c in r:
            if len(c) <= M:
                continue
            k = hhid(c)
            total[k] += fnum(c[V])
            if k not in meta:
                meta[k] = (c[3], c[4], fnum(c[M]))
print(f"  households with consumption: {len(total):,}", file=sys.stderr)

# Build per-household MPCE records.
recs = []  # (sector, state, mpce, weight)
missing = 0
for k, tot in total.items():
    sz = hhsize.get(k)
    if not sz:
        missing += 1
        continue
    sector, state, mult = meta[k]
    if mult <= 0 or tot <= 0:
        continue
    recs.append((sector, state, tot / sz, mult))
print(f"  usable households: {len(recs):,} (dropped {missing:,} without size)", file=sys.stderr)

def wmean(rows):
    sw = sum(w for *_, w in rows)
    return sum(m * w for *_, m, w in rows) / sw if sw else 0.0

def wgini(pairs):
    # pairs: list of (value, weight). Weighted Gini.
    pairs = sorted((m, w) for m, w in pairs if w > 0)
    if not pairs:
        return 0.0
    cw = 0.0; cwv = 0.0; g = 0.0
    sw = sum(w for _, w in pairs)
    swv = sum(m * w for m, w in pairs)
    for m, w in pairs:
        # area under Lorenz via trapezoids
        prev_cw, prev_cwv = cw, cwv
        cw += w; cwv += m * w
        g += (cw / sw - prev_cw / sw) * (cwv / swv + prev_cwv / swv)
    return 1 - g

def deciles(rows):
    # weighted decile boundaries + share of total consumption in each decile
    rs = sorted(((m, w) for *_, m, w in rows))
    sw = sum(w for _, w in rs)
    swv = sum(m * w for m, w in rs)
    bounds = []; shares = []
    target = sw / 10; acc = 0.0; accv = 0.0; cut = 1; seg_w = 0.0; seg_v = 0.0
    for m, w in rs:
        acc += w; accv += m * w; seg_w += w; seg_v += m * w
        while cut < 10 and acc >= target * cut:
            bounds.append(m)
            shares.append(seg_v)
            seg_w = 0.0; seg_v = 0.0
            cut += 1
    shares.append(seg_v)
    shares = [s / swv * 100 for s in shares]
    return bounds, shares

for label, sec in [("RURAL", "1"), ("URBAN", "2"), ("ALL", None)]:
    rows = [r for r in recs if sec is None or r[0] == sec]
    if not rows:
        continue
    mean = wmean(rows)
    gini = wgini([(m, w) for *_, m, w in rows])
    print(f"\n== {label} ==  households={len(rows):,}  weighted mean MPCE = Rs {mean:,.0f}  Gini = {gini:.3f}")
    b, sh = deciles(rows)
    print("  decile MPCE upper bounds:", [round(x) for x in b])
    print("  decile consumption shares (%):", [round(x, 1) for x in sh])

if not WRITE:
    print("\n(validation only — rerun with --write once the means/Gini match MoSPI)", file=sys.stderr)
    sys.exit(0)
