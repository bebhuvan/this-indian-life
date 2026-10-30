#!/usr/bin/env python3
"""Freeze raw RBI DBIE LRS and external sector files and write data/raw/rbi-dbie-lrs-2026/manifest.json."""

import hashlib
import json
import os
import shutil
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "data/raw/rbi-dbie-lrs-2026"
DB = Path("/home/bhuvanesh.r/Documents/Data/Data bank")


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
    dst_19 = RAW_DIR / "rbi_dbie_report_19_lrs_monthly_200804_202608.csv_gz"
    dst_752 = RAW_DIR / "rbi_dbie_report_752_lrs_annual_200809_202425.csv_gz"
    dst_cas = RAW_DIR / "rbi_dbie_cas_external_sector_202610.csv"

    if DB.exists() and not dst_19.exists():
        shutil.copy2(DB / "data/raw/blobs/9b/9be306626df7eba2580c47b55bbfaa4a4e0a5c623af43fda91401a0034e3ef52.csv_gz", dst_19)
        shutil.copy2(DB / "data/raw/blobs/dc/dc44661d2eb297de799a91af610257ec420436113d79c9212b266fa20a1a5502.csv_gz", dst_752)
        cas_path = DB / "data/warehouse/source_native/rbi_dbie_cas_money/rbi_dbie_rbi_dbie_cas_money_warehouse_20261027t020454368484z.parquet"
        cas = pd.read_parquet(cas_path)
        sub = cas[cas["dsd_code"].isin(["IND_OVR_BOP_A_RN", "FR_EXG_RESV_M_RN", "NRI_DEPOSITS_IN_OUT_RN", "NRI_DEPOSITS_OUTS_RN"])].copy()
        sub = sub.sort_values(["dsd_code", "observation_date", "series_key", "unit_code"])
        cols = ["dsd_code", "frequency", "observation_date", "period_label", "series_key", "series_label", "unit_code", "unit_label", "value", "source_url", "source_retrieved_at", "source_artifact_id"]
        sub[cols].to_csv(dst_cas, index=False)

    manifest = {
        "story": "q.econ.lrs_controls",
        "purpose": "Raw RBI DBIE SAP Webi exports for Monthly LRS (Report 19, Apr 2008 - Aug 2026) and Annual LRS (Report 752, FY2008-09 - FY2024-25), plus RBI DBIE CAS External Sector series (Annual BoP through FY2025-26, Monthly Forex Reserves through Aug 2026, and Monthly NRI Deposits through Jul 2026).",
        "files": [
            file_info(
                dst_19,
                "https://data.rbi.org.in/BOE/OpenDocument/2306191402/OpenDocument/opendoc/openDocument.jsp?iDocID=137499",
                "https://data.rbi.org.in/DBIE/#/dbie/reports/External%20Sector/External%20Sector/Outward%20Remittances%20under%20the%20Liberalised%20Remittance%20Scheme%20for%20Resident%20Individuals",
                "2026-10-25",
                "RBI DBIE Report 19 (Document 137499), RBI Bulletin October 2026 release covering April 2008 to August 2026",
                "Verbatim SAP Webi DP0 flow export (gzip CSV, semicolon-delimited) with all 16 LRS items including the 5-way Travel split (1.6.1 to 1.6.5) for March-August 2026.",
            ),
            file_info(
                dst_752,
                "https://data.rbi.org.in/BOE/OpenDocument/2306191402/OpenDocument/opendoc/openDocument.jsp?iDocID=618278",
                "https://data.rbi.org.in/DBIE/#/dbie/reports/External%20Sector/External%20Sector/Outward%20Remittances%20under%20the%20Liberalised%20Remittance%20Scheme%20for%20Resident%20Individuals%20-%20Annual",
                "2026-10-08",
                "RBI DBIE Report 752 (Document 618278), Annual LRS series FY2008-09 to FY2024-25",
                "Verbatim SAP Webi DP0 flow export for cross-checking annual LRS totals against monthly sums.",
            ),
            file_info(
                dst_cas,
                "https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES/dbie_getImpalaDQActionEnhanced",
                "https://data.rbi.org.in/DBIE/#/dbie/home",
                "2026-10-24",
                "RBI DBIE CAS Money & External Sector warehouse (IND_OVR_BOP_A_RN through FY26, FR_EXG_RESV_M_RN through Aug 2026, NRI_DEPOSITS through Jul 2026)",
                "Deterministic CSV extract of RBI DBIE CAS observations for Annual Balance of Payments, Monthly Foreign Exchange Reserves (USD & INR), and NRI Deposit flows.",
            ),
        ],
    }

    # Re-freezing core data must not silently discard previously acquired policy sources.
    manifest_path = RAW_DIR / "manifest.json"
    if manifest_path.exists():
        core_names = {entry["path"] for entry in manifest["files"]}
        for entry in json.loads(manifest_path.read_text())["files"]:
            if entry["path"] not in core_names:
                data = (RAW_DIR / entry["path"]).read_bytes()
                assert hashlib.sha256(data).hexdigest() == entry["sha256"], entry["path"]
                manifest["files"].append(entry)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Verified raw manifest with", len(manifest["files"]), "files.")


if __name__ == "__main__":
    main()
