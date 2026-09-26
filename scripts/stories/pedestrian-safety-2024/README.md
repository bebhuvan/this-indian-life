# Pedestrian safety 2024 article handoff

Article: `q.health.pedestrian_safety_2024`, route `/articles/how-safe-is-it-to-walk-in-india/`.

This is a separate, pedestrian-focused companion to the wider 2024 road-death article. Nine charts examine the national toll, the direct 2023 comparison, victim ages, pedestrians' share of road deaths within each age and sex group, impacting vehicles, the ten largest state totals, pedestrian shares of road deaths within those ten states, and national highways versus all other roads. The gender comparison uses all male and female road deaths from Table 4.3 as denominators, alongside pedestrian deaths from Annexure 33. It describes victim mix, not risk per walking trip. MoRTH's *Road Accidents in India 2024* is the numerical source. The article connects that toll to the Supreme Court's 19 June 2026 ruling in *Maniyar Iliyaz v. P. Ayyappan*, which recognised walking on demarcated footpaths as a fundamental right and set out local-authority duties. The WHO pedestrian-safety manual supplies general intervention evidence, not an India-specific observation or risk denominator.

The final source-angle inventory is `data/audits/pedestrian-safety-2024/angle-review.md`. It records candidate dimensions omitted because the national tables do not cross-tabulate pedestrian victims, lack walking exposure, or would repeat an existing chart. The age-by-sex review in `source-cell-audit.json` verifies the within-age gender sentence against Table 4.3 and Annexure 33.

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

- The audit checked 57 plotted cells, two prepared unplotted cells, 38 calculation inputs and 41 cross-checks, with zero mismatches. It separately checked the official 13-page Supreme Court judgment.
- Focused data and explanation validators passed without errors or warnings. The Node 22 static build produced 108 pages, including this article.
- Rendered audit found 11 prose sections, nine charts and nine rich chart notes in the intended order, with the original report and WHO manual linked. Desktop and 390px mobile layouts were visually reviewed.
- The prose was revised with Xiaomi MiMo 2.6 Flash through OpenCode Go, then checked against the source audit and edited by hand. The dek, short answer, macha block, standfirst and article opening now name the Ministry of Road Transport and Highways and *Road Accidents in India 2024* before using an acronym or referring to the report. The reader-prose diagnostic reported zero findings across the generated explanation.
- A publication link check found that the old WHO manual URL displayed WHO's generic digital-publications page. The article and source note now link the manual's exact 2023, second-edition publication page (ISBN 978-92-4-007249-7); the title and intervention scope were checked there and against WHO's manual text.
- An independent MiMo 2.6 Flash fact-check through OpenCode Go checked the article against fresh extracts from the original MoRTH report and Supreme Court judgment. It found no error in the checkable counts, denominators, impacting-vehicle row, highway split or right-to-walk holding. Its OCR could not reliably read the scanned state and age-by-sex annexures, so the original-page visual cell audit and 36-state reconciliation remain the gate for those claims. We separately checked the case caption, the five-year-old child's crash, the proposed legal framework and the 2019 victim-format change on the original PDF pages that were outside MiMo's focused packet.
- Publication status: approved for the authorised release push to `main`; the push triggers the Cloudflare deployment workflow.

The reported toll is not a risk per walk. The age and sex comparisons use all road deaths *within the same group* as their denominators. State totals and impacting-vehicle counts cannot rank per-trip danger or assign fault. “All other roads” is a subtraction from the national total, not an independently reported local-road category. The section-level claim and interpretation record is `data/audits/pedestrian-safety-2024/claim-ledger.json`.

The 2024 crash figures predate the 2026 judgment. They cannot show whether any authority has since met the Court's stated duty, how many footpaths exist or what caused each recorded death. The judgment is linked as a legal source in the article, alongside the numerical MoRTH report and WHO's general guidance.

## September 2026 revision

A second state chart divides pedestrian deaths by all road deaths within each of the ten states selected for the raw-count chart. Annexure 29(a) supplies visually checked numerators; Table 5.6 supplies denominators. The new source audit independently recomputes the ten percentages and checks West Bengal’s reporting-recast note. These shares describe victim mix, not walking risk.

The September adversarial MiMo pass confirmed the new state shares, selection rule and West Bengal caveat. It caught a legal wording nuance: the Supreme Court said authorities “must endeavour” to provide pedestrian infrastructure. The article now follows that wording, and the original judgment audit checks it. MiMo saw a bounded packet; the original-page audit remains the check for the scanned age and state cells.
