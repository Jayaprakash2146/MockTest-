"""Why do ticks miss? Print unattached ticks with candidate questions."""
import sys, json
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex
import pymupdf
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

doc = pymupdf.open(ex.PDF_PATH)
sections = {sid: [] for sid in ex.SECTION_IDS}
state = {"section": None, "qnum": 1, "cur": None, "keymode": False, "numoffset": 0, "flagged_off": None}
all_ticks = []
for pno in range(len(doc)):
    rows, ticks = ex.get_page_rows(doc[pno])
    all_ticks.extend((pno + 1, t[0], t[1], t[2]) for t in ticks)
    ex.feed(rows, state, pno + 1, sections, None)

print("total tick events:", len(all_ticks))
from collections import defaultdict
import bisect
qindex = defaultdict(list)
for sid in ex.SECTION_IDS:
    for q in sections[sid]:
        qindex[(q.page, q.col)].append(q)
for k in qindex:
    qindex[k].sort(key=lambda q: q.y)

# cdp pages only
miss = 0
for pno, ty, tx, val in all_ticks:
    if pno > 56:
        continue
    col = 0 if tx < 306 else 1
    cands = qindex.get((pno, col))
    if not cands:
        print(f"  no candidates p{pno} col{col}")
        continue
    ys = [q.y for q in cands]
    i = bisect.bisect_right(ys, ty + 8) - 1
    if i < 0:
        miss += 1
        print(f"  MISS p{pno} y={ty:.0f} x={tx:.0f} v={val}; first q y={ys[0]:.0f}")
    elif cands[i].tick is not None and cands[i].tick != val:
        print(f"  CLASH p{pno} col{col} y={ty:.0f} v={val} -> q{cands[i].number} (already {cands[i].tick})")
print("cdp misses:", miss)
