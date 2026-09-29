"""Inspect english early questions + key row for 311."""
import sys, io, re, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

lines = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read().split("\n")
for i, l in enumerate(lines[17496:17700], start=17496):
    if re.search(r"\b31[01]\b", l):
        print(i, repr(l.strip()[:70]))

d = json.load(open(r"C:\Users\jayap\OneDrive\Desktop\mock test\data\english.json", encoding="utf-8"))
for q in d["questions"][:8]:
    print(f"#{q['number']} ans={q['answer']} review={q['needsReview']} :: {str(q['question']['en'])[:70]!r}")
    for i2, o in enumerate(q["options"], 1):
        print(f"   ({i2}) {str(o['en'])[:60]!r}")
