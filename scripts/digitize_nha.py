import pypdf
from pathlib import Path
import re

pdf_dir = Path("data/snapshots/nha-pdf")
output_dir = Path("digitized-nha")
output_dir.mkdir(parents=True, exist_ok=True)

files = sorted(list(pdf_dir.glob("*.pdf")))

print(f"Starting digitization of {len(files)} PDFs...")

# Words or patterns to check on each page
patterns = [
    r"table of contents",
    r"contents",
    r"executive summary",
    r"highlights of",
    r"key health financing indicators",
    r"key indicators for india",
    r"table\s+[1-9]\s*:\s*key",
    r"table\s+a\s*.\s*6",
    r"table\s+a\s+6",
    r"key health financing indicators for select states",
    r"government health financing indicators",
    r"out-of-pocket expenditure"
]

def clean_ocr_text(text):
    if not text:
        return ""
    # Remove excessive consecutive spaces but preserve columns/tabs if they exist
    text = re.sub(r' +', ' ', text)
    return text

for file_path in files:
    md_file_name = file_path.stem + "_Digitized.md"
    md_path = output_dir / md_file_name
    print(f"\nProcessing {file_path.name} -> {md_file_name}...")
    
    try:
        reader = pypdf.PdfReader(file_path)
        num_pages = len(reader.pages)
        
        extracted_pages = []
        
        # Always extract first 5 pages (usually title, foreword, preface, messages)
        for idx in range(min(5, num_pages)):
            extracted_pages.append((idx + 1, reader.pages[idx].extract_text()))
            
        # Scan other pages for matching patterns
        for idx in range(5, num_pages):
            page_text = reader.pages[idx].extract_text()
            if not page_text:
                continue
            
            lower_text = page_text.lower()
            match = False
            for pat in patterns:
                if re.search(pat, lower_text):
                    match = True
                    break
            
            if match:
                extracted_pages.append((idx + 1, page_text))
                
        # Write to markdown
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(f"# Digitized Data from: {file_path.name}\n\n")
            f.write(f"- **Total Pages in Source PDF**: {num_pages}\n")
            f.write(f"- **Source URL**: https://nhsrcindia.org/sites/default/files/...\n\n")
            f.write("## Table of Contents / Key Excerpts / Digitized Tables\n\n")
            
            last_page = 0
            for page_num, text in extracted_pages:
                if page_num > last_page:
                    f.write(f"\n### --- PAGE {page_num} ---\n\n")
                    # Check if text looks like a table and format/clean it slightly
                    lines = text.split("\n")
                    for line in lines:
                        cleaned = clean_ocr_text(line)
                        if cleaned.strip():
                            f.write(cleaned + "  \n")
                    f.write("\n")
                    last_page = page_num
                    
        print(f"Saved {len(extracted_pages)} digitized pages to {md_file_name}")
    except Exception as e:
        print(f"Error digitizing {file_path.name}: {e}")

print("\nDigitization complete!")
