"""Decode tet.pyqs.in's embedded question bank (base64 + xorshift32 XOR)."""
import base64, json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

b64 = open(r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts\tet_data.b64").read()
bin_ = base64.b64decode("".join(b64.split()))
x = 0xA3BC126B
out = bytearray()
for b in bin_:
    x ^= (x << 13) & 0xFFFFFFFF
    x &= 0xFFFFFFFF
    x ^= x >> 17
    x ^= (x << 5) & 0xFFFFFFFF
    x &= 0xFFFFFFFF
    out.append(b ^ (x & 255))
raw = out.decode("utf-8")
D = json.loads(raw)
print("top-level keys:", list(D.keys()))
open(r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts\pyqs_bank.json", "w", encoding="utf-8").write(raw)

subs = D.get("subjects", [])
for s in subs:
    qs = s.get("questions", [])
    print(f"subject {s.get('id')!r} name={s.get('name')!r} key={s.get('key')!r} count={len(qs)}")
    if qs:
        print("  sample:", json.dumps(qs[0], ensure_ascii=False)[:300])
print("papers:", D.get("papers"))
