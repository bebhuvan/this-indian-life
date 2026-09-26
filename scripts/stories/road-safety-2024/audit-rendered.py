#!/usr/bin/env python3
"""Check the built page's prose/chart pairing and visible source evidence."""

import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[3]
PAGE = ROOT / "dist/articles/who-dies-on-indias-roads/index.html"
OUT = ROOT / "data/audits/road-safety-2024/rendered-audit.json"
explanation = json.loads((ROOT / "data/explanations/en/q.health.road_safety_2024.json").read_text())
sections = [line[3:] for line in explanation["article"]["bodyMarkdown"].splitlines() if line.startswith("## ")]
charts = [item["title"] for item in explanation["chartExplainers"]]


def main():
    page = BeautifulSoup(PAGE.read_text(), "html.parser")
    headings = [x.get_text(" ", strip=True) for x in page.find_all(["h2", "h3"])]
    relevant = [x for x in headings if x in sections or x in charts]
    expected = [v for pair in zip(sections[:len(charts)], charts) for v in pair] + sections[len(charts):]
    links = [x.get("href", "") for x in page.select(".evidence-grid a")]
    point = page.select_one(".data-pull")
    openings = [explanation["short"]["dek"], explanation["short"]["body"],
                explanation["macha"]["body"], explanation["article"]["standfirst"]]
    first_body_paragraph = explanation["article"]["bodyMarkdown"].split("\n\n", 2)[1]
    ministry = "Ministry of Road Transport and Highways"
    report = "Road Accidents in India 2024"
    checks = {
        "sections_and_charts_in_order": relevant == expected,
        "chart_notes_complete": len(page.select(".chart-note")) == len(charts),
        "morth_original_pdf_linked": any("road-accidents-in-india-2024.pdf" in x for x in links),
        "who_original_pdf_linked": any("road-safety-2023-ind.pdf" in x for x in links),
        "road_user_figure_visible": "Two-wheeler users 81,780" in page.get_text(" ", strip=True),
        "who_interval_visible": "193,271 to 239,965" in page.get_text(" ", strip=True),
        "accident_unit_visible": "reported accidents" in page.get_text(" ", strip=True).lower(),
        "each_opening_names_ministry_and_report": all(ministry in opening and report in opening for opening in openings),
        "no_literal_markdown_in_openings": all("*" not in opening for opening in openings),
        "first_body_paragraph_names_ministry_and_report": ministry in first_body_paragraph and report in first_body_paragraph,
        "first_body_acronym_expanded": bool(re.search(r"Ministry of Road Transport and Highways \(MoRTH\)", first_body_paragraph)),
        "who_chart_subtitle_expands_name": "World Health Organization (WHO)" in page.get_text(" ", strip=True),
        "point_card_names_measure_place_year": point is not None and "1,77,175" in point.get_text(" ", strip=True) and "People killed in road crashes in India in 2024" in point.get_text(" ", strip=True),
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
