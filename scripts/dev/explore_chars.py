"""Inspect exact characters of key-table headers and small blocks on page 1."""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pymupdf

PDF = r"C:\Users\jayap\OneDrive\Desktop\mock test\ALL 2A MATHS PHYS IN ONE PDF STU PEDAKURAPADU.pdf"
doc = pymupdf.open(PDF)

print("---- page 95 first 300 chars (repr) ----")
t = doc[94].get_text("text")
print(repr(t[:300]))

print("\n---- ALL page-1 blocks sorted by (col,y), repr of short ones ----")
page = doc[0]
blocks = page.get_text("blocks")
rows = []
for x0, y0, x1, y1, text, bno, btype in blocks:
    t = text.strip()
    if not t:
        continue
    col = 0 if x0 < 300 else 1
    rows.append((col, y0, x0, x1, y1, t))
rows.sort(key=lambda r: (r[0], r[1]))
for col, y0, x0, x1, y1, t in rows:
    if len(t) <= 25:
        print(f"  c{col} y={y0:6.1f} x={x0:6.1f}->{x1:6.1f} {t!r}")
