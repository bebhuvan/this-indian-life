#!/usr/bin/env python3
"""Write the registry's pinned, verified source lists into the explanation files.

The page renders the registry copy (src/data/questions.ts merges it over the
explanation), so this only keeps data/explanations/en/*.json consistent with what
readers see. Run it after editing scripts/registry/source-notes.mjs or after any
hand edit of an explanation. generate-explanations.mjs applies the same lists when
it writes a fresh explanation.

Edits only sourceNotes and furtherReading, with json load/dump at indent=2,
ensure_ascii=False, keeping a trailing newline only where the file had one. Never
touches bodyMarkdown.

Usage: python3 scripts/apply-pinned-references.py [--check]
  --check  report files that differ and exit 1, without writing.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DUMP = (
    'const { v1Questions } = await import("./scripts/registry/v1-indicators.mjs");'
    "const out = {};"
    "for (const q of v1Questions) {"
    "  const e = {};"
    '  for (const f of ["sourceNotes", "furtherReading"]) if (q[f]) e[f] = q[f];'
    "  if (Object.keys(e).length) out[q.id] = e;"
    "}"
    'const { pinnedReferences } = await import("./scripts/registry/source-notes.mjs");'
    # Explanations with no registry question are not built, but keep their JSON linked too.
    "for (const [id, refs] of Object.entries(pinnedReferences)) if (!out[id]) out[id] = refs;"
    "process.stdout.write(JSON.stringify(out));"
)


def plain(entry):
    if isinstance(entry, str):
        return entry
    return {"label": entry["label"], "url": entry.get("url")}


def main():
    check = "--check" in sys.argv[1:]
    pinned = json.loads(subprocess.run(
        ["node", "--input-type=module", "-e", DUMP], cwd=ROOT, check=True, capture_output=True, text=True
    ).stdout)
    changed = []
    for qid, fields in sorted(pinned.items()):
        path = ROOT / "data" / "explanations" / "en" / f"{qid}.json"
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8")
        doc = json.loads(raw)
        before = json.dumps({f: doc.get(f) for f in fields}, ensure_ascii=False)
        for field, items in fields.items():
            doc[field] = [plain(e) for e in items]
        if json.dumps({f: doc.get(f) for f in fields}, ensure_ascii=False) == before:
            continue
        changed.append(qid)
        if not check:
            out = json.dumps(doc, indent=2, ensure_ascii=False) + ("\n" if raw.endswith("\n") else "")
            path.write_text(out, encoding="utf-8")
    verb = "differ" if check else "updated"
    print(f"{len(changed)} explanation file(s) {verb}: {' '.join(changed) if changed else '-'}")
    if check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
