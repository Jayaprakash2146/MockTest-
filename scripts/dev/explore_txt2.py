"""Find section starts (question numbered 1) and sample each section's format."""
import sys, re, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

text = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read()
lines = text.split("\n")

print("--- candidates for question '1.' starts ---")
for i, line in enumerate(lines):
    t = line.strip()
    if re.match(r"^1\s*[\uf02e.]\s*\S", t) and not re.match(r"^1\s*[\uf02e.]\s*\d", t):
        ctx = " | ".join(x.strip()[:45] for x in lines[max(0, i - 2):i + 2])
        print(f"{i:6d}: {ctx[:170]}")
        print()

print("--- garble check (Latin-extended present) ---")
garble = re.compile(r"[\u00C0-\u00FF\u0100-\u024F\u0370-\u03FF\u0400-\u04FF]")
hits = [i for i, l in enumerate(lines) if garble.search(l)]
print(f"lines with garble chars: {len(hits)}; first at {hits[0] if hits else None}, last at {hits[-1] if hits else None}")
if hits:
    print("sample:", repr(lines[hits[0]].strip()[:90]))
