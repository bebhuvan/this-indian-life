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
    ("Has India really ended extreme poverty?", ["Almost no Indian is below the lowest poverty line now. Four in five are below the higher one"]),
    ("What does $3 a day mean in rupees?", []),
    ("Did the whole world get here, or just India?", ["The world's fall in extreme poverty stalled after 2019. India's kept going"]),
    ("If almost nobody is that poor, why does it feel like most people are still struggling?",
     ["India has 18% of the world's people, 4% of its extremely poor, and 30% of everyone below $8.30"]),
    ("How close to the edge are most Indians?", ["A 10% fall in spending would push the share of Indians below $4.20 a day from 15% to 23%"]),
    ("If only 2% are poor, why do 80 crore people get free grain?", []),
    ("Who is still poor, and where?", ["47% of people in Jharkhand live below $4.20 a day. In Goa, under 3% do",
                                       "In every state, small children are more likely than the average resident to live in a poor household"]),
    ("Are our neighbours doing better?", ["India has less extreme poverty than Bangladesh or Indonesia, but more people below $8.30"]),
    ("Poor Indians work as many hours as anyone else. Why are they still poor?",
     ["Poor Indians work almost the same hours as everyone else", "Poor workers are more often self-employed and on farms"]),
    ("Hasn't the economy's growth reached workers' pay?", ["Since 2014-15, real GDP per person has grown 62%. A farm labourer's real wage has grown 9%"]),
    ("What would it take?", ["If poor households had better-off households' jobs and pay, the share below $8.30 would fall from 79% to 57%"]),
    ("Why doesn't India have an official poverty line any more?", []),
    ("Why did the World Bank's numbers jump in 2025?", ["New price data raised India's extreme poverty rate and lowered its $4.20 rate, from the same survey"]),
    ("Did the new survey make poverty look smaller?", ["Depending on the line and the method, India's 2022-23 poverty rate is anywhere from 2% to 26%"]),
    ("Is India really one of the most equal countries in the world?",
     ["Between the two newest surveys, the poorest tenth's spending grew fastest",
      "Since 1977, household spending in the national accounts has more than quadrupled. In the surveys, it has only doubled"]),
    ("Is being above the line the same as being well?", ["Money poverty is the smallest of these numbers"]),
    ("What would settle the argument?", []),
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
    "editorialPlan": {"audience": NOTES["audience"], "heroDescription": NOTES["heroDescription"], "selectedDataPoints": [],
                      "pullQuotes": NOTES["pullQuotes"], "glossaryBlocks": NOTES["boxes"]},
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
