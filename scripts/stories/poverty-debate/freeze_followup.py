#!/usr/bin/env python3
"""Freeze the sources added in the November 2026 merge of the older poverty work into
q.econ.poverty_debate: the October 2026 India Poverty & Equity Brief, the report chapter
that states the nowcast method and the CPHS removal, India's poverty-line history, and the
published positions in the measurement debate.

Writes data/raw/poverty-debate-followup-2026-11/ and its manifest. Each file keeps the
URL it was fetched from, the reader-facing page, the retrieval date and its hash. Rerun
only to refresh: a changed hash fails verify_claims.py until the claims are re-reviewed.
"""

import datetime
import hashlib
import json
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "data/raw/poverty-debate-followup-2026-11"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"

# (file, fetch url, reader url, vintage, note). A local: path copies a file already
# extracted from a hashed archive instead of fetching.
SOURCES = [
    ("pppr-2026-chapter-01.pdf", "local:data/raw/poverty-debate-followup-2026-11/pppr-2026-chapter-01.pdf",
     "https://www.worldbank.org/en/publication/poverty-prosperity-and-planet",
     "Poverty, Prosperity, and Planet Report 2026, chapter 1, from reproducibility package FR_WLD_2026_763 (Catalog #659)",
     "States the 2026 nowcast method (GEP June 2026 growth, distribution-neutral, 0.7 pass-through for consumption) and the removal of CPHS-based India estimates for 2015-21."),
    ("wb-poverty-equity-brief-india-2026-10.pdf",
     "https://documents1.worldbank.org/curated/en/099722104222534584/pdf/IDU-25f34333-d3a3-44ae-8268-86830e3bc5a5.pdf",
     "https://documents1.worldbank.org/curated/en/099722104222534584/pdf/IDU-25f34333-d3a3-44ae-8268-86830e3bc5a5.pdf",
     "World Bank Poverty & Equity Brief, India, October 2026 (PDF dated 9 October 2026; the same URL served the October 2025 edition before)",
     "Projection of $4.20 poverty (14.2% in 2026, 12.1% by 2028), 2023-24 rural/urban and group rates, MPM 15.5%, survey comparability note, employment and spatial concentration."),
    ("imf-wp-2022-069.html", "https://www.elibrary.imf.org/view/journals/001/2022/069/article-A001-en.xml",
     "https://www.elibrary.imf.org/view/journals/001/2022/069/article-A001-en.xml",
     "Bhalla, Bhasin and Virmani, IMF Working Paper WP/22/69, April 2022", "Extreme poverty 0.8% in 2019 including in-kind food transfers ($1.90, 2011 PPP)."),
    ("business-standard-niti-2024-02-28.html",
     "https://www.business-standard.com/india-news/economists-divided-over-poverty-decline-claims-by-sbi-niti-aayog-124022801156_1.html",
     "https://www.business-standard.com/india-news/economists-divided-over-poverty-decline-claims-by-sbi-niti-aayog-124022801156_1.html",
     "Business Standard, 28 February 2024", "NITI Aayog CEO's statement that HCES 2022-23 indicates poverty below five per cent, and economists' responses."),
    ("sbi-research-hces-2025-01.pdf", "https://sbi.co.in/webfiles/uploads/files_2425/HCES_SBI%20Report_Jan25.pdf",
     "https://sbi.co.in/webfiles/uploads/files_2425/HCES_SBI%20Report_Jan25.pdf",
     "SBI Research, report on HCES 2023-24, January 2025", "Rural poverty 4.86% and urban 4.09% in FY24."),
    ("wb-prwp-9994.pdf", "https://documents1.worldbank.org/curated/en/099249204052228866/pdf/IDU0333e60f901267045600be83093783b77e67a.pdf",
     "https://documents1.worldbank.org/curated/en/099249204052228866/pdf/IDU0333e60f901267045600be83093783b77e67a.pdf",
     "Sinha Roy and van der Weide, World Bank Policy Research Working Paper 9994, 2022", "CPHS-based extreme poverty: 10.2% in 2019, 22.5% in 2011 ($1.90)."),
    ("et-dreze-somanchi-2021-06-21.html",
     "https://economictimes.indiatimes.com/opinion/et-commentary/view-the-new-barometer-of-indias-economy-fails-to-reflect-the-deprivations-of-poor-households/articleshow/83696115.cms",
     "https://economictimes.indiatimes.com/opinion/et-commentary/view-the-new-barometer-of-indias-economy-fails-to-reflect-the-deprivations-of-poor-households/articleshow/83696115.cms",
     "Jean Dreze and Anmol Somanchi, Economic Times, 21 June 2021", "Argues poor households are grossly under-represented in CMIE's CPHS."),
    ("i4i-das-dreze-2024-07-26.html", "https://www.ideasforindia.in/topics/poverty-inequality/the-problem-of-india-s-stagnant-real-wages.html",
     "https://www.ideasforindia.in/topics/poverty-inequality/the-problem-of-india-s-stagnant-real-wages.html",
     "Arindam Das and Jean Dreze, Ideas for India, 26 July 2024", "Labour Bureau WRRI real wage growth 2014-15 to 2023-24 (0.8% a year for male agricultural labourers)."),
    ("pib-most-equal-2025-07-05.pdf", "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/jul/doc202575582001.pdf",
     "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/jul/doc202575582001.pdf",
     "Press Information Bureau backgrounder, 5 July 2025", "Claims India is the fourth most equal country, with a Gini of 25.5."),
    ("altnews-pib-gini-2025-07.html", "https://www.altnews.in/pibs-claim-that-india-is-fourth-most-equal-country-citing-world-bank-data-is-misleading/",
     "https://www.altnews.in/pibs-claim-that-india-is-fourth-most-equal-country-citing-world-bank-data-is-misleading/",
     "Alt News, July 2025", "Critique: a consumption Gini compared with other countries' income Ginis."),
    ("mse-monograph-30-counting-the-poor.pdf", "https://mse.ac.in/wp-content/uploads/2021/05/Monograph-30.pdf",
     "https://mse.ac.in/wp-content/uploads/2021/05/Monograph-30.pdf",
     "C. Rangarajan and S. Mahendra Dev, Counting the Poor, MSE Monograph 30, December 2014", "History of India's poverty lines from the Alagh task force to the Rangarajan group."),
    ("planning-commission-press-note-2011-12.pdf", "https://www.niti.gov.in/sites/default/files/2020-05/press-note-poverty-2011-12-23-08-16.pdf",
     "https://www.niti.gov.in/sites/default/files/2020-05/press-note-poverty-2011-12-23-08-16.pdf",
     "Planning Commission, Press Note on Poverty Estimates 2011-12, July 2013", "Tendulkar poverty lines and ratios for 2011-12 and earlier rounds."),
    ("dte-planning-commission-affidavit-2011-09-20.html",
     "https://www.downtoearth.org.in/environment/planning-commission-to-sc-rs-26-a-person-a-day-the-adequate-poverty-line-34058",
     "https://www.downtoearth.org.in/environment/planning-commission-to-sc-rs-26-a-person-a-day-the-adequate-poverty-line-34058",
     "Down To Earth, 20 September 2011", "Planning Commission affidavit: Rs 965 urban and Rs 781 rural per person per month (Rs 32 and Rs 26 a day)."),
    ("governance-now-task-force-2017-03.html", "https://www.governancenow.com/news/regular-story/-india-still-undecided-poverty-line-",
     "https://www.governancenow.com/news/regular-story/-india-still-undecided-poverty-line-",
     "Governance Now, March 2017", "NITI Aayog task force: no consensus on a poverty line; recommends an expert committee."),
    ("mospi-hces-2022-23-factsheet.pdf", "https://mospi.gov.in/sites/default/files/publication_reports/Factsheet_HCES_2022-23.pdf",
     "https://mospi.gov.in/sites/default/files/publication_reports/Factsheet_HCES_2022-23.pdf",
     "MoSPI, HCES 2022-23 factsheet, February 2024", "Three questionnaires over three monthly visits; changes to be noted when comparing with earlier surveys."),
    ("niti-mpi-since-2005-06.pdf", "https://www.niti.gov.in/sites/default/files/2024-01/MPI-22_NITI-Aayog20254.pdf",
     "https://www.niti.gov.in/sites/default/files/2024-01/MPI-22_NITI-Aayog20254.pdf",
     "NITI Aayog, Multidimensional Poverty in India since 2005-06, January 2024", "24.82 crore people escaping multidimensional poverty, 2013-14 (29.17%) to 2022-23 (11.28%, projected)."),
    ("wire-leaked-nso-2017-18.html", "https://thewire.in/economy/consumer-sending-fall-rural-demand-nso-report",
     "https://thewire.in/economy/consumer-sending-fall-rural-demand-nso-report",
     "The Wire, November 2019, reporting Business Standard", "Leaked 2017-18 survey: real MPCE down 3.7%, rural down 8.8%, urban up 2%."),
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()
    files = []
    for name, url, reader, vintage, note in SOURCES:
        target = OUT / name
        if url.startswith("local:"):
            # Extracted by hand from the hashed package zip; kept in place, not refetched.
            if (ROOT / url[6:]).resolve() != target.resolve():
                shutil.copyfile(ROOT / url[6:], target)
            origin = "https://reproducibility.worldbank.org/catalog/659 (FR_WLD_2026_763.zip, chapter 1 PDF)"
        else:
            target.write_bytes(fetch(url))
            origin = url
        b = target.read_bytes()
        if len(b) < 5000:
            sys.exit(f"{name}: only {len(b)} bytes, probably a block page")
        files.append({"path": name, "url": origin, "reader_url": reader, "retrieved": today, "vintage": vintage,
                      "bytes": len(b), "sha256": hashlib.sha256(b).hexdigest(), "note": note})
        print(f"froze {name} ({len(b):,} bytes)")
    manifest = {"story": "q.econ.poverty_debate",
                "purpose": "Sources added when the older q.econ.poverty work was merged into this article (November 2026).",
                "files": files}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
