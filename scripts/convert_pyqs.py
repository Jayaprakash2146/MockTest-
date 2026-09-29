"""
Convert the tet.pyqs.in question banks (scripts/pyqs/<sid>.json, already
decoded by fetch_pyqs.py) into the mock-test site's data/*.json format.

The site stores questions as:
    [number, stemHTML, [optionHTML x4], unused, images, layout]
with answers in the per-subject `key` string (digit per question).
Run:  python scripts/convert_pyqs.py
"""

import html as htmllib
import json
import re
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
PYQS = ROOT / "scripts" / "pyqs"
KEYS = ROOT / "answer_keys.json"
OUT = ROOT / "data"

SECTION_ORDER = ["cdp", "telugu", "english", "maths", "physics", "biology"]
NAMES = {"cdp": "Child Development & Pedagogy", "telugu": "Telugu", "english": "English",
         "maths": "Mathematics", "physics": "Physical Science", "biology": "Biology"}
TE = re.compile(r"[\u0C00-\u0C7F]")


def strip_tags(fragment: str) -> str:
    """HTML fragment -> plain text, keeping frac/sub/sup readable."""
    s = fragment
    s = re.sub(r"<span class=\"frac\"><span>(.*?)</span><span>(.*?)</span></span>",
               lambda m: f"{m.group(1)}/{m.group(2)}", s, flags=re.S)
    s = re.sub(r"<sup>(.*?)</sup>", r"^\1", s, flags=re.S)
    s = re.sub(r"<sub>(.*?)</sub>", r"_\1", s, flags=S_FLAG)
    s = re.sub(r"</p>\s*<p[^>]*>", "\n", s)
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"</t[dh]>\s*<t[dh][^>]*>", " \u2014 ", s)
    s = re.sub(r"</tr>\s*<tr[^>]*>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = htmllib.unescape(s)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in s.split("\n")]
    return "\n".join([ln for ln in lines if ln]).strip()


S_FLAG = re.S


def split_lang(fragment: str):
    """Split an HTML fragment into (en, te) plain text."""
    en_parts, te_parts = [], []
    # walk top-level en/te spans and paragraphs
    pos = 0
    plain_runs = []
    for m in re.finditer(r"<(p|span) class=\"(en|te|it)[^\"]*\"[^>]*>(.*?)</\1>", fragment, re.S):
        if m.start() > pos:
            plain_runs.append(fragment[pos:m.start()])
        cls, inner = m.group(2), m.group(3)
        text = strip_tags(inner)
        if not text:
            pos = m.end()
            continue
        if cls == "en":
            en_parts.append(text)
        elif cls == "te":
            te_parts.append(text)
        else:  # 'it' styled paragraph -> route by script
            (te_parts if TE.search(text) else en_parts).append(text)
        pos = m.end()
    if pos < len(fragment):
        plain_runs.append(fragment[pos:])
    # leftover content outside en/te spans -> route by script
    for run in plain_runs:
        text = strip_tags(run)
        if not text:
            continue
        (te_parts if TE.search(text) else en_parts).append(text)
    return "\n".join(en_parts).strip() or None, "\n".join(te_parts).strip() or None


def main():
    keys = json.loads(KEYS.read_text(encoding="utf-8"))["sections"]
    index = {"_note": ("Question text and answers sourced from tet.pyqs.in "
                       "(verified against answer_keys.json)."), "sections": {}}
    report, flagged = ["VALIDATION REPORT (tet.pyqs.in import)", "=" * 60], []
    total_mismatch = 0

    for sid in SECTION_ORDER:
        src = json.loads((PYQS / f"{sid}.json").read_text(encoding="utf-8"))
        site_key = src["key"]
        old = OUT / f"{sid}.json"
        old_pages = {}
        if old.exists():
            for q in json.loads(old.read_text(encoding="utf-8"))["questions"]:
                old_pages[q["number"]] = q.get("sourcePage")

        items, sec_flag = [], 0
        mismatch = 0
        for q in src["questions"]:
            num = q[0]
            images = q[4] or []
            image = None
            image_w = image_h = None
            if images:
                p = images[0][0]
                if isinstance(p, str):
                    image = "img/" + p.split("/")[-1].replace(".bin", ".png")
                    image_w, image_h = images[0][1], images[0][2]
            en, te = split_lang(q[1])
            opts = []
            for ohtml in q[2]:
                oen, ote = split_lang(ohtml)
                opts.append({"en": oen, "te": ote})
            while len(opts) < 4:
                opts.append({"en": None, "te": None})
            opts = opts[:4]
            ans = int(site_key[num - 1])
            official = keys[sid]["answers"].get(str(num))
            reasons = []
            if official is not None and official != ans:
                mismatch += 1
                reasons.append(f"tet.pyqs.in key says {ans} but answer_keys.json says {official}")
            if en is None and te is None and not image:
                reasons.append("empty question text")
            if not image:
                for i, o in enumerate(opts, 1):
                    if o["en"] is None and o["te"] is None:
                        reasons.append(f"option {i} empty")
            item = {
                "id": f"{sid}-{num:04d}", "section": sid, "number": num,
                "question": {"en": en, "te": te}, "options": opts, "answer": ans,
                "image": image, "imageW": image_w, "imageH": image_h,
                "sourcePage": old_pages.get(num), "needsReview": bool(reasons),
            }
            if reasons:
                sec_flag += 1
                flagged.append({"id": item["id"], "page": item["sourcePage"], "reasons": reasons})
            items.append(item)

        total_mismatch += mismatch
        (OUT / f"{sid}.json").write_text(
            json.dumps({"section": sid, "name": keys[sid]["name"], "count": len(items),
                        "questions": items}, ensure_ascii=False, indent=1), encoding="utf-8")
        index["sections"][sid] = {"name": keys[sid]["name"], "count": len(items)}
        report.append(f"{sid:8s}: imported {len(items):4d} | answer mismatches vs answer_keys.json: {mismatch} | flagged {sec_flag}")

    index["_note"] = ("Question text sourced from tet.pyqs.in (bilingual, includes the Telugu "
                      "subject in Telugu). Cross-checked against answer_keys.json.")
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "flagged.json").write_text(json.dumps(flagged, ensure_ascii=False, indent=1), encoding="utf-8")
    (ROOT / "scripts" / "reports").mkdir(exist_ok=True)
    (ROOT / "scripts" / "reports" / "flagged.json").write_text(json.dumps(flagged, ensure_ascii=False, indent=1), encoding="utf-8")
    (ROOT / "scripts" / "reports" / "validation.txt").write_text("\n".join(report), encoding="utf-8")
    report.append(f"total answer mismatches: {total_mismatch}")
    print("\n".join(report))


if __name__ == "__main__":
    main()
