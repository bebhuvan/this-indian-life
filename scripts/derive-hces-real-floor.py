#!/usr/bin/env python3
"""
derive-hces-real-floor.py
=========================

Did the REAL (inflation-adjusted) consumption FLOOR rise across India's three most
recent consumption surveys? This is a DISTRIBUTIONAL fact about the value of the
floor, NOT a poverty-line headcount.

Metric: average MPCE (monthly per-capita consumption expenditure) of the bottom
fractile classes (poorest 0-5%, 5-10%, the bottom decile 0-10%) plus the median
band (40-50% / 50-60%) for context, separately RURAL and URBAN, deflated to a
common price year with sector-specific CPI.

Rounds (ALL THREE ARE PUBLISHED -- no unit-level reconstruction needed):
  - CES 2011-12 (NSS 68th round): NSS Report No. 555, Table T3
       (MMRP variant -- the recall design closest to HCES).
  - HCES 2022-23 and HCES 2023-24: MoSPI HCES 2023-24 Press Note (27 Dec 2024),
       Figure 1 (which prints BOTH years' fractile MPCE, with imputation).

Deflator: MoSPI CPI 2012=100, sector-specific (CPI-Rural for rural fractiles,
CPI-Urban for urban), averaged over each survey's field window. This matches the
repo's real-wage convention (CPI 2012=100, survey-year mean).

Calibration: the population-share-weighted mean of the published fractile MPCE
reproduces each round's official overall mean to <0.1% for all six (round,sector)
cells -- see the printed check. This both validates the digitised numbers and
confirms the 2022-23/2023-24 figures are the with-imputation series.

COMPARABILITY CAVEAT (carried into the artifact metadata): the surveys are NOT
cleanly comparable. CES 2011-12 used MRP/URP recall and a shorter item list; HCES
2022-23/2023-24 use MMRP plus three separate visits, an expanded item list, and
impute the value of items received free under welfare schemes (PDS, etc.). Real
growth at the floor therefore blends a genuine rise in the floor with a
methodological lift. We show the real value of the floor, fully flagging the break;
we do NOT claim a clean poverty trajectory.
"""

import json
import os
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERIES_DIR = os.path.join(ROOT, "data", "series")

# ---------------------------------------------------------------------------
# 1. Published fractile-class average MPCE (nominal rupees per person per month)
# ---------------------------------------------------------------------------
# Fractile classes and their population weights (share of population, %).
FRACTILES = [
    ("Poorest 0-5%", 5),
    ("5-10%", 5),
    ("10-20%", 10),
    ("20-30%", 10),
    ("30-40%", 10),
    ("40-50%", 10),
    ("50-60%", 10),
    ("60-70%", 10),
    ("70-80%", 10),
    ("80-90%", 10),
    ("90-95%", 5),
    ("Richest 95-100%", 5),
]
LABELS = [f[0] for f in FRACTILES]
WEIGHTS = [f[1] for f in FRACTILES]

# CES 2011-12 / NSS 68th round, MMRP -- NSS Report 555 Table T3
R_2011 = [521.44, 665.84, 783.24, 904.57, 1017.80, 1135.97, 1266.08, 1426.76, 1645.36, 2007.46, 2556.33, 4481.18]
U_2011 = [700.50, 908.92, 1118.09, 1362.69, 1624.86, 1887.65, 2180.52, 2547.94, 3062.85, 3892.60, 5350.06, 10281.84]

# HCES 2022-23 -- press note (2023-24) Figure 1 (with imputation)
R_2022 = [1373, 1782, 2112, 2454, 2768, 3094, 3455, 3887, 4458, 5356, 6638, 10501]
U_2022 = [2001, 2607, 3157, 3762, 4348, 4963, 5662, 6524, 7673, 9582, 12399, 20824]

# HCES 2023-24 -- press note Figure 1 (with imputation)
R_2023 = [1677, 2126, 2473, 2833, 3162, 3498, 3866, 4304, 4885, 5763, 6929, 10137]
U_2023 = [2376, 3093, 3687, 4353, 4979, 5622, 6334, 7199, 8353, 10139, 12817, 20310]

ROUNDS = {
    "2011-12": {"rural": R_2011, "urban": U_2011, "published": "NSS Report 555, Table T3 (MMRP)"},
    "2022-23": {"rural": R_2022, "urban": U_2022, "published": "MoSPI HCES 2023-24 Press Note, Figure 1 (with imputation)"},
    "2023-24": {"rural": R_2023, "urban": U_2023, "published": "MoSPI HCES 2023-24 Press Note, Figure 1 (with imputation)"},
}

# Official overall means for the calibration check.
OFFICIAL_MEAN = {
    ("2011-12", "rural"): 1430, ("2011-12", "urban"): 2630,
    ("2022-23", "rural"): 3773, ("2022-23", "urban"): 6459,
    ("2023-24", "rural"): 4122, ("2023-24", "urban"): 6996,
}


def weighted_mean(values):
    return sum(v * w for v, w in zip(values, WEIGHTS)) / sum(WEIGHTS)


