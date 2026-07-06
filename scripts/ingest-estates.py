#!/usr/bin/env python3
"""Ingest the RBI e-STATES database (State Finances: A Study of Budgets of 2025-26).

The source XLSX is a long-format panel:
  Appendix | State/UT | Budget Head | Fiscal Year | Account | Revised | Budget

We extract a *curated* subset of budget heads (the ones the article's visualPlan
needs) for every state, across 1990-91..2025-26, and write an intermediate parsed
JSON that derive-estates.py turns into chart artifacts.

Value selection per (state, head, year): prefer the most-actual figure available,
Account > Revised > Budget, and record which vintage was used so 2024-25 (RE/PA)
and 2025-26 (Budget Estimate) can be flagged honestly downstream.

Source: RBI, "State Finances: A Study of Budgets of 2025-26", e-STATES database.
        https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=State+Finances+%3A+A+Study+of+Budgets
Note (from the file's own Note sheet): "All States/UT" excludes UTs for 1990-91..2016-17
(2000-01..2004-05 includes NCT Delhi); 2017-18 onwards covers all States and UTs.
"""

import json
import os
import sys
from collections import defaultdict

import openpyxl

SRC = os.path.expanduser(
    "~/Downloads/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A.XLSX"
)
OUT_DIR = "data/snapshots/estates"
OUT = os.path.join(OUT_DIR, "estates.parsed.json")

# (appendix, exact head string) -> short key used downstream.
HEADS = {
    # Appendix-1: revenue receipts
    ("Appendix-1", "Total: TOTAL REVENUE (I+II)"): "total_revenue",
    ("Appendix-1", "I.A: State's Own Tax Revenue (1 to 3)"): "own_tax",
    ("Appendix-1", "I.B: Share in Central Taxes (i to ix)"): "central_tax_share",
    ("Appendix-1", "II.C: State's Own Non-Tax Revenue (1 to 6)"): "own_nontax",
    ("Appendix-1", "II.D: Grants from the Centre (1 to 7)"): "central_grants",
    # Appendix-2: revenue expenditure by function / economic class
    ("Appendix-2", "Total: TOTAL EXPENDITURE (I+II+III)"): "total_rev_exp",
    ("Appendix-2", "II.C.2: Interest Payments (i to iv)"): "interest",
    ("Appendix-2", "II.E: Pensions"): "pensions",
    ("Appendix-2", "I.A.1: Education, Sports, Art and Culture"): "education",
    ("Appendix-2", "I.A.2: Medical and Public Health"): "health",
    ("Appendix-2", "I.A.9: Social Security and Welfare"): "social_security",
    # Appendix-4: deficit indicators (capital account financing)
    ("Appendix-4", "C: Overall Surplus (+)/Deficit (-) (A+B)"): "overall_balance",
    ("Appendix-4", "A: Surplus (+)/Deficit (-) on Revenue Account"): "revenue_balance",
}


def main():
    if not os.path.exists(SRC):
        sys.exit(f"Source not found: {SRC}")
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb["Data"]

    # data[state][head_key][fiscal_year] = {"value": float, "vintage": str}
    data = defaultdict(lambda: defaultdict(dict))
    n_rows = 0
    n_kept = 0
    for r in ws.iter_rows(min_row=2, values_only=True):
        n_rows += 1
        appendix, state, head, year, account, revised, budget = r[:7]
        key = HEADS.get((appendix, head))
        if key is None:
            continue
        # Most-actual available.
        if account is not None:
            value, vintage = account, "account"
        elif revised is not None:
            value, vintage = revised, "revised"
        elif budget is not None:
            value, vintage = budget, "budget"
        else:
            continue
        try:
            value = float(value)
        except (TypeError, ValueError):
            continue
        data[state][key][year] = {"value": value, "vintage": vintage}
        n_kept += 1

    os.makedirs(OUT_DIR, exist_ok=True)
    payload = {
        "source": "RBI e-STATES (State Finances: A Study of Budgets of 2025-26)",
        "sourceFile": os.path.basename(SRC),
        "unit": "INR crore (nominal)",
        "heads": {v: k[1] for k, v in HEADS.items()},
        "note": "Value = Account > Revised > Budget (most-actual available); vintage recorded per cell.",
        "states": {s: dict(heads) for s, heads in data.items()},
    }
    with open(OUT, "w") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")

    print(f"scanned {n_rows} rows, kept {n_kept} cells")
    print(f"states: {len(data)}  heads: {len(HEADS)}")
    print(f"wrote {OUT}")
    # quick sanity: All States/UT total revenue latest few years
    allk = "All States/UT"
    if allk in data:
        tr = data[allk]["total_revenue"]
        for y in ["2022-2023", "2023-2024", "2024-2025", "2025-2026"]:
            if y in tr:
                print(f"  {allk} total_revenue {y}: {tr[y]['value']:.0f} ({tr[y]['vintage']})")


if __name__ == "__main__":
    main()
