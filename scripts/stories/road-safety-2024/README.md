# Road safety 2024 article handoff

Article: `q.health.road_safety_2024`, route `/articles/who-dies-on-indias-roads/`.

This article reads one report year in depth across 12 views: victims, pedestrian collisions, age, annual trend, rural and urban areas, road class, states, collision types, helmet and seatbelt non-use, time of day, month, and a separate WHO measurement comparison. MoRTH supplies 2024 police returns and the 2020–24 trend; WHO supplies an independent modelled estimate for **2021 only**. There is no long historical database or 2024 WHO adjustment.

## Reproduce

Use Python with PyMuPDF and BeautifulSoup, plus Node 22 or newer:

```bash
python scripts/stories/road-safety-2024/ingest.py
python scripts/stories/road-safety-2024/audit.py
python scripts/stories/road-safety-2024/build-explanation.py
node scripts/validate-data-artifacts.mjs --manifest=data/catalog/road-safety-2024-manifest.json
node scripts/validate-explanations.mjs --question=q.health.road_safety_2024
npm run build
python scripts/stories/road-safety-2024/audit-rendered.py
```

The original PDFs and retrieval/hash manifest are in `data/raw/road-safety-2024/`. Text files there are reading aids from the PDFs, not independent sources. The ingest creates 12 focused chart artifacts. A separate audit reopens every saved artifact and checks **75 plotted observations** against frozen PDF rows, plus **eight** total reconciliations; no mismatches were found. The full-report SpaceBunny transcription remains a draft in the sibling parser project. Its model-generated cells are not used for this article.

## Release record, 26 September 2026

- Frozen source hashes and precise URLs are in `data/raw/road-safety-2024/manifest.json`.
- Focused data-artifact validator: zero errors or warnings; focused explanation validator: zero failures or warnings.
- Node 22 static build: 107 pages including the article. Rendered audit: 14 prose sections, 12 chart cards, correct section/chart order and two linked primary sources.
- Desktop and 390px mobile layouts visually reviewed on the built page, including state and timing panels.
- Publication status: local draft for editorial review. No push or deploy has been made.

Interpretation limits are central to the story: victim and impacting-vehicle labels do not assign fault; time-of-day bars are accidents, not deaths; recorded non-use of a protective device is not an individually preventable-death estimate; no count is divided by matched travel exposure; and WHO's modelled 2021 estimate cannot be transferred to 2024. The section-level source ledger is `data/audits/road-safety-2024/claim-ledger.json`.
