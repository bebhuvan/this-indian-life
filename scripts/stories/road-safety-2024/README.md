# Road safety 2024 article handoff

Article: `q.health.road_safety_2024`, route `/articles/who-dies-on-indias-roads/`.

This article reads one report year in depth across 12 views: annual trend, 2005–24 reported-crash severity, victim road-user and sex groups, age, rural and urban areas, road class, states, collision types, helmet and seatbelt non-use, time of day, and a separate WHO measurement comparison. MoRTH supplies 2024 police returns and the 2020–24 trend; WHO supplies an independent modelled estimate for **2021 only**. There is no long historical database or 2024 WHO adjustment.

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

The original PDFs and retrieval/hash manifest are in `data/raw/road-safety-2024/`. Text files there are reading aids from the PDFs, not independent sources. The ingest creates 14 focused artifacts, of which 12 appear in this article. The pedestrian-impact artifact remains available to the companion walking article. A separate audit reopens every saved artifact and checks **77 plotted observations and 20 prepared, unplotted observations** against frozen PDF rows, plus **nine** total reconciliations; no mismatches were found. The full-report SpaceBunny transcription remains a draft in the sibling parser project. Its model-generated cells are not used for this article.

## Release record, 26 September 2026

- Frozen source hashes and precise URLs are in `data/raw/road-safety-2024/manifest.json`.
- Focused data-artifact validator: zero errors or warnings; focused explanation validator: zero failures or warnings.
- Node 22 static build: 108 pages including the article. Rendered audit: 14 prose sections, 12 chart cards, correct section/chart order and two linked primary sources.
- Desktop and 390px mobile layouts visually reviewed on the built page, including state and timing panels.
- The prose was revised with Xiaomi MiMo 2.6 Flash through OpenCode Go in three short batches, then checked against the source audit and edited by hand. The dek, short answer, macha block, standfirst and body opening now name the Ministry of Road Transport and Highways and Road Accidents in India 2024 before using an acronym or referring to the report. The generated explanation passes the reader-prose diagnostic with zero findings.
- The initial independent MiMo 2.6 Flash fact-check through OpenCode Go read the original MoRTH and WHO PDFs without the claim ledger or generated chart files. It confirmed the article's numerical claims but found that the monthly paragraph missed May's maximum and September's minimum. It also challenged the unsupported April 2024 WHO release date, the wording about travel exposure and the description of MoRTH's mixed "Other" category. All four issues were corrected in the article and regenerated explanation. The reviewer did not verify live links or our internal source-audit process; those have separate checks.
- Publication status: approved for the authorised release push to `main`; the push triggers the Cloudflare deployment workflow.

Interpretation limits are central to the story: victim and impacting-vehicle labels do not assign fault; time-of-day bars are accidents, not deaths; recorded non-use of a protective device is not an individually preventable-death estimate; no count is divided by matched travel exposure; and WHO's modelled 2021 estimate cannot be transferred to 2024. The section-level source ledger is `data/audits/road-safety-2024/claim-ledger.json`.

## September 2026 revision

The article now opens with the annual toll, adds the 2005–24 reported-crash severity series from Table 1.6 and the 2024 sex split from Table 4.3, and sends pedestrian-impact detail to the separate walking article. The one-year monthly chart was removed from the article. Severity is people killed per 100 reported crash events, not the proportion of crashes that were fatal. The source audit independently recomputes all 20 severity points and checks both sex cells.

The September adversarial MiMo pass confirmed the new severity and sex figures. It prompted a 2021 peak and the separate 33.7% fatal-accident share from Table 1.6. A questioned rounding pair was checked against exact scanned Annexure 33 counts and was correct. MiMo saw a bounded source packet; the independent PDF-cell audit covers the remaining chart values.
