#!/usr/bin/env python3
"""
build_who_works.py — generate the data series for the flagship "Who Works in India?"
(q.work.who_works_in_india), driven exclusively by PLFS 2025 unit-level microdata.

Reads the person + household CSVs (labelled headers), joins on the household key to
attach caste / religion / household consumption, computes ~100 weighted cuts across
gender, education, caste, religion, marriage, age, rural/urban, geography, the nature
of work and wages, and writes each cut as an Indica series artifact in data/series/.

Pure stdlib (no pandas). Columns are matched by NAME, not position.
"""
import csv, json, os, sys
from collections import defaultdict

PLFS_DIR = "/home/bhuvanesh.r/Documents/PLFS/Data in CSV"
PERSON = os.path.join(PLFS_DIR, "cperv1.csv")
HH = os.path.join(PLFS_DIR, "chhv1.csv")
OUT_DIR = "/home/bhuvanesh.r/Documents/Bhuvan projects/Indica/data/series"
YEAR = "2025"
csv.field_size_limit(10_000_000)

# ---- code maps -------------------------------------------------------------
EMP = {11, 12, 21, 31, 41, 51}          # employed (usual status)
SELF = {11, 12, 21}                      # self-employed (own-acct, employer, unpaid helper)
REGULAR = {31}
CASUAL = {41, 51}
UNEMP = {81}
EDU = {  # General_Education_Level -> label key
    1: "not_literate", 2: "not_literate", 3: "not_literate", 4: "below_primary",
    5: "below_primary", 6: "primary", 7: "middle", 8: "secondary",
    10: "higher_secondary", 11: "diploma", 12: "graduate", 13: "postgraduate"}
EDU_ORDER = ["not_literate", "below_primary", "primary", "middle", "secondary",
             "higher_secondary", "diploma", "graduate", "postgraduate"]
CASTE = {1: "st", 2: "sc", 3: "obc", 9: "others"}
RELIG = {1: "hindu", 2: "muslim", 3: "christian", 4: "sikh", 5: "jain", 6: "buddhist"}
MARITAL = {1: "never_married", 2: "married", 3: "widowed", 4: "divorced"}
# Census-2011 state/UT codes — the coding the PLFS unit-level microdata uses
# (verified: code 09 = Uttar Pradesh has the most records; 27 = Maharashtra; 36 = Telangana).
STATES = {
    1: "Jammu & Kashmir", 2: "Himachal Pradesh", 3: "Punjab", 4: "Chandigarh",
    5: "Uttarakhand", 6: "Haryana", 7: "Delhi", 8: "Rajasthan", 9: "Uttar Pradesh",
    10: "Bihar", 11: "Sikkim", 12: "Arunachal Pradesh", 13: "Nagaland", 14: "Manipur",
    15: "Mizoram", 16: "Tripura", 17: "Meghalaya", 18: "Assam", 19: "West Bengal",
    20: "Jharkhand", 21: "Odisha", 22: "Chhattisgarh", 23: "Madhya Pradesh",
    24: "Gujarat", 25: "Dadra & Nagar Haveli and Daman & Diu", 26: "Dadra & Nagar Haveli and Daman & Diu",
    27: "Maharashtra", 28: "Andhra Pradesh", 29: "Karnataka", 30: "Goa",
    31: "Lakshadweep", 32: "Kerala", 33: "Tamil Nadu", 34: "Puducherry",
    35: "Andaman & Nicobar Islands", 36: "Telangana", 37: "Ladakh"}

def i(v):
    try: return int(float(v))
    except (ValueError, TypeError): return None
def f(v):
    try: return float(v)
    except (ValueError, TypeError): return None

# ---- weighted accumulators -------------------------------------------------
W = defaultdict(float)            # bucket -> weighted count
MED = defaultdict(list)           # bucket -> list of (value, weight) for weighted medians
def add(bucket, w): W[bucket] += w
def addmed(bucket, val, w): MED[bucket].append((val, w))
def share(num, den): return round(100 * W[num] / W[den], 1) if W[den] else None
def wmedian(bucket):
    rows = sorted(MED[bucket]); tot = sum(w for _, w in rows)
    if not tot: return None
    half, run = tot / 2, 0.0
    for v, w in rows:
        run += w
        if run >= half: return round(v)
    return round(rows[-1][0])

