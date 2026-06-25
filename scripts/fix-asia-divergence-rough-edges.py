"""Fix remaining bad transitions — round 2 with exact text matches."""

import json

JSON_PATH = "data/explanations/en/q.econ.asia_divergence.json"

with open(JSON_PATH, "r") as f:
    data = json.load(f)

body = data["article"]["bodyMarkdown"]

fixes = [
    # "Look at the numbers, and" → remove (3 instances)
    (
        "Look at the numbers, and East Asian states invested in basic health, clean water, and child survival long before they were rich, and this became the foundation of their human capital.",
        "East Asian states invested in basic health, clean water, and child survival long before they were rich, and this became the foundation of their human capital.",
    ),
    (
        "Look at the numbers, and the East Asian economies that embraced deep trade integration and built competitive manufacturing sectors reaped enormous gains in world market share.",
        "The East Asian economies that embraced deep trade integration and built competitive manufacturing sectors reaped enormous gains in world market share.",
    ),
    (
        "Look at the numbers, and the high-performing East Asian economies transformed the way they produced, not just how much they produced, and that transformation shows up in sharply rising productivity.",
        "The high-performing East Asian economies transformed the way they produced, not just how much they produced, and that transformation shows up in sharply rising productivity.",
    ),
    # "Strip away the noise and" → remove (2 instances)
    (
        "Strip away the noise and East Asian economies deliberately climbed the technology ladder by funding innovation to move from imitating to inventing, enabling the sophisticated exports the pattern above highlights.",
        "East Asian economies deliberately climbed the technology ladder by funding innovation to move from imitating to inventing, enabling the sophisticated exports the data highlights.",
    ),
    (
        "Strip away the noise and India\u2019s decline was real but less complete, and the country took longer.",
        "India\u2019s decline was real but less complete, and the country took longer.",
    ),
    # "Through-line:" → remove
    (
        "Through-line: manufacturing stayed near 15% of GDP for sixty years, while East Asian nations pushed it much higher and plugged into global value chains.",
        "Manufacturing stayed near 15% of GDP for sixty years, while East Asian nations pushed it much higher and plugged into global value chains.",
    ),
]

changes = 0
for old, new in fixes:
    if old in body:
        body = body.replace(old, new)
        changes += 1
    else:
        print(f"NOT FOUND: {old[:80]}...")

print(f"Applied {changes}/{len(fixes)} fixes")

# Final verification
remaining_issues = []
checks = [
    ("\nLook at the numbers, and", "Look at the numbers (bad transition)"),
    ("\nStrip away the noise and", "Strip away the noise (bad transition)"),
    ("Through-line", "Through-line"),
    ("\n is the", "sentence fragment starting with 'is'"),
]
for pattern, label in checks:
    count = body.count(pattern)
    if count:
        remaining_issues.append(f"{label}: {count} instances")
        print(f"WARNING: {label} — {count} remaining")

if not remaining_issues:
    print("All issues resolved!")

data["article"]["bodyMarkdown"] = body

with open(JSON_PATH, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Done.")
