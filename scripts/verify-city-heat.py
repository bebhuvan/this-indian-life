#!/usr/bin/env python3
"""Verify the city-heat article: (A) series<->raw daily recompute, (B) prose<->series."""
import json, glob, os, re
from collections import defaultdict

SER = "data/series"
CITIES = sorted(re.sub(r".*open-meteo\.IN\.([^.]+)\.mean_temperature\.json", r"\1", p)
                for p in glob.glob(f"{SER}/open-meteo.IN.*.mean_temperature.json"))

def load(p):
    return json.load(open(p))

def year_of(d): return d[:4]

def has_apparent(city):
    rows = load(f"{SER}/open-meteo.IN.{city}.daily.json")["rows"]
    return any(isinstance(r.get("apparent_temperature_mean"),(int,float)) or isinstance(r.get("apparent_temperature_max"),(int,float)) for r in rows[:400])

def recompute(city, metric):
    """Recompute annual series from raw daily, mirroring ingest-open-meteo.mjs exactly."""
    daily = load(f"{SER}/open-meteo.IN.{city}.daily.json")["rows"]
    byyear = defaultdict(list)
    for r in daily:
        byyear[year_of(r["date"])].append(r)
    out = {}
    for y, rows in byyear.items():
        if len(rows) < 365:
            continue
        if metric == "mean_temperature":
            vals = [r["temperature_2m_mean"] for r in rows]
            clean = [v for v in vals if isinstance(v,(int,float))]
            v = sum(clean)/len(clean) if clean else None
        elif metric == "mean_apparent_temperature":
            vals = [r.get("apparent_temperature_mean") for r in rows]
            clean = [v for v in vals if isinstance(v,(int,float))]
            v = sum(clean)/len(clean) if clean else None
        elif metric == "very_hot_days":
            v = sum(1 for r in rows if isinstance(r.get("temperature_2m_max"),(int,float)) and r["temperature_2m_max"]>=35)
        elif metric == "hot_nights":
            v = sum(1 for r in rows if isinstance(r.get("temperature_2m_min"),(int,float)) and r["temperature_2m_min"]>=28)
        elif metric == "humid_heat_days":
            v = sum(1 for r in rows if isinstance(r.get("apparent_temperature_max"),(int,float)) and r["apparent_temperature_max"]>=40)
        if v is not None:
            out[y] = v
    return out

METRICS = ["mean_temperature","very_hot_days","hot_nights","mean_apparent_temperature","humid_heat_days"]

# ---------- LAYER A: series <-> raw ----------
print("="*70)
print("LAYER A — stored series vs recomputed-from-raw (mismatches only)")
print("="*70)
mismatch = 0; checked = 0; apparent_basis = 0; no_basis = []
APP = {"mean_apparent_temperature","humid_heat_days"}
for city in CITIES:
    app_ok = has_apparent(city)
    if app_ok: apparent_basis += 1
    else: no_basis.append(city)
    for metric in METRICS:
        f = f"{SER}/open-meteo.IN.{city}.{metric}.json"
        if not os.path.exists(f):
            continue
        if metric in APP and not app_ok:
            continue  # daily snapshot lacks apparent cols -> can't cross-check from raw
        stored = {o["date"]: o["value"] for o in load(f)["observations"]}
        recomp = recompute(city, metric)
        for y in sorted(set(stored)|set(recomp)):
            s, r = stored.get(y), recomp.get(y)
            checked += 1
            if s is None or r is None:
                if s != r: print(f"  PRESENCE {city}/{metric}/{y}: stored={s} recomp={r}"); mismatch+=1
            elif abs(s-r) > (0.01 if "mean" in metric else 0.5):
                print(f"  VALUE {city}/{metric}/{y}: stored={s:.3f} recomp={r:.3f}"); mismatch+=1
print(f"Layer A: {checked} city-year values checked, {mismatch} mismatches.")
print(f"  apparent-temp cross-checkable from raw daily: {apparent_basis}/{len(CITIES)} cities")
print(f"  apparent-temp NO raw basis (feels-like top-up not in .daily.json): {len(no_basis)} -> {no_basis}")

# ---------- LAYER B: prose <-> series ----------
def series(city, metric):
    return {o["date"]: o["value"] for o in load(f"{SER}/open-meteo.IN.{city}.{metric}.json")["observations"]}

