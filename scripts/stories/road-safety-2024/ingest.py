#!/usr/bin/env python3
"""Build the bounded road-safety story dataset from two frozen source PDFs."""

import csv
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pymupdf


ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data/raw/road-safety-2024"
SERIES = ROOT / "data/series"
AUDIT = ROOT / "data/audits/road-safety-2024"
CATALOG = ROOT / "data/catalog/road-safety-2024-manifest.json"
MORTH = RAW / "road-accidents-in-india-2024.pdf"
WHO = RAW / "who-road-safety-india-2023-profile.pdf"
MORTH_URL = "https://data.opencity.in/dataset/33d29ab0-f9e8-4fc7-b404-c93c1ed8e1b8/resource/30af828c-3513-4c74-a919-8daa708f077d/download/road-accidents-in-india-2024.pdf"
WHO_URL = "https://cdn.who.int/media/docs/default-source/country-profiles/road-safety/road-safety-2023-ind.pdf?download=true&sfvrsn=b4fb5a5c_3"
HASHES = {
    MORTH.name: "b45b0e4d8e14a8d4653790f9080a01b9b95b79008359ba93dc12497064be69b2",
    WHO.name: "6ff205c38001a5d800864b1b0b8fdc1026a4ba97ab252267bc336ef8ec0847fc",
}
NUM = re.compile(r"(?<![\w-])-?\d[\d,]*(?:\.\d+)?(?!\w)")
checked = []


def source_numbers(text):
    return [float(v.replace(",", "")) for v in NUM.findall(text)]


def row(lines, label, width, page, table):
    if label.startswith("Others (other motor vehicles"):
        matches = [(i, source_numbers(lines[i + 1])) for i, line in enumerate(lines[:-1])
                   if line.lstrip().startswith("Others (other motor vehicles")]
    else:
        pattern = re.compile(r"^\s*" + re.escape(label) + r"\s{2,}(.+)$", re.I)
        matches = [(i, source_numbers(match.group(1))) for i, line in enumerate(lines)
                   if (match := pattern.match(line))]
    matches = [(i, v) for i, v in matches if len(v) == width]
    if len(matches) != 1:
        raise ValueError(f"PDF page {page}, Table {table}, {label!r}: {len(matches)} matching rows")
    return matches[0][1]


def artifact(indicator, title, source, table, page, rows=None, observations=None, unit="persons", note=""):
    path = SERIES / f"road-safety-2024.{indicator}.json"
    doc = {
        "schemaVersion": 1,
        "artifactType": "table" if rows is not None else "series",
        "indicatorId": f"road.safety.{indicator}",
        "title": title,
        "sourceId": "morth-road-accidents-2024" if source == "morth" else "who-road-safety-2023",
        "sourceIndicatorId": f"Table {table}" if table else "Burden: road traffic fatalities",
        "sourceUrl": MORTH_URL if source == "morth" else WHO_URL,
        "unit": unit,
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": "2026-09-26T10:52:58Z",
        "metadata": {"sourcePage": page, "method": note, "vintage": "MoRTH Road Accidents in India 2024" if source == "morth" else "WHO Global status report on road safety 2023, India country profile"},
    }
    if rows is not None:
        doc["rows"] = rows
    else:
        doc["frequency"] = "annual"
        doc["observations"] = observations
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    return path.relative_to(ROOT).as_posix(), doc


def check(label, value, source_value, source_ref):
    matched = value == source_value
    checked.append({"label": label, "artifact_value": value, "source_value": source_value,
                    "source_ref": source_ref, "match": matched})
    if not matched:
        raise ValueError(f"Mismatch: {label}: {value} != {source_value}")


