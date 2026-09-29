"""Dump raw text of selected PDF pages to understand the layout."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pymupdf

PDF = r"C:\Users\jayap\OneDrive\Desktop\mock test\ALL 2A MATHS PHYS IN ONE PDF STU PEDAKURAPADU.pdf"

pages = [int(x) for x in sys.argv[1:]] or [1, 2, 56]
doc = pymupdf.open(PDF)
print("page count:", len(doc))
for pno in pages:
    page = doc[pno - 1]
    print("=" * 30, f"PAGE {pno} (size {page.rect.width:.0f}x{page.rect.height:.0f})", "=" * 30)
    print(page.get_text("text")[:4000])
