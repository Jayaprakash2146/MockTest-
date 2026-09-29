"""Post-parse inspection of maths/physics question stream."""
import sys, json
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions_txt as ex
# module already re-wrapped sys.stdout for utf-8; use it directly

lines = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read().split("\n")
sections, ticks = ex.parse(lines, None)
for sid in ("maths", "physics"):
    print("==", sid)
    for q in sections[sid][:10]:
        print(f"  #{q.number} printed={q.printed} en={' '.join(q.en)[:60]!r} opts={None if not q.options else len(q.options)}")
