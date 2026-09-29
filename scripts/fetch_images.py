"""Download + decrypt the img/*.bin blobs for image-based questions."""
import json, os, sys, io, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = r"C:\Users\jayap\OneDrive\Desktop\mock test"
OUT = os.path.join(ROOT, "img")
os.makedirs(OUT, exist_ok=True)


def a3(buf: bytes) -> bytes:
    x = 0xF6989E9D
    out = bytearray(len(buf))
    for i, b in enumerate(buf):
        x ^= (x << 13) & 0xFFFFFFFF
        x &= 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
        x &= 0xFFFFFFFF
        out[i] = b ^ (x & 255)
    return bytes(out)


wanted = {}
for sid in ("cdp", "telugu", "english", "maths", "physics", "biology"):
    d = json.load(open(rf"{ROOT}\scripts\pyqs\{sid}.json", encoding="utf-8"))
    for q in d["questions"]:
        if q[4]:
            for im in q[4]:
                if isinstance(im[0], str):
                    wanted.setdefault(im[0], (im[1], im[2]))
print("unique images:", len(wanted))

fail = 0
for i, (path, (w, h)) in enumerate(sorted(wanted.items()), 1):
    dest = os.path.join(OUT, os.path.basename(path).replace(".bin", ".png"))
    if os.path.exists(dest) and os.path.getsize(dest) > 100:
        continue
    url = "https://tet.pyqs.in/" + path
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        blob = r.read()
    dec = a3(blob)
    ok = dec[:8] == b"\x89PNG\r\n\x1a\n"
    if not ok:
        fail += 1
        print("NOT PNG:", path, dec[:8])
        continue
    with open(dest, "wb") as f:
        f.write(dec)
    if i % 25 == 0:
        print(f"  {i}/{len(wanted)}")
print("done; failures:", fail)
