#!/usr/bin/env python3
"""Derive per-GSDP and per-capita artifacts for q.states.demographic_finances.

Blends the e-STATES fiscal panel (Rs crore) with state GSDP / per-capita income /
derived population from the RBI Handbook of Statistics on Indian States 2024-25.
GSDP coverage is 2011-12 onward, so these series run 2011-12 to 2023-24 (the last
fiscal actuals); the long 1990- history stays on the internal-share charts.

Outputs: data/series/states.gsdp.*.json, states.income.*.json, states.percap.*.json
"""

import json
import os
import re

OUTDIR = "data/series"
FISCAL = "data/snapshots/estates/estates.parsed.json"
HANDBOOK = "data/snapshots/estates/rbi_handbook_states.json"
DEMOG = "data/snapshots/estates/demographics.mohfw2020.json"
PATHS_SRC = "data/series/energy.IN.state.carbon_intensity_2024.json"

RBI_URL = ("https://www.rbi.org.in/Scripts/AnnualPublications.aspx"
           "?head=Handbook+of+Statistics+on+Indian+States")
ESTATES_URL = ("https://www.rbi.org.in/Scripts/AnnualPublications.aspx"
               "?head=State+Finances+%3A+A+Study+of+Budgets")
FETCHED = "2026-06-16T00:00:00Z"
VIEWBOX = "0 0 740 820"
START, END = 2011, 2023      # GSDP starts 2011-12; fiscal actuals to 2023-24
LATEST = "2023"

CANON = {"NCT Delhi": "Delhi", "Jammu & Kashmir": "Jammu and Kashmir"}


def canon(n):
    return CANON.get(n, n)


def slug(n):
    return re.sub(r"[^a-z0-9]+", "_", n.lower()).strip("_")


def fy_start(fy):
    return str(fy).split("-")[0]


def series_artifact(iid, title, unit, obs, *, src="RBI e-STATES + Handbook of Statistics on Indian States",
                    url=RBI_URL, geo=None, meta=None):
    return {"schemaVersion": 1, "artifactType": "series", "indicatorId": iid, "title": title,
            "sourceId": "rbi-estates", "sourceIndicatorId": src, "sourceUrl": url, "unit": unit,
            "frequency": "annual", "geography": geo or {"type": "country", "id": "IN", "name": "India"},
            "dimensions": [], "fetchedAt": FETCHED, "observations": obs, "metadata": meta or {}}


def table_artifact(iid, title, unit, rows, *, src="RBI Handbook of Statistics on Indian States", url=RBI_URL):
    return {"schemaVersion": 1, "artifactType": "table", "indicatorId": iid, "title": title,
            "sourceId": "rbi-estates", "sourceIndicatorId": src, "sourceUrl": url, "unit": unit,
            "geography": {"type": "country", "id": "IN", "name": "India"},
            "dimensions": ["label", "value"], "fetchedAt": FETCHED, "rows": rows, "metadata": {}}


def choropleth_artifact(iid, title, unit, vmap, paths, *, src, url, vmin=None, vmax=None):
    vals = [v for v in vmap.values() if v is not None]
    return {"schemaVersion": 1, "artifactType": "choropleth", "indicatorId": iid, "title": title,
            "sourceId": "rbi-estates", "sourceIndicatorId": src, "sourceUrl": url, "unit": unit,
            "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
            "fetchedAt": FETCHED, "viewBox": VIEWBOX,
            "min": vmin if vmin is not None else (min(vals) if vals else 0),
            "max": vmax if vmax is not None else (max(vals) if vals else 1),
            "regions": [{"name": n, "value": vmap.get(n), "path": p} for n, p in sorted(paths.items())],
            "metadata": {}}


def write(a):
    p = os.path.join(OUTDIR, f"{a['indicatorId']}.json")
    with open(p, "w") as f:
        json.dump(a, f, indent=2)
        f.write("\n")
    return a["indicatorId"]


