#!/usr/bin/env python3
"""Ingest India's hourly electricity demand + solar + wind and build the duck-curve
artifacts for q.energy.demand_shape.

Source: Mendeley Data "Electricity Demand, Solar and Wind Generation Data
(September 2021 - June 2025) of India at 1-hour interval", CC-BY 4.0, compiled from
Grid-India (National/Regional Load Despatch Centres), Ministry of Power.
  https://data.mendeley.com/datasets/y58jknpgs8/2

We use the recent, compact monthly file (Jan 2024 - Jun 2025), snapshot it raw, then
derive two table artifacts from the 2024 full calendar year:

  energy.griddemand.duck_summer        -- summer typical day: demand vs solar vs net
                                          (demand - solar). The actual net-demand duck.
  energy.griddemand.day_shape_seasonal -- typical-day demand shape, summer/monsoon/winter
                                          overlaid (shows the daily peak moving by season).

Run:  python3 scripts/ingest-mendeley-grid-demand.py
"""
import datetime, hashlib, json, os, urllib.request
from collections import defaultdict

import openpyxl

FILE_URL = ("https://data.mendeley.com/public-files/datasets/y58jknpgs8/files/"
            "c67cbcfa-f33b-49c0-925d-d6e1cda3a9c1/file_downloaded")
DATASET_URL = "https://data.mendeley.com/datasets/y58jknpgs8/2"
SOURCE_ID = "grid-india"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def snapshot_raw(name, body):
    h = hashlib.sha256(body).hexdigest()
    d = os.path.join(ROOT, "data", "snapshots", SOURCE_ID)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{name}.{h[:12]}.xlsx")
    with open(path, "wb") as f:
        f.write(body)
    return path


def write_artifact(name, artifact):
    d = os.path.join(ROOT, "data", "series")
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{name}.json")
    with open(path, "w") as f:
        f.write(json.dumps(artifact, indent=2) + "\n")
    return path


def season(month):
    if month in (3, 4, 5):
        return "summer"
    if month in (6, 7, 8, 9):
        return "monsoon"
    if month in (12, 1, 2):
        return "winter"
    return "postmonsoon"


def main():
    req = urllib.request.Request(FILE_URL, headers={"User-Agent": "Mozilla/5.0 (indica-ingest)"})
    raw = urllib.request.urlopen(req, timeout=120).read()
    snap = snapshot_raw("mendeley-y58jknpgs8-jan2024-jun2025", raw)
    print(f"snapshot: {snap} ({len(raw):,} bytes)")

    tmp = os.path.join(ROOT, "data", "snapshots", SOURCE_ID, "_tmp_mendeley.xlsx")
    with open(tmp, "wb") as f:
        f.write(raw)
    wb = openpyxl.load_workbook(tmp, read_only=True, data_only=True)
    ws = wb["Report"]
    it = ws.iter_rows(values_only=True)
    next(it)  # header: Timestamp, Demand (MW), Wind (MW), Solar (MW), Total Generation (MW)

    # accumulate sums per (season, hour) for the 2024 calendar year
    acc = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0]))  # season->hour->[demand, solar, n]
    for r in it:
        ts = r[0]
        if isinstance(ts, str):
            try:
                ts = datetime.datetime.strptime(ts.strip(), "%d-%m-%Y %H:%M:%S")
            except ValueError:
                continue
        elif not isinstance(ts, datetime.datetime):
            continue
        if ts.year != 2024:
            continue
        try:
            demand, solar = float(r[1]), float(r[3] or 0)
        except (TypeError, ValueError):
            continue
        a = acc[season(ts.month)][ts.hour]
        a[0] += demand
        a[1] += solar
        a[2] += 1
    os.remove(tmp)

    def avg(s):
        out = []
        for h in range(24):
            d, sol, n = acc[s][h]
            n = n or 1
            out.append((h, round(d / n / 1000, 1), round(sol / n / 1000, 1)))  # GW
        return out

    summer = avg("summer")
    fetched_at = datetime.datetime.utcnow().isoformat() + "Z"

    # --- artifact 1: the duck (summer typical day) ---
    duck_rows = [
        {"hour": h, "demand": d, "solar": sol, "net": round(d - sol, 1)}
        for (h, d, sol) in summer
    ]
    net = [row["net"] for row in duck_rows]
    peak_hour = max(range(24), key=lambda h: net[h])
    duck = {
        "schemaVersion": 1, "artifactType": "table",
        "indicatorId": "energy.griddemand.duck_summer",
        "title": "The duck curve arrives: demand, solar and what's left",
        "sourceId": SOURCE_ID, "sourceIndicatorId": "mendeley:y58jknpgs8:summer2024",
        "sourceUrl": DATASET_URL, "unit": "GW",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": ["hour", "demand", "solar", "net"], "fetchedAt": fetched_at,
        "rows": duck_rows,
        "metadata": {
            "series": [
                {"key": "demand", "label": "Electricity demand", "emphasis": True},
                {"key": "solar", "label": "Solar generation", "color": "#cf9a3f", "area": True},
                {"key": "net", "label": "Demand net of solar", "color": "#3f8378"},
            ],
            "gap": {"fromHour": 18, "toHour": 22, "label": "Evening peak, solar gone"},
            "peakHour": peak_hour,
            "season": "Summer (Mar-May) 2024 average day",
            "originalSource": "Grid-India (Load Despatch Centres), via Mendeley Data CC-BY 4.0",
        },
    }
    print("wrote", write_artifact("grid-india.IN.demand.duck-summer", duck))

    # --- artifact 2: seasonal demand shapes ---
    seas = {s: avg(s) for s in ("summer", "monsoon", "winter")}
    shape_rows = [
        {"hour": h,
         "summer": seas["summer"][h][1],
         "monsoon": seas["monsoon"][h][1],
         "winter": seas["winter"][h][1]}
        for h in range(24)
    ]
    shape = {
        "schemaVersion": 1, "artifactType": "table",
        "indicatorId": "energy.griddemand.day_shape_seasonal",
        "title": "When the day peaks, by season",
        "sourceId": SOURCE_ID, "sourceIndicatorId": "mendeley:y58jknpgs8:seasonal2024",
        "sourceUrl": DATASET_URL, "unit": "GW",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": ["hour", "summer", "monsoon", "winter"], "fetchedAt": fetched_at,
        "rows": shape_rows,
        "metadata": {
            "series": [
                {"key": "summer", "label": "Summer (Mar-May)", "emphasis": True},
                {"key": "monsoon", "label": "Monsoon (Jun-Sep)", "color": "#3f8378"},
                {"key": "winter", "label": "Winter (Dec-Feb)", "color": "#7e6ba6"},
            ],
            "originalSource": "Grid-India (Load Despatch Centres), via Mendeley Data CC-BY 4.0",
        },
    }
    print("wrote", write_artifact("grid-india.IN.demand.day-shape-seasonal", shape))


if __name__ == "__main__":
    main()
