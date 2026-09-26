#!/usr/bin/env python3
"""Check the built FDI page's prose/chart bindings after npm run build."""
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[3]
doc = json.loads((ROOT / "data/explanations/en/q.econ.fdi_development.json").read_text())
html = ROOT / "dist/articles/did-foreign-money-build-india/index.html"
article = BeautifulSoup(html.read_text(), "html.parser").select_one(".article-body.story-body")
if article is None:
    raise SystemExit("article body absent from built page")
headings = [(h.name, h.get_text(" ", strip=True)) for h in article.find_all(["h2", "h3"])]
actual = []
for i, (tag, title) in enumerate(headings):
    if tag != "h3":
        continue
    next_chart = headings[i + 1][1] if i + 1 < len(headings) and headings[i + 1][0] == "h2" else None
    actual.append((title, next_chart))
slug = lambda text: re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))
expected_map = {row["heading"]: row["visualId"] for row in doc["sectionVisualMap"]}
errors = []
for section, chart in actual:
    wanted = expected_map.get(section)
    if wanted != (slug(chart) if chart else None):
        errors.append({"section": section, "expected": wanted, "rendered": chart})
if len(actual) != 16 or len([c for _, c in actual if c]) != 15:
    errors.append({"section_count": len(actual), "chart_count": len([c for _, c in actual if c])})
if {slug(c) for _, c in actual if c} != {e["visualId"] for e in doc["chartExplainers"]}:
    errors.append({"chart_explainer_binding": "rendered titles and explainer IDs differ"})
print(json.dumps({"sections": len(actual), "charts": len([c for _, c in actual if c]), "errors": errors}, indent=2))
raise SystemExit(1 if errors else 0)