def main():
    fiscal = json.load(open(FISCAL))["states"]
    hb = json.load(open(HANDBOOK))["states"]
    demog = json.load(open(DEMOG))
    paths = {r["name"]: r["path"] for r in json.load(open(PATHS_SRC))["regions"]}

    groups = {g: [canon(s) for s in demog["groups_2026"][g]]
              for g in ("youthful", "intermediate", "ageing")}
    major = [canon(s) for s in demog["share_60plus_pct"] if s != "India"]
    raw_by_canon = {canon(r): r for r in fiscal if canon(r) in major}

    GLAB = {"youthful": "Youthful states", "intermediate": "Intermediate states", "ageing": "Ageing states"}
    GCOL = {"youthful": "#1f9e8a", "intermediate": "#d99a1f", "ageing": "#c2476b"}

    def fmap(raw, head):
        return {fy_start(fy): c["value"] for fy, c in fiscal[raw].get(head, {}).items()}

    def gsdp_of(c, yr):
        return hb.get(c, {}).get("gsdp_crore", {}).get(yr)

    def pop_of(c, yr):
        return hb.get(c, {}).get("population", {}).get(yr)

    written = []

    # ---- group per-GSDP multiLine series ----
    def group_gsdp_series(group, num_heads):
        out = {}
        for y in range(START, END + 1):
            yr = str(y)
            num = den = 0.0
            ok = False
            for c in groups[group]:
                raw = raw_by_canon.get(c)
                g = gsdp_of(c, yr)
                if not raw or not g:
                    continue
                vals = [fmap(raw, h).get(yr) for h in num_heads]
                if any(v is None for v in vals):
                    continue
                num += sum(vals)
                den += g
                ok = True
            if ok and den:
                out[yr] = round(100 * num / den, 2)
        return out

    GSDP_METRICS = {
        "own_tax_gsdp": ("own-tax revenue as % of GSDP", ["own_tax"]),
        "rev_exp_gsdp": ("revenue spending as % of GSDP", ["total_rev_exp"]),
        "committed_gsdp": ("interest + pensions as % of GSDP", ["interest", "pensions"]),
    }
    for metric, (desc, heads) in GSDP_METRICS.items():
        for g in ("youthful", "intermediate", "ageing"):
            ser = group_gsdp_series(g, heads)
            obs = [{"date": y, "value": v} for y, v in sorted(ser.items())]
            written.append(write(series_artifact(
                f"states.gsdp.{metric}.{g}", f"{GLAB[g]}: {desc}", "% of GSDP", obs,
                meta={"color": GCOL[g]})))

    # ---- per-capita income choropleth (2023-24) ----
    inc = {c: hb.get(c, {}).get("per_capita_nsdp_inr", {}).get(LATEST) for c in major}
    inc = {c: (round(v / 1000) if v else None) for c, v in inc.items()}  # Rs thousands
    written.append(write(choropleth_artifact(
        "states.income.per_capita_2024", "How rich each state actually is",
        "per-capita income, Rs thousand (2023-24)", inc, paths,
        src="RBI Handbook (Table 19, per-capita NSDP, current prices)", url=RBI_URL,
        vmin=50, vmax=350)))

    # NOTE: a fiscal-deficit/GSDP map was considered but dropped. e-STATES
    # Appendix-4 "Overall Surplus/Deficit" is the post-borrowing cash balance,
    # NOT the gross fiscal deficit (which is the pre-borrowing financing need),
    # so it cannot be presented as GFD without misleading.

    # ---- per-capita spending tableBars (2023-24) ----
    def percap_rows(head):
        rows = []
        for c in major:
            raw = raw_by_canon.get(c)
            pop = pop_of(c, LATEST)
            if not raw or not pop:
                continue
            v = fmap(raw, head).get(LATEST)
            if v is None:
                continue
            rows.append({"label": c, "value": round(v * 1e7 / pop)})   # crore -> Rs, / persons
        rows.sort(key=lambda r: r["value"], reverse=True)
        return rows

    written.append(write(table_artifact(
        "states.percap.rev_exp_2024", "How much government each citizen gets",
        "revenue spending per person, Rs (2023-24)", percap_rows("total_rev_exp"),
        src="RBI e-STATES (Appendix-2) per derived population")))
    written.append(write(table_artifact(
        "states.percap.health_2024", "Health spending per person",
        "medical & public-health spending per person, Rs (2023-24)", percap_rows("health"),
        src="RBI e-STATES (Appendix-2) per derived population")))

    print(f"wrote {len(written)} artifacts")
    # sanity
    ot = json.load(open(f"{OUTDIR}/states.gsdp.own_tax_gsdp.ageing.json"))["observations"]
    print("  own_tax/GSDP ageing:", ot[0], "...", ot[-1])
    print("  income map sample: Kerala", inc.get("Kerala"), "Bihar", inc.get("Bihar"), "(Rs thousand)")
    rr = json.load(open(f"{OUTDIR}/states.percap.rev_exp_2024.json"))["rows"]
    print("  rev-exp/person top3:", [(r["label"], r["value"]) for r in rr[:3]], "bottom2:", [(r["label"], r["value"]) for r in rr[-2:]])


if __name__ == "__main__":
    main()