# ---- load household dimensions ---------------------------------------------
print("loading households...", file=sys.stderr)
hh = {}
with open(HH, newline="") as fhh:
    r = csv.reader(fhh); head = next(r); H = {n: k for k, n in enumerate(head)}
    kc = [H[c] for c in ("Panel", "Quarter", "Sector", "State_Ut_Code", "FSU",
                          "Second_Stage_Stratum_No", "Sample_Household_Number")]
    sg, rel, mp = H["Social_Group"], H["Religion"], H["Monthly_Consumer_Expenditure"]
    for row in r:
        key = "|".join(row[c] for c in kc)
        hh[key] = (i(row[sg]), i(row[rel]), f(row[mp]))

# collect MPCE quartile cutoffs (population-weighted over persons would need a pass;
# use household MPCE distribution, simple unweighted quartiles as cut points)
mpce_vals = sorted(v[2] for v in hh.values() if v[2] and v[2] > 0)
def q(p): return mpce_vals[int(p * (len(mpce_vals) - 1))]
MPCE_Q = [q(0.25), q(0.50), q(0.75)] if mpce_vals else [0, 0, 0]
def mpce_bucket(v):
    if v is None or v <= 0: return None
    if v <= MPCE_Q[0]: return "q1"
    if v <= MPCE_Q[1]: return "q2"
    if v <= MPCE_Q[2]: return "q3"
    return "q4"

