"""Find script/data URLs in the saved SPA HTML."""
import re, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
html = open(r"C:\Users\jayap\.local\share\kilo\tool-output\tool_0eda908b5001hDukqylbCr20u7",
            encoding="utf-8", errors="replace").read()
for m in re.finditer(r'<script[^>]*src="([^"]+)"', html):
    print("script:", m.group(1))
for m in re.finditer(r'<link[^>]*href="([^"]+)"', html):
    print("link:", m.group(1))
for m in re.finditer(r'fetch\(\s*"([^"\']+)', html):
    print("fetch:", m.group(1))
for m in re.finditer(r'["\']([\w./-]+\.(?:json|js))["\']', html):
    print("ref:", m.group(1))
print("len", len(html))
