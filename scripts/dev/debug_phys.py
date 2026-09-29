"""Raw physics opening lines."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
lines = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read().split("\n")
start = next(i for i, l in enumerate(lines) if "The speed of a car" in l)
for i in range(start - 8, start + 40):
    print(f"{i:6d}: {lines[i].strip()[:88]!r}")
