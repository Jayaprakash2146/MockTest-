"""Trace physics parse."""
import sys
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions_txt as ex

lines = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read().split("\n")
start = next(i for i, l in enumerate(lines) if "The speed of a car" in l)
sections, _ = ex.parse(lines, None, trace_from=start - 7, trace_to=start + 30)
ph = sections["physics"]
print("parsed:", len(ph))
for q in ph[:8]:
    en = " ".join(q.en)
    print(f"#{q.number} printed={q.printed} en={en[:60]!r} opts={None if not q.options else len(q.options)}")
