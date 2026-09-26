#!/usr/bin/env python3
"""Check that a story's evidence bundle is complete in the next Git tree."""

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def repo_path(value):
    path = Path(value)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"Path must stay inside the repository: {value}")
    return path.as_posix()


def git(*args):
    return subprocess.run(
        ["git", *args], cwd=ROOT, stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL, check=False,
    ).returncode


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ledger", help="Claim ledger with an evidenceBundle entry")
    args = parser.parse_args()
    ledger_path = repo_path(args.ledger)
    ledger = json.loads((ROOT / ledger_path).read_text())
    bundle = ledger["evidenceBundle"]
    raw_manifest_path = repo_path(bundle["sourceManifest"])
    artifact_catalog_path = repo_path(bundle["artifactCatalog"])
    raw_manifest = json.loads((ROOT / raw_manifest_path).read_text())
    artifact_catalog = json.loads((ROOT / artifact_catalog_path).read_text())

    required = {ledger_path, raw_manifest_path, artifact_catalog_path}
    required.update(repo_path(path) for path in bundle["repositoryFiles"])
    raw_root = Path(raw_manifest_path).parent
    raw_files = set()
    errors = []

    for item in raw_manifest["files"]:
        path = repo_path((raw_root / repo_path(item["path"])).as_posix())
        raw_files.add(path)
        file = ROOT / path
        if file.is_file():
            digest = hashlib.sha256(file.read_bytes()).hexdigest()
            if digest != item["sha256"]:
                errors.append(f"source hash mismatch: {path}")
        required.add(path)

    actual_raw = {
        path.relative_to(ROOT).as_posix()
        for path in (ROOT / raw_root).rglob("*") if path.is_file()
    } - {raw_manifest_path}
    for path in sorted(actual_raw - raw_files):
        errors.append(f"raw file absent from source manifest: {path}")

    for item in artifact_catalog:
        if item.get("status") == "ready":
            required.add(repo_path(item["artifact"]))

    for path in sorted(required):
        if not (ROOT / path).is_file():
            errors.append(f"missing file: {path}")
        elif git("ls-files", "--cached", "--error-unmatch", "--", path):
            errors.append(f"not staged or committed: {path}")
        elif git("diff", "--quiet", "--", path):
            errors.append(f"unstaged changes: {path}")

    if errors:
        print("Evidence commit check failed:", file=sys.stderr)
        for error in errors:
            print(f"  {error}", file=sys.stderr)
        return 1
    print(f"Evidence commit check passed: {len(required)} indexed files, "
          f"{len(raw_files)} source hashes, "
          f"{sum(item.get('status') == 'ready' for item in artifact_catalog)} artifacts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
