#!/usr/bin/env python3
"""Ingest Indian nationals' departures from the 2025 Tourism Data Compendium.

The source table is produced by the Ministry of Tourism from Bureau of
Immigration data. The PDF is snapshotted and its Table 3.1.1 is parsed from a
layout-preserving text extraction with fixed-value assertions.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
import subprocess
from pathlib import Path

import requests


SOURCE_URL = "https://data.tourism.gov.in/mrd/Uploads/tourism_data/India%20Tourism%20Data%20Compendium%202025_1.pdf"
OUT = Path("data/series")
SNAP = Path("data/snapshots/ministry-tourism")
CATALOG = Path("data/catalog")
FETCHED_AT = dt.datetime.now(dt.timezone.utc).isoformat()


def main() -> None:
    response = requests.get(SOURCE_URL, timeout=90)
    response.raise_for_status()
    body = response.content
    if not body.startswith(b"%PDF") or len(body) < 10_000_000:
        raise ValueError(f"Tourism compendium download is not the expected PDF: {len(body)} bytes")

    digest = hashlib.sha256(body).hexdigest()
    SNAP.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    CATALOG.mkdir(parents=True, exist_ok=True)
    pdf_path = SNAP / f"india-tourism-data-compendium-2025.{digest[:12]}.pdf"
    pdf_path.write_bytes(body)

    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    text = result.stdout
    anchor = text.find("Table 3.1.1 provides a year-wise account")
    if anchor < 0:
        raise ValueError("Could not find the Table 3.1.1 narrative anchor")
    source = text.find("Source: Bureau of Immigration", anchor)
    if source < 0:
        raise ValueError("Could not find the Table 3.1.1 source footer")
    block = text[anchor:source]

    observations = []
    for match in re.finditer(r"(?m)^\s*((?:19|20)\d{2})\s+([0-9,]+)\s+(-?[0-9]+(?:\.[0-9]+)?)\s*$", block):
        year = int(match.group(1))
        value = int(match.group(2).replace(",", ""))
        growth = float(match.group(3))
        observations.append({"date": str(year), "value": value, "growthPercentPublished": growth})

    expected_years = [1991, 2001] + list(range(2011, 2025))
    if [int(row["date"]) for row in observations] != expected_years:
        raise ValueError(f"Unexpected departure years parsed: {[row['date'] for row in observations]}")
    expected_values = {2016: 21_871_995, 2019: 26_915_034, 2020: 7_294_566, 2023: 27_877_640, 2024: 30_885_048}
    parsed = {int(row["date"]): row["value"] for row in observations}
    for year, expected in expected_values.items():
        if parsed.get(year) != expected:
            raise ValueError(f"Departure count mismatch for {year}: {parsed.get(year)} vs {expected}")

    artifact = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": "tourism.outbound_departures.annual",
        "title": "Indian nationals' departures from India",
        "sourceId": "ministry-tourism-boi",
        "sourceIndicatorId": "India Tourism Data Compendium 2025, Table 3.1.1",
        "sourceUrl": SOURCE_URL,
        "unit": "departures",
        "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": FETCHED_AT,
        "observations": observations,
        "metadata": {
            "kind": "administrative count",
            "sourceAgency": "Bureau of Immigration, Government of India",
            "publisher": "Ministry of Tourism, Government of India",
            "method": "Parsed Table 3.1.1 from the official 2025 Tourism Data Compendium PDF using pdftotext -layout; Indian-number commas removed after exact table isolation.",
            "rawHash": digest,
            "snapshotPath": str(pdf_path),
            "definition": "Departures by Indian nationals, not unique travellers and not necessarily leisure trips.",
        },
    }
    path = OUT / "ministry-tourism.IN.tourism.outbound_departures.annual.json"
    path.write_text(json.dumps(artifact, indent=2) + "\n")
    manifest = [{
        "status": "ready",
        "indicatorId": artifact["indicatorId"],
        "sourceIndicatorId": artifact["sourceIndicatorId"],
        "fetchedAt": FETCHED_AT,
        "artifact": str(path),
        "observations": len(observations),
        "snapshot": str(pdf_path),
        "rawHash": digest,
    }]
    (CATALOG / "ministry-tourism-outbound-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {path}: {len(observations)} observations; snapshot={pdf_path}")


if __name__ == "__main__":
    main()
