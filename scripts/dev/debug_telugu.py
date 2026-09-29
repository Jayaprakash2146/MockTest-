"""Raw regions: telugu Q57-60 and physics Q1-4 in T.E.T.txt."""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
lines = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read().split("\n")

idx = next(i for i, l in enumerate(lines) if re.match(r"^\s*57\s*[\uf02e.]", l.strip()))
print("---- telugu 57 region ----")
for i in range(idx - 2, idx + 60):
    print(f"{i:6d}: {lines[i].strip()[:80]!r}")
