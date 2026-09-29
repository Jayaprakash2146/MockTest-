"""Check what rendered in the welcome page DOM dump."""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
h = open(r"C:\Users\jayap\AppData\Local\Temp\kilo\dom_welcome.html", encoding="utf-8", errors="replace").read()
print("total len:", len(h))
i = h.find('id="app"')
print("app context:", h[max(0, i - 50):i + 500] if i != -1 else "app div NOT FOUND")
