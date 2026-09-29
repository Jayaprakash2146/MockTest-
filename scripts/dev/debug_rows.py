"""Dump all numbered rows on given pages."""
import sys, re
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex
import pymupdf
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

doc = pymupdf.open(ex.PDF_PATH)
for pno in (24, 63, 127):
    print("=" * 25, "PAGE", pno, "=" * 25)
    rows, ticks = ex.get_page_rows(doc[pno - 1])
    for y, minx, text in rows:
        t, _ = ex.normalize_pua(text)
        ts = t.strip()
        if re.match(r"^\d{1,3}[\s.\uf02e]", ts) or re.match(r"^\d{1,3}$", ts):
            print(f"  y={y:6.1f} x={minx:6.1f}: {ts[:95]!r}")
