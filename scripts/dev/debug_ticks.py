"""Compare tick-vs-key agreement under positional vs printed-number indexing."""
import sys, json
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions as ex
import pymupdf
sys.stdout = __import__("io").TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

keys = json.loads(ex.KEYS_PATH.read_text(encoding="utf-8"))["sections"]
doc = pymupdf.open(ex.PDF_PATH)
sections = {sid: [] for sid in ex.SECTION_IDS}
state = {"section": None, "qnum": 1, "cur": None, "keymode": False, "numoffset": 0, "flagged_off": None}
all_ticks = []
for pno in range(len(doc)):
    rows, ticks = ex.get_page_rows(doc[pno])
    all_ticks.extend((pno + 1, t[0], t[1], t[2]) for t in ticks)
    ex.feed(rows, state, pno + 1, sections, None)

from collections import defaultdict
import bisect
qindex = defaultdict(list)
for sid in ex.SECTION_IDS:
    for q in sections[sid]:
        qindex[(q.page, q.col)].append(q)
for k in qindex:
    qindex[k].sort(key=lambda q: q.y)

stats = defaultdict(lambda: [0, 0, 0])  # sid -> [agree_pos, agree_print, total_attached]
for pno, ty, tx, val in all_ticks:
    col = 0 if tx < 306 else 1
    cands = qindex.get((pno, col))
    if not cands:
        continue
    ys = [q.y for q in cands]
    i = bisect.bisect_right(ys, ty + 8) - 1
    if i >= 0:
        q = cands[i]
        if q.tick is None:
            q.tick = val
for sid in ex.SECTION_IDS:
    for q in sections[sid]:
        if q.tick is None:
            continue
        s = stats[sid]
        s[2] += 1
        ka = keys[sid]["answers"].get(str(q.number))
        kb = keys[sid]["answers"].get(str(q.printed))
        if ka == q.tick:
            s[0] += 1
        if kb == q.tick:
            s[1] += 1

total = [0, 0, 0]
for sid in ex.SECTION_IDS:
    s = stats[sid]
    total[0] += s[0]; total[1] += s[1]; total[2] += s[2]
    print(f"{sid:8s} attached={s[2]:4d}  agree-positional={s[0]:4d}  agree-printed={s[1]:4d}")
print(f"TOTAL    attached={total[2]:4d}  agree-positional={total[0]:4d}  agree-printed={total[1]:4d}")
