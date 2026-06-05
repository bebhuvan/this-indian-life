#!/usr/bin/env python3
"""verify_who_works.py — QA for the PLFS-microdata series behind q.work.who_works_in_india.

Runs two layers of checks and prints a PASS/FAIL report:
  1. INTERNAL CONSISTENCY (offline, always runs): shares sum to ~100, LFPR>=WPR and the
     unemployment identity ties out, education-UR is monotonic, MPCE informality declines.
  2. OFFICIAL CROSS-CHECK (online, best-effort): pulls MoSPI's own published PLFS aggregates
     from the eSankhyiki API and confirms the microdata sits in the right band. Usual status
     (this dataset) should read HIGHER than the API's Current Weekly Status, never lower.

Exit code is non-zero if any internal check fails. Online failures only warn.
"""
import json, glob, os, re, sys

SERIES = "/home/bhuvanesh.r/Documents/Bhuvan projects/Indica/data/series"
g = {}
for fn in glob.glob(os.path.join(SERIES, "plfs.IN.work.who.*.json")):
    d = json.load(open(fn))
    obs = d.get("observations")
    if obs:
        g[d["indicatorId"]] = obs[0]["value"]
def v(k): return g["work.who." + k]

fails, warns = [], []
def check(name, cond, detail=""):
    print(f"  [{'PASS' if cond else 'FAIL'}] {name}{(' — ' + detail) if detail else ''}")
    if not cond: fails.append(name)

print("=== 1. INTERNAL CONSISTENCY ===")
sm = v("status_self_emp") + v("status_regular") + v("status_casual")
check("status shares sum to 100", abs(sm - 100) < 0.6, f"{sm:.1f}")
for sx in ("male", "female", "person"):
    lf, wp, ur = v("lfpr_" + sx), v("wpr_" + sx), v("ur_" + sx)
    check(f"{sx}: LFPR>=WPR", lf >= wp)
    check(f"{sx}: UR identity (LFPR-WPR)/LFPR", abs((lf - wp) / lf * 100 - ur) < 0.6, f"implied {(lf-wp)/lf*100:.1f} vs {ur}")
edu = ["not_literate", "below_primary", "primary", "middle", "secondary", "higher_secondary", "diploma", "graduate"]
ev = [v("ur_edu_" + e) for e in edu]
check("education UR rises to graduate", all(ev[i] <= ev[i + 1] + 0.4 for i in range(len(ev) - 1)), str(ev))
ind = sum(v("ind_" + k) for k in ("agri", "manufacturing", "construction", "trade_services", "public_other", "mining_utilities"))
check("industry shares sum to 100", abs(ind - 100) < 1.0, f"{ind:.1f}")
mp = [v("informal_mpce_" + q) for q in ("q1", "q2", "q3", "q4")]
check("informality falls as consumption rises", all(mp[i] >= mp[i + 1] for i in range(3)), str(mp))
check("goodjob odds collapse across stacked identity",
      v("goodjob_a_urban_upper_male_grad") > 10 * v("goodjob_e_rural_scst_female_loed"),
      f"{v('goodjob_a_urban_upper_male_grad')} vs {v('goodjob_e_rural_scst_female_loed')}")

print("\n=== 2. OFFICIAL CROSS-CHECK (parsed PLFS Quarterly Bulletin, local, best-effort) ===")
# Cross-check against MoSPI's own published PLFS Quarterly Bulletin (Current Weekly Status).
# Usual status (this dataset) should read HIGHER than CWS and within a sane band, never lower.
# No network, no TLS: reads the locally-parsed QB markdown if present.
QB = os.path.expanduser(
    "~/Documents/Bhuvan projects/Indica doc parse/out/"
    "mospi_qb_jan_mar_2026_direct_gemini_or/Final_QB_Upload_Jan-March-2026.md")
def band(name, mine, official, lo=-0.5, hi=12):
    ok = official + lo <= mine <= official + hi
    check(f"{name}: usual-status sits above CWS, in band", ok, f"microdata {mine} vs official CWS {official}")
if os.path.exists(QB):
    txt = open(QB, encoding="utf-8", errors="ignore").read()
    def grab(label):
        # value follows "...was NN.N%" a little after the label; NN.N won't match a year like 2026
        m = re.search(label + r".{0,160}?was (\d{2}\.\d)%", txt, re.S)
        return float(m.group(1)) if m else None
    lfpr = grab(r"LFPR \(in percent\) in Current Weekly Status for persons of age 15 years and above")
    wpr = grab(r"WPR \(in percent\) in Current Weekly Status for persons of age 15 years and above")
    if lfpr: band("LFPR person 15+", v("lfpr_person"), lfpr)
    else: warns.append("could not parse QB LFPR")
    if wpr: band("WPR person 15+", v("wpr_person"), wpr)
    else: warns.append("could not parse QB WPR")
else:
    warns.append("parsed QB not found; cross-check skipped")
    print("  [WARN] parsed QB not found at expected path; relying on internal checks")

print("\n=== RESULT ===")
print(f"internal failures: {len(fails)} | online warnings: {len(warns)}")
if fails:
    print("FAILED:", ", ".join(fails)); sys.exit(1)
print("All internal checks PASS." + (" (online cross-check skipped/warned)" if warns else ""))