def main():
    for path in (MORTH, WHO):
        if hashlib.sha256(path.read_bytes()).hexdigest() != HASHES[path.name]:
            raise ValueError(f"Source hash changed: {path}")
    SERIES.mkdir(exist_ok=True)
    AUDIT.mkdir(exist_ok=True)
    morth = pymupdf.open(MORTH)
    texts = {p: morth[p - 1].get_text(sort=True).splitlines() for p in [35, 54, 92, 98]}
    files = []

    national = {year: row(texts[35], str(year), 6, 35, "1.1") for year in range(2020, 2025)}
    observations = [{"date": str(year), "value": int(vals[2])} for year, vals in national.items()]
    files.append(artifact("fatalities.2020_2024", "Police-recorded road deaths, 2020–2024", "morth", "1.1", 35,
                          observations=observations, note="Table 1.1 fatalities column; calendar years. 2020 and 2021 were affected by Covid restrictions."))
    for year, vals in national.items():
        check(f"annual deaths {year}", next(o["value"] for o in observations if o["date"] == str(year)), vals[2], f"MoRTH Table 1.1, PDF p35, row {year}, fatalities")

    road_users = [
        ("Two-wheeler users", "Two-wheelers"), ("Pedestrians", "Pedestrians"),
        ("Car, taxi, van and LMV occupants", "Cars, Taxis, Vans & LMVs"),
        ("Other or unclassified", "Others (other motor vehicles, animal drawn vehicle, cycle rickshaws, hand carts, & other persons)"),
        ("Truck and lorry occupants", "Trucks / Lorries"),
        ("Auto-rickshaw occupants", "Auto rickshaws"), ("Bicyclists", "Bicycles"),
        ("Bus occupants", "Buses"),
        ("Other non-motor vehicle users", "Other non-motor vehicles (including e-rickshaw)"),
    ]
    user_rows = []
    for display, label in road_users:
        v = int(row(texts[98], label, 3, 98, "4.4")[1])
        user_rows.append({"label": display, "value": v, "sourceRow": label})
        check(f"road user {display}", v, row(texts[98], label, 3, 98, "4.4")[1], f"MoRTH Table 4.4, PDF p98, {label}, 2024")
    files.append(artifact("road_users.2024", "Road deaths by victim road-user category, 2024", "morth", "4.4", 98,
                          rows=user_rows, note="Victim category of the person killed; not the vehicle responsible. The 'Other' row combines several distinct and unclassified groups."))

    ages = [("Under 18", "Less than 18"), ("18–25", "18-25"), ("25–35", "25-35"),
            ("35–45", "35-45"), ("45–60", "45-60"), ("Over 60", "Above 60"), ("Age unknown", "Age not known")]
    age_rows = []
    for display, label in ages:
        v = int(row(texts[92], label, 3, 92, "4.2")[1])
        age_rows.append({"label": display, "value": v, "sourceRow": label})
        check(f"age {display}", v, row(texts[92], label, 3, 92, "4.2")[1], f"MoRTH Table 4.2, PDF p92, {label}, 2024")
    files.append(artifact("ages.2024", "Road deaths by victim age, 2024", "morth", "4.2", 92,
                          rows=age_rows, note="Published age bands; unknown age is retained. Adjacent labels use shared endpoints in print, but the reported categories sum to the national total."))

    road_classes = [("National highways", "National Highways"), ("State highways", "State Highways"), ("Other roads", "Other roads")]
    class_rows = []
    for display, label in road_classes:
        v = int(row(texts[54], label, 9, 54, "2.1")[4])
        class_rows.append({"label": display, "value": v, "sourceRow": label})
        check(f"road class {display}", v, row(texts[54], label, 9, 54, "2.1")[4], f"MoRTH Table 2.1, PDF p54, {label}, 2024 persons killed")
    files.append(artifact("road_categories.2024", "Road deaths by category of road, 2024", "morth", "2.1", 54,
                          rows=class_rows, note="Share of recorded deaths by road category, not deaths per kilometre travelled or per journey. Road-length context in the report is dated March 2022."))

    who_text = pymupdf.open(WHO)[0].get_text(sort=True)
    reported = re.search(r"Reported fatalities \(year\)\s+([\d ]+) \(2021\)", who_text)
    estimated = re.search(r"WHO estimated road traffic fatalities \(95% CI\) \(year\)\s+([\d ]+) \(95% CI ([\d ]+) - ([\d ]+)\) \(2021\)", who_text)
    if not (reported and estimated):
        raise ValueError("WHO burden counts or interval missing from frozen PDF")
    rep = int(reported.group(1).replace(" ", ""))
    est, low, high = [int(estimated.group(i).replace(" ", "")) for i in (1, 2, 3)]
    if rep != national[2021][2] or not low <= est <= high:
        raise ValueError("WHO 2021 consistency check failed")
    who_rows = [{"label": "Reported fatalities", "value": rep}, {"label": "WHO estimate", "value": est}]
    files.append(artifact("who_reported_estimated.2021", "Reported and WHO-estimated road deaths, 2021", "who", None, 1,
                          rows=who_rows, note=f"Both measures are for 2021. WHO estimate 95% interval: {low:,}–{high:,}. Modelled estimate is not a 2024 correction factor."))
    for item in who_rows:
        check(f"WHO {item['label']}", item["value"], rep if item["label"] == "Reported fatalities" else est, "WHO India country profile, PDF p1, Burden, 2021")

    total = int(national[2024][2])
    for name, items in [("road users", user_rows), ("ages", age_rows), ("road categories", class_rows)]:
        check(f"{name} sum", sum(x["value"] for x in items), total, "MoRTH Table 1.1, PDF p35, 2024 fatalities")
    manifest = [{"indicatorId": d["indicatorId"], "sourceIndicatorId": d["sourceIndicatorId"],
                 "artifact": p, "status": "ready", "source": d["sourceUrl"],
                 "fetchedAt": d["fetchedAt"]} for p, d in files]
    CATALOG.write_text(json.dumps(manifest, indent=2) + "\n")
    with (AUDIT / "source-cell-audit.csv").open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=checked[0].keys(), lineterminator="\n"); writer.writeheader(); writer.writerows(checked)
    result = {"checked": len(checked), "mismatches": sum(not c["match"] for c in checked),
              "source_hashes": HASHES, "who_2021_estimate_interval": [low, high],
              "fatalities_2024": total, "road_user_sum": sum(x["value"] for x in user_rows),
              "age_sum": sum(x["value"] for x in age_rows), "road_category_sum": sum(x["value"] for x in class_rows)}
    (AUDIT / "source-cell-audit.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
