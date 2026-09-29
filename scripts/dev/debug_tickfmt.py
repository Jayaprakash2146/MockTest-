"""Find tick-like small line objects on english/cdp pages."""
import sys, re
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex
import pymupdf
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

doc = pymupdf.open(ex.PDF_PATH)
for pno in (127, 2):
    print("==== page", pno)
    d = doc[pno - 1].get_text("dict")
    n = 0
    for block in d["blocks"]:
        if block.get("type") != 0:
            continue
        for ln in block["lines"]:
            spans = sorted(ln.get("spans", []), key=lambda s: s["bbox"][0])
            text = "".join(s["text"] for s in spans).strip()
            x0, y0 = ln["bbox"][0], ln["bbox"][1]
            if text and len(text) <= 6 and re.fullmatch(r"[\u0013\s1-4]*", text):
                print(f"  y={y0:6.1f} x={x0:6.1f} {text!r}")
                n += 1
        if n > 12:
            break
