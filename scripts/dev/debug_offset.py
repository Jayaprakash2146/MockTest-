"""Track cdp offset transitions per page."""
import sys
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex
import pymupdf
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

doc = pymupdf.open(ex.PDF_PATH)
sections = {sid: [] for sid in ex.SECTION_IDS}
state = {"section": None, "qnum": 1, "cur": None, "keymode": False,
         "numoffset": 0, "flagged_off": None}
prev = 0
for pno in range(0, 56):
    rows, ticks = ex.get_page_rows(doc[pno])
    ex.feed(rows, state, pno + 1, sections, None)
    if state["numoffset"] != prev:
        print(f"page {pno+1}: offset {prev} -> {state['numoffset']}  (expected now {state['qnum']})")
        prev = state["numoffset"]
print("final expected:", state["qnum"])
