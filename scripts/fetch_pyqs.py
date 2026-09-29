"""Fetch tet.pyqs.in subject data files, decode (_a2 char shift), and save JSON."""
import json, urllib.request, io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

D = json.load(open(r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts\pyqs_bank.json", encoding="utf-8"))
WANT = {"cdp", "telugu", "english", "maths", "physics", "biology"}
OUT = r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts\pyqs"
os.makedirs(OUT, exist_ok=True)


def a2(t):
    out = []
    for ch in t:
        c = ord(ch)
        if 32 <= c < 128:
            c = 32 + (c - 32 + 96 - 53) % 96
        elif 0x0C00 <= c < 0x0C80:
            c = 0x0C00 + (c - 0x0C00 + 128 - 76) % 128
        out.append(chr(c))
    return "".join(out)


for s in D["subjects"]:
    if s["id"] not in WANT:
        continue
    url = "https://tet.pyqs.in/" + s["file"]
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        txt = r.read().decode("utf-8")
    dec = a2(txt)
    try:
        qs = json.loads(dec)
    except Exception as e:
        print(s["id"], "DECODE FAIL", e, dec[:80])
        continue
    ok = len(qs) == s["count"] and len(s["key"]) >= s["count"]
    print(f"{s['id']:8s} {len(qs):4d} questions (site says {s['count']}), key len {len(s['key'])} -> {'OK' if ok else 'MISMATCH'}")
    with open(rf"{OUT}\{s['id']}.json", "w", encoding="utf-8") as f:
        json.dump({"count": s["count"], "key": s["key"], "questions": qs}, f, ensure_ascii=False)
    if s["id"] == "maths":
        print("  q1:", json.dumps(qs[0], ensure_ascii=False)[:400])
