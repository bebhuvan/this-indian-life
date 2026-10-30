#!/usr/bin/env python3
"""Assemble the explanation for q.econ.poverty_debate from edited prose and the evidence packet."""

import datetime
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
QID = "q.econ.poverty_debate"
ev = json.load(open(ROOT / f"data/explanations/en/{QID}.evidence.json"))
BODY = (ROOT / f"data/prose/{QID}.md").read_text().strip()
CHART = {c["title"]: c["chartId"] for c in ev["plannedCharts"]}


def cid(title):
    if title not in CHART:
        raise SystemExit(f"no planned chart titled {title!r}")
    return CHART[title]


SECTIONS = [
    (
        "Why is 'Has India ended extreme poverty?' the wrong question to ask in 2026?",
        [
            "India largely cleared the $3/day floor by 2024, yet 78.8% of the population still lives below the $8.30/day threshold",
            "A hypothetical 10% real consumption loss lifts the $4.20 poverty share from 14.9% to 23.2%",
            "Among Indians below $8.30, consumption averages 34.1% short of the line",
            "The Prosperity Gap is 6.72 in Jharkhand and 3.16 in Goa",
            "Young children are more likely to live below $8.30 a day in every state and union territory",
        ],
    ),
    (
        "How did a 2021 PPP price revision and a new survey questionnaire rewrite the numbers?",
        [
            "The 2021 PPP revision paradox: Updating global prices raised India's 2023 extreme poverty rate to 2.57% while cutting $4.20 poverty to 16.12%",
            "Depending on survey adjustment and poverty line, India's 2022-23 poverty rate was anywhere between 2.35% and 25.9%",
            "Free public foodgrain and welfare items raise measured rural spending by 3.0%, against 1.2% in urban India",
            "The poorest surveyed tenth gained 13.1% in real consumption between the two comparable HCES rounds",
            "National Accounts spending grew 4.49x since 1977 while survey mean grew 2.09x",
        ],
    ),
    (
        "Why do working Indians stay poor even when they work 44 hours a week?",
        [
            "Between 2003 and 2024, adult employment rates in poor Indian households fell to 58.3% while rising to 57.6% among the non-poor",
            "Paid employees below $3/day work 44.1 hours a week, against 44.9 above the line",
            "World Bank simulation: Closing India's employment and worker earnings gaps cuts $8.30 poverty by 22.2 percentage points",
        ],
    ),
    (
        "What questions about Indian poverty can still not be answered?",
        [
            "Monetary poverty and deprivation measure different things: 35.5% of children were stunted in NFHS-5",
            "India has lower $3 poverty than Bangladesh and Indonesia, and higher poverty at $8.30",
        ],
    ),
    ("How to read these numbers: methodology and caveats", []),
]

heads = re.findall(r"^## (.+)$", BODY, re.M)
assert heads == [h for h, _ in SECTIONS], f"heading mismatch:\n{heads}"
assert BODY.startswith("## "), "body must open with an H2"
assert BODY.count("\n## ") == len(SECTIONS) - 1, "heading/paragraph structure broken"
for bad in ("—", "TODO"):
    assert bad not in BODY, f"prose still contains {bad!r}"

planned = set(CHART.values())
bound = [cid(t) for _, ts in SECTIONS for t in ts]
assert sorted(bound) == sorted(planned), f"charts not bound exactly once: {set(planned) ^ set(bound)}"

E = json.loads((ROOT / "scripts/stories/poverty-debate/chart_explainers.json").read_text())
missing = [t for t in CHART if t not in E]
assert not missing, f"no explainer for {missing}"
for t, e in E.items():
    for k in ("takeaway", "detail", "whyShowThis", "howToRead", "mistakeToAvoid", "mobileNote"):
        assert e.get(k), f"{t}: missing {k}"
        assert "—" not in e[k], f"{t}: em dash in {k}"

NOTES = json.loads((ROOT / "scripts/stories/poverty-debate/notes.json").read_text())

doc = {
    "schemaVersion": 1,
    "questionId": QID,
    "status": "ready",
    "short": NOTES["short"],
    "macha": NOTES["macha"],
    "article": {"title": NOTES["title"], "standfirst": NOTES["standfirst"], "bodyMarkdown": BODY},
    "chartExplainers": [{"visualId": CHART[t], "title": t, **E[t]} for t in CHART],
    "sectionVisualMap": [{"heading": h, "visualIds": [cid(t) for t in ts]} for h, ts in SECTIONS],
    "sourceNotes": [],
    "furtherReading": [],
    "caveats": NOTES["caveats"],
    "lockedNumbersUsed": NOTES["lockedNumbersUsed"],
    "qualityFlags": [],
    "lastReviewed": NOTES["lastReviewed"],
    "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
    "model": "hand-written",
    "generationPasses": [
        {
            "name": "editorial-assembly",
            "note": "Prose written against the story's audited artifacts; every figure traced in data/audits/poverty-debate/claim-ledger.json.",
        }
    ],
    "evidence": ev,
}

out = ROOT / f"data/explanations/en/{QID}.json"
out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
subprocess.run(["python3", str(ROOT / "scripts/apply-pinned-references.py")], check=True)
print(f"wrote {out.relative_to(ROOT)} | words: {len(BODY.split())} | sections: {len(SECTIONS)} | charts: {len(bound)}")
