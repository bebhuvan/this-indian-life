#!/usr/bin/env python3
"""Freeze the sources added for the November 2026 rewrite of q.econ.poverty_debate: the
free-grain scheme's coverage and dates, how the World Bank builds India's welfare aggregate
for PIP (in-kind items, recall period, spatial deflation, single national PPP), the World
Inequality Lab's top-share estimates, and the HCES 2022-23 and 2023-24 coverage and frame.

Writes data/raw/poverty-debate-rewrite-2026-11/ and its manifest, in the same shape as
freeze_followup.py. Each file keeps the URL it was fetched from, the reader-facing page,
the retrieval date and its hash. Rerun only to refresh: a changed hash fails
verify_claims.py until the claims are re-reviewed.
"""

import datetime
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "data/raw/poverty-debate-rewrite-2026-11"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"

# (file, fetch url, reader url, vintage, note)
SOURCES = [
    ("pib-pmgkay-free-from-2023-01-11.html", "https://pib.gov.in/PressReleasePage.aspx?PRID=1890272",
     "https://pib.gov.in/PressReleasePage.aspx?PRID=1890272",
     "Press Information Bureau, Ministry of Consumer Affairs, Food & Public Distribution, 11 January 2023 (Release ID 1890272)",
     "Free foodgrains to all AAY and PHH (NFSA) beneficiaries from 1 January 2023 under the renamed PMGKAY; more than 80 crore people."),
    ("pib-pmgkay-extension-2023-11-29.html", "https://pib.gov.in/PressReleasePage.aspx?PRID=1980689",
     "https://pib.gov.in/PressReleasePage.aspx?PRID=1980689",
     "Press Information Bureau, Cabinet decision, 29 November 2023 (Release ID 1980689)",
     "Free foodgrains to about 81.35 crore beneficiaries under PMGKAY for five years from 1 January 2024, about Rs 11.80 lakh crore."),
    ("wb-gpmt-44-pip-june-2025-whats-new.pdf",
     "https://documents1.worldbank.org/curated/en/099510306052516849/pdf/IDU-eb272b02-ecd1-4633-9e37-9297e20a711c.pdf",
     "https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099510306052516849",
     "World Bank Global Poverty Monitoring Technical Note 44, June 2025 Update to the Poverty and Inequality Platform (PIP): What's New",
     "Section 3, Adjustments to India data: URP to MMRP, PDS and free items re-valued at local market unit values, durables/rent/hospitalisation excluded, Fisher spatial deflators, single national PPP; CPHS years removed."),
    ("wb-india-poverty-methodology-note-2025.pdf",
     "https://documents1.worldbank.org/curated/en/099060325033540333/pdf/P180633-e1a59178-dc78-4b14-8928-1c88d02240f3.pdf",
     "https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099060325033540333",
     "World Bank, India: Trends in Poverty from 2011-12 to 2022-23, Methodology Note (document date May 2025)",
     "Full method behind the June 2025 India series: free and subsidised PDS items re-valued, MMRP, spatial and intra-temporal deflation allowing a single national PPP; PIP used URP until March 2025."),
    ("pip-methodology-welfareaggregate.html", "https://datanalytics.worldbank.org/PIP-Methodology/welfareaggregate.html",
     "https://datanalytics.worldbank.org/PIP-Methodology/welfareaggregate.html",
     "World Bank, Poverty and Inequality Platform Methodology Handbook, chapter 2 (as served November 2026)",
     "Recall-period example: India 2011/12 poverty 22.9% on URP vs 16.2% on MMRP (2017 PPP); spatial deflation section."),
    ("pip-methodology-convert.html", "https://datanalytics.worldbank.org/PIP-Methodology/convert.html",
     "https://datanalytics.worldbank.org/PIP-Methodology/convert.html",
     "World Bank, Poverty and Inequality Platform Methodology Handbook, chapter 3 (as served November 2026)",
     "PPP section: separate rural and urban PPPs are now computed only for China."),
    ("wil-wp-2024-09-billionaire-raj.pdf",
     "https://wid.world/www-site/uploads/2024/03/WorldInequalityLab_WP2024_09_Income-and-Wealth-Inequality-in-India-1922-2023_Final.pdf",
     "https://wid.world/www-site/uploads/2024/03/WorldInequalityLab_WP2024_09_Income-and-Wealth-Inequality-in-India-1922-2023_Final.pdf",
     "Bharti, Chancel, Piketty and Somanchi, World Inequality Lab Working Paper 2024/09, March 2024",
     "Top 1% income share 22.6% (highest since 1922) and wealth share 40.1% (highest since 1961) in 2022-23."),
    ("mospi-nss-report-591-hces-2022-23.pdf",
     "https://mospi.gov.in/sites/default/files/publication_reports/Report_591_HCES_2022-23New.pdf",
     "https://mospi.gov.in/sites/default/files/publication_reports/Report_591_HCES_2022-23New.pdf",
     "MoSPI/NSO, NSS Report No. 591, Survey on Household Consumption Expenditure: 2022-23 (June 2024)",
     "Section 1.3 coverage and exclusions (floating population, barracks, orphanages, convicted prisoners, inaccessible A&N villages); Appendix B 2.2.2.0 frame (Census 2011 villages, latest UFS blocks)."),
    ("mospi-nss-report-592-hces-2023-24.pdf",
     "https://mospi.gov.in/sites/default/files/publication_reports/Final_Report_HCES_2023-24L.pdf",
     "https://mospi.gov.in/sites/default/files/publication_reports/Final_Report_HCES_2023-24L.pdf",
     "MoSPI/NSO, NSS Report No. 592, Survey on Household Consumption Expenditure: 2023-24",
     "Same coverage exclusions (section 1.3) and the same frame (Appendix B 2.2.2.0) as 2022-23."),
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()
    files = []
    for name, url, reader, vintage, note in SOURCES:
        target = OUT / name
        target.write_bytes(fetch(url))
        b = target.read_bytes()
        if len(b) < 5000:
            sys.exit(f"{name}: only {len(b)} bytes, probably a block page")
        if name.endswith(".pdf") and not b.startswith(b"%PDF"):
            sys.exit(f"{name}: not a PDF, probably a block page")
        files.append({"path": name, "url": url, "reader_url": reader, "retrieved": today, "vintage": vintage,
                      "bytes": len(b), "sha256": hashlib.sha256(b).hexdigest(), "note": note})
        print(f"froze {name} ({len(b):,} bytes)")
    manifest = {"story": "q.econ.poverty_debate",
                "purpose": "Sources added for the November 2026 rewrite: free-grain coverage, the World Bank's India welfare aggregate in PIP, top income and wealth shares, and HCES coverage and sampling frame.",
                "files": files}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
