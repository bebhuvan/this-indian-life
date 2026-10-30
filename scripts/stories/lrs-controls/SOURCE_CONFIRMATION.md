# Repeating the RBI source confirmation

The original article files stay unchanged in `data/raw/rbi-dbie-lrs-2026/`. The separate confirmation bundle holds lossless original CAS responses and independently refreshed RBI exports. Its manifest pins every file and the source-client code hashes.

Offline verification, using the standard Python library:

```bash
python3 scripts/stories/lrs-controls/verify_live_sources.py
python3 scripts/stories/lrs-controls/verify_claims.py
```

For another direct retrieval, use the Data bank checkout and its virtualenv. The output directory must be new so earlier evidence cannot be overwritten:

```bash
'/home/bhuvanesh.r/Documents/Data/Data bank/.venv/bin/python' \
  scripts/stories/lrs-controls/refresh_live_sources.py \
  --warehouse-root '/home/bhuvanesh.r/Documents/Data/Data bank' \
  --output /tmp/lrs-rbi-recheck
python3 scripts/stories/lrs-controls/verify_live_sources.py --bundle /tmp/lrs-rbi-recheck
```

This uses RBI's public guest APIs. It saves no credentials and does not save changes to source documents or create CAS policies. The replay requests refer to the existing read-only queries.

The verifier compares complete row multisets, preserving duplicate counts while ignoring order. It rejects changed or missing frozen rows and any unexpected Webi additions. CAS additions are reported separately, since overlapping query windows can acquire later observations. It also traces every warehouse CSV observation to its original source response and checks annual headline-versus-purpose sums generically. A later revision requires an explicit source-vintage review, not replacement of the approved article inputs.

FY2008-09's annual headline is retained as supplied and excluded as a reconciliation authority. The consistently used monthly headline sum agrees with the annual purpose components. That identifies the conflicting upstream cell without claiming to know RBI's internal cause.
