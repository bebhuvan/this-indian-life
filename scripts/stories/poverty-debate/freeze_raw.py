#!/usr/bin/env python3
"""Freeze raw World Bank 2026 Poverty, Prosperity, and Planet replication files and PIP API payloads into data/raw/wb-3pr-2026/."""

import hashlib
import json
import os
import shutil
import urllib.request
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "data/raw/wb-3pr-2026"
SCRATCH_WB = Path("/home/bhuvanesh.r/.gemini/antigravity-cli/brain/8abd780c-3fe6-48d3-a046-74e3797384e1/scratch/wb3pr/Reproducibility package")

WB_REPORT_URL = "https://www.worldbank.org/en/publication/poverty-prosperity-and-planet"
WB_REPRO_URL = "https://reproducibility.worldbank.org/index.php/catalog/659"
PIP_READER_URL = "https://pip.worldbank.org/country-profiles/IND"


def file_info(p, url, reader_url, retrieved, vintage, note):
    b = Path(p).read_bytes()
    return {
        "path": os.path.basename(p),
        "url": url,
        "reader_url": reader_url,
        "retrieved": retrieved,
        "vintage": vintage,
        "bytes": len(b),
        "sha256": hashlib.sha256(b).hexdigest(),
        "note": note,
    }


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    copies = [
        (
            "Chapter 1/Chapter 1/1-data/raw/spid/AM26 - SPID data.xlsx",
            "AM26_SPID_data.xlsx",
            "Unchanged SPID subgroup survey workbook; direct HCES2023 rows ref_year2023.58, ages0-5 andALL. Not interchangeable with GSAP calendar lineups.",
        ),
        (
            "Chapter 1/Chapter 1/1-data/raw/forecasts/Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta",
            "Country_FGT_1981_2050_20260922_2021_01_02_PROD.dta",
            "World Bank 2026 3PR Chapter 1 lined-up country poverty headcounts, gaps, and populations (1981-2050) at $3.00, $4.20, and $8.30/day (2021 PPP).",
        ),
        (
            "Chapter 1/Chapter 1/1-data/raw/spid/AM26 - GSAP data.xlsx",
            "AM26_GSAP_data.xlsx",
            "World Bank Fall 2026 Global Subnational Atlas of Poverty (GSAP 2023), covering all 36 Indian states and union territories from HCES 2023-24 across $3.00, $4.20, $8.30, and the Prosperity Gap.",
        ),
        (
            "Chapter 1/Chapter 1/1-data/raw/mpm/MPM_AM26.xlsx",
            "MPM_AM26.xlsx",
            "World Bank Fall 2026 Multidimensional Poverty Measure (MPM) database across monetary, education, sanitation, drinking water, and electricity deprivations.",
        ),
        (
            "Chapter 1/Chapter 1/2-output/chapter1.xlsx",
            "chapter1.xlsx",
            "World Bank 2026 3PR Chapter 1 output tables (including Figure 1.6 country shares of global poor at $3.00, $4.20, and $8.30 and Figure 1.17 Societal Poverty Rate).",
        ),
        (
            "Chapter 2/Chapter 2/1-data/raw/pip_20260922_2021_01_02_PROD.dta",
            "pip_20260922_2021_01_02_PROD.dta",
            "World Bank PIP September 2026 production microdata summary (1977-2023 survey rounds for India: mean, median, headcount, Gini, Prosperity Gap, Societal Poverty Line, decile shares, HFCE, and GDP per capita).",
        ),
        (
            "Chapter 2/Chapter 2/2-output/chapter2.xlsx",
            "chapter2.xlsx",
            "World Bank 2026 3PR Chapter 2 output tables (including country contributions to the Global Prosperity Gap in 1990 and 2026, and consumption vs income Gini comparisons).",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4C_123.dta",
            "DataFig4C_123.dta",
            "World Bank 2026 3PR Chapter 4 counterfactual poverty simulation (closing household employment and worker earnings gaps at $3.00 and $8.30/day).",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4_5a.dta",
            "DataFig4_5a.dta",
            "World Bank 2026 3PR Chapter 4 working-age (15-64) employment rates by household poverty status (<$8.30 vs >=$8.30/day), circa 2003 vs 2024.",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4_5b.dta",
            "DataFig4_5b.dta",
            "World Bank 2026 3PR Chapter 4 annualized percentage-point change in adult employment rates by poverty status (2003-2024).",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4D_1b.dta",
            "DataFig4D_1b.dta",
            "World Bank 2026 3PR Chapter 4 share of employed adults with less than secondary education by poverty status (2003 vs 2024).",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4D_1c.dta",
            "DataFig4D_1c.dta",
            "World Bank 2026 3PR Chapter 4 daily welfare (2021 PPP $) of workers with vs without secondary education.",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4D_2b.dta",
            "DataFig4D_2b.dta",
            "World Bank 2026 3PR Chapter 4 self-employment share among workers by poverty status (<$8.30 vs >=$8.30/day).",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4D_2c.dta",
            "DataFig4D_2c.dta",
            "World Bank 2026 3PR Chapter 4 daily welfare (2021 PPP $) of wage/salaried vs self-employed workers.",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4D_3b.dta",
            "DataFig4D_3b.dta",
            "World Bank 2026 3PR Chapter 4 agricultural employment share among workers by poverty status (<$8.30 vs >=$8.30/day).",
        ),
        (
            "Chapter 4/1-data/processed/DataFig4D_3c.dta",
            "DataFig4D_3c.dta",
            "World Bank 2026 3PR Chapter 4 daily welfare (2021 PPP $) of non-agricultural vs agricultural workers.",
        ),
        (
            "Chapter 4/1-data/processed/DataFigB4_1_1.dta",
            "DataFigB4_1_1.dta",
            "World Bank 2026 3PR Chapter 4 Box 4.1 weekly working hours in paid and self/unpaid employment for poor vs non-poor workers.",
        ),
    ]

    manifest_files = []
    for rel_src, dst_name, note in copies:
        dst_path = RAW_DIR / dst_name
        if SCRATCH_WB.exists() and not dst_path.exists():
            shutil.copy2(SCRATCH_WB / rel_src, dst_path)
        manifest_files.append(
            file_info(
                dst_path,
                "https://datacatalogfiles.worldbank.org/ddh-published/0064796/DR0092191/AM26%20-%20SPID%20data.xlsx" if dst_name == "AM26_SPID_data.xlsx" else WB_REPRO_URL,
                "https://datacatalog.worldbank.org/search/dataset/0064796/subnational-poverty-and-inequality-database-spid" if dst_name == "AM26_SPID_data.xlsx" else WB_REPORT_URL,
                "2026-10-29",
                "World Bank Poverty, Prosperity, and Planet Report 2026 Reproducibility Package (FR_WLD_2026_763, Catalog #659, October 26, 2026)",
                note,
            )
        )

    # Extract India's 1000-quantile welfare distribution (1990-2026) from GlobalDist1000bins
    dst_bins = RAW_DIR / "IND_GlobalDist1000bins_1990_2026.csv"
    if SCRATCH_WB.exists() and not dst_bins.exists():
        p_bins = SCRATCH_WB / "Chapter 1/Chapter 1/1-data/raw/other/GlobalDist1000bins_1990_2026_20260922_2021_01_02_PROD.dta"
        chunks = []
        for ch in pd.read_stata(p_bins, chunksize=200000):
            sub = ch[ch["code"] == "IND"]
            if len(sub):
                chunks.append(sub)
        df_ind_bins = pd.concat(chunks, ignore_index=True).sort_values(["year", "quantile"])
        df_ind_bins.to_csv(dst_bins, index=False)

    manifest_files.append(
        file_info(
            dst_bins,
            WB_REPRO_URL,
            WB_REPORT_URL,
            "2026-10-29",
            "World Bank 2026 3PR Chapter 1 GlobalDist1000bins_1990_2026_20260922_2021_01_02_PROD.dta (India code=='IND' extract, 37,000 rows)",
            "Exact 1,000-quantile lined-up daily consumption distribution (2021 PPP $) for India across 1990-2026.",
        )
    )

    # Fetch PIP API JSONs for 20260922_2021_01_02_PROD (3.00, 4.20, 8.30) and 20260922_2017_01_02_PROD (2.15, 3.65, 6.85)
    pip_specs = [
        ("20260922_2021_01_02_PROD", "3.00"),
        ("20260922_2021_01_02_PROD", "4.20"),
        ("20260922_2021_01_02_PROD", "8.30"),
        ("20260922_2017_01_02_PROD", "2.15"),
        ("20260922_2017_01_02_PROD", "3.65"),
        ("20260922_2017_01_02_PROD", "6.85"),
    ]
    for ver, pl in pip_specs:
        fn = f"pip_IND_pl{pl.replace('.', '_')}_{ver}.json"
        dst_pip = RAW_DIR / fn
        url = f"https://api.worldbank.org/pip/v1/pip?country=IND&povline={pl}&fill_gaps=false&version={ver}&format=json"
        if not dst_pip.exists():
            data = json.loads(urllib.request.urlopen(url, timeout=20).read().decode("utf-8"))
            dst_pip.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        manifest_files.append(
            file_info(
                dst_pip,
                url,
                PIP_READER_URL,
                "2026-10-29",
                f"World Bank PIP API release {ver}, India survey-year series at ${pl}/day",
                f"Official PIP JSON response for India (fill_gaps=false) at ${pl}/day under {ver[:13]}.",
            )
        )

    # Preserve separately frozen primary supplements acquired during independent audits.
    existing = RAW_DIR / "manifest.json"
    if existing.exists():
        copied = {r["path"] for r in manifest_files}
        manifest_files.extend(r for r in json.loads(existing.read_text())["files"] if r["path"] not in copied)

    manifest = {
        "story": "q.econ.poverty_debate",
        "purpose": "World Bank Poverty, Prosperity, and Planet Report 2026 (October 26, 2026) reproducibility package files (Catalog #659, FR_WLD_2026_763) and September 2026 PIP API releases (2021 PPP and 2017 PPP vintages) for India.",
        "files": manifest_files,
    }
    (RAW_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Frozen", len(manifest_files), "raw files in data/raw/wb-3pr-2026/manifest.json.")


if __name__ == "__main__":
    main()
