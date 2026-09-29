"""Inspect flagged maths/physics items from the TXT parse."""
import json, sys
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

f = json.load(open(r"C:\Users\jayap\OneDrive\Desktop\mock test\data\flagged.json", encoding="utf-8"))
for sid in ("maths", "physics"):
    items = [x for x in f if x["id"].startswith(sid)]
    print("==", sid, "flagged:", len(items))
    for x in items[:6]:
        print(" ", x["id"], x["reasons"])
