#!/usr/bin/env python3
"""Assemble the explanation for q.econ.innovation from edited prose and the evidence packet.

Prose: data/prose/q.econ.innovation.md (edit it as markdown, not here).
Evidence: data/explanations/en/q.econ.innovation.evidence.json
  (node scripts/generate-explanations.mjs --questions=q.econ.innovation --dry-run)
Run: python3 scripts/stories/innovation-india/build_explanation.py
"""
import datetime, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[3]
QID = "q.econ.innovation"
ev = json.load(open(ROOT / f"data/explanations/en/{QID}.evidence.json"))
BODY = (ROOT / f"data/prose/{QID}.md").read_text().strip()
CHART = {c["title"]: c["chartId"] for c in ev["plannedCharts"]}


def cid(title):
    if title not in CHART:
        raise SystemExit(f"no planned chart titled {title!r}")
    return CHART[title]


# Section -> charts it discusses, in page order. Prose-only sections bind none.
SECTIONS = [
    ("What does 38th actually measure?", ["India climbed from the bottom half of the index to its top third"]),
    ("Has India always got more out than it puts in?", ["India's outputs have outranked its inputs in every edition since 2011"]),
    ("How exact is a rank?", ["India's 38th could be anywhere from 34th to 39th"]),
    ("Did India really climb 43 places?", []),
    ("Where is India world-class, and where is it near the bottom?", ["India is in the world's top 20 on 15 measures, and below 100th on five"]),
    ("Where does India's lead come from?", ["Three-quarters of India's lead over a typical economy comes from its outputs"]),
    ("What has changed since 2022?", ["Since 2022, India has risen on both output pillars and slipped on four of five input pillars"]),
    ("Is India big, or is it advanced?", ["In the world's top ten by total, far lower per person"]),
    ("Is that good for a country of India's income?", ["For its income, India scores well above the line"]),
    ("How current is the data?", ["Five of India's research figures in the index still describe 2020"]),
    ("How much does India spend on research?", ["Even on its new survey, India spends less of its GDP on research than most peers",
                                                 "India has fewer researchers per person than any peer shown",
                                                 "India's R&D share jumped in 2021-22, the year the survey changed"]),
    ("What is behind the patent boom?", ["Universities now file more than half of India's patent applications"]),
    ("Is India's IT strength innovation?", ["India's share of the world's ICT services exports peaked in 2012"]),
    ("Which Indian cities count as innovation clusters?", ["India's four clusters are large, but spread over many people"]),
    ("Which states file the most patents?", ["Tamil Nadu files 80 times as many patents per person as Bihar"]),
    ("How has India moved against its peers?", ["Among eleven peers, India moved from fourth to third since 2022"]),
    ("Is Viet Nam's path the same as India's?", ["India leads Viet Nam on knowledge outputs; Viet Nam leads on business sophistication"]),
    ("So, how innovative is India?", []),
    ("How to read these numbers: methodology and caveats", []),
]

# --- integrity checks on the prose -------------------------------------------
heads = re.findall(r"^## (.+)$", BODY, re.M)
assert heads == [h for h, _ in SECTIONS], f"heading mismatch:\n{heads}"
assert BODY.startswith("## "), "body must open with an H2"
assert BODY.count("\n## ") == len(SECTIONS) - 1, "heading/paragraph structure broken"
for bad in ("—", "PATENTS_SECTION", "STATES_SECTION", "PATENTS_CAVEATS", "TODO"):
    assert bad not in BODY, f"prose still contains {bad!r}"
planned = set(CHART.values())
bound = [cid(t) for _, ts in SECTIONS for t in ts]
assert sorted(bound) == sorted(planned), f"charts not bound exactly once: {set(planned) ^ set(bound)}"

E = json.loads((ROOT / "scripts/stories/innovation-india/chart_explainers.json").read_text())
missing = [t for t in CHART if t not in E]
assert not missing, f"no explainer for {missing}"
for t, e in E.items():
    for k in ("takeaway", "detail", "whyShowThis", "howToRead", "mistakeToAvoid", "mobileNote"):
        assert e.get(k), f"{t}: missing {k}"
        assert "—" not in e[k], f"{t}: em dash in {k}"

NOTES = json.loads((ROOT / "scripts/stories/innovation-india/notes.json").read_text())

doc = {
    "schemaVersion": 1,
    "questionId": QID,
    "status": "ready",
    "short": NOTES["short"],
    "macha": NOTES["macha"],
    "article": {"title": NOTES["title"], "standfirst": NOTES["standfirst"], "bodyMarkdown": BODY},
    "chartExplainers": [{"visualId": CHART[t], "title": t, **E[t]} for t in CHART],
    "sectionVisualMap": [{"heading": h, "visualIds": [cid(t) for t in ts]} for h, ts in SECTIONS],
    "sourceNotes": [],      # pinned in scripts/registry/source-notes.mjs
    "furtherReading": [],   # pinned in scripts/registry/source-notes.mjs
    "caveats": NOTES["caveats"],
    "lockedNumbersUsed": NOTES["lockedNumbersUsed"],
    "qualityFlags": [],
    "lastReviewed": NOTES["lastReviewed"],
    "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
    "model": "hand-written",
    "generationPasses": [{"name": "editorial-assembly", "note": "Prose written against the story's audited artifacts; every figure traced in data/audits/innovation-india/claim-ledger.json."}],
    "evidence": ev,
}
out = ROOT / f"data/explanations/en/{QID}.json"
out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
# The verified source lists live in scripts/registry/source-notes.mjs; copy them in.
import subprocess
subprocess.run(["python3", str(ROOT / "scripts/apply-pinned-references.py")], check=True, cwd=ROOT, capture_output=True)
print("wrote", out.relative_to(ROOT), "| words:", len(BODY.split()), "| sections:", len(heads), "| charts:", len(bound))
