#!/usr/bin/env python3
"""Build a source-locked explanation from the edited article and checked chart artifacts."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
QID = "q.health.road_safety_2024"
BODY = ROOT / f"data/prose/{QID}.md"
OUT = ROOT / f"data/explanations/en/{QID}.json"
MORTH = "https://data.opencity.in/dataset/33d29ab0-f9e8-4fc7-b404-c93c1ed8e1b8/resource/30af828c-3513-4c74-a919-8daa708f077d/download/road-accidents-in-india-2024.pdf"
WHO = "https://cdn.who.int/media/docs/default-source/country-profiles/road-safety/road-safety-2023-ind.pdf?download=true&sfvrsn=b4fb5a5c_3"
CHARTS = [
    ("road_users.2024", "Two-wheeler users account for almost half of recorded deaths", "The victim category describes the person killed. The report has no mode-specific journeys or distance, so these bars cannot rank the risk of a trip."),
    ("pedestrian_impact.2024", "Two-wheelers are the largest recorded impacting group in pedestrian deaths", "Two-wheelers were recorded in 10,378 pedestrian deaths; 7,857 cases have an 'Others' impacting-vehicle label. Impacting vehicle is a police classification, not a finding of fault."),
    ("ages.2024", "Most recorded victims were between 18 and 45", "The three published age bands from 18 to 45 sum to 117,026 deaths. Age is unknown for 4,705 people and stays in the display."),
    ("fatalities.2020_2024", "The recorded death toll is still climbing", "The police count rose from 172,890 in 2023 to 177,175 in 2024. The 2020 starting point was affected by Covid restrictions, and the line is not adjusted for traffic volume."),
    ("rural_urban.2024", "Rural areas account for seven in ten recorded deaths", "Rural areas account for 125,422 recorded deaths and urban areas 51,753. Area of crash is not residence, and these totals do not measure risk per journey."),
    ("road_categories.2024", "National and state highways account for nearly six in ten deaths", "The two highway categories add to 104,049 deaths. Road length is not a measure of traffic carried, so the bars cannot compare the danger of a kilometre travelled."),
    ("states_top_five.2024", "Five states account for nearly half the recorded toll", "The five displayed totals add to 85,463 deaths, or 48.2 per cent of India's police-recorded toll. These are the five largest counts, not a safety ranking of all states."),
    ("collision_types.2024", "Rear impacts and hit-and-run cases are prominent in the police record", "The report records 37,404 deaths in rear-impact cases and 34,030 in hit-and-run cases. One label describes geometry while the other describes a post-crash circumstance; neither establishes a single cause."),
    ("safety_devices.2024", "Police recorded 54,122 deaths without a helmet", "The published helmet and seatbelt rows separate drivers from passengers. Non-use was recorded among victims, but the table does not estimate how many deaths each device would have prevented."),
    ("time_of_day_accidents.2024", "The 6–9 pm window has the most reported crashes", "The 6–9 pm window contains 102,897 accidents. These are crash events rather than deaths, and there is no traffic-by-hour denominator."),
    ("monthly_deaths.2024", "The 2024 death count fluctuates across months", "December records 16,007 deaths and August 12,959. One year of monthly counts cannot establish a seasonal cause without comparable exposure and more years."),
    ("who_reported_estimated.2021", "WHO estimates a higher 2021 toll than police recorded", "WHO's 2021 estimate is 216,618, with a 95 per cent interval of 193,271 to 239,965, against 153,972 reported deaths. This does not supply a correction factor for 2024."),
]
READING = [
    ("Start with the people, because the report also contains vehicle and collision tables that answer different questions.", "Each bar counts victims in one published road-user group.", "A victim category does not identify the person at fault."),
    ("This separates pedestrian victims by the other vehicle recorded in their collision.", "The eight bars add to the 36,526 pedestrian deaths.", "An impacting-vehicle label is not a legal finding about blame."),
    ("Age shows how widely the human cost reaches beyond a vehicle category.", "Compare the published age bands and keep the unknown group in view.", "Counts by age are not risk for a comparable trip."),
    ("A short series places the 2024 headline against recent police returns.", "Read 2023 and 2024 together; treat 2020 as a disrupted traffic year.", "The line has no adjustment for journeys or distance travelled."),
    ("The rural and urban split locates recorded deaths by crash setting.", "The two bars partition the 2024 national total.", "Place of crash is not the victim's place of residence."),
    ("Road class is another location lens that complements the rural split.", "Three road categories add to the 2024 death total.", "Road length alone cannot measure risk per journey."),
    ("State totals show where large reporting and prevention workloads fall.", "These are the five largest state counts, with the rest omitted from the display.", "A raw state ranking is not a safety ranking."),
    ("The police collision labels reveal what kinds of incidents enter the fatality record.", "The nine published groups partition the 2024 deaths.", "The labels mix collision geometry with post-crash circumstances."),
    ("Protective-device records add detail about victims beyond their vehicle type.", "Read helmet and seatbelt rows separately, each split between driver and passenger.", "Recorded non-use does not count individually preventable deaths."),
    ("A crash-event clock answers a different timing question from monthly deaths.", "Each bar is a three-hour interval; unknown time remains visible.", "These are crashes, not fatalities, and lack hourly traffic exposure."),
    ("Monthly deaths reveal variation concealed by one annual total.", "The twelve calendar months sum to 177,175 deaths.", "One year does not establish a seasonal cause."),
    ("A same-year external estimate tests how complete the police count might be.", "Compare the two 2021 point values and read WHO's interval in the text.", "Do not apply the 2021 gap as a multiplier to 2024."),
]


def main():
    body = BODY.read_text().strip()
    headings = re.findall(r"^## (.+)$", body, re.M)
    if len(headings) != len(CHARTS) + 2 or body.count("\n## ") != len(headings) - 1:
        raise ValueError("Expected one chart section per chart, then prevention and methodology")
    docs = [json.loads((ROOT / f"data/series/road-safety-2024.{slug}.json").read_text()) for slug, _, _ in CHARTS]
    death = next(x["value"] for x in docs[3]["observations"] if x["date"] == "2024")
    if death != 177175 or sum(x["value"] for x in docs[0]["rows"]) != death:
        raise ValueError("Locked national count changed; review prose")
    old = json.loads(OUT.read_text())
    cards = []
    mobile_notes = [
        "Long road-user labels wrap; read the value beside each bar.",
        "Keep the mixed Other group visible when reading pedestrian collisions.",
        "Do not lose the Age unknown row at the bottom.",
        "Read the labelled 2023 and 2024 points together.",
        "Both area bars use the same count scale.",
        "The three road classes use one shared scale.",
        "Long state names may wrap; the counts stay aligned.",
        "The mixed Others collision group remains visible.",
        "Helmet and belt rows refer to different vehicle situations.",
        "Time labels use a 24-hour clock; unknown time is shown.",
        "Months are in calendar order, not ranked by size.",
        "The uncertainty interval is stated in the adjoining text.",
    ]
    for (slug, title, detail), doc, (why, how, mistake), mobile in zip(CHARTS, docs, READING, mobile_notes):
        values = [x["value"] for x in doc.get("rows", doc.get("observations", []))]
        if not values:
            raise ValueError(f"Empty chart: {slug}")
        takeaway, _, rest = detail.partition(". ")
        cards.append({"visualId": title, "title": title, "takeaway": takeaway + ".",
            "detail": rest, "whyShowThis": why, "howToRead": how,
            "mistakeToAvoid": mistake, "mobileNote": mobile})
    old["short"] = {
        "headline": "India's road-death record is larger and more complicated than one headline number",
        "dek": "A close reading of MoRTH's 2024 report shows who was killed, where crashes occurred, and what its police returns still cannot tell us.",
        "body": "Police returns counted 177,175 road deaths in 2024, up 2.5 per cent from 2023. Two-wheeler users, pedestrians and bicyclists made up 69.1 per cent of recorded victims. Rural areas accounted for 70.8 per cent. Those are counts of reported harm, not per-trip risk or a complete mortality census."
    }
    old["macha"] = {"heading": "Okay, macha, what does this mean?",
        "body": "The 2024 report says much more than '1.77 lakh deaths'. It shows that two-wheeler users and pedestrians carry a large share of the loss, most recorded deaths occur in rural areas, and evening has the most reported crashes. But the tables mix people, crash events and police labels. The WHO's higher estimate for 2021 also warns us that the police count may be incomplete.",
        "soWhat": "Use each chart to ask a more precise question. Do not turn raw counts into risk rankings or police categories into proven causes."}
    old["article"] = {"title": "What do India's road-death figures reveal?",
        "standfirst": "MoRTH's 2024 report records 177,175 road deaths. Twelve source-checked views of the report reveal who bears the toll, where it is recorded, and what the police data cannot settle.", "bodyMarkdown": body}
    old["chartExplainers"] = cards
    old["sectionVisualMap"] = [{"heading": h, "visualId": title} for h, (_, title, _) in zip(headings, CHARTS)]
    old["sourceNotes"] = [
        {"label": "MoRTH, Road Accidents in India 2024: Tables 1.1, 1.5, 2.1, 3.3, 4.2, 4.4, 4.5, 5.6, 7.1, 7.2 and 7.3; Section 10 reporting method.", "url": MORTH},
        {"label": "WHO, India road safety country profile: reported and estimated 2021 road deaths with uncertainty interval.", "url": WHO},
    ]
    old["caveats"] = [
        "MoRTH compiles police returns; deaths after a crash may not be fully linked from hospitals into the police record.",
        "Victim, impacting-vehicle and collision labels do not determine fault or isolate a cause.",
        "The time-of-day chart counts accidents; most other charts count deaths. Do not compare their heights as if they share a unit.",
        "Counts lack matched travel exposure and cannot rank per-trip or per-kilometre risk.",
        "The WHO estimate refers to 2021 and cannot be applied as a multiplier to 2024.",
    ]
    summaries = []
    for doc in docs:
        annual = doc["artifactType"] == "series"
        start = doc["observations"][0]["date"] if annual else ("2021" if doc["sourceId"].startswith("who") else "2024")
        end = doc["observations"][-1]["date"] if annual else start
        summaries.append({"indicatorId": doc["indicatorId"], "title": doc["title"], "sourceId": doc["sourceId"],
            "earliest": start, "latest": end, "unit": doc["unit"]})
    old["evidence"]["question"] = old["article"]["title"]
    old["evidence"]["requiredIndicatorIds"] = [d["indicatorId"] for d in docs]
    old["evidence"]["availableIndicatorIds"] = [d["indicatorId"] for d in docs]
    old["evidence"]["sourceSummaries"] = summaries
    old["editorialPlan"]["audience"] = "Indian readers seeking a careful account of the 2024 road-death record and its limits"
    old["generatedAt"] = datetime.now(timezone.utc).isoformat()
    OUT.write_text(json.dumps(old, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(CHARTS)} chart explainers, {len(headings)} sections, {len(body.split())} body words")

if __name__ == "__main__":
    main()
