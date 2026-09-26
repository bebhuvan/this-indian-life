#!/usr/bin/env python3
"""Build the authored explanation from the durable, source-checked Markdown."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
QID = "q.health.road_safety_2024"
BODY = ROOT / f"data/prose/{QID}.md"
OUT = ROOT / f"data/explanations/en/{QID}.json"
SOURCE_MORTH = "https://data.opencity.in/dataset/33d29ab0-f9e8-4fc7-b404-c93c1ed8e1b8/resource/30af828c-3513-4c74-a919-8daa708f077d/download/road-accidents-in-india-2024.pdf"
SOURCE_WHO = "https://cdn.who.int/media/docs/default-source/country-profiles/road-safety/road-safety-2023-ind.pdf?download=true&sfvrsn=b4fb5a5c_3"


def load(indicator):
    return json.loads((ROOT / f"data/series/road-safety-2024.{indicator}.json").read_text())


def card(title, takeaway, detail, why, read, mistake, mobile):
    return {"visualId": title, "title": title, "takeaway": takeaway,
            "detail": detail, "whyShowThis": why, "howToRead": read,
            "mistakeToAvoid": mistake, "mobileNote": mobile}


def main():
    body = BODY.read_text().strip()
    headings = re.findall(r"^## (.+)$", body, re.M)
    expected = [
        "Who is being killed on India's roads?", "Is the recorded toll falling?",
        "How old were the people who died?", "Where are the deaths recorded?",
        "How complete is the police record?", "What can these figures say about prevention?",
        "How to read these numbers: methodology and caveats",
    ]
    if headings != expected or body.count("\n## ") != len(expected) - 1:
        raise ValueError("Section order or Markdown heading structure changed")
    fatal = load("fatalities.2020_2024")
    users = load("road_users.2024")
    ages = load("ages.2024")
    roads = load("road_categories.2024")
    who = load("who_reported_estimated.2021")
    death = next(o["value"] for o in fatal["observations"] if o["date"] == "2024")
    values = {x["label"]: x["value"] for x in users["rows"]}
    if death != 177175 or sum(values.values()) != death or sum(x["value"] for x in ages["rows"]) != death or sum(x["value"] for x in roads["rows"]) != death:
        raise ValueError("Article input totals have changed; rereview the prose")
    if [x["value"] for x in who["rows"]] != [153972, 216618]:
        raise ValueError("WHO source values changed; rereview the prose")
    titles = [
        "Two-wheeler users account for almost half of recorded road deaths",
        "The recorded death toll is still climbing",
        "Most recorded victims were between 18 and 45",
        "National and state highways account for nearly six in ten deaths",
    ]
    cards = [
        card(titles[0], "Of 177,175 recorded deaths in 2024, 81,780 were two-wheeler users and 36,526 were pedestrians.",
             "Add 4,161 bicyclists and the three groups make up 122,467 deaths, or 69.1 per cent. The mixed 'Other' row has 11,890 deaths and is left visible. These are categories of the people killed, not of the vehicle or person responsible for a crash.",
             "The article begins with the people most often found in the official death count.",
             "Each bar is a count of people killed in India in 2024, grouped by the victim's road-user category.",
             "Do not read a large bar as a high chance of death per trip; the report supplies no mode-specific travel denominator.",
             "Keep the full 'Other or unclassified' label and value readable so the residual category is not hidden."),
        card(titles[1], "The police-recorded total rose from 172,890 in 2023 to 177,175 in 2024.",
             "The increase is 4,285 deaths, or 2.5 per cent after rounding. The series begins at 138,383 in 2020, when Covid restrictions affected traffic, so the endpoints are not a controlled test of road safety.",
             "A recent time series shows whether the headline count was moving up or down.",
             "Each point is a calendar-year count of people killed in road accidents in the police returns.",
             "The line is not adjusted for kilometres travelled, journeys or vehicle use. Its slope cannot establish a change in per-trip risk.",
             "Label 2023 and 2024 directly; keep the Covid-era start legible without making it the benchmark."),
        card(titles[2], "The published 18–45 age bands add to 117,026 deaths, 66.1 per cent of the recorded total.",
             "Age was unknown for 4,705 victims. Those deaths remain in their own bar. The categories give the ages of people who died, not the age of a driver at fault or risk among all people of that age.",
             "Age changes the human reading of the toll without pretending to measure age-specific risk.",
             "Bars reproduce the report's age bands and retain the unknown-age category.",
             "Do not combine these shares with road-user shares: the same person belongs to an age group and a mode group.",
             "Show 'Age unknown' rather than dropping it from the chart or the denominator."),
        card(titles[3], "National and state highways together account for 104,049 recorded deaths, 58.7 per cent of the total.",
             "National highways alone account for 64,772; state highways for 39,277; other roads for 73,126. The road-length percentages cited in the report are dated March 2022 and cannot stand in for traffic exposure in 2024.",
             "The geographic setting changes the question from who dies to where the deaths are recorded.",
             "The three bars partition 2024 reported deaths by road category.",
             "A large share of deaths on highways is not a death rate per journey or kilometre driven, and does not prove why the deaths occurred.",
             "Keep the three categories and their values on one scale starting at zero."),
    ]
    summaries = []
    for d in [users, fatal, ages, roads, who]:
        annual = d["artifactType"] == "series"
        earliest = d["observations"][0]["date"] if annual else ("2021" if d["sourceId"].startswith("who") else "2024")
        latest = d["observations"][-1]["date"] if annual else earliest
        summaries.append({"indicatorId": d["indicatorId"], "title": d["title"], "sourceId": d["sourceId"],
                          "earliest": earliest, "latest": latest, "unit": d["unit"]})
    locks = [
        {"label": "Police-recorded road deaths, 2024", "value": death, "displayValue": "1,77,175", "date": "2024", "unit": "people", "sourceId": "morth-road-accidents-2024", "indicatorId": fatal["indicatorId"]},
        {"label": "Two-wheeler users killed, 2024", "value": values["Two-wheeler users"], "displayValue": "81,780", "date": "2024", "unit": "people", "sourceId": "morth-road-accidents-2024", "indicatorId": users["indicatorId"]},
        {"label": "WHO-estimated road deaths, 2021", "value": 216618, "displayValue": "about 2.17 lakh", "date": "2021", "unit": "people", "sourceId": "who-road-safety-2023", "indicatorId": who["indicatorId"]},
    ]
    evidence = {"schemaVersion": 1, "questionId": QID, "question": "Who dies on India's roads?", "priority": "core", "theme": "health",
                "requiredIndicatorIds": [d["indicatorId"] for d in [users, fatal, ages, roads, who]],
                "availableIndicatorIds": [d["indicatorId"] for d in [users, fatal, ages, roads, who]],
                "themeIndicatorIds": [], "visualPlan": [], "plannedCharts": [],
                "selectedDataPoints": [], "lockedNumbers": locks, "sourceSummaries": summaries,
                "selectionRules": [], "caveats": [], "forbiddenClaims": []}
    out = {
        "schemaVersion": 1, "questionId": QID, "status": "ready", "dataThrough": "MoRTH 2024; WHO 2021 estimate",
        "short": {"headline": "Most recorded road deaths in India are people on two-wheelers or on foot",
                  "dek": "MoRTH counted 1.77 lakh deaths in 2024. A close reading of who died, where, and how the count is assembled shows both the scale of the loss and the limits of the official record.",
                  "body": "Police returns recorded 177,175 road deaths in India in 2024. Two-wheeler users, pedestrians and bicyclists made up 69.1 per cent of them. The count rose 2.5 per cent from 2023. WHO's modelled estimate for 2021 was materially higher than that year's police count, so the official number needs to be read as a recorded toll, not a complete census."},
        "macha": {"heading": "Okay, macha, what does this mean?",
                  "body": "If someone says 'road accident deaths', it is easy to picture a car crash. The official 2024 count looks different. Nearly half the people recorded as killed were on two-wheelers; about one in five were pedestrians. These labels tell us who was lost, not who caused a crash. And the police count itself may miss deaths that never make it back from the hospital into the accident record.",
                  "soWhat": "Use the figures to ask where protection and reporting need scrutiny. Do not use raw death counts to rank the danger of a journey."},
        "article": {"title": "Who dies on India's roads?", "standfirst": "In 2024, police recorded 177,175 road deaths. Nearly seven in ten victims were two-wheeler users, pedestrians or bicyclists. The official count reveals who bears the toll, and its limits leave a harder measurement question open.", "bodyMarkdown": body},
        "editorialPlan": {"audience": "Indian readers who want to understand the road-death count and its limits",
                          "heroDescription": "A source-checked 2024 victim profile with 2021 WHO measurement context.",
                          "selectedDataPoints": [], "pullQuotes": [],
                          "glossaryBlocks": [
                              {"term": "Police-recorded deaths", "plainMeaning": "Road deaths included in the accident returns supplied by state and union-territory police departments.", "whyItMattersHere": "The count can miss people whose deaths never reach or update the police record.", "keyTerm": True},
                              {"term": "Exposure", "plainMeaning": "How much people use a road or mode, such as journeys or kilometres travelled.", "whyItMattersHere": "Without it, a death count cannot tell us the risk of a comparable trip."},
                              {"term": "Modelled estimate", "plainMeaning": "A statistical estimate produced from multiple data inputs rather than a direct list of recorded deaths.", "whyItMattersHere": "WHO's 2021 figure has an uncertainty interval and cannot be transferred to 2024."}
                          ]},
        "chartExplainers": cards,
        "sectionVisualMap": [{"heading": h, "visualId": t} for h, t in zip(expected[:4], titles)],
        "sourceNotes": [
            {"label": "MoRTH, Road Accidents in India 2024: Tables 1.1 (national series), 2.1 (road category), 4.2 (age), 4.4 (victim road-user category), and Section 10 (reporting method).", "url": SOURCE_MORTH},
            {"label": "WHO, India road safety country profile, published April 2024: reported and estimated road deaths for 2021, with uncertainty interval.", "url": SOURCE_WHO}
        ],
        "caveats": [
            "MoRTH's figures are compiled from police returns; they are not a census of all road-traffic deaths.",
            "Road-user categories identify the victim, not the person or vehicle responsible for a crash.",
            "Counts by age, mode and road category have no matched exposure denominator here and cannot rank per-trip risk.",
            "The WHO estimate and uncertainty interval refer to 2021. They cannot be used to correct the 2024 police count.",
            "The national 2020–24 series includes traffic disruption during Covid restrictions."
        ],
        "lockedNumbersUsed": ["177,175 MoRTH-recorded deaths in 2024", "81,780 two-wheeler users killed in 2024", "122,467 two-wheeler users, pedestrians and bicyclists killed in 2024", "216,618 WHO-estimated deaths in 2021"],
        "qualityFlags": [], "generatedAt": datetime.now(timezone.utc).isoformat(), "model": "editorially authored from locked source packet",
        "generationPasses": [{"pass": "authored", "source": BODY.relative_to(ROOT).as_posix()}],
        "evidence": evidence,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)} with {len(body.split())} body words and {len(cards)} chart explainers")


if __name__ == "__main__":
    main()
