#!/usr/bin/env python3
"""Check the built page's prose/chart pairing and visible source evidence."""

import json
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[3]
PAGE = ROOT / "dist/articles/who-dies-on-indias-roads/index.html"
OUT = ROOT / "data/audits/road-safety-2024/rendered-audit.json"
sections = [
    "Who is being killed on India's roads?",
    "Is the recorded toll falling?",
    "How old were the people who died?",
    "Where are the deaths recorded?",
    "How complete is the police record?",
    "What can these figures say about prevention?",
    "How to read these numbers: methodology and caveats",
]
charts = [
    "Two-wheeler users account for almost half of recorded road deaths",
    "The recorded death toll is still climbing",
    "Most recorded victims were between 18 and 45",
    "National and state highways account for nearly six in ten deaths",
]


def main():
    page = BeautifulSoup(PAGE.read_text(), "html.parser")
    headings = [x.get_text(" ", strip=True) for x in page.find_all(["h2", "h3"])]
    relevant = [x for x in headings if x in sections or x in charts]
    expected = [v for pair in zip(sections[:4], charts) for v in pair] + sections[4:]
    links = [x.get("href", "") for x in page.select(".evidence-grid a")]
    checks = {
        "seven_sections_four_charts_in_order": relevant == expected,
        "four_chart_notes": len(page.select(".chart-note")) == 4,
        "morth_original_pdf_linked": any("road-accidents-in-india-2024.pdf" in x for x in links),
        "who_original_pdf_linked": any("road-safety-2023-ind.pdf" in x for x in links),
        "road_user_figure_visible": "Two-wheeler users 81,780" in page.get_text(" ", strip=True),
        "who_interval_visible": "193,271 to 239,965" in page.get_text(" ", strip=True),
    }
    result = {"page": PAGE.relative_to(ROOT).as_posix(), "checks": checks,
              "sectionCount": len(sections), "chartCount": len(charts),
              "failures": [k for k, v in checks.items() if not v]}
    OUT.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    if result["failures"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
