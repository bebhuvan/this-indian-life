"""
Fix the repetitive AI-voice issues in q.econ.asia_divergence bodyMarkdown:
1. Replace "One visible pattern is that" with varied natural transitions
2. Remove "through-line" scaffolding from reader-facing prose
3. Reduce "visible" overuse
4. Fix truncated caveats
5. Add glossary blocks
6. Add pull quotes
"""

import json
import re
import sys
from itertools import cycle

JSON_PATH = "data/explanations/en/q.econ.asia_divergence.json"

# Load the explanation
with open(JSON_PATH, "r") as f:
    data = json.load(f)

body = data["article"]["bodyMarkdown"]
original_body = body


# ─── Helper: replace a pattern preserving the next word's capitalization ───
# Deterministic cycling through transition phrases so the output is reproducible
_opw_cycle = cycle(
    [
        "The data shows",
        "What stands out is",
        "Look at the numbers, and",
        "The record shows",
        "Across every measure,",
        "The pattern is consistent:",
        "Strip away the noise and",
        "The cross-country comparison tells a blunt story:",
        "The picture that emerges is",
        "A thread runs through the numbers:",
    ]
)

_lower_opw_cycle = cycle(
    [
        "the data shows",
        "what stands out is",
        "the record shows",
        "across every measure,",
        "the pattern is consistent:",
    ]
)


def replace_visible_pattern_line(line):
    """Rewrite lines that use 'One visible pattern' as a crutch."""
    if "One visible pattern" in line:
        line = re.sub(r"One visible pattern is that\b", next(_opw_cycle), line)
    return line


# ─── 1. Process bodyMarkdown line by line ───
lines = body.split("\n")
new_lines = []

throughline_replacements = {
    "the through-line describes": "the sequence laid out above",
    "the through-line notes": "the data above shows",
    "the through-line highlights": "the pattern above highlights",
    "the through-line": "the sequence",
    "through-line": "sequence",
}

# Track what we changed
opw_count = 0
tl_count = 0
visible_count = 0

for i, line in enumerate(lines):
    original_line = line

    # Skip non-prose lines
    if (
        line.startswith("## ")
        or line.startswith("|")
        or line.startswith("> ")
        or line.startswith("- ")
        or line.startswith("* ")
    ):
        new_lines.append(line)
        continue

    if not line.strip():
        new_lines.append(line)
        continue

    # 1a. Fix "One visible pattern is that" (case-sensitive)
    if "One visible pattern" in line:
        opw_count += 1
        line = replace_visible_pattern_line(line)

    # 1b. Fix "one visible pattern" lowercase
    if "one visible pattern" in line:
        line = re.sub(r"one visible pattern is that\b", next(_lower_opw_cycle), line)

    # 1c. "One visible outcome is that" / "One visible pattern" without "is that"
    line = re.sub(r"One visible outcome is that\b", "The outcome is", line)
    line = re.sub(r"One visible pattern", "", line)

    # 2. Fix "through-line" scaffolding
    for old, new in throughline_replacements.items():
        if old in line:
            tl_count += 1
            line = line.replace(old, new)

    # 3. Reduce "visible" overuse - replace some instances
    # "the visible outcome" → "the outcome"
    if "the visible outcome" in line:
        visible_count += 1
        line = line.replace("the visible outcome", "the outcome")

    # "visible differences" / "visible gap" / "visible block" → drop "visible"
    for phrase in [
        "visible differences",
        "visible gap",
        "visible block",
        "visible reason",
        "visible pattern",
        "the visible pattern",
    ]:
        replacement = phrase.replace("visible ", "").replace(
            "the pattern", "the pattern"
        )
        if phrase in line:
            visible_count += 1
            # Don't replace if it's part of a larger rephrase we already did
            if "the data points" not in line:
                line = line.replace(phrase, replacement)

    new_lines.append(line)

body = "\n".join(new_lines)

# ─── Post-processing: fix any broken capitalization ───
# If a sentence now starts with lowercase after our replacements
body = re.sub(r"\. ([a-z])", lambda m: ". " + m.group(1).upper(), body)

# Verify no double spaces created
body = re.sub(r"  +", " ", body)

print(f"=== Rewrite stats ===")
print(f"'One visible pattern' instances replaced: {opw_count}")
print(f"'through-line' instances replaced: {tl_count}")
print(f"'visible' overuse reduced: {visible_count} spots")
print(f"Body length: {len(body)} chars (was {len(original_body)})")

