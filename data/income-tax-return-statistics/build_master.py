#!/usr/bin/env python3
"""Extract a master dataset from the Gemini-parsed ITR Statistics (.md) files.
Validated independently against source PDFs via pdftotext (see validate.py notes).
Outputs master.json (every table, keyed by year -> normalized heading -> rows).
"""
import os, re, json, glob

GEM = "../../../Indica doc parse/out/income_tax_return_statistics_direct_gemini_or"
HERE = os.path.dirname(os.path.abspath(__file__))
GEM = os.path.normpath(os.path.join(HERE, GEM))

def norm_heading(h):
    h = re.sub(r'\(AY[^)]*\)', '', h)
    h = h.replace('–', '-').replace('—', '-')
    h = re.sub(r'\s+', ' ', h).strip()
    return h

def parse_tables_after(lines, start):
    """Capture consecutive markdown-table blocks following a heading (until next heading)."""
    tables, i = [], start
    while i < len(lines):
        l = lines[i]
        if re.match(r'^#+\s', l):  # next heading
            break
        if l.strip().startswith('|'):
            block = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [c.strip().replace('**','') for c in lines[i].strip().strip('|').split('|')]
                # skip markdown separator rows like |---|---|
                if not all(re.fullmatch(r':?-{2,}:?', c or '-') for c in cells):
                    block.append(cells)
                i += 1
            if block:
                tables.append(block)
        else:
            i += 1
    return tables

def parse_md(path):
    L = open(path, encoding='utf-8').read().splitlines()
    out = {}
    for i, l in enumerate(L):
        m = re.match(r'^#+\s+(.*)', l)
        if not m: continue
        title = m.group(1)
        if '....' in title: continue  # TOC remnant
        # keep only data-bearing sections
        if not re.search(r'Range of|Gross Total Income|Status wise|Type of Business', title, re.I):
            continue
        key = norm_heading(title)
        tbls = parse_tables_after(L, i+1)
        if tbls:
            # if duplicate heading, keep the one with most rows
            if key not in out or sum(len(t) for t in tbls) > sum(len(t) for t in out[key]):
                out[key] = tbls
    return out

def main():
    master = {}
    for d in sorted(glob.glob(os.path.join(GEM, 'AY_*'))):
        if d.endswith('_alt'): continue
        year = os.path.basename(d)
        md = os.path.join(d, year + '.md')
        if not os.path.exists(md): continue
        master[year] = parse_md(md)
    out = os.path.join(HERE, 'master.json')
    json.dump(master, open(out, 'w'), indent=1, ensure_ascii=False)
    print(f"years: {len(master)}")
    for y in sorted(master):
        print(f"  {y}: {len(master[y])} tables")
    # quick sanity: list distinct headings in latest year
    print("\nHeadings in AY_2023-24:")
    for k in sorted(master.get('AY_2023-24', {})):
        print("  -", k)

if __name__ == '__main__':
    main()
