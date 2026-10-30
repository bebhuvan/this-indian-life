#!/usr/bin/env python3
"""Re-fetch RBI sources through its public guest APIs without saving credentials.

Run with the Data bank virtualenv; --output must be a new directory. The separate
offline verifier accepts this directory with --bundle. Existing evidence is immutable.
"""
import argparse
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
REFERENCE = ROOT / "data/raw/rbi-dbie-lrs-confirmation-20261030"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--warehouse-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    sys.path.insert(0, str(args.warehouse_root / "src"))
    from databank.rbi_dbie.webi import DbieWebiClient
    from databank.connectors.rbi_dbie_cas_money import CASGatewaySession
    reference = json.loads((REFERENCE / "manifest.json").read_text())
    for entry in reference["files"]:
        assert hashlib.sha256((REFERENCE / entry["path"]).read_bytes()).hexdigest() == entry["sha256"]
    args.output.mkdir(parents=True, exist_ok=False)
    files = []

    def store(name, data, url, role, **extra):
        (args.output / name).write_bytes(data)
        files.append({"path": name, "url": url, "retrieved": dt.datetime.now(dt.timezone.utc).isoformat(),
                      "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "role": role, **extra})

    with DbieWebiClient(timeout_seconds=60) as client:
        client.open()
        for comparison in reference["comparisons"]:
            if comparison["kind"] != "webi":
                continue
            rid = comparison["id"].split()[-1]
            export = client.export_report(rid)
            try:
                assert len(export.flows) == 1 and export.flows[0].provider_id == "DP0"
                data = export.flows[0].payload
                url = (f"https://data.rbi.org.in/BOE/OpenDocument/{export.biprws_build}/biprwsproxy/biprws/"
                       f"raylight/v1/documents/{export.document_id}/dataproviders/DP0/flows/0")
                store(comparison["livePath"], gzip.compress(data, mtime=0), url,
                      "independent live Webi download", uncompressedSha256=hashlib.sha256(data).hexdigest())
                receipt = {"reportId": rid, "documentId": export.document_id, "providers": export.providers}
                store(f"report-{rid}-receipt.json", (json.dumps(receipt, indent=2) + "\n").encode(), url,
                      "provider metadata without session credentials")
                print(f"Fetched Webi {rid}", flush=True)
            finally:
                export.cleanup()
    session = CASGatewaySession("https://data.rbi.org.in", timeout_seconds=60)
    try:
        for comparison in reference["comparisons"]:
            if comparison["kind"] != "cas":
                continue
            request = json.loads((REFERENCE / comparison["requestPath"]).read_text())
            url = request["sourceUrl"]
            # Only a read-only query replay. No policy creation or source document save.
            response = session.client.post(url, headers=session._headers(), json=request["requestBody"])
            response.raise_for_status()
            data = response.content
            store(comparison["livePath"], gzip.compress(data, mtime=0), url, "live replay of original query",
                  uncompressedSha256=hashlib.sha256(data).hexdigest())
            for key in ["frozenPath", "requestPath"]:
                name = comparison[key]
                store(name, (REFERENCE / name).read_bytes(), url, "unchanged original evidence from reference bundle")
            print(f"Fetched {comparison['id']}", flush=True)
    finally:
        session.close()
    manifest = {"story": "q.econ.lrs_controls", "purpose": "Fresh independent source confirmation",
                "files": files, "comparisons": reference["comparisons"]}
    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
