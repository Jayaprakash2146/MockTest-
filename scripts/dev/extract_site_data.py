"""Extract tet-data + tet-app from the saved HTML and find the decoder."""
import re, io, sys, base64
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
html = open(r"C:\Users\jayap\.local\share\kilo\tool-output\tool_0eda908b5001hDukqylbCr20u7",
            encoding="utf-8", errors="replace").read()

m = re.search(r'<script id="tet-data" type="text/plain">(.*?)</script>', html, re.S)
data = m.group(1).strip()
open(r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts\tet_data.b64", "w").write(data)
print("tet-data chars:", len(data), "sample:", data[:60])

m2 = re.search(r'<script id="tet-app">(.*?)</script>', html, re.S)
app = m2.group(1)
open(r"C:\Users\jayap\OneDrive\Desktop\mock test\scripts\tet_app.js", "w", encoding="utf-8").write(app)
print("tet-app chars:", len(app))

# find where tet-data is read and how it's decoded
for kw in ["tet-data", "atob", "fromCharCode", "charCodeAt", "inflate", "pako", "DecompressionStream", "toString(36)", "JSON.parse"]:
    hits = [mm.start() for mm in re.finditer(re.escape(kw), app)]
    print(kw, len(hits), hits[:6])
