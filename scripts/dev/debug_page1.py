"""Debug the parser state machine on page 1, col 0."""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pymupdf

sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex

doc = pymupdf.open(ex.PDF_PATH)
page = doc[0]
d = page.get_text("dict")
cols = {0: [], 1: []}
for block in d["blocks"]:
    if block.get("type") != 0:
        continue
    for ln in block["lines"]:
        spans = sorted(ln.get("spans", []), key=lambda s: s["bbox"][0])
        text = "".join(s["text"] for s in spans)
        x0, y0 = ln["bbox"][0], ln["bbox"][1]
        col = 0 if x0 < page.rect.width * 0.5 else 1
        cols[col].append((y0, x0, text))

lines = sorted(((y, t) for y, x, t in cols[0]), key=lambda r: (round(r[0], 1), r[1]))
for y, t in lines:
    tt = t.strip()
    marker = ""
    if not ex.is_header(tt):
        hm = ex.qmarker_at(tt, 4, True)
        om = ex.omarker_at(tt, 1)
        tm = ex.TICK_RE.match(tt)
        if tm: marker = "TICK"
        elif hm: marker = f"Q4@{hm[0]}"
        elif om: marker = f"O1@{om[0]}"
    print(f"y={y:6.1f} {marker:8s} {tt[:70]!r}")
