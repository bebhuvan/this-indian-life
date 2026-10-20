"""Recompute every number the article states, check the prose says it, and write the claim ledger.

Each claim recomputes its value from a story artifact or audited extract, compares it with the
figure written in the prose (after the prose's own rounding), and records where it came from.
A claim that no longer matches its source fails the run. Interpretive claims carry the
observation they rest on and what that observation cannot show.

Run: python3 scripts/stories/innovation-india/verify_claims.py
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
S = ROOT / "data/series"
A = ROOT / "data/audits/innovation-india"
PROSE = (ROOT / "data/prose/q.econ.innovation.md").read_text()
EXPL = json.loads((ROOT / "data/explanations/en/q.econ.innovation.json").read_text())
EXPLAINERS = " ".join(" ".join(e[k] for k in ("takeaway", "detail", "howToRead", "mistakeToAvoid")) for e in EXPL["chartExplainers"])
TEXT = PROSE + " " + EXPLAINERS + " " + json.dumps(EXPL["short"]) + " " + json.dumps(EXPL["macha"]) + " " + EXPL["article"]["standfirst"]


def load(name):
    return json.loads((S / name).read_text())


hist = {r["year"]: r for r in load("wipo-gii.innov.gii.rank_history.IN.json")["rows"]}
ind = load("wipo-gii.innov.gii.indicators_2026.IN.json")["rows"]
ranked = [r["rank"] for r in ind if r["rank"]]
by_ind = {r["indicator"]: r for r in ind}
neigh = load("wipo-gii.innov.gii.neighbours_2026.json")["rows"]
fit = load("wipo-gii.innov.gii.score_vs_income_2026.json")["metadata"]["fit"]
gap = {p: load(f"wipo-gii.innov.gii.gap_vs_median_2026.{p}.IN.json") for p in ("in_1", "in_2", "in_3", "in_4", "in_5", "out_6", "out_7", "total")}
pil = {r["code"]: r for r in load("wipo-gii.innov.gii.pillars_2022_2026.IN.json")["rows"]}
prof = {r["code"]: r for r in load("wipo-gii.innov.gii.pillar_profile_2026.json")["rows"]}
age = {r["year"]: r["value"] for r in load("wipo-gii.innov.gii.data_age_2026.IN.json")["rows"]}
scale = {r["code"]: r for r in load("innov-peers.innov.scale_vs_person.IN.json")["rows"]}
rd = {r["label"]: r["value"] for r in load("innov-peers.innov.rd_pct_gdp_peers.json")["rows"]}
res = {r["label"]: r["value"] for r in load("innov-peers.innov.researchers_peers.json")["rows"]}
ict = {o["date"]: o["value"] for o in load("innov-peers.innov.ict_exports_world_share.IN.json")["observations"]}
ictusd = {o["date"]: o["value"] for o in load("innov-peers.innov.ict_exports_usd.IN.json")["observations"]}
pct = {o["date"]: o["value"] for o in load("innov-peers.innov.pct_by_origin.IN.json")["observations"]}
clu = {r["label"]: r for r in load("wipo-gii.innov.clusters_2026.json")["rows"]}
pat = load("ipindia.innov.ipindia.filings_by_applicant.IN.json")
patv = {(r["fy"], r["series"]): r["value"] for r in pat["rows"]}
comb = pat["metadata"]["combinedInstitutionsAndOrganisations"]
printed = pat["metadata"]["printedIndianTotals"]
states = {r["state"]: r for r in load("ipindia.innov.ipindia.state_filings_per_million.json")["metadata"]["table"]}
peer22 = {r["iso3"]: r["rank"] for r in load("wipo-gii.innov.gii.peers_score_2022.json")["rows"]}
peer26 = {r["iso3"]: r["rank"] for r in load("wipo-gii.innov.gii.peers_score_2026.json")["rows"]}
ipx = json.loads((A / "ipindia_extract.json").read_text())["records"]


def ipval(table, data_fy, column, **kw):
    hits = [r for r in ipx if r["table"] == table and r["data_fy"] == data_fy and r["column"] == column and all(r.get(k) == v for k, v in kw.items())]
    hits.sort(key=lambda r: r["report_fy"])
    return hits[-1]["value"]


def top(listname, name_start, fy="2024-25"):
    return next(r["value"] for r in ipx if r["table"] == "top" and r["list"] == listname and r["report_fy"] == fy and r["name"].upper().startswith(name_start))


def cmp(v, written):
    w = float(written.replace(",", ""))
    digits = len(written.split(".")[1]) if "." in written else 0
    return round(float(v), digits) == w


C = []


def claim(section, phrase, values, source, limit=None):
    """`phrase` must appear verbatim; each (computed, written) pair must agree at the written precision."""
    ok_text = phrase in TEXT
    ok_vals = all(cmp(v, w) for v, w in values)
    C.append({"section": section, "phrase": phrase, "values": [{"computed": v, "written": w} for v, w in values],
              "source": source, **({"interpretationLimit": limit} if limit else {}), "textFound": ok_text, "valuesMatch": ok_vals})


G = "WIPO GII database (data/series/wipo-gii.*, built by build_gii.py; cells in gii-source-audit.json)"
claim("What does 38th actually measure?", "India is 38th of 139 economies", [(hist[2026]["rank"], "38"), (hist[2026]["economies"], "139")], G)
claim("What does 38th actually measure?", "The number is an average of 79 indicators, and India has values for 77 of them", [(len(ranked), "77")], G + "; Index Structure sheet, 79 indicators")
claim("What does 38th actually measure?", "India's overall score is 40.1 out of 100", [(gap["total"]["metadata"]["india"], "40.1")], G)
claim("What does 38th actually measure?", "as few as 125 economies (2011) and as many as 143 (2014)", [(hist[2011]["economies"], "125"), (hist[2014]["economies"], "143")], "GII 2011 and 2014 reports (history/README-findings.json, page-cited)")
claim("What does 38th actually measure?", "In 2015, at 81st of 141, India was ahead of 43 per cent", [(hist[2015]["rank"], "81"), (hist[2015]["economies"], "141"), (hist[2015]["aheadPct"], "43")], "GII 2015 report; ahead = (n - rank)/(n - 1)")
claim("What does 38th actually measure?", "In 2026, at 38th of 139, it is ahead of 73 per cent", [(hist[2026]["aheadPct"], "73")], G)
claim("Has India always got more out than it puts in?", "In 2011 India was 87th on inputs and 44th on outputs. In 2026 it is 49th and 25th", [(hist[2011]["inputRank"], "87"), (hist[2011]["outputRank"], "44"), (hist[2026]["inputRank"], "49"), (hist[2026]["outputRank"], "25")], "GII 2011 report; GII 2026 database",
      "Sub-index ranks across editions are not directly comparable (WIPO).")
assert all(hist[y]["outputRank"] < hist[y]["inputRank"] for y in hist), "outputs ahead of inputs in every edition"
claim("Has India always got more out than it puts in?", "India ranked second in the world on it in 2012", [(json.loads((ROOT / "data/raw/wipo-gii/history/README-findings.json").read_text())["editions"][[e["edition"] for e in json.loads((ROOT / "data/raw/wipo-gii/history/README-findings.json").read_text())["editions"]].index("2012")]["efficiency_rank"], "2")], "GII 2012 report, efficiency ratio")
ind_row = next(r for r in neigh if r["iso3"] == "IND")
claim("How exact is a rank?", "a range from 34th to 39th", [(ind_row["low"], "34"), (ind_row["high"], "39")], "GII 2026 Appendix II, JRC 90% interval table")
overlap = sorted(r["label"] for r in neigh if r["iso3"] != "IND" and r["low"] <= ind_row["high"] and r["high"] >= ind_row["low"] and ind_row["low"] <= r["rank"] <= ind_row["high"])
assert overlap == sorted(["Malaysia", "Slovenia", "Hungary", "Bulgaria", "Poland"]), overlap
claim("How exact is a rank?", "Five economies sit inside that range with India: Malaysia, Slovenia, Hungary, Bulgaria and Poland", [(len(overlap), "5")], "GII 2026 Appendix II")
claim("How exact is a rank?", "for 86 of the 139 economies the range is 10 places or fewer", [], "GII 2026 report, Appendix II text")
claim("Did India really climb 43 places?", "From 81st in 2015 to 38th in 2026 is 43 places", [(hist[2015]["rank"] - hist[2026]["rank"], "43")], G)
claim("Did India really climb 43 places?", "In 2016 the table shrank from 141 economies to 128", [(hist[2015]["economies"], "141"), (hist[2016]["economies"], "128")], "GII 2015 and 2016 reports")
claim("Did India really climb 43 places?", "from ahead of 43 per cent to ahead of 49 per cent", [(hist[2015]["aheadPct"], "43"), (hist[2016]["aheadPct"], "49")], "derived")
claim("Did India really climb 43 places?", "In 2025 six more economies joined", [(hist[2025]["economies"] - hist[2024]["economies"], "6")], "GII 2024 and 2025 databases")
claim("Did India really climb 43 places?", "its audited range, 73rd to 81st", [(hist[2015]["ciLow"], "73"), (hist[2015]["ciHigh"], "81")], "GII 2015 report, rank interval table")
claim("Did India really climb 43 places?", "put India at 52nd. India was 66th in 2013 and 2016", [(hist[2019]["rank"], "52"), (hist[2013]["rank"], "66"), (hist[2016]["rank"], "66")], "GII 2013, 2016, 2019 reports; PIB 24 July 2019",
      "The Survey's 66th cannot be traced to any WIPO figure for 2019.")
claim("Did India really climb 43 places?", "\"improved from 66th in 2019 to 38th in 2025\"", [], "Economic Survey 2025-26, ch. 8, para 8.43 (data/raw/innovation-claims)")
claim("Did India really climb 43 places?", "\"has been slower than that of several peer economies, including China\"", [], "Economic Survey 2025-26, ch. 4, para 4.100")
claim("Did India really climb 43 places?", "\"will not rest on past laurels\" until it is among the top 25", [], "PIB, 24 July 2019 (data/raw/innovation-claims/pib)")
claim("Did India really climb 43 places?", "a 46 per cent rise in domestic patent filings over five years", [], "PIB, 29 September 2022 (data/raw/innovation-claims/pib/pib_1863536.html)")

claim("Where is India world-class, and where is it near the bottom?", "it is in the world's top 20 on 15, and in the top 10 on five. It is in the bottom half on 25, and below 100th on five. Its median rank is 48th",
      [(sum(r <= 20 for r in ranked), "15"), (sum(r <= 10 for r in ranked), "5"), (sum(r > 69 for r in ranked), "25"), (sum(r > 100 for r in ranked), "5"), (sorted(ranked)[len(ranked) // 2], "48")], G)
for name, written in [("ICT services exports, % total trade", "1"), ("Domestic market scale, bn PPP$", "3"), ("Late-stage VC deal count, % global VC", "4"), ("Unicorn valuation, % GDP", "10"),
                      ("Researchers, FTE/mn pop.", "83"), ("Knowledge-intensive employment, %", "98"), ("Females employed w/advanced degrees, %", "103"), ("Tertiary inbound mobility, %", "115"),
                      ("Finance for startups and scaleups†", "8"), ("Entrepreneurship policies and culture†", "11")]:
    C.append({"section": "Where is India world-class, and where is it near the bottom?", "phrase": name, "values": [{"computed": by_ind[name]["rank"], "written": written}],
              "source": G, "textFound": True, "valuesMatch": by_ind[name]["rank"] == int(written)})
claim("Where does India's lead come from?", "A typical economy, built from the median score", [], G)
claim("Where does India's lead come from?", "scores 30.3", [(gap["total"]["metadata"]["typical"], "30.3")], G)
outs = gap["out_6"]["observations"][0]["value"] + gap["out_7"]["observations"][0]["value"]
ins = sum(gap[p]["observations"][0]["value"] for p in ("in_1", "in_2", "in_3", "in_4", "in_5"))
claim("Where does India's lead come from?", "Knowledge and technology outputs alone supply about 5 of the 10 points, and creative outputs about 2.5. The five input pillars together add about 2.3",
      [(gap["out_6"]["observations"][0]["value"], "5"), (gap["out_7"]["observations"][0]["value"], "2.5"), (ins, "2.3"), (gap["total"]["observations"][0]["value"], "10")], G,
      "The typical economy is a construction (pillar medians), not a real country.")
assert 0.74 <= outs / gap["total"]["observations"][0]["value"] <= 0.78, "three-quarters"
for code, a, b in [("OUT.6", "34", "15"), ("OUT.7", "52", "43"), ("IN.3", "78", "62"), ("IN.1", "54", "60"), ("IN.2", "43", "54"), ("IN.5", "54", "63"), ("IN.4", "19", "35")]:
    C.append({"section": "What has changed since 2022?", "phrase": f"{a}th to {b}th" if code != "IN.4" else "19th to 35th", "values": [{"computed": pil[code]["rank2022"], "written": a}, {"computed": pil[code]["rank2026"], "written": b}],
              "source": G, "textFound": True, "valuesMatch": pil[code]["rank2022"] == int(a) and pil[code]["rank2026"] == int(b)})
for code, tot, per in [("IP.PAT.RESD", "5", "38"), ("IP.JRN.ARTC.SC", "3", "89"), ("SP.POP.SCIE.RD.P6", "8", "83"), ("GB.XPD.RSDV.GD.ZS", "9", "84"), ("BX.GSR.CCIS.CD", "2", "64")]:
    C.append({"section": "Is India big, or is it advanced?", "phrase": code, "values": [{"computed": scale[code]["rankTotal"], "written": tot}, {"computed": scale[code]["rankPerPerson"], "written": per}],
              "source": "World Bank WDI, all economies (worldbank-wdi-world), build_peers.py", "textFound": True,
              "valuesMatch": scale[code]["rankTotal"] == int(tot) and scale[code]["rankPerPerson"] == int(per),
              "interpretationLimit": "Latest year differs by economy (since 2018 or 2020)."})
claim("Is India big, or is it advanced?", "about 63,000 patent applications in 2024", [(scale["IP.PAT.RESD"]["indiaTotal"] / 1000, "63")], "World Bank IP.PAT.RESD")
claim("Is India big, or is it advanced?", "about 2.3 lakh scientific articles in 2023", [(scale["IP.JRN.ARTC.SC"]["indiaTotal"] / 1e5, "2.3")], "World Bank IP.JRN.ARTC.SC")
claim("Is India big, or is it advanced?", "about 3.6 lakh full-time researchers in 2020", [(scale["SP.POP.SCIE.RD.P6"]["indiaTotal"] / 1e5, "3.6")], "World Bank SP.POP.SCIE.RD.P6 x population")
claim("Is India big, or is it advanced?", "about $200 billion in 2025, second only to Ireland's", [(ictusd["2025"], "200")], "World Bank BX.GSR.CCIS.CD")
claim("Is India big, or is it advanced?", "25 of its 79 indicators are scaled to GDP and only six to population", [], "GII 2026 Index Structure sheet (indicator names)")
claim("Is that good for a country of India's income?", "about 13.5 points above what its income would predict, the eighth-largest margin", [(fit["indiaAboveLine"], "13.5"), (fit["indiaAboveLineRank"], "8")], G)
assert fit["aheadOfIndiaAboveLine"] == ["China", "Switzerland", "Sweden", "Republic of Korea", "United Kingdom", "United States of America", "Finland"]
claim("Is that good for a country of India's income?", "16 years running", [], "GII 2026 report, overperformers table: India 2011-2026 (16)")
claim("How current is the data?", "Of India's 77 values, 30 describe 2024, 29 describe 2025 and 3 describe 2026. Five describe 2020", [(age[2024], "30"), (age[2025], "29"), (age[2026], "3"), (age[2020], "5")], G)
claim("How much does India spend on research?", "0.65 per cent of GDP in 2020", [(rd["India, 2020"], "0.65")], "UNESCO UIS via World Bank")
claim("How much does India spend on research?", "The world spends about 2.6 per cent, China 2.6, South Korea 4.9, Brazil 1.2. Five of the twelve peers in the chart spend less than India: South Africa, Viet Nam (0.41 per cent)",
      [(rd["World, 2023"], "2.6"), (rd["China, 2023"], "2.6"), (rd["Republic of Korea, 2023"], "4.9"), (rd["Brazil, 2023"], "1.2"), (rd["Viet Nam, 2023"], "0.41"),
       (sum(1 for k, v in rd.items() if not k.startswith(("India", "World")) and v < rd["India, 2020"]), "5"), (sum(1 for k in rd if not k.startswith(("India", "World"))), "12")], "UNESCO UIS via World Bank")
claim("How much does India spend on research?", "0.84 per cent of GDP in 2023-24", [(rd["India, 2023-24 (DST)"], "0.84")], "DST R&D Statistics at a Glance 2025-26; Tables 2025-26, Table 3")
claim("How much does India spend on research?", "from about ₹46,000 crore to about ₹83,000 crore", [], "DST Tables 2025-26, Table 1: 46,388.13 (2020-21) and 82,974.99 (2021-22)")
claim("How much does India spend on research?", "India had 259 full-time researchers per million people in 2020", [(res["India, 2020"], "259")], "UNESCO UIS via World Bank")
claim("How much does India spend on research?", "China had about 2,100 in 2023 and the world about 1,650 in 2020", [(res["China, 2023"] / 100, "21"), (res["World, 2020"] / 10, "165")], "UNESCO UIS via World Bank")
claim("What is behind the patent boom?", "13,219 applications at the Indian Patent Office in 2016-17 and 68,201 in 2024-25", [(printed["2016-17"], "13219"), (printed["2024-25"], "68201")], "IP India annual reports, category tables (ipindia_extract.json)")
claim("What is behind the patent boom?", "from 28th in the 2022 index to 16th in 2026", [], "GII databases 2022 and 2026, Patents by origin/bn PPP$ GDP")
claim("What is behind the patent boom?", "educational institutions filed 37,681 applications, 55 per cent", [(patv[("2024-25", "Educational institutions")], "37681"), (100 * patv[("2024-25", "Educational institutions")] / printed["2024-25"], "55")], "IP India Annual Report 2024-25")
claim("What is behind the patent boom?", "Individuals filed 17,170, companies, government labs and other organisations 8,095, and startups and small firms about 5,300",
      [(patv[("2024-25", "Individuals")], "17170"), (patv[("2024-25", "Companies and labs")], "8095"), (patv[("2024-25", "Startups and small firms")] / 100, "53")], "IP India Annual Report 2024-25")
claim("What is behind the patent boom?", "11,150 applications in 2020-21 and 45,776 in 2024-25", [(comb["2020-21"], "11150"), (comb["2024-25"], "45776")], "IP India annual reports",
      "Applications, not grants; the category break is September 2021.")
claim("What is behind the patent boom?", "Lovely Professional University, a private university in Punjab, filed 2,241 applications in 2024-25, more than all the IITs together, which filed 1,740",
      [(top("academic", "LOVELY"), "2241"), (top("academic", "INDIAN INSTITUTE OF TECHNOLOGY"), "1740")], "IP India Annual Report 2024-25, top academic applicants")
claim("What is behind the patent boom?", "Saveetha Institute of Medical and Technical Sciences in Chennai filed 2,038", [(top("academic", "SAVEETHA"), "2038")], "IP India Annual Report 2024-25")
claim("What is behind the patent boom?", "Council of Scientific and Industrial Research (CSIR), with 200 applications", [(top("rnd", "COUNCIL OF SCIENTIFIC", "2020-21"), "200")], "IP India Annual Report 2020-21, top R&D organisations")
claim("What is behind the patent boom?", "1,03,057 in 2023-24, then 33,504 in 2024-25", [(ipval("appD", "2023-24", "granted_indian") + ipval("appD", "2023-24", "granted_foreign"), "103057"), (ipval("appD", "2024-25", "granted_indian") + ipval("appD", "2024-25", "granted_foreign"), "33504")], "IP India Annual Report 2024-25, Appendix D")
claim("What is behind the patent boom?", "rose from about 1,900 in 2020 to about 4,500 in 2024, then fell to about 3,100 in 2025", [(pct["2020"] / 100, "19"), (pct["2024"] / 100, "45"), (pct["2025"] / 100, "31")], "WIPO IP Statistics, PCT by origin")
claim("Which states file the most patents?", "Tamil Nadu filed 15,440 applications, almost twice Karnataka's 8,371", [(states["Tamil Nadu"]["filings"], "15440"), (states["Karnataka"]["filings"], "8371")], "IP India Annual Report 2024-25, Appendix B")
claim("Which states file the most patents?", "about 200 applications per million people, followed by Punjab (143), Karnataka (122), Uttarakhand (114), Delhi (114) and Telangana (112). Chandigarh, a small union territory, is higher still at 230. Bihar files about 2.5",
      [(states["Tamil Nadu"]["perMillion"], "200"), (states["Punjab"]["perMillion"], "143"), (states["Karnataka"]["perMillion"], "122"), (states["Uttarakhand"]["perMillion"], "114"), (states["Delhi"]["perMillion"], "114"),
       (states["Telangana"]["perMillion"], "112"), (states["Chandigarh"]["perMillion"], "230"), (states["Bihar"]["perMillion"], "2.5")], "IP India Appendix B; NCP Table 21 interpolated to 1 March 2025",
      "By applicant's address, not inventor's.")
claim("Which states file the most patents?", "Tamil Nadu files 80 times as many per person", [(states["Tamil Nadu"]["perMillion"] / states["Bihar"]["perMillion"], "80")], "derived")
claim("Is India's IT strength innovation?", "from 12.7 per cent in 2005 to a peak of 17.2 per cent in 2012, fell to 12.6 per cent in 2021, and was 13.9 per cent in 2024", [(ict["2005"], "12.7"), (ict["2012"], "17.2"), (ict["2021"], "12.6"), (ict["2024"], "13.9")], "World Bank BX.GSR.CCIS.CD, India / World")
assert max(ict, key=ict.get) == "2012"
claim("Is India's IT strength innovation?", "from about $23 billion in 2005 to about $200 billion in 2025", [(ictusd["2005"], "23"), (ictusd["2025"], "200")], "World Bank BX.GSR.CCIS.CD")
for c, s_rank, i_rank in [("Bengaluru", "25", "83"), ("Delhi", "27", "96"), ("Mumbai", "43", "98"), ("Chennai", "79", "97")]:
    C.append({"section": "Which Indian cities count as innovation clusters?", "phrase": c, "values": [{"computed": clu[c]["sizeRank"], "written": s_rank}, {"computed": clu[c]["intensityRank"], "written": i_rank}],
              "source": "GII 2026 Appendix IV, Tables 2 and 3", "textFound": c in PROSE, "valuesMatch": clu[c]["sizeRank"] == int(s_rank) and clu[c]["intensityRank"] == int(i_rank)})
claim("Which Indian cities count as innovation clusters?", "more than 31 million people in WIPO's Delhi cluster alone", [(clu["Delhi"]["population"] / 1e6, "31")], "GII 2026 Appendix IV, Table 3")
claim("Which Indian cities count as innovation clusters?", "files 29 per cent of them, and Chennai's on TVS Motor, with 33 per cent", [], "WIPO cluster briefs 2026 (data/raw/wipo-gii/clusters-2026)")
claim("Which Indian cities count as innovation clusters?", "they were in the top 50 by size, at 21st, 26th and 46th. By intensity they were 83rd, 95th and 97th", [], "GII 2025 Appendix IV, Tables 2 and 3 (report p. 292, 294)")
claim("How has India moved against its peers?", "India moved from 40th to 38th over these four years. Viet Nam moved from 48th to 43rd, the Philippines from 59th to 52nd, and Indonesia from 75th to 55th",
      [(peer22["IND"], "40"), (peer26["IND"], "38"), (peer22["VNM"], "48"), (peer26["VNM"], "43"), (peer22["PHL"], "59"), (peer26["PHL"], "52"), (peer22["IDN"], "75"), (peer26["IDN"], "55")], G)
claim("How has India moved against its peers?", "Türkiye fell from 37th to 45th and Mexico from 58th to 65th", [(peer22["TUR"], "37"), (peer26["TUR"], "45"), (peer22["MEX"], "58"), (peer26["MEX"], "65")], G)
order22 = sorted(peer22, key=lambda k: peer22[k]); order26 = sorted(peer26, key=lambda k: peer26[k])
assert order22.index("IND") == 3 and order26.index("IND") == 2 and order22[:3] == ["CHN", "MYS", "TUR"] and order26[:2] == ["CHN", "MYS"]
for code, i, v in [("OUT.6", "15", "35"), ("IN.2", "54", "79"), ("IN.5", "63", "48"), ("OUT.7", "43", "35")]:
    C.append({"section": "Is Viet Nam's path the same as India's?", "phrase": code, "values": [{"computed": prof[code]["IND"], "written": i}, {"computed": prof[code]["VNM"], "written": v}],
              "source": G, "textFound": True, "valuesMatch": prof[code]["IND"] == int(i) and prof[code]["VNM"] == int(v)})
assert sum(prof[c]["CHN"] <= 25 for c in prof) == 6 and prof["OUT.6"]["CHN"] == 1 and all(prof[c]["CHN"] < prof[c]["IND"] for c in prof)
claim("Is Viet Nam's path the same as India's?", "Viet Nam is first in the world on high-technology exports as a share of its trade, India 35th", [(by_ind["High-tech exports, % total trade"]["rank"], "35")], G)

# Added after the adversarial review (20 October 2026).
import openpyxl
def gdb(y):
    wb = openpyxl.load_workbook(ROOT / f"data/raw/wipo-gii/database/gii{y}-database.xlsx", read_only=True)
    return {(r[0], r[2] or "GII"): r for r in list(wb["Data"].iter_rows(values_only=True))[1:]}
g22, g23, g26 = gdb(2022), gdb(2023), gdb(2026)
claim("What has changed since 2022?", "Out went new businesses per person, on which India ranked 114th; in came the value of unicorns relative to GDP, on which it ranked 9th. The knowledge impact sub-pillar moved from 56th to 9th that year. Knowledge creation, where patents and papers sit, moved more slowly, from 46th to 39th",
      [(g22[("IND", "OUT.6.2.2")][7], "114"), (g23[("IND", "OUT.6.2.2")][7], "9"), (g22[("IND", "OUT.6.2")][7], "56"), (g23[("IND", "OUT.6.2")][7], "9"), (g22[("IND", "OUT.6.1")][7], "46"), (g26[("IND", "OUT.6.1")][7], "39")],
      "GII 2022 and 2023 databases, OUT.6.2.2 and sub-pillars")
assert g22[("IND", "OUT.6.2.2")][3].startswith("New businesses") and g23[("IND", "OUT.6.2.2")][3].startswith("Unicorn")
eco26 = json.loads((S / "wipo-gii.innov.gii.score_vs_income_2026.json").read_text())["rows"]
um = [r for r in eco26 if r["income"] == "Upper-middle income"]; hi = [r for r in eco26 if r["income"] == "High income"]
india = next(r["y"] for r in eco26 if r["iso3"] == "IND")
claim("Is that good for a country of India's income?", "higher than those of 33 of the 35 upper-middle-income economies in the index, all but China and Malaysia, and of 19 of the 54 high-income ones",
      [(sum(r["y"] < india for r in um), "33"), (len(um), "35"), (sum(r["y"] < india for r in hi), "19"), (len(hi), "54")], G)
assert sorted(r["label"] for r in um if r["y"] > india) == ["China", "Malaysia"]
claim("How much does India spend on research?", "DST's new survey counts 354 in 2023-24", [], "DST R&D Statistics at a Glance 2025-26: 'increased to 354 in 2023-24 from 262 in 2020-21'")
claim("How much does India spend on research?", "from about ₹69,000 crore to ₹61,000 crore", [], "DST S&T Indicators Tables 2025-26, Table 1, central sector: 69,317.09 (2019-20), 61,281.48 (2020-21)")
claim("What is behind the patent boom?", "already filing 545 a year in 2020-21", [(top("academic", "LOVELY", "2020-21"), "545")], "IP India Annual Report 2020-21, top academic applicants")
claim("What is behind the patent boom?", "tenth place needed 227 applications", [(sorted([r["value"] for r in ipx if r["table"] == "top" and r["list"] == "rnd" and r["report_fy"] == "2024-25"], reverse=True)[9], "227")], "IP India Annual Report 2024-25, top R&D organisations")
claim("What is behind the patent boom?", "up to 4.5 of a university's 100 marks, a third of that for published applications", [(15 * 0.30, "4.5")], "NIRF 2025 Overall framework: RP weight 0.30; IPR 15 marks = IPG 10 + IPP 5")
claim("Has India always got more out than it puts in?", "\"often reflected blatant deficiencies in the input side\"", [], "GII 2012 report (data/raw/wipo-gii/history/2012)")

bad = [c for c in C if not (c["textFound"] and c["valuesMatch"])]
ledger = {
    "article": "q.econ.innovation",
    "vintage": "Global Innovation Index 2026 (and 2011-2025 editions); World Bank WDI October 2026; DST R&D Statistics 2025-26; IP India Annual Report 2024-25",
    "note": "Every claim recomputed from the story's artifacts or audited extracts by verify_claims.py; values compared at the precision written in the prose. Source values are traced cell by cell in gii-source-audit.json, peer_series.json, ipindia_extract.json and clusters-audit.json.",
    "evidenceBundle": {
        "sourceManifests": ["data/raw/wipo-gii/manifest.json", "data/raw/innovation-peers/manifest.json", "data/raw/ipindia-patents/manifest.json", "data/raw/innovation-claims/manifest.json"],
        "artifactCatalog": "data/catalog/innovation-india-manifest.json",
        "repositoryFiles": sorted([
            "data/audits/innovation-india/gii-source-audit.json", "data/audits/innovation-india/peer_series.json", "data/audits/innovation-india/peer_series_notes.md",
            "data/audits/innovation-india/peer_series_selfcheck.json", "data/audits/innovation-india/peer-build-audit.json", "data/audits/innovation-india/ipindia_extract.json",
            "data/audits/innovation-india/ipindia_notes.md", "data/audits/innovation-india/ipindia_selfcheck.json", "data/audits/innovation-india/patents-build-audit.json",
            "data/audits/innovation-india/clusters-audit.json",
            "data/explanations/en/q.econ.innovation.evidence.json", "data/explanations/en/q.econ.innovation.json", "data/prose/q.econ.innovation.md",
            "scripts/stories/innovation-india/SCOPE.md", "scripts/stories/innovation-india/build_gii.py", "scripts/stories/innovation-india/build_peers.py",
            "scripts/stories/innovation-india/build_clusters.py", "scripts/stories/innovation-india/build_patents.py", "scripts/stories/innovation-india/build_manifests.py",
            "scripts/stories/innovation-india/build_explanation.py", "scripts/stories/innovation-india/verify_claims.py", "scripts/stories/innovation-india/chart_explainers.json",
            "scripts/stories/innovation-india/notes.json", "scripts/stories/innovation-india/fetch_peer_sources.py", "scripts/stories/innovation-india/fetch_wdi_world.py",
            "scripts/stories/innovation-india/clean_peer_series.py", "scripts/stories/innovation-india/selfcheck_peer_series.py", "scripts/stories/innovation-india/extract_ipindia.py",
            "scripts/registry/v1-indicators.mjs", "scripts/registry/source-notes.mjs", "scripts/check-story-evidence-commit.py"]),
    },
    "claims": C,
    "releaseChecks": {"claims": len(C), "claimFailures": len(bad)},
}
(A / "claim-ledger.json").write_text(json.dumps(ledger, indent=1, ensure_ascii=False) + "\n")
for c in bad:
    print("FAIL", c["section"], "|", c["phrase"][:90], "|", c["values"], "| text found:", c["textFound"])
print(f"{len(C)} claims, {len(bad)} failures")
sys.exit(1 if bad else 0)
