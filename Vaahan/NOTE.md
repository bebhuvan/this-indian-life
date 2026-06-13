# VAHAN Registration Data Handoff

Status: ready for article work, with VAHAN dashboard scrape as the primary source and IndiaDataHub as corroboration only.

## What Is In This Folder

- `tables/`: normalized JSON and CSV tables scraped from the VAHAN dashboard.
- `validation/`: validation reports, including targeted live re-scrapes and IndiaDataHub corroboration.
- `index.json`: cumulative index of all clean VAHAN tables.
- `README.md`: command and commit policy.

The Indica series artifact lives at `data/series/vahan.IN.auto.registrations.total_monthly.json` because the site loader expects article-ready series under `data/series/`.

## Current Coverage

- Years: 2003-2026.
- 2026 is partial through June because the current date for this run is June 13, 2026.
- Cuts downloaded:
  - `state_monthly`
  - `vehicle_class_monthly`
  - `fuel_monthly`
- Clean table count: 72.
- National monthly series observations: 282, from 2003-01 through 2026-06.

## Validation Status

Latest targeted live scrape checked boundary years `2010`, `2024`, `2025`, `2026` across all three cuts.

- Row-level validation errors: 0.
- Row-level validation warnings: 0.
- Cross-cut errors: 0.
- Cross-cut warnings: 2.

The two warnings are one-registration fuel-vs-state gaps:

- 2006-03: state total 647,259; fuel total 647,258.
- 2017-05: state total 2,099,375; fuel total 2,099,374.

These are retained as warnings, not corrected.

## IndiaDataHub Corroboration

Script: `npm run validate:vahan:idh`

IDH series checked: `INAUREGALL11M`, "Monthly Total Vehicle Registrations (ex Telangana)".

Result: the IDH label is not stable across the full period.

- 2010-01 through 2024-12: IDH closely matches VAHAN dashboard totals after subtracting the Telangana row.
- 2025-01 onward: IDH closely matches all-state VAHAN dashboard totals.
- Period-specific IDH validation failures: 0.
- Median absolute gap under the period-specific rule: 1,028 registrations, or 0.062%.

Use IDH as a corroborating check only. Use the scraped VAHAN dashboard tables as primary.

## Website And Methodology Notes Found

Official Parivahan / National Register pages say VAHAN is an integrated solution for vehicle registration and that National Register data flows from centralized VAHAN 4.0 plus different state registers from non-VAHAN offices. That supports the key caveat: dashboard data can include both VAHAN-running offices and historical/state-register flows, so it is registration-record data, not wholesale sales.

The VAHAN dashboard itself exposes office coverage in the filter label. During this run it showed all 36 VAHAN4-running states and 1,464/1,467 VAHAN4-running offices.

I did not find an official VAHAN dashboard methodology-change note explaining the IDH Telangana break.

External reporting explains the likely Telangana break: Telangana had continued with standalone transport IT infrastructure while other states had adopted VAHAN, and moved vehicle services onto the national VAHAN portal in March 2026. Reports also describe initial rollout/backlog issues after the switch. Treat Telangana around the integration period carefully in prose.

## Commands

Targeted verification:

```bash
python3 scripts/ingest-vahan-registrations.py --years 2010,2024,2025,2026 --cuts state_monthly,vehicle_class_monthly,fuel_monthly --write-series --delay 0.5
python3 scripts/ingest-vahan-registrations.py --index-only
npm run validate:vahan:idh
```

Full refresh:

```bash
npm run ingest:vahan:auto-history
python3 scripts/ingest-vahan-registrations.py --index-only
npm run validate:vahan:idh
```

## Article Language

Call this "vehicle registrations recorded in VAHAN", not auto sales. If using as demand proxy, say so explicitly.

Suggested caveat:

> VAHAN records registrations, not wholesale sales. The dashboard reflects records in VAHAN4-running offices and national/state-register flows. Telangana treatment changes across corroborating IDH data, so VAHAN dashboard tables are the primary source and IDH is used only as a check.
