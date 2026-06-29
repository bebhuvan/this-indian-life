#!/usr/bin/env python3
"""Ingest data for q.policy.internet_control — "India's off switch".

Sources (every series carries a precise sourceUrl):
  - SFLC.in Internet Shutdowns Tracker JSON endpoints (internetshutdowns.in)
      /get-shutdowns-year, /get-graph-nature, /get-graph-time, /getAllShutdowns
  - dnsblocks.in "Poisoned Wells" DNS-censorship blocklist CSV (43k domains x 6 ISPs)
  - Access Now / #KeepItOn STOP platform-blocking dataset (Google Sheet CSV) — India rows
  - Section 69A URL-blocking counts disclosed to Parliament (MeitY) — manual, multi-answer
  - ICRIER (2018) "The Anatomy of an Internet Blackout" — authoritative India cost study
  - App/platform ban timeline — manual, curated from notifications + reporting

Run:  python3 scripts/ingest-offswitch.py
Re-run is idempotent. Restart the dev server after running (data-file change).
"""

import csv
import io
import json
import os
import ssl
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERIES_DIR = os.path.join(ROOT, "data", "series")
SNAP_DIR = os.path.join(ROOT, "data", "snapshots", "offswitch")
COOLING = os.path.join(ROOT, "data", "series", "cooling.IN.cooler_by_state.json")
TMP = "/tmp/offswitch"  # fallback copies from interactive recon
NOW = datetime.now(timezone.utc).isoformat()

os.makedirs(SERIES_DIR, exist_ok=True)
os.makedirs(SNAP_DIR, exist_ok=True)

_CTX = ssl.create_default_context()


