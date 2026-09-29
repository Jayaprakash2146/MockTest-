"""Trace parsing state through page 56."""
import sys, re
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex
import pymupdf
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

doc = pymupdf.open(ex.PDF_PATH)
sections = {sid: [] for sid in ex.SECTION_IDS}
state = {"section": None, "qnum": 1, "cur": None, "keymode": False, "numoffset": 0, "flagged_off": None}
for pno in range(0, 55):
    rows, ticks = ex.get_page_rows(doc[pno])
    ex.feed(rows, state, pno + 1, sections, None)

print("after p55:", state["section"], "expected", state["qnum"], "keymode", state["keymode"],
      "offset", state["numoffset"])
q = state["cur"]
if q:
    print("cur:", q.number, "options:", None if q.options is None else len(q.options), "open_opt", q.open_opt)

rows, ticks = ex.get_page_rows(doc[55])
for i, (y, minx, text) in enumerate(rows):
    t, _ = ex.normalize_pua(text)
    col = 0 if minx < 306 else 1
    before = (state["qnum"], state["keymode"], state["numoffset"])
    ex.feed_row(t, state, 56, y, col, sections, None)
    q = state["cur"]
    print(f"row{i:3d} y={y:6.1f} c{col} {before} -> q={state['qnum']} km={state['keymode']} "
          f"cur={q.number if q else None}({None if not q or not q.options else len(q.options)},{q.open_opt if q else ''}) "
          f"| {t.strip()[:60]!r}")
