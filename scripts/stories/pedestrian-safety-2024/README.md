# Pedestrian safety 2024 article handoff

Article: `q.health.pedestrian_safety_2024`, route `/articles/how-safe-is-it-to-walk-in-india/`.

This is a separate, pedestrian-focused companion to the wider 2024 road-death article. Eight charts examine the national toll, the direct 2023 comparison, victim ages and sex, pedestrians' share of deaths within each age group, impacting vehicles, the ten largest state totals, and national highways versus all other roads. MoRTH's *Road Accidents in India 2024* is the numerical source. The article connects that toll to the Supreme Court's 19 June 2026 ruling in *Maniyar Iliyaz v. P. Ayyappan*, which recognised walking on demarcated footpaths as a fundamental right and set out local-authority duties. The WHO pedestrian-safety manual supplies general intervention evidence, not an India-specific observation or risk denominator.

## Reproduce

Use Python with PyMuPDF and BeautifulSoup, plus Node 22 or newer:

```bash
python3 scripts/stories/pedestrian-safety-2024/ingest.py
python3 scripts/stories/pedestrian-safety-2024/audit.py
python3 scripts/stories/pedestrian-safety-2024/build-explanation.py
node scripts/validate-data-artifacts.mjs --manifest=data/catalog/pedestrian-safety-2024-manifest.json
node scripts/validate-explanations.mjs --question=q.health.pedestrian_safety_2024
npm run build
python3 scripts/stories/pedestrian-safety-2024/audit-rendered.py
```

The source manifest at `data/raw/pedestrian-safety-2024/manifest.json` records URLs, retrieval date and SHA-256 hashes. The original MoRTH PDF is an unchanged symlink to the first article's archived download. The original Supreme Court PDF is archived and its case identity, date and operative conclusions on pages 12–13 are checked by the audit. Text and SpaceBunny Markdown in this directory are reading aids. For Annexures 29(a) and 33, the displayed cells were checked on the original PDF page images. Both annexures independently reconcile all 36 state totals. The earlier article's source-audited road-user and impacting-vehicle artifacts are reused, and the new source audit rechecks them. The full-report model transcription in the sibling parser project remains a draft; it is not the authority for these charts.

## Release record, 26 September 2026

- The audit checked 47 plotted cells, 14 calculation inputs and 41 cross-checks, with zero mismatches. It separately checked the official 13-page Supreme Court judgment.
- Focused data and explanation validators passed without errors or warnings. The Node 22 static build produced 108 pages, including this article.
- Rendered audit found 10 prose sections, eight charts and eight rich chart notes in the intended order, with the original report and WHO manual linked. Desktop and 390px mobile layouts were visually reviewed.
- Publication status: local draft for editorial review. No push or deployment has been made.

The reported toll is not a risk per walk. The 60-plus comparison uses all road deaths *within that age band* as its denominator. State totals and impacting-vehicle counts cannot rank per-trip danger or assign fault. “All other roads” is a subtraction from the national total, not an independently reported local-road category. The section-level claim and interpretation record is `data/audits/pedestrian-safety-2024/claim-ledger.json`.

The 2024 crash figures predate the 2026 judgment. They cannot show whether any authority has since met the Court's stated duty, how many footpaths exist or what caused each recorded death. The judgment is linked as a legal source in the article, alongside the numerical MoRTH report and WHO's general guidance.
