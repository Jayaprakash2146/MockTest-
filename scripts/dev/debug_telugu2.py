"""Trace telugu parse results."""
import sys
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions_txt as ex

lines = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read().split("\n")
sections, ticks = ex.parse(lines, None)
tel = sections["telugu"]
print("parsed:", len(tel))
for q in tel[52:57]:
    te = " ".join(q.te)
    print(f"#{q.number} printed={q.printed} te={te[:60]!r} opts={None if not q.options else len(q.options)}")
