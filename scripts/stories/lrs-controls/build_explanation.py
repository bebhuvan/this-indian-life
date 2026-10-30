#!/usr/bin/env python3
"""Assemble the explanation for q.econ.lrs_controls from edited prose and the evidence packet."""

import datetime
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
QID = "q.econ.lrs_controls"
ev = json.load(open(ROOT / f"data/explanations/en/{QID}.evidence.json"))
BODY = (ROOT / f"data/prose/{QID}.md").read_text().strip()
CHART = {c["title"]: c["chartId"] for c in ev["plannedCharts"]}


def cid(title):
    if title not in CHART:
        raise SystemExit(f"no planned chart titled {title!r}")
    return CHART[title]


SECTIONS = [
    (
        "What is RBI reviewing, and how big is LRS?",
        [
            "Resident remittances hit $2.74 billion in August 2026 after two decades of step-changes",
            "Resident LRS outflows were $29 billion in FY26; inward private transfers were $155 billion",
        ],
    ),
    (
        "What do the first six months of RBI's travel breakdown reveal?",
        [
            "Education and other travel account for 97.6% of LRS travel",
            "Two education-related LRS lines totalled $1.05 billion in August 2026",
        ],
    ),
    (
        "Why are foreign equity and deposit outflows surging in FY27?",
        [
            "Capital transfers added $1.03 billion while other LRS purposes fell by $491 million",
            "Resident investment in foreign equities, deposits, and property has more than doubled since FY22 to $3.93 billion",
        ],
    ),
    (
        "What do the tax rules and annual calendar mean for a remitter?",
        [
            "March takes an outsized share of annual capital transfers",
            "After the TCS changes, family transfers were lower while travel and equity flows were higher",
            "Rupee depreciation quietly expanded the $250,000 LRS limit from Rs 1.59 crore in 2015 to Rs 2.38 crore by August 2026",
        ],
    ),
    ("What can LRS rules fix, and what do the numbers leave out?", []),
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

E = json.loads((ROOT / "scripts/stories/lrs-controls/chart_explainers.json").read_text())
missing = [t for t in CHART if t not in E]
assert not missing, f"no explainer for {missing}"
for t, e in E.items():
    for k in ("takeaway", "detail", "whyShowThis", "howToRead", "mistakeToAvoid", "mobileNote"):
        assert e.get(k), f"{t}: missing {k}"
        assert "—" not in e[k], f"{t}: em dash in {k}"

NOTES = json.loads((ROOT / "scripts/stories/lrs-controls/notes.json").read_text())

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
            "note": "Prose written against the story's audited artifacts; every figure traced in data/audits/lrs-controls/claim-ledger.json.",
        }
    ],
    "evidence": ev,
}

out = ROOT / f"data/explanations/en/{QID}.json"
out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
subprocess.run(["python3", str(ROOT / "scripts/apply-pinned-references.py")], check=True, cwd=ROOT, capture_output=True)
print("wrote", out.relative_to(ROOT), "| words:", len(BODY.split()), "| sections:", len(heads), "| charts:", len(bound))
