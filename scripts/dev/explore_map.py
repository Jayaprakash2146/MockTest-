"""Map the document: section headers, key pages, tick digit blocks."""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pymupdf

PDF = r"C:\Users\jayap\OneDrive\Desktop\mock test\ALL 2A MATHS PHYS IN ONE PDF STU PEDAKURAPADU.pdf"
doc = pymupdf.open(PDF)

print("---- Section headers / key tables per page ----")
for pno in range(len(doc)):
    page = doc[pno - 1]
    text = page.get_text("text")
    head = []
    if re.search(r"SUBJECT\s*[–-]\s*2A\s*[–-]", text):
        m = re.search(r"SUBJECT\s*[–-]\s*2A\s*[–-]\s*([A-Z &]+)", text)
        head.append("TITLE:" + (m.group(1).strip() if m else "?"))
    if re.search(r"TET\s*[-–]?\s*PRACTICE", text, re.I):
        m = re.search(r"(TET\s*[-–]?\s*PRACTICE[^\n]{0,60})", text, re.I)
        head.append("HDR:" + " ".join(m.group(1).split()))
    if re.search(r"SL\.?\s*NO.{0,10}ANS", text):
        head.append("KEYTABLE")
    if re.search(r"SUBJECT\s*:\s*[A-Z ]+PAPER", text):
        m = re.search(r"SUBJECT\s*:\s*([A-Z ]+)\s*PAPER", text)
        head.append("KEYHDR:" + m.group(1).strip())
    if head:
        print(f"p{pno:3d}: " + " | ".join(head))

print("\n---- Digit-only blocks on page 1 ----")
page = doc[0]
for b in page.get_text("blocks"):
    x0, y0, x1, y1, text, bno, btype = b
    t = text.strip()
    if t and re.fullmatch(r"[\d\s]+", t):
        print(f"  [{x0:6.1f},{y0:6.1f} -> {x1:6.1f},{y1:6.1f}] {t!r}")
