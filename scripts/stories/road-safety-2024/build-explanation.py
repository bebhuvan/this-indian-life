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
    ("fatalities.2020_2024", "The recorded death toll is still climbing", "The police count rose from 172,890 in 2023 to 177,175 in 2024. The 2020 starting point was affected by Covid restrictions, and the line is not adjusted for traffic volume."),
    ("severity.2005_2024", "More people died per reported accident in 2024 than in 2005", "MoRTH's published severity measure was 21.6 in 2005, peaked at 37.3 in 2021, and stood at 36.3 people killed per 100 reported accidents in 2024. It is not the share of crashes that were fatal or risk per journey; changes in the reporting of nonfatal crashes can affect it."),
    ("road_users.2024", "Two-wheeler users account for almost half of recorded deaths", "The victim category describes the person killed. The report has no mode-specific journeys or distance, so these bars cannot rank the risk of a trip."),
    ("sex.2024", "Men account for nearly 86 per cent of recorded road deaths", "MoRTH recorded 151,950 male and 25,225 female road deaths in 2024. These are victim counts and do not compare risk per trip; the table publishes only two sex categories."),
    ("ages.2024", "Most recorded victims were between 18 and 45", "The three published age bands from 18 to 45 sum to 117,026 deaths. Age is unknown for 4,705 people and stays in the display."),
    ("rural_urban.2024", "Rural areas account for seven in ten recorded deaths", "Rural areas account for 125,422 recorded deaths and urban areas 51,753. Area of crash is not residence, and these totals do not measure risk per journey."),
    ("road_categories.2024", "National and state highways account for nearly six in ten deaths", "The two highway categories add to 104,049 deaths. Road length is not a measure of traffic carried, so the bars cannot compare the danger of a kilometre travelled."),
    ("states_top_five.2024", "Five states account for nearly half the recorded toll", "The five displayed totals add to 85,463 deaths, or 48.2 per cent of India's police-recorded toll. These are the five largest counts, not a safety ranking of all states."),
    ("collision_types.2024", "Rear impacts and hit-and-run cases are prominent in the police record", "The report records 37,404 deaths in rear-impact cases and 34,030 in hit-and-run cases. One label describes geometry while the other describes a post-crash circumstance; neither establishes a single cause."),
    ("safety_devices.2024", "Police recorded 54,122 deaths without a helmet", "The published helmet and seatbelt rows separate drivers from passengers. Non-use was recorded among victims, but the table does not estimate how many deaths each device would have prevented."),
    ("time_of_day_accidents.2024", "The 6–9 pm window has the most reported crashes", "The 6–9 pm window contains 102,897 accidents. These are crash events rather than deaths; the report does not count the journeys made in each time window."),
    ("who_reported_estimated.2021", "World Health Organization's 2021 road-death estimate exceeds the police count", "The World Health Organization (WHO) estimated 216,618 road deaths in India in 2021, with a 95 per cent interval from 193,271 to 239,965; police recorded 153,972. The 2021 gap cannot be applied to the 2024 police count."),
]
READING = [
    ("A short series places the 2024 headline against recent police returns.", "Read 2023 and 2024 together; treat 2020 as a disrupted traffic year.", "The line has no adjustment for journeys or distance travelled."),
    ("The report's long-run severity series raises a question about deaths relative to reported crashes.", "Each point is people killed divided by police-reported crash events, times 100.", "A value above 30 does not mean over 30 per cent of crashes were fatal."),
    ("Start with the people, because vehicle and collision tables answer different questions.", "Each bar counts victims in one published road-user group.", "A victim category does not identify the person at fault."),
    ("The sex split gives context to the pedestrian article's within-sex comparison.", "The two bars sum to all recorded road deaths in 2024.", "Counts cannot compare danger per trip without travel exposure."),
    ("Age shows how widely the human cost reaches beyond a vehicle category.", "Compare the published age bands and keep the unknown group in view.", "Counts by age are not risk for a comparable trip."),
    ("The rural and urban split locates recorded deaths by crash setting.", "The two bars partition the 2024 national total.", "Place of crash is not the victim's place of residence."),
    ("Road class is another location lens that complements the rural split.", "Three road categories add to the 2024 death total.", "Road length alone cannot measure risk per journey."),
    ("State totals show where large reporting and prevention workloads fall.", "These are the five largest state counts, with the rest omitted from the display.", "A raw state ranking is not a safety ranking."),
    ("The police collision labels show what enters the fatality record.", "The nine published groups partition the 2024 deaths.", "The labels mix collision geometry with post-crash circumstances."),
    ("Protective-device records add detail about victims beyond their vehicle type.", "Read helmet and seatbelt rows separately, each split between driver and passenger.", "Recorded non-use does not count individually preventable deaths."),
    ("A crash-event clock answers a different timing question from annual fatalities.", "Each bar is a three-hour interval; unknown time remains visible.", "These are crashes, not fatalities, and lack hourly traffic exposure."),
    ("A same-year external estimate tests how complete the police count might be.", "Compare the two 2021 values and read the estimated range in the text.", "Do not apply the 2021 gap as a multiplier to 2024."),
]