def fetch(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (indica-ingest)"})
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
        return r.read()


def fetch_text(url, fallback_name=None, **kw):
    try:
        return fetch(url, **kw).decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        if fallback_name:
            p = os.path.join(TMP, fallback_name)
            if os.path.exists(p):
                print(f"  ! live fetch failed ({e}); using fallback {p}")
                return open(p, encoding="utf-8", errors="replace").read()
        raise


def sflc_json(path, fallback):
    raw = fetch_text("https://internetshutdowns.in" + path, fallback)
    return json.loads(raw)


def snap(name, payload):
    with open(os.path.join(SNAP_DIR, name), "w", encoding="utf-8") as f:
        f.write(payload if isinstance(payload, str) else json.dumps(payload, indent=2))


def write_artifact(filename, art):
    with open(os.path.join(SERIES_DIR, filename), "w", encoding="utf-8") as f:
        f.write(json.dumps(art, indent=2) + "\n")
    print(f"  wrote data/series/{filename}  ({art['artifactType']}, {art['indicatorId']})")


def base(indicator_id, title, source_id, source_iid, source_url, unit, **extra):
    art = {
        "schemaVersion": 1,
        "artifactType": "series",
        "indicatorId": indicator_id,
        "title": title,
        "sourceId": source_id,
        "sourceIndicatorId": str(source_iid),
        "sourceUrl": source_url,
        "unit": unit,
        "frequency": "annual",
        "geography": {"type": "country", "id": "IN", "name": "India"},
        "dimensions": [],
        "fetchedAt": NOW,
        "metadata": {},
    }
    art.update(extra)
    return art


# ---------------------------------------------------------------------------
# 1. SFLC shutdowns — annual count, nature, duration, by-state
# ---------------------------------------------------------------------------
def ingest_sflc():
    print("SFLC internet shutdowns tracker ...")
    year = sflc_json("/get-shutdowns-year", "sflc_year.json")["msg"]
    nature = sflc_json("/get-graph-nature", "sflc_get-graph-nature.json")["msg"]
    timeb = sflc_json("/get-graph-time", "sflc_get-graph-time.json")["duration_data"]
    allst_raw = sflc_json("/getAllShutdowns", "sflc_allstates.json")["msg"]
    allst = json.loads(allst_raw) if isinstance(allst_raw, str) else allst_raw
    snap("sflc_year.json", year)
    snap("sflc_nature.json", nature)
    snap("sflc_duration.json", timeb)
    snap("sflc_allstates.json", allst)

    SRC = "https://internetshutdowns.in/"
    years = sorted(int(y) for y in year)
    latest = max(years)

    # 1a. annual count series
    annual = base(
        "policy.shutdowns.annual",
        "Internet shutdowns ordered in India, per year",
        "sflc", "get-shutdowns-year", SRC, "shutdowns per year",
    )
    annual["observations"] = [{"date": str(y), "value": year[str(y)]} for y in years]
    total = sum(year[str(y)] for y in years)
    annual["metadata"] = {
        "note": (
            f"Government-ordered internet suspensions recorded by SFLC.in's tracker, "
            f"2012-{latest}. {latest} is a partial, year-to-date count. SFLC reconstructs "
            "incidents from news reports and notifications; because the government rarely "
            "publishes shutdown orders, every count is a documented floor, not a ceiling. "
            f"Cumulative recorded: {total} across all years."
        )
    }
    write_artifact("offswitch.IN.shutdowns_annual.json", annual)

    # 1b. nature: preventive vs reactive — two series for a multiLine
    prev_tot = sum(nature[str(y)]["preventive"] for y in years)
    react_tot = sum(nature[str(y)]["reactive"] for y in years)
    nature_note = (
        "Preventive shutdowns are imposed in anticipation of an event (an exam, a protest, "
        "a sensitive anniversary); reactive ones respond to an unfolding situation. Across "
        f"the record, preventive shutdowns ({prev_tot}) outnumber reactive ones "
        f"({react_tot}) — most blackouts are imposed before anything has happened. "
        "Classification by SFLC.in."
    )
    for key, label in (("preventive", "Preventive (before any event)"),
                       ("reactive", "Reactive (during an event)")):
        s = base(
            f"policy.shutdowns.{key}",
            f"{label} shutdowns, per year",
            "sflc", "get-graph-nature", SRC, "shutdowns per year",
        )
        s["observations"] = [{"date": str(y), "value": nature[str(y)][key]} for y in years]
        s["metadata"] = {"note": nature_note}
        write_artifact(f"offswitch.IN.shutdowns_{key}.json", s)

    # 1c. duration buckets — cumulative across all years (tableBars)
    buckets = [("Under 24 hours", "lte_24"), ("24 to 72 hours", "gte_24_lte_72"),
               ("Over 72 hours", "gte_72"), ("Duration never disclosed", "none")]
    dur = base(
        "policy.shutdowns.duration",
        "How long shutdowns last, and how often we simply don't know",
        "sflc", "get-graph-time", SRC, "shutdowns, 2012-" + str(latest),
        artifactType="table",
        dimensions=["label", "value", "group"],
    )
    dur["rows"] = [
        {"label": lab,
         "value": sum(timeb[str(y)][k] for y in years if str(y) in timeb),
         "group": "All recorded shutdowns"}
        for lab, k in buckets
    ]
    unknown = sum(timeb[str(y)]["none"] for y in years if str(y) in timeb)
    grand_dur = sum(r["value"] for r in dur["rows"])
    dur["metadata"] = {
        "note": (
            f"Every recorded shutdown, 2012-{latest}, bucketed by duration (SFLC.in). The "
            f"single largest bucket is 'never disclosed' ({unknown} of {grand_dur}, "
            f"{100*unknown/grand_dur:.0f}%): because orders are rarely published, the length "
            "of most blackouts can only be guessed from news reports that seldom say when "
            "the internet came back. The opacity is the point."
        )
    }
    write_artifact("offswitch.IN.shutdowns_duration.json", dur)

    # 1d. by-state: merge spellings, map onto choropleth paths
    raw_counts = Counter()
    for rec in allst:
        f = rec["fields"]
        raw_counts[f["state"]] += f["totalNumber"]
    # normalise names to the choropleth region names
    name_map = {
        "Jammu & Kashmir": "Jammu and Kashmir",
        "NCT of Delhi": "Delhi",
    }
    counts = Counter()
    for st, v in raw_counts.items():
        counts[name_map.get(st, st)] += v
    grand = sum(counts.values())

    cooling = json.load(open(COOLING, encoding="utf-8"))
    regions = []
    for r in cooling["regions"]:
        regions.append({"name": r["name"], "value": counts.get(r["name"]), "path": r["path"]})
    matched = sum(v for k, v in counts.items() if any(rr["name"] == k for rr in cooling["regions"]))
    unmatched = {k: v for k, v in counts.items()
                 if not any(rr["name"] == k for rr in cooling["regions"])}
    if unmatched:
        print(f"  ! unmatched states (not on map): {unmatched}")
    vals = [r["value"] for r in regions if r["value"]]
    jk = counts.get("Jammu and Kashmir", 0)
    choro = {
        "schemaVersion": 1,
        "sourceId": "sflc",
        "sourceIndicatorId": "getAllShutdowns",
        "sourceUrl": SRC,
        "geography": {"type": "subnational", "id": "IND-states", "name": "India states"},
        "fetchedAt": NOW,
        "metadata": {
            "note": (
                f"Cumulative government-ordered internet shutdowns by state, 2012-{latest} "
                f"(SFLC.in). Jammu & Kashmir alone accounts for {jk} of {grand} "
                f"({100*jk/grand:.0f}%) — nearly half of every shutdown India has recorded. "
                "Two J&K spellings in the source are merged; 'NCT of Delhi' is mapped to "
                "Delhi. States with no recorded shutdown show as no-data."
            ),
            "total": grand,
            "jammu_kashmir": jk,
        },
        "artifactType": "choropleth",
        "indicatorId": "policy.shutdowns.by_state",
        "title": "Where India goes dark",
        "unit": "shutdowns, 2012-" + str(latest),
        "viewBox": cooling["viewBox"],
        "min": 0,
        "max": max(vals),
        "regions": regions,
    }
    write_artifact("offswitch.IN.shutdowns_by_state.json", choro)

    # 1e. ranked bar — top states (tableBars)
    top = counts.most_common(12)
    ranked = base(
        "policy.shutdowns.state_ranked",
        "The states that go dark most",
        "sflc", "getAllShutdowns", SRC, "shutdowns, 2012-" + str(latest),
        artifactType="table",
        dimensions=["label", "value", "group"],
    )
    ranked["rows"] = [{"label": st, "value": v, "group": "Total shutdowns, 2012-" + str(latest)}
                      for st, v in top]
    ranked["metadata"] = {
        "note": (
            f"Top 12 states by cumulative recorded shutdowns, 2012-{latest} (SFLC.in). "
            f"Jammu & Kashmir ({jk}) is in a category of its own; Rajasthan is a distant "
            "second. Most of India has never had a single recorded shutdown."
        )
    }
    write_artifact("offswitch.IN.shutdowns_state_ranked.json", ranked)


# ---------------------------------------------------------------------------
# 2. dnsblocks.in — DNS-censorship blocklist by category and by ISP
# ---------------------------------------------------------------------------
CAT_LABELS = {
    "MOV": "Movies & TV", "UNCAT": "Uncategorised", "PORN": "Pornography",
    "FILE": "File sharing", "GMB": "Gambling", "LIVE": "Live-streaming piracy",
    "MISC": "Miscellaneous", "MAL": "Malware", "IPTM": "IP / trademark",
    "MUS": "Music & audio", "MILX": "Terrorism / militants",
    "ICAP": "Child-abuse networks", "ESC": "Escort services",
    "VISA": "Visa & immigration", "BIZ": "Business", "COMM": "E-commerce",
    "NEWS": "News media", "HOST": "Hosting / blogging", "PASTE": "Text sharing",
    "COIN": "Cryptocurrency", "POLR": "Political criticism", "GAME": "Gaming",
    "GRP": "Social networking", "ANON": "Circumvention tools", "GOVT": "Government",
}
# super-grouping for the chart (which kinds of thing get DNS-blocked?)
SUPER = {
    "MOV": "Piracy & streaming", "LIVE": "Piracy & streaming", "FILE": "Piracy & streaming",
    "MUS": "Piracy & streaming", "IPTM": "Piracy & streaming",
    "PORN": "Adult & gambling", "GMB": "Adult & gambling", "ESC": "Adult & gambling",
    "MAL": "Security & abuse", "MILX": "Security & abuse", "ICAP": "Security & abuse",
    "NEWS": "Speech & access", "POLR": "Speech & access", "GOVT": "Speech & access",
    "GRP": "Speech & access", "ANON": "Speech & access", "HOST": "Speech & access",
    "PASTE": "Speech & access",
}


def ingest_dnsblocks():
    print("dnsblocks.in DNS-censorship blocklist ...")
    text = fetch_text("https://dnsblocks.in/data/compiled_blocklist.csv",
                      "dnsblocks.csv", timeout=120)
    snap("dnsblocks_blocklist.csv", text)
    SRC = "https://dnsblocks.in/"
    isps = ["ACT", "AIRTEL", "CONNECT", "JIO", "MTNL", "YOU"]
    isp_label = {"ACT": "ACT", "AIRTEL": "Airtel", "CONNECT": "Connect",
                 "JIO": "Jio", "MTNL": "MTNL", "YOU": "You Broadband"}
    cat = Counter()
    isp_tot = Counter()
    reader = csv.DictReader(io.StringIO(text))
    total = 0
    for row in reader:
        total += 1
        cat[row["category"]] += 1
        for i in isps:
            if row.get(i) == "1":
                isp_tot[i] += 1

    # 2a. by category (tableBars, super-grouped)
    bycat = base(
        "policy.blocking.dns_by_category",
        "What India's ISPs actually DNS-block",
        "dnsblocks", "compiled_blocklist", SRC, "blocked domains",
        artifactType="table",
        dimensions=["label", "value", "group"],
    )
    rows = []
    for code, n in cat.most_common():
        if n < 50:  # keep the chart legible; tail summarised in note
            continue
        rows.append({"label": CAT_LABELS.get(code, code), "value": n,
                     "group": SUPER.get(code, "Other / unsorted")})
    bycat["rows"] = rows
    piracy = sum(n for c, n in cat.items() if SUPER.get(c) == "Piracy & streaming")
    speech = sum(n for c, n in cat.items() if SUPER.get(c) == "Speech & access")
    bycat["metadata"] = {
        "note": (
            f"All {total:,} domains found DNS-blocked across six major Indian ISPs by the "
            "'Poisoned Wells' study (dnsblocks.in), classified using the Citizen Lab "
            f"taxonomy. Piracy and streaming dominate ({piracy:,} domains); content tied to "
            f"speech and access — news, political criticism, government, circumvention tools "
            f"— is a sliver ({speech:,}). Categories under 50 domains are omitted from the "
            "chart. DNS blocking is one mechanism among several and is trivially bypassed; it "
            "is a measure of intent, not of an airtight wall."
        ),
        "categories_full": {CAT_LABELS.get(c, c): n for c, n in cat.most_common()},
        "total_domains": total,
    }
    write_artifact("offswitch.IN.dns_by_category.json", bycat)

    # 2b. by ISP (tableBars)
    byisp = base(
        "policy.blocking.dns_by_isp",
        "How many domains each ISP blocks",
        "dnsblocks", "compiled_blocklist_isp", SRC, "blocked domains",
        artifactType="table",
        dimensions=["label", "value", "group"],
    )
    byisp["rows"] = [{"label": isp_label[i], "value": isp_tot[i], "group": "Blocked domains"}
                     for i, _ in isp_tot.most_common()]
    byisp["metadata"] = {
        "note": (
            "The same legal blocking orders are implemented unevenly: each ISP resolves a "
            "different set of domains, so what is reachable depends on who your provider is. "
            "Counts from dnsblocks.in."
        )
    }
    write_artifact("offswitch.IN.dns_by_isp.json", byisp)


# ---------------------------------------------------------------------------
# 3. Access Now / KeepItOn STOP — India platform-blocking events (evidence table)
# ---------------------------------------------------------------------------
def ingest_accessnow():
    print("Access Now / KeepItOn STOP dataset (India rows) ...")
    SHEET = ("https://docs.google.com/spreadsheets/d/"
             "1DvPAuHNLp5BXGb0nnZDGNoiIwEeu2ogdXEIDvT4Hyfk/export?format=csv")
    text = fetch_text(SHEET, "accessnow.csv", timeout=90)
    snap("accessnow_stop.csv", text)
    SRC = "https://www.accessnow.org/keepiton-data-spreadsheet"
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for r in reader:
        if "India" not in (r.get("country") or ""):
            continue
        rows.append({
            "date": (r.get("start_date") or "").strip(),
            "platform": (r.get("other_affected") or "").strip()
                        or "; ".join(p for p, k in [
                            ("Facebook", "facebook_affected"), ("Twitter/X", "twitter_affected"),
                            ("WhatsApp", "whatsapp_affected"), ("Instagram", "instagram_affected"),
                            ("Telegram", "telegram_affected")] if r.get(k) == "Yes") or "Network",
            "scope": (r.get("geo_scope") or "").strip(),
            "justification": (r.get("gov_justification") or "").strip(),
            "legal_method": (r.get("legal_method") or "").strip(),
            "status": (r.get("shutdown_status") or "").strip(),
        })
    table = base(
        "policy.blocking.platform_events",
        "Platform blocks in India (Access Now STOP)",
        "accessnow", "keepiton-stop", SRC, "events",
        artifactType="table",
        dimensions=["date", "platform", "scope", "justification", "legal_method", "status"],
    )
    table["rows"] = rows
    table["metadata"] = {
        "note": (
            f"{len(rows)} India platform-blocking events documented by Access Now and the "
            "#KeepItOn coalition's STOP project. Distinct from connectivity shutdowns: these "
            "are blocks of specific apps/services. Used as evidence; not all rows are charted."
        )
    }
    write_artifact("offswitch.IN.platform_events.json", table)


# ---------------------------------------------------------------------------
# 4. Manual, well-sourced series — 69A URL blocking, shutdown cost, app bans
# ---------------------------------------------------------------------------
def ingest_manual():
    print("Manual series (69A counts, cost, app-ban timeline) ...")

    # 4a. Section 69A URLs blocked, as disclosed to Parliament
    urls = base(
        "policy.blocking.urls_annual",
        "Websites and accounts blocked under Section 69A",
        "meity", "parliament-69a", "https://www.meity.gov.in/", "URLs blocked",
    )
    urls["observations"] = [
        {"date": "2017", "value": 1385},
        {"date": "2018", "value": 2799},
        {"date": "2019", "value": 3635},
        {"date": "2020", "value": 9849},
        {"date": "2021", "value": 6096},
        {"date": "2022", "value": 6775},
        {"date": "2023", "value": 7502},
    ]
    urls["sourceUrl"] = ("https://www.medianama.com/2024/12/223-govt-blocks-record-28000-urls-2024/")
    urls["metadata"] = {
        "note": (
            "URLs, websites and social-media accounts ordered blocked under Section 69A of "
            "the IT Act, as disclosed by MeitY in answers to Parliament. These figures are "
            "the government's own and do not fully reconcile across different answers (e.g. "
            "2019 has been stated as both 3,635 and 3,655); 2022-23 figures come from later "
            "answers on a slightly different basis. The orders themselves are confidential "
            "by rule, so the public never sees what was blocked or why. Treat as the order of "
            "magnitude, not exact counts."
        )
    }
    write_artifact("offswitch.IN.urls_blocked_69a.json", urls)

    # 4b. Economic cost of shutdowns — ICRIER 2018 (authoritative India macro-econometric study)
    cost = base(
        "policy.shutdowns.cost_usd",
        "The measured economic cost of India's shutdowns",
        "icrier", "anatomy-of-an-internet-blackout",
        "https://icrier.org/pdf/Anatomy_of_an_Internet_Blackout.pdf",
        "US$ million, 2012-2017",
        artifactType="table",
        dimensions=["label", "value", "group"],
    )
    cost["rows"] = [
        {"label": "Mobile-internet shutdowns", "value": 2370.0, "group": "Lost output, 2012-2017"},
        {"label": "Mobile + broadband shutdowns", "value": 678.4, "group": "Lost output, 2012-2017"},
    ]
    cost["metadata"] = {
        "note": (
            "From ICRIER's 2018 study 'The Anatomy of an Internet Blackout' (Kathuria, Kedia "
            "and others), the most authoritative India-specific estimate: 16,315 hours of "
            "shutdowns over 2012-2017 cost the economy about US$3.04 billion. Mobile-only "
            "shutdowns (12,615 hours) did roughly four-fifths of the damage (about $2.37bn); "
            "combined mobile-and-fixed shutdowns (3,700 hours) about $678m. Built with a "
            "macro-econometric model, so read it as a rigorous estimate, not exact "
            "accounting. More recent annual losses are tracked by the NetBlocks / Internet "
            "Society Cost of Shutdown Tool (Brookings methodology), which puts recent years "
            "in the hundreds of millions of dollars a year."
        ),
        "total_usd_million": 3048.4,
        "hours": 16315,
        "methodology": "ICRIER macro-econometric model (2018)",
    }
    write_artifact("offswitch.IN.shutdown_cost.json", cost)

    # 4c. App / platform ban timeline (curated)
    bans = base(
        "policy.blocking.app_bans",
        "India's big app bans",
        "indica", "curated-app-bans", "https://www.meity.gov.in/", "apps blocked",
        artifactType="table",
        dimensions=["label", "value", "group", "note"],
    )
    G = "Apps blocked in one action"
    bans["rows"] = [
        {"label": "Jun 2020: TikTok + 58 Chinese apps", "value": 59, "group": G,
         "note": "Section 69A, days after the Galwan clash."},
        {"label": "Jul 2020: 47 clone apps", "value": 47, "group": G, "note": ""},
        {"label": "Sep 2020: 118 apps (incl. PUBG)", "value": 118, "group": G, "note": ""},
        {"label": "Feb 2022: 54 more Chinese apps", "value": 54, "group": G, "note": ""},
        {"label": "Apr 2023: 14 messenger apps (J&K)", "value": 14, "group": G,
         "note": "Blocked over alleged terror use."},
        {"label": "Nov 2023: ~250 betting & loan apps", "value": 250, "group": G,
         "note": "Many Chinese-linked; figure approximate."},
        {"label": "Jun 2026: Telegram (1 app, ~150M users)", "value": 1, "group": G,
         "note": "NEET re-exam paper-leak fears; challenged in Delhi HC."},
    ]
    bans["metadata"] = {
        "note": (
            "Major Indian app/platform blocking actions under Section 69A, curated from "
            "government notifications and reporting. The 2020 wave (~224 apps in a year) "
            "followed the India-China border clash; the 2026 Telegram block is the first to "
            "face a serious court test of whether 69A can lawfully switch off an entire "
            "service. Counts are apps affected; the Telegram row is one app but ~150M users."
        ),
        "sourceUrls": [
            "https://en.wikipedia.org/wiki/List_of_Chinese_apps_banned_in_India",
            "https://www.techtimes.com/articles/318541/20260617/telegram-challenges-indias-neet-ban-delhi-high-court-over-section-69a-limits.htm",
        ],
    }
    write_artifact("offswitch.IN.app_bans.json", bans)


def main():
    print(f"Ingesting q.policy.internet_control data  (fetchedAt={NOW})\n")
    steps = [ingest_sflc, ingest_dnsblocks, ingest_accessnow, ingest_manual]
    failed = []
    for fn in steps:
        try:
            fn()
        except Exception as e:  # noqa: BLE001
            print(f"  !! {fn.__name__} FAILED: {e}", file=sys.stderr)
            failed.append(fn.__name__)
    print("\nDone." + (f"  FAILED: {failed}" if failed else "  All sources ingested."))
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
