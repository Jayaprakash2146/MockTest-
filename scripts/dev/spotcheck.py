"""Spot-check random parsed questions per section."""
import json, random, sys
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
from pathlib import Path

base = Path(r"C:\Users\jayap\OneDrive\Desktop\mock test\public\data")
random.seed(7)
for sid in ("cdp", "english", "maths", "physics", "biology"):
    d = json.loads((base / f"{sid}.json").read_text(encoding="utf-8"))
    qs = random.sample([q for q in d["questions"] if q["question"]["en"]], 2)
    print("=" * 20, sid)
    for q in qs:
        print(f"#{q['number']} p{q['sourcePage']} ans={q['answer']}: {q['question']['en'][:90]}")
        for i, o in enumerate(q["options"], 1):
            print(f"   ({i}) {(o['en'] or '')[:45]}")