def main():
    body = BODY.read_text().strip()
    headings = re.findall(r"^## (.+)$", body, re.M)
    if len(headings) != len(CHARTS) + 2 or body.count("\n## ") != len(headings) - 1:
        raise ValueError("Expected one chart section per chart, then prevention and methodology")
    docs = [json.loads((ROOT / f"data/series/road-safety-2024.{slug}.json").read_text()) for slug, _, _ in CHARTS]
    death = next(x["value"] for x in docs[0]["observations"] if x["date"] == "2024")
    if death != 177175 or sum(x["value"] for x in docs[2]["rows"]) != death:
        raise ValueError("Locked national count changed; review prose")
    old = json.loads(OUT.read_text())
    cards = []
    mobile_notes = [
        "Read the labelled 2023 and 2024 points together.",
        "The unit is people killed per 100 reported crash events.",
        "Long road-user labels wrap; read the value beside each bar.",
        "Both sex categories use the same count scale.",
        "Do not lose the Age unknown row at the bottom.",
        "Both area bars use the same count scale.",
        "The three road classes use one shared scale.",
        "Long state names may wrap; the counts stay aligned.",
        "The mixed Others collision group remains visible.",
        "Helmet and belt rows refer to different vehicle situations.",
        "Time labels use a 24-hour clock; unknown time is shown.",
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
        "headline": "177,175 people were recorded as killed on India’s roads in 2024",
        "dek": "The Ministry of Road Transport and Highways' Road Accidents in India 2024 counts 177,175 road deaths from police returns. It shows who died, where those deaths were recorded, and what the figures cannot explain.",
        "body": "The Ministry of Road Transport and Highways' Road Accidents in India 2024 records 177,175 road deaths in 2024 from state and union-territory police returns, up 2.5 per cent from 2023. Two-wheeler users, pedestrians and bicyclists made up 69.1 per cent of recorded victims; rural areas accounted for 70.8 per cent. These are counts of reported deaths, not the risk of a journey or a complete count of everyone who died."
    }
    old["macha"] = {"heading": "Okay, macha, what does this mean?",
        "body": "The Ministry of Road Transport and Highways' Road Accidents in India 2024 records 177,175 road deaths. People on two-wheelers and on foot make up a large share of those deaths, and most recorded deaths occurred in rural areas. The report counts 36.3 people killed per 100 reported accidents in 2024, compared with 21.6 in 2005; that measure is not the share of fatal crashes. The busiest three-hour period for reported crashes was 6 pm to 9 pm; that table counts crashes, not deaths. The World Health Organization's estimate for 2021 is higher than that year's police count, a warning that the police record may be incomplete.",
        "soWhat": "Read each figure for what it counts: a person killed, a crash event or a police category. The report does not count journeys, so it cannot tell us the risk of a trip or prove what caused an individual death."}
    old["article"] = {"title": "What do India's road-death figures reveal?",
        "standfirst": "The Ministry of Road Transport and Highways' Road Accidents in India 2024 records 177,175 road deaths from police returns. The tables show who died and where the deaths were recorded, while leaving the risk of a journey and the causes of individual crashes unresolved.", "bodyMarkdown": body}
    old["chartExplainers"] = cards
    old["editorialPlan"]["pullQuotes"] = [{
        "numberLabel": "Police-recorded road deaths, 2024",
        "quote": "People killed in road crashes in India in 2024, according to police records. That was 4,285 more than in 2023."
    }]
    old["sectionVisualMap"] = [{"heading": h, "visualId": title} for h, (_, title, _) in zip(headings, CHARTS)]
    old["sourceNotes"] = [
        {"label": "Ministry of Road Transport and Highways, Road Accidents in India 2024: Tables 1.1, 1.5, 1.6, 2.1, 3.3, 4.2, 4.3, 4.4, 5.6, 7.1 and 7.3; Section 10 reporting method.", "url": MORTH},
        {"label": "World Health Organization, India road safety country profile: reported and estimated 2021 road deaths with uncertainty interval.", "url": WHO},
    ]
    old["caveats"] = [
        "The Ministry of Road Transport and Highways compiles police returns; deaths after a crash may not be fully linked from hospitals into the police record.",
        "Victim, impacting-vehicle and collision labels do not determine fault or isolate a cause.",
        "The severity chart counts people killed per 100 reported accidents. The time-of-day chart counts accidents; most other charts count deaths. Do not compare their heights as if they share a unit.",
        "Counts lack matched travel exposure and cannot rank per-trip or per-kilometre risk.",
        "The World Health Organization estimate refers to 2021 and cannot be applied as a multiplier to 2024.",
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
    for block in old["editorialPlan"].get("glossaryBlocks", []):
        if block.get("term") == "Modelled estimate":
            block["whyItMattersHere"] = "The World Health Organization's 2021 figure has an uncertainty interval and cannot be transferred to 2024."
    old["generatedAt"] = datetime.now(timezone.utc).isoformat()
    OUT.write_text(json.dumps(old, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(CHARTS)} chart explainers, {len(headings)} sections, {len(body.split())} body words")

if __name__ == "__main__":
    main()
