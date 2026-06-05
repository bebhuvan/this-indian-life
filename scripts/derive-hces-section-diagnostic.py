#!/usr/bin/env python3
"""Diagnostic: weighted per-capita value of each LEVEL-14 SECTION, by sector.
Comparing these to the published Table 3.5 item-group MPCE reveals (a) which
item group each section is and (b) its reference-period scaling factor
(published / raw ≈ 30/7 for 7-day, 1 for 30-day, 30/365 for 365-day).
"""
import csv, sys, io, zipfile
from collections import defaultdict
ZIP = "data/snapshots/microdata-nada/downloads/HCES_Data_2023-24_Csv.zip"
csv.field_size_limit(1 << 24)

def member(zf, needle):
    for n in zf.namelist():
        if needle in n and n.lower().endswith(".csv"): return n
    raise SystemExit(needle)
def hhid(c): return tuple(c[2:16])
def fnum(s):
    s=(s or "").strip()
    try: return float(s) if s else 0.0
    except: return 0.0

# household size + weight + sector
hh = {}
with zipfile.ZipFile(ZIP) as zf:
  with zf.open(member(zf,"LEVEL - 15")) as fh:
    r=csv.reader(io.TextIOWrapper(fh,"utf-8","replace")); H=next(r)
    iS=H.index("HOUSEHOLD_SIZE")
    for c in r:
      if len(c)<=iS: continue
      k=hhid(c); v=fnum(c[iS])
      if v>0 and k not in hh: hh[k]=v

# denominator: total person-weight by sector; numerator: value*weight by (sector,section)
denom=defaultdict(float); seen=set()
numer=defaultdict(lambda: defaultdict(float))
with zipfile.ZipFile(ZIP) as zf:
  with zf.open(member(zf,"LEVEL - 14")) as fh:
    r=csv.reader(io.TextIOWrapper(fh,"utf-8","replace")); H=next(r)
    iSec=H.index("SECTION"); iV=H.index("VALUE_RS"); iM=H.index("MULTIPLIER")
    for c in r:
      if len(c)<=iM: continue
      k=hhid(c); sz=hh.get(k)
      if not sz: continue
      sector=c[3]; w=fnum(c[iM])
      if w<=0: continue
      numer[sector][c[iSec]] += fnum(c[iV])*w
      if k not in seen:
        seen.add(k); denom[(sector,)]+=sz*w

def pc(sector,sec):
    d=denom[(sector,)]
    return numer[sector][sec]/d if d else 0
secs=sorted(set(s for sec in numer.values() for s in sec), key=lambda x: [float(p) for p in x.split('.')])
print(f"{'SECTION':<8}{'rural/cap':>12}{'urban/cap':>12}")
for s in secs:
    print(f"{s:<8}{pc('1',s):>12.1f}{pc('2',s):>12.1f}")
# raw totals (no scaling) per capita
print("---")
print(f"RAW total  rural={sum(pc('1',s) for s in secs):.0f}  urban={sum(pc('2',s) for s in secs):.0f}")
print("(published all-items: rural 4122, urban 6996; food total 1939/2776, non-food 2183/4220)")
