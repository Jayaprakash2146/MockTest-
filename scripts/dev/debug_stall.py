"""Show parsed counts + raw rows following each section's stall point."""
import sys, re
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex
import pymupdf
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

doc = pymupdf.open(ex.PDF_PATH)

# find page of last parsed question per section
import json
data = json.loads((ex.OUT_DIR / "cdp.json").read_text(encoding="utf-8"))
last = {sid: json.loads((ex.OUT_DIR / f"{sid}.json").read_text(encoding="utf-8"))["questions"][-1]
        for sid in ex.SECTION_IDS if sid in ("cdp", "telugu", "english")}
for sid, q in last.items():
    print(f"{sid}: last parsed #{q['number']} on page {q['sourcePage']}")
    page = doc[q["sourcePage"] - 1]
    rows, ticks = ex.get_page_rows(page)
    shown = 0
    for y, minx, text in rows:
        t, _ = ex.normalize_pua(text)
        if ex.is_header(t) or ex.TICK_RE.match(t.strip()) or ex.KEYROW_RE.match(t.strip()):
            continue
        # print rows mentioning the stall numbers
        if re.search(rf"\b({q['number']}|{q['number']+1}|{q['number']+2})\s*[\uf02e.]", t):
            print(f"   p{q['sourcePage']} y={y:6.1f}: {t[:110]!r}")
            shown += 1
            if shown > 4:
                break