# ---- stream persons --------------------------------------------------------
print("streaming persons...", file=sys.stderr)
with open(PERSON, newline="") as fp:
    r = csv.reader(fp); head = next(r); P = {n: k for k, n in enumerate(head)}
    kc = [P[c] for c in ("Panel", "Quarter", "Sector", "State_UT_Code", "FSU",
                          "Second_Stage_Stratum_No", "Sample_Household_Number")]
    c_sex, c_age, c_mar, c_sec, c_st = (P["Sex"], P["Age"], P["Marital_Status"],
        P["Sector"], P["State_UT_Code"])
    c_edu, c_ps, c_ss = P["General_Education_Level"], P["Principal_Status_Code"], P["Subsidiary_Status_Code"]
    c_ind, c_ent = P["Principal_Industry_Code"], P["Principal_Enterprise_Type"]
    c_ct, c_pl, c_socsec = P["Principal_Job_Contract_Type"], P["Principal_Paid_Leave"], P["Principal_Social_Security"]
    c_earn, c_attend, c_mult = P["CWS_Earnings_Salaried"], P["Current_Attendance_Status"], P["Subsample_Multiplier"]
    daywage = [P[f"Day{d}_Act{a}_Wage"] for d in range(1, 8) for a in (1, 2)]

    for row in r:
        w = (f(row[c_mult]) or 0) / 100.0
        if w <= 0: continue
        sex, age, ps = i(row[c_sex]), i(row[c_age]), i(row[c_ps])
        ss = i(row[c_ss]); sec = i(row[c_sec]); state = i(row[c_st])
        edu = EDU.get(i(row[c_edu])); mar = MARITAL.get(i(row[c_mar]))
        sgrp, relig, mpce = hh.get("|".join(row[c] for c in kc), (None, None, None))
        sexk = "male" if sex == 1 else "female" if sex == 2 else None
        emp = ps in EMP
        emp_pss = emp or (ss in EMP)           # ps+ss employment
        un = (ps in UNEMP) and (ss not in EMP) # unemployed in usual status (ps+ss)
        lf = emp or un
        lf_pss = emp_pss or un                 # usual-status (ps+ss) labour force

        # ---------- participation (adults 15+) ----------
        if age is not None and age >= 15:
            if sexk:
                add(f"pop_{sexk}", w)
                if lf_pss: add(f"lf_{sexk}", w)
                if emp_pss: add(f"wpr_{sexk}", w)
                if un: add(f"un_{sexk}", w)
            add("pop_person", w)
            if lf_pss: add("lf_person", w)
            if emp_pss: add("emp_person", w)
            if un: add("un_person", w)
            # female participation by marriage / religion / state
            if sex == 2:
                if mar: add(f"fpop_mar_{mar}", w);  (lf_pss and add(f"flf_mar_{mar}", w))
                rk = RELIG.get(relig)
                if rk: add(f"fpop_rel_{rk}", w);    (lf_pss and add(f"flf_rel_{rk}", w))
                if state in STATES: add(f"fpop_st_{state}", w); (lf_pss and add(f"flf_st_{state}", w))
            # unemployment by education (15+) — usual status (ps+ss) labour force
            if edu and lf_pss:
                add(f"lf_edu_{edu}", w);  (un and add(f"un_edu_{edu}", w))
            # caste outcomes among labour force
            ck = CASTE.get(sgrp)
            if ck and lf_pss: add(f"lf_caste_{ck}", w); (un and add(f"un_caste_{ck}", w))
            # ---- compounding: odds of a "good formal job" by stacked identity ----
            # good formal job = employed, regular salaried (31), with social security (1-7)
            socsec_a = i(row[c_socsec])
            goodjob = emp and ps == 31 and (socsec_a is not None and 1 <= socsec_a <= 7)
            secn_a = "urban" if sec == 2 else "rural" if sec == 1 else None
            gradplus = edu in ("graduate", "postgraduate")
            secband = edu in ("secondary", "higher_secondary")
            uptoprim = edu in ("not_literate", "below_primary", "primary")
            arch = None
            if secn_a == "urban" and ck == "others" and sex == 1 and gradplus: arch = "a_urban_upper_male_grad"
            elif secn_a == "urban" and ck == "obc" and sex == 1 and secband: arch = "b_urban_obc_male_sec"
            elif secn_a == "rural" and ck == "obc" and sex == 1 and secband: arch = "c_rural_obc_male_sec"
            elif secn_a == "rural" and ck == "sc" and sex == 1 and uptoprim: arch = "d_rural_sc_male_loed"
            elif secn_a == "rural" and ck in ("sc", "st") and sex == 2 and uptoprim: arch = "e_rural_scst_female_loed"
            if arch:
                add(f"archpop_{arch}", w)
                if goodjob: add(f"archjob_{arch}", w)

        # ---------- youth 15-29 ----------
        if age is not None and 15 <= age <= 29:
            add("ypop_person", w)
            if lf_pss: add("ylf_person", w)
            if un: add("yun_person", w)
            if sexk:
                add(f"ypop_{sexk}", w)
                if lf_pss: add(f"ylf_{sexk}", w)
                if un: add(f"yun_{sexk}", w)
            if edu and lf_pss:
                add(f"ylf_edu_{edu}", w); (un and add(f"yun_edu_{edu}", w))
            # NEET: not in employment (ps+ss) and not a student (status 91 = attending education)
            student = (ps == 91)
            if not emp_pss and not student:
                add("neet_person", w)
                if sexk: add(f"neet_{sexk}", w)

        # ---------- age-band unemployment ----------
        if age is not None and age >= 15:
            band = "15_29" if age <= 29 else "30_59" if age <= 59 else "60plus"
            if lf_pss: add(f"agelf_{band}", w); (un and add(f"ageun_{band}", w))

        # ---------- workers: status mix, industry, formality, caste, geo ----------
        if emp:
            add("workers", w)
            cat = "self_emp" if ps in SELF else "regular" if ps in REGULAR else "casual"
            add(f"status_{cat}", w)
            add(f"status_{cat}_{sex==1 and 'male' or sex==2 and 'female' or 'x'}", w)
            if ps == 21: add(f"unpaid_{sexk}", w) if sexk else None   # unpaid family helper
            # rural / urban status mix
            secn = "rural" if sec == 1 else "urban" if sec == 2 else None
            if secn:
                add(f"workers_{secn}", w); add(f"status_{cat}_{secn}", w)
            # industry (NIC division)
            div = (i(row[c_ind]) or 0) // 1000
            if 1 <= div <= 3: ind = "agri"
            elif 5 <= div <= 9 or div == 35: ind = "mining_utilities"
            elif 10 <= div <= 33: ind = "manufacturing"
            elif 41 <= div <= 43: ind = "construction"
            elif 45 <= div <= 82: ind = "trade_services"
            elif 84 <= div <= 99: ind = "public_other"
            else: ind = None
            if ind: add(f"ind_{ind}", w)
            # informality: formal = has social security (1-7) OR formal enterprise
            ent = row[c_ent].strip()
            socsec = i(row[c_socsec])
            formal = (socsec is not None and 1 <= socsec <= 7) or ent in ("05", "06", "08", "11", "07")
            if not formal: add("informal", w)
            # informal by caste / rural-urban / MPCE
            ck = CASTE.get(sgrp)
            if ck:
                add(f"workers_caste_{ck}", w)
                if cat == "casual": add(f"casual_caste_{ck}", w)
                if cat == "regular": add(f"regular_caste_{ck}", w)
                if not formal: add(f"informal_caste_{ck}", w)
            if secn and not formal: add(f"informal_{secn}", w)
            mb = mpce_bucket(mpce)
            if mb:
                add(f"workers_mpce_{mb}", w)
                if not formal: add(f"informal_mpce_{mb}", w)

            # ---------- wages ----------
            earn = f(row[c_earn])
            if ps == 31 and earn and earn > 0:                    # regular salaried (monthly ₹)
                grp = "formal" if (socsec is not None and 1 <= socsec <= 7) else "informal"
                addmed(f"wage_{grp}", earn, w)
                addmed("wage_salaried", earn, w)
                if sexk: addmed(f"wage_{sexk}", earn, w)
                if ck: addmed(f"wage_caste_{ck}", earn, w)
            if cat == "casual":                                   # casual daily wage
                wk = sum(f(row[c]) or 0 for c in daywage)
                days = sum(1 for d in range(1, 8)
                           if (f(row[P[f'Day{d}_Act1_Wage']]) or 0) + (f(row[P[f'Day{d}_Act2_Wage']]) or 0) > 0)
                if wk > 0 and days > 0:
                    addmed("wage_casual_daily", wk / days, w)

            # ---------- formality detail among salaried (status 31) ----------
            if ps == 31:
                add("salaried", w)
                if socsec == 8: add("salaried_no_socsec", w)
                if i(row[c_ct]) == 1: add("salaried_no_contract", w)
                if i(row[c_pl]) == 2 or i(row[c_pl]) == 0: pass  # paid leave handled below
                pl = i(row[c_pl])
                if pl == 2: add("salaried_no_paidleave", w)       # 2 = not eligible

        # ---------- MPCE median (household consumption per capita) ----------
        if mpce and mpce > 0:
            addmed("mpce", mpce, w)

