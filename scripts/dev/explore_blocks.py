"""Inspect text blocks with coordinates to understand column layout."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pymupdf

PDF = r"C:\Users\jayap\OneDrive\Desktop\mock test\ALL 2A MATHS PHYS IN ONE PDF STU PEDAKURAPADU.pdf"
doc = pymupdf.open(PDF)

for pno in (1, 55, 56, 58, 59, 95, 96, 148, 149, 150, 151, 165, 166, 167, 183, 184, 185, 186, 207, 208):
    page = doc[pno - 1]
    blocks = page.get_text("blocks")
    print("=" * 20, f"PAGE {pno}: {len(blocks)} blocks", "=" * 20)
    for b in blocks[:14]:
        x0, y0, x1, y1, text, bno, btype = b
        t = " ".join(text.split())[:90]
        print(f"  [{x0:6.1f},{y0:6.1f} -> {x1:6.1f},{y1:6.1f}] {t}")
