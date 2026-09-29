"""Replay parse state up to line 7267 and test the '59.' row manually."""
import sys
sys.path.insert(0, r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts")
import extract_questions_txt as ex

lines = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\T.E.T.txt", encoding="utf-8").read().split("\n")

# replicate parse() up to the telugu 57 end by slicing: find telugu start & 57 row
tstart = next(i for i, l in enumerate(lines) if "SUBJECT – TELUGU" in l)
row59 = 7267 - 1  # 0-based index of the '59.' line (from earlier dump)

lines2 = lines[:row59]
sections, ticks = ex.parse(lines2, None)
tel = sections["telugu"]
print("parsed so far:", len(tel), "last:", [(q.number, q.printed) for q in tel[-3:]])

# now replay the exact preprocessing for line 7267
raw = lines[row59]
line = ex.normalize(raw).strip()
print("line:", line[:60])
print("is_title:", ex.is_title(line))
print("tick:", ex.TICK_RE.match(line), "group:", ex.TICK_GROUP_RE.match(line))
print("keyhdr:", [rx.match(line) for rx in ex.KEY_HEADER_RES])

state_probe = {"qnum": len(tel) + 1, "numoffset": 0}
print("try_qstart qnum:", ex.try_qstart(line, state_probe))
print("repeated:", ex.repeated_start(line, state_probe))