# ---------------------------------------------------------------------------
# 2. Sector-specific CPI deflators (MoSPI CPI 2012=100), survey-window averages
# ---------------------------------------------------------------------------
def load_cpi(sector):
    path = os.path.join(SERIES_DIR, f"mospi.IN.prices.cpi.{sector}.general.index.json")
    d = json.load(open(path))
    return {o["date"]: o["value"] for o in d["observations"]}


def window_months(start_y, start_m, n=12):
    out, y, m = [], start_y, start_m
    for _ in range(n):
        out.append(f"{y:04d}-{m:02d}")
        m += 1
        if m > 12:
            m, y = 1, y + 1
    return out


# Survey field windows.
WINDOWS = {
    "2011-12": window_months(2011, 7),   # Jul 2011 - Jun 2012
    "2022-23": window_months(2022, 8),   # Aug 2022 - Jul 2023
    "2023-24": window_months(2023, 8),   # Aug 2023 - Jul 2024
}

cpi_rural = load_cpi("rural")
cpi_urban = load_cpi("urban")


def avg_cpi(cpi, months):
    vals = [cpi[m] for m in months if m in cpi]
    assert len(vals) == len(months), f"missing CPI months: {set(months) - set(cpi)}"
    return sum(vals) / len(vals)


DEFLATOR = {}  # (round, sector) -> CPI index value (2012=100), survey-window mean
for rnd, months in WINDOWS.items():
    DEFLATOR[(rnd, "rural")] = avg_cpi(cpi_rural, months)
    DEFLATOR[(rnd, "urban")] = avg_cpi(cpi_urban, months)

# Common price base = 2023-24 survey window (today's rupees). Also report 2012 prices.
BASE_ROUND = "2023-24"


def to_real(nominal, rnd, sector, base_index):
    """Deflate nominal MPCE to the base index (2012=100 -> chosen base year)."""
    return nominal * base_index / DEFLATOR[(rnd, sector)]


# ---------------------------------------------------------------------------
# 3. Build artifact rows + run the calibration check
# ---------------------------------------------------------------------------
print("=" * 78)
print("CALIBRATION CHECK: population-weighted mean of published fractile MPCE")
print("vs official overall mean")
print("=" * 78)
calib = {}
for rnd in ROUNDS:
    for sector in ("rural", "urban"):
        wm = weighted_mean(ROUNDS[rnd][sector])
        tgt = OFFICIAL_MEAN[(rnd, sector)]
        diff = (wm / tgt - 1) * 100
        calib[(rnd, sector)] = (wm, tgt, diff)
        print(f"  {rnd} {sector:5s}: weighted={wm:8.1f}  official={tgt:5d}  diff={diff:+.2f}%")

print()
print("=" * 78)
print("CPI DEFLATORS (MoSPI CPI 2012=100, survey-window mean)")
print("=" * 78)
for rnd in WINDOWS:
    print(f"  {rnd}: CPI-Rural={DEFLATOR[(rnd,'rural')]:.2f}  CPI-Urban={DEFLATOR[(rnd,'urban')]:.2f}")
print(f"  Common base price year = {BASE_ROUND} window "
      f"(R={DEFLATOR[(BASE_ROUND,'rural')]:.2f}, U={DEFLATOR[(BASE_ROUND,'urban')]:.2f})")

rows = []
for rnd in ROUNDS:
    for sector in ("rural", "urban"):
        base_index = DEFLATOR[(BASE_ROUND, sector)]
        nominal = ROUNDS[rnd][sector]
        for label, nom in zip(LABELS, nominal):
            real_2324 = to_real(nom, rnd, sector, base_index)
            real_2012 = to_real(nom, rnd, sector, 100.0)  # 2012=100 base
            rows.append({
                "round": rnd,
                "sector": sector.capitalize(),
                "fractile": label,
                "nominalMpce": round(nom, 1),
                "realMpce_2023_24prices": round(real_2324, 1),
                "realMpce_2012prices": round(real_2012, 1),
                "published": True,
                "label": f"{rnd} {sector.capitalize()} {label}",
                "value": round(real_2324, 1),
                "date": rnd,
            })

fetched_at = datetime.now(timezone.utc).isoformat()