def decade_change(city, metric, first=range(1940,1950), last=range(2016,2026)):
    s = series(city, metric)
    f = [s[str(y)] for y in first if str(y) in s]
    l = [s[str(y)] for y in last if str(y) in s]
    if not f or not l: return None
    return sum(l)/len(l) - sum(f)/len(f), sum(f)/len(f), sum(l)/len(l)

def fmt(city, metric, claim):
    r = decade_change(city, metric)
    if r is None: return f"  {city:18s} {metric:24s} NO DATA"
    ch, a, b = r
    return f"  {city:18s} {metric:24s} change={ch:+6.2f}  (1940s={a:6.2f} -> 2016-25={b:6.2f})   CLAIM: {claim}"

print("\n"+"="*70); print("LAYER B — prose claims vs series (decade change = 2016-25 mean minus 1940s mean)"); print("="*70)

print("\n-- WARMING (mean_temperature, °C) --")
for c,claim in [("kochi","+2.2 tops"),("srinagar","~+1.8"),("thiruvananthapuram","~+1.8"),("coimbatore","~+1.8"),("madurai","~+1.8"),("delhi","-0.4"),("amritsar","-0.7")]:
    print(fmt(c,"mean_temperature",claim))
warm = [(c, decade_change(c,"mean_temperature")[0]) for c in CITIES if decade_change(c,"mean_temperature")]
print(f"  cities warmer than 1940s: {sum(1 for _,v in warm if v>0)} of {len(warm)}  CLAIM: 36 of 38")
print(f"  coolers: {[c for c,v in warm if v<0]}")
print(f"  top warmer: {sorted(warm,key=lambda x:-x[1])[:5]}")

print("\n-- VERY HOT DAYS (>=35C max, days/yr) --")
for c,claim in [("madurai","+44"),("kochi","+42"),("guwahati","+26"),("coimbatore","+25"),("dehradun","-30"),("chennai","-15"),("ahmedabad","-14"),("amritsar","-14")]:
    print(fmt(c,"very_hot_days",claim))

print("\n-- HOT NIGHTS (>=28C min, days/yr) --")
for c,claim in [("chennai","43->93, peak 113 in 2024"),("surat","+42"),("patna","+36"),("ahmedabad","+32"),("madurai","+31"),("vijayawada","+31"),("delhi","crept up >0")]:
    print(fmt(c,"hot_nights",claim))
# Chennai peak
ch = series("chennai","hot_nights"); pk=max(ch.items(),key=lambda kv:kv[1])
print(f"  chennai hot_nights peak: {pk[1]} in {pk[0]}   CLAIM: 113 in 2024")

print("\n-- FEELS-LIKE (mean_apparent_temperature, °C) --")
for c,claim in [("kochi","+3.2"),("madurai","~+2.9"),("thiruvananthapuram","~+2.9"),("coimbatore","~+2.8"),("delhi","+1.9"),("amritsar","+1.6")]:
    print(fmt(c,"mean_apparent_temperature",claim))

print("\n-- DANGEROUS-HEAT DAYS (feels-like max >=40C, days/yr) --")
for c,claim in [("madurai","+96"),("kochi","+74"),("guwahati","+70"),("kolkata","+63"),("delhi","82->112")]:
    print(fmt(c,"humid_heat_days",claim))

# ---------- National ----------
print("\n"+"="*70); print("NATIONAL backdrop"); print("="*70)
era5 = {o["date"]:o["value"] for o in load(f"{SER}/era5.IN.climate.era5.temp_mean.json")["observations"]}
f40=[era5[str(y)] for y in range(1940,1950) if str(y) in era5]; l10=[era5[str(y)] for y in range(2016,2026) if str(y) in era5]
print(f"  ERA5 India mean: 1940s={sum(f40)/len(f40):.2f}  2016-25={sum(l10)/len(l10):.2f}   CLAIM: 23.2 -> 24.2")
berk = load(f"{SER}/berkeley.IN.climate.berkeley.temp_anomaly.json")["observations"]
bm = {o["date"]:o["value"] for o in berk}
warmest = max(bm.items(), key=lambda kv: kv[1])
print(f"  Berkeley warmest year: {warmest[0]} = {warmest[1]:+.3f}   CLAIM: 2016 warmest, +1.06 vs 1951-80")
print(f"  Berkeley value for 2016: {bm.get('2016')}   last year: {sorted(bm)[-1]}")
