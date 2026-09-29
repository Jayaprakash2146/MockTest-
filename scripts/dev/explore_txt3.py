"""Inspect transition regions in T.E.T.txt."""
import sys, re, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

text = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read()
lines = text.split("\n")

def show(a, b, label):
    print("=" * 15, label, f"(lines {a}-{b})", "=" * 15)
    for i in range(a, min(b, len(lines))):
        print(f"{i:6d}: {lines[i].strip()[:95]!r}")

# cdp tail -> telugu start: find question 630 line
for i, l in enumerate(lines):
    if re.match(r"^\s*630\s*[\uf02e.]", l.strip()):
        show(i - 3, i + 45, "cdp 630 region")
        break

# telugu -> english: find first english-looking question 1 after telugu
# english Q1 is "Read the passage..."? print around english start: search '618' silent? no.
# find maths header line and english region boundaries
for i, l in enumerate(lines):
    if "SUBJECT – 2A MATHEMATICS" in l:
        show(i - 40, i + 25, "maths header region")
        break

show(17455, 17500, "english tail (trees Q)")