artifact = {
    "schemaVersion": 1,
    "artifactType": "table",
    "indicatorId": "poverty.real_floor_by_round",
    "title": "Real consumption floor across three surveys (bottom-fractile MPCE, deflated)",
    "sourceId": "derived",
    "sourceIndicatorId": "poverty.real_floor_by_round",
    "sourceUrl": "https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf",
    "unit": "₹ per person per month",
    "geography": {"type": "country", "id": "IN", "name": "India"},
    "dimensions": [
        "round", "sector", "fractile",
        "nominalMpce", "realMpce_2023_24prices", "realMpce_2012prices",
        "published", "label", "value", "date",
    ],
    "fetchedAt": fetched_at,
    "rows": rows,
    "metadata": {
        "question": "Did the real (inflation-adjusted) consumption of the poorest Indians rise across the three most recent consumption surveys? A distributional fact about the value of the floor, NOT a poverty-line headcount.",
        "metric": "Average MPCE of bottom fractile classes (poorest 0-5%, 5-10%, bottom decile), with the median band for context, rural and urban, deflated to a common price year.",
        "priceBase": f"Real columns: 'realMpce_2023_24prices' = {BASE_ROUND} survey-window rupees (today's rupees); 'realMpce_2012prices' = CPI 2012=100 base (matches the repo real-wage convention).",
        "deflator": {
            "source": "MoSPI CPI, 2012=100, sector-specific (CPI-Rural for rural, CPI-Urban for urban), averaged over each survey's field window.",
            "sourceUrl": "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi",
            "windows": {
                "2011-12": "Jul 2011 - Jun 2012",
                "2022-23": "Aug 2022 - Jul 2023",
                "2023-24": "Aug 2023 - Jul 2024",
            },
            "values_2012base": {
                "2011-12": {"rural": round(DEFLATOR[("2011-12", "rural")], 2), "urban": round(DEFLATOR[("2011-12", "urban")], 2)},
                "2022-23": {"rural": round(DEFLATOR[("2022-23", "rural")], 2), "urban": round(DEFLATOR[("2022-23", "urban")], 2)},
                "2023-24": {"rural": round(DEFLATOR[("2023-24", "rural")], 2), "urban": round(DEFLATOR[("2023-24", "urban")], 2)},
            },
        },
        "rounds": {
            "2011-12": "PUBLISHED. NSS 68th round / CES 2011-12, MMRP variant. Source: NSS Report No. 555, Table T3.",
            "2022-23": "PUBLISHED. HCES 2022-23, with imputation. Source: MoSPI HCES 2023-24 Press Note (27 Dec 2024), Figure 1.",
            "2023-24": "PUBLISHED. HCES 2023-24, with imputation. Source: MoSPI HCES 2023-24 Press Note (27 Dec 2024), Figure 1.",
        },
        "calibration": "Population-share-weighted mean of the published fractile MPCE reproduces each round's official overall mean to <0.1% in all six (round, sector) cells. This validates the digitised figures and confirms the 2022-23/2023-24 numbers are the with-imputation series.",
        "comparabilityCaveat": (
            "The three surveys are NOT cleanly comparable. CES 2011-12 used MRP/URP recall "
            "and a shorter item list; the 2011-12 figures here are the MMRP variant, the recall "
            "design closest to HCES, but still not identical. HCES 2022-23/2023-24 use three "
            "separate visits, an expanded item list (~405 items, multiple visits), and IMPUTE "
            "the value of items received free under welfare schemes (PDS grain, etc.). Real "
            "growth at the floor therefore blends a genuine rise in living standards with a "
            "methodological lift (recall change MRP->MMRP, free-item imputation, item-list "
            "expansion). We show the REAL VALUE OF THE FLOOR, fully acknowledging the break; we "
            "do NOT claim a clean poverty trajectory."
        ),
        "method": (
            "For each round x sector, take the published fractile-class average MPCE (nominal). "
            "Deflate with the sector-specific MoSPI CPI (2012=100) averaged over that round's "
            "field window. Report nominal, real in 2023-24 prices, and real in 2012 prices."
        ),
    },
}

out_path = os.path.join(SERIES_DIR, "derived.IN.poverty.real_floor_by_round.json")
with open(out_path, "w") as f:
    json.dump(artifact, f, indent=2, ensure_ascii=False)
    f.write("\n")

# ---------------------------------------------------------------------------
# 4. Report: real floor vs median, % change 2011-12 -> 2023-24
# ---------------------------------------------------------------------------
def real(rnd, sector, idx):
    base = DEFLATOR[(BASE_ROUND, sector)]
    return to_real(ROUNDS[rnd][sector][idx], rnd, sector, base)

def decile_real(rnd, sector):
    # bottom decile 0-10% = average of 0-5% and 5-10% (equal 5% weights)
    return (real(rnd, sector, 0) + real(rnd, sector, 1)) / 2

def median_real(rnd, sector):
    # median band 40-50% & 50-60% (equal weights) ~ the median person
    return (real(rnd, sector, 5) + real(rnd, sector, 6)) / 2

print()
print("=" * 78)
print(f"REAL MPCE in COMMON ({BASE_ROUND}) PRICES  [Rs/person/month]")
print("=" * 78)
hdr = f"{'segment':14s} | {'sector':5s} | {'2011-12':>9s} {'2022-23':>9s} {'2023-24':>9s} | {'%chg 11->23':>11s}"
print(hdr)
print("-" * len(hdr))
def chg(a, b): return (b / a - 1) * 100
for seg, fn in [("Poorest 0-5%", lambda r, s: real(r, s, 0)),
                ("5-10%", lambda r, s: real(r, s, 1)),
                ("Bottom decile", decile_real),
                ("Median (40-60)", median_real)]:
    for sector in ("rural", "urban"):
        v11, v22, v23 = fn("2011-12", sector), fn("2022-23", sector), fn("2023-24", sector)
        print(f"{seg:14s} | {sector:5s} | {v11:9.0f} {v22:9.0f} {v23:9.0f} | {chg(v11, v23):+10.1f}%")

print()
print("Wrote", os.path.relpath(out_path, ROOT))
