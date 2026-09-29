"""Explore T.E.T.txt structure: section markers, question formats."""
import sys, re, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

text = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read()

print("--- lines with SUBJECT/2A/PAPER/SL.NO/ANS ---")
for i, line in enumerate(text.split("\n")):
    t = line.strip()
    if re.search(r"SUBJECT|2A|PAPER|SL\.?\s*NO|ANS|TET\s*[-–]?\s*PRACTICE|T\.E\.T|QUESTION BANK|PRACTICE", t, re.I):
        if t and len(t) < 120:
            print(f"{i:6d}: {t!r}")
