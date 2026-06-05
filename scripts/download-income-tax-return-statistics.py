#!/usr/bin/env python3
"""Download India Income Tax Return Statistics PDFs from official sources."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urljoin

from curl_cffi import requests


OUT_DIR = Path("data/income-tax-return-statistics")
MANIFEST = OUT_DIR / "manifest.json"

ARTICLE_SOURCES = [
    ("AY_2023-24", "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-for-assessment-year-2023-24-1"),
    ("AY_2022-23", "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-for-assessment-year-2022-23-1"),
    ("AY_2020-21", "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-assessment-year-2020-21-1"),
    ("AY_2019-20", "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-assessment-year-2019-20-1"),
    ("AY_2018-19", "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-assessment-year-2018-19-1"),
    ("AY_2018-19_alt", "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-assessment-year-2018-19-2"),
    ("AY_2017-18", "https://www.incometaxindia.gov.in/w/income-tax-department-income-tax-return-statistics-assessment-year-2017-18"),
    ("AY_2016-17", "https://www.incometaxindia.gov.in/w/income-tax-department-income-tax-return-statistics-assessment-year-2016-17"),
    ("AY_2015-16", "https://www.incometaxindia.gov.in/w/income-tax-department-income-tax-return-statistics-assessment-year-2015-16"),
    ("AY_2014-15", "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-assessment-year-2014-15"),
    ("AY_2013-14", "https://www.incometaxindia.gov.in/w/income-tax-department-income-tax-return-statistics-assessment-year-2013-14"),
    ("AY_2012-13", "https://www.incometaxindia.gov.in/w/income-tax-department-income-tax-return-statistics-assessment-year-2012-13"),
]

LEGACY_SOURCES = [
    (
        "AY_2021-22",
        "https://incometaxindia.gov.in/Documents/Direct%20Tax%20Data/Income-tax-statistics-i-t-return-AY_2021-22.pdf",
        "https://academy-tax4wealh.s3.ap-south-1.amazonaws.com/videos/Banner/Income-tax-statistics-i-t-return-AY_2021-22.pdf",
    ),
    (
        "AY_2012-13_v2",
        "https://incometaxindia.gov.in/Documents/Direct%20Tax%20Data/Income-Tax-Statistics-IT-Return-AY-2012-13-V2-Final.pdf",
        None,
    ),
]


def get(url: str, *, stream: bool = False):
    return requests.get(url, impersonate="chrome124", timeout=45, stream=stream)


def article_pdf_url(article_url: str) -> str:
    response = get(article_url)
    response.raise_for_status()
    match = re.search(r'href="([^"]+\.pdf/[^"]+)"', response.text, re.IGNORECASE)
    if not match:
        raise RuntimeError(f"No PDF link found in {article_url}")
    return urljoin(article_url, match.group(1).replace("&amp;", "&"))


def download(label: str, url: str, source_page: str | None, fallback_url: str | None = None) -> dict:
    destination = OUT_DIR / f"{label}.pdf"
    response = get(url)
    status = response.status_code
    content_type = response.headers.get("content-type", "")
    body = response.content
    retrieved_url = None
    ok = status == 200 and body.startswith(b"%PDF")

    if not ok and fallback_url:
        response = get(fallback_url)
        status = response.status_code
        content_type = response.headers.get("content-type", "")
        body = response.content
        ok = status == 200 and body.startswith(b"%PDF")
        retrieved_url = fallback_url if ok else None

    record = {
        "label": label,
        "file": str(destination),
        "source_page": source_page,
        "url": url,
        "status_code": status,
        "content_type": content_type,
        "downloaded": ok,
    }
    if retrieved_url:
        record["retrieved_url"] = retrieved_url

    if ok:
        destination.write_bytes(body)
        record["bytes"] = len(body)
        record["sha256"] = hashlib.sha256(body).hexdigest()
    else:
        record["bytes"] = len(body)

    return record


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    records = []

    for label, article_url in ARTICLE_SOURCES:
        pdf_url = article_pdf_url(article_url)
        records.append(download(label, pdf_url, article_url))

    for label, pdf_url, fallback_url in LEGACY_SOURCES:
        records.append(download(label, pdf_url, None, fallback_url))

    MANIFEST.write_text(json.dumps(records, indent=2) + "\n")

    downloaded = sum(1 for record in records if record["downloaded"])
    print(f"Downloaded {downloaded}/{len(records)} PDFs into {OUT_DIR}")
    for record in records:
        marker = "ok" if record["downloaded"] else "miss"
        print(f"{marker:4} {record['label']:13} {record['bytes']:>9} {record['url']}")


if __name__ == "__main__":
    main()
