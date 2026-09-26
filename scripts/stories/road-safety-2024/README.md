# Road safety 2024 article handoff

Article: `q.health.road_safety_2024`, route `/articles/who-dies-on-indias-roads/`.

This is a one-year, victim-focused article. It uses MoRTH's police returns for 2024 and the WHO India profile's separate 2021 modelled mortality estimate to explain the limits of the administrative count. It does not build a long historical database or apply WHO's 2021 difference to 2024.

## Reproduce

Use a Python environment with PyMuPDF and Node 22 or newer:

```bash
python scripts/stories/road-safety-2024/ingest.py
python scripts/stories/road-safety-2024/audit.py
python scripts/stories/road-safety-2024/build-explanation.py
node scripts/validate-data-artifacts.mjs --manifest=data/catalog/road-safety-2024-manifest.json
node scripts/validate-explanations.mjs --question=q.health.road_safety_2024
npm run build
python scripts/stories/road-safety-2024/audit-rendered.py
```

The original PDFs and retrieval/hash manifest are in `data/raw/road-safety-2024/`. The text files there are reading aids extracted from those PDFs, not independent sources. The ingest reads PDF rows directly and creates five focused data artifacts. The separate audit then reopens the **saved artifacts** and checks all 26 plotted observations against the frozen PDFs, plus three category total reconciliations. The earlier full-report SpaceBunny transcription remains a draft in the sibling parser project; the article does not ingest its model-generated cells.

## Current release record, 26 September 2026

- Sources: MoRTH *Road Accidents in India 2024*, PDF SHA256 `b45b0e4d8e14a8d4653790f9080a01b9b95b79008359ba93dc12497064be69b2`; WHO India country profile, PDF SHA256 `6ff205c38001a5d800864b1b0b8fdc1026a4ba97ab252267bc336ef8ec0847fc`.
- Article source-cell audit: 26 plotted values and 3 partition totals checked, zero mismatches. Four methodology statements checked against MoRTH source pages.
- Focused data-artifact validator: zero errors and warnings. Focused explanation validator: zero failures and warnings.
- Node 22 build: 107 pages, including the road-safety route. The rendered audit checks seven prose sections, four chart cards, correct section/chart order, the WHO interval and two linked primary sources. Desktop page and mobile first chart visually reviewed.
- A DeepSeek Flash and SpaceBunny bounded critique each returned an empty response. No clean bill of health was inferred from either. The source, artifact, prose and rendered-page checks above remain the release evidence.
- Publication status: local draft for editorial review. No push or deploy has been made. The evidence-commit checker runs with only this story's reviewed paths staged before the local evidence commit.

Key interpretation limits: road-user categories classify the victim, not fault; raw age and mode counts are not per-trip risk; road length is not traffic exposure; WHO's 2021 estimate cannot be transferred to 2024; 2020 was affected by Covid restrictions. See `data/audits/road-safety-2024/claim-ledger.json` for section-level source pages and calculations.
