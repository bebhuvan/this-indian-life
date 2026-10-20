// Verified, linked "Sources" and "Further reading" lists for each article, keyed by
// question id. Attached to the registry questions at the bottom of v1-indicators.mjs and
// merged over the generated explanation by src/data/questions.ts, so regenerating the
// prose cannot undo them. Explanations with no registry question (not built) take their
// lists from here via scripts/apply-pinned-references.py.
//
// Every entry is { label, url, check }. `check` is the term (or terms) the page must
// contain for the link to be the right one; it never renders. Re-verify with
//   node scripts/check-source-links.mjs [--question=q.id]
// A 200 that lacks the term is a failure. Links were checked in October 2026; see
// docs/SOURCE_LINKS_REPORT.md for what changed and what could not be machine-checked.
// House style: no em dashes in labels (validate-explanations.mjs fails on them).
export const pinnedReferences = {
  "q.agriculture.edible_oil_imports": {
    sourceNotes: [
      { label: "UPAg (Department of Agriculture and Farmers Welfare), All India crop-wise area, production and yield: Total Oil Seeds and major oilseed crops, final estimates, 2025-26 third advance estimate", url: "https://dash.upag.gov.in/allindiaapy", check: "All India APY" },
      { label: "UPAg, progressive crop area sown report: current-season oilseed area against normal area", url: "https://dash.upag.gov.in/progressivecropareasown", check: "Progressive Crop Area Sown" },
      { label: "UPAg, state-wise area, production and yield: oilseed production by state, 2024-25 final estimate", url: "https://dash.upag.gov.in/statewiseapy", check: "Statewise APY" },
      { label: "UN Comtrade database (portal home): India imports and exports of edible oils, HS 1507, 1508, 1511, 1512 and 1514, net weight and value, 2012-2024, and 2024 imports by partner", url: "https://comtradeplus.un.org/", check: "UN Comtrade" },
      { label: "MoSPI eSankhyiki portal (home page), where the all-India CPI (2012=100) combined indices for oils and fats and the refined-oil item are published", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" }
    ]
  },
  "q.air.data_poverty": {
    sourceNotes: [
      { label: "CPCB Central Control Room, data repository of station files by frequency and year (audited June 2026)", url: "https://airquality.cpcb.gov.in/ccr/#/repository/data", check: "Data Files (Year/Month)" },
      { label: "CPCB, National Air Quality Index: method, categories and AQI report", url: "https://cpcb.nic.in/National-Air-Quality-Index/", check: "National Air Quality Index" },
      { label: "OAQ (Open Air Quality) platform, CPCB mirror and station hierarchy, snapshot generated 23 June 2026", url: "https://oaq.notf.in", check: "open platform for hyperlocal air quality" },
      { label: "Census of India 2011, Rural Urban Distribution of Population (Provisional Population Totals), RGI presentation: 4,041 statutory towns", url: "https://censusindia.gov.in/nada/index.php/catalog/1430", check: "Rural Urban Distribution of Population" }
    ]
  },
  "q.air.today": {
    sourceNotes: [
      { label: "World Air Quality Index project, Delhi: Major Dhyan Chand National Stadium station (DPCC), reading of 1 June 2026", url: "https://aqicn.org/city/delhi/major-dhyan-chand-national-stadium/", check: "Major Dhyan Chand National Stadium" },
      { label: "World Air Quality Index project, Mumbai: Kurla station (CPCB), reading of 30 May 2026", url: "https://aqicn.org/city/india/mumbai/kurla", check: "Kurla" },
      { label: "World Air Quality Index project, Kolkata: Ballygunge station (CPCB), reading of 30 May 2026", url: "https://aqicn.org/city/india/kolkata/ballygunge", check: "Ballygunge" },
      { label: "World Air Quality Index project, Chennai: Royapuram station (CPCB), reading of 30 May 2026", url: "https://aqicn.org/city/chennai/royapuram", check: "Royapuram" },
      { label: "World Air Quality Index project, Bengaluru: Hombegowda Nagar station (CPCB), reading of 30 May 2026", url: "https://aqicn.org/city/india/bengaluru/hombegowda-nagar", check: "Hombegowda Nagar" }
    ]
  },
  "q.climate.city_heat": {
    sourceNotes: [
      { label: "Berkeley Earth, India regional land temperature: homogenised station record, anomaly against 1951-1980", url: "https://berkeleyearth.org/temperature-region/india", check: ["India", "Berkeley Earth"] },
      { label: "Berkeley Earth, India TAVG trend file used for the national series (data file)", url: "https://berkeley-earth-temperature.s3.us-west-1.amazonaws.com/Regional/TAVG/india-TAVG-Trend.txt", check: "Berkeley Earth" },
      { label: "Copernicus Climate Change Service, ERA5 monthly averaged reanalysis on single levels: India-wide annual mean 2m temperature, 1940-2024", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means", check: "ERA5 monthly averaged data on single levels" },
      { label: "Open-Meteo Historical Weather API (ERA5 daily), aggregated locally for 38 city coordinates: annual mean, days at or above 35°C, nights at or above 28°C, feels-like (apparent) temperature and days with feels-like maximum at or above 40°C, complete years 1940-2025", url: "https://open-meteo.com/en/docs/historical-weather-api", check: ["Historical Weather API", "apparent_temperature"] }
    ]
  },
  "q.climate.co2": {
    sourceNotes: [
      { label: "Global Carbon Budget (2025) via Our World in Data: annual territorial CO2 emissions, India and world, also the basis for India's world share", url: "https://ourworldindata.org/grapher/annual-co2-emissions-per-country", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: cumulative CO2 emissions", url: "https://ourworldindata.org/grapher/cumulative-co-emissions", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: CO2 emissions per person", url: "https://ourworldindata.org/grapher/co-emissions-per-capita", check: "Global Carbon Budget" },
      { label: "US Energy Information Administration, International Energy Statistics: India's energy-related CO2 by fuel (coal and coke, petroleum, natural gas), from 1980", url: "https://www.eia.gov/international/data/country/IND/other-statistics/emissions-by-fuel", check: ["Coal and coke", "Consumed natural gas", "India"] }
    ]
  },
  "q.climate.co2_pc": {
    sourceNotes: [
      { label: "Global Carbon Budget (2025) via Our World in Data: CO2 emissions per person, India and comparison countries", url: "https://ourworldindata.org/grapher/co-emissions-per-capita", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: annual territorial CO2 emissions", url: "https://ourworldindata.org/grapher/annual-co2-emissions-per-country", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: cumulative CO2 emissions", url: "https://ourworldindata.org/grapher/cumulative-co-emissions", check: "Global Carbon Budget" },
      { label: "US Energy Information Administration, International Energy Statistics: India's primary energy use per person (MMBtu per person), energy-intensity table", url: "https://www.eia.gov/international/data/country/IND/other-statistics/energy-intensity-by-gdp-and-population", check: ["India", "MMBtu/person"] }
    ]
  },
  "q.climate.el_nino_2026": {
    sourceNotes: [
      { label: "NOAA Climate Prediction Center, for the Oceanic Nino Index (ONI), the official measure of El Nino strength used throughout this piece.", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php", check: "ONI" },
      { label: "NOAA Climate Prediction Center, for the Relative Oceanic Nino Index (RONI), the trend-adjusted measure that re-ranks the historical record.", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/", check: "RONI" },
      { label: "NOAA Climate Prediction Center's ENSO monitoring pages, for the weekly and monthly Nino-region sea-surface temperatures from the ERSSTv5 and OISST products.", url: "https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/enso.shtml", check: ["Climate Weather Linkage", "Southern Oscillation"] },
      { label: "NOAA Climate Prediction Center's official ENSO strength probabilities (issued July 2026), the single forecast quoted in this piece, verified against the trend-adjusted RONI on a 1991-2020 base and re-issued every month.", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/strengths/", check: ["RONI", "Strong"] },
      { label: "NOAA Physical Sciences Laboratory, for the Dipole Mode Index behind the Indian Ocean Dipole (raw data file, HadISST, 1870 onward).", url: "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data", check: "DMI" },
      { label: "Contains modified Copernicus Climate Change Service information: ERA5 monthly reanalysis, for the all-India temperature anomalies behind the winter-heat comparison.", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means", check: "ERA5 monthly averaged data on single levels" },
      { label: "India Meteorological Department, for all-India and subdivisional monthly rainfall from 1901 to 2025, which underlies every rainfall departure in this piece.", url: "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html", check: ["Climate Prediction and Monitoring Group", "Rainfall in % departure"] },
      { label: "ICRISAT's district-level database, for the crop yield comparisons, which run from 1966 to 2017.", url: "http://data.icrisat.org/dld/", check: "District Level" },
      { label: "Reserve Bank of India, for wholesale food prices and for the national accounts behind agriculture's share of output.", url: "https://data.rbi.org.in/DBIE/", check: "Database on Indian Economy" },
      { label: "World Bank, for the modelled estimate of agriculture's share of employment.", url: "https://data.worldbank.org/indicator/SL.AGR.EMPL.ZS", check: "Employment in agriculture" },
      { label: "Lobell, Sibley and Ortiz-Monasterio, 'Extreme heat effects on wheat senescence in India', Nature Climate Change 2 (2012), for the finding that days above about 34°C accelerate wheat ageing and shorten grain filling.", url: "https://doi.org/10.1038/nclimate1356", check: "Extreme heat effects on wheat senescence in India" },
      { label: "Kumar, Rajagopalan, Hoerling, Bates and Cane, 'Unraveling the Mystery of Indian Monsoon Failure During El Nino', Science 314 (2006), for the central-Pacific hypothesis this piece tests.", url: "https://doi.org/10.1126/science.1131152", check: "Unraveling the Mystery of Indian Monsoon Failure During El Ni" },
      { label: "Girishkumar and Ravichandran, 'The influences of ENSO on tropical cyclone activity in the Bay of Bengal during October-December', Journal of Geophysical Research: Oceans 117 (2012), for the finding that El Nino suppresses post-monsoon cyclone energy in the Bay.", url: "https://doi.org/10.1029/2011JC007417", check: "tropical cyclone activity in the Bay of Bengal" },
      { label: "Roose, Ajayamohan, Ray, Mohan and Mohanakumar, 'ENSO influence on Bay of Bengal cyclogenesis confined to low latitudes', npj Climate and Atmospheric Science 5:31 (2022), for the post-monsoon cyclone counts by ENSO phase.", url: "https://doi.org/10.1038/s41612-022-00252-8", check: "ENSO influence on Bay of Bengal cyclogenesis confined to low latitudes" },
      { label: "Goswami and An, 'An assessment of the ENSO-monsoon teleconnection in a warming climate', npj Climate and Atmospheric Science 6:82 (2023), for the projected weakening of the link and the El Nino/positive-dipole mechanism behind it.", url: "https://doi.org/10.1038/s41612-023-00411-5", check: "An assessment of the ENSO-monsoon teleconnection in a warming climate" }
    ]
  },
  "q.climate.el_nino_india": {
    sourceNotes: [
      { label: "India Meteorological Department, all-India and regional southwest monsoon rainfall, 1901-2025", url: "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html", check: "Rainfall" },
      { label: "NOAA Climate Prediction Center, Oceanic Nino Index (ONI), 1950-2025", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php", check: "ONI" },
      { label: "NOAA Physical Sciences Laboratory, Dipole Mode Index for the Indian Ocean Dipole, HadISST (data file)", url: "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data", check: "DMI" },
      { label: "ICRISAT District Level Database (apportioned): district crop area, production and yield, 1966-2017", url: "http://data.icrisat.org/dld/", check: "District Level" },
      { label: "Directorate of Economics and Statistics, Agricultural Statistics at a Glance 2024-25: all-India crop area, production and yield (PDF)", url: "https://desagri.gov.in/wp-content/uploads/2024/11/Agricultural-Statisitcs-at-a-Glance-2024-25_%E0%A4%95%E0%A5%83%E0%A4%B7%E0%A4%BF-%E0%A4%B8%E0%A4%BE%E0%A4%82%E0%A4%96%E0%A5%8D%E0%A4%AF%E0%A4%BF%E0%A4%95%E0%A5%80-%E0%A4%8F%E0%A4%95-%E0%A4%9D%E0%A4%B2%E0%A4%95-2024%E2%80%9325-1.pdf", check: "Agricultural Statistics at a Glance" },
      { label: "UPAg dashboard, all-India crop area, production and yield: Third Advance Estimates 2025-26", url: "https://dash.upag.gov.in/allindiaapy", check: "UPAg" },
      { label: "Reserve Bank of India, Database on Indian Economy (DBIE): wholesale price indices for food groups and national accounts for agricultural GVA", url: "https://data.rbi.org.in/DBIE/", check: "Database on Indian Economy" },
      { label: "MoSPI eSankhyiki portal (home page), where the all-India CPI food inflation series are published", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "World Bank WDI, employment in agriculture, modelled ILO estimate (SL.AGR.EMPL.ZS), India", url: "https://data.worldbank.org/indicator/SL.AGR.EMPL.ZS?locations=IN", check: "Employment in agriculture" },
      { label: "World Bank WDI, inflation, consumer prices, annual % (FP.CPI.TOTL.ZG), India", url: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN", check: "Inflation, consumer prices" }
    ],
    furtherReading: [
      { label: "Mike Davis, Late Victorian Holocausts: El Nino Famines and the Making of the Third World (Verso, 2001), on the 1876-78 and 1896-1902 El Nino famines in India", url: "https://www.versobooks.com/products/1719-late-victorian-holocausts", check: "Late Victorian Holocausts" },
      { label: "J. Bjerknes, 'Atmospheric teleconnections from the equatorial Pacific', Monthly Weather Review 97(3), 1969: linked El Nino to the Southern Oscillation", url: "https://doi.org/10.1175/1520-0493(1969)097%3C0163:ATFTEP%3E2.3.CO;2", check: "teleconnections from the equatorial Pacific" },
      { label: "Kumar, Rajagopalan and Cane, 'On the weakening relationship between the Indian monsoon and ENSO', Science 284, 1999", url: "https://doi.org/10.1126/science.284.5423.2156", check: "Weakening Relationship Between the Indian Monsoon and ENSO" },
      { label: "Kumar, Rajagopalan, Hoerling, Bates and Cane, 'Unraveling the mystery of Indian monsoon failure during El Nino', Science 314, 2006: why central-Pacific El Ninos hurt the monsoon more", url: "https://doi.org/10.1126/science.1131152", check: "Unraveling the Mystery of Indian Monsoon Failure During El Ni" },
      { label: "Ashok, Behera, Rao, Weng and Yamagata, 'El Nino Modoki and its possible teleconnection', Journal of Geophysical Research 112, 2007", url: "https://doi.org/10.1029/2006JC003798", check: "Modoki and its possible teleconnection" },
      { label: "Parthasarathy, Munot and Kothawale, 'All-India monthly and seasonal rainfall series: 1871-1993', Theoretical and Applied Climatology 49, 1994: the homogeneous IITM rainfall record", url: "https://doi.org/10.1007/BF00867461", check: "All-India monthly and seasonal rainfall series" },
      { label: "ICRISAT District Level Database (apportioned), 1966-2017: district crop area, production and yield behind the regional harvest maps", url: "http://data.icrisat.org/dld/", check: "District Level" }
    ]
  },
  "q.climate.heat_mortality": {
    sourceNotes: [
      { label: "India Meteorological Department, Disastrous Weather Events reports: heatwave deaths 2013-2024, with the 2024 report's monthly and state tables (2024 report, PDF)", url: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf", check: "Heat Wave" },
      { label: "National Crime Records Bureau, Accidental Deaths and Suicides in India 2023: heat and sun stroke deaths (report index page)", url: "https://www.ncrb.gov.in/accidental-deaths-suicides-in-india-adsi.html", check: ["National Crime Records Bureau", "आकस्मिक मौतें"] },
      { label: "NCDC heat-related illness surveillance, 2024: 374 heatstroke deaths from 1 March to 27 July, Lok Sabha reply as reported by PTI in The Week", url: "https://www.theweek.in/wire-updates/national/2024/08/02/del32-lsq-health-heatstroke.html", check: ["heatstroke", "374"] },
      { label: "TERI, 'Silent disaster: why India must build stronger heatwave resilience', citing NCDC's 161 confirmed heatstroke deaths in 2024", url: "https://www.teriin.org/index.php/article/silent-disaster-why-india-must-build-stronger-heatwave-resilience", check: ["heatwave", "161"] },
      { label: "Narang et al., 'Estimating heatwave-induced excess mortality in India's districts', Frontiers in Environmental Health (2026): the modelled 3,400 excess-death figure", url: "https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full", check: "Estimating heatwave-induced excess mortality" },
      { label: "EM-DAT via Our World in Data: deaths from natural disasters by type, extreme temperature, India", url: "https://ourworldindata.org/grapher/natural-disasters-deaths", check: "EM-DAT" },
      { label: "Office of the Registrar General of India, Vital Statistics of India based on the Civil Registration System 2023: registration, institutional deaths and medical attention (PDF)", url: "https://dc.crsorgi.gov.in/assets/download/Annual-Reports/crs/2023.pdf", check: "Civil Registration System" },
      { label: "Office of the Registrar General of India, Medical Certification of Cause of Death 2023: certification coverage by state (PDF)", url: "https://dc.crsorgi.gov.in/assets/download/Annual-Reports/mccd/2023.pdf", check: "Medical Certification of Cause of Death" },
      { label: "Copernicus Climate Change Service, ERA5 monthly averaged reanalysis: state warming and relative humidity", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means", check: "ERA5 monthly averaged data on single levels" },
      { label: "Copernicus Climate Change Service, ERA5 post-processed daily statistics: hot days at or above 40°C and warm nights at or above 26°C", url: "https://cds.climate.copernicus.eu/datasets/derived-era5-single-levels-daily-statistics", check: "ERA5 post-processed daily statistics" },
      { label: "Copernicus ERA5 via Our World in Data: annual temperature anomaly, India", url: "https://ourworldindata.org/grapher/annual-temperature-anomalies", check: "ERA5" },
      { label: "Open-Meteo Historical Weather API (ERA5 daily): very hot days at or above 35°C for Indian cities, 1940s baseline against 2016-2025", url: "https://open-meteo.com/en/docs/historical-weather-api", check: "Historical Weather API" },
      { label: "World Bank Climate Change Knowledge Portal, India CMIP6 projections: heat index above 39°C and cooling degree days under SSP1-2.6, SSP2-4.5 and SSP5-8.5", url: "https://climateknowledgeportal.worldbank.org/country/india/climate-data-projections", check: "Mean Projections (CMIP6)" },
      { label: "World Bank, World Development Indicators, India: crude death rate (SP.DYN.CDRT.IN, also the base for the sensitivity check), employment in agriculture (SL.AGR.EMPL.ZS), vulnerable employment (SL.EMP.VULN.ZS), access to electricity (EG.ELC.ACCS.ZS), population aged 65+ (SP.POP.65UP.TO.ZS), urban population (SP.URB.TOTL.IN.ZS), PM2.5 exposure (EN.ATM.PM25.MC.M3)", url: "https://databank.worldbank.org/source/world-development-indicators", check: "World Development Indicators" },
      { label: "ILO modelled estimates, informal employment rate in agriculture (SDG indicator 8.3.1), India (data file from the ILOSTAT API)", url: "https://rplumber.ilo.org/data/indicator?id=SDG_0831_SEX_ECO_RT_A&ref_area=IND&format=.csv", check: "SDG_0831" },
      { label: "MoSPI eSankhyiki portal (home page), where the Periodic Labour Force Survey workforce shares by sector are published", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "MoSPI, NSS 78th round (2020-21), Table 22: households with an air conditioner or air cooler, by sector and state (XLSX)", url: "https://mospi.gov.in/sites/default/files/reports_and_publication/NSS78-20-21/Table%2022%20-%20AC,%20cooler.xlsx", check: "cooler" },
      { label: "IIPS, National Family Health Survey 5 (2019-21) India Report: fan and AC/cooler ownership (Table 2.11) and anaemia (PDF)", url: "https://healthnutritionindia.in/reports/documents/35/NFHS-5_INDIA_REPORT.pdf", check: "National Family Health Survey" },
      { label: "IIPS, National Family Health Survey 6 (2023-24) national fact sheets: population in households with electricity (PDF)", url: "https://www.nfhsiips.in/nfhsuser/assets/National%20Family%20Health%20Survey%20(NFHS-6)%202023-2024%20Fact%20Sheets.pdf", check: "NFHS-6" },
      { label: "CEEW (2025), Mapping climate risks and impacts of extreme heatwave disaster in Indian districts: districts and population at high or very high heat risk", url: "https://www.ceew.in/publications/mapping-climate-risks-and-impacts-of-extreme-heatwave-disaster-in-indian-districts", check: ["heatwave", "Indian districts"] },
      { label: "NITI Aayog, National Multidimensional Poverty Index 2023, based on NFHS-5 (PDF)", url: "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf", check: "Multidimensional Poverty" },
      { label: "MoSPI, Household Consumption Expenditure Survey 2023-24 report: rural monthly per capita consumption expenditure by state, a spending measure, not income (PDF)", url: "https://mospi.gov.in/sites/default/files/publication_reports/Final_Report_HCES_2023-24L.pdf", check: "Household Consumption Expenditure Survey" },
      { label: "Lancet Countdown on Health and Climate Change, India data sheet 2025: heat-related labour-hour losses, a capacity estimate, not deaths or wages (PDF)", url: "https://lancetcountdown.org/wp-content/uploads/2025/10/India_Lancet-Countdown_2025_Data-Sheet-2.pdf", check: "LANCET COUNTDOWN" },
      { label: "UNDP Human Climate Horizons: India heat-related mortality and labour indicators", url: "https://horizons.hdr.undp.org/", check: "Human Climate Horizons" }
    ]
  },
  "q.climate.historical": {
    sourceNotes: [
      { label: "Global Carbon Budget (2025) via Our World in Data: cumulative CO2 emissions, India and world", url: "https://ourworldindata.org/grapher/cumulative-co-emissions", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: annual territorial CO2 emissions", url: "https://ourworldindata.org/grapher/annual-co2-emissions-per-country", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: CO2 emissions per person", url: "https://ourworldindata.org/grapher/co-emissions-per-capita", check: "Global Carbon Budget" }
    ]
  },
  "q.climate.impact": {
    sourceNotes: [
      { label: "Copernicus Climate Change Service, ERA5 hourly reanalysis on single levels: temperature, dew point and precipitation processed for India, states and regions", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels", check: "ERA5 hourly data on single levels" },
      { label: "Copernicus Climate Change Service, ERA5 monthly averaged reanalysis on single levels: India and state temperature and rainfall anomalies, mostly on a 1991-2020 base", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means", check: "ERA5 monthly averaged data on single levels" },
      { label: "Berkeley Earth, India regional land temperature since 1816, homogenised station record", url: "https://berkeleyearth.org/temperature-region/india", check: ["India", "Berkeley Earth"] },
      { label: "Copernicus ERA5 via Our World in Data: annual temperature anomalies, India and selected countries", url: "https://ourworldindata.org/grapher/annual-temperature-anomalies", check: "ERA5" },
      { label: "Copernicus ERA5 via Our World in Data: average annual precipitation", url: "https://ourworldindata.org/grapher/average-precipitation-per-year", check: "ERA5" },
      { label: "India Meteorological Department, all-India southwest monsoon rainfall, 1901-2025", url: "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html", check: "Rainfall" },
      { label: "Central Ground Water Board, IN-GRES: stage of groundwater extraction from the Dynamic Ground Water Resources assessments, India, Delhi and Tamil Nadu", url: "https://ingres.iith.ac.in/home", check: "Dynamic Ground Water Resources" },
      { label: "Permanent Service for Mean Sea Level, tide-gauge record for Mumbai (Apollo Bandar), since 1878", url: "https://psmsl.org/data/obtaining/stations/43.php", check: "APOLLO BANDAR" },
      { label: "Permanent Service for Mean Sea Level, tide-gauge record for Chennai, since 1916", url: "https://psmsl.org/data/obtaining/stations/205.php", check: "CHENNAI" },
      { label: "Directorate of Economics and Statistics, Agricultural Statistics at a Glance 2024-25: all-India crop production used in the rainfall-crop correlations (PDF)", url: "https://desagri.gov.in/wp-content/uploads/2024/11/Agricultural-Statisitcs-at-a-Glance-2024-25_%E0%A4%95%E0%A5%83%E0%A4%B7%E0%A4%BF-%E0%A4%B8%E0%A4%BE%E0%A4%82%E0%A4%96%E0%A5%8D%E0%A4%AF%E0%A4%BF%E0%A4%95%E0%A5%80-%E0%A4%8F%E0%A4%95-%E0%A4%9D%E0%A4%B2%E0%A4%95-2024%E2%80%9325-1.pdf", check: "Agricultural Statistics at a Glance" },
      { label: "UPAg dashboard, all-India crop area, production and yield, recent years of the rainfall-crop panel", url: "https://dash.upag.gov.in/allindiaapy", check: "UPAg" },
      { label: "ICRISAT District Level Database (apportioned): district crop yields, 1966-2017", url: "http://data.icrisat.org/dld/", check: "District Level" },
      { label: "Reserve Bank of India, Database on Indian Economy (DBIE): wholesale price index by food group", url: "https://data.rbi.org.in/DBIE/", check: "Database on Indian Economy" },
      { label: "IQAir, World's most polluted countries: annual country-average PM2.5", url: "https://www.iqair.com/in-en/world-most-polluted-countries/", check: ["PM2.5", "polluted countries"] },
      { label: "World Air Quality Index project (aqicn.org): city air quality index for Delhi, Mumbai, Kolkata, Chennai and Bengaluru (Delhi page shown)", url: "https://aqicn.org/city/delhi/", check: ["Delhi", "Air Quality"] },
      { label: "Global Carbon Budget (2025) via Our World in Data: annual territorial CO2 emissions, also the basis for India's world share", url: "https://ourworldindata.org/grapher/annual-co2-emissions-per-country", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: CO2 emissions per person", url: "https://ourworldindata.org/grapher/co-emissions-per-capita", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: cumulative CO2 emissions", url: "https://ourworldindata.org/grapher/cumulative-co-emissions", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget (2025) via Our World in Data: consumption-based CO2 emissions", url: "https://ourworldindata.org/grapher/consumption-co2-emissions", check: "Global Carbon Budget" },
      { label: "Global Carbon Budget and World Bank GDP via Our World in Data: change in CO2 emissions and GDP", url: "https://ourworldindata.org/grapher/co2-emissions-and-gdp", check: "Change in CO" },
      { label: "Jones et al. (2025) via Our World in Data: total greenhouse gas emissions and emissions by gas", url: "https://ourworldindata.org/grapher/total-ghg-emissions", check: "Jones et al" },
      { label: "Climate Watch (2026) via Our World in Data: greenhouse gas emissions by sector", url: "https://ourworldindata.org/grapher/ghg-emissions-by-sector", check: "Greenhouse gas emissions by sector" },
      { label: "Ember, India electricity data: generation by source and carbon intensity of power", url: "https://ember-energy.org/countries-and-regions/india/", check: ["India", "Ember"] },
      { label: "US Energy Information Administration, International Energy Statistics: India's installed solar, wind and renewable electricity capacity", url: "https://www.eia.gov/international/data/country/IND/electricity/electricity-capacity", check: ["India", "capacity"] },
      { label: "MoSPI, NSS 78th round (2020-21), Table 22: households with an air conditioner or air cooler, all India and by state (XLSX)", url: "https://mospi.gov.in/sites/default/files/reports_and_publication/NSS78-20-21/Table%2022%20-%20AC,%20cooler.xlsx", check: "cooler" },
      { label: "IIPS, National Family Health Survey 5 (2019-21) India Report: households with an air conditioner or cooler (PDF)", url: "https://healthnutritionindia.in/reports/documents/35/NFHS-5_INDIA_REPORT.pdf", check: "National Family Health Survey" },
      { label: "CEEW (2025), Mapping climate risks and impacts of extreme heatwave disaster in Indian districts: state share of districts at high heat risk", url: "https://www.ceew.in/publications/mapping-climate-risks-and-impacts-of-extreme-heatwave-disaster-in-indian-districts", check: ["heatwave", "Indian districts"] },
      { label: "NITI Aayog, National Multidimensional Poverty Index 2023: state poverty shares in the heat-risk scatter (PDF)", url: "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf", check: "Multidimensional Poverty" },
      { label: "Lancet Countdown on Health and Climate Change, India data sheet 2025: heat-related labour-hour losses by sector (PDF)", url: "https://lancetcountdown.org/wp-content/uploads/2025/10/India_Lancet-Countdown_2025_Data-Sheet-2.pdf", check: "LANCET COUNTDOWN" },
      { label: "India Meteorological Department, Disastrous Weather Events 2024: reported heatwave deaths (PDF)", url: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf", check: "Heat Wave" },
      { label: "Narang et al., 'Estimating heatwave-induced excess mortality in India's districts', Frontiers in Environmental Health (2026): the modelled excess-death figure", url: "https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full", check: "Estimating heatwave-induced excess mortality" },
      { label: "EM-DAT via Our World in Data: deaths from natural disasters by type, including extreme temperature", url: "https://ourworldindata.org/grapher/natural-disasters-deaths", check: "EM-DAT" },
      { label: "World Bank, World Development Indicators: employment in agriculture (SL.AGR.EMPL.ZS), vulnerable employment (SL.EMP.VULN.ZS), population (SP.POP.TOTL), population aged 65+ (SP.POP.65UP.TO.ZS) and access to electricity (EG.ELC.ACCS.ZS), India", url: "https://databank.worldbank.org/source/world-development-indicators", check: "World Development Indicators" },
      { label: "World Bank Climate Change Knowledge Portal, India CMIP6 projections: cooling degree days, hot days, heat index and temperature under SSP1-2.6, SSP2-4.5 and SSP5-8.5 (pathways, not forecasts)", url: "https://climateknowledgeportal.worldbank.org/country/india/climate-data-projections", check: "Mean Projections (CMIP6)" }
    ]
  },
  "q.climate.methane": {
    sourceNotes: [
      { label: "Climate TRACE, country emissions by sector: India's methane, total, agriculture, waste and fossil-fuel operations, 2015-2024 (data downloads)", url: "https://climatetrace.org/data", check: ["Climate TRACE", "methane"] },
      { label: "Climate TRACE, asset-level emissions map: the named coal mines, oil-and-gas regions and landfills, in CO2e over 100 years", url: "https://climatetrace.org/explore#admin=&gas=ch4&year=2024&timeframe=100&sector=&asset=", check: ["Climate TRACE", "Fossil Fuel Operations"] },
      { label: "Climate Watch, historical GHG emissions: India's methane by sector, the independent comparison estimate", url: "https://www.climatewatchdata.org/ghg-emissions?regions=IND&gases=ch4", check: ["Historical GHG Emissions", "India"] },
      { label: "Government of India, Fourth Biennial Update Report to the UNFCCC (December 2024), the official 2020 inventory cited in the methodology (PDF)", url: "https://unfccc.int/sites/default/files/resource/India%20BUR-4.pdf", check: "Biennial Update Report" }
    ]
  },
  "q.climate.monsoon_2026": {
    sourceNotes: [
      { label: "India Meteorological Department, Long Range Forecast update for the 2026 southwest monsoon, issued 29 May 2026 (PIB release)", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2266479", check: ["Long Range Forecast", "monsoon"] },
      { label: "India Meteorological Department, all-India and regional southwest monsoon rainfall, 1901-2025", url: "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html", check: "Rainfall" },
      { label: "NOAA Climate Prediction Center, Oceanic Nino Index (ONI)", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php", check: "ONI" },
      { label: "NOAA Physical Sciences Laboratory, Dipole Mode Index for the Indian Ocean Dipole, HadISST, 1870 onward (data file)", url: "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data", check: "DMI" },
      { label: "Reserve Bank of India, Database on Indian Economy (DBIE): wholesale food price index and national accounts for agriculture's share of GVA", url: "https://data.rbi.org.in/DBIE/", check: "Database on Indian Economy" },
      { label: "World Bank WDI, employment in agriculture, modelled ILO estimate (SL.AGR.EMPL.ZS), India", url: "https://data.worldbank.org/indicator/SL.AGR.EMPL.ZS?locations=IN", check: "Employment in agriculture" }
    ]
  },
  "q.econ.asia_divergence": {
    sourceNotes: [
      { label: "Maddison Project Database via Our World in Data: GDP per capita, long run, India and Asian peers; decade growth rates computed from it", url: "https://ourworldindata.org/grapher/gdp-per-capita-maddison-project-database", check: "Maddison Project Database" },
      { label: "World Bank WDI, economy indicators: GDP per capita PPP (NY.GDP.PCAP.PP.KD, also used for the catch-up projection), investment (NE.GDI.FTOT.ZS), savings (NY.GNS.ICTR.ZS), FDI (BX.KLT.DINV.WD.GD.ZS), private credit (FS.AST.PRVT.GD.ZS), sector shares (NV.AGR.TOTL.ZS, NV.IND.TOTL.ZS, NV.SRV.TOTL.ZS, NV.IND.MANF.ZS), farm jobs (SL.AGR.EMPL.ZS), cereal yield (AG.YLD.CREL.KG), tariffs (TM.TAX.MRCH.WM.AR.ZS), trade (NE.EXP.GNFS.ZS, TX.VAL.MANF.ZS.UN, TX.VAL.TECH.MF.ZS, BX.GSR.NFSV.CD, BX.GSR.MRCH.CD, TX.VAL.MRCH.CD.WT), R&D (GB.XPD.RSDV.GD.ZS), electricity (EG.USE.ELEC.KH.PC), urbanisation (SP.URB.TOTL.IN.ZS)", url: "https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.KD?locations=IN", check: "GDP per capita, PPP" },
      { label: "World Bank WDI, people indicators: life expectancy (SP.DYN.LE00.IN), under-five mortality (SH.DYN.MORT), fertility (SP.DYN.TFRT.IN), working-age share (SP.POP.1564.TO.ZS), female labour-force participation (SL.TLF.CACT.FE.ZS), stunting (SH.STA.STNT.ZS), basic sanitation (SH.STA.BASS.ZS), harmonised learning outcomes from the Human Capital Index (HD.HCI.HLOS)", url: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=IN", check: "Life expectancy at birth" },
      { label: "World Bank Worldwide Governance Indicators: percentile ranks for government effectiveness, rule of law, voice and accountability, control of corruption, regulatory quality, political stability", url: "https://www.worldbank.org/en/publication/worldwide-governance-indicators", check: "Worldwide Governance Indicators" },
      { label: "World Bank Enterprise Surveys, India 2014: biggest obstacle reported by firms (IC.FRM.OBS.OBST)", url: "https://www.enterprisesurveys.org/en/data/exploreeconomies/2014/india", check: ["India", "2014"] },
      { label: "Lee-Lee and Barro-Lee via Our World in Data: mean years of schooling, long run", url: "https://ourworldindata.org/grapher/mean-years-of-schooling-long-run", check: ["Lee", "Barro"] },
      { label: "Penn World Table via Our World in Data: output per hour worked", url: "https://ourworldindata.org/grapher/labor-productivity-per-hour-pennworldtable", check: "Penn World Table" },
      { label: "Groningen Growth and Development Centre, Penn World Table 10.01: TFP relative to the US (ctfp) and capital per worker (cn/emp), pulled from the KAPSARC mirror", url: "https://www.rug.nl/ggdc/productivity/pwt/", check: ["Penn World Table", "10.01"] },
      { label: "ILOSTAT, informal employment rate (SDG_0831_SEX_ECO_RT_A), India (data file; Bangladesh, Indonesia and Vietnam from the same indicator)", url: "https://rplumber.ilo.org/data/indicator?id=SDG_0831_SEX_ECO_RT_A&ref_area=IND&format=.json", check: "SDG_0831" },
      { label: "World Bank WITS (TRAINS), tariff profile: effectively applied and MFN simple average tariffs, India and peers", url: "https://wits.worldbank.org/CountryProfile/en/Country/IND/Year/LTST/TradeFlow/Import/Partner/WLD/Product/all-groups", check: ["India", "Simple Average"] },
      { label: "OECD Trade in Value Added (TiVA 2025): domestic, foreign and services value added in gross exports", url: "https://www.oecd.org/en/topics/sub-issues/trade-in-value-added.html", check: ["Trade in value-added", "TiVA"] },
      { label: "UN Comtrade: India's merchandise exports to and imports from China", url: "https://comtradeplus.un.org/", check: "Comtrade" },
      { label: "Harvard Growth Lab, Atlas of Economic Complexity: Economic Complexity Index (HS92) rankings", url: "https://atlas.hks.harvard.edu/rankings", check: "Economic Complexity" },
      { label: "World Inequality Database via Our World in Data: income share of the top 10%, before tax", url: "https://ourworldindata.org/grapher/income-share-top-10-before-tax-wid", check: "World Inequality Database" },
      { label: "UNDP Human Development Index via Our World in Data", url: "https://ourworldindata.org/grapher/human-development-index", check: "UNDP" },
      { label: "V-Dem electoral democracy index via Our World in Data", url: "https://ourworldindata.org/grapher/electoral-democracy-index", check: "V-Dem" },
      { label: "World Bank Poverty and Inequality Platform via Our World in Data: share below $3 a day (2021 PPP)", url: "https://ourworldindata.org/grapher/share-of-population-in-extreme-poverty", check: "Poverty and Inequality Platform" }
    ]
  },
  "q.econ.borrow": {
    sourceNotes: [
      { label: "RBI, Sectoral Deployment of Bank Credit, monthly press releases and data, April 2007 onward (old classification to Dec 2018, current from Jan 2019)", url: "https://rbi.org.in/Scripts/Data_Sectoral_Deployment.aspx", check: "Sectoral Deployment" },
      { label: "IndiaDataHub Economic Monitor, Banking/Credit category: the access layer used to pull the RBI sectoral credit series (API documentation)", url: "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor", check: "IndiaDataHub" },
      { label: "BIS, Total credit to the non-financial sector, quarterly, households and private non-financial sector, India and peers", url: "https://data.bis.org/topics/TOTAL_CREDIT", check: "Total credit" },
      { label: "BIS, Credit-to-GDP gaps, quarterly, private non-financial sector, India", url: "https://data.bis.org/topics/CREDIT_GAPS", check: "Credit-to-GDP gaps" },
      { label: "IMF Global Debt Database, household debt, loans and debt securities (HH_LS), % of GDP", url: "https://www.imf.org/external/datamapper/HH_LS@GDD", check: "Household debt" }
    ]
  },
  "q.econ.compare": {
    sourceNotes: [
      { label: "World Bank WDI, GDP at current US$, India, China, US and world (also India's share of world GDP) (NY.GDP.MKTP.CD)", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=IN-CN-US", check: "NY.GDP.MKTP.CD" },
      { label: "World Bank WDI, GDP at purchasing-power parity, India, China, US and world (NY.GDP.MKTP.PP.CD)", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.PP.CD?locations=IN-CN-US", check: "NY.GDP.MKTP.PP.CD" },
      { label: "World Bank WDI, GDP per capita at current US$, India, China, US and world (NY.GDP.PCAP.CD)", url: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=IN-CN-US", check: "NY.GDP.PCAP.CD" },
      { label: "World Bank WDI, population total, India, China, US and world (SP.POP.TOTL)", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN-CN-US", check: "SP.POP.TOTL" },
      { label: "World Bank WDI, urban population share, India, China, US and world (SP.URB.TOTL.IN.ZS)", url: "https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS?locations=IN-CN-US", check: "SP.URB.TOTL.IN.ZS" },
      { label: "World Bank WDI, life expectancy at birth, India, China, US and world (SP.DYN.LE00.IN)", url: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=IN-CN-US", check: "SP.DYN.LE00.IN" },
      { label: "World Bank WDI, under-five mortality rate, India, China, US and world (SH.DYN.MORT)", url: "https://data.worldbank.org/indicator/SH.DYN.MORT?locations=IN-CN-US", check: "SH.DYN.MORT" },
      { label: "World Bank WDI, access to electricity, India, China, US and world (EG.ELC.ACCS.ZS)", url: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS?locations=IN-CN-US", check: "EG.ELC.ACCS.ZS" },
      { label: "World Bank WDI, internet users, % of population, India, China, US and world (IT.NET.USER.ZS)", url: "https://data.worldbank.org/indicator/IT.NET.USER.ZS?locations=IN-CN-US", check: "IT.NET.USER.ZS" },
      { label: "World Bank WDI, female labour-force participation, ages 15+, India, China, US and world (SL.TLF.CACT.FE.ZS)", url: "https://data.worldbank.org/indicator/SL.TLF.CACT.FE.ZS?locations=IN-CN-US", check: "SL.TLF.CACT.FE.ZS" }
    ]
  },
  "q.econ.fdi_development": {
    sourceNotes: [
      { label: "UN Trade and Development (UNCTAD), UNCTADstat: Foreign direct investment, inward and outward flows and stock, annual. The 1990 to 2025 panel for 293 economies, in current US dollars and as shares of world total, GDP and gross fixed capital formation. Updated 10 August 2026.", url: "https://unctadstat.unctad.org/datacentre/dataviewer/US.FdiFlowsStock", check: "Foreign direct investment - Annual" },
      { label: "UNCTAD, World Investment Report 2026: International Investment in a Turbulent Era. Report text and definitions, including chapter I on investment trends.", url: "https://unctad.org/publication/world-investment-report-2026-international-investment-turbulent-era", check: "International investment in a turbulent era", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Web search index (2026-10-19) returns this exact URL titled 'World Investment Report 2026: International investment in a turbulent era', UNCTAD/WIR/2026, 7 July 2026." },
      { label: "UNCTAD, World Investment Report 2026, annex table 01 (XLSX): inward FDI by economy, 1990–2025; cross-check for India's annual inflows.", url: "https://unctad.org/system/files/non-official-document/wir26_tab01.xlsx", check: "FDI inflows, by region and economy", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Verified offline against the committed snapshot in data/raw/unctad-wir/wir2026/annex/, whose manifest records this exact sourceUrl; the file's title/content matches the label." },
      { label: "UNCTAD, World Investment Report 2026, annex table 05 (XLSX): net cross-border acquisition values by seller economy.", url: "https://unctad.org/system/files/non-official-document/wir26_tab05.xlsx", check: "net cross-border M&amp;As by region/economy of seller", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Verified offline against the committed snapshot in data/raw/unctad-wir/wir2026/annex/, whose manifest records this exact sourceUrl; the file's title/content matches the label." },
      { label: "UNCTAD, World Investment Report 2026, annex table 13 (XLSX): announced greenfield project values by source economy.", url: "https://unctad.org/system/files/non-official-document/wir26_tab13.xlsx", check: "announced greenfield FDI projects, by source", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Verified offline against the committed snapshot in data/raw/unctad-wir/wir2026/annex/, whose manifest records this exact sourceUrl; the file's title/content matches the label." },
      { label: "UNCTAD, World Investment Report 2026, annex table 14 (XLSX): announced greenfield project values by destination economy.", url: "https://unctad.org/system/files/non-official-document/wir26_tab14.xlsx", check: "announced greenfield FDI projects, by destination", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Verified offline against the committed snapshot in data/raw/unctad-wir/wir2026/annex/, whose manifest records this exact sourceUrl; the file's title/content matches the label." },
      { label: "UNCTAD, World Investment Report 2026, annex table 17 (XLSX): announced greenfield project counts by destination economy.", url: "https://unctad.org/system/files/non-official-document/wir26_tab17.xlsx", check: "Number of announced greenfield FDI projects", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Verified offline against the committed snapshot in data/raw/unctad-wir/wir2026/annex/, whose manifest records this exact sourceUrl; the file's title/content matches the label." },
      { label: "UNCTAD, World Investment Report 2026, annex table 19 (XLSX): world's largest non-financial multinationals by foreign assets.", url: "https://unctad.org/system/files/non-official-document/wir26_tab19.xlsx", check: ["Foreign assets", "Toyota"], manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Verified offline against the committed snapshot in data/raw/unctad-wir/wir2026/annex/, whose manifest records this exact sourceUrl; the file's title/content matches the label." },
      { label: "UNCTAD, World Investment Report 2026, annex table 20 (XLSX): largest non-financial multinationals from developing economies by foreign assets.", url: "https://unctad.org/system/files/non-official-document/wir26_tab20.xlsx", check: ["Foreign assets", "CNPC"], manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Verified offline against the committed snapshot in data/raw/unctad-wir/wir2026/annex/, whose manifest records this exact sourceUrl; the file's title/content matches the label." },
      { label: "World Bank, Foreign direct investment, net inflows as a share of GDP, indicator BX.KLT.DINV.WD.GD.ZS. Used for the 1970 to 2025 regional comparison, and as an independent check on the UNCTAD figures for India. Updated 13 July 2026.", url: "https://data.worldbank.org/indicator/BX.KLT.DINV.WD.GD.ZS", check: "Foreign direct investment, net inflows (% of GDP)" },
      { label: "UNCTADstat, Total and urban population, annual. Supplies the 2025 population denominators for the per-person comparison.", url: "https://unctadstat.unctad.org/datacentre/dataviewer/US.PopTotal", check: "Population: Total - Annual" },
      { label: "UNCTAD Handbook of Statistics 2021, country group definitions. Its Caribbean financial centre list is excluded from the calculated country rank, matching the 2025 ranking in World Investment Report 2026.", url: "https://unctad.org/system/files/official-document/tdstat46_en.pdf", check: "Handbook of Statistics 2021", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). UN Digital Library record 4063134 confirms TD/STAT/46 is the UNCTAD Handbook of Statistics 2021; this is UNCTAD's standard official-document path for that symbol, but the file itself could not be opened." }
    ],
    furtherReading: [
      { label: "Indica: Is foreign money really fleeing India? What FDI and FII numbers actually mean. The companion article, which explains the gross, repatriation and net arithmetic behind India's falling net FDI figure using RBI data.", url: "/articles/foreign-investment/" },
      { label: "UNCTAD, World Investment Report 2026 regional trends: Developing Asia. The chapter behind the Southeast Asia and India comparisons.", url: "https://unctad.org/topic/investment/world-investment-report", check: "World Investment Report", manual: "unctad.org serves a Cloudflare bot challenge (HTTP 403) to curl, headless and headful Chrome and WebFetch (checked 2026-10-19). Web search confirms the World Investment Report series topic page at this route (also served as /isar/topic/investment/world-investment-report). It is the series hub, not a Developing Asia chapter." }
    ]
  },
  "q.econ.foreign_investment": {
    sourceNotes: [
      { label: "RBI Handbook of Statistics on Indian Economy, Table 143: Foreign Investment Inflows (net FDI, gross inflows, net portfolio investment), fiscal years", url: "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23968", check: "Foreign Investment Inflows" },
      { label: "RBI Bulletin, Current Statistics Table 35: Foreign Investment Inflows, monthly (June 2026 issue)", url: "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=24280", check: "Foreign Investment Inflows" },
      { label: "NSDL FPI Monitor, financial-year-wise net investment by instrument (equity, debt general limit, Debt-VRR, Debt-FAR), Rs crore", url: "https://www.fpi.nsdl.co.in/web/Reports/Yearwise.aspx?RptType=5", check: "Debt-FAR" },
      { label: "NSDL FPI Monitor, assets under custody by country (top 10), May 2026", url: "https://www.fpi.nsdl.co.in/web/Reports/ReportDetail.aspx?RepID=14", check: "AUC Country-wise" },
      { label: "DPIIT FDI factsheet: cumulative FDI equity inflows since April 2000 by source country and sector (series fetched via IndiaDataHub)", url: "https://dpiit.gov.in/publications/fdi-factsheet", check: ["Factsheet", "FDI"] },
      { label: "UNCTADstat, foreign direct investment inward and outward flows and stock (US.FdiFlowsStock): India's outward stock, share of world inflows and peer inflows, calendar years", url: "https://unctadstat.unctad.org/datacentre/dataviewer/US.FdiFlowsStock", check: "Foreign direct investment" },
      { label: "FRED, nominal US dollar index against emerging-market currencies (DTWEXEMEGS)", url: "https://fred.stlouisfed.org/series/DTWEXEMEGS", check: "DTWEXEMEGS" },
      { label: "FRED, 10-year US Treasury yield (DGS10)", url: "https://fred.stlouisfed.org/series/DGS10", check: "DGS10" },
      { label: "FRED, US federal funds effective rate (FEDFUNDS)", url: "https://fred.stlouisfed.org/series/FEDFUNDS", check: "FEDFUNDS" },
      { label: "CBOE Volatility Index, VIX, via FRED (VIXCLS)", url: "https://fred.stlouisfed.org/series/VIXCLS", check: "VIXCLS" },
      { label: "CBOE Emerging Markets ETF Volatility Index via FRED (VXEEMCLS)", url: "https://fred.stlouisfed.org/series/VXEEMCLS", check: "VXEEMCLS" }
    ]
  },
  "q.econ.gold": {
    sourceNotes: [
      { label: "UN Comtrade: India imports of gold, HS 7108 (value, net weight, partner countries 2024), jewellery HS 7113 exports and imports by value, and crude HS 2709 for the import-share comparison", url: "https://comtradeplus.un.org/", check: "Comtrade" },
      { label: "DGCI&S Foreign Trade Data Dissemination Portal, principal commodity data: India gold imports and jewellery exports, calendar years (cross-check of UN Comtrade)", url: "https://ftddp.dgciskol.gov.in/dgcis/principalcommditysearch.html", check: "Principal Commodity" },
      { label: "World Gold Council, Gold Demand Trends data tables (Metals Focus): India jewellery, bar and coin demand, demand per capita, gross bullion imports and recycling", url: "https://www.gold.org/goldhub/data/gold-demand-by-country", check: "Metals Focus" },
      { label: "World Gold Council, gold reserves by country (from IMF IFS): RBI gold holdings in tonnes", url: "https://www.gold.org/goldhub/data/gold-reserves-by-country", check: "Gold Reserves by Country" },
      { label: "World Gold Council Goldhub, gold prices: LBMA US$ per ounce and rupee price, annual averages", url: "https://www.gold.org/goldhub/data/gold-prices", check: "Gold prices" },
      { label: "MoSPI eSankhyiki portal home, where the RBI foreign exchange reserves dataset (gold value and share of reserves) is published; latest months from RBI DBIE", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "RBI Handbook of Statistics on Indian Economy, Table 128: Key Components of India's Balance of Payments, US$ (current account)", url: "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23953", check: "Key Components of India" },
      { label: "RBI Bulletin, Current Statistics Table 15: Deployment of Gross Bank Credit by Major Sectors, loans against gold jewellery (series fetched via IndiaDataHub)", url: "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=24257", check: "Loan against gold jewellery" },
      { label: "AMFI data: scheme-wise average AUM summed across gold ETFs, and monthly gold ETF net flows", url: "https://www.amfiindia.com/research-information/amfi-data", check: "AUM data by category" },
      { label: "NPCI UPI merchant-category data for digital gold, monthly value, as compiled by Dataful (October 2025)", url: "https://insights.dataful.in/articles/digital-gold-via-upi-hits-2290-crore-in-october-2025", check: "Digital Gold" },
      { label: "NSE Indices, Nifty 500: Total Return Index used for the gold versus equity comparison", url: "https://www.niftyindices.com/indices/equity/broad-based-indices/nifty-500", check: "NIFTY 500" },
      { label: "FRED, India/US daily exchange rate (DEXINUS), annual averages: used to convert the US$ gold price and import bill to rupees", url: "https://fred.stlouisfed.org/series/DEXINUS", check: "DEXINUS" },
      { label: "MoSPI eSankhyiki, CPI combined general index (base 2012), annual average: deflator for the real gold price", url: "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi", check: "eSankhyiki" },
      { label: "World Gold Council, India gold market update: import tightening (May 2026), with the import duty history; rates cross-checked with Union Budget notifications", url: "https://www.gold.org/goldhub/gold-focus/2026/05/india-gold-market-update-import-tightening", check: "import duty" }
    ]
  },
  "q.econ.growth": {
    sourceNotes: [
      { label: "World Bank WDI, real GDP growth, annual %, India (NY.GDP.MKTP.KD.ZG)", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN", check: "NY.GDP.MKTP.KD.ZG" },
      { label: "World Bank WDI, consumer price inflation, annual %, India (FP.CPI.TOTL.ZG)", url: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN", check: "FP.CPI.TOTL.ZG" },
      { label: "IndiaDataHub, real GDP at 2011-12 prices, annual and quarterly, compiled from MoSPI National Accounts Statistics", url: "https://www.indiadatahub.com/", check: "IndiaDataHub" },
      { label: "MoSPI eSankhyiki portal (home page), where MoSPI publishes the National Accounts Statistics behind the IndiaDataHub GDP series", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" }
    ]
  },
  "q.econ.income_classification": {
    sourceNotes: [
      { label: "World Bank, GNI, GNI per capita, GDP, GDP PPP and Population 2025 workbooks, July 2026 release, from the World Development Indicators data catalogue.", url: "https://datacatalog.worldbank.org/search/dataset/0037712/World-Development-Indicators", check: "World Development Indicators" },
      { label: "World Bank, historical analytical classifications and GNI per capita thresholds. Linked to the workbook itself, GNIPC.xlsx, because the thresholds have no reader-facing page of their own.", url: "https://datacatalogfiles.worldbank.org/ddh-published/0038128/DR0046433/GNIPC.xlsx", check: ["GNI per capita", "Atlas"] },
      { label: "World Bank, fiscal year 2027 country and lending groups, the classification this article is about.", url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups", check: "World Bank Country and Lending Groups" },
      { label: "World Development Indicators: Atlas GNI per capita, population, under-five mortality and manufacturing value added, for the peer comparisons.", url: "https://data.worldbank.org/indicator/NY.GNP.PCAP.CD", check: "GNI per capita, Atlas method" },
      { label: "World Bank Open Data Blog, 'Who moves up and why?', accompanying the 2025 classification update.", url: "https://blogs.worldbank.org/en/opendata/who-moves-up-and-why--a-closer-look-at-the-new-world-bank-group-", check: "Who moves up" },
      { label: "International Development Association, list of IDA graduates.", url: "https://ida.worldbank.org/en/about/borrowing-countries/ida-graduates", check: "IDA Graduates" },
      { label: "MoSPI, Household Consumption Expenditure Survey 2023-24, press note.", url: "https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf", check: "Household Consumption Expenditure Survey" }
    ]
  },
  "q.econ.income_tax": {
    sourceNotes: [
      { label: "CBDT, Income Tax Return Statistics, Assessment Year 2023-24 (released July 2024): returns by range of tax payable and returned income, income by source; earlier AY editions for the 2012-13 to 2022-23 points", url: "https://www.incometaxindia.gov.in/w/income-tax-return-statistics-for-assessment-year-2023-24-1", check: "Income Tax Return statistics for Assessment Year 2023-24" },
      { label: "CBDT, Time Series Data, Financial Year 2000-01 to 2024-25 (released November 2025): personal and corporate tax collections, direct taxes' share of central tax revenue, cost of collection", url: "https://www.incometaxindia.gov.in/w/time-series-data-financial-year-2000-01-to-2024-25", check: "Time Series Data Financial Year 2000-01 to 2024-25" },
      { label: "Union Budget 2025-26 speech, for the Section 87A rebate that makes income up to Rs 12 lakh tax-free; earlier ceilings from the Finance Acts and Budgets of 2019 and 2023", url: "https://www.indiabudget.gov.in/budget2025-26/doc/budget_speech.pdf", check: ["rebate", "2025-2026"] },
      { label: "UNU-WIDER/ICTD Government Revenue Dataset via Our World in Data: tax revenue as a share of GDP, including social contributions, India and peers", url: "https://ourworldindata.org/grapher/tax-revenues-as-a-share-of-gdp-unu-wider", check: ["UNU-WIDER", "Government Revenue Dataset"] },
      { label: "OECD Global Revenue Statistics Database (includes Revenue Statistics in Asia and the Pacific): personal income tax as % of GDP for the OECD average and Asian peers; India's figure computed from CBDT collections", url: "https://www.oecd.org/en/data/datasets/global-revenue-statistics-database.html", check: "Global Revenue Statistics" }
    ]
  },
  "q.econ.industrial_policy": {
    sourceNotes: [
      { label: "World Bank, South Asia Economic Update, April 2026: Working with Industrial Policy (chart data for every figure in this article, incl. FTA simulations and local-projection estimates)", url: "https://doi.org/10.1596/978-1-4648-2326-8", check: "Working with Industrial Policy" },
      { label: "Global Trade Alert database: the source of the report's counts of industrial policy measures by country, instrument and sector", url: "https://www.globaltradealert.org/", check: "Global Trade Alert" },
      { label: "World Bank Worldwide Governance Indicators: government effectiveness, used in the report's 2024 South Asia comparison", url: "https://www.worldbank.org/en/publication/worldwide-governance-indicators", check: "Government Effectiveness" },
      { label: "World Bank Enterprise Surveys: days to clear customs for medium-sized firms, 2022-25 surveys, as charted in the report", url: "https://www.enterprisesurveys.org/en/enterprisesurveys", check: "Enterprise Surveys" }
    ]
  },
  "q.econ.inequality": {
    sourceNotes: [
      { label: "World Bank WDI/PIP, Gini index (SI.POV.GINI), India, consumption basis", url: "https://data.worldbank.org/indicator/SI.POV.GINI?locations=IN", check: "Gini index" },
      { label: "World Bank WDI/PIP, consumption shares of the richest and poorest 10% and 20% (SI.DST.10TH.10, SI.DST.FRST.10, SI.DST.05TH.20, SI.DST.FRST.20), India", url: "https://data.worldbank.org/indicator/SI.DST.10TH.10?locations=IN", check: "highest 10%" },
      { label: "World Bank WDI/PIP, extreme poverty headcount (SI.POV.DDAY), India; article uses the $2.15 (2017 PPP) vintage, the live page now shows the $3.00 (2021 PPP) line", url: "https://data.worldbank.org/indicator/SI.POV.DDAY?locations=IN", check: "Poverty headcount ratio" },
      { label: "World Bank PIP via Our World in Data: consumption shares of the poorest 50%, middle 40% and richest 10%", url: "https://ourworldindata.org/grapher/income-share-distribution-wb", check: "Poverty and Inequality Platform" },
      { label: "World Inequality Database via Our World in Data: income share of the top 1%, before tax (top 10% on the companion chart)", url: "https://ourworldindata.org/grapher/income-share-top-1-before-tax-wid", check: "World Inequality Database" },
      { label: "World Inequality Database via Our World in Data: wealth share of the richest 1% (top 10% on the companion chart)", url: "https://ourworldindata.org/grapher/wealth-share-richest-1-percent", check: "World Inequality Database" },
      { label: "Our World in Data: top 1% share, World Inequality Database vs World Bank survey method", url: "https://ourworldindata.org/grapher/share-richest-1-wid-vs-pip", check: ["World Inequality Database", "World Bank"] },
      { label: "World Inequality Lab Working Paper 2024/09, Bharti, Chancel, Piketty and Somanchi: Income and Wealth Inequality in India, 1922-2023, The Rise of the Billionaire Raj", url: "https://wid.world/document/income-and-wealth-inequality-in-india-1922-2023-the-rise-of-the-billionaire-raj-world-inequality-lab-working-paper-2024-09/", check: "Billionaire Raj" },
      { label: "MoSPI, Household Consumption Expenditure Survey 2023-24 fact sheet (press note, Dec 2024): MPCE with and without imputation, fractile classes, state MPCE and Gini", url: "https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf", check: ["Household Consumption Expenditure Survey", "2023-24"] },
      { label: "MoSPI, HCES 2023-24 unit-level microdata (NADA catalogue), for MPCE by caste and religion computed by Indica", url: "https://microdata.gov.in/NADA/index.php/catalog/237", check: "Household Consumption Expenditure Survey: 2023-24" },
      { label: "MoSPI, PLFS July 2023-June 2024 unit-level microdata (NADA catalogue), for regular-salaried wages by caste, religion and sex computed by Indica", url: "https://microdata.gov.in/NADA/index.php/catalog/213", check: "July 2023-June 2024" }
    ]
  },
  "q.econ.inflation": {
    sourceNotes: [
      { label: "MoSPI, Consumer Price Index (base 2012, and the new base-2024 series for basket weights), all-India rural, urban and combined, by group and item: eSankhyiki portal home, where the CPI tables are published", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "Office of the Economic Adviser, DPIIT, Wholesale Price Index (2011-12=100): all commodities, primary articles, fuel and power, manufactured products (pulled via MoSPI eSankhyiki)", url: "https://eaindustry.nic.in/", check: "Wholesale Price Index" },
      { label: "World Bank WDI, Inflation, consumer prices (annual %, FP.CPI.TOTL.ZG): India 1960 onward, spliced with MoSPI CPI for recent years; also the peer and peak-inflation comparisons", url: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN", check: "Inflation, consumer prices" },
      { label: "IndiaDataHub Economic Monitor: core CPI (excluding food and fuel) and CPI excluding food, built from MoSPI indices; also the access layer for the RBI rate series (API documentation)", url: "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor", check: "IndiaDataHub" },
      { label: "RBI, Database on Indian Economy: policy repo rate, weighted average term-deposit and lending rates of scheduled commercial banks (used for the real FD return)", url: "https://data.rbi.org.in/DBIE/#/dbie/home", check: "Database on Indian Economy" }
    ]
  },
  "q.econ.innovation": {
    sourceNotes: [
      { label: "WIPO, Global Innovation Index 2026: Powering entrepreneurs at the frontier of science. Report and GII 2026 database (XLSX, CC BY 4.0): India's overall, pillar and indicator ranks, scores and data years", url: "https://www.wipo.int/publications/en/details.jsp?id=4873&plang=EN", check: "Global Innovation Index 2026" },
      { label: "WIPO, GII 2026 database (XLSX): every economy's score, rank and data year on all 79 indicators, used for the indicator, pillar, income and peer charts", url: "https://www.wipo.int/edocs/pubdocs/en/wipo-pub-2000-2026-tech1.xlsx", check: "Global Innovation Index" },
      { label: "WIPO, GII 2026 Appendix II: European Commission Joint Research Centre statistical audit, with 90 per cent rank intervals for every economy (India 34th to 39th)", url: "https://www.wipo.int/web-publications/global-innovation-index-2026/en/appendix-ii-joint-research-centre-jrc-statistical-audit-of-the-2026-global-innovation-index.html", check: "Joint Research Centre" },
      { label: "WIPO, Global Innovation Index past editions (2011 to 2025 reports and databases): India's rank, sub-index ranks and rank intervals in each edition", url: "https://www.wipo.int/en/web/global-innovation-index", check: "Global Innovation Index" },
      { label: "WIPO, GII 2026 science and technology clusters: top 100 clusters by size and by intensity (Appendix IV, Tables 2 and 3), and the Bengaluru, Delhi, Mumbai and Chennai cluster briefs", url: "https://www.wipo.int/en/web/global-innovation-index/2026/innovation-clusters", check: "cluster" },
      { label: "World Bank WDI, research and development expenditure, % of GDP (GB.XPD.RSDV.GD.ZS, from UNESCO UIS), India and peers, latest years", url: "https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS", check: "GB.XPD.RSDV.GD.ZS" },
      { label: "World Bank WDI, researchers in R&D per million people (SP.POP.SCIE.RD.P6, from UNESCO UIS)", url: "https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6", check: "SP.POP.SCIE.RD.P6" },
      { label: "World Bank WDI, ICT service exports, current US$ (BX.GSR.CCIS.CD, IMF balance of payments), used for India's share of the world", url: "https://data.worldbank.org/indicator/BX.GSR.CCIS.CD", check: "BX.GSR.CCIS.CD" },
      { label: "World Bank WDI, patent applications by residents (IP.PAT.RESD, from WIPO), used for the total and per-person ranks", url: "https://data.worldbank.org/indicator/IP.PAT.RESD", check: "IP.PAT.RESD" },
      { label: "World Bank WDI, scientific and technical journal articles (IP.JRN.ARTC.SC, from the US National Science Foundation)", url: "https://data.worldbank.org/indicator/IP.JRN.ARTC.SC", check: "IP.JRN.ARTC.SC" },
      { label: "WIPO IP Statistics Data Center: PCT international applications by origin, India, 2005-2025", url: "https://www3.wipo.int/ipstats/", check: "IP Statistics" },
      { label: "DST, NSTMIS, R&D Statistics at a Glance 2025-26 (PDF): GERD 0.84 per cent of GDP in 2023-24, the National S&T Survey 2024-25, and the multinationals' share of business R&D", url: "https://nstmis-dst.org/Pdfs/RD%20STATISTICS%20AT%20A%20GLANCE%202025-26.pdf", check: "National S&T Survey" },
      { label: "DST, NSTMIS, S&T Indicators Tables 2025-26 (PDF), Tables 1 to 3: GERD by sector and as a share of GDP, 2021-22 onwards", url: "https://nstmis-dst.org/Pdfs/ST%20INDICATORS%20TABLES%202025-26.pdf", check: "S&T INDICATORS TABLES" },
      { label: "DST, NSTMIS, S&T Indicators Tables 2022-23 (PDF), Tables 1 and 3: GERD to 2020-21 on the earlier survey basis, with the note on estimated university R&D", url: "https://nstmis-dst.org/Pdfs/S%26T%20INDICATORS%20TABLES%202022-23.pdf", check: "Higher Education" },
      { label: "Office of the Controller General of Patents, Designs and Trade Marks (IP India), annual reports 2014-15 to 2024-25: patent applications by type of applicant and by state, grants, and top applicants", url: "https://ipindia.gov.in/annual-report", check: "Annual Report" },
      { label: "IP India, Annual Report 2024-25 (PDF): 68,201 applications by Indian applicants, 37,681 by educational institutions; Appendix B, applications by state of origin", url: "https://ipindia.gov.in/storage/uploads/docs-operator/7a8f0ca4-5a8e-416e-b8d4-5647ec352bb9.pdf", check: "Educational" },
      { label: "National Commission on Population, Report of the Technical Group on Population Projections, 2011-2036 (PDF), Table 21: projected population of states, used for patent applications per million people", url: "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf", check: "Projected Total Population" },
      { label: "Ministry of Finance, Economic Survey 2025-26, Chapter 8 (PDF), paragraphs 8.43 and 8.44: the '66th in 2019' rank and the cluster statement", url: "https://www.indiabudget.gov.in/economicsurvey/doc/eschapter/echap08.pdf", check: "66th" },
      { label: "Ministry of Finance, Economic Survey 2025-26, Chapter 4 (PDF), paragraph 4.100: India's GII improvement slower than several peers", url: "https://www.indiabudget.gov.in/economicsurvey/doc/eschapter/echap04.pdf", check: "Global Innovation Index" },
      { label: "Press Information Bureau, 24 July 2019: India ranked 52nd in GII 2019; target of the top 25", url: "https://www.pib.gov.in/newsite/PrintRelease.aspx?relid=192210", check: "India Ranked 52" },
      { label: "Press Information Bureau, 10 January 2022: 'We must aspire to take India to the top 25 positions in the Global Innovation Index'", url: "https://pib.gov.in/PressReleasePage.aspx?PRID=1788900", check: "top 25" },
      { label: "Ministry of Education, NIRF 2025 ranking framework, Overall (PDF): marks for patents published and granted", url: "https://www.nirfindia.org/nirfpdfcdn/2025/framework/Overall.pdf", check: "Patents Published" }
    ],
    furtherReading: [
      { label: "Indica: How much does India spend on research, and is it enough?", url: "/articles/how-much-india-spends-on-research/" },
      { label: "Doshi, Kelley and Simmons (2019), The Power of Ranking: The Ease of Doing Business Indicator and Global Regulatory Behavior, International Organization 73(3)", url: "https://doi.org/10.1017/S0020818319000158", check: "Power of Ranking", manual: "doi.org resolves to cambridge.org, which challenges automated clients; title and authors confirmed via Crossref and the Duke and Penn repository records (2026-10-20)." },
      { label: "Ravallion (2012), Mashup Indices of Development, World Bank Research Observer 27(1)", url: "https://ideas.repec.org/a/oup/wbrobs/v27y2012i1p1-32.html", check: "Mashup" },
      { label: "Cirera and Maloney (2017), The Innovation Paradox: Developing-Country Capabilities and the Unrealized Promise of Technological Catch-Up, World Bank", url: "https://ideas.repec.org/b/wbk/wbpubs/28341.html", check: "Innovation Paradox" },
      { label: "Griliches (1990), Patent Statistics as Economic Indicators: A Survey, NBER Working Paper 3301", url: "https://www.nber.org/papers/w3301", check: "Patent Statistics as Economic Indicators" },
      { label: "Bloom, Eifert, Mahajan, McKenzie and Roberts (2013), Does Management Matter? Evidence from India, Quarterly Journal of Economics 128(1)", url: "https://ideas.repec.org/a/oup/qjecon/v128y2013i1p1-51.html", check: "Does Management Matter" },
      { label: "Saxenian (2001), Bangalore: The Silicon Valley of Asia?, Stanford Center for Research on Economic Development and Policy Reform, Working Paper 91 (PDF)", url: "https://kingcenter.stanford.edu/sites/g/files/sbiybj16611/files/media/file/91wp_0.pdf", check: "Silicon Valley of Asia" }
    ]
  },
  "q.econ.lrs_remittances": {
    sourceNotes: [
      { label: "RBI Bulletin, Current Statistics Table 36: outward remittances under the Liberalised Remittance Scheme for resident individuals, by purpose, monthly (June 2026 issue; full history from the RBI DBIE workbook)", url: "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=24281", check: "Liberalised Remittance Scheme" },
      { label: "RBI Master Direction on the Liberalised Remittance Scheme, paragraph 2: history of LRS limit revisions", url: "https://www.rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=10192", check: "Liberalised Remittance Scheme" },
      { label: "Ministry of Tourism, India Tourism Data Compendium 2025, Table 3.1.1: departures of Indian nationals (Bureau of Immigration data), calendar years (PDF)", url: "https://data.tourism.gov.in/mrd/Uploads/tourism_data/India%20Tourism%20Data%20Compendium%202025_1.pdf", check: "Indian Nationals" },
      { label: "Ministry of Finance press release, 28 June 2023 (PIB): TCS on LRS remittances from 1 October 2023", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1936105", check: ["TCS", "LRS"] },
      { label: "FRED, Indian rupees per US dollar, monthly average (EXINUS): used for approximate rupee equivalents", url: "https://fred.stlouisfed.org/series/EXINUS", check: "EXINUS" }
    ]
  },
  "q.econ.motorisation": {
    sourceNotes: [
      { label: "VAHAN dashboard, Ministry of Road Transport and Highways: monthly vehicle registrations by state, vehicle class and fuel, January 2003 to June 2026", url: "https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml", check: "Vahan" },
      { label: "SIAM press release, auto industry performance of Q4 (January-March 2026) and FY 2025-26: domestic wholesale sales by category", url: "https://www.siam.in/news-%26-updates/press-releases/auto-industry-performance-of-q4-jan--march-2026-fy-2025-26/605", check: "2025-26" },
      { label: "MoSPI National Accounts Statistics on the eSankhyiki portal: real and nominal GDP and per-capita GDP", url: "https://esankhyiki.mospi.gov.in/macroindicators?product=nas", check: "National Accounts Statistics", manual: "2026-10-19: rendered in headless Chrome by hand; page title area reads 'National Accounts Statistics' with the GVA/GDP table (base year 2022-23). The checker's render is intermittent on this client-side MoSPI page" },
      { label: "MoSPI Consumer Price Index on the eSankhyiki portal: transport and communication index (rural, urban, combined), petrol and diesel item indices", url: "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi", check: "Consumer Price Index", manual: "2026-10-19: rendered in headless Chrome by hand with an 8-second wait; page heading reads 'Consumer Price Index' with the CPI table selectors. The checker's 2.5-second render sometimes captures only the shell" },
      { label: "RBI, sectoral deployment of bank credit: outstanding vehicle loans, taken via IndiaDataHub's merger-adjusted feed", url: "https://rbi.org.in/Scripts/Data_Sectoral_Deployment.aspx", check: "Sectoral Deployment" },
      { label: "World Bank WDI, population total (SP.POP.TOTL), India: denominator for registrations per 1,000 people", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN", check: "Population, total" },
      { label: "Ember, yearly electricity data: India generation shares, carbon intensity and demand", url: "https://ember-energy.org/data/yearly-electricity-data/", check: "Yearly electricity data" }
    ]
  },
  "q.econ.oil_shock_2026": {
    sourceNotes: [
      { label: "Petroleum Planning & Analysis Cell (PPAC), Ministry of Petroleum and Natural Gas, for India's monthly crude oil and LPG import volumes and their values in dollars and rupees. Every figure in the import-bill and cooking-gas sections comes from these tables.", url: "https://ppac.gov.in/import-export", check: ["Import", "Crude"] },
      { label: "PPAC, international prices of crude oil, for both the Indian basket reference price and the realised crude import price that the article quotes for what India actually paid.", url: "https://ppac.gov.in/prices/international-prices-of-crude-oil", check: "International Prices of Crude Oil" },
      { label: "PPAC, indigenous crude oil production, the domestic-output denominator behind the statement that India imports about 89% of its crude.", url: "https://ppac.gov.in/production/indigenous-crude-oil", check: "Indigenous Crude Oil" },
      { label: "UN Comtrade, for India's 2025 imports by partner country across crude oil, LPG, LNG, urea, DAP and refined products, which is where every Gulf-share figure comes from.", url: "https://comtradeplus.un.org/", check: "UN Comtrade" },
      { label: "World Bank, Global Economic Prospects, June 2026 edition, for the growth forecasts and their January revisions, the Strait of Hormuz shipping series, the regional energy-dependence panel and the daily commodity index rebased to the day before the conflict.", url: "https://www.worldbank.org/en/publication/global-economic-prospects", check: "Global Economic Prospects" },
      { label: "World Bank Commodity Markets, the monthly Pink Sheet, for the Brent, Dubai Fateh and urea benchmark prices used to cross-check the Indian series.", url: "https://www.worldbank.org/en/research/commodity-markets", check: "Pink Sheet" },
      { label: "Ministry of Statistics and Programme Implementation, eSankhyiki, for the 2024-base consumer price index behind every retail inflation figure from January 2026 onward.", url: "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi", check: "Consumer Price Index", manual: "Client-rendered MoSPI page; the checker's 2.5 s render wait is sometimes too short. Passed automatically on 2 of 4 runs on 2026-10-19, and a manual headless render with a 10 s wait shows the 'Consumer Price Index' table, Base Year 2024." },
      { label: "Comptroller General of Accounts, Union Government Monthly Accounts Dashboard, for the excise, customs, subsidy, revenue and fiscal deficit figures. CGA's older downloadable monthly report path no longer resolves.", url: "https://cga.nic.in/MonthDashboardReport/Published/list.aspx", check: "Monthly Accounts" },
      { label: "Reserve Bank of India, Database on the Indian Economy, for the balance of payments series that shows why this article cannot yet state a current-account impact.", url: "https://data.rbi.org.in/DBIE/", check: "Database on Indian Economy" },
      { label: "IMF PortWatch, the upstream source for the Strait of Hormuz shipping estimates the World Bank publishes, and the place to see whether traffic has recovered since this was written.", url: "https://portwatch.imf.org/", check: "PortWatch" },
      { label: "Ministry of Petroleum and Natural Gas, exploration and production, the parent source for India's domestic crude output.", url: "https://mopng.gov.in/en/exp-and-prod/production", check: ["Production", "Crude"] },
      { label: "IndiaDataHub, which distributes several of the official series above in machine-readable form, including the MOSPI consumer price index, the CGA monthly accounts and the PPAC price tables. The fiscal figures reach this article through it rather than from CGA directly.", url: "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor", check: "Economic Monitor" }
    ],
    furtherReading: [
      { label: "World Bank, Global Economic Prospects, June 2026: the full report, including the South Asia chapter this article draws on and the two analytical chapters on sovereign debt and commodity-exporter fiscal policy.", url: "https://openknowledge.worldbank.org/entities/publication/e96798d7-a81d-44ea-8287-1b4d6ea83f75", check: "Global Economic Prospects, June 2026" },
      { label: "IMF PortWatch, Port Monitor: the live chokepoint tracker behind the Hormuz figures, updated well past the 24 May 2026 cut-off of the series charted here.", url: "https://portwatch.imf.org/pages/port-monitor", check: "Port Monitor" },
      { label: "PPAC, historical import and export reports, if you want the longer run of India's oil trade rather than the three fiscal years used here.", url: "https://ppac.gov.in/import-export/history", check: "Import" },
      { label: "UN Comtrade trade-flow explorer, to rebuild the Gulf-share calculations for a different year or a different commodity code.", url: "https://comtradeplus.un.org/TradeFlow", check: "Trade Flow" },
      { label: "Reserve Bank of India Bulletin, where the quarterly balance of payments is released and where the first measured current-account reading for this shock will appear.", url: "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx", check: "RBI Bulletin" }
    ]
  },
  "q.econ.per_person": {
    sourceNotes: [
      { label: "World Bank WDI, GDP per capita at current US$, India, 1960-2024 (NY.GDP.PCAP.CD)", url: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=IN", check: "NY.GDP.PCAP.CD" },
      { label: "IndiaDataHub, per capita nominal GDP and nominal GDP in rupees, annual, compiled from MoSPI National Accounts Statistics", url: "https://www.indiadatahub.com/", check: "IndiaDataHub" },
      { label: "MoSPI eSankhyiki portal (home page), where MoSPI publishes the National Accounts Statistics behind the IndiaDataHub series", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" }
    ]
  },
  "q.econ.poverty": {
    sourceNotes: [
      { label: "World Bank Poverty and Inequality Platform, data version 20250930 (2021 PPP): headcounts and poverty gaps at $3.00, $4.20, $8.30 and the $28 prosperity line, India and Asian peers, survey years only", url: "https://pip.worldbank.org/country-profiles/IND", check: ["Poverty and Inequality Platform", "India"] },
      { label: "World Bank, June 2025 update to global poverty lines: $2.15 to $3.00, $3.65 to $4.20 and $6.85 to $8.30 (2017 to 2021 PPP)", url: "https://www.worldbank.org/en/news/factsheet/2025/06/05/june-2025-update-to-global-poverty-lines", check: ["$3.00", "2021 PPP"] },
      { label: "World Bank Poverty & Equity Brief: India, October 2025 (archived copy; the World Bank URL now serves the October 2026 edition): rural-urban split, poverty by group, counts of the poor, MPM components and 15.5% MPM headcount", url: "https://web.archive.org/web/20260424085555/https://documents1.worldbank.org/curated/en/099722104222534584/pdf/IDU-25f34333-d3a3-44ae-8268-86830e3bc5a5.pdf", check: ["Poverty & Equity Brief", "October 2025", "15.5"] },
      { label: "World Bank WDI poverty context indicators, India: societal poverty (SI.POV.SOPO), prosperity gap (SI.SPR.PGAP), World Bank MPM (SI.POV.MPWB), UNDP MPI (SI.POV.MPUN), learning poverty (SE.LPV.PRIM), $8.30 headcount (SI.POV.UMIC) with population (SP.POP.TOTL) for the crore count", url: "https://data.worldbank.org/indicator/SI.POV.SOPO?locations=IN", check: "societal poverty" },
      { label: "World Bank, financial hardship from out-of-pocket health spending (SH_UHC_FH40 and impoverishing and large-spending variants), India", url: "https://data.worldbank.org/indicator/SH_UHC_FH40", check: "out-of-pocket" },
      { label: "Planning Commission, Press Note on Poverty Estimates 2011-12 (July 2013): Tendulkar poverty ratios and 2011-12 poverty lines", url: "https://www.niti.gov.in/sites/default/files/2020-05/press-note-poverty-2011-12-23-08-16.pdf", check: "Tendulkar" },
      { label: "C. Rangarajan and S. Mahendra Dev, Counting the Poor (MSE Monograph 30): the Rangarajan Expert Group's 2011-12 lines (Rs 972 rural, Rs 1,407 urban) and 29.5% headcount; the official Planning Commission report PDF is no longer online", url: "https://mse.ac.in/wp-content/uploads/2021/05/Monograph-30.pdf", check: ["Counting the Poor", "1407"] },
      { label: "The Wire, November 2019: report on the leaked, unreleased NSO 2017-18 consumption survey (real MPCE down 3.7%, rural down 8.8%, urban up 2%), first reported by Business Standard", url: "https://thewire.in/economy/consumer-sending-fall-rural-demand-nso-report", check: ["3.7", "8.8"] },
      { label: "Himanshu, Lanjouw and Schirmer, Tinbergen Institute Discussion Paper TI 2025-069/V, Table 5: PLFS-imputed Tendulkar-compatible poverty after 2011-12", url: "https://papers.tinbergen.nl/25069.pdf", check: "Himanshu" },
      { label: "MoSPI, Household Consumption Expenditure Survey 2023-24 fact sheet (press note, Dec 2024): MPCE with and without imputation, fractiles, consumption shares for 2022-23 and 2023-24", url: "https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf", check: ["Household Consumption Expenditure Survey", "2023-24"] },
      { label: "MoSPI, HCES 2023-24 unit-level microdata (NADA catalogue): rupee-cutoff poverty simulations by state and social group, caste MPCE, free-welfare share by decile, computed by Indica", url: "https://microdata.gov.in/NADA/index.php/catalog/237", check: "Household Consumption Expenditure Survey: 2023-24" },
      { label: "NSSO 68th round (2011-12) consumer expenditure, NADA catalogue; Report No. 555, Level and Pattern of Consumer Expenditure, Table T3 (MMRP), supplies the 2011-12 bottom-fractile MPCE", url: "https://microdata.gov.in/NADA/index.php/catalog/126/related-materials", check: "nss_rep_555" },
      { label: "MoSPI, PLFS July 2023-June 2024 round (NADA catalogue), for the casual-wage context; the 2017-18 to 2023-24 wage series is from the PLFS annual reports", url: "https://microdata.gov.in/NADA/index.php/catalog/213", check: "July 2023-June 2024" },
      { label: "NITI Aayog, Multidimensional Poverty in India since 2005-06, discussion paper (January 2024): national MPI headcount history", url: "https://www.niti.gov.in/sites/default/files/2024-01/MPI-22_NITI-Aayog20254.pdf", check: "Multidimensional Poverty in India since 2005-06" },
      { label: "NITI Aayog, National Multidimensional Poverty Index 2023: state headcount ratios, 2019-21", url: "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf", check: "National Multidimensional Poverty Index" },
      { label: "OPHI and UNDP, Global MPI Country Briefing 2023: India, Table 1 (headcount, intensity, vulnerability, severe poverty, rural-urban)", url: "https://ophi.org.uk/sites/default/files/2024-01/CB_IND_2023.pdf", check: "Country Briefing" },
      { label: "IIPS, National Family Health Survey (NFHS-6), India fact sheet: household amenities and nutrition indicators", url: "https://www.nfhsiips.in/nfhsuser/nfhs6.php", check: "NFHS-6" },
      { label: "ILOSTAT, working poverty rate (SDG_0111_SEX_AGE_RT_A), India, all ages and youth (data file; the ILOSTAT topic page blocks automated checks)", url: "https://rplumber.ilo.org/data/indicator?id=SDG_0111_SEX_AGE_RT_A&ref_area=IND&format=.json", check: "SDG_0111" },
      { label: "Max Roser, Our World in Data, Extreme poverty in brief: how low the international poverty lines are set (the $30-a-day comparison)", url: "https://ourworldindata.org/extreme-poverty-in-brief", check: "30" },
      { label: "Max Roser, Our World in Data, The end of progress against extreme poverty? (November 2025)", url: "https://ourworldindata.org/end-progress-extreme-poverty", check: "extreme poverty" }
    ]
  },
  "q.econ.rnd": {
    sourceNotes: [
      { label: "World Bank WDI (UNESCO Institute for Statistics), Research and development expenditure, % of GDP (GB.XPD.RSDV.GD.ZS): India, peers and the success-story countries", url: "https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS?locations=IN", check: "Research and development expenditure" },
      { label: "World Bank WDI (UNESCO Institute for Statistics), Researchers in R&D per million people (SP.POP.SCIE.RD.P6)", url: "https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6?locations=IN", check: "Researchers in R&D" },
      { label: "DST/NSTMIS, R&D Statistics at a Glance 2022-23: GERD, performer and agency shares, researchers, women in R&D, industrial R&D, latest year 2020-21", url: "https://www.nstmis-dst.org/Pdfs/R%26D%20Statistics%20at%20a%20Glance%2C%202022-23.pdf", check: "at a Glance" },
      { label: "DST/NSTMIS, S&T Indicators Tables 2019-20: India's gross expenditure on R&D, long series", url: "https://www.nstmis-dst.org/Pdfs/S%26TIndicatorsTables2019-20.pdf", check: "Indicators" },
      { label: "NITI Aayog, Ease of Doing Research and Development in India (May 2026): the 2% of GDP target and the business-vs-government funding split", url: "https://niti.gov.in/sites/default/files/2026-05/Ease-of-Doing-Research-and-Development-in-India.pdf", check: "Ease of Doing Research" },
      { label: "NITI Aayog, Improving the Culture of R&D in State Universities (2024), for the 5-7% budget recommendation", url: "https://www.niti.gov.in/sites/default/files/2024-06/StateUniRnD_FinalReport-Designedv3%20%281%29.pdf", check: "State Universities" },
      { label: "OECD, Main Science and Technology Indicators statistical release, March 2026: R&D in PPP dollars for China and the US (2024); India's 2020-21 figure from DST", url: "https://www.oecd.org/en/data/insights/statistical-releases/2026/03/oecd-overall-rd-growth-stable-government-rd-budgets-decline-and-reorient-towards-defence.html", check: "R&D" },
      { label: "Frontier Economics, Rate of Return to Investment in R&D (March 2023, for the UK Department for Science, Innovation and Technology), for the returns ranges charted as midpoints", url: "https://www.frontier-economics.com/media/015adtpq/rate-of-return.pdf", check: "rate of return" },
      { label: "RBI Annual Report 2024-25, Chapter II, Box II.2.1: R&D Expenditure as a Driver of India's Productivity Growth", url: "https://rbidocs.rbi.org.in/rdocs/AnnualReport/PDFs/02ECONOMIC2905202508F757396C584F1386DF1890664A7B50.PDF", check: ["Productivity Growth", "Box II.2.1"] },
      { label: "US National Science Board, Science and Engineering Indicators 2024: Publications Output (NSB-2023-33), Scopus-based counts", url: "https://ncses.nsf.gov/pubs/nsb202333", check: "Publications Output" },
      { label: "WIPO, Intellectual property statistical country profile 2024: India, resident and non-resident patent applications", url: "https://www.wipo.int/edocs/statistics-country-profile/en/in.pdf", check: ["India", "Patent"] },
      { label: "WIPO, Global Innovation Index: India's ranking", url: "https://www.wipo.int/gii-ranking/en/india", check: "Global Innovation Index" },
      { label: "Business Standard, November 2024, on ISRO mission costs (Mangalyaan, Chandrayaan-3) against comparable foreign missions; approximate, news-sourced", url: "https://www.business-standard.com/india-news/what-makes-india-s-space-missions-cost-less-than-hollywood-sci-fi-movies-124110400430_1.html", check: ["Mangalyaan", "Chandrayaan"] },
      { label: "Union Budget 2024-25, Notes on Demands for Grants, Demand No. 89 (Department of Science and Technology): 2023-24 budget vs revised estimates for the R&D head (Rs 592 crore to Rs 200 crore) and NRF (Rs 2,000 crore to Rs 259 crore)", url: "https://www.indiabudget.gov.in/budget2024-25/doc/eb/sbe89.pdf", check: ["National Research Foundation", "Science and Technology"] },
      { label: "Anusandhan National Research Foundation (ANRF): about page, for the Rs 50,000 crore 2023-28 outlay and its government and private shares", url: "https://anrfonline.in/ANRF/About?HomePage=New", check: "Anusandhan National Research Foundation" },
      { label: "PMIndia, Cabinet approves the Research, Development and Innovation (RDI) Scheme, 1 July 2025: Rs 1 lakh crore corpus within ANRF", url: "https://www.pmindia.gov.in/en/news_updates/cabinet-approves-research-development-and-innovation-rdi-scheme-to-scale-up-research-development-and-innovation-in-strategic-and-sunrise-domains/", check: "Research Development and Innovation" }
    ]
  },
  "q.econ.rupee": {
    sourceNotes: [
      { label: "FRED, Indian rupees per US dollar, monthly average (EXINUS), 1973 onward; the long annual series adds pre-1973 official par values", url: "https://fred.stlouisfed.org/series/EXINUS", check: "EXINUS" },
      { label: "FRED, daily India/US exchange rate (DEXINUS) with the euro, pound and yen dollar rates, for the rupee against four currencies", url: "https://fred.stlouisfed.org/series/DEXINUS", check: "DEXINUS" },
      { label: "FRED, daily exchange rates category (H.10): peer currencies against the US dollar, 2000-2025", url: "https://fred.stlouisfed.org/categories/94", check: "Daily Rates" },
      { label: "FRED, Brent crude oil price, US$ per barrel, monthly (POILBREUSDM)", url: "https://fred.stlouisfed.org/series/POILBREUSDM", check: "POILBREUSDM" },
      { label: "FRED, nominal US dollar index against emerging-market currencies (DTWEXEMEGS)", url: "https://fred.stlouisfed.org/series/DTWEXEMEGS", check: "DTWEXEMEGS" },
      { label: "BIS data portal, effective exchange rates: India broad NEER and REER, monthly", url: "https://data.bis.org/topics/EER", check: "effective exchange rate" },
      { label: "BIS data portal, consumer prices (long CPI series, WS_LONG_CPI): India and US, used for inflation, PPP and cost-of-living series", url: "https://data.bis.org/topics/CPI", check: "Consumer prices" },
      { label: "BIS data portal, central bank policy rates (WS_CBPOL): India", url: "https://data.bis.org/topics/CBPOL", check: "policy rate" },
      { label: "BIS data portal, global liquidity indicators (WS_GLI): US dollar credit to non-bank borrowers in India", url: "https://data.bis.org/topics/GLI", check: "Global liquidity" },
      { label: "RBI Bulletin, Current Statistics Table 4: sale and purchase of US dollars by the RBI, spot and outstanding net forward position, monthly", url: "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=24245", check: "Sale/ Purchase of U.S. Dollar" },
      { label: "RBI Bulletin, Current Statistics Table 35: foreign investment inflows, net FDI and portfolio, monthly", url: "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=24280", check: "Foreign Investment Inflows" },
      { label: "RBI Bulletin, Current Statistics Table 37: NEER and REER of the rupee, 40-currency basket; the older 36-currency, 1985-base RBI series is chain-linked to it", url: "https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=24282", check: "Real Effective Exchange Rate" },
      { label: "RBI reference rate archive: month high and month low of the rupee-dollar reference rate", url: "https://www.rbi.org.in/scripts/ReferenceRateArchive.aspx", check: "Reference Rate" },
      { label: "RBI Handbook of Statistics on Indian Economy, Table 210: foreign exchange reserves, monthly (earlier history from FRED reserves excluding gold plus MoSPI gold value)", url: "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=24035", check: "Foreign Exchange Reserves" },
      { label: "RBI Handbook, Table 111: India's foreign trade in US$, oil and non-oil (DGCI&S data; the series uses the RBI DBIE workbook of this table, 1970-71 onward)", url: "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23936", check: "Foreign Trade - US Dollar" },
      { label: "RBI Handbook, Table 128: key components of India's balance of payments, US$ (current account)", url: "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23953", check: "Key Components of India" },
      { label: "RBI Handbook, Table 241: balance of payments indicators (current account as % of GDP)", url: "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=24066", check: "Balance of Payments Indicators" },
      { label: "RBI Handbook, Table 59: structure of interest rates (1-3 year term deposit rate), used for nominal and real deposit returns", url: "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23884", check: "Structure of Interest Rates" },
      { label: "World Bank WDI, personal remittances received, current US$ (BX.TRF.PWKR.CD.DT), India", url: "https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=IN", check: "BX.TRF.PWKR.CD.DT" }
    ],
    furtherReading: [
      { label: "Michael Debabrata Patra, Sunil Kumar, Joice John and Amarendra Acharya (2025), Foreign Exchange Intervention: Efficacy and Trade-offs in the Indian Experience, RBI Bulletin, January 2025", url: "https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx?Id=23129", check: "Foreign Exchange Intervention: Efficacy and Trade-offs" },
      { label: "Rajeswari Sengupta and Ajay Shah (2026), Words and deeds in the Indian exchange rate, The Leap Blog: dates India's de facto exchange-rate regimes, the source of the regime breaks in the volatility chart", url: "https://blog.theleapjournal.org/2026/05/words-and-deeds-in-indian-exchange-rate.html", check: ["Words and deeds in the Indian exchange rate", "Rajeswari Sengupta"] }
    ]
  },
  "q.econ.size": {
    sourceNotes: [
      { label: "MoSPI eSankhyiki portal (home page), where MoSPI's National Accounts Statistics are published: GDP, GVA by sector, expenditure components, GNI and saving, current and 2011-12 prices", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "IMF World Economic Outlook, April 2026 edition as fetched June 2026, GDP at current prices in US$, India, China, Japan, Germany and UK (NGDPD); the DataMapper link shows the latest edition", url: "https://www.imf.org/external/datamapper/NGDPD@WEO/IND", check: "GDP, current prices" },
      { label: "IMF World Economic Outlook, April 2026 edition as fetched June 2026, GDP at purchasing-power parity, India (PPPGDP); the DataMapper link shows the latest edition", url: "https://www.imf.org/external/datamapper/PPPGDP@WEO/IND", check: "Purchasing power parity" },
      { label: "IMF World Economic Outlook, April 2026 edition as fetched June 2026, GDP per capita in US$, India and comparison countries (NGDPDPC); the DataMapper link shows the latest edition", url: "https://www.imf.org/external/datamapper/NGDPDPC@WEO/IND", check: "GDP per capita, current prices" }
    ]
  },
  "q.econ.state_finances": {
    sourceNotes: [
      { label: "RBI State Finances: A Study of Budgets 2025-26 publication page", url: "https://www.rbi.org.in/scripts/AnnualPublications.aspx?head=State+Finances+%3A+A+Study+of+Budgets", check: "State Finances" },
      { label: "RBI e-STATES workbook used for state-finance rows", url: "https://rbidocs.rbi.org.in/rdocs/Publications/DOCS/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A.XLSX", check: ["e-STATES", "Own Tax Revenue"] },
      { label: "RBI explanatory notes and methodology for the State Finances publication", url: "https://rbidocs.rbi.org.in/rdocs/Publications/PDFs/06EXPLANATORY24012608539CE016444F378E0A5AAB69B04CB8.PDF", check: "Explanatory Note on Data Sources and Methodology" },
      { label: "RBI Handbook of Statistics on Indian States, used for GSDP, NSDP and per-capita NSDP denominators", url: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States", check: "Handbook of Statistics on Indian States" }
    ]
  },
  "q.econ.trade": {
    sourceNotes: [
      { label: "WTO Stats (Timeseries API): merchandise exports and imports by product group (ITS_MTV_AX, ITS_MTV_AM), world totals, and export value and volume indices (ITS_MTP_AXF, ITS_MTP_AXVF), India, annual", url: "https://stats.wto.org/", check: "WTO Stats" },
      { label: "WTO Stats: commercial services exports and imports by main sector (ITS_CS_QAX, ITS_CS_QAM), used for the services and goods-plus-services balance", url: "https://stats.wto.org/", check: "WTO Stats" },
      { label: "World Bank WDI, exports of goods and services, % of GDP (NE.EXP.GNFS.ZS), India", url: "https://data.worldbank.org/indicator/NE.EXP.GNFS.ZS?locations=IN", check: "NE.EXP.GNFS.ZS" },
      { label: "World Bank WDI, imports of goods and services, % of GDP (NE.IMP.GNFS.ZS), India", url: "https://data.worldbank.org/indicator/NE.IMP.GNFS.ZS?locations=IN", check: "NE.IMP.GNFS.ZS" },
      { label: "World Bank WDI, current account balance, % of GDP (BN.CAB.XOKA.GD.ZS), India", url: "https://data.worldbank.org/indicator/BN.CAB.XOKA.GD.ZS?locations=IN", check: "BN.CAB.XOKA.GD.ZS" },
      { label: "World Bank WDI, personal remittances received, current US$ (BX.TRF.PWKR.CD.DT), India", url: "https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=IN", check: "BX.TRF.PWKR.CD.DT" },
      { label: "World Bank WDI, GDP in current US$ (NY.GDP.MKTP.CD), India: denominator for remittances as a share of GDP", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=IN", check: "NY.GDP.MKTP.CD" },
      { label: "World Bank WDI, population total (SP.POP.TOTL), India: denominator for trade per person", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN", check: "SP.POP.TOTL" }
    ]
  },
  "q.econ.trade_competitiveness": {
    sourceNotes: [
      { label: "WTO Stats (Timeseries API): merchandise exports by product group for India, peers and the world (ITS_MTV_AX), used for world export shares and revealed comparative advantage; unit value indices (ITS_MTP_AUVXF, ITS_MTP_AUVMF) for terms of trade", url: "https://stats.wto.org/", check: "WTO Stats" },
      { label: "WTO Stats: simple average MFN applied tariff, all, agricultural and non-agricultural products (TP_A_0010, TP_A_0160, TP_A_0430), India and peers", url: "https://stats.wto.org/", check: "WTO Stats" },
      { label: "World Bank WITS, India trade summary: simple average MFN and effectively applied tariff (MFN-SMPL-AVRG, AHS-SMPL-AVRG)", url: "https://wits.worldbank.org/CountryProfile/en/Country/IND/Year/LTST/Summary", check: "Effectively Applied" },
      { label: "World Bank WDI, exports of goods and services, % of GDP (NE.EXP.GNFS.ZS): India page; the chart also uses China, South Korea, Viet Nam and world from the same indicator", url: "https://data.worldbank.org/indicator/NE.EXP.GNFS.ZS?locations=IN", check: "NE.EXP.GNFS.ZS" },
      { label: "World Bank WDI, high-technology exports, % of manufactured exports (TX.VAL.TECH.MF.ZS), India", url: "https://data.worldbank.org/indicator/TX.VAL.TECH.MF.ZS?locations=IN", check: "TX.VAL.TECH.MF.ZS" },
      { label: "Harvard Growth Lab, Atlas of Economic Complexity: Economic Complexity Index rankings (HS92), India and peers", url: "https://atlas.hks.harvard.edu/rankings", check: "Economic Complexity" },
      { label: "OECD Trade in Value Added (TiVA) principal indicators: foreign and domestic value added in gross exports (EXGR_FVA, EXGR_DVA, EXGR_INT_DVA), India", url: "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_TIVA_MAINLV%40DF_MAINLV&df[ag]=OECD.STI.PIE", check: "Trade in Value Added" },
      { label: "UNCTADstat, Liner Shipping Connectivity Index (US.LSCI), India, China and Singapore, quarterly", url: "https://unctadstat.unctad.org/datacentre/dataviewer/US.LSCI", check: "LSCI" }
    ]
  },
  "q.econ.trade_partners": {
    sourceNotes: [
      { label: "WTO Stats (Timeseries API): India merchandise exports and imports by product group, annual (ITS_MTV_AX, ITS_MTV_AM), and total merchandise trade, monthly (ITS_MTV_MX, ITS_MTV_MM)", url: "https://stats.wto.org/", check: "WTO Stats" },
      { label: "UN Comtrade: India merchandise trade by partner country and by HS 2-digit chapter, 2024, plus partner history used for the regional, China, Russia and top-5 partner series", url: "https://comtradeplus.un.org/", check: "Comtrade" }
    ]
  },
  "q.econ.trade_services": {
    sourceNotes: [
      { label: "WTO Stats (Timeseries API): commercial services exports by main sector, India, China, South Korea, Philippines and world (ITS_CS_QAX), preliminary annual estimates 2005-2025", url: "https://stats.wto.org/", check: "WTO Stats" },
      { label: "WTO Stats: merchandise exports, India and world (ITS_MTV_AX), for the goods comparison and world shares", url: "https://stats.wto.org/", check: "WTO Stats" },
      { label: "World Bank WDI, ICT service exports, % of service exports, BoP (BX.GSR.CCIS.ZS), India", url: "https://data.worldbank.org/indicator/BX.GSR.CCIS.ZS?locations=IN", check: "BX.GSR.CCIS.ZS" }
    ]
  },
  "q.education.literacy": {
    sourceNotes: [
      { label: "World Bank WDI, adult literacy rate, ages 15+, India, 1981-2024 (SE.ADT.LITR.ZS)", url: "https://data.worldbank.org/indicator/SE.ADT.LITR.ZS?locations=IN", check: "SE.ADT.LITR.ZS" },
      { label: "World Bank WDI, secondary school gross enrolment ratio, India (SE.SEC.ENRR)", url: "https://data.worldbank.org/indicator/SE.SEC.ENRR?locations=IN", check: "SE.SEC.ENRR" }
    ]
  },
  "q.education.years": {
    sourceNotes: [
      { label: "World Bank WDI, school life expectancy, primary to tertiary, India, 1971-2019 (SE.SCH.LIFE)", url: "https://data.worldbank.org/indicator/SE.SCH.LIFE?locations=IN", check: "SE.SCH.LIFE" },
      { label: "World Bank WDI, secondary school gross enrolment ratio, India (SE.SEC.ENRR)", url: "https://data.worldbank.org/indicator/SE.SEC.ENRR?locations=IN", check: "SE.SEC.ENRR" },
      { label: "World Bank WDI, adult literacy rate, ages 15+, India (SE.ADT.LITR.ZS)", url: "https://data.worldbank.org/indicator/SE.ADT.LITR.ZS?locations=IN", check: "SE.ADT.LITR.ZS" }
    ]
  },
  "q.energy.access": {
    sourceNotes: [
      { label: "World Bank WDI, access to electricity, % of population, India (EG.ELC.ACCS.ZS)", url: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS?locations=IN", check: "EG.ELC.ACCS.ZS" },
      { label: "World Bank WDI, access to clean fuels and technologies for cooking, % of population, India (EG.CFT.ACCS.ZS)", url: "https://data.worldbank.org/indicator/EG.CFT.ACCS.ZS?locations=IN", check: "EG.CFT.ACCS.ZS" },
      { label: "World Bank WDI, electric power consumption, kWh per capita, India (EG.USE.ELEC.KH.PC)", url: "https://data.worldbank.org/indicator/EG.USE.ELEC.KH.PC?locations=IN", check: "EG.USE.ELEC.KH.PC" },
      { label: "US Energy Information Administration, International Energy Statistics, India total energy data (energy consumption per capita, million Btu per person, 1980-2024)", url: "https://www.eia.gov/international/data/country/IND/total-energy/more-total-energy-data", check: ["India", "quad Btu"] }
    ]
  },
  "q.energy.coal": {
    sourceNotes: [
      { label: "Ember, Yearly Electricity Data: India coal generation, power-sector emissions and carbon intensity, 2000-2025", url: "https://ember-energy.org/data/yearly-electricity-data/", check: "Yearly electricity data" },
      { label: "US Energy Information Administration, International Energy Statistics for India: coal consumption, production and imports, and CO2 from coal and coke, 1980-2024", url: "https://www.eia.gov/international/data/country/IND", check: ["India", "Coal and coke"] }
    ]
  },
  "q.energy.demand_shape": {
    sourceNotes: [
      { label: "Grid-India (NERLDC) via Mendeley Data, Electricity Demand, Solar and Wind Generation Data of India at 1-hour interval, version 2: all-India hourly demand, solar and wind for 2024, CC BY", url: "https://data.mendeley.com/datasets/y58jknpgs8/2", check: "Electricity Demand, Solar and Wind Generation Data" },
      { label: "Grid-India hourly demand met via NITI Aayog India Climate and Energy Dashboard (ICED), load curve: annual all-India peak demand", url: "https://iced.niti.gov.in/energy/electricity/distribution/national-level-consumption/load-curve", check: "Load Curve" }
    ]
  },
  "q.energy.mix": {
    sourceNotes: [
      { label: "Ember, Yearly Electricity Data: India generation by source, demand and carbon intensity, 2000-2025", url: "https://ember-energy.org/data/yearly-electricity-data/", check: "Yearly electricity data" },
      { label: "US Energy Information Administration, International Energy Statistics for India: installed electricity capacity, total, fossil, renewable, solar and wind, 1980-2024", url: "https://www.eia.gov/international/data/country/IND", check: ["India", "Electricity"] },
      { label: "Ember and Energy Institute via Our World in Data, share of electricity generation from renewables, India", url: "https://ourworldindata.org/grapher/share-of-electricity-production-from-renewable-sources", check: ["renewables", "Ember"] }
    ]
  },
  "q.energy.renewables": {
    sourceNotes: [
      { label: "Ember and Energy Institute via Our World in Data, share of electricity generation from renewables (excludes nuclear), India, 1985-2025", url: "https://ourworldindata.org/grapher/share-of-electricity-production-from-renewable-sources", check: ["renewables", "Ember"] },
      { label: "Ember, Yearly Electricity Data: India generation by source, demand and carbon intensity, 2000-2025", url: "https://ember-energy.org/data/yearly-electricity-data/", check: "Yearly electricity data" },
      { label: "Global Carbon Budget via Our World in Data, CO2 emissions per capita, India, 1858-2024", url: "https://ourworldindata.org/grapher/co-emissions-per-capita", check: ["CO₂ emissions per capita", "Global Carbon Budget"] }
    ]
  },
  "q.energy.state_transitions": {
    sourceNotes: [
      { label: "Ember, India Electricity Data (monthly and yearly, national and state level): state carbon intensity 2024 and monthly solar, wind and hydro generation 2024", url: "https://ember-energy.org/data/india-electricity-data/", check: ["India Electricity Data", "state level"] },
      { label: "Ember, Yearly Electricity Data: India generation by source and clean share, 2000-2025", url: "https://ember-energy.org/data/yearly-electricity-data/", check: "Yearly electricity data" }
    ]
  },
  "q.energy.system": {
    sourceNotes: [
      { label: "Ember, Yearly Electricity Data: India generation by source, demand and carbon intensity, 2000-2025", url: "https://ember-energy.org/data/yearly-electricity-data/", check: "Yearly electricity data" },
      { label: "PPAC, Import/Export of Crude Oil and Petroleum Products, current report for 2025-26: quantities ('000 tonnes) and values (US$ million)", url: "https://ppac.gov.in/import-export", check: "Import/Export of Crude Oil and Petroleum Products" },
      { label: "PPAC, International Prices of Crude Oil (Indian Basket), US$ per barrel, 2020-21 to 2026-27 (latest year to date)", url: "https://ppac.gov.in/prices/international-prices-of-crude-oil", check: "Indian Basket" },
      { label: "PPAC, LNG Imports, current workbook for 2025-26 (March 2026 provisional)", url: "https://ppac.gov.in/natural-gas/import", check: "LNG Imports" },
      { label: "DGCI&S TradeStat, commodity-wise all-countries imports: crude oil (HS 270900), LNG (271111), petroleum products (2710), coal (2701) and coke (2704), 2017-18 to 2025-26", url: "https://tradestat.commerce.gov.in/eidb/commodity_wise_all_countries_import", check: ["Commodity-wise all Countries", "DGCI"] },
      { label: "World Bank WDI, access to electricity, % of population (EG.ELC.ACCS.ZS), India", url: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS?locations=IN", check: "Access to electricity" },
      { label: "World Bank WDI, population, total (SP.POP.TOTL), India", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN", check: "Population, total" }
    ]
  },
  "q.env.water_stress": {
    sourceNotes: [
      { label: "Central Water Commission, Reassessment of Water Availability in India using Space Inputs, 2019: 1,999 BCM average resource, 1,137 BCM utilisable", url: "https://www.cwc.gov.in/water-resource-estimation", check: ["1999", "1137 BCM", "Reassessment"] },
      { label: "Ministry of Jal Shakti, PIB release on per-capita water availability: 1,816 m3 (2001) to 1,367 m3 projected (2031)", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1604871", check: ["1816 cubic meters", "1367 cubic meters"] },
      { label: "Central Ground Water Board, Ground Water Resource Assessment: National Compilation on Dynamic Ground Water Resources of India, 2025 (stage of extraction 60.6%, 6,762 assessment units)", url: "https://cgwb.gov.in/GWRA/GWRA_2025.pdf", check: ["6,762", "60.6"] },
      { label: "CGWB and IIT Hyderabad, IN-GRES groundwater estimation system: state stage-of-extraction trend, 2020-2025", url: "https://ingres.iith.ac.in/home", check: "IN-GRES" },
      { label: "Ministry of Jal Shakti, PIB release on the CGWB Annual Ground Water Quality Report 2024: samples above limits and affected districts, 15,259 sites", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2109942", check: ["15,259", "19.8%"] },
      { label: "PIB, Jal Jeevan Mission: rural households with tap connections, 3.23 crore or about 17% (August 2019) to 79.74% (February 2025)", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2098651", check: ["79.74%", "3.23 crore"] },
      { label: "World Bank WDI from FAO AQUASTAT, freshwater withdrawals by sector, % of total: agriculture (ER.H2O.FWAG.ZS), domestic (ER.H2O.FWDM.ZS), industry (ER.H2O.FWIN.ZS), India", url: "https://data.worldbank.org/indicator/ER.H2O.FWAG.ZS?locations=IN", check: "agriculture" },
      { label: "World Bank WDI from FAO AQUASTAT, water productivity, constant 2015 US$ GDP per m3 of withdrawal (ER.GDP.FWTL.M3.KD), India", url: "https://data.worldbank.org/indicator/ER.GDP.FWTL.M3.KD?locations=IN", check: "Water productivity" },
      { label: "World Bank WDI from FAO AQUASTAT, renewable internal freshwater resources per capita (ER.H2O.INTR.PC), India", url: "https://data.worldbank.org/indicator/ER.H2O.INTR.PC?locations=IN", check: "Renewable internal freshwater resources per capita" },
      { label: "WHO/UNICEF Joint Monitoring Programme via World Bank WDI, people using safely managed drinking water services (SH.H2O.SMDW.ZS), India", url: "https://data.worldbank.org/indicator/SH.H2O.SMDW.ZS?locations=IN", check: "safely managed drinking water" }
    ]
  },
  "q.health.deaths": {
    sourceNotes: [
      { label: "IHME Global Burden of Disease 2023 via Our World in Data: modelled deaths by cause and age group, India, 1980-2023", url: "https://ourworldindata.org/grapher/annual-number-of-deaths-by-cause", check: ["Causes of death", "IHME"] },
      { label: "Sample Registration System Statistical Report 2024, Registrar General of India: crude death rate and infant mortality rate, 2018-2024", url: "https://censusindia.gov.in/nada/index.php/catalog/47152", check: "STATISTICAL REPORT 2024" },
      { label: "SRS Cause of Death in India 2022-2024, Registrar General of India: verbal-autopsy cause shares by sex", url: "https://censusindia.gov.in/nada/index.php/catalog/47147", check: "CAUSE OF DEATH IN INDIA 2022-2024" },
      { label: "Annual Report on Medical Certification of Cause of Death (MCCD) 2023, Registrar General of India: Statement 3.4, certified deaths by cause group (PDF)", url: "https://dc.crsorgi.gov.in/assets/download/Annual-Reports/mccd/2023.pdf", check: "Medical Certification of Cause of Death" },
      { label: "WHO Global Health Observatory: maternal mortality ratio (MDG_0000000026), UN MMEIG estimates, India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/maternal-mortality-ratio-(per-100-000-live-births)", check: "Maternal mortality ratio" },
      { label: "UN World Population Prospects 2024: total deaths by sex, India, 2000-2030, median variant", url: "https://population.un.org/wpp/", check: "World Population Prospects" },
      { label: "National Crime Records Bureau, Accidental Deaths & Suicides in India 2022: police-recorded suicides (1,70,924), cited for comparison with GBD", url: "https://www.ncrb.gov.in/accidental-deaths-suicides-in-india-year-wise.html?year=2022&keyword=", check: "आत्महत्याएँ 2022" }
    ]
  },
  "q.health.dementia": {
    sourceNotes: [
      { label: "LASI-DAD: Lee et al., Alzheimer's & Dementia 2023, 19(7):2898-2912 (doi:10.1002/alz.12928): India's first nationally representative, clinically adjudicated dementia prevalence estimate, 2018-20 wave", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10338640/", check: ["Prevalence of dementia in India", "LASI-DAD"] },
      { label: "IHME Global Burden of Disease 2023 via Our World in Data: modelled annual deaths from Alzheimer's and other dementias, India, 1980-2023", url: "https://ourworldindata.org/grapher/annual-number-of-deaths-by-cause", check: ["Causes of death", "IHME"] },
      { label: "Li, McGarry, Nicholas & Skinner, NBER Working Paper 34659: US Health and Retirement Study data on wealth around dementia onset (Table 1 and Table A1)", url: "https://www.nber.org/papers/w34659", check: "Dementia and Long-Run Trajectories in Household Finances" },
      { label: "World Alzheimer Report 2010: The Global Economic Impact of Dementia, Alzheimer's Disease International (Wimo and Prince): societal cost per person and informal-care share by country income group, 2010 USD (PDF)", url: "https://www.alzint.org/u/WorldAlzheimerReport2010.pdf", check: ["World Alzheimer Report 2010", "Global Economic Impact of Dementia"] },
      { label: "National Health Accounts Estimates for India, NHSRC and Ministry of Health and Family Welfare: out-of-pocket spending as a share of total health expenditure", url: "https://nhsrcindia.org/national-health-accounts-records", check: "National Health Accounts" }
    ],
    furtherReading: [
      { label: "Dementia India Alliance: free National Dementia Support Line (8585 990 990, several Indian languages), online memory screening and post-diagnosis support for families", url: "https://dementia-india.org/", check: "8585" },
      { label: "Alzheimer's and Related Disorders Society of India (ARDSI): caregiver helplines, counselling, day-care and full-time care across 20+ cities; India's member body of Alzheimer's Disease International", url: "https://ardsi.org/", check: "Alzheimer" },
      { label: "Li, McGarry, Nicholas & Skinner (2026), \"Dementia and Long-Run Trajectories in Household Finances\", NBER Working Paper 34659", url: "https://www.nber.org/papers/w34659", check: "Dementia and Long-Run Trajectories in Household Finances" },
      { label: "Boyle et al. (2019), \"Scam Awareness Related to Incident Alzheimer Dementia and Mild Cognitive Impairment\", Annals of Internal Medicine 170(10):702-709 (doi:10.7326/M18-2711)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9770589/", check: "Scam Awareness Related to Incident Alzheimer Dementia" },
      { label: "Nicholas, Langa, Bynum & Hsu (2021), \"Financial Presentation of Alzheimer Disease and Related Dementias\", JAMA Internal Medicine 181(2):220-227 (doi:10.1001/jamainternmed.2020.6432)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7851732/", check: "Financial Presentation of Alzheimer Disease and Related Dementias" },
      { label: "Mazzonna & Peracchi (2024), \"Are Older People Aware of Their Cognitive Decline? Misperception and Financial Decision-Making\", Journal of Political Economy 132(6) (doi:10.1086/728697), RePEc listing with publisher link", url: "https://ideas.repec.org/a/ucp/jpolec/doi10.1086-728697.html", check: "Are Older People Aware of Their Cognitive Decline" },
      { label: "Agarwal, Driscoll, Gabaix & Laibson (2007), \"The Age of Reason: Financial Decisions over the Life-Cycle\", NBER Working Paper 13191 (doi:10.3386/w13191)", url: "https://www.nber.org/papers/w13191", check: "The Age of Reason" },
      { label: "The Dementia India Report 2010 (ARDSI): an estimated nine in ten cases go undiagnosed (PDF)", url: "https://www.mhinnovation.net/sites/default/files/content/document/Dementia-India-Report.pdf", check: "Dementia India Report" },
      { label: "Longitudinal Ageing Study in India (LASI) Wave 1, 2017-18, India Report, IIPS (2020): pension coverage among older Indians (PDF)", url: "https://www.iipsindia.ac.in/sites/default/files/LASI_India_Report_2020_compressed.pdf", check: ["Longitudinal Ageing Study in India", "Old Age Pension Scheme"] },
      { label: "NCRB, Crime in India 2022: Chapter 6A, crime against senior citizens, where forgery, cheating and fraud is the second-largest head (year page, Hindi interface)", url: "https://www.ncrb.gov.in/crime-in-india-year-wise.html?year=2022&keyword=", check: ["भारत में अपराध", "1981-2022"] },
      { label: "Maintenance and Welfare of Parents and Senior Citizens Act, 2007, Section 23 (property transfer void where an elder is neglected)", url: "https://indiankanoon.org/doc/162941268/", check: "Section 23 in The Maintenance And Welfare Of Parents And Senior Citizens Act" },
      { label: "HelpAge India (2024), \"Ageing in India: Exploring Preparedness & Response to Care Challenges\"", url: "https://www.helpageindia.org/news/weaad-2024-press-release/", check: "Ageing in India" },
      { label: "Digital-arrest fraud losses, 2024: Rs 1,935 crore across 1,23,672 complaints, from Indian Cyber Crime Coordination Centre (I4C) figures in a Ministry of Home Affairs reply in the Rajya Sabha, March 2025, as reported by Inc42. All-victim totals, not broken down by age", url: "https://inc42.com/buzz/indians-lost-inr-1935-cr-to-digital-arrest-scams-in-2024-govt/", check: ["1,935", "Rajya Sabha"] }
    ]
  },
  "q.health.hale": {
    sourceNotes: [
      { label: "WHO Global Health Observatory, healthy life expectancy at birth (HALE, WHOSIS_000002), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy", check: "Healthy life expectancy (HALE)" },
      { label: "WHO Global Health Observatory, life expectancy at birth (WHOSIS_000001) and at age 60 (WHOSIS_000015), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy", check: ["Life expectancy at a specific age", "remaining years of life"] }
    ]
  },
  "q.health.life": {
    sourceNotes: [
      { label: "UN World Population Prospects 2024: life expectancy at birth by sex and crude death rate, India, 2000-2030, median variant", url: "https://population.un.org/wpp/", check: "World Population Prospects" },
      { label: "World Bank WDI, life expectancy at birth (SP.DYN.LE00.IN): India since 1960, with China, the United States and the world average from the same indicator", url: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=IN-CN-US", check: "Life expectancy at birth" },
      { label: "WHO Global Health Observatory, healthy life expectancy (HALE) at birth (WHOSIS_000002), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth", check: "Healthy life expectancy" },
      { label: "WHO Global Health Observatory, life expectancy at age 60 (WHOSIS_000015), India: indicator metadata page", url: "https://www.who.int/data/gho/indicator-metadata-registry/imr-details/2977", check: "Life expectancy at age 60" },
      { label: "WHO Global Health Observatory, under-five mortality rate (MDG_0000000007), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/under-five-mortality-rate-(probability-of-dying-by-age-5-per-1000-live-births)", check: "Under-five mortality rate" },
      { label: "WHO Global Health Observatory, infant mortality rate (MDG_0000000001), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/infant-mortality-rate-(probability-of-dying-between-birth-and-age-1-per-1000-live-births)", check: "Infant mortality rate" },
      { label: "WHO Global Health Observatory, current health expenditure as a share of GDP (GHED_CHEGDP_SHA2011), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/current-health-expenditure-(che)-as-percentage-of-gross-domestic-product-(gdp)-(-)", check: "Current health expenditure" }
    ]
  },
  "q.health.pedestrian_safety_2024": {
    sourceNotes: [
      { label: "Ministry of Road Transport and Highways, Road Accidents in India 2024: Tables 2.11, 4.2–4.5 and 5.6; Annexures 29(a) and 33.", url: "https://data.opencity.in/dataset/33d29ab0-f9e8-4fc7-b404-c93c1ed8e1b8/resource/30af828c-3513-4c74-a919-8daa708f077d/download/road-accidents-in-india-2024.pdf", check: "Road Accidents in India" },
      { label: "Supreme Court of India, Maniyar Iliyaz v. P. Ayyappan (19 June 2026), especially conclusions at pp. 12–13.", url: "https://api.sci.gov.in/supremecourt/2024/42514/42514_2024_3_1501_71888_Judgement_19-Jun-2026.pdf", check: ["Iliyaz", "Ayyappan"] },
      { label: "WHO, Pedestrian safety manual, second edition (2023): evidence on safer pedestrian facilities and speed management.", url: "https://www.who.int/publications/i/item/9789240072497/", check: "Pedestrian safety: a road safety manual" }
    ]
  },
  "q.health.road_safety_2024": {
    sourceNotes: [
      { label: "Ministry of Road Transport and Highways, Road Accidents in India 2024: Tables 1.1, 1.5, 1.6, 2.1, 3.3, 4.2, 4.3, 4.4, 5.6, 7.1 and 7.3; Section 10 reporting method.", url: "https://data.opencity.in/dataset/33d29ab0-f9e8-4fc7-b404-c93c1ed8e1b8/resource/30af828c-3513-4c74-a919-8daa708f077d/download/road-accidents-in-india-2024.pdf", check: "Road Accidents in India" },
      { label: "World Health Organization, India road safety country profile: reported and estimated 2021 road deaths with uncertainty interval.", url: "https://cdn.who.int/media/docs/default-source/country-profiles/road-safety/road-safety-2023-ind.pdf?download=true&sfvrsn=b4fb5a5c_3", check: ["Global status report on road safety 2023", "WHO estimated road traffic fatalities"] }
    ]
  },
  "q.health.transition": {
    sourceNotes: [
      { label: "World Bank WDI: life expectancy (SP.DYN.LE00.IN), under-five mortality (SH.DYN.MORT), maternal mortality (SH.STA.MMRT), measles immunisation (SH.IMM.MEAS), stunting and wasting (SH.STA.STNT.ZS, SH.STA.WAST.ZS), health spending (SH.XPD.CHEX.GD.ZS), physicians and hospital beds (SH.MED.PHYS.ZS, SH.MED.BEDS.ZS), India and comparators", url: "https://databank.worldbank.org/source/world-development-indicators", check: "World Development Indicators" },
      { label: "World Bank, Health Nutrition and Population Statistics by Wealth Quintile: India's poorest and richest fifths on stunting, wasting, skilled birth attendance and barriers to care", url: "https://databank.worldbank.org/source/health-nutrition-and-population-statistics-by-wealth-quintile", check: "Wealth Quintile" },
      { label: "National Family Health Survey, NFHS-5 (2019-21) and NFHS-6 (2023-24) fact sheets, IIPS and MoHFW: maternal care, immunisation, nutrition, overweight, tobacco, caesarean births, state and rural-urban gaps", url: "https://www.nfhsiips.in/nfhsuser/index.php", check: "National Family Health Survey" },
      { label: "IHME Global Burden of Disease via Our World in Data: disease burden (DALYs) by cause group, India and comparators", url: "https://ourworldindata.org/grapher/burden-of-disease-by-cause", check: ["Burden of disease by cause", "IHME"] },
      { label: "IHME Global Burden of Disease via Our World in Data: deaths attributed to risk factors, India", url: "https://ourworldindata.org/grapher/number-of-deaths-by-risk-factor", check: ["Deaths by risk factor", "IHME"] },
      { label: "IHME Global Burden of Disease via Our World in Data: deaths by cause, India", url: "https://ourworldindata.org/grapher/annual-number-of-deaths-by-cause", check: ["Causes of death", "IHME"] },
      { label: "Our World in Data: share of people with diabetes, India and comparators", url: "https://ourworldindata.org/grapher/diabetes-prevalence", check: "Share of people with diabetes" },
      { label: "WHO Global Health Observatory, healthy life expectancy (HALE) at birth, India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth", check: "Healthy life expectancy" },
      { label: "National Health Accounts Estimates for India, NHSRC and MoHFW: government and out-of-pocket shares of total health expenditure", url: "https://nhsrcindia.org/national-health-accounts-records", check: "National Health Accounts" },
      { label: "NSS 80th round, Survey on Household Social Consumption: Health (January-December 2025), unit-level data, MoSPI: tabulated by Indica for hospitalisation costs, financing, insurance and bypassing of public hospitals", url: "https://microdata.gov.in/NADA/index.php/catalog/290", check: "Household Social Consumption:Health" },
      { label: "NSS 75th round, Key Indicators of Social Consumption in India: Health (2017-18), MoSPI: the earlier rounds in the cost and private-share series (the 71st and 52nd rounds come from their own key-indicator reports) (PDF)", url: "https://mospi.gov.in/sites/default/files/publication_reports/KI_Health_75th_Final.pdf", check: "Key Indicators of Social Consumption in India: Health" },
      { label: "National Health Profile 2023 (18th issue), CBHI, DGHS: medical seats, public facilities and registered workforce, plus tables it reproduces from ORGI (causes of death by sex 2017-19, medically certified share of deaths) and NCRB (accidental deaths and suicides) (PDF)", url: "https://cbhidghs.mohfw.gov.in/sites/default/files/NHP/NHP-2023-Last-Final.pdf", check: "National Health Profile", manual: "2026-10-19: PDF (9.6 MB) downloaded in full by hand and passed one automated run ('National Health Profile' found 6 times); the CBHI server is slow and the checker's 60-second fetch timed out on two later runs" },
      { label: "Generic semaglutide retail prices, mid-2026: compiled from press coverage (Nirvana Clinics price guide, FiercePharma, Business Today, Medindia); linked here is Business Today's report on the generic launch", url: "https://www.businesstoday.in/industry/pharma/story/indias-weight-loss-drug-moment-what-happens-when-semaglutide-goes-generic-521612-2026-03-20", check: "semaglutide" }
    ],
    furtherReading: [
      { label: "Bloomberg, 'Ozempic copies to cost $14 in India as generic GLP-1 era starts' (20 March 2026), on Bloomberg Law's news site", url: "https://news.bloomberglaw.com/health-law-and-business/ozempic-copies-to-cost-14-in-india-as-generic-glp-1-era-starts", check: ["Ozempic Copies at $14 in India", "Natco"] },
      { label: "CNBC, 'India is launching cheap weight-loss drugs, but Novo Nordisk is betting its brands will stay on top' (23 March 2026)", url: "https://www.cnbc.com/2026/03/23/novo-nordisk-cheap-weight-loss-drugs-india-generic-ozempic-wegovy-semaglutide.html", check: "India is launching cheap weight-loss drugs" },
      { label: "Business Today, 'India's weight loss drug moment: what happens when semaglutide goes generic' (20 March 2026)", url: "https://www.businesstoday.in/industry/pharma/story/indias-weight-loss-drug-moment-what-happens-when-semaglutide-goes-generic-521612-2026-03-20", check: "What happens when semaglutide goes generic" }
    ]
  },
  "q.health.u5mr": {
    sourceNotes: [
      { label: "World Bank WDI, under-five mortality rate, India, 1960-2024 (UN IGME estimates) (SH.DYN.MORT)", url: "https://data.worldbank.org/indicator/SH.DYN.MORT?locations=IN", check: "SH.DYN.MORT" },
      { label: "WHO Global Health Observatory, under-five mortality rate (MDG_0000000007, UN IGME estimates), India, 2023 with uncertainty interval", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/under-five-mortality-rate-(probability-of-dying-by-age-5-per-1000-live-births)", check: "Under-five mortality rate" },
      { label: "WHO Global Health Observatory, infant mortality rate (MDG_0000000001, UN IGME estimates), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/infant-mortality-rate-(probability-of-dying-between-birth-and-age-1-per-1000-live-births)", check: "Infant mortality rate" },
      { label: "WHO Global Health Observatory, neonatal mortality rate (UN IGME estimates), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/neonatal-mortality-rate-(per-1000-live-births)", check: "Neonatal mortality rate" },
      { label: "UN World Population Prospects 2024, under-five mortality projections to 2030 (indicator 24), India", url: "https://population.un.org/dataportal/data/indicators/24/locations/356/start/1990/end/2030/line/linetimeplot", check: "Under-five mortality" },
      { label: "Gapminder and UN IGME via Our World in Data, child mortality rate, India, 1911-2023", url: "https://ourworldindata.org/grapher/child-mortality", check: ["Child mortality rate", "Gapminder"] }
    ]
  },
  "q.media.news_consumption": {
    sourceNotes: [
      { label: "Reuters Institute Digital News Report 2026, India page: survey of about 2,000 online, mainly English-speaking Indians (not nationally representative); news sources, platforms, trust and brand trust", url: "https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/india", check: "Digital News Report 2026" },
      { label: "MoSPI, NSS Comprehensive Modular Survey: Telecom 2025 (80th round, January-March 2025), press release: household internet access and internet use by sex and area (PDF)", url: "https://www.mospi.gov.in/sites/default/files/press_release/Final_press%20release_CMS_T.pdf", check: "Comprehensive Modular Survey: Telecom, 2025" },
      { label: "TRAI, Yearly Performance Indicators of Indian Telecom Services 2024-25: internet penetration per 100 people and data use per subscriber (PDF)", url: "https://www.trai.gov.in/sites/default/files/2025-07/YIR_08072025_0.pdf", check: "Yearly Performance Indicators" },
      { label: "TRAI, monthly telecom subscription reports: broadband subscriptions (connections, not unique people)", url: "https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports", check: "Telecom Subscription" },
      { label: "IAMAI and Kantar, Internet in India 2024 (ICUBE): active internet users, rural-urban split and online news users", url: "https://www.iamai.in/research/internet-india-2024-kantariamai-report", check: "Internet in India 2024" },
      { label: "Press Registrar General of India, Press in India 2023-24, Volume I: registered publications and self-declared, unaudited circulation by language (PDF)", url: "https://prgi.gov.in/sites/default/files/2026-04/press_in_india_2023-24_vol_i_compressed_0.pdf", check: "Press in India" },
      { label: "FICCI-EY, Stories, scale and impact (March 2026): media and entertainment revenue by segment 2022-2025, social media hours, print revenue, and Comscore's online news audience as quoted in the report (EY press release)", url: "https://www.ey.com/en_in/newsroom/2026/03/india-s-media-and-entertainment-sector-grew-9-percent-to-inr-2-point-78-trillion-in-2025-driven-by-digital-and-live-experiences-ficci-ey-report", check: ["FICCI-EY", "Stories, scale and impact"] }
    ]
  },
  "q.people.age": {
    sourceNotes: [
      { label: "UN World Population Prospects 2024, median age, 2000-2100 (indicator 67), India", url: "https://population.un.org/dataportal/data/indicators/67/locations/356/start/1950/end/2100/line/linetimeplot", check: "Median age" },
      { label: "UN World Population Prospects 2024, population by five-year age group and sex (indicator 46), India", url: "https://population.un.org/dataportal/data/indicators/46/locations/356/start/1990/end/2030/line/linetimeplot", check: "5-year age groups" },
      { label: "UN World Population Prospects 2024, old-age and child dependency ratios (indicators 84 and 83) (indicator 84), India", url: "https://population.un.org/dataportal/data/indicators/84/locations/356/start/1990/end/2030/line/linetimeplot", check: "Old-age dependency ratio" },
      { label: "UN World Population Prospects 2024, life expectancy at birth by sex (indicator 61), India", url: "https://population.un.org/dataportal/data/indicators/61/locations/356/start/1990/end/2030/line/linetimeplot", check: "Life expectancy" },
      { label: "World Bank WDI, population aged 0-14, % of total, India (SP.POP.0014.TO.ZS)", url: "https://data.worldbank.org/indicator/SP.POP.0014.TO.ZS?locations=IN", check: "SP.POP.0014.TO.ZS" },
      { label: "World Bank WDI, population aged 15-64, % of total, India (SP.POP.1564.TO.ZS)", url: "https://data.worldbank.org/indicator/SP.POP.1564.TO.ZS?locations=IN", check: "SP.POP.1564.TO.ZS" },
      { label: "World Bank WDI, population aged 65 and above, % of total, India (SP.POP.65UP.TO.ZS)", url: "https://data.worldbank.org/indicator/SP.POP.65UP.TO.ZS?locations=IN", check: "SP.POP.65UP.TO.ZS" },
      { label: "WHO Global Health Observatory, life expectancy at age 60 (WHOSIS_000015), India, by sex", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy", check: ["Life expectancy at a specific age", "remaining years of life"] }
    ]
  },
  "q.people.fertility_divergence": {
    sourceNotes: [
      { label: "Sample Registration System, Office of the Registrar General of India: state total fertility rates, statistical reports 1971-2023.", url: "https://censusindia.gov.in/census.website/en/data/srsstat", check: "SAMPLE REGISTRATION SYSTEM (SRS)-STATISTICAL REPORT" },
      { label: "Data For India, fertility: the long state series assembled from SRS reports, 1971-2023, used for the state charts.", url: "https://www.dataforindia.com/fertility/", check: "Total Fertility Rate" },
      { label: "RBI Database on Indian Economy (DBIE): per-capita Net State Domestic Product at current prices, 1980-2024 (an app; the table sits under state statistics).", url: "https://data.rbi.org.in/DBIE/", check: "Database on Indian Economy" },
      { label: "RBI Handbook of Statistics on Indian States: state population estimates 2011-2024, used for population growth and the circle sizes in the state scatters.", url: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States", check: "Handbook of Statistics on Indian States" },
      { label: "National Family Health Survey 6 (2023-24), International Institute for Population Sciences: state fertility and the share of women with ten or more years of schooling.", url: "https://www.nfhsiips.in/nfhsuser/index.php", check: "National Family Health Survey" },
      { label: "MoSPI eSankhyiki portal (home page), where the Periodic Labour Force Survey 2023-24 state female participation rates are published.", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "National Commission on Population, Technical Group on Population Projections (2019): state fertility projected to 2031-35 (PDF).", url: "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf", check: "Technical Group on Population Projections" },
      { label: "World Bank: India's total fertility rate since 1960 (SP.DYN.TFRT.IN).", url: "https://data.worldbank.org/indicator/SP.DYN.TFRT.IN?locations=IN", check: "Fertility rate, total" },
      { label: "UN World Population Prospects 2024: India's fertility projected to 2100, median variant.", url: "https://population.un.org/wpp/", check: "World Population Prospects 2024" }
    ],
    furtherReading: [
      { label: "Data For India, interactive fertility charts drawing on SRS", url: "https://www.dataforindia.com/fertility/", check: "Total Fertility Rate" },
      { label: "National Commission on Population, Population Projections for India and States 2011-2036 (2019)", url: "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf", check: "Technical Group on Population Projections" },
      { label: "Business Standard, 'Delimitation in focus as 2 South CMs talk reversing population policies' (October 2024), on the delimitation debate", url: "https://www.business-standard.com/politics/fearing-political-loss-2-south-cms-seek-to-reverse-population-policies-124102101208_1.html", check: "Delimitation in focus as 2 South CMs talk reversing population policies" },
      { label: "The India Forum, 'South Indian Politicians Want Larger Families: What's in It for the Women?', on fertility and the delimitation debate", url: "https://www.theindiaforum.in/health/south-indian-politicians-want-larger-families", check: "South Indian Politicians Want Larger Families" }
    ]
  },
  "q.people.growth": {
    sourceNotes: [
      { label: "World Bank WDI, population total, India (modelled from the 2011 Census base) (SP.POP.TOTL)", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN", check: "SP.POP.TOTL" },
      { label: "World Bank WDI, annual population growth, India (SP.POP.GROW)", url: "https://data.worldbank.org/indicator/SP.POP.GROW?locations=IN", check: "SP.POP.GROW" },
      { label: "World Bank WDI, total fertility rate, India (SP.DYN.TFRT.IN)", url: "https://data.worldbank.org/indicator/SP.DYN.TFRT.IN?locations=IN", check: "SP.DYN.TFRT.IN" },
      { label: "UN World Population Prospects 2024, total population, median and other variants to 2100 (indicator 49), India", url: "https://population.un.org/dataportal/data/indicators/49/locations/356/start/1950/end/2100/line/linetimeplot", check: "Total population" },
      { label: "UN World Population Prospects 2024, annual rate of population change (indicator 51), India, projections to 2100", url: "https://population.un.org/wpp/", check: "World Population Prospects 2024" },
      { label: "Sample Registration System Statistical Report 2024, Office of the Registrar General of India: total fertility rate, total, rural and urban, 2019-2024", url: "https://censusindia.gov.in/nada/index.php/catalog/47152", check: "Sample Registration System" }
    ]
  },
  "q.people.old_before_rich": {
    sourceNotes: [
      { label: "Sample Registration System Statistical Report 2024, Registrar General of India: total fertility rate, total, rural and urban, 2019-2024", url: "https://censusindia.gov.in/nada/index.php/catalog/47152", check: "STATISTICAL REPORT 2024" },
      { label: "World Bank WDI, population ages 65 and above (SP.POP.65UP.TO.ZS), India and Japan", url: "https://data.worldbank.org/indicator/SP.POP.65UP.TO.ZS?locations=IN-JP", check: "Population ages 65 and above" },
      { label: "World Bank WDI, GDP per capita in current US dollars (NY.GDP.PCAP.CD), India and Japan", url: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=IN-JP", check: "GDP per capita" },
      { label: "UN World Population Prospects 2024: median age (with low and high fertility variants to 2100), old-age dependency ratio and broad age shares, India", url: "https://population.un.org/wpp/", check: "World Population Prospects" }
    ]
  },
  "q.people.population": {
    sourceNotes: [
      { label: "World Bank WDI, population total, India, China and world (also the basis of India's share of world population) (SP.POP.TOTL)", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN-CN-1W", check: "SP.POP.TOTL" },
      { label: "World Bank WDI, total fertility rate, India and ten comparison countries and the world (SP.DYN.TFRT.IN)", url: "https://data.worldbank.org/indicator/SP.DYN.TFRT.IN?locations=IN", check: "SP.DYN.TFRT.IN" },
      { label: "World Bank WDI, other India indicators charted: urban share (SP.URB.TOTL.IN.ZS), age shares (SP.POP.0014.TO.ZS, SP.POP.1564.TO.ZS, SP.POP.65UP.TO.ZS), life expectancy (SP.DYN.LE00.IN), GDP per capita (NY.GDP.PCAP.CD) and female labour-force participation (SL.TLF.ACTI.FE.ZS)", url: "https://databank.worldbank.org/source/world-development-indicators", check: "World Development Indicators" },
      { label: "UN World Population Prospects 2024, total population projections, median and other variants to 2100 (with growth rate, indicator 51) (indicator 49), India", url: "https://population.un.org/dataportal/data/indicators/49/locations/356/start/1950/end/2100/line/linetimeplot", check: "Total population" },
      { label: "UN World Population Prospects 2024: age-sex structure (46), median age (67), old-age dependency (84) and mean age at childbearing (18), India", url: "https://population.un.org/wpp/", check: "World Population Prospects 2024" },
      { label: "Sample Registration System Statistical Report 2024, Office of the Registrar General of India: crude birth rate, total fertility rate, age-specific fertility, birth order and sex ratio at birth, 2019-2024", url: "https://censusindia.gov.in/nada/index.php/catalog/47152", check: "Sample Registration System" },
      { label: "Sample Registration System, Office of the Registrar General of India: state total fertility rates, statistical reports 2013-2023", url: "https://censusindia.gov.in/census.website/en/data/srsstat", check: "Sample Registration System" },
      { label: "Data For India, fertility: state SRS series, NFHS 1-5 median ages at marriage and birth, and the WDI fertility versus female participation data used here", url: "https://www.dataforindia.com/fertility/", check: "fertility" },
      { label: "National Family Health Survey 6 (2023-24), IIPS: state fertility, contraception, sterilisation, unmet need, teenage motherhood and child marriage", url: "https://www.nfhsiips.in/nfhsuser/index.php", check: "National Family Health Survey" },
      { label: "NFHS-5 (2019-21) India Report, IIPS and ICF, Table 4.2: fertility by schooling, wealth and religion (PDF)", url: "https://dhsprogram.com/pubs/pdf/FR375/FR375.pdf", check: ["National Family Health Survey (NFHS-5)", "Fertility by background characteristics"] },
      { label: "Vollset et al., 'Fertility, mortality, migration, and population scenarios for 195 countries and territories from 2017 to 2100', The Lancet (2020): IHME reference projection", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7561721/", check: "population scenarios for 195 countries and territories" },
      { label: "National Commission on Population, Technical Group on Population Projections (November 2019): state fertility projected to 2031-35 (PDF)", url: "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf", check: "Technical Group on Population Projections" }
    ]
  },
  "q.people.pyramid": {
    sourceNotes: [
      { label: "UN World Population Prospects 2024, population by five-year age group and sex (indicator 46), India", url: "https://population.un.org/dataportal/data/indicators/46/locations/356/start/1990/end/2030/line/linetimeplot", check: "5-year age groups" },
      { label: "UN World Population Prospects 2024, share of population by broad age group (indicator 71), India", url: "https://population.un.org/dataportal/data/indicators/71/locations/356/start/1990/end/2030/line/linetimeplot", check: "broad age group" },
      { label: "UN World Population Prospects 2024, old-age dependency ratio (with child and total ratios, indicators 83 and 86) (indicator 84), India", url: "https://population.un.org/dataportal/data/indicators/84/locations/356/start/1990/end/2030/line/linetimeplot", check: "Old-age dependency ratio" },
      { label: "UN World Population Prospects 2024, median age, 2000-2100 (indicator 67), India", url: "https://population.un.org/dataportal/data/indicators/67/locations/356/start/1950/end/2100/line/linetimeplot", check: "Median age" }
    ]
  },
  "q.people.total": {
    sourceNotes: [
      { label: "World Bank WDI, population total, India, with annual growth (SP.POP.GROW) (SP.POP.TOTL)", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN", check: "SP.POP.TOTL" },
      { label: "World Bank WDI, total fertility rate, India (SP.DYN.TFRT.IN)", url: "https://data.worldbank.org/indicator/SP.DYN.TFRT.IN?locations=IN", check: "SP.DYN.TFRT.IN" },
      { label: "World Bank WDI, population by broad age, India: 0-14 (SP.POP.0014.TO.ZS), 15-64 and 65+ (SP.POP.65UP.TO.ZS) (SP.POP.1564.TO.ZS)", url: "https://data.worldbank.org/indicator/SP.POP.1564.TO.ZS?locations=IN", check: "SP.POP.1564.TO.ZS" },
      { label: "UN World Population Prospects 2024, total population projections to 2100 (indicator 49), India", url: "https://population.un.org/dataportal/data/indicators/49/locations/356/start/1950/end/2100/line/linetimeplot", check: "Total population" },
      { label: "UN World Population Prospects 2024: age-sex structure (46), median age (67), life expectancy (61) and dependency ratios (83, 84), India", url: "https://population.un.org/wpp/", check: "World Population Prospects 2024" },
      { label: "WHO Global Health Observatory, under-five mortality rate (MDG_0000000007, UN IGME estimates), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/under-five-mortality-rate-(probability-of-dying-by-age-5-per-1000-live-births)", check: "Under-five mortality rate" },
      { label: "WHO Global Health Observatory, infant mortality rate (MDG_0000000001, UN IGME estimates), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/infant-mortality-rate-(probability-of-dying-between-birth-and-age-1-per-1000-live-births)", check: "Infant mortality rate" },
      { label: "WHO Global Health Observatory, life expectancy at age 60 (WHOSIS_000015), India", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy", check: ["Life expectancy at a specific age", "remaining years of life"] }
    ]
  },
  "q.policy.internet_control": {
    sourceNotes: [
      { label: "Shutdown data: SFLC.in Internet Shutdowns Tracker.", url: "https://internetshutdowns.in/", check: "Internet Shutdowns" },
      { label: "DNS blocking data: dnsblocks.in ‘Poisoned Wells’ study.", url: "https://dnsblocks.in/", check: "Poisoned Wells" },
      { label: "Platform-wise URL blocking: Rajya Sabha Unstarred Question No. 732, answered 8 December 2023 (reply by the MoS, MeitY).", url: "https://sansad.in/getFile/annex/262/AU732.pdf?source=pqars", check: ["732", "blocking"] },
      { label: "Authority-wise website blocking: SFLC.in, ‘Finding 404: A report on website blocking in India’ (2022), from RTI replies.", url: "https://images.assettype.com/barandbench/2023-01/5b3b5f47-930a-4c78-b425-1109b7f12e08/Finding_404___A_Report_on_Website_Blocking_in_India.pdf", check: "Finding 404" },
      { label: "Aggregate URL blocking: MeitY answers to Parliament.", url: "https://sansad.in/rs/questions/questions-and-answers", check: "Questions" },
      { label: "Economic cost: ICRIER, ‘The Anatomy of an Internet Blackout’ (2018).", url: "https://icrier.org/publications/the-anatomy-of-an-internet-blackout-measuring-the-economic-impact-of-internet-shutdowns-in-india/", check: "Anatomy of an Internet Blackout" },
      { label: "Legal benchmark: Anuradha Bhasin v. Union of India (Supreme Court, 2020).", url: "https://indiankanoon.org/doc/82461587/", check: "Anuradha Bhasin" },
      { label: "App bans: curated from MeitY notifications and press reports.", url: "https://www.meity.gov.in/", check: "Ministry of Electronics" },
      { label: "Global comparisons: Access Now #KeepItOn dataset.", url: "https://www.accessnow.org/internet-shutdowns-2024/", check: "KeepItOn" }
    ]
  },
  "q.services.water": {
    sourceNotes: [
      { label: "World Bank WDI, people using at least basic drinking water services, % of population, India (SH.H2O.BASW.ZS)", url: "https://data.worldbank.org/indicator/SH.H2O.BASW.ZS?locations=IN", check: "SH.H2O.BASW.ZS" },
      { label: "World Bank WDI, people using at least basic sanitation services, % of population, India (SH.STA.BASS.ZS)", url: "https://data.worldbank.org/indicator/SH.STA.BASS.ZS?locations=IN", check: "SH.STA.BASS.ZS" },
      { label: "WHO/UNICEF Joint Monitoring Programme (JMP), household water and sanitation estimates for India, the upstream source of both World Bank series", url: "https://washdata.org/data/household#!/ind", check: "JMP" }
    ]
  },
  "q.society.connected": {
    sourceNotes: [
      { label: "ITU via Our World in Data, share of the population using the internet, India", url: "https://ourworldindata.org/grapher/share-of-individuals-using-the-internet", check: ["Share of the population using the Internet", "International Telecommunication Union"] },
      { label: "World Bank WDI from ITU, individuals using the internet, % of population (IT.NET.USER.ZS): India, China, United States and world", url: "https://data.worldbank.org/indicator/IT.NET.USER.ZS?locations=IN-CN-US", check: ["IT.NET.USER.ZS"] },
      { label: "World Bank WDI from ITU, internet use by women (IT.NET.USER.FE.ZS), India", url: "https://data.worldbank.org/indicator/IT.NET.USER.FE.ZS?locations=IN", check: "IT.NET.USER.FE.ZS" },
      { label: "World Bank WDI from ITU, internet use by men (IT.NET.USER.MA.ZS), India", url: "https://data.worldbank.org/indicator/IT.NET.USER.MA.ZS?locations=IN", check: "IT.NET.USER.MA.ZS" },
      { label: "World Bank WDI from ITU, mobile cellular subscriptions per 100 people (IT.CEL.SETS.P2), India", url: "https://data.worldbank.org/indicator/IT.CEL.SETS.P2?locations=IN", check: "Mobile cellular subscriptions" },
      { label: "World Bank WDI from ITU, fixed broadband subscriptions per 100 people (IT.NET.BBND.P2), India", url: "https://data.worldbank.org/indicator/IT.NET.BBND.P2?locations=IN", check: "Fixed broadband subscriptions" },
      { label: "World Bank WDI from ITU, fixed telephone subscriptions per 100 people (IT.MLT.MAIN.P2), India", url: "https://data.worldbank.org/indicator/IT.MLT.MAIN.P2?locations=IN", check: "Fixed telephone subscriptions" },
      { label: "World Bank WDI, access to electricity, % of population (EG.ELC.ACCS.ZS), India", url: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS?locations=IN", check: "Access to electricity" },
      { label: "TRAI, Telecom Subscription Data, monthly press releases: subscribers, rural and urban, tele-density, broadband, active wireless (VLR) and MNP requests, December 2008 to April 2026", url: "https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports", check: "Telecom Subscription Data as on April 2026" },
      { label: "TRAI, Telecom Subscription Data as on April 2026 (press release no. 63/2026), latest month cited", url: "https://www.trai.gov.in/sites/default/files/2026-05/PR_No.63of2026_0.pdf", check: ["April", "2026", "Tele-density"] },
      { label: "TRAI, Indian Telecom Services Performance Indicator Reports, via IndiaDataHub: data use per subscriber, cost of mobile data, wireless and wireline internet subscribers, quarterly to September 2025", url: "https://www.trai.gov.in/release-publication/reports/performance-indicators-reports", check: "Performance Indicator" },
      { label: "NPCI UPI monthly transaction volume (series PYVOUPITOT11M), April 2020 to April 2026, via IndiaDataHub India Economic Monitor feed (API documentation page)", url: "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor", check: ["India Economic Monitor", "IndiaDataHub"] }
    ]
  },
  "q.state.tax": {
    sourceNotes: [
      { label: "World Bank WDI, central government tax revenue, % of GDP, India (GC.TAX.TOTL.GD.ZS)", url: "https://data.worldbank.org/indicator/GC.TAX.TOTL.GD.ZS?locations=IN", check: "GC.TAX.TOTL.GD.ZS" },
      { label: "World Bank WDI, central government expense, % of GDP, India (GC.XPN.TOTL.GD.ZS)", url: "https://data.worldbank.org/indicator/GC.XPN.TOTL.GD.ZS?locations=IN", check: "GC.XPN.TOTL.GD.ZS" },
      { label: "World Bank WDI, central government debt, % of GDP, India (GC.DOD.TOTL.GD.ZS)", url: "https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS?locations=IN", check: "GC.DOD.TOTL.GD.ZS" }
    ]
  },
  "q.states.demographic_finances": {
    sourceNotes: [
      { label: "RBI, State Finances: A Study of Budgets of 2025-26: state budget data 1990-91 to 2023-24 actuals, and the state population projections it reproduces", url: "https://www.rbi.org.in/scripts/AnnualPublications.aspx?head=State+Finances+%3A+A+Study+of+Budgets", check: "State Finances" },
      { label: "RBI e-STATES workbook accompanying State Finances 2025-26: own tax revenue (Appendix 1), interest and pension spending (Appendix 2) and central transfers by state (XLSX)", url: "https://rbidocs.rbi.org.in/rdocs/Publications/DOCS/ESTATES23012026AB138FB463474EBFBCC03A8FC878C45A.XLSX", check: ["e-STATES", "Own Tax Revenue"] },
      { label: "National Commission on Population, Report of the Technical Group on Population Projections 2011-2036 (MoHFW, 2019, released 2020): state 60+ shares and old-age dependency ratios (PDF)", url: "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf", check: "Technical Group on Population Projections" },
      { label: "RBI Handbook of Statistics on Indian States 2024-25: GSDP, NSDP and per-capita NSDP (Tables 19, 21 and 23)", url: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States", check: "Handbook of Statistics on Indian States" }
    ]
  },
  "q.work.agriculture": {
    sourceNotes: [
      { label: "World Bank WDI, employment by sector, % of total employment (modelled ILO estimate): SL.AGR.EMPL.ZS, SL.IND.EMPL.ZS, SL.SRV.EMPL.ZS, India and comparison countries, 1991-2025", url: "https://data.worldbank.org/indicator/SL.AGR.EMPL.ZS", check: ["Employment in agriculture", "SL.AGR.EMPL.ZS"] },
      { label: "World Bank WDI, value added by sector, % of GDP: NV.AGR.TOTL.ZS, NV.IND.TOTL.ZS, NV.SRV.TOTL.ZS, India, 1960-2025", url: "https://data.worldbank.org/indicator/NV.AGR.TOTL.ZS?locations=IN", check: ["NV.AGR.TOTL.ZS"] },
      { label: "World Bank WDI, GDP per person employed, constant 2021 PPP $ (SL.GDP.PCAP.EM.KD), India, 1991-2024", url: "https://data.worldbank.org/indicator/SL.GDP.PCAP.EM.KD?locations=IN", check: ["SL.GDP.PCAP.EM.KD"] },
      { label: "MoSPI, Periodic Labour Force Survey Annual Report 2023-24 (July 2023-June 2024), with comparison tables back to 2017-18, usual status (ps+ss), PDF", url: "https://mospi.gov.in/sites/default/files/publication_reports/AnnualReport_PLFS2023-24L2.pdf", check: ["Annual Report, PLFS, 2023-24", "July 2017- June 2018"] },
      { label: "Herrendorf et al. and GGDC 10-Sector Database via Our World in Data, agriculture's share of employment, India, 1960-2010", url: "https://ourworldindata.org/grapher/share-of-agriculture-in-total-employment", check: "Share of agriculture in total employment" },
      { label: "IndiaDataHub (home page), Economic Monitor series: MGNREGA person-days (LAEMNREGPD11M, from the MGNREGA MIS) and Labour Bureau daily rural wage rates for men and women (LAWRAGGAVG13M, LAWRWTTAVG13M)", url: "https://www.indiadatahub.com/", check: "IndiaDataHub" }
    ]
  },
  "q.work.force": {
    sourceNotes: [
      { label: "World Bank WDI, labour force total, India (ILO modelled estimate) (SL.TLF.TOTL.IN)", url: "https://data.worldbank.org/indicator/SL.TLF.TOTL.IN?locations=IN", check: "SL.TLF.TOTL.IN" },
      { label: "World Bank WDI, labour force participation rate, ages 15+, India, Bangladesh, China, Vietnam, Indonesia and world (ILO modelled) (SL.TLF.CACT.ZS)", url: "https://data.worldbank.org/indicator/SL.TLF.CACT.ZS?locations=IN-1W", check: "SL.TLF.CACT.ZS" },
      { label: "World Bank WDI, unemployment rate, India (ILO modelled estimate) (SL.UEM.TOTL.ZS)", url: "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=IN", check: "SL.UEM.TOTL.ZS" },
      { label: "World Bank WDI, youth not in education, employment or training, India (SL.UEM.NEET.ZS)", url: "https://data.worldbank.org/indicator/SL.UEM.NEET.ZS?locations=IN", check: "SL.UEM.NEET.ZS" },
      { label: "World Bank WDI, population aged 15-64, % of total, India (SP.POP.1564.TO.ZS)", url: "https://data.worldbank.org/indicator/SP.POP.1564.TO.ZS?locations=IN", check: "SP.POP.1564.TO.ZS" },
      { label: "MoSPI eSankhyiki portal (home page), where the Periodic Labour Force Survey annual estimates for 2017-18 to 2023-24 (participation, worker ratio, unemployment, status, sector and earnings) are published", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "IndiaDataHub, monthly MGNREGA person-days of work created, compiled from Ministry of Rural Development data", url: "https://www.indiadatahub.com/", check: "IndiaDataHub" },
      { label: "Ministry of Rural Development, MGNREGA portal, the original publisher of the person-days data", url: "https://nrega.dord.gov.in/", check: "Mahatma Gandhi" }
    ]
  },
  "q.work.how_india_works": {
    sourceNotes: [
      { label: "MoSPI, Periodic Labour Force Survey Annual Report 2023-24 (July 2023-June 2024), with comparison tables back to 2017-18: participation, worker ratio, unemployment by education and social group, status, sector and earnings, PDF", url: "https://mospi.gov.in/sites/default/files/publication_reports/AnnualReport_PLFS2023-24L2.pdf", check: ["Annual Report, PLFS, 2023-24", "July 2017- June 2018"] },
      { label: "MoSPI eSankhyiki portal (home page), where the PLFS calendar-year unemployment rates for 2022-2025, usual status and current weekly status, are published", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "MoSPI eSankhyiki portal (home page), where the CPI (2012=100) series used to deflate PLFS earnings (CPI-Combined, survey-year mean) and rural wages (CPI-Rural) to 2012 rupees are published", url: "https://esankhyiki.mospi.gov.in/", check: "eSankhyiki" },
      { label: "World Bank WDI, labour force and participation (modelled ILO estimate): SL.TLF.TOTL.IN, SL.TLF.CACT.ZS, SL.TLF.CACT.FE.ZS, youth unemployment SL.UEM.1524.ZS, India and comparison countries, 1990-2025", url: "https://data.worldbank.org/indicator/SL.TLF.CACT.ZS", check: "SL.TLF.CACT.ZS" },
      { label: "World Bank WDI, status in employment (modelled ILO estimate): self-employed SL.EMP.SELF.ZS, wage and salaried SL.EMP.WORK.ZS, vulnerable employment SL.EMP.VULN.ZS, India, 1991-2025", url: "https://data.worldbank.org/indicator/SL.EMP.VULN.ZS?locations=IN", check: "SL.EMP.VULN.ZS" },
      { label: "World Bank WDI, sector structure and productivity: employment in agriculture SL.AGR.EMPL.ZS, value added NV.AGR.TOTL.ZS, NV.IND.TOTL.ZS, NV.SRV.TOTL.ZS, GDP per person employed SL.GDP.PCAP.EM.KD", url: "https://data.worldbank.org/indicator/SL.GDP.PCAP.EM.KD", check: "SL.GDP.PCAP.EM.KD" },
      { label: "World Bank WDI, population by age group, % of total: SP.POP.0014.TO.ZS, SP.POP.1564.TO.ZS, SP.POP.65UP.TO.ZS, India, 1960-2025", url: "https://data.worldbank.org/indicator/SP.POP.1564.TO.ZS?locations=IN", check: "SP.POP.1564.TO.ZS" },
      { label: "ILOSTAT, SDG 8.3.1 informal employment rate by sector (SDG_0831_SEX_ECO_RT_A), India 2010-2025 (data file; comparison countries from the same indicator)", url: "https://rplumber.ilo.org/data/indicator?id=SDG_0831_SEX_ECO_RT_A&ref_area=IND&format=.csv", check: "SDG_0831_SEX_ECO_RT" },
      { label: "ILOSTAT, SDG 8.6.1 youth NEET rate (SDG_0861_SEX_RT_A), India 2000-2025 (data file)", url: "https://rplumber.ilo.org/data/indicator?id=SDG_0861_SEX_RT_A&ref_area=IND&format=.csv", check: "SDG_0861_SEX_RT" },
      { label: "ILOSTAT, SDG 1.1.1 working poverty rate (SDG_0111_SEX_AGE_RT_A), India 2000-2025 (data file)", url: "https://rplumber.ilo.org/data/indicator?id=SDG_0111_SEX_AGE_RT_A&ref_area=IND&format=.csv", check: "SDG_0111_SEX_AGE_RT" },
      { label: "IndiaDataHub (home page), Economic Monitor series: EPFO net new subscribers (LAEMNETNSB11M), MGNREGA demand, person-days and active workers (LAEMNREGWD11M, LAEMNREGPD11M, LAEMNRGAWR11M), Labour Bureau rural wage rates (LAWRAGGAVG13M, LAWRWTTAVG13M) and the monthly PLFS unemployment rate (LAPLURARTT11M)", url: "https://www.indiadatahub.com/", check: "IndiaDataHub" },
      { label: "Maddison Project Database 2023 (Bolt and van Zanden) via Our World in Data, GDP per capita, India and comparison countries", url: "https://ourworldindata.org/grapher/gdp-per-capita-maddison-project-database", check: "Maddison Project Database" },
      { label: "Penn World Table (Feenstra et al.) and Huberman and Minns via Our World in Data, annual working hours per worker, 1970-2023", url: "https://ourworldindata.org/grapher/annual-working-hours-per-worker", check: ["Annual working hours per worker", "Penn World Table"] },
      { label: "Penn World Table (Feenstra et al.) via Our World in Data, labour productivity: output per hour worked, 1970-2023", url: "https://ourworldindata.org/grapher/labor-productivity-per-hour-pennworldtable", check: ["output per hour worked", "Penn World Table"] }
    ]
  },
  "q.work.jobs_challenge": {
    sourceNotes: [
      { label: "World Bank, The Global Jobs Challenge (2026 advance edition): figures 2.1A, 2.2C, 2.3B, 2.7B, 2.8A and 2.8D on population, youth and working-age projections and the jobs gap", url: "https://www.worldbank.org/en/research/publication/global-jobs-challenge", check: "Global Jobs Challenge" },
      { label: "UN World Population Prospects 2024, the population projections behind the World Bank figures", url: "https://population.un.org/wpp/", check: "World Population Prospects" },
      { label: "Alonso and MacDonald, Advancing India's Structural Transformation and Catch-up to the Technology Frontier (IMF Working Paper 2024/138), source of the 60-148 million jobs range", url: "https://doi.org/10.5089/9798400281617.001", check: ["Technology Frontier", "Alonso"] }
    ]
  },
  "q.work.who_works_in_india": {
    sourceNotes: [
      { label: "MoSPI NSO, Periodic Labour Force Survey, Calendar Year 2025 (January-December 2025), unit-level data, microdata catalogue entry: usual status (ps+ss), persons 15 and above, weighted by survey multipliers", url: "https://microdata.gov.in/nada/index.php/catalog/284", check: ["Calendar Year 2025", "Periodic Labour Force Survey"] }
    ]
  },
  "q.work.women": {
    sourceNotes: [
      { label: "MoSPI, Periodic Labour Force Survey Annual Report 2023-24 (July 2023-June 2024), with comparison tables back to 2017-18: female and male participation, worker ratio, unemployment and regular-wage earnings, usual status (ps+ss), PDF", url: "https://mospi.gov.in/sites/default/files/publication_reports/AnnualReport_PLFS2023-24L2.pdf", check: ["Annual Report, PLFS, 2023-24", "July 2017- June 2018"] },
      { label: "World Bank WDI, female labour force participation rate, % of female population 15+ (modelled ILO estimate, SL.TLF.CACT.FE.ZS), India and comparison countries, 1990-2025", url: "https://data.worldbank.org/indicator/SL.TLF.CACT.FE.ZS", check: "SL.TLF.CACT.FE.ZS" },
      { label: "IndiaDataHub (home page), Economic Monitor series: Labour Bureau daily rural wage rates for men and women (LAWRAGGAVG13M, LAWRWTTAVG13M) and the monthly PLFS female participation rate (LAPLLPARFA11M)", url: "https://www.indiadatahub.com/", check: "IndiaDataHub" }
    ]
  },
  "q.world.share": {
    sourceNotes: [
      { label: "World Bank WDI, population total, India and world, used for India's share of world population (SP.POP.TOTL)", url: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN-1W", check: "SP.POP.TOTL" },
      { label: "World Bank WDI, GDP at current US$, India and world, used for India's share of world GDP (NY.GDP.MKTP.CD)", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=IN-1W", check: "NY.GDP.MKTP.CD" },
      { label: "Global Carbon Budget via Our World in Data, annual CO2 emissions, India and world, used for India's share of world emissions", url: "https://ourworldindata.org/grapher/annual-co2-emissions-per-country", check: "Global Carbon Budget" }
    ]
  }
};
