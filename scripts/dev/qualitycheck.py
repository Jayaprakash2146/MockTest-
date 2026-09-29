"""Quality check: previously broken items + flag reasons."""
import json, sys
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

base = r"C:\Users\jayap\OneDrive\Desktop\mock test\data"

def show(sid, num):
    d = json.load(open(rf"{base}\{sid}.json", encoding="utf-8"))
    q = next((x for x in d["questions"] if x["number"] == num), None)
    if not q:
        print(f"--- {sid} #{num}: NOT FOUND")
        return
    print(f"--- {sid} #{num} p{q['sourcePage']} ans={q['answer']} review={q['needsReview']}")
    print("   Q:", q["question"]["en"])
    if q["question"]["te"]:
        print("   Q(te):", q["question"]["te"][:60])
    for i, o in enumerate(q["options"], 1):
        t = o["en"] or ""
        t2 = (" | " + o["te"][:30]) if o["te"] else ""
        print(f"   ({i}) {t[:70]}{t2}")

show("cdp", 155)
show("cdp", 253)
show("cdp", 630)
show("maths", 3)
show("maths", 4)
show("english", 311)
show("english", 434)
show("english", 715)
show("physics", 3)
show("biology", 230)

f = json.load(open(rf"{base}\flagged.json", encoding="utf-8"))
from collections import Counter
c = Counter()
for x in f:
    for r in x["reasons"]:
        c[r[:52]] += 1
print("\n--- flag reasons ---")
for r, n in c.most_common(8):
    print(n, "|", r)