# ---- assemble series -------------------------------------------------------
print("writing series...", file=sys.stderr)
SERIES = {}   # indicatorId -> (title, unit, value)
def s(ind, title, unit, value):
    if value is not None: SERIES[ind] = (title, unit, value)

# participation
for g in ("male", "female", "person"):
    s(f"work.who.lfpr_{g}", f"LFPR, {g} 15+ (ps+ss)", "%", share(f"lf_{g}", f"pop_{g}") if g!="person" else share("lf_person","pop_person"))
    s(f"work.who.wpr_{g}", f"WPR, {g} 15+", "%", share(f"wpr_{g}", f"pop_{g}") if g!="person" else share("emp_person","pop_person"))
    s(f"work.who.ur_{g}", f"Unemployment rate, {g} 15+", "%", share(f"un_{g}", f"lf_{g}") if g!="person" else share("un_person","lf_person"))
# female participation by marriage
for m in MARITAL.values():
    s(f"work.who.flfpr_mar_{m}", f"Female LFPR — {m.replace('_',' ')}", "%", share(f"flf_mar_{m}", f"fpop_mar_{m}"))
# female participation by religion
for rk in RELIG.values():
    s(f"work.who.flfpr_relig_{rk}", f"Female LFPR — {rk}", "%", share(f"flf_rel_{rk}", f"fpop_rel_{rk}"))
