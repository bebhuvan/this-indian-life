import os
import urllib.request
import urllib.parse
from pathlib import Path

# Target directory
target_dir = Path("data/snapshots/nha-pdf")
target_dir.mkdir(parents=True, exist_ok=True)

# Host url
base_url = "https://nhsrcindia.org"

# Files from the NHA website
files_to_download = [
    # NHA Reports
    {
        "url": "/sites/default/files/2026-05/NHA%202022-23%20Report.pdf",
        "name": "NHA_2022-23_Report.pdf"
    },
    {
        "url": "/sites/default/files/2024-09/NHA%202021-22.pdf",
        "name": "NHA_2021-22_Report.pdf"
    },
    {
        "url": "/sites/default/files/2024-09/NHA%202020-21.pdf",
        "name": "NHA_2020-21_Report.pdf"
    },
    {
        "url": "/sites/default/files/2023-04/National%20Health%20Accounts-2019-20.pdf",
        "name": "NHA_2019-20_Report.pdf"
    },
    {
        "url": "/sites/default/files/2022-09/NHA%202018-19_07-09-2022_revised_0.pdf",
        "name": "NHA_2018-19_Report.pdf"
    },
    {
        "url": "/sites/default/files/2021-11/National%20Health%20Accounts-%202017-18.pdf",
        "name": "NHA_2017-18_Report.pdf"
    },
    {
        "url": "/sites/default/files/2021-06/FINAL%20National%20Health%20Accounts%202016-17%20Nov%202019-for%20Web%20%281%29.pdf",
        "name": "NHA_2016-17_Report.pdf"
    },
    {
        "url": "/sites/default/files/2021-06/NHA%20Estimates%20Report%20-2015-16.pdf",
        "name": "NHA_2015-16_Report.pdf"
    },
    {
        "url": "/sites/default/files/2021-06/NHA%20Estimates%20Report%20-14-15.pdf",
        "name": "NHA_2014-15_Report.pdf"
    },
    {
        "url": "/sites/default/files/2021-06/NATIONAL%20HEALTH%20ACCOUNTS-%20Estimates%20for%20India-2013-14.pdf",
        "name": "NHA_2013-14_Report.pdf"
    },
    # NHA Supplementary Reports
    {
        "url": "/sites/default/files/2021-06/NATIONAL%20HEALTH%20ACCOUNTS-%20GUIDELINES%20FOR%20INDIA-2016.pdf",
        "name": "NHA_Guidelines_2016.pdf"
    },
    {
        "url": "/sites/default/files/2024-04/Provisional%20NHA%20Estimates.pdf",
        "name": "Provisional_NHA_Estimates.pdf"
    },
    {
        "url": "/sites/default/files/2021-06/Final%20Government%20Health%20Expenditure%20Report%20-%202013-14.pdf",
        "name": "Government_Health_Expenditure_2013-14.pdf"
    },
    {
        "url": "/sites/default/files/2023-11/NHA%20Infographics.pdf",
        "name": "NHA_Infographics.pdf"
    },
    {
        "url": "/sites/default/files/2021-06/Health%20Insurance%20Expenditures%20in%20India%202013-14%281%29.pdf",
        "name": "Health_Insurance_Expenditure_2013-14.pdf"
    },
    {
        "url": "/sites/default/files/2021-06/Household%20Health%20Expenditures%20in%20India%202013-14%281%29_0.pdf",
        "name": "Household_Health_Expenditure_2013-14.pdf"
    }
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

for item in files_to_download:
    url_path = item["url"]
    file_name = item["name"]
    dest_path = target_dir / file_name

    # Check if file already exists
    if dest_path.exists() and dest_path.stat().st_size > 0:
        print(f"Skipping {file_name}, already exists.")
        continue

    full_url = base_url + url_path
    print(f"Downloading {full_url} -> {dest_path}...")
    
    try:
        req = urllib.request.Request(full_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open(dest_path, "wb") as f:
                f.write(response.read())
        print(f"Successfully downloaded {file_name}")
    except Exception as e:
        print(f"Failed to download {file_name}: {e}")

print("Download job complete.")