# ─── Fix truncated caveats ───
caveats = data.get("caveats", [])
if caveats:
    for i, c in enumerate(caveats):
        if "Set again" in c:
            print(f"\nFixing truncated caveat #{i + 1}: '{c[-50:]}'")
            caveats[i] = (
                "This page measures India mainly against East Asia's successes (South Korea, Taiwan, China, Vietnam), which are the rare winners of the development race, not a baseline every country reaches. Set against its own South Asian neighbourhood, India looks less like a failure than the stronger half of a hard pack."
            )
        if "now-wob" in c:
            print(f"Fixing truncated caveat #{i + 1}: '{c[-50:]}'")
            caveats[i] = (
                "China, the headline success on this page, is itself slowing sharply in the 2020s, with a property crash, deflation and a shrinking workforce, so the convergence comparison freezes a moving and now-wobbling target."
            )
    data["caveats"] = caveats

# ─── Add glossary blocks ───
# Technical terms the article uses without defining
glossary = data.get("editorialPlan", {}).get("glossaryBlocks", [])
if not glossary:
    new_glossary = [
        {
            "term": "PPP (purchasing-power parity)",
            "definition": "An adjustment that makes a rupee and a dollar buy comparable baskets of goods, so incomes can be compared across countries without exchange-rate distortions. It is a modelled estimate, not a market rate.",
        },
        {
            "term": "value added",
            "definition": "The value a sector creates, calculated as its output minus the cost of inputs it buys from others. It avoids double-counting and shows what each part of the economy genuinely contributes to GDP.",
        },
        {
            "term": "total factor productivity (TFP)",
            "definition": "A measure of how efficiently an economy turns labour and capital into output. Rising TFP means a country is getting smarter about production, not just piling up more workers and machines. It is a residual estimate, not a directly observed number.",
        },
        {
            "term": "Economic Complexity Index (ECI)",
            "definition": "A ranking of how diverse and sophisticated a country's exports are. A higher score means the export basket contains more products that few other countries can make. It captures knowhow, not just volume.",
        },
        {
            "term": "GVC (global value chain)",
            "definition": "The cross-border production network where a good is designed in one country, assembled from parts made in several others, and sold worldwide. Foreign value added in exports measures how deeply a country is plugged into these chains.",
        },
        {
            "term": "demographic dividend",
            "definition": "The boost to growth that comes when the share of working-age people in a population rises relative to children and the elderly. It is potential, not destiny: it only pays off if those workers find productive jobs.",
        },
        {
            "term": "Human Development Index (HDI)",
            "definition": "A composite score from 0 to 1 that combines life expectancy, years of schooling, and income per person into a single measure of wellbeing beyond just GDP.",
        },
    ]
    data["editorialPlan"]["glossaryBlocks"] = new_glossary
    print(f"\nAdded {len(new_glossary)} glossary blocks")

# ─── Add pull quotes ───
pull_quotes = data.get("editorialPlan", {}).get("pullQuotes", [])
if not pull_quotes:
    new_pullquotes = [
        "India's manufacturing share of GDP barely moved over six decades. It was about 15% in the early 1960s and stood at roughly 13% by 2022.",
        "At 6% growth, incomes double every 12 years. At 1.4%, they take nearly 50.",
        "India's top 10% saw their share of pre-tax national income jump from about 38% to nearly 59%.",
        "Only about 32% of working-age women in India are in the labor force, roughly half the share in China, South Korea, and Vietnam.",
        "An Indian worker on average had about $69,000 worth of physical capital. A Korean worker had nearly $397,000.",
        "If India maintains its recent growth rate, it reaches China's current income level only around 2043.",
    ]
    data["editorialPlan"]["pullQuotes"] = new_pullquotes
    print(f"Added {len(new_pullquotes)} pull quotes")

# ─── Add heroDescription ───
if not data["editorialPlan"].get("heroDescription"):
    data["editorialPlan"]["heroDescription"] = (
        "A seven-decade data investigation into why India and its Asian neighbours "
        "started at the same income in 1950 but ended worlds apart. Working through "
        "the causal chain — health, schooling, investment, factories, exports, and "
        "the state — this is the most complete single-page answer a curious Indian "
        "can read on the great Asian divergence."
    )

# ─── Validate ───
# Check no markdown structure was broken
heading_count = body.count("\n## ")
original_heading_count = original_body.count("\n## ")
if heading_count != original_heading_count:
    print(f"\n❌ HEADING COUNT MISMATCH! {heading_count} vs {original_heading_count}")
    print("Aborting — do not write the file.")
    sys.exit(1)
else:
    print(f"\n✓ Heading count preserved: {heading_count}")

# Check for broken markdown
if "\n##" in body and body.count("## ") != body.count("\n## "):
    # Some ## might be at start of file
    pass  # This is fine

# Count remaining "One visible pattern" instances
remaining_opw = body.count("One visible pattern")
print(f"Remaining 'One visible pattern' instances: {remaining_opw}")
remaining_tl = body.count("through-line")
print(f"Remaining 'through-line' instances: {remaining_tl}")

# Write back
data["article"]["bodyMarkdown"] = body

with open(JSON_PATH, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✓ Wrote {JSON_PATH}")
print("Done.")