# unpaid family work — unpaid family helpers as a share of that sex's workers
for g, code in (("male", "male"), ("female", "female")):
    denom = W[f"status_self_emp_{g}"] + W[f"status_regular_{g}"] + W[f"status_casual_{g}"]
    if denom: SERIES[f"work.who.unpaid_share_{g}"] = (f"Unpaid family workers, {g} (% of workers)", "%", round(100*W[f'unpaid_{g}']/denom,1))
# education paradox (UR by education, 15+ and youth)
for e in EDU_ORDER:
    s(f"work.who.ur_edu_{e}", f"Unemployment rate — {e.replace('_',' ')} (15+)", "%", share(f"un_edu_{e}", f"lf_edu_{e}"))
    s(f"work.who.ur_youth_edu_{e}", f"Youth unemployment — {e.replace('_',' ')} (15–29)", "%", share(f"yun_edu_{e}", f"ylf_edu_{e}"))
# caste
for ck in CASTE.values():
    s(f"work.who.casual_share_{ck}", f"Casual labour share — {ck.upper()} workers", "%", share(f"casual_caste_{ck}", f"workers_caste_{ck}"))
    s(f"work.who.regular_share_{ck}", f"Regular-salaried share — {ck.upper()} workers", "%", share(f"regular_caste_{ck}", f"workers_caste_{ck}"))
    s(f"work.who.ur_{ck}", f"Unemployment rate — {ck.upper()} (15+)", "%", share(f"un_caste_{ck}", f"lf_caste_{ck}"))
    s(f"work.who.informal_share_{ck}", f"Informal share — {ck.upper()} workers", "%", share(f"informal_caste_{ck}", f"workers_caste_{ck}"))
    s(f"work.who.wage_caste_{ck}", f"Median salaried wage — {ck.upper()}", "₹/month", wmedian(f"wage_caste_{ck}"))
# youth / age
for g in ("male", "female", "person"):
    s(f"work.who.ur_youth_{g}", f"Youth unemployment, {g} (15–29)", "%", share(f"yun_{g}", f"ylf_{g}"))
    s(f"work.who.neet_{g}", f"NEET rate, {g} (15–29)", "%", share(f"neet_{g}", f"ypop_{g}"))
for band in ("15_29", "30_59", "60plus"):
    s(f"work.who.ur_age_{band}", f"Unemployment rate — age {band.replace('_','–')}", "%", share(f"ageun_{band}", f"agelf_{band}"))
# rural / urban status & informality
for secn in ("rural", "urban"):
    for cat in ("self_emp", "regular", "casual"):
        s(f"work.who.{cat}_{secn}", f"{cat.replace('_',' ')} share — {secn}", "%", share(f"status_{cat}_{secn}", f"workers_{secn}"))
    s(f"work.who.informal_{secn}", f"Informal share — {secn} workers", "%", share(f"informal_{secn}", f"workers_{secn}"))
# industry
IND = {"agri": "Agriculture", "manufacturing": "Manufacturing", "construction": "Construction",
       "trade_services": "Trade, transport & services", "public_other": "Public admin/edu/health",
       "mining_utilities": "Mining & utilities"}
for k, lbl in IND.items():
    s(f"work.who.ind_{k}", f"Share of workers — {lbl}", "%", share(f"ind_{k}", "workers"))
# nature of work overall
s("work.who.informal_overall", "Informal employment (% of all workers)", "%", share("informal", "workers"))
for cat in ("self_emp", "regular", "casual"):
    s(f"work.who.status_{cat}", f"{cat.replace('_',' ')} (% of all workers)", "%", share(f"status_{cat}", "workers"))
unpaid_all = W["unpaid_male"] + W["unpaid_female"]
if W["workers"]: SERIES["work.who.unpaid_overall"] = ("Unpaid family workers (% of all workers)", "%", round(100*unpaid_all/W["workers"],1))
s("work.who.salaried_no_socsec", "Salaried workers without social security", "%", share("salaried_no_socsec", "salaried"))
s("work.who.salaried_no_contract", "Salaried workers without a written contract", "%", share("salaried_no_contract", "salaried"))
s("work.who.salaried_no_paidleave", "Salaried workers without paid leave", "%", share("salaried_no_paidleave", "salaried"))
# wages
s("work.who.wage_formal", "Median monthly salaried wage — formal", "₹/month", wmedian("wage_formal"))
s("work.who.wage_informal", "Median monthly salaried wage — informal", "₹/month", wmedian("wage_informal"))
s("work.who.wage_male", "Median monthly salaried wage — men", "₹/month", wmedian("wage_male"))
s("work.who.wage_female", "Median monthly salaried wage — women", "₹/month", wmedian("wage_female"))
s("work.who.wage_casual_daily", "Median casual daily wage", "₹/day", wmedian("wage_casual_daily"))
s("work.who.mpce_median", "Median monthly consumption per household (MPCE)", "₹/month", wmedian("mpce"))
# informality by income quartile (working poor)
for qb in ("q1", "q2", "q3", "q4"):
    s(f"work.who.informal_mpce_{qb}", f"Informal share — consumption {qb.upper()}", "%", share(f"informal_mpce_{qb}", f"workers_mpce_{qb}"))
# compounding: odds of a good formal job by stacked identity
ARCH = {
    "a_urban_upper_male_grad": "Urban, upper-caste, male, graduate",
    "b_urban_obc_male_sec": "Urban, OBC, male, secondary-educated",
    "c_rural_obc_male_sec": "Rural, OBC, male, secondary-educated",
    "d_rural_sc_male_loed": "Rural, Dalit, male, low-educated",
    "e_rural_scst_female_loed": "Rural, Dalit/Adivasi, woman, low-educated",
}
for k, lbl in ARCH.items():
    s(f"work.who.goodjob_{k}", f"Holds a secure formal job — {lbl}", "% of that group with a regular salaried job + social security", share(f"archjob_{k}", f"archpop_{k}"))

# geography: female LFPR by state
for code, name in STATES.items():
    if W[f"fpop_st_{code}"] > 500:
        slug = name.lower().replace(" & ", "_").replace("&","_").replace(" ", "_").replace("/","_")
        s(f"work.who.flfpr_state_{slug}", f"Female LFPR — {name}", "%", share(f"flf_st_{code}", f"fpop_st_{code}"))

# ---- write series files ----------------------------------------------------
os.makedirs(OUT_DIR, exist_ok=True)
written = 0
for ind, (title, unit, value) in SERIES.items():
    art = {
        "schemaVersion": 1, "artifactType": "series", "indicatorId": ind,
        "title": title, "sourceId": "plfs",
        "sourceIndicatorId": "PLFS_2025_unit_level",
        "sourceUrl": "https://microdata.gov.in/NADA/index.php/catalog/PLFS",
        "unit": unit, "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [], "fetchedAt": "2026-06-04T00:00:00.000Z",
        "observations": [{"date": YEAR, "value": value}],
        "metadata": {"dataset": "PLFS unit-level (Calendar 2025, visit 1)",
                     "computedFrom": "cperv1.csv + chhv1.csv", "definition": "usual status (ps+ss) where noted; weighted by Subsample_Multiplier/100"},
    }
    fn = os.path.join(OUT_DIR, f"plfs.IN.{ind}.json")
    with open(fn, "w") as fo: json.dump(art, fo, indent=2)
    written += 1

# ---- summary printout for prose -------------------------------------------
print(f"\n=== WROTE {written} series to {OUT_DIR} ===\n")
print(f"MPCE quartile cutoffs (₹/month): {MPCE_Q}")
print("\n--- key numbers ---")
for ind in sorted(SERIES):
    t, u, v = SERIES[ind]
    print(f"{ind:42s} {v:>10} {u:10s} | {t}")
